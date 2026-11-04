import { test } from "node:test";
import assert from "node:assert/strict";
import { findDuplicates, normalizeTitle, normalizeUrl } from "../../src/intern/core/dedupe.ts";

test("normalizeUrl keeps hash routes used by single-page job boards", () => {
  assert.equal(
    normalizeUrl("https://App.Example-Jobs.com/campus/step/141903#/job/16d4"),
    "https://app.example-jobs.com/campus/step/141903#/job/16d4"
  );
});

test("normalizeUrl drops tracking parameters, sorts the rest, and trims trailing slashes", () => {
  assert.equal(normalizeUrl("https://a.example.com/x/?utm_source=t&b=2&a=1&spm=abc"), "https://a.example.com/x?a=1&b=2");
});

test("normalizeUrl ignores empty hashes", () => {
  assert.equal(normalizeUrl("https://a.example.com/x#"), "https://a.example.com/x");
  assert.equal(normalizeUrl("https://a.example.com/x#/"), "https://a.example.com/x");
});

test("normalizeUrl falls back to trimmed lowercase text for invalid URLs", () => {
  assert.equal(normalizeUrl("  Not A URL "), "not a url");
  assert.equal(normalizeUrl(""), "");
});

test("normalizeTitle ignores case, spacing, and punctuation", () => {
  assert.equal(normalizeTitle("Research Intern, Model Shaping (Summer 2027)"), normalizeTitle("research intern model shaping summer 2027"));
  assert.equal(normalizeTitle("【实习】大模型 · 算法（评测）"), normalizeTitle("实习 大模型算法 评测"));
});

const existing = [
  { id: "A1", company: "示例科技", title: "代码后训练实习生", url: "https://jobs.example.com/p/1" },
  { id: "A2", company: "示例科技", title: "评测实习生", url: "https://jobs.example.com/list" },
  { id: "A3", company: "示例科技", title: "多模态实习生", url: "https://jobs.example.com/list" }
];

test("findDuplicates reports the same URL and title as a strong match", () => {
  const matches = findDuplicates({ company: "其他公司", title: "代码后训练 实习生", url: "https://jobs.example.com/p/1/" }, existing);
  assert.deepEqual(matches, [{ id: "A1", strength: "strong", reason: "网址和岗位名相同" }]);
});

test("findDuplicates reports the same company and title as a strong match", () => {
  const matches = findDuplicates({ company: "示例科技", title: "代码后训练实习生", url: "https://elsewhere.example.com/9" }, existing);
  assert.deepEqual(matches, [{ id: "A1", strength: "strong", reason: "公司和岗位名相同" }]);
});

test("findDuplicates reports a shared URL with a different title as a weak match", () => {
  const matches = findDuplicates({ company: "示例科技", title: "安全实习生", url: "https://jobs.example.com/list" }, existing);
  assert.deepEqual(matches, [
    { id: "A2", strength: "weak", reason: "网址相同但岗位名不同" },
    { id: "A3", strength: "weak", reason: "网址相同但岗位名不同" }
  ]);
});

test("findDuplicates skips the record itself and unrelated postings", () => {
  assert.deepEqual(findDuplicates({ id: "A1", company: "示例科技", title: "代码后训练实习生", url: "https://jobs.example.com/p/1" }, existing), []);
  assert.deepEqual(findDuplicates({ company: "另一家", title: "全新岗位", url: "https://new.example.com" }, existing), []);
});
