/* Fehlermelder Das Besucherbuch · Culinarium Hannover (Kopie der Taverne zum Schäfli, dort des Schlössli, Gasterntal, Doldenhorn und Carlton; Werkzeug-Master R03, vor allem anderen; eigene Datei, weil online eingebettete Skripte ohne Prüfsumme blockiert werden, Fund carlton-maison 16.10.2026): Skriptfehler nach localStorage «bg-registre-fehler» (letzte 20) und an den Dienst;
   Netz- und Ladefehler nie melden, höchstens 20 je Seite, ein eigener Fehlschlag wird nie erneut gemeldet. */
(function () { var n = 0, K = 'culinarium-registre-fehler';
  function melde(t) { if (n >= 20) return; n++; t = String(t).slice(0, 300);
    try { var l = JSON.parse(localStorage.getItem(K) || '[]'); l.push({ z: new Date().toISOString(), t: t, a: location.hash }); localStorage.setItem(K, JSON.stringify(l.slice(-20))); } catch (e) {}
    try { if (navigator.sendBeacon && !navigator.webdriver) navigator.sendBeacon('../../api/registre?fehler=1', t); } catch (e) {} }
  addEventListener('error', function (e) { if (e.target && e.target !== window) return; melde((e.message || 'Fehler') + ' @ ' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0)); }, true);
  addEventListener('unhandledrejection', function (e) { var r = e.reason, t = String(r && r.message || r); if (/fetch|network|load failed|abort/i.test(t)) return; melde('Promise: ' + t); });
})();
