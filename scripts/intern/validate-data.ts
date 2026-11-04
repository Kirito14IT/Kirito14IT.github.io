// Checks a tracker data directory before it is committed to the private data repository.
import path from "node:path";
import { parseArgs } from "node:util";
import { validateSnapshot } from "../../src/intern/core/schema.ts";
import { FILE_NAMES } from "../../src/intern/core/types.ts";
import type { FileKey } from "../../src/intern/core/types.ts";
import { loadDataDir } from "./data-dir.ts";

const { values } = parseArgs({ options: { data: { type: "string" } } });
if (!values.data) {
  console.error("用法：node scripts/intern/validate-data.ts --data <数据目录>");
  process.exit(1);
}

const dataDir = path.resolve(values.data);
let loaded: ReturnType<typeof loadDataDir>;
try {
  loaded = loadDataDir(dataDir);
} catch (error) {
  console.error(`错误：无法读取数据：${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const { snapshot, exists, warnings } = loaded;
const { errors, warnings: integrityWarnings } = validateSnapshot(snapshot);
const archived = snapshot.postings.postings.filter((posting) => posting.archived).length;
console.log(
  `岗位 ${snapshot.postings.postings.length}（归档 ${archived}），联系人 ${snapshot.contacts.contacts.length}，` +
    `进度记录 ${Object.keys(snapshot.progress.postings).length}，事件 ${snapshot.progress.events.length}`
);
for (const warning of integrityWarnings) console.log(`警告：${warning}`);

// Normalization warnings mean a value would be dropped on load, so they block a commit.
const problems = [
  ...(Object.keys(exists) as FileKey[]).filter((key) => !exists[key]).map((key) => `缺少文件：${FILE_NAMES[key]}`),
  ...warnings,
  ...errors
];
if (problems.length > 0) {
  console.error(problems.map((problem) => `错误：${problem}`).join("\n"));
  process.exit(1);
}
console.log("校验通过");
