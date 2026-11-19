/* ScamWeb (AAAI 2027): the sample webpage of the paper's Figure 2 run through ScamDet.
   Inputs x = (I, U, T, S); analysis modules A_u, A_t, A_v, A_c with the findings listed in the figure;
   the cascade predicts the label, the subtype (Online Shopping, one of 25), the evidence boxes and their rationales. */
import { C, rgba, clamp, lerp, seg, ease, rr, panel, text, typed, wrap, brackets, check, font } from "../engine.js";

const URL_TEXT = "http://www.feworiesad.shop";
const URL_HOST = "feworiesad.shop";
const WIN = { x: 12, y: 12, w: 272, h: 276 };
const RP = { x: 268, y: 38, w: 200, h: 250 };
/* the page is drawn in its own frame, scaled to leave the top strip to the card badge */
const PK = 0.9, POX = 1.2, POY = 25.2;
const P = (x, y) => [POX + x * PK, POY + y * PK];
/* the mock catalog stands in for the paper's sample page: unrelated products at implausible prices */
const ITEMS = [
  { icon: "lamp", now: 9, was: 289 },
  { icon: "phone", now: 12, was: 999 },
  { icon: "shoe", now: 7, was: 210 },
  { icon: "chair", now: 15, was: 480 },
  { icon: "watch", now: 6, was: 350 },
  { icon: "sofa", now: 19, was: 1299 },
];
const TILE = (i) => ({ x: 20 + (i % 3) * 86, y: 152 + Math.floor(i / 3) * 66, w: 80, h: 60 });
const REGIONS = [
  { x: 18, y: 44, w: 76, h: 20 },        // 1 storefront header
  { x: 184, y: 68, w: 92, h: 62 },       // 2 hero image
  { x: 18, y: 150, w: 262, h: 128 },     // 3 catalog
  { x: 192, y: 254, w: 82, h: 18 },      // 4 one price tag
];
const MODULES = [
  { id: "A_u", name: { en: "URL evidence", zh: "URL 证据" }, find: { en: "Suspicious domain", zh: "可疑域名" } },
  { id: "A_t", name: { en: "Textual persuasion", zh: "文本话术" }, find: { en: "Urgency or scarcity cues", zh: "紧迫或稀缺暗示" } },
  { id: "A_v", name: { en: "Visual layout", zh: "视觉布局" }, find: { en: "Implausible prices", zh: "价格明显不合理" } },
  { id: "A_c", name: { en: "Cross-modal consistency", zh: "跨模态一致性" }, find: { en: "URL, title, visual mismatch", zh: "URL、标题与画面不一致" } },
];
const RATIONALES = {
  en: ["Unverifiable storefront identity", "Generic furniture hero image not aligned with catalog", "Incoherent product catalog", "Implausible pricing"],
  zh: ["店铺身份无法核实", "家具主图与商品目录不符", "商品目录杂乱不一致", "定价明显不合理"],
};
const SUBTYPES = ["Phishing", "Cryptocurrency Investment", "Fake News Website", "Online Gambling", "Technical Support", "Task-Based Commission", "Online Investment", "Gaming Item Trading", "Romance", "Online Shopping"];
const INPUTS = [
  { k: "I", en: "Full-page screenshot", zh: "整页截图" },
  { k: "U", en: "URL", zh: "URL" },
  { k: "T", en: "Page title", zh: "页面标题" },
  { k: "S", en: "Archived MHTML structure", zh: "存档 MHTML 结构" },
];

