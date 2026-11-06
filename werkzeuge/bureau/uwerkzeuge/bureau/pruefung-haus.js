/* pruefung-haus.js · Prüfseite im Rahmen von Culinarium (28.10.2026, aus dem Vorbild Schäfli): Name des Werkzeugs aus der einen Stelle, «Zum Werkzeug» führt in dieses Werkzeug, nicht in den Stamm. */
(function () {
  var z = document.getElementById('wsp-zurueck'); if (z) z.href = '/culinarium-demo/_werkzeuge/bureau/';
  var n = window.WO_HAUS && WO_HAUS.namen && WO_HAUS.namen.website;
  if (n) { document.querySelectorAll('[data-werkzeug]').forEach(function (e) { e.textContent = n; }); document.title = 'Prüfung · ' + n + ' · ' + WO_HAUS.name; }
})();
/* Termine (Culinarium 28.10.2026): eigener Teil der Prüfung (Quelle buchen.js, Speicher, Sicherung) und die Lexikon-Einträge der Stichworte aus
   termine.py und termine-ansicht.js. Das Lexikon des Stamms bleibt unverändert; diese Einträge stehen darunter mit eigener Kennung lex-<stichwort>
   und öffnen sich, wenn «Was tun?» dorthin führt. */
(function () {
  var LEX = [
    { id: 'termine-quelle', titel: 'Die Termine der Website sind nicht lesbar', sehen: 'Die Ansicht «Termine» startet nicht, oder hier steht «Termine der Website» rot.',
      grund: 'Die Termine stehen auf der Website als Liste «BEISPIEL» in website/assets/buchen.js. Die Website wurde umgebaut und die Liste fehlt oder hat eine neue Form.',
      tun: 'Nichts ist verloren: Entwurf und veröffentlichte Termine liegen im Speicher des Werkzeugs. Den Website-Chat bitten, die Liste wieder so zu bauen (website/buchen.py), dann diese Seite neu laden.' },
    { id: 'termine-speicher', titel: 'Der Speicher der Termine ist beschädigt', sehen: 'Meldung «SPEICHER · Die Datei der Termine und ihre Sicherung sind beide unlesbar».',
      grund: 'Die Datei _werkzeuge/bureau/_daten/termine.json und ihre Sicherung termine.json.gut sind beide kaputt (zum Beispiel von Hand geändert).',
      tun: 'Die Website zeigt weiter die Termine, wie sie gebaut ist. Die Datei aus einer Sicherung des Rechners zurückholen oder beide Dateien entfernen: dann gilt wieder der ursprüngliche Stand.' },
    { id: 'termin-datum', titel: 'Diesen Tag gibt es nicht', sehen: 'Meldung «DATUM · Das Datum fehlt oder gibt es nicht», die Karte zeigt «Diesen Tag gibt es nicht».',
      grund: 'Tag und Monat passen nicht zusammen, zum Beispiel der 31. November.', tun: 'Tag, Monat und Jahr neu wählen, dann speichern.' },
    { id: 'termin-zeit', titel: 'Der Beginn ist keine Uhrzeit', sehen: 'Meldung «BEGINN · Bitte die Uhrzeit als Stunden und Minuten».',
      grund: 'Die Uhrzeit kam in einer anderen Form an als 19:00.', tun: 'Beim Abend unter «Beginn» eine Zeit aus der Liste wählen.' },
    { id: 'termin-zahl', titel: 'Preis oder Plätze ohne Zahl', sehen: 'Meldung «ZAHL · Preis und Plätze brauchen eine Zahl».',
      grund: 'Im Feld steht ein Wort oder nichts.', tun: 'Nur Ziffern eintragen, beim Preis mit Komma für die Cent (zum Beispiel 89 oder 89,50).' },
    { id: 'termin-preis', titel: 'Der Preis liegt ausserhalb', sehen: 'Meldung «PREIS · Der Preis liegt zwischen 1 und 999 Euro».',
      grund: 'Der Preis ist 0, negativ, über 999 Euro oder hat mehr als zwei Stellen nach dem Komma.', tun: 'Den Preis pro Person eintragen, wie er auf dem Plakat steht.' },
    { id: 'termin-plaetze', titel: 'Zu wenige oder zu viele Plätze', sehen: 'Meldung «PLÄTZE · Ein Abend hat zwischen 1 und 40 Plätze» oder «Es sind mehr Plätze vergeben, als der Abend hat».',
      grund: 'Die Zahl ist 0, über 40, oder kleiner als die Plätze, die schon vergeben sind.', tun: 'Die Plätze an der Tafel eintragen. Sind schon mehr vergeben, die Zahl nicht darunter setzen.' },
    { id: 'termin-doppelt', titel: 'Zwei Abende zur selben Zeit', sehen: 'Meldung «DOPPELT · Zwei Termine stehen am selben Tag zur selben Zeit».',
      grund: 'Ein Abend wurde zweimal angelegt oder auf den Tag eines anderen verschoben.', tun: 'Bei einem der beiden den Tag oder den Beginn ändern, oder ihn mit «Wieder entfernen» herausnehmen.' },
    { id: 'termin-viele', titel: 'Zu viele Termine', sehen: 'Meldung «TERMINE · Höchstens 40 Termine stehen gleichzeitig auf der Website».',
      grund: 'Die Seite «Der Abend» zeigt jeden Termin als Plakat; mehr als 40 machen sie unlesbar.', tun: 'Vergangene Abende «Von der Seite nehmen», dann speichern.' },
    { id: 'termin-falsch', titel: 'Ein Termin ist unvollständig', sehen: 'Meldung «TERMIN · …» mit Kennung oder Liste.',
      grund: 'Die Anfrage kam nicht aus dem Werkzeug oder wurde unterwegs verändert.', tun: 'Die Seite neu laden und die Eingabe wiederholen. Bleibt es, den Wortlaut der Meldung deinem Ansprechpartner schicken.' },
    { id: 'fassung-unbekannt', titel: 'Diese frühere Fassung gibt es nicht mehr', sehen: 'Meldung «FASSUNG · Diese frühere Fassung gibt es nicht».',
      grund: 'Die Liste der früheren Fassungen hält die letzten 60; ältere fallen heraus.', tun: 'Die Seite neu laden und eine Fassung aus der Liste wählen, oder den ursprünglichen Stand.' },
    { id: 'netz', titel: 'Der Server antwortet nicht', sehen: 'Meldung «NETZ · Der Server des Werkzeugs antwortet nicht».',
      grund: 'Die Verbindung ist weg oder der Server des Werkzeugs läuft nicht.', tun: 'Deine Eingaben bleiben stehen. Verbindung prüfen, dann noch einmal «Speichern». Läuft der Server nicht: python3 _werkzeuge/bureau/serve.py 9082 im Projektordner.' }
  ];
  function el(tag, attrs, kinder) { var e = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); (kinder || []).forEach(function (k) { e.append(k); }); return e; }
  var lex = document.querySelector('[aria-labelledby="wsp-t4"]');
  if (!lex) return;
  var teil = el('section', { class: 'wsp-teil', 'aria-labelledby': 'wsp-t-termine', 'data-cu-pruefung': 'termine' }, [
    el('div', {}, [el('p', { class: 'kap' }, [el('span', {}, ['Viertens'])]), el('h2', { class: 't-zwischen', id: 'wsp-t-termine' }, ['Termine der Abende'])]),
    el('div', { class: 'platte wsp-punkte', id: 'cu-termine-punkte' }, [el('p', { class: 'wsp-wartet' }, ['Wird geprüft …'])])]);
  lex.parentNode.insertBefore(teil, lex);
  var ort = el('div', { class: 'wsp-lexikon', id: 'cu-lexikon' });
  lex.append(el('p', { class: 'kap', style: 'margin-top:28px' }, [el('span', {}, ['Termine'])]), ort);
  LEX.forEach(function (l) {
    ort.append(el('details', { class: 'platte wsp-lex', id: 'lex-' + l.id }, [el('summary', {}, [l.titel]),
      el('dl', {}, [el('dt', { class: 'angabe' }, ['Sehen']), el('dd', {}, [l.sehen]), el('dt', { class: 'angabe' }, ['Grund']), el('dd', {}, [l.grund]), el('dt', { class: 'angabe' }, ['Tun']), el('dd', {}, [l.tun])])]));
  });
  function oeffne() {
    var e = location.hash.indexOf('#lex-') === 0 && document.getElementById(location.hash.slice(1));
    if (e && ort.contains(e)) { e.open = true; setTimeout(function () { e.scrollIntoView({ block: 'start' }); }, 0); }
  }
  window.addEventListener('hashchange', oeffne); oeffne();
  fetch('/culinarium-demo/_werkzeuge/bureau/api/termine/pruefung', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
    var p = document.getElementById('cu-termine-punkte'); p.textContent = '';
    (d.punkte || []).forEach(function (x) {
      p.append(el('div', { class: 'wsp-punkt', 'data-gut': x.gut ? 'ja' : 'nein', 'data-punkt': 'termine' }, [
        el('span', { class: 'wsp-punkt__z' }, [x.gut ? '✓' : '–']), el('span', { class: 'wsp-punkt__t' }, [x.titel]),
        el('span', { class: 'wsp-punkt__x' }, [x.text + ' ', !x.gut && x.stichwort ? el('a', { href: '#lex-' + x.stichwort }, ['Was tun?']) : ''])]));
    });
  }).catch(function () { var p = document.getElementById('cu-termine-punkte'); p.textContent = 'Der Server des Werkzeugs antwortet nicht (Stichwort netz).'; });
})();
