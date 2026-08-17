// ═══════════════════════════════════════════════════════════════════
// SONIDO · estado da mesa
// ═══════════════════════════════════════════════════════════════════
// Garda o que ten que sobrevivir a pechar a app: contadores e volumes.
//
// Vai a localStorage e non a Supabase por dous motivos: funciona sen
// rede (risco R2) e sen conta (§11 — usar Sonido sen rexistrarse ten
// que ser posible). Cando existan as Mesas gardadas, isto pasa a ser
// o borrador local dunha delas, non desaparece.
//
// ⚠️ O QUE NON SE RESTAURA: que capas estaban soando.
// Dous motivos, e os dous son importantes:
//   1. iOS non deixa reproducir sen un xesto do usuario, así que
//      «restaurar» sería mentira: quedaría marcado como aceso e mudo.
//   2. Abrir a app e que empece a soar unha tormenta é hostil. Peor
//      aínda se pasa nun ensaio ou nun sitio público.
// Restáuranse os VOLUMES, que é o traballo que custa; acender é un
// toque, e ten que ser decisión de quen está diante.
// ═══════════════════════════════════════════════════════════════════

import { serializar, deserializar } from './contadores.js';

const CLAVE = 'impro_sonido_mesa_v1';

const VOLS_POR_DEFECTO = { musica: 0.8, ambientes: 0.8, efectos: 0.8, master: 0.8 };

export function cargarMesa() {
  try {
    const cru = localStorage.getItem(CLAVE);
    if (!cru) return { contadores: [], volBus: { ...VOLS_POR_DEFECTO }, volRecurso: {} };
    const d = JSON.parse(cru);
    return {
      contadores: deserializar(d.contadores),
      volBus: sanearBuses(d.volBus),
      volRecurso: sanearRecursos(d.volRecurso),
    };
  } catch (e) {
    // Un JSON corrupto non pode impedir abrir a mesa.
    return { contadores: [], volBus: { ...VOLS_POR_DEFECTO }, volRecurso: {} };
  }
}

export function gardarMesa({ contadores, volBus, volRecurso }) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({
      contadores: serializar(contadores),
      volBus: sanearBuses(volBus),
      volRecurso: sanearRecursos(volRecurso),
      en: Date.now(),
    }));
    return true;
  } catch (e) {
    return false;   // cota chea ou modo privado: non é motivo para romper nada
  }
}

export function baleirarMesa() {
  try { localStorage.removeItem(CLAVE); return true; } catch (e) { return false; }
}

// Un volume fóra de rango ou non numérico deixaría a mesa muda ou
// saturada sen explicación. Sanéase sempre ao ler e ao escribir.
// ⚠️ NON usar `Number(v)` como filtro. `Number(null)`, `Number('')`,
// `Number(false)` e `Number([])` son TODOS 0, e un 0 é un volume
// perfectamente válido: un dato ausente convertíase en silencio e a
// mesa abría muda sen dicir por que.
// Por iso se acepta por tipo e non por conversión: número, ou cadea
// que non estea baleira. Todo o demais cae ao defecto.
function nivel(v, porDefecto) {
  const n = numeroOuNada(v);
  return n === null ? porDefecto : Math.min(1, Math.max(0, n));
}

function numeroOuNada(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function sanearBuses(v) {
  const fóra = { ...VOLS_POR_DEFECTO };
  if (!v || typeof v !== 'object') return fóra;
  for (const k of Object.keys(VOLS_POR_DEFECTO)) fóra[k] = nivel(v[k], VOLS_POR_DEFECTO[k]);
  return fóra;
}

function sanearRecursos(v) {
  const fóra = {};
  if (!v || typeof v !== 'object') return fóra;
  for (const [id, x] of Object.entries(v)) {
    if (typeof id !== 'string' || !id) continue;
    // Aquí un valor ausente DESCÁRTASE en vez de caer a un defecto: se
    // non hai volume gardado para este son, manda o do propio recurso.
    const n = numeroOuNada(x);
    if (n !== null) fóra[id] = Math.min(1, Math.max(0, n));
  }
  return fóra;
}
