/* Übergang «Heute» / «Mit den nächsten 60» (Bausteine zu uebergang.css). Erwartet #grid mit data-heute (Beiträge heute) und data-gesamt,
   neue Kacheln .t ohne .alt (oben, neuester zuerst), bisherige .t.alt, dazwischen .band; die Zahl im Kopf ist das erste .nums b.
   Optional ein scrollender Behälter #scroll (Handy), sonst das Fenster. Baut den Schalter .fw selbst. */
(function () {
  var grid = document.getElementById('grid'); if (!grid || !grid.querySelector('.t.alt')) return;
  var sc = document.getElementById('scroll'), zahl = document.querySelector('.nums b');
  var neu = [].slice.call(grid.querySelectorAll('.t:not(.alt)')), band = grid.querySelector('.band'), lauf = 0;
  var fw = document.createElement('div'); fw.className = 'fw'; fw.setAttribute('role', 'group'); fw.setAttribute('aria-label', 'Feed heute oder mit den nächsten 60');
  fw.innerHTML = '<div class="seg"><button type="button" data-z="heute">Heute</button><button type="button" data-z="mit" class="on">Mit den nächsten ' + neu.length + '</button></div>'
    + '<button type="button" class="nrk" aria-pressed="true"><i></i>Nummern</button>';
  var tabs = sc && sc.querySelector('.tabs');   // im Profil: als Band über dem Raster; sonst (Tafel) schwebend
  if (tabs) { fw.classList.add('fw--band'); tabs.parentNode.insertBefore(fw, tabs.nextSibling); } else document.body.appendChild(fw);
  var pimg = document.getElementById('pimg');   // Detailbild erst beim Öffnen zeigen
  if (pimg) document.addEventListener('click', function (e) { if (e.target.closest('#grid .t, #vor, #nach')) pimg.hidden = false; }, true);
  function oben(el) { return sc ? el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop : el.getBoundingClientRect().top + scrollY; }
  function rolle(nach, ms) {   // sanft scrollen, im Handy oder im Fenster
    var von = sc ? sc.scrollTop : scrollY, t0 = performance.now(), id = ++lauf;
    (function f(t) { if (id !== lauf) return; var k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, y = von + (nach - von) * e;
      if (sc) sc.scrollTop = y; else scrollTo(0, y); if (k < 1) requestAnimationFrame(f); })(t0);
  }
  function zeig(z) {
    [].forEach.call(fw.querySelectorAll('.seg button'), function (b) { b.classList.toggle('on', b.dataset.z === z); });
    if (zahl) zahl.textContent = z === 'heute' ? grid.dataset.heute : grid.dataset.gesamt;
    if (z === 'heute') {
      neu.forEach(function (t) { t.classList.add('zu'); }); if (band) band.style.opacity = 0;
      setTimeout(function () { grid.classList.add('heute'); if (band) band.style.opacity = ''; rolle(Math.max(0, oben(grid) - 120), 500); }, 420);
    } else {
      if (!grid.classList.contains('heute')) return;
      neu.forEach(function (t) { t.classList.add('zu'); }); grid.classList.remove('heute');
      var start = oben(band) - (sc ? sc.clientHeight : innerHeight) * .55;
      if (sc) sc.scrollTop = start; else scrollTo(0, start);
      var n = neu.length;   // Beitrag 1 (als Nächstes gepostet) erscheint zuerst, direkt über dem Band; der Feed wächst nach oben
      for (var i = n - 1; i >= 0; i--) (function (t, k) { setTimeout(function () { t.classList.remove('zu'); }, 40 + k * 32); })(neu[i], n - 1 - i);
      rolle(Math.max(0, oben(grid) - 120), 40 + n * 32 + 300);
    }
  }
  fw.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('nrk')) { var an = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', an); grid.classList.toggle('ohne-nr', !an); return; }
    zeig(b.dataset.z);
  });
})();
