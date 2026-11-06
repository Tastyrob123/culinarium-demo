/* Markenbuch · «Als PDF sichern» öffnet das Druckfenster des Browsers (je Kapitel eine A4-Seite quer, buch.css @media print).
   Fotos laden zuerst nur im Blick (lazy); kurz nach dem Laden und vor jedem Druck werden alle geholt, damit im PDF keines fehlt. */
'use strict';
(function () {
  const alle = () => Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.complete ? 0 : new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }); }));   /* addEventListener statt onload: ein zweiter Aufruf überschrieb sonst den ersten, der Druck kam nie (Demo-Check Schlössli 21.10.2026) */
  const b = document.getElementById('bu-pdf');
  if (b) b.addEventListener('click', () => alle().then(() => window.print()));
  addEventListener('beforeprint', () => { [...document.images].forEach(i => { i.loading = 'eager'; }); });
  addEventListener('load', () => setTimeout(alle, 1200));
})();
