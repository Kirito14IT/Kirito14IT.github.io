import { applyProgramRules } from "./codex.ts";
import { findDuplicates, normalizeTitle, normalizeUrl } from "./dedupe.ts";
import type { DuplicateMatch } from "./dedupe.ts";
import { normalizeContact, normalizePosting } from "./schema.ts";
import type { Contact, ContactsFile, Posting, PostingsFile, Taxonomy } from "./types.ts";

// Merges a research batch into the catalogue. Personal progress is never touched here.

export interface ImportReport {
  added: string[];
  updated: { id: string; fields: string[] }[];
  unchanged: string[];
  merged: { incomingId: string; existingId: string; reason: string }[];
  remapped: { from: string; to: string }[];
  weakMatches: { id: string; matches: DuplicateMatch[] }[];
  contactsAdded: string[];
  contactsUpdated: { id: string; fields: string[] }[];
  contactsMerged: { incomingId: string; existingId: string }[];
  contactsRemapped: { from: string; to: string }[];
}

type Loose = Record<string, unknown>;

const POSTING_FACTS = [
  "company",
  "team",
  "companyTier",
  "title",
  "program",
  "programTag",
  "recordType",
  "internshipType",
  "region",
  "location",
  "focus",
  "requirements",
  "duration",
  "jd",
  "fit",
  "fitReason",
  "gaps",
  "priority",
  "url",
  "sourceUrl",
  "siteStatus"
] as const;

const CONTACT_FACTS = [
  "company",
  "organization",
  "name",
  "role",
  "email",
  "emailType",
  "contactType",
  "interests",
  "whyContact",
  "relationLevel",
  "relationLabel",
  "relationEvidence",
  "relationScope",
  "exactJobOwnerConfirmed",
  "specificJdRelation",
  "jobMappingScope",
  "outreachGate",
  "caveats",
  "recruitingStatus",
  "priority",
  "sourceUrl",
  "affiliationUrl",
  "checkedAt",
  "sourceDate"
] as const;

// Enum fields fall back to these values when a batch says nothing, so they never overwrite.
const SILENT_DEFAULTS: Record<string, unknown> = { recordType: "jd", region: "cn" };
const URL_FIELDS = new Set(["url", "sourceUrl"]);

const isRecord = (value: unknown): value is Loose => typeof value === "object" && value !== null && !Array.isArray(value);
const isEmpty = (value: unknown) => value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];

const emptyReport = (): ImportReport => ({
  added: [],
  updated: [],
  unchanged: [],
  merged: [],
  remapped: [],
  weakMatches: [],
  contactsAdded: [],
  contactsUpdated: [],
  contactsMerged: [],
  contactsRemapped: []
});

const idAllocator = (prefix: string, batchCode: string, used: Set<string>) => {
  let sequence = 0;
  return () => {
    let id = "";
    do {
      sequence += 1;
      id = `${prefix}${batchCode}-${String(sequence).padStart(3, "0")}`;
    } while (used.has(id));
    used.add(id);
    return id;
  };
};

const copyFacts = (target: Loose, existing: Loose, incoming: Loose, keys: readonly string[], prefix: string, fields: string[]) => {
  for (const key of keys) {
    const value = incoming[key];
    if (isEmpty(value) || SILENT_DEFAULTS[key] === value) continue;
    if (URL_FIELDS.has(key) && normalizeUrl(String(value)) === normalizeUrl(String(existing[key] || ""))) continue;
    if (!same(existing[key], value)) {
      target[key] = value;
      fields.push(`${prefix}${key}`);
    }
  }
};

