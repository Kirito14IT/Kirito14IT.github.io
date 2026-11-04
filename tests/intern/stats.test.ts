import { test } from "node:test";
import assert from "node:assert/strict";
import { companySummaries, dashboardStats, followUps, recentEvents, upcomingDeadlines } from "../../src/intern/core/stats.ts";
import { defaultContactProgress, defaultPostingProgress, emptyProgressFile, normalizeContact, normalizePosting } from "../../src/intern/core/schema.ts";
import type { Contact, Posting, ProgressFile } from "../../src/intern/core/types.ts";

const TODAY = "2026-11-05";

const posting = (id: string, company: string, closesAt: string | null = null) =>
  normalizePosting({ id, company, title: `${company} 岗位 ${id}`, dates: { closesAt } }, []) as Posting;

const postings = [posting("P1", "甲公司"), posting("P2", "甲公司"), posting("P3", "乙公司"), posting("P4", "乙公司", "2026-11-06"), posting("P5", "丙公司", "2026-11-10")];

const contacts = ["C1", "C2", "C3"].map((id) => normalizeContact({ id, name: `联系人${id}`, email: `${id.toLowerCase()}@example.com` }, []) as Contact);

const progress: ProgressFile = {
  ...emptyProgressFile(),
  postings: {
    P1: { ...defaultPostingProgress(), status: "applied", appliedAt: "2026-11-01" },
    P2: { ...defaultPostingProgress(), status: "interviewing" },
    P3: { ...defaultPostingProgress(), status: "offer" },
    P4: { ...defaultPostingProgress(), status: "rejected" },
    P5: { ...defaultPostingProgress(), followUpAt: "2026-11-04" }
  },
  contacts: {
    C1: { ...defaultContactProgress(), status: "sent", lastContactAt: "2026-10-27" },
    C2: { ...defaultContactProgress(), status: "replied", followUpAt: "2026-11-05" },
    C3: { ...defaultContactProgress(), status: "replied", lastContactAt: "2026-10-01" }
  },
  events: [
    { id: "e1", date: "2026-11-03", type: "applied", postingId: "P1", contactId: null, note: "", createdAt: "", updatedAt: "", deleted: false },
    { id: "e2", date: "2026-11-05", type: "note", postingId: "P1", contactId: null, note: "", createdAt: "", updatedAt: "", deleted: true },
    { id: "e3", date: "2026-11-04", type: "interview", postingId: "P2", contactId: null, note: "", createdAt: "", updatedAt: "", deleted: false }
  ]
};

test("dashboardStats counts submissions, live processes, offers, and due work", () => {
  const stats = dashboardStats(postings, progress, contacts, TODAY);
  assert.equal(stats.total, 5);
  assert.equal(stats.submitted, 4);
  assert.equal(stats.inFlight, 2);
  assert.equal(stats.offers, 1);
  assert.equal(stats.closingSoon, 1);
  assert.equal(stats.followUpsDue, 3);
  assert.equal(stats.statusCounts.todo, 1);
  assert.equal(stats.statusCounts.interviewing, 1);
});

test("upcomingDeadlines lists open postings closing within the window", () => {
  assert.deepEqual(upcomingDeadlines(postings, progress, TODAY, 30).map((item) => item.posting.id), ["P5"]);
});

test("followUps collects due follow-ups and emails left unanswered", () => {
  const items = followUps(postings, progress, contacts, TODAY);
  assert.deepEqual(items.map((item) => [item.kind, item.id, item.due]), [
    ["contact", "C1", "2026-11-03"],
    ["posting", "P5", "2026-11-04"],
    ["contact", "C2", "2026-11-05"]
  ]);
  assert.match(items[0].reason, /9 天未回复/);
});

test("companySummaries flags companies with two live applications", () => {
  const summaries = companySummaries(postings, progress);
  assert.deepEqual(summaries[0], { company: "甲公司", total: 2, submitted: 2, inFlight: 2, offers: 0, conflict: true });
  assert.equal(summaries.find((item) => item.company === "乙公司")?.offers, 1);
});

test("recentEvents skips tombstones and puts the newest first", () => {
  assert.deepEqual(recentEvents(progress, 10).map((event) => event.id), ["e3", "e1"]);
});
