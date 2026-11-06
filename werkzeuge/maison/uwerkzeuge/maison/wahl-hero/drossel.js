// Chromium, Netz gedrosselt (1,6 Mbit/s, 150 ms) und CPU 4×: wann stehen die Bilder im ersten Bildschirm?
const pw = require('playwright');
(async () => {
  const [aus, ...nn] = process.argv.slice(2);
  const br = await pw.chromium.launch();
  for (const n of nn) {
    const ctx = await br.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage(); const c = await ctx.newCDPSession(p);
    await c.send('Network.enable'); await c.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
    await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.route('**/*', r => { const q = r.request(); if (!['GET','HEAD'].includes(q.method()) || /^(mailto|tel):/.test(q.url())) return r.abort(); r.continue(); });
    const t0 = Date.now();
    await p.goto(`http://127.0.0.1:9081/_werkzeuge/maison/wahl-hero/hero-${n}.html`, { waitUntil: 'commit' });
    const fertig = p.waitForFunction(() => { if (document.readyState === "loading") return false; const v = [...document.querySelectorAll(".m-empfang img")].filter(i => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.width && getComputedStyle(i).opacity !== "0"; }); return v.length > 0 && v.every(i => i.complete && i.naturalWidth); }, null, { timeout: 60000, polling: 100 }).then(() => Date.now() - t0).catch(() => 'über 60 s');
    await p.waitForTimeout(2500); await p.screenshot({ path: `${aus}/drossel-${n}-2s.png` });
    const ms = await fertig;
    console.log(JSON.stringify({ n, erstesBildKomplett_ms: ms }));
    await ctx.close();
  }
  await br.close();
})();
