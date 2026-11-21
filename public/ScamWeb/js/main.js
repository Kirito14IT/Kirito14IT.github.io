/* ScamWeb project page: shared runtime.
   Loops run only while their element is on screen and motion is not paused. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SW = window.SW = { reduced: reduced, paused: false, loops: [] };

  SW.fmt = function (v, dec) {
    dec = dec || 0;
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };
  SW.clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); };
  SW.lerp = function (a, b, t) { return a + (b - a) * t; };
  SW.ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  SW.easeIO = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* enter/leave observer */
  SW.watch = function (el, enter, leave, threshold) {
    if (!('IntersectionObserver' in window)) { if (enter) enter(); return null; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { if (enter) enter(e); } else if (leave) leave(e);
      });
    }, { threshold: threshold === undefined ? 0.12 : threshold });
    io.observe(el);
    return io;
  };

  /* replayable trigger: adds `cls` on entry, removes it once fully off screen */
  SW.replay = function (el, cls, onEnter) {
    if (!el) return;
    cls = cls || 'go';
    if (reduced || !('IntersectionObserver' in window)) { el.classList.add(cls); if (onEnter) onEnter(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio >= 0.2) {
          if (!el.classList.contains(cls)) { el.classList.add(cls); if (onEnter) onEnter(); }
        } else if (!e.isIntersecting) el.classList.remove(cls);
      });
    }, { threshold: [0, 0.2] });
    io.observe(el);
  };

  /* rAF timeline that only ticks while visible */
  function Loop(el, duration, frame, opts) {
    opts = opts || {};
    this.el = el; this.d = duration; this.frame = frame; this.onCycle = opts.onCycle;
    this.t = opts.start || 0; this.cycle = 0; this.visible = false; this.raf = 0; this.last = 0;
    var self = this;
    this._tick = function (now) { self.tick(now); };
    SW.loops.push(this);
    SW.watch(el, function () { self.visible = true; self.kick(); }, function () { self.visible = false; }, opts.threshold === undefined ? 0.1 : opts.threshold);
  }
  Loop.prototype.kick = function () {
    if (!this.raf && this.visible && !SW.paused && !document.hidden) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this._tick);
    }
  };
  Loop.prototype.tick = function (now) {
    this.raf = 0;
    if (!this.visible || SW.paused || document.hidden) return;
    var dt = Math.min(64, now - this.last);
    this.last = now;
    this.t += dt;
    if (this.t >= this.d) { this.t -= this.d; this.cycle++; if (this.onCycle) this.onCycle(this.cycle); }
    this.frame(this.t, this.cycle, dt);
    this.raf = requestAnimationFrame(this._tick);
  };
  Loop.prototype.reset = function (t) { this.t = t || 0; };
  SW.Loop = Loop;
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) SW.loops.forEach(function (l) { l.kick(); });
  });

  /* one-shot reveal */
  var rvs = document.querySelectorAll('.rv');
  if (reduced || !('IntersectionObserver' in window)) {
    rvs.forEach(function (el) { el.classList.add('in'); });
  } else {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    rvs.forEach(function (el) { rio.observe(el); });
  }

  /* count-up numbers, replayed on each visit */
  SW.countUp = function (el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    if (isNaN(to)) return;
    var final = SW.fmt(to, dec);
    if (reduced) { el.textContent = final; return; }
    var start = performance.now(), dur = 1300;
    el.style.minWidth = el.offsetWidth ? el.offsetWidth + 'px' : '';
    function step(now) {
      var p = SW.clamp((now - start) / dur);
      el.textContent = SW.fmt(to * SW.ease(p), dec);
      if (p < 1) requestAnimationFrame(step); else { el.textContent = final; el.style.minWidth = ''; }
    }
    requestAnimationFrame(step);
  };
  document.querySelectorAll('[data-count]').forEach(function (el) {
    SW.replay(el, 'counted', function () { SW.countUp(el); });
  });

  /* evidence frames: data-ev="label" draws a red reticle around the element */
  SW.frame = function (host, label, inset) {
    var f = document.createElement('span');
    f.className = 'evf';
    f.setAttribute('aria-hidden', 'true');
    f.innerHTML = '<i></i><i></i><i></i><i></i>' + (label ? '<b>' + label + '</b>' : '');
    var pad = inset === undefined ? -8 : inset;
    f.style.inset = pad + 'px';
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(f);
    SW.replay(host, 'ev-seen', function () { f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); });
    host.addEventListener('mouseenter', function () { f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); });
    return f;
  };
  document.querySelectorAll('[data-ev]').forEach(function (el) { SW.frame(el, el.getAttribute('data-ev')); });

  /* nav: progress + active section */
  var bar = document.querySelector('.progress i');
  function onScroll() {
    var h = root.scrollHeight - window.innerHeight;
    if (bar) bar.style.setProperty('--p', h > 0 ? (window.scrollY / h).toFixed(4) : 0);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  if ('IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id ? '#' + e.target.id : '';
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section').forEach(function (s) { sio.observe(s); });
  }

  /* belt: duplicate tiles for a seamless loop */
  SW.dupe = function (track) {
    if (!track || track.getAttribute('data-duped')) return;
    var kids = Array.prototype.slice.call(track.children);
    kids.forEach(function (k) {
      var c = k.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('img').forEach(function (im) { im.alt = ''; });
      track.appendChild(c);
    });
    track.setAttribute('data-duped', '1');
    // The CSS loop may have started before the clones existed; restart it so
    // translateX(-50%) is measured against the doubled track.
    track.style.animation = 'none';
    void track.offsetWidth;
    track.style.animation = '';
  };
  if (!reduced) document.querySelectorAll('.belt-track').forEach(function (t) { SW.dupe(t); });

  /* copy buttons */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.getAttribute('data-copy'));
      var text = el ? el.innerText.replace(/\u00a0/g, ' ') : '';
      var label = btn.querySelector('span');
      function done() {
        btn.classList.add('ok');
        if (label) label.textContent = 'Copied';
        setTimeout(function () { btn.classList.remove('ok'); if (label) label.textContent = 'Copy'; }, 1600);
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        document.body.removeChild(ta); done();
      }
    });
  });

  /* tabs */
  document.querySelectorAll('.tabs').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    function select(t) {
      tabs.forEach(function (o) {
        var on = o === t;
        o.setAttribute('aria-selected', on ? 'true' : 'false');
        o.tabIndex = on ? 0 : -1;
        var p = document.getElementById(o.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.tabIndex = i === 0 ? 0 : -1;
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -9;
        if (j === -9) return;
        e.preventDefault();
        var n = tabs[(j + tabs.length) % tabs.length];
        select(n); n.focus();
      });
    });
  });

  /* lightbox */
  var dlg = document.getElementById('lightbox');
  if (dlg && typeof dlg.showModal === 'function') {
    var limg = document.getElementById('lightbox-img'), lcap = document.getElementById('lightbox-cap');
    document.querySelectorAll('[data-lightbox]').forEach(function (b) {
      b.addEventListener('click', function () {
        limg.src = b.getAttribute('data-lightbox');
        limg.alt = b.getAttribute('data-cap') || '';
        lcap.textContent = b.getAttribute('data-cap') || '';
        dlg.showModal();
      });
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  } else {
    document.querySelectorAll('[data-lightbox]').forEach(function (b) {
      b.addEventListener('click', function () { window.open(b.getAttribute('data-lightbox'), '_blank', 'noopener'); });
    });
  }

  /* motion toggle */
  var mbtn = document.getElementById('motion');
  SW.setPaused = function (p) {
    SW.paused = p;
    root.classList.toggle('paused', p);
    if (mbtn) {
      mbtn.setAttribute('aria-pressed', p ? 'true' : 'false');
      mbtn.querySelector('use').setAttribute('href', p ? '#i-play' : '#i-pause');
      mbtn.querySelector('span').textContent = p ? 'Play motion' : 'Pause motion';
      mbtn.setAttribute('aria-label', p ? 'Play motion' : 'Pause motion');
      mbtn.title = p ? 'Play motion' : 'Pause motion';
    }
    if (!p) SW.loops.forEach(function (l) { l.kick(); });
  };
  if (mbtn) {
    if (reduced) mbtn.hidden = true;
    mbtn.addEventListener('click', function () { SW.setPaused(!SW.paused); });
  }
})();
