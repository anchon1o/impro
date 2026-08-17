// ═══════════════════════════════════════════════════════════════════
// SONIDO · escenas
// ═══════════════════════════════════════════════════════════════════
// Unha Escena é unha configuración sonora LISTA PARA USAR: «Mansión
// encantada» é piano inquietante de fondo, tormenta ao 30 %, lareira
// ao 10 %, e os botóns de porta, trono e cristal a man.
//
// Diferenza coa Mesa, que é o que máis confunde:
//   · MESA  → que sons tes DIANTE. Cámbiase entre proxectos.
//   · ESCENA → que está SOANDO agora. Cámbiase durante a función.
// Unha mesa dura meses; unha escena, tres minutos.
//
// ⚠️ Aplicar unha escena APAGA o que estea soando fóra dela. Se non,
// encadear dúas escenas iría acumulando capas ata o barullo. O que non
// fai é apagar de golpe: hai un fundido, porque un corte seco no medio
// dunha función óese máis que o cambio.
// ═══════════════════════════════════════════════════════════════════

import { getColeccions, gardarColeccion, gardarItems, getItems } from './recursos.js';

const CLAVE = 'impro_sonido_escenas_v1';

let contador = 0;
function novoId() {
  contador += 1;
  return 'local-' + Date.now().toString(36) + '-' + contador.toString(36);
}

function numeroOuNada(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const nivel = (v, d = 0.8) => {
  const n = numeroOuNada(v);
  return n === null ? d : Math.min(1, Math.max(0, n));
};

// O fade vai en SEGUNDOS, non en fracción. Tíñao gardado como fracción
// e multiplicado por 4 ao ler, e o resultado era que un valor ausente
// daba 6 s en vez de 1,5: as unidades non casaban co valor por defecto.
const segundosFade = (v) => {
  const n = numeroOuNada(v);
  return n === null ? 1.5 : Math.min(8, Math.max(0, n));
};

export function sanearEscena(e) {
  if (!e || typeof e !== 'object' || !e.id) return null;
  const capas = {};
  if (e.capas && typeof e.capas === 'object' && !Array.isArray(e.capas)) {
    for (const [id, v] of Object.entries(e.capas)) {
      if (typeof id !== 'string' || !id) continue;
      capas[id] = nivel(v);
    }
  }
  return {
    id: String(e.id),
    nome: typeof e.nome === 'string' && e.nome.trim() ? e.nome.trim() : 'Sen nome',
    emoji: typeof e.emoji === 'string' && e.emoji ? e.emoji : '🎭',
    capas,                                    // id de recurso → volume
    botons: Array.isArray(e.botons) ? e.botons.filter((x) => typeof x === 'string' && x) : [],
    fade: segundosFade(e.fade),               // segundos, tope 8
    local: e.local !== false,
  };
}

// ── Capturar o que está soando ───────────────────────────────────
// Unha escena non se escribe: móntase na mesa e gárdase. É moito máis
// rápido que encher un formulario, e é como se traballa de verdade.
export function capturarEscena(nome, capasActivas, efectosVisibles) {
  const capas = {};
  for (const c of capasActivas || []) if (c.on) capas[c.id] = c.vol;
  return sanearEscena({
    id: novoId(),
    nome,
    emoji: '🎭',
    capas,
    botons: (efectosVisibles || []).map((r) => r.id),
    fade: 1.5,
    local: true,
  });
}

// ── Aplicar ──────────────────────────────────────────────────────
// Devolve o plan en vez de executalo: así pódese probar sen motor, e
// a interface decide cando disparalo.
export function planificarEscena(escena, recursos, capasActuais) {
  if (!escena) return { acender: [], apagar: [], faltan: [] };
  const porId = new Map((recursos || []).map((r) => [r.id, r]));
  const acender = [];
  const faltan = [];
  for (const [id, vol] of Object.entries(escena.capas)) {
    const r = porId.get(id);
    if (r) acender.push({ recurso: r, vol });
    else faltan.push(id);
  }
  const queren = new Set(Object.keys(escena.capas));
  // Todo o que soa e non pertence á escena ten que baixar: se non,
  // encadear escenas acumula capas ata o barullo.
  const apagar = (capasActuais || [])
    .filter((c) => c.on && !queren.has(c.id))
    .map((c) => c.id);
  return { acender, apagar, faltan };
}

// ── Almacén ──────────────────────────────────────────────────────
function lerLocais() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(d) ? d.map(sanearEscena).filter(Boolean) : [];
  } catch (e) { return []; }
}

function escribirLocais(l) {
  try { localStorage.setItem(CLAVE, JSON.stringify(l)); return true; } catch (e) { return false; }
}

export async function cargarEscenas(userId) {
  const locais = lerLocais();
  if (!userId) return { escenas: locais, motivo: null };
  try {
    const cols = await getColeccions({ tipo: 'escena', soMeus: true, userId });
    if (cols.motivo === 'sen-conexion') return { escenas: locais, motivo: 'sen-conexion' };
    const remotas = [];
    for (const c of cols) {
      const items = await getItems(c.id);
      const cfg = c.config || {};
      remotas.push(sanearEscena({
        id: c.id, nome: c.nome, emoji: c.emoji,
        capas: cfg.capas, fade: cfg.fade,
        botons: items.map((i) => i.recursoId).filter(Boolean),
        local: false,
      }));
    }
    return { escenas: [...remotas, ...locais], motivo: null };
  } catch (e) {
    return { escenas: locais, motivo: 'sen-conexion' };
  }
}

export async function gardarEscena(escena, userId) {
  const e = sanearEscena(escena);
  if (!e) return { ok: false, erro: 'Escena non válida' };
  if (e.nome === 'Sen nome') return { ok: false, erro: 'Ponlle un nome á escena' };
  if (!Object.keys(e.capas).length && !e.botons.length) {
    return { ok: false, erro: 'A escena está baleira: acende algo antes de gardala' };
  }

  if (!userId || e.local) {
    const l = lerLocais();
    const i = l.findIndex((x) => x.id === e.id);
    if (i >= 0) l[i] = e; else l.push(e);
    return escribirLocais(l) ? { ok: true, escena: e } : { ok: false, erro: 'Non hai espazo' };
  }

  const r = await gardarColeccion({
    id: e.id.startsWith('local-') ? undefined : e.id,
    tipo: 'escena', nome: e.nome, emoji: e.emoji,
    config: { capas: e.capas, fade: e.fade },
    visibilidade: 'privado', estado: 'borrador', userId,
  });
  if (!r.ok) return r;
  const it = await gardarItems(r.coleccion.id, e.botons.map((id) => ({ recursoId: id })));
  if (!it.ok) return it;
  return { ok: true, escena: { ...e, id: r.coleccion.id, local: false } };
}

export function borrarEscenaLocal(id) {
  return escribirLocais(lerLocais().filter((e) => e.id !== id));
}
