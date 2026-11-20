/* ScamWeb project page: task cards, ScamDet cascade, case studies. */
(function () {
  'use strict';
  var SW = window.SW, D = window.SW_DATA;
  if (!SW) return;
  function $(id) { return document.getElementById(id); }
  function qa(root, s) { return Array.prototype.slice.call(root.querySelectorAll(s)); }

  /* ---------------- GroundScam: highlight the coupled tasks in order ---------------- */
  var row = $('tasks-row');
  if (row && !SW.reduced) {
    var cards = qa(row, '.task'), lastT = -1;
    new SW.Loop(row, 2600 * cards.length, function (t) {
      var i = Math.floor(t / 2600);
      if (i !== lastT) { lastT = i; cards.forEach(function (c, j) { c.classList.toggle('on', j === i); }); }
    }, { threshold: 0.25 });
  }

  /* subtype ticker */
  var tick = $('ticker');
  if (tick && D) {
    var names = D.subtypes.map(function (s) { return s.name; });
    tick.innerHTML = names.map(function (n) { return '<li>' + n + '</li>'; }).join('');
    var lis = qa(tick, 'li'), ROW = 26, cur = -1;
    function land(i, animate) {
      if (i === cur) return;
      if (!animate) tick.style.transition = 'none';
      tick.style.transform = 'translateY(' + (-i * ROW) + 'px)';
      if (!animate) { void tick.offsetWidth; tick.style.transition = ''; }
      lis.forEach(function (li, j) { li.classList.toggle('on', j === i); });
      cur = i;
    }
    var shop = names.indexOf('Online Shopping Scam');
    land(shop, false);
    if (!SW.reduced) {
      new SW.Loop(tick.parentNode, 1250 * names.length, function (t) {
        land((shop + Math.floor(t / 1250)) % names.length, true);
      }, { threshold: 0.25 });
    }
  }

  /* IoU demonstration: the readout is the live IoU of the two drawn boxes */
  var iouSvg = $('iou-svg');
  if (iouSvg) {
    var gold = { x: 60, y: 48, w: 110, h: 52 };
    var pred = iouSvg.querySelector('.iou-pred'), val = $('iou-val'), flag = $('iou-flag');
    var keys = [
      { x: 132, y: 72, w: 74, h: 42 },
      { x: 92, y: 60, w: 100, h: 50 },
      { x: 66, y: 52, w: 106, h: 50 },
      { x: 34, y: 34, w: 168, h: 80 }
    ];
    function iou(a, b) {
      var ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      var iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      var inter = ix * iy, uni = a.w * a.h + b.w * b.h - inter;
      return uni > 0 ? inter / uni : 0;
    }
    function setBox(b) {
      pred.setAttribute('x', b.x.toFixed(1)); pred.setAttribute('y', b.y.toFixed(1));
      pred.setAttribute('width', b.w.toFixed(1)); pred.setAttribute('height', b.h.toFixed(1));
      var v = iou(gold, b);
      val.textContent = v.toFixed(2);
      var ok = v >= 0.5;
      flag.textContent = ok ? 'match at 0.5' : 'below 0.5';
      flag.classList.toggle('ok', ok);
    }
    var SEG = 2400, MOVE = 1100;
    setBox(SW.reduced ? keys[2] : keys[0]);
    if (!SW.reduced) {
      new SW.Loop(iouSvg, SEG * keys.length, function (t) {
        var i = Math.floor(t / SEG), p = SW.easeIO(SW.clamp(((t % SEG) - (SEG - MOVE)) / MOVE));
        var a = keys[i], b = keys[(i + 1) % keys.length];
        setBox({ x: SW.lerp(a.x, b.x, p), y: SW.lerp(a.y, b.y, p), w: SW.lerp(a.w, b.w, p), h: SW.lerp(a.h, b.h, p) });
      }, { threshold: 0.25 });
    }
  }

  /* ---------------- ScamDet cascade ---------------- */
  var sd = $('sd');
  if (sd) {
    var diag = $('sd-diagram'), out = $('sd-out'), status = $('sd-status');
    var nodes = {};
    qa(diag, '[data-s]').forEach(function (n) { var k = n.getAttribute('data-s'); (nodes[k] = nodes[k] || []).push(n); });
    var OUT0 = out ? out.innerHTML : '';
    var scamSteps = [
      ['in', 0, 900], ['au', 900, 0], ['at', 1700, 0], ['av', 2500, 0], ['ac', 3300, 0],
      ['s1', 4400, 0], ['s2', 5400, 0], ['s3', 6400, 0], ['s4', 7400, 0], ['out', 8400, 0]
    ];
    var benignSteps = [
      ['in', 0, 900], ['au', 900, 0], ['at', 1700, 0], ['av', 2500, 0], ['ac', 3300, 0],
      ['s1', 4400, 0], ['stop', 5300, 0], ['out', 6200, 0]
    ];
    function clear() {
      Object.keys(nodes).forEach(function (k) { nodes[k].forEach(function (n) { n.classList.remove('on', 'done', 'skip'); }); });
    }
    function apply(steps, t, benign) {
      steps.forEach(function (st, i) {
        var k = st[0], t0 = st[1], dur = st[2] || 1000;
        var next = steps[i + 1] ? steps[i + 1][1] : 1e9;
        var on = t >= t0 && t < Math.max(t0 + dur, next) && k !== 'out' && k !== 'stop';
        var done = t >= Math.max(t0 + dur, next);
        (nodes[k] || []).forEach(function (n) {
          if (k === 'out' || k === 'stop') { n.classList.toggle('on', t >= t0); return; }
          n.classList.toggle('on', on);
          n.classList.toggle('done', done);
        });
      });
      if (benign) ['s2', 's3', 's4'].forEach(function (k) { (nodes[k] || []).forEach(function (n) { n.classList.toggle('skip', t >= 5300); }); });
    }
    var mode = -1;
    function setMode(benign) {
      if (mode === (benign ? 1 : 0)) return;
      mode = benign ? 1 : 0;
      clear();
      if (out) out.innerHTML = benign ? '&Ocirc; = (0, &empty;, &empty;)' : '&Ocirc; = (1, Online Shopping Scam, 4 regions)';
      if (status) status.textContent = benign ? 'Animation: a page judged benign leaves the cascade after Stage 1.' : 'Animation: the Figure 2 page passes all four stages.';
    }
    if (SW.reduced) {
      setMode(false);
      scamSteps.forEach(function (st) { (nodes[st[0]] || []).forEach(function (n) { n.classList.add(st[0] === 'out' ? 'on' : 'done'); }); });
    } else {
      setMode(false);
      new SW.Loop(diag, 12000, function (t, cycle) {
        var benign = cycle % 2 === 1;
        setMode(benign);
        apply(benign ? benignSteps : scamSteps, t, benign);
      }, { threshold: 0.2 });
    }
    // animation / paper figure toggle
    var segBtns = qa(sd, '[data-view]');
    segBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-view') === 'paper';
        sd.classList.toggle('paper', p);
        segBtns.forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        if (status) status.style.visibility = p ? 'hidden' : '';
      });
    });
    void OUT0;
  }

  /* ---------------- case studies (Figure 4) ---------------- */
  var viewer = $('case-viewer');
  if (viewer) {
    var CASES = [
      { img: 'assets/cases/case-a.webp', w: 954, h: 503,
        alt: 'Case (a): an online storefront where expert and predicted boxes agree',
        chips: [['Binary: correct', ''], ['Subtype: correct', ''], ['Grounding: correct', '']],
        desc: 'Implausibly low prices and an inconsistent product catalogue give ScamDet enough evidence for the right fraud label, the right subtype and boxes that match the experts.' },
      { img: 'assets/cases/case-b.webp', w: 954, h: 501,
        alt: 'Case (b): a polished corporate page that the cascade passed as benign',
        chips: [['Binary: false negative', 'bad'], ['Subtype: not reached', 'na'], ['Grounding: not reached', 'na']],
        desc: 'A polished corporate presentation hides the mismatch between the domain and the claimed identity. The page is called benign, so the cascade stops before any subtype or evidence is predicted.' },
      { img: 'assets/cases/case-c.webp', w: 948, h: 533,
        alt: 'Case (c): an online investment page classified as a cryptocurrency investment scam',
        chips: [['Binary: correct', ''], ['Subtype: misclassified', 'bad']],
        desc: 'Shared blockchain and liquidity vocabulary leads ScamDet to label an Online Investment Scam as a Cryptocurrency Investment Scam.' },
      { img: 'assets/cases/case-d.webp', w: 954, h: 503,
        alt: 'Case (d): a gambling page where the predicted boxes cover only fragments of the expert region',
        chips: [['Binary: correct', ''], ['Gambling intent recognized', ''], ['Grounding: fragments only', 'bad']],
        desc: 'ScamDet recognizes the gambling intent but localizes only fragments of the promotional evidence instead of the complete expert-annotated region.' }
    ];
    var img = $('case-img'), chips = $('case-chips'), desc = $('case-desc'), prog = $('case-prog');
    var tabs = qa(viewer, '[data-case]');
    var idx = -1;
    CASES.forEach(function (c) { var im = new Image(); im.src = c.img; });
    function select(i) {
      if (i === idx) return;
      idx = i;
      var c = CASES[i];
      img.classList.remove('kb');
      img.src = c.img; img.alt = c.alt; img.width = c.w; img.height = c.h;
      if (!SW.reduced) { void img.offsetWidth; img.classList.add('kb'); }
      chips.innerHTML = c.chips.map(function (ch) { return '<li' + (ch[1] ? ' class="' + ch[1] + '"' : '') + '>' + ch[0] + '</li>'; }).join('');
      desc.textContent = c.desc;
      tabs.forEach(function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); b.tabIndex = j === i ? 0 : -1; });
    }
    select(0);
    var STEP = 7000, loop = null;
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () {
        select(i);
        if (loop) loop.reset(i * STEP);
      });
      b.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? i - 1 : -9;
        if (j === -9) return;
        e.preventDefault();
        j = (j + tabs.length) % tabs.length;
        select(j); tabs[j].focus();
        if (loop) loop.reset(j * STEP);
      });
    });
    if (!SW.reduced) {
      loop = new SW.Loop(viewer, STEP * CASES.length, function (t) {
        var i = Math.floor(t / STEP);
        select(i);
        if (prog) prog.style.width = (((t % STEP) / STEP) * 100).toFixed(2) + '%';
      }, { threshold: 0.3 });
    } else if (prog) prog.style.width = '0';
  }
})();
