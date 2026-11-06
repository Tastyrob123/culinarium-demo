/* Auftritte für alles, was stillstand, und der Takt des Gasterntal für die Auftritte des Kits (gebaut von _werkbank/gt_auftritte.py, nicht von Hand ändern) */
(function () {
  'use strict';
  var doc = document.documentElement;
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}   /* jede Seite öffnet oben (Robert 18.10.2026 18:30) */
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]nomotion/.test(location.search)) return;
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var fuenftel = function (e) { return e.isIntersecting && (e.intersectionRatio >= 0.2 || e.intersectionRect.height >= window.innerHeight * 0.2); };
  var OPT = { rootMargin: '100000px 0px 0px 0px', threshold: [0, 0.05, 0.1, 0.15, 0.2] };
  doc.classList.add('wb-takt');

  var KIT = '[data-a],.odo,.zt,.roll';

  /* 1. Was ohne Auftritt dastand */
  var NICHT_OHNE_KIT = '[data-drift],[data-zug],[data-lauf],nav,dialog,[hidden],.wb-nach,.odo,.zt,.roll,video,canvas,iframe,form,.fen__k,.kino,.feed,.geraet,.laptop,[aria-hidden="true"]';
  var fest = function (el) { for (var i = 0, k = el; k && k !== document.body && i < 8; i++, k = k.parentElement) { var p = getComputedStyle(k).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
  var nach = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!fuenftel(e)) return; nach.unobserve(e.target); e.target.classList.add('wb-da'); }); }, OPT);
  var jetzt = [];
  /* mit data-alles (Anleitungen, Prüfseiten der Werkzeuge): jede Überschrift, jeder Satz, jedes Bild der Seite */
  var alles = document.currentScript && document.currentScript.hasAttribute('data-alles');
  var WAS = alles ? 'h1,h2,h3,h4,p,li,figure,img,blockquote,table,dl,pre,.kn,details' : 'body > article,main h2,main h3,main h4,main p,main li,main figure,main blockquote,main table,main dl,main .kn,section h2,section h3,section p,section li,section figure,footer p,footer li';
  $$(WAS).forEach(function (el) {
    if (el.closest('.wb-nach')) return;
    if (el.closest(NICHT_OHNE_KIT) || !el.getClientRects().length || fest(el)) return;
    /* in einem bewegten Stück des Kits: nur wenn das Stück höher als das Fenster ist (Brief, Rechnung), sonst kommt der Teil mit ihm */
    var k = el.closest(KIT); if (k && (k === el || k.getBoundingClientRect().height < window.innerHeight * 1.1)) return;
    if (el.querySelector(KIT)) return;   /* trägt selbst bewegte Teile: die kommen schon */
    var r = el.getBoundingClientRect(); if (r.bottom < 0) return;
    var i = [].indexOf.call(el.parentElement.children, el);
    el.classList.add('wb-nach'); if (el.tagName === 'FIGURE' || el.querySelector('img')) el.classList.add('wb-bild');
    el.style.setProperty('--wi', Math.min(i, 4));
    if (r.top < window.innerHeight * 0.8) { jetzt.push(el); return; }   /* beim Laden schon im Bild: kommt gleich beim Öffnen */
    nach.observe(el);
  });
  requestAnimationFrame(function () { requestAnimationFrame(function () { jetzt.forEach(function (el) { el.classList.add('wb-da'); }); }); });
  /* am Seitenende: was im Bild ist, aber nie zu einem Fünftel hineinkommt, kommt trotzdem */
  var ende = function () { if (window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 4) return;
    $$('.wb-nach:not(.wb-da)').forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) { nach.unobserve(el); el.classList.add('wb-da'); } }); };
  window.addEventListener('scroll', ende, { passive: true });
})();
