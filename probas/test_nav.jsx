// Comproba a conexión: a área nova está na botonera e na tira de
// pestanas, chega ao compoñente, e non rompeu nada do que xa había.
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Inicio, AREAS, DESCS } from '/home/claude/impro/impro/src/Inicio.jsx';
import { ThemeCtx, AuthCtx, LangCtx, TEMAS, completarTema, UI_STRINGS, t as trad } from '/home/claude/impro/impro/src/core.jsx';
import { TABS } from '/home/claude/impro/impro/src/ImproApp.jsx';

let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};
const T = completarTema(TEMAS[0].escuro,'escuro');
function texto(j){const o=[];(function w(n){if(n==null)return;if(typeof n==='string'||typeof n==='number'){o.push(String(n));return;}if(Array.isArray(n))return n.forEach(w);if(n.children)w(n.children);})(j);return o.join(' ');}

ok('sonido está en AREAS', AREAS.some(a=>a.id==='sonido'));

// ⚠️ A PROBA QUE FALTABA.
// As etiquetas non saen de AREAS, saen de UI_STRINGS. Engadir a área sen
// tocar UI_STRINGS non peta: `t()` devolve a clave crúa e a botonera
// amosaba "sonido" en minúscula. Isto compróbao para TODAS as áreas.
const senEtiqueta = [];
for (const a of AREAS) for (const l of ['es','gl','en']) {
  const et = trad(l, a.id);
  if (!UI_STRINGS[l][a.id]) senEtiqueta.push(`${a.id}/${l}: falta`);
  else if (et === a.id) senEtiqueta.push(`${a.id}/${l}: devolve a clave`);
  else if (et === et.toLowerCase() && /^[a-z]/.test(et)) senEtiqueta.push(`${a.id}/${l}: "${et}" en minúscula`);
}
ok('toda área ten etiqueta real nos tres idiomas, e ningunha empeza en minúscula',
   senEtiqueta.length===0, senEtiqueta.join(' · '));
ok('a etiqueta de sonido é a correcta',
   trad('gl','sonido')==='Son' && trad('es','sonido')==='Sonido' && trad('en','sonido')==='Sound',
   [trad('gl','sonido'),trad('es','sonido'),trad('en','sonido')].join('/'));
ok('non quedou etiqueta de Cabina', ['es','gl','en'].every(l=>!UI_STRINGS[l].show));
ok('a botonera queda en 11 áreas: entra Plano (PL1a)', AREAS.length===11, AREAS.length);
// ⚠️ R10a · Reto era o mesmo que Xerar por outra porta. Non pode quedar
// nas dúas: se volve á botonera, volve o erro de B16.
ok('⚠️ Reto xa non é área', !AREAS.some(a=>a.id==='reto'));
ok('⚠️ e tampouco pestana', !TABS.some(t=>t.id==='reto'));
ok('⚠️ e non quedou descrición orfa de Reto',
   ['es','gl','en'].every(l=>!DESCS[l].reto), 'quedou reto en DESCS');
// A etiqueta SI queda: agora é o nome do modo dentro de Xerar.
ok('pero a etiqueta de Reto segue en UI_STRINGS, que é o modo de Xerar',
   ['es','gl','en'].every(l=>!!UI_STRINGS[l].reto));

// PL1a · Plano entra como área propia.
ok('Plano é área', AREAS.some(a=>a.id==='plano'));
ok('e pestana', TABS.some(t=>t.id==='plano'));
// ⚠️ Toda área nova ten que entrar en UI_STRINGS: `t()` remata en
// `|| key`, así que unha clave que falta non peta, amosa o id cru.
ok('⚠️ e ten etiqueta nos tres idiomas',
   ['es','gl','en'].every(l=>!!UI_STRINGS[l].plano));
ok('e descrición nos tres idiomas',
   ['es','gl','en'].every(l=>!!DESCS[l].plano));
ok('a Cabina xa non está', !AREAS.some(a=>a.id==='show'));
ok('e non quedou descrición orfa de Cabina',
   ['es','gl','en'].every(l=>!DESCS[l].show), 'quedou show en DESCS');
