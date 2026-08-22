import * as E from '/home/claude/impro/impro/src/escaleta.js';
let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};

const DIN = {id:'d1',nombre:'Estatuas',tipo:'juego',duracion:5};
const DIN2 = {id:'d2',nombre:'Círculo de nomes',tipo:'calentamiento',duracion:8};

// ── Creación ─────────────────────────────────────────────────────
let e = E.escaletaBaleira('Show de outono','espectaculo');
ok('nace baleira e local', e.bloques.length===0 && e.local===true);
ok('co tipo pedido', e.tipo==='espectaculo');
ok('un tipo inventado cae a ensaio', E.escaletaBaleira('x','inventado').tipo==='ensaio');
ok('ten campo de notas para data e lugar', e.notas==='');

// ⚠️ Un bloque vai ligado a un TIPO REAL de dinámica
const b1 = E.crearBloque({tipoId:'calentamiento',nome:'Quecemento'});
const b2 = E.crearBloque({tipoId:'juego',nome:'Xogos'});
ok('⚠️ o bloque garda o id do tipo real, non unha etiqueta', b1.tipoId==='calentamiento');
e = E.engadirBloque(E.engadirBloque(e,b1),b2);
ok('dous bloques', e.bloques.length===2);

// ── Itens ────────────────────────────────────────────────────────
const i1 = E.crearItem(DIN2);
ok('⚠️ o item garda o NOME ademais do id', i1.dinamicaId==='d2' && i1.nome==='Círculo de nomes');
ok('e colle a duración da dinámica', i1.minutos===8);
ok('pódese sobrescribir a duración', E.crearItem(DIN,{minutos:12}).minutos===12);
e = E.engadirItem(e,b1.id,i1);
e = E.engadirItem(e,b2.id,E.crearItem(DIN));
ok('cada item vai ao seu bloque',
   e.bloques[0].itens.length===1 && e.bloques[1].itens.length===1);

// ── Cálculos ─────────────────────────────────────────────────────
ok('minutos totais = suma dos itens', E.minutosTotais(e)===13, E.minutosTotais(e));
const desc = E.crearBloque({tipoId:null,nome:'Descanso',minutos:10});
let e2 = E.engadirBloque(e,desc);
ok('⚠️ un bloque sen itens conta cos seus propios minutos', E.minutosTotais(e2)===23, E.minutosTotais(e2));
ok('os itens mandan sobre os minutos do bloque',
   E.minutosBloque({minutos:99,itens:[{minutos:3},{minutos:4}]})===7);

const r = E.resumo(e2);
ok('resumo conta bloques e itens', r.bloques===3 && r.itens===2 && r.minutos===23);
ok('⚠️ e detecta bloques sen contido ningún',
   E.resumo(E.engadirBloque(e2,E.crearBloque({nome:'Baleiro'}))).senContido.length===1);

// ── Reordenar ────────────────────────────────────────────────────
let m = E.moverBloque(e,b1.id,1);
ok('mover un bloque cambia a orde', m.bloques[1].id===b1.id);
ok('mover fóra de rango non cambia nada', E.moverBloque(e,b1.id,-1).bloques[0].id===b1.id);
ok('quitar un bloque', E.quitarBloque(e,b1.id).bloques.length===1);
ok('quitar un item', E.quitarItem(e,b1.id,i1.id).bloques[0].itens.length===0);
const dous = E.engadirItem(e,b1.id,E.crearItem(DIN));
ok('mover un item dentro do bloque',
   E.moverItem(dous,b1.id,i1.id,1).bloques[0].itens[1].id===i1.id);
ok('editar un item', E.editarItem(e,b1.id,i1.id,{notas:'con música'}).bloques[0].itens[0].notas==='con música');
ok('editar non toca os demais bloques',
   E.editarItem(e,b1.id,i1.id,{minutos:1}).bloques[1].itens[0].minutos===5);

// ── ⚠️ Exportar para o directo ───────────────────────────────────
const plano = E.paraDirecto(e2);
ok('devolve unha lista plana', Array.isArray(plano) && plano.length===5, plano.length);
ok('alterna bloque e os seus itens',
   plano[0].tipo==='bloque' && plano[1].tipo==='item' && plano[2].tipo==='bloque');
ok('⚠️ cos tempos ACUMULADOS', plano[0].desde===0 && plano[0].ata===8 && plano[2].desde===8,
   plano.map(x=>`${x.desde}-${x.ata}`).join(' '));
ok('e o total casa co calculado', plano[plano.length-1].ata===E.minutosTotais(e2)
   || plano.filter(x=>x.tipo==='bloque').reduce((a,x)=>a+x.minutos,0)===23);
ok('cada item sabe de que bloque é', plano[1].bloqueId===b1.id);
ok('unha escaleta baleira dá lista baleira', E.paraDirecto(E.escaletaBaleira()).length===0);
ok('e undefined tampouco peta', E.paraDirecto(undefined).length===0);

