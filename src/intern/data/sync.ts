import { mergeContactsFile, mergePostingsFile, mergeProgress } from "../core/merge.ts";
import { normalizeContactsFile, normalizePostingsFile, normalizeProgressFile, serializeFile } from "../core/schema.ts";
import { FILE_NAMES } from "../core/types.ts";
import type { ContactsFile, FileKey, PostingsFile, ProgressFile, Snapshot } from "../core/types.ts";
import type { StorageLike } from "./auth.ts";
import { GitHubError } from "./github.ts";
import type { GitHubClient } from "./github.ts";

// Keeps the three data files in memory, saves edits after a short pause, and merges
// with whatever another device wrote in the meantime. Unsaved edits are mirrored to a
// local draft so a closed tab or a dropped connection does not lose them.

export interface SyncStatus {
  state: "idle" | "dirty" | "saving" | "error" | "auth";
  pending: number;
  lastSavedAt: string | null;
  message: string;
  merges: number;
}

export interface SyncOptions {
  client: Pick<GitHubClient, "getFile" | "putFile">;
  storage?: StorageLike;
  draftKey: string;
  debounceMs?: number;
  now?: () => string;
  schedule?: (run: () => void, delayMs: number) => unknown;
  cancel?: (handle: unknown) => void;
  onStatus?: (status: SyncStatus) => void;
  onChange?: (key: FileKey) => void;
}

interface FileState {
  base: unknown;
  local: unknown;
  sha: string;
  version: number;
  savedVersion: number;
  messages: string[];
  queue: Promise<void> | null;
}

type Draft = Partial<Record<FileKey, { base: unknown; local: unknown; messages?: unknown[] }>>;

const FILE_KEYS: readonly FileKey[] = ["postings", "contacts", "progress"];
const MAX_CONFLICT_RETRIES = 3;
const RETRY_DELAYS_MS = [5_000, 15_000, 60_000, 300_000];
const STOPPING_ERRORS = new Set(["auth", "forbidden", "not_found"]);

const normalizeFile = (key: FileKey, raw: unknown) => {
  switch (key) {
    case "postings":
      return normalizePostingsFile(raw);
    case "contacts":
      return normalizeContactsFile(raw);
    case "progress":
      return normalizeProgressFile(raw);
  }
};

const parseFile = (key: FileKey, text: string) => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`${FILE_NAMES[key]} 不是有效的 JSON`);
  }
  return normalizeFile(key, raw);
};

const mergeFile = (key: FileKey, base: unknown, local: unknown, remote: unknown): unknown => {
  switch (key) {
    case "postings":
      return mergePostingsFile(base as PostingsFile, local as PostingsFile, remote as PostingsFile).value;
    case "contacts":
      return mergeContactsFile(base as ContactsFile, local as ContactsFile, remote as ContactsFile).value;
    case "progress":
      return mergeProgress(base as ProgressFile, local as ProgressFile, remote as ProgressFile).value;
  }
};

const commitMessage = (key: FileKey, messages: string[]) => {
  if (messages.length === 0) return `${key}: 同步`;
  if (messages.length === 1) return messages[0];
  const preview = messages
    .slice(0, 3)
    .map((message) => message.replace(/^[a-z]+:\s*/, ""))
    .join("；");
  return `${key}: ${messages.length} 项更新（${preview}${messages.length > 3 ? "…" : ""}）`;
};

