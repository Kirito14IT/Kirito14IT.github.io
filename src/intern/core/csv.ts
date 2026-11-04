import { deadlineState } from "./dates.ts";
import { progressOf } from "./stats.ts";
import { CHANNEL_LABELS, RECORD_TYPE_LABELS, REGION_LABELS, STATUS_LABELS } from "./types.ts";
import type { Contact, Posting, ProgressFile } from "./types.ts";

const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
// Spreadsheets evaluate cells that start with these characters as formulas.
const FORMULA_START = /^[=+\-@\t\r]/;

const cell = (value: string | number | null | undefined) => {
  let text = value === null || value === undefined ? "" : String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

// The byte order mark lets Excel detect UTF-8 so Chinese text opens correctly.
export const toCsv = (rows: readonly (readonly (string | number | null | undefined)[])[]) =>
  `${BYTE_ORDER_MARK}${rows.map((row) => row.map(cell).join(",")).join("\r\n")}\r\n`;

const HEADER = [
  "编号",
  "公司",
  "团队",
  "岗位",
  "类型",
  "人才计划",
  "地区",
  "地点",
  "方向",
  "匹配度",
  "优先级",
  "资格",
  "截止日期",
  "截止状态",
  "我的状态",
  "投递日期",
  "实际投递岗位",
  "渠道",
  "下一步",
  "跟进日期",
  "联系人",
  "链接",
  "备注"
];

export const postingsCsv = (postings: readonly Posting[], progress: ProgressFile, contactsById: Map<string, Contact>, today: string) =>
  toCsv([
    HEADER,
    ...postings.map((posting) => {
      const entry = progressOf(progress, posting.id);
      const contacts = posting.contactIds
        .map((id) => contactsById.get(id))
        .filter((contact): contact is Contact => contact !== undefined)
        .map((contact) => [contact.name, contact.email].filter(Boolean).join(" "));
      return [
        posting.id,
        posting.company,
        posting.team,
        posting.title,
        RECORD_TYPE_LABELS[posting.recordType],
        posting.programTag,
        REGION_LABELS[posting.region],
        posting.location,
        posting.focus.join("、"),
        posting.fit,
        posting.priority ? `P${posting.priority}` : "",
        posting.eligibility.bucket,
        posting.dates.closesAt,
        deadlineState(posting.dates, today).label,
        STATUS_LABELS[entry.status],
        entry.appliedAt,
        entry.appliedRole,
        entry.channel ? CHANNEL_LABELS[entry.channel] : "",
        entry.nextAction,
        entry.followUpAt,
        contacts.join("；"),
        posting.url,
        entry.notes
      ];
    })
  ]);
