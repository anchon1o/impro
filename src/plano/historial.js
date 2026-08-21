// ═══════════════════════════════════════════════════════════════════
// PLANO · historial (desfacer / refacer)
// ═══════════════════════════════════════════════════════════════════
// Módulo puro. NON importa React.
//
// ⚠️ Instantáneas completas, non parches.
//
// Un plano son uns poucos kB; 50 instantáneas son menos que unha foto.
// Os parches (gardar só o que cambiou) aforran memoria que aquí non fai
// falta e traen o bug de sempre: un parche mal aplicado deixa o
// documento nun estado que nunca existiu, e non se descobre ata tres
// pasos despois. Con instantáneas, desfacer é ler unha posición dun
// array.
//
// ⚠️ FUSIÓN DE PASOS. Arrastrar un actor dispara un evento por cada
// movemento do dedo: sen fusionar, un arrastre enche o historial de 200
// entradas e desfacer tería que premerse 200 veces para desfacer UN
// xesto. Os pasos coa mesma etiqueta e próximos no tempo colapsan nun.
// ═══════════════════════════════════════════════════════════════════

export const TOPE = 50;
export const MS_FUSION = 700;

export function crear(estadoInicial, opcions = {}) {
  return {
    pasos: [estadoInicial],
    pos: 0,
    tope: Math.max(2, Number.isFinite(opcions.tope) ? opcions.tope : TOPE),
    msFusion: Number.isFinite(opcions.msFusion) ? opcions.msFusion : MS_FUSION,
    etiqueta: null,
    marca: 0,
  };
}

export const actual = (h) => (h && Array.isArray(h.pasos) ? h.pasos[h.pos] : undefined);
export const podeDesfacer = (h) => !!h && h.pos > 0;
export const podeRefacer = (h) => !!h && Array.isArray(h.pasos) && h.pos < h.pasos.length - 1;

// Devolve un historial NOVO. `etiqueta` identifica o xesto: dous
// `push` seguidos con 'mover:el-3' dentro da xanela de fusión son un só
// paso. `agora` inxéctase para poder probar sen esperar de verdade.
export function push(h, estado, opcions = {}) {
  if (!h) return crear(estado, opcions);
  const agora = Number.isFinite(opcions.agora) ? opcions.agora : Date.now();
  const etiqueta = typeof opcions.etiqueta === 'string' ? opcions.etiqueta : null;

  const fusiona = etiqueta !== null
    && etiqueta === h.etiqueta
    && (agora - h.marca) <= h.msFusion
    && h.pos >= 0;

  if (fusiona) {
    // Substitúe o último en vez de engadir. ⚠️ Hai que recortar tamén o
    // que houbese despois: se se desfixo e despois se arrastra, o
    // futuro que quedaba xa non ten sentido.
    const pasos = h.pasos.slice(0, h.pos);
    pasos.push(estado);
    return { ...h, pasos, pos: pasos.length - 1, etiqueta, marca: agora };
  }

  // ⚠️ Un paso novo despois de desfacer BOTA o futuro. É o
  // comportamento de calquera editor: se volves atrás e cambias algo,
  // a rama que había deixa de existir.
  let pasos = h.pasos.slice(0, h.pos + 1);
  pasos.push(estado);
  // Tope. Recórtase polo principio, non polo final.
  if (pasos.length > h.tope) pasos = pasos.slice(pasos.length - h.tope);
  return { ...h, pasos, pos: pasos.length - 1, etiqueta, marca: agora };
}

export function desfacer(h) {
  if (!podeDesfacer(h)) return h;
  // ⚠️ Limpar a etiqueta ao desfacer. Se non, un arrastre → desfacer →
  // arrastre fusionaríase co primeiro e desfacer non faría nada visible.
  return { ...h, pos: h.pos - 1, etiqueta: null, marca: 0 };
}

export function refacer(h) {
  if (!podeRefacer(h)) return h;
  return { ...h, pos: h.pos + 1, etiqueta: null, marca: 0 };
}

// Corta a fusión sen engadir nada. Chámase ao soltar o dedo: o
// seguinte arrastre do mesmo elemento xa é outro paso.
export const pechar = (h) => (h ? { ...h, etiqueta: null, marca: 0 } : h);

// Substitúe o estado actual sen crear paso. Para cambios que non deben
// entrar no historial (abrir un panel, cambiar de momento activo).
export function reemprazar(h, estado) {
  if (!h) return crear(estado);
  const pasos = h.pasos.slice();
  pasos[h.pos] = estado;
  return { ...h, pasos };
}

export const tamaño = (h) => (h && Array.isArray(h.pasos) ? h.pasos.length : 0);
