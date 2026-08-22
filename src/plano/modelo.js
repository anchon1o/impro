// ═══════════════════════════════════════════════════════════════════
// PLANO · modelo
// ═══════════════════════════════════════════════════════════════════
// O documento, a súa validación e a súa migración. Módulo puro: NON
// importa React, NON toca o DOM, NON fala con Supabase.
//
// ── O PLANO É A ESCENA ──────────────────────────────────────────────
//
// Non hai un nivel «escena» por riba dos momentos. Un plano cun só
// momento é un plano estático; o mesmo plano con catro momentos é unha
// secuencia. Non son dous obxectos distintos.
//
// É a mesma decisión que «a escaleta É a sesión», e polo mesmo motivo:
// nesta app «escena» xa significa «que sons están soando» (Sonido) e
// «escena narrativa» (Xerar). Un terceiro significado é o erro que xa
// custou B16 e as dúas escaletas editables.
//
//   Plano
//     ├─ escenario      medidas, reixa, forma
//     ├─ elementos[]    O REPARTO. Cada un existe UNHA vez.
//     ├─ momentos[]     onde está cada un NESE intre
//     ├─ transicions[]  como se pasa dun momento ao seguinte
//     └─ recorridos[]   liñas debuxadas, reutilizables
//
// ── UN DOCUMENTO, DÚAS CAPAS ────────────────────────────────────────
//
// Un plano ten UN escenario e DÚAS capas: `escenico` e `tecnico`. O
// selector de modo cambia as ferramentas e o que se ve, NON o
// documento. Así o plano técnico dunha sala é a mesma sala na que se
// move a xente, e non hai que medila dúas veces.
//
// ⚠️ As ferramentas non se mesturan NUNCA. A capa é do elemento, e a
// interface só ofrece as da capa activa. O documento permite as dúas;
// a interface, unha de cada vez.
//
// ── COLOCACIÓN: FIXA OU POR MOMENTO ─────────────────────────────────
//
// ⚠️ Esta é a decisión que fai que todo o demais funcione.
//
// Un elemento `fixo` garda a súa colocación NEL MESMO: está no mesmo
// sitio en todos os momentos. Un pé de micro non se move durante a
// función; ter unha copia da súa posición en cada momento significaría
// que movelo obriga a corrixir catro sitios, e que esquecer un deixa o
// micro saltando.
//
// Un elemento non fixo garda a colocación en `momento.colocacion[id]`.
//
// Por defecto: escénico → non fixo. Técnico → fixo. Pero é unha
// PROPIEDADE, non unha consecuencia da capa: un praticable que se move
// a metade da función pode ser técnico e non fixo.
//
// Léase SEMPRE por `colocacionDe()`. Ese é o punto único.
// ═══════════════════════════════════════════════════════════════════

import {
  num, clamp, clamp01, punto, normalizarReixa, normalizarAngulo,
  MIRADA_PUBLICO, interpolarPunto, interpolarAngulo, suave,
} from './xeometria.js';

export const VERSION = 1;

// ⚠️ Desde o día un. Un plano gardado hoxe ten que abrir na Fase 3. Sen
// campo de versión a única saída é adiviñar pola forma do obxecto, e
// adiviñar sempre falla co documento raro que alguén gardou a medias.

export const CAPAS = ['escenico', 'tecnico'];

export const TIPOS_ELEMENTO = {
  // capa escénica
  actor: { capa: 'escenico', fixo: false, ancho: 0.075, alto: 0.075 },
  obxecto: { capa: 'escenico', fixo: false, ancho: 0.16, alto: 0.10 },
  zona: { capa: 'escenico', fixo: true, ancho: 0.30, alto: 0.30 },
  marca: { capa: 'escenico', fixo: true, ancho: 0.05, alto: 0.05 },
  // capa técnica
  tecnico: { capa: 'tecnico', fixo: true, ancho: 0.07, alto: 0.07 },
};

