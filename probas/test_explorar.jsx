import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Explorar } from '/home/claude/impro/impro/src/sonido/Explorar.jsx';
import { explorar, duplicarRecurso, gardarNaBiblioteca, denunciar } from '/home/claude/impro/impro/src/sonido/recursos.js';
import { ThemeCtx, AuthCtx, TEMAS, completarTema } from '/home/claude/impro/impro/src/core.jsx';
import { escenario } from './supabase_stub_son.js';

let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};
const T = completarTema(TEMAS[0].escuro,'escuro');
function texto(j){const o=[];(function w(n){if(n==null)return;if(typeof n==='string'||typeof n==='number'){o.push(String(n));return;}if(Array.isArray(n))return n.forEach(w);if(n.children)w(n.children);})(j);return o.join(' ').replace(/\s+/g,' ');}
function todos(j,p,a=[]){if(!j||typeof j!=='object')return a;if(Array.isArray(j)){j.forEach(n=>todos(n,p,a));return a;}if(p(j))a.push(j);(j.children||[]).forEach(n=>todos(n,p,a));return a;}
const bots=j=>todos(j,n=>n.type==='button');
const porEt=(j,t)=>bots(j).find(b=>(b.props['aria-label']||'')===t);
const esperar=(ms=420)=>act(async()=>{await new Promise(r=>setTimeout(r,ms));});

const SONS=[
 {id:'r1',tipo:'efecto',nome:'Porta de taberna',url:'u1',emoji:'🚪',licenza:'CC0',autoria:'Ana',estado:'publicada',visibilidade:'publico',gardados:5,vol_defecto:0.8},
 {id:'r2',tipo:'ambiente',nome:'Tormenta',url:'u2',emoji:'⛈',licenza:'CC-BY',estado:'publicada',visibilidade:'publico',gardados:2,vol_defecto:0.35},
];
const TAGS=[
 {id:'fun-entrada',categoria:'funcion',nome:'Entrada de personaxe',oficial:true,orde:10},
 {id:'fun-final',categoria:'funcion',nome:'Final',oficial:true,orde:30},
 {id:'tono-terror',categoria:'tono',nome:'Terror',oficial:true,orde:20},
];

function marco(ch, logueado=true){return (
  <ThemeCtx.Provider value={{T,dark:true,toggle(){},tema:TEMAS[0],setTema(){},setDark(){}}}>
    <AuthCtx.Provider value={{perfil:logueado?{id:'u1',rol:'user'}:null,logueado,esAdmin:false,session:logueado?{}:null,pedirLogin(){},migrando:false}}>
      {ch}
    </AuthCtx.Provider>
  </ThemeCtx.Provider>);}

// ── explorar(): só publicado ─────────────────────────────────────
escenario.set({son_recursos:SONS});
localStorage.clear();
let e = await explorar({});
ok('explorar devolve o publicado', e.length===2);

escenario.set({son_recursos:[],son_recursos_tags:[]});
e = await explorar({});
ok('sen resultados o motivo é "baleira", non erro', e.motivo==='baleira' && e.erro===null);
escenario.set({erro:'Failed to fetch'});
e = await explorar({});
ok('sen rede dío e non peta', e.motivo==='sen-conexion' && e.length===0);

// ── Interface ────────────────────────────────────────────────────
escenario.set({son_recursos:SONS,son_tags:TAGS,son_recursos_tags:[]});
localStorage.clear();
let probado=null, volto=false, r=null;
await act(async()=>{ r=TestRenderer.create(marco(
  <Explorar onProbar={x=>{probado=x;}} onVolver={()=>{volto=true;}}/>)); });
await esperar();
let t=texto(r.toJSON());
ok('lista os sons públicos', t.includes('Porta de taberna') && t.includes('Tormenta'));
ok('amosa a licenza e a autoría', t.includes('CC0') && t.includes('Ana'));
ok('e cantos o gardaron', t.includes('5 gardados'));
ok('a categoría de función escénica vai aberta de saída',
   t.includes('Entrada de personaxe'), t.slice(0,300));

// Probar sen conta é posible
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Probar')).props.onClick(); });
ok('probar devolve o recurso', probado && probado.id==='r1');
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Mesa')).props.onClick(); });
ok('o botón de volver funciona', volto===true);

// Gardar e duplicar (con conta)
ok('con conta hai gardar e duplicar',
   !!porEt(r.toJSON(),'Gardar Porta de taberna') && !!porEt(r.toJSON(),'Duplicar Porta de taberna'));

// Denunciar
await act(async()=>{ porEt(r.toJSON(),'Denunciar Porta de taberna').props.onClick(); });
await act(async()=>{await new Promise(x=>setTimeout(x,30));});
t=texto(r.toJSON());
ok('ofrece motivos de denuncia', t.includes('Problema de dereitos') && t.includes('enlace roto'));
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b)==='Problema de dereitos').props.onClick(); });
await act(async()=>{await new Promise(x=>setTimeout(x,40));});
ok('e agradece ao enviala', texto(r.toJSON()).includes('Grazas'));
await act(async()=>{ r.unmount(); });

// ── ⚠️ Sen conta: ver e probar SI, gardar NON ────────────────────
await act(async()=>{ r=TestRenderer.create(marco(<Explorar onProbar={()=>{}}/>, false)); });
await esperar();
t=texto(r.toJSON());
ok('⚠️ sen conta VESE o catálogo', t.includes('Porta de taberna'));
ok('⚠️ e pódese probar', !!bots(r.toJSON()).find(b=>texto(b).includes('Probar')));
ok('pero non gardar nin duplicar',
   !porEt(r.toJSON(),'Gardar Porta de taberna') && !porEt(r.toJSON(),'Duplicar Porta de taberna'));
ok('e si denunciar: quen ve un problema de dereitos adoita ser de fóra',
   !!porEt(r.toJSON(),'Denunciar Porta de taberna'));
await act(async()=>{ r.unmount(); });

// ── Duplicar nace privado ────────────────────────────────────────
escenario.set({son_recursos:SONS,son_recursos_tags:[]});
const d = await duplicarRecurso({id:'r1',nome:'Porta',tipo:'efecto',orixe:'propio',url:'u1',
  visibilidade:'publico',estado:'publicada',vol:0.8,modo:'once'}, 'u2');
ok('duplicar devolve ok', d.ok===true, d.erro);
ok('⚠️ a copia nace PRIVADA e en borrador',
   d.recurso.visibilidade==='privado' && d.recurso.estado==='borrador');
ok('e leva "(copia)" no nome', d.recurso.nome.includes('(copia)'));
ok('sen conta non se pode duplicar', (await duplicarRecurso({nome:'x'}, null)).ok===false);
ok('sen conta non se pode gardar', (await gardarNaBiblioteca(null,{recursoId:'r1'})).ok===false);

// Gardar dúas veces non é un erro que vexa o usuario
escenario.set({erro:'duplicate key value violates unique constraint'});
const g = await gardarNaBiblioteca('u1',{recursoId:'r1'});
ok('⚠️ gardar algo xa gardado non é erro', g.ok===true && g.xaEstaba===true);

// Denunciar sen conta
escenario.set({son_denuncias:[]});
ok('pódese denunciar sen conta', (await denunciar({recursoId:'r1',motivo:'dereitos'})).ok===true);

console.log(f?`\n${f} FALLOS`:'\n✓ Os 22 casos de Explorar pasan');
process.exit(f?1:0);
