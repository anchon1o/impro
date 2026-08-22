// Probas de plano/modelo.js — módulo puro, sen render.
//
// A pregunta que responden estas probas non é «funciona?», é «que pasa
// cando alguén borra o elemento que estaba no medio de todo?».

import {
  VERSION, CAPAS, TIPOS_ELEMENTO, CORES_ACTOR, ESCENARIO_DEFECTO, POSTURAS,
  planoBaleiro, validar, migrar, novoId,
  novoElemento, normalizarElemento, engadirElemento, borrarElemento,
  elementoPorId, elementosDaCapa, seguinteCorActor, seguinteNumeroActor,
  colocacionBaleira, normalizarColocacion, colocacionDe, establecerColocacion,
  novoMomento, borrarMomento, momentoPorId, indiceMomento,
  novaTransicion, TIPOS_TRANSICION,
  novoRecorrido,
  secuencia, diferenzas, interpolar, paraReproducir, duracionTotal, resumo,
} from '/home/claude/impro/impro/src/plano/modelo.js';
import { MIRADA_PUBLICO } from '/home/claude/impro/impro/src/plano/xeometria.js';

let f = 0;
const ok = (t, c, e = '') => { console.log((c ? '✓ ' : '✗ ') + t + (c ? '' : ' — ' + e)); if (!c) f++; };
const cerca = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

// ── o documento baleiro ───────────────────────────────────────────
const P0 = planoBaleiro('Proba');
ok('un plano novo ten versión', P0.version === VERSION);
ok('e nome', P0.nome === 'Proba');
// ⚠️ SEMPRE polo menos un momento: un plano con cero non se pode debuxar.
ok('⚠️ un plano novo xa ten UN momento', P0.momentos.length === 1, P0.momentos.length);
ok('sen elementos, sen transicións, sen recorridos',
  P0.elementos.length === 0 && P0.transicions.length === 0 && P0.recorridos.length === 0);
ok('o escenario por defecto é 6 × 4,5 m', P0.escenario.anchoM === 6 && P0.escenario.fondoM === 4.5);
ok('que é proporción 4:3', cerca(P0.escenario.anchoM / P0.escenario.fondoM, 4 / 3));
ok('reixa 3×3 visible', P0.escenario.reixa.cols === 3 && P0.escenario.reixa.visible === true);
ok('cotas acesas por defecto', P0.escenario.cotas === true);
// ⚠️ Decisión B: o modo NON está no documento, é estado da interface.
ok('⚠️ o documento NON ten campo `modo`: só `modoUltimo`',
  P0.modo === undefined && typeof P0.modoUltimo === 'string');
ok('os ids son únicos', novoId() !== novoId());

// ── validar() é a rede de seguridade ──────────────────────────────
ok('validar(null) devolve un plano utilizable', validar(null).momentos.length === 1);
ok('validar(undefined) tamén', validar(undefined).elementos.length === 0);
ok('validar("lixo") tamén', validar('lixo').escenario.anchoM === 6);
ok('validar({}) tamén', validar({}).momentos.length >= 1);
ok('⚠️ un plano con cero momentos recupérase con un',
  validar({ ...P0, momentos: [] }).momentos.length === 1);
ok('é idempotente', JSON.stringify(validar(validar(P0))).length === JSON.stringify(validar(P0)).length);
ok('migrar un documento sen versión funciona', migrar({ nome: 'vello' }).version === VERSION);
ok('migrar(null) non peta', migrar(null).version === VERSION);

// ── elementos e capas · decisión B ────────────────────────────────
let P = planoBaleiro();
const m0 = P.momentos[0].id;

const actor = novoElemento('actor', { nome: 'Ana', numero: 1, cor: 'ok' });
ok('un actor é da capa escénica', actor.capa === 'escenico');
ok('⚠️ e NON é fixo: móvese entre momentos', actor.fixo === false);
const micro = novoElemento('tecnico', { simbolo: 'microphone', subcapa: 'audio' });
ok('un elemento técnico é da capa técnica', micro.capa === 'tecnico');
ok('⚠️ e SI é fixo: un pé de micro non se move durante a función', micro.fixo === true);
ok('un elemento fixo nace con `pos`', !!micro.pos && typeof micro.pos.x === 'number');
ok('e cunha subcapa', micro.subcapa === 'audio');
ok('e cun oco para metadatos', typeof micro.meta === 'object');

