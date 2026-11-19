/* SFMambaNet: the paper's Figure 1, live. The data are the figure's own: 150 drawn matches on the Notre-Dame pair,
   2,000 keypoints coloured by scan position, the landing positions u′ in random and cluster order, and the spectra.
   The caption is the paper's; the sentence for the active panel is set in bold. */
import { clamp, lerp, seg, ease, text, font, box, loadImg } from "../engine.js";

const W = 480, H = 404;
const A = { x: 24, y: 8, w: 448 };
A.h = A.w / 3.4573;
const ROW = { b: 148, c: 244 }, PH = 86, PW = 145;
const COLS = [24, 177, 327];
const GREEN = "#13a34a", RED = "#e2412b", AX = "#222";
const STOPS = [[34, 198, 240], [90, 90, 230], [190, 40, 150]];
const scanCol = (t) => {
  const s = clamp(t) * 2, i = Math.min(1, Math.floor(s)), f = s - i, a = STOPS[i], b = STOPS[i + 1];
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
};
const CAP = {
  en: [
    ["Figure 1: ", "head"], ["Smooth inliers, erratic outliers. ", "head"],
    ["(a) Putative matches. ", "a"],
    ["(b) In a random scan order, where they land in the second image is noise for both classes. ", "b"],
    ["(c) Cluster by cluster, inliers land in smooth, low-frequency steps; outliers stay erratic.", "c"],
  ],
  zh: [
    ["图 1：", "head"], ["平滑的内点，杂乱的外点。", "head"],
    ["(a) 候选匹配。", "a"],
    ["(b) 随机扫描顺序下，两类匹配在第二张图中的落点都像噪声。", "b"],
    ["(c) 按簇扫描时，内点以平滑的低频阶梯落点，外点依旧杂乱。", "c"],
  ],
};
const NOTE = {
  en: { lt: "lowest tenth", inl: "inliers 84.2%", out: "outliers 15.4%", gate: "SIGM's learned gate: low-pass", res: "SFMambaNet · 73.83% mAP@5° (unseen YFCC100M)", scan: "scan position" },
  zh: { lt: "最低的十分之一频率", inl: "内点 84.2%", out: "外点 15.4%", gate: "SIGM 学到的门控：低通", res: "SFMambaNet · 未见 YFCC100M 场景 mAP@5° 73.83%", scan: "扫描位置" },
};

function prep(raw) {
  const o = {};
  ["random", "cluster"].forEach((k) => {
    const d = raw.o[k], dots = [];
    for (let i = 0; i < d.d.length; i += 3) dots.push([d.d[i] / 999, d.d[i + 1] / 999, d.d[i + 2] / 999]);
    dots.sort((p, q) => p[2] - q[2]);
    dots.forEach((p) => { p[3] = scanCol(p[2]); });
    const inl = [], out = [];
    for (let i = 0; i < d.i.length; i += 2) inl.push([d.i[i] / 999, d.i[i + 1] / 999]);
    for (let i = 0; i < d.u.length; i += 2) out.push([d.u[i] / 999, d.u[i + 1] / 999]);
    out.sort((p, q) => p[0] - q[0]);
    o[k] = { dots, inl, out, si: d.s.i, so: d.s.o, ticks: d.k };
  });
  return { a: raw.a, o, ax: raw.ax };
}

function panelA(ctx, t, st) {
  const L = st.d.a.layout, lp = ease.out(seg(t, 150, 900));
  ctx.save(); ctx.globalAlpha = lp;
  ctx.drawImage(st.imL, A.x + L.l[0] * A.w, A.y, (L.l[2] - L.l[0]) * A.w, A.h);
  ctx.drawImage(st.imR, A.x + L.r[0] * A.w, A.y, (L.r[2] - L.r[0]) * A.w, A.h);
  ctx.restore();
  const draw = (arr, color, w, halo, at) => {
    const n = arr.length / 4;
    for (let i = 0; i < n; i++) {
      const d0 = at + (((i * 37) % n) / n) * 1500;
      const k = ease.out(seg(t, d0, d0 + 600));
      if (k <= 0) continue;
      const x1 = A.x + (arr[4 * i] / 999) * A.w, y1 = A.y + (arr[4 * i + 1] / 999) * A.h, x2 = A.x + (arr[4 * i + 2] / 999) * A.w, y2 = A.y + (arr[4 * i + 3] / 999) * A.h;
      const xe = lerp(x1, x2, k), ye = lerp(y1, y2, k);
      if (halo) { ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = w + 1.6; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(xe, ye); ctx.stroke(); }
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(xe, ye); ctx.stroke();
    }
  };
  ctx.lineCap = "round";
  draw(st.d.a.r, "rgba(255, 64, 41, .92)", 0.7, false, 500);
  draw(st.d.a.g, "#21f554", 1.1, true, 800);
}

