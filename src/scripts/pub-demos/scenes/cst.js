/* CST: the paper's Figure 3 as a camera move. The view pans across the five numbered panels
   (web discussion, shared representations, discussion ranking, independent organization, source-linked review),
   each animating its step, then pulls back to the whole figure with the reported results. */
import { clamp, lerp, seg, ease, rr, box, text, font, wrap, dot, check, arrow } from "../engine.js";

const W = 480, H = 270;
const PW = 226, PH = 222, PY = 30, X0 = 12, STEP = 244;
const px = (k) => X0 + k * STEP;
const WORLD = X0 + 5 * STEP;
const COL = ["#1f5ea8", "#138a8a", "#6a3ea1", "#c56a00", "#177e7e"];
const TINT = ["#eef4fb", "#e9f6f6", "#f2edf9", "#fdf3e6", "#e9f5f5"];
const T = {
  en: {
    heads: ["Web discussion", "Shared representations", "Discussion ranking", "Independent organization", "Source-linked review"],
    ask: [null, null, "Where to look?", "What to read?", "How to check?"],
    community: "Community", title: "Moderation discussion", excerpt: "Thread excerpt", reply: "Reply to",
    minilm: "MiniLM", sv: "Sentence vectors e", cg: "Character 2–5 grams", cf: "Character features h", concat: "Concatenate [h; e]",
    heads2: "Logistic heads", att: "Attack", hate: "Hate", spam: "Spam/scam", scores: "Message scores r",
    sem: "Semantics", atk: "Attack", rep: "Replies", feats: "144 features", ranker: "Logistic ranker", dscore: "Discussion score s",
    group: "Group messages", extract: "Extract names + spans", ro: "Read-only e, r", nofb: "No prediction feedback",
    inspect: "Inspect discussion", kf: "karma / flagging", as: "Attack score", links: "Original reply links",
    flow: ["Text", "e, r", "Queue", "Evidence"],
    res: [["6 of 6", "message tasks with higher AP than fine-tuned XLM-R"], ["2.62×", "faster than XLM-R on the same CPU service"], ["≥27.3%", "less review time with grouped evidence"]],
  },
  zh: {
    heads: ["网络讨论", "共享表示", "讨论串排序", "独立组织证据", "溯源审核"],
    ask: [null, null, "看哪里？", "读什么？", "怎么核验？"],
    community: "社区", title: "版务讨论", excerpt: "讨论节选", reply: "回复",
    minilm: "MiniLM", sv: "句向量 e", cg: "字符 2–5-gram", cf: "字符特征 h", concat: "拼接 [h; e]",
    heads2: "逻辑回归头", att: "攻击", hate: "仇恨", spam: "垃圾/诈骗", scores: "消息分数 r",
    sem: "语义", atk: "攻击", rep: "回复", feats: "144 维特征", ranker: "逻辑回归排序器", dscore: "讨论串分数 s",
    group: "消息分组", extract: "提取名称与片段", ro: "只读 e, r", nofb: "不回传预测",
    inspect: "查看讨论", kf: "karma / flagging", as: "攻击分数", links: "原始回复链接",
    flow: ["文本", "e, r", "队列", "证据"],
    res: [["6 项", "消息任务的 AP 全部超过微调 XLM-R"], ["2.62×", "同一 CPU 服务上比 XLM-R 更快"], ["≥27.3%", "分组证据让审核时间更短"]],
  },
};
/* Figure 3, panel 1: the Hacker News thread excerpt */
const MSGS = [
  { u: "Culonavirus", id: "m8", to: "m1", c: "#e8b04b", s: "What kinds of user flags are there and why are they not public?" },
  { u: "rezonant", id: "m9", to: "m8", c: "#6fbf73", s: "It's just the flagging you already have access to …" },
  { u: "s1artibartfast", id: "m10", to: "m9", c: "#e57373", s: "At some point you get the option to vouch for flagged posts as well." },
  { u: "mkl", id: "m11", to: "m10", c: "#9575cd", s: ">30 karma, same as flagging:" },
];
const ACT = [[0, 2700], [2700, 5300], [6100, 8400], [9300, 11200], [11200, 13300]];

