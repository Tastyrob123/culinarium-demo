/* Demo-Weiche (Walk on the Wild Side, 1.11.2026): die Werkzeuge laufen online ohne Server.
   Jede Anfrage an den Server wird mit den aufgenommenen Beispielwerten beantwortet; Speichern und Veröffentlichen
   antworten «geklappt», ändern aber nichts. Wege mit «/» am Anfang werden auf den Ordner dieser Demo umgebogen. */
(function () {
  'use strict';
  var KARTE = window.__DEMO_KARTE || {}, POST = window.__DEMO_POST || {}, LINKS = window.__DEMO_LINKS || {};
  var me = document.currentScript && document.currentScript.src || '';
  var BASE = me.replace(/demo\/shim\.js.*$/, '');           // Wurzel der Demo, endet mit «/»
  var U = new URL(BASE, location.href), ORIGIN = U.origin, BPATH = U.pathname;
  var SITE = BPATH.replace(/werkzeuge\/[^\/]+\/$/, '').replace(/[^\/]*\/$/, function (x) { return /werkzeuge/.test(x) ? '' : x; });   // Wurzel der Seite (GitHub Pages: /culinarium-demo/)
  window.__DEMO = { BASE: BASE };

  function norm(p) {                                       // Weg relativ zur Wurzel (ohne «/» vorn), mit Suche
    try {
      var u = new URL(p, location.href);
      if (/^127\.0\.0\.1$|^localhost$/.test(u.hostname)) { var l = LINKS[u.port]; if (l) return { aussen: l + '' }; return { weg: u.pathname.replace(/^\//, '') + u.search, nur: u.pathname.replace(/^\//, '') }; }
      if (u.origin !== ORIGIN) return null;
      var pfad = u.pathname;
      if (/^\/(besuch|verweil)\.js$/.test(pfad)) return null;   // Besuchszähler liegt an der Wurzel der Demo, nicht umbiegen (01.11.2026)
      if (pfad.indexOf(BPATH) === 0) pfad = pfad.slice(BPATH.length); else if (SITE.length > 1 && pfad.indexOf(SITE) === 0) pfad = pfad.slice(SITE.length); else pfad = pfad.replace(/^\//, '');
      return { weg: pfad + u.search, nur: pfad };
    } catch (e) { return null; }
  }
  /* Bildgrößen: aufgenommen wurde nur eine Breite. Fehlt «name-640.webp», nimm die nächste vorhandene Größe desselben Bildes. */
  var GROESSEN = {};
  Object.keys(KARTE).forEach(function (k) {
    var m = /^(.*)-(\d{2,4})\.(webp|jpe?g|png|avif)$/.exec(k.split('?')[0]);
    if (m) (GROESSEN[m[1] + '|' + m[3]] = GROESSEN[m[1] + '|' + m[3]] || []).push([+m[2], KARTE[k]]);
  });
  function variante(nur) {
    var m = /^(.*)-(\d{2,4})\.(webp|jpe?g|png|avif)$/.exec(nur); if (!m) return null;
    var l = GROESSEN[m[1] + '|' + m[3]]; if (!l) return null;
    var w = +m[2], best = null;
    l.forEach(function (x) { if (!best || (x[0] >= w) && (best[0] < w || x[0] < best[0]) || best[0] < w && x[0] > best[0]) best = x; });
    return best && best[1];
  }
  var VORHANDEN = {};
  Object.keys(KARTE).forEach(function (k) { VORHANDEN[KARTE[k]] = 1; });
  function groesse(abs) {                                  // volle Adresse in der Demo → vorhandene Größe (oder null)
    try { abs = new URL(abs, location.href).href; } catch (e) { return null; }
    if (abs.indexOf(BASE) !== 0) return null;
    var rel = abs.slice(BASE.length).split(/[?#]/)[0];
    try { rel = decodeURIComponent(rel); } catch (e) {}
    if (VORHANDEN[rel]) return null;
    var v = variante(rel); return v ? BASE + v : null;
  }
  function ziel(p) {                                       // Datei in der Demo für einen Weg (oder null)
    var n = norm(p); if (!n) return null; if (n.aussen) return n.aussen;
    var w = n.weg, d = decodeURIComponent;
    var f = KARTE[w] || KARTE[n.nur];
    if (!f) { try { f = KARTE[d(w)] || KARTE[d(n.nur)]; } catch (e) {} }
    if (!f && /^u/.test(n.nur)) f = KARTE['_' + w.slice(1)] || KARTE['_' + n.nur.slice(1)];
    if (!f && /\/$/.test(n.nur)) f = KARTE[n.nur + 'index.html'];
    if (!f) f = variante(n.nur);
    /* Seiten der Website (oberste Ebene, nicht in der Demo): zur öffentlichen Website, wenn links.json «website» nennt */
    if (!f && LINKS.website && /^([\w-]+\.html)?$/.test(n.nur)) return LINKS.website.replace(/\/?$/, '/') + n.nur + (n.weg.slice(n.nur.length) || '');
    if (!f && /^assets\/bild\//.test(n.nur) && SITE.length > 1) return ORIGIN + SITE + n.weg;   // Fotos liegen an der Wurzel der Seite
    return BASE + (f || n.nur.replace(/^_/, 'u'));
  }
  window.__demoZiel = ziel;

  function antwort(text, typ, st) { return new Response(text, { status: st || 200, headers: { 'Content-Type': typ || 'application/json' } }); }
  function postAntwort(m, p) {
    var n = norm(p) || { nur: '' }, k = m + ' ' + n.nur, r = POST[k];
    if (r) return fetchOrig(BASE + r.f).then(function (x) { return x.text(); }).then(function (t) { return antwort(t, r.ct, r.st >= 400 ? 200 : r.st); });
    return Promise.resolve(antwort(JSON.stringify({ ok: true, demo: true, hinweis: 'Demo: nichts wurde wirklich geändert.' })));
  }

  var fetchOrig = window.fetch.bind(window);
  window.fetch = function (inp, init) {
    var url = typeof inp === 'string' ? inp : (inp && inp.url) || String(inp);
    var m = ((init && init.method) || (inp && inp.method) || 'GET').toUpperCase();
    var n = norm(url);
    if (!n) return fetchOrig(inp, init);
    if (n.aussen) return fetchOrig(inp, init);
    if (m !== 'GET' && m !== 'HEAD') return postAntwort(m, url);
    var z = ziel(url);
    return fetchOrig(z, { method: m, cache: 'no-store' }).then(function (r) {
      if (r.ok) return r;
      return antwort(JSON.stringify({ ok: true, demo: true, liste: [], eintraege: [] }));
    }, function () { return antwort(JSON.stringify({ ok: true, demo: true })); });
  };

  var XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, url) {
    var a = [].slice.call(arguments); this.__m = String(m).toUpperCase();
    if (norm(url) && this.__m === 'GET') a[1] = ziel(url);
    else if (norm(url) && this.__m !== 'GET') { this.__demoPost = url; a[0] = 'GET'; a[1] = BASE + 'demo/ok.json'; }
    return XO.apply(this, a);
  };
  XMLHttpRequest.prototype.send = function (b) { return XS.call(this, this.__demoPost ? null : b); };
  if (navigator.sendBeacon) { var sbOrig = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = function (u, d) { return /^https:\/\/tasty-besuche\.vercel\.app\//.test(String(u)) ? sbOrig(u, d) : true; }; }   // Besuche zählen darf durch (01.11.2026)
  if (window.EventSource) window.EventSource = function () { this.close = function () {}; this.addEventListener = function () {}; };

  /* src/href schon beim Setzen umbiegen (sonst geht die erste Anfrage an die Wurzel) */
  function lokal(v) { return typeof v === 'string' && (v.charAt(0) === '/' && v.charAt(1) !== '/' || /^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(v)); }
  [['HTMLImageElement', 'src'], ['HTMLScriptElement', 'src'], ['HTMLLinkElement', 'href'], ['HTMLIFrameElement', 'src'], ['HTMLSourceElement', 'src'],
   ['HTMLVideoElement', 'src'], ['HTMLAudioElement', 'src'], ['HTMLAnchorElement', 'href'], ['HTMLVideoElement', 'poster']].forEach(function (z) {
    var K = window[z[0]]; if (!K) return;
    var d = Object.getOwnPropertyDescriptor(K.prototype, z[1]); if (!d || !d.set) return;
    Object.defineProperty(K.prototype, z[1], { configurable: true, enumerable: d.enumerable, get: d.get, set: function (v) { d.set.call(this, lokal(v) ? ziel(v) : v); } });
  });
  function fixHtml(s) {
    return typeof s !== 'string' ? s : s.replace(/(\s(?:src|href|poster)=)(["'])(\/(?!\/)[^"']*)\2/g, function (_, a, q, p) { return a + q + ziel(p) + q; })
      .replace(/url\(\s*(['"]?)(\/(?!\/)[^'")]+)\1\s*\)/g, function (_, q, p) { return 'url(' + q + ziel(p) + q + ')'; })
      .replace(/(\ssrcset=)(["'])([^"']*)\2/g, function (_, a, q, v) { return a + q + v.replace(/(^|,\s*)(\/(?!\/)[^\s,]+)/g, function (_, s, p) { return s + ziel(p); }) + q; });
  }
  var dw = document.write, dwl = document.writeln;
  document.write = function () { return dw.apply(document, [].map.call(arguments, fixHtml)); };
  document.writeln = function () { return dwl.apply(document, [].map.call(arguments, fixHtml)); };
  var sd = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'srcdoc');
  if (sd && sd.set) Object.defineProperty(HTMLIFrameElement.prototype, 'srcdoc', { configurable: true, get: sd.get, set: function (v) { sd.set.call(this, fixHtml(v)); } });
  var setA = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (n, v) {
    if ((n === 'src' || n === 'href' || n === 'poster') && lokal(v)) v = ziel(v);
    if (n === 'srcdoc') v = fixHtml(v);
    return setA.call(this, n, v);
  };

  /* Wege in Attributen umbiegen (src, href, srcset, poster, action), auch für später eingefügte Teile */
  var ATTR = ['src', 'href', 'poster', 'data-src'];
  function biege(el) {
    if (!el || el.nodeType !== 1) return;
    for (var i = 0; i < ATTR.length; i++) {
      var a = ATTR[i], v = el.getAttribute(a);
      if (!v || el.__demoGebogen === v) continue;
      if (/^(#|data:|blob:|mailto:|tel:|javascript:|https?:\/\/(?!127\.0\.0\.1|localhost))/i.test(v)) continue;
      if (v.charAt(0) === '/' || /^https?:\/\/(127\.0\.0\.1|localhost)/.test(v)) {
        var z = ziel(v); if (z) { el.__demoGebogen = z; el.setAttribute(a, z); if (a === 'href' && el.tagName === 'A' && /^https?:/.test(z) && z.indexOf(ORIGIN) !== 0) el.target = '_blank'; }
      }
    }
    var st = el.getAttribute('style');
    /* Hintergrundbild per Skript mit voller Adresse in der Demo, aber diese Größe fehlt: vorhandene Größe nehmen */
    if (st && st.indexOf(BASE) >= 0 && /-\d{2,4}\.(webp|jpe?g|png|avif)/.test(st)) {
      var st2 = st.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, function (g, q, u) { var x = groesse(u); return x ? 'url(' + q + x + q + ')' : g; });
      if (st2 !== st) { setA.call(el, 'style', st2); st = st2; }
    }
    if (st && /url\(\s*['"]?\/(?!\/)/.test(st)) setA.call(el, 'style', st.replace(/url\(\s*(['"]?)(\/(?!\/)[^'")]+)\1\s*\)/g, function (_, q, p) { return 'url(' + q + ziel(p) + q + ')'; }));
    if (el.tagName === 'STYLE' && /url\(\s*['"]?\/(?!\/)/.test(el.textContent)) el.textContent = el.textContent.replace(/url\(\s*(['"]?)(\/(?!\/)[^'")]+)\1\s*\)/g, function (_, q, p) { return 'url(' + q + ziel(p) + q + ')'; });
    var ss = el.getAttribute('srcset');
    if (ss && /(^|,)\s*\//.test(ss)) el.setAttribute('srcset', ss.replace(/(^|,\s*)(\/[^\s,]+)/g, function (_, a, p) { return a + ziel(p); }));
    /* Bilder mit fehlender Größe (auch relative Wege): vorhandene Größe nehmen */
    if (el.tagName === 'IMG' || el.tagName === 'SOURCE') {
      var s = el.getAttribute('src'), g = s && /-\d{2,4}\.(webp|jpe?g|png|avif)/.test(s) && groesse(s);
      if (g) setA.call(el, 'src', g);
      var ss2 = el.getAttribute('srcset');
      if (ss2 && /-\d{2,4}\.(webp|jpe?g|png|avif)/.test(ss2)) {
        var neu = ss2.split(',').map(function (c) { var t = c.trim().split(/\s+/); var x = groesse(t[0]); return (x || t[0]) + (t[1] ? ' ' + t[1] : ''); }).join(', ');
        if (neu !== ss2) setA.call(el, 'srcset', neu);
      }
    }
  }
  function alle(root) { if (root.nodeType !== 1) return; biege(root); var l = root.querySelectorAll('[src],[href],[srcset],[poster],[data-src],[style],style'); for (var i = 0; i < l.length; i++) biege(l[i]); }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (m.type === 'attributes') biege(m.target);
      else for (var j = 0; j < m.addedNodes.length; j++) alle(m.addedNodes[j]);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href', 'srcset', 'poster', 'data-src', 'style'] });
  document.addEventListener('DOMContentLoaded', function () { alle(document.documentElement); });

  /* Seitenwechsel per Skript auf andere Wege («location.href = '/…'») */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href');
    /* Ordner-Links («x/») auf «x/index.html»: manche Hoster liefern keine index.html von selbst */
    if (h && !/^(#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(h) && h.charAt(0) !== '/') { var hu = new URL(h, location.href); if (hu.origin === ORIGIN && /\/$/.test(hu.pathname)) { e.preventDefault(); hu.pathname += 'index.html'; location.href = hu.href; return; } }
    if (h && (h.charAt(0) === '/' || /^https?:\/\/(127\.0\.0\.1|localhost)[:\/]/.test(h))) { e.preventDefault(); var z = ziel(h); if (/^https?:/.test(z) && z.indexOf(ORIGIN) !== 0) window.open(z, '_blank', 'noopener'); else location.href = z; }
  }, true);
  var asg = window.Location && Location.prototype.assign;
  if (asg) Location.prototype.assign = function (u) { var n = norm(u); return asg.call(this, n ? ziel(u) : u); };
  var rep = window.Location && Location.prototype.replace;
  if (rep) Location.prototype.replace = function (u) { var n = norm(u); return rep.call(this, n ? ziel(u) : u); };
  var wo = window.open; window.open = function (u) { var a = [].slice.call(arguments); if (u && norm(u)) a[0] = ziel(u); return wo.apply(window, a); };

  /* kleines Band: «Demo mit Beispielwerten» */
  document.addEventListener('DOMContentLoaded', function () {
    if (window.top !== window || document.getElementById('demoBand')) return;
    var b = document.createElement('div'); b.id = 'demoBand';
    b.textContent = 'Demo mit Beispielwerten · nichts wird wirklich geändert';
    b.setAttribute('style', 'position:fixed;left:10px;bottom:10px;z-index:2147483646;pointer-events:none;padding:6px 14px;border-radius:999px;font:500 10px/1.2 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#f8f3eb;background:rgba(19,14,13,.78);box-shadow:0 0 0 1px rgba(216,178,100,.5);white-space:nowrap;max-width:calc(100vw - 24px);overflow:hidden;text-overflow:ellipsis');
    document.body.appendChild(b);
  });
})();
