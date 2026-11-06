/* Culinarium Hannover · Bewegung, Laden, Leiste, Fenster, Filme, Fassungen, Warteliste. Nur transform, nativer Scroll. */
(function () {
  'use strict';
  var html = document.documentElement;
  var ruhig = html.classList.contains('ruhig');
  var IO = 'IntersectionObserver' in window;
  /* handy-2810: am Handy (bis 860 px) laden Bilder sparsamer (Robert 28.10.2026: «die Bilder laden nicht»): Safari auf dem iPhone wirft Bilder wieder weg,
     wenn zu viele zu grosse zugleich entpackt sind (Startseite vorher ~95 Bilder, bei 3-fach-Pixeldichte über 500 MB). Darum: Bildgrösse für 2-fach statt 3-fach,
     nur zwei Bildschirme voraus, nichts auf Vorrat. */
  var handy = innerWidth < 861, dpr = window.devicePixelRatio || 1;

  /* ---------- Bilder: drei Bildschirme voraus laden, danach alles Übrige im Leerlauf (am Handy: zwei Bildschirme, kein Vorrat) */
  function laden(img) {
    if (!img.dataset.srcset) return;
    var sz = img.dataset.sizes || '100vw';
    if (handy && dpr > 2) sz = sz.split(',').map(function (t) { return t.replace(/([\d.]+)(vw|px)\s*$/, function (_, n, u) { return (n * 2 / dpr).toFixed(2) + u; }); }).join(',');
    img.sizes = sz;
    img.srcset = img.dataset.srcset;
    img.removeAttribute('data-srcset');
  }
  function sichtbar(el) { return !el.closest('[hidden]'); }
  /* handy-2810: am Handy bis zum load-Ereignis anderthalb Bildschirme voraus (der Auftakt bekommt die Leitung), danach zweieinhalb (29.10.: bei schneller Fahrt kamen die Bilder zu spät, Robert 09:27) */
  function neuerLader(rand) {
    return new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && sichtbar(e.target)) { laden(e.target); lader.unobserve(e.target); } });
    }, { rootMargin: rand });
  }
  var lader = IO ? neuerLader(handy ? '150% 0px 150% 0px' : '0px 0px 0px 0px') : null;   /* 29.10.2026 Hero sofort: am Rechner bis «load» nur, was im Bild ist, danach drei Bildschirme voraus (unten) */
  function ladeAlle(root) {
    (root || document).querySelectorAll('img[data-srcset]').forEach(function (img) {
      if (!sichtbar(img)) return;
      lader ? lader.observe(img) : laden(img);
    });
  }
  ladeAlle();
  if (handy && lader) window.addEventListener('load', function () { lader.disconnect(); lader = neuerLader('250% 0px 250% 0px'); ladeAlle(); });
  /* handy-2810 (29.10.): die Teller-Reihe (.lf) läuft seitlich; Bilder rechts ausserhalb des Bandes schneiden den Bildschirm nicht und kämen erst beim Hereinfahren.
     Ebenso die Gerichte-Bilder von Dirty Chicken (.e18-wahl): die inaktiven stehen 101 % unter dem Rahmen und kämen erst beim Antippen.
     Am Handy darum das ganze Band bzw. den Rahmen laden, sobald es anderthalb Bildschirme nah ist (13 Bilder in der 640er-Stufe, die Kopie teilt die Dateien) */
  if (handy && IO) {
    var bandLader = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.querySelectorAll('img[data-srcset]').forEach(function (i) { if (lader) lader.unobserve(i); laden(i); });
        bandLader.unobserve(e.target);
      });
    }, { rootMargin: '150% 0px 150% 0px' });
    document.querySelectorAll('.lf, .e18-wahl').forEach(function (l) { bandLader.observe(l); });
  }
  if (!handy && lader) window.addEventListener('load', function () { lader.disconnect(); lader = neuerLader('300% 0px 300% 0px'); ladeAlle(); });
  if (!handy) window.addEventListener('load', function () {
    var rest = [].slice.call(document.querySelectorAll('img[data-srcset]')).filter(sichtbar);
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 200); };
    (function weiter() {
      if (!rest.length) return;
      idle(function () { for (var n = 0; n < 3 && rest.length; n++) laden(rest.shift()); weiter(); });
    })();
  });

  /* ---------- Auftritte: ausgelöst, sobald der Bereich den Rand berührt; nur einmal */
  var auf = IO && !ruhig ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      da(e.target);
      auf.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -3% 0px', threshold: 0 }) : null;
  function da(el) {
    el.classList.add('da');
    el.querySelectorAll('[data-zahl]').forEach(zaehle);
    if (el.matches('[data-zahl]')) zaehle(el);
  }
  function beobachte(root) {
    (root || document).querySelectorAll('.auf').forEach(function (el) {
      if (!sichtbar(el)) return;
      auf ? auf.observe(el) : el.classList.add('da');
    });
  }
  beobachte();
  /* Auswahl-Seite: neu gezeigte Fassung laden und auftreten lassen */
  window.culinariumNeu = function (root) {
    root.querySelectorAll('img[data-srcset]').forEach(laden);
    root.querySelectorAll('.da').forEach(function (x) { x.classList.remove('da'); });
    requestAnimationFrame(function () { beobachte(root); });
  };
  window.culinariumAlles = function () { document.querySelectorAll('img[data-srcset]').forEach(laden); document.querySelectorAll('.auf').forEach(function (x) { x.classList.add('da'); }); };


  /* ---------- Bühne (Monte-Moro): Ebenen wandern mit eigenem Faktor, das Foto gleitet im Rahmen; ein Takt, nur sichtbare Bühnen ---------- */
  (function () {
    if (ruhig || !IO) return;
    var vh = innerHeight, handy = innerWidth < 860;
    var bn = [].slice.call(document.querySelectorAll('.bn')).map(function (k) {
      return { k: k, an: false, eb: [].slice.call(k.querySelectorAll('[data-tiefe]')).map(function (el) { var fo = el.querySelector('.fo'); return { el: el, f: parseFloat(el.dataset.tiefe), img: fo && fo.querySelector('img'), h: fo ? fo.offsetHeight : 0 }; }) };
    });
    if (!bn.length) return;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.__b.an = e.isIntersecting; }); takt(); }, { rootMargin: '25% 0px 25% 0px' });
    bn.forEach(function (b) { b.k.__b = b; io.observe(b.k); });
    var lt = false;
    function bild() {
      lt = false; if (handy) return;
      var weg = Math.min(130, vh * .15);
      bn.forEach(function (b) {
        if (!b.an) return;
        var r = b.k.getBoundingClientRect(), p = Math.max(-1.2, Math.min(1.2, (r.top + r.height / 2 - vh / 2) / vh));
        b.eb.forEach(function (o) {
          o.el.style.transform = 'translate3d(0,' + (p * o.f * weg).toFixed(1) + 'px,0)';
          if (o.img) o.img.style.translate = '0 ' + (Math.max(-1, Math.min(1, p)) * Math.min(48, o.h * .06)).toFixed(1) + 'px';
        });
      });
    }
    function takt() { if (!lt) { lt = true; requestAnimationFrame(bild); } }
    addEventListener('scroll', takt, { passive: true });
    addEventListener('resize', function () { vh = innerHeight; handy = innerWidth < 860; bn.forEach(function (b) { b.eb.forEach(function (o) { if (o.img) o.h = o.img.parentNode.offsetHeight; if (handy) { o.el.style.transform = ''; if (o.img) o.img.style.translate = ''; } }); }); takt(); }, { passive: true });
    bild();
  })();
  /* Bühnen-Rahmen schweben erst, wenn ihr Foto da ist (nie ein leerer Rahmen in Bewegung) */
  if (IO && !ruhig) {
    var fio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; fio.unobserve(e.target); var t = e.target, im = t.querySelector('img');
        if (im && im.dataset.srcset) laden(im);
        var los = function () { t.classList.add('da'); };
        if (!im || (im.complete && im.naturalWidth > 1)) los(); else { im.addEventListener('load', los, { once: true }); setTimeout(los, 1200); }
      });
    }, { rootMargin: '0px 0px 4% 0px' });
    document.querySelectorAll('.bn-eb>.fo').forEach(function (f) { fio.observe(f); });
  } else document.querySelectorAll('.bn-eb>.fo').forEach(function (f) { f.classList.add('da'); });
  /* Grosse Zahl zählt einmal hoch */
  function zaehle(el) {
    if (el.dataset.gezaehlt || ruhig) return;
    el.dataset.gezaehlt = '1';
    var ziel = +el.dataset.zahl, t0 = null, dauer = 1400;
    function schritt(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dauer), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(ziel * e);
      if (p < 1) requestAnimationFrame(schritt);
    }
    el.textContent = '0';
    requestAnimationFrame(schritt);
  }

  document.addEventListener('click', function (e) { var b = e.target.closest('[data-band]'); if (!b) return; var band = b.closest('.vi').querySelector('.vband'); band.scrollBy({ left: +b.dataset.band * band.clientWidth * .7, behavior: 'smooth' }); });
  /* ---------- Leiste: verschwindet beim Hinunterscrollen, kommt beim Hinaufscrollen.
     Startseite wie Rivage (Robert 26.10.2026: «nicht im hero. nur ab 1 abschnitt wenn man zurückscroll»): im Auftakt nie, danach nur beim Hinaufscrollen.
     Gezählt wird der Weg seit dem letzten Richtungswechsel, nicht je Bild (bei 120 Bildern/s ist ein Schritt oft kleiner als 6 px) */
  var leiste = document.getElementById('leiste'), y0 = scrollY, tick = false, richt = 0, anker = y0;
  var auftakt = document.getElementById('auftakt');
  function leisteRechnen() {
    var y = scrollY;
    if ((y - y0) * richt < 0 || (!richt && y !== y0)) { richt = y > y0 ? 1 : -1; anker = y0; }
    var runter = richt > 0 && y - anker > 24, hoch = richt < 0 && anker - y > 24;
    if (auftakt) {
      if (y < auftakt.offsetTop + auftakt.offsetHeight - leiste.offsetHeight || runter) leiste.classList.add('weg');
      else if (hoch) leiste.classList.remove('weg');
    } else if (y < 80 || hoch) leiste.classList.remove('weg');
    else if (runter && y > 160) leiste.classList.add('weg');
    y0 = y; tick = false;
    if (lauf) document.body.classList.toggle('lauf-an', y > (auftakt ? auftakt.offsetHeight * .7 : 300));
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(leisteRechnen); } }, { passive: true });

  /* Menü am Handy */
  var mk = document.querySelector('.leiste-menue'), menue = document.getElementById('menue');
  if (mk) mk.addEventListener('click', function () {
    var offen = mk.getAttribute('aria-expanded') === 'true';
    mk.setAttribute('aria-expanded', String(!offen));
    menue.hidden = offen;
    mk.querySelector('span').textContent = offen ? 'Menü' : 'Schließen';
    document.body.style.overflow = offen ? '' : 'hidden';
  });
  if (menue) menue.addEventListener('click', function (e) { if (e.target.closest('a')) { menue.hidden = true; mk.setAttribute('aria-expanded', 'false'); mk.querySelector('span').textContent = 'Menü'; document.body.style.overflow = ''; } });
  /* Esc schließt das Menü wie der Knopf (Demo-Check 28.10.2026) */
  if (mk && menue) addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menue.hidden) { mk.click(); mk.focus(); } });

  /* ---------- Abendlauf und Ton der Leiste: welcher Teil gerade in der Mitte steht */
  var lauf = document.querySelector('.abendlauf');
  var teile = [].slice.call(document.querySelectorAll('main > section[data-ton]'));
  if (IO) {
    var mitte = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var s = e.target;
        document.body.dataset.mitte = s.dataset.ton;   /* nicht data-ton: sonst färben sich Knöpfe der ganzen Seite mit dem Abschnitt in der Mitte um (Robert 27.10.2026) */
        if (lauf && s.id) lauf.querySelectorAll('a').forEach(function (a) { a.classList.toggle('jetzt', a.dataset.ziel === s.id || (s.id === 'fenster' && a.dataset.ziel === 'ankommen')); });
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    teile.forEach(function (s) { mitte.observe(s); });
  }

  /* ---------- Das Fenster: Bild steht, die Seite zieht darüber */
  document.querySelectorAll('.fenster').forEach(function (f) {
    var schicht = f.querySelector('.fenster-schicht'), satz = f.querySelector('.fenster-satz');
    if (!IO) { schicht.classList.add('an'); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        schicht.classList.toggle('an', e.isIntersecting);
        if (e.isIntersecting) {   /* 29.10.2026 Hero sofort: am Rechner laden die Fenster-Bilder erst, wenn der erste Bildschirm fertig ist («load»), sonst ringen sie mit dem Hero um die Leitung */
          var tun = function () { schicht.querySelectorAll('img[data-srcset]').forEach(laden); };
          if (innerWidth < 861 || document.readyState === 'complete') tun(); else window.addEventListener('load', tun, { once: true });
        }
      });
    }, { rootMargin: '60% 0px 60% 0px' }).observe(f);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { satz.classList.add('da'); f.querySelectorAll('.fs-inhalt .sw').forEach(function (x) { x.classList.add('da'); }); } });
    }, { rootMargin: f.id === 'fenster-pop' ? '0px 0px -80% 0px' : '0px 0px -55% 0px' }).observe(f);   /* Robert 28.10.2026: «ein kleines bisschen eher», von -62% auf -55%: der Satz startet, kurz bevor seine Zeilen frei liegen. Stand davor *.vor-fenster-frueher-2026-10-28 */   /* erst wenn das Fenster die Bildmitte erreicht, wo der Satz steht (Robert 27.10.2026);
       «Opening 2026» erst, wenn der Satz ganz frei liegt (Robert 28.10.2026: «erst starten, wenn ich in den Sichtbereich hineinkomme») */
  });

  /* ---------- Später Auftritt (Robert 28.10.2026: «erst starten, wenn ich in den Sichtbereich hineinkomme»): gleiches Tempo, aber erst, wenn das Element gut im Bild ist, nicht schon am Rand */
  document.querySelectorAll('.auf-spaet').forEach(function (el) {
    if (!IO || ruhig) { el.classList.add('da'); return; }
    var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { el.classList.add('da'); o.disconnect(); } }); }, { threshold: .8, rootMargin: innerWidth < 861 ? '0px 0px -25% 0px' : '0px' });   /* erst, wenn das Element fast ganz im Bild ist (der senkrechte Titel beginnt unten); am Handy steht er waagrecht oben, dort erst über dem unteren Viertel */
    o.observe(el);
  });

  /* ---------- Filme: laufen in Schleife, solange sie zu sehen sind (Robert 27.10.2026: am Ende kein schwarzes Bild, einfach von vorn) */
  document.querySelectorAll('.film').forEach(function (fig) {
    var v = fig.querySelector('video'), vorbereitet = false;
    v.loop = true;
    function vorbereiten() { if (!vorbereitet) { v.src = v.dataset.src; v.preload = 'auto'; vorbereitet = true; } }
    function spielen() { vorbereiten(); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    if (!IO) { vorbereiten(); v.autoplay = true; return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) vorbereiten(); }); }, { rootMargin: '150% 0px' }).observe(fig);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) spielen(); else if (vorbereitet) v.pause(); });
    }, { threshold: .35 }).observe(fig);
  });

  /* handy-2810: kein eigenes Gleiten des Auftakts am Handy; ueberleitung.js («Darüber») lässt den ganzen Einstieg schon mit 0,34 absinken, die Wand zieht darüber */
  /* ---------- Auftakt «Ebenen»: die Bildebenen folgen der Maus mit eigener Tiefe, der Name bleibt stehen; nur mit Maus */
  (function () {
    var f = document.querySelector('.f-ebenen');
    if (!f || ruhig || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var eb = [].slice.call(f.querySelectorAll('.ve-e')), z = { x: 0, y: 0 }, a = { x: 0, y: 0 }, an = true, laeuft = false;
    function los() { if (!laeuft && an) { laeuft = true; requestAnimationFrame(schritt); } }
    function schritt() {
      a.x += (z.x - a.x) * .06; a.y += (z.y - a.y) * .06;
      eb.forEach(function (e) { var k = parseFloat(e.dataset.t); e.style.transform = 'translate3d(' + (a.x * k * 34).toFixed(1) + 'px,' + (a.y * k * 22).toFixed(1) + 'px,0)'; });
      if (an && (Math.abs(z.x - a.x) > .002 || Math.abs(z.y - a.y) > .002)) requestAnimationFrame(schritt); else laeuft = false;
    }
    addEventListener('pointermove', function (e) { z.x = (e.clientX / innerWidth - .5) * 2; z.y = (e.clientY / innerHeight - .5) * 2; los(); }, { passive: true });
    if (IO) new IntersectionObserver(function (es) { an = es[0].isIntersecting; los(); }).observe(f);
  })();

  /* ---------- Fassungen des Auftakts: Nummer und Name unten, Pfeiltasten */
  var fz = document.getElementById('fassungen');
  if (fz) {
    var liste = JSON.parse(fz.dataset.liste), F = [].slice.call(document.querySelectorAll('.fassung'));
    var name = fz.querySelector('.fz-name');
    var start = parseInt(new URLSearchParams(location.search).get('f'), 10);
    if (!start) { try { start = parseInt(localStorage.getItem('culinarium-fassung'), 10); } catch (e) {} }
    var jetzt = 1;
    function zeige(n, ersteMal) {
      n = ((n - 1 + liste.length) % liste.length) + 1;
      jetzt = n;
      F.forEach(function (f) {
        var an = +f.dataset.nr === n;
        f.hidden = !an;
        if (!an) { f.classList.remove('offen'); f.querySelectorAll('.da').forEach(function (x) { x.classList.remove('da'); }); }
      });
      var f = F[n - 1];
      name.innerHTML = '<b>' + n + '</b> · ' + liste[n - 1][1];
      f.querySelectorAll('img[data-srcset]').forEach(laden);
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        f.classList.add('offen');
        f.querySelectorAll('.auf').forEach(function (x) { da(x); });
      }); });
      try { localStorage.setItem('culinarium-fassung', n); } catch (e) {}
      if (!ersteMal) history.replaceState(null, '', '?f=' + n + location.hash);
    }
    fz.querySelector('.fz-zurueck').addEventListener('click', function () { zeige(jetzt - 1); });
    fz.querySelector('.fz-vor').addEventListener('click', function () { zeige(jetzt + 1); });
    addEventListener('keydown', function (e) {
      if (e.target.closest('input,textarea,select')) return;
      if (e.key === 'ArrowRight') { zeige(jetzt + 1); }
      else if (e.key === 'ArrowLeft') { zeige(jetzt - 1); }
    });
    zeige(start >= 1 && start <= liste.length ? start : 1, true);
  } else {
    /* Unterseiten: Kopf geht von selbst auf */
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      document.querySelectorAll('main > section:first-child .auf').forEach(function (x) {
        var r = x.getBoundingClientRect(); if (r.top < innerHeight) da(x);
      });
    }); });
  }

  /* ---------- Warteliste als Ticket: der Abriss schreibt mit, beim Absenden löst er sich; es wird nichts verschickt */
  var form = document.querySelector('.wt-form');
  if (form) {
    var TAGE = { fr: ['Freitag', 'ab 19:00'], sa: ['Samstag', 'ab 17:00'], egal: ['Freitag oder Samstag', 'beides geht'] };
    var st = { tag: 'fr', n: 2 }, fName = form.elements.namedItem('name'), fMail = form.elements.namedItem('mail');
    function feld(n, w) { form.querySelectorAll('[data-feld=' + n + ']').forEach(function (el) { el.textContent = w; }); }
    function anzahlText(n) { return n + (n === 1 ? ' Person' : ' Personen'); }
    function male() { feld('n', st.n); feld('tag', TAGE[st.tag][0]); feld('zeit', TAGE[st.tag][1]); feld('name', fName.value.trim() || 'Dein Name'); }
    form.querySelectorAll('[data-schritt]').forEach(function (b) {
      b.addEventListener('click', function () { st.n = Math.max(1, Math.min(6, st.n + +b.dataset.schritt)); male(); });
    });
    form.addEventListener('change', function (e) { if (e.target.name === 'tag') { st.tag = e.target.value; male(); } });
    fName.addEventListener('input', male);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      [fName, fMail].forEach(function (i) { var g = i.checkValidity() && i.value.trim(); i.setAttribute('aria-invalid', g ? 'false' : 'true'); if (!g) ok = false; });
      var m = form.querySelector('.wt-meldung');
      if (!ok) { form.classList.remove('fertig'); m.innerHTML = 'Bitte Name und E-Mail eintragen.'; return; }
      m.innerHTML = 'Danke, ' + fName.value.trim().replace(/[<>&]/g, '') + '. Du stehst auf der Liste: ' + TAGE[st.tag][0] + ', ' + anzahlText(st.n) + '.<small>Diese Vorschau verschickt noch nichts.</small>';
      form.classList.add('fertig');
    });
  }
})();

