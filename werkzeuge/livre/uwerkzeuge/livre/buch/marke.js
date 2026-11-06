/* Markenbuch Culinarium Hannover · Auftritte, Zahlen, Kachel-Neigung, Farbwerte kopieren. Ein Takt, nativer Scroll, nur Klassen setzen. */
(function () {
  'use strict';
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Zahlen zählen hoch (Grosse Zahlen, Lesbarkeit, Mengenverhältnis) ---------- */
  var zaehle = function (wurzel) {
    $$('[data-zahl]', wurzel).concat(wurzel.hasAttribute && wurzel.hasAttribute('data-zahl') ? [wurzel] : []).forEach(function (z) {
      if (z.__lief) return; z.__lief = true;
      var ziel = parseFloat(z.getAttribute('data-zahl')), komma = z.hasAttribute('data-komma'), dauer = 1600, t0 = 0;
      var schreib = function (v) { z.textContent = komma ? v.toFixed(1).replace('.', ',') : String(Math.round(v)); };
      if (ruhig) return schreib(ziel);
      var schritt = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dauer), w = 1 - Math.pow(1 - p, 3);
        schreib(ziel * w);
        if (p < 1) requestAnimationFrame(schritt);
      };
      setTimeout(function () { requestAnimationFrame(schritt); }, 350);
    });
  };
  var zeige = function (el) { el.classList.add('da'); zaehle(el); };

  var alle = $$('[data-r]'), gruppen = $$('[data-g]');
  if (ruhig || !('IntersectionObserver' in window)) {
    alle.forEach(zeige); gruppen.forEach(zeige);
  } else {
    /* Titel: alles sofort, die Staffel kommt aus dem CSS (seit 12.10.2026 ohne Vorhang) */
    $$('.titel [data-r], .titel [data-g]').forEach(function (el) { requestAnimationFrame(function () { zeige(el); }); });
    /* Fotos anderthalb Bildschirme vorher holen und entpacken, damit beim Auftritt nichts wartet */
    var vor = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; vor.unobserve(e.target);
        var im = e.target; im.loading = 'eager'; if (im.decode) im.decode().catch(function () {});
      });
    }, { rootMargin: '0px 0px 150% 0px' });
    $$('main img').forEach(function (im) { vor.observe(im); });
    /* Gruppen starten gemeinsam, die Staffel kommt aus --i */
    var gio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; gio.unobserve(e.target);
        zeige(e.target);
        $$('[data-r]', e.target).forEach(zeige);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    gruppen.forEach(function (g) { if (!g.closest('.titel')) gio.observe(g); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); zeige(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    alle.forEach(function (el) { if (!el.closest('.titel') && !el.closest('[data-g]')) io.observe(el); });
    /* Fenster: der Satz steigt auf, sobald das Fenster ein Drittel des Bildschirms freigibt; ausserhalb des Fensters wird er nicht gemalt */
    $$('.fenster').forEach(function (f) {
      var t = f.querySelector('.fenster__t');
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) t.classList.add('da'); }, { rootMargin: '0px 0px -34% 0px' }).observe(f);
      new IntersectionObserver(function (es) { f.classList.toggle('verdeckt', !es[0].isIntersecting); }).observe(f);
    });
    /* Atmen des Zeichens und der Pfeil nach unten laufen nur, solange der Titel zu sehen ist */
    var titel = document.querySelector('.titel');
    if (titel) new IntersectionObserver(function (es) { titel.classList.toggle('laeuft', es[0].isIntersecting); }).observe(titel);
  }

  /* ---------- Leiste: Kapitel, in dem man gerade liest ---------- */
  var links = $$('.leiste__k a'), ziele = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = ziele.indexOf(e.target);
        links.forEach(function (a, j) { a.classList.toggle('an', j === i); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ziele.forEach(function (s) { if (s) nio.observe(s); });
  }

  /* ---------- Farbwert kopieren ---------- */
  $$('[data-hex]').forEach(function (b) {
    b.addEventListener('click', function () {
      var h = b.getAttribute('data-hex'); if (h.indexOf('(') < 0) h = h.toUpperCase();   /* Glanzgold: der Verlauf wird so kopiert, wie er im CSS steht */
      if (navigator.clipboard) navigator.clipboard.writeText(h).catch(function () {});
      b.classList.add('ok'); clearTimeout(b.__uhr); b.__uhr = setTimeout(function () { b.classList.remove('ok'); }, 1400);
    });
  });

  /* ---------- Während gescrollt wird, reagieren die Kacheln nicht auf die Maus ---------- */
  var rollUhr = 0, rollt = false, wurzel = document.documentElement;
  window.addEventListener('scroll', function () {
    if (!rollt) { rollt = true; wurzel.classList.add('rollt'); }
    clearTimeout(rollUhr); rollUhr = setTimeout(function () { rollt = false; wurzel.classList.remove('rollt'); }, 180);
  }, { passive: true });

  /* ---------- Kachel neigt sich zur Maus, Licht wandert mit (wie die Zimmer der Startseite). Nur Rechner mit Maus. ---------- */
  if (ruhig || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var MAX = 2.2;
  $$('.k3').forEach(function (k) {
    var b = k.querySelector('.k3__b'), rahmen = null, uhr = 0, mx = 0, my = 0;
    if (!b) return;
    var setze = function () {
      uhr = 0; if (!rahmen) return;
      var x = Math.max(-.5, Math.min(.5, (mx - rahmen.left) / rahmen.width - .5)), y = Math.max(-.5, Math.min(.5, (my - rahmen.top) / rahmen.height - .5));
      k.style.setProperty('--ry', (x * MAX * 2).toFixed(2) + 'deg');
      k.style.setProperty('--rx', (-y * MAX * 2).toFixed(2) + 'deg');
      k.style.setProperty('--gx', (x * 60).toFixed(1) + '%');
      k.style.setProperty('--gy', (y * 60).toFixed(1) + '%');
    };
    b.addEventListener('pointerenter', function () { rahmen = b.getBoundingClientRect(); k.classList.add('kipp'); });
    b.addEventListener('pointermove', function (e) { if (!rahmen) rahmen = b.getBoundingClientRect(); mx = e.clientX; my = e.clientY; if (!uhr) uhr = requestAnimationFrame(setze); });
    b.addEventListener('pointerleave', function () {
      if (uhr) { cancelAnimationFrame(uhr); uhr = 0; }
      rahmen = null; k.classList.remove('kipp');
      ['--rx', '--ry', '--gx', '--gy'].forEach(function (v) { k.style.removeProperty(v); });
    });
    window.addEventListener('scroll', function () { rahmen = null; }, { passive: true });
  });
})();

