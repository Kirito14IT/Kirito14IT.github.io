import type { messageAP, recall } from "../data/cst";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const easing = "cubic-bezier(.2,.7,.25,1)";
type Beat = { duration: number; show?: () => void };
type Scene = { id: string; beats: Beat[] };

function press(buttons: NodeListOf<HTMLButtonElement>, name: string, value: string) {
  buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset[name] === value)));
}

function animate(element: Element, frames: Keyframe[], duration: number, delay = 0) {
  if (reducedMotion.matches) return;
  element.getAnimations().forEach((effect) => effect.cancel());
  element.animate(frames, { duration, delay, easing, fill: "backwards" });
}

function playbackLabel(button: HTMLButtonElement, playing: boolean, name: string) {
  const label = playing ? "Pause" : "Play";
  button.setAttribute("aria-label", label + " " + name);
  button.querySelector<HTMLElement>("[data-cycle-label]")!.textContent = label;
}

function cycleDeck(deck: HTMLElement, name: string, scenes: Scene[]) {
  const tabs = Array.from(deck.querySelectorAll<HTMLButtonElement>("[data-tab]"));
  const panels = Array.from(deck.querySelectorAll<HTMLElement>("[data-panel]"));
  const toggle = deck.querySelector<HTMLButtonElement>("[data-cycle-toggle]")!;
  const progress = deck.querySelector<HTMLElement>("[data-cycle-progress]")!;
  const announcement = deck.querySelector<HTMLElement>("[data-cycle-announcement]")!;
  let selected = 0;
  let beat = 0;
  let delay = scenes[0].beats[0].duration;
  let enabled = true;
  let visible = false;
  let started = false;
  let timer: number;
  let progressAnimation: Animation | undefined;

  function paintTab(index: number) {
    selected = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === selected));
      tab.tabIndex = i === selected ? 0 : -1;
    });
    panels.forEach((panel, i) => {
      panel.toggleAttribute("data-current-panel", i === selected);
      panel.inert = i !== selected;
    });
  }

  function transitionPanel() {
    animate(panels[selected], [{ opacity: .24, translate: "0 12px" }, { opacity: 1, translate: "0 0" }], 460);
    growBars(panels[selected]);
  }

  function nextBeat() {
    beat++;
    const advanceTab = beat >= scenes[selected].beats.length;
    if (advanceTab) {
      beat = 0;
      paintTab((selected + 1) % scenes.length);
    }
    const current = scenes[selected].beats[beat];
    current.show?.();
    if (advanceTab) transitionPanel();
    schedule(current.duration);
  }

  function schedule(duration = delay) {
    delay = duration;
    window.clearTimeout(timer);
    progressAnimation?.cancel();
    const focus = document.activeElement;
    const reading = deck.contains(focus) && focus !== toggle && focus instanceof HTMLElement
      && (focus.matches(":focus-visible") || focus instanceof HTMLSelectElement);
    const running = enabled && visible && !reading && !document.hidden;
    deck.toggleAttribute("data-cycle-running", running);
    if (!running) return;
    if (!reducedMotion.matches) {
      progressAnimation = progress.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
        duration, fill: "forwards",
      });
    }
    timer = window.setTimeout(nextBeat, duration);
  }

  function interact(message?: string) {
    if (message) announcement.textContent = message;
    schedule(7600);
  }

  function choose(id: string) {
    const index = scenes.findIndex((scene) => scene.id === id);
    if (index < 0) return;
    started = true;
    beat = -1;
    if (index !== selected) {
      paintTab(index);
      transitionPanel();
    }
    interact();
  }

  deck.setAttribute("data-cycle-ready", "");
  paintTab(0);
  panels.forEach((panel) => { panel.hidden = false; });
  toggle.hidden = false;
  deck.dataset.cyclePlaying = "true";
  toggle.addEventListener("click", () => {
    enabled = !enabled;
    deck.dataset.cyclePlaying = String(enabled);
    playbackLabel(toggle, enabled, name);
    schedule();
  });
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => choose(scenes[i].id));
    tab.addEventListener("keydown", (event) => {
      const keyboard = { ArrowLeft: (i + tabs.length - 1) % tabs.length, ArrowRight: (i + 1) % tabs.length, Home: 0, End: tabs.length - 1 };
      const next = keyboard[event.key as keyof typeof keyboard];
      if (next === undefined) return;
      event.preventDefault();
      choose(scenes[next].id);
      tabs[next].focus();
    });
  });
  deck.addEventListener("focusin", () => schedule());
  deck.addEventListener("focusout", () => queueMicrotask(() => schedule()));
  document.addEventListener("visibilitychange", () => schedule());
  reducedMotion.addEventListener("change", () => schedule());
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= .2;
    if (visible && !started) {
      started = true;
      scenes[0].beats[0].show?.();
      growBars(panels[0]);
    }
    schedule();
  }, { threshold: [.2] }).observe(deck);
  return { choose, interact };
}

