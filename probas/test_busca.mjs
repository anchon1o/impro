import * as B from '/home/claude/impro/impro/src/dinamicasBusca.js';
let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};

const D = [
 {id:'1',nombre:'Estatuas',tipo:'juego',duracion:5,descripcion:'Xogo rápido de quecemento.',
  pasos:['Todo o mundo se move pola sala','Ao dicir alto, convértense en estatua'],
  objetivo:'Escoita grupal',variantes:['Con música'],autoria:'',fuente:'improvgames.com'},
 {id:'2',nombre:'Máquina de ritmos',tipo:'musical',duracion:15,descripcion:'Construír unha máquina sonora.',
  pasos:['Un empeza cun son repetido','Os demais engaden pezas'],objetivo:'',variantes:[]},
 {id:'3',nombre:'Círculo de nomes',tipo:'calentamiento',duracion:8,descripcion:'Presentación en círculo.',
  pasos:['En círculo, cada quen di o seu nome'],objetivo:'Romper o xeo',variantes:[]},
 {id:'1755000000000',nombre:'Acción propia',tipo:'juego',duracion:20,descripcion:'Unha miña.',
  pasos:[],objetivo:'',variantes:[]},
];

// ── ⚠️ Acentos ───────────────────────────────────────────────────
ok('normalizar quita acentos', B.normalizar('Acción Música')==='accion musica');
ok('⚠️ buscar «musica» atopa «música»', B.coincide(D[1],'musica'));
ok('⚠️ buscar «accion» atopa «Acción»', B.coincide(D[3],'accion'));
ok('e ao revés tamén', B.coincide(D[3],'acción'));
ok('non distingue maiúsculas', B.coincide(D[0],'ESTATUAS'));

// ── ⚠️ Busca no contido, non só no título ────────────────────────
ok('⚠️ atopa por unha palabra dos PASOS', B.coincide(D[0],'sala'));
ok('⚠️ atopa polo OBXECTIVO', B.coincide(D[2],'xeo'));
ok('⚠️ atopa polas VARIANTES', B.coincide(D[0],'música'));
ok('⚠️ atopa pola FONTE', B.coincide(D[0],'improvgames'));
ok('e segue atopando polo título', B.coincide(D[1],'máquina'));
ok('o que non está, non aparece', !B.coincide(D[1],'paraugas'));
ok('busca baleira devolve todo', D.every(d=>B.coincide(d,'')));

// Varias palabras, en calquera orde e sen estar xuntas
ok('⚠️ «estatua sala» atopa aínda que estean en frases distintas', B.coincide(D[0],'estatua sala'));
ok('  e en orde inversa tamén', B.coincide(D[0],'sala estatua'));
ok('  pero se falta unha, non', !B.coincide(D[0],'estatua paraugas'));

// ── Onde apareceu ────────────────────────────────────────────────
ok('di que foi no nome', B.onde(D[0],'estatuas')==='nome');
ok('⚠️ di que foi nos pasos', B.onde(D[0],'sala')==='pasos');
ok('di que foi no obxectivo', B.onde(D[2],'xeo')==='obxectivo');
ok('e null se non hai coincidencia', B.onde(D[0],'paraugas')===null);

// ── Ordes ────────────────────────────────────────────────────────
ok('hai 8 ordes', B.ORDES.length===8);
const nomes = B.ordenar(D,'nome').map(d=>d.nombre);
ok('por nome, alfabético', nomes[0]==='Acción propia', nomes.join(','));
ok('⚠️ máis curtas primeiro', B.ordenar(D,'curtas')[0].duracion===5);
ok('⚠️ máis longas primeiro', B.ordenar(D,'longas')[0].duracion===20);
ok('por tipo agrupa', B.ordenar(D,'tipo')[0].tipo==='calentamiento');
ok('⚠️ favoritas primeiro', B.ordenar(D,'favoritas',{favs:['2']})[0].id==='2');
ok('⚠️ máis recentes: a propia arriba', B.ordenar(D,'novas')[0].id==='1755000000000');
ok('⚠️ máis usadas, polo mapa de trackDin',
   B.ordenar(D,'usadas',{usos:{'Círculo de nomes':9,'Estatuas':2}})[0].nombre==='Círculo de nomes');
ok('sen datos de uso non peta', B.ordenar(D,'usadas',{}).length===4);
ok('unha orde descoñecida non perde dinámicas', B.ordenar(D,'inventada').length===4);
ok('ordenar non muta o array orixinal', (B.ordenar(D,'curtas'), D[0].nombre==='Estatuas'));

// ── Relevancia ───────────────────────────────────────────────────
const rel = B.ordenar(D,'relevancia',{busca:'nomes'});
ok('⚠️ o que ten a palabra no TÍTULO vai antes que quen a ten nos pasos',
   rel[0].nombre==='Círculo de nomes', rel.map(d=>d.nombre).join(','));
ok('sen busca, relevancia ordena por nome', B.ordenar(D,'relevancia',{busca:''})[0].nombre==='Acción propia');

// ── Todo xunto ───────────────────────────────────────────────────
let r = B.filtrarEOrdenar(D,{busca:'',filtro:'juego',orde:'nome'});
ok('filtro por tipo', r.length===2 && r.every(d=>d.tipo==='juego'));
r = B.filtrarEOrdenar(D,{busca:'',filtro:'★ Favoritas',orde:'nome',favs:['3']});
ok('filtro de favoritas', r.length===1 && r[0].id==='3');
r = B.filtrarEOrdenar(D,{busca:'sala',filtro:'todos',orde:'relevancia'});
ok('⚠️ busca nos pasos combinada con filtro', r.length===1 && r[0].id==='1');
r = B.filtrarEOrdenar(D,{busca:'sala',filtro:'musical',orde:'nome'});
ok('e o filtro segue mandando', r.length===0);
ok('cunha lista baleira non peta', B.filtrarEOrdenar([],{}).length===0);
ok('con undefined tampouco', B.filtrarEOrdenar(undefined,{}).length===0);

console.log(f?`\n${f} FALLOS`:'\n✓ Os 36 casos de busca pasan');
process.exit(f?1:0);
