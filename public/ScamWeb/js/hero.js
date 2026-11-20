/* Hero: ScamDet "inspects" the Figure 2 example page.
   Timeline (ms, 15 s loop): inputs light up -> scan -> four boxes with their
   rationales -> structured verdict -> hold the complete figure -> fade. */
(function () {
  'use strict';
  var SW = window.SW;
  var fig = document.getElementById('inspect');
  if (!SW || !fig) return;

  function qa(s) { return Array.prototype.slice.call(fig.querySelectorAll(s)); }
  var byKey = function (k) { return qa('[data-k="' + k + '"]'); };
  var boxes = qa('.bx'), rats = qa('.rats li'), verd = qa('.verdict > div');
  var scan = fig.querySelector('.scan');

  if (SW.reduced) {
    boxes.concat(rats, verd).forEach(function (el) { el.classList.add('on'); });
    fig.classList.add('static');
    return;
  }

  var D = 15000, HOLD_END = 13700;
  var events = [];
  function at(t0, t1, els) { events.push({ t0: t0, t1: t1, els: [].concat(els) }); }
  at(250, 2000, byKey('U'));
  at(750, 2500, byKey('T'));
  at(1250, 3000, byKey('I'));
  at(1750, 3800, byKey('S'));
  [3000, 4300, 5600, 6900].forEach(function (t, i) { at(t, HOLD_END, [boxes[i], rats[i]]); });
  at(8300, HOLD_END, verd[0]);
  at(8800, HOLD_END, verd[1]);
  at(9300, HOLD_END, verd[2]);

  function frame(t) {
    for (var i = 0; i < events.length; i++) {
      var e = events[i], active = t >= e.t0 && t < e.t1;
      for (var j = 0; j < e.els.length; j++) {
        var el = e.els[j];
        if (el && el.classList.contains('on') !== active) el.classList.toggle('on', active);
      }
    }
    var s = (t - 1250) / 1700;
    if (s >= 0 && s <= 1) {
      scan.style.opacity = s < 0.08 ? s / 0.08 : s > 0.9 ? (1 - s) / 0.1 : 1;
      scan.setAttribute('transform', 'translate(0 ' + (SW.easeIO(s) * 590).toFixed(1) + ')');
    } else if (scan.style.opacity !== '0') {
      scan.style.opacity = '0';
    }
  }
  frame(0);
  new SW.Loop(fig, D, frame, { threshold: 0.05 });
})();
