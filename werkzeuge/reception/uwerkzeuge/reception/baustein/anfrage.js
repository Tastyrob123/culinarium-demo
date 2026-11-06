/* Anschluss der Warteliste der Website an La Réception · Culinarium Hannover (28.10.2026, Master Werkzeug-Bau E12/E24/E33, Muster: Gastgeber der Taverne zum Schäfli).
   Die Website hat ein Formular, das etwas an das Team geben soll: die Warteliste «Dein Platz an der Tafel.» auf Der Abend (form.wt-form in abend.html: Tag Freitag,
   Samstag oder egal, Plätze 1 bis 6, Name, E-Mail). Bisher zeigte sie nur den Abriss «Vorgemerkt» (Vorschau, nichts ging weg). Das Feld «Vormerken» im Fuss
   jeder Seite schickt nichts ab, es trägt nur die E-Mail in die Warteliste auf Der Abend ein (culinarium.js); hier bleibt es unberührt.
   Mit diesem Baustein geht jeder Eintrag in den Eingang von La Réception, mit Tag und Plätzen; erst wenn La Réception ihn angenommen hat, löst sich der Abriss
   wie bisher (das Skript der Website setzt «Danke, … Du stehst auf der Liste»). Geht etwas schief, steht unter dem Ticket eine Meldung mit der Telefonnummer
   der Bar und Instagram, die Eingaben bleiben. Nie mailto, nie ein Mailprogramm.
   Die Skripte der Website (culinarium.js) bleiben unverändert. Der Baustein fängt das Abschicken im Fang-Durchlauf am Dokument ab, bevor die Website den Abriss
   löst, schickt an La Réception und gibt das Abschicken danach an die Website weiter.
   Die gespielte Buchung «Platz buchen» (buchen.js, Zahlung nur simuliert) ist kein Formular des Hauses und bleibt hier draussen.
   Einbinden (Website-Chat über bau.py, nicht von Hand): <script src="assets/anfrage.js?v={V}" defer></script> nach culinarium.js.
   Ziel: /culinarium-demo/_werkzeuge/reception/api/formular (anders mit <script … data-api="http://127.0.0.1:9084/_werkzeuge/reception/api/formular"> oder window.WS_ANFRAGE_API). */
(function () {
  'use strict';
  var D = document, skript = D.currentScript;
  var API = window.WS_ANFRAGE_API || (skript && skript.getAttribute('data-api')) || '/culinarium-demo/_werkzeuge/reception/api/formular';
  var WEGE = 'Telefon der Bar +49 163 3909578 oder eine Nachricht an @culinarium_hannover auf Instagram';
  var TAG = { fr: ['Freitag', 'ab 19:00'], sa: ['Samstag', 'ab 17:00'], egal: ['Freitag oder Samstag', 'beides geht'] };
  var wert = function (f, n) { var e = f.querySelector('[name="' + n + '"]'); return e ? String(e.value || '').trim() : ''; };
  var seiteName = function () { var t = (D.title || '').split(/ · | \| | — /)[0].trim(); return /^Culinarium/.test(t) ? 'Startseite' : t; };

  /* Was die Warteliste mitschickt: dieselben Angaben, die der Gast auf dem Ticket sieht, in Zeilen für das Team */
  function warteliste(f) {
    var r = f.querySelector('[name=tag]:checked'), tag = TAG[(r && r.value) || 'fr'] || TAG.fr;
    var o = f.querySelector('output[data-feld=n]'), n = o ? String(o.value || o.textContent || '').trim() : '';
    return { art: 'warteliste', formular: 'warteliste', anliegen: 'Warteliste: ' + tag[0] + (n ? ', ' + n + (n === '1' ? ' Platz' : ' Plätze') : ''),
      datum: tag[0], uhrzeit: tag[1] === 'beides geht' ? '' : tag[1], personen: n, name: wert(f, 'name'), kontakt: wert(f, 'mail'),
      zeilen: ['Tag: ' + tag[0] + ', ' + tag[1], 'Plätze: ' + (n || '-')] };
  }

  /* Feld, das Menschen nicht sehen: nur Maschinen füllen es aus (La Réception nimmt solche Anfragen still an und legt nichts ab) */
  function falle(f) {
    if (f.querySelector('[name=website]')) return;
    var i = D.createElement('input'); i.type = 'text'; i.name = 'website'; i.tabIndex = -1; i.autocomplete = 'off'; i.setAttribute('aria-hidden', 'true');
    i.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    f.appendChild(i);
  }
  function meldung(f, text) {
    var p = f.querySelector('.wt-meldung');
    if (!p) return;
    f.classList.remove('fertig');
    p.textContent = text;
  }
  function senden(f, d, knopf, fertig) {
    if (f.dataset.sendet) return;
    f.dataset.sendet = '1'; if (knopf) knopf.disabled = true;
    var koerper = { art: d.art, formular: d.formular, name: d.name, kontakt: d.kontakt, datum: d.datum || '', uhrzeit: d.uhrzeit || '', personen: d.personen || '',
      allergene: [], anliegen: d.anliegen, nachricht: d.zeilen.join('\n'), seite: location.pathname + location.search + '#warteliste',
      seite_name: seiteName(), sprache: (D.documentElement.lang || 'de').slice(0, 2), website: wert(f, 'website') };
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(koerper) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (!x.ok) throw new Error(String((x.j && x.j.fehler) || '').replace(/^[A-ZÄÖÜ-]+ · /, '') || 'Dein Eintrag kam nicht an.');
        fertig();
      })
      .catch(function (e) { meldung(f, (e && e.message && !/fetch|network|load/i.test(e.message) ? e.message : 'Dein Eintrag kam nicht an.') + ' Versuch es gleich noch einmal, oder melde dich direkt: ' + WEGE + '.'); })
      .then(function () { delete f.dataset.sendet; if (knopf) knopf.disabled = false; });
  }

  D.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.classList || !f.classList.contains('wt-form')) return;
    if (f.dataset.durch) { delete f.dataset.durch; return; }   // angenommen: jetzt löst die Website den Abriss wie bisher
    e.preventDefault(); e.stopImmediatePropagation();
    var name = f.querySelector('[name=name]'), mail = f.querySelector('[name=mail]');
    var fehlt = [name, mail].filter(function (x) { return x && (!x.value.trim() || !x.checkValidity()); });
    if (fehlt.length) { f.dataset.durch = '1'; f.dispatchEvent(new Event('submit', { cancelable: true })); return; }   // die Website sagt selbst, was fehlt
    senden(f, warteliste(f), f.querySelector('[type=submit]'), function () {
      f.dataset.durch = '1'; f.dispatchEvent(new Event('submit', { cancelable: true }));
      var s = f.querySelector('.wt-meldung small'); if (s) s.textContent = 'Dein Eintrag liegt beim Team.';   // statt «Diese Vorschau verschickt noch nichts.»
    });
  }, true);
  function bereit() { [].forEach.call(D.querySelectorAll('form.wt-form'), falle); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', bereit); else bereit();
})();
