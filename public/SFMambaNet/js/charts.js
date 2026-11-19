/* Results and analysis charts. All values come from window.SFM (data.js), copied from the paper. */
(function () {
  'use strict';
  const D = window.SFM, UI = window.SFMUI;
  if (!D || !UI) return;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, a, parent) => {
    const e = document.createElementNS(NS, tag);
    if (a) for (const k in a) e.setAttribute(k, a[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const h = (tag, cls, parent, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  const f2 = v => v.toFixed(2);

  /* autoplay a tab group while it is on screen, until the reader clicks */
  function autoplay(el, steps, ms, apply) {
    let i = 0, timer = 0, stopped = UI.reduced;
    const run = v => {
      clearInterval(timer);
      if (!v || stopped) return;
      timer = setInterval(() => { i = (i + 1) % steps; apply(i); }, ms);
    };
    UI.watch(el, run, 0.35);
    return { stop: () => { stopped = true; clearInterval(timer); }, at: k => { i = k; } };
  }

  /* ======================= pose leaderboard ======================= */
  const board = document.getElementById('board');
  if (board) {
    const P = D.pose, body = document.getElementById('bdBody'), foot = document.getElementById('bdFoot');
    const ROW = 28;
    const rows = P.rows.map(r => {
      const el = h('div', 'bd-row', body);
      if (r[0] === 'SFMambaNet') el.classList.add('ours');
      if (r[0] === 'MatchMamba') el.classList.add('base');
      if (r[0] === 'MatchMamba†') el.classList.add('gray');
      const rank = h('span', 'bd-rank', el), name = h('span', 'bd-name', el, r[0]);
      const track = h('span', 'bd-track', el), fill = h('i', 'bd-fill', track), val = h('span', 'bd-val', el);
      name.title = r[0] === 'MatchMamba†' ? 'MatchMamba retrained by the authors (not ranked)' : r[0];
      return { r, el, rank, fill, val };
    });
    const setG = board.querySelector('[data-k="set"]'), splitG = board.querySelector('[data-k="split"]');
    let set = 'y', split = 'u', revealed = UI.reduced;
    const colOf = () => ({ y: 0, s: 2, p: 4 })[set] + (split === 'u' ? 1 : 0);
    function show() {
      const c = colOf();
      const items = rows.map(x => ({ x, v: x.r[c + 1] }));
      const valid = items.filter(o => o.v != null).sort((a, b) => b.v - a.v), missing = items.filter(o => o.v == null);
      const max = valid[0].v;
      let rank = 0;
      valid.forEach((o, pos) => {
        const x = o.x, gray = x.el.classList.contains('gray');
        x.el.classList.remove('gone');
        x.el.style.transform = 'translateY(' + pos * ROW + 'px)';
        x.fill.style.setProperty('--w', revealed ? (o.v / max).toFixed(4) : 0);
        x.val.textContent = f2(o.v);
        x.rank.textContent = gray ? '–' : String(++rank);
      });
      missing.forEach((o, k) => { o.x.el.classList.add('gone'); o.x.el.style.transform = 'translateY(' + (valid.length + k) * ROW + 'px)'; });
      body.style.height = valid.length * ROW + 'px';
      const ours = P.rows.find(r => r[0] === 'SFMambaNet')[c + 1], mm = P.rows.find(r => r[0] === 'MatchMamba')[c + 1];
      let txt = 'SFMambaNet <b>' + f2(ours) + '</b> vs MatchMamba <b>' + f2(mm) + '</b> · <b class="up">+' + f2(ours - mm) + '</b>';
      if (set === 'p') {
        const s = P.sp20;
        txt += ' · at mAP@20°: <b>' + f2(split === 'u' ? s.unknown : s.known) + '</b> vs <b>' + f2(split === 'u' ? s.mmUnknown : s.mmKnown) + '</b>';
      }
      foot.innerHTML = txt + '<br>Known: test pairs from training sequences · unknown: sequences never seen in training · MatchMamba† is the authors\' retrain (gray, unranked) · methods without a value are hidden.';
    }
    const COMBOS = [['y', 'u'], ['y', 'k'], ['s', 'u'], ['s', 'k'], ['p', 'u'], ['p', 'k']];
    const tSet = UI.tabs(setG, b => { set = b.dataset.v; ap.stop(); show(); });
    const tSplit = UI.tabs(splitG, b => { split = b.dataset.v; ap.stop(); show(); });
    const ap = autoplay(board, COMBOS.length, 3800, i => {
      set = COMBOS[i][0]; split = COMBOS[i][1];
      tSet.set(tSet.btns.find(b => b.dataset.v === set));
      tSplit.set(tSplit.btns.find(b => b.dataset.v === split));
      show();
    });
    show();
    UI.onVisible(board, () => { revealed = true; show(); });
  }

  /* ======================= accuracy vs. cost ======================= */
  const eff = document.getElementById('effSvg');
  if (eff) {
    const card = document.getElementById('effChart'), tip = document.getElementById('effTip');
    const L = 46, Rr = 446, Tt = 16, B = 256;
    const Y = { lo: 46, hi: 77 }, X = { flops: { lo: 0, hi: 12, ticks: [0, 3, 6, 9, 12], unit: 'FLOPs (G)' }, ait: { lo: 0, hi: 16, ticks: [0, 4, 8, 12, 16], unit: 'average inference time (ms)' } };
    const yOf = v => B - (v - Y.lo) / (Y.hi - Y.lo) * (B - Tt);
    const defs = mk('defs', null, eff);
    const sg = mk('radialGradient', { id: 'starGrad' }, defs);
    mk('stop', { offset: 0, 'stop-color': '#eafff6' }, sg); mk('stop', { offset: 1, 'stop-color': '#4cf2b8' }, sg);
    [50, 55, 60, 65, 70, 75].forEach(v => {
      mk('line', { class: 'c-grid', x1: L, x2: Rr, y1: yOf(v), y2: yOf(v) }, eff);
      mk('text', { class: 'c-tick', x: L - 8, y: yOf(v) + 4, 'text-anchor': 'end' }, eff).textContent = v;
    });
    mk('text', { class: 'c-label', x: 12, y: (Tt + B) / 2, transform: 'rotate(-90 12 ' + (Tt + B) / 2 + ')', 'text-anchor': 'middle' }, eff).textContent = 'mAP@5° (%)';
    const gx = mk('g', null, eff);
    const xLabel = mk('text', { class: 'c-label', x: (L + Rr) / 2, y: 292, 'text-anchor': 'middle' }, eff);
    let metric = 'flops';
    const xOf = v => L + (v - X[metric].lo) / (X[metric].hi - X[metric].lo) * (Rr - L);
    function axis() {
      gx.textContent = '';
      X[metric].ticks.forEach(v => {
        mk('line', { class: 'c-grid', x1: xOf(v), x2: xOf(v), y1: Tt, y2: B }, gx);
        mk('text', { class: 'c-tick', x: xOf(v), y: B + 16, 'text-anchor': 'middle' }, gx).textContent = v;
      });
      xLabel.textContent = X[metric].unit;
    }
    const BELOW = { MatchMamba: 1, GCTNet: 1, CLNet: 0 };
    const bubbles = D.efficiency.map((e, i) => {
      const ours = e.venue === 'ours', r = 9 * Math.sqrt(e.params);
      const g = mk('g', { class: 'bub', tabindex: 0 }, eff);
      const col = ours ? '#4cf2b8' : e.name === 'MatchMamba' ? '#a78bfa' : '#5b7cff';
      mk('circle', { r, fill: col, stroke: col }, g);
      if (ours) mk('path', { class: 'star', d: starPath(9.5, 4.2) }, g);
      const below = BELOW[e.name] === 1;
      mk('text', { y: below ? r + 14 : -r - 6, style: ours ? 'font-weight:800;fill:#fff' : '' }, g).textContent = e.name;
      g.style.transitionDelay = (i * 0.06) + 's';
      g.addEventListener('pointerenter', () => showTip(e, g));
      g.addEventListener('focus', () => showTip(e, g));
      g.addEventListener('pointerleave', () => tip.classList.remove('on'));
      g.addEventListener('blur', () => tip.classList.remove('on'));
      return { e, g };
    });
    function starPath(ro, ri) {
      let d = '';
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? ri : ro; d += (k ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(2) + ' ' + (Math.sin(a) * rr).toFixed(2); }
      return d + 'Z';
    }
    function showTip(e, g) {
      const svgR = eff.getBoundingClientRect(), cardR = card.getBoundingClientRect(), s = svgR.width / 460;
      const xx = xOf(e[metric]), yy = yOf(e.map);
      tip.innerHTML = '<b>' + e.name + '</b>' + (e.venue === 'ours' ? '' : ' <span style="color:var(--dim)">' + e.venue + '</span>') +
        '<br>mAP@5° <code>' + f2(e.map) + '</code> · params <code>' + f2(e.params) + 'M</code><br>FLOPs <code>' + f2(e.flops) + 'G</code> · ART <code>' + f2(e.art) + ' ms</code> · AIT <code>' + f2(e.ait) + ' ms</code>';
      tip.style.left = (svgR.left - cardR.left + xx * s) + 'px';
      tip.style.top = (svgR.top - cardR.top + (yy - 9 * Math.sqrt(e.params)) * s) + 'px';
      tip.classList.add('on');
    }
    let shown = UI.reduced;
    function place() {
      bubbles.forEach(b => { b.g.style.transform = 'translate(' + xOf(b.e[metric]).toFixed(1) + 'px,' + yOf(b.e.map).toFixed(1) + 'px) scale(' + (shown ? 1 : 0) + ')'; });
    }
    axis(); place();
    UI.tabs(card.querySelector('.tabs'), b => { metric = b.dataset.x; axis(); place(); tip.classList.remove('on'); });
    UI.onVisible(card, () => { shown = true; place(); });
  }

  /* ======================= homography (lollipops) ======================= */
  const homo = document.getElementById('homo');
  if (homo) {
    const bodyH = document.getElementById('hoBody'), lo = document.getElementById('hoLo'), hi = document.getElementById('hoHi');
    const DOM = [[64, 74], [78, 86], [88, 93.5]], ROW = 27;
    const rows = D.homography.map(r => {
      const el = h('div', 'ho-row' + (r[0] === 'SFMambaNet' ? ' ours' : ''), bodyH);
      h('span', 'ho-n', el, r[0]);
      const t = h('span', 'ho-t', el), bar = h('i', null, t), v = h('span', 'ho-v', el);
      return { r, el, bar, v };
    });
    bodyH.style.height = rows.length * ROW + 'px';
    let th = 0, shown = UI.reduced;
    function show() {
      const [a, b] = DOM[th];
      lo.textContent = a + '%'; hi.textContent = b + '%';
      const order = rows.slice().sort((x, y) => y.r[th + 1] - x.r[th + 1]);
      order.forEach((x, pos) => {
        x.el.style.transform = 'translateY(' + pos * ROW + 'px)';
        x.bar.style.setProperty('--w', shown ? ((x.r[th + 1] - a) / (b - a)).toFixed(4) : 0);
        x.v.textContent = f2(x.r[th + 1]);
      });
    }
    const tabs = UI.tabs(homo.querySelector('.tabs'), b => { th = +b.dataset.t; ap.stop(); show(); });
    const ap = autoplay(homo, 3, 3400, i => { th = i; tabs.set(tabs.btns[i]); show(); });
    show();
    UI.onVisible(homo, () => { shown = true; show(); });
  }

  /* ======================= outlier-removal heatmap ======================= */
  const hm = document.getElementById('hm');
  if (hm) {
    const O = D.outlier;
    h('span', 'hm-h', hm, '');
    h('span', 'hm-h ds', hm, 'YFCC100M');
    h('span', 'hm-h ds s', hm, 'SUN3D');
    h('span', 'hm-h', hm, '');
    O.cols.forEach(c => h('span', 'hm-h', hm, c === 'P' ? 'Precision' : c === 'R' ? 'Recall' : 'F-score'));
    const ext = O.cols.map((_, j) => { const vs = O.rows.map(r => r[j + 1]); return [Math.min(...vs), Math.max(...vs)]; });
    O.rows.forEach((r, i) => {
      const ours = r[0] === 'SFMambaNet';
      h('span', 'hm-n' + (ours ? ' ours' : ''), hm, r[0]);
      O.cols.forEach((_, j) => {
        const v = r[j + 1], [a, b] = ext[j];
        const cell = h('span', 'hm-c' + (ours ? ' ours' : '') + (v === b ? ' best' : ''), hm, f2(v));
        cell.style.setProperty('--t', (0.12 + 0.88 * (v - a) / (b - a)).toFixed(3));
        cell.style.setProperty('--hm', j < 3 ? '#2f8cff' : '#8a63ff');
        cell.style.setProperty('--d', (i * 45 + j * 25));
        cell.title = r[0] + ' · ' + (j < 3 ? 'YFCC100M' : 'SUN3D') + ' · ' + ({ P: 'precision', R: 'recall', F: 'F-score' })[O.cols[j]] + ' ' + f2(v) + '%';
      });
    });
    const heat = document.getElementById('heat');
    UI.onVisible(heat, () => heat.classList.add('in'));
  }

  /* ======================= component additions (waterfall) ======================= */
  const ab = document.getElementById('ablation');
  if (ab) {
    const A = D.ablation, rowsEl = document.getElementById('abRows'), tabsEl = document.getElementById('abTabs');
    A.cols.forEach((c, i) => { const b = h('button', 'tab' + (i === 2 ? ' on' : ''), tabsEl, c); b.dataset.c = i; b.setAttribute('role', 'tab'); });
    const rows = A.rows.map((r, j) => {
      const el = h('div', 'wf-row', rowsEl);
      h('span', 'wf-n' + (j === A.rows.length - 1 ? ' ours' : ''), el, r[0]);
      const t = h('span', 'wf-t', el), base = h('i', null, t), delta = j ? h('i', 'delta', t) : null, val = h('b', null, t), em = j ? h('em', null, t) : null;
      return { r, j, base, delta, val, em };
    });
    let col = 2, shown = UI.reduced;
    function show() {
      rows.forEach(x => {
        const v = x.r[col + 1][0], sd = x.r[col + 1][1], prev = x.j ? A.rows[x.j - 1][col + 1][0] : 0;
        x.base.style.setProperty('--w', shown ? ((x.j ? prev : v) / 100).toFixed(4) : 0);
        if (x.delta) {
          x.delta.style.setProperty('--from', (prev / 100).toFixed(4));
          x.delta.style.setProperty('--dw', shown ? ((v - prev) / 100).toFixed(4) : 0);
          x.em.style.setProperty('--from', (prev / 100).toFixed(4));
          x.em.textContent = '+' + f2(v - prev);
        }
        x.val.textContent = f2(v) + ' ± ' + f2(sd);
      });
    }
    const tabs = UI.tabs(tabsEl, b => { col = +b.dataset.c; ap.stop(); show(); });
    const ap = autoplay(ab, 4, 3600, i => { col = (i + 2) % 4; tabs.set(tabs.btns[col]); show(); });
    show();
    UI.onVisible(ab, () => { shown = true; show(); });
  }

  /* ======================= dot plots with error bars (gates, encodings) ======================= */
  function dotPlot(svgId, items, colors) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const COLS = [{ key: 'y', title: 'YFCC100M · unknown', x0: 176, x1: 306, lo: 70, hi: 74.2, ticks: [70, 72, 74] },
      { key: 's', title: 'SUN3D · unknown', x0: 334, x1: 456, lo: 20.3, hi: 22.3, ticks: [20.5, 21, 21.5, 22] }];
    const top = 40, step = 38;
    COLS.forEach(c => {
      mk('text', { class: 'dp-sub', x: (c.x0 + c.x1) / 2, y: 14, 'text-anchor': 'middle', style: 'fill:var(--cyan)' }, svg).textContent = c.title;
      c.ticks.forEach(v => {
        const x = c.x0 + (v - c.lo) / (c.hi - c.lo) * (c.x1 - c.x0);
        mk('line', { class: 'c-grid', x1: x, x2: x, y1: 24, y2: top + step * (items.length - 1) + 14 }, svg);
        mk('text', { class: 'c-tick', x, y: top + step * (items.length - 1) + 30, 'text-anchor': 'middle' }, svg).textContent = v;
      });
    });
    const pts = [];
    items.forEach((it, i) => {
      const y = top + i * step, last = i === items.length - 1;
      mk('text', { class: 'dp-lab' + (last ? ' ours' : ''), x: 0, y: y + 1 }, svg).textContent = it.name;
      mk('text', { class: 'dp-sub', x: 0, y: y + 15 }, svg).textContent = it.sub;
      COLS.forEach(c => {
        const m = it[c.key][0], sd = it[c.key][1], xs = v => (v - c.lo) / (c.hi - c.lo) * (c.x1 - c.x0);
        const g = mk('g', { class: 'dp-pt' }, svg);
        mk('line', { class: 'dp-err', x1: xs(m - sd) - xs(m), x2: xs(m + sd) - xs(m), y1: 0, y2: 0, stroke: colors[i] }, g);
        mk('circle', { r: last ? 6 : 5, fill: colors[i], style: last ? 'filter:drop-shadow(0 0 6px ' + colors[i] + ')' : '' }, g);
        mk('text', { class: 'dp-v', x: 0, y: -10, 'text-anchor': 'middle' }, g).textContent = f2(m);
        g.style.transitionDelay = (i * 0.09) + 's';
        pts.push({ g, x0: c.x0, x: c.x0 + xs(m), y });
      });
    });
    const set = on => pts.forEach(p => { p.g.style.transform = 'translate(' + (on ? p.x : p.x0).toFixed(1) + 'px,' + p.y + 'px)'; });
    set(UI.reduced);
    UI.onVisible(svg, () => set(true));
  }
  dotPlot('gateSvg', D.gates.map(g => ({ name: g.name, sub: g.params + ' params', y: g.y, s: g.s })), ['#6f7ea8', '#22d3ff', '#ff9b5b', '#4cf2b8']);
  dotPlot('encSvg', D.encoding.map(e => ({ name: e.name, sub: 'd_in ' + e.din + ' · ' + e.params.toFixed(3) + 'M params', y: e.y, s: e.s })), ['#6f7ea8', '#ff9b5b', '#a78bfa', '#4cf2b8']);

  /* ======================= shuffle inside clusters ======================= */
  const viz = document.getElementById('shuffleViz');
  if (viz) {
    const HUES = [190, 224, 262, 305], PER = 8, P = 17, GAPX = 8;
    const sq = [];
    for (let c = 0; c < 4; c++) for (let k = 0; k < PER; k++) {
      const i = h('i', null, viz);
      i.style.setProperty('--c', 'hsl(' + HUES[c] + ' 85% ' + (48 + k * 4) + '%)');
      sq.push({ c, k, el: i });
    }
    let slots = sq.map(s => s.k);
    const pos = (c, k) => { const row = c >> 1, colBlock = c & 1; return [colBlock * (PER * P + GAPX) + k * P, row * P]; };
    const place = () => sq.forEach((s, i) => { const p = pos(s.c, slots[i]); s.el.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)'; });
    place();
    let timer = 0;
    const rnd = (() => { let s = 17; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
    const shuffle = () => {
      for (let c = 0; c < 4; c++) {
        const idx = sq.map((s, i) => (s.c === c ? i : -1)).filter(i => i >= 0), vals = idx.map(i => slots[i]);
        for (let a = vals.length - 1; a > 0; a--) { const b = Math.floor(rnd() * (a + 1)); [vals[a], vals[b]] = [vals[b], vals[a]]; }
        idx.forEach((i, j) => { slots[i] = vals[j]; });
      }
      place();
    };
    if (!UI.reduced) UI.watch(viz, v => { clearInterval(timer); if (v) timer = setInterval(shuffle, 1700); });
  }
})();
