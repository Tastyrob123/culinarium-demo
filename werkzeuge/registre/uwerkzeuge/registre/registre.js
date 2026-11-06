/* Das Besucherbuch (Le Registre) · Culinarium Hannover (Tasty Studios 28.10.2026, Werkzeug 6). Das Haus sieht, wer seine Website besucht:
   woher (Land, Ort), wann (Tag, Uhrzeit, Wochentag), was (Seiten, Zeit je Seite), wie es sich entwickelt (Verlauf) und ob ein Besuch
   weiterführt (Platz gebucht, auf die Warteliste gesetzt, Anruf in der Bar, Instagram, weiter zur Bar oder zu Dirty Chicken, Route).
   Nie ein Name, keine Adresse der Verbindung, kein Cookie.
   Kopie von Das Besucherbuch der Taverne zum Schäfli (Bau und Demo-Check 21.10.2026), dieses nach Schlössli, Gasterntal, Doldenhorn und Carlton-Europe; Funktion und
   Bedienung wie Le Registre des Grand Beau-Rivage; Kleid von Culinarium (Nacht, Schiefer, Warmweiss, Kerzenlicht; Fraunces mit weichen Enden, das «C» der Wortmarke).
   Eigener Zähl-Schlüssel und eigener Speicher, nie gemeinsam mit einem anderen Haus (Werkzeug-Master 3, Robert 17.10.2026).
   Server-Teil: registre.py über /api/registre (lokal server.py). Ohne Server-Teil liest das Werkzeug beispiel/<tage>.json und schiebt die Tage auf heute.
   Vorführ-Betrieb (Master, Lernprotokoll 14.10.2026): der Kunde sieht nur Beispielwerte, überall als Beispiel beschriftet, kein Knopf zu den echten.
   Echte Werte nur mit ?k=<Schlüssel>. Geht das Haus in Betrieb: VORFUEHRUNG = false hier, in anschluss.py und online/registre.py. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
const ZVB = '-0.5 -0.5 39.3 41.36';   /* das «C» der Wortmarke (oberflaeche/kleid/culinarium-zeichen.svg, aus dem nachgezogenen Vektor der Website) */
const ZT = `<svg class="zt" viewBox="${ZVB}" aria-hidden="true"><use href="#zeichen"/></svg>`;
const SYM = {
  buch: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.2c2-.8 3.8-.6 5.5.6 1.7-1.2 3.5-1.4 5.5-.6v9.6c-2-.8-3.8-.6-5.5.6-1.7-1.2-3.5-1.4-5.5-.6z"/><path d="M8 3.8v9.6"/></svg>',
  haus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 7.2 8 2.8l5.5 4.4V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5z"/><path d="M6.5 13.5v-4h3v4"/></svg>',
  neu: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.8v2.8h-2.8"/></svg>',
  auge: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.8 8S4 3.8 8 3.8 14.2 8 14.2 8 12 12.2 8 12.2 1.8 8 1.8 8z"/><circle cx="8" cy="8" r="1.9"/></svg>',
  augezu: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.8 8S4 3.8 8 3.8 14.2 8 14.2 8 12 12.2 8 12.2 1.8 8 1.8 8z"/><path d="M3 13 13 3"/></svg>',
  hoch: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10V2.5M2.8 5.6 6 2.4l3.2 3.2"/></svg>',
  laden: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.8 7.6 8 10.8l3.2-3.2M3 13.5h10"/></svg>',
  runter: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2v7.5M2.8 6.4 6 9.6l3.2-3.2"/></svg>' };
const SPRACHE = { de: 'Deutsch', en: 'Englisch', fr: 'Französisch', it: 'Italienisch', nl: 'Niederländisch', es: 'Spanisch', pt: 'Portugiesisch', zh: 'Chinesisch', ja: 'Japanisch', ko: 'Koreanisch', ar: 'Arabisch', xx: 'Andere Sprache' };
const GERAET = { handy: 'Handy', tablet: 'Tablet', rechner: 'Rechner' };
const EREIGNIS = { fenster: '«Platz buchen» geöffnet', buchung: 'Platz gebucht', booking: 'Auf die Warteliste gesetzt', tisch: 'Warteliste begonnen', anfrage: 'Warteliste im Fuss', anruf: 'Bar angerufen', mail: 'Instagram von Culinarium', chat: 'Weiter zur Bar oder zu Dirty Chicken', route: 'Route geöffnet' };
/* Schlüssel wie in allen Häusern (registre.py EREIGNISSE): fenster = «Platz buchen» an einem Termin auf «Der Abend» geöffnet, buchung = Platz gebucht,
   booking = auf die Warteliste gesetzt, tisch = Warteliste im Ticket begonnen, anfrage = Warteliste im Fuss einer Seite abgeschickt, anruf = Telefon der Bar,
   mail = Instagram von Culinarium oder vom Team, chat = weiter zur Bar Walk on the Wild Side oder zu Dirty Chicken, route = Route auf «Der Weg» */
const REIHE = ['fenster', 'buchung', 'booking', 'tisch', 'anfrage', 'anruf', 'mail', 'chat', 'route'];
const GOLD_E = ['buchung', 'booking', 'anruf'];
const ZUR_BUCHUNG = ['buchung', 'booking'];   /* «zum Platz»: Platz gebucht oder auf die Warteliste gesetzt (wie registre.py ZUR_BUCHUNG) */
const BEREICHE = [
  ['start', 'Übersicht', ''], ['', 'Die Gäste'], ['besuche', 'Besuche', 'heute'], ['herkunft', 'Herkunft', ''], ['zeit', 'Zeit', ''],
  ['', 'Die Website'], ['seiten', 'Seiten', ''], ['verlauf', 'Verlauf', ''], ['buchung', 'Zum Platz', ''], ['', 'Gut zu wissen'], ['zaehlung', 'So wird gezählt', '']];
const TITEL = Object.fromEntries(BEREICHE.filter(x => x[0]).map(x => [x[0], x[1]]));
/* Stadt und Region Hannover (die 21 Städte und Gemeinden der Region Hannover, soweit sie unter den Orten vorkommen können) für «Aus Hannover und Region» */
const HANNOVER = ['Hannover', 'Langenhagen', 'Garbsen', 'Laatzen', 'Seelze', 'Isernhagen', 'Lehrte', 'Hemmingen', 'Ronnenberg', 'Wunstorf', 'Burgdorf', 'Neustadt am Rübenberge', 'Barsinghausen', 'Springe', 'Gehrden', 'Pattensen', 'Sehnde', 'Uetze', 'Burgwedel', 'Wedemark', 'Wennigsen'];
const WTAG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
/* Die Stube (La Maison): lokal liegt sie neben dem Besucherbuch (_werkzeuge/maison/), online unter /maison/ (wie im Doldenhorn; Andock-Datei der Stube: statik → maison) */
/* Lokal immer auf ihrem eigenen Server (127.0.0.1, Port aus dem Kleid), nie auf dem Port des Besucherbuchs: dort fehlen ihre Stand-Wege (Fehlerbuch 10a, Schlössli/Schäfli 21.10.2026) */
const MAISON = /\/_werkzeuge\/registre\//.test(location.pathname)
  ? (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && window.WO_HAUS && WO_HAUS.ports ? 'http://127.0.0.1:' + WO_HAUS.ports.zentrale + '/culinarium-demo/_werkzeuge/maison/' : '../maison/') : '../../maison/';
const MERK = 'culinarium-nicht-zaehlen';   /* dieselbe Marke liest messung.js auf der Website (gleiche Adresse vorausgesetzt) */
const VORFUEHRUNG = true;
const SCHL = (location.search.match(/[?&]k=([\w-]+)/) || [])[1] || '';
const ECHT_DA = !VORFUEHRUNG || !!SCHL;
const S = { d: null, namen: {}, bilder: {}, ansicht: 'start', tage: 30, beispiel: !ECHT_DA || /[?&]beispiel=1/.test(location.search), wahl: 0, filter: 'alle', zeige: 40, ablage: false, raster: 'besuche' };

/* ---------- Helfer ---------- */
const n = x => Number(x || 0).toLocaleString('de-DE');
const mal = (z, eins, viele) => z === 1 ? eins : n(z) + ' ' + viele;
let LAND; try { LAND = new Intl.DisplayNames(['de-DE'], { type: 'region' }); } catch (e) { LAND = null; }
const LAND_EIGEN = { GB: 'Großbritannien', US: 'USA', NL: 'Niederlande', KR: 'Südkorea', AE: 'Vereinigte Arabische Emirate' };
function land(code) { if (!code || code === '??') return ''; if (LAND_EIGEN[code]) return LAND_EIGEN[code]; try { return (LAND && LAND.of(code)) || code; } catch (e) { return code; } }
function ort(b) { const l = land(b.l); return b.o ? (l ? b.o + ', ' + l : b.o) : (l || 'Ort nicht bekannt'); }
function seite(datei) { return S.namen[datei] || String(datei).replace(/\.html$/, ''); }
/* Bild je Seite (Fehlerbuch 10a, Robert 19.10.2026: jede Liste zeigt zu jedem Eintrag sein Bild): erstes eigenes Foto der Seite, kleine Fassung (seiten-bilder.json aus registre.py seiten) */
function sbild(datei) { const b = S.bilder[datei]; return b ? `<img class="sbild" src="/${esc(b)}" alt="" width="56" height="42" loading="lazy" decoding="async">` : '<i class="sbild sbild--leer" aria-hidden="true"></i>'; }
/* Tor 30.10.2026: ein kurzer Weg liess die Besuchskarte zur Hälfte leer. Die freie Höhe zeigt die Seite, auf der der Gast ankam; bei einem langen Weg bleibt dafür kein Platz und das Bild entfällt. */
const buehne = b => { const s = b.weg && b.weg[0] && S.bilder[b.weg[0].s]; return s ? `<figure class="besuch__buehne" aria-hidden="true"><img src="/${esc(s)}" alt="" loading="lazy" decoding="async"></figure>` : ''; };
/* Tor 30.10.2026: die letzten zwei Wörter bleiben zusammen («Frankfurt am Main, Deutschland» liess «Deutschland» allein stehen) */
const zusammen = t => { const w = esc(t).split(' '); return w.length < 3 ? w.join(' ') : w.slice(0, -2).join(' ') + ' <span style="white-space:nowrap">' + w.slice(-2).join(' ') + '</span>'; };
const mitBild = datei => `<span class="mit-bild">${sbild(datei)}<span>${esc(seite(datei))}</span></span>`;
function dauer(sek, kurz) {
  if (sek == null) return '–';
  if (sek < 60) return sek + (kurz ? ' Sek.' : (sek === 1 ? ' Sekunde' : ' Sekunden'));
  const m = Math.floor(sek / 60), s = sek % 60;
  if (kurz || m < 10) return m + ' Min.' + (s ? ' ' + s + ' Sek.' : '');
  return m + ' Minuten';
}
function tagWort(iso, lang) {
  const d = new Date(iso + 'T12:00:00'), h = new Date(S.d.bis + 'T12:00:00'), diff = Math.round((h - d) / 864e5);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Gestern';
  return d.toLocaleDateString('de-DE', lang ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: '2-digit', month: '2-digit' });
}
const datum = iso => { const t = String(iso || '').split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : ''; };
const kurzDatum = iso => iso.slice(8) + '.' + iso.slice(5, 7) + '.';
function nicht() { try { return localStorage.getItem(MERK) === '1'; } catch (e) { return false; } }
function prozent(x, stellen = 1) { return Number(x).toLocaleString('de-DE', { maximumFractionDigits: stellen }) + '&nbsp;%'; }
function quit(titel, text, fehl = false, zeit = 5000) {
  const q = document.createElement('div');
  q.className = 'quit' + (fehl ? ' fehl' : '');
  q.innerHTML = `<div><b>${esc(titel)}</b>${text ? `<span>${esc(text)}</span>` : ''}</div>`;
  const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Schliessen'); x.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg>'; x.onclick = () => q.remove(); q.appendChild(x);
  $('#meldung').appendChild(q);
  while ($('#meldung').children.length > 3) $('#meldung').firstChild.remove();
  if (zeit) setTimeout(() => q.remove(), zeit);
}
function heuteHannover() {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function schiebe(iso, tage) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + tage); return d.toISOString().slice(0, 10); }

