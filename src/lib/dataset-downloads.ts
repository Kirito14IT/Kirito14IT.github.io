export type DatasetDownloadValue = {
  count: number;
  fetchedAt?: number;
  source: "fallback" | "cache" | "api";
};

type DownloadCache = { count: number; fetchedAt: number };
type DownloadStorage = Pick<Storage, "getItem" | "setItem">;
type ClientOptions = {
  fetcher?: typeof fetch;
  storage?: DownloadStorage;
  now?: () => number;
};

const freshFor = 5 * 60 * 1000;
const usableFor = 7 * 24 * 60 * 60 * 1000;
const validCount = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;

export function createDatasetDownloadsClient({ fetcher = fetch, storage, now = Date.now }: ClientOptions = {}) {
  const requests = new Map<string, Promise<DownloadCache | undefined>>();

  async function request(repo: string, key: string): Promise<DownloadCache | undefined> {
    try {
      const path = repo.split("/").map(encodeURIComponent).join("/");
      const response = await fetcher(`https://huggingface.co/api/datasets/${path}?expand=downloads`, {
        credentials: "omit",
        cache: "no-store",
        signal: AbortSignal.timeout(6000)
      });
      if (!response.ok) return;
      const body: unknown = await response.json();
      if (!body || typeof body !== "object" || !("downloads" in body) || !validCount(body.downloads)) return;
      const value = { count: body.downloads, fetchedAt: now() };
      try { storage?.setItem(key, JSON.stringify(value)); } catch { /* Caching is optional. */ }
      return value;
    } catch { /* Preserve the rendered cache or initial count when the API is unavailable. */ }
  }

  return async function update(repo: string, fallback: number, display: (value: DatasetDownloadValue) => void) {
    const key = `krico-hf-dataset-downloads:${repo}`;
    let current: DatasetDownloadValue = { count: fallback, source: "fallback" };
    let age = Infinity;
    try {
      const cached: unknown = JSON.parse(storage?.getItem(key) || "null");
      if (cached && typeof cached === "object" && "count" in cached && "fetchedAt" in cached &&
          validCount(cached.count) && typeof cached.fetchedAt === "number" && Number.isFinite(cached.fetchedAt)) {
        const elapsed = now() - cached.fetchedAt;
        if (elapsed >= 0 && elapsed < usableFor) {
          age = elapsed;
          current = { count: cached.count, fetchedAt: cached.fetchedAt, source: "cache" };
        }
      }
    } catch { /* Storage may be blocked or contain invalid JSON. */ }
    display(current);
    if (age < freshFor) return current;

    let pending = requests.get(repo);
    if (!pending) {
      pending = request(repo, key);
      requests.set(repo, pending);
    }
    const result = await pending;
    if (result) {
      current = { ...result, source: "api" };
      display(current);
    }
    return current;
  };
}
