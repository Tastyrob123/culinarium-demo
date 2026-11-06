/* Culinarium · Seite «Der Abend»: die 15 Fassungen des Auftakts zum Durchklicken (Bau: website/abend_auftakt.py).
   Pfeiltasten ← →, Leiste unten, Stand in ?f=N, beim Wechsel oben bleiben. Eine Fassung bewegt sich erst, wenn ihre Bilder da sind.
   Nur transform und opacity; was gerade nicht sichtbar ist, rechnet nicht. */
(function () {
  'use strict';
  var s = document.getElementById('auftakt'), leiste = document.getElementById('aa-leiste');
  if (!s) return;
  var html = document.documentElement, ruhig = html.classList.contains('ruhig');
  var F = [];   /* nach Nummer abgelegt: auf der fertigen Seite steht nur die gewählte Fassung */
  [].forEach.call(s.querySelectorAll(':scope>.aa-f'), function (f) { F[+f.dataset.nr] = f; });
  var N = F.length;
  var jetzt = +s.dataset.an || 0, lauf = 0;

  function bilder(f, hoch) {
    f.querySelectorAll('img[data-aa]').forEach(function (i) { if (hoch) i.fetchPriority = 'high'; i.srcset = i.dataset.aa; i.removeAttribute('data-aa'); });
  }
  function fertig(f, dann) {
    var im = [].slice.call(f.querySelectorAll('.aa-buehne img')), offen = im.length, ok = false;
    function eins() { if (--offen <= 0 && !ok) { ok = true; dann(); } }
    if (!offen) return dann();
    im.forEach(function (i) {
      if (i.complete && i.naturalWidth) eins();
      else { i.addEventListener('load', eins, { once: true }); i.addEventListener('error', eins, { once: true }); }
    });
    setTimeout(function () { if (!ok) { ok = true; dann(); } }, 0);   /* 29.10.2026 (Oberchef, Hero sofort): Titel und Sätze warten nicht auf die Bilder, die kommen mit ihrem Abbild-Grund; vorher 350 ms am Handy, 1600 ms am Rechner */
  }
  function zahlen(f) {
    f.querySelectorAll('[data-aa-zahl]').forEach(function (el) {
      var ziel = +el.dataset.aaZahl, t0 = null, dauer = 1500;
      if (ruhig) { el.textContent = ziel; return; }
      el.textContent = '0';
      function schritt(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dauer), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(ziel * e);
        if (p < 1) requestAnimationFrame(schritt);
      }
      setTimeout(function () { requestAnimationFrame(schritt); }, 350);
    });
  }

  function zeige(n, erstes) {
    n = (n + N) % N;
    var nr = ++lauf;
    jetzt = n;
    F.forEach(function (f, i) {
      if (i === n) return;
      f.hidden = true; f.classList.remove('bereit', 'los');
    });
    var f = F[n];
    f.hidden = false;
    s.classList.toggle('aa-null', n === 0);
    s.dataset.an = n;
    if (erstes && f.classList.contains('los')) { leisteZeigen(); zahlen(f); nachbarn(n); return; }   /* handy-2810: das Inline-Skript hat die Fassung schon gestartet, nicht neu anfahren */
    if (!erstes) { history.replaceState(null, '', '?f=' + n); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
    leisteZeigen();
    if (n === 0) {
      f.classList.add('bereit', 'los');
      if (window.culinariumNeu) window.culinariumNeu(f);
      return;
    }
    f.classList.remove('bereit', 'los');
    bilder(f, true);
    fertig(f, function () {
      if (nr !== lauf) return;
      f.classList.add('bereit');
      void f.offsetWidth;
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        if (nr !== lauf) return;
        f.classList.add('los');
        zahlen(f);
        nachbarn(n);
      }); });
    });
  }
  /* die Nachbarn im Leerlauf vorladen, damit das Weiterklicken sofort steht */
  function nachbarn(n) {
    var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 400); };
    idle(function () { [n + 1, n - 1].forEach(function (k) { k = (k + N) % N; if (k && F[k]) bilder(F[k], false); }); });
  }

  /* ---------- Leiste */
  var knoepfe = leiste ? [].slice.call(leiste.querySelectorAll('[data-aa-nr]')) : [], name = leiste && leiste.querySelector('.aa-name'), daumen = leiste && leiste.querySelector('.aa-daumen');
  function leisteZeigen() {
    if (!leiste) return;
    knoepfe.forEach(function (k) { k.classList.toggle('an', +k.dataset.aaNr === jetzt); });
    name.innerHTML = '<b>' + jetzt + ' / ' + (N - 1) + '</b>' + F[jetzt].dataset.name;
    var an = knoepfe[jetzt];
    var ziel = an.offsetLeft - daumen.clientWidth / 2 + an.clientWidth / 2;
    daumen.scrollTo({ left: Math.max(0, ziel), behavior: 'smooth' });
  }
  if (leiste) leiste.addEventListener('click', function (e) {
    var k = e.target.closest('[data-aa-nr]'), p = e.target.closest('[data-aa-schritt]');
    if (k) zeige(+k.dataset.aaNr);
    else if (p) zeige(jetzt + +p.dataset.aaSchritt);
  });
  addEventListener('keydown', function (e) {
    if (s.dataset.fest) return;
    if (e.altKey || e.metaKey || e.ctrlKey || (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]'))) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); zeige(jetzt + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); zeige(jetzt - 1); }
  });

  /* ---------- Bewegungen, die laufen: ein Takt, nur die sichtbare Fassung, nur solange der Auftakt im Bild ist */
  var imBild = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { imBild = es[0].isIntersecting; s.classList.toggle('still', !imBild); F.forEach(function (f) { f.classList.toggle('still', !imBild); }); if (imBild) takt(); }, { rootMargin: '0px' }).observe(s);
  var maus = { x: .5, y: .5, da: false }, blick = { x: 0, y: 0 }, an = false;
  addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; maus.x = e.clientX / innerWidth; maus.y = e.clientY / innerHeight; maus.da = true; if (jetzt === 14) takt(); }, { passive: true });
  addEventListener('scroll', function () { if (jetzt === 12) takt(); }, { passive: true });
  function takt() { if (!an && !ruhig) { an = true; requestAnimationFrame(bild); } }
  function bild(t) {
    an = false;
    if (!imBild) return;
    var f = F[jetzt];
    if (jetzt === 12 && f.classList.contains('los')) {          // 12 Zwei Tempi: zwei Säulen, zwei Geschwindigkeiten
      var y = Math.min(scrollY, innerHeight);
      f.querySelectorAll('.aa12-s').forEach(function (c) { c.style.transform = 'translate3d(0,' + (-y * parseFloat(c.dataset.tempo)).toFixed(1) + 'px,0)'; });
    }
    if (jetzt === 14) {                                          // 14 Von draussen: der Blick folgt der Maus, ohne Maus wandert er langsam
      var zx = maus.da ? (maus.x - .5) * 2 : Math.sin(t / 5200) * .7, zy = maus.da ? (maus.y - .5) * 2 : Math.cos(t / 6700) * .5;
      blick.x += (zx - blick.x) * .045; blick.y += (zy - blick.y) * .045;
      var b = f.querySelector('.aa14-bild'), w = b.offsetWidth * .04, h = b.offsetHeight * .05;
      b.style.transform = 'translate3d(' + (-blick.x * w).toFixed(1) + 'px,' + (-blick.y * h).toFixed(1) + 'px,0)';
      if (Math.abs(zx - blick.x) > .002 || Math.abs(zy - blick.y) > .002 || !maus.da) takt();
    }
  }
  var altZeige = zeige;
  zeige = function (n, e) { altZeige(n, e); if (jetzt === 14 || jetzt === 12) takt(); };

  zeige(jetzt, true);
})();
