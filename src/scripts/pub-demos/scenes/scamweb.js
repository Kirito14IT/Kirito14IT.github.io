/* ScamWeb (AAAI 2027): the paper's Figure 1 assembles (sources, URL funnel, dataset donut, subtype fan, samples),
   then one sample zooms into the annotated page of Figure 2 with ScamDet's output beside it:
   label, subtype, grounded boxes and the four expert rationales. */
import { clamp, lerp, seg, ease, rr, box, text, font, wrap, dot, check, arrow } from "../engine.js";

const W = 480, H = 360;
const C = { blue: "#3c78d8", blueBg: "#f2f7fd", dash: "#9fb3d1", peach: "#fdebd9", peachLine: "#f0b27a", pink: "#fdeef0", pinkLine: "#e8a0aa", red: "#e06666", purple: "#8e7cc3", green: "#93c47d", greenD: "#6aa84f", ink: "#1f2933", soft: "#5f6b7a", box: "#d93025" };
const SOURCES = { en: ["Official Blacklists", "Community Reports", "Security Vendor Feeds", "Social Media", "Public Datasets", "NGO Disclosures"], zh: ["官方黑名单", "社区举报", "安全厂商情报", "社交媒体", "公开数据集", "NGO 披露"] };
const SUB = [[1089, "Online Shopping", "网购"], [793, "Cryptocurrency Investment", "加密投资"], [330, "Online Investment", "网络投资"], [154, "Technical Support", "技术支持"], [150, "Online Gambling", "网络赌博"], [120, "Fake News", "虚假新闻"], [111, "Phishing", "钓鱼"], [99, "Task-Based Commission", "刷单返佣"], [87, "Gaming Item Trading", "游戏交易"]];
const T = {
  en: {
    src: "Data Source", pool: "Cyber-enabled Fraud URL Pool 100K", sub: "Subtype", subs: ["Crypto", "Shopping", "Game", "…"],
    act: ["Active", "Collected", "automated web crawler"], ina: ["Inactive", "Recovered", "Wayback Machine"],
    proc: "Processed data", procI: ["Label", "Title", "Screenshot", "MHTML"], ann: "Annotation",
    funnel: ["Raw URLs 100K", "Valid Pages 10K", "Selected 7K"], scam: "Scam", benign: "Benign", web: "Webpages",
    tags: ["25 subtypes", "47 language labels"], samples: "Samples",
    out: "ScamDet output", label: "Label", labelV: "Scam", type: "Subtype", typeV: "Online Shopping",
    rats: ["Unverifiable storefront identity", "Generic furniture hero image not aligned with catalog", "Incoherent product catalog", "Implausible pricing"],
    note: "3,416 pages carry expert boxes + rationales like these",
  },
  zh: {
    src: "数据来源", pool: "网络诈骗 URL 池 100K", sub: "子类", subs: ["加密", "购物", "游戏", "…"],
    act: ["在线", "采集", "自动化爬虫"], ina: ["已下线", "恢复", "Wayback Machine"],
    proc: "处理后的数据", procI: ["标签", "标题", "截图", "MHTML"], ann: "标注",
    funnel: ["原始 URL 100K", "有效页面 10K", "精选 7K"], scam: "诈骗", benign: "正常", web: "网页",
    tags: ["25 个子类", "47 种语言标签"], samples: "样例",
    out: "ScamDet 输出", label: "标签", labelV: "诈骗", type: "子类", typeV: "网购诈骗",
    rats: ["店铺身份无法核实", "家具主图与商品目录不符", "商品目录杂乱不一致", "定价明显不合理"],
    note: "3,416 个网页带有这样的专家框与依据",
  },
};
const THUMB = { x: 366, y: 58, w: 50, h: 51 };
const FULL = { x: 10, y: 36, w: 308, h: 314 };

