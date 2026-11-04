import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyContactsFile,
  emptyPostingsFile,
  emptyProgressFile,
  normalizePosting,
  normalizePostingsFile,
  normalizeProgressFile,
  serializeFile,
  validateSnapshot
} from "../../src/intern/core/schema.ts";
import type { Snapshot } from "../../src/intern/core/types.ts";

test("normalizePosting fills defaults for a minimal record", () => {
  const warnings: string[] = [];
  const posting = normalizePosting({ id: "P1", company: "示例科技", title: "代码后训练实习生" }, warnings);
  assert.ok(posting);
  assert.equal(posting.recordType, "jd");
  assert.equal(posting.region, "cn");
  assert.deepEqual(posting.focus, []);
  assert.deepEqual(posting.dates, {
    publishedAt: null,
    opensAt: null,
    closesAt: null,
    rolling: false,
    startTerm: "",
    note: "",
    source: "",
    checkedAt: null
  });
  assert.equal(posting.priority, null);
  assert.equal(posting.archived, false);
  assert.deepEqual(posting.extra, {});
  assert.deepEqual(warnings, []);
});

test("normalizePosting rejects records without an id or title", () => {
  const warnings: string[] = [];
  assert.equal(normalizePosting({ company: "示例科技", title: "无编号" }, warnings), null);
  assert.equal(normalizePosting({ id: "P2", company: "示例科技" }, warnings), null);
  assert.equal(warnings.length, 2);
});

test("normalizePosting splits focus text on spaced slashes only", () => {
  const posting = normalizePosting({ id: "P3", company: "示例", title: "岗位", focus: "Coding Agent/代码 / 后训练/RL" }, []);
  assert.deepEqual(posting?.focus, ["Coding Agent/代码", "后训练/RL"]);
});

test("normalizePosting drops invalid dates with a warning", () => {
  const warnings: string[] = [];
  const posting = normalizePosting({ id: "P4", company: "示例", title: "岗位", dates: { closesAt: "2026-02-30", opensAt: "2026-11-01" } }, warnings);
  assert.equal(posting?.dates.closesAt, null);
  assert.equal(posting?.dates.opensAt, "2026-11-01");
  assert.equal(warnings.length, 1);
});

test("normalizePostingsFile refuses data written by a newer schema", () => {
  assert.throws(() => normalizePostingsFile({ schemaVersion: 99, postings: [] }), /版本/);
});

test("normalizeProgressFile resets unknown statuses and drops malformed events", () => {
  const { value, warnings } = normalizeProgressFile({
    schemaVersion: 1,
    postings: { P1: { status: "mystery", starred: true } },
    events: [
      { id: "e1", date: "2026-11-05", type: "applied", postingId: "P1" },
      { id: "", date: "2026-11-05", type: "note" },
      { id: "e3", date: "yesterday", type: "note" }
    ]
  });
  assert.equal(value.postings.P1.status, "todo");
  assert.equal(value.postings.P1.starred, true);
  assert.deepEqual(value.events.map((event) => event.id), ["e1"]);
  assert.equal(warnings.length, 3);
  assert.equal(value.settings.followUpDays, 7);
});

const snapshotWith = (overrides: Partial<Snapshot> = {}): Snapshot => ({
  postings: emptyPostingsFile(),
  contacts: emptyContactsFile(),
  progress: emptyProgressFile(),
  ...overrides
});

test("validateSnapshot reports duplicate ids and dangling contact references", () => {
  const first = normalizePosting({ id: "P1", company: "示例", title: "甲", contactIds: ["C9"] }, []);
  const second = normalizePosting({ id: "P1", company: "示例", title: "乙" }, []);
  assert.ok(first && second);
  const postings = { ...emptyPostingsFile(), postings: [first, second] };
  const { errors } = validateSnapshot(snapshotWith({ postings }));
  assert.ok(errors.some((error) => error.includes("P1") && error.includes("重复")));
  assert.ok(errors.some((error) => error.includes("C9")));
});

test("validateSnapshot accepts a consistent snapshot", () => {
  const posting = normalizePosting({ id: "P1", company: "示例", title: "甲" }, []);
  assert.ok(posting);
  const { errors } = validateSnapshot(snapshotWith({ postings: { ...emptyPostingsFile(), postings: [posting] } }));
  assert.deepEqual(errors, []);
});

test("serializeFile sorts progress maps and round-trips through normalization", () => {
  const { value } = normalizeProgressFile({
    schemaVersion: 1,
    updatedAt: "2026-11-05T00:00:00.000Z",
    postings: { S2: { status: "applied", appliedAt: "2026-11-05" }, A1: { status: "todo" } }
  });
  const text = serializeFile("progress", value);
  assert.ok(text.endsWith("\n"));
  assert.ok(text.indexOf('"A1"') < text.indexOf('"S2"'));
  assert.deepEqual(normalizeProgressFile(JSON.parse(text)).value, value);
});
