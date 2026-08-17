// ═══════════════════════════════════════════════════════════════════
// SONIDO · capa de datos
// ═══════════════════════════════════════════════════════════════════
// Segue as convencións de db.js:
//   · Patrón de compatibilidade: as cargas devolven un ARRAY que ademais
//     leva propiedades, para que `const l = await x()` e
//     `const {recursos} = await x()` funcionen os dous. Cambiar a forma
//     de retorno xa rompeu a app cando un ficheiro se actualizou e outro
//     non.
//   · ⚠️ NADA de joins con `perfis`: `user_id` referencia `auth.users`.
//     `.select('*, perfis(nome)')` devolve lista baleira SEN erro
//     aparente. Consúltase á parte con `.in('id', ids)`.
//   · Caché en localStorage: nun local sen cobertura, a mesa ten que
//     abrir igual.
// ═══════════════════════════════════════════════════════════════════

import { supabase } from '../supabase.js';

const CACHE_REC = 'son_recursos_v1';
const CACHE_COL = 'son_coleccions_v1';
const CACHE_TAGS = 'son_tags_v1';
const HORAS_24 = 24 * 60 * 60 * 1000;

function ler(clave, maxIdade = HORAS_24) {
  try {
    const cru = localStorage.getItem(clave);
    if (!cru) return null;
    const { en, datos } = JSON.parse(cru);
    if (maxIdade && Date.now() - en > maxIdade) return null;
    return Array.isArray(datos) ? datos : null;
  } catch (e) { return null; }
}

function gardar(clave, datos) {
  try { localStorage.setItem(clave, JSON.stringify({ en: Date.now(), datos })); }
  catch (e) { /* cota chea ou modo privado: non é motivo para romper nada */ }
}

// Array con propiedades. `motivo` distingue tres cousas que antes se
// confundían nunha soa: cargando, baleiro de verdade e sen conexión.
function resultado(lista, { erro = null, motivo = null, desdeCache = false } = {}) {
  const r = Array.isArray(lista) ? lista.slice() : [];
  r.erro = erro;
  r.motivo = motivo || (r.length ? null : (erro ? 'sen-conexion' : 'baleira'));
  r.desdeCache = desdeCache;
  r.recursos = r;
  r.coleccions = r;
  r.tags = r;
  return r;
}

