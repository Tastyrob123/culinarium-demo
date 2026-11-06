/* Rundgang von La Réception · Culinarium Hannover (28.10.2026, Kopie aus der Taverne zum Schäfli), Kopie aus dem Schlössli, dort aus dem Ruedihus; dort übernommen aus La Réception des Carlton-Europe (studio/rundgang.js dort, nur gelesen), dort aus dem Grand Beau-Rivage; Schlüssel des Hauses «rundgang-rh-…». */
/* Kurzer Rundgang beim ersten Öffnen eines Werkzeugs (Robert 16.10.2026: «einmal ganz kurz zeigen, hier kannst du das machen,
   da das, damit man weiss, wo man gelandet ist»). Ein Lichtkegel liegt auf dem echten Bedienelement, daneben eine Karte mit
   zwei, drei Sätzen. Je Werkzeug und Browser einmal; wieder aufrufen über «Kurzer Rundgang» im Rand oder ?rundgang.
   Einbinden: <script src="../assets/js/rundgang.js?v=1" defer data-werkzeug="bureau"></script>
   L’Imprimerie hat ihre eigene Begrüssung mit Führung (fuehrung.js im Drucksachen-Studio) und braucht diese Datei nicht.
   Automatische Prüfungen (navigator.webdriver) und eingebettete Ansichten (Werkbank, Bildschirm-Aufnahmen) sehen nichts. */