function growBars(panel: HTMLElement) {
  panel.querySelectorAll(".bar-chart .bar-track > span").forEach((bar, i) => {
    animate(bar, [{ transform: "scaleX(0)" }, { transform: "scaleX(var(--size))" }], 740, i * 75);
  });
  panel.querySelectorAll(".bar-chart strong").forEach((value, i) => flipValue(value, i * 75));
}

function flipValue(element: Element, delay = 0) {
  animate(element, [{ opacity: .35, translate: "0 5px" }, { opacity: 1, translate: "0 0" }], 330, delay);
}

function startExamples(deck: HTMLElement) {
  const contexts = deck.querySelectorAll<HTMLButtonElement>("[data-context]");
  const thread = deck.querySelector<HTMLElement>("[data-context-thread]")!;
  const negation = deck.querySelector<HTMLElement>("[data-negation]")!;
  const stance = deck.querySelector<HTMLElement>("[data-stance]")!;
  const choices = deck.querySelectorAll<HTMLButtonElement>("[data-example-budget]");
  const messages = deck.querySelectorAll<HTMLElement>("[data-selection-position]");
  const note = deck.querySelector<HTMLElement>("[data-example-note]")!;
  const replay = deck.querySelector<HTMLButtonElement>("[data-replay-selection]")!;
  const layouts = deck.querySelectorAll<HTMLButtonElement>("[data-layout]");
  const views = Array.from(deck.querySelectorAll<HTMLElement>("[data-layout-view]"));
  const notes = [
    "With one message, both selectors start with m1.",
    "At two messages, group round-robin reaches both topics, while risk order stays on the team topic.",
    "With room for all three messages, both selectors reach both topics.",
  ];

  function showContext(choice: string) {
    const objection = choice === "objection";
    press(contexts, "context", choice);
    thread.dataset.choice = choice;
    negation.hidden = !objection;
    stance.textContent = objection ? "Sam agrees with the objection to removal." : "Sam supports the removal.";
    flipValue(stance);
  }

  function replaySelection() {
    messages.forEach((message) => {
      if (message.hidden) return;
      const position = Number(message.dataset.selectionPosition);
      animate(message, [
        { translate: "0 12px", opacity: .24, boxShadow: "inset 0 0 0 1px transparent" },
        { translate: "0 0", opacity: 1, boxShadow: "inset 0 0 0 1px #86dfcb88", offset: .55 },
        { translate: "0 0", opacity: 1, boxShadow: "inset 0 0 0 1px transparent" },
      ], 680, (position - 1) * 155);
    });
  }

  function showBudget(budget: number) {
    press(choices, "exampleBudget", String(budget));
    messages.forEach((message) => { message.hidden = Number(message.dataset.selectionPosition) > budget; });
    note.textContent = notes[budget - 1];
    replaySelection();
  }

  function showLayout(layout: string) {
    const next = views.find((view) => view.dataset.layoutView === layout)!;
    if (!next.hidden) return;
    const previous = views.find((view) => !view.hidden)!;
    const positions = new Map<string, DOMRect>();
    if (!reducedMotion.matches) {
      previous.querySelectorAll<HTMLElement>("[data-layout-message]").forEach((message) => {
        positions.set(message.dataset.layoutMessage!, message.getBoundingClientRect());
      });
    }
    press(layouts, "layout", layout);
    previous.hidden = true;
    next.hidden = false;
    next.querySelectorAll<HTMLElement>("[data-layout-message]").forEach((message, i) => {
      const from = positions.get(message.dataset.layoutMessage!);
      if (!from) return;
      const to = message.getBoundingClientRect();
      animate(message, [
        { translate: (from.x - to.x) + "px " + (from.y - to.y) + "px", opacity: .68 },
        { translate: "0 0", opacity: 1 },
      ], 720, i * 48);
    });
  }

  const cycle = cycleDeck(deck, "examples", [
    { id: "context", beats: [
      { duration: 2600, show: () => showContext("exclusion") },
      { duration: 2800, show: () => showContext("objection") },
    ] },
    { id: "selection", beats: [1, 2, 3].map((budget) => ({ duration: budget === 2 ? 2900 : 2050, show: () => showBudget(budget) })) },
    { id: "presentation", beats: [
      { duration: 2450, show: () => showLayout("flat") },
      { duration: 2850, show: () => showLayout("grouped") },
    ] },
  ]);
  contexts.forEach((button) => button.addEventListener("click", () => {
    showContext(button.dataset.context!);
    cycle.interact(stance.textContent!);
  }));
  choices.forEach((button) => button.addEventListener("click", () => {
    showBudget(Number(button.dataset.exampleBudget));
    cycle.interact(note.textContent!);
  }));
  replay.hidden = reducedMotion.matches;
  reducedMotion.addEventListener("change", () => { replay.hidden = reducedMotion.matches; });
  replay.addEventListener("click", () => {
    replaySelection();
    cycle.interact();
  });
  layouts.forEach((button) => button.addEventListener("click", () => {
    showLayout(button.dataset.layout!);
    cycle.interact(button.textContent!.trim() + " layout.");
  }));
}

