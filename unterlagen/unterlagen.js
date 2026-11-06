/* Unterlagen: eine wählen, Seite für Seite blättern, heutige Fassung und Idee nebeneinander. Am Handy schaltet man zwischen beiden um. */
(function () {
  'use strict';
  var U = window.UNTERLAGEN, doc = document, schau = doc.querySelector('.uschau'); if (!U || !schau) return;
  var ruhig = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var wahl = [].slice.call(doc.querySelectorAll('.uwahl button')), alt = schau.querySelector('.ublatt--alt .ublatt__b'), neu = schau.querySelector('.ublatt--neu .ublatt__b');
  var h3 = schau.querySelector('.ufuss h3'), zeile = schau.querySelector('.ufuss p'), pdf = schau.querySelector('[data-pdf]'), vor = schau.querySelector('[data-vor]'), zur = schau.querySelector('[data-zur]');
  var di = 0, si = 0;
  function setz(kiste, d, r) {
    var a = kiste.querySelector('img.an'), i = new Image();
    i.decoding = 'async'; i.alt = ''; i.width = d[1]; i.height = d[2]; i.src = 'img/' + d[0];
    kiste.style.aspectRatio = d[1] + ' / ' + d[2];
    i.style.setProperty('--von', (r < 0 ? -5 : 5) + '%');
    kiste.appendChild(i);
    var zeig = function () { requestAnimationFrame(function () { i.classList.add('an'); if (a) { a.classList.remove('an'); a.classList.add('weg'); setTimeout(function () { a.remove(); }, 700); } }); };
    if (i.decode) i.decode().then(zeig, zeig); else zeig();
  }
  function zeig(d, s, r) {
    di = d; si = s; var x = U[di], n = x.neu.length;
    /* altmap: je neuer Seite die Seite des Originals, aus der ihr erster Posten stammt (wenn die Idee weniger Seiten hat) */
    var ai = x.altmap ? Math.min(x.altmap[si] - 1, x.alt.length - 1) : Math.min(si, x.alt.length - 1);
    setz(alt, x.alt[ai], r); setz(neu, x.neu[si], r);
    h3.textContent = x.name; zeile.textContent = x.gruppe + ' · Seite ' + (si + 1) + ' von ' + n;
    pdf.href = 'pdf/' + x.id + '.pdf';
    var pf = schau.querySelector('[data-pflege]'); if (pf) pf.href = pf.href.split('#')[0] + '#' + x.id;   // Mission Control öffnet dieselbe Karte
    wahl.forEach(function (w, k) { w.setAttribute('aria-pressed', k === di); });
    zur.disabled = di === 0 && si === 0; vor.disabled = di === U.length - 1 && si === n - 1;
    /* die nächste Seite schon holen */
    var nx = x.neu[si + 1]; if (nx) { new Image().src = 'img/' + nx[0]; var na = x.alt[x.altmap ? x.altmap[si + 1] - 1 : si + 1]; if (na) new Image().src = 'img/' + na[0]; }
  }
  function weiter(r) {
    var s = si + r, d = di;
    if (s >= U[di].neu.length) { if (di === U.length - 1) return; d = di + 1; s = 0; }
    if (s < 0) { if (di === 0) return; d = di - 1; s = U[d].neu.length - 1; }
    zeig(d, s, r);
  }
  vor.addEventListener('click', function () { weiter(1); }); zur.addEventListener('click', function () { weiter(-1); });
  wahl.forEach(function (w, k) { w.addEventListener('click', function () { zeig(k, 0, k < di ? -1 : 1); }); });
  schau.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') weiter(1); if (e.key === 'ArrowLeft') weiter(-1); });
  var x0 = null, paar = schau.querySelector('.upaar');
  paar.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
  paar.addEventListener('pointerup', function (e) { if (x0 !== null && Math.abs(e.clientX - x0) > 50) weiter(e.clientX < x0 ? 1 : -1); x0 = null; });
  [].forEach.call(schau.querySelectorAll('.uschalter button'), function (b) {
    b.addEventListener('click', function () { schau.dataset.s = b.dataset.s; [].forEach.call(schau.querySelectorAll('.uschalter button'), function (c) { c.setAttribute('aria-pressed', c === b); }); });
  });
  schau.dataset.s = 'neu';
  var start = 0, hash = location.hash.slice(1);
  U.forEach(function (x, k) { if (x.id === hash) start = k; });
  zeig(start, 0, 1);
  if (start) setTimeout(function () { doc.getElementById('blaettern').scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth' }); }, 300);
})();
