/* Drucksachen-Studio · Druck: eine Seite in Zeichenbefehle zerlegen (Masse in mm, Text Zeichen für Zeichen an
   der Stelle, an der der Browser ihn gesetzt hat), daraus PDF für die Druckerei oder ein Bild. Dazu die Druckprüfung. */
(function () {
  const DS = window.DS;
  const MM = 72 / 25.4;
  const S = 8;   // Messauflösung: 8 px je mm

  const hex = f => { const h = f.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255); };
  const bildCache = {};
  DS.ladeBild = function (url) {
    if (!bildCache[url]) bildCache[url] = new Promise((ok, nein) => { const i = new Image(); i.onload = () => ok(i); i.onerror = nein; i.src = url; });
    return bildCache[url];
  };

  /* Grundlinien-Lage je Schrift: Abstand Oberkante Zeichenkasten → Grundlinie, als Anteil der Schriftgrösse */
  const grund = {};
  function grundlinie(rolle) {
    if (grund[rolle]) return grund[rolle];
    const w = document.createElement('div');
    w.style.cssText = `position:absolute;left:-99999px;top:0;font-family:'DS-${rolle}';font-size:100px;line-height:normal;white-space:nowrap`;
    w.innerHTML = 'H<span style="display:inline-block;width:0;height:0;vertical-align:baseline"></span>';
    document.body.appendChild(w);
    const r = document.createRange(); r.setStart(w.firstChild, 0); r.setEnd(w.firstChild, 1);
    const top = r.getBoundingClientRect().top, base = w.lastChild.getBoundingClientRect().top;
    document.body.removeChild(w);
    return (grund[rolle] = (base - top) / 100);
  }

  function rr(x, y, w, h, r) {
    r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    if (!r) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    const k = r * .5523;
    return `M${x + r} ${y}H${x + w - r}C${x + w - r + k} ${y} ${x + w} ${y + r - k} ${x + w} ${y + r}V${y + h - r}C${x + w} ${y + h - r + k} ${x + w - r + k} ${y + h} ${x + w - r} ${y + h}` +
      `H${x + r}C${x + r - k} ${y + h} ${x} ${y + h - r + k} ${x} ${y + h - r}V${y + r}C${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y}Z`;
  }
  DS.rr = rr;

  /* Fläche mit Tapete als Pixelbild (Rapport an der Ecke des Endformats verankert, wie am Bildschirm) */
  async function tapetenBild(M, art, farbe, x, y, w, h, r, dpi) {
    const k = dpi / 25.4, cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d');
    if (r) { g.beginPath(); g.roundRect(0, 0, cw, ch, r * k); g.clip(); }
    g.fillStyle = farbe; g.fillRect(0, 0, cw, ch);
    const kachel = await DS.ladeBild(M.basis + M.tapete[art]);
    const rw = M.tapete.rapport_mm * k, rh = rw * kachel.height / kachel.width;
    const ox = ((-x * k) % rw + rw) % rw - rw, oy = ((-y * k) % rh + rh) % rh - rh;
    for (let yy = oy; yy < ch; yy += rh) for (let xx = ox; xx < cw; xx += rw) g.drawImage(kachel, xx, yy, rw, rh);
    return { cv, png: !!r };
  }

  async function fotoBild(M, el, dpi) {
    const b = M.bildIndex[el.bild];
    let img;
    try { img = await DS.ladeBild(b && b.druck ? b.druck.url : DS.bildUrl(M, el.bild)); }
    catch (e) {   // Druckfassung nicht erreichbar (online in einem anderen Ordner, Netz): mit dem Foto der Website weiter, die Druckprüfung rechnet dann mit dessen Grösse
      if (!(b && b.druck)) throw e;
      b.druck = null; img = await DS.ladeBild(DS.bildUrl(M, el.bild));
    }
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const a = DS.ausschnitt(el, iw, ih);
    const s = iw / a.bw;                       // Quellpixel je mm
    const sx = -a.x * s, sy = -a.y * s, sw = el.w * s, sh = el.h * s;
    const cw = Math.max(1, Math.round(Math.min(sw, el.w / 25.4 * dpi))), ch = Math.max(1, Math.round(cw * el.h / el.w));
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high';
    if (el.r) { g.beginPath(); g.roundRect(0, 0, cw, ch, el.r * cw / el.w); g.clip(); }
    g.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    void b;
    return { cv, png: !!el.r || !!(b && b.datei), dpi: sw / (el.w / 25.4) };
  }

  /* ---------- Zerlegen ---------- */
  DS.druckplan = async function (M, doc, i, o = {}) {
    const B = DS.B, s = doc.seiten[i], f = doc.format, dpi = o.dpi || 300;
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:0;top:0;transform:translateX(-200000px);pointer-events:none';
    document.body.appendChild(host);
    const blatt = DS.seiteDom(M, doc, i, S, {});
    host.appendChild(blatt);
    await document.fonts.ready;
    const ur = blatt.getBoundingClientRect();
    const ox = ur.left + B * S, oy = ur.top + B * S;
    const ops = [];
    // Grund über den ganzen Beschnitt
    if (s.tapete) ops.push({ art: 'raster', x: -B, y: -B, w: f.b + 2 * B, h: f.h + 2 * B, ...(await tapetenBild(M, s.tapete, DS.farbe(M, s.grund), -B, -B, f.b + 2 * B, f.h + 2 * B, 0, 240)) });
    else ops.push({ art: 'pfad', d: rr(-B, -B, f.b + 2 * B, f.h + 2 * B, 0), fill: DS.farbe(M, s.grund), deck: 1 });
    const kinder = [...blatt.children];
    for (let n = 0; n < s.el.length; n++) {
      const el = s.el[n], d = kinder[n];
      const deck = el.deck ?? 1;
      if (el.typ === 'text') {
        const u2 = blatt.getBoundingClientRect();   // Ursprung je Text neu: während die Fotos laden, kann sich das Blatt verschieben (30.10.2026, erster Aufruf 3–5 mm zu tief)
        const gl = DS.glyphen(d, S, u2.left + B * S, u2.top + B * S), a = grundlinie(el.rolle);
        ops.push({ art: 'text', rolle: el.rolle, gr: el.gr, farbe: DS.farbe(M, el.farbe), deck, gross: el.gross, schatten: el.schatten,
          glyphen: gl.map(g => ({ ch: el.gross ? g.ch.toUpperCase() : g.ch, x: g.x, base: g.top + a * el.gr })) });
      } else if (el.typ === 'bild') {
        if (!M.bildIndex[el.bild]) continue;
        ops.push({ art: 'raster', x: el.x, y: el.y, w: el.w, h: el.h, deck, ...(await fotoBild(M, el, dpi)) });
      } else if (el.typ === 'flaeche') {
        if (el.tapete) ops.push({ art: 'raster', x: el.x, y: el.y, w: el.w, h: el.h, deck, ...(await tapetenBild(M, el.tapete, DS.farbe(M, el.farbe), el.x, el.y, el.w, el.h, el.r, 240)) });
        else ops.push({ art: 'pfad', d: rr(el.x, el.y, el.w, el.h, el.r), fill: DS.farbe(M, el.farbe), deck });
      } else if (el.typ === 'linie') {
        const senk = el.h > el.w;
        ops.push({ art: 'pfad', d: rr(el.x, el.y, senk ? el.staerke : el.w, senk ? el.h : el.staerke, 0), fill: DS.farbe(M, el.farbe), deck });
      } else if (el.typ === 'rahmen') {
        const t = el.staerke;
        ops.push({ art: 'pfad', d: rr(el.x + t / 2, el.y + t / 2, el.w - t, el.h - t, Math.max(0, (el.r || 0) - t / 2)), stroke: DS.farbe(M, el.farbe), breite: t, deck });
      } else if (el.typ === 'zeichen') {
        const k = el.w / DS.zz(M, el).vb[2];
        ops.push({ art: 'zeichen', x: el.x, y: el.y, k, z: el.z, farbe: DS.farbe(M, el.farbe), deck });
      }
    }
    document.body.removeChild(host);
    return ops;
  };

  /* ---------- PDF ---------- */
  const schriftCache = {};
  async function schriftBytes(M, rolle) {
    const url = M.basis + 'schriften/' + M.schriften[rolle].datei;
    if (!schriftCache[url]) schriftCache[url] = fetch(url).then(r => r.arrayBuffer());
    return schriftCache[url];
  }

  /* pdf-lib und fontkit (1,3 MB) erst laden, wenn ein PDF entsteht (Oberchef 29.10.: gedrosselt 12 s bis zum ersten Knopf); beim Zeigen auf «Druckfertig speichern» vorladen.
     Ebenso die Druckschriften: die TTF holt erst schriftBytes(), am Bildschirm reichen die woff2 */
  let pdfLib = null;
  DS.ladePdf = () => pdfLib || (pdfLib = (window.PDFLib && window.fontkit) ? Promise.resolve() : Promise.all(['lib/pdf-lib.min.js', 'lib/fontkit.umd.min.js'].map(src => new Promise((ok, nein) => {
    const s = document.createElement('script'); s.src = src; s.async = true; s.onload = ok; s.onerror = () => { pdfLib = null; nein(new Error('PDF-Werkzeug nicht geladen: ' + src)); }; document.head.appendChild(s);
  }))));
  DS.vorladenPdf = M => { DS.ladePdf().catch(() => {}); if (M && M.schriften) Object.keys(M.schriften).forEach(r => schriftBytes(M, r).catch(() => {})); };

  DS.pdf = async function (M, doc, o = {}) {
    await DS.ladePdf();
    const { PDFDocument, rgb, cmyk } = PDFLib;
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    pdf.setTitle(doc.name); pdf.setAuthor(M.name); pdf.setCreator('Die Plakatwerkstatt · Tasty Studios'); pdf.setProducer('Die Plakatwerkstatt');
    const B = DS.B, R = o.marken ? 10 : 0, f = doc.format;
    const fonts = {}, zeichensatz = {};
    const font = async rolle => {
      if (!fonts[rolle]) {
        fonts[rolle] = await pdf.embedFont(await schriftBytes(M, rolle), { subset: true });
        zeichensatz[rolle] = new Set(fonts[rolle].getCharacterSet());
      }
      return fonts[rolle];
    };
    const fehlend = new Set();
    for (let i = 0; i < doc.seiten.length; i++) {
      if (o.melde) o.melde(`Seite ${i + 1} von ${doc.seiten.length} wird gesetzt …`);
      const ops = await DS.druckplan(M, doc, i, o);
      const PW = (f.b + 2 * B + 2 * R) * MM, PH = (f.h + 2 * B + 2 * R) * MM;
      const page = pdf.addPage([PW, PH]);
      const X = x => (x + B + R) * MM, Y = y => PH - (y + B + R) * MM;
      page.setBleedBox(R * MM, R * MM, (f.b + 2 * B) * MM, (f.h + 2 * B) * MM);
      page.setTrimBox((R + B) * MM, (R + B) * MM, f.b * MM, f.h * MM);
      for (const op of ops) {
        if (op.art === 'pfad') {
          const opt = { x: X(0), y: Y(0), scale: MM };
          if (op.fill) Object.assign(opt, { color: rgb(...hex(op.fill)), opacity: op.deck });
          if (op.stroke) Object.assign(opt, { borderColor: rgb(...hex(op.stroke)), borderWidth: op.breite, borderOpacity: op.deck });
          page.drawSvgPath(op.d, opt);
        } else if (op.art === 'raster') {
          const daten = op.png ? op.cv.toDataURL('image/png') : op.cv.toDataURL('image/jpeg', .92);
          const bild = op.png ? await pdf.embedPng(daten) : await pdf.embedJpg(daten);
          page.drawImage(bild, { x: X(op.x), y: Y(op.y + op.h), width: op.w * MM, height: op.h * MM, opacity: op.deck ?? 1 });
        } else if (op.art === 'zeichen') {
          for (const d of DS.zz(M, op).pfade) page.drawSvgPath(d, { x: X(op.x), y: Y(op.y), scale: op.k * MM, color: rgb(...hex(op.farbe)), opacity: op.deck });
        } else if (op.art === 'text') {
          const fo = await font(op.rolle);
          /* Kopfzeile wie Rudi (29.10.): Leuchten als weicher Hof aus Kopien auf drei Ringen ausserhalb der Kante, dann der harte Schatten, dann die Schrift scharf darüber */
          const T = op.schatten ? DS.kopfTiefe(op.farbe, op.schatten, 1) : null, SCH = [];
          if (T && T.glow) for (const r of [.26, .19, .12]) for (let w = 0; w < 16; w++) SCH.push([Math.cos(w * Math.PI / 8) * r, Math.sin(w * Math.PI / 8) * r, T.glow.slice(0, 7), .016]);
          if (T) SCH.push([T.dx, T.dy, T.hart, 1]);
          for (const [dx, dy, c, a] of SCH) for (const g of op.glyphen) { if (!zeichensatz[op.rolle].has(g.ch.codePointAt(0))) continue; page.drawText(g.ch, { x: X(g.x + dx * op.gr), y: Y(g.base + dy * op.gr), size: op.gr * MM, font: fo, color: rgb(...hex(c)), opacity: a * (op.deck ?? 1) }); }
          for (const g of op.glyphen) {
            let fx = fo;
            if (!zeichensatz[op.rolle].has(g.ch.codePointAt(0))) {
              const alt = await font('text');
              if (zeichensatz.text.has(g.ch.codePointAt(0))) fx = alt; else { fehlend.add(g.ch); continue; }
            }
            page.drawText(g.ch, { x: X(g.x), y: Y(g.base), size: op.gr * MM, font: fx, color: rgb(...hex(op.farbe)), opacity: op.deck });
          }
        }
      }
      if (o.marken) {
        const reg = cmyk(1, 1, 1, 1), t = .25, L = 5 * MM, gap = (B + 1) * MM;
        const x0 = (R + B) * MM, x1 = x0 + f.b * MM, y0 = (R + B) * MM, y1 = y0 + f.h * MM;
        for (const [x, sx] of [[x0, -1], [x1, 1]]) for (const [y, sy] of [[y0, -1], [y1, 1]]) {
          page.drawLine({ start: { x: x + sx * gap, y }, end: { x: x + sx * (gap + L), y }, thickness: t, color: reg });
          page.drawLine({ start: { x, y: y + sy * gap }, end: { x, y: y + sy * (gap + L) }, thickness: t, color: reg });
        }
        const fo = await font('mono');
        page.drawText(`${doc.name} · ${DS.FORMATE[doc.formatKey].name} (${f.b} × ${f.h} mm) · Seite ${i + 1} · 3 mm Beschnitt`, { x: x0 + 10 * MM, y: 3.5 * MM, size: 5.5, font: fo, color: reg });
      }
    }
    return { bytes: await pdf.save(), fehlend: [...fehlend] };
  };

  /* ---------- Bild (PNG) ---------- */
  DS.png = async function (M, doc, i, pxBreite) {
    const f = doc.format, ops = await DS.druckplan(M, doc, i, { dpi: 220 });
    const k = pxBreite / f.b, cv = document.createElement('canvas');
    cv.width = Math.round(f.b * k); cv.height = Math.round(f.h * k);
    const g = cv.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0);
    for (const op of ops) {
      g.save(); g.globalAlpha = op.deck ?? 1;
      if (op.art === 'pfad') {
        const p = new Path2D(op.d);
        if (op.fill) { g.fillStyle = op.fill; g.fill(p); }
        if (op.stroke) { g.strokeStyle = op.stroke; g.lineWidth = op.breite; g.stroke(p); }
      } else if (op.art === 'raster') g.drawImage(op.cv, op.x, op.y, op.w, op.h);
      else if (op.art === 'zeichen') {
        g.translate(op.x, op.y); g.scale(op.k, op.k); g.fillStyle = op.farbe;
        for (const d of DS.zz(M, op).pfade) g.fill(new Path2D(d));
      } else if (op.art === 'text') {
        g.fillStyle = op.farbe; g.font = `${op.gr}px 'DS-${op.rolle}'`; g.textBaseline = 'alphabetic';
        if (op.schatten) {   // Kopfzeile wie Rudi (29.10.): Hof weit ausserhalb, harter Schatten, Schrift ohne Weichzeichner darüber
          const T = DS.kopfTiefe(op.farbe, op.schatten, op.gr);
          if (T.glow) { g.save(); g.shadowColor = T.glow; g.shadowBlur = T.blur * k; g.shadowOffsetX = 9999 * k; g.fillStyle = '#000'; for (const gl of op.glyphen) g.fillText(gl.ch, gl.x - 9999, gl.base); g.restore(); }
          g.save(); g.fillStyle = T.hart; for (const gl of op.glyphen) g.fillText(gl.ch, gl.x + T.dx, gl.base + T.dy); g.restore();
        }
        for (const gl of op.glyphen) g.fillText(gl.ch, gl.x, gl.base);
      }
      g.restore();
    }
    return new Promise(ok => cv.toBlob(ok, 'image/png'));
  };

  /* ---------- Druckprüfung ---------- */
  /* Lage der gemalten Kopfzeile in Rudis Illustrationen und ganzen Plakaten (motive.json, kopf_box/ganz_kopf_box; Robert 29.10.2026: «dann macht es ja keinen
     Sinn, jetzt die Schrift da so abzuschneiden»). Anteile des Bilds, oben links 0 0. */
  DS.kopfBox = key => { const l = (window.DSPlakat && DSPlakat.motive && DSPlakat.motive()) || []; for (const m of l) { if (m.key === key) return m.kopf_box; if (m.ganz === key) return m.ganz_kopf_box; } return null; };
  /* Stilprüfung gegen das Stilblatt des Hauses (haeuser/<haus>/stilblatt.json, Gestaltungs-Chat; Robert 29.10.2026: «Das ist ja gar nicht der Stil, wieso haben wir
     da keine Sicherung eingebaut, dass sowas erkannt wird?»). Prüft je Seite: Versalien in Titeln, Trennzeichen, fremde Rollen, eine Mittelachse, Zierzeichen,
     Mindestgrade je Format, höchstens eine Wortmarke, Löcher (grösste leere Höhe zwischen Elementen im Rahmen). Jeder Verstoss ist ein roter Befund «Stil: …». */
  DS.STIL = null;
  const stilLaden = () => { const b = DS.M && DS.M.basis; if (!b || DS.STIL) return; fetch(b + 'stilblatt.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => { DS.STIL = j; document.dispatchEvent(new Event('ds:stil')); }).catch(() => {}); };
  if (window.DS && DS.M) stilLaden(); document.addEventListener('ds:bereit', stilLaden);
  const KLASSE = { titel: 'titel', text: 'text', kursiv: 'text', mono: 'etikett' };
  DS.stilPruefe = function (M, doc, st) {
    st = st || DS.STIL; if (!st) return [];
    const out = [], f = doc.format, mehr = doc.seiten.length > 1, erlaubt = ['titel', 'kapitale', 'text', 'kursiv', 'mono', 'plakat', 'plakatfett', 'detail', 'kopf'];
    const ZIER = (st.schmuck && st.schmuck.zierzeichen_verboten || []).filter(z => z.toLowerCase() !== 'x');
    const minFormat = (st.mindestgrade_mm || {})[doc.formatKey];
    const minFuer = aufbau => { for (const z of Object.values(st.mindestgrade_zweck || {})) if ((z.aufbau || []).includes(aufbau) && (st.mindestgrade_mm || {})[z.wie]) return st.mindestgrade_mm[z.wie]; return minFormat; };   // Stilblatt mindestgrade_zweck (29.10.)
    doc.seiten.forEach((s, i) => {
      const seite = mehr ? `Seite ${i + 1}: ` : '', aufbau = s.quelle && s.quelle.vorlage, min = minFuer(aufbau), kurz = el => `«${String(el.text || '').replace(/\s+/g, ' ').slice(0, 30)}${(el.text || '').length > 30 ? '…' : ''}»`;
      const auf = el => el.x < f.b && el.x + (el.w || 0) > 0 && el.y < f.h && el.y + (el.h || DS.elHoehe(M, el) || 0) > 0;
      const texte = s.el.filter(el => el.typ === 'text' && auf(el) && String(el.text || '').trim());
      const rot = (el, t) => out.push({ stufe: 'rot', id: el ? el.id : null, seite: i, stil: true, text: `${seite}Stil: ${t}` });
      for (const el of texte) {
        const t = String(el.text), buch = t.replace(/[^A-Za-zÄÖÜäöüß]/g, '');
        if (!erlaubt.includes(el.rolle)) rot(el, `${kurz(el)} hat eine fremde Schriftrolle (${el.rolle || 'keine'})`);
        if ((st.verboten && st.verboten.versalien_in_rolle || []).includes(el.rolle) && buch.length >= 4 && buch === buch.toUpperCase()) rot(el, `${kurz(el)} steht in Versalien; Titel und Gerichte setzt das Haus nie in Versalien`);
        if (['titel', 'text', 'kursiv'].includes(el.rolle) && / \/ /.test(t)) rot(el, `${kurz(el)} trennt mit «/»; «/» gehört nur in Rudis Zeilen, Gänge trennt das Haus mit «|»`);
        const z = ZIER.find(c => t.includes(c)); if (z) rot(el, `${kurz(el)} enthält das Zierzeichen «${z}»; Schmuck ist nur das «C» des Hauses`);
        // «x» nie als Zier- oder Trennzeichen (Stilblatt 29.10.); erlaubt nur als Teil eines Namens in Versalien («MOMO X RUDI»)
        const ohneNamen = t.replace(/\bmomo\s+[x×]\s+[A-Za-zÄÖÜäöüß]+/gi, '');   // Namen des Bands: «MOMO X RUDI», «Momo x Christoph» (Oberchef 29.10.)
        if (/(^|\s)[xX×](\s|$)/.test(ohneNamen)) rot(el, `${kurz(el)} trennt mit «x»; «x» ist im Haus kein Zier- oder Trennzeichen (nur im Namen MOMO X RUDI)`);
      }
      // eine Achse: Text mittig (ausser in den Aufbauten mit eigener Achse und Zeitleisten in DM Mono)
      const ach = st.achse || {}; if (!(ach.ausnahmen_aufbau || []).includes(aufbau)) {
        const links = texte.filter(el => el.ausr === 'l'), lx0 = Math.min(...links.map(el => el.x)), lx1 = Math.max(...links.map(el => el.x + el.w));
        const zeitleiste = aufbau === 'aushang' && links.length > 1 && Math.abs((lx0 + lx1) / 2 - f.b / 2) <= Math.max(ach.mittig_toleranz_mm || .8, f.b * .02);   // Uhrzeit und Schritt als Block (Gestaltung 29.10.)
        const uhr = texte.filter(el => el.rolle === 'mono' && el.ausr === 'l'), hoch = el => el.h || DS.elHoehe(M, el) || 0;
        const nebenUhr = el => uhr.some(m => m !== el && el.y < m.y + hoch(m) && m.y < el.y + hoch(el));   // auf derselben Höhe wie eine linksbündige Uhrzeit: Teil der Zeitleiste
        /* quer zweispaltig («Bild im Rahmen», «Bild und Text»): Bild links, Text rechts; die Achse ist die Mitte der Textspalte (Gestaltung 29.10.) */
        const bildEl = s.el.find(el => el.typ === 'bild' && auf(el) && el.w < f.b * .75), mitten = texte.filter(el => el.ausr === 'c').map(el => el.x + el.w / 2).sort((p, q) => p - q);
        const achseX = f.b > f.h && ['fenster', 'geteilt'].includes(aufbau) && bildEl && mitten.length ? mitten[Math.floor(mitten.length / 2)] : f.b / 2;
        /* zweispaltig quer (Stilblatt achse.zweispaltig_quer, Einladung und Rückseite in A6/DL quer, Gestaltung 30.10.): zwei Achsen, die Mitten der linken
           und der rechten Textgruppe; jeder Text gehört zu der Gruppe, auf deren Seite seine Mitte liegt */
        const zq = ach.zweispaltig_quer, zwei = zq && (zq.aufbauten || []).includes(aufbau) && (zq.formate || []).includes(doc.formatKey);
        const gruppe = l => l.length ? (Math.min(...l.map(el => el.x)) + Math.max(...l.map(el => el.x + el.w))) / 2 : f.b / 2;
        const zl = zwei ? texte.filter(el => el.x + el.w / 2 < f.b / 2) : [], zr = zwei ? texte.filter(el => el.x + el.w / 2 >= f.b / 2) : [], axL = gruppe(zl), axR = gruppe(zr);
        for (const el of texte) { if (el.rolle === 'mono' && el.ausr === 'l') continue; if (zeitleiste && el.ausr === 'l') continue; if (el.ausr === 'l' && nebenUhr(el)) continue;
          const ab = Math.abs(el.x + el.w / 2 - (zwei ? (zl.includes(el) ? axL : axR) : achseX));
          if (el.ausr && el.ausr !== 'c') rot(el, `${kurz(el)} steht ${el.ausr === 'l' ? 'linksbündig' : 'rechtsbündig'} auf einer mittigen Seite; das Haus setzt auf eine Mittelachse`);
          else if (ab > (ach.mittig_toleranz_mm || .8)) rot(el, `${kurz(el)} steht ${Math.round(ab * 10) / 10} mm neben der Mittelachse`); } }
      // Mindestgrade je Format: grösster Titel, jeder Text, jedes Etikett
      if (min) {
        const titel = texte.filter(el => el.rolle === 'titel').sort((a, b) => b.gr - a.gr)[0];
        if (titel && titel.gr < min.titel - .01) rot(titel, `Titel ${kurz(titel)} ist ${titel.gr.toFixed(2)} mm gross, mindestens ${min.titel} mm`);
        for (const el of texte) { const k = KLASSE[el.rolle]; if ((k === 'text' || k === 'etikett') && el.gr < min[k] - .01) rot(el, `${kurz(el)} ist ${el.gr.toFixed(2)} mm gross, mindestens ${min[k]} mm`);
          if (el.rolle === 'detail' && el.gr < 2.1 - .01) rot(el, `${kurz(el)} ist ${el.gr.toFixed(2)} mm gross, mindestens 2.1 mm (Drinks unter dem Gericht, eine Stufe kleiner)`); }   // Gestaltung 29.10.
      }
      // Marke: höchstens eine Wortmarke je Seite
      const wm = s.el.filter(el => el.typ === 'zeichen' && el.z === 2 && auf(el)).length; if (wm > ((st.marke || {}).wortmarke_je_seite_max || 1)) rot(null, `${wm} Wortmarken auf einer Seite, höchstens eine`);
      // Komposition (stilblatt.komposition): Kopf- und Fusszeile (oberste/unterste Zeile in DM Mono) sind Rahmen; dazwischen keine Löcher über
      // loch_max_textzeilen, Füllung mindestens fuellung_min, Gruppenmitte auf der optischen Mitte (4 % über der geometrischen) ± toleranz_mitte_anteil
      const ko = st.komposition || {}, rahmen = s.el.find(el => el.typ === 'rahmen'), o = rahmen ? rahmen.y : 0, u = rahmen ? rahmen.y + rahmen.h : f.h;
      const belegt = s.el.filter(el => auf(el) && el.typ !== 'rahmen' && !((el.typ === 'flaeche' || el.typ === 'bild') && el.x <= .5 && el.y <= .5 && el.x + (el.w || 0) >= f.b - .5 && el.y + (el.h || 0) >= f.h - .5))   // nur randlose Hintergründe zählen nicht
        .map(el => ({ el, a: Math.max(o, el.y), b: Math.min(u, el.y + (el.h || DS.elHoehe(M, el) || 0)) })).filter(x => x.b > x.a).sort((p, q) => p.a - q.a);
      const txt = texte.filter(el => KLASSE[el.rolle] === 'text').map(el => el.gr).sort((p, q) => p - q), zeile = (txt.length ? txt[Math.floor(txt.length / 2)] : (min ? min.text : 3)) * 1.35;
      /* Kopf- oder Fusszeile ist eine Zeile in DM Mono nur, wenn sie höchstens 12 % der kurzen Seite vom Rahmen steht und mehr als 2,5 Textzeilen Abstand zur
         nächsten Zeile hat; ein Etikett mitten in der Gruppe («CULINARIUM» unter dem C, «@culinarium_hannover») gehört zur Gruppe (Gestaltung 29.10.) */
      const kurzS = Math.min(f.b, f.h), lm0 = ko.loch_max_textzeilen || 2.5;
      const istMono = x => x && x.el.typ === 'text' && x.el.rolle === 'mono' && (x.b - x.a) < 3 * zeile;
      let innen = belegt, oben = o, unten = u;
      if (belegt.length > 2 && istMono(belegt[0]) && belegt[0].a - o <= .12 * kurzS && belegt[1].a - belegt[0].b > lm0 * zeile) { oben = belegt[0].b; innen = innen.slice(1); }   // Kopfzeile
      const le = innen[innen.length - 1], vl = innen[innen.length - 2];
      if (innen.length > 2 && istMono(le) && u - le.b <= .12 * kurzS && le.a - Math.max(...innen.slice(0, -1).map(x => x.b)) > lm0 * zeile) { unten = le.a; innen = innen.slice(0, -1); }   // Fusszeile
      // nur Kopf- oder nur Fusszeile: die fehlende gilt gespiegelt im selben Abstand vom Rahmen (Stilblatt: Kopf und Fuss gleich weit vom Rahmen)
      const hatKopf = oben !== o, hatFuss = unten !== u;
      if (hatFuss && !hatKopf) oben = Math.min(o + (u - unten), innen.length ? innen[0].a : oben);
      if (hatKopf && !hatFuss) unten = Math.max(u - (oben - o), innen.length ? Math.max(...innen.map(x => x.b)) : unten);
      if (innen.length > 1 && !((st.achse || {}).ausnahmen_aufbau || []).includes(aufbau)) {   // Aufbauten mit eigener Ordnung (Rückseite der Plakate, geteilt …) setzen ihre Teile bewusst auseinander
        let ende = innen[0].b, loch = 0; for (const x of innen.slice(1)) { loch = Math.max(loch, x.a - ende); ende = Math.max(ende, x.b); }
        const lm = ko.loch_max_textzeilen || 2.5;
        if (loch > lm * zeile) rot(null, `Loch im Satz: ${Math.round(loch)} mm leer zwischen zwei Teilen (${(loch / zeile).toFixed(1)} Textzeilen, höchstens ${lm})`);
        const frei = unten - oben, g0 = innen[0].a, g1 = Math.max(...innen.map(x => x.b)), fuell = (g1 - g0) / frei;
        if (ko.fuellung_min && frei > 0 && fuell < ko.fuellung_min) rot(null, `Der Satz füllt nur ${(fuell * 100).toFixed(1).replace('.', ',')} % der Höhe zwischen Kopf und Fuss, mindestens ${Math.round(ko.fuellung_min * 100)} %`);
        const ziel = oben + frei / 2 - .04 * frei, ab = ((g0 + g1) / 2 - ziel) / frei;
        if (ko.toleranz_mitte_anteil && Math.abs(ab) > ko.toleranz_mitte_anteil) rot(null, `Die Gruppe sitzt ${Math.round(Math.abs(ab) * 100)} % der freien Höhe ${ab > 0 ? 'unter' : 'über'} der optischen Mitte`);
      }
    });
    return out;
  };
  /* Formate je Aufbau (Oberchef 29.10.): DS.VORLAGEN[k].formate kommt aus haeuser/<haus>/dokumente.js. Fehlt die Angabe, passt jedes Format.
     DS.kombinationen() ist die Liste, die eine Prüfung über alle Aufbauten und Formate durchgeht: nur, was es im Reiter «Vorlagen» gibt. */
  DS.formatPasst = (k, fk) => { const f = DS.VORLAGEN[k] && DS.VORLAGEN[k].formate; return !!DS.FORMATE[fk] && (!f || f.includes(fk)); };
  DS.kombinationen = () => Object.keys(DS.VORLAGEN).flatMap(k => Object.keys(DS.FORMATE).filter(fk => DS.formatPasst(k, fk)).map(fk => [k, fk]));

  DS.pruefe = function (M, doc) {
    const out = [], f = doc.format, B = DS.B, Sx = DS.SICHER, digital = DS.FORMATE[doc.formatKey]?.digital;
    doc.seiten.forEach((s, i) => {
      const seite = doc.seiten.length > 1 ? `Seite ${i + 1}: ` : '';
      for (const el of s.el) {
        const h = DS.elHoehe(M, el), kurz = el.typ === 'text' ? `«${el.text.replace(/\s+/g, ' ').slice(0, 34)}${el.text.length > 34 ? '…' : ''}»` : { bild: 'Foto', flaeche: 'Fläche', linie: 'Linie', rahmen: 'Rahmen', zeichen: 'Zeichen' }[el.typ];
        if (el.typ === 'bild' && M.bildIndex[el.bild]) {   // Kennzeichnung wie in Le Livre
          const bi = M.bildIndex[el.bild];
          if (bi.ki) out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}Foto mit KI erzeugt («${bi.alt}»): zeigt kein echtes Gericht oder Getränk des Hauses. Für Werbung nur mit Hinweis oder nach einem echten Foto.` });
          else if (bi.herkunft === 'frei') out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}Foto frei lizenziert (${bi.quelle}): Urheber und Lizenz beim Foto oder im Impressum nennen.` });
        }
        if (el.typ === 'text') {
          const ph = el.text.match(/\[[^\]]*\]/g);
          const gut = ['gutschein', 'gutscheinrueck'].includes(s.quelle && s.quelle.vorlage);   // Gutschein: [Datum], [Preis], C-[0000] legt das Haus noch fest (29.10.)
          if (ph) out.push(gut ? { stufe: 'gelb', id: el.id, seite: i, text: `${seite}Platzhalter ${ph.join(', ')}: legt das Haus noch fest, vor dem Druck eintragen` } : { stufe: 'rot', id: el.id, seite: i, text: `${seite}Platzhalter ${ph.join(', ')} noch ausfüllen` });
          if (!el.text.trim()) out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}leeres Textfeld` });
          if (!digital && (el.x < Sx - .01 || el.y < Sx - .01 || el.x + el.w > f.b - Sx + .01 || el.y + h > f.h - Sx + .01))
            out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}${kurz} liegt näher als ${Sx} mm am Rand und kann beim Schneiden angeschnitten werden` });
        }
        if ((el.typ === 'bild' || el.typ === 'flaeche') && !digital) {
          const zuKurz = (a, b) => a > -B + .05 && a < .6 && b > 0;   // berührt den Rand, reicht aber nicht in den Beschnitt
          if (zuKurz(el.x, el.w) || zuKurz(el.y, h) || zuKurz(f.b - (el.x + el.w), el.w) || zuKurz(f.h - (el.y + h), h))
            out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}${kurz} endet am Rand, ohne 3 mm in den Beschnitt zu reichen (weisser Blitzer möglich)` });
        }
        if (el.typ === 'bild') {
          const b = M.bildIndex[el.bild];
          if (!b) { out.push({ stufe: 'rot', id: el.id, seite: i, text: `${seite}Foto fehlt` }); continue; }
          const px = b.druck || b, a = DS.ausschnitt(el, px.w, px.h), dpi = (px.w / a.bw) * 25.4;
          const kb = DS.kopfBox(el.bild);
          if (kb) {   // sichtbarer Teil des Motivs auf der Seite (der Beschnitt fällt weg); die gemalte Kopfzeile muss ganz darin liegen
            const u = x => (x - el.x - a.x) / a.bw, v = y => (y - el.y - a.y) / a.bh, t = .004;
            const u0 = u(Math.max(el.x, 0)), u1 = u(Math.min(el.x + el.w, f.b)), v0 = v(Math.max(el.y, 0)), v1 = v(Math.min(el.y + h, f.h));
            if (kb[0] < u0 - t || kb[2] > u1 + t || kb[1] < v0 - t || kb[3] > v1 + t)
              out.push({ stufe: 'rot', id: el.id, seite: i, text: `${seite}Die gemalte Kopfzeile «WALK ON THE WILD SIDE» im Motiv ist angeschnitten. Motiv kleiner ziehen oder den Ausschnitt verschieben, bis sie ganz zu sehen ist` });
          }
          const plakat = Math.min(f.b, f.h) >= 297;   // ab A3: Plakat, wird aus Abstand gesehen, 150 dpi genügen (so sagt es der gelbe Hinweis selbst)
          if (dpi < 150) out.push({ stufe: 'rot', id: el.id, seite: i, text: `${seite}Foto «${b.key}» hat im Druck nur ${Math.round(dpi)} dpi und wird unscharf (kleiner ziehen oder weniger vergrössern)` });
          else if (dpi < 220 && !digital && !plakat) out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}Foto «${b.key}» hat ${Math.round(dpi)} dpi: für Plakate aus Abstand gut, für Karten aus der Nähe knapp` });
        }
        if (el.x > f.b + B || el.y > f.h + B || el.x + el.w < -B || el.y + h < -B)
          out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}${kurz} liegt ausserhalb der Seite` });
      }
    });
    return out.concat(DS.stilPruefe(M, doc));
  };
})();
