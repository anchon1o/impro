// ═══════════════════════════════════════════════════════════════════
// ESCALETAS
// ═══════════════════════════════════════════════════════════════════
// ⚠️ A ESCALETA É A SESIÓN. Non son dúas cousas.
//
// Unha sesión con bloques é exactamente unha escaleta. Chamarlles
// distinto foi o que fixo que houbese dúas editables —  unha en Sesións
// e outra en En directo—  que podían discrepar. É o mesmo erro que
// causou B16 con Reto e Guía.
//
// Regra: **edítase SÓ en Sesións.** Son e En directo IMPORTAN, en modo
// lectura. Se algún día alguén quere editar desde outro sitio, que
// navegue a Sesións.
//
// Estrutura:
//   escaleta
//     └─ bloques[]        ← un por tramo: quecemento, xogos, formato…
//          tipoId         ← ⚠️ id real de `dinamicas_tipos`, non unha
//                           etiqueta solta. É o que conecta coa Guía.
//          └─ itens[]     ← as dinámicas escollidas dese tipo
// ═══════════════════════════════════════════════════════════════════

import { supabase } from './supabase.js';

const CLAVE = 'impro_escaletas_v1';

export const TIPOS_ESCALETA = [
  { id: 'ensaio', nome: 'Ensaio' },
  { id: 'espectaculo', nome: 'Espectáculo' },
  { id: 'clase', nome: 'Clase' },
  { id: 'obradoiro', nome: 'Obradoiro' },
];

let contador = 0;
function novoId(pre = 'e') {
  contador += 1;
  return `${pre}-${Date.now().toString(36)}-${contador.toString(36)}`;
}

const num = (v, d = 0) => {
  // Mesmo criterio que en mesa.js: `Number(null)` e `Number('')` son 0,
  // e aquí un 0 significaría un bloque de duración cero.
  if (typeof v === 'number') return Number.isFinite(v) ? v : d;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  return d;
};

// ── Creación ─────────────────────────────────────────────────────
export function escaletaBaleira(nome = 'Escaleta nova', tipo = 'ensaio') {
  return {
    id: novoId(),
    nome,
    notas: '',
    tipo: TIPOS_ESCALETA.some((t) => t.id === tipo) ? tipo : 'ensaio',
    bloques: [],
    // A que grupo pertence. `null` = persoal, visible sempre.
    grupoId: null,
    local: true,
  };
}

// Un bloque nace ligado a un TIPO real de dinámica. Iso é o que permite
// despois ofrecer só as dinámicas dese tipo ao encher o bloque.
export function crearBloque({ tipoId = null, nome = '', minutos = 0 } = {}) {
  return { id: novoId('b'), tipoId: tipoId || null, nome: nome.trim(), minutos: num(minutos, 0), itens: [] };
}

// ⚠️ Gárdase o NOME ademais do id. Se a dinámica se borra ou a Guía non
// carga, a escaleta segue sendo lexible en vez de amosar unha fila
// baleira no medio dunha función.
export function crearItem(dinamica, { minutos = null, notas = '' } = {}) {
  return {
    id: novoId('i'),
    dinamicaId: dinamica?.id || null,
    nome: dinamica?.nombre || dinamica?.nome || 'Sen nome',
    tipo: dinamica?.tipo || null,
    minutos: num(minutos ?? dinamica?.duracion, 0),
    notas: String(notas || ''),
  };
}

