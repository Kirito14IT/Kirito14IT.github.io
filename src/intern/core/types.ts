// Data shapes for the private progress page. The records themselves live in a
// separate private repository; this module only describes their structure.

export const SCHEMA_VERSION = 1;

export const POSTING_STATUSES = [
  "todo",
  "preparing",
  "contacted",
  "applied",
  "assessment",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
  "closed"
] as const;
export type PostingStatus = (typeof POSTING_STATUSES)[number];

export const PIPELINE_STATUSES: readonly PostingStatus[] = ["todo", "preparing", "contacted", "applied", "assessment", "interviewing", "offer"];
export const IN_FLIGHT_STATUSES: readonly PostingStatus[] = ["applied", "assessment", "interviewing"];
export const ENDED_STATUSES: readonly PostingStatus[] = ["rejected", "withdrawn", "closed"];
export const SUBMITTED_STATUSES: readonly PostingStatus[] = ["applied", "assessment", "interviewing", "offer", "rejected"];

export const STATUS_LABELS: Record<PostingStatus, string> = {
  todo: "未开始",
  preparing: "准备中",
  contacted: "已联系",
  applied: "已投递",
  assessment: "笔试/测评",
  interviewing: "面试中",
  offer: "Offer",
  rejected: "未通过",
  withdrawn: "已放弃",
  closed: "已关闭"
};

export const CHANNELS = ["official", "email", "referral", "hr", "other"] as const;
export type Channel = (typeof CHANNELS)[number];
export const CHANNEL_LABELS: Record<Channel, string> = {
  official: "官网",
  email: "邮件直联",
  referral: "内推",
  hr: "HR",
  other: "其他"
};

export const CONTACT_STATUSES = ["none", "drafted", "sent", "replied", "referred", "declined", "no_reply"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  none: "未联系",
  drafted: "已起草",
  sent: "已发送",
  replied: "已回复",
  referred: "已转介",
  declined: "婉拒",
  no_reply: "未回复"
};

export const EVENT_TYPES = [
  "note",
  "status",
  "email_sent",
  "email_reply",
  "applied",
  "referral",
  "assessment",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "follow_up"
] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export const EVENT_LABELS: Record<EventType, string> = {
  note: "备注",
  status: "状态变更",
  email_sent: "发送邮件",
  email_reply: "收到回复",
  applied: "提交投递",
  referral: "内推",
  assessment: "笔试/测评",
  interview: "面试",
  offer: "Offer",
  rejected: "未通过",
  withdrawn: "放弃",
  follow_up: "跟进"
};

export const RECORD_TYPES = ["jd", "program", "mentor"] as const;
export type RecordType = (typeof RECORD_TYPES)[number];
export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  jd: "具体岗位",
  program: "计划入口",
  mentor: "导师招募"
};

export const REGIONS = ["cn", "overseas"] as const;
export type Region = (typeof REGIONS)[number];
export const REGION_LABELS: Record<Region, string> = { cn: "国内", overseas: "海外" };

// Ordered from strongest to weakest so the index doubles as a sort key.
export const FIT_LEVELS = ["高", "中高", "中", "中低", "低"] as const;

export interface PostingDates {
  publishedAt: string | null;
  opensAt: string | null;
  closesAt: string | null;
  rolling: boolean;
  startTerm: string;
  note: string;
  source: string;
  checkedAt: string | null;
}

export interface Eligibility {
  bucket: string;
  note: string;
  graduationWindow: string;
}

export interface Provenance {
  batch: string;
  origin: string;
  sourceDate: string;
  checkedAt: string | null;
  sourceFile: string;
}

export interface Posting {
  id: string;
  company: string;
  team: string;
  companyTier: string;
  title: string;
  program: string;
  programTag: string;
  recordType: RecordType;
  internshipType: string;
  region: Region;
  location: string;
  focus: string[];
  requirements: string;
  duration: string;
  jd: string;
  fit: string;
  fitReason: string;
  gaps: string;
  priority: number | null;
  eligibility: Eligibility;
  url: string;
  sourceUrl: string;
  dates: PostingDates;
  siteStatus: string;
  contactIds: string[];
  legacyJobIds: string[];
  provenance: Provenance;
  updatedAt: string;
  archived: boolean;
  extra: Record<string, string>;
}

export interface ProgramRule {
  tag: string;
  include: string[];
  exclude?: string[];
  company?: string;
}

export interface Taxonomy {
  companyTiers: Record<string, string>;
  programRules: ProgramRule[];
  focusOrder: string[];
}

export interface PostingsFile {
  schemaVersion: number;
  updatedAt: string;
  taxonomy: Taxonomy;
  postings: Posting[];
}

export interface LegacyJobRef {
  id: string;
  title: string;
  url: string;
}

export interface Contact {
  id: string;
  company: string;
  organization: string;
  name: string;
  role: string;
  email: string;
  emailType: string;
  contactType: string;
  interests: string;
  whyContact: string;
  relationLevel: string;
  relationLabel: string;
  relationEvidence: string;
  relationScope: string;
  exactJobOwnerConfirmed: boolean | null;
  specificJdRelation: string;
  jobMappingScope: string;
  outreachGate: string;
  caveats: string;
  recruitingStatus: string;
  priority: number | null;
  sourceUrl: string;
  affiliationUrl: string;
  legacyJobRefs: LegacyJobRef[];
  origin: string;
  checkedAt: string | null;
  sourceDate: string;
  updatedAt: string;
  archived: boolean;
}

export interface ContactsFile {
  schemaVersion: number;
  updatedAt: string;
  contacts: Contact[];
}

export interface PostingProgress {
  status: PostingStatus;
  starred: boolean;
  appliedAt: string | null;
  appliedRole: string;
  channel: Channel | "";
  referrer: string;
  nextAction: string;
  followUpAt: string | null;
  notes: string;
  updatedAt: string;
}

export interface ContactProgress {
  status: ContactStatus;
  lastContactAt: string | null;
  followUpAt: string | null;
  notes: string;
  updatedAt: string;
}

export interface CompanyNote {
  notes: string;
  updatedAt: string;
}

export interface TrackerEvent {
  id: string;
  date: string;
  type: EventType;
  postingId: string | null;
  contactId: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export interface ProgressSettings {
  followUpDays: number;
  updatedAt: string;
}

export interface ProgressFile {
  schemaVersion: number;
  updatedAt: string;
  settings: ProgressSettings;
  postings: Record<string, PostingProgress>;
  contacts: Record<string, ContactProgress>;
  companies: Record<string, CompanyNote>;
  events: TrackerEvent[];
}

export interface Snapshot {
  postings: PostingsFile;
  contacts: ContactsFile;
  progress: ProgressFile;
}

export type FileKey = keyof Snapshot;
export const FILE_NAMES: Record<FileKey, string> = {
  postings: "postings.json",
  contacts: "contacts.json",
  progress: "progress.json"
};