/* ---------- Daten ---------- */
async function lade() {
  const echt = !S.beispiel && SCHL;
  /* Vorführung: Beispielwerte aus den abgelegten Dateien, auf heute geschoben und genau auf jetzt gekürzt. Dieselbe Rechnung macht der Dienst
     (registre.py ablage_heute) für La Maison, damit beide dieselben Zahlen zeigen (Prüfung 16.10.2026). Kein Aufruf an einen Dienst, den es nicht gibt. */
  if (S.beispiel && !SCHL) return ablageLaden();
  let r, d = {};
  try { r = await fetch('../../api/registre?tage=' + S.tage + (S.beispiel ? '&beispiel=1' : echt ? '&k=' + SCHL : ''), { cache: 'no-store' }); }
  catch (e) { if (echt) throw new Error('Der Server-Teil antwortet nicht.'); return ablageLaden(); }
  try { d = await r.json(); } catch (e) { if (echt) throw new Error('Die Antwort war nicht lesbar (' + r.status + ').'); return ablageLaden(); }
  if (!r.ok) { if (echt) throw new Error(String(d.fehler || ('Fehler ' + r.status)).replace(/^[A-ZÄÖÜ]+ · /, '')); return ablageLaden(); }
  S.d = d; S.ablage = false;
  if (d.beispiel) S.beispiel = true;   /* antwortet der Dienst mit Beispielwerten (Vorführung, falscher Schlüssel), steht das auch so da */
}
async function ablageLaden() {   /* abgelegte Beispielwerte (registre.py ablage), Tage auf heute geschoben */
  let r;
  try { r = await fetch('beispiel/' + S.tage + '.json', { cache: 'no-store' }); } catch (e) { throw new Error('Weder Server-Teil noch Beispielwerte erreichbar.'); }
  if (!r.ok) throw new Error('Die Beispielwerte fehlen (' + r.status + ').');
  const d = await r.json(), um = Math.round((new Date(heuteHannover() + 'T12:00:00Z') - new Date(d.bis + 'T12:00:00Z')) / 864e5);
  if (um) {
    ['von', 'bis', 'seit'].forEach(k => { if (d[k]) d[k] = schiebe(d[k], um); });
    d.vorher.von = schiebe(d.vorher.von, um); d.vorher.bis = schiebe(d.vorher.bis, um);
    d.je_tag.forEach(t => t.tag = schiebe(t.tag, um));
    d.besuche.forEach(b => b.tag = schiebe(b.tag, um));
    /* Jeder Besuch rückt um «um» Tage, also auch um «um» Wochentage: das Raster Wochentag × Stunde dreht mit (sonst stünde der Besuch von heute beim Wochentag der Ablage) */
    const r7 = d.raster.slice(); d.raster = r7.map((_, w) => r7[((w - um) % 7 + 7) % 7]);
  }
  S.uhr = jetztHannover();   /* Uhrzeit in Hannover (Europe/Berlin), auf die gekürzt wurde */
  if (d.roh && d.roh.heute_voll) kuerzen(d, S.uhr);
  d.wochen = wochenAus(d.je_tag);   /* Montag bis Sonntag nach den verschobenen Tagen */
  delete d.roh;
  S.d = d; S.ablage = true; S.beispiel = true;
}
function jetztHannover() {
  try { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date()); }
  catch (e) { return new Date().toTimeString().slice(0, 8); }
}
/* Runden wie Python round(): genau am Dezimalwert der Zahl, bei genau halb zur geraden Ziffer (sonst wichen die Zahlen der Ablage um eins vom Dienst ab) */
function pyRund(x, st = 0) {
  if (x == null || !isFinite(x)) return x;
  const t = Math.abs(x).toFixed(st + 30), i = t.indexOf('.'), kopf = t.slice(0, i + 1 + st).replace('.', ''), rest = t.slice(i + 1 + st);
  let k = BigInt(kopf.replace(/^$/, '0'));
  if (rest[0] > '5' || (rest[0] === '5' && /[1-9]/.test(rest.slice(1))) || (rest[0] === '5' && !/[1-9]/.test(rest.slice(1)) && k % 2n === 1n)) k += 1n;
  const z = Number(k) / 10 ** st;
  return x < 0 ? -z : z;
}
const ART = { karte: ['abende.html'], abend: ['abend.html'], essen: ['dirty-chicken.html'], erleben: ['bar.html', 'leute.html'], feste: [], weg: ['weg.html'] };   /* wie registre.py art_von */
const artVon = s => s === 'index.html' ? 'start' : Object.keys(ART).find(k => ART[k].includes(s)) || 'sonst';
const rang = (l, n) => l.filter(x => x.n > 0).sort((a, b) => b.n - a.n || (String(a.k) < String(b.k) ? -1 : String(a.k) > String(b.k) ? 1 : 0)).slice(0, n);
function wochenAus(jt) {   /* wie registre.py: Woche Montag bis Sonntag, angebrochene am Rand */
  const w = [];
  jt.forEach(t => {
    const d = new Date(t.tag + 'T12:00:00Z'), mo = schiebe(t.tag, -((d.getUTCDay() + 6) % 7)), x = w.length && w[w.length - 1].mo === mo ? w[w.length - 1] : null;
    if (x) { x.bis = t.tag; x.tage++; x.besuche += t.besuche; x.buchung += t.buchung; }
    else w.push({ mo, von: t.tag, bis: t.tag, tage: 1, besuche: t.besuche, buchung: t.buchung });
  });
  return w.map(({ mo, ...x }) => x);
}
/* Die Ablage enthält heute den ganzen Tag. Was nach der jetzigen Uhrzeit in Hannover begänne, fällt hier weg, aus jeder Zahl genau wie im Dienst
   (registre.py lässt diese Besuche aus). Die Rohsummen (d.roh) machen das ohne Schätzen möglich. */
