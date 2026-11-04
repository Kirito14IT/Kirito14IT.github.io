import { daysBetween, deadlineState, relativeDayLabel } from "../../core/dates.ts";
import { progressOf } from "../../core/stats.ts";
import { CHANNEL_LABELS, ENDED_STATUSES, RECORD_TYPE_LABELS, SUBMITTED_STATUSES } from "../../core/types.ts";
import type { Posting, PostingProgress } from "../../core/types.ts";
import type { ViewContext } from "../context.ts";
import { chip, deadlineBadge, fitBadge, rail, shortDate, starButton, statusSelect } from "../format.ts";
import { html } from "../html.ts";

const SHOW_DATE_WITH_BADGE = new Set(["overdue", "today", "soon", "month"]);

export const windowCell = (posting: Posting, today: string) => {
  const { dates } = posting;
  const kind = deadlineState(dates, today).kind;
  return html`${deadlineBadge(dates, today)}
    ${dates.closesAt && SHOW_DATE_WITH_BADGE.has(kind) ? html`<small class="it-num">${shortDate(dates.closesAt, today)} 截止</small>` : ""}
    ${dates.opensAt ? html`<small class="it-num">${shortDate(dates.opensAt, today)} 开放</small>` : ""}
    ${dates.startTerm ? html`<small>${dates.startTerm}</small>` : ""}`;
};

export const isOpenForSubmission = (entry: PostingProgress) => !SUBMITTED_STATUSES.includes(entry.status) && !ENDED_STATUSES.includes(entry.status);

export const followUpNote = (entry: PostingProgress, today: string) => {
  if (!entry.followUpAt) return "";
  const offset = daysBetween(today, entry.followUpAt);
  return html`<span class="it-follow" data-due="${offset < 0 ? "overdue" : offset === 0 ? "today" : "later"}">跟进：${relativeDayLabel(entry.followUpAt, today)}</span>`;
};

const nextCell = (posting: Posting, entry: PostingProgress, today: string) => html`
  ${entry.appliedAt ? html`<span class="it-applied it-num">${shortDate(entry.appliedAt, today)} 投递${entry.channel ? ` · ${CHANNEL_LABELS[entry.channel]}` : ""}</span>` : ""}
  ${followUpNote(entry, today)}
  ${entry.nextAction ? html`<span class="it-next-action">${entry.nextAction}</span>` : ""}
  ${isOpenForSubmission(entry) ? html`<button type="button" class="it-text-button" data-action="applied-today" data-id="${posting.id}">记为今天投递</button>` : ""}`;

const row = (posting: Posting, ctx: ViewContext) => {
  const entry = progressOf(ctx.snapshot.progress, posting.id);
  return html`<div class="it-row" role="row" data-row="${posting.id}" data-status="${entry.status}">
    <span class="c-star" role="cell">${starButton(posting.id, entry.starred)}</span>
    <span class="c-company" role="cell"><b>${posting.company}</b>${posting.team ? html`<small>${posting.team}</small>` : ""}</span>
    <span class="c-title" role="cell">
      <button type="button" class="it-link" data-action="open-posting" data-id="${posting.id}">${posting.title}</button>
      <span class="it-row-meta">${chip(RECORD_TYPE_LABELS[posting.recordType])}${chip(posting.programTag, "program")}${posting.region === "overseas" ? chip("海外") : ""}${
        posting.location ? html`<small>${posting.location}</small>` : ""
      }</span>
      ${rail(entry.status)}
    </span>
    <span class="c-focus" role="cell">${posting.focus.map((tag) => html`<span class="it-tag">${tag}</span>`)}</span>
    <span class="c-fit" role="cell">${fitBadge(posting.fit)}${posting.priority ? html`<small>P${posting.priority}</small>` : ""}</span>
    <span class="c-window" role="cell">${windowCell(posting, ctx.today)}</span>
    <span class="c-status" role="cell">${statusSelect(posting.id, entry.status)}</span>
    <span class="c-next" role="cell">${nextCell(posting, entry, ctx.today)}</span>
  </div>`;
};

export const postingsTable = (ctx: ViewContext, list: Posting[]) =>
  list.length === 0
    ? html`<div class="it-empty-block"><p>没有符合条件的岗位。</p><button type="button" class="it-button" data-action="clear-filters">清空筛选</button></div>`
    : html`<div class="it-table" role="table" aria-label="岗位列表">
        <div class="it-row it-head" role="row">
          <span class="c-star" role="columnheader"><span class="it-hidden-label">星标</span></span>
          <span class="c-company" role="columnheader">公司</span>
          <span class="c-title" role="columnheader">岗位</span>
          <span class="c-focus" role="columnheader">方向</span>
          <span class="c-fit" role="columnheader">匹配</span>
          <span class="c-window" role="columnheader">截止</span>
          <span class="c-status" role="columnheader">我的状态</span>
          <span class="c-next" role="columnheader">投递与跟进</span>
        </div>
        ${list.map((posting) => row(posting, ctx))}
      </div>`;
