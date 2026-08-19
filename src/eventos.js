// ============================================================
// eventos.js — Axenda de eventos vinculada a Universo
// ============================================================

import { supabase } from './supabase.js';

export const ESTADOS_EVENTO = [
  {id:'pendente',  label:'Pendente',  cor:'warn'},
  {id:'publicado', label:'Publicado', cor:'ok'},
  {id:'borrador',  label:'Borrador',  cor:'muted'},
  {id:'rexeitado', label:'Rexeitado', cor:'danger'},
  {id:'cancelado', label:'Cancelado', cor:'danger'},
];

export const TIPOS_EVENTO = [
  {id:'obradoiro', label:'Obradoiro', emoji:'🎓', cor:'info'},
  {id:'curso',     label:'Curso',     emoji:'📚', cor:'accent'},
  {id:'show',      label:'Show',      emoji:'🎭', cor:'ok'},
  {id:'festival',  label:'Festival',  emoji:'🎪', cor:'warn'},
  {id:'xornada',   label:'Xornada',   emoji:'📅', cor:'alt'},
  {id:'outro',     label:'Outro',     emoji:'📌', cor:'muted'},
];

export const tipoEvento = id => TIPOS_EVENTO.find(t => t.id === id) || TIPOS_EVENTO[5];

function mapRow(d) {
  return {
    id: d.id, titulo: d.titulo, tipo: d.tipo, desc: d.descricion || '',
    dataInicio: d.data_inicio, dataFin: d.data_fin || null, hora: d.hora || '',
    organizaId: d.organiza_id || null, lugarId: d.lugar_id || null,
    cidade: d.cidade || '', enderezo: d.enderezo || '',
    lat: d.lat != null ? Number(d.lat) : null,
    lon: d.lon != null ? Number(d.lon) : null,
    url: d.url || '', prezo: d.prezo || '',
    estado: d.estado, userId: d.user_id, creadoEn: d.created_at,
    notaRevision: d.nota_revision || '',
  };
}

function aFila(e) {
  const temCoords = e.lat != null && e.lon != null && e.lat !== '' && e.lon !== '';
  return {
    titulo: (e.titulo || '').trim(),
    tipo: e.tipo || 'show',
    descricion: (e.desc || '').trim(),
    data_inicio: e.dataInicio,
    data_fin: e.dataFin || null,
    hora: (e.hora || '').trim(),
    organiza_id: e.organizaId || null,
    lugar_id: e.lugarId || null,
    cidade: (e.cidade || '').trim(),
    enderezo: (e.enderezo || '').trim(),
    lat: temCoords ? Number(e.lat) : null,
    lon: temCoords ? Number(e.lon) : null,
    url: (e.url || '').trim(),
    prezo: (e.prezo || '').trim(),
    estado: e.estado || 'publicado',
  };
}

// Devolve un array coas propiedades .eventos e .erro, para que sirva tanto
// se se consome como lista coma se se desestrutura. Mesma decisión ca en
// cargarCategorias: evita que unha mestura de versións tumbe a app.
function resultado(lista, erro) {
  const out = Array.isArray(lista) ? lista.slice() : [];
  Object.defineProperty(out, 'eventos', { value: out, enumerable: false });
  Object.defineProperty(out, 'erro', { value: erro || null, enumerable: false });
  return out;
}

// Moderación: cambiar de estado deixa rastro de quen revisou e cando.
export async function moderarEvento(id, estado, nota) {
  const { data: { user } = {} } = await supabase.auth.getUser();
  const patch = { estado, revisado_por: user?.id || null, revisado_en: new Date().toISOString() };
  if (nota !== undefined) patch.nota_revision = nota;
  const { error } = await supabase.from('eventos').update(patch).eq('id', id);
  if (error) console.error('[eventos] moderar:', error.message);
  return !error;
}

export async function listarEventos({ desde, ata, incluirPasados = false, estado } = {}) {
  try {
    let q = supabase.from('eventos').select('*').order('data_inicio');
    if (estado && estado !== 'todos') q = q.eq('estado', estado);
    if (desde) q = q.gte('data_inicio', desde);
    else if (!incluirPasados) {
      // Un evento de varios días segue vixente ata a súa data de fin
      const hoxe = new Date().toISOString().slice(0, 10);
      q = q.or(`data_fin.gte.${hoxe},and(data_fin.is.null,data_inicio.gte.${hoxe})`);
    }
    if (ata) q = q.lte('data_inicio', ata);
    const { data, error } = await q;
    if (error) throw error;
    return resultado((data || []).map(mapRow), null);
  } catch (e) {
    console.warn('[eventos] listar:', e?.message);
    return resultado([], e?.message || 'Erro descoñecido');
  }
}

