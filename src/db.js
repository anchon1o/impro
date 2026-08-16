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
// As dinámicas viven na base de datos (supabase_dinamicas_seed.sql). Xa non
// hai catálogo no código: DINAMICAS_BASE desapareceu de datos.js (A04).
//
// A cadea de reserva é agora: Supabase → caché de localStorage → baleiro.
// Cando queda baleiro NON se disimula: `motivo` di por que, e a interface
// amosa un aviso.
//
// Devolve un array que ademais leva .dinamicas, .erro, .motivo e .desdeCache,
// para que non importe como o consuma quen chame (o patrón de sempre).
//
//   motivo: null | 'baleira' | 'sen-conexion'
function resultadoDin(lista, erro, motivo, desdeCache) {
  const out = Array.isArray(lista) ? lista.slice() : [];
  Object.defineProperty(out, 'dinamicas', { value: out, enumerable: false });
  Object.defineProperty(out, 'erro', { value: erro || null, enumerable: false });
  Object.defineProperty(out, 'motivo', { value: motivo || null, enumerable: false });
  Object.defineProperty(out, 'desdeCache', { value: !!desdeCache, enumerable: false });
  return out;
}

function normalizarDin(d) {
  return {
    ...d,
    id: String(d.id),
    pasos: Array.isArray(d.pasos) ? d.pasos : [],
    variantes: Array.isArray(d.variantes) ? d.variantes : [],
    duracion: Number(d.duracion) || 10,
  };
}

// O parámetro mantense aínda que non se use: se algún ficheiro quedase sen
// actualizar e seguise chamando getDinamicas(ALGO), a chamada segue sendo
// válida en vez de rebentar. Mesma razón pola que cargarCategorias devolve
// un array con propiedades.
export async function getDinamicas(_base) {
  try {
    const { data, error } = await supabase
      .from('dinamicas').select('*').order('orde', { ascending: true });
    if (error) throw error;
    if (data && data.length) {
      const lista = data.map(normalizarDin);
      ls.set('impro_dinamicas_v2', lista);
      return resultadoDin(lista, null, null, false);
    }
    // A táboa respondeu pero está baleira: falta executar a sementeira.
    // Se hai caché dunha visita anterior úsase, pero avisando.
    const cache = ls.get('impro_dinamicas_v2', []);
    if (Array.isArray(cache) && cache.length) {
      return resultadoDin(cache.map(normalizarDin), null, 'baleira', true);
    }
    return resultadoDin([], null, 'baleira', false);
  } catch (e) {
    console.warn('[db] getDinamicas:', e?.message);
    const cache = ls.get('impro_dinamicas_v2', []);
    if (Array.isArray(cache) && cache.length) {
      return resultadoDin(cache.map(normalizarDin), e?.message || null, 'sen-conexion', true);
    }
    return resultadoDin([], e?.message || null, 'sen-conexion', false);
  }
}

