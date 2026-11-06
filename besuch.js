/* Besuche (Robert 14.10.2026): meldet je Seitenaufruf «pfad geraet [code]» an tasty-besuche, der Zeit, Land und Ort dazuschreibt.
   Kein Cookie. Nur online (vercel.app, tasty-studios.de, seit 19.10.2026 auch tastystudios.ch), nicht eingebettet, nicht in automatischen Browsern.
   Eigene Geräte: einmal ?ich an die Adresse. */
(function () {
  try {
    var n = navigator, w = window, d = document, q = location.search;
    if (/[?&]ich=aus\b/.test(q)) localStorage.removeItem('tasty-ich');
    else if (/[?&]ich\b/.test(q)) localStorage.setItem('tasty-ich', '1');
    if (w.__besuch || !n.sendBeacon || n.webdriver || w.self !== w.top || !/(\.vercel\.app|(^|\.)tasty-studios\.de|(^|\.)tastystudios\.ch)$/.test(location.hostname)) return;
    if (localStorage.getItem('tasty-ich')) return;
    w.__besuch = 1;
    /* Empfänger (Robert 17.10.2026): ?f=<code> aus dem verschickten Link (besuche.py link), je Gerät gemerkt, damit spätere Aufrufe den Namen tragen */
    var m = /[?&]f=([a-z0-9]{4,10})\b/.exec(q), f = m ? m[1] : (localStorage.getItem('tasty-f') || '');
    if (m) localStorage.setItem('tasty-f', f);
    /* Über Subdomains hinweg (19.10.2026): localStorage gilt je Adresse. Führt ein Link auf eine andere *.tastystudios.ch-Adresse,
       bekommt er beim Anklicken ?f=<code> angehängt, damit das Haus, die Werkbank oder die Analyse den Namen weiter kennt. */
    if (f) {
      var mit = function (ev) {
        var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
        if (!a || a.hostname === location.hostname || !/(^|\.)tastystudios\.ch$/.test(a.hostname) || /[?&]f=/.test(a.search)) return;
        a.search = (a.search ? a.search + '&' : '?') + 'f=' + f;
      };
      d.addEventListener('click', mit, true); d.addEventListener('auxclick', mit, true); d.addEventListener('contextmenu', mit, true);
    }
    var breit = function (px) { return !!(w.matchMedia && w.matchMedia('(max-width:' + px + 'px)').matches); };
    n.sendBeacon('https://tasty-besuche.vercel.app/api/b', location.pathname.slice(0, 120) + ' ' + (breit(700) ? 'handy' : breit(1060) ? 'tablet' : 'rechner') + (f ? ' ' + f : ''));
  } catch (e) {}
})();