function kuerzen(d, jetzt) {
  const R = d.roh, u = d.summe, L = d.je_tag.length - 1, heute = d.bis;
  const weg = d.besuche.filter(b => b.tag === heute && (b.zs || b.z + ':00') > jetzt);
  const minus = (liste, k, l) => { const x = liste.find(y => y.k === k && (l === undefined || y.l === l)); if (x) x.n--; };
  const SS = new Map(R.S.map(([e, a, g, z]) => [e + '|' + a + '|' + g, z]));
  const wtag = (new Date(heute + 'T12:00:00Z').getUTCDay() + 6) % 7;
  weg.forEach(b => {
    u.besuche--; u.seiten -= b.seiten; if (b.buchung) u.buchung--; if (b.anfrage) u.anfrage--; if (b.kontakt) u.kontakt--; if (b.route) u.route--; u.heute--;
    if (b.dauer > 0) { R.dauer[0] -= b.dauer; R.dauer[1]--; }
    const t = d.je_tag[L]; t.besuche--; t.seiten -= b.seiten; if (b.buchung) t.buchung--;
    const l = b.l || '??'; minus(R.laender, l); if (R.land_tag[l]) R.land_tag[l][L]--;
    if (b.o) minus(R.orte, b.o, b.l);
    minus(d.sprachen, b.sp); minus(d.geraete, b.g); minus(R.herkunft, b.h);
    const h = +b.z.slice(0, 2); d.stunden[h]--; d.raster[wtag][h]--;
    const pb = platzBis(b.weg);
    b.weg.forEach((x, i) => {
      const s = d.seiten.find(y => y.s === x.s); if (s) { s.n--; if (i <= pb) s.buchung--; }
      if (x.sek > 0 && R.seiten_sek[x.s]) { R.seiten_sek[x.s][0] -= x.sek; R.seiten_sek[x.s][1]--; }
      const a = artVon(x.s); ['seite'].concat(x.e || [], i <= pb ? ['platz'] : []).forEach(e => { const k = e + '|' + a + '|' + b.g; SS.set(k, (SS.get(k) || 0) - 1); });
    });
  });
  if (!weg.length) { d.besuche = d.besuche.slice(0, 400); return; }   /* wie registre.py _kuerzen: auch ohne Wegfallendes die neuesten 400 (Prüfung 17.10.2026: nach dem letzten Besuch des Tages standen 432 statt 400) */
  const raus = new Set(weg);
  d.besuche = d.besuche.filter(b => !raus.has(b)).slice(0, 400);
  u.dauer_mittel = R.dauer[1] ? pyRund(R.dauer[0] / R.dauer[1]) : null;
  u.seiten_je_besuch = u.besuche ? pyRund(u.seiten / u.besuche, 1) : null;
  u.laender = R.laender.filter(x => x.n > 0 && x.k !== '??' && x.k !== '').length;
  d.laender = rang(R.laender, 20); d.herkunft = rang(R.herkunft, 14); d.sprachen = rang(d.sprachen, 12); d.geraete = rang(d.geraete, 12);
  d.orte = R.orte.filter(x => x.n > 0).sort((a, b) => b.n - a.n || (a.k < b.k ? -1 : a.k > b.k ? 1 : a.l < b.l ? -1 : a.l > b.l ? 1 : 0)).slice(0, 20);
  d.seiten = d.seiten.filter(x => x.n > 0).map(x => { const q = R.seiten_sek[x.s]; return Object.assign(x, { sek: q && q[1] ? pyRund(q[0] / q[1]) : null }); })
    .sort((a, b) => b.n - a.n || (a.s < b.s ? -1 : a.s > b.s ? 1 : 0));
  const top = rang(R.laender, 5).map(x => x.k).filter(k => k !== '??').slice(0, 4);
  d.land_verlauf = top.map(k => ({ k, n: R.land_tag[k] || d.je_tag.map(() => 0) }));
  const sum = (e, a, g) => { let z = 0; SS.forEach((v, k) => { const [e2, a2, g2] = k.split('|'); if (e2 === e && (a == null || a2 === a) && (g == null || g2 === g)) z += v; }); return z; };
  d.werte = werteAus(sum);
  const mit = d.je_tag.filter(t => t.besuche); d.seit = mit.length ? mit[0].tag : null; d.leer = !u.besuche;
}

/* Stelle der Seite, auf der ein Besuch zum Platz kam, sonst -1 (wie registre.py platz_bis): jede Seite bis dahin lag auf dem Weg zum Platz */
const platzBis = weg => weg.findIndex(x => (x.e || []).some(e => ZUR_BUCHUNG.includes(e)));
/* Die neun Werte «Zum Platz», dieselbe Rechnung wie registre.py werte_aus */
function werteAus(sum) {
  const wert = (z, v, mehr) => Object.assign({ zahl: z, von: v, anteil: v ? pyRund(Math.min(100, 100 * z / v), 1) : null }, mehr || {});
  const auf = sum('seite');
  return { start: wert(sum('platz', 'start'), sum('seite', 'start')), karte: wert(sum('platz', 'karte'), sum('seite', 'karte')),
    booking: wert(sum('booking'), sum('buchung') + sum('booking'), { anfrage: sum('buchung') }), abbruch: wert(Math.max(0, sum('fenster') - sum('buchung')), sum('fenster')),
    tisch: wert(sum('tisch'), auf, { abend: sum('tisch', 'abend') }),
    anfrage: wert(sum('anfrage'), auf, { start: sum('anfrage', 'start') }),
    kontakt: wert(sum('anruf') + sum('mail'), auf, { anruf: sum('anruf'), mail: sum('mail') }), chat: wert(sum('chat'), auf, { dc: sum('chat', 'essen') }),
    route: wert(sum('route'), auf, { weg: sum('route', 'weg') }) };
}

/* ---------- Rahmen ---------- */
/* Kopf, Rand, Leiste und Startbild kommen aus der Oberfläche der Häuser (_Werkzeuge/stamm/oberflaeche/, im Haus /culinarium-demo/assets/oberflaeche/, Kleid culinarium,
   Rahmen aus dem Kleid; kein eigener Kopf und kein eigenes Startbild).
   Ids, data-gehe und die Klick-Handler bleiben wie im Le Registre des Doldenhorn und des Schäfli. */
const STUBE = MAISON;
/* Namen der Werkzeuge: nur aus dem Kleid des Hauses (kleid/culinarium.js → WO_HAUS.namen, einzige Stelle, gepflegt vom Chat der Zentrale), hier nie abgetippt.
   NAME groß am Satzanfang («Die Besucherliste»), KLEIN im Satz («die Besucherliste»; nur Nominativ und Akkusativ, damit jeder Artikel passt). */
const NAME = WO.name('besuche'), KLEIN = NAME.replace(/^(Die|Das|Der) /, m => m.toLowerCase()), STUBE_N = WO.name('zentrale');
function kopfLeiste() {
  const u = S.d.summe;
  $('#kopf').innerHTML = WO.kopf({ werkzeug: 'besuche', unter: 'Website', titel: TITEL[S.ansicht] || NAME,
    stand: S.beispiel ? 'Beispielwerte · keine echten Besuche' : u.heute ? mal(u.heute, 'Ein Besuch heute', 'Besuche heute') : 'Heute noch kein Besuch',
    anleitung: 'anleitung.html', website: '../../index.html', markeHref: '#start', marke: `data-gehe="start" aria-label="${esc(NAME)}, Übersicht"` });
  /* Die Stube: lokal _werkzeuge/maison/, online /maison/ (Werkzeug-Master Abschnitt 9); das Kleid kennt nur den lokalen Weg */
  $$('#kopf a.wo-kn--rund').forEach(a => { if (/\/_?werkzeuge\/maison\/$|\/maison\/$/.test(a.getAttribute('href') || '')) { a.href = STUBE; a.dataset.tip = STUBE_N; a.setAttribute('aria-label', STUBE_N + ', zu allen Werkzeugen'); } });
  $$('#kopf [data-gehe]').forEach(a => a.onclick = e => { e.preventDefault(); gehe(a.dataset.gehe); });
}
function rand() {
  const u = S.d.summe, an = S.ansicht, gruppen = [];
  BEREICHE.forEach(([key, name, zahl]) => {
    if (!key) { gruppen.push({ titel: name, eintraege: [] }); return; }
    if (!gruppen.length) gruppen.push({ titel: '', eintraege: [] });
    gruppen[gruppen.length - 1].eintraege.push({ text: name, an: an === key, zahl: zahl === 'heute' && u.heute ? n(u.heute) : 0, attr: `data-gehe="${key}"` });
  });
  gruppen.push({ titel: 'Wege', eintraege: [{ text: STUBE_N, href: STUBE, attr: 'data-weg' }, { text: 'Kurzer Rundgang', attr: 'data-weg data-rundgang' }] });
  $('#rand').innerHTML = WO.rand(gruppen, { website: '../../index.html', anleitung: 'anleitung.html' });   /* Rand genau wie in den anderen Werkzeugen des Hauses */
  $$('#rand [data-gehe]').forEach(a => a.onclick = e => { e.preventDefault(); gehe(a.dataset.gehe); });
  $$('#rand [data-rundgang]').forEach(a => a.onclick = () => { if (window.rundgang) window.rundgang(); });
  kopfLeiste();
}
function leiste() {
  const d = S.d, u = d.summe, aus = nicht();
  const satz = d.leer ? 'In den letzten ' + n(d.tage) + ' Tagen wurde noch kein Besuch gezählt.'
    : 'Letzte ' + n(d.tage) + ' Tage: ' + mal(u.besuche, 'ein Besuch', 'Besuche') + (u.laender ? ' aus ' + mal(u.laender, 'einem Land', 'Ländern') : '') + ', ' + (u.buchung === 1 ? 'einer' : u.buchung ? n(u.buchung) : 'keiner') + ' zum Platz.';
  const kn = WO.knopf('Als Tabelle sichern', 'kopie', 'glas', { klein: true, id: 'l-export', titel: 'Alle Besuche des gewählten Zeitraums als Tabelle (CSV, öffnet in Excel und Numbers)', attr: 'aria-label="Als Tabelle sichern"' })
    + (S.beispiel ? (ECHT_DA && !S.ablage ? WO.knopf('Zu den echten Besuchen', 'pfeil', 'gold', { klein: true, id: 'l-echt' }) : '')
      : WO.knopf('Neu laden', 'verlauf', 'gold', { klein: true, id: 'l-neu', attr: 'aria-label="Neu laden"' }));
  $('#leiste').innerHTML = WO.leiste({ titel: S.beispiel ? 'Du siehst Beispielwerte' : u.heute ? mal(u.heute, 'Ein Besuch heute', 'Besuche heute') : 'Heute noch kein Besuch',
    satz: S.beispiel ? 'Erfunden, damit du siehst, wie ' + KLEIN + ' mit Besuchen\u00a0aussieht.' : satz, entwurf: false, knoepfe: kn });   /* Leiste genau wie in den anderen Werkzeugen des Hauses (WO.leiste) */
  /* «Dieses Gerät nicht mitzählen» entfernt (Robert 18.10.2026 18:44: «der button bei allen häusern überflüssig») */
  $('#l-export').onclick = () => sichern();
  if ($('#l-neu')) $('#l-neu').onclick = () => frisch(true);
  if ($('#l-echt')) $('#l-echt').onclick = () => beispiel(false);
}
/* Bühne: Kopf jeder Ansicht im Rahmen der Oberfläche; in der Übersicht die Kennzahlen als Schilder.
   je Ansicht ein eigenes Foto von Rudis Abenden (assets/bild/<schlüssel>-1600.webp der Website, Bildregister BILD in website/bau.py; geschärfte Fassungen
   ziehen von selbst nach), nie ein Foto, das die Ansicht darunter als Seitenbild zeigt (Memory «Hero nicht mit Material der Seite»):
   Übersicht das Aussenfoto aus dem Kleid (die Fenster der Bar am Abend), Besuche ein Teller wird an den Tisch gebracht, Herkunft die Schilder an der Hausecke
   in Linden, Zeit ein Drink bei Nacht, Seiten die Plakatwand, Verlauf zwei Köche am Pass, Zum Platz angestossen bei Kerzen an der Tafel,
   So wird gezählt ein Tablett mit Gläsern */