function chip(ctx, s, x, y, w, h, fill, stroke, color, size = 7, dash) {
  box(ctx, x, y, w, h, { r: 3, fill, stroke, lw: 1, dash });
  text(ctx, s, x + w / 2, y + h / 2 + size * 0.36, { size, weight: 600, align: "center", color, max: w - 4 });
}
function headTag(ctx, s, x, y, w, color) {
  box(ctx, x, y, w, 14, { r: 3, fill: color });
  text(ctx, s, x + w / 2, y + 10, { size: 7.8, weight: 700, align: "center", color: "#fff", max: w - 6 });
}
function prodIcon(ctx, kind, cx, cy, s, col) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 24, s / 24);
  ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.beginPath();
  if (kind === 0) { ctx.moveTo(-6, -2); ctx.lineTo(-3, -9); ctx.lineTo(3, -9); ctx.lineTo(6, -2); ctx.closePath(); ctx.moveTo(0, -2); ctx.lineTo(0, 7); ctx.moveTo(-5, 8); ctx.lineTo(5, 8); }
  if (kind === 1) { rr(ctx, -5, -9, 10, 18, 2.5); ctx.moveTo(-1.5, 6); ctx.lineTo(1.5, 6); }
  if (kind === 2) { ctx.moveTo(-9, 5); ctx.lineTo(-9, -2); ctx.lineTo(-4, -2); ctx.lineTo(0, 1); ctx.lineTo(8, 2); ctx.quadraticCurveTo(10, 4, 9, 6); ctx.lineTo(-9, 6); }
  if (kind === 3) { ctx.moveTo(-5, -9); ctx.lineTo(-5, 1); ctx.lineTo(6, 1); ctx.moveTo(-5, 1); ctx.lineTo(-5, 9); ctx.moveTo(6, 1); ctx.lineTo(6, 9); }
  if (kind === 4) { ctx.arc(0, 0, 5.5, 0, 6.2832); ctx.moveTo(-3, -5); ctx.lineTo(-3, -10); ctx.lineTo(3, -10); ctx.lineTo(3, -5); ctx.moveTo(-3, 5); ctx.lineTo(-3, 10); ctx.lineTo(3, 10); ctx.lineTo(3, 5); }
  if (kind === 5) { rr(ctx, -9, -3, 18, 7, 2); ctx.moveTo(-7, -3); ctx.lineTo(-7, -8); ctx.lineTo(7, -8); ctx.lineTo(7, -3); ctx.moveTo(-8, 4); ctx.lineTo(-8, 8); ctx.moveTo(8, 4); ctx.lineTo(8, 8); }
  ctx.stroke(); ctx.restore();
}
/* the sample webpage of Figure 2, drawn into any rectangle (thumbnail or full) */
function samplePage(ctx, R, detail) {
  const k = R.w / 308;
  ctx.save(); ctx.translate(R.x, R.y); ctx.scale(k, k * (R.h / 314) / (R.w / 308));
  box(ctx, 0, 0, 308, 314, { r: 4, fill: "#ffffff", stroke: "#c9d2dc", lw: 1 / k });
  ctx.fillStyle = "#eef1f4"; ctx.fillRect(0.5, 0.5, 307, 18);
  [0, 1, 2].forEach((i) => dot(ctx, 9 + i * 8, 9.5, 2.4, ["#ff6159", "#ffbd2e", "#28c941"][i]));
  box(ctx, 38, 4, 262, 11, { r: 5.5, fill: "#fff", stroke: "#d5dbe2" });
  if (detail) text(ctx, "http://www.feworiesad.shop", 46, 12.5, { size: 7.6, mono: true, color: "#3e4c59" });
  box(ctx, 10, 26, 16, 14, { r: 3, fill: "#c8a27c" });
  [0, 1, 2, 3].forEach((i) => box(ctx, 160 + i * 36, 31, 28, 5, { r: 2.5, fill: "#d5dbe2" }));
  const g = ctx.createLinearGradient(8, 48, 300, 136);
  g.addColorStop(0, "#f8e8d8"); g.addColorStop(1, "#f1c7ae");
  box(ctx, 8, 46, 292, 90, { r: 4, fill: g });
  /* a generic furniture hero image */
  ctx.fillStyle = "#b9a08a"; rr(ctx, 186, 84, 96, 30, 8); ctx.fill(); rr(ctx, 192, 66, 84, 26, 9); ctx.fill();
  ctx.fillStyle = "#a3896f"; rr(ctx, 178, 80, 18, 36, 7); ctx.fill(); rr(ctx, 272, 80, 18, 36, 7); ctx.fill();
  ctx.fillStyle = "#7d6a57"; ctx.fillRect(192, 116, 4, 8); ctx.fillRect(272, 116, 4, 8);
  if (detail) {
    text(ctx, "Unlock your", 20, 78, { size: 15, weight: 800, color: "#2b2118" });
    text(ctx, "financial potential", 20, 96, { size: 15, weight: 800, color: "#2b2118" });
    box(ctx, 20, 106, 62, 16, { r: 8, fill: "#2b2118" });
    text(ctx, "Shop now", 51, 117, { size: 8, weight: 700, align: "center", color: "#fff" });
  } else { box(ctx, 20, 70, 90, 9, { r: 2, fill: "#2b2118" }); box(ctx, 20, 86, 110, 9, { r: 2, fill: "#2b2118" }); }
  const P = [[9, 289], [12, 999], [7, 210], [15, 480], [6, 350], [19, 1299]];
  P.forEach(([now, was], i) => {
    const x = 8 + (i % 3) * 98, y = 146 + Math.floor(i / 3) * 82;
    box(ctx, x, y, 94, 76, { r: 4, fill: "#f7f8fa", stroke: "#e1e6ec" });
    prodIcon(ctx, i, x + 47, y + 28, 26, "#556270");
    if (detail) {
      text(ctx, "$" + now, x + 8, y + 66, { size: 11, weight: 800, color: "#1f2933" });
      font(ctx, 11, 800); const wn = ctx.measureText("$" + now).width;
      text(ctx, "$" + was.toLocaleString("en-US"), x + 12 + wn, y + 66, { size: 8, color: "#9aa5b1" });
      font(ctx, 8, 400); const ww = ctx.measureText("$" + was.toLocaleString("en-US")).width;
      ctx.strokeStyle = "#9aa5b1"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + 12 + wn, y + 63); ctx.lineTo(x + 12 + wn + ww, y + 63); ctx.stroke();
      box(ctx, x + 64, y + 6, 26, 12, { r: 6, fill: "#e03131" });
      text(ctx, "-" + Math.round((1 - now / was) * 100) + "%", x + 77, y + 14.6, { size: 7.2, weight: 800, align: "center", color: "#fff" });
    } else box(ctx, x + 8, y + 58, 40, 8, { r: 2, fill: "#3e4c59" });
  });
  ctx.restore();
}
const REG = [[6, 22, 70, 22], [172, 58, 126, 72], [6, 142, 296, 166], [196, 290, 98, 20]];