// ── Saneamento ───────────────────────────────────────────────────
export function sanear(e) {
  if (!e || typeof e !== 'object' || !e.id) return null;
  const bloques = Array.isArray(e.bloques) ? e.bloques : [];
  return {
    id: String(e.id),
    nome: typeof e.nome === 'string' && e.nome.trim() ? e.nome.trim() : 'Sen nome',
    notas: typeof e.notas === 'string' ? e.notas : '',
    tipo: TIPOS_ESCALETA.some((t) => t.id === e.tipo) ? e.tipo : 'ensaio',
    grupoId: e.grupoId || e.grupo_id || null,
    bloques: bloques.filter((b) => b && typeof b === 'object').map((b) => ({
      id: b.id || novoId('b'),
      tipoId: b.tipoId || null,
      nome: typeof b.nome === 'string' ? b.nome : '',
      minutos: num(b.minutos, 0),
      itens: (Array.isArray(b.itens) ? b.itens : [])
        .filter((i) => i && typeof i === 'object' && (i.dinamicaId || i.nome))
        .map((i) => ({
          id: i.id || novoId('i'),
          dinamicaId: i.dinamicaId || null,
          nome: typeof i.nome === 'string' && i.nome.trim() ? i.nome.trim() : 'Sen nome',
          tipo: i.tipo || null,
          minutos: num(i.minutos, 0),
          notas: typeof i.notas === 'string' ? i.notas : '',
        })),
    })),
    local: e.local !== false,
  };
}

// ── Edición ──────────────────────────────────────────────────────
const conBloques = (e, bs) => ({ ...e, bloques: bs });

export function engadirBloque(e, bloque) {
  return conBloques(e, [...(e.bloques || []), bloque]);
}

export function quitarBloque(e, id) {
  return conBloques(e, (e.bloques || []).filter((b) => b.id !== id));
}

export function moverBloque(e, id, dir) {
  const bs = [...(e.bloques || [])];
  const i = bs.findIndex((b) => b.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= bs.length) return e;
  [bs[i], bs[j]] = [bs[j], bs[i]];
  return conBloques(e, bs);
}

export function engadirItem(e, bloqueId, item) {
  return conBloques(e, (e.bloques || []).map((b) => (
    b.id === bloqueId ? { ...b, itens: [...b.itens, item] } : b
  )));
}

export function quitarItem(e, bloqueId, itemId) {
  return conBloques(e, (e.bloques || []).map((b) => (
    b.id === bloqueId ? { ...b, itens: b.itens.filter((i) => i.id !== itemId) } : b
  )));
}

export function moverItem(e, bloqueId, itemId, dir) {
  return conBloques(e, (e.bloques || []).map((b) => {
    if (b.id !== bloqueId) return b;
    const l = [...b.itens];
    const i = l.findIndex((x) => x.id === itemId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= l.length) return b;
    [l[i], l[j]] = [l[j], l[i]];
    return { ...b, itens: l };
  }));
}

export function editarItem(e, bloqueId, itemId, cambios) {
  return conBloques(e, (e.bloques || []).map((b) => (
    b.id === bloqueId
      ? { ...b, itens: b.itens.map((i) => (i.id === itemId ? { ...i, ...cambios } : i)) }
      : b
  )));
}

// ── Cálculos ─────────────────────────────────────────────────────
// A duración dun bloque é a suma dos seus itens; se non ten ningún,
// vale a que se lle puxera a man. Así un bloque de «Descanso» sen
// dinámicas segue contando.
export function minutosBloque(b) {
  const itens = (b?.itens || []).reduce((a, i) => a + num(i.minutos, 0), 0);
  return itens > 0 ? itens : num(b?.minutos, 0);
}

export function minutosTotais(e) {
  return (e?.bloques || []).reduce((a, b) => a + minutosBloque(b), 0);
}

export function resumo(e) {
  const bloques = e?.bloques || [];
  const itens = bloques.reduce((a, b) => a + (b.itens || []).length, 0);
  return {
    bloques: bloques.length,
    itens,
    minutos: minutosTotais(e),
    baleira: bloques.length === 0,
    // Bloques declarados pero sen contido: é o erro típico ao montar
    // unha escaleta con présa.
    senContido: bloques.filter((b) => !(b.itens || []).length && !num(b.minutos, 0)).map((b) => b.id),
  };
}

