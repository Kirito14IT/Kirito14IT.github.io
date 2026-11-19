/* SafeCodeRL: the paper's Figure 2 on its own cream ground. A code artifact travels the five-agent closed loop;
   the hard shield deflects dangerous actions before the sandbox; the soft constraint raises the Lagrange multiplier
   while the security cost exceeds δ; the secure artifact closes with the reported numbers. */
import { clamp, lerp, seg, ease, rr, box, text, font, dot, check, cross, arrow } from "../engine.js";

const W = 480, H = 340;
const C = { bg: "#fbf7ec", panel: "#fffdf7", line: "#d8cfb8", title: "#3a3a33", blue: "#3d6aa8", green: "#4e8a4a", red: "#b93a32", orange: "#c77d2a", ink: "#2f3a45", soft: "#6b6b60" };
const LOOP = { x: 124, y: 158, r: 72 };
const NODES = [
  { a: -90, en: ["Planner", "Task DAG / JSON plan"], zh: ["规划", "任务 DAG / JSON 计划"] },
  { a: -18, en: ["Code", "Generate / edit / AST patch"], zh: ["代码", "生成 / 编辑 / AST 补丁"] },
  { a: 54, en: ["Security", "Static + role audit"], zh: ["安全", "静态 + 角色审计"] },
  { a: 126, en: ["Test", "Docker sandbox"], zh: ["测试", "Docker 沙箱"] },
  { a: 198, en: ["Critic", "Reward / routing / update"], zh: ["评审", "奖励 / 路由 / 更新"] },
];
const ACTIONS = [
  { s: "os.system(cmd)", bad: true }, { s: "parameterized query", bad: false }, { s: "SQL concat", bad: true },
  { s: "unsafe path", bad: true }, { s: "bounded read", bad: false }, { s: "shell=True", bad: true },
];
const T = {
  en: { loop: "Five-Agent Closed Loop", refine: "Iterative refinement", shield: "Hard Shield", filter: "Shield filter", danger: "Dangerous action", sandbox: "Sandbox execution", blocked: "blocked", opt: "Constraint-Aware Optimization", viol: "λ ↑ if violations", out: "Secure Output Artifact", checks: ["Tests passed", "High-risk vulns ↓", "Functionality preserved"], sp: "Secure Pass@1 on 25 IoT/CPS tasks", sh: "actions blocked by the shield", shd: "SQL injection 660 · path traversal 440 · command injection 320", vr: "vulnerability rate 42.5% → ≈10% after two rounds (Llama-3-8B)" },
  zh: { loop: "五智能体闭环", refine: "迭代优化", shield: "硬屏蔽", filter: "屏蔽过滤器", danger: "危险动作", sandbox: "沙箱执行", blocked: "已拦截", opt: "约束感知优化", viol: "违规时 λ ↑", out: "安全输出产物", checks: ["测试通过", "高危漏洞 ↓", "功能保持"], sp: "25 个 IoT/CPS 任务的 Secure Pass@1", sh: "个动作被屏蔽拦截", shd: "SQL 注入 660 · 路径穿越 440 · 命令注入 320", vr: "漏洞率 42.5% → 两轮后约 10%（Llama-3-8B）" },
};
const npos = (i) => { const a = (NODES[i].a * Math.PI) / 180; return [LOOP.x + LOOP.r * Math.cos(a), LOOP.y + LOOP.r * Math.sin(a)]; };

