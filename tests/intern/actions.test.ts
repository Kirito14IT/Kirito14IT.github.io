import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addEvent,
  advanceTo,
  createManualPosting,
  deleteEvent,
  logEvent,
  nextPostingId,
  nextStatus,
  recordEmailSent,
  setCompanyNote,
  setContactStatus,
  setPostingStatus,
  toggleStar,
  updateContactProgress,
  updatePostingFacts,
  updatePostingProgress
} from "../../src/intern/core/actions.ts";
import { defaultPostingProgress, emptyPostingsFile, emptyProgressFile, normalizePosting } from "../../src/intern/core/schema.ts";
import type { Posting } from "../../src/intern/core/types.ts";

const NOW = "2026-11-05T08:00:00.000Z";
const TODAY = "2026-11-05";

const context = () => {
  let sequence = 0;
  return { today: TODAY, now: NOW, newId: () => `E${(sequence += 1)}` };
};

test("setPostingStatus to applied fills the applied date and logs an event", () => {
  const progress = emptyProgressFile();
  assert.equal(setPostingStatus(progress, "P1", "applied", context()), true);
  assert.equal(progress.postings.P1.status, "applied");
  assert.equal(progress.postings.P1.appliedAt, TODAY);
  assert.equal(progress.postings.P1.updatedAt, NOW);
  assert.deepEqual(
    progress.events.map((event) => [event.id, event.type, event.postingId, event.note, event.date]),
    [["E1", "applied", "P1", "未开始 → 已投递", TODAY]]
  );
});

test("setPostingStatus keeps an existing applied date and ignores no-op changes", () => {
  const progress = emptyProgressFile();
  progress.postings.P1 = { ...defaultPostingProgress(NOW), status: "applied", appliedAt: "2026-11-01" };
  const ctx = context();
  setPostingStatus(progress, "P1", "applied", ctx);
  assert.equal(progress.events.length, 0);
  setPostingStatus(progress, "P1", "interviewing", ctx);
  assert.equal(progress.postings.P1.appliedAt, "2026-11-01");
  assert.equal(progress.events[0].type, "interview");
});

test("advanceTo only ever moves a posting forward", () => {
  const progress = emptyProgressFile();
  const ctx = context();
  assert.equal(advanceTo(progress, "P1", "contacted", ctx), true);
  setPostingStatus(progress, "P1", "applied", ctx);
  assert.equal(advanceTo(progress, "P1", "contacted", ctx), false);
  assert.equal(progress.postings.P1.status, "applied");
});

test("nextStatus walks the pipeline and stops at the end", () => {
  assert.equal(nextStatus("todo"), "preparing");
  assert.equal(nextStatus("interviewing"), "offer");
  assert.equal(nextStatus("offer"), null);
  assert.equal(nextStatus("rejected"), null);
});

test("toggleStar flips the flag on a fresh entry", () => {
  const progress = emptyProgressFile();
  assert.equal(toggleStar(progress, "P1", NOW), true);
  assert.equal(toggleStar(progress, "P1", NOW), false);
});

test("deleteEvent leaves a tombstone instead of removing the event", () => {
  const progress = emptyProgressFile();
  const event = addEvent(progress, { date: TODAY, type: "note", postingId: "P1", contactId: null, note: "备注" }, context());
  assert.equal(deleteEvent(progress, event.id, NOW), true);
  assert.equal(progress.events[0].deleted, true);
  assert.equal(deleteEvent(progress, event.id, NOW), false);
});

test("recordEmailSent marks the contact and moves the posting to contacted", () => {
  const progress = emptyProgressFile();
  recordEmailSent(progress, "C1", context(), "P1");
  assert.equal(progress.contacts.C1.status, "sent");
  assert.equal(progress.contacts.C1.lastContactAt, TODAY);
  assert.equal(progress.postings.P1.status, "contacted");
  assert.deepEqual(progress.events.map((event) => event.type), ["email_sent", "status"]);
});

test("setContactStatus to replied logs the reply and stamps the contact date", () => {
  const progress = emptyProgressFile();
  assert.equal(setContactStatus(progress, "C1", "replied", context()), true);
  assert.equal(progress.contacts.C1.lastContactAt, TODAY);
  assert.equal(progress.events[0].type, "email_reply");
  assert.equal(setContactStatus(progress, "C1", "replied", context()), false);
});