/* Teller-Reihe: läuft langsam von selbst, lässt sich jederzeit selbst schieben (Maus ziehen, Trackpad, Finger); kein Halt beim Darüberfahren */
(function () {
  document.querySelectorAll('.lf[data-lauf]').forEach(function (lf) {
    var sichtbar = false, pause = 0, x = 0, ziehen = null, letzt = 0;
    var halb = function () { return lf.scrollWidth / 2; };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { sichtbar = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(lf);
    var ruhig = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function takt(t) {
      var dt = letzt ? Math.min(t - letzt, 50) : 16; letzt = t;
      if (sichtbar && !ruhig && !ziehen && t > pause && !/[?&]lf=/.test(location.search)) {
        if (Math.abs(lf.scrollLeft - x) > 2) x = lf.scrollLeft;   /* selbst geschoben: dort weiterlaufen */
        x += dt * 0.045;
        if (x >= halb()) x -= halb();
        lf.scrollLeft = x;
      } else if (lf.scrollLeft >= halb()) lf.scrollLeft -= halb();
      requestAnimationFrame(takt);
    }
    requestAnimationFrame(takt);
    ['wheel', 'touchstart'].forEach(function (ev) { lf.addEventListener(ev, function () { pause = performance.now() + 1800; }, { passive: true }); });
    lf.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; ziehen = { x: e.clientX, s: lf.scrollLeft }; lf.classList.add('zieht'); });
    window.addEventListener('pointermove', function (e) { if (ziehen) { lf.scrollLeft = ziehen.s - (e.clientX - ziehen.x); } });
    window.addEventListener('pointerup', function () { if (ziehen) { ziehen = null; lf.classList.remove('zieht'); pause = performance.now() + 1200; } });
    lf.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });
})();

