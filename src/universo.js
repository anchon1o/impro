// ============================================================
// universo.js — Universo Impro respaldado por Supabase
// A sementeira inicial faise via SQL (supabase_universo_seed.sql),
// non en tempo real, para evitar problemas de RLS na primeira carga.
// ============================================================

import { supabase } from './supabase.js';

const ls = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function mapRow(d) {
  return {
    id: d.id, tipo: d.tipo, nome: d.nome, pais: d.pais, cidade: d.cidade,
    desc: d.descricion, web: d.web, tags: d.tags || [], logo: d.logo,
    verificado: d.verificado, userId: d.user_id,
  };
}

// ─────────────────────────────────────────────
// CARGA — só lectura, sen efectos secundarios
// ─────────────────────────────────────────────
export async function cargarUniverso(fallback) {
  try {
    const { data, error } = await supabase
      .from('universo')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      const mapped = data.map(mapRow);
      ls.set('impro_universo_cache', mapped);
      return mapped;
    }
    // Táboa aínda baleira (sementeira SQL non executada): usar fallback estático
    return fallback || [];
  } catch (e) {
    console.warn('[universo] fallo na carga, uso caché/fallback:', e?.message);
    return ls.get('impro_universo_cache', fallback || []);
  }
}

// ─────────────────────────────────────────────
// ENGADIR (usuario propón / admin engade xa verificado)
// ─────────────────────────────────────────────
export async function engadirUniverso(entry, userId, verificadoDirecto = false) {
  const { data, error } = await supabase
    .from('universo')
    .insert({
      tipo: entry.tipo, nome: entry.nome, pais: entry.pais || '🌍',
      cidade: entry.cidade || '', descricion: entry.desc, web: entry.web || '',
      tags: entry.tags || [], logo: entry.logo || '🎭',
      verificado: verificadoDirecto, user_id: verificadoDirecto ? null : userId,
    })
    .select()
    .single();
  if (error) { console.error('[universo] erro ao engadir:', error.message); return null; }
  return mapRow(data);
}

export async function editarUniverso(id, campos) {
  const patch = {};
  if (campos.tipo!==undefined) patch.tipo = campos.tipo;
  if (campos.nome!==undefined) patch.nome = campos.nome;
  if (campos.pais!==undefined) patch.pais = campos.pais;
  if (campos.cidade!==undefined) patch.cidade = campos.cidade;
  if (campos.desc!==undefined) patch.descricion = campos.desc;
  if (campos.web!==undefined) patch.web = campos.web;
  if (campos.tags!==undefined) patch.tags = campos.tags;
  if (campos.logo!==undefined) patch.logo = campos.logo;
  const { error } = await supabase.from('universo').update(patch).eq('id', id);
  return !error;
}

export async function borrarUniverso(id) {
  const { error } = await supabase.from('universo').delete().eq('id', id);
  return !error;
}

// ─────────────────────────────────────────────
// ADMIN: moderación e xestión completa
// ─────────────────────────────────────────────
// NOTA: universo.user_id referencia auth.users(id), non perfis(id), polo que
// PostgREST non pode inferir un join con perfis. Buscamos os perfís á parte.
async function anexarPerfis(filas) {
  const ids = [...new Set(filas.map(f => f.user_id).filter(Boolean))];
  if (ids.length === 0) return filas.map(f => ({ ...f, achegadoPor: null }));
  const { data: perfis } = await supabase
    .from('perfis')
    .select('id,nome,email')
    .in('id', ids);
  const mapa = Object.fromEntries((perfis || []).map(p => [p.id, p.nome || p.email]));
  return filas.map(f => ({ ...f, achegadoPor: f.user_id ? (mapa[f.user_id] || null) : null }));
}

export async function listarTodoUniverso() {
  const { data, error } = await supabase
    .from('universo')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('[universo] listarTodo:', error.message); return []; }
  const conPerfis = await anexarPerfis(data || []);
  return conPerfis.map(d => ({ ...mapRow(d), achegadoPor: d.achegadoPor }));
}

export async function listarPendentesUniverso() {
  const { data, error } = await supabase
    .from('universo')
    .select('*')
    .eq('verificado', false)
    .order('created_at', { ascending: false });
  if (error) { console.error('[universo] listarPendentes:', error.message); return []; }
  return anexarPerfis(data || []);
}

export async function verificarUniverso(id, verificar) {
  if (verificar) {
    const { error } = await supabase.from('universo').update({ verificado: true }).eq('id', id);
    return !error;
  }
  return borrarUniverso(id);
}
