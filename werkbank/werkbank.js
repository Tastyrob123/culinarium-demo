/* Werkbank Carlton-Europe: Hereinkommen, Zahlen, Bänder, Vergleich, Gefüge, Seiten-Bühne.
   Keine Bibliothek, nativer Scroll, ein Takt (requestAnimationFrame) für alles, was am Scroll hängt. */
(function () {
  'use strict';
  var doc = document, ruhig = matchMedia('(prefers-reduced-motion:reduce)').matches, fein = matchMedia('(pointer:fine)').matches;
  var $ = function (s, e) { return (e || doc).querySelector(s); }, $$ = function (s, e) { return [].slice.call((e || doc).querySelectorAll(s)); };
  doc.documentElement.classList.add('js');

  /* ---------- Text fassen: Buchstaben für große Zeilen, Wörter für Absätze ---------- */
  function fasse(el, wortweise) {
    var i = 0, label = el.textContent;
    (function geh(k) {
      [].slice.call(k.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var f = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (teil) {
            if (!teil) return;
            if (/^\s+$/.test(teil)) { f.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span');
            if (wortweise) { w.className = 'wt'; w.style.setProperty('--w', i++); w.textContent = teil; }
            else { w.className = 'w'; teil.split('').forEach(function (z) { var b = doc.createElement('span'); b.className = 'b'; b.style.setProperty('--i', i++); b.textContent = z; w.appendChild(b); }); }
            f.appendChild(w);
          });
          k.replaceChild(f, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') geh(n);
      });
    })(el);
    if (!wortweise) el.setAttribute('aria-label', label);
  }
  $$('[data-a="worte"]').forEach(function (e) { fasse(e, true); });

  /* ---------- Grosse Zeilen passen immer in ihre Spalte: zu breite Titel werden als Ganzes kleiner gesetzt ---------- */
  function passe() {
    var zt = $$('.zt'); zt.forEach(function (t) { t.style.fontSize = ''; });
    if (innerWidth < 640) return;
    var mass = zt.map(function (t) { var b = t.clientWidth, w = 0; $$('.z>span', t).forEach(function (s) { w = Math.max(w, s.offsetWidth); }); return [b, w, parseFloat(getComputedStyle(t).fontSize)]; });
    zt.forEach(function (t, i) { var m = mass[i]; if (m[0] > 0 && m[1] > m[0]) t.style.fontSize = (m[2] * m[0] / m[1] * 0.985).toFixed(1) + 'px'; });
  }
  passe(); if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(passe);
  var pt = 0; addEventListener('resize', function () { clearTimeout(pt); pt = setTimeout(passe, 120); });

  /* ---------- Zahlen, die durchrollen ---------- */
  $$('.odo').forEach(function (o) {
    var z = o.getAttribute('data-z'); o.setAttribute('aria-label', z); o.textContent = '';
    z.split('').forEach(function (c, i) {
      if (!/\d/.test(c)) { var p = doc.createElement('i'); p.textContent = c; o.appendChild(p); return; }
      var s = doc.createElement('span'); s.className = 'od'; s.style.setProperty('--i', i); s.dataset.d = c;
      for (var d = 0; d < 10; d++) { var e = doc.createElement('i'); e.textContent = d; s.appendChild(e); }
      o.appendChild(s);
    });
  });
  function rolle(o) { $$('.od', o).forEach(function (s) { s.style.transform = 'translateY(' + (-10 * +s.dataset.d) + '%)'; }); }
  /* Serifen-Ziffern sind verschieden breit: jede Spalte bekommt die Breite ihrer Zielziffer */
  function odoBreite() {
    $$('.odo').forEach(function (o) {
      var m = doc.createElement('span'); m.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap'; o.appendChild(m);
      $$('.od', o).forEach(function (s) { m.textContent = s.dataset.d; s.style.setProperty('--b', (m.getBoundingClientRect().width + 1).toFixed(1) + 'px'); });
      o.removeChild(m);
    });
  }
  odoBreite(); if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(odoBreite); addEventListener('resize', odoBreite);

  /* ---------- Hereinkommen ---------- */
  var spiel = null;
  var ziele = $$('[data-a],.odo,.zt,.roll'), spaet = doc.documentElement.getAttribute('data-herein') === 'spaet';
  function zeig(el) {
    el.classList.add('da');
    if (el.classList.contains('odo')) rolle(el);
  }
  var drifter = [], imBild = [];
  if (!('IntersectionObserver' in window) || ruhig) ziele.forEach(zeig);
  else {
    // Hereinkommen wird über mehrere Bilder verteilt, damit nie ein ganzer Schwung auf einmal rechnet
    var warte = [], dran = 0;
    function nimm() { dran = 0; for (var k = 0; k < 4 && warte.length; k++) zeig(warte.shift()); if (warte.length) dran = requestAnimationFrame(nimm); }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { warte.push(e.target); io.unobserve(e.target); } }); if (warte.length && !dran) dran = requestAnimationFrame(nimm); }, spaet ? { rootMargin: '0px 0px -9% 0px', threshold: 0.06 } : { rootMargin: '0px 0px 14% 0px', threshold: 0 });   // 14 % Vorlauf statt 9 % Verzug: alles ist da, bevor man es sieht (Robert 10.10.2026); <html data-herein="spaet">: sichtbar hereinkommen wie bei Salt & Silver (Grand Beau-Rivage 12.10.2026)
    ziele.forEach(function (z) { io.observe(z); });
    var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('sichtbar', e.isIntersecting); }); }, { rootMargin: '10% 0px' });
    $$('[data-lauf]').forEach(function (z) { io2.observe(z); });
    var io3 = new IntersectionObserver(function (es) { es.forEach(function (e) { var i = imBild.indexOf(e.target); if (e.isIntersecting && i < 0) imBild.push(e.target); if (!e.isIntersecting && i >= 0) imBild.splice(i, 1); }); }, { rootMargin: '15% 0px' });
    drifter = $$('[data-drift],[data-zug]');
    if (!ruhig) drifter.forEach(function (d) { io3.observe(d); });
  }

  /* ---------- Bilder: drei Bildschirme voraus holen, in Reihenfolge, bis zu sechs auf einmal; jedes Foto blendet ein, sobald es da ist (Robert 10.10.2026: «die Bilder laden erst so spät») ---------- */
  (function () {
    var alle = $$('img.ld'), faul = alle.filter(function (im) { return im.getAttribute('loading') === 'lazy'; });
    function fertig(im) { if (im.__d) return; im.__d = 1; im.classList.add('da'); }
    alle.forEach(function (im) { if (im.complete && im.naturalWidth) fertig(im); else { im.addEventListener('load', function () { fertig(im); }, { once: true }); im.addEventListener('error', function () { fertig(im); }, { once: true }); } });
    if (!('IntersectionObserver' in window)) { faul.forEach(function (im) { im.loading = 'eager'; }); return; }
    var GLEICH = 6, laeuft = 0, warte = [];
    function hole(im) {
      if (im.__h) return; im.__h = 1;
      if (im.complete && im.naturalWidth) return;
      laeuft++;
      var f = function () { if (im.__f) return; im.__f = 1; laeuft--; weiter(); };
      im.addEventListener('load', f, { once: true }); im.addEventListener('error', f, { once: true }); setTimeout(f, 9000);
      im.loading = 'eager';
    }
    function weiter() { while (laeuft < GLEICH && warte.length) hole(warte.shift()); }
    var nah = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        nah.unobserve(e.target);
        if (e.target.getBoundingClientRect().top < innerHeight * 1.4) hole(e.target); else { warte.push(e.target); weiter(); }
      });
    }, { rootMargin: '300% 0px 300% 0px' });
    faul.forEach(function (im) { nah.observe(im); });
  })();

  /* ---------- Ein Takt für Leiste, Fortschritt, Treiben und Laufzeilen ---------- */
  var linie = $('.gang-linie'), links = $$('.insel nav a'), abschn = links.map(function (a) { return $(a.getAttribute('href')); }), takt = 0, breit = innerWidth > 900, anAlt = -2;
  var leiste = $('.leiste'), yAlt = scrollY, richt = 0, anker = yAlt;
  function lauf() {
    takt = 0;
    var y = scrollY, vh = innerHeight, h = doc.documentElement.scrollHeight - vh;
    /* Leiste weg beim Runterscrollen, zurück beim Hochscrollen, wie auf der Website (Robert 12.10.2026).
       Gezählt wird der Weg seit dem letzten Richtungswechsel, damit kleine Scrollschritte bei 120 Bildern/s nicht verloren gehen. */
    if (leiste) {
      if ((y - yAlt) * richt < 0 || (!richt && y !== yAlt)) { richt = y > yAlt ? 1 : -1; anker = yAlt; }
      if (y < 140 || leiste.querySelector('[aria-expanded="true"]')) leiste.classList.remove('weg');
      else if (richt > 0 && y - anker > 24) leiste.classList.add('weg');
      else if (richt < 0 && anker - y > 24) leiste.classList.remove('weg');
      yAlt = y;
    }
    if (linie) linie.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    var an = -1;
    abschn.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * 0.42) an = i; });
    if (an !== anAlt) { links.forEach(function (a, i) { a.classList.toggle('an', i === an); }); anAlt = an; }
    /* Abstand zur Bildmitte, begrenzt auf den Bereich, in dem das Element im Bild sein kann. Ohne Grenze blieb nach einem Sprung über die
       ganze Seite (Anker, Seitenanfang) ein Element um Tausende px verschoben liegen: der Takt lief noch mit der alten Liste, bevor der
       Beobachter es abmeldete, und danach fasste es niemand mehr an (GBR 12.10.2026, Polaroid über «Ein Feed»). */
    var werte = imBild.map(function (el) { var r = el.getBoundingClientRect(), g = vh * 0.65 + r.height / 2 + 40; return Math.max(-g, Math.min(g, r.top + r.height / 2 - vh / 2)); }); // erst alles lesen, dann alles schreiben
    imBild.forEach(function (el, i) {
      if (el.hasAttribute('data-zug')) el.style.transform = 'translate3d(' + (werte[i] * +el.getAttribute('data-zug')).toFixed(1) + 'px,0,0)';
      else if (breit) el.style.translate = '0 ' + (werte[i] * +el.getAttribute('data-drift')).toFixed(1) + 'px';
    });
  }
  addEventListener('scroll', function () { if (!takt) takt = requestAnimationFrame(lauf); }, { passive: true });
  addEventListener('resize', function () { breit = innerWidth > 900; lauf(); });
  lauf(); setTimeout(lauf, 400);

  /* ---------- Bänder zum Blättern ---------- */
  $$('.gang').forEach(function (g) {
    var band = $('.band', g), balken = $('.gang__b i', g), zahl = $('.gang__z', g), vor = $('[data-vor]', g), zur = $('[data-zur]', g), t = 0;
    function stand() {
      t = 0;
      var max = band.scrollWidth - band.clientWidth, k = [].slice.call(band.children), x = band.scrollLeft;
      if (balken) balken.style.transform = 'scaleX(' + Math.max(0.08, max > 0 ? x / max : 1) + ')';
      var nr = 1; k.forEach(function (el, i) { if (el.offsetLeft - band.offsetLeft - 60 <= x) nr = i + 1; });
      if (max > 0 && x >= max - 2) nr = k.length;
      if (zahl) zahl.textContent = ('0' + nr).slice(-2) + ' / ' + ('0' + k.length).slice(-2);
      if (zur) zur.disabled = x <= 2;
      if (vor) vor.disabled = x >= max - 2;
    }
    function schritt(r) { var k = band.children[0]; if (!k) return; band.scrollBy({ left: r * (k.offsetWidth + parseFloat(getComputedStyle(band).columnGap || 20)), behavior: ruhig ? 'auto' : 'smooth' }); }
    band.addEventListener('scroll', function () { if (!t) t = requestAnimationFrame(stand); }, { passive: true });
    if (vor) vor.addEventListener('click', function () { schritt(1); });
    if (zur) zur.addEventListener('click', function () { schritt(-1); });
    stand(); addEventListener('resize', stand);
  });

  /* ---------- Vorher / Nachher ---------- */
  $$('.vgl').forEach(function (v) {
    var inp = $('input', v);
    inp.addEventListener('input', function () { v.style.setProperty('--x', inp.value + '%'); });
  });
  /* Vorher / Nachher je Seite: Knöpfe schalten die Seite um (Robert 11.10.2026) */
  $$('.vh-wahl').forEach(function (w) {
    var kn = $$('button', w), felder = $$('.vh-feld', w.parentNode);
    kn.forEach(function (b) { b.addEventListener('click', function () {
      var i = +b.dataset.vhZu;
      kn.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      felder.forEach(function (f) { f.hidden = +f.dataset.vh !== i; });
      w.scrollTo({ left: b.offsetLeft - w.clientWidth / 2 + b.offsetWidth / 2, behavior: ruhig ? 'auto' : 'smooth' });
    }); });
  });

  /* ---------- Seiten: Bühne zum Durchklicken ---------- */
  (function () {
    var S = window.SEITEN, schau = $('.schau'); if (!S || !schau) return;
    var buehne = $('.schau__s', schau), tel = $('.schau__r .tel div', schau), adr = $('.fen__k span', schau), pk = $('.schau__pk', schau), zahl = $('.schau__z', schau);
    var titel = $('.schau__t h3', schau), satz = $('.schau__t p', schau), offen = $('.schau__t a', schau), wahl = $$('.wahl button');
    var si = 0, bi = 0, bilder = [], handy = {};
    function img(src, alt) { var i = new Image(); i.decoding = 'async'; i.alt = alt || ''; i.src = src; return i; }
    function zeig(s, b, richtung) {
      var neu = s !== si || !bilder.length; si = s; var d = S[si];
      if (neu) {
        bilder.forEach(function (x) { x.remove(); }); bilder = [];
        for (var k = 0; k < d.n; k++) { var i = img('img/' + d.s + '-' + (k + 1) + '.webp', d.t + ', Ansicht ' + (k + 1)); buehne.appendChild(i); bilder.push(i); }

        titel.textContent = d.t; satz.textContent = d.x; offen.href = '../' + d.d; adr.textContent = 'culinarium / ' + (d.d === 'index.html' ? 'startseite' : d.d.replace('.html', ''));
        wahl.forEach(function (w, k) { w.setAttribute('aria-pressed', k === si); if (k === si) { var kiste = w.parentNode; kiste.scrollTo({ left: w.offsetLeft - kiste.clientWidth / 2 + w.offsetWidth / 2, behavior: ruhig ? 'auto' : 'smooth' }); } });
        pk.innerHTML = ''; for (var p = 0; p < d.n; p++) pk.appendChild(doc.createElement('i'));
        bi = -1;
      }
      var alt = bilder[bi], da = bilder[b];
      buehne.style.setProperty('--von', (richtung < 0 ? -6 : 6) + '%'); buehne.style.setProperty('--nach', (richtung < 0 ? 6 : -6) + '%');
      if (alt && alt !== da) { alt.classList.remove('an'); alt.classList.add('weg'); setTimeout(function () { alt.classList.remove('weg'); }, 700); }
      void da.offsetWidth; da.classList.add('an'); bi = b;
      [].forEach.call(pk.children, function (p, k) { p.classList.toggle('an', k === bi); });
      zahl.textContent = ('0' + (bi + 1)).slice(-2) + ' / ' + ('0' + d.n).slice(-2);
      /* das Telefon daneben zeigt dieselbe Stelle am Handy */
      var hk = si + '-' + bi;
      if (!handy[hk]) { handy[hk] = img('img/' + d.s + '-h' + (bi ? bi + 1 : '') + '.webp', d.t + ' am Handy, Ansicht ' + (bi + 1)); tel.appendChild(handy[hk]); }
      Object.keys(handy).forEach(function (k) { handy[k].classList.toggle('an', k === hk); });
    }
    function weiter(r) {
      var b = bi + r, s = si;
      if (b >= S[si].n) { s = (si + 1) % S.length; b = 0; }
      if (b < 0) { s = (si - 1 + S.length) % S.length; b = S[s].n - 1; }
      if (s !== si) { zeig(s, 0, r); if (b) zeig(s, b, r); } else zeig(s, b, r);
    }
    $('[data-vor]', schau).addEventListener('click', function () { weiter(1); });
    $('[data-zur]', schau).addEventListener('click', function () { weiter(-1); });
    wahl.forEach(function (w, k) { w.addEventListener('click', function () { zeig(k, 0, k < si ? -1 : 1); }); });
    schau.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') weiter(1); if (e.key === 'ArrowLeft') weiter(-1); });
    var x0 = null;
    buehne.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    buehne.addEventListener('pointerup', function (e) { if (x0 !== null && Math.abs(e.clientX - x0) > 40) weiter(e.clientX < x0 ? 1 : -1); x0 = null; });
    var los = false;
    function start() { if (los) return; los = true; zeig(0, 0, 1); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { start(); o.disconnect(); } }, { rootMargin: '60% 0px' }).observe(schau); else start();
  })();

  /* ---------- Gefüge: Kacheln, Linien, Wege, Rundgang (leichter Aufbau wie bei Salt & Silver, 10.10.2026: Kacheln nur hoch + aufblenden, Linien als vier Ebenen je Spaltenpaar, kein Nachzeichnen, Start erst bei 30 % sichtbar) ---------- */
  var B = window.GEFUEGE, brett = $('#brett');
  if (B && brett) (function () {
    var NS = 'http://www.w3.org/2000/svg', nodes = $('#brett-n'), nach = {}, kanten = [], gewaehlt = null, rund = null;
    var klar = !!B.klar; if (klar) brett.classList.add('brett--klar');
    /* still: Linien nur für die gewählte Kachel, sonst ein ruhiges Raster; zwischen den Spaltenköpfen ein Pfeil (Robert 11.10.2026: «wirrwarr Pfeile, da blickt kein Schwein durch») */
    if (B.still) {
      brett.classList.add('brett--still');
      var bk = brett.parentNode.querySelector('.brett-k');
      if (bk) B.fx.forEach(function (fx, i) { if (!i) return; var a = doc.createElement('em'); a.className = 'brett-k__pf'; a.style.left = ((B.fx[i - 1] + fx) / 2 * 100).toFixed(1) + '%'; a.textContent = '→'; bk.appendChild(a); });
    }   // klar: flache Kacheln, weiche Linien, Zeilen frei setzbar (auch halbe)
    var panel = $('.brett-p'), pk = $('#bp-k'), pt = $('#bp-t'), pp = $('#bp-p'), pw = $('#bp-w'), uhr = $('.brett-uhr'), kRund = $('#brett-rund'), kNoch = $('#brett-noch'), kopf = $$('.brett-k span');
    var altSvg = brett.querySelector('svg:not(.bs)'); if (altSvg) altSvg.parentNode.removeChild(altSvg);
    /* vier Linien-Ebenen, je Spaltenpaar eine: beim Aufbau blendet jede als Ganzes auf, statt jede Linie Bild für Bild nachzuzeichnen */
    var lagen = [0, 1, 2, 3].map(function () { var s = doc.createElementNS(NS, 'svg'); s.setAttribute('class', 'bs'); s.setAttribute('aria-hidden', 'true'); brett.insertBefore(s, nodes); return s; });
    B.n.forEach(function (n, nr) {
      var o = { id: n[0], sp: n[1], z: n[2], titel: n[3], unter: n[4], art: n[5], lang: n[6], text: n[7], blatt: n[8] || [] };
      var d = doc.createElement('div'); d.className = 'bn' + (o.art ? ' bn--' + o.art : '');
      var b = doc.createElement('button'); b.type = 'button';
      var hd = doc.createElement('span'); hd.className = 'hd'; hd.innerHTML = '<b></b><small></small>'; hd.firstChild.textContent = o.titel; hd.lastChild.textContent = o.unter; b.appendChild(hd);
      if (o.blatt.length) { var lv = doc.createElement('span'); lv.className = 'lv'; o.blatt.forEach(function (t) { var s = doc.createElement('span'); s.textContent = t; lv.appendChild(s); }); b.appendChild(lv); }
      d.appendChild(b); nodes.appendChild(d); o.el = d; d.__id = o.id; nach[o.id] = o;
      b.addEventListener('click', function () { halt(); waehle(gewaehlt === o.id ? null : o.id); });
      /* Drüberfahren zeigt den Weg auch dann, wenn eine Kachel angeklickt ist; beim Verlassen kommt die angeklickte zurück (Robert 14.10.2026) */
      if (fein) { b.addEventListener('pointerenter', function () { if (!rund && o.id !== gewaehlt) waehle(o.id, false, true); }); b.addEventListener('pointerleave', function () { if (brett.dataset.schau === o.id) waehle(gewaehlt); }); }
    });
    function ordne() {
      var W = brett.clientWidth, zeilen = 0, hoch = [];
      B.n.forEach(function (n) { zeilen = Math.max(zeilen, n[2] + 1); hoch[n[2]] = Math.max(hoch[n[2]] || 0, nach[n[0]].el.offsetHeight); });
      var y = 44, oben = [], H;
      if (klar) {
        var kh = Math.max.apply(null, hoch.filter(Boolean)), tief = 0, schritt = kh + 24;
        B.n.forEach(function (n) { tief = Math.max(tief, n[2]); });
        oben = { }; B.n.forEach(function (n) { oben[n[2]] = 34 + n[2] * schritt; });
        H = 34 + tief * schritt + kh + 34;
      } else {
        for (var z = 0; z < zeilen; z++) { oben[z] = y; y += hoch[z] + 40; }
        H = y + 4;
      }
      brett.style.height = H + 'px'; lagen.forEach(function (s) { s.setAttribute('viewBox', '0 0 ' + W + ' ' + H); });
      B.n.forEach(function (n) {
        var o = nach[n[0]];
        o.x = W * B.fx[o.sp]; o.oben = oben[o.z]; o.hb = o.el.offsetWidth / 2; o.h = o.el.offsetHeight; o.y = o.oben + Math.min(34, o.h / 2);
        o.el.style.left = o.x + 'px'; o.el.style.top = o.oben + 'px';
      });
    }
    function weg(a, b, nr) {
      if (a.sp === b.sp) { var u = a.z < b.z; return { d: 'M' + a.x + ' ' + (u ? a.oben + a.h : a.oben) + ' V' + (u ? b.oben - 6 : b.oben + b.h + 6), ex: a.x, ey: u ? b.oben - 6 : b.oben + b.h + 6, w: u ? 90 : -90 }; }
      var r = b.x > a.x ? 1 : -1, x1 = a.x + r * a.hb, x2 = b.x - r * (b.hb + 7), mx = (x1 + x2) / 2 + ((nr % 5) - 2) * 10, rad = Math.min(14, Math.abs(b.y - a.y) / 2);
      if (B.gerade && Math.abs(b.sp - a.sp) > 1) mx = x2 - r * (26 + (nr % 3) * 8);   /* über mehrere Spalten: senkrecht erst in der Lücke vor dem Ziel, nie quer durch eine Kachelspalte */
      if (Math.abs(b.y - a.y) < 2) return { d: 'M' + x1 + ' ' + a.y + ' H' + x2, ex: x2, ey: b.y, w: r > 0 ? 0 : 180 };
      if (klar && !B.gerade) { var zug = (x2 - x1) * 0.5;   /* gerade: rechtwinklig wie Salt & Silver (Robert 11.10.2026) */ return { d: 'M' + x1 + ' ' + a.y + ' C' + (x1 + zug) + ' ' + a.y + ' ' + (x2 - zug) + ' ' + b.y + ' ' + x2 + ' ' + b.y, ex: x2, ey: b.y, w: r > 0 ? 0 : 180 }; }
      var s = b.y > a.y ? 1 : -1;
      return { d: 'M' + x1 + ' ' + a.y + ' H' + (mx - r * rad) + ' Q' + mx + ' ' + a.y + ' ' + mx + ' ' + (a.y + s * rad) + ' V' + (b.y - s * rad) + ' Q' + mx + ' ' + b.y + ' ' + (mx + r * rad) + ' ' + b.y + ' H' + x2, ex: x2, ey: b.y, w: r > 0 ? 0 : 180 };
    }
    function zeichne() {
      ordne(); lagen.forEach(function (s) { s.textContent = ''; });
      kanten = B.k.map(function (k, i) {
        var a = nach[k[0]], b = nach[k[1]], w = weg(a, b, i), svg = lagen[Math.min(a.sp, b.sp)];
        var p = doc.createElementNS(NS, 'path'); p.setAttribute('d', w.d); p.setAttribute('class', 'bl'); svg.appendChild(p);
        var kopf = doc.createElementNS(NS, 'path'); kopf.setAttribute('d', 'M-7,-4.5 L0,0 L-7,4.5'); kopf.setAttribute('class', 'bk');
        kopf.setAttribute('transform', 'translate(' + w.ex + ',' + w.ey + ') rotate(' + w.w + ')'); svg.appendChild(kopf);
        return { von: k[0], nach: k[1], p: p, kopf: kopf };
      });
      if (gewaehlt) waehle(gewaehlt, true);
    }
    function kette(id) {
      var drin = {}; drin[id] = 1;
      (function vor(x) { kanten.forEach(function (k) { if (k.von === x && !drin[k.nach]) { drin[k.nach] = 1; vor(k.nach); } }); })(id);
      (function zur(x) { kanten.forEach(function (k) { if (k.nach === x && !drin[k.von]) { drin[k.von] = 1; zur(k.von); } }); })(id);
      return drin;
    }
    function waehle(id, still, nurSchau) {
      if (!nurSchau) gewaehlt = id;
      brett.dataset.schau = nurSchau && id ? id : '';
      brett.classList.toggle('leise', !!id);
      var drin = id ? kette(id) : {};
      B.n.forEach(function (n) { var o = nach[n[0]]; o.el.classList.toggle('heiss', !!drin[o.id]); o.el.classList.toggle('gewaehlt', o.id === id && !nurSchau); });
      kanten.forEach(function (k) { var h = !!(drin[k.von] && drin[k.nach]); k.p.classList.toggle('heiss', h); k.kopf.classList.toggle('heiss', h); });
      if (still) return;
      panel.classList.add('neu'); void panel.offsetWidth;
      if (!id) { pk.textContent = B.start[0]; pt.textContent = B.start[1]; pp.textContent = B.start[2]; pw.textContent = ''; kopf.forEach(function (s) { s.style.color = ''; }); }
      else {
        var o = nach[id];
        pk.textContent = B.sp[o.sp]; pt.textContent = o.lang; pp.textContent = o.text;
        var namen = B.n.filter(function (n) { return drin[n[0]] && n[0] !== id; }).map(function (n) { return n[3]; });
        pw.textContent = namen.length ? 'Verbunden mit: ' + namen.join(' · ') : '';
        kopf.forEach(function (s, i) { s.style.color = i === o.sp ? '#fff' : ''; });
      }
      panel.classList.remove('neu');
    }
    function halt() { if (!rund) return; clearTimeout(rund.t); rund = null; uhr.classList.remove('laeuft'); kRund.firstChild.textContent = 'Rundgang starten'; }
    function rundgang() {
      if (rund) { halt(); waehle(null); return; }
      rund = { i: 0, t: 0 }; kRund.firstChild.textContent = 'Rundgang anhalten';
      (function naechster() {
        if (!rund) return;
        if (rund.i >= B.tour.length) { halt(); waehle(null); return; }
        var id = B.tour[rund.i++], o = nach[id];
        waehle(id);
        var sc = brett.closest('.brett-scroll'); if (sc && sc.scrollWidth > sc.clientWidth) sc.scrollTo({ left: Math.max(0, o.x - sc.clientWidth / 2), behavior: 'smooth' });
        uhr.classList.remove('laeuft'); void uhr.offsetWidth; uhr.style.setProperty('--dauer', '4.2s'); uhr.classList.add('laeuft');
        rund.t = setTimeout(naechster, 4200);
      })();
    }
    /* Maus ruht, Seite scrollt darunter: die Kachel unter dem Zeiger leuchtet auf wie beim Drüberfahren, aber erst, wenn alle Kacheln stehen (Robert 14.10.2026).
       Eigene Prüfung über die letzte Zeigerposition, weil die Browser das Drüberscrollen nicht verlässlich melden und der Zeiger während des Aufbaus gesperrt ist. */
    var zx = -1, zy = -1, zt = 0;
    function unterZeiger() {
      zt = 0;
      if (!fein || zx < 0 || rund || brett.classList.contains('vor') || brett.classList.contains('baut')) return;
      var r = brett.getBoundingClientRect(), id = '';
      if (zy >= r.top && zy <= r.bottom && zx >= r.left && zx <= r.right) { var e = doc.elementFromPoint(zx, zy), bn = e && e.closest ? e.closest('.bn') : null; if (bn && bn.__id) id = bn.__id; }
      if (id && id !== gewaehlt) { if (brett.dataset.schau !== id) waehle(id, false, true); }
      else if (brett.dataset.schau) waehle(gewaehlt);
    }
    if (fein) {
      doc.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { zx = e.clientX; zy = e.clientY; } }, { passive: true });
      doc.documentElement.addEventListener('pointerleave', function () { zx = -1; });
      addEventListener('scroll', function () { if (!zt && zx >= 0) zt = requestAnimationFrame(unterZeiger); }, { passive: true });
    }
    /* Takt des Aufbaus: Abstand je Spalte und je Zeile in Sekunden, Linien danach, Ende in ms. Ein Haus kann ihn in GEFUEGE.takt setzen. */
    var spielT = 0, TK = B.takt || { sp: 0.22, z: 0.05, linie: 0.5, ende: 2400 };
    spiel = function () {
      halt(); waehle(null);
      if (ruhig) { brett.classList.remove('vor'); return; }
      /* ohne Übergang zurück auf Anfang, sonst blenden die Kacheln erst aus und flackern */
      brett.classList.add('kalt', 'vor', 'baut'); void brett.offsetWidth; brett.classList.remove('kalt');
      B.n.forEach(function (n) { nach[n[0]].el.style.transitionDelay = (n[1] * TK.sp + n[2] * TK.z).toFixed(2) + 's'; });
      lagen.forEach(function (s, i) { s.style.transitionDelay = (i * TK.sp + TK.linie).toFixed(2) + 's'; });
      requestAnimationFrame(function () { requestAnimationFrame(function () { brett.classList.remove('vor'); }); });
      clearTimeout(spielT);
      spielT = setTimeout(function () {
        B.n.forEach(function (n) { nach[n[0]].el.style.transitionDelay = ''; });
        lagen.forEach(function (s) { s.style.transitionDelay = ''; });
        brett.classList.remove('baut', 'warm');
        unterZeiger();
      }, TK.ende);
    };
    zeichne(); brett.classList.add('kalt', 'vor'); void brett.offsetWidth; brett.classList.remove('kalt');
    var rt = 0; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(zeichne, 160); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(zeichne);
    kNoch.addEventListener('click', spiel); kRund.addEventListener('click', rundgang);
    if ('IntersectionObserver' in window && !ruhig) {
      new IntersectionObserver(function (es) { if (!es[0].isIntersecting) halt(); }).observe(brett);
      /* die Ebenen der Kacheln entstehen schon, wenn das Brett noch unter dem Bildrand liegt (warm), sonst stockt das erste Bild des Aufbaus */
      new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); brett.classList.add('warm'); } }, { rootMargin: '0px 0px 90% 0px' }).observe(brett);
      /* aufgebaut wird erst, wenn ein gutes Stück des Bretts im Bild ist, nicht schon am unteren Rand */
      new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); spiel(); } }, { threshold: 0.3 }).observe(brett);
    } else spiel();
  })();
})();


