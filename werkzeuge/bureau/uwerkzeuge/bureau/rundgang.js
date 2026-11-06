/* Kurzer Rundgang durch Le Bureau · Culinarium (28.10.2026). Kopie aus Le Bureau des Schäfli (dort aus dem Kartenpult des Schlössli, dem Gasterntal,
   Ruedihus, Doldenhorn, Carlton-Europe; Vorlage assets/js/rundgang.js des Vorbilds). Master Werkzeug-Bau R18, Fehlerbuch 10a:
   Robert 16.10.2026: «einmal ganz kurz zeigen, hier kannst du das machen, da das, damit man weiss, wo man gelandet ist». Erklärt was und wozu, nie die Bedienung.
   Kein Start von selbst: beim ersten Öffnen erscheint unten rechts ein Schild «Kurzer Rundgang», fest über der Leiste (Fehlerbuch 10a, Schlössli 20.10.2026:
   gesetzt beim Erscheinen und bei geänderter Fenstergrösse, nie nach dem Inhalt darunter). Wieder aufrufen: «Kurzer Rundgang» im Rand oder ?rundgang.
   Farben nur aus dem Kleid des Hauses (--wo-…), keine Werte eines anderen Hauses. Automatische Prüfungen (navigator.webdriver) und eingebettete Ansichten sehen nichts. */