P = engadirElemento(P, actor, m0);
P = engadirElemento(P, micro);
ok('as dúas capas conviven no mesmo documento', P.elementos.length === 2);
ok('⚠️ un só escenario para as dúas', P.escenario.anchoM === 6);
ok('filtrar por capa escénica', elementosDaCapa(P, 'escenico').length === 1);
ok('filtrar por capa técnica', elementosDaCapa(P, 'tecnico').length === 1);
ok('un tipo inventado cae a actor', normalizarElemento({ tipo: 'dragón' }).tipo === 'actor');
ok('unha capa inventada cae á do tipo', normalizarElemento({ tipo: 'actor', capa: 'xxx' }).capa === 'escenico');
// ⚠️ `fixo` é unha PROPIEDADE, non unha consecuencia da capa: un
// praticable que se move a metade da función é técnico e non fixo.
ok('⚠️ un elemento técnico pode declararse NON fixo',
  normalizarElemento({ tipo: 'tecnico', fixo: false }).fixo === false);

// ── colocación: o punto único de lectura ──────────────────────────
const cA = colocacionDe(P, m0, actor.id);
ok('o actor ten colocación nese momento', !!cA);
ok('e nace mirando ao público', cA.mirada === MIRADA_PUBLICO);
ok('de pé', cA.postura === 'de-pe');
ok('visible', cA.visible === true);
const cM = colocacionDe(P, m0, micro.id);
ok('o técnico tamén devolve colocación', !!cM);

P = establecerColocacion(P, m0, actor.id, { x: 0.2, y: 0.8 });
ok('mover o actor gárdase no MOMENTO',
  P.momentos[0].colocacion[actor.id].x === 0.2 && elementoPorId(P, actor.id).pos === undefined);
P = establecerColocacion(P, m0, micro.id, { x: 0.9, y: 0.1 });
ok('⚠️ mover o técnico gárdase NO ELEMENTO',
  cerca(elementoPorId(P, micro.id).pos.x, 0.9) && P.momentos[0].colocacion[micro.id] === undefined);
ok('un elemento inexistente non peta', colocacionDe(P, m0, 'non-existe') === null);
ok('un momento inexistente non peta', colocacionDe(P, 'non-existe', actor.id) === null);
ok('establecerColocacion devolve un plano NOVO', establecerColocacion(P, m0, actor.id, { x: 0.4 }) !== P);
ok('e non muta o de entrada', cerca(P.momentos[0].colocacion[actor.id].x, 0.2));

// ⚠️ Number(null)===0 outra vez: 0 é o bordo esquerdo, non «sen valor».
const cero = normalizarColocacion({ x: 0, y: 0 });
ok('⚠️ unha colocación en (0,0) consérvase', cero.x === 0 && cero.y === 0);
const oco = normalizarColocacion({});
ok('unha colocación baleira cae ao centro', oco.x === 0.5 && oco.y === 0.5);
ok('unha postura inventada cae a de-pé', normalizarColocacion({ postura: 'voando' }).postura === 'de-pe');
ok('todas as posturas declaradas son válidas',
  POSTURAS.every((p) => normalizarColocacion({ postura: p }).postura === p));

// ── momentos ──────────────────────────────────────────────────────
// ⚠️ Un momento novo DUPLICA o anterior.
P = novoMomento(P);
const m1 = P.momentos[1].id;
ok('crear un momento engádeo despois', P.momentos.length === 2);
ok('⚠️ e duplica a colocación do anterior',
  cerca(colocacionDe(P, m1, actor.id).x, 0.2), colocacionDe(P, m1, actor.id).x);
ok('⚠️ e encadéase só: hai transición 1→2', P.transicions.some((t) => t.de === P.momentos[0].id && t.a === m1));
ok('as copias son independentes', (() => {
  const Q = establecerColocacion(P, m1, actor.id, { x: 0.7 });
  return cerca(colocacionDe(Q, P.momentos[0].id, actor.id).x, 0.2) && cerca(colocacionDe(Q, m1, actor.id).x, 0.7);
})());

P = novoMomento(P);
const m2 = P.momentos[2].id;
ok('tres momentos encadeados', secuencia(P).length === 3);
ok('a orde é a correcta', secuencia(P).map((m) => m.id).join() === [m0, m1, m2].join());

// ⚠️ Borrar o do medio ten que RECONECTAR: 1→2→3 pasa a 1→3.
const Pborrado = borrarMomento(P, m1);
ok('borrar o momento do medio deixa dous', Pborrado.momentos.length === 2);
ok('⚠️ e reconecta: agora hai transición 1→3',
  Pborrado.transicions.some((t) => t.de === m0 && t.a === m2), JSON.stringify(Pborrado.transicions.map((t) => `${t.de}>${t.a}`)));
