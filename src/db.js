// ============================================================
// db.js — Capa de datos Supabase para ImproApp
// Substitúe localStorage de forma transparente.
// Patrón: escribe en Supabase + localStorage (fallback offline)
// ============================================================

import { supabase } from './supabase.js';

const ls = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─────────────────────────────────────────────
// HELPER: user_id actual
// ─────────────────────────────────────────────
async function uid() {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  } catch { return null; }
}


// ─────────────────────────────────────────────
// ESTÍMULOS DE USUARIO
// ─────────────────────────────────────────────
export async function getUserStimuli() {
  try {
    const { data, error } = await supabase.from('user_stimuli').select('*');
    if (error) throw error;
    // Reconstruír o formato que usa a app
    const result = {};
    for (const row of data) {
      if (row.tipo === 'add') {
        result[row.cat] = result[row.cat] || { simple: [], plus: [] };
        result[row.cat][row.nivel] = [...(result[row.cat][row.nivel] || []), row.texto];
      } else if (row.tipo === 'edit') {
        const key = `${row.cat}_edits`;
        result[key] = result[key] || {};
        result[key][row.nivel] = result[key][row.nivel] || {};
        result[key][row.nivel][row.orig_idx] = row.texto;
      } else if (row.tipo === 'delete') {
        const key = `${row.cat}_deleted`;
        result[key] = result[key] || {};
        result[key][row.nivel] = [...(result[key][row.nivel] || []), row.orig_idx];
      }
    }
    ls.set('impro_user_stimuli', result);
    return result;
  } catch {
    return ls.get('impro_user_stimuli', {});
  }
}

export async function addUserStimulus(cat, nivel, texto) {
  ls.set('impro_user_stimuli', (() => {
    const u = ls.get('impro_user_stimuli', {});
    u[cat] = u[cat] || { simple: [], plus: [] };
    u[cat][nivel] = [...(u[cat][nivel] || []), texto];
    return u;
  })());
  try {
    const u = await uid();
    await supabase.from('user_stimuli').insert({ cat, nivel, texto, tipo: 'add', user_id: u });
  } catch {}
}

export async function editUserStimulus(cat, nivel, orig_idx, texto, isBase) {
  try {
    if (isBase) {
      await supabase.from('user_stimuli').upsert({ cat, nivel, orig_idx, texto, tipo: 'edit' });
    } else {
      await supabase.from('user_stimuli')
        .update({ texto })
        .eq('cat', cat).eq('nivel', nivel).eq('orig_idx', orig_idx).eq('tipo', 'add');
    }
  } catch {}
}

export async function deleteUserStimulus(cat, nivel, orig_idx, isBase) {
  try {
    if (isBase) {
      await supabase.from('user_stimuli').insert({ cat, nivel, orig_idx, texto: '', tipo: 'delete' });
    } else {
      await supabase.from('user_stimuli')
        .delete()
        .eq('cat', cat).eq('nivel', nivel).eq('orig_idx', orig_idx).eq('tipo', 'add');
    }
  } catch {}
}

// ─────────────────────────────────────────────
// DINÁMICAS
// ─────────────────────────────────────────────
export async function getDinamicas(base) {
  try {
    const { data, error } = await supabase.from('dinamicas').select('*').order('created_at');
    if (error) throw error;
    if (data && data.length > 0) {
      ls.set('impro_dinamicas_v2', data);
      return data;
    }
    // Sen datos en Supabase → gardar as base
    await supabase.from('dinamicas').insert(base.map(d => ({ ...d, id: String(d.id), es_base: true })));
    return base;
  } catch {
    return ls.get('impro_dinamicas_v2', base);
  }
}

export async function saveDinamica(d) {
  ls.set('impro_dinamicas_v2', (() => {
    const all = ls.get('impro_dinamicas_v2', []);
    const idx = all.findIndex(x => x.id === d.id);
    return idx >= 0 ? all.map(x => x.id === d.id ? d : x) : [...all, d];
  })());
  try {
    const u = await uid();
    await supabase.from('dinamicas').upsert({ ...d, id: String(d.id), user_id: u });
  } catch {}
}

