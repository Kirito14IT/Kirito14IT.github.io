/* Publication demos: a small canvas runtime shared by the six project animations.
   Every scene draws in a 480 x 300 logical frame; the stage scales it to the card and to the large view.
   The ambient aurora behind each scene follows the story: it flares magenta when the method finds the threat. */

export const W = 480;
export const H = 300;
export const FONT = '"Inter Variable", Inter, "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
export const MONO = '"JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Microsoft YaHei", monospace';
export const C = {
  night: "#07031A",
  deep: "#120A38",
  violet: "#5D34D0",
  magenta: "#FF006E",
  cyan: "#00F0FF",
  blue: "#3B82F6",
  purple: "#A855F7",
  pink: "#EC4899",
  ink: "#F7F4FF",
};

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
export function mix(h1, h2, p) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const ch = (s) => Math.round(((a >> s) & 255) + ((((b >> s) & 255) - ((a >> s) & 255)) * p));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ease = {
  out: (p) => 1 - Math.pow(1 - p, 3),
  in: (p) => p * p * p,
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  /* under-damped spring that settles by p = 1 (about 9 % overshoot) */
  spring: (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.exp(-7.8 * p) * (Math.cos(10.4 * p) + 0.75 * Math.sin(10.4 * p))),
};
export const rand = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/* ---------- drawing helpers (all in logical units) ---------- */
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  const q = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + q, y); ctx.arcTo(x + w, y, x + w, y + h, q); ctx.arcTo(x + w, y + h, x, y + h, q);
  ctx.arcTo(x, y + h, x, y, q); ctx.arcTo(x, y, x + w, y, q); ctx.closePath();
}
export function panel(ctx, x, y, w, h, o = {}) {
  rr(ctx, x, y, w, h, o.r == null ? 9 : o.r);
  ctx.fillStyle = o.fill || "rgba(22, 12, 64, .62)";
  ctx.fill();
  if (o.stroke !== false) {
    ctx.lineWidth = o.lw || 1;
    ctx.strokeStyle = o.stroke || "rgba(196, 176, 255, .24)";
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.blur || 12; }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
export function font(ctx, size, weight = 500, mono = false) {
  ctx.font = `${weight} ${size}px ${mono ? MONO : FONT}`;
}
export function text(ctx, s, x, y, o = {}) {
  font(ctx, o.size || 11, o.weight || 500, o.mono);
  ctx.textAlign = o.align || "left";
  ctx.textBaseline = o.base || "alphabetic";
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * (o.alpha == null ? 1 : o.alpha);
  ctx.fillStyle = o.color || C.ink;
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.blur || 10; }
  if (o.max) ctx.fillText(s, x, y, o.max); else ctx.fillText(s, x, y);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = a0;
}
/* typewriter: the first p share of the characters */
export const typed = (s, p) => s.slice(0, Math.round(s.length * clamp(p)));
/* line breaking for Latin words and CJK characters; trailing CJK punctuation stays on its line */
export function wrap(ctx, s, maxW, size, weight = 500, mono = false) {
  font(ctx, size, weight, mono);
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
export function glowStroke(ctx, color, width, blur, path) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  path();
  ctx.stroke();
  ctx.shadowBlur = 0;
}
export function dot(ctx, x, y, r, color, a = 1, halo = 0) {
  const a0 = ctx.globalAlpha;
  if (halo) {
    ctx.globalAlpha = a0 * a * 0.22;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r * halo, 0, 6.2832); ctx.fill();
  }
  ctx.globalAlpha = a0 * a;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  ctx.globalAlpha = a0;
}
/* point along a cubic bezier */
export function bez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
}
export function check(ctx, x, y, s, color, p = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = s * 0.18; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  const a = [x - s * 0.42, y], b = [x - s * 0.12, y + s * 0.3], c = [x + s * 0.45, y - s * 0.34];
  const k = clamp(p * 2), k2 = clamp(p * 2 - 1);
  ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], k), lerp(a[1], b[1], k));
  if (k2 > 0) ctx.lineTo(lerp(b[0], c[0], k2), lerp(b[1], c[1], k2));
  ctx.stroke();
}
export function cross(ctx, x, y, s, color, p = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = s * 0.18; ctx.lineCap = "round";
  const k = clamp(p * 2), k2 = clamp(p * 2 - 1), h = s * 0.38;
  ctx.beginPath(); ctx.moveTo(x - h, y - h); ctx.lineTo(x - h + 2 * h * k, y - h + 2 * h * k);
  if (k2 > 0) { ctx.moveTo(x + h, y - h); ctx.lineTo(x + h - 2 * h * k2, y - h + 2 * h * k2); }
  ctx.stroke();
}
/* bracket corners that close in on a box: p = 0 wide and faint, p = 1 snug */
export function brackets(ctx, x, y, w, h, p, color, lw = 1.6) {
  const e = ease.spring(p), pad = (1 - e) * 16, L = Math.min(w, h) * 0.28 + 3;
  const x0 = x - pad, y0 = y - pad, x1 = x + w + pad, y1 = y + h + pad;
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * clamp(p * 3);
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round";
  ctx.shadowColor = color; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(x0, y0 + L); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L, y0);
  ctx.moveTo(x1 - L, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + L);
  ctx.moveTo(x1, y1 - L); ctx.lineTo(x1, y1); ctx.lineTo(x1 - L, y1);
  ctx.moveTo(x0 + L, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - L);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = a0;
}

