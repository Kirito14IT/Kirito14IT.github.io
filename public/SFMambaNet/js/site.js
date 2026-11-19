/* SFMambaNet project page — shared helpers and page-wide motion:
   reveal on scroll, count-up numbers, card spotlight, scroll progress, the hero title, copy buttons. */
(function () {
  'use strict';
  const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hasIO = 'IntersectionObserver' in window;

  const ease = {
    out: t => 1 - Math.pow(1 - t, 3),
    inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    linear: t => t,
  };

  /* requestAnimationFrame tween; returns a cancel function */
  function tween(ms, onUpdate, done, easing) {
    if (reduced || ms <= 0) { onUpdate(1); if (done) done(); return () => {}; }
    const f = easing || ease.out;
    let raf = 0, t0 = -1, live = true;
    const step = now => {
      if (!live) return;
      if (t0 < 0) t0 = now;
      const k = Math.min(1, (now - t0) / ms);
      onUpdate(f(k));
      if (k < 1) raf = requestAnimationFrame(step);
      else if (done) done();
    };
    raf = requestAnimationFrame(step);
    return () => { live = false; cancelAnimationFrame(raf); };
  }

  /* run cb once when el first scrolls into view */
  function onVisible(el, cb, margin) {
    if (!el) return;
    if (!hasIO) { cb(); return; }
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { io.disconnect(); cb(); }
    }, { rootMargin: margin || '0px 0px -10% 0px' });
    io.observe(el);
  }

  /* report visibility changes (used to pause loops off screen) */
  function watch(el, cb, threshold) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    const io = new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting)), { threshold: threshold || 0.02 });
    io.observe(el);
  }

  const fmt = (v, dec) => v.toLocaleString('en-US', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });

  function countTo(el, to, o) {
    if (!el) return;
    o = o || {};
    const dec = o.dec || 0, from = o.from == null ? 0 : o.from, pre = o.prefix || '', suf = o.suffix || '';
    if (el._cancelCount) el._cancelCount();
    el._cancelCount = tween(o.ms || 1300, k => { el.textContent = pre + fmt(from + (to - from) * k, dec) + suf; }, null, ease.out);
  }

  window.SFMUI = { reduced, ease, tween, onVisible, watch, fmt, countTo };

  /* ---------- hero title: one span per letter ---------- */
  document.querySelectorAll('.w-smooth, .w-erratic').forEach(w => {
    const text = w.textContent, n = text.length, smooth = w.classList.contains('w-smooth');
    w.textContent = '';
    w.setAttribute('aria-label', text);
    [...text].forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i);
      if (smooth) { s.style.backgroundSize = (n * 100) + '% 100%'; s.style.backgroundPosition = (n > 1 ? (i / (n - 1)) * 100 : 0) + '% 0'; }
      s.textContent = c;
      w.appendChild(s);
    });
  });

  /* ---------- stagger groups ---------- */
  document.querySelectorAll('[data-stagger]').forEach(g => {
    [...g.children].forEach((c, i) => c.style.setProperty('--rd', (i * 0.08).toFixed(2) + 's'));
  });

  /* ---------- reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (!hasIO || reduced) reveals.forEach(el => el.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => io.observe(el));
  }

  /* ---------- count-up numbers ---------- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduced) return;
    el.textContent = pre + fmt(0, dec) + suf;
    onVisible(el, () => countTo(el, to, { dec, prefix: pre, suffix: suf, ms: 1500 }), '0px 0px -5% 0px');
  });

  /* ---------- spotlight that follows the pointer on cards ---------- */
  document.addEventListener('pointermove', e => {
    const el = e.target.closest && e.target.closest('.fx');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
  }, { passive: true });

  /* ---------- scroll progress ---------- */
  const bar = document.querySelector('.progress i');
  if (bar) {
    let ticking = false;
    const upd = () => {
      ticking = false;
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0).toFixed(4) + ')';
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd);
    upd();
  }

  /* ---------- copy buttons ---------- */
  document.querySelectorAll('.term-copy').forEach(b => b.addEventListener('click', async () => {
    const pre = document.getElementById(b.dataset.copy);
    if (!pre) return;
    const text = pre.textContent.replace(/\s+$/, '') + '\n';
    try { await navigator.clipboard.writeText(text); }
    catch (err) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e2) { /* nothing else to try */ }
      ta.remove();
    }
    b.textContent = 'Copied'; b.classList.add('done');
    setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('done'); }, 1600);
  }));

  /* ---------- simple tab groups: <div class="tabs"> of <button class="tab"> ---------- */
  window.SFMUI.tabs = function (group, onPick) {
    const btns = [...group.querySelectorAll('.tab')];
    const set = b => btns.forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
    btns.forEach(b => b.addEventListener('click', () => { set(b); onPick(b, true); }));
    return { set: b => set(b), btns };
  };
})();
