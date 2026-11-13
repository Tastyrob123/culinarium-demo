/* Besuchs-Melder, Baustein für jede Website und Werkbank (Standard seit 12.11.2026, Robert: «Tracker … wegen Öffnungen … immer direkt schon als Standard»).
   Vorlage: Angelina Strelow 08.11.2026. Einbau: neu.py im Ordner _Melder setzt KANAL und PFAD ein.
   Meldet jeden Seitenaufruf an einen kostenlosen Nachrichten-Kanal; Roberts Mac holt die Meldungen ab
   (<Projekt>/_melder/melder.py) und schickt die Mail.
   Still bleiben: Prüfprogramme, Roberts Geräte (Zeitzone Asien oder einmal ?ich geöffnet). */
(function () {
  var KANAL = 'https://ntfy.sh/culina-d08d0dad414508044ca3';
  try {
    var q = location.search;
    if (/[?&]ich=aus\b/.test(q)) localStorage.removeItem('tasty-ich');
    else if (/[?&]ich\b/.test(q)) localStorage.setItem('tasty-ich', '1');
  } catch (e) {}
  var probe = /[?&]probe\b/.test(location.search);
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var ich = false;
  try { ich = localStorage.getItem('tasty-ich') === '1'; } catch (e) {}
  if (!probe && (navigator.webdriver || ich || /^Asia\//.test(tz) ||
      /bot|crawl|spider|preview|headless|lighthouse|facebookexternalhit|whatsapp|slurp/i.test(navigator.userAgent))) return;

  function zufall() { return Math.random().toString(36).slice(2, 10); }
  var besucher = '', sitzung = '';
  try { besucher = localStorage.getItem('mb-b') || zufall(); localStorage.setItem('mb-b', besucher); } catch (e) { besucher = zufall(); }
  try { sitzung = sessionStorage.getItem('mb-s') || zufall(); sessionStorage.setItem('mb-s', sitzung); } catch (e) { sitzung = zufall(); }
  var aufruf = zufall();
  var ua = navigator.userAgent;
  var geraet = /iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'Tablet'
    : /Mobi|iPhone|Android/i.test(ua) ? 'Handy' : 'Rechner';
  var browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'anderer Browser';
  var system = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'anderes System';
  var pfad = location.pathname.replace(/^\/culinarium\-demo/, '') || '/';
  var basis = { b: besucher, s: sitzung, a: aufruf, p: pfad, pr: probe ? 1 : 0 };

  function senden(daten, beacon) {
    var text = JSON.stringify(daten);
    try {
      if (beacon && navigator.sendBeacon && navigator.sendBeacon(KANAL, text)) return;
      fetch(KANAL, { method: 'POST', body: text, keepalive: true, mode: 'cors' }).catch(function () {});
    } catch (e) {}
  }
  function mit(extra) { var o = {}, k; for (k in basis) o[k] = basis[k]; for (k in extra) o[k] = extra[k]; return o; }

  var auf = {
    art: 'auf', ti: document.title, g: geraet, br: browser, sy: system, tz: tz,
    sp: navigator.language || '', bi: screen.width + 'x' + screen.height,
    ref: document.referrer && document.referrer.indexOf(location.host) < 0 ? document.referrer.slice(0, 200) : ''
  };
  var fertig = false;
  function aufSenden(ort) {
    if (fertig) return; fertig = true;
    if (ort) { auf.st = ort.city || ''; auf.re = ort.region || ''; auf.la = ort.country || ''; auf.lc = ort.country_code || ''; }
    if (!probe && auf.lc && /^(PH|TH|HK|SG)$/.test(auf.lc)) { basis = null; return; }   // Roberts Standorte
    senden(mit(auf), false);
  }
  var warte = setTimeout(function () { aufSenden(null); }, 2500);
  try {
    fetch('https://get.geojs.io/v1/ip/geo.json').then(function (r) { return r.json(); })
      .then(function (d) { clearTimeout(warte); aufSenden(d); }, function () { clearTimeout(warte); aufSenden(null); });
  } catch (e) { clearTimeout(warte); aufSenden(null); }

  // Wie lange und wie weit gelesen: beim Verlassen oder Wegschalten
  var sichtbar = document.visibilityState === 'visible' ? Date.now() : 0, summe = 0, tiefe = 0;
  function messen() {
    var h = document.documentElement.scrollHeight - innerHeight;
    var d = h > 0 ? Math.round(Math.min(1, scrollY / h) * 100) : 100;
    if (d > tiefe) tiefe = d;
  }
  addEventListener('scroll', messen, { passive: true });
  function weg() {
    if (!basis || !fertig) return;
    if (sichtbar) { summe += Date.now() - sichtbar; sichtbar = 0; }
    messen();
    senden(mit({ art: 'zu', sek: Math.round(summe / 1000), td: tiefe }), true);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') weg(); else sichtbar = Date.now();
  });
  addEventListener('pagehide', weg);
  // Menschen-Beweis (Robert 13.11.2026, «Es klappt nie»): gemeldet wird erst, wenn sich jemand wirklich bewegt (Maus, Finger, Rad, Taste).
  // Link-Prüfer und Vorschau-Abrufe öffnen Seiten, bewegen aber nichts; ohne diese Meldung schickt der Melder keine Mail.
  var mensch = false, ARTEN = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'keydown'];
  function bewegt(e) {
    if (mensch || (e && e.isTrusted === false)) return;
    mensch = true;
    ARTEN.forEach(function (n) { removeEventListener(n, bewegt, true); });
    (function los() { if (!basis) return; if (!fertig) { setTimeout(los, 300); return; } senden(mit({ art: 'mensch' }), false); })();
  }
  ARTEN.forEach(function (n) { addEventListener(n, bewegt, { capture: true, passive: true }); });
})();
