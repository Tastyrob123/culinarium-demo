/* Vorschaubilder der Galerien (Robert 29.10.2026: «hakt es mega beim Scrollen, und die Dokumente ruckeln aus dem Nichts rein»).
   Jede Karte in «Arten und Vorlagen», bei den Anlässen, Abteilungen, Hinweisen, Newslettern und in «Meine Medien» zeigt ein fertiges Bild ihres Blatts
   (WebP, 2×) statt das Blatt beim Hereinscrollen live zu setzen. Live gesetzt wird nur im Editor.
   Zwei Schlüssel je Blatt: k mit dem Stand von Satz, Vorlagen, Druck und dokumente.js, k2 nur aus dem Inhalt. Passt k, steht das fertige Bild. Gibt es
   nur das Bild eines älteren Stands (k2), steht dieses sofort und das neue entsteht im Leerlauf (DS.png, derselbe Satz wie im Editor), danach wird
   getauscht; das alte löscht der Server. Nur wenn es gar kein Bild gibt, setzt die Karte einmal live. Der Platz jeder Karte steht von Anfang an fest,
   darauf ein ruhiger Grund in der Papierfarbe, das Bild blendet weich ein. Geladen wird etwa anderthalb Bildschirme voraus, was im Bild steht, zuerst. */
(function () {
  const DS = window.DS; if (!DS) return;
  const fnv = (s, h) => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); };
  const hash = s => fnv(s, 2166136261) + fnv(s, 3323198485);
  let STAND = null;
  const stand = () => STAND || (STAND = [...document.scripts].map(x => x.src).filter(u => /\/(satz|vorlagen|druck|dokumente)\.js/.test(u)).map(u => u.split('/').pop()).sort().join('|')
    + '|' + hash(JSON.stringify([DS.M && DS.M.farben, DS.M && DS.M.schriften])));

  const VB = DS.VB = { index: {}, zu: {}, offen: 0 };
  VB.bereit = fetch('api/vorschau', { cache: 'no-cache' }).then(r => r.ok ? r.json() : {}).then(ix => { VB.zu = (ix && ix._z) || {}; delete (ix || {})._z; VB.index = ix || {}; })
    .catch(() => {}).then(() => { VB.geladen = true; });
  VB.schluessel = (fk, seite) => hash(JSON.stringify([stand(), fk, seite]));
  VB.inhalt = (fk, seite) => hash(JSON.stringify([fk, seite]));
  /* 2× des grössten Blatts in der Galerie (Grundmass 300 px, breite Formate höchstens 396 px), so bleibt jede Karte am Retina-Schirm scharf */
  VB.px = F => { const h = 300 * Math.pow(F.h / 148, .6), w = Math.min(h * F.b / F.h, 396); return Math.round(Math.min(1100, Math.max(420, 2 * w))); };
  const url = k => DS.M.basis + 'vorschau-dok/' + k + '.webp';

  const css = document.createElement('style');
  css.textContent = '.vbild{display:block;position:absolute;inset:0;background:var(--vb,#f4eeec);overflow:hidden}'
    + '.vbild>img{display:block;width:100%;height:100%;opacity:0;transition:opacity .25s ease}.vbild.da>img{opacity:1}'
    + '@media (prefers-reduced-motion:reduce){.vbild>img{transition:none}}'
    + '#start .vb__block{content-visibility:auto;contain-intrinsic-size:auto 900px}';
  document.head.appendChild(css);

  /* Laden: ein Beobachter je Scroll-Fläche, 150 % voraus; was beim ersten Blick im Bild steht, mit hoher Priorität */
  const beob = new Map(), warten = []; let geplant = false;
  const lade = (img, hoch) => { if (!img.dataset.src) return; if (hoch) img.fetchPriority = 'high'; img.src = img.dataset.src; delete img.dataset.src; };
  const beobachter = root => {
    if (!beob.has(root)) beob.set(root, new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; const r = e.rootBounds, b = e.boundingClientRect, hoch = !r || (b.bottom > r.top && b.top < r.bottom);
      if (e.target.tagName === 'IMG') lade(e.target, hoch);
      else { e.target.__vbDa = true; e.target.querySelectorAll('img[data-src]').forEach(i => lade(i, hoch)); }   // ganzer Block
      beob.get(root).unobserve(e.target);
    }), { root, rootMargin: '150% 0px' }));
    return beob.get(root);
  };
  const verteile = () => {
    geplant = false; const rest = [];
    for (const [img, n] of warten.splice(0)) {
      /* In einem Block mit content-visibility:auto hat ein Bild ausserhalb des Bildschirms keine Lage, der Beobachter meldet es erst im Bild (30.10.2026:
         beim schnellen Scrollen in «Alle Vorlagen» standen 12 Karten leer). Beobachtet wird dann der Block selbst; er lädt alle seine Bilder. */
      if (img.isConnected) { const blk = img.closest('.vb__block'); if (blk && blk.__vbDa) lade(img, false); else beobachter(img.closest('.ms-haupt') || null).observe(blk || img); }
      else if (n < 40) rest.push([img, n + 1]); else lade(img, false);
    }
    if (rest.length) { warten.push(...rest); geplant = true; requestAnimationFrame(verteile); }
  };
  VB.bild = (k, farbe, k2) => {
    const s = document.createElement('span'); s.className = 'vbild'; if (farbe) s.style.setProperty('--vb', farbe);
    const img = document.createElement('img'); img.alt = ''; img.decoding = 'async'; img.draggable = false;
    img.dataset.src = url(k); if (k2) img.dataset.k2 = k2;
    img.onload = () => s.classList.add('da'); img.onerror = () => s.classList.add('da');
    s.appendChild(img); warten.push([img, 0]); if (!geplant) { geplant = true; requestAnimationFrame(verteile); }
    return s;
  };
  /* Das Bild eines Blatts, falls es eines gibt: aktuell, sonst das des letzten Stands (und das neue kommt nach). mach() liefert { doc, i } für DS.png. */
  VB.fertig = (fk, seite, mach) => {
    const k = VB.schluessel(fk, seite), k2 = VB.inhalt(fk, seite);
    if (VB.index[k]) return VB.bild(k, VB.index[k], k2);
    const alt = VB.zu[k2];
    if (alt && VB.index[alt]) { VB.spaeter(k, mach, k2); return VB.bild(alt, VB.index[alt], k2); }
    return null;
  };

  /* Ein Blatt für eine Karte. live() gibt { el, doc, i } zurück: das gesetzte Element und das Dokument samt Seite für DS.png. */
  VB.blatt = (fk, seite, live) => {
    const mach = () => live();
    const b = VB.fertig(fk, seite, mach); if (b) return b;
    if (!VB.geladen) {   // die Liste ist noch unterwegs (wenige ms): ruhiger Platzhalter, danach Bild oder einmal live
      const s = document.createElement('span'); s.className = 'vbild';
      VB.bereit.then(() => { if (!s.isConnected && !s.parentNode) return; const b2 = VB.fertig(fk, seite, mach); if (b2) s.replaceWith(b2); else { const l = live(); s.replaceWith(l.el); VB.spaeter(VB.schluessel(fk, seite), () => l, VB.inhalt(fk, seite)); } });
      return s;
    }
    const l = live(); VB.spaeter(VB.schluessel(fk, seite), () => l, VB.inhalt(fk, seite)); return l.el;
  };

  /* Nachziehen: eins nach dem anderen, nur wenn nicht gescrollt wird; Safari kennt requestIdleCallback nicht */
  const schlange = [], drin = new Set(); let laeuft = false, zuletztGescrollt = 0;
  addEventListener('scroll', () => { zuletztGescrollt = performance.now(); }, { capture: true, passive: true });
  const leerlauf = cb => window.requestIdleCallback ? requestIdleCallback(cb, { timeout: 5000 }) : setTimeout(cb, 700);
  VB.spaeter = (k, mach, k2) => {
    if (drin.has(k) || VB.index[k] || typeof mach !== 'function' || !DS.png) return;
    drin.add(k); schlange.push({ k, k2, mach }); VB.offen = schlange.length; if (!laeuft) { laeuft = true; leerlauf(arbeite); }
  };
  async function arbeite() {
    if (performance.now() - zuletztGescrollt < 600) return leerlauf(arbeite);
    await VB.bereit;   // kam die Liste erst nach dem ersten Zeichnen: was am Server liegt, nicht noch einmal rechnen
    const j = schlange.shift(); VB.offen = schlange.length;
    if (!j) { laeuft = false; return; }
    if (VB.index[j.k]) return leerlauf(arbeite);
    try {
      const { doc, i } = j.mach(), F = DS.FORMATE[doc.formatKey] || doc.format, blob = await DS.png(DS.M, doc, i || 0, VB.px(F));
      const png = await new Promise((ok, nein) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = nein; r.readAsDataURL(blob); });
      const a = await fetch('api/vorschau', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ k: j.k, k2: j.k2, png }) });
      if (a.ok) {
        const d = await a.json();
        if (d.farbe) { const alt = VB.zu[j.k2]; VB.index[j.k] = d.farbe; VB.zu[j.k2] = j.k; if (alt && alt !== j.k) delete VB.index[alt];
          document.querySelectorAll(`img[data-k2="${j.k2}"]`).forEach(img => { if (img.dataset.src) img.dataset.src = url(j.k); else img.src = url(j.k); }); }   // das Bild des alten Stands tauschen
      } else if (a.status === 404 || a.status === 405) schlange.length = 0;   // ohne Ablage am Server (online): bleibt live wie bisher
    } catch (e) { console.warn('Vorschaubild', e); }
    VB.offen = schlange.length; leerlauf(arbeite);
  }
})();
