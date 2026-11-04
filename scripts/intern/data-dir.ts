import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  emptyContactsFile,
  emptyPostingsFile,
  emptyProgressFile,
  normalizeContactsFile,
  normalizePostingsFile,
  normalizeProgressFile,
  serializeFile
} from "../../src/intern/core/schema.ts";
import { FILE_NAMES } from "../../src/intern/core/types.ts";
import type { FileKey, Snapshot } from "../../src/intern/core/types.ts";

const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

export const readJson = (file: string): unknown => {
  const text = readFileSync(file, "utf8");
  return JSON.parse(text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text);
};

export const loadDataDir = (dir: string) => {
  const warnings: string[] = [];
  const exists = {} as Record<FileKey, boolean>;
  const load = <T>(key: FileKey, normalize: (raw: unknown) => { value: T; warnings: string[] }, empty: () => T) => {
    const file = path.join(dir, FILE_NAMES[key]);
    exists[key] = existsSync(file);
    if (!exists[key]) return empty();
    const result = normalize(readJson(file));
    warnings.push(...result.warnings.map((warning) => `${FILE_NAMES[key]}：${warning}`));
    return result.value;
  };
  const snapshot: Snapshot = {
    postings: load("postings", normalizePostingsFile, emptyPostingsFile),
    contacts: load("contacts", normalizeContactsFile, emptyContactsFile),
    progress: load("progress", normalizeProgressFile, emptyProgressFile)
  };
  return { snapshot, exists, warnings };
};

// Writes a data file only when its serialized content changed; returns whether it wrote.
export const writeDataFile = (dir: string, key: FileKey, value: unknown) => {
  const file = path.join(dir, FILE_NAMES[key]);
  const text = serializeFile(key, value);
  if (existsSync(file) && readFileSync(file, "utf8") === text) return false;
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, text, "utf8");
  return true;
};
