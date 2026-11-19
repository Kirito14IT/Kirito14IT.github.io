/* Mangrove review (UNDP / UNV): blue carbon under two kinds of pressure, as a living coastal cross-section.
   Numbers from the manuscript: mean stock 738.9 Mg C per ha with 76.5 % in soil; accretion about 2.0 mm a year
   in conserved stands; survival unlikely once relative sea-level rise passes 6.1 mm a year; coastal squeeze,
   nutrient loading and clearing as local stressors; conservation, nutrient management and NDC accounting as responses. */
import { C, rgba, clamp, lerp, seg, ease, rr, panel, text, font, dot, rand } from "../engine.js";

const TREES = [140, 164, 190, 216, 240, 264, 288, 312].map((x, i) => ({ x, h: 46 + ((i * 37) % 17), w: 22 + ((i * 13) % 7) }));
const CLEARED = [5, 6];
const T = {
  en: {
    stock: "738.9 Mg C per ha", soil: "76.5% stored in soil", co2: "CO₂",
    slr: "Relative sea-level rise", acc: "accretion ≈ 2.0 mm/yr", thr: "threshold 6.1 mm/yr", drown: "drowning risk",
    squeeze: "coastal squeeze", wall: "seawall", np: "N, P loading", cleared: "clearing releases carbon",
    acts: ["Protect, leave room to migrate", "Manage nutrient loading", "Count blue carbon in NDCs"],
    area: "81,484 km² in 118 countries",
  },
  zh: {
    stock: "每公顷 738.9 Mg 碳", soil: "76.5% 储存在土壤中", co2: "CO₂",
    slr: "相对海平面上升", acc: "淤积 ≈ 2.0 毫米/年", thr: "阈值 6.1 毫米/年", drown: "淹没风险",
    squeeze: "海岸挤压", wall: "海堤", np: "氮、磷负荷", cleared: "砍伐释放碳",
    acts: ["保护并留出迁移空间", "管理养分负荷", "把蓝碳纳入 NDC"],
    area: "全球 81,484 km²，分布于 118 个国家",
  },
};

const ground = (x) => {
  if (x < 110) return 234 + 3 * Math.sin(x / 24);
  if (x < 330) { const p = (x - 110) / 220, s = p * p * (3 - 2 * p); return lerp(226, 178, s) + 2 * Math.sin(x / 17); }
  return 172;
};

