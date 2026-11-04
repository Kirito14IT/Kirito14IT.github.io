import type { PostingDates } from "./types.ts";

// All tracker dates are calendar days in Asia/Shanghai, stored as YYYY-MM-DD.
const TIME_ZONE = "Asia/Shanghai";
const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type DeadlineKind = "overdue" | "today" | "soon" | "month" | "later" | "rolling" | "unknown";
export interface DeadlineState {
  kind: DeadlineKind;
  daysLeft: number | null;
  label: string;
}

const toUtcMs = (date: string) => {
  const [, year, month, day] = ISO_DATE.exec(date) || [];
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
};

const fromUtcMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const pad = (value: string | number) => String(value).padStart(2, "0");

export const isIsoDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  return fromUtcMs(toUtcMs(value)) === value;
};

export const todayInShanghai = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

export const addDays = (date: string, days: number) => fromUtcMs(toUtcMs(date) + days * DAY_MS);

export const daysBetween = (from: string, to: string) => Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);

export const extractLeadingDate = (text: string) => {
  const value = String(text || "").trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value);
  const chinese = /^(\d{4})年(\d{1,2})月(\d{1,2})日/.exec(value);
  const match = iso || chinese;
  if (!match) return null;
  const date = `${match[1]}-${pad(match[2])}-${pad(match[3])}`;
  return isIsoDate(date) ? date : null;
};

export const formatDate = (date: string | null, today: string) => {
  if (!date || !isIsoDate(date)) return "";
  return date.slice(0, 4) === today.slice(0, 4) ? date.slice(5) : date;
};

export const deadlineState = (dates: Pick<PostingDates, "closesAt" | "rolling">, today: string): DeadlineState => {
  if (isIsoDate(dates.closesAt)) {
    const daysLeft = daysBetween(today, dates.closesAt);
    if (daysLeft < 0) return { kind: "overdue", daysLeft, label: `已截止 ${-daysLeft} 天` };
    if (daysLeft === 0) return { kind: "today", daysLeft, label: "今天截止" };
    if (daysLeft <= 7) return { kind: "soon", daysLeft, label: `剩 ${daysLeft} 天` };
    if (daysLeft <= 30) return { kind: "month", daysLeft, label: `剩 ${daysLeft} 天` };
    return { kind: "later", daysLeft, label: `${formatDate(dates.closesAt, today)} 截止` };
  }
  if (dates.rolling) return { kind: "rolling", daysLeft: null, label: "滚动招聘" };
  return { kind: "unknown", daysLeft: null, label: "未公布" };
};

export const relativeDayLabel = (date: string, today: string) => {
  const offset = daysBetween(today, date);
  if (offset === 0) return "今天";
  if (offset === 1) return "明天";
  if (offset === -1) return "昨天";
  return offset > 0 ? `${offset} 天后` : `${-offset} 天前`;
};
