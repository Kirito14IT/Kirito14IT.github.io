import {
  advanceTo,
  createManualPosting,
  deleteEvent,
  logEvent,
  nextPostingId,
  nextStatus,
  recordEmailSent,
  setCompanyNote,
  setContactStatus,
  setPostingStatus,
  toggleStar,
  updateContactProgress,
  updatePostingFacts,
  updatePostingProgress
} from "../core/actions.ts";
import type { PostingFactsPatch } from "../core/actions.ts";
import { applyProgramRules } from "../core/codex.ts";
import { isIsoDate } from "../core/dates.ts";
import { findDuplicates } from "../core/dedupe.ts";
import { contactProgressOf, progressOf } from "../core/stats.ts";
import { CHANNELS, CONTACT_STATUSES, EVENT_LABELS, EVENT_TYPES, POSTING_STATUSES, RECORD_TYPES, REGIONS, STATUS_LABELS } from "../core/types.ts";
import type { ContactProgress, ContactStatus, EventType, PostingProgress, RecordType, Region } from "../core/types.ts";
import type { App } from "./app-api.ts";
import { addPostingDialog, emptyPostingDraft } from "./views/dialogs.ts";
import type { PostingDraft } from "./views/dialogs.ts";

const PROGRESS_FIELDS: Record<string, string> = {
  appliedAt: "投递日期",
  appliedRole: "实际投递岗位",
  channel: "渠道",
  referrer: "内推人",
  nextAction: "下一步",
  followUpAt: "跟进日期",
  notes: "备注"
};
const CONTACT_FIELDS: Record<string, string> = { lastContactAt: "最近联系日期", followUpAt: "跟进日期", notes: "备注" };
const DATE_FIELDS = new Set(["appliedAt", "followUpAt", "lastContactAt"]);

const includes = <T extends string>(options: readonly T[], value: string): value is T => (options as readonly string[]).includes(value);

// Returns the cleaned value, or undefined when the input is not acceptable.
const cleanField = (app: App, field: string, raw: string) => {
  const value = raw.trim();
  if (!DATE_FIELDS.has(field)) return value;
  if (value && !isIsoDate(value)) {
    app.toast("日期格式不正确", "error");
    return undefined;
  }
  return value || null;
};

export const changeStatus = (app: App, id: string, status: string) => {
  if (!includes(POSTING_STATUSES, status)) return;
  if (app.mutate("progress", `progress: ${id} → ${STATUS_LABELS[status]}`, (progress, ctx) => void setPostingStatus(progress, id, status, ctx))) {
    app.toast(`已改为「${STATUS_LABELS[status]}」`);
  }
};

export const markAppliedToday = (app: App, id: string) => {
  if (app.mutate("progress", `progress: ${id} → 已投递`, (progress, ctx) => void setPostingStatus(progress, id, "applied", ctx))) {
    app.toast("已记录今天投递");
  }
};

export const advance = (app: App, id: string) => {
  const snapshot = app.sync?.snapshot;
  if (!snapshot) return;
  const next = nextStatus(progressOf(snapshot.progress, id).status);
  if (!next) return;
  if (app.mutate("progress", `progress: ${id} → ${STATUS_LABELS[next]}`, (progress, ctx) => void setPostingStatus(progress, id, next, ctx))) {
    app.toast(`已推进到「${STATUS_LABELS[next]}」`);
  }
};

export const toggleStarFor = (app: App, id: string) => {
  const snapshot = app.sync?.snapshot;
  if (!snapshot) return;
  const starred = progressOf(snapshot.progress, id).starred;
  app.mutate("progress", `progress: ${id} ${starred ? "取消星标" : "加星标"}`, (progress, ctx) => void toggleStar(progress, id, ctx.now));
};

export const updateProgressField = (app: App, id: string, field: string, raw: string) => {
  const snapshot = app.sync?.snapshot;
  const label = PROGRESS_FIELDS[field];
  if (!snapshot || !label) return;
  let value = cleanField(app, field, raw);
  if (value === undefined) return;
  if (field === "channel" && value && !includes(CHANNELS, value)) value = "";
  if ((progressOf(snapshot.progress, id) as unknown as Record<string, unknown>)[field] === value) return;
  app.mutate("progress", `progress: ${id} 更新${label}`, (progress, ctx) => {
    updatePostingProgress(progress, id, { [field]: value } as Partial<PostingProgress>, ctx.now);
    // Entering an application date also moves an earlier-stage posting to 已投递 on that date.
    if (field === "appliedAt" && typeof value === "string") advanceTo(progress, id, "applied", { ...ctx, today: value });
  });
};

