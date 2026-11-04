import { test } from "node:test";
import assert from "node:assert/strict";
import { createGitHubClient } from "../../src/intern/data/github.ts";
import { createTrackerSync } from "../../src/intern/data/sync.ts";
import type { StorageLike } from "../../src/intern/data/auth.ts";
import { defaultPostingProgress, emptyContactsFile, emptyPostingsFile, emptyProgressFile, normalizePosting, serializeFile } from "../../src/intern/core/schema.ts";
import type { PostingsFile, ProgressFile } from "../../src/intern/core/types.ts";
import { createFakeGitHub } from "../../scripts/intern/fake-github.ts";

const NOW = "2026-11-05T08:00:00.000Z";
const ref = { owner: "octo", repo: "notes", branch: "main", dir: "data", apiBase: "https://api.example.test" };

const memory = (): StorageLike & { items: Map<string, string> } => {
  const items = new Map<string, string>();
  return { items, getItem: (key) => items.get(key) ?? null, setItem: (key, value) => void items.set(key, value), removeItem: (key) => void items.delete(key) };
};

const postingsFile = (): PostingsFile => ({
  ...emptyPostingsFile(),
  postings: ["P1", "P2"].map((id) => normalizePosting({ id, company: "示例科技", title: `岗位 ${id}` }, [])!)
});

const progressWith = (postings: ProgressFile["postings"]): ProgressFile => ({ ...emptyProgressFile(), postings });

const setup = (storage = memory()) => {
  const fake = createFakeGitHub({
    owner: "octo",
    repo: "notes",
    token: "t",
    files: {
      "data/postings.json": serializeFile("postings", postingsFile()),
      "data/contacts.json": serializeFile("contacts", emptyContactsFile()),
      "data/progress.json": serializeFile("progress", emptyProgressFile())
    }
  });
  const timers: (() => void)[] = [];
  const sync = createTrackerSync({
    client: createGitHubClient({ fetch: fake.fetch, token: "t", ref }),
    storage,
    draftKey: "draft",
    debounceMs: 1000,
    now: () => NOW,
    schedule: (run) => {
      timers.push(run);
      return timers.length;
    },
    cancel: () => {}
  });
  const remoteProgress = () => JSON.parse(fake.files.get("data/progress.json") || "{}");
  return { fake, sync, timers, storage, remoteProgress };
};

const setStatus = (id: string, status: "applied" | "preparing") => (progress: ProgressFile) => {
  progress.postings[id] = { ...(progress.postings[id] || defaultPostingProgress()), status, updatedAt: NOW };
};

test("load reads and normalizes all three files", async () => {
  const { sync } = setup();
  await sync.load();
  assert.equal(sync.snapshot.postings.postings.length, 2);
  assert.deepEqual(sync.snapshot.progress.postings, {});
  assert.equal(sync.status.state, "idle");
});

test("an update is committed on flush with its message", async () => {
  const { sync, fake, timers, remoteProgress } = setup();
  await sync.load();
  sync.update("progress", setStatus("P1", "applied"), "progress: P1 → 已投递");
  assert.equal(sync.status.state, "dirty");
  assert.equal(timers.length, 1);
  assert.equal(sync.hasUnsaved(), true);
  await sync.flush();
  assert.equal(remoteProgress().postings.P1.status, "applied");
  assert.deepEqual(fake.commits.map((commit) => commit.message), ["progress: P1 → 已投递"]);
  assert.equal(sync.hasUnsaved(), false);
  assert.equal(sync.status.state, "idle");
  assert.equal(sync.status.lastSavedAt, NOW);
});

test("several updates before a save share one commit", async () => {
  const { sync, fake } = setup();
  await sync.load();
  for (const label of ["a", "b", "c"]) sync.update("progress", (progress) => void (progress.updatedAt = label), `progress: ${label}`);
  await sync.flush();
  assert.deepEqual(fake.commits.map((commit) => commit.message), ["progress: 3 项更新（a；b；c）"]);
});

test("a save that races a remote edit merges both and retries", async () => {
  const { sync, fake, remoteProgress } = setup();
  await sync.load();
  fake.setFile("data/progress.json", serializeFile("progress", progressWith({ P2: { ...defaultPostingProgress(NOW), notes: "另一台设备" } })));
  sync.update("progress", setStatus("P1", "applied"), "progress: P1 → 已投递");
  await sync.flush();
  const saved = remoteProgress();
  assert.equal(saved.postings.P1.status, "applied");
  assert.equal(saved.postings.P2.notes, "另一台设备");
  assert.equal(sync.snapshot.progress.postings.P2.notes, "另一台设备");
  assert.equal(sync.status.merges, 1);
  assert.equal(fake.commits.length, 1);
});

test("an expired token stops saving and keeps a draft", async () => {
  const { sync, fake, storage } = setup();
  await sync.load();
  sync.update("progress", setStatus("P1", "applied"), "progress: P1 → 已投递");
  fake.failNext(401);
  await sync.flush();
  assert.equal(sync.status.state, "auth");
  assert.equal(sync.hasUnsaved(), true);
  assert.ok(storage.items.get("draft")?.includes('"applied"'));
});

test("a network failure keeps the draft and schedules a retry", async () => {
  const { sync, fake, timers } = setup();
  await sync.load();
  sync.update("progress", setStatus("P1", "applied"), "progress: P1 → 已投递");
  fake.failNext(503);
  await sync.flush();
  assert.equal(sync.status.state, "error");
  assert.equal(timers.length, 2);
  timers[1]();
  await sync.flush();
  assert.equal(sync.status.state, "idle");
});

test("a draft left by an earlier session is merged into fresh data on load", async () => {
  const storage = memory();
  const first = setup(storage);
  await first.sync.load();
  first.sync.update("progress", setStatus("P1", "applied"), "progress: P1 → 已投递");
  first.fake.failNext(503);
  await first.sync.flush();

  const second = setup(storage);
  second.fake.setFile("data/progress.json", serializeFile("progress", progressWith({ P2: { ...defaultPostingProgress(NOW), notes: "远端" } })));
  await second.sync.load();
  assert.equal(second.sync.snapshot.progress.postings.P1.status, "applied");
  assert.equal(second.sync.snapshot.progress.postings.P2.notes, "远端");
  assert.equal(second.sync.hasUnsaved(), true);
  await second.sync.flush();
  assert.equal(second.remoteProgress().postings.P1.status, "applied");
  assert.equal(storage.items.has("draft"), false);
});