// Subcapas do modo técnico. Aínda non se usan na Fase 1, pero o campo
// existe desde xa para non ter que migrar despois.
export const SUBCAPAS_TECNICAS = ['audio', 'iluminacion', 'video', 'escenografia', 'electricidade'];

export const POSTURAS = ['de-pe', 'sentado', 'agachado', 'deitado', 'elevado'];

// Cores por token semántico, NUNCA hexadecimais: así seguen os catro
// temas sen tocar nada. É a orde en que se reparten aos actores novos.
export const CORES_ACTOR = ['ok', 'accent', 'warn', 'info', 'alt', 'danger'];

export const ESCENARIO_DEFECTO = {
  anchoM: 6,
  fondoM: 4.5,           // 4:3, decidido
  forma: 'rect',
  publico: 'abaixo',
  cotas: true,
  reixa: { cols: 3, filas: 3, visible: true, numeracion: 'romana', iman: false },
};

let contador = 0;
export function novoId(pre = 'p') {
  contador += 1;
  return `${pre}-${Date.now().toString(36)}-${contador.toString(36)}`;
}

const texto = (v, d = '') => (typeof v === 'string' ? v : d);
const lista = (v) => (Array.isArray(v) ? v : []);

// ═══════════════════════════════════════════════════════════════════
// COLOCACIÓN
// ═══════════════════════════════════════════════════════════════════
// O que pode cambiar dun elemento dun momento a outro.
//
// ⚠️ `visible` está aquí e non no elemento: unha entrada é exactamente
// «no momento 1 non estaba e no momento 2 si». Se `visible` vivise no
// elemento, entrar en escena obrigaría a crear e destruír elementos, e
// o actor perdería o nome e a cor ao saír.

export function colocacionBaleira(extra = {}) {
  return {
    x: 0.5, y: 0.5,
    mirada: MIRADA_PUBLICO,
    rotacion: 0,
    postura: 'de-pe',
    foco: false,
    visible: true,
    ...extra,
  };
}

export function normalizarColocacion(c) {
  const o = c && typeof c === 'object' ? c : {};
  const p = punto(o.x !== undefined ? o.x : 0.5, o.y !== undefined ? o.y : 0.5);
  return {
    x: p.x,
    y: p.y,
    mirada: normalizarAngulo(o.mirada !== undefined ? o.mirada : MIRADA_PUBLICO),
    rotacion: normalizarAngulo(o.rotacion),
    postura: POSTURAS.includes(o.postura) ? o.postura : 'de-pe',
    foco: !!o.foco,
    visible: o.visible !== false,
  };
}

// ⚠️ PUNTO ÚNICO DE LECTURA. Todo o que queira saber onde está algo
// pasa por aquí; ninguén le `momento.colocacion` nin `elemento.pos`
// directamente. É o mesmo criterio que `paraDirecto()` nas escaletas:
// unha soa función que aplana, e todas as vistas ven o mesmo.
export function colocacionDe(plano, momentoId, elementoId) {
  const el = elementoPorId(plano, elementoId);
  if (!el) return null;
  if (el.fixo) return normalizarColocacion(el.pos);
  const m = momentoPorId(plano, momentoId);
  if (!m) return null;
  const c = m.colocacion && m.colocacion[elementoId];
  // Un elemento non fixo sen entrada nese momento é un elemento que
  // aínda non entrou. Non é un erro: é unha aparición.
  if (!c) return null;
  return normalizarColocacion(c);
}

// Escribe respectando o mesmo criterio. Devolve un plano NOVO.
export function establecerColocacion(plano, momentoId, elementoId, parcial) {
  const P = validar(plano);
  const el = elementoPorId(P, elementoId);
  if (!el) return P;
  if (el.fixo) {
    return {
      ...P,
      elementos: P.elementos.map((e) => (e.id === elementoId
        ? { ...e, pos: normalizarColocacion({ ...e.pos, ...parcial }) } : e)),
    };
  }
  return {
    ...P,
    momentos: P.momentos.map((m) => (m.id === momentoId
      ? {
        ...m,
        colocacion: {
          ...m.colocacion,
          [elementoId]: normalizarColocacion({ ...(m.colocacion[elementoId] || colocacionBaleira()), ...parcial }),
        },
      }
      : m)),
  };
}