function icon(ctx, kind, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 24, s / 24);
  ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.beginPath();
  if (kind === "lamp") { ctx.moveTo(-6, -2); ctx.lineTo(-3, -9); ctx.lineTo(3, -9); ctx.lineTo(6, -2); ctx.closePath(); ctx.moveTo(0, -2); ctx.lineTo(0, 7); ctx.moveTo(-5, 8); ctx.lineTo(5, 8); }
  else if (kind === "phone") { rr(ctx, -5, -9, 10, 18, 2.5); ctx.moveTo(-1.5, 6); ctx.lineTo(1.5, 6); }
  else if (kind === "shoe") { ctx.moveTo(-9, 5); ctx.lineTo(-9, -2); ctx.lineTo(-4, -2); ctx.lineTo(0, 1); ctx.lineTo(8, 2); ctx.quadraticCurveTo(10, 4, 9, 6); ctx.lineTo(-9, 6); ctx.moveTo(-9, 3); ctx.lineTo(9, 3.5); }
  else if (kind === "chair") { ctx.moveTo(-5, -9); ctx.lineTo(-5, 1); ctx.lineTo(6, 1); ctx.moveTo(-5, 1); ctx.lineTo(-5, 9); ctx.moveTo(6, 1); ctx.lineTo(6, 9); ctx.moveTo(-5, -9); ctx.lineTo(-1, -9); }
  else if (kind === "watch") { ctx.arc(0, 0, 5.5, 0, 6.2832); ctx.moveTo(-3, -5); ctx.lineTo(-3, -10); ctx.lineTo(3, -10); ctx.lineTo(3, -5); ctx.moveTo(-3, 5); ctx.lineTo(-3, 10); ctx.lineTo(3, 10); ctx.lineTo(3, 5); ctx.moveTo(0, 0); ctx.lineTo(0, -3); ctx.moveTo(0, 0); ctx.lineTo(2.5, 1); }
  else if (kind === "sofa") { rr(ctx, -9, -3, 18, 7, 2); ctx.moveTo(-7, -3); ctx.lineTo(-7, -8); ctx.lineTo(7, -8); ctx.lineTo(7, -3); ctx.moveTo(-8, 4); ctx.lineTo(-8, 8); ctx.moveTo(8, 4); ctx.lineTo(8, 8); }
  ctx.stroke();
  ctx.restore();
}

