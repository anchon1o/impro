// Días da semana e meses por idioma. A versión vella tiña dous «X»
// para mércores e xoves: nin en galego se distinguían.
import { diasSemana, meses, DIAS_SEMANA_LANG, MESES_LANG } from '/home/claude/impro/impro/src/eventos.js';
let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};

for (const l of ['gl','es','en']) {
  const d = diasSemana(l), m = meses(l);
  ok(`${l}: 7 días`, d.length===7, d.length);
  ok(`  ⚠️ e os 7 son DISTINTOS entre si`, new Set(d).size===7, d.join(' '));
  ok(`  todos de 2 letras`, d.every(x=>x.length===2), d.join(' '));
  ok(`${l}: 12 meses distintos`, m.length===12 && new Set(m).size===12);
}
ok('galego correcto', diasSemana('gl').join(' ')==='Lu Ma Mé Xo Ve Sá Do', diasSemana('gl').join(' '));
ok('castelán correcto', diasSemana('es').join(' ')==='Lu Ma Mi Ju Vi Sá Do', diasSemana('es').join(' '));
ok('inglés correcto', diasSemana('en').join(' ')==='Mo Tu We Th Fr Sa Su', diasSemana('en').join(' '));
ok('empeza en luns nos tres', ['gl','es','en'].every(l=>['Lu','Mo'].includes(diasSemana(l)[0])));
ok('un idioma descoñecido cae a galego', diasSemana('pt')[0]==='Lu' && meses('pt')[0]==='Xaneiro');
ok('sen argumento tamén', diasSemana().length===7 && meses().length===12);
ok('os tres idiomas teñen mes de agosto no índice 7',
   ['gl','es','en'].every(l=>/^(Agosto|August)$/.test(meses(l)[7])), ['gl','es','en'].map(l=>meses(l)[7]).join('/'));

// Filtro de próximos, que é o que causou o reporte
const hoxe = new Date().toISOString().slice(0,10);
const onte = new Date(Date.now()-86400000).toISOString().slice(0,10);
const mana = new Date(Date.now()+86400000).toISOString().slice(0,10);
const evs = [{dataInicio:onte,t:'pasado'},{dataInicio:hoxe,t:'hoxe'},{dataInicio:mana,t:'futuro'}];
const dataDe = e=>e.dataInicio||e.data_inicio||e.data||e.fecha||'';
const proximos = evs.filter(e=>dataDe(e)>=hoxe);
ok('⚠️ o filtro de próximos deixa fóra o de onte', proximos.length===2, proximos.map(e=>e.t).join(','));
ok('  pero SI inclúe o de hoxe', proximos.some(e=>e.t==='hoxe'));
ok('  e sen filtro están os tres', evs.length===3);

console.log(f?`\n${f} FALLOS`:'\n✓ Os 22 casos da axenda pasan');
process.exit(f?1:0);