(function () {
  var S = document.currentScript, WZ = (S && S.dataset.werkzeug) || '';
  var Q = new URLSearchParams(location.search), ERZWINGEN = Q.has('rundgang');
  if (window.self !== window.top && !ERZWINGEN) return;

  /* ziel: Liste von Wahlorten, der erste sichtbare gilt (Handy hat andere Flächen). */
  var GAENGE = {
    maison: { name: 'Die Stube', schritte: [
      { ziel: ['.m-f5__gruss', '#oben'], oben: true, titel: 'Das ist die Stube',
        text: 'Der Eingang zu allen Werkzeugen des Hauses. Von hier aus pflegst du Website, Karten, Drucksachen, den Chat und die Marke selbst.' },
      { ziel: ['.m-f5__k:first-child .m-f5__t', '.m-f5__k:first-child'], titel: 'Jedes Bild ist ein Werkzeug',
        text: 'Der Schreibtisch, die Tafel, die Werkstatt, die Gäste, das Hausbuch. Darunter steht, was dort gerade ansteht. Ein Klick öffnet es.' },
      { ziel: ['.m-f5__zeile'], titel: 'Heute auf der Website',
        text: 'Wie viele Gäste heute auf der Website waren und wie viele weiter zur Buchung gingen.' },
      { ziel: ['.m-insel', '.m-oben'], oben: true, titel: 'Immer erreichbar',
        text: 'Diese Leiste führt in jedes Werkzeug. Aus jedem Werkzeug kommst du hierher zurück.' },
      { ziel: ['#bureau .m-kopf', '#bureau'], titel: 'Jedes Werkzeug stellt sich vor',
        text: 'Weiter unten zeigt jeder Abschnitt, was ein Werkzeug für das Haus tut, mit Bildern aus dem Werkzeug selbst.' }
    ] },
    bureau: { name: 'Der Schreibtisch', schritte: [
      { ziel: ['#ansicht .titel'], titel: 'Das ist der Schreibtisch',
        text: 'Deine Website zum Selbstpflegen. Texte, Fotos, Preise, Öffnungszeiten, Angebote: alles, was Gäste online sehen, änderst du hier, ohne Agentur und ohne Programmierer.' },
      { ziel: ['#rand .nav', '#rand'], titel: 'Jede Seite deiner Website',
        text: 'Zimmer, Restaurant und Bar, Wellness, Feiern, Angebote, Region: jede Seite einzeln, in allen drei Sprachen.' },
      { ziel: ['#ansicht .aufgaben'], max: 300, titel: 'Was sich im Alltag ändert',
        text: 'Ein neues Package, ein anderer Preis, ein frisches Foto, ein Hinweis für die Festtage. Das ist eine Sache von Minuten, kein Auftrag mehr.' },
      { ziel: ['#leiste'], titel: 'Nichts geht aus Versehen online',
        text: 'Du arbeitest in Ruhe, die Website ändert sich erst, wenn du es willst. Jeder frühere Stand lässt sich zurückholen.' }
    ] },
    carte: { name: 'Die Tafel', schritte: [
      { ziel: ['#kopf'], titel: 'Das ist die Tafel',
        text: 'Die Speise-, Getränke- und Weinkarten des Hauses an einem Ort. Ein neues Gericht, ein anderer Preis, ein Wein ist aus: das änderst du hier selbst.' },
      { ziel: ['#rand .karten', '#rand'], titel: 'Alle Karten des Hauses',
        text: 'Die Restaurants, die Bar, die Weinkarte und das Mittagsmenü, jede Karte für sich.' },
      { ziel: ['#arbeit .vorschau'], min: 560, titel: 'Gedruckt und online aus einer Quelle',
        text: 'Aus jeder Änderung entsteht die neue Karte zum Drucken, und die Restaurant-Seiten der Website stimmen automatisch mit. Nie wieder zwei verschiedene Fassungen.' },
      { ziel: ['#rand .modus'], titel: 'Für jeden im Team',
        text: 'Einfach wie eine Liste, oder frei gestaltet direkt auf der Karte.' }
    ] },
    reception: { name: (window.WO ? WO.name('gaeste') : 'Werkzeug'), schritte: [
      { ziel: ['#ansicht .wo-sb'], titel: 'Das ist ' + (window.WO ? WO.name('gaeste') : 'das Werkzeug').replace(/^Das /, 'das ').replace(/^Der /, 'der ').replace(/^Die /, 'die '),
        text: 'Hier landet, was Gäste über deine Website schreiben: wer auf die Warteliste für den nächsten Abend will, wer einen Platz an der Tafel sucht, wer die lange Tafel für eine eigene Feier möchte. Dazu die Fragen, die Gäste dem Chat auf der Website stellen.' },
      { ziel: ['#ansicht .wo-aufg', '#rand [data-gehe="eingang"]', '#ansicht .re-spalte'], titel: 'Anfragen, die direkt bei dir landen',   /* Tor 3: die Anfragen, nicht die Begrüssung */
        text: 'Jede Anfrage steht hier mit Tag, Plätzen und Wünschen für die Küche, dazu ein Hinweis, wenn der Termin noch offen ist oder mehr Gäste kommen wollen, als die Tafel Plätze hat. Den Brief im Ton deiner Website schreibt der Assistent auf Knopfdruck.' },
      { ziel: ['#rand [data-gehe="gefragt"]', '#rand .wo-rand__g', '#rand'], titel: 'Was Gäste wissen wollen',   /* Tor 3: «Das wurde gefragt» */
        text: 'Alle Fragen an den Chat. Du siehst, was Gäste beschäftigt und wo der Chat noch eine Antwort von dir braucht.' },
      { ziel: ['#k-probe', '#kopf .wo-kopf__r', '#rand [data-probe]'], oben: true, titel: 'Probier es selbst',
        text: 'Der Chat so, wie Gäste ihn auf dem Handy sehen würden.' }
    ] },
    savoir: { name: 'Das weiss der Chat', schritte: [
      { ziel: ['#ansicht .wo-sb'], titel: 'Das Gedächtnis des Chats',
        text: 'Hier steht alles, was der Chat über Culinarium weiss. Er antwortet nur mit dem, was hier steht, und erfindet nichts dazu.' },
      { ziel: ['#w-ein'], titel: 'Neues lernt er von dir',
        text: 'Der Termin des nächsten Abends, ein neues Plakat, ein Dirty-Chicken-Tag: hineinschreiben oder als Link und Datei dazulegen, und der Chat weiss es.' },
      { ziel: ['#ansicht .sb-idx'], titel: 'Geordnet wie das Haus',
        text: 'Der Abend, Tickets, Drinks und Küche, die Bar, der Weg: alles auf einen Blick und jederzeit zu berichtigen.' },
      { ziel: ['#ansicht .wi-probe'], titel: 'Vorher ausprobieren',
        text: 'Frag wie ein Gast und sieh, was der Chat antworten würde.' }
    ] },
    livre: { name: 'Das Hausbuch', schritte: [
      { ziel: ['#ansicht .titel'], titel: 'Das ist das Hausbuch',
        text: 'Die Marke des Hauses zum Arbeiten. Alles, was Team, Agenturen und Druckereien von deinem Haus brauchen, an einem Ort.' },
      { ziel: ['#ansicht .li-karten'], titel: 'Fotos, Logo, Prüfung',
        text: 'Jedes Foto in der richtigen Grösse für Instagram, Website oder Druck, das Logo für jede Fläche und eine Prüfung, ob ein Entwurf zum Haus passt.' },
      { ziel: ['#ansicht .li-buch'], titel: 'Wie das Haus aussieht',
        text: 'Das Markenbuch: Farben, Schriften, Zeichen und warum sie so sind. Zum Nachschlagen und zum Weitergeben.' },
      { ziel: ['#leiste'], titel: 'Weitergeben mit einem Klick',
        text: 'Alle Dateien als ein Paket, die Bildrechte gleich dabei.' }
    ] },
    registre: { name: 'Das Besucherbuch', schritte: [
      { ziel: ['#ansicht .titel'], titel: 'Das ist das Besucherbuch',
        text: 'Hier siehst du, wer deine Website besucht: woher die Gäste kommen, was sie interessiert und wie viele weiter zur Buchung gehen.' },
      { ziel: ['#ansicht .rg-zahlen'], titel: 'Bringt die Website Gäste?',
        text: 'Besuche, Verweildauer und Klicks zur Buchung. So siehst du, ob ein Angebot, eine Aktion oder ein Beitrag Gäste bringt.' },
      { ziel: ['#ansicht .rg-zwei'], titel: 'Woher deine Gäste kommen',
        text: 'Länder und Städte, und welche Seiten am längsten gelesen werden. Gut zu wissen für Werbung, Sprachen und Angebote.' },
      { ziel: ['#ansicht .rg-liste'], titel: 'Jeder Besuch einzeln',
        text: 'Wie sich ein Gast durch die Seiten bewegt hat. Ohne Namen, ohne Cookies.' }
    ] }
  };

  /* La Réception: «Das weiss der Chat» bekommt seinen eigenen Rundgang, sobald man dorthin wechselt. */
  function aktuell() { return WZ === 'reception' && (document.querySelector('#ansicht .wi-oben, #w-ein') || /^#wissen/.test(location.hash)) ? 'savoir' : WZ; }   /* La Réception merkt sich die letzte Ansicht, darum nach dem Inhalt fragen */
  function schluessel(w) { return 'rundgang-rh-' + w; }
  function gesehen(w) { try { return localStorage.getItem(schluessel(w)) === '1'; } catch (e) { return true; } }
  function merk(w) { try { localStorage.setItem(schluessel(w), '1'); } catch (e) { } }

  var CSS = '' +
    '.rdg-kegel{position:fixed;left:0;top:0;z-index:2147483000;border-radius:16px;pointer-events:none;' +
      'box-shadow:0 0 0 3px #f5b49d,0 0 0 9px rgba(245,180,157,.35),0 0 40px 10px rgba(245,180,157,.35),0 0 0 200vmax rgba(13,13,16,.74)}' +
    '.rdg-sperre{position:fixed;inset:0;z-index:2147482999}' +
    '.rdg-karte{position:fixed;left:0;top:0;z-index:2147483001;width:360px;max-width:calc(100vw - 32px);box-sizing:border-box;' +
      'padding:22px 24px 20px;border-radius:18px;color:#1f1d25;background:linear-gradient(180deg,#f9f6f6,#ece7e6);' +
      'box-shadow:0 1px 0 #fff inset,0 0 0 1px rgba(146,73,46,.22),0 30px 60px -24px rgba(13,13,16,.6),0 10px 22px -12px rgba(13,13,16,.4);' +
      'font:15px/1.55 "Instrument Sans",system-ui,sans-serif;animation:rdg-auf .42s cubic-bezier(.2,.8,.2,1) both}' +
    '@keyframes rdg-auf{from{transform:translate3d(var(--rx,0),calc(var(--ry,0px) + 14px),0)}to{transform:translate3d(var(--rx,0),var(--ry,0),0)}}' +
    '.rdg-karte{transform:translate3d(var(--rx,0),var(--ry,0),0)}' +
    '.rdg-zier{display:flex;align-items:center;gap:10px;font:500 10px/1 Open Sans,Georgia,serif;letter-spacing:.2em;text-transform:uppercase;color:#454252}' +
    '.rdg-zier i{flex:1;height:1px;background:linear-gradient(90deg,#f4ab91,rgba(244,171,145,0))}' +
    '.rdg-karte h3{margin:12px 0 6px;font:500 27px/1.12 "Fraunces",Georgia,serif;color:#1f1d25;letter-spacing:0}' +
    '.rdg-karte p{margin:0;color:rgba(19,18,22,.78)}' +
    '.rdg-fuss{display:flex;align-items:center;gap:14px;margin-top:20px}' +
    '.rdg-karte .rdg-weg{display:flex;gap:5px;flex:1 1 auto;min-width:64px}.rdg-karte .rdg-weg b{display:block;height:3px;flex:1 1 0;min-width:6px;max-width:26px;border-radius:2px;background:rgba(31,29,37,.14)}.rdg-karte .rdg-weg b.da{background:#d06138}' +
    '.rdg-karte .rdg-zu{flex:none;margin:0;border:0;background:none;padding:6px 2px;font:500 10px/1 "DM Mono",ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#454252;cursor:pointer}' +
    '.rdg-karte .rdg-zu:hover{color:#1f1d25}' +
    '.rdg-karte .rdg-los{flex:none;margin:0;display:inline-flex;align-items:center;gap:12px;height:42px;padding:0 6px 0 18px;border:0;border-radius:999px;cursor:pointer;' +
      'font:500 10px/1 "DM Mono",ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#e5dedd!important;' +
      'background:linear-gradient(180deg,#34323f,#1f1d25 55%,#131216);box-shadow:0 1px 0 rgba(255,255,255,.18) inset,0 10px 18px -10px rgba(13,13,16,.8)}' +
    '.rdg-karte .rdg-los i{display:grid;margin:0;place-items:center;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#e1d0cd,#f4ab91 55%,#d06138);' +
      'box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 3px 6px -2px rgba(0,0,0,.45)}' +
    '.rdg-karte .rdg-los svg{width:14px;height:14px;fill:none;stroke:#1f1d25;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    '.rdg-karte .rdg-los:hover i{transform:translateX(2px)}.rdg-karte .rdg-los i{transition:transform .2s}' +
    '.rdg-los:focus-visible,.rdg-zu:focus-visible{outline:2px solid #d06138;outline-offset:3px}' +
    /* Werkzeug-Stile (La Carte vergrössert Knöpfe und Schrift) dürfen die Karte nicht verändern */
    '.rdg-karte,.rdg-karte *{box-sizing:border-box!important}' +
    '.rdg-karte p{font:15px/1.55 "Instrument Sans",system-ui,sans-serif!important;letter-spacing:0!important;text-transform:none!important}' +
    '.rdg-karte h3{font:500 27px/1.12 "Fraunces",Georgia,serif!important;letter-spacing:0!important;text-transform:none!important}' +
    '.rdg-karte .rdg-fuss{flex-wrap:nowrap!important}' +
    '.rdg-karte .rdg-zu,.rdg-karte .rdg-los{font:500 10px/1 "DM Mono",ui-monospace,monospace!important;letter-spacing:.14em!important;text-transform:uppercase!important;min-width:0!important;width:auto!important;outline:0;border:0!important;margin:0!important}' +
    '.rdg-karte .rdg-zu{height:auto!important;padding:6px 2px!important;background:none!important;box-shadow:none!important;color:#454252!important}' +
    '.rdg-karte .rdg-los{height:42px!important;padding:0 6px 0 18px!important;letter-spacing:.16em!important;border-radius:999px!important}' +
    '.rdg-karte .rdg-los i{width:30px!important;height:30px!important;flex:none!important}' +
    '@media (max-width:700px){.rdg-karte{left:16px!important;right:16px;top:auto!important;bottom:16px;width:auto;--rx:0!important;--ry:0!important}}' +
    '@media (prefers-reduced-motion:reduce){.rdg-karte{animation:none}}';

  var PFEIL = '<i><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></i>';
  var lauf = null;

  function sichtbar(sel) {
    var e; try { e = document.querySelector(sel); } catch (x) { return null; }
    if (!e) return null;
    var r = e.getBoundingClientRect();
    if (r.width > 4 && r.height > 4) return e;
    return window.WO && WO.randZiel ? WO.randZiel(e) : null;   /* Handy: Ziel im zugeklappten Rand, das Kleid klappt ihn auf (30.10.2026) */
  }
  function finde(liste) { for (var i = 0; i < liste.length; i++) { var e = sichtbar(liste[i]); if (e) return e; } return null; }
  /* Endprüfung 19.10.2026: fehlt das Ziel eines Schritts (andere Ansicht, Handy), erscheint die Karte trotzdem, über dem Arbeitsbereich; kein Schritt wird übersprungen */
  function zielOderFlaeche(liste) { return finde(liste) || finde(['#ansicht', '#arbeit', 'main', '#oben', '#kopf', '.sb', 'body']); }

  function starte(w) {
    var g = GAENGE[w]; if (!g || lauf) return;
    var schritte = g.schritte;                     /* Ziele erst beim Zeigen suchen: Leisten fahren nach dem Laden herein */
    if (!finde(schritte[0].ziel)) return;
    if (!document.getElementById('rdg-css')) { var st = document.createElement('style'); st.id = 'rdg-css'; st.textContent = CSS; document.head.appendChild(st); }
    var sperre = document.createElement('div'); sperre.className = 'rdg-sperre';
    var kegel = document.createElement('div'); kegel.className = 'rdg-kegel';
    var karte = document.createElement('div'); karte.className = 'rdg-karte';
    karte.setAttribute('role', 'dialog'); karte.setAttribute('aria-modal', 'true'); karte.setAttribute('aria-label', 'Kurzer Rundgang ' + g.name);
    document.body.appendChild(sperre); document.body.appendChild(kegel); document.body.appendChild(karte);
    var nr = 0, ziel = null, gerueckt = false;
    lauf = { w: w };

    function lege() {
      if (!ziel || !ziel.isConnected) ziel = zielOderFlaeche(schritte[nr].ziel);
      if (!ziel) return;
      var r = ziel.getBoundingClientRect(), pad = 8, vw = innerWidth, vh = innerHeight;
      var x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad);
      var b = Math.min(vw - 8, r.right + pad) - x, h = Math.min(vh - 8, Math.min(Math.max(r.bottom, r.top + (schritte[nr].min || 0)), r.top + (schritte[nr].max || 1e5)) + pad) - y;   /* max: nur die erste Reihe einer langen Fläche */   /* min: Fläche, die erst nach dem Laden wächst (Kartenvorschau) */
      if (vw <= 700) {   /* Handy (Oberchef 30.10.2026): die Karte überdeckt nie das Markierte; ein Ziel höher als das freie Feld wird bis über die Karte markiert */
        var kt = vh - (parseFloat(getComputedStyle(karte).bottom) || 16) - karte.offsetHeight - 18;
        if (y < kt && y + h > kt) h = Math.max(40, kt - y);
      }
      kegel.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      kegel.style.width = Math.max(0, b) + 'px'; kegel.style.height = Math.max(0, h) + 'px';
      if (vw <= 700) return;
      var kw = karte.offsetWidth, kh = karte.offsetHeight, abst = 22, kx, ky;
      if (x + b + abst + kw <= vw - 16) { kx = x + b + abst; ky = y; }                 /* rechts daneben */
      else if (x - abst - kw >= 16) { kx = x - abst - kw; ky = y; }                     /* links daneben */
      else if (y + h + abst + kh <= vh - 16) { kx = x; ky = y + h + abst; }             /* darunter */
      else if (y - abst - kh >= 16) { kx = x; ky = y - abst - kh; }                     /* darüber */
      else if (!gerueckt && h + abst + kh + 110 < vh) { gerueckt = true; scrollBy({ top: r.top - 96, behavior: 'instant' }); return lege(); }   /* Platz darunter schaffen */
      else { kx = vw - kw - 24; ky = vh - kh - 24; }                                    /* Ziel füllt den Schirm: unten rechts */
      kx = Math.min(Math.max(16, kx), vw - kw - 16); ky = Math.min(Math.max(16, ky), vh - kh - 16);
      karte.style.setProperty('--rx', kx + 'px'); karte.style.setProperty('--ry', ky + 'px');
    }

    function zeige(n, rueck) {
      if (n < 0 || n >= schritte.length) return ende();
      nr = n; gerueckt = false; var s = schritte[n], letzt = n === schritte.length - 1;
      ziel = zielOderFlaeche(s.ziel);
      if (window.WO && WO.randZurueck) WO.randZurueck(ziel);   /* Schritt ausserhalb des Rands: der Rundgang klappt ihn wieder zu */
      if (s.oben) scrollTo({ top: 0, behavior: 'instant' });   /* die Kopfzeile versteckt sich beim Scrollen */
      var r = ziel.getBoundingClientRect();
      if (!s.oben && r.top < 70 || r.bottom > innerHeight - 20) ziel.scrollIntoView({ block: r.height > innerHeight * .7 ? 'start' : 'center', behavior: 'instant' });
      var weg = ''; for (var i = 0; i < schritte.length; i++) weg += '<b' + (i <= n ? ' class="da"' : '') + '></b>';
      karte.innerHTML = '<div class="rdg-zier"><span>' + g.name + ' · ' + (n + 1) + ' von ' + schritte.length + '</span><i></i></div>' +
        '<h3>' + s.titel + '</h3><p>' + s.text + '</p>' +
        '<div class="rdg-fuss"><div class="rdg-weg" aria-hidden="true">' + weg + '</div>' +
        (letzt ? '' : '<button type="button" class="rdg-zu">Überspringen</button>') +
        '<button type="button" class="rdg-los">' + (letzt ? 'Los geht’s' : 'Weiter') + PFEIL + '</button></div>';
      karte.style.animation = 'none'; void karte.offsetWidth; karte.style.animation = '';   /* Karte kommt je Schritt neu herauf, deckend ab dem ersten Bild */
      var handy = function () { if (window.WO && WO.rdgHandy) WO.rdgHandy(ziel, karte); };   /* Handy: Ziel ins freie Feld zwischen Kopf und Karte (30.10.2026) */
      handy(); lege(); setTimeout(function () { handy(); lege(); }, 450);   /* Kopf- und Fussleisten fahren nach dem Scrollen noch herein */
      var zu = karte.querySelector('.rdg-zu'); if (zu) zu.onclick = ende;
      var los = karte.querySelector('.rdg-los'); los.onclick = function () { letzt ? ende() : zeige(n + 1); };
      try { los.focus({ preventScroll: true }); } catch (e) { }
    }

    function taste(e) {
      if (e.key === 'Escape') { e.preventDefault(); ende(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); nr < schritte.length - 1 ? zeige(nr + 1) : ende(); }
      else if (e.key === 'ArrowLeft' && nr > 0) { e.preventDefault(); zeige(nr - 1, true); }
    }
    var takt = 0; function neu() { if (!takt) takt = requestAnimationFrame(function () { takt = 0; lege(); }); }
    /* Der Kegel folgt seinem Ziel, solange es sich noch bewegt oder wächst (Auftritte, nachladende Vorschauen) */
    var zuletzt = '', wacht = setInterval(function () {
      if (!ziel) return; var r = ziel.getBoundingClientRect(), k = [r.left, r.top, r.width, r.height].map(Math.round).join();
      if (k !== zuletzt) { zuletzt = k; neu(); }
    }, 120);
    function ende() {
      if (window.WO && WO.randZurueck) WO.randZurueck(null);
      merk(w); lauf = null;
      removeEventListener('resize', neu); removeEventListener('scroll', neu, true); document.removeEventListener('keydown', taste, true);
      clearInterval(wacht); sperre.remove(); kegel.remove(); karte.remove();
    }
    addEventListener('resize', neu); addEventListener('scroll', neu, true); document.addEventListener('keydown', taste, true);
    zeige(0);
  }

  /* Warten, bis das Werkzeug seine Ansicht gebaut hat (die Seiten zeichnen ihren Inhalt erst nach dem Laden der Daten). */
  function wenn_bereit(w, dann) {
    var g = GAENGE[w], t0 = Date.now();
    (function blick() {
      if (finde(g.schritte[0].ziel) && document.readyState === 'complete') return nach_auftritt(dann);
      if (Date.now() - t0 < 12000) setTimeout(blick, 250);
    })();
  }
  /* Robert 16.10.2026: erst fliegt die Seite edel herein, dann beginnt der Rundgang. Gewartet wird, bis keine
     endliche Animation mehr läuft (Dauerläufer wie Bänder zählen nicht), mindestens 2,5 s, höchstens 6 s, dann noch eine Pause. */
  function nach_auftritt(dann) {
    var t0 = performance.now(), ruhe = 0;
    (function blick() {
      var laeuft = (document.getAnimations ? document.getAnimations() : []).some(function (a) {
        try { return a.playState === 'running' && isFinite(a.effect.getComputedTiming().endTime); } catch (e) { return false; }
      });
      ruhe = laeuft ? 0 : ruhe + 1;
      var seit = performance.now() - t0;
      if ((ruhe >= 3 && seit > 2500) || seit > 6000) return setTimeout(dann, 700);
      setTimeout(blick, 200);
    })();
  }
  /* Robert 16.10.2026 (später): der Rundgang startet nicht mehr von selbst. Stattdessen erscheint auf jeder Seite unten rechts
     ein kleines Schild «Kurzer Rundgang», fünf Sekunden lang (Maus darauf hält es), dann zieht es sich zurück. ?rundgang startet direkt. */
  var angesetzt = {};
  function vielleicht() {
    var w = aktuell();
    if (!GAENGE[w] || lauf || angesetzt[w]) return;   /* je Seitenaufruf und Ansicht einmal */
    if (navigator.webdriver && !ERZWINGEN) return;
    angesetzt[w] = true;
    wenn_bereit(w, function () { if (aktuell() !== w) { angesetzt[w] = false; return; } ERZWINGEN ? starte(w) : schild(w); });
  }

  var SCHILD_CSS = '' +
    '.rdg-schild{position:fixed;right:24px;bottom:24px;z-index:2147482990;display:flex;align-items:center;gap:14px;box-sizing:border-box;' +
      'padding:10px 10px 10px 18px;border-radius:999px;color:#1f1d25;background:linear-gradient(180deg,#f9f6f6,#e5dedd);' +
      'box-shadow:0 1px 0 #fff inset,0 0 0 1px rgba(146,73,46,.28),0 18px 34px -16px rgba(13,13,16,.55),0 6px 14px -8px rgba(13,13,16,.35);' +
      'transform:translate3d(0,0,0);transition:transform .55s cubic-bezier(.2,.8,.2,1);animation:rdg-schild-auf .7s cubic-bezier(.2,.9,.25,1.15) both}' +
    '@keyframes rdg-schild-auf{from{transform:translate3d(0,calc(100% + 40px),0)}to{transform:translate3d(0,0,0)}}' +
    '.rdg-schild.weg{animation:none;transform:translate3d(0,calc(100% + 60px),0)}' +
    '.rdg-schild__t{display:flex;flex-direction:column;gap:4px;line-height:1}' +
    '.rdg-schild__t small{font:500 9px/1 Open Sans,Georgia,serif!important;letter-spacing:.2em!important;text-transform:uppercase;color:#454252}' +
    '.rdg-schild__t b{font:500 19px/1 "Fraunces",Georgia,serif!important;letter-spacing:0!important;color:#1f1d25}' +
    '.rdg-schild .rdg-los{flex:none;margin:0!important;display:inline-flex;align-items:center;gap:10px;height:38px!important;padding:0 5px 0 15px!important;border:0!important;border-radius:999px!important;cursor:pointer;' +
      'font:500 9.5px/1 "DM Mono",ui-monospace,monospace!important;letter-spacing:.16em!important;text-transform:uppercase!important;color:#e5dedd!important;' +
      'background:linear-gradient(180deg,#34323f,#1f1d25 55%,#131216)!important;box-shadow:0 1px 0 rgba(255,255,255,.18) inset,0 8px 16px -10px rgba(13,13,16,.8)!important}' +
    '.rdg-schild .rdg-los i{display:grid;place-items:center;width:28px!important;height:28px!important;border-radius:50%;background:radial-gradient(circle at 35% 30%,#e1d0cd,#f4ab91 55%,#d06138);box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 3px 6px -2px rgba(0,0,0,.45);transition:transform .2s}' +
    '.rdg-schild .rdg-los:hover i{transform:translateX(2px)}' +
    '.rdg-schild .rdg-los svg{width:13px;height:13px;fill:none;stroke:#1f1d25;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    '.rdg-schild__zu{flex:none;width:26px;height:26px;margin:0 2px 0 -4px!important;padding:0!important;border:0!important;border-radius:50%;background:none!important;box-shadow:none!important;cursor:pointer;color:#92492e;font:16px/1 system-ui!important}' +
    '.rdg-schild__zu:hover{color:#1f1d25}' +
    '.rdg-schild__zu{display:grid;place-items:center}.rdg-schild__zu svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}' +
    '@media (max-width:700px){.rdg-schild{right:16px;left:auto}}' +
    '@media (prefers-reduced-motion:reduce){.rdg-schild{animation:none;transition:none}}';

  function schild(w) {
    if (document.querySelector('.rdg-schild')) return;
    if (!document.getElementById('rdg-schild-css')) { var st = document.createElement('style'); st.id = 'rdg-schild-css'; st.textContent = SCHILD_CSS; document.head.appendChild(st); }
    var s = document.createElement('div'); s.className = 'rdg-schild'; s.setAttribute('role', 'status');
    s.innerHTML = '<span class="rdg-schild__t"><small>' + GAENGE[w].name + '</small><b>Kurzer Rundgang</b></span>' +
      '<button type="button" class="rdg-los">Zeigen' + PFEIL + '</button><button type="button" class="rdg-schild__zu" aria-label="Schliessen"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg></button>';
    /* über die Leiste unten (Speichern, Veröffentlichen) setzen, nie darauf */
    /* Schlössli 20.10.2026 (Robert: «der Rundgang-Button rutscht mit nach oben beim Scrollen»): fest über der Leiste unten rechts, einmal gesetzt,
       neu nur bei geänderter Fenstergrösse. Vorher wich es alle 150 ms jedem Knopf darunter aus und wanderte beim Scrollen. */
    function platz() {
      var l = document.querySelector('#leiste'), lr = l && l.getBoundingClientRect(), u = 24;
      if (l && lr && lr.height >= 5) u = Math.max(24, innerHeight - lr.top + 14);
      s.style.bottom = u + 'px';
    }
    document.body.appendChild(s); platz();
    addEventListener('resize', platz); var wache = 0;
    var uhr = 0, ueber = false;
    function weg() { clearTimeout(uhr); clearInterval(wache); s.classList.add('weg'); setTimeout(function () { s.remove(); }, 650); }
    function zaehle() { clearTimeout(uhr); uhr = setTimeout(function () { if (!ueber) weg(); }, 5000); }   /* Gestaltung 28.10.2026: fünf Sekunden, wie Robert 16.10. gesagt hat; vorher zehn, und das Schild lag so lange über Brief und Fusszeile */
    s.addEventListener('mouseenter', function () { ueber = true; clearTimeout(uhr); });
    s.addEventListener('mouseleave', function () { ueber = false; uhr = setTimeout(weg, 2000); });
    s.querySelector('.rdg-los').onclick = function () { weg(); starte(w); };
    s.querySelector('.rdg-schild__zu').onclick = weg;
    zaehle();
  }

  /* «Kurzer Rundgang» als Weg im Rand, damit er sich jederzeit wieder öffnen lässt. */
  function weg_im_rand() {
    var wege = document.querySelector('#rand .wege, .wo-rand__wege');
    if (!wege || wege.querySelector('.rdg-wieder') || [].some.call(wege.querySelectorAll('a,button'), function (x) { return /Kurzer Rundgang/.test(x.textContent); })) return;
    var a = document.createElement('a'); a.href = '#'; a.className = 'rdg-wieder'; a.textContent = 'Kurzer Rundgang';
    a.onclick = function (e) { e.preventDefault(); starte(aktuell()); };
    var vor = wege.querySelector('a, button');
    if (vor && vor.className) a.className += ' ' + vor.className;
    wege.appendChild(a);
  }

  function los() {
    vielleicht();
    var warte = 0;
    if (WZ !== 'maison') new MutationObserver(function () {
      weg_im_rand();
      if (WZ === 'reception' && !warte) warte = setTimeout(function () { warte = 0; vielleicht(); }, 400);   /* Wechsel zu «Das weiss der Chat» */
    }).observe(document.body, { childList: true, subtree: true });
    weg_im_rand();
    if (WZ === 'reception') addEventListener('hashchange', vielleicht);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', los) : los();
  window.rundgang = function (w) { starte(w || aktuell()); };
})();
