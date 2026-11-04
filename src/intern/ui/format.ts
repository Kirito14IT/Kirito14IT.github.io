import { deadlineState, formatDate } from "../core/dates.ts";
import { CONTACT_STATUS_LABELS, ENDED_STATUSES, PIPELINE_STATUSES, POSTING_STATUSES, STATUS_LABELS } from "../core/types.ts";
import type { ContactStatus, PostingDates, PostingStatus } from "../core/types.ts";
import { SafeHtml, html, mailtoHref, safeUrl } from "./html.ts";
import { icons } from "./icons.ts";

export const statusBadge = (status: PostingStatus) => html`<span class="it-status" data-status="${status}">${STATUS_LABELS[status]}</span>`;

export const contactStatusBadge = (status: ContactStatus) =>
  html`<span class="it-cstatus" data-cstatus="${status}">${CONTACT_STATUS_LABELS[status]}</span>`;

export const deadlineBadge = (dates: Pick<PostingDates, "closesAt" | "rolling">, today: string) => {
  const state = deadlineState(dates, today);
  return html`<span class="it-deadline" data-kind="${state.kind}">${state.label}</span>`;
};

// The pipeline rail: six segments between 未开始 and Offer, filled up to the current stage.
const RAIL_SEGMENTS = PIPELINE_STATUSES.length - 1;
export const rail = (status: PostingStatus, size: "small" | "large" = "small") => {
  const ended = ENDED_STATUSES.includes(status);
  const filled = ended ? 0 : PIPELINE_STATUSES.indexOf(status);
  return html`<span class="it-rail ${size === "large" ? "large" : ""}" data-status="${status}" role="img" aria-label="进度：${STATUS_LABELS[status]}">${Array.from(
    { length: RAIL_SEGMENTS },
    (_, index) => html`<span class="${index < filled ? "on" : ""}"></span>`
  )}</span>`;
};

export const statusSelect = (id: string, status: PostingStatus, label = "我的状态") =>
  html`<select class="it-status-select" data-action="status" data-id="${id}" data-status="${status}" aria-label="${label}">${POSTING_STATUSES.map(
    (option) => html`<option value="${option}" ${option === status ? "selected" : ""}>${STATUS_LABELS[option]}</option>`
  )}</select>`;

export const starButton = (id: string, starred: boolean) =>
  html`<button type="button" class="it-star" data-action="star" data-id="${id}" aria-pressed="${starred ? "true" : "false"}" aria-label="${starred ? "取消星标" : "加星标"}">${
    starred ? icons.starFilled : icons.star
  }</button>`;

export const chip = (text: string, kind = "") => (text ? html`<span class="it-chip ${kind}">${text}</span>` : "");

export const fitBadge = (fit: string) => (fit ? html`<span class="it-fit" data-fit="${fit}">${fit}</span>` : "");

export const externalLink = (url: string, label: string) => {
  const href = safeUrl(url);
  return href ? html`<a class="it-external" href="${href}" target="_blank" rel="noopener noreferrer">${label}${icons.external}</a>` : "";
};

// Research notes often repeat the deadline before adding a remark; keep only the remark.
export const deadlineNote = (dates: Pick<PostingDates, "closesAt" | "note">) => {
  const note = dates.closesAt && dates.note.startsWith(dates.closesAt) ? dates.note.slice(dates.closesAt.length).trim() : dates.note.trim();
  return note.replace(/^（(.*)）$/, "$1");
};

export const emailLink = (email: string) => {
  const href = mailtoHref(email);
  return href ? html`<a class="it-email" href="${href}">${email}</a>` : email ? html`<span class="it-email">${email}</span>` : "";
};

export const shortDate = (date: string | null, today: string) => formatDate(date, today);

export const empty = (message: string) => html`<p class="it-empty">${message}</p>`;

const isBlank = (value: unknown) =>
  value === "" || value === null || value === undefined || (value instanceof SafeHtml && value.value.trim() === "");

export const field = (label: string, value: unknown) => (isBlank(value) ? "" : html`<div class="it-fact"><dt>${label}</dt><dd>${value}</dd></div>`);
