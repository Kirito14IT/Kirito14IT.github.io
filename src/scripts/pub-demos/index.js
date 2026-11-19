/* Boots the publication demos on the homepage: each figure marked data-demo gets its animation once it nears
   the viewport. The paper figure stays in the figure; a toggle shows it, and the large view has it as a tab. */
import { Stage, openLarge } from "./engine.js";

const LOADERS = {
  scamweb: () => import("./scenes/scamweb.js"),
  memharmbench: () => import("./scenes/memharmbench.js"),
  cst: () => import("./scenes/cst.js"),
  safecoderl: () => import("./scenes/safecoderl.js"),
  sfmambanet: () => import("./scenes/sfmambanet.js"),
  mangrove: () => import("./scenes/mangrove.js"),
};
const lang = document.documentElement.dataset.locale === "zh" ? "zh" : "en";
const UI = lang === "zh"
  ? { fig: "论文原图", anim: "动画", open: "放大播放动画" }
  : { fig: "Figure", anim: "Animation", open: "Play the animation larger" };

function mount(fig, scene) {
  if (fig.classList.contains("has-demo")) return;
  const link = fig.querySelector(":scope > a");
  const img = fig.querySelector("img");
  const title = fig.closest("article")?.querySelector("h3")?.textContent.trim() || "";
  fig.classList.add("has-demo");
  const stage = new Stage(fig, scene, { lang, before: link ? link.nextSibling : null });
  const root = stage.root;
  root.setAttribute("role", "button");
  root.setAttribute("tabindex", "0");
  root.setAttribute("aria-label", `${UI.open}: ${title}`);
  const open = () => openLarge(scene, { lang, title, figureSrc: img?.getAttribute("src"), figureAlt: img?.getAttribute("alt") });
  root.addEventListener("click", open);
  root.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pub-demo-toggle";
  btn.textContent = UI.fig;
  btn.setAttribute("aria-pressed", "false");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const on = fig.classList.toggle("show-figure");
    btn.textContent = on ? UI.anim : UI.fig;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    if (!on) stage.resize();
  });
  fig.appendChild(btn);
}

function start(fig) {
  const load = LOADERS[fig.dataset.demo];
  if (load) load().then((m) => mount(fig, m.default)).catch(() => { /* the paper figure stays visible */ });
}

const figures = [...document.querySelectorAll("figure[data-demo]")];
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { io.unobserve(e.target); start(e.target); }
  }), { rootMargin: "500px 0px" });
  figures.forEach((f) => io.observe(f));
} else figures.forEach(start);