function head(ctx, k, L, on) {
  const x = px(k);
  box(ctx, x, PY, PW, PH, { r: 6, fill: TINT[k], stroke: on ? COL[k] : "rgba(31,41,51,.18)", lw: on ? 1.6 : 1 });
  rr(ctx, x, PY, PW, 22, 6); ctx.fillStyle = COL[k]; ctx.fill();
  ctx.fillRect(x, PY + 12, PW, 10);
  dot(ctx, x + 13, PY + 11, 7, "#fff");
  text(ctx, String(k + 1), x + 13, PY + 14.6, { size: 9.5, weight: 700, align: "center", color: COL[k] });
  text(ctx, L.heads[k], x + 25, PY + 15.4, { size: 10.6, weight: 700, color: "#fff", max: PW - 32 });
  if (L.ask[k]) {
    font(ctx, 8.4, 700); const w = ctx.measureText(L.ask[k]).width + 12;
    box(ctx, x + PW - w - 4, PY + PH - 17, w, 13, { r: 6.5, fill: "#fff", stroke: COL[k], lw: 1 });
    text(ctx, L.ask[k], x + PW - w / 2 - 4, PY + PH - 7.6, { size: 8.4, weight: 700, align: "center", color: COL[k] });
  }
}

function p1(ctx, t, L) {
  const x = px(0), y = PY;
  box(ctx, x + 8, y + 27, PW - 16, 15, { r: 3, fill: "#16467d" });
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 17, y + 34.5, 4, 0, 6.2832); ctx.moveTo(x + 13, y + 34.5); ctx.lineTo(x + 21, y + 34.5); ctx.stroke();
  text(ctx, L.community, x + 26, y + 38, { size: 8.6, weight: 700, color: "#fff" });
  text(ctx, L.title, x + 10, y + 56, { size: 10.4, weight: 700, color: "#1f2933" });
  text(ctx, L.excerpt, x + 10, y + 65, { size: 7, color: "#6b7785" });
  MSGS.forEach((m, i) => {
    const a = ease.out(seg(t, 150 + i * 250, 550 + i * 250));
    if (a <= 0) return;
    const yy = y + 70 + i * 37;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, (1 - a) * 6);
    dot(ctx, x + 17, yy + 8, 7, m.c);
    dot(ctx, x + 17, yy + 6, 2.6, "#fff"); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + 17, yy + 12.5, 3.8, Math.PI, 0); ctx.fill();
    text(ctx, m.u, x + 28, yy + 7, { size: 8.4, weight: 700, color: "#1f2933" });
    font(ctx, 8.4, 700); const nw = ctx.measureText(m.u).width;
    box(ctx, x + 31 + nw, yy - 0.5, 17, 9.5, { r: 2, fill: "#dceaf8" });
    text(ctx, m.id, x + 39.5 + nw, yy + 6.8, { size: 6.8, weight: 700, align: "center", color: COL[0] });
    text(ctx, L.reply + " " + m.to, x + 28, yy + 15, { size: 6.4, color: "#6b7785" });
    wrap(ctx, m.s, PW - 42, 7.4).slice(0, 2).forEach((ln, j) => text(ctx, ln, x + 28, yy + 23.5 + j * 8.6, { size: 7.4, color: "#1f2933" }));
    ctx.restore();
  });
}

