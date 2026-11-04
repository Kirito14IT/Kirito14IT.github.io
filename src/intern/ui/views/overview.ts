import { deadlineState } from "../../core/dates.ts";
import { companySummaries, dashboardStats, followUps, isSubmitted, progressOf, recentEvents, upcomingDeadlines } from "../../core/stats.ts";
import { ENDED_STATUSES, EVENT_LABELS, PIPELINE_STATUSES, STATUS_LABELS } from "../../core/types.ts";
import type { PostingStatus } from "../../core/types.ts";
import type { ViewContext } from "../context.ts";
import { deadlineBadge, empty, rail, shortDate, statusBadge } from "../format.ts";
import { html } from "../html.ts";

export type KpiKey = "all" | "submitted" | "inFlight" | "offer" | "followUps" | "closingSoon";

const kpi = (key: KpiKey, label: string, value: number) =>
  html`<button type="button" class="it-kpi" data-action="kpi" data-kpi="${key}"><span class="it-kpi-num it-num">${value}</span><span class="it-kpi-label">${label}</span></button>`;

const funnel = (counts: Record<PostingStatus, number>, total: number) => {
  const ended = ENDED_STATUSES.reduce((sum, status) => sum + counts[status], 0);
  const rows: { key: string; label: string; count: number; status: PostingStatus }[] = [
    ...PIPELINE_STATUSES.map((status) => ({ key: status, label: STATUS_LABELS[status], count: counts[status], status })),
    { key: "ended", label: "已结束", count: ended, status: "closed" }
  ];
  return rows.map(
    (row) => html`<div class="it-funnel-row" data-status="${row.key}">
      ${rail(row.status)}
      <span class="it-funnel-label">${row.label}</span>
      <span class="it-funnel-bar"><span style="--share: ${total > 0 ? Math.round((row.count * 100) / total) : 0}%"></span></span>
      <b class="it-num">${row.count}</b>
    </div>`
  );
};

const panel = (title: string, body: unknown, extra: unknown = "", id = "") =>
  html`<section class="it-panel" ${id ? html`id="${id}"` : ""}><header><h2>${title}</h2>${extra}</header>${body}</section>`;

