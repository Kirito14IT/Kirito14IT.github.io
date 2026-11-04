import { nextStatus } from "../../core/actions.ts";
import { companySummaries, contactProgressOf, isSubmitted, progressOf } from "../../core/stats.ts";
import {
  CHANNEL_LABELS,
  CHANNELS,
  CONTACT_STATUS_LABELS,
  CONTACT_STATUSES,
  ENDED_STATUSES,
  EVENT_LABELS,
  EVENT_TYPES,
  FIT_LEVELS,
  RECORD_TYPE_LABELS,
  RECORD_TYPES,
  REGION_LABELS,
  REGIONS,
  STATUS_LABELS
} from "../../core/types.ts";
import type { Contact, Posting, PostingProgress, TrackerEvent } from "../../core/types.ts";
import type { ViewContext } from "../context.ts";
import {
  chip,
  contactStatusBadge,
  deadlineBadge,
  deadlineNote,
  emailLink,
  empty,
  externalLink,
  field,
  fitBadge,
  rail,
  shortDate,
  starButton,
  statusBadge,
  statusSelect
} from "../format.ts";
import { html } from "../html.ts";
import { icons } from "../icons.ts";

const MANUAL_EVENT_TYPES = EVENT_TYPES.filter((type) => type !== "status");
const byNewest = (a: TrackerEvent, b: TrackerEvent) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);

const closeButton = html`<button type="button" class="it-icon-button" data-action="close-drawer" aria-label="关闭详情">${icons.close}</button>`;

const timeline = (ctx: ViewContext, events: TrackerEvent[], target: { postingId?: string; contactId?: string }, choices: { id: string; label: string }[]) => html`
  <form class="it-event-form" data-form="event" data-posting="${target.postingId || ""}" data-contact="${target.contactId || ""}">
    <input type="date" name="date" value="${ctx.today}" required aria-label="日期" />
    <select name="type" aria-label="记录类型">${MANUAL_EVENT_TYPES.map((type) => html`<option value="${type}">${EVENT_LABELS[type]}</option>`)}</select>
    ${choices.length > 0
      ? html`<select name="link" aria-label="${target.postingId ? "关联联系人" : "关联岗位"}"><option value="">${target.postingId ? "不关联联系人" : "不关联岗位"}</option>${choices.map(
          (choice) => html`<option value="${choice.id}">${choice.label}</option>`
        )}</select>`
      : ""}
    <input type="text" name="note" placeholder="备注" aria-label="备注" />
    <button type="submit" class="it-button">添加记录</button>
  </form>
  ${events.length === 0
    ? empty("还没有记录。")
    : html`<ol class="it-timeline">${events.map((event) => {
        const contact = event.contactId && !target.contactId ? ctx.contactsById.get(event.contactId) : undefined;
        const posting = event.postingId && !target.postingId ? ctx.postingsById.get(event.postingId) : undefined;
        return html`<li data-type="${event.type}">
          <time class="it-num" datetime="${event.date}">${shortDate(event.date, ctx.today)}</time>
          <b>${EVENT_LABELS[event.type]}</b>
          ${contact ? html`<button type="button" class="it-link" data-action="open-contact" data-id="${contact.id}">${contact.name || contact.email}</button>` : ""}
          ${posting ? html`<button type="button" class="it-link" data-action="open-posting" data-id="${posting.id}">${posting.title}</button>` : ""}
          ${event.note ? html`<span class="it-timeline-note">${event.note}</span>` : ""}
          <button type="button" class="it-icon-button" data-action="delete-event" data-event="${event.id}" aria-label="删除这条记录">${icons.trash}</button>
        </li>`;
      })}</ol>`}`;

const progressInput = (id: string, name: keyof PostingProgress, label: string, value: string, type = "text", wide = "", placeholder = "") =>
  html`<label class="it-field ${wide}"><span>${label}</span><input type="${type}" data-action="progress-field" data-field="${name}" data-id="${id}" value="${value}" ${
    placeholder ? html`placeholder="${placeholder}"` : ""
  } /></label>`;