export const createTrackerSync = (options: SyncOptions) => {
  const now = options.now || (() => new Date().toISOString());
  const schedule = options.schedule || ((run: () => void, delayMs: number) => setTimeout(run, delayMs));
  const cancel = options.cancel || ((handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>));
  const debounceMs = options.debounceMs ?? 1500;
  const files = {} as Record<FileKey, FileState>;
  const status: SyncStatus = { state: "idle", pending: 0, lastSavedAt: null, message: "", merges: 0 };
  let debounceHandle: unknown = null;
  let retryHandle: unknown = null;
  let failures = 0;

  const isDirty = (key: FileKey) => files[key] !== undefined && files[key].version !== files[key].savedVersion;
  const dirtyKeys = () => FILE_KEYS.filter(isDirty);

  const emit = (state: SyncStatus["state"], message = "") => {
    status.state = state;
    status.message = message;
    status.pending = dirtyKeys().reduce((sum, key) => sum + Math.max(files[key].messages.length, 1), 0);
    options.onStatus?.({ ...status });
  };

  const writeDraft = () => {
    if (!options.storage) return;
    const draft: Draft = Object.fromEntries(
      dirtyKeys().map((key) => [key, { base: files[key].base, local: files[key].local, messages: files[key].messages }])
    );
    try {
      if (Object.keys(draft).length > 0) options.storage.setItem(options.draftKey, JSON.stringify(draft));
      else options.storage.removeItem(options.draftKey);
    } catch {
      // Storage may be full or disabled; the in-memory copy still saves.
    }
  };

  const readDraft = (): Draft => {
    try {
      const text = options.storage?.getItem(options.draftKey);
      return text ? (JSON.parse(text) as Draft) : {};
    } catch {
      return {};
    }
  };

  const saveFile = async (key: FileKey) => {
    const file = files[key];
    let conflicts = 0;
    while (file.version !== file.savedVersion) {
      const version = file.version;
      const local = file.local;
      const messageCount = file.messages.length;
      try {
        const result = await options.client.putFile(
          FILE_NAMES[key],
          serializeFile(key, local),
          file.sha || null,
          commitMessage(key, file.messages.slice(0, messageCount))
        );
        file.sha = result.sha;
        file.base = local;
        file.savedVersion = version;
        file.messages = file.messages.slice(messageCount);
        status.lastSavedAt = now();
      } catch (error) {
        if (!(error instanceof GitHubError) || error.kind !== "conflict" || conflicts >= MAX_CONFLICT_RETRIES) throw error;
        conflicts += 1;
        const remote = await options.client.getFile(FILE_NAMES[key]);
        const remoteValue = parseFile(key, remote.text).value;
        file.local = mergeFile(key, file.base, file.local, remoteValue);
        file.base = remoteValue;
        file.sha = remote.sha;
        status.merges += 1;
        options.onChange?.(key);
      }
    }
  };

  // Saves of the same file run one after another so each uses the sha of the last.
  const queueSave = (key: FileKey) => {
    const file = files[key];
    const run = (file.queue || Promise.resolve()).catch(() => undefined).then(() => saveFile(key));
    file.queue = run;
    return run.finally(() => {
      if (file.queue === run) file.queue = null;
    });
  };

  const flush = async () => {
    if (debounceHandle !== null) cancel(debounceHandle);
    if (retryHandle !== null) cancel(retryHandle);
    debounceHandle = null;
    retryHandle = null;
    const keys = dirtyKeys();
    if (keys.length === 0) {
      emit("idle");
      return;
    }
    emit("saving");
    try {
      await Promise.all(keys.map(queueSave));
      failures = 0;
      writeDraft();
      emit(dirtyKeys().length > 0 ? "dirty" : "idle");
    } catch (error) {
      writeDraft();
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof GitHubError && STOPPING_ERRORS.has(error.kind)) {
        emit("auth", message);
        return;
      }
      const delayMs = RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length - 1)];
      failures += 1;
      retryHandle = schedule(() => {
        retryHandle = null;
        void flush();
      }, delayMs);
      emit("error", `${message}，${Math.round(delayMs / 1000)} 秒后自动重试`);
    }
  };

  const scheduleSave = () => {
    if (debounceHandle !== null) cancel(debounceHandle);
    debounceHandle = schedule(() => {
      debounceHandle = null;
      void flush();
    }, debounceMs);
  };

  const load = async () => {
    const warnings: string[] = [];
    const remote = await Promise.all(FILE_KEYS.map((key) => options.client.getFile(FILE_NAMES[key])));
    FILE_KEYS.forEach((key, index) => {
      const parsed = parseFile(key, remote[index].text);
      warnings.push(...parsed.warnings.map((warning) => `${FILE_NAMES[key]}：${warning}`));
      files[key] = { base: parsed.value, local: parsed.value, sha: remote[index].sha, version: 0, savedVersion: 0, messages: [], queue: null };
    });
    const draft = readDraft();
    for (const key of FILE_KEYS) {
      const saved = draft[key];
      if (!saved) continue;
      try {
        const base = normalizeFile(key, saved.base).value;
        const local = normalizeFile(key, saved.local).value;
        files[key].local = mergeFile(key, base, local, files[key].base);
        files[key].version = 1;
        const messages = Array.isArray(saved.messages) ? saved.messages.map(String) : [];
        files[key].messages = messages.length > 0 ? messages : [`${key}: 恢复未同步的修改`];
      } catch {
        warnings.push(`无法恢复 ${FILE_NAMES[key]} 里未同步的修改`);
      }
    }
    if (dirtyKeys().length > 0) {
      emit("dirty", "已恢复上次未同步的修改");
      scheduleSave();
    } else {
      emit("idle");
    }
    return { warnings };
  };

  const update = <K extends FileKey>(key: K, mutate: (file: Snapshot[K]) => void, message: string) => {
    const file = files[key];
    if (!file) throw new Error("数据尚未加载");
    const next = structuredClone(file.local) as Snapshot[K];
    mutate(next);
    next.updatedAt = now();
    file.local = next;
    file.version += 1;
    file.messages.push(message);
    writeDraft();
    emit("dirty");
    scheduleSave();
  };

  return {
    get snapshot(): Snapshot {
      return {
        postings: files.postings?.local as PostingsFile,
        contacts: files.contacts?.local as ContactsFile,
        progress: files.progress?.local as ProgressFile
      };
    },
    get status(): SyncStatus {
      return { ...status };
    },
    load,
    update,
    flush,
    hasUnsaved: () => dirtyKeys().length > 0 || FILE_KEYS.some((key) => files[key]?.queue !== null && files[key]?.queue !== undefined)
  };
};

export type TrackerSync = ReturnType<typeof createTrackerSync>;
