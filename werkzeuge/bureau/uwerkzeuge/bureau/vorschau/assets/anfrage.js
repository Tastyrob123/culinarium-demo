/* Anfragen an das Team · Culinarium Hannover (29.10.2026, Anschluss ans Gästebuch; Muster: _werkzeuge/reception/baustein/anfrage.js).
   Drei Wege, eine Karte im Kleid von «Platz buchen»:
     Warteliste   jeder Link auf …#warteliste (Leiste, «Auf die Warteliste») und #anfrage-warteliste: Abend, Plätze, Name, Kontakt, Anmerkung
     Eigene Feier [data-anfrage=feier], #anfrage-feier: «Die lange Tafel für euch» auf Alle Abende
     Nachricht    [data-anfrage=nachricht], #anfrage-nachricht: «Schreib uns» im Fuss
   Dazu das Ticket auf Der Abend (form.wt-form): es bleibt, wie es ist; der Abriss löst sich erst, wenn der Eintrag angenommen ist.
   Alles geht an /api/anfrage (Vercel-Funktion, privater Speicher), von dort holt das Gästebuch (La Réception) die Einträge ab.
   Kommt nichts an: freundliche Meldung mit Telefon der Bar und Instagram, die Eingaben bleiben stehen. Nie mailto.
     Gutschein    [data-anfrage=gutschein], #anfrage-gutschein: «Einen Abend verschenken» im Fuss (ohne Bezahlung, das Team meldet sich)
   Gäste-Chat: runder Knopf unten rechts «Frag uns zum Abend» (#anfrage-chat). Antworten von /api/frage: nur belegte Sätze aus dem Wissen des Gästebuchs,
   mit Schlüssel serverseitig die KI mit denselben Leitplanken. Weiss er etwas nicht, gibt die Karte die Frage ans Team (/api/anfrage, Art Nachricht). */
