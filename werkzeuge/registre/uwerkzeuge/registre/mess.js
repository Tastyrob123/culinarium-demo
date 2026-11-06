/* Nur die Flüssigkeit (Regel 55): node mess.js [basis] [rate] — Chrome, Hauptfaden 4× (oder 6×) gedrosselt, Ansichtswechsel + Scrollen; je Breite dreimal, einmal mit reduzierter Bewegung zum Vergleich */
const path = require('path');
const PW = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const BASIS = process.argv[2] || 'http://127.0.0.1:9086/_werkzeuge/registre/';
const RATE = +(process.argv[3] || 4);
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
(async () => {
  const b = await PW.chromium.launch();   /* Chromium von Playwright, nie das Chrome des Rechners (Regel 49) */
  for (const [w, h] of [[1440, 900], [390, 844]]) for (const ruhig of [false, false, false, true]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: ruhig ? 'reduce' : 'no-preference', isMobile: w < 600, hasTouch: w < 600 });
    const page = await ctx.newPage();
    await page.goto(BASIS + '#start'); await page.waitForFunction(() => (window.BG_REGISTRE === 1 && document.documentElement.classList.contains('auftakt-da'))); await page.waitForTimeout(1500);
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    await page.evaluate(() => { window.__t = []; let l = performance.now(); (function f(n) { window.__t.push(n - l); l = n; requestAnimationFrame(f); })(l); });
    for (const v of ['besuche', 'herkunft', 'zeit', 'verlauf', 'start']) {
      if (w < 900) await page.click('#kopf .wo-kopf__ber');
      await page.click(`#rand [data-gehe="${v}"]`); await page.waitForTimeout(500);
      await page.mouse.move(w / 2, h / 2);
      for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(70); }
      await page.waitForTimeout(300);
    }
    const t = (await page.evaluate(() => window.__t)).slice(2);
    console.log(RATE + '×', w, ruhig ? 'ruhig ' : 'Bewegung', 'p50', q(t, .5).toFixed(1), 'p95', q(t, .95).toFixed(1), 'max', Math.max(...t).toFixed(1), 'über33:', t.filter(x => x > 33.4).length, '/', t.length);
    await ctx.close();
  }
  await b.close();
})();
