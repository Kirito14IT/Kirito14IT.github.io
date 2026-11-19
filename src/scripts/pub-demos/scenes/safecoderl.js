/* SafeCodeRL: the five-agent closed loop with constraint-aware RL (paper Figure 2).
   Planner decomposes an IoT telemetry task, Code writes, the shield blocks a CWE-89 pattern before the sandbox,
   Security and Test report, the Critic turns feedback into reward and cost, the Lagrangian penalty steers PPO,
   and the rewrite passes with no medium- or high-severity vulnerability. */
import { C, rgba, clamp, lerp, seg, ease, rr, panel, text, typed, font, dot, check, wrap } from "../engine.js";

const RING = { x: 98, y: 156, r: 70 };
const AGENTS = [
  { k: "plan", en: "Planner", zh: "规划", a: -90 },
  { k: "code", en: "Code", zh: "代码", a: -18 },
  { k: "sec", en: "Security", zh: "安全", a: 54 },
  { k: "test", en: "Test", zh: "测试", a: 126 },
  { k: "critic", en: "Critic", zh: "评审", a: 198 },
];
const ED = { x: 196, y: 44, w: 272, h: 142 };
const CODE0 = [
  ['@app.get("/telemetry")', "dec"],
  ["def read(sensor_id):", "def"],
  ['    q = "SELECT * FROM readings WHERE id=" + sensor_id', "bad"],
  ["    return db.execute(q)", "bad"],
];
const CODE1 = [
  ['    q = "SELECT * FROM readings WHERE id = ?"', "good"],
  ["    return db.execute(q, (sensor_id,))", "good"],
];
const T = {
  en: { task: "Task · sensor telemetry API", sub: ["read rows by sensor_id", "security context: SQL input"], shield: "Shield · blocked before sandbox", cwe: "CWE-89 SQL injection", report: "CWE-89 · severity high", tests: "sandbox tests", reward: "reward", cost: "cost", lambda: "Lagrangian λ", ppo: "PPO update", pass: "Secure pass", passSub: "tests pass · no medium/high flaw", sp: "Secure Pass@1 on 25 IoT/CPS tasks", vr: "vulnerability rate, Llama-3-8B", vrAfter: "after two rounds", tasks: ["telemetry", "gateway", "config", "aggregation", "parsing"] },
  zh: { task: "任务 · 传感器遥测接口", sub: ["按 sensor_id 读取数据", "安全上下文：SQL 输入"], shield: "屏蔽 · 沙箱执行前拦截", cwe: "CWE-89 SQL 注入", report: "CWE-89 · 高危", tests: "沙箱测试", reward: "奖励", cost: "代价", lambda: "拉格朗日 λ", ppo: "PPO 更新", pass: "安全通过", passSub: "测试通过 · 无中高危漏洞", sp: "25 个 IoT/CPS 任务的 Secure Pass@1", vr: "漏洞率（Llama-3-8B）", vrAfter: "两轮之后", tasks: ["遥测", "网关", "配置", "聚合", "解析"] },
};

function agentPos(i) { const a = (AGENTS[i].a * Math.PI) / 180; return [RING.x + RING.r * Math.cos(a), RING.y + RING.r * Math.sin(a)]; }

