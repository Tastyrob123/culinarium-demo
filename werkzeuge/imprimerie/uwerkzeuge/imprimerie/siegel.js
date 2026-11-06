/* Wachssiegel für freigegebene Drucksachen (Robert 16.10.2026: «so siegelmässig, Wachs mit dem Logo drauf, die Schrift dezent, nicht von ganz links
   bis ganz rechts, etwas Kürzeres als ‹Freigegeben›»). Rundes Wachs mit unregelmässigem Rand, eingeprägter Ring, das Zeichen des Hauses in der Mitte
   geprägt (Licht oben links, Schatten unten rechts), ein kurzes Wort klein und gesperrt im Bogen unten. Nur SVG, keine Bilder.
   DSSiegel(zeichen, { wort, farbe, groesse, ohneWort }) → SVG-Text. zeichen = marke.json «zeichen» ({ vb, pfade }). */
(function () {
  'use strict';
  var WACHS = { rot: ['#9b3040', '#7a1f2b', '#4e1019'], navy: ['#3a4366', '#1b2033', '#0f1322'] };
  var n = 0;
  function rand(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function rand2(seed) { var r = rand(seed), p = [], k = 22; for (var i = 0; i < k; i++) { var a = i / k * Math.PI * 2, rr = 47 + r() * 3.2 - (i % 5 === 0 ? 1.8 : 0); p.push([50 + Math.cos(a) * rr, 50 + Math.sin(a) * rr]); }
    var d = 'M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1);
    for (var j = 0; j < k; j++) { var a1 = p[j], b1 = p[(j + 1) % k], m = [(a1[0] + b1[0]) / 2, (a1[1] + b1[1]) / 2]; d += ' Q' + a1[0].toFixed(1) + ' ' + a1[1].toFixed(1) + ' ' + m[0].toFixed(1) + ' ' + m[1].toFixed(1); }
    return d + 'Z'; }
  window.DSSiegel = function (zeichen, o) {
    o = o || {}; var id = 'sg' + (++n), f = WACHS[o.farbe || 'rot'], wort = o.ohneWort ? '' : (o.wort || 'FREI');
    var vb = zeichen && zeichen.vb || [0, 0, 100, 100], zw = o.ohneWort ? 46 : 38, zh = zw * (vb[3] / vb[2]), zx = 50 - zw / 2, zy = (o.ohneWort ? 50 : 45) - zh / 2;
    var pf = zeichen ? zeichen.pfade.map(function (d) { return '<path d="' + d + '"/>'; }).join('') : '';
    var zg = function (dx, dy, fill, op) { return '<svg x="' + (zx + dx).toFixed(2) + '" y="' + (zy + dy).toFixed(2) + '" width="' + zw + '" height="' + zh.toFixed(2) + '" viewBox="' + vb.join(' ') + '"><g fill="' + fill + '" opacity="' + op + '">' + pf + '</g></svg>'; };
    var bogen = wort ? '<path id="' + id + 'b" d="M 21 56 A 29 29 0 0 0 79 56" fill="none"/>'
      + '<text stroke="none" font-weight="400" font-family="Cinzel, DS-kapitale, Georgia, serif" font-size="7.2" letter-spacing="2.2" fill="#f6dccb" fill-opacity=".86" text-anchor="middle"><textPath href="#' + id + 'b" startOffset="50%">' + wort + '</textPath></text>' : '';
    return '<svg class="siegel__svg" viewBox="0 0 100 100" stroke="none" style="fill:none;stroke:none;overflow:visible" width="' + (o.groesse || 76) + '" height="' + (o.groesse || 76) + '" aria-hidden="true">'
      + '<defs><radialGradient id="' + id + 'w" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="' + f[0] + '"/><stop offset=".55" stop-color="' + f[1] + '"/><stop offset="1" stop-color="' + f[2] + '"/></radialGradient>'
      + '<radialGradient id="' + id + 'm" cx="50%" cy="50%" r="50%"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient></defs>'
      + '<path d="' + rand2(o.seed || 7) + '" fill="url(#' + id + 'w)"/>'
      + '<path d="' + rand2(o.seed || 7) + '" fill="url(#' + id + 'm)"/>'
      + '<circle cx="50" cy="50" r="38.5" fill="none" stroke="' + f[2] + '" stroke-opacity=".75" stroke-width="2.2"/>'
      + '<circle cx="50" cy="50.8" r="38.5" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1"/>'
      + '<circle cx="50" cy="50" r="35" fill="' + f[1] + '" fill-opacity=".35"/>'
      + zg(.9, 1.1, f[2], 1) + zg(-.7, -.8, '#ffe3d8', .42) + zg(0, 0, f[1], 1)
      + bogen + '</svg>';
  };
})();
