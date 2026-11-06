/* Fehler von La Réception mitschreiben, bevor irgendetwas anderes läuft (Master R03, Vorlage Le Bureau des Rivage): liest pruefung.html */
(function(){var zahl=0;function merk(t){t=String(t);if(++zahl>20||/Load failed|access control|abort|NetworkError|Failed to fetch/i.test(t))return;/* Netzfehler nie melden, höchstens 20 je Seite (Safari-Schleife 15.10.2026) */
try{var a=JSON.parse(localStorage.getItem('reception-fehler')||'[]');a.push({zeit:new Date().toISOString(),text:t.slice(0,600)});localStorage.setItem('reception-fehler',JSON.stringify(a.slice(-30)))}catch(e){}
try{fetch('api/fehler',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:t.slice(0,600)}),keepalive:true}).catch(function(){})}catch(e){}}
window.addEventListener('error',function(e){merk((e.message||'Fehler')+' · '+(e.filename||'').split('/').pop()+':'+(e.lineno||''))});
window.addEventListener('unhandledrejection',function(e){merk('Versprechen: '+((e.reason&&e.reason.message)||e.reason))});window.receptionMerk=merk})();
