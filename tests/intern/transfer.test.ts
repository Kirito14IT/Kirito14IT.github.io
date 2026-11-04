import { test } from "node:test";
import assert from "node:assert/strict";
import { planImport } from "../../src/intern/ui/transfer.ts";
import { emptyContactsFile, emptyPostingsFile, emptyProgressFile, normalizePosting } from "../../src/intern/core/schema.ts";
import type { Posting, Snapshot } from "../../src/intern/core/types.ts";
import { codexContact, codexPosting, taxonomy } from "./fixtures.ts";

const NOW = "2026-11-05T08:00:00.000Z";
const TODAY = "2026-11-05";

const snapshot = (): Snapshot => ({
  postings: {
    ...emptyPostingsFile(),
    taxonomy,
    postings: [normalizePosting({ id: "S001", company: "示例科技", title: "代码后训练实习生", url: "https://jobs.example.com/p/1" }, []) as Posting]
  },
  contacts: emptyContactsFile(),
  progress: emptyProgressFile()
});

const input = (value: unknown, overrides = {}) => ({ text: JSON.stringify(value), format: "auto" as const, batch: "test-batch", includeRestricted: false, ...overrides });

test("planImport adds tracker postings under fresh ids", () => {
  const plan = planImport(snapshot(), input({ postings: [{ company: "样例智能", title: "推理系统实习生" }] }), NOW, TODAY);
  assert.equal(plan.format, "tracker");
  assert.deepEqual(plan.postings.postings.map((posting) => posting.id), ["S001", "P20261105-001"]);
  assert.equal(plan.changes, 1);
  assert.equal(plan.lines[0], "批次 test-batch：新增岗位 1，更新 0，未变化 0，合并重复 0，重新编号 0");
});

test("planImport reads Codex internships and skips restricted ones by default", () => {
  const records = [codexPosting({ id: "S100", title: "评测实习生" }), codexPosting({ id: "S101", title: "受限实习生", current_view: false })];
  const plan = planImport(snapshot(), input(records), NOW, TODAY);
  assert.equal(plan.format, "codex-internships");
  assert.deepEqual(plan.postings.postings.map((posting) => posting.id), ["S001", "S100"]);
  assert.ok(plan.lines.includes("跳过 1 条受限记录：S101"));
  assert.equal(planImport(snapshot(), input(records, { includeRestricted: true }), NOW, TODAY).postings.postings.length, 3);
});

test("planImport reads a Codex contact sheet", () => {
  const plan = planImport(snapshot(), input([codexContact()]), NOW, TODAY);
  assert.equal(plan.format, "codex-contacts");
  assert.equal(plan.contacts?.contacts.length, 1);
});

test("planImport applies a patch to an existing posting", () => {
  const plan = planImport(snapshot(), input([{ id: "S001", dates: { closesAt: "2026-11-27", checkedAt: TODAY } }]), NOW, TODAY);
  assert.equal(plan.format, "patch");
  assert.equal(plan.postings.postings[0].dates.closesAt, "2026-11-27");
  assert.equal(plan.contacts, null);
  assert.equal(plan.changes, 1);
});

test("planImport explains malformed JSON and leaves the snapshot untouched", () => {
  const current = snapshot();
  const before = JSON.stringify(current);
  assert.throws(() => planImport(current, { ...input({}), text: "{ not json" }, NOW, TODAY), /JSON 格式有误/);
  planImport(current, input({ postings: [{ company: "样例智能", title: "推理系统实习生" }] }), NOW, TODAY);
  assert.equal(JSON.stringify(current), before);
});
