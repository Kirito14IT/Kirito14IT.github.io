import type { TokenMode } from "../../data/auth.ts";
import { html } from "../html.ts";
import { icons } from "../icons.ts";

export interface ConnectDefaults {
  repo: string;
  branch: string;
  dir: string;
  mode: TokenMode;
}

const MODES: { value: TokenMode; label: string; hint: string }[] = [
  { value: "device", label: "记住此设备", hint: "令牌保存在这个浏览器里，下次打开直接进入。" },
  { value: "passphrase", label: "口令加密保存", hint: "令牌用口令加密后保存，每次打开需要输入口令，适合公用电脑。" },
  { value: "tab", label: "仅本标签页", hint: "关闭标签页后需要重新输入令牌。" }
];

// Strangers who open the page see only this form, so it says nothing about what the data is.
export const connectView = (defaults: ConnectDefaults, error = "") => html`<main class="it-lock">
  <form class="it-lock-card" data-form="connect" autocomplete="off">
    <h1>需要访问令牌</h1>
    <p class="it-muted">填写数据仓库和 GitHub 访问令牌后打开。令牌只保存在这台设备上。</p>
    ${error ? html`<p class="it-error" role="alert">${error}</p>` : ""}
    <label class="it-field"><span>数据仓库</span><input name="repo" required placeholder="owner/name" value="${defaults.repo}" spellcheck="false" autocapitalize="off" /></label>
    <label class="it-field"><span>访问令牌</span><input name="token" type="password" required spellcheck="false" autocapitalize="off" /></label>
    <fieldset class="it-field it-modes">
      <legend>保存方式</legend>
      ${MODES.map(
        (mode) => html`<label class="it-radio"><input type="radio" name="mode" value="${mode.value}" ${mode.value === defaults.mode ? "checked" : ""} /><span><b>${mode.label}</b><small>${mode.hint}</small></span></label>`
      )}
    </fieldset>
    <label class="it-field" data-passphrase ${defaults.mode === "passphrase" ? "" : "hidden"}><span>口令（至少 6 个字符）</span><input name="passphrase" type="password" autocomplete="new-password" /></label>
    <details class="it-help">
      <summary>高级设置</summary>
      <label class="it-field"><span>分支</span><input name="branch" value="${defaults.branch}" spellcheck="false" /></label>
      <label class="it-field"><span>数据目录</span><input name="dir" value="${defaults.dir}" spellcheck="false" /></label>
    </details>
    <button type="submit" class="it-button primary wide">连接</button>
    <details class="it-help">
      <summary>如何创建令牌</summary>
      <ol>
        <li>在 GitHub 打开 Settings → Developer settings → Personal access tokens → Fine-grained tokens，点击 Generate new token。</li>
        <li>Repository access 选择 Only select repositories，只勾选数据仓库。</li>
        <li>Repository permissions 里把 Contents 设为 Read and write，其他保持默认。</li>
        <li>生成后复制令牌，粘贴到上面的输入框。</li>
      </ol>
      <a class="it-external" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">打开 GitHub 令牌设置${icons.external}</a>
    </details>
  </form>
</main>`;

export const unlockView = (repo: string, error = "") => html`<main class="it-lock">
  <form class="it-lock-card" data-form="unlock" autocomplete="off">
    <h1>输入口令</h1>
    <p class="it-muted">${repo} 的访问令牌已用口令加密保存在这台设备上。</p>
    ${error ? html`<p class="it-error" role="alert">${error}</p>` : ""}
    <label class="it-field"><span>口令</span><input name="passphrase" type="password" required /></label>
    <button type="submit" class="it-button primary wide">解锁</button>
    <button type="button" class="it-text-button" data-action="forget">忘记口令，改用新令牌</button>
  </form>
</main>`;

export const loadingView = (message: string) => html`<main class="it-lock"><p class="it-loading" role="status">${message}</p></main>`;