const mergePostingFacts = (existing: Posting, incoming: Posting) => {
  const next = structuredClone(existing);
  const fields: string[] = [];
  copyFacts(next as unknown as Loose, existing as unknown as Loose, incoming as unknown as Loose, POSTING_FACTS, "", fields);
  copyFacts(next.eligibility as unknown as Loose, existing.eligibility as unknown as Loose, incoming.eligibility as unknown as Loose, ["bucket", "note", "graduationWindow"], "eligibility.", fields);
  copyFacts(next.dates as unknown as Loose, existing.dates as unknown as Loose, incoming.dates as unknown as Loose, ["publishedAt", "opensAt", "closesAt", "startTerm", "note", "source", "checkedAt"], "dates.", fields);
  if (incoming.dates.rolling && !existing.dates.rolling) {
    next.dates.rolling = true;
    fields.push("dates.rolling");
  }
  copyFacts(next.provenance as unknown as Loose, existing.provenance as unknown as Loose, incoming.provenance as unknown as Loose, ["sourceDate", "checkedAt"], "provenance.", fields);
  for (const key of ["contactIds", "legacyJobIds"] as const) {
    const merged = union(existing[key], incoming[key]);
    if (merged.length !== existing[key].length) {
      next[key] = merged;
      fields.push(key);
    }
  }
  for (const [key, value] of Object.entries(incoming.extra)) {
    if (value && existing.extra[key] !== value) {
      next.extra[key] = value;
      fields.push(`extra.${key}`);
    }
  }
  return { next, fields };
};

const mergeContactFacts = (existing: Contact, incoming: Contact) => {
  const next = structuredClone(existing);
  const fields: string[] = [];
  copyFacts(next as unknown as Loose, existing as unknown as Loose, incoming as unknown as Loose, CONTACT_FACTS, "", fields);
  const refs = new Map(existing.legacyJobRefs.map((ref) => [ref.id, ref]));
  let refsChanged = false;
  for (const ref of incoming.legacyJobRefs) {
    const known = refs.get(ref.id);
    if (!known || (!known.title && ref.title)) {
      refs.set(ref.id, ref);
      refsChanged = true;
    }
  }
  if (refsChanged) {
    next.legacyJobRefs = [...refs.values()];
    fields.push("legacyJobRefs");
  }
  return { next, fields };
};

const sameName = (a: Contact, b: Contact) => normalizeTitle(a.name) !== "" && normalizeTitle(a.name) === normalizeTitle(b.name);

// The same id across batches only counts as the same posting when the URL or the title still agrees.
const samePosting = (a: Posting, b: Posting) =>
  (normalizeUrl(a.url) !== "" && normalizeUrl(a.url) === normalizeUrl(b.url)) || normalizeTitle(a.title) === normalizeTitle(b.title);