ok('a secuencia segue completa', secuencia(Pborrado).length === 2);
ok('non queda ningunha transición orfa',
  Pborrado.transicions.every((t) => momentoPorId(Pborrado, t.de) && momentoPorId(Pborrado, t.a)));
// ⚠️ Sempre queda un momento.
const soUn = borrarMomento(borrarMomento(borrarMomento(P, m2), m1), m0);
ok('⚠️ non se pode quedar sen momentos', soUn.momentos.length === 1);
ok('indiceMomento localiza', indiceMomento(P, m1) === 1);
ok('indiceMomento dun inexistente dá -1', indiceMomento(P, 'nada') === -1);

// ── borrar un elemento limpa os TRES rastros ──────────────────────
let Q = planoBaleiro();
const q0 = Q.momentos[0].id;
const a1 = novoElemento('actor', { nome: 'Bea' });
Q = engadirElemento(Q, a1, q0);
Q = novoMomento(Q);
const q1 = Q.momentos[1].id;
Q = { ...Q, recorridos: [novoRecorrido([{ x: 0, y: 0 }, { x: 1, y: 1 }], { elementoId: a1.id })] };
Q = { ...Q, transicions: Q.transicions.map((t) => ({ ...t, traxectorias: { [a1.id]: 'curva' } })) };
ok('antes de borrar: colocación nos dous momentos',
  !!colocacionDe(Q, q0, a1.id) && !!colocacionDe(Q, q1, a1.id));
const Qb = borrarElemento(Q, a1.id);
ok('o elemento desaparece', elementoPorId(Qb, a1.id) === null);
ok('⚠️ 1. sen colocación en NINGÚN momento',
  Qb.momentos.every((m) => m.colocacion[a1.id] === undefined));
ok('⚠️ 2. sen recorridos asignados', Qb.recorridos.length === 0);
ok('⚠️ 3. sen traxectorias que o nomeen',
  Qb.transicions.every((t) => t.traxectorias[a1.id] === undefined));
ok('borrar algo inexistente non fai nada', borrarElemento(Qb, 'nada').elementos.length === Qb.elementos.length);

// ⚠️ Engadir un elemento no medio dunha secuencia.
// Poñelo só no momento activo parece o obvio e é o erro: o actor
// desaparecía no momento seguinte sen que ninguén o botase.
let S = planoBaleiro();
S = novoMomento(S); S = novoMomento(S); S = novoMomento(S);
const [s0, s1, s2, s3] = S.momentos.map((m) => m.id);
ok('catro momentos para a proba', S.momentos.length === 4);
const tarde = novoElemento('actor', { nome: 'Entra tarde' });
S = engadirElemento(S, tarde, s2);
ok('⚠️ nos momentos ANTERIORES non está (aínda non entrara)',
  colocacionDe(S, s0, tarde.id) === null && colocacionDe(S, s1, tarde.id) === null);
ok('está no momento no que se engadiu', !!colocacionDe(S, s2, tarde.id));
ok('⚠️ e SEGUE nos posteriores, non desaparece só', !!colocacionDe(S, s3, tarde.id));
const difS = diferenzas(S, s1, s2);
ok('e a diferenza lese como unha aparición', difS[tarde.id].accion === 'aparece');
ok('e do 3 ao 4 mantense', diferenzas(S, s2, s3)[tarde.id].accion === 'mantense');
// Un elemento fixo non depende de momentos: está sempre.
const pe = novoElemento('tecnico', { simbolo: 'mic_stand' });
S = engadirElemento(S, pe);
ok('⚠️ un elemento fixo está en TODOS os momentos, incluídos os anteriores',
  [s0, s1, s2, s3].every((mm) => !!colocacionDe(S, mm, pe.id)));

// validar() tamén limpa orfos que veñan dun ficheiro estragado
const sucio = validar({
  ...planoBaleiro(),
  momentos: [{ id: 'm-x', colocacion: { 'fantasma': { x: 0.5, y: 0.5 } } }],
  transicions: [{ de: 'm-x', a: 'non-existe' }, { de: 'm-x', a: 'm-x' }],
  recorridos: [{ puntos: [], elementoId: 'fantasma' }],
});
ok('⚠️ validar bota as colocacións orfas', Object.keys(sucio.momentos[0].colocacion).length === 0);
ok('⚠️ e as transicións a momentos que non existen', sucio.transicions.length === 0);
ok('⚠️ e as que van dun momento a si mesmo', !sucio.transicions.some((t) => t.de === t.a));
ok('⚠️ e desasigna os recorridos orfos', sucio.recorridos[0].elementoId === null);

