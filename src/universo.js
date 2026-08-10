// ============================================================
// universo.js — Universo Impro respaldado por Supabase
// Permite que calquera usuario logueado engada entradas reais.
// Quedan marcadas "sen verificar" ata que un admin as revisa.
// ============================================================

import { supabase } from './supabase.js';

const ls = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─────────────────────────────────────────────
// CARGA (verificadas para todos + as propias sen verificar)
// ─────────────────────────────────────────────
export async function cargarUniverso(seed) {
  try {
    const { data, error } = await supabase
      .from('universo')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) {
      // Primeira vez: sementar coas entradas verificadas base
      if (seed?.length) {
        await supabase.from('universo').insert(
          seed.map(s => ({
            tipo: s.tipo, nome: s.nome, pais: s.pais, cidade: s.cidade,
            descricion: s.desc, web: s.web, tags: s.tags, logo: s.logo,
            verificado: true, user_id: null,
          }))
        );
        return cargarUniverso(null); // recargar xa sementado
      }
      return seed || [];
    }

    const mapped = data.map(d => ({
      id: d.id, tipo: d.tipo, nome: d.nome, pais: d.pais, cidade: d.cidade,
      desc: d.descricion, web: d.web, tags: d.tags || [], logo: d.logo,
      verificado: d.verificado, propio: false, userId: d.user_id,
    }));
    ls.set('impro_universo_cache', mapped);
    return mapped;
  } catch (e) {
    console.warn('[universo] fallo na carga, uso caché/seed:', e?.message);
    return ls.get('impro_universo_cache', seed || []);
  }
}

// ─────────────────────────────────────────────
// ENGADIR
// ─────────────────────────────────────────────
export async function engadirUniverso(entry, userId) {
  try {
    const { data, error } = await supabase
      .from('universo')
      .insert({
        tipo: entry.tipo, nome: entry.nome, pais: entry.pais || '🌍',
        cidade: entry.cidade || '', descricion: entry.desc, web: entry.web || '',
        tags: entry.tags || [], logo: entry.logo || '🎭',
        verificado: false, user_id: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id, tipo: data.tipo, nome: data.nome, pais: data.pais, cidade: data.cidade,
      desc: data.descricion, web: data.web, tags: data.tags || [], logo: data.logo,
      verificado: false, propio: true,
    };
  } catch (e) {
    console.error('[universo] erro ao engadir:', e?.message);
    return null;
  }
}

export async function borrarUniverso(id) {
  const { error } = await supabase.from('universo').delete().eq('id', id);
  return !error;
}

// ─────────────────────────────────────────────
// ADMIN: moderación
// ─────────────────────────────────────────────
export async function listarPendentesUniverso() {
  const { data, error } = await supabase
    .from('universo')
    .select('*, perfis(nome,email)')
    .eq('verificado', false)
    .order('created_at', { ascending: false });
  return error ? [] : (data || []);
}

export async function verificarUniverso(id, verificar) {
  if (verificar) {
    const { error } = await supabase.from('universo').update({ verificado: true }).eq('id', id);
    return !error;
  }
  return borrarUniverso(id);
}
