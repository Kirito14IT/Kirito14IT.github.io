/* The paper's teaser, live: the Notre-Dame pair read in random order or cluster by cluster.
   (a) the drawn matches; (b) keypoints coloured by scan position, revealed in scan order;
   (c) where each match lands in the second view, drawn as the scan proceeds; (d) the spectra of both classes.
   All positions come from window.SFM_TEASER, read from the vector layer of the paper's figure. */
(function () {
  'use strict';
  const T = window.SFM_TEASER, UI = window.SFMUI;
  if (!T || !UI) return;
  const NS = 'http://www.w3.org/2000/svg';
  const dprOf = () => Math.min(2, window.devicePixelRatio || 1);
  const fit = cv => {
    const r = cv.getBoundingClientRect(), k = dprOf();
    const w = Math.max(1, Math.round(r.width * k)), h = Math.max(1, Math.round(r.height * k));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return [w, h];
  };
  const place = (img, box) => { img.style.left = (box[0] * 100) + '%'; img.style.width = ((box[2] - box[0]) * 100) + '%'; };

  /* scan-position colours, matched to the colour bar of the figure: cyan → indigo → magenta */
  const STOPS = [[34, 198, 240], [90, 90, 230], [190, 40, 150]];
  const scanRGB = t => {
    const s = Math.max(0, Math.min(1, t)) * 2, i = Math.min(1, Math.floor(s)), f = s - i, a = STOPS[i], b = STOPS[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f].map(v => Math.round(v));
  };

  /* ---------------- (a) the pair with its drawn matches ---------------- */
  const pair = document.getElementById('pairStage');
  if (pair) {
    const L = T.a.layout, imgs = pair.querySelectorAll('img'), cv = pair.querySelector('canvas'), c = cv.getContext('2d');
    pair.style.aspectRatio = String(L.aspect);
    place(imgs[0], L.l); place(imgs[1], L.r);
    let prog = UI.reduced ? 1 : 0;
    const strokes = (arr, delayOf) => {
      const n = arr.length / 4;
      for (let i = 0; i < n; i++) {
        const k = Math.max(0, Math.min(1, (prog - delayOf(i, n)) / 0.35));
        if (k <= 0) continue;
        const x1 = arr[4 * i] * cv.width, y1 = arr[4 * i + 1] * cv.height, x2 = arr[4 * i + 2] * cv.width, y2 = arr[4 * i + 3] * cv.height;
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k); c.stroke();
      }
    };
    const delayR = (i, n) => ((i * 37) % n) / n * 0.55;
    const delayG = (i, n) => 0.1 + ((i * 11) % n) / n * 0.55;
    const draw = () => {
      const [w, h] = fit(cv);
      c.clearRect(0, 0, w, h);
      const u = w / 1000;
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(255, 70, 60, .9)'; c.lineWidth = 1.05 * u; strokes(T.a.red, delayR);
      c.strokeStyle = 'rgba(255, 255, 255, .9)'; c.lineWidth = 3.4 * u; strokes(T.a.green, delayG);
      c.strokeStyle = '#22f554'; c.lineWidth = 1.8 * u; strokes(T.a.green, delayG);
    };
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(pair); else addEventListener('resize', draw);
    UI.onVisible(pair, () => UI.tween(1900, k => { prog = k; draw(); }, null, UI.ease.linear));
    draw();
  }

  /* ---------------- (b–d) scan, landing positions, spectra ---------------- */
  const grid = document.getElementById('scanGrid');
  const cvDots = document.getElementById('scanDots'), cvLand = document.getElementById('scanLand'), svg = document.getElementById('scanSpec');
  if (!grid || !cvDots || !cvLand || !svg) return;
  const cD = cvDots.getContext('2d'), cL = cvLand.getContext('2d');
  const cursor = document.getElementById('scanCursor'), ordName = document.getElementById('ordName');
  const vInl = document.getElementById('vInl'), vOut = document.getElementById('vOut');
  const ENERGY = { random: [9.9, 10.0], cluster: [84.2, 15.4] };   // share of energy in the lowest tenth of frequencies (Appendix K)
  const NAME = { random: 'random order', cluster: 'cluster by cluster' };

  const ORD = {};
  ['random', 'cluster'].forEach(o => {
    const d = T.orders[o], dots = [], out = [], inl = [];
    for (let i = 0; i < d.dots.length; i += 3) {
      const rgb = scanRGB(d.dots[i + 2]);
      dots.push({ x: d.dots[i], y: d.dots[i + 1], t: d.dots[i + 2], c: 'rgb(' + rgb.join(',') + ')' });
    }
    dots.sort((a, b) => a.t - b.t);
    for (let i = 0; i < d.out.length; i += 2) out.push([d.out[i], d.out[i + 1]]);
    out.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < d.inl.length; i += 2) inl.push([d.inl[i], d.inl[i + 1]]);
    ORD[o] = { dots, out, inl, spec: d.spec, ticks: d.ticks || [] };
  });
  let X0 = 1, X1 = 0;
  Object.values(ORD).forEach(O => O.inl.concat(O.out).forEach(p => { X0 = Math.min(X0, p[0]); X1 = Math.max(X1, p[0]); }));
  const barH = T.axes.bar;

  function drawDots(o, p) {
    const [w, h] = fit(cvDots), O = ORD[o], u = w / 400, r = 1.45 * u;
    cD.clearRect(0, 0, w, h);
    let i = 0;
    for (; i < O.dots.length && O.dots[i].t <= p; i++) {
      const d = O.dots[i];
      cD.fillStyle = d.c; cD.beginPath(); cD.arc(d.x * w, d.y * h, r, 0, 6.2832); cD.fill();
    }
    if (p < 1) {
      const n = 36;
      for (let j = Math.max(0, i - n); j < i; j++) {
        const d = O.dots[j], a = (j - (i - n)) / n;
        cD.fillStyle = 'rgba(255, 255, 255, ' + (0.55 * a).toFixed(3) + ')';
        cD.beginPath(); cD.arc(d.x * w, d.y * h, r * (1 + 1.8 * a), 0, 6.2832); cD.fill();
      }
    }
  }

  function drawLand(o, p) {
    const [w, h] = fit(cvLand), O = ORD[o], u = w / 400, xp = X0 + (X1 - X0) * p, bh = barH * h * 0.85;
    cL.clearRect(0, 0, w, h);
    const g = cL.createLinearGradient(X0 * w, 0, X1 * w, 0);
    STOPS.forEach((s, k) => g.addColorStop(k / 2, 'rgb(' + s.join(',') + ')'));
    cL.fillStyle = g;
    cL.globalAlpha = 0.22; cL.fillRect(X0 * w, 0, (X1 - X0) * w, bh);
    cL.globalAlpha = 1; cL.fillRect(X0 * w, 0, (xp - X0) * w, bh);
    O.ticks.forEach(tx => {
      cL.fillStyle = '#020610'; cL.fillRect(tx * w - 0.9 * u, 0, 1.8 * u, bh);
      cL.fillStyle = 'rgba(130, 170, 255, .07)'; cL.fillRect(tx * w - 0.4 * u, bh, 0.8 * u, h - bh);
    });
    cL.fillStyle = 'rgba(255, 79, 79, .78)';
    for (let k = 0; k < O.out.length; k++) {
      const q = O.out[k];
      if (q[0] > xp) break;
      cL.beginPath(); cL.arc(q[0] * w, q[1] * h, 1.15 * u, 0, 6.2832); cL.fill();
    }
    const line = () => {
      cL.beginPath();
      for (let k = 0; k < O.inl.length; k++) {
        const q = O.inl[k];
        if (q[0] > xp) {
          if (k > 0) { const a = O.inl[k - 1], f = (xp - a[0]) / Math.max(1e-6, q[0] - a[0]); cL.lineTo(xp * w, (a[1] + (q[1] - a[1]) * f) * h); }
          break;
        }
        if (k === 0) cL.moveTo(q[0] * w, q[1] * h); else cL.lineTo(q[0] * w, q[1] * h);
      }
      cL.stroke();
    };
    cL.lineJoin = 'round'; cL.lineCap = 'round';
    cL.strokeStyle = 'rgba(57, 255, 143, .22)'; cL.lineWidth = 4 * u; line();
    cL.strokeStyle = '#39ff8f'; cL.lineWidth = 1.4 * u; line();
    if (p < 1) {
      cL.fillStyle = 'rgba(255, 255, 255, .8)'; cL.fillRect(xp * w - 0.6 * u, bh, 1.2 * u, h - bh);
      cL.fillStyle = 'rgba(34, 211, 255, .12)'; cL.fillRect(xp * w - 8 * u, bh, 8 * u, h - bh);
    }
  }

  /* spectra: an SVG with log axes; curves morph between the two orders */
  const PX = 64, PY = 12, PW = 636, PH = 356;
  const sx = x => PX + x * PW, sy = y => PY + y * PH;
  const mk = (tag, a, parent) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); (parent || svg).appendChild(e); return e; };
  const AX = T.axes.spec;
  const xAt = f => { const a = AX.x['0.01'], b = AX.x['0.1']; return a + (Math.log10(f) + 2) * (b - a); };
  const firstX = ORD.random.spec.inl[0];
  mk('rect', { class: 'spec-band', x: sx(firstX), y: PY, width: sx(xAt(0.05)) - sx(firstX), height: PH });
  mk('line', { class: 'spec-band-edge', x1: sx(xAt(0.05)), x2: sx(xAt(0.05)), y1: PY, y2: PY + PH });
  mk('text', { class: 'spec-lab', x: sx(firstX) + 8, y: PY + PH - 12, fill: 'rgba(76,242,184,.85)' }).textContent = 'lowest tenth';
  mk('line', { class: 'spec-axis', x1: PX, x2: PX + PW, y1: PY + PH, y2: PY + PH });
  mk('line', { class: 'spec-axis', x1: PX, x2: PX, y1: PY, y2: PY + PH });
  mk('line', { class: 'spec-unit', x1: PX, x2: PX + PW, y1: sy(AX.y['1']), y2: sy(AX.y['1']) });
  Object.keys(AX.y).forEach(lab => { mk('text', { class: 'spec-tick', x: PX - 10, y: sy(AX.y[lab]) + 7, 'text-anchor': 'end' }).textContent = lab; });
  Object.keys(AX.x).forEach(lab => {
    mk('line', { class: 'spec-axis', x1: sx(AX.x[lab]), x2: sx(AX.x[lab]), y1: PY + PH, y2: PY + PH + 8 });
    mk('text', { class: 'spec-tick', x: sx(AX.x[lab]), y: PY + PH + 32, 'text-anchor': 'middle' }).textContent = lab;
  });
  const gLines = mk('g', {});
  const pOut = mk('path', { class: 'spec-line r' }, gLines), pInl = mk('path', { class: 'spec-line g' }, gLines);
  const labInl = mk('text', { class: 'spec-lab', fill: '#39ff8f', 'text-anchor': 'end' }), labOut = mk('text', { class: 'spec-lab', fill: '#ff6b6b', 'text-anchor': 'end' });
  labInl.textContent = 'inliers'; labOut.textContent = 'outliers';
  const yArr = (o, k) => ORD[o].spec[k].filter((_, i) => i % 2 === 1);
  const xArr = k => ORD.random.spec[k].filter((_, i) => i % 2 === 0);
  const specY = { inl: yArr('random', 'inl'), out: yArr('random', 'out') };
  const pathOf = (xs, ys) => xs.map((x, i) => (i ? 'L' : 'M') + sx(x).toFixed(1) + ' ' + sy(ys[i]).toFixed(1)).join('');
  function drawSpec() {
    pInl.setAttribute('d', pathOf(xArr('inl'), specY.inl));
    pOut.setAttribute('d', pathOf(xArr('out'), specY.out));
    const xi = xArr('inl'), xo = xArr('out');
    const clampY = y => Math.max(PY + 24, Math.min(PY + PH - 10, y));
    labInl.setAttribute('x', sx(xi[xi.length - 1]) - 4); labInl.setAttribute('y', clampY(sy(specY.inl[specY.inl.length - 1]) + 34));
    labOut.setAttribute('x', sx(xo[xo.length - 1]) - 4); labOut.setAttribute('y', clampY(sy(specY.out[specY.out.length - 1]) - 16));
  }
  let morphCancel = null;
  function morphTo(o) {
    const from = { inl: specY.inl.slice(), out: specY.out.slice() }, to = { inl: yArr(o, 'inl'), out: yArr(o, 'out') };
    if (morphCancel) morphCancel();
    morphCancel = UI.tween(1000, k => {
      ['inl', 'out'].forEach(c => { specY[c] = to[c].map((v, i) => from[c][i] + (v - from[c][i]) * k); });
      drawSpec();
    }, null, UI.ease.inOut);
  }
  drawSpec();

  /* ---------------- the loop ---------------- */
  const tabs = UI.tabs(document.getElementById('orderTabs'), b => { auto = false; setOrder(b.dataset.o); restart(); });
  const play = document.getElementById('scanPlay');
  const SCAN = 5200, HOLD = { random: 1700, cluster: 3000 };
  let order = 'random', p = UI.reduced ? 1 : 0, auto = true, running = !UI.reduced, visible = false, raf = 0, last = 0, holdUntil = 0;

  function setOrder(o) {
    if (o === order) return;
    order = o;
    ordName.textContent = NAME[o];
    tabs.set(tabs.btns.find(b => b.dataset.o === o));
    morphTo(o);
    UI.countTo(vInl, ENERGY[o][0], { from: parseFloat(vInl.textContent), dec: 1, suffix: '%', ms: 1000 });
    UI.countTo(vOut, ENERGY[o][1], { from: parseFloat(vOut.textContent), dec: 1, suffix: '%', ms: 1000 });
  }
  function render() {
    drawDots(order, p);
    drawLand(order, p);
    cursor.style.left = (p * 100).toFixed(2) + '%';
    svg.classList.toggle('spec-wait', p < 1);
  }
  function restart() { p = UI.reduced || !running ? 1 : 0; holdUntil = 0; render(); kick(); }
  function frame(now) {
    raf = 0;
    if (!running || !visible) return;
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    if (p < 1) {
      p = Math.min(1, p + dt / SCAN);
      if (p >= 1) holdUntil = now + HOLD[order];
    } else if (now >= holdUntil) {
      if (auto) setOrder(order === 'random' ? 'cluster' : 'random');
      p = 0;
    }
    render();
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && running && visible) { last = 0; raf = requestAnimationFrame(frame); } }

  play.addEventListener('click', () => {
    running = !running;
    play.textContent = running ? 'Pause' : 'Play';
    play.setAttribute('aria-pressed', running ? 'false' : 'true');
    if (running) { if (p >= 1) holdUntil = 0; kick(); }
  });
  if (UI.reduced) { play.hidden = true; }
  if ('ResizeObserver' in window) new ResizeObserver(render).observe(grid); else addEventListener('resize', render);
  UI.watch(grid, v => { visible = v; if (v) kick(); });
  render();
})();
