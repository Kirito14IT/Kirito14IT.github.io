import type { ActionContext } from "../core/actions.ts";
import { todayInShanghai } from "../core/dates.ts";
import { emptyFilters, filterPostings, filtersFromParams, filtersToParams } from "../core/filters.ts";
import type { FacetKey } from "../core/filters.ts";
import { IN_FLIGHT_STATUSES, SUBMITTED_STATUSES } from "../core/types.ts";
import type { FileKey, Snapshot } from "../core/types.ts";
import { TOKEN_MODES, clearAuth, loadAuth, openToken, saveAuth } from "../data/auth.ts";
import type { AuthStores, RepoSettings, TokenMode } from "../data/auth.ts";
import { DEFAULT_API_BASE, createGitHubClient, parseRepo } from "../data/github.ts";
import { createTrackerSync } from "../data/sync.ts";
import type { SyncStatus, TrackerSync } from "../data/sync.ts";
import type { App } from "./app-api.ts";
import * as commands from "./commands.ts";
import { VIEWS, buildContext, emptyContactFilters, initialState } from "./context.ts";
import type { ContactFilters, View, ViewContext } from "./context.ts";
import { html } from "./html.ts";
import type { SafeHtml } from "./html.ts";
import { icons } from "./icons.ts";
import { applyImportPlan, exportCsv, exportJson, planImport } from "./transfer.ts";
import { boardView } from "./views/board.ts";
import { contactChips, contactsTable, contactsToolbar, filterContacts } from "./views/contacts.ts";
import { importDialog, settingsDialog } from "./views/dialogs.ts";
import type { ImportDialogState, ImportFormat } from "./views/dialogs.ts";
import { contactDrawer, postingDrawer } from "./views/drawer.ts";
import { connectView, loadingView, unlockView } from "./views/lock.ts";
import type { ConnectDefaults } from "./views/lock.ts";
import { overviewView } from "./views/overview.ts";
import type { KpiKey } from "./views/overview.ts";
import { postingsTable } from "./views/postings.ts";
import { shellView, syncText, tabsView } from "./views/shell.ts";
import { chipsRow, facetsPanel, postingToolbar } from "./views/toolbar.ts";

const THEME_KEY = "krico-theme";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const IMPORT_FORMATS: readonly ImportFormat[] = ["auto", "tracker", "codex-internships", "codex-contacts", "patch"];

// The API address can only be overridden while developing on this machine, so a crafted
// link can never send the token anywhere other than api.github.com.
const apiBase = () => {
  if (!LOCAL_HOSTS.has(location.hostname)) return DEFAULT_API_BASE;
  const override = new URLSearchParams(location.search).get("api") || "";
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(override) ? override : DEFAULT_API_BASE;
};

const describeError = (error: unknown) => (error instanceof Error ? error.message : String(error));

interface Connection {
  settings: RepoSettings;
  mode: TokenMode;
  warnings: string[];
}

interface FocusMark {
  selector: string;
  caret: number | null;
}