// ═══════════════════════════════════════════════════════════════════
// ELEMENTOS
// ═══════════════════════════════════════════════════════════════════

export function novoElemento(tipo = 'actor', extra = {}) {
  const base = TIPOS_ELEMENTO[tipo] || TIPOS_ELEMENTO.actor;
  const t = TIPOS_ELEMENTO[tipo] ? tipo : 'actor';
  const el = {
    id: novoId('el'),
    tipo: t,
    capa: base.capa,
    fixo: base.fixo,
    nome: '',
    numero: null,
    cor: 'accent',
    simbolo: t === 'actor' ? null : 'caixa',
    ancho: base.ancho,
    alto: base.alto,
    bloqueado: false,
    grupo: null,
    ...extra,
  };
  // ⚠️ Un elemento fixo precisa `pos` desde o principio; se non, o
  // primeiro `colocacionDe` devolve o defecto e ao gardar aparece no
  // centro sen que ninguén o movese.
  if (el.fixo && !el.pos) el.pos = colocacionBaleira();
  if (el.capa === 'tecnico' && !el.subcapa) el.subcapa = 'audio';
  if (el.capa === 'tecnico' && !el.meta) el.meta = {};
  return el;
}

export function normalizarElemento(e) {
  const o = e && typeof e === 'object' ? e : {};
  const tipo = TIPOS_ELEMENTO[o.tipo] ? o.tipo : 'actor';
  const base = TIPOS_ELEMENTO[tipo];
  const capa = CAPAS.includes(o.capa) ? o.capa : base.capa;
  const fixo = typeof o.fixo === 'boolean' ? o.fixo : base.fixo;
  const el = {
    id: texto(o.id) || novoId('el'),
    tipo,
    capa,
    fixo,
    nome: texto(o.nome),
    numero: typeof o.numero === 'number' && Number.isFinite(o.numero) ? o.numero : null,
    cor: texto(o.cor, 'accent'),
    simbolo: o.simbolo === null ? null : texto(o.simbolo) || null,
    ancho: clamp(num(o.ancho, base.ancho), 0.005, 1),
    alto: clamp(num(o.alto, base.alto), 0.005, 1),
    bloqueado: !!o.bloqueado,
    grupo: texto(o.grupo) || null,
  };
  if (fixo) el.pos = normalizarColocacion(o.pos);
  if (tipo === 'zona') el.puntos = lista(o.puntos).map((p) => punto(p && p.x, p && p.y));
  if (tipo === 'actor' && o.figura && typeof o.figura === 'object') el.figura = { ...o.figura };
  if (capa === 'tecnico') {
    el.subcapa = SUBCAPAS_TECNICAS.includes(o.subcapa) ? o.subcapa : 'audio';
    el.meta = o.meta && typeof o.meta === 'object' ? { ...o.meta } : {};
  }
  return el;
}

export const elementoPorId = (plano, id) => lista(plano && plano.elementos).find((e) => e.id === id) || null;
export const elementosDaCapa = (plano, capa) => lista(plano && plano.elementos).filter((e) => e.capa === capa);

// ⚠️ Borrar un elemento non é quitalo do array. Quedan tres rastros que
// hai que limpar, e esquecer calquera deles deixa o documento apuntando
// a algo que xa non existe:
//   1. a súa colocación en TODOS os momentos
//   2. os recorridos asignados a el
//   3. as traxectorias que o nomean nas transicións
export function borrarElemento(plano, id) {
  const P = validar(plano);
  if (!elementoPorId(P, id)) return P;
  return validar({
    ...P,
    elementos: P.elementos.filter((e) => e.id !== id),
    momentos: P.momentos.map((m) => {
      const c = { ...m.colocacion };
      delete c[id];
      return { ...m, colocacion: c };
    }),
    recorridos: P.recorridos.filter((r) => r.elementoId !== id),
    transicions: P.transicions.map((t) => {
      const tr = { ...t.traxectorias };
      delete tr[id];
      return { ...t, traxectorias: tr };
    }),
  });
}

