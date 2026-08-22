import * as E from '/home/claude/impro/impro/src/sonido/escenas.js';
let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};

const R=[
 {id:'m1',tipo:'musica',nome:'Piano inquietante',url:'u1',vol:0.7,modo:'loop'},
 {id:'a1',tipo:'ambiente',nome:'Tormenta',url:'u2',vol:0.3,modo:'loop'},
 {id:'a2',tipo:'ambiente',nome:'Lareira',url:'u3',vol:0.1,modo:'loop'},
 {id:'a3',tipo:'ambiente',nome:'Motor',url:'u4',vol:0.5,modo:'loop'},
 {id:'e1',tipo:'efecto',nome:'Porta',url:'u5',vol:0.9,modo:'once'},
 {id:'e2',tipo:'efecto',nome:'Trono',url:'u6',vol:1,modo:'once'},
];

// ── Capturar ──────────────────────────────────────────────────────
const capas=[{id:'m1',on:true,vol:0.6},{id:'a1',on:true,vol:0.3},
             {id:'a2',on:true,vol:0.1},{id:'a3',on:false,vol:0.5}];
const esc = E.capturarEscena('Mansión encantada', capas, R.filter(r=>r.tipo==='efecto'));
ok('captura só o que está ACESO', Object.keys(esc.capas).sort().join(',')==='a1,a2,m1',
   Object.keys(esc.capas).join(','));
ok('cos volumes que tiñan nese momento', esc.capas.m1===0.6 && esc.capas.a2===0.1);
ok('e os botóns visibles', esc.botons.join(',')==='e1,e2');
ok('nace local', esc.local===true);

// ── ⚠️ Planificar: apaga o que non pertence á escena ─────────────
const actuais=[{id:'m1',on:true,vol:0.6},{id:'a3',on:true,vol:0.5},{id:'a1',on:false,vol:0.3}];
let plan = E.planificarEscena(esc, R, actuais);
ok('acende as tres capas da escena', plan.acender.length===3, plan.acender.length);
ok('⚠️ apaga o que soaba e non é da escena (a3)', plan.apagar.join(',')==='a3', plan.apagar.join(','));
ok('non apaga o que xa pertence á escena', !plan.apagar.includes('m1'));
ok('sen sons perdidos', plan.faltan.length===0);
ok('leva o volume de cada capa', plan.acender.find(x=>x.recurso.id==='a2').vol===0.1);

// Encadear dúas escenas non acumula
const esc2 = E.capturarEscena('Nave', [{id:'a3',on:true,vol:0.4}], []);
plan = E.planificarEscena(esc2, R, [{id:'m1',on:true,vol:0.6},{id:'a1',on:true,vol:0.3},{id:'a2',on:true,vol:0.1}]);
ok('⚠️ cambiar de escena baixa as tres anteriores', plan.apagar.sort().join(',')==='a1,a2,m1',
   plan.apagar.join(','));

// Son borrado
plan = E.planificarEscena(esc, R.filter(r=>r.id!=='a2'), []);
ok('unha escena cun son borrado NON peta', plan.acender.length===2);
ok('e dí cal falta', plan.faltan.join(',')==='a2');

ok('sen escena non fai nada', E.planificarEscena(null,R,[]).acender.length===0);

// ── Gardar e cargar ───────────────────────────────────────────────
let g = await E.gardarEscena(esc, null);
ok('gárdase sen conta', g.ok===true, g.erro);
let c = await E.cargarEscenas(null);
ok('e recupérase', c.escenas.length===1 && c.escenas[0].nome==='Mansión encantada');
ok('cos seus volumes', c.escenas[0].capas.m1===0.6);
ok('e cos seus botóns', c.escenas[0].botons.join(',')==='e1,e2');

ok('rexeita unha escena sen nome', (await E.gardarEscena({...esc,nome:'  '},null)).ok===false);
ok('⚠️ rexeita unha escena BALEIRA en vez de gardar nada',
   (await E.gardarEscena({...esc,capas:{},botons:[]},null)).ok===false);

