import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeList, mergeProgress, mergeRecord } from "../../src/intern/core/merge.ts";
import { defaultPostingProgress, emptyProgressFile, normalizePosting } from "../../src/intern/core/schema.ts";
import type { PostingProgress, ProgressFile, TrackerEvent } from "../../src/intern/core/types.ts";

const T0 = "2026-11-05T08:00:00.000Z";
const T1 = "2026-11-05T09:00:00.000Z";
const T2 = "2026-11-05T10:00:00.000Z";

const entry = (overrides: Partial<PostingProgress> = {}): PostingProgress => ({ ...defaultPostingProgress(T0), ...overrides });

test("mergeRecord takes the remote change when only the remote side edited", () => {
  const conflicts: string[] = [];
  const merged = mergeRecord(entry(), entry(), entry({ notes: "远端备注", updatedAt: T1 }), "P1", conflicts);
  assert.equal(merged?.notes, "远端备注");
  assert.deepEqual(conflicts, []);
});

test("mergeRecord combines edits to different fields", () => {
  const conflicts: string[] = [];
  const merged = mergeRecord(entry(), entry({ status: "applied", updatedAt: T1 }), entry({ notes: "远端备注", updatedAt: T2 }), "P1", conflicts);
  assert.equal(merged?.status, "applied");
  assert.equal(merged?.notes, "远端备注");
  assert.equal(merged?.updatedAt, T2);
  assert.deepEqual(conflicts, []);
});

test("mergeRecord resolves a same-field conflict in favour of the newer edit", () => {
  const conflicts: string[] = [];
  const merged = mergeRecord(entry(), entry({ status: "applied", updatedAt: T2 }), entry({ status: "preparing", updatedAt: T1 }), "P1", conflicts);
  assert.equal(merged?.status, "applied");
  assert.deepEqual(conflicts, ["P1.status"]);
});

test("mergeRecord merges nested objects field by field", () => {
  const base = normalizePosting({ id: "P1", company: "示例", title: "岗位", updatedAt: T0 }, []);
  assert.ok(base);
  const local = structuredClone(base);
  local.dates.closesAt = "2026-11-27";
  local.updatedAt = T1;
  const remote = structuredClone(base);
  remote.dates.note = "官网说明";
  remote.updatedAt = T2;
  const merged = mergeRecord(base, local, remote, "P1", []);
  assert.equal(merged?.dates.closesAt, "2026-11-27");
  assert.equal(merged?.dates.note, "官网说明");
});

test("mergeRecord keeps a record that exists on only one side", () => {
  assert.equal(mergeRecord(undefined, entry({ notes: "新" }), undefined, "P1", [])?.notes, "新");
  assert.equal(mergeRecord(undefined, undefined, entry({ notes: "远" }), "P1", [])?.notes, "远");
});

const event = (overrides: Partial<TrackerEvent> & { id: string }): TrackerEvent => ({
  date: "2026-11-05",
  type: "note",
  postingId: "P1",
  contactId: null,
  note: "",
  createdAt: T0,
  updatedAt: T0,
  deleted: false,
  ...overrides
});

test("mergeList keeps remote order and appends items added locally", () => {
  const base = [event({ id: "a" })];
  const local = [event({ id: "a" }), event({ id: "local" })];
  const remote = [event({ id: "remote" }), event({ id: "a" })];
  assert.deepEqual(mergeList(base, local, remote, "events", []).map((item) => item.id), ["remote", "a", "local"]);
});

test("mergeList keeps a tombstone written on either side", () => {
  const base = [event({ id: "a" })];
  const local = [event({ id: "a", deleted: true, updatedAt: T1 })];
  const remote = [event({ id: "a" })];
  assert.equal(mergeList(base, local, remote, "events", [])[0].deleted, true);
});

const progress = (overrides: Partial<ProgressFile> = {}): ProgressFile => ({ ...emptyProgressFile(), updatedAt: T0, ...overrides });

test("mergeProgress unions entries and events from both sides without conflicts", () => {
  const base = progress({ postings: { P1: entry() } });
  const local = progress({ updatedAt: T1, postings: { P1: entry({ status: "applied", updatedAt: T1 }), P2: entry({ starred: true, updatedAt: T1 }) }, events: [event({ id: "l1" })] });
  const remote = progress({ updatedAt: T2, postings: { P1: entry({ followUpAt: "2026-11-12", updatedAt: T2 }), P3: entry({ notes: "远端", updatedAt: T2 }) }, events: [event({ id: "r1" })] });
  const { value, conflicts } = mergeProgress(base, local, remote);
  assert.equal(value.postings.P1.status, "applied");
  assert.equal(value.postings.P1.followUpAt, "2026-11-12");
  assert.equal(value.postings.P2.starred, true);
  assert.equal(value.postings.P3.notes, "远端");
  assert.deepEqual(value.events.map((item) => item.id).sort(), ["l1", "r1"]);
  assert.equal(value.updatedAt, T2);
  assert.deepEqual(conflicts, []);
});
