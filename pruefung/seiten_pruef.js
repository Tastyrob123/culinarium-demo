// Werkbank Culinarium (28.10.2026, Vorlage Schäfli): alle Beigaben-Seiten laden, ganz durchscrollen, Fehler und seitliches Überlaufen zählen (Chromium + WebKit, 1440 und 390).
//   node website/_werkbank/pruefung/seiten_pruef.js  →  pruefung/seiten.json   (headless, mailto/tel abgefangen, nichts wird abgeschickt)
const path = require('path'), fs = require('fs');
const pw = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const B = 'http://127.0.0.1:' + (process.env.WB_PORT || 9088) + '/';
const SEITEN = ['werkbank/index.html', 'werkbank/geprueft/index.html', 'werkbank/ki.html', 'werkbank/karte.html', 'werkbank/impressum.html', 'befund/index.html', 'unterlagen/index.html',
  'drucksachen/index.html', 'untersetzer/index.html', 'feed/index.html', 'mails/index.html', 'mails/01-ticket/index.html', 'mails/02-warteliste/index.html',
  'mails/03-frei/index.html', 'material/index.html'];
(async () => {
  const aus = [];
  for (const motor of ['chromium', 'webkit']) {
    const b = await pw[motor].launch({ headless: true });
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, ...(w < 700 && motor === 'chromium' ? { isMobile: true, hasTouch: true } : {}) });
      for (const s of SEITEN) {
        const p = await ctx.newPage(); const f = [];
        p.on('pageerror', e => f.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error') f.push('console ' + m.text().slice(0, 140)); });
        p.on('response', r => { if (r.status() >= 400) f.push('http ' + r.status() + ' ' + r.url()); });
        await p.route(/^(mailto|tel):/, r => r.abort());
        try {
          await p.goto(B + s, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(800);
          await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); } });
          await p.waitForTimeout(600);
          const u = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, mailto: document.querySelectorAll('a[href^="mailto:"]').length,
            kerben: document.querySelectorAll('[class*=kerbe]').length, leer: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0).map(i => i.getAttribute('src')).slice(0, 5) }));
          aus.push({ motor, w, s, ...u, fehler: f });
          console.log(motor, w, s, u.sw > u.cw ? 'ÜBERLAUF ' + (u.sw - u.cw) : 'ok', 'mailto:' + u.mailto, 'leer:' + u.leer.length, 'fehler:' + f.length, f.slice(0, 2).join(' | '));
        } catch (e) { aus.push({ motor, w, s, fehler: ['laden ' + String(e).slice(0, 120)] }); console.log(motor, w, s, 'LADEN', String(e).slice(0, 100)); }
        await p.close();
      }
      await ctx.close();
    }
    await b.close();
  }
  fs.writeFileSync(path.join(__dirname, 'seiten.json'), JSON.stringify(aus, null, 1));
})();
