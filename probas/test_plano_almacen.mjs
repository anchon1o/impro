// Probas de plano/paleta.js, plano/historial.js e plano/almacen.js

import {
  paletaDesdeTema, PALETAS, cor, conAlfa, textoSobre, TOKENS_COR,
  paletaExportacion, FONTE_PLANO,
} from '/home/claude/impro/impro/src/plano/paleta.js';
import * as H from '/home/claude/impro/impro/src/plano/historial.js';
import * as A from '/home/claude/impro/impro/src/plano/almacen.js';
import { planoBaleiro, novoElemento, engadirElemento, novoMomento } from '/home/claude/impro/impro/src/plano/modelo.js';
import { TEMAS, completarTema } from '/home/claude/impro/impro/src/core.jsx';

let f = 0;
const ok = (t, c, e = '') => { console.log((c ? '✓ ' : '✗ ') + t + (c ? '' : ' — ' + e)); if (!c) f++; };

// ═══════════════════════════════════════════════════════════════════
// PALETA
// ═══════════════════════════════════════════════════════════════════
// ⚠️ O debuxo NON le o tema, le unha paleta. Sen esa separación,
// exportar «en claro» estando en escuro obrigaría a cambiar o tema da
// app enteira para xerar a imaxe.

const T = completarTema(TEMAS[0].escuro, 'escuro');
const p = paletaDesdeTema(T);
ok('a paleta de pantalla sae do tema', p.id === 'tema');
ok('e trae os sete tokens', TOKENS_COR.every((k) => typeof p.tokens[k] === 'string'));
ok('todas as cores da paleta están definidas',
  ['fondo', 'chan', 'chanBorde', 'reixa', 'cota', 'texto', 'seleccion', 'foco'].every((k) => !!p[k]));
ok('paletaDesdeTema(null) non peta', !!paletaDesdeTema(null).fondo);
ok('paletaDesdeTema(undefined) tampouco', !!paletaDesdeTema(undefined).tokens.accent);

