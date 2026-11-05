import { test } from "node:test";
import assert from "node:assert/strict";
import { connectErrorMessage } from "../../src/intern/ui/connect-errors.ts";
import { GitHubError } from "../../src/intern/data/github.ts";

const settings = { dir: "data", branch: "main" };
const error = (kind: ConstructorParameters<typeof GitHubError>[0], status: number) => new GitHubError(kind, status, "原始提示");

test("a 404 while checking access points at the token's repository access", () => {
  const message = connectErrorMessage(error("not_found", 404), "access", settings);
  assert.match(message, /Public repositories/);
  assert.match(message, /Only select repositories/);
  assert.match(message, /另一个 GitHub 账号/);
});

test("a 404 while loading points at the branch and data folder", () => {
  const message = connectErrorMessage(error("not_found", 404), "load", settings);
  assert.match(message, /data\/postings\.json/);
  assert.match(message, /main/);
});

test("a 403 while loading points at the Contents permission", () => {
  assert.match(connectErrorMessage(error("forbidden", 403), "load", settings), /Contents.*Read and write/);
});

test("a rejected token asks for a fresh copy", () => {
  assert.match(connectErrorMessage(error("auth", 401), "access", settings), /令牌无效或已过期/);
});

test("other failures keep their own message", () => {
  assert.equal(connectErrorMessage(error("network", 0), "access", settings), "原始提示");
  assert.equal(connectErrorMessage(new Error("别的错误"), "load", settings), "别的错误");
});
