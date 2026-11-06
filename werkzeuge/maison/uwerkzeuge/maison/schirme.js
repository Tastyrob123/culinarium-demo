#!/usr/bin/env node
/* Bildschirme der Werkzeuge für La Maison · Culinarium Hannover (M08, M23): unsichtbar im Safari-Kern, 1440 × 900 @2x, nach roh/<name>.png.
   Adresse je Werkzeug aus stand_wege.json; nur Werkzeuge, deren Server antwortet. Jede Anfrage ausser GET/HEAD wird abgewiesen (nichts wird geschrieben),
   ebenso jeder KI-Weg. Weitere Ansichten je Werkzeug (zweiter Bildschirm) über ansichten.json: {"livre-marke": {"von": "livre", "klick": "Text"}}.
   node _werkzeuge/maison/schirme.js [werkzeug …] */
const path = require('path'), os = require('os'), fs = require('fs');
module.paths.push(path.join(os.homedir(), 'Aussen-Pruefung', 'node_modules'));
const pw = require('playwright');
const HIER = __dirname, ROOT = path.resolve(HIER, '..', '..');
const TEIL = { bureau: 'website', carte: 'karten', imprimerie: 'druck', reception: 'gaeste', livre: 'marke', registre: 'besuche' };
const ERSTE = { bureau: 'bureau', carte: 'carte', imprimerie: 'imprimerie', reception: 'reception', livre: 'livre-fotos', registre: 'registre' };
const SW = (() => { try { return JSON.parse(fs.readFileSync(path.join(HIER, 'stand_wege.json'), 'utf8')); } catch (e) { return {}; } })();
const kette = k => ({ adresse: (SW[k] || {}).adresse || '' });
const ansichten = (() => { try { return JSON.parse(fs.readFileSync(path.join(HIER, 'ansichten.json'), 'utf8')); } catch (e) { return {}; } })();
(async () => {
  const nur = process.argv.slice(2);
  const browser = await pw.webkit.launch({ headless: true });
  const aus = [];
  for (const k of Object.keys(TEIL)) {
    if (nur.length && !nur.includes(k)) continue;
    const s = kette(k);
    if (!s.adresse) { aus.push({ k, uebersprungen: 'ohne Adresse' }); continue; }
    try { const r = await fetch(s.adresse); if (!r.ok) throw new Error(r.status); } catch (e) { aus.push({ k, uebersprungen: 'Server antwortet nicht' }); continue; }
    const auftraege = [[ERSTE[k], null]].concat(Object.entries(ansichten).filter(([, a]) => a.von === k).map(([n, a]) => [n, a]));
    for (const [name, a] of auftraege) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'de-DE', reducedMotion: 'reduce' });   /* ohne Bewegung (30.10.2026): nichts mitten im Auftritt, Zahlen mit ihrem Endwert statt mitten im Hochzählen */   // Zeitzone des Rechners: Datum und Gruss wie beim Betrachter (keine feste Zone, sonst falscher Tag auf den Bildern)
      await ctx.addInitScript(() => { try { Object.keys(localStorage).forEach(x => { if (/^rundgang/.test(x)) localStorage.removeItem(x); }); localStorage.setItem('ds-culinarium-willkommen', '1');   /* Begrüssung der Druckerei als gesehen, nur im Wegwerf-Profil der Aufnahme */ } catch (e) {} });
      const page = await ctx.newPage();
      const fehler = [];
      page.on('pageerror', e => fehler.push(String(e)));
      await page.route('**/*', r => { const q = r.request(); return (['GET', 'HEAD'].includes(q.method()) && !/\/api\/(gast|ki|entwurf\b)/.test(q.url())) ? r.continue() : r.abort(); });
      await page.goto((a && a.adresse) || s.adresse, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(1800);
      // Anmelde-Fenster der Werkzeuge (z. B. «Wer arbeitet hier?») schliessen, ohne etwas einzutragen
      for (let n = 0; n < 2; n++) { const d = await page.$('dialog[open], [role="dialog"]:not([hidden])'); if (!d || !(await d.isVisible())) break;
        const zu = await d.$('button[aria-label*="chlie"], button.zu, .x, button:has-text("×")'); if (zu) await zu.click().catch(() => {}); else await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
      if (a && a.klick) { await (/^[#\[.]/.test(a.klick) ? page.locator(a.klick) : page.getByText(a.klick, { exact: false })).first().click({ timeout: 8000 }).catch(e => fehler.push('klick: ' + e.message.split('\n')[0])); await page.waitForTimeout(1500); }
      /* zeige: Text eines Abschnitts, der oben im Bild stehen soll (gerollt im Rollbereich des Werkzeugs, 30.10.2026: Wortmarken ganz statt angeschnitten) */
      if (a && a.zeige) { await page.getByText(a.zeige, { exact: false }).first().evaluate((el, oben) => { el.scrollIntoView({ block: 'start', behavior: 'instant' }); let p = el.parentElement; while (p && p !== document.body) { if (p.scrollHeight > p.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(p).overflowY)) { p.scrollTop -= oben; break; } p = p.parentElement; } if (!p || p === document.body) scrollBy(0, -oben); }, a.oben || 120).catch(e => fehler.push('zeige: ' + e.message.split('\n')[0])); await page.waitForTimeout(900); }
      await page.waitForFunction(() => !document.body.innerText.includes('Seite wird gesetzt'), null, { timeout: 20000 }).catch(() => {});   /* Vorschau der Website fertig gesetzt (30.10.2026) */
      await page.evaluate(() => { document.querySelectorAll('.rdg-kegel,.rdg-karte,.rdg-sperre').forEach(x => x.remove()); });
      const ziel = path.join(HIER, 'roh', name + '.png');
      await page.screenshot({ path: ziel, type: 'png' });
      aus.push({ k, name, adresse: s.adresse, fehler });
      await ctx.close();
    }
  }
  await browser.close();
  console.log(JSON.stringify(aus, null, 1));
})().catch(e => { console.error(String(e)); process.exit(1); });