test("updatePostingProgress writes the given fields and stamps the entry", () => {
  const progress = emptyProgressFile();
  updatePostingProgress(progress, "P1", { appliedRole: "代码后训练实习生（北京）", followUpAt: "2026-11-12" }, NOW);
  assert.equal(progress.postings.P1.appliedRole, "代码后训练实习生（北京）");
  assert.equal(progress.postings.P1.followUpAt, "2026-11-12");
  assert.equal(progress.postings.P1.status, "todo");
  assert.equal(progress.postings.P1.updatedAt, NOW);
});

test("updateContactProgress and setCompanyNote store their fields", () => {
  const progress = emptyProgressFile();
  updateContactProgress(progress, "C1", { notes: "周五再发一次" }, NOW);
  setCompanyNote(progress, "示例科技", "  同时最多投 2 个  ", NOW);
  assert.equal(progress.contacts.C1.notes, "周五再发一次");
  assert.deepEqual(progress.companies["示例科技"], { notes: "同时最多投 2 个", updatedAt: NOW });
});

test("logEvent records an email to a contact without a second event", () => {
  const progress = emptyProgressFile();
  logEvent(progress, { date: "2026-11-04", type: "email_sent", postingId: "P1", contactId: "C1", note: "附简历" }, context());
  assert.equal(progress.contacts.C1.status, "sent");
  assert.equal(progress.contacts.C1.lastContactAt, "2026-11-04");
  assert.deepEqual(progress.events.map((event) => [event.type, event.note]), [["email_sent", "附简历"]]);
});

test("logEvent moves a posting forward for process events but never back", () => {
  const progress = emptyProgressFile();
  const ctx = context();
  logEvent(progress, { date: "2026-11-03", type: "applied", postingId: "P1", contactId: null, note: "" }, ctx);
  assert.equal(progress.postings.P1.status, "applied");
  assert.equal(progress.postings.P1.appliedAt, "2026-11-03");
  logEvent(progress, { date: TODAY, type: "interview", postingId: "P1", contactId: null, note: "一面" }, ctx);
  assert.equal(progress.postings.P1.status, "interviewing");
  logEvent(progress, { date: TODAY, type: "assessment", postingId: "P1", contactId: null, note: "补测评" }, ctx);
  assert.equal(progress.postings.P1.status, "interviewing");
  logEvent(progress, { date: TODAY, type: "rejected", postingId: "P1", contactId: null, note: "" }, ctx);
  assert.equal(progress.postings.P1.status, "rejected");
  assert.equal(progress.events.length, 4);
});

const existing = (id: string) => normalizePosting({ id, company: "示例科技", title: `岗位 ${id}` }, []) as Posting;

test("nextPostingId skips ids that are already taken", () => {
  assert.equal(nextPostingId([existing("P20261105-001"), existing("P20261105-002")], TODAY), "P20261105-003");
  assert.equal(nextPostingId([], TODAY), "P20261105-001");
});

test("createManualPosting records where the posting came from", () => {
  const posting = createManualPosting({ company: "示例科技", title: "Agent 评测实习生", url: "https://jobs.example.com/9", focus: ["Agent/环境"] }, { id: "P20261105-001", now: NOW, today: TODAY });
  assert.equal(posting.id, "P20261105-001");
  assert.equal(posting.provenance.batch, "manual");
  assert.equal(posting.provenance.checkedAt, TODAY);
  assert.deepEqual(posting.focus, ["Agent/环境"]);
  assert.equal(posting.updatedAt, NOW);
});

test("updatePostingFacts merges nested fields and rejects invalid dates", () => {
  const file = { ...emptyPostingsFile(), postings: [existing("S1")] };
  updatePostingFacts(file, "S1", { location: "上海", dates: { closesAt: "2026-11-27" } }, NOW);
  assert.equal(file.postings[0].location, "上海");
  assert.equal(file.postings[0].dates.closesAt, "2026-11-27");
  assert.equal(file.postings[0].dates.rolling, false);
  assert.equal(file.postings[0].updatedAt, NOW);
  assert.throws(() => updatePostingFacts(file, "S1", { dates: { closesAt: "2026-13-01" } }, NOW), /日期/);
  assert.throws(() => updatePostingFacts(file, "S404", { location: "北京" }, NOW), /S404/);
});
