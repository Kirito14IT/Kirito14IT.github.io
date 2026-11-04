import { test } from "node:test";
import assert from "node:assert/strict";
import { GitHubError, createGitHubClient, parseRepo } from "../../src/intern/data/github.ts";
import type { RepoRef } from "../../src/intern/data/github.ts";
import { blobSha, createFakeGitHub } from "../../scripts/intern/fake-github.ts";

const ref: RepoRef = { owner: "octo", repo: "notes", branch: "main", dir: "data", apiBase: "https://api.example.test" };
const TOKEN = "test-token";

const setup = (files: Record<string, string> = {}, inlineLimit?: number) => {
  const fake = createFakeGitHub({ owner: "octo", repo: "notes", token: TOKEN, files, inlineLimit });
  return { fake, client: createGitHubClient({ fetch: fake.fetch, token: TOKEN, ref }) };
};

const kindOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error instanceof GitHubError ? error.kind : `not a GitHubError: ${String(error)}`;
  }
  return "resolved";
};

test("getFile decodes UTF-8 content and returns its sha", async () => {
  const text = '{"note":"代码后训练"}\n';
  const { client } = setup({ "data/progress.json": text });
  assert.deepEqual(await client.getFile("progress.json"), { text, sha: blobSha(text) });
});

test("getFile falls back to the blob API when the contents API omits large files", async () => {
  const text = '{"note":"大文件"}\n';
  const { client } = setup({ "data/postings.json": text }, 4);
  assert.equal((await client.getFile("postings.json")).text, text);
});

test("putFile sends the previous sha and returns the new one", async () => {
  const { fake, client } = setup({ "data/progress.json": "{}\n" });
  const { sha } = await client.putFile("progress.json", '{"a":"新"}\n', blobSha("{}\n"), "progress: 测试");
  assert.equal(sha, blobSha('{"a":"新"}\n'));
  assert.equal(fake.files.get("data/progress.json"), '{"a":"新"}\n');
  assert.deepEqual(fake.commits.map((commit) => commit.message), ["progress: 测试"]);
});

test("putFile reports a stale or missing sha as a conflict", async () => {
  const { client } = setup({ "data/progress.json": "{}\n" });
  assert.equal(await kindOf(client.putFile("progress.json", "[]\n", blobSha("old"), "m")), "conflict");
  assert.equal(await kindOf(client.putFile("progress.json", "[]\n", null, "m")), "conflict");
});

test("HTTP failures map onto error kinds", async () => {
  const { fake, client } = setup({ "data/progress.json": "{}\n" });
  fake.failNext(401);
  assert.equal(await kindOf(client.getFile("progress.json")), "auth");
  fake.failNext(403, { "x-ratelimit-remaining": "0" });
  assert.equal(await kindOf(client.getFile("progress.json")), "rate_limit");
  fake.failNext(403);
  assert.equal(await kindOf(client.getFile("progress.json")), "forbidden");
  assert.equal(await kindOf(client.getFile("missing.json")), "not_found");
  fake.failNext(502);
  assert.equal(await kindOf(client.getFile("progress.json")), "server");
});

test("a failed request reports a network error", async () => {
  const client = createGitHubClient({
    fetch: async () => {
      throw new TypeError("Failed to fetch");
    },
    token: TOKEN,
    ref
  });
  assert.equal(await kindOf(client.getFile("progress.json")), "network");
});

test("checkAccess reports whether the token can push", async () => {
  const { client } = setup();
  assert.deepEqual(await client.checkAccess(), { fullName: "octo/notes", private: true, canPush: true });
  const wrongToken = createGitHubClient({ fetch: setup().fake.fetch, token: "wrong", ref });
  assert.equal(await kindOf(wrongToken.checkAccess()), "auth");
});

test("parseRepo accepts owner/name and GitHub URLs", () => {
  assert.deepEqual(parseRepo(" octo/notes "), { owner: "octo", repo: "notes" });
  assert.deepEqual(parseRepo("https://github.com/octo-cat/my.notes.git"), { owner: "octo-cat", repo: "my.notes" });
  assert.equal(parseRepo("not a repo"), null);
  assert.equal(parseRepo("a/b/c"), null);
});
