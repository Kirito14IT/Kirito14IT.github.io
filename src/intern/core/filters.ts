import { deadlineState } from "./dates.ts";
import { progressOf } from "./stats.ts";
import { ENDED_STATUSES, FIT_LEVELS, POSTING_STATUSES, RECORD_TYPE_LABELS, RECORD_TYPES, REGION_LABELS, REGIONS, STATUS_LABELS } from "./types.ts";
import type { Contact, Posting, PostingProgress, ProgressFile } from "./types.ts";

export const FACET_KEYS = ["region", "company", "tier", "focus", "recordType", "program", "fit", "priority", "eligibility", "status", "deadline", "batch"] as const;
export type FacetKey = (typeof FACET_KEYS)[number];
export const SORT_KEYS = ["priority", "deadline", "fit", "updated", "company"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
const FLAG_KEYS = ["hasEmail", "starred", "showEnded", "showArchived"] as const;

export type PostingFilters = {
  q: string;
  sort: SortKey;
  hasEmail: boolean;
  starred: boolean;
  showEnded: boolean;
  showArchived: boolean;
} & Record<FacetKey, string[]>;

export interface FilterContext {
  progress: ProgressFile;
  contactsById: Map<string, Contact>;
  today: string;
  focusOrder: string[];
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export const FACET_LABELS: Record<FacetKey, string> = {
  region: "地区",
  company: "公司",
  tier: "公司类型",
  focus: "方向",
  recordType: "类型",
  program: "人才计划",
  fit: "匹配度",
  priority: "优先级",
  eligibility: "资格",
  status: "我的状态",
  deadline: "截止",
  batch: "来源批次"
};

export const DEADLINE_BUCKETS = ["soon", "month", "later", "rolling", "unknown", "overdue"] as const;
const DEADLINE_LABELS: Record<string, string> = {
  soon: "7 天内",
  month: "8–30 天",
  later: "30 天后",
  rolling: "滚动招聘",
  unknown: "未公布",
  overdue: "已截止"
};

const NONE = "none";
const NONE_LABELS: Partial<Record<FacetKey, string>> = {
  tier: "未分类",
  focus: "未标注",
  program: "非人才计划",
  fit: "未评估",
  priority: "未定",
  eligibility: "未标注",
  batch: "未知批次"
};

// Fixed orders for facets whose values have a natural sequence; others sort by count.
const FIXED_ORDER: Partial<Record<FacetKey, readonly string[]>> = {
  region: REGIONS,
  recordType: RECORD_TYPES,
  status: POSTING_STATUSES,
  deadline: DEADLINE_BUCKETS,
  fit: FIT_LEVELS,
  priority: ["1", "2", "3", "4", "5"]
};

export const emptyFilters = (): PostingFilters => ({
  q: "",
  sort: "priority",
  hasEmail: false,
  starred: false,
  showEnded: false,
  showArchived: false,
  region: [],
  company: [],
  tier: [],
  focus: [],
  recordType: [],
  program: [],
  fit: [],
  priority: [],
  eligibility: [],
  status: [],
  deadline: [],
  batch: []
});

export const facetValues = (posting: Posting, key: FacetKey, ctx: FilterContext): string[] => {
  switch (key) {
    case "region":
      return [posting.region];
    case "company":
      return [posting.company];
    case "tier":
      return [posting.companyTier || NONE];
    case "focus":
      return posting.focus.length > 0 ? posting.focus : [NONE];
    case "recordType":
      return [posting.recordType];
    case "program":
      return [posting.programTag || NONE];
    case "fit":
      return [posting.fit || NONE];
    case "priority":
      return [posting.priority ? String(posting.priority) : NONE];
    case "eligibility":
      return [posting.eligibility.bucket || NONE];
    case "status":
      return [progressOf(ctx.progress, posting.id).status];
    case "deadline": {
      const { kind } = deadlineState(posting.dates, ctx.today);
      return [kind === "today" ? "soon" : kind];
    }
    case "batch":
      return [posting.provenance.batch || NONE];
  }
};

export const facetLabel = (key: FacetKey, value: string) => {
  if (value === NONE) return NONE_LABELS[key] || "未标注";
  if (key === "region") return REGION_LABELS[value as keyof typeof REGION_LABELS] || value;
  if (key === "recordType") return RECORD_TYPE_LABELS[value as keyof typeof RECORD_TYPE_LABELS] || value;
  if (key === "status") return STATUS_LABELS[value as keyof typeof STATUS_LABELS] || value;
  if (key === "deadline") return DEADLINE_LABELS[value] || value;
  if (key === "priority") return `P${value}`;
  return value;
};

export const facetOptions = (key: FacetKey, postings: readonly Posting[], ctx: FilterContext): FacetOption[] => {
  const counts = new Map<string, number>();
  for (const posting of postings) {
    for (const value of facetValues(posting, key, ctx)) counts.set(value, (counts.get(value) || 0) + 1);
  }
  const fixed = FIXED_ORDER[key];
  const position = (value: string) => {
    if (value === NONE) return Number.MAX_SAFE_INTEGER;
    const list = fixed || (key === "focus" ? ctx.focusOrder : []);
    const index = list.indexOf(value);
    return index < 0 ? list.length : index;
  };
  return [...counts.entries()]
    .sort(([a, aCount], [b, bCount]) => position(a) - position(b) || (fixed ? 0 : bCount - aCount) || a.localeCompare(b, "zh-CN"))
    .map(([value, count]) => ({ value, label: facetLabel(key, value), count }));
};

const normalizeText = (value: string) => value.normalize("NFKC").toLowerCase();

const haystack = (posting: Posting, entry: PostingProgress, ctx: FilterContext) => {
  const contacts = posting.contactIds
    .map((id) => ctx.contactsById.get(id))
    .flatMap((contact) => (contact ? [contact.name, contact.email, contact.organization] : []));
  return normalizeText(
    [
      posting.id,
      posting.title,
      posting.company,
      posting.team,
      posting.program,
      posting.programTag,
      posting.location,
      posting.internshipType,
      posting.jd,
      posting.requirements,
      posting.fitReason,
      posting.gaps,
      posting.eligibility.note,
      posting.dates.note,
      posting.dates.startTerm,
      entry.notes,
      entry.appliedRole,
      entry.nextAction,
      entry.referrer,
      ...contacts
    ].join("\n")
  );
};

export const matchesFilters = (posting: Posting, filters: PostingFilters, ctx: FilterContext) => {
  if (posting.archived && !filters.showArchived) return false;
  const entry = progressOf(ctx.progress, posting.id);
  if (ENDED_STATUSES.includes(entry.status) && !filters.showEnded && !filters.status.includes(entry.status)) return false;
  for (const key of FACET_KEYS) {
    const selected = filters[key];
    if (selected.length > 0 && !facetValues(posting, key, ctx).some((value) => selected.includes(value))) return false;
  }
  if (filters.starred && !entry.starred) return false;
  if (filters.hasEmail && !posting.contactIds.some((id) => ctx.contactsById.get(id)?.email)) return false;
  const tokens = normalizeText(filters.q).split(/\s+/).filter(Boolean);
  if (tokens.length > 0) {
    const text = haystack(posting, entry, ctx);
    if (!tokens.every((token) => text.includes(token))) return false;
  }
  return true;
};

const fitIndex = (posting: Posting) => {
  const index = (FIT_LEVELS as readonly string[]).indexOf(posting.fit);
  return index < 0 ? FIT_LEVELS.length : index;
};
const priorityOf = (posting: Posting) => posting.priority ?? 99;
// Dated postings first, then rolling ones, then those without any published deadline.
const deadlineGroup = (posting: Posting) => (posting.dates.closesAt ? 0 : posting.dates.rolling ? 1 : 2);
const byDeadline = (a: Posting, b: Posting) => deadlineGroup(a) - deadlineGroup(b) || (a.dates.closesAt || "").localeCompare(b.dates.closesAt || "");
const byName = (a: Posting, b: Posting) => a.company.localeCompare(b.company, "zh-CN") || a.title.localeCompare(b.title, "zh-CN");
const byPriority = (a: Posting, b: Posting) => priorityOf(a) - priorityOf(b);
const byFit = (a: Posting, b: Posting) => fitIndex(a) - fitIndex(b);

const comparator = (sort: SortKey, ctx: FilterContext) => {
  const touched = (posting: Posting) => {
    const progressStamp = progressOf(ctx.progress, posting.id).updatedAt;
    return progressStamp > posting.updatedAt ? progressStamp : posting.updatedAt;
  };
  switch (sort) {
    case "deadline":
      return (a: Posting, b: Posting) => byDeadline(a, b) || byPriority(a, b) || byFit(a, b) || byName(a, b);
    case "fit":
      return (a: Posting, b: Posting) => byFit(a, b) || byPriority(a, b) || byDeadline(a, b) || byName(a, b);
    case "updated":
      return (a: Posting, b: Posting) => touched(b).localeCompare(touched(a)) || byPriority(a, b) || byName(a, b);
    case "company":
      return (a: Posting, b: Posting) => byName(a, b) || byPriority(a, b);
    default:
      return (a: Posting, b: Posting) => byPriority(a, b) || byFit(a, b) || byDeadline(a, b) || byName(a, b);
  }
};

export const filterPostings = (postings: readonly Posting[], filters: PostingFilters, ctx: FilterContext) =>
  postings.filter((posting) => matchesFilters(posting, filters, ctx)).sort(comparator(filters.sort, ctx));

export const filtersToParams = (filters: PostingFilters) => {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  for (const key of FACET_KEYS) {
    for (const value of filters[key]) params.append(key, value);
  }
  for (const key of FLAG_KEYS) {
    if (filters[key]) params.set(key, "1");
  }
  if (filters.sort !== "priority") params.set("sort", filters.sort);
  return params;
};

export const filtersFromParams = (params: URLSearchParams) => {
  const filters = emptyFilters();
  filters.q = params.get("q") || "";
  for (const key of FACET_KEYS) filters[key] = params.getAll(key).filter(Boolean);
  for (const key of FLAG_KEYS) filters[key] = params.get(key) === "1";
  const sort = params.get("sort");
  if ((SORT_KEYS as readonly (string | null)[]).includes(sort)) filters.sort = sort as SortKey;
  return filters;
};
