import { test } from "node:test";
import assert from "node:assert/strict";
import { postingsCsv, toCsv } from "../../src/intern/core/csv.ts";
import { defaultPostingProgress, emptyProgressFile, normalizePosting } from "../../src/intern/core/schema.ts";
import type { Posting } from "../../src/intern/core/types.ts";

test("toCsv quotes separators and guards spreadsheet formulas", () => {
  const csv = toCsv([
    ["a,b", 'say "hi"', "line\nbreak"],
    ["=1+1", "-2", "plain"]
  ]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.equal(csv.slice(1), '"a,b","say ""hi""","line\nbreak"\r\n\'=1+1,\'-2,plain\r\n');
});

test("postingsCsv writes a header and the tracked status", () => {
  const posting = normalizePosting({ id: "P1", company: "示例科技", title: "代码后训练实习生", dates: { closesAt: "2026-11-27" } }, []) as Posting;
  const progress = { ...emptyProgressFile(), postings: { P1: { ...defaultPostingProgress(), status: "applied" as const, appliedAt: "2026-11-05" } } };
  const lines = postingsCsv([posting], progress, new Map(), "2026-11-05").slice(1).split("\r\n");
  assert.ok(lines[0].startsWith("编号,公司,团队,岗位"));
  assert.ok(lines[0].includes("我的状态") && lines[0].includes("投递日期"));
  assert.ok(lines[1].startsWith("P1,示例科技,,代码后训练实习生"));
  assert.ok(lines[1].includes("已投递") && lines[1].includes("2026-11-05") && lines[1].includes("剩 22 天"));
});
