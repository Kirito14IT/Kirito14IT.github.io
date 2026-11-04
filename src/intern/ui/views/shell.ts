import type { SyncStatus } from "../../data/sync.ts";
import { VIEWS } from "../context.ts";
import type { View } from "../context.ts";
import { html } from "../html.ts";
import { icons } from "../icons.ts";

const VIEW_LABELS: Record<View, string> = { overview: "总览", postings: "岗位", board: "看板", contacts: "联系人" };

export const shellView = () => html`<div class="it-shell">
  <header class="it-top">
    <div class="it-top-title">
      <h1>投递进度</h1>
      <span class="it-sync" data-sync role="status" aria-live="polite"></span>
    </div>
    <nav class="it-tabs" aria-label="视图" data-tabs></nav>
    <div class="it-top-actions">
      <button type="button" class="it-button" data-action="new-posting" aria-label="新增岗位">${icons.plus}<span>新增岗位</span></button>
      <button type="button" class="it-button" data-action="import" aria-label="导入">${icons.upload}<span>导入</span></button>
      <details class="it-menu">
        <summary class="it-button" aria-label="导出">${icons.download}<span>导出</span></summary>
        <div class="it-menu-list">
          <button type="button" data-action="export-json">全部数据（JSON 备份）</button>
          <button type="button" data-action="export-csv">当前筛选的岗位（CSV）</button>
        </div>
      </details>
      <button type="button" class="it-icon-button" data-action="settings" aria-label="设置">${icons.sliders}</button>
      <button type="button" class="it-icon-button" data-action="theme" data-theme-button aria-label="切换主题"></button>
      <button type="button" class="it-icon-button" data-action="lock" aria-label="锁定">${icons.lock}</button>
    </div>
  </header>
  <div class="it-banner" data-banner hidden></div>
  <section class="it-toolbar" data-toolbar></section>
  <main class="it-main" data-main></main>
  <div class="it-scrim" data-scrim data-action="close-drawer" hidden></div>
  <aside class="it-drawer" data-drawer aria-label="详情" aria-hidden="true"></aside>
  <dialog class="it-dialog" data-dialog></dialog>
  <div class="it-toast" data-toast role="status" aria-live="polite" hidden></div>
</div>`;

export const tabsView = (current: View, counts: Partial<Record<View, number>>) =>
  VIEWS.map(
    (view) =>
      html`<button type="button" data-action="view" data-view="${view}" ${view === current ? html`aria-current="page"` : ""}>${VIEW_LABELS[view]}${
        counts[view] !== undefined ? html`<span class="it-count it-num">${counts[view]}</span>` : ""
      }</button>`
  );

const clock = (iso: string) => new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Shanghai" });

export const syncText = (status: SyncStatus) => {
  switch (status.state) {
    case "saving":
      return "保存中…";
    case "dirty":
      return `${status.pending} 项待保存`;
    case "error":
      return "保存失败";
    case "auth":
      return "令牌已失效";
    default:
      return status.lastSavedAt ? `已保存 ${clock(status.lastSavedAt)}` : "已同步";
  }
};
