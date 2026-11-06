/* La Carte · Blatt: setzt eine Karte mit satz.js. Zwei Arten:
   Druck   blatt.html?z=<karte>&q=stand|entwurf|grundstand|verlauf:<datei>&druck=1 → window.CARTE_FERTIG für drucke.js
   Vorschau (im Werkzeug, als Rahmen): Daten kommen per postMessage, Text ist markiert (data-k), Klicks und Geschriebenes gehen zurück.
   Danach wird jede Seite so gross gesetzt, wie ihr Inhalt es zulässt (wie _werkbank/satz_druck_datei.js, mit dem die PDFs der Website gedruckt sind).
   Doldenhorn 17.10.2026: Kopie aus La Carte des Carlton-Europe, auf den Satz der Unterlagen des Waldhotel Doldenhorn umgestellt.
   Gasterntal 17.10.2026: Kopie aus der Tafel des Ruedihus. Schäfli 21.10.2026. Culinarium 28.10.2026: Schriften des Hauses (Fraunces, Instrument Sans, Urbanist, DM Mono). */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search), ZEICHEN = null, D = null, MODUS = 'einfach', ZOOM = 0.62, ZOOM_EIGEN = false, N = 0, DATEN = null;
  var PXMM = 96 / 25.4;

  function zeichen() {
    if (ZEICHEN) return Promise.resolve(ZEICHEN);
    return fetch('/culinarium-demo/_werkzeuge/carte/satz/zeichen.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (z) { ZEICHEN = z; SATZ.zeichen(z); return z; });
  }

  /* Einpassen wie der Druck der Unterlagen des Hauses (_werkbank/satz_druck_datei.js, Kopie von _Werkbank-Kit/satz_druck.js, im Ablauf unverändert):
     jede Seite so gross, wie sie trägt (data-max, sonst höchstens 118 %), verkleinert, bis nichts mehr überläuft, dann zwischen «passt» und
     «läuft über» halbiert. Dieselben Zahlen wie bei den PDFs, die heute auf der Website liegen. */
  function passe(nur) {
    var aus = [], alle = [].slice.call(document.querySelectorAll('#seiten .blatt'));
    (nur || alle).forEach(function (bl) {
      var n = alle.indexOf(bl);
      var inh = bl.querySelector('.inhalt');
      if (!inh || bl.dataset.fest) { aus.push({ seite: n + 1, mass: 100, frei: 0, fehler: [] }); return; }
      var zuviel = function () {
        var r = inh.scrollHeight / inh.clientHeight;
        var innen = function (k) { var q = k.getBoundingClientRect(), c = getComputedStyle(k); var o = q.top + parseFloat(c.paddingTop), u = q.bottom - parseFloat(c.paddingBottom);
          var tief = Math.max.apply(null, [o].concat([].filter.call(k.children, function (x) { return getComputedStyle(x).position !== 'absolute'; }).map(function (x) { return x.getBoundingClientRect().bottom; }))); return u > o ? (tief - o) / (u - o) : 1; };
        r = Math.max(r, innen(inh)); [].forEach.call(bl.querySelectorAll('.sp'), function (sp) { if (sp.children.length > 1) r = Math.max(r, innen(sp)); });
        [].forEach.call(bl.querySelectorAll('.sp'), function (sp) { var k = [].reduce.call(sp.children, function (a, c) { return a + c.getBoundingClientRect().height + parseFloat(getComputedStyle(c).marginTop) + parseFloat(getComputedStyle(c).marginBottom); }, 0); r = Math.max(r, k / sp.getBoundingClientRect().height, sp.scrollWidth / sp.clientWidth); });
        return r;
      };
      var s = +(bl.dataset.max || 1.18); bl.style.setProperty('--s', s);
      var zu = null;
      for (var i = 0; i < 9; i++) { var r = zuviel(); if (r <= 1.001) break; zu = s; s = s / r * 0.985; bl.style.setProperty('--s', s); }
      if (zu !== null && zuviel() <= 1.001) {
        var gut = s;
        for (var j = 0; j < 7; j++) { var m = (gut + zu) / 2; bl.style.setProperty('--s', m); if (zuviel() <= 1.001) gut = m; else zu = m; }
        s = gut; bl.style.setProperty('--s', s);
      }
      var rest = zuviel(), fehler = [];
      if (rest > 1.005) fehler.push('zu hoch');
      // Doldenhorn 17.10.2026: ragt ein Text seitlich aus dem Blatt (sehr langes Wort), schneidet das Blatt ihn in der PDF ab
      var rb = bl.getBoundingClientRect();
      [].forEach.call(inh.querySelectorAll('h1,h2,h3,h4,p,span,b,em,i,li'), function (e) {
        if (e.closest('[style*="transform"]')) return;
        var q = e.getBoundingClientRect();
        if (q.width && e.textContent.trim() && (q.right > rb.right + 0.5 || q.left < rb.left - 0.5)) fehler.push('ragt seitlich: ' + e.textContent.trim().slice(0, 30));
      });
      aus.push({ seite: n + 1, mass: Math.round(s * 100), frei: Math.max(0, Math.round((1 - inh.scrollHeight / inh.clientHeight) * 100)), fehler: fehler });
    });
    return aus;
  }

  /* Gestalten, das erst im Browser geht (wie GBR karte.js/satz.css, 16.10.2026):
     data-gt Schriftgrösse als Faktor: das Element bekommt seine Grösse relativ zum Umfeld in em, so folgt es auch dem Schriftmass der Seite.
     Linien: der Strich unter einer Rubrik oder zwischen Einträgen (unterer Rand) wird beim Bearbeiten, oder wenn er gestaltet ist, ein eigenes
     Element .lin an derselben Stelle (Länge, Stärke, Farbe, Lage, ausgeblendet); ungestaltet bleibt im Druck der Rand. */
  function gestaltAnwenden(bearbeiten, wurzeln) {
    var alle = function (sel) { return wurzeln ? [].concat.apply([], wurzeln.map(function (w) { return [].slice.call(w.querySelectorAll(sel)); })) : [].slice.call(document.querySelectorAll('#seiten ' + sel)); };
    alle('[data-gt]').forEach(function (el) {
      var p = el.parentElement, fs = parseFloat(getComputedStyle(el).fontSize), pf = p ? parseFloat(getComputedStyle(p).fontSize) : fs;
      el.style.fontSize = (fs / pf * parseFloat(el.dataset.gt)).toFixed(4) + 'em';
    });
    var kandidaten = bearbeiten ? alle('[data-n^="seiten."]') : alle('[data-lin-l]');
    kandidaten.forEach(function (el) {
      if (el.querySelector(':scope > .lin') || /:lin$/.test(el.dataset.n || '')) return;
      var c = getComputedStyle(el), bw = parseFloat(c.borderBottomWidth);
      if (!bw || c.borderBottomStyle === 'none' || c.borderBottomColor === 'rgba(0, 0, 0, 0)') return;
      var i = document.createElement('i'); i.className = 'lin'; i.setAttribute('data-lin', '');
      if (el.dataset.n) i.dataset.n = el.dataset.n + ':lin';
      i.style.cssText = 'position:absolute;left:0;bottom:' + (-bw) + 'px;width:100%;height:' + bw + 'px;background:' + c.borderBottomColor + ';transform-origin:0 0';
      var v = (el.dataset.linL || '').split(',');
      if (v.length > 4) {
        if (+v[0] || +v[1]) i.style.transform = 'translate(' + (+v[0]) + 'mm,' + (+v[1]) + 'mm)';
        if (+v[2]) i.style.width = (+v[2]) + 'mm';
        if (+v[3]) { i.style.height = (+v[3]) + 'mm'; i.style.bottom = '-' + (+v[3]) + 'mm'; }
        if (v[4]) i.style.background = v[4];
        if (v[5] === '1') i.style.visibility = 'hidden';
      }
      if (c.position === 'static') el.style.position = 'relative';
      el.style.borderBottomColor = 'transparent';
      el.appendChild(i);
    });
  }
  /* Vorschau: nur Seiten, deren Satz sich geändert hat, werden neu gesetzt und eingepasst (Doldenhorn 17.10.2026, Flüssigkeit: vorher wurde bei jeder
     Eingabe die ganze Karte neu eingepasst, gedrosselt 4–5 s). Unveränderte Seiten behalten ihr Element, ihr Schriftmass und ihren Bericht; das
     Ergebnis ist dasselbe wie beim vollen Satz (gleiche Seite, gleicher Ablauf des Einpassens). Druck und Mini setzen immer alles. */
  var CACHE = { karte: null, css: null, html: [], bericht: [] };
  // Eine Seite, die direkt in der Vorschau verändert wurde (Ziehen, Pfeile, Schreiben), gilt beim nächsten Satz als geändert
  function schmutzig(el) { var bl = el && el.closest && el.closest('.blatt'); if (!bl) return; var i = [].indexOf.call(document.querySelectorAll('#seiten > .blatt'), bl); if (i >= 0) CACHE.html[i] = null; }
  /* Gestaltung 30.10.2026 (Tor K12, Stilblatt): Trenner « / », « · » in Rudis Zeilen und « | » in Momos Zeilen entfallen am Zeilenende und am Zeilenanfang.
     Nach dem Einpassen wird jeder Trenner gemessen; bricht die Zeile an ihm, wird er zum Zeilenumbruch (Text bleibt im Element, nur unsichtbar). */
  function trennerAmRand(wurzeln) {
    // nur Trenner, an denen die Zeile wirklich bricht, bekommen ein Element; alle anderen bleiben reiner Text (Schreiben in der Vorschau, Proben)
    function oben(t, a, b) { var r = document.createRange(); r.setStart(t, a); r.setEnd(t, b); var q = r.getClientRects(); return q.length ? q[q.length - 1].top : null; }
    wurzeln.forEach(function (w) {
      [].forEach.call(w.querySelectorAll('.sb-n,.sb-dr'), function (p) {
        for (var runde = 0; runde < 4; runde++) {
          var tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT), knoten = [], n, neu = 0;
          while ((n = tw.nextNode())) if (!(n.parentNode.classList && n.parentNode.classList.contains('sb-tr')) && /\s[\/|·]\s/.test(n.nodeValue)) knoten.push(n);
          knoten.forEach(function (t) {
            var re = /\s[\/|·]\s/g, m, treffer = [];
            while ((m = re.exec(t.nodeValue))) if (m.index > 0 && m.index + 3 < t.nodeValue.length) treffer.push(m.index);
            for (var k = treffer.length - 1; k >= 0; k--) {
              var at = treffer[k], a = oben(t, at - 1, at), b = oben(t, at + 3, at + 4);
              if (a === null || b === null || Math.abs(b - a) <= 2) continue;
              var rest = t.splitText(at), nach = rest.splitText(3), sp = document.createElement('span');
              sp.className = 'sb-tr bruch'; rest.parentNode.replaceChild(sp, rest); sp.appendChild(rest); neu++;
              void nach; break;   // Lage hat sich geändert: in der nächsten Runde neu messen
            }
          });
          if (!neu) break;
        }
      });
    });
  }
  function setze(d, opt) {
    var css = SATZ.kopfCss(d), cssEl = document.getElementById('karte-css');
    if (cssEl.textContent !== css) cssEl.textContent = css;
    document.body.className = 'f-a4' + (opt.vorschau ? ' vorschau ' + MODUS : '');
    var s = SATZ.seiten(d, { marken: opt.vorschau });
    var S = document.getElementById('seiten'), neu = [];
    [].slice.call(S.querySelectorAll('.nr-zeile')).forEach(function (x) { x.remove(); });
    var alt = [].slice.call(S.querySelectorAll(':scope > .blatt'));
    if (opt.vorschau && CACHE.karte === d.ziel && CACHE.css === css && alt.length === s.length && CACHE.bericht.length === s.length) {
      s.forEach(function (h, i) { if (CACHE.html[i] !== h) { var t = document.createElement('div'); t.innerHTML = h; S.replaceChild(t.firstElementChild, alt[i]); neu.push(i); } });
    } else { S.innerHTML = s.join(''); neu = s.map(function (x, i) { return i; }); CACHE.bericht = []; }
    CACHE.karte = opt.vorschau ? d.ziel : null; CACHE.css = css; CACHE.html = s.slice();
    // Doldenhorn 17.10.2026: die Schriften des Satzes ausdrücklich laden, bevor eingepasst wird. «fonts.ready» allein meldet fertig, solange noch
    // keine Schrift angefragt ist; dann wurde mit der Ersatzschrift gemessen und eine Seite (Bistro S. 2, am Handy) fälschlich als «zu hoch» gemeldet.
    var SCHRIFTEN = ['340 12px "Fraunces Titel"', '320 12px "Fraunces Zeile"', '400 12px "Fraunces Zeile"', '400 12px "Instrument Sans"', '500 12px "Instrument Sans"', '500 12px Urbanist', '600 12px Urbanist', '400 12px "DM Mono"'];
    return Promise.all(SCHRIFTEN.map(function (f) { return document.fonts.load(f).catch(function () { return null; }); })).then(function () { return document.fonts.ready; }).then(function () {
      if (opt.vorschau) return null;   // Vorschau: Bilder haben feste Masse, der Satz steht schon, sie laden nach (Slow 4G: Text zuerst)
      return Promise.all([].map.call(document.images, function (i) { return i.complete ? 0 : new Promise(function (r) { i.onload = i.onerror = r; }); }));
    }).then(function () {
      var blaetter = [].slice.call(S.querySelectorAll(':scope > .blatt')), wurzeln = neu.map(function (i) { return blaetter[i]; });
      if (!wurzeln.length) return { seiten: s.length, mass: CACHE.bericht.map(function (b) { return b.mass; }), frei: CACHE.bericht.map(function (b) { return b.frei; }), fehler: CACHE.fehler || [], warn: CACHE.warn || [] };
      gestaltAnwenden(opt.vorschau, wurzeln);
      // Verschobene Einträge (Gestalten) zählen beim Einpassen nicht mit: sie liegen über dem Fluss, ohne ihn zu ändern
      var bewegt = [].concat.apply([], wurzeln.map(function (w) { return [].slice.call(w.querySelectorAll('[style*="transform"]')); })).filter(function (e) { return e.style.transform && e.style.transform !== 'none'; });
      var vorher = bewegt.map(function (e) { var v = e.style.transform; e.style.transform = 'none'; return v; });
      var neuBericht = passe(wurzeln), bericht = [];
      trennerAmRand(wurzeln);
      blaetter.forEach(function (bl, i) { var k = neu.indexOf(i); bericht.push(k >= 0 ? neuBericht[k] : CACHE.bericht[i]); });
      bericht.forEach(function (b, i) { b.seite = i + 1; });
      bewegt.forEach(function (e, i) {
        e.style.transform = vorher[i];
        var bl = e.closest('.blatt'), rb = bl.getBoundingClientRect(), r = e.getBoundingClientRect(), n = blaetter.indexOf(bl);
        if (e.style.display !== 'none' && (r.left < rb.left - 1 || r.right > rb.right + 1 || r.top < rb.top - 1 || r.bottom > rb.bottom + 1) && bericht[n]) bericht[n].fehler.push('ragt über den Rand des Blatts: ' + ((e.textContent || '').trim().slice(0, 30) || (e.classList.contains('lin') ? 'Linie' : 'Zeichen')));
      });
      CACHE.bericht = bericht;
      var fehler = [], warn = [];
      bericht.forEach(function (b) { if (b.fehler.length) fehler.push('Seite ' + b.seite + ': ' + b.fehler.filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ')); });
      var m = bericht.length ? Math.min.apply(null, bericht.map(function (b) { return b.mass; })) : 100;
      if (m < 70) warn.push('Die Schrift ist auf ' + m + ' % verkleinert, damit alles auf die Seiten passt. Lieber Einträge auf eine andere Seite schieben.');
      CACHE.fehler = fehler; CACHE.warn = warn;
      return { seiten: s.length, mass: bericht.map(function (b) { return b.mass; }), frei: bericht.map(function (b) { return b.frei; }), fehler: fehler, warn: warn, neu: neu.length };
    });
  }

  /* ---------------------------------------------------------------- Druck */
  if (q.get('druck')) {
    zeichen().then(function () {
      return fetch('/culinarium-demo/_werkzeuge/carte/api/druckdaten?z=' + encodeURIComponent(q.get('z') || '') + '&q=' + encodeURIComponent(q.get('q') || 'stand'), { cache: 'no-store' });
    }).then(function (r) { if (!r.ok) throw new Error('Daten ' + r.status); return r.json(); }).then(function (d) {
      document.title = d.name + ' · Culinarium';
      return setze(d, {});
    }).then(function (b) { window.CARTE_FERTIG = b; document.documentElement.dataset.fertig = '1'; })
      .catch(function (e) { window.CARTE_FEHLER = String(e && e.stack || e); });
    return;
  }

  /* ---------------------------------------------------------------- Mini (Fenster «So steht es auf der Karte»): ein Eintrag allein, gesetzt wie in der PDF */
  if (q.get('mini')) {
    document.body.className = 'mini';
    window.addEventListener('message', function (ev) {
      if (ev.origin !== location.origin || !ev.data || ev.data.carte !== 'mini') return;
      var m = ev.data, d = m.karte;
      zeichen().then(function () {
        // der Eintrag allein, in seinen Behältern (Seite, Inhalt …), damit er genau so gesetzt ist wie in der PDF
        var innen = m.knoten;
        (m.kette || []).slice().reverse().forEach(function (k) { innen = { fn: 'el', a: [k.tag, k.at, innen] }; });
        var html = SATZ.seiten({ art: 'satz', format: d.format, teile: d.teile, seiten: [{ fn: 'seite', a: [m.seite || ' class="blatt dh" data-b="210"', innen] }] })[0];
        document.getElementById('karte-css').textContent = SATZ.kopfCss(d) + '.blatt{height:auto!important;min-height:0!important;margin:0!important}.blatt .inhalt{flex:none!important;height:auto!important}';
        document.getElementById('seiten').innerHTML = html;
        return document.fonts.ready;
      }).then(function () {
        var b = document.querySelector('.blatt'); if (!b) return;
        /* Tor 5 30.10.2026 (K4/K8): gezeigt wird nur der Eintrag, so gross, dass er die Vorschau füllt (gesetzt bleibt er wie in der PDF, nur das Bild wird
           vergrössert und auf den Eintrag zugeschnitten); vorher stand er winzig auf dem ganzen, fast leeren Blatt */
        b.style.margin = '0'; b.style.transformOrigin = '0 0'; b.style.transform = 'none';
        document.documentElement.style.overflow = document.body.style.overflow = 'hidden';
        // Umriss des Texts (Linien und Rahmen der Seite zählen nicht mit, sonst bleibt die Schrift winzig)
        var B = b.getBoundingClientRect(), cw = document.documentElement.clientWidth, rand = 14, R = null, tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), t;
        while ((t = tw.nextNode())) {
          if (!/\S/.test(t.nodeValue)) continue;
          var rg = document.createRange(); rg.selectNodeContents(t);
          [].forEach.call(rg.getClientRects(), function (q) { if (!q.width) return; R = R ? { left: Math.min(R.left, q.left), top: Math.min(R.top, q.top), right: Math.max(R.right, q.right), bottom: Math.max(R.bottom, q.bottom) } : { left: q.left, top: q.top, right: q.right, bottom: q.bottom }; });
        }
        if (!R) R = { left: B.left, top: B.top, right: B.right, bottom: B.bottom };
        R.width = R.right - R.left; R.height = R.bottom - R.top;
        var z = Math.min(1.35, (cw - 2 * rand) / R.width), tx = (cw - R.width * z) / 2 - (R.left - B.left) * z, ty = rand - (R.top - B.top) * z;
        b.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + z.toFixed(4) + ')';
        an('mini-hoehe', { h: Math.ceil(R.height * z + 2 * rand) });
      });
    });
    return;
  }
  /* ---------------------------------------------------------------- Vorschau im Werkzeug */
  /* Verkleinern mit transform, nie mit CSS-zoom: zoom rechnet die Schrift neu und bricht anders um, dann läuft der Satz über (15.10.2026, Roberts Fund).
     Gesetzt und gemessen wird immer in Originalgrösse, nur das Bild wird kleiner. */
  function zoomen() {
    var vw = document.documentElement.clientWidth;
    [].forEach.call(document.querySelectorAll('.blatt'), function (b) {
      var w = parseFloat(b.dataset.b) * 96 / 25.4, h = b.offsetHeight;
      // Doldenhorn 17.10.2026: «+» darf über die Breite der Vorschau hinaus vergrössern (am Handy sonst nie lesbar), dann schiebt man seitlich
      // Tor 5 30.10.2026 (K5/K13): ohne eigenen Zoom passt das ganze Blatt in die Höhe der Vorschau, nichts unten angeschnitten
      var vh = document.documentElement.clientHeight, passt = Math.max(0.25, Math.min((vw - 16) / w, MODUS === 'frei' ? 9 : (vh - 64) / h)), z = ZOOM_EIGEN ? ZOOM : Math.min(ZOOM, passt), off = Math.max(0, (vw - w * z) / 2);
      b.style.transformOrigin = '0 0';
      b.style.transform = 'translateX(' + off.toFixed(1) + 'px) scale(' + z.toFixed(4) + ')';
      b.style.margin = '0 0 ' + (-(h * (1 - z)) + 26).toFixed(1) + 'px 0';
    });
  }
  function zeilen(b) {
    var seiten = [].slice.call(document.querySelectorAll('.blatt'));
    seiten.forEach(function (bl, i) {
      var z = document.createElement('p'), r = b.mass[i], f = b.fehler.filter(function (x) { return x.indexOf('Seite ' + (i + 1) + ':') === 0; });
      z.className = 'nr-zeile' + (f.length || r < 80 ? ' warn' : '');
      z.innerHTML = '<span>Seite <b>' + (i + 1) + '</b> von ' + seiten.length + '</span>' + (r < 100 ? '<span>Schrift <b>' + r + ' %</b></span>' : '') + (f.length ? '<span><b>passt nicht</b></span>' : '');
      bl.parentNode.insertBefore(z, bl.nextSibling);
    });
  }
  function lies(o, pfad) { return pfad.split('.').reduce(function (x, k) { return x == null ? x : x[/^\d+$/.test(k) ? +k : k]; }, o); }
  function an(art, x) { parent.postMessage(Object.assign({ carte: art }, x), location.origin); }
  window.addEventListener('message', function (ev) {
    if (ev.origin !== location.origin || !ev.data || !ev.data.carte) return;
    var m = ev.data;
    if (m.carte === 'hallo') return an('bereit', {});   // Schlössli 19.10.2026: Handschlag, falls das erste «bereit» kam, bevor das Werkzeug zuhörte
    if (m.carte === 'zoom') { ZOOM = m.zoom; ZOOM_EIGEN = !!m.eigen; zoomen(); return ANR.gesetzt(m.wahl || null); }
    if (m.carte === 'pfeil') return ANR.pfeil(m.key, m.shift);
    if (m.carte === 'abwaehlen') return ANR.waehle(null, true);
    if (m.carte === 'blitz') {
      var treffer = [].slice.call(document.querySelectorAll('[data-k="' + m.pfad + '"],[data-k^="' + m.pfad + '."],[data-k^="' + m.pfad + '~"]'));
      if (!treffer.length) return;
      var r0 = treffer[0].getBoundingClientRect();   // nur in diesem Rahmen scrollen, nie die Seite darum herum
      var ziel = m.y == null ? window.innerHeight / 2 : Math.max(40, Math.min(window.innerHeight - 40, m.y));   // dieselbe Höhe wie links (GBR blitzRechts)
      window.scrollTo({ top: Math.max(0, window.scrollY + r0.top + r0.height / 2 - ziel), behavior: 'smooth' });
      treffer.forEach(function (el) { el.classList.remove('blitz'); void el.offsetWidth; el.classList.add('blitz'); });
      return;
    }
    if (m.carte === 'setze') {
      var nr = ++N, oben = window.scrollY;
      MODUS = m.modus || 'einfach'; ZOOM = m.zoom || ZOOM; ZOOM_EIGEN = !!m.eigen;
      zeichen().then(function () { return setze(m.daten, { vorschau: true }); }).then(function (b) {
        if (nr !== N) return;
        zoomen(); zeilen(b);
        DATEN = m.daten;
        [].forEach.call(document.querySelectorAll('[data-k]'), function (el) { el.classList.toggle('geaendert', MODUS === 'frei' && (m.geschrieben || []).indexOf(el.dataset.k) >= 0); });
        window.scrollTo(0, oben);
        ANR.gesetzt(MODUS === 'frei' ? (m.wahl || null) : null, m.neu);
        an('gesetzt', { bericht: b, hoehe: document.documentElement.scrollHeight });
      }).catch(function (e) { an('fehler', { text: String(e && e.message || e) }); });
    }
  });
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-k]');
    if (!el || MODUS === 'frei') return;
    an('klick', { pfad: el.dataset.k });
  });
  document.addEventListener('dblclick', function (ev) {
    var el = ev.target.closest('[data-k]');
    if (el && MODUS !== 'frei') an('doppel', { pfad: el.dataset.k });
  });
  document.addEventListener('input', function (ev) {
    var el = ev.target.closest('[data-k]'); if (!el) return;
    el.classList.add('geaendert'); schmutzig(el);
    an('text', { pfad: el.dataset.k, wert: el.textContent.replace(/[ \t\r\n]+/g, ' ').replace(/^ +| +$/g, '') });
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.target.closest && ev.target.closest('[data-k]') && ev.key === 'Enter') { ev.preventDefault(); ev.target.blur(); }
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); an('speichern', {}); }
  });
  document.addEventListener('paste', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-k]'); if (!el) return;
    ev.preventDefault();
    document.execCommand('insertText', false, (ev.clipboardData.getData('text/plain') || '').replace(/\s+/g, ' '));
  });
  document.addEventListener('focusout', function (ev) { if (ev.target.closest && ev.target.closest('[data-k]')) an('fertig-geschrieben', {}); });
  /* ---------------------------------------------------------------- Freie Anordnung im Modus «Fortgeschritten» (1:1 nach La Carte des Grand Beau-Rivage,
     anordnen.js 15./16.10.2026). Ein Klick wählt ein Element der Seite (Rubrik, Gericht, Zeile, Hinweis, Text, Linie, Logo, Band, Kopfzeile, Zeichen,
     Fusszeile). Ziehen verschiebt es, mit Einrasten an Seitenmitte, Satzspiegel, Seitenrand und den anderen Elementen (rote Hilfslinien, Alt hält es an).
     Die vier Ecken machen es grösser oder kleiner im Verhältnis (40–300 %), die gegenüberliegende Ecke bleibt stehen; Linien haben Griffe an den Enden
     für die Länge. Pfeile 0,5 mm, mit Umschalt 5 mm. Doppelklick schreibt in den Text. Entf entfernt, Esc schliesst, ⌘Z / ⌘⇧Z nimmt zurück und
     wiederholt (der Verlauf liegt im Werkzeug). «Anordnung zurücksetzen» unter jeder Seite. Nichts Sichtbares verlässt das Blatt.
     Die Daten hält das Werkzeug (carte.js): hier wird nur gezeigt, gezogen und die neue Lage gemeldet. */
  var ANR = (function () {
    var FANG = 6, S_MIN = 0.4, S_MAX = 3, PX = 96 / 25.4;
    var SEL = null, zug = null, schreibt = null;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
    var an_ = function () { return MODUS === 'frei'; };
    var elVon = function (l) { return l ? document.querySelector('#seiten [data-n="' + (window.CSS && CSS.escape ? CSS.escape(l) : l) + '"]') : null; };
    var alleVon = function (l) { return l ? $$('#seiten [data-n="' + (window.CSS && CSS.escape ? CSS.escape(l) : l) + '"]') : []; };

    /* Lage aus dem Element lesen (transform und Breite, so wie der Satz sie geschrieben hat) */
    function lage(el) {
      var t = el.style.transform || '', m = t.match(/translate\(\s*(-?[\d.]+)mm\s*(?:,\s*(-?[\d.]+)mm)?\s*\)/), k = t.match(/scale\(\s*([\d.]+)/);
      var v = { x: m ? +m[1] : 0, y: m && m[2] ? +m[2] : 0, s: k ? +k[1] : 1 };
      if (el.hasAttribute('data-lin')) v.b = el.getBoundingClientRect().width / massstab(el) / PX;
      return v;
    }
    function zeige(els, v) { els.forEach(function (el) { var st = SATZ.lageStil(v).replace(/^transform:|;transform-origin:0 0$/g, ''); el.style.transform = st || ''; el.style.transformOrigin = '0 0'; }); }
    function massstab(el) { var bl = el.closest('.blatt'); if (!bl) return 1; return bl.getBoundingClientRect().width / (parseFloat(bl.dataset.b) * PX) || 1; }

    /* Sichtbarer Inhalt eines Elements (GBR inhalt()): Texte, Zeichen, Linien, Kästen mit Rand oder Fläche */
    function inhalt(el) {
      var L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
      var nimm = function (r) { if (r.width < 0.5 && r.height < 0.5) return; L = Math.min(L, r.left); T = Math.min(T, r.top); R = Math.max(R, r.right); B = Math.max(B, r.bottom); };
      var els = el.length !== undefined ? el : [el];
      els.forEach(function (e0) {
        var rg = document.createRange(), w = document.createTreeWalker(e0, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        for (var n = w.currentNode; n; n = w.nextNode()) {
          if (n.nodeType === 3) { if (n.textContent.trim()) { rg.selectNodeContents(n); [].forEach.call(rg.getClientRects(), nimm); } continue; }
          if (n.namespaceURI === 'http://www.w3.org/2000/svg') { if (n.tagName.toLowerCase() === 'svg') nimm(n.getBoundingClientRect()); continue; }
          if (n.classList && n.classList.contains('lin') && n !== e0) continue;   // die Linie eines Eintrags ist ein eigenes Element
          var c = getComputedStyle(n);
          if (n.tagName === 'IMG' || (n.tagName === 'I' && !n.firstChild) || parseFloat(c.borderTopWidth) || parseFloat(c.borderLeftWidth) || parseFloat(c.borderRightWidth)
            || (parseFloat(c.borderBottomWidth) && c.borderBottomColor !== 'rgba(0, 0, 0, 0)')
            || (c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent') || c.backgroundImage !== 'none') nimm(n.getBoundingClientRect());
        }
      });
      if (L === Infinity) return els[0].getBoundingClientRect();
      return { left: L, top: T, right: R, bottom: B, width: R - L, height: B - T };
    }

    /* Auswahl, Griffe, Hilfslinien */
    function ebene() {
      var a = $('#anr');
      if (!a) {
        a = document.createElement('div'); a.id = 'anr'; a.className = 'anr'; a.hidden = true;
        a.innerHTML = ['nw', 'ne', 'se', 'sw', 'w', 'e'].map(function (g) { return '<i class="anr__g anr__g--' + g + '" data-g="' + g + '"></i>'; }).join('') + '<b class="anr__m"></b>';
        document.body.appendChild(a);
        a.addEventListener('pointerdown', griffAn);
      }
      return a;
    }
    function box(a, r) { a.style.left = r.left + scrollX + 'px'; a.style.top = r.top + scrollY + 'px'; a.style.width = r.width + 'px'; a.style.height = r.height + 'px'; }
    function zeichne(mass) {
      var a = ebene(), els = an_() ? alleVon(SEL) : [], el = els[0];
      if (!el || !el.getBoundingClientRect().width || el.isContentEditable || (el.contains(document.activeElement) && document.activeElement.isContentEditable)) { a.hidden = true; return; }
      var r = inhalt(els);
      a.classList.toggle('anr--lin', el.hasAttribute('data-lin'));
      a.classList.toggle('anr--band', /^b:/.test(SEL));
      a.hidden = false; box(a, { left: r.left - 3, top: r.top - 3, width: r.width + 6, height: r.height + 6 });
      var m = $('.anr__m', a); m.textContent = mass || ''; m.hidden = !mass;
    }
    function linien(xs, ys, B) {
      $$('.anr-hl').forEach(function (n) { n.remove(); });
      xs.forEach(function (x) { var d = document.createElement('i'); d.className = 'anr-hl'; box(d, { left: x, top: B.top, width: 1, height: B.height }); document.body.appendChild(d); });
      ys.forEach(function (y) { var d = document.createElement('i'); d.className = 'anr-hl'; box(d, { left: B.left, top: y, width: B.width, height: 1 }); document.body.appendChild(d); });
    }
    function info(l) {   // was die Seitenleiste «Gestalten» über das gewählte Element wissen muss
      var els = alleVon(l), el = els[0]; if (!el) return null;
      var bl = el.closest('.blatt'), k = massstab(el), mm = function (px) { return px / PX; };
      var art = el.hasAttribute('data-lin') || /:lin$/.test(l) ? 'linie' : el.tagName === 'IMG' ? 'zeichen' : (el.tagName === 'HEADER' || el.tagName === 'FOOTER') ? 'text' : 'eintrag';
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), ht = el;
      for (var n = w.nextNode(); n; n = w.nextNode()) if (n.textContent.trim() && !(n.parentElement.closest('.lin'))) { ht = n.parentElement; break; }
      var hs = getComputedStyle(ht), cs = getComputedStyle(el), v = lage(el);
      var lh = hs.lineHeight === 'normal' ? 1.2 : parseFloat(hs.lineHeight) / parseFloat(hs.fontSize);
      var r = el.getBoundingClientRect();
      var name = art === 'linie' ? 'Linie' : art === 'zeichen' ? 'Bild' : el.tagName === 'HEADER' ? 'Band oben' : el.tagName === 'FOOTER' ? 'Fusszeile' : '«' + (ht.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 34) + ((ht.textContent || '').trim().length > 34 ? '…' : '') + '»';
      return { id: l, art: art, name: name, pt: (parseFloat(hs.fontSize) || 12) * 0.75 * (art === 'eintrag' ? 1 : v.s), lh: lh, mt: mm(parseFloat(cs.marginTop) || 0), mb: mm(parseFloat(cs.marginBottom) || 0),
        dicke: mm(parseFloat(cs.height) || 0), laenge: r.width / k / PX, hoehe: r.height / k / PX, s: v.s, blattB: bl ? parseFloat(bl.dataset.b) : 210 };
    }
    function waehle(l, still) {
      var neu = l !== SEL; SEL = l; zeichne(); schwebe(null);
      if (neu && !still) an('wahl', { info: l ? info(l) : null });
    }
    function schwebe(el) {
      var h = $('#anr-h');
      if (!h) { h = document.createElement('div'); h.id = 'anr-h'; h.className = 'anr-h'; document.body.appendChild(h); }
      if (!el || el.dataset.n === SEL || zug || el.isContentEditable) { h.hidden = true; return; }
      var r = inhalt(alleVon(el.dataset.n)); h.hidden = false; box(h, { left: r.left - 3, top: r.top - 3, width: r.width + 6, height: r.height + 6 });
    }

    /* «Anordnung zurücksetzen» unter jeder Seite, sobald dort etwas verschoben ist */
    function knoepfe() {
      $$('#seiten .blatt').forEach(function (bl, i) {
        var nz = bl.nextElementSibling && bl.nextElementSibling.classList.contains('nr-zeile') ? bl.nextElementSibling : null; if (!nz) return;
        var k = $('.anr-zu', nz), ids = [];
        if (an_()) $$('[data-n]', bl).forEach(function (el) { var v = lage(el); if (Math.abs(v.x) > 0.04 || Math.abs(v.y) > 0.04 || Math.abs(v.s - 1) > 0.004 || (el.hasAttribute('data-lin') && el.style.width && /mm$/.test(el.style.width))) ids.push(el.dataset.n); });
        if (!ids.length) { if (k) k.remove(); return; }
        if (!k) { k = document.createElement('button'); k.type = 'button'; k.className = 'anr-zu'; k.textContent = 'Anordnung zurücksetzen'; nz.appendChild(k); }
        k.dataset.ids = JSON.stringify(ids.filter(function (x, j, a) { return a.indexOf(x) === j; })); k.dataset.seite = i + 1;
      });
    }

    /* Ziehen */
    function ziele(els, blatt) {   // Kanten und Mitten: Seite, Satzspiegel (haben Vorrang), dann alle anderen Elemente der Seite
      var B = blatt.getBoundingClientRect(), xs = [B.left, B.left + B.width / 2, B.right], ys = [B.top, B.top + B.height / 2, B.bottom], exs = [], eys = [];
      var inh = blatt.querySelector('.inhalt');
      if (inh) { var r = inh.getBoundingClientRect(); xs.push(r.left, r.right); ys.push(r.top, r.bottom); }
      $$('[data-n]', blatt).forEach(function (o) {
        if (els.some(function (el) { return o === el || o.contains(el) || el.contains(o); })) return;
        if (!o.getBoundingClientRect().width) return;
        var q = inhalt(o); exs.push(q.left, q.left + q.width / 2, q.right); eys.push(q.top, q.top + q.height / 2, q.bottom);
      });
      return { xs: xs, ys: ys, exs: exs, eys: eys, B: B };
    }
    function fang(werte, ziel) { var best = null; werte.forEach(function (w) { ziel.forEach(function (z) { var d = z - w; if (Math.abs(d) <= FANG && (!best || Math.abs(d) < Math.abs(best.d))) best = { d: d, z: z }; }); }); return best; }
    function start(ev, art, els) {
      var el = els[0], blatt = el.closest('.blatt'), R = el.getBoundingClientRect(), C = inhalt(els), k = massstab(el) * PX;
      var v = lage(el);
      var M = { NL: R.left - v.x * k, NT: R.top - v.y * k, cl: (C.left - R.left) / v.s, ct: (C.top - R.top) / v.s, cw: C.width / v.s, ch: C.height / v.s };
      zug = { art: art, els: els, el: el, l: SEL, px: ev.clientX, py: ev.clientY, R: C, RR: R, M: M, k: k, v: v, cx: v.x, blatt: blatt, Z: ziele(els, blatt), bewegt: false };
      schwebe(null);
      /* 16.10.2026 (Absicherung aus der Prüfung): geht ein Loslassen verloren (im Prüfbrowser Firefox, wenn ausserhalb des Fensters losgelassen wird),
         hinge das Element am Zeiger. Darum Zeiger festhalten, und eine Bewegung ohne gedrückte Taste beendet das Ziehen an der letzten Stelle. */
      try { if (ev.pointerId !== undefined && ev.target.setPointerCapture) ev.target.setPointerCapture(ev.pointerId); } catch (e) { /* ohne Festhalten */ }
      addEventListener('pointermove', zieh); addEventListener('pointerup', ende); addEventListener('pointercancel', ende); addEventListener('blur', ende);
    }
    function zieh(ev) {
      if (!zug) return;
      if (ev.buttons === 0 && ev.pointerType === 'mouse') return ende();
      var dx = ev.clientX - zug.px, dy = ev.clientY - zug.py;
      if (!zug.bewegt && Math.hypot(dx, dy) < 3) return;
      zug.bewegt = true; ev.preventDefault();
      var R = zug.R, k = zug.k, v = zug.v, Z = zug.Z, B = Z.B, n;
      if (zug.art === 'zieh') {
        var lx = [], ly = [];
        if (!ev.altKey) {
          var wx = [R.left + dx, R.left + R.width / 2 + dx, R.right + dx], wy = [R.top + dy, R.top + R.height / 2 + dy, R.bottom + dy];
          var fx = fang(wx, Z.xs) || fang(wx, Z.exs), fy = fang(wy, Z.ys) || fang(wy, Z.eys);
          if (fx) { dx += fx.d; lx.push(fx.z); }
          if (fy) { dy += fy.d; ly.push(fy.z); }
        }
        dx = Math.min(B.right - R.right, Math.max(B.left - R.left, dx)); dy = Math.min(B.bottom - R.bottom, Math.max(B.top - R.top, dy));   // bleibt auf dem Blatt
        linien(lx.filter(function (x) { return Math.abs(x - (R.left + dx)) < 1 || Math.abs(x - (R.left + R.width / 2 + dx)) < 1 || Math.abs(x - (R.right + dx)) < 1; }),
          ly.filter(function (y) { return Math.abs(y - (R.top + dy)) < 1 || Math.abs(y - (R.top + R.height / 2 + dy)) < 1 || Math.abs(y - (R.bottom + dy)) < 1; }), B);
        n = { x: v.x + dx / k, y: v.y + dy / k, s: v.s };
        zeige(zug.els, n); zug.n = n;
        zeichne((n.x >= 0 ? '+' : '') + n.x.toFixed(1) + ' · ' + (n.y >= 0 ? '+' : '') + n.y.toFixed(1) + ' mm');
      } else if (zug.art === 'w' || zug.art === 'e') {   // Linie: Länge, die andere Kante bleibt stehen
        var g = zug.art, el = zug.el;
        var w = Math.max(2 * k, Math.min(B.width, R.width + (g === 'e' ? dx : -dx))), b = w / k;
        el.style.width = b.toFixed(2) + 'mm';
        var r2 = el.getBoundingClientRect(), fest = g === 'e' ? R.left : R.right, jetzt = g === 'e' ? r2.left : r2.right;
        zug.cx += (fest - jetzt) / k;
        n = { x: zug.cx, y: v.y, s: 1, b: Math.round(b * 10) / 10 };
        zeige(zug.els, n); zug.n = n;
        zeichne(b.toFixed(1) + ' mm');
      } else {
        var gg = zug.art, sx = gg.indexOf('e') >= 0 ? 1 : -1, sy = gg.indexOf('s') >= 0 ? 1 : -1, M = zug.M;   // die gegenüberliegende Ecke bleibt stehen
        var s1 = (R.width + sx * dx) / M.cw, s2 = (R.height + sy * dy) / M.ch;
        var sk = Math.abs(s1 - v.s) > Math.abs(s2 - v.s) ? s1 : s2;
        var maxW = sx > 0 ? B.right - R.left : R.right - B.left, maxH = sy > 0 ? B.bottom - R.top : R.bottom - B.top;
        sk = Math.max(S_MIN, Math.min(S_MAX, sk, maxW / M.cw, maxH / M.ch));
        var links = sx > 0 ? R.left : R.right - M.cw * sk, oben = sy > 0 ? R.top : R.bottom - M.ch * sk;
        n = { x: (links - M.NL - M.cl * sk) / k, y: (oben - M.NT - M.ct * sk) / k, s: sk };
        zeige(zug.els, n); zug.n = n;
        zeichne(Math.round(sk * 100) + ' %');
      }
    }
    function ende() {
      removeEventListener('pointermove', zieh); removeEventListener('pointerup', ende); removeEventListener('pointercancel', ende); removeEventListener('blur', ende);
      var z = zug; zug = null; linien([], [], {});
      if (!z) return;
      if (z.bewegt && z.n) { schmutzig(z.el); an('lage', { id: z.l, v: z.n }); knoepfe(); }
      zeichne();
    }
    function griffAn(ev) {
      var g = ev.target.closest('[data-g]'); if (!g || !SEL) return;
      var els = alleVon(SEL); if (!els.length) return;
      ev.preventDefault(); ev.stopPropagation();
      start(ev, g.dataset.g, els);
    }
    function schreibtGerade() { var a = document.activeElement; return a && a.isContentEditable && a.closest('#seiten') ? a : null; }
    function pfeil(key, shift) {
      var els = alleVon(SEL), el = els[0]; if (!el) return;
      var st = shift ? 5 : 0.5, p = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[key]; if (!p) return;
      var blatt = el.closest('.blatt'), B = blatt.getBoundingClientRect(), R = inhalt(els), kk = massstab(el) * PX;
      var dx = Math.min((B.right - R.right) / kk, Math.max((B.left - R.left) / kk, p[0])), dy = Math.min((B.bottom - R.bottom) / kk, Math.max((B.top - R.top) / kk, p[1]));
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;
      var v = lage(el), n = { x: v.x + dx, y: v.y + dy, s: v.s };
      zeige(els, n); zeichne(); knoepfe(); schmutzig(el);
      an('lage', { id: SEL, v: n });
    }
    function schreibbar(t) {   // Text, der direkt in der Karte geändert werden darf
      if (!t || t.querySelector('[data-k]')) return false;
      if (DATEN && DATEN.art === 'abend') {   // Der nächste Abend: nur Texte aus einem Feld des Abends (Datum und Gang-Namen setzt der Abend)
        var gen = { seiten: SATZ.ABEND.seiten(DATEN.abend) }, kk = t.dataset.k.split('.'), node = lies(gen, kk.slice(0, -2).join('.'));
        return !!(node && node.w);
      }
      var kp = /^(.*)~kap\d$/.exec(t.dataset.k); if (kp) { var e = lies(DATEN || {}, kp[1]); return !!(e && e.fn === 'el'); }   // Kapitälchen: ein Text
      return typeof lies(DATEN || {}, t.dataset.k) === 'string';
    }

    function verbinden() {
      var S = document.getElementById('seiten');
      S.addEventListener('pointerdown', function (ev) {
        if (!an_() || ev.button !== 0 || ev.target.closest('.anr-zu')) return;
        var e = schreibtGerade(); if (e && e.contains(ev.target)) return;   // beim Schreiben setzt ein Klick den Zeiger in den Text
        var el = ev.target.closest('[data-n]');
        if (!el) { if (SEL) waehle(null); return; }
        ev.preventDefault();
        if (e) e.blur();
        waehle(el.dataset.n);
        start(ev, 'zieh', alleVon(el.dataset.n));
      });
      S.addEventListener('dblclick', function (ev) {   // direkt in den Text schreiben
        if (!an_()) return;
        var t = ev.target.closest('[data-k]'); if (!schreibbar(t)) return;
        t.contentEditable = 'true'; t.spellcheck = true; t.focus();
        var r = null;
        if (document.caretRangeFromPoint) r = document.caretRangeFromPoint(ev.clientX, ev.clientY);
        else if (document.caretPositionFromPoint) { var p = document.caretPositionFromPoint(ev.clientX, ev.clientY); if (p) { r = document.createRange(); r.setStart(p.offsetNode, p.offset); } }
        if (r && t.contains(r.startContainer)) { var sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); }
        schreibt = t; an('schreibt', {});
        var a = $('#anr'); if (a) a.hidden = true;
      });
      S.addEventListener('focusout', function (ev) { if (ev.target === schreibt) { schreibt.contentEditable = 'false'; schreibt = null; } });
      S.addEventListener('pointermove', function (ev) { if (an_() && !zug) schwebe(ev.target.closest('[data-n]')); });
      S.addEventListener('pointerleave', function () { schwebe(null); });
      addEventListener('scroll', function () { zeichne(); }, { passive: true });
      // Grössenwechsel: zeichnet der Rahmen-Teil oben nach dem Einpassen (zoomen)
      document.addEventListener('click', function (ev) {
        var b = ev.target.closest('.anr-zu'); if (!b || !an_()) return;
        an('seite-zurueck', { ids: JSON.parse(b.dataset.ids || '[]'), seite: +b.dataset.seite });
      });
      document.addEventListener('keydown', function (ev) {
        // ⌘S speichert auch, wenn der Fokus in der Vorschau liegt (GBR: ein Dokument; hier ein Rahmen, sonst speichert der Browser die Seite)
        if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); var sg = schreibtGerade(); if (sg) sg.blur(); return setTimeout(function () { an('taste', { was: 'speichern' }); }, 60); }
        if (!an_() || schreibtGerade() || zug) return;
        var cmd = ev.metaKey || ev.ctrlKey, k = ev.key.toLowerCase();
        if (cmd && k === 'z') { ev.preventDefault(); return an('taste', { was: ev.shiftKey ? 'vor' : 'zurueck' }); }
        if (cmd && k === 'y') { ev.preventDefault(); return an('taste', { was: 'vor' }); }
        if (!SEL) return;
        if (ev.key === 'Escape') { waehle(null); return an('taste', { was: 'esc' }); }
        if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); return an('entf', { id: SEL }); }
        if (/^Arrow/.test(ev.key)) { ev.preventDefault(); pfeil(ev.key, ev.shiftKey); }
      });
    }
    /* Beim Öffnen einer Karte federn die Seiten einmal herein (GBR auftritt(), Klasse kt-auf 2,4 s); beim Bearbeiten bewegt sich nichts nach */
    var aufUhr = 0;
    function auftritt() {
      var S = document.getElementById('seiten'), f = $$('.blatt', S); if (!f.length) return;
      f.forEach(function (x, i) { x.style.setProperty('--i', Math.min(i, 6)); });
      S.classList.remove('kt-auf'); void S.offsetWidth; S.classList.add('kt-auf');
      clearTimeout(aufUhr); aufUhr = setTimeout(function () { S.classList.remove('kt-auf'); zeichne(); }, 2400);
    }
    verbinden();
    return {
      gesetzt: function (wahl, neu) {
        if (neu) auftritt();
        document.body.classList.toggle('anr-an', an_());
        SEL = an_() && wahl && elVon(wahl) ? wahl : null;
        knoepfe(); zeichne();
        if (wahl && !SEL) an('wahl', { info: null }); else if (SEL) an('wahl', { info: info(SEL), still: true });
      },
      pfeil: pfeil, waehle: waehle, inhalt: inhalt, zeichne: zeichne,
    };
  })();
  // Erst die Blätter neu einpassen, dann Rahmen und Griffe nachziehen (die Seitenleiste «Gestalten» macht die Vorschau schmaler; 16.10.2026)
  window.addEventListener('resize', function () { zoomen(); if (ANR) ANR.zeichne(); });
  document.body.classList.add('vorschau');
  an('bereit', {});
})();