ok('admin segue fóra da botonera (V01)', !AREAS.some(a=>a.id==='admin'));
for (const l of ['es','gl','en']) {
  ok(`hai descrición de sonido en ${l}`, !!DESCS[l].sonido, Object.keys(DESCS[l]).join(','));
}
// Toda área da botonera necesita descrición nos tres idiomas
const sen = [];
for (const a of AREAS) for (const l of ['es','gl','en']) if (!DESCS[l][a.id] && !a.desc) sen.push(`${a.id}/${l}`);
ok('todas as áreas teñen descrición nos tres idiomas', sen.length===0, sen.join(' '));

let ido=null, r=null;
const marco = (ch)=>(
  <ThemeCtx.Provider value={{T,dark:true,toggle(){},tema:TEMAS[0],setTema(){},setDark(){}}}>
    <AuthCtx.Provider value={{logueado:false,esAdmin:false,pedirLogin(){},perfil:null,session:null,migrando:false}}>
      <LangCtx.Provider value={{lang:'gl',setLang(){}}}>{ch}</LangCtx.Provider>
    </AuthCtx.Provider>
  </ThemeCtx.Provider>);
await act(async()=>{ r=TestRenderer.create(marco(<Inicio lang="gl" onIr={id=>{ido=id;}}/>)); });
const t = texto(r.toJSON());
// Xa non se busca pola descrición: as tarxetas levan só o nome.
ok('a botonera amosa Son', t.includes('Son'));
const bs = [];
(function w(n){ if(!n||typeof n!=='object')return; if(Array.isArray(n))return n.forEach(w);
  if(n.type==='button')bs.push(n); (n.children||[]).forEach(w); })(r.toJSON());
// Coas descricións acesas o texto da tarxeta empeza polo nome pero
// segue coa descrición: búscase polo nome exacto entre os nodos.
const bSon = bs.find(b=>{
  const partes=[]; (function w(n){ if(n==null)return;
    if(typeof n==='string'){partes.push(n.trim());return;}
    if(Array.isArray(n))return n.forEach(w); if(n.children)w(n.children); })(b);
  return partes.includes('Son');
});
ok('a tarxeta de Sonido é premible', !!bSon);
await act(async()=>{ bSon.props.onClick(); });
ok('e leva a "sonido"', ido==='sonido', ido);
// ── Botonera nova: iconos grandes, sen descrición ────────────────
let r2=null;
await act(async()=>{ r2=TestRenderer.create(marco(<Inicio lang="gl" onIr={()=>{}}/>)); });
let j=r2.toJSON();
const grandes = iconosDe(j).filter(n=>n>=28);
ok(`⚠️ os 11 iconos das áreas van grandes (${grandes.length} a 28px ou máis)`,
   grandes.length>=11, grandes.length);
// ⚠️ Agora veñen ACESAS por defecto: a preferencia gárdase e o valor
// inicial é `true`. O botón `?` segue acendéndoas e apagándoas.
ok('⚠️ as descricións veñen acesas de saída',
   texto(j).includes('Estímulos por categoría,'), texto(j).slice(0,200));
ok('pero os nomes si', texto(j).includes('Xerar') && texto(j).includes('Guía'));

// O botón de axuda amosa e agocha
const bots2=[]; (function w(n){if(!n||typeof n!=='object')return;
  if(Array.isArray(n))return n.forEach(w); if(n.type==='button')bots2.push(n);
  (n.children||[]).forEach(w);})(j);
const bAxuda = bots2.find(b=>(b.props['aria-label']||'').includes('Agochar'));
ok('hai un botón para agochalas', !!bAxuda);
await act(async()=>{ bAxuda.props.onClick(); });
j=r2.toJSON();
ok('⚠️ ao premelo agóchanse', !texto(j).includes('Estímulos por categoría,'));
// ⚠️ E os separadores de cor vanse con elas: sen descrición non separan
// nada e só ocupan sitio.
const raias=[];(function w(n){if(!n||typeof n!=='object')return;
  if(Array.isArray(n))return n.forEach(w);
  const st=n.props&&n.props.style;
  if(st&&st.height===3&&st.width===24)raias.push(n);
  (n.children||[]).forEach(w);})(j);
ok('⚠️ e as raíñas de cor tamén desaparecen', raias.length===0, raias.length);
const bVolver = (()=>{const b=[];(function w(n){if(!n||typeof n!=='object')return;
  if(Array.isArray(n))return n.forEach(w); if(n.type==='button')b.push(n);
  (n.children||[]).forEach(w);})(j); return b.find(x=>(x.props['aria-label']||'').includes('Que fai cada área'));})();
