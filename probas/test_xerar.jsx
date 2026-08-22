import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TabGenerar } from '/home/claude/impro/impro/src/tabs/TabGenerar.jsx';
import { ThemeCtx, AuthCtx, LangCtx, EstimulosProvider, TEMAS, completarTema } from '/home/claude/impro/impro/src/core.jsx';
import { escenario } from './supabase_stub_son.js';
let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};
const T=completarTema(TEMAS[0].escuro,'escuro');
function todos(j,p,a=[]){if(!j||typeof j!=='object')return a;if(Array.isArray(j)){j.forEach(n=>todos(n,p,a));return a;}if(p(j))a.push(j);(j.children||[]).forEach(n=>todos(n,p,a));return a;}
const cadro=()=>act(async()=>{await new Promise(r=>setTimeout(r,30));});

function marco(ch){return (
  <ThemeCtx.Provider value={{T,dark:true,toggle(){},tema:TEMAS[0],setTema(){},setDark(){}}}>
    <AuthCtx.Provider value={{perfil:null,logueado:false,esAdmin:false,session:null,pedirLogin(){},migrando:false}}>
      <LangCtx.Provider value={{lang:'gl',setLang(){}}}>
        <EstimulosProvider lang="gl">{ch}</EstimulosProvider>
      </LangCtx.Provider></AuthCtx.Provider></ThemeCtx.Provider>);}

// Tarxetas de categoría: as que teñen alto calculado e borderRadius 14
const cats=j=>todos(j,n=>{const st=n.props&&n.props.style;
  return n.type==='button'&&st&&typeof st.height==='number'&&st.borderRadius===14;});

for (const [w,h,nome,cols] of [[390,844,'iPhone',3],[768,1024,'iPad V',4],[1024,768,'iPad H',5],[1440,900,'Escritorio',5]]) {
  window.innerWidth=w; window.innerHeight=h;
  let r=null;
  await act(async()=>{ r=TestRenderer.create(marco(<TabGenerar onStimulus={()=>{}}/>)); });
  await cadro();
  const c=cats(r.toJSON());
  ok(`${nome}: as categorías teñen alto calculado`, c.length>0, c.length);
  if (c.length) {
    const alto=c[0].props.style.height;
    const filas=Math.ceil(c.length/cols);
    const total=alto*filas+(w<560?7:10)*(filas-1)+(w<560?210:250);
    ok(`  ${c.length} categorías en ${filas} filas de ${Math.round(alto)}px`, alto>=76);
    ok(`  e caben sen desprazar (${Math.round(total)} de ${h}px)`, total<=h+2, `${Math.round(total)}>${h}`);
  }
  await act(async()=>{ r.unmount(); });
}

// ⚠️ Nunha pantalla moi baixa non pode encoller ata ser inusable
window.innerWidth=1024; window.innerHeight=380;
let r=null;
await act(async()=>{ r=TestRenderer.create(marco(<TabGenerar onStimulus={()=>{}}/>)); });
await cadro();
const c=cats(r.toJSON());
ok('⚠️ nunha pantalla moi baixa respéctase un mínimo tocable',
   c.length===0||c[0].props.style.height>=76, c.length&&c[0].props.style.height);
await act(async()=>{ r.unmount(); });

// ⚠️ innerHeight undefined non pode dar NaN
window.innerWidth=1024; delete window.innerHeight;
await act(async()=>{ r=TestRenderer.create(marco(<TabGenerar onStimulus={()=>{}}/>)); });
await cadro();
const c2=cats(r.toJSON());
ok('⚠️ sen innerHeight non dá NaN', c2.length===0||Number.isFinite(c2[0].props.style.height),
   c2.length&&c2[0].props.style.height);
await act(async()=>{ r.unmount(); });
window.innerHeight=800;

// ── R10a · Reto como modo dentro de Xerar ────────────────────────
// ⚠️ O que se comproba aquí non é que o panel se pinte: é que Reto
// deixou de ter estado propio. O nivel e a lista de estímulos teñen
// que vir de Xerar, ou volvemos ter dúas portas que discrepan (B16).
window.innerWidth=1024; window.innerHeight=768;
escenario.set({dinamicas:[
  {id:'d1',nombre:'Zip Zap Zop',tipo:'calentamiento',duracion:10,descripcion:'Círculo de enerxía',pasos:['En círculo','Pasar o impulso']},
]});

const botons=j=>todos(j,n=>n.type==='button');
const texto=j=>{const o=[];(function w(n){if(n==null)return;
  if(typeof n==='string'||typeof n==='number'){o.push(String(n));return;}
  if(Array.isArray(n))return n.forEach(w); if(n.children)w(n.children);})(j);return o.join(' ');};
const premible=(j,etiqueta)=>botons(j).find(b=>{
  const partes=[];(function w(n){if(n==null)return;
    if(typeof n==='string'){partes.push(n.trim());return;}
    if(Array.isArray(n))return n.forEach(w); if(n.children)w(n.children);})(b);
  return partes.some(x=>x.includes(etiqueta));});

let rr=null;
await act(async()=>{ rr=TestRenderer.create(marco(<TabGenerar onStimulus={()=>{}}/>)); });
await cadro();

const bReto=premible(rr.toJSON(),'Reto');
ok('⚠️ hai un modo ⚡ Reto dentro de Xerar', !!bReto);
ok('e non se pinta ata premelo', !texto(rr.toJSON()).includes('Xerador de retos'));

await act(async()=>{ bReto.props.onClick(); });
await cadro();
let j=rr.toJSON();
ok('ao premelo aparece o xerador de retos', texto(j).includes('Xerador de retos'));
ok('e a reixa de categorías desaparece', cats(j).length===0, cats(j).length);

// ⚠️ Un só selector Simple/Plus en pantalla. Reto tiña o seu propio e
// era o duplicado máis visible dos dous modos.
const simples=botons(j).filter(b=>texto(b).includes('Simple'));
ok('⚠️ só queda UN selector Simple/Plus (Reto xa non ten o seu)',
   simples.length===1, simples.length);

// O nivel de Xerar chega ao modo Reto
const bPlus=premible(j,'Plus');
await act(async()=>{ bPlus.props.onClick(); });
await cadro();
ok('⚠️ e o nivel de Xerar chega a Reto', texto(rr.toJSON()).includes('Plus'));

// Xerar un reto de verdade coa dinámica do escenario
const bXerar=premible(rr.toJSON(),'Xerar reto');
ok('o botón de xerar está activo cando hai catálogo',
   !!bXerar && !bXerar.props.disabled, bXerar&&bXerar.props.disabled);
await act(async()=>{ bXerar.props.onClick(); });
await cadro();
const tx=texto(rr.toJSON());
ok('sae a dinámica sorteada', tx.includes('Zip Zap Zop'));
ok('e o resumo do reto', tx.includes('O reto'));

// Volver a Categorías non perde a reixa
const bCats=premible(rr.toJSON(),'Categ.');
await act(async()=>{ bCats.props.onClick(); });
await cadro();
ok('e volver a Categorías recupera a reixa', cats(rr.toJSON()).length>0);
await act(async()=>{ rr.unmount(); });

console.log(f?`\n${f} FALLOS`:'\n✓ Os casos de Xerar pasan');
process.exit(f?1:0);