function p2(ctx, t, L) {
  const x = px(1), y = PY, a = seg(t, 2700, 3000);
  const fill = (t0) => ease.out(seg(t, t0, t0 + 700));
  box(ctx, x + 8, y + 28, 102, 64, { r: 4, fill: "#fff", stroke: "rgba(19,138,138,.35)" });
  box(ctx, x + 116, y + 28, 102, 64, { r: 4, fill: "#fff", stroke: "rgba(19,138,138,.35)" });
  /* MiniLM chip */
  ctx.strokeStyle = COL[1]; ctx.lineWidth = 1.2; rr(ctx, x + 40, y + 36, 22, 22, 3); ctx.stroke();
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + 44 + i * 5, y + 33); ctx.lineTo(x + 44 + i * 5, y + 36); ctx.moveTo(x + 44 + i * 5, y + 58); ctx.lineTo(x + 44 + i * 5, y + 61); ctx.stroke(); }
  [[70, 40], [78, 48], [70, 56], [86, 44]].forEach(([dx, dy], i) => dot(ctx, x + dx, y + dy, 2.6, ["#4a86d6", "#8e7cc3", "#138a8a", "#e8b04b"][i], 0.4 + 0.6 * fill(2900)));
  text(ctx, L.minilm, x + 59, y + 74, { size: 8.6, weight: 700, align: "center", color: "#1f2933" });
  text(ctx, L.sv, x + 59, y + 85, { size: 7, align: "center", color: "#52606d" });
  /* character n-grams */
  ["a", "b", "c", "#"].forEach((ch, i) => {
    const k = fill(3000 + i * 120);
    box(ctx, x + 136 + i * 16, y + 38 + (i % 2) * 6, 14, 14, { r: 2, fill: ["#e8b04b", "#e57373", "#6fbf73", "#9575cd"][i], stroke: null });
    ctx.save(); ctx.globalAlpha *= 0.4 + 0.6 * k;
    text(ctx, ch, x + 143 + i * 16, y + 48.5 + (i % 2) * 6, { size: 9, weight: 700, align: "center", color: "#fff" });
    ctx.restore();
  });
  text(ctx, L.cg, x + 167, y + 74, { size: 8.2, weight: 700, align: "center", color: "#1f2933", max: 96 });
  text(ctx, L.cf, x + 167, y + 85, { size: 7, align: "center", color: "#52606d", max: 96 });
  /* concatenation */
  text(ctx, L.concat, x + PW / 2, y + 106, { size: 8.6, weight: 700, align: "center", color: "#1f2933" });
  const cf = fill(3500);
  for (let i = 0; i < 14; i++) {
    const on = i / 14 < cf;
    box(ctx, x + 14 + i * 14, y + 111, 12, 9, { r: 1.5, fill: on ? (i < 6 ? "#e8b04b" : "#4a86d6") : "rgba(31,41,51,.1)" });
  }
  /* logistic heads */
  box(ctx, x + 8, y + 128, PW - 16, 58, { r: 4, fill: "#fff", stroke: "rgba(19,138,138,.35)" });
  text(ctx, L.heads2, x + PW / 2, y + 141, { size: 8.8, weight: 700, align: "center", color: "#1f2933" });
  [[L.att, "#d93025", 0.62], [L.hate, "#7e57c2", 0.31], [L.spam, "#2e7d32", 0.18]].forEach(([n, c, v], i) => {
    const xx = x + 16 + i * 66, k = fill(3900 + i * 200);
    text(ctx, n, xx, y + 156, { size: 8, weight: 700, color: c, max: 62 });
    box(ctx, xx, y + 161, 56, 5, { r: 2.5, fill: "rgba(31,41,51,.1)" });
    box(ctx, xx, y + 161, 56 * v * k, 5, { r: 2.5, fill: c });
  });
  text(ctx, L.scores, x + PW / 2, y + 180, { size: 7.4, align: "center", color: "#52606d" });
  /* tokens flowing in from the thread */
  if (a > 0 && t < 4000) {
    for (let i = 0; i < 8; i++) {
      const q = seg(t, 2700 + i * 120, 3500 + i * 120);
      if (q <= 0 || q >= 1) continue;
      const sx = px(0) + PW - 6, sy = PY + 90 + (i % 4) * 30, tx = x + (i % 2 ? 167 : 59), ty = y + 46;
      dot(ctx, lerp(sx, tx, ease.inOut(q)), lerp(sy, ty, ease.inOut(q)) - Math.sin(q * Math.PI) * 18, 2.2, i % 2 ? "#e8b04b" : "#4a86d6");
    }
  }
}

