// ============================================================
// estimulos.js — Carga de estímulos multilingüe desde Supabase
// Caché en localStorage para arranque instantáneo e uso offline.
// ============================================================

import { supabase } from './supabase.js';

const CACHE_KEY = 'impro_estimulos_cache';
const CACHE_META = 'impro_estimulos_meta';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 h

const ls = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// Idiomas soportados. Engadir aquí para ampliar.
export const IDIOMAS = [
  { id: 'es', label: 'Castelán', col: 'texto_es' },
  { id: 'gl', label: 'Galego',   col: 'texto_gl' },
  { id: 'en', label: 'English',  col: 'texto_en' },
  { id: 'pt', label: 'Português', col: 'texto_pt' },
  { id: 'it', label: 'Italiano', col: 'texto_it' },
];

export const CAT_ICONS_FALLBACK = {
  'PROFESIÓN':'👤','OBJETO':'✦','LUGAR':'📍','EMOCIÓN':'💜','ACCIÓN':'🎭',
  'NOMBRE':'📛','SUPERPODER':'⚡','ESTILO':'🎬','DUDA':'❓','CONFESIÓN':'🤫','FRASE':'💬',
};

// ─────────────────────────────────────────────
// CARGA PRINCIPAL
// Devolve { PROFESIÓN: { simple:[], plus:[] }, ... }
// Con fallback a castelán se falta a tradución.
// ─────────────────────────────────────────────
export async function cargarEstimulos(lang = 'es', { forzar = false } = {}) {
  const meta = ls.get(CACHE_META, null);
  const fresco = meta && meta.lang === lang && (Date.now() - meta.ts) < CACHE_TTL;

  if (!forzar && fresco) {
    const cache = ls.get(CACHE_KEY, null);
    if (cache) return cache;
  }

  try {
    const col = (IDIOMAS.find(i => i.id === lang) || IDIOMAS[0]).col;
    const select = col === 'texto_es' ? 'cat,nivel,texto_es' : `cat,nivel,texto_es,${col}`;

    // Paxinación: Supabase limita a 1000 filas por petición
    let filas = [];
    let desde = 0;
    const PASO = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('estimulos')
        .select(select)
        .eq('activo', true)
        .is('user_id', null)
        .range(desde, desde + PASO - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      filas = filas.concat(data);
      if (data.length < PASO) break;
      desde += PASO;
    }

    if (filas.length === 0) throw new Error('Sen datos');

    const out = {};
    for (const f of filas) {
      const texto = (col !== 'texto_es' && f[col]) ? f[col] : f.texto_es;
      if (!out[f.cat]) out[f.cat] = { simple: [], plus: [] };
      // 'simple' inclúese tamén en 'plus' para que plus sexa o corpus completo
      if (f.nivel === 'simple') { out[f.cat].simple.push(texto); out[f.cat].plus.push(texto); }
      else out[f.cat].plus.push(texto);
    }

    ls.set(CACHE_KEY, out);
    ls.set(CACHE_META, { lang, ts: Date.now(), n: filas.length });
    return out;
  } catch (e) {
    console.warn('[estimulos] fallo na carga, uso caché:', e?.message);
    return ls.get(CACHE_KEY, null) || {};
  }
}

// ─────────────────────────────────────────────
// CATEGORÍAS
// ─────────────────────────────────────────────
export async function cargarCategorias(lang = 'es') {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('orde');
    if (error || !data?.length) throw error || new Error('sen datos');
    const nomeCol = `nome_${lang}`;
    const out = data.map(c => ({
      id: c.id,
      icona: c.icona,
      nome: c[nomeCol] || c.nome_es || c.id,
    }));
    ls.set('impro_categorias_cache', out);
    return out;
  } catch {
    const cache = ls.get('impro_categorias_cache', null);
    if (cache) return cache;
    return Object.entries(CAT_ICONS_FALLBACK).map(([id, icona]) => ({ id, icona, nome: id }));
  }
}

// ─────────────────────────────────────────────
// ADMIN: CRUD de estímulos base
// ─────────────────────────────────────────────
export async function listarEstimulos(cat, nivel) {
  const { data, error } = await supabase
    .from('estimulos')
    .select('*')
    .eq('cat', cat)
    .eq('nivel', nivel)
    .order('id');
  return error ? [] : (data || []);
}

