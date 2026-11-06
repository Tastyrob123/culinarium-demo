/* Drucksachen-Studio · Vorlagen: elf Grundaufbauten im Hausstil. Jede Vorlage bekommt Format, Ton und Inhalt
   und setzt daraus frei verschiebbare Elemente. Alle Grössen wachsen mit dem Format, damit dieselbe Drucksache
   als A6-Karte und als A3-Plakat stimmt. Elemente tragen ihren «slot», damit Textänderungen beim Umsetzen bleiben. */
(function () {
  const DS = window.DS;
  let zaehler = 0;
  const neueId = () => 'e' + (Date.now() % 1e7).toString(36) + (zaehler++).toString(36);
  DS.neueId = neueId;

  const STIL = {
    titel: { zeile: 1.06, sperr: 0 },
    mono: { zeile: 1.6, sperr: .08, gross: true },
    kapitale: { zeile: 1.3, sperr: .08, gross: true },
    text: { zeile: 1.5, sperr: 0 },
    kursiv: { zeile: 1.5, sperr: 0 },
  };
  DS.STIL = STIL;

  /* stil (Vorlagen-Bibliothek, Robert 12.10.2026): rahmen 'ohne'|'einfach'|'doppelt', ausr 'c'|'l', titel 0.8–1.25, zeichen 0.6–1.5, bild 0.38–0.66 (Bildanteil) */
  function ctx(M, fmt, ton, stil) {
    const w = fmt.b, h = fmt.h, s = Math.sqrt(w * h / (105 * 148)), s8 = Math.pow(s, .8);
    const T = M.toene[ton] || M.toene.dunkel;
    const m = Math.max(7, 8 * s8);
    return { M, w, h, s, s8, T, m, ton, el: [], quer: w > h * 1.15, stil: stil || {}, rahmenZahl: 0 };
  }

  function tx(c, rolle, text, w, gr, farbe, o = {}) {
    const el = Object.assign({ id: neueId(), typ: 'text', rolle, text: String(text), x: o.x ?? (c.w - w) / 2, y: 0, w, gr: +gr.toFixed(2), farbe, ausr: 'c', deck: 1 }, STIL[rolle], o);
    el.h = DS.mess(el).h;
    return el;
  }
  const linie = (c, L, o = {}) => Object.assign({ id: neueId(), typ: 'linie', x: (c.w - L) / 2, y: 0, w: L, h: 0, staerke: .3, farbe: c.T.linie, deck: 1 }, o);
  const zeichen = (c, zw, o = {}) => { zw *= Math.min(1.6, Math.max(.5, c.stil.zeichen || 1)); return Object.assign({ id: neueId(), typ: 'zeichen', x: (c.w - zw) / 2, y: 0, w: zw, farbe: c.T.zeichen, deck: 1 }, o); };
  const hoehe = (c, el) => el.typ === 'zeichen' ? el.w * DS.zz(c.M, el).verh : el.typ === 'linie' ? el.staerke : el.h;

  /* Stapel: [element | zahl(abstand)] von oben nach unten setzen */
  function stapelHoehe(c, items) {
    let y = 0;
    for (const it of items) y += typeof it === 'number' ? it : hoehe(c, it);
    return y;
  }
  function stapel(c, items, y) {
    let lastGap = 0;
    for (const it of items) {
      if (typeof it === 'number') { y += it; lastGap = it; continue; }
      it.y = +y.toFixed(2); y += hoehe(c, it); c.el.push(it);
    }
    return y;
  }
  function stapelMitte(c, items, y0, y1) {
    let H = stapelHoehe(c, items);
    // Zu wenig Platz: Schrift und Abstände gemeinsam verkleinern, bis der Stapel passt (höchstens auf 60 %)
    for (let n = 0; n < 6 && H > (y1 - y0) + .05; n++) {
      const f = Math.max(.82, (y1 - y0) / H);
      items = items.map(it => {
        if (typeof it === 'number') return it * f;
        if (it.typ === 'text' && it.gr * f >= (it._gr0 || it.gr) * .6) { it._gr0 = it._gr0 || it.gr; it.gr = +(it.gr * f).toFixed(2); it.h = DS.mess(it).h; }
        return it;
      });
      H = stapelHoehe(c, items);
    }
    items.forEach(it => { if (it && it._gr0) delete it._gr0; });
    return stapel(c, items, Math.max(y0, y0 + (y1 - y0 - H) / 2));
  }
  /* Leere Felder und ihre Abstände aus einem Stapel entfernen */
  function sauber(items) {
    const out = [];
    for (const it of items) {
      if (it == null || it === false || it === '') { if (typeof out[out.length - 1] === 'number') out.pop(); continue; }
      out.push(it);
    }
    while (typeof out[0] === 'number') out.shift();
    while (typeof out[out.length - 1] === 'number') out.pop();
    return out;
  }

  function grund(c, seite, farbe, tapete) {
    seite.grund = farbe || c.T.grund;
    seite.tapete = tapete === undefined ? c.T.tapete : tapete;
  }
  function rahmen(c, inset, staerke = .25, deck = .75) {
    const r = inset ?? Math.max(4.5, 5 * c.s8);
    c.rahmenZahl++;
    if (c.stil.rahmen === 'ohne') return r;
    const ecke = c.stil.ecke ?? 2.2;
    c.el.push({ id: neueId(), typ: 'rahmen', x: r, y: r, w: c.w - 2 * r, h: c.h - 2 * r, staerke, r: ecke * c.s8, farbe: c.T.linie, deck });
    if (c.stil.rahmen === 'doppelt' && c.rahmenZahl === 1) { const r2 = r + 1.3 * c.s8; c.el.push({ id: neueId(), typ: 'rahmen', x: r2, y: r2, w: c.w - 2 * r2, h: c.h - 2 * r2, staerke: .15, r: Math.max(0, ecke - 1) * c.s8, farbe: c.T.linie, deck: deck * .8 }); }
    return r;
  }
  function foto(c, key, x, y, w, h, o = {}) {
    const el = Object.assign({ id: neueId(), typ: 'bild', bild: key, x, y, w, h, fx: .5, fy: .5, zoom: 1, slot: 'bild' }, o);
    c.el.push(el); return el;
  }
  function fuss(c, i, farbe, y1) {
    const t = i.fuss === undefined || i.fuss === null ? `${c.M.adr} · ${c.M.tel}` : i.fuss;
    if (!t) return y1 ?? c.h;
    const el = tx(c, 'mono', t, c.w - 2 * c.m - 6, 1.5 * c.s8, farbe || c.T.mono, { slot: 'fuss', deck: .85, sperr: .08 });
    el.y = +((y1 ?? c.h - c.m - 1.5 * c.s8) - el.h).toFixed(2);
    c.el.push(el);
    return el.y;
  }
  const titelGr = (c, t, faktor = 1, breite) => {
    let g = Math.min(9.4 * c.s * faktor * (c.stil.titel || 1), (breite || c.w) / 9.2 * Math.min(1.08, c.stil.titel || 1));
    const L = Math.max(...String(t || '').split('\n').map(z => z.length));
    if (L > 18) g *= .86; if (L > 26) g *= .86;
    return g;
  };

  /* ---------- die Vorlagen ---------- */
  const V = {};

  V.deckel = {
    name: 'Titelblatt', wofuer: 'Deckblatt, Einladung zum Anlass, Karte mit einem starken Titel',
    slots: ['ueber', 'titel*', 'unter', 'text', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const bw = c.w - 2 * (r + 6 * c.s8);
      const zh = Math.min(c.w * .3, 30 * c.s, c.h * .2);
      const items = sauber([
        zeichen(c, zh), 8 * c.s8,
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.9 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 3 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel), c.T.titel, { slot: 'titel' }), 5.5 * c.s8,
        linie(c, 14 * c.s8), 5 * c.s8,
        i.unter && tx(c, 'mono', i.unter, bw, 2.05 * c.s8, c.T.mono, { slot: 'unter' }), 6 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 80 * c.s8), 2.8 * c.s8, c.T.text, { slot: 'text' }),
      ]);
      const yF = fuss(c, i, null, c.h - r - 6 * c.s8);
      stapelMitte(c, items, r + 8 * c.s8, yF - 6 * c.s8);
    },
  };

  V.buehne = {
    name: 'Bild oben', wofuer: 'Flyer und Aushang mit grossem Foto oben, Text darunter; das Zeichen sitzt auf der Naht',
    slots: ['bild*', 'ueber', 'titel*', 'text', 'aktion', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite);
      const ph = c.h * Math.min(.66, Math.max(.38, c.stil.bild || (c.quer ? .5 : .54))), B = DS.B;
      foto(c, i.bild, -B, -B, c.w + 2 * B, ph + B);
      const d = 15 * c.s8;
      c.el.push({ id: neueId(), typ: 'flaeche', x: (c.w - d) / 2, y: ph - d / 2, w: d, h: d, r: d / 2, farbe: seite.grund, tapete: seite.tapete, deck: 1 });
      const zw = d * .6, z = zeichen(c, zw); z.y = ph - zw * c.M.zeichen.verh / 2; c.el.push(z);
      const bw = c.w - 2 * c.m - 6;
      const items = sauber([
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.9 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 2.6 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .82), c.T.titel, { slot: 'titel' }), 4.5 * c.s8,
        linie(c, 12 * c.s8), 4.5 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 86 * c.s8), 2.75 * c.s8, c.T.text, { slot: 'text' }), i.text && 4.5 * c.s8,
        i.aktion && tx(c, 'mono', i.aktion, bw, 2 * c.s8, c.T.mono, { slot: 'aktion' }),
      ]);
      const yF = fuss(c, i);
      stapelMitte(c, items, ph + d / 2 + 4 * c.s8, yF - 5 * c.s8);
    },
  };

  V.ansicht = {
    name: 'Ansichtskarte', wofuer: 'Postkarte: Foto randlos, kleines Schild mit dem Ort. Nur Haus von aussen oder Landschaft',
    slots: ['bild*', 'titel*', 'unter'],
    bau(c, i, seite) {
      grund(c, seite, 'navy', null);
      const B = DS.B;
      foto(c, i.bild, -B, -B, c.w + 2 * B, c.h + 2 * B);
      const dunkel = c.ton !== 'hell';
      const schild = dunkel ? 'papier' : 'navy', tf = dunkel ? 'navy' : 'papier', mf = dunkel ? 'taupe' : 'gold';
      const pad = 4.6 * c.s8, max = c.w * .62;
      const t = tx(c, 'titel', i.titel, max, Math.min(6.4 * c.s8, c.w / 15), tf, { ausr: 'l', slot: 'titel', x: pad });
      const u = i.unter ? tx(c, 'mono', i.unter, max, 1.55 * c.s8, mf, { ausr: 'l', slot: 'unter', x: pad }) : null;
      const bw = Math.max(DS.mess(t).bw, u ? DS.mess(u).bw : 0);
      const sh = pad * 2 + t.h + (u ? u.h + 1.2 * c.s8 : 0), R = 3 * c.s8;
      c.el.push({ id: neueId(), typ: 'flaeche', x: -B - R, y: c.h - sh, w: bw + 2 * pad + B + R + 1, h: sh + B + R, r: R, farbe: schild, tapete: dunkel ? null : 'dunkel', deck: 1 });
      t.w = u ? Math.max(bw + 1, 10) : bw + 1; if (u) u.w = t.w;
      stapel(c, sauber([t, u && 1.2 * c.s8, u]), c.h - sh + pad);
    },
  };

  V.karte = {
    name: 'Karte mit Liste', wofuer: 'Speise-, Getränke-, Behandlungs- oder Preiskarte: Einträge mit Name, Beschreibung, Preis',
    slots: ['ueber', 'titel*', 'text', 'liste*', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const x0 = r + 6 * c.s8, cw = c.w - 2 * x0;
      const kopf = sauber([
        zeichen(c, 10 * c.s8), 5 * c.s8,
        i.ueber && tx(c, 'mono', i.ueber, cw, 1.85 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 2.4 * c.s8,
        tx(c, 'titel', i.titel, cw, titelGr(c, i.titel, .74), c.T.titel, { slot: 'titel' }), 3.6 * c.s8,
        i.text && tx(c, 'kursiv', i.text, Math.min(cw, 80 * c.s8), 2.5 * c.s8, c.T.text, { slot: 'text', deck: .85 }),
      ]);
      const yK = stapel(c, kopf, r + 7 * c.s8) + 5 * c.s8;
      const yF = fuss(c, i, null, c.h - r - 5 * c.s8);
      const liste = (i.liste || []).filter(e => e && (e.name || e.preis));
      const verf = yF - 5 * c.s8 - yK;
      const sp = c.w / c.h > 1.6 && liste.length >= 3 ? 2 : 1, sg = 8 * c.s8, sw = (cw - (sp - 1) * sg) / sp;
      const baueListe = (k, luft) => {
        const els = []; let H = 0;
        const pw = Math.max(0, ...liste.map(e => e.preis ? DS.mess({ typ: 'text', rolle: 'mono', text: e.preis, w: 200, gr: 1.95 * c.s8 * k, ...STIL.mono, sperr: .08 }).bw : 0));
        const proSpalte = Math.ceil(liste.length / sp);
        for (let s0 = 0; s0 < sp; s0++) {
          const xs = x0 + s0 * (sw + sg), teil = liste.slice(s0 * proSpalte, (s0 + 1) * proSpalte);
          let y = 0;
          teil.forEach((e, j) => {
            const n = s0 * proSpalte + j, row = [];
            const nw = sw - (pw ? pw + 4 * c.s8 : 0);
            const nm = tx(c, 'titel', e.name || '', nw, 4.05 * c.s8 * k, c.T.titel, { ausr: 'l', x: xs, slot: `liste.${n}.name`, zeile: 1.12 });
            nm.y = y; row.push(nm);
            if (e.preis) {
              const p = tx(c, 'mono', e.preis, pw + 1, 1.95 * c.s8 * k, c.T.mono, { ausr: 'r', x: xs + sw - pw - 1, slot: `liste.${n}.preis`, sperr: .08 });
              p.y = y + (nm.gr * 1.12 - p.gr * 1.6) / 2 + .15 * c.s8 * k; row.push(p);
            }
            let yy = y + nm.h;
            if (e.detail) {
              const dt = tx(c, 'text', e.detail, nw, 2.3 * c.s8 * k, c.T.text, { ausr: 'l', x: xs, slot: `liste.${n}.detail`, deck: .78, zeile: 1.42 });
              dt.y = yy + .7 * c.s8 * k; row.push(dt); yy = dt.y + dt.h;
            }
            yy += 2.4 * c.s8 * k * luft;
            if (j < teil.length - 1) { row.push(linie(c, sw, { x: xs, y: yy, staerke: .15, deck: .4 })); yy += 2.4 * c.s8 * k * luft; }
            els.push(...row); y = yy;
          });
          H = Math.max(H, y);
        }
        return { els, H };
      };
      let k = 1, L = baueListe(k, 1);
      for (let n = 0; n < 8 && L.H > verf; n++) { k *= Math.max(.6, Math.sqrt(verf / L.H)) * .99; L = baueListe(k, 1); }
      if (L.H < verf * .7) { k = Math.min(1.35, Math.sqrt(verf * .8 / L.H)); L = baueListe(k, 1); if (L.H > verf) { k *= Math.sqrt(verf / L.H) * .98; L = baueListe(k, 1); } }
      if (L.H < verf * .85 && liste.length > sp) { const luft = Math.min(2.2, 1 + (verf * .92 - L.H) / (Math.ceil(liste.length / sp) * 4.8 * c.s8 * k)); L = baueListe(k, luft); }
      const dy = yK + Math.max(0, (verf - L.H) / 2) * .6;
      L.els.forEach(e => { e.y = +(e.y + dy).toFixed(2); c.el.push(e); });
    },
  };

  V.einladung = {
    name: 'Einladung', wofuer: 'Einladung zu Fest, Dinner, Hochzeit, Anlass: wann, wo, Bitte um Antwort',
    slots: ['ueber', 'titel*', 'wann', 'wo', 'text', 'aktion'],
    bau(c, i, seite) {
      grund(c, seite);
      const r = rahmen(c, null, .35, .85); rahmen(c, r + 1.4 * c.s8, .15, .6);
      const bw = c.w - 2 * (r + 8 * c.s8);
      const items = sauber([
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.9 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 5 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .95), c.T.titel, { slot: 'titel' }), 6 * c.s8,
        linie(c, 14 * c.s8), 6 * c.s8,
        i.wann && tx(c, 'mono', i.wann, bw, 2.45 * c.s8, c.T.titel, { slot: 'wann', sperr: .08 }), i.wann && 2 * c.s8,
        i.wo && tx(c, 'kursiv', i.wo, bw, 2.6 * c.s8, c.T.text, { slot: 'wo' }), 6 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 78 * c.s8), 2.7 * c.s8, c.T.text, { slot: 'text' }), i.text && 6 * c.s8,
        i.aktion && tx(c, 'mono', i.aktion, bw, 1.75 * c.s8, c.T.mono, { slot: 'aktion' }),
      ]);
      const z = zeichen(c, 9 * c.s8); z.y = c.h - r - 7 * c.s8 - hoehe(c, z); c.el.push(z);
      stapelMitte(c, items, r + 9 * c.s8, z.y - 6 * c.s8);
    },
  };

  V.programm = {
    name: 'Programm', wofuer: 'Termine, Veranstaltungen, Tagesablauf, Jahresprogramm: Datum, Titel, Ort',
    slots: ['ueber', 'titel*', 'termine*', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const x0 = r + 7 * c.s8, cw = c.w - 2 * x0;
      const kopf = sauber([
        i.ueber && tx(c, 'mono', i.ueber, cw, 1.85 * c.s8, c.T.mono, { slot: 'ueber', ausr: 'l', x: x0 }), i.ueber && 2.6 * c.s8,
        tx(c, 'titel', i.titel, cw, titelGr(c, i.titel, .8), c.T.titel, { slot: 'titel', ausr: 'l', x: x0 }), 4.4 * c.s8,
        linie(c, 14 * c.s8, { x: x0 }),
      ]);
      const yK = stapel(c, kopf, r + 9 * c.s8) + 7 * c.s8;
      const z = zeichen(c, 8 * c.s8, { x: c.w - x0 - 8 * c.s8 });
      const yF = fuss(c, Object.assign({}, i, {}), null, c.h - r - 5 * c.s8);
      const verf = yF - 6 * c.s8 - yK;
      const ter = (i.termine || []).filter(t => t && (t.was || t.wann));
      const sp = c.w / c.h > 1.6 && ter.length >= 3 ? 2 : 1, sg = 8 * c.s8, sw = (cw - (sp - 1) * sg) / sp, proSpalte = Math.ceil(ter.length / sp);
      const baue = (k, luft) => {
        const els = []; let H = 0;
        for (let s0 = 0; s0 < sp; s0++) {
          const xs = x0 + s0 * (sw + sg); let y = 0;
          ter.slice(s0 * proSpalte, (s0 + 1) * proSpalte).forEach((t, j) => {
            const n = s0 * proSpalte + j;
            if (t.wann) { const a = tx(c, 'mono', t.wann, sw, 1.8 * c.s8 * k, c.T.mono, { ausr: 'l', x: xs, slot: `termine.${n}.wann` }); a.y = y; els.push(a); y += a.h + .6 * c.s8 * k; }
            if (t.was) { const b = tx(c, 'titel', t.was, sw, 4.3 * c.s8 * k, c.T.titel, { ausr: 'l', x: xs, slot: `termine.${n}.was`, zeile: 1.12 }); b.y = y; els.push(b); y += b.h; }
            if (t.wo) { const d = tx(c, 'text', t.wo, sw, 2.3 * c.s8 * k, c.T.text, { ausr: 'l', x: xs, slot: `termine.${n}.wo`, deck: .75 }); d.y = y + .5 * c.s8 * k; els.push(d); y = d.y + d.h; }
            y += 4.6 * c.s8 * k * luft;
          });
          H = Math.max(H, y - 4.6 * c.s8 * k * luft);
        }
        return { els, H };
      };
      let k = 1, L = baue(k, 1);
      for (let n = 0; n < 8 && L.H > verf; n++) { k *= Math.max(.6, Math.sqrt(verf / L.H)) * .99; L = baue(k, 1); }
      if (L.H < verf * .7) { k = Math.min(1.35, Math.sqrt(verf * .8 / L.H)); L = baue(k, 1); if (L.H > verf) { k *= Math.sqrt(verf / L.H) * .98; L = baue(k, 1); } }
      if (L.H < verf * .85 && ter.length > sp) L = baue(k, Math.min(2, 1 + (verf * .92 - L.H) / (proSpalte * 4.6 * c.s8 * k)));
      L.els.forEach(e => { e.y = +(e.y + yK).toFixed(2); c.el.push(e); });
      void z;
    },
  };

  V.fenster = {
    name: 'Bild im Rahmen', wofuer: 'Foto mit Passepartout auf der Fläche, darunter Titel und Text; ruhig und edel',
    slots: ['bild*', 'ueber', 'titel*', 'unter', 'text', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite);
      const m = c.m + 1;
      if (c.quer) {
        const pw = c.w * .5 - m, ph = c.h - 2 * m;
        foto(c, i.bild, m, m, pw, ph);
        c.el.push({ id: neueId(), typ: 'rahmen', x: m - 1.6 * c.s8, y: m - 1.6 * c.s8, w: pw + 3.2 * c.s8, h: ph + 3.2 * c.s8, staerke: .25, r: 0, farbe: c.T.linie, deck: .8 });
        const x0 = c.w * .5 + 6 * c.s8, bw = c.w - x0 - m;
        const items = sauber([
          i.ueber && tx(c, 'mono', i.ueber, bw, 1.85 * c.s8, c.T.mono, { slot: 'ueber', x: x0 }), i.ueber && 2.6 * c.s8,
          tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .75, bw * 2), c.T.titel, { slot: 'titel', x: x0 }), 4.4 * c.s8,
          linie(c, 12 * c.s8, { x: x0 + (bw - 12 * c.s8) / 2 }), 4.4 * c.s8,
          i.unter && tx(c, 'mono', i.unter, bw, 1.9 * c.s8, c.T.mono, { slot: 'unter', x: x0 }), i.unter && 4 * c.s8,
          i.text && tx(c, 'text', i.text, bw, 2.6 * c.s8, c.T.text, { slot: 'text', x: x0 }),
        ]);
        stapelMitte(c, items, m, c.h - m);
        return;
      }
      const ph = c.h * Math.min(.56, Math.max(.36, (c.stil.bild || .54) * .87));
      foto(c, i.bild, m, m, c.w - 2 * m, ph);
      c.el.push({ id: neueId(), typ: 'rahmen', x: m - 1.6 * c.s8, y: m - 1.6 * c.s8, w: c.w - 2 * m + 3.2 * c.s8, h: ph + 3.2 * c.s8, staerke: .25, r: 0, farbe: c.T.linie, deck: .8 });
      const bw = c.w - 2 * m - 6;
      const items = sauber([
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.85 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 2.6 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .85), c.T.titel, { slot: 'titel' }), 4.5 * c.s8,
        linie(c, 12 * c.s8), 4.5 * c.s8,
        i.unter && tx(c, 'mono', i.unter, bw, 1.95 * c.s8, c.T.mono, { slot: 'unter' }), i.unter && 4 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 84 * c.s8), 2.7 * c.s8, c.T.text, { slot: 'text' }),
      ]);
      const yF = fuss(c, i);
      stapelMitte(c, items, m + ph + 8 * c.s8, yF - 5 * c.s8);
    },
  };

  V.geteilt = {
    name: 'Bild und Text geteilt', wofuer: 'Halb Foto, halb Text; quer nebeneinander, hoch übereinander. Für Restaurant, Wellness, Angebot',
    slots: ['bild*', 'ueber', 'titel*', 'text', 'aktion', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite);
      const B = DS.B;
      if (c.quer) {
        foto(c, i.bild, -B, -B, c.w * .5 + B, c.h + 2 * B);
        const x0 = c.w * .5 + c.m, bw = c.w - x0 - c.m;
        const items = sauber([
          zeichen(c, 9 * c.s8, { x: x0 + (bw - 9 * c.s8) / 2 }), 5 * c.s8,
          i.ueber && tx(c, 'mono', i.ueber, bw, 1.8 * c.s8, c.T.mono, { slot: 'ueber', x: x0 }), i.ueber && 2.6 * c.s8,
          tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .72, bw * 2), c.T.titel, { slot: 'titel', x: x0 }), 4.2 * c.s8,
          linie(c, 12 * c.s8, { x: x0 + (bw - 12 * c.s8) / 2 }), 4.2 * c.s8,
          i.text && tx(c, 'text', i.text, bw, 2.55 * c.s8, c.T.text, { slot: 'text', x: x0 }), i.text && 4 * c.s8,
          i.aktion && tx(c, 'mono', i.aktion, bw, 1.8 * c.s8, c.T.mono, { slot: 'aktion', x: x0 }),
        ]);
        stapelMitte(c, items, c.m, c.h - c.m);
        return;
      }
      const ph = c.h * Math.min(.62, Math.max(.4, c.stil.bild || .5));
      foto(c, i.bild, -B, c.h - ph, c.w + 2 * B, ph + B);
      const x0 = c.m + 2, bw = c.w - 2 * x0;
      const items = sauber([
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.85 * c.s8, c.T.mono, { slot: 'ueber', ausr: 'l', x: x0 }), i.ueber && 2.8 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .9), c.T.titel, { slot: 'titel', ausr: 'l', x: x0 }), 4.6 * c.s8,
        linie(c, 14 * c.s8, { x: x0 }), 4.6 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 90 * c.s8), 2.75 * c.s8, c.T.text, { slot: 'text', ausr: 'l', x: x0 }), i.text && 4.4 * c.s8,
        i.aktion && tx(c, 'mono', i.aktion, bw, 1.95 * c.s8, c.T.mono, { slot: 'aktion', ausr: 'l', x: x0 }),
      ]);
      stapelMitte(c, items, c.m, c.h - ph - c.m);
    },
  };

  V.gutschein = {
    name: 'Gutschein', wofuer: 'Gutschein oder Geschenkkarte mit Wert und Feldern für Für, Von und Nummer',
    slots: ['titel', 'unter', 'wert', 'text', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const titel = i.titel || 'Gutschein';
      const feld = (x, y, w, name, n) => {
        const l = tx(c, 'mono', name, 30, 1.55 * c.s8, c.T.mono, { ausr: 'l', x, slot: null }); l.y = y; c.el.push(l);
        c.el.push(linie(c, w - 12 * c.s8, { x: x + 12 * c.s8, y: y + l.h * .78, staerke: .15, deck: .6 }));
        void n;
      };
      if (c.quer) {
        const zw = Math.min(c.h * .42, c.w * .2);
        const z = zeichen(c, zw, { x: c.w * .17 - zw / 2 }); z.y = (c.h - hoehe(c, z)) / 2; c.el.push(z);
        c.el.push(linie(c, 0, { x: c.w * .33, y: r + 8 * c.s8, w: 0, h: c.h - 2 * r - 16 * c.s8, staerke: .2, deck: .7 }));
        const x0 = c.w * .38, bw = c.w - x0 - r - 8 * c.s8;
        const felder = 3 * 5.4 * c.s8;
        const items = sauber([
          tx(c, 'titel', titel, bw, Math.min(12 * c.s8, c.h / 6.5), c.T.titel, { slot: 'titel', ausr: 'l', x: x0 }), 3.5 * c.s8,
          i.unter && tx(c, 'mono', i.unter, bw, 1.9 * c.s8, c.T.mono, { slot: 'unter', ausr: 'l', x: x0 }), i.unter && 4 * c.s8,
          i.wert && tx(c, 'titel', i.wert, bw, Math.min(7 * c.s8, c.h / 11), c.ton === 'dunkel' ? 'gold' : c.T.titel, { slot: 'wert', ausr: 'l', x: x0 }), i.wert && 3 * c.s8,
          i.text && tx(c, 'text', i.text, bw * .9, 2.3 * c.s8, c.T.text, { slot: 'text', ausr: 'l', x: x0, deck: .85 }),
        ]);
        const yEnd = stapelMitte(c, items, r + 7 * c.s8, c.h - r - 8 * c.s8 - felder - 4 * c.s8);
        let y = Math.max(yEnd + 5 * c.s8, c.h - r - 7 * c.s8 - felder);
        for (const f of ['Für', 'Von', 'Nr.']) { feld(x0, y, bw, f); y += 5.4 * c.s8; }
        return;
      }
      const bw = c.w - 2 * (r + 7 * c.s8), x0 = r + 7 * c.s8;
      const items = sauber([
        zeichen(c, Math.min(26 * c.s8, c.w * .26)), 7 * c.s8,
        tx(c, 'titel', titel, bw, titelGr(c, titel, 1.05), c.T.titel, { slot: 'titel' }), 4.5 * c.s8,
        linie(c, 14 * c.s8), 4.5 * c.s8,
        i.unter && tx(c, 'mono', i.unter, bw, 1.95 * c.s8, c.T.mono, { slot: 'unter' }), i.unter && 5 * c.s8,
        i.wert && tx(c, 'titel', i.wert, bw, 7 * c.s8, c.ton === 'dunkel' ? 'gold' : c.T.titel, { slot: 'wert' }), i.wert && 4 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 70 * c.s8), 2.5 * c.s8, c.T.text, { slot: 'text', deck: .85 }),
      ]);
      const felder = 3 * 6 * c.s8;
      stapelMitte(c, items, r + 8 * c.s8, c.h - r - 10 * c.s8 - felder);
      let y = c.h - r - 8 * c.s8 - felder;
      for (const f of ['Für', 'Von', 'Nr.']) { feld(x0, y, bw, f); y += 6 * c.s8; }
    },
  };

  V.aushang = {
    name: 'Aushang', wofuer: 'Hinweis, Schild, Tischaufsteller, Info für Gäste: Titel und gut lesbarer Text',
    slots: ['ueber', 'titel*', 'text*', 'aktion', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const bw = c.w - 2 * (r + 7 * c.s8);
      const z = zeichen(c, Math.min(15 * c.s8, c.w * .16)); z.y = r + 8 * c.s8; c.el.push(z);
      const items = sauber([
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.95 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 3 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .9), c.T.titel, { slot: 'titel' }), 5 * c.s8,
        linie(c, 14 * c.s8), 5.5 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 96 * c.s8), 3.15 * c.s8, c.T.text, { slot: 'text', zeile: 1.55 }), i.text && 6 * c.s8,
        i.aktion && tx(c, 'mono', i.aktion, bw, 2.1 * c.s8, c.T.mono, { slot: 'aktion' }),
      ]);
      const yF = fuss(c, i, null, c.h - r - 5 * c.s8);
      stapelMitte(c, items, z.y + hoehe(c, z) + 7 * c.s8, yF - 7 * c.s8);
    },
  };

  V.rueckseite = {
    name: 'Rückseite mit Adresse', wofuer: 'Rückseite eines Flyers oder einer Karte: Zeichen, Name, Adresse, Kontakt',
    slots: ['text'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const M = c.M, bw = c.w - 2 * (r + 7 * c.s8);
      const items = sauber([
        zeichen(c, Math.min(19 * c.s8, c.w * .2)), 6 * c.s8,
        tx(c, 'kapitale', M.name, bw, 3.1 * c.s8, c.T.titel, { sperr: .08 }), 2 * c.s8,
        tx(c, 'mono', M.zeile, bw, 1.6 * c.s8, c.T.mono), 5 * c.s8,
        linie(c, 12 * c.s8), 5 * c.s8,
        i.text && tx(c, 'kursiv', i.text, Math.min(bw, 74 * c.s8), 2.55 * c.s8, c.T.text, { slot: 'text', deck: .9 }), i.text && 5 * c.s8,
        tx(c, 'text', [M.adr.replace(' · ', '\n'), M.tel, M.mail, M.web].join('\n'), bw, 2.45 * c.s8, c.T.text, { zeile: 1.75, deck: .9 }),
      ]);
      stapelMitte(c, items, r + 8 * c.s8, c.h - r - 8 * c.s8);
    },
  };

  V.kartengruss = {
    name: 'Postkarten-Rückseite', wofuer: 'Rückseite einer Ansichtskarte: links Platz für den Gruss, rechts Markenfeld und Adresszeilen',
    slots: ['titel', 'text'],
    bau(c, i, seite) {
      grund(c, seite, c.ton === 'dunkel' ? 'papier' : c.T.grund, null);
      const T = c.M.toene.hell, m = Math.max(7, 7 * c.s8), mx = c.w / 2;
      c.el.push(linie(c, 0, { x: mx, y: m + 4, w: 0, h: c.h - 2 * m - 8, staerke: .2, farbe: T.linie, deck: .7 }));
      const lw = mx - m - 6 * c.s8;
      const z = zeichen(c, 9 * c.s8, { x: m, farbe: T.zeichen }); z.y = m; c.el.push(z);
      const kopf = sauber([
        tx(c, 'kapitale', c.M.name, lw, 2.1 * c.s8, T.titel, { ausr: 'l', x: m, sperr: .08 }), 1.2 * c.s8,
        tx(c, 'mono', i.titel || c.M.zeile, lw, 1.45 * c.s8, T.mono, { ausr: 'l', x: m, slot: 'titel' }),
        i.text && 4 * c.s8, i.text && tx(c, 'kursiv', i.text, lw, 2.25 * c.s8, T.text, { ausr: 'l', x: m, slot: 'text', deck: .85 }),
      ]);
      stapel(c, kopf, m + hoehe(c, z) + 4 * c.s8);
      const f = tx(c, 'mono', `${c.M.adr} · ${c.M.web}`, lw, 1.25 * c.s8, T.mono, { ausr: 'l', x: m, deck: .8, sperr: .08 }); f.y = c.h - m - f.h; c.el.push(f);
      const mb = 19 * c.s8, mh = 23 * c.s8;
      c.el.push({ id: neueId(), typ: 'rahmen', x: c.w - m - mb, y: m, w: mb, h: mh, staerke: .2, r: 0, farbe: T.linie, deck: .8 });
      const mz = zeichen(c, mb * .42, { x: c.w - m - mb / 2 - mb * .21, farbe: T.zeichen, deck: .35 }); mz.y = m + (mh - hoehe(c, mz)) / 2; c.el.push(mz);
      const ax = mx + 6 * c.s8, aw = c.w - m - ax, top = m + mh + 10 * c.s8, gap = Math.min(9 * c.s8, (c.h - m - 4 - top) / 4);
      for (let n = 0; n < 4; n++) c.el.push(linie(c, aw, { x: ax, y: top + gap * (n + 1) - 2, staerke: .15, farbe: T.linie, deck: .6 }));
    },
  };


  /* ---------- Culinarium Hannover (28.10.2026): die Plakat-Sprache der echten Plakate seit 2023 und die Menükarte am Tisch ----------
     Ausgemessen an den Plakaten in _quelle/extern/ig/ (DFqbLG2s_dc, 1440 × 1432): warmweisser Rand 4 % seitlich und 2,6 % oben, Bildfeld bis 74,5 %,
     darunter der Kasten mit der Wortmarke CULINARIUM (75,2–91,4 %, Wortmarke 75 % der Breite) und das Band mit der Zeile (92,3–98,7 %),
     beide mit feiner grauer Linie. Rückseite (…-2.jpg): Bild randlos, oben links «WALK / ON THE / WILD SIDE», unten die Daten «25 / 09 / 26» mit Uhrzeit,
     rechts daneben «3 GÄNGE MENÜ / 5 SiGNATURE DRiNKS», alles warmweiss in der Plakatschrift. Jeder Abend trägt seine Akzentfarbe (i.akzent):
     als Linie unter der Kopfzeile (vorn); die Rückseite bleibt wie die echten ohne Linie. Alle Masse in Anteilen der Breite, damit dasselbe Plakat
     als Instagram-Quadrat, als A3-Aushang und als Story stimmt. Wortmarke = zweites Zeichen (el.z = 2, Rudis Original-Logo). */
  STIL.plakat = { zeile: 1.22, sperr: .08 };   // Sperrung höchstens .08 em, sonst zerfallen die Wörter im PDF (Fehlerbuch 10a, pdftotext)
  STIL.kopf = { zeile: 1, sperr: .005, gross: true };   // Kopfzeile wie Rudi (Anton): eine Zeile, Versalien, kaum gesperrt; auch beim Wechsel der Schriftart im Editor
  const PL_LINIE = '#bdb8b8';                  // graue Linie der Kästen, gemessen (190,186,186 / 180,178,183)
  const plMass = (c, el, breite, hoehe) => {   // Text so gross setzen, dass er die Breite füllt, aber nicht höher als «hoehe» wird
    const m = DS.mess(Object.assign({}, el, { gr: 10, w: 100000 })).bw || 1;
    el.gr = +Math.min(10 * breite / m, hoehe).toFixed(2); el.h = DS.mess(el).h; return el;
  };
  /* Kopfzeile wie Rudi (Robert 29.10.2026: «auf den Plakaten von Rudi ist der Schriftzug Walk on the Wild Side immer … in dicken Buchstaben, wir arbeiten
     aber nur mit so einer weissen hässlichen Schrift»). Abgelesen an Rudis acht Plakaten mit gemalter Kopfzeile: sehr fett und schmal, Versalien, mittig,
     70–85 % der Motivbreite, 2–7 % unter der Oberkante, fast immer Rot (auf Rot und Pink Ton in Ton, auf dunkler Bühne leuchtend), leichter Schatten,
     kein Strich darunter. Schrift: Anton (OFL), Rolle «kopf». Farbe und Schatten je Bild aus der Kopfzone (kopfzone.rudi_kopf → kopf_rudi im Bild bzw. Motiv);
     eine ausdrückliche Hex-Farbe geht vor, die alten Namen 'weiss'/'navy' gelten nicht mehr. Baustein für alle Aufbauten: DS.kopfzeileRudi(c, text, o). */
  DS.kopfRudi = (M, bild, farbe, schatten) => {
    if (/^#/.test(farbe || '')) return { farbe, schatten: schatten || 'dunkel' };
    const b = (M.bildIndex || {})[bild], mo = window.DSPlakat && DSPlakat.motive ? DSPlakat.motive().find(x => x.key === bild || x.ganz === bild) : null;
    return (b && b.kopf_rudi) || (mo && mo.kopf_rudi) || { farbe: '#d6262b', schatten: 'dunkel' };
  };
  DS.kopfzeileRudi = (c, text, o) => {   // o: { x, y, w, h } = Motivfeld; bild, farbe, schatten, anteil (Breite, Standard 0,8)
    const k = DS.kopfRudi(c.M, o.bild, o.farbe, o.schatten);
    const t = tx(c, 'kopf', String(text || '').toUpperCase(), o.w, o.h * .16, k.farbe, { slot: o.slot || 'ueber', zeile: 1, sperr: .005, x: o.x });
    plMass(c, t, o.w * (o.anteil || .8), o.h * .16);
    t.y = +(o.y + o.h * .035 - t.gr * .06).toFixed(2); t.schatten = k.schatten;
    return t;
  };
  V.plakat = {
    name: 'Plakat des Abends', wofuer: 'Plakat je Abend in der Sprache der Culinarium-Plakate: Bild oben, Wortmarke im Kasten, Band mit der Zeile, Akzentfarbe des Abends',
    slots: ['bild*', 'ueber', 'zeile'],
    bau(c, i, seite) {
      const dunkel = c.ton === 'dunkel', u = c.w, B = DS.B;
      grund(c, seite, dunkel ? 'navy' : 'weiss', dunkel ? 'dunkel' : null);
      const sx = u * .0415, top = Math.min(u, c.h) * .0275;
      const yBand1 = c.h - u * .013, yBand0 = c.h - u * .0775, yBox1 = c.h - u * .0855, yBox0 = c.h - u * .248, yBild = c.h - u * .2565;
      foto(c, i.bild, sx, top, u - 2 * sx, yBild - top);
      if (i.ueber) c.el.push(DS.kopfzeileRudi(c, i.ueber, { x: sx, y: top, w: u - 2 * sx, h: yBild - top, bild: i.bild, farbe: i.ueberfarbe, schatten: i.kopfschatten }));   // wie Rudi, ohne Strich darunter (29.10.)
      const linie = dunkel ? 'gold' : PL_LINIE, st = Math.max(.25, u * .0035);
      c.el.push({ id: neueId(), typ: 'rahmen', x: sx, y: yBox0, w: u - 2 * sx, h: yBox1 - yBox0, staerke: st, r: 0, farbe: linie, deck: dunkel ? .7 : 1 });
      c.el.push({ id: neueId(), typ: 'rahmen', x: sx, y: yBand0, w: u - 2 * sx, h: yBand1 - yBand0, staerke: st, r: 0, farbe: linie, deck: dunkel ? .7 : 1 });
      const Z2 = c.M.zeichen2, farbe = dunkel ? 'weiss' : (Z2 ? Z2.farben.zeichen : 'tanne');
      if (Z2) {
        const zw = u * .75, zh = zw * Z2.verh;
        c.el.push({ id: neueId(), typ: 'zeichen', z: 2, x: (u - zw) / 2, y: +((yBox0 + yBox1 - zh) / 2).toFixed(2), w: zw, farbe, deck: 1 });
      } else {
        const t = tx(c, 'titel', 'CULINARIUM', u * .75, u * .09, farbe, { slot: null }); t.y = (yBox0 + yBox1 - t.h) / 2; c.el.push(t);
      }
      const z = tx(c, 'plakatfett', i.zeile || c.M.zeile || '', u - 2 * sx - u * .02, u * .03, farbe, { slot: 'zeile', zeile: 1, sperr: .06 });   // Feld so breit wie das Band, damit eine längere Zeile (Gastkoch) nie umbricht
      plMass(c, z, u * .84, (yBand1 - yBand0) * .5);   /* wie auf den echten Plakaten: fett, das Band fast in voller Breite */ z.y = +((yBand0 + yBand1 - z.h) / 2 + z.gr * .04).toFixed(2); c.el.push(z);
      void B;
    },
  };
  /* Plakat des Abends in hohen Formaten (Abnahme-Tor 29.10.: in A3 und Story stand das Motiv klein in der Mitte, oben und unten leere Farbfläche).
     Wie das Plakat, nur hoch: Papiergrund, das Motiv in voller Breite und ganz (Seitenverhältnis des Bilds, nichts angeschnitten), darauf die Kopfzeile wie Rudi,
     darunter Wortmarke im Kasten und das Band, dann die Daten des Abends in den Buchstaben der Rückseiten. Die übrige Höhe teilt sich gleich auf die Abstände
     (höchstens 2,4 Textzeilen, sonst Loch); was dann noch frei ist, macht die Daten grösser. */
  V.plakathoch = {
    name: 'Plakat des Abends, hoch', wofuer: 'Plakat je Abend in hohen Formaten (A3, A4, A5, Story, 4:5): Motiv gross und ganz, Wortmarke, Band und die Daten des Abends',
    slots: ['bild*', 'ueber', 'zeile', 'tag1', 'zeit1', 'tag2', 'zeit2', 'text'],
    formate: ['a6h', 'a5h', 'a4h', 'a3h', 'insta', 'story', 'dlh'],   // hohe Formate; plakat.js setzt ihn selbst nur bis Seitenverhältnis 1,9 (dlh nur über den Reiter «Vorlagen»)
    bau(c, i, seite) {
      /* Ohne Daten des Abends (das Plakat aus dem Reiter «Vorlagen» in Story oder A3) bliebe ein Drittel leer (Abnahme-Tor 29.10.): dann stehen die Daten
         aus dem Beispiel darin, als Felder zum Überschreiben, wie auf jedem Plakat, das die Werkstatt für einen Abend anlegt */
      if (!i.tag1 && !i.text && DS.BEISPIEL && DS.BEISPIEL.plakathoch) { const B0 = DS.BEISPIEL.plakathoch; i = Object.assign({ tag1: B0.tag1, zeit1: B0.zeit1, tag2: B0.tag2, zeit2: B0.zeit2, text: B0.text }, i); }
      const dunkel = c.ton === 'dunkel', u = c.w, CAP = .72;
      grund(c, seite, dunkel ? 'navy' : 'weiss', dunkel ? 'dunkel' : null);
      const sx = Math.max(u * .0415, DS.SICHER + .5), bw = u - 2 * sx, b = (c.M.bildIndex || {})[i.bild] || { w: 5, h: 4 };
      const digital = (Object.values(DS.FORMATE).find(F => F.b === c.w && F.h === c.h) || {}).digital;
      const mw = +Math.min(bw, digital || !b.w || b.w < 50 ? bw : b.w / 152 * 25.4).toFixed(2), mx = +((u - mw) / 2).toFixed(2);   // im Druck nie unter 152 dpi: Rudis Bilder gibt es nur in Instagram-Grösse
      const mh = +(mw * b.h / b.w).toFixed(2), farbe = dunkel ? 'weiss' : 'tinte', linie = dunkel ? 'gold' : PL_LINIE, st = Math.max(.25, u * .0035);
      const boxH = u * .163, bandH = u * .0645, Z2 = c.M.zeichen2, zFarbe = dunkel ? 'weiss' : (Z2 ? Z2.farben.zeichen : 'tanne');
      const daten = (f) => {   // Daten des Abends, mittig, fett wie auf den Rückseiten
        const z = [], gT = u * .042 * f / CAP, gS = u * .026 * f / CAP;
        [[i.tag1, i.zeit1, 1], [i.tag2, i.zeit2, 2]].filter(d => d[0]).forEach(([tag, zeit, n]) => z.push(tx(c, 'plakatfett', tag + (zeit ? '  ·  ' + zeit : ''), bw, gT, farbe, { slot: 'tag' + n, zeile: 1.05, sperr: .04 })));
        if (i.text) z.push(tx(c, 'plakatfett', String(i.text).replace(/\n/g, '  ·  '), bw, gS, farbe, { slot: 'text', zeile: 1.1, sperr: .04 }));
        z.forEach(t => plMass(c, t, bw * .94, t.gr)); return z;   // etwas Luft, sonst bricht die Sperrung die Zeile um
      };
      let f = 1, d = daten(f);
      const hoehe = () => mh + boxH + bandH + d.reduce((m, t) => m + t.h, 0) + Math.max(0, d.length - 1) * u * .012;
      const zeile = ((DS.STIL && (DS.STIL.mindestgrade_mm || {})[c.M && c.formatKey] || {}).text || 3) * 1.35, cap = 2.4 * Math.max(zeile, u * .03);
      const luecken = 4, frei = () => c.h - 2 * sx - hoehe();
      while (frei() / luecken > cap && f < 1.8) { f += .1; d = daten(f); }
      const g = Math.max(u * .015, Math.min(cap, frei() / luecken));
      let y = sx + Math.max(0, (frei() - g * luecken) / 2);
      foto(c, i.bild, mx, +y.toFixed(2), mw, mh);
      if (i.ueber) c.el.push(DS.kopfzeileRudi(c, i.ueber, { x: mx, y, w: mw, h: mh, bild: i.bild, farbe: i.ueberfarbe, schatten: i.kopfschatten }));
      y += mh + g;
      c.el.push({ id: neueId(), typ: 'rahmen', x: sx, y: +y.toFixed(2), w: bw, h: +boxH.toFixed(2), staerke: st, r: 0, farbe: linie, deck: dunkel ? .7 : 1 });
      if (Z2) { const zw = bw * .78, zh = zw * Z2.verh; c.el.push({ id: neueId(), typ: 'zeichen', z: 2, x: +((u - zw) / 2).toFixed(2), y: +(y + (boxH - zh) / 2).toFixed(2), w: zw, farbe: zFarbe, deck: 1 }); }
      y += boxH + u * .008;
      c.el.push({ id: neueId(), typ: 'rahmen', x: sx, y: +y.toFixed(2), w: bw, h: +bandH.toFixed(2), staerke: st, r: 0, farbe: linie, deck: dunkel ? .7 : 1 });
      const zl = tx(c, 'plakatfett', i.zeile || c.M.zeile || '', bw - u * .02, u * .03, zFarbe, { slot: 'zeile', zeile: 1, sperr: .06 });
      plMass(c, zl, bw * .9, bandH * .5); zl.y = +(y + (bandH - zl.h) / 2 + zl.gr * .04).toFixed(2); c.el.push(zl);
      y += bandH + g;
      d.forEach((t, k) => { t.y = +y.toFixed(2); c.el.push(t); y += t.h + (k < d.length - 1 ? u * .012 : 0); });
    },
  };
  V.plakatrueck = {
    name: 'Plakat, Rückseite mit Daten', wofuer: 'Rückseite des Abend-Plakats wie die echten Rückseiten: ruhiger, satter Grund in der Farbwelt der Vorderseite (oder ein Bild randlos), «WALK / ON THE / WILD SIDE» oben links, Daten mit Uhrzeit unten links, Gänge und Drinks rechts, fette runde Versalien, keine Linie, kein Schleier',
    slots: ['bild', 'ueber', 'tag1', 'zeit1', 'tag2', 'zeit2', 'text'],
    /* Ausgemessen an den echten Rückseiten (DPwlqcfiKcA-2, DJw8OqGMY1G-2, DVjkofijp6R-2, DbYnkdkjrNy-2, 900 px breit): Rand links 3,3 %, «WALK» oben bei 6,7 %,
       Versalhöhe 3,6 %, Zeilenschritt 7,8 %; Daten Versalhöhe 3,7 %, Uhrzeit 1,9 %, unterste Zeile 4,5 % über dem Rand; rechte Spalte ab 58,7 %, Versalhöhe 2,8 %,
       Zeilenschritt 4,7 %. Kein Schleier, keine Titelzeile: das Bild ist ein eigenes, sattes Begleitmotiv. Schrift weiss, auf hellem Bild dunkel (i.dunkel). */
    bau(c, i, seite) {
      const u = c.w, B = DS.B, CAP = .72;   // Versalhöhe von Urbanist in Teilen der Schriftgrösse
      grund(c, seite, i.grund || 'navy', null);   // ohne Bild: ruhiger Grund in der Farbwelt der Illustration vorn (Roberts Entscheid 28.10.: keine KI-Bilder)
      if (i.bild) foto(c, i.bild, -B, -B, c.w + 2 * B, c.h + 2 * B);
      const farbe = i.dunkel ? 'tinte' : 'weiss', x0 = Math.max(u * .033, DS.SICHER + .5), R = 'plakatfett';   // nie näher als der sichere Rand (Abnahme-Tor 29.10.: A3 rechts unter 4 mm)
      if (i.ueber) {
        const t = tx(c, R, i.ueber, u * .6, u * .036 / CAP, farbe, { slot: 'ueber', ausr: 'l', x: x0, zeile: (u * .078) / (u * .036 / CAP), sperr: .02 });
        t.y = +(u * .067 - (u * .036 / CAP) * .16).toFixed(2); c.el.push(t);
      }
      const gT = u * .037 / CAP, gZ = u * .019 / CAP, unten = c.h - u * .045;
      const daten = [[i.tag1, i.zeit1, 1], [i.tag2, i.zeit2, 2]].filter(d => d[0]);
      // von unten nach oben setzen, damit die unterste Uhrzeit wie auf den Plakaten 4,5 % über dem Rand steht
      const bloecke = daten.map(([tag, zeit, n]) => {
        const t = tx(c, R, tag, u * .5, gT, farbe, { slot: 'tag' + n, ausr: 'l', x: x0, zeile: 1.02, sperr: .04 });
        const z = zeit ? tx(c, R, zeit, u * .4, gZ, farbe, { slot: 'zeit' + n, ausr: 'l', x: x0 + u * .003, zeile: 1.1, sperr: .04 }) : null;
        return { t, z };
      });
      let y = unten;
      for (let k = bloecke.length - 1; k >= 0; k--) {
        const { t, z } = bloecke[k];
        if (z) { y -= z.h; z.y = +y.toFixed(2); y -= u * .012; }
        y -= t.h; t.y = +y.toFixed(2); y -= u * .028;
      }
      const yOben = bloecke.length ? bloecke[0].t.y : unten - u * .2;
      bloecke.forEach(({ t, z }) => { c.el.push(t); if (z) c.el.push(z); });
      if (i.text) {
        const t = tx(c, R, i.text, u - u * .587 - x0, u * .028 / CAP, farbe, { slot: 'text', ausr: 'l', x: u * .587, zeile: (u * .047) / (u * .028 / CAP), sperr: .03 });
        plMass(c, t, u - u * .587 - x0, u * .028 / CAP);   // passt in die Spalte bis zum sicheren Rand
        t.y = +yOben.toFixed(2); c.el.push(t);
      }
      void B;
    },
  };
  V.plakatganz = {
    name: 'Plakat aus dem Archiv, ganz', wofuer: 'Ein echtes Plakat seit 2023 als ganzes Bild, nichts angeschnitten, mit warmweissem Rand; die Schrift steht schon im Plakat',
    slots: ['bild*'],
    /* Auftrag Oberchef 28.10.: echte Plakate mit eingebauter Schrift nie als Motiv unter neuer Schrift und nie angeschnitten, nur ganz im Archiv */
    bau(c, i, seite) {
      grund(c, seite, 'weiss', null);
      const rand = Math.min(c.w, c.h) * .04, fw = c.w - 2 * rand, fh = c.h - 2 * rand;
      const b = (c.M.bildIndex || {})[i.bild], ia = b && b.w && b.h ? b.w / b.h : 1;
      const w = Math.min(fw, fh * ia), h = w / ia;
      foto(c, i.bild, (c.w - w) / 2, (c.h - h) / 2, w, h);
    },
  };
  V.menue = {
    name: 'Menükarte am Tisch', wofuer: 'Karte des Abends am Platz: Wortmarke, Datum, je Gang Teller und Drink, wie die Karten der Abende auf der Website',
    slots: ['ueber', 'titel', 'liste*', 'text', 'fuss'],
    bau(c, i, seite) {
      const dunkel = c.ton === 'dunkel';
      grund(c, seite); const r = rahmen(c);
      const x0 = r + 6 * c.s8, cw = c.w - 2 * x0, Z2 = c.M.zeichen2;
      const kopf = [];
      if (Z2) { const zw = Math.min(cw * .78, 62 * c.s8); kopf.push({ id: neueId(), typ: 'zeichen', z: 2, x: (c.w - zw) / 2, y: 0, w: zw, farbe: dunkel ? 'weiss' : Z2.farben.zeichen, deck: 1 }, 1.6 * c.s8); }
      kopf.push(tx(c, 'plakat', c.M.zeile || '', cw * .9, 1.5 * c.s8, dunkel ? 'gold' : c.T.mono, { slot: null, zeile: 1 }), 4.5 * c.s8);
      if (i.titel) kopf.push(tx(c, 'titel', i.titel, cw, 7.5 * c.s8, c.T.titel, { slot: 'titel' }), 1.8 * c.s8);
      if (i.ueber) kopf.push(tx(c, 'mono', i.ueber, cw, 1.85 * c.s8, i.akzent || c.T.mono, { slot: 'ueber' }));
      const yK = stapel(c, sauber(kopf), r + 7 * c.s8) + 3.5 * c.s8;
      c.el.push(linie(c, 12 * c.s8, { y: yK - 1.5 * c.s8, farbe: i.akzent || c.T.linie, staerke: .35 }));
      const yF = fuss(c, i, null, c.h - r - 5 * c.s8);
      const liste = (i.liste || []).filter(e => e && (e.name || e.detail || e.gang));
      const verf = yF - 4 * c.s8 - yK - (i.text ? 8 * c.s8 : 0);
      const baue = k => {
        const els = []; let y = 0;
        liste.forEach((e, n) => {
          if (e.gang) { const g = tx(c, 'mono', e.gang, cw, 1.7 * c.s8 * k, c.T.mono, { slot: `liste.${n}.gang` }); g.y = y; els.push(g); y += g.h + .6 * c.s8 * k; }
          if (e.name) { const t = tx(c, 'titel', e.name, cw, 3.1 * c.s8 * k, c.T.titel, { slot: `liste.${n}.name`, zeile: 1.16 }); t.y = y; els.push(t); y += t.h + .5 * c.s8 * k; }
          if (e.detail) { const d = tx(c, 'text', e.detail, cw * .92, 2.05 * c.s8 * k, c.T.text, { slot: `liste.${n}.detail`, deck: .8, zeile: 1.4 }); d.y = y; els.push(d); y += d.h; }
          y += 3.6 * c.s8 * k;
        });
        return { els, H: y - 3.6 * c.s8 * k };
      };
      let k = 1, L = baue(k);
      for (let n = 0; n < 8 && L.H > verf; n++) { k *= Math.max(.6, Math.sqrt(verf / L.H)) * .99; L = baue(k); }
      if (L.H < verf * .7) { k = Math.min(1.3, Math.sqrt(verf * .82 / L.H)); L = baue(k); if (L.H > verf) { k *= Math.sqrt(verf / L.H) * .98; L = baue(k); } }
      const dy = yK + Math.max(0, (verf - L.H) / 2);
      L.els.forEach(e => { e.y = +(e.y + dy).toFixed(2); c.el.push(e); });
      if (i.text) { const t = tx(c, 'kursiv', i.text, cw, 1.9 * c.s8, c.T.text, { slot: 'text', deck: .8 }); t.y = +(yF - 4 * c.s8 - t.h).toFixed(2); c.el.push(t); }
    },
  };
  DS.VORLAGEN = V;

  /* Eine Seite aus Vorlage + Inhalt setzen */
  DS.setze = function (M, formatKey, vorlage, ton, inhalt, stil) {
    const fmt = DS.FORMATE[formatKey];
    const c = ctx(M, fmt, ton, stil);
    const seite = { grund: 'navy', tapete: null, el: [], quelle: { vorlage, ton, inhalt: JSON.parse(JSON.stringify(inhalt || {})) } };
    if (stil && Object.keys(stil).length) seite.quelle.stil = Object.assign({}, stil);
    (V[vorlage] || V.deckel).bau(c, inhalt || {}, seite);
    if (ton === 'dc' && M.zeichen3) c.el.forEach(e => { if (e.typ === 'zeichen' && !e.z) e.z = 3; });
    if (c.stil.ausr === 'l' && LINKS_MOEGLICH.includes(vorlage) && !(vorlage === 'gutschein' && c.quer)) linksbuendig(c);
    seite.el = c.el;
    return seite;
  };
  /* Linksbündige Fassung: alles, was mittig auf der Achse steht, an den linken Satzrand (Fotos, Flächen, Rahmen bleiben) */
  const LINKS_MOEGLICH = ['deckel', 'buehne', 'fenster', 'aushang', 'einladung', 'gutschein'];
  function linksbuendig(c) {
    const rand = c.el.some(e => e.typ === 'rahmen') ? Math.max(4.5, 5 * c.s8) : 0;
    const L = Math.max(c.m + 2, rand + 7 * c.s8);
    const scheibe = c.el.find(e => e.typ === 'flaeche' && e.r && Math.abs(e.w - e.h) < .5);   // Zeichen auf der Naht (Bild oben) bleibt mittig
    const mittig = e => Math.abs(e.x + e.w / 2 - c.w / 2) < .8;
    for (const e of c.el) {
      if (e.typ === 'text' && e.ausr === 'c' && mittig(e) && !(e.slot === 'fuss')) { e.ausr = 'l'; e.w = Math.min(e.w, c.w - L - rand - 4 * c.s8); e.x = L; e.h = DS.mess(e).h; }
      else if (e.typ === 'linie' && mittig(e) && e.w < c.w * .5) e.x = L;
      else if (e.typ === 'zeichen' && mittig(e) && !scheibe) e.x = L;
    }
  }

  /* Ein ganzes Dokument aus einem Entwurf (der KI oder einer Vorlage) */
  DS.dokument = function (M, entwurf) {
    const fk = DS.FORMATE[entwurf.format] ? entwurf.format : 'a5h';
    return {
      id: 'd' + Date.now().toString(36),
      name: entwurf.name || 'Neue Drucksache',
      formatKey: fk, format: { b: DS.FORMATE[fk].b, h: DS.FORMATE[fk].h },
      seiten: entwurf.seiten.map(s => DS.setze(M, fk, s.vorlage, s.ton || 'dunkel', s.inhalt || {}, s.stil)),
      hinweise: entwurf.hinweise || [], auftrag: entwurf.auftrag || '', geaendert: Date.now(),
    };
  };

  /* Beispielinhalte im Wortlaut des Culinarium (geprüft in _qa/vorlagen_culinarium.py, eingesetzt von _qa/culinarium_anpassen.py) */
  DS.BEISPIEL = {"deckel": {"ueber": "A UNiQUE EXPERiENCE BY MOMO X RUDI", "titel": "Culinarium", "unter": "Walk on the Wild Side · Haasemannstraße 13", "text": "Food-Pairing-Abende im Walk on the Wild Side in Linden: ein Menü mit fünf passenden Drinks an einer langen Tafel für vierzehn Gäste."}, "buehne": {"bild": "tafelleer", "ueber": "Culinarium", "titel": "An der langen Tafel", "text": "Die Abende an der langen Tafel des Walk on the Wild Side: drei Gänge, fünf Drinks, vierzehn Plätze. Und wer dir erklärt, was auf dem Teller und im Glas ist.", "aktion": "Walk on the Wild Side · Haasemannstraße 13"}, "ansicht": {"bild": "barnacht", "titel": "Walk on the Wild Side", "unter": "Hannover-Linden"}, "karte": {"ueber": "Culinarium", "titel": "Vom Pass", "text": "Das Menü wechselt mit jedem Abend. Ein paar Teller und Drinks aus den letzten Ausgaben.", "liste": [{"name": "LAUCH / BLUMENKOHL / CHIPOTLE", "detail": "", "preis": ""}, {"name": "BLUMENKOHL / ROQUEFORT / KAPERN / QUINOA", "detail": "", "preis": ""}, {"name": "HOKKAIDO / KÜRBISKERNÖL / HASELNUSS", "detail": "", "preis": ""}, {"name": "SPAGHETTI-EIS / KIWI / WEISSE SCHOKOLADE", "detail": "", "preis": ""}], "fuss": "Walk on the Wild Side · Haasemannstraße 13"}, "einladung": {"ueber": "Culinarium", "titel": "Ein Abend an der Tafel", "wann": "27.–28. November", "wo": "Walk on the Wild Side · Haasemannstraße 13", "text": "Vierzehn Gäste an einer Tafel, drei Gänge aus der Küche und dazu fünf Signature Drinks, passend zum Essen. Momo erklärt am Tisch, was im Glas ist.", "aktion": "@culinarium_hannover"}, "programm": {"ueber": "Culinarium", "titel": "Die nächsten Abende", "termine": [{"wann": "27.–28. November", "was": "Culinarium", "wo": "Walk on the Wild Side · Haasemannstraße 13"}, {"wann": "18.–19. Dezember", "was": "Culinarium", "wo": "Walk on the Wild Side · Haasemannstraße 13"}]}, "fenster": {"bild": "trio2", "ueber": "Culinarium", "titel": "Immer dieselben Leute", "unter": "A UNiQUE EXPERiENCE BY MOMO X RUDI", "text": "Hinter den Plakaten stehen dieselben Leute, Abend für Abend."}, "geteilt": {"bild": "schaumglas", "ueber": "Am Tisch erklärt", "titel": "Fatwashing", "text": "Die Spirituose nimmt den Geschmack eines Fetts an; kalt gestellt, wird das Fett wieder abgehoben.", "aktion": "Culinarium"}, "gutschein": {"titel": "Dein Platz an der Tafel", "unter": "A UNiQUE EXPERiENCE BY MOMO X RUDI", "wert": "Culinarium", "text": "Die Abende an der langen Tafel des Walk on the Wild Side: drei Gänge, fünf Drinks, vierzehn Plätze."}, "aushang": {"ueber": "Culinarium", "titel": "Heute ausgebucht", "text": "Der Abend ist ausgebucht, bevor er beginnt.", "aktion": "@culinarium_hannover"}, "rueckseite": {"text": "Food-Pairing-Abende im Walk on the Wild Side in Linden: ein Menü mit fünf passenden Drinks an einer langen Tafel für vierzehn Gäste."}, "kartengruss": {"titel": "Walk on the Wild Side", "text": "Und wer dir erklärt, was auf dem Teller und im Glas ist."}, "plakat": {"bild": "pl_CyT32RTMB4d", "ueber": "", "ueberfarbe": "weiss", "zeile": "A UNiQUE EXPERiENCE BY MOMO X RUDI", "akzent": "#13606a"}, "plakatrueck": {"grund": "#0d545d", "ueber": "WALK\nON THE\nWILD SIDE", "tag1": "27 / 11 / 26", "zeit1": "19:00 UHR", "text": "3 GÄNGE MENÜ\n5 SiGNATURE DRiNKS", "tag2": "28 / 11 / 26", "zeit2": "17:00 UHR"}, "menue": {"titel": "Menü", "ueber": "Fr 21. und Sa 22. Februar 2025", "liste": [{"gang": "Apéritif", "name": "Sauerteig | Tomate | Butter", "detail": "Cognac | Toasted Pumpkin Samen | Limette | Champagner"}, {"gang": "Vorspeise", "name": "Miso | Sellerie | Röstzwiebeln", "detail": "Vodka | Tom Yam | Guava | Cocos | Acids | Soda"}, {"gang": "Hauptgang", "name": "Spinat | braune Butter | Parmesan", "detail": "Tequila | lakto-fermentierte Tomate | Agave | Limette"}, {"gang": "Dessert", "name": "Kaffee | Molke | Amaretto", "detail": "Vodka | Cacao | Matcha | Mango"}, {"gang": "Absacker", "name": "", "detail": "Gin | Turmeric | Ingwer"}], "akzent": "#ef7648", "fuss": "Walk on the Wild Side · Haasemannstraße 13"}, "plakathoch": {"bild": "pl_DPwlqcfiKcA", "ueber": "WALK ON THE WILD SIDE", "ueberfarbe": "#d6262b", "kopfschatten": "leuchten", "zeile": "A UNiQUE EXPERiENCE BY MOMO X RUDI", "tag1": "27 / 11 / 26", "zeit1": "19:00 UHR", "tag2": "28 / 11 / 26", "zeit2": "17:00 UHR", "text": "3 GÄNGE MENÜ\n5 SiGNATURE DRiNKS"}};
})();
