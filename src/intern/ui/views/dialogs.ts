import { FIT_LEVELS, RECORD_TYPE_LABELS, RECORD_TYPES, REGION_LABELS, REGIONS } from "../../core/types.ts";
import type { RecordType, Region } from "../../core/types.ts";
import type { TokenMode } from "../../data/auth.ts";
import type { ViewContext } from "../context.ts";
import { externalLink, field } from "../format.ts";
import { html } from "../html.ts";
import { icons } from "../icons.ts";
import { datalists } from "./drawer.ts";

export interface PostingDraft {
  company: string;
  title: string;
  team: string;
  url: string;
  program: string;
  programTag: string;
  companyTier: string;
  recordType: RecordType;
  region: Region;
  location: string;
  focus: string[];
  opensAt: string;
  closesAt: string;
  rolling: boolean;
  startTerm: string;
  fit: string;
  priority: string;
  bucket: string;
  jd: string;
  notes: string;
  starred: boolean;
  fromId: string;
}

export const emptyPostingDraft = (): PostingDraft => ({
  company: "",
  title: "",
  team: "",
  url: "",
  program: "",
  programTag: "",
  companyTier: "",
  recordType: "jd",
  region: "cn",
  location: "",
  focus: [],
  opensAt: "",
  closesAt: "",
  rolling: false,
  startTerm: "",
  fit: "",
  priority: "",
  bucket: "",
  jd: "",
  notes: "",
  starred: false,
  fromId: ""
});

const dialogHeader = (title: string) =>
  html`<header class="it-dialog-head"><h2>${title}</h2><button type="button" class="it-icon-button" data-action="close-dialog" aria-label="关闭">${icons.close}</button></header>`;

const input = (name: string, label: string, value: string, options: { type?: string; wide?: string; list?: string; required?: boolean } = {}) =>
  html`<label class="it-field ${options.wide || ""}"><span>${label}${options.required ? html`<em class="it-required">必填</em>` : ""}</span><input type="${options.type || "text"}" name="${name}" value="${value}" ${
    options.list ? html`list="${options.list}"` : ""
  } ${options.required ? "required" : ""} /></label>`;

const select = (name: string, label: string, choices: readonly (readonly [string, string])[], current: string) =>
  html`<label class="it-field"><span>${label}</span><select name="${name}">${choices.map(
    ([value, text]) => html`<option value="${value}" ${value === current ? "selected" : ""}>${text}</option>`
  )}</select></label>`;

const focusChoices = (ctx: ViewContext) => {
  const ordered = [...ctx.snapshot.postings.taxonomy.focusOrder];
  for (const posting of ctx.allPostings) {
    for (const tag of posting.focus) if (!ordered.includes(tag)) ordered.push(tag);
  }
  return ordered;
};

export const addPostingDialog = (ctx: ViewContext, draft: PostingDraft, duplicates: { id: string; reason: string }[] = []) => {
  const source = draft.fromId ? ctx.postingsById.get(draft.fromId) : undefined;
  return html`<form class="it-dialog-body" data-form="add-posting" data-from="${draft.fromId}">
    ${dialogHeader("新增岗位")}
    ${source ? html`<p class="it-muted">从「${source.title}」入口新增，已带入公司、项目和链接。</p>` : ""}
    ${duplicates.length > 0
      ? html`<div class="it-alert">${icons.alert}<div>
          <p>可能和已有岗位重复：</p>
          <ul>${duplicates.map((item) => {
            const posting = ctx.postingsById.get(item.id);
            return html`<li><button type="button" class="it-link" data-action="open-posting" data-id="${item.id}">${posting?.title || item.id}</button>（${item.reason}）</li>`;
          })}</ul>
          <label class="it-check"><input type="checkbox" name="force" />确认不是同一个岗位，仍然新增</label>
        </div></div>`
      : ""}
    ${datalists(ctx)}
    <div class="it-form-grid">
      ${input("company", "公司", draft.company, { list: "it-companies", required: true })}
      ${input("title", "岗位名", draft.title, { wide: "wide", required: true })}
      ${input("team", "团队", draft.team)}
      ${input("url", "岗位链接", draft.url, { type: "url", wide: "wide" })}
      ${select("recordType", "类型", RECORD_TYPES.map((type) => [type, RECORD_TYPE_LABELS[type]] as const), draft.recordType)}
      ${input("programTag", "人才计划", draft.programTag, { list: "it-programs" })}
      ${select("region", "地区", REGIONS.map((region) => [region, REGION_LABELS[region]] as const), draft.region)}
      ${input("location", "地点", draft.location)}
      <fieldset class="it-field full"><legend>方向</legend><div class="it-check-grid">${focusChoices(ctx).map(
        (tag) => html`<label class="it-check"><input type="checkbox" name="focus" value="${tag}" ${draft.focus.includes(tag) ? "checked" : ""} />${tag}</label>`
      )}</div></fieldset>
      ${input("opensAt", "开放日期", draft.opensAt, { type: "date" })}
      ${input("closesAt", "截止日期", draft.closesAt, { type: "date" })}
      <div class="it-field"><label class="it-check"><input type="checkbox" name="rolling" ${draft.rolling ? "checked" : ""} />滚动招聘</label></div>
      ${input("startTerm", "实习开始", draft.startTerm, { wide: "wide" })}
      ${select("fit", "匹配度", [["", "未评估"], ...FIT_LEVELS.map((level) => [level, level] as const)], draft.fit)}
      ${select("priority", "优先级", [["", "未定"], ["1", "P1"], ["2", "P2"], ["3", "P3"]], draft.priority)}
      ${input("bucket", "资格", draft.bucket, { list: "it-buckets" })}
      <label class="it-field full"><span>JD 摘要</span><textarea name="jd" rows="3">${draft.jd}</textarea></label>
      <label class="it-field full"><span>我的备注</span><textarea name="notes" rows="2">${draft.notes}</textarea></label>
      <div class="it-field full"><label class="it-check"><input type="checkbox" name="starred" ${draft.starred ? "checked" : ""} />加星标</label></div>
    </div>
    <input type="hidden" name="program" value="${draft.program}" />
    <input type="hidden" name="companyTier" value="${draft.companyTier}" />
    <footer class="it-actions-row">
      <button type="submit" class="it-button primary">新增</button>
      <button type="button" class="it-button" data-action="close-dialog">取消</button>
    </footer>
  </form>`;
};