export const start = (root: HTMLElement) => {
  const stores: AuthStores = { local: window.localStorage, session: window.sessionStorage };
  const state = initialState();
  let sync: TrackerSync | null = null;
  let connection: Connection | null = null;
  let importState: ImportDialogState | null = null;
  let lastMerges = 0;
  let toastTimer = 0;
  let searchTimer = 0;
  let eventCounter = 0;

  const find = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector);
  const now = () => new Date().toISOString();
  const actionContext = (): ActionContext => ({
    today: todayInShanghai(),
    now: now(),
    newId: () => `E${Date.now().toString(36)}${(eventCounter += 1).toString(36)}${Math.random().toString(36).slice(2, 6)}`
  });
  const context = () => {
    if (!sync) throw new Error("数据尚未加载");
    return buildContext(sync.snapshot, state, todayInShanghai());
  };

  // ---- URL state -------------------------------------------------------------------
  const readHash = () => {
    const params = new URLSearchParams(location.hash.slice(1));
    const view = params.get("view") || "";
    state.view = (VIEWS as readonly string[]).includes(view) ? (view as View) : "overview";
    state.filters = filtersFromParams(params);
    const posting = params.get("p");
    const contact = params.get("c");
    state.open = posting ? { kind: "posting", id: posting } : contact ? { kind: "contact", id: contact } : null;
  };

  const writeHash = () => {
    const params = filtersToParams(state.filters);
    if (state.view !== "overview") params.set("view", state.view);
    if (state.open) params.set(state.open.kind === "posting" ? "p" : "c", state.open.id);
    const hash = params.toString();
    const next = `${location.pathname}${location.search}${hash ? `#${hash}` : ""}`;
    if (next !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(null, "", next);
  };

  // ---- Small UI helpers ------------------------------------------------------------
  const toast = (message: string, kind: "info" | "error" = "info") => {
    const element = find("[data-toast]");
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = kind;
    element.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (element.hidden = true), kind === "error" ? 6000 : 2400);
  };

  const renderThemeButton = () => {
    const button = find("[data-theme-button]");
    if (!button) return;
    const dark = document.documentElement.dataset.theme === "dark";
    button.innerHTML = (dark ? icons.sun : icons.moon).toString();
    button.setAttribute("aria-label", dark ? "切换到浅色主题" : "切换到深色主题");
  };

  const setTheme = (theme: "light" | "dark") => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // The choice simply will not persist.
    }
    renderThemeButton();
  };

  const captureFocus = (): FocusMark | null => {
    const element = document.activeElement as HTMLElement | null;
    if (!element || element === document.body || !root.contains(element)) return null;
    const keys = ["action", "input", "field", "id", "facet", "flag", "key", "contact", "posting", "company", "view"];
    let selector = keys
      .filter((key) => element.dataset[key] !== undefined)
      .map((key) => `[data-${key}="${CSS.escape(element.dataset[key] || "")}"]`)
      .join("");
    if (!selector) return null;
    if (element instanceof HTMLInputElement && element.type === "checkbox") selector += `[value="${CSS.escape(element.value)}"]`;
    const caret = element instanceof HTMLInputElement && element.type === "search" ? element.selectionStart : null;
    return { selector: `${element.tagName.toLowerCase()}${selector}`, caret };
  };

  const restoreFocus = (mark: FocusMark | null) => {
    if (!mark) return;
    const element = root.querySelector<HTMLElement>(mark.selector);
    if (!element || element === document.activeElement) return;
    element.focus({ preventScroll: true });
    if (mark.caret !== null && element instanceof HTMLInputElement) element.setSelectionRange(mark.caret, mark.caret);
  };

  // ---- Rendering --------------------------------------------------------------------
  const renderSync = (status: SyncStatus) => {
    const pill = find("[data-sync]");
    if (pill) {
      pill.textContent = syncText(status);
      pill.dataset.state = status.state;
    }
    const banner = find("[data-banner]");
    if (banner) {
      if (status.state === "auth") {
        banner.hidden = false;
        banner.innerHTML = html`${icons.alert}<span>${status.message || "令牌已失效"}。未同步的修改已暂存在本机，重新连接后会自动保存。</span><button type="button" class="it-button" data-action="reconnect">重新连接</button>`.toString();
      } else if (status.state === "error") {
        banner.hidden = false;
        banner.innerHTML = html`${icons.alert}<span>${status.message}</span><button type="button" class="it-button" data-action="retry">${icons.refresh}立即重试</button>`.toString();
      } else {
        banner.hidden = true;
        banner.innerHTML = "";
      }
    }
    if (status.merges > lastMerges) {
      lastMerges = status.merges;
      toast("已合并其他设备上的修改");
    }
  };

  const renderToolbar = () => {
    const toolbar = find("[data-toolbar]");
    if (!toolbar || !sync) return;
    const ctx = context();
    toolbar.hidden = state.view === "overview";
    toolbar.innerHTML = state.view === "overview" ? "" : (state.view === "contacts" ? contactsToolbar(ctx) : postingToolbar(ctx)).toString();
  };

  const renderDrawer = (ctx: ViewContext, focusTitle: boolean) => {
    const drawer = find("[data-drawer]");
    const scrim = find("[data-scrim]");
    if (!drawer || !scrim) return;
    const target = state.open;
    let content: SafeHtml | null = null;
    if (target?.kind === "posting") {
      const posting = ctx.postingsById.get(target.id);
      if (posting) content = postingDrawer(ctx, posting);
    } else if (target?.kind === "contact") {
      const contact = ctx.contactsById.get(target.id);
      if (contact) content = contactDrawer(ctx, contact);
    }
    if (!target || !content) {
      state.open = null;
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      drawer.innerHTML = "";
      delete drawer.dataset.target;
      scrim.hidden = true;
      document.body.classList.remove("it-drawer-open");
      return;
    }
    const key = `${target.kind}:${target.id}`;
    const same = drawer.dataset.target === key;
    const scrollTop = drawer.scrollTop;
    drawer.innerHTML = content.toString();
    drawer.dataset.target = key;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    scrim.hidden = false;
    document.body.classList.add("it-drawer-open");
    drawer.scrollTop = same ? scrollTop : 0;
    if (focusTitle) drawer.querySelector<HTMLElement>("[data-drawer-title]")?.focus({ preventScroll: true });
  };

  const render = (options: { focusDrawer?: boolean } = {}) => {
    if (!sync) return;
    const focus = options.focusDrawer ? null : captureFocus();
    const ctx = context();
    const tabs = find("[data-tabs]");
    if (tabs) {
      tabs.innerHTML = tabsView(state.view, {
        postings: ctx.postings.length,
        contacts: ctx.snapshot.contacts.contacts.filter((contact) => !contact.archived).length
      })
        .map(String)
        .join("");
    }
    const main = find("[data-main]");
    const chips = find("[data-chips]");
    if (main) {
      if (state.view === "overview") {
        main.innerHTML = overviewView(ctx).toString();
      } else if (state.view === "contacts") {
        const list = filterContacts(ctx);
        main.innerHTML = contactsTable(ctx, list).toString();
        if (chips) chips.innerHTML = contactChips(ctx, list.length).toString();
      } else {
        const list = filterPostings(ctx.postings, state.filters, ctx.filterCtx);
        main.innerHTML = (state.view === "board" ? boardView(ctx, list) : postingsTable(ctx, list)).toString();
        const facets = find("[data-facets]");
        if (facets) facets.innerHTML = facetsPanel(ctx).map(String).join("");
        if (chips) chips.innerHTML = chipsRow(ctx, list.length).toString();
      }
    }
    renderDrawer(ctx, Boolean(options.focusDrawer));
    restoreFocus(focus);
  };

  const renderShell = () => {
    if (!sync) return;
    root.innerHTML = shellView().toString();
    renderThemeButton();
    renderToolbar();
    render();
    renderSync(sync.status);
  };

  // ---- Navigation ------------------------------------------------------------------
  const setView = (view: View) => {
    state.view = view;
    state.openFacet = null;
    writeHash();
    renderToolbar();
    render();
    window.scrollTo({ top: 0 });
  };

  const openPosting = (id: string) => {
    state.open = { kind: "posting", id };
    state.editingFacts = false;
    writeHash();
    render({ focusDrawer: true });
  };

  const openContact = (id: string) => {
    state.open = { kind: "contact", id };
    state.editingFacts = false;
    writeHash();
    render({ focusDrawer: true });
  };

  const closeDrawer = () => {
    state.open = null;
    state.editingFacts = false;
    writeHash();
    render();
  };

  const afterFilterChange = () => {
    writeHash();
    render();
  };

  const closeFacets = (except?: Element | null) => {
    root.querySelectorAll<HTMLDetailsElement>(".it-facet[open]").forEach((details) => {
      if (details !== except) details.open = false;
    });
    if (!except) state.openFacet = null;
  };

  const closeMenus = () => root.querySelectorAll<HTMLDetailsElement>(".it-menu[open]").forEach((details) => (details.open = false));

  const applyKpi = (key: KpiKey) => {
    if (key === "followUps") {
      document.getElementById("it-followups")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const filters = { ...emptyFilters(), sort: state.filters.sort };
    if (key === "submitted") filters.status = [...SUBMITTED_STATUSES];
    if (key === "inFlight") filters.status = [...IN_FLIGHT_STATUSES];
    if (key === "offer") filters.status = ["offer"];
    if (key === "closingSoon") filters.deadline = ["soon"];
    state.filters = filters;
    setView("postings");
  };

  // ---- Dialogs ---------------------------------------------------------------------
  const dialog = () => find<HTMLDialogElement>("[data-dialog]");

  const openDialog = (content: SafeHtml) => {
    const element = dialog();
    if (!element) return;
    element.innerHTML = content.toString();
    if (!element.open) element.showModal();
    element.querySelector<HTMLElement>("input:not([type=hidden]):not([type=file]), select, textarea")?.focus();
  };

  const closeDialog = () => {
    const element = dialog();
    if (element?.open) element.close();
    importState = null;
  };

  const readImportForm = (form: HTMLFormElement): ImportDialogState => {
    const data = new FormData(form);
    const format = String(data.get("format") || "auto");
    return {
      text: String(data.get("text") || ""),
      format: (IMPORT_FORMATS as readonly string[]).includes(format) ? (format as ImportFormat) : "auto",
      batch: String(data.get("batch") || "").trim(),
      includeRestricted: data.get("includeRestricted") === "on",
      preview: null,
      error: ""
    };
  };

  const previewImport = (form: HTMLFormElement) => {
    if (!sync) return;
    const next = readImportForm(form);
    try {
      const plan = planImport(sync.snapshot, next, now(), todayInShanghai());
      next.preview = { format: plan.format, lines: plan.lines, changes: plan.changes };
      if (plan.changes === 0) next.error = "这个批次没有需要导入的新内容。";
    } catch (error) {
      next.error = describeError(error);
    }
    importState = next;
    openDialog(importDialog(next));
  };

  const confirmImport = (form: HTMLFormElement) => {
    if (!sync) return;
    const input = readImportForm(form);
    try {
      const plan = planImport(sync.snapshot, input, now(), todayInShanghai());
      if (plan.changes === 0) {
        toast("没有需要导入的内容");
        return;
      }
      if (applyImportPlan(app, plan, input.batch || `import-${todayInShanghai()}`)) {
        closeDialog();
        toast(`已导入：${plan.lines[0] || ""}`);
      }
    } catch (error) {
      toast(describeError(error), "error");
    }
  };

  // ---- Data access ------------------------------------------------------------------
  const mutate = <K extends FileKey>(key: K, message: string, edit: (file: Snapshot[K], ctx: ActionContext) => void) => {
    if (!sync) return false;
    const ctx = actionContext();
    try {
      sync.update(key, (file) => edit(file, ctx), message);
    } catch (error) {
      toast(describeError(error), "error");
      return false;
    }
    render();
    return true;
  };

  const app: App = {
    get state() {
      return state;
    },
    get sync() {
      return sync;
    },
    context,
    render: () => render(),
    toast,
    mutate,
    openDialog,
    closeDialog,
    openPosting
  };

  // ---- Connecting ------------------------------------------------------------------
  const defaultsFromStorage = (overrides: Partial<ConnectDefaults> = {}): ConnectDefaults => {
    const saved = loadAuth(stores);
    return {
      repo: saved ? `${saved.owner}/${saved.repo}` : "",
      branch: saved?.branch || "main",
      dir: saved?.dir ?? "data",
      mode: saved?.mode || "device",
      ...overrides
    };
  };

  const showConnect = (error = "", overrides: Partial<ConnectDefaults> = {}) => {
    sync = null;
    connection = null;
    const defaults = defaultsFromStorage(overrides);
    root.innerHTML = connectView(defaults, error).toString();
    find<HTMLInputElement>(`input[name="${defaults.repo ? "token" : "repo"}"]`)?.focus();
  };

  const connect = async (settings: RepoSettings, token: string, mode: TokenMode, persist: { passphrase?: string } | null) => {
    root.innerHTML = loadingView("正在连接数据仓库…").toString();
    const client = createGitHubClient({ fetch: (input, init) => window.fetch(input, init), token, ref: { ...settings, apiBase: apiBase() } });
    try {
      const access = await client.checkAccess();
      if (!access.canPush) throw new Error("这个令牌只能读取，不能保存修改。请在令牌设置里把 Contents 设为 Read and write。");
      const instance = createTrackerSync({
        client,
        storage: mode === "tab" ? window.sessionStorage : window.localStorage,
        draftKey: `private-page:draft:${settings.owner}/${settings.repo}`,
        onStatus: renderSync,
        onChange: () => render()
      });
      root.innerHTML = loadingView("正在读取数据…").toString();
      const { warnings } = await instance.load();
      if (persist) await saveAuth(stores, { ...settings, mode, token, passphrase: persist.passphrase });
      sync = instance;
      connection = { settings, mode, warnings };
      lastMerges = instance.status.merges;
      renderShell();
      if (warnings.length > 0) toast(`数据里有 ${warnings.length} 条格式提示，可以在设置里查看`);
    } catch (error) {
      showConnect(describeError(error), { repo: `${settings.owner}/${settings.repo}`, branch: settings.branch, dir: settings.dir, mode });
    }
  };

  const submitConnect = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    const repo = parseRepo(String(data.get("repo") || ""));
    const token = String(data.get("token") || "").trim();
    const modeValue = String(data.get("mode") || "device");
    const mode = (TOKEN_MODES as readonly string[]).includes(modeValue) ? (modeValue as TokenMode) : "device";
    const passphrase = String(data.get("passphrase") || "");
    const branch = String(data.get("branch") || "").trim() || "main";
    const dir = String(data.get("dir") ?? "data").trim().replace(/^\/+|\/+$/g, "");
    const keep = { repo: String(data.get("repo") || ""), branch, dir, mode };
    if (!repo) return showConnect("数据仓库的格式应为 owner/name", keep);
    if (!token) return showConnect("请填写访问令牌", keep);
    if (mode === "passphrase" && passphrase.length < 6) return showConnect("口令至少需要 6 个字符", keep);
    await connect({ owner: repo.owner, repo: repo.repo, branch, dir }, token, mode, { passphrase });
  };

  const submitUnlock = async (form: HTMLFormElement) => {
    const saved = loadAuth(stores);
    if (!saved?.sealed) return showConnect();
    const passphrase = String(new FormData(form).get("passphrase") || "");
    try {
      const token = await openToken(saved.sealed, passphrase);
      await connect(saved, token, "passphrase", null);
    } catch (error) {
      root.innerHTML = unlockView(`${saved.owner}/${saved.repo}`, describeError(error)).toString();
      find<HTMLInputElement>('input[name="passphrase"]')?.focus();
    }
  };

  const lock = async () => {
    if (sync?.hasUnsaved()) {
      await sync.flush();
      if (sync.hasUnsaved() && !window.confirm("还有修改没有同步到 GitHub。锁定后它们仍暂存在本机，下次连接时会恢复。确定锁定吗？")) return;
    }
    clearAuth(stores);
    closeDialog();
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    showConnect();
  };

  const changeToken = async () => {
    await sync?.flush();
    const current = connection?.settings;
    closeDialog();
    showConnect("", current ? { repo: `${current.owner}/${current.repo}`, branch: current.branch, dir: current.dir } : {});
  };

  // ---- Events ----------------------------------------------------------------------
  const handleClick = async (element: HTMLElement) => {
    const { dataset } = element;
    const id = dataset.id || "";
    switch (dataset.action) {
      case "view":
        if ((VIEWS as readonly string[]).includes(dataset.view || "")) setView(dataset.view as View);
        break;
      case "open-posting":
        if (dialog()?.open) closeDialog();
        openPosting(id);
        break;
      case "open-contact":
        openContact(id);
        break;
      case "close-drawer":
        closeDrawer();
        break;
      case "star":
        commands.toggleStarFor(app, id);
        break;
      case "applied-today":
        commands.markAppliedToday(app, id);
        break;
      case "advance":
        commands.advance(app, id);
        break;
      case "remove-facet": {
        const key = dataset.facet as FacetKey;
        const value = (element as HTMLButtonElement).value;
        if (state.filters[key]) state.filters[key] = state.filters[key].filter((item) => item !== value);
        afterFilterChange();
        break;
      }
      case "clear-filters":
        state.filters = { ...emptyFilters(), sort: state.filters.sort };
        renderToolbar();
        afterFilterChange();
        break;
      case "clear-contact-filters":
        state.contactFilters = emptyContactFilters();
        renderToolbar();
        render();
        break;
      case "kpi":
        applyKpi(dataset.kpi as KpiKey);
        break;
      case "filter-company":
        state.filters = { ...emptyFilters(), company: [dataset.company || ""] };
        closeDrawer();
        setView("postings");
        break;
      case "filter-program":
        state.filters = { ...emptyFilters(), program: [dataset.program || ""] };
        setView("postings");
        break;
      case "delete-event":
        if (window.confirm("删除这条记录？")) commands.removeEvent(app, dataset.event || "");
        break;
      case "email-sent":
        commands.markEmailSent(app, dataset.contact || "", dataset.posting || "");
        break;
      case "copy":
        try {
          await navigator.clipboard.writeText(dataset.copy || "");
          toast("已复制");
        } catch {
          toast("复制失败，请手动选择文字复制", "error");
        }
        break;
      case "edit-facts":
        state.editingFacts = true;
        render();
        break;
      case "cancel-facts":
        state.editingFacts = false;
        render();
        break;
      case "derive-posting":
        commands.openAddPosting(app, id);
        break;
      case "new-posting":
        closeMenus();
        commands.openAddPosting(app);
        break;
      case "import":
        importState = { text: "", format: "auto", batch: `import-${todayInShanghai()}`, includeRestricted: false, preview: null, error: "" };
        openDialog(importDialog(importState));
        break;
      case "import-preview": {
        const form = element.closest("form");
        if (form) previewImport(form);
        break;
      }
      case "export-json":
        closeMenus();
        exportJson(app);
        break;
      case "export-csv":
        closeMenus();
        exportCsv(app);
        break;
      case "settings":
        if (connection) openDialog(settingsDialog(context(), { ...connection.settings, mode: connection.mode, warnings: connection.warnings }));
        break;
      case "change-token":
        await changeToken();
        break;
      case "theme":
        setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
        break;
      case "lock":
        await lock();
        break;
      case "reconnect": {
        const current = connection?.settings;
        showConnect("令牌已失效，请重新输入。未同步的修改会在连接后自动保存。", current ? { repo: `${current.owner}/${current.repo}`, branch: current.branch, dir: current.dir } : {});
        break;
      }
      case "retry":
        await sync?.flush();
        break;
      case "close-dialog":
        closeDialog();
        break;
      case "forget":
        clearAuth(stores);
        showConnect();
        break;
    }
  };

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (!target.closest(".it-facet")) closeFacets();
    if (!target.closest(".it-menu")) closeMenus();
    if (target === dialog()) {
      closeDialog();
      return;
    }
    const element = target.closest<HTMLElement>("[data-action]");
    if (!element) {
      if (target.closest("button, a, select, input, textarea, label, summary")) return;
      const row = target.closest<HTMLElement>("[data-row]");
      if (row?.dataset.row) openPosting(row.dataset.row);
      const contactRow = target.closest<HTMLElement>("[data-contact-row]");
      if (contactRow?.dataset.contactRow) openContact(contactRow.dataset.contactRow);
      return;
    }
    if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) return;
    void handleClick(element);
  });

  root.addEventListener("change", (event) => {
    const element = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { dataset } = element;
    const id = dataset.id || "";
    const checked = element instanceof HTMLInputElement && element.checked;
    if (element.name === "mode" && element.closest('[data-form="connect"]')) {
      const field = find("[data-passphrase]");
      if (field) field.hidden = element.value !== "passphrase";
      return;
    }
    switch (dataset.action) {
      case "status":
        commands.changeStatus(app, id, element.value);
        break;
      case "facet": {
        const key = dataset.facet as FacetKey;
        const current = state.filters[key] || [];
        state.filters[key] = checked ? [...current, element.value] : current.filter((item) => item !== element.value);
        state.openFacet = key;
        afterFilterChange();
        break;
      }
      case "flag": {
        const flag = dataset.flag as "starred" | "hasEmail" | "showEnded";
        state.filters[flag] = checked;
        afterFilterChange();
        break;
      }
      case "sort":
        state.filters.sort = element.value as typeof state.filters.sort;
        afterFilterChange();
        break;
      case "progress-field":
        commands.updateProgressField(app, id, dataset.field || "", element.value);
        break;
      case "contact-status":
        commands.changeContactStatus(app, id, element.value);
        break;
      case "contact-field":
        commands.updateContactField(app, id, dataset.field || "", element.value);
        break;
      case "company-note":
        commands.saveCompanyNote(app, dataset.company || "", element.value);
        break;
      case "contact-filter": {
        const key = dataset.key as keyof ContactFilters;
        if (key !== "linkedOnly") state.contactFilters[key] = element.value;
        render();
        break;
      }
      case "contact-linked":
        state.contactFilters.linkedOnly = checked;
        render();
        break;
      case "import-file": {
        const file = element instanceof HTMLInputElement ? element.files?.[0] : undefined;
        const form = element.closest("form");
        if (!file || !form) break;
        void file.text().then((text) => {
          const next = readImportForm(form);
          next.text = text;
          if (!next.batch || next.batch.startsWith("import-")) next.batch = file.name.replace(/\.json$/i, "");
          importState = next;
          openDialog(importDialog(next));
        });
        break;
      }
    }
  });

  root.addEventListener("input", (event) => {
    const element = event.target as HTMLInputElement;
    if (element.dataset.input === "search") {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        state.filters.q = element.value;
        afterFilterChange();
      }, 150);
    } else if (element.dataset.input === "contact-search") {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        state.contactFilters.q = element.value;
        render();
      }, 150);
    }
  });

  root.addEventListener("submit", (event) => {
    const form = event.target as HTMLFormElement;
    event.preventDefault();
    switch (form.dataset.form) {
      case "connect":
        void submitConnect(form);
        break;
      case "unlock":
        void submitUnlock(form);
        break;
      case "event":
        commands.addTimelineEvent(app, form);
        break;
      case "facts":
        commands.saveFacts(app, form);
        break;
      case "add-posting":
        commands.submitNewPosting(app, form);
        break;
      case "import":
        confirmImport(form);
        break;
      case "settings":
        commands.saveSettings(app, form);
        break;
    }
  });

  // <details> toggle events do not bubble, so listen during capture.
  root.addEventListener(
    "toggle",
    (event) => {
      const details = event.target as HTMLDetailsElement;
      if (!(details instanceof HTMLDetailsElement) || !details.classList.contains("it-facet")) return;
      const key = details.dataset.facetKey as FacetKey;
      if (details.open) {
        state.openFacet = key;
        closeFacets(details);
      } else if (state.openFacet === key) {
        state.openFacet = null;
      }
    },
    true
  );

  document.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement;
    const typing = Boolean(target.closest?.("input, textarea, select, [contenteditable]"));
    if (dialog()?.open) return;
    if (event.key === "/" && !typing && sync) {
      const search = find<HTMLInputElement>("[data-input]");
      if (search) {
        event.preventDefault();
        search.focus();
        search.select();
      }
    } else if (event.key === "Escape") {
      if (state.openFacet) closeFacets();
      else if (state.open) closeDrawer();
    }
  });

  window.addEventListener("hashchange", () => {
    readHash();
    if (!sync) return;
    renderToolbar();
    render();
  });

  window.addEventListener("beforeunload", (event) => {
    if (sync?.hasUnsaved()) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void sync?.flush();
  });

  // ---- Boot ------------------------------------------------------------------------
  readHash();
  const saved = loadAuth(stores);
  if (!saved) {
    showConnect();
  } else if (saved.token) {
    void connect(saved, saved.token, saved.mode, null);
  } else {
    root.innerHTML = unlockView(`${saved.owner}/${saved.repo}`).toString();
    find<HTMLInputElement>('input[name="passphrase"]')?.focus();
  }
};
