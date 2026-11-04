import { test } from "node:test";
import assert from "node:assert/strict";
import { clearAuth, loadAuth, openToken, saveAuth, sealToken } from "../../src/intern/data/auth.ts";
import type { StorageLike } from "../../src/intern/data/auth.ts";

const memory = () => {
  const items = new Map<string, string>();
  const storage: StorageLike & { dump: () => string; size: () => number } = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, String(value)),
    removeItem: (key) => void items.delete(key),
    dump: () => [...items.values()].join("\n"),
    size: () => items.size
  };
  return storage;
};

const repo = { owner: "octo", repo: "notes", branch: "main", dir: "data" };
const TOKEN = "github_pat_test_value";
const FAST = 1000;

test("a sealed token opens with the right passphrase", async () => {
  const sealed = await sealToken(TOKEN, "correct horse", FAST);
  assert.equal(await openToken(sealed, "correct horse"), TOKEN);
});

test("a sealed token refuses the wrong passphrase", async () => {
  const sealed = await sealToken(TOKEN, "correct horse", FAST);
  await assert.rejects(openToken(sealed, "wrong"), /口令/);
});

test("device mode keeps the token in local storage", async () => {
  const stores = { local: memory(), session: memory() };
  await saveAuth(stores, { ...repo, mode: "device", token: TOKEN });
  assert.deepEqual(loadAuth(stores), { ...repo, mode: "device", token: TOKEN, sealed: null });
  assert.equal(stores.session.size(), 0);
});

test("passphrase mode stores only the sealed token", async () => {
  const stores = { local: memory(), session: memory() };
  await saveAuth(stores, { ...repo, mode: "passphrase", token: TOKEN, passphrase: "correct horse", iterations: FAST });
  assert.equal(stores.local.dump().includes(TOKEN), false);
  const saved = loadAuth(stores);
  assert.equal(saved?.token, null);
  assert.ok(saved?.sealed);
  assert.equal(await openToken(saved.sealed, "correct horse"), TOKEN);
});

test("passphrase mode requires a passphrase", async () => {
  await assert.rejects(saveAuth({ local: memory(), session: memory() }, { ...repo, mode: "passphrase", token: TOKEN }), /口令/);
});

test("tab mode uses session storage and clears the device copy", async () => {
  const stores = { local: memory(), session: memory() };
  await saveAuth(stores, { ...repo, mode: "device", token: TOKEN });
  await saveAuth(stores, { ...repo, mode: "tab", token: TOKEN });
  assert.equal(stores.local.size(), 0);
  assert.equal(loadAuth(stores)?.mode, "tab");
});

test("clearAuth forgets every stored copy", async () => {
  const stores = { local: memory(), session: memory() };
  await saveAuth(stores, { ...repo, mode: "device", token: TOKEN });
  clearAuth(stores);
  assert.equal(loadAuth(stores), null);
});
