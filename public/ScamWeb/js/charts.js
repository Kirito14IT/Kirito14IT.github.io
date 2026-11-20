/* ScamWeb project page: data figures. All values come from window.SW_DATA,
   which is generated from the paper's tables and the repository metadata. */
(function () {
  'use strict';
  var SW = window.SW, D = window.SW_DATA;
  if (!SW || !D) return;
  var NS = 'http://www.w3.org/2000/svg';
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* ---------------- Table 1 ---------------- */
  (function table1() {
    var t = $('cmp-table');
    if (!t) return;
    var R = D.related, last = R.names.length - 1;
    var mk = {
      y: '<svg class="mk" viewBox="0 0 16 16"><path d="M3 8.5 6.5 12 13 4.5"/></svg>',
      o: '<svg class="mk" viewBox="0 0 16 16"><circle cx="8" cy="8" r="4.2"/></svg>',
      '-': '<svg class="mk" viewBox="0 0 16 16"><path d="M4.5 8h7"/></svg>'
    };
    var label = { y: 'full support', o: 'partial support', '-': 'not available' };
    var cls = { y: 'yes', o: 'part', '-': 'no' };
    var h = '<thead><tr><th scope="col">Attribute</th>';
    R.names.forEach(function (n, i) { h += '<th scope="col"' + (i === last ? ' class="ours"' : '') + '>' + esc(n) + (i === last ? '<br><span class="cnt">(ours)</span>' : '') + '</th>'; });
    h += '</tr></thead><tbody>';
    h += '<tr><th scope="row">Scam size</th>' + R.size.map(function (v, i) { return '<td' + (i === last ? ' class="ours"' : '') + '>' + v + '</td>'; }).join('') + '</tr>';
    h += '<tr><th scope="row">Year range</th>' + R.years.map(function (v, i) { return '<td' + (i === last ? ' class="ours"' : '') + '>' + (i === last ? '<b>' + v + '</b>' : v) + '</td>'; }).join('') + '</tr>';
    R.rows.forEach(function (row, ri) {
      var grp = ri === 0 || ri === 3 ? ' class="grp"' : '';
      h += '<tr' + grp + '><th scope="row">' + row[0] + '</th>';
      row[1].split(' ').forEach(function (tok, ci) {
        var k = tok.charAt(0), n = tok.slice(1);
        var c = cls[k] + (ci === last ? ' ours' : '');
        h += '<td class="' + c + '" style="--d:' + (ri * 70 + ci * 30) + '"><span class="sr">' + label[k] + (n ? ' (' + n + ')' : '') + '</span><span aria-hidden="true">' + mk[k] + (n ? '<span class="cnt">(' + n + ')</span>' : '') + '</span></td>';
      });
      h += '</tr>';
    });
    h += '</tbody>';
    t.insertAdjacentHTML('beforeend', h);

    // evidence frame around the ScamWeb column
    var scroller = t.parentNode;
    scroller.style.paddingTop = '30px';
    scroller.style.paddingBottom = '10px';
    var f = document.createElement('span');
    f.className = 'evf';
    f.setAttribute('aria-hidden', 'true');
    f.innerHTML = '<i></i><i></i><i></i><i></i><b>Ours</b>';
    scroller.appendChild(f);
    function place() {
      var th = t.querySelector('thead th.ours');
      if (!th) return;
      f.style.left = (th.offsetLeft - 4) + 'px';
      f.style.width = (th.offsetWidth + 8) + 'px';
      f.style.top = (t.offsetTop - 4) + 'px';
      f.style.height = (t.offsetHeight + 8) + 'px';
    }
    place();
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    SW.replay(t, 'go', function () { place(); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); });
  })();

  /* ---------------- donut ---------------- */
  (function donut() {
    var svg = $('donut');
    if (!svg) return;
    var segs = [
      { n: 3416, cls: 'red', stroke: '#E4002B', label: 'scam pages, expert-annotated' },
      { n: 2242, cls: 'ink', stroke: '#0B0B0C', label: 'benign pages' },
      { n: 4368, cls: 'hatch', stroke: 'url(#hatch)', label: 'scam pages, machine-annotated' }
    ];
    var total = 10026, cx = 160, cy = 160, r = 112, gap = 30;
    var defs = el('defs', {}, svg);
    var pat = el('pattern', { id: 'hatch', patternUnits: 'userSpaceOnUse', width: 6, height: 6, patternTransform: 'rotate(45)' }, defs);
    el('rect', { width: 6, height: 6, fill: '#FFFFFF' }, pat);
    el('rect', { width: 2.3, height: 6, fill: '#8E8E96' }, pat);
    var g = el('g', { transform: 'rotate(-90 ' + cx + ' ' + cy + ')' }, svg);
    var acc = 0, arcs = [];
    segs.forEach(function (s) {
      var len = s.n - gap;
      var c = el('circle', { class: 'arc', cx: cx, cy: cy, r: r, pathLength: total, stroke: s.stroke, 'stroke-dasharray': '0 ' + total, 'stroke-dashoffset': -(acc + gap / 2) }, g);
      c.dataset.len = len;
      arcs.push(c);
      acc += s.n;
    });
    // outer guide for the frozen benchmark (expert + benign arcs)
    var frozen = (3416 + 2242) / total, R2 = 146;
    var a0 = -Math.PI / 2 + 0.01, a1 = -Math.PI / 2 + frozen * 2 * Math.PI - 0.01;
    var x0 = cx + R2 * Math.cos(a0), y0 = cy + R2 * Math.sin(a0), x1 = cx + R2 * Math.cos(a1), y1 = cy + R2 * Math.sin(a1);
    var dpath = 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A' + R2 + ' ' + R2 + ' 0 1 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2);
    el('path', { id: 'frozen-arc', d: dpath, class: 'ring' }, svg);
    var tx = el('text', { class: 'tk', dy: -7 }, svg);
    var tp = el('textPath', { href: '#frozen-arc', startOffset: '4%', 'text-anchor': 'start' }, tx);
    tp.textContent = '5,658-page frozen benchmark';
    var cn = el('text', { class: 'c-n', x: cx, y: cy + 6 }, svg);
    var cl = el('text', { class: 'c-l', x: cx, y: cy + 30 }, svg);
    var cl2 = el('text', { class: 'c-l', x: cx, y: cy + 47 }, svg);
    function center(i) {
      if (i < 0) { cn.textContent = '10,026'; cl.textContent = 'webpages in the'; cl2.textContent = 'broader collection'; }
      else { cn.textContent = SW.fmt(segs[i].n); var w = segs[i].label.split(', '); cl.textContent = w[0]; cl2.textContent = w[1] || ''; }
      arcs.forEach(function (a, j) { a.classList.toggle('dim', i >= 0 && j !== i); });
    }
    center(-1);
    function grow() { arcs.forEach(function (a) { a.style.strokeDasharray = a.dataset.len + ' ' + (total - a.dataset.len); }); }
    function shrink() { arcs.forEach(function (a) { a.style.strokeDasharray = '0 ' + total; }); }
    if (SW.reduced) { grow(); return; }
    SW.watch(svg, function () { requestAnimationFrame(grow); }, function () { shrink(); center(-1); }, 0.2);
    var hovering = -2;
    var lis = document.querySelectorAll('.dlegend li');
    lis.forEach(function (li, i) {
      li.addEventListener('mouseenter', function () { hovering = i; center(i); });
      li.addEventListener('mouseleave', function () { hovering = -2; center(-1); });
    });
    var state = -1;
    new SW.Loop(svg, 12000, function (t) {
      if (hovering !== -2) return;
      var s = t < 3000 ? -1 : Math.floor((t - 3000) / 3000);
      if (s > 2) s = -1;
      if (s !== state) { state = s; center(s); }
    });
  })();

  /* ---------------- bars: subtypes and languages ---------------- */
  function bars(list, items, max, tag) {
    if (!list) return;
    var h = '';
    items.forEach(function (it, k) {
      var w = (it.n / max * (tag ? 84 : 100)).toFixed(2) + '%';
      h += '<li class="sbar" style="--w:' + w + ';--k:' + k + '"><span class="sbar-n" title="' + esc(it.name || it.label) + '">' + esc(it.name || it.label) + '</span><span class="sbar-t"><i></i>' + (tag && it.mod ? '<em>' + it.mod.replace('Text-Vision', 'Text&ndash;vision') + '</em>' : '') + '</span><span class="sbar-v">' + SW.fmt(it.n) + '</span></li>';
    });
    list.innerHTML = h;
    SW.replay(list, 'go');
  }
  var subs = D.subtypes.slice().sort(function (a, b) { return b.n - a.n; });
  bars($('subtype-bars'), subs, subs[0].n, true);
  var langs = D.languages;
  bars($('lang-bars'), langs.slice(0, 12), langs[0].n, false);
  var lm = $('lang-marquee');
  if (lm) {
    lm.innerHTML = langs.map(function (l) { return '<span>' + esc(l.label) + '<b>' + SW.fmt(l.n) + '</b></span>'; }).join('');
    if (!SW.reduced) SW.dupe(lm);
  }
  var lnote = document.querySelector('.langs .note');
  if (lnote) lnote.textContent = 'Single languages and multilingual combinations across the expert-annotated pages. Top 12 shown; the strip below lists all 47.';

  /* ---------------- boxes per page ---------------- */
  (function bpp() {
    var host = $('boxes-per-page');
    if (!host) return;
    var spots = [[8, 9, 44, 11], [8, 26, 26, 22], [38, 26, 14, 22], [8, 54, 44, 14]];
    var max = Math.max.apply(null, D.boxes.map(function (b) { return b.n; }));
    var h = '';
    D.boxes.forEach(function (b) {
      var svg = '<svg viewBox="0 0 60 80" aria-hidden="true"><rect class="pg" x="1" y="1" width="58" height="78"/>' +
        '<rect class="ln" x="8" y="9" width="30" height="4"/><rect class="ln" x="8" y="17" width="44" height="3"/><rect class="ln" x="8" y="51" width="40" height="3"/><rect class="ln" x="8" y="72" width="34" height="3"/>';
      for (var i = 0; i < b.k; i++) {
        var s = spots[i];
        svg += '<rect class="bb" x="' + s[0] + '" y="' + s[1] + '" width="' + s[2] + '" height="' + s[3] + '" style="animation-delay:' + (i * 0.35).toFixed(2) + 's"/>';
      }
      svg += '</svg>';
      h += '<div class="bp">' + svg + '<div class="bp-bar"><i style="--h:' + (b.n / max * 100).toFixed(1) + '%"></i></div><p class="bp-n num">' + SW.fmt(b.n) + '</p><p class="bp-k">' + b.k + (b.k === 1 ? ' region' : ' regions') + ' per page</p></div>';
    });
    host.innerHTML = h;
    SW.replay(host.closest('.boxes'), 'go');
  })();

  /* ---------------- other replay hooks ---------------- */
  ['.funnel', '.formal', '.den'].forEach(function (s) { SW.replay(document.querySelector(s), 'go'); });

  /* ---------------- Table 3 mini bars ---------------- */
  (function phish() {
    var host = $('phish');
    if (!host) return;
    var h = '<div class="ph-row head"><span>Method</span><span>Accuracy</span><span>Precision</span><span>Recall</span><span>F1</span></div>';
    D.binary.forEach(function (b) {
      var me = b.method === 'ScamDet';
      h += '<div class="ph-row' + (me ? ' me' : '') + '"><span class="ph-m">' + b.method + '</span>';
      ['acc', 'p', 'r', 'f1'].forEach(function (k) { h += '<span class="ph-c" style="--w:' + b[k] + '%"><i></i><span>' + b[k].toFixed(1) + '</span></span>'; });
      h += '</div>';
    });
    host.innerHTML = h;
    SW.replay(host, 'go');
  })();

  /* ---------------- unit chart: 5,658 pages ---------------- */
  (function dots() {
    var cv = $('dots');
    if (!cv || !cv.getContext) return;
    var C = D.confusion, ctx = cv.getContext('2d');
    var N = C.tp + C.fn + C.fp + C.tn;
    var W, H, s, rowsA, rowsB, yA, yB, pts = [], built = false;
    var RED = '#E4002B', INK = '#0B0B0C', FONT = '"ScamWeb Heros", Helvetica, Arial, sans-serif';
    function build() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      if (!W || !H) return;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var top = 24, gapRow = 38, bottom = 6;
      for (s = 7; s >= 2; s -= 0.25) {
        var cols = Math.floor(W / s);
        rowsA = Math.ceil((C.tp + C.fn) / cols);
        rowsB = Math.ceil((C.fp + C.tn) / cols);
        rowsA = Math.max(rowsA, 1); rowsB = Math.max(rowsB, 1);
        // equalise row counts so the two blocks share a grid: pick rows per block from W
        if (top + rowsA * s + gapRow + rowsB * s + bottom <= H) break;
      }
      // prefer a taller, narrower block when there is room
      var usable = H - top - gapRow - bottom;
      var rows = Math.floor(usable / s / 2);
      if (rows > rowsA) { rowsA = rows; rowsB = rows; }
      yA = top; yB = top + rowsA * s + gapRow;
      pts = [];
      function block(count, start, rowsN, y0, kind) {
        for (var i = 0; i < count; i++) {
          var idx = start + i, col = Math.floor(idx / rowsN), row = idx % rowsN;
          pts.push({ kind: kind, tx: col * s, ty: y0 + row * s, col: col, sx: 0, sy: 0 });
        }
      }
      block(C.tp, 0, rowsA, yA, 0);
      block(C.fn, C.tp, rowsA, yA, 1);
      block(C.fp, 0, rowsB, yB, 2);
      block(C.tn, C.fp, rowsB, yB, 3);
      scatter();
      built = true;
    }
    function scatter() {
      for (var i = 0; i < pts.length; i++) { pts[i].sx = Math.random() * (W - s); pts[i].sy = 18 + Math.random() * (H - 24); }
    }
    var colsMax = 1;
    function colsOf() { colsMax = 1; for (var i = 0; i < pts.length; i++) if (pts[i].col > colsMax) colsMax = pts[i].col; }
    function draw(p, labels) {
      ctx.clearRect(0, 0, W, H);
      var d = Math.max(1.2, s - (s > 4 ? 1.4 : 0.6)), hollow = s >= 4;
      var styles = [[RED, false], [RED, hollow], [INK, false], [INK, hollow]];
      for (var k = 0; k < 4; k++) {
        var col = styles[k][0], hol = styles[k][1];
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1;
        ctx.globalAlpha = (!hollow && (k === 1 || k === 3)) ? 0.32 : 1;
        if (!hollow && k === 3) ctx.fillStyle = '#9C9CA3';
        ctx.beginPath();
        for (var i = 0; i < pts.length; i++) {
          var q = pts[i];
          if (q.kind !== k) continue;
          var e = p(q);
          var x = SW.lerp(q.sx, q.tx, e), y = SW.lerp(q.sy, q.ty, e);
          if (hol) ctx.rect(x + 0.5, y + 0.5, d - 1, d - 1); else ctx.rect(x, y, d, d);
        }
        if (hol) ctx.stroke(); else ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (labels > 0) {
        ctx.globalAlpha = labels;
        ctx.fillStyle = INK;
        ctx.font = '700 13px ' + FONT;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Scam pages  ' + SW.fmt(C.tp + C.fn), 0, yA - 8);
        ctx.fillText('Benign pages  ' + SW.fmt(C.fp + C.tn), 0, yB - 8);
        ctx.font = '400 12px ' + FONT;
        ctx.fillStyle = RED;
        var fnx = Math.floor(C.tp / rowsA) * s;
        ctx.textAlign = 'right';
        ctx.fillText('95 missed', Math.min(W, fnx + Math.ceil(C.fn / rowsA) * s + 2), yA - 8);
        ctx.fillStyle = INK;
        var fpx = Math.ceil((C.fp + C.tn) / rowsB) * s;
        ctx.fillText('542 passed', Math.min(W, fpx + 2), yB - 8);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      }
    }
    function finalP() { return 1; }
    function start() { if (!built) { build(); colsOf(); } }
    window.addEventListener('resize', function () { built = false; start(); if (SW.reduced || SW.paused) draw(finalP, 1); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (built && (SW.reduced || SW.paused)) draw(finalP, 1); });
    if (SW.reduced) { start(); draw(finalP, 1); return; }
    var T_IN = 700, T_SORT = 1900, T_LAB = 3000, T_OUT = 10600, D_ALL = 12400;
    var lastCycle = -1;
    new SW.Loop(cv, D_ALL, function (t, cycle) {
      start();
      if (!built) return;
      if (cycle !== lastCycle) { lastCycle = cycle; if (cycle > 0) scatter(); }
      var lab = SW.clamp((t - T_LAB) / 500) * (1 - SW.clamp((t - T_OUT) / 400));
      if (t < T_OUT) {
        var span = T_SORT;
        draw(function (q) {
          var delay = T_IN + (q.col / colsMax) * 900 + (q.kind >= 2 ? 120 : 0);
          return SW.easeIO(SW.clamp((t - delay) / span * 2.2));
        }, lab);
        if (t < T_IN) { ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = 'rgba(0,0,0,' + SW.clamp(t / T_IN) + ')'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
      } else {
        var o = SW.clamp((t - T_OUT) / 1300);
        draw(function (q) { return 1 - SW.easeIO(SW.clamp(o * 1.6 - (q.col / colsMax) * 0.6)); }, lab);
        var fade = SW.clamp((t - (D_ALL - 500)) / 500);
        if (fade > 0) { ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = 'rgba(0,0,0,' + (1 - fade) + ')'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
      }
    });
  })();

  /* ---------------- leaderboard (Table 5) ---------------- */
  (function leaderboard() {
    var list = $('lb-rows'), tabs = $('lb-tabs');
    if (!list || !tabs) return;
    var M = [
      { k: 'binR', l: 'Scam recall', dec: 1 },
      { k: 'acc', l: 'Subtype accuracy', dec: 1 },
      { k: 'mF1', l: 'Macro F1', dec: 1 },
      { k: 'miou', l: 'mIoU', dec: 3 },
      { k: 'gF1', l: 'Grounding F1@0.5', dec: 1 },
      { k: 'r05', l: 'Page recall@0.5', dec: 1 },
      { k: 'bert', l: 'BERTScore', dec: 1 },
      { k: 'cov', l: 'Coverage', dec: 1 },
      { k: 'valid', l: 'Valid outputs', dec: 1 },
      { k: 'avg', l: 'Tokens per page', dec: 0, low: true }
    ];
    var rows = D.leaderboard.map(function (r) {
      var li = document.createElement('li');
      li.className = 'lb-row' + (r.model === 'ScamDet' ? ' me' : '');
      li.innerHTML = '<span class="lb-name" title="' + esc(r.model) + '">' + esc(r.model) + '</span><span class="lb-track"><i></i></span><span class="lb-val num"></span>';
      list.appendChild(li);
      return { r: r, el: li, bar: li.querySelector('i'), val: li.querySelector('.lb-val') };
    });
    var btns = M.map(function (m, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.innerHTML = m.l + '<i></i>';
      tabs.appendChild(b);
      return b;
    });
    var cur = -1, auto = !SW.reduced;
    function show(i) {
      if (i === cur) return;
      cur = i;
      var m = M[i];
      btns.forEach(function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
      var vals = rows.map(function (x) { return x.r[m.k]; });
      var max = Math.max.apply(null, vals);
      var best = m.low ? Math.min.apply(null, vals) : max;
      var sorted = rows.slice().sort(function (a, b) { return m.low ? a.r[m.k] - b.r[m.k] : b.r[m.k] - a.r[m.k]; });
      var first = new Map();
      rows.forEach(function (x) { first.set(x.el, x.el.getBoundingClientRect().top); });
      sorted.forEach(function (x) { list.appendChild(x.el); });
      rows.forEach(function (x) {
        x.bar.style.setProperty('--w', (x.r[m.k] / max * 100).toFixed(2) + '%');
        x.val.textContent = SW.fmt(x.r[m.k], m.dec);
        x.el.classList.toggle('best', x.r[m.k] === best);
        var dy = first.get(x.el) - x.el.getBoundingClientRect().top;
        if (dy && !SW.reduced) { x.el.style.transition = 'none'; x.el.style.transform = 'translateY(' + dy + 'px)'; }
      });
      requestAnimationFrame(function () { requestAnimationFrame(function () { rows.forEach(function (x) { x.el.style.transition = ''; x.el.style.transform = ''; }); }); });
      var note = document.querySelector('#leaderboard .lb-head .note');
      if (note) note.textContent = 'Zero-shot, single-model comparison on the 3,324-page scam subset (Table 5). Bars scale to the largest value of the chosen metric' + (m.low ? '; fewer tokens is cheaper.' : '.');
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { auto = false; btns.forEach(function (x) { x.querySelector('i').style.transform = 'scaleX(0)'; }); show(i); });
    });
    show(0);
    if (auto) {
      var STEP = 4200;
      new SW.Loop(list, STEP * M.length, function (t) {
        if (!auto) return;
        var i = Math.floor(t / STEP), p = (t % STEP) / STEP;
        show(i);
        btns.forEach(function (b, j) { b.querySelector('i').style.transform = 'scaleX(' + (j === i ? p.toFixed(3) : 0) + ')'; });
      }, { threshold: 0.3 });
    }
    // full table
    var t5 = $('t5');
    if (t5) {
      var cols = [['valid', 1], ['binR', 1], ['acc', 1], ['mP', 1], ['mR', 1], ['mF1', 1], ['miou', 3], ['gP', 1], ['gR', 1], ['gF1', 1], ['r03', 1], ['r05', 1], ['rl', 1], ['bert', 1], ['cov', 1], ['tok', 2], ['avg', 0]];
      var bestOf = {};
      cols.forEach(function (c) {
        var v = D.leaderboard.map(function (r) { return r[c[0]]; });
        bestOf[c[0]] = c[0] === 'tok' || c[0] === 'avg' ? Math.min.apply(null, v) : Math.max.apply(null, v);
      });
      var h = '<thead><tr><th rowspan="2">Model</th><th>Valid</th><th>Binary</th><th colspan="4">Subtype</th><th colspan="6">Grounding</th><th colspan="3">Rationale</th><th colspan="2">Tokens</th></tr>' +
        '<tr><th>out.</th><th>scam R</th><th>Acc.</th><th>mP</th><th>mR</th><th>mF1</th><th>mIoU</th><th>P</th><th>R</th><th>F1</th><th>R@.3</th><th>R@.5</th><th>R-L</th><th>BERT</th><th>Cov.</th><th>total (M)</th><th>per page</th></tr></thead><tbody>';
      D.leaderboard.forEach(function (r) {
        h += '<tr' + (r.model === 'ScamDet' ? ' class="me"' : '') + '><td>' + esc(r.model) + '</td>';
        cols.forEach(function (c) {
          var v = r[c[0]];
          var txt = c[0] === 'miou' ? v.toFixed(3).replace(/^0/, '') : SW.fmt(v, c[1]);
          h += '<td' + (v === bestOf[c[0]] ? ' class="best"' : '') + '>' + txt + '</td>';
        });
        h += '</tr>';
      });
      t5.innerHTML = h + '</tbody>';
    }
  })();

  /* ---------------- bubble chart (Figure 3, re-plotted from Tables 8 and 10) ---------------- */
  (function bubble() {
    var svg = $('bubble'), tip = $('bub-tip'), spot = $('spot');
    if (!svg) return;
    var VW = 640, VH = 460, L = 58, R = 18, T = 34, B = 54;
    var X = function (v) { return L + v / 90 * (VW - L - R); };
    var Y = function (v) { return VH - B - v / 26 * (VH - T - B); };
    var g = el('g', {}, svg);
    [0, 5, 10, 15, 20, 25].forEach(function (v) {
      el('line', { class: 'gl', x1: L, x2: VW - R, y1: Y(v), y2: Y(v) }, g);
      var t = el('text', { class: 'tkl', x: L - 10, y: Y(v) + 4, 'text-anchor': 'end' }, g); t.textContent = v;
    });
    [0, 20, 40, 60, 80].forEach(function (v) {
      var t = el('text', { class: 'tkl', x: X(v), y: VH - B + 20, 'text-anchor': 'middle' }, g); t.textContent = v;
    });
    el('line', { class: 'ax', x1: L, x2: VW - R, y1: VH - B, y2: VH - B }, g);
    el('line', { class: 'ax', x1: L, x2: L, y1: T - 6, y2: VH - B }, g);
    var xl = el('text', { class: 'axl', x: (L + VW - R) / 2, y: VH - 10, 'text-anchor': 'middle' }, g); xl.textContent = 'Subtype classification F1 (%)';
    var yl = el('text', { class: 'axl', x: 0, y: 0, 'text-anchor': 'middle', transform: 'translate(16 ' + ((T + VH - B) / 2) + ') rotate(-90)' }, g); yl.textContent = 'Region grounding F1@0.5 (%)';
    el('line', { class: 'ref', x1: X(34.5), x2: X(34.5), y1: T - 6, y2: VH - B }, g);
    var rx = el('text', { class: 'refl', x: X(34.5) + 6, y: T + 6 }, g); rx.textContent = 'Macro F1 34.5';
    el('line', { class: 'ref', x1: L, x2: VW - R, y1: Y(5.5), y2: Y(5.5) }, g);
    var ry = el('text', { class: 'refl', x: VW - R, y: Y(5.5) - 6, 'text-anchor': 'end' }, g); ry.textContent = 'Overall F1 5.5';
    var rho = el('text', { class: 'rho', x: VW - R, y: T + 6, 'text-anchor': 'end' }, g); rho.textContent = 'Spearman ρ = 0.13';

    // labels as in the paper's figure, with offsets that keep them clear of neighbours
    var lab = {
      'Online Shopping Scam': ['Online Shopping', 0, 34, 'end'],
      'Cryptocurrency Investment Scam': ['Crypto Investment', -22, 4, 'end'],
      'Online Gambling Scam': ['Online Gambling', 0, -21, 'middle'],
      'Technical Support Scam': ['Technical Support', 34, -14, 'start'],
      'Social Media Scam': ['Social Media', -18, -8, 'end'],
      'Spoofed Login Page': ['Spoofed Login', 18, -12, 'start']
    };
    var items = D.subtypes.slice().sort(function (a, b) { return b.n - a.n; });
    var nodes = [];
    items.forEach(function (s, i) {
      var r = 6.4 * Math.sqrt(Math.log(1 + s.n));
      var gg = el('g', { class: 'bub' + (lab[s.name] ? ' lab' : ''), tabindex: 0, role: 'img', 'aria-label': s.name + ': subtype F1 ' + s.f1 + ', grounding F1 ' + s.gf1 }, svg);
      var inner = el('g', { class: 'bub-g', style: 'transition-delay:' + (i * 40) + 'ms' }, gg);
      el('circle', { cx: X(s.f1), cy: Y(s.gf1), r: r.toFixed(2) }, inner);
      if (lab[s.name]) {
        var L2 = lab[s.name];
        var tt = el('text', { x: X(s.f1) + L2[1], y: Y(s.gf1) + L2[2], 'text-anchor': L2[3] }, inner);
        tt.textContent = L2[0];
      }
      nodes.push({ s: s, g: gg });
    });
    SW.replay(svg, 'go');

    function describe(s) {
      return '<p class="sp-n">' + esc(s.name) + '</p><p class="sp-v">Subtype F1 <b>' + s.f1.toFixed(1) + '</b> &middot; grounding F1 <b>' + s.gf1.toFixed(1) + '</b> &middot; mIoU <b>' + s.miou.toFixed(3) + '</b><br>' + SW.fmt(s.n) + ' expert-annotated pages</p>';
    }
    var hover = null;
    function focus(node) {
      nodes.forEach(function (n) { n.g.classList.toggle('on', n === node); });
      if (spot && node) spot.innerHTML = describe(node.s);
    }
    function showTip(n, evt) {
      if (!tip) return;
      var box = svg.getBoundingClientRect(), host = svg.parentNode.getBoundingClientRect();
      var c = n.g.querySelector('circle');
      var cx = parseFloat(c.getAttribute('cx')) / VW * box.width + (box.left - host.left);
      var cy = parseFloat(c.getAttribute('cy')) / VH * box.height + (box.top - host.top);
      tip.innerHTML = '<b>' + esc(n.s.name) + '</b>Subtype F1 ' + n.s.f1.toFixed(1) + ' &middot; grounding F1 ' + n.s.gf1.toFixed(1) + '<br>mIoU ' + n.s.miou.toFixed(3) + ' &middot; ' + SW.fmt(n.s.n) + ' pages';
      tip.style.left = cx + 'px'; tip.style.top = cy + 'px';
      tip.hidden = false;
    }
    nodes.forEach(function (n) {
      function on(e) { hover = n; focus(n); showTip(n, e); }
      function off() { hover = null; if (tip) tip.hidden = true; }
      n.g.addEventListener('mouseenter', on);
      n.g.addEventListener('focus', on);
      n.g.addEventListener('mouseleave', off);
      n.g.addEventListener('blur', off);
    });
    var tour = ['Online Shopping Scam', 'Cryptocurrency Investment Scam', 'Online Gambling Scam', 'Social Media Scam', 'Spoofed Login Page', 'Technical Support Scam', 'Lottery / Prize Scam', 'Fraudulent Personal Website Scam'];
    var tourNodes = tour.map(function (name) { return nodes.filter(function (n) { return n.s.name === name; })[0]; });
    focus(tourNodes[0]);
    if (!SW.reduced) {
      var STEP = 3400, last = -1;
      new SW.Loop(svg, STEP * tourNodes.length, function (t) {
        if (hover) return;
        var i = Math.floor(t / STEP);
        if (i !== last) { last = i; focus(tourNodes[i]); }
      }, { threshold: 0.3 });
    }
    // interactive / paper figure toggle
    var segBtns = document.querySelectorAll('[data-bview]'), paper = document.querySelector('.bub-paper'), wrap = svg.parentNode;
    segBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-bview') === 'paper';
        segBtns.forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        wrap.hidden = p; if (paper) paper.hidden = !p;
      });
    });
  })();
})();
