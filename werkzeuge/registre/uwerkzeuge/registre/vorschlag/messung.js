/* Das Besucherbuch (Le Registre) · Culinarium Hannover: Zählung auf der Website (Tasty Studios 28.10.2026). Quelle dieser Datei; auf der Website liegt sie
   als assets/messung.js, auf jeder Seite vor </body> als <script src="assets/messung.js?v=…" defer></script>, nach culinarium.js (und buchen.js auf «Der Abend»).
   Den Einbau in bau.py (Fuss) und die Prüfung der Website macht der Chat «culinarium-website-pruefung» (Revier website/); hier nur die Quelle.
   Vorbild: messung.js der Taverne zum Schäfli (dort nach Schlössli und Gasterntal, nur gelesen), Ereignisse von Culinarium.

   Je Seite geht eine Zeile an /api/registre (lokal der Server des Besucherbuchs, online die Funktion api/registre.py, gleiche Adresse):
       r1 <seitenaufruf> <datei> <sprache> <geraet> <sekunden> <ereignisse|-> <herkunft|->
   einmal beim Öffnen (0 Sekunden), bei jedem gezählten Klick und beim Verlassen (Sekunden, in denen die Seite sichtbar war).
   Ohne Cookies und ohne Kennung im Gerät: «seitenaufruf» ist eine Zufallsfolge, die nur in dieser Variablen lebt und mit der Seite endet.
   Dass die Seiten eines Besuchs zusammenfinden, Land und Ort bestimmt der Server aus der Verbindung (registre.py); die Adresse speichert er nicht.
   «herkunft» ist nur der Name der Website, von der der Gast kam (zum Beispiel l.instagram.com), nie die ganze Adresse.
   «sprache» ist die Sprache des Browsers (die Website gibt es nur deutsch), sonst «xx».
   Nicht gezählt: automatische Browser (Prüfläufe), Seiten im Rahmen, die Werkzeuge und die Werkbank, Wahl- und Vorschauseiten (*-wahl*.html,
   termine-pflege.html für das Team) und Geräte mit der Marke «culinarium-nicht-zaehlen» im localStorage (das Einzige, was je im Gerät steht).
   Die Formulare der Website (culinarium.js Warteliste, buchen.js Platz buchen) bleiben unberührt: gezählt wird nur, dass etwas geöffnet, begonnen oder
   abgeschickt wurde, nie ein Inhalt (kein Name, keine E-Mail).

   Ereignisse (Schlüssel wie in allen Häusern, Bedeutung bei Culinarium):
     fenster  auf «Der Abend» bei einem Termin «Platz buchen» geöffnet (Knopf [data-buchen], Fenster «Dein Platz an der Tafel»)
     buchung  Platz gebucht: erst wenn das Fenster das Ticket zeigt (Schritt 3 «Bezahlt», buchen.js prüft vorher Name und E-Mail)
     booking  auf die Warteliste gesetzt: erst wenn das Ticket der Warteliste «fertig» ist (culinarium.js «Danke … Du stehst auf der Liste»)
     tisch    Warteliste begonnen: erste Wahl oder Eingabe im Ticket der Warteliste (.wt-form)
     anfrage  Warteliste im Fuss einer Seite abgeschickt (.fu-wl-f mit E-Mail; die Seite geht weiter auf «Der Abend»)
     anruf    Telefonnummer der Bar angeklickt (+49 163 3909578)
     mail     Instagram von Culinarium oder vom Team (Rudi, Momo, Derya) geöffnet; die Website zeigt keine Mail-Adresse
     chat     weiter zur Bar Walk on the Wild Side oder zu Dirty Chicken (Instagram der Bar, Instagram von Dirty Chicken, Website der Bar);
              die Website hat keinen Gäste-Chat, der Schlüssel bleibt wie in den anderen Häusern
     route    Route geöffnet (Karte auf «Der Weg», Google Maps oder Apple Karten) */
