/* welt.js · setzt die Welt (Grandhotel oder Landhaus), wechselt sie mit dem Knopf und kennt die Namen.
   Einbinden im <head>, ohne defer, damit die Seite nie in der falschen Welt aufblitzt:
     <script src="/stamm/welt.js" data-haus="gasterntal"></script>

   Reihenfolge, nach der die Welt bestimmt wird:
     1. was der Mensch an diesem Rechner zuletzt gewählt hat
     2. die Welt des Hauses (haeuser/<haus>/haus.json, Feld «welt»)
     3. Grandhotel

   Im HTML:
     <button data-welt-knopf></button>            der Modus-Knopf, Beschriftung kommt von hier
     <span data-werkzeug="website"></span>        wird mit dem Namen der Welt gefüllt (Le Bureau / Der Schreibtisch)
   Im Skript:
     Welt.welt()            'grand' oder 'land'
     Welt.name('karten')    'La Carte' oder 'Die Tafel'
     Welt.wechsle()         zur anderen Welt
     Welt.bei(fn)           fn(welt) läuft bei jedem Wechsel
     Welt.haus              Kennung des Hauses aus data-haus oder ?haus= */
(function () {
  var NAMEN = {
    zentrale: { grand: 'La Maison', land: 'Die Stube', tut: 'Zentrale' },
    website: { grand: 'Le Bureau', land: 'Der Schreibtisch', tut: 'Website pflegen' },
    karten: { grand: 'La Carte', land: 'Die Tafel', tut: 'Karten und Preislisten' },
    druck: { grand: 'L’Imprimerie', land: 'Die Werkstatt', tut: 'Drucksachen und Beiträge' },
    gaeste: { grand: 'La Réception', land: 'Der Gastgeber', tut: 'Gästen antworten' },
    marke: { grand: 'Le Livre', land: 'Das Hausbuch', tut: 'Marke und Bilder' },
    besuche: { grand: 'Le Registre', land: 'Das Besucherbuch', tut: 'Besuche der Website' }
  };
  var WELTEN = { grand: 'Grandhotel', land: 'Landhaus' };
  var skript = document.currentScript;
  var haus = (new URLSearchParams(location.search).get('haus')) || (skript && skript.getAttribute('data-haus')) || '';
  var hoerer = [];
  var welt = 'grand';
  var gewaehlt = false;
  try { var g = localStorage.getItem('werkzeuge-welt'); if (g === 'grand' || g === 'land') { welt = g; gewaehlt = true; } } catch (e) {}
  document.documentElement.setAttribute('data-welt', welt);

  function fuelle() {
    document.documentElement.setAttribute('data-welt', welt);
    var andere = welt === 'grand' ? 'land' : 'grand';
    Array.prototype.forEach.call(document.querySelectorAll('[data-werkzeug]'), function (e) {
      var n = NAMEN[e.getAttribute('data-werkzeug')]; if (n) e.textContent = n[welt];
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-welt-name]'), function (e) { e.textContent = WELTEN[welt]; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-welt-knopf]'), function (k) {
      if (!k.getAttribute('data-bereit')) {
        k.setAttribute('data-bereit', '1');
        k.classList.add('kn', 'kn--d', 'kn--klein');
        k.type = 'button';
        k.innerHTML = '<span></span><i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg></i>';
        k.addEventListener('click', wechsle);
      }
      k.firstChild.textContent = WELTEN[andere];
      k.setAttribute('aria-label', 'Zur Welt ' + WELTEN[andere] + ' wechseln');
    });
    hoerer.forEach(function (fn) { try { fn(welt); } catch (e) { console.error(e); } });
  }
  function setze(w, merken) {
    if (w !== 'grand' && w !== 'land') return;
    welt = w;
    if (merken) { gewaehlt = true; try { localStorage.setItem('werkzeuge-welt', w); } catch (e) {} }
    fuelle();
  }
  function wechsle() { setze(welt === 'grand' ? 'land' : 'grand', true); }

  window.Welt = {
    haus: haus,
    welt: function () { return welt; },
    name: function (schluessel, w) { var n = NAMEN[schluessel]; return n ? n[w || welt] : schluessel; },
    tut: function (schluessel) { var n = NAMEN[schluessel]; return n ? n.tut : ''; },
    namen: NAMEN,
    wechsle: wechsle,
    setze: function (w) { setze(w, true); },
    bei: function (fn) { hoerer.push(fn); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fuelle); else fuelle();
  if (haus && !gewaehlt) {
    fetch('/api/haus/' + encodeURIComponent(haus)).then(function (r) { return r.ok ? r.json() : null; }).then(function (h) {
      if (h && !gewaehlt && (h.welt === 'grand' || h.welt === 'land')) setze(h.welt, false);
    }).catch(function () {});
  }
})();
