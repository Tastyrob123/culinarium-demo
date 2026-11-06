/* Namen der Werkzeuge aus der einen Stelle (kleid/culinarium.js, WO_HAUS.namen). Dazu der Titel der Seite: «… · Culinarium» mit dem Namen der Pairing-Karte vorn. Jedes Element mit data-wo-name="<schlüssel>"
   bekommt den Namen; im HTML steht derselbe Name als Ersatz, falls das Kleid nicht lädt. data-wo-name-klein setzt den Artikel klein, data-wo-name-ohne lässt ihn weg («zum Kartenpult»). */
(function () {
  var N = (window.WO_HAUS && window.WO_HAUS.namen) || {};
  function setze() {
    [].forEach.call(document.querySelectorAll('[data-wo-name]'), function (el) {
      var n = N[el.getAttribute('data-wo-name')]; if (!n) return;
      if (el.hasAttribute('data-wo-name-ohne')) n = n.replace(/^(Das|Die|Der) /, '');
      else if (el.hasAttribute('data-wo-name-klein')) n = n.charAt(0).toLowerCase() + n.slice(1);
      el.textContent = n;
    });
  }
  if (N.karten) document.title = document.title.replace(/^[^·]+·/, N.karten + ' ·');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setze); else setze();
})();
