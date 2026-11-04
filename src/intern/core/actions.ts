import { defaultContactProgress, defaultPostingProgress, normalizePosting } from "./schema.ts";
import { CONTACT_STATUS_LABELS, PIPELINE_STATUSES, STATUS_LABELS, SUBMITTED_STATUSES } from "./types.ts";
import type {
  ContactProgress,
  ContactStatus,
  EventType,
  Posting,
  PostingDates,
  PostingProgress,
  PostingStatus,
  PostingsFile,
  ProgressFile,
  TrackerEvent
} from "./types.ts";

// Edits applied to a draft inside TrackerSync.update. Each one stamps updatedAt so the
// three-way merge can tell which side changed a field last.

export interface ActionContext {
  today: string;
  now: string;
  newId: () => string;
}

export type PostingFactsPatch = Partial<Omit<Posting, "dates" | "eligibility">> & {
  dates?: Partial<PostingDates>;
  eligibility?: Partial<Posting["eligibility"]>;
};

const STATUS_EVENTS: Partial<Record<PostingStatus, EventType>> = {
  applied: "applied",
  assessment: "assessment",
  interviewing: "interview",
  offer: "offer",
  rejected: "rejected",
  withdrawn: "withdrawn"
};

const CONTACT_EVENTS: Partial<Record<ContactStatus, EventType>> = {
  sent: "email_sent",
  replied: "email_reply",
  referred: "referral"
};

// Events logged by hand move the posting forward (or end it) without a second event.
const FORWARD_BY_EVENT: Partial<Record<EventType, PostingStatus>> = {
  email_sent: "contacted",
  applied: "applied",
  assessment: "assessment",
  interview: "interviewing",
  offer: "offer"
};
const ENDING_BY_EVENT: Partial<Record<EventType, PostingStatus>> = { rejected: "rejected", withdrawn: "withdrawn" };
const CONTACT_BY_EVENT: Partial<Record<EventType, ContactStatus>> = { email_sent: "sent", email_reply: "replied", referral: "referred" };

const postingEntry = (progress: ProgressFile, id: string, now: string) => (progress.postings[id] ||= defaultPostingProgress(now));
const contactEntry = (progress: ProgressFile, id: string, now: string) => (progress.contacts[id] ||= defaultContactProgress(now));

export const updatePostingProgress = (progress: ProgressFile, id: string, patch: Partial<Omit<PostingProgress, "updatedAt">>, now: string) => {
  Object.assign(postingEntry(progress, id, now), patch, { updatedAt: now });
};

export const updateContactProgress = (progress: ProgressFile, id: string, patch: Partial<Omit<ContactProgress, "updatedAt">>, now: string) => {
  Object.assign(contactEntry(progress, id, now), patch, { updatedAt: now });
};

export const setCompanyNote = (progress: ProgressFile, company: string, notes: string, now: string) => {
  progress.companies[company] = { notes: notes.trim(), updatedAt: now };
};

export const addEvent = (
  progress: ProgressFile,
  input: Pick<TrackerEvent, "date" | "type" | "postingId" | "contactId" | "note">,
  ctx: ActionContext
) => {
  const event: TrackerEvent = { id: ctx.newId(), ...input, createdAt: ctx.now, updatedAt: ctx.now, deleted: false };
  progress.events.push(event);
  return event;
};

export const logEvent = (
  progress: ProgressFile,
  input: Pick<TrackerEvent, "date" | "type" | "postingId" | "contactId" | "note">,
  ctx: ActionContext
) => {
  const event = addEvent(progress, input, ctx);
  const contactStatus = CONTACT_BY_EVENT[input.type];
  if (input.contactId && contactStatus) {
    const entry = contactEntry(progress, input.contactId, ctx.now);
    entry.status = contactStatus;
    if (input.type !== "referral" && (!entry.lastContactAt || input.date > entry.lastContactAt)) entry.lastContactAt = input.date;
    entry.updatedAt = ctx.now;
  }
  if (input.postingId) {
    const entry = postingEntry(progress, input.postingId, ctx.now);
    const forward = FORWARD_BY_EVENT[input.type];
    const ending = ENDING_BY_EVENT[input.type];
    const current = PIPELINE_STATUSES.indexOf(entry.status);
    let changed = false;
    if (forward && current >= 0 && PIPELINE_STATUSES.indexOf(forward) > current) {
      entry.status = forward;
      changed = true;
    }
    if (ending && entry.status !== ending) {
      entry.status = ending;
      changed = true;
    }
    if (input.type === "applied" && !entry.appliedAt) {
      entry.appliedAt = input.date;
      changed = true;
    }
    if (changed) entry.updatedAt = ctx.now;
  }
  return event;
};