function setBar(row: HTMLElement, value: number, maximum: number, label: string) {
  row.querySelector<HTMLElement>(".bar-track span")!.style.setProperty("--size", (100 * value / maximum) + "%");
  setValue(row.querySelector<HTMLElement>("strong")!, label);
}

function setValue(element: HTMLElement, value: string) {
  if (element.textContent === value) return;
  element.textContent = value;
  flipValue(element);
}

function startResults(deck: HTMLElement) {
  const recallPanel = deck.querySelector<HTMLElement>("[data-recall]")!;
  const data: typeof recall = JSON.parse(recallPanel.dataset.recall!);
  const cohort = recallPanel.querySelector<HTMLSelectElement>("[data-cohort]")!;
  const choices = recallPanel.querySelectorAll<HTMLButtonElement>("[data-budget]");
  const bars = recallPanel.querySelectorAll<HTMLElement>("[data-recall-bar]");
  const heatmap = recallPanel.querySelectorAll<HTMLElement>("[data-heatmap-col]");
  const scope = recallPanel.querySelector<HTMLElement>("[data-recall-scope]")!;
  const apPanel = deck.querySelector<HTMLElement>("[data-ap]")!;
  const tasks: typeof messageAP = JSON.parse(apPanel.dataset.ap!);
  const select = apPanel.querySelector<HTMLSelectElement>("[data-ap-task]")!;
  const rows = apPanel.querySelectorAll<HTMLElement>("[data-ap-bar]");
  const apGain = apPanel.querySelector<HTMLElement>("[data-ap-gain]")!;
  let budgetIndex = 3;

  function showRecall(index: number, cohortId: string) {
    budgetIndex = index;
    const cohortData = data[cohortId as keyof typeof recall];
    cohort.value = cohortId;
    press(choices, "budget", String(index));
    if (scope.textContent !== cohortData.scope) scope.textContent = cohortData.scope;
    bars.forEach((row, i) => {
      const value = cohortData.rows[i][index];
      setBar(row, value, 50, value.toFixed(2) + "%");
    });
    heatmap.forEach((cell) => {
      const column = Number(cell.dataset.heatmapCol);
      cell.toggleAttribute("data-active", column === index);
      if (cell.dataset.heatmapRow === undefined) return;
      const value = cohortData.rows[Number(cell.dataset.heatmapRow)][column];
      cell.textContent = value.toFixed(2);
      cell.style.setProperty("--intensity", (value * 1.8) + "%");
      cell.toggleAttribute("data-strong", value >= 35);
    });
  }

  function showAP(index: number) {
    select.value = String(index);
    const task = tasks[index];
    rows.forEach((row, i) => setBar(row, task.values[i], 1, task.values[i].toFixed(3)));
    const difference = task.values[2] - task.values[1];
    setValue(apGain, (difference > 0 ? "+" : "") + difference.toFixed(3));
  }

  const cycle = cycleDeck(deck, "results", [
    { id: "recall", beats: [
      { duration: 2300, show: () => showRecall(1, "full") },
      { duration: 2400, show: () => showRecall(3, "full") },
      { duration: 2800, show: () => showRecall(3, "isolated") },
    ] },
    { id: "ap", beats: tasks.map((_, i) => ({ duration: 1550, show: () => showAP(i) })) },
    { id: "cpu", beats: [{ duration: 4400 }] },
  ]);
  cohort.addEventListener("change", () => {
    showRecall(budgetIndex, cohort.value);
    cycle.interact(scope.textContent!);
  });
  choices.forEach((button) => button.addEventListener("click", () => {
    showRecall(Number(button.dataset.budget), cohort.value);
    cycle.interact();
  }));
  select.addEventListener("change", () => {
    showAP(Number(select.value));
    cycle.interact();
  });
  document.querySelectorAll<HTMLElement>("[data-result-link]").forEach((link) => {
    link.addEventListener("click", () => cycle.choose(link.dataset.resultLink!));
  });
}

const examples = document.querySelector<HTMLElement>('[data-switcher="lab"]');
if (examples) startExamples(examples);
const results = document.querySelector<HTMLElement>('[data-switcher="results"]');
if (results) startResults(results);

const gallery = document.querySelector<HTMLElement>("[data-figure-gallery]");
if (gallery) {
  const toggle = gallery.querySelector<HTMLButtonElement>("[data-gallery-toggle]")!;
  gallery.dataset.galleryPlaying = "true";
  toggle.hidden = reducedMotion.matches;
  toggle.addEventListener("click", () => {
    const playing = gallery.dataset.galleryPlaying !== "true";
    gallery.dataset.galleryPlaying = String(playing);
    playbackLabel(toggle, playing, "figure gallery");
  });
  reducedMotion.addEventListener("change", () => { toggle.hidden = reducedMotion.matches; });
}