const BUEHNE = { start: ['fassade', '50% 55%'], besuche: ['service', '50% 40%'], herkunft: ['schildtag', '50% 40%'], zeit: ['glasnacht', '50% 50%'], seiten: ['plakatwand', '50% 50%'], verlauf: ['kueche', '50% 40%'], buchung: ['anstossen', '50% 38%'], zaehlung: ['tablett', '50% 50%'] };
/* Startbild jeder Ansicht: WO.startbild, Übersicht «voll» mit dem Aussenfoto des Hauses, jede andere Ansicht «buehne» mit ihrem eigenen Bild */
function kopf(mono, titel, satz, rechts = '', chips = '') {
  const [bild, lage] = BUEHNE[S.ansicht] || BUEHNE.start, voll = S.ansicht === 'start';
  return WO.startbild({ werkzeug: 'besuche', art: voll ? 'voll' : 'buehne', foto: voll ? undefined : '/culinarium-demo/assets/bild/' + bild + '-1600.webp', zier: mono, h1: titel, satz,
    knoepfe: (voll ? WO.knopf('Anleitung', 'buch', 'gold', { href: 'anleitung.html', neu: true }) : '') + chips + rechts })
    .replace('<section class="wo-sb', `<section style="--wo-foto-pos:${voll ? '50% 46%' : lage}" class="buehne wo-sb`);
}
function chipsStart(d) {
  const u = d.summe; if (d.leer) return '';
  return `<ul class="buehne__chips"><li><b>${n(u.besuche)}</b><span>Besuche</span></li><li><b>${n(u.laender)}</b><span>Länder</span></li><li><b>${n(u.heute)}</b><span>heute</span></li><li><b>${n(u.buchung)}</b><span>zum Platz</span></li></ul>`;
}
function zeitraum() {
  const k = t => `<button type="button" data-tage="${t}" class="${S.tage === t ? 'an' : ''}" aria-pressed="${S.tage === t}">${t} Tage</button>`;
  return `<div class="wahl3 wo-seg zeitraum" role="group" aria-label="Zeitraum">${k(7)}${k(30)}${k(90)}</div>`;
}
function hinweisBeispiel() {
  return S.beispiel ? `<p class="bsp-band"><b>Beispielwerte.</b> Diese Zahlen sind erfunden und zeigen, wie ${KLEIN} mit Besuchen aussieht. Echte Besuche erscheinen hier, sobald die Website zählt.</p>` : '';
}
function gehe(ziel, wahl) {
  if (!TITEL[ziel]) ziel = 'start';
  /* Besuch in der Liste wählen: nur die Karte rechts wechselt, die Seite bleibt, wo sie ist (Vorlage Grand Beau-Rivage, Robert 15.10.2026: «springe immer wieder nach oben») */
  const fach = $('#ansicht .detail');
  if (ziel === 'besuche' && S.ansicht === 'besuche' && wahl !== undefined && fach && S.d.besuche[+wahl]) {
    S.wahl = +wahl;
    $$('#ansicht .liste .besuch').forEach(a => { const an = +a.dataset.wahl === S.wahl; a.classList.toggle('aktiv', an); a.setAttribute('aria-pressed', an); });
    fach.innerHTML = detail(S.d.besuche[S.wahl]);
    $('#rand').classList.remove('auf');
    if (matchMedia('(max-width:1180px)').matches && fach.getBoundingClientRect().top < 0) window.scrollBy({ top: fach.getBoundingClientRect().top - 90, behavior: 'instant' });   /* schmal steht die Karte über der Liste */
    return;
  }
  const neu = ziel !== S.ansicht;
  S.ansicht = ziel;
  if (wahl !== undefined) S.wahl = +wahl || 0;
  if (location.hash.slice(1) !== ziel) history.replaceState(null, '', location.pathname + location.search + '#' + ziel);
  rand(); zeichne();
  if (neu) window.scrollTo(0, 0);
  $('#rand').classList.remove('auf');
}
async function frisch(sagen = false) {
  try {
    await lade();
    if (S.wahl >= S.d.besuche.length) S.wahl = 0;
    rand(); leiste(); zeichne();
    if (sagen) quit('Neu geladen', '', false, 2500);
  } catch (e) { quit(NAME + ' ist gerade nicht abrufbar', e.message, true, 0); }
}
function beispiel(an) {
  if (!an && !ECHT_DA) return;
  S.beispiel = an; S.wahl = 0; S.zeige = 40;
  history.replaceState(null, '', location.pathname + ([an ? 'beispiel=1' : '', SCHL ? 'k=' + SCHL : ''].filter(Boolean).join('&').replace(/^(?=.)/, '?')) + '#' + S.ansicht);
  frisch();
}

/* ---------- Datenexport (Website-Bau-Master 9d Punkt 21, Prüfung 16.10.2026): alle Besuche des Zeitraums als Tabelle, ohne uns ----------
   Echte Werte (mit Schlüssel): der Dienst gibt alle Besuche des Zeitraums heraus (?export=1), nicht nur die neuesten 400. Beispielwerte: was die Liste zeigt,
   im Dateinamen und in der ersten Spalte als Beispiel gekennzeichnet. Nur Angaben, die das Besucherbuch ohnehin zeigt: kein Name, keine Adresse, kein Kürzel. */
