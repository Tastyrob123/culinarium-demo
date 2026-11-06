/* Drucksachen-Studio · Start wie bei Canva (Robert 11.10.2026: «erst gefragt werden, was möchtest du erstellen»).
   Schritt 1: Was möchten Sie erstellen? (Arten mit lebendiger Vorschau im Hausstil, zuletzt bearbeitet)
   Schritt 2: Wie möchten Sie beginnen? Beschreiben (die KI entwirft) · eine Vorlage dieser Art · leeres Blatt. Format wählbar. */
(function () {
  const DS = window.DS;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PFEIL = '<i><svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></i>';

  /* Beispielinhalte je Art im Wortlaut des Culinarium (Website, Beiträge, Karten der Abende;
     Sätze und Zahlen geprüft in _qa/vorlagen_culinarium.py, geschrieben von _qa/culinarium_anpassen.py) */
  const INHALT = {"abendplakat": {"plakat": {"bild": "pl_CyT32RTMB4d", "ueber": "", "ueberfarbe": "weiss", "zeile": "A UNiQUE EXPERiENCE BY MOMO X RUDI", "akzent": "#13606a"}, "plakatrueck": {"grund": "#0d545d", "ueber": "WALK\nON THE\nWILD SIDE", "tag1": "27 / 11 / 26", "zeit1": "19:00 UHR", "text": "3 GÄNGE MENÜ\n5 SiGNATURE DRiNKS", "tag2": "28 / 11 / 26", "zeit2": "17:00 UHR"}}, "plakat": {"plakat": {"bild": "pl_CyT32RTMB4d", "ueber": "", "ueberfarbe": "weiss", "zeile": "A UNiQUE EXPERiENCE BY MOMO X RUDI", "akzent": "#13606a"}, "buehne": {"bild": "tafelleer", "ueber": "Culinarium", "titel": "An der langen Tafel", "text": "Die Abende an der langen Tafel des Walk on the Wild Side: drei Gänge, fünf Drinks, vierzehn Plätze. Und wer dir erklärt, was auf dem Teller und im Glas ist.", "aktion": "Walk on the Wild Side · Haasemannstraße 13"}}, "menuekarte": {"menue": {"titel": "Menü", "ueber": "Fr 21. und Sa 22. Februar 2025", "liste": [{"gang": "Apéritif", "name": "Sauerteig | Tomate | Butter", "detail": "Cognac | Toasted Pumpkin Samen | Limette | Champagner"}, {"gang": "Vorspeise", "name": "Miso | Sellerie | Röstzwiebeln", "detail": "Vodka | Tom Yam | Guava | Cocos | Acids | Soda"}, {"gang": "Hauptgang", "name": "Spinat | braune Butter | Parmesan", "detail": "Tequila | lakto-fermentierte Tomate | Agave | Limette"}, {"gang": "Dessert", "name": "Kaffee | Molke | Amaretto", "detail": "Vodka | Cacao | Matcha | Mango"}, {"gang": "Absacker", "name": "", "detail": "Gin | Turmeric | Ingwer"}], "akzent": "#ef7648", "fuss": "Walk on the Wild Side · Haasemannstraße 13"}, "karte": {"ueber": "Culinarium", "titel": "Vom Pass", "text": "Das Menü wechselt mit jedem Abend. Ein paar Teller und Drinks aus den letzten Ausgaben.", "liste": [{"name": "LAUCH / BLUMENKOHL / CHIPOTLE", "detail": "", "preis": ""}, {"name": "BLUMENKOHL / ROQUEFORT / KAPERN / QUINOA", "detail": "", "preis": ""}, {"name": "HOKKAIDO / KÜRBISKERNÖL / HASELNUSS", "detail": "", "preis": ""}, {"name": "SPAGHETTI-EIS / KIWI / WEISSE SCHOKOLADE", "detail": "", "preis": ""}], "fuss": "Walk on the Wild Side · Haasemannstraße 13"}}, "speisekarte": {"karte": {"ueber": "Culinarium", "titel": "Vom Pass", "text": "Das Menü wechselt mit jedem Abend. Ein paar Teller und Drinks aus den letzten Ausgaben.", "liste": [{"name": "LAUCH / BLUMENKOHL / CHIPOTLE", "detail": "", "preis": ""}, {"name": "BLUMENKOHL / ROQUEFORT / KAPERN / QUINOA", "detail": "", "preis": ""}, {"name": "HOKKAIDO / KÜRBISKERNÖL / HASELNUSS", "detail": "", "preis": ""}, {"name": "SPAGHETTI-EIS / KIWI / WEISSE SCHOKOLADE", "detail": "", "preis": ""}], "fuss": "Walk on the Wild Side · Haasemannstraße 13"}, "deckel": {"ueber": "Culinarium", "titel": "Menü", "unter": "A UNiQUE EXPERiENCE BY MOMO X RUDI"}}, "getraenke": {"karte": {"ueber": "Tasting und Schulung", "titel": "Was im Glas passiert", "text": "Momo erklärt jeden Drink am Tisch: Fatwashing, Milkwashing, Klärung mit Enzymen", "liste": [{"name": "Fatwashing", "detail": "Die Spirituose nimmt den Geschmack eines Fetts an; kalt gestellt, wird das Fett wieder abgehoben.", "preis": ""}, {"name": "Milkwashing", "detail": "Milch bindet die Trübstoffe und wird abgefiltert, der Drink wird klar und weich.", "preis": ""}, {"name": "Klärung mit Enzymen", "detail": "Enzyme lösen die Trübung aus Fruchtsaft, der Geschmack bleibt.", "preis": ""}], "fuss": "Walk on the Wild Side · Haasemannstraße 13"}, "deckel": {"ueber": "Culinarium", "titel": "Signature Drinks", "unter": "A UNiQUE EXPERiENCE BY MOMO X RUDI"}}, "tisch": {"buehne": {"bild": "glas", "ueber": "Signature Drinks", "titel": "Zuerst das Glas", "text": "Die Drinks mixt Momo, hinter der Bar des Hauses. Zum Abend gehören ein Cocktail-Tasting und eine kleine Schulung.", "aktion": "Culinarium"}}, "instagram": {"geteilt": {"bild": "schaumglas", "ueber": "Am Tisch erklärt", "titel": "Fatwashing", "text": "Die Spirituose nimmt den Geschmack eines Fetts an; kalt gestellt, wird das Fett wieder abgehoben.", "aktion": "Culinarium"}}, "tischkarte": {"deckel": {"ueber": "Culinarium", "titel": "Lena Brandt", "unter": "A UNiQUE EXPERiENCE BY MOMO X RUDI", "fuss": ""}}, "hinweiskarte": {"aushang": {"ueber": "Culinarium", "titel": "Tickets im Vorverkauf", "text": "Tickets ausschließlich per Vorverkauf über PayPal. Da die Plätze begrenzt sind, bitten wir um Verständnis, dass Tickets nicht rückerstattet werden können.", "aktion": "@culinarium_hannover"}}, "stoerung": {"aushang": {"ueber": "Culinarium", "titel": "Heute ausgebucht", "text": "Der Abend ist ausgebucht, bevor er beginnt.", "aktion": "@culinarium_hannover"}}, "teamaushang": {"aushang": {"ueber": "Für das Team", "titel": "Ablauf des Abends", "text": "Eindecken bis 18 Uhr, Kerzen an um 18:45, Momo erklärt den ersten Drink um 19:15.", "aktion": "Rudi"}}, "pressemappe": {"deckel": {"ueber": "A UNiQUE EXPERiENCE BY MOMO X RUDI", "titel": "Culinarium", "unter": "Haasemannstraße 13 · 30449 Hannover-Linden", "text": "Food-Pairing-Abende im Walk on the Wild Side in Linden: ein Menü mit fünf passenden Drinks an einer langen Tafel für vierzehn Gäste."}}, "story": {"fenster": {"bild": "klaeren", "ueber": "Tasting und Schulung", "titel": "Was im Glas passiert", "unter": "Culinarium", "text": "Momo erklärt jeden Drink am Tisch: Fatwashing, Milkwashing, Klärung mit Enzymen"}}, "flyer": {"buehne": {"bild": "fassade", "ueber": "Walk on the Wild Side", "titel": "Haasemannstraße 13", "text": "Culinarium ist zu Hause in einer Mixology-Bar in Linden, Haasemannstraße 13. Eine Getränkekarte gibt es dort nicht: Wer an die Theke kommt, erzählt, was er mag.", "aktion": "Haasemannstraße 13 · 30449 Hannover-Linden"}}, "aushang": {"aushang": {"ueber": "Culinarium", "titel": "Auf die Warteliste", "text": "Vierzehn Plätze an einer Tafel, und der letzte Abend war ausgebucht. Trag dich ein: Sobald der nächste Termin feststeht, erfährst du es vor allen anderen.", "aktion": "@culinarium_hannover"}}};
  const ARTEN = [
    { key: 'abendplakat', name: 'Plakat des Abends', satz: 'Jeder Abend sein Plakat: Illustration, Wortmarke, Zeile, Akzentfarbe', format: 'ig11', formate: ['ig11', 'a3h', 'a4h', 'q148', 'story', 'insta'], vorlagen: [['plakat', 'hell'], ['plakatrueck', 'dunkel'], ['plakat', 'dunkel']], beispiel: 'Das Plakat für den nächsten Abend', rueck: 'plakatrueck' },
    { key: 'menuekarte', name: 'Menükarte am Tisch', satz: 'Gang, Teller und Drink des Abends, am Platz', format: 'dlh', formate: ['dlh', 'a5h', 'a4h'], vorlagen: [['menue', 'hell'], ['menue', 'creme'], ['menue', 'dunkel'], ['karte', 'creme']], beispiel: 'Die Menükarte des Abends mit Teller und Drink' },
    { key: 'flyer', name: 'Flyer', satz: 'Zum Mitnehmen an der Bar und am Tisch', format: 'a5h', formate: ['a5h', 'a6h', 'dlh', 'a5q'], vorlagen: [['buehne', 'dunkel'], ['geteilt', 'hell'], ['fenster', 'dunkel'], ['deckel', 'creme'], ['buehne', 'hell'], ['fenster', 'creme']], beispiel: 'Ein Flyer für den nächsten Abend, vorne ein Foto, hinten die Daten', rueck: 'rueckseite' },
    { key: 'plakat', name: 'Plakat zum Aushang', satz: 'Für den Eingang, die Bar und die Wand mit den Plakaten', format: 'a3h', formate: ['a3h', 'a4h'], vorlagen: [['plakat', 'hell'], ['buehne', 'dunkel'], ['fenster', 'dunkel'], ['deckel', 'dunkel'], ['aushang', 'hell'], ['geteilt', 'creme'], ['buehne', 'creme']], beispiel: 'Ein Plakat für den nächsten Abend' },
    { key: 'speisekarte', name: 'Speisekarte', satz: 'Gerichte mit Beschreibung und Preis', format: 'a4h', formate: ['a4h', 'a5h', 'dlh'], vorlagen: [['karte', 'hell'], ['karte', 'dunkel'], ['karte', 'creme'], ['deckel', 'dunkel']], beispiel: 'Die Menükarte des Abends mit Teller und Drink' },
    { key: 'getraenke', name: 'Getränkekarte', satz: 'Cocktails, Weine, Tee und Kaffee', format: 'dlh', formate: ['dlh', 'a5h', 'a4h'], vorlagen: [['karte', 'dunkel'], ['karte', 'hell'], ['karte', 'creme'], ['deckel', 'dunkel']], beispiel: 'Die drei Techniken am Tisch' },
    { key: 'einladung', name: 'Einladung', satz: 'Zum Dinner, zum Fest, zur Hochzeit', format: 'q148', formate: ['q148', 'a5q', 'a6h', 'a5h'], vorlagen: [['einladung', 'hell'], ['einladung', 'dunkel'], ['einladung', 'creme'], ['fenster', 'dunkel'], ['deckel', 'dunkel']], beispiel: 'Eine Einladung an Stammgäste zum nächsten Abend' },
    { key: 'aushang', name: 'Aushang', satz: 'Öffnungszeiten, Hinweise, Hausregeln', format: 'a4h', formate: ['a4h', 'a5h', 'a3h'], vorlagen: [['aushang', 'hell'], ['aushang', 'dunkel'], ['aushang', 'creme'], ['deckel', 'hell']], beispiel: 'Ein Aushang: heute ausgebucht' },
    { key: 'programm', name: 'Programm', satz: 'Termine, Wochenprogramm, Ablauf eines Anlasses', format: 'a5h', formate: ['a5h', 'dlh', 'a4h'], vorlagen: [['programm', 'dunkel'], ['programm', 'hell'], ['programm', 'creme']], beispiel: 'Das Programm des Winters im Haus' },
    { key: 'tisch', name: 'Tischaufsteller', satz: 'Für die Tafel und die Bar', format: 'a6h', formate: ['a6h', 'dlh'], vorlagen: [['buehne', 'dunkel'], ['aushang', 'creme'], ['deckel', 'dunkel'], ['geteilt', 'hell']], beispiel: 'Ein Tischaufsteller zu Momos Signature Drinks' },
    { key: 'instagram', name: 'Instagram-Beitrag', satz: 'Ein Bild im Format 4:5 fürs Handy', format: 'insta', formate: ['insta'], vorlagen: [['geteilt', 'dunkel'], ['buehne', 'dunkel'], ['ansicht', 'dunkel'], ['fenster', 'dunkel'], ['deckel', 'creme']], beispiel: 'Ein Instagram-Beitrag zum nächsten Abend' },
    /* 15 weitere Arten (Robert 12.10.2026: «Fehlende Arten, die ein Hotel braucht»), Vorlagen je Art in haeuser/<haus>/vorlagen/<art>.json */
    { key: 'tischkarte', name: 'Tischkarte', satz: 'Tischnummer, Platzkarte, Reserviert', format: 'a7q', formate: ['a7q', 'a6q'], vorlagen: [['deckel', 'hell'], ['deckel', 'dunkel'], ['aushang', 'creme']], beispiel: 'Platzkarten mit Namen für die Tafel' },
    { key: 'hinweiskarte', name: 'Hinweiskarte', satz: 'Kleine Hinweise am Tisch und an der Bar', format: 'a6h', formate: ['a6h', 'a6q', 'a7q'], vorlagen: [['aushang', 'creme'], ['aushang', 'hell'], ['deckel', 'dunkel'], ['geteilt', 'hell']], beispiel: 'Eine Karte fürs Bad zum Wechsel der Handtücher' },
    { key: 'stoerung', name: 'Störungs-Aushang', satz: 'Ausgebucht, Tafel reserviert, Warteliste', format: 'a4h', formate: ['a4h', 'a5h', 'a3h'], vorlagen: [['aushang', 'hell'], ['aushang', 'creme'], ['aushang', 'dunkel'], ['deckel', 'hell']], beispiel: 'Ein Aushang: die lange Tafel ist heute reserviert' },
    { key: 'menueeinleger', name: 'Menü-Einleger', satz: 'Empfehlung, Tagesmenü, Festtagsmenü zur Karte', format: 'a5h', formate: ['a5h', 'dlh', 'a4h'], vorlagen: [['karte', 'creme'], ['karte', 'hell'], ['karte', 'dunkel'], ['aushang', 'creme']], beispiel: 'Rudis Zeilen als Einleger zur Karte' },
    { key: 'teamaushang', name: 'Mitarbeiter-Aushang', satz: 'Intern: Ablauf des Abends, Hinweise fürs Team', format: 'a4h', formate: ['a4h', 'a3h', 'a5h'], vorlagen: [['aushang', 'hell'], ['aushang', 'creme'], ['programm', 'hell'], ['deckel', 'dunkel']], beispiel: 'Ein Aushang für das Team zum Ablauf des Abends' },
    { key: 'pressemappe', name: 'Pressemappe', satz: 'Deckblätter für Medien und Verkauf', format: 'a4h', formate: ['a4h'], vorlagen: [['deckel', 'dunkel'], ['fenster', 'creme'], ['buehne', 'dunkel']], beispiel: 'Ein Deckblatt für die Pressemappe des Hauses' },
    { key: 'story', name: 'Story', satz: 'Hochformat 9:16 für Instagram und WhatsApp', format: 'story', formate: ['story'], vorlagen: [['fenster', 'dunkel'], ['buehne', 'dunkel'], ['deckel', 'creme'], ['geteilt', 'dunkel']], beispiel: 'Eine Story: was im Glas passiert' },
    { key: 'newsletter', name: 'Newsletter', satz: 'E-Mail an die Gäste und Kopfbild für den Newsletter', format: 'mail', formate: ['mail', 'mailkopf'], vorlagen: [['fenster', 'dunkel'], ['ansicht', 'dunkel']], beispiel: 'Newsletter zum nächsten Abend' },   // 29.10.: die drei Newsletter-Vorlagen der Bibliothek (2 × E-Mail-Kopfbild)
    { key: 'gutschein', name: 'Gutschein', satz: 'Ein Abend an der langen Tafel zum Verschenken', format: 'dlq', formate: ['dlq', 'a6q'], vorlagen: [['gutschein', 'hell'], ['gutschein', 'dunkel']], beispiel: 'Ein Gutschein für einen Abend', rueck: 'gutscheinrueck' },   // 29.10. Gestaltungs-Chat: vorlagen/gutschein.json, Rückseite gutscheinrueck
    { key: 'frei', name: 'Leeres Blatt', satz: 'Selbst gestalten, in jedem Format', format: 'a5h', formate: Object.keys(DS.FORMATE), vorlagen: [], leer: true },
  ];
  /* K18 (Tor 30.10.2026, Oberchef): Arten mit nur ein bis drei Vorlagen stehen in der Ansicht bei der passenden Nachbar-Art, nicht allein.
     Nur die Gruppierung der Ansicht; jede Vorlage bleibt in ihrer Art und ihrem Format (haeuser/<haus>/vorlagen/<art>.json unverändert). */
  const GRUPPE = { aushang: ['stoerung', 'teamaushang'], flyer: ['programm'], einladung: ['gutschein'], plakat: ['pressemappe'], instagram: ['newsletter'] };
  const GRUPPE_NAME = { aushang: 'Aushang, Störung und Team', flyer: 'Flyer und Programm', einladung: 'Einladung und Gutschein', plakat: 'Plakat und Pressemappe', instagram: 'Instagram und Newsletter' };
  const IN_GRUPPE = new Set(Object.values(GRUPPE).flat());
  const ARTEN_SICHT = ARTEN.filter(a => !IN_GRUPPE.has(a.key));
  const mitGruppe = a => GRUPPE[a.key] ? Object.assign({}, a, { name: GRUPPE_NAME[a.key], gruppe: GRUPPE[a.key], satz: a.satz + '. Dazu ' + GRUPPE[a.key].map(g => ARTEN.find(x => x.key === g).name).join(' und ') + '.' }) : a;
  const zus = t => esc(t).replace(/ (\S+)$/, '\u00a0$1');   // K7 (Tor 2, 30.10.2026): nie ein Wort allein in der letzten Zeile
  const inhalt = (art, v) => (INHALT[art.key] && INHALT[art.key][v]) || DS.BEISPIEL[v];

  let wahl = null, fk = null;
  const st = () => window.DSStudio;

  /* «Daraus gestalten» (Robert 16.10.2026): Arten und Vorlagen mit dem gewählten Foto schon an jeder Bildstelle.
     Solange mitFoto gesetzt ist, setzt jede Seite, die hier entsteht (Vorschau, Galerie, Öffnen), das Foto in ihre Bildstellen;
     der Ausschnitt richtet sich nach der Bildstelle (zentriert, füllend). Gelöst mit ×, beim Öffnen einer Drucksache oder beim Wechsel der Ansicht. */
  let mitFoto = null;
  const setzeOhneFoto = DS.setze;
  DS.setze = function () {
    const s = setzeOhneFoto.apply(this, arguments);
    if (mitFoto && s && s.el) s.el.forEach(el => {
      if (el.typ !== 'bild') return;
      el.bild = mitFoto; el.fx = .5; el.fy = .5; el.zoom = 1;
      if (el.slot && s.quelle && s.quelle.inhalt) { const w = el.slot.split('.'); let o = s.quelle.inhalt; for (let i = 0; i < w.length - 1 && o; i++) o = o[w[i]]; if (o) o[w[w.length - 1]] = mitFoto; }
    });
    return s;
  };
  /* Mit Foto: die erste Vorlage der Art mit Bildstelle zeigen; hat keine eine, bleibt die Art aus der Auswahl */
  const artMitFoto = art => art.vorlagen.find(([v]) => hatFotoStelle({ inhalt: inhalt(art, v) }));
  const vorlageFuerVorschau = art => (mitFoto && artMitFoto(art)) || art.vorlagen[0];
  const hatFotoStelle = x => !!(x && x.inhalt && Object.values(x.inhalt).some(v => typeof v === 'string' && DS.M.bildIndex && DS.M.bildIndex[v]));
  function mitFotoKopf() {
    if (!mitFoto) return '';
    const b = DS.M.bilder.find(x => x.key === mitFoto) || { alt: mitFoto };
    return `<div class="mit-foto"><span class="mit-foto__bild" style="background-image:url('${DS.bildUrl(DS.M, mitFoto, true)}')"></span><div><small>Mit diesem Foto</small><b>${esc(b.alt || '')}</b></div><button class="mit-foto__zu" data-st="ohneFoto" aria-label="Foto lösen" title="Foto lösen"><svg viewBox="0 0 24 24"><path d="M9 14.5 4 9.5l5-5M4 9.5h11a5 5 0 0 1 0 10h-3"/></svg></button></div>`;
  }
  function zeigeMitFotoKopf() {
    const alt = document.querySelector('#msNeu > .mit-foto'); if (alt) alt.remove();
    if (mitFoto) { const f = document.querySelector('#msNeu > .start__filter'); if (f) f.insertAdjacentHTML('beforebegin', mitFotoKopf()); }
  }

  function vorschau(fkey, vorlage, ton, inh, box) {   // fertiges Vorschaubild, sonst einmal live (vorschaubild.js, 29.10.)
    const live = () => { const f = DS.FORMATE[fkey], doc = { format: { b: f.b, h: f.h }, formatKey: fkey, seiten: [DS.setze(DS.M, fkey, vorlage, ton, inh)] }; return { el: st().miniBox(doc, 0, box), doc }; };
    return DS.VB ? DS.VB.blatt(fkey, { vorlage, ton, inhalt: inh, foto: mitFoto || '' }, live) : live().el;
  }

  /* Ein Papierstück im Atelier: Grösse aus dem echten Format (gestaucht, damit A6 und A3 beide lesbar bleiben), frei stehend mit Schatten */
  const hoeheVon = (f, basis) => basis * Math.pow(f.h / 148, .6);
  /* Drei Blätter je Reihe am Rechner, zwei am Tablet, eins am Handy; das Blatt füllt seine Spalte (Robert 12.10.2026) */
  const spalten = () => innerWidth <= 640 ? 1 : innerWidth <= 1100 ? 2 : 3;
  function spalte() { const h = document.querySelector('#start .ms-haupt'), w = (h && h.clientWidth > 200 ? h.clientWidth : innerWidth - 300) - (innerWidth <= 640 ? 64 : 150), n = spalten(); return Math.max(150, (w - (n - 1) * 26) / n); }
  const GROSS = () => Math.min(300, spalte() * .74);          // Grundmass eines Blatts (A6 hoch = so hoch)
  const BREIT = () => spalte() * .9;                           // breiteste Stücke höchstens so breit
  function blatt(fkey, vorlage, ton, inh, basis, kl) {
    const f = DS.FORMATE[fkey], maxW = Math.min(basis * 1.32, BREIT());
    let H = hoeheVon(f, basis), W = H * f.b / f.h;
    if (W > maxW) { W = maxW; H = W * f.h / f.b; }   // breite Formate (DL quer) nicht über die Nachbarn
    const box = Math.max(W, H) * (Math.max(f.b, f.h) + 2 * DS.B) / Math.max(f.b, f.h);
    const el = document.createElement('span'); el.className = 'papier ' + (kl || '') + (ton === 'hell' || ton === 'creme' ? ' papier--hell' : '');
    el.style.width = W + 'px'; el.style.height = H + 'px';
    if (vorlage) el.appendChild(vorschau(fkey, vorlage, ton, inh, box));
    return el;
  }
  /* Ein ganzes Handy: Rahmen, Seitentasten, Insel, Statusleiste, der Beitrag im Feed mit Profilzeile, Aktionen und Bildtext */
  const IC = {
    herz: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    sprech: '<svg viewBox="0 0 24 24"><path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5z"/></svg>',
    senden: '<svg viewBox="0 0 24 24"><path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/></svg>',
    merken: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
    mehr: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>',
  };
  function handy(fkey, v, t, inh, H) {
    const W = Math.round(H * .485), rand = Math.round(W * .045), sw = W - 2 * rand;
    const h = document.createElement('span'); h.className = 'handy handy--ganz'; h.style.width = W + 'px'; h.style.height = H + 'px'; h.style.setProperty('--rand', rand + 'px');
    const f = DS.FORMATE[fkey], ph = sw * f.h / f.b;
    const post = document.createElement('span'); post.className = 'papier papier--schirm'; post.style.width = sw + 'px'; post.style.height = ph + 'px';
    post.appendChild(vorschau(fkey, v, t, inh, sw * (Math.max(f.b, f.h) + 2 * DS.B) / f.b * (f.b >= f.h ? 1 : f.h / f.h)));
    const text = (((inh && (inh.text || inh.titel)) || '').match(/^[^.!?]*[.!?]?/) || [''])[0];   // im Handy nur der erste Satz, ganz (Tor 30.10.2026, K2)
    h.innerHTML = `<i class="handy__taste handy__taste--l1"></i><i class="handy__taste handy__taste--l2"></i><i class="handy__taste handy__taste--r"></i>
      <span class="handy__schirm">
        <span class="handy__status"><b>9:41</b><i class="handy__insel"></i><span class="handy__sym"><svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8"/><rect x="10" y="3" width="3" height="9" rx=".8"/><rect x="15" y="0" width="3" height="12" rx=".8"/></svg><svg viewBox="0 0 16 12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0z"/><path d="M3.4 6.8a6.5 6.5 0 0 1 9.2 0l-1.5 1.5a4.4 4.4 0 0 0-6.2 0z"/><path d="M1.1 4.5a9.7 9.7 0 0 1 13.8 0l-1.5 1.5a7.6 7.6 0 0 0-10.8 0z"/></svg><svg viewBox="0 0 27 12"><rect x=".5" y=".5" width="23" height="11" rx="3" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="2.2" y="2.2" width="17" height="7.6" rx="1.6"/><path d="M25 4v4a2 2 0 0 0 0-4z" fill-opacity=".45"/></svg></span></span>
        <span class="handy__kopf"><span class="handy__bild">${DS.zeichenSvg(DS.M, 'currentColor')}</span><span class="handy__wer"><b>${esc(DS.M.name)}</b><small>${esc(DS.M.ort)}</small></span><span class="handy__ic">${IC.mehr}</span></span>
        <span class="handy__post"></span>
        <span class="handy__aktionen"><span>${IC.herz}${IC.sprech}${IC.senden}</span>${IC.merken}</span>
        <span class="handy__text"><b>${esc(DS.M.name)}</b> ${esc(text)}</span>
        <i class="handy__strich"></i>
      </span>`;
    h.querySelector('.handy__post').appendChild(post);
    return h;
  }

  /* Das Stück einer Art: Vorderseite, je nach Art Rückseite, Umschlag, Deckblatt oder Handy */
  function stueck(art, fkey, basis, nr) {
    const b = document.createElement('button'); b.className = 'stueck'; b.style.setProperty('--i', nr);
    b.style.setProperty('--r', ([-1.6, 1.2, -.8, 1.8, -1.2, .9][nr % 6]) + 'deg');
    const f = DS.FORMATE[fkey];
    const buehne = document.createElement('span'); buehne.className = 'stueck__buehne';
    const satz = document.createElement('span'); satz.className = 'stueck__satz';
    if (art.leer) {
      const p = blatt('a5h', null, 'hell', null, basis, 'papier--leer'); p.innerHTML = '<span class="papier__plus"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>';
      satz.appendChild(p);
    } else if (fkey === 'insta') {
      const [v, t] = vorlageFuerVorschau(art);
      satz.appendChild(handy(fkey, v, t, inhalt(art, v), basis * 2.05));
    } else {
      const [v, t] = vorlageFuerVorschau(art);
      let hinten = null;
      if (art.rueck) hinten = blatt(fkey, art.rueck, t, DS.BEISPIEL[art.rueck], basis);
      else if (art.key === 'speisekarte' || art.key === 'getraenke') hinten = blatt(fkey, 'deckel', 'dunkel', inhalt(art, 'deckel'), basis);
      else if (art.key === 'gutschein') hinten = blatt(fkey, 'gutschein', 'hell', inhalt(art, 'gutschein'), basis);
      else if (art.key === 'einladung') { const u = document.createElement('span'); u.className = 'couvert'; const H = hoeheVon(f, basis); u.style.width = H * .98 + 'px'; u.style.height = H * .82 + 'px'; u.innerHTML = `<i class="couvert__siegel">${DS.zeichenSvg(DS.M, 'currentColor')}</i>`; satz.appendChild(u); }
      if (hinten) { hinten.classList.add('papier--hinten'); satz.appendChild(hinten); }
      const vorn = blatt(fkey, v, t, inhalt(art, v), basis, 'papier--vorn' + (art.key === 'tisch' ? ' papier--steht' : ''));
      satz.appendChild(vorn);
    }
    buehne.appendChild(satz);
    b.appendChild(buehne);
    b.insertAdjacentHTML('beforeend', `<b class="stueck__name">${zus(art.name)}</b><em class="stueck__format">${art.leer ? 'Format frei wählbar' : `${esc(f.name)} · ${f.b} auf ${f.h} mm`}</em><small class="stueck__satztext">${esc(art.satz)}</small>`);
    return b;
  }

  /* Jede Reihe so hoch wie ihr grösstes Stück: keine leere Wand über kleinen Karten */
  function reihen(box) {
    const st = [...box.querySelectorAll(':scope > .stueck')].filter(x => x.offsetParent); if (!st.length) return;
    st.forEach(s => { s.querySelector('.stueck__buehne').style.height = ''; s.querySelector('.stueck__satz').style.removeProperty('--s'); });
    const zeilen = {};
    st.forEach(s => { const y = Math.round(s.offsetTop / 10); (zeilen[y] = zeilen[y] || []).push(s); });
    Object.values(zeilen).forEach(z => {
      /* Hochformate einer Reihe gleich hoch (Robert 29.10.2026: «Karten jeder Reihe auf einer Grundlinie und gleich gross»): ein A5 neben DL wird so hoch
         wie die DL-Karten, höchstens so breit wie 90 % der Spalte; Querformate bleiben */
      const vorn = s => s.querySelector('.stueck__satz > .papier--vorn'), hoch = s => { const v = vorn(s); return v && v.offsetHeight >= v.offsetWidth ? v : null; };
      const ziel = Math.max(0, ...z.map(s => hoch(s)?.offsetHeight || 0));
      z.forEach(s => { const v = hoch(s); if (v && ziel) s.querySelector('.stueck__satz').style.setProperty('--s', Math.min(ziel / v.offsetHeight, s.clientWidth * .9 / v.offsetWidth).toFixed(4)); });
      const h = Math.max(...z.map(s => { const sa = s.querySelector('.stueck__satz'); return sa.scrollHeight * (+sa.style.getPropertyValue('--s') || 1); }));
      z.forEach(s => s.querySelector('.stueck__buehne').style.height = Math.ceil(h + 36) + 'px');
      z.forEach((s, i) => s.classList.toggle('stueck--rand-l', i === 0) || s.classList.toggle('stueck--rand-r', i === z.length - 1));
      z[z.length - 1].classList.add('stueck--rand-r');
    });
  }
  let spaltenVorher = spalten();
  addEventListener('resize', () => { clearTimeout(window.__dsSp); window.__dsSp = setTimeout(() => {
    if (spalten() === spaltenVorher || document.getElementById('start').hidden) return; spaltenVorher = spalten();
    katalogGezeichnet = {};
    if (!document.getElementById('startWeg').hidden && wahl && document.getElementById('startVorlagen')) zeichneVorlagen();
    else if (document.getElementById('startWeg').hidden) { zeigeArten(); waehleAnsicht(ansicht); }
  }, 250); });
  let reihenUhr; addEventListener('resize', () => { clearTimeout(reihenUhr); reihenUhr = setTimeout(() => { const a = document.getElementById('arten'); if (a && !document.getElementById('start').hidden) { reihen(a); const v = document.getElementById('startVorlagen'); if (v) reihen(v); } }, 150); });

  /* Suchen und filtern im Atelier */
  const GRUPPEN = [['alle', 'Alle'], ['mitnehmen', 'Zum Mitnehmen'], ['karten', 'Karten & Menüs'], ['aushang', 'Aushänge & Plakate'], ['anlass', 'Anlässe & Geschenke'], ['zimmer', 'Tafel & Empfang'], ['intern', 'Intern & Medien'], ['digital', 'Digital']];
  const IN = { abendplakat: ['aushang', 'digital'], menuekarte: ['karten'], flyer: ['mitnehmen'], plakat: ['aushang'], speisekarte: ['karten'], getraenke: ['karten'], einladung: ['anlass'], gutschein: ['anlass', 'mitnehmen'], postkarte: ['mitnehmen', 'anlass'],
    aushang: ['aushang'], programm: ['karten', 'anlass'], tisch: ['aushang', 'karten'], instagram: ['digital'], newsletter: ['digital'], frei: [],
    zimmerkarte: ['zimmer', 'anlass'], beileger: ['zimmer', 'mitnehmen'], tischkarte: ['anlass', 'karten'], namensschild: ['intern', 'anlass'], tagungsmappe: ['anlass'],
    wochenprogramm: ['aushang'], hinweiskarte: ['zimmer'], stoerung: ['aushang'], menueeinleger: ['karten'], weinempfehlung: ['karten'], kinderkarte: ['karten'], teamaushang: ['intern', 'aushang'],
    pressemappe: ['intern'], story: ['digital'] };
  const WORTE = { flyer: 'flyer prospekt faltblatt angebot werbung tea time', plakat: 'plakat poster werbung halle garten lift gross', speisekarte: 'speisekarte menü menu karte restaurant essen gerichte fondue rösti',
    getraenke: 'getränkekarte barkarte bar drinks cocktails wein weinkarte tee kaffee', einladung: 'einladung hochzeit gala dinner fest feier silvester geburtstag', gutschein: 'gutschein geschenk voucher spa schenken',
    postkarte: 'ansichtskarte postkarte gruss souvenir haus aare', aushang: 'aushang hinweis schild öffnungszeiten zeiten hausregeln spa info', programm: 'programm termine veranstaltungen anlässe agenda ablauf wochenprogramm tagung',
    tisch: 'tischaufsteller aufsteller tisch bar restaurant zimmer', instagram: 'instagram social media beitrag post handy story', frei: 'leer leeres blatt blanko eigenes frei format',
    zimmerkarte: 'willkommenskarte zimmerkarte willkommen gruss direktion geburtstag abschied karte zimmer',
    beileger: 'rechnungsbeileger beileger rechnung umschlag dank bewertung', tischkarte: 'tischkarte platzkarte tischnummer reserviert bankett hochzeit', namensschild: 'namensschild schild badge name mitarbeitende tagung',
    tagungsmappe: 'tagungsmappe mappe deckblatt tagung seminar meeting anlass', wochenprogramm: 'wochenprogramm tafel woche programm halle lift', hinweiskarte: 'hinweiskarte housekeeping handtücher wäsche minibar bad karte',
    stoerung: 'störung baustelle bauarbeiten lift strom wasser defekt reinigung gesperrt aushang', menueeinleger: 'menü einleger tagesmenü empfehlung festtagsmenü karte', weinempfehlung: 'weinempfehlung wein empfehlung wein des monats',
    kinderkarte: 'kinderkarte kinder menü familie', teamaushang: 'mitarbeiter aushang team personal intern schulung dienstplan', pressemappe: 'pressemappe presse medien deckblatt verkauf', story: 'story instagram whatsapp hochformat social media' };
  let gruppe = 'alle';
  function zeichneGruppen() {
    $('#startGruppen').innerHTML = GRUPPEN.map(([k, t]) => `<button data-gruppe="${k}" class="${gruppe === k ? 'an' : ''}">${esc(t)}</button>`).join('');
    zeichneAlleKnopf();
  }
  /* Einstieg in die Galerie über alle Arten (12.10.2026), mit der Zahl aus vorlagen/index.json */
  function zeichneAlleKnopf() {
    const f = document.querySelector('#msNeu .start__filter'); if (!f) return;
    let z = $('#vbAlle');
    if (!z) {
      z = document.createElement('div'); z.id = 'vbAlle'; z.className = 'vb__alle'; f.parentNode.insertBefore(z, f);
      z.innerHTML = `<button class="kn kn--mehr" data-st="alle"><span>Alle Vorlagen des Hauses durchsuchen</span><i><svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></i></button>`;
      fetch(DS.M.basis + 'vorlagen/index.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : []).then(ix => { const n = ix.reduce((m, x) => m + (x.zahl || 0), 0); if (n) z.querySelector('span').textContent = `Alle ${n.toLocaleString('de-CH')} Vorlagen des Hauses durchsuchen`; }).catch(() => { });
    }
  }
  /* Die Gesamtzahl der fertigen Vorlagen sichtbar machen (Robert 12.10.2026: «Ich müsste doch hier 3000 Vorlagen drin haben»): in der Leiste
     neben «Arten und Vorlagen» und als Verweis unter dem Eingabefeld der Übersicht. Zahl aus vorlagen/index.json, vorher steht die Zahl der Arten. */
  let IX = null;
  function zaehleVorlagen() {
    const em = document.querySelector('.ms-nav [data-ansicht="neu"] em') || document.querySelector('[data-ansicht="neu"] em'); if (em) em.textContent = ARTEN_SICHT.length;
    /* 15.10.2026 (Robert: «hakelig beim Ankommen»): Zahlen nur beim ersten Öffnen holen; vorher kam jedes Mal ein zweites Zeichnen der Kacheln nach */
    (IX ? Promise.resolve(IX) : fetch(DS.M.basis + 'vorlagen/index.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : [])).then(ix => {
      IX = ix;
      const n = ix.reduce((m, x) => m + (x.zahl || 0), 0); if (!n) return;
      const z = n.toLocaleString('de-CH');
      if (em) em.textContent = z;
      const k = $('#msAlle'); if (k) { k.querySelector('span').textContent = `${z} fertige Vorlagen in ${new Set(ix.map(x => x.gruppe || x.art)).size} Arten ansehen`; k.hidden = false; }
    }).catch(() => { });
    if (DS.M.key === 'culinarium') ladeAnlaesse();
    if (!Z && DS.M.key !== 'culinarium') fetch(DS.M.basis + 'vorlagen/zahlen.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(z => {
      if (!z || !z.abteilung) return; Z = z; zeichneWochen();
      if (ansicht === 'abteilungen') zeichneAbteilungen(); if (ansicht === 'events') zeichneEvents();
    }).catch(() => { });
  }
  function filtern() {
    const q = ($('#startSuche').value || '').trim().toLowerCase(), W = q.split(/\s+/).filter(Boolean);
    if (ansicht === 'fotos' || ansicht === 'livre') { $('#startNichts').hidden = filterFotos(q) > 0; return; }
    if (!['meine', 'neu'].includes(ansicht)) { $('#startNichts').hidden = true; return; }
    if (ansicht === 'meine') {
      const docs = st().alleDocs(); let m = 0;
      document.querySelectorAll('#bibliothek [data-doc]').forEach(k => { const d = docs[k.dataset.doc]; const t = (d.name + ' ' + (d.auftrag || '') + ' ' + (DS.FORMATE[d.formatKey]?.name || '')).toLowerCase(); const p = W.every(w => t.includes(w)); k.hidden = !p; if (p) m++; });
      const ml = mailsLesen();
      document.querySelectorAll('#bibliothek [data-mail]').forEach(k => { const x = ml.find(y => y.id === k.dataset.mail) || {}; const t = ((x.name || '') + ' e-mail newsletter mail ' + ((x.doc || {}).betreff || '')).toLowerCase(); const p = W.every(w => t.includes(w)); k.hidden = !p; if (p) m++; });
      $('#startNichts').hidden = !(W.length && !m);
      return;
    }
    let n = 0;
    document.querySelectorAll('#arten .stueck').forEach(s => {
      const a = ARTEN.find(x => x.key === s.dataset.art), text = (a.name + ' ' + a.satz + ' ' + WORTE[a.key]).toLowerCase();
      const passt = (a.leer && !mitFoto) || (!a.leer && !(mitFoto && s.dataset.ohneFoto) && (gruppe === 'alle' || IN[a.key].includes(gruppe)) && W.every(w => text.includes(w)));
      s.hidden = !passt; if (passt && !a.leer) n++;
    });
    $('#startNichts').hidden = n > 0;
    requestAnimationFrame(() => reihen($('#arten')));
  }

  function zeigeArten() {
    wahl = null;
    $('#start .ms-haupt').scrollTo({ top: 0 });
    $('#startWeg').hidden = true; $('#startWahl').hidden = false;
    const box = $('#arten'); box.innerHTML = '';
    const g = GROSS(); ARTEN_SICHT.forEach((a, i) => { const s = stueck(mitGruppe(a), a.format, g, i); s.dataset.art = a.key; s.style.setProperty('--i', Math.min(i, 8)); box.appendChild(s); });   // Auftritt gestaffelt nur für die ersten neun (27 Arten seit 12.10.2026)
    if (mitFoto) box.querySelectorAll('.stueck').forEach(s => { const a = ARTEN.find(x => x.key === s.dataset.art); if (a && !a.leer && !artMitFoto(a)) s.dataset.ohneFoto = '1'; });
    zeigeMitFotoKopf();
    zeichneGruppen();
    beispieleAnlegen(); zeichneBibliothek(); zeichneWochen(); gruss(); zaehleVorlagen(); if ($('#fotoZahl')) $('#fotoZahl').textContent = fotoZahlen(DS.M.bilder || []).fotos; void (DS.M.bilder || []).length; zeichneFreigegeben();
    waehleAnsicht(ansicht);
  }

  /* ---------- Meine Drucksachen (Robert 12.10.2026: «wie in meiner Canva-Bibliothek alle Dokumente sehen, bearbeiten, speichern») ---------- */
  let ansicht = 'start';
  const vorZeit = t => { const m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'gerade eben'; if (m < 60) return `vor ${m} Min.`; const h = Math.round(m / 60); if (h < 24) return `vor ${h} Std.`; return new Date(t).toLocaleDateString('de-CH', { day: 'numeric', month: 'long' }); };
  const IA = {
    umbenennen: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/></svg>',
    kopie: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    pdf: '<svg viewBox="0 0 24 24"><path d="M12 4v11m-5-5 5 5 5-5"/><path d="M5 20h14"/></svg>',
    loeschen: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>',
    freigeben: '<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="6"/><path d="m9.5 10 1.8 1.8 3.4-3.6M8.5 15 7 21l5-2.5 5 2.5-1.5-6"/></svg>',
  };
  /* Vorschau einer Drucksache, eingepasst in eine Fläche (Karten der Startseite) */
  function passDoc(doc, bw, bh, kl, seite = 0) {
    const f = doc.format, k = Math.min(bw / f.b, bh / f.h), W = f.b * k, H = f.h * k;
    const el = document.createElement('span'); el.className = 'papier ' + (kl || ''); el.style.width = W + 'px'; el.style.height = H + 'px';
    const live = () => ({ el: st().miniBox(doc, seite, Math.max(W, H) * (Math.max(f.b, f.h) + 2 * DS.B) / Math.max(f.b, f.h)), doc, i: seite });
    el.appendChild(DS.VB ? DS.VB.blatt(doc.formatKey, { seite: doc.seiten[seite] }, live) : live().el);   // Meine Medien: fertiges Bild, wenn das Blatt so schon einmal gezeigt wurde
    return el;
  }
  const PLUS = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
  function karte(d, i) {
    const b = document.createElement('div'); b.className = 'mk'; b.dataset.doc = d.id; b.tabIndex = 0; b.setAttribute('role', 'button'); b.style.setProperty('--i', i);
    const k = document.createElement('span'); k.className = 'mk__k';
    const bu = document.createElement('span'); bu.className = 'mk__buehne';
    try { bu.appendChild(passDoc(d, 150, 146, 'papier--vorn', 0)); } catch (e) { }
    k.appendChild(bu);
    k.insertAdjacentHTML('beforeend', `<span class="mk__licht"></span><span class="doc__aktionen">${Object.entries({ umbenennen: 'Umbenennen', kopie: 'Kopie anlegen', pdf: 'PDF speichern', loeschen: 'Löschen' }).map(([x, t]) => `<button data-akt="${x}" title="${t}" aria-label="${t}">${IA[x]}</button>`).join('')}</span>`);
    b.appendChild(k);
    b.insertAdjacentHTML('beforeend', `<b class="mk__name" data-name>${esc(d.name)}</b><em class="mk__info">${esc(DS.FORMATE[d.formatKey]?.name || '')} · ${d.seiten.length} ${d.seiten.length === 1 ? 'Seite' : 'Seiten'} · ${vorZeit(d.geaendert)}</em>`);
    return b;
  }
  function neuKarte(i) {
    const n = document.createElement('button'); n.className = 'mk mk--neu'; n.dataset.akt = 'neu'; n.style.setProperty('--i', i);
    n.innerHTML = `<span class="mk__k"><span class="mk__plus">${PLUS}</span></span><b class="mk__name">Neues Medium</b><em class="mk__info">Beschreiben oder Vorlage wählen</em>`;
    return n;
  }
  /* E-Mails aus dem Newsletter-Baukasten (mail.html, localStorage «ds-mails») stehen mit in Meine Medien (Robert 12.10.2026) */
  const mailsLesen = () => { try { return JSON.parse(localStorage.getItem('ds-mails') || '[]'); } catch (e) { return []; } };
  const mailsSchreiben = l => { try { localStorage.setItem('ds-mails', JSON.stringify(l)); } catch (e) { } };
  /* Meine Medien und Zuletzt bearbeitet: Blätter frei auf Blau wie alle Listen (Robert 12.10.2026, 04:10 «überall»), mit Umbenennen, Kopie, PDF, Löschen darunter */
  function medienStueck(attr, i, blaetter, H, name, info, aktionen) {
    const b = stueckKarte(attr, i, blaetter, H, name, info, null, 'stueck--doc');
    const d = document.createElement('div'); d.className = b.className; d.style.cssText = b.style.cssText; Object.assign(d.dataset, b.dataset); d.tabIndex = 0; d.setAttribute('role', 'button');
    while (b.firstChild) d.appendChild(b.firstChild);
    d.querySelector('.zl__name').setAttribute('data-name', '');
    if (aktionen) d.insertAdjacentHTML('beforeend', `<span class="doc__aktionen">${aktionen}</span>`);
    return d;
  }
  function mailKarte(m, i) {
    const d = m.doc || {}, t = (d.bloecke || []).find(x => x.typ === 'titel'), foto = (d.kopf || {}).foto, n = (d.bloecke || []).length;
    const el = document.createElement('span'); el.className = 'mkm';
    el.innerHTML = `<span class="mkm__kopf">${DS.zeichenSvg(DS.M, 'currentColor')}</span>${foto ? `<span class="mkm__bild" style="background-image:url('${DS.bildUrl(DS.M, foto, true)}')"></span>` : ''}<span class="mkm__text"><b>${esc((t && t.titel) || m.name || 'E-Mail')}</b><i></i><i></i><i></i><u></u></span>`;
    const ak = Object.entries({ umbenennen: 'Umbenennen', kopie: 'Kopie anlegen', loeschen: 'Löschen' }).map(([x, tt]) => `<button data-makt="${x}" title="${tt}" aria-label="${tt}">${IA[x]}</button>`).join('');
    const k = GROSS() / 150; el.style.setProperty('--k', k.toFixed(3));
    return medienStueck({ mail: m.id }, i, [el], Math.round(176 * k), m.name || 'E-Mail', `E-Mail · ${n} ${n === 1 ? 'Baustein' : 'Bausteine'} · ${vorZeit(m.geaendert)}`, ak);
  }
  function docStueck(d, i) {
    const g = GROSS(); let bl = [], H = g;
    try { const v = blattDoc(d, g, 'papier--vorn', 0); H = parseFloat(v.style.height) || g; bl = [d.seiten.length > 1 ? blattDoc(d, g, 'papier--hinten', 1) : null, v]; } catch (e) { }
    const ak = Object.entries({ freigeben: 'Freigeben für Abteilungen', umbenennen: 'Umbenennen', kopie: 'Kopie anlegen', pdf: 'PDF speichern', loeschen: 'Löschen' }).map(([x, t]) => `<button data-akt="${x}" title="${t}" aria-label="${t}">${IA[x]}</button>`).join('');
    const fg = freigabe(d), k = medienStueck({ doc: d.id }, i, bl, H, d.name, fg ? `Freigegeben für ${fg.abteilungen.map(abtName).join(', ')}` : `${DS.FORMATE[d.formatKey]?.name || ''} · ${d.seiten.length} ${d.seiten.length === 1 ? 'Seite' : 'Seiten'} · ${vorZeit(d.geaendert)}`, ak);
    const bu = k.querySelector('.stueck__buehne');
    if (fg && bu) bu.insertAdjacentHTML('beforeend', `<span class="schild-frei" title="Freigegeben von ${esc(fg.wer)} am ${esc(fg.datum)} für ${esc(fg.abteilungen.map(abtName).join(', '))}">Freigegeben</span>`);
    if (fg && bu && SIEGEL_WORT) bu.insertAdjacentHTML('beforeend', `<span class="siegel" title="Freigegeben von ${esc(fg.wer)} am ${esc(fg.datum)}">${window.DSSiegel ? DSSiegel(DS.M.zeichen, { wort: SIEGEL_WORT, groesse: 78, seed: 7 + (d.id.length % 5) }) : ''}</span>`);
    return k;
  }
  /* ---------- Freigabe (Robert 16.10.2026: «freigegeben zur Verwendung für andere Abteilungen, damit man sieht, welche Vorlagen man im Notfall
     verwenden kann, wenn niemand zur Hand ist»). Die Freigabe steht im Dokument selbst (doc.freigabe = { abteilungen, wer, datum }) und wird
     mit ihm in diesem Browser gespeichert, wie alle Medien der Imprimerie. ---------- */
  const SIEGEL_WORT = null;   // Wachssiegel abgelehnt (16.10.2026); gewählt ist das Messingschild (Nr. 24 aus _qa/freigabe-30.html)
  const freigabe = d => d && d.freigabe && d.freigabe.abteilungen && d.freigabe.abteilungen.length ? d.freigabe : null;
  const abtName = k => ((K.ABTEILUNGEN.find(a => a.k === k) || {}).t || k);
  const docsLesen = () => { try { return JSON.parse(localStorage.getItem(`ds-${st().haus}-docs`) || '{}'); } catch (e) { return {}; } };
  const docsSchreiben = d => { try { localStorage.setItem(`ds-${st().haus}-docs`, JSON.stringify(d)); return true; } catch (e) { return false; } };
  async function freigabeDialog(id) {
    const S = st(), alle = docsLesen(), d = alle[id]; if (!d) return;
    const fg = d.freigabe || {}, wahl = new Set(fg.abteilungen || []);
    let wer = fg.wer && fg.wer !== 'Beispiel' ? fg.wer : (localStorage.getItem('ds-freigabe-wer') || '');
    const p = S.dialog(`<h2>Freigeben</h2><p>«${esc(d.name)}» darf ohne Rückfrage verwendet werden von:</p>
      <div class="fg-wahl">${K.ABTEILUNGEN.map(a => `<button type="button" data-fgabt="${a.k}" class="${wahl.has(a.k) ? 'an' : ''}">${esc(a.t)}</button>`).join('')}</div>
      <label class="fg-wer">Freigegeben von<input id="fgWer" value="${esc(wer)}" placeholder="Name"></label>`,
      [{ t: 'Abbrechen', v: 'ab' }, ...(freigabe(d) ? [{ t: 'Freigabe aufheben', v: 'weg' }] : []), { t: 'Freigeben', v: 'ok', haupt: true }]);
    const box = $('#dialogKarte');
    box.querySelectorAll('[data-fgabt]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.fgabt; wahl.has(k) ? wahl.delete(k) : wahl.add(k); b.classList.toggle('an', wahl.has(k)); }));
    const wf = box.querySelector('#fgWer'); wf.addEventListener('input', () => { wer = wf.value.trim(); });
    const v = await p;
    if (v === 'ab') return;
    const neu = docsLesen(), x = neu[id]; if (!x) return;
    if (v === 'weg' || !wahl.size) { delete x.freigabe; S.melde('Freigabe aufgehoben.'); }
    else {
      x.freigabe = { abteilungen: [...wahl], wer: wer || 'ohne Namen', datum: new Date().toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' }) };
      try { if (wer) localStorage.setItem('ds-freigabe-wer', wer); } catch (e) { }
      S.melde('Freigegeben für ' + x.freigabe.abteilungen.map(abtName).join(', ') + '.');
    }
    docsSchreiben(neu); zeichneBibliothek(); zeichneFreigegeben(); waehleAnsicht(ansicht);
  }
  function zeichneFreigegeben() {
    const ic = document.querySelector('.ms-nav [data-ansicht="freigegeben"] svg:not(.schild-frei__ic)'); if (ic) ic.outerHTML = '<svg class="schild-frei__ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="1.6"/><circle cx="5" cy="12" r=".9"/><circle cx="19" cy="12" r=".9"/></svg>';
    if (SIEGEL_WORT && ic && window.DSSiegel && DS.M.zeichen) ic.outerHTML = DSSiegel(DS.M.zeichen, { ohneWort: true, groesse: 20, seed: 5 });
    const box = $('#fgListe'); if (!box) return;
    const docs = sichtbareDocs().filter(freigabe).sort((a, b) => b.geaendert - a.geaendert);
    const z = $('#fgZahl'); if (z) z.textContent = docs.length;
    box.innerHTML = '';
    if (!docs.length) { box.innerHTML = '<div class="fg-leer"><p>Noch nichts freigegeben. In «Meine Medien» beim Überfahren einer Drucksache auf das Siegel tippen und die Abteilungen wählen.</p><div class="fg-bsp" aria-hidden="true"><span class="fg-bsp__blatt"><i></i><i></i><i></i></span><span><b>So sieht eine Freigabe aus</b><small>Menükarte am Tisch · frei für Küche und Service</small><em>Jede genannte Abteilung druckt sie ohne Rückfrage.</em></span></div></div>'; return; }
    K.ABTEILUNGEN.forEach(a => {
      const l = docs.filter(d => d.freigabe.abteilungen.includes(a.k)); if (!l.length) return;
      const sek = document.createElement('section'); sek.className = 'fg-abt';
      sek.innerHTML = `<div class="fg-abt__kopf"><span class="fg-abt__foto" style="background-image:url('${DS.bildUrl(DS.M, a.foto, true)}')"></span><div><b>${esc(a.t)}</b><small>${l.length} ${l.length === 1 ? 'Drucksache' : 'Drucksachen'} sofort verwendbar</small></div></div>`;
      const r = document.createElement('div'); r.className = 'atelier wv ms-buehne kv-buehne'; l.forEach((d, i) => r.appendChild(docStueck(d, i))); sek.appendChild(r); box.appendChild(sek);
      requestAnimationFrame(() => reihen(r));
    });
  }
  /* Beispiele (Robert 16.10.2026: «6 Stück als Beispiel, damit man sieht, wie das aussieht»): sechs Drucksachen aus echten Vorlagen des Hauses,
     gemischt in Art und Format, deutlich als Beispiel markiert. Sie stehen in «Zuletzt bearbeitet» und «Meine Medien», solange das Haus nichts Eigenes
     gespeichert hat; danach verschwinden sie aus den Listen. Einmal je Browser angelegt (Merker ds-<haus>-beispiele2). */
  const istBeispiel = d => !!(d && d.beispiel);
  const eigeneDocs = () => Object.values(st().alleDocs()).filter(d => !istBeispiel(d));
  const sichtbareDocs = () => { const alle = Object.values(st().alleDocs()); return alle.some(d => !istBeispiel(d)) ? alle.filter(d => !istBeispiel(d)) : alle; };
  function beispieleAnlegen() {
    const schl = `ds-${st().haus}-beispiele3`; try { if (localStorage.getItem(schl)) return; } catch (e) { return; }
    const abt = k => (K.ABTEILUNGEN.find(a => a.k === k) || { vorlagen: [] }).vorlagen, H = K.HINWEISE.find(x => /Heute ausgebucht/.test(x.n));
    const na = K.ANLAESSE.find(a => /^abend-/.test(a.k)) || K.ANLAESSE[0], mot = na ? K.motive(na) : [];
    const B = [
      { x: mot.find(v => /^Plakat, vorne und hinten$/.test(v.n)), kontext: na && na.t + ' · ' + na.z },
      { x: abt('plakate').find(v => /Februar 2025/.test(v.n)) },
      { x: mot.find(v => /^Menükarte am Tisch$/.test(v.n)), kontext: na && na.t + ' · ' + na.z },
      { x: abt('drinks').find(v => /^Fatwashing$/.test(v.n)) },
      { x: abt('tafel').find(v => /^Platzkarte$/.test(v.n)) },
      H && { x: H },
    ].filter(b => b && b.x);
    const alle = docsLesen(), heute = new Date().toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
    Object.keys(alle).forEach(k => { if (alle[k].beispiel && !freigabe(alle[k]) || (alle[k].beispiel && alle[k].freigabe && alle[k].freigabe.wer === 'Beispiel')) delete alle[k]; });   // die drei vom Morgen
    B.forEach((b, i) => {
      const x = JSON.parse(JSON.stringify(b.x)); if (b.fill) b.fill(x);
      const d = kvDoc(x, b.kontext || ''); d.id = 'dbsp' + i + Date.now().toString(36); d.beispiel = true; d.geaendert = Date.now() - i * 60000;
      if (b.fg) d.freigabe = { abteilungen: b.fg.filter(k => K.ABTEILUNGEN.some(a => a.k === k)), wer: 'Beispiel', datum: heute };
      alle[d.id] = d;
    });
    if (docsSchreiben(alle)) try { localStorage.setItem(schl, '1'); } catch (e) { }
  }
  function neuStueck() {
    const f = DS.FORMATE.a5h, [W, H] = groesse(f, GROSS());
    const p = document.createElement('span'); p.className = 'papier papier--vorn papier--leer'; p.style.width = W + 'px'; p.style.height = H + 'px';
    p.innerHTML = `<span class="papier__plus">${PLUS}</span>`;
    return stueckKarte({ akt: 'neu' }, 0, [p], H, 'Neues Medium', 'Beschreiben oder Vorlage wählen', null);
  }
  /* Eigenen Entwurf hochladen (06.11.2026, Gespräch mit Rudi am 02.11.: «die Entwürfe gerne selber einstellen, hochladen … um sie dann in der Werkstatt nochmal zu bearbeiten»):
     Bild aus Canva, Illustrator oder vom Handy wird zum ganzen Blatt im passenden Format; darauf Texte, Zeichen und Fotos wie bei jeder Vorlage. */
  function entwurfStueck() {
    const f = DS.FORMATE.a5h, [W, H] = groesse(f, GROSS());
    const p = document.createElement('span'); p.className = 'papier papier--vorn papier--leer papier--hoch'; p.style.width = W + 'px'; p.style.height = H + 'px';
    p.innerHTML = `<span class="papier__plus papier__plus--hoch"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M6 10l6-6 6 6M5 20h14"/></svg></span>`;
    return stueckKarte({ akt: 'entwurf-datei' }, 0, [p], H, 'Eigener Entwurf', 'Datei hochladen, bearbeiten', null);
  }
  function entwurfWaehlen() {
    let i = $('#entwurfDatei');
    if (!i) { i = document.createElement('input'); i.type = 'file'; i.id = 'entwurfDatei'; i.accept = 'image/jpeg,image/png,image/heic,image/webp,.jpg,.jpeg,.png,.heic,.webp'; i.hidden = true; document.body.appendChild(i);
      i.addEventListener('change', async () => { const d = i.files && i.files[0]; i.value = ''; if (d) { await st().entwurfAusDatei(d); zu(); } }); }
    i.click();
  }
  async function mailAktion(akt, id, karte) {
    const S = st(), l = mailsLesen(), m = l.find(x => x.id === id); if (!m) return;
    if (akt === 'umbenennen') {
      const n = karte.querySelector('[data-name]');
      const f = document.createElement('input'); f.className = 'doc__umbenennen'; f.value = m.name || ''; n.replaceWith(f); f.focus(); f.select();
      let fertigT = false;
      const fertig = ok => { if (fertigT) return; fertigT = true; const v = f.value.trim(); if (ok && v) { m.name = v; if (m.doc) m.doc.name = v; m.geaendert = Date.now(); mailsSchreiben(l); } zeichneBibliothek(); filtern(); };
      f.addEventListener('keydown', e => { if (e.key === 'Enter') fertig(true); if (e.key === 'Escape') fertig(false); e.stopPropagation(); });
      f.addEventListener('blur', () => fertig(true)); f.addEventListener('click', e => e.stopPropagation());
    } else if (akt === 'kopie') {
      const k = JSON.parse(JSON.stringify(m)); k.id = 'm' + Date.now().toString(36); k.name = (m.name || 'E-Mail') + ' (Kopie)'; if (k.doc) k.doc.name = k.name; k.geaendert = Date.now();
      l.unshift(k); mailsSchreiben(l); zeichneBibliothek(); filtern(); S.melde('Kopie angelegt.');
    } else if (akt === 'loeschen') {
      const ja = await S.dialog(`<h2>Löschen?</h2><p>«${esc(m.name || 'E-Mail')}» wird aus deinen E-Mails entfernt.</p>`, [{ t: 'Behalten', v: false }, { t: 'Löschen', v: true, haupt: true }]);
      if (ja === true) { karte.classList.add('weg'); setTimeout(() => { mailsSchreiben(mailsLesen().filter(x => x.id !== id)); zeichneBibliothek(); waehleAnsicht(ansicht); }, 420); }
    }
  }
  function zeichneBibliothek() {
    const docs = sichtbareDocs().sort((a, b) => b.geaendert - a.geaendert), nurBeispiele = docs.length && docs.every(istBeispiel);
    const alle = docs.map(d => ({ t: d.geaendert, el: i => docStueck(d, i) })).concat(mailsLesen().map(m => ({ t: m.geaendert, el: i => mailKarte(m, i) }))).sort((a, b) => b.t - a.t);
    $('#meineZahl').textContent = alle.length;
    $('#meineSatz').textContent = nurBeispiele ? `${alle.length} Beispiele aus den Vorlagen des Hauses. Sobald du selbst etwas speicherst, machen sie Platz.` : alle.length ? `${alle.length} ${alle.length === 1 ? 'Medium' : 'Medien'}, gespeichert in diesem Browser` : 'Noch keine Medien angelegt';
    const box = $('#bibliothek'); box.innerHTML = ''; box.className = 'atelier wv ms-buehne kv-buehne';
    box.appendChild(neuStueck()); box.appendChild(entwurfStueck());
    alle.forEach((x, i) => box.appendChild(x.el(i + 2)));
    if ($('#startZuletztSatz')) $('#startZuletztSatz').hidden = !nurBeispiele;
    const zl = $('#startZuletzt'); zl.innerHTML = ''; zl.className = 'atelier wv ms-buehne kv-buehne';
    if (!alle.length || nurBeispiele) zl.appendChild(neuStueck());
    alle.slice(0, nurBeispiele ? 5 : 6).forEach((x, i) => zl.appendChild(x.el(i + (nurBeispiele ? 1 : 0))));
    requestAnimationFrame(() => { reihen(box); reihen(zl); });
    $('#startZu').hidden = !(st().doc() && !st().doc().platzhalter);
  }

  /* ---------- Katalog des Hauses: Abteilungen, Anlässe & Events, Hinweise, Newsletter (Daten in katalog.js) ---------- */
  const K = window.DSKATALOG || { ABTEILUNGEN: [], HINWEISE: [], ANLAESSE: [], motive: () => [], NEWSLETTER: [] };
  const PFEIL_SVG = '<svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
  const WO = { haus: 'Im Haus', stadt: 'In der Region', region: 'In der Region' };
  const heute0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const kommend = () => K.ANLAESSE.filter(a => new Date(a.bis + 'T00:00') >= heute0()).sort((x, y) => (new Date(x.von + 'T00:00') < heute0()) - (new Date(y.von + 'T00:00') < heute0()) || x.von.localeCompare(y.von));
  /* Fundliste 23: heissen zwei Anlässe gleich («Culinarium»), nennt der Titel den Monat («Culinarium im November») */
  const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  function anlassTitel(a) { const l = (typeof K !== 'undefined' && K.anlaesse) ? K.anlaesse : null; const gleich = (l || []).filter(x => x.t === a.t).length > 1 || /^Culinarium$/.test(a.t); return gleich && a.von ? `${a.t} im ${MON[+a.von.slice(5, 7) - 1]}` : a.t; }
  function kachel(a, i, typ) {
    const ev = typ === 'event', laeuft = ev && new Date(a.von + 'T00:00') <= heute0();
    const foto = ev ? a.fotos[0] : a.foto, dazu = Z ? ((ev ? Z.anlass[a.k] : Z.abteilung[a.k]) || {}).n || 0 : 0, zahl = zahlDE((ev ? anlassListe(a).length : a.vorlagen.length) + dazu);
    return `<div class="wo" data-${typ}="${a.k}" role="button" tabindex="0" style="--i:${i}" aria-label="${esc(ev ? anlassTitel(a) : a.t)}">
      <span class="wo__k"><span class="wo__bild" data-bg="${DS.bildUrl(DS.M, foto, true)}"></span><span class="wo__licht"></span>${ev ? `<span class="wo__datum">${laeuft ? 'Läuft · ' : ''}${esc(a.z)}</span>` : ''}</span>
      <span class="wo__n"><span><b>${zus(ev ? anlassTitel(a) : a.t)}</b><small>${ev ? WO[a.wo] + ' · ' : ''}${zahl === 1 ? 'Eine Vorlage' : zahl + ' Vorlagen'}</small></span><i>${PFEIL_SVG}</i></span></div>`;
  }
  /* Eine fertige Vorlage als Karte: echte Vorschau, Klick öffnet sie im Studio (ohne KI, ohne Kosten) */
  let kvListe = [];
  function kvDoc(x, kontext) {
    const seiten = [{ vorlage: x.vorlage, ton: x.ton, inhalt: x.inhalt }];
    if (x.rueck) seiten.push({ vorlage: x.rueck.vorlage, ton: x.ton, inhalt: x.rueck.inhalt });
    return DS.dokument(DS.M, { name: (kontext ? kontext + ' · ' : '') + x.n, format: x.format, seiten });
  }
  function kvRaster(box, liste, kontext) {
    box.innerHTML = ''; box.className = 'atelier wv ms-buehne kv-buehne';
    liste.forEach((x, i) => {
      const g = GROSS(), nr = kvListe.push({ x, kontext }) - 1, doc = kvDoc(x, kontext), f = DS.FORMATE[x.format] || DS.FORMATE.a5h, [, H] = groesse(f, g);
      let bl = []; try { bl = [doc.seiten.length > 1 ? blattDoc(doc, g, 'papier--hinten', 1) : null, blattDoc(doc, g, 'papier--vorn', 0)]; } catch (e) { console.warn(x.n, e); }
      box.appendChild(stueckKarte({ kv: nr }, i, bl, H, x.n, `${f ? f.name : ''} · ${x.wo || ''}`, 'Übernehmen'));
    });
    requestAnimationFrame(() => reihen(box));
  }
  /* Ein Blatt frei auf Blau für jede Liste (Robert 12.10.2026, 04:10: «alles so machen, wie die mit dem blauen Hintergrund vorher waren»):
     dieselbe Form wie «Arten und Vorlagen». Grösse aus dem echten Format (gestaucht), Name in Serif, Format in Versalien, beim Überfahren der Knopftext. */
  const groesse = (f, basis) => { let H = hoeheVon(f, basis), W = H * f.b / f.h; const m = Math.min(basis * 1.32, BREIT()); if (W > m) { W = m; H = W * f.h / f.b; } return [W, H]; };
  function stueckKarte(attr, i, blaetter, H, name, info, nimm, kl) {
    const b = document.createElement('button'); b.className = 'stueck stueck--vorlage' + (kl ? ' ' + kl : ''); b.style.setProperty('--i', Math.min(i, 8));
    b.style.setProperty('--r', ([-1.2, 1, -.6, 1.4, -1, .8][i % 6]) + 'deg');
    Object.entries(attr).forEach(([k, v]) => b.dataset[k] = v);
    const bu = document.createElement('span'); bu.className = 'stueck__buehne'; bu.style.height = Math.ceil(H + 36) + 'px';
    const sa = document.createElement('span'); sa.className = 'stueck__satz'; blaetter.forEach(x => x && sa.appendChild(x)); bu.appendChild(sa); b.appendChild(bu);
    b.insertAdjacentHTML('beforeend', `<b class="zl__name">${esc(name)}</b><em class="stueck__format">${esc(info)}</em>${nimm ? `<small class="stueck__satztext stueck__nimm">${esc(nimm)}</small>` : ''}`);
    return b;
  }
  function leerStueck(attr, f, basis, info) {
    const [W, H] = groesse(f, basis);
    const p = document.createElement('span'); p.className = 'papier papier--vorn papier--leer'; p.style.width = W + 'px'; p.style.height = H + 'px';
    p.innerHTML = `<span class="papier__plus">${PLUS}</span>`;
    return stueckKarte(attr, 0, [p], H, 'Leeres Blatt', info, 'Öffnen');
  }
  function nimmVorlageKv(nr) { const { x, kontext } = kvListe[nr]; st().oeffne(kvDoc(x, kontext)); zu(); }

  function zeichneWochen() {
    setzeKacheln($('#startWochen'), kommend().slice(0, 4).map((a, i) => kachel(a, i, 'event')).join(''));
    setzeKacheln($('#startAbteilungen'), K.ABTEILUNGEN.map((a, i) => kachel(a, i, 'abteilung')).join(''));
    vorholen();
    /* Grosse Kacheln (Hauptanlass, Mosaik gross) bekommen das grosse Foto, aber erst wenn es fertig dekodiert ist; bis dahin steht das kleine da */
    nachBereit(() => ['#startWochen>.wo:first-child', '#startAbteilungen>.wo:nth-child(1)', '#startAbteilungen>.wo:nth-child(7)'].forEach(sel => {   // erst wenn die Übersicht steht (30.10.2026: das grosse Foto nahm dem ersten Bildschirm die Leitung)
      const w = document.querySelector(sel), b = w && w.querySelector('.wo__bild'); if (!b || b.dataset.gross) return;
      const u = grossFoto(w.dataset.event ? 'event' : 'abteilung', w.dataset.event || w.dataset.abteilung); if (!u) return;
      b.dataset.gross = 1; hole(u).then(() => { bgSetzen(b); b.style.backgroundImage = `url('${u}')`; });
    }));
    /* Leiste: wie viele Vorlagen hinter jedem Punkt liegen (fertig gesetzte des Katalogs + passende der Bibliothek); ohne zahlen.json die alte Zählung */
    $('#evZahl').textContent = zahlDE(kommend().reduce((m, a) => m + anlassListe(a).length, 0) + (Z ? Z.anlaesse.n : 0));
    $('#abZahl').textContent = zahlDE(K.ABTEILUNGEN.reduce((m, a) => m + a.vorlagen.length, 0) + (Z ? Z.gesamt : 0));
    $('#hiZahl').textContent = zahlDE(K.HINWEISE.length + (Z ? Z.hinweise.n : 0)); const nl = $('#nlZahl'); if (nl) nl.textContent = K.NEWSLETTER.length;
    zeichneUmfangKnoepfe();
  }
  /* 15.10.2026: Kacheln bleiben stehen, wenn sich nur die Zahlen ändern (kein zweites Aufbauen, kein Flackern der Fotos) */
  function setzeKacheln(box, html) {
    if (box.__html === html) return;
    const neu = document.createElement('div'); neu.innerHTML = html;
    const alt = [...box.children], nk = [...neu.children], schl = e => e.outerHTML.replace(/<small>[^<]*<\/small>/g, '').replace(/ data-gross="1"/g, '').replace(/background-image:[^;"]*;?/g, '').replace(/ style=""/g, '').replace(/ data-bg="[^"]*"/g, '');
    if (alt.length && alt.length === nk.length && alt.every((e, i) => schl(e) === schl(nk[i]))) {
      alt.forEach((e, i) => { const a = e.querySelector('.wo__n small'), b = nk[i].querySelector('.wo__n small'); if (a && b && a.textContent !== b.textContent) a.textContent = b.textContent; });
    } else box.innerHTML = html;
    box.__html = html;
  }
  /* 15.10.2026: grosse Fotos der Kacheln vorab holen, damit die Ansicht eines Anlasses oder einer Abteilung mit fertigem Bild ankommt */
  const geholt = {};
  function hole(url) {
    if (!geholt[url]) { const im = new Image(); im.decoding = 'async'; im.src = url; geholt[url] = (im.decode ? im.decode() : Promise.resolve()).catch(() => { }).then(() => im); }
    return geholt[url];
  }
  /* Grosses Bild der Ansicht eines Anlasses: rund doppelte Anzeigebreite (30.10.2026; vorher die 2400er-Fassung, bis 733 KB je Foto) */
  const kdBreite = () => (innerWidth > 900 ? Math.min(660, innerWidth * .46) : innerWidth) * Math.max(1.5, Math.min(2, devicePixelRatio || 1)) / 1.6;
  const grossFoto = (typ, key) => { const a = (typ === 'event' ? K.ANLAESSE : K.ABTEILUNGEN).find(x => x.k === key); return a ? DS.bildFuer(DS.M, typ === 'event' ? a.fotos[0] : a.foto, kdBreite()) : null; };
  /* Vorholen erst, wenn die Übersicht steht, und nur für Kacheln nahe am Bildschirm; beim Zeigen auf eine Kachel sofort (30.10.2026, Start gedrosselt) */
  let vorIO = null;
  function vorholen() {
    const u = e => grossFoto(e.dataset.event ? 'event' : 'abteilung', e.dataset.event || e.dataset.abteilung);
    const los = () => { if (!vorIO && window.IntersectionObserver) vorIO = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { vorIO.unobserve(x.target); const v = u(x.target); if (v) hole(v); } }), { rootMargin: '200px 0px' });
      document.querySelectorAll('#start [data-event], #start [data-abteilung]').forEach(e => { if (vorIO) vorIO.observe(e); else { const v = u(e); if (v) hole(v); } }); };
    nachBereit(() => (window.requestIdleCallback || (f => setTimeout(f, 300)))(los));
  }
  function nachBereit(f) {
    const s = $('#start'); if (s.classList.contains('bereit')) return f();
    new MutationObserver((_, mo) => { if (s.classList.contains('bereit')) { mo.disconnect(); f(); } }).observe(s, { attributes: true, attributeFilter: ['class'] });
  }
  /* Fotos der Kacheln (data-bg) erst nahe am Bildschirm setzen (30.10.2026): beim Start lädt nur, was man sieht */
  let bgIO = null;
  function bgSetzen(e) { if (e.dataset.bg) { e.style.backgroundImage = `url('${e.dataset.bg}')`; delete e.dataset.bg; } }
  function bgBeobachten(root) {
    const l = (root || document).querySelectorAll('#start [data-bg]'); if (!l.length) return;
    if (!window.IntersectionObserver) return l.forEach(bgSetzen);
    const h = innerHeight + 600; l.forEach(e => { if (e.closest('[hidden]')) return; const q = e.getBoundingClientRect(); if (q.width && q.bottom > -600 && q.top < h) bgSetzen(e); });   // Sichtbares gleich, ohne einen leeren Moment
    if (!bgIO) bgIO = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { bgIO.unobserve(x.target); bgSetzen(x.target); } }), { root: $('#start .ms-haupt'), rootMargin: '600px 0px' });
    l.forEach(e => { if (e.dataset.bg) bgIO.observe(e); });
  }
  let bgMO = null;
  function bgWache() { if (bgMO) return; const s = $('#start'); bgBeobachten(s); bgMO = new MutationObserver(() => bgBeobachten(s)); bgMO.observe(s, { childList: true, subtree: true });
    /* Tor 2 (30.10.2026, K4): steht die Übersicht, kommen die übrigen kleinen Kachelfotos im Leerlauf nach; keine Kachel bleibt leer, auch ohne Scrollen */
    nachBereit(() => setTimeout(() => (window.requestIdleCallback || (f => f()))(() => s.querySelectorAll('[data-bg]').forEach(e => { if (!e.closest('[hidden]')) bgSetzen(e); })), 1200)); }
  let evFilter = 'alle', katalogGezeichnet = {};
  /* Verbindung zur Bibliothek (12.10.2026): Z = vorlagen/zahlen.json (aus _qa/vorlagen_zahlen.py), vUmfang = Ausschnitt der Galerie (Abteilung, Anlass, Hinweise) */
  let Z = null, vUmfang = null;
  /* Anlass ↔ Bibliothek (29.10.2026): Vorlagen mit Feld «anlass» (dirty-chicken, abend-…) zählen und erscheinen beim Anlass, neben den Motiven des Katalogs */
  let AB = {};
  const anlassListe = a => [...K.motive(a), ...(AB[a.k] || [])];
  function ladeAnlaesse() { ladeAlle().then(l => { const neu = {}; l.forEach(({ v, a }) => { if (v.anlass) (neu[v.anlass] = neu[v.anlass] || []).push({ n: v.titel, art: a.name, wo: a.name + (v.bereich ? ' · ' + v.bereich : ''), format: DS.FORMATE[v.format] ? v.format : a.format, vorlage: v.vorlage, ton: v.ton, inhalt: v.inhalt, stil: v.stil, rueck: v.rueck || null }); });
    AB = neu; zeichneWochen(); if (ansicht === 'events') zeichneEvents(); }).catch(() => { }); }
  const zahlDE = n => n.toLocaleString('de-CH');
  function zeichneEvents() {
    const l = kommend().filter(a => evFilter === 'alle' || (evFilter === 'haus' ? a.wo === 'haus' : a.wo !== 'haus'));
    const monate = {};
    l.forEach(a => { const d = new Date(a.von + 'T00:00'), laeuft = d < heute0(), key = laeuft ? '0000' : a.von.slice(0, 7); (monate[key] = monate[key] || []).push(a); });
    let n = 0;
    /* Je Monat eine Zeile: Monat gross links, rechts die Anlässe über die volle Breite (Robert 16.10.2026: «kein leerer Raum, luxuriöser»).
       Raster mit sechs Spalten: 1 Anlass = breite Kachel mit Text daneben, 2 und 4 = halb/halb, sonst Drittel; ein Rest von eins wird breit, von zwei halb. */
    const art = (i, z) => { if (z === 1) return 'breit'; if (z === 2 || z === 4) return 'halb'; const rest = z % 3, ab = z - rest; return i < ab ? 'drittel' : rest === 1 ? 'breit' : 'halb'; };
    $('#evListe').innerHTML = Object.keys(monate).sort().map(m => {
      const d = new Date((m === '0000' ? heute0().toISOString().slice(0, 7) : m) + '-01T00:00'), z = monate[m].length;
      const kopf = m === '0000' ? `<b>Jetzt</b><small>Läuft gerade · ${z} ${z === 1 ? 'Anlass' : 'Anlässe'}</small>`
        : `<b>${d.toLocaleDateString('de-CH', { month: 'long' })}</b><small>${d.getFullYear()} · ${z} ${z === 1 ? 'Anlass' : 'Anlässe'}</small>`;
      return `<section class="ev-monat"><div class="ev-monat__kopf">${kopf}</div><div class="ms-wochen ev-raster">${monate[m].map((a, i) => {
        const k = art(i, z); let h = kachel(a, n++, 'event').replace('class="wo"', `class="wo wo--${k}"`);
        if (k === 'breit' && a.satz) h = h.replace('</small></span><i>', `</small><span class="wo__satz">${esc(a.satz)}</span></span><i>`);
        return h;
      }).join('')}</div></section>`;
    }).join('');
  }
  function zeichneAbteilungen() { $('#abListe').innerHTML = K.ABTEILUNGEN.map((a, i) => kachel(a, i, 'abteilung')).join(''); }
  function zeichneListe(was) {
    if (katalogGezeichnet[was]) return; katalogGezeichnet[was] = 1;
    if (was === 'hinweise') kvRaster($('#hiRaster'), K.HINWEISE, 'Hinweis');
    if (was === 'newsletter') kvRaster($('#nlRaster'), K.NEWSLETTER, '');
  }
  /* Von Abteilung, Anlass oder Hinweisen in die Bibliothek: derselbe Galerie-Aufbau wie «Alle Vorlagen», nur auf den Ausschnitt begrenzt */
  function zeigeUmfang(code) {
    if (!Z) return zeigeWeg('alle');
    const [was, k] = code.split(':'); let u = null;
    if (was === 'abteilung') { const a = K.ABTEILUNGEN.find(x => x.k === k), z = Z.abteilung[k]; if (a && z) u = { titel: a.t, bereiche: z.bereiche, satz: `Alle Vorlagen für ${a.t}. Such nach einem Wort oder grenz nach Art und Grund ein.` }; }
    if (was === 'anlass') { const a = K.ANLAESSE.find(x => x.k === k), z = Z.anlass[k]; if (a && z) u = { titel: a.t, q: z.q, satz: `Vorlagen aus der Bibliothek, in denen «${z.q}» vorkommt. Das Suchwort lässt sich ändern.` }; }
    if (was === 'hinweise') u = { titel: 'Hinweise im Haus', arten: Z.hinweise.arten, satz: 'Störungen, Aushänge, Hinweiskarten und Türhänger für jeden Bereich des Hauses.' };
    if (was === 'anlaesse') u = { titel: 'Festtage und Ausflüge', bereiche: Z.anlaesse.bereiche, satz: 'Vorlagen für die Festtage im Haus und für Ausflüge in die Region.' };
    zeigeWeg('alle', u);
  }
  const lnk = (umfang, text) => `<button class="kn kn--mehr" data-umfang="${umfang}"><span>${text}</span><i><svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></i></button>`;
  function zeichneUmfangKnoepfe() {
    if (!Z) return;
    const h = $('#hiAlle'); if (h) h.innerHTML = lnk('hinweise', `${zahlDE(Z.hinweise.n)} weitere Hinweise für jeden Bereich ansehen`);
    const e = $('#evAlle'); if (e) e.innerHTML = lnk('anlaesse', `${zahlDE(Z.anlaesse.n)} Vorlagen für Festtage und Ausflüge ansehen`);
    const a = $('#abAlle'); if (a) a.innerHTML = `<button class="kn kn--mehr" data-st="alle"><span>Alle ${zahlDE(Z.gesamt)} Vorlagen nach Bereich durchsuchen</span><i><svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></i></button>`;
  }
  /* Anlass oder Abteilung im Detail: alle fertigen Vorlagen dazu */
  let offen = null, detailVon = 'events';
  function zeigeDetailBereit(typ, key) {
    const u = grossFoto(typ, key); if (!u) return zeigeDetail(typ, key);
    const t = zeigeDetail.__t = {}; let fertig = false;
    const weiter = () => { if (!fertig && zeigeDetail.__t === t) { fertig = true; zeigeDetail(typ, key); } };
    hole(u).then(weiter); setTimeout(weiter, 450);
  }
  function zeigeDetail(typ, key) {
    const a = (typ === 'event' ? K.ANLAESSE : K.ABTEILUNGEN).find(x => x.k === key); if (!a) return;
    offen = { typ, a }; detailVon = typ === 'event' ? (ansicht === 'start' ? 'start' : 'events') : (ansicht === 'start' ? 'start' : 'abteilungen');
    const ev = typ === 'event', liste = ev ? anlassListe(a) : a.vorlagen, foto = ev ? a.fotos[0] : a.foto;
    const bib = Z ? (ev ? Z.anlass[a.k] : Z.abteilung[a.k]) : null, mehr = bib ? bib.n : 0;
    const zurueck = { start: 'Übersicht', events: 'Anlässe & Events', abteilungen: 'Abteilungen' }[detailVon];
    $('#msDetail').innerHTML = `<button class="ms-lnk ms-lnk--zurueck" data-ansicht="${detailVon}"><svg viewBox="0 0 24 24"><path d="M19 12H5m6-6-6 6 6 6"/></svg><span>${zurueck}</span></button>
      <div class="kd">
        <div class="wo kd__bild"><span class="wo__k"><span class="wo__bild" style="background-image:url('${DS.bildFuer(DS.M, foto, kdBreite())}')"></span><span class="wo__licht"></span>${ev ? `<span class="wo__datum">${esc(a.z)}</span>` : ''}</span></div>
        <div class="kd__text">${ev ? `<em class="kd__wo">${WO[a.wo]} · ${esc(a.ort)}</em>` : ''}<h1>${esc(ev ? anlassTitel(a) : a.t)}</h1><p>${esc(a.satz)}</p>
          <div class="kd__zahl"><b>${zahlDE(liste.length + mehr)}</b><span>${ev ? `${liste.length === 1 ? 'Motiv' : 'Motive'}, fertig gesetzt im Stil des Hauses${liste.length ? ': ' + [...new Set(liste.map(x => x.art || x.n))].join(', ') : ''}` : 'Vorlagen für diese Abteilung, fertig gesetzt im Stil des Hauses'}</span></div>
          <div class="ms-feld ms-feld--klein"><span class="ms-feld__ic"><svg viewBox="0 0 24 24"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/></svg></span><textarea id="kampFrei" rows="1" placeholder="Etwas anderes? Kurz beschreiben …"></textarea><button class="kn knopf--voll glanz-kn" data-st="kfrei"><span>Fünf Entwürfe</span><i>${PFEIL_SVG}</i></button></div></div>
      </div>
      <div class="ms-zeile"><h2>${ev ? 'Die Motive' : 'Die Vorlagen'}</h2><span class="ms-leise">Antippen öffnet die Vorlage im Studio</span></div>
      <div class="ms-raster" id="detailRaster"></div>
      ${mehr ? `<div class="vb__alle"><button class="kn kn--mehr" data-umfang="${ev ? 'anlass' : 'abteilung'}:${a.k}"><span>${zahlDE(mehr)} weitere Vorlagen ${ev ? 'zu' : 'für'} ${esc(a.t)} ansehen</span><i><svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></i></button></div>` : ''}`;
    waehleAnsicht('detail');
    passeFeld($('#kampFrei'));
    kvRaster($('#detailRaster'), liste, a.t);
  }
  /* Feld «Etwas anderes für …» wächst mit dem Satz (Robert 29.10.2026: «Sowas kann man halt auch nicht wirklich erkennen und lesen»): so viele Zeilen,
     wie Platzhalter oder Eingabe brauchen, gemessen an der echten Breite; neu beim Tippen und bei anderer Fensterbreite */
  function passeFeld(t) {
    if (!t) return;
    const g = getComputedStyle(t), lh = parseFloat(g.lineHeight) || parseFloat(g.fontSize) * 1.25, pad = parseFloat(g.paddingTop) + parseFloat(g.paddingBottom);
    let zeilen = 1;
    if (t.value) { t.style.height = 'auto'; zeilen = Math.max(1, Math.round((t.scrollHeight - pad) / lh)); }
    else { const c = (passeFeld.c = passeFeld.c || document.createElement('canvas').getContext('2d')); c.font = `${g.fontWeight} ${g.fontSize} ${g.fontFamily}`; zeilen = Math.max(1, Math.ceil(c.measureText(t.placeholder).width / Math.max(40, t.clientWidth - 2))); }
    t.style.height = Math.ceil(zeilen * lh + pad) + 'px';
    if (!t.dataset.feld) {
      t.dataset.feld = 1; t.addEventListener('input', () => passeFeld(t));
      if (window.ResizeObserver) { let b = 0; new ResizeObserver(() => { if (Math.abs(t.clientWidth - b) > 1) { b = t.clientWidth; passeFeld(t); } }).observe(t); }   // Breite erst nach dem Aufbau endgültig
    }
  }
  addEventListener('resize', () => { clearTimeout(passeFeld.r); passeFeld.r = setTimeout(() => passeFeld(document.getElementById('kampFrei')), 120); });
  /* Fundliste 29.10., 03: der Platzhalter der grossen Felder steht einzeilig; wird das Feld zu schmal, gilt die kurze Fassung «Zum Beispiel: Plakat» */
  function kurzPlatz(t) {
    if (!t) return; t.dataset.lang = t.dataset.lang || t.placeholder;
    const g = getComputedStyle(t), c = (kurzPlatz.c = kurzPlatz.c || document.createElement('canvas').getContext('2d')); c.font = `${g.fontWeight} ${g.fontSize} ${g.fontFamily}`;
    t.placeholder = [t.dataset.lang, 'Etwa: ein Plakat', 'Beschreiben …'].find(x => c.measureText(x).width <= t.clientWidth - 4) || 'Beschreiben …';   // Tor 2: nie zweizeilig
  }
  ['startFrei', 'startDirekt'].forEach(id => { const t = document.getElementById(id); if (!t) return; kurzPlatz(t); if (window.ResizeObserver) new ResizeObserver(() => kurzPlatz(t)).observe(t); if (document.fonts) document.fonts.ready.then(() => kurzPlatz(t)); });
  /* Schnell anlegen: Arten mit echten Proportionen */
  function zeichneSchnell() {
    $('#startSchnell').innerHTML = ARTEN.filter(a => !a.leer).slice(0, 8).map((a, i) => { const f = DS.FORMATE[a.format], k = 46 / Math.max(f.b, f.h);
      return `<button class="sf" data-art="${a.key}" style="--i:${i}"><span class="sf__f"><span style="width:${Math.round(f.b * k)}px;height:${Math.round(f.h * k)}px"></span></span><b>${esc(a.name)}</b><small>${esc(f.name)}</small></button>`; }).join('');
  }
  /* Fotos des Hauses */
  const fotoZahlen = B => { const haus = B.filter(b => !['motive', 'weitere'].includes(b.bereich) && b.gruppe !== 'Neue Vorschläge').length, weitere = B.filter(b => b.bereich === 'weitere').length; return { haus, weitere, fotos: haus + weitere, motive: (window.DSPlakat && DSPlakat.motive().length) || B.filter(b => /^pl_/.test(b.key)).length }; };
  let fotoGruppe = 'Alle', fotoF = { s: 'alle', f: 'alle', h: 'alle' };
  function zeichneFotos() {
    const M = DS.M, B = M.bilder || [], T = DS.LIVRE_TEXT, L = !!M.livre;
    const gr = ['Alle', ...(L ? Object.values(T.b).filter(g => B.some(b => b.gruppe === g)) : [...new Set(B.map(b => b.gruppe))])];
    /* Fundliste 15: eine Zahl je Sache, überall dieselbe (Leiste, dieser Satz, Editor «Alle Fotos»): Fotos = vom Haus + weitere der Website; Plakat-Motive = Rudis 13 */
    const fz = fotoZahlen(B);
    $('#fotoZahl').textContent = fz.fotos;
    $('#fotoSatz').textContent = `${fz.fotos} Fotos: ${fz.haus} vom Haus${fz.weitere ? ` und ${fz.weitere} weitere der Website` : ''}. Rudis ${fz.motive} Plakat-Motive stehen unter «Plakat-Motive». Ein Foto wählen, das Studio baut das Medium darum herum.`;
    const reihe = (art, titel, werte) => `<div class="fo-reihe"><span class="fo-reihe__t">${titel}</span>${[['alle', 'Alle'], ...werte].map(([k, t]) => `<button data-f${art}="${k}" class="${fotoF[art] === k ? 'an' : ''}">${esc(t)}</button>`).join('')}</div>`;
    $('#fotoGruppen').innerHTML = `<div class="fo-reihe">${L ? '<span class="fo-reihe__t">Bereich</span>' : ''}${gr.map(g => `<button data-fgruppe="${esc(g)}" class="${g === fotoGruppe ? 'an' : ''}">${esc(g)}</button>`).join('')}</div>`
      + (L ? reihe('s', 'Saison', Object.entries(T.s)) + reihe('f', 'Format', Object.entries(T.f).filter(([k]) => B.some(b => b.format === k))) + reihe('h', 'Herkunft', Object.entries(T.h)) : '');
    const box = $('#fotoRaster');
    if (!box.children.length) box.innerHTML = B.map(b => `<figure class="fo" data-foto="${b.key}" data-gruppe="${esc(b.gruppe)}" data-s="${b.saison || ''}" data-f="${b.format || ''}" data-h="${b.herkunft || ''}" data-alt="${esc((b.alt + ' ' + (b.saison ? T.s[b.saison] + ' ' + T.h[b.herkunft] : '')).toLowerCase())}"><img loading="lazy" decoding="async" src="${DS.bildUrl(DS.M, b.key, true)}" alt="${esc(b.alt)}">${b.ki ? `<b class="fo__ki" title="${esc(T.ki)}">KI</b>` : ''}<figcaption><span>${esc(b.alt)}${b.herkunft === 'frei' || b.ki ? `<small>${esc(b.quelle || '')}</small>` : ''}</span><button class="kn kn--klein ms-kn-anlegen" data-ausfoto="${b.key}"><span>Daraus gestalten</span><i>${PFEIL_SVG}</i></button></figcaption></figure>`).join('');
  }
  function filterFotos(q) {
    const W = (q || '').trim().toLowerCase().split(/\s+/).filter(Boolean); let n = 0;
    document.querySelectorAll('#fotoRaster .fo').forEach(f => { const p = (fotoGruppe === 'Alle' ? f.dataset.gruppe !== 'Plakat-Motive' : f.dataset.gruppe === fotoGruppe) && ['s', 'f', 'h'].every(k => fotoF[k] === 'alle' || f.dataset[k] === fotoF[k]) && W.every(w => f.dataset.alt.includes(w)); f.hidden = !p; if (p) n++; });
    return n;
  }
  /* Farben & Schriften: was das Studio weiss */
  function zeichneMarke() {
    const M = DS.M, F = M.farben || {}, N = M.farbnamen || {}, S = M.schriften || {};
    const rolle = { titel: 'DS-titel', kapitale: 'DS-kapitale', text: 'DS-text', kursiv: 'DS-kursiv', mono: 'DS-mono' };
    const L = M.livre, LS = DS.livreSeite();
    const farbenEinmal = L ? L.farben.filter((c, i, l) => l.findIndex(x => x.h.toLowerCase() === c.h.toLowerCase()) === i) : [];   // Fundliste 16: «Orange» = «Kerze» #EF7649
    const kurzName = n => String(n || '').replace(/^Dirty-Chicken-/, '');   // «Dirty-Chicken-Violett» → «Violett»
    const livreFarben = L ? `<div class="mb__p mb__p--farben"><h3>Farben</h3><div class="mb__farben">${farbenEinmal.map(c => `<span title="${esc(c.r || '')}"><i style="background:${c.h}"></i><b>${esc(kurzName(c.n))}</b><small>${esc(c.h)}</small></span>`).join('')}</div></div>` : '';
    const livreDateien = L ? `<div class="mb__p mb__p--dateien"><h3>Logo, Zeichen, Wortmarke, Tapete</h3><div class="mb__dateien">${L.dateien.filter(d => d.var && d.var.length && d.var[0].dateien.some(x => /\.(svg|png|webp|jpe?g)$/i.test(x))).map(d => { const v = d.var[0], datei = v.dateien.find(x => x.endsWith('.svg')) || v.dateien[0]; return `<a class="mb__datei ${v.grund === 'dunkel' ? 'mb__datei--d' : ''}" href="${DS.livreUrl('dateien/')}${encodeURIComponent(v.dateien[v.dateien.length - 1])}" download><span${d.k === 'tapete' ? ` style="background-image:url('${DS.livreUrl('dateien/')}${encodeURIComponent(datei)}')"` : ''}>${d.k === 'tapete' ? '' : `<img src="${DS.livreUrl('dateien/')}${encodeURIComponent(datei)}" alt="" loading="lazy">`}</span><b>${esc({ logo: 'Logo', quer: 'Logo quer', zeichen: 'Zeichen', zeiger: 'Wappen', name: 'Name', website: 'Original', ehre: 'Auszeichnungen', wortmarke: 'Wortmarke', tapete: 'Tapete', zeile: 'Zeile', dc: 'Dirty Chicken' }[d.k] || d.k)}</b><small>${d.var.length} ${d.var.length === 1 ? 'Fassung' : 'Fassungen'}</small></a>`; }).join('')}</div></div>` : '';
    $('#msMarke').innerHTML = `<div class="ms-titel"><h1>Farben &amp; Schriften</h1><span class="ms-leise">${L ? 'Aus dem Markenbuch des Hauses. ' : ''}Jedes Medium entsteht aus diesen Farben, Schriften, Zeichen und Fotos. Niemand muss sie kennen, das Studio hält sich daran.</span></div>
      <a class="mb-livre" href="${LS}" target="_blank" rel="noopener"><span class="mb-livre__z">${DS.zeichenSvg(M, 'currentColor')}</span><span><b>Das Markenbuch öffnen</b><small>Das Markenbuch: alle ${L ? L.fotos.length : (M.bilder || []).length} Fotos in jeder Grösse, Logos, Farben, Tapete und die Markenprüfung</small></span><i>${PFEIL_SVG}</i></a>
      <div class="mb">
        <div class="mb__p mb__p--zeichen"><span class="mb__z">${DS.zeichenSvg(M, 'currentColor')}</span><b>${esc(M.voll || M.name)}</b><small>${esc(M.zeile || '')}</small></div>
        ${L ? livreFarben : `<div class="mb__p mb__p--farben"><h3>Farben</h3><div class="mb__farben">${Object.entries(F).map(([k, c]) => `<span><i style="background:${c}"></i><b>${esc(N[k] || k)}</b><small>${c}</small></span>`).join('')}</div></div>`}
        <div class="mb__p mb__p--tapete"><h3>Tapete</h3><div class="mb__tapeten">
          <figure class="mb__tw"><span class="mb__tw-flaeche mb__tw-flaeche--nacht" style="background-image:url('${M.basis}tapete-dunkel.webp')"><span class="mb__tw-doc" data-ton="dunkel"></span></span><figcaption><b>Nacht</b>Jede dunkle Fläche steht in Nacht und trägt immer die Tapete: feines Raster mit dem «C». So sehen Plakat-Rückseiten, Hinweise und Karten am Abend aus.</figcaption></figure>
          <figure class="mb__tw"><span class="mb__tw-flaeche mb__tw-flaeche--tag" style="background-image:url('${M.basis}tapete-hell.webp')"><span class="mb__tw-doc" data-ton="hell"></span></span><figcaption><b>Tag</b>Auf Warmweiss liegt die helle Tapete zart darunter, wenn ein Blatt mehr Halt braucht. Im Editor unter Gestalten → Tapete wählbar: Ohne, Dunkel oder Hell.</figcaption></figure>
        </div></div>
        <div class="mb__p mb__p--schriften"><h3>Schriften</h3>${Object.entries(S).map(([k, s]) => `<div class="mb__s"><span style="font-family:'${rolle[k] || 'DS-text'}',serif${k === 'kursiv' ? ';font-style:italic' : ''}">Aa</span><b>${esc(s.familie)}</b><small>${esc(s.wofuer || '')}</small></div>`).join('')}</div>
        <div class="mb__p mb__p--regeln"><h3>Regeln des Hauses</h3><ul>${(M.regeln || []).map(r => DS.regelSichtbar(r)).filter(Boolean).map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
        ${livreDateien}
        <div class="mb__p mb__p--angaben"><h3>Angaben</h3><dl>${[['Adresse', M.adr], ['Telefon', M.tel], ['E-Mail', M.mail], ['Website', M.web]].filter(x => x[1]).map(([l, v]) => `<dt>${l}</dt><dd>${esc(v)}</dd>`).join('')}</dl><button class="ms-lnk" data-ansicht="fotos"><span>${(M.bilder || []).length} Fotos ansehen</span>${PFEIL_SVG}</button></div>
      </div>`;
    /* Tapete erlebbar (Robert 29.10.2026: «sieht auch einfach scheiße leer aus»): auf jeder Fläche ein echtes Blatt des Hauses im passenden Ton */
    document.querySelectorAll('#msMarke .mb__tw-doc').forEach(t => { try { const d = DS.dokument(M, { name: 'Beispiel', format: 'a6h', seiten: [{ vorlage: 'deckel', ton: t.dataset.ton, inhalt: {} }] }); t.appendChild(window.DSStudio.miniBox(d, 0, 190)); } catch (e) { console.warn(e); } });
  }
  /* Begrüssung nach Tageszeit */
  function gruss() {
    const d = new Date(), h = d.getHours();
    $('#msGruss').textContent = h >= 5 && h < 11 ? 'Guten Morgen' : h >= 11 && h < 18 ? 'Schön, dass du da bist' : 'Guten Abend';   // persönlich und warm, ohne Ausrufezeichen (Robert 29.10.); Stunden wie der Tresen (WO.gruss), nachts Abend (30.10.)
    $('#msSatz').textContent = d.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · Was soll heute entstehen?';
  }
  /* gleitende Platte in der Leiste */
  function gleite() {
    const nav = $('#msNav'), an = nav.querySelector('button.an'), g = nav.querySelector('.ms-gleiter');
    if (!an) { g.style.opacity = 0; return; }
    g.style.opacity = 1; g.style.height = an.offsetHeight + 'px'; g.style.transform = `translateY(${an.offsetTop}px)`;
  }
  /* 3D beim Überfahren wie die Kacheln der Website: neigt sich zur Maus, Licht wandert mit */
  let kippt = null;
  function loese(k) { k.classList.remove('kipp'); ['--rx', '--ry', '--gx', '--gy'].forEach(v => k.style.removeProperty(v)); }
  function kippen(e) {
    if (e.pointerType !== 'mouse') return;
    const k = e.target.closest('.wo,.mk:not(.mk--neu)');
    if (kippt && kippt !== k) loese(kippt);
    kippt = k; if (!k) return;
    const r = k.firstElementChild.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    if (r.width > 420) { kippt = null; return; }   // grosse Kacheln (Mosaik, Hauptanlass) bleiben ruhig (16.10.2026)
    k.classList.add('kipp');
    k.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); k.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
    k.style.setProperty('--gx', (x * 70).toFixed(1) + '%'); k.style.setProperty('--gy', (y * 70).toFixed(1) + '%');
  }
  const ANSICHTEN = { start: '#msStart', events: '#msEvents', abteilungen: '#msAbteilungen', hinweise: '#msHinweise', abend: '#msAbend', motive: '#msMotive', newsletter: '#msNewsletter', detail: '#msDetail', meine: '#msMeine', freigegeben: '#msFreigegeben', neu: '#msNeu', fotos: '#msFotos', marke: '#msMarke', livre: '#msLivre', inspiration: '#msInspiration' };
  /* Instagram als Anregung (06.11.2026, Gespräch mit Rudi am 02.11.: «nicht die Instagram-Beiträge bearbeiten, sondern sich Inspiration holen»):
     die eigenen Beiträge (inspiration.json, gebaut von inspiration_bau.py), je Beitrag «Ähnliches entwerfen» → Entwerfen mit dem Beitrag als Ausgangspunkt */
  let INSP = null;
  async function zeichneInspiration() {
    const box = $('#insRaster'); if (!box) return;
    if (!INSP) { try { INSP = (await (await fetch('haeuser/culinarium/inspiration.json', { cache: 'no-store' })).json()).beitraege || []; } catch (e) { INSP = []; } }
    if ($('#insZahl')) $('#insZahl').textContent = INSP.length || '';
    if (!INSP.length) { box.innerHTML = '<p class="ms-leise">Noch keine Beiträge gesammelt.</p>'; return; }
    const datum = d => new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    box.innerHTML = INSP.map((b, i) => `<article class="ins-k" style="--i:${Math.min(i, 8)}">
      <figure class="ins-b">${b.bilder.slice(0, 1).map(f => `<img src="haeuser/culinarium/inspiration/${esc(f)}" alt="" loading="lazy" decoding="async">`).join('')}${b.bilder.length > 1 ? `<span class="ins-n">${b.bilder.length} Bilder</span>` : ''}</figure>
      <div class="ins-t"><span class="ins-d">${esc(datum(b.datum))}</span><p class="ins-text" data-ganz="0">${esc(b.text)}</p>
      <div class="ins-kn"><button class="ins-los" type="button" data-ins="${i}">Ähnliches entwerfen</button><a href="${esc(b.url)}" target="_blank" rel="noopener">Auf Instagram</a></div></div>
    </article>`).join('');
    box.querySelectorAll('.ins-text').forEach(p => p.addEventListener('click', () => { p.dataset.ganz = p.dataset.ganz === '1' ? '0' : '1'; }));
    box.querySelectorAll('[data-ins]').forEach(k => k.addEventListener('click', () => {
      const b = INSP[+k.dataset.ins], kern = b.text.split('\n').map(z => z.trim()).filter(z => z.length > 12).slice(0, 2).join(' ').slice(0, 220);
      const auftrag = `Im Geist unseres Instagram-Beitrags vom ${datum(b.datum)}: «${kern}». Neu gestaltet, nicht kopiert.`;
      waehleAnsicht('neu'); const f = $('#startDirekt'); if (f) { f.value = auftrag; f.focus(); f.dispatchEvent(new Event('input', { bubbles: true })); }
    }));
  }
  function waehleAnsicht(a) {
    if (a !== 'neu' && mitFoto) { mitFoto = null; zeigeMitFotoKopf(); }
    const zahl = Object.keys(st().alleDocs()).length + mailsLesen().length;
    if (ansicht !== a) $('#start .ms-haupt').scrollTo({ top: 0 });
    ansicht = a;
    const nav = a === 'detail' ? detailVon : a;
    document.querySelectorAll('.ms-nav [data-ansicht]').forEach(b => b.classList.toggle('an', b.dataset.ansicht === nav));
    requestAnimationFrame(gleite);
    Object.entries(ANSICHTEN).forEach(([k, sel]) => { $(sel).hidden = k !== a; });
    if (a === 'fotos' || a === 'livre') zeichneFotos();
    if (a === 'fotos' && window.DSLivre) DSLivre.bilderZurueck();
    if (a === 'livre' && window.DSLivre) DSLivre.ansicht();
    if (a === 'events') zeichneEvents();
    if (a === 'inspiration') zeichneInspiration();
    if (a === 'abteilungen') zeichneAbteilungen();
    if (a === 'hinweise' || a === 'newsletter') zeichneListe(a);
    if (a === 'marke') zeichneMarke();
    if ((a === 'abend' || a === 'motive') && window.DSPlakat) DSPlakat.zeige(a);
    if (a === 'freigegeben') zeichneFreigegeben();
    $('#startSuche').placeholder = innerWidth < 700 ? 'Suchen' : innerWidth < 1100 ? (a === 'neu' ? 'Arten suchen …' : a === 'fotos' || a === 'livre' ? 'Fotos suchen …' : 'Medien suchen …') : a === 'neu' ? 'Arten suchen: Plakat, Menükarte, Story …' : a === 'fotos' || a === 'livre' ? 'Fotos suchen: Tafel, Drink, Plakat …' : `In deinen ${zahl} Medien suchen …`;
    filtern();
  }
  async function bibliothekAktion(akt, id, karte) {
    const S = st(), d = S.alleDocs()[id];
    if (akt === 'umbenennen') {
      const n = karte.querySelector('[data-name]');
      const f = document.createElement('input'); f.className = 'doc__umbenennen'; f.value = d.name; n.replaceWith(f); f.focus(); f.select();
      const fertig = ok => { const v = f.value.trim(); if (ok && v) S.umbenennen(id, v); zeichneBibliothek(); filtern(); };
      f.addEventListener('keydown', e => { if (e.key === 'Enter') fertig(true); if (e.key === 'Escape') fertig(false); e.stopPropagation(); });
      f.addEventListener('blur', () => fertig(true)); f.addEventListener('click', e => e.stopPropagation());
    } else if (akt === 'kopie') { S.kopie(id); zeichneBibliothek(); filtern(); S.melde('Kopie angelegt.'); }
    else if (akt === 'freigeben') return freigabeDialog(id);
    else if (akt === 'loeschen') {
      const ja = await S.dialog(`<h2>Löschen?</h2><p>«${esc(d.name)}» wird aus deinen Drucksachen entfernt.</p>`, [{ t: 'Behalten', v: false }, { t: 'Löschen', v: true, haupt: true }]);
      if (ja === true) { karte.classList.add('weg'); setTimeout(() => { S.loeschen(id); zeichneBibliothek(); waehleAnsicht(ansicht); }, 420); }
    } else if (akt === 'pdf') {
      S.melde('PDF wird gesetzt …', 60000);
      try {
        const { bytes } = await DS.pdf(DS.M, d, {});
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        a.download = (d.name || 'drucksache').toLowerCase().replace(/[äöü]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue' }[c])).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.pdf';
        document.body.appendChild(a); a.click(); a.remove(); S.melde('PDF gespeichert.');
      } catch (e) { S.melde('PDF hat nicht geklappt: ' + e.message, 6000); }
    }
  }

  /* ---------- Zweiter Schritt: Art gewählt. Oben beschreiben (fünf Entwürfe), darunter die 100 Vorlagen dieser Art ---------- */
  const BIB = {}; let IDX = null;   // geladene Vorlagen je Art
  async function ladeBibliothek(art) {
    if (BIB[art] !== undefined) return BIB[art];
    try { IDX = IDX || fetch(DS.M.basis + 'vorlagen/index.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : []).catch(() => []);
      const ein = (await IDX).find(x => x.art === art); if (!ein || ein.eingebaut) return (BIB[art] = null);   // Art ohne Bibliothek: keine Anfrage (404)
      const r = await fetch(DS.M.basis + 'vorlagen/' + art + '.json', { cache: 'no-cache' }); const v = r.ok ? (await r.json()).vorlagen : null; BIB[art] = v && v.length ? v : null; }
    catch (e) { BIB[art] = null; }
    return BIB[art];
  }
  /* Galerie (12.10.2026, rund 3000 Vorlagen im Haus): eine Art oder «Alle Vorlagen» über alle Arten, mit Suche und den Filtern Bereich, Grund, Art.
     Gezeichnet wird in Blöcken: nur die Treffer, zwölf Blätter je Block, der nächste Block kurz bevor man ihn erreicht. Die Vorschau eines Blatts wird erst
     gesetzt, wenn es ins Bild kommt und nicht mehr schnell gescrollt wird; Blöcke weit ausserhalb des Bilds werden geleert und halten nur ihre Höhe. */
  const ALLE = { key: 'alle', name: 'Alle Vorlagen', alle: true, format: 'a5h', formate: [], vorlagen: [] };
  const BEREICHE = ["Plakate", "Karte", "Drinks", "Tafel", "Haus", "Dirty Chicken", "Hinweise im Haus", "Anlässe & Events"];
  const PORTION = 12, TON = { dunkel: 'Nacht', hell: 'Warmweiss', creme: 'Plakatpapier', dc: 'Violett' };
  let vFilter = { bereich: 'alle', ton: 'alle', art: 'alle', q: '' }, beobachter = null, fern = null, waechter = null, vAlle = [], vTreffer = [], vDa = 0, vLauf = 0;
  async function ladeAlle() {
    const arten = ARTEN.filter(a => !a.leer), listen = await Promise.all(arten.map(a => ladeBibliothek(a.key)));
    const ix = await IDX; arten.forEach((a, k) => { if (!listen[k] && (ix || []).some(x => x.art === a.key && x.eingebaut)) listen[k] = a.vorlagen.map(([v, t], i) => ({ id: a.key + i, titel: DS.VORLAGEN[v].name, bereich: '', vorlage: v, ton: t, inhalt: inhalt(a, v) })); });   // eingebaute Vorlagen zählen mit wie in index.json (127)
    const out = [], laengste = Math.max(0, ...listen.map(l => (l || []).length));
    for (let i = 0; i < laengste; i++) arten.forEach((a, k) => { const v = (listen[k] || [])[i]; if (v) out.push({ v, a }); });   // reihum, damit die erste Seite alle Arten zeigt
    return out;
  }
  const suchtext = x => {
    if (x.v._t) return x.v._t;
    const i = x.v.inhalt || {}, teile = [x.v.titel, x.v.bereich || '', x.a.name || '', TON[x.v.ton] || ''];
    Object.values(i).forEach(w => { if (typeof w === 'string') teile.push(w); else if (Array.isArray(w)) w.forEach(e => Object.values(e || {}).forEach(y => typeof y === 'string' && teile.push(y))); });
    return x.v._t = teile.join(' ').toLowerCase();
  };
  function zeigeWeg(key, umfang) {
    vUmfang = key === 'alle' && umfang ? umfang : null;
    wahl = key === 'alle' ? (vUmfang ? Object.assign({}, ALLE, { name: vUmfang.titel, satz: vUmfang.satz }) : ALLE) : mitGruppe(ARTEN.find(a => a.key === key)); fk = wahl.format; vFilter = { bereich: 'alle', ton: 'alle', art: 'alle', q: (vUmfang && vUmfang.q) || '' };
    $('#startWahl').hidden = true;
    const w = $('#startWeg'); w.hidden = false;
    const fOpt = wahl.formate.map(k => `<option value="${k}" ${k === fk ? 'selected' : ''}>${DS.FORMATE[k].name.replace(/ /g, '\u00a0')}\u00a0· ${DS.FORMATE[k].b} auf ${DS.FORMATE[k].h} mm</option>`).join('');
    w.innerHTML = `<button class="start__zurueck" data-st="zurueck"><svg viewBox="0 0 24 24"><path d="M19 12H5m6-6-6 6 6 6"/></svg>Zurück</button>${mitFotoKopf()}
      <div class="weg__kopf"><div><h1>${zus(wahl.name)}</h1><p class="start__satz">${wahl.satz ? esc(wahl.satz) : wahl.alle ? 'Alle Vorlagen des Hauses an einem Ort. Such nach einem Wort oder grenz nach Bereich, Art und Grund ein.' : wahl.leer ? 'Wähl ein Format, dann geht es los.' : 'Beschreib in einem Satz, was du brauchst, oder nimm unten eine der Vorlagen.'}</p></div>
        ${wahl.alle ? '' : `<label class="start__format">Format<select id="startFormat">${fOpt}</select></label>`}</div>
      ${wahl.leer || wahl.alle ? '' : `<div class="start__direkt start__direkt--weg">
        <span class="start__direkt-ic"><svg viewBox="0 0 24 24"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg></span>
        <textarea id="startAuftrag" rows="1" placeholder="${innerWidth < 1100 ? 'Kurz beschreiben …' : 'Etwa: ' + esc(wahl.beispiel)}"></textarea>
        <button class="kn knopf--voll glanz-kn" data-st="entwerfen"><span>Fünf Entwürfe</span>${PFEIL}</button>
      </div><p class="start__fehler" id="startFehler" hidden></p>`}
      <div class="vb__kopf" id="vbKopf"></div>
      <div class="vb__liste" id="startVorlagen"></div>
      <p class="start__nichts" id="vbNichts" hidden>Dazu gibt es noch keine Vorlage. Nimm einen Filter zurück oder beschreib oben, was du brauchst.</p>`;
    zeichneVorlagen();
    $('#start .ms-haupt').scrollTo({ top: 0 });
    const sf = w.querySelector('#startFormat'); if (sf) sf.addEventListener('change', e => { fk = e.target.value; zeichneVorlagen(); });
    const ta = w.querySelector('#startAuftrag');
    if (ta) ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); entwirf(); } });
  }

  async function zeichneVorlagen() {
    const lauf = ++vLauf, box = $('#startVorlagen'), kopf = $('#vbKopf'); box.innerHTML = '';
    let liste;
    if (wahl.alle) { liste = await ladeAlle(); if (vUmfang) liste = liste.filter(x => (!vUmfang.bereiche || vUmfang.bereiche.includes(x.v.bereich)) && (!vUmfang.arten || vUmfang.arten.includes(x.a.key))); }
    else {
      const bib = wahl.leer ? null : await ladeBibliothek(wahl.key);
      liste = (bib ? bib : wahl.vorlagen.map(([v, t], i) => ({ id: 'v' + i, titel: DS.VORLAGEN[v].name, bereich: '', vorlage: v, ton: t, inhalt: inhalt(wahl, v) }))).map(v => ({ v, a: wahl }));
      for (const g of wahl.gruppe || []) { const ga = ARTEN.find(a => a.key === g), gb = await ladeBibliothek(g); if (ga) liste = liste.concat((gb || ga.vorlagen.map(([v, t], i) => ({ id: g + i, titel: DS.VORLAGEN[v].name, bereich: '', vorlage: v, ton: t, inhalt: inhalt(ga, v) }))).map(v => ({ v, a: ga }))); }   // K18: Nachbar-Arten dazu
    }
    if (lauf !== vLauf || !box.isConnected) return;
    if (mitFoto) liste = liste.filter(x => hatFotoStelle(x.v));
    vAlle = liste; vAlle.forEach(x => { x.fk = !wahl.alle && x.a.key !== wahl.key ? (DS.FORMATE[x.v.format] ? x.v.format : x.a.format) : !wahl.alle && fk !== wahl.format ? fk : (DS.FORMATE[x.v.format] ? x.v.format : wahl.alle ? x.a.format : fk); suchtext(x); });   // jede Vorlage in ihrem eigenen Format (29.10.)
    // Kopf: Zahl, Suche, dann Art (nur über alle Arten), Bereich, Grund
    const arten = {}; vAlle.forEach(x => arten[x.a.key] = (arten[x.a.key] || 0) + 1);
    kopf.innerHTML = wahl.leer ? '' : `<div class="vb__zeile"><h2>${vAlle.length === 1 ? 'Eine Vorlage' : vAlle.length.toLocaleString('de-CH') + ' Vorlagen'}</h2><span id="vbZahl"></span>
        <label class="start__suche vb__suche"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg><input type="search" id="vbSuche" placeholder="In den Vorlagen suchen …" value="${esc(vFilter.q)}"></label></div>
      <div class="vb__wahl">${wahl.alle ? `<label class="start__format vb__feld">Art<select id="vbArt"><option value="alle">Alle Arten</option>${ARTEN.filter(a => arten[a.key]).map(a => `<option value="${a.key}">${esc(a.name)} · ${arten[a.key]}</option>`).join('')}</select></label>` : ''}
        <label class="start__format vb__feld">Bereich des Hauses<select id="vbBereich"></select></label>
        <div class="vb__toene">${[['alle', 'Jeder Grund'], ['dunkel', 'Nacht'], ['hell', 'Warmweiss'], ['creme', 'Plakatpapier']].map(([k, t]) => `<button data-ton="${k}" class="${vFilter.ton === k ? 'an' : ''}">${t}</button>`).join('')}</div></div>`;
    zeichneBereiche();
    const su = kopf.querySelector('#vbSuche'); if (su) { let t; su.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { vFilter.q = su.value; filterVorlagen(); }, 140); }); }
    const sa = kopf.querySelector('#vbArt'); if (sa) sa.addEventListener('change', () => { vFilter.art = sa.value; zeichneBereiche(); filterVorlagen(); });
    const sb = kopf.querySelector('#vbBereich'); if (sb) sb.addEventListener('change', () => { vFilter.bereich = sb.value; filterVorlagen(); });
    filterVorlagen();
  }
  /* Liste der Bereiche mit Zahl, passend zur gewählten Art */
  function zeichneBereiche() {
    const sb = $('#vbBereich'); if (!sb) return;
    const z = {}; vAlle.forEach(x => { if (x.v.bereich && (vFilter.art === 'alle' || x.a.key === vFilter.art)) z[x.v.bereich] = (z[x.v.bereich] || 0) + 1; });
    const namen = [...BEREICHE.filter(b => z[b]), ...Object.keys(z).filter(b => !BEREICHE.includes(b))];
    if (vFilter.bereich !== 'alle' && !z[vFilter.bereich]) vFilter.bereich = 'alle';
    sb.innerHTML = `<option value="alle">Alle Bereiche</option>` + namen.map(b => `<option value="${esc(b)}" ${vFilter.bereich === b ? 'selected' : ''}>${esc(b)} · ${z[b]}</option>`).join('');
    sb.closest('.vb__feld').hidden = !namen.length;
    if (sb._gw) sb._gw.k.querySelector('.hwahl-wert').textContent = sb.options[sb.selectedIndex].textContent;   // Liste im Hausstil (lib/auswahl.js) nachziehen
  }
  /* Treffer neu bestimmen und die Galerie von vorn zeichnen */
  function filterVorlagen() {
    const box = $('#startVorlagen'); if (!box) return;
    const W = vFilter.q.trim().toLowerCase().split(/\s+/).filter(Boolean), f = vFilter;
    vTreffer = vAlle.filter(x => (f.art === 'alle' || x.a.key === f.art) && (f.bereich === 'alle' || x.v.bereich === f.bereich) && (f.ton === 'alle' || x.v.ton === f.ton) && W.every(w => x.v._t.includes(w)));
    if (beobachter) beobachter.disconnect(); if (fern) fern.disconnect(); if (waechter) waechter.disconnect();
    box.innerHTML = ''; vDa = 0;
    const g = GROSS(), haupt = $('#start .ms-haupt'), lauf = vLauf, fmt = fk, n = spalten();
    const platzhalter = (x, W2, H2) => { const p = document.createElement('span'); p.className = 'papier papier--vorn papier--warten' + (x.v.ton === 'dunkel' ? ' papier--marine' : ''); p.style.width = W2 + 'px'; p.style.height = H2 + 'px'; return p; };
    // Vorschau setzen: nur was gerade nah am Bild ist, das Neueste zuerst, in kleinen Portionen je Bild (höchstens ~6 ms) und nicht, solange schnell gescrollt wird
    const warte = [], vorrat = []; let pumpt = false, yZuletzt = haupt.scrollTop, tZuletzt = performance.now(), schnellBis = 0, stehtSeit = 0, tempoMittel = 0;
    /* Ein Schritt je Aufruf: erst der Satz (misst Text, das Teure), beim nächsten Mal der Aufbau. So teilt sich ein schweres Blatt auf zwei Bilder. */
    const setze = (b, auchFern) => {
      const x = b._x, platz = b.querySelector('.papier--warten'); if (!platz || !(b._nah || auchFern) || !b.isConnected) return false;
      const tz = window.__vbZeit && performance.now();
      try {
        const F = DS.FORMATE[x.fk], [W2, H2] = groesse(F, g);
        const vs = { vorlage: x.v.vorlage, ton: x.v.ton, inhalt: x.v.inhalt, stil: x.v.stil, foto: mitFoto || '' }, fm = mitFoto;
        const mach = () => ({ doc: { format: { b: F.b, h: F.h }, formatKey: x.fk, seiten: [x._s && x._sf === x.fk + '|' + (fm || '') ? x._s : DS.setze(DS.M, x.fk, x.v.vorlage, x.v.ton, x.v.inhalt, x.v.stil)] }, i: 0 });
        const fb = DS.VB && DS.VB.fertig(x.fk, vs, mach);
        if (fb) {   // fertiges Vorschaubild: kein Satz beim Scrollen (vorschaubild.js, 29.10.)
          const p = document.createElement('span'); p.className = 'papier papier--vorn'; p.style.width = W2 + 'px'; p.style.height = H2 + 'px';
          p.appendChild(fb); platz.replaceWith(p); b.classList.add('da'); return true;
        }
        if (!x._s || x._sf !== x.fk + '|' + (mitFoto || '')) {   // gesetzte Seite merken: beim Zurückscrollen wird nicht neu gemessen (je Format und Foto)
          x._s = DS.setze(DS.M, x.fk, x.v.vorlage, x.v.ton, x.v.inhalt, x.v.stil); x._sf = x.fk + '|' + (mitFoto || '');
          if (tz) window.__vbZeit.push(['satz', +(performance.now() - tz).toFixed(1)]);
          return b;   // Aufbau folgt im nächsten Schritt
        }
        const p = document.createElement('span'); p.className = 'papier papier--vorn'; p.style.width = W2 + 'px'; p.style.height = H2 + 'px';
        const doc = { format: { b: F.b, h: F.h }, formatKey: x.fk, seiten: [x._s] };
        p.appendChild(st().miniBox(doc, 0, Math.max(W2, H2) * (Math.max(F.b, F.h) + 2 * DS.B) / Math.max(F.b, F.h)));
        platz.replaceWith(p); b.classList.add('da'); if (DS.VB) DS.VB.spaeter(DS.VB.schluessel(x.fk, vs), () => ({ doc, i: 0 }), DS.VB.inhalt(x.fk, vs));
      } catch (e) { console.warn(e); }
      if (tz) window.__vbZeit.push(['aufbau', +(performance.now() - tz).toFixed(1)]);
      return true;
    };
    const pumpe = () => {
      if (lauf !== vLauf || fk !== fmt) { pumpt = false; return; }
      const jetzt = performance.now(), y = haupt.scrollTop, tempo = Math.abs(y - yZuletzt) / Math.max(1, jetzt - tZuletzt); yZuletzt = y; tZuletzt = jetzt;
      tempoMittel = tempoMittel * .8 + tempo * .2;   // geglättet: ein Mausrad scrollt in Stufen, einzelne Bilder springen weit
      if (tempoMittel > 2) schnellBis = jetzt + 140;   // schneller als rund 2000 px je Sekunde: die Blätter fliegen vorbei, Vorschauen kommen, sobald es ruhiger wird
      if (tempo > .02) stehtSeit = jetzt;
      if (jetzt > schnellBis) {
        // in Bewegung höchstens ein Schritt je Bild, im Stand bis ~6 ms
        do { const b = warte.pop(); if (!b) break; const r = setze(b); if (r === b) warte.push(b); } while (tempo <= .02 && performance.now() - jetzt < 6);
        // steht die Seite seit einem Moment, die Blätter der Blöcke davor und danach vorbereiten (ein Schritt je Bild), damit beim Weiterscrollen nichts mehr zu rechnen ist
        if (!warte.length && jetzt - stehtSeit > 260) { let b; while ((b = vorrat.pop()) && !(b.isConnected && !b.classList.contains('da'))); if (b) { const r = setze(b, true); if (r === b) vorrat.push(b); } }
      }
      if (warte.length || vorrat.length) requestAnimationFrame(pumpe); else pumpt = false;
    };
    const anwerfen = () => { if (!pumpt) { pumpt = true; requestAnimationFrame(pumpe); } };
    beobachter = new IntersectionObserver(es => {
      es.forEach(e => { e.target._nah = e.isIntersecting; if (e.isIntersecting && !e.target.classList.contains('da')) warte.push(e.target); });
      if (warte.length > 90) warte.splice(0, warte.length - 90);
      if (warte.length) anwerfen();
    }, { root: haupt, rootMargin: '500px 0px' });
    // Blöcke zu zwölf Blättern: jeder Block ist ein eigenes Raster; ist er weit weg, wird er geleert und hält nur seine Höhe (so bleibt die Seite auch bei 3000 Vorlagen leicht)
    const bloecke = new Map(), uhr = (name, fn) => (...a) => { if (!window.__vbZeit) return fn(...a); const t = performance.now(), r = fn(...a); window.__vbZeit.push([name, +(performance.now() - t).toFixed(1)]); return r; };
    const fuelle = uhr('fuellen', (el, wieder) => {
      const bl = bloecke.get(el); if (!bl || bl.voll) return;
      const teil = document.createDocumentFragment(), karten = [];
      if (bl.leer) { const f0 = DS.FORMATE[fk], l = leerStueck({ leer: '1' }, f0, g, f0.name); l._H = groesse(f0, g)[1]; karten.push(l); }
      vTreffer.slice(bl.ab, bl.bis).forEach((x, k) => {
        const F = DS.FORMATE[x.fk], [W2, H2] = groesse(F, g);
        const b = stueckKarte({ vid: x.v.id }, bl.ab + k + 1, [platzhalter(x, W2, H2)], H2, x.v.titel, wahl.alle ? x.a.name + (x.v.bereich ? ' · ' + x.v.bereich : '') : (x.v.bereich ? x.v.bereich + ' · ' : '') + (TON[x.v.ton] || ''), 'Übernehmen', 'stueck--lazy');
        b._x = x; b._v = x.v; b._H = H2; karten.push(b); beobachter.observe(b);
      });
      // Reihen gleich hoch (über alle Arten stehen verschiedene Formate nebeneinander), ohne das Layout zu lesen
      for (let r = 0; r < karten.length; r += n) { const z = karten.slice(r, r + n), h = Math.max(...z.map(c => c._H || 0)); z.forEach(c => { c.querySelector('.stueck__buehne').style.height = Math.ceil(h + 36) + 'px'; teil.appendChild(c); }); }
      el.classList.toggle('vb__block--wieder', !!wieder); el.style.height = ''; el.appendChild(teil); bl.voll = true;
      for (let k = karten.length - 1; k >= 0; k--) if (karten[k]._x) vorrat.push(karten[k]);   // das oberste Blatt des Blocks kommt zuerst dran
      if (vorrat.length > 160) vorrat.splice(0, vorrat.length - 160);
      anwerfen();
    });
    const leere = uhr('leeren', el => {
      const bl = bloecke.get(el); if (!bl || !bl.voll) return;
      const h = el.offsetHeight; el.querySelectorAll('.stueck--lazy').forEach(k => beobachter.unobserve(k));
      el.textContent = ''; el.style.height = h + 'px'; bl.voll = false;
    });
    // Füllen und Leeren nie im Schwung: je Bild höchstens ein Block, der zuletzt gemeldete zuerst (wer nur vorbeifliegt, wird gar nicht erst gefüllt)
    const offen = []; let werkelt = false;
    const werk = () => {
      if (lauf !== vLauf) { werkelt = false; return; }
      let el; while ((el = offen.pop())) { const bl = bloecke.get(el); if (bl && bl.nah !== bl.voll) { bl.nah ? fuelle(el, true) : leere(el); break; } }
      if (offen.length) requestAnimationFrame(werk); else werkelt = false;
    };
    fern = new IntersectionObserver(es => {
      es.forEach(e => { const bl = bloecke.get(e.target); if (!bl) return; bl.nah = e.isIntersecting; if (bl.nah !== bl.voll) offen.push(e.target); });
      if (offen.length && !werkelt) { werkelt = true; requestAnimationFrame(werk); }
    }, { root: haupt, rootMargin: '2400px 0px' });
    const ende = document.createElement('i'); ende.className = 'vb__ende'; ende.setAttribute('aria-hidden', 'true');
    const mehr = () => {
      if (lauf !== vLauf || (vDa >= vTreffer.length && bloecke.size)) return;
      const erster = !bloecke.size, leer = erster && !wahl.alle, zahl = PORTION - (leer ? 1 : 0);
      const el = document.createElement('div'); el.className = 'atelier wv vb__block';
      bloecke.set(el, { ab: vDa, bis: Math.min(vTreffer.length, vDa + zahl), leer, voll: false, nah: true });
      vDa = Math.min(vTreffer.length, vDa + zahl);
      fuelle(el, false); box.insertBefore(el, ende.isConnected ? ende : null); if (!ende.isConnected) box.appendChild(ende);
      fern.observe(el);
      if (vDa >= vTreffer.length) { waechter.disconnect(); ende.remove(); }
    };
    waechter = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { mehr(); if (vDa < vTreffer.length) { waechter.unobserve(ende); waechter.observe(ende); } } }, { root: haupt, rootMargin: '1600px 0px' });
    mehr(); if (ende.isConnected) waechter.observe(ende);
    const z = $('#vbZahl'); if (z) z.textContent = vTreffer.length === vAlle.length ? '' : `${vTreffer.length.toLocaleString('de-CH')} passen`;
    const nix = $('#vbNichts'); if (nix) nix.hidden = vTreffer.length > 0 || wahl.leer;
  }

  function nimmVorlage(v, t) {
    const seiten = [{ vorlage: v, ton: t, inhalt: inhalt(wahl, v) }];
    if (wahl.rueck) seiten.push({ vorlage: wahl.rueck, ton: t, inhalt: DS.BEISPIEL[wahl.rueck] });
    st().oeffne(DS.dokument(DS.M, { name: wahl.name + ' · ' + DS.VORLAGEN[v].name, format: fk, seiten }));
    zu();
  }

  const kiGrund = () => { const f = (st().entwerfen || {}).fehler || '';
    if (/KI-FREIGABE/.test(f)) return 'Die KI ist für dieses Haus noch nicht freigeschaltet. Mit einer Vorlage geht es sofort weiter, die Vorlagen kosten nichts.';
    if (/Guthaben/.test(f)) return 'KI-Guthaben aufgebraucht. Mit einer Vorlage geht es ohne KI weiter, die Vorlagen kosten nichts.';
    if (!navigator.onLine || /Failed to fetch|NetworkError|Load failed|network/i.test(f)) return 'Keine Verbindung zum Internet. Dein Satz steht noch im Feld. Vorlagen, Bearbeiten und PDF gehen auch ohne Internet.';   // Prüfung 16.10.2026
    if (/GRENZE/.test(f)) return 'Zu viele Entwürfe in kurzer Zeit. In einer Stunde geht es wieder, mit einer Vorlage sofort.';
    return ''; };
  async function entwirf() {
    const ta = $('#startAuftrag'), text = ta.value.trim();
    if (text.length < 4) { ta.focus(); ta.classList.add('wackel'); setTimeout(() => ta.classList.remove('wackel'), 600); return; }
    letzterText = text;
    const art = wahl, format = fk;
    zu();
    const r = await st().entwerfen({ auftrag: `${wahl.name}: ${text}`, format: fk, anzeige: text, varianten: true });
    if (!r || !r.docs) { zeige(); wahl = art; fk = format; zeigeWeg(art.key); $('#startAuftrag').value = text; const f = $('#startFehler'); f.hidden = false; f.textContent = kiGrund() || 'Der Entwurf hat gerade nicht geklappt. Bitte noch einmal versuchen oder mit einer Vorlage beginnen.'; return; }
    zeige(); wahl = art; fk = format;
    zeigeEntwuerfe(r, text, { titel: art.name, zurueck: () => { wahl = art; fk = format; zeigeWeg(art.key); $('#startAuftrag').value = text; }, nochmal: () => { wahl = art; fk = format; zeigeWeg(art.key); $('#startAuftrag').value = text; entwirf(); } });
  }

  /* Direkt beschreiben auf der Startseite: ohne Art, das Studio wählt Format und Aufbau */
  async function entwirfFrei(text) {
    text = (text || $('#startDirekt').value).trim();
    if (text.length < 4) { const f = $('#startDirekt'); f.focus(); f.closest('.start__direkt').classList.add('wackel'); setTimeout(() => f.closest('.start__direkt').classList.remove('wackel'), 600); return; }
    zu();
    const r = await st().entwerfen({ auftrag: text, anzeige: text, varianten: true });
    zeige();
    if (!r || !r.docs) { waehleAnsicht('neu'); $('#startDirekt').value = text; const f = $('#startDirektFehler'); f.hidden = false; f.textContent = kiGrund() || 'Der Entwurf hat gerade nicht geklappt. Bitte noch einmal versuchen oder unten eine Art wählen.'; return; }
    zeigeEntwuerfe(r, text, { titel: 'Alle Drucksachen', zurueck: () => { zeigeArten(); $('#startDirekt').value = text; }, nochmal: () => entwirfFrei(text) });
  }

  /* Fünf Entwürfe zur Wahl (Robert 11.10.2026: «fünf verschiedene Entwürfe vom selben Plakat, dann wählt man und arbeitet darin»)
     Jeder Entwurf frei im Atelier, Vorder- und Rückseite gefächert; ein Klick öffnet ihn zum Bearbeiten. */
  let letzterText = '', entwuerfe = [];
  function blattDoc(doc, basis, kl, seite = 0) {
    const f = doc.format, maxW = Math.min(basis * 1.32, BREIT());
    let H = basis * Math.pow(f.h / 148, .6), W = H * f.b / f.h;
    if (W > maxW) { W = maxW; H = W * f.h / f.b; }
    const el = document.createElement('span'); el.className = 'papier ' + (kl || ''); el.style.width = W + 'px'; el.style.height = H + 'px';
    el.appendChild(st().miniBox(doc, seite, Math.max(W, H) * (Math.max(f.b, f.h) + 2 * DS.B) / Math.max(f.b, f.h)));
    return el;
  }
  let kontext = null;
  function zeigeEntwuerfe(r, text, k) {
    entwuerfe = r.docs; kontext = k;
    $('#startWahl').hidden = true;
    const w = $('#startWeg'); w.hidden = false;
    const f = DS.FORMATE[r.docs[0].formatKey] || DS.FORMATE.a5h;
    w.innerHTML = `<button class="start__zurueck" data-st="zurueckWeg"><svg viewBox="0 0 24 24"><path d="M19 12H5m6-6-6 6 6 6"/></svg>${esc(k.titel)}</button>
      <h1>${r.docs.length === 1 ? 'Dein Entwurf' : (r.docs.length === 5 ? 'Fünf' : r.docs.length) + ' Entwürfe'}</h1>
      <p class="start__satz">«${esc(text)}» · ${esc(f.name)}. Wähl den Entwurf, der dir am besten gefällt. Darin änderst du danach jeden Text, jedes Foto und jede Farbe.</p>
      ${r.hinweise.length ? `<div class="start__hinweise"><b>Bitte noch ansehen</b><ul>${r.hinweise.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      <div class="atelier atelier--entwuerfe" id="startEntwuerfe"></div>
      <div class="start__nochmal"><button class="kn kn--klein kn--ohne" data-st="nochmal"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/></svg><span>Fünf neue Entwürfe</span></button></div>`;
    const box = w.querySelector('#startEntwuerfe');
    r.docs.forEach((d, i) => {
      const b = document.createElement('button'); b.className = 'stueck stueck--entwurf'; b.dataset.entwurf = i;
      b.style.setProperty('--i', i); b.style.setProperty('--r', ([-1.4, 1.1, -.7, 1.6, -1, .8][i % 6]) + 'deg');
      const bu = document.createElement('span'); bu.className = 'stueck__buehne'; const sa = document.createElement('span'); sa.className = 'stueck__satz';
      if (d.seiten.length > 1) sa.appendChild(blattDoc(d, GROSS(), 'papier--hinten', 1));
      sa.appendChild(blattDoc(d, GROSS(), 'papier--vorn', 0)); bu.appendChild(sa); b.appendChild(bu);
      const q = d.seiten[0].quelle || {};
      b.insertAdjacentHTML('beforeend', `<b class="stueck__name">${esc(d.variante || 'Entwurf ' + (i + 1))}</b><em class="stueck__format">${esc(DS.VORLAGEN[q.vorlage]?.name || '')} · ${{ dunkel: 'Nacht', hell: 'Papier', creme: 'Plakatpapier' }[q.ton] || ''}${d.seiten.length > 1 ? ' · ' + d.seiten.length + (DS.FORMATE[d.formatKey]?.digital ? ' Bilder' : ' Seiten') : ''}</em><small class="stueck__satztext">Diesen nehmen</small>`);
      box.appendChild(b);
    });
    $('#start .ms-haupt').scrollTo({ top: 0 });
    requestAnimationFrame(() => reihen(box));
  }

  function zeige(a) {
    ansicht = a || 'start';
    const s = $('#start'); s.hidden = false; document.body.classList.add('startoffen');
    if (s.__gezeigt) s.classList.add('wieder'); else { s.__gezeigt = 1; s.classList.remove('an'); void s.offsetWidth; s.classList.add('an'); }
    $('#startZu').hidden = !(st().doc() && !st().doc().platzhalter);
    zeigeArten();
    if (!s.classList.contains('bereit')) bereitMachen(s);
  }
  /* In einem Zug (Robert 16.10.2026: «sieht erst kurz leer aus und lädt dann in zwei Stufen, die Bilder»): die Arbeitsfläche bleibt beim ersten Öffnen
     verborgen, bis alle Kacheln gesetzt und die Fotos der ersten Bildschirmhöhe geladen und dekodiert sind (höchstens 1,6 s), dann steht alles auf einmal da. */
  function bereitMachen(s) {
    const fertig = () => s.classList.add('bereit');
    Promise.resolve().then(() => new Promise(r => requestAnimationFrame(r))).then(() => {
      const h = innerHeight, urls = new Set();   // nur der erste Bildschirm (30.10.2026: mit 1,15 wartete der Start auf Kacheln, die danach unter den Rand rutschen)
      s.querySelectorAll('.ms-haupt .wo__bild, .ms-haupt img').forEach(e => {
        const q = e.getBoundingClientRect(); if (q.top > h || q.bottom < 0 || e.closest('[hidden]')) return;
        if (e.dataset.bg) { urls.add(e.dataset.bg); bgSetzen(e); return; }
        const m = e.tagName === 'IMG' ? [0, e.currentSrc || e.src] : /url\(["']?([^"')]+)/.exec(e.style.backgroundImage || '');
        if (m && m[1]) urls.add(m[1]);
      });
      return Promise.race([Promise.all([...urls].map(hole)), new Promise(r => setTimeout(r, 1600))]);
    }).then(fertig, fertig);
  }
  function zu() { $('#start').hidden = true; document.body.classList.remove('startoffen'); mitFoto = null; document.querySelectorAll('#start .mit-foto').forEach(x => x.remove()); }

  function frei() {
    const f = $('#startFrei'), t = f.value.trim();
    if (t.length < 4) { f.focus(); const w = f.closest('.ms-feld'); w.classList.add('wackel'); setTimeout(() => w.classList.remove('wackel'), 600); return; }
    f.value = ''; entwirfFrei(t);
  }
  function los() {
    const s = $('#start'); bgWache();
    $('#kapitelZeichen').innerHTML = DS.zeichenSvg(DS.M, 'currentColor');
    s.addEventListener('click', e => {
      const a = e.target.closest('[data-art]'); if (a) return zeigeWeg(a.dataset.art);
      const an = e.target.closest('[data-ansicht]'); if (an) { $('#startSuche').value = ''; if ($('#startWahl').hidden) zeigeArten(); return waehleAnsicht(an.dataset.ansicht); }
      const ak = e.target.closest('[data-akt]');
      if (ak && ak.dataset.akt === 'entwurf-datei') return entwurfWaehlen();
      if (ak && ak.dataset.akt === 'neu') { $('#startSuche').value = ''; if (!$('#startWahl').hidden) waehleAnsicht('neu'); else { zeigeArten(); waehleAnsicht('neu'); } return $('#startDirekt').focus(); }
      const um = e.target.closest('[data-umfang]'); if (um) return zeigeUmfang(um.dataset.umfang);
      const ev = e.target.closest('[data-event]'); if (ev) return zeigeDetailBereit('event', ev.dataset.event);
      const abt = e.target.closest('[data-abteilung]'); if (abt) return zeigeDetailBereit('abteilung', abt.dataset.abteilung);
      const kv = e.target.closest('[data-kv]'); if (kv) return nimmVorlageKv(+kv.dataset.kv);
      const ef = e.target.closest('[data-efilter]');
      if (ef) { evFilter = ef.dataset.efilter; document.querySelectorAll('[data-efilter]').forEach(x => x.classList.toggle('an', x === ef)); return zeichneEvents(); }
      const fg = e.target.closest('[data-fgruppe]');
      if (fg) { fotoGruppe = fg.dataset.fgruppe; document.querySelectorAll('#fotoGruppen [data-fgruppe]').forEach(x => x.classList.toggle('an', x === fg)); return filtern(); }
      const fx = e.target.closest('[data-fs],[data-ff],[data-fh]');
      if (fx) { const k = fx.dataset.fs !== undefined ? 's' : fx.dataset.ff !== undefined ? 'f' : 'h'; fotoF[k] = fx.dataset['f' + k]; document.querySelectorAll(`#fotoGruppen [data-f${k}]`).forEach(x => x.classList.toggle('an', x === fx)); return filtern(); }
      const af = e.target.closest('[data-ausfoto]');
      if (af) { mitFoto = af.dataset.ausfoto; ansicht = 'neu'; $('#startSuche').value = ''; gruppe = 'alle'; zeigeArten(); $('#start .ms-haupt').scrollTo({ top: 0 }); return; }
      if (e.target.closest('#startHilfe')) return $('#btnHilfe').click();
      const mak = e.target.closest('[data-makt]'); if (mak) { e.stopPropagation(); const k = mak.closest('[data-mail]'); return mailAktion(mak.dataset.makt, k.dataset.mail, k); }
      if (ak) { e.stopPropagation(); const k = ak.closest('[data-doc]'); return bibliothekAktion(ak.dataset.akt, k.dataset.doc, k); }
      if (e.target.closest('.doc__umbenennen')) return;
      const d = e.target.closest('[data-doc]'); if (d) {
        let doc = st().alleDocs()[d.dataset.doc];
        if (istBeispiel(doc)) { doc = JSON.parse(JSON.stringify(doc)); delete doc.beispiel; delete doc.freigabe; doc.id = 'd' + Date.now().toString(36); doc.name = doc.name.replace(/^Beispiel · /, ''); doc.geaendert = Date.now(); }
        st().oeffne(doc); return zu();
      }
      const ma = e.target.closest('[data-mail]'); if (ma) { location.href = 'mail.html?mail=' + encodeURIComponent(ma.dataset.mail); return; }
      const b = e.target.closest('[data-st]');
      if (b && b.dataset.st === 'ohneFoto') { mitFoto = null; if (!$('#startWeg').hidden && wahl) { const m = document.querySelector('#startWeg > .mit-foto'); if (m) m.remove(); return zeichneVorlagen(); } return zeigeArten(); }
      if (b && b.dataset.st === 'zurueck') return zeigeArten();
      if (b && b.dataset.st === 'alle') return zeigeWeg('alle');
      if (b && b.dataset.st === 'entwerfen') return entwirf();
      if (b && b.dataset.st === 'zurueckWeg') return kontext && kontext.zurueck();
      if (b && b.dataset.st === 'nochmal') return kontext && kontext.nochmal();
      if (b && b.dataset.st === 'direkt') return entwirfFrei();
      if (b && b.dataset.st === 'frei') return frei();
      if (b && b.dataset.st === 'kfrei') { const t = $('#kampFrei').value.trim(); if (t.length < 4) { $('#kampFrei').focus(); return; } const a = offen.a; return entwirfFrei(`${t}. ${offen.typ === 'event' ? 'Anlass' : 'Abteilung'}: ${a.t}${a.z ? ', ' + a.z : ''}. ${a.satz}`); }
      const en = e.target.closest('[data-entwurf]');
      if (en) { const d = entwuerfe[+en.dataset.entwurf]; d.name = d.name + (d.variante ? ' · ' + d.variante : ''); st().oeffne(d); st().zeigeHinweise(d.hinweise); zu(); return; }
      const ft = e.target.closest('.vb__toene [data-ton]'); if (ft) { vFilter.ton = ft.dataset.ton; document.querySelectorAll('.vb__toene [data-ton]').forEach(x => x.classList.toggle('an', x === ft)); return filterVorlagen(); }
      const v = e.target.closest('#startVorlagen [data-vid],#startVorlagen [data-leer]');
      if (v) {
        if (v.dataset.leer) { st().oeffne(st().leer(fk)); return zu(); }
        const x = v._v, art = (v._x && v._x.a) || wahl, seiten = [{ vorlage: x.vorlage, ton: x.ton, inhalt: x.inhalt, stil: x.stil }];
        const rueck = x.rueck || (art.rueck ? { vorlage: art.rueck, inhalt: DS.BEISPIEL[art.rueck] } : null);
        if (rueck) seiten.push({ vorlage: rueck.vorlage, ton: x.ton, inhalt: rueck.inhalt, stil: x.stil });
        st().oeffne(DS.dokument(DS.M, { name: art.name + ' · ' + x.titel, format: (v._x && v._x.fk) || fk, seiten })); return zu();
      }
    });
    $('#startZu').addEventListener('click', zu);
    let su; $('#startSuche').addEventListener('input', () => {
      if ($('#startWahl').hidden) zeigeArten();
      if (!['meine', 'neu', 'fotos', 'livre'].includes(ansicht)) { const v = $('#startSuche').value; waehleAnsicht('meine'); $('#startSuche').value = v; }
      clearTimeout(su); su = setTimeout(filtern, 120); });
    addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !$('#start').hidden) { e.preventDefault(); $('#startSuche').focus(); } });
    $('#startGruppen').addEventListener('click', e => { const b = e.target.closest('[data-gruppe]'); if (!b) return; gruppe = b.dataset.gruppe; zeichneGruppen(); filtern(); });
    $('#btnNeu').addEventListener('click', () => zeige());
    $('#start').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-doc],[data-mail]')) e.target.click(); });
    const q = new URLSearchParams(location.search);
    $('#startDirekt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); entwirfFrei(); } });
    $('#startFrei').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); frei(); } });
    $('#start').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-event],[data-abteilung],[data-kv],[data-art],[data-vid],[data-leer],[data-entwurf]')) e.target.click(); });
    s.addEventListener('pointermove', kippen);
    /* Beim Scrollen reagiert keine Kachel auf die Maus (Robert 16.10.2026: «hakelig»): sonst wechseln Licht, Schatten und Neigung bei jeder
       Kachel, die unter dem stehenden Zeiger vorbeizieht. Die Kinder der Fläche lassen Zeiger durch, die Fläche selbst scrollt weiter. */
    const haupt = s.querySelector('.ms-haupt'); let scT = 0;
    if (haupt) haupt.addEventListener('scroll', () => { if (!s.classList.contains('scrollt')) { s.classList.add('scrollt'); if (kippt) { loese(kippt); kippt = null; } } clearTimeout(scT); scT = setTimeout(() => s.classList.remove('scrollt'), 180); }, { passive: true });
    s.addEventListener('pointerleave', () => { if (kippt) loese(kippt); kippt = null; });
    $('#msKopfZeichen').innerHTML = DS.zeichenSvg(DS.M, 'currentColor');
    addEventListener('resize', () => { if (!s.hidden) gleite(); });
    if (!q.has('demo') && !q.has('hilfe')) { zeige(); if (q.has('foto')) ausLivre(q); }   // jedes Öffnen beginnt auf der Startseite mit der Bibliothek (Robert 12.10.2026); aus Le Livre mit dem Foto

    document.documentElement.classList.remove('start-gleich');
  }
  /* Aus Le Livre hinüber (?foto=<key>&art=insta|story&x=&y=): fünf Gestaltungen mit diesem Foto und dem Ausschnitt aus Le Livre,
     sofort und ohne KI; «Fünf neue Entwürfe» lässt danach die KI Texte dazu schreiben. */
  function ausLivre(q) {
    const k = q.get('foto'), b = DS.M.bildIndex[k]; if (!b) return false;
    const fmt = q.get('art') === 'story' ? 'story' : 'insta', x = Math.min(1, Math.max(0, +q.get('x') || .5)), y = Math.min(1, Math.max(0, +q.get('y') || .5));
    const inh = { bild: k, ueber: DS.M.name, titel: '[Titel]', text: '[Ein Satz zum Bild]', aktion: '', fuss: '' };
    const arten = [['buehne', 'dunkel', 'Foto gross, Nacht'], ['buehne', 'hell', 'Foto gross, Warmweiss'], ['fenster', 'creme', 'Im Rahmen, Plakatpapier'], ['ansicht', 'dunkel', 'Foto randlos'], ['fenster', 'dunkel', 'Im Rahmen, Nacht']];
    const docs = arten.map(([v, t, titel]) => {
      const d = DS.dokument(DS.M, { name: (fmt === 'story' ? 'Story · ' : 'Beitrag · ') + b.alt, format: fmt, seiten: [{ vorlage: v, ton: t, inhalt: v === 'ansicht' ? { bild: k, titel: DS.M.ort, unter: DS.M.name } : inh }] });
      d.seiten.forEach(s => s.el.forEach(e => { if (e.typ === 'bild' && e.bild === k) { e.fx = x; e.fy = y; } }));
      d.variante = titel; d.hinweise = b.ki ? [DS.LIVRE_TEXT.ki] : []; return d;
    });
    const satz = `Foto aus dem Markenbuch: ${b.alt}`;
    const nochmal = async () => {
      zu();
      const r = await st().entwerfen({ auftrag: `${fmt === 'story' ? 'Instagram-Story' : 'Instagram-Beitrag'} mit dem Foto «${b.alt}» (Schlüssel ${k}) als Hauptbild`, format: fmt, anzeige: satz, varianten: true });
      zeige(); if (r && r.docs) { r.docs.forEach(d => d.seiten.forEach(s => s.el.forEach(e => { if (e.typ === 'bild' && e.bild === k) { e.fx = x; e.fy = y; } }))); zeigeEntwuerfe(r, satz, kontextLivre); }
      else zeigeEntwuerfe({ docs, hinweise: [] }, satz, kontextLivre);
    };
    const kontextLivre = { titel: 'Übersicht', zurueck: () => { zeigeArten(); waehleAnsicht('start'); }, nochmal };
    zeigeEntwuerfe({ docs, hinweise: b.ki ? [DS.LIVRE_TEXT.ki] : [] }, satz, kontextLivre);
    history.replaceState(null, '', location.pathname);
    return true;
  }
  /* Auswahl aus fünf Entwürfen auch vom Studio aus (Feld «Entwerfen» links) */
  function auswahl(r, text, nochmal) { zeige(); zeigeEntwuerfe(r, text, { titel: 'Zurück zum Studio', zurueck: () => zu(), nochmal }); $('#startZu').hidden = false; }
  window.DSStart = { zeige, zu, auswahl, offen: () => !$('#start').hidden, entwuerfe: () => entwuerfe };
  if (window.DSStudio) los(); else document.addEventListener('ds:bereit', los, { once: true });
})();
