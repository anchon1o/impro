// ═══════════════════════════════════════════════════════════════════
// SONIDO · mesas
// ═══════════════════════════════════════════════════════════════════
// Unha Mesa é a configuración de traballo: QUE sons tes diante e como.
// Con seis sons non fai falta; con douscentos, é a diferenza entre unha
// mesa e unha lista inmanexable.
//
// Dous almacéns, e non é unha duplicación gratuíta:
//   · SEN CONTA → localStorage. O §11 esixe poder usar Sonido sen
//     rexistrarse, e unha mesa é xusto o que quere gardar quen aínda
//     está probando a ferramenta.
//   · CON CONTA → Supabase (`son_coleccions` con tipo='mesa'), para
//     telas noutro aparello.
//
// ⚠️ As mesas locais NON se soben soas ao iniciar sesión. Facelo sen
// preguntar mestura o que estabas probando co que xa tiñas gardado, e
// non hai volta atrás. `migrables()` di cales se poderían subir; a
// decisión é de quen está diante.
//
// ⚠️ Unha mesa garda IDs de recursos, non os sons. Se un son desaparece
// (borrado do dispositivo, despublicado), a mesa segue sendo válida e
// simplemente ten un oco: `resolverMesa` dío en vez de petar.
// ═══════════════════════════════════════════════════════════════════

import { getColeccions, gardarColeccion, gardarItems, getItems } from './recursos.js';
import { serializar, deserializar } from './contadores.js';

const CLAVE = 'impro_sonido_mesas_v1';

const VOLS = { musica: 0.8, ambientes: 0.8, efectos: 0.8, master: 0.8 };

let contador = 0;
function novoId() {
  contador += 1;
  return 'local-' + Date.now().toString(36) + '-' + contador.toString(36);
}

export function mesaBaleira(nome = 'Mesa nova') {
  return {
    id: novoId(),
    nome,
    emoji: '🎛',
    recursoIds: [],
    volRecurso: {},
    volBus: { ...VOLS },
    contadores: [],
    // A que grupo pertence. `null` = persoal, vese sempre.
    grupoId: null,
    local: true,
  };
}

// ── Local ────────────────────────────────────────────────────────
function lerLocais() {
  try {
    const cru = localStorage.getItem(CLAVE);
    if (!cru) return [];
    const d = JSON.parse(cru);
    return Array.isArray(d) ? d.map(sanear).filter(Boolean) : [];
  } catch (e) { return []; }
}

function escribirLocais(lista) {
  try { localStorage.setItem(CLAVE, JSON.stringify(lista)); return true; }
  catch (e) { return false; }
}

// Toda mesa que entra pasa por aquí, veña de onde veña. Un dato raro
// nunha mesa non pode impedir abrir Sonido.
function sanear(m) {
  if (!m || typeof m !== 'object' || !m.id) return null;
  return {
    id: String(m.id),
    nome: typeof m.nome === 'string' && m.nome.trim() ? m.nome.trim() : 'Sen nome',
    emoji: typeof m.emoji === 'string' ? m.emoji : '🎛',
    recursoIds: Array.isArray(m.recursoIds) ? m.recursoIds.filter((x) => typeof x === 'string' && x) : [],
    volRecurso: sanearVols(m.volRecurso),
    volBus: { ...VOLS, ...sanearVols(m.volBus, VOLS) },
    contadores: deserializar(m.contadores),
    grupoId: m.grupoId || m.grupo_id || null,
    local: m.local !== false,
  };
}

