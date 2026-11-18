import { traceStages } from "../data/cst";

type Point = readonly [x: number, y: number];
type Flow = { points: readonly Point[]; color: string; delay?: number };
type Route = Flow & { path: Path2D; lengths: number[]; distance: number };

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;
const stageColors = ["#8de2ee", "#ffd58c", "#b5f297"];

function signalLayer(canvas: HTMLCanvasElement, flowsFor: (bounds: DOMRect) => Flow[]) {
  const context = canvas.getContext("2d");
  if (!context) return () => {};
  const ctx = context;
  let visible = false;
  let frame = 0;
  let bounds = canvas.getBoundingClientRect();
  let routes: Route[] = [];

  function draw(time: number) {
    frame = 0;
    ctx.clearRect(0, 0, bounds.width, bounds.height);
    if (!visible || reducedMotion.matches || root.dataset.cstReplay !== "running") return;
    for (const { points, color, delay = 0, path, lengths, distance } of routes) {
      ctx.strokeStyle = color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.55;
      ctx.setLineDash([3, 5]);
      ctx.stroke(path);
      ctx.setLineDash([]);

      // Advance along the path at an even speed, including its turns.
      const fraction = ((time + delay) % 1380) / 1380;
      let position = distance * fraction;
      let index = 0;
      while (index < lengths.length - 1 && position > lengths[index]) {
        position -= lengths[index];
        index++;
      }
      const [x0, y0] = points[index];
      const [x1, y1] = points[index + 1];
      const t = lengths[index] > 0 ? position / lengths[index] : 0;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      ctx.globalAlpha = Math.min(1, fraction * 10, (1 - fraction) * 10);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 11;
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    if (routes.length) frame = requestAnimationFrame(draw);
  }

  function refresh() {
    bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio, 2);
    const width = Math.round(bounds.width * ratio);
    const height = Math.round(bounds.height * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const flows = visible && width && height ? flowsFor(bounds) : [];
    routes = flows.filter(({ points }) => points.length >= 2).map((flow) => {
      const path = new Path2D();
      path.moveTo(...flow.points[0]);
      const lengths = flow.points.slice(1).map(([x, y], index) => {
        path.lineTo(x, y);
        return Math.hypot(x - flow.points[index][0], y - flow.points[index][1]);
      });
      return { ...flow, path, lengths, distance: lengths.reduce((total, length) => total + length, 0) };
    });
    cancelAnimationFrame(frame);
    draw(performance.now());
  }

  new ResizeObserver(refresh).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    refresh();
  }).observe(canvas);
  reducedMotion.addEventListener("change", refresh);
  return refresh;
}

// The paths follow the arrows in the paper's Figure 3.
const frameworkPaths: readonly (readonly Point[][])[] = [
  [
    [[.303, .257], [.338, .257]],
    [[.660, .363], [.689, .363]],
    [[.596, .021], [.842, .021], [.842, .051]],
  ],
  [
    [[.305, .771], [.343, .771]],
    [[.503, .602], [.503, .645]],
    [[.655, .833], [.706, .833]],
  ],
  [
    [[.851, .603], [.851, .645]],
    [[.706, .833], [.655, .833]],
    [[.343, .771], [.305, .771]],
  ],
];

