/* Auswahllisten im Stil des Hauses (Robert 11.10.2026: «überall, wo es solche Auswahlmöglichkeiten gibt, im Stil des Hauses,
   und immer, wenn sowas gebaut wird, direkt mit»). Jedes <select> der Seite bekommt eine eigene Liste: Creme-Karte mit Goldkante,
   Namen in der Titelschrift, gewählter Eintrag nachtblau mit Goldraute. Das echte <select> bleibt (unsichtbar) im Formular und trägt
   den Wert, deshalb funktionieren Formulare, Rechner und Mail-Anfragen unverändert; jede Wahl löst «change» und «input» aus.
   Auch später eingefügte Listen (z. B. gast.js) werden übernommen. Ausgenommen: die Buchungsleiste (form[data-leiste]) mit ihrer
   eigenen Gäste-Liste und alles in [data-eigene-wahl]. Tastatur: Pfeile, Pos1/Ende, Anfangsbuchstabe, Enter, Escape, Tab.
   Die Liste hängt am <body> (oder im offenen <dialog>), damit kein überlaufender Abschnitt sie abschneidet; sie öffnet nach unten
   oder, wenn unten kein Platz ist, nach oben. Bewegung nur über transform und opacity. */
(function () {
  'use strict';
  var doc = document, offen = null, nr = 0;
  var PFEIL = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';

  function ausgenommen(s) { return s.multiple || s.size > 1 || s.closest('form[data-leiste],form[data-leiste-kal],[data-eigene-wahl]') || s.classList.contains('lw-nativ'); }

  function baue(s) {
    if (s.dataset.hwahl || ausgenommen(s)) return;
    s.dataset.hwahl = '1';
    var id = 'hwahl' + (++nr);
    var hülle = doc.createElement('span'); hülle.className = 'hwahl';
    s.parentNode.insertBefore(hülle, s); hülle.appendChild(s);
    s.classList.add('hwahl-nativ'); s.tabIndex = -1; s.setAttribute('aria-hidden', 'true');
    var k = doc.createElement('button'); k.type = 'button'; k.className = 'hwahl-knopf';
    k.setAttribute('aria-haspopup', 'listbox'); k.setAttribute('aria-expanded', 'false'); k.setAttribute('aria-controls', id);
    var lab = s.closest('label'); var titel = lab ? (lab.querySelector('span') || {}).textContent : s.getAttribute('aria-label');
    if (titel) k.setAttribute('aria-label', titel.trim());
    k.innerHTML = '<b class="hwahl-wert"></b>' + PFEIL;
    hülle.appendChild(k);
    var cs = getComputedStyle(s);   // Schrift und Farbe des Feldes übernehmen, damit der Knopf in jede Leiste passt
    k.style.fontFamily = cs.fontFamily; k.style.fontSize = cs.fontSize; k.style.fontWeight = cs.fontWeight; k.style.color = cs.color; k.style.letterSpacing = cs.letterSpacing;
    ['borderBottom', 'borderTop', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'backgroundColor', 'borderRadius', 'boxShadow', 'minHeight'].forEach(function (x) { if (cs[x] && cs[x] !== 'none' && cs[x] !== 'rgba(0, 0, 0, 0)') k.style[x] = cs[x]; });   // Linie, Polster und Fläche des Feldes übernehmen
    var l = doc.createElement('ul'); l.className = 'hwahl-liste'; l.id = id; l.setAttribute('role', 'listbox'); l.tabIndex = -1;
    if (titel) l.setAttribute('aria-label', titel.trim());
    var g = { s: s, k: k, l: l, j: 0 };
    s._gw = g;
    k.addEventListener('click', function () { offen === g ? zu(true) : auf(g); });
    k.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); auf(g); } });
    l.addEventListener('keydown', function (e) { taste(g, e); });
    l.addEventListener('click', function (e) { var o = e.target.closest('[role=option]'); if (o) waehle(g, +o.dataset.i); });
    l.addEventListener('mousemove', function (e) { var o = e.target.closest('[role=option]'); if (o) markiere(g, +o.dataset.i); });
    s.addEventListener('change', function () { zeige(g); });
    var f = s.form; if (f) f.addEventListener('reset', function () { setTimeout(function () { zeige(g); }, 0); });
    zeige(g);
  }

  function zeige(g) { var o = g.s.options[g.s.selectedIndex]; g.k.querySelector('.hwahl-wert').textContent = o ? o.textContent : ''; g.k.classList.toggle('hwahl-leer', !!(o && !o.value && o.disabled)); }

  function fuelle(g) {
    var h = '';
    [].forEach.call(g.s.options, function (o, i) {
      if (o.hidden) return;
      var ja = i === g.s.selectedIndex;
      h += '<li role="option" data-i="' + i + '" aria-selected="' + ja + '"' + (o.disabled ? ' aria-disabled="true"' : '') + ' style="--i:' + i + '"><i></i><span></span></li>';
    });
    g.l.innerHTML = h;
    [].forEach.call(g.l.children, function (li) { li.querySelector('span').textContent = g.s.options[+li.dataset.i].textContent; });
  }

  function lage(g) {
    var r = g.k.closest('.hwahl').getBoundingClientRect(), feld = g.k.closest('label,.feld,.anf__f') || g.k;
    var rf = feld.getBoundingClientRect(), b = Math.max(rf.width, 240), hl = g.l.offsetHeight, unten = innerHeight - rf.bottom, oben = rf.top;
    var nachOben = unten < hl + 16 && oben > unten;
    var x = Math.min(Math.max(8, rf.left), innerWidth - b - 8);
    g.l.style.left = x + 'px'; g.l.style.width = b + 'px';
    g.l.style.top = (nachOben ? rf.top - hl - 8 : rf.bottom + 8) + 'px';
    g.l.classList.toggle('hwahl-oben', nachOben);
  }

  function auf(g) {
    if (offen) zu(false);
    fuelle(g);
    (g.s.closest('dialog[open]') || doc.body).appendChild(g.l);
    lage(g);
    offen = g; g.k.setAttribute('aria-expanded', 'true'); g.k.closest('.hwahl').classList.add('hwahl--offen');
    markiere(g, Math.max(0, g.s.selectedIndex));
    requestAnimationFrame(function () { g.l.classList.add('hwahl-auf'); });
    g.l.focus({ preventScroll: true });
    addEventListener('scroll', mit, true); addEventListener('resize', mit);
  }
  var takt = 0;
  function mit() { if (!offen || takt) return; takt = requestAnimationFrame(function () { takt = 0; if (offen) lage(offen); }); }

  function zu(fokus) {
    var g = offen; if (!g) return;
    offen = null; g.k.setAttribute('aria-expanded', 'false'); g.k.closest('.hwahl').classList.remove('hwahl--offen');
    g.l.classList.remove('hwahl-auf');
    removeEventListener('scroll', mit, true); removeEventListener('resize', mit);
    setTimeout(function () { if (offen !== g && g.l.parentNode) g.l.parentNode.removeChild(g.l); }, 320);
    if (fokus) g.k.focus({ preventScroll: true });
  }

  function markiere(g, i) {
    var lis = [].slice.call(g.l.children); if (!lis.length) return;
    var li = g.l.querySelector('[data-i="' + i + '"]') || lis[0];
    lis.forEach(function (x) { x.classList.toggle('hwahl-hier', x === li); });
    g.j = +li.dataset.i; g.l.setAttribute('aria-activedescendant', '');
    var r = li.getBoundingClientRect(), rl = g.l.getBoundingClientRect();
    if (r.bottom > rl.bottom) g.l.scrollTop += r.bottom - rl.bottom; else if (r.top < rl.top) g.l.scrollTop -= rl.top - r.top;
  }

  function waehle(g, i) {
    var o = g.s.options[i]; if (!o || o.disabled) return;
    g.s.selectedIndex = i;
    g.s.dispatchEvent(new Event('input', { bubbles: true })); g.s.dispatchEvent(new Event('change', { bubbles: true }));
    zeige(g); zu(true);
  }

  var suche = '', suchUhr = 0;
  function taste(g, e) {
    var lis = [].slice.call(g.l.children).filter(function (x) { return !x.hasAttribute('aria-disabled'); });
    var pos = lis.findIndex(function (x) { return +x.dataset.i === g.j; });
    if (e.key === 'ArrowDown') { e.preventDefault(); markiere(g, +lis[Math.min(lis.length - 1, pos + 1)].dataset.i); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); markiere(g, +lis[Math.max(0, pos - 1)].dataset.i); }
    else if (e.key === 'Home') { e.preventDefault(); markiere(g, +lis[0].dataset.i); }
    else if (e.key === 'End') { e.preventDefault(); markiere(g, +lis[lis.length - 1].dataset.i); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); waehle(g, g.j); }
    else if (e.key === 'Escape') { e.preventDefault(); zu(true); }
    else if (e.key === 'Tab') { zu(false); }
    else if (e.key.length === 1) {
      clearTimeout(suchUhr); suche += e.key.toLowerCase(); suchUhr = setTimeout(function () { suche = ''; }, 700);
      var t = lis.find(function (x) { return x.textContent.trim().toLowerCase().replace(/^[«"„]/, '').indexOf(suche) === 0; }); if (t) markiere(g, +t.dataset.i);
    }
  }

  doc.addEventListener('pointerdown', function (e) { if (offen && !offen.l.contains(e.target) && !offen.k.contains(e.target)) zu(false); }, true);

  function alle(wurzel) { [].forEach.call((wurzel || doc).querySelectorAll('select'), baue); }
  // Werte, die andere Skripte direkt setzen (s.value = …), beim nächsten Blick nachziehen
  setInterval(function () { [].forEach.call(doc.querySelectorAll('select[data-hwahl]'), function (s) { var g = s._gw; if (g && g.k.querySelector('.hwahl-wert').textContent !== (s.options[s.selectedIndex] || {}).textContent) zeige(g); }); }, 600);
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { alle(); }); else alle();
  new MutationObserver(function (ms) { ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType !== 1) return; if (n.tagName === 'SELECT') baue(n); else if (n.querySelector) alle(n); }); }); }).observe(doc.documentElement, { childList: true, subtree: true });
  window.gbrAuswahl = { baue: baue, alle: alle };
})();
