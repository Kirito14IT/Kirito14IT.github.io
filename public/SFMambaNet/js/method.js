/* Method figures, animated:
   - the architecture strip of the paper (matches as strands through two pruning blocks and a verification block),
   - LSGA: nearby offsets split apart in Fourier features; tokens are grouped by cluster, scanned both ways, restored,
   - SIGM: a feature sequence along the cluster order loses its high-frequency deviations at the gates. */
(function () {
  'use strict';
  const UI = window.SFMUI, T = window.SFM_TEASER;
  if (!UI) return;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, a, parent) => {
    const e = document.createElementNS(NS, tag);
    if (a) for (const k in a) e.setAttribute(k, a[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const rand = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const motion = !UI.reduced;

  /* ======================= architecture ======================= */
  const arch = document.getElementById('archSvg');
  if (arch) {
    const W = 1120, H = 268;
    arch.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const defs = mk('defs', null, arch);
    const lin = (id, c0, c1) => {
      const g = mk('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
      mk('stop', { offset: 0, 'stop-color': c0 }, g); mk('stop', { offset: 1, 'stop-color': c1 }, g);
    };
    lin('gB1', '#2f73ff', '#3a2fc4'); lin('gB2', '#6d3cff', '#b3249d'); lin('gV', '#17cf9f', '#0b7c66');
    const bp = mk('linearGradient', { id: 'bypassGrad', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    [['0', '#22d3ff'], ['0.5', '#8a63ff'], ['1', '#4cf2b8']].forEach(s => mk('stop', { offset: s[0], 'stop-color': s[1] }, bp));
    const pg = mk('linearGradient', { id: 'peelGrad', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    mk('stop', { offset: 0, 'stop-color': '#ff4f4f', 'stop-opacity': 0.95 }, pg); mk('stop', { offset: 1, 'stop-color': '#ff4f4f', 'stop-opacity': 0 }, pg);
    const fl = mk('filter', { id: 'blkGlow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    mk('feGaussianBlur', { stdDeviation: 12 }, fl);

    /* input and output thumbnails: the teaser pair with its drawn matches (input) and only the inliers (output) */
    const TH = { y: 100, w: 176, h: 51 };
    const LAY = T ? T.a.layout : { l: [0, 0, 0.488, 1], r: [0.5127, 0, 1, 1] };
    [{ x: 0, all: true, label: 'N putative matches' }, { x: W - TH.w, all: false, label: 'verified matches' }].forEach((t, i) => {
      const cp = mk('clipPath', { id: 'thClip' + i }, defs);
      mk('rect', { x: t.x, y: TH.y, width: TH.w, height: TH.h, rx: 7 }, cp);
      const g = mk('g', { 'clip-path': 'url(#thClip' + i + ')' }, arch);
      mk('rect', { x: t.x, y: TH.y, width: TH.w, height: TH.h, fill: '#02060f' }, g);
      ['l', 'r'].forEach(side => mk('image', {
        href: 'assets/teaser/pair-' + side + '.webp', x: t.x + LAY[side][0] * TH.w, y: TH.y,
        width: (LAY[side][2] - LAY[side][0]) * TH.w, height: TH.h, preserveAspectRatio: 'none', opacity: 0.8,
      }, g));
      if (T) {
        const add = (arr, stroke, w) => {
          let d = '';
          for (let k = 0; k < arr.length; k += 4) {
            d += 'M' + (t.x + arr[k] * TH.w).toFixed(1) + ' ' + (TH.y + arr[k + 1] * TH.h).toFixed(1) +
              'L' + (t.x + arr[k + 2] * TH.w).toFixed(1) + ' ' + (TH.y + arr[k + 3] * TH.h).toFixed(1);
          }
          mk('path', { d, stroke, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round' }, g);
        };
        if (t.all) add(T.a.red, 'rgba(255,79,79,.9)', 0.5);
        add(T.a.green, 'rgba(255,255,255,.85)', 1.3);
        add(T.a.green, '#2bff6a', 0.7);
      }
      mk('rect', { class: 'arch-thumb', x: t.x + 0.5, y: TH.y + 0.5, width: TH.w - 1, height: TH.h - 1, rx: 7, fill: 'none' }, arch);
      mk('text', { class: 'arch-label', x: t.x + TH.w / 2, y: TH.y + TH.h + 20 }, arch).textContent = t.label;
    });

    const BY = 76, BH = 100, BW = 136;
    const BLOCKS = [
      { id: 'b1', x: 252, fill: 'url(#gB1)', stroke: '#7aa2ff', glow: '#3e6bff', text: ['Pruning', 'Block'], name: 'First pruning block' },
      { id: 'b2', x: 504, fill: 'url(#gB2)', stroke: '#c9a3ff', glow: '#a03cff', text: ['Pruning', 'Block'], name: 'Second pruning block' },
      { id: 'v', x: 756, fill: 'url(#gV)', stroke: '#7ff7d3', glow: '#18d49f', text: ['Verification', 'Block'], name: 'Verification block' },
    ];

    /* strands: inliers are smooth, outliers jagged */
    const R = rand(11);
    const smooth = (xa, ya, xb, yb, amp, ph) => {
      let d = 'M' + xa + ' ' + ya.toFixed(1);
      for (let i = 1; i <= 18; i++) {
        const t = i / 18, s = t * t * (3 - 2 * t);
        d += 'L' + (xa + (xb - xa) * t).toFixed(1) + ' ' + (ya + (yb - ya) * s + Math.sin(t * Math.PI * 2 + ph) * amp * Math.sin(Math.PI * t)).toFixed(1);
      }
      return d;
    };
    const jagged = (xa, ya, xb, yb, amp) => {
      let d = 'M' + xa + ' ' + ya.toFixed(1);
      for (let i = 1; i <= 10; i++) {
        const t = i / 10, s = t * t * (3 - 2 * t);
        d += 'L' + (xa + (xb - xa) * t).toFixed(1) + ' ' + (ya + (yb - ya) * s + (R() - 0.5) * 2 * amp * Math.sin(Math.PI * t)).toFixed(1);
      }
      return d;
    };
    const gS = mk('g', null, arch);
    const packets = [];
    const strand = (kind, d, extra) => {
      mk('path', { class: 'strand ' + kind + ' base', d }, gS);
      const p = mk('path', { class: 'strand ' + kind + ' flow' + (extra ? ' ' + extra : ''), d }, gS);
      if (kind === 'g') packets.push(d);
      return p;
    };
    const segment = (xa, xb, kinds, ya0, yaStep, yb0, ybStep) => kinds.split('').forEach((k, i) => {
      const ya = ya0 + i * yaStep, yb = yb0 + i * ybStep;
      if (k === 'g') strand('g', smooth(xa, ya, xb, yb, 3.2, i * 1.3));
      else strand('r', jagged(xa, ya, xb, yb, 9));
    });
    segment(176, 258, 'grrgrrgrrgrr', 104, 3.8, 92, 6.4);
    segment(382, 510, 'grgrgrgr', 98, 8.4, 100, 7.6);
    segment(634, 762, 'ggrggr', 104, 9, 106, 8.6);
    segment(886, 944, 'gggg', 110, 10, 108, 10);
    const peel = (x, y, x2, y2) => mk('path', { class: 'strand r peel', d: 'M' + x + ' ' + y + ' C ' + (x + 40) + ' ' + y + ', ' + (x + 50) + ' ' + (y + 56) + ', ' + x2 + ' ' + y2, stroke: 'url(#peelGrad)' }, gS);
    [0, 1, 2, 3].forEach(j => peel(382, 146 + j * 7, 430 + j * 12, 236));
    [0, 1].forEach(j => peel(634, 152 + j * 8, 684 + j * 14, 236));
    /* the bypass: all N correspondences go straight to verification */
    const byD = 'M150 100 C 150 44, 214 34, 290 34 L 760 34 C 806 34, 824 46, 824 78';
    mk('path', { class: 'strand bypass flow slow', d: byD }, gS);
    mk('path', { class: 'strand bypass', d: byD, transform: 'translate(0 -5)', style: 'opacity:.35' }, gS);
    mk('text', { class: 'arch-label c', x: 520, y: 22 }, arch).textContent = 'all N correspondences';
    [['N × 4', 214, 86], ['N/2 × 4', 446, 88], ['N/4 × 4', 698, 92]].forEach(l => mk('text', { class: 'arch-label', x: l[1], y: l[2] }, arch).textContent = l[0]);
    [['keep top half', 458, 260], ['keep top half', 708, 260]].forEach(l => mk('text', { class: 'arch-label r', x: l[1], y: l[2] }, arch).textContent = l[0]);
    mk('text', { class: 'arch-label g', x: 824, y: 200 }, arch).textContent = 'recover inliers';

    /* light packets travelling along the inlier strands */
    if (motion) packets.forEach((d, i) => {
      if (i % 2) return;
      const c = mk('circle', { r: 2.4, fill: '#c9ffe0', opacity: 0.95 }, gS);
      mk('animateMotion', { dur: (1.6 + (i % 3) * 0.35) + 's', repeatCount: 'indefinite', path: d, begin: (-i * 0.37).toFixed(2) + 's' }, c);
    });

    /* blocks */
    const blkEls = {};
    BLOCKS.forEach(b => {
      const g = mk('g', { class: 'blk', tabindex: 0, role: 'button', 'aria-label': b.name }, arch);
      mk('rect', { class: 'halo', x: b.x - 4, y: BY - 4, width: BW + 8, height: BH + 8, rx: 22, fill: b.glow, filter: 'url(#blkGlow)' }, g);
      mk('rect', { class: 'box', x: b.x, y: BY, width: BW, height: BH, rx: 16, fill: b.fill, stroke: b.stroke }, g);
      mk('rect', { x: b.x + 2, y: BY + 2, width: BW - 4, height: BH * 0.46, rx: 14, fill: 'rgba(255,255,255,.08)' }, g);
      b.text.forEach((t, i) => mk('text', { x: b.x + BW / 2, y: BY + 40 + i * 23, 'font-size': 19 }, g).textContent = t);
      if (b.id !== 'v') {
        let d = '';
        for (let i = 0; i <= 40; i++) { const t = i / 40; d += (i ? 'L' : 'M') + (b.x + 22 + t * (BW - 44)).toFixed(1) + ' ' + (BY + 84 + Math.sin(t * Math.PI * 5) * 4).toFixed(1); }
        mk('path', { class: 'wave', d }, g);
      } else {
        mk('rect', { x: b.x + 38, y: BY + 74, width: 60, height: 16, rx: 4, fill: 'rgba(255,255,255,.08)', stroke: 'rgba(255,255,255,.6)' }, g);
        mk('line', { x1: b.x + 44, y1: BY + 86, x2: b.x + 92, y2: BY + 78, stroke: '#fff', 'stroke-width': 1.4 }, g);
        mk('circle', { cx: b.x + 68, cy: BY + 82, r: 2.6, fill: '#fff' }, g);
      }
      blkEls[b.id] = g;
    });

    const cards = [...document.querySelectorAll('.blockcard')];
    const activate = id => {
      Object.keys(blkEls).forEach(k => blkEls[k].classList.toggle('on', k === id));
      cards.forEach(c => c.classList.toggle('on', (c.dataset.for || '').split(' ').indexOf(id) >= 0));
    };
    let auto = 0, picked = false, si = 0;
    const SEQ = ['b1', 'b2', 'v'];
    Object.keys(blkEls).forEach(id => {
      const g = blkEls[id];
      const pick = () => { picked = true; clearInterval(auto); activate(id); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
    UI.watch(arch, v => {
      clearInterval(auto);
      if (!v || picked) return;
      activate(SEQ[si]);
      if (motion) auto = setInterval(() => { si = (si + 1) % SEQ.length; activate(SEQ[si]); }, 2600);
    }, 0.3);
  }

  /* ======================= LSGA ======================= */
  const lsga = document.getElementById('lsgaAnim');
  if (lsga) {
    mk('text', { class: 'mod-lab hl', x: 0, y: 12 }, lsga).textContent = 'NEARBY OFFSETS → FOURIER FEATURES';
    mk('text', { class: 'mod-lab', x: 512, y: 12, 'text-anchor': 'end', fill: '#39ff8f', style: 'fill:#39ff8f' }, lsga).textContent = 'inlier';
    mk('text', { class: 'mod-lab', x: 462, y: 12, 'text-anchor': 'end', style: 'fill:#ff6b6b' }, lsga).textContent = 'outlier ·';
    /* two nearby offsets from one centre */
    const cx = 30, cy = 66;
    const arrow = (x2, y2, col) => {
      mk('line', { x1: cx, y1: cy, x2, y2, stroke: col, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, lsga);
      mk('circle', { cx: x2, cy: y2, r: 3.4, fill: col }, lsga);
    };
    arrow(cx + 40, cy - 26, '#39ff8f');
    arrow(cx + 46, cy - 18, '#ff4f4f');
    mk('circle', { cx, cy, r: 4.5, fill: '#e9efff' }, lsga);
    mk('text', { class: 'mod-lab', x: cx - 6, y: cy + 26 }, lsga).textContent = 'ΔC';
    const X0 = 106, X1 = 512, Y = 62, A = 21;
    mk('line', { x1: X0, x2: X1, y1: Y + 32, y2: Y + 32, stroke: 'rgba(130,170,255,.2)' }, lsga);
    mk('text', { class: 'mod-lab', x: X0, y: Y + 48 }, lsga).textContent = 'low';
    mk('text', { class: 'mod-lab', x: X1, y: Y + 48, 'text-anchor': 'end' }, lsga).textContent = 'high frequency b →';
    const pIn = mk('path', { fill: 'none', stroke: '#39ff8f', 'stroke-width': 2, 'stroke-linejoin': 'round' }, lsga);
    const pOut = mk('path', { fill: 'none', stroke: '#ff4f4f', 'stroke-width': 2, 'stroke-linejoin': 'round', opacity: 0.9 }, lsga);
    const wave = (dc, ph) => {
      let d = '';
      for (let i = 0; i <= 160; i++) {
        const t = i / 160, b = 0.35 + t * 7.6;
        d += (i ? 'L' : 'M') + (X0 + t * (X1 - X0)).toFixed(1) + ' ' + (Y - A * Math.sin(2 * Math.PI * b * dc + ph)).toFixed(1);
      }
      return d;
    };
    const drawWaves = ph => { pIn.setAttribute('d', wave(1.0, ph)); pOut.setAttribute('d', wave(1.09, ph)); };
    drawWaves(0);

    /* tokens: grouped by cluster, scanned both ways, restored */
    const COLS = ['#22d3ff', '#3e6bff', '#8a63ff', '#e04ad0'];
    const N = 16, S = 29, TW = 22, TX = 28, TY = 158;
    const lab = mk('text', { class: 'tok-lab', x: 0, y: 140 }, lsga);
    const brackets = COLS.map((c, k) => mk('line', { x1: TX + k * 4 * S, x2: TX + k * 4 * S + 4 * S - 7, y1: TY + TW + 10, y2: TY + TW + 10, stroke: c, 'stroke-width': 2.5, 'stroke-linecap': 'round', style: 'opacity:0;transition:opacity .5s' }, lsga));
    const toks = [];
    for (let i = 0; i < N; i++) {
      const g = mk('g', { class: 'tok' }, lsga);
      mk('rect', { width: TW, height: TW, rx: 5, fill: COLS[i >> 2], opacity: 0.92 }, g);
      toks.push(g);
    }
    const head = mk('rect', { x: -4, y: TY - 4, width: TW + 8, height: TW + 8, rx: 8, fill: 'none', stroke: '#fff', 'stroke-width': 1.6, style: 'opacity:0;transition:opacity .3s;filter:drop-shadow(0 0 6px #22d3ff)' }, lsga);
    const dirTxt = mk('text', { class: 'tok-lab', x: 512, y: 140, 'text-anchor': 'end' }, lsga);
    const R3 = rand(5);
    const perm = n => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(R3() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const inputSlot = perm(N);
    let clusterSlot = [];
    const regroup = () => {
      clusterSlot = new Array(N);
      for (let c = 0; c < 4; c++) { const p = perm(4); for (let r = 0; r < 4; r++) clusterSlot[c * 4 + r] = c * 4 + p[r]; }
    };
    const placeAll = slots => toks.forEach((g, i) => { g.style.transform = 'translate(' + (TX + slots[i] * S) + 'px,' + TY + 'px)'; });
    const showBrackets = on => brackets.forEach(b => { b.style.opacity = on ? 1 : 0; });
    regroup();

    let timers = [], running = false, visible = false, cancelHead = null, raf = 0, t0 = 0;
    const later = (ms, f) => timers.push(setTimeout(f, ms));
    const sweep = (a, b, ms) => {
      head.style.opacity = 1;
      if (cancelHead) cancelHead();
      cancelHead = UI.tween(ms, k => { head.setAttribute('x', (TX + (a + (b - a) * k) * S - 4).toFixed(1)); }, null, UI.ease.inOut);
    };
    function cycle() {
      timers.forEach(clearTimeout); timers = [];
      if (!visible) { running = false; return; }
      running = true;
      lab.textContent = 'INPUT ORDER'; dirTxt.textContent = '';
      placeAll(inputSlot); showBrackets(false); head.style.opacity = 0;
      later(1100, () => { regroup(); placeAll(clusterSlot); lab.textContent = 'Π · GROUPED BY CLUSTER'; });
      later(2300, () => { showBrackets(true); lab.textContent = 'BIMAMBA'; dirTxt.textContent = 'forward →'; sweep(0, N - 1, 1300); });
      later(3750, () => { dirTxt.textContent = '← backward'; sweep(N - 1, 0, 1300); });
      later(5250, () => { head.style.opacity = 0; showBrackets(false); dirTxt.textContent = ''; placeAll(inputSlot); lab.textContent = 'Π⁻¹ · INPUT ORDER RESTORED'; });
      later(7700, cycle);
    }
    const waveLoop = now => {
      raf = 0;
      if (!visible) return;
      if (!t0) t0 = now;
      drawWaves((now - t0) / 1000 * 2.2);
      raf = requestAnimationFrame(waveLoop);
    };
    if (!motion) {
      placeAll(clusterSlot); showBrackets(true); lab.textContent = 'Π · GROUPED BY CLUSTER';
    } else {
      placeAll(inputSlot);
      UI.watch(lsga, v => {
        visible = v;
        if (v) { if (!running) cycle(); if (!raf) raf = requestAnimationFrame(waveLoop); }
      });
    }
  }

  /* ======================= SIGM ======================= */
  const sigm = document.getElementById('sigmAnim');
  if (sigm) {
    const CHIPS = [['Mamba →', 0], ['gate W¹', 1], ['flip', 0], ['Mamba ←', 0], ['gate W²', 1], ['flip', 0], ['+ · LN', 0]];
    const widths = CHIPS.map(c => 16 + 7.4 * c[0].length), GAP = 12;
    let x = (520 - (widths.reduce((a, b) => a + b, 0) + GAP * (CHIPS.length - 1))) / 2;
    const chipEls = CHIPS.map((c, i) => {
      const g = mk('g', { class: 'chip-g' + (c[1] ? ' gate' : '') }, sigm);
      mk('rect', { class: 'chip-box', x, y: 8, width: widths[i], height: 28, rx: 8 }, g);
      mk('text', { x: x + widths[i] / 2, y: 26.5 }, g).textContent = c[0];
      if (i < CHIPS.length - 1) {
        const ax = x + widths[i] + 2;
        mk('path', { d: 'M' + ax + ' 22 L' + (ax + GAP - 5) + ' 22 M' + (ax + GAP - 8) + ' 19 L' + (ax + GAP - 4) + ' 22 L' + (ax + GAP - 8) + ' 25', stroke: 'rgba(169,182,218,.6)', 'stroke-width': 1.3, fill: 'none' }, sigm);
      }
      x += widths[i] + GAP;
      return g;
    });

    /* a feature channel along the cluster order: block means plus zero-mean deviations inside each block */
    const R2 = rand(29), N = 64, B = 8, L = N / B;
    const means = [];
    let m = 0;
    for (let j = 0; j < B; j++) { m += (R2() - 0.5) * 1.6; means.push(m); }
    const mu = means.reduce((a, b) => a + b, 0) / B, sc = Math.max(...means.map(v => Math.abs(v - mu))) || 1;
    const raw = [];
    means.forEach(v => {
      const r = [];
      for (let i = 0; i < L; i++) r.push((R2() - 0.5) * 1.25);
      const rm = r.reduce((a, b) => a + b, 0) / L;
      r.forEach(d => raw.push((v - mu) / sc * 0.8 + d - rm));
    });
    const re = new Array(N).fill(0), im = new Array(N).fill(0);
    for (let k = 0; k < N; k++) for (let n = 0; n < N; n++) { const a = -2 * Math.PI * k * n / N; re[k] += raw[n] * Math.cos(a); im[k] += raw[n] * Math.sin(a); }
    const G = k => { const kk = Math.min(k, N - k); return Math.exp(-Math.pow(kk / 4.2, 2)); };
    const filt = [];
    for (let n = 0; n < N; n++) {
      let s = 0;
      for (let k = 0; k < N; k++) { const a = 2 * Math.PI * k * n / N; s += G(k) * (re[k] * Math.cos(a) - im[k] * Math.sin(a)); }
      filt.push(s / N);
    }
    const K = 24, mags = [];
    for (let k = 1; k <= K; k++) mags.push(Math.hypot(re[k], im[k]));
    const mmax = Math.max(...mags);

    /* left: the sequence */
    mk('text', { class: 'mod-lab hl', x: 0, y: 64 }, sigm).textContent = 'ONE CHANNEL ALONG Π';
    const SX0 = 6, SX1 = 246, SY = 150, SA = 44;
    for (let j = 1; j < B; j++) {
      const bx = SX0 + (j * L - 0.5) / (N - 1) * (SX1 - SX0);
      mk('line', { x1: bx, x2: bx, y1: 82, y2: 220, stroke: 'rgba(130,170,255,.12)', 'stroke-dasharray': '3 4' }, sigm);
    }
    mk('text', { class: 'mod-lab', x: SX0, y: 234 }, sigm).textContent = 'clusters →';
    const sig = mk('path', { fill: 'none', stroke: '#9fd8ff', 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, sigm);
    const dot = mk('circle', { r: 4.5, fill: '#fff', style: 'filter:drop-shadow(0 0 6px #22d3ff);opacity:0' }, sigm);
    const px = i => SX0 + i / (N - 1) * (SX1 - SX0);
    const py = v => SY - v * SA;

    /* right: its spectrum and the gate */
    mk('text', { class: 'mod-lab hl', x: 274, y: 64 }, sigm).textContent = '|FFT| · LOW → HIGH';
    const BX0 = 278, BW = 6.6, BS = 9.8, BASE = 218, BHMAX = 118;
    const bars = mags.map((v, i) => mk('rect', { class: 'bar-k', x: BX0 + i * BS, width: BW, rx: 1.5, y: BASE, height: 0, fill: G(i + 1) > 0.5 ? '#4cf2b8' : '#ff6b6b' }, sigm));
    let gd = '';
    for (let i = 0; i <= 60; i++) { const kf = 1 + i / 60 * (K - 1); gd += (i ? 'L' : 'M') + (BX0 + (kf - 1) * BS + BW / 2).toFixed(1) + ' ' + (BASE - Math.exp(-Math.pow(kf / 4.2, 2)) * BHMAX).toFixed(1); }
    const gate = mk('path', { d: gd, fill: 'none', stroke: '#d9c8ff', 'stroke-width': 1.6, 'stroke-dasharray': '5 4' }, sigm);
    mk('text', { class: 'mod-lab', x: BX0 + 4.2 * BS + 14, y: BASE - BHMAX * 0.55, style: 'fill:#d9c8ff' }, sigm).textContent = 'learned gate';
    mk('line', { x1: BX0 - 2, x2: BX0 + K * BS, y1: BASE + 0.5, y2: BASE + 0.5, stroke: 'rgba(130,170,255,.25)' }, sigm);

    const render = (mix, headAt) => {
      let d = '';
      for (let i = 0; i < N; i++) d += (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(raw[i] + (filt[i] - raw[i]) * mix).toFixed(1);
      sig.setAttribute('d', d);
      bars.forEach((b, i) => {
        const h = mags[i] / mmax * BHMAX * (1 - mix * (1 - G(i + 1)));
        b.setAttribute('y', (BASE - h).toFixed(1)); b.setAttribute('height', h.toFixed(1));
      });
      if (headAt == null) dot.style.opacity = 0;
      else {
        const i = Math.max(0, Math.min(N - 1, headAt)), i0 = Math.floor(i), i1 = Math.min(N - 1, i0 + 1), f = i - i0;
        const v0 = raw[i0] + (filt[i0] - raw[i0]) * mix, v1 = raw[i1] + (filt[i1] - raw[i1]) * mix;
        dot.setAttribute('cx', px(i).toFixed(1)); dot.setAttribute('cy', py(v0 + (v1 - v0) * f).toFixed(1));
        dot.style.opacity = 1;
      }
    };
    const PHASES = [[0, 1200, 0], [1200, 2400, 1], [2400, 3000, 2], [3000, 4200, 3], [4200, 5100, 4], [5100, 5700, 5], [5700, 6800, 6], [6800, 7300, -1]];
    const LOOP = 7300;
    let raf = 0, visible = false, t0 = 0;
    const setChip = c => chipEls.forEach((g, i) => g.classList.toggle('on', i === c));
    const frame = now => {
      raf = 0;
      if (!visible) return;
      if (!t0) t0 = now;
      const t = (now - t0) % LOOP;
      const ph = PHASES.find(p => t >= p[0] && t < p[1]) || PHASES[0];
      const k = (t - ph[0]) / (ph[1] - ph[0]);
      setChip(ph[2]);
      let mix = 1, headAt = null;
      if (ph[2] === 0) { mix = 0; headAt = UI.ease.inOut(k) * (N - 1); }
      else if (ph[2] === 1) mix = UI.ease.inOut(k);
      else if (ph[2] === 3) headAt = (1 - UI.ease.inOut(k)) * (N - 1);
      else if (ph[2] === -1) mix = 1 - UI.ease.inOut(k);
      gate.setAttribute('stroke-width', ph[2] === 1 || ph[2] === 4 ? 2.8 : 1.6);
      render(mix, headAt);
      raf = requestAnimationFrame(frame);
    };
    if (!motion) { render(1, null); setChip(1); }
    else {
      render(0, null);
      UI.watch(sigm, v => { visible = v; if (v && !raf) raf = requestAnimationFrame(frame); });
    }
  }
})();