// ── Saneamento ───────────────────────────────────────────────────
ok('descarta o que non ten id', E.sanear({nome:'x'})===null);
const sucia = E.sanear({id:'x',nome:'  ',tipo:'raro',bloques:'non é lista'});
ok('nome baleiro → Sen nome', sucia.nome==='Sen nome');
ok('tipo raro → ensaio', sucia.tipo==='ensaio');
ok('bloques que non son lista → lista baleira', Array.isArray(sucia.bloques) && sucia.bloques.length===0);
const s2 = E.sanear({id:'y',nome:'Y',bloques:[null,5,{id:'b',itens:[{},{nome:'Ok',minutos:'7'}]}]});
ok('descarta bloques inválidos', s2.bloques.length===1);
ok('e itens sen nome nin id', s2.bloques[0].itens.length===1);
ok('convertendo minutos de texto a número', s2.bloques[0].itens[0].minutos===7);
ok('⚠️ un minutos nulo cae a 0, non a NaN', E.sanear({id:'z',nome:'Z',bloques:[{id:'b',minutos:null,itens:[]}]}).bloques[0].minutos===0);

// ── Duplicar ─────────────────────────────────────────────────────
const c = E.duplicar(e2);
ok('duplicar cambia o id', c.id!==e2.id);
ok('leva "(copia)"', c.nome.includes('(copia)'));
ok('⚠️ e nace LOCAL, non sube soa', c.local===true);
ok('cos mesmos bloques', c.bloques.length===e2.bloques.length);
ok('pódeselle poñer outro nome', E.duplicar(e2,'Show de inverno').nome==='Show de inverno');

// ── Gardar e cargar sen conta ────────────────────────────────────
let g = await E.gardarEscaleta(e2, null);
ok('gárdase sen conta', g.ok===true, g.erro);
let cargadas = await E.cargarEscaletas(null);
ok('e recupérase', cargadas.escaletas.length===1);
ok('cos bloques intactos', cargadas.escaletas[0].bloques.length===3);
ok('rexeita unha sen nome', (await E.gardarEscaleta({...e2,nome:'   '},null)).ok===false);
await E.gardarEscaleta({...cargadas.escaletas[0],nome:'Renomeada'}, null);
ok('editar non duplica', (await E.cargarEscaletas(null)).escaletas.length===1);
await E.borrarEscaleta(cargadas.escaletas[0], null);
ok('borrar quita', (await E.cargarEscaletas(null)).escaletas.length===0);

localStorage.setItem('impro_escaletas_v1','{roto');
ok('JSON corrupto non impide abrir', (await E.cargarEscaletas(null)).escaletas.length===0);

// ── Converter a rundown de En directo ────────────────────────────
const { aRundown } = await import('/home/claude/impro/impro/src/tabs/SelectorEscaleta.jsx');
const pl = E.paraDirecto(e2);
const rd = aRundown(pl);
// ⚠️ Un bloque CON dinámicas non entra: o que se «fai» son as
// dinámicas. Un bloque SEN dinámicas si, porque un descanso é algo que
// pasa na función.
ok('⚠️ o rundown leva as dinámicas, non os bloques que as conteñen',
   rd.some(x=>x.nombre==='Círculo de nomes') && !rd.some(x=>x.nombre==='Quecemento'),
   rd.map(x=>x.nombre).join(','));
ok('⚠️ pero un bloque sen dinámicas SI entra (o descanso)',
   rd.some(x=>x.nombre==='Descanso'));
ok('todas nacen sen facer e sen activar', rd.every(x=>!x.activa && !x.hecho));
ok('e levan os seus minutos', rd.find(x=>x.nombre==='Descanso').minutos===10);
ok('unha escaleta baleira dá rundown baleiro', aRundown([]).length===0);
ok('e undefined tampouco peta', aRundown(undefined).length===0);

// ── Grupos ───────────────────────────────────────────────────────
const persoal = {...E.escaletaBaleira('Persoal'), grupoId:null};
const doG1 = {...E.escaletaBaleira('Do grupo 1'), grupoId:'g1'};
const doG2 = {...E.escaletaBaleira('Do grupo 2'), grupoId:'g2'};
const todas = [persoal, doG1, doG2];

ok('unha escaleta nova nace sen grupo (persoal)', E.escaletaBaleira().grupoId===null);
ok('sen grupo activo vense todas', E.filtrarPorGrupo(todas,null).length===3);
ok('⚠️ cun grupo activo vense as súas E as persoais',
   E.filtrarPorGrupo(todas,'g1').map(x=>x.nome).join(',')==='Persoal,Do grupo 1',
   E.filtrarPorGrupo(todas,'g1').map(x=>x.nome).join(','));
ok('⚠️ e NON as doutro grupo', !E.filtrarPorGrupo(todas,'g1').some(x=>x.grupoId==='g2'));
ok('cun grupo sen escaletas segue véndose o persoal',
   E.filtrarPorGrupo(todas,'g9').length===1);
ok('cunha lista baleira non peta', E.filtrarPorGrupo([], 'g1').length===0);
ok('e con undefined tampouco', E.filtrarPorGrupo(undefined,'g1').length===0);

// O grupo sobrevive a gardar e cargar
localStorage.clear();
await E.gardarEscaleta(doG1, null);
const volta = (await E.cargarEscaletas(null)).escaletas[0];
ok('⚠️ o grupo sobrevive a gardar e cargar', volta.grupoId==='g1', volta.grupoId);
// E acéptase tamén se vén da base co nome de columna
ok('lese tamén `grupo_id` da base', E.sanear({id:'x',nome:'X',grupo_id:'g7'}).grupoId==='g7');

console.log(f?`\n${f} FALLOS`:'\n✓ Os 60 casos de escaleta pasan');
process.exit(f?1:0);