/* ---------- the aurora backdrop ---------- */
export function moodAt(track, t) {
  if (t <= track[0][0]) return track[0][1];
  for (let i = 1; i < track.length; i++) {
    const [t1, m1] = track[i], [t0, m0] = track[i - 1];
    if (t <= t1) {
      const p = ease.inOut((t - t0) / Math.max(1, t1 - t0));
      return { v: lerp(m0.v, m1.v, p), c: lerp(m0.c, m1.c, p), m: lerp(m0.m, m1.m, p) };
    }
  }
  return track[track.length - 1][1];
}
export function aurora(ctx, t, mood, seed = 0) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.night;
  ctx.fillRect(0, 0, W, H);
  const s = t / 1000;
  const blob = (x, y, r, color, a) => {
    if (a <= 0.004) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a));
    g.addColorStop(0.55, rgba(color, a * 0.35));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  };
  ctx.globalCompositeOperation = "lighter";
  blob(W * (0.16 + 0.07 * Math.sin(s * 0.31 + seed)), H * (0.22 + 0.09 * Math.cos(s * 0.27 + seed)), 270, C.violet, 0.5 * mood.v);
  blob(W * (0.86 + 0.05 * Math.cos(s * 0.23 + seed * 2)), H * (0.16 + 0.1 * Math.sin(s * 0.19 + seed)), 240, C.cyan, 0.3 * mood.c);
  blob(W * (0.64 + 0.09 * Math.sin(s * 0.21 + 1.7 + seed)), H * (1.0 + 0.05 * Math.cos(s * 0.33)), 280, C.magenta, 0.42 * mood.m);
  blob(W * (0.38 + 0.1 * Math.cos(s * 0.17 + seed)), H * 0.62, 210, C.blue, 0.16 + 0.1 * mood.v);
  blob(W * (0.05 + 0.04 * Math.cos(s * 0.29)), H * 0.95, 180, C.purple, 0.2 * mood.v);
  ctx.globalCompositeOperation = "source-over";
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.72);
  v.addColorStop(0, "rgba(4, 2, 16, 0)");
  v.addColorStop(1, "rgba(4, 2, 16, .66)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

/* ---------- the stage: canvas + step HUD, paused when off screen ---------- */
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };

export class Stage {
  constructor(host, scene, { lang = "en", big = false, before = null } = {}) {
    this.scene = scene;
    this.lang = lang;
    this.big = big;
    this.t = scene.poster && reduced ? scene.poster : 0;
    this.last = 0;
    this.running = false;
    this.visible = false;
    this.step = -1;
    this.root = el("div", "pub-demo" + (big ? " pub-demo--big" : ""));
    this.screen = el("div", "pub-demo-screen", this.root);
    this.canvas = el("canvas", "pub-demo-canvas", this.screen);
    this.canvas.setAttribute("aria-hidden", "true");
    this.ctx = this.canvas.getContext("2d");
    const hud = el("div", "pub-demo-hud", this.root);
    const bars = el("div", "pub-demo-steps", hud);
    this.bars = scene.steps.map(() => el("i", null, el("span", "pub-demo-step", bars)));
    this.labelEl = el("b", "pub-demo-label", hud);
    this.captionEl = el("span", "pub-demo-caption", hud);
    this.captionEl.setAttribute("aria-live", "off");
    if (before) host.insertBefore(this.root, before); else host.appendChild(this.root);
    this.state = scene.create ? scene.create(this) : {};
    this.frame = this.frame.bind(this);
    this.resize();
    if ("ResizeObserver" in window) { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.screen); }
    else window.addEventListener("resize", () => this.resize());
    if ("IntersectionObserver" in window) {
      this.io = new IntersectionObserver((es) => es.forEach((e) => { this.visible = e.isIntersecting; this.sync(); }), { threshold: 0.12 });
      this.io.observe(this.root);
    } else { this.visible = true; this.sync(); }
    this.onVis = () => this.sync();
    document.addEventListener("visibilitychange", this.onVis);
  }
  get px() { return W / Math.max(1, this.cssW || W); }
  resize() {
    const w = this.screen.clientWidth;
    if (!w) return;
    this.cssW = w;
    const h = Math.round((w * H) / W);
    this.screen.style.height = h + "px";
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (this.canvas.width !== cw || this.canvas.height !== ch) { this.canvas.width = cw; this.canvas.height = ch; }
    this.scale = cw / W;
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
    ctx.shadowBlur = 0;
    if (this.scene.mood) aurora(ctx, t, moodAt(this.scene.mood, t), this.scene.seed || 0);
    this.scene.draw(ctx, t, this.state, this);
    const fade = reduced ? 0 : Math.max(seg(t, D - 420, D), 1 - seg(t, 0, 380));
    if (fade > 0.001) { ctx.globalAlpha = 1; ctx.fillStyle = rgba(C.night, fade); ctx.fillRect(0, 0, W, H); }
    this.hud(t);
  }
  hud(t) {
    const steps = this.scene.steps;
    let i = 0;
    while (i + 1 < steps.length && t >= steps[i + 1].at) i++;
    if (i !== this.step) {
      this.step = i;
      const s = steps[i];
      this.labelEl.textContent = String(i + 1).padStart(2, "0") + " · " + (s.label[this.lang] || s.label.en);
      this.captionEl.textContent = s.caption[this.lang] || s.caption.en;
    }
    const D = this.scene.duration;
    this.bars.forEach((b, k) => {
      const a = steps[k].at, z = k + 1 < steps.length ? steps[k + 1].at : D;
      b.style.width = (reduced ? (k <= i ? 100 : 0) : clamp((t - a) / (z - a)) * 100).toFixed(1) + "%";
    });
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