(function () {
  'use strict';
  var n = navigator, d = document, w = window;
  if (w.__registre || !n.sendBeacon || n.webdriver || w.self !== w.top) return;
  try { if (w.localStorage.getItem('culinarium-nicht-zaehlen') === '1') return; } catch (e) { /* privat: zählt normal */ }
  var teile = location.pathname.split('/'), datei = teile.pop() || 'index.html';
  if (/^(_werkzeuge|werkzeuge|werkbank|_werkbank|maison|marke|reception|registre|imprimerie|_qa|_sicherung|_alt|_zuschnitt)$/.test(teile[1] || '')) return;   /* Werkzeuge und Werkbank zählen nie */
  if (!/^[a-z0-9-]{1,60}\.html$/.test(datei) || /wahl|^termine-pflege|varianten|^vorschau|^404/.test(datei)) return;
  w.__registre = 1;
  var SPRACHEN = ' de en fr it nl es pt zh ja ko ar ';
  var sp = String(n.language || 'de').slice(0, 2).toLowerCase();
  if (SPRACHEN.indexOf(' ' + sp + ' ') < 0) sp = 'xx';
  var breit = function (px) { return !!(w.matchMedia && w.matchMedia('(max-width:' + px + 'px)').matches); };
  var geraet = breit(700) ? 'handy' : breit(1060) ? 'tablet' : 'rechner';
  var her = '-';
  try { var r = d.referrer ? new URL(d.referrer).hostname.toLowerCase() : ''; if (r && r !== location.hostname && /^[a-z0-9.-]{3,60}$/.test(r)) her = r; } catch (e) {}
  var BAR_TEL = /^tel:\+?(491633909578|01633909578)$/;
  var IG_CUL = /^\/(culinarium_hannover|rudi__san|momo012027|derrisch__)\/?$/, IG_WEITER = /^\/(walkonthewildside_hannover|dirtychicken\.hannover)\/?$/;
  var pv, war, liste, sichtbar, seit, gesendet;
  function neu() {
    pv = (Math.random().toString(36) + '000000').slice(2, 8);
    war = {}; liste = []; sichtbar = 0; gesendet = '';
    seit = d.visibilityState === 'hidden' ? 0 : Date.now();
    sende();
  }
  function sek() { return Math.min(1800, Math.round((sichtbar + (seit ? Date.now() - seit : 0)) / 1000)); }
  function sende() {
    var zeile = 'r1 ' + pv + ' ' + datei + ' ' + sp + ' ' + geraet + ' ' + sek() + ' ' + (liste.length ? liste.join(',') : '-') + ' ' + her;
    if (zeile === gesendet) return;
    gesendet = zeile;
    try { n.sendBeacon('/api/registre', zeile); } catch (e) {}   /* wartet auf keine Antwort */
  }
  function zaehle(was) {
    if (war[was]) return;
    war[was] = 1; liste.push(was);
    sende();
  }
  function weg() { if (seit) { sichtbar += Date.now() - seit; seit = 0; } sende(); }
  neu();
  d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') weg(); else if (!seit) seit = Date.now(); });
  w.addEventListener('pagehide', weg);
  w.addEventListener('pageshow', function (e) { if (e.persisted) neu(); });   /* zurück aus dem Seitenspeicher des Browsers: neuer Aufruf */

  /* Gezählt ist erst, was die Website zeigt (Ticket, «Danke»); nachgesehen wird kurz, höchstens 20 Sekunden. Bleibt es aus (Pflichtfeld leer), zählt nichts. */
  function danach(pruef, was) {
    var bis = Date.now() + 20000;
    (function schau() { if (pruef()) { zaehle(was); return; } if (Date.now() < bis) setTimeout(schau, 250); })();
  }

  /* Warteliste als Ticket auf «Der Abend»: begonnen mit der ersten Wahl oder Eingabe */
  var wl = d.querySelector('.wt-form');
  if (wl) {
    wl.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('button:not([type=submit]),input,select,textarea,label')) zaehle('tisch'); }, true);
    wl.addEventListener('input', function () { zaehle('tisch'); }, true);
  }

  d.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.closest('[data-buchen]')) { zaehle('fenster'); return; }
    if (t.closest('[data-bezahlen]')) {
      var s3 = d.querySelector('#tb-dialog [data-schritt="3"]');
      if (s3) danach(function () { return !s3.hidden; }, 'buchung');
      return;
    }
    var a = t.closest('a[href]'); if (!a) return;
    var h = (a.getAttribute('href') || '').replace(/\s/g, ''), host = (a.hostname || '').toLowerCase(), pfad = a.pathname || '';
    if (/^tel:/i.test(h)) { if (BAR_TEL.test(h)) zaehle('anruf'); }
    else if (/(^|\.)instagram\.com$/.test(host)) { if (IG_CUL.test(pfad)) zaehle('mail'); else if (IG_WEITER.test(pfad)) zaehle('chat'); }
    else if (/walk%20on%20the%20wild%20side|walk-on-the-wild-side|walkonthewildside/i.test(h)) zaehle('chat');
    else if (/(^|\.)google\.[a-z.]+$/.test(host) && /^\/maps/.test(pfad) || /(^|\.)maps\.apple\.com$|(^|\.)goo\.gl$/.test(host)) zaehle('route');
    else if (/^mailto:/i.test(h)) zaehle('mail');
  }, true);

  d.addEventListener('submit', function (e) {
    var fm = e.target; if (!fm || !fm.classList) return;
    if (fm.classList.contains('wt-form')) { zaehle('tisch'); danach(function () { return fm.classList.contains('fertig'); }, 'booking'); return; }
    if (fm.classList.contains('fu-wl-f')) {   /* Fuss: die Website geht gleich weiter auf «Der Abend»; zählt nur mit eingetragener E-Mail */
      var m = fm.elements && fm.elements.namedItem('mail');
      if (m && String(m.value || '').trim()) zaehle('anfrage');
    }
  }, true);
})();