(function () {
  var Q = new URLSearchParams(location.search), ERZWINGEN = Q.has('rundgang');
  if (window.self !== window.top && !ERZWINGEN) return;
  var NAME = (window.WO && WO.name('website')) || 'Website pflegen';   /* Name aus der einen Stelle (kleid/culinarium.js), im Satz mit kleinem Artikel: «Das ist das Schaufenster» */
  var IM_SATZ = NAME.replace(/^(Der|Die|Das) /, function (a) { return a.toLowerCase(); });
  var G = { name: NAME, schritte: [
    { ziel: ['#ws-mitte .wo-sb', '#ws-kopf'], titel: 'Das ist ' + IM_SATZ,
      text: 'Hier pflegst du die Website des Culinariums selbst: jeden Text, jedes Foto, die Zeiten der Bar, Telefon und Adresse, die Texte für Google. Ohne Agentur, ohne Wartezeit.' },
    { ziel: ['html.wo-rand-auf #ws-rand .wo-rand__g:has([data-ws-nav="e:termine"])', '#ws-rand [data-ws-nav="e:termine"]', '#ws-mitte .wo-aufg > .wo-ag', '#ws-rand'], titel: 'Die nächsten Abende',
      text: 'Jeder Abend, für den Gäste einen Platz an der Tafel buchen, steht unter «Termine»: Tag, Beginn, Preis und Plätze. Auf der Seite «Der Abend» erscheint er als eigenes Plakat.' },
    { ziel: ['#ws-mitte .wo-ber > .wo-bk'], titel: 'Die Website, Bereich für Bereich',
      text: 'Jede Seite der Website hat hier ihren Platz, von der Startseite bis zu Dirty Chicken. Du änderst direkt auf der Seite, so wie die Gäste sie sehen.' },
    { ziel: ['#ws-rand', '[data-wo-rand-knopf]'], titel: 'Einmal ändern, überall richtig',
      text: 'Telefon, Adresse, die Zeiten der Bar und die Preise stehen auf vielen Seiten. Hier änderst du sie an einer Stelle, und jede Seite stimmt.' },
    { ziel: ['#ws-leiste'], titel: 'Erst Entwurf, dann Website',
      text: 'Was du speicherst, wartet im Entwurf. Auf die Website kommt es erst, wenn du veröffentlichst, und jeder frühere Stand lässt sich zurückholen.' }
  ] };
  var SCHLUESSEL = 'rundgang-culinarium-bureau';
  function gesehen() { try { return localStorage.getItem(SCHLUESSEL) === '1'; } catch (e) { return false; } }
  function merk() { try { localStorage.setItem(SCHLUESSEL, '1'); } catch (e) { } }

  var CSS = '' +
    '.rdg-kegel{position:fixed;left:0;top:0;z-index:2147483000;border-radius:18px;pointer-events:none;' +
      'box-shadow:0 0 0 3px var(--wo-g2),0 0 0 9px color-mix(in srgb,var(--wo-g2) 35%,transparent),0 0 40px 10px color-mix(in srgb,var(--wo-g2) 35%,transparent),0 0 0 200vmax color-mix(in srgb,var(--wo-tief) 78%,transparent)}' +
    '.rdg-sperre{position:fixed;inset:0;z-index:2147482999}' +
    '.rdg-karte{position:fixed;left:0;top:0;z-index:2147483001;width:370px;max-width:calc(100vw - 32px);box-sizing:border-box;' +
      'padding:24px 26px 22px;border-radius:22px;color:var(--wo-tinte);background:linear-gradient(180deg,var(--wo-blatt),var(--wo-papier2));' +
      'box-shadow:0 1px 0 #fff inset,0 0 0 1px color-mix(in srgb,var(--wo-tief) 30%,transparent),0 30px 60px -24px color-mix(in srgb,var(--wo-tief) 65%,transparent),0 10px 22px -12px color-mix(in srgb,var(--wo-tief) 45%,transparent);' +
      'font:15px/1.55 var(--wo-sans);animation:rdg-auf .42s cubic-bezier(.2,.8,.2,1) both}' +
    '@keyframes rdg-auf{from{transform:translate3d(var(--rx,0),calc(var(--ry,0px) + 14px),0)}to{transform:translate3d(var(--rx,0),var(--ry,0),0)}}' +
    '.rdg-karte{transform:translate3d(var(--rx,0),var(--ry,0),0)}' +
    '.rdg-zier{display:flex;align-items:center;gap:10px;font:500 10px/1 var(--wo-mono);letter-spacing:.22em;text-transform:uppercase;color:var(--wo-akzent)}' +
    '.rdg-zier i{flex:1;height:1px;background:linear-gradient(90deg,var(--wo-g2),transparent)}' +
    '.rdg-karte h3{margin:12px 0 6px;font:460 25px/1.15 var(--wo-titel);color:var(--wo-tief);letter-spacing:0}' +
    '.rdg-karte p{margin:0;color:color-mix(in srgb,var(--wo-tinte) 80%,transparent)}' +
    '.rdg-fuss{display:flex;align-items:center;gap:14px;margin-top:20px}' +
    '.rdg-karte .rdg-weg{display:flex;gap:5px;flex:1 1 auto;min-width:64px}.rdg-karte .rdg-weg b{display:block;height:3px;flex:1 1 0;min-width:6px;max-width:26px;border-radius:2px;background:color-mix(in srgb,var(--wo-tinte) 14%,transparent)}.rdg-karte .rdg-weg b.da{background:var(--wo-g3)}' +
    '.rdg-karte .rdg-zu{flex:none;margin:0;border:0;background:none;padding:6px 2px;font:500 10px/1 var(--wo-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--wo-akzent);cursor:pointer}' +
    '.rdg-karte .rdg-zu:hover{color:var(--wo-tinte)}' +
    '.rdg-karte .rdg-los,.rdg-schild .rdg-los{flex:none;margin:0;display:inline-flex;align-items:center;gap:12px;height:42px;padding:0 6px 0 18px;border:0;border-radius:999px;cursor:pointer;' +
      'font:500 10px/1 var(--wo-mono);letter-spacing:.16em;text-transform:uppercase;color:var(--wo-blatt);' +
      'background:linear-gradient(180deg,var(--wo-nacht2),var(--wo-nacht) 46%,var(--wo-tief));box-shadow:0 1px 0 rgba(255,255,255,.26) inset,0 -3px 0 rgba(0,0,0,.5) inset,0 10px 18px -10px color-mix(in srgb,var(--wo-tief) 80%,transparent)}' +
    '.rdg-karte .rdg-los i,.rdg-schild .rdg-los i{display:grid;margin:0;place-items:center;width:30px;height:30px;border-radius:50%;background:linear-gradient(180deg,var(--wo-g1),var(--wo-g2));' +
      'box-shadow:0 1px 0 rgba(255,255,255,.9) inset,0 -2px 0 rgba(0,0,0,.22) inset;transition:transform .2s}' +
    '.rdg-karte .rdg-los svg,.rdg-schild .rdg-los svg{width:14px;height:14px;fill:none;stroke:var(--wo-tief);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    '.rdg-los:hover i{transform:translateX(2px)}' +
    '.rdg-los:focus-visible,.rdg-zu:focus-visible{outline:2px solid var(--wo-g3);outline-offset:3px}' +
    '@media (max-width:700px){.rdg-karte{left:16px!important;right:16px;top:auto!important;bottom:16px;width:auto;--rx:0!important;--ry:0!important}}' +
    '@media (prefers-reduced-motion:reduce){.rdg-karte{animation:none}}';
  var SCHILD_CSS = '' +
    '.rdg-schild{position:fixed;right:24px;bottom:24px;z-index:2147482990;display:flex;align-items:center;gap:14px;box-sizing:border-box;' +
      'padding:10px 10px 10px 20px;border-radius:999px;color:var(--wo-tinte);background:linear-gradient(180deg,var(--wo-blatt),var(--wo-papier2));' +
      'box-shadow:0 1px 0 #fff inset,0 0 0 1px color-mix(in srgb,var(--wo-tief) 32%,transparent),0 18px 34px -16px color-mix(in srgb,var(--wo-tief) 60%,transparent),0 6px 14px -8px color-mix(in srgb,var(--wo-tief) 40%,transparent);' +
      'transform:translate3d(0,0,0);transition:transform .55s cubic-bezier(.2,.8,.2,1);animation:rdg-schild-auf .7s cubic-bezier(.2,.9,.25,1.15) both}' +
    '@keyframes rdg-schild-auf{from{transform:translate3d(0,calc(100% + 40px),0)}to{transform:translate3d(0,0,0)}}' +
    '.rdg-schild.weg{animation:none;transform:translate3d(0,calc(100% + 60px),0)}' +
    '.rdg-schild__t{display:flex;flex-direction:column;gap:4px;line-height:1}' +
    '.rdg-schild__t small{font:500 9px/1 var(--wo-mono);letter-spacing:.22em;text-transform:uppercase;color:var(--wo-akzent)}' +
    '.rdg-schild__t b{font:460 18px/1 var(--wo-titel);color:var(--wo-tief)}' +
    '.rdg-schild .rdg-los{height:38px;padding:0 5px 0 15px;font-size:9.5px}.rdg-schild .rdg-los i{width:28px;height:28px}' +
    '.rdg-schild__zu{flex:none;width:26px;height:26px;margin:0 2px 0 -4px;padding:0;border:0;border-radius:50%;background:none;cursor:pointer;color:var(--wo-akzent);font:16px/1 system-ui}' +
    '.rdg-schild__zu{display:grid;place-items:center}.rdg-schild__zu svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}' +   /* kein «×» (Robert 30.10.2026): Zurück-Pfeil wie «Verwerfen» */
    '.rdg-schild__zu:hover{color:var(--wo-tinte)}' +
    '@media (max-width:700px){.rdg-schild{right:16px;left:auto}}' +
    '@media (prefers-reduced-motion:reduce){.rdg-schild{animation:none;transition:none}}';
  var PFEIL = '<i><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></i>';
  var lauf = null;

  function sichtbar(sel) {
    var e; try { e = document.querySelector(sel); } catch (x) { return null; }
    if (!e) return null;
    var r = e.getBoundingClientRect();
    if (r.width > 4 && r.height > 4) return e;
    return window.WO && WO.randZiel ? WO.randZiel(e) : null;   /* Handy: Ziel im zugeklappten Rand, das Kleid klappt ihn auf (30.10.2026) */
  }
  function finde(liste) { for (var i = 0; i < liste.length; i++) { var e = sichtbar(liste[i]); if (e) return e; } return null; }
  function scroller() { return null; }

  function starte() {
    var schritte = G.schritte; if (lauf) return;
    if (!finde(schritte[0].ziel)) return;
    if (!document.getElementById('rdg-css')) { var st = document.createElement('style'); st.id = 'rdg-css'; st.textContent = CSS; document.head.appendChild(st); }
    var sperre = document.createElement('div'); sperre.className = 'rdg-sperre';
    var kegel = document.createElement('div'); kegel.className = 'rdg-kegel';
    var karte = document.createElement('div'); karte.className = 'rdg-karte';
    karte.setAttribute('role', 'dialog'); karte.setAttribute('aria-modal', 'true'); karte.setAttribute('aria-label', 'Kurzer Rundgang ' + G.name);
    document.body.appendChild(sperre); document.body.appendChild(kegel); document.body.appendChild(karte);
    var nr = 0, ziel = null, gerueckt = false;
    lauf = { };

    function lege() {
      if (!ziel || !ziel.isConnected) ziel = finde(schritte[nr].ziel);
      if (!ziel) return;
      var r = ziel.getBoundingClientRect(), pad = 8, vw = innerWidth, vh = innerHeight;
      var x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad);
      var b = Math.min(vw - 8, r.right + pad) - x, h = Math.min(vh - 8, Math.min(Math.max(r.bottom, r.top + (schritte[nr].min || 0)), r.top + (schritte[nr].max || 1e5)) + pad) - y;
      if (vw <= 700) {   /* Handy (Oberchef 30.10.2026): die Karte überdeckt nie das Markierte; ein Ziel höher als das freie Feld wird bis über die Karte markiert */
        var kt = vh - (parseFloat(getComputedStyle(karte).bottom) || 16) - karte.offsetHeight - 18;
        if (y < kt && y + h > kt) {   /* Tor 2 (R4/R5): der Rahmen endet an einer Zeilengrenze, nie mitten durch ein Element */
          var schnitt = kt, alle = ziel.querySelectorAll('*');
          for (var d = 0; d < 6; d++) {
            var neu = schnitt;
            for (var j = 0; j < alle.length; j++) { var er = alle[j].getBoundingClientRect(); if (er.height > 0 && er.height < 70 && er.top < neu - 2 && er.bottom > neu + 3) neu = er.top - 3; }
            if (neu === schnitt) break; schnitt = neu;
          }
          h = Math.max(40, schnitt - y);
        }
      }
      kegel.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      kegel.style.width = Math.max(0, b) + 'px'; kegel.style.height = Math.max(0, h) + 'px';
      if (vw <= 700) return;
      var kw = karte.offsetWidth, kh = karte.offsetHeight, abst = 22, kx, ky;
      if (x + b + abst + kw <= vw - 16) { kx = x + b + abst; ky = y; }
      else if (x - abst - kw >= 16) { kx = x - abst - kw; ky = y; }
      else if (y + h + abst + kh <= vh - 16) { kx = x; ky = y + h + abst; }
      else if (y - abst - kh >= 16) { kx = x; ky = y - abst - kh; }
      else if (!gerueckt && h + abst + kh + 110 < vh) { gerueckt = true; (scroller() || window).scrollBy({ top: r.top - 96, behavior: 'instant' }); return lege(); }
      else { kx = vw - kw - 24; ky = vh - kh - 24; }
      kx = Math.min(Math.max(16, kx), vw - kw - 16); ky = Math.min(Math.max(16, ky), vh - kh - 16);
      karte.style.setProperty('--rx', kx + 'px'); karte.style.setProperty('--ry', ky + 'px');
    }

    function zeige(n, rueck) {
      while (n >= 0 && n < schritte.length && !finde(schritte[n].ziel)) n += rueck ? -1 : 1;   /* fehlt ein Ziel (Handy, leere Ansicht), weiter zum nächsten */
      if (n < 0 || n >= schritte.length) return ende();
      nr = n; gerueckt = false; var s = schritte[n], letzt = n === schritte.length - 1;
      ziel = finde(s.ziel);
      if (window.WO && WO.randZurueck) WO.randZurueck(ziel);   /* Schritt ausserhalb des Rands: der Rundgang klappt ihn wieder zu */
      var r = ziel.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight - 20) ziel.scrollIntoView({ block: r.height > innerHeight * .7 ? 'start' : 'center', behavior: 'instant' });
      var weg = ''; for (var i = 0; i < schritte.length; i++) weg += '<b' + (i <= n ? ' class="da"' : '') + '></b>';
      karte.innerHTML = '<div class="rdg-zier"><span>' + G.name + ' · ' + (n + 1) + ' von ' + schritte.length + '</span><i></i></div>' +
        '<h3>' + s.titel + '</h3><p>' + s.text + '</p>' +
        '<div class="rdg-fuss"><div class="rdg-weg" aria-hidden="true">' + weg + '</div>' +
        (letzt ? '' : '<button type="button" class="rdg-zu">Überspringen</button>') +
        '<button type="button" class="rdg-los">' + (letzt ? 'Los geht’s' : 'Weiter') + PFEIL + '</button></div>';
      karte.style.animation = 'none'; void karte.offsetWidth; karte.style.animation = '';
      var handy = function () { if (window.WO && WO.rdgHandy) WO.rdgHandy(ziel, karte); };   /* Handy: Ziel ins freie Feld zwischen Kopf und Karte (30.10.2026) */
      handy(); lege(); setTimeout(function () { handy(); lege(); }, 450);
      var zu = karte.querySelector('.rdg-zu'); if (zu) zu.onclick = ende;
      var los = karte.querySelector('.rdg-los'); los.onclick = function () { letzt ? ende() : zeige(n + 1); };
      try { los.focus({ preventScroll: true }); } catch (e) { }
    }

    function taste(e) {
      if (e.key === 'Escape') { e.preventDefault(); ende(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); nr < schritte.length - 1 ? zeige(nr + 1) : ende(); }
      else if (e.key === 'ArrowLeft' && nr > 0) { e.preventDefault(); zeige(nr - 1, true); }
    }
    var takt = 0; function neu() { if (!takt) takt = requestAnimationFrame(function () { takt = 0; lege(); }); }
    var zuletzt = '', wacht = setInterval(function () {   /* der Kegel folgt seinem Ziel, solange es sich bewegt oder wächst */
      if (!ziel) return; var r = ziel.getBoundingClientRect(), k = [r.left, r.top, r.width, r.height].map(Math.round).join();
      if (k !== zuletzt) { zuletzt = k; neu(); }
    }, 120);
    function ende() {
      if (window.WO && WO.randZurueck) WO.randZurueck(null);
      merk(); lauf = null;
      removeEventListener('resize', neu); removeEventListener('scroll', neu, true); document.removeEventListener('keydown', taste, true);
      clearInterval(wacht); sperre.remove(); kegel.remove(); karte.remove();
    }
    addEventListener('resize', neu); addEventListener('scroll', neu, true); document.addEventListener('keydown', taste, true);
    zeige(0);
  }

  /* Erst fliegt die Seite herein, dann erscheint das Schild: gewartet wird, bis keine endliche Animation mehr läuft (mindestens 2,5 s, höchstens 6 s), dann noch eine Pause. */
  function wenn_bereit(dann) {
    var t0 = Date.now();
    (function blick() {
      if (finde(G.schritte[0].ziel) && document.readyState === 'complete' && !document.documentElement.classList.contains('auftakt')) return nach_auftritt(dann);
      if (Date.now() - t0 < 12000) setTimeout(blick, 250);
    })();
  }
  function nach_auftritt(dann) {
    var t0 = performance.now(), ruhe = 0;
    (function blick() {
      var laeuft = (document.getAnimations ? document.getAnimations() : []).some(function (a) {
        try { return a.playState === 'running' && isFinite(a.effect.getComputedTiming().endTime); } catch (e) { return false; }
      });
      ruhe = laeuft ? 0 : ruhe + 1;
      var seit = performance.now() - t0;
      if ((ruhe >= 3 && seit > 2500) || seit > 6000) return setTimeout(dann, 700);
      setTimeout(blick, 200);
    })();
  }
  var angesetzt = false;
  function vielleicht() {
    if (lauf || angesetzt) return;
    if (navigator.webdriver && !ERZWINGEN) return;
    if (gesehen() && !ERZWINGEN) return;   /* Schild nur beim ersten Öffnen (R18) */
    angesetzt = true;
    wenn_bereit(function () { ERZWINGEN ? starte() : schild(); });
  }

  function schild() {
    if (document.querySelector('.rdg-schild')) return;
    if (!document.getElementById('rdg-css')) { var sk = document.createElement('style'); sk.id = 'rdg-css'; sk.textContent = CSS; document.head.appendChild(sk); }   /* «Zeigen» im Schild braucht die Knopf-Gestaltung des Rundgangs schon vor dem Start (30.10.2026) */
    if (!document.getElementById('rdg-schild-css')) { var st = document.createElement('style'); st.id = 'rdg-schild-css'; st.textContent = SCHILD_CSS; document.head.appendChild(st); }
    var s = document.createElement('div'); s.className = 'rdg-schild'; s.setAttribute('role', 'status');
    s.innerHTML = '<span class="rdg-schild__t"><small>' + G.name + '</small><b>Kurzer Rundgang</b></span>' +
      '<button type="button" class="rdg-los">Zeigen' + PFEIL + '</button><button type="button" class="rdg-schild__zu" aria-label="Schliessen"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg></button>';
    function platz() {   /* fest über die Leiste unten, gesetzt beim Erscheinen und bei geänderter Fenstergrösse, nie nach dem Inhalt darunter (Fehlerbuch 10a) */
      var l = document.querySelector('#ws-leiste'), lr = l && l.getBoundingClientRect();
      s.style.bottom = (l && lr && lr.height > 5 ? Math.max(24, innerHeight - lr.top + 14) : 24) + 'px';
    }
    document.body.appendChild(s); platz();
    addEventListener('resize', platz);
    var wache = 0;
    var uhr = 0, ueber = false;
    function weg() { clearTimeout(uhr); removeEventListener('resize', platz); s.classList.add('weg'); setTimeout(function () { s.remove(); }, 650); }
    function zaehle() { clearTimeout(uhr); uhr = setTimeout(function () { if (!ueber) weg(); }, 10000); }
    s.addEventListener('mouseenter', function () { ueber = true; clearTimeout(uhr); });
    s.addEventListener('mouseleave', function () { ueber = false; uhr = setTimeout(weg, 2000); });
    s.querySelector('.rdg-los').onclick = function () { weg(); starte(); };
    s.querySelector('.rdg-schild__zu').onclick = weg;
    zaehle();
  }

  /* «Kurzer Rundgang» als Weg im Rand, damit er sich jederzeit wieder öffnen lässt. */
  function weg_im_rand() {
    var wege = document.querySelector('#ws-rand .wo-rand__wege');
    if (!wege || wege.querySelector('.rdg-wieder')) return;
    var a = document.createElement('a'); a.href = '?rundgang'; a.className = 'rdg-wieder'; a.textContent = 'Kurzer Rundgang';
    a.onclick = function (e) { e.preventDefault(); if (document.documentElement.classList.contains('wo-rand-auf')) { var k = document.querySelector('[data-wo-rand-knopf]'); if (k) k.click(); } starte(); };
    wege.appendChild(a);
  }
  function los() {
    vielleicht();
    new MutationObserver(weg_im_rand).observe(document.getElementById('ws-rand') || document.body, { childList: true });
    weg_im_rand();
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', los) : los();
  window.rundgang = function () { starte(); };
})();
