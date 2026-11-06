// La Carte · Culinarium Hannover (aus der Tafel im Schäfli, dort aus dem Gasterntal) · Vorschau = PDF, ohne und mit Gestaltung (17.10.2026, aus La Carte des Carlton-Europe, wie GBR «Probe-PDF = Vorschau»).
//   node _werkzeuge/carte/pruef/gleich.js [chromium|webkit]
// Wegwerf-Server auf dem Prüfport (9091, eigener Server vorher beenden): je Karte die ungestaltete erste Seite und ein Entwurf mit verschobenen,
// vergrösserten und gestalteten Elementen (Schrift, Farbe, Linie, Band),
// dann dieselbe Seite einmal als Vorschau (Bearbeiten, mit Rahmen-Markierungen) und einmal als PDF gerastert und verglichen.
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const PW = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const HIER = path.join(__dirname, '..'), PORT = +(process.env.GL_PORT || 9091), BASIS = `http://127.0.0.1:${PORT}`, BR = process.argv[2] || 'chromium';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'carte-gleich-'));
const warte = ms => new Promise(r => setTimeout(r, ms));
const H = { 'X-Carte-Rolle': 'direktion', 'X-Carte-Wer': 'Gleich', 'Content-Type': 'application/json', Origin: BASIS };
let rot = 0;
function liesPfad(o, p) { return p.split('.').reduce((x, k) => x == null ? x : x[/^\d+$/.test(k) ? +k : k], o); }
(async () => {
  cp.execFileSync('python3', [path.join(HIER, 'einlesen.py')], { env: { ...process.env, CARTE_DATEN: TMP }, stdio: 'ignore' });
  try { cp.execSync(`lsof -tiTCP:${PORT} -sTCP:LISTEN`); console.error('Port belegt: erst den eigenen Server von La Carte beenden.'); process.exit(3); } catch (e) { /* frei */ }
  const srv = cp.spawn('python3', [path.join(HIER, 'serve.py'), String(PORT)], { env: { ...process.env, CARTE_DATEN: TMP, CARTE_PORT: String(PORT) }, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { await fetch(BASIS + '/culinarium-demo/_werkzeuge/carte/api/gesund'); break; } catch (e) { await warte(150); } }
  // Gasterntal: Seite 1 (Getränke und Deckel) ohne Gestaltung, Seite 2 (Speisen) mit Gestaltung an Gericht, Rubrik und Band
  const el = (d, f) => { let r = null; (function geh(x) { if (r || !x || typeof x !== 'object') return; if (x.fn === 'el' && f(x)) { r = x; return; } (Array.isArray(x) ? x : Object.values(x)).forEach(geh); })(d.seiten); return r; };
  const txt = x => typeof x === 'string' ? x : x && x.fn === 'el' ? x.a.slice(2).map(txt).join('') : '';
  // Culinarium 28.10.2026: Februar 2025 mit Gestaltung an einem Gang (Lage, Grösse, Schrift DM Mono, Farbe Kerze, Versalien) und am Titel (Mitte, grösser);
  // erstes Wochenende 2023 (mit Upgrade) und der nächste Abend ohne Gestaltung
  const FAELLE = {
    'abend-2025-02-21': d => { el(d, x => / class="sb-m"/.test(x.a[1]) && /Spinat/.test(txt(x))).lage = { x: 8, y: 3, s: 1.08, f: 'mono', c: 'kerze', a: 'versal' }; el(d, x => /sb-band/.test(x.a[1])).lage = { al: 'mitte', t: 1.15, mb: 4 }; return [1]; },
    'abend-2023-09-15': d => [1],
    'abend': d => [1],
  };
  const br = await PW[BR].launch();
  for (const [z, f] of Object.entries(FAELLE)) {
    const d = (await (await fetch(`${BASIS}/_werkzeuge/carte/api/karte?z=${z}`, { headers: H })).json()).stand;
    const seiten = f(d);
    const r = await fetch(`${BASIS}/_werkzeuge/carte/api/entwurf`, { method: 'POST', headers: H, body: JSON.stringify({ z, daten: d, was: 'gleich' }) });
    const rj = await r.json().catch(() => ({})); if (!r.ok) { console.log(z, 'Entwurf abgewiesen', JSON.stringify(rj)); rot++; continue; }
    // PDF des Entwurfs
    const pdf = path.join(TMP, z + '.pdf');
    cp.execFileSync('node', [path.join(HIER, 'drucke.js'), z, r.ok ? 'entwurf' : 'stand', pdf], { env: { ...process.env, CARTE_PORT: String(PORT) } });
    for (const n of seiten) {
      cp.execFileSync('pdftoppm', ['-f', String(n), '-l', String(n), '-r', '60', '-png', pdf, path.join(TMP, `${z}-pdf`)]);
      const pdfPng = fs.readdirSync(TMP).find(x => x.startsWith(`${z}-pdf`) && x.endsWith('.png'));
      // Vorschau: dieselben Daten im Bearbeiten-Modus, Massstab 1, ein Blatt als Bild
      const ctx = await br.newContext({ viewport: { width: 1800, height: 1300 }, deviceScaleFactor: 1 });   // breiter als das Blatt (Ruedihus-Falle: ein schmaleres Fenster schnitt A3 ab)
      const p = await ctx.newPage();
      await p.goto(`${BASIS}/_werkzeuge/carte/satz/blatt.html`); await warte(500);
      await p.evaluate(dd => postMessage({ carte: 'setze', daten: dd, modus: 'frei', zoom: 1 }, location.origin), (k => k.entwurf || k.stand)(await (await fetch(`${BASIS}/_werkzeuge/carte/api/karte?z=${z}`, { headers: H })).json()));
      await p.waitForFunction(() => document.querySelectorAll('.blatt').length > 0 && document.querySelector('.nr-zeile'), null, { timeout: 30000 }); await warte(1500);
      const bl = (await p.$$('.blatt'))[n - 1];
      await p.evaluate(b => { document.querySelectorAll('#anr,.anr-h,.anr-hl').forEach(x => x.remove()); b.style.transform = 'none'; b.style.margin = '0'; b.style.boxShadow = 'none'; }, bl);
      await warte(300);
      const vPng = path.join(TMP, `${z}-v.png`); await bl.screenshot({ path: vPng });
      await ctx.close();
      // vergleichen: beide auf dieselbe Grösse, mittlere Abweichung je Bildpunkt (0–255)
      const py = `
from PIL import Image, ImageChops, ImageStat, ImageFilter
a=Image.open(r'''${path.join(TMP, pdfPng)}''').convert('L'); b=Image.open(r'''${vPng}''').convert('L').resize(a.size)
# Doldenhorn: dichter Fliesstext (Spa-Etikette) zählt sonst jede Kante der Kantenglättung; leicht weichgezeichnet bleiben Verschiebungen sichtbar
a=a.filter(ImageFilter.GaussianBlur(1)); b=b.filter(ImageFilter.GaussianBlur(1))
d=ImageChops.difference(a,b); s=ImageStat.Stat(d); h=d.histogram(); print(round(s.mean[0],2), round(sum(h[61:])/(a.size[0]*a.size[1])*100,2))`;
      const [mittel, anteil] = cp.execFileSync('python3', ['-c', py]).toString().trim().split(' ').map(Number);
      // Die PDF druckt immer Chromium. Im Safari-Kern bricht die Vorschau einzelne Zeilen anders um (andere Schriftglättung): dort weitere Grenze
      const gut = BR === 'webkit' ? mittel < 8 && anteil < 5 : mittel < 4.5 && anteil < 1.5;
      if (!gut && BR !== 'webkit') rot++;
      console.log(`${gut ? 'ok    ' : BR === 'webkit' ? 'HINWEIS' : 'FEHLER'} ${z} Seite ${n}: Vorschau gegen PDF · mittlere Abweichung ${mittel}, starke Abweichung ${anteil} % der Fläche`);
      fs.copyFileSync(vPng, path.join(HIER, 'pruef', 'aus', `gleich-${z}-${n}-vorschau.png`)); fs.copyFileSync(path.join(TMP, pdfPng), path.join(HIER, 'pruef', 'aus', `gleich-${z}-${n}-pdf.png`));
      fs.unlinkSync(path.join(TMP, pdfPng));
    }
  }
  await br.close(); srv.kill(); fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`\n${BR}: Vorschau = PDF ${rot ? 'ROT' : 'grün'}${BR === 'webkit' ? ' (die PDF druckt Chromium; «HINWEIS» = Safari bricht dort einzelne Zeilen anders um)' : ''}`);
  process.exit(rot ? 1 : 0);
})().catch(e => { console.error('ABBRUCH', e); process.exit(2); });
