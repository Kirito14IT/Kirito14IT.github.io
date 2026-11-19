/* SFMambaNet: real match lines from the paper's qualitative figure (Buckingham Palace, YFCC100M unknown).
   The 2,000 putative matches are read cluster by cluster (k-means on first-image keypoints, as in the paper's teaser),
   their landing positions are plotted in scan order, the gates keep the smooth part, two pruning blocks halve the set,
   and verification ends on the matches the paper draws for SFMambaNet. */
import { C, rgba, clamp, lerp, seg, ease, rr, panel, text, font, dot, rand } from "../engine.js";

const PB = { x: 14, y: 40, w: 452, h: 452 / 2.6791 };
const SPLIT = 0.49768, RIGHT = 0.50232;
const K = 10;
const BAND = { x: 14, y: 218, w: 290, h: 64 };
const STAGES = { x: 314, y: 216, w: 152, h: 70 };
const T = {
  en: { put: "putative matches", wrong: "wrong", scan: "landing position u′ in scan order", gate: "low-pass gate", kept: "kept", verified: "verified", res: "mAP@5° · unseen YFCC100M", res2: "2.01M params · no RANSAC" },
  zh: { put: "条候选匹配", wrong: "错误", scan: "按扫描顺序的落点 u′", gate: "低通门控", kept: "保留", verified: "验证后", res: "mAP@5° · 未见场景 YFCC100M", res2: "2.01M 参数 · 不用 RANSAC" },
};

function duotone(img, w, h) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const c = cv.getContext("2d");
  c.drawImage(img, 0, 0, w, h);
  const d = c.getImageData(0, 0, w, h), p = d.data;
  const lo = [10, 6, 40], hi = [170, 190, 255];
  for (let i = 0; i < p.length; i += 4) {
    const l = Math.pow((0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]) / 255, 1.15) * 0.82;
    p[i] = lo[0] + (hi[0] - lo[0]) * l; p[i + 1] = lo[1] + (hi[1] - lo[1]) * l; p[i + 2] = lo[2] + (hi[2] - lo[2]) * l;
  }
  c.putImageData(d, 0, 0);
  return cv;
}
const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });

function kmeans(pts, k, seed) {
  const r = rand(seed);
  let cent = Array.from({ length: k }, () => pts[Math.floor(r() * pts.length)].slice());
  const lab = new Int32Array(pts.length);
  for (let it = 0; it < 12; it++) {
    pts.forEach((p, i) => { let b = 0, bd = 1e9; cent.forEach((c, j) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2; if (d < bd) { bd = d; b = j; } }); lab[i] = b; });
    const sum = Array.from({ length: k }, () => [0, 0, 0]);
    pts.forEach((p, i) => { sum[lab[i]][0] += p[0]; sum[lab[i]][1] += p[1]; sum[lab[i]][2]++; });
    cent = sum.map((s, j) => (s[2] ? [s[0] / s[2], s[1] / s[2]] : cent[j]));
  }
  return { lab, cent };
}

function prepare(data) {
  const put = data.lines.putative, fin = data.lines.sfmambanet;
  const all = [];
  for (let i = 0; i < put.g.length; i += 4) all.push({ q: put.g.slice(i, i + 4), ok: true });
  for (let i = 0; i < put.r.length; i += 4) all.push({ q: put.r.slice(i, i + 4), ok: false });
  /* cluster order Π: k-means on first-image keypoints, clusters swept left to right, random order inside a cluster */
  const { lab, cent } = kmeans(all.map((m) => [m.q[0], m.q[1]]), K, 7);
  const order = cent.map((c, j) => ({ j, x: c[0] })).sort((a, b) => a.x - b.x).map((o) => o.j);
  const r = rand(11);
  const seq = [];
  order.forEach((j) => {
    const members = all.filter((_, i) => lab[i] === j);
    for (let i = members.length - 1; i > 0; i--) { const s = Math.floor(r() * (i + 1)); [members[i], members[s]] = [members[s], members[i]]; }
    members.forEach((m) => { m.cluster = order.indexOf(j); seq.push(m); });
  });
  seq.forEach((m, i) => { m.s = i / (seq.length - 1); m.u = (m.q[2] / 999 - RIGHT) / (1 - RIGHT); });
  /* pruning stages: the more reliable half is kept twice (illustrative), then verification ends on the paper's lines */
  const outl = seq.filter((m) => !m.ok), inl = seq.filter((m) => m.ok);
  const shuf = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const s = Math.floor(r() * (i + 1)); [b[i], b[s]] = [b[s], b[i]]; } return b; };
  const o = shuf(outl), g = shuf(inl);
  o.forEach((m, i) => { m.cut = i < 1000 ? 1 : i < 1400 ? 2 : 3; });
  g.forEach((m, i) => { m.cut = i < 100 ? 2 : 3; });
  return { seq, fin, clusters: K };
}

