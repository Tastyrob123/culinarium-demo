/* La Carte · Culinarium Hannover — Satz der Karte (28.10.2026, Kopie aus der Tafel im Schäfli, dort aus Schlössli, Gasterntal,
   Ruedihus und Doldenhorn). Eine Datei für drei Stellen: die Vorschau im Werkzeug, die Druckseite (PDF) und die Prüfung im Rundlauf (node).
   Die Karte liegt als Baum aus dem Satz vor, den satz_bau.py aus den Daten des Hauses setzt (einlesen.py): Seiten, Elemente mit ihren Merkmalen,
   Texte und feste Teile (Wortmarke). Aus denselben Daten entsteht hier Zeichen für Zeichen dasselbe HTML wie in satz/u-<karte>.html
   (geprüft mit pruefe.py rund). Gestalten (Fortgeschritten) legt sich als Stil über ein Element, ohne den Satz zu ändern.
   «Der nächste Abend» (C08/C24 in der Form des Hauses): Gänge mit Rudis Teller und Momos Drink, Datum, Preis (Teil ABEND unten). Ohne Bibliothek. */
(function (G) {
  'use strict';
  var A = '', Z = '', M0 = '', M1 = '', M2 = '';
  var ZEICHEN = { ZEICHEN: '', WORTMARKE: '' };
  var LEER_TAG = { img: 1, br: 1, hr: 1, meta: 1, link: 1, input: 1, wbr: 1, col: 1, source: 1 };
  var BLOCK = { p: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, li: 1, div: 1, section: 1 };

  function esc(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;'); }   // html.escape()
  function wahr(x) { return !(x === null || x === undefined || x === false || x === '' || x === 0 || (Array.isArray(x) && !x.length)); }

  /* ---------------------------------------------------------------- Gestalten (Fortgeschritten), wie La Carte des Grand Beau-Rivage und des Carlton:
     lage = { x, y (mm), s (Faktor) · f Schrift · t Schriftgrösse (Faktor) · a Textart · c Farbe · al Ausrichtung · z Zeilenabstand · mt, mb (mm) · aus ·
     lin {x, y, b, d, c, aus} } an einem Element. Verschoben per transform (Ursprung oben links), der Satz bleibt. Ohne lage ist das HTML das alte. */
  function zahl(x) { return String(Math.round((+x || 0) * 100) / 100); }
  // Schriften des Satzes (satz/satz.css, feste Schnitte aus fonts_statisch.py): Titel und Rudis Zeilen in Fraunces, Lauf Instrument Sans, Etiketten Urbanist, Daten DM Mono
  var SCHRIFT = { titel: "'Fraunces Titel',Georgia,serif", zeile: "'Fraunces Zeile',Georgia,serif", instrument: "'Instrument Sans',Arial,sans-serif", etikett: "Urbanist,Arial,sans-serif", mono: "'DM Mono',Menlo,monospace" };
  // Farben des Hauses (website/assets/culinarium.css :root): Nacht, Schiefer, Tinte, leise, Kerze (tief, hell), Warmweiss
  var FARBE = { nacht: '#16151A', schiefer: '#3A3845', tinte: '#26242D', leise: '#5B5763', kerze: '#EF7649', kerzet: '#B15736', kerzeh: '#F5A689', papier: '#FAF4F4', weiss: '#ffffff' };
  var ALIGN = { links: ['left', 'flex-start'], mitte: ['center', 'center'], rechts: ['right', 'flex-end'] };
  function lageStil(l) {
    if (!l) return '';
    var x = +l.x || 0, y = +l.y || 0, sk = +l.s || 1;
    if (Math.abs(x) < 0.05 && Math.abs(y) < 0.05 && Math.abs(sk - 1) < 0.005) return '';
    return 'transform:translate(' + x.toFixed(2) + 'mm,' + y.toFixed(2) + 'mm)' + (Math.abs(sk - 1) >= 0.005 ? ' scale(' + sk.toFixed(3) + ')' : '') + ';transform-origin:0 0';
  }
  function gestalt(l) {
    var st = [], at = '';
    if (!l || typeof l !== 'object') return ['', ''];
    var tr = lageStil(l); if (tr) st.push(tr);
    if (l.aus) st.push('visibility:hidden');
    if (SCHRIFT[l.f]) { st.push('--gf:' + SCHRIFT[l.f]); at += ' data-gf=""'; }
    if (FARBE[l.c]) { st.push('--gc:' + FARBE[l.c]); at += ' data-gc=""'; }
    if (/^(normal|versal)$/.test(l.a || '')) at += ' data-ga="' + l.a + '"';   // nie fett, nie kursiv (Kleid des Culinarium)
    if (ALIGN[l.al]) { st.push('--gal:' + ALIGN[l.al][0] + ';--gai:' + ALIGN[l.al][1]); at += ' data-gal=""'; }
    if (+l.z) { st.push('--gz:' + zahl(+l.z)); at += ' data-gz=""'; }
    if (+l.t && Math.abs(+l.t - 1) > 0.004) at += ' data-gt="' + zahl(+l.t) + '"';
    if (l.mt != null && l.mt !== '') st.push('margin-top:' + zahl(+l.mt) + 'mm');
    if (l.mb != null && l.mb !== '') st.push('margin-bottom:' + zahl(+l.mb) + 'mm');
    if (l.lin && typeof l.lin === 'object') at += ' data-lin-l="' + [zahl(l.lin.x), zahl(l.lin.y), zahl(l.lin.b), zahl(l.lin.d), FARBE[l.lin.c] || '', l.lin.aus ? 1 : 0].join(',') + '"';
    return [st.join(';').replace(/"/g, "'"), at];
  }
  function oeffne(tag, at, data, stil, mehr) {   // öffnendes Tag, um data-n, Stil und Merkmale ergänzt
    var innen = '<' + tag + at;
    if (stil) { if (/ style="/.test(innen)) innen = innen.replace(/ style="([^"]*)"/, function (m, a) { return ' style="' + a + (a && !/;$/.test(a) ? ';' : '') + stil + '"'; }); else innen += ' style="' + stil + '"'; }
    if (data) innen += ' data-n="' + data + '"';
    if (mehr) innen += mehr;
    return innen + '>';
  }

  /* ---------------------------------------------------------------- Was ein Element auf der Karte ist (für die Liste im Modus «Einfach»)
     eintrag: ein Gericht, Wein, eine Behandlung, ein Menu, eine Zeile mit Preis · rubrik: Überschrift einer Gruppe · zwischen: Zwischentitel ·
     titel: Titel einer Seite · text: Absatz · null: Behälter (die Liste geht hinein) · fest: gehört zum Rahmen der Seite (Fusszeile, Bild) */
  /* Gasterntal (Satz _werkbank/satz_daten.py): re Getränk mit Preisspalten · po Gericht mit Übersetzung und Preisen · rubrik Rubrik ·
     zw Zwischentitel (Weisse, Rote, Rosé) · h3 im Kasten Jugendschutz Zwischentitel · Absätze des Deckels, der Rubriken und des Kastens Text */
  var EINHEIT = /(^| )(sb-g|sb-m)( |$)/;   // Culinarium 28.10.2026: Bausteine des Satzes (satz_bau.py): Gang (sb-m), Ticketpreis (sb-g)
  var KIND_EINHEIT = /(^| )(nie-vorhanden)( |$)/;   // Kinder dieser Behälter sind je ein Eintrag (im Culinarium keine)
  var RUBRIK = /(^| )(sb-h|sb-wart)( |$)/;   // Culinarium: der Titel des Abends (h2.sb-band) ist Titel, keine Rubrik
  var ZWISCHEN = /(^| )(sb-gut|sb-land|sb-region)( |$)/;
  var FEST = /(^| )(sb-zeichen|sb-gang)( |$)/;   // Rahmen der Seite: Wortmarke, Strich zwischen den Gängen
  function klasse(n) { var m = /\sclass="([^"]*)"/.exec(n.a[1] || ''); return m ? m[1] : ''; }
  function art(n, eltern) {
    if (!n || typeof n !== 'object' || n.fn !== 'el') return null;
    var tag = n.a[0], kl = klasse(n), ek = eltern ? klasse(eltern) : '';
    if (tag === 'footer' || tag === 'img' || tag === 'svg' || FEST.test(kl)) return 'fest';
    if (EINHEIT.test(kl) || (eltern && eltern.fn === 'el' && KIND_EINHEIT.test(ek) && tag === 'div')) return 'eintrag';
    if (RUBRIK.test(kl)) return 'rubrik';
    if (ZWISCHEN.test(kl) || (tag === 'h3' && !kl)) return 'zwischen';
    if (/^h[12]$/.test(tag)) return 'titel';
    if (/^(p|h3|h4|li)$/.test(tag) && textVon(n).trim() && !/(^| )stern( |$)/.test(kl)) return 'text';
    if (tag === 'ul') return 'text';
    return null;
  }
  function textVon(x) {
    if (typeof x === 'string') return x;
    if (x && x.fn === 'el') return x.a.slice(2).map(textVon).join('');
    if (x && x.fn === 'seite') return x.a.slice(1).map(textVon).join('');
    return '';
  }
  /* Die Texte eines Eintrags mit Namen (für das Fenster «bearbeiten»): [{pfad (relativ zum Eintrag), name, wert, preis}] */
  var LEISE = /^[\s·*|–\-]*$/;
  function feldName(tag, kl, kette, i, art0) {
    var in_ = function (re) { return kette.some(function (k) { return re.test(k); }); };
    var preisSpalte = /^(span|b) .*\b(rk|pz)\b|^span (rk|pz)$/;
    if (tag === 'h1') return 'Titel';
    // Culinarium 28.10.2026: Felder eines Gangs (satz_bau.py): Gang, Rudis Teller, Momos Drink
    if (/(^| )sb-gn( |$)/.test(kl)) return 'Gang';
    if (tag === 'p' && /(^| )sb-n( |$)/.test(kl) && in_(/^div sb-m/)) return 'Teller';
    if (/(^| )sb-dr( |$)/.test(kl)) return 'Drink';
    if (/(^| )(sb-datum|sb-mit)( |$)/.test(kl)) return 'Text';
    // Schäfli 21.10.2026: Felder der Bausteine (satz_bau.py)
    if (/(^| )sb-pn( |$)/.test(kl)) return 'Name';
    if (/(^| )sb-pr( |$)/.test(kl)) return 'Rolle';
    if (/(^| )sb-rn( |$)/.test(kl)) return 'Nummer';
    if (/(^| )sb-hinweis( |$)/.test(kl)) return 'Hinweis';
    if (tag === 'span' && in_(/^h3 sb-land/)) return 'Land';
    if (tag === 'small' && in_(/^p sb-p/)) return 'Währung';
    if (tag === 'p' && /(^| )sb-n( |$)/.test(kl)) return 'Name';
    if (tag === 'p' && /(^| )(sb-gruss|sb-satz|sb-unter|sb-zeiten)( |$)/.test(kl)) return 'Text';
    if (/(^| )sb-mp( |$)/.test(kl)) return 'Preis';                            // Lästermeile: Preis am Namen
    if (tag === 'b' && in_(/^p sb-menupreis/)) return 'Preis';                // Bankett: Menüpreis
    if (tag === 'em' && in_(/^p sb-p/)) return 'Angabe';                      // «Hauptgang» vor dem zweiten Preis
    if (tag === 'b' && in_(/^p sb-p/)) return 'Preis';
    if (/(^| )sb-w( |$)/.test(kl)) return 'Hinweis';                          // «(20 MIN. WARTEZEIT)»
    if (tag === 'p' && /(^| )sb-t( |$)/.test(kl)) return 'Beschreibung';
    if (tag === 'span' && in_(/^div sb-wein/)) return { j: 'Jahrgang', n: 'Name', f: 'Angabe', p: 'Preis', d: 'Beschreibung' }[kl] || 'Text';
    if (tag === 'em' && in_(/^span (rk|pz)$/)) return 'Angabe';             // 33cl, Cüpli, Flasche, Portion, pro Person, Kinder
    if (tag === 'b' && in_(/^h2/)) return 'Spaltenkopf';                     // 3dl 5dl 1,5 Liter über der Rubrik
    if (tag === 'b' && in_(/^span (rk|pz)$/)) return 'Preis';
    if (tag === 'small' && /(^| )jg( |$)/.test(kl)) return 'Jahrgang';                // Schlössli: Jahrgang der Weine
    if (tag === 'small' && in_(/^h2/)) return 'Zusatz';                      // Gäng guet «ab 2 Personen»
    if (tag === 'span' && in_(/^h2/) || tag === 'h2') return art0 === 'rubrik' ? 'Rubrik' : 'Überschrift';
    if (tag === 'small') return 'Zusatz';                                    // «mit und ohne», «A. Mathier», Glacesorten
    if (tag === 'span' && /(^| )re__n( |$)/.test(kl)) return 'Name';
    if (tag === 'h4') return 'Name';
    if (tag === 'p' && /(^| )fr( |$)/.test(kl)) return 'Übersetzung';        // englische Zeile
    if (tag === 'h3') return 'Zwischentitel';
    if (tag === 'b') return 'Hervorgehoben';
    if (tag === 'p' && in_(/^div po__t/)) return 'Beschreibung';             // deutsche Zeile unter dem Namen
    return 'Text';
  }
  /* ---- Schlössli 20.10.2026: Kapitälchen und Kürzel wie website/_werkbank/satz_daten.py (_kk, kuerzel) ---- */
  function istKl(y) { return y && y.fn === 'el' && y.a[0] === 'span' && klasse(y) === 'kl'; }
  function istKap(x) { return false; }   // Culinarium (wie Schäfli): keine Kapitälchen im Satz (Namen stehen als ganzer Text, Versalien wie auf der Karte des Hauses)
  function kapText(x) { return x.a.slice(2).map(function (y) { return typeof y === 'string' ? y : istKl(y) ? y.a.slice(2).filter(function (z) { return typeof z === 'string'; }).join('') : ''; }).join('').replace(/\s+/g, ' ').trim(); }
  function kapBau(t, nurErstes) {   // _kk(): erster Buchstabe gross, Rest des Worts in span.kl; bei Namen nur das erste Wort, danach jedes Wort ganz in span.kl
    var aus = [], erstes = true;
    t.split(' ').forEach(function (w) {
      if (!w) return;
      var i = -1; for (var k = 0; k < w.length; k++) if (/\p{L}/u.test(w[k])) { i = k; break; }
      if (aus.length) aus.push(' ');
      if (i < 0) aus.push(w);
      else if (nurErstes && !erstes) aus.push({ fn: 'el', a: ['span', ' class="kl"', w.toUpperCase()] });
      else { aus.push(w.slice(0, i + 1).toUpperCase()); if (w.slice(i + 1)) aus.push({ fn: 'el', a: ['span', ' class="kl"', w.slice(i + 1).toUpperCase()] }); }
      erstes = false;
    });
    var z = []; aus.forEach(function (y) { if (typeof y === 'string' && typeof z[z.length - 1] === 'string') z[z.length - 1] += y; else z.push(y); });   // Texte zusammen wie im HTML
    return z;
  }
  var KUERZEL_ROH = {}, KUERZEL_TRENN = null;   // Vorlagen aus dem Satz selbst: Blatt-Zeichen von VEG/OVEG und das Trennzeichen, wie die Werkbank sie gerade setzt
  function istKuerzel(x) { return x && x.fn === 'el' && /^(p|span|sup)$/.test(x.a[0]) && /(^| )(sb-k|sb-kz)( |$)/.test(klasse(x)); }
  function istVeg(y) { return y && y.fn === 'el' && /(^| )sb-veg( |$)/.test(klasse(y)); }
  function istTrenn(y) { return y && y.fn === 'el' && y.a[0] === 'i'; }
  function merkKuerzel(x) {
    x.a.slice(2).forEach(function (y) {
      if (istTrenn(y) && !KUERZEL_TRENN) KUERZEL_TRENN = JSON.parse(JSON.stringify(y));
      if (istVeg(y)) { var r = y.a.slice(2).filter(function (z) { return z && z.fn === 'roh'; })[0], t = y.a.slice(2).filter(function (z) { return typeof z === 'string'; }).join(''); if (r && t) KUERZEL_ROH[t] = { tag: y.a[0], at: y.a[1], roh: r }; }
    });
  }
  function kuerzelText(x) {
    var aus = [];
    for (var i = 2; i < x.a.length; i++) { var y = x.a[i]; if (y && y.fn === 'el' && y.a[0] === 'br') break; if (typeof y === 'string') aus.push(y); else if (istVeg(y)) aus.push(y.a.slice(2).filter(function (z) { return typeof z === 'string'; }).join('')); }
    return aus.join('/');
  }
  function kuerzelBau(t) {
    var aus = [];
    t.split('/').map(function (w) { return w.trim(); }).filter(Boolean).forEach(function (w, i) {
      if (i) aus.push(KUERZEL_TRENN ? JSON.parse(JSON.stringify(KUERZEL_TRENN)) : { fn: 'el', a: ['i', ' class="sb-ab"', ' '] });
      var v = KUERZEL_ROH[w];
      aus.push(v ? { fn: 'el', a: [v.tag, v.at, JSON.parse(JSON.stringify(v.roh)), w] } : w);
    });
    return aus;
  }
  function istNb(x) { return x && x.fn === 'el' && x.a[0] === 'span' && /(^| )dh-nb( |$)/.test(klasse(x)); }
  function istZ(x) { return x && x.fn === 'el' && x.a[0] === 'span' && /(^| )z( |$)/.test(klasse(x)); }
  function istBild(x) { return x && x.fn === 'el' && x.a[0] === 'img'; }
  function felder(n, art0) {
    var aus = [], zahl0 = {};
    var nimm = function (f) { zahl0[f.name] = (zahl0[f.name] || 0) + 1; aus.push(f); };
    (function geh(x, pfad, kette) {
      if (typeof x === 'string') {
        if (LEISE.test(x) && x !== '') return;
        var e = kette[kette.length - 1] || {};
        nimm({ pfad: pfad, name: feldName(e.tag, e.kl, kette.map(function (k) { return k.tag + ' ' + k.kl; }), aus.length, art0), wert: x });
        return;
      }
      if (!x || x.fn !== 'el') return;
      // Schlössli 20.10.2026: Name oder Rubrik in Kapitälchen (Buchstaben verteilt auf Text und span.kl): ein Feld für den ganzen Wortlaut
      if (istKap(x)) {
        nimm({ pfad: pfad, name: /(^| )sb-n( |$)/.test(klasse(x)) ? 'Name' : 'Rubrik', wert: kapText(x), kap: /(^| )sb-n( |$)/.test(klasse(x)) ? 1 : 2 });
        x.a.slice(2).forEach(function (y, i) { if (y && y.fn === 'el' && /(^| )sb-mp( |$)/.test(klasse(y))) geh(y, (pfad ? pfad + '.' : '') + 'a.' + (i + 2), kette.concat([{ tag: x.a[0], kl: klasse(x) }])); });
        return;
      }
      // Kürzel des Hauses (VEG/G/L …), gesetzt mit Punkten und Blatt-Zeichen: ein Feld, geschrieben mit «/» wie auf der Karte des Hauses
      if (istKuerzel(x)) {
        merkKuerzel(x);
        nimm({ pfad: pfad, name: 'Allergene', wert: kuerzelText(x), kuerzel: true });
        x.a.slice(2).forEach(function (y, i) { if (y && y.fn === 'el' && /(^| )sb-w( |$)/.test(klasse(y))) geh(y, (pfad ? pfad + '.' : '') + 'a.' + (i + 2), kette.concat([{ tag: x.a[0], kl: klasse(x) }])); });
        return;
      }
      // Name eines Gerichts mit den Zeichen des Hauses am letzten Wort (satz_daten.py name_mit_zeichen): ein Feld für den ganzen Namen
      if (x.a[0] === 'h4' && x.a.slice(2).some(istNb)) {
        nimm({ pfad: pfad, name: 'Name', wert: x.a.slice(2).map(function (y) { return istNb(y) ? y.a.slice(2).filter(function (z) { return typeof z === 'string'; }).join('') : typeof y === 'string' ? y : ''; }).join(''), nb: true });
        return;
      }
      var k2 = kette.concat([{ tag: x.a[0], kl: klasse(x) }]);
      x.a.slice(2).forEach(function (y, i) { geh(y, (pfad ? pfad + '.' : '') + 'a.' + (i + 2), k2); });
    })(n, '', []);
    Object.keys(zahl0).forEach(function (nm) { if (zahl0[nm] < 2) return; var j = 0; aus.forEach(function (f) { if (f.name === nm) f.name = nm + ' ' + (++j); }); });
    aus.forEach(function (f) { f.preis = /^Preis/.test(f.name); });
    return aus.filter(function (f) { return f.wert !== '' || /Preis|Jahrgang|Punkte|Dauer|Spaltenkopf/.test(f.name); });
  }
  function lies(o, pfad) { return pfad ? pfad.split('.').reduce(function (x, k) { return x == null ? x : x[/^\d+$/.test(k) ? +k : k]; }, o) : o; }
  function vaterVon(o, pfad) { var k = pfad.split('.'), i = +k.pop(); return { arr: lies(o, k.join('.')), idx: i }; }
  /* Ein Feld eines Eintrags setzen (n wird verändert). Leer: ein Absatz oder eine Zeile fällt weg (leer: true), sonst bleibt das Element leer. */
  function setzeFeld(n, f, wert) {
    if (f.kap) { var e0 = lies(n, f.pfad); e0.a = [e0.a[0], e0.a[1]].concat(kapBau(String(wert), f.kap === 1)).concat(e0.a.slice(2).filter(function (y) { return y && y.fn === 'el' && /(^| )sb-mp( |$)/.test(klasse(y)); })); return; }
    if (f.kuerzel) { var e1 = lies(n, f.pfad), rest = e1.a.slice(2), j0 = rest.findIndex(function (y) { return y && y.fn === 'el' && y.a[0] === 'br'; }); e1.a = [e1.a[0], e1.a[1]].concat(kuerzelBau(String(wert))).concat(j0 >= 0 ? rest.slice(j0) : []); return; }
    if (f.nb) {
      var h4 = lies(n, f.pfad), nb = h4.a.slice(2).filter(istNb)[0], bilder = nb.a.slice(2).filter(function (z) { return typeof z !== 'string'; });
      var t = String(wert).replace(/\s+$/, ''), j = t.lastIndexOf(' '), vorn = j >= 0 ? t.slice(0, j + 1) : '', letzt = j >= 0 ? t.slice(j + 1) : t;
      h4.a = [h4.a[0], h4.a[1]].concat(vorn ? [vorn] : []).concat([{ fn: 'el', a: [nb.a[0], nb.a[1], letzt].concat(bilder) }]);
      return;
    }
    var v = vaterVon(n, f.pfad);
    if (typeof v.arr[v.idx] === 'string' && / $/.test(v.arr[v.idx]) && wert && !/ $/.test(wert) && istKuerzel(v.arr[v.idx + 1])) wert += ' ';   // Schlössli: Abstand vor den hochgestellten Kürzeln bleibt
    v.arr[v.idx] = wert;
    // Ruedihus 17.10.2026: eine Zeile besteht oft aus zwei Texten (Vorspann der Übersetzung in <span class="ld"> und Rest). Leer ist eine Zeile,
    // wenn in ihr kein Text mehr steht: jeder Block zwischen dem Eintrag und dem Text (p, dann die Zeile div.gz) fällt dann weg; der Eintrag selbst nie.
    var k = f.pfad.split('.'), kette = [];
    for (var x = k.length - 2; x >= 2; x -= 2) { var e = lies(n, k.slice(0, x).join('.')); if (e && e.fn === 'el') kette.push(e); }
    kette.forEach(function (e) { if (!BLOCK[e.a[0]]) return; if (!textVon(e).trim() && !hatFest(e)) e.leer = true; else delete e.leer; });
  }
  function hatFest(x) { return !!x && typeof x === 'object' && (x.fn === 'roh' || (x.fn === 'el' && (x.a[0] === 'img' || x.a.slice(2).some(hatFest)))); }
  /* Zeichen des Hauses an einem Eintrag (vegetarisch, vegan …): Nummern der festen Teile der Bilder, in der Reihenfolge des Satzes */
  function zeichenOrt(n) {
    var ort = null;
    (function geh(x) { if (ort || !x || x.fn !== 'el') return; if (istNb(x) || istZ(x)) { ort = x; return; } x.a.slice(2).forEach(geh); })(n);
    return ort;
  }
  function zeichenVon(n) {
    var o = zeichenOrt(n); if (!o) return [];
    return o.a.slice(2).filter(istBild).map(function (b) { var m = new RegExp(A + '(\\d+)' + Z).exec(b.a[1]); return m ? +m[1] : -1; });
  }
  function hatZeichenOrt(n) {   // Gericht mit Namen (h4) oder Zeile mit Zeichen-Spalte
    if (zeichenOrt(n)) return true;
    var h4 = null; (function geh(x) { if (h4 || !x || x.fn !== 'el') return; if (x.a[0] === 'h4') { h4 = x; return; } x.a.slice(2).forEach(geh); })(n);
    return !!h4;
  }
  /* Zeichen setzen: bild(teil) = Merkmale des Bildes, nb = Merkmale des Behälters am letzten Wort (beide aus dem Satz der Karte) */
  function setzeZeichen(n, teile, bildAt, nbAt) {
    var o = zeichenOrt(n), imgs = teile.map(function (t) { return { fn: 'el', a: ['img', bildAt(t)] }; });
    if (o) { o.a = [o.a[0], o.a[1]].concat(o.a.slice(2).filter(function (y) { return !istBild(y); })).concat(imgs); return; }
    if (!teile.length) return;
    var h4 = null; (function geh(x) { if (h4 || !x || x.fn !== 'el') return; if (x.a[0] === 'h4') { h4 = x; return; } x.a.slice(2).forEach(geh); })(n);
    if (!h4) return;
    var t = h4.a.slice(2).filter(function (y) { return typeof y === 'string'; }).join(''), j = t.lastIndexOf(' ');
    h4.a = [h4.a[0], h4.a[1]].concat(j >= 0 ? [t.slice(0, j + 1)] : []).concat([{ fn: 'el', a: ['span', nbAt, j >= 0 ? t.slice(j + 1) : t].concat(imgs) }]);
  }

  /* ---------------------------------------------------------------- Setzen */
  function Satz(d, opt) { this.d = d; this.mk = !!(opt && opt.marken); }
  Satz.prototype.kind = function (x, pfad, eltern, inE) {
    if (typeof x === 'string') return this.mk && x.trim() ? M0 + pfad + M1 + esc(x) + M2 : esc(x);
    if (!x || typeof x !== 'object') return '';
    if (x.fn === 'roh') return x.a[0];
    if (x.fn === 'el') return this.el(x, pfad, eltern, inE);
    return '';
  };
  Satz.prototype.el = function (n, pfad, eltern, inE) {
    if (n.aus) return '';
    var tag = n.a[0], at = n.a[1] || '', me = this, a = art(n, eltern);
    if (n.leer && !textVon(n).trim() && !hatFest(n)) return '';
    var waehlbar = !inE && (a && a !== 'fest' || tag === 'header' || tag === 'footer' || tag === 'img');
    var data = (this.mk && waehlbar) || n.lage ? pfad : '';
    var g = gestalt(n.lage), offen = (data || g[0] || g[1]) ? oeffne(tag, at, data, g[0], g[1]) : '<' + tag + at + '>';
    if (LEER_TAG[tag]) return offen;
    var drin = inE || a === 'eintrag';
    /* Schlössli 20.10.2026, 01:24 (Bild: im Modus Fortgeschritten war bei «Ossobucchi» nur «O» gewählt, geschrieben wurde nur in «SSOBUCCHI»): ein Name oder
       eine Rubrik in Kapitälchen ist in der Karte EIN Text (data-k «<pfad>~kap1|2»), wie das Feld im Modus «Einfach». */
    if (this.mk && istKap(n)) {
      var kp = pfad + '~kap' + (/(^| )sb-n( |$)/.test(klasse(n)) ? 1 : 2), auf = false, html = '';
      n.a.slice(2).forEach(function (y, i) {
        var mp = y && y.fn === 'el' && /(^| )sb-mp( |$)/.test(klasse(y));
        if (mp) { if (auf) { html += M2; auf = false; } html += me.kind(y, pfad + '.a.' + (i + 2), n, drin); return; }
        if (!auf) { html += M0 + kp + M1; auf = true; }
        me.mk = false; html += me.kind(y, pfad + '.a.' + (i + 2), n, drin); me.mk = true;
      });
      if (auf) html += M2;
      return offen + html + '</' + tag + '>';
    }
    return offen + n.a.slice(2).map(function (y, i) { return me.kind(y, pfad + '.a.' + (i + 2), n, drin); }).join('') + '</' + tag + '>';
  };
  Satz.prototype.seite = function (n, i, nr) {
    var me = this, at = n.a[0] || '', mehr = '';
    if (this.mk) mehr = ' data-seite="' + i + '" data-nr="' + nr + '"';
    var b = /data-b="(\d+)"/.exec(at);
    return '<section' + at + mehr + '>' + n.a.slice(1).map(function (y, j) { return me.kind(y, 'seiten.' + i + '.a.' + (j + 1), n, false); }).join('') + '</section>';
  };
  function teileLos(h, teile) { return h.replace(new RegExp(A + '(\\d+)' + Z, 'g'), function (m, n) { return (teile || [])[+n] || ''; }); }
  function marken(h) { return h.replace(new RegExp(M0 + '([^' + M1 + ']*)' + M1, 'g'), function (m, p) { return '<k-t data-k="' + p + '">'; }).split(M2).join('</k-t>'); }

  function seiten(d, opt) {
    var dd = d.art === 'abend' ? abendAnwenden(JSON.parse(JSON.stringify(d))) : d, sz = new Satz(dd, opt), aus = [];
    (dd.seiten || []).forEach(function (n, i) {
      if (n.aus) return;
      var h = teileLos(sz.seite(n, i, aus.length + 1), dd.teile);
      aus.push(opt && opt.marken ? marken(h) : h);
    });
    return aus;
  }
  /* Ganze Datei wie _werkbank/satz/u-<karte>.html (für den Rundlauf) */
  function dokument(d) { return d.kopf + seiten(d, {}).join('') + d.fuss; }
  function kopfCss(d) {
    var f = d.format || [210, 297];
    return '@page{size:' + f[0] + 'mm ' + f[1] + 'mm;margin:0}' + (d.art === 'abend' ? MT_CSS : '');
  }

  /* ---------------------------------------------------------------- Der nächste Abend (C08/C24) · Culinarium Hannover (28.10.2026)
     Das Haus hat kein Tagesmenü, sondern je Abend (Freitag und Samstag) ein Menü mit festen Gängen: zu jedem Gang Rudis Teller und Momos Drink
     (Karte am Platz, Foto _quelle/extern/ig-highlights/2025-02-22_highlight-4865-06.jpg). Darum EIN Menü (abend.tage hat ein Element), Gang = Teller +
     Drink; das Blatt ist gebaut wie die Karten der früheren Abende (satz_bau.py), A4 hoch, mittig: Wortmarke, Titel, Datum, «BY MOMO X RUDI», die Gänge,
     unten der Ticketpreis. Felder: abend = { ab, titel, motto, mit, preis, zusatz, hinweis, fuss, beispiel, tage: [{ zu, hinweis, amuse, amuse_z,
     aperitif, aperitif_z, vorspeise, vorspeise_z, haupt, haupt_z, dessert, dessert_z, absacker, absacker_z }] } */
  var TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  var KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var GAENGE = [['amuse', 'Amuse Bouche'], ['aperitif', 'Apéritif'], ['vorspeise', 'Vorspeise'], ['haupt', 'Hauptgang'], ['dessert', 'Dessert'], ['absacker', 'Absacker']];
  function datum(ab, plus) { var x = String(ab || '').split('-').map(Number); return new Date(x[0], (x[1] || 1) - 1, (x[2] || 1) + (plus || 0), 12); }
  function iso(dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); }
  function freitag(ab) { var dt = datum(ab); dt.setDate(dt.getDate() + ((5 - dt.getDay() + 7) % 7)); return iso(dt); }   // der nächste Freitag ab diesem Tag (oder er selbst)
  function tagName(ab, i) { var dt = datum(ab, i); return TAGE[(dt.getDay() + 6) % 7] + ', ' + dt.getDate() + '. ' + MONATE[dt.getMonth()] + ' ' + dt.getFullYear(); }
  /* «Fr 27. und Sa 28. März 2026» wie die Plakate und website/bau.py ABENDE: der Abend am Freitag und am Samstag danach */
  function spanne(ab) {
    var a = datum(ab), b = datum(ab, 1), k = function (d) { return KURZ[(d.getDay() + 6) % 7] + ' ' + d.getDate() + '.'; };
    if (a.getMonth() !== b.getMonth()) return k(a) + ' ' + MONATE[a.getMonth()] + ' und ' + k(b) + ' ' + MONATE[b.getMonth()] + ' ' + b.getFullYear();
    return k(a) + ' und ' + k(b) + ' ' + MONATE[b.getMonth()] + ' ' + b.getFullYear();
  }
  var leer = function (x) { return !String(x || '').trim(); };
  function tagLeer(tg) { return !tg.zu && GAENGE.every(function (g) { return leer(tg[g[0]]) && leer(tg[g[0] + '_z']); }); }
  function leererTag() { var tg = { zu: false, hinweis: '' }; GAENGE.forEach(function (g) { tg[g[0]] = ''; tg[g[0] + '_z'] = ''; }); return tg; }
  var MT_CSS = '';   // das Blatt trägt die Klassen des Satzes (satz/satz.css), keine eigenen Stile
  var SEITE_AT = ' data-max="1.8" class="blatt cu" data-b="210" data-h="297" style="width:210mm;height:297mm"';
  function rudi(t) { return String(t).trim().replace(/\s*\|\s*/g, ' / '); }   // Rudis Teller mit Schrägstrich wie in seinen Beiträgen (satz_bau.py rudi)
  function el(tag, kl, kinder, mehr) { var n = { fn: 'el', a: [tag, kl ? ' class="' + kl + '"' : ''].concat(kinder || []) }; if (mehr) Object.keys(mehr).forEach(function (k) { n[k] = mehr[k]; }); return n; }
  function preisMarke(t) {   // «89,00 EUR» als Marke: Angabe «Ticket», Zahl gross, Währung klein; der Wortlaut bleibt
    var m = /^\s*([\d.,]+)\s*(.*?)\s*$/.exec(t), kinder = [el('em', '', ['Ticket'])].concat(m ? [el('b', '', [m[1]])].concat(m[2] ? [el('small', '', [m[2]])] : []) : [el('b', '', [t])]);
    return el('div', 'sb-g sb-lunchpreis', [el('p', 'sb-p', [el('span', '', kinder)])], { w: 'preis' });
  }
  function abendSeiten(w) {
    var aus = [];
    var P = function (text, kl, feld) { return el('p', kl, [text], feld ? { w: feld } : null); };
    (w.tage || []).slice(0, 1).forEach(function (tg, i) {
      var titel = !leer(w.motto) ? w.motto.trim() : !leer(w.titel) ? w.titel.trim() : 'Menü';
      var oben = [el('span', 'uz sb-zeichen', [{ fn: 'roh', a: [ZEICHEN.WORTMARKE || ZEICHEN.ZEICHEN] }]),
        el('h2', 'sb-band', [titel], !leer(w.motto) ? { w: 'motto' } : !leer(w.titel) ? { w: 'titel' } : null),
        P(spanne(w.ab), 'sb-datum')];
      if (!leer(w.mit)) oben.push(P(w.mit.trim(), 'sb-mit', 'mit'));
      var unten = [];
      if (!tg.zu && !leer(w.preis)) unten.push(preisMarke(w.preis.trim()));
      if (!leer(w.zusatz)) unten.push(P(w.zusatz.trim(), 'sb-zusatz', 'zusatz'));
      if (!leer(w.hinweis)) unten.push(P(w.hinweis.trim(), 'sb-hinweis', 'hinweis'));
      var mitte = [];
      if (tg.zu) mitte.push(el('div', 'sb-m', [P(leer(tg.hinweis) ? 'Die Gänge dieses Abends folgen.' : tg.hinweis.trim(), 'sb-n', leer(tg.hinweis) ? null : 'tage.' + i + '.hinweis')]));
      else {
        var erst = true;
        GAENGE.forEach(function (g) {
          if (leer(tg[g[0]]) && leer(tg[g[0] + '_z'])) return;
          if (!erst) mitte.push(el('div', 'sb-gang', [{ fn: 'roh', a: [ZEICHEN.BLATT || '<i></i>'] }]));
          erst = false;
          var m = [P(g[1], 'sb-gn')];
          if (!leer(tg[g[0]])) m.push(P(rudi(tg[g[0]]), 'sb-n', 'tage.' + i + '.' + g[0]));
          if (!leer(tg[g[0] + '_z'])) m.push(P(tg[g[0] + '_z'].trim(), 'sb-dr', 'tage.' + i + '.' + g[0] + '_z'));
          mitte.push(el('div', 'sb-m', m));
        });
        if (erst) mitte.push(el('div', 'sb-m', [P('Die Gänge dieses Abends folgen.', 'sb-dr')]));
      }
      /* Gestaltung 28.10.2026: keine Anweisung auf der Karte selbst; dass es ein Beispiel ist, sagt einmal der Kopf des Werkzeugs (.kopf__bsp) */
      var obenEl = el('div', 'sb-oben', oben), menue = el('div', 'sb-menue', mitte), untenEl = el('div', 'sb-unten', unten);
      var fuss = leer(w.fuss) ? el('footer', 'ufuss2', [ZEICHEN.FUSS || 'Culinarium']) : el('footer', 'ufuss2', [w.fuss.trim()], { w: 'fuss' });
      var zaehl = {}, WL = w.lage || {};
      var alle = [obenEl, menue, untenEl, fuss].concat(oben, mitte, unten);
      alle.forEach(function (x) {
        var k = x.w ? x.w.replace(/^tage\.\d+\./, '') : /sb-gang/.test(x.a[1]) ? 'strich' : /sb-zeichen/.test(x.a[1]) ? 'zeichen' : /sb-oben/.test(x.a[1]) ? 'oben' : /sb-unten/.test(x.a[1]) ? 'unten' : /sb-menue/.test(x.a[1]) ? 'menue' : /sb-datum/.test(x.a[1]) ? 'datum' : x.a[0] === 'footer' ? 'fuss' : 'text';
        zaehl[k] = (zaehl[k] || 0) + 1; x.lk = 't0.' + k + (zaehl[k] > 1 ? zaehl[k] : '');
        if (WL[x.lk]) x.lage = JSON.parse(JSON.stringify(WL[x.lk]));
      });
      aus.push({ fn: 'seite', a: [SEITE_AT, el('div', 'inhalt', [el('div', 'sb-quer', [obenEl, menue, untenEl])]), fuss] });
    });
    if (!aus.length) aus.push({ fn: 'seite', a: [SEITE_AT, el('div', 'inhalt', [el('div', 'sb-quer', [el('div', 'sb-oben', [el('h2', 'sb-band', [w.titel || 'Menü'])]), el('div', 'sb-menue', [P('Die Gänge dieses Abends folgen.', 'sb-dr')])])])] });
    return aus;
  }
  function abendAnwenden(d) { d.seiten = abendSeiten(d.abend); d.teile = []; return d; }

  G.SATZ = {
    zeichen: function (z) { ZEICHEN = z; }, seiten: seiten, dokument: dokument, kopfCss: kopfCss, lageStil: lageStil, gestalt: gestalt, SCHRIFT: SCHRIFT, FARBE: FARBE,
    art: art, felder: felder, setzeFeld: setzeFeld, kapBau: kapBau, zeichenVon: zeichenVon, setzeZeichen: setzeZeichen, hatZeichenOrt: hatZeichenOrt, textVon: textVon, klasse: klasse, esc: esc, wahr: wahr, lies: lies,
    ABEND: { TAGE: TAGE, MONATE: MONATE, GAENGE: GAENGE, datum: datum, iso: iso, freitag: freitag, tagName: tagName, spanne: spanne, leererTag: leererTag, tagLeer: tagLeer, rudi: rudi, seiten: abendSeiten, anwenden: abendAnwenden, CSS: MT_CSS },
  };
  if (typeof module !== 'undefined') module.exports = G.SATZ;
})(typeof window !== 'undefined' ? window : globalThis);