export function engadirElemento(plano, elemento, momentoId = null) {
  const P = validar(plano);
  const el = normalizarElemento(elemento);
  const seguinte = { ...P, elementos: [...P.elementos, el] };
  if (el.fixo) return validar(seguinte);

  // ⚠️ Non fixo: nace no momento no que estabas E SEGUE NOS DE DESPOIS.
  //
  // Poñelo só no momento activo parece o obvio e é o erro: engades un
  // actor no momento 2 dunha secuencia de catro e desaparece no 3 sen
  // que ninguén o botase. Nos ANTERIORES si que non está —aínda non
  // entrara, que é o que se quere—, pero cara adiante persiste ata que
  // alguén decida sacalo.
  const mId = momentoId || (P.momentos[0] && P.momentos[0].id);
  const orde = secuencia(seguinte);
  const desde = Math.max(0, orde.findIndex((m) => m.id === mId));
  const col = colocacionBaleira();
  return validar({
    ...seguinte,
    momentos: seguinte.momentos.map((m) => {
      const pos = orde.findIndex((x) => x.id === m.id);
      if (pos < desde) return m;
      return { ...m, colocacion: { ...m.colocacion, [el.id]: { ...col } } };
    }),
  });
}

// Reparte cor e número aos actores novos sen repetir mentres haxa.
export function seguinteCorActor(plano) {
  const usadas = elementosDaCapa(plano, 'escenico').filter((e) => e.tipo === 'actor').map((e) => e.cor);
  return CORES_ACTOR.find((c) => !usadas.includes(c)) || CORES_ACTOR[usadas.length % CORES_ACTOR.length];
}

export function seguinteNumeroActor(plano) {
  const nums = lista(plano && plano.elementos)
    .filter((e) => e.tipo === 'actor' && typeof e.numero === 'number')
    .map((e) => e.numero);
  let n = 1;
  while (nums.includes(n)) n += 1;
  return n;
}

// ═══════════════════════════════════════════════════════════════════
// MOMENTOS
// ═══════════════════════════════════════════════════════════════════

export function normalizarMomento(m) {
  const o = m && typeof m === 'object' ? m : {};
  const col = {};
  const c = o.colocacion && typeof o.colocacion === 'object' ? o.colocacion : {};
  Object.keys(c).forEach((k) => { col[k] = normalizarColocacion(c[k]); });
  return {
    id: texto(o.id) || novoId('m'),
    nome: texto(o.nome),
    // ⚠️ `null` e 0 non son o mesmo: null é «sen duración indicada» e 0
    // sería un momento instantáneo. Por iso non vale `num(o.duracion,0)`.
    duracion: typeof o.duracion === 'number' && Number.isFinite(o.duracion) && o.duracion >= 0 ? o.duracion : null,
    colocacion: col,
  };
}

export const momentoPorId = (plano, id) => lista(plano && plano.momentos).find((m) => m.id === id) || null;
export const indiceMomento = (plano, id) => lista(plano && plano.momentos).findIndex((m) => m.id === id);