function page(ctx, t, lang) {
  const a = seg(t, 150, 650);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  panel(ctx, WIN.x, WIN.y, WIN.w, WIN.h, { r: 10, fill: "rgba(14, 8, 44, .88)", stroke: "rgba(196, 176, 255, .3)" });
  /* browser chrome */
  [0, 1, 2].forEach((i) => { ctx.fillStyle = [C.magenta, C.purple, C.cyan][i]; ctx.globalAlpha = a * 0.75; ctx.beginPath(); ctx.arc(WIN.x + 12 + i * 9, WIN.y + 13, 2.6, 0, 6.2832); ctx.fill(); });
  ctx.globalAlpha = a;
  panel(ctx, WIN.x + 42, WIN.y + 6, WIN.w - 52, 15, { r: 7.5, fill: "rgba(255, 255, 255, .06)", stroke: "rgba(196, 176, 255, .18)" });
  text(ctx, typed(URL_TEXT, seg(t, 450, 1400)), WIN.x + 50, WIN.y + 16.6, { size: 8.6, mono: true, color: "rgba(247,244,255,.86)" });
  text(ctx, lang === "zh" ? "论文示例网页" : "paper's sample page", WIN.x + WIN.w - 14, WIN.y + 16.6, { size: 7.4, align: "right", color: "rgba(247,244,255,.36)" });
  /* header */
  const hp = ease.out(seg(t, 650, 1050));
  ctx.globalAlpha = a * hp;
  rr(ctx, 22, 47, 14, 14, 3.5); ctx.fillStyle = "rgba(168, 85, 247, .55)"; ctx.fill();
  rr(ctx, 40, 51, 44, 6, 3); ctx.fillStyle = "rgba(247,244,255,.22)"; ctx.fill();
  [0, 1, 2, 3].forEach((i) => { rr(ctx, 168 + i * 27, 51, 20, 5, 2.5); ctx.fillStyle = "rgba(247,244,255,.16)"; ctx.fill(); });
  /* hero: furniture image with an investment headline */
  const hero = ease.out(seg(t, 850, 1350));
  ctx.globalAlpha = a * hero;
  const g = ctx.createLinearGradient(20, 68, 278, 132);
  g.addColorStop(0, "rgba(93, 52, 208, .55)"); g.addColorStop(0.6, "rgba(168, 85, 247, .35)"); g.addColorStop(1, "rgba(236, 72, 153, .45)");
  rr(ctx, 20, 68, 258, 62, 7); ctx.fillStyle = g; ctx.fill();
  const sh = (t / 2600) % 1;
  const sg = ctx.createLinearGradient(20 + sh * 300 - 60, 0, 20 + sh * 300, 0);
  sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, "rgba(255,255,255,.08)"); sg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sg; rr(ctx, 20, 68, 258, 62, 7); ctx.fill();
  text(ctx, "Unlock your", 30, 89, { size: 12.5, weight: 800 });
  text(ctx, "financial potential", 30, 104, { size: 12.5, weight: 800 });
  rr(ctx, 30, 112, 54, 12, 6); ctx.fillStyle = C.ink; ctx.globalAlpha = a * hero * 0.92; ctx.fill();
  text(ctx, "Shop now", 57, 120.6, { size: 7.2, weight: 700, align: "center", color: C.night });
  ctx.globalAlpha = a * hero;
  icon(ctx, "sofa", 232, 99, 54, "rgba(247,244,255,.85)");
  /* urgency strip with a running countdown */
  const st = ease.out(seg(t, 1100, 1500));
  ctx.globalAlpha = a * st;
  rr(ctx, 20, 134, 258, 13, 3); ctx.fillStyle = "rgba(255, 0, 110, .2)"; ctx.fill();
  const left = Math.max(0, 239 - Math.floor(t / 1000));
  text(ctx, lang === "zh" ? "限时抢购 · 倒计时" : "Flash sale ends in", 26, 143.4, { size: 7.6, weight: 600, color: "rgba(255, 190, 220, .95)" });
  text(ctx, "0" + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0"), 272, 143.6, { size: 8.4, mono: true, weight: 700, align: "right", color: "#ffc2dc" });
  /* catalog */
  ITEMS.forEach((it, i) => {
    const p = ease.spring(seg(t, 1250 + i * 110, 1850 + i * 110));
    if (p <= 0) return;
    const b = TILE(i);
    ctx.globalAlpha = a * clamp(p);
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
    ctx.scale(0.8 + 0.2 * p, 0.8 + 0.2 * p);
    ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    panel(ctx, b.x, b.y, b.w, b.h, { r: 6, fill: "rgba(255,255,255,.05)", stroke: "rgba(196,176,255,.16)" });
    icon(ctx, it.icon, b.x + b.w / 2, b.y + 22, 22, "rgba(247,244,255,.8)");
    const off = Math.round((1 - it.now / it.was) * 100);
    text(ctx, "$" + it.now, b.x + 7, b.y + 52, { size: 9.5, weight: 800, color: C.cyan });
    font(ctx, 7.4, 500);
    const wasTxt = "$" + it.was.toLocaleString("en-US");
    const wx = b.x + 9 + ctx.measureText("$" + it.now).width * 1.3;
    text(ctx, wasTxt, wx, b.y + 52, { size: 7.4, color: "rgba(247,244,255,.42)" });
    font(ctx, 7.4, 500);
    const ww = ctx.measureText(wasTxt).width;
    ctx.strokeStyle = "rgba(247,244,255,.42)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(wx - 1, b.y + 49.4); ctx.lineTo(wx + ww + 1, b.y + 49.4); ctx.stroke();
    rr(ctx, b.x + b.w - 26, b.y + 5, 21, 10, 5); ctx.fillStyle = "rgba(255, 0, 110, .78)"; ctx.fill();
    text(ctx, "-" + off + "%", b.x + b.w - 15.5, b.y + 12.4, { size: 6.6, weight: 800, align: "center" });
    ctx.restore();
  });
  ctx.restore();
}