// ⚠️ Todos os temas teñen que dar unha paleta completa, non só o
// primeiro: os pares día/noite son 8 e un token que falte nun deles
// pintaría de negro sen dar erro.
let todosOk = true;
TEMAS.forEach((t) => {
  ['escuro', 'claro'].forEach((k) => {
    const pt = paletaDesdeTema(completarTema(t[k], k));
    if (!TOKENS_COR.every((tk) => /^#|^rgb/.test(pt.tokens[tk]))) todosOk = false;
    if (!pt.chan || !pt.texto) todosOk = false;
  });
});
ok('⚠️ os 8 temas dan paleta completa', todosOk);

ok('as tres paletas de exportación existen',
  !!PALETAS.claro && !!PALETAS.negativo && !!PALETAS.transparente);
// ⚠️ Fixas a propósito: unha imaxe que se manda a unha sala non pode
// depender do tema que tivese aberto quen a exportou.
ok('⚠️ a paleta clara non depende do tema', PALETAS.claro.fondo === '#ffffff');
// ⚠️ `fondo: null` non é un descoido: hai que NON debuxar o
// rectángulo, non debuxalo invisible.
ok('⚠️ a transparente ten fondo null, non "transparent"', PALETAS.transparente.fondo === null);
ok('paletaExportacion devolve a pedida', paletaExportacion('claro', T).id === 'claro');
ok('e cae á de pantalla se non existe', paletaExportacion('inventada', T).id === 'tema');

// ⚠️ Un token descoñecido non pode dar undefined: un `fill` baleiro en
// SVG píntase de NEGRO e o actor desaparece sen erro.
ok('⚠️ un token descoñecido NUNCA devolve undefined', typeof cor(p, 'inventado') === 'string');
ok('e non devolve cadea baleira', cor(p, 'inventado').length > 0);
ok('un token válido tradúcese', cor(p, 'ok') === p.tokens.ok);
ok('un hexadecimal directo respéctase', cor(p, '#123456') === '#123456');
ok('cor(null, ...) non peta', typeof cor(null, 'ok') === 'string');

ok('conAlfa engade dous díxitos', conAlfa('#ff0000', 0.5).length === 9);
ok('conAlfa(1) é opaco', conAlfa('#ff0000', 1).endsWith('ff'));
ok('conAlfa(0) é transparente', conAlfa('#ff0000', 0).endsWith('00'));
ok('conAlfa nunha cor rara devólvea tal cal', conAlfa('rgb(1,2,3)', 0.5) === 'rgb(1,2,3)');

// ⚠️ O número dun actor amarelo ten que ir en negro.
ok('⚠️ sobre amarelo, texto negro', textoSobre('#ffd54f') === '#111111');
ok('sobre azul escuro, texto branco', textoSobre('#1a3a6b') === '#ffffff');
ok('sobre branco, negro', textoSobre('#ffffff') === '#111111');
ok('sobre negro, branco', textoSobre('#000000') === '#ffffff');
ok('unha cor inválida non peta', textoSobre('lixo') === '#ffffff');

// ⚠️ Inter vén de Google Fonts e non existe nun lenzo ao exportar.
ok('⚠️ a fonte do plano é do sistema, non Inter', !/Inter/.test(FONTE_PLANO));
ok('e é a mesma en todas as paletas',
  [p, PALETAS.claro, PALETAS.negativo, PALETAS.transparente].every((x) => x.fonte === FONTE_PLANO));

// ═══════════════════════════════════════════════════════════════════
// HISTORIAL
// ═══════════════════════════════════════════════════════════════════

let h = H.crear('a');
ok('nace cun só paso', H.tamaño(h) === 1 && H.actual(h) === 'a');
ok('e non se pode desfacer nada', !H.podeDesfacer(h) && !H.podeRefacer(h));

h = H.push(h, 'b', { agora: 1000 });
h = H.push(h, 'c', { agora: 2000 });
ok('tres pasos', H.tamaño(h) === 3 && H.actual(h) === 'c');
ok('agora si se pode desfacer', H.podeDesfacer(h));
h = H.desfacer(h);
ok('desfacer volve a b', H.actual(h) === 'b');
ok('e pódese refacer', H.podeRefacer(h));
h = H.desfacer(h);
ok('desfacer outra vez volve a a', H.actual(h) === 'a');
ok('e xa non se pode máis', !H.podeDesfacer(h));
ok('desfacer no tope non peta', H.actual(H.desfacer(h)) === 'a');
h = H.refacer(h);
ok('refacer volve a b', H.actual(h) === 'b');

// ⚠️ Un paso novo despois de desfacer BOTA o futuro.
h = H.push(h, 'z', { agora: 3000 });
ok('⚠️ escribir despois de desfacer bota a rama que había',
  H.actual(h) === 'z' && !H.podeRefacer(h) && H.tamaño(h) === 3, H.tamaño(h));

// ⚠️ FUSIÓN. Sen isto, un arrastre enche o historial de 200 entradas.
let g = H.crear('inicio');
for (let i = 0; i < 200; i++) g = H.push(g, `mov${i}`, { etiqueta: 'mover:el-1', agora: 5000 + i });
ok('⚠️ 200 movementos do dedo son UN só paso', H.tamaño(g) === 2, H.tamaño(g));
ok('e conserva o último estado', H.actual(g) === 'mov199');
g = H.desfacer(g);
ok('⚠️ e desfacer devolve o de antes do arrastre enteiro', H.actual(g) === 'inicio');

// Fóra da xanela de tempo xa non fusiona
let g2 = H.crear('x');
g2 = H.push(g2, 'y', { etiqueta: 'mover:el-1', agora: 0 });
g2 = H.push(g2, 'z', { etiqueta: 'mover:el-1', agora: 99999 });
ok('pasado o tempo de fusión, xa son dous pasos', H.tamaño(g2) === 3, H.tamaño(g2));

// Etiquetas distintas non fusionan
let g3 = H.crear('x');
g3 = H.push(g3, 'y', { etiqueta: 'mover:el-1', agora: 0 });
g3 = H.push(g3, 'z', { etiqueta: 'mover:el-2', agora: 10 });
ok('mover outro elemento é outro paso', H.tamaño(g3) === 3);

// Sen etiqueta nunca fusiona
let g4 = H.crear('x');
g4 = H.push(g4, 'y', { agora: 0 });
g4 = H.push(g4, 'z', { agora: 1 });
ok('sen etiqueta nunca se fusiona', H.tamaño(g4) === 3);

// ⚠️ Desfacer limpa a etiqueta: arrastre → desfacer → arrastre non
// pode fusionarse co primeiro.
let g5 = H.crear('x');
g5 = H.push(g5, 'y', { etiqueta: 'mover:el-1', agora: 0 });
g5 = H.desfacer(g5);
g5 = H.push(g5, 'w', { etiqueta: 'mover:el-1', agora: 10 });
ok('⚠️ despois de desfacer, o arrastre seguinte é un paso novo', H.actual(g5) === 'w' && H.tamaño(g5) === 2);
ok('pechar corta a fusión', H.pechar(g5).etiqueta === null);

// Tope
let g6 = H.crear('0', { tope: 5 });
for (let i = 1; i <= 20; i++) g6 = H.push(g6, String(i), { agora: i * 10000 });
ok('o tope respéctase', H.tamaño(g6) === 5, H.tamaño(g6));
ok('⚠️ e recórtase polo PRINCIPIO: consérvase o máis recente', H.actual(g6) === '20');
ok('reemprazar non crea paso', H.tamaño(H.reemprazar(g6, 'outro')) === 5);
ok('e cambia o actual', H.actual(H.reemprazar(g6, 'outro')) === 'outro');
ok('push sobre null crea historial', H.tamaño(H.push(null, 'a')) === 1);
ok('actual(null) non peta', H.actual(null) === undefined);

// ═══════════════════════════════════════════════════════════════════
// ALMACÉN local
// ═══════════════════════════════════════════════════════════════════
localStorage.clear();
ok('sen nada gardado, a lista está baleira', A.listarLocais().length === 0);

let P = planoBaleiro('O meu plano');
P = engadirElemento(P, novoElemento('actor', { nome: 'Ana' }), P.momentos[0].id);
const gardado = A.gardarLocal(P);
ok('gardar devolve o plano validado', gardado.id === P.id);
ok('e márcao como local', gardado.local === true);
ok('e ponlle marca de tempo', typeof gardado.actualizado === 'number');
ok('agora hai un plano', A.listarLocais().length === 1);
ok('recupérase polo id', A.obterLocal(P.id).nome === 'O meu plano');
ok('⚠️ e sobrevive ao contido: o actor segue aí', A.obterLocal(P.id).elementos.length === 1);
ok('un id inexistente devolve null', A.obterLocal('non-existe') === null);

// Gardar dúas veces non duplica
A.gardarLocal({ ...P, nome: 'Renomeado' });
ok('⚠️ gardar dúas veces ACTUALIZA, non duplica', A.listarLocais().length === 1);
ok('e queda o nome novo', A.obterLocal(P.id).nome === 'Renomeado');

// Orde por recencia
const P2 = A.gardarLocal(planoBaleiro('Segundo'));
ok('dous planos', A.listarLocais().length === 2);
ok('o máis recente vai primeiro', A.listarLocais()[0].id === P2.id);

// Duplicar
const copia = A.duplicarLocal(P.id);
ok('duplicar crea outro', A.listarLocais().length === 3);
ok('⚠️ cun id NOVO', copia.id !== P.id);
ok('e nome de copia', /copia/.test(copia.nome));
ok('duplicar algo inexistente devolve null', A.duplicarLocal('nada') === null);

// Borrar
A.borrarLocal(copia.id);
ok('borrar quita un', A.listarLocais().length === 2);
ok('borrar algo inexistente non peta', A.borrarLocal('nada') === true);

// ⚠️ Un localStorage estragado non pode tirar a pantalla enteira.
localStorage.setItem('impro_planos_v1', '{{{ isto non é JSON');
ok('⚠️ un localStorage estragado devolve lista baleira, non peta', A.listarLocais().length === 0);
localStorage.setItem('impro_planos_v1', '{"non":"un array"}');
ok('⚠️ e un JSON válido que non é array, tamén', A.listarLocais().length === 0);
localStorage.clear();

// ⚠️ Migración: os locais NON se soben sós.
A.gardarLocal(planoBaleiro('Local 1'));
A.gardarLocal(planoBaleiro('Local 2'));
const mig = A.migrables();
ok('migrables di cales se poderían subir', mig.length === 2);
ok('e trae o resumo de cada un', typeof mig[0].resumo.momentos === 'number');
ok('⚠️ pero non subiu nada: seguen en local', A.listarLocais().length === 2);

// Fachada sen conta
const lista = await A.listar(false);
ok('a fachada sen conta devolve os locais', lista.planos.length === 2);
ok('e todos marcados como locais', lista.planos.every((x) => x.local === true));
localStorage.clear();
const baleira = await A.listar(false);
ok('⚠️ e distingue baleiro de erro', baleira.motivo === 'baleiro', baleira.motivo);

const r = await A.gardar(planoBaleiro('Por fachada'), { logueado: false });
ok('gardar por fachada sen conta vai a local', r.ok === true && A.listarLocais().length === 1);
const rb = await A.borrar(A.listarLocais()[0]);
ok('borrar por fachada tamén', rb.ok === true && A.listarLocais().length === 0);
ok('novoPlano crea un baleiro', A.novoPlano('X').nome === 'X');

// Un plano con varios momentos sobrevive á ida e volta polo almacén
let M = planoBaleiro('Con momentos');
M = novoMomento(M); M = novoMomento(M);
A.gardarLocal(M);
const volto = A.obterLocal(M.id);
ok('⚠️ os tres momentos sobreviven a gardar e ler', volto.momentos.length === 3, volto.momentos.length);
ok('e as transicións tamén', volto.transicions.length === 2, volto.transicions.length);
localStorage.clear();

console.log(f ? `\n${f} FALLOS` : '\n✓ Todos os casos de paleta, historial e almacén pasan');
process.exit(f ? 1 : 0);
