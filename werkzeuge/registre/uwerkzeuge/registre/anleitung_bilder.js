/* Bilder für die Anleitung (anleitung.html): ein Bildschirmfoto je Kapitel aus dem echten Werkzeug, Beispielwerte, 1512×900 → 1200 px breit.
   node anleitung_bilder.js [basis]   (Server des Besucherbuchs muss laufen, eigener Port 9086) */
const path = require('path'), fs = require('fs');
const PW = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const A = process.argv[2] || 'http://127.0.0.1:9086/_werkzeuge/registre/';
const AUS = path.join(__dirname, 'anleitung');
const K = [
  ['k01', 'start', 0, null], ['k02', 'start', 520, null], ['k03', 'besuche', 540, null], ['k04', 'besuche', 540, async p => { await p.click('[data-filter="buchung"]'); await p.waitForTimeout(500); }],
  ['k05', 'herkunft', 400, null], ['k06', 'zeit', 470, null], ['k07', 'seiten', 470, null], ['k08', 'verlauf', 470, null], ['k09', 'buchung', 470, null],
  ['k10', 'zaehlung', 0, null]];   /* das Gasterntal hatte hier noch den Knopf «Dieses Gerät nicht mitzählen», der seit 18.10.2026 entfernt ist */
(async () => {
  const b = await PW.webkit.launch(); fs.mkdirSync(AUS, { recursive: true });
  for (const [id, v, y, vor] of K) {
    const c = await b.newContext({ viewport: { width: 1512, height: 900 }, deviceScaleFactor: 1 }); await c.addInitScript(() => { try { localStorage.setItem('rundgang-culinarium-registre', '1'); } catch (e) {} }); const p = await c.newPage();
    await p.goto(A + '?gruss=tag#' + v); await p.waitForFunction(() => window.BG_REGISTRE === 1 && document.documentElement.classList.contains('auftakt-da')); await p.waitForTimeout(3800);
    if (y) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(3600); }
    if (vor) await vor(p);
    await p.screenshot({ path: path.join(AUS, id + '.png') });
    await c.close();
  }
  await b.close();
  // PNG → JPEG 1200 px
  const { execSync } = require('child_process');
  for (const [id] of K) execSync(`sips -s format jpeg -s formatOptions 82 --resampleWidth 1200 "${path.join(AUS, id + '.png')}" --out "${path.join(AUS, id + '.jpg')}" >/dev/null && rm "${path.join(AUS, id + '.png')}"`);
  console.log('Bilder:', fs.readdirSync(AUS).join(' '));
})();
