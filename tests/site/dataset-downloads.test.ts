import { test } from "node:test";
import assert from "node:assert/strict";
import { createDatasetDownloadsClient } from "../../src/lib/dataset-downloads.ts";
import type { DatasetDownloadValue } from "../../src/lib/dataset-downloads.ts";

const repo = "kirco567/ScamWeb-Dataset";
const key = `krico-hf-dataset-downloads:${repo}`;
const now = 2_000_000_000_000;
const minute = 60_000;

function memoryStorage(initial?: string) {
  const values = new Map<string, string>(initial === undefined ? [] : [[key, initial]]);
  return { getItem: (name: string) => values.get(name) ?? null, setItem: (name: string, value: string) => { values.set(name, value); } };
}

test("fresh cached dataset downloads avoid a network request, including zero", async () => {
  let requests = 0;
  const update = createDatasetDownloadsClient({
    storage: memoryStorage(JSON.stringify({ count: 0, fetchedAt: now - minute })), now: () => now,
    fetcher: async () => { requests++; throw new Error("must not fetch"); }
  });
  const seen: DatasetDownloadValue[] = [];
  const result = await update(repo, 839, value => seen.push(value));
  assert.equal(requests, 0);
  assert.deepEqual(result, { count: 0, fetchedAt: now - minute, source: "cache" });
  assert.deepEqual(seen, [result]);
});

test("stale cache renders immediately, then refreshes from the official public endpoint", async () => {
  const storage = memoryStorage(JSON.stringify({ count: 839, fetchedAt: now - 6 * minute }));
  const seen: DatasetDownloadValue[] = [];
  const update = createDatasetDownloadsClient({ storage, now: () => now, fetcher: async (url, init) => {
    assert.equal(url, "https://huggingface.co/api/datasets/kirco567/ScamWeb-Dataset?expand=downloads");
    assert.equal(init?.credentials, "omit");
    assert.equal(init?.cache, "no-store");
    assert.ok(init?.signal instanceof AbortSignal);
    assert.equal(seen[0].source, "cache");
    return Response.json({ downloads: 851 });
  } });
  const result = await update(repo, 839, value => seen.push(value));
  assert.deepEqual(seen.map(value => [value.source, value.count]), [["cache", 839], ["api", 851]]);
  assert.deepEqual(result, { count: 851, fetchedAt: now, source: "api" });
  assert.deepEqual(JSON.parse(storage.getItem(key)!), { count: 851, fetchedAt: now });
});

test("simultaneous badges for one dataset share one request and accept an API count of zero", async () => {
  let requests = 0;
  const update = createDatasetDownloadsClient({ now: () => now, fetcher: async () => {
    requests++;
    return Response.json({ downloads: 0 });
  } });
  const [first, second] = await Promise.all([update(repo, 839, () => {}), update(repo, 839, () => {})]);
  assert.equal(requests, 1);
  assert.deepEqual(first, { count: 0, fetchedAt: now, source: "api" });
  assert.deepEqual(second, first);
});

test("expired, future, malformed, and invalid cache entries fall back and refresh", async () => {
  for (const initial of [
    "not json",
    JSON.stringify({ count: 900, fetchedAt: now - 7 * 24 * 60 * minute }),
    JSON.stringify({ count: 900, fetchedAt: now + minute }),
    JSON.stringify({ count: -1, fetchedAt: now - minute }),
    JSON.stringify({ count: 900, fetchedAt: "yesterday" })
  ]) {
    const seen: DatasetDownloadValue[] = [];
    const update = createDatasetDownloadsClient({ storage: memoryStorage(initial), now: () => now, fetcher: async () => Response.json({ downloads: 840 }) });
    await update(repo, 839, value => seen.push(value));
    assert.deepEqual(seen.map(value => [value.source, value.count]), [["fallback", 839], ["api", 840]]);
  }
});

test("blocked cache reads and writes do not prevent a successful API update", async () => {
  const update = createDatasetDownloadsClient({
    storage: { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } },
    now: () => now, fetcher: async () => Response.json({ downloads: 845 })
  });
  assert.deepEqual(await update(repo, 839, () => {}), { count: 845, fetchedAt: now, source: "api" });
});

test("HTTP, timeout, network, invalid JSON, and invalid counts retain the usable cache", async () => {
  const failures: Array<typeof fetch> = [
    async () => new Response(null, { status: 429 }),
    async () => { throw new DOMException("timed out", "TimeoutError"); },
    async () => { throw new Error("network offline"); },
    async () => new Response("not json"),
    async () => Response.json({ downloads: -1 }),
    async () => Response.json({ downloads: 1.5 }),
    async () => Response.json({ downloads: Number.MAX_SAFE_INTEGER + 1 }),
    async () => Response.json({ downloads: "839" }),
    async () => Response.json({ likes: 20 })
  ];
  for (const fetcher of failures) {
    const initial = { count: 838, fetchedAt: now - 6 * minute };
    const update = createDatasetDownloadsClient({ storage: memoryStorage(JSON.stringify(initial)), now: () => now, fetcher });
    const seen: DatasetDownloadValue[] = [];
    assert.deepEqual(await update(repo, 839, value => seen.push(value)), { ...initial, source: "cache" });
    assert.equal(seen.length, 1);
  }
});

test("API failure without a usable cache retains the static 839 fallback", async () => {
  const update = createDatasetDownloadsClient({ fetcher: async () => new Response(null, { status: 503 }) });
  assert.deepEqual(await update(repo, 839, () => {}), { count: 839, source: "fallback" });
});
