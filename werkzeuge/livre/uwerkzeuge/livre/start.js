/* Le Livre · Culinarium Hannover · läuft vor allem anderen (Master R03, R04, R15).
   Fehlermelder: Skriptfehler nach localStorage «cu-livre-fehler» (letzte 20) und an api/fehler; Netzfehler und fehlende Dateien nie, höchstens 20 je Seite,
   ein eigener Fehlschlag schaltet ab (Safari-Schleife 15.10.2026). Ladezeichen erst nach 280 ms. Kommt livre.js nach 12 s nicht hoch: ein Satz statt leerer Fläche. */
'use strict';
(function () {
  let n = 0, aus = false;
  const melde = (art, text, wo) => {
    if (aus || n >= 20) return; n++;
    const e = { zeit: new Date().toISOString(), art, text: String(text || '').slice(0, 300), wo: String(wo || '').slice(0, 200), seite: location.pathname + location.hash, browser: navigator.userAgent.slice(0, 160) };
    try { const l = JSON.parse(localStorage.getItem('cu-livre-fehler') || '[]'); l.push(e); localStorage.setItem('cu-livre-fehler', JSON.stringify(l.slice(-20))); } catch (x) { /* privat */ }
    try { fetch('api/fehler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e), keepalive: true }).then(r => { if (!r.ok) aus = true; }, () => { aus = true; }); } catch (x) { aus = true; }
  };
  window.LIVRE_MELDE = melde;
  addEventListener('error', ev => { if (ev.target && ev.target !== window) return; melde('fehler', ev.message, (ev.filename || '').split('/').pop() + ':' + (ev.lineno || 0)); }, true);
  addEventListener('unhandledrejection', ev => { const r = ev.reason; if (r && /Failed to fetch|NetworkError|Load failed|network|abort/i.test(String(r.message || r))) return; melde('versprechen', r && (r.message || r), r && r.stack && r.stack.split('\n')[1]); });
  /* Ladezeichen erst nach 280 ms (R15): kurze Wege zeigen nie ein Zucken */
  window.LIVRE_LADE = setTimeout(() => { const a = document.getElementById('ansicht'); if (a && !a.firstChild) a.innerHTML = '<div class="lade" role="status" aria-label="Lädt"><span class="lade__r"></span></div>'; }, 280);
  /* Startfehler, wenn das Werkzeug gar nicht hochkommt (R04): nach 12 s ein Satz mit Weg zur Anleitung */
  window.LIVRE_TUER = setTimeout(() => {
    if (window.LIVRE_BEREIT) return;
    const a = document.getElementById('ansicht'); if (!a) return;
    const n = (window.WO_HAUS && WO_HAUS.namen && WO_HAUS.namen.marke) || 'Le Livre';
    a.innerHTML = '<div class="platte li-tuer" role="alert"><h1>' + n.replace(/[<>&]/g, '') + ' startet nicht.</h1><p class="li-tuer__g">Das Programm der Seite ist nicht geladen worden (Netz oder blockiertes Skript).</p><p>Hilft «Neu laden» nicht: die Anleitung öffnen oder Tasty Studios Bescheid geben.</p><div class="titel__kn"><a class="kn" href="./">Neu laden<i></i></a><a class="kn kn--linie" href="anleitung.html" target="_blank" rel="noopener">Anleitung<i></i></a></div></div>';
  }, 12000);
})();