await E.gardarEscena({...c.escenas[0],nome:'Mansión'}, null);
c = await E.cargarEscenas(null);
ok('editar non duplica', c.escenas.length===1 && c.escenas[0].nome==='Mansión');

E.borrarEscenaLocal(c.escenas[0].id);
ok('borrar quita a escena', (await E.cargarEscenas(null)).escenas.length===0);

// ── Datos corruptos ───────────────────────────────────────────────
localStorage.setItem('impro_sonido_escenas_v1','{roto');
ok('JSON corrupto non impide abrir', (await E.cargarEscenas(null)).escenas.length===0);
localStorage.setItem('impro_sonido_escenas_v1', JSON.stringify([
  null, 7, {nome:'sen id'},
  {id:'x', nome:'', capas:{a:null,b:0.5,c:[],'':1}, botons:['ok',null,3], fade:'moito'},
]));
c = await E.cargarEscenas(null);
ok('descarta as inválidas', c.escenas.length===1, c.escenas.length);
const x=c.escenas[0];
ok('nome por defecto', x.nome==='Sen nome');
ok('⚠️ capa con null cae a 0.8, non a silencio', x.capas.a===0.8, x.capas.a);
ok('conserva a boa e descarta a clave baleira', x.capas.b===0.5 && x.capas['']===undefined);
ok('limpa os botóns non válidos', x.botons.join(',')==='ok');
ok('e o fade non numérico cae a 1,5 s', x.fade===1.5, x.fade);
// As unidades teñen que aguantar unha ida e volta enteira.
const conFade = E.sanearEscena({id:'y',nome:'A',capas:{a:0.5},fade:3});
ok('un fade de 3 s conserva 3 s', conFade.fade===3, conFade.fade);
ok('e recórtase a 8 s como tope', E.sanearEscena({id:'z',nome:'B',fade:99}).fade===8);
await E.gardarEscena(conFade, null);
const volta = (await E.cargarEscenas(null)).escenas.find(e=>e.nome==='A');
ok('⚠️ o fade sobrevive a gardar e cargar sen cambiar de unidade', volta.fade===3, volta.fade);
const cap = E.capturarEscena('C',[{id:'a',on:true,vol:0.5}],[]);
ok('e unha escena capturada nace con 1,5 s', cap.fade===1.5, cap.fade);

// ── Grupos ───────────────────────────────────────────────────────
const ep={...E.sanearEscena({id:'p',nome:'Persoal',capas:{a:0.5}}),grupoId:null};
const eg={...E.sanearEscena({id:'g',nome:'Do grupo',capas:{a:0.5},grupoId:'gA'})};
const eo={...E.sanearEscena({id:'o',nome:'Doutro',capas:{a:0.5},grupoId:'gB'})};
ok('sanear le o grupo', eg.grupoId==='gA');
ok('e tamén `grupo_id` da base', E.sanearEscena({id:'x',nome:'X',grupo_id:'gZ'}).grupoId==='gZ');
ok('sen grupo activo vense todas', E.filtrarPorGrupo([ep,eg,eo],null).length===3);
ok('⚠️ cun grupo vense as súas E as persoais',
   E.filtrarPorGrupo([ep,eg,eo],'gA').map(x=>x.nome).join(',')==='Persoal,Do grupo');
ok('⚠️ e nunca as doutro', !E.filtrarPorGrupo([ep,eg,eo],'gA').some(x=>x.grupoId==='gB'));

localStorage.clear();
await E.gardarEscena(eg, null);
ok('⚠️ o grupo sobrevive a gardar e cargar',
   (await E.cargarEscenas(null)).escenas[0].grupoId==='gA');

console.log(f?`\n${f} FALLOS`:'\n✓ Os 37 casos de escenas pasan');
process.exit(f?1:0);