function panel(ctx, x, y, w, h, title, glow) {
  box(ctx, x, y, w, h, { r: 5, fill: C.panel, stroke: glow > 0 ? `rgba(61,106,168,${0.35 + 0.6 * glow})` : C.line, lw: glow > 0 ? 1.6 : 1 });
  text(ctx, title, x + w / 2, y + 16, { size: 11.4, weight: 700, serif: true, align: "center", color: C.title });
}
function glyph(ctx, i, x, y, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.3; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  if (i === 0) { [-3.5, 0, 3.5].forEach((yy) => { ctx.moveTo(-4.5, yy); ctx.lineTo(-3.5, yy); ctx.moveTo(-1.5, yy); ctx.lineTo(5, yy); }); }
  if (i === 1) { ctx.moveTo(-2.5, -3.5); ctx.lineTo(-5.5, 0); ctx.lineTo(-2.5, 3.5); ctx.moveTo(2.5, -3.5); ctx.lineTo(5.5, 0); ctx.lineTo(2.5, 3.5); }
  if (i === 2) { ctx.moveTo(0, -5.5); ctx.lineTo(4.6, -3.4); ctx.lineTo(4.2, 1); ctx.quadraticCurveTo(3.2, 4.2, 0, 5.8); ctx.quadraticCurveTo(-3.2, 4.2, -4.2, 1); ctx.lineTo(-4.6, -3.4); ctx.closePath(); }
  if (i === 3) { ctx.moveTo(-5.5, 1); ctx.lineTo(5.5, 1); ctx.quadraticCurveTo(5, 5, 0, 5.2); ctx.quadraticCurveTo(-5, 5, -5.5, 1); [-3.5, 0, 3.5].forEach((xx) => { ctx.rect(xx - 1.3, -2.6, 2.6, 2.6); }); }
  if (i === 4) { ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.moveTo(-5, -2.5); ctx.lineTo(5, -2.5); ctx.moveTo(-5, -2.5); ctx.lineTo(-6.5, 1.5); ctx.lineTo(-3.5, 1.5); ctx.closePath(); ctx.moveTo(5, -2.5); ctx.lineTo(3.5, 1.5); ctx.lineTo(6.5, 1.5); ctx.closePath(); ctx.moveTo(-2.5, 5); ctx.lineTo(2.5, 5); }
  ctx.stroke(); ctx.restore();
}

