// Werkbank Culinarium (28.10.2026, Vorlage Schäfli _qa/bedienen.js): jede Bedienstelle einmal drücken und das Ergebnis nachsehen (Chromium und WebKit, 1440 und 390).
//   node website/_werkbank/pruefung/bedienen.js  →  pruefung/bedienen.txt   (headless, mailto/tel abgefangen, nichts wird abgeschickt)
const path = require('path'), fs = require('fs');
const pw = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const B = 'http://127.0.0.1:' + (process.env.WB_PORT || 9088) + '/';
const aus = [];
const ok = (m, w, was, wahr, mehr = '') => { const z = `${m} ${w} ${wahr ? 'OK  ' : 'FEHL'} ${was}${mehr ? ' · ' + mehr : ''}`; aus.push(z); console.log(z); };
async function zu(p, sel) { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'center' }); }, sel); await p.waitForTimeout(1400); }
async function schritt(m, w, was, f) { try { await f(); } catch (e) { ok(m, w, was, false, 'Abbruch: ' + String(e).slice(0, 120)); } }
const an = (p, sel) => p.evaluate(s => [...document.querySelectorAll(s)].findIndex(x => x.classList.contains('an')), sel);
(async () => {
  for (const m of ['chromium', 'webkit']) {
    const b = await pw[m].launch({ headless: true });
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, ...(w < 700 && m === 'chromium' ? { isMobile: true, hasTouch: true } : {}) });
      const p = await ctx.newPage(); p.setDefaultTimeout(60000);
      const fehler = []; p.on('pageerror', e => fehler.push(e.message));
      await p.route(/^(mailto|tel):/, r => r.abort());
      await p.goto(B + 'werkbank/index.html', { waitUntil: 'load' }); await p.waitForTimeout(1500);
      await schritt(m, w, 'Register: Pfeil weiter', async () => {
        await zu(p, '#register [data-rgw]'); const a = await an(p, '#register .wfa__texte>div'); await p.click('#register [data-f="1"]'); await p.waitForTimeout(700);
        const z = await an(p, '#register .wfa__texte>div'); ok(m, w, 'Register: Pfeil weiter', a === 0 && z === 1, `${a}→${z}`); });
      await schritt(m, w, 'Befund: Pfeil weiter', async () => {
        await zu(p, '.sbf-b'); const a = await an(p, '.sbf-p'); await p.click('.sbf-b [data-f="1"]'); await p.waitForTimeout(700);
        const z = await an(p, '.sbf-p'); ok(m, w, 'Befund: Pfeil weiter', a === 0 && z === 1, `${a}→${z}`); });
      await schritt(m, w, 'Ohne Rechnung', async () => {   // Robert 29.10.2026: Abschnitt «Die Rechnung» entfernt
        const n = await p.locator('#worum, #vt-rechner').count(); ok(m, w, 'Kein Abschnitt «Die Rechnung»', n === 0, `${n} Stellen`); });
      await schritt(m, w, 'Vergleich', async () => {
        await zu(p, 'input[aria-label="Vergleich verschieben"]'); const r = await p.$('input[aria-label="Vergleich verschieben"]');
        const v0 = await r.evaluate(e => getComputedStyle(e.closest('.vgl') || e.parentElement).getPropertyValue('--p') || e.value);
        await r.evaluate(e => { e.value = 20; e.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(300);
        const v1 = await r.evaluate(e => getComputedStyle(e.closest('.vgl') || e.parentElement).getPropertyValue('--p') || e.value);
        ok(m, w, 'Vergleich: Schieber 50 → 20', String(v0) !== String(v1), `${v0} → ${v1}`);
        const t = await p.$$('.vh-wahl button'); if (t.length > 1) { await t[1].click(); await p.waitForTimeout(500);
          ok(m, w, 'Vergleich: zweite Seite («Der Abend»)', await p.evaluate(() => !document.querySelector('.vh-feld[data-vh="1"]').hidden)); } });
      await schritt(m, w, 'Seiten', async () => {
        await zu(p, '#seiten'); const t = await p.$$('#seiten .wahl button'); const z0 = await p.evaluate(() => (document.querySelector('#seiten .schau img, #seiten img') || {}).src || '');
        if (t.length > 2) { await t[2].click(); await p.waitForTimeout(900); }
        const z1 = await p.evaluate(() => (document.querySelector('#seiten .schau img, #seiten img') || {}).src || '');
        ok(m, w, 'Seiten: dritte Seite wählen', t.length >= 7 && z0 !== z1, t.length + ' Reiter'); });
      await schritt(m, w, 'Werkzeug-Reiter', async () => {
        await zu(p, '.ins-r'); const t = await p.$$('.ins-r'); await t[4].click(); await p.waitForTimeout(900);
        const akt = await p.evaluate(() => { const x = document.querySelector('.ins-r[aria-selected="true"]'); return x ? x.textContent.trim() : ''; });
        ok(m, w, 'Werkzeug-Reiter: fünfter (Marke)', /Livre|Marke/.test(akt), akt);
        const wege = await p.evaluate(() => [...document.querySelectorAll('#k5 [data-url]')].map(a => a.getAttribute('data-url')).filter(Boolean));
        ok(m, w, 'Werkzeuge verlinkt', wege.length >= 1, wege.length + ' von 7 mit Adresse'); });
      await schritt(m, w, 'Feed', async () => {
        if (!(await p.$('#feed .fb-h'))) return;
        await zu(p, '.fb-h'); const beruehrung = await p.evaluate(() => !matchMedia('(hover:hover) and (pointer:fine)').matches);
        if (!beruehrung) { await p.click('.fb-h__e').catch(() => {}); await p.waitForTimeout(4000); }
        const fr = await p.evaluate(() => !!document.querySelector('.fb-h iframe'));
        const kn = await p.evaluate(() => !!document.querySelector('a[href*="feed/index.html"]'));
        ok(m, w, beruehrung ? 'Feed: am Touch-Gerät führt «Feed ansehen» zur Feed-Seite' : 'Feed: Klick auf das Handy lädt den Feed', beruehrung ? kn : fr); });
      await schritt(m, w, 'Fuss', async () => {
        await zu(p, '#uebersicht'); const a = await an(p, '#uebersicht .wfa__texte>div'); await p.click('#uebersicht [data-f="1"]').catch(() => {}); await p.waitForTimeout(700);
        const z = await an(p, '#uebersicht .wfa__texte>div'); ok(m, w, 'Fuss «Das Wichtigste»: Pfeil weiter', a !== z, `${a}→${z}`); });
      ok(m, w, 'keine Skriptfehler auf der Werkbank', fehler.length === 0, fehler.slice(0, 2).join(' | '));
      await schritt(m, w, 'Karten', async () => {
        await p.goto(B + 'unterlagen/index.html', { waitUntil: 'load' }); await zu(p, '.uwahl');
        const i0 = await p.evaluate(() => (document.querySelector('.ublatt--neu img') || {}).src || '');
        await p.click('.uwahl button[data-id="abend-2023-09-15"]'); await p.waitForTimeout(2000);
        const i1 = await p.evaluate(() => (document.querySelector('.ublatt--neu img') || {}).src || '');
        ok(m, w, 'Karten: zweite Karte wählen', /abend-2025-02-21/.test(i0) && /abend-2023-09-15/.test(i1), i0.split('/').pop() + ' → ' + i1.split('/').pop()); });
      await schritt(m, w, 'Mails', async () => {
        await p.goto(B + 'mails/index.html', { waitUntil: 'load' }); await p.waitForTimeout(800); await p.click('.mb .mb-kn'); await p.waitForTimeout(400);
        ok(m, w, 'Mails: «Ganze Mail» klappt auf', await p.evaluate(() => document.querySelector('.mb').classList.contains('auf'))); });
      await schritt(m, w, 'Übergabe', async () => {
        const r = await p.request.get(B + 'werkbank/uebergabe-culinarium.pdf'); ok(m, w, 'Übergabe: PDF lädt', r.status() === 200 && (await r.body()).length > 20000, r.status()); });
      await ctx.close();
    }
    await b.close();
  }
  fs.writeFileSync(path.join(__dirname, 'bedienen.txt'), aus.join('\n') + '\n');
})();
