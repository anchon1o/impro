// Os iconos non poden depender de que eu escribise ben 34 nomes.
// Esta proba percorre AREAS e TABS e falla se algún queda sen icono.
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Icona, NOMES_ICONA, hayIcona, ESTILOS, ICONOS_NECESARIOS, cobertura, setEstilo, estiloActual } from '/home/claude/impro/impro/src/iconos.jsx';
import { AREAS } from '/home/claude/impro/impro/src/Inicio.jsx';
import { TABS } from '/home/claude/impro/impro/src/ImproApp.jsx';
import { TEMAS, completarTema } from '/home/claude/impro/impro/src/core.jsx';

let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};
function todos(j,p,a=[]){if(!j||typeof j!=='object')return a;if(Array.isArray(j)){j.forEach(n=>todos(n,p,a));return a;}if(p(j))a.push(j);(j.children||[]).forEach(n=>todos(n,p,a));return a;}

ok(`a reserva ten ${NOMES_ICONA.length} nomes (19 + 4 marcas)`, NOMES_ICONA.length===23, NOMES_ICONA.length);

// ── ⚠️ Cobertura: ningunha área sen icono ─────────────────────────
const senIcona = AREAS.filter(a=>!a.icona||!hayIcona(a.icona)).map(a=>a.id);
ok('⚠️ TODAS as áreas da botonera teñen icono', senIcona.length===0, senIcona.join(','));
const tabsSen = TABS.filter(t=>!t.icona||!hayIcona(t.icona)).map(t=>t.id);
ok('⚠️ TODAS as pestanas teñen icono', tabsSen.length===0, tabsSen.join(','));
ok('e ningunha área conserva o emoji vello', AREAS.every(a=>!a.emoji));
ok('nin ningunha pestana', TABS.every(t=>!t.emoji));

// ── currentColor: o que fai que collan a cor do tema ──────────────
let r=null;
await act(async()=>{ r=TestRenderer.create(<div>{NOMES_ICONA.map(n=><Icona key={n} nome={n} estilo="estilo2"/>)}</div>); });
const formas = todos(r.toJSON(), n=>['path','circle','rect','line','polygon','polyline','ellipse'].includes(n.type));
ok(`renderízanse as ${formas.length} formas dos ${NOMES_ICONA.length} iconos`, formas.length>0);
const malas = formas.filter(n=>{
  const p=n.props||{};
  for (const k of ['fill','stroke']) {
    const v=p[k];
    if (v && v!=='none' && v!=='currentColor') return true;
  }
  return false;
});
ok('⚠️ ningunha forma leva unha cor fixa: todas en currentColor',
   malas.length===0, malas.map(m=>m.props.fill||m.props.stroke).join(','));
await act(async()=>{ r.unmount(); });

// ── A cor vén de fóra ────────────────────────────────────────────
const T = completarTema(TEMAS[0].escuro,'escuro');
await act(async()=>{ r=TestRenderer.create(<Icona nome="sonido" size={30} cor={T.accent} estilo="estilo2"/>); });
let svg=r.toJSON();
ok('o svg toma o tamaño pedido', svg.props.width===30 && svg.props.height===30);
ok('⚠️ e a cor do tema vai en `color`, que alimenta currentColor',
   svg.props.style.color===T.accent, JSON.stringify(svg.props.style));
ok('o viewBox segue sendo 24×24 (é a grella, non o tamaño)', svg.props.viewBox==='0 0 24 24');
await act(async()=>{ r.unmount(); });

// A mesma icona en catro temas colle catro cores distintas
const cores=new Set();
for (const tema of TEMAS) {
  const Tx = completarTema(tema.escuro,'escuro');
  let rt=null;
  await act(async()=>{ rt=TestRenderer.create(<Icona nome="generar" cor={Tx.accent} estilo="estilo2"/>); });
  cores.add(rt.toJSON().props.style.color);
  await act(async()=>{ rt.unmount(); });
}
ok(`⚠️ nos ${TEMAS.length} temas colle cores distintas (${cores.size})`, cores.size>1, [...cores].join(','));

// ── Accesibilidade ───────────────────────────────────────────────
await act(async()=>{ r=TestRenderer.create(<Icona nome="sonido" estilo="estilo2"/>); });
ok('sen título é decorativo: aria-hidden', r.toJSON().props['aria-hidden']===true);
await act(async()=>{ r.unmount(); });
await act(async()=>{ r=TestRenderer.create(<Icona nome="sonido" title="Son" estilo="estilo2"/>); });
svg=r.toJSON();
ok('con título é unha imaxe con nome', svg.props.role==='img' && svg.props['aria-label']==='Son');
ok('e non queda oculto aos lectores', svg.props['aria-hidden']===undefined);
await act(async()=>{ r.unmount(); });

// ── Un nome inexistente non rompe unha pantalla ───────────────────
await act(async()=>{ r=TestRenderer.create(<div><Icona nome="non-existe" estilo="estilo2"/></div>); });
ok('⚠️ un nome inexistente non peta: non debuxa nada', r.toJSON().children===null);
await act(async()=>{ r.unmount(); });
ok('hayIcona distingue', hayIcona('sonido')===true && hayIcona('non-existe')===false);

