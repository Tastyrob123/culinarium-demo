// La Carte · Druck einer Karte als PDF (wie _werkbank/satz_druck_datei.js, mit dem die PDFs der Website gedruckt sind): node drucke.js <karte> <stand|entwurf|…> <ziel.pdf>
// Öffnet satz/blatt.html auf dem eigenen Server (CARTE_PORT, Standard 9083), wartet, bis der Satz steht, und druckt. Letzte Zeile: Bericht als JSON.
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const [z, art, aus] = process.argv.slice(2);
const PORT = process.env.CARTE_PORT || '9083';
(async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1300, height: 1400 }, deviceScaleFactor: 1.5 });
    await p.goto(`http://127.0.0.1:${PORT}/_werkzeuge/carte/satz/blatt.html?druck=1&z=${encodeURIComponent(z)}&q=${encodeURIComponent(art)}`, { waitUntil: 'load' });
    await p.waitForFunction(() => window.CARTE_FERTIG || window.CARTE_FEHLER, null, { timeout: 120000 });
    const f = await p.evaluate(() => window.CARTE_FEHLER);
    if (f) throw new Error(f);
    const bericht = await p.evaluate(() => window.CARTE_FERTIG);
    await p.emulateMedia({ media: 'print' });
    fs.mkdirSync(path.dirname(aus), { recursive: true });
    await p.pdf({ path: aus + '.teil', preferCSSPageSize: true, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    fs.renameSync(aus + '.teil', aus);
    console.log(JSON.stringify(bericht));
  } finally { await b.close(); }
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
