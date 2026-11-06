/* L’Imprimerie · Newsletter-Baukasten, Satz der E-Mail (Robert 12.10.2026: «Newsletter und E-Mail-Vorlagen», bisher nur als Bild).
   Erzeugt echte, versendbare HTML-Mails: 600 px, Tabellen, alle Stile inline, damit Gmail, Apple Mail und Outlook sie gleich zeigen.
   Hausschriften laden nur Apple Mail und iOS; Gmail und Outlook nehmen die sicheren Ersatzschriften (Georgia, Helvetica/Arial).
   Zeichen und Wortmarke sind Bilder (_kopf.png, _fuss.png), weil kein Mailprogramm SVG zuverlässig zeigt.
   Fotos als JPG (haeuser/culinarium/mail/, 1200 px, Outlook kann kein WebP), öffentliche Adressen auf der Studio-Seite.
   Kein Mailprogramm führt Skripte aus; alles hier ist reines HTML. DSMAIL.html(doc, {editor}) → vollständiges Dokument. */
(function () {
  const ONLINE = 'https://culinarium-hannover-entwurf.vercel.app/werkzeuge/imprimerie/';   // öffentliche Adresse der Bilder in den Mails (Fotos, Kopf, Fuss)
  const C = { navy: '#16151a', papier: '#f3ecea', creme: '#e9e0de', weiss: '#faf4f4', sand: '#e9e0de', gold: '#f5a689', messing: '#ef7649', taupe: '#b15736', tief: '#3a3845', tinte: '#26242d' };
  const F = {
    serif: "Fraunces,Georgia,'Times New Roman',serif",
    sans: "'Instrument Sans','Helvetica Neue',Helvetica,Arial,sans-serif",
    mono: "'DM Mono','Helvetica Neue',Helvetica,Arial,sans-serif",
  };
  const BREITE = 600, INNEN = 504, RAND = 48;

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const zeilen = s => esc(s).replace(/\n/g, '<br>');
  const absaetze = (s, st) => String(s || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean).map((p, i, a) => `<p style="margin:0 0 ${i === a.length - 1 ? 0 : 16}px;${st}">${zeilen(p)}</p>`).join('');
  const linkOk = l => /^(https?:\/\/[^\s\[\]]+\.[^\s\[\]]+|tel:\+?[0-9 ]{6,})$/.test(String(l || '').trim());
  const VERSAND = {
    mailchimp: { name: 'Mailchimp', abmelden: '*|UNSUB|*', online: '*|ARCHIVE|*' },
    brevo: { name: 'Brevo', abmelden: '{{ unsubscribe }}', online: '{{ mirror }}' },
    anderes: { name: 'Anderes Programm', abmelden: '[Abmeldelink]', online: '' },
  };

  function bildUrl(key, basis) { return basis + 'haeuser/culinarium/mail/' + key + '.jpg'; }
  function fotoQuelle(b, basis) { return (b.url || '').trim() || (b.foto ? bildUrl(b.foto, basis) : ''); }
  function fotoMass(M, b) { const x = M && b.foto && !b.url && M.bilder.find(y => y.key === b.foto); return x ? x.h / x.w : 2 / 3; }

  /* ---------- Bausteine ---------- */
  const td = (inhalt, st, b, i) => `<tr><td class="px"${b ? ` data-b="${i}"` : ''} style="padding:${st}">${inhalt}</td></tr>`;
  const AUSR = b => b.ausr === 'links' ? 'left' : 'center';

  const BAU = {
    titel(b) {
      const a = AUSR(b);
      return (b.ueber ? `<div class="mono" style="margin:0 0 14px;font-family:${F.mono};font-size:11px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:${C.tief};text-align:${a}">${zeilen(b.ueber)}</div>` : '')
        + `<h1 class="ser h1" style="margin:0;font-family:${F.serif};font-weight:500;font-size:40px;line-height:44px;color:${C.navy};text-align:${a};mso-line-height-rule:exactly">${zeilen(b.titel)}</h1>`
        + (b.unter ? `<p class="ser" style="margin:12px 0 0;font-family:${F.serif};font-style:italic;font-size:21px;line-height:28px;color:${C.tief};text-align:${a}">${zeilen(b.unter)}</p>` : '');
    },
    text(b) { return absaetze(b.text, `font-family:${F.sans};font-size:16px;line-height:26px;color:${C.tinte};text-align:${b.ausr === 'mitte' ? 'center' : 'left'}`); },
    foto(b, o) {
      const src = fotoQuelle(b, o.basis); if (!src) return `<div style="padding:60px 0;text-align:center;font-family:${F.sans};font-size:13px;color:${C.taupe};background:${C.creme}">Foto wählen</div>`;
      const w = b.voll ? BREITE : INNEN, h = Math.round(w * fotoMass(o.M, b));
      let img = `<img src="${esc(src)}" width="${w}" height="${h}" alt="${esc(b.alt || '')}" class="voll" style="display:block;width:100%;max-width:${w}px;height:auto;border:0;outline:none;text-decoration:none${b.voll ? '' : ';border-radius:3px'}">`;
      if (b.link && linkOk(b.link)) img = `<a href="${esc(b.link.trim())}" target="_blank" style="text-decoration:none">${img}</a>`;
      return img + (b.unterschrift ? `<p style="margin:12px 0 0;font-family:${F.sans};font-size:13px;line-height:19px;color:${C.tief};text-align:${b.voll ? 'center' : 'left'}${b.voll ? `;padding:0 ${RAND}px` : ''}">${zeilen(b.unterschrift)}</p>` : '');
    },
    knopf(b) {
      const t = String(b.text || 'Mehr erfahren'), l = linkOk(b.link) ? b.link.trim() : '#';
      const breite = Math.max(200, Math.round(t.length * 10.5 + 96));
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto"><tr><td align="center" bgcolor="${C.navy}" style="border-radius:999px;background:${C.navy}">`
        + `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(l)}" style="height:52px;v-text-anchor:middle;width:${breite}px" arcsize="50%" strokecolor="${C.gold}" strokeweight="1px" fillcolor="${C.navy}"><w:anchorlock/><center style="color:${C.papier};font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase">${esc(t)}</center></v:roundrect><![endif]-->`
        + `<!--[if !mso]><!--><a href="${esc(l)}" target="_blank" class="san" style="display:inline-block;padding:17px 34px 16px;border:1px solid ${C.gold};border-radius:999px;font-family:${F.sans};font-size:12px;line-height:16px;letter-spacing:2.4px;text-transform:uppercase;color:${C.papier};text-decoration:none;mso-hide:all">${esc(t)}&nbsp;&nbsp;&rarr;</a><!--<![endif]-->`
        + `</td></tr></table>`;
    },
    termine(b) {
      const e = (b.eintraege || []).filter(x => x.wann || x.was || x.wo);
      return (b.titel ? `<h2 class="ser" style="margin:0 0 6px;font-family:${F.serif};font-weight:500;font-size:26px;line-height:32px;color:${C.navy}">${zeilen(b.titel)}</h2>` : '')
        + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` + e.map((x, i) => `<tr><td style="padding:18px 0 ${i === e.length - 1 ? 2 : 18}px;border-top:1px solid ${C.sand}">`
          + (x.wann ? `<div class="mono" style="font-family:${F.mono};font-size:11px;line-height:17px;letter-spacing:2px;text-transform:uppercase;color:${C.tief}">${zeilen(x.wann)}</div>` : '')
          + (x.was ? `<div class="ser" style="margin-top:5px;font-family:${F.serif};font-weight:500;font-size:23px;line-height:28px;color:${C.navy}">${zeilen(x.was)}</div>` : '')
          + (x.wo ? `<div style="margin-top:4px;font-family:${F.sans};font-size:15px;line-height:22px;color:#4a4b52">${zeilen(x.wo).replace(/ · /g, '&nbsp;·&nbsp;')}</div>` : '')
          + `</td></tr>`).join('') + `</table>`;
    },
    liste(b) {
      const e = (b.eintraege || []).filter(x => x.name || x.detail || x.preis);
      return (b.titel ? `<h2 class="ser" style="margin:0 0 6px;font-family:${F.serif};font-weight:500;font-size:26px;line-height:32px;color:${C.navy}">${zeilen(b.titel)}</h2>` : '')
        + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` + e.map((x, i) => `<tr><td valign="top" style="padding:18px 16px ${i === e.length - 1 ? 2 : 18}px 0;border-top:1px solid ${C.sand}">`
          + `<div class="ser" style="font-family:${F.serif};font-weight:500;font-size:22px;line-height:27px;color:${C.navy}">${zeilen(x.name)}</div>`
          + (x.detail ? `<div style="margin-top:4px;font-family:${F.sans};font-size:15px;line-height:22px;color:#4a4b52">${zeilen(x.detail)}</div>` : '')
          + `</td><td valign="top" align="right" style="padding:22px 0 0;border-top:1px solid ${C.sand};white-space:nowrap"><span class="mono" style="font-family:${F.mono};font-size:12px;line-height:18px;letter-spacing:1px;color:${C.tief}">${zeilen(x.preis)}</span></td></tr>`).join('') + `</table>`;
    },
    trenner(b, o) { return `<img src="${o.basis}haeuser/culinarium/mail/_trenner.png" width="190" height="30" alt="" style="display:block;margin:0 auto;width:190px;height:30px;border:0">`; },
  };
  const ABSTAND = { titel: [44, 8], text: [14, 14], foto: [18, 18], knopf: [22, 26], termine: [18, 18], liste: [18, 18], trenner: [26, 26] };

  /* Bulletproof-Hintergrund: Tapete als Kachel (Gmail, Apple Mail), Outlook über VML, sonst Marine */
  function html(doc, o = {}) {
    const basis = o.basis || ONLINE, ed = !!o.editor, M = o.M;
    const v = VERSAND[doc.versand] || VERSAND.mailchimp;
    const tap = basis + 'haeuser/culinarium/mail/_tapete.jpg';
    const k = doc.kopf || {}, f = doc.fuss || {};
    const bl = doc.bloecke || [];
    let karte = '';
    const fotoK = k.foto || k.url;
    if (fotoK) {
      const src = fotoQuelle(k, basis), h = Math.round(BREITE * fotoMass(M, k));
      karte += `<tr><td${ed ? ' data-b="kopf"' : ''} style="padding:0;font-size:0;line-height:0"><img src="${esc(src)}" width="${BREITE}" height="${h}" alt="${esc(k.alt || '')}" class="voll" style="display:block;width:100%;max-width:${BREITE}px;height:auto;border:0;border-radius:6px 6px 0 0"></td></tr>`;
    }
    bl.forEach((b, i) => {
      const bau = BAU[b.typ]; if (!bau) return;
      const [ob, un] = ABSTAND[b.typ] || [16, 16];
      const oben = i === 0 && !fotoK ? Math.max(ob, 44) : ob, unten = i === bl.length - 1 ? Math.max(un, 48) : un;
      const seite = b.typ === 'foto' && b.voll ? 0 : RAND;
      karte += td(bau(b, { basis, M }), `${oben}px ${seite}px ${unten}px`, ed, i).replace(seite === 0 ? 'class="px" ' : '\0', '');
    });
    if (!bl.length) karte += `<tr><td style="padding:48px">&nbsp;</td></tr>`;

    const abm = f.abmelden !== false;
    const fuss = `<tr><td${ed ? ' data-b="fuss"' : ''} align="center" style="padding:40px 24px 48px;text-align:center">
<img src="${basis}haeuser/culinarium/mail/_fuss.png" width="60" height="54" alt="" style="display:block;margin:0 auto 14px;width:60px;height:54px;border:0">
<div class="mono" style="font-family:${F.mono};font-size:11px;line-height:18px;letter-spacing:3px;text-transform:uppercase;color:${C.gold}">Culinarium</div>
<div style="margin-top:10px;font-family:${F.sans};font-size:13px;line-height:21px;color:#e9e0de">Walk on the Wild Side<br>Haasemannstraße 13 &middot; 30449&nbsp;Hannover<br><a href="https://www.instagram.com/culinarium_hannover/" target="_blank" style="color:${C.gold};text-decoration:none">Instagram @culinarium_hannover</a></div>
${f.text ? `<div style="margin-top:18px;font-family:${F.sans};font-size:12px;line-height:19px;color:#f4c2b0">${zeilen(f.text)}</div>` : ''}
${abm || v.online ? `<div style="margin-top:18px;font-family:${F.sans};font-size:12px;line-height:19px;color:#f4c2b0">${[v.online && abm ? `<a href="${v.online}" target="_blank" style="color:#f4c2b0;text-decoration:underline">Im Browser ansehen</a>` : '', abm ? `<a href="${v.abmelden}" target="_blank" style="color:#f4c2b0;text-decoration:underline">Vom Newsletter abmelden</a>` : ''].filter(Boolean).join(' &middot; ')}</div>` : ''}
</td></tr>`;

    const pre = String(doc.vorschau || '').trim();
    return `<!doctype html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${esc(doc.betreff || doc.name || 'Culinarium')}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><style>.ser,h1,h2{font-family:Georgia,'Times New Roman',serif!important}.san,.mono,p,div,td,a{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@340&family=DM+Mono&family=Instrument+Sans&display=swap" rel="stylesheet"><!--<![endif]-->
<style>
body{margin:0!important;padding:0!important;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic}
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
@media screen and (max-width:620px){.px{padding-left:26px!important;padding-right:26px!important}.h1{font-size:33px!important;line-height:37px!important}.voll{width:100%!important;height:auto!important}.aussen{padding-left:0!important;padding-right:0!important}}
${ed ? `[data-b]{cursor:pointer;transition:box-shadow .2s}[data-b]:hover{box-shadow:inset 0 0 0 1.5px rgba(239,118,73,.75)}[data-b].an{box-shadow:inset 0 0 0 2px #ef7649,inset 0 0 0 5px rgba(245,166,137,.25)}html{scrollbar-width:none}` : ''}
</style>
</head>
<body style="margin:0;padding:0;background:${C.navy}" bgcolor="${C.navy}">
<!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"><v:fill type="tile" src="${tap}" color="${C.navy}"/></v:background><![endif]-->
${pre ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:${C.navy}">${esc(pre)}${'&#8199;&#847; '.repeat(60)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.navy}" background="${tap}" style="background:${C.navy} url('${tap}') repeat">
<tr><td align="center" class="aussen" style="padding:0 12px">
<!--[if mso]><table role="presentation" width="${BREITE}" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${BREITE}px;margin:0 auto">
<tr><td${ed ? ' data-b="kopf"' : ''} align="center" style="padding:40px 0 34px"><a href="https://www.instagram.com/culinarium_hannover/" target="_blank" style="text-decoration:none"><img src="${basis}haeuser/culinarium/mail/_kopf.png" width="278" height="64" alt="Culinarium · A UNiQUE EXPERiENCE BY MOMO X RUDI" style="display:block;margin:0 auto;width:278px;height:64px;border:0;color:${C.gold};font-family:Georgia,serif;font-size:18px;letter-spacing:4px"></a></td></tr>
<tr><td style="padding:0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.papier}" style="background:${C.papier};border-radius:6px">
${karte}
</table>
</td></tr>
${fuss}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`;
  }

  /* Prüfung vor dem Versand: Platzhalter, fehlende Links, Betreff, Vorschauzeile, Fotos */
  function pruefe(doc) {
    const p = [], klammer = /\[[^\]]+\]/;
    if (!String(doc.betreff || '').trim()) p.push({ b: 'mail', t: 'Betreff fehlt' });
    if (!String(doc.vorschau || '').trim()) p.push({ b: 'mail', t: 'Vorschauzeile fehlt (der graue Satz nach dem Betreff im Posteingang)' });
    [['betreff', 'Betreff'], ['vorschau', 'Vorschauzeile']].forEach(([f, n]) => { const m = String(doc[f] || '').match(klammer); if (m) p.push({ b: 'mail', t: `${n}: ${m[0]} ersetzen` }); });
    (doc.bloecke || []).forEach((b, i) => {
      const texte = [];
      Object.entries(b).forEach(([k, val]) => { if (typeof val === 'string' && !['typ', 'foto', 'url', 'ausr'].includes(k)) texte.push(val); });
      (b.eintraege || []).forEach(e => Object.values(e).forEach(x => texte.push(String(x || ''))));
      const m = texte.join(' ').match(new RegExp(klammer, 'g')); if (m) p.push({ b: i, t: `${[...new Set(m)].join(', ')} ersetzen` });
      if (b.typ === 'knopf' && !linkOk(b.link)) p.push({ b: i, t: 'Knopf «' + (b.text || '') + '» braucht eine gültige Adresse (https://… oder tel:)' });
      if (b.typ === 'foto' && !b.foto && !b.url) p.push({ b: i, t: 'Foto fehlt' });
      if (b.typ === 'foto' && b.url && !/^https:\/\//.test(b.url.trim())) p.push({ b: i, t: 'Eigene Bildadresse muss mit https:// beginnen' });
      if (b.typ === 'foto' && b.link && !linkOk(b.link)) p.push({ b: i, t: 'Link am Foto ist keine gültige Adresse' });
    });
    if ((doc.fuss || {}).abmelden !== false && doc.versand === 'anderes') p.push({ b: 'fuss', t: 'Abmeldelink: im Versandprogramm die Adresse einsetzen' });
    return p;
  }

  window.DSMAIL = { html, pruefe, VERSAND, ONLINE, linkOk, bildUrl };
})();
