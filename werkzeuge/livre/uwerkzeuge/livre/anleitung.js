/* Anleitung Le Livre · Bild gross: Klick macht das Bild gross, ein zweiter Klick oder Esc schliesst (eigene Datei, keine eingebetteten Skripte, Falle 9). */
'use strict';
(function () {
  var g = document.getElementById('gross'), im = g.querySelector('img');
  function zu() { g.hidden = true; }
  document.addEventListener('click', function (e) { var b = e.target.closest('.bild'); if (b) { im.src = b.querySelector('img').src; im.alt = b.querySelector('img').alt; g.hidden = false; } else if (e.target.closest('#gross')) zu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(); });
})();