/* analysis overlays on the page during step 2 */
function scans(ctx, t) {
  const on = seg(t, 3700, 3900) * (1 - seg(t, 7700, 8000));
  if (on <= 0) return;
  ctx.save();
  ctx.globalAlpha = on;
  /* A_u: URL scan, then the host is underlined */
  const u = seg(t, 3800, 4600);
  if (u > 0) {
    const x0 = WIN.x + 44, x1 = WIN.x + WIN.w - 12, xs = lerp(x0, x1, ease.inOut(u));
    if (u < 1) { const g = ctx.createLinearGradient(xs - 30, 0, xs, 0); g.addColorStop(0, rgba(C.cyan, 0)); g.addColorStop(1, rgba(C.cyan, 0.5)); ctx.fillStyle = g; ctx.fillRect(xs - 30, WIN.y + 6, 30, 15); }
    font(ctx, 8.6, 500, true);
    const hx = WIN.x + 50 + ctx.measureText("http://www.").width, hw = ctx.measureText(URL_HOST).width;
    const k = ease.out(seg(t, 4300, 4800));
    ctx.strokeStyle = C.magenta; ctx.lineWidth = 1.4; ctx.shadowColor = C.magenta; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(hx, WIN.y + 19.5); ctx.lineTo(hx + hw * k, WIN.y + 19.5); ctx.stroke(); ctx.shadowBlur = 0;
  }
  /* A_t: the headline and the countdown are read */
  const tt = seg(t, 4800, 5600);
  if (tt > 0) {
    ctx.fillStyle = rgba(C.cyan, 0.16);
    [[28, 79, 120, 13], [28, 94, 134, 13], [22, 135, 254, 11]].forEach((r, i) => {
      const k = ease.out(seg(t, 4800 + i * 180, 5300 + i * 180));
      rr(ctx, r[0], r[1], r[2] * k, r[3], 3); ctx.fill();
    });
  }
  /* A_v: a scan line sweeps the catalog */
  const v = seg(t, 5800, 6700);
  if (v > 0 && v < 1) {
    const y = lerp(150, 278, v);
    const g = ctx.createLinearGradient(0, y - 18, 0, y);
    g.addColorStop(0, rgba(C.cyan, 0)); g.addColorStop(1, rgba(C.cyan, 0.32));
    ctx.fillStyle = g; ctx.fillRect(18, y - 18, 262, 18);
    ctx.fillStyle = rgba(C.cyan, 0.9); ctx.fillRect(18, y - 0.6, 262, 1.2);
  }
  if (v > 0.5) ITEMS.forEach((_, i) => { const b = TILE(i); rr(ctx, b.x + 4, b.y + 42, 52, 13, 3); ctx.fillStyle = rgba(C.cyan, 0.13 * ease.out(seg(t, 6200 + i * 60, 6600 + i * 60))); ctx.fill(); });
  /* A_c: claims linked across modalities */
  const c = seg(t, 6800, 7600);
  if (c > 0) {
    const pts = [[WIN.x + 150, WIN.y + 20], [92, 97], [232, 99], [150, 210]];
    ctx.setLineDash([3, 3]); ctx.lineDashOffset = -t / 60;
    ctx.strokeStyle = rgba(C.cyan, 0.85); ctx.lineWidth = 1.1;
    for (let i = 0; i < 3; i++) {
      const k = ease.inOut(seg(t, 6800 + i * 230, 7300 + i * 230));
      if (k <= 0) continue;
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const mx = (ax + bx) / 2, my = Math.min(ay, by) - 18;
      ctx.beginPath(); ctx.moveTo(ax, ay);
      const steps = 24;
      for (let s = 1; s <= Math.round(steps * k); s++) { const q = s / steps, u2 = 1 - q; ctx.lineTo(u2 * u2 * ax + 2 * u2 * q * mx + q * q * bx, u2 * u2 * ay + 2 * u2 * q * my + q * q * by); }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function boxes(ctx, t) {
  const fade = 1 - seg(t, 15500, 15900);
  REGIONS.forEach((r, i) => {
    const p = seg(t, 10150 + i * 330, 10900 + i * 330);
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = rgba(C.magenta, 0.1 * ease.out(p));
    rr(ctx, r.x, r.y, r.w, r.h, 4); ctx.fill();
    brackets(ctx, r.x, r.y, r.w, r.h, p, C.magenta, 1.5);
    const k = ease.spring(seg(t, 10400 + i * 330, 11000 + i * 330));
    if (k > 0) {
      ctx.save(); ctx.translate(r.x + 1, r.y + 1); ctx.scale(k, k);
      ctx.fillStyle = C.magenta; ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, 6.2832); ctx.fill();
      text(ctx, String(i + 1), 0, 3, { size: 8.4, weight: 800, align: "center" });
      ctx.restore();
    }
    ctx.restore();
  });
}

function rightPanel(ctx, t, lang) {
  const L = (o) => o[lang] || o.en;
  /* step 1: the four inputs */
  const s1 = seg(t, 1500, 1900) * (1 - seg(t, 3400, 3800));
  if (s1 > 0) {
    ctx.save(); ctx.globalAlpha = s1;
    text(ctx, "x = (I, U, T, S)", RP.x + 6, RP.y + 22, { size: 12, mono: true, weight: 600, color: C.cyan, glow: rgba(C.cyan, 0.6) });
    const anchors = [P(WIN.x + WIN.w, 160), P(WIN.x + WIN.w - 12, WIN.y + 13), P(150, 96), P(94, 54)];
    INPUTS.forEach((it, i) => {
      const p = ease.spring(seg(t, 1700 + i * 230, 2500 + i * 230));
      if (p <= 0) return;
      const y = RP.y + 30 + i * 48, x = RP.x + (1 - p) * 30;
      ctx.globalAlpha = s1 * clamp(p);
      panel(ctx, x, y, RP.w - 4, 38, { r: 8, fill: "rgba(22, 12, 64, .74)" });
      ctx.fillStyle = rgba(C.cyan, 0.16); ctx.beginPath(); ctx.arc(x + 19, y + 19, 11, 0, 6.2832); ctx.fill();
      text(ctx, it.k, x + 19, y + 23.6, { size: 13, weight: 800, align: "center", color: C.cyan });
      text(ctx, lang === "zh" ? it.zh : it.en, x + 38, y + 23, { size: 9.6, weight: 600, max: RP.w - 46 });
      /* connector from the page */
      const [ax, ay] = anchors[i], k = ease.inOut(seg(t, 2000 + i * 230, 2700 + i * 230));
      if (k > 0) {
        ctx.strokeStyle = rgba(C.cyan, 0.5); ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.lineDashOffset = -t / 40;
        ctx.beginPath();
        const bx = x, by = y + 19, cx1 = ax + 24, cx2 = bx - 24;
        for (let s = 0; s <= 20 * k; s++) { const q = s / 20, u = 1 - q; const px = u * u * u * ax + 3 * u * u * q * cx1 + 3 * u * q * q * cx2 + q * q * q * bx; const py = u * u * u * ay + 3 * u * u * q * ay + 3 * u * q * q * by + q * q * q * by; if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
        ctx.stroke(); ctx.setLineDash([]);
      }
    });
    ctx.restore();
  }
  /* step 2: analysis modules */
  const s2 = seg(t, 3600, 3950) * (1 - seg(t, 7700, 8000));
  if (s2 > 0) {
    ctx.save(); ctx.globalAlpha = s2;
    text(ctx, lang === "zh" ? "ScamDet · 分析模块" : "ScamDet · analysis modules", RP.x + 4, RP.y + 20, { size: 10, weight: 700, color: rgba(C.ink, 0.72) });
    MODULES.forEach((m, i) => {
      const y = RP.y + 28 + i * 54, a0 = 3800 + i * 1000, act = seg(t, a0, a0 + 200) * (1 - seg(t, a0 + 950, a0 + 1150)), done = t > a0 + 900;
      panel(ctx, RP.x, y, RP.w - 4, 47, { r: 8, fill: act > 0 ? "rgba(0, 240, 255, .07)" : "rgba(22, 12, 64, .7)", stroke: act > 0 ? rgba(C.cyan, 0.35 + 0.5 * act) : "rgba(196,176,255,.2)", glow: act > 0 ? rgba(C.cyan, 0.6 * act) : null });
      text(ctx, m.id, RP.x + 9, y + 16, { size: 10, mono: true, weight: 700, color: C.cyan });
      text(ctx, L(m.name), RP.x + 34, y + 16, { size: 9.4, weight: 600, max: RP.w - 44 });
      const pr = seg(t, a0, a0 + 800);
      rr(ctx, RP.x + 9, y + 22, RP.w - 22, 3, 1.5); ctx.fillStyle = "rgba(247,244,255,.12)"; ctx.fill();
      if (pr > 0) { rr(ctx, RP.x + 9, y + 22, (RP.w - 22) * pr, 3, 1.5); ctx.fillStyle = C.cyan; ctx.fill(); }
      const f = L(m.find), tp = seg(t, a0 + 350, a0 + 900);
      if (tp > 0) text(ctx, typed(f, tp), RP.x + 9, y + 38, { size: 9.2, weight: 600, color: "#ff8fbd", max: RP.w - 30 });
      if (done) check(ctx, RP.x + RP.w - 17, y + 15, 10, C.cyan, seg(t, a0 + 900, a0 + 1150));
    });
    ctx.restore();
  }
  /* step 3: the cascade */
  const s3 = seg(t, 7800, 8100) * (1 - seg(t, 12000, 12300));
  if (s3 > 0) {
    ctx.save(); ctx.globalAlpha = s3;
    text(ctx, lang === "zh" ? "阶段 1 · 诈骗检测" : "Stage 1 · Fraud detection", RP.x + 4, RP.y + 20, { size: 9.6, weight: 700, color: rgba(C.ink, 0.72) });
    const st = ease.spring(seg(t, 7950, 8650));
    if (st > 0) {
      ctx.save(); ctx.translate(RP.x + RP.w / 2 - 2, RP.y + 48); const sc = 1.7 - 0.7 * st; ctx.scale(sc, sc); ctx.rotate(-0.05);
      ctx.globalAlpha = s3 * clamp(st * 1.4);
      ctx.strokeStyle = C.magenta; ctx.lineWidth = 2.2; ctx.shadowColor = C.magenta; ctx.shadowBlur = 16;
      rr(ctx, -62, -17, 124, 34, 6); ctx.stroke(); ctx.shadowBlur = 0;
      text(ctx, lang === "zh" ? "诈骗网页" : "SCAM", 0, 9, { size: 25, weight: 900, align: "center", color: C.magenta, glow: C.magenta, blur: 18 });
      ctx.restore();
    }
    const s2b = seg(t, 8700, 9000);
    if (s2b > 0) {
      ctx.globalAlpha = s3 * s2b;
      text(ctx, lang === "zh" ? "阶段 2 · 子类（25 类）" : "Stage 2 · Subtype, 25 classes", RP.x + 4, RP.y + 92, { size: 9.6, weight: 700, color: rgba(C.ink, 0.72) });
      const box = { x: RP.x, y: RP.y + 100, w: RP.w - 4, h: 30 };
      panel(ctx, box.x, box.y, box.w, box.h, { r: 7, fill: "rgba(22,12,64,.8)", stroke: rgba(C.magenta, 0.55) });
      const total = SUBTYPES.length * 2 + (SUBTYPES.length - 1);
      const pos = ease.out(seg(t, 8800, 10100)) * total;
      ctx.save(); rr(ctx, box.x + 2, box.y + 2, box.w - 4, box.h - 4, 6); ctx.clip();
      for (let d = -1; d <= 1; d++) {
        const idx = Math.floor(pos) + d, off = (idx - pos) * 22;
        const name = SUBTYPES[((idx % SUBTYPES.length) + SUBTYPES.length) % SUBTYPES.length];
        const final = t > 10100 && d === 0;
        text(ctx, (final && lang === "zh") ? "网购诈骗" : name + (final ? " Scam" : ""), box.x + box.w / 2, box.y + 19.5 + off, { size: final ? 11 : 10, weight: 800, align: "center", color: final ? "#ff7ab0" : rgba(C.ink, 0.55 - Math.abs(off) / 60), glow: final ? rgba(C.magenta, 0.7) : null, max: box.w - 12 });
      }
      ctx.restore();
    }
    const s3b = seg(t, 10100, 10400);
    if (s3b > 0) {
      ctx.globalAlpha = s3 * s3b;
      text(ctx, lang === "zh" ? "阶段 3 · 证据定位" : "Stage 3 · Evidence grounding", RP.x + 4, RP.y + 152, { size: 9.6, weight: 700, color: rgba(C.ink, 0.72) });
      REGIONS.forEach((_, i) => {
        const p = ease.spring(seg(t, 10200 + i * 330, 10800 + i * 330));
        if (p <= 0) return;
        const x = RP.x + 4 + i * 44, y = RP.y + 162;
        ctx.save(); ctx.translate(x + 16, y + 16); ctx.scale(p, p);
        panel(ctx, -16, -16, 32, 32, { r: 6, fill: rgba(C.magenta, 0.16), stroke: rgba(C.magenta, 0.8) });
        text(ctx, String(i + 1), 0, 5, { size: 13, weight: 800, align: "center", color: "#ff8fbd" });
        ctx.restore();
      });
      const k = seg(t, 11400, 11800);
      if (k > 0) text(ctx, lang === "zh" ? "4 个欺骗区域，坐标映射回截图" : "4 regions, mapped back to the screenshot", RP.x + 4, RP.y + 214, { size: 9, color: rgba(C.ink, 0.7 * k), max: RP.w - 6 });
    }
    ctx.restore();
  }
  /* step 4: grounded rationales and the dataset */
  const s4 = seg(t, 12200, 12500);
  if (s4 > 0) {
    ctx.save(); ctx.globalAlpha = s4 * (1 - seg(t, 15600, 15950));
    text(ctx, lang === "zh" ? "阶段 4 · 依据生成" : "Stage 4 · Rationales", RP.x + 4, RP.y + 20, { size: 9.6, weight: 700, color: rgba(C.ink, 0.72) });
    const R = RATIONALES[lang] || RATIONALES.en;
    let y = RP.y + 28;
    R.forEach((r, i) => {
      const p = seg(t, 12350 + i * 420, 12950 + i * 420);
      const lines = wrap(ctx, r, RP.w - 34, 9.4, 600);
      const h = 14 + lines.length * 12;
      if (p > 0) {
        ctx.globalAlpha = s4 * clamp(p * 2) * (1 - seg(t, 15600, 15950));
        panel(ctx, RP.x, y, RP.w - 4, h, { r: 7, fill: "rgba(22,12,64,.74)", stroke: rgba(C.magenta, 0.45) });
        ctx.fillStyle = C.magenta; ctx.beginPath(); ctx.arc(RP.x + 12, y + 13, 6, 0, 6.2832); ctx.fill();
        text(ctx, String(i + 1), RP.x + 12, y + 16, { size: 8, weight: 800, align: "center" });
        const shown = typed(r, seg(t, 12500 + i * 420, 13100 + i * 420));
        let left = shown.length;
        lines.forEach((ln, j) => { const part = ln.slice(0, Math.max(0, left)); left -= ln.length + 1; text(ctx, part, RP.x + 24, y + 16 + j * 12, { size: 9.4, weight: 600 }); });
        /* leader line from the box on the page */
        const reg = REGIONS[i], k = ease.inOut(seg(t, 12400 + i * 420, 12900 + i * 420));
        const [ax, ay] = P(reg.x + reg.w, reg.y + Math.min(reg.h / 2, 10)), bx = RP.x, by = y + 13;
        ctx.strokeStyle = rgba(C.magenta, 0.7); ctx.lineWidth = 1; ctx.shadowColor = C.magenta; ctx.shadowBlur = 5;
        ctx.beginPath(); ctx.moveTo(ax, ay);
        for (let s = 1; s <= Math.round(24 * k); s++) { const q = s / 24, u = 1 - q; ctx.lineTo(u * u * u * ax + 3 * u * u * q * (ax + 20) + 3 * u * q * q * (bx - 24) + q * q * q * bx, u * u * u * ay + 3 * u * u * q * ay + 3 * u * q * q * by + q * q * q * by); }
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      y += h + 6;
    });
    const f = ease.out(seg(t, 14300, 14900));
    if (f > 0) {
      ctx.globalAlpha = f * (1 - seg(t, 15600, 15950));
      const g = ctx.createLinearGradient(RP.x, 0, RP.x + 120, 0);
      g.addColorStop(0, C.cyan); g.addColorStop(1, C.magenta);
      font(ctx, 26, 900);
      ctx.fillStyle = g; ctx.textAlign = "left"; ctx.shadowColor = rgba(C.purple, 0.8); ctx.shadowBlur = 14;
      ctx.fillText("3,416", RP.x + 4, RP.y + RP.h - 20); ctx.shadowBlur = 0;
      text(ctx, lang === "zh" ? "个诈骗网页带专家框与依据" : "scam pages with expert boxes + rationales", RP.x + 4, RP.y + RP.h - 6, { size: 8.4, color: rgba(C.ink, 0.75), max: RP.w - 6 });
    }
    ctx.restore();
  }
}

export default {
  duration: 16000,
  poster: 14800,
  seed: 0.4,
  mood: [
    [0, { v: 0.85, c: 0.45, m: 0.08 }],
    [3600, { v: 0.9, c: 0.55, m: 0.1 }],
    [7700, { v: 0.8, c: 0.3, m: 0.15 }],
    [8100, { v: 0.6, c: 0.12, m: 1 }],
    [9800, { v: 0.65, c: 0.2, m: 0.6 }],
    [12200, { v: 0.8, c: 0.45, m: 0.45 }],
    [16000, { v: 0.85, c: 0.45, m: 0.08 }],
  ],
  steps: [
    { at: 0, label: { en: "Input", zh: "输入" }, caption: { en: "A suspected fraud page arrives as four views: screenshot, URL, title and archived MHTML.", zh: "一张疑似诈骗网页以四种形式输入：截图、URL、标题与存档 MHTML。" } },
    { at: 3600, label: { en: "Evidence analysis", zh: "证据分析" }, caption: { en: "Four modules read the URL, the persuasion text and the layout, then check that they agree.", zh: "四个模块分别检查 URL、话术文本与页面布局，再核对三者是否一致。" } },
    { at: 7800, label: { en: "Detect, classify, ground", zh: "检测 · 分类 · 定位" }, caption: { en: "Scam detected, subtype named from 25 (Online Shopping), deceptive regions boxed on the page.", zh: "判定为诈骗，在 25 个子类中识别为网购诈骗，并在页面上框出欺骗区域。" } },
    { at: 12200, label: { en: "Grounded rationale", zh: "可解释依据" }, caption: { en: "Every box comes with a written reason. ScamWeb: 10,000+ pages, 25 subtypes, 47 languages.", zh: "每个框都附带文字依据。ScamWeb：10,000+ 网页、25 个子类、47 种语言。" } },
  ],
  draw(ctx, t, state, stage) {
    ctx.save();
    ctx.translate(POX, POY);
    ctx.scale(PK, PK);
    page(ctx, t, stage.lang);
    scans(ctx, t);
    boxes(ctx, t);
    ctx.restore();
    rightPanel(ctx, t, stage.lang);
  },
};