const progressForm = (posting: Posting, entry: PostingProgress) => {
  const next = nextStatus(entry.status);
  return html`<div class="it-form-grid">
      <label class="it-field"><span>状态</span>${statusSelect(posting.id, entry.status)}</label>
      ${progressInput(posting.id, "appliedAt", "投递日期", entry.appliedAt || "", "date")}
      ${progressInput(posting.id, "appliedRole", "实际投递的岗位", entry.appliedRole, "text", "wide", posting.title)}
      <label class="it-field"><span>渠道</span><select data-action="progress-field" data-field="channel" data-id="${posting.id}"><option value="">未填写</option>${CHANNELS.map(
        (channel) => html`<option value="${channel}" ${entry.channel === channel ? "selected" : ""}>${CHANNEL_LABELS[channel]}</option>`
      )}</select></label>
      ${progressInput(posting.id, "referrer", "内推人 / 对接人", entry.referrer)}
      ${progressInput(posting.id, "followUpAt", "跟进日期", entry.followUpAt || "", "date")}
      ${progressInput(posting.id, "nextAction", "下一步", entry.nextAction, "text", "wide")}
      <label class="it-field full"><span>备注</span><textarea data-action="progress-field" data-field="notes" data-id="${posting.id}" rows="3">${entry.notes}</textarea></label>
    </div>
    <div class="it-actions-row">
      ${!isSubmitted(entry) && !ENDED_STATUSES.includes(entry.status)
        ? html`<button type="button" class="it-button primary" data-action="applied-today" data-id="${posting.id}">记为今天投递</button>`
        : ""}
      ${next ? html`<button type="button" class="it-button" data-action="advance" data-id="${posting.id}">推进到「${STATUS_LABELS[next]}」</button>` : ""}
    </div>`;
};

const windowSummary = (posting: Posting, today: string) => {
  const { dates } = posting;
  const parts = [
    dates.publishedAt ? `发布 ${shortDate(dates.publishedAt, today)}` : "",
    dates.opensAt ? `开放 ${shortDate(dates.opensAt, today)}` : "",
    dates.closesAt ? `截止 ${shortDate(dates.closesAt, today)}` : ""
  ].filter(Boolean);
  return html`${deadlineBadge(dates, today)}${parts.length > 0 ? html`<span class="it-num"> ${parts.join(" · ")}</span>` : ""}${
    deadlineNote(dates) ? html`<span class="it-muted">（${deadlineNote(dates)}）</span>` : ""
  }`;
};

const factsView = (posting: Posting, today: string) => html`<dl class="it-facts">
    ${field("投递窗口", windowSummary(posting, today))}
    ${field("实习开始", posting.dates.startTerm)}
    ${field("日期来源", externalLink(posting.dates.source, "查看来源"))}
    ${field("时长与到岗", posting.duration)}
    ${field("地点", posting.location)}
    ${field("招聘项目", posting.program)}
    ${field("实习类型", posting.internshipType)}
    ${field("资格", posting.eligibility.bucket || posting.eligibility.note ? html`${chip(posting.eligibility.bucket)} ${posting.eligibility.note}` : "")}
    ${field("届别要求", posting.eligibility.graduationWindow)}
    ${field("JD 摘要", posting.jd)}
    ${field("要求", posting.requirements)}
    ${field("匹配度", posting.fit || posting.priority ? html`${fitBadge(posting.fit)}${posting.priority ? ` 优先级 P${posting.priority}` : ""}` : "")}
    ${field("匹配理由", posting.fitReason)}
    ${field("主要缺口", posting.gaps)}
    ${field("页面状态", posting.siteStatus)}
    ${field("岗位页说明", posting.extra.contactRelation)}
    ${field("核验", [posting.provenance.checkedAt, posting.provenance.batch && `批次 ${posting.provenance.batch}`, posting.provenance.sourceDate].filter(Boolean).join(" · "))}
    ${field("编号", posting.id)}
  </dl>`;

const factInput = (name: string, label: string, value: string, type = "text", wide = "", list = "") =>
  html`<label class="it-field ${wide}"><span>${label}</span><input type="${type}" name="${name}" value="${value}" ${list ? html`list="${list}"` : ""} /></label>`;

const factArea = (name: string, label: string, value: string) =>
  html`<label class="it-field full"><span>${label}</span><textarea name="${name}" rows="3">${value}</textarea></label>`;

const factSelect = (name: string, label: string, options: readonly (readonly [string, string])[], current: string) =>
  html`<label class="it-field"><span>${label}</span><select name="${name}">${options.map(
    ([value, text]) => html`<option value="${value}" ${value === current ? "selected" : ""}>${text}</option>`
  )}</select></label>`;

const factCheck = (name: string, label: string, checked: boolean) =>
  html`<label class="it-check"><input type="checkbox" name="${name}" ${checked ? "checked" : ""} />${label}</label>`;

