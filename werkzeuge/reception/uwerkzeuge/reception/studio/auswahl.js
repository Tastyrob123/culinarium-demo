/* Auswahl und Kalender im Stil des Hauses (feste Regel, Robert 11./12.10.2026: «Auswahlmöglichkeiten auch immer im Stil des Hauses»).
   Jede <select class="sel"> und jedes <input type="date"> im Reservationsbuch bekommt eine eigene Auswahl; das echte Feld bleibt als Wertträger
   (Code liest weiter .value, «change» wird ausgelöst). Neu gezeichnete Ansichten und Fenster werden von selbst erfasst. Bewegung nur opacity/transform. */
(function () {
  'use strict';
  var D = document, MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var offen = null;
  function zu() { if (offen) { offen.l.remove(); offen.k.setAttribute('aria-expanded', 'false'); offen = null; } }
  function liste(k, inhalt) {
    zu(); var l = D.createElement('div'); l.className = 'ws-wahl__l'; l.setAttribute('role', 'listbox'); l.innerHTML = inhalt;
    var r = k.getBoundingClientRect(); l.style.minWidth = Math.max(r.width, 240) + 'px';
    D.body.appendChild(l); k.setAttribute('aria-expanded', 'true'); offen = { l: l, k: k }; lege(); return l;
  }
  function lege() {   // an den Knopf legen; beim Scrollen mitgehen statt schliessen (am Handy scrollt schon das Antippen die Seite)
    if (!offen) return; var l = offen.l, r = offen.k.getBoundingClientRect(), h = l.offsetHeight, unten = innerHeight - r.bottom;
    if (r.bottom < 0 || r.top > innerHeight) return zu();
    l.style.left = Math.max(8, Math.min(r.left, innerWidth - l.offsetWidth - 8)) + 'px';
    l.style.top = Math.max(8, unten < h + 12 && r.top > h + 12 ? r.top - h - 6 : Math.min(r.bottom + 6, innerHeight - h - 8)) + 'px';
  }
  function textVon(s) { var o = s.options[s.selectedIndex]; return o ? o.textContent : ''; }
  function fertig(feld) { feld.dispatchEvent(new Event('input', { bubbles: true })); feld.dispatchEvent(new Event('change', { bubbles: true })); }
  function sel(s) {
    var k = D.createElement('button'); k.type = 'button'; k.className = 'ws-wahl'; k.setAttribute('aria-haspopup', 'listbox'); k.setAttribute('aria-expanded', 'false');
    if (s.getAttribute('aria-label')) k.setAttribute('aria-label', s.getAttribute('aria-label'));
    var t = function () { k.innerHTML = '<span>' + textVon(s).replace(/</g, '&lt;') + '</span><i aria-hidden="true"></i>'; };
    t(); s.addEventListener('change', t); s.classList.add('ws-wahl__echt'); s.tabIndex = -1; s.setAttribute('aria-hidden', 'true'); s.after(k);
    k.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); if (offen && offen.k === k) return zu();
      var l = liste(k, [].map.call(s.options, function (o, i) { return '<button type="button" role="option" data-i="' + i + '" aria-selected="' + (i === s.selectedIndex) + '">' + o.textContent.replace(/</g, '&lt;') + '</button>'; }).join(''));
      l.addEventListener('click', function (ev) { var b = ev.target.closest('[data-i]'); if (!b) return; s.selectedIndex = +b.dataset.i; t(); fertig(s); zu(); k.focus(); }); });
  }
  function datum(f) {
    var k = D.createElement('button'); k.type = 'button'; k.className = 'ws-wahl ws-wahl--tag'; k.setAttribute('aria-haspopup', 'dialog');
    var lang = function (v) { if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Kein Datum'; var d = new Date(v + 'T12:00'); return d.getDate() + '. ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
    var t = function () { k.innerHTML = '<span>' + lang(f.value) + '</span><i aria-hidden="true"></i>'; };
    t(); f.addEventListener('change', t); f.classList.add('ws-wahl__echt'); f.tabIndex = -1; f.setAttribute('aria-hidden', 'true'); f.after(k);
    var mon = null;
    var zeichne = function (l) {
      var m = mon, erst = (new Date(m.getFullYear(), m.getMonth(), 1).getDay() + 6) % 7, n = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(), h = '';
      for (var i = 0; i < erst; i++) h += '<span></span>';
      for (var d = 1; d <= n; d++) { var iso = m.getFullYear() + '-' + ('0' + (m.getMonth() + 1)).slice(-2) + '-' + ('0' + d).slice(-2); h += '<button type="button" data-v="' + iso + '" aria-selected="' + (iso === f.value) + '">' + d + '</button>'; }
      l.innerHTML = '<div class="ws-kal"><div class="ws-kal__k"><button type="button" data-m="-1" aria-label="Monat zurück">‹</button><b>' + MON[m.getMonth()] + ' ' + m.getFullYear() + '</b><button type="button" data-m="1" aria-label="Monat weiter">›</button></div>'
        + '<div class="ws-kal__g">' + ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(function (x) { return '<i>' + x + '</i>'; }).join('') + h + '</div><button type="button" class="ws-kal__leer" data-v="">Ohne Datum</button></div>';
    };
    k.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); if (offen && offen.k === k) return zu();
      var b = /^\d{4}-\d{2}-\d{2}$/.test(f.value) ? new Date(f.value + 'T12:00') : new Date(); mon = new Date(b.getFullYear(), b.getMonth(), 1);
      var l = liste(k, ''); zeichne(l);
      l.addEventListener('click', function (ev) { ev.stopPropagation(); var m = ev.target.closest('[data-m]'); if (m) { mon = new Date(mon.getFullYear(), mon.getMonth() + (+m.dataset.m), 1); zeichne(l); return; }
        var v = ev.target.closest('[data-v]'); if (v) { f.value = v.dataset.v; t(); fertig(f); zu(); k.focus(); } }); });
  }
  function erfasse(w) { (w || D).querySelectorAll('select.sel:not(.ws-wahl__echt)').forEach(sel); (w || D).querySelectorAll('input[type=date]:not(.ws-wahl__echt)').forEach(datum); }
  D.addEventListener('click', function (e) { if (offen && !offen.l.contains(e.target)) zu(); });
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && offen) { e.stopPropagation(); var k = offen.k; zu(); k.focus(); } }, true);
  addEventListener('scroll', function (e) { if (offen && !offen.l.contains(e.target)) lege(); }, { passive: true, capture: true });
  addEventListener('resize', lege);
  new MutationObserver(function () { erfasse(); }).observe(D.documentElement, { childList: true, subtree: true });
  erfasse();
})();