// ⚠️ Un momento novo DUPLICA o anterior. É o que se espera: «coma o de
// antes pero con isto cambiado». Nacer baleiro obrigaría a recolocar
// todo o reparto cada vez, e ninguén faría máis dun momento.
export function novoMomento(plano, baseId = null) {
  const P = validar(plano);
  const base = baseId ? momentoPorId(P, baseId) : P.momentos[P.momentos.length - 1];
  const m = {
    id: novoId('m'),
    nome: '',
    duracion: null,
    colocacion: base ? JSON.parse(JSON.stringify(base.colocacion)) : {},
  };
  const idx = base ? indiceMomento(P, base.id) + 1 : P.momentos.length;
  const momentos = [...P.momentos.slice(0, idx), m, ...P.momentos.slice(idx)];
  const seguinte = { ...P, momentos };
  // Encadéase automaticamente co anterior: crear un momento solto que
  // haxa que conectar á man é un paso que ninguén entende.
  if (base) {
    const rota = P.transicions.find((t) => t.de === base.id);
    let transicions = P.transicions.map((t) => (t.de === base.id ? { ...t, de: m.id } : t));
    transicions = [...transicions, novaTransicion(base.id, m.id, rota ? { tipo: rota.tipo } : {})];
    seguinte.transicions = transicions;
  }
  return validar(seguinte);
}

// ⚠️ Borrar un momento intermedio ten que RECONECTAR. Se hai 1→2→3 e
// se borra o 2, ten que quedar 1→3. Se non, a secuencia párase no un
// e o tres queda inalcanzable sen que se vexa por que.
export function borrarMomento(plano, id) {
  const P = validar(plano);
  if (P.momentos.length <= 1) return P;      // sempre queda un
  const entra = P.transicions.find((t) => t.a === id);
  const sae = P.transicions.find((t) => t.de === id);
  let transicions = P.transicions.filter((t) => t.de !== id && t.a !== id);
  if (entra && sae && entra.de !== sae.a) {
    transicions = [...transicions, novaTransicion(entra.de, sae.a, { tipo: entra.tipo, duracion: entra.duracion })];
  }
  return validar({ ...P, momentos: P.momentos.filter((m) => m.id !== id), transicions });
}

// ═══════════════════════════════════════════════════════════════════
// TRANSICIÓNS
// ═══════════════════════════════════════════════════════════════════

export const TIPOS_TRANSICION = ['corte', 'movemento', 'fundido'];

export function novaTransicion(de, a, extra = {}) {
  return {
    id: novoId('t'),
    de, a,
    tipo: 'movemento',
    duracion: 2,
    retraso: 0,
    orde: 'simultaneo',       // ou 'secuencial'
    traxectorias: {},         // elementoId → 'recta' | 'curva' | id dun recorrido
    ...extra,
  };
}

export function normalizarTransicion(t) {
  const o = t && typeof t === 'object' ? t : {};
  const tx = {};
  const src = o.traxectorias && typeof o.traxectorias === 'object' ? o.traxectorias : {};
  Object.keys(src).forEach((k) => { if (typeof src[k] === 'string') tx[k] = src[k]; });
  return {
    id: texto(o.id) || novoId('t'),
    de: texto(o.de),
    a: texto(o.a),
    tipo: TIPOS_TRANSICION.includes(o.tipo) ? o.tipo : 'movemento',
    duracion: Math.max(0, num(o.duracion, 2)),
    retraso: Math.max(0, num(o.retraso, 0)),
    orde: o.orde === 'secuencial' ? 'secuencial' : 'simultaneo',
    traxectorias: tx,
  };
}

// ═══════════════════════════════════════════════════════════════════
// RECORRIDOS
// ═══════════════════════════════════════════════════════════════════

export const ESTILOS_LINA = ['punteado', 'continuo', 'raiado'];

export function novoRecorrido(puntos = [], extra = {}) {
  return {
    id: novoId('r'),
    elementoId: null,
    puntos: lista(puntos).map((p) => punto(p && p.x, p && p.y)),
    estilo: 'punteado',
    frechaFinal: true,
    tension: 0.5,
    ...extra,
  };
}

export function normalizarRecorrido(r) {
  const o = r && typeof r === 'object' ? r : {};
  return {
    id: texto(o.id) || novoId('r'),
    elementoId: texto(o.elementoId) || null,
    puntos: lista(o.puntos).map((p) => punto(p && p.x, p && p.y)),
    estilo: ESTILOS_LINA.includes(o.estilo) ? o.estilo : 'punteado',
    frechaFinal: o.frechaFinal !== false,
    tension: clamp(num(o.tension, 0.5), 0, 1),
  };
}

