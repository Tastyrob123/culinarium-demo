/* La Maison · Culinarium Hannover (28.10.2026). Quelle für bau.py, nicht die Ausgabe. Vorlage: La Maison der Häuser.
   Gruss, Datum, Empfang «Die Plakatwand» (Vorschau statt Foto, M23), Auftritte, Leiste und der Stand je Werkzeug.
   Stand nur aus den Werkzeugen selbst (nichts geschätzt): Wege als Daten in der Seite (#maison-wege); ein Weg darf eine Liste sein
   (antwortet der erste nicht, gilt der nächste). Werte gehen nur als Zahl in die Seite. Antwortet ein Werkzeug nicht: Satz ohne Zahl. */
(function () {
  'use strict';
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ganz = function (x) { var n = parseInt(x, 10); return isFinite(n) && n > 0 ? n : 0; };
  var n = function (x) { return Number(x || 0).toLocaleString('de-DE'); };
  var setze = function (key, html) { $$('[data-stand="' + key + '"]').forEach(function (el) { el.innerHTML = html; }); };
  var zahl = function (key, wert) { $$('[data-zahl="' + key + '"]').forEach(function (el) { el.textContent = wert; }); };
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Gruss und Datum (M03); ?gruss=morgen|tag|abend für Standbilder */
  var h = new Date().getHours();
  var fest = { morgen: 8, tag: 13, abend: 20 }[(/[?&]gruss=(morgen|tag|abend)/.exec(location.search) || [])[1]]; if (fest) h = fest;
  $('#gruss').textContent = h >= 5 && h < 11 ? 'Guten Morgen.' : h >= 11 && h < 18 ? 'Guten Tag.' : 'Guten Abend.';
  $('#datum').textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  /* Buchstaben rollen nur in den Namen der Leiste (M01) */
  $$('.rl').forEach(function (el) {
    el.innerHTML = el.textContent.split('').map(function (z, i) { return '<b style="--n:' + i + '">' + esc(z) + '</b>'; }).join('');
  });

  /* Leiste: die Namen der Werkzeuge stehen nur, wenn sie ganz Platz haben (Robert 19.10.2026 23:43) */
  var passt = function () {
    var o = $('.m-oben'), i = $('.m-insel'), w = $('.m-insel__wege'), r = $$('.m-oben__ecke'); if (!o || !i || !w) return;
    o.classList.remove('eng');
    var rechts = r.length ? r[r.length - 1].getBoundingClientRect().left : innerWidth;
    var links = r.length > 1 && getComputedStyle(r[0]).display !== 'none' ? r[0].getBoundingClientRect().right : 0;
    var b = i.getBoundingClientRect();
    if (i.scrollWidth > i.clientWidth + 1 || b.right > rechts - 12 || b.left < links + 12) o.classList.add('eng');
  };
  passt(); addEventListener('resize', passt); if (document.fonts && document.fonts.ready) document.fonts.ready.then(passt);
  /* Leiste: weg beim Hinunterscrollen, zurück beim Hochscrollen */
  var oben = $('.m-oben'), letzt = 0;
  addEventListener('scroll', function () {
    var y = scrollY; if (Math.abs(y - letzt) < 6) return;
    oben.classList.toggle('weg', y > letzt && y > 160); letzt = y;
  }, { passive: true });

  var rahmen = $('.hz-rahmen'), empfang = $('.m-empfang');

  /* Auftakt: der Empfang kommt herauf, wenn das Ruhebild dekodiert ist (höchstens 1,4 s), nie mit leerem Bildschirm */
  (function () {
    if (!empfang) return;
    var los = function () { empfang.classList.add('bereit'); };
    var uhr = setTimeout(los, 1400), r = $$('.hz-bild--ruhe, .m-f5__k img');   /* Empfang mit Fenstern: erst los, wenn die Fotos der Fenster dekodiert sind */
    Promise.all(r.map(function (i) { return (i.decode ? i.decode() : Promise.resolve()).catch(function () {}); })).then(function () { clearTimeout(uhr); requestAnimationFrame(los); });
  })();

  /* M23: in Ruhe die Fenster der Bar am Abend; Zeiger oder Tastatur-Fokus auf einer Zeile zeigt links die echte Vorschau dieses Werkzeugs.
     Erst entpacken, dann zeigen (M16). Verlässt der Zeiger die Tafel, kommt die Ruhe-Ansicht zurück. Nichts bewegt sich, nur Deckkraft. */
  /* Fotos der Fenster: einblenden, sobald geladen (Oberchef 29.10.2026: die Bewegung hält das Bild nie zurück) */
  $$('.m-f5__k img').forEach(function (i) { var da = function () { i.classList.add('da'); }; if (i.complete && i.naturalWidth) da(); else { i.addEventListener('load', da, { once: true }); i.addEventListener('error', da, { once: true }); } });
  var Z = $$('.hz-z a'), B = $$('[data-vorschau]'), U = $$('.hz-unter span'), jetzt = 'ruhe', will = 'ruhe';
  var stueck = function (i) { return B.filter(function (b) { return b.getAttribute('data-vorschau') === String(i); })[0]; };
  var zeige = function (i) {
    will = i; if (i === jetzt) return;
    var el = stueck(i); if (!el) { el = stueck('ruhe'); i = 'ruhe'; }
    if (!el) { Z.forEach(function (z, j) { z.classList.toggle('an', j === will); }); jetzt = will; return; }   /* Fassung ohne Rahmen: nur die Zeile markieren */
    if (el.tagName === 'IMG' && el.loading === 'lazy') el.loading = 'eager';
    var fertig = function () {
      if (will !== i && !(i === 'ruhe' && will === 'ruhe')) return;
      B.forEach(function (b) { b.classList.toggle('an', b === el); });
      U.forEach(function (u) { u.classList.toggle('an', u.getAttribute('data-vorschau') === String(i)); });
      Z.forEach(function (z, j) { z.classList.toggle('an', j === i); });
      jetzt = i;
    };
    (el.tagName === 'IMG' && el.decode ? el.decode() : Promise.resolve()).then(fertig, fertig);
  };
  var tafel = $('.hz-tafel');
  if (tafel) tafel.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') zeige('ruhe'); });
  Z.forEach(function (z, i) {
    z.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') zeige(i); });
    if (tafel && !tafel.contains(z)) z.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') zeige('ruhe'); });   /* Besucherliste in der Zahlenzeile liegt ausserhalb der Tafel */
    z.addEventListener('focus', function () { zeige(i); });
    z.addEventListener('blur', function () { setTimeout(function () { if (!tafel.contains(document.activeElement)) zeige('ruhe'); }, 0); });
  });
  /* die Vorschauen laden still nach, sobald das Ruhebild da ist */
  setTimeout(function () { B.forEach(function (b) { if (b.tagName === 'IMG' && b.loading === 'lazy') { b.loading = 'eager'; b.addEventListener('load', function () { if (b.decode) b.decode().catch(function () {}); }, { once: true }); } }); }, 400);

  /* Taste 1 bis 6 öffnet das Werkzeug der Zeile (M12), still, solange der Rundgang offen ist */
  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.rdg-karte')) return;
    var z = Z[+e.key - 1]; if (z) { zeige(+e.key - 1); z.classList.add('gedrueckt'); setTimeout(function () { location.href = z.href; }, 180); }
  });

  /* Titel steigen Zeile für Zeile (Kriterium 37, 30.10.2026): der grosse Titel des Empfangs und die Titel der Säle. Jedes Wort in <span class="wo-w">,
     seine Zeile als --z; die Wörter einer Zeile steigen zusammen. Ändert das Teilen den Umbruch (Silbentrennung, lange Wörter), bleibt der Titel ein Block.
     Läuft hier, bevor das erste Bild steht (das Skript steht am Ende der Seite, ohne defer). */
  var zeilen = function (el) {
    var h0 = el.offsetHeight; if (!h0) return;
    var w0 = Math.max(el.scrollWidth, el.clientWidth), roh = el.innerHTML, tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), t, ts = [];
    while ((t = tw.nextNode())) if (/\S/.test(t.data) && !t.parentNode.closest('svg')) ts.push(t);
    ts.forEach(function (t) {
      var f = document.createDocumentFragment();
      t.data.split(/(\s+)/).forEach(function (s) {
        if (!s) return;
        if (/^\s+$/.test(s)) { f.appendChild(document.createTextNode(s)); return; }
        var w = document.createElement('span'); w.className = 'wo-w'; w.textContent = s; f.appendChild(w);
      });
      t.parentNode.replaceChild(f, t);
    });
    if (el.offsetHeight !== h0 || el.scrollWidth > w0 + 1) { el.innerHTML = roh; return; }
    var z = -1, oben = -1e9, halb = parseFloat(getComputedStyle(el).fontSize) * 0.5;
    $$('.wo-w', el).forEach(function (w) { var y = w.getBoundingClientRect().top; if (y > oben + halb) { z++; oben = y; } if (z) w.style.setProperty('--z', z); });
    el.classList.add('wo-zl');
  };
  if (!ruhig) $$('.m-f5__titel, .m-saal__titel').forEach(zeilen);

  /* Zahlen laufen hoch (Kriterium 37, 30.10.2026): kommt eine Zahl aus einem Werkzeug an, zählt sie von null auf ihren Wert, sobald sie zu sehen ist,
     1,4 s, weich auslaufend. Ein unsichtbarer Zwilling mit dem Endwert hält die Breite, nichts daneben rückt. Schreibt die Seite in der Zeit neu, gilt ihr Wert. */
  var ZAHL = /^\s*(\d{1,3}(?:\.\d{3})+|\d{1,7})\s*$/;
  var zaehle = function (el) {
    var roh = el.textContent, m = ZAHL.exec(roh); if (!m) return;
    var ziel = parseInt(m[1].split('.').join(''), 10); if (!(ziel >= 4)) return;   /* «1», «2»: nichts zu zählen */
    var hut = document.createElement('span'), zw = document.createElement('span'), z = document.createElement('span');
    hut.className = 'wo-zl-z'; zw.setAttribute('aria-hidden', 'true'); zw.textContent = roh; z.textContent = '0';
    hut.appendChild(zw); hut.appendChild(z); el.textContent = ''; el.appendChild(hut);
    var t0 = performance.now(), D = 1400;
    (function schritt(jetzt) {
      if (!z.isConnected) return;
      var x = Math.min(1, Math.max(0, (jetzt - t0) / D));
      if (x < 1) { z.textContent = n(Math.round(ziel * (1 - Math.pow(1 - x, 4)))); requestAnimationFrame(schritt); }
      else el.textContent = roh;
    })(t0);
  };
  if (!ruhig && 'IntersectionObserver' in window && 'MutationObserver' in window) {
    var zio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { zio.unobserve(e.target); zaehle(e.target); } }); }, { threshold: 0.6 });
    var zmo = new MutationObserver(function (ms) {
      ms.forEach(function (m) { var el = m.target; if (!el.hasAttribute('data-gezaehlt') && ZAHL.test(el.textContent)) { el.setAttribute('data-gezaehlt', ''); zio.observe(el); } });
    });
    $$('[data-zahl], [data-wg="besuche"], [data-wg="fenster"], [data-wg="weiter"], [data-stand="registre-heute"], [data-stand="registre-buchung"]').forEach(function (el) { zmo.observe(el, { childList: true }); });
  }

  /* Auftritte: jedes Stück fährt los, wenn ein Fünftel davon im Bild ist; nach oben weit offen (wer springt, überspringt nichts) */
  var wecke = function (el) { (el.tagName === 'IMG' ? [el] : $$('img[loading="lazy"]', el)).forEach(function (i) { if (!i.complete || !i.naturalWidth) i.loading = 'eager'; }); };
  var fuenftel = function (e) { return e.isIntersecting && (e.intersectionRatio >= 0.2 || e.intersectionRect.height >= innerHeight * 0.2); };
  var alle = $$('[data-r]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (fuenftel(e)) { e.target.classList.add('da'); wecke(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '100000px 0px 0px 0px', threshold: [0, 0.05, 0.1, 0.15, 0.2] });
    alle.forEach(function (el) { io.observe(el); });
    var band = $('[data-laufband]');
    if (band) new IntersectionObserver(function (es) { band.classList.toggle('laeuft', es[0].isIntersecting && !ruhig); }).observe(band);
    var punkte = {};
    $$('.m-insel__p').forEach(function (a) { punkte[a.getAttribute('href').slice(1)] = a; });
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var a = punkte[e.target.id]; if (a) a.classList.toggle('an', e.isIntersecting); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    Object.keys(punkte).forEach(function (id) { var s = document.getElementById(id); if (s) sio.observe(s); });
  } else {
    alle.forEach(function (el) { el.classList.add('da'); });
  }

  /* ---------------- Stand je Werkzeug ---------------- */
  var WEGE = {}; try { WEGE = JSON.parse($('#maison-wege').textContent) || {}; } catch (e) {}
  var hole = function (k) {
    var w = [].concat(WEGE[k] || []).filter(Boolean);
    var weiter = function (i) {
      return i >= w.length ? Promise.reject(new Error('kein Weg')) : fetch(w[i], { cache: 'no-store', credentials: 'same-origin' })
        .then(function (r) { return r.ok && r.status !== 204 ? r.json() : Promise.reject(new Error(r.status)); })
        .then(function (d) { return d && typeof d === 'object' ? d : Promise.reject(new Error('leer')); })
        .catch(function () { return weiter(i + 1); });
    };
    return weiter(0);
  };
  var tag = function (s) { var d = new Date(String(s).replace(' ', 'T')); return isNaN(d) ? '' : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); };
  /* Speicher des Stamms (_Werkzeuge/unterbau): {live, entwurf, kennung_live, kennung_entwurf, offen} */
  var stamm = function (d) { return d && ('kennung_live' in d || 'kennung_entwurf' in d) ? d : null; };
  var BSP = '<span class="bsp">Beispiel</span>';
  var BEISPIEL = []; try { BEISPIEL = JSON.parse($('#maison-beispiel').textContent) || []; } catch (e) {}   /* Werkzeuge, die in der Demo Beispieldaten zeigen (R20) */

  /* Le Bureau: {aenderungen, zuletzt:{zeit}, bereiche, seiten} oder Stand des Stamms */
  hole('bureau').then(function (u) {
    var s = stamm(u), a = s ? (s.offen ? ganz(s.offen) || 1 : 0) : ganz(u.aenderungen), zul = !s && u.zuletzt && u.zuletzt.zeit ? tag(u.zuletzt.zeit) : '';
    if (!s && Array.isArray(u.bereiche) && u.bereiche.length) zahl('bereiche', u.bereiche.length);
    if (!s && ganz(u.seiten)) zahl('seiten', ganz(u.seiten));
    setze('bureau-kurz', a ? '<b>' + a + ' im Entwurf</b>' : (zul ? 'Veröffentlicht ' + esc(zul) : 'Alles veröffentlicht'));
    setze('bureau', (a ? '<b>' + a + (a > 1 ? ' Änderungen' : ' Änderung') + ' im Entwurf.</b> ' : 'Nichts offen im Entwurf. ') + (zul ? 'Zuletzt veröffentlicht am ' + esc(zul) + '.' : ''));
  }).catch(function () { setze('bureau-kurz', 'Die Website, Seite für Seite'); setze('bureau', 'Der Stand ist gerade nicht abrufbar.'); });

  /* La Carte: {karten:[{entwurf, pdf_zeit}]} oder Stand des Stamms */
  hole('carte').then(function (d) {
    var s = stamm(d);
    if (s) { var o = ganz(s.offen); setze('carte-kurz', o || s.offen === true ? '<b>Entwurf wartet</b>' : 'Alle Karten veröffentlicht'); return; }
    var k = Array.isArray(d.karten) ? d.karten : null; if (!k) throw new Error('ohne Karten');
    var e = k.filter(function (x) { return x && x.entwurf; }).length;
    zahl('karten', k.length); zahl('entwurf', e);
    setze('carte-kurz', e ? '<b>' + e + ' im Entwurf</b>' : k.length + (k.length === 1 ? '\u00a0Karte, veröffentlicht' : '\u00a0Karten, alle\u00a0veröffentlicht'));
  }).catch(function () { setze('carte-kurz', 'Menü und Drinks je Abend'); });

  /* L’Imprimerie: Liste der Vorlagen [{art, zahl}] (M17) */
  hole('imprimerie').then(function (l) {
    var liste = Array.isArray(l) ? l : Array.isArray(l.vorlagen) ? l.vorlagen : null; if (!liste || !liste.length) throw new Error('leer');
    var z = 0, arten = {}, gruppiert = false; liste.forEach(function (x) { z += ganz(x && x.zahl) || 1; var g = x && (x.gruppe || x.art); if (g) arten[String(g)] = 1; if (x && x.gruppe) gruppiert = true; });   /* Arten nach «gruppe» (Werkstatt, 30.10.2026), sonst nach «art» */
    var a = Object.keys(arten).length;
    var text = function (n) { return z + '\u00a0Vorlagen' + (n ? ' in ' + n + (n === 1 ? '\u00a0Art' : '\u00a0Arten') : ''); };
    setze('imprimerie-kurz', text(a));
    /* 30.10.2026 (Tor, Oberchef): die Zahl der Arten wie in der Ansicht der Plakatwerkstatt. Sie legt kleine Arten zu Gruppen zusammen (GRUPPE in start.js);
       der Tresen liest Arten und Gruppen dort mit, damit die Zahl nie wieder von der Werkstatt abweicht. */
    var weg = [].concat(WEGE.imprimerie || [])[0] || '';
    var quelle = weg.replace(/haeuser\/.*$/, 'start.js');
    if (gruppiert || !quelle || quelle === weg) return;   /* trägt die Liste schon «gruppe», gilt sie allein */
    return fetch(quelle, { cache: 'no-store', credentials: 'same-origin' }).then(function (r) { return r.ok ? r.text() : Promise.reject(new Error(r.status)); }).then(function (js) {
      var block = (js.match(/const ARTEN = \[([\s\S]*?)\n\s*\];/) || [])[1], gruppe = (js.match(/const GRUPPE = (\{[^;]*?\});/) || [])[1];
      if (!block) return;
      var keys = (block.match(/key:\s*'([a-z0-9_-]+)'/g) || []).map(function (k) { return k.replace(/^key:\s*'|'$/g, ''); });
      var drin = {}; ((gruppe || '').match(/'([a-z0-9_-]+)'/g) || []).forEach(function (k) { drin[k.replace(/'/g, '')] = 1; });
      Object.keys(JSON.parse((gruppe || '{}').replace(/([a-z0-9_-]+):/g, '"$1":').replace(/'/g, '"'))).forEach(function (k) { delete drin[k]; });
      var n = keys.filter(function (k) { return !drin[k]; }).length;
      if (n) setze('imprimerie-kurz', text(n));
    }).catch(function () {});
  }).catch(function () { setze('imprimerie-kurz', 'Vorlagen, druckfertig'); });

  /* La Réception: {anfragen_neu, anfragen_offen, ohne_antwort, fragen_gesamt} */
  hole('reception').then(function (r) {
    var u = {}; ['anfragen_neu', 'anfragen_offen', 'ohne_antwort', 'fragen_gesamt'].forEach(function (k) { u[k] = ganz(r[k]); });
    var t = [];
    if (u.anfragen_neu) t.push('<b>' + u.anfragen_neu + (u.anfragen_neu === 1 ? '\u00a0neue Anfrage' : '\u00a0neue Anfragen') + '</b>');
    else if (u.anfragen_offen) t.push(u.anfragen_offen + (u.anfragen_offen === 1 ? '\u00a0Anfrage offen' : '\u00a0Anfragen offen'));
    if (u.ohne_antwort) t.push('<b>' + u.ohne_antwort + (u.ohne_antwort === 1 ? '\u00a0Frage ohne Antwort' : '\u00a0Fragen ohne\u00a0Antwort') + '</b>');
    var kurz = t.length ? t.join(' · ') : 'Nichts offen';
    setze('reception-kurz', kurz);   /* Gestaltung 28.10.2026: Probe-Kennzeichnung nur einmal, in der Zeile oben, nicht in jeder Kachel */
    setze('reception', t.length ? kurz : 'Nichts offen · ' + u.fragen_gesamt + (u.fragen_gesamt === 1 ? ' Frage' : ' Fragen') + ' bisher');
  }).catch(function () { setze('reception-kurz', 'Chat auf der Website'); setze('reception', '&nbsp;'); });

  /* Le Livre: stand:{fotos, dateien, ki, ue} */
  hole('livre').then(function (d) {
    var s = d.stand || {}, f = ganz(s.fotos), da = ganz(s.dateien), ki = ganz(s.ki), ue = ganz(s.ue);
    if (!f && !da) throw new Error('leer');
    setze('livre-kurz', f + '\u00a0Fotos · ' + da + '\u00a0Dateien');
    var dazu = [ki ? ki + ' mit KI erzeugt' : '', ue ? ue + ' nachgeschärft' : ''].filter(Boolean);
    setze('livre', f + ' Fotos in fertigen Grössen' + (dazu.length ? ', davon ' + dazu.join(' und ') + ', alle gekennzeichnet' : '') + '. ' + da + ' Dateien für Agenturen und Druckereien.');
  }).catch(function () { setze('livre-kurz', 'Fotos, Dateien, Markenprüfung'); setze('livre', '&nbsp;'); });

  /* Le Registre: {summe:{heute, besuche, seiten, laender, buchung}, je_tag:[…], tage, beispiel, leer} */
  hole('registre').then(function (m) {
    var u = m.summe || {}, bs = ganz(u.besuche), jt = Array.isArray(m.je_tag) && m.je_tag.length ? m.je_tag[m.je_tag.length - 1] : null;
    var heute = jt && isFinite(Number(jt.besuche)) ? Number(jt.besuche) : (isFinite(Number(u.heute)) ? Number(u.heute) : null);
    var res = jt && isFinite(Number(jt.buchung)) ? Number(jt.buchung) : null;
    setze('registre-heute', heute == null ? '–' : n(heute));
    var hw = document.querySelector('[data-stand="registre-heute"]'); if (hw && hw.nextSibling && hw.nextSibling.nodeType === 3) hw.nextSibling.textContent = heute === 1 ? 'Besuch' : 'Besuche';   /* «1 Besuch», nie «1 Besuche» */
    setze('registre-buchung', res == null ? '–' : n(res));
    if (m.beispiel) { var kb = $('.rw-kopf__bsp'); if (kb) kb.hidden = false; }   /* «Beispiel» leise in der Datumszeile des Kopfs, nie mitten in den Zahlen (29.10.2026) */
    setze('registre-kurz', m.leer || !bs ? 'Noch keine Besuche gezählt' : n(bs) + (bs === 1 ? ' Besuch' : ' Besuche') + ' in ' + n(ganz(m.tage)) + ' Tagen');
    zahl('reg-besuche', bs ? n(bs) : '–'); zahl('reg-seiten', ganz(u.seiten) ? n(u.seiten) : '–'); zahl('reg-laender', ganz(u.laender) ? n(u.laender) : '–');
    /* Der Weg zur Buchung (Weg des Gastes): Besuche → Abend angesehen → Platz gebucht oder Warteliste → dabei. Rechnung und Namen wie im Besucherbuch
       des Hauses (registre.js trichter, Fehlerbuch 10a): abbruch.von = erste Stufe, davon ohne Abbruch = zweite; booking.zahl = direkt gebucht */
    /* Culinarium (Le Registre, 28.10.2026): Stufe 2 = «Der Abend» geöffnet = Aufrufe von abend.html (höchstens die Besuche), Stufe 3 = zum Platz
       (gebucht oder Warteliste, summe.buchung, höchstens Stufe 2); Anteil je Stufe an der davor, nie über 100 % */
    var ab = (m.seiten || []).filter(function (x) { return x && x.s === 'abend.html'; })[0], fen = Math.min(bs, ganz(ab && ab.n)), wei = Math.min(fen, ganz(u.buchung)), bk = 0;
    var ant = function (t, g) { return g ? Math.round(100 * t / g) + ' % davon' : ''; };
    $$('[data-wg]').forEach(function (el) {
      var k = el.getAttribute('data-wg');
      if (k === 'besuche') el.textContent = bs ? n(bs) : '–';
      if (k === 'fenster') el.textContent = fen ? n(fen) : '–';
      if (k === 'weiter') el.textContent = wei ? n(wei) : '–';
      if (k === 'besuche-satz') el.textContent = 'auf der Website, in ' + n(ganz(m.tage) || 30) + ' Tagen';
      if (k === 'fenster-satz') el.textContent = fen ? ant(fen, bs) : 'Noch nichts gezählt';
      if (k === 'weiter-satz') el.textContent = wei ? ant(wei, fen) + (bk ? ', dazu ' + (bk === 1 ? 'einmal' : n(bk) + ' Mal') + ' gleich gebucht' : '') : 'Noch nichts gezählt';
    });
    setze('besuche', m.leer ? 'Noch keine Besuche gezählt.' : (m.beispiel ? 'Beispielwerte, bis die Website echte Besuche zählt · ' : '') + 'letzte ' + n(ganz(m.tage)) + ' Tage');
  }).catch(function () { setze('registre-kurz', 'Besuche ohne Namen'); setze('besuche', 'Die Zählung ist gerade nicht abrufbar.'); setze('registre-heute', '–'); setze('registre-buchung', '–'); });

  window.MAISON_BEREIT = true;   /* Startfehler-Tür (R04): ohne dieses Zeichen öffnet fehler.js die Tür */
})();
