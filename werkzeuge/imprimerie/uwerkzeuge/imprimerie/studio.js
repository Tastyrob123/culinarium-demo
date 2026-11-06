/* Drucksachen-Studio · Oberfläche: Entwerfen (KI), Vorlagen, Fotos, Ablage, Bearbeiten wie auf dem Papier, druckfertig speichern. */
(function () {
  const DS = window.DS;
  const HAUS = new URLSearchParams(location.search).get('haus') || 'culinarium';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const B = DS.B;
  const ST = { M: null, doc: null, seite: 0, sel: null, S: 3, zoom: 1, hist: [], zukunft: [], modus: null, urform: {}, seitePanel: false };
  const LS = { docs: `ds-${HAUS}-docs`, aktuell: `ds-${HAUS}-aktuell` };
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const r2 = v => Math.round(v * 10) / 10;
  const PT = 72 / 25.4;

  /* ---------- Meldung, Dialog ---------- */
  let mT;
  function melde(t, ms = 3200) { const m = $('#meldung'); m.textContent = t; m.hidden = false; clearTimeout(mT); mT = setTimeout(() => m.hidden = true, ms); }
  function dialog(html, knoepfe) {
    return new Promise(ok => {
      $('#dialogKarte').innerHTML = html + `<div class="dialog__knoepfe">${knoepfe.map((k, i) => `<button class="${k.haupt ? 'knopf' : 'leicht'}" data-i="${i}">${esc(k.t)}${k.haupt ? '<i><svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></i>' : ''}</button>`).join('')}</div>`;
      $('#dialog').hidden = false;
      $('#dialogKarte').onclick = e => {
        const b = e.target.closest('[data-i]');
        if (b) { $('#dialog').hidden = true; ok(knoepfe[+b.dataset.i].v); }
        const li = e.target.closest('li[data-id]');
        if (li) { $('#dialog').hidden = true; ok({ springe: li.dataset.id, seite: +li.dataset.seite }); }
      };
    });
  }

  /* Ersatzfoto, wenn ein Entwurf ein unbekanntes Foto nennt: ein Foto des Hauses (vorher fest «haus-aare», ein Foto des Grand Beau-Rivage, Prüfung 16.10.2026) */
  DS.ersatzFoto = M => (M.bildIndex[M.ersatz || 'haus-tag'] ? (M.ersatz || 'haus-tag') : ((M.bilder.find(b => !b.eigen) || M.bilder[0] || {}).key));
  /* ---------- Ablage ---------- */
  const alleDocs = () => lies(LS.docs, {});
  function speichern(beimOeffnen) {
    if (!ST.doc) return;
    if (ST.doc.platzhalter) { if (beimOeffnen) return; delete ST.doc.platzhalter; }
    if (beimOeffnen && !alleDocs()[ST.doc.id]) return;   // nur geöffnet (Vorlage, KI-Entwurf): gespeichert wird erst ab der ersten Änderung (Robert 12.10.2026)
    if (beimOeffnen) { schreib(LS.aktuell, ST.doc.id); return; }   // Öffnen ist keine Änderung: sonst meldet ein zweites Fenster, das nur öffnet, dem ersten einen Konflikt (Prüfung 16.10.2026)
    const d = alleDocs(), da = d[ST.doc.id];
    /* Zwei Fenster mit derselben Drucksache (Prüfung 16.10.2026): hat das andere Fenster inzwischen gespeichert, wird dessen Fassung nicht
       überschrieben; diese Fassung geht als Kopie in die Ablage und bleibt hier offen. */
    if (da && ST.stand && (da.geaendert || 0) > ST.stand) {
      const k = JSON.parse(JSON.stringify(ST.doc)); k.id = 'd' + Date.now().toString(36); k.name = (k.name || 'Drucksache') + ' (zweites Fenster)'; ST.doc = k;
      $('#docName').value = k.name;
      setTimeout(() => melde(`KONFLIKT · Diese Drucksache wurde in einem anderen Fenster geändert. Nichts ist überschrieben: Deine Fassung steht als «${k.name}» in Meine Medien.`, 12000), 0);
    }
    ST.doc.geaendert = Date.now(); ST.stand = ST.doc.geaendert;
    d[ST.doc.id] = ST.doc;
    if (!schreib(LS.docs, d)) melde('Der Browser-Speicher ist voll. Bitte ältere Drucksachen in der Ablage löschen oder als Arbeitsdatei sichern.');
    schreib(LS.aktuell, ST.doc.id);
    const g = $('#gespeichert'); if (g) { g.classList.add('an'); clearTimeout(g._t); g._t = setTimeout(() => g.classList.remove('an'), 1600); }
  }
  function oeffne(doc) {
    ST.doc = doc; ST.stand = doc.geaendert || 0; ST.seite = 0; ST.sel = null; ST.hist = []; ST.zukunft = []; ST.modus = null; ST.urform = {}; ST.seitePanel = false;
    ST.auftritt = true;
    speichern(true); passeZoom(); zeichne(); zeichneAblage();
  }

  /* ---------- Änderungen mit Verlauf ---------- */
  const seite = () => ST.doc.seiten[ST.seite];
  const sozial = () => !!(window.DSIg && DSIg.istSozial(ST.doc));
  const elById = id => seite().el.find(e => e.id === id);
  function aendern(fn, frei = true) {
    ST.hist.push(JSON.stringify(ST.doc)); if (ST.hist.length > 100) ST.hist.shift();
    ST.zukunft = [];
    fn();
    if (frei) seite().frei = true;
    for (const el of seite().el) if (el.typ === 'text') el.h = DS.mess(el).h;
    speichern(); zeichne();
  }
  /* Verwerfen aus dem Editor (Robert 12.10.2026: «hier will ich doch nicht mitarbeiten: einfach Entwurf löschen oder verwerfen») */
  async function verwerfen() {
    if (ST.modus === 'text') textEnde();
    const d = ST.doc, gespeichert = !!alleDocs()[d.id];
    const seit = Date.now() - (parseInt(String(d.id).slice(1), 36) || Date.now());
    const lange = gespeichert && (seit > 10 * 60000 || ST.hist.length >= 10);
    const a = await dialog(`<h2>Diesen Entwurf verwerfen?</h2><p class="leise">${gespeichert ? 'Er wird aus deinen Drucksachen entfernt.' : 'Er ist noch nicht gespeichert und verschwindet einfach.'}${lange ? ' Du hast länger daran gearbeitet. Wenn du ihn noch brauchen könntest, behalte ihn als Kopie.' : ''}</p>`,
      [{ t: 'Behalten', v: false }, ...(lange ? [{ t: 'Stattdessen als Kopie behalten', v: 'kopie' }] : []), { t: 'Verwerfen', v: true, haupt: true }]);
    if (!a) return;
    const alle = alleDocs();
    if (a === 'kopie') { const k = JSON.parse(JSON.stringify(d)); k.id = 'd' + Date.now().toString(36); k.name = d.name + ' (Kopie)'; k.geaendert = Date.now(); alle[k.id] = k; }
    delete alle[d.id]; schreib(LS.docs, alle);
    oeffne(leer('a5h', true)); zeichneAblage();
    if (window.DSStart) DSStart.zeige('meine');
    melde(a === 'kopie' ? 'Als Kopie in deinen Drucksachen behalten.' : 'Entwurf verworfen.');
  }
  function zurueck() { if (document.activeElement && document.activeElement.id === 'eText') document.activeElement.blur();   // erst das Tippen abschliessen (löst «change» aus), dann zurück
    if (eTextVor) { ST.hist.push(eTextVor); eTextVor = null; }   // Tippen im Feld «Inhalt» ohne Verlassen des Felds
    if (!ST.hist.length) return; const id0 = ST.doc.id; ST.zukunft.push(JSON.stringify(ST.doc)); ST.doc = JSON.parse(ST.hist.pop()); ST.doc.id = id0; ST.seite = Math.min(ST.seite, ST.doc.seiten.length - 1); if (ST.sel && !elById(ST.sel)) ST.sel = null; speichern(); zeichne(); }
  function vor() { if (!ST.zukunft.length) return; const id0 = ST.doc.id; ST.hist.push(JSON.stringify(ST.doc)); ST.doc = JSON.parse(ST.zukunft.pop()); ST.doc.id = id0; ST.seite = Math.min(ST.seite, ST.doc.seiten.length - 1); if (ST.sel && !elById(ST.sel)) ST.sel = null; speichern(); zeichne(); }

  function setzeSlot(s, slot, wert) {
    if (!s.quelle || !slot) return;
    const teile = slot.split('.'); let o = s.quelle.inhalt;
    for (let i = 0; i < teile.length - 1; i++) { if (o[teile[i]] == null) o[teile[i]] = /^\d+$/.test(teile[i + 1]) ? [] : {}; o = o[teile[i]]; }
    o[teile[teile.length - 1]] = wert;
  }

  /* ---------- Zeichnen ---------- */
  /* Einpassen (Robert 29.10.2026: «das Dokument ist trotzdem noch zu klein … man erkennt das nicht richtig»): die Seite füllt die Arbeitsfläche, die gerade frei
     ist, an Höhe oder Breite, mit ruhigem Rand (Innenabstand der Fläche, studio.css). Beim Auf- und Zugehen der rechten Leiste passt sie sich neu an
     (ResizeObserver in los). ST.zoom ist der Faktor dazu; die Anzeige unten zeigt den echten Massstab (100 % = Originalgrösse am Bildschirm). */
  const PX_MM = 96 / 25.4;
  function passeZoom() {
    const f = ST.doc.format, fl = $('#flaeche'), g = getComputedStyle(fl);
    const w = fl.clientWidth - parseFloat(g.paddingLeft) - parseFloat(g.paddingRight), h = fl.clientHeight - parseFloat(g.paddingTop) - parseFloat(g.paddingBottom);
    const fit = Math.min(w / (f.b + 2 * B), h / (f.h + 2 * B));
    ST.S = Math.max(.6, fit) * ST.zoom;
  }
  function nameEinpassen() {   // eine Zeile in 23 px, sonst zwei Zeilen in 16 px, ausgewogen umbrochen
    const t = $('#docName'); if (!t || t.tagName !== 'TEXTAREA') return;
    t.classList.remove('zwei'); t.style.height = 'auto';
    if (t.scrollHeight > parseFloat(getComputedStyle(t).lineHeight) * 1.5 + 8) { t.classList.add('zwei'); t.style.height = 'auto'; }
    t.style.height = t.scrollHeight + 'px';
  }
  function zeichne() {
    const M = ST.M, doc = ST.doc, f = doc.format, S = ST.S;
    const wirt = $('#wirt');
    wirt.style.width = (f.b + 2 * B) * S + 'px'; wirt.style.height = (f.h + 2 * B) * S + 'px';
    wirt.innerHTML = '';
    const blatt = DS.seiteDom(M, doc, ST.seite, S, { editor: true });
    wirt.appendChild(blatt);
    if (ST.auftritt) {
      ST.auftritt = false;
      [...blatt.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 24)));
      wirt.classList.remove('schwebt'); void wirt.offsetWidth; wirt.classList.add('schwebt');
      clearTimeout(wirt._a); wirt._a = setTimeout(() => wirt.classList.remove('schwebt'), 3200);
    }
    const ue = document.createElement('div'); ue.className = 'ueber'; ue.id = 'ueber';
    const dg = DS.FORMATE[doc.formatKey]?.digital;
    blatt.style.clipPath = dg ? `inset(${B * S}px)` : '';   // Fundliste 24: digitale Formate haben keinen Beschnitt, kein grauer Rand
    wirt.classList.toggle('digital', !!dg);
    ue.innerHTML = `<div class="schnitt" style="left:${B * S}px;top:${B * S}px;width:${f.b * S}px;height:${f.h * S}px${dg ? ';outline:0' : ''}"></div>` +
      (dg ? '' : `<div class="sicher" style="left:${(B + DS.SICHER) * S}px;top:${(B + DS.SICHER) * S}px;width:${(f.b - 2 * DS.SICHER) * S}px;height:${(f.h - 2 * DS.SICHER) * S}px"></div>`);
    wirt.appendChild(ue);
    wirt.classList.toggle('ohneHilfen', !$('#zeigeHilfen').checked);
    zeichneAuswahl();
    if ($('#docName').value !== doc.name) { $('#docName').value = doc.name; nameEinpassen(); }
    $('#formatInfo').textContent = innerWidth < 700 ? (DS.FORMATE[doc.formatKey]?.name || '') : `${DS.FORMATE[doc.formatKey]?.name || ''} · ${f.b} auf ${f.h} mm${dg ? '' : ' · Beschnitt 3 mm'}`;   // Tor 1, 31.10.: am Handy nur der Name, sonst abgeschnitten
    $('#zoomWert').textContent = Math.round(S / PX_MM * 100) + ' %';
    $('#btnZurueck').disabled = !ST.hist.length; $('#btnVor').disabled = !ST.zukunft.length;
    zeichneSeitenwahl(); zeichneEigenschaften(); zeichnePruefung();
    const zipK = $('#menueSpeichern [data-aus="zip"]'); if (zipK) zipK.hidden = !(sozial() && doc.seiten.length > 1);
  }
  function domVon(id) { return $(`#wirt .blatt .el[data-id="${id}"]`); }
  function zeichneAuswahl(live) {
    const ue = $('#ueber'); if (!ue) return;
    ue.querySelectorAll('.auswahl,.griff,.hl,.mass').forEach(n => n.remove());
    const el = ST.sel && elById(ST.sel); if (!el) return;
    const S = ST.S, b = live || { x: el.x, y: el.y, w: el.w, h: DS.elHoehe(ST.M, el) };
    const a = document.createElement('div'); a.className = 'auswahl' + (ST.modus === 'ausschnitt' ? ' ausschnitt' : '');
    Object.assign(a.style, { left: (b.x + B) * S + 'px', top: (b.y + B) * S + 'px', width: Math.max(2, b.w * S) + 'px', height: Math.max(2, b.h * S) + 'px' });
    ue.appendChild(a);
    if (ST.modus) return;
    const senk = el.typ === 'linie' && el.h > el.w;
    let gr = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    if (el.typ === 'text' || (el.typ === 'linie' && !senk)) gr = ['w', 'e'];
    if (senk) gr = ['n', 's'];
    if (el.typ === 'zeichen') gr = ['nw', 'ne', 'se', 'sw'];
    const pos = { nw: [0, 0], n: [.5, 0], ne: [1, 0], e: [1, .5], se: [1, 1], s: [.5, 1], sw: [0, 1], w: [0, .5] };
    for (const g of gr) {
      const d = document.createElement('div'); d.className = 'griff'; d.dataset.griff = g;
      d.style.left = (b.x + B + b.w * pos[g][0]) * S + 'px'; d.style.top = (b.y + B + b.h * pos[g][1]) * S + 'px';
      d.style.cursor = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' }[g];
      ue.appendChild(d);
    }
  }
  function zeichneSeitenwahl() {
    const n = ST.doc.seiten.length;
    const so = sozial();
    $('#seitenwahl').innerHTML = ST.doc.seiten.map((_, i) => `<button data-seite="${i}" class="${i === ST.seite ? 'an' : ''}">${so ? 'Bild ' + (i + 1) : n === 2 ? (i ? 'Rückseite' : 'Vorderseite') : 'Seite ' + (i + 1)}</button>`).join('') +
      `<button data-seite="neu" title="${so ? 'Bild im gleichen Stil anfügen' : 'Seite hinzufügen'}">+</button>`;
  }
  function zeichnePruefung() {
    const p = DS.pruefe(ST.M, ST.doc), b = $('#btnPruefen');
    $('#pruefZahl').textContent = p.length;
    b.classList.toggle('rot', p.some(x => x.stufe === 'rot')); b.classList.toggle('gut', !p.length);
    b.title = p.length ? p.map(x => x.text).join('\n') : 'Alles druckbereit';
  }

  /* ---------- Eigenschaften ---------- */
  const farbKnoepfe = (aktiv, art) => `<div class="farben">${Object.entries(ST.M.farben).map(([k, v]) => `<button data-farbe="${k}" data-art="${art}" title="${esc(ST.M.farbnamen[k] || k)}" style="background:${v}" class="${aktiv === k ? 'an' : ''}"></button>`).join('')}</div>`;
  const regler = (name, wert, min, max, schritt, anzeige) => `<div class="regler"><input type="range" data-regler="${name}" min="${min}" max="${max}" step="${schritt}" value="${wert}"><output>${anzeige}</output></div>`;
  const masse = (el, felder) => `<div class="masse">${felder.map(([k, t]) => `<label>${t}<input type="number" step="0.5" data-mass="${k}" value="${r2(el[k])}"></label>`).join('')}</div>`;
  const ROLLEN = [['titel', 'Titel'], ['kapitale', 'Kapitale'], ['text', 'Text'], ['kursiv', 'Betont'], ['mono', 'Zeile'], ['plakat', 'Plakatzeile']];
  /* Gestalten (Robert 16.10.2026, für alle Werkzeuge gleich): Schriftart, Textart und Schriftgrösse getrennt wählbar */
  const SCHRIFTEN = [['titel', 'Titel'], ['kapitale', 'Kapitale'], ['text', 'Text'], ['mono', 'Zeile'], ['plakat', 'Plakatzeile']];
  const textart = el => el.rolle === 'kursiv' ? 'kursiv' : el.gross ? 'versal' : 'normal';
  const kursivGeht = el => (el.rolle === 'text' || el.rolle === 'kursiv') && !!ST.M.schriften.kursiv;

  let rechtsSchluessel = '', eTextVor = null, eTextT = 0;
  /* Gestalten als Seitenmenü (Entscheid 16.10.2026 für alle Werkzeuge): offen, sobald ein Element gewählt ist oder die Seite angetippt wird;
     zu mit ×, Esc oder Klick neben das Blatt. Die Grösse des Blatts bleibt dabei gleich, es rückt nur zur Seite. */
  const ZU_KNOPF = '<button class="rechts__zu" data-tu="zu" aria-label="Schliessen (Esc)" title="Schliessen (Esc)"><svg viewBox="0 0 24 24"><path d="M9 14.5 4 9.5l5-5M4 9.5h11a5 5 0 0 1 0 10h-3"/></svg></button>';
  function rechtsOffen(offen) {
    const st = document.querySelector('.studio'); if (!st || st.classList.contains('rechts-zu') === !offen) return;
    st.classList.toggle('rechts-zu', !offen);
  }
  function zeichneEigenschaften() {
    const R = $('#rechts'), el = ST.sel && elById(ST.sel), M = ST.M;
    rechtsOffen(!!el || !!ST.seitePanel);
    if (el && !ST.urform[el.id]) ST.urform[el.id] = JSON.stringify(el);
    const schl = (el ? el.id : 'seite' + ST.seite) + ST.doc.id;
    if (schl !== rechtsSchluessel) { rechtsSchluessel = schl; if (eTextVor) { const vor = eTextVor; eTextVor = null; ST.hist.push(vor); ST.zukunft = []; speichern(); } R.classList.remove('wechsel'); void R.offsetWidth; R.classList.add('wechsel'); }
    if (!el) {
      const s = seite(), q = s.quelle;
      R.innerHTML = `<div class="rechts__kopf"><small>Gestalten</small>${ZU_KNOPF}</div><h2>${sozial() ? (ST.doc.seiten.length > 1 ? 'Bild ' + (ST.seite + 1) + ' von ' + ST.doc.seiten.length : 'Der Beitrag') : ST.doc.seiten.length > 1 ? (ST.doc.seiten.length === 2 ? (ST.seite ? 'Rückseite' : 'Vorderseite') : 'Seite ' + (ST.seite + 1)) : 'Die Seite'}</h2>
        <p class="klein">Ein Element anklicken, um es zu gestalten. Doppelklick auf Text schreibt direkt auf dem Blatt, Doppelklick auf ein Foto verschiebt den Ausschnitt.</p>
        ${window.DSIg ? DSIg.panel(ST.doc) : ''}
        <div class="gruppe"><label>Format</label><select id="eFormat">${Object.entries(DS.FORMATE).map(([k, f]) => `<option value="${k}" ${k === ST.doc.formatKey ? 'selected' : ''}>${f.name.replace(/ /g, '\u00a0')}\u00a0· ${f.b} auf ${f.h} mm</option>`).join('')}</select>
          <p class="klein">Beim Wechsel wird jede Seite im neuen Format neu gesetzt. Texte und Fotos bleiben.</p></div>
        ${q ? `<div class="gruppe"><button class="knopf knopf--voll" data-tu="neuSetzen" style="height:42px">Seite neu setzen<i><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/></svg></i></button>
          <p class="klein">Setzt die Seite mit deinen geänderten Texten und Fotos neu, Abstände stimmen danach wieder.</p></div>` : ''}
        <div class="gruppe"><label>Aufbau</label><select id="eVorlage"><option value="">${q ? '' : 'Frei gestaltet'}</option>${Object.entries(DS.VORLAGEN).map(([k, v]) => `<option value="${k}" ${q && q.vorlage === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select></div>
        <div class="gruppe"><label>Grund</label><div class="segment" id="eTon">${[['dunkel', 'Nacht'], ['hell', 'Warmweiss'], ['creme', 'Plakatpapier'], ['dc', 'Violett']].map(([k, t]) => `<button data-ton="${k}" class="${q && q.ton === k ? 'an' : ''}">${t}</button>`).join('')}</div>
          <div style="margin-top:10px">${farbKnoepfe(s.grund, 'grund')}</div>
          <label style="margin:14px 0 8px">Tapete</label><div class="segment" id="eTapete">${[['', 'Ohne Tapete'], ['dunkel', 'Dunkel'], ['hell', 'Hell']].map(([k, t]) => `<button data-tapete="${k}" class="${(s.tapete || '') === k ? 'an' : ''}">${t}</button>`).join('')}</div></div>
        <div class="gruppe"><label>Seiten</label><div class="knoepfe">${sozial() ? '' : '<button data-tu="rueckseite">Rückseite anlegen</button>'}<button data-tu="seiteKopie">${sozial() ? 'Bild kopieren' : 'Seite kopieren'}</button>
          ${ST.doc.seiten.length > 1 ? `<button data-tu="seiteWeg" class="weg">${sozial() ? 'Bild löschen' : 'Seite löschen'}</button>` : ''}</div></div>`;
      return;
    }
    let h = `<div class="rechts__kopf"><small>Gestalten</small>${ZU_KNOPF}</div><h2>${{ text: 'Text', bild: 'Foto', flaeche: 'Fläche', linie: 'Linie', rahmen: 'Rahmen', zeichen: 'Zeichen' }[el.typ]}</h2>`;
    const masseZeile = (felder) => `<div class="gruppe"><label>Lage in mm</label>${masse(el, felder)}</div>`;
    if (el.typ === 'text') {
      h += `<div class="gruppe gestalten"><label>Schrift</label><div class="segment segment--schrift">${SCHRIFTEN.filter(([k]) => M.schriften[k]).map(([k, t]) => `<button data-rolle="${k}" class="${(el.rolle === 'kursiv' ? 'text' : el.rolle) === k ? 'an' : ''}" style="font-family:'DS-${k}'">${esc(M.schriften[k].familie || t).replace(/ (\S+)$/, '\u00a0$1')}</button>`).join('')}</div></div>
        <div class="gruppe"><label>Grösse</label><div class="groesse"><button data-grschritt="-1" aria-label="Kleiner">−</button><input type="number" min="4" max="400" step="0.5" data-grpt="1" value="${r2(el.gr * PT)}"><span>pt</span><button data-grschritt="1" aria-label="Grösser">+</button></div>
          ${regler('gr', el.gr, .8, Math.max(40, el.gr), .05, r2(el.gr * PT) + ' pt')}</div>
        <div class="gruppe"><label>Textart</label><div class="segment">${[['normal', 'Normal'], ['kursiv', 'Betont'], ['versal', 'Versalien gesperrt']].map(([k, t]) => `<button data-textart="${k}" class="${textart(el) === k ? 'an' : ''}" ${k === 'kursiv' && !kursivGeht(el) ? 'disabled title="Kursiv gibt es in der Hausschrift nur für Instrument Sans"' : ''}>${t}</button>`).join('')}</div></div>
        <div class="gruppe"><label>Farbe</label>${farbKnoepfe(el.farbe, 'el')}</div>
        <div class="gruppe"><label>Ausrichtung</label><div class="segment">${[['l', 'Links'], ['c', 'Mitte'], ['r', 'Rechts']].map(([k, t]) => `<button data-ausr="${k}" class="${(el.ausr || 'l') === k ? 'an' : ''}">${t}</button>`).join('')}</div></div>
        <div class="gruppe"><label>Abstände</label><label class="unter">Sperrung</label>${regler('sperr', el.sperr || 0, -.03, .45, .01, (el.sperr || 0).toFixed(2))}
          <label class="unter">Zeilenabstand</label>${regler('zeile', el.zeile || 1.2, .85, 2.2, .01, (el.zeile || 1.2).toFixed(2))}
          <label class="unter">Deckkraft</label>${regler('deck', el.deck ?? 1, .2, 1, .01, Math.round((el.deck ?? 1) * 100) + ' %')}</div>
        <div class="gruppe"><label>Inhalt</label><textarea class="textfeld" id="eText" rows="3">${esc(el.text)}</textarea><p class="klein">Oder doppelt auf den Text klicken und direkt auf dem Blatt schreiben.</p></div>
        ${masseZeile([['x', 'Links'], ['y', 'Oben'], ['w', 'Breite']])}`;
    } else if (el.typ === 'bild') {
      const b = M.bildIndex[el.bild];
      h += `<div class="gruppe"><label>Grösse in mm</label>${masse(el, [['w', 'Breite'], ['h', 'Höhe']])}<div class="knoepfe" style="margin-top:10px"><button data-tu="randlos">Randlos</button></div></div>
        <div class="gruppe"><label>Ausschnitt</label>${regler('zoom', el.zoom || 1, 1, 3, .01, Math.round((el.zoom || 1) * 100) + ' %')}
          ${regler('fx', el.fx ?? .5, 0, 1, .01, 'links/rechts')}${regler('fy', el.fy ?? .5, 0, 1, .01, 'oben/unten')}
          <p class="klein">Oder doppelt auf das Foto klicken und den Ausschnitt mit der Maus schieben.</p></div>
        <div class="gruppe"><label>Foto</label><p class="klein" style="margin:0 0 8px">${esc(b ? b.alt : 'kein Foto')}</p><div class="knoepfe"><button data-tu="fotoWahl">Foto tauschen</button></div></div>
        <div class="gruppe ki-anpassen"><label>Mit KI anpassen</label><textarea id="kiWunsch" rows="2" placeholder="Etwa: Farben wärmer, Hintergrund dunkler"></textarea>
          <div class="knoepfe" style="margin-top:8px"><button data-tu="kiAnpassen">Anpassen</button></div><p class="klein" id="kiHinweis">Läuft über das KI-Konto des Hauses. Das Original bleibt unter «Eigene Fotos», «Zurück» holt es wieder.</p></div>
        <div class="gruppe"><label>Ecken</label>${regler('r', el.r || 0, 0, 20, .5, r2(el.r || 0) + ' mm')}</div>
        ${masseZeile([['x', 'Links'], ['y', 'Oben']])}`;
    } else if (el.typ === 'flaeche') {
      h += `<div class="gruppe"><label>Farbe</label>${farbKnoepfe(el.farbe, 'el')}
          <div class="segment" style="margin-top:10px">${[['', 'Ohne Tapete'], ['dunkel', 'Dunkel'], ['hell', 'Hell']].map(([k, t]) => `<button data-eltapete="${k}" class="${(el.tapete || '') === k ? 'an' : ''}">${t}</button>`).join('')}</div></div>
        <div class="gruppe"><label>Deckkraft</label>${regler('deck', el.deck ?? 1, .1, 1, .01, Math.round((el.deck ?? 1) * 100) + ' %')}<label class="unter">Ecken</label>${regler('r', el.r || 0, 0, 40, .5, r2(el.r || 0) + ' mm')}</div>
        ${masseZeile([['x', 'Links'], ['y', 'Oben'], ['w', 'Breite'], ['h', 'Höhe']])}`;
    } else if (el.typ === 'linie' || el.typ === 'rahmen') {
      const senk = el.typ === 'linie' && el.h > el.w;
      h += `<div class="gruppe"><label>Stärke</label>${regler('staerke', el.staerke, .1, 2, .05, r2(el.staerke * PT * 10) / 10 + ' pt')}</div>
        <div class="gruppe"><label>${el.typ === 'rahmen' ? 'Grösse in mm' : 'Länge in mm'}</label>${masse(el, el.typ === 'rahmen' ? [['w', 'Breite'], ['h', 'Höhe']] : senk ? [['h', 'Länge']] : [['w', 'Länge']])}</div>
        <div class="gruppe"><label>Farbe</label>${farbKnoepfe(el.farbe, 'el')}</div>
        <div class="gruppe"><label>Deckkraft</label>${regler('deck', el.deck ?? 1, .1, 1, .01, Math.round((el.deck ?? 1) * 100) + ' %')}
          ${el.typ === 'rahmen' ? `<label class="unter">Ecken</label>${regler('r', el.r || 0, 0, 20, .5, r2(el.r || 0) + ' mm')}` : ''}</div>
        ${masseZeile([['x', 'Links'], ['y', 'Oben']])}`;
    } else if (el.typ === 'zeichen') {
      h += `<div class="gruppe"><label>Grösse in mm</label>${masse(el, [['w', 'Breite']])}</div>
        <div class="gruppe"><label>Farbe</label>${farbKnoepfe(el.farbe, 'el')}</div>
        <div class="gruppe"><label>Deckkraft</label>${regler('deck', el.deck ?? 1, .05, 1, .01, Math.round((el.deck ?? 1) * 100) + ' %')}</div>
        ${masseZeile([['x', 'Links'], ['y', 'Oben']])}`;
    }
    h += `<div class="gruppe"><label>Anordnen</label><div class="knoepfe">
      <button data-tu="mitteH">Waagrecht mittig</button><button data-tu="mitteV">Senkrecht mittig</button>
      <button data-tu="vorn">Nach vorn</button><button data-tu="hinten">Nach hinten</button>
      <button data-tu="kopie">Duplizieren</button></div></div>
      <div class="gruppe rechts__fuss"><div class="knoepfe"><button data-tu="zuruecksetzen" ${ST.urform[el.id] && ST.urform[el.id] !== JSON.stringify(el) ? '' : 'disabled'}>Teil zurücksetzen</button><button data-tu="weg" class="weg">Entfernen</button></div></div>`;
    R.innerHTML = h;
  }

  /* Eigenschaften: Ereignisse */
  function rechtsEreignisse() {
    const R = $('#rechts');
    let reglerStart = null;
    R.addEventListener('input', e => {
      const t = e.target, el = ST.sel && elById(ST.sel);
      if (t.dataset.regler && el) {
        if (!reglerStart) { reglerStart = JSON.stringify(ST.doc); }
        const k = t.dataset.regler, v = +t.value;
        el[k] = v;
        if (el.typ === 'text') el.h = DS.mess(el).h;
        const alt = domVon(el.id), neu = DS.elementDom(ST.M, el, ST.S, { editor: true });
        alt.replaceWith(neu); zeichneAuswahl();
        const out = t.parentNode.querySelector('output');
        out.textContent = k === 'gr' ? r2(v * PT) + ' pt' : k === 'deck' || k === 'zoom' ? Math.round(v * 100) + ' %' : k === 'r' ? r2(v) + ' mm' : k === 'staerke' ? r2(v * PT * 10) / 10 + ' pt' : k === 'fx' ? 'links/rechts' : k === 'fy' ? 'oben/unten' : v.toFixed(2);
      }
      if (t.id === 'eText' && el) {
        if (!eTextVor) eTextVor = JSON.stringify(ST.doc);   // Stand vor dem ersten Buchstaben, damit «Rückgängig» das ganze Tippen zurücknimmt (Prüfung 16.10.2026)
        $('#btnZurueck').disabled = false;
        clearTimeout(eTextT); eTextT = setTimeout(() => { if (ST.doc) speichern(); }, 900);   // auch ohne Verlassen des Felds gesichert (Fenster zu, Akku leer)
        el.text = t.value; el.h = DS.mess(el).h;
        domVon(el.id).replaceWith(DS.elementDom(ST.M, el, ST.S, { editor: true })); zeichneAuswahl();
      }
    });
    R.addEventListener('change', e => {
      const t = e.target, el = ST.sel && elById(ST.sel);
      if (t.dataset.regler && reglerStart) {
        ST.hist.push(reglerStart); ST.zukunft = []; reglerStart = null; seite().frei = true; speichern(); zeichne(); return;
      }
      if (t.id === 'eText' && el) {
        const v = t.value, vor = eTextVor || JSON.stringify(ST.doc); eTextVor = null;
        ST.hist.push(vor); if (ST.hist.length > 100) ST.hist.shift(); ST.zukunft = [];
        el.text = v; setzeSlot(seite(), el.slot, v); for (const x of seite().el) if (x.typ === 'text') x.h = DS.mess(x).h;
        speichern(); zeichne(); return;
      }
      if (t.dataset.mass && el) { const k = t.dataset.mass, v = +t.value; aendern(() => { el[k] = v; }); return; }
      if (t.dataset.grpt && el && +t.value > 0) { const v = Math.min(400, Math.max(4, +t.value)); aendern(() => { el.gr = v / PT; el.h = DS.mess(el).h; }); return; }
      if (t.id === 'eFormat') return umsetzenFormat(t.value);
      if (t.id === 'eVorlage' && t.value) return umsetzenSeite({ vorlage: t.value });
    });
    R.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const el = ST.sel && elById(ST.sel), s = seite(), f = ST.doc.format;
      if (b.dataset.ig && window.DSIg) { DSIg.klick(b.dataset.ig); return; }
      if (b.dataset.farbe) {
        const k = b.dataset.farbe;
        if (b.dataset.art === 'grund') aendern(() => { s.grund = k; }, false); else aendern(() => { el.farbe = k; });
      } else if (b.dataset.rolle) aendern(() => { const versal = el.gross, sp = el.sperr; el.rolle = b.dataset.rolle; const S0 = DS.STIL[el.rolle] || {}; Object.assign(el, { zeile: S0.zeile || 1.2, sperr: S0.sperr || 0, gross: !!S0.gross }); if (versal) Object.assign(el, { gross: true, sperr: Math.max(sp || 0, el.sperr || 0) }); el.h = DS.mess(el).h; });
      else if (b.dataset.textart) aendern(() => {
        const a = b.dataset.textart;
        if (a === 'kursiv') { el.rolle = 'kursiv'; el.gross = false; }
        else { if (el.rolle === 'kursiv') el.rolle = 'text'; el.gross = a === 'versal'; el.sperr = a === 'versal' ? Math.max(el.sperr || 0, .08) : (DS.STIL[el.rolle] && !DS.STIL[el.rolle].gross ? DS.STIL[el.rolle].sperr || 0 : 0); }
        el.h = DS.mess(el).h;
      });
      else if (b.dataset.grschritt) aendern(() => { el.gr = Math.max(4 / PT, (Math.round(el.gr * PT) + +b.dataset.grschritt) / PT); el.h = DS.mess(el).h; });
      else if (b.dataset.ausr) aendern(() => { el.ausr = b.dataset.ausr; });
      else if (b.dataset.gross) aendern(() => { el.gross = !el.gross; });
      else if (b.dataset.eltapete !== undefined) aendern(() => { el.tapete = b.dataset.eltapete || null; });
      else if (b.dataset.tapete !== undefined) aendern(() => { s.tapete = b.dataset.tapete || null; }, false);
      else if (b.dataset.ton) umsetzenSeite({ ton: b.dataset.ton });
      else if (b.dataset.tu) {
        const tu = b.dataset.tu;
        if (tu === 'zu') { ST.sel = null; ST.seitePanel = false; zeichne(); return; }
        if (tu === 'zuruecksetzen') { const u = ST.urform[el.id]; if (u) aendern(() => { Object.keys(el).forEach(k => delete el[k]); Object.assign(el, JSON.parse(u)); }); return; }
        if (tu === 'weg') { aendern(() => { s.el = s.el.filter(x => x !== el); }); ST.sel = null; zeichne(); }
        else if (tu === 'kopie') { const k = JSON.parse(JSON.stringify(el)); k.id = DS.neueId(); k.x += 4; k.y += 4; delete k.slot; aendern(() => s.el.push(k)); ST.sel = k.id; zeichne(); }
        else if (tu === 'vorn') aendern(() => { const i = s.el.indexOf(el); if (i < s.el.length - 1) { s.el.splice(i, 1); s.el.splice(i + 1, 0, el); } });
        else if (tu === 'hinten') aendern(() => { const i = s.el.indexOf(el); if (i > 0) { s.el.splice(i, 1); s.el.splice(i - 1, 0, el); } });
        else if (tu === 'mitteH') aendern(() => { el.x = (f.b - el.w) / 2; });
        else if (tu === 'mitteV') aendern(() => { el.y = (f.h - DS.elHoehe(ST.M, el)) / 2; });
        else if (tu === 'randlos') aendern(() => Object.assign(el, { x: -B, y: -B, w: f.b + 2 * B, h: f.h + 2 * B, r: 0 }));
        else if (tu === 'fotoWahl') zeigeTab('fotos');
        else if (tu === 'kiAnpassen') kiAnpassen(el, b);
        else if (tu === 'neuSetzen') umsetzenSeite({});
        else if (tu === 'rueckseite') { aendern(() => ST.doc.seiten.push(DS.setze(ST.M, ST.doc.formatKey, 'rueckseite', seite().quelle?.ton || 'dunkel', DS.BEISPIEL.rueckseite)), false); ST.seite = ST.doc.seiten.length - 1; zeichne(); }
        else if (tu === 'seiteKopie') { const k = JSON.parse(JSON.stringify(s)); k.el.forEach(x => x.id = DS.neueId()); aendern(() => ST.doc.seiten.splice(ST.seite + 1, 0, k), false); ST.seite++; zeichne(); }
        else if (tu === 'seiteWeg') { aendern(() => { ST.doc.seiten.splice(ST.seite, 1); ST.seite = Math.max(0, Math.min(ST.seite - 1, ST.doc.seiten.length - 1)); }, false); zeichne(); }
      }
    });
  }

  /* ---------- Umsetzen: Format, Aufbau, Ton ---------- */
  async function frag(text) {
    return dialog(`<h2>Neu setzen?</h2><p>${text}</p>`, [{ t: 'Abbrechen', v: false }, { t: 'Neu setzen', v: true, haupt: true }]);
  }
  async function umsetzenSeite(neu) {
    const s = seite();
    const q = s.quelle || { vorlage: 'deckel', ton: 'dunkel', inhalt: ausSeiteInhalt(s) };
    if (s.frei && !(await frag('Die Seite wird mit dem neuen Aufbau neu gesetzt. Texte und Fotos bleiben, deine Verschiebungen auf dieser Seite gehen dabei verloren.'))) return zeichne();
    ST.auftritt = true;
    aendern(() => { ST.doc.seiten[ST.seite] = DS.setze(ST.M, ST.doc.formatKey, neu.vorlage || q.vorlage, neu.ton || q.ton, q.inhalt, q.stil); }, false);
    ST.sel = null; zeichne();
  }
  async function umsetzenFormat(fk) {
    const alt = ST.doc.format, nf = DS.FORMATE[fk];
    if (ST.doc.seiten.some(s => s.frei && s.quelle) && !(await frag('Alle Seiten werden im neuen Format neu gesetzt. Texte und Fotos bleiben, Verschiebungen gehen verloren.'))) return zeichne();
    aendern(() => {
      ST.doc.seiten = ST.doc.seiten.map(s => {
        if (s.quelle) return DS.setze(ST.M, fk, s.quelle.vorlage, s.quelle.ton, s.quelle.inhalt, s.quelle.stil);
        const kx = nf.b / alt.b, ky = nf.h / alt.h, k = Math.sqrt(kx * ky);
        s.el.forEach(e => { e.x *= kx; e.y *= ky; e.w *= kx; if (e.h) e.h *= ky; if (e.gr) e.gr *= k; });
        return s;
      });
      ST.doc.formatKey = fk; ST.doc.format = { b: nf.b, h: nf.h };
      ST.auftritt = true;
    }, false);
    ST.sel = null; passeZoom(); zeichne();
  }
  function ausSeiteInhalt(s) {
    const t = s.el.filter(e => e.typ === 'text').sort((a, b) => b.gr - a.gr);
    const bild = s.el.find(e => e.typ === 'bild');
    return { titel: t[0]?.text || 'Titel', text: t[1]?.text || '', bild: bild?.bild };
  }

  /* ---------- Neue Elemente ---------- */
  function neuesElement(art, bildKey, an) {
    const f = ST.doc.format, s = seite(), q = s.quelle, T = ST.M.toene[q?.ton || (s.grund === 'papier' || s.grund === 'creme' || s.grund === 'weiss' ? 'hell' : 'dunkel')];
    const k = Math.pow(Math.sqrt(f.b * f.h / (105 * 148)), .8), id = DS.neueId(), w = f.b * .7, x = (f.b - w) / 2, y = f.h * .4;
    const E = {
      titel: { typ: 'text', rolle: 'titel', text: 'Neuer Titel', gr: 8 * k, farbe: T.titel, ausr: 'c', x, y, w, ...DS.STIL.titel },
      text: { typ: 'text', rolle: 'text', text: 'Dein Text', gr: 2.8 * k, farbe: T.text, ausr: 'c', x, y, w, ...DS.STIL.text },
      zeile: { typ: 'text', rolle: 'mono', text: 'Eine Zeile', gr: 1.9 * k, farbe: T.mono, ausr: 'c', x, y, w, ...DS.STIL.mono },
      bild: (() => { const bb = ST.M.bildIndex[bildKey || DS.ersatzFoto(ST.M)] || { w: 3, h: 2 }; let w = f.b * .7, h = w * bb.h / bb.w; if (h > f.h * .7) { h = f.h * .7; w = h * bb.w / bb.h; } return { typ: 'bild', bild: bildKey || DS.ersatzFoto(ST.M), x: (f.b - w) / 2, y: (f.h - h) / 2, w, h, fx: .5, fy: .5, zoom: 1 }; })(),
      zeichen: { typ: 'zeichen', x: (f.b - 18 * k) / 2, y: f.h * .2, w: 18 * k, farbe: T.zeichen },
      linie: { typ: 'linie', x: (f.b - 14 * k) / 2, y: f.h * .5, w: 14 * k, h: 0, staerke: .3, farbe: T.linie },
      flaeche: { typ: 'flaeche', x: f.b * .2, y: f.h * .3, w: f.b * .6, h: f.h * .3, farbe: T.grund === 'navy' ? 'papier' : 'navy', tapete: null, r: 0 },
      rahmen: { typ: 'rahmen', x: 5 * k, y: 5 * k, w: f.b - 10 * k, h: f.h - 10 * k, staerke: .25, r: 2.2 * k, farbe: T.linie },
    }[art];
    E.id = id; E.deck = 1;
    if (E.typ === 'text') E.h = DS.mess(E).h;
    if (bildKey && ST.M.bildIndex[bildKey]?.datei) { const bb = ST.M.bildIndex[bildKey]; E.w = f.b * (bb.w / bb.h > 3 ? .7 : .45); E.h = E.w * bb.h / bb.w; E.x = (f.b - E.w) / 2; E.y = (f.h - E.h) / 2; }   // Logo, Wortmarke
    if (an) { E.x = an.x - E.w / 2; E.y = an.y - (E.h || E.w) / 2; }   // abgelegt an einer Stelle (Le Livre)
    if (an && an.farbe) E.farbe = an.farbe;
    aendern(() => s.el.push(E));
    ST.sel = id; zeichne();
  }

  /* ---------- Maus auf dem Blatt ---------- */
  function fang(b, el, art) {
    const f = ST.doc.format, th = 7 / ST.S, gx = [0, f.b / 2, f.b, DS.SICHER, f.b - DS.SICHER, -B, f.b + B], gy = [0, f.h / 2, f.h, DS.SICHER, f.h - DS.SICHER, -B, f.h + B];
    for (const o of seite().el) {
      if (o === el) continue;
      const oh = DS.elHoehe(ST.M, o);
      gx.push(o.x, o.x + o.w / 2, o.x + o.w); gy.push(o.y, o.y + oh / 2, o.y + oh);
    }
    const linien = [];
    const best = (werte, kand) => {
      let bd = th, bv = null, bk = null;
      for (const [w, i] of werte) for (const k of kand) { const d = Math.abs(w - k); if (d < bd) { bd = d; bv = k - w; bk = k; } }
      return bv === null ? null : { d: bv, k: bk };
    };
    if (art === 'zieh') {
      const sx = best([[b.x, 0], [b.x + b.w / 2, 1], [b.x + b.w, 2]], gx); if (sx) { b.x += sx.d; linien.push({ x: sx.k }); }
      const sy = best([[b.y, 0], [b.y + b.h / 2, 1], [b.y + b.h, 2]], gy); if (sy) { b.y += sy.d; linien.push({ y: sy.k }); }
    } else {
      if (art.includes('e')) { const s = best([[b.x + b.w, 0]], gx); if (s) { b.w += s.d; linien.push({ x: s.k }); } }
      if (art.includes('w')) { const s = best([[b.x, 0]], gx); if (s) { b.x += s.d; b.w -= s.d; linien.push({ x: s.k }); } }
      if (art.includes('s')) { const s = best([[b.y + b.h, 0]], gy); if (s) { b.h += s.d; linien.push({ y: s.k }); } }
      if (art.includes('n')) { const s = best([[b.y, 0]], gy); if (s) { b.y += s.d; b.h -= s.d; linien.push({ y: s.k }); } }
    }
    return linien;
  }
  function zeigeLinien(linien, b) {
    const ue = $('#ueber'), S = ST.S, f = ST.doc.format;
    ue.querySelectorAll('.hl,.mass').forEach(n => n.remove());
    for (const l of linien) {
      const d = document.createElement('div'); d.className = 'hl';
      if (l.x !== undefined) Object.assign(d.style, { left: (l.x + B) * S + 'px', top: 0, width: '1px', height: (f.h + 2 * B) * S + 'px' });
      else Object.assign(d.style, { top: (l.y + B) * S + 'px', left: 0, height: '1px', width: (f.b + 2 * B) * S + 'px' });
      ue.appendChild(d);
    }
    if (b) { const m = document.createElement('div'); m.className = 'mass'; m.style.left = (b.x + B + b.w / 2) * S + 'px'; m.style.top = (b.y + B) * S + 'px'; m.textContent = `${r2(b.x)} · ${r2(b.y)} mm  ${r2(b.w)} auf ${r2(b.h)}`; ue.appendChild(m); }
  }

  /* Element unter dem Zeiger: Rahmen nur am Rand greifbar, sonst liegt ein seitengrosser Rahmen über allem */
  function elUnter(e, bevorzugt) {
    const S = ST.S, liste = [];
    for (const n of document.elementsFromPoint(e.clientX, e.clientY)) {
      const d = n.closest && n.closest('.blatt .el'); if (!d || liste.includes(d)) continue;
      if (d.classList.contains('el-rahmen')) {
        const r = d.getBoundingClientRect(), t = Math.max(6, 2 * S);
        const amRand = e.clientX - r.left < t || r.right - e.clientX < t || e.clientY - r.top < t || r.bottom - e.clientY < t;
        if (!amRand) continue;
      }
      liste.push(d);
    }
    return liste.find(n => n.dataset.id === bevorzugt) || liste[0] || null;
  }

  function blattEreignisse() {
    const wirt = $('#wirt');
    let zug = null;
    wirt.addEventListener('pointerdown', e => {
      e.__wirt = true;   // das Blatt wird gleich neu gezeichnet; der Griff an #flaeche weiss so, dass der Klick auf dem Blatt war
      if (ST.modus === 'text') { if (e.target.closest('.el') && e.target.closest('.el').dataset.id === ST.sel) return; textEnde(); }
      const griff = e.target.closest('.griff');
      const elDom = griff ? null : elUnter(e);
      if (ST.modus === 'ausschnitt') {
        const el = elById(ST.sel);
        if (elDom && elDom.dataset.id === ST.sel) { zug = { art: 'ausschnitt', el, px: e.clientX, py: e.clientY, fx: el.fx ?? .5, fy: el.fy ?? .5, vorher: JSON.stringify(ST.doc) }; wirt.setPointerCapture(e.pointerId); return; }
        ST.modus = null;
      }
      if (griff) {
        const el = elById(ST.sel);
        zug = { art: griff.dataset.griff, el, px: e.clientX, py: e.clientY, b0: { x: el.x, y: el.y, w: el.w, h: DS.elHoehe(ST.M, el) }, vorher: JSON.stringify(ST.doc), bewegt: false };
        wirt.setPointerCapture(e.pointerId); e.preventDefault(); return;
      }
      if (!elDom) { const bq = wirt.querySelector('.blatt')?.getBoundingClientRect(), aufBlatt = !!bq && e.clientX >= bq.left && e.clientX <= bq.right && e.clientY >= bq.top && e.clientY <= bq.bottom; if (ST.sel || ST.seitePanel !== aufBlatt) { ST.sel = null; ST.seitePanel = aufBlatt; zeichne(); } return; }
      const id = elDom.dataset.id, el = elById(id);
      if (ST.sel !== id) { ST.sel = id; zeichneAuswahl(); zeichneEigenschaften(); markiereFoto(); }
      zug = { art: 'zieh', el, px: e.clientX, py: e.clientY, b0: { x: el.x, y: el.y, w: el.w, h: DS.elHoehe(ST.M, el) }, vorher: JSON.stringify(ST.doc), bewegt: false };
      wirt.setPointerCapture(e.pointerId); e.preventDefault();
    });
    wirt.addEventListener('pointermove', e => {
      if (!zug) return;
      const S = ST.S, dx = (e.clientX - zug.px) / S, dy = (e.clientY - zug.py) / S, el = zug.el;
      if (zug.art === 'ausschnitt') {
        const b = ST.M.bildIndex[el.bild], a = DS.ausschnitt(el, b.w, b.h);
        const rx = el.w - a.bw, ry = el.h - a.bh;
        el.fx = rx ? Math.min(1, Math.max(0, zug.fx + dx / rx)) : .5; el.fy = ry ? Math.min(1, Math.max(0, zug.fy + dy / ry)) : .5;
        domVon(el.id).replaceWith(DS.elementDom(ST.M, el, S, { editor: true }));
        return;
      }
      if (!zug.bewegt && Math.hypot(e.clientX - zug.px, e.clientY - zug.py) < 3) return;
      zug.bewegt = true;
      const b = Object.assign({}, zug.b0), a = zug.art;
      let linien = [];
      if (a === 'zieh') { b.x += dx; b.y += dy; if (!e.altKey) linien = fang(b, el, 'zieh'); }
      else {
        const prop = el.typ === 'zeichen' || (el.typ === 'bild' && e.shiftKey);
        if (a.includes('e')) b.w = Math.max(2, zug.b0.w + dx);
        if (a.includes('w')) { b.w = Math.max(2, zug.b0.w - dx); b.x = zug.b0.x + zug.b0.w - b.w; }
        if (a.includes('s')) b.h = Math.max(1, zug.b0.h + dy);
        if (a.includes('n')) { b.h = Math.max(1, zug.b0.h - dy); b.y = zug.b0.y + zug.b0.h - b.h; }
        if (prop) { const r = zug.b0.h / zug.b0.w; b.h = b.w * r; if (a.includes('n')) b.y = zug.b0.y + zug.b0.h - b.h; }
        else if (!e.altKey) linien = fang(b, el, a);
      }
      el.x = b.x; el.y = b.y; el.w = b.w;
      if (el.typ === 'text') { el.h = DS.mess(el).h; b.h = el.h; }
      else if (el.typ === 'zeichen') b.h = el.w * DS.zz(ST.M, el).verh;
      else el.h = b.h;
      if (el.typ === 'linie' && !(el.h > el.w)) el.h = 0;
      domVon(el.id).replaceWith(DS.elementDom(ST.M, el, S, { editor: true }));
      zeichneAuswahl(b); zeigeLinien(linien, b);
    });
    const ende = () => {
      if (!zug) return;
      const z = zug; zug = null;
      if (z.art === 'ausschnitt' || z.bewegt) {
        ST.hist.push(z.vorher); ST.zukunft = []; if (z.art !== 'ausschnitt') seite().frei = true;
        speichern(); zeichne();
      }
    };
    wirt.addEventListener('pointerup', ende); wirt.addEventListener('pointercancel', ende);
    wirt.addEventListener('dblclick', e => {
      // Durch das Festhalten des Zeigers kommt der Doppelklick am Wirt an: Element unter dem Zeiger suchen, bevorzugt das gewählte
      const d = elUnter(e, ST.sel); if (!d) return;
      const el = elById(d.dataset.id); ST.sel = el.id;
      if (el.typ === 'text') textStart(el);
      else if (el.typ === 'bild') { ST.modus = 'ausschnitt'; zeichneAuswahl(); melde('Ausschnitt verschieben: auf dem Foto ziehen. Fertig mit Esc oder Klick daneben.'); }
    });
    wirt.addEventListener('wheel', e => {
      if (ST.modus !== 'ausschnitt') return;
      e.preventDefault();
      const el = elById(ST.sel); el.zoom = Math.min(3, Math.max(1, (el.zoom || 1) * (e.deltaY < 0 ? 1.04 : 1 / 1.04)));
      domVon(el.id).replaceWith(DS.elementDom(ST.M, el, ST.S, { editor: true }));
      clearTimeout(wirt._z); wirt._z = setTimeout(() => { speichern(); zeichneEigenschaften(); zeichnePruefung(); }, 300);
    }, { passive: false });
  }

  let textVorher = null;
  function textStart(el) {
    ST.modus = 'text'; textVorher = JSON.stringify(ST.doc);
    const d = domVon(el.id);
    d.contentEditable = 'plaintext-only';
    if (d.contentEditable !== 'plaintext-only') d.contentEditable = 'true';
    d.focus();
    const r = document.createRange(); r.selectNodeContents(d); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    zeichneAuswahl();
    d.addEventListener('input', () => { el.text = textAus(d); el.h = DS.mess(el).h; zeichneAuswahl(); });
    d.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); textEnde(); } });
  }
  function textAus(d) {
    let t = '';
    for (const n of d.childNodes) t += n.nodeType === 3 ? n.textContent : n.nodeName === 'BR' ? '\n' : (t && !t.endsWith('\n') ? '\n' : '') + n.textContent;
    return t.replace(/\n$/, '');
  }
  function textEnde() {
    if (ST.modus !== 'text') return;
    const el = elById(ST.sel), d = domVon(ST.sel);
    ST.modus = null;
    if (el && d) {
      const neu = textAus(d);
      ST.hist.push(textVorher); ST.zukunft = [];
      el.text = neu; el.h = DS.mess(el).h; setzeSlot(seite(), el.slot, neu);
      speichern();
    }
    zeichne();
  }

  /* ---------- Tastatur ---------- */
  function tasten() {
    document.addEventListener('keydown', e => {
      const inFeld = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || ST.modus === 'text';
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key.toLowerCase() === 'z' && !inFeld) { e.preventDefault(); e.shiftKey ? vor() : zurueck(); return; }
      if (cmd && e.key.toLowerCase() === 's' && ST.doc && $('#start').hidden) { e.preventDefault(); if (document.activeElement && document.activeElement.id === 'eText') document.activeElement.blur(); if (ST.modus === 'text') textEnde(); speichern(); melde('Gespeichert. Die Drucksache liegt in Meine Medien.'); return; }   // ⌘S (R09): statt «Seite sichern» des Browsers
      if (inFeld) return;
      if (e.key === 'Escape') { if (ST.modus === 'ausschnitt') { ST.modus = null; zeichne(); } else if (ST.sel || ST.seitePanel) { ST.sel = null; ST.seitePanel = false; zeichne(); } }
      const el = ST.sel && elById(ST.sel); if (!el) return;
      if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); aendern(() => { seite().el = seite().el.filter(x => x !== el); }); ST.sel = null; zeichne(); }
      if (cmd && e.key.toLowerCase() === 'd') { e.preventDefault(); const k = JSON.parse(JSON.stringify(el)); k.id = DS.neueId(); k.x += 4; k.y += 4; delete k.slot; aendern(() => seite().el.push(k)); ST.sel = k.id; zeichne(); }
      const schritt = e.shiftKey ? 5 : .5;
      const pfeil = { ArrowLeft: [-schritt, 0], ArrowRight: [schritt, 0], ArrowUp: [0, -schritt], ArrowDown: [0, schritt] }[e.key];
      if (pfeil) { e.preventDefault(); aendern(() => { el.x += pfeil[0]; el.y += pfeil[1]; }); }
      if (e.key === 'Enter' && el.typ === 'text') { e.preventDefault(); textStart(el); }
    });
  }

  /* ---------- Linke Spalte ---------- */
  function gleiter() {
    const b = $('.reiter button.an'), g = $('.reiter__gleiter'); if (!b || !g) return;
    g.style.width = b.offsetWidth + 'px'; g.style.transform = `translateX(${b.offsetLeft}px)`;
  }
  function zeigeTab(t) {
    $$('.reiter button').forEach(b => b.classList.toggle('an', b.dataset.tab === t));
    gleiter();
    $$('.tab').forEach(s => s.classList.toggle('an', s.dataset.tab === t));
    if (t === 'vorlagen') zeichneVorlagen();
    if (t === 'fotos') { zeichneFotos(); markiereFoto(); }
    if (t === 'ablage') zeichneAblage();
  }
  function miniBox(doc, i, box, o) {   // o: { laden: 'lazy' | 'eager', prio: 'high' | 'low' } für die Bilder der Vorschau
    const f = doc.format, S = Math.min(box / (f.b + 2 * B), box / (f.h + 2 * B));
    const p = DS.seiteDom(ST.M, doc, i, S, Object.assign({ mini: true }, o));
    p.style.width = (f.b) * S + 'px'; p.style.height = f.h * S + 'px';
    [...p.children].forEach(c => { c.style.left = parseFloat(c.style.left) - B * S + 'px'; c.style.top = parseFloat(c.style.top) - B * S + 'px'; });
    p.style.backgroundPosition = '0 0';
    return p;
  }
  function zeichneVorlagen() {
    const fk = $('#vorlageFormat').value, ton = $('#vorlageTon').value, box = $('#vorlagen');
    box.innerHTML = '';
    for (const [k, v] of Object.entries(DS.VORLAGEN)) {
      if (!DS.formatPasst(k, fk)) continue;   // nur Aufbauten, die für dieses Format gemacht sind
      const doc = { format: { b: DS.FORMATE[fk].b, h: DS.FORMATE[fk].h }, formatKey: fk, seiten: [DS.setze(ST.M, fk, k, ton, DS.BEISPIEL[k])] };
      const b = document.createElement('button'); b.className = 'vk'; b.dataset.vorlage = k; b.style.setProperty('--i', box.children.length);
      b.innerHTML = `<div class="vk__bild"></div><b>${esc(v.name).replace(/ (\S+)$/, '\u00a0$1')}</b><small>${esc(v.wofuer)}</small>`;
      b.firstChild.appendChild(miniBox(doc, 0, 132));
      box.appendChild(b);
    }
  }
  const GRUPPEN = ["Eigene Fotos", "Plakat-Motive", "Plakate", "Der Abend & die Tafel", "Teller & Küche", "Drinks & Bar", "Die Leute", "Linden & das Haus", "Dirty Chicken"];
  const lageVon = b => b.w > b.h * 1.1 ? 'quer' : b.h > b.w * 1.1 ? 'hoch' : 'quadrat';
  function fotoListe() {
    const q = $('#fotoSuche').value.trim().toLowerCase();
    const W = q.split(/\s+/).filter(Boolean), g = ST.fotoGruppe || 'alle', lage = ST.fotoLage || 'alle';
    const T = DS.LIVRE_TEXT, mehr = b => b.saison ? ' ' + T.s[b.saison] + ' ' + T.h[b.herkunft] + (b.ki ? ' ki' : '') : '';
    return ST.M.bilder.filter(b => (g === 'alle' ? b.bereich !== 'motive' : b.gruppe === g) && (lage === 'alle' || lageVon(b) === lage || (lage === 'hoch' && lageVon(b) === 'quadrat'))
      && (!W.length || W.every(w => (b.alt + ' ' + b.key + ' ' + (b.gruppe || '') + mehr(b)).toLowerCase().includes(w))));
  }
  function fotoHinweis(n) { return `${n} ${n === 1 ? 'Foto' : 'Fotos'}. ` + (ST.sel && elById(ST.sel)?.typ === 'bild' ? 'Ein Klick tauscht das gewählte Foto.' : 'Ein Klick legt das Foto aufs Blatt.'); }
  function zeichneFotos() {
    const zahl = {}; ST.M.bilder.forEach(b => zahl[b.gruppe] = (zahl[b.gruppe] || 0) + 1);
    const g = ST.fotoGruppe || 'alle';
    $('#fotoFilter').innerHTML = `<button data-gruppe="alle" class="${g === 'alle' ? 'an' : ''}">Alle Fotos<i>${ST.M.bilder.filter(b => b.bereich !== 'motive').length}</i></button>` +
      (ST.M.livre ? [DS.eigene.GRUPPE, ...Object.values(DS.LIVRE_TEXT.b), 'Neue Vorschläge'] : [...GRUPPEN, 'Neue Vorschläge']).filter(x => zahl[x]).map(x => `<button data-gruppe="${esc(x)}" class="${g === x ? 'an' : ''}">${esc(x)}<i>${zahl[x]}</i></button>`).join('');
    $$('#fotoLage button').forEach(b => b.classList.toggle('an', b.dataset.lage === (ST.fotoLage || 'alle')));
    const l = fotoListe();
    $('#fotoInfo').textContent = fotoHinweis(l.length);
    $('#fotos').innerHTML = l.length ? l.map((b, i) => `<div class="foto" role="button" tabindex="0" data-bild="${b.key}" title="${esc(b.alt)}" style="--i:${Math.min(i, 16)}"><img loading="lazy" src="${DS.bildUrl(ST.M, b.key, true)}" alt="${esc(b.alt)}"><span>${esc(b.alt)}</span>${b.ki ? '<b class="foto__ki" title="Mit KI erzeugt">KI</b>' : ''}${b.eigen ? `<button class="foto__weg" data-weg="${b.key}" aria-label="Foto entfernen"><svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg></button>` : ''}</div>`).join('')
      : `<p class="fotos__leer">${g === DS.eigene.GRUPPE ? 'Noch keine eigenen Fotos. Oben hochladen oder auf das Blatt ziehen.' : 'Kein Foto passt zu dieser Suche.'}</p>`;
  }
  async function hochladen(dateien, aufsBlatt) {
    if (!dateien || !dateien.length) return;
    try {
      const keys = await DS.eigene.hinzu(ST.M, dateien, t => melde(t, 30000));
      if (!keys.length) { melde('Keine Bilddatei gefunden. Bitte JPG, PNG oder HEIC wählen.'); return; }
      melde((keys.length === 1 ? 'Foto hinzugefügt. Es liegt unter «Eigene Fotos».' : `${keys.length} Fotos hinzugefügt. Sie liegen unter «Eigene Fotos».`) + (keys.fluechtig ? ' Dieser Browser legt Fotos nicht ab (privates Fenster?): es bleibt nur, bis du die Plakatwerkstatt schliesst. Für immer: als Arbeitsdatei sichern.' : ''), keys.fluechtig ? 10000 : 4000);
      ST.fotoGruppe = DS.eigene.GRUPPE; ST.fotoLage = 'alle'; $('#fotoSuche').value = '';
      if (aufsBlatt) {
        const el = ST.sel && elById(ST.sel);
        if (el && el.typ === 'bild') aendern(() => { el.bild = keys[0]; el.fx = .5; el.fy = .5; setzeSlot(seite(), el.slot, keys[0]); }, false);
        else neuesElement('bild', keys[0]);
      }
      zeigeTab('fotos');
    } catch (x) { console.warn(x); melde('Hochladen hat nicht geklappt: ' + ((x && x.message) || 'Grund unbekannt.'), 7000); }
  }
  function markiereFoto() {
    const el = ST.sel && elById(ST.sel);
    $$('.foto').forEach(f => f.classList.toggle('an', !!el && el.typ === 'bild' && el.bild === f.dataset.bild));
    if ($('.tab[data-tab="fotos"]').classList.contains('an')) $('#fotoInfo').textContent = fotoHinweis(fotoListe().length);
  }
  function zeichneAblage() {
    const d = Object.values(alleDocs()).sort((a, b) => b.geaendert - a.geaendert), box = $('#ablage');
    box.innerHTML = '';
    for (const doc of d) {
      const r = document.createElement('div'); r.className = 'ab' + (ST.doc && doc.id === ST.doc.id ? ' an' : ''); r.style.animationDelay = Math.min(box.children.length, 12) * 50 + 'ms';
      r.innerHTML = `<div class="ab__bild" data-oeffne="${doc.id}"></div><div><b data-oeffne="${doc.id}">${esc(doc.name)}</b><small>${esc(DS.FORMATE[doc.formatKey]?.name || '')} · ${doc.seiten.length} ${doc.seiten.length === 1 ? 'Seite' : 'Seiten'} · ${new Date(doc.geaendert).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
        <div class="ab__knoepfe"><button data-kopie="${doc.id}">Kopie</button><button data-loesch="${doc.id}">Löschen</button></div></div>`;
      try { r.firstChild.appendChild(miniBox(doc, 0, 70)); } catch (e) { }
      box.appendChild(r);
    }
  }
  function linksEreignisse() {
    $('.reiter').addEventListener('click', e => { const b = e.target.closest('button'); if (b) zeigeTab(b.dataset.tab); });
    $('#vorlageFormat').addEventListener('change', zeichneVorlagen); $('#vorlageTon').addEventListener('change', zeichneVorlagen);
    $('#vorlagen').addEventListener('click', e => {
      const b = e.target.closest('[data-vorlage]'); if (!b) return;
      const k = b.dataset.vorlage, fk = $('#vorlageFormat').value, ton = $('#vorlageTon').value;
      oeffne(DS.dokument(ST.M, { name: DS.VORLAGEN[k].name, format: fk, seiten: [{ vorlage: k, ton, inhalt: DS.BEISPIEL[k] }] }));
      melde('Vorlage geöffnet. Texte direkt auf dem Blatt überschreiben.');
    });
    let sT; $('#fotoSuche').addEventListener('input', () => { clearTimeout(sT); sT = setTimeout(() => { zeichneFotos(); markiereFoto(); }, 150); });
    $('#fotoFilter').addEventListener('click', e => { const b = e.target.closest('[data-gruppe]'); if (!b) return; ST.fotoGruppe = b.dataset.gruppe; zeichneFotos(); markiereFoto(); b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); });
    $('#fotoLage').addEventListener('click', e => { const b = e.target.closest('[data-lage]'); if (!b) return; ST.fotoLage = b.dataset.lage; zeichneFotos(); markiereFoto(); });
    $('#fotoDatei').addEventListener('change', e => { hochladen(e.target.files, false); e.target.value = ''; });
    const zone = $('#hochladen');
    ['dragenter', 'dragover'].forEach(t => zone.addEventListener(t, e => { e.preventDefault(); zone.classList.add('ueber'); }));
    ['dragleave', 'drop'].forEach(t => zone.addEventListener(t, e => { e.preventDefault(); zone.classList.remove('ueber'); }));
    zone.addEventListener('drop', e => hochladen(e.dataTransfer.files, false));
    const fl = $('#flaeche');
    fl.addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); fl.classList.add('ablegen'); } });
    fl.addEventListener('dragleave', e => { if (!fl.contains(e.relatedTarget)) fl.classList.remove('ablegen'); });
    fl.addEventListener('drop', e => { e.preventDefault(); fl.classList.remove('ablegen'); hochladen(e.dataTransfer.files, true); });
    $('#fotos').addEventListener('keydown', e => { if (e.key === 'Enter') { const b = e.target.closest('[data-bild]'); if (b) b.click(); } });
    $('#fotos').addEventListener('click', e => {
      const w = e.target.closest('[data-weg]');
      if (w) {
        e.stopPropagation();
        const k = w.dataset.weg, benutzt = Object.values(alleDocs()).some(d => d.seiten.some(s => s.el.some(x => x.bild === k)));
        dialog(`<h2>Foto entfernen?</h2><p>«${esc(ST.M.bildIndex[k].alt)}» wird aus deinen eigenen Fotos gelöscht.${benutzt ? ' Es steckt in mindestens einer Drucksache, dort bleibt dann eine leere Fläche.' : ''}</p>`, [{ t: 'Behalten', v: false }, { t: 'Entfernen', v: true, haupt: true }])
          .then(async ja => { if (!ja) return; await DS.eigene.loeschen(ST.M, k); zeichneFotos(); zeichne(); });
        return;
      }
      const b = e.target.closest('[data-bild]'); if (!b) return;
      const el = ST.sel && elById(ST.sel), key = b.dataset.bild;
      if (el && el.typ === 'bild') aendern(() => { el.bild = key; el.fx = .5; el.fy = .5; setzeSlot(seite(), el.slot, key); }, false);
      else neuesElement('bild', key);
      markiereFoto();
    });
    $('#ablage').addEventListener('click', e => {
      const t = e.target.closest('[data-oeffne],[data-kopie],[data-loesch]'); if (!t) return;
      const d = alleDocs();
      if (t.dataset.oeffne) oeffne(d[t.dataset.oeffne]);
      else if (t.dataset.kopie) { const k = JSON.parse(JSON.stringify(d[t.dataset.kopie])); k.id = 'd' + Date.now().toString(36); k.name += ' (Kopie)'; oeffne(k); }
      else if (t.dataset.loesch) {
        dialog(`<h2>Löschen?</h2><p>«${esc(d[t.dataset.loesch].name)}» wird aus der Ablage dieses Browsers entfernt.</p>`, [{ t: 'Behalten', v: false }, { t: 'Löschen', v: true, haupt: true }]).then(ja => {
          if (!ja) return;
          const id = t.dataset.loesch; delete d[id]; schreib(LS.docs, d);
          if (ST.doc.id === id) { const rest = Object.values(d).sort((a, b) => b.geaendert - a.geaendert); if (rest[0]) oeffne(rest[0]); else oeffne(leer()); }
          zeichneAblage();
        });
      }
    });
    $('#btnNeuLeer').addEventListener('click', () => window.DSStart ? DSStart.zeige() : oeffne(leer()));
    $('#dateiLaden').addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      try { const doc = JSON.parse(await f.text());
        if (doc && !doc.seiten && typeof doc === 'object' && Object.values(doc).length && Object.values(doc).every(x => x && Array.isArray(x.seiten) && x.format)) {   // Sicherung aller Drucksachen (pruefung.html)
          const d = alleDocs(); let n = 0; for (const x of Object.values(doc)) { if (!d[x.id] || (d[x.id].geaendert || 0) < (x.geaendert || 0)) { d[x.id] = x; n++; } }
          if (!schreib(LS.docs, d)) throw 0; zeichneAblage(); melde(n ? `${n} Drucksachen aus der Sicherung eingelesen. Sie stehen in Meine Medien.` : 'Alle Drucksachen der Sicherung sind schon da.', 6000); e.target.value = ''; return; }
        if (!Array.isArray(doc.seiten) || !doc.format || !doc.seiten.every(s => s && Array.isArray(s.el))) throw 0; if (doc.eigeneFotos) { await DS.eigene.einlesen(ST.M, doc.eigeneFotos); delete doc.eigeneFotos; } doc.id = 'd' + Date.now().toString(36); oeffne(doc); melde('Arbeitsdatei geöffnet.'); }
      catch (x) { melde('Diese Datei ist keine Arbeitsdatei des Studios.'); }
      e.target.value = '';
    });
  }
  /* Entwurf mit KI anpassen (06.11.2026): das Bild geht mit dem Wunsch an den Server (api/anpassen.py, Konto des Hauses, sonst Probe),
     das Ergebnis kommt als neues eigenes Foto zurück und ersetzt das Bild im Blatt; das Original bleibt, «Zurück» holt es wieder */
  async function kiAnpassen(el, knopf) {
    const wunsch = (($('#kiWunsch') || {}).value || '').trim();
    if (wunsch.length < 3) { melde('Bitte in ein paar Worten sagen, was anders werden soll.'); return; }
    const b = ST.M.bildIndex[el.bild]; if (!b) { melde('Zu diesem Teil gibt es kein Bild.'); return; }
    knopf.disabled = true; knopf.textContent = 'Wird angepasst …';
    try {
      const quelle = b.url || ('/culinarium-demo/assets/bild/' + el.bild + '-1600.webp');
      const blob = await (await fetch(quelle)).blob(), bmp = await createImageBitmap(blob), k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k); cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      const r = await fetch('api/anpassen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bild: cv.toDataURL('image/jpeg', .9), wunsch }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(String(d.fehler || 'Fehler ' + r.status).replace(/^[A-ZÄÖÜ-]+ · /, ''));
      if (d.demo && !d.bild) { melde('Vorführung: Hier bleibt das Bild, wie es ist. Im Werkzeug des Hauses passt die KI es nach eurem Wunsch an, das Original bleibt erhalten.', 9000); knopf.disabled = false; knopf.textContent = 'Anpassen'; return; }
      const neu = await (await fetch(d.bild)).blob();
      const keys = await DS.eigene.hinzu(ST.M, [new File([neu], (b.alt || 'Entwurf') + ' · angepasst.jpg', { type: 'image/jpeg' })], t => melde(t, 20000));
      if (keys.length) aendern(() => { el.bild = keys[0]; }, false);
      melde((d.probe ? d.hinweis : 'Angepasst.') + ' Das Original liegt unter «Eigene Fotos».', 9000);
    } catch (x) { melde('Anpassen hat nicht geklappt: ' + ((x && x.message) || 'Grund unbekannt.'), 9000); }
    knopf.disabled = false; knopf.textContent = 'Anpassen';
  }
  /* Eigener Entwurf als ganzes Blatt (06.11.2026): Format nach dem Seitenverhältnis der Datei, das Bild füllt die Seite, darauf wird weitergearbeitet */
  async function entwurfAusDatei(datei) {
    try {
      melde('Der Entwurf wird eingelesen …', 20000);
      const keys = await DS.eigene.hinzu(ST.M, [datei], t => melde(t, 30000));
      if (!keys.length) { melde('Das ist keine Bilddatei. Bitte den Entwurf als JPG oder PNG speichern (aus Canva: «Herunterladen» → PNG).', 9000); return; }
      const b = ST.M.bildIndex[keys[0]], r = b.w / b.h;
      const fk = Object.keys(DS.FORMATE).filter(k => !['mail', 'mailkopf', 'schild'].includes(k)).sort((x, y) => Math.abs(DS.FORMATE[x].b / DS.FORMATE[x].h - r) - Math.abs(DS.FORMATE[y].b / DS.FORMATE[y].h - r))[0];
      const f = DS.FORMATE[fk], d = leer(fk);
      d.name = 'Eigener Entwurf · ' + String(datei.name || 'Datei').replace(/\.[a-z0-9]+$/i, '').slice(0, 60);
      d.seiten[0].el.push({ typ: 'bild', bild: keys[0], x: 0, y: 0, w: f.b, h: f.h, fx: .5, fy: .5, zoom: 1, id: DS.neueId() });
      oeffne(d);
      melde(`Entwurf als ${f.name} geöffnet. Darauf kannst du Texte, Zeichen und Fotos setzen; das Bild selbst lässt sich verschieben und zuschneiden.`, 8000);
      return d;
    } catch (x) { console.warn(x); melde('Der Entwurf liess sich nicht einlesen: ' + ((x && x.message) || 'Grund unbekannt.'), 8000); }
  }
  function leer(fk = 'a5h', platzhalter = false) {
    const f = DS.FORMATE[fk];
    const d = { id: 'd' + Date.now().toString(36), name: 'Leeres Blatt · ' + f.name, formatKey: fk, format: { b: f.b, h: f.h }, seiten: [{ grund: 'papier', tapete: null, el: [] }], hinweise: [], geaendert: Date.now() };
    if (platzhalter) d.platzhalter = true;
    return d;
  }

  /* ---------- Entwerfen über die KI ---------- */
  const IDEEN = [
    'Plakat für den nächsten Abend, vorne die Illustration, hinten die Daten',
    'Menükarte am Tisch: Gang, Teller und Drink, schmal',
    'Plakat A3 für die Wand neben der Bar',
    'Instagram-Beitrag: der Abend ist ausgebucht',
    'Platzkarten mit Namen für die Tafel',
    'Story: was Fett, Milch und Enzyme mit einem Drink machen',
    'Aushang: die lange Tafel ist heute reserviert, A4',
    'Flyer für das Pop-up Dirty Chicken',
  ];
  async function entwerfen(o = {}) {
    if (o instanceof Event) o = {};
    const auftrag = (o.auftrag || $('#auftrag').value).trim();
    entwerfen.fehler = '';
    if (auftrag.length < 4) { $('#auftrag').focus(); melde('Bitte kurz beschreiben, was entstehen soll.'); return false; }
    const st = $('#entwurfStatus'), btn = $('#btnEntwerfen');
    st.hidden = true;
    $('#entwurfHinweise').hidden = true; btn.disabled = true;
    const lader = $('#lader'), fl = $('#flaeche').getBoundingClientRect();
    Object.assign(lader.style, { left: fl.left + 'px', top: fl.top + 'px', width: fl.width + 'px', height: fl.height + 'px' });
    const ZEILEN = ['Den Auftrag lesen', 'Format und Aufbau wählen', 'Fotos des Hauses aussuchen', 'Texte im Ton des Hauses schreiben', 'Fakten mit den Unterlagen abgleichen', 'Nach den Regeln des Hauses setzen'];
    $('#laderText').textContent = o.varianten ? 'Fünf Entwürfe entstehen' : 'Das Studio entwirft';
    if (o.varianten) ZEILEN.splice(1, 0, 'Fünf verschiedene Gestaltungen anlegen');
    let zi = 0; $('#laderZeile').textContent = ZEILEN[0]; lader.hidden = false;
    const zuhr = setInterval(() => { const z = $('#laderZeile'); z.style.opacity = 0; setTimeout(() => { zi = (zi + 1) % ZEILEN.length; z.textContent = ZEILEN[zi]; z.style.opacity = 1; }, 450); }, 3000);
    const basis = !o.auftrag && $('#auftragBasis').checked && ST.doc && !ST.doc.platzhalter ? { name: ST.doc.name, format: ST.doc.formatKey, seiten: ST.doc.seiten.map(s => s.quelle || { vorlage: 'frei', inhalt: ausSeiteInhalt(s) }) } : null;
    /* Stilschranke (Robert 29.10.2026, Punkt 9): ein Entwurf, der die Stilprüfung des Hauses nicht besteht, wird nicht gezeigt, sondern neu angefordert
       (höchstens zwei weitere Runden). Besteht danach keiner, zeigt das Studio die nächstgelegenen mit den offenen Stilpunkten als Hinweis. */
    const stilFehler = d => (DS.stilPruefe ? DS.stilPruefe(ST.M, d) : []);
    const holen = async () => { const r = await fetch('api/entwurf', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ haus: HAUS, auftrag, format: o.format || $('#auftragFormat').value || null, basis, varianten: o.varianten ? 5 : undefined }) });
      const j = await r.json().catch(() => ({ fehler: 'Antwort nicht lesbar (' + r.status + ')' })); if (!r.ok || j.fehler) throw new Error(j.fehler || ('Fehler ' + r.status)); return j; };
    try {
      let j = await holen();
      if (o.varianten) {
        let gut = [], rest = [], hinweise = [];
        for (let runde = 0; runde < 3 && gut.length < 5; runde++) {
          if (runde) { $('#laderZeile').textContent = 'Nicht im Stil des Hauses, neu setzen'; j = await holen(); }
          const E = j.entwuerfe || {}; hinweise = E.hinweise || hinweise;
          (E.varianten || []).forEach(v => {
            const seiten = (v.seiten || []).filter(x => DS.VORLAGEN[x.vorlage]);
            seiten.forEach(x => { if (x.inhalt?.bild && !ST.M.bildIndex[x.inhalt.bild]) x.inhalt.bild = DS.ersatzFoto(ST.M); });
            if (!seiten.length) return;
            const d = DS.dokument(ST.M, { name: E.name || 'Entwurf', format: o.format || E.format, seiten, hinweise: E.hinweise || [], auftrag: o.anzeige || auftrag });
            d.variante = v.titel || ''; const f = stilFehler(d);
            if (!f.length) { if (gut.length < 5) gut.push(d); } else { d.stilFehler = f; rest.push(d); }
          });
        }
        let docs = gut;
        if (!docs.length) { docs = rest.sort((a, b) => a.stilFehler.length - b.stilFehler.length).slice(0, 5); docs.forEach(d => { d.hinweise = [...(d.hinweise || []), ...d.stilFehler.slice(0, 4).map(x => x.text)]; }); }
        if (!docs.length) throw new Error('Die Entwürfe kamen ohne gültigen Aufbau zurück.');
        return { docs, hinweise };
      }
      for (let runde = 1; runde < 3; runde++) {   // einzelner Entwurf: neu anfordern, solange er die Stilprüfung nicht besteht
        const e0 = j.entwurf; if (!e0) break; const s0 = (e0.seiten || []).filter(x => DS.VORLAGEN[x.vorlage]); if (!s0.length) break;
        if (!stilFehler(DS.dokument(ST.M, { ...e0, seiten: JSON.parse(JSON.stringify(s0)) })).length) break;
        $('#laderZeile').textContent = 'Nicht im Stil des Hauses, neu setzen'; j = await holen();
      }
      const e = j.entwurf;
      e.auftrag = o.anzeige || auftrag;
      if (o.auftrag) $('#auftrag').value = o.anzeige || auftrag;
      e.seiten = (e.seiten || []).filter(s => DS.VORLAGEN[s.vorlage]);
      if (!e.seiten.length) throw new Error('Der Entwurf kam ohne gültigen Aufbau zurück.');
      e.seiten.forEach(s => { if (s.inhalt?.bild && !ST.M.bildIndex[s.inhalt.bild]) s.inhalt.bild = DS.ersatzFoto(ST.M); });
      const doc = DS.dokument(ST.M, e);
      oeffne(doc);
      st.hidden = true;
      const h = $('#entwurfHinweise');
      if (doc.hinweise.length) { h.hidden = false; h.innerHTML = `<b>Bitte noch ansehen</b><ul>${doc.hinweise.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`; zeigeTab('entwerfen'); }
      return true;
    } catch (x) {
      entwerfen.fehler = x.message;
      st.className = 'status fehler';
      st.innerHTML = `Der Entwurf hat nicht geklappt: ${esc(x.message)}<br>Unter «Vorlagen» geht es jederzeit ohne KI weiter.`;
      st.hidden = false;
      return false;
    } finally { btn.disabled = false; clearInterval(zuhr); $('#lader').hidden = true; }
  }

  function zeichneDna() {
    const M = ST.M;
    $('#dna').innerHTML = `<div class="dna__zeichen">${DS.zeichenSvg(M, 'currentColor')}</div>
      <div class="dna__farben">${Object.entries(M.farben).map(([k, v]) => `<div><span style="background:${v}"></span>${esc(M.farbnamen[k])}<br>${v}</div>`).join('')}</div>
      ${Object.entries(M.schriften).map(([k, s]) => `<div class="dna__schrift" style="font-family:'DS-${k}';font-size:${k === 'titel' ? 22 : k === 'mono' ? 12 : 15}px;${k === 'mono' || k === 'kapitale' ? 'text-transform:uppercase;letter-spacing:.16em' : ''}">${esc(M.name)}<small style="font-family:'DS-text';text-transform:none;letter-spacing:0">${esc(s.familie)} · ${esc(s.wofuer)}</small></div>`).join('')}
      <ul>${M.regeln.map(r => DS.regelSichtbar(r)).filter(Boolean).map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      <p class="klein">${M.bilder.length} Fotos des Hauses mit Beschreibung, dazu der Wortlaut der Website und der Unterlagen (Karten, Treatment-Menü, Veranstaltungen).</p>`;
  }

  /* ---------- Speichern als Datei ---------- */
  function laden(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  const dateiname = () => (ST.doc.name || 'drucksache').toLowerCase().replace(/[äöü]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue' }[c])).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + ST.doc.formatKey;
  async function pruefDialog(fuer) {
    const p = DS.pruefe(ST.M, ST.doc);
    if (!p.length) { if (!fuer) melde('Alles druckbereit: keine offenen Punkte.'); return true; }
    const rot = p.some(x => x.stufe === 'rot');
    const a = await dialog(`<h2>${rot ? 'Vor dem Druck noch ansehen' : 'Hinweise zum Druck'}</h2><p class="leise">Ein Klick auf einen Punkt zeigt die Stelle.</p><ul>${p.map(x => `<li class="${x.stufe}" data-id="${x.id}" data-seite="${x.seite}">${esc(x.text)}</li>`).join('')}</ul>`,
      fuer ? [{ t: 'Zurück zum Blatt', v: false }, { t: 'Trotzdem speichern', v: true, haupt: true }] : [{ t: 'Schliessen', v: false }]);
    if (a && a.springe) { ST.seite = a.seite; ST.sel = a.springe; zeichne(); return false; }
    return a;
  }
  async function ausgabe(art) {
    $('#menueSpeichern').hidden = true;
    if (art === 'zip') { if (window.DSIg) DSIg.zip().catch(x => melde('Speichern fehlgeschlagen: ' + x.message, 8000)); return; }
    if (art === 'json') { const ef = await DS.eigene.mitnehmen(ST.M, ST.doc); laden(new Blob([JSON.stringify(Object.keys(ef).length ? Object.assign({}, ST.doc, { eigeneFotos: ef }) : ST.doc)], { type: 'application/json' }), dateiname() + '.json'); return; }
    if (ST.modus === 'text') textEnde();
    if (art !== 'png' && !(await pruefDialog(true))) return;
    const btn = $('#btnSpeichern'); btn.disabled = true;
    try {
      if (art === 'png') {
        const f = DS.FORMATE[ST.doc.formatKey], px = f.px ? f.px[0] : Math.round(ST.doc.format.b / 25.4 * 200);
        melde('Bild wird gerechnet …', 20000);
        laden(await DS.png(ST.M, ST.doc, ST.seite, px), dateiname() + (ST.doc.seiten.length > 1 ? '-s' + (ST.seite + 1) : '') + '.png');
        melde('Bild gespeichert.');
      } else {
        melde('PDF wird gesetzt …', 60000);
        const { bytes, fehlend } = await DS.pdf(ST.M, ST.doc, { marken: art === 'marken', melde: t => melde(t, 60000) });
        laden(new Blob([bytes], { type: 'application/pdf' }), dateiname() + (art === 'marken' ? '-schnittmarken' : '') + '.pdf');
        melde(fehlend.length ? `PDF gespeichert. Diese Zeichen fehlen in der Hausschrift und wurden weggelassen: ${fehlend.join(' ')}` : `PDF gespeichert: ${ST.doc.seiten.length} ${ST.doc.seiten.length === 1 ? 'Seite' : 'Seiten'}, ${(bytes.length / 1e6).toFixed(1)} MB.`, 6000);
      }
    } catch (x) { console.error(x); melde('Speichern fehlgeschlagen: ' + x.message, 8000); }
    finally { btn.disabled = false; }
  }

  /* ---------- Start ---------- */
  async function start() {
    const M = await DS.ladeMarke(HAUS);
    ST.M = M;
    document.title = `Die Plakatwerkstatt · ${M.name}`;
    $('#kopfName').textContent = M.name;
    $('#kopfZeichen').innerHTML = DS.zeichenSvg(M, 'currentColor');
    $('#inselZeichen').innerHTML = DS.zeichenSvg(M, 'currentColor');
    $('#laderZeichen').innerHTML = `<span class="lader__a">${DS.zeichenSvg(M, 'currentColor')}</span><span class="lader__b">${DS.zeichenSvg(M, 'currentColor')}</span>`;   /* wie beim Buchen auf der Website: das Zeichen füllt sich von unten mit Gold */
    const opt = Object.entries(DS.FORMATE).map(([k, f]) => `<option value="${k}">${f.name.replace(/ /g, '\u00a0')}\u00a0· ${f.art}</option>`).join('');
    $('#auftragFormat').innerHTML = '<option value="">Das Studio wählt passend</option>' + opt;
    $('#vorlageFormat').innerHTML = Object.entries(DS.FORMATE).filter(([k]) => Object.keys(DS.VORLAGEN).some(v => DS.formatPasst(v, k))).map(([k, f]) => `<option value="${k}">${f.name.replace(/ /g, '\u00a0')}\u00a0· ${f.art}</option>`).join(''); $('#vorlageFormat').value = 'a5h';
    $('#ideen').innerHTML = IDEEN.map(t => `<button>${esc(t)}</button>`).join('');
    $('#ideen').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { $('#auftrag').value = b.textContent; $('#auftrag').focus(); } });
    zeichneDna();
    await DS.eigene.laden(M);
    const docs = alleDocs();
    const akt = docs[lies(LS.aktuell, '')] || Object.values(docs).sort((a, b) => b.geaendert - a.geaendert)[0] || leer('a5h', true);
    rechtsEreignisse(); blattEreignisse(); linksEreignisse(); tasten();
    const fuenf = async () => {   /* Robert 11.10.2026: «immer fünf Vorschläge, ich wähle einen» */
      const text = $('#auftrag').value.trim();
      const r = await entwerfen({ varianten: true });
      if (r && r.docs && window.DSStart) DSStart.auswahl(r, text, fuenf);
    };
    $('#btnEntwerfen').addEventListener('click', fuenf);
    $('#auftrag').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) fuenf(); });
    $('#btnZurueck').addEventListener('click', zurueck); $('#btnVor').addEventListener('click', vor);
    { /* Fundliste 18: Name der Drucksache ganz lesbar, zur Not zweizeilig in kleinerer Schrift (Feld wird zur Textfläche ohne Zeilenumbruch per Enter) */
      const ni = $('#docName'); if (ni && ni.tagName === 'INPUT') { const t = document.createElement('textarea'); t.className = ni.className; t.id = 'docName'; t.rows = 1; t.spellcheck = false; t.setAttribute('aria-label', ni.getAttribute('aria-label') || 'Name'); t.value = ni.value; ni.replaceWith(t);
        t.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); t.blur(); } }); t.addEventListener('input', () => nameEinpassen()); let bw = 0; new ResizeObserver(() => { if (Math.abs(t.clientWidth - bw) > 1) { bw = t.clientWidth; requestAnimationFrame(nameEinpassen); } }).observe(t); } }
    $('#docName').addEventListener('change', e => { ST.doc.name = e.target.value.replace(/\s+/g, ' ').trim() || 'Drucksache'; speichern(); zeichneAblage(); });
    $('#kopfMarke').addEventListener('click', () => $('#btnNeu').click());
    $('#btnVerwerfen').addEventListener('click', verwerfen);
    $('#btnSpeichern').addEventListener('click', e => { e.stopPropagation(); $('#menueSpeichern').hidden = !$('#menueSpeichern').hidden; });
    ['pointerenter', 'focus', 'touchstart'].forEach(t => $('#btnSpeichern').addEventListener(t, () => DS.vorladenPdf && DS.vorladenPdf(ST.M), { once: true, passive: true }));   // PDF-Werkzeug und Druckschriften erst jetzt holen (29.10.)
    $('#menueSpeichern').addEventListener('click', e => { const b = e.target.closest('[data-aus]'); if (b) ausgabe(b.dataset.aus); });
    document.addEventListener('click', e => { if (!e.target.closest('.ausgabe')) $('#menueSpeichern').hidden = true; });
    document.addEventListener('pointerdown', e => { if (ST.modus === 'text' && !e.target.closest('#wirt')) textEnde(); }, true);
    $('#btnPruefen').addEventListener('click', () => pruefDialog(false));
    $('#werkzeug').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.neu) { if (b.dataset.neu === 'bild') { zeigeTab('fotos'); ST.sel = null; zeichne(); melde('Ein Foto anklicken oder ein eigenes hochladen, es kommt aufs Blatt.'); } else neuesElement(b.dataset.neu); }
      if (b.dataset.seite !== undefined) {
        if (ST.modus === 'text') textEnde();
        if (b.dataset.seite === 'neu' && sozial()) { DSIg.bildAnfuegen(); return; }
        if (b.dataset.seite === 'neu') { aendern(() => ST.doc.seiten.push(DS.setze(ST.M, ST.doc.formatKey, 'rueckseite', seite().quelle?.ton || 'dunkel', DS.BEISPIEL.rueckseite)), false); ST.seite = ST.doc.seiten.length - 1; }
        else ST.seite = +b.dataset.seite;
        ST.sel = null; ST.seitePanel = true; ST.auftritt = true; zeichne();
      }
    });
    $('#flaeche').addEventListener('pointerdown', e => { if (e.target.id === 'flaeche' && ST.sel && ST.modus !== 'text') { ST.sel = null; ST.modus = null; zeichne(); } });
    $('#zeigeHilfen').addEventListener('change', () => $('#wirt').classList.toggle('ohneHilfen', !$('#zeigeHilfen').checked));
    $('#zoomEin').addEventListener('click', () => { ST.zoom = Math.min(4, ST.zoom * 1.25); passeZoom(); zeichne(); });
    $('#zoomAus').addEventListener('click', () => { ST.zoom = Math.max(.3, ST.zoom / 1.25); passeZoom(); zeichne(); });
    /* Klick neben das Blatt schliesst das Seitenmenü «Gestalten» (16.10.2026) */
    $('#flaeche').addEventListener('pointerdown', e => { const w = $('#wirt').getBoundingClientRect(), imBlatt = !!e.__wirt || (e.clientX >= w.left && e.clientX <= w.right && e.clientY >= w.top && e.clientY <= w.bottom);   // Ziel zuerst: öffnet derselbe Klick «Gestalten», rückt das Blatt weg (Prüfung 16.10.2026)
      if (!imBlatt && !e.target.closest('.ue, .griff, .werkzeug') && (ST.sel || ST.seitePanel)) { if (ST.modus === 'text') textEnde(); ST.sel = null; ST.seitePanel = false; ST.modus = null; zeichne(); } });
    let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { passeZoom(); zeichne(); gleiter(); }, 120); });
    let fT; if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(fT); fT = setTimeout(() => {   // rechte Leiste auf/zu: Seite neu einpassen
      if (!ST.doc || ST.modus === 'text') return; const alt = ST.S; passeZoom(); if (Math.abs(ST.S - alt) > .002) zeichne(); }, 60); }).observe($('#flaeche'));
    document.fonts.ready.then(gleiter); setTimeout(gleiter, 400);
    oeffne(akt);
    window.__ST = ST;
    window.DSStudio = { oeffne, entwerfen, leer, entwurfAusDatei, alleDocs, miniBox, zeigeTab, doc: () => ST.doc,
      dialog, melde, haus: HAUS, laden, dateiname, textEnde,
      seiteNr: () => ST.seite, aendern, neues: neuesElement,
      tauscheFoto(key) { const el = ST.sel && elById(ST.sel); if (el && el.typ === 'bild') aendern(() => { el.bild = key; el.fx = .5; el.fy = .5; setzeSlot(seite(), el.slot, key); }, false); }, sel: () => ST.sel && elById(ST.sel), seite: () => seite(), massstab: () => ST.S, waehle(id) { ST.sel = id; zeichne(); }, speichern: () => speichern(),
      zeigeSeite(i) { ST.seite = Math.max(0, Math.min(i, ST.doc.seiten.length - 1)); ST.sel = null; ST.auftritt = true; zeichne(); },
      neuZeichnen: () => zeichne(),
      lader(text, zeilen) {
        const lader = $('#lader'), fl = $('#flaeche').getBoundingClientRect();
        Object.assign(lader.style, { left: fl.left + 'px', top: fl.top + 'px', width: fl.width + 'px', height: fl.height + 'px' });
        $('#laderText').textContent = text; let zi = 0; $('#laderZeile').textContent = zeilen[0]; lader.hidden = false;
        const uhr = setInterval(() => { const z = $('#laderZeile'); z.style.opacity = 0; setTimeout(() => { zi = (zi + 1) % zeilen.length; z.textContent = zeilen[zi]; z.style.opacity = 1; }, 450); }, 3000);
        return () => { clearInterval(uhr); lader.hidden = true; };
      },
      umbenennen(id, name) { const d = alleDocs(); if (!d[id]) return; d[id].name = name; schreib(LS.docs, d); if (ST.doc && ST.doc.id === id) { ST.doc.name = name; $('#docName').value = name; } },
      kopie(id) { const d = alleDocs(); const k = JSON.parse(JSON.stringify(d[id])); k.id = 'd' + Date.now().toString(36); k.name += ' (Kopie)'; k.geaendert = Date.now(); d[k.id] = k; schreib(LS.docs, d); return k; },
      loeschen(id) { const d = alleDocs(); delete d[id]; schreib(LS.docs, d); if (ST.doc && ST.doc.id === id) oeffne(leer('a5h', true)); zeichneAblage(); },
      zeigeHinweise(l) { const h = $('#entwurfHinweise'); if (!l || !l.length) { h.hidden = true; return; } h.hidden = false; h.innerHTML = `<b>Bitte noch ansehen</b><ul>${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`; zeigeTab('entwerfen'); } };
    document.dispatchEvent(new Event('ds:bereit'));
  }
  start().catch(e => { console.error(e); document.body.insertAdjacentHTML('beforeend', `<div class="meldung">Das Studio konnte nicht starten: ${esc(e.message)}</div>`); });
})();
