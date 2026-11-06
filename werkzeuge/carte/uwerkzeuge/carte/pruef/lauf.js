// La Carte · Culinarium Hannover — Bedienungsprobe (28.10.2026, aus der Tafel im Schäfli, dort aus Schlössli, Gasterntal, Ruedihus und Doldenhorn): öffnet das Werkzeug wie ein Mensch und drückt jeden Knopf der Funktionsliste.
//   node _werkzeuge/carte/pruef/lauf.js [chromium|webkit|firefox] [breite] [hoehe]      (Standard chromium 1440 900)
// Eigener Server auf einem Prüfport (9089, frei neben La Carte auf 9083; fremde Prozesse werden nie beendet) mit Wegwerf-Daten (CARTE_DATEN = temporärer Ordner, frisch eingelesen), danach beendet und gelöscht.
// Das Werkzeug des Hauses (_daten/) und die Website bleiben unberührt (Anschluss an die Website bleibt aus; geprüft wird er in anschluss.js an
// einer APFS-Kopie). Jede Zeile: «ok» oder «FEHLER» mit Nummer der Funktionsliste. Ausgang 1, sobald etwas rot ist. Belege: pruef/aus/lauf-<browser>-<breite>/.
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const { chromium, webkit, firefox } = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const HIER = path.join(__dirname, '..');
const BROWSER = ['chromium', 'webkit', 'firefox'].includes(process.argv[2]) ? process.argv[2] : 'chromium';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900), HANDY = W < 901;
const PORT = +(process.env.LAUF_PORT || 9089), BASIS = `http://127.0.0.1:${PORT}`;   // Prüfport (La Carte selbst läuft auf 9083 und bleibt unberührt)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'carte-lauf-'));
const BELEG = path.join(HIER, 'pruef', 'aus', `lauf-${BROWSER}-${W}`);
fs.mkdirSync(BELEG, { recursive: true });
let rot = 0, nr = 0, srv = null, OFFLINE = false;
const ergebnis = [];
const ok = (id, n, b, mehr = '') => { nr++; if (!b) rot++; const z = `${b ? 'ok    ' : 'FEHLER'} ${id.padEnd(5)} ${n}${mehr ? ' · ' + mehr : ''}`; console.log(z); ergebnis.push({ id, n, ok: !!b, mehr }); return b; };
const warte = ms => new Promise(r => setTimeout(r, ms));
const hdr = (rolle, wer = 'Probe') => ({ 'X-Carte-Rolle': rolle, 'X-Carte-Wer': encodeURIComponent(wer), 'Content-Type': 'application/json', Origin: BASIS });
async function api(was, daten, rolle = 'direktion', extra = {}) {
  const r = await fetch(`${BASIS}/_werkzeuge/carte/api/${was}`, daten === undefined ? { headers: hdr(rolle) } : { method: 'POST', headers: { ...hdr(rolle), ...extra }, body: typeof daten === 'string' ? daten : JSON.stringify(daten) });
  return { s: r.status, j: await r.json().catch(() => ({})), h: r.headers };
}