function p3(ctx, t, L, state) {
  const x = px(2), y = PY;
  const g = (t0) => ease.out(seg(t, t0, t0 + 800));
  /* three feature groups */
  [[L.sem, "128-D"], [L.atk, "10-D"], [L.rep, "6-D"]].forEach(([n, d], i) => {
    const xx = x + 8 + i * 72;
    box(ctx, xx, y + 28, 66, 66, { r: 4, fill: "#fff", stroke: "rgba(106,62,161,.3)" });
    text(ctx, n, xx + 33, y + 39, { size: 8, weight: 700, align: "center", color: "#1f2933", max: 62 });
    text(ctx, d, xx + 33, y + 48, { size: 6.8, align: "center", color: "#52606d" });
    const k = g(6200 + i * 250);
    if (i === 0) for (let j = 0; j < 18; j++) dot(ctx, xx + 10 + ((j * 37) % 46), y + 56 + ((j * 17) % 30), 1.8, ["#4a86d6", "#8e7cc3", "#e57373", "#26a69a"][j % 4], k);
    if (i === 1) for (let j = 0; j < 10; j++) { const hh = (8 + ((j * 7) % 22)) * k; box(ctx, xx + 8 + j * 5.2, y + 88 - hh, 4, hh, { r: 1, fill: "#d93025" }); }
    if (i === 2) {
      ctx.strokeStyle = "#26a69a"; ctx.lineWidth = 1.3;
      const nodes = [[33, 56], [20, 70], [46, 70], [13, 84], [27, 84], [46, 84]], edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];
      edges.forEach(([a, b], j) => { if (j / edges.length < k) { ctx.beginPath(); ctx.moveTo(xx + nodes[a][0], y + nodes[a][1]); ctx.lineTo(xx + nodes[b][0], y + nodes[b][1]); ctx.stroke(); } });
      nodes.forEach(([nx, ny], j) => { if (j / nodes.length < k + 0.2) dot(ctx, xx + nx, y + ny, 3, "#26a69a"); });
    }
  });
  /* 144 features */
  text(ctx, L.feats, x + PW / 2, y + 107, { size: 8.6, weight: 700, align: "center", color: "#1f2933" });
  const f = g(7000), fw = PW - 28;
  [[128, "#8e7cc3"], [10, "#d93025"], [6, "#26a69a"]].reduce((acc, [n, c]) => { const w = (fw * n) / 144; box(ctx, x + 14 + acc, y + 112, Math.max(0, w * f - 0.5), 8, { r: 1.5, fill: c }); return acc + w; }, 0);
  box(ctx, x + 14, y + 112, fw, 8, { r: 1.5, stroke: "rgba(31,41,51,.25)" });
  /* logistic ranker and the queue */
  box(ctx, x + 40, y + 128, PW - 80, 22, { r: 4, fill: "#fff", stroke: "rgba(106,62,161,.45)" });
  text(ctx, L.ranker, x + PW / 2, y + 142.5, { size: 8.8, weight: 700, align: "center", color: COL[2] });
  text(ctx, L.dscore, x + PW / 2, y + 159, { size: 7.2, align: "center", color: "#52606d" });
  const scores = [0.34, 0.83, 0.21, 0.58], order = [1, 3, 0, 2], sp = ease.spring(seg(t, 7600, 8300));
  scores.forEach((v, i) => {
    const r1 = order.indexOf(i), yy = y + 164 + lerp(i, r1, sp) * 9.6;
    const top = r1 === 0 && sp > 0.5;
    box(ctx, x + 30, yy, PW - 60, 8, { r: 2, fill: top ? "rgba(217,48,37,.14)" : "#fff", stroke: top ? "#d93025" : "rgba(31,41,51,.18)" });
    box(ctx, x + 32, yy + 2, (PW - 64) * v * g(7300), 4, { r: 2, fill: top ? "#d93025" : COL[2] });
  });
}

function p4(ctx, t, L) {
  const x = px(3), y = PY, k = ease.inOut(seg(t, 9400, 10400));
  box(ctx, x + 8, y + 28, PW - 16, 86, { r: 4, fill: "#fff", stroke: "rgba(197,106,0,.3)" });
  text(ctx, L.group, x + PW / 2, y + 108, { size: 8.6, weight: 700, align: "center", color: "#1f2933" });
  const B = [[30, 50, 0], [150, 46, 1], [70, 80, 0], [110, 54, 1], [176, 82, 1], [46, 72, 0]];
  B.forEach(([bx, by, g], i) => {
    const tx = g ? 150 + (i % 2) * 18 : 46 + (i % 3) * 16, ty = g ? 52 + (i % 3) * 10 : 54 + (i % 2) * 14;
    const cx = x + lerp(bx, tx, k), cy = y + lerp(by, ty, k);
    box(ctx, cx - 12, cy - 7, 24, 14, { r: 7, fill: g ? "rgba(197,106,0,.22)" : "rgba(31,94,168,.18)", stroke: g ? "#c56a00" : "#1f5ea8", lw: 1 });
    [0, 1, 2].forEach((j) => dot(ctx, cx - 6 + j * 6, cy, 1.4, g ? "#c56a00" : "#1f5ea8"));
  });
  if (k > 0.8) { ctx.strokeStyle = "rgba(197,106,0,.55)"; ctx.setLineDash([3, 2]); ctx.lineWidth = 1; rr(ctx, x + 140, y + 36, 64, 52, 8); ctx.stroke(); ctx.strokeStyle = "rgba(31,94,168,.55)"; rr(ctx, x + 22, y + 38, 70, 52, 8); ctx.stroke(); ctx.setLineDash([]); }
  /* extract names + spans */
  box(ctx, x + 8, y + 120, PW - 16, 46, { r: 4, fill: "#fff", stroke: "rgba(197,106,0,.3)" });
  ctx.fillStyle = "#c56a00"; ctx.beginPath(); ctx.moveTo(x + 22, y + 130); ctx.lineTo(x + 46, y + 130); ctx.lineTo(x + 37, y + 142); ctx.lineTo(x + 37, y + 152); ctx.lineTo(x + 31, y + 155); ctx.lineTo(x + 31, y + 142); ctx.closePath(); ctx.fill();
  const sp = ease.out(seg(t, 10200, 10900));
  [0, 1, 2].forEach((j) => { box(ctx, x + 60, y + 130 + j * 9, 110, 4, { r: 2, fill: "rgba(31,41,51,.14)" }); if (j !== 1) box(ctx, x + 60 + j * 24, y + 129 + j * 9, 30 * sp, 6, { r: 2, fill: "rgba(255,193,7,.7)" }); });
  text(ctx, L.extract, x + 60, y + 161, { size: 8, weight: 700, color: "#1f2933" });
  /* read-only */
  box(ctx, x + 8, y + 172, PW - 16, 30, { r: 4, fill: "#fff7e6", stroke: "rgba(197,106,0,.5)" });
  ctx.strokeStyle = "#c56a00"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x + 24, y + 183, 4.5, Math.PI, 0); ctx.stroke();
  box(ctx, x + 17, y + 183, 14, 11, { r: 2, fill: "#c56a00" });
  text(ctx, L.ro, x + 40, y + 184, { size: 8.4, weight: 700, color: "#7a4300" });
  text(ctx, L.nofb, x + 40, y + 195, { size: 7.2, color: "#7a4300" });
}

