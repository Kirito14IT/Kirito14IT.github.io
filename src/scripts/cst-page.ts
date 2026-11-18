import { traceStages } from "../data/cst";
import type { figures, messageAP, recall } from "../data/cst";

function setPressed(buttons: NodeListOf<HTMLButtonElement>, selected: HTMLButtonElement) {
  buttons.forEach((button) => button.setAttribute("aria-pressed", String(button === selected)));
}

const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const trace = document.querySelector<HTMLElement>("[data-trace]");
if (trace) {
  const stageButtons = trace.querySelectorAll<HTMLButtonElement>("[data-trace-step]");
  const sourceButtons = trace.querySelectorAll<HTMLButtonElement>("[data-trace-to]");
  const sourceMessages = trace.querySelectorAll<HTMLElement>("[data-source]");
  const replyNodes = trace.querySelectorAll<HTMLElement>("[data-reply-node]");
  const toggle = trace.querySelector<HTMLButtonElement>("[data-loop-toggle]")!;
  const title = trace.querySelector<HTMLElement>("[data-stage-title]")!;
  const detail = trace.querySelector<HTMLElement>("[data-stage-detail]")!;
  const announcement = trace.querySelector<HTMLElement>("[data-trace-announcement]")!;
  const progressLine = trace.querySelector<HTMLElement>(".trace-progress span")!;
  const duration = 3200;
  let stage = 0;
  let playing = false;
  let timeout: number | undefined;
  let progress: Animation | undefined;

  function setStage(index: number) {
    stage = index;
    trace!.dataset.stage = String(index);
    title.textContent = traceStages[index].title;
    detail.textContent = traceStages[index].detail;
    stageButtons.forEach((button, i) => {
      if (i === index) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  }

  function schedule() {
    window.clearTimeout(timeout);
    progress?.cancel();
    if (!playing) return;
    if (!motionPreference.matches) {
      progress = progressLine.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration, fill: "forwards" });
    }
    timeout = window.setTimeout(() => {
      setStage((stage + 1) % traceStages.length);
      schedule();
    }, duration);
  }

  function setPlaying(value: boolean) {
    playing = value;
    trace!.dataset.playing = String(value);
    toggle.textContent = value ? "Pause replay" : "Play replay";
    schedule();
  }

  toggle.hidden = false;
  toggle.addEventListener("click", () => setPlaying(!playing));
  stageButtons.forEach((button, index) => button.addEventListener("click", () => {
    setStage(index);
    schedule();
  }));

  sourceButtons.forEach((button) => button.addEventListener("click", () => {
    const target = button.dataset.traceTo;
    setPressed(sourceButtons, button);
    sourceMessages.forEach((message) => message.classList.toggle("trace-target", message.dataset.source === target));
    replyNodes.forEach((node) => node.classList.toggle("trace-target", node.dataset.replyNode === target));
    announcement.textContent = "Highlighted message " + target + " in the source thread.";
    setStage(2);
    schedule();
  }));

  motionPreference.addEventListener("change", (event) => setPlaying(!event.matches));
  setPlaying(!motionPreference.matches);
}

const method = document.querySelector<HTMLElement>("[data-method-panel]");
if (method) {
  const buttons = method.querySelectorAll<HTMLButtonElement>("[data-method]");
  buttons.forEach((button) => button.addEventListener("click", () => {
    method.dataset.methodActive = button.dataset.method;
    setPressed(buttons, button);
  }));
}

for (const switcher of document.querySelectorAll<HTMLElement>("[data-switcher]")) {
  const tabs = Array.from(switcher.querySelectorAll<HTMLButtonElement>("[data-tab]"));
  const panels = switcher.querySelectorAll<HTMLElement>("[data-panel]");

  function activate(tab: HTMLButtonElement) {
    tabs.forEach((candidate) => {
      candidate.setAttribute("aria-selected", String(candidate === tab));
      candidate.tabIndex = candidate === tab ? 0 : -1;
    });
    panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== tab.dataset.tab; });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (event) => {
      const targets: Record<string, number> = {
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        ArrowRight: (index + 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      const next = targets[event.key];
      if (next === undefined) return;
      event.preventDefault();
      activate(tabs[next]);
      tabs[next].focus();
    });
  });

  if (switcher.dataset.switcher === "results") {
    document.querySelectorAll<HTMLElement>("[data-result-link]").forEach((link) => link.addEventListener("click", () => {
      const tab = tabs.find((candidate) => candidate.dataset.tab === link.dataset.resultLink);
      if (tab) activate(tab);
    }));
  }
}

const context = document.querySelector<HTMLElement>("#lab-context");
if (context) {
  const choices = context.querySelectorAll<HTMLButtonElement>("[data-context]");
  const thread = context.querySelector<HTMLElement>("[data-context-thread]")!;
  const negation = context.querySelector<HTMLElement>("[data-negation]")!;
  const stance = context.querySelector<HTMLElement>("[data-stance]")!;
  choices.forEach((button) => button.addEventListener("click", () => {
    const objection = button.dataset.context === "objection";
    setPressed(choices, button);
    thread.dataset.choice = button.dataset.context;
    negation.hidden = !objection;
    stance.textContent = objection ? "Sam agrees with the objection to removal." : "Sam supports the removal.";
  }));
}

