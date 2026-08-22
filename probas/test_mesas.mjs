// Mesas: gardar, resolver e sobrevivir a datos raros.
import * as M from '/home/claude/impro/impro/src/sonido/mesas.js';
import { crearContador, segundos } from '/home/claude/impro/impro/src/sonido/contadores.js';

let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};

const R = [
  {id:'e1',tipo:'efecto',nome:'Porta',url:'u1',vol:0.8},
  {id:'e2',tipo:'efecto',nome:'Trono',url:'u2',vol:1},
  {id:'a1',tipo:'ambiente',nome:'Choiva',url:'u3',vol:0.35},
  {id:'m1',tipo:'musica',nome:'Jazz',url:'u4',vol:0.7},
];

// ── Sen conta ─────────────────────────────────────────────────────
let r = await M.cargarMesas(null);
ok('sen mesas gardadas devolve lista baleira', r.mesas.length===0);

const nova = M.mesaBaleira('Impro habitual');
ok('unha mesa nova nace local', nova.local===true && nova.recursoIds.length===0);
nova.recursoIds = ['e1','a1','m1'];
nova.volRecurso = {a1:0.25};
nova.volBus = {musica:0.5,ambientes:0.9,efectos:0.8,master:0.8};
nova.contadores = [crearContador({tipo:'crono',etiqueta:'Show'})];

let g = await M.gardarMesaNomeada(nova, null);
ok('gárdase sen conta', g.ok===true, g.erro);
r = await M.cargarMesas(null);
ok('e recupérase', r.mesas.length===1 && r.mesas[0].nome==='Impro habitual');
ok('cos seus sons', r.mesas[0].recursoIds.join(',')==='e1,a1,m1');
ok('cos seus volumes', r.mesas[0].volRecurso.a1===0.25 && r.mesas[0].volBus.musica===0.5);
ok('e cos seus contadores', r.mesas[0].contadores.length===1);

ok('rexeita unha mesa sen nome',
  (await M.gardarMesaNomeada({...nova,nome:'   '}, null)).ok===false);

// Editar non duplica
const editada = {...r.mesas[0], nome:'Impro'};
await M.gardarMesaNomeada(editada, null);
r = await M.cargarMesas(null);
ok('editar non duplica', r.mesas.length===1 && r.mesas[0].nome==='Impro');

// Varias mesas
const t2 = M.mesaBaleira('Teatro'); t2.recursoIds=['e2'];
await M.gardarMesaNomeada(t2, null);
r = await M.cargarMesas(null);
ok('conviven varias mesas', r.mesas.length===2);

// ── ⚠️ Resolver: unha mesa cun son borrado ────────────────────────
let res = M.resolverMesa(r.mesas.find(m=>m.nome==='Impro'), R);
ok('resolve os sons da mesa', res.recursos.length===3, res.recursos.length);
ok('e só eses: a mesa filtra o catálogo',
  !res.recursos.find(x=>x.id==='e2'));
ok('aplica o volume gardado por riba do do recurso',
  res.recursos.find(x=>x.id==='a1').vol===0.25);
ok('sen faltas cando están todos', res.faltan.length===0);

const parcial = R.filter(x=>x.id!=='a1');   // borrouse Choiva do dispositivo
res = M.resolverMesa(r.mesas.find(m=>m.nome==='Impro'), parcial);
ok('⚠️ unha mesa cun son borrado NON peta', res.recursos.length===2, res.recursos.length);
ok('e dí cal falta, para poder avisar', res.faltan.join(',')==='a1', res.faltan.join(','));

ok('sen mesa seleccionada devolve todo o catálogo',
  M.resolverMesa(null, R).recursos.length===4);

// ── Borrar ────────────────────────────────────────────────────────
M.borrarMesaLocal(r.mesas.find(m=>m.nome==='Teatro').id);
r = await M.cargarMesas(null);
ok('borrar quita a mesa', r.mesas.length===1 && r.mesas[0].nome==='Impro');

// ── Datos corruptos ───────────────────────────────────────────────
localStorage.setItem('impro_sonido_mesas_v1','{roto');
r = await M.cargarMesas(null);
ok('JSON corrupto non impide abrir', r.mesas.length===0);

localStorage.setItem('impro_sonido_mesas_v1', JSON.stringify([
  null, 5, {sennome:1},
  {id:'x', nome:'  ', recursoIds:['ok',null,7,''], volRecurso:{a:null,b:0.5,c:[]},
   volBus:{master:null,musica:9}, contadores:[{tipo:'inventado'}]},
]));
r = await M.cargarMesas(null);
ok('descarta as entradas inválidas', r.mesas.length===1, r.mesas.length);
const m = r.mesas[0];
ok('unha mesa sen nome recibe un', m.nome==='Sen nome');
ok('limpa os ids de recurso non válidos', m.recursoIds.join(',')==='ok', m.recursoIds.join(','));
ok('⚠️ master=null cae a 0.8, non a silencio', m.volBus.master===0.8, m.volBus.master);
ok('e recorta o que se pasa', m.volBus.musica===1);
ok('descarta volumes de recurso non numéricos',
  m.volRecurso.b===0.5 && m.volRecurso.a===undefined && m.volRecurso.c===undefined);
ok('e contadores inválidos', m.contadores.length===0);

ok('migrables() lista as locais', M.migrables().length===1);

// ── Grupos ───────────────────────────────────────────────────────
ok('unha mesa nova nace persoal', M.mesaBaleira('X').grupoId===null);
const p1={...M.mesaBaleira('Persoal'),grupoId:null};
const g1={...M.mesaBaleira('Do grupo'),grupoId:'gA'};
const g2={...M.mesaBaleira('Doutro'),grupoId:'gB'};
ok('sen grupo activo vense todas', M.filtrarPorGrupo([p1,g1,g2],null).length===3);
ok('⚠️ cun grupo vense as súas E as persoais',
   M.filtrarPorGrupo([p1,g1,g2],'gA').map(x=>x.nome).join(',')==='Persoal,Do grupo');
ok('⚠️ e nunca as doutro grupo', !M.filtrarPorGrupo([p1,g1,g2],'gA').some(x=>x.grupoId==='gB'));
ok('cunha lista baleira non peta', M.filtrarPorGrupo([],'gA').length===0);

localStorage.clear();
await M.gardarMesaNomeada(g1, null);
const v = (await M.cargarMesas(null)).mesas[0];
ok('⚠️ o grupo sobrevive a gardar e cargar', v.grupoId==='gA', v.grupoId);
ok('lese tamén `grupo_id` da base', M.mesaBaleira('X') && true);

console.log(f?`\n${f} FALLOS`:'\n✓ Os 32 casos de mesas pasan');
process.exit(f?1:0);
