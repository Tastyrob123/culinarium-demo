/* Die Künstlerliste · Culinarium Hannover / Walk on the Wild Side (06.11.2026).
   Robert 03.11.2026 nach dem Gespräch mit Rudi: «Buchungsanfragen von Künstlern auf der Website … wenn jemand als DJ irgendwo auftreten möchte …
   diese Kontaktierungen müssen in einem extra Tool auflaufen … nur für das Wildside. Auch für Comedy, alles Mögliche.»
   Die Wild-Side-Seite schickt «Auf unserer Bühne» an /api/anfrage (art kuenstler), der Server des Gästebuchs legt es unter daten/kuenstler/ ab.
   Hier: Liste nach Stand und Sparte, je Anfrage Angaben, Links, Stand (Neu, Gelesen, Im Gespräch, Zugesagt, Abgesagt), Auftrittsdatum und Notiz.
   Verschickt wird hier nichts, es öffnet sich kein Mailprogramm. Bewegung nur über transform und opacity. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mal = (n, eins, viele) => n === 1 ? eins : n + ' ' + viele;
const S = { liste: [], status: {}, sparten: [], wahl: '', filter: 'offen', sparte: 'alle', neu: 0, offen: 0 };
const BILD = { 'DJ': 'barlicht', 'Live-Musik': 'bar', 'Comedy': 'theke', 'Lesung': 'flur', 'Kunst': 'plakatwand', 'Anderes': 'schildnacht' };
const FILTER = [['offen', 'Offen'], ['neu', 'Neu'], ['zugesagt', 'Zugesagt'], ['abgesagt', 'Abgesagt'], ['alle', 'Alle']];
const passt = k => S.filter === 'alle' ? true : S.filter === 'offen' ? ['neu', 'gelesen', 'gespraech'].includes(k.status) : k.status === S.filter;
const zeit = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'; };
const tag = iso => { const d = new Date(iso + 'T12:00:00'); return isNaN(d) ? iso : d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };
const felder = k => String(k.nachricht || '').split('\n').map(z => z.match(/^([^:]{2,40}):\s*(.*)$/)).filter(Boolean).map(m => [m[1].trim(), m[2].trim()]);
/* Links nur als Text mit eigenem «Öffnen», und nur echte Web-Adressen (der Gast tippt sie selbst ein) */
const links = t => esc(t).replace(/\b(https?:\/\/[^\s<]+|(?:www\.)?(?:instagram\.com|soundcloud\.com|youtube\.com|youtu\.be|mixcloud\.com|spotify\.com|bandcamp\.com)\/[^\s<]*)/gi,
  m => `<a href="${/^https?:/i.test(m) ? m : 'https://' + m}" target="_blank" rel="noopener noreferrer nofollow">${m}</a>`);

async function api(was, daten) {
  let r;
  try { r = await fetch('api/' + was, daten === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten) }); }
  catch (e) { throw new Error('Keine Verbindung. Deine Eingabe ist noch da, bitte gleich noch einmal versuchen.'); }
  let d = {}; try { d = await r.json(); } catch (e) { /* */ }
  if (!r.ok) throw new Error(String(d.fehler || 'Fehler ' + r.status).replace(/^[A-ZÄÖÜ-]+ · /, ''));
  return d;
}
function quit(titel, text, fehl) {
  const q = document.createElement('div'); q.className = 'quit' + (fehl ? ' fehl' : '');
  q.innerHTML = `<div><b>${esc(titel)}</b>${text ? `<span>${esc(text)}</span>` : ''}</div>`;
  $('#meldung').appendChild(q); setTimeout(() => q.remove(), fehl ? 9000 : 4000);
}