// ═══════════════════════════════════════════════════════════════════
// O DOCUMENTO
// ═══════════════════════════════════════════════════════════════════

export function planoBaleiro(nome = 'Plano novo') {
  return {
    id: novoId('pl'),
    nome,
    notas: '',
    version: VERSION,
    // ⚠️ O modo NON está no documento: é o estado da interface. Un plano
    // ten as dúas capas sempre (decisión B). Gárdase `modoUltimo` só
    // para reabrir por onde ías, e non ten efecto ningún nos datos.
    modoUltimo: 'escenico',
    grupoId: null,
    userId: null,
    escenario: JSON.parse(JSON.stringify(ESCENARIO_DEFECTO)),
    elementos: [],
    momentos: [{ id: novoId('m'), nome: '', duracion: null, colocacion: {} }],
    transicions: [],
    recorridos: [],
  };
}

export function normalizarEscenario(e) {
  const o = e && typeof e === 'object' ? e : {};
  return {
    anchoM: clamp(num(o.anchoM, ESCENARIO_DEFECTO.anchoM), 1, 60),
    fondoM: clamp(num(o.fondoM, ESCENARIO_DEFECTO.fondoM), 1, 60),
    forma: texto(o.forma, 'rect'),
    publico: texto(o.publico, 'abaixo'),
    cotas: o.cotas !== false,
    reixa: normalizarReixa(o.reixa),
  };
}

// ⚠️ Idempotente e defensiva. Chámase ao cargar, antes de gardar e
// despois de cada operación. Un documento que veña dun `localStorage`
// vello, dun JSON editado á man ou dunha versión anterior sae de aquí
// utilizable ou non sae.
export function validar(plano) {
  const o = plano && typeof plano === 'object' ? plano : {};
  const elementos = lista(o.elementos).map(normalizarElemento);
  const idsEl = new Set(elementos.map((e) => e.id));

  let momentos = lista(o.momentos).map(normalizarMomento);
  // ⚠️ SEMPRE hai polo menos un momento. Un plano con cero momentos non
  // se pode debuxar, e é o estado no que quedaría ao borrar o último.
  if (momentos.length === 0) momentos = [{ id: novoId('m'), nome: '', duracion: null, colocacion: {} }];

  // Colocacións orfas: apuntan a elementos borrados noutra sesión.
  momentos = momentos.map((m) => {
    const col = {};
    Object.keys(m.colocacion).forEach((k) => { if (idsEl.has(k)) col[k] = m.colocacion[k]; });
    return { ...m, colocacion: col };
  });

  const idsM = new Set(momentos.map((m) => m.id));
  const vistas = new Set();
  const transicions = lista(o.transicions).map(normalizarTransicion).filter((t) => {
    // Fóra as que apuntan a momentos que xa non están, as que van dun
    // momento a si mesmo, e as duplicadas.
    if (!idsM.has(t.de) || !idsM.has(t.a) || t.de === t.a) return false;
    const clave = `${t.de}>${t.a}`;
    if (vistas.has(clave)) return false;
    vistas.add(clave);
    return true;
  }).map((t) => {
    const tx = {};
    Object.keys(t.traxectorias).forEach((k) => { if (idsEl.has(k)) tx[k] = t.traxectorias[k]; });
    return { ...t, traxectorias: tx };
  });

  const recorridos = lista(o.recorridos).map(normalizarRecorrido)
    .map((r) => (r.elementoId && !idsEl.has(r.elementoId) ? { ...r, elementoId: null } : r));

  return {
    id: texto(o.id) || novoId('pl'),
    nome: texto(o.nome, 'Plano novo'),
    notas: texto(o.notas),
    version: VERSION,
    modoUltimo: CAPAS.includes(o.modoUltimo) ? o.modoUltimo : 'escenico',
    grupoId: texto(o.grupoId) || null,
    userId: texto(o.userId) || null,
    escenario: normalizarEscenario(o.escenario),
    elementos, momentos, transicions, recorridos,
  };
}