function glyph(ctx, k, x, y, color) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  if (k === "plan") { [-4, 0, 4].forEach((yy) => { ctx.moveTo(-5, yy); ctx.lineTo(-4, yy); ctx.moveTo(-1.5, yy); ctx.lineTo(5.5, yy); }); }
  else if (k === "code") { ctx.moveTo(-3, -4); ctx.lineTo(-6.5, 0); ctx.lineTo(-3, 4); ctx.moveTo(3, -4); ctx.lineTo(6.5, 0); ctx.lineTo(3, 4); ctx.moveTo(1.2, -5); ctx.lineTo(-1.2, 5); }
  else if (k === "sec") { ctx.moveTo(0, -6.5); ctx.lineTo(5.5, -4); ctx.lineTo(5, 1.5); ctx.quadraticCurveTo(4, 5, 0, 7); ctx.quadraticCurveTo(-4, 5, -5, 1.5); ctx.lineTo(-5.5, -4); ctx.closePath(); }
  else if (k === "test") { ctx.moveTo(-2.5, -6); ctx.lineTo(-2.5, -1.5); ctx.lineTo(-6, 5.5); ctx.lineTo(6, 5.5); ctx.lineTo(2.5, -1.5); ctx.lineTo(2.5, -6); ctx.moveTo(-3.8, -6); ctx.lineTo(3.8, -6); ctx.moveTo(-4.2, 2); ctx.lineTo(4.2, 2); }
  else if (k === "critic") { ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.moveTo(-6, -3); ctx.lineTo(6, -3); ctx.moveTo(-6, -3); ctx.lineTo(-8, 2); ctx.lineTo(-4, 2); ctx.closePath(); ctx.moveTo(6, -3); ctx.lineTo(4, 2); ctx.lineTo(8, 2); ctx.closePath(); ctx.moveTo(-3, 6); ctx.lineTo(3, 6); }
  ctx.stroke(); ctx.restore();
}
function shieldPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.82, y - s * 0.62); ctx.lineTo(x + s * 0.74, y + s * 0.2);
  ctx.quadraticCurveTo(x + s * 0.56, y + s * 0.78, x, y + s * 1.04); ctx.quadraticCurveTo(x - s * 0.56, y + s * 0.78, x - s * 0.74, y + s * 0.2);
  ctx.lineTo(x - s * 0.82, y - s * 0.62); ctx.closePath();
}
const ACTIVE = [[300, 3000, 0], [3000, 6400, 1], [6700, 7700, 2], [7600, 8600, 3], [8500, 9600, 4], [9500, 10800, 1], [10900, 11800, 3], [11000, 11900, 2]];

function codeColor(kind) { return kind === "bad" ? "#ff8fbd" : kind === "good" ? "#8ff6ff" : kind === "dec" ? "#c9a7ff" : "rgba(247,244,255,.92)"; }

