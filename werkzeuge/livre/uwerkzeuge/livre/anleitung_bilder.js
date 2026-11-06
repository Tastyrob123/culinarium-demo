/* Bilder für die Anleitung (anleitung.html), Le Livre · Culinarium Hannover: ein Bildschirmfoto je Kapitel aus dem echten Werkzeug (Safari-Kern), 1512 × 900 → 1200 px breit.
   node _werkzeuge/livre/anleitung_bilder.js [basis]   (Server: python3 _werkzeuge/livre/server.py 9085) */
const path = require('path'), fs = require('fs');
const PW = require(path.join(process.env.HOME, 'Aussen-Pruefung/node_modules/playwright'));
const A = process.argv[2] || 'http://127.0.0.1:9085/_werkzeuge/livre/';
const AUS = path.join(__dirname, 'anleitung');
const w = (p, ms) => p.waitForTimeout(ms);
const K = [
  ['k01', 'start', null],
  ['k02', 'bilder', async p => { await p.fill('#li-q', 'tafel'); await w(p, 900); }],
  ['k03', 'bilder', async p => { await p.evaluate(() => document.querySelector('#li-raster .li-f[data-k="anstossen"]').scrollIntoView({ block: 'center' })); await w(p, 300); await p.locator('#li-raster .li-f[data-k="anstossen"]').click({ force: true }); await p.waitForSelector('#fenster .li-det'); await w(p, 900); await p.locator('#fenster .li-gr').nth(0).hover(); await w(p, 700); }],
  ['k04', 'bilder', async p => { await p.locator('[data-f="h"][data-w="fremd"]').click(); await w(p, 700); await p.evaluate(() => document.querySelector('#li-raster .li-f').scrollIntoView({ block: 'center' })); await w(p, 300); await p.locator('#li-raster .li-f').first().click({ force: true }); await p.waitForSelector('#fenster .li-det'); await w(p, 900); }],
  ['k05', 'dateien', async p => { await p.evaluate(() => document.querySelector('#d-logo').scrollIntoView()); await w(p, 1200); }],
  ['k06', 'dateien', async p => { await p.evaluate(() => document.querySelector('#d-farben').scrollIntoView()); await w(p, 1200); }],
  ['k07', 'pruefung', null],
  ['k08', 'pruefung', async p => { await p.locator('#li-bsp').click(); await w(p, 1600); await p.evaluate(() => document.querySelector('.li-erg').scrollIntoView()); await w(p, 1000); }],
  ['k09', 'buch.html', null]];
(async () => {
  const b = await PW.webkit.launch(); fs.mkdirSync(AUS, { recursive: true });
  for (const [id, v, vor] of K) {
    const c = await b.newContext({ viewport: { width: 1512, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' }); const p = await c.newPage();
    await p.goto(v.endsWith('.html') ? A + v : A + '#' + v, { waitUntil: 'load' }); await w(p, 3000);
    if (vor) await vor(p);
    await p.screenshot({ path: path.join(AUS, id + '.png') });
    await c.close();
  }
  await b.close();
  const { execSync } = require('child_process');
  for (const [id] of K) execSync(`sips -s format jpeg -s formatOptions 82 --resampleWidth 1200 "${path.join(AUS, id + '.png')}" --out "${path.join(AUS, id + '.jpg')}" >/dev/null && rm "${path.join(AUS, id + '.png')}"`);
  console.log('Bilder:', fs.readdirSync(AUS).join(' '));
})();
