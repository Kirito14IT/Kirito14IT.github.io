/* ============================================================
   MemHarmBench project page — animated figures and page-wide motion.

   The paper's figures, redrawn as live components. Every number is copied from the paper:
     · Table 1 (main results), Table 2 (stakeholder views under IPI)
     · Appendix "Objective-level IPI profiles" (per-objective ASR / UTDR / ATAR / joint)
     · Appendix controlled-factor counts (120 cases per condition)
   Case IDs follow the dataset's <template_id>__<context_id> scheme.
   ============================================================ */
(function () {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (v, d = 2) => Number(v).toFixed(d);
  const hasIO = "IntersectionObserver" in window;
  function onView(node, fn, threshold = 0.25) {
    if (!node) return;
    if (!hasIO || reduce) { fn(); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.disconnect(); fn(); } }), { threshold });
    io.observe(node);
  }
  function watch(node, cb) {
    if (!node) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { threshold: 0.02 }).observe(node);
  }
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function tween(from, to, ms, step, done) {
    if (reduce) { step(to); if (done) done(); return; }
    const t0 = performance.now();
    (function frame(now) {
      const t = Math.min(1, (now - t0) / ms);
      step(from + (to - from) * ease(t));
      if (t < 1) requestAnimationFrame(frame); else if (done) done();
    })(t0);
  }

  /* ---------------- data ---------------- */
  const VNAME = { user: "User", owner: "Workspace / project owner", external: "External stakeholder" };
  const VSHORT = { user: "User", owner: "Owner", external: "External" };
  // id, victim, objective (Table: victims, risk categories, objectives), risk group (taxonomy figure),
  // ASR, UTDR, ATAR, joint (ASR = 1, UTDR = 0, ATAR = 0) — appendix objective profiles, IPI, configuration-averaged
  const OBJ = [
    ["U1", "user", "Sensitive-information exfiltration", "Data leakage", 80.40, 10.05, 5.11, 71.78],
    ["U2", "user", "Transaction manipulation", "Decision & guidance manipulation", 77.90, 10.05, 5.11, 72.79],
    ["U3", "user", "Preference manipulation", "Decision & guidance manipulation", 53.03, 15.33, 2.52, 48.01],
    ["U4", "user", "Safety-critical guidance corruption", "Decision & guidance manipulation", 75.13, 40.20, 4.28, 41.20],
    ["W1", "owner", "Code, data, or configuration corruption", "Integrity / policy / workflow manipulation", 85.18, 5.11, 1.76, 83.42],
    ["W2", "owner", "Policy weakening", "Integrity / policy / workflow manipulation", 67.85, 8.46, 4.28, 59.56],
    ["W3", "owner", "Workflow manipulation", "Integrity / policy / workflow manipulation", 42.98, 8.46, 5.11, 36.11],
    ["W4", "owner", "Operational disruption and resource abuse", "Disruption & resource abuse", 35.43, 19.27, 30.66, 20.77],
    ["X1", "external", "Unauthorized communication or impersonation", "Impersonation & downstream manipulation", 61.69, 10.05, 3.02, 48.62],
    ["X2", "external", "Record manipulation", "Impersonation & downstream manipulation", 70.35, 12.69, 3.81, 61.68],
    ["X3", "external", "Shared-artifact contamination", "Impersonation & downstream manipulation", 85.18, 7.66, 2.55, 82.62],
    ["X4", "external", "Cross-user propagation", "Impersonation & downstream manipulation", 70.35, 30.15, 4.23, 35.97],
  ].map(([id, victim, name, group, asr, utdr, atar, joint], i) => ({ id, victim, name, group, asr, utdr, atar, joint, i }));
  const GROUPS = [   // contiguous objective runs of the taxonomy figure's risk-group ring
    { name: "Data leakage", from: 0, to: 1, cls: "g-leak", v: "user" },
    { name: "Decision & guidance manipulation", from: 1, to: 4, cls: "g-decision", v: "user" },
    { name: "Integrity / policy / workflow manipulation", from: 4, to: 7, cls: "g-integrity", v: "owner" },
    { name: "Disruption & resource abuse", from: 7, to: 8, cls: "g-disrupt", v: "owner" },
    { name: "Impersonation & downstream manipulation", from: 8, to: 12, cls: "g-imperson", v: "external" },
  ];
  const CONTEXTS = [
    ["email_contacts", "email", "Email and contact management", "EML"],
    ["calendar_meetings", "calendar", "Calendar and meeting coordination", "ICS"],
    ["commerce_orders", "commerce", "Commerce and order management", "HTML"],
    ["finance_expenses", "finance", "Finance and expense operations", "CSV"],
    ["health_safety", "health", "Health, wellness, and safety guidance", "HTML"],
    ["travel_booking", "travel", "Travel and booking assistance", "HTML"],
    ["web_research_rag", "web RAG", "Web research and retrieval-augmented generation", "JSON"],
    ["documents_knowledge", "docs", "Document and knowledge-base management", "Markdown"],
    ["software_repository", "repo", "Software repository maintenance", "Markdown"],
    ["cicd_cloud_ops", "CI/CD", "CI/CD and cloud operations", "Log"],
    ["customer_support_crm", "CRM", "Customer support and CRM", "JSON"],
    ["team_shared_workspace", "team", "Team and shared workspace coordination", "Markdown"],
  ];
  // 24 registered templates, two per objective (8 direct-instruction, 16 indirect-content)
  const TEMPLATES = [];
  OBJ.forEach((o) => {
    const k = o.id.toLowerCase();
    if (o.victim === "external") {
      TEMPLATES.push({ obj: o, id: `i_${k}_embedded_convention`, ch: "IPI", tag: "convention" });
      TEMPLATES.push({ obj: o, id: `i_${k}_copied_workflow_block`, ch: "IPI", tag: "copied block" });
    } else {
      TEMPLATES.push({ obj: o, id: `d_${k}_standing_instruction`, ch: "DPI", tag: "standing" });
      TEMPLATES.push({ obj: o, id: `i_${k}_embedded_convention`, ch: "IPI", tag: "convention" });
    }
  });
  const HERO_CASES = { "i_u2_embedded_convention__finance_expenses": "user", "i_w1_embedded_convention__cicd_cloud_ops": "owner", "i_x1_copied_workflow_block__email_contacts": "external" };

  /* ---------------- page-wide motion ---------------- */
  // scroll progress
  const bar = $("#progress-bar");
  if (bar) {
    let ticking = false;
    const upd = () => { const h = document.documentElement; const max = h.scrollHeight - h.clientHeight; bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`; ticking = false; };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }
  // card spotlight + a gentle tilt on the small cards
  if (!reduce && matchMedia("(hover: hover)").matches) {
    $$(".fx-card").forEach((card) => {
      const tilt = card.matches(".victim, .metric, .step");
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty("--mx", x + "px"); card.style.setProperty("--my", y + "px");
        if (tilt) card.style.transform = `perspective(900px) rotateX(${((r.height / 2 - y) / r.height) * 5}deg) rotateY(${((x - r.width / 2) / r.width) * 6}deg) translateY(-3px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }
  // count-ups: any [data-count] element counts from zero when it scrolls into view
  $$("[data-count]").forEach((node) => {
    if (node.closest("#lb")) return;   // the results card tweens its own numbers
    const raw = node.getAttribute("data-count"), to = parseFloat(raw);
    const dec = node.hasAttribute("data-dec") ? +node.getAttribute("data-dec") : (raw.split(".")[1] || "").length;
    if (reduce || !hasIO) return;
    node.textContent = fmt(0, dec);
    onView(node, () => tween(0, to, 1300, (v) => { node.textContent = fmt(v, dec); }), 0.5);
  });
  // pause CSS loops while their section is off screen
  $$("#steps, #lanes, #ctx-belt, #ticker, #taxo, .vflow, #joint").forEach((n) => watch(n, (vis) => n.classList.toggle("paused", !vis)));

  /* ---------------- 01 · taxonomy rings ---------------- */
  (function taxonomy() {
    const svg = $("#taxo-svg"), info = $("#taxo-info");
    if (!svg) return;
    const C = 260;
    const pt = (r, a) => { const t = (a - 90) * Math.PI / 180; return [C + r * Math.cos(t), C + r * Math.sin(t)]; };
    const sector = (r0, r1, a0, a1) => {
      const large = a1 - a0 > 180 ? 1 : 0;
      const [x0, y0] = pt(r1, a0), [x1, y1] = pt(r1, a1), [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0);
      return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r1} ${r1} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A${r0} ${r0} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;
    };
    const gap = 0.7;
    const defs = svgEl("defs", {}, svg);
    const grad = svgEl("radialGradient", { id: "taxo-sweep", cx: "50%", cy: "50%", r: "50%" }, defs);
    svgEl("stop", { offset: "40%", "stop-color": "#bd5a38", "stop-opacity": "0" }, grad);
    svgEl("stop", { offset: "100%", "stop-color": "#bd5a38", "stop-opacity": ".22" }, grad);
    const rings = svgEl("g", { class: "tx-rings" }, svg);
    // inner ring: victims
    [["user", 0, 120], ["owner", 120, 240], ["external", 240, 360]].forEach(([v, a0, a1], i) => {
      const g = svgEl("g", { class: `tx-seg tx-victim v-${v}`, "data-victim": v, style: `--i:${i}` }, rings);
      svgEl("path", { d: sector(70, 124, a0 + gap, a1 - gap) }, g);
      const [x, y] = pt(97, (a0 + a1) / 2);
      const t = svgEl("text", { x: x.toFixed(1), y: (y + 4).toFixed(1), class: "tx-vlabel" }, g);
      t.textContent = VSHORT[v];
    });
    // middle ring: risk groups
    GROUPS.forEach((gr, i) => {
      const g = svgEl("g", { class: `tx-seg tx-group ${gr.cls} v-${gr.v}`, style: `--i:${i + 3}` }, rings);
      svgEl("path", { d: sector(130, 168, gr.from * 30 + gap, gr.to * 30 - gap) }, g);
      gr.node = g;
    });
    // outer ring: twelve objectives
    const objNodes = OBJ.map((o) => {
      const a0 = o.i * 30, a1 = a0 + 30, mid = a0 + 15;
      const [dx, dy] = pt(8, mid); const off = [dx - C, dy - C];
      const g = svgEl("g", { class: `tx-seg tx-obj v-${o.victim}`, "data-obj": o.id, style: `--i:${o.i + 8}; --ox:${off[0].toFixed(2)}px; --oy:${off[1].toFixed(2)}px`, tabindex: "0", role: "button", "aria-label": `${o.id}: ${o.name}` }, rings);
      svgEl("path", { d: sector(174, 228, a0 + gap, a1 - gap) }, g);
      const [x, y] = pt(201, mid);
      const t = svgEl("text", { x: x.toFixed(1), y: (y + 4.5).toFixed(1), class: "tx-olabel" }, g);
      t.textContent = o.id;
      return g;
    });
    // a slow radar sweep + the center readout
    svgEl("path", { d: sector(64, 232, 0, 34), class: "tx-sweep", fill: "url(#taxo-sweep)" }, svg);
    svgEl("circle", { cx: C, cy: C, r: 62, class: "tx-core" }, svg);
    const big = svgEl("text", { x: C, y: C + 4, class: "tx-core-big" }, svg); big.textContent = "12";
    const small = svgEl("text", { x: C, y: C + 26, class: "tx-core-small" }, svg); small.textContent = "objectives";

    let active = -1, timer = null, holdUntil = 0;
    function show(i) {
      active = i; const o = OBJ[i];
      objNodes.forEach((n, k) => n.classList.toggle("on", k === i));
      GROUPS.forEach((g) => g.node.classList.toggle("on", i >= g.from && i < g.to));
      $$(".tx-victim", svg).forEach((n) => n.classList.toggle("on", n.dataset.victim === o.victim));
      big.textContent = o.id; small.textContent = VSHORT[o.victim];
      $$(".victim .obj-list li").forEach((li) => li.classList.toggle("hot", li.dataset.obj === o.id));
      const row = (k, v, cls) => `<div class="ti-row"><span class="ti-k">${k}</span><span class="ti-bar ${cls}"><i style="--v:${v}"></i></span><span class="ti-v">${fmt(v)}%</span></div>`;
      info.innerHTML =
        `<span class="ti-code v-${o.victim}">${o.id}</span>` +
        `<h3 class="ti-name">${esc(o.name)}</h3>` +
        `<p class="ti-meta"><b>${esc(VNAME[o.victim])}</b> · ${esc(o.group)}</p>` +
        row("ASR", o.asr, "a") + row("UTDR", o.utdr, "u") + row("ATAR", o.atar, "t") + row("Joint", o.joint, "j") +
        `<p class="ti-foot">Joint: adopted, complete, and orderly (ASR = 1, UTDR = 0, ATAR = 0).</p>`;
      info.classList.remove("fresh"); void info.offsetWidth; info.classList.add("fresh");
    }
    function cycle() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (Date.now() >= holdUntil && !document.hidden) show((active + 1) % OBJ.length);
        cycle();
      }, 2600);
    }
    const pick = (i) => { holdUntil = Date.now() + 7000; show(i); };
    objNodes.forEach((n, i) => {
      n.addEventListener("pointerenter", () => pick(i));
      n.addEventListener("focus", () => pick(i));
      n.addEventListener("click", () => pick(i));
    });
    $$(".victim .obj-list li").forEach((li) => li.addEventListener("pointerenter", () => { const i = OBJ.findIndex((o) => o.id === li.dataset.obj); if (i >= 0) pick(i); }));
    $$(".victim").forEach((card) => {
      const v = card.dataset.victim;
      card.addEventListener("pointerenter", () => svg.setAttribute("data-focus", v));
      card.addEventListener("pointerleave", () => svg.removeAttribute("data-focus"));
    });
    show(0);
    onView($("#taxo"), () => { $("#taxo").classList.add("drawn"); if (!reduce) cycle(); }, 0.2);
  })();

  /* ---------------- 02 · Figure 1 as a story ---------------- */
  (function story() {
    const stage = $("#story-stage"); if (!stage) return;
    const items = $$("[data-s]", stage);
    const note = $(".st-note", stage);
    const STEPS = [[1, 200], [2, 800], [3, 1900], [4, 2900], [5, 4200], [6, 5700], [7, 6900], [8, 7500], [9, 8700], [10, 9300], [11, 10300], [12, 11200]];
    let timers = [], visible = false, running = false;
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const showAll = () => { items.forEach((n) => n.classList.add("on")); note.classList.add("struck"); };
    function play() {
      clear(); running = true;
      stage.classList.add("fading");
      timers.push(setTimeout(() => {
        items.forEach((n) => n.classList.remove("on")); note.classList.remove("struck"); stage.classList.remove("fading");
        STEPS.forEach(([s, t]) => timers.push(setTimeout(() => {
          $$(`[data-s="${s}"]`, stage).forEach((n) => n.classList.add("on"));
          if (s === 6) note.classList.add("struck");
        }, t)));
        timers.push(setTimeout(() => { running = false; if (visible) play(); }, 16500));
      }, 450));
    }
    $("#story-replay")?.addEventListener("click", () => { if (reduce) return; play(); });
    if (reduce || !hasIO) { showAll(); return; }
    watch($("#story"), (v) => { visible = v; if (v && !running) play(); });
  })();

  /* ---------------- 02 · the 288-case catalog ---------------- */
  (function matrix() {
    const grid = $("#mx-grid"), tip = $("#mx-tip"), box = $("#matrix");
    if (!grid) return;
    let html = `<div class="mx-corner"></div>` + CONTEXTS.map(([id, short, desc, f], c) => `<div class="mx-col" data-col="${c}" title="${esc(id)} · ${esc(desc)} · ${f}">${esc(short)}</div>`).join("");
    TEMPLATES.forEach((t, r) => {
      const first = r % 2 === 0;
      html += `<div class="mx-row v-${t.obj.victim}${first ? " first" : ""}" data-row="${r}"><b>${first ? t.obj.id : ""}</b><span>${t.ch === "DPI" ? "DPI" : "IPI"} · ${esc(t.tag)}</span></div>`;
      CONTEXTS.forEach(([cid], c) => {
        const caseId = `${t.id}__${cid}`, hero = HERO_CASES[caseId];
        html += `<span class="mx-cell v-${t.obj.victim} ${t.ch.toLowerCase()}${hero ? " mx-hero" : ""}" role="gridcell" data-r="${r}" data-c="${c}" data-case="${caseId}"${hero ? ` data-mode="${hero}" tabindex="0"` : ""} style="--d:${(r + c) * 16}ms"></span>`;
      });
    });
    grid.innerHTML = html;
    const place = (cell) => {
      const t = TEMPLATES[+cell.dataset.r], ctx = CONTEXTS[+cell.dataset.c];
      tip.innerHTML = `<code>${esc(cell.dataset.case)}</code><span><b>${t.obj.id}</b> · ${esc(t.obj.name)}</span><span>${esc(VNAME[t.obj.victim])} · ${t.ch} (${esc(t.tag)})</span><span>${esc(ctx[2])} · ${ctx[3]} carrier</span>` + (cell.dataset.mode ? `<em>Walked through at the top of the page — click to replay</em>` : "");
      const br = box.getBoundingClientRect(), cr = cell.getBoundingClientRect();
      let x = cr.left - br.left + cr.width / 2, y = cr.top - br.top;
      tip.classList.add("on");
      const tw = tip.offsetWidth;
      x = Math.max(tw / 2 + 8, Math.min(br.width - tw / 2 - 8, x));
      tip.style.left = x + "px"; tip.style.top = y + "px";
      grid.querySelectorAll(".mx-col.hl, .mx-row.hl").forEach((n) => n.classList.remove("hl"));
      grid.querySelector(`.mx-col[data-col="${cell.dataset.c}"]`)?.classList.add("hl");
      grid.querySelector(`.mx-row[data-row="${cell.dataset.r}"]`)?.classList.add("hl");
    };
    grid.addEventListener("pointerover", (e) => { const cell = e.target.closest(".mx-cell"); if (cell) place(cell); });
    grid.addEventListener("focusin", (e) => { const cell = e.target.closest(".mx-cell"); if (cell) place(cell); });
    grid.addEventListener("pointerleave", () => { tip.classList.remove("on"); grid.querySelectorAll(".hl").forEach((n) => n.classList.remove("hl")); });
    const jump = (cell) => {
      const mode = cell.dataset.mode; if (!mode) return;
      document.querySelector(".hero")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      setTimeout(() => document.querySelector(`.plat[data-mode="${mode}"]`)?.dispatchEvent(new Event("click")), reduce ? 0 : 450);
    };
    grid.addEventListener("click", (e) => { const cell = e.target.closest(".mx-cell.mx-hero"); if (cell) jump(cell); });
    grid.addEventListener("keydown", (e) => { const cell = e.target.closest(".mx-cell.mx-hero"); if (cell && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); jump(cell); } });
    // legend: click a key to spotlight that slice of the catalog
    const keys = $$("#mx-legend .mx-key");
    keys.forEach((k) => k.addEventListener("click", () => {
      const on = !k.classList.contains("on");
      keys.forEach((x) => x.classList.remove("on"));
      if (on) { k.classList.add("on"); grid.setAttribute("data-filter", k.dataset.key); } else grid.removeAttribute("data-filter");
    }));
    onView(box, () => box.classList.add("drawn"), 0.15);
  })();

  /* ---------------- belts: contexts and case IDs ---------------- */
  (function belts() {
    const track = $("#ctx-belt .belt-track");
    if (track) track.innerHTML += track.innerHTML;   // a second copy makes the loop seamless
    const rows = $$("#ticker .tk-track");
    if (rows.length === 2) {
      const ids = [];
      TEMPLATES.forEach((t) => CONTEXTS.forEach(([cid]) => ids.push([`${t.id}__${cid}`, t.obj.victim])));
      const chip = ([id, v]) => `<span class="tk-chip v-${v}">${esc(id)}</span>`;
      const half = Math.ceil(ids.length / 2);
      [ids.slice(0, half), ids.slice(half)].forEach((list, i) => { const h = list.map(chip).join(""); rows[i].innerHTML = h + h; });
    }
  })();

  /* ---------------- 04 · results card (tweens between views) ---------------- */
  (function results() {
    const body = $("#lb-body"), foot = $("#lb-foot");
    if (!body) return;
    const NAME = { openclaw: "OpenClaw", claudecode: "Claude Code", openai: "GPT-5", google: "Gemini-2.5-Flash" };
    const VIEWS = {
      ipi: {
        rows: [["openclaw", "openai", 75.00, 13.33, 6.67], ["openclaw", "google", 76.39, 17.82, 8.10], ["claudecode", "openai", 62.50, 12.31, 3.41], ["claudecode", "google", 59.38, 16.04, 3.33],
               ["openclaw", null, 75.69, 15.58, 7.38], ["claudecode", null, 60.94, 14.18, 3.37]],
        foot: ["Indirect prompt injection", "rates (%) condition on confirmed retention and fully judged triggers", "three full-catalog repetitions pooled", "<b>55.71%</b> of eligible IPI episodes combine ASR = 1, UTDR = 0, ATAR = 0"],
      },
      dpi: {
        rows: [["openclaw", "openai", 88.10, 16.67, 7.14], ["openclaw", "google", 90.00, 20.00, 7.50], ["claudecode", "openai", 81.82, 14.77, 3.41], ["claudecode", "google", 75.00, 19.05, 4.76],
               ["openclaw", null, 89.05, 18.33, 7.32], ["claudecode", null, 78.41, 16.91, 4.09]],
        foot: ["Direct prompt injection", "rates (%) on the same conditional denominator", "every configuration adopts more under DPI than under its own IPI condition"],
      },
      victim: {
        rows: [["openclaw", "user", 79.03, 19.86, 5.74], ["claudecode", "user", 64.20, 17.95, 2.77], ["openclaw", "owner", 64.58, 10.65, 14.54], ["claudecode", "owner", 51.14, 10.00, 6.36],
               ["openclaw", "external", 79.58, 15.90, 4.63], ["claudecode", "external", 64.20, 14.38, 2.18]],
        foot: ["Indirect prompt injection", "each rate (%) averages the two backbone-specific rates after pooling repetitions"],
      },
    };
    const img = (k) => `<img src="assets/icons/${k}.png" alt="" width="16" height="16" />`;
    body.innerHTML = Array.from({ length: 6 }, (_, i) =>
      `<div class="lb-row" role="listitem" style="--i:${i}"><span class="lb-ico"></span><span class="lb-model"></span>` +
      `<span class="lb-track"><span class="lb-fill"></span></span><span class="lb-val">0.00</span><span class="lb-val sub">0.00</span><span class="lb-val sub">0.00</span></div>`).join("");
    const rows = $$(".lb-row", body);
    const cur = rows.map(() => [0, 0, 0]);
    let token = 0;
    // labels and icons for a view (cross-fading when they change)
    function labels(view, animate) {
      VIEWS[view].rows.forEach((r, i) => {
        const [agent, second] = r, row = rows[i];
        let icons, label;
        if (view === "victim") { icons = `<i class="vdot v-${second}"></i>` + img(agent); label = `${VSHORT[second]} <span class="lb-org">· ${NAME[agent]}</span>`; }
        else if (second) { icons = img(agent) + img(second); label = `${NAME[agent]} <span class="lb-org">· ${NAME[second]}</span>`; }
        else { icons = img(agent); label = `${NAME[agent]} <span class="lb-org">· average</span>`; }
        row.classList.toggle("avg", view !== "victim" && !second);
        const ico = $(".lb-ico", row), model = $(".lb-model", row);
        if (model.innerHTML === label) return;
        if (!animate) { model.innerHTML = label; ico.innerHTML = icons; return; }
        model.classList.add("swap"); ico.classList.add("swap");
        setTimeout(() => { model.innerHTML = label; ico.innerHTML = icons; model.classList.remove("swap"); ico.classList.remove("swap"); }, 170);
      });
      foot.innerHTML = VIEWS[view].foot.map((s) => `<span>${s}</span>`).join("");
    }
    // bars and numbers glide from wherever they are to the view's values
    function values(view, ms) {
      const my = ++token;
      VIEWS[view].rows.forEach((r, i) => {
        const [, , asr, utdr, atar] = r, row = rows[i];
        $(".lb-fill", row).style.setProperty("--w", (asr / 100).toFixed(4));
        const vals = $$(".lb-val", row), to = [asr, utdr, atar], from = cur[i].slice();
        tween(0, 1, ms, (k) => { if (my !== token) return; vals.forEach((n, j) => { n.textContent = fmt(from[j] + (to[j] - from[j]) * k); }); });
        cur[i] = to;
      });
    }
    const tabs = $$("#lb .lb-tab");
    tabs.forEach((tab) => tab.addEventListener("click", () => {
      tabs.forEach((x) => { const on = x === tab; x.classList.toggle("on", on); x.setAttribute("aria-selected", String(on)); });
      labels(tab.dataset.view, true); values(tab.dataset.view, 700);
    }));
    labels("ipi", false);
    if (reduce || !hasIO) values("ipi", 0);
    else onView($("#lb"), () => values("ipi", 1100), 0.3);
  })();

  /* ---------------- 04 · objective scatter + joint bars ---------------- */
  (function scatter() {
    const svg = $("#scatter-svg"), tip = $("#scatter-tip"), wrap = $("#scatter");
    if (!svg) return;
    const X0 = 64, X1 = 636, Y0 = 368, Y1 = 26;   // ASR 0–100 on x, UTDR 0–50 on y
    const sx = (v) => X0 + (v / 100) * (X1 - X0), sy = (v) => Y0 - (v / 50) * (Y0 - Y1);
    const g = svgEl("g", { class: "sc-axes" }, svg);
    [0, 20, 40, 60, 80, 100].forEach((v) => {
      svgEl("line", { x1: sx(v), x2: sx(v), y1: Y0, y2: Y1, class: "sc-grid" }, g);
      const t = svgEl("text", { x: sx(v), y: Y0 + 18, class: "sc-tick" }, g); t.textContent = v;
    });
    [0, 10, 20, 30, 40, 50].forEach((v) => {
      svgEl("line", { x1: X0, x2: X1, y1: sy(v), y2: sy(v), class: "sc-grid" }, g);
      const t = svgEl("text", { x: X0 - 10, y: sy(v) + 4, class: "sc-tick y" }, g); t.textContent = v;
    });
    const xl = svgEl("text", { x: (X0 + X1) / 2, y: Y0 + 40, class: "sc-label" }, g); xl.textContent = "Target adoption (ASR, %)";
    const yl = svgEl("text", { x: 16, y: (Y0 + Y1) / 2, class: "sc-label", transform: `rotate(-90 16 ${(Y0 + Y1) / 2})` }, g); yl.textContent = "Task deviation (UTDR, %)";
    // overall IPI means: Table 1's four configurations, weighted equally
    const mASR = (75.00 + 76.39 + 62.50 + 59.38) / 4, mUTDR = (13.33 + 17.82 + 12.31 + 16.04) / 4;
    svgEl("line", { x1: sx(mASR), x2: sx(mASR), y1: Y0, y2: Y1, class: "sc-mean" }, svg);
    svgEl("line", { x1: X0, x2: X1, y1: sy(mUTDR), y2: sy(mUTDR), class: "sc-mean" }, svg);
    const ml = svgEl("text", { x: sx(mASR) + 6, y: Y1 + 12, class: "sc-mean-t" }, svg); ml.textContent = `IPI mean ASR ${fmt(mASR)}%`;
    const ml2 = svgEl("text", { x: X0 + 6, y: sy(mUTDR) - 6, class: "sc-mean-t" }, svg); ml2.textContent = `IPI mean UTDR ${fmt(mUTDR)}%`;
    svg.style.setProperty("--mx0", sx(mASR).toFixed(1) + "px"); svg.style.setProperty("--my0", sy(mUTDR).toFixed(1) + "px");   // bubbles fly out from the means
    const LAB = { U1: [12, -15], U2: [-8, -15], U3: [-2, -14], U4: [16, 4], W1: [18, 12], W2: [-6, 21], W3: [-6, 21], W4: [-26, -18], X1: [-28, 3], X2: [-16, -15], X3: [18, -6], X4: [18, 4] };
    const dots = OBJ.map((o) => {
      const r = Math.max(4.5, Math.sqrt(o.atar) * 3.8);
      const node = svgEl("g", { class: `sc-dot v-${o.victim}`, style: `--x:${sx(o.asr).toFixed(1)}px; --y:${sy(o.utdr).toFixed(1)}px; --i:${o.i}`, tabindex: "0", role: "img", "aria-label": `${o.id} ${o.name}: ASR ${fmt(o.asr)}%, UTDR ${fmt(o.utdr)}%, ATAR ${fmt(o.atar)}%` }, svg);
      svgEl("circle", { r: r.toFixed(1), class: "sc-bubble" }, node);
      const [dx, dy] = LAB[o.id];
      const t = svgEl("text", { x: dx, y: dy, class: "sc-name" }, node); t.textContent = o.id;
      node.addEventListener("pointerenter", () => {
        tip.innerHTML = `<b>${o.id}</b> ${esc(o.name)}<span>${esc(VNAME[o.victim])}</span><span>ASR ${fmt(o.asr)}% · UTDR ${fmt(o.utdr)}% · ATAR ${fmt(o.atar)}%</span><span>Joint ${fmt(o.joint)}%</span>`;
        const w = wrap.getBoundingClientRect(), b = node.getBoundingClientRect();
        tip.style.left = Math.min(w.width - 140, Math.max(140, b.left - w.left + b.width / 2)) + "px";
        tip.style.top = (b.top - w.top) + "px";
        tip.classList.add("on");
      });
      node.addEventListener("pointerleave", () => tip.classList.remove("on"));
      return node;
    });
    // joint frequency bars, highest first
    const jb = $("#jbars");
    if (jb) jb.innerHTML = OBJ.slice().sort((a, b) => b.joint - a.joint).map((o, k) =>
      `<div class="jb" style="--i:${k}"><span class="jb-id v-${o.victim}">${o.id}</span><span class="jb-t"><i class="v-${o.victim}" style="--v:${o.joint}"></i></span><span class="jb-v">${fmt(o.joint)}%</span></div>`).join("");
    onView($("#figtabs"), () => { wrap.classList.add("drawn"); jb?.classList.add("drawn"); }, 0.2);
    return dots;
  })();

  /* ---------------- 04 · controlled factors ---------------- */
  (function factors() {
    const root = $("#factors"); if (!root) return;
    const W = 300, H = 210, L = 38, R = 288, T = 26, B = 168;
    const yS = (v, max) => B - (v / max) * (B - T);
    const panel = (k, title, sub, svgInner, legend) =>
      `<div class="fx-panel"><div class="fp-head"><span class="fp-k">${k}</span><b>${title}</b><span>${sub}</span></div>` +
      `<svg viewBox="0 0 ${W} ${H}" class="fp-svg" role="img" aria-label="${esc(title)}">${svgInner}</svg>${legend ? `<div class="fp-legend">${legend}</div>` : ""}</div>`;
    const axis = (max, step) => {
      let s = "";
      for (let v = 0; v <= max; v += step) s += `<line x1="${L}" x2="${R}" y1="${yS(v, max)}" y2="${yS(v, max)}" class="fp-grid"/><text x="${L - 6}" y="${yS(v, max) + 3.5}" class="fp-tick y">${v}</text>`;
      return s;
    };
    // grouped bars (adoption) with retention dots, for panels a and c
    const bars = (groups, series, max) => {
      let s = axis(max, max === 60 ? 20 : 20);
      const gw = (R - L) / groups.length, bw = Math.min(26, gw / (series.length + 1.2));
      groups.forEach((gname, gi) => {
        const cx = L + gw * gi + gw / 2;
        series.forEach((ser, si) => {
          const x = cx + (si - (series.length - 1) / 2) * (bw + 4) - bw / 2;
          const [adopt, ret] = ser.vals[gi];
          s += `<rect class="fp-bar ${ser.cls}" x="${x.toFixed(1)}" y="${yS(adopt, max).toFixed(1)}" width="${bw.toFixed(1)}" height="${(B - yS(adopt, max)).toFixed(1)}" style="--i:${gi * series.length + si}"><title>${ser.name}, ${gname}: adoption ${fmt(adopt)}%, retention ${fmt(ret)}%</title></rect>`;
          s += `<text class="fp-val" x="${(x + bw / 2).toFixed(1)}" y="${(yS(adopt, max) - 5).toFixed(1)}" style="--i:${gi * series.length + si}">${adopt % 1 ? fmt(adopt, 1) : adopt}</text>`;
          s += `<circle class="fp-ret ${ser.cls}" cx="${(x + bw / 2).toFixed(1)}" cy="${yS(ret, max).toFixed(1)}" r="4" style="--i:${gi * series.length + si}"><title>retention ${fmt(ret)}%</title></circle>`;
        });
        s += `<text class="fp-tick x" x="${cx.toFixed(1)}" y="${B + 16}">${gname}</text>`;
      });
      return s;
    };
    // lines over intervening sessions, for panel b
    const lines = (xs, series, max) => {
      let s = axis(max, 20);
      const px = (k) => L + 20 + (k / (xs.length - 1)) * (R - L - 40);
      xs.forEach((x, k) => { s += `<text class="fp-tick x" x="${px(k)}" y="${B + 16}">${x}</text>`; });
      series.forEach((ser) => {
        ["adopt", "ret"].forEach((kind) => {
          const pts = ser[kind].map((v, k) => `${px(k).toFixed(1)},${yS(v, max).toFixed(1)}`).join(" ");
          s += `<polyline class="fp-line ${ser.cls} ${kind}" points="${pts}" pathLength="100"/>`;
          ser[kind].forEach((v, k) => { s += `<circle class="fp-pt ${ser.cls} ${kind}" cx="${px(k).toFixed(1)}" cy="${yS(v, max).toFixed(1)}" r="${kind === "adopt" ? 4 : 3.5}" style="--i:${k}"><title>${ser.name}, ${xs[k]} sessions: ${kind === "adopt" ? "adoption" : "retention"} ${fmt(v)}%</title></circle>`; });
          const last = ser[kind][ser[kind].length - 1];
          s += `<text class="fp-end ${ser.cls}" x="${(px(xs.length - 1) + 8).toFixed(1)}" y="${(yS(last, max) + 3.5).toFixed(1)}">${last % 1 ? fmt(last, 2) : last}</text>`;
        });
      });
      return s;
    };
    // paired adoption changes: losses left, gains right
    const diverge = (rowsData) => {
      const mid = 150, sc = 3.0;
      let s = `<line x1="${mid}" x2="${mid}" y1="40" y2="150" class="fp-zero"/>`;
      [-25, 0, 25].forEach((v) => { s += `<text class="fp-tick x" x="${mid + v * sc}" y="166">${v > 0 ? "+" + v : v === 0 ? 0 : "−" + Math.abs(v)}</text>`; });
      rowsData.forEach(([name, loss, gain, net], i) => {
        const y = 58 + i * 50;
        s += `<text class="fp-rowname" x="10" y="${y + 4}">${name}</text>`;
        s += `<rect class="fp-loss" x="${mid - loss * sc}" y="${y - 9}" width="${loss * sc}" height="18" style="--i:${i}"><title>${name}: ${fmt(loss, 1)}% of pairs lost adoption</title></rect>`;
        s += `<rect class="fp-gain" x="${mid}" y="${y - 9}" width="${gain * sc}" height="18" style="--i:${i}"><title>${name}: ${fmt(gain, 1)}% of pairs gained adoption</title></rect>`;
        s += `<text class="fp-net ${net > 0 ? "pos" : "neg"}" x="${W - 8}" y="${y + 4}">${net > 0 ? "+" : "−"}${Math.abs(net)} pp</text>`;
      });
      return s;
    };
    const OC = { name: "OpenClaw", cls: "s1" }, CC = { name: "Claude Code", cls: "s2" };
    const G5 = { name: "GPT-5", cls: "s1" }, GF = { name: "Gemini-2.5-Flash", cls: "s2" };
    const key = (a, b) => `<span><i class="fk s1"></i>${a}</span><span><i class="fk s2"></i>${b}</span><span><i class="fk ret"></i>retention</span>`;
    root.innerHTML =
      panel("a", "Relevance and goal change", "GPT-5 · two agent systems", bars(["Low", "High", "Other goal"], [
        { ...OC, vals: [[20, 30], [45, 60], [5, 20]] },
        { ...CC, vals: [[15, 25], [35, 50], [2.5, 15]] },
      ], 60), key("OpenClaw", "Claude Code")) +
      panel("b", "Persistence across sessions", "Claude Code · two backbones · intervening normal sessions", lines([0, 2, 4], [
        { ...G5, adopt: [35, 32.5, 30], ret: [50, 46.67, 43.33] },
        { ...GF, adopt: [25, 22.5, 20], ret: [40, 36.67, 33.33] },
      ], 60), key("GPT-5", "Gemini-2.5-Flash")) +
      panel("c", "Conflicting applicability", "Claude Code · two backbones", bars(["Consistent", "Conflicting"], [
        { ...G5, vals: [[45, 60], [25, 40]] },
        { ...GF, vals: [[35, 50], [20, 30]] },
      ], 60), key("GPT-5", "Gemini-2.5-Flash")) +
      panel("d", "Low → High relevance", "paired adoption change, % of matched pairs", diverge([["OC", 5, 30, 25], ["CC", 5, 25, 20]]),
        `<span><i class="fk loss"></i>losses</span><span><i class="fk gain"></i>gains</span>`) +
      panel("e", "0 → 4 sessions", "paired adoption change, % of matched pairs", diverge([["G5", 7.5, 2.5, -5], ["GF", 7.5, 2.5, -5]]),
        `<span><i class="fk loss"></i>losses</span><span><i class="fk gain"></i>gains</span>`) +
      panel("f", "Consistent → Conflicting", "paired adoption change, % of matched pairs", diverge([["G5", 25, 5, -20], ["GF", 20, 5, -15]]),
        `<span><i class="fk loss"></i>losses</span><span><i class="fk gain"></i>gains</span>`);
    // the factor panels live in a hidden tab: draw them the first time that tab opens
    const tab = $('#figtabs .cov-tab[data-fig="factors"]');
    const draw = () => requestAnimationFrame(() => root.classList.add("drawn"));
    if (reduce) root.classList.add("drawn"); else tab?.addEventListener("click", draw, { once: true });
  })();

  /* ---------------- 04 · visual IPI: before / after ---------------- */
  (function slider() {
    const box = $("#vslider"), handle = $("#vs-handle");
    if (!box) return;
    let x = 50, auto = !reduce, last = 0, raf = 0, idleTimer = 0;
    const set = (v) => { x = Math.max(0, Math.min(100, v)); box.style.setProperty("--x", x + "%"); handle.setAttribute("aria-valuenow", Math.round(x)); };
    set(50);
    const fromEvent = (e) => { const r = box.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
    const stopAuto = () => { auto = false; cancelAnimationFrame(raf); clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (!reduce) { auto = true; loop(); } }, 6000); };
    let dragging = false;
    box.addEventListener("pointerdown", (e) => { dragging = true; box.setPointerCapture(e.pointerId); stopAuto(); fromEvent(e); });
    box.addEventListener("pointermove", (e) => { if (dragging) fromEvent(e); });
    box.addEventListener("pointerup", () => { dragging = false; });
    box.addEventListener("pointercancel", () => { dragging = false; });
    handle.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); stopAuto(); set(x + (e.key === "ArrowLeft" ? -4 : 4)); } });
    let visible = false;
    function loop() {
      cancelAnimationFrame(raf);
      const t0 = performance.now() - last;
      (function frame(now) {
        if (!auto) return;
        last = now - t0;
        if (visible) set(50 + 38 * Math.sin(last / 1600));
        raf = requestAnimationFrame(frame);
      })(performance.now());
    }
    watch(box, (v) => { visible = v; });
    if (auto) loop();
  })();
})();