/* «Aus demselben Haus» (Flankiert, Dirty-Chicken-Seite): die beiden Randbilder wandern leicht gegenläufig, nur transform, nicht am Handy */
(function () {
  var el = [].slice.call(document.querySelectorAll('[data-fl]'));
  if (!el.length || document.documentElement.classList.contains('ruhig') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var lt = false;
  function bild() {
    lt = false;
    var vh = innerHeight, schmal = innerWidth < 961;
    el.forEach(function (e) {
      if (schmal) { e.style.transform = ''; return; }
      var r = e.parentNode.getBoundingClientRect(), p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
      e.style.transform = 'translate3d(0,' + (p * +e.dataset.fl * -40).toFixed(1) + 'px,0)';
    });
  }
  function takt() { if (!lt) { lt = true; requestAnimationFrame(bild); } }
  addEventListener('scroll', takt, { passive: true });
  addEventListener('resize', takt, { passive: true });
  bild();
})();

/* Abend und Haus (Über Eck): die beiden Bildgruppen rücken beim Hereinscrollen an der Naht zusammen (nur transform, nicht am Handy);
   die Naht läuft unter dem Bild im selben Winkel weiter zwischen die beiden Texte */
(function () {
  var el = [].slice.call(document.querySelectorAll('[data-ue]'));
  var weiter = document.querySelector('.ue-weiter line'), rahmen = document.querySelector('.ue-rahmen');
  if (!el.length) return;
  var keile = [].slice.call(document.querySelectorAll('.ue-keil'));
  function winkel() {
    if (!weiter || !rahmen) return;
    var R = rahmen.getBoundingClientRect(), H = Math.max(1, R.height);
    /* Keile unter den Texten: Schräge der Naht (14 % der Breite auf die Höhe der Bildwand), Höhe so hoch wie der Text (zweimal, weil der Keil umbricht) */
    if (keile.length && innerWidth > 960) {
      keile[0].parentNode.parentNode.style.setProperty('--schraege', (.14 * R.width / H).toFixed(4));
      for (var n = 0; n < 2; n++) keile.forEach(function (k) {
        var t = k.parentNode, h = 0;
        [].forEach.call(t.children, function (c) { if (c !== k) h = Math.max(h, c.offsetTop + c.offsetHeight - t.offsetTop); });
        k.style.setProperty('--keil-h', Math.round(h) + 'px');
      });
    }
    var h = weiter.ownerSVGElement.getBoundingClientRect().height;
    weiter.setAttribute('x2', (43 - 14 * h / H).toFixed(2));
  }
  winkel(); addEventListener('resize', winkel, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(winkel);
  if (document.documentElement.classList.contains('ruhig') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var lt = false;
  function bild() {
    lt = false;
    var vh = innerHeight, schmal = innerWidth < 961;
    el.forEach(function (e) {
      if (schmal) { e.style.transform = ''; return; }
      var r = e.parentNode.getBoundingClientRect(), p = Math.max(0, Math.min(1, (vh - r.top) / (vh * .55 + r.height * .45)));
      e.style.transform = 'translate3d(' + ((1 - p) * -30 * +e.dataset.ue).toFixed(1) + 'px,0,0)';
    });
  }
  function takt() { if (!lt) { lt = true; requestAnimationFrame(bild); } }
  addEventListener('scroll', takt, { passive: true });
  addEventListener('resize', takt, { passive: true });
  bild();
})();

/* Abend und Haus: die beiden Knöpfe sitzen am Strich, links davor und rechts dahinter, auf seiner Höhe gemessen.
   Ohne Skript stehen sie schon richtig in ihren Spalten (CSS), hier wird nur der Abstand zum Strich angeglichen. */
(function () {
  var ln = document.querySelector('.ue-weiter line'), kl = document.querySelector('.ue-kl'), kr = document.querySelector('.ue-kr');
  if (!ln || !kl || !kr) return;
  var LUFT = 26;
  function setzen() {
    try {
      if (innerWidth <= 960) return;
      kl.style.setProperty('--kr', '0px'); kr.style.setProperty('--kl', '0px');
      var L = ln.getBoundingClientRect();   /* gezeichnete Linie: oben rechts, unten links */
      var a = kl.getBoundingClientRect(), b = kr.getBoundingClientRect(), y = a.top + a.height / 2;
      if (!L.height || !a.width) return;
      var lx = L.right - (L.right - L.left) * ((y - L.top) / L.height);
      kl.style.setProperty('--kr', Math.round(a.right - (lx - LUFT)) + 'px');
      kr.style.setProperty('--kl', Math.round(lx + LUFT - b.left) + 'px');
    } catch (e) {}
  }
  setzen(); addEventListener('load', setzen); addEventListener('resize', setzen, { passive: true });
  setTimeout(setzen, 600); setTimeout(setzen, 2000);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setzen);
  if ('MutationObserver' in window) new MutationObserver(setzen).observe(ln, { attributes: true });
  if ('ResizeObserver' in window) new ResizeObserver(setzen).observe(kl.parentNode);
  var nah = false;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) setzen(); }).observe(kl.parentNode);
})();