// ── cores e números ───────────────────────────────────────────────
let C = planoBaleiro();
ok('o primeiro actor colle a primeira cor', seguinteCorActor(C) === CORES_ACTOR[0]);
C = engadirElemento(C, novoElemento('actor', { cor: CORES_ACTOR[0], numero: 1 }), C.momentos[0].id);
ok('o segundo colle a seguinte', seguinteCorActor(C) === CORES_ACTOR[1]);
ok('e o número seguinte', seguinteNumeroActor(C) === 2);
C = engadirElemento(C, novoElemento('actor', { cor: CORES_ACTOR[1], numero: 3 }), C.momentos[0].id);
ok('⚠️ enche os ocos: se hai 1 e 3, o seguinte é 2', seguinteNumeroActor(C) === 2);
ok('as cores son tokens do tema, non hexadecimais',
  CORES_ACTOR.every((c) => !c.startsWith('#')));

// ── NON TODO CAMBIO IMPLICA MOVEMENTO ─────────────────────────────
let D = planoBaleiro();
const d0 = D.momentos[0].id;
const ana = novoElemento('actor', { nome: 'Ana' });
const bea = novoElemento('actor', { nome: 'Bea' });
const car = novoElemento('actor', { nome: 'Carlos' });
D = engadirElemento(D, ana, d0);
D = engadirElemento(D, bea, d0);
D = engadirElemento(D, car, d0);
D = establecerColocacion(D, d0, ana.id, { x: 0.2, y: 0.7 });
D = establecerColocacion(D, d0, bea.id, { x: 0.5, y: 0.5 });
D = establecerColocacion(D, d0, car.id, { x: 0.8, y: 0.7 });
D = novoMomento(D);
const d1 = D.momentos[1].id;
// Ana móvese. Bea só cambia a mirada. Carlos non fai nada.
D = establecerColocacion(D, d1, ana.id, { x: 0.6, y: 0.3 });
D = establecerColocacion(D, d1, bea.id, { mirada: 180 });

const dif = diferenzas(D, d0, d1);
ok('⚠️ quen se move márcase como movemento', dif[ana.id].cambios.includes('move'));
ok('⚠️ quen só xira a cabeza NON se marca como movemento',
  dif[bea.id].cambios.includes('mirada') && !dif[bea.id].cambios.includes('move'),
  JSON.stringify(dif[bea.id].cambios));
ok('⚠️ quen non fai nada márcase como «mantense»', dif[car.id].accion === 'mantense');
ok('e sen cambios', dif[car.id].cambios.length === 0);

// Aparición e desaparición
let E = planoBaleiro();
const e0 = E.momentos[0].id;
const novo = novoElemento('actor', { nome: 'Entra' });
E = engadirElemento(E, novo, e0);
E = novoMomento(E);
const e1 = E.momentos[1].id;
E = establecerColocacion(E, e0, novo.id, { visible: false });
const difE = diferenzas(E, e0, e1);
ok('⚠️ pasar de invisible a visible é «aparece», non «move»',
  difE[novo.id].accion === 'aparece', difE[novo.id].accion);
const difE2 = diferenzas(E, e1, e0);
ok('e ao revés é «desaparece»', difE2[novo.id].accion === 'desaparece');
// ⚠️ `visible` está na colocación e non no elemento: se non, saír de
// escena obrigaría a destruír o actor e perdería nome e cor.
ok('⚠️ ao saír de escena o actor conserva o nome', elementoPorId(E, novo.id).nome === 'Entra');

// ── interpolación ─────────────────────────────────────────────────
const iA = normalizarColocacion({ x: 0, y: 0, mirada: 350, postura: 'de-pe' });
const iB = normalizarColocacion({ x: 1, y: 1, mirada: 10, postura: 'sentado' });
const med = interpolar(iA, iB, 0.5);
ok('a metade está no medio', cerca(med.x, 0.5) && cerca(med.y, 0.5));
ok('⚠️ a mirada vai polo camiño curto', cerca(med.mirada, 0) || cerca(med.mirada, 360), med.mirada);
// ⚠️ Non hai media postura entre «de pé» e «sentado».
ok('⚠️ a postura non se interpola: cambia á metade',
  interpolar(iA, iB, 0.4).postura === 'de-pe' && interpolar(iA, iB, 0.6).postura === 'sentado');
