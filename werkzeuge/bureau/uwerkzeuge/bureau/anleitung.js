/* anleitung.js · Namen der Werkzeuge aus der einen Stelle (kleid/culinarium.js › WO_HAUS.namen), damit die Anleitung nie einen alten Namen trägt. */
(function () {
  var n = (window.WO_HAUS && WO_HAUS.namen) || {};
  document.querySelectorAll('[data-wo-name]').forEach(function (e) { var k = e.getAttribute('data-wo-name'); if (n[k]) e.textContent = n[k]; });
  if (n.website) document.title = 'Anleitung · ' + n.website + ' · ' + (WO_HAUS.name || '');
})();
