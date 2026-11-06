// La Réception · Brief als PDF (A4) mit Chromium: node brief_pdf.js <port> <daten.json> <ziel.pdf>
// Öffnet brief-pdf.html auf dem eigenen Server, setzt den Brief (BRIEF_SETZEN) und druckt ohne Ränder; Hintergrund und Farben immer mit. Letzte Zeile: Bericht als JSON.
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const [port, datei, aus] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 794, height: 1123 } });
    await p.goto(`http://127.0.0.1:${port}/_werkzeuge/reception/brief-pdf.html`, { waitUntil: 'load' });
    await p.emulateMedia({ media: 'print' });   // schon beim Messen die Druckdarstellung, sonst rutscht der Umbruch
    const daten = JSON.parse(fs.readFileSync(datei, 'utf8'));
    const bericht = await p.evaluate(d => window.BRIEF_SETZEN(d), daten);
    await p.pdf({ path: aus, preferCSSPageSize: true, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    console.log(JSON.stringify(bericht));
  } finally { await b.close(); }
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