export default {
  id: "safecoderl",
  size: [W, H],
  bg: C.bg,
  duration: 17200,
  poster: 16000,
  draw(ctx, t, state, stage) {
    const zh = stage.lang === "zh", L = T[zh ? "zh" : "en"];
    /* ---------- five-agent closed loop ---------- */
    const loopGlow = seg(t, 6900, 7300) * (1 - seg(t, 12300, 12700));
    panel(ctx, 8, 36, 232, 226, L.loop, loopGlow);
    const lp = ease.out(seg(t, 200, 1400));
    ctx.save();
    ctx.strokeStyle = "rgba(61,106,168,.5)"; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(LOOP.x, LOOP.y, LOOP.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lp); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    text(ctx, L.refine, LOOP.x, LOOP.y + 4, { size: 9.6, serif: true, italic: true, align: "center", color: C.soft, alpha: seg(t, 2200, 2800) });
    /* the artifact travelling the loop: one slow lap, then a faster refinement lap */
    let tok = null;
    if (t > 2400 && t < 12600) {
      const a = t < 3200 ? seg(t, 2400, 3200) * 0.2 : t < 7000 ? 0.2 : t < 10400 ? 0.2 + 0.8 * seg(t, 7000, 10400) : 1 + seg(t, 10400, 12400);
      const ang = -Math.PI / 2 + a * Math.PI * 2;
      tok = [LOOP.x + LOOP.r * Math.cos(ang), LOOP.y + LOOP.r * Math.sin(ang)];
    }
    NODES.forEach((n, i) => {
      const [x, y] = npos(i), p = ease.spring(seg(t, 150 + i * 150, 750 + i * 150));
      if (p <= 0) return;
      const near = tok ? Math.max(0, 1 - Math.hypot(tok[0] - x, tok[1] - y) / 30) : 0;
      const sec = i === 2 && t > 7600 && t < 9200;
      ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
      box(ctx, -38, -17, 76, 34, { r: 5, fill: "#fff", stroke: sec ? C.red : near > 0 ? C.blue : C.line, lw: near > 0 || sec ? 1.6 : 1 });
      dot(ctx, -28, -7, 6, sec ? C.red : C.blue);
      text(ctx, String(i + 1), -28, -4.2, { size: 7.6, weight: 700, align: "center", color: "#fff" });
      glyph(ctx, i, 30, -6, C.blue);
      const nm = zh ? n.zh : n.en;
      text(ctx, nm[0] + (zh ? "智能体" : " Agent"), -19, -4, { size: 8.4, weight: 700, serif: true, color: C.title, max: 38 });
      text(ctx, nm[1], 0, 11, { size: 6.4, align: "center", color: C.soft, max: 72 });
      ctx.restore();
    });
    if (tok) { dot(ctx, tok[0], tok[1], 5.2, "#fff"); ctx.strokeStyle = C.blue; ctx.lineWidth = 1.4; rr(ctx, tok[0] - 3.4, tok[1] - 4.2, 6.8, 8.4, 1); ctx.stroke(); }
    /* CWE findings at the Security agent */
    ["CWE-89", "CWE-22", "CWE-78"].forEach((c, i) => {
      const p = ease.spring(seg(t, 7700 + i * 220, 8300 + i * 220)) * (1 - seg(t, 10200, 10600));
      if (p <= 0) return;
      const [x, y] = npos(2);
      ctx.save(); ctx.globalAlpha *= clamp(p * 2);
      box(ctx, x - 64 + i * 43, y + 21, 40, 12, { r: 6, fill: "#fbe9e7", stroke: C.red, lw: 0.9 });
      text(ctx, c, x - 44 + i * 43, y + 29.6, { size: 6.8, weight: 700, mono: true, align: "center", color: C.red });
      ctx.restore();
    });
    text(ctx, "R_total = R_func + λ_sec · R_sec", LOOP.x, 255, { size: 8.8, serif: true, italic: true, align: "center", color: C.title, alpha: seg(t, 9000, 9600) });
    /* ---------- hard shield ---------- */
    const sg = seg(t, 3100, 3400) * (1 - seg(t, 7000, 7400));
    panel(ctx, 248, 36, 224, 126, L.shield, sg);
    const SX = 362, SY = 104;
    ctx.save(); ctx.translate(SX, SY);
    ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(16, -13); ctx.lineTo(15, 3); ctx.quadraticCurveTo(12, 15, 0, 22); ctx.quadraticCurveTo(-12, 15, -15, 3); ctx.lineTo(-16, -13); ctx.closePath();
    ctx.fillStyle = "#e3ecf7"; ctx.fill(); ctx.strokeStyle = C.blue; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
    text(ctx, L.filter, SX, SY + 4, { size: 7.2, weight: 700, align: "center", color: C.blue, max: 30 });
    /* sandbox and the reject bin */
    box(ctx, 418, 66, 48, 30, { r: 4, fill: "#eef5ec", stroke: C.green });
    ctx.strokeStyle = C.green; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(426, 84); ctx.quadraticCurveTo(442, 92, 458, 80); ctx.stroke();
    [0, 1, 2].forEach((k) => box(ctx, 430 + k * 7, 73, 6, 5, { r: 1, fill: C.green }));
    text(ctx, L.sandbox, 442, 106, { size: 6.8, weight: 700, align: "center", color: C.green, max: 56 });
    box(ctx, 418, 120, 48, 24, { r: 4, fill: "#fbe9e7", stroke: C.red });
    cross(ctx, 442, 129, 9, C.red, 1);
    text(ctx, L.danger, 442, 141, { size: 6.4, weight: 700, align: "center", color: C.red, max: 46 });
    let blocked = 0;
    ACTIONS.forEach((a, i) => {
      const t0 = 3300 + i * 600, p = seg(t, t0, t0 + 900);
      if (p <= 0 || p >= 1) { if (p >= 1 && a.bad) blocked++; return; }
      let x, y;
      if (p < 0.5) { const k = ease.inOut(p / 0.5); x = lerp(258, SX - 50, k); y = lerp(70 + (i % 3) * 22, SY - 6, k); }
      else { const k = ease.inOut((p - 0.5) / 0.5); x = lerp(SX - 50, 400, k); y = a.bad ? lerp(SY - 6, 126, k) + Math.sin(k * Math.PI) * -10 : lerp(SY - 6, 76, k); }
      ctx.save(); ctx.globalAlpha *= clamp((1 - p) * 6);
      font(ctx, 7.4, 500, "mono"); const w = ctx.measureText(a.s).width + 10;
      box(ctx, x - w / 2, y - 7, w, 14, { r: 3, fill: p > 0.5 ? (a.bad ? "#fbe9e7" : "#eef5ec") : "#fff", stroke: p > 0.5 ? (a.bad ? C.red : C.green) : C.line });
      text(ctx, a.s, x, y + 2.8, { size: 7.4, mono: true, align: "center", color: p > 0.5 ? (a.bad ? C.red : C.green) : C.ink });
      ctx.restore();
      if (p >= 0.5 && a.bad) blocked += 0;
    });
    text(ctx, blocked + " " + L.blocked, 258, 152, { size: 8, weight: 700, color: C.red, alpha: seg(t, 3600, 4000) });
    /* ---------- constraint-aware optimization ---------- */
    const og = seg(t, 8800, 9200) * (1 - seg(t, 12300, 12700));
    panel(ctx, 248, 170, 224, 92, L.opt, og);
    text(ctx, "max R_func   s.t.   E[C_sec] ≤ δ", 360, 202, { size: 10.6, serif: true, italic: true, align: "center", color: C.title });
    ["PPO", "GAE", "Lagrange λ"].forEach((s, i) => { font(ctx, 7.6, 700); const w = ctx.measureText(s).width + 12, x = 262 + [0, 34, 68][i]; box(ctx, x, 210, w, 13, { r: 3, fill: "#fff", stroke: C.line }); text(ctx, s, x + w / 2, 219.4, { size: 7.6, weight: 700, align: "center", color: C.blue }); });
    /* the security cost against its budget δ, and λ responding */
    const viol = seg(t, 8800, 9600) * (1 - seg(t, 10600, 11800));
    const cost = 0.32 + 0.48 * viol, del = 0.5, bx = 262, bw = 140, by = 236;
    box(ctx, bx, by, bw, 7, { r: 3.5, fill: "#efe8d6" });
    box(ctx, bx, by, bw * cost, 7, { r: 3.5, fill: cost > del ? C.red : C.green });
    ctx.strokeStyle = C.title; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bx + bw * del, by - 4); ctx.lineTo(bx + bw * del, by + 11); ctx.stroke();
    text(ctx, "δ", bx + bw * del + 3, by - 1, { size: 8, serif: true, italic: true, color: C.title });
    text(ctx, "E[C_sec]", bx, by + 18, { size: 7, serif: true, italic: true, color: C.soft });
    const lam = 0.4 + 0.9 * ease.out(seg(t, 9000, 10600));
    text(ctx, "λ = " + lam.toFixed(2), 464, by + 6, { size: 9, weight: 700, mono: true, align: "right", color: C.orange });
    text(ctx, L.viol, 464, by + 18, { size: 7, align: "right", color: C.orange, alpha: viol });
    if (t > 10800 && t < 12800) text(ctx, L.vr, 360, 268, { size: 6.8, align: "center", color: C.soft, alpha: seg(t, 10800, 11200) * (1 - seg(t, 12400, 12800)) });
    /* ---------- secure output artifact ---------- */
    const fo = seg(t, 12600, 13000);
    box(ctx, 8, 270, 464, 62, { r: 5, fill: fo > 0 ? `rgba(238,245,236,${fo})` : C.panel, stroke: fo > 0 ? C.green : C.line, lw: fo > 0 ? 1.6 : 1 });
    text(ctx, L.out, 20, 285, { size: 11, weight: 700, serif: true, color: C.title });
    L.checks.forEach((s2, i) => {
      const k = seg(t, 12800 + i * 300, 13200 + i * 300), y = 298 + i * 11.5;
      if (k > 0) check(ctx, 25, y - 3, 8, C.green, k); else dot(ctx, 25, y - 3, 2.4, C.line);
      text(ctx, s2, 34, y, { size: 8, weight: 600, color: k > 0 ? C.green : C.soft, max: 150 });
    });
    const np = ease.out(seg(t, 13400, 14600)), na = seg(t, 13200, 13600);
    if (na > 0) {
      ctx.save(); ctx.globalAlpha *= na;
      text(ctx, (89.3 * np).toFixed(1) + "%", 196, 303, { size: 20, weight: 800, color: C.green });
      text(ctx, L.sp, 196, 316, { size: 7.4, color: C.soft, max: 120 });
      text(ctx, Math.round(1420 * np).toLocaleString("en-US"), 326, 300, { size: 13, weight: 800, color: C.red });
      text(ctx, L.sh, 326, 311, { size: 7.4, weight: 700, color: C.red, max: 140 });
      text(ctx, L.shd, 326, 322, { size: 6.2, color: C.soft, max: 140 });
      ctx.restore();
    }
    /* the loop hands the artifact to the shield and the optimizer */
    if (t > 3000 && t < 7200) arrow(ctx, 210, 128, 252, 104, C.blue, 1.2, 4, ease.out(seg(t, 3000, 3400)));
    if (t > 8800 && t < 12400) arrow(ctx, 196, 214, 252, 220, C.orange, 1.2, 4, ease.out(seg(t, 8800, 9200)));
  },
};
