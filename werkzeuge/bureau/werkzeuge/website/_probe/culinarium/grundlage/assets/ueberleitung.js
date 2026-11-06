/* Culinarium · Startseite: die 15 Fassungen der Überleitung zum Durchklicken (Bau: website/ueberleitung.py).
   Pfeiltasten ← →, Leiste unten, Stand in ?u=N, beim Wechsel springt die Seite an die Überleitung.
   Ein Takt für alles, was am Scrollen hängt; gerechnet wird nur, solange die Überleitung im Bild ist. Nur transform und opacity. */
(function () {
  'use strict';
  var s = document.getElementById('ueberleitung'), leiste = document.getElementById('ul-leiste');
  if (!s) return;
  var html = document.documentElement, ruhig = html.classList.contains('ruhig') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var auftakt = document.getElementById('auftakt'), ebenen = document.getElementById('ebenen');
  var F = [];   /* nach Nummer abgelegt: auf der fertigen Seite steht nur die gewählte Fassung */
  [].forEach.call(s.querySelectorAll(':scope>.ul-f'), function (f) { F[+f.dataset.nr] = f; });
  var N = F.length;
  var jetzt = +s.dataset.an || 0;
  var IO = 'IntersectionObserver' in window;

  function bilder(f, hoch) {
    f.querySelectorAll('img[data-ul]').forEach(function (i) { if (hoch) i.fetchPriority = 'high'; i.srcset = i.dataset.ul; i.removeAttribute('data-ul'); });
  }
  function nachbarn(n) {
    var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 500); };
    idle(function () { [n + 1, n - 1].forEach(function (k) { k = (k + N) % N; if (F[k]) bilder(F[k], false); }); });
  }

  /* Auftritt einmal, sobald die Fassung den unteren Rand berührt */
  var auf = IO && !ruhig ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); auf.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' }) : null;
  function beobachte(f) {
    f.classList.remove('da');
    if (!auf) { f.classList.add('da'); return; }
    requestAnimationFrame(function () { auf.observe(f); });
  }

  /* zur Überleitung: das Ende des Einstiegs oben, die Überleitung und der Anfang der Bildwand darunter */
  function hin() {
    var y = s.getBoundingClientRect().top + scrollY - innerHeight * .42;
    window.scrollTo({ top: Math.max(0, y), left: 0, behavior: 'instant' });
  }
  window.ulHin = hin;

  function zeige(n, erstes) {
    n = (n + N) % N;
    jetzt = n;
    F.forEach(function (f, i) { if (i !== n) { f.hidden = true; f.classList.remove('da'); if (auf) auf.unobserve(f); } });
    var f = F[n];
    f.hidden = false;
    s.dataset.an = n;
    html.dataset.ul = n;
    if (auftakt) auftakt.style.transform = '';
    zuruecksetzen(f);
    bilder(f, true);
    if (!erstes) { history.replaceState(null, '', '?u=' + n); hin(); }
    beobachte(f);
    if (leiste) leisteZeigen();
    nachbarn(n);
    bereit();
    takt();
  }
  function zuruecksetzen(f) {
    f.querySelectorAll('[style*="transform"],[style*="opacity"]').forEach(function (el) {
      if (el.matches('img')) return;
      el.style.transform = ''; el.style.opacity = '';
    });
  }

  /* ---------- Leiste */
  if (leiste && !s.dataset.fest) {
    var knoepfe = [].slice.call(leiste.querySelectorAll('[data-ul-nr]')), name = leiste.querySelector('.ul-name'), daumen = leiste.querySelector('.ul-daumen');
    var leisteZeigen = function () {
      knoepfe.forEach(function (k) { k.classList.toggle('an', +k.dataset.ulNr === jetzt); });
      name.innerHTML = '<b>' + jetzt + ' / ' + (N - 1) + '</b>' + F[jetzt].dataset.name;
      var an = knoepfe[jetzt];
      daumen.scrollTo({ left: Math.max(0, an.offsetLeft - daumen.clientWidth / 2 + an.clientWidth / 2), behavior: 'smooth' });
    };
    leiste.addEventListener('click', function (e) {
      var k = e.target.closest('[data-ul-nr]'), p = e.target.closest('[data-ul-schritt]');
      if (k) zeige(+k.dataset.ulNr);
      else if (p) zeige(jetzt + +p.dataset.ulSchritt);
    });
    addEventListener('keydown', function (e) {
      if (e.altKey || e.metaKey || e.ctrlKey || (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]'))) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); zeige(jetzt + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); zeige(jetzt - 1); }
    });
  } else { leiste = null; }

  /* ---------- 7 Schräge: Kante im Takt der Fassung, nichts zu rechnen. 6 Laufschrift: steht still, wenn sie nicht im Bild ist */
  var imBild = true;
  if (IO) new IntersectionObserver(function (es) {
    imBild = es[0].isIntersecting;
    F.forEach(function (f) { f.classList.toggle('still', !imBild); });
    if (imBild) takt();
  }, { rootMargin: '25% 0px 25% 0px' }).observe(ebenen || s);

  /* ---------- Bewegungen am Scrollen: ein Takt */
  var lt = false;
  function takt() { if (!lt) { lt = true; requestAnimationFrame(bild); } }
  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { return 1 - Math.pow(1 - x, 3); }
  function bereit() {
    var f = F[jetzt];
    if (jetzt === 2) f.querySelector('.ul2-schicht').classList.remove('an');
  }
  function bild() {
    lt = false;
    var f = F[jetzt], vh = innerHeight, r;
    if (jetzt === 1 && auftakt) {                       // 1 Darüber: der Einstieg sinkt langsam ab, die Wand zieht darüber
      if (ruhig) return;
      var y = scrollY - auftakt.offsetTop, h = auftakt.offsetHeight;
      auftakt.style.transform = y > 0 && y < h * 1.2 ? 'translate3d(0,' + (Math.min(y, h) * .34).toFixed(1) + 'px,0)' : (y >= h * 1.2 ? 'translate3d(0,' + (h * .34).toFixed(1) + 'px,0)' : '');
      return;
    }
    if (!imBild) return;
    if (jetzt === 2) {                                  // 2 Fenster: die stehende Schicht nur zeigen, solange das Fenster im Bild ist
      r = f.querySelector('.ul2-fenster').getBoundingClientRect();
      f.querySelector('.ul2-schicht').classList.toggle('an', r.top < vh && r.bottom > 0);
      return;
    }
    if (ruhig) return;
    if (jetzt === 3) {                                  // 3 Tür auf: die Flügel gehen mit dem Scrollen auseinander
      r = f.querySelector('.ul3-rahmen').getBoundingClientRect();
      var o = ease(cl((vh * .62 - r.top) / (vh * .55)));
      f.querySelector('.ul3-l').style.transform = 'translate3d(' + (-o * 101).toFixed(2) + '%,0,0)';
      f.querySelector('.ul3-r').style.transform = 'translate3d(' + (o * 101).toFixed(2) + '%,0,0)';
    } else if (jetzt === 5) {                           // 5 Farbkante: der Name zieht durch das Band
      r = f.getBoundingClientRect();
      var l = f.querySelector('.ul5-lauf'), p = cl((vh - r.top) / (vh + r.height));
      l.style.transform = 'translate3d(' + (-p * l.offsetWidth * .34).toFixed(1) + 'px,0,0)';
    } else if (jetzt === 9) {                           // 9 Öffnen: der Rahmen wächst, das Bild darin bleibt gleich gross
      var ra = f.querySelector('.ul9-rahmen'), g = f.querySelector('.ul9-gegen');
      r = f.getBoundingClientRect();
      var k = .5 + .5 * ease(cl((vh * .66 - r.top) / (vh * .58)));
      ra.style.transform = 'scale(' + k.toFixed(4) + ')';
      g.style.transform = 'scale(' + (1 / k).toFixed(4) + ')';
    } else if (jetzt === 11) {                          // 11 Lichter an: eins nach dem anderen
      r = f.getBoundingClientRect();
      var q = (vh * .66 - r.top) / (vh * .5);
      f.querySelectorAll('.ul11-z').forEach(function (z, i) { z.style.opacity = (.14 + .86 * cl((q - i * .22) / .3)).toFixed(3); });
    } else if (jetzt === 13) {                          // 13 Durchblick: die Tafel wandert hinter dem Loch
      var t = f.querySelector('.ul13-tief');
      r = f.querySelector('.ul13-wand').getBoundingClientRect();
      var pp = cl((vh - r.top) / (vh + r.height));
      t.style.transform = 'translate3d(0,' + ((.5 - pp) * t.offsetHeight * .2).toFixed(1) + 'px,0)';
    } else if (jetzt === 15) {                          // 15 Ausrichten: schräg hingeworfen, beim Scrollen gerade
      r = f.querySelector('.ul15-reihe').getBoundingClientRect();
      var w = 1 - ease(cl((vh * .66 - r.top) / (vh * .56))), sp = Math.min(70, innerWidth * .05);
      f.querySelectorAll('.ul15-z').forEach(function (z) {
        z.style.transform = 'translate3d(' + (+z.dataset.x * sp * w).toFixed(1) + 'px,' + (+z.dataset.y * w).toFixed(1) + 'px,0) rotate(' + (+z.dataset.dreh * w).toFixed(2) + 'deg)';
      });
    }
  }
  addEventListener('scroll', takt, { passive: true });
  addEventListener('resize', takt, { passive: true });

  zeige(jetzt, true);
})();