ok('interpolar sen orixe devolve o destino', interpolar(null, iB, 0.5).x === 1);
ok('interpolar sen destino devolve a orixe', interpolar(iA, null, 0.5).x === 0);
ok('con `lineal` non se suaviza', cerca(interpolar(iA, iB, 0.2, { lineal: true }).x, 0.2));

// ── reprodución: aplánase UNHA vez ────────────────────────────────
let R2 = planoBaleiro();
R2 = novoMomento(R2);
R2 = novoMomento(R2);
R2 = { ...R2, transicions: R2.transicions.map((t) => ({ ...t, duracion: 2, retraso: 0.5 })) };
const rep = paraReproducir(R2);
ok('a reprodución dá momentos e transicións', rep.pasos.length === 5, rep.pasos.length);
ok('empeza nun momento', rep.pasos[0].tipo === 'momento');
ok('os tempos son crecentes', rep.pasos.every((p, i) => i === 0 || p.inicio >= rep.pasos[i - 1].inicio));
ok('o total son 2×(0,5+2) = 5 s', cerca(rep.total, 5), rep.total);
ok('duracionTotal coincide', cerca(duracionTotal(R2), rep.total));
// ⚠️ Un corte non dura nada, aínda que teña `duracion` gardada.
const R3 = { ...R2, transicions: R2.transicions.map((t) => ({ ...t, tipo: 'corte', retraso: 0 })) };
ok('⚠️ un corte dura 0 aínda que teña duración gardada',
  cerca(duracionTotal(R3), 0), duracionTotal(R3));
ok('cada transición trae as súas diferenzas calculadas',
  rep.pasos.filter((p) => p.tipo === 'transicion').every((p) => typeof p.diferenzas === 'object'));

// ⚠️ Un ciclo non pode conxelar a app.
const ciclo = validar({
  ...planoBaleiro(),
  momentos: [{ id: 'a' }, { id: 'b' }],
  transicions: [{ de: 'a', a: 'b' }, { de: 'b', a: 'a' }],
});
let conxelou = true;
const cronoIni = Date.now();
try { secuencia(ciclo); conxelou = (Date.now() - cronoIni) > 1000; } catch (e) { conxelou = true; }
ok('⚠️ un ciclo de transicións non conxela a secuencia', !conxelou);

// Momentos desconectados non se perden
const solto = validar({ ...planoBaleiro(), momentos: [{ id: 'a' }, { id: 'b' }], transicions: [] });
ok('⚠️ un momento desconectado non se perde: vai ao final', secuencia(solto).length === 2);

// ── resumo ────────────────────────────────────────────────────────
const rz = resumo(D);
ok('o resumo conta os actores', rz.actores === 3, rz.actores);
ok('e os momentos', rz.momentos === 2);
// ⚠️ Non hai dous tipos de plano: é o mesmo obxecto con máis momentos.
ok('⚠️ con dous momentos, o plano é «animado»', rz.animado === true);
ok('cun só momento, non', resumo(planoBaleiro()).animado === false);
ok('o resumo dun plano baleiro non peta', resumo(null).momentos === 1);

// ── coherencia das constantes ─────────────────────────────────────
ok('as dúas capas están declaradas', CAPAS.length === 2 && CAPAS.includes('escenico') && CAPAS.includes('tecnico'));
ok('todos os tipos declaran unha capa válida',
  Object.values(TIPOS_ELEMENTO).every((t) => CAPAS.includes(t.capa)));
ok('todos os tipos declaran se son fixos',
  Object.values(TIPOS_ELEMENTO).every((t) => typeof t.fixo === 'boolean'));
ok('os tres tipos de transición', TIPOS_TRANSICION.length === 3);
ok('unha transición nace como movemento de 2 s',
  novaTransicion('a', 'b').tipo === 'movemento' && novaTransicion('a', 'b').duracion === 2);
ok('o escenario por defecto é exportable como constante',
  ESCENARIO_DEFECTO.anchoM === 6 && ESCENARIO_DEFECTO.fondoM === 4.5);
ok('colocacionBaleira mira ao público', colocacionBaleira().mirada === MIRADA_PUBLICO);

console.log(f ? `\n${f} FALLOS` : '\n✓ Todos os casos do modelo pasan');
process.exit(f ? 1 : 0);
