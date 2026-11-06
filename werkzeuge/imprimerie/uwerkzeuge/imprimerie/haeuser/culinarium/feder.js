/* Hereinschweben nach der Uhr für L’Imprimerie (Kern Grand Beau-Rivage, hier Culinarium Hannover) (16.10.2026), gehört zu feder.css. Ersetzt schweben.js (Scroll-Zeitachse).
   Markiert Bühnen, Kacheln, Monatszeilen und Blätter mit data-fd; sobald eines am unteren Rand auftaucht (IntersectionObserver), bekommt es .da.
   Alles, was im selben Augenblick auftaucht, ist eine Gruppe: Staffel 100 ms in Lesereihenfolge. Nach dem Auftritt .gespielt (bleibt ruhig). */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  var SEL = '#start .ms-bue, #startWochen>.wo, #startAbteilungen>.wo, #abListe>.wo, .ev-monat__kopf, .ev-raster>.wo, #msNewsletter .ms-wochen>.wo,'
    + ' #startZuletzt>.stueck, #bibliothek>.stueck, .fg-abt__kopf, .fg-abt .stueck, #arten>.stueck, .mit-foto';
  var io = new IntersectionObserver(function (es) {
    var neu = es.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) { return (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left); });
    neu.forEach(function (e, n) {
      var el = e.target; io.unobserve(el);
      el.style.setProperty('--i', Math.min(n, 6));
      el.classList.add('da');
      el.addEventListener('animationend', function f(ev) { if (ev.target === el && ev.animationName === 'ce-feder') { el.classList.add('gespielt'); el.removeEventListener('animationend', f); } });
    });
  }, { rootMargin: '0px 0px 8% 0px' });
  function markiere() {
    var s = document.getElementById('start'); if (s && !s.classList.contains('bereit')) return;   // erst wenn die Startseite in einem Zug dasteht (start.js)
    document.querySelectorAll(SEL).forEach(function (el) { if (el.hasAttribute('data-fd')) return; el.setAttribute('data-fd', ''); io.observe(el); });
  }
  var plan = 0;
  function los() { var w = document.getElementById('start') || document.body; new MutationObserver(function () { if (!plan) plan = requestAnimationFrame(function () { plan = 0; markiere(); }); }).observe(w, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); markiere(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los); else los();
})();