function row(ctx, t, st, key, y, t0, lang) {
  const O = st.d.o[key], p = clamp(seg(t, t0 + 200, t0 + 3400));
  const appear = ease.out(seg(t, t0 - 300, t0 + 300));
  if (appear <= 0) return;
  ctx.save();
  /* the first view in gray, keypoints coloured by scan position */
  const ix = COLS[0];
  ctx.globalAlpha = appear * 0.95;
  ctx.drawImage(st.imG, ix, y, PW, PH);
  ctx.globalAlpha = appear;
  for (let i = 0; i < O.dots.length; i++) {
    const d = O.dots[i];
    if (d[2] > p) break;
    ctx.fillStyle = d[3];
    ctx.fillRect(ix + d[0] * PW - 0.9, y + d[1] * PH - 0.9, 1.8, 1.8);
  }
  ctx.strokeStyle = AX; ctx.lineWidth = 0.6; ctx.strokeRect(ix + 0.3, y + 0.3, PW - 0.6, PH - 0.6);
  /* landing position u′ in scan order */
  const lx = COLS[1], bar = st.d.ax.bar * PH;
  const xs = (v) => lx + v * PW, ys = (v) => y + v * PH;
  const g = ctx.createLinearGradient(lx, 0, lx + PW, 0);
  g.addColorStop(0, "rgb(34,198,240)"); g.addColorStop(0.5, "rgb(90,90,230)"); g.addColorStop(1, "rgb(190,40,150)");
  ctx.fillStyle = g; ctx.fillRect(lx + 2, y + 1, (PW - 4) * p, bar - 1);
  O.ticks.forEach((tk) => { if (tk <= p) { ctx.fillStyle = "#fff"; ctx.fillRect(xs(tk) - 0.6, y + 1, 1.2, bar - 1); } });
  const gate = key === "cluster" ? seg(t, 11800, 12800) : 0;
  ctx.fillStyle = RED;
  ctx.globalAlpha = appear * (1 - 0.85 * gate);
  for (const q of O.out) { if (q[0] > p) break; ctx.fillRect(xs(q[0]) - 0.65, ys(q[1]) - 0.65, 1.3, 1.3); }
  ctx.globalAlpha = appear;
  ctx.strokeStyle = GREEN; ctx.lineWidth = 0.9; ctx.lineJoin = "round"; ctx.beginPath();
  O.inl.forEach((q, i) => { if (q[0] <= p) { if (i) ctx.lineTo(xs(q[0]), ys(q[1])); else ctx.moveTo(xs(q[0]), ys(q[1])); } });
  ctx.stroke();
  if (p > 0 && p < 1) { ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(xs(p), y + bar); ctx.lineTo(xs(p), y + PH); ctx.stroke(); }
  ctx.strokeStyle = AX; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, y + PH); ctx.lineTo(lx + PW, y + PH); ctx.stroke();
  text(ctx, "u′", lx + 3, y + bar + 9, { size: 7.5, serif: true, italic: true, color: "#444" });
  text(ctx, NOTE[lang].scan, lx + PW, y + PH + 8, { size: 6.4, align: "right", color: "#555" });
  /* spectrum of u′ (log–log), drawn once the sequence is complete */
  const sx0 = COLS[2], S = st.d.ax.spec;
  const sp = ease.inOut(seg(t, t0 + 3200, t0 + 4000));
  const sxs = (v) => sx0 + v * PW, sys = (v) => y + v * PH;
  if (key === "cluster") {
    const a = S.x["0.01"], b = S.x["0.1"], x05 = a + (Math.log10(0.05) + 2) * (b - a);
    ctx.fillStyle = `rgba(19,163,74,${0.09 * sp})`; ctx.fillRect(sxs(O.si[0]), y, sxs(x05) - sxs(O.si[0]), PH);
    if (sp > 0.6) text(ctx, NOTE[lang].lt, sxs(O.si[0]) + 2, y + PH - 3, { size: 5.8, color: "#2f7a43", alpha: (sp - 0.6) * 2.5 });
  }
  ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 0.6; ctx.setLineDash([1.5, 2]);
  ctx.beginPath(); ctx.moveTo(sx0, sys(S.y["1"])); ctx.lineTo(sx0 + PW, sys(S.y["1"])); ctx.stroke(); ctx.setLineDash([]);
  const curve = (arr, color, w) => {
    const n = arr.length / 2, m = Math.max(1, Math.round(n * sp));
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath();
    for (let i = 0; i < m; i++) { const X = sxs(arr[2 * i]), Y = sys(arr[2 * i + 1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
    ctx.stroke();
  };
  if (sp > 0) { curve(O.so, RED, 1.3); curve(O.si, GREEN, 1.3); }
  if (gate > 0) {
    /* the learned gate keeps the low band (shape only) */
    ctx.strokeStyle = `rgba(90,90,230,${0.9 * gate})`; ctx.lineWidth = 1.2; ctx.setLineDash([3, 2]); ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const xf = i / 40, yv = 0.28 + 0.62 / (1 + Math.exp(-(xf - 0.58) * 14)); if (i) ctx.lineTo(sx0 + xf * PW, y + yv * PH); else ctx.moveTo(sx0 + xf * PW, y + yv * PH); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.strokeStyle = AX; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(sx0, y); ctx.lineTo(sx0, y + PH); ctx.lineTo(sx0 + PW, y + PH); ctx.stroke();
  Object.entries(S.x).forEach(([lab, v]) => text(ctx, lab, sxs(v), y + PH + 8, { size: 6.2, align: "center", color: "#555" }));
  Object.entries(S.y).forEach(([lab, v]) => text(ctx, lab, sx0 - 2, sys(v) + 2, { size: 5.8, align: "right", color: "#555" }));
  if (key === "cluster" && sp > 0.9) {
    const k = seg(t, t0 + 3700, t0 + 4300);
    text(ctx, NOTE[lang].inl, sx0 + PW - 3, y + 12, { size: 6.8, weight: 700, align: "right", color: GREEN, alpha: k });
    text(ctx, NOTE[lang].out, sx0 + PW - 3, y + 21, { size: 6.8, weight: 700, align: "right", color: RED, alpha: k });
  }
  if (gate > 0) text(ctx, NOTE[lang].gate, lx + PW / 2, y + PH - 4, { size: 6.4, weight: 700, align: "center", color: "#4848c8", alpha: gate });
  ctx.restore();
}

export default {
  id: "sfmambanet",
  size: [W, H],
  bg: "#ffffff",
  duration: 16000,
  poster: 15000,
  create(stage) {
    const st = { ready: false };
    const base = "/SFMambaNet/assets/teaser/";
    st.loaded = Promise.all([fetch(base + "fig1-compact.json").then((r) => r.json()), loadImg(base + "pair-l.webp"), loadImg(base + "pair-r.webp"), loadImg(base + "gray.webp")])
      .then(([raw, l, r, g]) => { st.d = prep(raw); st.imL = l; st.imR = r; st.imG = g; st.ready = true; stage.render(); })
      .catch(() => { st.failed = true; });
    return st;
  },
  draw(ctx, t, st, stage) {
    const lang = stage.lang === "zh" ? "zh" : "en";
    if (!st.ready) { text(ctx, lang === "zh" ? "图 1" : "Figure 1", W / 2, H / 2, { size: 13, serif: true, align: "center", color: "#999" }); return; }
    panelA(ctx, t, st);
    row(ctx, t, st, "random", ROW.b, 3200, lang);
    row(ctx, t, st, "cluster", ROW.c, 7600, lang);
    /* panel letters, the active one in black */
    [["(a)", A.y + A.h / 2 + 4], ["(b)", ROW.b + PH / 2 + 4], ["(c)", ROW.c + PH / 2 + 4]].forEach(([s, y], i) => {
      const on = (i === 0 && t < 3200) || (i === 1 && t >= 3200 && t < 7600) || (i === 2 && t >= 7600);
      text(ctx, s, 3, y, { size: 10, weight: 700, serif: true, color: on ? "#111" : "#9a9a9a" });
    });
    /* the method's result, noted on the photos at the end */
    const rp = ease.out(seg(t, 12600, 13300));
    if (rp > 0) {
      font(ctx, 7.6, 700);
      const s = NOTE[lang].res, w = ctx.measureText(s).width + 12;
      ctx.save(); ctx.globalAlpha = rp;
      box(ctx, A.x + A.w - w - 6, A.y + A.h - 19, w, 14, { r: 2, fill: "rgba(255,255,255,.93)", stroke: "#222", lw: 0.6 });
      text(ctx, s, A.x + A.w - w / 2 - 6, A.y + A.h - 9, { size: 7.6, weight: 700, align: "center", color: "#111" });
      ctx.restore();
    }
    /* the paper's caption, with the sentence of the active panel in bold */
    const active = t < 3200 ? "a" : t < 7600 ? "b" : "c";
    let x = A.x, y = 351;
    const maxX = A.x + A.w, size = 10.6, lh = 13.4;
    CAP[lang].forEach(([s, k]) => {
      const bold = k === "head" || k === active;
      const tokens = lang === "zh" ? [...s] : s.split(/(\s+)/);
      tokens.forEach((tok) => {
        if (!tok) return;
        font(ctx, size, bold ? 700 : 400, "serif");
        const w = ctx.measureText(tok).width;
        if (x + w > maxX && tok.trim()) { x = A.x; y += lh; }
        if (x === A.x && !tok.trim()) return;
        text(ctx, tok, x, y, { size, serif: true, weight: bold ? 700 : 400, color: k === active ? "#000" : k === "head" ? "#111" : "#555" });
        x += w;
      });
    });
  },
};