/* Gut zu wissen als Ticket: Frage antippen, der Hauptteil zeigt ihre Antwort */
(function () {
  document.querySelectorAll('[data-gt]').forEach(function (t) {
    t.addEventListener('click', function (e) {
      var q = e.target.closest('[data-q]'); if (!q) return;
      t.querySelectorAll('[data-q]').forEach(function (x) { var an = x === q; x.classList.toggle('an', an); x.setAttribute('aria-pressed', an); });
      t.querySelectorAll('[data-a]').forEach(function (x) { x.classList.toggle('an', x.dataset.a === q.dataset.q); });
    });
  });
})();

/* Bildwahl im Fenster «Eine Familie, zwei Küchen» (nur mit ?fb=N): ← → wechseln */
(function () {
  var q = new URLSearchParams(location.search), n = parseInt(q.get('fb'), 10), d = document.getElementById('fb-wahl'), f = document.getElementById('fenster3');
  if (!(n >= 1) || !d || !f) return;
  var L = JSON.parse(d.textContent), img = f.querySelector('.fenster-schicht img');
  var tafel = document.createElement('div');
  tafel.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:300;background:#16151A;color:#FAF4F4;border:1px solid rgba(239,118,73,.6);border-radius:999px;padding:10px 20px;font:500 13px/1 Urbanist,sans-serif;letter-spacing:.06em;display:flex;gap:16px;align-items:center';
  document.body.appendChild(tafel);
  function zeig(i) {
    n = (i + L.length - 1) % L.length + 1; var e = L[n - 1];
    img.removeAttribute('data-srcset'); img.srcset = e[1]; img.sizes = '100vw'; img.style.objectPosition = e[2];
    tafel.innerHTML = '<span style="color:#F5A689">Bild ' + n + ' / ' + L.length + '</span><span>' + e[3] + '</span><span style="opacity:.6">← →</span>';
    history.replaceState(null, '', '?fb=' + n + '#fenster3');
  }
  addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); zeig(n + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); zeig(n - 1); } });
  zeig(n);
  setTimeout(function () { f.scrollIntoView({ block: 'center' }); }, 300);
})();

