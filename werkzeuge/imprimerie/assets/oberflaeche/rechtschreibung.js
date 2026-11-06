/* rechtschreibung.js · Rechtschreibung in den Werkzeugen des Culinarium (06.11.2026).
   Robert 03.11.2026 nach dem Gespräch mit Rudi: «Haben wir in den Tools, wo wir Sachen anpassen, die auf die Website landen, Rechtschreibprüfungen eingebaut?»
   1. Jedes Textfeld (Eingabe, Textfläche, direkt bearbeitbarer Text) bekommt die deutsche Unterstreichung des Browsers.
   2. Verlässt man ein Feld, prüft der Rechtschreib-Dienst des Macs (rechtschreibung/dienst.py, 127.0.0.1:9089) den Text. Unbekannte Wörter erscheinen unten rechts
      mit Vorschlägen; ein Tippen auf den Vorschlag ersetzt das Wort im Feld. Wörter der eigenen Websites (Namen, Drinks, Orte) gelten als richtig.
   Läuft der Dienst nicht, bleibt die Unterstreichung des Browsers. Nichts wird gespeichert oder verschickt. Bewegung nur transform/opacity. */
(function () {
  var DIENST = 'http://127.0.0.1:9089/pruefe';
  var NICHT = /^(email|url|tel|number|date|time|datetime-local|month|week|password|color|range|file|hidden|checkbox|radio|search)$/i;
  var NAME_NICHT = /kontakt|mail|link|url|web|adresse|telefon|tel\b|preis|zahl|code|schluessel|passwort/i;
  var LABEL_NICHT = /name|^für$|^von$|kürzel|nummer|kontakt|e-mail|telefon|adresse|instagram|link/i;   // Namen und Kennungen werden nicht geprüft (Fund Gutscheine 06.11.2026: «Özdemir»)
  function feldOk(el) {
    if (!el || el.closest('[data-ohne-rechtschreibung]')) return false;
    var lb = el.closest('label'), lt = lb && lb.querySelector('span') ? lb.querySelector('span').textContent.trim() : (el.getAttribute('aria-label') || '');
    if (lt && LABEL_NICHT.test(lt)) return false;
    if (el.isContentEditable) return true;
    if (el.tagName === 'TEXTAREA') return !NAME_NICHT.test(el.name || el.id || '');
    if (el.tagName === 'INPUT') return !NICHT.test(el.type || 'text') && !NAME_NICHT.test((el.name || '') + ' ' + (el.id || '') + ' ' + (el.placeholder || ''));
    return false;
  }
  function markiere(r) {
    (r || document).querySelectorAll('input, textarea, [contenteditable=""], [contenteditable="true"]').forEach(function (el) {
      if (!feldOk(el) || el.dataset.rs) return;
      el.dataset.rs = '1'; el.setAttribute('spellcheck', 'true'); if (!el.getAttribute('lang')) el.setAttribute('lang', 'de');
    });
  }
  var text = function (el) { return el.isContentEditable ? el.innerText : el.value; };
  var tafel, aktuell = null, laeuft = 0;
  function tafelBauen() {
    if (tafel) return tafel;
    var st = document.createElement('style');
    st.textContent = '.rs-tafel{position:fixed;right:18px;bottom:96px;z-index:2147483000;width:min(380px,calc(100vw - 36px));padding:16px 16px 14px;border-radius:18px;background:#16141b;color:#faf4f4;box-shadow:inset 0 0 0 1px rgba(207,114,51,.45),0 26px 50px -20px rgba(0,0,0,.6);font:400 14px/1.4 var(--wo-sans,system-ui);opacity:0;transform:translateY(14px);pointer-events:none;transition:opacity .35s,transform .45s cubic-bezier(.2,.8,.2,1)}'
      + '.rs-tafel.auf{opacity:1;transform:none;pointer-events:auto}'
      + '.rs-tafel__k{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}'
      + '.rs-tafel__k span{font:400 9.5px/1.3 var(--wo-mono,monospace);letter-spacing:.16em;text-transform:uppercase;color:#f4ad93}'
      + '.rs-tafel__k button{border:0;background:none;color:rgba(250,244,244,.6);font:inherit;font-size:12.5px;cursor:pointer;padding:4px 2px}'
      + '.rs-zeile{padding:9px 0;border-top:1px solid rgba(250,244,244,.1)}'
      + '.rs-zeile b{display:block;margin-bottom:7px;font-weight:400;font-size:15px}.rs-zeile b s{text-decoration:wavy underline #cf7233;text-underline-offset:3px;text-decoration-skip-ink:none;text-decoration-line:underline}'
      + '.rs-v{display:flex;flex-wrap:wrap;gap:6px}.rs-v button{padding:7px 11px;border:0;border-radius:999px;background:#faf4f4;color:#16141b;font:inherit;font-size:13.5px;cursor:pointer;transition:transform .25s}'
      + '.rs-v button:active{transform:scale(.95)}.rs-v button.rs-lass{background:none;color:rgba(250,244,244,.7);box-shadow:inset 0 0 0 1px rgba(250,244,244,.25)}'
      + '@media (max-width:600px){.rs-tafel{right:12px;left:12px;width:auto;bottom:84px}}';
    document.head.appendChild(st);
    tafel = document.createElement('div'); tafel.className = 'rs-tafel'; tafel.setAttribute('role', 'status'); tafel.setAttribute('aria-live', 'polite');
    document.body.appendChild(tafel);
    return tafel;
  }
  function zu() { if (tafel) tafel.classList.remove('auf'); aktuell = null; }
  function ersetze(el, f, neu) {
    if (el.isContentEditable) {   // im Textknoten an der Stelle ersetzen, Gestaltung bleibt
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, pos = 0, ziel = f.start;
      var ganz = el.innerText;
      while ((n = w.nextNode())) {
        var i = n.data.indexOf(f.wort, Math.max(0, ziel - pos - 4));
        if (i >= 0 && Math.abs(pos + i - ziel) < 6) { n.data = n.data.slice(0, i) + neu + n.data.slice(i + f.wort.length); break; }
        pos += n.data.length;
      }
      if (el.innerText === ganz) { var k = el.innerHTML.indexOf(f.wort); if (k >= 0) el.innerHTML = el.innerHTML.slice(0, k) + neu + el.innerHTML.slice(k + f.wort.length); }
    } else {
      var v = el.value, s = v.substr(f.start, f.laenge) === f.wort ? f.start : v.indexOf(f.wort);
      if (s < 0) return;
      el.value = v.slice(0, s) + neu + v.slice(s + f.wort.length);
    }
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function zeige(el, fehler) {
    var t = tafelBauen(); aktuell = el;
    var name = (el.closest('label') && (el.closest('label').querySelector('span') || {}).textContent) || el.getAttribute('aria-label') || el.placeholder || 'Textfeld';
    t.innerHTML = '<div class="rs-tafel__k"><span>Rechtschreibung · ' + String(name).trim().slice(0, 40).replace(/[<>&]/g, '') + '</span><button type="button" data-rs-zu>Schliessen</button></div>'
      + fehler.slice(0, 5).map(function (f, j) {
        return '<div class="rs-zeile"><b><s>' + f.wort.replace(/[<>&]/g, '') + '</s></b><div class="rs-v">' + (f.vorschlaege || []).map(function (v) { return '<button type="button" data-rs="' + j + '" data-v="' + v.replace(/"/g, '&quot;') + '">' + v.replace(/[<>&]/g, '') + '</button>'; }).join('')
          + '<button type="button" class="rs-lass" data-rs-lass="' + j + '">So lassen</button></div></div>';
      }).join('');
    t.querySelector('[data-rs-zu]').onclick = zu;
    t.querySelectorAll('[data-rs]').forEach(function (b) { b.onclick = function () { ersetze(el, fehler[+b.dataset.rs], b.dataset.v); fehler.splice(+b.dataset.rs, 1); fehler.length ? zeige(el, neuPos(el, fehler)) : zu(); }; });
    t.querySelectorAll('[data-rs-lass]').forEach(function (b) { b.onclick = function () { (el._rsLass = el._rsLass || {})[fehler[+b.dataset.rsLass].wort] = 1; fehler.splice(+b.dataset.rsLass, 1); fehler.length ? zeige(el, fehler) : zu(); }; });
    requestAnimationFrame(function () { t.classList.add('auf'); });
  }
  function neuPos(el, fehler) { var v = text(el); return fehler.map(function (f) { var i = v.indexOf(f.wort); return i >= 0 ? Object.assign({}, f, { start: i }) : f; }); }
  function pruefe(el) {
    var t = text(el); if (!t || t.trim().length < 3) return;
    var nr = ++laeuft;
    fetch(DIENST, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: t, sprache: (el.getAttribute('lang') || 'de').slice(0, 2) }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (nr !== laeuft) return;
        var f = (d.fehler || []).filter(function (x) { return !(el._rsLass && el._rsLass[x.wort]); });
        if (f.length) zeige(el, f); else if (aktuell === el) zu();
      }).catch(function () { /* Dienst läuft nicht: es bleibt die Unterstreichung des Browsers */ });
  }
  document.addEventListener('pointerdown', function (e) { if (tafel && tafel.classList.contains('auf') && !tafel.contains(e.target) && e.target !== aktuell) zu(); }, true);   // woanders hintippen schliesst die Anzeige
  document.addEventListener('focusout', function (e) { var el = e.target; if (el && el.dataset && el.dataset.rs) setTimeout(function () { pruefe(el); }, 60); }, true);
  window.WO_RECHTSCHREIBUNG = { pruefe: pruefe, markiere: markiere };
  function los() { markiere(document); new MutationObserver(function (m) { m.forEach(function (x) { x.addedNodes.forEach(function (n) { if (n.nodeType === 1) markiere(n.parentNode || n); }); }); }).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los); else los();
})();