function zelle(x) {
  let t = String(x == null ? '' : x);
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;   /* keine Formeln in Excel (CSV-Einschleusung) */
  return /[";\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}
function tabelle(liste, bsp) {
  const kopf = ['Art', 'Tag', 'Uhrzeit', 'Land', 'Ort', 'Region', 'Gerät', 'Sprache des Browsers', 'Gekommen über', 'Geblieben (Sekunden)', 'Seiten', 'Weg durch die Website']
    .concat(REIHE.map(k => EREIGNIS[k]));
  const hat = (b, e) => b.weg.some(x => (x.e || []).includes(e)) ? 'ja' : 'nein';
  const zeilen = liste.map(b => [bsp ? 'Beispiel' : 'Besuch', datum(b.tag), b.z, land(b.l), b.o, b.r, GERAET[b.g] || b.g, SPRACHE[b.sp] || b.sp, b.h, b.dauer, b.seiten,
    b.weg.map(x => seite(x.s) + ' (' + x.sek + ' s)').join(' > ')].concat(REIHE.map(k => hat(b, k))));
  return '\ufeff' + [kopf].concat(zeilen).map(z => z.map(zelle).join(';')).join('\r\n') + '\r\n';
}
async function sichern() {
  const d = S.d, bsp = S.beispiel;
  try {
    let liste = d.besuche;
    if (!bsp && SCHL) {
      const r = await fetch('../../api/registre?export=1&tage=' + S.tage + '&k=' + SCHL, { cache: 'no-store' });
      const x = await r.json().catch(() => ({}));
      if (!r.ok || !Array.isArray(x.besuche)) throw new Error(String(x.fehler || 'Der Dienst gab die Besuche nicht heraus (' + r.status + ').').replace(/^[A-ZÄÖÜ]+ · /, ''));
      liste = x.besuche;
    }
    const name = 'besuche-culinarium-' + d.von + '-bis-' + d.bis + (bsp ? '-beispielwerte' : '') + '.csv';
    const url = URL.createObjectURL(new Blob([tabelle(liste, bsp)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    quit('Als Tabelle gesichert', name + ' · ' + mal(liste.length, 'ein Besuch', 'Besuche') + (bsp ? ' · Beispielwerte' : '') + (bsp && d.summe.besuche > liste.length ? ' (die neuesten der Liste)' : ''));
  } catch (e) { quit('Die Tabelle liess sich nicht sichern', e.message, true, 0); }
}

/* ---------- Bausteine ---------- */
function balken(liste, name, klein, gesamt) {   /* Rangliste: Name, Balken, Zahl, Anteil. Der Balken wächst nur über transform. */
  if (!liste.length) return '<p class="nichts">Noch nichts gezählt.</p>';
  /* Anteil an allen Besuchen (bzw. allen Aufrufen), nicht nur an den gezeigten Plätzen (Prüfung 16.10.2026: «Schweiz 57 %» neben «Aus der Schweiz 47 %») */
  const max = Math.max(...liste.map(x => x.n)), ges = gesamt || liste.reduce((a, x) => a + x.n, 0);
  return `<ol class="rang">${liste.map((x, i) => `<li style="--i:${i}"><span class="rang__n">${name(x)}${klein ? `<small>${klein(x)}</small>` : ''}</span>
    <span class="rang__b"><i style="--w:${Math.max(.02, x.n / max).toFixed(3)}"></i></span><b>${n(x.n)}</b><em>${Math.round(100 * x.n / ges)}&nbsp;%</em></li>`).join('')}</ol>`;
}
function vergleich(jetzt, vorher, umgekehrt) {
  if (jetzt == null || !vorher) return '<small class="vgl">&nbsp;</small>';
  const p = Math.round(100 * (jetzt - vorher) / vorher);
  if (!p) return '<small class="vgl">gleich wie davor</small>';
  const gut = umgekehrt ? p < 0 : p > 0;
  return `<small class="vgl ${gut ? 'gut' : 'weniger'}">${p > 0 ? SYM.hoch : SYM.runter}${p > 0 ? '+' : '−'}${Math.abs(p)}&nbsp;% zu davor</small>`;
}
function saeulen(werte, beschrift, tip, klasse = '', vorher) {
  const max = Math.max(1, ...werte, ...(vorher || []));
  return `<div class="saeulen ${klasse}" style="--n:${werte.length}" role="img" aria-label="${esc(tip.label)}">
    ${werte.map((z, i) => `<div class="s" style="--i:${Math.round(i * 30 / werte.length)}" data-t="${esc(tip(i, z))}">${vorher ? `<u style="--h:${(vorher[i] / max).toFixed(3)}"></u>` : ''}<i style="--h:${z ? Math.max(.025, z / max).toFixed(3) : 0}"></i>${beschrift(i) ? `<span>${beschrift(i)}</span>` : ''}</div>`).join('')}
  </div>`;
}
function karteBesuch(b, i, aktiv) {
  const marke = b.buchung ? 'Zum Platz' : b.anfrage ? 'Warteliste' : b.kontakt ? 'Kontakt' : b.chat ? '<span class="besuch__m">Bar</span><span class="besuch__m">Dirty&nbsp;Chicken</span>' : esc(GERAET[b.g] || '');
  /* Tor 6 Fund 31 (30.10.2026): Seiten und Dauer sind zwei Teile; der Trenner «·» gehört zum zweiten und wird am Zeilenanfang abgeschnitten (culinarium.css),
     steht also nie am Anfang oder Ende einer Zeile. Das Etikett «Bar · Dirty Chicken» steht in schmalen Karten zweizeilig. */
  /* Demo-Check 21.10.2026: die Zeile unter dem Ort bricht nur zwischen Uhrzeit, Seiten und Dauer um, nie mitten in «5 Min. 28 Sek.» (culinarium.css lässt sie umbrechen statt kürzen) */
  return `<button class="besuch rg-a${b.buchung ? ' gold' : ''}${aktiv ? ' aktiv' : ''}" type="button" data-gehe="besuche" data-wahl="${i}" aria-pressed="${aktiv}">
    <span class="besuch__b">${sbild(b.weg && b.weg[0] ? b.weg[0].s : '')}<span class="besuch__l">${esc(b.l && b.l !== '??' ? b.l : '–')}</span></span>
    <span class="besuch__n"><b>${zusammen(ort(b))}</b><small><i class="besuch__w">${esc(tagWort(b.tag) + ', ' + b.z + ' Uhr').replace(/ /g, '\u00a0')}</i><i class="besuch__t"> · </i><i class="besuch__r">${[mal(b.seiten, 'eine Seite', 'Seiten')].concat(b.dauer ? [dauer(b.dauer, true)] : []).map(x => `<i class="besuch__s">${esc(x).replace(/ /g, '\u00a0')}</i>`).join('')}</i></small></span>
    <span class="besuch__z">${marke}<small>${esc(SPRACHE[b.sp] || b.sp)}</small></span></button>`;
}
function leer() {
  return `<div class="leer blatt">${ZT}<b>Noch kein Besuch gezählt.</b>
    <p>Sobald jemand die Website öffnet, steht der Besuch hier: mit Ort, Uhrzeit, den Seiten und der Zeit darauf.</p>
    <button class="kn kn--linie" type="button" data-bsp>Beispiel ansehen<i>${PF}</i></button></div>`;
}

/* ---------- Ansichten ---------- */
function zeichne(ruhig) {
  const el = $('#ansicht');
  const f = { besuche, herkunft, zeit, seiten, verlauf, buchung, zaehlung }[S.ansicht] || start;
  el.innerHTML = f();
  $$('[data-gehe]', el).forEach(b => b.onclick = e => { e.preventDefault(); gehe(b.dataset.gehe, b.dataset.wahl); });
  $$('[data-tage]', el).forEach(b => b.onclick = () => { if (S.tage === +b.dataset.tage) return; S.tage = +b.dataset.tage; S.wahl = 0; S.zeige = 40; try { localStorage.setItem('culinarium-registre-tage', S.tage); } catch (e) { /* privat */ } frisch(); });
  $$('[data-bsp]', el).forEach(b => b.onclick = () => beispiel(true));
  $$('[data-sichern]', el).forEach(b => b.onclick = () => sichern());
  $$('[data-filter]', el).forEach(b => b.onclick = () => { S.filter = b.dataset.filter; S.wahl = -1; S.zeige = 40; zeichne(true); });
  $$('[data-mehr]', el).forEach(b => b.onclick = () => { S.zeige += 60; zeichne(true); });
  $$('[data-raster]', el).forEach(b => b.onclick = () => { S.raster = b.dataset.raster; zeichne(); });
  document.title = (TITEL[S.ansicht] || NAME) + ' · ' + NAME + ' · ' + WO.haus.name;
  schweben(el, ruhig);
}
/* Schweben (Gefühl der Carlton-Seiten, Rezeptur des Le Registre im Grand Beau-Rivage, Robert 16.10.2026: «darf nicht an den Scroll geknüpft sein, muss luxuriös
   reingeschwebt kommen»): Sobald ein Blatt am unteren Rand auftaucht, schwebt es nach der Uhr an seinen Platz (.rg-da). Balken und Säulen wachsen erst, wenn ihr Blatt
   gut zur Hälfte im Bild ist (.rg-los). */
let IO = null, IO_LOS = null;
function schweben(el, still) {
  if (IO) IO.disconnect();
  if (IO_LOS) IO_LOS.disconnect();
  const ziele = [];
  const nimm = (sel, reihe) => $$(sel, el).forEach(x => { if (x.dataset.r) return; x.dataset.r = '1'; x.style.setProperty('--i', reihe ? Math.min([...x.parentNode.children].indexOf(x), 3) : 0);   /* Staffel höchstens vier Schritte (Werkzeug-Master R17) */ ziele.push(x); });
  nimm('.bsp-band, .wahl3--filter, .band, .tabelle, .leer, .zw, .mehr, .wenig, #ansicht > .blatt, #ansicht > .tafel', false);
  nimm('.zahlen > .blatt, .zwei > .blatt, .stapel > .blatt, .werte > .wert, .liste .besuch', true);
  const ruhig = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (still) { ziele.forEach(x => x.classList.add('rg-da', 'rg-los', 'rg-ruhig')); return; }   /* Neuzeichnen in derselben Ansicht (Filter, Weitere zeigen): nichts schwebt neu herein */
  if (ruhig || !('IntersectionObserver' in window)) { ziele.forEach(x => x.classList.add('rg-da', 'rg-los')); return; }
  const root = null;   /* die Seite scrollt als Ganzes (Oberfläche der Häuser: keine eigene Scrollfläche) */
  IO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rg-da'); IO.unobserve(e.target); } }), { root, rootMargin: '0px 0px 8% 0px' });
  IO_LOS = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rg-los'); IO_LOS.unobserve(e.target); } }), { root, threshold: .45 });
  ziele.filter(x => x.querySelector('.saeulen .s i,.rang__b i,.trichter li i')).forEach(x => IO_LOS.observe(x));
  ziele.filter(x => !x.querySelector('.saeulen .s i,.rang__b i,.trichter li i')).forEach(x => x.classList.add('rg-los'));
  ziele.forEach(x => IO.observe(x));
}

function start() {
  const d = S.d, u = d.summe, v = d.vorher;
  const gruss = /[?&]gruss=tag/.test(location.search) ? 'Guten Tag.' : WO.gruss();
  const satzS = 'Wer deine Website besucht hat: woher die Gäste kommen, welche Seiten sie ansehen, wie lange sie bleiben und wer sich seinen Platz an der Tafel sichert. Gezählt ohne Cookies, nie mit Namen.';
  let aus = kopf(esc(NAME + ' · ' + WO.haus.name), `${gruss}<br><em>Wer war zu Besuch?</em>`, satzS, zeitraum(), chipsStart(d)) + hinweisBeispiel();   // einheitliches Startbild der Werkzeuge (WO.startbild)
  if (d.leer) return aus + leer();
  const viele = d.je_tag.length, schritt = viele <= 7 ? 1 : viele <= 31 ? 5 : 15;
  aus += `<div class="zahlen">
      <div class="blatt"><span class="mono">Besuche</span><b>${n(u.besuche)}</b>${vergleich(u.besuche, v.besuche)}</div>
      <div class="blatt"><span class="mono">Angesehene Seiten</span><b>${n(u.seiten)}</b><small>${u.seiten_je_besuch != null ? n(u.seiten_je_besuch) + ' je Besuch' : '&nbsp;'}</small></div>
      <div class="blatt"><span class="mono">Zeit je Besuch</span><b>${u.dauer_mittel != null ? Math.floor(u.dauer_mittel / 60) + ':' + String(u.dauer_mittel % 60).padStart(2, '0') : '–'}</b><small>Minuten im Schnitt</small></div>
      <div class="blatt"><span class="mono">Zum Platz</span><b>${n(u.buchung)}</b><small>${u.besuche ? prozent(100 * u.buchung / u.besuche) + ' der Besuche' : '&nbsp;'}</small></div>
    </div>
    <section class="blatt tafel">
      <header><h3>Besuche je Tag</h3><p>${esc(datum(d.von))} bis ${esc(datum(d.bis))}<span style="white-space:nowrap">&nbsp;· <button class="link" type="button" data-gehe="verlauf">Verlauf</button></span></p></header>
      ${saeulen(d.je_tag.map(t => t.besuche), i => (viele - 1 - i) % schritt === 0 ? kurzDatum(d.je_tag[i].tag) : '', Object.assign((i, z) => tagWort(d.je_tag[i].tag) + ': ' + mal(z, 'ein Besuch', 'Besuche'), { label: 'Besuche je Tag' }))}
    </section>
    <div class="zwei zwei--fuell">
      <div class="stapel">
        <section class="blatt"><header><h3>Woher die Gäste kommen</h3><button class="link" type="button" data-gehe="herkunft">Alle Orte</button></header>
          ${balken((d.orte || []).slice(0, 5), x => esc(x.k), x => esc(land(x.l)), u.besuche)}</section>
        <section class="blatt"><header><h3>Wie sie zu dir finden</h3></header>${balken(d.herkunft.slice(0, 4), x => esc(x.k), null, u.besuche)}</section>
        <section class="blatt"><header><h3>Handy oder Rechner</h3></header>${balken(d.geraete, x => esc(GERAET[x.k] || x.k), null, u.besuche)}</section>
      </div>
      <section class="blatt"><header><h3>Am meisten angesehen</h3><button class="link" type="button" data-gehe="seiten">Alle Seiten</button></header>
        ${balken(d.seiten.slice(0, 6), x => mitBild(x.s), x => x.sek != null ? dauer(x.sek, true).replace(/ /g, '\u00a0') + ' im\u00a0Schnitt' : '', u.seiten)}</section>
    </div>
    <h2 class="zw">Zuletzt <em>zu Besuch</em></h2>
    <div class="liste liste--start">${d.besuche.slice(0, 5).map((b, i) => karteBesuch(b, i, false)).join('')}</div>
    <p class="mehr">${WO.knopf('Alle Besuche', 'rechts', 'hell', { klein: true, attr: 'data-gehe="besuche"' })}</p>`;
  if (!S.beispiel && u.besuche < 8) aus += `<p class="wenig">Noch wenig zu sehen? <button class="link" type="button" data-bsp>Beispiel ansehen</button></p>`;
  return aus;
}

function besuche() {
  const d = S.d;
  let aus = kopf('Besuche', 'Jeder Besuch, <em>Schritt für Schritt.</em>', 'Wann jemand kam, von wo, was er sich ansah und wie lange. Ohne Namen: ein Besuch ist ein Ort, eine Uhrzeit und ein Weg durch die Seiten.', zeitraum()) + hinweisBeispiel();
  if (d.leer) return aus + leer();
  const alle = d.besuche.map((b, i) => [b, i]);
  const nach = { alle: alle, buchung: alle.filter(x => x[0].buchung), anfrage: alle.filter(x => x[0].anfrage), kontakt: alle.filter(x => x[0].kontakt), handy: alle.filter(x => x[0].g === 'handy') };
  const l = nach[S.filter] || alle;
  if (!l.some(x => x[1] === S.wahl)) S.wahl = l.length ? l[0][1] : -1;
  const b = d.besuche[S.wahl];
  const f = (k, name) => `<button type="button" data-filter="${k}" class="${S.filter === k ? 'an' : ''}" aria-pressed="${S.filter === k}">${name} · ${n(nach[k].length)}</button>`;
  aus += `<div class="wahl3 wo-seg wahl3--filter" role="group" aria-label="Auswahl">${f('alle', 'Alle')}${f('buchung', 'Zum Platz')}${f('anfrage', 'Warteliste begonnen')}${f('kontakt', 'Anruf oder Instagram')}${f('handy', 'Am Handy')}</div>`;
  if (!l.length) return aus + `<div class="leer-hinweis"><b>Kein Besuch in dieser Auswahl.</b> In diesem Zeitraum ging noch niemand diesen Weg.</div>`;
  let letzter = '';
  const liste = l.slice(0, S.zeige).map(([x, i]) => { const k = x.tag !== letzter ? `<p class="tagzeile">${esc(tagWort(x.tag, true))}</p>` : ''; letzter = x.tag; return k + karteBesuch(x, i, i === S.wahl); }).join('');
  aus += `<div class="eingang">
    <div class="liste">${liste}${l.length > S.zeige ? `<button class="link weitere" type="button" data-mehr>Weitere ${n(Math.min(60, l.length - S.zeige))} zeigen</button>` : ''}
      ${d.summe.besuche > d.besuche.length ? `<p class="tagzeile">Gezeigt werden die neuesten ${n(d.besuche.length)} Besuche.</p>` : ''}</div>
    <div class="detail rg-detail">${b ? detail(b) : ''}</div></div>
    <p class="mehr sichern"><button class="kn kn--linie" type="button" data-sichern>Alle Besuche als Tabelle sichern<i>${SYM.laden}</i></button></p>`;
  return aus;
}
function detail(b) {
  const schritte = b.weg.map((x, i) => {
    const e = REIHE.filter(k => x.e.indexOf(k) > -1);
    return `<li style="--i:${Math.min(i, 12)}"><time>${esc(x.z)}</time><div><b>${mitBild(x.s)}</b>${x.sp !== b.sp ? `<small>${esc(SPRACHE[x.sp] || x.sp)}</small>` : ''}
      ${e.length ? `<p>${e.map(k => `<span class="ereignis${GOLD_E.includes(k) ? ' gold' : ''}">${esc(EREIGNIS[k])}</span>`).join('')}</p>` : ''}</div><em>${x.sek ? dauer(x.sek, true) : '–'}</em></li>`;
  }).join('');
  return `<article class="blatt besuchsblatt">
    <div class="besuchsblatt__kopf"><div><span class="mono">Besuch · ${esc(tagWort(b.tag, true))}</span><h2>${esc(ort(b))}</h2></div>
      ${b.buchung ? `<span class="siegel">${b.weg.some(x => (x.e || []).includes('buchung')) ? 'Platz gebucht' : 'Auf der Warteliste'}</span>` : b.anfrage ? '<span class="siegel">Warteliste begonnen</span>' : b.kontakt ? '<span class="siegel">Anruf oder Instagram</span>' : ''}</div>
    <dl class="angaben">
      <div><dt>Gekommen</dt><dd>${esc(b.z)} Uhr</dd></div>
      <div><dt>Geblieben</dt><dd>${b.dauer ? dauer(b.dauer, true) : '–'}</dd></div>
      <div><dt>Seiten</dt><dd>${n(b.seiten)}</dd></div>
      <div><dt>Gerät</dt><dd>${esc(GERAET[b.g] || b.g)}</dd></div>
      <div><dt>Sprache</dt><dd>${esc(SPRACHE[b.sp] || b.sp)}</dd></div>
      <div><dt>Gekommen über</dt><dd>${esc(b.h)}</dd></div>
    </dl>
    <h3 class="wegtitel">Der Weg durch die Website</h3>
    <ol class="weg">${schritte}</ol>
    ${buehne(b)}
    <p class="fein">Die Zeit zählt nur, solange die Seite im Vordergrund war. Die Uhrzeit ist die in Hannover. Sprache: die des Browsers.${b.r ? ' Region: ' + esc(b.r) + '.' : ''}</p>
  </article>`;
}

function herkunft() {
  const d = S.d;
  let aus = kopf('Herkunft', 'Woher <em>die Gäste kommen.</em>', 'Land und Ort nennt die Verbindung, die Sprache ist die des Browsers (die Website gibt es auf Deutsch). «Gekommen über» zeigt, von welcher Website der Gast zu dir fand.', zeitraum()) + hinweisBeispiel();
  if (d.leer) return aus + leer();
  const de = d.laender.find(x => x.k === 'DE'), ges = d.summe.besuche;
  const region = (d.orte || []).filter(x => x.l === 'DE' && HANNOVER.includes(x.k)).reduce((a, x) => a + x.n, 0);
  aus += `<div class="band blatt"><div><span class="mono">Aus Hannover und Region</span><b>${ges ? prozent(100 * region / ges, 0) : '–'}</b></div>
      <div><span class="mono">Aus Deutschland</span><b>${de ? prozent(100 * de.n / ges, 0) : '–'}</b></div>
      <div><span class="mono">Länder</span><b>${n(d.summe.laender)}</b></div>
      <div><span class="mono">Orte</span><b>${n(d.orte.length)}${d.orte.length >= 20 ? '+' : ''}</b></div></div>
    <p class="fein">Hannover und Region: die Stadt und die Städte der Region Hannover (${esc(HANNOVER.join(', '))}); gezählt aus den 20 häufigsten Orten.</p>
    <div class="zwei zwei--fuell">
      <div class="stapel">
        <section class="blatt"><header><h3>Länder</h3></header>${balken(d.laender.slice(0, 10), x => esc(land(x.k) || 'Ort nicht bekannt'), null, ges)}</section>
        <section class="blatt"><header><h3>Gekommen über</h3></header>${balken(d.herkunft.slice(0, 8), x => esc(x.k), null, ges)}</section>
        <section class="blatt"><header><h3>Gerät</h3></header>${balken(d.geraete, x => esc(GERAET[x.k] || x.k), null, ges)}</section>
      </div>
      <div class="stapel">
        <section class="blatt"><header><h3>Orte</h3></header>${balken(d.orte.slice(0, 13), x => esc(x.k), x => esc(land(x.l)), ges)}</section>
        <section class="blatt"><header><h3>Sprache des Browsers</h3></header>${balken(d.sprachen, x => esc(SPRACHE[x.k] || x.k), null, ges)}</section>
      </div>
    </div>`;
  return aus;
}

function zeit() {
  const d = S.d;
  let aus = kopf('Zeit', 'Wann Gäste <em>vorbeischauen.</em>', 'Zu welcher Stunde und an welchem Wochentag die Besuche beginnen. Uhrzeit in Hannover. So siehst du, wann sich ein Beitrag zum nächsten Abend oder ein Hinweis auf freie Plätze am ehesten lohnt.', zeitraum()) + hinweisBeispiel();
  if (d.leer) return aus + leer();
  const st = d.stunden, wt = d.raster.map(r => r.reduce((a, x) => a + x, 0));
  const spitze = st.indexOf(Math.max(...st)), wspitze = wt.indexOf(Math.max(...wt));
  const abend = st.slice(18).reduce((a, x) => a + x, 0), ges = st.reduce((a, x) => a + x, 0) || 1;
  aus += `<div class="band blatt"><div><span class="mono">Meiste Besuche</span><b>${spitze}–${spitze + 1} Uhr</b></div>
      <div><span class="mono">Stärkster Tag</span><b>${WTAG[wspitze]}</b></div>
      <div><span class="mono">Ab 18 Uhr</span><b>${prozent(100 * abend / ges, 0)}</b></div>
      <div><span class="mono">Am Wochenende</span><b>${prozent(100 * (wt[5] + wt[6]) / ges, 0)}</b></div></div>
    <section class="blatt tafel">
      <header><h3>Zu welcher Uhrzeit</h3><p>Beginn des Besuchs</p></header>
      ${saeulen(st, i => i % 3 === 0 ? i + ' Uhr' : '', Object.assign((i, z) => i + ' bis ' + (i + 1) + ' Uhr: ' + mal(z, 'ein Besuch', 'Besuche'), { label: 'Besuche nach Uhrzeit' }), 'saeulen--uhr')}
    </section>
    <section class="blatt tafel">
      <header><h3>Wochentag und Stunde</h3><p>Je dunkler, desto mehr Besuche</p></header>
      ${raster(d.raster)}
    </section>
    <section class="blatt tafel">
      <header><h3>Nach Wochentag</h3></header>
      ${balken(wt.map((z, i) => ({ k: i, n: z })), x => WTAG[x.k])}
    </section>`;
  return aus;
}
function raster(r) {
  const max = Math.max(1, ...r.flat());
  const kopfzeile = '<span></span>' + Array.from({ length: 24 }, (_, h) => `<span class="raster__h">${h % 3 === 0 ? h : ''}</span>`).join('');
  return `<div class="raster" role="img" aria-label="Besuche nach Wochentag und Stunde">${kopfzeile}
    ${r.map((zeile, w) => `<span class="raster__w">${WTAG[w].slice(0, 2)}</span>` + zeile.map((z, h) => `<i style="--a:${(z / max).toFixed(3)}" data-t="${WTAG[w]}, ${h}–${h + 1} Uhr: ${mal(z, 'ein Besuch', 'Besuche')}"></i>`).join('')).join('')}</div>`;
}

function seiten() {
  const d = S.d;
  let aus = kopf('Seiten', 'Was sich Gäste <em>ansehen.</em>', 'Jede Seite der Website mit der Zahl der Aufrufe, der Zeit, die Gäste im Schnitt darauf bleiben, und wie oft sie auf dem Weg eines Gastes lag, der danach seinen Platz buchte oder sich auf die Warteliste setzte.', zeitraum()) + hinweisBeispiel();
  if (d.leer) return aus + leer();
  const max = Math.max(1, ...d.seiten.map(x => x.n));
  aus += `<section class="blatt tabelle">
    <div class="zeile zeile--kopf"><span>Seite</span><span>Aufrufe</span><span aria-hidden="true"></span><span>Zeit im Schnitt</span><span>Zum Platz</span></div>
    ${d.seiten.map((x, i) => `<div class="zeile" style="--i:${Math.min(i, 20)}"><span class="zeile__n"><b>${mitBild(x.s)}</b></span><span class="zeile__z">${n(x.n)}</span>
      <span class="rang__b"><i style="--w:${Math.max(.02, x.n / max).toFixed(3)}"></i></span><span>${x.sek != null ? dauer(x.sek, true) : '–'}</span><span>${x.buchung ? n(x.buchung) : '–'}</span></div>`).join('')}
  </section>
  <p class="fein">Nicht aufgeführte Seiten wurden in diesem Zeitraum nicht geöffnet. Die Sprache, in der der Browser eingestellt ist, steht unter «Herkunft».</p>`;
  return aus;
}

function verlauf() {
  const d = S.d, u = d.summe, v = d.vorher;
  let aus = kopf('Verlauf', 'Wie sich die Besuche <em>entwickeln.</em>', `Die letzten ${n(d.tage)} Tage neben den ${n(d.tage)} Tagen davor (${esc(datum(v.von))} bis ${esc(datum(v.bis))}). Hell im Hintergrund: derselbe Tag im Zeitraum davor.`, zeitraum()) + hinweisBeispiel();
  if (d.leer) return aus + leer();
  const viele = d.je_tag.length, schritt = viele <= 7 ? 1 : viele <= 31 ? 5 : 15;
  const zeile = (name, a, b, fmt = n, umgekehrt) => `<div class="vz"><span>${name}</span><b>${a == null ? '–' : fmt(a)}</b><em>${b == null ? '–' : fmt(b)}</em>${vergleich(a, b, umgekehrt)}</div>`;
  const zeitFmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' Min.';
  aus += `<section class="blatt tafel">
      <header><h3>Besuche je Tag</h3><p><span class="punkt"></span>dieser Zeitraum <span class="punkt punkt--hell"></span>davor</p></header>
      ${saeulen(d.je_tag.map(t => t.besuche), i => (viele - 1 - i) % schritt === 0 ? kurzDatum(d.je_tag[i].tag) : '', Object.assign((i, z) => tagWort(d.je_tag[i].tag) + ': ' + mal(z, 'ein Besuch', 'Besuche') + ' · davor ' + n(d.vor_tag[i]), { label: 'Besuche je Tag im Vergleich zum Zeitraum davor' }), 'saeulen--vgl', d.vor_tag)}
    </section>
    <div class="zwei zwei--fuell">
      <section class="blatt vergleich"><header><h3>Neben dem Zeitraum davor</h3></header>
        <div class="vz vz--kopf"><span></span><b>Jetzt</b><em>Davor</em><small></small></div>
        ${zeile('Besuche', u.besuche, v.besuche)}${zeile('Angesehene Seiten', u.seiten, v.seiten)}
        ${zeile('Seiten je Besuch', u.seiten_je_besuch, v.seiten_je_besuch, x => Number(x).toLocaleString('de-DE'))}
        ${zeile('Zeit je Besuch', u.dauer_mittel, v.dauer_mittel, zeitFmt)}${zeile('Zum Platz', u.buchung, v.buchung)}${zeile('Warteliste begonnen', u.anfrage, v.anfrage)}${zeile('Anruf oder Instagram', u.kontakt, v.kontakt)}${zeile('Route geöffnet', u.route, v.route)}
      </section>
      <section class="blatt"><header><h3>Woche für Woche</h3></header>
        ${wochen(d.wochen)}
      </section>
    </div>
    <section class="blatt tafel"><header><h3>Die wichtigsten Länder im Verlauf</h3><p>Besuche je Tag</p></header>
      <div class="laenderverlauf">${d.land_verlauf.map(x => `<div class="lv"><span>${esc(land(x.k))}<b>${n(x.n.reduce((a, z) => a + z, 0))}</b></span>${linie(x.n)}</div>`).join('')}</div>
    </section>`;
  return aus;
}
function wochen(w) {
  const max = Math.max(1, ...w.map(x => x.besuche / x.tage));
  return `<ol class="wochen">${w.map((x, i) => `<li style="--i:${i}"><span>${kurzDatum(x.von)}–${kurzDatum(x.bis)}${x.tage < 7 ? `<small>${x.tage} ${x.tage === 1 ? 'Tag' : 'Tage'}</small>` : ''}</span>
    <span class="rang__b"><i style="--w:${Math.max(.02, (x.besuche / x.tage) / max).toFixed(3)}"></i></span><b>${n(x.besuche)}</b><em>${n(x.buchung)} zum Platz</em></li>`).join('')}</ol>
    <p class="fein">Montag bis Sonntag. Angebrochene Wochen am Rand: der Balken zeigt den Schnitt je Tag.</p>`;
}
function linie(werte) {   /* kleine Verlaufslinie als SVG, Fläche darunter in Kerzenlicht */
  const b = 300, h = 54, max = Math.max(1, ...werte), st = werte.length > 1 ? b / (werte.length - 1) : b;
  const p = werte.map((z, i) => (i * st).toFixed(1) + ',' + (h - 4 - (h - 10) * z / max).toFixed(1));
  return `<svg viewBox="0 0 ${b} ${h}" preserveAspectRatio="none" aria-hidden="true"><path class="lv__f" d="M0,${h} L${p.join(' L')} L${b},${h}Z"/><path class="lv__l" d="M${p.join(' L')}"/></svg>`;
}

function buchung() {
  const d = S.d, w = d.werte;
  let aus = kopf('Zum Platz', 'Wie oft ein Besuch <em>an die Tafel führt.</em>', 'Einen Platz gibt es auf «Der Abend»: bei einem Termin mit freien Plätzen direkt buchen, sonst im Ticket auf die Warteliste. Hier steht, wie oft ein Besuch dahin führt, welche Seiten der Gast vorher ansah, dazu Anruf in der Bar, Instagram, der Weg zur Bar und zu Dirty Chicken und die Route nach Linden.', zeitraum()) + hinweisBeispiel();
  if (d.leer) return aus + leer();
  const k = (key, name, text, ohne) => { const x = w[key] || {}, da = x.von > 0;
    return `<div class="wert blatt"><span class="mono">${name}</span><b>${da ? prozent(x.anteil) : '–'}</b><p>${da ? text(x) : ohne}</p></div>`; };
  const auf = z => z === 1 ? 'Aufruf' : 'Aufrufen';
  const mal_ = z => z === 1 ? 'einmal' : n(z) + ' Mal';
  aus += `<div class="werte">
    ${k('start', 'Von der Startseite zum Platz', x => n(x.zahl) + ' von ' + n(x.von) + ' ' + auf(x.von) + ' der Startseite in Besuchen, die danach zum Platz führten', 'Die Startseite wurde noch nicht geöffnet.')}
    ${k('karte', 'Von «Alle Abende» zum Platz', x => n(x.zahl) + ' von ' + n(x.von) + ' ' + auf(x.von) + ' von «Alle Abende» in Besuchen, die danach zum Platz führten', '«Alle Abende» wurde noch nicht geöffnet.')}
    ${k('booking', 'Über die Warteliste', x => n(x.zahl) + ' von ' + n(x.von) + ' Wegen zum Platz gingen über die Warteliste, ' + mal(x.anfrage, 'ein Platz wurde', 'Plätze wurden') + ' direkt gebucht', 'Noch niemand kam zum Platz.')}
    ${k('abbruch', '«Platz buchen» ohne Buchung', x => n(x.zahl) + ' von ' + n(x.von) + ' Mal geöffnet, ohne dass gebucht wurde', '«Platz buchen» wurde noch nicht geöffnet.')}
    ${k('tisch', 'Warteliste begonnen', x => mal_(x.zahl) + ' im Ticket auf «Der Abend» begonnen, bei ' + n(x.von) + ' ' + auf(x.von), 'Noch kein Aufruf.')}
    ${k('anfrage', 'Warteliste im Fuss', x => mal_(x.zahl) + ' die E-Mail im Fuss einer Seite eingetragen, bei ' + n(x.von) + ' ' + auf(x.von) + ', davon ' + n(x.start) + ' auf der Startseite', 'Noch kein Aufruf.')}
    ${k('kontakt', 'Anruf oder Instagram', x => mal_(x.anruf) + ' die Nummer der Bar, ' + mal_(x.mail) + ' Instagram von Culinarium oder dem Team, bei ' + n(x.von) + ' ' + auf(x.von), 'Noch kein Aufruf.')}
    ${k('chat', 'Weiter zur Bar oder zu Dirty Chicken', x => mal_(x.zahl) + ' angeklickt, bei ' + n(x.von) + ' ' + auf(x.von) + ', davon ' + n(x.dc) + ' von der Seite «Dirty Chicken»', 'Noch kein Aufruf.')}
    ${k('route', 'Route geöffnet', x => mal_(x.zahl) + ' angeklickt, bei ' + n(x.von) + ' ' + auf(x.von) + ', davon ' + n(x.weg) + ' von «Der Weg»', 'Noch kein Aufruf.')}
  </div>
  <div class="zwei zwei--fuell">
    <section class="blatt"><header><h3>Welche Seiten vor dem Platz lagen</h3></header>
      ${balken(d.seiten.filter(x => x.buchung).sort((a, b) => b.buchung - a.buchung).slice(0, 8).map(x => ({ k: x.s, n: x.buchung })), x => mitBild(x.k), null, d.seiten.reduce((a, x) => a + (x.buchung || 0), 0))}</section>
    <div class="stapel">
      <section class="blatt"><header><h3>Der Weg zum Platz</h3></header>${trichter(w)}</section>
      <section class="blatt"><header><h3>Plätze Woche für Woche</h3></header>${balken(d.wochen.map(x => ({ k: x, n: x.buchung })), x => kurzDatum(x.k.von) + '–' + kurzDatum(x.k.bis), x => x.k.tage < 7 ? x.k.tage + (x.k.tage === 1 ? ' Tag' : ' Tage') : '', d.summe.buchung)}</section>
    </div>
  </div>`;
  return aus;
}
/* Weg zum Platz: dieselben Stufen und Namen liest La Maison (Fehlerbuch 10a, Stube Schäfli: nie eine eigene Ableitung, kein Anteil über 100 %).
   Besuche → «Der Abend» geöffnet (Aufrufe der Seite) → Platz gebucht oder auf der Warteliste (Besuche zum Platz). */
function trichter(w) {
  const s = S.d.summe.besuche || 1, abend = (S.d.seiten.find(x => x.s === 'abend.html') || {}).n || 0, platz = Math.min(abend, S.d.summe.buchung || 0);
  const stufen = [['Besuche', s], ['«Der Abend» geöffnet', Math.min(s, abend)], ['Platz gebucht oder auf der Warteliste', platz]];
  return `<ol class="trichter">${stufen.map(([name, z], i) => `<li style="--i:${i};--w:${Math.max(.04, z / s).toFixed(3)}"><i></i><span>${name}</span><b>${n(z)}</b>${i ? `<em>${prozent(100 * z / (stufen[i - 1][1] || 1), 0)} davon</em>` : '<em>&nbsp;</em>'}</li>`).join('')}</ol>
    <p class="fein">«Der Abend» zählt jeden Aufruf der Seite; ein Gast, der sie zweimal öffnet, zählt zweimal. Gebucht und Warteliste zählen je Besuch einmal.</p>`;
}

function zaehlung() {
  return kopf('So wird gezählt', `Was ${KLEIN} <em>weiss und was nicht.</em>`, NAME + ' zählt so wenig wie möglich und so viel wie nötig, damit du siehst, was deine Website leistet. Nach der Datenschutz-Grundverordnung\u00a0(DSGVO).') + `
  <div class="zwei">
    <section class="blatt liste-txt"><h3>Was gezählt wird</h3><ul>
      <li>Welche Seite geöffnet wurde, wann und wie lange sie im Vordergrund war</li>
      <li>Land, Ort und Region, wie sie der Anbieter aus der Verbindung ablesen kann</li>
      <li>Ob Handy, Tablet oder Rechner, und in welcher Sprache der Browser eingestellt ist</li>
      <li>Von welcher Website der Gast kam (nur der Name, etwa google.de oder instagram.com)</li>
      <li>Ob auf «Der Abend» «Platz buchen» geöffnet und ein Platz gebucht, die Warteliste begonnen oder abgeschickt (im Ticket oder im Fuss einer Seite), die Nummer der Bar gewählt, Instagram von Culinarium oder vom Team geöffnet, der Weg zur Bar oder zu Dirty Chicken oder die Route nach Linden angeklickt wurde</li></ul></section>
    <section class="blatt liste-txt"><h3>Was nie gezählt wird</h3><ul>
      <li>Kein Name, keine Mailadresse, nichts, was jemand eintippt: von einer Buchung oder der Warteliste zählt nur, dass sie abgeschickt wurde, nicht ihr Inhalt</li>
      <li>Keine Adresse der Verbindung: sie hält nur am selben Tag die Seiten eines Besuchs zusammen und wird dafür unumkehrbar verschlüsselt, nie gespeichert</li>
      <li>Kein Cookie, nichts auf dem Gerät des Gastes. Am nächsten Tag erkennt ${KLEIN} denselben Gast nicht wieder</li>
      <li>Keine Weitergabe: die Zahlen liegen nur in deinem Speicher, nicht bei Google oder einem anderen Dienst</li>
      <li>Keine automatischen Besucher wie Suchmaschinen-Roboter</li></ul></section>
  </div>
  <section class="blatt liste-txt"><h3>Gut zu wissen</h3><ul>
    <li><b>Aufbewahrung:</b> Tagesdateien älter als 400 Tage werden gelöscht.</li>
    <li><b>Grenzen:</b> Wer Werbeblocker nutzt oder die Seite in einem anderen Fenster offen lässt, zählt womöglich nicht oder kürzer. Die Zahlen zeigen die Richtung, kein Protokoll.</li>
    <li><b>Uhrzeit:</b> Alle Zeiten sind die in Hannover (deutsche Zeit).</li>
    <li><b>Datenschutzerklärung:</b> Die Zählung ist in der Datenschutzerklärung der Website beschrieben, sobald sie eingeschaltet wird.</li>
    <li><b>Zugang:</b> Bei der Übergabe an das Haus wird ${KLEIN} wie alle Werkzeuge mit Anmeldung und Passwort geschützt.</li></ul></section>`;
}

/* ---------- Start ---------- */
async function zeichenLaden() {   /* das «C» der Wortmarke aus dem Kleid (WO_HAUS.zeichen), einmal geladen, überall per <use>; Füllung aus der Schriftfarbe */
  try { const r = await fetch(WO_HAUS.zeichen); const t = await r.text(); const m = t.match(/<svg[^>]*>([\s\S]*)<\/svg>/); if (m) $('#zeichen').innerHTML = m[1].replace(/<!--[\s\S]*?-->/g, '').replace(/\sfill="[^"]*"/g, ''); } catch (e) { /* ohne Zeichen geht alles weiter */ }
}
(async function () {
  $('#tuer h1').textContent = NAME + ' startet nicht.'; document.title = NAME + ' · ' + WO.haus.name; $('#rand').setAttribute('aria-label', 'Bereiche: ' + NAME);   /* Name nur aus dem Kleid */
  try { const t = +localStorage.getItem('culinarium-registre-tage'); if (t === 7 || t === 30 || t === 90) S.tage = t; } catch (e) { /* privat */ }
  const h = location.hash.slice(1); if (TITEL[h]) S.ansicht = h;
  const zeichen = zeichenLaden();
  try { const r = await fetch('seiten.json', { cache: 'no-store' }); if (r.ok) S.namen = await r.json(); } catch (e) { /* dann stehen die Dateinamen da */ }
  try { const r = await fetch('seiten-bilder.json', { cache: 'no-store' }); if (r.ok) S.bilder = await r.json(); } catch (e) { /* dann ohne Bild */ }
  try { await lade(); }
  catch (e) {
    $('#tuer').hidden = false; $('#tuer-t').textContent = e.message; $('#ansicht').innerHTML = '';
    if (!$('#tuer [data-neu]')) { $('#tuer').insertAdjacentHTML('beforeend', `<p class="tuer-zu__kn">${WO.knopf('Neu laden', 'verlauf', 'gold', { attr: 'data-neu' })}${WO.knopf(STUBE_N, 'haus', 'hell', { href: STUBE })}</p>`); $('#tuer [data-neu]').onclick = () => location.reload(); }
    return;
  }
  await zeichen;
  rand(); leiste(); zeichne();
  /* Tor 30.10.2026: in niedrigen Fenstern kommt die Leiste erst nach dem ersten Scrollen (culinarium.css, Punkt 22) */
  const gerollt = () => document.body.classList.toggle('rg-gerollt', scrollY > 40); addEventListener('scroll', gerollt, { passive: true }); gerollt();
  window.addEventListener('hashchange', () => { const z = location.hash.slice(1); if (TITEL[z] && z !== S.ansicht) gehe(z); });
  window.BG_REGISTRE = 1;
  window.BG_REGISTRE_STAND = () => JSON.parse(JSON.stringify(Object.assign({ _ablage: S.ablage, _uhr: S.uhr }, S.d)));   /* nur lesen: was gerade angezeigt wird (Prüfläufe) */
})();

/* Lange Besuche (Schäfli 21.10.2026, selbst gefunden bei 1366 × 650): ist die Karte eines Besuchs höher als der Platz zwischen Kopf und Leiste, klebte sie oben
   und ihr Ende (der Weg, der Hinweis) lag unter der Leiste, nie erreichbar. Dann klebt sie so, dass ihr Ende über der Leiste steht; beim Scrollen läuft sie
   bis dorthin mit. Passt sie, bleibt alles wie in den anderen Häusern (oben unter dem Kopf). Nur am Rechner (ab 1181 px), nur über top. */
(function () {
  let w = 0;
  function passe() {
    w = 0; const f = $('#ansicht .detail'); if (!f) return;
    if (!matchMedia('(min-width:1181px)').matches) { f.style.top = ''; return; }
    const h = f.offsetHeight, frei = innerHeight - 188;
    f.style.top = h > frei ? Math.round(innerHeight - 96 - h) + 'px' : '';
  }
  const bald = () => { if (!w) w = requestAnimationFrame(passe); };
  new MutationObserver(bald).observe($('#ansicht'), { childList: true, subtree: true });
  addEventListener('resize', bald);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(bald);
})();
