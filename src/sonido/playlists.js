// ═══════════════════════════════════════════════════════════════════
// SONIDO · playlists
// ═══════════════════════════════════════════════════════════════════
// Unha playlist é unha `son_coleccions` con tipo='playlist'. As pistas
// gárdanse en `config.pistas` e non como `coleccion_items`, porque unha
// pista externa (YouTube) NON é un recurso da biblioteca: é un enlace
// solto que non se quere ver en Explorar nin en Admin → Sons.
//
// ⚠️ Unha playlist pode mesturar pistas internas e externas. O que NON
// se pode é reproducilas á vez: as externas van nun marco propio e
// obrigan a calar o resto (ver audio/externo.js).
// ═══════════════════════════════════════════════════════════════════

import { getColeccions, gardarColeccion } from './recursos.js';
import { detectarProvedor, idYoutube } from '../audio/externo.js';

const CLAVE = 'impro_sonido_playlists_v1';

let contador = 0;
function novoId(pre = 'local') {
  contador += 1;
  return `${pre}-${Date.now().toString(36)}-${contador.toString(36)}`;
}

export function playlistBaleira(nome = 'Lista nova') {
  return { id: novoId(), nome, emoji: '🎵', pistas: [], local: true };
}

export function crearPista({ nome = '', url = '', recursoId = null, vol = 0.8 } = {}) {
  const provedor = recursoId ? 'interno' : detectarProvedor(url);
  return {
    id: novoId('p'),
    nome: (nome || '').trim() || nomeDesde(url) || 'Sen nome',
    url: url || null,
    recursoId: recursoId || null,
    provedor,
    vol: Math.min(1, Math.max(0, Number(vol) || 0.8)),
  };
}

function nomeDesde(url) {
  if (!url) return null;
  const yt = idYoutube(url);
  if (yt) return 'YouTube · ' + yt;
  try {
    const base = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    const n = base.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    // Maiúscula inicial: nunha lista de vinte pistas, «outro.mp3» en
    // minúscula ao lado de nomes escritos a man ve fatal.
    return n ? n.charAt(0).toUpperCase() + n.slice(1) : null;
  } catch (e) { return null; }
}

function sanear(p) {
  if (!p || typeof p !== 'object' || !p.id) return null;
  const pistas = Array.isArray(p.pistas) ? p.pistas : [];
  return {
    id: String(p.id),
    nome: typeof p.nome === 'string' && p.nome.trim() ? p.nome.trim() : 'Sen nome',
    emoji: typeof p.emoji === 'string' && p.emoji ? p.emoji : '🎵',
    pistas: pistas.filter((x) => x && (x.url || x.recursoId)).map((x) => ({
      id: x.id || novoId('p'),
      nome: typeof x.nome === 'string' && x.nome.trim() ? x.nome.trim() : 'Sen nome',
      url: x.url || null,
      recursoId: x.recursoId || null,
      // Recalcúlase sempre: un `provedor` gardado pode quedar obsoleto
      // se a URL cambia, e un erro aquí significa reproducir mal.
      provedor: x.recursoId ? 'interno' : detectarProvedor(x.url),
      vol: (() => { const n = Number(x.vol); return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.8; })(),
    })),
    local: p.local !== false,
  };
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

export async function cargarPlaylists(userId) {
  const locais = lerLocais();
  if (!userId) return { playlists: locais, motivo: null };
  try {
    const cols = await getColeccions({ tipo: 'playlist', soMeus: true, userId });
    if (cols.motivo === 'sen-conexion') return { playlists: locais, motivo: 'sen-conexion' };
    const remotas = cols.map((c) => sanear({
      id: c.id, nome: c.nome, emoji: c.emoji,
      pistas: (c.config || {}).pistas, local: false,
    })).filter(Boolean);
    return { playlists: [...remotas, ...locais], motivo: null };
  } catch (e) { return { playlists: locais, motivo: 'sen-conexion' }; }
}

export async function gardarPlaylist(pl, userId) {
  const p = sanear(pl);
  if (!p) return { ok: false, erro: 'Lista non válida' };
  if (p.nome === 'Sen nome') return { ok: false, erro: 'Ponlle un nome á lista' };

  if (!userId || p.local) {
    const l = lerLocais();
    const i = l.findIndex((x) => x.id === p.id);
    if (i >= 0) l[i] = p; else l.push(p);
    return escribirLocais(l) ? { ok: true, playlist: p } : { ok: false, erro: 'Non hai espazo' };
  }
  const r = await gardarColeccion({
    id: p.id.startsWith('local-') ? undefined : p.id,
    tipo: 'playlist', nome: p.nome, emoji: p.emoji,
    config: { pistas: p.pistas },
    visibilidade: 'privado', estado: 'borrador', userId,
  });
  if (!r.ok) return r;
  return { ok: true, playlist: { ...p, id: r.coleccion.id, local: false } };
}

export function borrarPlaylistLocal(id) {
  return escribirLocais(lerLocais().filter((p) => p.id !== id));
}

// ── Pegar unha lista de enlaces ──────────────────────────────────
// O xesto de Melodice: unha URL por liña e listo.
export function analizarLista(texto) {
  const fóra = [];
  for (const liña of String(texto || '').split(/\r?\n/)) {
    const t = liña.trim();
    if (!t) continue;
    // Admite «Nome<TAB>url» ou só a url.
    const partes = t.includes('\t') ? t.split('\t') : [t];
    const url = (partes.length > 1 ? partes[1] : partes[0]).trim();
    if (!/^https?:\/\/|^blob:/i.test(url)) continue;
    fóra.push(crearPista({ nome: partes.length > 1 ? partes[0] : '', url }));
  }
  return fóra;
}

// ── Navegación ───────────────────────────────────────────────────
export function seguinte(pl, actual, { bucle = true } = {}) {
  const n = (pl?.pistas || []).length;
  if (!n) return null;
  const i = pl.pistas.findIndex((p) => p.id === actual);
  if (i < 0) return pl.pistas[0];
  if (i + 1 < n) return pl.pistas[i + 1];
  return bucle ? pl.pistas[0] : null;
}

export function anterior(pl, actual, { bucle = true } = {}) {
  const n = (pl?.pistas || []).length;
  if (!n) return null;
  const i = pl.pistas.findIndex((p) => p.id === actual);
  if (i <= 0) return bucle ? pl.pistas[n - 1] : null;
  return pl.pistas[i - 1];
}

export function mover(pl, id, dir) {
  const l = [...(pl?.pistas || [])];
  const i = l.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= l.length) return pl;
  [l[i], l[j]] = [l[j], l[i]];
  return { ...pl, pistas: l };
}

export function quitar(pl, id) {
  return { ...pl, pistas: (pl?.pistas || []).filter((p) => p.id !== id) };
}

// Cantas pistas obrigan a modo exclusivo. Serve para avisar ANTES de
// empezar, non no medio dunha función.
export function resumo(pl) {
  const ps = pl?.pistas || [];
  const ext = ps.filter((p) => p.provedor !== 'interno');
  return {
    total: ps.length,
    internas: ps.length - ext.length,
    externas: ext.length,
    mixta: ext.length > 0 && ext.length < ps.length,
  };
}