export async function engadirEstimulo(cat, nivel, texto_es) {
  const { data, error } = await supabase
    .from('estimulos')
    .insert({ cat, nivel, texto_es })
    .select()
    .single();
  invalidarCache();
  return error ? null : data;
}

export async function editarEstimulo(id, campos) {
  const { error } = await supabase.from('estimulos').update(campos).eq('id', id);
  invalidarCache();
  return !error;
}

export async function cambiarNivelEstimulo(id, novoNivel) {
  const { error } = await supabase.from('estimulos').update({ nivel: novoNivel }).eq('id', id);
  invalidarCache();
  return !error;
}

export async function borrarEstimulo(id) {
  const { error } = await supabase.from('estimulos').delete().eq('id', id);
  invalidarCache();
  return !error;
}

export function invalidarCache() {
  try { localStorage.removeItem(CACHE_META); } catch {}
}

// ─────────────────────────────────────────────
// TRADUCIÓN: EXPORTAR / IMPORTAR
// ─────────────────────────────────────────────

/**
 * Exporta un JSON co contido a traducir.
 * soloPendentes: só as filas sen tradución nese idioma.
 */
export async function exportarTraducion(lang, { soloPendentes = true } = {}) {
  const info = IDIOMAS.find(i => i.id === lang);
  if (!info || lang === 'es') return null;

  let filas = [];
  let desde = 0;
  const PASO = 1000;
  while (true) {
    let q = supabase
      .from('estimulos')
      .select(`id,cat,nivel,texto_es,${info.col}`)
      .eq('activo', true)
      .is('user_id', null)
      .range(desde, desde + PASO - 1)
      .order('id');
    const { data, error } = await q;
    if (error) break;
    if (!data || data.length === 0) break;
    filas = filas.concat(data);
    if (data.length < PASO) break;
    desde += PASO;
  }

  const items = filas
    .filter(f => !soloPendentes || !f[info.col])
    .map(f => ({ id: f.id, cat: f.cat, es: f.texto_es, [lang]: f[info.col] || '' }));

  return {
    _formato: 'improapp-traducion-v1',
    _idioma: lang,
    _instrucions: `Enche o campo "${lang}" de cada entrada coa tradución de "es". Non modifiques "id" nin "cat". Devolve o JSON completo.`,
    _total: items.length,
    _data: new Date().toISOString().slice(0, 10),
    items,
  };
}

/**
 * Importa un JSON traducido e actualiza a columna correspondente.
 * Devolve { ok, actualizados, erros }
 */
export async function importarTraducion(json) {
  if (json?._formato !== 'improapp-traducion-v1') {
    return { ok: false, erro: 'Formato non recoñecido. Usa un ficheiro exportado desde a app.' };
  }
  const lang = json._idioma;
  const info = IDIOMAS.find(i => i.id === lang);
  if (!info || lang === 'es') return { ok: false, erro: 'Idioma non válido.' };

  const items = (json.items || []).filter(i => i.id && i[lang]?.trim());
  if (items.length === 0) return { ok: false, erro: 'Non hai traducións que importar.' };

  let actualizados = 0, erros = 0;
  const LOTE = 50;
  for (let k = 0; k < items.length; k += LOTE) {
    const chunk = items.slice(k, k + LOTE);
    const results = await Promise.all(chunk.map(it =>
      supabase.from('estimulos').update({ [info.col]: it[lang].trim() }).eq('id', it.id)
    ));
    for (const r of results) r.error ? erros++ : actualizados++;
  }

  invalidarCache();
  return { ok: true, actualizados, erros, total: items.length };
}

/**
 * Progreso de tradución por idioma.
 */
export async function progresoTraducion() {
  try {
    const { data, error } = await supabase.from('progreso_traducion').select('*');
    if (error) throw error;
    const tot = { total: 0, gl: 0, en: 0, pt: 0, it: 0 };
    for (const r of data || []) {
      tot.total += r.total; tot.gl += r.gl; tot.en += r.en; tot.pt += r.pt; tot.it += r.it;
    }
    return { porCategoria: data || [], total: tot };
  } catch {
    return { porCategoria: [], total: { total: 0, gl: 0, en: 0, pt: 0, it: 0 } };
  }
}