/* Bildwahl im Teller-Laufband (nur mit ?lf=N): das Glas (d2) wird ersetzt, ← → wechseln, das Band hält an */
(function () {
  var q = new URLSearchParams(location.search), n = parseInt(q.get('lf'), 10), d = document.getElementById('lf-wahl'), lf = document.querySelector('.lf[data-lauf]');
  if (!(n >= 1) || !d || !lf) return;
  var L = JSON.parse(d.textContent);
  var imgs = [].slice.call(lf.querySelectorAll('img')).filter(function (i) { return new RegExp('/' + (q.get('b') || 'd2') + '-').test(i.getAttribute('data-srcset') || i.getAttribute('srcset') || ''); });
  var tafel = document.createElement('div');
  tafel.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:300;background:#16151A;color:#FAF4F4;border:1px solid rgba(239,118,73,.6);border-radius:999px;padding:10px 20px;font:500 13px/1 Urbanist,sans-serif;letter-spacing:.06em;display:flex;gap:16px;align-items:center';
  document.body.appendChild(tafel);
  function zeig(i) {
    n = (i + L.length - 1) % L.length + 1; var e = L[n - 1];
    imgs.forEach(function (img) { img.removeAttribute('data-srcset'); img.srcset = e[1]; img.sizes = '50vw'; });
    tafel.innerHTML = '<span style="color:#F5A689">Bild ' + n + ' / ' + L.length + '</span><span>' + e[2] + '</span><span style="opacity:.6">← →</span>';
    history.replaceState(null, '', '?lf=' + n + '&b=' + (q.get('b') || 'd2'));
    var t = imgs[0]; if (t) { var r = t.closest('.lf-g'); lf.scrollLeft = r.offsetLeft - (lf.clientWidth - r.offsetWidth) / 2; }
  }
  addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); zeig(n + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); zeig(n - 1); } });
  lf.removeAttribute('data-lauf');
  function hin() { var r = lf.getBoundingClientRect(); scrollTo(0, scrollY + r.top - (innerHeight - r.height) / 2); }
  zeig(n); addEventListener('load', function () { setTimeout(hin, 300); setTimeout(hin, 1200); setTimeout(hin, 2200); });
})();

