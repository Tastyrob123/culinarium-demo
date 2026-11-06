// La Carte · Culinarium Hannover — Bildschirmbilder für Laptop der Werkbank und La Maison (17.10.2026), im Safari-Kern wie die Säle von La Maison (M08).
//   node _werkzeuge/carte/pruef/bilder.js       (Prüfport 9092, Wegwerf-Daten) → _werkzeuge/carte/bilder/ (webp) und, mit ZEIGEN=<ordner>, als PNG dorthin
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const { webkit } = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const HIER = path.join(__dirname, '..'), PORT = +(process.env.BI_PORT || 9092), BASIS = `http://127.0.0.1:${PORT}`, AUS = path.join(HIER, 'bilder');
const warte = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  try { cp.execSync(`lsof -tiTCP:${PORT} -sTCP:LISTEN`); console.error('Port belegt: erst den eigenen Server von La Carte beenden.'); process.exit(3); } catch (e) { /* frei */ }
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'carte-bilder-'));
  cp.execFileSync('python3', [path.join(HIER, 'einlesen.py')], { env: { ...process.env, CARTE_DATEN: TMP }, stdio: 'ignore' });
  const srv = cp.spawn('python3', [path.join(HIER, 'serve.py'), String(PORT)], { env: { ...process.env, CARTE_DATEN: TMP }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(BASIS + '/culinarium-demo/_werkzeuge/carte/api/gesund'); break; } catch (e) { await warte(150); } }
  fs.mkdirSync(AUS, { recursive: true });
  const br = await webkit.launch();
  const BILDER = [   // Name, Karte, Modus, Breite, Höhe, gescrollt, Ansicht
    ['la-carte-1440', 'abend', 'einfach', 1440, 900, 0, 'karte'],
    ['la-carte-abend-1440', 'abend', 'einfach', 1440, 900, 560, 'karte'],
    ['la-carte-februar-2025-1440', 'abend-2025-02-21', 'einfach', 1440, 900, 0, 'karte'],
    ['la-carte-liste-1440', 'abend-2025-02-21', 'einfach', 1440, 900, 560, 'karte'],
    ['la-carte-fortgeschritten-1440', 'abend-2023-09-15', 'frei', 1440, 900, 560, 'karte'],
    ['la-carte-website-1440', 'abend-2025-02-21', 'einfach', 1440, 900, 560, 'website'],
    ['la-carte-handy-390', 'abend', 'einfach', 390, 844, 0, 'karte'],
    ['la-carte-handy-abend-390', 'abend', 'einfach', 390, 844, 900, 'karte'],
    ['la-carte-handy-liste-390', 'abend-2024-04-26', 'einfach', 390, 844, 900, 'karte'],
  ];
  for (const [n, z, m, w, h, y, ansicht] of BILDER) {
    const c = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await c.addInitScript((m) => { localStorage.setItem('rundgang-culinarium-carte', '1'); localStorage.setItem('lc-modus', m); }, m);
    const p = await c.newPage();
    await p.goto(`${BASIS}/_werkzeuge/carte/#${z}`, { waitUntil: 'load' });
    const fehl = []; p.on('pageerror', e => fehl.push(e.message)); p.on('response', r => { if (r.status() >= 400) fehl.push(r.status() + ' ' + r.url()); });
    try { await p.waitForFunction(() => /Seite/.test(document.querySelector('#v-zahl')?.textContent || ''), null, { timeout: 60000 }); } catch (e) { await p.screenshot({ path: path.join(AUS, 'fehler-' + n + '.png') }); throw new Error(n + ': ' + fehl.join(' | ') + ' · ' + await p.textContent('#v-zahl').catch(() => '')); }
    await warte(3200);
    if (ansicht === 'website') { await p.click('.ansicht [data-ansicht="website"]'); await warte(3500); }
    if (y) { await p.evaluate(v => window.scrollTo(0, v), y); await warte(900); }
    const f = path.join(AUS, n + '.png'); await p.screenshot({ path: f });
    cp.execFileSync('python3', ['-c', `from PIL import Image; Image.open(r'''${f}''').convert('RGB').save(r'''${f.replace(/\.png$/, '.webp')}''', 'WEBP', quality=82)`]);
    if (process.env.ZEIGEN) { fs.mkdirSync(process.env.ZEIGEN, { recursive: true }); fs.copyFileSync(f, path.join(process.env.ZEIGEN, n + '.png')); }
    if (fehl.length) console.log('  Fehler: ' + fehl.slice(0, 3).join(' | '));
    fs.unlinkSync(f);
    console.log(n + '.webp');
    await c.close();
  }
  await br.close(); srv.kill(); fs.rmSync(TMP, { recursive: true, force: true });
})().catch(e => { console.error('ABBRUCH', e); try { cp.execSync(`kill $(lsof -tiTCP:${PORT} -sTCP:LISTEN)`); } catch (x) { /* weg */ } process.exit(2); });
