/* CST: three decisions in one review (paper Figures 2, 3 and 8).
   Where to look: messages scored on a CPU, discussions ordered by risk from 144 features.
   What to read: group related messages; round-robin covers both topics within a two-message budget.
   How to check: open the phrase at its source span and follow the reply path. */
import { C, rgba, clamp, lerp, seg, ease, rr, panel, text, typed, wrap, font, dot, check } from "../engine.js";

const T = {
  en: {
    cpu: "CPU · 4 threads", enc: ["MiniLM sentence", "+ char 2–5-grams", "logistic heads"],
    risk: "Discussion risk", feats: ["semantics 128", "attack 10", "replies 6"], ranker: "144 features → logistic ranker",
    grouped: "Grouped messages", budget: "Reading budget: 2 messages", riskOrder: "Risk order", rr: "Group round-robin",
    one: "1 topic", two: "2 topics", same: "Risk scores stay unchanged",
    thread: "Source thread · Hacker News", evidence: "Evidence group", path: "Reply path",
    stats: [["6 of 6", "message tasks above fine-tuned XLM-R in AP"], ["2.62×", "faster than XLM-R on the same CPU service"], ["≥27.3%", "less review time with grouped evidence"]],
  },
  zh: {
    cpu: "CPU · 4 线程", enc: ["MiniLM 句向量", "+ 字符 2–5-gram", "逻辑回归头"],
    risk: "讨论串风险", feats: ["语义 128", "攻击 10", "回复 6"], ranker: "144 维特征 → 逻辑回归排序",
    grouped: "分组后的消息", budget: "阅读预算：2 条消息", riskOrder: "按风险顺序", rr: "分组轮询",
    one: "覆盖 1 个话题", two: "覆盖 2 个话题", same: "风险分数保持不变",
    thread: "原始讨论 · Hacker News", evidence: "证据组", path: "回复链",
    stats: [["6 项", "消息任务 AP 全部超过微调 XLM-R"], ["2.62×", "同一 CPU 服务上比 XLM-R 更快"], ["≥27.3%", "分组证据让审核时间更短"]],
  },
};
/* Figures 1–2: an illustrative discussion; the order is the risk order of the paper's example */
const MSG = [
  { id: "m1", topic: "team", text: "Leave the team.", risk: 0.86 },
  { id: "m2", topic: "team", text: "Nobody wants you on the team.", risk: 0.74 },
  { id: "m3", topic: "accent", text: "Your accent is ridiculous.", risk: 0.61 },
];
/* Figure 8: the thread behind the evidence */
const THREAD = [
  { id: "m8", d: 0, text: "What kinds of user flags are there and why are they not public?" },
  { id: "m9", d: 1, pre: "It's just the ", phrase: "flagging", post: " you already have access to …" },
  { id: "m10", d: 2, text: "At some point you get the option to vouch for flagged posts as well." },
  { id: "m11", d: 3, pre: ">30 ", phrase: "karma", post: ", same as flagging:" },
];
const QUEUE = [0.32, 0.81, 0.18, 0.55, 0.41];
/* Table 3 (AP: fine-tuned XLM-R, CST), Figure 6 (CPU seconds), Table 7 (paired review time) */
const AP = [[0.683, 0.712], [0.859, 0.887], [0.978, 0.986], [0.864, 0.893], [0.854, 0.879], [0.972, 0.981]];
const CPU = [["MiniLM + LR", 117.93], ["XLM-R", 332.42], ["CST", 126.69]];

function chipIcon(ctx, x, y, w, h, glow) {
  panel(ctx, x, y, w, h, { r: 8, fill: "rgba(22, 12, 64, .85)", stroke: rgba(C.cyan, 0.4 + 0.5 * glow), glow: glow > 0.05 ? rgba(C.cyan, glow) : null, blur: 14 });
  ctx.strokeStyle = rgba(C.cyan, 0.45); ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const yy = y + 12 + i * ((h - 24) / 5);
    ctx.beginPath(); ctx.moveTo(x - 5, yy); ctx.lineTo(x, yy); ctx.moveTo(x + w, yy); ctx.lineTo(x + w + 5, yy); ctx.stroke();
  }
}