// ── Exportar para o directo ──────────────────────────────────────
// ⚠️ Devolve unha lista PLANA con tempos acumulados. É o que precisan
// tanto Son (contadores por tramo) como En directo (avanzar). Aplánase
// aquí e non alí para que os dous vexan exactamente o mesmo: se cada un
// a interpretase á súa maneira, volveriamos a ter dúas escaletas.
export function paraDirecto(e) {
  const fóra = [];
  let acumulado = 0;
  for (const b of e?.bloques || []) {
    const mb = minutosBloque(b);
    fóra.push({
      id: b.id, tipo: 'bloque', nome: b.nome || '(bloque)',
      tipoId: b.tipoId, minutos: mb,
      desde: acumulado, ata: acumulado + mb,
    });
    let dentro = acumulado;
    for (const i of b.itens || []) {
      const mi = num(i.minutos, 0);
      fóra.push({
        id: i.id, tipo: 'item', nome: i.nome,
        dinamicaId: i.dinamicaId, minutos: mi,
        desde: dentro, ata: dentro + mi, bloqueId: b.id,
      });
      dentro += mi;
    }
    acumulado += mb;
  }
  return fóra;
}

// ── Almacén ──────────────────────────────────────────────────────
function lerLocais() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(d) ? d.map(sanear).filter(Boolean) : [];
  } catch (e) { return []; }
}

function escribirLocais(l) {
  try { localStorage.setItem(CLAVE, JSON.stringify(l)); return true; } catch (e) { return false; }
}

export async function cargarEscaletas(userId) {
  const locais = lerLocais();
  if (!userId) return { escaletas: locais, motivo: null };
  try {
    const { data, error } = await supabase.from('escaletas')
      .select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    if (error) throw error;
    const remotas = (data || []).map((r) => sanear({ ...r, local: false })).filter(Boolean);
    return { escaletas: [...remotas, ...locais], motivo: null };
  } catch (e) {
    // Sen rede quedan as locais: mellor abrir con parte que non abrir.
    return { escaletas: locais, motivo: 'sen-conexion' };
  }
}

export async function gardarEscaleta(escaleta, userId) {
  const e = sanear(escaleta);
  if (!e) return { ok: false, erro: 'Escaleta non válida' };
  if (e.nome === 'Sen nome') return { ok: false, erro: 'Ponlle un nome á escaleta' };

  if (!userId || e.local) {
    const l = lerLocais();
    const i = l.findIndex((x) => x.id === e.id);
    if (i >= 0) l[i] = e; else l.push(e);
    return escribirLocais(l)
      ? { ok: true, escaleta: e }
      : { ok: false, erro: 'Non hai espazo para gardar a escaleta' };
  }

  const fila = {
    nome: e.nome, notas: e.notas || null, tipo: e.tipo,
    bloques: e.bloques, minutos: minutosTotais(e),
    grupo_id: e.grupoId || null,
    user_id: userId, updated_at: new Date().toISOString(),
  };
  try {
    const nova = e.id.startsWith('e-');   // id local, aínda sen subir
    const q = nova
      ? supabase.from('escaletas').insert(fila).select().single()
      : supabase.from('escaletas').update(fila).eq('id', e.id).select().single();
    const { data, error } = await q;
    if (error) throw error;
    return { ok: true, escaleta: sanear({ ...data, local: false }) };
  } catch (err) {
    return { ok: false, erro: err.message || String(err) };
  }
}

export async function borrarEscaleta(escaleta, userId) {
  if (!escaleta) return { ok: false };
  if (escaleta.local || !userId) {
    return { ok: escribirLocais(lerLocais().filter((x) => x.id !== escaleta.id)) };
  }
  try {
    const { error } = await supabase.from('escaletas').delete().eq('id', escaleta.id);
    if (error) throw error;
    return { ok: true };
  } catch (e) { return { ok: false, erro: e.message || String(e) }; }
}

// ⚠️ O filtro por grupo é INCLUSIVO co persoal: unha escaleta sen grupo
// vese sempre. Se non, activar un grupo faría desaparecer o traballo
// propio e semellaría que se perdeu.
export function filtrarPorGrupo(lista, grupoId) {
  if (!grupoId) return lista || [];
  return (lista || []).filter((e) => !e.grupoId || e.grupoId === grupoId);
}

// Duplicar: útil para «o show do mes pasado pero cambiando dous xogos».
export function duplicar(e, nome) {
  const c = sanear(e);
  if (!c) return null;
  return {
    ...c,
    id: novoId(),
    nome: (nome || c.nome + ' (copia)').trim(),
    local: true,
  };
}