export const datalists = (ctx: ViewContext) => {
  const distinct = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const list = (id: string, values: string[]) => html`<datalist id="${id}">${distinct(values).map((value) => html`<option value="${value}"></option>`)}</datalist>`;
  return html`${list("it-companies", ctx.allPostings.map((posting) => posting.company))}
    ${list("it-programs", ctx.allPostings.map((posting) => posting.programTag))}
    ${list("it-tiers", ctx.allPostings.map((posting) => posting.companyTier))}
    ${list("it-buckets", ctx.allPostings.map((posting) => posting.eligibility.bucket))}`;
};

const factsForm = (ctx: ViewContext, posting: Posting) => {
  const { dates, eligibility } = posting;
  return html`<form class="it-facts-form" data-form="facts" data-id="${posting.id}">
    ${datalists(ctx)}
    <div class="it-form-grid">
      ${factInput("title", "岗位名", posting.title, "text", "wide")}
      ${factInput("company", "公司", posting.company, "text", "", "it-companies")}
      ${factInput("team", "团队", posting.team)}
      ${factInput("url", "岗位链接", posting.url, "url", "wide")}
      ${factInput("sourceUrl", "来源链接", posting.sourceUrl, "url", "wide")}
      ${factSelect("recordType", "类型", RECORD_TYPES.map((type) => [type, RECORD_TYPE_LABELS[type]] as const), posting.recordType)}
      ${factSelect("region", "地区", REGIONS.map((region) => [region, REGION_LABELS[region]] as const), posting.region)}
      ${factInput("location", "地点", posting.location)}
      ${factInput("programTag", "人才计划", posting.programTag, "text", "", "it-programs")}
      ${factInput("companyTier", "公司类型", posting.companyTier, "text", "", "it-tiers")}
      ${factInput("focus", "方向（用顿号分隔）", posting.focus.join("、"), "text", "wide")}
      ${factSelect("fit", "匹配度", [["", "未评估"], ...FIT_LEVELS.map((level) => [level, level] as const)], posting.fit)}
      ${factSelect("priority", "优先级", [["", "未定"], ["1", "P1"], ["2", "P2"], ["3", "P3"]], posting.priority ? String(posting.priority) : "")}
      ${factInput("dates.publishedAt", "发布日期", dates.publishedAt || "", "date")}
      ${factInput("dates.opensAt", "开放日期", dates.opensAt || "", "date")}
      ${factInput("dates.closesAt", "截止日期", dates.closesAt || "", "date")}
      ${factInput("dates.checkedAt", "日期核验于", dates.checkedAt || "", "date")}
      ${factInput("dates.startTerm", "实习开始", dates.startTerm, "text", "wide")}
      ${factInput("dates.source", "日期来源链接", dates.source, "url", "wide")}
      ${factInput("dates.note", "日期说明", dates.note, "text", "wide")}
      <div class="it-field">${factCheck("dates.rolling", "滚动招聘", dates.rolling)}</div>
      ${factInput("duration", "时长与到岗", posting.duration, "text", "wide")}
      ${factInput("internshipType", "实习类型", posting.internshipType)}
      ${factInput("eligibility.bucket", "资格", eligibility.bucket, "text", "", "it-buckets")}
      ${factInput("eligibility.note", "资格说明", eligibility.note, "text", "wide")}
      ${factInput("eligibility.graduationWindow", "届别要求", eligibility.graduationWindow, "text", "wide")}
      ${factArea("jd", "JD 摘要", posting.jd)}
      ${factArea("requirements", "要求", posting.requirements)}
      ${factArea("fitReason", "匹配理由", posting.fitReason)}
      ${factArea("gaps", "主要缺口", posting.gaps)}
      ${factInput("siteStatus", "页面状态", posting.siteStatus, "text", "full")}
      <div class="it-field full">${factCheck("archived", "归档（不在列表里显示）", posting.archived)}</div>
    </div>
    <div class="it-actions-row">
      <button type="submit" class="it-button primary">保存</button>
      <button type="button" class="it-button" data-action="cancel-facts">取消</button>
    </div>
  </form>`;
};

