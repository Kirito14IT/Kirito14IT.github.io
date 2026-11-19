/* Match lines from the paper's qualitative figure, drawn over the real image pairs.
   Hero: one pair cycles Putative → BCLNet → MatchMamba → SFMambaNet; a scan beam wipes each method in.
   Gallery: any of the seven pairs, with a draggable divider between a baseline and SFMambaNet. */
(function () {
  'use strict';
  const SC = window.SFM_SCENES, UI = window.SFMUI;
  if (!SC || !UI) return;
  const byId = {};
  SC.forEach(s => { byId[s.id] = s; });
  const NAMES = { putative: 'Putative', bclnet: 'BCLNet', matchmamba: 'MatchMamba', sfmambanet: 'SFMambaNet' };
  const cache = {};
  const load = id => cache[id] || (cache[id] = fetch('assets/scenes/' + id + '.json').then(r => {
    if (!r.ok) throw new Error('scene ' + id + ': ' + r.status);
    return r.json();
  }));
  const preload = src => new Promise(res => { const im = new Image(); im.onload = im.onerror = () => res(); im.src = src; });
  const place = (img, box) => { img.style.left = (box[0] * 100) + '%'; img.style.width = ((box[2] - box[0]) * 100) + '%'; };

  /* one canvas over an image pair: method `left` is drawn left of `split`, method `right` to its right */
  function Stage(el) {
    this.el = el;
    this.cv = el.querySelector('canvas');
    this.ctx = this.cv.getContext('2d');
    this.imgs = el.querySelectorAll('img');
    this.w = 0; this.h = 0; this.paths = {};
    this.left = null; this.right = null; this.split = 1; this.data = null;
    if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(el);
    else addEventListener('resize', () => this.resize());
  }
  Stage.prototype.setScene = function (scene, data) {
    this.scene = scene; this.data = data; this.paths = {};
    this.el.style.aspectRatio = String(scene.layout.aspect);
    place(this.imgs[0], scene.layout.l);
    place(this.imgs[1], scene.layout.r);
    this.imgs[0].src = 'assets/scenes/' + scene.id + '-l.webp';
    this.imgs[1].src = 'assets/scenes/' + scene.id + '-r.webp';
    this.imgs[0].alt = scene.name + ', first view';
    this.imgs[1].alt = scene.name + ', second view';
    this.w = 0;
    this.resize();
  };
  Stage.prototype.resize = function () {
    const r = this.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w !== this.w || h !== this.h) { this.w = this.cv.width = w; this.h = this.cv.height = h; this.paths = {}; }
    this.draw();
  };
  Stage.prototype.path = function (m, k) {
    const key = m + k;
    if (this.paths[key]) return this.paths[key];
    const a = this.data.lines[m][k], p = new Path2D(), sx = this.w / 999, sy = this.h / 999;
    for (let i = 0; i < a.length; i += 4) { p.moveTo(a[i] * sx, a[i + 1] * sy); p.lineTo(a[i + 2] * sx, a[i + 3] * sy); }
    return (this.paths[key] = p);
  };
  Stage.prototype.paint = function (m, x0, x1) {
    if (!m || x1 <= x0) return;
    const c = this.ctx, u = this.w / 1000, dense = m === 'putative';
    c.save();
    c.beginPath(); c.rect(x0 * this.w, 0, (x1 - x0) * this.w, this.h); c.clip();
    c.lineCap = 'round';
    if (dense) {
      /* the putative set: inliers buried under three times as many outliers */
      c.strokeStyle = 'rgba(57, 255, 143, .7)'; c.lineWidth = 0.8 * u; c.stroke(this.path(m, 'g'));
      c.strokeStyle = 'rgba(255, 72, 72, .5)'; c.lineWidth = 0.8 * u; c.stroke(this.path(m, 'r'));
    } else {
      c.strokeStyle = 'rgba(255, 79, 79, .95)'; c.lineWidth = 1.45 * u; c.stroke(this.path(m, 'r'));
      c.strokeStyle = 'rgba(57, 255, 143, .17)'; c.lineWidth = 4.4 * u; c.stroke(this.path(m, 'g'));
      c.strokeStyle = '#39ff8f'; c.lineWidth = 1.35 * u; c.stroke(this.path(m, 'g'));
    }
    c.restore();
  };
  Stage.prototype.draw = function () {
    if (!this.w || !this.data) return;
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.paint(this.left, 0, this.split);
    this.paint(this.right, this.split, 1);
  };

  /* ---------------- hero ---------------- */
  const hero = document.getElementById('heroTheater');
  if (hero) {
    const scene = byId[hero.dataset.scene || 's2'];
    const st = new Stage(hero.querySelector('.th-stage'));
    const beam = hero.querySelector('.th-beam');
    const pills = [...hero.querySelectorAll('.pill')];
    const gB = hero.querySelector('.counts .g b'), rB = hero.querySelector('.counts .r b');
    const gL = hero.querySelector('.counts .g em'), rL = hero.querySelector('.counts .r em');
    const ORDER = ['putative', 'bclnet', 'matchmamba', 'sfmambanet'];
    const HOLD = { putative: 2600, bclnet: 2100, matchmamba: 2100, sfmambanet: 4300 };
    const WIPE = 1150;
    let cur = 'putative', timer = 0, visible = false, pausedUntil = 0, cancel = null, ready = false;

    const setPills = m => pills.forEach(p => {
      const on = p.dataset.m === m;
      p.classList.toggle('on', on);
      p.classList.toggle('bad', on && m === 'putative');
      p.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    const setCounts = (m, from) => {
      const now = scene.counts[m], was = scene.counts[from || m];
      UI.countTo(gB, now[0], { from: was[0], ms: 900 });
      UI.countTo(rB, now[1], { from: was[1], ms: 900 });
      gL.textContent = m === 'putative' ? 'inliers' : 'correct, kept';
      rL.textContent = m === 'putative' ? 'outliers' : 'wrong, kept';
    };
    function go(m) {
      if (!ready || m === cur) return;
      const from = cur;
      cur = m;
      setPills(m);
      setCounts(m, from);
      if (cancel) cancel();
      if (UI.reduced) { st.left = m; st.right = null; st.split = 1; st.draw(); return; }
      st.left = m; st.right = from; st.split = 0;
      beam.classList.add('go');
      cancel = UI.tween(WIPE, k => { st.split = k; beam.style.left = (k * 100).toFixed(2) + '%'; st.draw(); },
        () => { st.right = null; st.split = 1; st.draw(); beam.classList.remove('go'); cancel = null; }, UI.ease.inOut);
    }
    function schedule() {
      clearTimeout(timer);
      if (!visible || UI.reduced || !ready) return;
      timer = setTimeout(() => {
        if (Date.now() >= pausedUntil) go(ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length]);
        schedule();
      }, HOLD[cur] + WIPE);
    }
    pills.forEach(p => p.addEventListener('click', () => {
      pausedUntil = Date.now() + 9000;
      go(p.dataset.m);
      schedule();
    }));
    load(scene.id).then(data => {
      st.setScene(scene, data);
      st.left = 'putative'; st.split = 1; st.draw();
      ready = true;
      setPills('putative');
      UI.watch(hero, v => { visible = v; if (v) schedule(); else clearTimeout(timer); });
    }).catch(err => console.warn(err));
  }

  /* ---------------- gallery with a comparison divider ---------------- */
  const gal = document.getElementById('gallery');
  if (gal) {
    const stageEl = gal.querySelector('.cmp-stage');
    const st = new Stage(stageEl);
    const handle = gal.querySelector('.cmp-handle');
    const thumbs = [...gal.querySelectorAll('.thumb')];
    const pills = [...gal.querySelectorAll('.pill')];
    const k = name => gal.querySelector('[data-k="' + name + '"]');
    const out = { name: k('name'), set: k('set'), who: k('who'), tag: k('tag'), lg: k('lg'), lr: k('lr'), rg: k('rg'), rr: k('rr') };
    let scene = byId.s1, base = 'matchmamba', split = 0.5, touched = false, visible = false, tour = 0, sweepCancel = null, token = 0;

    function setSplit(x) {
      split = Math.max(0, Math.min(1, x));
      st.split = split;
      handle.style.left = (split * 100).toFixed(2) + '%';
      handle.setAttribute('aria-valuenow', Math.round(split * 100));
      st.draw();
    }
    function counts() {
      const a = scene.counts[base], b = scene.counts.sfmambanet;
      out.who.textContent = NAMES[base]; out.tag.textContent = NAMES[base];
      UI.countTo(out.lg, a[0], { from: +out.lg.textContent.replace(/,/g, '') || 0, ms: 700 });
      UI.countTo(out.lr, a[1], { from: +out.lr.textContent.replace(/,/g, '') || 0, ms: 700 });
      UI.countTo(out.rg, b[0], { from: +out.rg.textContent.replace(/,/g, '') || 0, ms: 700 });
      UI.countTo(out.rr, b[1], { from: +out.rr.textContent.replace(/,/g, '') || 0, ms: 700 });
    }
    function sweep() {
      if (sweepCancel) sweepCancel();
      if (UI.reduced) { setSplit(0.5); return; }
      const a = 0.92, b = 0.5;
      sweepCancel = UI.tween(1500, t => setSplit(a + (b - a) * t), () => { sweepCancel = null; }, UI.ease.inOut);
    }
    function show(id, withSweep) {
      const s = byId[id], my = ++token;
      thumbs.forEach(t => { const on = t.dataset.id === id; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
      Promise.all([load(id), preload('assets/scenes/' + id + '-l.webp'), preload('assets/scenes/' + id + '-r.webp')]).then(([data]) => {
        if (my !== token) return;
        scene = s;
        st.left = base; st.right = 'sfmambanet';
        st.setScene(s, data);
        out.name.textContent = s.name;
        out.set.textContent = s.dataset + ' · unseen scene';
        counts();
        if (withSweep) sweep(); else setSplit(split);
      }).catch(err => console.warn(err));
    }
    function stopTour() { touched = true; clearInterval(tour); if (sweepCancel) { sweepCancel(); sweepCancel = null; } }

    thumbs.forEach(t => t.addEventListener('click', () => { stopTour(); show(t.dataset.id, false); }));
    pills.forEach(p => p.addEventListener('click', () => {
      stopTour();
      base = p.dataset.m;
      pills.forEach(x => { const on = x === p; x.classList.toggle('on', on); x.classList.toggle('bad', on && base === 'putative'); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
      st.left = base;
      counts();
      st.draw();
    }));
    const xOf = e => { const r = stageEl.getBoundingClientRect(); return (e.clientX - r.left) / r.width; };
    let dragging = false;
    stageEl.addEventListener('pointerdown', e => {
      dragging = true; stopTour();
      try { stageEl.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      setSplit(xOf(e));
    });
    stageEl.addEventListener('pointermove', e => { if (dragging) setSplit(xOf(e)); });
    const end = () => { dragging = false; };
    stageEl.addEventListener('pointerup', end);
    stageEl.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault(); stopTour();
      if (e.key === 'Home') setSplit(0); else if (e.key === 'End') setSplit(1);
      else setSplit(split + (e.key === 'ArrowRight' ? 0.05 : -0.05));
    });

    let started = false;
    UI.watch(gal, v => {
      visible = v;
      if (v && !started) {
        started = true;
        show('s1', true);
        if (!UI.reduced) tour = setInterval(() => {
          if (!visible || touched) return;
          const i = SC.findIndex(s => s.id === scene.id);
          show(SC[(i + 1) % SC.length].id, true);
        }, 7000);
      }
    }, 0.15);
  }
})();
