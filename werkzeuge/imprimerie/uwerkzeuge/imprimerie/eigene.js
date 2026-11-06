/* Drucksachen-Studio · Eigene Fotos: hochladen, im Browser behalten (IndexedDB), wie Hausfotos verwenden.
   Jedes Foto wird beim Hochladen auf höchstens 3600 px Kantenlänge gebracht (genug für A3 mit über 200 dpi) und als JPEG gespeichert,
   dazu eine Miniatur für die Auswahl. Im Studio heissen sie «eigen-…» und stehen in M.bilder wie die Fotos des Hauses (Gruppe «Eigene Fotos»). */
(function () {
  const DS = window.DS;
  const HAUS = new URLSearchParams(location.search).get('haus') || 'culinarium';
  const DBNAME = 'ds-' + HAUS + '-fotos', GRUPPE = 'Eigene Fotos';
  let dbp;
  const db = () => dbp || (dbp = new Promise((ok, nein) => {
    const r = indexedDB.open(DBNAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('fotos', { keyPath: 'key' });
    r.onsuccess = () => ok(r.result); r.onerror = () => nein(r.error || new Error('ABLAGE · Dieser Browser legt hier keine Fotos ab.'));
  }));
  const tx = async (art, fn) => { const d = await db(); return new Promise((ok, nein) => { const t = d.transaction('fotos', art); const s = t.objectStore('fotos'); const r = fn(s); t.oncomplete = () => ok(r && r.result); t.onerror = t.onabort = () => nein(t.error || new Error('ABLAGE · Dieser Browser legt hier keine Fotos ab.')); }); };

  function eintragen(M, f) {
    const url = URL.createObjectURL(f.blob), mini = URL.createObjectURL(f.mini);
    const b = { key: f.key, alt: f.name, w: f.w, h: f.h, gruppe: GRUPPE, eigen: true, url, miniUrl: mini, datum: f.datum };
    M.bilder = M.bilder.filter(x => x.key !== f.key); M.bilder.unshift(b); M.bildIndex[f.key] = b;
    return b;
  }

  async function verkleinern(datei, max, q) {
    let bild;
    try { bild = await createImageBitmap(datei, { imageOrientation: 'from-image' }); }
    catch (e) { bild = await new Promise((ok, nein) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => nein(new Error('Dieses Bildformat kann der Browser nicht lesen. Bitte als JPG oder PNG speichern.')); i.src = URL.createObjectURL(datei); }); }
    const w0 = bild.width, h0 = bild.height, k = Math.min(1, max / Math.max(w0, h0));
    const cv = document.createElement('canvas'); cv.width = Math.round(w0 * k); cv.height = Math.round(h0 * k);
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.imageSmoothingQuality = 'high'; g.drawImage(bild, 0, 0, cv.width, cv.height);
    const blob = await new Promise(ok => cv.toBlob(ok, 'image/jpeg', q));
    return { blob, w: cv.width, h: cv.height };
  }

  DS.eigene = {
    GRUPPE,
    async laden(M) {
      try {
        const alle = await tx('readonly', s => s.getAll());
        (alle || []).sort((a, b) => a.datum - b.datum).forEach(f => eintragen(M, f));
        return (alle || []).length;
      } catch (e) { console.warn('Eigene Fotos nicht lesbar', e); return 0; }
    },
    /* Dateien hochladen → Liste der neuen Schlüssel */
    async hinzu(M, dateien, melde) {
      const neu = [];
      const liste = [...dateien].filter(d => /^image\//.test(d.type) || /\.(jpe?g|png|webp|heic|heif|tiff?)$/i.test(d.name));
      for (let i = 0; i < liste.length; i++) {
        const d = liste[i];
        if (melde) melde(`Foto ${i + 1} von ${liste.length} wird vorbereitet …`);
        const gross = await verkleinern(d, 3600, .9), klein = await verkleinern(d, 520, .8);
        const f = { key: 'eigen-' + Date.now().toString(36) + i, name: d.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '), w: gross.w, h: gross.h, blob: gross.blob, mini: klein.blob, datum: Date.now() };
        /* Legt der Browser keine Fotos ab (Safari im privaten Fenster, Prüfung 16.10.2026: dort scheiterte jedes Hochladen ohne Meldung),
           ist das Foto trotzdem für diese Sitzung da; die Meldung sagt, dass es beim Schliessen weg ist. */
        try { await tx('readwrite', s => s.put(f)); } catch (e) { f.fluechtig = true; neu.fluechtig = true; console.warn('Foto nur für diese Sitzung', e); }
        eintragen(M, f); neu.push(f.key);
      }
      return neu;
    },
    async loeschen(M, key) {
      await tx('readwrite', s => s.delete(key));
      const b = M.bildIndex[key]; if (b) { URL.revokeObjectURL(b.url); URL.revokeObjectURL(b.miniUrl); }
      delete M.bildIndex[key]; M.bilder = M.bilder.filter(x => x.key !== key);
    },
    /* Für die Arbeitsdatei: die in einem Dokument benutzten eigenen Fotos als Daten */
    async mitnehmen(M, doc) {
      const keys = new Set(); doc.seiten.forEach(s => s.el.forEach(e => { if (e.typ === 'bild' && /^eigen-/.test(e.bild)) keys.add(e.bild); }));
      const out = {};
      for (const k of keys) {
        let f = await tx('readonly', s => s.get(k)).catch(() => null);
        if (!f) { const b = M.bildIndex[k]; if (!b || !b.url) continue; f = { name: b.alt, w: b.w, h: b.h, datum: b.datum, blob: await (await fetch(b.url)).blob(), mini: await (await fetch(b.miniUrl)).blob() }; }   // Foto nur für diese Sitzung
        out[k] = { name: f.name, w: f.w, h: f.h, datum: f.datum, blob: await blobZuText(f.blob), mini: await blobZuText(f.mini) };
      }
      return out;
    },
    async einlesen(M, daten) {
      for (const [k, f] of Object.entries(daten || {})) {
        if (M.bildIndex[k]) continue;
        const e = { key: k, name: f.name, w: f.w, h: f.h, datum: f.datum || Date.now(), blob: await (await fetch(f.blob)).blob(), mini: await (await fetch(f.mini)).blob() };
        await tx('readwrite', s => s.put(e)); eintragen(M, e);
      }
    },
  };
  const blobZuText = b => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });

  // Bildadressen: eigene Fotos über ihre Objekt-Adresse
  const bildUrl = DS.bildUrl;
  DS.bildUrl = (M, key, mini) => { const b = M.bildIndex[key]; return b && b.eigen ? (mini ? b.miniUrl : b.url) : bildUrl(M, key, mini); };
})();