const trace = document.querySelector<HTMLElement>("[data-trace]");
const method = document.querySelector<HTMLElement>("[data-method-panel]");
if (trace && method) {
  const board = trace;
  const methodPanel = method;
  const stageButtons = Array.from(board.querySelectorAll<HTMLButtonElement>("[data-trace-step]"));
  const sourceButtons = Array.from(board.querySelectorAll<HTMLButtonElement>("[data-trace-to]"));
  const sourceMessages = board.querySelectorAll<HTMLElement>("[data-source]");
  const replyNodes = board.querySelectorAll<HTMLElement>("[data-reply-node]");
  const toggle = board.querySelector<HTMLButtonElement>("[data-loop-toggle]")!;
  const title = board.querySelector<HTMLElement>("[data-stage-title]")!;
  const detail = board.querySelector<HTMLElement>("[data-stage-detail]")!;
  const announcement = board.querySelector<HTMLElement>("[data-trace-announcement]")!;
  const progressLine = board.querySelector<HTMLElement>(".trace-progress span")!;
  const methodButtons = Array.from(methodPanel.querySelectorAll<HTMLButtonElement>("[data-method]"));
  const followButton = methodPanel.querySelector<HTMLButtonElement>("[data-follow-figure]")!;
  const reviewSteps = document.querySelectorAll<HTMLElement>("[data-review-step]");
  const duration = 3600;
  let stage = 0;
  let playing = false;
  let following = true;
  let timeout = 0;
  let progress: Animation | undefined;
  let verifiedSource: string | undefined;
  let nextSource = 0;

  const updateTraceSignals = signalLayer(board.querySelector<HTMLCanvasElement>("[data-trace-signals]")!, (bounds) => {
    if (stage === 0) {
      const points: Point[] = Array.from(sourceMessages, (message) => {
        const rect = message.getBoundingClientRect();
        return [rect.left - bounds.left - 3, rect.top - bounds.top + 16];
      });
      return [{ points, color: stageColors[0] }];
    }
    return sourceButtons.flatMap((button, index) => {
      const id = button.dataset.traceTo;
      if (stage === 2 && id !== verifiedSource) return [];
      const source = board.querySelector<HTMLElement>('[data-source="' + id + '"]');
      if (!source) return [];
      const from = source.getBoundingClientRect();
      const to = button.getBoundingClientRect();
      const x = (from.right + to.left) / 2 - bounds.left;
      const start: Point = [from.right - bounds.left, from.top + from.height / 2 - bounds.top];
      const end: Point = [to.left - bounds.left, to.top + to.height / 2 - bounds.top];
      const points: Point[] = [start, [x, start[1]], [x, end[1]], end];
      return [{ points: stage === 2 ? points.reverse() : points, color: stageColors[stage], delay: index * 610 }];
    });
  });

  let figureStage = 0;
  const updateFigureSignals = signalLayer(methodPanel.querySelector<HTMLCanvasElement>("[data-framework-signals]")!, (bounds) =>
    frameworkPaths[figureStage].map((path, index) => ({
      points: path.map(([x, y]): Point => [x * bounds.width, y * bounds.height]),
      color: stageColors[figureStage],
      delay: index * 390,
    }))
  );

  function showFigure(index: number) {
    figureStage = index;
    methodPanel.dataset.methodActive = methodButtons[index].dataset.method;
    methodButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
    updateFigureSignals();
  }

  function setStage(index: number, sourceOverride?: string) {
    stage = index;
    verifiedSource = index === 2 ? sourceOverride ?? sourceButtons[nextSource++ % sourceButtons.length].dataset.traceTo : undefined;
    board.dataset.stage = String(index);
    root.dataset.cstPhase = String(index);
    stageButtons.forEach((button, i) => {
      if (i === index) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    sourceMessages.forEach((message) => {
      message.classList.toggle("replay-target", message.dataset.source === verifiedSource);
    });
    sourceButtons.forEach((button) => {
      button.classList.toggle("replay-target", button.dataset.traceTo === verifiedSource);
      button.setAttribute("aria-pressed", String(button.dataset.traceTo === verifiedSource));
    });
    replyNodes.forEach((node) => {
      node.classList.toggle("replay-target", node.dataset.replyNode === verifiedSource);
    });
    reviewSteps.forEach((step, i) => {
      step.toggleAttribute("data-current", i === index);
    });
    title.textContent = traceStages[index].title;
    detail.textContent = traceStages[index].detail;
    updateTraceSignals();
    if (following) showFigure(index);
  }

  function schedule() {
    window.clearTimeout(timeout);
    progress?.cancel();
    if (!playing) return;
    if (!reducedMotion.matches) {
      progress = progressLine.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration, fill: "forwards" });
    }
    timeout = window.setTimeout(() => {
      setStage((stage + 1) % traceStages.length);
      schedule();
    }, duration);
  }

  function setPlaying(value: boolean) {
    playing = value;
    board.dataset.playing = String(value);
    root.dataset.cstReplay = value ? "running" : "paused";
    toggle.textContent = value ? "Pause replay" : "Play replay";
    updateTraceSignals();
    updateFigureSignals();
    schedule();
  }

  toggle.hidden = false;
  toggle.addEventListener("click", () => setPlaying(!playing));
  stageButtons.forEach((button, index) => button.addEventListener("click", () => {
    setStage(index);
    schedule();
  }));
  sourceButtons.forEach((button) => button.addEventListener("click", () => {
    announcement.textContent = "Highlighted message " + button.dataset.traceTo + " in the source thread.";
    setStage(2, button.dataset.traceTo);
    schedule();
  }));
  followButton.hidden = false;
  followButton.addEventListener("click", () => {
    following = !following;
    followButton.setAttribute("aria-pressed", String(following));
    if (following) showFigure(stage);
  });
  methodButtons.forEach((button, index) => button.addEventListener("click", () => {
    following = false;
    followButton.setAttribute("aria-pressed", "false");
    showFigure(index);
  }));

  reducedMotion.addEventListener("change", schedule);
  setStage(0);
  setPlaying(true);
}

const reveal = new IntersectionObserver((entries, observer) => {
  entries.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting) return;
    target.setAttribute("data-revealed", "");
    observer.unobserve(target);
  });
}, { threshold: 0.12 });
document.querySelectorAll("[data-motion-section] .section-heading, .review-replay, .human-card").forEach((element) => reveal.observe(element));
