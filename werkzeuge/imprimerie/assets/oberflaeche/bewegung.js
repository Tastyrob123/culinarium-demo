/* bewegung.js · die ruhige, edle Bewegung für alle Werkzeuge des Culinarium (29.10.2026, Robert: «dieses mit dem Reinzoomen, mit dem hochgeflogen
   Kommen der Schriften … wenn man scrollt, dass das halt sich toll anfühlt»). Haltung wie das Schweben der anderen Häuser (studio/schweben.js),
   im Ton des Culinarium: Abend, Kerzenlicht, ruhig — längere, weich auslaufende Kurven, kaum Feder.
   Lädt das Kleid (kleid/culinarium.js) nach, async und mit wenig Vorrang: nichts davon steht vor dem ersten Knopf.
   - Startbild und Knöpfe: in grund.css (laufen ab dem ersten Bild, ohne auf dieses Skript zu warten).
   - Hier: Zwischentitel, Karten, Blätter, Kacheln schweben gestaffelt aus der Tiefe herauf, sobald sie am unteren Rand auftauchen; Fotos darin zoomen
     ein. Grosse Zahlen zoomen herein.
   30.10.2026 (Kriterium 37 vollständig): Zwischentitel steigen Zeile für Zeile (Wörter über WO_ZEILEN aus dem Kleid), grosse Zahlen laufen
   beim Auftauchen von null auf ihren Wert hoch (die Breite steht vorher fest, nichts daneben rückt). Was eine eigene Bewegung des Werkzeugs
   hat (data-fd der Plakatwerkstatt, data-r, data-sw), bleibt unberührt.
   Kriterium 34: nur translate, scale (eigene Eigenschaften, stört kein transform der Werkzeuge), nie unsichtbar: was man schon sieht, springt nie
   zurück; was unter dem Rand liegt, wartet dort deckend und nur verschoben. Was eine eigene Bewegung hat (data-sw, data-r, laufende Animation),
   bleibt unberührt. prefers-reduced-motion: nichts bewegt sich. Kein Messen von Layout, nur IntersectionObserver. */
