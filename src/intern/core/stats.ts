import { addDays, daysBetween, deadlineState } from "./dates.ts";
import type { DeadlineState } from "./dates.ts";
import { defaultContactProgress, defaultPostingProgress } from "./schema.ts";
import { ENDED_STATUSES, IN_FLIGHT_STATUSES, POSTING_STATUSES, SUBMITTED_STATUSES } from "./types.ts";
import type { Contact, Posting, PostingProgress, PostingStatus, ProgressFile, TrackerEvent } from "./types.ts";

export interface DashboardStats {
  total: number;
  submitted: number;
  inFlight: number;
  offers: number;
  closingSoon: number;
  followUpsDue: number;
  statusCounts: Record<PostingStatus, number>;
}

export interface FollowUpItem {
  kind: "posting" | "contact";
  id: string;
  title: string;
  subtitle: string;
  due: string;
  reason: string;
}

export interface CompanySummary {
  company: string;
  total: number;
  submitted: number;
  inFlight: number;
  offers: number;
  conflict: boolean;
}

export const progressOf = (progress: ProgressFile, id: string) => progress.postings[id] || defaultPostingProgress();
export const contactProgressOf = (progress: ProgressFile, id: string) => progress.contacts[id] || defaultContactProgress();
export const isEnded = (status: PostingStatus) => ENDED_STATUSES.includes(status);
export const isSubmitted = (entry: PostingProgress) => SUBMITTED_STATUSES.includes(entry.status) || entry.appliedAt !== null;
const isInFlight = (entry: PostingProgress) => IN_FLIGHT_STATUSES.includes(entry.status);
const openPostings = (postings: readonly Posting[]) => postings.filter((posting) => !posting.archived);
const dueReason = (due: string, today: string) => (due === today ? "今天跟进" : `跟进已逾期 ${daysBetween(due, today)} 天`);

export const followUps = (postings: readonly Posting[], progress: ProgressFile, contacts: readonly Contact[], today: string) => {
  const items: FollowUpItem[] = [];
  for (const posting of openPostings(postings)) {
    const entry = progressOf(progress, posting.id);
    if (entry.followUpAt && entry.followUpAt <= today && !isEnded(entry.status)) {
      items.push({
        kind: "posting",
        id: posting.id,
        title: posting.title,
        subtitle: posting.company,
        due: entry.followUpAt,
        reason: entry.nextAction || dueReason(entry.followUpAt, today)
      });
    }
  }
  for (const contact of contacts) {
    const entry = progress.contacts[contact.id];
    if (contact.archived || !entry) continue;
    const title = contact.name || contact.email;
    if (entry.followUpAt) {
      if (entry.followUpAt <= today) {
        items.push({ kind: "contact", id: contact.id, title, subtitle: contact.company, due: entry.followUpAt, reason: dueReason(entry.followUpAt, today) });
      }
      continue;
    }
    if (entry.status === "sent" && entry.lastContactAt) {
      const due = addDays(entry.lastContactAt, progress.settings.followUpDays);
      if (due <= today) {
        items.push({
          kind: "contact",
          id: contact.id,
          title,
          subtitle: contact.company,
          due,
          reason: `邮件发出 ${daysBetween(entry.lastContactAt, today)} 天未回复`
        });
      }
    }
  }
  return items.sort((a, b) => a.due.localeCompare(b.due) || a.title.localeCompare(b.title, "zh-CN"));
};

export const dashboardStats = (postings: readonly Posting[], progress: ProgressFile, contacts: readonly Contact[], today: string): DashboardStats => {
  const statusCounts = Object.fromEntries(POSTING_STATUSES.map((status) => [status, 0])) as Record<PostingStatus, number>;
  const open = openPostings(postings);
  let submitted = 0;
  let inFlight = 0;
  let offers = 0;
  let closingSoon = 0;
  for (const posting of open) {
    const entry = progressOf(progress, posting.id);
    statusCounts[entry.status] += 1;
    if (isSubmitted(entry)) submitted += 1;
    if (isInFlight(entry)) inFlight += 1;
    if (entry.status === "offer") offers += 1;
    const { kind } = deadlineState(posting.dates, today);
    if ((kind === "today" || kind === "soon") && !isEnded(entry.status) && !isSubmitted(entry)) closingSoon += 1;
  }
  return {
    total: open.length,
    submitted,
    inFlight,
    offers,
    closingSoon,
    followUpsDue: followUps(postings, progress, contacts, today).length,
    statusCounts
  };
};

export const upcomingDeadlines = (postings: readonly Posting[], progress: ProgressFile, today: string, withinDays: number) =>
  openPostings(postings)
    .filter((posting) => !isEnded(progressOf(progress, posting.id).status))
    .map((posting) => ({ posting, state: deadlineState(posting.dates, today) as DeadlineState }))
    .filter(({ state }) => state.daysLeft !== null && state.daysLeft >= 0 && state.daysLeft <= withinDays)
    .sort((a, b) => (a.state.daysLeft ?? 0) - (b.state.daysLeft ?? 0) || a.posting.company.localeCompare(b.posting.company, "zh-CN"));

export const companySummaries = (postings: readonly Posting[], progress: ProgressFile) => {
  const summaries = new Map<string, CompanySummary>();
  for (const posting of openPostings(postings)) {
    const entry = progressOf(progress, posting.id);
    const summary = summaries.get(posting.company) || { company: posting.company, total: 0, submitted: 0, inFlight: 0, offers: 0, conflict: false };
    summary.total += 1;
    if (isSubmitted(entry)) summary.submitted += 1;
    if (isInFlight(entry)) summary.inFlight += 1;
    if (entry.status === "offer") summary.offers += 1;
    summary.conflict = summary.inFlight >= 2;
    summaries.set(posting.company, summary);
  }
  return [...summaries.values()].sort(
    (a, b) => b.inFlight - a.inFlight || b.submitted - a.submitted || b.total - a.total || a.company.localeCompare(b.company, "zh-CN")
  );
};

export const recentEvents = (progress: ProgressFile, limit: number): TrackerEvent[] =>
  progress.events
    .filter((event) => !event.deleted)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
