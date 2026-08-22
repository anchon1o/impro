import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AdminSonidos } from '/home/claude/impro/impro/src/sonido/AdminSonidos.jsx';
import { analizarPegado, nomeDesdeUrl } from '/home/claude/impro/impro/src/sonido/recursos.js';
import { ThemeCtx, AuthCtx, TEMAS, completarTema, mkS } from '/home/claude/impro/impro/src/core.jsx';
import { escenario } from './supabase_stub_son.js';

let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};
const T = completarTema(TEMAS[0].escuro,'escuro'); const S = mkS(T);
function texto(j){const o=[];(function w(n){if(n==null)return;if(typeof n==='string'||typeof n==='number'){o.push(String(n));return;}if(Array.isArray(n))return n.forEach(w);if(n.children)w(n.children);})(j);return o.join(' ').replace(/\s+/g,' ');}
function todos(j,p,a=[]){if(!j||typeof j!=='object')return a;if(Array.isArray(j)){j.forEach(n=>todos(n,p,a));return a;}if(p(j))a.push(j);(j.children||[]).forEach(n=>todos(n,p,a));return a;}
const bots=j=>todos(j,n=>n.type==='button');
const cadro=()=>act(async()=>{await new Promise(r=>setTimeout(r,30));});

// ── analizarPegado ────────────────────────────────────────────────
const COLS=['nome','url','tipo','emoji','licenza','autoria','fonte'];
let p = analizarPegado("Porta\thttps://x/p.wav\tefecto\t🚪\tCC0\tAna\tfreesound", COLS);
ok('unha fila con tabuladores', p.length===1 && p[0].nome==='Porta' && p[0].tipo==='efecto' && p[0].emoji==='🚪');
p = analizarPegado("Porta;https://x/p.wav;efecto", COLS);
ok('tamén con punto e coma', p.length===1 && p[0].url==='https://x/p.wav');
p = analizarPegado("A\thttps://x/a.wav\nB\thttps://x/b.wav\r\nC\thttps://x/c.wav", COLS);
ok('varias liñas, con \\n e \\r\\n', p.length===3 && p[2].nome==='C');
p = analizarPegado("  \n\nPorta\thttps://x/p.wav\n  \n", COLS);
ok('ignora liñas baleiras', p.length===1);

// ⚠️ As comas non poden separar: os nomes lévanas dentro.
p = analizarPegado("Porta pesada, de taberna\thttps://x/p.wav", COLS);
ok('⚠️ un nome con comas NON se parte', p[0].nome==='Porta pesada, de taberna', p[0].nome);

// Lista de URLs soa
p = analizarPegado("https://x/porta_pesada.wav\nhttps://x/trono-forte.mp3", COLS);
ok('unha lista de URLs soa recoñécese', p.length===2 && p[0].url==='https://x/porta_pesada.wav');
ok('e sácalles o nome do ficheiro', p[0].nome==='Porta pesada' && p[1].nome==='Trono forte',
   p.map(x=>x.nome).join('/'));
ok('nomeDesdeUrl limpa extensión e guións', nomeDesdeUrl('https://a.b/c/meu_son-final.mp3')==='Meu son final');
ok('e aguanta unha URL inválida', nomeDesdeUrl('non é unha url')==='Sen nome');

// ── Compoñente ────────────────────────────────────────────────────
function marco(ch){return (
  <ThemeCtx.Provider value={{T,dark:true,toggle(){},tema:TEMAS[0],setTema(){},setDark(){}}}>
    <AuthCtx.Provider value={{perfil:{id:'u1',rol:'admin'},logueado:true,esAdmin:true,session:{},pedirLogin(){},migrando:false}}>
      {ch}
    </AuthCtx.Provider>
  </ThemeCtx.Provider>);}

escenario.set({son_recursos:[]});
let r=null;
await act(async()=>{ r=TestRenderer.create(marco(<AdminSonidos T={T} S={S}/>)); });
await cadro();
let t=texto(r.toJSON());
ok('sen sons dío en vez de amosar unha táboa baleira', t.includes('Sen sons na base de datos'));
ok('ofrece pegar dunha folla', !!bots(r.toJSON()).find(b=>texto(b).includes('Pegar')));

// Engadir fila
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Fila')).props.onClick(); });
await cadro();
ok('engádese unha fila baleira', todos(r.toJSON(),n=>n.type==='tr').length===2);
ok('e márcase como incompleta', texto(r.toJSON()).includes('1 sen completar'));

// Pegar
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Pegar')).props.onClick(); });
await cadro();
const ta = todos(r.toJSON(),n=>n.type==='textarea')[0];
ok('aparece a área de pegado', !!ta);
await act(async()=>{ ta.props.onChange({target:{value:"Porta\thttps://x/p.wav\tefecto\nChoiva\thttps://x/c.mp3\tambiente"}}); });
await cadro();
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b)==='Engadir filas').props.onClick(); });
await cadro();
t=texto(r.toJSON());
ok('péganse as dúas filas', t.includes('2 filas engadidas'));
// A fila baleira que engadín antes segue incompleta, e debe seguir:
// as pegadas si están completas, así que pasa de 1 a 1 e non a 3.
ok('as filas pegadas non contan como incompletas', t.includes('1 sen completar'), t.slice(0,200));
ok('o botón de gardar conta os cambios', !!bots(r.toJSON()).find(b=>/Gardar \(\d+\)/.test(texto(b))));

// Gardar con erro do servidor
escenario.set({erro:'permission denied for table son_recursos'});
await act(async()=>{ bots(r.toJSON()).find(b=>texto(b).includes('Gardar (')).props.onClick(); });
await act(async()=>{ await new Promise(x=>setTimeout(x,60)); });
t=texto(r.toJSON());
ok('⚠️ un erro do servidor amósase fila a fila, non se traga', t.includes('permission denied'), t.slice(0,300));
ok('e dise cantas fallaron', t.includes('con erro'));
await act(async()=>{ r.unmount(); });

console.log(f?`\n${f} FALLOS`:'\n✓ Os 18 casos da táboa de sons pasan');
process.exit(f?1:0);
