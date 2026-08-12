// ============================================================
// reportes.js — Rexistro de fallos e propostas (🐛)
// ============================================================

import { supabase } from './supabase.js';

export const TIPOS_REPORTE = [
  {id:'bug',     label:'Fallo',    emoji:'🐛', axuda:'Algo non funciona ou funciona mal.'},
  {id:'mellora', label:'Mellora',  emoji:'💡', axuda:'Unha idea para mellorar a app.'},
  {id:'dúbida',  label:'Dúbida',   emoji:'❓', axuda:'Non entendes como funciona algo.'},
];

export const ESTADOS_REPORTE = [
  {id:'aberto',     label:'Aberto',     cor:'warn'},
  {id:'en_curso',   label:'En curso',   cor:'info'},
  {id:'resolto',    label:'Resolto',    cor:'ok'},
  {id:'descartado', label:'Descartado', cor:'muted'},
];

// Contexto automático. Aforra ter que preguntar «onde estabas?» e
// «que navegador usas?», que é o que sempre falta nun reporte.
export function contextoActual(onde) {
  try {
    return {
      onde: onde || '',
      navegador: navigator.userAgent.slice(0, 200),
      pantalla: `${window.innerWidth}x${window.innerHeight}`,
      tema: `${localStorage.getItem('impro_tema') || 'impro'}/${localStorage.getItem('impro_theme') || 'dark'}`,
      version: 'v8',
    };
  } catch {
    return { onde: onde || '', navegador: '', pantalla: '', tema: '', version: 'v8' };
  }
}

export async function enviarReporte({tipo, titulo, detalle, contacto, ctx}) {
  const { data: { user } = {} } = await supabase.auth.getUser();
  const { error } = await supabase.from('reportes').insert({
    tipo: tipo || 'bug',
    titulo: (titulo || '').trim(),
    detalle: (detalle || '').trim(),
    contacto: (contacto || '').trim(),
    user_id: user?.id || null,
    estado: 'aberto',
    ...ctx,
  });
  if (error) { console.error('[reportes] enviar:', error.message); return { ok:false, erro:error.message }; }
  return { ok:true };
}

export async function listarReportes(estado) {
  let q = supabase.from('reportes').select('*').order('created_at', { ascending:false });
  if (estado && estado !== 'todos') q = q.eq('estado', estado);
  const { data, error } = await q;
  if (error) { console.error('[reportes] listar:', error.message); return { reportes:[], erro:error.message }; }
  // O autor vén de auth.users, non de perfis: hai que buscalo á parte.
  // Un join implícito a perfis devolvería lista baleira (ver B13).
  const ids = [...new Set((data||[]).map(r => r.user_id).filter(Boolean))];
  let mapa = {};
  if (ids.length) {
    const { data: perfis } = await supabase.from('perfis').select('id,nome,email').in('id', ids);
    mapa = Object.fromEntries((perfis||[]).map(p => [p.id, p.nome || p.email]));
  }
  return { reportes: (data||[]).map(r => ({...r, autor: mapa[r.user_id] || null})), erro:null };
}

export async function actualizarReporte(id, campos) {
  const patch = {};
  for (const k of ['estado','prioridade','nota_admin']) if (campos[k] !== undefined) patch[k] = campos[k];
  const { error } = await supabase.from('reportes').update(patch).eq('id', id);
  if (error) console.error('[reportes] actualizar:', error.message);
  return !error;
}

export async function borrarReporte(id) {
  const { error } = await supabase.from('reportes').delete().eq('id', id);
  return !error;
}

// Exporta a markdown, para pegar directamente nunha conversa con Claude.
export function reportesAMarkdown(reportes) {
  const T = {bug:'🐛', mellora:'💡', 'dúbida':'❓'};
  const abertos = reportes.filter(r => r.estado === 'aberto' || r.estado === 'en_curso');
  let out = `# ImproApp — fallos e propostas\n\n${abertos.length} entradas abertas de ${reportes.length} totais.\n\n`;
  for (const t of ['bug','mellora','dúbida']) {
    const lista = abertos.filter(r => r.tipo === t);
    if (!lista.length) continue;
    out += `## ${T[t]} ${t === 'bug' ? 'Fallos' : t === 'mellora' ? 'Melloras' : 'Dúbidas'}\n\n`;
    for (const r of lista) {
      out += `### ${r.titulo}\n`;
      out += `- Estado: ${r.estado} · Prioridade: ${r.prioridade}\n`;
      if (r.onde) out += `- Onde: ${r.onde}\n`;
      if (r.pantalla) out += `- Pantalla: ${r.pantalla} · Tema: ${r.tema}\n`;
      if (r.detalle) out += `\n${r.detalle}\n`;
      if (r.nota_admin) out += `\n> Nota: ${r.nota_admin}\n`;
      out += `\n`;
    }
  }
  return out;
}