(function () {
  'use strict';
  var D = document, skript = D.currentScript;
  var API = (skript && skript.getAttribute('data-api')) || '/api/anfrage';
  var V = ((skript && skript.src.match(/[?&]v=([\w.]+)/)) || [])[1] || '';
  var WEGE = 'Telefon der Bar +49 163 3909578 oder eine Nachricht an @culinarium_hannover auf Instagram';
  var PFEIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var KONTAKT = /^(?:[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}|\+?[\d\s\/().-]{7,24})$/;
  var TAG = { fr: ['Freitag', 'ab 19:00'], sa: ['Samstag', 'ab 17:00'], egal: ['Freitag oder Samstag', 'beides geht'] };
  var ARTEN = {
    warteliste: { kicker: 'Warteliste', titel: 'Dein Platz an der Tafel.', text: 'Trag dich ein: Sobald der nächste Termin feststeht, erfährst du es vor allen anderen.',
      felder: ['tag', 'plaetze', 'name', 'kontakt', 'anmerkung'], knopf: 'Auf die Warteliste', notiz: 'Ein Anlass, eine Unverträglichkeit, ein Wunsch an die Küche',
      ok: 'Vorgemerkt', danke: 'Dein Platz auf der Warteliste ist vorgemerkt. Steht der nächste Abend, erfährst du es vor allen anderen.' },
    feier: { kicker: 'Eigene Feier', titel: 'Die lange Tafel für euch.', text: 'Die lange Tafel im Walk on the Wild Side gibt es auch für eure eigene Feier. Erzählt uns, was ihr vorhabt.',
      felder: ['wunsch', 'gaeste', 'name', 'kontakt', 'anmerkung'], knopf: 'Anfrage senden', notiz: 'Der Anlass, was euch wichtig ist',
      ok: 'Angefragt', danke: 'Eure Anfrage liegt beim Team. Wir lesen sie in Ruhe und melden uns persönlich bei dir.' },
    nachricht: { kicker: 'Schreib uns', titel: 'Schreib uns.', text: 'Eine Frage zum Abend, ein Wunsch, ein Gruß an Momo und Rudi.',
      felder: ['name', 'kontakt', 'nachricht'], knopf: 'Nachricht senden', ok: 'Angekommen', danke: 'Deine Nachricht liegt beim Team. Wir melden uns persönlich bei dir.' },
    gutschein: { kicker: 'Gutschein', titel: 'Einen Abend verschenken.', text: 'Ein Abend an der langen Tafel als Geschenk: drei Gänge von Rudi, fünf Drinks von Momo. Sag uns, für wen und für wie viele, wir melden uns persönlich bei dir.',
      felder: ['bild', 'personen', 'fuer', 'weg', 'name', 'kontakt', 'anmerkung'], knopf: 'Gutschein anfragen', notiz: 'Ein Gruß, der mit auf den Gutschein soll',
      ok: 'Angefragt', danke: 'Deine Anfrage für den Gutschein liegt beim Team. Wir melden uns persönlich bei dir, mit allem Weiteren.' }
  };
  var WEG = { karte: ['Als Karte', 'zum Überreichen'], pdf: ['Als PDF', 'per E-Mail'] };
  var GRENZEN = { plaetze: [1, 6], gaeste: [2, 60], personen: [1, 6] };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ki = function (s) { return esc(s).replace(/i/g, '<em class="ki">i</em>'); };   // das i der Wortmarke, wie in jedem Knopf der Seite
  var seiteName = function () { var t = (D.title || '').split(/ · | \| | — /)[0].trim(); return /^Culinarium/.test(t) ? 'Startseite' : t; };
  var probe = function () { return /[?&]probe=1\b/.test(location.search); };

  /* ---------- Senden: an die Funktion, Antwort lesen, Fehler in einem Satz für den Gast */
  function senden(koerper) {
    koerper.seite_name = seiteName(); koerper.sprache = (D.documentElement.lang || 'de').slice(0, 2);
    if (probe()) koerper.probe = true;
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(koerper) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) { if (!x.ok || !x.j.ok) throw new Error(String((x.j && x.j.fehler) || '').replace(/^[A-ZÄÖÜ-]+ · /, '')); return x.j; });
  }
  function fehlerText(e) {
    var m = e && e.message && !/fetch|network|load|json/i.test(e.message) ? e.message : 'Gerade kommt deine Nachricht nicht bei uns an. Deine Angaben bleiben stehen.';
    return m + ' Versuch es gleich noch einmal, oder melde dich direkt: ' + WEGE + '.';
  }
  function fehlerZeigen(el, e) {   // in der Karte: Telefon und Instagram zum Antippen, und die Meldung ins Bild rücken
    el.hidden = false;
    el.innerHTML = esc(fehlerText(e)).replace('+49 163 3909578', '<a href="tel:+491633909578">+49 163 3909578</a>')
      .replace('@culinarium_hannover', '<a href="https://www.instagram.com/culinarium_hannover/" rel="noopener" target="_blank">@culinarium_hannover</a>');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /* ---------- Die Karte */
  var dlg, karte, vorher, art, st;
  function feldHtml(f, a) {
    if (f === 'tag') return '<fieldset class="af-feld"><legend class="af-label">Welcher Abend?</legend><div class="wt-wahl" role="radiogroup">' +
      ['fr', 'sa', 'egal'].map(function (k, i) { return '<label><input type="radio" name="tag" value="' + k + '"' + (i ? '' : ' checked') + '><span><b>' + (k === 'egal' ? 'Egal' : TAG[k][0]) + '</b><em>' + TAG[k][1] + '</em></span></label>'; }).join('') + '</div></fieldset>';
    if (f === 'bild') return '<figure class="af-bild"><img src="assets/gutschein/vorn.webp?v=' + esc(V) + '" width="1000" height="472" alt="Der Gutschein: Rudis Plakat und «Ein Abend an der langen Tafel»" decoding="async"></figure>';
    if (f === 'fuer') return '<label class="af-feld"><span class="af-label">Für wen ist der Abend?<small>wenn du magst</small></span><input name="fuer" maxlength="120" placeholder="Name der beschenkten Person"></label>';
    if (f === 'weg') return '<fieldset class="af-feld"><legend class="af-label">Wie soll er ankommen?</legend><div class="wt-wahl af-zwei-wahl" role="radiogroup">' +
      ['karte', 'pdf'].map(function (k, i) { return '<label><input type="radio" name="weg" value="' + k + '"' + (i ? '' : ' checked') + '><span><b>' + WEG[k][0] + '</b><em>' + WEG[k][1] + '</em></span></label>'; }).join('') + '</div></fieldset>';
    if (f === 'plaetze' || f === 'gaeste' || f === 'personen') return '<div class="af-feld"><span class="af-label">' + ({ plaetze: 'Wie viele Plätze?', gaeste: 'Wie viele seid ihr?', personen: 'Für wie viele Personen?' })[f] + '</span>' +
      '<div class="af-zaehler" data-feld="' + f + '"><button type="button" data-plus="-1" aria-label="Weniger"></button><output aria-live="polite"></output><button type="button" data-plus="1" aria-label="Mehr"></button></div></div>';
    if (f === 'wunsch') return '<label class="af-feld"><span class="af-label">Wann soll es sein?</span><input name="wunsch" maxlength="120" placeholder="Zum Beispiel ein Samstag im Dezember"></label>';
    if (f === 'name') return '<div class="af-zwei"><label class="af-feld"><span class="af-label">Name</span><input name="name" autocomplete="name" maxlength="120" required></label>';
    if (f === 'kontakt') return '<label class="af-feld"><span class="af-label">E-Mail oder Telefon</span><input name="kontakt" autocomplete="email" inputmode="email" maxlength="160" required></label></div>';
    if (f === 'anmerkung') return '<label class="af-feld"><span class="af-label">' + (a === 'feier' ? 'Was habt ihr vor?' : 'Anmerkung') + '<small>wenn du magst</small></span><textarea name="anmerkung" maxlength="1200" placeholder="' + esc(ARTEN[a].notiz) + '"></textarea></label>';
    if (f === 'nachricht') return '<label class="af-feld"><span class="af-label">Deine Nachricht</span><textarea name="nachricht" maxlength="2000" required></textarea></label>';
    return '';
  }
  function bauen() {
    dlg = D.createElement('div'); dlg.className = 'af-dialog'; dlg.hidden = true;
    dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'af-titel');
    dlg.innerHTML = '<div class="af-grund" data-zu></div><div class="af-karte" data-ton="hell"><button class="af-zu" type="button" data-zu aria-label="Schließen"></button><div class="af-innen"></div></div>';
    karte = dlg.querySelector('.af-innen');
    D.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) { if (e.target.closest('[data-zu]')) zu(); });
    D.addEventListener('keydown', function (e) {
      if (dlg.hidden) return;
      if (e.key === 'Escape') { zu(); return; }
      if (e.key === 'Tab') {   // im Dialog bleiben
        var z = [].filter.call(dlg.querySelectorAll('button,input,textarea,a[href]'), function (x) { return !x.disabled && x.offsetParent !== null && x.className !== 'af-falle'; });
        if (!z.length) return;
        if (e.shiftKey && D.activeElement === z[0]) { e.preventDefault(); z[z.length - 1].focus(); }
        else if (!e.shiftKey && D.activeElement === z[z.length - 1]) { e.preventDefault(); z[0].focus(); }
      }
    });
  }
  function auf(a) {
    if (a === 'chat') { chatAuf(); return; }   // der Chat ist das Eckfenster, keine Karte
    if (!dlg) bauen();
    art = ARTEN[a] ? a : 'nachricht';
    var A = ARTEN[art];
    st = { plaetze: 2, gaeste: 12, personen: 2 };
    vorher = D.activeElement;
    karte.innerHTML = '<form class="af-schritt" novalidate data-schritt="1"><p class="af-kicker">' + esc(A.kicker) + '</p>' +
      '<h3 class="af-titel" id="af-titel">' + esc(A.titel) + '</h3><p class="af-text">' + esc(A.text) + '</p>' +
      A.felder.map(function (f) { return feldHtml(f, art); }).join('') +
      '<input class="af-falle" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="af-tat"><button class="knopf" type="submit"><span>' + ki(A.knopf) + '</span><i>' + PFEIL + '</i></button></div>' +
      '<p class="af-fehler" role="alert" hidden></p></form><div class="af-schritt" data-schritt="2" hidden></div>';
    zaehlen();
    var f = karte.querySelector('form');
    f.addEventListener('submit', abschicken);
    f.addEventListener('click', function (e) {
      var b = e.target.closest('[data-plus]'); if (!b) return;
      var z = b.parentNode.dataset.feld, max = GRENZEN[z][1], min = GRENZEN[z][0];
      st[z] = Math.max(min, Math.min(max, st[z] + +b.dataset.plus)); zaehlen();
    });
    oeffnen();
  }
  function oeffnen() {
    dlg.setAttribute('aria-labelledby', 'af-titel');
    D.documentElement.classList.add('af-offen');
    dlg.hidden = false;
    karte.scrollTop = 0;
    var erst = karte.querySelector('input:not(.af-falle):not([type=radio]),textarea');
    setTimeout(function () { if (erst && matchMedia('(min-width:861px)').matches) erst.focus({ preventScroll: true }); else dlg.querySelector('.af-zu').focus({ preventScroll: true }); }, 60);
  }
  function zaehlen() {
    [].forEach.call(karte.querySelectorAll('.af-zaehler'), function (z) {
      var n = st[z.dataset.feld], max = GRENZEN[z.dataset.feld][1], min = GRENZEN[z.dataset.feld][0];
      z.querySelector('output').textContent = n;
      z.querySelector('[data-plus="-1"]').disabled = n <= min; z.querySelector('[data-plus="1"]').disabled = n >= max;
    });
  }
  function zu() {
    if (!dlg || dlg.hidden) return;
    dlg.hidden = true; D.documentElement.classList.remove('af-offen');
    if (/^#anfrage-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    if (vorher && vorher.focus) vorher.focus({ preventScroll: true });
  }
  function wert(f, n) { var e = f.elements.namedItem(n); return e ? String(e.value || '').trim() : ''; }
  function abschicken(e) {
    e.preventDefault();
    var f = e.target, A = ARTEN[art], fehler = f.querySelector('.af-fehler'), knopf = f.querySelector('[type=submit]');
    if (f.dataset.sendet) return;
    var pflicht = ['name', 'kontakt'].concat(art === 'nachricht' ? ['nachricht'] : []), erster = null;
    pflicht.forEach(function (n) {
      var el = f.elements.namedItem(n), v = wert(f, n), gut = !!v && (n !== 'kontakt' || KONTAKT.test(v));
      el.setAttribute('aria-invalid', gut ? 'false' : 'true'); if (!gut && !erster) erster = el;
    });
    if (erster) {
      fehler.hidden = false;
      fehler.textContent = !wert(f, 'name') ? 'Bitte trag deinen Namen ein.' : !wert(f, 'kontakt') ? 'Bitte gib eine E-Mail-Adresse oder Telefonnummer an, damit wir dir antworten können.'
        : !KONTAKT.test(wert(f, 'kontakt')) ? 'Bitte prüf die E-Mail-Adresse oder Telefonnummer.' : 'Bitte schreib uns ein paar Zeilen.';
      erster.focus(); fehler.scrollIntoView({ block: 'nearest' }); return;
    }
    var name = wert(f, 'name'), notiz = wert(f, 'anmerkung'), k = { art: art, formular: 'allgemein', name: name, kontakt: wert(f, 'kontakt'), website: wert(f, 'website'),
      seite: location.pathname + '#anfrage-' + art }, mehr = [];
    if (art === 'warteliste') {
      var r = f.querySelector('[name=tag]:checked'), t = TAG[(r && r.value) || 'fr'];
      k.datum = t[0]; k.uhrzeit = t[1] === 'beides geht' ? '' : t[1]; k.personen = st.plaetze;
      k.anliegen = 'Warteliste: ' + t[0] + ', ' + st.plaetze + (st.plaetze === 1 ? ' Platz' : ' Plätze');
      k.nachricht = ['Tag: ' + t[0] + ', ' + t[1], 'Plätze: ' + st.plaetze].concat(notiz ? ['Anmerkung: ' + notiz] : []).join('\n');
      mehr = [t[0], t[1], st.plaetze + (st.plaetze === 1 ? ' Platz' : ' Plätze')];
    } else if (art === 'feier') {
      var w = wert(f, 'wunsch');
      k.datum = w; k.personen = st.gaeste; k.anliegen = 'Eigene Feier' + (w ? ': ' + w : '') + ', ' + st.gaeste + ' Gäste';
      k.nachricht = ['Wunschtermin: ' + (w || 'noch offen'), 'Gäste: ' + st.gaeste].concat(notiz ? ['Was sie vorhaben: ' + notiz] : []).join('\n');
      mehr = [w || 'Termin nach Absprache', st.gaeste + ' Gäste'];
    } else if (art === 'gutschein') {
      var fuer = wert(f, 'fuer'), wr = f.querySelector('[name=weg]:checked'), wg = WEG[(wr && wr.value) || 'karte'];
      k.personen = st.personen; k.datum = '';
      k.anliegen = 'Gutschein: ' + st.personen + (st.personen === 1 ? ' Person' : ' Personen') + (fuer ? ', für ' + fuer : '') + ', ' + wg[0].toLowerCase();
      k.nachricht = ['Gutschein für einen Abend', 'Personen: ' + st.personen, 'Für: ' + (fuer || 'offen'), 'Ankommen: ' + wg[0] + ' (' + wg[1] + ')'].concat(notiz ? ['Gruß: ' + notiz] : []).join('\n');
      mehr = [st.personen + (st.personen === 1 ? ' Person' : ' Personen')].concat(fuer ? ['für ' + fuer] : []).concat([wg[0]]);
    } else {
      var n = wert(f, 'nachricht');
      k.anliegen = n.slice(0, 200); k.nachricht = n; mehr = [];
    }
    f.dataset.sendet = '1'; knopf.disabled = true; fehler.hidden = true;
    senden(k).then(function () { danke(name, mehr); })
      .catch(function (x) { fehlerZeigen(fehler, x); })
      .then(function () { delete f.dataset.sendet; knopf.disabled = false; });
  }
  function danke(name, mehr) {
    var A = ARTEN[art], s2 = karte.querySelector('[data-schritt="2"]');
    s2.innerHTML = '<p class="af-kicker">' + esc(A.kicker) + '</p>' +
      '<div class="af-ticket"><div class="af-t-marke"><svg class="marke" viewBox="0 0 364.78 40.36" role="img" aria-label="Culinarium"><use href="assets/zeichen/marke.svg?v=' + esc(V) + '#wm"/></svg></div>' +
      '<p class="af-t-zeile">A UNiQUE EXPERiENCE BY MOMO X RUDI</p><p class="af-t-fuer">Für</p><p class="af-t-name">' + esc(name) + '</p>' +
      (mehr.length ? '<p class="af-t-mehr">' + mehr.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') + '</p>' : '') +
      '<p class="af-t-ok"><span>' + esc(A.ok) + '</span><span>Walk on the Wild Side</span></p></div>' +
      '<p class="af-danke" id="af-danke">' + esc(A.danke) + '</p>' +
      '<div class="af-tat"><button class="knopf" type="button" data-zu><span>Fert<em class="ki">i</em>g</span><i>' + PFEIL + '</i></button></div>';
    karte.querySelector('form').hidden = true; s2.hidden = false;
    karte.scrollTop = 0;
    dlg.setAttribute('aria-labelledby', 'af-danke');
    s2.querySelector('[data-zu]').focus({ preventScroll: true });
  }

  /* ---------- Gäste-Chat: Eckfenster unten rechts wie beim Gast-Chat des Grand Beau-Rivage, im Kleid des Culinarium (Robert 29.10.2026:
     «unten rechts elegant edel aufklappend»). Keine Abdunklung, die Seite bleibt bedienbar; am Handy eine Lade von unten mit Griff.
     Antworten nur von /api/frage (belegte Sätze), danach der passende nächste Schritt; Lücken gibt der Gast mit Name und Kontakt ans Team. */
  var C = '<svg viewBox="-0.5 -0.5 39.3 41.36" aria-hidden="true"><path fill="currentColor" d="M27.47 14.81C26.03 14.81 24.74 14.48 23.59 13.83C22.45 13.16 21.38 12.32 20.41 11.31C19.44 10.30 18.54 9.27 17.70 8.20C16.87 7.13 16.04 6.20 15.22 5.41C14.41 4.61 13.57 4.08 12.72 3.83C11.86 3.57 10.95 3.75 9.98 4.38C8.85 5.07 8.26 6.42 8.22 8.41C8.19 10.39 8.64 12.75 9.59 15.48C10.55 18.23 11.92 21.05 13.70 23.97C15.65 27.04 17.67 29.59 19.77 31.59C21.87 33.59 23.85 34.81 25.72 35.23C27.47 35.66 29.06 35.59 30.50 35.03C31.95 34.46 33.23 33.59 34.36 32.41C35.48 31.22 36.39 29.95 37.09 28.58L38.27 29.22C37.21 31.40 35.72 33.34 33.80 35.03C31.88 36.72 29.71 38.03 27.30 38.97C24.89 39.90 22.38 40.36 19.78 40.36C17.05 40.36 14.49 39.84 12.09 38.80C9.71 37.75 7.61 36.30 5.80 34.45C3.99 32.60 2.58 30.46 1.55 28.03C0.52 25.59 0.00 22.98 0.00 20.19C0.00 17.39 0.52 14.77 1.55 12.34C2.58 9.91 3.99 7.77 5.80 5.92C7.61 4.07 9.71 2.63 12.09 1.61C14.49 0.58 17.05 0.06 19.78 0.06C21.26 0.06 22.60 0.29 23.80 0.73C25.00 1.17 26.11 1.70 27.12 2.30C28.13 2.90 29.07 3.43 29.92 3.88C30.77 4.32 31.57 4.55 32.31 4.55C33.75 4.55 34.69 4.17 35.14 3.41C35.59 2.65 35.81 1.62 35.81 0.34L37.09 0.34C37.33 1.94 37.36 3.59 37.19 5.28C37.01 6.97 36.57 8.53 35.88 9.97C35.18 11.41 34.14 12.57 32.78 13.47C31.41 14.37 29.64 14.81 27.47 14.81ZM27.47 14.81"/></svg>';
  var KARTEN = [['Der nächste Abend', 'Termin und Warteliste', 'Wann ist der nächste Abend?'], ['Ein Abend', 'Was er kostet', 'Was kostet ein Abend?'],
    ['Beginn', 'Freitag und Samstag', 'Um wie viel Uhr geht es los?'], ['Der Weg', 'In die Bar in Linden', 'Wo ist das genau?']];
  var SCHRITT = { warteliste: 'Auf die Warteliste', feier: 'Die lange Tafel anfragen', gutschein: 'Einen Abend verschenken', nachricht: 'Dem Team schreiben' };
  var verlauf = [], cc, ccLog, ccKnopf, fussDa = false;
  function chatBauen() {
    // der Knopf des Hauses (Robert 29.10.2026: «mach da einen Button draus und gleiches Verhalten wie Leiste oben»): Text links, Knauf mit dem «C» rechts;
    // offen wird er zum Schliessen. Er geht mit der Leiste oben: verschwindet beim Hinunterscrollen, kommt beim Hinaufscrollen (Klasse «weg» an #leiste)
    /* 30.10.2026 Oberchef: kein «×» auf der Website, auch nicht beim Schliessen; Chat-Kopf und Knauf zeigen den Zurück-Pfeil der Werkzeuge */
    ccKnopf = D.createElement('button'); ccKnopf.type = 'button'; ccKnopf.className = 'knopf cc-knopf'; ccKnopf.setAttribute('aria-expanded', 'false'); ccKnopf.setAttribute('aria-controls', 'cc');
    ccKnopf.innerHTML = '<span class="cc-knopf__t"><b class="cc-knopf__auf">Frag uns zum Abend</b><b class="cc-knopf__zu" aria-hidden="true">Schl<em class="ki">i</em>eßen</b></span>' +
      '<i><span class="cc-knopf__c">' + C + '</span><span class="cc-knopf__x" aria-hidden="true"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg></span></i>';
    cc = D.createElement('section'); cc.className = 'cc'; cc.id = 'cc'; cc.setAttribute('aria-label', 'Frag uns zum Abend'); cc.hidden = true;
    cc.innerHTML = '<button class="cc__griff" type="button" aria-label="Schließen"><i></i></button>' +
      '<header class="cc__kopf"><span class="cc__c">' + C + '</span><div><b>Frag uns zum Abend</b><span>Culinarium · antwortet sofort</span>' +
      '<button class="cc__neu" type="button"><span>Neu beginnen</span></button></div>' +   /* 30.10.2026: unter Titel und Unterzeile, damit beide einzeilig bleiben */
      '<button class="cc__zu" type="button" aria-label="Schließen" title="Schließen"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg></button></header>' +
      '<div class="cc__log" aria-live="polite"></div>' +
      '<form class="cc__feld" novalidate><label><span class="vh">Deine Frage</span><textarea name="frage" rows="1" maxlength="600" placeholder="Deine Frage zum Abend" enterkeyhint="send"></textarea></label>' +
      '<button class="cc__send" type="submit" aria-label="Fragen"><svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></svg></button></form>' +
      '<p class="cc__fuss">Antworten aus der Website des Hauses; verbindlich ist das Team. <a href="datenschutz.html">Datenschutz</a></p>';
    D.body.appendChild(cc); D.body.appendChild(ccKnopf);
    var leiste = D.getElementById('leiste'), unten = D.querySelector('.fu-unten');
    if (leiste && 'MutationObserver' in window) new MutationObserver(knopfMitLeiste).observe(leiste, { attributes: true, attributeFilter: ['class'] });
    // die letzte Zeile des Fusses (Impressum, Datenschutz, Sprache) verdeckt er nie: ist sie im Bild, tritt er zurück wie bei der Leiste
    if (unten && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { fussDa = es[0].isIntersecting; knopfMitLeiste(); }).observe(unten);
    knopfMitLeiste();
    ccLog = cc.querySelector('.cc__log');
    ccKnopf.addEventListener('click', function () { cc.hidden ? chatAuf() : chatZu(); });
    cc.querySelector('.cc__zu').addEventListener('click', chatZu);
    cc.querySelector('.cc__griff').addEventListener('click', chatZu);
    cc.querySelector('.cc__neu').addEventListener('click', function () { verlauf = []; chatStart(); });
    var feld = cc.querySelector('textarea');
    feld.addEventListener('input', function () { feld.style.height = 'auto'; feld.style.height = Math.min(feld.scrollHeight, 120) + 'px'; });
    feld.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); fragen(feld.value); } });
    cc.querySelector('.cc__feld').addEventListener('submit', function (e) { e.preventDefault(); fragen(feld.value); });
    cc.addEventListener('click', function (e) {
      var v = e.target.closest('[data-frage]'); if (v) { fragen(v.getAttribute('data-frage')); return; }
      var s = e.target.closest('[data-anfrage-auf]'); if (s) { if (matchMedia('(max-width:860px)').matches) chatZu(); auf(s.getAttribute('data-anfrage-auf')); }
    });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !cc.hidden && (!dlg || dlg.hidden)) chatZu(); });
    // Lade am Handy: am Griff nach unten ziehen schliesst
    var y0 = null;
    cc.querySelector('.cc__griff').addEventListener('pointerdown', function (e) { y0 = e.clientY; });
    addEventListener('pointerup', function (e) { if (y0 !== null && e.clientY - y0 > 60) chatZu(); y0 = null; });
    chatStart();
  }
  function knopfMitLeiste() {   // offen bleibt der Knopf stehen, er schliesst dann das Fenster
    var l = D.getElementById('leiste');
    ccKnopf.classList.toggle('weg', cc.hidden && (fussDa || (!!l && l.classList.contains('weg'))));
  }
  function chatStart() {
    ccLog.innerHTML = '<div class="cc__start"><span class="cc__start-c">' + C + '</span><h3>Was möchtest du wissen?</h3><p>Zum Abend, zu den Plätzen, zum Weg in die Bar. Was das Haus nicht selbst sagt, gebe ich ans Team.</p>' +
      '<div class="cc__karten">' + KARTEN.map(function (k) { return '<button type="button" data-frage="' + esc(k[2]) + '"><b>' + esc(k[0]) + '</b><span>' + esc(k[1]) + '</span></button>'; }).join('') + '</div></div>';
  }
  function chatAuf() {
    if (!cc) chatBauen();
    cc.hidden = false; void cc.offsetWidth; D.documentElement.classList.add('cc-offen'); ccKnopf.setAttribute('aria-expanded', 'true'); ccKnopf.classList.remove('weg');
    if (matchMedia('(min-width:861px)').matches) setTimeout(function () { cc.querySelector('textarea').focus({ preventScroll: true }); }, 350);
  }
  function chatZu() {
    if (!cc || cc.hidden) return;
    D.documentElement.classList.remove('cc-offen'); ccKnopf.setAttribute('aria-expanded', 'false');
    setTimeout(function () { if (!D.documentElement.classList.contains('cc-offen')) { cc.hidden = true; knopfMitLeiste(); } }, 560);
    if (/^#anfrage-chat$/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    ccKnopf.focus({ preventScroll: true });
  }
  function blase(wer, text) { var p = D.createElement('p'); p.className = 'cc__b cc__b--' + wer; p.textContent = text; ccLog.appendChild(p); return p; }
  function fragen(q) {
    q = String(q || '').trim(); var feld = cc.querySelector('textarea'), knopf = cc.querySelector('.cc__send');
    if (!q || knopf.disabled) return;
    var s = ccLog.querySelector('.cc__start'); if (s) s.remove();
    blase('gast', q); feld.value = ''; feld.style.height = ''; knopf.disabled = true;
    var warte = blase('haus cc__b--denkt', ''); warte.innerHTML = '<i></i><i></i><i></i>';
    ccLog.scrollTop = ccLog.scrollHeight;
    fetch('/api/frage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ frage: q, verlauf: verlauf.slice(-8), sprache: (D.documentElement.lang || 'de').slice(0, 2), probe: probe() || undefined }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.text) throw new Error();
        warte.className = 'cc__b cc__b--haus'; warte.textContent = j.text;
        verlauf.push({ role: 'user', content: q }, { role: 'assistant', content: j.text });
        if (j.aktion === 'weitergeben') weitergeben(warte, q);
        else if (SCHRITT[j.aktion]) warte.insertAdjacentHTML('beforeend', '<button type="button" class="cc__schritt" data-anfrage-auf="' + j.aktion + '">' + esc(SCHRITT[j.aktion]) + '</button>');
      })
      .catch(function () { warte.className = 'cc__b cc__b--haus'; warte.textContent = 'Gerade erreiche ich niemanden. Melde dich direkt: ' + WEGE + '.'; })
      .then(function () { knopf.disabled = false; ccLog.scrollTop = ccLog.scrollHeight; });
  }
  function weitergeben(blaseEl, q) {   // die Frage ans Team: mit Name und Kontakt in den Eingang des Gästebuchs (Art Nachricht)
    [].forEach.call(ccLog.querySelectorAll('.cc__weiter'), function (x) { x.remove(); });   // nur die jüngste Lücke bietet die Weitergabe an
    var f = D.createElement('form'); f.className = 'cc__weiter'; f.noValidate = true;
    f.innerHTML = '<label><span>Name</span><input name="name" autocomplete="name" maxlength="120"></label>' +
      '<label><span>E-Mail oder Telefon</span><input name="kontakt" autocomplete="email" inputmode="email" maxlength="160"></label>' +
      '<input class="af-falle" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button class="cc__schritt" type="submit">Frage ans Team geben</button><p class="af-fehler" role="alert" hidden></p>';
    blaseEl.after(f);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var fe = f.querySelector('.af-fehler'), name = wert(f, 'name'), kon = wert(f, 'kontakt'), kn = f.querySelector('[type=submit]');
      if (!name || !KONTAKT.test(kon)) { fe.hidden = false; fe.textContent = !name ? 'Bitte trag deinen Namen ein.' : 'Bitte gib eine E-Mail-Adresse oder Telefonnummer an, damit wir dir antworten können.'; return; }
      kn.disabled = true;
      senden({ art: 'nachricht', formular: 'allgemein', name: name, kontakt: kon, website: wert(f, 'website'), anliegen: 'Frage aus dem Chat: ' + q.slice(0, 180),
        nachricht: 'Frage aus dem Chat der Website: ' + q, seite: location.pathname + '#anfrage-chat' })
        .then(function () { var p = blase('haus', 'Deine Frage liegt beim Team. Wir melden uns persönlich bei dir.'); f.replaceWith(p); })
        .catch(function (x) { fehlerZeigen(fe, x); })
        .then(function () { kn.disabled = false; ccLog.scrollTop = ccLog.scrollHeight; });
    });
    ccLog.scrollTop = ccLog.scrollHeight;
  }

  /* ---------- Öffnen: Links auf die Warteliste, [data-anfrage], #anfrage-… in der Adresse */
  D.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('[data-anfrage], a[href$="#warteliste"], a[href^="#anfrage-"]');
    if (!a || (dlg && dlg.contains(a))) return;
    e.preventDefault();
    auf(a.getAttribute('data-anfrage') || (/#anfrage-(\w+)/.exec(a.getAttribute('href') || '') || [])[1] || 'warteliste');
  });
  function ausAdresse() { var m = /^#anfrage-(warteliste|feier|nachricht|gutschein|chat)$/.exec(location.hash); if (m) auf(m[1]); }
  addEventListener('hashchange', ausAdresse);

  /* ---------- Das Ticket auf Der Abend: abfangen, ablegen, erst dann löst die Website den Abriss (wie baustein/anfrage.js) */
  function ticketDaten(f) {
    var r = f.querySelector('[name=tag]:checked'), t = TAG[(r && r.value) || 'fr'] || TAG.fr;
    var o = f.querySelector('output[data-feld=n]'), n = o ? String(o.value || o.textContent || '').trim() : '';
    return { art: 'warteliste', formular: 'warteliste', anliegen: 'Warteliste: ' + t[0] + (n ? ', ' + n + (n === '1' ? ' Platz' : ' Plätze') : ''),
      datum: t[0], uhrzeit: t[1] === 'beides geht' ? '' : t[1], personen: n, name: wert(f, 'name'), kontakt: wert(f, 'mail'), website: wert(f, 'website'),
      nachricht: ['Tag: ' + t[0] + ', ' + t[1], 'Plätze: ' + (n || '-')].join('\n'), seite: location.pathname + '#warteliste' };
  }
  D.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.classList || !f.classList.contains('wt-form')) return;
    if (f.dataset.durch) { delete f.dataset.durch; return; }   // angenommen: jetzt löst die Website den Abriss wie bisher
    e.preventDefault(); e.stopImmediatePropagation();
    var fehlt = ['name', 'mail'].some(function (n) { var x = f.elements.namedItem(n); return x && (!x.value.trim() || !x.checkValidity()); });
    if (fehlt) { f.dataset.durch = '1'; f.dispatchEvent(new Event('submit', { cancelable: true })); return; }   // die Website sagt selbst, was fehlt
    if (f.dataset.sendet) return;
    var knopf = f.querySelector('[type=submit]'), meldung = f.querySelector('.wt-meldung');
    f.dataset.sendet = '1'; if (knopf) knopf.disabled = true;
    senden(ticketDaten(f)).then(function () {
      f.dataset.durch = '1'; f.dispatchEvent(new Event('submit', { cancelable: true }));
      var s = f.querySelector('.wt-meldung small'); if (s) s.textContent = 'Dein Eintrag liegt beim Team.';   // statt «Diese Vorschau verschickt noch nichts.»
    }).catch(function (x) { f.classList.remove('fertig'); if (meldung) meldung.textContent = fehlerText(x); })
      .then(function () { delete f.dataset.sendet; if (knopf) knopf.disabled = false; });
  }, true);

  function bereit() {
    [].forEach.call(D.querySelectorAll('form.wt-form'), function (f) {
      if (f.querySelector('[name=website]')) return;
      var i = D.createElement('input'); i.name = 'website'; i.tabIndex = -1; i.autocomplete = 'off'; i.className = 'af-falle'; i.setAttribute('aria-hidden', 'true');
      f.appendChild(i);
    });
    if (!cc) chatBauen();
    ausAdresse();
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', bereit); else bereit();
})();