function pathOf(list, w, h) {
  const p = new Path2D();
  list.forEach((q) => { p.moveTo(PB.x + (q[0] / 999) * w, PB.y + (q[1] / 999) * h); p.lineTo(PB.x + (q[2] / 999) * w, PB.y + (q[3] / 999) * h); });
  return p;
}
const scanColor = (s) => (s < 0.5 ? mixRGB([0, 240, 255], [168, 85, 247], s * 2) : mixRGB([168, 85, 247], [255, 0, 110], s * 2 - 1));
function mixRGB(a, b, p) { return `rgb(${Math.round(a[0] + (b[0] - a[0]) * p)},${Math.round(a[1] + (b[1] - a[1]) * p)},${Math.round(a[2] + (b[2] - a[2]) * p)})`; }

export default {
  duration: 14600,
  poster: 13200,
  seed: 3.3,
  mood: [
    [0, { v: 0.8, c: 0.35, m: 0.35 }],
    [3200, { v: 0.75, c: 0.3, m: 0.55 }],
    [7400, { v: 0.85, c: 0.5, m: 0.25 }],
    [9800, { v: 0.75, c: 0.75, m: 0.12 }],
    [11400, { v: 0.6, c: 1, m: 0.05 }],
    [14600, { v: 0.8, c: 0.35, m: 0.35 }],
  ],
  steps: [
    { at: 0, label: { en: "Candidate matches", zh: "候选匹配" }, caption: { en: "Two photos of the same place: 2,000 candidate matches, most of them wrong.", zh: "同一地点的两张照片：2,000 条候选匹配，大多数是错的。" } },
    { at: 3400, label: { en: "Read cluster by cluster", zh: "按簇读取" }, caption: { en: "Scanned cluster by cluster, correct matches land smoothly while wrong ones stay erratic.", zh: "按簇依次扫描：正确匹配的落点平滑变化，错误匹配依旧杂乱。" } },
    { at: 7400, label: { en: "Gate, prune, verify", zh: "门控 · 剪枝 · 验证" }, caption: { en: "Frequency gates keep the smooth part; two pruning blocks halve the set, verification recovers inliers.", zh: "频域门控保留平滑成分；两个剪枝模块逐次减半，验证模块找回内点。" } },
    { at: 11400, label: { en: "Result", zh: "结果" }, caption: { en: "What remains is clean: 73.83% mAP@5° on unseen YFCC100M scenes with 2.01M parameters.", zh: "留下的匹配干净可靠：未见过的 YFCC100M 场景上 mAP@5° 为 73.83%，仅 2.01M 参数。" } },
  ],
  create(stage) {
    const st = { ready: false };
    const base = "/SFMambaNet/assets/scenes/s2";
    st.loaded = Promise.all([fetch(base + ".json").then((r) => r.json()), loadImg(base + "-l.webp"), loadImg(base + "-r.webp")]).then(([data, l, r]) => {
      Object.assign(st, prepare(data));
      const lw = Math.round(PB.w * SPLIT * 2), rw = Math.round(PB.w * (1 - RIGHT) * 2), hh = Math.round(PB.h * 2);
      st.imgL = duotone(l, lw, hh); st.imgR = duotone(r, rw, hh);
      const w = PB.w, h = PB.h;
      st.paths = {};
      const by = (f) => st.seq.filter(f).map((m) => m.q);
      st.paths.g = [1, 2, 3].map((c) => pathOf(by((m) => m.ok && m.cut === c), w, h));
      st.paths.r = [1, 2, 3].map((c) => pathOf(by((m) => !m.ok && m.cut === c), w, h));
      st.paths.cl = Array.from({ length: K }, (_, c) => ({ g: pathOf(by((m) => m.ok && m.cluster === c), w, h), r: pathOf(by((m) => !m.ok && m.cluster === c), w, h) }));
      const fq = (arr) => { const out = []; for (let i = 0; i < arr.length; i += 4) out.push(arr.slice(i, i + 4)); return out; };
      st.paths.fg = pathOf(fq(st.fin.g), w, h); st.paths.fr = pathOf(fq(st.fin.r), w, h);
      st.nG = st.fin.g.length / 4; st.nR = st.fin.r.length / 4;
      st.ready = true;
      stage.render();
    }).catch(() => { st.failed = true; });
    return st;
  },
  draw(ctx, t, st, stage) {
    const L = T[stage.lang] || T.en;
    /* photos */
    panel(ctx, PB.x - 2, PB.y - 2, PB.w + 4, PB.h + 4, { r: 8, fill: "rgba(10,6,34,.9)", stroke: "rgba(196,176,255,.3)" });
    if (!st.ready) { text(ctx, "…", PB.x + PB.w / 2, PB.y + PB.h / 2, { size: 16, align: "center", color: rgba(C.ink, 0.5) }); return; }
    ctx.drawImage(st.imgL, PB.x, PB.y, PB.w * SPLIT, PB.h);
    ctx.drawImage(st.imgR, PB.x + PB.w * RIGHT, PB.y, PB.w * (1 - RIGHT), PB.h);
    ctx.save();
    rr(ctx, PB.x, PB.y, PB.w, PB.h, 6); ctx.clip();
    ctx.lineCap = "round";
    const inStep2 = t >= 3400 && t < 7600;
    const scanP = ease.inOut(seg(t, 3600, 7000));
    const cur = Math.min(K - 1, Math.floor(scanP * K));
    const reveal = seg(t, 200, 2600);
    if (t < 7600) {
      /* putative set, then the cluster scan */
      const dim = inStep2 ? 0.16 : 1;
      ctx.globalAlpha = reveal * dim;
      ctx.strokeStyle = rgba(C.cyan, 0.6); ctx.lineWidth = 0.55; st.paths.g.forEach((p) => ctx.stroke(p));
      ctx.strokeStyle = rgba(C.magenta, 0.45); ctx.lineWidth = 0.5; st.paths.r.forEach((p) => ctx.stroke(p));
      if (inStep2) {
        for (let c = 0; c <= cur; c++) {
          const a = c === cur ? 1 : 0.55;
          ctx.globalAlpha = a * seg(t, 3400, 3700);
          ctx.strokeStyle = rgba(C.magenta, 0.7); ctx.lineWidth = c === cur ? 0.75 : 0.5; ctx.stroke(st.paths.cl[c].r);
          ctx.strokeStyle = rgba(C.cyan, 0.95); ctx.lineWidth = c === cur ? 1.1 : 0.7;
          if (c === cur) { ctx.shadowColor = C.cyan; ctx.shadowBlur = 6; }
          ctx.stroke(st.paths.cl[c].g); ctx.shadowBlur = 0;
        }
        /* first-image keypoints coloured by scan position */
        ctx.globalAlpha = seg(t, 3400, 3700);
        const lim = scanP * (st.seq.length - 1);
        for (let i = 0; i <= lim; i++) { const m = st.seq[i]; ctx.fillStyle = scanColor(m.s); ctx.fillRect(PB.x + (m.q[0] / 999) * PB.w - 1, PB.y + (m.q[1] / 999) * PB.h - 1, 2, 2); }
      }
    } else {
      /* pruning: half, then half again; verification lands on the paper's result */
      const a1 = 1 - seg(t, 7700, 8600), a2 = 1 - seg(t, 8800, 9700), toFin = seg(t, 9900, 10800);
      const keep = [a1, a2, 1 - toFin];
      ctx.globalAlpha = 1;
      keep.forEach((a, k) => {
        if (a <= 0.01) return;
        ctx.globalAlpha = a;
        ctx.strokeStyle = rgba(C.magenta, 0.5); ctx.lineWidth = 0.55; ctx.stroke(st.paths.r[k]);
        ctx.strokeStyle = rgba(C.cyan, 0.7); ctx.lineWidth = 0.65; ctx.stroke(st.paths.g[k]);
      });
      if (toFin > 0) {
        const pulse = t > 11400 ? 0.5 + 0.5 * Math.sin((t - 11400) / 320) : 0;
        ctx.globalAlpha = toFin;
        ctx.strokeStyle = rgba(C.cyan, 0.22 + 0.12 * pulse); ctx.lineWidth = 3; ctx.stroke(st.paths.fg);
        ctx.strokeStyle = "#8ff6ff"; ctx.lineWidth = 0.9; ctx.shadowColor = C.cyan; ctx.shadowBlur = 4 + 6 * pulse; ctx.stroke(st.paths.fg); ctx.shadowBlur = 0;
        ctx.strokeStyle = C.magenta; ctx.lineWidth = 1.1; ctx.stroke(st.paths.fr);
      }
      /* verification flash */
      const vf = seg(t, 9850, 10300) * (1 - seg(t, 10300, 11000));
      if (vf > 0) { ctx.globalAlpha = vf * 0.14; ctx.fillStyle = C.cyan; ctx.fillRect(PB.x, PB.y, PB.w, PB.h); }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    /* counter over the photos */
    if (t < 3400) {
      const n = Math.round(2000 * ease.out(reveal));
      panel(ctx, PB.x + 8, PB.y + PB.h - 30, 196, 22, { r: 11, fill: "rgba(7,3,26,.78)" });
      text(ctx, n.toLocaleString("en-US") + " " + L.put, PB.x + 18, PB.y + PB.h - 15.4, { size: 10, weight: 800 });
      text(ctx, "72% " + L.wrong, PB.x + 196, PB.y + PB.h - 15.4, { size: 10, weight: 800, align: "right", color: "#ff7ab0", alpha: seg(t, 1800, 2400) });
    }
    /* the input of the paper's Eq. (1) */
    const eqA = seg(t, 900, 1500) * (1 - seg(t, 3200, 3500));
    if (eqA > 0) {
      ctx.save(); ctx.globalAlpha = eqA;
      panel(ctx, BAND.x, BAND.y, PB.w, 54, { r: 10, fill: "rgba(10,6,34,.86)" });
      text(ctx, "C = { c₁, …, c_N },  cᵢ = (uᵢ, vᵢ, u′ᵢ, v′ᵢ)", BAND.x + 14, BAND.y + 24, { size: 12, weight: 700, mono: true, color: "#d8c6ff" });
      text(ctx, stage.lang === "zh" ? "N = 2,000 条 SIFT 最近邻匹配 · 任务：判断每一条的对错" : "N = 2,000 nearest-neighbour SIFT matches · decide which are right", BAND.x + 14, BAND.y + 42, { size: 9, weight: 600, color: rgba(C.ink, 0.72), max: PB.w - 24 });
      ctx.restore();
    }
    /* ---------- bottom band: landing positions in scan order ---------- */
    const bandA = seg(t, 3400, 3800) * (1 - seg(t, 11200, 11600));
    if (bandA > 0) {
      ctx.save(); ctx.globalAlpha = bandA;
      panel(ctx, BAND.x, BAND.y, BAND.w, BAND.h, { r: 8, fill: "rgba(10,6,34,.86)" });
      text(ctx, L.scan, BAND.x + 8, BAND.y + 11, { size: 7.6, weight: 700, color: rgba(C.ink, 0.65) });
      const px = (s) => BAND.x + 6 + s * (BAND.w - 12), py = (u) => BAND.y + 15 + (1 - clamp(u)) * (BAND.h - 21);
      const lim = t < 7400 ? scanP : 1;
      const gate = seg(t, 7600, 9400);
      /* cluster boundaries */
      ctx.strokeStyle = "rgba(196,176,255,.12)"; ctx.lineWidth = 1;
      let prev = 0;
      st.seq.forEach((m) => { if (m.cluster !== prev) { prev = m.cluster; ctx.beginPath(); ctx.moveTo(px(m.s), BAND.y + 14); ctx.lineTo(px(m.s), BAND.y + BAND.h - 4); ctx.stroke(); } });
      /* outliers: erratic dots, removed by the gate */
      ctx.globalAlpha = bandA * (1 - gate);
      ctx.fillStyle = rgba(C.magenta, 0.75);
      st.seq.forEach((m) => { if (!m.ok && m.s <= lim) ctx.fillRect(px(m.s) - 0.7, py(m.u) - 0.7, 1.4, 1.4); });
      /* inliers: one smooth line */
      ctx.globalAlpha = bandA;
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 1.2; ctx.shadowColor = C.cyan; ctx.shadowBlur = 5;
      ctx.beginPath();
      let started = false;
      st.seq.forEach((m) => { if (m.ok && m.s <= lim) { if (!started) { ctx.moveTo(px(m.s), py(m.u)); started = true; } else ctx.lineTo(px(m.s), py(m.u)); } });
      ctx.stroke(); ctx.shadowBlur = 0;
      if (t < 7400 && lim < 1) { ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillRect(px(lim) - 0.5, BAND.y + 14, 1, BAND.h - 18); }
      if (gate > 0) { text(ctx, L.gate, BAND.x + BAND.w - 8, BAND.y + 11, { size: 7.6, weight: 800, align: "right", color: "#9ff8ff", alpha: gate }); }
      ctx.restore();
    }
    /* ---------- pruning stages ---------- */
    const sa = seg(t, 7500, 7900) * (1 - seg(t, 11200, 11600));
    if (sa > 0) {
      ctx.save(); ctx.globalAlpha = sa;
      panel(ctx, STAGES.x, STAGES.y, STAGES.w, STAGES.h, { r: 8, fill: "rgba(10,6,34,.86)" });
      const marks = [["N", "2,000", 7600], ["N/2", "1,000", 8700], ["N/4", "500", 9700], [L.verified, String(st.nG + st.nR), 10700]];
      marks.forEach(([n, v, at], i) => {
        const on = t >= at, x = STAGES.x + 10 + i * 35, y = STAGES.y + 12;
        rr(ctx, x, y, 30, 46, 6); ctx.fillStyle = on ? (i === 3 ? rgba(C.cyan, 0.24) : rgba(C.purple, 0.26)) : "rgba(247,244,255,.04)"; ctx.fill();
        if (on && i === 3) { ctx.strokeStyle = rgba(C.cyan, 0.9); ctx.lineWidth = 1.2; ctx.shadowColor = C.cyan; ctx.shadowBlur = 8; rr(ctx, x, y, 30, 46, 6); ctx.stroke(); ctx.shadowBlur = 0; }
        text(ctx, n, x + 15, y + 15, { size: i === 3 ? 6.6 : 8.6, weight: 800, align: "center", color: on ? (i === 3 ? "#9ff8ff" : "#d8c6ff") : rgba(C.ink, 0.35), max: 28 });
        text(ctx, v, x + 15, y + 34, { size: 8.4, weight: 800, align: "center", color: on ? C.ink : rgba(C.ink, 0.3), max: 28 });
      });
      ctx.restore();
    }
    /* ---------- result ---------- */
    const ra = ease.out(seg(t, 11500, 12200)) * (1 - seg(t, 14100, 14500));
    if (ra > 0) {
      ctx.save(); ctx.globalAlpha = ra;
      panel(ctx, BAND.x, BAND.y, PB.w, 66, { r: 10, fill: "rgba(10,6,34,.86)", stroke: rgba(C.cyan, 0.5), glow: rgba(C.cyan, 0.5), blur: 12 });
      const g = ctx.createLinearGradient(BAND.x + 14, 0, BAND.x + 170, 0); g.addColorStop(0, C.cyan); g.addColorStop(1, C.purple);
      font(ctx, 34, 900); ctx.fillStyle = g; ctx.textAlign = "left"; ctx.shadowColor = rgba(C.cyan, 0.8); ctx.shadowBlur = 14;
      ctx.fillText((73.83 * ease.out(seg(t, 11500, 12600))).toFixed(2) + "%", BAND.x + 14, BAND.y + 44); ctx.shadowBlur = 0;
      text(ctx, L.res, BAND.x + 190, BAND.y + 28, { size: 10.6, weight: 800, color: C.ink });
      text(ctx, L.res2, BAND.x + 190, BAND.y + 46, { size: 9.6, weight: 600, color: rgba(C.ink, 0.72) });
      text(ctx, st.nG + " " + L.kept + " · " + st.nR + " " + L.wrong, BAND.x + PB.w - 14, BAND.y + 46, { size: 9, weight: 700, align: "right", color: "#9ff8ff" });
      ctx.restore();
    }
  },
};