const contactCard = (ctx: ViewContext, contact: Contact, postingId: string) => {
  const entry = contactProgressOf(ctx.snapshot.progress, contact.id);
  return html`<article class="it-contact-card">
    <header>
      <button type="button" class="it-link" data-action="open-contact" data-id="${contact.id}">${contact.name || contact.email}</button>
      ${chip(contact.relationLabel, "relation")}
      ${contactStatusBadge(entry.status)}
    </header>
    ${contact.role || contact.organization ? html`<p class="it-muted">${[contact.role, contact.organization].filter(Boolean).join(" · ")}</p>` : ""}
    ${contact.email
      ? html`<p class="it-contact-email">${emailLink(contact.email)}<button type="button" class="it-icon-button" data-action="copy" data-copy="${contact.email}" aria-label="复制邮箱">${icons.copy}</button></p>`
      : ""}
    ${contact.whyContact ? html`<p><b>为什么联系：</b>${contact.whyContact}</p>` : ""}
    ${contact.outreachGate ? html`<p><b>外联前提：</b>${contact.outreachGate}</p>` : ""}
    ${contact.caveats ? html`<p class="it-muted"><b>注意：</b>${contact.caveats}</p>` : ""}
    ${entry.lastContactAt ? html`<p class="it-muted it-num">最近联系 ${shortDate(entry.lastContactAt, ctx.today)}</p>` : ""}
    <div class="it-actions-row">
      <button type="button" class="it-button" data-action="email-sent" data-contact="${contact.id}" data-posting="${postingId}">${icons.mail}记录今天已发邮件</button>
    </div>
  </article>`;
};

export const postingDrawer = (ctx: ViewContext, posting: Posting) => {
  const { progress } = ctx.snapshot;
  const entry = progressOf(progress, posting.id);
  const contacts = posting.contactIds.map((id) => ctx.contactsById.get(id)).filter((contact): contact is Contact => contact !== undefined);
  const events = progress.events.filter((event) => !event.deleted && event.postingId === posting.id).sort(byNewest);
  const company = companySummaries(ctx.postings, progress).find((summary) => summary.company === posting.company);
  const companyNote = progress.companies[posting.company]?.notes || "";
  return html`
    <header class="it-drawer-head">
      <div class="it-drawer-titles">
        <p class="it-drawer-kicker">${posting.company}${posting.team ? html` · ${posting.team}` : ""}</p>
        <h2 tabindex="-1" data-drawer-title>${posting.title}</h2>
        <div class="it-row-meta">${chip(RECORD_TYPE_LABELS[posting.recordType])}${chip(posting.programTag, "program")}${chip(REGION_LABELS[posting.region])}${chip(posting.location)}${
          posting.archived ? chip("已归档", "muted") : ""
        }</div>
        ${rail(entry.status, "large")}
      </div>
      <div class="it-drawer-tools">${starButton(posting.id, entry.starred)}${closeButton}</div>
    </header>
    <div class="it-drawer-links">${externalLink(posting.url, "岗位页面")}${posting.sourceUrl && posting.sourceUrl !== posting.url ? externalLink(posting.sourceUrl, "来源页面") : ""}</div>

    <section class="it-section it-company-block">
      ${company && company.conflict
        ? html`<p class="it-alert">${icons.alert}你在${posting.company}有 ${company.inFlight} 个流程中的投递，注意公司对同时投递数量的限制。</p>`
        : ""}
      ${company && company.total > 1
        ? html`<p class="it-muted">${posting.company}共收录 ${company.total} 个岗位，已投 ${company.submitted} 个。<button type="button" class="it-text-button" data-action="filter-company" data-company="${posting.company}">查看全部</button></p>`
        : ""}
      <label class="it-field full"><span>公司备注（投递限制、内推人等）</span><textarea data-action="company-note" data-company="${posting.company}" rows="2">${companyNote}</textarea></label>
    </section>

    <section class="it-section"><h3>我的进度</h3>${progressForm(posting, entry)}</section>
    <section class="it-section"><h3>时间线</h3>${timeline(ctx, events, { postingId: posting.id }, contacts.map((contact) => ({ id: contact.id, label: contact.name || contact.email })))}</section>
    <section class="it-section"><h3>直联联系人</h3>${contacts.length === 0 ? empty("这个岗位没有关联的联系人。") : contacts.map((contact) => contactCard(ctx, contact, posting.id))}</section>
    <section class="it-section">
      <h3>岗位信息</h3>
      ${ctx.state.editingFacts
        ? factsForm(ctx, posting)
        : html`${factsView(posting, ctx.today)}
          <div class="it-actions-row">
            <button type="button" class="it-button" data-action="edit-facts">编辑信息</button>
            ${posting.recordType === "program" ? html`<button type="button" class="it-button" data-action="derive-posting" data-id="${posting.id}">${icons.plus}从这个入口新增具体岗位</button>` : ""}
          </div>`}
    </section>`;
};

const contactInput = (id: string, name: string, label: string, value: string) =>
  html`<label class="it-field"><span>${label}</span><input type="date" data-action="contact-field" data-field="${name}" data-id="${id}" value="${value}" /></label>`;

