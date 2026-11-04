import { isIsoDate } from "./dates.ts";
import {
  CHANNELS,
  CONTACT_STATUSES,
  EVENT_TYPES,
  POSTING_STATUSES,
  RECORD_TYPES,
  REGIONS,
  SCHEMA_VERSION
} from "./types.ts";
import type {
  Channel,
  CompanyNote,
  Contact,
  ContactProgress,
  ContactsFile,
  FileKey,
  LegacyJobRef,
  Posting,
  PostingProgress,
  PostingsFile,
  ProgramRule,
  ProgressFile,
  Snapshot,
  Taxonomy,
  TrackerEvent
} from "./types.ts";

export interface NormalizeResult<T> {
  value: T;
  warnings: string[];
}

type Loose = Record<string, unknown>;

const isRecord = (value: unknown): value is Loose => typeof value === "object" && value !== null && !Array.isArray(value);
const asRecord = (value: unknown): Loose => (isRecord(value) ? value : {});
const text = (value: unknown) => (typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "");
const flag = (value: unknown) => value === true;
const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  (options as readonly unknown[]).includes(value) ? (value as T) : fallback;
const unique = (items: string[]) => [...new Set(items.filter(Boolean))];
const stringArray = (value: unknown) => (Array.isArray(value) ? unique(value.map(text)) : []);
// Codex batches join multi-valued fields with " / "; tags themselves may contain a bare slash.
const textList = (value: unknown) => (typeof value === "string" ? unique(value.split(/\s+\/\s+/).map(text)) : stringArray(value));
const priorityOf = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 5 ? number : null;
};
const stringMap = (value: unknown) =>
  Object.fromEntries(Object.entries(asRecord(value)).map(([key, item]) => [key, text(item)]).filter(([, item]) => item !== ""));