export default {
  id: "scamweb",
  size: [W, H],
  bg: "#ffffff",
  duration: 17000,
  poster: 15000,
  draw(ctx, t, state, stage) {
    const zh = stage.lang === "zh", L = T[zh ? "zh" : "en"];
    const zin = ease.inOut(seg(t, 9400, 10600)), zout = ease.inOut(seg(t, 15800, 16800));
    const z = zin * (1 - zout);
    /* ---------- the dataset figure ---------- */
    if (z < 1) {
      ctx.save(); ctx.globalAlpha = 1 - z;
      /* sources */
      const sp = (i) => ease.spring(seg(t, 200 + i * 140, 800 + i * 140));
      headTag(ctx, L.src, 40, 38, 76, C.blue);
      SOURCES[zh ? "zh" : "en"].forEach((s, i) => {
        const p = sp(i); if (p <= 0) return;
        const x = 10 + (i % 2) * 74, y = 56 + Math.floor(i / 2) * 20;
        ctx.save(); ctx.globalAlpha *= clamp(p * 2); ctx.translate(x + 35, y + 8); ctx.scale(p, p); ctx.translate(-(x + 35), -(y + 8));
        chip(ctx, s, x, y, 70, 16, C.blueBg, C.dash, C.ink, 6.8, [2, 2]);
        ctx.restore();
      });
      /* URL particles into the pool and the funnel */
      for (let i = 0; i < 26; i++) {
        const q = seg(t, 900 + i * 90, 1900 + i * 90);
        if (q <= 0 || q >= 1) continue;
        const sx = 20 + (i % 2) * 74 + (i % 7) * 7, sy = 64 + (i % 3) * 20, tx = 82, ty = 128;
        dot(ctx, lerp(sx, tx, ease.inOut(q)), lerp(sy, ty, ease.inOut(q)), 1.6, C.blue, 0.8);
      }
      const pool = ease.out(seg(t, 1200, 1800));
      ctx.save(); ctx.globalAlpha *= pool;
      chip(ctx, L.pool, 10, 120, 146, 17, C.peach, C.peachLine, "#8a4b16", 7.4);
      box(ctx, 10, 146, 146, 32, { r: 4, fill: C.pink, stroke: C.pinkLine, dash: [2, 2] });
      headTag(ctx, L.sub, 56, 140, 54, "#c2185b");
      L.subs.forEach((s, i) => chip(ctx, s, 16 + i * 35, 159, 31, 13, "#fff", C.pinkLine, "#ad1457", 6.6));
      ctx.restore();
      /* active / inactive collection */
      const ac = ease.out(seg(t, 2600, 3300));
      ctx.save(); ctx.globalAlpha *= ac;
      [[L.act, 10], [L.ina, 84]].forEach(([s, x], i) => {
        box(ctx, x, 186, 70, 48, { r: 4, fill: "#f4faf2", stroke: "#a9cf9c" });
        text(ctx, s[0], x + 35, 198, { size: 7.4, weight: 700, align: "center", color: C.ink });
        arrow(ctx, x + 35, 202, x + 35, 210, C.soft, 1, 3, 1);
        text(ctx, s[1], x + 35, 219, { size: 7.4, weight: 700, align: "center", color: C.ink });
        text(ctx, s[2], x + 35, 229, { size: 5.8, align: "center", color: C.soft, max: 66 });
      });
      ctx.restore();
      const pr = ease.out(seg(t, 3200, 3900));
      ctx.save(); ctx.globalAlpha *= pr;
      box(ctx, 10, 242, 146, 62, { r: 4, fill: C.blueBg, stroke: C.dash, dash: [2, 2] });
      headTag(ctx, L.proc, 40, 236, 86, C.blue);
      L.procI.forEach((s, i) => { box(ctx, 16 + i * 35, 256, 10, 8, { r: 1.5, fill: [C.red, C.blue, C.greenD, C.purple][i] }); text(ctx, s, 28 + i * 35, 263, { size: 5.8, color: C.ink, max: 22 }); });
      dot(ctx, 30, 284, 6, "#f5d2b6"); ctx.fillStyle = "#3c78d8"; ctx.beginPath(); ctx.ellipse(30, 296, 8, 5, 0, Math.PI, 0); ctx.fill();
      text(ctx, L.ann, 30, 302, { size: 5.8, align: "center", color: C.ink });
      box(ctx, 48, 274, 100, 24, { r: 2, fill: "#1b2a3a" });
      [0, 1, 2].forEach((i) => box(ctx, 54 + i * 31, 279, 26, 14, { r: 1.5, fill: ["#3b5670", "#7a5c3a", "#3c4f2e"][i] }));
      ctx.restore();
      /* funnel */
      const fx = 250, fy = 40;
      L.funnel.forEach((s, i) => {
        const p = ease.out(seg(t, 1600 + i * 500, 2200 + i * 500));
        if (p <= 0) return;
        const wTop = 104 - i * 26, wBot = 104 - (i + 1) * 26, y = fy + i * 19;
        ctx.save(); ctx.globalAlpha *= p;
        ctx.fillStyle = ["#9fc5e8", "#6fa8dc", "#3d85c6"][i];
        ctx.beginPath(); ctx.moveTo(fx - wTop / 2, y); ctx.lineTo(fx + wTop / 2, y); ctx.lineTo(fx + wBot / 2, y + 18); ctx.lineTo(fx - wBot / 2, y + 18); ctx.closePath(); ctx.fill();
        text(ctx, s, fx, y + 12.4, { size: 7, weight: 700, align: "center", color: i === 2 ? "#fff" : "#123a63", max: wTop - 6 });
        ctx.restore();
      });
      /* particles thinning through the funnel */
      for (let i = 0; i < 18; i++) {
        const q = (t / 1600 + i / 18) % 1, keep = i % 3 === 0;
        if (t < 2000 || t > 8200 || (!keep && q > 0.55)) continue;
        dot(ctx, fx + Math.sin(i * 2.1) * (30 - q * 26), fy + q * 70, 1.4, "#3d85c6", 0.7);
      }
      /* magnifier */
      ctx.strokeStyle = "#3d85c6"; ctx.lineWidth = 2; ctx.globalAlpha = (1 - z) * ease.out(seg(t, 2800, 3400));
      ctx.beginPath(); ctx.arc(fx - 4, fy + 84, 7, 0, 6.2832); ctx.moveTo(fx + 1, fy + 89); ctx.lineTo(fx + 7, fy + 95); ctx.stroke();
      ctx.globalAlpha = 1 - z;
      /* donut: scam (expert 3,416 + semi-automatic 4,368) and benign 2,242 */
      const dx = 238, dy = 232, R0 = 34, R1 = 60, dp = ease.inOut(seg(t, 5000, 6400));
      /* as in the figure: scam on top (expert 3,416 right, semi-automatic 4,368 left), benign 2,242 at the bottom */
      const segs = [[3416, C.red], [2242, C.green], [4368, C.purple]], tot = 10026;
      let a0 = (-72.8 * Math.PI) / 180;
      segs.forEach(([n, col]) => {
        const a1 = a0 + (n / tot) * Math.PI * 2 * dp;
        ctx.beginPath(); ctx.arc(dx, dy, R1, a0, a1); ctx.arc(dx, dy, R0, a1, a0, true); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
        a0 = a0 + (n / tot) * Math.PI * 2 * dp;
      });
      if (dp > 0.5) {
        const k = seg(t, 6000, 6500);
        ctx.save(); ctx.globalAlpha *= k;
        dot(ctx, dx, dy, R0 - 2, "#fff");
        text(ctx, L.web, dx, dy + 3, { size: 8.4, weight: 700, align: "center", color: C.ink });
        const at = (deg, r) => [dx + Math.cos((deg * Math.PI) / 180) * r, dy + Math.sin((deg * Math.PI) / 180) * r];
        let [lx, ly] = at(-90, 47); text(ctx, L.scam, lx, ly + 3, { size: 9, weight: 800, align: "center", color: "#fff" });
        [lx, ly] = at(-11.5, 47); text(ctx, "3416", lx, ly + 3, { size: 8.6, weight: 800, align: "center", color: "#fff" });
        [lx, ly] = at(208.8, 47); text(ctx, "4368", lx, ly + 3, { size: 8.6, weight: 800, align: "center", color: "#fff" });
        [lx, ly] = at(90, 47); text(ctx, L.benign, lx, ly - 1, { size: 8.2, weight: 800, align: "center", color: "#274e13" }); text(ctx, "2242", lx, ly + 8.5, { size: 8, weight: 800, align: "center", color: "#274e13" });
        ctx.restore();
      }
      /* subtype fan */
      const sum = SUB.reduce((a, s) => a + s[0], 0);
      let b0 = -Math.PI * 0.42;
      SUB.forEach(([n, en, zhn], i) => {
        const p = ease.out(seg(t, 6200 + i * 140, 6900 + i * 140));
        const span = (n / sum) * Math.PI * 0.84;
        if (p > 0) {
          const r2 = R1 + 4 + 36 * p;
          ctx.beginPath(); ctx.arc(dx, dy, r2, b0, b0 + span); ctx.arc(dx, dy, R1 + 4, b0 + span, b0, true); ctx.closePath();
          ctx.fillStyle = `hsl(${4 + i * 5}, ${78 - i * 3}%, ${66 + i * 2.6}%)`; ctx.fill();
          if (i < 5 && p > 0.9) {
            const am = b0 + span / 2;
            text(ctx, String(n), dx + Math.cos(am) * (R1 + 22), dy + Math.sin(am) * (R1 + 22) + 3, { size: 7, weight: 700, align: "center", color: "#7a1f1f" });
          }
        }
        b0 += span;
      });
      const tg = ease.spring(seg(t, 7000, 7700));
      if (tg > 0) {
        ctx.save(); ctx.globalAlpha *= clamp(tg * 2);
        L.tags.forEach((s, i) => { box(ctx, 290, 120 + i * 18, 66, 14, { r: 3, fill: "#fff8ec", stroke: "#f6b26b" }); text(ctx, s, 323, 130 + i * 18, { size: 7, weight: 700, align: "center", color: "#a35d0b", max: 62 }); });
        text(ctx, "1089 · " + (zh ? SUB[0][2] : SUB[0][1]), 323, 168, { size: 6.4, weight: 700, align: "center", color: "#9b3b2a", max: 70 });
        ctx.restore();
      }
      /* sample screenshots */
      const sm = ease.out(seg(t, 7800, 8600));
      ctx.save(); ctx.globalAlpha *= sm;
      box(ctx, 362, 38, 110, 296, { r: 4, fill: "#f7fbf5", stroke: "#b6d7a8", dash: [3, 2] });
      headTag(ctx, L.samples, 386, 32, 62, C.greenD);
      samplePage(ctx, THUMB, false);
      const palettes = [["#1b1f2e", "#f2c94c"], ["#0f2a3f", "#56ccf2"], ["#2d1b3d", "#bb6bd9"], ["#13261b", "#27ae60"], ["#2b1a12", "#f2994a"], ["#f4f1ea", "#c0392b"], ["#101820", "#f5b041"], ["#eef3fb", "#2e86de"], ["#1e1e1e", "#e84393"]];
      palettes.forEach(([bg, ac], i) => {
        const c = i + 1, X = 366 + (c % 2) * 54, Y = 58 + Math.floor(c / 2) * 56;
        const p = ease.out(seg(t, 7900 + i * 70, 8400 + i * 70));
        ctx.save(); ctx.globalAlpha *= p;
        box(ctx, X, Y, 50, 51, { r: 3, fill: bg, stroke: "#c9d2dc", lw: 0.6 });
        box(ctx, X + 5, Y + 8, 28, 5, { r: 2, fill: ac }); box(ctx, X + 5, Y + 17, 40, 3, { r: 1.5, fill: bg.startsWith("#f") || bg.startsWith("#e") ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.35)" });
        box(ctx, X + 5, Y + 26, 18, 16, { r: 2, fill: bg.startsWith("#f") || bg.startsWith("#e") ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.14)" }); box(ctx, X + 27, Y + 26, 18, 16, { r: 2, fill: ac });
        ctx.restore();
      });
      ctx.restore();
      ctx.restore();
    }
    /* ---------- zoom into the annotated sample ---------- */
    if (z > 0) {
      const R = { x: lerp(THUMB.x, FULL.x, z), y: lerp(THUMB.y, FULL.y, z), w: lerp(THUMB.w, FULL.w, z), h: lerp(THUMB.h, FULL.h, z) };
      ctx.save(); ctx.globalAlpha = clamp(z * 1.6);
      samplePage(ctx, R, z > 0.55);
      ctx.restore();
      const on = z > 0.98 ? 1 : 0;
      if (on) {
        /* ScamDet output panel */
        const op = ease.out(seg(t, 10500, 11000)) * (1 - seg(t, 15600, 15900));
        ctx.save(); ctx.globalAlpha = op;
        box(ctx, 326, 36, 146, 314, { r: 4, fill: "#fbfcfe", stroke: "#c9d2dc" });
        text(ctx, L.out, 336, 54, { size: 10.6, weight: 700, color: C.ink });
        const kv = (k, v, y, col, at) => { const p = seg(t, at, at + 400); text(ctx, k, 336, y, { size: 7.6, color: C.soft }); text(ctx, v, 336, y + 13, { size: 10, weight: 800, color: col, alpha: p }); };
        kv(L.label, L.labelV, 72, C.box, 10800);
        kv(L.type, L.typeV, 102, C.box, 11300);
        let y = 132;
        L.rats.forEach((r, i) => {
          const p = ease.out(seg(t, 12000 + i * 550, 12500 + i * 550));
          const lines = wrap(ctx, r, 112, 8.4, 600);
          const hgt = 10 + lines.length * 10.5;
          if (p > 0) {
            ctx.save(); ctx.globalAlpha *= p;
            box(ctx, 334, y, 130, hgt, { r: 3, fill: "#fff", stroke: "rgba(217,48,37,.55)" });
            dot(ctx, 343, y + 9, 5.5, C.box);
            text(ctx, String(i + 1), 343, y + 11.8, { size: 7.4, weight: 800, align: "center", color: "#fff" });
            lines.forEach((ln, j) => text(ctx, ln, 352, y + 12 + j * 10.5, { size: 8.4, weight: 600, color: C.ink }));
            ctx.restore();
          }
          y += hgt + 5;
        });
        const nt = seg(t, 14400, 14900);
        if (nt > 0) wrap(ctx, L.note, 126, 7.6, 600).forEach((ln, j) => text(ctx, ln, 336, 318 + j * 10, { size: 7.6, weight: 600, color: C.soft, alpha: nt }));
        ctx.restore();
        /* grounded boxes on the page */
        REG.forEach(([x, y2, w, h], i) => {
          const p = ease.spring(seg(t, 11500 + i * 550, 12200 + i * 550)) * (1 - seg(t, 15600, 15900));
          if (p <= 0) return;
          const X = FULL.x + x, Y = FULL.y + y2, pad = (1 - p) * 10;
          ctx.save(); ctx.globalAlpha = clamp(p * 2);
          ctx.strokeStyle = C.box; ctx.lineWidth = 1.8; ctx.strokeRect(X - pad, Y - pad, w + 2 * pad, h + 2 * pad);
          dot(ctx, X, Y, 6.5, C.box);
          text(ctx, String(i + 1), X, Y + 3, { size: 8, weight: 800, align: "center", color: "#fff" });
          ctx.restore();
        });
      }
    }
  },
};
