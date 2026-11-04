// Imports a research batch into a tracker data directory (the private data repository).
import path from "node:path";
import { parseArgs } from "node:util";
import { batchFromCodex } from "../../src/intern/core/codex.ts";
import { applyPostingPatches, describeImport, importBatch, prepareTrackerBatch } from "../../src/intern/core/importer.ts";
import { normalizeTaxonomy, validateSnapshot } from "../../src/intern/core/schema.ts";
import type { Contact, Posting } from "../../src/intern/core/types.ts";
import { loadDataDir, readJson, writeDataFile } from "./data-dir.ts";

const usage = `用法：node scripts/intern/import-batch.ts --data <数据目录> [选项]
  --codex-internships <文件>  Codex 实习 JSON（internships.json）
  --codex-contacts <文件>     Codex 联系人 JSON（contacts.json）
  --codex-jobs <文件>         Codex 全量岗位 JSON，用来补全联系人关联的原清单岗位标题
  --tracker <文件>            tracker 格式批次：{ "postings": [...], "contacts": [...] }
  --patch <文件>              岗位补丁：[{ "id": "...", "dates": { ... } }]
  --taxonomy <文件>           替换分类规则（公司分层、人才计划、方向顺序）
  --batch <名称>              批次名，默认 batch-<日期>
  --include-restricted        同时导入 Codex 标记为受限的记录
  --now <ISO 时间>            指定导入时间
  --dry-run                   只输出报告，不写文件`;

const { values } = parseArgs({
  options: {
    data: { type: "string" },
    taxonomy: { type: "string" },
    "codex-internships": { type: "string" },
    "codex-contacts": { type: "string" },
    "codex-jobs": { type: "string" },
    tracker: { type: "string" },
    patch: { type: "string" },
    batch: { type: "string" },
    now: { type: "string" },
    "include-restricted": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", default: false }
  }
});

if (values.help || !values.data) {
  console.log(usage);
  process.exit(values.help ? 0 : 1);
}

const now = values.now || new Date().toISOString();
const batchCode = now.slice(0, 10).replaceAll("-", "");
const batch = values.batch || `batch-${batchCode}`;
const dataDir = path.resolve(values.data);
const asArray = (value: unknown, key: string): unknown[] => {
  if (Array.isArray(value)) return value;
  const nested = typeof value === "object" && value !== null ? (value as Record<string, unknown>)[key] : undefined;
  return Array.isArray(nested) ? nested : [];
};

const loaded = loadDataDir(dataDir);
let { postings, contacts } = loaded.snapshot;
const { progress } = loaded.snapshot;
const warnings = [...loaded.warnings];
const lines: string[] = [];

if (values.taxonomy) postings = { ...postings, taxonomy: normalizeTaxonomy(readJson(values.taxonomy)) };

const runImport = (incoming: { postings: Posting[]; contacts: Contact[] }, skipped: string[] = []) => {
  const result = importBatch({ postings, contacts }, incoming, { batchCode, now });
  postings = result.postings;
  contacts = result.contacts;
  lines.push(...describeImport(result.report, batch, skipped));
};

if (values["codex-internships"] || values["codex-contacts"]) {
  const codex = batchFromCodex(
    {
      internships: values["codex-internships"] ? asArray(readJson(values["codex-internships"]), "internships") : [],
      contacts: values["codex-contacts"] ? asArray(readJson(values["codex-contacts"]), "contacts") : [],
      jobs: values["codex-jobs"] ? asArray(readJson(values["codex-jobs"]), "jobs") : []
    },
    { batch, taxonomy: postings.taxonomy, now, includeRestricted: values["include-restricted"], existingContacts: contacts.contacts }
  );
  runImport(codex, codex.skipped);
}

if (values.tracker) {
  const prepared = prepareTrackerBatch(readJson(values.tracker), {
    existingIds: postings.postings.map((posting) => posting.id),
    taxonomy: postings.taxonomy,
    batch,
    batchCode,
    now
  });
  warnings.push(...prepared.warnings);
  runImport(prepared);
}

if (values.patch) {
  const result = applyPostingPatches(postings, asArray(readJson(values.patch), "patches"), now);
  postings = result.file;
  lines.push(`补丁更新 ${result.report.updated.length}，找不到 ${result.report.missing.length}`);
  for (const item of result.report.updated) lines.push(`  ${item.id}：${item.fields.join("、")}`);
  if (result.report.missing.length > 0) lines.push(`  找不到的编号：${result.report.missing.join("、")}`);
}

const next = { postings, contacts, progress };
const validation = validateSnapshot(next);
console.log(lines.join("\n"));
for (const warning of [...warnings, ...validation.warnings]) console.log(`警告：${warning}`);

if (validation.errors.length > 0) {
  console.error(`校验失败，未写入文件：\n${validation.errors.map((error) => `  - ${error}`).join("\n")}`);
  process.exit(1);
}

if (values["dry-run"]) {
  console.log("（--dry-run：未写入文件）");
  process.exit(0);
}

const written = (["postings", "contacts", "progress"] as const).filter((key) => writeDataFile(dataDir, key, next[key]));
console.log(written.length > 0 ? `已写入 ${dataDir}：${written.map((key) => `${key}.json`).join("、")}` : "数据没有变化");
