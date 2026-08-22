import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { EditorEscaleta } from '/home/claude/impro/impro/src/tabs/EditorEscaleta.jsx';
import { ThemeCtx, AuthCtx, LangCtx, TEMAS, completarTema } from '/home/claude/impro/impro/src/core.jsx';
import { escenario } from './supabase_stub_son.js';

let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};
const T = completarTema(TEMAS[0].escuro,'escuro');
function texto(j){const o=[];(function w(n){if(n==null)return;if(typeof n==='string'||typeof n==='number'){o.push(String(n));return;}if(Array.isArray(n))return n.forEach(w);if(n.children)w(n.children);})(j);return o.join(' ').replace(/\s+/g,' ');}
function todos(j,p,a=[]){if(!j||typeof j!=='object')return a;if(Array.isArray(j)){j.forEach(n=>todos(n,p,a));return a;}if(p(j))a.push(j);(j.children||[]).forEach(n=>todos(n,p,a));return a;}
const bots=j=>todos(j,n=>n.type==='button');
const porEt=(j,t)=>bots(j).find(b=>(b.props['aria-label']||'')===t);
const cadro=()=>act(async()=>{await new Promise(r=>setTimeout(r,40));});

const TIPOS=[{id:'calentamiento',nome:'Quecemento',emoji:'🔥',activo:true,orde:10},
             {id:'juego',nome:'Xogo',emoji:'🎲',activo:true,orde:20}];
const DINS=[{id:'d1',nombre:'Círculo de nomes',tipo:'calentamiento',duracion:8,descripcion:'',pasos:[]},
            {id:'d2',nombre:'Estatuas',tipo:'juego',duracion:5,descripcion:'',pasos:[]},
            {id:'d3',nombre:'Freeze',tipo:'juego',duracion:12,descripcion:'',pasos:[]}];

function marco(ch){return (
  <ThemeCtx.Provider value={{T,dark:true,toggle(){},tema:TEMAS[0],setTema(){},setDark(){}}}>
    <AuthCtx.Provider value={{perfil:null,logueado:false,esAdmin:false,session:null,pedirLogin(){},migrando:false}}>
      <LangCtx.Provider value={{lang:'gl',setLang(){}}}>{ch}</LangCtx.Provider>
    </AuthCtx.Provider></ThemeCtx.Provider>);}

escenario.set({dinamicas_tipos:TIPOS, dinamicas:DINS});
localStorage.clear();
let r=null;
await act(async()=>{ r=TestRenderer.create(marco(<EditorEscaleta/>)); });
await cadro();
let t=texto(r.toJSON());
ok('sen escaletas explica que é unha', t.includes('Aínda non hai escaletas') && t.includes('bloques por tipo'));
ok('e ofrece crear unha', !!bots(r.toJSON()).find(b=>texto(b).includes('Nova escaleta')));
ok('avisa de que sen conta quedan no dispositivo', t.includes('neste dispositivo'));

await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Nova escaleta')).props.onClick(); });
await cadro();
t=texto(r.toJSON());
ok('ábrese o editor', t.includes('Gardar') && t.includes('Engadir bloque'));
ok('⚠️ hai campo de notas para data e lugar',
   !!todos(r.toJSON(),n=>n.type==='input'&&n.props['aria-label']==='Notas'));
ok('e selector de tipo de escaleta',
   !!todos(r.toJSON(),n=>n.type==='select'&&n.props['aria-label']==='Tipo de escaleta'));
ok('marca que está sen gardar', t.includes('Sen gardar'));

// Engadir un bloque
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Engadir bloque')).props.onClick(); });
await cadro();
const selTipo=todos(r.toJSON(),n=>n.type==='select'&&/Tipo do bloque/.test(n.props['aria-label']||''))[0];
ok('o bloque ten selector de tipo REAL de dinámica', !!selTipo);
ok('⚠️ e as opcións son os tipos da base, non etiquetas soltas',
   texto(r.toJSON()).includes('Quecemento') && texto(r.toJSON()).includes('Xogo'));

// Escoller dinámicas: só as do tipo do bloque
await act(async()=>{ selTipo.props.onChange({target:{value:'juego'}}); });
await cadro();
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Engadir dinámica')).props.onClick(); });
await cadro();
t=texto(r.toJSON());
ok('⚠️ só ofrece dinámicas DESE tipo', t.includes('Estatuas') && t.includes('Freeze'));
ok('⚠️ e NON as doutros tipos', !t.includes('Círculo de nomes'), t.slice(0,400));

await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Estatuas')).props.onClick(); });
await cadro();
t=texto(r.toJSON());
ok('engádese a dinámica ao bloque', t.includes('Estatuas'));
ok('⚠️ e o total colle a súa duración', t.includes('5 min'), t.slice(0,300));

// Un segundo item suma
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Freeze')).props.onClick(); });
await cadro();
ok('⚠️ dous itens suman 17 min', texto(r.toJSON()).includes('17 min'), texto(r.toJSON()).slice(0,300));
ok('e dise cantas dinámicas hai', texto(r.toJSON()).includes('2 dinámicas'));

// Reordenar e quitar
ok('cada item ten subir, baixar e quitar',
   !!porEt(r.toJSON(),'Subir') && !!porEt(r.toJSON(),'Quitar Estatuas'));
await act(async()=>{ porEt(r.toJSON(),'Quitar Estatuas').props.onClick(); });
await cadro();
ok('quitar un item recalcula o total', texto(r.toJSON()).includes('12 min'));

// Gardar e volver
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Gardar')).props.onClick(); });
await cadro();
ok('ao gardar desaparece o aviso de sen gardar', !texto(r.toJSON()).includes('Sen gardar'));
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Escaletas')).props.onClick(); });
await cadro();
t=texto(r.toJSON());
ok('⚠️ a escaleta aparece na lista', t.includes('Escaleta nova'));
ok('  co seu resumo', t.includes('12 min') && t.includes('1 dinámicas'));
await act(async()=>{ r.unmount(); });

// Persiste ao recargar
await act(async()=>{ r=TestRenderer.create(marco(<EditorEscaleta/>)); });
await cadro();
ok('⚠️ e sobrevive a recargar', texto(r.toJSON()).includes('Escaleta nova'));
await act(async()=>{ r.unmount(); });

// Sen Guía cargada
escenario.set({dinamicas_tipos:TIPOS, dinamicas:[]});
localStorage.clear();
await act(async()=>{ r=TestRenderer.create(marco(<EditorEscaleta/>)); });
await cadro();
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Nova escaleta')).props.onClick(); });
await cadro();
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Engadir bloque')).props.onClick(); });
await cadro();
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Engadir dinámica')).props.onClick(); });
await cadro();
ok('⚠️ sen Guía dío en vez de amosar unha lista baleira muda',
   texto(r.toJSON()).includes('non cargou'), texto(r.toJSON()).slice(0,300));
await act(async()=>{ r.unmount(); });

console.log(f?`\n${f} FALLOS`:'\n✓ Os 22 casos do editor pasan');
process.exit(f?1:0);
