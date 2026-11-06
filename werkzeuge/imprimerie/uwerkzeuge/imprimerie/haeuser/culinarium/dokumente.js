/* Die Plakatwerkstatt des Culinarium Hannover: Satz der Dokumente (29.10.2026, Auftrag Oberchef nach Roberts «Alle Dokumente müssen nochmal
   … schöner gemacht werden»). Ersetzt für dieses Haus einzelne Aufbauten aus vorlagen.js; jedes andere Haus behält den Kern (ALT).
   Regeln stehen in STILBLATT-DRUCKSACHEN.md und stilblatt.json im selben Ordner:
   - Komposition als Einheit: Zeichen und Inhalt bilden eine Gruppe, die Gruppe steht auf der optischen Mitte (leicht über der geometrischen).
   - Kopfzeile und Fusszeile haben denselben Abstand zum Rahmen. Kein Zeichen steht lose am Rand.
   - Schrift nach Zweck: Aushang aus 2–3 m, Karte aus Armlänge, Story am Handy. Wenig Inhalt wird grösser gesetzt, nicht leerer.
   - Eine Achse je Dokument (mittig). Zeilen ausgewogen umbrochen, nie ein Wort allein. */
(function () {
  'use strict';
  const DS = window.DS;
  if (!DS || !DS.VORLAGEN) return;
  const V = DS.VORLAGEN, ALT = Object.assign({}, V), STIL = DS.STIL;
  const istHaus = c => c.M && c.M.key === 'culinarium';
  const id = () => DS.neueId();

  /* ---------- Werkzeug ---------- */
  /* Mindestgrade je Format und Rolle (stilblatt.json › mindestgrade_mm); Drinks unter dem Gericht (slot «detail») dürfen bis 2,1 mm */
  const MIND = { a3h: [15, 6, 2.6], a4h: [15, 6, 2.6], a5h: [11, 4.2, 2], a5q: [11, 4.2, 2], a6h: [6, 2.1, 1.5], a6q: [6, 2.1, 1.5], dlh: [6, 2.1, 1.5], dlq: [6, 2.1, 1.5], q148: [6, 2.1, 1.5],
    a7q: [5, 2, 1.5], story: [7, 3.6, 1.6], insta: [7, 3.6, 1.6], ig11: [7, 3.6, 1.6], mail: [7, 3.6, 1.6], mailkopf: [5, 2.4, 1.5] };
  function mindest(c, rolle, slot) {
    const m = c.aufbau === 'menue' ? MIND.dlh : MIND[c.fk || '']; if (!m) return 0;   // Menükarte liegt am Platz: Mindestgrade der Tischkarte, in jedem Format (Stilblatt › mindestgrade_zweck)
    
    if (/\.(gang|preis)$/.test(slot || '') || rolle === 'mono' || rolle === 'plakat') return m[2];
    if (rolle === 'titel' || rolle === 'kapitale') return /^liste\./.test(slot || '') ? m[1] * 1.15 : m[0];
    return m[1];
  }
  function tx(c, rolle, text, w, gr, farbe, o = {}) {
    if (c.fk === undefined && c.M) erweitere(c);
    if (o.slot !== null && o.slot !== undefined || rolle !== 'mono') gr = Math.max(gr, mindest(c, rolle, o.slot));
    let t = String(text);
    // Titel: nie ein Wort allein in der letzten Zeile (die letzten zwei Wörter bleiben zusammen); Glieder-Zeilen regelt gliederSatz
    if (/^(titel|kapitale|plakat|plakatfett)$/.test(o.rolle || rolle) && !/\n/.test(t) && !/\s[|/·]\s/.test(t) && t.trim().split(/\s+/).length >= 3) {
      // die letzten zwei Wörter bleiben zusammen; Artikel und Präpositionen hängen am nächsten Wort («Allergien / an der Tafel»), aber nur paarweise,
      // nie als Kette (sonst «An / der langen Tafel», Tor 30.10.)
      const w = t.trim().split(/\s+/), fest = new Array(w.length).fill(false), KLEIN = /^(an|am|im|in|der|die|das|des|den|dem|und|mit|zu|zum|zur|von|vom|auf|für|bei|aus|ein|eine)$/i;
      fest[w.length - 2] = true;
      for (let k = 0; k < w.length - 2; k++) if (KLEIN.test(w[k]) && !(k > 0 && fest[k - 1])) fest[k] = true;
      t = w.map((x, k) => x + (k < w.length - 1 ? (fest[k] ? '\u00a0' : ' ') : '')).join('');
    }
    const el = Object.assign({ id: id(), typ: 'text', rolle, text: t, x: 0, y: 0, w, gr: +gr.toFixed(2), farbe, ausr: 'c', deck: 1 }, STIL[rolle], o);
    el.sperr = Math.min(el.sperr || 0, el.rolle === 'kapitale' ? .08 : .1);   // Stilblatt: höchstens 0,1 em, Rudis Zeile 0,08 em
    Object.defineProperty(el, '_min', { value: mindest(c, el.rolle, o.slot) || el.gr * .7, enumerable: false });
    if (/^(titel|kapitale|plakatfett)$/.test(el.rolle)) {
      const roh = t.replace(/\u00a0/g, ' '), wo = roh.trim().split(/\s+/), breit = x => DS.mess(Object.assign({}, el, { text: x, w: 100000 })).bw;
      // nie mitten im Wort umbrechen: das längste Wort muss in die Zeile passen
      const lw = Math.max(...wo.map(breit)); if (lw > el.w - .3) el.gr = +Math.max(el._min, el.gr * (el.w - .3) / lw).toFixed(2);
      // kurze Titel aus drei Wörtern lieber auf einer Zeile als «Die / nächsten Abende» (bis 60 % der Grösse, nie unter den Mindestgrad)
      if (wo.length === 3 && !/\n/.test(roh)) { const ganz = breit(roh); if (ganz > el.w && el.gr * el.w / ganz >= Math.max(el._min, el.gr * .6)) { el.gr = +(el.gr * (el.w - .3) / ganz).toFixed(2); t = roh; el.text = roh; } }
    }
    if (/\u00a0/.test(t)) {   // das zusammengehaltene Wortpaar muss in die Zeile passen, sonst kleiner (nie unter den Mindestgrad)
      const paar = t.slice(t.lastIndexOf(' ') + 1), pb = DS.mess(Object.assign({}, el, { text: paar, w: 100000 })).bw;
      if (pb > el.w) { el.gr = +Math.max(el._min, el.gr * el.w / (pb + .5)).toFixed(2); if (DS.mess(Object.assign({}, el, { text: paar, w: 100000 })).bw > el.w) el.text = t.replace(/\u00a0/g, ' '); }
    }
    el.h = DS.mess(el).h;
    if (el.ausr === 'c' && o.x === undefined) el.x = (c.w - el.w) / 2;
    return el;
  }
  /* Zeilen aus Gliedern («Sauerteig | Tomate | Butter», «LAUCH / BLUMENKOHL / CHIPOTLE»): Umbruch nur zwischen zwei Gliedern, das Trennzeichen fällt
     am Zeilenende weg, die Zeilen werden möglichst gleich lang (wie auf den gedruckten Karten des Hauses) */
  const glieder = t => t;
  function gliederSatz(el, minGr) {
    if (minGr === undefined) minGr = el._min;
    const m = /\s([|/·])\s/.exec(el.text || ''); if (!m) return el;
    const sep = ' ' + m[1] + ' '; el.text = el.text.replace(/\s*\n\s*/g, sep).replace(/\u00a0/g, ' ');   // schon umbrochene Zeilen wieder zusammenfügen
    // Drinkzeilen «Name · Zutat | Zutat»: beide Trenner sind Glied-Grenzen, jeder bleibt an seiner Stelle (sonst bricht «Himbeer-/Cordial» frei um)
    const misch = m[1] !== '/' && / · /.test(el.text) && / \| /.test(el.text), roh = misch ? el.text.split(/ ([·|]) /) : null;
    const teile = misch ? roh.filter((x, k) => k % 2 === 0) : el.text.split(sep), seps = misch ? roh.filter((x, k) => k % 2 === 1).map(x => ' ' + x + ' ') : [];
    const J = (a, b) => misch ? teile.slice(a, b).map((t, k) => k ? seps[a + k - 1] + t : t).join('') : teile.slice(a, b).join(sep);
    if (teile.length < 2) return el;
    const gr0 = el.gr, unten = Math.min(gr0, Math.max(minGr || 0, gr0 * .7)), sperr0 = el.sperr || 0;
    const wahl = (sperr, gr) => {   // beste Teilung bei dieser Grösse: 1 ausgewogen, 2 erste Zeile nicht kürzer, 3 letzte Zeile mit zwei Wörtern, 4 irgendeine
      const e0 = Object.assign({}, el, { sperr, gr });
      const breite = {}, B = (a, b) => { const k = a + ':' + b; if (breite[k] == null) breite[k] = DS.mess(Object.assign({}, e0, { text: J(a, b), w: 100000 })).bw; return breite[k]; };
      if (B(0, teile.length) <= el.w - .6) return { stufe: 0, z: [teile.length] };
      const bestN = {};
      const suche = (start, rest, schnitte) => {
        if (rest === 1) { const z = [...schnitte, teile.length]; let a = 0; const w = []; for (const e of z) { w.push(B(a, e)); a = e; }
          const max = Math.max(...w); if (max > el.w - .6) return;
          const letzte = el.rolle === 'kapitale' ? teile.length - (z[z.length - 2] || 0) >= 2 : J(z[z.length - 2] || 0, teile.length).trim().split(/\s+/).length >= 2;   // Rudis Zeile: nie ein Glied allein in der letzten Zeile (Oberchef 30.10.)
          const vorn = !/^(titel|kapitale|plakat|plakatfett)$/.test(el.rolle) || w[0] >= .8 * w[1];   // Gerichte und Titel: erste Zeile nie deutlich kürzer als die zweite (nie «LAUCH» allein oben); Drinkzeilen dürfen «Name / Zutaten» setzen
          const stufe = letzte && vorn && Math.min(...w) >= .55 * max ? 1 : letzte && vorn ? 2 : letzte ? 3 : 4;
          if (!bestN[stufe] || max < bestN[stufe].max || (max === bestN[stufe].max && z.length < bestN[stufe].z.length)) bestN[stufe] = { stufe, max, z }; return; }
        for (let e = start + 1; e <= teile.length - rest + 1; e++) suche(e, rest - 1, [...schnitte, e]);
      };
      for (let n = 2; n <= Math.min(5, teile.length); n++) { suche(0, n, []); if (bestN[1]) break; }
      return bestN[1] || bestN[2] || bestN[3] || bestN[4] || null;
    };
    /* Rudis Zeile aus drei Gliedern nie auf zwei Zeilen, da bliebe immer ein Glied allein («CHIPOTLE», Tor 30.10.): in Listen eine Zeile bis zum
       Mindestgrad; als Titel eine Zeile bis 80 % der Grösse, sonst jedes Glied auf seiner eigenen Zeile */
    if (el.rolle === 'kapitale' && teile.length === 3) {
      const wl = DS.mess(Object.assign({}, el, { text: J(0, 3), w: 100000 })).bw;
      if (wl > el.w - .6) {
        const liste = /^liste\./.test(el.slot || ''), g1 = gr0 * (el.w - .6) / wl, boden = liste ? (minGr || 0) : gr0 * .8;
        if (g1 >= boden) { el.text = J(0, 3); el.gr = +g1.toFixed(2); el.h = DS.mess(el).h; return el; }
        // als Titel deutlich kleiner als vorgesehen (dann kleiner als der Text darunter): jedes Glied auf eine eigene Zeile, wie Rudi seine Karten schreibt
        if (!liste && teile.every(t => DS.mess(Object.assign({}, el, { text: t, w: 100000 })).bw <= el.w - .6)) { el.text = teile.join('\n'); el.gr = +(gr0 * .8).toFixed(2); el.h = DS.mess(el).h; return el; }   // drei Zeilen etwas kleiner, damit der Satz darunter lesbar gross bleibt
      }
    }
    let gew = null;
    for (const sp of [sperr0, Math.min(sperr0, .03)]) {   // erst enger sperren, dann kleiner bis 70 % (nie unter den Mindestgrad)
      for (let gr = gr0; gr >= unten - 1e-6; gr *= .94) { const w = wahl(sp, gr); if (w && (!gew || Math.max(w.stufe, 1) < Math.max(gew.stufe, 1))) gew = Object.assign(w, { sp, gr }); if (gew && gew.stufe <= 1) break; }   // ausgewogen vor «letzte Zeile zwei Wörter» vor allem anderen; je Stufe die grösste Schrift
      if (gew && gew.stufe <= 1) break;
    }
    if ((!gew || gew.stufe > 2) && minGr) for (let gr = unten * .94; gr >= minGr - 1e-6; gr *= .94) { const w = wahl(Math.min(sperr0, .03), gr); if (w && (!gew || w.stufe <= 2)) gew = Object.assign(w, { sp: Math.min(sperr0, .03), gr }); if (gew && gew.stufe <= 2) break; }   // notfalls bis zum Mindestgrad, bis die erste Zeile nicht kürzer ist und die letzte zwei Wörter hat
    if (gew) { el.sperr = gew.sp; el.gr = +gew.gr.toFixed(2); let a = 0; el.text = gew.z.map(e => { const t = J(a, e); a = e; return t; }).join('\n'); }
    else {   // passt gar nicht: jedes Glied auf eine eigene Zeile; ist ein Glied selbst zu breit, bricht der Satz frei um (nie eine Zeile, die später breiter gezogen wird)
      el.gr = +(minGr ? Math.min(unten, Math.max(minGr, el.gr)) : unten).toFixed(2);
      const passt = teile.every(t => DS.mess(Object.assign({}, el, { text: t, w: 100000 })).bw <= el.w - .6);
      el.text = passt ? teile.join('\n') : J(0, teile.length);
    }
    el.h = DS.mess(el).h; return el;
  }
  /* Gleiche Grösse für gleiche Rollen: alle Gerichte (Rudis Zeilen, Momos Gänge) eines Blatts in der kleinsten Grösse, die jedes ausgewogen setzt */
  function einheitlich(els) {
    const n = els.filter(e => e && e.typ === 'text'); if (n.length < 2) return els;
    const g = Math.min(...n.map(e => e.gr));
    n.forEach(e => { if (e.gr > g + .01) { e.gr = +g.toFixed(2); gliederSatz(e, g); e.h = DS.mess(e).h; } });   // Höhe immer neu (Gerichte ohne Trenner liess gliederSatz unverändert: Loch unter dem Gericht)
    return els;
  }
  const rudiZeile = t => /\s\/\s/.test(t || '') && String(t) === String(t).toUpperCase();
  const titelRolle = t => rudiZeile(t) ? { rolle: 'kapitale', sperr: .06 } : {};
  const zeilen = el => Math.max(1, Math.round(el.h / (el.gr * (el.zeile || 1.2))));
  /* Ausgewogen umbrechen: die schmalste Breite mit gleich vielen Zeilen (kein Wort allein in der letzten Zeile) */
  function ausgewogen(c, el) {
    const n = zeilen(el); if (n < 2) return el;
    const lw = Math.max(...String(el.text || '').split(/[\s\n]+/).filter(Boolean).map(w => DS.mess(Object.assign({}, el, { text: w, w: 100000 })).bw));
    let lo = Math.min(el.w, Math.max(el.w * .45, lw + .6)), hi = el.w;   // nie schmaler als das längste Wort (sonst bricht der Browser mitten im Wort)
    for (let k = 0; k < 9; k++) {
      const mid = (lo + hi) / 2, mm = DS.mess(Object.assign({}, el, { w: mid })), h = mm.h;
      if (Math.round(h / (el.gr * (el.zeile || 1.2))) <= n && mm.bw <= mid + .05) hi = mid; else lo = mid;   // gleich viele Zeilen und nichts ragt über (geschützte Leerzeichen)
    }
    const mitte = el.x + el.w / 2;
    el.w = +(hi + .2).toFixed(2); el.h = DS.mess(el).h;
    if (el.ausr === 'c') el.x = +(mitte - el.w / 2).toFixed(2);
    return el;
  }
  /* Eine Zeile ohne Umbruch (Instagram-Namen, Adressen in schmalen Feldern): kleiner bis minGr, die Mitte bleibt */
  function einzeilig(el, minGr) {
    const bw = DS.mess(Object.assign({}, el, { w: 1e5 })).bw;
    if (bw > el.w - .3) { el.gr = +Math.max(minGr || 0, el.gr * (el.w - .4) / bw).toFixed(2); el.h = DS.mess(el).h; }
    return el;
  }
  const zeichen = (c, zw, farbe, o = {}) => Object.assign({ id: id(), typ: 'zeichen', x: (c.w - zw) / 2, y: 0, w: zw, farbe: farbe || c.T.zeichen, deck: 1 }, o);
  const linie = (c, L, o = {}) => Object.assign({ id: id(), typ: 'linie', x: (c.w - L) / 2, y: 0, w: L, h: 0, staerke: Math.max(.3, .0024 * c.u), farbe: c.T.linie, deck: 1 }, o);
  const hoehe = (c, el) => el.typ === 'zeichen' ? el.w * DS.zz(c.M, el).verh : el.typ === 'linie' ? el.staerke : el.h;
  const sauber = items => {
    const out = [];
    // fehlende Felder fallen weg; ihr eigener Abstand steht als «x && zahl» gleich dahinter und fällt mit (der Abstand davor bleibt)
    for (const it of items) { if (it == null || it === false || it === '') continue; if (typeof it === 'number' && typeof out[out.length - 1] === 'number') { out[out.length - 1] = Math.max(out[out.length - 1], it); continue; } out.push(it); }
    while (typeof out[0] === 'number') out.shift();
    while (typeof out[out.length - 1] === 'number') out.pop();
    return out;
  };
  const stapelH = (c, items) => items.reduce((y, it) => y + (typeof it === 'number' ? it : hoehe(c, it)), 0);
  function setze(c, items, y) { for (const it of items) { if (typeof it === 'number') { y += it; continue; } it.y = +y.toFixed(2); y += hoehe(c, it); c.el.push(it); } return y; }
  /* Gruppe auf die optische Mitte eines Bereichs: 4 % der Bereichshöhe über der geometrischen Mitte */
  const optisch = (c, items, y0, y1) => setze(c, items, Math.max(y0 - .02 * (y1 - y0), y0 + (y1 - y0 - stapelH(c, items)) / 2 - (y1 - y0) * .042));
  /* Grösse suchen: bauer(k) liefert die Gruppe; das grösste k bis kMax, bei dem die Gruppe höchstens «anteil» der Höhe füllt */
  function passend(c, bauer, hoeheMax, kMax = 1.25, kMin = .55) {
    let lo = kMin, hi = kMax, best = bauer(kMin);
    if (stapelH(c, best) > hoeheMax) return best;
    for (let n = 0; n < 9; n++) {
      const k = (lo + hi) / 2, g = bauer(k);
      if (stapelH(c, g) <= hoeheMax) { lo = k; best = g; } else hi = k;
    }
    const g = bauer(hi); return stapelH(c, g) <= hoeheMax ? g : best;
  }
  function grund(c, seite, farbe, tapete) { seite.grund = farbe || c.T.grund; seite.tapete = tapete === undefined ? c.T.tapete : tapete; }
  /* Rahmen 4,5 % der kurzen Seite vom Rand; Kopf- und Fusszeile stehen innen gleich weit davon entfernt */
  function rahmen(c) {
    const r = Math.max(4.5, .045 * c.u);
    if (c.stil.rahmen !== 'ohne') c.el.push({ id: id(), typ: 'rahmen', x: r, y: r, w: c.w - 2 * r, h: c.h - 2 * r, staerke: Math.max(.25, .0018 * c.u), r: Math.max(1.2, .011 * c.u), farbe: c.T.linie, deck: .75 });
    return r;
  }
  /* Kopf- und Fusszeile: oben der Ort, unten Adresse und Instagram, beide im selben Abstand zum Rahmen */
  function kopfFuss(c, i, r, o = {}) {
    if (i.fuss === '' || o.ohne) return { oben: r + .05 * c.u, unten: c.h - r - .05 * c.u };
    const gr = Math.max(1.6, .014 * c.u * (o.k || 1)), abst = r + Math.max(4, .055 * c.u), farbe = c.T.mono;
    let obenT, untenT;
    if (i.fuss != null) untenT = i.fuss;
    else {
      const insta = /@culinarium_hannover|@dirtychicken/i.test([i.aktion, i.text].join(' '));
      obenT = /wild side/i.test(i.ueber || '') ? 'Culinarium Hannover' : 'Walk on the Wild Side';
      untenT = 'Haasemannstraße 13 · 30449 Hannover' + (insta ? '' : c.ton === 'dc' ? ' · @dirtychicken.hannover' : ' · Instagram @culinarium_hannover');
    }
    const bw = c.w - 2 * (r + .06 * c.u);
    let oben = abst, unten = c.h - abst;
    if (obenT) { const t = tx(c, 'mono', obenT, bw, gr, farbe, { slot: null, deck: .85, sperr: .08 }); t.y = +abst.toFixed(2); c.el.push(t); oben = abst + t.h; }
    if (untenT) { const t = tx(c, 'mono', untenT, bw, gr, farbe, { slot: 'fuss', deck: .85, sperr: .08 }); ausgewogen(c, t); t.y = +(c.h - abst - t.h).toFixed(2); c.el.push(t); unten = t.y; }
    if (!obenT) oben = c.h - unten;   // ohne Kopfzeile: oben gleich viel Luft wie unten
    return { oben, unten };
  }
  /* Zweck des Formats: wie weit weg wird gelesen */
  function zweck(c) {
    if (['a4h', 'a3h', 'a5h'].includes(c.fk)) return { titel: .105, text: .038, mono: .0165, zeichen: .13 };   // Aushang, 2–3 m
    if (c.fk === 'story' || c.fk === 'mail') return { titel: .115, text: .046, mono: .02, zeichen: .15 };       // Handy
    if (c.quer) return { titel: .14, text: .055, mono: .022, zeichen: .13 };                                    // Tisch- und Platzkarte quer
    return { titel: .118, text: .047, mono: .02, zeichen: .15 };                                                 // Karte aus Armlänge
  }

  /* Zeitleiste (Ablauf): «Eindecken bis 18 Uhr, Kerzen an um 18:45, …» → Uhrzeit links in DM Mono, Schritt rechts */
  const ZEIT = /(?:\b(?:bis|ab|um)\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*Uhr|\b(\d{1,2}):(\d{2})\b/i;
  function ablauf(text) {
    const teile = String(text || '').split(/,\s*|\.\s+|\s+·\s+/).map(s => s.trim().replace(/\.$/, '')).filter(Boolean);
    if (teile.length < 3 || !teile.every(t => ZEIT.test(t))) return null;
    return teile.map(t => {
      const m = ZEIT.exec(t), hh = m[1] || m[3], mm = m[2] || m[4] || '00', vor = /\bbis\b/i.test(m[0]) ? 'bis ' : '';
      let was = t.replace(m[0], '').replace(/\s+(um|ab|bis)\s*$/i, '').replace(/\s{2,}/g, ' ').trim();
      was = was.charAt(0).toUpperCase() + was.slice(1);
      return { wann: vor + hh.padStart(2, '0') + ':' + mm, was };
    });
  }

  /* ---------- Aushang, Hinweiskarte, Story «Ausgebucht» ---------- */
  V.aushang = Object.assign({}, ALT.aushang, {
    bau(c0, i, seite) {
      if (!istHaus(c0)) return ALT.aushang.bau(c0, i, seite);
      const c = erweitere(c0); c.stil.ausr = 'c';
      grund(c, seite); const r = rahmen(c), Z = zweck(c);
      const kf = kopfFuss(c, i, r, { ohne: c.u < 80 });
      const bw = c.w - 2 * (r + .08 * c.u), luft = .07 * c.u;
      const zeit = ablauf(i.text);
      const gruppe = k => {
        const tg = Z.titel * c.u * k, xg = Z.text * c.u * Math.min(k, 1.15);
        const zw = Z.zeichen * c.u * Math.min(1.15, Math.max(.85, k));
        // kurzer Titel («Ausgebucht») darf grösser stehen, ohne dass ein Wort bricht
        const kurz = String(i.titel || '').length <= 16, tgT = tg * (kurz ? 1.3 : 1);
        let titel = gliederSatz(tx(c, rudiZeile(i.titel) ? 'kapitale' : 'titel', i.titel, bw, tgT * (rudiZeile(i.titel) ? .7 : 1), c.T.titel, Object.assign({ slot: 'titel', zeile: 1.08 }, titelRolle(i.titel))));
        const woerter = String(i.titel || '').trim().split(/\s+/).length;
        if (zeilen(titel) > Math.max(1, Math.ceil(woerter / 2)) || DS.mess(Object.assign({}, titel, { w: 100000 })).bw > bw && woerter === 1) { titel.gr = +Math.max(mindest(c, 'titel', 'titel'), titel.gr * Math.min(1, bw / (DS.mess(Object.assign({}, titel, { w: 100000 })).bw + 1))).toFixed(2); titel.h = DS.mess(titel).h; }   // Faktor auf die gemessene Grösse (vorher auf tgT: «ausgebuc / ht» im Newsletter)
        titel = ausgewogen(c, titel);
        const lu = v => Math.min(v, (zeit ? Z.text * c.u * k * 1.05 : xg) * 1.35 * 2.2);   // Luft nie über 2,2 Textzeilen, auch wenn der Titel mitwächst
        const items = [zeichen(c, zw), lu(zw * .42),
          i.ueber && tx(c, 'mono', i.ueber, bw, Z.mono * c.u * Math.min(k, 1.1), c.T.mono, { slot: 'ueber' }), i.ueber && lu(tg * .38),
          titel, lu(tg * .5), linie(c, .08 * c.u), lu(tg * .55)];
        if (zeit) {   // Zeitleiste: Zeitspalte so breit wie die längste Zeit, Schritte an einer gemeinsamen Kante, der Block als Ganzes mittig
          const zg = Z.text * c.u * k * 1.05, gap = zg * 1.2;   // die Zeitleiste wächst mit der Gruppe (wenig Inhalt = grösser)
          const zeiten = zeit.map(z => tx(c, 'mono', z.wann, bw, zg * .8, c.T.mono, { ausr: 'l', slot: null, sperr: .04 }));
          const tw = Math.max(...zeiten.map(a => a.bw = DS.mess(a).bw)) + .5, sw = bw - tw - gap;   // ein Schritt bleibt möglichst auf einer Zeile
          const schritte = zeit.map(z => ausgewogen(c, tx(c, 'text', z.was, sw, zg, c.T.text, { ausr: 'l', slot: null, zeile: 1.3 })));
          const breite = tw + gap + Math.max(...schritte.map(b => DS.mess(b).bw)), x0 = (c.w - breite) / 2;
          zeit.forEach((z, n) => {
            const a = zeiten[n], b = schritte[n]; delete a.bw;
            a.x = +x0.toFixed(2); a.w = tw; b.x = +(x0 + tw + gap).toFixed(2);
            a.y0 = (b.gr * 1.3 - a.gr * a.zeile) / 2;
            items.push({ typ: 'reihe', teile: [a, b], h: Math.max(b.h, a.h) }, zg * 1.2);
          });
          items.pop();
        } else if (i.text) {
          items.push(ausgewogen(c, gliederSatz(tx(c, 'text', i.text, Math.min(bw, .74 * c.u + (k - 1) * 20), xg, c.T.text, { slot: 'text', zeile: 1.45 }))));
        }
        if (i.aktion) items.push(lu(xg * 1.4), tx(c, 'mono', i.aktion, bw, Z.mono * c.u * Math.min(k, 1.1), c.T.mono, { slot: 'aktion' }));
        return sauber(items);
      };
      const y0 = kf.oben + luft, y1 = kf.unten - luft;
      const g = passend(c, gruppe, Math.min(y1 - y0, (kf.unten - kf.oben) * .76), 3, .5);   // wenig Inhalt = grösser: die Gruppe füllt rund drei Viertel zwischen Kopf und Fuss
      optischReihen(c, g, y0, y1);
    },
  });

  /* Reihen (Zeit | Schritt) als ein Glied im Stapel */
  function optischReihen(c, items, y0, y1) {
    const H = items.reduce((y, it) => y + (typeof it === 'number' ? it : it.typ === 'reihe' ? it.h : hoehe(c, it)), 0);
    let y = Math.max(y0 - .02 * (y1 - y0), y0 + (y1 - y0 - H) / 2 - (y1 - y0) * .042);
    for (const it of items) {
      if (typeof it === 'number') { y += it; continue; }
      if (it.typ === 'reihe') { it.teile.forEach(t => { t.y = +(y + (t.y0 || 0)).toFixed(2); delete t.y0; c.el.push(t); }); y += it.h; continue; }
      it.y = +y.toFixed(2); y += hoehe(c, it); c.el.push(it);
    }
    return y;
  }
  const _stapelH = stapelH;
  function stapelHR(c, items) { return items.reduce((y, it) => y + (typeof it === 'number' ? it : it.typ === 'reihe' ? it.h : hoehe(c, it)), 0); }
  // passend() misst Gruppen mit Reihen
  function erweitere(c) {
    c.u = Math.min(c.w, c.h);
    c.fk = Object.keys(DS.FORMATE).find(k => DS.FORMATE[k].b === c.w && DS.FORMATE[k].h === c.h) || '';
    c.stil = Object.assign({}, c.stil);
    return c;
  }
  void _stapelH;

  /* ---------- Menükarte am Tisch: Wortmarke, «Menü», Datum, Gänge über die Höhe verteilt ---------- */
  V.menue = Object.assign({}, ALT.menue, {
    bau(c0, i, seite) {
      if (!istHaus(c0)) return ALT.menue.bau(c0, i, seite);
      const c = erweitere(c0); c.stil.ausr = 'c'; c.aufbau = 'menue'; c.stil.rahmen = c.stil.rahmen === 'ohne' ? 'einfach' : c.stil.rahmen;   // die Menükarte hat immer ihren Rahmen
      const dunkel = c.ton === 'dunkel';
      grund(c, seite); const r = rahmen(c), u = c.u, Z2 = c.M.zeichen2;
      const innen = r + .085 * u, cw = c.w - 2 * innen, akz = c.ton === 'dc' ? c.T.mono : (i.akzent || c.T.mono);
      const fussT = i.fuss != null ? i.fuss : 'Walk on the Wild Side · Haasemannstraße 13';
      const rand = r + .095 * u;   // Wortmarke und Fusszeile 9,5 % der kurzen Seite innen am Rahmen (Tor: mind. 8 %, Druckprüfung: höchstens 12 %)   // Wortmarke oben und Fusszeile unten gleich weit vom Rahmen
      /* Kopf */
      const kopf = [];
      if (Z2) { const zw = Math.min(cw * .86, .62 * c.w); kopf.push({ id: id(), typ: 'zeichen', z: 2, x: (c.w - zw) / 2, y: 0, w: zw, farbe: dunkel ? 'weiss' : Z2.farben.zeichen, deck: 1 }, .028 * u); }
      kopf.push(tx(c, 'plakat', c.M.zeile || '', cw, .0175 * u, akz === c.T.mono ? c.T.mono : akz, { slot: null, zeile: 1, sperr: .06 }));
      const kopfEnde = setze(c, sauber(kopf), rand);
      let fussY = c.h - rand;
      if (fussT) { const f = tx(c, 'mono', fussT, cw, Math.max(1.5, .016 * u), c.T.mono, { slot: 'fuss', deck: .85, sperr: .08 }); ausgewogen(c, f); f.y = +(c.h - rand - f.h).toFixed(2); c.el.push(f); fussY = f.y; }
      /* «Menü» und Datum als eigene Gruppe unter dem Kopf, dann die Gänge */
      const liste = (i.liste || []).filter(e => e && (e.name || e.detail || e.gang));
      const bauGaenge = (k, bw = cw, mx = c.w / 2) => (G0 => { const namen = G0.map(p => p.find(e => e && e.slot && /\.name$/.test(e.slot))).filter(Boolean); einheitlich(namen);
        // der Drink steht nie grösser als das Gericht (Rangfolge: Gang, Gericht, Drink); Karten nur mit Drinks bleiben, wie sie sind
        const ng = namen.length ? Math.min(...namen.map(e => e.gr)) : 0;
        if (ng) G0.flat().filter(e => e && e.slot && /\.detail$/.test(e.slot) && e.gr > ng * .8).forEach(e => { e.gr = +Math.max(e._min || 0, ng * .8).toFixed(2); gliederSatz(e, e.gr); e.h = DS.mess(e).h; });
        return G0; })(liste.map((e, n) => sauber([
        e.gang && tx(c, 'mono', e.gang, bw, .0175 * u * Math.min(1.25, k), akz, { slot: `liste.${n}.gang`, sperr: .1, x: mx - bw / 2 }), e.gang && .012 * u * k,
        e.name && ausgewogen(c, gliederSatz(tx(c, 'titel', e.name, bw, .047 * u * k, c.T.titel, { slot: `liste.${n}.name`, zeile: 1.14, x: mx - bw / 2 }))), e.name && e.detail && .01 * u * k,
        e.detail && gliederSatz(tx(c, 'text', e.detail, bw * .94, .029 * u * Math.min(1.35, k), c.T.text, { slot: `liste.${n}.detail`, deck: .82, zeile: 1.38, x: mx - bw * .47 })),
      ])));
      const titelG = k => sauber([
        i.titel && tx(c, 'titel', i.titel, cw, .13 * u * Math.min(1.1, k), c.T.titel, { slot: 'titel', zeile: 1 }), i.titel && .018 * u,
        i.ueber && tx(c, 'mono', i.ueber, cw, .02 * u, akz, { slot: 'ueber', sperr: .1 }), i.ueber && .03 * u,
        linie(c, .1 * u, { farbe: akz, staerke: Math.max(.35, .004 * u) }),
      ]);
      const text = i.text ? tx(c, 'text', i.text, cw * .9, .026 * u, c.T.text, { slot: 'text', deck: .8 }) : null;
      if (text) ausgewogen(c, text);
      const y0 = kopfEnde + .035 * u, y1 = fussY - .06 * u - (text ? text.h + .05 * u : 0);
      const verf = y1 - y0;
      /* Grösse: Gänge und Titel zusammen füllen höchstens 80 % der Höhe; der Rest wird gleichmässig verteilt (Abstand Kopf ↔ erster Gang = 1,6 × Gang ↔ Gang) */
      let k = 2.2, G, T, H;   // wenig Inhalt (kurze Gänge): die Gerichte dürfen grösser stehen, statt unten Leere zu lassen
      for (let n = 0; n < 22; n++) {
        G = bauGaenge(k); T = titelG(k);
        H = stapelH(c, T) + G.reduce((s, g) => s + stapelH(c, g), 0);
        if (H <= verf * .86 || .029 * u * k * .93 < 2.1) break;
        k *= .93;
      }
      const rest = verf - H, teile = Math.max(1, G.length - 1) + 2 * 1.6;
      const gap = Math.min(rest / teile, .1 * u), aussen = (verf - H - gap * Math.max(0, G.length - 1)) / 2;
      let y = setze(c, T, y0 + Math.max(0, Math.min(aussen * .5, gap * .8, .029 * u * Math.min(1.1, k) * 1.2)));   // «Menü» dicht unter der Wortmarke, kein Loch
      const zlD = (() => { const d = G.flat().filter(x => x && x.typ === 'text' && x.rolle === 'text').map(x => x.gr).sort((a, b) => a - b); return (d.length ? d[Math.floor(d.length / 2)] : .029 * u) * 1.35; })();
      y += Math.min(Math.max(gap, .04 * u), .08 * u, zlD * 2.2);   // nie mehr als 2,2 Textzeilen zwischen Linie und erstem Gang
      const yG = y;
      // Gänge auf die Höhe zwischen Titelgruppe und Ende verteilen
      let hG = G.reduce((s, g) => s + stapelH(c, g), 0), freiG = (y1 - yG) - hG;
      const zlG = zlD;
      {
        const gg = G.length > 1 ? Math.max(zlG * .5, Math.min(freiG / (G.length - 1 + .6), .11 * u, zlG * 2.1)) : 0;
        y = yG;   // der Rest der Höhe bleibt unten vor der Fusszeile, nie als Loch nach «Menü»
        G.forEach(g => { y = setze(c, g, y) + gg; });
      }
      if (text) { text.y = +(fussY - .05 * u - text.h).toFixed(2); c.el.push(text); }
    },
  });

  /* ---------- Karte mit Liste: Rudis Zeilen, Speisekarte, Getränkekarte ---------- */
  V.karte = Object.assign({}, ALT.karte, {
    bau(c0, i, seite) {
      if (!istHaus(c0)) return ALT.karte.bau(c0, i, seite);
      const c = erweitere(c0); c.stil.ausr = 'c';
      grund(c, seite); const r = rahmen(c), u = c.u;
      const innen = r + .09 * u, cw = c.w - 2 * innen, Z = zweck(c);
      const kf = kopfFuss(c, i, r);
      const liste = (i.liste || []).filter(e => e && (e.name || e.preis));
      const rudi = liste.length && liste.every(e => /[A-ZÄÖÜ]{3}.*\/.*[A-ZÄÖÜ]{3}/.test(e.name || '') && (e.name || '') === (e.name || '').toUpperCase());
      let eng = false;   // zu voll: kleineres Zeichen, Satz über die volle Breite, engere Abstände
      const gruppe = k => {
        const tg = .095 * u * k, zg = (eng ? .06 : .085) * u * Math.min(1.1, k);
        const kopf = sauber([
          zeichen(c, zg), zg * .45,
          i.ueber && tx(c, 'mono', i.ueber, cw, Z.mono * u * .9, c.T.mono, { slot: 'ueber' }), i.ueber && tg * .35,
          ausgewogen(c, tx(c, 'titel', i.titel, cw, tg, c.T.titel, { slot: 'titel', zeile: 1.06 })), tg * .4,
          i.text && ausgewogen(c, tx(c, 'text', i.text, eng ? cw : Math.min(cw, .78 * u + 10), .03 * u * Math.min(k, 1.15), c.T.text, { slot: 'text', deck: .85, zeile: 1.45 })), i.text && tg * .4,
          linie(c, .08 * u),
        ]);
        const posten = liste.map((e, n) => sauber([
          e.name && gliederSatz(tx(c, rudi ? 'kapitale' : 'titel', e.name, rudi ? c.w - 2 * Math.max(6, .07 * u) : cw, (rudi ? .036 : .05) * u * k, c.T.titel, { slot: `liste.${n}.name`, zeile: 1.22, sperr: rudi ? .06 : 0 })),
          e.detail && .012 * u * k,
          e.detail && ausgewogen(c, gliederSatz(tx(c, 'text', e.detail, cw * .92, .028 * u * Math.min(k, 1.12), c.T.text, { slot: `liste.${n}.detail`, deck: .8, zeile: 1.4 }))),   // Zutaten brechen nur zwischen zwei Gliedern um, nie «| Spargel» am Zeilenanfang
          e.preis && .01 * u, e.preis && tx(c, 'mono', e.preis, cw, Z.mono * u, c.T.mono, { slot: `liste.${n}.preis` }),
        ]));
        einheitlich(posten.map(p => p.find(e => e && e.slot && /\.name$/.test(e.slot))));
        return { kopf, posten };
      };
      const y0 = kf.oben + .06 * u, y1 = kf.unten - .06 * u, verf = y1 - y0;
      /* Kopf in normaler Grösse, die Posten so gross, dass Kopf und Posten mit ihren Abständen 76 % der Höhe füllen
         (wenig Inhalt = grösser; Rudis Zeilen höchstens 80 % der Titelgrösse, Gerichte höchstens 70 %) */
      let kopf = gruppe(1).kopf, hK = stapelH(c, kopf);
      // passt die Gruppe auch mit den kleinsten Posten nicht in 74 % der Höhe, wird zuerst der Kopf kleiner (nie unter den Mindestgrad)
      { const pMin = gruppe(.45).posten.reduce((s0, x) => s0 + stapelH(c, x), 0);
        for (let kk = .95; kk >= .6 && hK + pMin * 1.15 > verf * .74; kk -= .05) { kopf = gruppe(kk).kopf; hK = stapelH(c, kopf); } }
      const tgr = (kopf.find(e => e.slot === 'titel') || {}).gr || .095 * u;
      const strich = Math.min(7, .07 * u), n = liste.length;
      const basis = (rudi ? .036 : .05) * u, kMax = (rudi ? .8 : .7) * tgr / basis;
      const mass = k => { const p = gruppe(k).posten, h = p.reduce((s0, x) => s0 + stapelH(c, x), 0); return { p, h }; };
      let lo = .45, hi = Math.max(1, kMax), best = mass(lo);
      const passt = m => hK + m.h * 1.15 <= verf * .7;   // Platz für Abstände: ein Drittel der Posten-Höhe
      for (let t = 0; t < 10; t++) { const k = (lo + hi) / 2, m = mass(k); if (passt(m)) { lo = k; best = m; } else hi = k; }
      let H, frei, zl, gap, ges;
      const rechne = () => { H = hK + best.h; frei = verf - H;
        zl = (() => { const d = best.p.flat().find(e => e && e.slot && /detail$/.test(e.slot)); return d ? d.gr * (d.zeile || 1.4) : .03 * u * 1.4; })();
        gap = Math.max((eng ? .02 : .03) * u, Math.min(frei * .55 / (n + .05), .2 * u, zl * 2.1));   // nie mehr als 2,1 Textzeilen Luft (Stilblatt: kein Loch)
        ges = H + gap * (n + .05); };   // Kopf, Abstand, Posten mit ihren Abständen
      rechne();
      // zu voll (viele Posten mit Text im Kopf, kleine Formate): Posten kleiner, bis zur Fusszeile mehr als 2,5 Textzeilen Luft bleiben (sonst gehört sie zur Gruppe)
      for (let k = lo * .93, t = 0; ges > verf * .88 && k >= .45 && t < 12; k *= .93, t++) { best = mass(k); rechne(); }
      if (ges > verf * .88) { eng = true; for (let kk = 1; kk >= .6; kk -= .05) { kopf = gruppe(kk).kopf; hK = stapelH(c, kopf); for (let k = lo, t = 0; t < 16; k *= .93, t++) { best = mass(Math.max(k, .45)); rechne(); if (ges <= verf * .88 || k <= .45) break; } if (ges <= verf * .88) break; } }
      let y = y0 + Math.max(kf.oben + .015 * u - y0, (verf - ges) / 2 - verf * .04);   // zu voll: die Gruppe darf bis an die Kopfzeile, damit sie mittig bleibt
      y = setze(c, kopf, y) + gap * 1.05;
      best.p.forEach((p, j) => {
        y = setze(c, p, y);
        if (j < n - 1) { c.el.push(linie(c, strich, { y: +(y + gap / 2).toFixed(2), staerke: Math.max(.25, .0016 * u), deck: .9 })); y += gap; }
      });
    },
  });


  /* ---------- Gemeinsame Gruppe: Zeichen, Etikett, Titel, Linie, Unterzeile, Text, Aktion auf der optischen Mitte ---------- */
  /* Gruppe als Funktion der Grösse k. o.links = x: alles linksbündig an x (Aufbau «geteilt»), o.ohneZeichen, o.titel, o.zeichen */
  function gruppeBau(c, i, bw, o = {}) {
    const Z = zweck(c), u = c.u, L = o.links != null, MX = o.mx;
    const pos = L ? { ausr: 'l', x: o.links } : MX != null ? { x: MX - bw / 2 } : {};
    return k => {
      const tg = Z.titel * u * k * (o.titel || 1), xg = Z.text * u * Math.min(k, o.kText || 1.15), mg = Z.mono * u * Math.min(k, (o.kText || 1.15) - .05);   // kText: Text und Angaben wachsen bei wenig Inhalt mit (Querformate)
      const kurz = String(i.titel || '').length <= 16, tgT = tg * (kurz ? 1.25 : 1);
      const tb = rudiZeile(i.titel) && !L && MX == null ? c.w - 2 * Math.max(6, .07 * u) : bw;   // Rudis Zeile darf die volle Satzbreite nehmen, damit kein Glied allein steht
      let titel = gliederSatz(tx(c, rudiZeile(i.titel) ? 'kapitale' : 'titel', i.titel || '', tb, tgT * (rudiZeile(i.titel) ? .7 : 1), c.T.titel, Object.assign({ slot: 'titel', zeile: 1.08 }, titelRolle(i.titel), pos)));
      const ein = String(i.titel || '').trim().split(/\s+/).length === 1, voll = DS.mess(Object.assign({}, titel, { w: 100000 })).bw;
      if (ein && voll > bw) { titel.gr = +(tgT * bw / (voll + 1)).toFixed(2); titel.h = DS.mess(titel).h; }
      titel = ausgewogen(c, titel);
      const zw = Math.min(titel.gr * 1.3, Z.zeichen * u * 1.1) * (o.zeichen || 1);
      const p = x => Object.assign({}, pos, x);
      const mt = (MIND[c.fk || ''] || [0, 0])[1] || xg, zl = (i.text ? xg : Math.min(xg, mt, mg)) * 1.35, lu = v => Math.min(v, zl * 2.2);   // Luft nie über 2,2 Textzeilen
      return sauber([
        !o.ohneZeichen && zeichen(c, zw, null, L ? { x: o.links } : {}), !o.ohneZeichen && lu(zw * .42),
        i.ueber && tx(c, 'mono', i.ueber, bw, mg, c.T.mono, p({ slot: 'ueber' })), i.ueber && lu(tg * .38),
        titel, lu(titel.gr * .5), linie(c, .08 * u, L ? { x: o.links } : {}), lu(titel.gr * .55),   // grosse Titel: Luft nie über zwei Textzeilen
        i.wann && tx(c, 'mono', i.wann, bw, mg * 1.25, c.T.mono, p({ slot: 'wann', sperr: .08 })), i.wann && lu(xg * .5),
        i.wo && ausgewogen(c, gliederSatz(tx(c, 'kursiv', i.wo, bw, xg, c.T.text, p({ slot: 'wo' })))), i.wo && lu(xg * 1.2),
        i.unter && ausgewogen(c, gliederSatz(tx(c, 'mono', i.unter, bw, mg, c.T.mono, p({ slot: 'unter' })))), i.unter && lu(xg * 1.1),
        i.text && ausgewogen(c, gliederSatz(tx(c, 'text', i.text, o.textVoll ? bw : Math.min(bw, c.quer ? .72 * c.w : .74 * u + 10), xg, c.T.text, p({ slot: 'text', zeile: 1.45 })))), i.text && lu(xg * 1.4),
        i.aktion && tx(c, 'mono', i.aktion, bw, mg, c.T.mono, p({ slot: 'aktion' })),
      ]).map(e => { if (MX != null && e && typeof e === 'object') e.x = +(MX - e.w / 2).toFixed(2); return e; });   // Spaltenmitte
    };
  }
  function mitte(c, i, r, o = {}) {
    const u = c.u, bw = c.w - 2 * (r + .08 * u);
    const kf = kopfFuss(c, i, r, { ohne: o.ohneKopfFuss });
    const luft = .07 * u, y0 = kf.oben + luft, y1 = kf.unten - luft;
    let hm = o.fuellungKf ? Math.min(y1 - y0, (kf.unten - kf.oben) * o.fuellungKf) : (y1 - y0) * (o.fuellung || .76), g;   // fuellungKf: Anteil zwischen Kopf und Fuss (kleine Querformate)
    for (let n = 0; n < 8; n++) {   // mit Kopfzeile: die Gruppe hält mehr als 2,5 Textzeilen Abstand, sonst gehört der Kopf zur Gruppe
      g = passend(c, gruppeBau(c, i, bw, o), hm, o.kMax || 1.8, .5);
      if (o.ohneKopfFuss || i.fuss === '') break;
      const H = stapelH(c, g), yy = Math.max(y0 - .02 * (y1 - y0), y0 + (y1 - y0 - H) / 2 - .042 * (y1 - y0));
      const t = g.filter(e => e && e.typ === 'text' && /^(text|kursiv)$/.test(e.rolle)).map(e => e.gr).sort((a, b) => a - b), zl = (t.length ? t[Math.floor(t.length / 2)] : 0) * 1.35;
      if (!zl || yy - kf.oben > 2.7 * zl) break;
      hm *= .93;
    }
    optisch(c, g, y0, y1);
  }
  /* Kleine Querformate (A6 und DL quer) zweispaltig: links Zeichen, Etikett, Titel und Linie, rechts Datum, Ort, Satz und Instagram, jede Spalte auf ihrer
     eigenen Mitte, beide Gruppen auf derselben optischen Mitte. Wenig Höhe, wenig Inhalt: so wird alles grösser statt leerer
     (Robert «wenig Inhalt = grösser», Entscheid Oberchef 30.10.; Stilblatt › achse.ausnahmen_quer) */
  const ZWEISPALTIG = c => c.quer && ['a6q', 'dlq', 'a5q'].includes(c.fk);   // Formate wie stilblatt.json › achse.zweispaltig_quer (A5 quer seit Tor 30.10.: Inhalt klein, Hälfte leer)
  function zweispaltig(c, i, r) {
    const u = c.u, Z = zweck(c), rand = r + .07 * u, luecke = .07 * u, innen = c.w - 2 * rand;
    const wl = innen * .46, wr = innen - wl - luecke, mxL = rand + wl / 2, mxR = c.w - rand - wr / 2;
    const y0 = r + .07 * u, y1 = c.h - r - .07 * u, hm = (y1 - y0) * .8;
    const links = passend(c, gruppeBau(c, { ueber: i.ueber, titel: i.titel }, wl, { mx: mxL, titel: 1.15, zeichen: .8 }), hm, 1.6, .5);
    const tL = (links.find(e => e && e.slot === 'titel') || {}).gr || 1e9;
    const rechts = k => {
      const xg = Math.min(Z.text * u * k, tL / 2.5),   // Titel zu Text mindestens 2,5 (Stilblatt › verhaeltnisse)
        mg = Math.max(Z.mono * u * Math.min(k, 1.45), xg * .45), p = x => Object.assign({ x: mxR - wr / 2 }, x), lu = v => Math.min(v, xg * 1.35 * 2.2);
      return sauber([
        i.wann && ausgewogen(c, gliederSatz(tx(c, 'mono', i.wann, wr, mg * 1.25, c.T.mono, p({ slot: 'wann', sperr: .08 })))), i.wann && lu(xg * .6),   // umbrochen nur am « · »
        i.wo && ausgewogen(c, gliederSatz(tx(c, 'kursiv', i.wo, wr, xg, c.T.text, p({ slot: 'wo' })))), i.wo && lu(xg * 1.1),
        i.unter && ausgewogen(c, gliederSatz(tx(c, 'mono', i.unter, wr, mg, c.T.mono, p({ slot: 'unter' })))), i.unter && lu(xg * 1.1),
        i.text && ausgewogen(c, gliederSatz(tx(c, 'text', i.text, wr, xg, c.T.text, p({ slot: 'text', zeile: 1.45 })))), i.text && lu(xg * 1.3),
        i.aktion && tx(c, 'mono', i.aktion, wr, mg, c.T.mono, p({ slot: 'aktion' })),
      ]).map(e => { if (e && typeof e === 'object') e.x = +(mxR - e.w / 2).toFixed(2); return e; });
    };
    const re = passend(c, rechts, Math.min(hm, stapelH(c, links) * 1.05), 1.7, .5);   // die rechte Spalte nie höher als die linke: beide Gruppen sind eine Komposition
    // Etiketten beider Spalten (Ort, Adresse, Instagram) in einer Grösse, wie auf einer einspaltigen Karte
    const et = [...links, ...re].filter(e => e && e.typ === 'text' && e.rolle === 'mono' && /^(ueber|unter|aktion)$/.test(e.slot)), eg = Math.min(Math.max(...et.map(e => e.gr)), Math.max(Math.min(...et.map(e => e.gr)), Z.mono * u));   // nie unter die Etikettgrösse des Formats
    et.forEach(e => { if (e.slot === 'ueber') e.w = wl; });
    et.forEach(e => { const m = e.x + e.w / 2; e.gr = +eg.toFixed(2); e.h = DS.mess(e).h; ausgewogen(c, e); e.x = +(m - e.w / 2).toFixed(2); });
    const hL = stapelH(c, links), hR = stapelH(c, re), H = Math.max(hL, hR), yG = Math.max(y0, y0 + (y1 - y0 - H) / 2 - .042 * (y1 - y0));
    setze(c, links, yG + (H - hL) / 2); setze(c, re, yG + (H - hR) / 2);
  }
  /* Nur eine Fusszeile (unter einem Bild oben): Abstand zum Rand wie bei kopfFuss */
  function nurFuss(c, i) {
    const r = Math.max(4.5, .045 * c.u), abst = r + Math.max(4, .055 * c.u);
    if (i.fuss === '') return c.h - abst;
    const insta = /@culinarium_hannover|@dirtychicken/i.test([i.aktion, i.text].join(' '));
    const t = i.fuss != null ? i.fuss : 'Haasemannstraße 13 · 30449 Hannover' + (insta ? '' : c.ton === 'dc' ? ' · @dirtychicken.hannover' : ' · Instagram @culinarium_hannover');
    const el = tx(c, 'mono', t, c.w - 2 * (r + .06 * c.u), Math.max(1.6, .014 * c.u), c.T.mono, { slot: 'fuss', deck: .85, sperr: .08 });
    gliederSatz(el); ausgewogen(c, el); el.y = +(c.h - abst - el.h).toFixed(2); c.el.push(el); return el.y;
  }

  /* ---------- Titelblatt: Platzkarte, Willkommen, Pressemappe, Deckblatt ---------- */
  V.deckel = Object.assign({}, ALT.deckel, {
    bau(c0, i, seite) {
      if (!istHaus(c0)) return ALT.deckel.bau(c0, i, seite);
      const c = erweitere(c0); c.stil.ausr = 'c';
      grund(c, seite); const r = rahmen(c);
      // Platz- und Tischkarte: der Name trägt die Karte, das Zeichen ist kleiner
      if (ZWEISPALTIG(c)) return zweispaltig(c, i, r);   // Titelblatt quer: zweispaltig wie Einladung und Rückseite (Tor 30.10.: Inhalt klein, ringsum leer)
      if (c.quer && c.u < 80) i = { ueber: i.ueber, titel: i.titel, fuss: '' };   // Namensschild und Platzkarte: nur Etikett und Name, dafür gross
      mitte(c, i, r, c.u < 80 ? { titel: 1.3, zeichen: 1, ohneKopfFuss: true, fuellung: .78, kMax: 2.6 } : c.quer && c.u < 90 ? { titel: 1.1, zeichen: .8 } : c.quer && c.u < 110 ? { kMax: 2.6, titel: 1.3, zeichen: .55, textVoll: true, kText: 1.5 } : { kMax: 2.6 });   // DL/A6 quer: wenig Höhe, also kleines Zeichen und grösserer Titel (Tor 30.10.)   // kurzer Titel («Menü») darf weiter wachsen, bis die Karte gefüllt ist
    },
  });

  /* ---------- Einladung: Zeichen in der Gruppe statt allein unten ---------- */
  V.einladung = Object.assign({}, ALT.einladung, {
    bau(c0, i, seite) {
      if (!istHaus(c0)) return ALT.einladung.bau(c0, i, seite);
      const c = erweitere(c0); c.stil.ausr = 'c';
      grund(c, seite); const r = rahmen(c);
      if (ZWEISPALTIG(c)) return zweispaltig(c, i, r);
      mitte(c, i, r, c.quer && c.u < 110 ? { zeichen: .5, titel: 1.25, fuellungKf: .76, ohneKopfFuss: true, kText: 1.6, textVoll: true } : c.quer ? { zeichen: .75, titel: 1.25, fuellung: .74, ohneKopfFuss: true } : { fuellung: .72, ohneKopfFuss: true });   // kleine Querformate: wenig Höhe, also kleines Zeichen und Satz über die volle Breite
    },
  });

  /* ---------- Bild oben: Foto, Zeichen auf der Naht, darunter die Gruppe in voller Grösse ---------- */
  V.buehne = Object.assign({}, ALT.buehne, {
    bau(c0, i, seite) {
      if (!istHaus(c0)) return ALT.buehne.bau(c0, i, seite);
      const c = erweitere(c0); c.stil.ausr = 'c';
      grund(c, seite);
      const u = c.u, B = DS.B, ph0 = c.quer ? c.h * .38 : c.h * Math.min(.52, Math.max(.4, (c.stil.bild || .52) * .86)), d = .15 * u;
      const iF = /Haasemann/.test(i.aktion || '') ? Object.assign({}, i, { fuss: '' }) : i;   // Adresse steht schon in der Gruppe: keine zweite Fusszeile
      const bw = c.w - 2 * (.045 * u + .08 * u), bau = gruppeBau(c, i, bw, { ohneZeichen: true, titel: .88 });
      // Foto so hoch wie möglich, aber nie so hoch, dass die Gruppe in den Mindestgraden nicht mehr Platz hat (sonst läge die Fusszeile auf dem Text)
      const fussH = (() => { const t = c.el.length; const y = nurFuss(c, iF); c.el.length = t; return y; })();
      let ph = ph0, g, y0, y1;
      for (let n = 0; n < 8; n++) { y0 = ph + d / 2 + .05 * u; y1 = fussH - .05 * u; g = passend(c, bau, (y1 - y0) * .9, 1.3, .45); if (stapelH(c, g) <= (y1 - y0) || ph < c.h * .26) break; ph *= .9; }
      c.el.push({ id: id(), typ: 'bild', bild: i.bild, x: -B, y: -B, w: c.w + 2 * B, h: ph + B, fx: .5, fy: .5, zoom: 1, slot: 'bild' });
      c.el.push({ id: id(), typ: 'flaeche', x: (c.w - d) / 2, y: ph - d / 2, w: d, h: d, r: d / 2, farbe: seite.grund, tapete: seite.tapete, deck: 1 });
      const zw = d * .6, z = zeichen(c, zw); z.y = +(ph - zw * DS.zz(c.M, z).verh / 2).toFixed(2); c.el.push(z);
      nurFuss(c, iF);
      optisch(c, g, y0, y1);
    },
  });

  /* ---------- Bild im Rahmen: Foto mit feinem Rahmen oben, darunter die Gruppe ---------- */
  V.fenster = Object.assign({}, ALT.fenster, {
    bau(c0, i, seite) {
      if (!istHaus(c0) || c0.w > c0.h * 1.15) return ALT.fenster.bau(c0, i, seite);
      const c = erweitere(c0); c.stil.ausr = 'c';
      grund(c, seite);
      const u = c.u, m = Math.max(7, .075 * u), g0 = Math.max(1.2, .015 * u);
      let ph = c.h * Math.min(.52, Math.max(.36, (c.stil.bild || .54) * .87));
      const fussH = (() => { const t = c.el.length; const y = nurFuss(c, i); c.el.length = t; return y; })();
      const bw = c.w - 2 * (m + .04 * u), bau = gruppeBau(c, i, bw, { ohneZeichen: true });
      let gr, y0, y1;   // Foto kleiner, wenn die Gruppe sonst an die Fusszeile stösst
      for (let n = 0; n < 8; n++) { y0 = m + ph + .07 * u; y1 = fussH - .05 * u; gr = passend(c, bau, (y1 - y0) * .84, 1.3, .45); if (stapelH(c, gr) <= (y1 - y0) || ph < c.h * .24) break; ph *= .9; }
      c.el.push({ id: id(), typ: 'bild', bild: i.bild, x: m, y: m, w: c.w - 2 * m, h: ph, fx: .5, fy: .5, zoom: 1, slot: 'bild' });
      c.el.push({ id: id(), typ: 'rahmen', x: m - g0, y: m - g0, w: c.w - 2 * m + 2 * g0, h: ph + 2 * g0, staerke: Math.max(.25, .0018 * u), r: 0, farbe: c.T.linie, deck: .8 });
      nurFuss(c, i);
      optisch(c, gr, y0, y1);
    },
  });

  /* ---------- Bild und Text geteilt (hoch): oben die Gruppe linksbündig auf einer Kante, unten das Foto ---------- */
  V.geteilt = Object.assign({}, ALT.geteilt, {
    bau(c0, i, seite) {
      if (!istHaus(c0) || c0.w > c0.h * 1.15) return ALT.geteilt.bau(c0, i, seite);
      const c = erweitere(c0); c.stil.ausr = 'l';
      grund(c, seite);
      const u = c.u, B = DS.B, ph = c.h * Math.min(.58, Math.max(.42, c.stil.bild || .5));
      c.el.push({ id: id(), typ: 'bild', bild: i.bild, x: -B, y: c.h - ph, w: c.w + 2 * B, h: ph + B, fx: .5, fy: .5, zoom: 1, slot: 'bild' });
      const x0 = .1 * u, bw = c.w - 2 * x0, y0 = .09 * u, y1 = c.h - ph - .09 * u;
      optisch(c, passend(c, gruppeBau(c, i, bw, { links: x0, ohneZeichen: true }), (y1 - y0) * .9, 1.3, .45), y0, y1);
    },
  });

  /* ---------- Plakat des Abends in hohen Formaten (Story, A3, A4, 4:5): das Motiv steht ganz, nie angeschnitten ----------
     Rudis Illustrationen sind quadratisch und tragen oft die gemalte Kopfzeile. Im hohen Bildfeld wurden sie seitlich beschnitten («LK ON THE WILD S»).
     Jetzt: Motiv in voller Breite oben, darunter bis zur Wortmarke eine ruhige Fläche in der Farbwelt des Motivs. */
  V.plakat = Object.assign({}, ALT.plakat, {
    bau(c, i, seite) {
      if (!istHaus(c) || (c.h <= c.w * 1.1 && c.w <= c.h * 1.1)) return ALT.plakat.bau(c, i, seite);
      const quer = c.w > c.h;
      /* Hohe Formate: das ganze Plakat (quadratisch wie die echten) als Karte auf der optischen Mitte, darum die Farbe des Motivs randlos */
      const digital = (Object.values(DS.FORMATE).find(f => f.b === c.w && f.h === c.h) || {}).digital, mx = !digital && i.bild ? (((DS.M.bildIndex || {})[i.bild] || {}).w || 0) / 152 * 25.4 / .917 : 0;
      const W = +Math.min(quer ? c.h * .84 : c.w * .86, mx || 1e9).toFixed(2), c2 = Object.assign({}, c, { w: W, h: W, el: [], s: Math.sqrt(W * W / (105 * 148)) });
      c2.s8 = Math.pow(c2.s, .8);
      ALT.plakat.bau(c2, i, seite);
      const kartenGrund = seite.grund;
      const mo = (window.DSPlakat && DSPlakat.motive && DSPlakat.motive().find(m => m.key === i.bild)) || {};
      seite.grund = i.grund || mo.rueck_farbe || (c.ton === 'dunkel' ? 'nacht' : 'navy'); seite.tapete = null;
      const x0 = (c.w - W) / 2, y0 = quer ? (c.h - W) / 2 : Math.max(x0, (c.h - W) / 2 - (c.h - W) * .06);
      c.el.push({ id: id(), typ: 'flaeche', x: +x0.toFixed(2), y: +y0.toFixed(2), w: W, h: W, r: 0, farbe: kartenGrund, deck: 1 });
      c2.el.forEach(e => { e.x = +(e.x + x0).toFixed(2); e.y = +(e.y + y0).toFixed(2); c.el.push(e); });
      if (quer) return;
      // Kopf- und Fusszeile in Warmweiss, gleich weit vom Rand: Ort oben, Instagram unten
      const gr = Math.max(1.6, .02 * c.w), abst = Math.max(8, (y0 - gr * 1.6) / 2);
      const o = tx(c, 'mono', 'Walk on the Wild Side · Hannover', c.w * .8, gr, 'weiss', { slot: null, deck: .9, sperr: .1 }); o.y = +abst.toFixed(2); c.el.push(o);
      const f = tx(c, 'mono', (c.ton === 'dc' ? '@dirtychicken.hannover' : '@culinarium_hannover'), c.w * .8, gr, 'weiss', { slot: 'fuss', deck: .9, sperr: .1 }); f.y = +(c.h - abst - f.h).toFixed(2); c.el.push(f);
    },
  });

  /* ---------- Gutschein für einen Abend (Robert 29.10.: «Ein Gutschein für einen Abend können wir doch auch schon entwerfen») ----------
     Vorn: mit Plakat (das Plakat ganz, seine Wortmarke ist das Logo, kein C daneben) oder ohne (C, Etikett, Titel, Linie, Satz). Rückseite: gutscheinrueck. */
  V.gutschein = Object.assign({}, ALT.gutschein, {
    bau(c0, i, seite) {
      if (!istHaus(c0)) return ALT.gutschein.bau(c0, i, seite);
      if (c0.w <= c0.h * 1.15) { const c = erweitere(c0); c.stil.ausr = 'c'; grund(c, seite); const r = rahmen(c);   // hoch: dieselbe Gruppe wie jedes Titelblatt
        return mitte(c, { ueber: i.ueber || 'Gutschein', titel: i.titel || 'Ein Abend an der langen Tafel', text: i.text || 'Drei Gänge von Rudi, fünf Drinks von Momo.', aktion: (c.ton === 'dc' ? '@dirtychicken.hannover' : '@culinarium_hannover'), fuss: '' }, r, { ohneKopfFuss: true }); }
      const c = erweitere(c0); c.stil.ausr = 'c';
      grund(c, seite); const u = c.u;
      let x0 = 0;
      if (i.bild) {
        const m = .09 * u, s = c.h - 2 * m, rand = .025 * u;
        c.el.push({ id: id(), typ: 'flaeche', x: m, y: m, w: s, h: s, r: 0, farbe: 'weiss', deck: 1 });
        c.el.push({ id: id(), typ: 'bild', bild: i.bild, x: m + rand, y: m + rand, w: s - 2 * rand, h: s - 2 * rand, fx: .5, fy: .5, zoom: 1, slot: 'bild' });
        x0 = m + s;
      } else { const r = rahmen(c);   // ohne Bild: zweispaltig wie die übrigen Querformate (Tor 30.10.)
        if (ZWEISPALTIG(c)) return zweispaltig(c, { ueber: i.ueber || 'Gutschein', titel: i.titel || 'Ein Abend an der langen Tafel', text: i.text, aktion: c.ton === 'dc' ? '@dirtychicken.hannover' : '@culinarium_hannover' }, r); }
      const bw = c.w - x0 - .2 * u, cx = x0 + (c.w - x0) / 2;
      const g = k => {
        const t = ausgewogen(c, tx(c, 'titel', i.titel || 'Ein Abend an der langen Tafel', bw, .13 * u * k, c.T.titel, { slot: 'titel', zeile: 1.06, x: cx - bw / 2 }));
        return sauber([
          !i.bild && zeichen(c, .14 * u * Math.min(1.1, k), null, { x: cx - .07 * u * Math.min(1.1, k) }), !i.bild && .05 * u,
          tx(c, 'mono', i.ueber || 'Gutschein', bw, .028 * u, c.T.mono, { slot: 'ueber', sperr: .1, x: cx - bw / 2 }), .05 * u,
          t, .045 * u, linie(c, .09 * u, { x: cx - .045 * u }), .045 * u,
          i.text && ausgewogen(c, tx(c, 'text', i.text, bw * .9, .047 * u, c.T.text, { slot: 'text', x: cx - bw * .45 })),
        ]);
      };
      optisch(c, passend(c, g, c.h * .6, 1.3, .5), .14 * u, c.h - .14 * u);
    },
  });
  V.gutscheinrueck = {
    name: 'Gutschein, Rückseite', wofuer: 'Rückseite des Gutscheins: für wen, von wem, Personen, gültig bis, Wert, Nummer, Einlösung',
    slots: ['fuer', 'von', 'personen', 'bis', 'wert', 'nr', 'text'],
    bau(c0, i, seite) {
      const c = erweitere(c0); grund(c, seite); const u = c.u, T = c.T;   // Rückseite im Ton der Vorderseite
      const leer = v => (v && !/\[[^\]]*\]/.test(v)) ? v : '';   // Platzhalter nie ins Druckbild: das Feld bleibt zum Ausfüllen leer (Hinweis bleibt in der Druckprüfung)
      const felder = [['Für', leer(i.fuer)], ['Von', leer(i.von)], ['Personen', leer(i.personen)], ['Gültig bis', leer(i.bis)], ['Wert', leer(i.wert)]];
      const x0 = .14 * u, lw = .3 * u, fw = c.w * .58 - x0 - lw, zh = .14 * u;
      let y = (c.h - felder.length * zh) / 2 + zh * .55;
      felder.forEach(([n, w], k) => {
        const a = tx(c, 'mono', n, lw, .022 * u, T.mono, { ausr: 'l', x: x0, slot: null, sperr: .14 }); a.y = +(y - a.h).toFixed(2); c.el.push(a);
        if (w) { const b = tx(c, 'titel', w, fw, .045 * u, T.titel, { ausr: 'l', x: x0 + lw, slot: ['fuer', 'von', 'personen', 'bis', 'wert'][k] }); b.y = +(y - b.h).toFixed(2); c.el.push(b); }
        c.el.push({ id: id(), typ: 'flaeche', x: +(x0 + lw).toFixed(2), y: +(y + .006 * u).toFixed(2), w: +fw.toFixed(2), h: .25, r: 0, farbe: T.text, deck: .4 });   // Schreibfeld, kein Schmuckstrich
        y += zh;
      });
      const xs = c.w * .64; c.el.push({ id: id(), typ: 'flaeche', x: xs, y: .14 * u, w: .25, h: c.h - .28 * u, r: 0, farbe: T.linie, deck: 1 });   // Trennung der zwei Felder
      const bw = c.w - xs - .1 * u, cx = xs + (c.w - xs) / 2;
      const g = sauber([zeichen(c, .11 * u, null, { x: cx - .055 * u }), .04 * u,
        tx(c, 'mono', 'Nr. ' + (leer(i.nr) || '__________'), bw, .022 * u, T.mono, { slot: 'nr', sperr: .1, x: cx - bw / 2 }), .05 * u,
        ausgewogen(c, tx(c, 'text', i.text || 'Einzulösen für einen Abend nach Wahl. Den Termin vereinbart ihr über Instagram.', bw, .031 * u, T.text, { slot: 'text', x: cx - bw / 2, zeile: 1.4 })), .035 * u,
        einzeilig(tx(c, 'mono', (c.ton === 'dc' ? '@dirtychicken.hannover' : '@culinarium_hannover'), bw, .018 * u, T.mono, { slot: null, x: cx - bw / 2 }), 1.5)]);   // der Name bricht nie («HANNOVE / R»)
      optisch(c, g, .1 * u, c.h - .1 * u);
    },
  };

  /* ---------- Rückseite mit Adresse (Flyer, Seite 2): Zeichen, Name, Satz, Adresse als eine Gruppe ---------- */
  V.rueckseite = Object.assign({}, ALT.rueckseite, {
    bau(c0, i, seite) {
      if (!istHaus(c0)) return ALT.rueckseite.bau(c0, i, seite);
      const c = erweitere(c0); c.stil.ausr = 'c'; grund(c, seite); const r = rahmen(c);
      const dc = c.ton === 'dc';
      const ir = { ueber: dc ? 'Pop-up im Walk on the Wild Side' : 'Walk on the Wild Side', titel: dc ? 'Dirty Chicken' : 'Culinarium', text: dc ? 'Sandwiches & More, Dirty Drinks und Live-Musik.' : (i.text || 'Food-Pairing-Abende an einer langen Tafel.'), unter: 'Haasemannstraße 13 · 30449 Hannover', aktion: dc ? '@dirtychicken.hannover' : '@culinarium_hannover', fuss: '' };
      if (ZWEISPALTIG(c)) return zweispaltig(c, ir, r);
      mitte(c, { ueber: dc ? 'Pop-up im Walk on the Wild Side' : 'Walk on the Wild Side', titel: dc ? 'Dirty Chicken' : 'Culinarium', text: dc ? 'Sandwiches & More, Dirty Drinks und Live-Musik.' : (i.text || 'Food-Pairing-Abende an einer langen Tafel.'), unter: 'Haasemannstraße 13 · 30449 Hannover', aktion: c.ton === 'dc' ? '@dirtychicken.hannover' : '@culinarium_hannover', fuss: '' }, r, c.quer && c.u < 110 ? { ohneKopfFuss: true, titel: 1.25, zeichen: .5, fuellungKf: .76, kText: 1.6, textVoll: true } : c.quer ? { ohneKopfFuss: true, titel: 1.1, zeichen: .65, fuellung: .74 } : c.w === c.h ? { ohneKopfFuss: true, titel: 1.25, zeichen: .7, fuellung: .74, kText: 1.6, textVoll: true } : { ohneKopfFuss: true, titel: 1, fuellung: .74 });   // Quadrat: Satz und Angaben wachsen mit (Tor 30.10.: Inhalt klein); quer: «@culinarium_hannover» bleibt klar über dem unteren Sechstel (sonst liest das Tor es als Fusszeile)
    },
  });

  /* ---------- Aufbauten aus dem Kern (Programm, Bild und Text quer, Bild im Rahmen quer): Mindestgrade nachziehen ---------- */
  function mindestNach(c0, seite) {
    if (!istHaus(c0)) return; const c = erweitere(Object.assign({}, c0));
    c0.el.forEach(el => { if (el.typ === 'linie' && el.w > .072 * Math.min(c0.w, c0.h) && el.w < .2 * Math.min(c0.w, c0.h)) { const m = el.x + el.w / 2; el.w = +(.07 * Math.min(c0.w, c0.h)).toFixed(2); el.x = +(m - el.w / 2).toFixed(2); } if (el.typ !== 'text') return; if (el.rolle === 'titel' && rudiZeile(el.text)) { el.rolle = 'kapitale'; el.sperr = .06; el.gr = +(el.gr * .7).toFixed(2); el.h = DS.mess(el).h; } const m = mindest(c, el.rolle, el.slot); if (el.gr < m) { el.gr = +m.toFixed(2); el.h = DS.mess(el).h; } });
    void seite;
  }
  for (const k of ['plakatrueck']) {
    const alt = V[k] || ALT[k]; if (!alt) continue;
    V[k] = Object.assign({}, alt, { bau(c, i, seite) { alt.bau(c, i, seite); mindestNach(c, seite); } });
  }

  /* ---------- Programm («Die nächsten Abende»): Zeichen, Etikett, Titel, Linie und die Termine als eine Gruppe auf der optischen Mitte, über die Höhe verteilt
     (Tor 29.10.: «Die / nächsten Abende», Linie klebte am ersten Datum, unten leer) ---------- */
  V.programm = Object.assign({}, ALT.programm, {
    bau(c0, i, seite) {
      if (!istHaus(c0)) return ALT.programm.bau(c0, i, seite);
      const c = erweitere(c0); c.stil.ausr = 'c'; grund(c, seite); const r = rahmen(c);
      const kf = kopfFuss(c, i, r), u = c.u, Z = zweck(c), bw = c.w - 2 * (r + .08 * u);
      const y0 = kf.oben + .07 * u, y1 = kf.unten - .07 * u, termine = (i.termine || []).filter(t => t && (t.wann || t.was || t.wo));
      let eng = false;   // viele Termine mit ganzen Sätzen («Wie es kam»): kleineres Zeichen, Sätze in Textgrösse, weniger Luft zwischen den Terminen
      const bau = k => {
        const tg = Z.titel * u * k, xg = Z.text * u * Math.min(k, 1.3), mg = Z.mono * u * Math.min(k, 1.25);
        const titel = tx(c, 'titel', i.titel || '', bw, tg * (String(i.titel || '').length <= 16 ? 1.25 : 1), c.T.titel, { slot: 'titel', zeile: 1.08 });
        if (String(i.titel || '').trim().split(/\s+/).length <= 3 && zeilen(titel) > 1) {   // kurzer Titel auf eine Zeile («Die nächsten Abende»), solange der Mindestgrad hält
          const ganz = DS.mess(Object.assign({}, titel, { text: titel.text.replace(/\u00a0/g, ' '), w: 1e5 })).bw, g1 = titel.gr * (titel.w - .5) / ganz;
          if (g1 >= titel._min) { titel.text = titel.text.replace(/\u00a0/g, ' '); titel.gr = +g1.toFixed(2); titel.h = DS.mess(titel).h; }
        }
        ausgewogen(c, titel);
        const zw = Math.min(titel.gr * 1.3, Z.zeichen * u * 1.1) * (eng ? .55 : .8), zl = xg * 1.35, lu = v => Math.min(v, zl * 2.2);
        const items = [zeichen(c, zw), lu(zw * .42), i.ueber && tx(c, 'mono', i.ueber, bw, mg, c.T.mono, { slot: 'ueber' }), i.ueber && lu(tg * .38),
          titel, lu(titel.gr * .5), linie(c, .08 * u), lu(titel.gr * .7)];
        termine.forEach((t, n) => items.push(
          t.wann && tx(c, 'mono', t.wann, bw, mg * 1.15, c.T.mono, { slot: `termine.${n}.wann`, sperr: .08 }), t.wann && xg * .4,
          t.was && ausgewogen(c, tx(c, 'text', t.was, bw, xg * (eng ? 1 : 1.2), c.T.text, { slot: `termine.${n}.was` })), t.was && xg * .3,
          t.wo && ausgewogen(c, gliederSatz(tx(c, 'mono', t.wo, bw, mg, c.T.mono, { slot: `termine.${n}.wo` }))), n < termine.length - 1 && lu(xg * (eng ? 1.1 : 1.9))));
        return sauber(items);
      };
      let g = passend(c, bau, (y1 - y0) * .76, 1.9, .5);
      if (stapelH(c, g) > (y1 - y0) * .78) { eng = true; g = passend(c, bau, (y1 - y0) * .76, 1.9, .4); }
      optisch(c, g, y0, y1);
    },
  });


  /* ---------- Druckschärfe: Fotos und Plakate nie unter 150 dpi (Druckprüfung). Rudis Plakate gibt es nur in Instagram-Grösse:
     sie stehen dann kleiner, ganz und mit mehr Rand, statt hochgerechnet zu werden. ---------- */
  const DPI = 152, mmMax = key => { const b = (DS.M && DS.M.bildIndex || {})[key]; return b && b.w ? { w: b.w / DPI * 25.4, h: b.h / DPI * 25.4 } : null; };
  V.plakatganz = Object.assign({}, ALT.plakatganz, {
    bau(c, i, seite) {
      ALT.plakatganz.bau(c, i, seite);
      if (!istHaus(c) || DS.FORMATE[Object.keys(DS.FORMATE).find(k => DS.FORMATE[k].b === c.w && DS.FORMATE[k].h === c.h)]?.digital) return;
      const b = c.el.find(e => e.typ === 'bild'), m = b && mmMax(b.bild); if (!m || b.w <= m.w) return;
      const f = m.w / b.w, w = b.w * f, h = b.h * f; b.x = +((c.w - w) / 2).toFixed(2); b.y = +((c.h - h) / 2 - (c.h - h) * .04).toFixed(2); b.w = +w.toFixed(2); b.h = +h.toFixed(2);
    },
  });

  /* ---------- Postkarten-Rückseite (Kartengruss): links der Gruss auf seiner Achse, rechts Markenfeld mit dem C und Schreiblinien ---------- */
  V.kartengruss = Object.assign({}, ALT.kartengruss, {
    bau(c0, i, seite) {
      if (!istHaus(c0)) return ALT.kartengruss.bau(c0, i, seite);
      const c = erweitere(c0); grund(c, seite); const u = c.u;
      const rand = Math.max(8, .09 * u), mitte = c.quer ? c.w * .52 : c.w;
      const lw = (c.quer ? mitte : c.w) - 2 * rand, lx = rand;
      const g = sauber([
        tx(c, 'mono', c.ton === 'dc' ? 'Dirty Chicken' : 'Culinarium', lw, Math.max(1.6, .017 * u), c.T.mono, { slot: null, x: lx }), .03 * u,   // Grund «dc»: Dirty Chicken
        i.titel && ausgewogen(c, tx(c, 'titel', i.titel, lw, .085 * u, c.T.titel, { slot: 'titel', x: lx, zeile: 1.1 })), i.titel && .03 * u,
        linie(c, .08 * u, { x: lx + (lw - .08 * u) / 2 }), .03 * u,
        i.text && ausgewogen(c, tx(c, 'text', i.text, lw * .9, Math.max(2.4, .03 * u), c.T.text, { slot: 'text', x: lx + lw * .05, zeile: 1.45 })),
      ]);
      optisch(c, g, rand, c.h - rand);
      if (!c.quer) return;
      c.el.push({ id: id(), typ: 'flaeche', x: +mitte.toFixed(2), y: rand, w: .25, h: c.h - 2 * rand, r: 0, farbe: c.T.linie, deck: 1 });
      const rx = mitte + rand * .8, rw = c.w - rx - rand, mb = Math.min(22, rw * .34);
      c.el.push({ id: id(), typ: 'rahmen', x: +(c.w - rand - mb).toFixed(2), y: rand, w: mb, h: +(mb * 1.2).toFixed(2), staerke: .25, r: .8, farbe: c.T.linie, deck: .6 });
      const z = zeichen(c, mb * .5, null, { x: c.w - rand - mb * .75 }); z.y = +(rand + mb * .6 - mb * .5 * DS.zz(c.M, z).verh / 2).toFixed(2); c.el.push(z);
      for (let n = 0; n < 4; n++) c.el.push({ id: id(), typ: 'flaeche', x: +rx.toFixed(2), y: +(c.h * .5 + n * c.h * .1).toFixed(2), w: +rw.toFixed(2), h: .25, r: 0, farbe: c.T.text, deck: .38 });   // Schreiblinien als Felder, kein Schmuck
    },
  });

  /* ---------- Ansichtskarte: Foto randlos, unten links ein Schild mit Ort und Zeile; Masse aus dem eigenen Satz, nichts überlappt ---------- */
  V.ansicht = Object.assign({}, ALT.ansicht, {
    bau(c0, i, seite) {
      if (!istHaus(c0)) return ALT.ansicht.bau(c0, i, seite);
      const c = erweitere(c0); grund(c, seite, 'navy', null); const u = c.u, B = DS.B;
      c.el.push({ id: id(), typ: 'bild', bild: i.bild, x: -B, y: -B, w: c.w + 2 * B, h: c.h + 2 * B, fx: .5, fy: .5, zoom: 1, slot: 'bild' });
      const dunkel = c.ton !== 'hell', schild = dunkel ? 'papier' : 'navy', tf = dunkel ? 'tanne' : 'weiss', mf = dunkel ? 'taupe' : 'gold';
      const pad = Math.max(3.5, .045 * u), rand = Math.max(6, .06 * u), max = Math.min(c.w * .7, c.w - 2 * rand - 2 * pad);
      const t = tx(c, 'titel', i.titel || '', max, Math.min(.085 * u, c.w / 14), tf, { ausr: 'l', slot: 'titel', x: rand + pad, zeile: 1.08 });
      const un = i.unter ? tx(c, 'mono', i.unter, max, Math.max(1.6, .02 * u), mf, { ausr: 'l', slot: 'unter', x: rand + pad }) : null;
      const bw = Math.min(max, Math.max(DS.mess(Object.assign({}, t, { w: max })).bw, un ? DS.mess(Object.assign({}, un, { w: max })).bw : 0) + .5);
      t.w = bw; t.h = DS.mess(t).h; if (un) { un.w = bw; un.h = DS.mess(un).h; }
      const sh = 2 * pad + t.h + (un ? un.h + .012 * u : 0), sy = c.h - rand - sh;
      c.el.push({ id: id(), typ: 'flaeche', x: rand, y: +sy.toFixed(2), w: +(bw + 2 * pad).toFixed(2), h: +sh.toFixed(2), r: Math.max(1, .012 * u), farbe: schild, deck: 1 });
      t.y = +(sy + pad).toFixed(2); c.el.push(t);
      if (un) { un.y = +(t.y + t.h + .012 * u).toFixed(2); c.el.push(un); }
    },
  });

  /* Beispiel für den Aufbau «Plakat aus dem Archiv» im Reiter Vorlagen: ein echtes Plakat, ganz */
  DS.BEISPIEL.plakatganz = DS.BEISPIEL.plakatganz && DS.BEISPIEL.plakatganz.bild ? DS.BEISPIEL.plakatganz : { bild: 'po_DbYnkdkjrNy' };
  if (DS.BEISPIEL.ansicht) DS.BEISPIEL.ansicht = Object.assign({}, DS.BEISPIEL.ansicht, { bild: 'schildnacht' });   // 2400 px statt 1000 px: scharf auch in A5

  /* ---------- Sicherer Abstand: kein Text näher als 5 mm am Schnitt (Roberts Kriterium 2, nichts klebt am Rand) ---------- */
  const SICHER = 5;
  for (const k of Object.keys(V)) {
    const a = V[k];
    V[k] = Object.assign({}, a, { bau(c, i, seite) {
      a.bau(c, i, seite); if (!istHaus(c)) return;
      for (const el of c.el) {
        if (el.typ !== 'text') continue;
        if (/\n/.test(el.text)) {   // fest umbrochene Zeilen («3 GÄNGE MENÜ / 5 SiGNATURE DRiNKS») dürfen nie ein zweites Mal umbrechen
          const nb = DS.mess(Object.assign({}, el, { w: 100000 })).bw + 1.5;
          if (nb > el.w && nb <= c.w - 2 * SICHER) { if (el.ausr === 'c') el.x += (el.w - nb) / 2; el.w = +nb.toFixed(2); el.x = +Math.min(Math.max(el.x, SICHER), c.w - SICHER - el.w).toFixed(2); el.h = DS.mess(el).h; }
        }
        const l = Math.max(el.x, SICHER), r = Math.min(el.x + el.w, c.w - SICHER);
        if (l === el.x && r === el.x + el.w) continue;
        if (el.ausr === 'c') { const m = c.w / 2, h = Math.min(el.x + el.w / 2 - SICHER, c.w - SICHER - (el.x + el.w / 2)); const mitte = el.x + el.w / 2; el.w = +Math.max(10, 2 * Math.min(h, el.w / 2)).toFixed(2); el.x = +(mitte - el.w / 2).toFixed(2); void m; }
        else {   // linksbündig: erst die Zeile zusammenhalten und nach innen rücken, nur wenn sie nicht passt, schmaler setzen
          const bw = DS.mess(Object.assign({}, el, { w: 100000 })).bw + 1.5;
          if (bw <= c.w - 2 * SICHER) { el.w = +(bw > r - l ? bw : Math.min(el.w, r - l)).toFixed(2); el.x = +Math.min(Math.max(el.x, SICHER), c.w - SICHER - el.w).toFixed(2); }
          else { el.x = +l.toFixed(2); el.w = +Math.max(10, r - l).toFixed(2); }
        }
        el.h = DS.mess(el).h;
      }
      if (c.el.length) seite.el = c.el;
    } });
  }

  /* ---------- Querformat von «Bild im Rahmen» und «Bild und Text»: Bild links, die Gruppe auf der Mitte der rechten Spalte (Stilblatt › achse.ausnahmen_quer) ---------- */
  for (const k of ['fenster', 'geteilt']) {
    const hoch = V[k];
    V[k] = Object.assign({}, hoch, { bau(c0, i, seite) {
      if (!istHaus(c0) || c0.w <= c0.h * 1.15) return hoch.bau(c0, i, seite);
      const c = erweitere(c0); grund(c, seite); const u = c.u, B = DS.B;
      if (k === 'fenster') { const m = Math.max(6, .075 * u), g0 = Math.max(1.2, .015 * u), pw = c.w * .5 - m;
        c.el.push({ id: id(), typ: 'bild', bild: i.bild, x: m, y: m, w: pw, h: c.h - 2 * m, fx: .5, fy: .5, zoom: 1, slot: 'bild' });
        c.el.push({ id: id(), typ: 'rahmen', x: m - g0, y: m - g0, w: pw + 2 * g0, h: c.h - 2 * m + 2 * g0, staerke: Math.max(.25, .0018 * u), r: 0, farbe: c.T.linie, deck: .8 }); }
      else c.el.push({ id: id(), typ: 'bild', bild: i.bild, x: -B, y: -B, w: c.w * .5 + B, h: c.h + 2 * B, fx: .5, fy: .5, zoom: 1, slot: 'bild' });
      const x0 = c.w * .5 + Math.max(6, .06 * u), x1 = c.w - Math.max(6, .07 * u), bw = x1 - x0, mx = (x0 + x1) / 2;
      const y0 = Math.max(6, .08 * u), y1 = c.h - Math.max(6, .08 * u);
      optisch(c, passend(c, gruppeBau(c, i, bw, { mx, ohneZeichen: k === 'fenster', zeichen: .7, titel: .8 }), (y1 - y0) * .8, 1.2, .4), y0, y1);
    } });
  }

  /* ---------- Grund «dc» im Reiter «Vorlagen»: das Muster zeigt Dirty-Chicken-Inhalt statt Culinarium-Text unter dem D ---------- */
  const DC = { ueber: 'Dirty Chicken', titel: 'Dirty Food & Dirty Drinks', unter: 'Pop-up im Walk on the Wild Side', text: 'Sandwiches & More, Dirty Drinks und Live-Musik. Nur an einzelnen Tagen.',
    aktion: '@dirtychicken.hannover', bild: 'dn_burger',   // Rudis Foto in voller Auflösung (dc_burger hat nur 1000 px)
    wann: 'Samstag, 30. Mai · ab 18 Uhr', wo: 'AM:PM Café im Tiedthof',
    liste: [{ name: 'Sandwich', detail: 'Paprika-Honig-Mayo, eingelegte Zwiebeln', preis: '' }, { name: 'Chicken Chunks', detail: 'Spicy Glaze, grüne Sauce', preis: '' }, { name: 'Pommes & Krautsalat', detail: 'kommen immer mit', preis: '' }, { name: 'Dirty Drinks', detail: 'von der Bar', preis: '' }],
    termine: [{ wann: 'Samstag, 30. Mai', was: 'Das erste Pop-up', wo: 'AM:PM Café im Tiedthof' }, { wann: 'Bald wieder', was: 'Das nächste Pop-up', wo: 'auf Instagram' }] };
  const gleich = (a, b) => { try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; } };
  for (const k of Object.keys(V)) {
    if (!DS.BEISPIEL[k] || /^plakat/.test(k)) continue;
    const a = V[k];
    V[k] = Object.assign({}, a, { bau(c, i, seite) {
      if (istHaus(c) && c.ton === 'dc' && gleich(i, DS.BEISPIEL[k])) { const j = {}; for (const f of Object.keys(i)) j[f] = DC[f] !== undefined ? DC[f] : i[f]; if (k === 'menue') j.titel = 'Dirty Food.'; if (k === 'kartengruss' && i.text) j.text = 'Sandwiches & More, Dirty Drinks und Live-Musik.'; return a.bau(c, j, seite); }   // Postkarte: der Gruss bleibt so kurz wie im Beispiel
      return a.bau(c, i, seite);
    } });
  }

  /* ---------- Plakat in hohen Formaten: der Aufbau «Plakat hoch» der Werkstatt (Motiv gross und ganz, Kopfzeile wie Rudi, Wortmarke, Band) ---------- */
  if (V.plakathoch) { const pl = V.plakat; V.plakat = Object.assign({}, pl, { bau(c, i, seite) {
    if (istHaus(c) && c.h > c.w * 1.1 && c.h <= c.w * 1.95) {
      const n0 = c.el.length, r = V.plakathoch.bau(c, i, seite);
      // das Plakat als Ganzes auf die optische Mitte (4,2 % über der geometrischen), nie näher als 5 mm an den Rand
      const teile = c.el.slice(n0).filter(e => !(e.x <= .5 && e.y <= .5 && e.x + (e.w || 0) >= c.w - .5 && e.y + (e.h || 0) >= c.h - .5));
      if (teile.length) {
        const y0 = Math.min(...teile.map(e => e.y)), y1 = Math.max(...teile.map(e => e.y + (e.h || hoehe(c, e) || 0)));
        const dy = Math.max(5 - y0, Math.min(c.h - 5 - y1, c.h / 2 - .042 * c.h - (y0 + y1) / 2));
        if (Math.abs(dy) > .5) teile.forEach(e => { e.y = +(e.y + dy).toFixed(2); });
      }
      return r;
    }
    return pl.bau(c, i, seite);
  } }); }

  /* ---------- Formate je Aufbau (Entscheid Oberchef 29.10.): der Reiter «Vorlagen» bietet einen Aufbau nur in den Formaten an, für die er gemacht ist.
     Der Türhänger fällt für das Culinarium weg (eine Bar ohne Zimmer). ---------- */
  const FORMATE_JE = {
    deckel: ['a6h', 'a6q', 'a5h', 'a5q', 'a4h', 'a3h', 'dlh', 'dlq', 'q148', 'ig11', 'insta', 'a7q', 'schild', 'story', 'mail'],
    buehne: ['a6h', 'a5h', 'a4h', 'a3h', 'dlh', 'q148', 'ig11', 'insta', 'story', 'mail', 'a6q', 'a5q'],
    ansicht: ['a6q', 'a6h', 'a5q', 'q148', 'ig11', 'insta', 'story', 'mailkopf'],
    karte: ['a6h', 'a5h', 'a4h', 'a3h', 'dlh', 'story', 'insta', 'mail'],
    einladung: ['q148', 'a5q', 'a6q', 'a6h', 'a5h', 'dlq', 'ig11', 'insta', 'story'],
    programm: ['a6h', 'a5h', 'a4h', 'a3h', 'dlh', 'story', 'insta', 'mail'],
    fenster: ['a6h', 'a5h', 'a4h', 'a3h', 'dlh', 'q148', 'ig11', 'insta', 'story', 'mail', 'a6q', 'a5q', 'mailkopf'],
    geteilt: ['a6h', 'a5h', 'a4h', 'a3h', 'dlh', 'q148', 'ig11', 'insta', 'story', 'a6q', 'a5q', 'a7q'],
    gutschein: ['dlq', 'a6q', 'a5q', 'q148', 'a6h', 'a5h'],
    aushang: ['a6h', 'a5h', 'a4h', 'a3h', 'dlh', 'q148', 'story', 'insta', 'a6q', 'a5q', 'a7q', 'mail'],
    rueckseite: ['a6h', 'a6q', 'a5h', 'a5q', 'dlh', 'dlq', 'q148'],
    kartengruss: ['a6q', 'a5q'],
    plakat: ['ig11', 'q148', 'insta', 'story', 'a3h', 'a4h', 'a5h', 'a6h'],
    plakatrueck: ['ig11', 'q148', 'insta', 'story', 'a3h', 'a4h', 'a5h', 'a6h'],
    plakatganz: ['ig11', 'q148'],   // Rudis Plakate sind quadratisch: in hohen Formaten (auch 4:5) bliebe Fläche leer (Tor 30.10.); hoch und Story macht der Aufbau «Plakat»
    menue: ['dlh', 'a6h', 'a5h', 'a4h', 'a3h', 'story'],
    gutscheinrueck: ['dlq', 'a6q', 'a5q', 'q148'],
  };
  for (const [k, f] of Object.entries(FORMATE_JE)) if (V[k]) V[k] = Object.assign({}, V[k], { formate: f });
  delete V.tuer;

  DS.SATZ_HAUS = { V, ALT, ablauf, gliederSatz };
})();