// Recarga forzada: bota a caché antes de preguntar. É o que fan agora os
// botóns ↺ da Guía e de Admin, que antes «restauraban» ao catálogo do
// código. Sen ese catálogo, restaurar é volver preguntarlle á base.
export async function recargarDinamicas() {
  try { localStorage.removeItem('impro_dinamicas_v2'); } catch { /* modo privado */ }
  return getDinamicas();
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

// ─────────────────────────────────────────────
// TIPOS DE DINÁMICA (configurables desde Admin)
// ─────────────────────────────────────────────
// Antes eran unha constante no código. `Object.keys(colorTipo)` devolvía
// unha lista baleira porque colorTipo é unha función, non un obxecto, e o
// desplegable de tipos quedaba sen opcións: non se podía asignar tipo a
// ningunha dinámica.
const TIPOS_FALLBACK = [
  {id:'calentamiento',nome:'Quecemento',  emoji:'🔥',cor:'warn',  orde:10,activo:true},
  {id:'entrenamiento',nome:'Adestramento',emoji:'💪',cor:'info',  orde:20,activo:true},
  {id:'juego',        nome:'Xogo',        emoji:'🎲',cor:'ok',    orde:30,activo:true},
  {id:'formato',      nome:'Formato',     emoji:'🎬',cor:'accent',orde:40,activo:true},
  {id:'musical',      nome:'Musical',     emoji:'🎵',cor:'alt',   orde:50,activo:true},
  {id:'pausa',        nome:'Pausa',       emoji:'☕',cor:'muted', orde:60,activo:true},
  {id:'cierre',       nome:'Peche',       emoji:'🌙',cor:'danger',orde:70,activo:true},
];

function resultadoTipos(lista, erro) {
  const out = (Array.isArray(lista) && lista.length) ? lista.slice() : TIPOS_FALLBACK.slice();
  Object.defineProperty(out, 'tipos', { value: out, enumerable: false });
  Object.defineProperty(out, 'erro', { value: erro || null, enumerable: false });
  return out;
}

export async function cargarTiposDinamica() {
  try {
    const { data, error } = await supabase.from('dinamicas_tipos').select('*').order('orde');
    if (error) throw error;
    if (data && data.length) { ls.set('impro_tipos_din', data); return resultadoTipos(data, null); }
    return resultadoTipos(ls.get('impro_tipos_din', []), null);
  } catch (e) {
    console.warn('[db] cargarTiposDinamica:', e?.message);
    return resultadoTipos(ls.get('impro_tipos_din', []), e?.message || 'Erro descoñecido');
  }
}

export async function gardarTipoDinamica(t) {
  const fila = {
    id: t.id, nome: t.nome, emoji: t.emoji || '🎯',
    descricion: t.descricion || '', cor: t.cor || 'accent',
    orde: Number(t.orde) || 100, activo: t.activo !== false,
  };
  const { error } = await supabase.from('dinamicas_tipos').upsert(fila);
  if (error) console.error('[db] gardarTipoDinamica:', error.message);
  return !error;
}

// Non se pode borrar un tipo en uso: deixaría dinámicas orfas.
export async function borrarTipoDinamica(id) {
  const { count } = await supabase
    .from('dinamicas').select('id', { count: 'exact', head: true }).eq('tipo', id);
  if (count > 0) return { ok: false, motivo: `Hai ${count} dinámicas deste tipo.` };
  const { error } = await supabase.from('dinamicas_tipos').delete().eq('id', id);
  return { ok: !error, motivo: error?.message };
}


// Gardado en lote de dinámicas, para a táboa masiva. Fila a fila: se unha
// falla, as demais aplícanse igual e devólvese o detalle.
export async function gardarLoteDinamicas(filas) {
  const r = { gardadas: 0, creadas: 0, erros: [] };
  for (const f of filas) {
    const fila = {
      nombre: f.nombre, tipo: f.tipo,
      duracion: Number(f.duracion) || 10,
      participantes: f.participantes || 'grupo',
      descripcion: f.descripcion || '',
      pasos: Array.isArray(f.pasos) ? f.pasos : [],
      objetivo: f.objetivo || null,
      variantes: Array.isArray(f.variantes) ? f.variantes : [],
      notas: f.notas || null, autoria: f.autoria || null,
      licencia: f.licencia || null, fuente: f.fuente || null,
    };
    if (f.id && !String(f.id).startsWith('nova-')) {
      const { error } = await supabase.from('dinamicas').update(fila).eq('id', f.id);
      if (error) r.erros.push({ nome: f.nombre, msg: error.message }); else r.gardadas++;
    } else {
      const { data: { user } = {} } = await supabase.auth.getUser();
      const { error } = await supabase.from('dinamicas')
        .insert({ ...fila, id: String(Date.now()) + Math.random().toString(36).slice(2, 6), user_id: user?.id || null });
      if (error) r.erros.push({ nome: f.nombre, msg: error.message }); else r.creadas++;
    }
  }
  return r;
}
