import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { codexContact, codexPosting, taxonomy } from "./fixtures.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const NOW = "2026-11-05T08:00:00.000Z";

const run = (script: string, args: string[]) =>
  spawnSync(process.execPath, [path.join(root, "scripts", "intern", script), ...args], { encoding: "utf8" });

const workspace = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "intern-cli-"));
  const data = path.join(dir, "data");
  const write = (name: string, value: unknown) => {
    const file = path.join(dir, name);
    writeFileSync(file, JSON.stringify(value));
    return file;
  };
  const read = (name: string) => JSON.parse(readFileSync(path.join(data, name), "utf8"));
  return { dir, data, write, read, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
};

const importCodex = (space: ReturnType<typeof workspace>, extra: string[] = []) => {
  const internships = space.write("internships.json", [
    codexPosting(),
    codexPosting({ id: "S002", title: "受限岗位", current_view: false }),
    codexPosting({ id: "S003", title: "评测实习生", contact_ids: ["C001"], contact_emails: ["zhangsan@example.com"] })
  ]);
  const contacts = space.write("contacts.json", [codexContact()]);
  const taxonomyFile = space.write("taxonomy.json", taxonomy);
  return run("import-batch.ts", [
    "--data", space.data,
    "--taxonomy", taxonomyFile,
    "--codex-internships", internships,
    "--codex-contacts", contacts,
    "--batch", "codex-test",
    "--now", NOW,
    ...extra
  ]);
};

test("import-batch builds a data directory from Codex files", () => {
  const space = workspace();
  try {
    const result = importCodex(space);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(space.read("postings.json").postings.map((posting: { id: string }) => posting.id), ["S001", "S003"]);
    assert.equal(space.read("postings.json").taxonomy.companyTiers["示例科技"], "国内大厂");
    assert.deepEqual(space.read("progress.json").postings, {});
    assert.equal(space.read("contacts.json").contacts.length, 1);
    assert.match(result.stdout, /新增岗位 2/);
    assert.match(result.stdout, /跳过 1/);
  } finally {
    space.cleanup();
  }
});

test("import-batch --dry-run writes nothing", () => {
  const space = workspace();
  try {
    const result = importCodex(space, ["--dry-run"]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(path.join(space.data, "postings.json")), false);
    assert.match(result.stdout, /未写入/);
  } finally {
    space.cleanup();
  }
});

test("re-running the same import leaves the files untouched", () => {
  const space = workspace();
  try {
    importCodex(space);
    const before = readFileSync(path.join(space.data, "postings.json"), "utf8");
    const again = importCodex(space);
    assert.equal(again.status, 0, again.stderr);
    assert.match(again.stdout, /未变化 2/);
    assert.equal(readFileSync(path.join(space.data, "postings.json"), "utf8"), before);
  } finally {
    space.cleanup();
  }
});

test("import-batch applies a dates patch", () => {
  const space = workspace();
  try {
    importCodex(space);
    const patch = space.write("patch.json", [{ id: "S001", dates: { closesAt: "2026-11-27", source: "https://jobs.example.com/p/1", checkedAt: "2026-11-06" } }]);
    const result = run("import-batch.ts", ["--data", space.data, "--patch", patch, "--now", NOW]);
    assert.equal(result.status, 0, result.stderr);
    const posting = space.read("postings.json").postings.find((item: { id: string }) => item.id === "S001");
    assert.equal(posting.dates.closesAt, "2026-11-27");
    assert.match(result.stdout, /补丁更新 1/);
  } finally {
    space.cleanup();
  }
});

test("import-batch refuses to write a result that fails validation", () => {
  const space = workspace();
  try {
    const tracker = space.write("tracker.json", { postings: [{ id: "P1", company: "示例科技", title: "孤立岗位", contactIds: ["C404"] }] });
    const result = run("import-batch.ts", ["--data", space.data, "--tracker", tracker, "--now", NOW]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /C404/);
    assert.equal(existsSync(path.join(space.data, "postings.json")), false);
  } finally {
    space.cleanup();
  }
});

test("import-batch numbers tracker postings that arrive without an id", () => {
  const space = workspace();
  try {
    importCodex(space);
    const tracker = space.write("tracker.json", {
      postings: [
        { company: "示例科技", title: "Agent 评测实习生", url: "https://jobs.example.com/p/9", programTag: "" },
        { company: "样例智能", title: "推理系统实习生", url: "https://jobs.example.org/2" }
      ]
    });
    const result = run("import-batch.ts", ["--data", space.data, "--tracker", tracker, "--batch", "manual-test", "--now", NOW]);
    assert.equal(result.status, 0, result.stderr);
    const added = space.read("postings.json").postings.slice(-2);
    assert.deepEqual(added.map((posting: { id: string }) => posting.id), ["P20261105-001", "P20261105-002"]);
    assert.equal(added[0].companyTier, "国内大厂");
    assert.equal(added[0].provenance.batch, "manual-test");
  } finally {
    space.cleanup();
  }
});

test("validate-data passes a consistent directory and fails a broken one", () => {
  const space = workspace();
  try {
    importCodex(space);
    const ok = run("validate-data.ts", ["--data", space.data]);
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /岗位 2/);
    const postings = space.read("postings.json");
    postings.postings[0].contactIds = ["C404"];
    writeFileSync(path.join(space.data, "postings.json"), JSON.stringify(postings));
    const broken = run("validate-data.ts", ["--data", space.data]);
    assert.equal(broken.status, 1);
    assert.match(broken.stderr, /C404/);
  } finally {
    space.cleanup();
  }
});
