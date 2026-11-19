/* Mangrove review (UNDP / UNV): the manuscript's carbon-dynamics figure as a living infographic.
   Columns as in the figure: climate stressors, the mangrove ecosystem, blue carbon pathways, mitigation outcomes.
   Numbers from the manuscript: 738.9 Mg C per ha with 76.5 % in soil; accretion about 2.0 mm a year in conserved
   stands against a 6.1 mm a year sea-level-rise threshold; coastal squeeze, nutrient loading, storm and heat stress. */
import { clamp, lerp, seg, ease, rr, box, text, font, wrap, dot, check, arrow, rand } from "../engine.js";

const W = 480, H = 270;
const IL = { x: 104, y: 56, w: 196, h: 194 };
const COLH = [["#2a9d8f", 8, 90], ["#1f6f50", 104, 196], ["#2b6cb0", 308, 84], ["#2f855a", 398, 76]];
const T = {
  en: {
    heads: ["Climate stressors", "Mangrove ecosystem", "Blue carbon pathways", "Mitigation outcomes"],
    st: ["Sea-level rise", "Coastal squeeze", "Nutrient loading", "Storm & heat stress"],
    pw: ["Soil–air CO₂ efflux", "Particulate organic carbon export", "Dissolved inorganic carbon export"],
    oc: ["Carbon storage & sequestration", "Coastal protection & resilience", "Monitoring & assessment", "Policy & sustainable management"],
    npp: "Net primary productivity (NPP)", bio: "Biomass carbon", sed: "Sediment carbon storage",
    stock: "738.9 Mg C per ha · 76.5% in soil", slr: "accretion ≈ 2.0 mm/yr · threshold 6.1 mm/yr", sq: "no room to migrate", ndc: "Count blue carbon in national NDCs",
    leg: ["Carbon input", "Carbon storage", "Carbon outputs"],
  },
  zh: {
    heads: ["气候压力", "红树林生态系统", "蓝碳通量", "减缓成效"],
    st: ["海平面上升", "海岸挤压", "养分负荷", "风暴与热胁迫"],
    pw: ["土壤–大气 CO₂ 排放", "颗粒有机碳输出", "溶解无机碳输出"],
    oc: ["碳储存与封存", "海岸防护与韧性", "监测与评估", "政策与可持续管理"],
    npp: "净初级生产力（NPP）", bio: "生物量碳", sed: "沉积物碳储存",
    stock: "每公顷 738.9 Mg 碳 · 76.5% 在土壤", slr: "淤积 ≈ 2.0 毫米/年 · 阈值 6.1 毫米/年", sq: "无处迁移", ndc: "把蓝碳纳入国家 NDC",
    leg: ["碳输入", "碳储存", "碳输出"],
  },
};
const ST_AT = [4200, 5500, 6800, 8100];
const OC_AT = [12200, 12900, 13600, 14300];

