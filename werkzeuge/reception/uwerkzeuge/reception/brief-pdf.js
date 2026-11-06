/* Brief als PDF (A4), gesetzt für Chromium auf dem Server (brief_pdf.js ruft BRIEF_SETZEN(daten) und druckt dann).
   Regeln (Robert 16.10.2026): genau eine Seite, wenn der Text passt (Lesetext 11 / 10,5 / 10,2 pt, in dieser Reihenfolge); sonst sauberer Umbruch mit kleinem Briefkopf
   auf jeder Folgeseite, Fusszeile und Rahmen auf jeder Seite, nie eine fast leere Schlussseite; keine Bearbeitungsspuren, offene Stellen stehen als reiner Text.
   daten = { name, kontakt, absender, betreff, text, gestalt }  (gestalt wie im Werkzeug: Grösse s, Bündigkeit al, Abstand mb, Schrift f, Farbe c, Textart ta, Linien, Fotos, Kopftexte) */
(function () {
  const GKOPF = { haus: 'Culinarium', zeile: 'A UNiQUE EXPERiENCE BY MOMO X RUDI · Walk on the Wild Side', fuss: 'Walk on the Wild Side · Haasemannstraße 13 · 30449 Hannover\nTelefon der Bar +49 163 3909578 · Instagram @culinarium_hannover' };   // wie reception.js GKOPF
  const HFARBE = { navy: '#1f1d25', blau: '#413e4e', tinte: '#1a191f', papier: '#e5dedd', creme: '#cebbb7', weiss: '#f5f1f0', sand: '#ea5823', gold: '#f4ad93', messing: '#d06138', taupe: '#92492e', rot: '#c42e13' };
  const LFARBE = { taupe: 'rgba(146,73,46,.42)', gold: '#d06138', navy: '#1f1d25' };
  const SERIF = "Petrona,Georgia,'Times New Roman',serif", SANS = "'Instrument Sans',system-ui,sans-serif", MONO = "'DM Mono',Menlo,monospace";
  const SCHRIFT = { serif: `font-family:${SERIF}`, sans: `font-family:${SANS}`, mono: `font-family:${MONO}`, cinzel: `font-family:${SERIF}`, versal: `font-family:${SERIF};letter-spacing:.16em;text-transform:uppercase` };
  const TEXTART = { normal: 'font-style:normal;font-weight:400;text-transform:none;letter-spacing:0', kursiv: 'font-style:normal', versal: 'text-transform:uppercase;letter-spacing:.16em', medium: 'font-weight:500' };
  const PX = 0.2646, BREITE_BILDSCHIRM = 500;   // Breite einer verschobenen Linie oder eines Fotos am Bildschirm (px) im Verhältnis zur Textbreite
  const ZEICHEN = 'zeichen-haus.svg', MARKE = 'marke-haus.svg';   /* Gestaltung 28.10.2026: Kopf = Rudis Original (Wortmarke mit Zeile), ein Logo je Brief, kein Siegel */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const zeilen = t => esc(t).replace(/\n/g, '<br>');
  const el = (html, cls) => { const d = document.createElement('div'); d.className = cls || ''; d.innerHTML = html; return d; };

  window.BRIEF_SETZEN = async function (daten) {
    const G = daten.gestalt || {}, ab = String(daten.text || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean), bilder = G._bilder || [];
    const kt = k => (G[k] && typeof G[k].t === 'string') ? G[k].t : GKOPF[k];
    const wurzel = document.getElementById('seiten');
    const stil = (k, pt, extra = '') => {   // Gestaltung des Briefs (g) in Stil für das PDF
      const g = G[k] || {}, l = [`font-size:${Math.round(pt * (g.s || 1) * 100) / 100}pt`, extra];
      if (g.al) l.push(`text-align:${g.al}`);
      if (g.f && SCHRIFT[g.f]) l.push(SCHRIFT[g.f]);
      if (g.ta && TEXTART[g.ta]) l.push(TEXTART[g.ta]);
      if (g.c && HFARBE[g.c]) l.push(`color:${HFARBE[g.c]}`);
      if (g.lh) l.push(`line-height:${g.lh}`);
      if (g.ls != null) l.push(`letter-spacing:${g.ls}em`);
      if (g.op != null && g.op < 1) l.push(`opacity:${g.op}`);
      const oben = Math.max(0, (g.dy || 0) + (g.mt || 0)) * PX, links = Math.max(0, g.dx || 0) * PX, unten = Math.max(0, g.mb || 0) * PX;
      if (oben) l.push(`padding-top:${oben.toFixed(2)}mm`); if (links) l.push(`padding-left:${links.toFixed(2)}mm`); if (unten) l.push(`--mb:${unten.toFixed(2)}mm`);
      return l.filter(Boolean).join(';');
    };
    const breite = g => g && g.w ? `width:${Math.min(100, Math.round(g.w / BREITE_BILDSCHIRM * 100))}%` : '';
    const linie = (k, abstand, raute) => { const g = G[k] || {}; if (g.aus) return null; const farbe = g.fb && (LFARBE[g.fb] || HFARBE[g.fb]);
      const d = el('<i></i>', 'b linie' + (raute && !farbe ? ' raute' : '')); d.style.cssText = `margin:${abstand};${breite(g) || 'width:100%'};${g.al === 'left' ? 'margin-left:0' : g.al === 'right' ? 'margin-right:0' : ''}`;
      const i = d.firstChild; if (g.st) i.style.height = (g.st * PX).toFixed(2) + 'mm'; if (farbe) i.style.background = farbe; return d; };
    const foto = id => { const b = bilder.find(x => x.id === id); if (!b) return null; const g = G[id] || {};
      const d = el(`<img src="/culinarium-demo/assets/bild/${esc(b.k)}-1000.webp" alt="">`, 'b foto'); d.style.cssText = `${breite(g) || 'width:60%'};${g.al === 'left' ? 'margin-left:0' : g.al === 'right' ? 'margin-right:0' : ''}`;
      if (g.ar) { const im = d.firstChild; im.style.aspectRatio = g.ar; im.style.objectFit = 'cover'; im.style.objectPosition = `${g.ox == null ? 50 : g.ox}% ${g.oy == null ? 50 : g.oy}%`; } return d; };
    const fotosNach = nach => bilder.filter(b => b.nach === nach).map(b => foto(b.id)).filter(Boolean);

    function blocke(pt, mitSiegel) {   // Reihenfolge wie im Brief am Bildschirm; jeder Block bleibt unzerteilt, ausser langen Absätzen
      const L = [], zg = G.zeichen || {};
      const z = el(`<img src="${MARKE}" width="365" height="67" alt="Culinarium">`, 'b zeichen'); z.style.width = (64 * (zg.s || 1)).toFixed(1) + 'mm'; L.push({ e: z, k: 'kopf' });
      const eigen = k => G[k] && typeof G[k].t === 'string' && G[k].t.trim() && G[k].t !== GKOPF[k];
      if (eigen('haus')) L.push({ e: el(zeilen(kt('haus')), 'b haus'), k: 'kopf', stil: stil('haus', 14.5) });
      if (eigen('zeile')) L.push({ e: el(zeilen(kt('zeile')), 'b zeile'), k: 'kopf', stil: stil('zeile', 6.4) });
      const l1 = linie('linie1', '4.5mm auto 5mm', true); if (l1) L.push({ e: l1, k: 'kopf' });
      L.push({ e: el(`<div><dt>An</dt><dd>${esc(daten.name)}${daten.kontakt ? `<small>${esc(daten.kontakt)}</small>` : ''}</dd></div><div><dt>Von</dt><dd>${esc(daten.absender || 'Culinarium')}</dd></div>`, 'b an'), k: 'an' });
      const l2 = linie('linie2', '4mm auto 4mm', false); if (l2) L.push({ e: l2, k: 'kopf' });
      L.push({ e: el(`<div class="betreff-l">Betreff</div><div class="betreff b" style="${stil('betreff', pt)}">${zeilen(daten.betreff)}</div>`, 'b'), k: 'betreff', abstand: '5mm' });
      fotosNach('kopf').forEach(f => L.push({ e: f, k: 'foto' }));
      ab.forEach((x, n) => {
        const p = el(zeilen(x), 'b absatz' + (ab.length > 2 && n === ab.length - 1 ? ' sign' : '')); L.push({ e: p, k: 'absatz', stil: stil('p' + n, pt), roh: x, schluss: n === ab.length - 1 });
        fotosNach('p' + n).forEach(f => L.push({ e: f, k: 'foto' }));
      });
      return L;
    }

    function seite(erste, nr) {
      const s = document.createElement('div'); s.className = 'seite' + (erste ? '' : ' folge');
      s.innerHTML = '<div class="rahmen"><i class="ecke a"></i><i class="ecke b"></i><i class="ecke c"></i><i class="ecke d"></i></div><div class="koerper"></div><div class="fuss"></div>';
      s.querySelector('.fuss').innerHTML = zeilen(kt('fuss')) + '<span class="nr" hidden></span>';
      wurzel.appendChild(s); const k = s.querySelector('.koerper');
      if (!erste) k.appendChild(el(`<img src="${MARKE}" width="365" height="67" alt="Culinarium">`, 'kleinkopf'));
      return k;
    }
    const passt = k => k.scrollHeight <= k.clientHeight + 0.5;
    const stilAn = (b, pt) => { b.e.style.cssText += (b.stil || '') + (b.abstand ? `;margin-bottom:${b.abstand}` : ''); };

    function setze(pt, mitSiegel) {
      wurzel.innerHTML = ''; wurzel.style.setProperty('--pt', pt + 'pt'); document.body.style.fontSize = pt + 'pt';
      const L = blocke(pt, mitSiegel); let k = seite(true);
      const platz = (b) => { stilAn(b, pt); k.appendChild(b.e); };
      for (let i = 0; i < L.length; i++) {
        const b = L[i]; stilAn(b, pt); k.appendChild(b.e);
        if (passt(k)) continue;
        k.removeChild(b.e);
        if (b.k === 'absatz' && b.roh && !/\n/.test(b.roh) && b.roh.split(' ').length > 24) {   // langer Absatz: an der Seitengrenze teilen, mindestens zwei Zeilen auf jeder Seite
          const w = b.roh.split(' '); let lo = 0, hi = w.length - 1, gut = 0;
          while (lo <= hi) { const m = (lo + hi) >> 1; b.e.innerHTML = esc(w.slice(0, m).join(' ')); k.appendChild(b.e);
            const ok = passt(k); k.removeChild(b.e); if (ok) { gut = m; lo = m + 1; } else hi = m - 1; }
          if (gut > 8 && gut < w.length - 8) {
            b.e.innerHTML = esc(w.slice(0, gut).join(' ')); k.appendChild(b.e);
            const rest = { ...b, e: el(esc(w.slice(gut).join(' ')), 'b absatz fort' + (b.e.classList.contains('sign') ? ' sign' : '')), roh: w.slice(gut).join(' ') };
            L.splice(i + 1, 0, rest); k = seite(false); continue;
          }
          b.e.innerHTML = zeilen(b.roh);
        }
        // Block rückt auf die nächste Seite; der Schluss (Gruss, Siegel) bleibt nie allein: der Absatz davor zieht mit
        k = seite(false);
        if (b.k === 'siegel' || b.schluss) {
          const vor = k.parentNode.previousElementSibling.querySelector('.koerper'), letzter = vor.lastElementChild;
          if (letzter && letzter.classList.contains('absatz') && !letzter.classList.contains('fort') && vor.children.length > 2) { k.appendChild(letzter); }
        }
        stilAn(b, pt); k.appendChild(b.e);
      }
      // Schlussseite fast leer? Dann Absätze der Vorseite herüberholen, bis sie mindestens zu einem Drittel gefüllt ist (nie eine fast leere Seite)
      const ss = wurzel.querySelectorAll('.seite'), n = ss.length;
      if (n > 1) {
        const lk = ss[n - 1].querySelector('.koerper'), vk = ss[n - 2].querySelector('.koerper');
        const fuell = () => [...lk.children].filter(x => !x.classList.contains('kleinkopf')).reduce((h, x) => h + x.getBoundingClientRect().height + 12, 0) / lk.clientHeight;
        for (let g = 0; g < 40 && fuell() < 0.36 && vk.children.length > 1; g++) {
          const x = vk.lastElementChild; if (!x.classList.contains('absatz')) break;
          const erster = [...lk.children].find(c => !c.classList.contains('kleinkopf'));
          const fortsetzung = erster && erster.classList.contains('fort');   // die Schlussseite beginnt mit dem Rest von x
          const w = x.textContent.split(' ');
          if (!fortsetzung && !x.classList.contains('fort') && (w.length <= 30 || x.querySelector('br'))) {   // ganzer Absatz zieht hinüber (die Vorseite behält mindestens drei Teile)
            if (vk.children.length <= 3) break;
            lk.insertBefore(x, erster || null);
            if (!passt(lk)) { vk.appendChild(x); break; }
            continue;
          }
          // Abnahme 17.10.2026: ein langer, schon geteilter Absatz hielt den Ausgleich an (Schlussseite mit drei Zeilen). Jetzt rücken
          // Wörter vom Ende der Vorseite an den Anfang der Schlussseite, bis sie zu einem Drittel gefüllt ist; auf der Vorseite bleiben mindestens acht.
          if (x.querySelector('br')) break;
          const n = Math.max(6, Math.ceil(w.length * 0.12)); if (w.length - n < 8) break;
          const altX = x.textContent, ziel = fortsetzung ? erster : el('', 'b absatz fort' + (x.classList.contains('sign') ? ' sign' : ''));
          const altZ = ziel.textContent;
          if (!fortsetzung) { ziel.style.cssText = x.style.cssText; ziel.style.marginTop = ''; lk.insertBefore(ziel, erster || null); }
          ziel.textContent = w.slice(-n).join(' ') + (altZ ? ' ' + altZ : '');
          x.textContent = w.slice(0, -n).join(' ');
          if (!passt(lk)) { x.textContent = altX; if (fortsetzung) ziel.textContent = altZ; else ziel.remove(); break; }
        }
      }
      return wurzel.querySelectorAll('.seite').length;
    }

    await Promise.all(["700 10pt \'Gelasio\'", "10pt \'Instrument Sans\'", "10pt \'DM Mono\'"].map(f => document.fonts.load(f, 'AaÄäÖöÜüéèàç«»–·')));   // alle Schnitte zuerst laden, sonst bleibt Text im Druck unsichtbar
    await document.fonts.ready;
    await Promise.all([ZEICHEN, ...bilder.map(b => `/culinarium-demo/assets/bild/${b.k}-1000.webp`)].map(u => new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = u; })));   // Bilder zuerst laden, sonst stimmen die Höhen beim Messen nicht
    let seiten = 0, pt = 10.5;
    for (const [grad, siegel] of [[11, true], [10.7, true], [10.4, true], [10.2, true], [10.5, false], [10.2, false], [9.9, false]]) { pt = grad; seiten = setze(grad, siegel); if (seiten === 1) break; }
    if (seiten > 1) { pt = 10.5; seiten = setze(10.5, true); }
    // Seitenzahl nur bei mehreren Seiten
    const alle = wurzel.querySelectorAll('.seite');
    if (alle.length > 1) alle.forEach((s, i) => { const nr = s.querySelector('.nr'); nr.hidden = false; nr.textContent = `Seite ${i + 1} von ${alle.length}`; });
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; })));
    return { seiten: alle.length, pt };
  };
})();
