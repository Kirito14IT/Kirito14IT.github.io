import { test } from "node:test";
import assert from "node:assert/strict";
import { deadlineNote } from "../../src/intern/ui/format.ts";

test("deadlineNote drops a leading copy of the deadline and its brackets", () => {
  assert.equal(deadlineNote({ closesAt: "2026-11-27", note: "2026-11-27（可能招满提前关闭）" }), "可能招满提前关闭");
  assert.equal(deadlineNote({ closesAt: "2026-11-27", note: "2026-11-27" }), "");
});

test("deadlineNote keeps notes that add information", () => {
  assert.equal(deadlineNote({ closesAt: null, note: "全年开放（官网FAQ）；单岗位截止另核" }), "全年开放（官网FAQ）；单岗位截止另核");
  assert.equal(deadlineNote({ closesAt: "2026-11-27", note: "逐岗位截止" }), "逐岗位截止");
  assert.equal(deadlineNote({ closesAt: null, note: "" }), "");
});
