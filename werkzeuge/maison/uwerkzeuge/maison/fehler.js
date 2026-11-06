document.documentElement.classList.add('js');   /* Bewegung nur mit Skript; als Datei statt eingebettet (Sicherheitsregel online) */
/* Fehlermelder (R03), vor allem anderen: Skriptfehler in den Browser (culinarium_werkzeuge_fehler) und an den Server-Teil (studio/api/fehler, wenn es ihn gibt).
   Netzfehler nie melden, höchstens 20 je Seite, eigener Fehlschlag wird nicht erneut gemeldet. */
(function(){var zahl=0;function merk(t){t=String(t);window.MAISON_FEHLER=t;if(++zahl>20||/Load failed|access control|abort|NetworkError|Failed to fetch/i.test(t))return;
try{var a=JSON.parse(localStorage.getItem('culinarium_werkzeuge_fehler')||'[]');a.unshift({zeit:new Date().toISOString(),art:'maison',text:('Zentrale: '+t).slice(0,400),ort:location.pathname});localStorage.setItem('culinarium_werkzeuge_fehler',JSON.stringify(a.slice(0,30)))}catch(e){}
try{fetch('/studio/api/fehler',{method:'POST',headers:{'Content-Type':'application/json','X-Studio':'1'},body:JSON.stringify({text:('Zentrale · '+t).slice(0,600)}),keepalive:true}).catch(function(){})}catch(e){}}
window.addEventListener('error',function(e){if(e.target&&e.target.tagName==='SCRIPT'){window.MAISON_FEHLER='Die Datei '+e.target.getAttribute('src').split('?')[0]+' liess sich nicht laden.';return}merk((e.message||'Fehler')+' · '+(e.filename||'').split('/').pop()+':'+(e.lineno||''))},true);
window.addEventListener('unhandledrejection',function(e){merk('Versprechen: '+((e.reason&&e.reason.message)||e.reason))});
/* Startfehler-Tür (R04): ist maison.js beim Laden nicht durchgelaufen, sagt die Seite es und zeigt alles ohne Bewegung. Wache nach 12 s. */
function tuer(){if(window.MAISON_BEREIT)return;var t=document.getElementById('tuer');if(!t||!t.hidden)return;
document.documentElement.classList.remove('js');document.getElementById('tuer-t').textContent=window.MAISON_FEHLER||'Das Programm der Seite ist nicht durchgelaufen.';t.hidden=false}
window.addEventListener('load',tuer);setTimeout(tuer,12000);})();
