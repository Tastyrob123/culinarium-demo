// Werkbank Culinarium: Bilder für den Oberchef (28.10.2026). Je Breite (1440 Chromium, 390 WebKit) der erste Bildschirm und ausgewählte Kapitel,
// dazu ein Bogen über die ganze Seite.   node website/_werkbank/pruefung/zeigen.js  →  ~/Desktop/Website-Projekte/_Oberchef/zeigen/culinarium/werkbank/
const path = require('path'), fs = require('fs');
const pw = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const Z = path.join(process.env.HOME, 'Desktop/Website-Projekte/_Oberchef/zeigen/culinarium/werkbank'), B = 'http://127.0.0.1:9088/werkbank/index.html';
const STELLEN = [['start', null], ['befund', '#k1'], ['marke', '#k2'], ['website', '#k3'], ['werkzeuge', '#k5'], ['papier', '#k6'], ['feed', '#feed'], ['angebot', '#sag-vorschlag'], ['schluss', '#schluss']];
(async () => {
  fs.mkdirSync(path.join(Z, 'bogen'), { recursive: true });
  for (const [m, w, h] of [['chromium', 1440, 900], ['webkit', 390, 844]]) {
    const b = await pw[m].launch({ headless: true }); const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await p.goto(B, { waitUntil: 'load' }); await p.waitForTimeout(2500);
    const hh = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < hh; y += 500) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(120); }
    for (const [n, sel] of STELLEN) {
      if (sel) await p.evaluate(s => { const e = document.querySelector(s); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - 10); }, sel); else await p.evaluate(() => scrollTo(0, 0));
      await p.waitForTimeout(2200); await p.screenshot({ path: path.join(Z, `werkbank-${w}-${n}.jpg`), quality: 84 });
    }
    let k = 0; for (let y = 0; y < hh; y += h) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(900); await p.screenshot({ path: path.join(Z, 'bogen', `${w}-${String(k++).padStart(2, '0')}.jpg`), quality: 60 }); }
    console.log(m, w, k, 'Bilder'); await b.close();
  }
})();