function p5(ctx, t, L) {
  const x = px(4), y = PY;
  box(ctx, x + 8, y + 28, PW - 16, 18, { r: 3, fill: "#fff", stroke: "rgba(23,126,126,.4)" });
  ctx.strokeStyle = COL[4]; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(x + 20, y + 37, 4.5, 0, 6.2832); ctx.stroke();
  text(ctx, L.inspect, x + 30, y + 40.5, { size: 8.6, weight: 700, color: "#1f2933" });
  /* folder */
  ctx.fillStyle = "#e8b04b"; rr(ctx, x + 12, y + 56, 20, 14, 2); ctx.fill(); rr(ctx, x + 12, y + 53, 9, 5, 1.5); ctx.fill();
  text(ctx, L.kf, x + 38, y + 66, { size: 9.4, weight: 700, color: "#1f2933" });
  [["m9", "flagging", "0.092", 11300], ["m11", "karma", "0.619", 11700]].forEach(([id, ph, sc, at], i) => {
    const a = ease.out(seg(t, at, at + 500));
    const yy = y + 78 + i * 46;
    ctx.save(); ctx.globalAlpha *= 0.25 + 0.75 * a;
    box(ctx, x + 8, yy, PW - 16, 38, { r: 4, fill: "#fff", stroke: i === 1 && t > 12200 ? "#d93025" : "rgba(23,126,126,.35)", lw: i === 1 && t > 12200 ? 1.6 : 1 });
    text(ctx, id, x + 16, yy + 14, { size: 8.6, weight: 700, color: COL[4] });
    font(ctx, 9.4, 700); const pw = ctx.measureText(ph).width;
    if (a > 0) { ctx.fillStyle = "rgba(255,213,79,.8)"; ctx.fillRect(x + 42, yy + 5, (pw + 6) * a, 12); }
    text(ctx, ph, x + 45, yy + 14, { size: 9.4, weight: 700, color: "#1f2933" });
    text(ctx, L.as + " " + sc, x + 16, yy + 30, { size: 8, color: "#52606d" });
    /* outbound link icon */
    ctx.strokeStyle = COL[4]; ctx.lineWidth = 1.2; rr(ctx, x + PW - 30, yy + 8, 12, 12, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + PW - 24, yy + 14); ctx.lineTo(x + PW - 16, yy + 6); ctx.moveTo(x + PW - 20, yy + 6); ctx.lineTo(x + PW - 16, yy + 6); ctx.lineTo(x + PW - 16, yy + 10); ctx.stroke();
    ctx.restore();
  });
}