/* Warteliste im Fuss: E-Mail mitnehmen und auf der Abend-Seite schon eintragen */
(function () {
  var f = document.querySelector('.fu-wl-f');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var wert = f.elements.namedItem('mail').value.trim(), hier = document.querySelector('.wt-form input[name="mail"]');
    /* schon auf der Abend-Seite: kein Neuladen, also direkt eintragen und hinspringen (Prüfung 28.10.2026) */
    if (hier) { hier.value = wert; history.replaceState(null, '', '#warteliste'); document.getElementById('warteliste').scrollIntoView(); return; }
    try { sessionStorage.setItem('wl-mail', wert); } catch (x) {}
    location.href = 'abend.html#warteliste';
  });
  var m = document.querySelector('.wt-form input[name="mail"]'), v = null;
  try { v = sessionStorage.getItem('wl-mail'); } catch (x) {}
  if (m && v) { m.value = v; try { sessionStorage.removeItem('wl-mail'); } catch (x) {} }
})();

/* Was auf den Tisch kommt, Vier Säulen: jede Säule gleitet in eigenem Tempo (nur transform, nativer Scroll) */
(function () {
  var S = document.querySelectorAll('[data-ms-par]');
  if (!S.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var reihe = S[0].parentNode, lauf = false;
  function takt() {
    lauf = false;
    if (innerWidth < 861) { S.forEach(function (s) { s.style.transform = ''; }); return; }   /* handy-2810 */
    var h = innerHeight, r = reihe.getBoundingClientRect();
    if (r.bottom < -200 || r.top > h + 200) return;
    var p = (r.top + r.height / 2 - h / 2) / h;
    S.forEach(function (s) { s.style.transform = 'translate3d(0,' + (p * +s.dataset.msPar * h * -1.6).toFixed(1) + 'px,0)'; });
  }
  function an() { if (!lauf) { lauf = true; requestAnimationFrame(takt); } }
  addEventListener('scroll', an, { passive: true });
  addEventListener('resize', an);
  an();
})();

/* Alle Abende: Plakat anklicken klappt den Abend auf */
(function () {
  var offen = null;
  /* Plakat so breit, dass es genau so hoch steht wie die Angaben daneben: keine Lücke unter Plakat oder Text (Robert 27.10.2026) */
  function passen(d) {
    var o = d.querySelector('.ad-oben'), t = d.querySelector('.ad-text'), i = d.querySelector('.ad-plakat img');
    if (!o || !t) return;
    if (innerWidth < 861) { o.style.gridTemplateColumns = ''; return; }
    var r = i && i.naturalWidth ? i.naturalWidth / i.naturalHeight : .8, W = o.clientWidth, l = d.querySelector('.ad-liste');
    /* Erst einspaltig; reicht das Plakat in voller Breite nicht bis unter den Text, laufen die Angaben in zwei Spalten */
    function setzen() {
      var w = W * .42;
      for (var n = 0; n < 6; n++) { o.style.gridTemplateColumns = w + 'px minmax(0,1fr)'; w = Math.max(W * .2, Math.min(W * .58, t.offsetHeight * r)); }
      o.style.gridTemplateColumns = w + 'px minmax(0,1fr)';
      return t.offsetHeight - w / r;
    }
    if (l) l.classList.remove('zwei');
    if (setzen() > 4 && l) { l.classList.add('zwei'); setzen(); }
  }
  function auf(key) { var d = document.getElementById('ad-' + key); if (!d) return; d.hidden = false; offen = d; document.documentElement.style.overflow = 'hidden'; d.querySelector('.ad-blatt').scrollTop = 0; d.querySelector('.ad-zu').focus();
    passen(d); var i = d.querySelector('.ad-plakat img'); if (i && !i.complete) i.addEventListener('load', function () { passen(d); }, { once: true });
    schweben(d); }
  /* Bilder im Abend schweben herauf und zoomen in ihren Rahmen, jedes Mal beim Öffnen und beim Scrollen im Blatt (Robert 27.10.2026) */
  function schweben(d) {
    var b = d.querySelector('.ad-blatt'), els = d.querySelectorAll('.ad-plakat,.ad-k-b');
    [].forEach.call(els, function (e) { e.classList.remove('da'); });
    if (d._io) d._io.disconnect();
    if (!('IntersectionObserver' in window)) { [].forEach.call(els, function (e) { e.classList.add('da'); }); return; }
    void b.offsetWidth;
    var io = d._io = new IntersectionObserver(function (es) {
      var n = 0;
      es.forEach(function (e) { if (e.isIntersecting) { e.target.style.setProperty('--d', (n++ * .09).toFixed(2) + 's'); e.target.classList.add('da'); io.unobserve(e.target); } });
    }, { root: b, rootMargin: '0px 0px -6% 0px' });
    [].forEach.call(els, function (e) { io.observe(e); });
  }
  addEventListener('resize', function () { if (offen) passen(offen); });
  function zu() { if (!offen) return; offen.hidden = true; [].forEach.call(offen.querySelectorAll('.ad-plakat,.ad-k-b'), function (e) { e.classList.remove('da'); }); offen = null; document.documentElement.style.overflow = ''; }
  document.querySelectorAll('[data-abend]').forEach(function (f) {
    f.addEventListener('click', function () { auf(f.dataset.abend); });
    f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); auf(f.dataset.abend); } });
  });
  document.addEventListener('click', function (e) { if (e.target.closest('.ad [data-zu]')) zu(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(); });
})();

