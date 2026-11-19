/* Publication demos: a small canvas runtime shared by the six project animations.
   Each scene declares its own logical size and draws its own light, paper-style frame;
   the stage scales it to the card and to the large view, and pauses it off screen. */

export const SANS = '"Helvetica Neue", Helvetica, Arial, "Segoe UI", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
export const SERIF = '"Times New Roman", Times, Georgia, "Noto Serif", "Songti SC", "SimSun", serif';
export const MONO = '"JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Microsoft YaHei", monospace';

const rgbCache = new Map();
export function rgba(hex, a) {
  let v = rgbCache.get(hex);
  if (!v) {
    const n = parseInt(hex.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    rgbCache.set(hex, v);
  }
  return `rgba(${v[0]},${v[1]},${v[2]},${a})`;
}
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ease = {
  out: (p) => 1 - Math.pow(1 - p, 3),
  in: (p) => p * p * p,
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  spring: (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.exp(-7.8 * p) * (Math.cos(10.4 * p) + 0.75 * Math.sin(10.4 * p))),
};
export const rand = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/* ---------- drawing helpers ---------- */
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  const q = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + q, y); ctx.arcTo(x + w, y, x + w, y + h, q); ctx.arcTo(x + w, y + h, x, y + h, q);
  ctx.arcTo(x, y + h, x, y, q); ctx.arcTo(x, y, x + w, y, q); ctx.closePath();
}
export function box(ctx, x, y, w, h, o = {}) {
  rr(ctx, x, y, w, h, o.r == null ? 6 : o.r);
  if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
  if (o.stroke) {
    ctx.lineWidth = o.lw || 1;
    ctx.strokeStyle = o.stroke;
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
export function font(ctx, size, weight = 400, family = "sans") {
  ctx.font = `${weight} ${size}px ${family === "serif" ? SERIF : family === "mono" ? MONO : SANS}`;
}
export function text(ctx, s, x, y, o = {}) {
  font(ctx, o.size || 11, o.weight || 400, o.serif ? "serif" : o.mono ? "mono" : "sans");
  if (o.italic) ctx.font = "italic " + ctx.font;
  ctx.textAlign = o.align || "left";
  ctx.textBaseline = o.base || "alphabetic";
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * (o.alpha == null ? 1 : o.alpha);
  ctx.fillStyle = o.color || "#1f2933";
  if (o.max) ctx.fillText(s, x, y, o.max); else ctx.fillText(s, x, y);
  ctx.globalAlpha = a0;
}
export const typed = (s, p) => s.slice(0, Math.round(s.length * clamp(p)));
/* line breaking for Latin words and CJK characters; CJK closing punctuation stays on its line */
export function wrap(ctx, s, maxW, size, weight = 400, family = "sans") {
  font(ctx, size, weight, family);
  const tokens = s.match(/[　-鿿＀-￯][，。、；：！？）」』]?|[^\s　-鿿＀-￯]+|\s+/g) || [];
  const lines = [];
  let line = "";
  tokens.forEach((tok) => {
    if (/^\s+$/.test(tok)) { if (line) line += " "; return; }
    const t = line + tok;
    if (ctx.measureText(t.trimEnd()).width > maxW && line.trim()) { lines.push(line.trimEnd()); line = tok; } else line = t;
  });
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}
export function para(ctx, s, x, y, maxW, o = {}) {
  const lines = wrap(ctx, s, maxW, o.size || 11, o.weight || 400, o.serif ? "serif" : o.mono ? "mono" : "sans");
  lines.forEach((ln, i) => text(ctx, ln, x, y + i * (o.lh || (o.size || 11) * 1.3), o));
  return lines.length;
}
export function dot(ctx, x, y, r, color, a = 1) {
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * a;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  ctx.globalAlpha = a0;
}
export function arrow(ctx, x1, y1, x2, y2, color, lw = 1.4, head = 5, p = 1) {
  const x = lerp(x1, x2, p), y = lerp(y1, y2, p), a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x, y); ctx.stroke();
  if (p > 0.6) {
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x - head * Math.cos(a - 0.45), y - head * Math.sin(a - 0.45));
    ctx.lineTo(x - head * Math.cos(a + 0.45), y - head * Math.sin(a + 0.45));
    ctx.closePath(); ctx.fill();
  }
}
export function check(ctx, x, y, s, color, p = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.2, s * 0.16); ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  const a = [x - s * 0.42, y], b = [x - s * 0.12, y + s * 0.3], c = [x + s * 0.45, y - s * 0.34];
  const k = clamp(p * 2), k2 = clamp(p * 2 - 1);
  ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], k), lerp(a[1], b[1], k));
  if (k2 > 0) ctx.lineTo(lerp(b[0], c[0], k2), lerp(b[1], c[1], k2));
  ctx.stroke();
}
export function cross(ctx, x, y, s, color, p = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.2, s * 0.16); ctx.lineCap = "round";
  const k = clamp(p * 2), k2 = clamp(p * 2 - 1), h = s * 0.36;
  ctx.beginPath(); ctx.moveTo(x - h, y - h); ctx.lineTo(x - h + 2 * h * k, y - h + 2 * h * k);
  if (k2 > 0) { ctx.moveTo(x + h, y - h); ctx.lineTo(x + h - 2 * h * k2, y - h + 2 * h * k2); }
  ctx.stroke();
}
export const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });

/* ---------- the stage: one canvas per scene, sized by the scene, paused off screen ---------- */
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };

export class Stage {
  constructor(host, scene, { lang = "en", big = false, before = null } = {}) {
    this.scene = scene;
    this.lang = lang;
    this.big = big;
    [this.W, this.H] = scene.size || [480, 300];
    this.t = reduced && scene.poster ? scene.poster : 0;
    this.last = 0;
    this.running = false;
    this.visible = false;
    this.root = el("div", `pub-demo pub-demo--${scene.id || "scene"}` + (big ? " pub-demo--big" : ""));
    this.canvas = el("canvas", "pub-demo-canvas", this.root);
    this.canvas.setAttribute("aria-hidden", "true");
    this.ctx = this.canvas.getContext("2d");
    if (before) host.insertBefore(this.root, before); else host.appendChild(this.root);
    this.state = scene.create ? scene.create(this) : {};
    this.frame = this.frame.bind(this);
    this.resize();
    if ("ResizeObserver" in window) { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.root); }
    else window.addEventListener("resize", () => this.resize());
    if ("IntersectionObserver" in window) {
      this.io = new IntersectionObserver((es) => es.forEach((e) => { this.visible = e.isIntersecting; this.sync(); }), { threshold: 0.12 });
      this.io.observe(this.root);
    } else { this.visible = true; this.sync(); }
    this.onVis = () => this.sync();
    document.addEventListener("visibilitychange", this.onVis);
  }
  get px() { return this.W / Math.max(1, this.cssW || this.W); }
  resize() {
    const w = this.root.clientWidth;
    if (!w) return;
    this.cssW = w;
    const h = Math.round((w * this.H) / this.W);
    this.canvas.style.height = h + "px";
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (this.canvas.width !== cw || this.canvas.height !== ch) { this.canvas.width = cw; this.canvas.height = ch; }
    this.scale = cw / this.W;
    this.render();
  }
  sync() {
    const go = this.visible && !document.hidden && !reduced;
    if (go && !this.running) { this.running = true; this.last = 0; requestAnimationFrame(this.frame); }
    else if (!go) this.running = false;
    if (!go) this.render();
  }
  frame(now) {
    if (!this.running) return;
    const dt = this.last ? Math.min(64, now - this.last) : 16;
    this.last = now;
    this.t = (this.t + dt) % this.scene.duration;
    this.render();
    requestAnimationFrame(this.frame);
  }
  render() {
    if (!this.scale) return;
    const ctx = this.ctx, D = this.scene.duration, t = this.t;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = this.scene.bg || "#ffffff";
    ctx.fillRect(0, 0, this.W, this.H);
    this.scene.draw(ctx, t, this.state, this);
    const fade = reduced ? 0 : Math.max(seg(t, D - 380, D), 1 - seg(t, 0, 340));
    if (fade > 0.001) { ctx.globalAlpha = fade; ctx.fillStyle = this.scene.bg || "#ffffff"; ctx.fillRect(0, 0, this.W, this.H); ctx.globalAlpha = 1; }
  }
  destroy() {
    this.running = false;
    if (this.io) this.io.disconnect();
    if (this.ro) this.ro.disconnect();
    document.removeEventListener("visibilitychange", this.onVis);
    this.root.remove();
  }
}

/* ---------- large view in a dialog, with the paper figure one tab away ---------- */
let dialog = null;
export function openLarge(scene, { lang, title, figureSrc, figureAlt }) {
  const L = lang === "zh"
    ? { anim: "动画", fig: "论文原图", close: "关闭" }
    : { anim: "Animation", fig: "Paper figure", close: "Close" };
  if (!dialog) {
    dialog = el("dialog", "pub-demo-dialog", document.body);
    dialog.innerHTML = '<div class="pub-demo-dialog-bar"><b class="pub-demo-dialog-title"></b><div class="pub-demo-tabs" role="tablist"><button type="button" role="tab" data-v="anim"></button><button type="button" role="tab" data-v="fig"></button></div><button type="button" class="pub-demo-close"></button></div><div class="pub-demo-dialog-body"></div>';
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
    dialog.querySelector(".pub-demo-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => { if (dialog._stage) { dialog._stage.destroy(); dialog._stage = null; } dialog.querySelector(".pub-demo-dialog-body").textContent = ""; });
  }
  const body = dialog.querySelector(".pub-demo-dialog-body");
  const tabs = [...dialog.querySelectorAll(".pub-demo-tabs button")];
  dialog.querySelector(".pub-demo-dialog-title").textContent = title;
  dialog.querySelector(".pub-demo-close").textContent = L.close;
  tabs[0].textContent = L.anim; tabs[1].textContent = L.fig;
  const [w, h] = scene.size || [480, 300];
  dialog.style.setProperty("--demo-w", Math.round(Math.min(1080, (window.innerHeight * 0.8 * w) / h)) + "px");
  const show = (v) => {
    tabs.forEach((b) => { const on = b.dataset.v === v; b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    if (dialog._stage) { dialog._stage.destroy(); dialog._stage = null; }
    body.textContent = "";
    if (v === "anim") dialog._stage = new Stage(body, scene, { lang, big: true });
    else { const img = el("img", "pub-demo-dialog-figure", body); img.src = figureSrc; img.alt = figureAlt || ""; }
  };
  tabs.forEach((b) => { b.onclick = () => show(b.dataset.v); });
  dialog.showModal();
  show("anim");
}