export const contactDrawer = (ctx: ViewContext, contact: Contact) => {
  const { progress } = ctx.snapshot;
  const entry = contactProgressOf(progress, contact.id);
  const linked = ctx.postingsByContact.get(contact.id) || [];
  const linkedIds = new Set(linked.map((posting) => posting.id));
  const otherRefs = contact.legacyJobRefs.filter((ref) => !linkedIds.has(ref.id) && !ctx.postingsById.has(ref.id));
  const events = progress.events.filter((event) => !event.deleted && event.contactId === contact.id).sort(byNewest);
  return html`
    <header class="it-drawer-head">
      <div class="it-drawer-titles">
        <p class="it-drawer-kicker">${contact.company}${contact.organization && contact.organization !== contact.company ? html` · ${contact.organization}` : ""}</p>
        <h2 tabindex="-1" data-drawer-title>${contact.name || contact.email}</h2>
        <div class="it-row-meta">${chip(contact.relationLabel, "relation")}${chip(contact.contactType)}${contactStatusBadge(entry.status)}</div>
      </div>
      <div class="it-drawer-tools">${closeButton}</div>
    </header>
    <div class="it-drawer-links">
      ${contact.email
        ? html`<span class="it-contact-email">${emailLink(contact.email)}<button type="button" class="it-icon-button" data-action="copy" data-copy="${contact.email}" aria-label="复制邮箱">${icons.copy}</button></span>`
        : ""}
      ${externalLink(contact.sourceUrl, "来源")}${contact.affiliationUrl && contact.affiliationUrl !== contact.sourceUrl ? externalLink(contact.affiliationUrl, "任职证据") : ""}
    </div>

    <section class="it-section">
      <h3>外联进度</h3>
      <div class="it-form-grid">
        <label class="it-field"><span>状态</span><select data-action="contact-status" data-id="${contact.id}">${CONTACT_STATUSES.map(
          (status) => html`<option value="${status}" ${entry.status === status ? "selected" : ""}>${CONTACT_STATUS_LABELS[status]}</option>`
        )}</select></label>
        ${contactInput(contact.id, "lastContactAt", "最近联系", entry.lastContactAt || "")}
        ${contactInput(contact.id, "followUpAt", "跟进日期", entry.followUpAt || "")}
        <label class="it-field full"><span>备注</span><textarea data-action="contact-field" data-field="notes" data-id="${contact.id}" rows="3">${entry.notes}</textarea></label>
      </div>
      <div class="it-actions-row"><button type="button" class="it-button primary" data-action="email-sent" data-contact="${contact.id}" data-posting="">${icons.mail}记录今天已发邮件</button></div>
    </section>

    <section class="it-section"><h3>时间线</h3>${timeline(ctx, events, { contactId: contact.id }, linked.map((posting) => ({ id: posting.id, label: posting.title })))}</section>

    <section class="it-section">
      <h3>关联岗位</h3>
      ${linked.length === 0
        ? empty("没有关联到当前收录的岗位。")
        : html`<ul class="it-list">${linked.map(
            (posting) => html`<li>
              <button type="button" class="it-link" data-action="open-posting" data-id="${posting.id}">${posting.title}</button>
              <span class="it-muted">${posting.company}</span>
              ${deadlineBadge(posting.dates, ctx.today)}
              ${statusBadge(progressOf(progress, posting.id).status)}
            </li>`
          )}</ul>`}
      ${otherRefs.length > 0
        ? html`<p class="it-muted">原清单里的其他相关岗位（未收录）：</p><ul class="it-list compact">${otherRefs.map(
            (ref) => html`<li>${ref.url ? externalLink(ref.url, ref.title || ref.id) : ref.title || ref.id}</li>`
          )}</ul>`
        : ""}
    </section>

    <section class="it-section">
      <h3>联系人信息</h3>
      <dl class="it-facts">
        ${field("角色", contact.role)}
        ${field("研究方向", contact.interests)}
        ${field("为什么联系", contact.whyContact)}
        ${field("关系证据", contact.relationEvidence)}
        ${field("关系范围", contact.relationScope)}
        ${field("与具体岗位的关系", contact.specificJdRelation)}
        ${field("是否确认为岗位负责人", contact.exactJobOwnerConfirmed === null ? "" : contact.exactJobOwnerConfirmed ? "已确认" : "未确认")}
        ${field("招聘状态", contact.recruitingStatus)}
        ${field("外联前提", contact.outreachGate)}
        ${field("注意事项", contact.caveats)}
        ${field("邮箱类型", contact.emailType)}
        ${field("核验", [contact.checkedAt, contact.sourceDate].filter(Boolean).join(" · "))}
        ${field("编号", contact.id)}
      </dl>
    </section>`;
};
