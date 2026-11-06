/* La Carte · Fehlermelder (16.10.2026, R03, nach dem Fehlermelder von Le Bureau des Grand Beau-Rivage, studio/index.html dort).
   Läuft als erstes Skript jeder Seite von La Carte: Skriptfehler und unbehandelte Versprechen gehen in den Browser (localStorage «lc-fehler»,
   die letzten 30) und an den Server (api/fehler → browserfehler.jsonl, «Prüfung» zeigt beide). Netzfehler werden nie gemeldet, höchstens
   20 je Seite, und scheitert die Meldung selbst, wird das nicht noch einmal gemeldet (Safari, 15.10.2026: eine Meldung meldete sich 9'969 Mal). */
(function () {
  var zahl = 0, still = false;
  var api = '/culinarium-demo/_werkzeuge/carte/api/fehler';
  function merk(t) {
    t = String(t || 'Fehler');
    if (still || ++zahl > 20 || /Load failed|access control|abort|NetworkError|Failed to fetch|Keine Verbindung/i.test(t)) return;
    var e = { zeit: new Date().toISOString(), text: t.slice(0, 500), seite: location.pathname.split('/').pop() || 'index.html' };
    try { var a = JSON.parse(localStorage.getItem('lc-fehler') || '[]'); a.push(e); localStorage.setItem('lc-fehler', JSON.stringify(a.slice(-30))); } catch (x) { /* ohne Speicher */ }
    try {
      fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e), keepalive: true })
        .then(function (r) { if (!r.ok) still = true; }, function () { still = true; });
    } catch (x) { still = true; }
  }
  window.addEventListener('error', function (e) { if (e && e.message) merk(e.message + ' · ' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || '')); });
  window.addEventListener('unhandledrejection', function (e) { merk('Versprechen: ' + ((e.reason && e.reason.message) || e.reason)); });
  window.carteMerk = merk;
})();