/* ---------- Bilderwand freistehend: jedes Bild gleitet beim Scrollen mit eigener Geschwindigkeit (--g0 je Feld), nur sichtbare Wände */
(function () {
  if (document.documentElement.classList.contains('ruhig') || !('IntersectionObserver' in window)) return;
  var W = [].slice.call(document.querySelectorAll('.fw-frei')).map(function (w) { return { w: w, an: false, z: [].slice.call(w.children) }; });
  if (!W.length) return;
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.__w.an = e.isIntersecting; }); takt(); }, { rootMargin: '20% 0px' });
  W.forEach(function (o) { o.w.__w = o; io.observe(o.w); });
  var lt = false;
  function rechnen() {
    lt = false; var vh = innerHeight;
    W.forEach(function (o) {
      if (!o.an) return;
      o.z.forEach(function (z) {
        var r = z.getBoundingClientRect(), p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        var f = parseFloat(getComputedStyle(z).getPropertyValue('--g0')) || 0;
        z.style.setProperty('--g', (p * f * Math.min(46, r.height * .09)).toFixed(1) + 'px');
      });
    });
  }
  function takt() { if (!lt) { lt = true; requestAnimationFrame(rechnen); } }
  addEventListener('scroll', takt, { passive: true });
  addEventListener('resize', takt, { passive: true });
})();