// ⚠️ Migración. Hoxe só hai a versión 1, así que non fai nada máis que
// validar; existe desde xa para que engadir a 2 sexa un `if` e non unha
// arqueoloxía. `validar()` xa repara a maioría dos ocos.
export function migrar(doc) {
  const o = doc && typeof doc === 'object' ? doc : {};
  const v = num(o.version, 0);
  let saida = o;
  if (v < 1) saida = { ...saida, version: 1 };
  return validar(saida);
}

// ═══════════════════════════════════════════════════════════════════
// SECUENCIA
// ═══════════════════════════════════════════════════════════════════

// A cadea de momentos seguindo as transicións desde o primeiro.
// ⚠️ Con tope de voltas: un documento estragado podería ter un ciclo, e
// un `while` sen tope conxela a pestana sen mensaxe de erro.
export function secuencia(plano) {
  const P = validar(plano);
  if (P.momentos.length === 0) return [];
  const porDe = new Map(P.transicions.map((t) => [t.de, t]));
  const orde = [];
  const vistos = new Set();
  let actual = P.momentos[0];
  let voltas = 0;
  while (actual && !vistos.has(actual.id) && voltas <= P.momentos.length) {
    orde.push(actual);
    vistos.add(actual.id);
    const t = porDe.get(actual.id);
    actual = t ? momentoPorId(P, t.a) : null;
    voltas += 1;
  }
  // Os momentos soltos —creados e desconectados— van ao final: mellor
  // velos ao final que perdelos.
  P.momentos.forEach((m) => { if (!vistos.has(m.id)) orde.push(m); });
  return orde;
}

// ⚠️ NON TODO CAMBIO IMPLICA MOVEMENTO.
//
// Compara dous momentos campo a campo e di, por elemento, que cambia de
// verdade. É o que permite que un cambio de mirada anime só o ángulo, e
// que unha aparición non arrastre a ninguén polo escenario.
export function diferenzas(plano, deId, aId) {
  const P = validar(plano);
  const out = {};
  P.elementos.forEach((el) => {
    const a = colocacionDe(P, deId, el.id);
    const b = colocacionDe(P, aId, el.id);
    if (!a && !b) return;
    if (!a && b) { out[el.id] = { accion: 'aparece', ata: b }; return; }
    if (a && !b) { out[el.id] = { accion: 'desaparece', desde: a }; return; }
    if (a.visible && !b.visible) { out[el.id] = { accion: 'desaparece', desde: a, ata: b }; return; }
    if (!a.visible && b.visible) { out[el.id] = { accion: 'aparece', desde: a, ata: b }; return; }
    const cambios = [];
    if (Math.abs(a.x - b.x) > 1e-4 || Math.abs(a.y - b.y) > 1e-4) cambios.push('move');
    if (Math.abs(a.mirada - b.mirada) > 0.5) cambios.push('mirada');
    if (Math.abs(a.rotacion - b.rotacion) > 0.5) cambios.push('rotacion');
    if (a.postura !== b.postura) cambios.push('postura');
    if (a.foco !== b.foco) cambios.push('foco');
    if (cambios.length === 0) { out[el.id] = { accion: 'mantense', desde: a, ata: b, cambios: [] }; return; }
    out[el.id] = { accion: 'cambia', desde: a, ata: b, cambios };
  });
  return out;
}

