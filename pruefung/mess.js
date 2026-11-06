// Werkbank Culinarium: Kopie von _Werkbank-Kit/mess.js, Server 9088 (28.10.2026).
/* Flüssigkeit auf schwachem Gerät: Hauptfaden gedrosselt, echte Rad-Ereignisse, Zählung langer Bilder je Abschnitt.
   node _werkbank/mess.js [seite] [CPU] [W] [H] */
const path = require('path');
const { chromium } = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const S = process.argv[2] || 'werkbank/', CPU = +(process.argv[3] || 6), W = +(process.argv[4] || 1920), H = +(process.argv[5] || 1080);
(async () => {
  const b = await chromium.launch({ headless: true });
  const mob = W < 600;
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const t0 = Date.now();
  await p.goto((process.env.B || 'http://127.0.0.1:9088/') + S, { waitUntil: 'load' });
  const lade = Date.now() - t0;
  await p.waitForTimeout(3500);
  await p.evaluate(() => {
    window.__f = []; let last = performance.now();
    (function loop(t) { window.__f.push([t - last, scrollY]); last = t; requestAnimationFrame(loop); })(performance.now());
    window.__cls = 0;
    try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  });
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.mouse.move(W / 2, H / 2);
  for (let y = 0; y < h; y += 120) { if (mob) await p.evaluate(v => scrollBy(0, v), 120); else await p.mouse.wheel(0, 120); await p.waitForTimeout(34); }
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const roh = window.__f.slice(3).filter(x => x[0] > 0 && x[0] < 3000);
    const f = roh.map(x => x[0]).sort((a, b) => a - b); const q = k => f[Math.floor(f.length * k)] || 0;
    const ab = [...document.querySelectorAll('main > section, main > div, footer')].map(e => ({ n: e.id || e.className.split(' ')[0], a: e.offsetTop, z: e.offsetTop + e.offsetHeight }));
    const lang = {}; roh.filter(x => x[0] > 33).forEach(x => { const m = x[1] + innerHeight / 2; const s = ab.find(k => m >= k.a && m < k.z); const n = s ? s.n : '?'; lang[n] = (lang[n] || 0) + 1; });
    const e = performance.getEntriesByType('resource');
    return { bilder: f.length, p50: +q(.5).toFixed(1), p95: +q(.95).toFixed(1), max: +f[f.length - 1].toFixed(1), ueber33: f.filter(x => x > 33).length, ueber50: f.filter(x => x > 50).length,
      wo: lang, cls: +window.__cls.toFixed(4), anfragen: e.length, kb: Math.round(e.reduce((a, x) => a + (x.transferSize || x.encodedBodySize || 0), 0) / 1024), knoten: document.getElementsByTagName('*').length };
  });
  console.log(JSON.stringify({ seite: S, cpu: CPU, fenster: W + 'x' + H, lade_ms: lade, ...r }));
  await b.close();
})();
