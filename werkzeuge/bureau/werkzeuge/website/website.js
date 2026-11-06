/* website.js · das Werkzeug «website» (Le Bureau · Der Schreibtisch). Ein Bau für jedes Haus: ?haus=<kennung>.
   Aufbau und Ablauf sind aus dem ersten Le Bureau abgeleitet (dort website/studio/studio.js, siehe STAND.md): Übersicht, die Website Bereich für
   Bereich (Stellen links, Seite rechts), Zeiten und Preise, Hinweis, Sprachen, Entwurf mit Vorher/nachher, frühere Fassungen.
   Was ein Haus hat, kommt vom Server aus seiner Beschreibung (/api/x/website/haus/<haus>). Hier steht kein Wort über ein bestimmtes Haus.

   Nichts speichert still: Eingaben warten in Z.offen (die Leiste unten zählt sie), «Speichern» legt sie in den Entwurf und antwortet mit
   einer Quittung (vorher, nachher, «Rückgängig»). Auf die Website kommt erst, was veröffentlicht wird.
   Fehler landen zusätzlich im Browser (localStorage «ws-fehler»), dort liest sie die Prüfung (pruefung.html). */
(() => {
'use strict';
const HAUS = (window.Welt && Welt.haus) || '';
const W = 'website';
/* Anrede (29.10.2026): Ein Haus, dessen Kleid WO_HAUS.anrede = 'du' setzt (Culinarium), duzt sein Team. Alle anderen Häuser behalten «Sie», Wort für Wort wie bisher. */
const DU = !!(window.WO_HAUS && window.WO_HAUS.anrede === 'du');
const A = (sie, du) => DU ? du : sie;
const X = weg => '/api/x/' + W + '/' + weg;
/* Rahmen des Hauses (oberflaeche.js, 17.10.2026): Lädt ein Haus sein Werkzeug-Paket (kleid/<haus>.js + oberflaeche.js), zeichnet das Werkzeug Kopf, Rand,
   Startbild, Leiste und Übersicht mit WO.* wie die anderen Werkzeuge desselben Hauses; ohne Paket bleibt alles wie im Stamm (ws-…). */
const WOM = !!window.WO;
const wname = (k, w) => WOM ? ((WO.haus.namen || {})[k] || WO.name(k)) : Welt.name(k, w);   // Namen der Werkzeuge an einer Stelle: kleid/<haus>.js › namen
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
const HAKEN = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>';
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13"/></svg>';
const LUPE = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3.5 3.5"/></svg>';
const WINKEL = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
const TAGNAME = { h1: 'Titel', h2: 'Überschrift', h3: 'Zwischentitel', h4: 'Zwischentitel', p: 'Absatz', li: 'Listenpunkt', a: 'Link', button: 'Knopf', span: 'Text', b: 'Text', small: 'Kleingedrucktes',
  figcaption: 'Bildzeile', dt: 'Begriff', dd: 'Angabe', td: 'Zelle', th: 'Spaltenkopf', label: 'Feld', em: 'Text', strong: 'Text', address: 'Adresse', blockquote: 'Zitat', q: 'Zitat', i: 'Text' };

const Z = { info: null, stand: null, ansicht: 'start', seite: '', sprache: 'de', breite: 'rechner', offen: {}, vs: [], fotos: null, wahl: null, lauf: 0, zl: 0,
            auf: new Set(), gr: new Set(), filter: '', zArt: 'alle', spFilter: 'alle', vgl: { seite: '', sprache: 'de', sicht: 'nachher' }, gesp: 0 };

// ---------------------------------------------------------------- kleine Helfer
function el(tag, attrs, ...kinder) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kinder.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
const leere = e => { e.textContent = ''; return e; };
const kn = (text, tun, art = '', attrs = {}) => el('button', Object.assign({ class: 'kn ' + art, type: 'button', onclick: tun }, attrs), el('span', {}, text), el('i', { 'aria-hidden': 'true', html: PF }));
const taste = (text, tun, attrs = {}) => el('button', Object.assign({ class: 'ws-taste', type: 'button', onclick: tun }, attrs), text);
const link = (text, tun, attrs = {}) => el('button', Object.assign({ class: 'ws-link', type: 'button', onclick: tun }, attrs), text);
const mono = text => el('span', { class: 'ws-mono' }, text);
const mz = (n, eins, viele) => n + ' ' + (n === 1 ? eins : viele);
const kurz = (t, n = 90) => { t = String(t || ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const anf = t => '«' + t + '»';
const schmal = () => window.innerWidth < 1180;
function zeit(iso) { const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(iso || ''); return m ? `${m[3]}.${m[2]}.${m[1]}, ${m[4]}:${m[5]} Uhr` : (iso || ''); }
const tag = iso => zeit(iso).split(',')[0];
function wer() { let w = ''; try { w = localStorage.getItem('ws-wer') || ''; } catch (e) { /* ohne Merken */ } return w || (fn('team_wer') ? 'Team ' + Z.info.name : ''); }   // Fehlerbuch 10a (20.10.2026): keine «Wer arbeitet hier?»-Abfrage, fester Eintrag im Protokoll
const klarText = e => e.textContent.replace(/\s+/g, ' ').trim();
const bild = adr => Z.info.basis + adr;
const fn = k => !!(Z.info && (Z.info.funktionen || []).includes(k));
/* Eigene Ansichten eines Hauses (28.10.2026, Master 4.2 L19: z. B. Termine, die die Website aus Daten zeichnet). Nur wo der Rahmen eines Hauses window.WS_EIGEN setzt,
   sonst leer und ohne Wirkung. Je Ansicht: {name, gruppe, zeichne(ort, hilfe), offen() Eingaben, speichern() → true/false, wartet() Entwurf, veroeffentlichen(notiz), zeilen() für das Fenster}. */
const EIGEN = window.WS_EIGEN || {};
const eigen = () => Object.keys(EIGEN).map(k => Object.assign({ key: k }, EIGEN[k]));
const eigenZahl = was => eigen().reduce((n, e) => n + (e[was] ? e[was]() : 0), 0);   // Funktionen, die ein Haus in seiner Beschreibung einschaltet (21.10.2026)
const kartenAdresse = () => WOM && WO.haus.wege && WO.haus.wege.karten ? WO.haus.wege.karten : '/werkzeuge/karten/?haus=' + encodeURIComponent(HAUS);

function merke(text, stichwort) {
  try {
    const l = JSON.parse(localStorage.getItem('ws-fehler') || '[]');
    l.push({ zeit: new Date().toISOString(), text: String(text).slice(0, 400), stichwort: stichwort || '', wo: Z.ansicht, haus: HAUS });
    localStorage.setItem('ws-fehler', JSON.stringify(l.slice(-30)));
  } catch (e) { /* voller oder gesperrter Speicher: die Meldung steht trotzdem auf der Seite */ }
}
let unterwegs = 0;   // laufende Anfragen, steht als data-ws-laeuft am <html> (der Prüflauf wartet darauf)
function zaehle(n) { unterwegs += n; document.documentElement.setAttribute('data-ws-laeuft', unterwegs); }
async function ruf(methode, weg, daten) {
  let r, j = null;
  zaehle(1);
  try {
    const vorab = methode === 'GET' && !daten && window.__vorab && window.__vorab[weg]; if (vorab) delete window.__vorab[weg];   /* Leistung 29.10.2026: nur wenn die Seite des Hauses die Daten schon beim Laden holt (window.__vorab, z. B. Culinarium); sonst wie bisher */
    r = await (vorab || fetch(weg, { method: methode, headers: daten ? { 'Content-Type': 'application/json' } : {}, body: daten ? JSON.stringify(daten) : undefined, cache: 'no-store' }));
    try { j = await r.json(); } catch (e) { /* keine lesbare Antwort */ }
  } catch (e) { throw { stichwort: 'keine-verbindung', fehler: 'Der Server des Werkzeugs antwortet nicht.' }; } finally { zaehle(-1); }
  if (!r.ok || j == null) throw Object.assign({ status: r.status, stichwort: 'unerwartet', fehler: 'Unerwartete Antwort des Servers (' + r.status + ').' }, j || {});
  return j;
}

// ---------------------------------------------------------------- Meldung, Quittung, Fenster
function pruefLink(stichwort) { return '/werkzeuge/website/pruefung.html?haus=' + encodeURIComponent(HAUS) + (stichwort ? '#lex-' + stichwort : ''); }
function quit(titel, text, knoepfe = [], attrs = {}) {
  const k = el('div', Object.assign({ class: 'ws-quit', role: 'status' }, attrs),
    el('div', { class: 'ws-quit__t' }, el('b', {}, titel), text ? el('span', {}, text) : null), knoepfe,
    el('button', { class: 'ws-rund', type: 'button', 'aria-label': 'Schliessen', html: ZU, onclick: () => k.remove() }));
  leere($('#ws-quittung')).append(k);
  return k;
}
function melde(text, opt = {}) {
  return quit(text, opt.mehr || '', opt.stichwort ? [el('a', { class: 'ws-taste', href: pruefLink(opt.stichwort) }, 'Was tun?')] : [], { 'data-ws-meldung': opt.stichwort || 'hinweis', role: opt.fehler ? 'alert' : 'status' });
}
function fehler(e) {
  const text = (e && e.fehler) || (e && e.message) || String(e);
  merke(text, e && e.stichwort);
  melde(text, { fehler: true, stichwort: (e && e.stichwort) || 'unerwartet' });
}
function quittung(titel, zeilen, vorherDaten) {
  const z = zeilen[0];
  const wert = (t, adr, q) => adr ? el('span', { 'data-ws-q': q }, 'Foto') : el('span', { 'data-ws-q': q }, kurz(t, 170) || 'nichts');
  const text = el('span', {}, z.was + ' · ' + z.wo + ': «', wert(z.vorher, z.vorher_bild, 'vorher'), '» wird «', wert(z.nachher, z.nachher_bild, 'nachher'), '»',
    zeilen.length > 1 ? ' und ' + mz(zeilen.length - 1, 'weitere Stelle', 'weitere Stellen') : '');
  const k = quit(titel, '', [
    taste('Vorher/nachher ansehen', () => { k.remove(); geh('entwurf', { seite: (z.key || '').split('|')[1] || '' }); }),
    vorherDaten ? taste('Rückgängig', () => rueckgaengig(vorherDaten, k)) : null], { 'data-ws-quittung': zeilen.length });
  $('.ws-quit__t', k).append(text);
}
function fenster(titel, akzent, inhalt, knoepfe, opt = {}) {
  const ort = $('#ws-fenster');
  const zu = () => { leere(ort); document.removeEventListener('keydown', taste_); };
  const taste_ = ev => { if (ev.key === 'Escape') zu(); };
  const blatt = el('div', { class: 'ws-fenster__blatt', role: 'dialog', 'aria-modal': 'true', 'aria-label': titel + ' ' + akzent, 'data-ws-fenster': opt.name || '1' },
    el('h2', {}, titel + ' ', el('span', { class: 't-akzent' }, akzent)), inhalt,
    el('div', { class: 'ws-fenster__kn' }, knoepfe.filter(Boolean).map(k => k.haupt ? kn(k.text, () => k.tun(zu), 'kn--d kn--klein') : link(k.text, () => (k.tun ? k.tun(zu) : zu())))));
  leere(ort).append(el('div', { class: 'ws-fenster' }, el('button', { class: 'ws-fenster__grund', type: 'button', 'aria-label': 'Schliessen', onclick: zu }), blatt));
  document.addEventListener('keydown', taste_);
  return zu;
}

// ---------------------------------------------------------------- Auswahl und Wahl im Stil des Hauses
function auswahl(optionen, wert, beiWahl, name, dunkel) {
  const jetzt = () => optionen.find(o => o.wert === wert) || optionen[0] || { text: '' };
  const kopf_ = el('span', {}, jetzt().text);
  const knopf = el('button', { class: 'ws-auswahl__knopf', type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-label': name }, kopf_, el('span', { html: WINKEL, 'aria-hidden': 'true' }));
  const liste = el('div', { class: 'ws-auswahl__liste', role: 'listbox', hidden: true, 'aria-label': name });
  const k = el('div', { class: 'ws-auswahl' + (dunkel ? ' ws-auswahl--dunkel' : ''), 'data-ws-auswahl': name }, knopf, liste);
  let zeiger = -1;
  const zeig = i => { zeiger = Math.max(0, Math.min(optionen.length - 1, i)); [...liste.children].forEach((c, n) => c.classList.toggle('ws-zeiger', n === zeiger)); liste.children[zeiger].scrollIntoView({ block: 'nearest' }); };
  const zu = () => { liste.hidden = true; knopf.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', aussen, true); };
  const aussen = ev => { if (!k.contains(ev.target)) zu(); };
  const waehle = i => { const o = optionen[i]; zu(); knopf.focus(); if (o.wert !== wert) { wert = o.wert; kopf_.textContent = o.text; beiWahl(o.wert); } };
  const auf = () => {
    leere(liste);
    optionen.forEach((o, i) => liste.append(el('div', { role: 'option', 'aria-selected': o.wert === wert ? 'true' : 'false', 'data-unter': o.unter ? '1' : null, 'data-wert': o.wert, onclick: () => waehle(i) },
      el('span', {}, o.text), o.zusatz ? mono(o.zusatz) : null)));
    liste.hidden = false; knopf.setAttribute('aria-expanded', 'true');
    zeig(Math.max(0, optionen.findIndex(o => o.wert === wert)));
    document.addEventListener('click', aussen, true);
  };
  knopf.addEventListener('click', () => (liste.hidden ? auf() : zu()));
  k.addEventListener('keydown', ev => {
    if (liste.hidden) { if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); auf(); } return; }
    if (ev.key === 'Escape') { ev.stopPropagation(); zu(); knopf.focus(); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); zeig(zeiger + 1); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); zeig(zeiger - 1); }
    else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); waehle(zeiger); }
  });
  return k;
}
function wahl2(optionen, wert, beiWahl, name, hell) {
  const k = el('div', { class: 'ws-wahl2' + (hell ? ' ws-wahl2--hell' : ''), role: 'group', 'aria-label': name, 'data-ws-wahl': name });
  optionen.forEach(o => k.append(el('button', { type: 'button', 'aria-pressed': o.wert === wert ? 'true' : 'false', 'data-wert': o.wert, onclick: ev => {
    if (o.wert === wert) return;
    wert = o.wert;
    [...k.children].forEach(c => c.setAttribute('aria-pressed', c === ev.currentTarget ? 'true' : 'false'));
    beiWahl(o.wert);
  } }, o.text)));
  return k;
}

// ---------------------------------------------------------------- Kopf, Rand, Leiste
const TITEL = { start: 'Übersicht', zahlen: 'Zeiten & Preise', angaben: 'Angaben des Hauses', google: 'Google-Texte', hinweis: 'Hinweis für Gäste', sprachen: 'Sprachen', entwurf: 'Entwurf & Vergleich', verlauf: 'Frühere Fassungen' };
const webBereich = key => Z.info.website.find(b => b.key === key);
const bereichVon = seite => Z.info.website.find(b => b.seiten.some(s => s.datei === seite));
function ansichtName(a) {
  if (a.startsWith('b:')) return (webBereich(a.slice(2)) || {}).name || '';
  if (a.startsWith('haus:')) return (Z.info.bereiche.find(b => b.key === a.slice(5)) || {}).name || '';
  if (a.startsWith('e:')) return (EIGEN[a.slice(2)] || {}).name || '';
  return TITEL[a] || '';
}
const offenZahl = () => Object.keys(Z.offen).length + eigenZahl('offen');
const aend = () => (Z.stand && Z.stand.offen ? Z.stand.aenderungen : []);
function zeichenBild(klein) {
  const k = Z.info.kleid;
  if (!k.zeichen || (klein && k.zeichen_art === 'maske')) return null;
  return k.zeichen_art === 'maske' ? el('span', { class: 'ws-zeichen ws-zeichen--maske', style: `--ws-zeichen:url('${k.zeichen}')` }) : el('img', { src: k.zeichen, alt: '' });
}
function stilLaden() {
  /* Kleid des Hauses (Farben, Schriften, Anordnung), falls das Haus eins hat. Die Ansicht wird erst gezeichnet, wenn es da ist (höchstens 2,5 s), damit nichts in fremden Farben aufblitzt. */
  document.documentElement.setAttribute('data-haus', HAUS);
  if (WOM) return document.fonts ? document.fonts.ready : Promise.resolve();   // das Paket des Hauses bringt sein Kleid selbst mit
  const neu = (Z.info.kleid.stil || []).filter(h => !document.querySelector(`link[data-ws-stil="${h.split('?')[0]}"]`));
  return Promise.race([Promise.all(neu.map(h => new Promise(fertig => {
    const l = el('link', { rel: 'stylesheet', href: h, 'data-ws-stil': h.split('?')[0] });
    l.addEventListener('load', fertig); l.addEventListener('error', fertig);
    document.head.append(l);
  })).concat(Z.info.kleid.foto ? [new Promise(fertig => { const i = new Image(); i.onload = i.onerror = fertig; i.src = bild(Z.info.kleid.foto); })] : [])),
    new Promise(fertig => setTimeout(fertig, 2500))]).then(() => document.fonts && document.fonts.ready);
}
function kleid() {
  if (WOM) { document.title = wname(W) + ' · ' + Z.info.name; return; }   // Zeichen, Tapete und Kopf kommen aus dem Paket des Hauses
  /* Zeichen und Tapete gehören dem Haus. Die Tapete liegt nur in der Welt des Hauses auf dem Grund: in der anderen Welt passt sie nicht zu den Farben. */
  const k = Z.info.kleid, an = k.tapete && Welt.welt() === Z.info.welt;
  document.body.style.backgroundImage = an ? `url('${k.tapete}')` : '';
  document.body.style.backgroundSize = an ? k.tapete_breite + 'px auto' : '';
  const z = zeichenBild(false);
  leere($('#ws-zeichen')).className = z && Z.info.kleid.zeichen_art !== 'maske' ? 'ws-zeichen' : '';
  if (z) $('#ws-zeichen').append(z);
  $('#ws-haus').textContent = 'Website · ' + Z.info.name;
  document.title = wname(W) + ' · ' + Z.info.name;
}
function kopf() {
  const a = aend().length + eigenZahl('wartet'), z = Z.stand && Z.stand.zuletzt;   // eigene Ansichten (Termine) zählen mit
  if (WOM) {
    const k = $('#ws-kopf');
    k.innerHTML = WO.kopf({ werkzeug: W, unter: 'Website', titel: ansichtName(Z.ansicht) || wname(W), stand: a ? a + ' im Entwurf' : z ? 'Veröffentlicht ' + tag(z.zeit) : 'Wie gebaut',
      pruefung: pruefLink(''), anleitung: Z.info.anleitung || '', website: Z.info.online + (Z.ansicht.startsWith('b:') ? Z.seite : Z.info.seiten[0].datei), marke: 'data-ws-marke', markeHref: '?ansicht=start' });
    const m = k.querySelector('[data-ws-marke]');
    if (m) m.addEventListener('click', ev => { ev.preventDefault(); if (Z.info) geh('start'); });
    k.querySelectorAll('.wo-wz, .wo-kopf__r a').forEach(x => { const n = Object.keys(WO.namen).find(s => x.textContent === WO.name(s) || x.title === WO.name(s)); if (n && wname(n) !== WO.name(n)) { if (x.textContent === WO.name(n)) x.textContent = wname(n); x.title = x.title && wname(n); x.setAttribute('aria-label', x.getAttribute('aria-label') ? wname(n) : ''); } });
    const b = k.querySelector('.wo-marke-w b'); if (b) b.textContent = wname(W);
    const rk = k.querySelector('[data-wo-rand-knopf]'); if (rk) rk.setAttribute('aria-expanded', document.documentElement.classList.contains('wo-rand-auf') ? 'true' : 'false');   // Kopf neu gezeichnet: Knopf sagt, ob der Rand offen ist
    return;
  }
  $('#ws-ansicht-name').textContent = ansichtName(Z.ansicht) || wname(W);
  $('#ws-lage').textContent = a ? a + ' im Entwurf' : z ? 'Veröffentlicht ' + tag(z.zeit) : 'Wie gebaut';
  $('#ws-ansehen').href = Z.info.online + (Z.ansicht.startsWith('b:') ? Z.seite : Z.info.seiten[0].datei);
  $('#ws-zur-pruefung').href = pruefLink('');
}
function rand() {
  const r = leere($('#ws-rand')), ae = aend();
  if (WOM) {
    const nw = (a, name, zahl, extra) => ({ text: name || ansichtName(a), zahl: zahl || 0, an: Z.ansicht === a, attr: `data-ws-nav="${a}"`, extra: extra ? `<em class="wo-rand__z">${WO.esc(extra)}</em>` : '' });
    const g = [{ eintraege: [nw('start')] }, { titel: 'Die Website', eintraege: Z.info.website.map(b => nw('b:' + b.key, b.name, ae.filter(x => b.seiten.some(s => s.datei === x.seite)).length)) }];
    const alle = [Z.info.angaben ? nw('angaben') : null, Z.info.zahlen ? nw('zahlen') : null, Z.info.google ? nw('google') : null, Z.info.hinweis ? nw('hinweis') : null, Z.info.sprachen.length ? nw('sprachen', '', 0, Z.stand && Z.stand.fehlt ? Z.stand.fehlt + ' fehlen' : '') : null].filter(Boolean);
    if (alle.length) g.push({ titel: 'Für alle Seiten', eintraege: alle });
    if (Z.info.bereiche.length) g.push({ titel: 'Das Haus', eintraege: Z.info.bereiche.map(b => nw('haus:' + b.key, b.name)) });
    eigen().forEach(e => { const t = e.gruppe || 'Das Haus', z = (e.offen ? e.offen() : 0) + (e.wartet ? e.wartet() : 0); let gr = g.find(x => x.titel === t); if (!gr) g.push(gr = { titel: t, eintraege: [] }); gr.eintraege.unshift(nw('e:' + e.key, e.name, z)); });
    if (Z.info.karten) g.push({ titel: 'Karten', eintraege: [{ text: wname('karten'), href: kartenAdresse(), attr: 'data-ws-nav="karten"', extra: '<em class="wo-rand__z">eigenes Werkzeug</em>' }] });
    g.push({ titel: 'Entwurf', eintraege: [nw('entwurf', '', ae.length), nw('verlauf')] });
    r.innerHTML = WO.rand(g, { website: Z.info.online + Z.info.seiten[0].datei, pruefung: pruefLink(''), anleitung: Z.info.anleitung || '' });
    r.querySelectorAll('button[data-ws-nav]').forEach(b => b.addEventListener('click', () => geh(b.getAttribute('data-ws-nav'))));
    return;
  }
  const nw = (a, name, zahl, extra) => el('button', { class: 'ws-nw', type: 'button', 'aria-current': Z.ansicht === a ? 'page' : null, 'data-ws-nav': a, onclick: () => geh(a) },
    el('span', {}, name || ansichtName(a)), zahl ? el('i', {}, zahl) : null, extra ? el('em', {}, extra) : null);
  const nav = el('nav', { class: 'ws-nav', 'aria-label': 'Bereiche' }, nw('start'));
  nav.append(el('p', {}, 'Die Website'));
  Z.info.website.forEach(b => nav.append(nw('b:' + b.key, b.name, ae.filter(x => b.seiten.some(s => s.datei === x.seite)).length)));
  nav.append(el('p', {}, 'Für alle Seiten'));
  if (Z.info.zahlen) nav.append(nw('zahlen'));
  if (Z.info.hinweis) nav.append(nw('hinweis'));
  if (Z.info.sprachen.length) nav.append(nw('sprachen', '', 0, Z.stand && Z.stand.fehlt ? Z.stand.fehlt + ' fehlen' : ''));
  if (Z.info.bereiche.length || eigen().length) { nav.append(el('p', {}, 'Das Haus')); eigen().forEach(e => nav.append(nw('e:' + e.key, e.name))); Z.info.bereiche.forEach(b => nav.append(nw('haus:' + b.key, b.name))); }
  if (Z.info.karten) nav.append(el('p', {}, 'Karten'), el('a', { class: 'ws-nw', href: kartenAdresse(), 'data-ws-nav': 'karten' }, el('span', {}, wname('karten')), el('em', {}, 'eigenes Werkzeug')));
  nav.append(el('p', {}, 'Entwurf'), nw('entwurf', '', ae.length), nw('verlauf'));
  r.append(el('button', { class: 'ws-rand__auf', id: 'ws-menue-knopf', type: 'button', 'aria-expanded': 'false', onclick: menue }, el('span', {}, 'Bereiche: ' + (ansichtName(Z.ansicht) || '')), el('span', { html: WINKEL, 'aria-hidden': 'true' })), nav,
    el('div', { class: 'ws-wege' },
      el('a', { href: Z.info.online + Z.info.seiten[0].datei, target: '_blank', rel: 'noopener' }, 'Website ansehen', el('span', { html: PF })),
      el('a', { href: pruefLink(''), 'data-ws-nav': 'pruefung' }, 'Prüfung', el('span', { html: PF }))));
}
function menue() {
  const auf = $('#ws-rand').classList.toggle('ws-offen');
  $('#ws-menue-knopf').setAttribute('aria-expanded', auf ? 'true' : 'false');
}
function leiste() {
  const l = leere($('#ws-leiste')), s = Z.stand;
  if (!s) return;
  const n = offenZahl(), a = aend().length + eigenZahl('wartet'), z = s.zuletzt, gesp = !n && Z.gesp > Date.now();
  l.setAttribute('data-ws-offen', String(a));
  if (WOM) {
    l.innerHTML = WO.leiste({
      titel: n ? mz(n, 'Eingabe', 'Eingaben') + ' noch nicht gespeichert' : a ? 'Entwurf: ' + mz(a, 'Änderung wartet', 'Änderungen warten') : 'Alles ist veröffentlicht',
      satz: n ? A('Speichern legt sie in den Entwurf. Auf der Website erscheint erst, was Sie veröffentlichen.', 'Speichern legt sie in den Entwurf. Auf der Website erscheint erst, was du veröffentlichst.') : a ? 'Gespeichert, noch nicht auf der Website.' + (s.fehlt ? ' ' + mz(s.fehlt, 'Übersetzung fehlt', 'Übersetzungen fehlen') + '.' : '') :
        z ? 'Zuletzt veröffentlicht ' + zeit(z.zeit) + (z.notiz ? ' · ' + z.notiz : '') + '.' : 'Die Website zeigt sich wie gebaut.',
      entwurf: !!a && !n,
      knoepfe: (fn('leiste_klar') && !(a || n) ? '' : WO.knopf('Vorher, nachher', 'auge', 'glas', { id: 'ws-vgl', klein: true, disabled: !(a || n) }))
        + WO.knopf(gesp ? 'Gespeichert' : 'Speichern', gesp ? 'haken' : 'pfeil', n ? 'wartet' : gesp ? 'fertig' : 'glas', { id: 'ws-speichern', klein: true, attr: `data-ws-lage="${n ? 'offen' : gesp ? 'gespeichert' : 'ruhig'}"` })
        + (fn('leiste_klar') && !(a && !n) ? '' : WO.knopf('Veröffentlichen', 'hoch', 'gold', { id: 'ws-raus', klein: true, disabled: !(a && !n), titel: n ? 'Erst speichern' : '' }))
    });
    const sp = $('#ws-speichern'); sp.querySelector('span').id = 'ws-speichern-text';
    sp.addEventListener('click', speichern);
    if ($('#ws-vgl')) $('#ws-vgl').addEventListener('click', () => geh(vglZiel()));
    if ($('#ws-raus')) $('#ws-raus').addEventListener('click', veroeffentlichen);
    return;
  }
  l.append(el('div', { class: 'ws-leiste__t' },
    el('b', {}, a && !n ? el('span', { class: 'marke' }, 'Entwurf') : null,
      el('span', {}, n ? mz(n, 'Eingabe', 'Eingaben') + ' noch nicht gespeichert' : a ? 'Entwurf: ' + mz(a, 'Änderung wartet', 'Änderungen warten') : 'Alles ist veröffentlicht')),
    el('span', {}, n ? A('Speichern legt sie in den Entwurf. Auf der Website erscheint erst, was Sie veröffentlichen.', 'Speichern legt sie in den Entwurf. Auf der Website erscheint erst, was du veröffentlichst.') :
      a ? ['Gespeichert, noch nicht auf der Website.', s.fehlt ? el('span', { 'data-ws-fehlt': s.fehlt }, ' ' + mz(s.fehlt, 'Übersetzung fehlt', 'Übersetzungen fehlen') + '.') : null] :
      z ? 'Zuletzt veröffentlicht ' + zeit(z.zeit) + (z.notiz ? ' · ' + z.notiz : '') + '.' : 'Die Website zeigt sich wie gebaut.')));
  const sp = el('button', { class: 'kn ws-speichern' + (n ? ' ws-zu-tun' : ''), id: 'ws-speichern', type: 'button', 'data-ws-lage': n ? 'offen' : gesp ? 'gespeichert' : 'ruhig', onclick: speichern },
    el('span', { id: 'ws-speichern-text' }, gesp ? 'Gespeichert' : 'Speichern'), el('i', { 'aria-hidden': 'true', html: gesp ? HAKEN : PF }));
  l.append(sp, kn('Vorher, nachher', () => geh(vglZiel()), 'kn--d', { id: 'ws-vgl', disabled: !(a || n) }),
    kn('Veröffentlichen', veroeffentlichen, 'ws-kn-metall', { id: 'ws-raus', disabled: !(a && !n), title: n ? 'Erst speichern' : null }));
}
function allesNeu() { kopf(); rand(); leiste(); }
function vglZiel() {   // «Vorher, nachher»: der Vergleich des Stamms; warten nur eigene Ansichten, deren Ansicht (dort steht vorher und nachher)
  const e = eigen().find(x => (x.offen && x.offen()) || (x.wartet && x.wartet()));
  return !Object.keys(Z.offen).length && !aend().length && e ? 'e:' + e.key : 'entwurf';
}

// ---------------------------------------------------------------- Vormerken, Speichern, Rückgängig, Konflikt
function vormerken(key, op) { Z.offen[key] = op; leiste(); }
function vergessen(key) { if (key in Z.offen) { delete Z.offen[key]; leiste(); } }
async function ladeStand() { Z.stand = await ruf('GET', X('stand/' + HAUS)); allesNeu(); return Z.stand; }

async function sende(ops, opt = {}) {
  let a;
  try {
    a = await ruf('POST', X('aendern/' + HAUS), { ops, erwartet: Z.stand.kennung, wer: wer() });
  } catch (e) {
    if (e.status === 409) return konflikt(ops, opt);
    fehler(e); return false;
  }
  Z.stand = a.stand;
  if (opt.eingaben) Z.offen = {};
  if (a.nichts) { melde(a.meldung); allesNeu(); await zeichne({ halten: true }); return true; }
  Z.gesp = Date.now() + 6000;
  setTimeout(leiste, 6100);
  allesNeu();
  quittung(opt.titel || 'Gespeichert', a.quittung, a.vorher_daten);
  await zeichne({ halten: true, neuLaden: true });
  return true;
}
async function speichern() {
  const ops = Object.values(Z.offen), eig = eigen().filter(e => e.offen && e.offen());
  if (!ops.length && !eig.length) { melde('Nichts geändert, nichts gespeichert.'); return; }
  for (const e of eig) { if (!(await e.speichern())) return; }   // eigene Ansichten speichern selbst (Quittung, Konflikt), danach der Stamm
  if (ops.length) await sende(ops, { eingaben: true }); else { Z.gesp = Date.now() + 6000; setTimeout(leiste, 6100); allesNeu(); }
}
async function rueckgaengig(vorherDaten, karte) {
  try {
    await ruf('PUT', '/api/entwurf/' + HAUS + '/' + W, { daten: vorherDaten, erwartet: Z.stand.kennung, wer: wer() });
  } catch (e) {
    if (e.status === 409) { await ladeStand(); melde('Inzwischen hat jemand anderes gespeichert.', { mehr: A('Rückgängig hätte dessen Änderung überschrieben und wurde deshalb nicht ausgeführt. Einzelne Änderungen nehmen Sie unter «Entwurf & Vergleich» zurück.', 'Rückgängig hätte dessen Änderung überschrieben und wurde deshalb nicht ausgeführt. Einzelne Änderungen nimmst du unter «Entwurf & Vergleich» zurück.'), stichwort: 'konflikt' }); return; }
    fehler(e); return;
  }
  if (karte) karte.remove();
  Z.gesp = 0;
  await ladeStand();
  melde('Rückgängig gemacht', { mehr: 'Der Entwurf ist wie vor diesem Speichern.' });
  await zeichne({ halten: true, neuLaden: true });
}
async function konflikt(ops, opt) {
  const vorher = aend();
  try { await ladeStand(); } catch (e) { fehler(e); return false; }
  const alt = new Map(vorher.map(a => [a.key, a.nachher]));
  const fremd = aend().filter(a => alt.get(a.key) !== a.nachher);
  const meine = new Set(ops.flatMap(o => (o.orte || [{ seite: o.seite, n: o.n }]).map(x => [o.art, x.seite, o.h || o.b, x.n].join('|'))));
  const gleiche = fremd.filter(a => meine.has(a.key));
  const inhalt = el('div', { class: 'ws-form' },
    el('p', {}, A('Inzwischen hat jemand anderes gespeichert. Ihre Eingabe ist nicht verloren und nichts wurde überschrieben.', 'Inzwischen hat jemand anderes gespeichert. Deine Eingabe ist nicht verloren und nichts wurde überschrieben.')),
    fremd.length ? el('div', {}, mono('Neu von anderer Seite'), el('div', { class: 'ws-liste-klein' }, fremd.slice(0, 6).map(a => el('p', {}, a.wo + ': ' + anf(kurz(a.nachher, 260)))))) : null,
    gleiche.length ? el('p', { 'data-ws-gleiche': '1' }, 'Achtung: dieselbe Stelle wurde auch von anderer Seite geändert, dort steht jetzt ' + anf(kurz(gleiche[0].nachher, 110)) + A('. Speichern Sie, ersetzt Ihre Eingabe diesen Text.', '. Speicherst du, ersetzt deine Eingabe diesen Text.')) :
      el('p', {}, A('Ihre Eingabe betrifft eine andere Stelle. Sie können sie auf den neuen Stand speichern, beides bleibt erhalten.', 'Deine Eingabe betrifft eine andere Stelle. Du kannst sie auf den neuen Stand speichern, beides bleibt erhalten.')));
  return new Promise(fertig => {
    fenster('Zwei haben', 'gleichzeitig geändert.', inhalt, [
      { text: 'Meine Eingabe verwerfen', tun: zu => { zu(); if (opt.eingaben) Z.offen = {}; allesNeu(); zeichne({ halten: true, neuLaden: true }); fertig(false); } },
      { text: 'Meine Eingabe speichern', haupt: true, tun: async zu => { zu(); fertig(await sende(ops, opt)); } }], { name: 'konflikt' });
  });
}

// ---------------------------------------------------------------- Navigation und Titel
async function geh(ansicht, opt = {}) {
  $('#ws-rand').classList.remove('ws-offen');
  if (ansicht === 'vergleich') ansicht = 'entwurf';
  Z.ansicht = ansicht;
  Z.wahl = opt.zeige || null;
  if (opt.seite) { if (ansicht === 'entwurf') Z.vgl.seite = opt.seite; else Z.seite = opt.seite; }
  try { localStorage.setItem('ws-ort-' + HAUS, JSON.stringify({ a: Z.ansicht, s: Z.seite })); } catch (e) { /* ohne Merken */ }
  allesNeu();
  await zeichne(opt);
  if (!opt.halten) window.scrollTo(0, 0);
}
function titel(klein, a, b, satz, knoepfe, knapp, foto) {
  if (WOM) {   // Startbild des Hauses: Übersicht «voll» mit dem Aussenfoto, jede andere Ansicht «buehne» (UMSTELLUNG.md)
    const h = el('div', { class: 'ws-titel ws-titel--wo', html: WO.startbild({ werkzeug: W, zier: WO.esc(klein), h1: WO.esc(a ? a + ' ' : '') + (b ? '<em>' + WO.esc(b) + '</em>' : ''), satz: satz ? WO.esc(satz) : '',
      knoepfe: knoepfe && knoepfe.length ? ' ' : '', art: Z.ansicht === 'start' ? 'voll' : 'buehne', foto: Z.ansicht === 'start' ? '' : titelFoto() }) });
    const kn = h.querySelector('.wo-sb__kn'); if (kn) { kn.textContent = ''; kn.append(...knoepfe); }
    return h;
  }
  const z = zeichenBild(true);
  return el('header', { class: 'ws-titel' + (knapp ? ' ws-titel--knapp' : '') + (foto ? ' ws-titel--foto' : '') },
    el('div', { class: 'ws-titel__t' }, el('span', { class: 'ws-zier' }, knapp ? null : el('i'), z, el('span', {}, klein), el('i')),
      el('h1', {}, a ? a + ' ' : '', b ? el('em', {}, b) : null), satz ? el('p', { class: 'ws-satz' }, satz) : null,
      foto && knoepfe && knoepfe.length ? el('div', { class: 'ws-titel__kn' }, knoepfe) : null),
    !foto && knoepfe && knoepfe.length ? el('div', { class: 'ws-titel__kn' }, knoepfe) : null,
    foto ? el('figure', { class: 'ws-titel__foto' }, el('img', { src: bild(foto), alt: '', decoding: 'async' })) : null);
}
function titelFoto() {   // Bühne einer Ansicht: das Foto ihres Bereichs der Website, sonst das Aussenfoto des Hauses
  const b = Z.ansicht.startsWith('b:') ? webBereich(Z.ansicht.slice(2)) : null;
  return b && b.foto_gross ? bild(b.foto_gross) : '';
}
function zweiteilig(name) { const m = /^(\S+)\s+(.*)$/.exec(name); return m ? [m[1], m[2]] : ['', name]; }

// ---------------------------------------------------------------- Vorschau: die Seite des Hauses im Rahmen
function vorschau(zustand, seite, sprache, kopfzeile) {
  const frame = el('iframe', { title: (zustand === 'vorher' ? 'Veröffentlicht: ' : zustand === 'nachher' ? 'Entwurf: ' : 'Vorschau: ') + seite, 'data-ws-frame': zustand });
  const lage = el('div', { class: 'ws-vorschau__lage' }, el('span', { class: 'ws-mono' }, 'Seite wird gesetzt …'));
  const rahmen = el('div', { class: 'ws-rahmen' }, frame, lage);
  const k = el('section', { class: 'ws-vorschau', 'aria-label': 'Vorschau der Seite' }, kopfzeile || null, rahmen);
  const v = { k, frame, zustand, seite, sprache, bereit: false, nach: null, lauf_: 0 };
  v.passe = () => {
    const handy = schmal() || Z.breite === 'handy';
    rahmen.classList.toggle('ws-rahmen--handy', handy && !schmal());
    const b = rahmen.clientWidth, h = rahmen.clientHeight;
    if (!b || !h) return;
    const m = handy ? 1 : Math.min(1, b / 1440);
    frame.style.width = (handy ? b : 1440) + 'px';
    frame.style.height = Math.round(h / m) + 'px';
    frame.style.transform = m === 1 ? 'none' : 'scale(' + m + ')';
  };
  v.sende = d => { if (frame.contentWindow) frame.contentWindow.postMessage(d, '*'); };
  v.farben = () => { const c = getComputedStyle(document.documentElement); v.sende({ ws: 'farben', a: c.getPropertyValue('--strich').trim(), p: c.getPropertyValue('--punkt').trim() }); };
  v.lade = async halten => {
    const y = halten && frame.contentWindow ? frame.contentWindow.scrollY : 0;
    const lauf = ++v.lauf_;
    lage.hidden = false;
    let a;
    try { a = await ruf('GET', X(['vorschau', HAUS, v.zustand, v.sprache, v.seite].map(encodeURIComponent).join('/'))); } catch (e) { lage.firstChild.textContent = e.fehler || 'Die Seite lässt sich nicht laden.'; fehler(e); return; }
    if (lauf !== v.lauf_) return;
    v.bereit = false;
    await new Promise(fertig => { v.geladen = () => { v.bereit = true; lage.hidden = true; v.farben(); if (y) v.sende({ ws: 'oben', y }); fertig(); }; frame.srcdoc = a.html; setTimeout(fertig, 9000); });
    if (v.nach) { const f = v.nach; v.nach = null; f(); }
  };
  requestAnimationFrame(() => { v.passe(); v.lade(false); });
  return v;
}
window.addEventListener('message', ev => {
  const d = ev.data || {}, v = Z.vs.find(x => x.frame.contentWindow === ev.source);
  if (!v || !d.ws) return;
  if (d.ws === 'geladen') { if (v.geladen) v.geladen(); }
  else if (d.ws === 'text') zeileOeffnen(d.h, d.n);
  else if (d.ws === 'bild') bildFenster({ seite: v.seite, b: d.b, n: d.n });
  else if (d.ws === 'zu') gesperrt(d.werkzeug);
  else if (d.ws === 'gehe' && Z.ansicht.startsWith('b:')) { const b = bereichVon(d.seite); if (b) geh('b:' + b.key, { seite: d.seite }); }
});
window.addEventListener('resize', () => Z.vs.forEach(v => v.passe()));
function gesperrt(werkzeug) {
  const karten = werkzeug === 'karten';
  quit(karten ? 'Diese Karte pflegt das Werkzeug ' + anf(wname('karten')) : 'Diese Stelle lässt sich hier nicht ändern',
    karten ? 'Gerichte, Getränke und Preise dort ändern: dann stimmen Website und PDF überein.' : '',
    karten ? [el('a', { class: 'ws-taste', href: kartenAdresse() }, wname('karten') + ' öffnen')] : [], { 'data-ws-gesperrt': werkzeug });
}

// ---------------------------------------------------------------- Die Stelle zum Ändern (Text), direkt unter ihrer Zeile
const ZT = /\d+(?:[.,:’']\d+)*/g;
function vorschlag(altDe, neuDe, altSpHtml) {
  /* Hat sich im Deutschen nur eine Zahl geändert, steht in der anderen Sprache dieselbe Zahl: Vorschlag mit der neuen Zahl. */
  const a = altDe.match(ZT) || [], b = neuDe.match(ZT) || [];
  if (!a.length || a.length !== b.length || altDe.replace(ZT, '#') !== neuDe.replace(ZT, '#') || a.every((x, i) => x === b[i])) return '';
  const kiste = el('div', { html: altSpHtml });
  const s = kiste.textContent.match(ZT) || [];
  if (s.length !== a.length || s.some((x, i) => x !== a[i])) return '';
  let i = 0;
  const gang = k => k.childNodes.forEach(c => { if (c.nodeType === 3) c.nodeValue = c.nodeValue.replace(ZT, () => b[i++]); else gang(c); });
  gang(kiste);
  return kiste.innerHTML;
}
function textFeld(html, name, opt = {}) {
  const f = el('div', { class: 'ws-text', contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true', 'aria-label': name, 'data-ws-feld': opt.id || name, 'data-zahl': opt.zahl ? '1' : null, spellcheck: 'true', lang: opt.lang || 'de', html });
  f.addEventListener('paste', ev => {   // eingefügt wird nur Text, nie fremde Gestaltung
    ev.preventDefault();
    const t = (ev.clipboardData || window.clipboardData).getData('text/plain'), s = getSelection();
    if (!s.rangeCount) return;
    const b = s.getRangeAt(0);
    b.deleteContents(); b.insertNode(document.createTextNode(t)); b.collapse(false);
    f.dispatchEvent(new Event('input', { bubbles: true }));
  });
  return f;
}
function edZu() { $$('.ws-ed').forEach(x => x.remove()); $$('[aria-pressed="true"].ws-st,[aria-pressed="true"].ws-zl__wert').forEach(x => x.setAttribute('aria-pressed', 'false')); }

async function oeffne(w, knopf, ort, opt = {}) {
  /* w: {seite, h, n, orte?}. knopf: die Zeile, zu der die Stelle gehört. ort: wohin das Formular kommt (sonst direkt unter die Zeile). */
  const lauf = ++Z.lauf;
  let d;
  try { d = await ruf('GET', X(['stelle', HAUS, w.seite, w.h, w.n].map(encodeURIComponent).join('/'))); } catch (e) { return fehler(e); }
  if (lauf !== Z.lauf) return;
  if (d.zu) return gesperrt(d.zu);
  edZu();
  Z.wahl = { art: 'text', seite: w.seite, h: w.h, n: w.n, orte: w.orte || null };
  const key = ['text', w.seite, w.h, w.n].join('|'), p = Z.offen[key];
  const orteFest = w.orte || null, viele = (orteFest || d.gleiche).length;
  let alle = p ? !!(p.orte && !orteFest) : false;
  const de = textFeld(p ? p.neu : d.wert, Z.info.sprachen.length ? 'Deutsch' : 'Text', { zahl: d.zahl && d.original_text.length < 40, id: 'de' });
  const hinweis = el('p', { class: 'ws-klein', hidden: true });
  const sp = {};
  const ed = el('div', { class: 'ws-ed', 'data-ws-form': 'text', 'data-ws-wahl': key });
  const bei = [d.ober, d.vor].filter(x => x && x !== d.abschnitt).join(' · ');
  ed.append(mono((TAGNAME[d.tag] || 'Text') + (Z.ansicht.startsWith('b:') ? '' : ' · ' + d.seite_name) + (bei ? ' · bei ' + bei : '') + (/<(em|i)\b/.test(d.original) ? ' · Kursives bleibt kursiv' : '')), de, hinweis);
  const zeile_ = el('div', { class: 'ws-ed__z' });
  const schalter = !orteFest && viele > 1 ? el('button', { class: 'ws-schalter', type: 'button', role: 'switch', 'aria-checked': alle ? 'true' : 'false', 'data-ws-alle': viele,
    onclick: () => { alle = !alle; schalter.setAttribute('aria-checked', alle ? 'true' : 'false'); merk(); } }, 'An allen ' + viele + ' Stellen ändern, wo genau dieser Text so steht') : null;
  if (orteFest) ed.append(el('p', { class: 'ws-klein', 'data-ws-orte': viele }, viele > 1 ? 'Diese Angabe steht an ' + viele + ' Stellen der Website. Alle werden zusammen geändert.' : 'Diese Angabe steht an einer Stelle.'));
  zeile_.append(...[schalter,
    d.geaendert || p ? link('Wie ursprünglich', () => { vergessen(key); if (d.geaendert) sende((orteFest || [{ seite: d.seite, n: d.n }]).map(o => ({ art: 'weg', key: ['text', o.seite, d.h, o.n].join('|') })), { titel: 'Zurückgenommen' }); else zeichne({ halten: true }); }) : null,
    !Z.ansicht.startsWith('b:') ? link('In der Seite', () => inDerSeite(d.seite, { art: 'text', seite: d.seite, h: d.h, n: d.n })) : null,
    link('Schliessen', () => { edZu(); Z.wahl = null; Z.vs.forEach(v => v.sende({ ws: 'zeige', h: '', n: -1, still: true })); })].filter(Boolean));
  ed.append(zeile_);
  if (d.geaendert && !d.nur) ed.append(el('p', { class: 'ws-vorher' }, el('b', {}, 'Ursprünglich: '), d.original_text));
  if (d.stand !== d.original && d.stand !== d.wert) ed.append(el('p', { class: 'ws-vorher' }, el('b', {}, 'Veröffentlicht: '), el('span', { html: d.stand })));

  const mitSeite = d.sprachen.filter(x => x.seite_da);
  if (mitSeite.length) {
    const kiste = el('details', { class: 'ws-sprachen', open: !!(mitSeite.some(x => x.wert) || (p && Object.values(p.sprachen || {}).some(Boolean)) || opt.sprachen) });
    const zahl = el('span', {});
    kiste.append(el('summary', {}, 'In den anderen Sprachen ', zahl));
    mitSeite.forEach(x => {
      const f = textFeld(p && p.sprachen ? (p.sprachen[x.code] || '') : x.wert, x.name, { id: x.code, lang: x.code });
      const marke = el('span', { class: 'ws-fehlt', hidden: true }, 'fehlt');
      const lage = el('p', { class: 'ws-klein' });
      sp[x.code] = { f, x, marke, lage, eigen: !!(p && p.sprachen && p.sprachen[x.code] && p.sprachen[x.code] !== x.wert) };
      f.addEventListener('input', () => { sp[x.code].eigen = true; lage.textContent = ''; merk(); });
      kiste.append(el('div', { class: 'ws-sprache' },
        el('div', { class: 'ws-sprache__kopf' }, mono(x.name), marke),
        x.da ? el('p', { class: 'ws-klein' }, 'Bisher auf der Seite: ' + anf(kurz(x.bisher, 220))) : el('p', { class: 'ws-klein' }, 'Diese Stelle hat auf der Seite dieser Sprache kein Gegenstück. Dort ändert sich nichts.'),
        x.da ? f : null, x.da ? lage : null,
        x.da ? el('div', {}, link('Bisherigen Text holen', () => { f.innerHTML = x.bisher_html; f.dispatchEvent(new Event('input', { bubbles: true })); })) : null));
    });
    kiste.append(el('p', { class: 'ws-klein' }, A('Ändern Sie den deutschen Text, steht ohne Übersetzung in jeder Sprache der neue deutsche Text. Ändern Sie nur eine Übersetzung, bleibt alles andere, wie es ist.', 'Änderst du den deutschen Text, steht ohne Übersetzung in jeder Sprache der neue deutsche Text. Änderst du nur eine Übersetzung, bleibt alles andere, wie es ist.')));
    kiste._zahl = zahl;
    ed.append(kiste);
  }
  if (d.bloecke.length) ed.append(el('div', { class: 'ws-bloecke' }, el('span', { class: 'ws-klein' }, 'Statt den Text zu ändern, etwas ganz von der Seite nehmen:'),
    d.bloecke.slice(0, 3).map(b => link((b.aus ? 'Wieder zeigen: ' : 'Ausblenden: ') + anf(kurz(b.t, 60)), () => sende([{ art: 'aus', seite: d.seite, h: b.h, n: b.n, an: !b.aus }], { titel: b.aus ? 'Wieder zu sehen' : 'Ausgeblendet' }), { 'data-ws-blk': b.h }))));

  /* Vergleichsstand so, wie der Browser ihn schreibt: nur dann zählt eine Eingabe als geändert, wenn wirklich etwas anders ist */
  const norm = h => el('div', { html: h }).innerHTML;
  const grundDe = norm(d.wert), grundSp = Object.fromEntries(mitSeite.map(x => [x.code, norm(x.wert)]));
  function lage() {   // «fehlt» je Sprache und die Zahl dazu
    const neu = klarText(de);
    Object.values(sp).forEach(s => { if (s.x.da) s.marke.hidden = !!klarText(s.f) || neu === d.original_text; });
    const fehlen = Object.values(sp).filter(s => s.x.da && !s.marke.hidden).length;
    const kiste = $('.ws-sprachen', ed);
    if (kiste) { kiste._zahl.textContent = fehlen ? '· ' + fehlen + ' fehlen' : '(' + mitSeite.length + ')'; if (fehlen || Object.values(sp).some(s => s.lage.textContent)) kiste.open = true; }
  }
  function merk(ev) {
    const neu = klarText(de);
    if (d.zahl) {   // Schreibweise des Hauses: Punkt oder Komma, wie es auf der Seite steht
      const alt = (d.original_text.match(/\d([.,])\d\d/) || [])[1], jetzt = (neu.match(/\d([.,])\d\d/) || [])[1];
      hinweis.hidden = !(alt && jetzt && alt !== jetzt);
      hinweis.textContent = 'Das Haus schreibt diese Angabe so: ' + anf(d.original_text);
    }
    if (ev && ev.target === de) Object.values(sp).forEach(s => {   // nur wenn im Deutschen getippt wird
      if (!s.x.da || s.eigen) return;
      const v = vorschlag(d.original_text, neu, s.x.bisher_html);
      if (v) { s.f.innerHTML = v; s.lage.textContent = 'Vorschlag: nur die Zahl getauscht. Bitte lesen, er wird mit gespeichert.'; }
      else if (s.lage.textContent) { s.f.innerHTML = s.x.wert; s.lage.textContent = ''; }
    });
    lage();
    const gleich = de.innerHTML === grundDe && !alle && Object.entries(sp).every(([c, s]) => !s.x.da || s.f.innerHTML === grundSp[c]);
    if (gleich) vergessen(key);
    else vormerken(key, { art: 'text', seite: d.seite, h: d.h, n: d.n, neu: de.innerHTML, orte: orteFest || (alle ? d.gleiche : null),
      sprachen: Object.fromEntries(Object.entries(sp).filter(([, s]) => s.x.da).map(([c, s]) => [c, s.f.innerHTML])) });
    if (knopf) { knopf.classList.toggle('ws-offen', !gleich); const t = $('[data-ws-zeigt]', knopf); if (t) t.textContent = neu; const s = $('small', knopf); if (s) s.textContent = s.textContent.replace(' · nicht gespeichert', '') + (gleich ? '' : ' · nicht gespeichert'); }
    if (Z.ansicht.startsWith('b:') && Z.vs[0] && Z.sprache === 'de' && Z.seite === d.seite) Z.vs[0].sende({ ws: 'tippe', h: d.h, n: d.n, html: de.innerHTML });
  }
  de.addEventListener('input', merk);
  if (ort) ort.append(ed); else if (knopf) knopf.after(ed);
  if (knopf) knopf.setAttribute('aria-pressed', 'true');
  lage();
  if (Z.ansicht.startsWith('b:') && Z.vs[0]) Z.vs[0].sende({ ws: 'zeige', h: d.h, n: d.n, still: !opt.rollen });
  if (opt.zeigen || opt.rollen) hochholen(knopf || ed, ed);
  return ed;
}
function hochholen(zeile, ed) {
  /* Robert 19.10.2026 (Bildschirmfoto): «wenn ich was anklicke zum Verändern, dass es links ein bisschen besser angezeigt wird und ein bisschen
     kurz aufleuchtet, dass ich weiss, wo ich hingucken muss. Und ein bisschen höher sitzt auch gerne in der linken Leiste.»
     Die Zeile rückt oben in die Liste (unter die Suche), Zeile und Feld leuchten einmal kurz auf (nur opacity, Schicht darüber). */
  const liste = zeile.closest('.ws-stellen'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fahrt = still ? 'auto' : 'smooth';
  if (liste && liste.scrollHeight > liste.clientHeight + 2) {
    const such = $('.ws-suche', liste), luft = (such ? such.offsetHeight : 0) + 26;
    liste.scrollTo({ top: Math.max(0, zeile.getBoundingClientRect().top - liste.getBoundingClientRect().top + liste.scrollTop - luft), behavior: fahrt });
  } else {
    const kopf = $('#ws-kopf'), luft = (kopf ? kopf.getBoundingClientRect().bottom : 0) + 24;
    window.scrollTo({ top: Math.max(0, zeile.getBoundingClientRect().top + window.scrollY - luft), behavior: fahrt });
  }
  [zeile, ed].forEach(x => { if (!x) return; x.classList.remove('ws-leuchtet'); void x.offsetWidth; x.classList.add('ws-leuchtet'); setTimeout(() => x.classList.remove('ws-leuchtet'), 1700); });
}
function inDerSeite(seite, zeige) { const b = bereichVon(seite); if (b) geh('b:' + b.key, { seite, zeige }); }

// ---------------------------------------------------------------- Foto: Fenster mit den Fotos der Website
async function bildFenster(w) {
  let d;
  try {
    d = await ruf('GET', X(['foto', HAUS, w.seite, w.b, w.n].map(encodeURIComponent).join('/')));
    if (!Z.fotos) Z.fotos = await ruf('GET', X('fotos/' + HAUS));
  } catch (e) { return fehler(e); }
  if (d.zu) return gesperrt(d.zu);
  let ziel = d.wert;
  const gross = el('img', { src: bild(d.klein), alt: d.alt });
  const alt = el('input', { type: 'text', value: d.alt, autocomplete: 'off', id: 'ws-alt', 'data-ws-feld': 'alt' });
  const sp = {};
  const fundus = el('div', { class: 'kuhle ws-fundus' });
  Z.fotos.fotos.forEach(f => fundus.append(el('button', { class: 'ws-fwahl', type: 'button', 'aria-pressed': f.b === ziel ? 'true' : 'false', title: f.alt, 'data-ws-foto': f.b, onclick: ev => {
    ziel = f.b;
    [...fundus.children].forEach(c => c.setAttribute('aria-pressed', c === ev.currentTarget ? 'true' : 'false'));
    gross.src = bild(f.klein);
    if (alt.value === d.alt || !alt.value) alt.value = f.alt;
  } }, el('span', { class: 'ws-fwahl__b' }, el('img', { src: bild(f.klein), alt: '', loading: 'lazy', decoding: 'async' })), el('span', { class: 'ws-fwahl__t' }, (f.eigen ? 'Eigenes Foto · ' : '') + kurz(f.alt || f.b, 48)))));
  let hoch = null;
  if (Z.info.hochladen) {   // eigenes Foto (Master Werkzeug-Bau 4.2 D): mindestens 900 Pixel, höchstens 25 MB, wird neu gesetzt in vier Grössen
    const datei = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', id: 'ws-hoch', class: 'ws-vh', 'data-ws-feld': 'hochladen' });
    const lage = el('span', { class: 'ws-klein', 'aria-live': 'polite' });
    datei.addEventListener('change', () => {
      const f = datei.files && datei.files[0];
      datei.value = '';
      if (!f) return;
      if (f.size > 25 * 1024 * 1024) { lage.textContent = ''; return melde('Das Foto ist grösser als 25 MB.', { mehr: 'Bitte eine kleinere Fassung wählen, zum Beispiel aus der Fotos-App «Exportieren».', stichwort: 'bild-gross', fehler: true }); }
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return melde('Diese Datei ist kein Foto.', { mehr: 'Möglich sind JPG, PNG und WebP.', stichwort: 'bild-art', fehler: true });
      lage.textContent = 'Wird übernommen …';
      const r = new FileReader();
      r.onerror = () => { lage.textContent = ''; melde('Die Datei liess sich nicht lesen.', { stichwort: 'bild-kaputt', fehler: true }); };
      r.onload = async () => {
        let a;
        try { a = await ruf('POST', X('hochladen/' + HAUS), { name: f.name, daten: r.result, alt: alt.value === d.alt ? '' : alt.value }); }
        catch (e) { lage.textContent = ''; return fehler(e); }
        try { Z.fotos = await ruf('GET', X('fotos/' + HAUS)); } catch (e) { /* die Liste kommt beim nächsten Öffnen */ }
        ziel = a.b; gross.src = bild(a.klein); lage.textContent = a.meldung;
        const neuK = el('button', { class: 'ws-fwahl', type: 'button', 'aria-pressed': 'true', title: a.alt || f.name, 'data-ws-foto': a.b, onclick: ev => {
          ziel = a.b; [...fundus.children].forEach(c => c.setAttribute('aria-pressed', c === ev.currentTarget ? 'true' : 'false')); gross.src = bild(a.klein); } },
          el('span', { class: 'ws-fwahl__b' }, el('img', { src: bild(a.klein), alt: '', decoding: 'async' })), el('span', { class: 'ws-fwahl__t' }, 'Eigenes Foto · ' + kurz(f.name, 30)));
        [...fundus.children].forEach(c => c.setAttribute('aria-pressed', 'false'));
        fundus.prepend(neuK);
      };
      r.readAsDataURL(f);
    });
    hoch = el('div', { class: 'ws-hoch' }, el('label', { class: 'ws-taste', for: 'ws-hoch' }, 'Eigenes Foto hochladen'), datei, lage);
  }
  const inhalt = el('div', { class: 'ws-form', 'data-ws-form': 'bild' },
    el('p', { class: 'ws-klein' }, d.seite_name + '. Zur Wahl stehen die Fotos der Website' + (Z.info.hochladen ? A(' und Ihre eigenen. Ein eigenes Foto braucht mindestens 900 Pixel Breite und höchstens 25 MB.', ' und deine eigenen. Ein eigenes Foto braucht mindestens 900 Pixel Breite und höchstens 25 MB.') : A('. Neue Fotos bringt Ihr Ansprechpartner ein.', '. Neue Fotos bringt dein Ansprechpartner ein.'))),
    el('div', { class: 'ws-bild-gross' }, gross), hoch, fundus,
    el('div', { class: 'feld' }, el('label', { for: 'ws-alt' }, 'Bildbeschreibung (für Vorlesegeräte und Suchmaschinen)'), alt),
    d.sprachen.filter(x => x.da).map(x => { const f = el('input', { type: 'text', value: x.wert, placeholder: x.bisher, autocomplete: 'off', lang: x.code, id: 'ws-alt-' + x.code }); sp[x.code] = f; return el('div', { class: 'feld' }, el('label', { for: 'ws-alt-' + x.code }, 'Bildbeschreibung ' + x.name), f); }));
  fenster('Foto', 'tauschen.', inhalt, [
    { text: 'Abbrechen' },
    d.geaendert ? { text: 'Wie ursprünglich', tun: zu => { zu(); sende([{ art: 'weg', key: ['bild', d.seite, d.b, d.n].join('|') }], { titel: 'Zurückgenommen' }); } } : null,
    { text: 'Speichern', haupt: true, tun: zu => { zu(); sende([{ art: 'bild', seite: d.seite, b: d.b, n: d.n, neu: ziel, alt: alt.value, alt_sprachen: Object.fromEntries(Object.entries(sp).map(([c, f]) => [c, f.value])) }]); } }], { name: 'bild' });
}

// ---------------------------------------------------------------- Übersicht
function zeichneStart() {
  const m = leere($('#ws-mitte')), i = Z.info, ae = aend(), h = new Date().getHours(), z = Z.stand.zuletzt;
  const gruss = h >= 5 && h < 11 ? 'Guten Morgen.' : h >= 11 && h < 18 ? 'Guten Tag.' : 'Guten Abend.';
  const hat = k => i.bereiche.some(b => b.key === k);
  const erster = 'b:' + i.website[0].key;
  const aeN = ae.length + eigenZahl('wartet');   // Entwurf samt eigener Ansichten (Termine)
  const AUFG = [
    ...eigen().filter(e => e.aufgabe).map(e => ['e:' + e.key, e.aufgabe[0], e.aufgabe[1]]),   // eigene Ansichten des Hauses zuerst (Master 4.2 L19)
    [erster, 'Einen Text ändern', 'Auf der Seite anklicken, daneben neu schreiben.'],
    i.zahlen ? ['zahlen', 'Preis oder Öffnungszeit', 'Alle Zeiten und Preise der Website an einem Ort.'] : null,
    i.angaben ? ['angaben', 'Telefon oder Adresse', 'Einmal ändern, auf jeder Seite richtig.'] : null,
    hat('anlaesse') ? ['haus:anlaesse', 'Anlass ausblenden', 'Was vorbei ist, von der Seite nehmen.'] : null,
    hat('packages') ? ['haus:packages', 'Angebot ausblenden', 'Abgelaufenes Angebot von der Seite nehmen.'] : null,
    [erster, 'Foto tauschen', 'Ein Foto anklicken und aus den Fotos des Hauses wählen.'],
    i.karten ? [null, 'Gericht oder Preis auf der Karte', 'Die Karten pflegt das Werkzeug ' + anf(wname('karten')) + ', mit PDF.'] : null,
    i.hinweis ? ['hinweis', 'Hinweis für Gäste', 'Ein Satz oben auf jeder Seite, mit Zeitraum.'] : null,
    i.google ? ['google', 'Google-Texte', 'Wie jede Seite bei Google erscheint.'] : null,
    hat('stellen') ? ['haus:stellen', 'Stelle besetzt', 'Stelle ausblenden oder neu beschreiben.'] : null,
    hat('zimmer') ? ['haus:zimmer', 'Zimmer nachführen', 'Name, Text, Angaben und Fotos jeder Kategorie.'] : null,
    i.sprachen.length ? ['sprachen', 'Übersetzung nachtragen', 'Was auf Deutsch geändert ist, in den anderen Sprachen.'] : null].filter(Boolean);
  const sprachen = i.sprachen.length ? ', je in ' + (i.sprachen.length + 1) + ' Sprachen' : '';
  if (WOM) {   // Übersicht mit den Bausteinen des Hauses (wo-lage, wo-aufg, wo-ber), wie in den anderen Werkzeugen
    const E = WO.esc, fotos = i.website.map(b => b.foto).filter(Boolean), ZK = { zahlen: 'uhr', hinweis: 'glocke', sprachen: 'welt', angaben: 'tel', google: 'suche' };
    m.append(titel(wname(W) + ' · ' + i.name, gruss, 'Was ändern wir heute?',
      A('Hier pflegen Sie die Website des Hauses: jeden Text, jedes Foto, jede Angabe. Alles wartet zuerst im Entwurf. Auf die Website kommt es erst, wenn Sie veröffentlichen, und jeder frühere Stand lässt sich zurückholen.', 'Hier pflegst du die Website des Hauses: jeden Text, jedes Foto, jede Angabe. Alles wartet zuerst im Entwurf. Auf die Website kommt es erst, wenn du veröffentlichst, und jeder frühere Stand lässt sich zurückholen.'),
      [i.anleitung ? el('a', { class: 'wo-kn wo-kn--gold', href: i.anleitung, target: '_blank', rel: 'noopener', 'data-ws-anleitung': '1', html: '<span>Anleitung</span><i>' + WO.ic('buch') + '</i>' }) : null,
       el('a', { class: 'wo-kn' + (i.anleitung ? '' : ' wo-kn--gold'), href: pruefLink(''), html: '<span>Prüfung</span><i>' + WO.ic('schild') + '</i>' })].filter(Boolean)));
    const rest = el('div', { class: 'ws-wo-start', html:
      `<div class="wo-lage">
        <div class="wo-lg"><i class="wo-lg__z">${WO.ic('stift')}</i><span class="wo-mk">Entwurf</span><b>${aeN ? E(mz(aeN, 'Änderung wartet', 'Änderungen warten')) : 'Nichts offen'}</b><p>${aeN ? 'Gespeichert, noch nicht auf der Website.' : A('Was Sie speichern, sammelt sich hier.', 'Was du speicherst, sammelt sich hier.')}</p>${aeN ? `<button class="wo-lk" type="button" data-gehe="${E(vglZiel())}">Ansehen und veröffentlichen</button>` : ''}</div>
        <div class="wo-lg"><i class="wo-lg__z">${WO.ic('welt')}</i><span class="wo-mk">Website</span><b>${z ? 'Veröffentlicht ' + E(tag(z.zeit)) : 'Wie gebaut'}</b><p>${E(mz(i.seiten.length, 'Seite', 'Seiten') + sprachen + '.' + (z && z.notiz ? ' Zuletzt: ' + z.notiz : ''))}</p><a class="wo-lk" href="${E(i.online + i.seiten[0].datei)}" target="_blank" rel="noopener">Website öffnen</a></div>
        ${i.karten ? `<div class="wo-lg"><i class="wo-lg__z">${WO.ic('karte')}</i><span class="wo-mk">Karten</span><b>${E(wname('karten'))}</b><p>Gerichte, Getränke und Preise. Website und PDF aus einer Quelle.</p><a class="wo-lk" href="${E(kartenAdresse())}">${E(wname('karten'))} öffnen</a></div>` : ''}
      </div>
      <h2 class="wo-zw">Häufig <em>gebraucht</em></h2>
      <div class="wo-aufg ws-aufgaben">${AUFG.map(([ziel, tt, s], n) => `${ziel ? `<button class="wo-ag ws-ag" type="button" data-gehe="${E(ziel)}">` : `<a class="wo-ag ws-ag" href="${E(kartenAdresse())}">`}<span class="wo-ag__b">${fotos.length ? `<img src="${E(bild(fotos[n % fotos.length]))}" alt="" loading="lazy" decoding="async">` : ''}</span><span class="wo-ag__t"><i class="wo-ag__z">${WO.ic(ZK[ziel] || (ziel ? 'stift' : 'karte'))}</i><b>${E(tt)}</b><span>${E(s)}</span></span>${ziel ? '</button>' : '</a>'}`).join('')}</div>
      <h2 class="wo-zw">Die Website, <em>Bereich für Bereich</em></h2>
      <div class="wo-ber ws-bereiche">${i.website.map(b => { const o = ae.filter(x => b.seiten.some(s => s.datei === x.seite)).length;
        return `<button class="wo-bk ws-bk" type="button" title="${E(b.satz)}" data-ws-bk="${E(b.key)}" data-gehe="b:${E(b.key)}"><span class="wo-bk__b">${b.foto ? `<img src="${E(bild(b.foto))}" alt="" loading="lazy" decoding="async">` : ''}</span><span class="wo-bk__t"><b>${E(b.name)}</b><small>${E(mz(b.seiten.length, 'Seite', 'Seiten'))}${o ? ' · ' + o + ' offen' : ''}</small><span>${E(b.satz)}</span></span><i class="wo-bk__p">${WO.ic('pfeil')}</i></button>`; }).join('')}</div>` });
    rest.querySelectorAll('[data-gehe]').forEach(b => b.addEventListener('click', () => geh(b.getAttribute('data-gehe'))));
    m.append(rest);
    return;
  }
  m.append(titel(wname(W) + ' · ' + i.name, gruss, 'Was ändern wir heute?',
      A('Hier pflegen Sie die Website des Hauses: jeden Text, jedes Foto, jede Angabe. Alles wartet zuerst im Entwurf. Auf die Website kommt es erst, wenn Sie veröffentlichen, und jeder frühere Stand lässt sich zurückholen.', 'Hier pflegst du die Website des Hauses: jeden Text, jedes Foto, jede Angabe. Alles wartet zuerst im Entwurf. Auf die Website kommt es erst, wenn du veröffentlichst, und jeder frühere Stand lässt sich zurückholen.'),
      [el('a', { class: 'kn kn--klein', href: pruefLink('') }, el('span', {}, 'Prüfung'), el('i', { 'aria-hidden': 'true', html: PF }))], false, i.kleid.foto),
    el('div', { class: 'ws-lage platte' },
      el('div', { class: 'ws-lg' }, mono('Entwurf'), el('b', {}, ae.length ? mz(ae.length, 'Änderung wartet', 'Änderungen warten') : 'Nichts offen'),
        el('span', {}, ae.length ? 'Gespeichert, noch nicht auf der Website.' : A('Was Sie speichern, sammelt sich hier.', 'Was du speicherst, sammelt sich hier.')), ae.length ? link('Ansehen und veröffentlichen', () => geh('entwurf')) : null),
      el('div', { class: 'ws-lg' }, mono('Website'), el('b', {}, z ? 'Veröffentlicht ' + tag(z.zeit) : 'Wie gebaut'),
        el('span', {}, mz(i.seiten.length, 'Seite', 'Seiten') + sprachen + '.' + (z && z.notiz ? ' Zuletzt: ' + z.notiz : '')), el('a', { class: 'ws-link', href: i.online + i.seiten[0].datei, target: '_blank', rel: 'noopener' }, 'Website öffnen')),
      i.karten ? el('div', { class: 'ws-lg' }, mono('Karten'), el('b', {}, wname('karten')), el('span', {}, 'Gerichte, Getränke und Preise. Website und PDF aus einer Quelle.'), el('a', { class: 'ws-link', href: kartenAdresse() }, wname('karten') + ' öffnen')) : null),
    el('h2', { class: 'ws-zw' }, 'Häufig ', el('em', {}, 'gebraucht')),
    el('div', { class: 'ws-aufgaben' }, AUFG.map(([ziel, t, s]) => el(ziel ? 'button' : 'a', ziel ? { class: 'ws-ag', type: 'button', onclick: () => geh(ziel) } : { class: 'ws-ag', href: kartenAdresse() }, el('b', {}, t), el('span', {}, s), el('em', { html: PF })))),
    el('h2', { class: 'ws-zw' }, 'Die Website, ', el('em', {}, 'Bereich für Bereich')),
    el('div', { class: 'ws-bereiche' }, i.website.map(b => {
      const offen = ae.filter(x => b.seiten.some(s => s.datei === x.seite)).length;
      return el('button', { class: 'ws-bk', type: 'button', title: b.satz, 'data-ws-bk': b.key, onclick: () => geh('b:' + b.key) },
        el('span', { class: 'ws-bk__b' }, b.foto ? el('img', { src: bild(b.foto), alt: '', loading: 'lazy', decoding: 'async' }) : null),
        offen ? el('span', { class: 'ws-bk__o' }, offen + ' offen') : null,
        el('span', { class: 'ws-bk__n' }, el('b', {}, b.name), el('small', {}, mz(b.seiten.length, 'Seite', 'Seiten')), el('i', { html: PF })));
    })));
}

// ---------------------------------------------------------------- Bereich der Website: Stellen links, Seite rechts
function stZeile(s, seite) {
  const p = Z.offen[['text', seite, s.h, s.n].join('|')];
  const text = p ? el('span', { html: p.neu }).textContent : s.neu != null ? s.neu : s.t;
  return el('button', { type: 'button', class: 'ws-st' + (s.neu != null ? ' ws-geaendert' : '') + (p ? ' ws-offen' : ''), 'data-h': s.h, 'data-n': s.n, 'aria-pressed': 'false', disabled: !!s.zu,
    onclick: ev => oeffne({ seite, h: s.h, n: s.n }, ev.currentTarget, null, { rollen: true }) },
    el('small', {}, (TAGNAME[s.tag] || 'Text') + (s.gleich > 1 ? ' · ' + s.gleich + '× auf der Seite' : '') + (s.neu != null ? (s.nur ? ' · Übersetzung geändert' : ' · geändert') : '') + (p ? ' · nicht gespeichert' : '')),
    el('span', { 'data-ws-zeigt': '1' }, text));
}
function gruppen(v) {
  const ort = $('#ws-gruppen'), seite = v.seite || Z.seite;   // die Seite dieser Liste, nicht die gerade gewählte: beim Wechseln steht die alte Liste noch kurz da (Aussen-Prüfung 23.10.2026, 404 foto/wein.html/kopf-wein)
  leere(ort);
  v.gruppen.forEach((g, gi) => {
    if (g.zu) {
      ort.append(el('details', { class: 'ws-gr ws-gr--zu', 'data-g': gi }, el('summary', {}, el('b', {}, g.titel || 'Karte'), el('small', {}, g.zu === 'karten' ? wname('karten') : 'gesperrt')),
        el('div', { class: 'ws-gr__text' }, el('p', {}, g.zu === 'karten' ? 'Gerichte, Getränke und Preise dieser Karte kommen aus dem Werkzeug ' + anf(wname('karten')) + ', zusammen mit dem PDF. Dort ändern, dann stimmt alles überein.' : 'Dieser Abschnitt lässt sich hier nicht ändern.'),
          g.zu === 'karten' ? el('a', { class: 'ws-taste', href: kartenAdresse() }, wname('karten') + ' öffnen') : null)));
      return;
    }
    const geaendert = g.stellen.some(s => s.neu != null) || g.fotos.some(f => f.neu);
    const d = el('details', { class: 'ws-gr' + (g.aus ? ' ws-ist-aus' : ''), 'data-g': gi, open: gi < 2 || geaendert || Z.gr.has(Z.seite + '|' + gi) },
      el('summary', {}, el('b', {}, g.titel || 'Abschnitt'), el('small', {}, mz(g.stellen.length, 'Text', 'Texte') + (g.fotos.length ? ' · ' + mz(g.fotos.length, 'Foto', 'Fotos') : ''))),
      g.stellen.map(s => stZeile(s, seite)),
      g.fotos.length ? el('div', { class: 'ws-fotos' }, g.fotos.map(f => el('button', { type: 'button', class: 'ws-foto' + (f.neu ? ' ws-geaendert' : ''), title: f.alt, disabled: !!f.zu, 'data-ws-foto-st': f.b + '|' + f.n, onclick: () => bildFenster({ seite, b: f.b, n: f.n }) },
        f.klein ? el('img', { src: bild(f.klein), alt: '', loading: 'lazy' }) : null))) : null,   // ohne Adresse kein <img> (sonst fragt der Browser den Ordner an)
      g.stellen.some(s => s.zu === 'karten') ? el('div', { class: 'ws-gr__fuss', 'data-ws-zu': 'karten' }, 'Die Karte in diesem Abschnitt pflegt das Werkzeug ', el('a', { class: 'ws-link', href: kartenAdresse() }, anf(wname('karten'))), '.') : null,
      g.h && !g.fest ? el('div', { class: 'ws-gr__fuss' }, link(g.aus ? 'Abschnitt wieder zeigen' : 'Ganzen Abschnitt ausblenden', () => sende([{ art: 'aus', seite, h: g.h, n: g.n, an: !g.aus }], { titel: g.aus ? 'Wieder zu sehen' : 'Ausgeblendet' }))) : null);
    d.addEventListener('toggle', () => { const k = Z.seite + '|' + gi; if (d.open) Z.gr.add(k); else Z.gr.delete(k); });
    ort.append(d);
  });
  const alt = $('.ws-ausgeblendet'); if (alt) alt.remove();
  if (v.ausgeblendet.length) ort.before(el('div', { class: 'ws-ausgeblendet' }, el('b', {}, 'Ausgeblendet auf dieser Seite'),
    v.ausgeblendet.map(a => el('div', {}, el('span', {}, kurz(a.t, 70) || 'Abschnitt'), link('Wieder zeigen', () => sende([{ art: 'aus', seite, h: a.h, n: a.n, an: false }], { titel: 'Wieder zu sehen' }))))));
}
function suche(q) {
  q = q.trim().toLowerCase();
  $$('#ws-gruppen .ws-gr').forEach(g => {
    let treffer = 0;
    $$('.ws-st', g).forEach(x => { const ja = !q || x.textContent.toLowerCase().includes(q); x.hidden = !ja; if (ja) treffer++; });
    g.hidden = !!q && !treffer;
    if (q && treffer) g.open = true;
  });
}
function zeileOeffnen(h, n) {
  const z = $(`#ws-gruppen .ws-st[data-h="${h}"][data-n="${n}"]`);
  if (!z) return;
  const such = $('#ws-such'); if (such && such.value) { such.value = ''; suche(''); }
  z.closest('details').open = true;
  oeffne({ seite: Z.seite, h, n }, z, null, { zeigen: true });
}
async function zeichneWeb(opt) {
  const b = webBereich(Z.ansicht.slice(2)) || Z.info.website[0];
  if (!b.seiten.some(s => s.datei === Z.seite)) Z.seite = b.seiten[0].datei;
  let v;
  try { v = await ruf('GET', X('seite/' + HAUS + '/' + encodeURIComponent(Z.seite))); } catch (e) { return fehler(e); }
  if (!opt.gilt()) return;
  const key = [b.key, Z.seite].join('|'), m = $('#ws-mitte');
  if (opt.halten && m.getAttribute('data-ws-web') === key && $('#ws-gruppen') && Z.vs[0]) {   // nach dem Speichern: Liste erneuern, die Seite bleibt an ihrer Stelle stehen
    const liste = $('.ws-stellen'), oben = liste.scrollTop, w = Z.wahl;
    gruppen(v);
    suche($('#ws-such').value);
    liste.scrollTop = oben;
    if (opt.neuLaden) await Z.vs[0].lade(true);
    if (w && w.art === 'text' && w.seite === Z.seite) { const z = $(`#ws-gruppen .ws-st[data-h="${w.h}"][data-n="${w.n}"]`); if (z) await oeffne(w, z, null, {}); }
    return;
  }
  m.setAttribute('data-ws-web', key);
  const name = el('span', { class: 'ws-mono' }, v.name);
  const vs = vorschau('entwurf', Z.seite, Z.sprache, el('div', { class: 'ws-vorschau__k' }, name,
    schmal() ? null : wahl2([{ wert: 'rechner', text: 'Rechner' }, { wert: 'handy', text: 'Handy' }], Z.breite, x => { Z.breite = x; vs.passe(); }, 'Breite der Vorschau'),
    Z.info.sprachen.length ? auswahl([{ wert: 'de', text: 'Deutsch' }].concat(Z.info.sprachen.map(s => ({ wert: s.code, text: s.name }))), Z.sprache, x => { Z.sprache = x; vs.sprache = x; vs.lade(true); }, 'Sprache der Vorschau', true) : null,
    el('a', { href: Z.info.online + Z.seite, target: '_blank', rel: 'noopener' }, 'Gross öffnen')));
  Z.vs = [vs];
  const [a1, a2] = zweiteilig(b.name);
  const reiter = b.seiten.length > 1 ? el('div', { class: 'ws-reiter' },
    b.seiten.length > 5 ? auswahl(b.seiten.map(s => ({ wert: s.datei, text: s.name })), Z.seite, s => geh(Z.ansicht, { seite: s }), 'Seite') :
      wahl2(b.seiten.map(s => ({ wert: s.datei, text: s.name })), Z.seite, s => geh(Z.ansicht, { seite: s }), 'Seite'),
    el('span', { class: 'ws-leise' }, b.seiten.length + ' Seiten')) : null;
  leere(m).append(titel('Bereich · ' + b.name, a1, a2, (b.satz ? b.satz + ' ' : '') + A('Klicken Sie in der Seite auf einen Text oder ein Foto, oder wählen Sie ', 'Klick in der Seite auf einen Text oder ein Foto, oder wähl ') + (schmal() ? 'darunter' : 'links') + '.',
      v.gruppen.some(g => g.zu === 'karten') ? [el('a', { class: 'kn kn--klein', href: kartenAdresse() }, el('span', {}, wname('karten') + ' öffnen'), el('i', { 'aria-hidden': 'true', html: PF }))] : null, true),
    reiter || '',   // ein Bereich mit nur einer Seite hat keine Reiter (append(null) schriebe «null» in die Ansicht)
    el('div', { class: 'ws-arbeit' },
      el('div', { class: 'platte ws-stellen' },
        el('label', { class: 'ws-suche' }, el('span', { html: LUPE }), el('input', { type: 'text', id: 'ws-such', placeholder: 'Text auf dieser Seite suchen', autocomplete: 'off', 'aria-label': 'Text auf dieser Seite suchen', oninput: ev => suche(ev.target.value) })),
        el('div', { id: 'ws-gruppen' })),
      vs.k));
  gruppen(v);
  if (Z.wahl && Z.wahl.seite === Z.seite) {
    const w = Z.wahl;
    vs.nach = () => { if (w.art === 'bild') bildFenster(w); else zeileOeffnen(w.h, w.n); };
  }
}

// ---------------------------------------------------------------- Zeiten und Preise
const ZART = { preise: /CHF|Fr\.|€|\bEUR\b/, zeiten: /\d{1,2}[.:]\d{2}|\bUhr\b/ };
function zArt(t) { return ZART.preise.test(t) ? 'preise' : ZART.zeiten.test(t) ? 'zeiten' : 'masse'; }
async function zeichneZahlen(opt) {
  const m = $('#ws-mitte');
  let d;
  try { d = await ruf('GET', X('zahlen/' + HAUS)); } catch (e) { return fehler(e); }
  if (!opt.gilt()) return;
  const oben = window.scrollY;
  const ort = el('div', {});
  const such = el('input', { type: 'text', value: Z.filter, placeholder: 'zum Beispiel Frühstück, CHF, Sauna', autocomplete: 'off', id: 'ws-suche', 'aria-label': 'In Zeiten und Preisen suchen' });
  leere(m).append(titel('Für alle Seiten', 'Zeiten', '& Preise.', A('Jede Stelle der Website mit einem Preis, einer Uhrzeit, einer Dauer oder einer Grösse, gelesen aus den Seiten. Steht dieselbe Angabe auf mehreren Seiten, ändern Sie sie hier einmal. ', 'Jede Stelle der Website mit einem Preis, einer Uhrzeit, einer Dauer oder einer Grösse, gelesen aus den Seiten. Steht dieselbe Angabe auf mehreren Seiten, änderst du sie hier einmal. ') + d.zahl + ' Angaben.'),
    el('div', { class: 'ws-mitte-reihe' },
      wahl2([{ wert: 'alle', text: 'Alle' }, { wert: 'preise', text: 'Preise' }, { wert: 'zeiten', text: 'Zeiten' }, { wert: 'masse', text: 'Grössen und Dauer' }], Z.zArt, x => { Z.zArt = x; baue(); }, 'Art der Angabe'),
      el('label', { class: 'ws-suche', style: 'margin:0;width:min(320px,100%)' }, el('span', { html: LUPE }), such)), ort);
  function baue() {
    leere(ort);
    const f = Z.filter.toLowerCase();
    let n = 0;
    d.gruppen.forEach(g => {
      const zz = g.zeilen.filter(z => (Z.zArt === 'alle' || zArt(z.t) === Z.zArt) && (!f || (z.t + ' ' + z.vor + ' ' + z.ober + ' ' + z.abschnitt + ' ' + (z.neu || '')).toLowerCase().includes(f)));
      if (!zz.length) return;
      const karte = el('section', { class: 'platte ws-karte' }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, g.name), mono(mz(zz.length, 'Stelle', 'Stellen'))));
      zz.forEach(z => {
        n++;
        const w = { seite: z.orte[0].seite, h: z.h, n: z.orte[0].n, orte: z.orte };
        const p = Z.offen[['text', w.seite, w.h, w.n].join('|')];
        const etikett = [z.fest ? '' : kurz(z.abschnitt, 46), z.ober, z.vor, z.orte.length > 1 ? z.orte.length + ' Stellen' : '', z.neu || z.teils ? 'geändert' : ''].filter(Boolean).join(' · ');
        const reihe = el('div', { class: 'ws-zl', 'data-ws-zahl': z.h, 'data-ws-orte': z.orte.length, 'data-ws-ort': w.seite + '|' + w.n });
        const wert = el('button', { class: 'ws-zl__wert', type: 'button', 'aria-pressed': 'false', onclick: () => oeffne(w, wert, reihe) }, el('span', { 'data-ws-zeigt': '1' }, p ? el('span', { html: p.neu }).textContent : z.neu || z.t));
        reihe.append(mono(etikett), wert, link('In der Seite', () => inDerSeite(w.seite, { art: 'text', seite: w.seite, h: w.h, n: w.n })));
        karte.append(reihe);
      });
      ort.append(karte);
    });
    if (!n) ort.append(el('p', { class: 'kuhle ws-leer' }, 'Nichts gefunden.'));
  }
  such.addEventListener('input', () => { Z.filter = such.value; baue(); });
  baue();
  if (opt.halten) window.scrollTo(0, oben);
  const w = Z.wahl;
  if (opt.halten && w && w.art === 'text' && w.orte) {
    const treffer = $(`.ws-zl[data-ws-zahl="${w.h}"][data-ws-ort="${w.seite}|${w.n}"]`, ort);
    if (treffer) await oeffne(w, $('.ws-zl__wert', treffer), treffer);
  }
}

// ---------------------------------------------------------------- Angaben des Hauses (Telefon, E-Mail, Adresse, Links): einmal ändern, überall richtig
const ANG_PRUEF = {
  telefon: v => /^\+?[\d ]{8,20}$/.test(v) ? '' : 'Eine Telefonnummer besteht nur aus Ziffern und Leerzeichen, vorne höchstens ein «+».',
  mail: v => /^[^@\s<>"]+@[^@\s<>"]+\.[a-z]{2,}$/i.test(v) ? '' : 'Eine E-Mail-Adresse sieht so aus: name@haus.ch',
  link: v => /^https:\/\/[^\s"<>]+$/.test(v) ? '' : 'Eine Adresse beginnt mit https://',
  text: v => v ? '' : 'Eine Angabe ohne Wert bleibt als Lücke auf der Website stehen.' };
async function zeichneAngaben(opt) {
  const m = $('#ws-mitte');
  let d;
  try { d = await ruf('GET', X('angaben/' + HAUS)); } catch (e) { return fehler(e); }
  if (!opt.gilt()) return;
  const karte = el('section', { class: 'platte ws-karte ws-form ws-ang', 'data-ws-form': 'angaben' });
  d.angaben.forEach(a => {
    const key = 'angabe|' + a.key, p = Z.offen[key];
    const f = el('input', { type: a.art === 'mail' ? 'email' : a.art === 'telefon' ? 'tel' : a.art === 'link' ? 'url' : 'text', id: 'ws-ang-' + a.key, value: p ? p.neu : a.wert,
      autocomplete: 'off', spellcheck: 'false', 'data-ws-angabe': a.key });
    const lage = el('p', { class: 'ws-klein ws-ang__lage' }, (a.art === 'link' ? 'Ziel von ' + mz(a.links, 'Link', 'Links') : 'Steht ' + a.stellen + '×' + (a.links ? ' und als ' + mz(a.links, 'Link', 'Links') : '')) + ' auf ' + mz(a.seiten, 'Seite', 'Seiten') + '.' + (a.geaendert ? ' Ursprünglich: ' + anf(a.original) + '.' : ''));
    const warn = el('p', { class: 'ws-ang__warn', role: 'alert', hidden: true });
    f.addEventListener('input', () => {
      const v = f.value.trim(), w = (ANG_PRUEF[a.art] || ANG_PRUEF.text)(v);
      warn.hidden = !w || !v && a.art !== 'text'; warn.textContent = w;
      f.setAttribute('aria-invalid', w ? 'true' : 'false');
      if (v === a.wert) vergessen(key); else vormerken(key, { art: 'angabe', key: a.key, neu: v });
    });
    const zurueck = a.geaendert ? link('Wie ursprünglich: ' + anf(a.original), () => { f.value = a.original; f.dispatchEvent(new Event('input', { bubbles: true })); }, { 'data-ws-ang-zurueck': a.key }) : null;
    karte.append(el('div', { class: 'ws-ang__zeile feld' }, el('label', { for: f.id }, a.label), f, warn, lage, zurueck,
      a.beispiel.length ? el('details', { class: 'ws-ang__wo' }, el('summary', {}, 'Wo genau?'), a.beispiel.map(b => el('p', { class: 'ws-klein' }, b.name + ': ' + anf(b.t)))) : null));
  });
  leere(m).append(titel('Für alle Seiten', 'Angaben', 'des Hauses.', A('Telefon, E-Mail, Adresse, Öffnungstage und die wichtigsten Links. Was Sie hier ändern, ändert sich an jeder Stelle der Website, an der es steht, auch in den Links zum Anrufen.', 'Telefon, E-Mail, Adresse, Öffnungstage und die wichtigsten Links. Was du hier änderst, ändert sich an jeder Stelle der Website, an der es steht, auch in den Links zum Anrufen.')), karte);
}

// ---------------------------------------------------------------- Google-Texte: Titel und Beschreibung je Seite, mit Vorschau wie in der Trefferliste
async function zeichneGoogle(opt) {
  const m = $('#ws-mitte');
  let d;
  try { d = await ruf('GET', X('google/' + HAUS)); } catch (e) { return fehler(e); }
  if (!opt.gilt()) return;
  const RT = d.richtwert.titel, RB = d.richtwert.beschreibung;
  const liste = el('div', { class: 'ws-gt' });
  d.seiten.forEach(g => {
    const key = 'seo|' + g.seite, p = Z.offen[key];
    const t = el('input', { type: 'text', id: 'ws-gt-t-' + g.seite, value: p ? p.titel : g.titel, autocomplete: 'off', 'data-ws-gt': 'titel' });
    const b = el('textarea', { id: 'ws-gt-b-' + g.seite, rows: 3, 'data-ws-gt': 'beschreibung', disabled: !g.hat_beschreibung });
    b.value = p ? p.beschreibung : g.beschreibung;
    const zt = el('span', { class: 'ws-gt__zahl' }), zb = el('span', { class: 'ws-gt__zahl' });
    const vt = el('b', { class: 'ws-gt__vt' }), vb = el('span', { class: 'ws-gt__vb' });
    const zaehle = () => {
      zt.textContent = t.value.length + ' / ' + RT; zt.classList.toggle('ws-gt__zahl--lang', t.value.length > RT);
      zb.textContent = b.value.length + ' / ' + RB; zb.classList.toggle('ws-gt__zahl--lang', b.value.length > RB);
      vt.textContent = kurz(t.value || g.original_titel, RT + 1); vb.textContent = kurz(b.value, RB + 1);
    };
    const merk = () => {
      zaehle();
      if (t.value.trim() === g.titel && b.value.trim() === g.beschreibung) vergessen(key);
      else vormerken(key, { art: 'seo', seite: g.seite, titel: t.value, beschreibung: b.value });
    };
    t.addEventListener('input', merk); b.addEventListener('input', merk);
    zaehle();
    liste.append(el('section', { class: 'platte ws-karte ws-gt__karte', 'data-ws-seo': g.seite },
      el('div', { class: 'ws-gt__kopf' }, g.foto ? el('span', { class: 'ws-gt__bild' }, el('img', { src: bild(g.foto), alt: '', decoding: 'async' })) : null,
        el('div', {}, el('h2', {}, g.name), mono(g.seite + (g.geaendert ? ' · geändert' : '')))),
      el('div', { class: 'ws-gt__vorschau', 'aria-label': 'So erscheint die Seite bei Google' }, el('span', { class: 'ws-gt__adr' }, Z.info.name + ' › ' + g.seite), vt, vb),
      el('div', { class: 'feld' }, el('label', { for: t.id }, 'Titel ', zt), t),
      el('div', { class: 'feld' }, el('label', { for: b.id }, 'Beschreibung ', zb), g.hat_beschreibung ? b : el('p', { class: 'ws-klein' }, 'Diese Seite hat keine Beschreibung für Google.'))));
  });
  leere(m).append(titel('Für alle Seiten', 'Google-Texte', 'je Seite.', 'So erscheint jede Seite in der Trefferliste von Google: der Titel als Zeile zum Anklicken, die Beschreibung darunter. Etwa ' + RT + ' Zeichen Titel und ' + RB + ' Zeichen Beschreibung zeigt Google ganz, längere Texte schneidet es ab.'), liste);
}

// ---------------------------------------------------------------- Das Haus: Zimmer, Säle, Packages … (Felder aus der Beschreibung)
function edLink(t, e, knopf, ort) {
  edZu();
  const key = ['link', e.seite, t.h, t.n].join('|'), p = Z.offen[key];
  const f = el('input', { type: 'text', value: p ? p.neu : t.wert, autocomplete: 'off', inputmode: 'url', id: 'ws-link', 'data-ws-feld': 'link' });
  f.addEventListener('input', () => { if (f.value.trim() === t.wert) vergessen(key); else vormerken(key, { art: 'link', seite: e.seite, h: t.h, n: t.n, neu: f.value.trim() }); });
  ort.append(el('div', { class: 'ws-ed', 'data-ws-form': 'link' }, mono('Link · ' + (kurz(t.t, 50) || e.seite_name)),
    el('div', { class: 'feld' }, el('label', { for: 'ws-link' }, 'Wohin der Link führt'), f),
    el('p', { class: 'ws-klein' }, 'Eine Adresse beginnt mit https://, mailto: oder tel:, oder sie nennt eine Seite oder ein PDF der Website.'),
    t.neu ? el('p', { class: 'ws-vorher' }, el('b', {}, 'Ursprünglich: '), t.original) : null,
    el('div', { class: 'ws-ed__z' }, [t.neu ? link('Wie ursprünglich', () => sende([{ art: 'weg', key }], { titel: 'Zurückgenommen' })) : null, link('Schliessen', edZu)].filter(Boolean))));
  knopf.setAttribute('aria-pressed', 'true');
}
/* Jeder Eintrag einer Liste zeigt sein Bild (Robert 19.10.2026: «in allen Tools Bilder dazu»): das erste Foto des Eintrags von der Website,
   ohne Foto ein ruhiges Feld mit den Anfangsbuchstaben, nie ein fremdes oder erfundenes Bild. Darunter die zweite Angabe (Datum, Aufgabe). */
function kopfBild(e) {
  const f = e.felder.find(x => (x.art === 'bild' || x.art === 'bilder') && x.teile.length && x.teile[0].klein);
  if (f) return el('span', { class: 'ws-eintrag__b' }, el('img', { src: bild(f.teile[0].klein), alt: '', decoding: 'async' }));
  if (e.bild_ersatz) return el('span', { class: 'ws-eintrag__b', title: 'Foto derselben Person von einer anderen Seite der Website' }, el('img', { src: bild(e.bild_ersatz), alt: '', decoding: 'async' }));
  const k = (e.titel || '').split(/\s+/).filter(w => /^[A-ZÄÖÜ0-9]/.test(w)).slice(0, 2).map(w => w[0]).join('');
  return el('span', { class: 'ws-eintrag__b ws-eintrag__b--ohne', title: 'Auf der Website steht hier kein Foto' }, k || '·');
}
function unterZeile(e) {
  const f = e.felder.filter(x => x.art !== 'bild' && x.art !== 'bilder' && x.art !== 'link' && x.teile[0] && x.teile[0].t && x.teile[0].t !== e.titel)[0];
  return f ? kurz(f.teile[0].t, 80) : '';
}
async function zeichneHaus(opt) {
  const m = $('#ws-mitte'), key = Z.ansicht.slice(5);
  let d;
  try { d = await ruf('GET', X('bereich/' + HAUS + '/' + encodeURIComponent(key))); } catch (e) { return fehler(e); }
  if (!opt.gilt()) return;
  const oben = window.scrollY;
  const [a1, a2] = zweiteilig(d.name);
  leere(m).append(titel('Das Haus · ' + d.name, a1, a2, d.satz + ' Alles hier ist aus den Seiten gelesen: ' + mz(d.eintraege.length, 'Eintrag', 'Einträge') + '.', null, true));
  if (d.fehlt.length) m.append(el('p', { class: 'platte ws-karte' }, 'Nicht jedes Feld liess sich auf den Seiten finden: ' + d.fehlt.slice(0, 3).join('; ') + '. ', el('a', { class: 'ws-link', href: pruefLink('bereich-feld') }, 'Was tun?')));
  /* Freistehende Bildkarten, Text darunter (Robert 20.10.2026). Reihen gleichmässig verteilt, keine Karte allein, keine Reihe mit grosser Lücke
     («wenn das nur so paar sind, dann mach 3 oben und 2 unten»): höchstens vier je Reihe, so viele Reihen wie nötig, dann gleich viele je Reihe, die letzte mittig */
  const n = d.eintraege.length, reihen = Math.ceil(n / 4) || 1;
  const raster = el('div', { class: 'ws-eintraege', style: '--ws-pro:' + Math.ceil(n / reihen) });
  if (d.eintraege.length) m.append(raster);
  d.eintraege.forEach((e, i) => {
    const id = key + ':' + i;
    const innen = el('div', { class: 'ws-eintrag__innen' });
    e.felder.forEach(f => {
      if (f.art === 'bild' || f.art === 'bilder') {
        innen.append(el('div', { style: 'padding-top:12px' }, mono(f.label)), el('div', { class: 'ws-fotos' }, f.teile.map(t => el('button', { class: 'ws-foto' + (t.neu ? ' ws-geaendert' : ''), type: 'button', disabled: !!t.zu, title: t.alt, onclick: () => bildFenster({ seite: e.seite, b: t.b, n: t.n }) },
          el('img', { src: bild(t.klein), alt: t.alt, loading: 'lazy' })))));
        return;
      }
      f.teile.forEach((t, ti) => {
        const reihe = el('div', { class: 'ws-zl' });
        const p = Z.offen[[f.art === 'link' ? 'link' : 'text', e.seite, t.h, t.n].join('|')];
        const wert = el('button', { class: 'ws-zl__wert', type: 'button', disabled: !!t.zu, 'aria-pressed': 'false', 'data-ws-teil': t.h,
          onclick: () => (f.art === 'link' ? edLink(t, e, wert, reihe) : oeffne({ seite: e.seite, h: t.h, n: t.n }, wert, reihe)) },
          el('span', { 'data-ws-zeigt': '1' }, f.art === 'link' ? (p ? p.neu : t.wert) : (p ? el('span', { html: p.neu }).textContent : t.t)));
        reihe.append(mono(f.label + (f.teile.length > 1 ? ' ' + (ti + 1) : '') + (t.neu ? ' · geändert' : '')), wert);
        innen.append(reihe);
      });
    });
    const erste = (e.felder.find(f => f.teile[0] && f.teile[0].h && f.art !== 'link') || { teile: [] }).teile[0];
    innen.append(el('div', { class: 'ws-reihe', style: 'padding-top:14px' },
      erste ? taste('In der Seite zeigen', () => inDerSeite(e.seite, { art: 'text', seite: e.seite, h: erste.h, n: erste.n })) : null,
      e.blk ? taste(e.aus ? 'Wieder zeigen' : 'Ausblenden', () => sende([{ art: 'aus', seite: e.seite, h: e.blk.h, n: e.blk.n, an: !e.aus }], { titel: e.aus ? 'Wieder zu sehen' : 'Ausgeblendet' })) : null));
    const karte = el('details', { class: 'platte ws-eintrag', open: Z.auf.has(id), 'data-ws-eintrag': i },
      el('summary', {}, kopfBild(e), el('span', { class: 'ws-eintrag__t' }, mono((unterZeile(e) || e.seite_name) + (e.aus ? ' · ausgeblendet' : '')), el('b', {}, e.titel || 'Eintrag ' + (i + 1)),
        el('span', { class: 'ws-eintrag__auf' }, 'Ändern'))), innen);
    karte.addEventListener('toggle', () => { if (karte.open) Z.auf.add(id); else Z.auf.delete(id); });
    raster.append(karte);
  });
  if (!d.eintraege.length) m.append(el('p', { class: 'kuhle ws-leer' }, 'Auf den Seiten steht dazu nichts.'));
  if (opt.halten) window.scrollTo(0, oben);
}

// ---------------------------------------------------------------- Hinweis für Gäste
function datumZeigen(iso) { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ''); return m ? `${m[3]}.${m[2]}.${m[1]}` : (iso || ''); }
function zeichneHinweis() {
  const m = leere($('#ws-mitte')), h = (Z.offen.hinweis ? Object.assign({}, Z.offen.hinweis, { von: Z.offen.hinweis.von, bis: Z.offen.hinweis.bis }) : null) || Z.stand.daten.hinweis || {};
  const grund = Z.stand.daten.hinweis || {};
  let an = !!h.an;
  const feld = (id, name, wert, opt = {}) => {
    const f = opt.lang_ ? el('textarea', { id, rows: 3 }) : el('input', { type: 'text', id, autocomplete: 'off', placeholder: opt.platz || null, inputmode: opt.modus || null, lang: opt.lang || null });
    f.value = wert || '';
    f.addEventListener('input', merk);
    return { f, k: el('div', { class: 'feld' }, el('label', { for: id }, name), f) };
  };
  const text = feld('ws-h-text', 'Der Hinweis (ein, zwei Sätze)', h.text, { lang_: true });
  const von = feld('ws-h-von', 'Zu sehen ab (leer: ab sofort)', datumZeigen(h.von), { platz: 'TT.MM.JJJJ', modus: 'numeric' });
  const bis = feld('ws-h-bis', A('Zu sehen bis (leer: bis Sie ihn ausschalten)', 'Zu sehen bis (leer: bis du ihn ausschaltest)'), datumZeigen(h.bis), { platz: 'TT.MM.JJJJ', modus: 'numeric' });
  const lnk = feld('ws-h-link', 'Link dazu (kann leer bleiben)', h.link, { platz: 'https://… oder seite.html', modus: 'url' });
  const linktext = feld('ws-h-linktext', 'Beschriftung des Links', h.linktext, { platz: 'Mehr erfahren' });
  const sp = Z.info.sprachen.map(s => {
    const alt = (h.sprachen || {})[s.code] || {};
    return { s, text: feld('ws-h-text-' + s.code, 'Hinweis ' + s.name, alt.text, { lang_: true, lang: s.code }), linktext: feld('ws-h-lt-' + s.code, 'Beschriftung des Links ' + s.name, alt.linktext, { lang: s.code }) };
  });
  const sammle = () => ({ art: 'hinweis', an, text: text.f.value, von: von.f.value, bis: bis.f.value, link: lnk.f.value, linktext: linktext.f.value,
                          sprachen: Object.fromEntries(sp.map(x => [x.s.code, { text: x.text.f.value, linktext: x.linktext.f.value }])) });
  const vergleich = o => JSON.stringify([!!o.an, o.text || '', datumZeigen(o.von), datumZeigen(o.bis), o.link || '', o.linktext || '', Z.info.sprachen.map(s => [((o.sprachen || {})[s.code] || {}).text || '', ((o.sprachen || {})[s.code] || {}).linktext || ''])]);
  function merk() { const o = sammle(); if (vergleich(o) === vergleich(grund)) vergessen('hinweis'); else vormerken('hinweis', o); }
  m.append(titel('Für alle Seiten', 'Hinweis', 'für Gäste.', 'Ein Satz oben auf jeder Seite' + (Z.info.sprachen.length ? ', in allen Sprachen' : '') + ': Betriebsferien, ein geschlossener Bereich, ein besonderer Abend. Mit Zeitraum erscheint und verschwindet er von selbst.'),
    el('div', { class: 'platte ws-karte ws-form', style: 'max-width:760px', 'data-ws-form': 'hinweis' },
      el('div', { class: 'feld' }, el('span', {}, 'Der Hinweis ist'), wahl2([{ wert: 'an', text: 'Eingeschaltet' }, { wert: 'aus', text: 'Ausgeschaltet' }], an ? 'an' : 'aus', x => { an = x === 'an'; merk(); }, 'Hinweis ein oder aus', true)),
      text.k, el('div', { class: 'ws-zwei-werte' }, von.k, bis.k), el('div', { class: 'ws-zwei-werte' }, lnk.k, linktext.k),
      sp.length ? el('p', { class: 'ws-klein' }, 'Ohne Übersetzung steht in einer Sprache der deutsche Hinweis.') : null,
      sp.map(x => el('div', { class: 'ws-sprachen' }, mono(x.s.name), x.text.k, x.linktext.k))));
}

// ---------------------------------------------------------------- Sprachen
async function zeichneSprachen(opt) {
  const m = $('#ws-mitte');
  let d;
  try { d = await ruf('GET', X('sprachen/' + HAUS)); } catch (e) { return fehler(e); }
  if (!opt.gilt()) return;
  leere(m).append(titel('Für alle Seiten', '', 'Sprachen.', 'Die Website steht in Deutsch, ' + d.sprachen.map(s => s.name).join(', ') + A('. Ein Text, den Sie auf Deutsch ändern, steht in den anderen Sprachen deutsch, bis er hier übersetzt ist. Nichts wird geraten.', '. Ein Text, den du auf Deutsch änderst, steht in den anderen Sprachen deutsch, bis er hier übersetzt ist. Nichts wird geraten.')),
    el('div', { class: 'ws-mitte-reihe' }, wahl2([{ wert: 'alle', text: 'Alle Änderungen' }, { wert: 'fehlt', text: 'Nur was fehlt' }], Z.spFilter, x => { Z.spFilter = x; zeichne({}); }, 'Welche Änderungen')));
  const zeilen = d.zeilen.filter(z => Z.spFilter === 'alle' || (!z.nur && Object.values(z.sp).some(x => x.da && !x.wert)));
  if (!zeilen.length) m.append(el('p', { class: 'kuhle ws-leer' }, d.zeilen.length ? 'Keine Übersetzung fehlt.' : 'Im Entwurf liegt kein geänderter Text.'));
  zeilen.forEach(z => {
    const karte = el('section', { class: 'platte ws-karte', 'data-ws-sp': z.key },
      el('div', { class: 'ws-karte__kopf' }, el('b', {}, z.art === 'hinweis' ? 'Hinweis für Gäste' : z.nur ? 'Übersetzung' : 'Text'), mono(z.wo)), werte(z),
      d.sprachen.map(s => {
        const x = z.sp[s.code];
        return el('div', { class: 'ws-sp-zeile' }, mono(s.name),
          !x.da ? el('span', { class: 'ws-klein' }, 'Kein Gegenstück auf der Seite dieser Sprache.') :
          x.wert ? el('span', {}, x.wert) : z.nur ? el('span', { class: 'ws-klein' }, 'bleibt: ' + anf(kurz(x.bisher, 140))) :
          el('span', {}, el('span', { class: 'ws-fehlt' }, 'fehlt'), x.bisher ? ' bisher: ' + anf(kurz(x.bisher, 140)) : ''));
      }));
    const fuss = el('div', { class: 'ws-reihe', style: 'padding-top:12px' });
    fuss.append(z.art === 'hinweis' ? taste('Übersetzen', () => geh('hinweis')) : taste('Übersetzen', () => oeffne({ seite: z.seite, h: z.h, n: z.n }, null, karte, { sprachen: true, zeigen: true })));
    karte.append(fuss);
    m.append(karte);
  });
}

// ---------------------------------------------------------------- Entwurf: jede Änderung, darunter Seite für Seite vorher und nachher
function werte(a) {
  const b = adr => el('img', { src: bild(adr), alt: '', loading: 'lazy' });
  return el('div', { class: 'ws-zwei-werte' },
    el('div', {}, mono('Vorher'), el('div', { class: 'ws-wert', 'data-ws-vorher': '1' }, a.vorher_bild ? b(a.vorher_bild) : (a.vorher || '(nichts)'))),
    el('div', {}, mono('Nachher'), el('div', { class: 'ws-wert ws-wert--neu', 'data-ws-nachher': '1' }, a.nachher_bild ? b(a.nachher_bild) : (a.nachher || '(nichts)'))));
}
async function beispielEntwurf(m) {
  /* In der Vorführung nie leer (Master Werkzeug-Bau R20/M27): drei Stellen der Website, wie sie heute dort stehen, als beschriftetes Beispiel.
     Nur Ansicht, nichts davon liegt im Entwurf. «Nachher» ist kein erfundener Wert, sondern der Platz für die neue Angabe. */
  const ort = el('div', { class: 'ws-beispiele', 'data-ws-beispiel': 'entwurf' });
  m.append(el('p', { class: 'ws-satz ws-beispiel-satz' }, A('So steht eine Änderung hier, sobald Sie etwas speichern. Die Werte unter «Vorher» stehen heute auf der Website.', 'So steht eine Änderung hier, sobald du etwas speicherst. Die Werte unter «Vorher» stehen heute auf der Website.')), ort);
  let z;
  try { z = await ruf('GET', X('zahlen/' + HAUS)); } catch (e) { return; }
  if (Z.ansicht !== 'entwurf' || !ort.isConnected) return;
  const zeilen = [].concat(...(z.gruppen || []).map(g => g.zeilen || [])).filter(x => x.t && !x.zu).slice(0, 3);
  zeilen.forEach(x => ort.append(el('section', { class: 'platte ws-karte ws-karte--beispiel' },
    el('div', { class: 'ws-karte__kopf' }, el('b', {}, (x.vor || x.abschnitt || 'Angabe')), mono('Beispiel · ' + (x.orte && x.orte.length > 1 ? mz(x.orte.length, 'Seite', 'Seiten') : x.seite_name || ''))),
    werte({ vorher: x.t, nachher: A('Ihre neue Angabe', 'deine neue Angabe') }))));
}
function zeichneEntwurf() {
  const m = leere($('#ws-mitte')), ae = aend(), ew = eigen().filter(e => e.wartet && e.wartet()), nA = ae.length + eigenZahl('wartet');
  Z.vs = [];
  m.append(titel('Entwurf', 'Vorher,', 'nachher.', nA ? mz(nA, 'Änderung wartet', 'Änderungen warten') + '. Jede einzeln zurücknehmen, unten Seite für Seite vergleichen, dann veröffentlichen.' : 'Der Entwurf ist gleich wie die Website.',
    nA ? [kn('Veröffentlichen', veroeffentlichen, 'kn--klein ws-kn-metall', { disabled: !!offenZahl() }), ae.length ? taste('Entwurf verwerfen', verwerfen) : null].filter(Boolean) : null, true));
  ew.forEach(e => m.append(el('section', { class: 'platte ws-karte', 'data-ws-eigen-entwurf': e.key },   // eigene Ansichten (Termine): was wartet, Vergleich und Zurücknehmen in ihrer Ansicht
    el('div', { class: 'ws-karte__kopf' }, el('b', {}, e.name), mono(mz(e.wartet(), 'Änderung', 'Änderungen'))),
    el('div', { class: 'ws-liste-klein' }, (e.zeilen ? e.zeilen() : []).map(t => el('p', {}, t))),
    el('div', { class: 'ws-reihe', style: 'padding-top:12px' }, taste('Vorher, nachher ansehen', () => geh('e:' + e.key))))));
  if (!ae.length) return ew.length ? null : beispielEntwurf(m);
  ae.forEach(a => {
    const fehlt = Object.entries(a.sprachen || {}).filter(([, ok]) => !ok).map(([c]) => c.toUpperCase());
    m.append(el('section', { class: 'platte ws-karte', 'data-ws-aenderung': a.key },
      el('div', { class: 'ws-karte__kopf' }, el('b', {}, a.was), mono(a.wo)), werte(a),
      fehlt.length ? el('p', { class: 'ws-klein', style: 'padding-top:10px' }, el('span', { class: 'ws-fehlt' }, 'Übersetzung fehlt'), ' ' + fehlt.join(', ') + ': dort steht der deutsche Text.') : null,
      el('div', { class: 'ws-reihe', style: 'padding-top:12px' },
        a.art === 'hinweis' ? taste('Zeigen', () => geh('hinweis')) : a.seite ? taste('In der Seite', () => inDerSeite(a.seite, a.art === 'text' ? { art: 'text', seite: a.seite, h: a.h, n: a.n } : a.art === 'bild' ? { art: 'bild', seite: a.seite, b: a.b, n: a.n } : null)) : null,
        taste('Zurücknehmen', () => sende([{ art: 'weg', key: a.key }], { titel: 'Zurückgenommen' })))));
  });
  // Seite für Seite
  const mit = new Set(ae.filter(a => a.seite).map(a => a.seite));
  if (!mit.size) mit.add(Z.info.seiten[0].datei);
  if (!mit.has(Z.vgl.seite)) Z.vgl.seite = [...mit][0];
  const hier = ae.filter(a => a.seite === Z.vgl.seite || !a.seite);
  const vor = vorschau('vorher', Z.vgl.seite, Z.vgl.sprache), nach = vorschau('nachher', Z.vgl.seite, Z.vgl.sprache);
  Z.vs = [vor, nach];
  const spVor = el('div', { 'data-ws-spalte': 'vorher' }, el('span', { class: 'ws-mono ws-leise' }, 'Vorher · veröffentlicht'), vor.k);
  const spNach = el('div', { 'data-ws-spalte': 'nachher' }, el('span', { class: 'ws-mono ws-leise' }, 'Nachher · Entwurf'), nach.k);
  const zeigeSicht = () => { if (schmal()) { spVor.hidden = Z.vgl.sicht !== 'vorher'; spNach.hidden = Z.vgl.sicht !== 'nachher'; requestAnimationFrame(() => Z.vs.forEach(v => v.passe())); } };
  const zeigeAenderung = (a, knopf) => {
    $$('[data-ws-vgl][aria-pressed="true"]').forEach(x => x.setAttribute('aria-pressed', 'false'));
    if (knopf) knopf.setAttribute('aria-pressed', 'true');
    const d = a.art === 'bild' ? { b: a.b, n: a.n } : a.art === 'aus' ? { blk: a.h, n: a.n } : { h: a.h, n: a.n };
    Z.vs.forEach(v => v.sende(Object.assign({ ws: 'zeige', key: a.key }, d)));
  };
  const alleSeiten = Z.info.seiten.filter(s => mit.has(s.datei));
  m.append(el('h2', { class: 'ws-zw', id: 'ws-vergleich' }, 'Seite für Seite ', el('em', {}, 'vergleichen')),
    el('div', { class: 'ws-reiter', style: 'margin-top:0' },
      auswahl(alleSeiten.map(s => ({ wert: s.datei, text: s.name, zusatz: String(ae.filter(a => a.seite === s.datei).length) })), Z.vgl.seite, x => { Z.vgl.seite = x; zeichne({ halten: true }); }, 'Seite'),
      Z.info.sprachen.length ? auswahl([{ wert: 'de', text: 'Deutsch' }].concat(Z.info.sprachen.map(s => ({ wert: s.code, text: s.name }))), Z.vgl.sprache, x => { Z.vgl.sprache = x; Z.vs.forEach(v => { v.sprache = x; v.lade(true); }); }, 'Sprache der Vorschau', true) : null,
      schmal() ? wahl2([{ wert: 'vorher', text: 'Vorher' }, { wert: 'nachher', text: 'Nachher' }], Z.vgl.sicht, x => { Z.vgl.sicht = x; zeigeSicht(); }, 'Vorher oder nachher') : null,
      el('span', { class: 'ws-leise', 'data-ws-vgl-zahl': hier.length }, mz(hier.length, 'Änderung', 'Änderungen') + ' auf dieser Seite, umrandet')),
    el('div', { class: 'platte ws-karte', style: 'padding-top:10px;padding-bottom:10px', 'data-ws-vgl-liste': '1' }, hier.map(a => {
      const reihe = el('div', { class: 'ws-zl', style: 'grid-template-columns:minmax(0,1fr)' });
      const knopf = el('button', { class: 'ws-zl__wert', type: 'button', 'aria-pressed': 'false', 'data-ws-vgl': a.key, onclick: () => zeigeAenderung(a, knopf) }, (kurz(a.vorher, 80) || '(nichts)') + '  →  ' + (kurz(a.nachher, 80) || '(nichts)'));
      reihe.append(mono(a.was + (a.seite ? '' : ' · alle Seiten')), knopf);
      return reihe;
    })),
    el('div', { class: 'ws-zwei' }, spVor, spNach));
  zeigeSicht();
  const erste = () => { if (hier.length && vor.bereit && nach.bereit) zeigeAenderung(hier[0], $('[data-ws-vgl]')); };
  vor.nach = erste; nach.nach = erste;
}
function verwerfen() {
  fenster('Den ganzen Entwurf', 'verwerfen?', el('p', {}, mz(aend().length, 'Änderung geht', 'Änderungen gehen') + ' verloren. Die veröffentlichte Website bleibt, wie sie ist.'), [
    { text: 'Abbrechen' },
    { text: 'Ja, verwerfen', haupt: true, tun: async zu => {
      zu();
      try { await ruf('DELETE', '/api/entwurf/' + HAUS + '/' + W, { wer: wer() }); } catch (e) { return fehler(e); }
      Z.offen = {};
      await ladeStand(); melde('Der Entwurf ist verworfen', { mehr: 'Die Website steht, wie sie veröffentlicht ist.' }); zeichne({});
    } }], { name: 'verwerfen' });
}

// ---------------------------------------------------------------- Veröffentlichen
function veroeffentlichen() {
  const s = Z.stand, ae = aend(), ew = eigen().filter(e => e.wartet && e.wartet()), nE = eigenZahl('wartet');
  if (offenZahl()) { melde('Erst speichern', { mehr: 'Eingaben, die noch nicht gespeichert sind, kommen sonst nicht mit.' }); return; }
  if (!ae.length && !ew.length) { melde('Nichts geändert, nichts veröffentlicht.'); return; }
  const notiz = el('input', { type: 'text', id: 'ws-notiz', autocomplete: 'off', maxlength: '200', placeholder: 'zum Beispiel: Winterzeiten' });
  const seiten_ = new Set(ae.map(a => a.seite).filter(Boolean));
  const inhalt = el('div', { class: 'ws-form' },
    el('p', {}, mz(ae.length + nE, 'Änderung geht', 'Änderungen gehen') + ' auf die Website' + (seiten_.size ? ', betroffen ' + mz(seiten_.size, 'Seite', 'Seiten') : '') + (Z.info.sprachen.length ? ', in allen Sprachen' : '') + '.'),
    ew.length ? el('div', { class: 'ws-liste-klein', 'data-ws-eigen': ew.map(e => e.key).join(' ') }, ew.flatMap(e => (e.zeilen ? e.zeilen() : []).slice(0, 5).map(t => el('p', {}, e.name + ': ' + t)))) : null,
    el('div', { class: 'ws-liste-klein' }, ae.slice(0, 5).map(a => el('p', {}, a.wo + ': ' + anf(kurz(a.vorher, 60) || 'nichts') + ' wird ' + anf(kurz(a.nachher, 60) || 'nichts'))),
      ae.length > 5 ? el('p', { class: 'ws-klein' }, '+ ' + (ae.length - 5) + ' weitere, siehe «Entwurf & Vergleich»') : null),
    s.fehlt ? el('p', { 'data-ws-fehlt-hinweis': s.fehlt }, el('span', { class: 'ws-fehlt' }, 'Übersetzung fehlt'), ' ' + mz(s.fehlt, 'Übersetzung fehlt', 'Übersetzungen fehlen') + '. Dort steht nach dem Veröffentlichen der deutsche Text.') : null,
    el('div', { class: 'feld' }, el('label', { for: 'ws-notiz' }, 'Notiz für die früheren Fassungen (kann leer bleiben)'), notiz),
    el('p', { class: 'ws-klein' }, 'Der heutige Stand wird aufgehoben und lässt sich jederzeit zurückholen.'));
  fenster('Auf die Website', 'bringen.', inhalt, [
    { text: 'Abbrechen' },
    s.fehlt ? { text: 'Erst übersetzen', tun: zu => { zu(); geh('sprachen'); } } : null,
    { text: 'Jetzt veröffentlichen', haupt: true, tun: async zu => {
      let a = { stand: Z.stand, aenderungen: 0, geschrieben: [], online: Z.info.online };
      if (ae.length) try { a = await ruf('POST', X('veroeffentlichen/' + HAUS), { erwartet: s.kennung, wer: wer(), notiz: notiz.value }); } catch (e) {
        zu();
        if (e.status === 409 && e.stichwort === 'konflikt') { await ladeStand(); melde('Der Entwurf wurde inzwischen von anderer Seite geändert', { mehr: 'Bitte «Vorher, nachher» noch einmal ansehen, dann veröffentlichen.', stichwort: 'konflikt' }); return zeichne({}); }
        return fehler(e);
      }
      let nEig = 0;
      for (const e of ew) { try { nEig += await e.veroeffentlichen(notiz.value); } catch (x) { zu(); Z.stand = a.stand; allesNeu(); return fehler(x); } }
      zu();
      Z.stand = a.stand; allesNeu();
      quit('Ist online', mz(a.aenderungen + nEig, 'Änderung ist', 'Änderungen sind') + ' auf der Website' + (a.geschrieben.length ? ', ' + mz(a.geschrieben.length, 'Datei', 'Dateien') + ' neu geschrieben' : '') + '. Der vorige Stand ist aufgehoben.', [
        el('a', { class: 'ws-taste', href: a.online + (Z.seite || Z.info.seiten[0].datei), target: '_blank', rel: 'noopener' }, 'Website ansehen'), taste('Frühere Fassungen', () => geh('verlauf'))], { 'data-ws-veroeffentlicht': a.geschrieben.length });
      if (Z.ansicht === 'entwurf') geh('verlauf'); else zeichne({ halten: true, neuLaden: true });
    } }], { name: 'veroeffentlichen' });
}

// ---------------------------------------------------------------- Frühere Fassungen
const VERMERK = { grundstand: 'Erster Stand eingelesen', entwurf: 'Im Entwurf gespeichert', verworfen: 'Entwurf verworfen', veroeffentlicht: 'Veröffentlicht', zurueckgeholt: 'Frühere Fassung als Entwurf geholt', 'aus-sicherung': 'Stand aus der Sicherung geholt' };
async function zeichneVerlauf(opt) {
  const m = $('#ws-mitte');
  let d;
  try { d = await ruf('GET', X('verlauf/' + HAUS)); } catch (e) { return fehler(e); }
  if (!opt.gilt()) return;
  const name = el('input', { type: 'text', id: 'ws-wer', value: wer(), autocomplete: 'off', maxlength: '60', placeholder: 'zum Beispiel: Empfang' });
  name.addEventListener('change', () => { try { localStorage.setItem('ws-wer', name.value.trim()); } catch (e) { /* ohne Merken */ } melde(A('Ihr Name steht ab jetzt im Protokoll.', 'Dein Name steht ab jetzt im Protokoll.')); });
  leere(m).append(titel('Entwurf', 'Frühere', 'Fassungen.', A('Jede Veröffentlichung wird aufgehoben. Eine frühere Fassung kommt zuerst in den Entwurf: Sie sehen vorher und nachher und veröffentlichen dann.', 'Jede Veröffentlichung wird aufgehoben. Eine frühere Fassung kommt zuerst in den Entwurf: Du siehst vorher und nachher und veröffentlichst dann.')));
  if (!d.verlauf.length) m.append(el('p', { class: 'kuhle ws-leer' }, 'Noch wurde nichts veröffentlicht. Der erste Stand ist die Website, wie sie gebaut wurde.'),
    el('section', { class: 'platte ws-karte ws-karte--beispiel', 'data-ws-beispiel': 'verlauf' },   // R20/M27: beschriftetes Beispiel statt Leere, ohne Datum und ohne Zahl, die es nicht gibt
      el('div', { class: 'ws-karte__kopf' }, el('b', {}, 'Stand bis …'), mono('Beispiel · so steht eine frühere Fassung hier')),
      el('p', {}, A('Nach jedem Veröffentlichen liegt der vorige Stand hier: mit Datum, wer ihn abgelöst hat, wie viele Stellen sich unterscheiden, und Ihrer Notiz.', 'Nach jedem Veröffentlichen liegt der vorige Stand hier: mit Datum, wer ihn abgelöst hat, wie viele Stellen sich unterscheiden, und deiner Notiz.')),
      el('div', { class: 'ws-reihe', style: 'padding-top:12px' }, taste('Unterschiede ansehen', null, { disabled: true }), taste('Zurückholen', null, { disabled: true }))));
  d.verlauf.forEach(v => {
    const ort = el('div', { hidden: true, class: 'ws-liste-klein', style: 'padding-top:8px' });
    m.append(el('section', { class: 'platte ws-karte', 'data-ws-fassung': v.fassung },
      el('div', { class: 'ws-karte__kopf' }, el('b', {}, v.ursprung ? 'Ursprünglicher Stand' : 'Stand bis ' + zeit(v.abgeloest)), mono((v.ursprung ? 'die Website, wie sie gebaut ist · ' : '') + (v.wer ? 'abgelöst von ' + v.wer + ' · ' : '') + mz(v.unterschiede, 'Unterschied', 'Unterschiede') + ' zu heute')),
      v.notiz ? el('p', {}, 'Notiz der Ablösung: ' + v.notiz) : null, ort,
      el('div', { class: 'ws-reihe', style: 'padding-top:12px' },
        taste('Unterschiede ansehen', async () => {
          if (!ort.hidden) { ort.hidden = true; return; }
          let f;
          try { f = await ruf('GET', X('fassung/' + HAUS + '/' + v.fassung)); } catch (e) { return fehler(e); }
          leere(ort);
          if (!f.aenderungen.length) ort.append(el('p', {}, 'Dieser Stand ist gleich wie der heutige.'));
          f.aenderungen.forEach(a => ort.append(el('p', {}, a.wo + ' · ' + a.was + ': heute ' + anf(kurz(a.vorher, 90) || 'nichts') + ', damals ' + anf(kurz(a.nachher, 90) || 'nichts'))));
          ort.hidden = false;
        }),
        taste('Zurückholen', () => zurueckholen(v)))));
  });
  const prot = el('div', { class: 'ws-liste-klein', 'data-ws-protokoll': '1' });
  d.protokoll.forEach(p => prot.append(el('p', {}, zeit(p.zeit) + ' · ' + (VERMERK[p.was] || p.was) + (p.wer ? ' · ' + p.wer : '') + (p.notiz ? ' · ' + p.notiz : ''))));
  m.append(el('section', { class: 'platte ws-karte' }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Protokoll'), mono('wer, wann, was')),
    fn('team_wer') ? null : el('div', { class: 'feld', style: 'max-width:420px;margin:10px 0 14px' }, el('label', { for: 'ws-wer' }, A('Ihr Name im Protokoll', 'Dein Name im Protokoll')), name), prot));
}
function zurueckholen(v) {
  const a = aend().length;
  fenster('Diesen Stand', 'zurückholen?', el('div', { class: 'ws-form' },
    el('p', {}, 'Der Stand bis ' + zeit(v.abgeloest) + A(' wird als Entwurf angelegt. Online ändert sich noch nichts: Sie sehen ihn zuerst unter «Vorher, nachher» und veröffentlichen dann.', ' wird als Entwurf angelegt. Online ändert sich noch nichts: Du siehst ihn zuerst unter «Vorher, nachher» und veröffentlichst dann.')),
    a ? el('p', { 'data-ws-ersetzt': '1' }, A('Achtung: Ihr offener Entwurf mit ', 'Achtung: Dein offener Entwurf mit ') + mz(a, 'Änderung', 'Änderungen') + ' wird dabei ersetzt.') : null), [
    { text: 'Abbrechen' },
    { text: 'Als Entwurf holen', haupt: true, tun: async zu => {
      zu();
      try { await ruf('POST', '/api/zurueckholen/' + HAUS + '/' + W, { fassung: v.fassung, wer: wer() }); } catch (e) { return fehler(e); }
      Z.offen = {};
      await ladeStand();
      if (!Z.stand.offen) { melde('Dieser Stand ist gleich wie der heutige', { mehr: 'Es gibt nichts zu veröffentlichen.' }); return zeichne({}); }
      melde('Der frühere Stand liegt als Entwurf bereit', { mehr: 'Online ist er erst nach dem Veröffentlichen.' });
      geh('entwurf');
    } }], { name: 'zurueckholen' });
}

// ---------------------------------------------------------------- Zeichnen und Start
function eigenHilfe(opt) {   // was eine eigene Ansicht vom Werkzeug braucht: Bausteine, Meldungen, Fenster, Leiste und Rand neu zeichnen
  return { el, titel, mono, kn, taste, link, mz, kurz, anf, zeit, melde, fehler, quit, fenster, auswahl, wahl2, wer, geh, opt, neu: allesNeu, leiste, wom: WOM, haus: HAUS, info: Z.info, ansicht: () => Z.ansicht };
}
async function zeichne(opt = {}) {
  /* Jede Ansicht holt erst ihre Daten und zeichnet dann. Wer inzwischen weitergegangen ist, darf nicht mehr zeichnen:
     opt.gilt() sagt jeder Ansicht nach dem Holen, ob sie noch die aktuelle ist. */
  const lauf = ++Z.zl, a = Z.ansicht, m = $('#ws-mitte');
  opt = Object.assign({}, opt, { gilt: () => lauf === Z.zl });
  m.removeAttribute('data-ws-bereit');
  m.setAttribute('data-ws-ansicht', a);
  if (!a.startsWith('b:')) { m.removeAttribute('data-ws-web'); if (a !== 'entwurf') Z.vs = []; }
  try {
    if (a === 'start') zeichneStart();
    else if (a.startsWith('b:')) await zeichneWeb(opt);
    else if (a === 'zahlen') await zeichneZahlen(opt);
    else if (a === 'angaben') await zeichneAngaben(opt);
    else if (a === 'google') await zeichneGoogle(opt);
    else if (a.startsWith('haus:')) await zeichneHaus(opt);
    else if (a.startsWith('e:') && EIGEN[a.slice(2)]) await EIGEN[a.slice(2)].zeichne(leere(m), eigenHilfe(opt));
    else if (a === 'hinweis') zeichneHinweis();
    else if (a === 'sprachen') await zeichneSprachen(opt);
    else if (a === 'entwurf') zeichneEntwurf();
    else if (a === 'verlauf') await zeichneVerlauf(opt);
  } catch (e) { fehler(e); }   // ein Fehler beim Zeichnen steht auf der Seite, nie nur in der Konsole
  if (opt.gilt()) m.setAttribute('data-ws-bereit', a);
}
function startFehler(e) {
  const text = (e && e.fehler) || (e && e.message) || String(e);
  merke('Start: ' + text, e && e.stichwort);
  $('#ws-rand').hidden = true;
  if ($('#ws-ansicht-name')) $('#ws-ansicht-name').textContent = 'Startet nicht';
  if (WOM) $('#ws-kopf').innerHTML = WO.kopf({ werkzeug: W, unter: 'Website', titel: 'Startet nicht', stand: 'Prüfung öffnen', pruefung: pruefLink(e && e.stichwort), website: '/' });   // R04: Tür im Kopf des Hauses
  leere($('#ws-leiste')).append(el('div', { class: 'ws-leiste__t' }, el('b', {}, el('span', {}, 'Das Werkzeug startet nicht')), el('span', {}, 'Nichts ist verloren: Entwurf und veröffentlichter Stand liegen auf dem Server.')),
    el('button', { class: 'kn ws-speichern', id: 'ws-speichern', type: 'button', disabled: true }, el('span', {}, 'Speichern'), el('i', { 'aria-hidden': 'true', html: PF })));
  leere($('#ws-mitte')).append(el('div', { class: 'platte ws-karte ws-form', style: 'max-width:640px;margin-top:40px', 'data-ws-startfehler': (e && e.stichwort) || 'unerwartet' },
    mono('Das Werkzeug startet nicht'), el('h2', {}, text),
    el('p', {}, 'Die Prüfung läuft unabhängig vom Werkzeug und sagt, woran es liegt.'),
    el('div', { class: 'ws-reihe' }, el('a', { class: 'kn kn--d kn--klein', href: pruefLink(e && e.stichwort) }, el('span', {}, 'Prüfung öffnen'), el('i', { 'aria-hidden': 'true', html: PF })), taste('Noch einmal versuchen', () => location.reload()))));
  if (WOM) return;   // der Rahmen des Hauses ordnet Raum und Leiste selbst
  $('#ws-mitte').style.paddingLeft = 'clamp(22px,2.6vw,46px)';
  $('#ws-leiste').style.left = 'clamp(22px,2.6vw,46px)';
}
async function start() {
  window.addEventListener('beforeunload', ev => { if (offenZahl()) { ev.preventDefault(); ev.returnValue = ''; } });
  window.addEventListener('error', ev => merke(ev.message || 'Fehler im Werkzeug', 'unerwartet'));
  window.addEventListener('unhandledrejection', ev => merke((ev.reason && (ev.reason.fehler || ev.reason.message)) || 'Fehler im Werkzeug', (ev.reason && ev.reason.stichwort) || 'unerwartet'));
  document.addEventListener('keydown', ev => { if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 's' && Z.info) { ev.preventDefault(); speichern(); } });
  if ($('#ws-marke')) $('#ws-marke').addEventListener('click', () => { if (Z.info) geh('start'); });
  if (!HAUS) return startFehler({ stichwort: 'haus-unbekannt', fehler: A('In der Adresse fehlt das Haus: sie endet auf ?haus= und die Kennung Ihres Hauses.', 'In der Adresse fehlt das Haus: sie endet auf ?haus= und die Kennung deines Hauses.') });
  try {
    Z.info = await ruf('GET', X('haus/' + HAUS));
    Z.info.basis = Z.info.online.replace(/online\/$/, 'grundlage/');
    await stilLaden();
    await Promise.all(eigen().map(e => e.bereit && e.bereit().catch(x => merke('Eigene Ansicht ' + e.key + ': ' + ((x && x.fehler) || x), x && x.stichwort))));   // Daten der eigenen Ansichten vor dem ersten Zeichnen (Leiste und Rand zählen sie mit)
    kleid();
    Welt.bei(() => { if (!Z.stand) return;   /* Weltwechsel vor dem ersten Stand (unter Last, Demo-Check Schäfli 21.10.2026): gezeichnet wird nach ladeStand ohnehin */ kleid(); allesNeu(); Z.vs.forEach(v => v.farben()); if (!$('.ws-ed') && !$('#ws-fenster').childElementCount) zeichne({ halten: true }); });
    await ladeStand();
    const q = new URLSearchParams(location.search);
    let a = q.get('ansicht');
    if (!a && !q.get('seite')) {   // dort weitermachen, wo man zuletzt war
      try { const o = JSON.parse(localStorage.getItem('ws-ort-' + HAUS) || 'null'); if (o && ansichtName(o.a)) { a = o.a; if (Z.info.seiten.some(s => s.datei === o.s)) Z.seite = o.s; } } catch (e) { /* ohne Merken */ }
    }
    if (a && (ansichtName(a) || a === 'start')) Z.ansicht = a;
    if (q.get('seite') && Z.info.seiten.some(s => s.datei === q.get('seite'))) { Z.seite = q.get('seite'); const b = bereichVon(Z.seite); if (b && !a) Z.ansicht = 'b:' + b.key; }
    allesNeu();
    await zeichne({});
  } catch (e) { startFehler(e); }
}
start();
})();
