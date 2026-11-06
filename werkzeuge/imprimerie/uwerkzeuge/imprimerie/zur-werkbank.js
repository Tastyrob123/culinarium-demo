/* L’Imprimerie · Culinarium Hannover: Kopie von _werkzeuge/maison/zur-werkbank.js (Baustein von La Maison), geschrieben von _qa/culinarium_anpassen.py.
   Änderungen: die Wurzel des Hauses wird auch aus _werkzeuge/imprimerie/ und werkzeuge/imprimerie/ erkannt (Master F78); der Prüfserver :9087 gilt als eigene Adresse. */
/* «Zur Werkbank» (R19) · Der Tresen des Culinarium: Kopie des Bausteins der Häuser, Schlüssel des Hauses «culinarium-wb». Gebaut von bau.py. */
/* «Zur Werkbank» (Robert 12.10.2026): ein Knopf unten links auf jeder Seite, die man aus der Werkbank heraus öffnet.
   Eine Datei für alle Seiten, sie bringt Aussehen und Verhalten selbst mit (eigener Schattenbaum, kein Stylesheet der Seite greift hinein).

   In der Werkbank selbst (werkbank/, werkbank/en/ …) zeigt sie nichts, sondern hängt an jeden Link, der hinausführt, die Herkunft:
   ?wb=<Sprache>.<Abschnitt>. Die Zielseite merkt sich das für die Sitzung (sessionStorage «culinarium-wb»), nimmt den Zusatz wieder aus der Adresse
   und zeigt den Knopf, auch über alle weiteren Klicks. Ohne diese Herkunft erscheint nichts: ein Gast des Hauses sieht den Knopf nie.
   Eingebettet (Laptop der Werkbank, Vorschau in Le Bureau) erscheint er auch nicht.

   Verhalten wie die Sprachleiste unten links: weg beim Hinunterscrollen, zurück beim Hochscrollen, nur transform und opacity.
   Auf den Seiten der Website folgt er der Leiste oben (Klasse «weg» an .nav), sonst zählt er selbst (auch in Werkzeugen, die innen scrollen).
   Er setzt sich über alles, was unten links schon steht: die Sprachleiste, und was das Skript-Tag in data-ueber="…" nennt.
   data-neben="…" nennt Seitenleisten, neben die er rückt (data-luft = Abstand in px). Beides nur über transform.
   data-z="…" hebt ihn über Flächen der Seite, die selbst weit oben liegen (Chat der Zimmermappe).

   Einbinden: <script src="…/assets/js/zur-werkbank.js" defer></script>   (zur_werkbank.py trägt das überall ein)
   Auf fremder Adresse (L’Imprimerie): data-fremd am Skript-Tag, die Werkbank-Adresse kommt dann aus dem Link (wbo). */
/* Bild noch einmal holen (14.10.2026): Bleibt ein Bild beim ersten Versuch aus (kurzer Aussetzer der Leitung oder des Netzes von Vercel beim
   Umschalten einer Auslieferung), holt die Seite es einmal nach 1,5 s mit einem Zusatz an der Adresse neu, damit der Browser nicht die
   gescheiterte Antwort wiederverwendet. Gilt für jedes <img> der Seite, läuft nur einmal je Bild. */
