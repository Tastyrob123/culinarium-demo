/* Plakatwerkstatt · Culinarium Hannover (28.10.2026, Roberts Idee, zuletzt: «ich will pro Anfrage 3 4 oder 5 (je nachdem was ausgewählt war) an neuen»): zwei Ansichten.
   1. «Plakat-Motive» (#msMotive): die Sammlung der Motive im Stil der Plakate (KI-Motive ohne Schrift und die Illustrationen der echten Plakate),
      Filter nach Jahreszeit, Farbe, Stimmung und Herkunft, Vorschau im Plakat-Rahmen; «Übernehmen» öffnet das Plakat vorn und hinten im Editor.
   2. «Abend beschreiben» (#msAbend): Thema, Konzept, Gastkoch, Freitag des Abends → 3 bis 5 Plakate im Rahmen (Server-Weg api/plakat, lokal Probe aus der
      Sammlung, live nur mit Freigabe am Server); eins wählen, dann im Editor wie gewohnt: Motiv verschieben, zoomen, tauschen, Texte als Ebenen,
      Akzentfarbe, Vorder- und Rückseite, Rückgängig, Speichern, PDF A3 und PNG 4:5 / 9:16 über «Druckfertig speichern» und das Format.
   Gesetzt wird mit den Aufbauten «plakat» und «plakatrueck» (vorlagen.js, Quelle _qa/plakat.js.txt). Nur Lesen: Marke (DS.M), motive.json. */
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const ZWEI = n => (n < 10 ? '0' : '') + n;
  const PFEIL = '<svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
  let MOTIVE = [], filter = { jahreszeit: 'alle', farbe: 'alle', stimmung: 'alle' }, letzte = null;

  /* nächste Freitage ab heute: Freitag 19 Uhr, Samstag 17 Uhr wie auf der Website («Freitags ab 19 Uhr, samstags ab 17 Uhr») */
  function freitage(n) {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
    return Array.from({ length: n }, (_, i) => { const f = new Date(d); f.setDate(d.getDate() + 7 * i); return f; });
  }
  const tage = f => { const s = new Date(f); s.setDate(f.getDate() + 1); return `Fr ${f.getDate()}. und Sa ${s.getDate()}. ${MONATE[s.getMonth()]} ${s.getFullYear()}`; };
  const pdat = d => `${ZWEI(d.getDate())} / ${ZWEI(d.getMonth() + 1)} / ${ZWEI(d.getFullYear() % 100)}`;

  /* Plakat als Drucksache: vorn «plakat», hinten «plakatrueck»; Texte sind eigene Ebenen (Titel, Zeile mit Gastkoch, Daten, Uhrzeit, Gänge und Drinks) */
  function plakatDoc(o) {
    const M = DS.M, gast = (o.gast || '').trim().toUpperCase();
    const zeile = gast ? `A UNiQUE EXPERiENCE BY MOMO X RUDI X ${gast}` : (M.zeile || 'A UNiQUE EXPERiENCE BY MOMO X RUDI');
    const f = o.freitag || freitage(1)[0], s = new Date(f); s.setDate(f.getDate() + 1);
    /* Lesbarkeit je Motiv (bau.py prüft die Kopfzone: frei von Gegenständen, Farbe mit 4,5:1 Kontrast). Hinten das eigene Begleitmotiv wie auf den echten
       Rückseiten, randlos, ohne Schleier und ohne Titelzeile; Schrift warmweiss, auf hellem Bild dunkel. Ohne eigenes Begleitmotiv trägt die Rückseite das Motiv. */
    const mo = o.meta || MOTIVE.find(m => m.key === o.motiv) || {};   // neu erzeugte Motive bringen ihre Messung mit (o.meta)
    // Kopfzeile nur, wo keine im Bild steht und die Kopfzone frei ist; hinten das eigene Begleitbild, bei Rudis Illustrationen ein ruhiger Grund in ihrer Farbe
    const kr = mo.kopf_rudi || {};   // Kopfzeile wie Rudi: Farbe und Schatten aus dem Motiv (29.10.)
    const vorn = { bild: o.motiv, ueber: mo.kopf_frei ? 'WALK ON THE WILD SIDE' : '', ueberfarbe: kr.farbe || '', kopfschatten: kr.schatten || '', zeile, akzent: o.akzent || mo.akzent || '#ef7649' };
    const hinten = { bild: mo.rueck || null, grund: mo.rueck_farbe || 'navy', ueber: 'WALK\nON THE\nWILD SIDE', tag1: pdat(f), zeit1: '19:00 UHR', tag2: pdat(s), zeit2: '17:00 UHR',
      text: '3 GÄNGE MENÜ\n5 SiGNATURE DRiNKS', dunkel: !!mo.rueck_dunkel };
    const name = (o.titel ? o.titel + ' · ' : '') + 'Plakat ' + tage(f);
    const F = DS.FORMATE[o.format || 'ig11'] || { b: 1, h: 1 }, rb = mo.rueck && (M.bildIndex || {})[mo.rueck];
    if (rb && !F.digital && rb.w / DS.ausschnitt({ w: F.b + 2 * DS.B, h: F.h + 2 * DS.B, zoom: 1 }, rb.w, rb.h).bw * 25.4 < 150) { hinten.bild = null; hinten.dunkel = false; }   // im grossen Druck zu unscharf: ruhiger Grund in der Farbe des Motivs wie Rudis Rückseiten
    const hoch = F.h / F.b > 1.15 && F.h / F.b < 1.9 && DS.VORLAGEN.plakathoch;   // hohe Formate: Motiv gross und ganz (Abnahme-Tor 29.10.)
    if (hoch) Object.assign(vorn, { tag1: hinten.tag1, zeit1: hinten.zeit1, tag2: hinten.tag2, zeit2: hinten.zeit2, text: hinten.text });
    return DS.dokument(M, { name, format: o.format || 'ig11', seiten: [{ vorlage: hoch ? 'plakathoch' : 'plakat', ton: 'hell', inhalt: vorn }, { vorlage: 'plakatrueck', ton: 'dunkel', inhalt: hinten }] });
  }
  /* Grösse der Vorschläge nach der Spaltenbreite (Robert 29.10.: «ein bisschen größer … der rechts oben so weit weg»): Vorderseite bis 400 px, die Rückseite
     dicht daneben statt am Kartenrand. Plakat-Motive bleiben bei 230 px. */
  function fach(raster, n) {
    const w = raster.clientWidth || 900, breit = matchMedia('(min-width:700px)').matches;
    let sp = !breit ? 1 : n == 4 ? 2 : n == 5 ? 3 : (getComputedStyle(raster).gridTemplateColumns || '').split(' ').filter(Boolean).length || 3;
    const spalte = (w - (sp - 1) * 26) / sp;
    return Math.round(Math.max(230, Math.min(400, spalte / 1.5)));
  }
  const fachStil = g => `--vorn:${g}px;--hinten:${Math.round(g * .72)}px;height:${g + 40}px;max-width:${Math.round(g * 1.5)}px`;
  function karte(doc, titel, unter, knopf, extra, groesse, laden) {   // laden: { laden, prio } für die Bilder (erste Reihe sofort, alles darunter lazy)
    const k = document.createElement('div'); k.className = 'pk-karte';
    const box = groesse || 230, S = window.DSStudio;   // ohne Angabe: passt in die schmalste Spalte (270 px) samt Rückseite dahinter
    const b = document.createElement('div'); b.className = 'pk-blaetter';
    if (groesse) { b.classList.add('pk-blaetter--gross'); b.style.cssText = fachStil(groesse); }
    try { const h = S.miniBox(doc, 1, box * (groesse ? .72 : .62), laden); h.classList.add('pk-hinten'); b.appendChild(h); const v = S.miniBox(doc, 0, box, laden); v.classList.add('pk-vorn'); b.appendChild(v); } catch (e) { console.warn(e); }
    k.appendChild(b);
    k.insertAdjacentHTML('beforeend', `<div class="pk-text"><b>${esc(titel)}</b><small>${esc(unter)}</small>${extra || ''}</div>
      <button class="kn knopf--voll pk-los" type="button"><span>${esc(knopf)}</span><i>${PFEIL}</i></button>`);
    k.querySelector('.pk-los').addEventListener('click', () => { DSStudio.oeffne(doc); if (DSStart.offen()) DSStart.zu(); });
    return k;
  }

  /* ---------- 1 Plakat-Motive ---------- */
  function werte(k) { return [...new Set(MOTIVE.map(m => m.schlagworte[k]))].sort((a, b) => a.localeCompare(b, 'de')); }
  function chips(k, name) {
    return `<div class="ms-chips pk-chips" data-pkf="${k}"><span class="pk-chips__n">${esc(name)}</span><button data-w="alle" class="${filter[k] === 'alle' ? 'an' : ''}">Alle</button>` +
      werte(k).map(w => [w, w]).map(([w, t]) => `<button data-w="${esc(w)}" class="${filter[k] === w ? 'an' : ''}">${esc(t)}</button>`).join('') + '</div>';
  }
  function zeichneMotive() {
    const box = $('#pkMotive'); if (!box) return;
    $('#pkFilter').innerHTML = chips('jahreszeit', 'Jahreszeit') + chips('farbe', 'Farbe') + chips('stimmung', 'Stimmung');
    const l = MOTIVE.filter(m => ['jahreszeit', 'farbe', 'stimmung'].every(k => filter[k] === 'alle' || m.schlagworte[k] === filter[k]));
    box.innerHTML = '';
    $('#pkMotivZahl').textContent = `${l.length} von ${MOTIVE.length} Illustrationen`;
    if (!l.length) { box.innerHTML = '<p class="pk-leer">Kein Motiv passt zu dieser Auswahl. Einen Filter auf «Alle» stellen.</p>'; return; }
    l.forEach(m => {
      const doc = plakatDoc({ motiv: m.key, akzent: m.akzent, schrift: m.schrift, titel: '' });   // Motivname nur an der Karte, nie auf dem Plakat
      const s = m.schlagworte;
      box.appendChild(karte(doc, m.titel, `${s.jahreszeit} · ${s.thema} · ${s.farbe} · ${s.stimmung}`, 'Als Plakat öffnen',
        `<em class="pk-herkunft">${m.schrift ? 'Rudis Illustration, «WALK ON THE WILD SIDE» im Bild' : 'Rudis Illustration'}</em>`));
    });
  }

  /* ---------- 2 Abend beschreiben ---------- */
  const GERAET = () => { try { let g = localStorage.getItem('pk-geraet'); if (!g) { g = Math.random().toString(36).slice(2, 12); localStorage.setItem('pk-geraet', g); } return g; } catch (e) { return 'ohne'; } };
  function bilderEinbinden(l) {   // neue Motive vom Server als Fotos des Hauses bekannt machen (Editor, PDF, Tausch im Fotofach)
    const M = DS.M; M.bildIndex = M.bildIndex || {};
    (l || []).forEach(b => { b.gruppe = 'Neue Vorschläge'; b.bereich = 'motive'; b.ki = true; if (!M.bildIndex[b.key]) { M.bilder.push(b); M.bildIndex[b.key] = b; } });   // eigene Gruppe, zählt nicht als Foto des Hauses (Fundliste 15)
  }
  function formular() {
    const f = $('#pkFreitag'); if (!f || f.options.length) return;
    freitage(16).forEach((d, i) => { const o = document.createElement('option'); o.value = d.toISOString().slice(0, 10); o.textContent = tage(d); if (!i) o.selected = true; f.appendChild(o); });
  }
  async function vorschlagen(ev) {
    if (ev) ev.preventDefault();
    const thema = $('#pkThema').value.trim(), konzept = $('#pkKonzept').value.trim(), gast = $('#pkGast').value.trim();
    const zahl = +(document.querySelector('[data-pkzahl].an') || { dataset: { pkzahl: 4 } }).dataset.pkzahl;
    const fr = new Date($('#pkFreitag').value + 'T12:00:00');
    const box = $('#pkVorschlaege'), knopf = $('#pkLos');
    if ((thema + konzept).length < 3) { $('#pkThema').focus(); box.innerHTML = '<p class="pk-leer">Ein Thema oder ein paar Worte zum Abend, zum Beispiel «Winterabend, Trüffel und Whisky».</p>'; return; }
    knopf.disabled = true; box.innerHTML = '<p class="pk-leer pk-laed">' + esc(window.WO && WO.name ? WO.name('druck') : 'Die Werkstatt') + ' legt Vorschläge an …</p>';
    try {
      const r = await fetch('api/plakat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ thema, konzept, gast, zahl, monat: fr.getMonth() + 1 }) });
      const d = await r.json();
      if (!r.ok) throw new Error(String(d.fehler || r.status).replace(/^[A-ZÄÖÜ-]+ · /, ''));
      letzte = { thema, konzept, gast, fr, v: d.vorschlaege };
      box.innerHTML = `<p class="pk-hinweis${d.live ? ' pk-hinweis--live' : ''}">${esc(d.hinweis || '')}</p>`;
      const auftrag = v => `<details class="pk-auftrag"><summary>Bildauftrag im Hausstil</summary><p>${esc(v.bildauftrag)}</p></details>`;
      box.dataset.n = d.vorschlaege.length;   // Raster nach Anzahl: 4 → 2 × 2, 5 → 3 + 2 mittig (Gestaltung 28.10.)
      const idee = v => v.idee ? `<p class="pk-idee">${esc(v.idee)}</p>` : '';   // das Konzept des Vorschlags in einer Zeile über dem Plakat
      if (!d.live) {   // nie vorhandene Motive als Ersatz (Robert 28.10.); die neuen Konzepte stehen da, das Bild entsteht mit dem Schlüssel
        d.vorschlaege.forEach((v, i) => box.insertAdjacentHTML('beforeend', `<div class="pk-karte pk-nurkonzept">${idee(v)}<div class="pk-text"><b>Vorschlag ${i + 1}</b><small>Das Bild zu diesem Konzept entsteht, sobald der Schlüssel am Server liegt.</small>${auftrag(v)}</div></div>`));
        return;
      }
      /* Live: je Vorschlag eine Karte «entsteht …», die sich füllt, sobald Vorder- und Rückseite da sind (Oberchef 28.10.) */
      const durchgang = Date.now().toString(36);
      const gr = fach(box, d.vorschlaege.length);   // gleiche Grösse für die Karte «entsteht» und das fertige Plakat
      const karten = d.vorschlaege.map((v, i) => {
        const k = document.createElement('div'); k.className = 'pk-karte pk-entsteht';
        k.innerHTML = `${idee(v)}<div class="pk-blaetter pk-blaetter--gross" style="${fachStil(gr)}"><span class="pk-entsteht__blatt pk-entsteht__blatt--h"></span><span class="pk-entsteht__blatt"></span></div><div class="pk-text"><b>Vorschlag ${i + 1}</b><small>entsteht, Vorder- und Rückseite werden gerade gemalt …</small></div>`;
        box.appendChild(k); return k;
      });
      await Promise.all(karten.map(async (k, i) => {
        try {
          const r = await fetch('api/plakat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ thema, konzept, gast, zahl, monat: fr.getMonth() + 1, nr: i, durchgang, geraet: GERAET(), entwurf: d.vorschlaege[i].entwurf }) });
          const e = await r.json();
          if (!r.ok || e.fehler) throw new Error(String(e.fehler || r.status).replace(/^[A-ZÄÖÜ-]+ · /, ''));   // Server antwortet sofort mit 200 und meldet Fehler im Inhalt (29.10.)
          bilderEinbinden(e.bilder); const v = e.vorschlag;
          const neu = karte(plakatDoc({ motiv: v.motiv, meta: v, akzent: v.akzent, titel: v.titel, gast, freitag: fr }), `Vorschlag ${i + 1}`, v.warum, 'Diesen bearbeiten', auftrag(v), gr);
          neu.insertAdjacentHTML('afterbegin', idee(d.vorschlaege[i].idee ? d.vorschlaege[i] : v)); k.replaceWith(neu);
        } catch (err) {   // kein Ersatz aus der Sammlung: die Karte sagt, warum dieser Vorschlag nicht entstanden ist
          k.classList.remove('pk-entsteht'); k.querySelector('.pk-blaetter').innerHTML = '';
          k.querySelector('small').textContent = 'Nicht entstanden: ' + err.message;
        }
      }));
    } catch (e) {
      box.innerHTML = `<p class="pk-leer">Das hat nicht geklappt: ${esc(navigator.onLine === false ? 'Keine Verbindung zum Internet.' : e.message)} Die Eingaben bleiben stehen.</p>`;
    } finally { knopf.disabled = false; }
  }

  /* Alle schon entstandenen Vorschläge direkt unter dem Formular, je Abend mit Konzeptzeile, vorn und hinten (Robert 29.10.2026: «die vorschläge bitte
     direkt im tool alle anzeigen und nicht auf so ner random ass seite») */
  let alleGeladen = false;
  const samstag = w => { const m = /Sa (\d+)\. (\S+) (\d{4})/.exec(w || ''); if (!m) return null; const d = new Date(+m[3], MONATE.indexOf(m[2]), +m[1], 12); d.setDate(d.getDate() - 1); return d; };
  /* Alle Vorschläge (Robert 29.10.: «brauchen ewig zum Laden»): die Liste wird schon beim Start der Werkstatt geholt, gleichzeitig mit dem Formular,
     und gezeichnet, sobald die Ansicht offen ist. Die Karten zeigen 600-px-Vorschauen; die erste Reihe lädt sofort, alles darunter lazy auf der Motivfarbe.
     Das volle Bild holt erst der Editor («Diesen bearbeiten»). */
  let alleDaten = null;
  const holeAlle = () => alleDaten || (alleDaten = fetch('api/plakat', { cache: 'no-cache' }).then(r => r.json()).catch(e => { alleDaten = null; throw e; }));
  async function zeichneAlle() {
    const vor = $('#pkVorschlaege'); if (!vor || alleGeladen) return;
    let box = $('#pkAlle'); if (!box) { box = document.createElement('div'); box.id = 'pkAlle'; vor.after(box); }
    let d; try { d = await holeAlle(); } catch (e) { console.warn(e); return; }
    if (alleGeladen || !vor.offsetParent) return;   // erst zeichnen, wenn die Ansicht offen ist: die Grösse der Karten richtet sich nach der Spalte
    alleGeladen = true;
    try {
      bilderEinbinden(d.bilder);
      box.innerHTML = d.abende.length ? '<h2 class="pk-alle__titel">Alle Vorschläge</h2>' : '';
      d.abende.forEach((a, n) => {
        const fr = samstag(a.wochenende) || freitage(1)[0];
        box.insertAdjacentHTML('beforeend', `<h3 class="pk-abend">${esc(a.thema)}<small>${esc([a.konzept, a.gast].filter(Boolean).join(' · '))}</small></h3>`);
        const r = document.createElement('div'); r.className = 'pk-raster'; r.dataset.n = a.vorschlaege.length; box.appendChild(r);
        const laden = n ? { laden: 'lazy', prio: 'low' } : { laden: 'eager', prio: 'high' };
        a.vorschlaege.forEach((v, i) => {
          const k = karte(plakatDoc({ motiv: v.motiv, meta: v, akzent: v.akzent, titel: v.titel, gast: a.gast, freitag: fr }), `Vorschlag ${i + 1}`, tage(fr), 'Diesen bearbeiten', '', fach(r, a.vorschlaege.length), laden);
          if (v.idee) k.insertAdjacentHTML('afterbegin', `<p class="pk-idee">${esc(v.idee)}</p>`);
          r.appendChild(k);
        });
      });
    } catch (e) { alleGeladen = false; box.innerHTML = ''; console.warn(e); }
  }

  function zeige(a) { if (a === 'motive') zeichneMotive(); if (a === 'abend') { formular(); zeichneAlle(); } }
  async function los() {
    try { MOTIVE = await (await fetch(DS.M.basis + 'motive.json', { cache: 'no-cache' })).json(); } catch (e) { MOTIVE = []; }
    const z = $('#pkZahl'); if (z) z.textContent = MOTIVE.length;
    $('#pkFilter') && $('#pkFilter').addEventListener('click', e => { const b = e.target.closest('[data-w]'); if (!b) return; filter[b.closest('[data-pkf]').dataset.pkf] = b.dataset.w; zeichneMotive(); });
    $('#pkForm') && $('#pkForm').addEventListener('submit', vorschlagen);
    document.querySelectorAll('[data-pkzahl]').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('[data-pkzahl]').forEach(x => x.classList.toggle('an', x === b)); }));
    formular();
    /* Liste erst holen, wenn die Startseite steht (30.10.2026: 24 KB nahmen dem ersten Bildschirm gedrosselt die Leitung); wer die Ansicht vorher öffnet, holt sie dort */
    const st = $('#start'), nachStart = f => { if (!st || st.classList.contains('bereit')) return f(); new MutationObserver((_, mo) => { if (st.classList.contains('bereit')) { mo.disconnect(); f(); } }).observe(st, { attributes: true, attributeFilter: ['class'] }); };
    nachStart(() => { zeichneAlle(); holeAlle().then(d => {   // die erste Reihe schon im Hintergrund holen, während die Startseite offen ist: beim Öffnen der Ansicht liegt sie im Cache
      const a = d.abende[0]; if (!a) return; const keys = new Set(a.vorschlaege.flatMap(v => [v.motiv, v.rueck]));
      (d.bilder || []).filter(b => keys.has(b.key) && b.vorschau).forEach(b => { const i = new Image(); i.fetchPriority = 'high'; i.decoding = 'async'; i.src = DS.M.basis + b.vorschau; });
    }).catch(() => {}); });
  }
  window.DSPlakat = { zeige, plakatDoc, freitage, motive: () => MOTIVE };
  if (window.DS && DS.M && window.DSStudio) los(); else document.addEventListener('ds:bereit', los, { once: true });
})();
