/* Drucksachen-Studio · Hilfe: Begrüssung beim ersten Besuch, Führung Schritt für Schritt am echten Studio,
   Demo-Video mit Kapiteln, Tastenkürzel. Alles jederzeit über «Hilfe» oben wieder aufrufbar. */
(function () {
  const $ = s => document.querySelector(s);
  const HAUS = new URLSearchParams(location.search).get('haus') || 'culinarium';
  const GESEHEN = `ds-${HAUS}-willkommen`;
  const merk = () => { try { localStorage.setItem(GESEHEN, '1'); } catch (e) { } };
  const gesehen = () => { try { return localStorage.getItem(GESEHEN) === '1'; } catch (e) { return true; } };
  const tab = t => { const b = document.querySelector(`.reiter [data-tab="${t}"]`); if (b) b.click(); };
  const PFEIL = '<i><svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></i>';
  const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/></svg>';

  /* ---------- Schritte der Führung ---------- */
  const SCHRITTE = [
    { ziel: '#btnNeu', film: null, titel: 'Übersicht und neue Drucksache',
      text: 'Über «Übersicht» kommst du zur Startseite. Dort liegen alle deine Drucksachen zum Öffnen, Umbenennen, Kopieren oder als PDF. Oben beschreibst du in einem Satz, was neu entstehen soll, und das Studio legt fünf Entwürfe an. Du nimmst den, der dir am besten gefällt.' },
    { ziel: '#auftrag', film: 'schritt-1', vor: () => tab('entwerfen'), titel: 'Sagen, was du brauchst',
      text: 'Schreib hier in einem Satz, welche Drucksache entstehen soll, zum Beispiel «Ein Plakat für den nächsten Abend». Farben, Schriften, Fotos und Angaben des Hauses kennt das Studio schon.',
      extra: { t: 'Beispiel einsetzen', tu: () => { $('#auftrag').value = 'Ein Plakat für den nächsten Abend, vorne die Illustration, hinten die Daten'; } } },
    { ziel: '#btnEntwerfen', film: 'schritt-2', titel: 'Fünf Entwürfe, einer gewinnt',
      text: 'Ein Klick, und nach etwa zwanzig Sekunden stehen fünf Entwürfe nebeneinander: gleiche Angaben, verschiedene Gestaltung. Du klickst den schönsten an und arbeitest darin weiter. Gefällt keiner, holst du fünf neue.' },
    { ziel: '#wirt', film: 'schritt-3', titel: 'Das Blatt',
      text: 'Hier liegt deine Drucksache. Einmal klicken wählt einen Teil aus, mit gedrückter Maus verschiebst du ihn. Doppelklick auf einen Text, und du schreibst direkt hinein. Der dunkle Rand ist der Beschnitt: Was dort liegt, schneidet die Druckerei ab.' },
    { ziel: '#rechts', film: 'schritt-4', titel: 'Anpassen',
      text: 'Rechts änderst du, was du ausgewählt hast: Schrift, Grösse, Farbe oder das Foto. Ist nichts ausgewählt, stellst du hier das Format und den Aufbau der ganzen Seite um. Es gibt nur die Farben und Schriften des Hauses, so bleibt alles im Stil.' },
    { ziel: '#werkzeug', film: 'schritt-5', titel: 'Etwas hinzufügen',
      text: 'Ein neuer Titel, ein Text, ein Foto, das Zeichen des Hauses oder eine Linie: ein Klick, und es liegt auf dem Blatt. Oben rechts in dieser Leiste wechselst du zwischen Vorder- und Rückseite.' },
    { ziel: '.reiter', film: 'schritt-6', titel: 'Vorlagen, Fotos und Ablage',
      text: 'Unter «Fotos» liegen alle Bilder des Hauses, nach Bereichen sortiert, dazu deine eigenen: hochladen oder einfach aufs Blatt ziehen. Unter «Vorlagen» findest du fertige Aufbauten, in der «Ablage» alles, was du gemacht hast. Gespeichert wird von selbst.' },
    { ziel: '#btnZurueck', film: 'schritt-7', titel: 'Ein Schritt zurück',
      text: 'Etwas verrutscht oder gelöscht? Dieser Pfeil macht den letzten Schritt rückgängig, der daneben holt ihn zurück. Auf der Tastatur geht das mit ⌘ Z.' },
    { ziel: '#btnPruefen', film: 'schritt-8', titel: 'Die Druckprüfung',
      text: 'Das Studio prüft für dich, ob alles druckbereit ist: offene Lücken wie [Preis], Text zu nah am Rand, Fotos, die zu unscharf würden. Steht hier eine Null, ist alles in Ordnung. Ein Klick zeigt, was noch fehlt.' },
    { ziel: '#btnSpeichern', film: 'schritt-9', titel: 'Druckfertig speichern',
      text: 'Zum Schluss speicherst du die Drucksache als PDF für die Druckerei. Beschnitt, Schriften und Fotos sind schon richtig eingestellt, du gibst die Datei einfach weiter. Für Instagram gibt es hier auch ein Bild.' },
  ];

  /* ---------- Begrüssung ---------- */
  function willkommen() {
    const M = window.DS && DS.M;
    schicht(`<div class="hk hk--gross hk--ecke" role="dialog" aria-label="Willkommen">
      <div class="hk__zeichen">${M ? DS.zeichenSvg(M, 'currentColor') : ''}</div>
      <h2>Willkommen in der Plakatwerkstatt</h2>
      <p class="hk__unter">Flyer, Karten, Aushänge und Gutscheine im Stil des ${M ? M.name : 'Hauses'}, ganz ohne Grafikprogramm.</p>
      <div class="hk__drei">
        <div><span class="hk__bild"><svg viewBox="0 0 48 48"><path d="M10 34h28M10 26h20M10 18h28"/><path d="m33 30 7-7 3 3-7 7-4 1z"/></svg></span><b>Sagen</b><p>In einem Satz beschreiben, was du brauchst.</p></div>
        <div><span class="hk__bild"><svg viewBox="0 0 48 48"><rect x="6" y="14" width="10" height="14" rx="1.5"/><rect x="19" y="10" width="10" height="14" rx="1.5"/><rect x="32" y="14" width="10" height="14" rx="1.5"/><path d="m20 33 4 4 7-8"/></svg></span><b>Wählen</b><p>Fünf Entwürfe im Stil des Hauses, du nimmst den schönsten.</p></div>
        <div><span class="hk__bild"><svg viewBox="0 0 48 48"><rect x="11" y="8" width="26" height="34" rx="2"/><path d="M17 16h14M17 22h10"/><path d="m27 30 9 3-4 1.5-1.5 4z"/></svg></span><b>Anpassen</b><p>Texte, Fotos und Format direkt auf dem Blatt ändern.</p></div>
        <div><span class="hk__bild"><svg viewBox="0 0 48 48"><path d="M14 18V8h20v10"/><rect x="8" y="18" width="32" height="14" rx="3"/><path d="M14 28h20v12H14z"/><path d="M19 33h10M19 37h6"/></svg></span><b>Drucken</b><p>Als PDF speichern und der Druckerei geben.</p></div>
      </div>
      <div class="hk__knoepfe">
        <button class="knopf knopf--voll" data-hk="fuehrung">Kurze Führung starten${PFEIL}</button>
        <button class="hk__video" data-hk="video">${PLAY}<span>Demo-Video ansehen</span></button>
      </div>
      <button class="hk__leise" data-hk="los">Gleich loslegen</button>
    </div>`, false);   /* K33 (Tor 30.10.2026): als ruhige Karte an der Ecke wie beim Rivage, die Seite bleibt hell und bedienbar */
    merk();
  }

  /* ---------- Schicht (Hintergrund + Karte) ---------- */
  let ebene;
  function schicht(html, dunkel) {
    zu();
    ebene = document.createElement('div');
    ebene.className = 'hs' + (dunkel ? ' hs--dunkel' : '');
    ebene.innerHTML = html;
    document.body.appendChild(ebene);
    ebene.addEventListener('click', klick);
    requestAnimationFrame(() => ebene && ebene.classList.add('an'));
    return ebene;
  }
  function zu() {
    if (ebene) { ebene.remove(); ebene = null; }
    removeEventListener('resize', setze); document.removeEventListener('keydown', taste);
  }
  function klick(e) {
    const b = e.target.closest('[data-hk]'); if (!b) return;
    const a = b.dataset.hk;
    if (a === 'fuehrung') { if (window.DSStart) DSStart.zu(); starte(0); }
    else if (a === 'video') video();
    else if (a === 'los' || a === 'zu') {
      zu(); tab('entwerfen');
      if (window.DSStart && !DSStart.offen() && window.DSStudio && DSStudio.doc().platzhalter) DSStart.zeige();   // noch nichts begonnen: zur Auswahl
    }
    else if (a === 'weiter') starte(nr + 1);
    else if (a === 'zurueck') starte(nr - 1);
    else if (a === 'extra') { SCHRITTE[nr].extra.tu(); b.textContent = 'Eingesetzt'; b.disabled = true; }
    else if (a === 'kapitel') { const v = ebene.querySelector('video'); v.currentTime = +b.dataset.t; v.play(); }
  }

  /* ---------- Führung ---------- */
  let nr = 0;
  function starte(i) {
    if (i >= SCHRITTE.length) return ende();
    nr = Math.max(0, i);
    const s = SCHRITTE[nr];
    if (s.vor) s.vor();
    if (!ebene || !ebene.classList.contains('hs--tour')) {
      schicht(`<div class="hs__loch"></div><div class="hk hk--tour" role="dialog" aria-live="polite"></div>`);
      ebene.classList.add('hs--tour');
      addEventListener('resize', setze); document.addEventListener('keydown', taste);
    }
    const k = ebene.querySelector('.hk--tour');
    const film = s.film ? `hilfe/${s.film}` : '';   // Schritt ohne Film zeigt keinen (Fundliste 22: schritt-neu fehlte, 404)
    k.innerHTML = `${film ? `<div class="hk__film"><video src="${film}.mp4" poster="${film}.jpg" autoplay muted loop playsinline preload="auto"></video></div>` : ''}
      <div class="hk__fort"><span style="width:${(nr + 1) / SCHRITTE.length * 100}%"></span></div>
      <small>Schritt ${nr + 1} von ${SCHRITTE.length}</small>
      <h3>${s.titel}</h3><p>${s.text}</p>
      ${s.extra ? `<button class="leicht hk__extra" data-hk="extra">${s.extra.t}</button>` : ''}
      <div class="hk__nav">
        <button class="hk__leise" data-hk="zu">Beenden</button>
        <span></span>
        ${nr ? '<button class="leicht" data-hk="zurueck">Zurück</button>' : ''}
        <button class="knopf" data-hk="weiter">${nr === SCHRITTE.length - 1 ? 'Fertig' : 'Weiter'}${PFEIL}</button>
      </div>`;
    const v = k.querySelector('video') || document.createElement('video');
    v.addEventListener('error', () => k.querySelector('.hk__film')?.remove());
    v.addEventListener('loadedmetadata', setze);
    v.play().catch(() => { });
    k.querySelector('.hk__film')?.addEventListener('click', () => v.paused ? v.play() : v.pause());
    setze();
    k.querySelector('[data-hk="weiter"]').focus({ preventScroll: true });
  }
  function setze() {
    if (!ebene || !ebene.classList.contains('hs--tour')) return;
    const s = SCHRITTE[nr], z = document.querySelector(s.ziel);
    const loch = ebene.querySelector('.hs__loch'), k = ebene.querySelector('.hk--tour');
    if (!z) { loch.style.cssText = 'left:50%;top:50%;width:0;height:0'; return; }
    z.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const r = z.getBoundingClientRect(), p = 8, vw = innerWidth, vh = innerHeight;
    const L = Math.max(4, r.left - p), T = Math.max(4, r.top - p), W = Math.min(vw - 8, r.width + 2 * p), H = Math.min(vh - 8, r.height + 2 * p);
    Object.assign(loch.style, { left: L + 'px', top: T + 'px', width: W + 'px', height: H + 'px' });
    const kw = Math.min(460, vw - 32), kh = k.offsetHeight, g = 18;
    let x, y;
    if (r.top < 90 && vh - (T + H) > kh + g + 16) { x = L + W - kw; y = T + H + g; }   // Knöpfe oben: darunter
    else if (vw - (L + W) > kw + g + 16) { x = L + W + g; y = T; }         // rechts daneben
    else if (L > kw + g + 16) { x = L - kw - g; y = T; }                  // links daneben
    else if (vh - (T + H) > kh + g + 16) { x = L; y = T + H + g; }        // darunter
    else { x = L; y = T - kh - g; }                                       // darüber
    x = Math.min(Math.max(16, x), vw - kw - 16); y = Math.min(Math.max(16, y), vh - kh - 16);
    Object.assign(k.style, { left: x + 'px', top: y + 'px', width: kw + 'px' });
  }
  function taste(e) {
    if (e.key === 'Escape') { zu(); return; }
    if (!ebene || !ebene.classList.contains('hs--tour')) return;
    if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); starte(nr + 1); }
    if (e.key === 'ArrowLeft') starte(nr - 1);
  }
  function ende() {
    schicht(`<div class="hk hk--gross" role="dialog" aria-modal="true">
      <div class="hk__zeichen">${DS.zeichenSvg(DS.M, 'currentColor')}</div>
      <h2>Mehr braucht es nicht</h2>
      <p class="hk__unter">Sagen, wählen, anpassen, drucken. Alle deine Drucksachen findest du oben unter «Übersicht». Führung und Video findest du jederzeit unter «Hilfe».</p>
      <div class="hk__knoepfe">
        <button class="knopf knopf--voll" data-hk="los">Loslegen${PFEIL}</button>
        <button class="hk__video" data-hk="video">${PLAY}<span>Demo-Video ansehen</span></button>
      </div>
    </div>`, true);
  }

  /* ---------- Video ---------- */
  async function video() {
    let kapitel = [];
    try { kapitel = await (await fetch('hilfe/kapitel.json', { cache: 'no-store' })).json(); } catch (e) { }
    const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    schicht(`<div class="hk hk--video" role="dialog" aria-modal="true" aria-label="Demo-Video">
      <div class="hk__kopf"><h2>So arbeitet das Studio</h2><button class="hk__x" data-hk="los" aria-label="Schliessen"><svg viewBox="0 0 24 24"><path d="M9 14.5 4 9.5l5-5M4 9.5h11a5 5 0 0 1 0 10h-3"/></svg></button></div>
      <video src="hilfe/demo.mp4" poster="hilfe/demo-poster.jpg" controls playsinline preload="metadata"></video>
      ${kapitel.length ? `<div class="hk__kapitel">${kapitel.map(k => `<button data-hk="kapitel" data-t="${k.t}"><b>${k.titel}</b><span>${fmt(k.t)}</span></button>`).join('')}</div>` : ''}
      <div class="hk__knoepfe hk__knoepfe--zeile"><button class="leicht" data-hk="fuehrung">Führung am Studio starten</button><button class="knopf" data-hk="los">Selbst ausprobieren${PFEIL}</button></div>
    </div>`, true);
    const v = ebene.querySelector('video');
    v.addEventListener('error', () => { v.replaceWith(Object.assign(document.createElement('p'), { className: 'hk__unter', textContent: 'Das Video konnte nicht geladen werden. Die Führung am Studio zeigt dasselbe Schritt für Schritt.' })); });
    v.play().catch(() => { });
    document.addEventListener('keydown', taste);
  }

  /* ---------- Hilfe-Menü ---------- */
  function hilfeMenue() {
    schicht(`<div class="hk hk--menue" role="dialog" aria-modal="true" aria-label="Hilfe">
      <div class="hk__kopf"><h2>Hilfe</h2><button class="hk__x" data-hk="los" aria-label="Schliessen"><svg viewBox="0 0 24 24"><path d="M9 14.5 4 9.5l5-5M4 9.5h11a5 5 0 0 1 0 10h-3"/></svg></button></div>
      <button class="hk__zeile" data-hk="video"><span class="hk__ic">${PLAY}</span><span><b>Demo-Video ansehen</b><small>Gut eine Minute: ein Flyer vom Satz bis zum PDF</small></span></button>
      <button class="hk__zeile" data-hk="fuehrung"><span class="hk__ic"><svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span><span><b>Führung am Studio</b><small>Zehn kurze Schritte, direkt an den Knöpfen</small></span></button>
      <h3>Auf der Tastatur</h3>
      <dl class="hk__tasten">
        <dt>Doppelklick</dt><dd>Text schreiben oder Foto-Ausschnitt schieben</dd>
        <dt>Pfeiltasten</dt><dd>Gewähltes um einen halben Millimeter schieben, mit ⇧ um fünf</dd>
        <dt>⌘ Z · ⇧ ⌘ Z</dt><dd>Rückgängig · Wiederholen</dd>
        <dt>⌘ D</dt><dd>Gewähltes verdoppeln</dd>
        <dt>⌫</dt><dd>Gewähltes löschen</dd>
        <dt>Esc</dt><dd>Auswahl aufheben, Schreiben beenden</dd>
        <dt>Alt beim Ziehen</dt><dd>ohne Einrasten an Kanten und Mitte</dd>
      </dl>
    </div>`, true);
    document.addEventListener('keydown', taste);
  }

  function los() {
    $('#btnHilfe').addEventListener('click', hilfeMenue);
    const q = new URLSearchParams(location.search);
    if (q.get('hilfe') === 'video') video();
    else if (q.get('hilfe') === 'fuehrung') starte(0);
    else if (!gesehen() && !q.has('demo') && window.self === window.top) willkommen();   // in der Werkbank (im Laptop-Bildschirm) keine Begrüssung
  }
  if (window.__ST) los(); else document.addEventListener('ds:bereit', los, { once: true });
  window.DSHilfe = { willkommen, starte, video, hilfeMenue, zu };
})();
