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
    desc: d.descricion, tags: d.tags || [], logo: d.logo,
    // M06
    logoUrl: d.logo_url || '',
    ligazons: d.ligazons || {},
    datos: d.datos || {},
    dataInicio: d.data_inicio || null, dataFin: d.data_fin || null,
    activo: d.activo !== false,
    // `web` conservábase como columna solta; agora é unha ligazón máis.
    // Mantense no obxecto para non romper nada que aínda a lea.
    web: (d.ligazons && d.ligazons.web) || d.web || '',
    estado: d.estado || (d.verificado ? 'publicada' : 'pendente'),
    verificado: d.verificado,
    propostaNome: d.proposta_nome || '', propostaEmail: d.proposta_email || '',
    notaRevision: d.nota_revision || '',
    userId: d.user_id, creadoEn: d.created_at,
  };
}

// Só se escriben os campos con contido: así a regra «na ficha aparecen os
// campos que teñan valor» é unha propiedade dos datos, non do pintado.
function limpar(obj) {
  const fóra = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === null || v === undefined || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    fóra[k] = v;
  }
  return fóra;
}

function aFila(entry) {
  const ligazons = limpar(entry.ligazons || (entry.web ? { web: entry.web } : {}));
  return {
    tipo: entry.tipo, nome: entry.nome,
    pais: entry.pais || '🌍', cidade: entry.cidade || '',
    descricion: entry.desc, tags: entry.tags || [],
    logo: entry.logo || '🎭', logo_url: entry.logoUrl || null,
    ligazons, datos: limpar(entry.datos),
    data_inicio: entry.dataInicio || null, data_fin: entry.dataFin || null,
    activo: entry.activo !== false,
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
// ⚠️ `verificado` xa non é escribible: é unha columna XERADA a partir de
// `estado`. Escribir nela devolve «column can only be updated to DEFAULT».
export async function engadirUniverso(entry, userId, publicarDirecto = false) {
  const { data, error } = await supabase
    .from('universo')
    .insert({
      ...aFila(entry),
      estado: publicarDirecto ? 'publicada' : 'pendente',
      user_id: publicarDirecto ? null : (userId || null),
      proposta_nome: entry.propostaNome || null,
      proposta_email: entry.propostaEmail || null,
    })
    .select()
    .single();
  if (error) { console.error('[universo] erro ao engadir:', error.message); return null; }
  return mapRow(data);
}

const MAPA_EDIT = {
  tipo:'tipo', nome:'nome', pais:'pais', cidade:'cidade', desc:'descricion',
  tags:'tags', logo:'logo', logoUrl:'logo_url', ligazons:'ligazons',
  datos:'datos', dataInicio:'data_inicio', dataFin:'data_fin', activo:'activo',
  estado:'estado', notaRevision:'nota_revision',
};

export async function editarUniverso(id, campos) {
  const patch = {};
  for (const [k, col] of Object.entries(MAPA_EDIT)) {
    if (campos[k] !== undefined) {
      patch[col] = (k === 'ligazons' || k === 'datos') ? limpar(campos[k]) : campos[k];
    }
  }
  // Compatibilidade: quen aínda pase `web` solta, vai a ligazons.web
  if (campos.web !== undefined && campos.ligazons === undefined) {
    const { data } = await supabase.from('universo').select('ligazons').eq('id', id).maybeSingle();
    patch.ligazons = limpar({ ...(data?.ligazons || {}), web: campos.web });
  }
  if (Object.keys(patch).length === 0) return true;
  const { error } = await supabase.from('universo').update(patch).eq('id', id);
  if (error) console.error('[universo] editar:', error.message);
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
    .eq('estado', 'pendente')
    .order('created_at', { ascending: false });
  if (error) { console.error('[universo] listarPendentes:', error.message); return []; }
  return anexarPerfis(data || []);
}

// Moderación (M08). Aprobar xa non borra nada nin duplica filas: só cambia
// o estado, de xeito que se conserva o historial e a autoría da proposta.
export async function moderarUniverso(id, estado, nota) {
  const { data: { user } = {} } = await supabase.auth.getUser();
  const patch = { estado, revisado_por: user?.id || null, revisado_en: new Date().toISOString() };
  if (nota !== undefined) patch.nota_revision = nota;
  const { error } = await supabase.from('universo').update(patch).eq('id', id);
  if (error) console.error('[universo] moderar:', error.message);
  return !error;
}

// Compatibilidade coa chamada antiga do panel de Admin.
export async function verificarUniverso(id, verificar) {
  return verificar ? moderarUniverso(id, 'publicada') : moderarUniverso(id, 'rexeitada');
}

// ─────────────────────────────────────────────
// CATEGORÍAS (M07)
// ─────────────────────────────────────────────
export async function cargarCategorias() {
  try {
    const { data, error } = await supabase
      .from('universo_categorias').select('*').order('orde');
    if (error) throw error;
    if (data && data.length) { ls.set('impro_universo_cats', data); return data; }
    return ls.get('impro_universo_cats', []);
  } catch (e) {
    console.warn('[universo] categorías desde caché:', e?.message);
    return ls.get('impro_universo_cats', []);
  }
}

export async function gardarCategoria(cat) {
  const fila = {
    id: cat.id, nome: cat.nome, emoji: cat.emoji || '🎭',
    descricion: cat.descricion || '', plantilla: cat.plantilla || 'entidade',
    orde: Number(cat.orde) || 100, activa: cat.activa !== false,
    campos_activos: Array.isArray(cat.camposActivos) ? cat.camposActivos : null,
  };
  const { error } = await supabase.from('universo_categorias').upsert(fila);
  if (error) console.error('[universo] gardarCategoria:', error.message);
  return !error;
}

// Non se pode borrar unha categoría en uso: deixaría fichas orfas.
export async function borrarCategoria(id) {
  const { count } = await supabase
    .from('universo').select('id', { count: 'exact', head: true }).eq('tipo', id);
  if (count > 0) return { ok: false, motivo: `Hai ${count} fichas nesta categoría.` };
  const { error } = await supabase.from('universo_categorias').delete().eq('id', id);
  return { ok: !error, motivo: error?.message };
}