export async function gardarEvento(ev, { admin = false } = {}) {
  const { data: { user } = {} } = await supabase.auth.getUser();
  const fila = aFila(ev);
  // A política RLS esixe estado='pendente' a quen non é admin. Se se manda
  // outro, o insert é rexeitado; mellor forzalo aquí que fallar despois.
  if (!admin) fila.estado = 'pendente';
  if (ev.id) {
    const { error } = await supabase.from('eventos').update(fila).eq('id', ev.id);
    if (error) console.error('[eventos] actualizar:', error.message);
    return { ok: !error, erro: error?.message };
  }
  const { error } = await supabase.from('eventos').insert({ ...fila, user_id: user?.id || null });
  if (error) console.error('[eventos] crear:', error.message);
  return { ok: !error, erro: error?.message };
}

export async function borrarEvento(id) {
  const { error } = await supabase.from('eventos').delete().eq('id', id);
  return !error;
}

// ── Utilidades de data ──────────────────────────────────────────────
export const hoxeISO = () => new Date().toISOString().slice(0, 10);

export function formatarData(iso, fin) {
  if (!iso) return '';
  const M = ['xan','feb','mar','abr','mai','xuñ','xul','ago','set','out','nov','dec'];
  const d = new Date(iso + 'T12:00:00');
  const txt = `${d.getDate()} ${M[d.getMonth()]}`;
  if (!fin || fin === iso) return `${txt} ${d.getFullYear()}`;
  const f = new Date(fin + 'T12:00:00');
  if (f.getMonth() === d.getMonth() && f.getFullYear() === d.getFullYear())
    return `${d.getDate()}–${f.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
  return `${txt} – ${f.getDate()} ${M[f.getMonth()]} ${f.getFullYear()}`;
}

// Agrupa por mes, mantendo a orde cronolóxica.
export function agruparPorMes(eventos) {
  const M = ['Xaneiro','Febreiro','Marzo','Abril','Maio','Xuño','Xullo',
             'Agosto','Setembro','Outubro','Novembro','Decembro'];
  const mapa = new Map();
  for (const e of eventos) {
    const d = new Date(e.dataInicio + 'T12:00:00');
    const chave = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (!mapa.has(chave)) mapa.set(chave, { chave, label: `${M[d.getMonth()]} ${d.getFullYear()}`, eventos: [] });
    mapa.get(chave).eventos.push(e);
  }
  return [...mapa.values()];
}

// ─────────────────────────────────────────────
// VISTA DE CALENDARIO
// ─────────────────────────────────────────────

// Devolve as semanas dun mes como matriz de días, empezando en luns.
// Inclúe os días de recheo do mes anterior e seguinte para que a grella
// quede completa: sen eles as columnas descolócanse.
export function semanasDoMes(ano, mes) {
  const primeiro = new Date(ano, mes, 1);
  const desprazamento = (primeiro.getDay() + 6) % 7;   // luns = 0
  const inicio = new Date(ano, mes, 1 - desprazamento);
  const semanas = [];
  for (let s = 0; s < 6; s++) {
    const dias = [];
    for (let d = 0; d < 7; d++) {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + s * 7 + d);
      dias.push({
        iso: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`,
        dia: data.getDate(),
        doMes: data.getMonth() === mes,
      });
    }
    semanas.push(dias);
    // Non debuxar unha sexta fila baleira
    const ultimo = dias[6];
    if (s >= 4 && !ultimo.doMes && !dias[0].doMes) { semanas.pop(); break; }
  }
  return semanas;
}

// Un evento ocupa todos os días entre a data de inicio e a de fin.
export function eventosDoDia(eventos, iso) {
  return (eventos || []).filter(e => {
    const ini = e.dataInicio;
    const fin = e.dataFin || e.dataInicio;
    return iso >= ini && iso <= fin;
  });
}

export const MESES = ['Xaneiro','Febreiro','Marzo','Abril','Maio','Xuño','Xullo',
                      'Agosto','Setembro','Outubro','Novembro','Decembro'];
// ⚠️ A versión vella era ['L','M','X','X','V','S','D']: dous «X» para
// mércores e xoves. Nin en galego se distinguían.
// Dúas letras, que é o mínimo para que non haxa ambigüidade en ningún
// dos tres idiomas.
export const DIAS_SEMANA_LANG = {
  gl: ['Lu', 'Ma', 'Mé', 'Xo', 'Ve', 'Sá', 'Do'],
  es: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
};

export const MESES_LANG = {
  gl: ['Xaneiro', 'Febreiro', 'Marzo', 'Abril', 'Maio', 'Xuño',
       'Xullo', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Decembro'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June',
       'July', 'August', 'September', 'October', 'November', 'December'],
};

export const diasSemana = (lang) => DIAS_SEMANA_LANG[lang] || DIAS_SEMANA_LANG.gl;
export const meses = (lang) => MESES_LANG[lang] || MESES_LANG.gl;

// Compatibilidade: quen aínda importe as constantes vellas segue tendo
// galego, en vez de romper.
export const DIAS_SEMANA = DIAS_SEMANA_LANG.gl;
