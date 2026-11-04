import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  daysBetween,
  deadlineState,
  extractLeadingDate,
  formatDate,
  isIsoDate,
  relativeDayLabel,
  todayInShanghai
} from "../../src/intern/core/dates.ts";

test("todayInShanghai uses the Asia/Shanghai calendar day", () => {
  assert.equal(todayInShanghai(new Date("2026-11-05T15:59:00Z")), "2026-11-05");
  assert.equal(todayInShanghai(new Date("2026-11-05T16:00:00Z")), "2026-11-06");
});

test("isIsoDate accepts only real calendar dates", () => {
  assert.equal(isIsoDate("2026-11-05"), true);
  assert.equal(isIsoDate("2026-02-30"), false);
  assert.equal(isIsoDate("2026-11-5"), false);
  assert.equal(isIsoDate(null), false);
});

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("daysBetween counts whole calendar days", () => {
  assert.equal(daysBetween("2026-11-05", "2026-11-27"), 22);
  assert.equal(daysBetween("2026-11-05", "2026-11-04"), -1);
});

test("extractLeadingDate only reads a date at the start of the text", () => {
  assert.equal(extractLeadingDate("2027-07-16（可能招满提前关闭）"), "2027-07-16");
  assert.equal(extractLeadingDate("2026年11月27日截止"), "2026-11-27");
  assert.equal(extractLeadingDate("逐岗位；已核旧帖子2026-07-02截止"), null);
  assert.equal(extractLeadingDate("未公布"), null);
});

test("deadlineState labels each deadline bucket", () => {
  const today = "2026-11-05";
  const at = (closesAt: string | null, rolling = false) => deadlineState({ closesAt, rolling }, today);
  assert.deepEqual(at("2026-11-04"), { kind: "overdue", daysLeft: -1, label: "已截止 1 天" });
  assert.deepEqual(at("2026-11-05"), { kind: "today", daysLeft: 0, label: "今天截止" });
  assert.deepEqual(at("2026-11-08"), { kind: "soon", daysLeft: 3, label: "剩 3 天" });
  assert.deepEqual(at("2026-11-27"), { kind: "month", daysLeft: 22, label: "剩 22 天" });
  assert.deepEqual(at("2027-01-04"), { kind: "later", daysLeft: 60, label: "2027-01-04 截止" });
  assert.deepEqual(at(null, true), { kind: "rolling", daysLeft: null, label: "滚动招聘" });
  assert.deepEqual(at(null), { kind: "unknown", daysLeft: null, label: "未公布" });
  assert.deepEqual(at("not-a-date"), { kind: "unknown", daysLeft: null, label: "未公布" });
});

test("a dated deadline wins over the rolling flag", () => {
  assert.equal(deadlineState({ closesAt: "2026-11-08", rolling: true }, "2026-11-05").kind, "soon");
});

test("formatDate drops the year inside the current year", () => {
  assert.equal(formatDate("2026-11-27", "2026-11-05"), "11-27");
  assert.equal(formatDate("2027-07-16", "2026-11-05"), "2027-07-16");
  assert.equal(formatDate(null, "2026-11-05"), "");
});

test("relativeDayLabel describes nearby days in words", () => {
  const today = "2026-11-05";
  assert.equal(relativeDayLabel("2026-11-05", today), "今天");
  assert.equal(relativeDayLabel("2026-11-06", today), "明天");
  assert.equal(relativeDayLabel("2026-11-04", today), "昨天");
  assert.equal(relativeDayLabel("2026-11-10", today), "5 天后");
  assert.equal(relativeDayLabel("2026-10-29", today), "7 天前");
});
