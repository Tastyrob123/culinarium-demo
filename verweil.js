/* Verweildauer (Robert 16.10.2026: «ganz genau aufzeichnen, wo sie sich angeschaut wurde und wie lange», «nur ich»).
   Misst je Seitenaufruf, wie lange welcher Abschnitt im Bild war, wie weit gescrollt wurde und worauf geklickt wurde, und schickt
   beim Verlassen EINEN Schnappschuss an tasty-besuche (privater Speicher, Abruf nur mit Roberts Schlüssel). Kein Cookie, keine Kennung,
   keine Eingaben, keine Texte der Besucher. Läuft nur online (vercel.app, tasty-studios.de, tastystudios.ch), nicht eingebettet, nicht in automatischen Browsern.
   Eigene Geräte: einmal ?ich an die Adresse (wie bei besuch.js). Zeit zählt nur, solange der Tab sichtbar ist und in den letzten
   30 Sekunden etwas bewegt wurde (Scrollen, Tippen, Zeigen). Auswertung: ~/Desktop/Website-Projekte/_Besuche/besuche.py verweil.
   Abschalten = Script-Tag entfernen. Fühlt sich auf der Seite nichts an: ein Zähler alle 500 ms, ein Beobachter, ein Schicken am Ende. */
(function () {
  try {
    var w = window, n = navigator, d = document;
    if (w.__verweil || !n.sendBeacon || n.webdriver || w.self !== w.top || !w.IntersectionObserver) return;
    var host = location.hostname, ZIEL = w.__verweilZiel || 'https://tasty-besuche.vercel.app/api/b?w=1';
    if (!/(\.vercel\.app|(^|\.)tasty-studios\.de|(^|\.)tastystudios\.ch)$/.test(host) && !w.__verweilZiel) return;
    if (localStorage.getItem('tasty-ich')) return;
    w.__verweil = 1;
    /* Empfänger (Robert 17.10.2026: «eigener Link je Empfänger»): ?f=<code> aus dem verschickten Link, besuch.js merkt ihn sich je Gerät */
    var m = /[?&]f=([a-z0-9]{4,10})\b/.exec(location.search), f = m ? m[1] : (localStorage.getItem('tasty-f') || '');
    if (m) localStorage.setItem('tasty-f', f);

    var JETZT = function () { return Date.now(); };
    var id = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
    var breit = function (px) { return !!(w.matchMedia && w.matchMedia('(max-width:' + px + 'px)').matches); };
    var geraet = breit(700) ? 'handy' : breit(1060) ? 'tablet' : 'rechner';
    var start = JETZT(), zuletzt = start, regt = start, tiefe = 0;
    var aktiv = 0, abschnitte = {}, sichtbar = {}, klicks = [], gesendet = 0, gesendetAktiv = -1;

    /* Abschnitte: die äußersten section/header/footer/[data-abschnitt]; Name aus id, aria-label, erster Überschrift oder Reihenfolge */
    var kandidaten = [].slice.call(d.querySelectorAll('section, header, footer, [data-abschnitt]'));
    var liste = kandidaten.filter(function (e) {
      return !kandidaten.some(function (o) { return o !== e && o.contains(e); });
    });
    var benutzt = {};
    function name(e, i) {
      var t = e.getAttribute('data-abschnitt') || e.id || e.getAttribute('aria-label');
      if (!t) { var h = e.querySelector('h1, h2, h3'); t = h ? h.textContent : ''; }
      t = (t || '').replace(/\s+/g, ' ').trim().slice(0, 34) || e.tagName.toLowerCase();
      t = (i < 9 ? '0' : '') + (i + 1) + ' ' + t;   /* Nummer vorn: Reihenfolge von oben nach unten bleibt lesbar */
      if (benutzt[t]) t += ' (' + (++benutzt[t]) + ')'; else benutzt[t] = 1;
      return t;
    }
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (x) {
        var hoeheBild = w.innerHeight || 1;
        var teil = x.intersectionRect.height / Math.min(hoeheBild, Math.max(x.boundingClientRect.height, 1));
        /* «im Blick»: mindestens ein Drittel des Bildes ODER mehr als die Hälfte des (kleineren) Abschnitts */
        var drin = x.isIntersecting && (x.intersectionRect.height >= hoeheBild * 0.33 || teil >= 0.5);
        if (drin) sichtbar[x.target.__vn] = 1; else delete sichtbar[x.target.__vn];
      });
    }, { threshold: [0, 0.1, 0.25, 0.4, 0.5, 0.75, 1] });
    liste.forEach(function (e, i) { e.__vn = name(e, i); io.observe(e); });
    if (!liste.length) { sichtbar['00 Seite'] = 1; }

    function bewegt() { regt = JETZT(); }
    ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (ev) {
      w.addEventListener(ev, bewegt, { passive: true });
    });
    w.addEventListener('scroll', function () {
      var h = d.documentElement, max = (h.scrollHeight - (w.innerHeight || 0)) || 1;
      var p = Math.round(100 * Math.min(1, Math.max(0, (w.pageYOffset || h.scrollTop || 0) / max)));
      if (p > tiefe) tiefe = p;
    }, { passive: true });
    d.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest && ev.target.closest('a, button, [role=button]');
      if (!a || klicks.length >= 12) return;
      var t = (a.getAttribute('aria-label') || a.textContent || a.getAttribute('href') || '').replace(/\s+/g, ' ').trim().slice(0, 36);
      if (t) klicks.push(t);
    }, true);

    setInterval(function () {
      var t = JETZT(), dt = Math.min(t - zuletzt, 1500); zuletzt = t;
      if (d.visibilityState !== 'visible' || t - regt > 30000) return;
      aktiv += dt;
      for (var k in sichtbar) abschnitte[k] = (abschnitte[k] || 0) + dt;
    }, 500);

    function schick() {
      var a = Math.round(aktiv / 1000);
      if (a < 1 || a === gesendetAktiv || gesendet >= 3) return;   /* nichts Neues, oder schon dreimal: der Speicher ist knapp */
      gesendetAktiv = a; gesendet++;
      var ab = {}; Object.keys(abschnitte).forEach(function (k) { var s = Math.round(abschnitte[k] / 1000); if (s >= 1) ab[k] = s; });
      var nutz = JSON.stringify({ p: id, s: location.pathname.slice(0, 120), g: geraet, t: a, o: Math.round((JETZT() - start) / 1000), d: tiefe, a: ab, c: klicks, f: f });
      if (nutz.length > 3800) return;
      n.sendBeacon(ZIEL, nutz);
    }
    d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') schick(); });
    w.addEventListener('pagehide', schick);
  } catch (e) {}
})();