export async function deleteDinamica(id) {
  ls.set('impro_dinamicas_v2', ls.get('impro_dinamicas_v2', []).filter(d => d.id !== id));
  try {
    await supabase.from('dinamicas').delete().eq('id', String(id));
  } catch {}
}

// ─────────────────────────────────────────────
// SESIÓNS
// ─────────────────────────────────────────────
export async function getSesiones() {
  try {
    const { data, error } = await supabase.from('sesiones').select('*').order('created_at', { ascending: false }).limit(30);
    if (error) throw error;
    ls.set('impro_sesiones', data || []);
    return data || [];
  } catch {
    return ls.get('impro_sesiones', []);
  }
}

export async function saveSesion(entry) {
  ls.set('impro_sesiones', [entry, ...ls.get('impro_sesiones', [])].slice(0, 30));
  try {
    const u = await uid();
    await supabase.from('sesiones').insert({ ...entry, user_id: u });
  } catch {}
}

// ─────────────────────────────────────────────
// GRUPOS
// ─────────────────────────────────────────────
export async function getGrupos() {
  try {
    const { data, error } = await supabase.from('grupos').select('*').order('created_at');
    if (error) throw error;
    ls.set('impro_grupos', data || []);
    return data || [];
  } catch {
    return ls.get('impro_grupos', []);
  }
}

// Admin: todos os grupos de todos os usuarios, con datos do dono.
// Require a política grupos_select con "or public.is_admin()" (supabase_universo_patch.sql)
export async function listarTodosGrupos() {
  try {
    const { data, error } = await supabase
      .from('grupos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const filas = data || [];
    const ids = [...new Set(filas.map(f => f.user_id).filter(Boolean))];
    if (ids.length === 0) return filas;
    const { data: perfis } = await supabase.from('perfis').select('id,nome,email').in('id', ids);
    const mapa = Object.fromEntries((perfis || []).map(p => [p.id, p]));
    return filas.map(f => ({ ...f, perfis: f.user_id ? mapa[f.user_id] : null }));
  } catch (e) {
    console.warn('[db] listarTodosGrupos:', e?.message);
    return [];
  }
}

export async function saveGrupo(g) {
  ls.set('impro_grupos', (() => {
    const all = ls.get('impro_grupos', []);
    const idx = all.findIndex(x => x.id === g.id);
    return idx >= 0 ? all.map(x => x.id === g.id ? g : x) : [...all, g];
  })());
  try {
    const u = await uid();
    await supabase.from('grupos').upsert({ ...g, user_id: u });
  } catch {}
}

export async function deleteGrupo(id) {
  ls.set('impro_grupos', ls.get('impro_grupos', []).filter(g => g.id !== id));
  try {
    await supabase.from('grupos').delete().eq('id', id);
  } catch {}
}

// ─────────────────────────────────────────────
// ESTATÍSTICAS
// ─────────────────────────────────────────────
export async function trackGenSupa(cat, grupoId) {
  // localStorage (síncrono, inmediato)
  const s = ls.get('impro_stats', { cats: {}, total: 0, mins: 0 });
  s.cats[cat] = (s.cats[cat] || 0) + 1;
  s.total = (s.total || 0) + 1;
  ls.set('impro_stats', s);
  if (grupoId) {
    const gs = ls.get('impro_stats_grupos', {});
    gs[grupoId] = gs[grupoId] || { cats: {} };
    gs[grupoId].cats[cat] = (gs[grupoId].cats[cat] || 0) + 1;
    ls.set('impro_stats_grupos', gs);
  }
  // Supabase async
  try {
    await supabase.rpc('increment_stat_cat', { p_cat: cat }).catch(() => {
      // Se non existe a función RPC, actualizar manualmente
      supabase.from('stats_global').select('*').eq('id', 1).single().then(({ data }) => {
        if (!data) return;
        const cats = data.cats || {};
        cats[cat] = (cats[cat] || 0) + 1;
        supabase.from('stats_global').update({ cats, total: (data.total || 0) + 1 }).eq('id', 1);
      });
    });
  } catch {}
}

export async function trackMinsSupa(mins) {
  const s = ls.get('impro_stats', { cats: {}, total: 0, mins: 0 });
  s.mins = (s.mins || 0) + mins;
  ls.set('impro_stats', s);
  try {
    const { data } = await supabase.from('stats_global').select('mins').eq('id', 1).single();
    await supabase.from('stats_global').update({ mins: (data?.mins || 0) + mins }).eq('id', 1);
  } catch {}
}

// ─────────────────────────────────────────────
// PLAYLISTS
// ─────────────────────────────────────────────
export async function getPlaylists(defaults) {
  try {
    const { data, error } = await supabase.from('playlists').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      ls.set('impro_playlists_v2', data);
      return data;
    }
    await supabase.from('playlists').insert(defaults);
    return defaults;
  } catch {
    return ls.get('impro_playlists_v2', defaults);
  }
}