export default {
  duration: 15200,
  poster: 13600,
  seed: 2.7,
  mood: [
    [0, { v: 0.85, c: 0.5, m: 0.05 }],
    [4900, { v: 0.85, c: 0.4, m: 0.12 }],
    [5400, { v: 0.6, c: 0.12, m: 1 }],
    [6800, { v: 0.7, c: 0.2, m: 0.55 }],
    [9800, { v: 0.8, c: 0.5, m: 0.25 }],
    [11200, { v: 0.7, c: 0.85, m: 0.08 }],
    [15200, { v: 0.85, c: 0.5, m: 0.05 }],
  ],
  steps: [
    { at: 0, label: { en: "Plan", zh: "规划" }, caption: { en: "The Planner decomposes an IoT telemetry task and extracts its security-relevant context.", zh: "规划智能体拆解 IoT 遥测任务，并提取与安全相关的上下文。" } },
    { at: 3000, label: { en: "Generate and shield", zh: "生成与屏蔽" }, caption: { en: "The Code agent writes; the shield blocks an SQL-injection pattern (CWE-89) before the sandbox.", zh: "代码智能体编写代码；屏蔽机制在沙箱执行前拦下 SQL 注入模式（CWE-89）。" } },
    { at: 6700, label: { en: "Audit, test, learn", zh: "审计 · 测试 · 学习" }, caption: { en: "Security and Test report; the Critic turns them into reward and cost, and a Lagrangian penalty steers PPO.", zh: "安全与测试智能体反馈，评审智能体转为奖励与代价，拉格朗日惩罚引导 PPO 更新。" } },
    { at: 10900, label: { en: "Secure pass", zh: "安全通过" }, caption: { en: "The rewrite passes its tests with no high-risk flaw: 89.3% Secure Pass@1 on 25 IoT/CPS tasks.", zh: "重写后的代码通过测试且无高危漏洞：25 个 IoT/CPS 任务上 Secure Pass@1 为 89.3%。" } },
  ],
  draw(ctx, t, state, stage) {
    const L = T[stage.lang] || T.en;
    const fadeAll = 1 - seg(t, 14700, 15100);
    ctx.save(); ctx.globalAlpha = fadeAll;
    /* ---------- the closed loop ---------- */
    const ra = seg(t, 100, 700);
    ctx.save(); ctx.globalAlpha *= ra;
    ctx.strokeStyle = "rgba(196,176,255,.22)"; ctx.lineWidth = 1.2; ctx.setLineDash([3, 5]); ctx.lineDashOffset = -t / 50;
    ctx.beginPath(); ctx.arc(RING.x, RING.y, RING.r, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
    /* a pulse that travels Planner → Code → Security → Test → Critic */
    const lap = (t % 3800) / 3800, ang = -Math.PI / 2 + lap * Math.PI * 2;
    const g = ctx.createConicGradient ? ctx.createConicGradient(ang - 0.9, RING.x, RING.y) : null;
    if (g) { g.addColorStop(0, rgba(C.cyan, 0)); g.addColorStop(0.14, rgba(C.cyan, 0.9)); g.addColorStop(0.15, rgba(C.cyan, 0)); g.addColorStop(1, rgba(C.cyan, 0)); ctx.strokeStyle = g; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(RING.x, RING.y, RING.r, 0, 6.2832); ctx.stroke(); }
    AGENTS.forEach((ag, i) => {
      const [x, y] = agentPos(i);
      let act = 0;
      ACTIVE.forEach(([a, b, k]) => { if (k === i) act = Math.max(act, seg(t, a, a + 250) * (1 - seg(t, b - 200, b))); });
      const warn = i === 2 && t > 6700 && t < 8000;
      const col = warn ? C.magenta : C.cyan;
      const p = ease.spring(seg(t, 200 + i * 120, 900 + i * 120));
      ctx.save(); ctx.translate(x, y); ctx.scale(p * (1 + 0.12 * act), p * (1 + 0.12 * act));
      ctx.fillStyle = act > 0 ? rgba(col, 0.22) : "rgba(22,12,64,.92)";
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = act > 0 ? col : "rgba(196,176,255,.4)"; ctx.lineWidth = 1.4;
      if (act > 0) { ctx.shadowColor = col; ctx.shadowBlur = 14 * act; }
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.2832); ctx.stroke(); ctx.shadowBlur = 0;
      glyph(ctx, ag.k, 0, 0, act > 0 ? "#ffffff" : "rgba(247,244,255,.75)");
      ctx.restore();
      text(ctx, stage.lang === "zh" ? ag.zh : ag.en, x, y + 28, { size: 8.6, weight: 700, align: "center", color: act > 0 ? (warn ? "#ff8fbd" : "#9ff8ff") : rgba(C.ink, 0.7) });
    });
    ctx.restore();
    /* IoT/CPS task suite under the loop: lights up when the code passes securely */
    L.tasks.forEach((name, i) => {
      const x = 16 + i * 34, y = 268, on = seg(t, 11600 + i * 140, 12000 + i * 140);
      rr(ctx, x, y - 10, 30, 22, 5); ctx.fillStyle = on > 0 ? rgba(C.cyan, 0.12 + 0.25 * on) : "rgba(22,12,64,.7)"; ctx.fill();
      ctx.strokeStyle = on > 0 ? rgba(C.cyan, 0.4 + 0.5 * on) : "rgba(196,176,255,.22)"; ctx.lineWidth = 1; rr(ctx, x, y - 10, 30, 22, 5); ctx.stroke();
      dot(ctx, x + 15, y - 2, 2.2, on > 0 ? C.cyan : "rgba(247,244,255,.35)", 1, on > 0 ? 3 : 0);
      text(ctx, name, x + 15, y + 8.5, { size: 5.8, weight: 700, align: "center", color: rgba(C.ink, 0.6 + 0.4 * on), max: 28 });
    });
    /* ---------- the editor ---------- */
    const ep = seg(t, 300, 900);
    ctx.save(); ctx.globalAlpha *= ep;
    panel(ctx, ED.x, ED.y, ED.w, ED.h, { r: 10, fill: "rgba(10, 6, 34, .9)", stroke: "rgba(196,176,255,.3)" });
    [0, 1, 2].forEach((i) => { ctx.fillStyle = [C.magenta, C.purple, C.cyan][i]; ctx.globalAlpha = ep * fadeAll * 0.75; ctx.beginPath(); ctx.arc(ED.x + 12 + i * 9, ED.y + 11, 2.5, 0, 6.2832); ctx.fill(); });
    ctx.globalAlpha = ep * fadeAll;
    text(ctx, typed(L.task, seg(t, 500, 1400)), ED.x + 44, ED.y + 14, { size: 8.8, weight: 700, color: rgba(C.ink, 0.85) });
    /* planner sub-tasks */
    L.sub.forEach((s, i) => {
      const p = ease.spring(seg(t, 1300 + i * 350, 2000 + i * 350)) * (1 - seg(t, 2900, 3200));
      if (p <= 0) return;
      font(ctx, 8.4, 700);
      const w = ctx.measureText(s).width + 16, x = ED.x + 12, y = ED.y + 30 + i * 22;
      ctx.save(); ctx.globalAlpha *= clamp(p); ctx.translate(-(1 - p) * 10, 0);
      rr(ctx, x, y, w, 17, 8.5); ctx.fillStyle = i ? rgba(C.magenta, 0.2) : rgba(C.purple, 0.3); ctx.fill();
      text(ctx, s, x + 8, y + 11.8, { size: 8.4, weight: 700, color: i ? "#ff9ccd" : "#d8c6ff" });
      ctx.restore();
    });
    /* code: first draft, then the rewrite */
    const rew = seg(t, 9700, 10500);
    const lines = CODE0.map((l, i) => (i >= 2 && rew > 0 ? CODE1[i - 2] : l));
    lines.forEach(([s, kind], i) => {
      const y = ED.y + 34 + i * 18;
      const st = 3100 + i * 650;
      let shown;
      if (i >= 2 && rew > 0) shown = typed(s, seg(t, 9750 + (i - 2) * 350, 10350 + (i - 2) * 350));
      else shown = typed(s, seg(t, st, st + 600));
      if (!shown) return;
      text(ctx, String(i + 1), ED.x + 16, y + 12, { size: 8, mono: true, color: rgba(C.ink, 0.35), align: "right" });
      if (kind === "bad" && t > 5300 && rew <= 0) { rr(ctx, ED.x + 22, y, ED.w - 30, 16, 3); ctx.fillStyle = rgba(C.magenta, 0.16 + 0.08 * Math.sin(t / 160)); ctx.fill(); }
      if (kind === "good") { rr(ctx, ED.x + 22, y, ED.w - 30, 16, 3); ctx.fillStyle = rgba(C.cyan, 0.12); ctx.fill(); }
      text(ctx, shown, ED.x + 26, y + 11.6, { size: 8.4, mono: true, weight: 500, color: codeColor(kind), max: ED.w - 34 });
    });
    ctx.restore();
    /* the shield slams onto the unsafe lines */
    const sp = ease.spring(seg(t, 5200, 5900)) * (1 - seg(t, 9500, 9800));
    if (sp > 0) {
      const sx = ED.x + ED.w - 26, sy = ED.y + 84;
      ctx.save(); ctx.globalAlpha *= clamp(sp * 2);
      ctx.translate(sx, sy); const sc = 1.8 - 0.8 * sp; ctx.scale(sc, sc); ctx.translate(-sx, -sy);
      shieldPath(ctx, sx, sy, 14); ctx.fillStyle = rgba(C.magenta, 0.85); ctx.shadowColor = C.magenta; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - 5, sy - 2); ctx.lineTo(sx + 5, sy + 8); ctx.moveTo(sx + 5, sy - 2); ctx.lineTo(sx - 5, sy + 8); ctx.stroke();
      ctx.restore();
      const lp = seg(t, 5600, 6000);
      ctx.save(); ctx.globalAlpha *= lp;
      panel(ctx, ED.x + 26, ED.y + 112, ED.w - 64, 24, { r: 7, fill: rgba(C.magenta, 0.18), stroke: rgba(C.magenta, 0.85), glow: C.magenta, blur: 10 });
      text(ctx, L.shield, ED.x + 34, ED.y + 122, { size: 8, weight: 800, color: "#ff9ccd" });
      text(ctx, L.cwe, ED.x + 34, ED.y + 132.4, { size: 8, weight: 700, mono: true, color: rgba(C.ink, 0.92) });
      ctx.restore();
    }
    /* ---------- constraint-aware optimization ---------- */
    const op = seg(t, 6700, 7100) * (1 - seg(t, 10700, 11000));
    const O = { x: ED.x, y: 196, w: ED.w, h: 92 };
    if (op > 0) {
      ctx.save(); ctx.globalAlpha *= op;
      panel(ctx, O.x, O.y, O.w, O.h, { r: 10, fill: "rgba(22,12,64,.78)" });
      /* Security report and Test run */
      const r1 = ease.spring(seg(t, 6800, 7400));
      if (r1 > 0) { rr(ctx, O.x + 10, O.y + 10, 112, 18, 9); ctx.fillStyle = rgba(C.magenta, 0.22 * r1); ctx.fill(); text(ctx, L.report, O.x + 18, O.y + 22.4, { size: 8.2, weight: 800, color: "#ff9ccd", alpha: r1 }); }
      const tp = seg(t, 7700, 8500);
      if (tp > 0) {
        text(ctx, L.tests, O.x + 132, O.y + 22.4, { size: 8.2, weight: 700, color: rgba(C.ink, 0.8) });
        rr(ctx, O.x + 196, O.y + 16, 64, 6, 3); ctx.fillStyle = "rgba(247,244,255,.12)"; ctx.fill();
        rr(ctx, O.x + 196, O.y + 16, 64 * tp, 6, 3); ctx.fillStyle = C.cyan; ctx.fill();
      }
      /* Critic: reward and cost, then the Lagrange multiplier */
      const cp = seg(t, 8600, 9200);
      if (cp > 0) {
        [[L.reward, 0.62, C.cyan], [L.cost, 0.78, C.magenta]].forEach(([n, v, col], i) => {
          const y = O.y + 44 + i * 18;
          text(ctx, n, O.x + 12, y + 7, { size: 8, weight: 700, color: rgba(C.ink, 0.75) });
          rr(ctx, O.x + 48, y + 1, 76, 6, 3); ctx.fillStyle = "rgba(247,244,255,.1)"; ctx.fill();
          rr(ctx, O.x + 48, y + 1, 76 * v * ease.out(cp), 6, 3); ctx.fillStyle = col; ctx.fill();
        });
        /* λ gauge */
        const gx = O.x + 176, gy = O.y + 76, gr = 24, lam = ease.out(seg(t, 8900, 9800));
        ctx.lineWidth = 5; ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(247,244,255,.12)"; ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, 0); ctx.stroke();
        const gg = ctx.createLinearGradient(gx - gr, 0, gx + gr, 0); gg.addColorStop(0, C.cyan); gg.addColorStop(1, C.magenta);
        ctx.strokeStyle = gg; ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, Math.PI + Math.PI * (0.25 + 0.55 * lam)); ctx.stroke();
        const na = Math.PI + Math.PI * (0.25 + 0.55 * lam);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(na) * (gr - 6), gy + Math.sin(na) * (gr - 6)); ctx.stroke();
        text(ctx, L.lambda, gx, gy + 12, { size: 7.6, weight: 700, align: "center", color: rgba(C.ink, 0.75) });
        /* PPO update arrow back to the Code agent */
        const pu = seg(t, 9400, 10000);
        if (pu > 0) {
          rr(ctx, O.x + 212, O.y + 34, 52, 18, 9); ctx.fillStyle = rgba(C.cyan, 0.2 * pu); ctx.fill();
          text(ctx, L.ppo, O.x + 238, O.y + 46.4, { size: 8, weight: 800, align: "center", color: "#9ff8ff", alpha: pu });
        }
      }
      ctx.restore();
    }
    /* ---------- secure pass and the numbers ---------- */
    const fp = seg(t, 10900, 11300);
    if (fp > 0) {
      ctx.save(); ctx.globalAlpha *= fp;
      panel(ctx, O.x, O.y, O.w, O.h, { r: 10, fill: "rgba(0,240,255,.06)", stroke: rgba(C.cyan, 0.6), glow: rgba(C.cyan, 0.6), blur: 12 });
      check(ctx, O.x + 20, O.y + 22, 14, C.cyan, seg(t, 11000, 11500));
      text(ctx, L.pass, O.x + 34, O.y + 21, { size: 11, weight: 900, color: "#9ff8ff", glow: rgba(C.cyan, 0.8) });
      text(ctx, L.passSub, O.x + 34, O.y + 34, { size: 8, weight: 600, color: rgba(C.ink, 0.75) });
      const np = ease.out(seg(t, 11600, 12600));
      const g2 = ctx.createLinearGradient(O.x + 12, 0, O.x + 120, 0); g2.addColorStop(0, C.cyan); g2.addColorStop(1, C.purple);
      font(ctx, 26, 900); ctx.fillStyle = g2; ctx.textAlign = "left"; ctx.shadowColor = rgba(C.cyan, 0.8); ctx.shadowBlur = 12;
      ctx.fillText((89.3 * np).toFixed(1) + "%", O.x + 12, O.y + 70); ctx.shadowBlur = 0;
      text(ctx, L.sp, O.x + 12, O.y + 84, { size: 7.6, weight: 700, color: rgba(C.ink, 0.78), max: 122 });
      /* vulnerability rate: 42.5 % → about 10 % after two rounds */
      const cx0 = O.x + 150, cx1 = O.x + 258, cy0 = O.y + 50, cy1 = O.y + 78, k = ease.inOut(seg(t, 12000, 13000));
      text(ctx, L.vr, cx0, O.y + 44, { size: 7.4, weight: 700, color: rgba(C.ink, 0.7), max: cx1 - cx0 + 6 });
      const y0 = lerp(cy1, cy0, 42.5 / 45), y1 = lerp(cy1, cy0, 10 / 45);
      ctx.strokeStyle = C.magenta; ctx.lineWidth = 2; ctx.shadowColor = C.magenta; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(cx0 + 4, y0); ctx.lineTo(lerp(cx0 + 4, cx1 - 6, k), lerp(y0, y1, k)); ctx.stroke(); ctx.shadowBlur = 0;
      dot(ctx, cx0 + 4, y0, 2.6, C.magenta); text(ctx, "42.5%", cx0 + 10, y0 + 3, { size: 7.6, weight: 800, color: "#ff9ccd" });
      if (k > 0.98) { dot(ctx, cx1 - 6, y1, 2.6, C.cyan); text(ctx, "≈10%", cx1 - 10, y1 - 5, { size: 7.6, weight: 800, align: "right", color: "#9ff8ff" }); text(ctx, L.vrAfter, cx1 - 6, cy1 + 9, { size: 6.8, align: "right", color: rgba(C.ink, 0.6) }); }
      ctx.restore();
    }
    ctx.restore();
  },
};