function glyph(ctx, kind, x, y, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.4; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  if (kind === "slr") { [2, 6].forEach((yy) => { ctx.moveTo(-7, yy); ctx.quadraticCurveTo(-3.5, yy - 3, 0, yy); ctx.quadraticCurveTo(3.5, yy + 3, 7, yy); }); ctx.moveTo(0, -1); ctx.lineTo(0, -8); ctx.moveTo(-3, -5); ctx.lineTo(0, -8); ctx.lineTo(3, -5); }
  if (kind === "sq") { ctx.rect(2, -7, 4, 14); ctx.moveTo(-8, 0); ctx.lineTo(-1, 0); ctx.moveTo(-4, -3); ctx.lineTo(-1, 0); ctx.lineTo(-4, 3); }
  if (kind === "nut") { ctx.moveTo(-8, -4); ctx.lineTo(1, -4); ctx.lineTo(1, -1); ctx.moveTo(-8, -1); ctx.lineTo(-2, -1); [[1, 3], [4, 6], [-2, 6]].forEach(([dx, dy]) => { ctx.moveTo(dx + 1.2, dy); ctx.arc(dx, dy, 1.2, 0, 6.2832); }); }
  if (kind === "storm") { ctx.moveTo(-7, 0); ctx.quadraticCurveTo(-8, -6, -2, -6); ctx.quadraticCurveTo(0, -10, 4, -6); ctx.quadraticCurveTo(9, -5, 7, 0); ctx.closePath(); ctx.moveTo(0, 1); ctx.lineTo(-2, 5); ctx.lineTo(1, 5); ctx.lineTo(-1, 9); }
  if (kind === "co2") { ctx.moveTo(-4, 6); ctx.lineTo(-4, -2); ctx.moveTo(-6, 0); ctx.lineTo(-4, -2); ctx.lineTo(-2, 0); ctx.moveTo(4, 6); ctx.lineTo(4, -2); ctx.moveTo(2, 0); ctx.lineTo(4, -2); ctx.lineTo(6, 0); ctx.moveTo(-6, -6); ctx.lineTo(6, -6); }
  if (kind === "poc") { [[-4, -3], [2, -4], [-1, 2], [5, 2], [-5, 4]].forEach(([dx, dy]) => { ctx.moveTo(dx + 1.8, dy); ctx.arc(dx, dy, 1.8, 0, 6.2832); }); }
  if (kind === "dic") { [[-5, -3], [0, -5], [5, -2], [-3, 3], [3, 4]].forEach(([dx, dy]) => { ctx.moveTo(dx + 1, dy); ctx.arc(dx, dy, 1, 0, 6.2832); }); ctx.moveTo(-7, 8); ctx.quadraticCurveTo(-3, 5, 0, 8); ctx.quadraticCurveTo(3, 11, 7, 8); }
  if (kind === "store") { ctx.moveTo(-8, 5); ctx.lineTo(8, 5); ctx.moveTo(0, 5); ctx.lineTo(0, -4); ctx.moveTo(0, -1); ctx.quadraticCurveTo(-6, -2, -6, -7); ctx.quadraticCurveTo(-1, -7, 0, -2); ctx.moveTo(0, -3); ctx.quadraticCurveTo(5, -4, 6, -8); ctx.quadraticCurveTo(1, -9, 0, -4); }
  if (kind === "prot") { ctx.moveTo(0, -7); ctx.lineTo(6, -4.5); ctx.lineTo(5.5, 1); ctx.quadraticCurveTo(4, 5, 0, 7); ctx.quadraticCurveTo(-4, 5, -5.5, 1); ctx.lineTo(-6, -4.5); ctx.closePath(); ctx.moveTo(-3.5, 0); ctx.quadraticCurveTo(-1.5, -2, 0, 0); ctx.quadraticCurveTo(1.5, 2, 3.5, 0); }
  if (kind === "mon") { ctx.moveTo(-7, 6); ctx.lineTo(7, 6); [[-5, 3], [-1, -1], [3, -4]].forEach(([dx, h]) => { ctx.moveTo(dx, 6); ctx.lineTo(dx, h); }); ctx.moveTo(-7, -2); ctx.lineTo(-2, -5); ctx.lineTo(1, -3); ctx.lineTo(7, -8); }
  if (kind === "pol") { ctx.moveTo(-8, -3); ctx.lineTo(0, -8); ctx.lineTo(8, -3); ctx.closePath(); [-5, -1.7, 1.7, 5].forEach((dx) => { ctx.moveTo(dx, -1); ctx.lineTo(dx, 5); }); ctx.moveTo(-8, 7); ctx.lineTo(8, 7); }
  ctx.stroke(); ctx.restore();
}
function badge(ctx, kind, x, y, col, on, label, lang) {
  const p = clamp(on);
  dot(ctx, x, y, 14, p > 0 ? col : "#ffffff");
  ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.2832); ctx.stroke();
  if (p > 0 && p < 1) { ctx.strokeStyle = col; ctx.globalAlpha = 1 - p; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 14 + 8 * p, 0, 6.2832); ctx.stroke(); ctx.globalAlpha = 1; }
  glyph(ctx, kind, x, y, p > 0 ? "#ffffff" : col);
  wrap(ctx, label, 74, 7, 600).slice(0, 2).forEach((ln, j) => text(ctx, ln, x, y + 24 + j * 8.4, { size: 7, weight: 600, align: "center", color: "#1f2933" }));
}
function tree(ctx, x, base, s, sway, tint) {
  ctx.save(); ctx.translate(x, base);
  ctx.strokeStyle = "#7a5a3c"; ctx.lineWidth = 1.4 * s;
  for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 1.4 * s, -16 * s); ctx.quadraticCurveTo(k * 6 * s, -12 * s, k * 9 * s, 2); ctx.stroke(); }
  ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(0, -14 * s); ctx.lineTo(sway, -40 * s); ctx.stroke();
  [[-12, -46, 14, "#2e7d32"], [10, -48, 13, "#388e3c"], [-2, -58, 15, "#43a047"], [-16, -56, 10, "#66bb6a"], [14, -60, 10, "#4caf50"]].forEach(([dx, dy, r, c]) => { ctx.fillStyle = tint || c; ctx.beginPath(); ctx.arc(dx * s + sway, dy * s, r * s, 0, 6.2832); ctx.fill(); });
  ctx.restore();
}