(async () => {
  cp.execFileSync('python3', [path.join(HIER, 'einlesen.py')], { env: { ...process.env, CARTE_DATEN: TMP }, stdio: 'ignore' });
  try { cp.execSync(`lsof -tiTCP:${PORT} -sTCP:LISTEN`); console.error(`Port ${PORT} ist belegt. Erst den eigenen Server von La Carte beenden (nie fremde).`); process.exit(3); } catch (e) { /* frei */ }
  srv = cp.spawn('python3', [path.join(HIER, 'serve.py'), String(PORT)], { env: { ...process.env, CARTE_DATEN: TMP }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(BASIS + '/culinarium-demo/_werkzeuge/carte/api/gesund'); break; } catch (e) { await warte(150); } }
  const B = { chromium, webkit, firefox }[BROWSER];
  const br = await B.launch();
  const fehlerKonsole = [], fehlerNetz = [];
  const ctx = await br.newContext({ viewport: { width: W, height: H }, acceptDownloads: true });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('lc-wer')) { localStorage.setItem('lc-wer', 'Probe Direktion'); localStorage.setItem('lc-rolle', 'direktion'); } localStorage.setItem('rundgang-culinarium-carte', '1'); } catch (e) { /* egal */ } });
  await ctx.route(/^(mailto|tel):/, rt => rt.abort());   // Prüf-Chats öffnen nie ein Mailprogramm (Master Website-Bau 1, 17.10.2026)
  const p = await ctx.newPage();
  const horch = (pg) => {
    pg.on('pageerror', e => fehlerKonsole.push('Skript: ' + String(e).slice(0, 200)));
    pg.on('console', m => { if (m.type() === 'error' && !OFFLINE && !/Failed to load resource.*(429|403|413|415|409|400)|net::ERR_INTERNET_DISCONNECTED|NetworkError|Load failed|ERR_FAILED|status of 4/.test(m.text())) fehlerKonsole.push('Konsole: ' + m.text().slice(0, 200)); });
    pg.on('response', r => { let fr = ''; try { fr = r.request().frame().url(); } catch (e) { /* weg */ } if (r.status() >= 400 && !/\/(abende|abend|index)\.html|api\/webseite/.test(fr) && !/\/api\/(pdf|entwurf|veroeffentlichen|zurueckholen|einstellungen|reparatur|probe)/.test(r.url()) && !r.url().includes('favicon')) fehlerNetz.push(r.status() + ' ' + r.url().replace(BASIS, '')); });
  };
  horch(p);
  const rahmen = () => p.frame({ url: /satz\/blatt\.html(?!\?mini)/ });
  const gesetzt = async () => { await p.waitForFunction(() => /Seite/.test(document.querySelector('#v-zahl')?.textContent || ''), null, { timeout: 30000 }); await warte(450); };
  const fenster = () => p.$('#fenster:not([hidden]) .fenster__k');
  const zu = async () => { if (await fenster()) { await p.keyboard.press('Escape'); await warte(250); } };
  const quit = async (re, t = 8000) => { try { await p.waitForFunction((r) => [...document.querySelectorAll('#meldung .quit')].some(q => new RegExp(r).test(q.textContent)), re.source, { timeout: t }); return true; } catch (e) { return false; } };
  const karte = async (z) => {
    if (HANDY && !(await p.evaluate(() => document.documentElement.classList.contains('wo-rand-auf')))) { await p.click('.wo-kopf__ber'); await warte(250); }
    await p.evaluate((z) => { const v = document.querySelector('#v-zahl'), k = document.querySelector(`.kw[data-z="${z}"]`); if (v && k && k.getAttribute('aria-current') !== 'true') v.textContent = '…'; }, z);   // sonst gilt die Zeile der vorigen Karte als «gesetzt»
    await p.click(`.kw[data-z="${z}"]`); await gesetzt();
  };
  const zeile = (text) => p.locator('#liste .r', { hasText: text }).first();
  const imRahmen = async (text) => (await rahmen().evaluate(() => document.getElementById('seiten').textContent)).toLowerCase().includes(text.toLowerCase());   // Rudis Zeilen stehen in Versalien
  const knopf = async (r, akt) => { await r.scrollIntoViewIfNeeded(); if (!(await r.evaluate(e => e.classList.contains('gewaehlt')))) { await r.locator('.r__t').click({ position: { x: 14, y: 10 } }); await warte(500); } await r.locator(`[data-akt="${akt}"]`).scrollIntoViewIfNeeded(); await r.locator(`[data-akt="${akt}"]`).click(); await warte(300); };   // Robert 20.10.2026: die Knöpfe einer Zeile stehen unter dem gewählten Eintrag
  const breit = () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  // Element im Rahmen in die Mitte des Fensters holen (die feste Leiste unten deckt sonst den Klick ab, Carlton-Falle 5) und seine Lage liefern
  // am Handy oben ins Viertel: die Seitenleiste «Gestalten» liegt dort unten als Platte über der Vorschau
  const mitte = async (h) => { await h.evaluate(e => e.scrollIntoView({ block: 'center' })); await warte(150); let b = await h.boundingBox(); await p.evaluate(dy => window.scrollBy(0, dy), b.y + b.height / 2 - (HANDY ? H * 0.28 : H / 2 - 40)); await warte(250); b = await h.boundingBox(); return b; };
  const bild = async (n) => { try { await p.screenshot({ path: path.join(BELEG, n + '.png') }); } catch (e) { /* egal */ } };

  const feld = (n) => p.$(`#fenster .felder .feld:has(> span:text-is("${n}")) input, #fenster .felder .feld:has(> span:text-is("${n}")) textarea`);
  const fF = async (n, v) => { const x = await feld(n); if (x) await x.fill(v); return !!x; };
  const eintragHat = (name, text) => rahmen().evaluate(([n, t]) => [...document.querySelectorAll('.sb-g, .sb-m')].some(e => e.textContent.toLowerCase().includes(n.toLowerCase()) && e.textContent.includes(t)), [name, text]);
  const ES = 'abend-2025-02-21', EU = 'abend-2023-09-15';   // Karte vom Februar 2025 (fünf Gänge), erstes Wochenende 2023 (mit «Upgrade nach Wahl», einer Rubrik)

  // ---------------------------------------------------------------- A Laden, Rahmen (R01–R06, R15, C01, C13)
  for (const url of ['/culinarium-demo/_werkzeuge/carte/', '/culinarium-demo/_werkzeuge/carte/satz/blatt.html', '/culinarium-demo/_werkzeuge/carte/anleitung.html', '/culinarium-demo/_werkzeuge/carte/pruefung.html']) for (let i = 1; i <= 2; i++) {
    const t0 = Date.now(); const r = await p.goto(BASIS + url, { waitUntil: 'load' }); await warte(500);
    ok('A01', `Laden ${url} (${i}. Mal)`, [200, 304].includes(r.status()), `${r.status()} · ${Date.now() - t0} ms`);
  }
  await p.goto(BASIS + '/culinarium-demo/_werkzeuge/carte/#' + ES, { waitUntil: 'load' }); await gesetzt();
  const NAMEN = await p.evaluate(() => ({ karten: WO.name('karten'), website: WO.name('website') }));   // Namen der Werkzeuge aus dem Kleid (kleid/culinarium.js, eine Stelle)
  ok('R01', 'Aufbau: Kopfleiste, Rand, Hauptfläche, Leiste, Fenster, Quittung mit aria-live (Oberfläche der Häuser, Rahmen «Die Bühne», Kleid culinarium)', await p.evaluate(() => ['#oben.wo-kopf', '#rand.wo-rand', '.haupt.wo-raum', '#leiste.wo-leiste', '#fenster', '#meldung[aria-live]'].every(s => document.querySelector(s)) && document.documentElement.dataset.woHaus === 'culinarium' && document.documentElement.dataset.woRahmen === 'buehne'));
  ok('R05', `Kopfleiste: Zeichen, «${NAMEN.karten}» (Name aus dem Kleid), Haus, Titel der Karte, runde Knöpfe, Website ansehen (Startseite, wie in allen Werkzeugen; «Alle Abende auf der Website» steht im Rand); keine Abfrage «Wer arbeitet hier?»`, await p.evaluate(() => {
    const o = document.querySelector('#oben'); return !!o.querySelector('.wo-marke-w .wo-zeichen') && o.textContent.includes(WO.name('karten')) && /Culinarium/i.test(o.textContent) && /Februar 2025/.test(o.querySelector('.wo-kopf__mitte').textContent) && o.querySelectorAll('.wo-kn--rund').length >= 4 && /^http:\/\/127\.0\.0\.1:8765\/$/.test(o.querySelector('.wo-kopf__r a.wo-kn--gold').href) && [...document.querySelectorAll('#rand a')].some(a => /Alle Abende auf der Website/.test(a.textContent) && /abende\.html/.test(a.href)) && !o.querySelector('.wer, [data-akt="wer"]'); }));
  ok('R05', 'Knöpfe des Kopfs führen zum Tresen (Zentrale, 9081), Prüfung, Anleitung; das Schaufenster (9082) steht im Rand; immer 127.0.0.1', await p.evaluate(() => { const h = [...document.querySelectorAll('#oben a.wo-kn--rund')].map(a => a.getAttribute('href')); return h.some(x => /^http:\/\/127\.0\.0\.1:9081\/_werkzeuge\/maison\/$/.test(x)) && h.some(x => /anleitung\.html$/.test(x)) && h.some(x => /pruefung\.html$/.test(x)) && !!document.querySelector('#rand a[href="http://127.0.0.1:9082/_werkzeuge/bureau/"]') && ![...document.querySelectorAll('a[href]')].some(a => /localhost/.test(a.href)); }));
  ok('F10a', 'Kein Fenster «Wer arbeitet hier?» beim Öffnen', !(await p.$('#fenster:not([hidden]) #w-n')) && !/Wer arbeitet hier/.test(await p.textContent('body')));
  ok('F10a', 'Untere Leiste: Titel einzeilig, Satz ganz (ohne «…»), Kopf und Leiste im selben Zustand', await p.evaluate(() => { const l = document.querySelector('#leiste'), b = l.querySelector('.wo-leiste__t b'), sm = l.querySelector('.wo-leiste__t small'); const kopf = document.querySelector('.wo-kopf__mitte').textContent; return b.getBoundingClientRect().height < 30 && (!sm || getComputedStyle(sm).display === 'none' || sm.scrollWidth <= sm.clientWidth + 1) && !(/Noch keine PDF/.test(kopf) && /Alles veröffentlicht/.test(l.textContent)); }));
  const karten = await p.$$eval('.kw', e => e.map(x => x.dataset.z));
  ok('C01', 'Karten des Hauses als Fotokacheln: «Der nächste Abend» oben, darunter die sieben früheren Abende mit Plakat, neueste zuerst, in zwei Gruppen mit Zwischentitel', karten.length === 8 && karten[0] === 'abend' && karten[1] === ES && karten[7] === EU && await p.evaluate(() => [...document.querySelectorAll('.kw')].every(k => /url\(/.test(k.querySelector('.wo-rk__b').style.backgroundImage)) && /Der nächste Abend/.test(document.querySelector('#rand .karten').textContent) && /Frühere Abende/.test(document.querySelector('#rand .karten .kw-gruppe').textContent)), karten.join(', '));
  ok('C13', 'Wege: Frühere Fassungen, Veröffentlichte PDF, Zur Werkbank, Alle Abende auf der Website, das Schaufenster (Name aus dem Kleid), Anschluss, Rundgang', await p.evaluate(() => { const t = document.querySelector('#rand .wege').textContent; return ['Frühere Fassungen', 'Veröffentlichte PDF', 'Werkbank', 'auf der Website', WO.name('website'), 'Anschluss', 'Kurzer Rundgang'].every(x => t.includes(x)); }));
  for (const k of karten) {
    await karte(k);
    const w = await p.$('#v-warn:not([hidden])');
    ok('C07', `Karte ${k}: Vorschau gesetzt, nichts läuft über`, !w, w ? await w.textContent() : '');
    ok('R16', `Karte ${k}: Startbild mit Foto, Zeichen und Titel (Bühne)`, await p.evaluate(() => !!document.querySelector('#kopf .wo-sb--buehne .wo-sb__foto img') && !!document.querySelector('#kopf .wo-sb__zier .wo-zeichen') && document.querySelector('#kopf .wo-sb__h').textContent.trim().length > 3));
    ok('R07', `Karte ${k}: kein seitliches Verrutschen (${W} px)`, (await breit()) <= 0 && await p.evaluate(() => document.body.scrollWidth <= innerWidth), String(await breit()));
  }
  await karte(ES);
  ok('C07', 'Vorschau «1 Seite, wie in der PDF», ein Blatt A4 hoch', /1 Seite, wie in der PDF/.test(await p.textContent('#v-zahl')) && (await rahmen().$$eval('.blatt', e => e.length)) === 1 && await rahmen().evaluate(() => { const b = document.querySelector('.blatt'); return b.offsetHeight > b.offsetWidth; }));
  ok('C07', 'Vorschau verkleinert per transform, nie per zoom', await rahmen().evaluate(() => { const b = document.querySelector('.blatt'); return /scale\(/.test(b.style.transform) && !b.style.zoom; }));
  const z0 = await rahmen().evaluate(() => document.querySelector('.blatt').getBoundingClientRect().width);
  await p.click('[data-zoom="1"]'); await warte(400);
  const z1 = await rahmen().evaluate(() => document.querySelector('.blatt').getBoundingClientRect().width);
  ok('C07', 'Zoom + vergrössert die Vorschau', z1 > z0 + 5, `${Math.round(z0)} → ${Math.round(z1)} px`);
  await p.click('[data-zoom="-1"]'); await warte(300);
  await p.goto(BASIS + '/culinarium-demo/_werkzeuge/carte/', { waitUntil: 'load' }); await gesetzt();
  ok('R15', 'Ohne Adresse öffnet die zuletzt gewählte Karte', /Februar 2025/.test(await p.textContent('#kopf .wo-sb__h')));
  await p.goto('about:blank'); await p.goto(BASIS + '/culinarium-demo/_werkzeuge/carte/', { waitUntil: 'load', referer: 'http://127.0.0.1:9081/_werkzeuge/maison/' }); await gesetzt();
  ok('R15', 'Aus dem Tresen (Zentrale) geöffnet: die erste Karte («Der nächste Abend»)', /Der nächste Abend/.test(await p.textContent('#kopf .wo-sb__h')));
  if (HANDY) { await p.click('.wo-kopf__ber'); await warte(250); }
  await p.click('.modus [data-m="frei"]'); await gesetzt();
  await p.reload({ waitUntil: 'load' }); await gesetzt();
  ok('C01', 'Modus Fortgeschritten mit Satz, nach Neuladen gemerkt (R15)', /gestaltest direkt in der Karte/.test(await p.textContent('.modus__t')) && await p.$('.modus [data-m="frei"][aria-pressed="true"]'));
  if (HANDY) { await p.click('.wo-kopf__ber'); await warte(250); }
  await p.click('.modus [data-m="einfach"]'); await gesetzt();
  ok('C01', 'Modus Einfach mit Satz', /in einer Liste/.test(await p.textContent('.modus__t')));
  if (HANDY) {
    ok('R07', 'Handy: der Rand liegt hinter dem Knopf «Bereiche», zu bis man ihn drückt', await p.evaluate(() => getComputedStyle(document.querySelector('#rand')).display === 'none'));
    await p.click('.wo-kopf__ber'); await warte(200);
    ok('R07', 'Handy: «Bereiche» öffnet den Rand mit den Karten und den Wegen', await p.evaluate(() => getComputedStyle(document.querySelector('#rand')).display !== 'none'));
    await p.click(`.kw[data-z="${ES}"]`); await warte(400);
    ok('R07', 'Handy: nach der Wahl schliesst sich der Rand', await p.evaluate(() => getComputedStyle(document.querySelector('#rand')).display === 'none'));
  }
  await bild('01-start');

  // ---------------------------------------------------------------- B Einfach (C02, C03, C04, C09, R09–R11) · Karte vom Februar 2025
  await karte(ES);
  const ein = zeile('Miso');
  await ein.scrollIntoViewIfNeeded(); await ein.locator('.r__t').click({ position: { x: 14, y: 10 } }); await warte(900);
  const blitzR = await rahmen().evaluate(() => [...document.querySelectorAll('.blitz')].map(x => x.textContent).join(''));
  ok('C04', 'Klick links: rechts blinkt der Gang', /Miso \/ Sellerie/i.test(blitzR), blitzR.slice(0, 60));
  const hoehe = await p.evaluate(() => { const r = document.querySelector('#liste .r.gewaehlt').getBoundingClientRect(); const f = document.getElementById('vf'), fr = f.getBoundingClientRect(); const e = f.contentDocument.querySelector('.blitz'); const q = e.getBoundingClientRect(); return [r.top + r.height / 2, fr.top + q.top + q.height / 2]; });
  const randV = await rahmen().evaluate(() => { const e = document.scrollingElement; return e.scrollTop <= 1 || e.scrollTop + e.clientHeight >= e.scrollHeight - 1; });   // die Karte steht ganz im Rahmen: höher oder tiefer geht nicht
  ok('C04', 'Klick links: links und rechts auf derselben Höhe (± 60 px), soweit die Vorschau scrollen kann', HANDY || Math.abs(hoehe[0] - hoehe[1]) < 60 || randV, hoehe.map(Math.round).join(' / ') + (randV ? ' · Vorschau am Rand' : ''));
  ok('F10a', 'Knöpfe der gewählten Zeile: eigene Zeile, nie über Bild oder Text, keine Fläche dahinter', await p.evaluate(() => { const r = document.querySelector('#liste .r.gewaehlt'); if (!r) return false; const k = r.querySelector('.r__k'), kb = k.getBoundingClientRect(), ue = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; const t = r.querySelector('.r__t').getBoundingClientRect(), bi = r.querySelector('.r__b'); return getComputedStyle(k).display !== 'none' && !ue(kb, t) && !(bi && ue(kb, bi.getBoundingClientRect())) && getComputedStyle(k).backgroundImage === 'none' && /rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(k).backgroundColor); }));
  ok('F10a', 'Plus-Knopf «Gang am Ende» ist ein Knopf des Rahmens mit Körper und Knauf', await p.evaluate(() => { const k = [...document.querySelectorAll('#liste .neu-zeile .wo-kn')]; return k.length >= 1 && k.every(b => getComputedStyle(b).backgroundImage !== 'none' && !!b.querySelector('i')); }));
  ok('F10a', 'Rudis Teller in der Liste in Versalien (Schrift des Hauses), Gang als Etikett darüber', await p.evaluate(() => { const r = [...document.querySelectorAll('#liste .r')].find(x => /Miso/.test(x.textContent)); return !!r && getComputedStyle(r.querySelector('.r__t b')).textTransform === 'uppercase' && /Vorspeise/.test(r.querySelector('.r__gang').textContent); }));
  const ziel = await rahmen().$('k-t:text-is("Tequila | lakto-fermentierte Tomate | Agave | Limette")');
  if (ziel) { const bz = await mitte(ziel); await p.mouse.click(bz.x + 3, bz.y + bz.height / 2); await warte(900); }
  ok('C04', 'Klick rechts (Drink): Gang links gewählt und blinkt', /Spinat/.test(await p.evaluate(() => (document.querySelector('#liste .r.gewaehlt') || {}).textContent || '')));
  if (ziel) { const bz = await mitte(ziel); await p.mouse.dblclick(bz.x + 3, bz.y + bz.height / 2); await warte(600); }
  ok('C04', 'Doppelklick in der Vorschau öffnet den Gang', !!(await fenster()) && /bearbeiten/.test(await p.textContent('#fenster h2')));
  await zu();
  await zeile('Spinat').locator('.r__t').dblclick({ position: { x: 14, y: 10 } }); await warte(500);
  const felder0 = await p.$$eval('#fenster .felder .feld > span', e => e.map(x => x.textContent));
  ok('C02', 'Gang: Felder Gang, Teller (Rudi), Drink (Momo)', ['Gang', 'Teller', 'Drink'].every(f => felder0.includes(f)), felder0.join(', '));
  await zu();
  await zeile('Sauerteig').locator('.r__t').dblclick({ position: { x: 14, y: 10 } }); await warte(500);
  ok('C02', 'Doppelklick auf die Zeile öffnet das Fenster mit allen Feldern', !!(await fenster()) && (await p.$$('#fenster .felder .feld')).length >= 3);
  ok('C02', 'Fenster zeigt «So steht es auf der Karte»', !!(await p.$('#f-mini')));
  await fF('Teller', 'Sauerteig / Tomate / Nussbutter'); await warte(600);
  const mini = p.frame({ url: /mini=1/ });
  ok('C02', 'Vorschau im Fenster folgt beim Tippen', mini && /Nussbutter/i.test(await mini.evaluate(() => document.body.textContent)));
  await p.click('#f-ok'); await warte(300);
  ok('R11', 'Quittung nach dem Speichern mit «Rückgängig» und «Vorher / nachher»', await quit(/gespeichert/) && await p.evaluate(() => /Rückgängig/.test(document.querySelector('#meldung').textContent) && /Vorher/.test(document.querySelector('#meldung').textContent)));
  await gesetzt();
  ok('C02', 'Geänderter Teller steht in der Karte', await eintragHat('Sauerteig', 'Nussbutter'));
  await zeile('Ticket').locator('.r__t').dblclick({ position: { x: 14, y: 10 } }); await warte(400);
  const pf0 = await feld('Preis');
  ok('C02', 'Ticketpreis: Felder Angabe, Preis, Währung', !!pf0 && !!(await feld('Angabe')) && !!(await feld('Währung')));
  await pf0.fill('85'); await p.click('#f-ok'); await quit(/gespeichert/); await gesetzt();
  ok('C03', 'Preis in der Schreibweise der Karte: «85» wird «85,00»', await eintragHat('Ticket', '85,00'));
  ok('R08', 'Leiste: «Entwurf: n Änderungen», Marke «Entwurf»', /Entwurf: \d+ Änderung/.test(await p.textContent('#leiste')) && !!(await p.$('#leiste .wo-marke')));
  ok('R09', 'Speichern-Knopf grün «Gespeichert» nach dem Speichern', /Gespeichert/.test(await p.textContent('#leiste [data-akt="speichern"]')) && !!(await p.$('#leiste .wo-kn--fertig')));
  ok('C01', 'Kachel trägt die Marke «Entwurf»', /Entwurf/.test(await p.textContent(`.kw[data-z="${ES}"]`)));
  await p.reload({ waitUntil: 'load' }); await gesetzt();
  ok('C09', 'Neu laden: der Entwurf ist noch da', await eintragHat('Sauerteig', 'Nussbutter') && await eintragHat('Ticket', '85,00') && /Entwurf/.test(await p.textContent('#leiste')));
  await zeile('Ticket').locator('.r__t').dblclick({ position: { x: 14, y: 10 } }); await warte(400);
  await (await feld('Preis')).fill('86,5'); await p.click('#f-ok'); await quit(/gespeichert/); await gesetzt();
  ok('C03', '«86,5» wird «86,50»', await eintragHat('Ticket', '86,50'));
  await p.click('#meldung .quit:last-child button:text("Rückgängig")'); await warte(400); await gesetzt();
  ok('R11', '«Rückgängig» in der Quittung holt den Stand davor (85,00)', await eintragHat('Ticket', '85,00') && !(await eintragHat('Ticket', '86,50')));
  await zeile('Ticket').locator('.r__t').dblclick({ position: { x: 14, y: 10 } }); await warte(400); await p.click('#f-ok');
  ok('R10', '«Nichts geändert, nichts gespeichert.»', await quit(/Nichts geändert/));
  // Neuer Gang über das Startbild (keine Rubrik auf dieser Karte: Kopie des letzten Gangs)
  await p.click('#kopf [data-akt="neu"]'); await warte(500);
  ok('C02', '«Neuer Eintrag»: Fenster «Neuer Eintrag» als Kopie eines Gangs (nicht des Preises)', /Neuer/.test(await p.textContent('#fenster h2')) && !!(await feld('Gang')) && !!(await feld('Teller')));
  await fF('Teller', ''); await fF('Drink', ''); await p.click('#f-ok'); await warte(300);
  ok('C02', 'Ohne Teller und Drink: «Bitte einen Teller oder einen Drink eintragen.»', /Teller oder einen Drink/.test(await p.textContent('#f-fehler')));
  await fF('Gang', 'Zwischengang'); await fF('Teller', 'Probe / Rote Bete / Meerrettich'); await fF('Drink', 'Probe-Drink | Gin | Rhabarber');
  await p.click('#f-ok'); await quit(/auf der Karte/); await gesetzt();
  ok('C02', 'Neuer Gang steht in der Karte mit Drink', await eintragHat('Probe / Rote Bete', 'Probe-Drink'));
  ok('C02', 'Neuer Teller steht in Versalien wie die Nachbarn', await rahmen().evaluate(() => { const h = [...document.querySelectorAll('.sb-m')].find(x => /Probe \/ Rote Bete/i.test(x.textContent)); return !!h && getComputedStyle(h.querySelector('.sb-n')).textTransform === 'uppercase'; }));
  ok('C09', 'Marke «Neu» an der Zeile', /Neu/.test(await zeile('Probe / Rote Bete').textContent()));
  const nAlt = await p.$$eval('#liste .r', e => e.length);
  await knopf(zeile('Probe / Rote Bete'), 'kopie'); await warte(300);
  ok('C02', 'Kopieren öffnet die Kopie als neuen Gang', /Neuer/.test(await p.textContent('#fenster h2')));
  await p.click('#fenster [data-zu].kn'); await warte(400);
  ok('C02', 'Abbrechen nimmt die Kopie wieder weg', (await p.$$eval('#liste .r', e => e.length)) === nAlt);
  await knopf(zeile('Probe / Rote Bete'), 'aus'); await quit(/Ausgeblendet/); await gesetzt();
  ok('C02', 'Ausblenden: Marke «Ausgeblendet», nicht mehr in der Karte', /Ausgeblendet/.test(await zeile('Probe / Rote Bete').textContent()) && !(await imRahmen('Probe / Rote Bete')));
  await knopf(zeile('Probe / Rote Bete'), 'aus'); await quit(/Wieder auf der Karte/); await gesetzt();
  ok('C02', 'Wieder zeigen', await imRahmen('Probe / Rote Bete'));
  const reihe = async () => p.$$eval('#liste .r', e => e.map(x => x.querySelector('.r__t b').textContent));
  const i0 = (await reihe()).findIndex(x => /Probe \/ Rote Bete/.test(x));
  await knopf(zeile('Probe / Rote Bete'), 'hoch'); await quit(/Reihenfolge/); await gesetzt();
  const i1 = (await reihe()).findIndex(x => /Probe \/ Rote Bete/.test(x));
  ok('C02', 'Nach oben verschieben', i1 === i0 - 1, `${i0} → ${i1}`);
  await knopf(zeile('Probe / Rote Bete'), 'runter'); await quit(/Reihenfolge/); await gesetzt();
  ok('C02', 'Nach unten verschieben', (await reihe()).findIndex(x => /Probe \/ Rote Bete/.test(x)) === i0);
  // Seite: jede Menükarte hat genau eine Seite; die letzte Seite lässt sich nicht ausblenden
  await (await p.$('#liste .teil[data-teil="0"] [data-akt="s-aus"]')).click(); await warte(1200); await gesetzt();
  ok('C02', 'Seite ausblenden: die einzige Seite bleibt («Auf der Karte steht keine Seite mehr», nichts gespeichert); Seiten verschieben betrifft nicht (je Karte eine Seite)', /keine Seite mehr/.test(await p.textContent('#meldung')) && (await rahmen().$$eval('.blatt', e => e.length)) === 1);
  await p.click('#leiste [data-akt="speichern"]').catch(() => {}); await warte(300);
  if (/Speichern/.test(await p.textContent('#leiste [data-akt="speichern"]'))) { await p.reload({ waitUntil: 'load' }); await gesetzt(); }
  // Rubrik «Upgrade nach Wahl» (erstes Wochenende 2023): Eintrag an der Rubrik, Rubrik verschieben, neue Rubrik, entfernen
  await karte(EU);
  await knopf(zeile('Upgrade nach Wahl'), 'neu-hier'); await warte(400);
  ok('C02', '«Eintrag hinzufügen» an der Rubrik «Upgrade nach Wahl»: Fenster «Neuer Eintrag»', /Neuer/.test(await p.textContent('#fenster h2')));
  await (await p.$('#fenster .felder .feld input, #fenster .felder .feld textarea')).fill('Prüfgericht vom Grill'); await p.click('#f-ok'); await quit(/auf der Karte/); await gesetzt();
  ok('C02', 'Neuer Eintrag unter dem Upgrade steht in der Karte', await imRahmen('Prüfgericht vom Grill'));
  await knopf(zeile('Upgrade nach Wahl'), 'hoch'); await warte(400);
  ok('C02', 'Rubrik verschieben: «Diese Rubrik steht schon zuoberst» (einzige Rubrik)', /zuoberst/.test(await p.textContent('#meldung')));
  await (await p.$('#liste .teil[data-teil="0"] [data-akt="rubrik-neu"]')).scrollIntoViewIfNeeded(); await (await p.$('#liste .teil[data-teil="0"] [data-akt="rubrik-neu"]')).click(); await warte(400);
  await (await p.$('#fenster .felder .feld input, #fenster .felder .feld textarea')).fill('Prüfrubrik'); await p.click('#f-ok'); await quit(/auf der Karte/); await gesetzt();
  ok('C02', 'Neue Rubrik steht in der Karte', await imRahmen('Prüfrubrik'));
  await knopf(zeile('Prüfrubrik'), 'weg'); await warte(300);
  ok('C02', 'Entfernen fragt nach', /entfernen|nehmen/.test(await p.textContent('#fenster h2')));
  await p.click('#ja'); await quit(/entfernt|genommen/); await gesetzt();
  ok('C02', 'Entfernen nimmt die Rubrik weg', !(await imRahmen('Prüfrubrik')));
  await api('verwerfen', { z: EU });
  await karte(ES);
  // Vorher / nachher
  await p.click('#leiste [data-akt="vgl"]'); await warte(400);
  const vgl = await p.textContent('#fenster');
  ok('C09', 'Vorher / nachher: Neu und Geändert', /Neu/.test(vgl) && /Geändert/.test(vgl) && /probe \/ rote bete/i.test(vgl), (vgl.match(/\d+ Stellen?/) || [''])[0]);
  await bild('02-vergleich');
  await zu();
  await p.click('#leiste [data-akt="probe"]');
  ok('C10', 'Probe-PDF gedruckt, Quittung mit «Probe öffnen»', await quit(/Probe-PDF fertig/, 120000));
  const prL = await p.$eval('#meldung a', a => a.getAttribute('href')).catch(() => '');
  const prR = await fetch(new URL(prL, BASIS)); const prB = Buffer.from(await prR.arrayBuffer());
  fs.writeFileSync(path.join(BELEG, 'probe.pdf'), prB);
  const prT = cp.execFileSync('pdftotext', [path.join(BELEG, 'probe.pdf'), '-']).toString();
  ok('C10', 'Probe-PDF enthält den Entwurf (Nussbutter, Rote Bete, 85,00)', prR.headers.get('content-type') === 'application/pdf' && /NUSSBUTTER/.test(prT) && /ROTE BETE/.test(prT) && /85,00/.test(prT));
  await p.click('#leiste [data-akt="veroeffentlichen"]'); await warte(400);
  ok('R12', 'Veröffentlichen öffnet zuerst «Vorher und nachher»', /Vorher/.test(await p.textContent('#fenster h2')));
  await p.click('#v-ok'); await warte(500);
  ok('R12', 'Fortschritt mit Schritten', (await p.$$('#l-s li')).length === 4);
  await p.waitForFunction(() => /Veröffentlicht|Nicht veröffentlicht/.test(document.querySelector('#fenster')?.textContent + document.querySelector('#meldung')?.textContent), null, { timeout: 180000 });
  ok('C11', 'Veröffentlicht: «Die neue Fassung steht», Wörter geprüft', /Die neue Fassung steht/.test(await p.textContent('#fenster')) && /Wörter geprüft/.test(await p.textContent('#fenster')), (await p.textContent('#fenster .satz').catch(() => '')).slice(0, 90) || (await p.textContent('#meldung')).slice(0, 160));
  await bild('03-veroeffentlicht');
  await zu();
  const live = await fetch(BASIS + `/culinarium-demo/_werkzeuge/carte/api/pdf?z=${ES}&q=live`); fs.writeFileSync(path.join(BELEG, 'live.pdf'), Buffer.from(await live.arrayBuffer()));
  ok('C11', 'Veröffentlichte PDF = Daten (Nussbutter, Rote Bete)', /NUSSBUTTER/.test(cp.execFileSync('pdftotext', [path.join(BELEG, 'live.pdf'), '-']).toString()));
  const kj = JSON.parse(fs.readFileSync(path.join(TMP, 'anschluss', 'karten.json'), 'utf8'));
  ok('C27', 'Nach dem Veröffentlichen: karten.json in der Form der Website (Abend DFqbLG2s_dc mit dem neuen Gang); die Website selbst bleibt unberührt', kj.abende.DFqbLG2s_dc.gaenge.some(g => /Rote Bete/.test(g[1])) && kj.abende.DFqbLG2s_dc.preis === '85,00 EUR');
  ok('R08', 'Leiste danach: «Alles veröffentlicht»', /Alles veröffentlicht/.test(await p.textContent('#leiste')));
  ok('R12', 'Ohne Entwurf steht kein Knopf «Veröffentlichen» und keiner «Vorher, nachher»', !(await p.$('#leiste [data-akt="veroeffentlichen"]')) && !(await p.$('#leiste [data-akt="vgl"]')));
  if (!HANDY) await p.click('#rand [data-akt="verlauf"]'); else { await p.click('.wo-kopf__ber'); await warte(250); await p.click('#rand [data-akt="verlauf"]'); }
  await warte(600);
  const vl = await p.textContent('#fenster');
  ok('C12', 'Frühere Fassungen: «Ursprünglicher Stand» und die eben veröffentlichte Fassung', /Ursprünglicher Stand/.test(vl) && /Veröffentlicht/.test(vl));
  await p.click('#fenster [data-d="grundstand"]'); await quit(/Fassung im Entwurf/); await gesetzt();
  ok('C12', '«In den Entwurf holen»: Entwurf ohne Rote Bete, PDF bleibt', !(await imRahmen('Probe / Rote Bete')) && /Entwurf/.test(await p.textContent('#leiste')));
  await p.click('#leiste [data-akt="verwerfen"]'); await warte(300); await p.click('#ja'); await quit(/verworfen/); await gesetzt();
  ok('C09', 'Entwurf verwerfen: wieder wie veröffentlicht', await imRahmen('Probe / Rote Bete'));
  const vl2 = (await api(`verlauf?z=${ES}`)).j.liste || [];
  ok('C09', 'Der verworfene Entwurf bleibt im Verlauf', vl2.some(x => x.art === 'verworfen'));

  // ---------------------------------------------------------------- C Fortgeschritten (C05, C06)
  if (HANDY) { await p.click('.wo-kopf__ber'); await warte(250); }
  await p.click('.modus [data-m="frei"]'); await gesetzt();
  const rf = rahmen();
  const el0 = await rf.$('[data-n] k-t:text-is("Vodka | Cacao | Matcha | Mango")');
  const n0 = await el0.evaluate(e => e.closest('[data-n]').dataset.n);
  const box0 = await mitte(el0);
  await p.mouse.click(box0.x + box0.width / 2, box0.y + box0.height / 2); await warte(400);
  ok('C05', 'Klick wählt ein Element (Rahmen mit Griffen)', await rf.evaluate(() => !document.getElementById('anr').hidden && document.querySelectorAll('#anr .anr__g').length === 6));
  ok('C05', 'Seitenleiste «Gestalten» geht auf', HANDY || await p.evaluate(() => !document.getElementById('gst').hidden && /Gestalten/.test(document.getElementById('gst').textContent)));
  ok('C05', 'Gestalten: Schriften und Farben des Hauses, Textart nur normal oder Versalien (nie fett, nie kursiv)', HANDY || await p.evaluate(() => { const t = document.getElementById('gst').textContent; return /Fraunces/.test(t) && /Urbanist/.test(t) && !/Kursiv|Medium/.test(t) && !!document.querySelector('#gst [data-feld="c"][data-wert="kerze"]'); }));
  const boxZ = await mitte(await rf.$(`[data-n="${n0}"] k-t`));
  await p.mouse.move(boxZ.x + boxZ.width / 2, boxZ.y + boxZ.height / 2); await p.mouse.down(); await p.mouse.move(boxZ.x + boxZ.width / 2 + 30, boxZ.y + boxZ.height / 2 + 20, { steps: 8 });
  const mass = await rf.evaluate(() => document.querySelector('.anr__m').textContent);
  await p.mouse.up(); await warte(400);
  ok('C05', 'Ziehen zeigt das Mass «+x · +y mm» und verschiebt', /mm/.test(mass) && await rf.evaluate((n) => /translate/.test(document.querySelector(`[data-n="${n}"]`).style.transform), n0), mass);
  ok('R08', 'Nach dem Ziehen: Eingaben warten gelb («Speichern»)', /Speichern/.test(await p.textContent('#leiste [data-akt="speichern"]')) && await p.$('#leiste .wo-kn--wartet'));
  await p.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z'); await warte(500);
  ok('C05', '⌘Z nimmt das Ziehen zurück', await rf.evaluate((n) => !(document.querySelector(`[data-n="${n}"]`).style.transform || '').includes('translate'), n0));
  await p.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+z' : 'Control+Shift+z'); await warte(500);
  ok('C05', '⌘⇧Z wiederholt', await rf.evaluate((n) => /translate/.test(document.querySelector(`[data-n="${n}"]`).style.transform || ''), n0));
  await p.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z'); await warte(500);
  await rf.evaluate(() => document.body.focus());
  const vorP = await rf.evaluate((n) => document.querySelector(`[data-n="${n}"]`).style.transform, n0);
  const bxP = await mitte(await rf.$(`[data-n="${n0}"] k-t`));
  await p.mouse.click(bxP.x + bxP.width / 2, bxP.y + bxP.height / 2); await warte(300);
  await p.keyboard.press('ArrowRight'); await warte(500);
  const nachP = await rf.evaluate((n) => document.querySelector(`[data-n="${n}"]`).style.transform, n0);
  ok('C05', 'Pfeiltaste schiebt 0,5 mm', vorP !== nachP, `${vorP} → ${nachP}`);
  if (!HANDY) {
    await p.click('#gst [data-feld="f"][data-wert="mono"]'); await warte(700);
    ok('C05', 'Gestalten: Schriftart DM Mono', await rf.evaluate((n) => document.querySelector(`[data-n="${n}"]`).hasAttribute('data-gf'), n0));
    await p.click('#gst [data-schritt="pt"][data-r="1"]'); await warte(700);
    ok('C05', 'Gestalten: Schriftgrösse +', await rf.evaluate((n) => document.querySelector(`[data-n="${n}"]`).hasAttribute('data-gt'), n0));
    await p.click('#gst [data-feld="c"][data-wert="kerze"]'); await warte(700);
    ok('C05', 'Gestalten: Farbe Kerze', await rf.evaluate((n) => document.querySelector(`[data-n="${n}"]`).hasAttribute('data-gc'), n0));
    await p.click('#gst [data-feld="c"][data-wert="kerze"]'); await warte(700);
    ok('C05', 'Zweiter Klick auf denselben Wert schaltet ihn ab', await rf.evaluate((n) => !document.querySelector(`[data-n="${n}"]`).hasAttribute('data-gc'), n0));
    await p.click('#gst [data-tu="vorlage"]'); await warte(700);
    ok('C05', '«Teil zurücksetzen»: wie in der Vorlage', await rf.evaluate((n) => { const e = document.querySelector(`[data-n="${n}"]`); return !e.hasAttribute('data-gf') && !/translate/.test(e.style.transform || ''); }, n0));
  }
  if (HANDY) {
    if (await p.$('#gst:not([hidden]) [data-tu="zu"]')) { await p.click('#gst [data-tu="zu"]'); await warte(300); }
    for (let i = 0; i < 5; i++) { await p.locator('[data-zoom="1"]').scrollIntoViewIfNeeded(); await p.click('[data-zoom="1"]'); await warte(250); } await warte(600);
  }
  if (!(await rf.$('.anr-zu'))) {
    const bt = await mitte(await rf.$(`[data-n="${n0}"] k-t`)); await p.mouse.click(bt.x + 3, bt.y + bt.height / 2); await warte(400);
    for (let i = 0; i < 4; i++) { await p.keyboard.press('ArrowDown'); await warte(150); } await warte(500);
  }
  const zr = await rf.$('.anr-zu'); if (zr) { await zr.evaluate(e => e.scrollIntoView({ block: 'center' })); await zr.click(); await warte(900); }
  ok('C05', '«Anordnung zurücksetzen» stellt die Seite wie gesetzt', !!zr && await rf.evaluate((n) => !/translate/.test((document.querySelector(`[data-n="${n}"]`) || {}).style?.transform || ''), n0));
  const zielen = async () => { const k = await rf.$('k-t:text("Gin | Turmeric")'); await mitte(k); await k.evaluate(e => e.scrollIntoView({ block: 'nearest', inline: 'center' })); await warte(250);
    const r = await k.evaluate(e => { const q = e.getClientRects()[0], x = q.x + q.width - 3, y = q.y + q.height / 2, t = document.elementFromPoint(x, y); return { x, y, treffer: !!t && e.contains(t) }; });
    const fb = await (await p.$('#vf')).boundingBox(); return { x: fb.x + r.x, y: fb.y + r.y, treffer: r.treffer }; };
  let bb = await zielen();
  await p.mouse.click(bb.x, bb.y); await warte(900); bb = await zielen();
  await p.mouse.dblclick(bb.x, bb.y); await warte(400);
  await rf.evaluate(() => { const a = document.activeElement; if (!a || !a.isContentEditable) return; const r = document.createRange(); r.selectNodeContents(a); r.collapse(false); const g = getSelection(); g.removeAllRanges(); g.addRange(r); });
  await p.keyboard.type(' Probe');
  await p.keyboard.press('Enter'); await warte(500);
  if (!ok('C05', 'Doppelklick schreibt direkt in die Karte', /Ingwer\s+Probe/.test(await rf.evaluate(() => document.getElementById('seiten').textContent)), await rf.evaluate(() => { const t = document.getElementById('seiten').textContent, i = t.indexOf('Gin |'); return t.slice(i, i + 60); }))) await bild('fehler-c05');
  await p.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
  ok('R09', '⌘S speichert (auch aus der Vorschau)', await quit(/Im Entwurf gespeichert|gespeichert/));
  await gesetzt();
  if (await p.$('#gst:not([hidden]) [data-tu="zu"]')) { await p.click('#gst [data-tu="zu"]'); await warte(300); }
  await p.locator('#kopf [data-akt="daten"]').scrollIntoViewIfNeeded(); await p.click('#kopf [data-akt="daten"]'); await warte(400);
  await p.fill('#j-t', '{ kaputt'); await p.click('#j-ok'); await warte(200);
  ok('C06', 'Daten als Text: Ungültiges wird abgewiesen', /kein gültiges Format/.test(await p.textContent('#j-f')));
  const j = JSON.parse(await p.evaluate(() => document.getElementById('j-t').defaultValue));
  ok('C06', 'Daten als Text enthalten die Seite der Karte', Array.isArray(j) && j.length === 1);
  await zu();
  const bst = (await api(`karte?z=${ES}`)).j.stand;
  const sch = await api('entwurf', { z: ES, daten: { ...bst, seiten: [{ fn: 'seite', a: [bst.seiten[0].a[0], { fn: 'el', a: ['p', ' class="x" data-y="1"', 'x'] }] }] }, was: 'Probe' });
  ok('C06', 'Server weist fremdes HTML ab (neues Merkmal)', sch.s === 400 && sch.j.stichwort === 'PRUEF', sch.j.fehler);
  await bild('04-fortgeschritten');
  if (HANDY) { await p.click('.wo-kopf__ber'); await warte(250); }
  await p.click('.modus [data-m="einfach"]'); await gesetzt();

  // ---------------------------------------------------------------- D Ansicht Website (C07): Alle Abende mit dem Abend dieser Karte, Der Abend, Startseite
  await p.click('.ansicht [data-ansicht="website"]'); await warte(3000);
  const webOrt = () => p.evaluate(() => { try { return document.getElementById('web-f').contentWindow.location.pathname; } catch (e) { return ''; } });
  ok('C07', 'Ansicht Website: «Alle Abende» (abende.html), das Fenster dieses Abends ist offen (Menükarte vom Februar 2025)', /abende\.html/.test(await webOrt()) && await p.evaluate(() => { const d = document.getElementById('web-f').contentDocument; const a = d.querySelector('#ad-DFqbLG2s_dc'); return !!a && !a.hidden && /Sauerteig/.test(a.textContent); }) && /Alle Abende/.test(await p.textContent('#v-zahl')), await p.textContent('#v-zahl'));
  await bild('05-website');
  await p.click('#webwahl [data-webseite="abend.html"]'); await warte(2500);
  ok('C07', 'Ansicht Website: «Der Abend» (abend.html)', /abend\.html/.test(await webOrt()) && /Der Abend/.test(await p.textContent('#v-zahl')), await p.textContent('#v-zahl'));
  await p.click('#webwahl [data-webseite="index.html"]'); await warte(2500);
  ok('C07', 'Ansicht Website: «Startseite» (index.html)', /index\.html/.test(await webOrt()) && /Startseite/.test(await p.textContent('#v-zahl')), await p.textContent('#v-zahl'));
  await p.click('#webwahl [data-webseite="abende.html"]'); await warte(800);
  await p.click('.ansicht [data-ansicht="karte"]'); await gesetzt();
  ok('C07', 'Zurück zur Karte', !(await p.$eval('#vf', f => f.hidden)) && await p.$eval('#webwahl', e => e.hidden));
  await karte(EU); await p.click('.ansicht [data-ansicht="website"]'); await warte(3000);
  ok('C07', 'Kartenwechsel: die Ansicht Website öffnet den Abend der neuen Karte (erstes Wochenende 2023)', await p.evaluate(() => { const d = document.getElementById('web-f').contentDocument; const a = d.querySelector('#ad-CxNkFWTIvL2'); return !!a && !a.hidden; }));
  await p.click('.ansicht [data-ansicht="karte"]'); await gesetzt();

  // ---------------------------------------------------------------- E Der nächste Abend (C08/C24 in der Form des Hauses): Gänge mit Rudis Teller und Momos Drink
  await karte('abend');
  const mw = (f) => p.$(`#liste [data-mw="${f}"]`);
  ok('C08', 'Der nächste Abend: Datum mit Pfeilen (kein Kalender des Systems), sechs Gänge mit Teller und Drink, als Beispiel wörtlich die Karte vom Februar 2025', !!(await p.$('#liste [data-akt="abend"][data-r="1"]')) && !(await p.$('#liste input[type="date"]')) && (await p.$$('#liste .mw-gang')).length === 6 && (await (await mw('tage.0.aperitif')).inputValue()) === 'Sauerteig | Tomate | Butter' && (await (await mw('tage.0.vorspeise_z')).inputValue()) === 'Vodka | Tom Yam | Guava | Cocos | Acids | Soda' && (await (await mw('preis')).inputValue()) === '79,00 EUR' && /Beispiel/.test(await p.textContent('#kopf')), JSON.stringify(await p.evaluate(() => ['tage.0.aperitif', 'preis'].map(k => (document.querySelector(`#liste [data-mw="${k}"]`) || {}).value))));
  ok('C08', 'Blatt A4 hoch: Wortmarke, Titel, Datum «Fr 21. und Sa 22. Februar 2025», Strich zwischen den Gängen, Ticketpreis als Marke', await rahmen().evaluate(() => { const b = document.querySelector('.blatt'); return !!b && b.offsetHeight > b.offsetWidth && !!b.querySelector('.sb-oben svg') && /Fr 21\. und Sa 22\. Februar 2025/.test(b.querySelector('.sb-datum').textContent) && b.querySelectorAll('.sb-gang').length === 4 && !!b.querySelector('.sb-lunchpreis'); }));
  ok('C08', 'Karte schön und mittig: Menü in der Mitte des Blatts (± 3 %), jede Zeile mittig (± 2 %), unten kein leerer Teil (unter 18 %)', await rahmen().evaluate(() => { const b = document.querySelector('.blatt').getBoundingClientRect(), m = document.querySelector('.sb-quer'), r = m.getBoundingClientRect(); const mz = r.left + r.width / 2; const letzte = [...m.querySelectorAll('.sb-n, .sb-dr, .sb-band, .sb-lunchpreis')].pop().getBoundingClientRect(); return Math.abs(mz - (b.left + b.width / 2)) <= 0.03 * b.width && [...m.querySelectorAll('.sb-n, .sb-dr, .sb-band, .sb-gn')].every(x => { const q = x.getBoundingClientRect(); return Math.abs(q.left + q.width / 2 - mz) <= 0.02 * b.width; }) && (b.bottom - letzte.bottom) / b.height < 0.18; }));
  const vs = await mw('tage.0.vorspeise'); await vs.fill('Lauch | Blumenkohl | Chipotle'); await (await mw('tage.0.vorspeise_z')).focus(); await warte(900);
  ok('C08', 'Eintrag geht sofort in die Karte rechts (Rudis Zeile mit Schrägstrich) und wird beim Verlassen des Feldes gespeichert; das Beispiel ist weg', await imRahmen('Lauch / Blumenkohl / Chipotle') && /Entwurf/.test(await p.textContent('#leiste')) && !(await p.$('#kopf .kopf__bsp')));
  await p.click('#liste [data-akt="abend"][data-r="1"]'); await quit(/Datum geändert/); await gesetzt();
  ok('C08', 'Pfeil: eine Woche später (Fr 28. Februar und Sa 1. März 2025), Teller bleiben', /Lauch \| Blumenkohl/.test(await (await mw('tage.0.vorspeise')).inputValue()) && await imRahmen('Fr 28. Februar und Sa 1. März 2025'));
  await p.click('#kopf [data-akt="abend-neu"]'); await warte(300); await p.click('#ja'); await quit(/Nächster Abend angelegt/); await gesetzt();
  ok('C08', '«Nächsten Abend anlegen»: Teller und Drinks leer, Zeile und Preis bleiben, Datum ein Freitag nach heute', (await (await mw('tage.0.vorspeise')).inputValue()) === '' && (await (await mw('preis')).inputValue()) === '79,00 EUR' && (await (await mw('mit')).inputValue()) === 'BY MOMO X RUDI' && await rahmen().evaluate(() => /^Fr /.test(document.querySelector('.sb-datum').textContent)));
  await p.click('#liste [data-akt="tagzu"]'); await quit(/Gänge folgen noch/); await gesetzt();
  ok('C08', 'Gänge stehen noch nicht fest: Satz auf der Karte', await imRahmen('Die Gänge dieses Abends folgen.'));
  await p.click('#liste [data-akt="tagzu"]'); await quit(/wieder auf der Karte/); await gesetzt();
  const pr0 = await mw('preis'); await pr0.fill('89'); await pr0.evaluate(e => e.blur()); await warte(700);
  ok('C03', 'Ticketpreis «89» wird «89,00 EUR» (Schreibweise der Plakate)', (await (await mw('preis')).inputValue()) === '89,00 EUR' && await imRahmen('89,00'));
  for (const [f, v] of [['tage.0.aperitif', 'Sauerteig | Kürbis | Butter'], ['tage.0.aperitif_z', 'Cognac | Kürbiskern | Champagner'], ['tage.0.haupt', 'Hokkaido | Kürbiskernöl | Haselnuss'], ['tage.0.dessert_z', 'Vodka | Cacao | Mango']]) { const t = await mw(f); await t.fill(v); await t.evaluate(e => e.blur()); await warte(500); }
  await warte(1500);
  const kv = await api('veroeffentlichen', { z: 'abend', notiz: 'Probe' }, 'kueche');
  ok('C08', 'Die Küche veröffentlicht die Karte des nächsten Abends selbst', kv.s === 200, kv.j.fehler || '');
  for (let i = 0; i < 120; i++) { const b = (await api('status')).j.bau; if (!b.laeuft) break; await warte(500); }
  const ml = await fetch(BASIS + '/culinarium-demo/_werkzeuge/carte/api/pdf?z=abend&q=live'); fs.writeFileSync(path.join(BELEG, 'abend.pdf'), Buffer.from(await ml.arrayBuffer()));
  const mlT = ml.status === 200 ? cp.execFileSync('pdftotext', [path.join(BELEG, 'abend.pdf'), '-']).toString().replace(/\s+/g, ' ') : '';   // Zeilenumbrüche im Teller zählen als Leerzeichen
  ok('C08', 'Veröffentlichte PDF des nächsten Abends = Daten (HOKKAIDO / KÜRBISKERNÖL / HASELNUSS, 89,00; bricht die Zeile an einem Trenner, entfällt er), eine Seite', /HOKKAIDO( \/ |\s+)KÜRBISKERNÖL( \/ |\s+)HASELNUSS/.test(mlT) && /89,00/.test(mlT) && /Cognac( \| |\s+)Kürbiskern/.test(mlT), mlT.slice(0, 80).replace(/\s+/g, ' '));
  const kj2 = JSON.parse(fs.readFileSync(path.join(TMP, 'anschluss', 'karten.json'), 'utf8'));
  ok('C27', 'karten.json trägt den nächsten Abend (Datum, Gänge, Preis)', kj2.naechster && kj2.naechster.preis === '89,00 EUR' && kj2.naechster.gaenge.some(g => /Hokkaido/.test(g[1])) && !kj2.naechster.beispiel);
  await karte(ES);

  // ---------------------------------------------------------------- F Rollen und Sicherheit (5.2)
  const gk = (await api(`karte?z=${ES}`)).j.stand;
  ok('S01', 'Ohne Rolle: 403 ROLLE', (await api('entwurf', { z: ES, daten: gk, was: 'x' }, '')).s === 403);
  ok('S01', 'Unbekannte Rolle (Spa gibt es im Culinarium nicht, C19 betrifft nicht): 403 ROLLE', (await api('probe', { z: ES }, 'spa')).j.stichwort === 'ROLLE');
  ok('S01', 'Küche druckt eine Probe der Karte', (await api('probe', { z: ES }, 'kueche')).s === 200);
  ok('S01', 'Küche veröffentlicht frühere Abende nicht: 403', (await api('veroeffentlichen', { z: ES }, 'kueche')).j.stichwort === 'RECHT');
  ok('S01', 'Service veröffentlicht nicht: 403', (await api('veroeffentlichen', { z: ES }, 'service')).s === 403);
  ok('S01', 'Zurückholen nur Direktion', (await api('zurueckholen', { z: ES, datei: 'grundstand' }, 'service')).s === 403);
  ok('S01', 'Anschluss an die Website nur Direktion', (await api('einstellungen', { anschluss_pdf: true }, 'service')).s === 403);
  ok('S01', 'Demo-Sperre: Anschluss einschalten wird abgewiesen (DEMO), die Website bleibt', (await api('einstellungen', { anschluss_pdf: true })).j.stichwort === 'DEMO');
  ok('S01', 'Daten mit falscher Art (Abend für eine Satz-Karte): 400 PRUEF', (await api('entwurf', { z: ES, daten: { ziel: ES, art: 'abend', abend: { ab: '2026-10-12', tage: [{}] } }, was: 'x' })).j.stichwort === 'PRUEF');
  ok('S02', 'Fremde Herkunft: 403 HERKUNFT', (await api('entwurf', { z: ES, daten: gk }, 'direktion', { Origin: 'https://boese.example' })).j.stichwort === 'HERKUNFT');
  ok('S02', 'Nur JSON: 415', (await fetch(BASIS + '/culinarium-demo/_werkzeuge/carte/api/entwurf', { method: 'POST', headers: { 'Content-Type': 'text/plain', Origin: BASIS }, body: 'x' })).status === 415);
  ok('S02', 'Über 3 MB: 413', await new Promise(r => { const q = require('http').request({ host: '127.0.0.1', port: PORT, path: '/culinarium-demo/_werkzeuge/carte/api/entwurf', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': 3100000, Origin: BASIS, 'X-Carte-Rolle': 'direktion' } }, res => r(res.statusCode === 413)); q.on('error', () => r(false)); q.write('{}'); }));
  ok('S02', 'Falscher Host: 421', await new Promise(r => { require('http').get({ host: '127.0.0.1', port: PORT, path: '/culinarium-demo/_werkzeuge/carte/api/status', headers: { Host: 'boese.example' } }, res => r(res.statusCode === 421)).on('error', () => r(false)); }));
  ok('S02', 'Gesperrte Pfade (_daten, .py) nicht ausgeliefert', (await fetch(BASIS + '/culinarium-demo/_werkzeuge/carte/_daten/stand/abend.json')).status === 404 && (await fetch(BASIS + '/culinarium-demo/_werkzeuge/carte/carte.py')).status === 404 && (await fetch(BASIS + '/bau.py')).status === 404 && (await fetch(BASIS + '/abende_info.py')).status === 404);
  const csp = (await fetch(BASIS + '/culinarium-demo/_werkzeuge/carte/')).headers.get('content-security-policy') || '';
  ok('S02', 'Sicherheitskopfzeilen (CSP, frame-ancestors)', /default-src 'self'/.test(csp) && /frame-ancestors 'self'/.test(csp));
  const sk = { ...gk, seiten: JSON.parse(JSON.stringify(gk.seiten)) };
  sk.seiten[0].a.push('<script>alert(1)</script>');
  ok('S02', 'Programmcode im Text: 400 PRUEF', (await api('entwurf', { z: ES, daten: sk, was: 'x' })).j.stichwort === 'PRUEF');
  let g429 = 0; for (let i = 0; i < 70; i++) { const r = await api('entwurf', { z: ES, daten: gk, was: 'x' }); if (r.s === 429) { g429 = i; break; } }
  ok('S02', 'Zu viele Änderungen in einer Minute: 429 GRENZE', g429 > 0, `nach ${g429} Anfragen`);

  // ---------------------------------------------------------------- G Prüfseite, Export, Fehlermelder, Startfehler, Rundgang, Zur Werkbank (C14, C15, R03, R04, R18, R19, R23)
  await warte(61000);   // die Grenze je Minute aus F läuft ab
  const pr = await ctx.newPage(); horch(pr); await pr.bringToFront();
  await pr.goto(BASIS + '/culinarium-demo/_werkzeuge/carte/pruefung.html', { waitUntil: 'load' }); await warte(1500);
  const prt = await pr.textContent('body');
  ok('C14', 'Prüfseite: Browser, Server, Karten (alle Abende), Druck, Sicherungen, Fehler', ['Der nächste Abend', 'Februar 2025', 'Sicherung', 'Druck'].every(x => prt.includes(x)), prt.slice(0, 80).replace(/\s+/g, ' '));
  const [dl] = await Promise.all([pr.waitForEvent('download', { timeout: 15000 }).catch(() => null), pr.click('a[href*="api/export"]').catch(() => null)]);
  let exp = null; if (dl) { const f = path.join(BELEG, 'export.json'); await dl.saveAs(f); exp = JSON.parse(fs.readFileSync(f, 'utf8')); }
  ok('C15', 'Alle Daten herunterladen: jede Karte mit Stand, Ursprung, Verlauf und Protokoll', exp && Object.keys(exp.karten).length === 8 && exp.karten[ES].ursprung && Object.keys(exp.karten[ES].verlauf).length >= 1 && exp.protokoll.length > 3);
  await p.bringToFront(); await p.evaluate(() => setTimeout(() => { throw new Error('Prüffehler Culinarium'); }, 0)); await warte(800);
  const bf = (await api('gesund')).j.browserfehler || [];
  ok('R03', 'Fehlermelder: Skriptfehler kommt im Server an', bf.some(x => /Prüffehler Culinarium/.test(x.text)));
  fehlerKonsole.splice(0, fehlerKonsole.length, ...fehlerKonsole.filter(x => !/Prüffehler Culinarium/.test(x)));
  const st = await ctx.newPage();
  await st.route('**/api/status', r => r.fulfill({ status: 500, contentType: 'application/json', body: '{"fehler":"Probe","stichwort":"SERVER"}' }));
  await st.goto(BASIS + '/culinarium-demo/_werkzeuge/carte/', { waitUntil: 'load' }); await st.waitForFunction(() => /startet nicht/.test(document.body.textContent), null, { timeout: 15000 }).catch(() => {});
  ok('R04', `Startfehler-Tür «${NAMEN.karten} startet nicht.» mit «Prüfung öffnen»`, (await st.textContent('body')).includes(NAMEN.karten + ' startet nicht') && !!(await st.$('a[href*="pruefung.html"]')));
  await st.close(); await p.bringToFront();
  const rg = await br.newContext({ viewport: { width: W, height: H } }); const rp = await rg.newPage();
  await rp.goto(BASIS + '/culinarium-demo/_werkzeuge/carte/?rundgang', { waitUntil: 'load' }); await rp.waitForSelector('.rdg-kegel', { timeout: 12000 }).catch(() => {}); await warte(600);
  ok('R18', 'Rundgang (?rundgang): Lichtkegel und Karte mit Text über die Abende', !!(await rp.$('.rdg-kegel')) && (await rp.textContent('.rdg-karte')).includes(NAMEN.karten) && /Rudis Teller und Momos Drink/.test(await rp.textContent('.rdg-karte')));
  await rg.close();
  await p.bringToFront(); await p.goto(BASIS + '/culinarium-demo/_werkzeuge/carte/?wb=de.werkzeuge#' + ES, { waitUntil: 'load' }); await gesetzt(); await warte(800);
  ok('R19', '«Zur Werkbank» erscheint, wenn aus der Werkbank geöffnet', await p.evaluate(() => !!document.querySelector('#zur-werkbank')));
  { const zw = await p.evaluate(() => { const e = document.querySelector('#zur-werkbank'); const a = e && (e.shadowRoot ? e.shadowRoot.querySelector('a') : (e.querySelector('a') || e)); return a ? a.href : ''; });
    let st2 = 0; try { st2 = (await ctx.request.get(zw.split('#')[0].split('?')[0])).status(); } catch (e) { st2 = 0; }
    ok('R19', `«Zur Werkbank» führt auf die Werkbank des Hauses (${zw} → ${st2})`, /^http:\/\/127\.0\.0\.1:9088\/werkbank\//.test(zw) && st2 === 200); }
  { const hs = await p.evaluate(() => [...new Set([...document.querySelectorAll('#oben a[href], #rand a[href]')].map(a => a.href).filter(h => /^http/.test(h)))]);
    const tot = []; for (const h of hs) { let st3 = 0; try { st3 = (await ctx.request.get(h.split('#')[0])).status(); } catch (e) { st3 = 0; } if (st3 !== 200 && !(/api\/pdf/.test(h) && st3 === 404)) tot.push(h + ' → ' + st3); }
    ok('R05', `Alle ${hs.length} Links in Kopf und Rand antworten (Tresen 9081, Schaufenster 9082, Werkbank 9088, Website 8765, Anleitung, Prüfung, PDF)${tot.length ? ': ' + tot.join(', ') : ''}`, hs.length > 5 && !tot.length); }

  // ---------------------------------------------------------------- H Zwei Fenster, Netz weg, Verlassen (Abschnitt 8)
  const oeffne = async (pg, text) => { await pg.locator('#liste .r', { hasText: text }).first().locator('.r__t').evaluate(e => { e.scrollIntoView({ block: 'center' }); e.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); }); await warte(400); };
  const teller = (pg) => pg.$('#fenster .felder .feld:has(> span:text-is("Teller")) input, #fenster .felder .feld:has(> span:text-is("Teller")) textarea');
  await p.goto('about:blank'); await p.goto(BASIS + '/culinarium-demo/_werkzeuge/carte/#' + ES, { waitUntil: 'load' }); await gesetzt();
  if (await p.$('.modus [data-m="einfach"][aria-pressed="false"]')) { if (HANDY) { await p.click('.wo-kopf__ber'); await warte(250); } await p.click('.modus [data-m="einfach"]'); await gesetzt(); }
  const p2 = await ctx.newPage(); horch(p2);
  await p2.goto(BASIS + '/culinarium-demo/_werkzeuge/carte/#' + ES, { waitUntil: 'load' }); await p2.waitForFunction(() => /Seite/.test(document.querySelector('#v-zahl')?.textContent || ''));
  await p.bringToFront(); await oeffne(p, 'Miso');
  await (await teller(p)).fill('Miso / Sellerie / Röstzwiebeln A'); await p.click('#f-ok'); await quit(/gespeichert/);
  await p2.bringToFront(); await oeffne(p2, 'Spinat');
  await (await teller(p2)).fill('Spinat / braune Butter / Parmesan B'); await p2.click('#f-ok'); await warte(800);
  ok('A08', 'Zwei Fenster: das zweite bekommt KONFLIKT, nichts überschrieben', /KONFLIKT|Inzwischen hat/.test(await p2.textContent('#meldung')) && /Röstzwiebeln A/.test(JSON.stringify((await api(`karte?z=${ES}`)).j.entwurf)) && !/Parmesan B/.test(JSON.stringify((await api(`karte?z=${ES}`)).j.entwurf)));
  await p2.close(); await p.bringToFront();
  await oeffne(p, 'Röstzwiebeln A');
  await (await teller(p)).fill('Miso / Sellerie / Röstzwiebeln C'); OFFLINE = true; await ctx.setOffline(true); await p.click('#f-ok'); await warte(800);
  ok('A08', 'Netz weg beim Speichern: Meldung VERBINDUNG', /VERBINDUNG|Keine Verbindung/.test(await p.textContent('#meldung')));
  await ctx.setOffline(false); await warte(1000); OFFLINE = false;
  await oeffne(p, 'Kaffee');
  await (await teller(p)).fill('Linden'.repeat(834)); await p.click('#f-ok'); await warte(1200);
  ok('A08', '5\'000 Zeichen ohne Leerzeichen: abgewiesen «Der Text ist zu lang», Eingabe bleibt gelb, kein Verrutschen', /zu lang/.test(await p.textContent('#meldung')) && /Speichern/.test(await p.textContent('#leiste [data-akt="speichern"]')) && (await breit()) <= 0 && await p.evaluate(() => { const r = [...document.querySelectorAll('#liste .r')].find(x => /LindenLinden/i.test(x.textContent)); return !!r && r.scrollWidth <= r.clientWidth + 1; }));
  await p.click('#leiste [data-akt="verwerfen"]').catch(() => {}); await warte(300); if (await p.$('#ja')) { await p.click('#ja'); await quit(/verworfen/); } await gesetzt();
  await oeffne(p, 'Kaffee');
  await (await teller(p)).fill('Linden'.repeat(650)); await p.click('#f-ok'); await quit(/gespeichert/); await gesetzt();
  ok('A08', '3\'900 Zeichen ohne Leerzeichen: gespeichert, bricht in der Liste um', /LindenLinden/.test(JSON.stringify((await api(`karte?z=${ES}`)).j.entwurf || {})) && (await breit()) <= 0 && await p.evaluate(() => { const r = [...document.querySelectorAll('#liste .r')].find(x => /LindenLinden/i.test(x.textContent)); return !!r && r.scrollWidth <= r.clientWidth + 1; }));
  await oeffne(p, 'Spinat');
  await (await teller(p)).fill('Gäste ⛵ an der Tafel: «Ä Ö Ü» <script>alert(1)</script>'); await p.click('#f-ok'); await warte(900);
  ok('A08', '<script> im Text: abgewiesen mit Meldung, Eingabe bleibt gelb', /Programmcode|PRUEF/.test(await p.textContent('#meldung')) && /Speichern/.test(await p.textContent('#leiste [data-akt="speichern"]')));
  await oeffne(p, 'Gäste ⛵');
  await (await teller(p)).fill('Gäste ⛵ an der Tafel: «Ä Ö Ü»'); await p.click('#f-ok'); await quit(/gespeichert/); await gesetzt();
  ok('A08', 'Emoji und Umlaute stehen in der Karte', await imRahmen('Gäste ⛵ an der Tafel: «Ä Ö Ü»'));
  if (HANDY) { await p.click('.wo-kopf__ber'); await warte(250); }
  await p.click('.modus [data-m="frei"]'); await gesetzt();
  const kt2 = await rahmen().$('k-t:text("Gäste ⛵")'); await kt2.evaluate(e => e.scrollIntoView({ block: 'center', inline: 'center' })); await warte(200); const b2 = await mitte(kt2);
  await p.mouse.click(Math.min(Math.max(b2.x + 4, 24), W - 24), b2.y + b2.height / 2); await warte(400); for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowDown'); await warte(150); } await warte(400);
  if (!ok('R13', 'Ungespeicherte Verschiebung: Leiste gelb', /Speichern/.test(await p.textContent('#leiste [data-akt="speichern"]')), JSON.stringify(b2))) await bild('fehler-r13');
  let dialog = false; p.once('dialog', d => { dialog = true; d.accept().catch(() => {}); });
  await p.goto('about:blank').catch(() => {}); await warte(500);
  ok('R13', 'Verlassen mit ungespeicherten Eingaben: der Browser fragt', dialog || BROWSER === 'webkit', BROWSER === 'webkit' ? 'Safari-Kern zeigt beforeunload in Playwright nicht (Ereignis gesetzt)' : '');

  // ---------------------------------------------------------------- Abschluss
  const fk = fehlerKonsole.filter(x => !/favicon/.test(x));
  ok('A99', 'Keine Skriptfehler auf allen Seiten', !fk.length, fk.slice(0, 3).join(' | '));
  const fn = fehlerNetz.filter(x => !/api\/(karte|status|webseite|verlauf|gesund)/.test(x));
  ok('A99', 'Keine toten Adressen', !fn.length, fn.slice(0, 4).join(' | '));
  fs.writeFileSync(path.join(BELEG, 'ergebnis.json'), JSON.stringify({ browser: BROWSER, breite: W, hoehe: H, gruen: nr - rot, gesamt: nr, zeilen: ergebnis }, null, 1));
  console.log(`\n${BROWSER} ${W}×${H}: ${nr - rot} von ${nr} grün`);
  await br.close(); srv.kill();
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(rot ? 1 : 0);
})().catch(e => { console.error('ABBRUCH', e); if (srv) srv.kill(); process.exit(2); });