/* Alle Abende, Übergang «Die Schere»: Fortschritt der stehenden Bühne als --k (0 oben, 1 am Ende) */
(function () {
  var bu = document.querySelector('.kg-buehne'); if (!bu) return;
  function r() { var h = bu.getBoundingClientRect(), k = Math.min(1, Math.max(0, -h.top / (h.height - innerHeight))); bu.style.setProperty('--k', k.toFixed(4)); }
  addEventListener('scroll', function () { requestAnimationFrame(r); }, { passive: true });
  addEventListener('resize', r); r();
})();


/* ---------- Dirty Chicken · Essen: Zeile antippen tauscht das Bild an derselben Stelle (Robert 27.10.2026, Fassung 18 mit Bildwechsel) */
document.addEventListener('click', function (e) {
  var b = e.target.closest('.e18-z'); if (!b) return;
  var sek = b.closest('.e18'), rahmen = sek && sek.querySelector('.e18-wahl'); if (!rahmen) return;
  rahmen.dataset.wahl = b.dataset.s;
  sek.querySelectorAll('.e18-z').forEach(function (x) { var an = x === b; x.classList.toggle('an', an); x.setAttribute('aria-pressed', an ? 'true' : 'false'); });
});

/* ---------- Der Weg · der runde Aufkleber dreht sich beim Scrollen ein Stück (Robert 28.10.2026, Fassung 6). Nur transform. */
(function () {
  if (document.documentElement.classList.contains('ruhig')) return;
  var els = [].slice.call(document.querySelectorAll('[data-dreh]')), lt = false; if (!els.length) return;
  function r() {
    lt = false;
    var vh = innerHeight;
    els.forEach(function (el) {
      var b = el.getBoundingClientRect(); if (b.bottom < -vh * .2 || b.top > vh * 1.2) return;
      var p = Math.max(0, Math.min(1, (vh - b.top) / (vh + b.height)));
      el.style.transform = 'rotate(' + ((p - .5) * (+el.dataset.dreh || 0)).toFixed(2) + 'deg)';
    });
  }
  function takt() { if (!lt) { lt = true; requestAnimationFrame(r); } }
  addEventListener('scroll', takt, { passive: true });
  addEventListener('resize', takt, { passive: true });
  takt();
})();

/* Sprachknopf unten links (Robert 29.10.2026): geht mit der Leiste oben wie der Chat-Knopf (anfrage.js): verschwindet beim Hinunterscrollen,
   kommt beim Hinaufscrollen (Klasse «weg» an #leiste) und tritt zurück, sobald die letzte Zeile des Fusses im Bild ist */
(function () {
  var k = document.querySelector('.sprache-knopf'), l = document.getElementById('leiste'), u = document.querySelector('.fu-unten'), fuss = false;
  if (!k) return;
  function setz() { k.classList.toggle('weg', fuss || !!(l && l.classList.contains('weg'))); }
  if (l && 'MutationObserver' in window) new MutationObserver(setz).observe(l, { attributes: true, attributeFilter: ['class'] });
  if (u && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { fuss = es[0].isIntersecting; setz(); }).observe(u);
  setz();
})();

/* Der Weg, Karte (Abnahme-Tor 30.10.2026): die Karte füllt ihren Rahmen und wird an den Seiten beschnitten (am Handy stark);
   Strassennamen, die nicht ganz im sichtbaren Ausschnitt stehen, werden ausgeblendet statt angeschnitten. */
(function () {
  var k = document.querySelector('svg.wk-karte');
  if (!k) return;
  function pruefe() {
    var sr = k.getBoundingClientRect();
    if (!sr.width) return;
    k.querySelectorAll('.wk-namen text').forEach(function (t) {
      t.style.visibility = '';
      var r = t.getBoundingClientRect();
      if (r.width && !(r.left >= sr.left - 0.5 && r.right <= sr.right + 0.5 && r.top >= sr.top - 0.5 && r.bottom <= sr.bottom + 0.5)) t.style.visibility = 'hidden';
    });
  }
  pruefe();
  addEventListener('resize', pruefe, { passive: true });
  addEventListener('load', pruefe);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pruefe);
})();
