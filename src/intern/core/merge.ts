import type { ContactsFile, PostingsFile, ProgressFile, Taxonomy } from "./types.ts";

// Three-way merge used when a save races with an edit from another device or a script.
// Each side is compared with the common base; when both changed the same leaf, the side
// with the newer updatedAt wins and the path is reported as a conflict.

export interface MergeResult<T> {
  value: T;
  conflicts: string[];
}

interface Stamped {
  updatedAt: string;
}

type Plain = Record<string, unknown>;

const isPlain = (value: unknown): value is Plain => typeof value === "object" && value !== null && !Array.isArray(value);

const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (isPlain(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
};

const equal = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

const later = (a: string, b: string) => (a > b ? a : b);

const mergeValue = (base: unknown, local: unknown, remote: unknown, preferLocal: boolean, path: string, conflicts: string[]): unknown => {
  if (equal(local, remote)) return local;
  if (equal(local, base)) return remote;
  if (equal(remote, base)) return local;
  if (isPlain(local) && isPlain(remote)) {
    const baseObject = isPlain(base) ? base : {};
    const keys = [...new Set([...Object.keys(local), ...Object.keys(remote)])];
    return Object.fromEntries(keys.map((key) => [key, mergeValue(baseObject[key], local[key], remote[key], preferLocal, `${path}.${key}`, conflicts)]));
  }
  conflicts.push(path);
  return preferLocal ? local : remote;
};

// Timestamps decide conflicts but are not themselves merged.
const unstamped = <T extends Stamped>(record: T | undefined) => (record ? { ...record, updatedAt: "" } : record);

export const mergeRecord = <T extends Stamped>(base: T | undefined, local: T | undefined, remote: T | undefined, label: string, conflicts: string[]) => {
  if (!local) return remote;
  if (!remote) return local;
  const merged = mergeValue(unstamped(base), unstamped(local), unstamped(remote), local.updatedAt >= remote.updatedAt, label, conflicts) as T;
  return { ...merged, updatedAt: later(local.updatedAt, remote.updatedAt) };
};

const mergeKeyed = <T extends Stamped>(base: Record<string, T>, local: Record<string, T>, remote: Record<string, T>, label: string, conflicts: string[]) => {
  const keys = [...new Set([...Object.keys(remote), ...Object.keys(local)])];
  return Object.fromEntries(keys.map((key) => [key, mergeRecord(base[key], local[key], remote[key], `${label}.${key}`, conflicts) as T]));
};

// Entries are never removed (postings are archived, events get tombstones), so an id
// missing from one side is simply new on the other.
export const mergeList = <T extends Stamped & { id: string }>(base: T[], local: T[], remote: T[], label: string, conflicts: string[]) => {
  const baseById = new Map(base.map((item) => [item.id, item]));
  const localById = new Map(local.map((item) => [item.id, item]));
  const remoteIds = new Set(remote.map((item) => item.id));
  const merged = remote.map((item) => mergeRecord(baseById.get(item.id), localById.get(item.id), item, `${label}.${item.id}`, conflicts) as T);
  for (const item of local) {
    if (!remoteIds.has(item.id)) merged.push(item);
  }
  return merged;
};

export const mergeProgress = (base: ProgressFile, local: ProgressFile, remote: ProgressFile): MergeResult<ProgressFile> => {
  const conflicts: string[] = [];
  const value: ProgressFile = {
    schemaVersion: local.schemaVersion,
    updatedAt: later(local.updatedAt, remote.updatedAt),
    settings: mergeRecord(base.settings, local.settings, remote.settings, "settings", conflicts) || local.settings,
    postings: mergeKeyed(base.postings, local.postings, remote.postings, "postings", conflicts),
    contacts: mergeKeyed(base.contacts, local.contacts, remote.contacts, "contacts", conflicts),
    companies: mergeKeyed(base.companies, local.companies, remote.companies, "companies", conflicts),
    events: mergeList(base.events, local.events, remote.events, "events", conflicts)
  };
  return { value, conflicts };
};

export const mergePostingsFile = (base: PostingsFile, local: PostingsFile, remote: PostingsFile): MergeResult<PostingsFile> => {
  const conflicts: string[] = [];
  const value: PostingsFile = {
    schemaVersion: local.schemaVersion,
    updatedAt: later(local.updatedAt, remote.updatedAt),
    // The page never edits the taxonomy, so a script's version wins any overlap.
    taxonomy: mergeValue(base.taxonomy, local.taxonomy, remote.taxonomy, false, "taxonomy", conflicts) as Taxonomy,
    postings: mergeList(base.postings, local.postings, remote.postings, "postings", conflicts)
  };
  return { value, conflicts };
};

export const mergeContactsFile = (base: ContactsFile, local: ContactsFile, remote: ContactsFile): MergeResult<ContactsFile> => {
  const conflicts: string[] = [];
  const value: ContactsFile = {
    schemaVersion: local.schemaVersion,
    updatedAt: later(local.updatedAt, remote.updatedAt),
    contacts: mergeList(base.contacts, local.contacts, remote.contacts, "contacts", conflicts)
  };
  return { value, conflicts };
};