export const addTimelineEvent = (app: App, form: HTMLFormElement) => {
  const data = new FormData(form);
  const date = String(data.get("date") || "");
  const type = String(data.get("type") || "");
  const link = String(data.get("link") || "");
  const note = String(data.get("note") || "").trim();
  if (!isIsoDate(date)) {
    app.toast("请选择日期", "error");
    return;
  }
  if (!includes(EVENT_TYPES, type)) return;
  const postingId = form.dataset.posting || (form.dataset.contact ? link : "") || null;
  const contactId = form.dataset.contact || (form.dataset.posting ? link : "") || null;
  if (app.mutate("progress", `progress: 记录${EVENT_LABELS[type]}`, (progress, ctx) => void logEvent(progress, { date, type: type as EventType, postingId, contactId, note }, ctx))) {
    app.toast("已添加记录");
  }
};

export const removeEvent = (app: App, id: string) => {
  app.mutate("progress", "progress: 删除一条记录", (progress, ctx) => void deleteEvent(progress, id, ctx.now));
};

export const markEmailSent = (app: App, contactId: string, postingId: string) => {
  const message = postingId ? `progress: ${contactId} 已发邮件（${postingId}）` : `progress: ${contactId} 已发邮件`;
  if (app.mutate("progress", message, (progress, ctx) => recordEmailSent(progress, contactId, ctx, postingId || undefined))) {
    app.toast("已记录今天发了邮件");
  }
};

export const changeContactStatus = (app: App, id: string, status: string) => {
  if (!includes(CONTACT_STATUSES, status)) return;
  app.mutate("progress", `progress: ${id} 外联状态`, (progress, ctx) => void setContactStatus(progress, id, status as ContactStatus, ctx));
};

export const updateContactField = (app: App, id: string, field: string, raw: string) => {
  const snapshot = app.sync?.snapshot;
  const label = CONTACT_FIELDS[field];
  if (!snapshot || !label) return;
  const value = cleanField(app, field, raw);
  if (value === undefined) return;
  if ((contactProgressOf(snapshot.progress, id) as unknown as Record<string, unknown>)[field] === value) return;
  app.mutate("progress", `progress: ${id} 更新${label}`, (progress, ctx) =>
    updateContactProgress(progress, id, { [field]: value } as Partial<ContactProgress>, ctx.now)
  );
};

export const saveCompanyNote = (app: App, company: string, notes: string) => {
  const snapshot = app.sync?.snapshot;
  if (!snapshot || (snapshot.progress.companies[company]?.notes || "") === notes.trim()) return;
  app.mutate("progress", `progress: 更新公司备注（${company}）`, (progress, ctx) => setCompanyNote(progress, company, notes, ctx.now));
};

const readFacts = (form: HTMLFormElement): PostingFactsPatch => {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name) ?? "").trim();
  const date = (name: string) => text(name) || null;
  const recordType = text("recordType");
  const region = text("region");
  return {
    title: text("title"),
    company: text("company"),
    team: text("team"),
    url: text("url"),
    sourceUrl: text("sourceUrl"),
    recordType: includes(RECORD_TYPES, recordType) ? recordType : "jd",
    region: includes(REGIONS, region) ? region : "cn",
    location: text("location"),
    programTag: text("programTag"),
    companyTier: text("companyTier"),
    focus: text("focus")
      .split(/[、,，;；]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    fit: text("fit"),
    priority: text("priority") ? Number(text("priority")) : null,
    duration: text("duration"),
    internshipType: text("internshipType"),
    jd: text("jd"),
    requirements: text("requirements"),
    fitReason: text("fitReason"),
    gaps: text("gaps"),
    siteStatus: text("siteStatus"),
    archived: data.get("archived") === "on",
    dates: {
      publishedAt: date("dates.publishedAt"),
      opensAt: date("dates.opensAt"),
      closesAt: date("dates.closesAt"),
      checkedAt: date("dates.checkedAt"),
      startTerm: text("dates.startTerm"),
      source: text("dates.source"),
      note: text("dates.note"),
      rolling: data.get("dates.rolling") === "on"
    },
    eligibility: {
      bucket: text("eligibility.bucket"),
      note: text("eligibility.note"),
      graduationWindow: text("eligibility.graduationWindow")
    }
  };
};

