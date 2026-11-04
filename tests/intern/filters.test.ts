import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyFilters, facetOptions, filterPostings, filtersFromParams, filtersToParams } from "../../src/intern/core/filters.ts";
import type { FilterContext } from "../../src/intern/core/filters.ts";
import { defaultPostingProgress, emptyProgressFile, normalizeContact, normalizePosting } from "../../src/intern/core/schema.ts";
import type { Contact, Posting, PostingProgress } from "../../src/intern/core/types.ts";

const make = (overrides: Record<string, unknown>): Posting => {
  const posting = normalizePosting({ company: "示例科技", ...overrides }, []);
  assert.ok(posting);
  return posting;
};

const postings = [
  make({
    id: "A",
    title: "代码后训练实习生",
    focus: ["Coding Agent/代码", "后训练/RL"],
    fit: "高",
    priority: 1,
    programTag: "星火计划",
    eligibility: { bucket: "本科可尝试" },
    dates: { closesAt: "2026-11-08" },
    contactIds: ["C1"],
    jd: "负责 RL 训练"
  }),
  make({
    id: "B",
    company: "样例智能",
    title: "安全评测实习生",
    focus: ["安全/对齐"],
    fit: "中高",
    priority: 2,
    region: "overseas",
    recordType: "mentor",
    eligibility: { bucket: "需先确认" },
    dates: { closesAt: "2026-11-27" }
  }),
  make({ id: "C", title: "多模态实习生", focus: ["多模态"], fit: "中", priority: 3, recordType: "program", dates: { rolling: true } }),
  make({ id: "D", company: "远方实验室", title: "推理系统实习生", focus: ["训练/推理系统"], fit: "高", priority: 1 })
];

const contact = normalizeContact({ id: "C1", name: "张三", email: "zhangsan@example.com" }, []) as Contact;

const entry = (overrides: Partial<PostingProgress>): PostingProgress => ({ ...defaultPostingProgress(), ...overrides });

const ctx: FilterContext = {
  progress: {
    ...emptyProgressFile(),
    postings: {
      A: entry({ status: "applied", starred: true, notes: "已找学长内推" }),
      B: entry({ status: "rejected" })
    }
  },
  contactsById: new Map([["C1", contact]]),
  today: "2026-11-05",
  focusOrder: ["Coding Agent/代码", "后训练/RL", "安全/对齐"]
};

const ids = (overrides: Partial<ReturnType<typeof emptyFilters>>) =>
  filterPostings(postings, { ...emptyFilters(), ...overrides }, ctx).map((posting) => posting.id);

test("text search needs every token and also reads notes and contact names", () => {
  assert.deepEqual(ids({ q: "示例 内推" }), ["A"]);
  assert.deepEqual(ids({ q: "张三" }), ["A"]);
  assert.deepEqual(ids({ q: "不存在的词" }), []);
});

test("facets combine with AND across groups and OR within a group", () => {
  assert.deepEqual(ids({ focus: ["安全/对齐", "多模态"], showEnded: true }).sort(), ["B", "C"]);
  assert.deepEqual(ids({ focus: ["安全/对齐", "多模态"], region: ["cn"], showEnded: true }), ["C"]);
});

test("deadline buckets follow the days left", () => {
  assert.deepEqual(ids({ deadline: ["soon"] }), ["A"]);
  assert.deepEqual(ids({ deadline: ["month"], showEnded: true }), ["B"]);
  assert.deepEqual(ids({ deadline: ["rolling"] }), ["C"]);
  assert.deepEqual(ids({ deadline: ["unknown"] }), ["D"]);
});

test("ended postings stay hidden unless shown or filtered for explicitly", () => {
  assert.deepEqual(ids({}).sort(), ["A", "C", "D"]);
  assert.deepEqual(ids({ showEnded: true }).sort(), ["A", "B", "C", "D"]);
  assert.deepEqual(ids({ status: ["rejected"] }), ["B"]);
});

test("hasEmail and starred narrow the list", () => {
  assert.deepEqual(ids({ hasEmail: true }), ["A"]);
  assert.deepEqual(ids({ starred: true }), ["A"]);
});

test("facetOptions counts values and orders focus tags by the taxonomy", () => {
  assert.deepEqual(
    facetOptions("focus", postings, ctx).map((option) => [option.value, option.count]),
    [
      ["Coding Agent/代码", 1],
      ["后训练/RL", 1],
      ["安全/对齐", 1],
      ["多模态", 1],
      ["训练/推理系统", 1]
    ]
  );
  assert.deepEqual(facetOptions("program", postings, ctx), [
    { value: "星火计划", label: "星火计划", count: 1 },
    { value: "none", label: "非人才计划", count: 3 }
  ]);
});

test("priority sort falls back to fit and then the deadline", () => {
  assert.deepEqual(ids({ showEnded: true }), ["A", "D", "B", "C"]);
});

test("deadline sort lists dated postings first, then rolling, then unknown", () => {
  assert.deepEqual(ids({ showEnded: true, sort: "deadline" }), ["A", "B", "C", "D"]);
});

test("filters survive a round trip through URL parameters", () => {
  const filters = { ...emptyFilters(), q: "代码", focus: ["后训练/RL", "Coding Agent/代码"], starred: true, sort: "deadline" as const };
  assert.deepEqual(filtersFromParams(filtersToParams(filters)), filters);
  assert.equal(filtersToParams(emptyFilters()).toString(), "");
});