export const overviewView = (ctx: ViewContext) => {
  const { progress, contacts } = ctx.snapshot;
  const { today } = ctx;
  const stats = dashboardStats(ctx.postings, progress, contacts.contacts, today);
  const deadlines = upcomingDeadlines(ctx.postings, progress, today, 30);
  const dueItems = followUps(ctx.postings, progress, contacts.contacts, today);
  const events = recentEvents(progress, 12);
  const companies = companySummaries(ctx.postings, progress);

  const programs = new Map<string, { count: number; submitted: number; nextClose: string | null; rolling: boolean }>();
  for (const posting of ctx.postings) {
    if (!posting.programTag) continue;
    const entry = progressOf(progress, posting.id);
    const summary = programs.get(posting.programTag) || { count: 0, submitted: 0, nextClose: null, rolling: false };
    summary.count += 1;
    if (isSubmitted(entry)) summary.submitted += 1;
    const state = deadlineState(posting.dates, today);
    if (posting.dates.closesAt && state.daysLeft !== null && state.daysLeft >= 0 && (!summary.nextClose || posting.dates.closesAt < summary.nextClose)) {
      summary.nextClose = posting.dates.closesAt;
    }
    if (posting.dates.rolling) summary.rolling = true;
    programs.set(posting.programTag, summary);
  }

  return html`
    <section class="it-kpis" aria-label="概况">
      ${kpi("all", "岗位", stats.total)}
      ${kpi("submitted", "已投递", stats.submitted)}
      ${kpi("inFlight", "流程中", stats.inFlight)}
      ${kpi("offer", "Offer", stats.offers)}
      ${kpi("followUps", "待跟进", stats.followUpsDue)}
      ${kpi("closingSoon", "7 天内截止", stats.closingSoon)}
    </section>

    ${panel("投递进度", html`<div class="it-funnel">${funnel(stats.statusCounts, stats.total)}</div>`)}

    <div class="it-columns">
      ${panel(
        "即将截止",
        deadlines.length === 0
          ? empty("30 天内没有已知的截止日期。多数岗位没有公布截止时间，可以在岗位详情里补充。")
          : html`<ul class="it-list">${deadlines.map(
              ({ posting }) => html`<li>
                <span class="it-list-date it-num">${shortDate(posting.dates.closesAt, today)}</span>
                <button type="button" class="it-link" data-action="open-posting" data-id="${posting.id}">${posting.title}</button>
                <span class="it-muted">${posting.company}</span>
                ${deadlineBadge(posting.dates, today)}
                ${statusBadge(progressOf(progress, posting.id).status)}
              </li>`
            )}</ul>`,
        html`<span class="it-muted">30 天内</span>`
      )}
      ${panel(
        "待跟进",
        dueItems.length === 0
          ? empty("没有到期的跟进。")
          : html`<ul class="it-list">${dueItems.map(
              (item) => html`<li>
                <span class="it-list-date it-num">${shortDate(item.due, today)}</span>
                <button type="button" class="it-link" data-action="${item.kind === "posting" ? "open-posting" : "open-contact"}" data-id="${item.id}">${item.title}</button>
                <span class="it-muted">${item.subtitle}</span>
                <span class="it-follow" data-due="overdue">${item.reason}</span>
              </li>`
            )}</ul>`,
        "",
        "it-followups"
      )}
    </div>

    <div class="it-columns">
      ${panel(
        "最近动态",
        events.length === 0
          ? empty("还没有记录。改状态或添加记录后会显示在这里。")
          : html`<ul class="it-list">${events.map((event) => {
              const posting = event.postingId ? ctx.postingsById.get(event.postingId) : undefined;
              const contact = event.contactId ? ctx.contactsById.get(event.contactId) : undefined;
              return html`<li>
                <span class="it-list-date it-num">${shortDate(event.date, today)}</span>
                <b>${EVENT_LABELS[event.type]}</b>
                ${posting ? html`<button type="button" class="it-link" data-action="open-posting" data-id="${posting.id}">${posting.title}</button>` : ""}
                ${contact ? html`<button type="button" class="it-link" data-action="open-contact" data-id="${contact.id}">${contact.name || contact.email}</button>` : ""}
                ${event.note ? html`<span class="it-muted">${event.note}</span>` : ""}
              </li>`;
            })}</ul>`
      )}
      ${panel(
        "按公司",
        html`<table class="it-mini-table">
          <thead><tr><th>公司</th><th>岗位</th><th>已投</th><th>流程中</th><th>Offer</th></tr></thead>
          <tbody>${companies.map(
            (company) => html`<tr class="${company.conflict ? "is-conflict" : ""}">
              <td><button type="button" class="it-link" data-action="filter-company" data-company="${company.company}">${company.company}</button>${
                company.conflict ? html`<span class="it-warning">同时 ${company.inFlight} 个流程</span>` : ""
              }</td>
              <td class="it-num">${company.total}</td><td class="it-num">${company.submitted}</td><td class="it-num">${company.inFlight}</td><td class="it-num">${company.offers}</td>
            </tr>`
          )}</tbody>
        </table>`
      )}
    </div>

    ${programs.size > 0
      ? panel(
          "人才计划",
          html`<table class="it-mini-table">
            <thead><tr><th>计划</th><th>岗位</th><th>已投</th><th>截止</th></tr></thead>
            <tbody>${[...programs.entries()]
              .sort(([a], [b]) => a.localeCompare(b, "zh-CN"))
              .map(
                ([tag, summary]) => html`<tr>
                  <td><button type="button" class="it-link" data-action="filter-program" data-program="${tag}">${tag}</button></td>
                  <td class="it-num">${summary.count}</td>
                  <td class="it-num">${summary.submitted}</td>
                  <td>${summary.nextClose ? deadlineBadge({ closesAt: summary.nextClose, rolling: false }, today) : summary.rolling ? html`<span class="it-deadline" data-kind="rolling">滚动招聘</span>` : html`<span class="it-deadline" data-kind="unknown">未公布</span>`}</td>
                </tr>`
              )}</tbody>
          </table>`
        )
      : ""}
  `;
};