ok('e o botón cambia de etiqueta', !!bVolver);
await act(async()=>{ bVolver.props.onClick(); });
ok('e volven aparecer', texto(r2.toJSON()).includes('Estímulos por categoría,'));

// B24: ningún estilo mestura `border` con `border*Color`
const malos=[];(function w(n){if(!n||typeof n!=='object')return;
  if(Array.isArray(n))return n.forEach(w);
  const st=n.props&&n.props.style;
  if(st&&st.border!==undefined&&['borderColor','borderTopColor','borderLeftColor'].some(k=>st[k]!==undefined))malos.push(n);
  (n.children||[]).forEach(w);})(r2.toJSON());
ok('ningún estilo mestura `border` con `border*Color` (B24)', malos.length===0, malos.length);
await act(async()=>{ r2.unmount(); });

// ── A reixa enche a pantalla ─────────────────────────────────────
// Só as tarxetas de área: o botón de axuda tamén ten `height`, así que
// se filtra polo borderRadius de 16 que só levan elas.
function tarxetas(j){const a=[];(function w(n){if(!n||typeof n!=='object')return;
 if(Array.isArray(n))return n.forEach(w);
 const st=n.props&&n.props.style;
 if(n.type==='button'&&st&&typeof st.height==='number'&&st.borderRadius===16)a.push(n);
 (n.children||[]).forEach(w);})(j);return a;}
// ⚠️ O icono pode ser un <svg> ou un <span> con emoji, segundo o estilo
// activo. A proba non pode depender diso: búscase o ancho, veña de onde
// veña.
function iconosDe(j){const a=[];(function w(n){if(!n||typeof n!=='object')return;
 if(Array.isArray(n))return n.forEach(w);
 const st=n.props&&n.props.style;
 if(n.type==='svg'&&n.props.width) a.push(Number(n.props.width));
 else if(n.type==='span'&&st&&typeof st.width==='number'&&st.fontSize) a.push(st.width);
 (n.children||[]).forEach(w);})(j);return a;}

const RESERVA={movil:150,pc:178};
for (const [w,h,nome,cols] of [[390,844,'iPhone',3],[768,1024,'iPad V',4],
                               [1024,768,'iPad H',5],[1440,900,'Escritorio',5]]) {
  window.innerWidth=w; window.innerHeight=h;
  let rv=null;
  await act(async()=>{ rv=TestRenderer.create(marco(<Inicio lang="gl" onIr={()=>{}}/>)); });
  const j=rv.toJSON();
  const t=tarxetas(j), sv=iconosDe(j).filter(x=>x>=28);
  const filas=Math.ceil(AREAS.length/cols);
  const alto=t[0]?t[0].props.style.height:0;
  const total=alto*filas+(w<560?9:12)*(filas-1)+(w<560?RESERVA.movil:RESERVA.pc);
  ok(`${nome} · as ${AREAS.length} tarxetas teñen alto calculado (${Math.round(alto)}px)`, t.length===AREAS.length, t.length);
  ok(`  e caben na pantalla sen desprazar (${Math.round(total)} de ${h}px)`, total<=h+2, `${Math.round(total)}>${h}`);
  const ic=sv[0]||0;
  ok(`  co icono a ${ic}px`, ic>=28&&ic<=84, ic);
  await act(async()=>{ rv.unmount(); });
}

// ⚠️ A última fila céntrase: con 4 columnas quedan 4+4+3
window.innerWidth=768; window.innerHeight=1024;
let rc=null;
await act(async()=>{ rc=TestRenderer.create(marco(<Inicio lang="gl" onIr={()=>{}}/>)); });
const cen=tarxetas(rc.toJSON()).filter(x=>x.props.style.gridColumn);
ok('⚠️ a última fila incompleta céntrase en vez de quedar á esquerda',
   cen.length===1, cen.map(x=>x.props.style.gridColumn).join(','));
await act(async()=>{ rc.unmount(); });
window.innerWidth=1280; window.innerHeight=900;

console.log(f?`\n${f} FALLOS`:'\n✓ A conexión está ben');
process.exit(f?1:0);