const dateOf = (value: unknown, label: string, warnings: string[]) => {
  if (value === null || value === undefined || value === "") return null;
  if (isIsoDate(value)) return value;
  warnings.push(`${label} 的日期无效：${String(value)}`);
  return null;
};
const byKey = <T>(map: Record<string, T>) => Object.fromEntries(Object.entries(map).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

const checkVersion = (source: Loose, name: string) => {
  const version = source.schemaVersion === undefined ? SCHEMA_VERSION : Number(source.schemaVersion);
  if (!Number.isFinite(version) || version > SCHEMA_VERSION) {
    throw new Error(`${name} 的数据版本 ${String(source.schemaVersion)} 比页面支持的版本 ${SCHEMA_VERSION} 新，请先更新页面代码`);
  }
};

export const emptyTaxonomy = (): Taxonomy => ({ companyTiers: {}, programRules: [], focusOrder: [] });

export const emptyPostingsFile = (): PostingsFile => ({ schemaVersion: SCHEMA_VERSION, updatedAt: "", taxonomy: emptyTaxonomy(), postings: [] });

export const emptyContactsFile = (): ContactsFile => ({ schemaVersion: SCHEMA_VERSION, updatedAt: "", contacts: [] });

export const emptyProgressFile = (): ProgressFile => ({
  schemaVersion: SCHEMA_VERSION,
  updatedAt: "",
  settings: { followUpDays: 7, updatedAt: "" },
  postings: {},
  contacts: {},
  companies: {},
  events: []
});

export const defaultPostingProgress = (updatedAt = ""): PostingProgress => ({
  status: "todo",
  starred: false,
  appliedAt: null,
  appliedRole: "",
  channel: "",
  referrer: "",
  nextAction: "",
  followUpAt: null,
  notes: "",
  updatedAt
});

export const defaultContactProgress = (updatedAt = ""): ContactProgress => ({
  status: "none",
  lastContactAt: null,
  followUpAt: null,
  notes: "",
  updatedAt
});

export const normalizeTaxonomy = (raw: unknown): Taxonomy => {
  const source = asRecord(raw);
  const programRules = (Array.isArray(source.programRules) ? source.programRules : [])
    .map((item): ProgramRule => {
      const rule = asRecord(item);
      const normalized: ProgramRule = { tag: text(rule.tag), include: stringArray(rule.include) };
      const exclude = stringArray(rule.exclude);
      if (exclude.length > 0) normalized.exclude = exclude;
      if (text(rule.company)) normalized.company = text(rule.company);
      return normalized;
    })
    .filter((rule) => rule.tag !== "" && rule.include.length > 0);
  return { companyTiers: stringMap(source.companyTiers), programRules, focusOrder: stringArray(source.focusOrder) };
};

export const normalizePosting = (raw: unknown, warnings: string[]): Posting | null => {
  if (!isRecord(raw)) {
    warnings.push("跳过一条不是对象的岗位记录");
    return null;
  }
  const id = text(raw.id);
  const title = text(raw.title);
  if (!id || !title) {
    warnings.push(`跳过缺少编号或岗位名的岗位记录：${id || title || "（空）"}`);
    return null;
  }
  const label = `岗位 ${id}`;
  const dates = asRecord(raw.dates);
  const eligibility = asRecord(raw.eligibility);
  const provenance = asRecord(raw.provenance);
  return {
    id,
    company: text(raw.company),
    team: text(raw.team),
    companyTier: text(raw.companyTier),
    title,
    program: text(raw.program),
    programTag: text(raw.programTag),
    recordType: oneOf(raw.recordType, RECORD_TYPES, "jd"),
    internshipType: text(raw.internshipType),
    region: oneOf(raw.region, REGIONS, "cn"),
    location: text(raw.location),
    focus: textList(raw.focus),
    requirements: text(raw.requirements),
    duration: text(raw.duration),
    jd: text(raw.jd),
    fit: text(raw.fit),
    fitReason: text(raw.fitReason),
    gaps: text(raw.gaps),
    priority: priorityOf(raw.priority),
    eligibility: {
      bucket: text(eligibility.bucket),
      note: text(eligibility.note),
      graduationWindow: text(eligibility.graduationWindow)
    },
    url: text(raw.url),
    sourceUrl: text(raw.sourceUrl),
    dates: {
      publishedAt: dateOf(dates.publishedAt, label, warnings),
      opensAt: dateOf(dates.opensAt, label, warnings),
      closesAt: dateOf(dates.closesAt, label, warnings),
      rolling: flag(dates.rolling),
      startTerm: text(dates.startTerm),
      note: text(dates.note),
      source: text(dates.source),
      checkedAt: dateOf(dates.checkedAt, label, warnings)
    },
    siteStatus: text(raw.siteStatus),
    contactIds: textList(raw.contactIds),
    legacyJobIds: textList(raw.legacyJobIds),
    provenance: {
      batch: text(provenance.batch),
      origin: text(provenance.origin),
      sourceDate: text(provenance.sourceDate),
      checkedAt: dateOf(provenance.checkedAt, label, warnings),
      sourceFile: text(provenance.sourceFile)
    },
    updatedAt: text(raw.updatedAt),
    archived: flag(raw.archived),
    extra: stringMap(raw.extra)
  };
};

const normalizeLegacyRefs = (value: unknown): LegacyJobRef[] =>
  (Array.isArray(value) ? value : [])
    .map((item) => {
      const ref = asRecord(item);
      return { id: text(ref.id), title: text(ref.title), url: text(ref.url) };
    })
    .filter((ref) => ref.id !== "");

export const normalizeContact = (raw: unknown, warnings: string[]): Contact | null => {
  if (!isRecord(raw)) {
    warnings.push("跳过一条不是对象的联系人记录");
    return null;
  }
  const id = text(raw.id);
  const name = text(raw.name);
  const email = text(raw.email);
  if (!id || (!name && !email)) {
    warnings.push(`跳过缺少编号或姓名/邮箱的联系人记录：${id || name || email || "（空）"}`);
    return null;
  }
  return {
    id,
    company: text(raw.company),
    organization: text(raw.organization),
    name,
    role: text(raw.role),
    email,
    emailType: text(raw.emailType),
    contactType: text(raw.contactType),
    interests: text(raw.interests),
    whyContact: text(raw.whyContact),
    relationLevel: text(raw.relationLevel),
    relationLabel: text(raw.relationLabel),
    relationEvidence: text(raw.relationEvidence),
    relationScope: text(raw.relationScope),
    exactJobOwnerConfirmed: typeof raw.exactJobOwnerConfirmed === "boolean" ? raw.exactJobOwnerConfirmed : null,
    specificJdRelation: text(raw.specificJdRelation),
    jobMappingScope: text(raw.jobMappingScope),
    outreachGate: text(raw.outreachGate),
    caveats: text(raw.caveats),
    recruitingStatus: text(raw.recruitingStatus),
    priority: priorityOf(raw.priority),
    sourceUrl: text(raw.sourceUrl),
    affiliationUrl: text(raw.affiliationUrl),
    legacyJobRefs: normalizeLegacyRefs(raw.legacyJobRefs),
    origin: text(raw.origin),
    checkedAt: dateOf(raw.checkedAt, `联系人 ${id}`, warnings),
    sourceDate: text(raw.sourceDate),
    updatedAt: text(raw.updatedAt),
    archived: flag(raw.archived)
  };
};

export const normalizePostingsFile = (raw: unknown): NormalizeResult<PostingsFile> => {
  const source = asRecord(raw);
  checkVersion(source, "postings.json");
  const warnings: string[] = [];
  const postings = (Array.isArray(source.postings) ? source.postings : [])
    .map((item) => normalizePosting(item, warnings))
    .filter((posting): posting is Posting => posting !== null);
  return {
    value: { schemaVersion: SCHEMA_VERSION, updatedAt: text(source.updatedAt), taxonomy: normalizeTaxonomy(source.taxonomy), postings },
    warnings
  };
};

export const normalizeContactsFile = (raw: unknown): NormalizeResult<ContactsFile> => {
  const source = asRecord(raw);
  checkVersion(source, "contacts.json");
  const warnings: string[] = [];
  const contacts = (Array.isArray(source.contacts) ? source.contacts : [])
    .map((item) => normalizeContact(item, warnings))
    .filter((contact): contact is Contact => contact !== null);
  return { value: { schemaVersion: SCHEMA_VERSION, updatedAt: text(source.updatedAt), contacts }, warnings };
};

const normalizePostingProgress = (raw: unknown, id: string, warnings: string[]): PostingProgress => {
  const value = asRecord(raw);
  const label = `进度 ${id}`;
  const status = oneOf(value.status, POSTING_STATUSES, "todo");
  if (value.status !== undefined && status !== value.status) warnings.push(`${label} 的状态无效，已重置为未开始`);
  return {
    status,
    starred: flag(value.starred),
    appliedAt: dateOf(value.appliedAt, label, warnings),
    appliedRole: text(value.appliedRole),
    channel: oneOf<Channel | "">(value.channel, CHANNELS, ""),
    referrer: text(value.referrer),
    nextAction: text(value.nextAction),
    followUpAt: dateOf(value.followUpAt, label, warnings),
    notes: text(value.notes),
    updatedAt: text(value.updatedAt)
  };
};

const normalizeContactProgress = (raw: unknown, id: string, warnings: string[]): ContactProgress => {
  const value = asRecord(raw);
  const label = `联系人进度 ${id}`;
  const status = oneOf(value.status, CONTACT_STATUSES, "none");
  if (value.status !== undefined && status !== value.status) warnings.push(`${label} 的状态无效，已重置为未联系`);
  return {
    status,
    lastContactAt: dateOf(value.lastContactAt, label, warnings),
    followUpAt: dateOf(value.followUpAt, label, warnings),
    notes: text(value.notes),
    updatedAt: text(value.updatedAt)
  };
};

const normalizeEvent = (raw: unknown, warnings: string[]): TrackerEvent | null => {
  const value = asRecord(raw);
  const id = text(value.id);
  if (!id || !isIsoDate(value.date)) {
    warnings.push(`跳过无效的事件记录：${id || "（无编号）"}`);
    return null;
  }
  return {
    id,
    date: value.date,
    type: oneOf(value.type, EVENT_TYPES, "note"),
    postingId: text(value.postingId) || null,
    contactId: text(value.contactId) || null,
    note: text(value.note),
    createdAt: text(value.createdAt),
    updatedAt: text(value.updatedAt),
    deleted: flag(value.deleted)
  };
};

export const normalizeProgressFile = (raw: unknown): NormalizeResult<ProgressFile> => {
  const source = asRecord(raw);
  checkVersion(source, "progress.json");
  const warnings: string[] = [];
  const settings = asRecord(source.settings);
  const followUpDays = Number(settings.followUpDays);
  const companies: Record<string, CompanyNote> = {};
  for (const [name, entry] of Object.entries(asRecord(source.companies))) {
    const note = asRecord(entry);
    companies[name] = { notes: text(note.notes), updatedAt: text(note.updatedAt) };
  }
  return {
    value: {
      schemaVersion: SCHEMA_VERSION,
      updatedAt: text(source.updatedAt),
      settings: {
        followUpDays: Number.isInteger(followUpDays) && followUpDays >= 1 && followUpDays <= 60 ? followUpDays : 7,
        updatedAt: text(settings.updatedAt)
      },
      postings: Object.fromEntries(
        Object.entries(asRecord(source.postings)).map(([id, entry]) => [id, normalizePostingProgress(entry, id, warnings)])
      ),
      contacts: Object.fromEntries(
        Object.entries(asRecord(source.contacts)).map(([id, entry]) => [id, normalizeContactProgress(entry, id, warnings)])
      ),
      companies,
      events: (Array.isArray(source.events) ? source.events : [])
        .map((item) => normalizeEvent(item, warnings))
        .filter((event): event is TrackerEvent => event !== null)
    },
    warnings
  };
};

export const validateSnapshot = (snapshot: Snapshot) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const postingIds = new Set<string>();
  const contactIds = new Set<string>();
  for (const posting of snapshot.postings.postings) {
    if (postingIds.has(posting.id)) errors.push(`岗位编号重复：${posting.id}`);
    postingIds.add(posting.id);
  }
  for (const contact of snapshot.contacts.contacts) {
    if (contactIds.has(contact.id)) errors.push(`联系人编号重复：${contact.id}`);
    contactIds.add(contact.id);
  }
  for (const posting of snapshot.postings.postings) {
    for (const contactId of posting.contactIds) {
      if (!contactIds.has(contactId)) errors.push(`岗位 ${posting.id} 关联的联系人 ${contactId} 不存在`);
    }
    const { opensAt, closesAt } = posting.dates;
    if (opensAt && closesAt && opensAt > closesAt) warnings.push(`岗位 ${posting.id} 的开放日期晚于截止日期`);
  }
  for (const id of Object.keys(snapshot.progress.postings)) {
    if (!postingIds.has(id)) warnings.push(`进度里的岗位 ${id} 不在岗位表中`);
  }
  for (const id of Object.keys(snapshot.progress.contacts)) {
    if (!contactIds.has(id)) warnings.push(`进度里的联系人 ${id} 不在联系人表中`);
  }
  const eventIds = new Set<string>();
  for (const event of snapshot.progress.events) {
    if (eventIds.has(event.id)) errors.push(`事件编号重复：${event.id}`);
    eventIds.add(event.id);
    if (event.postingId && !postingIds.has(event.postingId)) warnings.push(`事件 ${event.id} 关联的岗位 ${event.postingId} 不存在`);
    if (event.contactId && !contactIds.has(event.contactId)) warnings.push(`事件 ${event.id} 关联的联系人 ${event.contactId} 不存在`);
  }
  return { errors, warnings };
};

// Progress maps are written in key order so repeated saves produce small, readable diffs.
export const serializeFile = (key: FileKey, file: unknown) => {
  let value = file;
  if (key === "progress") {
    const progress = file as ProgressFile;
    value = { ...progress, postings: byKey(progress.postings), contacts: byKey(progress.contacts), companies: byKey(progress.companies) };
  }
  return `${JSON.stringify(value, null, 2)}\n`;
};
