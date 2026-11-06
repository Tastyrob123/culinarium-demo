/* Tapeten der Website (website/assets/zeichen/tapete-*.svg) einmal als Bild mit doppelter Dichte rechnen (Regel 55: ein SVG-Muster kostet am Handy
   beim ersten Scrollen ein Bild über 33 ms, das gerechnete Bild nicht). node quelle/tapete.js → quelle/tapete-<art>@2x.png */
const path = require('path'), os = require('os'), fs = require('fs');
module.paths.push(path.join(os.homedir(), 'Aussen-Pruefung', 'node_modules'));
const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch({ headless: true });
  for (const art of ['dunkel', 'hell']) {
    const svg = fs.readFileSync(path.resolve(__dirname, '../../../website/assets/zeichen/' + (art === 'dunkel' ? 'tapete-dunkel' : 'tapete-hell') + '.svg'), 'utf8');
    const page = await b.newPage({ viewport: { width: 224, height: 224 }, deviceScaleFactor: 2 });
    await page.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg}`);
    await page.screenshot({ path: path.join(__dirname, `tapete-${art}@2x.png`), omitBackground: true, clip: { x: 0, y: 0, width: 224, height: 224 } });
    await page.close();
  }
  await b.close();
})();
