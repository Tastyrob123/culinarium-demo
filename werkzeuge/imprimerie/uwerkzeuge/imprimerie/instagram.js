/* L’Imprimerie · Instagram (Robert 12.10.2026): Bildtext und Karussell.
   Bildtext: die KI schreibt die Zeilen unter einem Beitrag oder einer Story, mit Hashtags, im Ton des Hauses, Fakten nur aus dem Wissen
   (api/entwurf.py, Modus «bildtext»), in sechs Sprachen. Bearbeitbar, mit einem Klick kopiert, gespeichert in doc.bildtext.
   Karussell: mehrere Bilder 1080 × 1350 als ein Beitrag im gleichen Stil (Bild anfügen oder von der KI), in der Handy-Vorschau
   zum Durchwischen, gespeichert als nummerierte PNGs in einer ZIP-Datei (dazu bildtext.txt).
   Die Handy-Vorschau ist ein Raum über dem Studio: links das ganze Handy, rechts die Platte mit dem Bildtext. */
(function () {
  const DS = window.DS;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SPRACHEN = [['de', 'Deutsch'], ['en', 'English'], ['fr', 'Français'], ['zh', '中文'], ['ko', '한국어'], ['ar', 'العربية']];
  const MAX = 10;
  const IC = {
    herz: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1z"/></svg>',
    sprech: '<svg viewBox="0 0 24 24"><path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.6-4.4a8.4 8.4 0 1 1 15.4-4.5z"/></svg>',
    senden: '<svg viewBox="0 0 24 24"><path d="M21 3.5 10.2 13.8M21 3.5l-6.6 17-4.2-6.7L3.5 9.6z"/></svg>',
    merken: '<svg viewBox="0 0 24 24"><path d="M18.5 20.5 12 15.2l-6.5 5.3V4.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1z"/></svg>',
    mehr: '<svg viewBox="0 0 24 24"><circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/></svg>',
    links: '<svg viewBox="0 0 24 24"><path d="m14.5 6-6 6 6 6"/></svg>',
    rechts: '<svg viewBox="0 0 24 24"><path d="m9.5 6 6 6-6 6"/></svg>',
    zu: '<svg viewBox="0 0 24 24"><path d="M9 14.5 4 9.5l5-5M4 9.5h11a5 5 0 0 1 0 10h-3"/></svg>',
    pfeil: '<svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
    kopie: '<svg viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/></svg>',
    feder: '<svg viewBox="0 0 24 24"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>',
    ab: '<svg viewBox="0 0 24 24"><path d="M12 5v12m-5-5 5 5 5-5"/></svg>',
  };
  const S = () => window.DSStudio;
  const istSozial = d => d && (d.formatKey === 'insta' || d.formatKey === 'story');
  const istStory = d => d && d.formatKey === 'story';

  /* ---------- Platte rechts im Studio (nichts angewählt) ---------- */
  function panel(doc) {
    if (!istSozial(doc)) return '';
    const n = doc.seiten.length, bt = doc.bildtext && doc.bildtext.text;
    const satz = istStory(doc) ? 'So sieht die Story auf dem Handy aus, dazu der Text zum Teilen.'
      : n > 1 ? `Karussell aus ${n} Bildern, auf dem Handy zum Durchwischen.` : 'So sieht der Beitrag auf Instagram aus, mit dem Bildtext darunter.';
    let h = `<div class="gruppe ig-gruppe"><label>${istStory(doc) ? 'Story' : 'Instagram'}</label>
      <button class="ig-tuer" data-ig="vorschau"><span class="ig-tuer__handy" aria-hidden="true"><i></i></span><span class="ig-tuer__t"><b>Handy-Vorschau und Bildtext</b><small>${esc(satz)}</small></span><i class="ig-tuer__k">${IC.pfeil}</i></button>
      ${bt ? `<p class="ig-kurz">${esc(bt.split('\n')[0]).slice(0, 140)}</p>` : '<p class="klein">Noch kein Bildtext. In der Handy-Vorschau schreibt das Studio ihn in einer von sechs Sprachen.</p>'}</div>`;
    if (!istStory(doc)) h += `<div class="gruppe"><label>Karussell</label>
      <p class="klein">Bis zu ${MAX} Bilder im gleichen Stil als ein Beitrag. Jedes Bild 1080 auf 1350.</p>
      <div class="knoepfe ig-knoepfe"><button data-ig="anfuegen">Bild im gleichen Stil anfügen</button><button data-ig="ki">Karussell von der KI entwerfen</button></div>
      ${n > 1 ? `<button class="ig-zip" data-ig="zip"><i>${IC.ab}</i><span><b>Alle ${n} Bilder speichern</b><small>Nummerierte PNGs in einer ZIP-Datei, mit Bildtext</small></span></button>` : ''}</div>`;
    return h;
  }

  /* ---------- Bild im gleichen Stil anfügen ---------- */
  function bildAnfuegen() {
    const st = S(), doc = st.doc(), M = DS.M;
    if (doc.seiten.length >= MAX) { st.melde(`Ein Karussell hat höchstens ${MAX} Bilder.`); return; }
    const i = st.seiteNr(), s = doc.seiten[i], q = s.quelle;
    let neu;
    if (q && DS.VORLAGEN[q.vorlage]) {
      const inhalt = JSON.parse(JSON.stringify(q.inhalt || {}));
      if (inhalt.bild) inhalt.bild = naechstesFoto(doc, inhalt.bild);
      neu = DS.setze(M, doc.formatKey, q.vorlage, q.ton, inhalt, q.stil);
      neu.grund = s.grund; neu.tapete = s.tapete;
    } else { neu = JSON.parse(JSON.stringify(s)); neu.el.forEach(x => x.id = DS.neueId()); }
    st.aendern(() => doc.seiten.splice(i + 1, 0, neu), false);
    st.zeigeSeite(i + 1);
    st.melde(`Bild ${i + 2} angelegt, gleicher Aufbau mit anderem Foto. Texte direkt auf dem Blatt ändern.`, 4200);
  }
  function naechstesFoto(doc, key) {
    const M = DS.M, b = M.bildIndex[key], gr = b && b.gruppe;
    const belegt = new Set(); doc.seiten.forEach(s => s.el.forEach(e => e.bild && belegt.add(e.bild)));
    const lage = b ? (b.w >= b.h ? 'quer' : 'hoch') : null;
    const kand = M.bilder.filter(x => x.gruppe === gr && !belegt.has(x.key));
    const gleich = kand.find(x => (x.w >= x.h ? 'quer' : 'hoch') === lage);
    return (gleich || kand[0] || b || M.bilder[0]).key;
  }

  /* ---------- Karussell von der KI ---------- */
  async function karussellKi() {
    const st = S(), doc = st.doc();
    const q = doc.seiten[0].quelle, inh = (q && q.inhalt) || {};
    const thema = doc.auftrag || [inh.ueber, inh.titel, inh.text].filter(Boolean).join(' · ');
    const ja = await st.dialog(`<h2>Karussell entwerfen</h2>
      <p class="leise">Das Studio legt aus diesem Beitrag ein Karussell an: gleicher Grund, gleicher Aufbau, je Bild ein eigenes Foto. Die erste Seite bleibt der Einstieg.</p>
      <label class="ig-feld">Worum geht es?<textarea id="igKiThema" rows="3">${esc(thema)}</textarea></label>
      <label class="ig-feld">Wie viele Bilder?<select id="igKiZahl">${[3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option value="${n}" ${n === 5 ? 'selected' : ''}>${n} Bilder</option>`).join('')}</select></label>`,
      [{ t: 'Abbrechen', v: false }, { t: 'Karussell entwerfen', v: true, haupt: true }]);
    if (!ja) return;
    const n = +($('#igKiZahl') || {}).value || 5, text = (($('#igKiThema') || {}).value || thema).trim();
    const ton = (q && q.ton) || 'dunkel', stil = q && q.stil, vorlage = q && q.vorlage;
    const stopp = st.lader('Das Karussell entsteht', ['Den Beitrag lesen', `${n} Bilder planen`, 'Fotos des Hauses aussuchen', 'Texte im Ton des Hauses schreiben', 'Fakten mit den Unterlagen abgleichen', 'Im gleichen Stil setzen']);
    try {
      const r = await fetch('api/entwurf', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        haus: st.haus, format: 'insta',
        auftrag: `Karussell aus genau ${n} Bildern für Instagram: ${text}. Alle Seiten im Grund «${ton}»${vorlage ? ` und im Aufbau «${vorlage}» oder einem eng verwandten` : ''}; die erste Seite ist der Einstieg.`,
        basis: { name: doc.name, format: doc.formatKey, seiten: doc.seiten.map(s => s.quelle || {}) } }) });
      const j = await r.json().catch(() => ({ fehler: 'Antwort nicht lesbar (' + r.status + ')' }));
      if (!r.ok || j.fehler) throw new Error(j.fehler || ('Fehler ' + r.status));
      const seiten = ((j.entwurf || {}).seiten || []).filter(x => DS.VORLAGEN[x.vorlage]).slice(0, MAX);
      if (seiten.length < 2) throw new Error('Das Karussell kam ohne gültige Bilder zurück.');
      const M = DS.M, gesehen = new Set();
      const neu = seiten.map(x => {
        const inhalt = x.inhalt || {};
        if (inhalt.bild && (!M.bildIndex[inhalt.bild] || gesehen.has(inhalt.bild))) inhalt.bild = naechstesFotoAus(gesehen, inhalt.bild);
        if (inhalt.bild) gesehen.add(inhalt.bild);
        const s = DS.setze(M, 'insta', x.vorlage, ton, inhalt, stil);
        return s;
      });
      st.aendern(() => { doc.seiten = neu; if (j.entwurf.hinweise && j.entwurf.hinweise.length) doc.hinweise = j.entwurf.hinweise; }, false);
      st.zeigeSeite(0);
      st.melde(`Karussell mit ${neu.length} Bildern angelegt.`, 4200);
      if (doc.hinweise && doc.hinweise.length && st.zeigeHinweise) st.zeigeHinweise(doc.hinweise);
    } catch (x) { st.melde('Das Karussell hat nicht geklappt: ' + x.message, 8000); }
    finally { stopp(); }
  }
  function naechstesFotoAus(gesehen, key) {
    const M = DS.M, b = M.bildIndex[key];
    const k = M.bilder.find(x => !gesehen.has(x.key) && (!b || x.gruppe === b.gruppe)) || M.bilder.find(x => !gesehen.has(x.key));
    return k ? k.key : DS.ersatzFoto(DS.M);
  }

  /* ---------- Handy-Vorschau ---------- */
  const CACHE = new Map();
  async function bildUrl(doc, i, px) {
    const k = px + '|' + doc.formatKey + '|' + JSON.stringify(doc.seiten[i]);
    if (CACHE.has(k)) return CACHE.get(k);
    const url = URL.createObjectURL(await DS.png(DS.M, doc, i, px));
    CACHE.set(k, url);
    if (CACHE.size > 40) { const [a, u] = CACHE.entries().next().value; URL.revokeObjectURL(u); CACHE.delete(a); }
    return url;
  }
  let raum = null;
  function vorschau() {
    const st = S(), doc = st.doc();
    if (!istSozial(doc)) return;
    if (st.textEnde) st.textEnde();
    zu(true);
    const bt = doc.bildtext || {}, story = istStory(doc), n = doc.seiten.length, M = DS.M;
    const H = Math.max(520, Math.min(innerHeight - 110, 820)), W = Math.round(H * .485), rand = Math.round(W * .045), sw = W - 2 * rand;
    const f = DS.FORMATE[doc.formatKey], ph = Math.round(sw * f.h / f.b);
    raum = document.createElement('div'); raum.className = 'ig-raum'; raum.setAttribute('role', 'dialog'); raum.setAttribute('aria-label', 'Handy-Vorschau');
    raum.innerHTML = `<div class="ig-raum__in">
      <div class="ig-buehne">
        <span class="handy handy--ganz ig-handy${story ? ' ig-handy--story' : ''}" style="width:${W}px;height:${H}px;--rand:${rand}px;--w:${W}px">
          <i class="handy__taste handy__taste--l1"></i><i class="handy__taste handy__taste--l2"></i><i class="handy__taste handy__taste--r"></i>
          <span class="handy__schirm">
            <span class="handy__status"><b>9:41</b><i class="handy__insel"></i><span class="handy__sym"><i class="balken"></i><i class="welle"></i><i class="akku"></i></span></span>
            ${story ? '' : `<span class="ig-oben"><b>Beiträge</b></span>
            <span class="handy__kopf"><span class="handy__bild">${DS.zeichenSvg(M, 'currentColor')}</span><span class="handy__wer"><b>${esc(M.name)}</b><small>${esc(M.ort)}</small></span><span class="handy__ic">${IC.mehr}</span></span>`}
            <span class="ig-bilder" style="--sw:${sw}px;height:${story ? '100%' : ph + 'px'}">
              <span class="ig-band" id="igBand" tabindex="0" aria-label="Bilder des Beitrags">${doc.seiten.map((_, i) => `<span class="ig-bild" data-i="${i}"><i class="ig-laedt"></i></span>`).join('')}</span>
              ${n > 1 ? `<b class="ig-zaehler" id="igZaehler">1/${n}</b>
              <button class="ig-pfeil ig-pfeil--l" data-ig="zurueck" aria-label="Voriges Bild" hidden>${IC.links}</button><button class="ig-pfeil ig-pfeil--r" data-ig="weiter" aria-label="Nächstes Bild">${IC.rechts}</button>` : ''}
              ${story ? `<span class="ig-story-kopf"><span class="ig-balken">${doc.seiten.map((_, i) => `<i class="${i === 0 ? 'an' : ''}"></i>`).join('')}</span><span class="ig-story-wer"><span class="handy__bild">${DS.zeichenSvg(M, 'currentColor')}</span><b>${esc(M.name)}</b></span></span>` : ''}
            </span>
            ${story ? '' : `<span class="handy__aktionen ig-aktionen"><span>${IC.herz}${IC.sprech}${IC.senden}</span>${n > 1 ? `<span class="ig-punkte" id="igPunkte">${doc.seiten.map((_, i) => `<i class="${i ? '' : 'an'}"></i>`).join('')}</span>` : ''}${IC.merken}</span>
            <span class="ig-text" id="igText"></span>`}
            <i class="handy__strich"></i>
          </span>
        </span>
      </div>
      <div class="ig-platte">
        <button class="rund ig-zu" data-ig="zu" aria-label="Schliessen" data-tip="Schliessen">${IC.zu}</button>
        <h2>${story ? 'Text zur Story' : 'Bildtext'}</h2>
        <p class="leise">${story ? 'Zeilen zum Teilen der Story, mit Hashtags.' : 'Die Zeilen unter dem Beitrag, mit Hashtags.'} Im Ton des Hauses, Angaben nur aus den Unterlagen. Danach frei bearbeiten und mit einem Klick kopieren.</p>
        <div class="ig-zeile"><label>Sprache<select id="igSprache">${SPRACHEN.map(([k, t]) => `<option value="${k}" ${(bt.sprache || 'de') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <button class="kn knopf--voll glanz-kn ig-schreiben" data-ig="schreiben"><span>${bt.text ? 'Neu schreiben' : story ? 'Text schreiben' : 'Bildtext schreiben'}</span><i>${IC.feder}</i></button></div>
        <div class="ig-feldtext"><textarea id="igBildtext" rows="11" placeholder="Hier erscheint der Bildtext. Du kannst ihn auch selbst schreiben." dir="auto">${esc(bt.text || '')}</textarea>
          <span class="ig-schreibt" id="igSchreibt" hidden><span class="ig-schreibt__z">${DS.zeichenSvg(M, 'currentColor')}</span><b>Das Studio schreibt</b><small>im Ton des Hauses</small></span></div>
        <div class="ig-fuss"><span class="ig-zeichen" id="igZeichen"></span><button class="kn kn--klein ig-kopieren" data-ig="kopieren"><span>Kopieren</span><i>${IC.kopie}</i></button></div>
        <div class="hinweise ig-hinweise" id="igHinweise" hidden></div>
        ${!story && n > 1 ? `<button class="ig-zip" data-ig="zip"><i>${IC.ab}</i><span><b>Alle ${n} Bilder speichern</b><small>1080 auf 1350, nummerierte PNGs in einer ZIP-Datei, mit Bildtext</small></span></button>` : ''}
      </div>
    </div>`;
    document.body.appendChild(raum);
    document.body.classList.add('ig-offen');
    requestAnimationFrame(() => raum.classList.add('an'));
    raum.addEventListener('click', klickRaum);
    raum.addEventListener('input', e => { if (e.target.id === 'igBildtext') textGeaendert(e.target.value); });
    raum.addEventListener('change', e => { if (e.target.id === 'igSprache') { const d = S().doc(); d.bildtext = Object.assign({}, d.bildtext, { sprache: e.target.value }); S().speichern(); zeigeText($('#igBildtext').value); } });
    addEventListener('keydown', taste);
    zeigeText(bt.text || ''); zeigeHinweise(bt.hinweise || []);
    const band = $('#igBand');
    band.addEventListener('scroll', () => { cancelAnimationFrame(band._r); band._r = requestAnimationFrame(() => bandStand()); }, { passive: true });
    // Bilder in Reihenfolge rechnen, das erste zuerst
    (async () => {
      for (let i = 0; i < n; i++) {
        if (!raum) return;
        try {
          const url = await bildUrl(doc, i, Math.min(1080, Math.round(sw * 2)));
          const zelle = raum && raum.querySelector(`.ig-bild[data-i="${i}"]`);
          if (zelle) { const img = new Image(); img.alt = `Bild ${i + 1}`; img.decoding = 'async'; img.src = url; await img.decode().catch(() => {}); zelle.innerHTML = ''; zelle.appendChild(img); zelle.classList.add('da'); }
        } catch (x) { console.error(x); }
      }
    })();
  }
  function bandStand() {
    const band = $('#igBand'); if (!band) return;
    const n = band.children.length, i = Math.round(band.scrollLeft / band.clientWidth);
    const z = $('#igZaehler'); if (z) z.textContent = `${i + 1}/${n}`;
    const p = $('#igPunkte'); if (p) [...p.children].forEach((x, k) => x.classList.toggle('an', k === i));
    raum.querySelectorAll('.ig-balken i').forEach((x, k) => x.classList.toggle('an', k <= i));
    const l = raum.querySelector('.ig-pfeil--l'), r = raum.querySelector('.ig-pfeil--r');
    if (l) l.hidden = i === 0; if (r) r.hidden = i >= n - 1;
  }
  function blaettern(d) { const band = $('#igBand'); if (band) band.scrollBy({ left: d * band.clientWidth, behavior: 'smooth' }); }
  function taste(e) {
    if (!raum) return;
    if (e.key === 'Escape' && $('#dialog').hidden) { zu(); return; }
    if (e.target.id === 'igBildtext' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowRight') { blaettern(1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { blaettern(-1); e.preventDefault(); }
  }
  function zu(still) {
    if (!raum) return;
    const r = raum; raum = null;
    removeEventListener('keydown', taste);
    document.body.classList.remove('ig-offen');
    if (still) { r.remove(); return; }
    r.classList.remove('an'); setTimeout(() => r.remove(), 450);
    S().neuZeichnen();
  }
  function klickRaum(e) {
    if (e.target === raum) return zu();
    const b = e.target.closest('[data-ig]'); if (!b) return;
    const a = b.dataset.ig;
    if (a === 'zu') zu();
    else if (a === 'weiter') blaettern(1);
    else if (a === 'zurueck') blaettern(-1);
    else if (a === 'schreiben') schreiben(b);
    else if (a === 'kopieren') kopieren();
    else if (a === 'zip') zip();
  }

  /* ---------- Bildtext ---------- */
  function hashtagHtml(t) {
    return esc(t).replace(/(^|[\s(])(#[\p{L}\p{N}_]+)/gu, '$1<span class="ig-tag">$2</span>').replace(/\n/g, '<br>');
  }
  function zeigeText(t) {
    const el = $('#igText');
    if (el) el.dir = ($('#igSprache') && $('#igSprache').value === 'ar') ? 'rtl' : 'ltr';
    if (el) el.innerHTML = t.trim() ? `<b>${esc(DS.M.name)}</b> ${hashtagHtml(t.trim())}` : `<span class="ig-leer">Hier steht der Bildtext, sobald er geschrieben ist.</span>`;
    const z = $('#igZeichen'); if (z) { const n = [...t].length; z.textContent = n ? `${n.toLocaleString('de-CH')} Zeichen · ${(t.match(/#[\p{L}\p{N}_]+/gu) || []).length} Hashtags` : ''; z.classList.toggle('rot', n > 2200); }
  }
  function zeigeHinweise(h) {
    const el = $('#igHinweise'); if (!el) return;
    el.hidden = !h.length;
    el.innerHTML = h.length ? `<b>Bitte noch ansehen</b><ul>${h.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  }
  let tT;
  function textGeaendert(v) {
    zeigeText(v);
    const d = S().doc(); d.bildtext = Object.assign({ sprache: $('#igSprache').value }, d.bildtext, { text: v, selbst: true });
    clearTimeout(tT); tT = setTimeout(() => S().speichern(), 400);
  }
  function seitenInhalt(doc) {
    return doc.seiten.map(s => {
      if (s.quelle && s.quelle.inhalt) { const i = Object.assign({}, s.quelle.inhalt); return i; }
      return { texte: s.el.filter(e => e.typ === 'text' && e.text).map(e => e.text), bild: (s.el.find(e => e.typ === 'bild') || {}).bild };
    });
  }
  async function schreiben(btn) {
    const st = S(), doc = st.doc(), feld = $('#igBildtext'), alt = feld.value.trim();
    if (alt && doc.bildtext && doc.bildtext.selbst) {
      const ok = await st.dialog('<h2>Bildtext neu schreiben?</h2><p class="leise">Dein bearbeiteter Text wird dabei ersetzt. Kopier ihn vorher, wenn du ihn behalten möchtest.</p>',
        [{ t: 'Behalten', v: false }, { t: 'Neu schreiben', v: true, haupt: true }]);
      if (!ok) return;
    }
    const sprache = $('#igSprache').value;
    btn.disabled = true; $('#igSchreibt').hidden = false; feld.classList.add('wartet');
    try {
      const r = await fetch('api/entwurf', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        haus: st.haus, bildtext: { sprache, art: istStory(doc) ? 'story' : doc.seiten.length > 1 ? 'karussell' : 'beitrag', seiten: seitenInhalt(doc) } }) });
      const j = await r.json().catch(() => ({ fehler: 'Antwort nicht lesbar (' + r.status + ')' }));
      if (!r.ok || j.fehler) throw new Error(j.fehler || ('Fehler ' + r.status));
      const b = j.bildtext, tags = (b.hashtags || []).map(t => '#' + String(t).replace(/^#+/, '').replace(/\s+/g, '')).filter(t => t.length > 1);
      const text = (b.text || '').trim() + (tags.length ? '\n\n' + tags.join(' ') : '');
      if (!raum) return;
      feld.value = text; zeigeText(text); zeigeHinweise(b.hinweise || []);
      doc.bildtext = { sprache: b.sprache || sprache, text, hinweise: b.hinweise || [] };
      st.speichern();
      btn.querySelector('span').textContent = 'Neu schreiben';
      $('#igText') && $('#igText').animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.2,.7,.2,1)' });
    } catch (x) { st.melde('Der Bildtext hat nicht geklappt: ' + x.message, 8000); }
    finally { if (raum) { btn.disabled = false; $('#igSchreibt').hidden = true; feld.classList.remove('wartet'); } }
  }
  async function kopieren() {
    const t = ($('#igBildtext') || {}).value || '';
    if (!t.trim()) { S().melde('Noch kein Bildtext zum Kopieren.'); return; }
    try { await navigator.clipboard.writeText(t); }
    catch (e) { const f = $('#igBildtext'); f.focus(); f.select(); document.execCommand('copy'); }
    S().melde('Bildtext kopiert. In Instagram einfügen.');
  }

  /* ---------- ZIP: nummerierte PNGs + Bildtext ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipBlob(dateien) {   // [{name, daten:Uint8Array}] ohne Kompression (PNG ist schon gepackt)
    const enc = new TextEncoder(), teile = [], zentral = []; let pos = 0;
    const d = new Date(), zeit = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), tag = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const f of dateien) {
      const n = enc.encode(f.name), c = crc32(f.daten), L = f.daten.length;
      const k = new DataView(new ArrayBuffer(30));
      k.setUint32(0, 0x04034b50, true); k.setUint16(4, 20, true); k.setUint16(6, 0x0800, true); k.setUint16(8, 0, true); k.setUint16(10, zeit, true); k.setUint16(12, tag, true);
      k.setUint32(14, c, true); k.setUint32(18, L, true); k.setUint32(22, L, true); k.setUint16(26, n.length, true); k.setUint16(28, 0, true);
      teile.push(k, n, f.daten);
      const z = new DataView(new ArrayBuffer(46));
      z.setUint32(0, 0x02014b50, true); z.setUint16(4, 20, true); z.setUint16(6, 20, true); z.setUint16(8, 0x0800, true); z.setUint16(10, 0, true); z.setUint16(12, zeit, true); z.setUint16(14, tag, true);
      z.setUint32(16, c, true); z.setUint32(20, L, true); z.setUint32(24, L, true); z.setUint16(28, n.length, true); z.setUint32(42, pos, true);
      zentral.push(z, n);
      pos += 30 + n.length + L;
    }
    const groesse = zentral.reduce((a, x) => a + (x.byteLength ?? x.length), 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, dateien.length, true); e.setUint16(10, dateien.length, true); e.setUint32(12, groesse, true); e.setUint32(16, pos, true);
    return new Blob([...teile, ...zentral, e], { type: 'application/zip' });
  }
  async function zip() {
    const st = S(), doc = st.doc(), f = DS.FORMATE[doc.formatKey], n = doc.seiten.length, px = f.px ? f.px[0] : 1080;
    const basis = st.dateiname(), dateien = [];
    for (let i = 0; i < n; i++) {
      st.melde(`Bild ${i + 1} von ${n} wird gerechnet …`, 30000);
      const b = await DS.png(DS.M, doc, i, px);
      dateien.push({ name: `${String(i + 1).padStart(2, '0')}-${basis}.png`, daten: new Uint8Array(await b.arrayBuffer()) });
    }
    if (doc.bildtext && doc.bildtext.text) dateien.push({ name: 'bildtext.txt', daten: new TextEncoder().encode(doc.bildtext.text + '\n') });
    st.laden(zipBlob(dateien), basis + (n > 1 ? '-karussell' : '') + '.zip');
    st.melde(`${n} ${n === 1 ? 'Bild' : 'Bilder'} gespeichert${doc.bildtext && doc.bildtext.text ? ', dazu der Bildtext' : ''}.`, 4200);
  }

  window.DSIg = { panel, istSozial, vorschau, zu, offen: () => !!raum, zip, zipBlob, crc32,
    klick(a) { if (a === 'vorschau') vorschau(); else if (a === 'anfuegen') bildAnfuegen(); else if (a === 'ki') karussellKi(); else if (a === 'zip') zip(); },
    bildAnfuegen };
})();