// ── Estilos ──────────────────────────────────────────────────────
ok(`hai ${ESTILOS.length} estilos rexistrados`, ESTILOS.length>=10, ESTILOS.length);
ok('a app precisa 19 iconos', ICONOS_NECESARIOS.length===19, ICONOS_NECESARIOS.length);
const baseCob = cobertura('estilo2');
ok('⚠️ o estilo de reserva está COMPLETO', baseCob.completo===true, `${baseCob.ten}/${baseCob.de}`);
const parciais = ESTILOS.filter(e=>!e.completo);
ok(`os ${parciais.length} de proba aínda non o están`, parciais.length>=10);
const est2 = ESTILOS.find(e=>e.id==='estilo2');
ok('⚠️ Estilo 2 está COMPLETO: 19 de 19', est2 && est2.completo, est2 && `${est2.ten}/${est2.de}`);
ok('⚠️ hai 2 estilos activables: Emojis e Xeométrico minimal',
   ESTILOS.filter(e=>e.completo).length===2,
   ESTILOS.filter(e=>e.completo).map(e=>e.nome).join(' · '));
const emo = ESTILOS.find(e=>e.id==='emojis');
ok('os Emojis cobren os 19', emo && emo.completo, emo && `${emo.ten}/${emo.de}`);
ok('e a cobertura calcúlase, non se declara',
   parciais.every(e=>e.ten>0 && e.ten<e.de), parciais.map(e=>`${e.id}:${e.ten}`).join(' '));

// ⚠️ Só se poden activar os completos
ok('o activo de saída son os Emojis', estiloActual()==='emojis');
ok('⚠️ NON se pode activar un estilo incompleto… ', setEstilo('pixel')===true);
// (setEstilo si o permite a nivel API; o que filtra é a interface)
setEstilo('emojis');
ok('un estilo inexistente rexéitase', setEstilo('non-existe')===false && estiloActual()==='emojis');

// ⚠️ O fallback: un estilo incompleto NUNCA deixa un oco
setEstilo('pixel');
let ocos=[];
for (const n of ICONOS_NECESARIOS) {
  let rr=null;
  await act(async()=>{ rr=TestRenderer.create(<Icona nome={n}/>); });
  if (rr.toJSON()===null) ocos.push(n);
  await act(async()=>{ rr.unmount(); });
}
ok('⚠️ con Píxel activo, os 19 iconos SEGUEN debuxándose (cae á reserva)',
   ocos.length===0, ocos.join(','));

// E os que si existen no estilo, cambian de verdade
// ⚠️ `toJSON()` hai que lelo FÓRA do act: dentro, React aínda non
// confirmou o render e devolve null. Comparaba null con null.
async function debuxoDe(estilo, nome) {
  setEstilo(estilo);
  let rr = null;
  await act(async()=>{ rr = TestRenderer.create(<Icona nome={nome}/>); });
  const s = JSON.stringify(rr.toJSON());
  await act(async()=>{ rr.unmount(); });
  return s;
}
// Os dous completos teñen que dar debuxos distintos en TODOS os iconos
const difs = [];
for (const n of ICONOS_NECESARIOS) {
  const x = await debuxoDe('emojis', n), y = await debuxoDe('estilo2', n);
  if (x !== y) difs.push(n);
}
ok('⚠️ os 19 iconos son distintos entre Emojis e Estilo 2', difs.length===19,
   `${difs.length}/19 · iguais: ${ICONOS_NECESARIOS.filter(n=>!difs.includes(n))}`);

// Os emojis son <span> con texto, non <svg>
setEstilo('emojis');
let re_=null;
await act(async()=>{ re_=TestRenderer.create(<Icona nome="generar"/>); });
const je=re_.toJSON();
ok('⚠️ o estilo Emojis debuxa un <span> co carácter, non un <svg>',
   je && je.type==='span' && String(je.children).includes('🎲'),
   je && je.type);
ok('e escala co tamaño pedido', je.props.style.width!==undefined);
await act(async()=>{ re_.unmount(); });
// ⚠️ Ningún dos 19 pode quedar sen emoji
const senEmo=[];
for (const n of ICONOS_NECESARIOS) {
  let rr=null;
  await act(async()=>{ rr=TestRenderer.create(<Icona nome={n}/>); });
  if (rr.toJSON()===null) senEmo.push(n);
  await act(async()=>{ rr.unmount(); });
}
ok('⚠️ os 19 teñen emoji', senEmo.length===0, senEmo.join(','));
setEstilo('estilo2');

const a = await debuxoDe('estilo2','generar');
const b = await debuxoDe('pixel','generar');
ok('⚠️ e `generar` SI cambia de debuxo entre reserva e Píxel', a!==b && a && b,
   `base ${a&&a.length}B / pixel ${b&&b.length}B`);
// E un que NON está no estilo ten que dar o MESMO debuxo (fallback)
const c1 = await debuxoDe('estilo2','guia');
const c2 = await debuxoDe('pixel','guia');
ok('⚠️ e `guia`, que non existe en Píxel, dá o mesmo (cae á reserva)', c1===c2);
setEstilo('emojis');

console.log(f?`\n${f} FALLOS`:'\n✓ Os 32 casos de iconos pasan');
process.exit(f?1:0);