function rahmen() {
  $('#kopf').innerHTML = WO.kopf({ werkzeug: 'kuenstler', unter: 'Wild Side', titel: 'Auf unserer Bühne', stand: S.neu ? mal(S.neu, 'Eine neue Anfrage', 'neue Anfragen') : 'Keine neuen Anfragen', website: '/wildside/programm.html#buehne', marke: 'href="#"' });
  const e = (k, t, z) => ({ text: t, zahl: z || 0, an: S.filter === k, attr: `data-filter="${k}"` });
  $('#rand').innerHTML = WO.rand([{ titel: '', eintraege: [e('offen', 'Offen', S.offen), e('neu', 'Neu', S.neu)] },
    { titel: 'Stand', eintraege: [e('zugesagt', 'Zugesagt'), e('abgesagt', 'Abgesagt'), e('alle', 'Alle Anfragen')] }], { website: '/wildside/programm.html#buehne' });
  const w = $('#rand .wo-rand__wege');
  if (w) w.insertAdjacentHTML('beforeend', `<a href="${(WO_HAUS.wege || {}).gaeste || '/culinarium-demo/_werkzeuge/reception/'}">${esc(WO.name('gaeste'))}${WO.ic('pfeil')}</a><a href="${(WO_HAUS.wege || {}).zentrale || '/culinarium-demo/_werkzeuge/maison/'}">${esc(WO.name('zentrale'))}${WO.ic('pfeil')}</a>`);
  $$('#rand [data-filter]').forEach(b => b.onclick = () => { S.filter = b.dataset.filter; S.wahl = ''; zeichne(); });
  $('#leiste').innerHTML = WO.leiste({ titel: S.offen ? mal(S.offen, 'Eine Anfrage', 'Anfragen') + ' noch offen' : 'Nichts offen', satz: 'Verschickt wird hier nichts. Antworten schreibt ihr selbst, per Mail oder Telefon.',
    knoepfe: WO.knopf('Neu laden', 'verlauf', 'glas', { id: 'l-neu', klein: true }) });
  $('#l-neu').onclick = () => lade(true);
}
function karte(k, i) {
  return `<button class="ku-k${k.status === 'neu' ? ' neu' : ''}${S.wahl === k.id ? ' aktiv' : ''}" type="button" data-wahl="${esc(k.id)}" style="--i:${i}">
    <span class="ku-k__b" aria-hidden="true"><img src="/culinarium-demo/assets/bild/${BILD[k.sparte] || 'schildnacht'}-640.webp" alt="" width="640" height="800" loading="lazy" decoding="async"></span>
    <span class="ku-k__t"><span class="mono">${k.beispiel ? '<em class="ku-bsp">Beispiel</em>' : ''}${esc(k.sparte)} · ${esc(zeit(k.zeit))}</span><b>${esc(k.name)}</b><small>${esc((felder(k).find(([n]) => /zeitraum|wann/i.test(n)) || [, ''])[1] || 'Zeitraum offen')}</small></span>
    <span class="ku-st ku-st--${esc(k.status)}">${esc(S.status[k.status] || k.status)}</span></button>`;
}
function detail(k) {
  if (!k) return `<div class="re-leer platte"><b>Eine Anfrage wählen.</b><p>Links steht, wer im Walk on the Wild Side auftreten möchte. Ein Klick zeigt alle Angaben.</p></div>`;
  const f = felder(k).filter(([n]) => !/^nachricht$/i.test(n)), frei = (felder(k).find(([n]) => /^nachricht$/i.test(n)) || [, ''])[1];
  return `<section class="re-d ku-d">
    <div class="re-d__kopf"><span class="re-d__bild" aria-hidden="true"><img src="/culinarium-demo/assets/bild/${BILD[k.sparte] || 'schildnacht'}-640.webp" alt="" width="900" height="675" decoding="async"></span>
      <div class="re-d__n"><span class="re-d__k">${esc(k.sparte)} · ${esc(zeit(k.zeit))}</span><h2>${esc(k.name)}</h2></div>
      <div class="re-d__kn"><button class="rund" type="button" data-akt="weg" aria-label="Anfrage löschen" title="Löschen">${WO.ic('x')}</button></div></div>
    ${k.beispiel ? '<p class="ku-bsp-satz">Beispiel: So sieht eine Anfrage aus, wenn jemand auf der Wild-Side-Seite «Auf unserer Bühne» ausfüllt. Die Links führen ins Leere. Löschen geht wie bei jeder anderen.</p>' : ''}
    <dl class="ku-angaben"><div><dt>Kontakt</dt><dd>${esc(k.kontakt)} <button class="ku-kopie" type="button" data-akt="kopie">Kopieren</button></dd></div>
      ${f.map(([n, v]) => `<div><dt>${esc(n)}</dt><dd dir="auto">${links(v) || '–'}</dd></div>`).join('')}</dl>
    ${frei ? `<blockquote class="re-anliegen" dir="auto">${links(frei)}</blockquote>` : ''}
    <div class="ku-stand" role="group" aria-label="Stand">${Object.entries(S.status).map(([s, n]) => `<button type="button" data-status="${s}" aria-pressed="${k.status === s}">${esc(n)}</button>`).join('')}</div>
    <div class="ku-f"><label class="feld"><span>Auftritt am</span><input id="k-auftritt" type="date" value="${esc(k.auftritt || '')}"></label>
      <label class="feld ku-f__n"><span>Notiz fürs Team</span><textarea id="k-notiz" rows="3" placeholder="Etwa: Set angehört, passt zum Freitag. Gage besprochen.">${esc(k.notiz || '')}</textarea></label>
      <button class="kn kn--gold" type="button" data-akt="sichern">Sichern<i>${WO.ic('haken')}</i></button></div>
    ${k.auftritt ? `<p class="ku-auftritt">Auftritt: ${esc(tag(k.auftritt))}</p>` : ''}
  </section>`;
}
function zeichne() {
  rahmen();
  const l = S.liste.filter(passt).filter(k => S.sparte === 'alle' || k.sparte === S.sparte);
  const k = S.liste.find(x => x.id === S.wahl);
  $('#ansicht').innerHTML = WO.startbild({ werkzeug: 'kuenstler', art: 'buehne', zier: esc(WO.name('kuenstler') + ' · Walk on the Wild Side'), h1: 'Wer will <em>auf die Bühne?</em>',
      satz: 'Hier landet, was DJs, Musikerinnen, Comedians und andere Künstler über die Seite des Walk on the Wild Side schicken: wer sie sind, was sie machen, wo man reinhören kann und wann sie spielen möchten. Ihr hört rein, haltet den Stand fest und meldet euch selbst.',
      foto: '/culinarium-demo/assets/bild/barnacht-1000.webp' }) +
    `<div class="ku-raum"><div class="ku-l">
      <div class="ku-sp ku-filter" role="group" aria-label="Stand">${FILTER.map(([f, n]) => `<button type="button" data-filter="${f}" aria-pressed="${S.filter === f}">${n}<i>${S.liste.filter(x => f === 'alle' ? true : f === 'offen' ? ['neu', 'gelesen', 'gespraech'].includes(x.status) : x.status === f).length}</i></button>`).join('')}</div>
      <div class="ku-sp" role="group" aria-label="Sparte">${['alle'].concat(S.sparten).map(s => `<button type="button" data-sparte="${esc(s)}" aria-pressed="${S.sparte === s}">${s === 'alle' ? 'Jede Sparte' : esc(s)}</button>`).join('')}</div>
      ${l.length ? `<div class="ku-liste">${l.map(karte).join('')}</div>` : `<div class="re-leer platte"><b>${S.liste.length ? 'Hier ist gerade nichts.' : 'Noch keine Anfrage.'}</b><p>${S.liste.length ? 'Ein anderer Stand oder eine andere Sparte zeigt mehr.' : 'Sobald jemand auf der Wild-Side-Seite «Auf unserer Bühne» ausfüllt, steht es hier.'}</p></div>`}
    </div><div class="ku-r" id="detail">${detail(k)}</div></div>`;
  $$('#ansicht [data-filter]').forEach(b => b.onclick = () => { S.filter = b.dataset.filter; S.wahl = ''; zeichne(); });
  $$('#ansicht [data-sparte]').forEach(b => b.onclick = () => { S.sparte = b.dataset.sparte; zeichne(); });
  $$('#ansicht [data-wahl]').forEach(b => b.onclick = () => waehle(b.dataset.wahl));
  verbinde(k);
}
async function waehle(id) {
  S.wahl = id; const k = S.liste.find(x => x.id === id);
  if (k && k.status === 'neu') { try { await api('eintrag', { id, status: 'gelesen' }); k.status = 'gelesen'; S.neu--; } catch (e) { /* bleibt neu */ } }
  zeichne();
  if (innerWidth <= 1100) $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function verbinde(k) {
  if (!k) return;
  $$('#detail [data-status]').forEach(b => b.onclick = async () => {
    try { await api('eintrag', { id: k.id, status: b.dataset.status }); k.status = b.dataset.status; await lade(); quit('Stand: ' + S.status[k.status]); } catch (e) { quit(e.message, '', true); } });
  $$('#detail [data-akt]').forEach(b => b.onclick = async () => {
    const akt = b.dataset.akt;
    try {
      if (akt === 'sichern') { await api('eintrag', { id: k.id, notiz: $('#k-notiz').value, auftritt: $('#k-auftritt').value }); await lade(); quit('Gesichert'); }
      if (akt === 'kopie') { await navigator.clipboard.writeText(k.kontakt); quit('Kontakt kopiert'); }
      if (akt === 'weg') { if (!confirm('Die Anfrage von ' + k.name + ' wirklich löschen?')) return; await api('weg', { id: k.id }); S.wahl = ''; await lade(); quit('Gelöscht'); }
    } catch (e) { quit(e.message, '', true); }
  });
}
async function lade(neu) {
  try {
    const d = await api('liste');
    Object.assign(S, { liste: d.liste, status: d.status, sparten: d.sparten, neu: d.neu, offen: d.offen });
    zeichne(); if (neu) quit('Neu geladen');
  } catch (e) { $('#ansicht').innerHTML = `<div class="re-leer platte"><b>Die Künstlerliste startet nicht.</b><p>${esc(e.message)}</p></div>`; }
}
lade();
