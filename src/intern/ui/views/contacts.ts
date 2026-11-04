import { relativeDayLabel } from "../../core/dates.ts";
import { contactProgressOf } from "../../core/stats.ts";
import { CONTACT_STATUS_LABELS, CONTACT_STATUSES } from "../../core/types.ts";
import type { Contact } from "../../core/types.ts";
import type { ContactFilters, ViewContext } from "../context.ts";
import { chip, contactStatusBadge, emailLink, shortDate } from "../format.ts";
import { html } from "../html.ts";
import { icons } from "../icons.ts";

const normalizeText = (value: string) => value.normalize("NFKC").toLowerCase();
const distinct = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));

export const filterContacts = (ctx: ViewContext) => {
  const filters = ctx.state.contactFilters;
  const { progress } = ctx.snapshot;
  const tokens = normalizeText(filters.q).split(/\s+/).filter(Boolean);
  const linkedCount = (contact: Contact) => ctx.postingsByContact.get(contact.id)?.filter((posting) => !posting.archived).length || 0;
  return ctx.snapshot.contacts.contacts
    .filter((contact) => {
      if (contact.archived) return false;
      const entry = contactProgressOf(progress, contact.id);
      if (filters.company && contact.company !== filters.company) return false;
      if (filters.relation && contact.relationLabel !== filters.relation) return false;
      if (filters.type && contact.contactType !== filters.type) return false;
      if (filters.status && entry.status !== filters.status) return false;
      if (filters.linkedOnly && linkedCount(contact) === 0) return false;
      if (tokens.length === 0) return true;
      const text = normalizeText(
        [contact.name, contact.email, contact.company, contact.organization, contact.role, contact.interests, contact.whyContact, contact.relationEvidence, entry.notes].join("\n")
      );
      return tokens.every((token) => text.includes(token));
    })
    .sort(
      (a, b) =>
        Number(linkedCount(b) > 0) - Number(linkedCount(a) > 0) ||
        (a.priority ?? 9) - (b.priority ?? 9) ||
        a.relationLabel.localeCompare(b.relationLabel) ||
        a.company.localeCompare(b.company, "zh-CN")
    );
};

const select = (key: keyof ContactFilters, label: string, values: readonly string[], current: string, labels: Record<string, string> = {}) =>
  html`<label class="it-inline"><span>${label}</span><select data-action="contact-filter" data-key="${key}"><option value="">全部</option>${values.map(
    (value) => html`<option value="${value}" ${value === current ? "selected" : ""}>${labels[value] || value}</option>`
  )}</select></label>`;

export const contactsToolbar = (ctx: ViewContext) => {
  const filters = ctx.state.contactFilters;
  const contacts = ctx.snapshot.contacts.contacts.filter((contact) => !contact.archived);
  return html`<div class="it-toolbar-row">
      <label class="it-search">${icons.search}<input type="search" data-input="contact-search" value="${filters.q}" placeholder="搜索姓名、邮箱、团队、研究方向" aria-label="搜索联系人" autocomplete="off" /></label>
      ${select("company", "公司", distinct(contacts.map((contact) => contact.company)), filters.company)}
      ${select("relation", "关系", distinct(contacts.map((contact) => contact.relationLabel)), filters.relation)}
      ${select("status", "外联", CONTACT_STATUSES, filters.status, CONTACT_STATUS_LABELS)}
      ${select("type", "类型", distinct(contacts.map((contact) => contact.contactType)), filters.type)}
      <label class="it-check"><input type="checkbox" data-action="contact-linked" ${filters.linkedOnly ? "checked" : ""} />只看关联当前岗位的</label>
    </div>
    <div class="it-chips" data-chips></div>`;
};

export const contactChips = (ctx: ViewContext, shown: number) => {
  const filters = ctx.state.contactFilters;
  const active = Boolean(filters.q.trim() || filters.company || filters.relation || filters.status || filters.type || filters.linkedOnly);
  const total = ctx.snapshot.contacts.contacts.filter((contact) => !contact.archived).length;
  return html`<span class="it-result-count">显示 <b>${shown}</b> / ${total}</span>${
    active ? html`<button type="button" class="it-text-button" data-action="clear-contact-filters">清空筛选</button>` : ""
  }`;
};

export const contactsTable = (ctx: ViewContext, list: Contact[]) =>
  list.length === 0
    ? html`<div class="it-empty-block"><p>没有符合条件的联系人。</p><button type="button" class="it-button" data-action="clear-contact-filters">清空筛选</button></div>`
    : html`<div class="it-table contacts" role="table" aria-label="联系人列表">
        <div class="it-row it-head" role="row">
          <span class="c-name" role="columnheader">姓名</span>
          <span class="c-org" role="columnheader">公司 / 团队</span>
          <span class="c-relation" role="columnheader">关系</span>
          <span class="c-email" role="columnheader">邮箱</span>
          <span class="c-linked" role="columnheader">关联岗位</span>
          <span class="c-cstatus" role="columnheader">外联</span>
          <span class="c-last" role="columnheader">最近联系与跟进</span>
        </div>
        ${list.map((contact) => {
          const entry = contactProgressOf(ctx.snapshot.progress, contact.id);
          const linked = (ctx.postingsByContact.get(contact.id) || []).filter((posting) => !posting.archived);
          return html`<div class="it-row" role="row" data-contact-row="${contact.id}">
            <span class="c-name" role="cell"><button type="button" class="it-link" data-action="open-contact" data-id="${contact.id}">${contact.name || contact.email}</button>${
              contact.role ? html`<small>${contact.role}</small>` : ""
            }</span>
            <span class="c-org" role="cell"><b>${contact.company}</b>${contact.organization && contact.organization !== contact.company ? html`<small>${contact.organization}</small>` : ""}</span>
            <span class="c-relation" role="cell">${chip(contact.relationLabel, "relation")}</span>
            <span class="c-email" role="cell">${emailLink(contact.email)}${
              contact.email ? html`<button type="button" class="it-icon-button" data-action="copy" data-copy="${contact.email}" aria-label="复制邮箱">${icons.copy}</button>` : ""
            }</span>
            <span class="c-linked it-num" role="cell">${linked.length > 0 ? `${linked.length} 个` : html`<span class="it-muted">无</span>`}</span>
            <span class="c-cstatus" role="cell">${contactStatusBadge(entry.status)}</span>
            <span class="c-last" role="cell">${entry.lastContactAt ? html`<small class="it-num">${shortDate(entry.lastContactAt, ctx.today)} 联系</small>` : ""}${
              entry.followUpAt ? html`<small>跟进：${relativeDayLabel(entry.followUpAt, ctx.today)}</small>` : ""
            }</span>
          </div>`;
        })}
      </div>`;
