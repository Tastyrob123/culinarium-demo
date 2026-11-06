/* Culinarium · Termine buchen, nur Vorschau: Termine liegen im Browser (localStorage), Zahlung und Mail sind gespielt, es fliesst kein Geld. */
(function () {
  'use strict';
  var KEY = 'culinarium-termine-vorschau';
  var BEISPIEL = [
    { id: 'b1', datum: '2026-11-27', zeit: '19:00', preis: 89, plaetze: 14, gebucht: 5 },
    { id: 'b2', datum: '2026-11-28', zeit: '17:00', preis: 89, plaetze: 14, gebucht: 11 },
    { id: 'b3', datum: '2026-12-18', zeit: '19:00', preis: 89, plaetze: 14, gebucht: 0 },
    { id: 'b4', datum: '2026-12-19', zeit: '17:00', preis: 89, plaetze: 14, gebucht: 14 }
  ];
  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  function lesen() {
    try { var t = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(t)) return t; } catch (e) {}
    return BEISPIEL.map(function (x) { return Object.assign({}, x); });
  }
  function schreiben(t) { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) {} }
  function sortiert(t) { return t.slice().sort(function (a, b) { return (a.datum + a.zeit).localeCompare(b.datum + b.zeit); }); }
  function datum(d) { var p = d.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function eur(n) { return n.toFixed(2).replace('.', ',') + ' EUR'; }
  function wann(t) { var d = datum(t.datum); return TAGE[d.getDay()] + ', ' + d.getDate() + '. ' + MONATE[d.getMonth()] + ' ' + d.getFullYear() + ' ab ' + t.zeit; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var PFEIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- Seite «Der Abend»: Terminkarten */
  var liste = document.querySelector('[data-termine]');
  var dlg = document.getElementById('tb-dialog');
  var aktiv = null, anzahl = 2;

  /* Terminplakate (Robert «3» aus buchen-wahl.html, 27.10.2026): jeder Abend sein Plakat am Brett, eigene Farbe, ausgebuchte mit Streifen */
  var FARBEN = ['#CF7233', '#9C3D3A', '#3F6E5A', '#C29A3A', '#8953A9', '#2F5D8A'], NEIGUNG = [-1.6, 1.2, -.8, 1.8];
  var marke = (document.querySelector('.tb-t-marke') || {}).innerHTML || '';
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('an'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' }) : null;
  function zwei(n) { return (n < 10 ? '0' : '') + n; }

  function karten(sofort) {
    if (!liste) return;
    var t = sortiert(lesen());
    if (!t.length) { liste.innerHTML = '<p class="tb-leer">Gerade steht kein Termin fest. Trag dich unten auf die Warteliste ein.</p>'; return; }
    liste.innerHTML = t.map(function (x, i) {
      var d = datum(x.datum), frei = Math.max(0, x.plaetze - x.gebucht), voll = frei === 0;
      return '<article class="tb-p' + (voll ? ' voll' : '') + '" style="--ak:' + FARBEN[i % FARBEN.length] + ';--rot:' + NEIGUNG[i % NEIGUNG.length] + 'deg;--i:' + i + '">' +
        '<span class="tb-p-nadel"></span><div class="tb-p-papier"><p class="tb-p-mit">A UNiQUE EXPERiENCE BY MOMO X RUDI</p><div class="tb-p-marke">' + marke + '</div>' +
        '<p class="tb-p-dat">' + zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '.</p><p class="tb-p-tag">' + TAGE[d.getDay()] + ' · ab ' + esc(x.zeit) + '</p><span class="tb-p-linie"></span>' +
        '<p class="tb-p-frei">' + (voll ? 'Alle ' + x.plaetze + ' Plätze vergeben' : 'Noch ' + frei + ' von ' + x.plaetze + ' Plätzen frei') + '</p>' +
        '<p class="tb-p-preis">' + eur(+x.preis) + '</p>' +
        (voll ? '<span class="tb-p-aus">Ausgebucht</span>' : '<button class="knopf" type="button" data-buchen="' + esc(x.id) + '"><span>Platz buchen</span><i>' + PFEIL + '</i></button>') +
        '</div>' + (voll ? '<p class="tb-p-streifen" aria-hidden="true">Ausgebucht</p>' : '') + '</article>';
    }).join('');
    /* Plakate schweben nacheinander herauf und kommen in ihrer Neigung zur Ruhe; nach einer Buchung stehen sie sofort still */
    [].forEach.call(liste.querySelectorAll('.tb-p'), function (p) { if (sofort) p.classList.add('an', 'ruhend'); else if (!io) p.classList.add('an'); else io.observe(p); });
  }

  /* jeder Schritt tritt auf wie die Seite: Titel aus dem Schlitz, Felder schweben hoch, das Ticket schwebt herein */
  function schritt(n) {
    dlg.querySelectorAll('[data-schritt]').forEach(function (s) {
      s.hidden = +s.dataset.schritt !== n;
      if (s.hidden) return;
      var auf = s.querySelectorAll('.zl,.sw,.tb-ticket');
      [].forEach.call(auf, function (x) { x.classList.remove('da'); });
      void s.offsetWidth;
      requestAnimationFrame(function () { requestAnimationFrame(function () { [].forEach.call(auf, function (x) { x.classList.add('da'); }); }); });
    });
  }
  function frei() { return Math.max(0, aktiv.plaetze - aktiv.gebucht); }
  function summe() {
    dlg.querySelector('[data-anzahl]').textContent = anzahl;
    dlg.querySelector('[data-summe]').textContent = eur(anzahl * aktiv.preis);
    dlg.querySelector('[data-plus="-1"]').disabled = anzahl <= 1;
    dlg.querySelector('[data-plus="1"]').disabled = anzahl >= Math.min(frei(), 6);
    dlg.querySelector('[data-d-frei]').textContent = 'Noch ' + frei() + ' Plätze frei';
  }
  function oeffnen(id) {
    aktiv = lesen().filter(function (x) { return x.id === id; })[0];
    if (!aktiv || !frei()) return;
    anzahl = Math.min(2, frei());
    dlg.querySelector('[data-d-wann]').textContent = wann(aktiv);
    dlg.querySelector('[data-fehler]').hidden = true;
    dlg.querySelectorAll('input[name=tb-name],input[name=tb-mail]').forEach(function (i) { i.removeAttribute('aria-invalid'); });
    summe(); schritt(1);
    dlg.hidden = false; document.documentElement.style.overflow = 'hidden';
    setTimeout(function () { dlg.querySelector('input[name=tb-name]').focus(); }, 60);
  }
  function zu() { dlg.hidden = true; document.documentElement.style.overflow = ''; }

  if (liste && dlg) {
    karten();
    liste.addEventListener('click', function (e) { var b = e.target.closest('[data-buchen]'); if (b) oeffnen(b.dataset.buchen); });
    dlg.addEventListener('click', function (e) {
      if (e.target.closest('[data-zu]')) return zu();
      var p = e.target.closest('[data-plus]');
      if (p && !p.disabled) { anzahl = Math.max(1, Math.min(anzahl + +p.dataset.plus, Math.min(frei(), 6))); summe(); }
      if (e.target.closest('[data-bezahlen]')) bezahlen();
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dlg.hidden) zu(); });
  }

  function bezahlen() {
    var n = dlg.querySelector('input[name=tb-name]'), m = dlg.querySelector('input[name=tb-mail]'), fehler = dlg.querySelector('[data-fehler]');
    var ok = true;
    [n, m].forEach(function (i) { i.removeAttribute('aria-invalid'); });
    if (!n.value.trim()) { n.setAttribute('aria-invalid', 'true'); ok = false; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m.value.trim())) { m.setAttribute('aria-invalid', 'true'); ok = false; }
    if (!ok) { fehler.textContent = 'Bitte Name und eine gültige E-Mail eintragen.'; fehler.hidden = false; return; }
    fehler.hidden = true;
    var art = dlg.querySelector('input[name=tb-zahl]:checked').value;
    dlg.querySelector('[data-laden-text]').textContent = art === 'PayPal' ? 'Verbindung zu PayPal …' : 'Karte wird geprüft …';
    schritt(2);
    setTimeout(function () {
      var t = lesen(), x = t.filter(function (y) { return y.id === aktiv.id; })[0];
      if (x) { x.gebucht = Math.min(x.plaetze, x.gebucht + anzahl); schreiben(t); }
      dlg.querySelector('[data-t-name]').textContent = n.value.trim();
      dlg.querySelector('[data-t-anzahl]').textContent = anzahl + (anzahl === 1 ? ' Person' : ' Personen');
      dlg.querySelector('[data-t-wann]').textContent = wann(aktiv);
      dlg.querySelector('[data-t-nr]').textContent = 'Ticket CUL-' + aktiv.datum.replace(/-/g, '').slice(2) + '-' + String(Math.floor(Math.random() * 900) + 100);
      dlg.querySelector('[data-t-mail]').textContent = eur(anzahl * aktiv.preis) + ' bezahlt mit ' + art + '. In echt käme das Ticket jetzt an ' + m.value.trim() + '. In dieser Vorschau wird nichts verschickt und nichts abgebucht.';
      schritt(3); karten(true);
    }, 1600);
  }

  /* ---------- Pflegeseite */
  var neu = document.querySelector('[data-tp-neu]'), tpl = document.querySelector('[data-tp-liste]');
  function pflegeListe() {
    var t = sortiert(lesen());
    tpl.innerHTML = t.length ? t.map(function (x) {
      return '<div class="tp-z"><b>' + esc(wann(x)) + '</b><span>' + eur(+x.preis) + '</span><span>' + x.plaetze + ' Plätze</span><span>' + x.gebucht + ' gebucht</span>' +
        '<button class="tp-weg" type="button" data-weg="' + esc(x.id) + '">Entfernen</button></div>';
    }).join('') : '<p class="tb-leer">Noch kein Termin eingetragen.</p>';
  }
  if (neu && tpl) {
    pflegeListe();
    neu.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = neu.elements, t = lesen();
      t.push({ id: 't' + Date.now(), datum: f.namedItem('datum').value, zeit: f.namedItem('zeit').value, preis: +f.namedItem('preis').value, plaetze: +f.namedItem('plaetze').value, gebucht: 0 });
      schreiben(t); neu.reset(); pflegeListe();
    });
    tpl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-weg]'); if (!b) return;
      schreiben(lesen().filter(function (x) { return x.id !== b.dataset.weg; })); pflegeListe();
    });
    document.querySelector('[data-tp-zurueck]').addEventListener('click', function () { try { localStorage.removeItem(KEY); } catch (e) {} pflegeListe(); });
  }
})();
