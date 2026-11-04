import { nextStatus } from "../../core/actions.ts";
import { progressOf } from "../../core/stats.ts";
import { ENDED_STATUSES, PIPELINE_STATUSES, STATUS_LABELS } from "../../core/types.ts";
import type { Posting, PostingStatus } from "../../core/types.ts";
import type { ViewContext } from "../context.ts";
import { deadlineBadge, rail, starButton } from "../format.ts";
import { html } from "../html.ts";
import { followUpNote } from "./postings.ts";

const COLUMNS: { key: string; label: string; statuses: readonly PostingStatus[] }[] = [
  ...PIPELINE_STATUSES.map((status) => ({ key: status, label: STATUS_LABELS[status], statuses: [status] })),
  { key: "ended", label: "已结束", statuses: ENDED_STATUSES }
];

const card = (posting: Posting, ctx: ViewContext) => {
  const entry = progressOf(ctx.snapshot.progress, posting.id);
  const next = nextStatus(entry.status);
  return html`<article class="it-card" data-status="${entry.status}">
    <header>
      ${starButton(posting.id, entry.starred)}
      <button type="button" class="it-link" data-action="open-posting" data-id="${posting.id}">${posting.title}</button>
    </header>
    <p class="it-card-company">${posting.company}${posting.team ? html` · ${posting.team}` : ""}</p>
    ${rail(entry.status)}
    <footer>
      ${deadlineBadge(posting.dates, ctx.today)}
      ${ENDED_STATUSES.includes(entry.status) ? html`<span class="it-muted">${STATUS_LABELS[entry.status]}</span>` : ""}
      ${followUpNote(entry, ctx.today)}
      ${next ? html`<button type="button" class="it-text-button" data-action="advance" data-id="${posting.id}">推进到${STATUS_LABELS[next]}</button>` : ""}
    </footer>
  </article>`;
};

export const boardView = (ctx: ViewContext, list: Posting[]) =>
  html`<div class="it-board">${COLUMNS.map((column) => {
    const cards = list.filter((posting) => column.statuses.includes(progressOf(ctx.snapshot.progress, posting.id).status));
    const hiddenEnded = column.key === "ended" && !ctx.state.filters.showEnded && ctx.state.filters.status.length === 0;
    return html`<section class="it-column" data-column="${column.key}" aria-label="${column.label}">
      <header><h2>${column.label}</h2><span class="it-num">${cards.length}</span></header>
      <div class="it-cards">
        ${cards.map((posting) => card(posting, ctx))}
        ${hiddenEnded ? html`<p class="it-empty">勾选「显示已结束」后显示。</p>` : cards.length === 0 ? html`<p class="it-empty">暂无</p>` : ""}
      </div>
    </section>`;
  })}</div>`;