// Mesmo criterio que en mesa.js: acéptase por tipo, non por conversión.
// `Number(null)` e `Number([])` son 0, e un 0 é un volume válido: un
// dato ausente convertiríase en silencio.
function numeroOuNada(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function sanearVols(v, defectos = null) {
  const fóra = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return defectos ? { ...defectos } : fóra;
  for (const [k, x] of Object.entries(v)) {
    if (typeof k !== 'string' || !k) continue;
    const n = numeroOuNada(x);
    if (n !== null) fóra[k] = Math.min(1, Math.max(0, n));
    else if (defectos && k in defectos) fóra[k] = defectos[k];
  }
  return fóra;
}

// ── Cargar ───────────────────────────────────────────────────────
export async function cargarMesas(userId) {
  const locais = lerLocais();
  if (!userId) return { mesas: locais, motivo: null };

  try {
    const cols = await getColeccions({ tipo: 'mesa', soMeus: true, userId });
    if (cols.motivo === 'sen-conexion') {
      // Sen rede as mesas remotas non se poden ler, pero as locais si.
      // Mellor abrir con parte que non abrir.
      return { mesas: locais, motivo: 'sen-conexion' };
    }
    const remotas = [];
    for (const c of cols) {
      const items = await getItems(c.id);
      const cfg = c.config || {};
      remotas.push(sanear({
        id: c.id,
        nome: c.nome,
        emoji: c.emoji || '🎛',
        grupoId: c.grupoId,
        recursoIds: items.map((i) => i.recursoId).filter(Boolean),
        volRecurso: cfg.volRecurso,
        volBus: cfg.volBus,
        contadores: cfg.contadores,
        local: false,
      }));
    }
    return { mesas: [...remotas, ...locais], motivo: null };
  } catch (e) {
    return { mesas: locais, motivo: 'sen-conexion' };
  }
}

// ── Gardar ───────────────────────────────────────────────────────
export async function gardarMesaNomeada(mesa, userId) {
  const m = sanear(mesa);
  if (!m) return { ok: false, erro: 'Mesa non válida' };
  if (!m.nome || m.nome === 'Sen nome') return { ok: false, erro: 'Ponlle un nome á mesa' };

  // Sen conta, ou mesa marcada como local: queda no aparello.
  if (!userId || m.local) {
    const lista = lerLocais();
    const i = lista.findIndex((x) => x.id === m.id);
    if (i >= 0) lista[i] = m; else lista.push(m);
    return escribirLocais(lista)
      ? { ok: true, mesa: m }
      : { ok: false, erro: 'Non hai espazo para gardar a mesa' };
  }

  const r = await gardarColeccion({
    id: m.id.startsWith('local-') ? undefined : m.id,
    tipo: 'mesa', nome: m.nome, emoji: m.emoji, grupoId: m.grupoId,
    config: {
      volBus: m.volBus,
      volRecurso: m.volRecurso,
      contadores: serializar(m.contadores),
    },
    visibilidade: 'privado', estado: 'borrador', userId,
  });
  if (!r.ok) return r;

  const id = r.coleccion.id;
  const it = await gardarItems(id, m.recursoIds.map((rid) => ({ recursoId: rid })));
  if (!it.ok) return it;
  return { ok: true, mesa: { ...m, id, local: false } };
}

export function borrarMesaLocal(id) {
  return escribirLocais(lerLocais().filter((m) => m.id !== id));
}

// ⚠️ Inclusivo co persoal, igual que nas escaletas: activar un grupo
// non pode facer desaparecer o teu propio traballo.
export function filtrarPorGrupo(lista, grupoId) {
  if (!grupoId) return lista || [];
  return (lista || []).filter((x) => !x.grupoId || x.grupoId === grupoId);
}

// Cales das locais poderían subirse. Non se sobe nada só: mesturar sen
// preguntar o que estabas probando co que xa tiñas non ten volta atrás.
export function migrables() {
  return lerLocais();
}

// ── Resolver ─────────────────────────────────────────────────────
// Cruza a mesa cos recursos que hai de verdade. Unha mesa que apunta a
// un son borrado non é un erro: é unha mesa cun oco, e hai que dicilo.
export function resolverMesa(mesa, recursos) {
  if (!mesa) return { recursos, faltan: [] };
  const porId = new Map((recursos || []).map((r) => [r.id, r]));
  const dentro = [];
  const faltan = [];
  for (const id of mesa.recursoIds) {
    const r = porId.get(id);
    if (r) dentro.push({ ...r, vol: mesa.volRecurso[id] ?? r.vol });
    else faltan.push(id);
  }
  return { recursos: dentro, faltan };
}