export const importBatch = (
  current: { postings: PostingsFile; contacts: ContactsFile },
  batch: { postings: Posting[]; contacts: Contact[] },
  options: { batchCode: string; now: string }
) => {
  const report = emptyReport();
  const contacts = current.contacts.contacts.map((contact) => structuredClone(contact));
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]));
  const contactByEmail = new Map(contacts.filter((contact) => contact.email).map((contact) => [contact.email.toLowerCase(), contact]));
  const newContactId = idAllocator("C", options.batchCode, new Set([...contactById.keys(), ...batch.contacts.map((contact) => contact.id)]));
  const contactIdMap = new Map<string, string>();

  const saveContact = (contact: Contact) => {
    const index = contacts.findIndex((item) => item.id === contact.id);
    if (index >= 0) contacts[index] = contact;
    else contacts.push(contact);
    contactById.set(contact.id, contact);
    if (contact.email) contactByEmail.set(contact.email.toLowerCase(), contact);
  };

  // An email identifies a contact; a bare id only does when the names agree and one side lacks an email.
  const resolveContact = (incoming: Contact) => {
    const byEmail = incoming.email ? contactByEmail.get(incoming.email.toLowerCase()) : undefined;
    if (byEmail) return byEmail;
    const byId = contactById.get(incoming.id);
    return byId && (!byId.email || !incoming.email) && sameName(byId, incoming) ? byId : undefined;
  };

  for (const incoming of batch.contacts) {
    const target = resolveContact(incoming);
    if (!target) {
      const id = contactById.has(incoming.id) ? newContactId() : incoming.id;
      if (id !== incoming.id) report.contactsRemapped.push({ from: incoming.id, to: id });
      contactIdMap.set(incoming.id, id);
      saveContact({ ...structuredClone(incoming), id, updatedAt: options.now });
      report.contactsAdded.push(id);
      continue;
    }
    if (target.id !== incoming.id) report.contactsMerged.push({ incomingId: incoming.id, existingId: target.id });
    contactIdMap.set(incoming.id, target.id);
    const { next, fields } = mergeContactFacts(target, incoming);
    if (fields.length > 0) {
      next.updatedAt = options.now;
      saveContact(next);
      report.contactsUpdated.push({ id: target.id, fields });
    }
  }

  const postings = current.postings.postings.map((posting) => structuredClone(posting));
  const postingById = new Map(postings.map((posting) => [posting.id, posting]));
  const newPostingId = idAllocator("P", options.batchCode, new Set([...postingById.keys(), ...batch.postings.map((posting) => posting.id)]));

  for (const raw of batch.postings) {
    const incoming = structuredClone(raw);
    incoming.contactIds = incoming.contactIds.map((id) => contactIdMap.get(id) || id);
    const byId = postingById.get(incoming.id);
    let target = byId && samePosting(byId, incoming) ? byId : undefined;
    if (!target) {
      const candidate = { company: incoming.company, title: incoming.title, url: incoming.url };
      const strong = findDuplicates(candidate, postings).find((match) => match.strength === "strong");
      if (strong) {
        target = postingById.get(strong.id);
        report.merged.push({ incomingId: incoming.id, existingId: strong.id, reason: strong.reason });
      }
    }
    if (!target) {
      if (byId) {
        const id = newPostingId();
        report.remapped.push({ from: incoming.id, to: id });
        incoming.id = id;
      }
      const weak = findDuplicates(incoming, postings).filter((match) => match.strength === "weak");
      if (weak.length > 0) report.weakMatches.push({ id: incoming.id, matches: weak });
      incoming.updatedAt = options.now;
      postings.push(incoming);
      postingById.set(incoming.id, incoming);
      report.added.push(incoming.id);
      continue;
    }
    const { next, fields } = mergePostingFacts(target, incoming);
    if (fields.length === 0) {
      report.unchanged.push(target.id);
      continue;
    }
    next.updatedAt = options.now;
    postings[postings.findIndex((posting) => posting.id === target.id)] = next;
    postingById.set(next.id, next);
    report.updated.push({ id: next.id, fields });
  }

  const postingsChanged = report.added.length + report.updated.length > 0;
  const contactsChanged = report.contactsAdded.length + report.contactsUpdated.length > 0;
  return {
    postings: { ...current.postings, updatedAt: postingsChanged ? options.now : current.postings.updatedAt, postings },
    contacts: { ...current.contacts, updatedAt: contactsChanged ? options.now : current.contacts.updatedAt, contacts },
    report
  };
};

export type BatchFormat = "tracker" | "codex-internships" | "codex-contacts" | "patch";

const firstRecord = (value: unknown) => (Array.isArray(value) ? value.find(isRecord) : undefined);

export const detectBatchFormat = (value: unknown): BatchFormat => {
  if (isRecord(value)) {
    if (Array.isArray(value.patches)) return "patch";
    if (Array.isArray(value.internships)) return "codex-internships";
    return "tracker";
  }
  const sample = firstRecord(value);
  if (!sample) return "tracker";
  if ("parent_company" in sample || "record_type" in sample || "fit_reason" in sample) return "codex-internships";
  if ("why_contact" in sample || "relation_label" in sample || "outreach_gate" in sample) return "codex-contacts";
  if ("id" in sample && !("title" in sample) && !("company" in sample)) return "patch";
  return "tracker";
};