(function () {
  'use strict';
  if (window.__woBewegung) return; window.__woBewegung = true;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  /* Kurven und Dauern: Abend statt Feder (die anderen Häuser: 2,7 s mit Feder 1,42; hier 1,25 s, weich auslaufend, ohne Überschwingen) */
  var CSS = ''
    + '@keyframes wo-bw-hoch{from{translate:0 var(--wo-bw-weg,38px);scale:var(--wo-bw-kl,.975)}}'
    + '@keyframes wo-bw-zoom{from{scale:1.07}}'
    + '@keyframes wo-bw-zahl{from{scale:1.14;translate:0 .18em}}'
    + '[data-wo-bw="t"]{--wo-bw-weg:.55em;--wo-bw-kl:1}'
    + '[data-wo-bw]:not(.wo-bw-da){translate:0 var(--wo-bw-weg,38px);scale:var(--wo-bw-kl,.975)}'
    + '[data-wo-bw="z"]{transform-origin:0 80%}'
    + '[data-wo-bw="z"]:not(.wo-bw-da){scale:1.14;translate:0 .18em}'
    + '[data-wo-bw].wo-bw-da{animation:wo-bw-hoch 1.25s cubic-bezier(.19,1,.22,1) backwards;animation-delay:calc(var(--wo-bw-i,0) * 85ms)}'
    + '[data-wo-bw="z"].wo-bw-da{animation-name:wo-bw-zahl}'
    + '[data-wo-bw="k"].wo-bw-da img{animation:wo-bw-zoom 2.2s cubic-bezier(.19,1,.22,1) backwards;animation-delay:calc(var(--wo-bw-i,0) * 85ms)}'
    /* Titel zeilenweise: der Titel selbst steht, seine Wörter warten (Zeile für Zeile) und steigen gestaffelt */
    + '[data-wo-bw="t"].wo-zl{translate:none;scale:none}'
    + '[data-wo-bw="t"].wo-zl.wo-bw-da{animation:none}'
    + '[data-wo-bw="t"].wo-zl .wo-w{display:inline-block}'
    + '[data-wo-bw="t"].wo-zl:not(.wo-bw-da) .wo-w{translate:0 .6em}'
    + '[data-wo-bw="t"].wo-zl.wo-bw-da .wo-w{animation:wo-bw-hoch 1.25s cubic-bezier(.19,1,.22,1) backwards;--wo-bw-weg:.6em;--wo-bw-kl:1;animation-delay:calc(var(--wo-bw-i,0) * 85ms + var(--z,0) * 95ms)}'
    /* Zahlen laufen hoch: ein unsichtbarer Zwilling mit dem Endwert hält die Breite */
    + '.wo-zl-z{display:inline-grid;justify-items:end}.wo-zl-z>*{grid-area:1/1}.wo-zl-z>[aria-hidden]{visibility:hidden}'
    + '@media (prefers-reduced-motion:reduce){[data-wo-bw],[data-wo-bw] img,[data-wo-bw] .wo-w{animation:none!important;translate:none!important;scale:none!important}}';

  /* Was schwebt: Karten und Blätter der Werkzeuge (k, gestaffelt), Zwischentitel (t, zeilenweise), grosse Zahlen (z). Nur Klassen, die es in den
     Werkzeugen gibt; .mk und .pk-karte sind die Arbeiten und Vorschläge der Plakatwerkstatt. Karten zuerst: ein Titel in einer Karte steigt mit ihr.
     .kap__b und .thema: Bilder und Themen der Anleitungen (Kapitelbild zoomt ein).
     Nie .blatt (30.10.2026): in Plakatwerkstatt und Pairing-Karte ist das das gesetzte Druckblatt, das vermessen wird; schwebt es, landet die Schrift im PDF daneben. */
  var SEL = [
    ['k', '.wo-ag, .wo-bk, .wo-lage, .wo-re, .wo-bl, .besuch, .re-a, .mw-t, .wo__k, .mk, .pk-karte, .kap__b, .thema'],
    ['t', '.wo-zw, main h2, #ansicht h2, .wo-app h2, .ms-zeile > h2'],
    ['z', '.zahlen .blatt > b, .band > div > b']
  ];
  var NIE = '.hs, .wo-kopf, .wo-leiste, .wo-sb, nav, header, dialog, [role="dialog"], [aria-modal], [data-fd], [data-wo-bw-nie]';

  function eigeneBewegung(el) {
    if (el.closest('[data-sw],[data-swz],[data-r],[data-fd],.wo-sb,.rdg-karte,.rdg-schild')) return true;
    if (el.querySelector('[data-fd],[data-wo-bw-art]')) return true;   /* hat schon bewegte Stücke in sich */
    if (el.parentElement && el.parentElement.closest('[data-wo-bw-art]')) return true;   /* nie doppelt: das Blatt schwebt, sein Inhalt mit */
    var s = getComputedStyle(el);
    return s.animationName && s.animationName !== 'none';
  }

  function spaeterEigen(el) { return !!(el.parentElement && el.parentElement.closest('[data-fd],[data-r],[data-sw],[data-swz]')); }

  /* Was man schon sieht, schwebt nur ganz am Anfang (bis 1 s) oder gleich nach einem Klick (Ansichtswechsel), sonst steht es ruhig da. */
  var FRUEH = 1000, offen = 0, io = null, plan = 0;
  function arm() { offen = performance.now() + 1400; }
  ['click', 'hashchange', 'popstate'].forEach(function (e) { addEventListener(e, arm, true); });
  addEventListener('keydown', function (e) { if (e.key === 'Enter') arm(); }, true);

  function beobachter() {
    return new IntersectionObserver(function (es) {
      var k = 0, jetzt = performance.now(), frisch0 = jetzt <= FRUEH || jetzt <= offen;
      es.forEach(function (e) {
        var el = e.target, art = el.getAttribute('data-wo-bw-art');
        var frisch = frisch0 || (el._woNeu <= 4000 && jetzt - el._woNeu < 700);   /* in den ersten Sekunden frisch erschienen (Startseite eines Werkzeugs, Daten kommen an) */
        if (spaeterEigen(el)) {   /* das Werkzeug hat es inzwischen selbst in Bewegung (z. B. feder.js der Plakatwerkstatt): ihm überlassen */
          frei(el); return;
        }
        if (e.isIntersecting) {
          io.unobserve(el);
          if (!frisch && !el.hasAttribute('data-wo-bw')) return;   /* schon zu sehen, nicht frisch: bleibt, wo es ist */
          el.style.setProperty('--wo-bw-i', Math.min(k++, 5));
          el.setAttribute('data-wo-bw', art); el.classList.add('wo-bw-da');
        } else if (!el.hasAttribute('data-wo-bw')) el.setAttribute('data-wo-bw', art);   /* unter dem Rand: wartet dort, deckend, nur verschoben */
      });
    }, { rootMargin: '0px 0px 8% 0px' });
  }

  function frei(el) { if (io) io.unobserve(el); el.removeAttribute('data-wo-bw'); el.removeAttribute('data-wo-bw-art'); el.classList.remove('wo-bw-da'); el.setAttribute('data-wo-bw-nie', ''); }
  function markiere() {
    plan = 0;
    document.querySelectorAll('[data-wo-bw-art]:not(.wo-bw-da)').forEach(function (el) { if (spaeterEigen(el)) frei(el); });
    SEL.forEach(function (p) {
      document.querySelectorAll(p[1]).forEach(function (el) {
        if (el.hasAttribute('data-wo-bw-art') || el.hasAttribute('data-wo-bw-nie')) return;
        if (p[0] === 't' && el.closest(NIE)) return;
        if (el.closest('#start:not(.bereit)')) return;   /* die Startseite der Plakatwerkstatt steht erst in einem Zug da */
        if (eigeneBewegung(el)) { el.setAttribute('data-wo-bw-nie', ''); return; }
        if (p[0] === 't') { if (!el.offsetHeight) return; if (window.WO_ZEILEN) WO_ZEILEN(el); }   /* verborgen: später, wenn die Ansicht offen ist */
        el.setAttribute('data-wo-bw-art', p[0]); el._woNeu = performance.now();
        (io || (io = beobachter())).observe(el);
      });
    });
    zahlen();
  }

  /* Zahlen laufen hoch: jede grosse, alleinstehende Zahl (ab 22 px, keine Jahreszahl, kein Datum, keine Uhrzeit) zählt beim Auftauchen von null auf
     ihren Wert, 1,4 s, weich auslaufend. Schreibt das Werkzeug in der Zeit einen neuen Wert, hört das Zählen sofort auf und sein Wert gilt. */
  var ZAHL = /^\s*(\d{1,3}(?:[.’'\u202f]\d{3})+|\d{1,7})(,\d{1,2})?(\s*%)?\s*$/, ZNIE = 'svg, input, textarea, [contenteditable], .wo-bl, .wo-kopf, .wo-leiste, [data-wo-zl-nie], [data-wo-bw-nie]';
  var zio = null, ZFRUEH = 4000, zi = 0;
  function zahlen() {
    document.querySelectorAll('b, strong, .wo-zahl, [class*="zahl"]').forEach(function (el) {
      if (el.children.length || el.hasAttribute('data-wo-zahl')) return;
      var m = ZAHL.exec(el.textContent); if (!m) return;
      if (!m[2] && /^(19|20)\d\d$/.test(m[1])) return;
      if (el.closest(ZNIE)) return;
      el.setAttribute('data-wo-zahl', '');
      if (parseFloat(getComputedStyle(el).fontSize) < 22) return;
      (zio || (zio = new IntersectionObserver(function (es) {
        var frisch = performance.now() <= ZFRUEH || performance.now() <= offen;
        es.forEach(function (e) {
          var el = e.target;
          if (!e.isIntersecting) { el.setAttribute('data-wo-zahl', 'wartet'); return; }   /* unter dem Rand: zählt, sobald es auftaucht */
          zio.unobserve(el);
          if (frisch || el.getAttribute('data-wo-zahl') === 'wartet') zaehle(el, zi++);
        });
        zi = 0;
      }, { threshold: 0.6 }))).observe(el);
    });
  }
  function zaehle(el, i) {
    var roh = el.textContent, m = ZAHL.exec(roh); if (!m) return;
    var trenn = (m[1].match(/[.’'\u202f]/) || [''])[0], dez = m[2] ? m[2].length - 1 : 0;
    var ziel = parseFloat(m[1].split(trenn || ' ').join('') + (m[2] ? '.' + m[2].slice(1) : '')); if (!(ziel > 0)) return;
    var vor = roh.slice(0, roh.indexOf(m[1])), nach = roh.slice(roh.indexOf(m[1]) + m[1].length + (m[2] || '').length);
    function form(v) {
      var t = v.toFixed(dez).split('.'), g = t[0];
      if (trenn) g = g.replace(/\B(?=(\d{3})+(?!\d))/g, trenn);
      return vor + g + (dez ? ',' + t[1] : '') + nach;
    }
    var hut = document.createElement('span'), zw = document.createElement('span'), z = document.createElement('span');
    hut.className = 'wo-zl-z'; zw.setAttribute('aria-hidden', 'true'); zw.textContent = roh; z.textContent = form(0);
    hut.appendChild(zw); hut.appendChild(z); el.textContent = ''; el.appendChild(hut);
    var t0 = performance.now() + i * 85, D = 1400;
    (function schritt(jetzt) {
      if (!z.isConnected) return;   /* das Werkzeug hat neu geschrieben: sein Wert gilt */
      var x = Math.min(1, Math.max(0, (jetzt - t0) / D));
      if (x < 1) { z.textContent = form(ziel * (1 - Math.pow(1 - x, 4))); requestAnimationFrame(schritt); }
      else el.textContent = roh;
    })(performance.now());
  }

  function plane() { if (!plan) plan = requestAnimationFrame(markiere); }

  function los() {
    var st = document.createElement('style'); st.id = 'wo-bewegung'; st.textContent = CSS; document.head.appendChild(st);
    markiere();
    new MutationObserver(plane).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-fd', 'data-r', 'data-sw'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los); else los();
})();