export type ImportFormat = "auto" | "tracker" | "codex-internships" | "codex-contacts" | "patch";

export const IMPORT_FORMAT_LABELS: Record<ImportFormat, string> = {
  auto: "自动识别",
  tracker: "tracker 批次",
  "codex-internships": "Codex 实习",
  "codex-contacts": "Codex 联系人",
  patch: "岗位补丁"
};

export interface ImportDialogState {
  text: string;
  format: ImportFormat;
  batch: string;
  includeRestricted: boolean;
  preview: { format: ImportFormat; lines: string[]; changes: number } | null;
  error: string;
}

export const importDialog = (state: ImportDialogState) => html`<form class="it-dialog-body" data-form="import">
    ${dialogHeader("导入岗位批次")}
    <p class="it-muted">可以导入 tracker 格式的批次、Codex 导出的 internships.json 或 contacts.json，以及只改个别字段的岗位补丁。导入只更新岗位和联系人，不会改动投递进度。</p>
    <label class="it-field full"><span>选择文件</span><input type="file" accept="application/json,.json" data-action="import-file" /></label>
    <label class="it-field full"><span>或粘贴 JSON</span><textarea name="text" rows="8" spellcheck="false">${state.text}</textarea></label>
    <div class="it-form-grid">
      ${select("format", "格式", (Object.keys(IMPORT_FORMAT_LABELS) as ImportFormat[]).map((format) => [format, IMPORT_FORMAT_LABELS[format]] as const), state.format)}
      ${input("batch", "批次名", state.batch)}
      <div class="it-field"><label class="it-check"><input type="checkbox" name="includeRestricted" ${state.includeRestricted ? "checked" : ""} />包含 Codex 标记为受限的记录</label></div>
    </div>
    ${state.error ? html`<p class="it-error" role="alert">${state.error}</p>` : ""}
    ${state.preview
      ? html`<div class="it-preview" role="status"><p>识别为：${IMPORT_FORMAT_LABELS[state.preview.format]}</p><ul>${state.preview.lines.map((line) => html`<li>${line}</li>`)}</ul></div>`
      : ""}
    <footer class="it-actions-row">
      <button type="button" class="it-button" data-action="import-preview">预览</button>
      <button type="submit" class="it-button primary" ${state.preview && state.preview.changes > 0 ? "" : "disabled"}>确认导入</button>
      <button type="button" class="it-button" data-action="close-dialog">取消</button>
    </footer>
  </form>`;

const MODE_LABELS: Record<TokenMode, string> = { device: "记住此设备", passphrase: "口令加密保存", tab: "仅本标签页" };

export const settingsDialog = (
  ctx: ViewContext,
  info: { owner: string; repo: string; branch: string; dir: string; mode: TokenMode; warnings: string[] }
) => {
  const { postings, contacts, progress } = ctx.snapshot;
  const archived = postings.postings.filter((posting) => posting.archived).length;
  const events = progress.events.filter((event) => !event.deleted).length;
  return html`<form class="it-dialog-body" data-form="settings">
    ${dialogHeader("设置")}
    <div class="it-form-grid">
      <label class="it-field wide"><span>邮件发出几天未回复时提醒跟进</span><input type="number" name="followUpDays" min="1" max="60" value="${progress.settings.followUpDays}" required /></label>
    </div>
    <dl class="it-facts">
      ${field("数据仓库", `${info.owner}/${info.repo}（${info.branch} 分支，${info.dir || "根"} 目录）`)}
      ${field("令牌保存方式", MODE_LABELS[info.mode])}
      ${field("数据", `岗位 ${postings.postings.length} 个（归档 ${archived}），联系人 ${contacts.contacts.length} 位，记录 ${events} 条`)}
    </dl>
    <p>${externalLink(`https://github.com/${info.owner}/${info.repo}`, "在 GitHub 上打开数据仓库")}</p>
    ${info.warnings.length > 0
      ? html`<details class="it-help"><summary>加载数据时的提示（${info.warnings.length} 条）</summary><ul>${info.warnings.map((warning) => html`<li>${warning}</li>`)}</ul></details>`
      : ""}
    <footer class="it-actions-row">
      <button type="submit" class="it-button primary">保存</button>
      <button type="button" class="it-button" data-action="change-token">更换令牌或保存方式</button>
      <button type="button" class="it-button danger" data-action="lock">锁定并清除本机令牌</button>
    </footer>
  </form>`;
};
