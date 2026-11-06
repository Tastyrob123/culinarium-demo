/* Auftakt des Besucherbuchs · Culinarium Hannover (Kopie der Taverne zum Schäfli, dort des Schlössli, Gasterntal, Doldenhorn und Carlton-Europe) (Vorlage: studio/auftakt.js des Le Registre im Grand Beau-Rivage, Robert 16.10.2026: «wenn ich sie öffne, laden die sehr unschön rein,
   der Bildschirm halb weiss, die meisten Sachen nicht zu sehen»). Die Seite bleibt beim Öffnen ruhig, bis Daten, Schriften und die Fotos im ersten Bild da sind
   (höchstens 2,5 s), dann erscheint alles auf einmal, und die Auftritte (Bühne, Blätter) laufen erst ab diesem Moment. Steht als erstes Skript im <head>. */
(function () {
  var H = document.documentElement; if (H.classList.contains('auftakt') || H.classList.contains('auftakt-da')) return;
  H.classList.add('auftakt');
  var st = document.createElement('style');
  st.textContent = 'html.auftakt body>*{visibility:hidden}html.auftakt *,html.auftakt *::before,html.auftakt *::after{animation-play-state:paused!important}';
  (document.head || H).appendChild(st);
  var t0 = Date.now(), offen = 0, fertig = false, ruhig = 0, MAX = 2500;
  var f = window.fetch;
  if (f) window.fetch = function () {
    var p = f.apply(this, arguments);
    if (!fertig) { offen++; var z = function () { offen--; ruhig = Date.now(); }; p.then(z, z); }
    return p;
  };
  function bilderDa() {
    var ims = document.images, h = innerHeight;
    for (var i = 0; i < ims.length; i++) {
      var im = ims[i], r = im.getBoundingClientRect();
      if (r.bottom < 0 || r.top > h || (r.width < 40 && im.complete)) continue;
      if (!im.getAttribute('src') && !im.currentSrc) continue;
      if (!im.complete) return false;
    }
    if (document.querySelector('header:empty')) return false;   // Kopfleiste, die das Werkzeug erst füllt
    return true;
  }
  var schrift = false;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { schrift = true; }); else schrift = true;
  function los() { if (fertig) return; fertig = true; H.classList.remove('auftakt'); H.classList.add('auftakt-da'); }
  function pruefe() {
    if (fertig) return;
    var t = Date.now() - t0;
    if (t > MAX) return los();
    if (document.readyState !== 'loading' && schrift && offen === 0 && Date.now() - ruhig > 180 && t > 250 && bilderDa()) return los();
    setTimeout(pruefe, 60);
  }
  ruhig = Date.now(); pruefe();
})();