export default {
  id: "cst",
  size: [W, H],
  bg: "#ffffff",
  duration: 17200,
  poster: 15800,
  draw(ctx, t, state, stage) {
    const L = T[stage.lang] || T.en;
    /* camera: pan across, then pull back to the whole figure */
    const pan = [[0, 0], [5300, 0], [6100, STEP], [8400, STEP], [9300, 3 * STEP]];
    let cx = 0;
    for (let i = 1; i < pan.length; i++) if (t >= pan[i - 1][0]) cx = t >= pan[i][0] ? pan[i][1] : lerp(pan[i - 1][1], pan[i][1], ease.inOut(seg(t, pan[i - 1][0], pan[i][0])));
    const z = ease.inOut(seg(t, 13300, 14300));
    const s = lerp(1, W / (WORLD + 8), z), camX = lerp(cx, 0, z), oy = lerp(0, 14, z);
    ctx.save();
    ctx.translate(0, oy); ctx.scale(s, s); ctx.translate(-camX, 0);
    /* the reply links run back from the review to the thread */
    const lk = Math.max(seg(t, 12300, 12900), z);
    ctx.strokeStyle = lk > 0 ? `rgba(23,126,126,${0.35 + 0.6 * lk})` : "rgba(31,41,51,.25)";
    ctx.lineWidth = 1.2 + lk * 0.8;
    ctx.setLineDash([4, 3]); ctx.lineDashOffset = t / 40;
    ctx.beginPath(); ctx.moveTo(px(4) + PW / 2, PY); ctx.bezierCurveTo(px(4) + PW / 2, 6, px(0) + PW / 2, 6, px(0) + PW / 2, PY); ctx.stroke(); ctx.setLineDash([]);
    text(ctx, L.links, (px(0) + px(4) + PW) / 2, 13, { size: 9, weight: 700, align: "center", color: "#177e7e" });
    for (let k = 0; k < 5; k++) {
      const on = t >= ACT[k][0] && t < ACT[k][1] && z === 0;
      head(ctx, k, L, on);
    }
    p1(ctx, t, L); p2(ctx, t, L); p3(ctx, t, L, state); p4(ctx, t, L); p5(ctx, t, L);
    /* flows between panels */
    [[0, 1, L.flow[0], 2700], [1, 2, L.flow[1], 5600]].forEach(([a, b, lab, at]) => {
      const k = ease.out(seg(t, at, at + 500)), ya = PY + PH / 2;
      arrow(ctx, px(a) + PW + 2, ya, px(b) - 2, ya, "#52606d", 1.4, 5, Math.max(k, z));
      text(ctx, lab, (px(a) + PW + px(b)) / 2, ya - 5, { size: 7.6, weight: 700, align: "center", color: "#52606d", alpha: Math.max(k, z) });
    });
    [[2, 4, L.flow[2], 11000, 14], [3, 4, L.flow[3], 10900, 0]].forEach(([a, b, lab, at, drop]) => {
      const k = Math.max(ease.out(seg(t, at, at + 500)), z), yb = PY + PH + 6 + drop;
      if (k <= 0) return;
      ctx.strokeStyle = "#52606d"; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.moveTo(px(a) + PW / 2, PY + PH); ctx.lineTo(px(a) + PW / 2, yb); ctx.lineTo(lerp(px(a) + PW / 2, px(b) + 40 + drop, k), yb); ctx.stroke();
      if (k > 0.95) arrow(ctx, px(b) + 40 + drop, yb, px(b) + 40 + drop, PY + PH + 1, "#52606d", 1.2, 4, 1);
      text(ctx, lab, lerp(px(a) + PW / 2, px(b) + 40 + drop, 0.5), yb - 2, { size: 7.4, weight: 700, align: "center", color: "#52606d", alpha: k });
    });
    ctx.restore();
    /* the reported results under the whole figure */
    if (z > 0) {
      const fy = oy + (PY + PH + 30) * s + 10;
      L.res.forEach(([big, small], i) => {
        const p = ease.spring(seg(t, 14000 + i * 220, 14700 + i * 220));
        if (p <= 0) return;
        const x = 14 + i * 156, w = 148;
        ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate(0, (1 - p) * 10);
        box(ctx, x, fy, w, 112, { r: 6, fill: TINT[[0, 2, 4][i]], stroke: COL[[0, 2, 4][i]], lw: 1.2 });
        text(ctx, big, x + 12, fy + 36, { size: 26, weight: 800, color: COL[[0, 2, 4][i]] });
        wrap(ctx, small, w - 22, 10.4, 600).slice(0, 3).forEach((ln, j) => text(ctx, ln, x + 12, fy + 58 + j * 14, { size: 10.4, weight: 600, color: "#1f2933" }));
        ctx.restore();
      });
    }
  },
};
