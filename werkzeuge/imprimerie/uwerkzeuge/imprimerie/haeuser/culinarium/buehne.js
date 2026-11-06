/* L’Imprimerie des Culinarium Hannover: Bühne über jeder Ansicht und Knopf zurück zu La Maison (Robert 15.10.2026).
   «Heroes richtig schön, geil, luxuriös, edel», Vorbild Le Bureau der Häuser: blaue Tafel mit Tapete, Goldrahmen innen,
   Foto des Hauses rechts mit weichem Übergang, Titel links. Gleiche Sprache wie Grand Beau-Rivage/website/studio/buehne.js.
   «In allen Tools zurück in die Maison kommen» → runder Knopf mit Haus in beiden Kopfzeilen.
   Nur für dieses Haus geladen (index.html, HAUS_STIL). Entfernen = vorheriger Stand. */
(function () {
  var BASIS = 'haeuser/culinarium/kopf/';
  /* Foto je Ansicht (1200 px, haeuser/culinarium/kopf/, gebaut von bau.py) */
  var FOTO = { msStart: 'fassade', msAbend: 'kerze2', msMotive: 'tafelleer', msEvents: 'anstossen', msAbteilungen: 'tafelleer', msHinweise: 'flur', msNewsletter: 'kerze2',
    msFotos: 'pass', msMarke: 'schildnacht', msLivre: 'barneg', msMeine: 'theke', msFreigegeben: 'kartglas', msNeu: 'glas', msInspiration: 'barnacht', weg: 'barnacht', entwuerfe: 'lauch' };
  /* La Maison des Culinarium: liegt wie die Plakatwerkstatt unter _werkzeuge/ (lokal /culinarium-demo/_werkzeuge/maison/ auf deren Server :9081, online /maison/) */
  var MAISON = location.port === '9087' ? 'http://127.0.0.1:9081/_werkzeuge/maison/' : /\/_werkzeuge\//.test(location.pathname) ? '../maison/' : '/maison/';
  /* R05: die Website des Hauses (lokal auf ihrem Server :8765, online dieselbe Adresse) */
  var WEBSITE = location.port === '9087' ? 'http://127.0.0.1:8765/' : '/';
  var WELT = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.6 5.2 3.6 8.5s-1 6.1-3.6 8.5c-2.6-2.4-3.6-5.2-3.6-8.5s1-6.1 3.6-8.5z"/></svg>';
  var HAUS = '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>';

  /* Breite der Kopf-Fotos (px); breitere haben eine 800er-Fassung daneben (kopf/<name>-800.webp, 30.10.2026) */
  var BREITE = { anstossen: 800, barnacht: 900, barneg: 960, fassade: 960, flur: 900, glas: 800, kartglas: 960, kerze2: 900, klaeren: 900, kueche: 960, lauch: 1200, loch: 900, pass: 1200, schildnacht: 900, tafelleer: 960, theke: 900, trio2: 1200 };
  /* Nur das Foto der offenen Ansicht lädt sofort; die Köpfe verborgener Ansichten laden erst, wenn ihre Ansicht aufgeht
     (vorher holte die Werkstatt alle Kopf-Fotos vor dem ersten Knopf, gedrosselt rund 400 KB) */
  var warte = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting || e.target.getClientRects().length) { warte.unobserve(e.target); laden(e.target); } });
  }) : null;
  function laden(f) {
    var im = f.__im; if (!im || im.src) return;
    var m = /kopf\/([a-z0-9]+)\.webp$/.exec(f.__src), w = m && BREITE[m[1]];
    if (w > 800) { im.sizes = '(max-width:760px) 100vw, min(58vw, 820px)'; im.srcset = BASIS + m[1] + '-800.webp 800w, ' + f.__src + ' ' + w + 'w'; }
    im.src = f.__src;
    if (im.complete && im.naturalWidth) f.classList.add('da');
  }
  function foto(h, src) {
    var f = document.createElement('div'); f.className = 'ms-bue__foto'; f.setAttribute('aria-hidden', 'true');
    var im = new Image(); im.alt = ''; im.decoding = 'async';
    im.onload = function () { f.classList.add('da'); };
    f.__im = im; f.__src = src; f.appendChild(im); h.insertBefore(f, h.firstChild);
    // erst nach dem Aufbau: die Hausschicht oberflaeche.js ersetzt manche Bühnen sofort durch ihr Startbild, deren Foto soll gar nicht erst laden
    setTimeout(function () { if (!f.isConnected) return; if (!warte || h.getClientRects().length) laden(f); else warte.observe(f); }, 0);
  }
  function buehne(h, src, knapp) {
    if (!h || h.__b) return; h.__b = 1;
    h.classList.add('ms-bue'); if (knapp) h.classList.add('ms-bue--knapp');
    foto(h, src);
  }
  /* Kopf einer Ansicht in eine eigene Tafel heben (h1, Satz, Feld bleiben dieselben Knoten) */
  function hebe(eltern, knoten, src, cls) {
    if (!eltern || eltern.__b || !knoten[0]) return; eltern.__b = 1;
    var t = document.createElement('div'); t.className = 'ms-tafel ' + (cls || '');
    eltern.insertBefore(t, knoten[0]);
    knoten.forEach(function (k) { if (k) t.appendChild(k); });
    buehne(t, src);
  }
  function alle() {
    buehne(document.querySelector('#msStart .ms-gruss'), BASIS + FOTO.msStart + '.webp');
    [].forEach.call(document.querySelectorAll('#start .ms-titel'), function (t) {
      var v = t.closest('[id^="ms"]'); buehne(t, BASIS + (FOTO[v && v.id] || 'fassade') + '.webp', true);
    });
    var neu = document.getElementById('msNeu');
    if (neu) hebe(neu, [neu.querySelector(':scope>h1'), neu.querySelector(':scope>.start__satz'), neu.querySelector(':scope>.start__direkt'), neu.querySelector(':scope>.start__fehler')], BASIS + FOTO.msNeu + '.webp', 'ms-tafel--mitte');
    var w = document.getElementById('startWeg');
    if (w && !w.hidden) {
      buehne(w.querySelector('.weg__kopf'), BASIS + FOTO.weg + '.webp', true);
      var h1 = w.querySelector(':scope>h1');
      if (h1) hebe(w, [h1, w.querySelector(':scope>.start__satz')], BASIS + FOTO.entwuerfe + '.webp');
    }
    var kd = document.querySelector('#msDetail .kd');
    if (kd && !kd.__b) {
      var b = kd.querySelector('.wo__bild'), m = b && /url\(["']?([^"')]+)/.exec(b.style.backgroundImage);
      buehne(kd, m ? m[1] : BASIS + FOTO.msEvents + '.webp');
    }
    maison();
  }
  function knopf(cls) {
    var a = document.createElement('a'); a.className = 'rund ' + cls; a.href = MAISON;
    a.setAttribute('aria-label', 'Zurück zum Tresen'); a.setAttribute('data-tip', 'Der Tresen'); a.innerHTML = HAUS;
    return a;
  }
  function maison() {
    var k = document.querySelector('.ms-kopf');
    if (k && !k.querySelector('.zur-maison')) { var l = k.querySelector('.ms-rund'); k.insertBefore(knopf('ms-rund zur-maison'), l || null); }
    if (k && !k.querySelector('.zur-website')) { var wz = document.createElement('a'); wz.className = 'rund ms-rund zur-maison zur-website'; wz.href = WEBSITE; wz.target = '_blank'; wz.rel = 'noopener';
      wz.setAttribute('aria-label', 'Website ansehen'); wz.setAttribute('data-tip', 'Website'); wz.innerHTML = WELT; k.insertBefore(wz, k.querySelector('.zur-maison').nextSibling); }
    var ml = document.querySelector('.ml-kopf');
    if (ml && !ml.querySelector('.zur-maison')) { var g = ml.querySelector('.ml-geraet'); ml.insertBefore(knopf('zur-maison'), g || null); }
    var e = document.querySelector('.kopf__werk');
    if (e && !e.querySelector('.zur-maison')) { var n = e.querySelector('#btnNeu'); e.insertBefore(knopf('zur-maison'), n || e.firstChild); }
  }
  /* Editor: Grund der Arbeitsfläche nach dem Dokument (Robert 15.10.2026: «blaue Dokumente, dann weisser Hintergrund; weisse Dokumente,
     dann blauer Hintergrund; bei Fotos situativ, je nachdem, was im Foto überwiegt»). Die Seite wird in einem Raster abgetastet:
     je Punkt zählt das oberste Foto oder die oberste Fläche, sonst der Grund des Blatts. Dunkel überwiegt → Fläche hell, sonst blau. */
  var hellCache = {}, prueft = 0;
  function lum(c) { var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(c || ''); if (!m || m[4] === '0') return null;
    return (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255; }
  function fotoLum(im) {
    if (hellCache[im.src] != null) return hellCache[im.src];
    if (!im.complete || !im.naturalWidth) { im.addEventListener('load', grundBald, { once: true }); return null; }
    try { var c = document.createElement('canvas'); c.width = c.height = 16; var x = c.getContext('2d'); x.drawImage(im, 0, 0, 16, 16);
      var d = x.getImageData(0, 0, 16, 16).data, s = 0; for (var i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      return (hellCache[im.src] = s / (d.length / 4) / 255); } catch (e) { return (hellCache[im.src] = 0.5); }
  }
  function grundPruefen() {
    prueft = 0;
    var fl = document.getElementById('flaeche'), bl = fl && fl.querySelector('.blatt'); if (!bl) return;
    var r = bl.getBoundingClientRect(); if (!r.width) return;
    var grund = lum(getComputedStyle(bl).backgroundColor); if (grund == null) grund = 1;
    var teile = [].slice.call(bl.children).map(function (e) {
      var q = e.getBoundingClientRect(), im = e.querySelector('img'), l = null;
      if (im) l = fotoLum(im); else if (!e.textContent.trim()) l = lum(getComputedStyle(e).backgroundColor);
      return l == null ? null : { x0: q.left, x1: q.right, y0: q.top, y1: q.bottom, l: l };
    }).filter(Boolean).reverse();
    var n = 0, s = 0;
    for (var i = 0; i < 18; i++) for (var j = 0; j < 30; j++) {
      var px = r.left + (i + .5) / 18 * r.width, py = r.top + (j + .5) / 30 * r.height, l = grund;
      for (var k = 0; k < teile.length; k++) { var t = teile[k]; if (px >= t.x0 && px <= t.x1 && py >= t.y0 && py <= t.y1) { l = t.l; break; } }
      s += l; n++;
    }
    fl.classList.toggle('flaeche--hell', s / n < 0.45);
  }
  function grundBald() { if (!prueft) prueft = setTimeout(grundPruefen, 200); }

  function los() {
    document.documentElement.classList.add('haus-hell');
    /* sofort im Beobachter (vor dem nächsten Bild), sonst erscheint eine Ansicht kurz ohne Bühne und springt dann (15.10.2026) */
    var lauf = 0;
    new MutationObserver(function () { if (lauf) return; lauf = 1; try { alle(); } finally { lauf = 0; } })
      .observe(document.getElementById('start') || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    alle();
    var w = document.getElementById('wirt');
    if (w) { new MutationObserver(grundBald).observe(w, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] }); grundBald(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los); else los();
  /* R06: Wege unten in der Seitenleiste */
  function wege() { document.querySelectorAll('.ms-wege a[data-weg]').forEach(function (a) { a.href = a.dataset.weg === 'stube' ? MAISON : WEBSITE; }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wege); else wege();
})();