export default {
  id: "mangrove",
  size: [W, H],
  bg: "#ffffff",
  duration: 16000,
  poster: 15200,
  create() {
    const r = rand(9);
    return {
      grains: Array.from({ length: 70 }, (_, i) => ({ x: IL.x + 10 + r() * (IL.w - 20), y: 226 + r() * 20, at: 900 + i * 40 })),
      co2: Array.from({ length: 16 }, () => ({ x: IL.x + 30 + r() * 140, ph: r() })),
    };
  },
  draw(ctx, t, st, stage) {
    const zh = stage.lang === "zh", L = T[zh ? "zh" : "en"], s = t / 1000;
    /* column headers */
    COLH.forEach(([c, x, w], i) => {
      const p = ease.out(seg(t, 100 + i * 120, 600 + i * 120));
      ctx.save(); ctx.globalAlpha = p;
      box(ctx, x, 36, w, 15, { r: 7.5, fill: c });
      text(ctx, L.heads[i], x + w / 2, 46.4, { size: 8, weight: 700, align: "center", color: "#fff", max: w - 8 });
      ctx.restore();
    });
    /* ---------- illustration ---------- */
    ctx.save();
    rr(ctx, IL.x, IL.y, IL.w, IL.h, 8); ctx.clip();
    const sky = ctx.createLinearGradient(0, IL.y, 0, IL.y + 130);
    sky.addColorStop(0, "#dff1fb"); sky.addColorStop(1, "#f8fcff");
    ctx.fillStyle = sky; ctx.fillRect(IL.x, IL.y, IL.w, IL.h);
    /* sun and birds */
    const storm = seg(t, 8100, 8600) * (1 - seg(t, 12000, 12800));
    dot(ctx, IL.x + 26, IL.y + 22, 9, "#f9c74f", 1 - 0.6 * storm);
    ctx.strokeStyle = "rgba(249,199,79,.8)"; ctx.lineWidth = 1.2;
    for (let k = 0; k < 8; k++) { const a = k * 0.785 + s * 0.3; ctx.beginPath(); ctx.moveTo(IL.x + 26 + Math.cos(a) * 12, IL.y + 22 + Math.sin(a) * 12); ctx.lineTo(IL.x + 26 + Math.cos(a) * 15, IL.y + 22 + Math.sin(a) * 15); ctx.stroke(); }
    ctx.strokeStyle = "#5f6b7a"; ctx.lineWidth = 1;
    [0, 1, 2].forEach((k) => { const bx = IL.x + ((s * 14 + k * 60) % (IL.w + 30)) - 10, by = IL.y + 18 + k * 9; ctx.beginPath(); ctx.moveTo(bx - 4, by - 2); ctx.quadraticCurveTo(bx - 2, by - 3, bx, by); ctx.quadraticCurveTo(bx + 2, by - 3, bx + 4, by - 2); ctx.stroke(); });
    if (storm > 0) {
      ctx.globalAlpha = storm;
      ctx.fillStyle = "#9aa5b1"; [[150, 30, 16], [166, 24, 18], [184, 30, 15]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(IL.x + dx, IL.y + dy, r, 0, 6.2832); ctx.fill(); });
      ctx.strokeStyle = "#f9c74f"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(IL.x + 168, IL.y + 42); ctx.lineTo(IL.x + 162, IL.y + 54); ctx.lineTo(IL.x + 168, IL.y + 54); ctx.lineTo(IL.x + 161, IL.y + 68); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    /* water, rising during the sea-level-rise step */
    const rise = ease.inOut(seg(t, 4200, 5300)) * (1 - seg(t, 12000, 12800) * 0.6);
    const wy = IL.y + 140 - 10 * rise;
    const wg = ctx.createLinearGradient(0, wy, 0, IL.y + IL.h);
    wg.addColorStop(0, "#9ad3ec"); wg.addColorStop(1, "#4a9cc8");
    ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(IL.x, wy);
    for (let x = 0; x <= IL.w; x += 6) ctx.lineTo(IL.x + x, wy + Math.sin(x / 14 + s * 1.6) * 1.6);
    ctx.lineTo(IL.x + IL.w, IL.y + IL.h); ctx.lineTo(IL.x, IL.y + IL.h); ctx.closePath(); ctx.fill();
    /* sediment with stored carbon */
    const sg = ctx.createLinearGradient(0, IL.y + 166, 0, IL.y + IL.h);
    sg.addColorStop(0, "#8b6b4a"); sg.addColorStop(1, "#5d4630");
    ctx.fillStyle = sg; ctx.fillRect(IL.x, IL.y + 166, IL.w, IL.h - 166);
    st.grains.forEach((g) => { const a = seg(t, g.at, g.at + 300); if (a > 0) dot(ctx, g.x, g.y, 1.3, "#2b1d12", a * (1 - seg(t, 15600, 15950))); });
    /* trees */
    const cleared = 0;
    [[IL.x + 34, 0.62], [IL.x + 72, 1], [IL.x + 128, 1.06], [IL.x + 172, 0.7]].forEach(([x, k], i) => tree(ctx, x, IL.y + 168, k, Math.sin(s * 1.2 + i) * 1.4, cleared && i === 3 ? "#9e9e9e" : null));
    /* coastal squeeze: a seawall on the landward edge */
    const sq = seg(t, 5500, 6000) * (1 - seg(t, 12600, 13400) * 0.5);
    if (sq > 0) {
      ctx.globalAlpha = sq;
      ctx.fillStyle = "#8d99a6"; ctx.fillRect(IL.x + IL.w - 12, IL.y + 104, 12, 64);
      ctx.strokeStyle = "#d93025"; ctx.lineWidth = 1.4; ctx.setLineDash([3, 2]);
      ctx.beginPath(); ctx.moveTo(IL.x + 150, IL.y + 112); ctx.lineTo(IL.x + IL.w - 16, IL.y + 112); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(IL.x + IL.w - 22, IL.y + 106); ctx.lineTo(IL.x + IL.w - 16, IL.y + 112); ctx.lineTo(IL.x + IL.w - 22, IL.y + 118); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    /* nutrient loading from an outfall */
    const nl = seg(t, 6800, 7300) * (1 - seg(t, 12600, 13400));
    if (nl > 0) {
      ctx.fillStyle = `rgba(110,110,120,${nl})`; ctx.fillRect(IL.x + IL.w - 30, wy - 18, 30, 6);
      for (let k = 0; k < 14; k++) { const q = (s * 0.35 + k / 14) % 1; dot(ctx, IL.x + IL.w - 30 - q * 120, wy - 12 + q * 22 + Math.sin(k) * 3, 1.6, "#8e7cc3", nl * (1 - q)); }
    }
    /* carbon flows */
    const inA = seg(t, 300, 900) * (1 - seg(t, 15600, 15950));
    ctx.globalAlpha = inA;
    arrow(ctx, IL.x + 96, IL.y + 34, IL.x + 96, IL.y + 64, "#2e8b57", 2.4, 7, ease.out(seg(t, 400, 1200)));
    for (let k = 0; k < 6; k++) { const q = (s * 0.6 + k / 6) % 1; dot(ctx, IL.x + 96 + Math.sin(k * 2) * 6, IL.y + 30 + q * 120, 1.6, "#2e8b57", 0.8 * inA * (1 - q)); }
    arrow(ctx, IL.x + 100, IL.y + 128, IL.x + 100, IL.y + 160, "#6b4f35", 2.4, 7, ease.out(seg(t, 1400, 2200)));
    ctx.globalAlpha = 1;
    const outA = seg(t, 9200, 9800) * (1 - seg(t, 15600, 15950));
    if (outA > 0) {
      ctx.globalAlpha = outA;
      st.co2.forEach((c) => { const q = (s * 0.4 + c.ph) % 1; dot(ctx, c.x, IL.y + 166 - q * 70, 1.8, "#2b6cb0", 0.7 * (1 - q)); });
      ctx.globalAlpha = 1;
    }
    /* labels inside the illustration */
    const lab = (s0, x, y, fill, col, a) => { if (a <= 0) return; font(ctx, 7.4, 700); const w = ctx.measureText(s0).width + 12; ctx.save(); ctx.globalAlpha = a; box(ctx, x - w / 2, y - 9, w, 13, { r: 6.5, fill }); text(ctx, s0, x, y, { size: 7.4, weight: 700, align: "center", color: col }); ctx.restore(); };
    lab(L.npp, IL.x + 98, IL.y + 14 + 0, "rgba(255,255,255,.9)", "#1f6f50", seg(t, 500, 1000));
    lab(L.bio, IL.x + 100, IL.y + 122, "#1f6f50", "#fff", seg(t, 1000, 1500));
    lab(L.sed, IL.x + 100, IL.y + 182, "rgba(43,29,18,.85)", "#fff", seg(t, 1800, 2300));
    lab(L.stock, IL.x + 98, IL.y + IL.h - 8, "rgba(255,255,255,.92)", "#5d4630", seg(t, 2400, 2900) * (1 - seg(t, 4000, 4300)));
    lab(L.slr, IL.x + 98, IL.y + IL.h - 8, "rgba(255,255,255,.92)", "#1f5ea8", seg(t, 4300, 4700) * (1 - seg(t, 5400, 5700)));
    lab(L.sq, IL.x + 150, IL.y + 100, "rgba(255,255,255,.92)", "#d93025", seg(t, 5700, 6100) * (1 - seg(t, 6800, 7100)));
    lab(L.ndc, IL.x + 98, IL.y + 62, "rgba(47,133,90,.95)", "#fff", seg(t, 14600, 15000) * (1 - seg(t, 15700, 15950)));
    ctx.restore();
    box(ctx, IL.x, IL.y, IL.w, IL.h, { r: 8, stroke: "#c8d7cf", lw: 1 });
    /* ---------- columns of icons ---------- */
    const SK = ["slr", "sq", "nut", "storm"], OK = ["store", "prot", "mon", "pol"], PK = ["co2", "poc", "dic"];
    SK.forEach((k, i) => {
      const on = seg(t, ST_AT[i], ST_AT[i] + 400) * (1 - seg(t, 12000, 12600));
      badge(ctx, k, 52, 72 + i * 48, "#2a9d8f", on, L.st[i]);
      if (on > 0) arrow(ctx, 70, 72 + i * 48, IL.x - 4, 72 + i * 48 + (IL.y + 100 - (72 + i * 48)) * 0.3, `rgba(42,157,143,${on})`, 1.2, 4, ease.out(on));
    });
    PK.forEach((k, i) => {
      const on = seg(t, 9400 + i * 700, 9800 + i * 700) * (1 - seg(t, 15600, 15950));
      const y = 80 + i * 62;
      badge(ctx, k, 350, y, "#2b6cb0", on, L.pw[i]);
      if (on > 0) arrow(ctx, IL.x + IL.w + 2, y, 332, y, `rgba(43,108,176,${on})`, 1.4, 5, ease.out(on));
    });
    OK.forEach((k, i) => {
      const on = seg(t, OC_AT[i], OC_AT[i] + 400) * (1 - seg(t, 15600, 15950));
      badge(ctx, k, 436, 72 + i * 48, "#2f855a", on, L.oc[i]);
      if (on > 0.9) check(ctx, 450, 60 + i * 48, 7, "#2f855a", seg(t, OC_AT[i] + 300, OC_AT[i] + 600));
    });
    /* legend */
    const lg = seg(t, 600, 1200);
    ctx.save(); ctx.globalAlpha = lg;
    arrow(ctx, 112, 262, 130, 262, "#2e8b57", 1.6, 4, 1); text(ctx, L.leg[0], 134, 265, { size: 7, color: "#3e4c59" });
    font(ctx, 7, 400); const w1 = ctx.measureText(L.leg[0]).width;
    box(ctx, 146 + w1, 258, 14, 8, { r: 2, fill: "#5d4630" }); text(ctx, L.leg[1], 164 + w1, 265, { size: 7, color: "#3e4c59" });
    const w2 = ctx.measureText(L.leg[1]).width;
    arrow(ctx, 176 + w1 + w2, 262, 194 + w1 + w2, 262, "#2b6cb0", 1.6, 4, 1); text(ctx, L.leg[2], 198 + w1 + w2, 265, { size: 7, color: "#3e4c59" });
    ctx.restore();
  },
};