const selection = document.querySelector<HTMLElement>("#lab-selection");
if (selection) {
  const choices = selection.querySelectorAll<HTMLButtonElement>("[data-example-budget]");
  const messages = selection.querySelectorAll<HTMLElement>("[data-selection-position]");
  const note = selection.querySelector<HTMLElement>("[data-example-note]")!;
  const notes = [
    "With one message, both selectors start with m1.",
    "At two messages, group round-robin reaches both topics, while risk order stays on the team topic.",
    "With room for all three messages, both selectors reach both topics.",
  ];
  choices.forEach((button) => button.addEventListener("click", () => {
    const budget = Number(button.dataset.exampleBudget);
    setPressed(choices, button);
    messages.forEach((message) => { message.hidden = Number(message.dataset.selectionPosition) > budget; });
    note.textContent = notes[budget - 1];
  }));
}

const presentation = document.querySelector<HTMLElement>("#lab-presentation");
if (presentation) {
  const choices = presentation.querySelectorAll<HTMLButtonElement>("[data-layout]");
  const views = presentation.querySelectorAll<HTMLElement>("[data-layout-view]");
  choices.forEach((button) => button.addEventListener("click", () => {
    setPressed(choices, button);
    views.forEach((view) => { view.hidden = view.dataset.layoutView !== button.dataset.layout; });
  }));
}

function updateBar(row: HTMLElement, value: number, maximum: number, label: string) {
  row.querySelector<HTMLElement>(".bar-track span")!.style.setProperty("--size", (100 * value / maximum) + "%");
  row.querySelector<HTMLElement>("strong")!.textContent = label;
}

const recallPanel = document.querySelector<HTMLElement>("[data-recall]");
if (recallPanel) {
  const data: typeof recall = JSON.parse(recallPanel.dataset.recall!);
  const cohort = recallPanel.querySelector<HTMLSelectElement>("[data-cohort]")!;
  const choices = recallPanel.querySelectorAll<HTMLButtonElement>("[data-budget]");
  const bars = recallPanel.querySelectorAll<HTMLElement>("[data-recall-bar]");
  const scope = recallPanel.querySelector<HTMLElement>("[data-recall-scope]")!;
  let index = 3;

  function update() {
    const cohortData = data[cohort.value as keyof typeof recall];
    scope.textContent = cohortData.scope;
    bars.forEach((row, i) => {
      const value = cohortData.rows[i][index];
      updateBar(row, value, 50, value.toFixed(2) + "%");
    });
  }

  cohort.addEventListener("change", update);
  choices.forEach((button) => button.addEventListener("click", () => {
    index = Number(button.dataset.budget);
    setPressed(choices, button);
    update();
  }));
}

const apPanel = document.querySelector<HTMLElement>("[data-ap]");
if (apPanel) {
  const data: typeof messageAP = JSON.parse(apPanel.dataset.ap!);
  const select = apPanel.querySelector<HTMLSelectElement>("[data-ap-task]")!;
  const rows = apPanel.querySelectorAll<HTMLElement>("[data-ap-bar]");
  select.addEventListener("change", () => {
    const task = data[Number(select.value)];
    rows.forEach((row, i) => updateBar(row, task.values[i], 1, task.values[i].toFixed(3)));
  });
}

const viewer = document.querySelector<HTMLDialogElement>("[data-figure-dialog]");
if (viewer) {
  const figuresById: typeof figures = JSON.parse(viewer.dataset.figures!);
  const image = viewer.querySelector<HTMLImageElement>("[data-enlarged-figure]")!;
  const caption = viewer.querySelector<HTMLElement>("#enlarged-caption")!;
  const link = viewer.querySelector<HTMLAnchorElement>("[data-open-original]")!;
  const close = viewer.querySelector<HTMLButtonElement>("[data-close-figure]")!;
  let opener: HTMLButtonElement | undefined;

  document.querySelectorAll<HTMLButtonElement>("[data-open-figure]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.openFigure as keyof typeof figures;
      const figure = figuresById[id];
      opener = button;
      const source = "/CST/assets/" + id + ".webp";
      image.src = source;
      image.alt = figure.name;
      caption.textContent = "Figure " + figure.number + " · " + figure.name;
      link.href = source;
      viewer.showModal();
      close.focus();
    });
  });
  close.addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener("close", () => opener?.focus());
}

const copy = document.querySelector<HTMLButtonElement>("[data-copy-bib]");
if (copy) {
  const code = document.querySelector<HTMLElement>("#citation-text")!;
  const status = document.querySelector<HTMLElement>("[data-copy-status]")!;
  let reset: number | undefined;
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent ?? "");
      copy.textContent = "Copied";
      status.textContent = "BibTeX copied to clipboard.";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selectedText = getSelection();
      selectedText?.removeAllRanges();
      selectedText?.addRange(range);
      copy.textContent = "Text selected";
      status.textContent = "BibTeX text selected for manual copying.";
    }
    window.clearTimeout(reset);
    reset = window.setTimeout(() => { copy.textContent = "Copy BibTeX"; }, 2200);
  });
}