export default {
  duration: 15200,
  poster: 11800,
  seed: 2.1,
  mood: [
    [0, { v: 0.85, c: 0.5, m: 0.05 }],
    [2600, { v: 0.8, c: 0.45, m: 0.15 }],
    [3300, { v: 0.6, c: 0.2, m: 0.75 }],
    [4300, { v: 0.85, c: 0.55, m: 0.15 }],
    [8100, { v: 0.85, c: 0.5, m: 0.12 }],
    [9500, { v: 0.6, c: 0.2, m: 0.85 }],
    [11600, { v: 0.75, c: 0.6, m: 0.2 }],
    [15200, { v: 0.85, c: 0.5, m: 0.05 }],
  ],
  steps: [
    { at: 0, label: { en: "Where to look?", zh: "看哪里？" }, caption: { en: "Messages are scored on a CPU, and whole discussions are ordered by risk.", zh: "在 CPU 上为每条消息打分，再按风险为整个讨论串排序。" } },
    { at: 4200, label: { en: "What to read?", zh: "读什么？" }, caption: { en: "Related messages are grouped; round-robin picks cover both topics within two messages.", zh: "相关消息先分组，轮询选取让两条消息就覆盖两个话题。" } },
    { at: 8200, label: { en: "How to check?", zh: "怎么核验？" }, caption: { en: "Each phrase opens at its original span, and the reply path shows what it answers.", zh: "每个短语都能回到原文片段，回复链说明它在回应谁。" } },
    { at: 12300, label: { en: "Results", zh: "结果" }, caption: { en: "Lightweight and checkable: higher AP on every message task, 2.62× faster than XLM-R on CPU.", zh: "轻量且可核验：每项消息任务 AP 更高，CPU 上比 XLM-R 快 2.62 倍。" } },
  ],
  draw(ctx, t, state, stage) {
    const L = T[stage.lang] || T.en;
    /* ---------- step 1: score on CPU, order discussions ---------- */
    const s1 = seg(t, 100, 500) * (1 - seg(t, 4000, 4400));
    if (s1 > 0) {
      ctx.save(); ctx.globalAlpha = s1;
      const EN = { x: 150, y: 96, w: 96, h: 112 };
      /* incoming messages */
      for (let i = 0; i < 7; i++) {
        const p = seg(t, 300 + i * 360, 1500 + i * 360);
        if (p <= 0 || p >= 1) continue;
        const x = lerp(-90, EN.x - 4, ease.inOut(p)), y = 70 + (i % 4) * 46 + Math.sin(i) * 6;
        ctx.save(); ctx.globalAlpha *= clamp((1 - p) * 6) * clamp(p * 5);
        panel(ctx, x, y, 92, 30, { r: 7, fill: "rgba(22,12,64,.8)", stroke: "rgba(196,176,255,.28)" });
        dot(ctx, x + 11, y + 15, 5, i % 3 === 1 ? C.pink : C.purple, 0.9);
        rr(ctx, x + 21, y + 9, 54 - (i % 3) * 8, 4, 2); ctx.fillStyle = "rgba(247,244,255,.4)"; ctx.fill();
        rr(ctx, x + 21, y + 17, 38 + (i % 2) * 14, 4, 2); ctx.fillStyle = "rgba(247,244,255,.22)"; ctx.fill();
        ctx.restore();
      }
      const busy = 0.25 + 0.6 * Math.max(0, Math.sin(t / 180)) * seg(t, 700, 900) * (1 - seg(t, 3400, 3800));
      chipIcon(ctx, EN.x, EN.y, EN.w, EN.h, busy);
      text(ctx, L.cpu, EN.x + EN.w / 2, EN.y - 8, { size: 9.4, weight: 800, align: "center", color: C.cyan, glow: rgba(C.cyan, 0.7) });
      L.enc.forEach((s, i) => text(ctx, s, EN.x + EN.w / 2, EN.y + 30 + i * 22, { size: 8.6, weight: i === 2 ? 700 : 600, align: "center", color: i === 2 ? "#9ff8ff" : rgba(C.ink, 0.86), max: EN.w - 10 }));
      /* scores flying to the queue */
      const Q = { x: 266, y: 74, w: 200 };
      for (let i = 0; i < 7; i++) {
        const p = seg(t, 1500 + i * 360, 2100 + i * 360);
        if (p <= 0 || p >= 1) continue;
        const row = i % 5, ax = EN.x + EN.w + 4, ay = EN.y + 30 + (i % 3) * 22, bx = Q.x + 30, by = Q.y + row * 36 + 14;
        const e = ease.inOut(p);
        dot(ctx, lerp(ax, bx, e), lerp(ay, by, e) - Math.sin(e * Math.PI) * 14, 2.2, QUEUE[row] > 0.6 ? C.magenta : C.cyan, 1, 3);
      }
      /* the discussion queue, re-ordered by risk */
      text(ctx, L.risk, Q.x, Q.y - 22, { size: 9.6, weight: 800 });
      L.feats.forEach((f, i) => { const p = seg(t, 900 + i * 150, 1300 + i * 150); if (p > 0) { font(ctx, 7.6, 700); const w = ctx.measureText(f).width + 10; const x = Q.x + [0, 66, 116][i]; rr(ctx, x, Q.y - 15, w, 12, 6); ctx.fillStyle = rgba(C.purple, 0.3 * p); ctx.fill(); text(ctx, f, x + 5, Q.y - 6.4, { size: 7.6, weight: 700, color: rgba(C.ink, 0.85 * p) }); } });
      const sorted = QUEUE.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
      const sp = ease.spring(seg(t, 2900, 3700));
      QUEUE.forEach((v, i) => {
        const fill = clamp(seg(t, 1700, 3000) * 1.1) * v;
        const rank0 = i, rank1 = sorted.findIndex((o) => o.i === i);
        const y = Q.y + lerp(rank0, rank1, sp) * 36;
        const top = rank1 === 0 && sp > 0.5;
        panel(ctx, Q.x, y, Q.w, 28, { r: 7, fill: top ? "rgba(255,0,110,.14)" : "rgba(22,12,64,.72)", stroke: top ? rgba(C.magenta, 0.85) : "rgba(196,176,255,.22)", glow: top ? rgba(C.magenta, 0.8) : null, blur: 12 });
        ctx.strokeStyle = rgba(C.ink, 0.55); ctx.lineWidth = 1.2;
        [0, 1, 2].forEach((k) => { ctx.beginPath(); ctx.moveTo(Q.x + 10 + k * 3, y + 9 + k * 5); ctx.lineTo(Q.x + 24, y + 9 + k * 5); ctx.stroke(); });
        rr(ctx, Q.x + 34, y + 11, Q.w - 46, 6, 3); ctx.fillStyle = "rgba(247,244,255,.1)"; ctx.fill();
        if (fill > 0) { const g = ctx.createLinearGradient(Q.x + 34, 0, Q.x + Q.w - 12, 0); g.addColorStop(0, C.cyan); g.addColorStop(0.6, C.purple); g.addColorStop(1, C.magenta); rr(ctx, Q.x + 34, y + 11, (Q.w - 46) * fill, 6, 3); ctx.fillStyle = g; ctx.fill(); }
      });
      text(ctx, L.ranker, Q.x, Q.y + 5 * 36 + 10, { size: 8.6, weight: 700, color: rgba(C.ink, 0.7 * seg(t, 2600, 3000)) });
      ctx.restore();
    }
    /* ---------- step 2: group, then spend the budget ---------- */
    const s2 = seg(t, 4200, 4600) * (1 - seg(t, 8000, 8400));
    if (s2 > 0) {
      ctx.save(); ctx.globalAlpha = s2;
      text(ctx, L.grouped, 16, 54, { size: 9.6, weight: 800 });
      const groups = [{ k: "team", ids: [0, 1], y: 64 }, { k: "accent", ids: [2], y: 150 }];
      const pos = {};
      groups.forEach((g, gi) => {
        const gp = ease.spring(seg(t, 4400 + gi * 300, 5200 + gi * 300));
        if (gp <= 0) return;
        const h = 22 + g.ids.length * 30;
        ctx.save(); ctx.globalAlpha *= clamp(gp * 2); ctx.translate(-(1 - gp) * 16, 0);
        panel(ctx, 14, g.y, 218, h, { r: 9, fill: "rgba(22,12,64,.7)", stroke: rgba(gi ? C.pink : C.purple, 0.6) });
        text(ctx, g.k, 24, g.y + 14, { size: 8.6, weight: 800, color: gi ? "#ff9ccd" : "#c9a7ff" });
        g.ids.forEach((m, j) => {
          const y = g.y + 20 + j * 30;
          const msg = MSG[m];
          pos[m] = [14, y];
          rr(ctx, 22, y, 202, 25, 6); ctx.fillStyle = "rgba(247,244,255,.05)"; ctx.fill();
          text(ctx, msg.id, 30, y + 16, { size: 8.6, weight: 800, mono: true, color: C.cyan });
          text(ctx, msg.text, 52, y + 16, { size: 9.4, weight: 600, max: 128 });
          rr(ctx, 186, y + 10, 30, 5, 2.5); ctx.fillStyle = "rgba(247,244,255,.12)"; ctx.fill();
          rr(ctx, 186, y + 10, 30 * msg.risk, 5, 2.5); ctx.fillStyle = C.magenta; ctx.fill();
        });
        ctx.restore();
      });
      text(ctx, L.same, 16, 230, { size: 8.4, weight: 600, color: rgba(C.ink, 0.6 * seg(t, 5300, 5700)) });
      /* two ways to spend a budget of two messages */
      const bp = seg(t, 5400, 5800);
      if (bp > 0) {
        ctx.globalAlpha = s2 * bp;
        text(ctx, L.budget, 246, 54, { size: 9.6, weight: 800 });
        const lanes = [{ name: L.riskOrder, pick: [0, 1], cov: L.one, good: false, y: 66 }, { name: L.rr, pick: [0, 2], cov: L.two, good: true, y: 148 }];
        lanes.forEach((ln, li) => {
          const lp = seg(t, 5600 + li * 700, 6200 + li * 700);
          panel(ctx, 244, ln.y, 222, 72, { r: 9, fill: ln.good && lp > 0.6 ? "rgba(0,240,255,.07)" : "rgba(22,12,64,.7)", stroke: ln.good && lp > 0.6 ? rgba(C.cyan, 0.8) : "rgba(196,176,255,.24)", glow: ln.good && lp > 0.6 ? rgba(C.cyan, 0.6) : null, blur: 12 });
          text(ctx, ln.name, 254, ln.y + 15, { size: 9, weight: 800, color: ln.good ? "#9ff8ff" : rgba(C.ink, 0.8) });
          ln.pick.forEach((m, k) => {
            const kp = ease.spring(seg(t, 5800 + li * 700 + k * 260, 6400 + li * 700 + k * 260));
            if (kp <= 0) return;
            const x = 254 + k * 104, y = ln.y + 24;
            ctx.save(); ctx.translate(x + 48, y + 12); ctx.scale(kp, kp); ctx.translate(-(x + 48), -(y + 12));
            rr(ctx, x, y, 96, 24, 6); ctx.fillStyle = MSG[m].topic === "team" ? rgba(C.purple, 0.32) : rgba(C.pink, 0.32); ctx.fill();
            text(ctx, MSG[m].id, x + 8, y + 15.6, { size: 8.4, weight: 800, mono: true, color: C.cyan });
            text(ctx, MSG[m].topic, x + 28, y + 15.6, { size: 8.6, weight: 700, color: rgba(C.ink, 0.9) });
            ctx.restore();
          });
          const cp = seg(t, 6500 + li * 700, 6900 + li * 700);
          if (cp > 0) {
            text(ctx, ln.cov, 254, ln.y + 63, { size: 9, weight: 800, color: ln.good ? C.cyan : rgba(C.ink, 0.55), alpha: cp });
            if (ln.good) check(ctx, 452, ln.y + 59, 11, C.cyan, cp);
          }
        });
      }
      ctx.restore();
    }
    /* ---------- step 3: source-linked review ---------- */
    const s3 = seg(t, 8200, 8600) * (1 - seg(t, 12100, 12500));
    if (s3 > 0) {
      ctx.save(); ctx.globalAlpha = s3;
      text(ctx, L.thread, 16, 54, { size: 9.6, weight: 800 });
      const rows = [];
      let y = 62;
      THREAD.forEach((m, i) => {
        const x = 16 + m.d * 14, w = 280 - m.d * 14;
        const full = m.text || m.pre + m.phrase + m.post;
        const lines = wrap(ctx, full, w - 44, 9, 600);
        const h = 12 + lines.length * 12;
        const p = ease.out(seg(t, 8300 + i * 180, 8800 + i * 180));
        rows.push({ x, y, w, h, m });
        ctx.save(); ctx.globalAlpha *= p;
        const lit = (i === 3 && t > 9500) || (t > 10200 + (3 - i) * 380 && t < 12100);
        panel(ctx, x, y, w, h, { r: 7, fill: "rgba(22,12,64,.72)", stroke: lit ? rgba(C.cyan, 0.7) : "rgba(196,176,255,.22)" });
        text(ctx, m.id, x + 8, y + 15, { size: 8.4, weight: 800, mono: true, color: C.cyan });
        /* the text, with the phrase highlighted once selected */
        let xx = x + 34, yy = y + 15, pos = 0;
        const pStart = m.pre ? m.pre.length : -1, pEnd = m.pre ? m.pre.length + m.phrase.length : -1;
        const hot = i === 3 ? seg(t, 9400, 9800) : i === 1 ? 0.35 * seg(t, 9000, 9400) : 0;
        font(ctx, 9, 600);
        lines.forEach((ln) => {
          xx = x + 34;
          const start = Math.max(pos, full.indexOf(ln, pos));
          pos = start + ln.length;
          for (let j = 0; j < ln.length; j++) {
            const idx = start + j, ch = ln[j];
            const inP = idx >= pStart && idx < pEnd;
            if (inP && hot > 0) { const cw = ctx.measureText(ch).width; ctx.fillStyle = rgba(C.magenta, 0.5 * hot); ctx.fillRect(xx - 0.5, yy - 9, cw + 1, 12); }
            ctx.fillStyle = inP && hot > 0 ? "#fff" : "rgba(247,244,255,.86)";
            ctx.fillText(ch, xx, yy);
            if (inP && i === 3 && !state.k11) state.k11 = [xx, yy - 3];
            xx += ctx.measureText(ch).width;
          }
          yy += 12;
        });
        ctx.restore();
        y += h + 6;
      });
      /* evidence group */
      const E = { x: 310, y: 62, w: 156 };
      const ep = ease.spring(seg(t, 8700, 9400));
      if (ep > 0) {
        ctx.save(); ctx.globalAlpha *= clamp(ep * 2); ctx.translate((1 - ep) * 16, 0);
        panel(ctx, E.x, E.y, E.w, 118, { r: 9, fill: "rgba(22,12,64,.78)", stroke: rgba(C.magenta, 0.55) });
        text(ctx, L.evidence + " · karma / flagging", E.x + 10, E.y + 16, { size: 8.6, weight: 800, max: E.w - 18 });
        [["flagging", "m9[14,22)", "0.092", 1], ["karma", "m11[4,9)", "0.619", 3]].forEach(([ph, span, sc, idx], k) => {
          const yy = E.y + 28 + k * 42, on = k === 1 && t > 9300;
          rr(ctx, E.x + 8, yy, E.w - 16, 36, 7); ctx.fillStyle = on ? rgba(C.magenta, 0.22) : "rgba(247,244,255,.05)"; ctx.fill();
          if (on) { ctx.strokeStyle = rgba(C.magenta, 0.9); ctx.lineWidth = 1.2; ctx.shadowColor = C.magenta; ctx.shadowBlur = 10; rr(ctx, E.x + 8, yy, E.w - 16, 36, 7); ctx.stroke(); ctx.shadowBlur = 0; }
          text(ctx, "“" + ph + "”", E.x + 16, yy + 15, { size: 10, weight: 800, color: on ? "#ff8fbd" : rgba(C.ink, 0.9) });
          text(ctx, span, E.x + 16, yy + 29, { size: 8, mono: true, weight: 600, color: rgba(C.ink, 0.65) });
          text(ctx, sc, E.x + E.w - 16, yy + 22, { size: 11, weight: 800, align: "right", color: on ? C.magenta : C.cyan });
        });
        ctx.restore();
        /* chip → phrase in its source message */
        const lk = seg(t, 9300, 9700);
        if (lk > 0 && state.k11) {
          const ax = E.x + 8, ay = E.y + 28 + 42 + 18, [bx, by] = state.k11;
          ctx.strokeStyle = rgba(C.magenta, 0.85); ctx.lineWidth = 1.3; ctx.shadowColor = C.magenta; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lerp(ax, bx + 20, ease.inOut(lk)), lerp(ay, by, ease.inOut(lk))); ctx.stroke(); ctx.shadowBlur = 0;
        }
      }
      /* the reply path, from the evidence back to the question */
      const pp = seg(t, 10100, 11700);
      if (pp > 0 && rows.length === 4) {
        text(ctx, L.path + " · m11 → m10 → m9 → m8", E.x, E.y + 140, { size: 9, weight: 800, color: C.cyan, alpha: seg(t, 10100, 10500), max: E.w + 4 });
        ctx.strokeStyle = C.cyan; ctx.lineWidth = 1.6; ctx.shadowColor = C.cyan; ctx.shadowBlur = 8; ctx.lineCap = "round";
        for (let i = 3; i > 0; i--) {
          const k = ease.inOut(seg(pp, (3 - i) / 3, (4 - i) / 3));
          if (k <= 0) continue;
          const a = rows[i], b = rows[i - 1];
          const x = a.x + 6, y0 = a.y + 4, y1 = b.y + b.h - 2;
          ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, lerp(y0, y1 + 4, k)); ctx.stroke();
          if (k > 0.95) dot(ctx, x, y1 + 4, 2.4, C.cyan, 1, 3);
        }
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }
    /* ---------- step 4: results ---------- */
    const s4 = seg(t, 12300, 12700) * (1 - seg(t, 14700, 15100));
    if (s4 > 0) {
      ctx.save(); ctx.globalAlpha = s4;
      L.stats.forEach(([big, small], i) => {
        const p = ease.spring(seg(t, 12400 + i * 260, 13200 + i * 260));
        if (p <= 0) return;
        const x = 16 + i * 152, y = 50, w = 144, h = 214;
        ctx.save(); ctx.globalAlpha *= clamp(p * 2); ctx.translate(0, (1 - p) * 24);
        panel(ctx, x, y, w, h, { r: 12, fill: "rgba(22,12,64,.72)", stroke: rgba(i === 1 ? C.cyan : C.purple, 0.55), glow: rgba(i === 1 ? C.cyan : C.purple, 0.55), blur: 14 });
        const g = ctx.createLinearGradient(x, 0, x + w, 0);
        g.addColorStop(0, C.cyan); g.addColorStop(1, i === 2 ? C.magenta : C.purple);
        font(ctx, big.length > 4 ? 28 : 32, 900); ctx.fillStyle = g; ctx.textAlign = "left"; ctx.shadowColor = rgba(C.purple, 0.9); ctx.shadowBlur = 14;
        ctx.fillText(big, x + 14, y + 50); ctx.shadowBlur = 0;
        wrap(ctx, small, w - 28, 9.6, 600).forEach((ln, j) => text(ctx, ln, x + 14, y + 72 + j * 14, { size: 9.6, weight: 600, color: rgba(C.ink, 0.86) }));
        const cy = y + 118, ch = 76, gp = ease.out(seg(t, 12900 + i * 260, 13900 + i * 260));
        ctx.strokeStyle = "rgba(247,244,255,.14)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 12, cy + ch); ctx.lineTo(x + w - 12, cy + ch); ctx.stroke();
        if (i === 0) {
          AP.forEach(([xr, cst], k) => {
            const bx = x + 16 + k * 20, f = (v) => ((v - 0.6) / 0.4) * ch * gp;
            rr(ctx, bx, cy + ch - f(xr), 7, f(xr), 2); ctx.fillStyle = "rgba(247,244,255,.3)"; ctx.fill();
            rr(ctx, bx + 8, cy + ch - f(cst), 7, f(cst), 2); ctx.fillStyle = C.cyan; ctx.fill();
          });
          text(ctx, "XLM-R", x + 14, cy + ch + 13, { size: 7.6, weight: 700, color: rgba(C.ink, 0.55) });
          text(ctx, "CST", x + 52, cy + ch + 13, { size: 7.6, weight: 800, color: C.cyan });
          text(ctx, "AP 0.6–1.0", x + w - 14, cy + ch + 13, { size: 7.4, align: "right", color: rgba(C.ink, 0.45) });
        } else if (i === 1) {
          CPU.forEach(([name, sec], k) => {
            const by = cy + 6 + k * 24, bw = ((w - 66) * sec / 340) * gp, hot = name === "CST";
            text(ctx, name, x + 14, by, { size: 7.8, weight: 700, color: hot ? C.cyan : rgba(C.ink, 0.6) });
            rr(ctx, x + 14, by + 4, bw, 6, 3); ctx.fillStyle = hot ? C.cyan : "rgba(247,244,255,.3)"; ctx.fill();
            text(ctx, sec.toFixed(1) + " s", x + 18 + bw, by + 10, { size: 7.4, weight: 700, color: rgba(C.ink, 0.7) });
          });
        } else {
          [[stage.lang === "zh" ? "参考展示" : "reference", 1], [stage.lang === "zh" ? "分组证据" : "grouped", 0.727]].forEach(([name, v], k) => {
            const by = cy + 14 + k * 30, bw = (w - 54) * v * gp, hot = k === 1;
            text(ctx, name, x + 14, by, { size: 7.8, weight: 700, color: hot ? "#ff8fbd" : rgba(C.ink, 0.6) });
            rr(ctx, x + 14, by + 4, bw, 7, 3.5); ctx.fillStyle = hot ? C.magenta : "rgba(247,244,255,.3)"; ctx.fill();
            text(ctx, (hot ? "≤" : "") + Math.round(v * 1000) / 10 + "%", x + 18 + bw, by + 11, { size: 7.6, weight: 700, color: rgba(C.ink, 0.75) });
          });
        }
        ctx.restore();
      });
      ctx.restore();
    }
  },
};
