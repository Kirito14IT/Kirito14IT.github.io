import { FACET_LABELS, SORT_KEYS, facetLabel, facetOptions, filterPostings } from "../../core/filters.ts";
import type { FacetKey, SortKey } from "../../core/filters.ts";
import type { ViewContext } from "../context.ts";
import { html } from "../html.ts";
import { icons } from "../icons.ts";

export const TOOLBAR_FACETS: readonly FacetKey[] = [
  "status",
  "deadline",
  "focus",
  "company",
  "tier",
  "program",
  "recordType",
  "region",
  "fit",
  "priority",
  "eligibility",
  "batch"
];

const SORT_LABELS: Record<SortKey, string> = { priority: "优先级", deadline: "截止时间", fit: "匹配度", updated: "最近更新", company: "公司" };
const FLAG_LABELS = { starred: "只看星标", hasEmail: "有直联邮箱", showEnded: "显示已结束" } as const;
type ToolbarFlag = keyof typeof FLAG_LABELS;

export const postingToolbar = (ctx: ViewContext) => {
  const { filters } = ctx.state;
  return html`<div class="it-toolbar-row">
      <label class="it-search">${icons.search}<input type="search" data-input="search" value="${filters.q}" placeholder="搜索公司、岗位、JD、备注、联系人" aria-label="搜索岗位" autocomplete="off" /></label>
      <label class="it-inline"><span>排序</span><select data-action="sort">${SORT_KEYS.map(
        (key) => html`<option value="${key}" ${filters.sort === key ? "selected" : ""}>${SORT_LABELS[key]}</option>`
      )}</select></label>
      ${(Object.keys(FLAG_LABELS) as ToolbarFlag[]).map(
        (flag) => html`<label class="it-check"><input type="checkbox" data-action="flag" data-flag="${flag}" ${filters[flag] ? "checked" : ""} />${FLAG_LABELS[flag]}</label>`
      )}
    </div>
    <div class="it-facets" data-facets>${facetsPanel(ctx)}</div>
    <div class="it-chips" data-chips></div>`;
};

// Counts show how many postings would remain if that value were added to the current filters.
export const facetsPanel = (ctx: ViewContext) => {
  const { filters } = ctx.state;
  return TOOLBAR_FACETS.map((key) => {
    const universe = facetOptions(key, ctx.postings, ctx.filterCtx);
    const selected = filters[key];
    if (universe.length < 2 && selected.length === 0) return "";
    const narrowed = new Map(
      facetOptions(key, filterPostings(ctx.postings, { ...filters, [key]: [] }, ctx.filterCtx), ctx.filterCtx).map((option) => [option.value, option.count])
    );
    return html`<details class="it-facet" data-facet-key="${key}" ${ctx.state.openFacet === key ? "open" : ""}>
      <summary>${FACET_LABELS[key]}${selected.length > 0 ? html`<b>${selected.length}</b>` : ""}</summary>
      <div class="it-facet-menu" role="group" aria-label="${FACET_LABELS[key]}">
        ${universe.map(
          (option) =>
            html`<label><input type="checkbox" data-action="facet" data-facet="${key}" value="${option.value}" ${selected.includes(option.value) ? "checked" : ""} /><span>${option.label}</span><em>${narrowed.get(option.value) || 0}</em></label>`
        )}
      </div>
    </details>`;
  });
};

export const chipsRow = (ctx: ViewContext, shown: number) => {
  const { filters } = ctx.state;
  const active = TOOLBAR_FACETS.flatMap((key) => filters[key].map((value) => ({ key, value })));
  const query = filters.q.trim();
  const anyFilter = active.length > 0 || query !== "" || filters.starred || filters.hasEmail;
  return html`${active.map(
    ({ key, value }) =>
      html`<button type="button" class="it-filter-chip" data-action="remove-facet" data-facet="${key}" value="${value}" aria-label="移除筛选 ${FACET_LABELS[key]}：${facetLabel(key, value)}">${FACET_LABELS[key]}：${facetLabel(key, value)}${icons.close}</button>`
  )}
    ${query ? html`<span class="it-filter-chip static">搜索：${query}</span>` : ""}
    <span class="it-result-count">显示 <b>${shown}</b> / ${ctx.postings.length}</span>
    ${anyFilter ? html`<button type="button" class="it-text-button" data-action="clear-filters">清空筛选</button>` : ""}`;
};