export default {
  duration: 15400,
  poster: 14000,
  seed: 4.6,
  mood: [
    [0, { v: 0.75, c: 0.7, m: 0.05 }],
    [3800, { v: 0.8, c: 0.6, m: 0.1 }],
    [6600, { v: 0.6, c: 0.25, m: 0.8 }],
    [8400, { v: 0.7, c: 0.3, m: 0.6 }],
    [10200, { v: 0.6, c: 0.2, m: 0.85 }],
    [11800, { v: 0.75, c: 0.75, m: 0.15 }],
    [15400, { v: 0.75, c: 0.7, m: 0.05 }],
  ],
  steps: [
    { at: 0, label: { en: "Blue carbon", zh: "蓝碳" }, caption: { en: "Mangroves pull CO₂ into their canopy and lock most of the carbon in waterlogged soil.", zh: "红树林把 CO₂ 吸入树冠，并把大部分碳封存在浸水的土壤中。" } },
    { at: 3800, label: { en: "Sea-level rise", zh: "海平面上升" }, caption: { en: "Sediment accretion keeps them above water, until relative sea-level rise passes about 6.1 mm a year.", zh: "沉积淤积让它们不被淹没，直到相对海平面上升超过约 6.1 毫米/年。" } },
    { at: 7600, label: { en: "Local pressure", zh: "本地压力" }, caption: { en: "Seawalls block landward retreat; effluent, aquaculture and clearing change nutrients and release carbon.", zh: "海堤阻断向陆迁移；污水、养殖与砍伐改变养分并释放碳。" } },
    { at: 11400, label: { en: "Mitigation", zh: "应对" }, caption: { en: "The review's answer: conserve, manage nutrients, and bring local blue-carbon data into national plans (NDCs).", zh: "综述的结论：加强保护、管理养分，并把本地蓝碳数据纳入国家自主贡献（NDC）。" } },
  ],
  create() {
    const r = rand(5);
    const stored = Array.from({ length: 150 }, (_, i) => {
      const tr = TREES[i % TREES.length];
      return { x: tr.x + (r() - 0.5) * 34, d: 10 + r() * 50, at: 400 + i * 22 + r() * 300, tree: i % TREES.length };
    });
    const flow = Array.from({ length: 34 }, (_, i) => ({ tree: i % TREES.length, ph: r(), sx: r() * 480, sp: 0.8 + r() * 0.5 }));
    const nutr = Array.from({ length: 26 }, () => ({ ph: r(), y: r() * 6 }));
    const rel = Array.from({ length: 22 }, () => ({ ph: r(), x: (r() - 0.5) * 40 }));
    return { stored, flow, nutr, rel };
  },
  draw(ctx, t, st, stage) {
    const L = T[stage.lang] || T.en;
    const s = t / 1000;
    const slr = ease.inOut(seg(t, 4200, 7000));
    const sea = 198 - 12 * slr - 6 * seg(t, 11600, 14000) * 0;
    const clear = seg(t, 9200, 10000) * (1 - seg(t, 12200, 13600));
    const regrow = seg(t, 12400, 13800);
    /* ---------- ground and soil ---------- */
    ctx.beginPath(); ctx.moveTo(0, 300);
    for (let x = 0; x <= 480; x += 6) ctx.lineTo(x, ground(x));
    ctx.lineTo(480, 300); ctx.closePath();
    const sg = ctx.createLinearGradient(0, 170, 0, 300);
    sg.addColorStop(0, "#1b1140"); sg.addColorStop(1, "#08041a");
    ctx.fillStyle = sg; ctx.fill();
    ctx.strokeStyle = rgba(C.purple, 0.55); ctx.lineWidth = 1.2; ctx.beginPath();
    for (let x = 0; x <= 480; x += 6) (x ? ctx.lineTo(x, ground(x)) : ctx.moveTo(x, ground(x))); ctx.stroke();
    /* strata */
    [14, 30, 50].forEach((d, k) => {
      ctx.strokeStyle = rgba(C.violet, 0.28 - k * 0.06); ctx.lineWidth = 1; ctx.beginPath();
      for (let x = 0; x <= 480; x += 8) { const y = ground(x) + d + Math.sin(x / 31 + k) * 2; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    });
    /* accretion: a fresh sediment layer grows under the forest while the sea rises */
    const acc = seg(t, 4400, 7200) * (1 - seg(t, 14800, 15300));
    if (acc > 0) {
      ctx.fillStyle = rgba(C.cyan, 0.16 * acc); ctx.beginPath();
      for (let x = 118; x <= 330; x += 6) { const y = ground(x) - 3 * acc; x === 118 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      for (let x = 330; x >= 118; x -= 6) ctx.lineTo(x, ground(x)); ctx.closePath(); ctx.fill();
    }
    /* stored carbon: glowing grains that accumulate in the soil */
    st.stored.forEach((p) => {
      const a = seg(t, p.at, p.at + 400);
      if (a <= 0) return;
      const lost = CLEARED.includes(p.tree) ? clear : 0;
      const y = ground(p.x) + p.d;
      dot(ctx, p.x, y - lost * 30 * p.d / 60, 1.2, lost > 0.2 ? C.magenta : C.cyan, a * (0.7 - 0.3 * lost) * (1 - seg(t, 15000, 15350)), 3);
    });
    /* ---------- sea ---------- */
    let shore = 0;
    for (let x = 0; x < 330; x += 2) if (ground(x) < sea) { shore = x; break; }
    ctx.beginPath(); ctx.moveTo(0, sea);
    for (let x = 0; x <= shore; x += 4) ctx.lineTo(x, sea + Math.sin(x / 16 + s * 1.8) * 1.6 + Math.sin(x / 7 - s * 2.6) * 0.6);
    for (let x = shore; x >= 0; x -= 4) ctx.lineTo(x, ground(x));
    ctx.closePath();
    const wg = ctx.createLinearGradient(0, sea, 0, 240);
    wg.addColorStop(0, rgba(C.cyan, 0.32)); wg.addColorStop(0.35, rgba(C.blue, 0.22)); wg.addColorStop(1, rgba(C.violet, 0.08));
    ctx.fillStyle = wg; ctx.fill();
    ctx.strokeStyle = rgba(C.cyan, 0.75); ctx.lineWidth = 1.1; ctx.shadowColor = C.cyan; ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let x = 0; x <= shore; x += 4) { const y = sea + Math.sin(x / 16 + s * 1.8) * 1.6 + Math.sin(x / 7 - s * 2.6) * 0.6; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.shadowBlur = 0;
    /* ---------- land: seawall and town ---------- */
    ctx.fillStyle = "#140c34"; ctx.strokeStyle = rgba(C.purple, 0.6); ctx.lineWidth = 1;
    rr(ctx, 336, 142, 10, 31, 2); ctx.fill(); ctx.stroke();
    [[356, 128, 22], [382, 112, 18], [404, 136, 26], [434, 120, 20], [458, 132, 18]].forEach(([x, y, w], i) => {
      ctx.fillStyle = "#120a2e"; ctx.fillRect(x, y, w, 172 - y);
      ctx.strokeStyle = rgba(C.purple, 0.35); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 172 - y - 1);
      for (let wy = y + 6; wy < 166; wy += 9) for (let wx = x + 4; wx < x + w - 3; wx += 7) { const on = ((wx * 7 + wy * 3 + i) % 5) < 2; if (on) { ctx.fillStyle = rgba(C.cyan, 0.4 + 0.2 * Math.sin(s + wx)); ctx.fillRect(wx, wy, 2, 2.4); } }
    });
    text(ctx, L.wall, 341, 136, { size: 7.4, weight: 700, align: "center", color: rgba(C.ink, 0.55) });
    /* ---------- trees ---------- */
    TREES.forEach((tr, i) => {
      const gy = ground(tr.x), cleared = CLEARED.includes(i);
      const alive = cleared ? 1 - clear + regrow * clear : 1;
      const grow = cleared && regrow > 0 && clear > 0 ? 0.4 + 0.6 * regrow : 1;
      const drown = i < 2 ? seg(t, 6000, 6800) * (1 - seg(t, 11600, 12600)) : 0;
      if (alive <= 0.02) return;
      ctx.save(); ctx.globalAlpha = alive;
      const sway = Math.sin(s * 1.3 + i) * 1.2;
      const top = gy - tr.h * grow;
      /* prop roots */
      ctx.strokeStyle = drown > 0.3 ? rgba(C.magenta, 0.7) : rgba(C.pink, 0.55); ctx.lineWidth = 1;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(tr.x + k * 1.2, gy - 14 * grow); ctx.quadraticCurveTo(tr.x + k * 6, gy - 10 * grow, tr.x + k * 8, gy + 1); ctx.stroke(); }
      ctx.strokeStyle = rgba(C.ink, 0.55); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(tr.x, gy - 12 * grow); ctx.quadraticCurveTo(tr.x + sway, (gy + top) / 2, tr.x + sway, top + 8); ctx.stroke();
      /* canopy */
      [[-0.6, 0.0, 0.62], [0.55, 0.12, 0.56], [0.02, -0.32, 0.6]].forEach(([dx, dy, r]) => {
        const cx = tr.x + sway + dx * tr.w * grow, cy = top + 8 + dy * tr.w * grow, rad = r * tr.w * grow;
        const g = ctx.createRadialGradient(cx, cy - rad * 0.3, rad * 0.1, cx, cy, rad);
        const col = drown > 0.3 ? C.magenta : C.cyan;
        g.addColorStop(0, rgba(col, 0.55)); g.addColorStop(0.6, rgba(drown > 0.3 ? C.pink : "#1fb6a8", 0.38)); g.addColorStop(1, rgba(C.violet, 0.05));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * 0.78, 0, 0, 6.2832); ctx.fill();
      });
      ctx.restore();
    });
    /* seedlings reaching for the land, stopped by the seawall */
    const mig = seg(t, 7800, 9000);
    if (mig > 0) {
      [320, 328].forEach((x, k) => {
        const p = ease.spring(seg(t, 7800 + k * 300, 8600 + k * 300));
        const gy = ground(x);
        ctx.strokeStyle = rgba(C.cyan, 0.8 * p); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - 10 * p); ctx.stroke();
        dot(ctx, x, gy - 11 * p, 3 * p, "#1fb6a8", 0.9 * p);
      });
      const sq = seg(t, 8600, 9200) * (1 - seg(t, 11800, 12600));
      if (sq > 0) {
        ctx.save(); ctx.globalAlpha = sq;
        ctx.strokeStyle = C.magenta; ctx.lineWidth = 1.6; ctx.shadowColor = C.magenta; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(316, 150); ctx.lineTo(333, 150); ctx.lineTo(333, 172); ctx.moveTo(330, 114); ctx.lineTo(330, 148); ctx.stroke(); ctx.shadowBlur = 0;
        panel(ctx, 287, 96, 86, 18, { r: 9, fill: rgba(C.magenta, 0.2), stroke: rgba(C.magenta, 0.8) });
        text(ctx, L.squeeze, 330, 108.4, { size: 8.4, weight: 800, align: "center", color: "#ff9ccd" });
        ctx.restore();
      }
    }
    /* ---------- CO₂ into the canopy and down into the soil ---------- */
    const flowOn = 1 - seg(t, 3600, 4200) + seg(t, 11800, 12600) * 1;
    if (flowOn > 0.02) st.flow.forEach((f) => {
      const tr = TREES[f.tree];
      if (CLEARED.includes(f.tree) && clear > 0.3) return;
      const q = (s * 0.32 * f.sp + f.ph) % 1;
      let x, y, col = C.cyan;
      const gy = ground(tr.x), top = gy - tr.h;
      if (q < 0.5) { const k = ease.inOut(q / 0.5); x = lerp(f.sx, tr.x, k); y = lerp(52, top + 8, k); }
      else { const k = (q - 0.5) / 0.5; x = tr.x + Math.sin(k * 6) * 2; y = lerp(top + 8, gy + 30, k); col = "#7ff7e8"; }
      dot(ctx, x, y, 1.4, col, clamp(flowOn) * 0.9, 3);
    });
    if (seg(t, 600, 1100) * (1 - seg(t, 3600, 4000)) > 0) {
      const a = seg(t, 600, 1100) * (1 - seg(t, 3600, 4000));
      ctx.save(); ctx.globalAlpha = a;
      text(ctx, L.co2, 70, 70, { size: 12, weight: 800, color: "#9ff8ff", glow: rgba(C.cyan, 0.8) });
      text(ctx, L.co2, 214, 58, { size: 10, weight: 800, color: "#9ff8ff", glow: rgba(C.cyan, 0.8), alpha: 0.75 });
      panel(ctx, 352, 186, 116, 40, { r: 9, fill: "rgba(7,3,26,.74)", stroke: rgba(C.cyan, 0.55) });
      text(ctx, L.stock, 360, 202, { size: 9.6, weight: 800, color: "#9ff8ff", max: 102 });
      text(ctx, L.soil, 360, 217, { size: 8.6, weight: 600, color: rgba(C.ink, 0.8), max: 102 });
      ctx.restore();
    }
    /* ---------- sea-level gauge ---------- */
    const ga = seg(t, 3900, 4300) * (1 - seg(t, 7500, 7900));
    if (ga > 0) {
      ctx.save(); ctx.globalAlpha = ga;
      const G = { x: 14, y: 44, w: 196, h: 56 };
      panel(ctx, G.x, G.y, G.w, G.h, { r: 9, fill: "rgba(7,3,26,.76)" });
      text(ctx, L.slr, G.x + 10, G.y + 14, { size: 8.8, weight: 800 });
      const bx0 = G.x + 10, bx1 = G.x + G.w - 12, by = G.y + 26, mm = (v) => lerp(bx0, bx1, v / 8);
      rr(ctx, bx0, by, bx1 - bx0, 6, 3); ctx.fillStyle = "rgba(247,244,255,.1)"; ctx.fill();
      const rate = lerp(1, 7.2, slr);
      const gr = ctx.createLinearGradient(bx0, 0, bx1, 0); gr.addColorStop(0, C.cyan); gr.addColorStop(0.7, C.purple); gr.addColorStop(1, C.magenta);
      rr(ctx, bx0, by, mm(rate) - bx0, 6, 3); ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(mm(2), by - 3); ctx.lineTo(mm(2), by + 9); ctx.stroke();
      ctx.strokeStyle = C.magenta; ctx.beginPath(); ctx.moveTo(mm(6.1), by - 3); ctx.lineTo(mm(6.1), by + 9); ctx.stroke();
      text(ctx, L.acc, bx0, by + 21, { size: 7.4, weight: 700, color: "#9ff8ff" });
      text(ctx, L.thr, bx1, by + 21, { size: 7.4, weight: 700, align: "right", color: "#ff9ccd" });
      const over = seg(t, 6000, 6400);
      if (over > 0) { panel(ctx, 66, 150, 70, 18, { r: 9, fill: rgba(C.magenta, 0.22 * over), stroke: rgba(C.magenta, 0.85 * over) }); text(ctx, L.drown, 101, 162.4, { size: 8, weight: 800, align: "center", color: "#ff9ccd", alpha: over }); }
      ctx.restore();
    }
    /* ---------- local stressors: nutrients from the town, carbon from clearing ---------- */
    const ns = seg(t, 7800, 8400) * (1 - seg(t, 11800, 12600));
    if (ns > 0) {
      st.nutr.forEach((n) => {
        const q = (s * 0.18 + n.ph) % 1, x = lerp(352, 200, q), y = ground(x) - 4 - n.y;
        dot(ctx, x, y, 1.4, C.purple, ns * 0.9, 3);
      });
      ctx.save(); ctx.globalAlpha = ns;
      panel(ctx, 352, 186, 92, 18, { r: 9, fill: rgba(C.purple, 0.24), stroke: rgba(C.purple, 0.8) });
      text(ctx, L.np, 398, 198.4, { size: 8.2, weight: 800, align: "center", color: "#e4d2ff" });
      ctx.restore();
    }
    if (clear > 0) {
      const cx = (TREES[5].x + TREES[6].x) / 2;
      st.rel.forEach((p) => {
        const q = (s * 0.4 + p.ph) % 1, y = lerp(ground(cx) + 10, 70, q);
        dot(ctx, cx + p.x + Math.sin(q * 9) * 4, y, 1.5, C.magenta, clear * (1 - q) * (1 - regrow), 3);
      });
      ctx.save(); ctx.globalAlpha = clear * (1 - regrow);
      panel(ctx, cx - 92, 70, 124, 18, { r: 9, fill: rgba(C.magenta, 0.2), stroke: rgba(C.magenta, 0.8) });
      text(ctx, L.cleared, cx - 30, 82.4, { size: 8.2, weight: 800, align: "center", color: "#ff9ccd", max: 116 });
      ctx.restore();
    }
    /* ---------- responses ---------- */
    const ra = seg(t, 11800, 12200) * (1 - seg(t, 14800, 15200));
    if (ra > 0) {
      L.acts.forEach((a, i) => {
        const p = ease.spring(seg(t, 11900 + i * 320, 12700 + i * 320));
        if (p <= 0) return;
        font(ctx, 9, 800);
        const w = ctx.measureText(a).width + 26, x = 14, y = 44 + i * 26;
        ctx.save(); ctx.globalAlpha = ra * clamp(p * 2); ctx.translate(-(1 - p) * 20, 0);
        panel(ctx, x, y, w, 20, { r: 10, fill: rgba(C.cyan, 0.14), stroke: rgba(C.cyan, 0.75), glow: rgba(C.cyan, 0.7), blur: 10 });
        dot(ctx, x + 11, y + 10, 3, C.cyan, 1, 2.4);
        text(ctx, a, x + 20, y + 13.6, { size: 9, weight: 800, color: "#c9fbff" });
        ctx.restore();
      });
      const fa = seg(t, 13200, 13800) * (1 - seg(t, 14800, 15200));
      if (fa > 0) text(ctx, L.area, 466, 56, { size: 9.2, weight: 700, align: "right", color: rgba(C.ink, 0.75 * fa) });
    }
  },
};