export const saveFacts = (app: App, form: HTMLFormElement) => {
  const id = form.dataset.id || "";
  const patch = readFacts(form);
  if (!patch.title || !patch.company) {
    app.toast("岗位名和公司不能为空", "error");
    return;
  }
  app.state.editingFacts = false;
  if (app.mutate("postings", `postings: 编辑 ${id}`, (file, ctx) => updatePostingFacts(file, id, patch, ctx.now))) {
    app.toast("已保存岗位信息");
  } else {
    app.state.editingFacts = true;
  }
};

const readPostingDraft = (form: HTMLFormElement): PostingDraft => {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name) ?? "").trim();
  const recordType = text("recordType");
  const region = text("region");
  return {
    ...emptyPostingDraft(),
    company: text("company"),
    title: text("title"),
    team: text("team"),
    url: text("url"),
    program: text("program"),
    programTag: text("programTag"),
    companyTier: text("companyTier"),
    recordType: includes(RECORD_TYPES, recordType) ? (recordType as RecordType) : "jd",
    region: includes(REGIONS, region) ? (region as Region) : "cn",
    location: text("location"),
    focus: data.getAll("focus").map(String),
    opensAt: text("opensAt"),
    closesAt: text("closesAt"),
    rolling: data.get("rolling") === "on",
    startTerm: text("startTerm"),
    fit: text("fit"),
    priority: text("priority"),
    bucket: text("bucket"),
    jd: text("jd"),
    notes: text("notes"),
    starred: data.get("starred") === "on",
    fromId: form.dataset.from || ""
  };
};

export const openAddPosting = (app: App, fromId = "") => {
  const ctx = app.context();
  const source = fromId ? ctx.postingsById.get(fromId) : undefined;
  const draft = emptyPostingDraft();
  if (source) {
    Object.assign(draft, {
      company: source.company,
      team: source.team,
      url: source.url,
      program: source.program,
      programTag: source.programTag,
      companyTier: source.companyTier,
      region: source.region,
      location: source.location,
      focus: [...source.focus],
      bucket: source.eligibility.bucket,
      fromId
    });
  }
  app.openDialog(addPostingDialog(ctx, draft));
};

export const submitNewPosting = (app: App, form: HTMLFormElement) => {
  const snapshot = app.sync?.snapshot;
  if (!snapshot) return;
  const draft = readPostingDraft(form);
  if (!draft.company || !draft.title) {
    app.toast("请填写公司和岗位名", "error");
    return;
  }
  const duplicates = findDuplicates({ company: draft.company, title: draft.title, url: draft.url }, snapshot.postings.postings).filter(
    (match) => match.strength === "strong"
  );
  if (duplicates.length > 0 && new FormData(form).get("force") !== "on") {
    app.openDialog(addPostingDialog(app.context(), draft, duplicates));
    return;
  }
  const { taxonomy } = snapshot.postings;
  const id = nextPostingId(snapshot.postings.postings, app.context().today);
  const created = app.mutate("postings", `postings: 新增 ${id}`, (file, ctx) => {
    file.postings.push(
      createManualPosting(
        {
          company: draft.company,
          title: draft.title,
          team: draft.team,
          url: draft.url,
          sourceUrl: draft.url,
          program: draft.program,
          programTag: draft.programTag || applyProgramRules(draft.program, draft.company, taxonomy.programRules),
          companyTier: draft.companyTier || taxonomy.companyTiers[draft.company] || "",
          recordType: draft.recordType,
          region: draft.region,
          location: draft.location,
          focus: draft.focus,
          fit: draft.fit,
          priority: draft.priority ? Number(draft.priority) : null,
          eligibility: { bucket: draft.bucket },
          jd: draft.jd,
          dates: { opensAt: draft.opensAt || null, closesAt: draft.closesAt || null, rolling: draft.rolling, startTerm: draft.startTerm }
        },
        { id, now: ctx.now, today: ctx.today }
      )
    );
  });
  if (!created) return;
  if (draft.notes || draft.starred) {
    app.mutate("progress", `progress: ${id} 备注`, (progress, ctx) => updatePostingProgress(progress, id, { notes: draft.notes, starred: draft.starred }, ctx.now));
  }
  app.closeDialog();
  app.openPosting(id);
  app.toast("已新增岗位");
};

export const saveSettings = (app: App, form: HTMLFormElement) => {
  const days = Number(new FormData(form).get("followUpDays"));
  if (!Number.isInteger(days) || days < 1 || days > 60) {
    app.toast("提醒天数需在 1 到 60 之间", "error");
    return;
  }
  if (app.mutate("progress", "progress: 更新跟进提醒天数", (progress, ctx) => void (progress.settings = { followUpDays: days, updatedAt: ctx.now }))) {
    app.closeDialog();
    app.toast("已保存设置");
  }
};

