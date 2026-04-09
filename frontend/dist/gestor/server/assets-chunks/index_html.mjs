export default `<!DOCTYPE html><html lang="es"><head>
  <meta charset="utf-8">
  <title>Angular Esencial</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css"><style ng-app-id="ng">

main[_ngcontent-ng-c3517859805] {
  width: 90%;
  max-width: 50rem;
  margin: 2.5rem auto;
  display: grid;
  grid-auto-flow: row;
  gap: 2rem;
}
#usuarios[_ngcontent-ng-c3517859805] {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 0.5rem;
  overflow: auto;
}
#textoCondicional[_ngcontent-ng-c3517859805] {
  font-weight: bold;
  font-size: 1.15rem;
  margin: 0;
  text-align: center;
}
@media (min-width: 768px) {
  main[_ngcontent-ng-c3517859805] {
    margin: 4rem auto;
    grid-template-columns: 1fr 3fr;
  }
  #usuarios[_ngcontent-ng-c3517859805] {
    flex-direction: column;
  }
  #textoCondicional[_ngcontent-ng-c3517859805] {
    font-size: 1.5rem;
    text-align: left;
  }
}
/*# sourceMappingURL=/app.css.map */</style><style ng-app-id="ng">

header[_ngcontent-ng-c4165182179] {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 90%;
  max-width: 50rem;
  margin: 0 auto 2rem auto;
  text-align: center;
  background:
    linear-gradient(
      to bottom,
      #2c0a4c,
      #450d80);
  padding: 1rem;
  border-bottom-right-radius: 12px;
  border-bottom-left-radius: 12px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.6);
  position: relative;
}
img[_ngcontent-ng-c4165182179] {
  width: 3.5rem;
  object-fit: contain;
}
h1[_ngcontent-ng-c4165182179] {
  font-size: 1.25rem;
  margin: 0;
  padding: 0;
}
p[_ngcontent-ng-c4165182179] {
  margin: 0;
  font-size: 0.8rem;
  text-wrap: balance;
}
.sesion-info[_ngcontent-ng-c4165182179] {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}
.usuario-badge[_ngcontent-ng-c4165182179] {
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  color: #e2e8f0;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.usuario-badge[_ngcontent-ng-c4165182179]:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: scale(1.04);
}
.btn-logout[_ngcontent-ng-c4165182179] {
  font-size: 0.8rem;
  background: rgba(239, 68, 68, 0.18);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  color: #fca5a5;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s, transform 0.15s;
}
.btn-logout[_ngcontent-ng-c4165182179]:hover {
  background: rgba(239, 68, 68, 0.32);
  transform: scale(1.04);
}
.btn-login-header[_ngcontent-ng-c4165182179] {
  font-size: 0.8rem;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.5);
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  color: #a5b4fc;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s, transform 0.15s;
}
.btn-login-header[_ngcontent-ng-c4165182179]:hover {
  background: rgba(99, 102, 241, 0.38);
  transform: scale(1.04);
}
.logo-click[_ngcontent-ng-c4165182179] {
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s;
  -webkit-user-select: none;
  user-select: none;
}
.logo-click[_ngcontent-ng-c4165182179]:hover {
  transform: scale(1.03);
  filter: brightness(1.1);
}
@media (min-width: 768px) {
  header[_ngcontent-ng-c4165182179] {
    padding: 2rem;
  }
  img[_ngcontent-ng-c4165182179] {
    width: 4.5rem;
  }
  h1[_ngcontent-ng-c4165182179] {
    font-size: 1.5rem;
    margin: 0;
    padding: 0;
  }
}
/*# sourceMappingURL=/encabezado.css.map */</style><style ng-app-id="ng">

button[_ngcontent-ng-c778115478] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background-color: #433352;
  color: #c3b3d1;
  border: none;
  font: inherit;
  cursor: pointer;
  width: 100%;
  min-width: 10rem;
  text-align: left;
}
button[_ngcontent-ng-c778115478]:hover, 
button[_ngcontent-ng-c778115478]:active, 
.active[_ngcontent-ng-c778115478] {
  background-color: #9965dd;
  color: #150722;
}
img[_ngcontent-ng-c778115478] {
  width: 2rem;
  object-fit: contain;
  border-radius: 50%;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
}
span[_ngcontent-ng-c778115478] {
  margin: 0;
  padding: 0;
  font-size: 0.8rem;
  font-weight: normal;
}
/*# sourceMappingURL=/usuario.css.map */</style><style ng-app-id="ng">

div[_ngcontent-ng-c2269596696] {
  border-radius: 6px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
/*# sourceMappingURL=/tarjeta.css.map */</style></head>

<body><!--nghm--><script type="text/javascript" id="ng-event-dispatch-contract">(()=>{function p(t,n,r,o,e,i,f,m){return{eventType:t,event:n,targetElement:r,eic:o,timeStamp:e,eia:i,eirp:f,eiack:m}}function u(t){let n=[],r=e=>{n.push(e)};return{c:t,q:n,et:[],etc:[],d:r,h:e=>{r(p(e.type,e,e.target,t,Date.now()))}}}function s(t,n,r){for(let o=0;o<n.length;o++){let e=n[o];(r?t.etc:t.et).push(e),t.c.addEventListener(e,t.h,r)}}function c(t,n,r,o,e=window){let i=u(t);e._ejsas||(e._ejsas={}),e._ejsas[n]=i,s(i,r),s(i,o,!0)}window.__jsaction_bootstrap=c;})();
</script><script>window.__jsaction_bootstrap(document.body,"ng",["click"],[]);</script>
  <app-encabezado></app-encabezado>
  <app-root ng-version="21.2.2" _nghost-ng-c3517859805="" ngh="3" ng-server-context="ssg"><!--container--><!--container--><app-encabezado _ngcontent-ng-c3517859805="" _nghost-ng-c4165182179="" ngh="0"><header _ngcontent-ng-c4165182179=""><img _ngcontent-ng-c4165182179="" src="img/listado-tareas-logo.png" alt="Lista de Tareas" class="logo-click" jsaction="click:;"><div _ngcontent-ng-c4165182179="" class="logo-click" jsaction="click:;"><h1 _ngcontent-ng-c4165182179="">TAREA FACIL</h1><p _ngcontent-ng-c4165182179="">Administrador de Tareas ADSO</p></div><div _ngcontent-ng-c4165182179="" class="sesion-info"><!--container--><button _ngcontent-ng-c4165182179="" class="btn-login-header" jsaction="click:;">🔐 Iniciar Sesión</button><!--container--></div></header></app-encabezado><main _ngcontent-ng-c3517859805=""><ul _ngcontent-ng-c3517859805="" id="usuarios"><li _ngcontent-ng-c3517859805=""><app-usuario _ngcontent-ng-c3517859805="" _nghost-ng-c778115478="" ngh="2"><app-tarjeta _ngcontent-ng-c778115478="" _nghost-ng-c2269596696="" ngh="1"><div _ngcontent-ng-c2269596696=""><button _ngcontent-ng-c778115478="" class="" jsaction="click:;"><img _ngcontent-ng-c778115478="" src="img/usuario-1.png" alt="Antonia Céspedes"><span _ngcontent-ng-c778115478="">Antonia Céspedes</span></button></div></app-tarjeta></app-usuario></li><li _ngcontent-ng-c3517859805=""><app-usuario _ngcontent-ng-c3517859805="" _nghost-ng-c778115478="" ngh="2"><app-tarjeta _ngcontent-ng-c778115478="" _nghost-ng-c2269596696="" ngh="1"><div _ngcontent-ng-c2269596696=""><button _ngcontent-ng-c778115478="" class="" jsaction="click:;"><img _ngcontent-ng-c778115478="" src="img/usuario-2.png" alt="Emilia Torres"><span _ngcontent-ng-c778115478="">Emilia Torres</span></button></div></app-tarjeta></app-usuario></li><li _ngcontent-ng-c3517859805=""><app-usuario _ngcontent-ng-c3517859805="" _nghost-ng-c778115478="" ngh="2"><app-tarjeta _ngcontent-ng-c778115478="" _nghost-ng-c2269596696="" ngh="1"><div _ngcontent-ng-c2269596696=""><button _ngcontent-ng-c778115478="" class="" jsaction="click:;"><img _ngcontent-ng-c778115478="" src="img/usuario-3.png" alt="Marcos Jeremías"><span _ngcontent-ng-c778115478="">Marcos Jeremías</span></button></div></app-tarjeta></app-usuario></li><li _ngcontent-ng-c3517859805=""><app-usuario _ngcontent-ng-c3517859805="" _nghost-ng-c778115478="" ngh="2"><app-tarjeta _ngcontent-ng-c778115478="" _nghost-ng-c2269596696="" ngh="1"><div _ngcontent-ng-c2269596696=""><button _ngcontent-ng-c778115478="" class="" jsaction="click:;"><img _ngcontent-ng-c778115478="" src="img/usuario-4.png" alt="David Mercado"><span _ngcontent-ng-c778115478="">David Mercado</span></button></div></app-tarjeta></app-usuario></li><li _ngcontent-ng-c3517859805=""><app-usuario _ngcontent-ng-c3517859805="" _nghost-ng-c778115478="" ngh="2"><app-tarjeta _ngcontent-ng-c778115478="" _nghost-ng-c2269596696="" ngh="1"><div _ngcontent-ng-c2269596696=""><button _ngcontent-ng-c778115478="" class="" jsaction="click:;"><img _ngcontent-ng-c778115478="" src="img/usuario-5.png" alt="Pamela Chan"><span _ngcontent-ng-c778115478="">Pamela Chan</span></button></div></app-tarjeta></app-usuario></li><li _ngcontent-ng-c3517859805=""><app-usuario _ngcontent-ng-c3517859805="" _nghost-ng-c778115478="" ngh="2"><app-tarjeta _ngcontent-ng-c778115478="" _nghost-ng-c2269596696="" ngh="1"><div _ngcontent-ng-c2269596696=""><button _ngcontent-ng-c778115478="" class="" jsaction="click:;"><img _ngcontent-ng-c778115478="" src="img/usuario-6.png" alt="Adrián Serbio"><span _ngcontent-ng-c778115478="">Adrián Serbio</span></button></div></app-tarjeta></app-usuario></li><!--container--></ul><!--container--><p _ngcontent-ng-c3517859805="" id="textoCondicional">Selecciona un usuario de la lista</p><!--container--></main></app-root>
<script src="main.js" type="module"></script>

<script id="ng-state" type="application/json">{"__nghData__":[{"t":{"8":"t2","9":"t3"},"c":{"8":[],"9":[{"i":"t3","r":1}]}},{},{"n":{"1":"0f2"}},{"t":{"0":"t0","1":"t1","6":"t4","7":"t5","8":"t6"},"c":{"0":[],"1":[],"6":[{"i":"t4","r":1,"x":6}],"7":[],"8":[{"i":"t6","r":1}]}}]}</script></body></html>`;