export const setPostingStatus = (progress: ProgressFile, id: string, status: PostingStatus, ctx: ActionContext) => {
  const entry = postingEntry(progress, id, ctx.now);
  if (entry.status === status) return false;
  const previous = entry.status;
  entry.status = status;
  if (SUBMITTED_STATUSES.includes(status) && !entry.appliedAt) entry.appliedAt = ctx.today;
  entry.updatedAt = ctx.now;
  addEvent(
    progress,
    { date: ctx.today, type: STATUS_EVENTS[status] || "status", postingId: id, contactId: null, note: `${STATUS_LABELS[previous]} → ${STATUS_LABELS[status]}` },
    ctx
  );
  return true;
};

export const nextStatus = (status: PostingStatus) => {
  const index = PIPELINE_STATUSES.indexOf(status);
  return index >= 0 && index < PIPELINE_STATUSES.length - 1 ? PIPELINE_STATUSES[index + 1] : null;
};

export const advanceTo = (progress: ProgressFile, id: string, status: PostingStatus, ctx: ActionContext) => {
  const current = PIPELINE_STATUSES.indexOf(postingEntry(progress, id, ctx.now).status);
  const target = PIPELINE_STATUSES.indexOf(status);
  return current >= 0 && target > current ? setPostingStatus(progress, id, status, ctx) : false;
};

export const toggleStar = (progress: ProgressFile, id: string, now: string) => {
  const entry = postingEntry(progress, id, now);
  entry.starred = !entry.starred;
  entry.updatedAt = now;
  return entry.starred;
};

export const deleteEvent = (progress: ProgressFile, id: string, now: string) => {
  const event = progress.events.find((item) => item.id === id);
  if (!event || event.deleted) return false;
  event.deleted = true;
  event.updatedAt = now;
  return true;
};

export const setContactStatus = (progress: ProgressFile, contactId: string, status: ContactStatus, ctx: ActionContext) => {
  const entry = contactEntry(progress, contactId, ctx.now);
  if (entry.status === status) return false;
  const previous = entry.status;
  entry.status = status;
  if (status === "sent" || status === "replied") entry.lastContactAt = ctx.today;
  entry.updatedAt = ctx.now;
  addEvent(
    progress,
    {
      date: ctx.today,
      type: CONTACT_EVENTS[status] || "note",
      postingId: null,
      contactId,
      note: `${CONTACT_STATUS_LABELS[previous]} → ${CONTACT_STATUS_LABELS[status]}`
    },
    ctx
  );
  return true;
};

export const recordEmailSent = (progress: ProgressFile, contactId: string, ctx: ActionContext, postingId?: string) => {
  const entry = contactEntry(progress, contactId, ctx.now);
  entry.status = "sent";
  entry.lastContactAt = ctx.today;
  entry.updatedAt = ctx.now;
  addEvent(progress, { date: ctx.today, type: "email_sent", postingId: postingId || null, contactId, note: "" }, ctx);
  if (postingId) advanceTo(progress, postingId, "contacted", ctx);
};

export const nextPostingId = (postings: readonly Posting[], today: string) => {
  const taken = new Set(postings.map((posting) => posting.id));
  const prefix = `P${today.replaceAll("-", "")}-`;
  let sequence = 1;
  while (taken.has(`${prefix}${String(sequence).padStart(3, "0")}`)) sequence += 1;
  return `${prefix}${String(sequence).padStart(3, "0")}`;
};

const validPosting = (raw: Record<string, unknown>, label: string) => {
  const warnings: string[] = [];
  const posting = normalizePosting(raw, warnings);
  if (!posting || warnings.length > 0) throw new Error(`${label}：${warnings.join("；") || "缺少公司或岗位名"}`);
  return posting;
};

export const createManualPosting = (input: Record<string, unknown> & { company: string; title: string }, ctx: { id: string; now: string; today: string }) =>
  validPosting(
    { ...input, id: ctx.id, provenance: { batch: "manual", origin: "页面新增", checkedAt: ctx.today }, updatedAt: ctx.now },
    "无法新增岗位"
  );

export const updatePostingFacts = (file: PostingsFile, id: string, patch: PostingFactsPatch, now: string) => {
  const index = file.postings.findIndex((posting) => posting.id === id);
  if (index < 0) throw new Error(`找不到岗位 ${id}`);
  const current = file.postings[index];
  file.postings[index] = validPosting(
    {
      ...current,
      ...patch,
      id,
      dates: { ...current.dates, ...patch.dates },
      eligibility: { ...current.eligibility, ...patch.eligibility },
      updatedAt: now
    },
    `岗位 ${id} 的修改无效`
  );
};