// Interpola a colocación dun elemento entre dous momentos.
// ⚠️ A mirada vai polo camiño curto (350°→10° son 20°, non 340°), e
// a postura non se interpola: cambia á metade. Non hai media postura
// entre «de pé» e «sentado».
export function interpolar(desde, ata, t, opcions = {}) {
  if (!desde) return ata ? { ...ata } : null;
  if (!ata) return { ...desde };
  const f = opcions.lineal ? clamp01(t) : suave(t);
  const p = opcions.punto || interpolarPunto(desde, ata, f);
  return {
    x: p.x, y: p.y,
    mirada: interpolarAngulo(desde.mirada, ata.mirada, f),
    rotacion: interpolarAngulo(desde.rotacion, ata.rotacion, f),
    postura: f < 0.5 ? desde.postura : ata.postura,
    foco: f < 0.5 ? desde.foco : ata.foco,
    visible: desde.visible || ata.visible,
  };
}

// ⚠️ Aplánase UNHA SOA VEZ, igual que `paraDirecto()` nas escaletas: se
// a liña de tempo, a reprodución e a exportación de secuencia fixesen
// cada unha as súas contas, poderían discrepar nos tempos.
export function paraReproducir(plano) {
  const P = validar(plano);
  const orde = secuencia(P);
  const porPar = new Map(P.transicions.map((t) => [`${t.de}>${t.a}`, t]));
  const pasos = [];
  let reloxo = 0;
  orde.forEach((m, i) => {
    pasos.push({ tipo: 'momento', momentoId: m.id, nome: m.nome, indice: i, inicio: reloxo, duracion: m.duracion || 0 });
    reloxo += m.duracion || 0;
    const seg = orde[i + 1];
    if (!seg) return;
    const t = porPar.get(`${m.id}>${seg.id}`);
    if (!t) return;
    const dur = t.tipo === 'corte' ? 0 : t.duracion;
    pasos.push({
      tipo: 'transicion', transicionId: t.id, de: m.id, a: seg.id,
      modo: t.tipo, inicio: reloxo + t.retraso, duracion: dur, orde: t.orde,
      diferenzas: diferenzas(P, m.id, seg.id),
    });
    reloxo += t.retraso + dur;
  });
  return { pasos, total: reloxo };
}

export const duracionTotal = (plano) => paraReproducir(plano).total;

// Resumo para a lista de planos, sen ter que abrir o documento.
export function resumo(plano) {
  const P = validar(plano);
  return {
    id: P.id,
    nome: P.nome,
    actores: P.elementos.filter((e) => e.tipo === 'actor').length,
    elementos: P.elementos.length,
    tecnicos: elementosDaCapa(P, 'tecnico').length,
    momentos: P.momentos.length,
    // Un plano cun só momento é estático. Non hai dous tipos de plano:
    // é o mesmo obxecto con máis ou menos momentos.
    animado: P.momentos.length > 1,
    segundos: duracionTotal(P),
  };
}

// ═══════════════════════════════════════════════════════════════════
// RECORRIDOS · altas e baixas
// ═══════════════════════════════════════════════════════════════════

export function engadirRecorrido(plano, puntos, extra = {}) {
  const P = validar(plano);
  const r = normalizarRecorrido(novoRecorrido(puntos, extra));
  // ⚠️ Un recorrido dun só punto é un toque accidental, non un trazo.
  // Se se garda, queda unha mancha no plano que non se ve pero si se
  // selecciona, e ninguén entende por que se lle abre o inspector ao
  // tocar no baleiro.
  if (r.puntos.length < 2) return P;
  return validar({ ...P, recorridos: [...P.recorridos, r] });
}

export function borrarRecorrido(plano, id) {
  const P = validar(plano);
  return validar({ ...P, recorridos: P.recorridos.filter((r) => r.id !== id) });
}

export function mudarRecorrido(plano, id, parcial) {
  const P = validar(plano);
  return validar({
    ...P,
    recorridos: P.recorridos.map((r) => (r.id === id ? normalizarRecorrido({ ...r, ...parcial }) : r)),
  });
}

export const recorridoPorId = (plano, id) => lista(plano && plano.recorridos).find((r) => r.id === id) || null;

// Os recorridos dun elemento, ou os que non teñen dono.
export const recorridosDe = (plano, elementoId) => lista(plano && plano.recorridos)
  .filter((r) => r.elementoId === (elementoId || null));