export async function savePlaylists(playlists) {
  ls.set('impro_playlists_v2', playlists);
  try {
    const u = await uid();
    await supabase.from('playlists').upsert(playlists.map(p => ({ ...p, user_id: u })));
  } catch {}
}

// ─────────────────────────────────────────────
// EFECTOS
// ─────────────────────────────────────────────
export async function getEfectos(defaults) {
  try {
    const { data, error } = await supabase.from('efectos').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      ls.set('impro_efectos_v2', data);
      return data;
    }
    await supabase.from('efectos').insert(defaults);
    return defaults;
  } catch {
    return ls.get('impro_efectos_v2', defaults);
  }
}

export async function saveEfectos(efectos) {
  ls.set('impro_efectos_v2', efectos);
  try {
    const u = await uid();
    await supabase.from('efectos').upsert(efectos.map(e => ({ ...e, user_id: u })));
  } catch {}
}

// ─────────────────────────────────────────────
// SALAS QR (substitúe window.storage)
// ─────────────────────────────────────────────
export async function abrirSala(code) {
  try {
    const u = await uid();
    await supabase.from('salas').insert({ code, open: true, user_id: u });
    return true;
  } catch (e) {
    console.error('abrirSala:', e);
    return false;
  }
}

export async function cerrarSala(code, propuestas) {
  try {
    await supabase.from('salas').update({ open: false, closed_at: new Date().toISOString() }).eq('code', code);
    // Gardar historial
    const entry = {
      sala_code: code,
      fecha: new Date().toLocaleDateString('es-ES'),
      propostas: propuestas,
    };
    const u = await uid();
    await supabase.from('historial_salas').insert({ ...entry, user_id: u });
    return true;
  } catch {
    return false;
  }
}

export async function getSalaStatus(code) {
  try {
    const { data, error } = await supabase.from('salas').select('open').eq('code', code).single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function enviarProposta(salaCode, texto, cat, nivel) {
  try {
    const { error } = await supabase.from('propostas').insert({
      sala_code: salaCode,
      texto,
      cat,
      nivel,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function getPropostas(salaCode) {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .select('*')
      .eq('sala_code', salaCode)
      .order('created_at');
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export function subscribeToPropostas(salaCode, callback) {
  const channel = supabase
    .channel(`propostas:${salaCode}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'propostas',
      filter: `sala_code=eq.${salaCode}`,
    }, payload => {
      callback(payload.new);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function getHistorialSalas() {
  try {
    const { data, error } = await supabase
      .from('historial_salas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  } catch {
    return ls.get('impro_historial', []);
  }
}

// ─────────────────────────────────────────────
// FAVORITOS (localStorage só, datos persoais)
// ─────────────────────────────────────────────
export const getFavoritos = () => ls.get('impro_favoritos', []);
export const saveFavoritos = (f) => ls.set('impro_favoritos', f);
export const getFavDins = () => ls.get('impro_fav_dins', []);
export const saveFavDins = (f) => ls.set('impro_fav_dins', f);