(function () {
  var nochmal = function (u) { try { var x = new URL(u, location.href); if (x.searchParams.get('nochmal')) return null; x.searchParams.set('nochmal', '1'); return x.href; } catch (e) { return null; } };
  var hole = function (img) {
    if (!img || img.tagName !== 'IMG' || img.dataset.nochmal) return;
    var src = img.currentSrc || img.src; if (!src || /^data:|^blob:/.test(src)) return;
    img.dataset.nochmal = '1';
    setTimeout(function () {
      if (img.complete && img.naturalWidth > 0) return;
      if (img.srcset) img.srcset = img.srcset.split(',').map(function (c) { var t = c.trim().split(/\s+/); var n = nochmal(t[0]); return (n || t[0]) + (t[1] ? ' ' + t[1] : ''); }).join(', ');
      var n = nochmal(img.src || src); if (n) img.src = n;
    }, 1500);
  };
  document.addEventListener('error', function (e) { hole(e.target); }, true);
  var nachsehen = function () { for (var i = 0; i < document.images.length; i++) { var im = document.images[i]; if (im.complete && im.naturalWidth === 0 && (im.currentSrc || im.src)) hole(im); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', nachsehen); else nachsehen();
  window.addEventListener('load', nachsehen);
})();


(function () {
  'use strict';
  if (window.__zurWerkbank) return; window.__zurWerkbank = 1;

  var SPRACHEN = ['de', 'en', 'fr', 'zh', 'ko', 'ar'];
  var TEXT = { de: 'Zur Werkbank', en: 'To the workbench', fr: 'Vers l’atelier', zh: '前往工作台', ko: '작업대로', ar: 'إلى منضدة العمل' };
  var OHNE_SPRACHE = /^(control|_werkzeuge|studio|mission-control|reception|marke|maison|imprimerie|mails|werkbank\/anleitung)\/|^mappe/;   // gibt es nur deutsch: Sprache der Werkbank gilt
  var FREMD_ZIEL = /^https:\/\/[a-z0-9-]+-analyse\.tastystudios\.ch$|^https:\/\/drucksachen-studio\.vercel\.app$|^http:\/\/(127\.0\.0\.1|localhost):(8963|9087)$/;   // L’Imprimerie auf eigener Adresse
  var HERKUNFT = /^https:\/\/[a-z0-9-]+\.tastystudios\.ch$|^https:\/\/[a-z0-9-]+\.vercel\.app$|^http:\/\/(127\.0\.0\.1|localhost):\d{2,5}$/;   // von wo eine Werkbank herkommen darf
  var SCHL = 'culinarium-wb';

  var tag = document.currentScript || document.querySelector('script[src*="zur-werkbank.js"]');
  var src = tag && tag.src || '';
  var fremd = !!(tag && tag.hasAttribute('data-fremd'));
  var WURZEL = fremd ? null : src.replace(/(?:assets\/js|control|studio|_?werkzeuge\/(?:maison(?:\/online)?|imprimerie)|maison)\/zur-werkbank\.js.*$/, '');   // Adresse des Hauses mit Schrägstrich am Ende
  var hier = location.href.split(/[?#]/)[0];
  var pfad = WURZEL && hier.indexOf(WURZEL) === 0 ? hier.slice(WURZEL.length) : location.pathname.replace(/^\//, '');

  /* Auf der Website des Hauses selbst erscheint der Knopf nie (Robert 13.10.2026: «auf der Website niemals die Zurück-zur-Werkbank-Buttons, das
     beeinträchtigt das Erlebnis dort»). Website = die Seiten in der Wurzel und in den Sprachordnern, samt Zimmermappe. Die Herkunft wird dort
     weiter gemerkt und an neue Reiter mitgegeben, damit der Knopf auf den Beigaben und Werkzeugen danach wieder da ist. */
  var WEBSITE = !fremd && /^(?:(?:en|fr|zh|ko|ar)\/)?(?:[a-z0-9-]+\.html)?$/.test(pfad) && !/^mappe\.html$/.test(pfad);   // seit Fassung 8 auch die Zimmermappe (Robert 13.10.2026: «ja», dort auch weg)

  function lies() { try { var d = JSON.parse(sessionStorage.getItem(SCHL) || 'null'); return d && SPRACHEN.indexOf(d.sp) >= 0 ? d : null; } catch (e) { return null; } }
  function merke(d) { try { sessionStorage.setItem(SCHL, JSON.stringify(d)); } catch (e) {} }

  /* Die Herkunft an einen Link hängen (Werkbank: an jeden, der hinausführt; sonst nur, wenn er einen neuen Reiter öffnet,
     denn ein neuer Reiter fängt eine neue Sitzung an). */
  function haenge(a, sp, anker) {
    var u; try { u = new URL(a.href, location.href); } catch (e) { return; }
    if (!/^https?:$/.test(u.protocol)) return;
    var eigen = u.origin === location.origin, f = FREMD_ZIEL.test(u.origin);
    if (!eigen && !f) return;
    if (/\.(pdf|zip|png|jpe?g|webp|svg|mp4)$/i.test(u.pathname)) return;
    var w = sp + (anker ? '.' + anker : '');
    u.searchParams.set('wb', w);
    /* Höhe (Robert 18.10.2026 23:00, Tab 01:18) */ var yy = mein.y != null ? String(mein.y) : ''; if (/^\d{1,6}$/.test(yy)) u.searchParams.set('wy', yy); else u.searchParams.delete('wy');
    if (f && !eigen) u.searchParams.set('wbo', mein.o || location.origin);
    a.href = u.href;
  }
  var mein = { o: '' };

  /* ---------- 1. In der Werkbank: Herkunft mitgeben, kein Knopf ---------- */
  var wb = !fremd && /^werkbank\/(?:(en|fr|zh|ko|ar)\/)?(?:index\.html)?$/.exec(pfad);
  if (wb) {
    var wsp = wb[1] || 'de';
    var beimLink = function (e) {
      if (e.type === 'keydown' && e.key !== 'Enter') return;
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var roh = a.getAttribute('href') || '';
      if (roh.charAt(0) === '#') return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin === location.origin && /\/werkbank\/(?:(en|fr|zh|ko|ar)\/)?(?:index\.html)?$/.test(u.pathname)) return;   // Sprachwechsel, Sprung in der Werkbank
      var ort = a.closest('section[id]');
      if (!ort) { var m = document.elementFromPoint(innerWidth / 2, innerHeight / 2); ort = m && m.closest && m.closest('section[id]'); }
      mein.y = Math.round(window.scrollY || window.pageYOffset || 0); try { sessionStorage.setItem('wb-y', String(mein.y)); } catch (x) {}
      haenge(a, wsp, ort && /^[a-z0-9-]+$/.test(ort.id) ? ort.id : '');
    };
    ['pointerdown', 'mousedown', 'click', 'auxclick', 'contextmenu', 'keydown', 'touchstart'].forEach(function (n) { window.addEventListener(n, beimLink, { capture: true, passive: true }); });
    return;
  }

  /* ---------- 2. Auf allen anderen Seiten: Herkunft lesen ---------- */
  var q; try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
  var roh = q && q.get('wb');
  if (roh) {
    var t = /^(de|en|fr|zh|ko|ar)(?:\.([a-z0-9-]{1,40}))?$/.exec(roh);
    var o = q.get('wbo') || '';
    if (t && (!fremd || HERKUNFT.test(o) || /^\/imprimerie\//.test(location.pathname))) merke({ sp: t[1], anker: t[2] || '', o: HERKUNFT.test(o) && (fremd || o !== location.origin) ? o : '', y: /^\d{1,6}$/.test(q.get('wy') || '') ? q.get('wy') : '' });
    try { q.delete('wb'); q.delete('wbo'); q.delete('wy'); var rest = q.toString(); history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash); } catch (e) {}
  }
  var von = lies();
  if (!von) return;                       // kein Besuch aus der Werkbank: nichts zeigen
  if (window.self !== window.top) return; // eingebettet: nichts zeigen
  mein.o = von.o || ''; mein.y = von.y || '';

  var basis = fremd ? (von.o ? von.o + '/' : (/^\/imprimerie\//.test(location.pathname) ? location.origin + '/' : '')) : (von.o ? von.o + '/' : WURZEL);
  if (!basis) return;

  /* Sprache: die der Seite, wo es Sprachfassungen gibt; bei den Werkzeugen (nur deutsch) die der Werkbank, aus der man kam */
  var imPfad = /(?:^|\/)(en|fr|zh|ko|ar)\//.exec(pfad);
  var sp = fremd || OHNE_SPRACHE.test(pfad) ? von.sp : (imPfad ? imPfad[1] : 'de');
  if (sp !== von.sp) { von.sp = sp; merke(von); }
  var ziel = basis + 'werkbank/' + (sp === 'de' ? '' : sp + '/') + 'index.html' + (von.y ? '?y=' + von.y : (von.anker ? '#' + von.anker : ''));
  /* Robert 19.10.2026 01:18: ein Werkzeug öffnet im neuen Tab; «Zur Werkbank» schliesst ihn wieder, die Werkbank steht im ersten Tab noch an derselben Stelle */
  document.addEventListener('click', function (ev) { var w = document.getElementById('zur-werkbank'); if (!w || !ev.composedPath || ev.composedPath().indexOf(w) < 0) return; if (history.length <= 1) { ev.preventDefault(); ev.stopPropagation(); try { window.close(); } catch (x) {} setTimeout(function () { location.href = ziel; }, 400); } }, true);

  function baue() {
    if (document.getElementById('zur-werkbank')) return;
    if (WEBSITE) {   // kein Knopf; nur die Herkunft an Links hängen, die einen neuen Reiter öffnen
      var mit = function (e) {
        var a = e.target && e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        if ((a.target && a.target !== '_self') || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1 || e.type === 'contextmenu') haenge(a, von.sp, von.anker);
      };
      ['pointerdown', 'mousedown', 'click', 'auxclick', 'contextmenu'].forEach(function (n) { window.addEventListener(n, mit, { capture: true, passive: true }); });
      return;
    }
    var wirt = document.createElement('div');
    wirt.id = 'zur-werkbank';
    wirt.className = 'neu';
    /* Lage und Bewegung stehen direkt am Wirt (style-Attribut, mit «important» gegen Stylesheets der Seite), nicht in einem Stylesheet:
       Safari schaltet ein nachträglich eingefügtes <style> erst ein, wenn alle Stylesheets der Seite geladen sind. Der Chat lädt seines
       (gast.css) erst spät nach; bis dahin stand der Knopf ohne Lage am Ende der Seite (online gemessen 12.10.2026, WebKit).
       Im Stylesheet bleiben nur die Schrift und der Druck. */
    var lage = document.createElement('style');
    lage.textContent =
      '@font-face{font-family:"ZW Mono";font-style:normal;font-weight:400;font-display:swap;src:local("DM Mono"),url("' + (tag && tag.getAttribute('data-schrift') || (WURZEL || basis) + 'assets/schrift/DMMono-normal-400.woff2') + '")}' +
      '@media print{#zur-werkbank{display:none!important}}';
    document.head.appendChild(lage);
    var setz = function (k, v) { wirt.style.setProperty(k, v, 'important'); };
    var ruhig = !!(window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches);
    wirt.style.display = 'block';   // ohne «important», damit der Druck ihn ausblenden kann
    [['position', 'fixed'], ['z-index', String(parseInt(tag && tag.getAttribute('data-z'), 10) || 61)], ['left', 'clamp(14px,2vw,32px)'], ['bottom', 'clamp(14px,2vw,32px)'],
     ['top', 'auto'], ['right', 'auto'], ['width', 'auto'], ['height', 'auto'], ['margin', '0'], ['padding', '0'], ['border', '0'], ['background', 'none'], ['float', 'none'],
     ['visibility', 'visible'], ['filter', 'none'], ['clip-path', 'none'], ['direction', 'ltr'], ['line-height', 'normal'],
     /* Regeln der Seite, die jedes Kind von body hereinschweben lassen (L’Imprimerie: Animation «auf»), dürfen den Knopf nicht festhalten:
        in Safari überstimmt eine zu Ende gelaufene Animation sonst Deckkraft und Lage */
     ['animation', 'none'], ['translate', 'none'], ['rotate', 'none'], ['scale', 'none'], ['mask', 'none'], ['mix-blend-mode', 'normal'],
     ['max-width', 'none'], ['min-width', '0'], ['max-height', 'none'], ['min-height', '0'], ['overflow', 'visible'], ['box-shadow', 'none'], ['outline', '0'],
     ['transition', ruhig ? 'opacity .2s ease' : 'transform .55s cubic-bezier(.32,.72,0,1),opacity .4s ease']].forEach(function (x) { setz(x[0], x[1]); });
    /* da oder weg: gleicher Weg wie die Sprachleiste darunter (ihre Höhe + 48 px), damit beide als ein Stück hinausgleiten */
    var male = function () {
      var fort = wirt.classList.contains('weg') || wirt.classList.contains('neu');
      setz('transform', fort ? 'translate3d(var(--zw-schub,0px),calc(100% + 48px - var(--zw-hub,0px)),0)' : 'translate3d(var(--zw-schub,0px),calc(var(--zw-hub,0px) * -1),0)');
      setz('opacity', fort ? '0' : '1');
      setz('pointer-events', fort ? 'none' : 'auto');
    };
    male();
    if (window.MutationObserver) new MutationObserver(male).observe(wirt, { attributes: true, attributeFilter: ['class'] });
    var baum = wirt.attachShadow ? wirt.attachShadow({ mode: 'open' }) : wirt;
    baum.innerHTML =
      '<style>' +
      ':host{direction:ltr}' +
      'a{position:relative;overflow:hidden;isolation:isolate;box-sizing:border-box;display:inline-flex;align-items:center;gap:11px;height:44px;padding:0 20px 0 5px;border-radius:999px;' +
      'font:400 11.5px/1 "ZW Mono","DM Mono",ui-monospace,"SF Mono",Menlo,"PingFang SC","Apple SD Gothic Neo","Geeza Pro",monospace;letter-spacing:.13em;text-transform:uppercase;white-space:nowrap;text-decoration:none;' +
      'color:#121c3c;background:linear-gradient(180deg,#fdf9f1 0%,#f1e6d1 46%,#dccaa6 100%);cursor:pointer;-webkit-tap-highlight-color:transparent;' +
      'box-shadow:inset 0 1px 0 #fff,inset 0 -3px 0 rgba(130,108,53,.32),inset 0 0 0 1px rgba(176,147,79,.62),0 0 0 1px rgba(9,17,39,.28),0 12px 22px -12px rgba(9,17,39,.6);' +
      'transition:transform .55s cubic-bezier(.32,.72,0,1)}' +
      'a::after{content:"";position:absolute;z-index:-1;top:-20%;bottom:-20%;left:0;width:38%;background:linear-gradient(100deg,transparent 0%,rgba(255,255,255,.85) 50%,transparent 100%);transform:translateX(-180%) skewX(-18deg);transition:transform 0s}' +
      'i{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#3A3845,#16151A);color:#f7efdd;' +
      'box-shadow:inset 0 1px 0 rgba(190,206,255,.4),inset 0 -2px 0 rgba(0,0,0,.4),0 0 0 1px rgba(230,210,162,.45);transition:transform .6s cubic-bezier(.32,.72,0,1)}' +
      'svg{display:block;width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}' +
      'span{display:block;padding-top:1px}' +
      ':host([lang="zh"]) a,:host([lang="ko"]) a,:host([lang="ar"]) a{letter-spacing:.04em;font-size:13px;text-transform:none}' +
      '@media (hover:hover){a:hover{transform:translateY(-2px)}a:hover i{transform:translateX(-2px) scale(1.05)}a:hover::after{transform:translateX(360%) skewX(-18deg);transition:transform 1s cubic-bezier(.16,1,.3,1)}}' +
      'a:active{transform:translateY(1px) scale(.985)}' +
      'a:focus-visible{outline:2px solid #E6D2A2;outline-offset:3px}' +
      '@media (max-width:560px){a{height:40px;gap:9px;padding:0 16px 0 4px;font-size:10.5px}i{width:32px;height:32px}:host([lang="zh"]) a,:host([lang="ko"]) a,:host([lang="ar"]) a{font-size:12px}}' +
      '@media (prefers-reduced-motion:reduce){a,i,a::after{transition:none!important}}' +
      '</style>' +
      '<a part="knopf" href="' + ziel.replace(/"/g, '&quot;') + '"><i aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M13 8H3.5M7.5 4 3.5 8l4 4"/></svg></i><span' + (sp === 'ar' ? ' dir="rtl"' : '') + '>' + TEXT[sp] + '</span></a>';
    wirt.setAttribute('lang', sp);
    document.body.appendChild(wirt);

    /* ---- Platz: über allem, was unten links schon steht, und neben Seitenleisten ---- */
    var liste = function (n, vor) { return vor.concat(((tag && tag.getAttribute(n)) || '').split(',')).map(function (s) { return s.trim(); }).filter(Boolean); };
    var ueber = liste('data-ueber', ['.sprache', '.gast-knopf']), neben = liste('data-neben', []), luft = parseFloat(tag && tag.getAttribute('data-luft')) || 14;
    var hub = -1, schub = -1, gemessen = [], lebend = false;
    function alle(sels, fn) {
      sels.forEach(function (sel) {
        var els; try { els = document.querySelectorAll(sel); } catch (e) { return; }
        [].forEach.call(els, function (el) {
          if (gemessen.indexOf(el) < 0) { gemessen.push(el); if (ro) ro.observe(el); }
          var cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || !el.offsetHeight) return;
          for (var n = el; n && n.nodeType === 1; n = n.parentElement) if (n.hidden) return;
          fn(el, cs, el.getBoundingClientRect());
        });
      });
    }
    function platz() {
      var cs = getComputedStyle(wirt), unten = parseFloat(cs.bottom) || 0, links = parseFloat(cs.left) || 0, breite = wirt.offsetWidth, hoehe = wirt.offsetHeight;
      var H = innerHeight, B = innerWidth, sy = window.scrollY || 0;
      /* neben: Seitenleisten, die bis in die Zeile des Knopfs reichen und nicht fast die ganze Breite füllen (am Handy liegen sie oben) */
      var s = 0;
      alle(neben, function (el, c, r) {
        var fest = c.position === 'fixed' || c.position === 'sticky';
        var o = fest ? r.top : r.top + sy, u = fest ? r.bottom : r.bottom + sy;
        if (r.width > B * 0.6 || u < H - unten - hoehe || o > H - unten) return;
        if (r.left < links + breite && r.right > links) s = Math.max(s, r.right + luft - links);
      });
      if (links + s + breite > B - 8) s = 0;
      /* über: was unter dem (schon verschobenen) Knopf steht. Feste Stücke zählen ohne ihre eigene Bewegung, Inhalt so, wie er oben auf der Seite steht. */
      var h = 0, l = links + s;
      alle(ueber, function (el, c, r) {
        if (r.right <= l || r.left >= l + breite) return;
        var o;
        if (c.position === 'fixed' && c.bottom !== 'auto') o = parseFloat(c.bottom) + el.offsetHeight;
        else if (c.position === 'fixed' || c.position === 'sticky') o = r.bottom > H - unten - hoehe ? H - r.top : 0;
        else {   // Inhalt, der mitscrollt (Eingabefeld der Zimmermappe, erste Tür von La Maison): zählt, solange er gerade in der Zeile des Knopfs steht
          lebend = true;
          o = r.bottom > H - unten - hoehe && r.top < H - unten ? H - r.top : 0;
          if (o > H * 0.4) o = 0;
        }
        if (o > unten) h = Math.max(h, o - unten + 10);
      });
      h = Math.round(h); s = Math.round(s);
      if (h !== hub) { hub = h; wirt.style.setProperty('--zw-hub', h + 'px'); }
      if (s !== schub) { schub = s; wirt.style.setProperty('--zw-schub', s + 'px'); }
    }
    var wartet = 0;
    function bald() { if (wartet) return; wartet = requestAnimationFrame(function () { wartet = 0; platz(); }); }
    var ro = window.ResizeObserver ? new ResizeObserver(bald) : null;
    platz();
    if (ro) ro.observe(wirt);
    addEventListener('resize', bald, { passive: true });
    /* Seitenleisten und Türen schweben beim Laden erst herein: nachmessen, wenn sie stehen */
    [400, 1100, 2000, 3400].forEach(function (ms) { setTimeout(bald, ms); });
    addEventListener('load', bald);
    if (window.MutationObserver && ueber.length + neben.length > 1) new MutationObserver(bald).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });

    /* ---- weg beim Hinunterscrollen, zurück beim Hochscrollen ---- */
    /* Selbst zählen wie main.js: der Weg seit dem letzten Richtungswechsel, 24 px Schwelle. Auch für Flächen, die innen scrollen (Werkzeuge). */
    var gefuehrt = false, stand = new WeakMap(), dok = function () { return document.scrollingElement || document.documentElement; };
    var beimScroll = function (e) {
      if (gefuehrt) return;
      var z = e.target === document || e.target === document.documentElement ? dok() : e.target;
      if (!z || z.nodeType !== 1) return;
      if (z !== dok() && z !== document.body && z.clientHeight < innerHeight * 0.5) return;   // kleine Listen zählen nicht
      var y = z.scrollTop, s = stand.get(z);
      if (!s) { s = { alt: y > 0 ? 0 : y, richt: 0, anker: 0 }; stand.set(z, s); }
      if ((y - s.alt) * s.richt < 0 || (!s.richt && y !== s.alt)) { s.richt = y > s.alt ? 1 : -1; s.anker = s.alt; }
      if (y < 140) wirt.classList.remove('weg');
      else if (s.richt > 0 && y - s.anker > 24) wirt.classList.add('weg');
      else if (s.richt < 0 && s.anker - y > 24) wirt.classList.remove('weg');
      s.alt = y;
    };
    document.addEventListener('scroll', function (e) { beimScroll(e); if (lebend) bald(); }, { capture: true, passive: true });
    /* Seiten der Website: main.js setzt «weg» an die Leiste oben, die Sprachleiste folgt ihr. Sobald sich die Leiste einmal meldet, führt sie,
       dann gleiten Sprachleiste und Knopf im selben Augenblick. */
    var nav = document.querySelector('.nav');
    if (nav && window.MutationObserver && document.querySelector('.sprache')) {
      var war = nav.classList.contains('weg');
      new MutationObserver(function () {
        var ist = nav.classList.contains('weg');
        if (ist === war) return;
        war = ist; gefuehrt = true; wirt.classList.toggle('weg', ist);
      }).observe(nav, { attributes: true, attributeFilter: ['class'] });
      if (war) { gefuehrt = true; wirt.classList.add('weg'); }
    }

    /* ---- neue Reiter behalten die Herkunft ---- */
    var weiter = function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (!a || a === wirt) return;
      var neu = (a.target && a.target !== '_self') || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1 || e.type === 'contextmenu';
      if (neu) haenge(a, von.sp, von.anker);
    };
    ['pointerdown', 'mousedown', 'click', 'auxclick', 'contextmenu'].forEach(function (n) { window.addEventListener(n, weiter, { capture: true, passive: true }); });

    /* ---- Auftritt: erst wenn die Sprachleiste da ist (Startseite: nach dem Auftakt), dann einmal hereinschweben ---- */
    /* Erst zeigen, wenn die Stylesheets der Seite da sind (der Chat lädt seines nach): vorher stehen Sprachleiste und Chat-Knopf noch nicht
       an ihrem Platz, der Knopf erschiene zu tief und rückte dann. Höchstens 3 s. Jedes später geladene Stylesheet lässt neu messen. */
    var cssDa = function () { var l = document.querySelectorAll('link[rel~="stylesheet"]'); for (var i = 0; i < l.length; i++) if (!l[i].sheet && !l[i].disabled) return false; return true; };
    document.addEventListener('load', function (e) { if (e.target && e.target.tagName === 'LINK') bald(); }, true);
    var zeig = function () {
      var seit = Date.now(), los = function () {
        if (!cssDa() && Date.now() - seit < 3000) return setTimeout(los, 90);
        requestAnimationFrame(function () { requestAnimationFrame(function () { platz(); wirt.classList.remove('neu'); }); });
      };
      los();
    };
    /* Nennt das Tag eigene Stücke (Seitenleiste, Speichern-Leiste, erste Tür), wartet der Knopf, bis eines davon steht: Werkzeuge bauen sich erst
       nach dem Laden auf und lassen ihre Leisten hereinschweben. Sonst erschiene er an der falschen Stelle und spränge dann. Höchstens 2,6 s. */
    var eigene = liste('data-ueber', []).concat(neben);
    var steht = function () {
      var da = false, ruhig = true;
      alle(eigene, function (el) {
        da = true;
        for (var n = el; n && n.nodeType === 1 && n !== document.body; n = n.parentElement) {
          var l = n.getAnimations ? n.getAnimations() : [];
          for (var i = 0; i < l.length; i++) if (l[i].playState === 'running' && l[i].effect && l[i].effect.getComputedTiming && l[i].effect.getComputedTiming().iterations !== Infinity) ruhig = false;
        }
      });
      return da && ruhig;
    };
    var leiste = document.querySelector('.sprache'), lauf = leiste && leiste.getAnimations ? leiste.getAnimations() : [];
    if (eigene.length) {
      var seit = Date.now(), schau = function () { if (steht() || Date.now() - seit > 2600) zeig(); else setTimeout(schau, 140); };
      setTimeout(schau, 140);
    } else if (lauf.length) {
      var fertig = false, los = function () { if (!fertig) { fertig = true; zeig(); } };
      Promise.all(lauf.map(function (a) { return a.finished; })).then(los, los);
      setTimeout(los, 5200);
    } else zeig();
  }

  if (document.body) baue(); else document.addEventListener('DOMContentLoaded', baue);
})();