/* ---------- Studio: kurze Filme, Schritt für Schritt (Vorlage Salt & Silver, 08.10.2026) ---------- */
(function () {
  'use strict';
  var doc = document, ruhig = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var $ = function (s, e) { return (e || doc).querySelector(s); }, $$ = function (s, e) { return [].slice.call((e || doc).querySelectorAll(s)); };
  var st = $('.studio');
  var knoepfe = st ? $$('.schritt', st) : [], video = st && $('video', st), adr = st && $('.fen__k span', st), nochmal = st && $('[data-nochmal]', st);
  var n = -1, sichtbar = false, hand = false;
  if (st && knoepfe.length && video) (function () {
  function setz(i, spielen) {
    n = (i + knoepfe.length) % knoepfe.length;
    knoepfe.forEach(function (k, j) { k.setAttribute('aria-pressed', j === n); k.style.setProperty('--f', 0); });
    var k = knoepfe[n];
    video.poster = k.getAttribute('data-bild'); video.src = k.getAttribute('data-film'); adr.textContent = k.getAttribute('data-adr');
    if (spielen && !ruhig) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    if (hand && innerWidth < 1100) k.parentNode.scrollTo({ left: k.offsetLeft - 20, behavior: 'smooth' });
  }
  knoepfe.forEach(function (k, i) { k.addEventListener('click', function () { hand = true; setz(i, true); }); });
  video.addEventListener('timeupdate', function () { if (video.duration) knoepfe[n].style.setProperty('--f', (video.currentTime / video.duration).toFixed(3)); });
  video.addEventListener('ended', function () { knoepfe[n].style.setProperty('--f', 1); setTimeout(function () { if (sichtbar && !doc.body.classList.contains('kino-offen')) setz(n + 1, true); }, 900); });
  if (nochmal) nochmal.addEventListener('click', function () { video.currentTime = 0; video.play(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
    sichtbar = es[0].isIntersecting;
    if (sichtbar) { if (n < 0) setz(0, true); else if (!ruhig) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } } else if (n >= 0) video.pause();
  }, { threshold: 0.35 }).observe($('.kino', st)); else setz(0, false);
  window.__setz = setz;
  })();
  var setz = window.__setz || function () {};
  $$('.kino [data-nochmal]').forEach(function (b) { if (st && b.closest('.studio')) return; b.addEventListener('click', function () { var v = b.closest('.kino').querySelector('video'); if (v) { v.currentTime = 0; v.play(); } }); });

  /* Kino: Ein Klick macht das Fenster gross und den Rest dunkel, ein weiterer Klick hält an (nur transform, nativer Scroll bleibt) */
  var dunkel = doc.createElement('div'); dunkel.className = 'kinodunkel'; doc.body.appendChild(dunkel);
  var offen = null, lauf = false;
  function gross(k) {
    if (offen === k || lauf) return;
    var v = k.querySelector('video'), vor = k.getBoundingClientRect();
    var platz = doc.createElement('div'); platz.className = 'kinoplatz'; platz.style.height = vor.height + 'px'; platz.style.width = vor.width + 'px';
    k.parentNode.insertBefore(platz, k); k.__platz = platz;
    k.classList.add('kino--gross'); doc.body.classList.add('kino-offen'); dunkel.classList.add('an');
    var nach = k.getBoundingClientRect(), sx = vor.width / nach.width, sy = vor.height / nach.height;
    k.style.transformOrigin = '0 0'; k.style.transition = 'none';
    k.style.transform = 'translate(' + (vor.left - nach.left) + 'px,' + (vor.top - nach.top) + 'px) scale(' + sx + ',' + sy + ')';
    offen = k; lauf = true;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      k.style.transition = ruhig ? 'none' : 'transform .7s cubic-bezier(.16,1,.3,1)'; k.style.transform = 'translate(-50%,-50%)';
      setTimeout(function () { lauf = false; }, ruhig ? 0 : 720);
    }); });
    if (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  }
  function klein(k, sofort) {
    if (offen !== k) return;
    var v = k.querySelector('video'), platz = k.__platz;
    offen = null;
    if (v && !v.paused) v.pause();
    dunkel.classList.remove('an'); doc.body.classList.remove('kino-offen');
    var vor = k.getBoundingClientRect(), ziel = platz.getBoundingClientRect(), sx = ziel.width / vor.width, sy = ziel.height / vor.height;
    k.style.transition = (ruhig || sofort) ? 'none' : 'transform .6s cubic-bezier(.16,1,.3,1)';
    k.style.transform = 'translate(calc(-50% + ' + (ziel.left - vor.left) + 'px),calc(-50% + ' + (ziel.top - vor.top) + 'px)) scale(' + sx + ',' + sy + ')';
    var fertig = function () { k.style.transition = 'none'; k.style.transform = ''; k.classList.remove('kino--gross'); if (platz.parentNode) platz.parentNode.removeChild(platz); k.__platz = null; };
    if (ruhig || sofort) fertig(); else setTimeout(fertig, 620);
  }
  function zu() { if (!offen) return; var v = offen.querySelector('video'); if (v && !v.paused) v.pause(); else klein(offen); }
  doc.addEventListener('click', function (e) {
    var ziel = e.target.closest('.kino__s'); if (!ziel) return;
    var k = ziel.closest('.kino'), v = k && k.querySelector('video'); if (!k || !v) return;
    e.preventDefault();
    if (offen === k) { zu(); return; }
    if (!v.getAttribute('src') && knoepfe[Math.max(n, 0)]) setz(Math.max(n, 0), false);
    gross(k);
  });
  doc.addEventListener('pause', function (e) { var k = e.target.closest && e.target.closest('.kino'); if (k) { k.classList.remove('kino--laeuft'); if (offen === k) klein(k); } }, true);
  doc.addEventListener('ended', function (e) { var k = e.target.closest && e.target.closest('.kino'); if (k && offen === k) klein(k); }, true);
  doc.addEventListener('play', function (e) { var k = e.target.closest && e.target.closest('.kino'); if (k) k.classList.add('kino--laeuft'); }, true);
  dunkel.addEventListener('click', zu);
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(); });
  addEventListener('resize', function () { if (offen && !lauf) { var k = offen; klein(k, true); gross(k); } });
})();