/* Farbwelt A/B und Abendfarbe im Markenbuch umschalten: nur Attribute am body, die Farben kommen aus dem CSS */
(function(){var q=new URLSearchParams(location.search),b=document.body,w=q.get('welt'),a=q.get('abend');
if(w==='b')b.setAttribute('data-welt','b');if(a)b.setAttribute('data-abend',a);
function zeig(){var wb=b.getAttribute('data-welt')==='b',ab=b.getAttribute('data-abend');
 document.querySelectorAll('[data-welt-knopf]').forEach(function(k){k.classList.toggle('kn--linie',(k.getAttribute('data-welt-knopf')==='b')!==wb)});
 document.querySelectorAll('[data-abend-knopf]').forEach(function(k){k.setAttribute('aria-pressed',String(!wb&&k.getAttribute('data-abend-knopf')===ab))})}
document.querySelectorAll('[data-welt-knopf]').forEach(function(k){k.addEventListener('click',function(ev){ev.preventDefault();if(k.getAttribute('data-welt-knopf')==='b')b.setAttribute('data-welt','b');else b.removeAttribute('data-welt');zeig()})});
document.querySelectorAll('[data-abend-knopf]').forEach(function(k){k.addEventListener('click',function(){b.removeAttribute('data-welt');b.setAttribute('data-abend',k.getAttribute('data-abend-knopf'));zeig()})});
zeig()})();