// ── RECURSOS ─────────────────────────────────────────────────────
export async function getRecursos({ tipo = null, soMeus = false, userId = null } = {}) {
  try {
    let q = supabase.from('son_recursos').select('*').order('nome');
    if (tipo) q = q.eq('tipo', tipo);
    if (soMeus && userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (error) throw error;
    const lista = (data || []).map(normalizar);
    if (lista.length) gardar(CACHE_REC, lista);
    return resultado(lista);
  } catch (e) {
    const cache = ler(CACHE_REC);
    if (cache) return resultado(cache, { erro: e, motivo: 'sen-conexion', desdeCache: true });
    return resultado([], { erro: e, motivo: 'sen-conexion' });
  }
}

// ⚠️ Non supoñer que unha columna existe. Cando `dinamicas` non tiña
// `participantes`, o insert fallou enteiro (B37). Aquí normalízase todo
// con valores por defecto para que a interface nunca reciba `undefined`.
function normalizar(r) {
  return {
    id: r.id,
    tipo: r.tipo || 'efecto',
    nome: r.nome || 'Sen nome',
    descricion: r.descricion || '',
    orixe: r.orixe || 'propio',
    provedor: r.provedor || null,
    url: r.url || null,
    ruta: r.ruta || null,
    duracionMs: r.duracion_ms || null,
    modo: r.modo || 'once',
    vol: typeof r.vol_defecto === 'number' ? r.vol_defecto : 0.8,
    emoji: r.emoji || '',
    cor: r.cor || null,
    licenza: r.licenza || null,
    autoria: r.autoria || null,
    fonte: r.fonte || null,
    visibilidade: r.visibilidade || 'privado',
    estado: r.estado || 'borrador',
    gardados: r.gardados || 0,
    userId: r.user_id || null,
  };
}

function aFila(r) {
  return {
    tipo: r.tipo, nome: r.nome, descricion: r.descricion || null,
    orixe: r.orixe || 'propio', provedor: r.provedor || null,
    url: r.url || null, ruta: r.ruta || null,
    duracion_ms: r.duracionMs || null,
    modo: r.modo || 'once',
    vol_defecto: typeof r.vol === 'number' ? r.vol : 0.8,
    emoji: r.emoji || null, cor: r.cor || null,
    licenza: r.licenza || null, autoria: r.autoria || null, fonte: r.fonte || null,
    visibilidade: r.visibilidade || 'privado',
    estado: r.estado || 'borrador',
    user_id: r.userId || null,
    updated_at: new Date().toISOString(),
  };
}

export async function gardarRecurso(r) {
  const erro = validarRecurso(r);
  if (erro) return { ok: false, erro };
  try {
    const fila = aFila(r);
    const q = r.id
      ? supabase.from('son_recursos').update(fila).eq('id', r.id).select().single()
      : supabase.from('son_recursos').insert(fila).select().single();
    const { data, error } = await q;
    if (error) throw error;
    return { ok: true, recurso: data ? normalizar(data) : null };
  } catch (e) { return { ok: false, erro: e.message || String(e) }; }
}

// Valídase aquí e non só na base: un aviso claro antes de gardar é
// mellor que un «permission denied» no medio dun show.
export function validarRecurso(r) {
  if (!r) return 'Non hai recurso';
  if (!r.nome || !r.nome.trim()) return 'Fai falta un nome';
  if (!['efecto', 'ambiente', 'musica'].includes(r.tipo)) return 'Tipo non válido';
  if (!['propio', 'externo', 'dispositivo'].includes(r.orixe || 'propio')) return 'Orixe non válida';
  if (r.orixe === 'externo' && !r.url) return 'Un recurso externo precisa unha URL';
  if (r.orixe === 'propio' && !r.url && !r.ruta) return 'Falta o ficheiro';
  if (!['once', 'toggle', 'loop', 'hold'].includes(r.modo || 'once')) return 'Modo non válido';
  const v = typeof r.vol === 'number' ? r.vol : 0.8;
  if (v < 0 || v > 1) return 'O volume ten que estar entre 0 e 1';
  return null;
}

export async function borrarRecurso(id) {
  try {
    const { error } = await supabase.from('son_recursos').delete().eq('id', id);
    if (error) throw error;
    return { ok: true };
  } catch (e) { return { ok: false, erro: e.message || String(e) }; }
}

// ── COLECCIÓNS ───────────────────────────────────────────────────
export async function getColeccions({ tipo = null, soMeus = false, userId = null } = {}) {
  try {
    let q = supabase.from('son_coleccions').select('*').order('nome');
    if (tipo) q = q.eq('tipo', tipo);
    if (soMeus && userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (error) throw error;
    const lista = (data || []).map(normalizarCol);
    if (lista.length) gardar(CACHE_COL, lista);
    return resultado(lista);
  } catch (e) {
    const cache = ler(CACHE_COL);
    if (cache) return resultado(cache, { erro: e, motivo: 'sen-conexion', desdeCache: true });
    return resultado([], { erro: e, motivo: 'sen-conexion' });
  }
}

function normalizarCol(c) {
  return {
    id: c.id,
    tipo: c.tipo || 'playlist',
    nome: c.nome || 'Sen nome',
    descricion: c.descricion || '',
    config: c.config && typeof c.config === 'object' ? c.config : {},
    emoji: c.emoji || '',
    cor: c.cor || null,
    visibilidade: c.visibilidade || 'privado',
    estado: c.estado || 'borrador',
    gardados: c.gardados || 0,
    orixeId: c.orixe_id || null,
    userId: c.user_id || null,
  };
}

export async function gardarColeccion(c) {
  if (!c || !c.nome || !c.nome.trim()) return { ok: false, erro: 'Fai falta un nome' };
  if (!['playlist', 'escena', 'mesa', 'pack'].includes(c.tipo)) return { ok: false, erro: 'Tipo non válido' };
  try {
    const fila = {
      tipo: c.tipo, nome: c.nome, descricion: c.descricion || null,
      config: c.config || {}, emoji: c.emoji || null, cor: c.cor || null,
      visibilidade: c.visibilidade || 'privado', estado: c.estado || 'borrador',
      orixe_id: c.orixeId || null, user_id: c.userId || null,
      updated_at: new Date().toISOString(),
    };
    const q = c.id
      ? supabase.from('son_coleccions').update(fila).eq('id', c.id).select().single()
      : supabase.from('son_coleccions').insert(fila).select().single();
    const { data, error } = await q;
    if (error) throw error;
    return { ok: true, coleccion: data ? normalizarCol(data) : null };
  } catch (e) { return { ok: false, erro: e.message || String(e) }; }
}

// Os elementos reescríbense enteiros: `orde` é posicional e reconciliar
// altas, baixas e reordenacións por separado é onde aparecen os ocos.
export async function gardarItems(coleccionId, items) {
  try {
    const { error: e1 } = await supabase.from('son_coleccion_items').delete().eq('coleccion_id', coleccionId);
    if (e1) throw e1;
    if (!items || !items.length) return { ok: true, n: 0 };
    const filas = items.map((it, i) => ({
      coleccion_id: coleccionId,
      orde: i,
      recurso_id: it.recursoId || null,
      fillo_id: it.recursoId ? null : (it.filloId || null),
      opcions: it.opcions || {},
    }));
    const { error: e2 } = await supabase.from('son_coleccion_items').insert(filas);
    if (e2) throw e2;
    return { ok: true, n: filas.length };
  } catch (e) { return { ok: false, erro: e.message || String(e) }; }
}

export async function getItems(coleccionId) {
  try {
    const { data, error } = await supabase.from('son_coleccion_items')
      .select('*').eq('coleccion_id', coleccionId).order('orde');
    if (error) throw error;
    return resultado((data || []).map((it) => ({
      id: it.id, orde: it.orde,
      recursoId: it.recurso_id || null,
      filloId: it.fillo_id || null,
      opcions: it.opcions && typeof it.opcions === 'object' ? it.opcions : {},
    })));
  } catch (e) { return resultado([], { erro: e, motivo: 'sen-conexion' }); }
}

// ── ETIQUETAS ────────────────────────────────────────────────────
export async function getTags() {
  const cache = ler(CACHE_TAGS, HORAS_24 * 7);   // cambian moi pouco
  if (cache) return resultado(cache, { desdeCache: true });
  try {
    const { data, error } = await supabase.from('son_tags').select('*').order('categoria').order('orde');
    if (error) throw error;
    const lista = (data || []).map((t) => ({
      id: t.id, categoria: t.categoria, nome: t.nome,
      oficial: t.oficial !== false, orde: t.orde || 0,
    }));
    if (lista.length) gardar(CACHE_TAGS, lista);
    return resultado(lista);
  } catch (e) { return resultado([], { erro: e, motivo: 'sen-conexion' }); }
}

export function agruparTags(tags) {
  const g = { tono: [], universo: [], funcion: [], caracteristica: [] };
  for (const t of tags || []) if (g[t.categoria]) g[t.categoria].push(t);
  return g;
}

// ── DUPLICAR ─────────────────────────────────────────────────────
// §28: duplicar crea unha copia independente. Modificar a copia nunca
// pode tocar o orixinal, así que a copia nace privada e en borrador.
export async function duplicarColeccion(coleccionId, userId) {
  try {
    const { data: orixe, error } = await supabase.from('son_coleccions')
      .select('*').eq('id', coleccionId).single();
    if (error) throw error;
    const copia = await gardarColeccion({
      tipo: orixe.tipo,
      nome: (orixe.nome || 'Sen nome') + ' (copia)',
      descricion: orixe.descricion,
      config: orixe.config,
      emoji: orixe.emoji, cor: orixe.cor,
      visibilidade: 'privado', estado: 'borrador',
      orixeId: coleccionId, userId,
    });
    if (!copia.ok) return copia;
    const items = await getItems(coleccionId);
    if (items.length) await gardarItems(copia.coleccion.id, items);
    return { ok: true, coleccion: copia.coleccion, n: items.length };
  } catch (e) { return { ok: false, erro: e.message || String(e) }; }
}

// ── GARDADO EN LOTE ──────────────────────────────────────────────
// Para a edición masiva en Admin. Vai fila a fila e non nun só insert
// a propósito: se unha fila é mala, quérese saber CAL, non perder as
// cincuenta boas. É a lección de B37, onde un insert enteiro fallou
// por unha columna e non se soubo por que.
export async function gardarLoteRecursos(filas, userId) {
  const r = { gardados: 0, creados: 0, erros: [] };
  for (const f of filas || []) {
    const erro = validarRecurso(f);
    if (erro) { r.erros.push({ nome: f.nome || '(sen nome)', msg: erro }); continue; }
    const fila = aFila({ ...f, userId: f.userId || userId });
    try {
      if (f.id && !String(f.id).startsWith('nova-')) {
        const { error } = await supabase.from('son_recursos').update(fila).eq('id', f.id);
        if (error) throw error;
        r.gardados++;
      } else {
        const { error } = await supabase.from('son_recursos').insert(fila);
        if (error) throw error;
        r.creados++;
      }
    } catch (e) {
      r.erros.push({ nome: f.nome || '(sen nome)', msg: e.message || String(e) });
    }
  }
  return r;
}

// Pegar desde unha folla de cálculo. Excel, Numbers e Google Sheets
// copian con TABULADORES entre columnas e saltos de liña entre filas.
// Acéptanse tamén punto e coma por se o texto vén doutro sitio.
//
// ⚠️ As comas NON valen como separador: as descricións e os nomes
// levan comas constantemente e partiríanse polo medio (é o que causou
// B33 nos campos de lista).
export function analizarPegado(texto, columnas) {
  const liñas = String(texto || '').split(/\r?\n/).filter((l) => l.trim());
  const fóra = [];
  for (const liña of liñas) {
    const partes = liña.includes('\t') ? liña.split('\t') : liña.split(';');
    const fila = {};
    columnas.forEach((c, i) => { fila[c] = (partes[i] || '').trim(); });
    // Unha liña cunha soa columna que pareza URL é un caso frecuente:
    // pégase unha lista de enlaces soa. Trátase como url, non como nome.
    if (partes.length === 1 && /^https?:\/\//i.test(partes[0].trim())) {
      const url = partes[0].trim();
      fóra.push({ url, nome: nomeDesdeUrl(url) });
      continue;
    }
    fóra.push(fila);
  }
  return fóra;
}

export function nomeDesdeUrl(url) {
  try {
    const ruta = new URL(url).pathname;
    const base = decodeURIComponent(ruta.split('/').pop() || '');
    const senExt = base.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    return senExt ? senExt.charAt(0).toUpperCase() + senExt.slice(1) : 'Sen nome';
  } catch (e) { return 'Sen nome'; }
}
