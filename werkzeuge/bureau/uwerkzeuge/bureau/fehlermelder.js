/* fehlermelder.js · Le Bureau (Culinarium, aus dem Vorbild Schäfli), Master Werkzeug-Bau R03: vor allem anderen geladen. Skriptfehler gehen an den Server des Werkzeugs
   (/culinarium-demo/_werkzeuge/bureau/api/fehler, dort unter einem Schloss angehängt) und in den Browser (localStorage «ws-fehler», liest die Prüfseite).
   Netzfehler werden nie gemeldet, höchstens 20 je Seite, ein eigener Fehlschlag wird nie erneut gemeldet (Safari-Schleife 15.10.: 9'969 Fehler). */
(function () {
  var n = 0, still = false;
  function sende(text, quelle) {
    if (still || n >= 20 || !text) return;
    if (/Failed to fetch|NetworkError|Load failed|Netzwerk|network/i.test(text)) return;
    n++;
    try {
      var l = JSON.parse(localStorage.getItem('ws-fehler') || '[]');
      l.push({ zeit: new Date().toISOString(), text: String(text).slice(0, 400), stichwort: 'skript', wo: location.hash || 'start', haus: 'culinarium' });
      localStorage.setItem('ws-fehler', JSON.stringify(l.slice(-30)));
    } catch (e) { /* gesperrter Speicher */ }
    try {
      fetch('/culinarium-demo/_werkzeuge/bureau/api/fehler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ text: String(text).slice(0, 400), quelle: String(quelle || '').slice(0, 200), wo: location.pathname + location.hash, stichwort: 'skript' }) })
        .catch(function () { still = true; });
    } catch (e) { still = true; }
  }
  window.addEventListener('error', function (ev) { if (ev && ev.message) sende(ev.message, (ev.filename || '') + ':' + (ev.lineno || '')); });
  window.addEventListener('unhandledrejection', function (ev) {
    var r = ev && ev.reason;
    if (r && r.stichwort) return;   // erwartete Meldungen des Servers (mit Stichwort) zeigt das Werkzeug selbst als Quittung
    sende((r && (r.message || r.fehler)) || String(r), 'promise');
  });
})();