// Turns a tracker-format batch into postings and contacts: postings without an id get a
// free P<date>-<sequence> number, and the company tier and programme tag come from the taxonomy.
export const prepareTrackerBatch = (
  raw: unknown,
  options: { existingIds: Iterable<string>; taxonomy: Taxonomy; batch: string; batchCode: string; now: string }
) => {
  const warnings: string[] = [];
  const source = isRecord(raw) ? raw : {};
  const records = (Array.isArray(raw) ? raw : Array.isArray(source.postings) ? source.postings : []).filter(isRecord);
  const used = new Set([...options.existingIds, ...records.map((record) => (typeof record.id === "string" ? record.id : "")).filter(Boolean)]);
  const nextId = idAllocator("P", options.batchCode, used);
  const postings = records
    .map((record) => {
      const posting = normalizePosting({ ...record, id: record.id || nextId(), updatedAt: options.now }, warnings);
      if (!posting) return null;
      posting.provenance.batch ||= options.batch;
      posting.companyTier ||= options.taxonomy.companyTiers[posting.company] || "";
      posting.programTag ||= applyProgramRules(posting.program, posting.company, options.taxonomy.programRules);
      return posting;
    })
    .filter((posting): posting is Posting => posting !== null);
  const contacts = (Array.isArray(source.contacts) ? source.contacts : [])
    .filter(isRecord)
    .map((record) => normalizeContact({ ...record, updatedAt: options.now }, warnings))
    .filter((contact): contact is Contact => contact !== null);
  return { postings, contacts, warnings };
};

export const describeImport = (report: ImportReport, batch: string, skipped: string[] = []) => {
  const lines = [
    `批次 ${batch}：新增岗位 ${report.added.length}，更新 ${report.updated.length}，未变化 ${report.unchanged.length}，合并重复 ${report.merged.length}，重新编号 ${report.remapped.length}`,
    `联系人：新增 ${report.contactsAdded.length}，更新 ${report.contactsUpdated.length}，合并 ${report.contactsMerged.length}，重新编号 ${report.contactsRemapped.length}`
  ];
  for (const item of report.updated) lines.push(`更新 ${item.id}：${item.fields.join("、")}`);
  for (const item of report.merged) lines.push(`合并 ${item.incomingId} → ${item.existingId}（${item.reason}）`);
  for (const item of report.remapped) lines.push(`编号冲突 ${item.from} → ${item.to}`);
  for (const item of report.weakMatches) lines.push(`请人工确认 ${item.id}：与 ${item.matches.map((match) => match.id).join("、")} 网址相同`);
  for (const item of report.contactsMerged) lines.push(`联系人合并 ${item.incomingId} → ${item.existingId}`);
  for (const item of report.contactsRemapped) lines.push(`联系人编号冲突 ${item.from} → ${item.to}`);
  if (skipped.length > 0) lines.push(`跳过 ${skipped.length} 条受限记录：${skipped.join("、")}`);
  return lines;
};

// Patches set exactly the fields they name, including clearing a value with null.
export const applyPostingPatches = (file: PostingsFile, patches: unknown[], now: string) => {
  const postings = file.postings.map((posting) => structuredClone(posting));
  const updated: { id: string; fields: string[] }[] = [];
  const missing: string[] = [];
  for (const raw of patches) {
    const patch = isRecord(raw) ? raw : {};
    const id = typeof patch.id === "string" ? patch.id : "";
    const index = postings.findIndex((posting) => posting.id === id);
    if (index < 0) {
      missing.push(id);
      continue;
    }
    const merged = structuredClone(postings[index]) as unknown as Loose;
    const fields: string[] = [];
    for (const [key, value] of Object.entries(patch)) {
      if (key === "id" || key === "updatedAt") continue;
      if (!(key in merged)) throw new Error(`补丁 ${id} 含有未知字段：${key}`);
      const currentValue = merged[key];
      if (isRecord(value) && isRecord(currentValue)) {
        for (const [subKey, subValue] of Object.entries(value)) {
          if (!(subKey in currentValue)) throw new Error(`补丁 ${id} 含有未知字段：${key}.${subKey}`);
          if (!same(currentValue[subKey], subValue)) {
            currentValue[subKey] = subValue;
            fields.push(`${key}.${subKey}`);
          }
        }
      } else if (!same(currentValue, value)) {
        merged[key] = value;
        fields.push(key);
      }
    }
    if (fields.length === 0) continue;
    const warnings: string[] = [];
    const normalized = normalizePosting({ ...merged, updatedAt: now }, warnings);
    if (!normalized || warnings.length > 0) throw new Error(`补丁 ${id} 无效：${warnings.join("；")}`);
    postings[index] = normalized;
    updated.push({ id, fields });
  }
  return {
    file: { ...file, updatedAt: updated.length > 0 ? now : file.updatedAt, postings },
    report: { updated, missing }
  };
};
