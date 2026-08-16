// ═══════════════════════════════════════════════════════════════════
// SONIDO · contadores
// ═══════════════════════════════════════════════════════════════════
// Sonido leva os seus propios contadores, independentes dos de En
// directo: quen leva o son pode non ser quen leva a proxección, e pode
// estar noutro dispositivo. Non é duplicación, son dous postos.
//
// ⚠️ A REGRA QUE FAI QUE ISTO FUNCIONE:
//   Non se garda o tempo transcorrido. Gárdase CANDO EMPEZOU.
//
// Un `setInterval` non sobrevive a saír da app: iOS conxélao e ao
// volver perdiches o tempo. Gardando o instante de inicio máis o
// acumulado de tramos anteriores, o valor CALCÚLASE, e por iso é
// correcto aínda que o Safari estivese descargado da memoria media
// hora. O intervalo só serve para redebuxar; se se perde, non se
// perde nada.
// ═══════════════════════════════════════════════════════════════════

export const TIPOS = ['crono', 'atras', 'reloxo'];
export const CORES = ['ok', 'info', 'warn', 'danger', 'alt'];   // tokens de tema

let contador = 0;
function novoId() {
  contador += 1;
  return 'c' + Date.now().toString(36) + contador.toString(36);
}

export function crearContador({ tipo = 'crono', etiqueta = '', cor = 'ok', minutos = 5 } = {}) {
  const t = TIPOS.includes(tipo) ? tipo : 'crono';
  return {
    id: novoId(),
    tipo: t,
    etiqueta: etiqueta.trim() || etiquetaPorDefecto(t, minutos),
    cor: CORES.includes(cor) ? cor : 'ok',
    inicioEn: Date.now(),
    acumuladoMs: 0,
    obxectivoMs: t === 'atras' ? Math.max(1, minutos) * 60000 : 0,
    correndo: t !== 'reloxo',
    avisos: t === 'atras' ? [15, 5] : [],   // minutos restantes con aviso visual
  };
}

function etiquetaPorDefecto(tipo, minutos) {
  if (tipo === 'reloxo') return 'Hora';
  if (tipo === 'atras') return `Conta atrás ${minutos} min`;
  return 'Cronómetro';
}

// Segundos que amosa o contador. `agora` é inxectable para poder
// probar tramos de horas sen esperalas.
export function segundos(c, agora = Date.now()) {
  if (!c || c.tipo === 'reloxo') return null;
  const ms = c.acumuladoMs + (c.correndo ? agora - c.inicioEn : 0);
  return c.tipo === 'atras' ? (c.obxectivoMs - ms) / 1000 : ms / 1000;
}

export function alternar(c, agora = Date.now()) {
  if (!c || c.tipo === 'reloxo') return c;
  if (c.correndo) return { ...c, acumuladoMs: c.acumuladoMs + (agora - c.inicioEn), correndo: false };
  return { ...c, inicioEn: agora, correndo: true };
}

export function reiniciar(c, agora = Date.now()) {
  if (!c || c.tipo === 'reloxo') return c;
  return { ...c, acumuladoMs: 0, inicioEn: agora };
}

// Nivel de aviso visual. Nunca sonoro por defecto: o sistema non pode
// interromper o espectáculo que se supón que está axudando a levar.
export function aviso(c, agora = Date.now()) {
  if (!c || c.tipo !== 'atras' || !c.correndo) return null;
  const s = segundos(c, agora);
  if (s <= 0) return 'pasado';
  const min = s / 60;
  const puntos = [...(c.avisos || [])].sort((a, b) => a - b);
  for (const p of puntos) if (min <= p) return p === puntos[0] ? 'urxente' : 'aviso';
  return null;
}

export function formatar(s) {
  if (s === null || s === undefined || Number.isNaN(s)) return '—';
  const neg = s < 0;
  const t = Math.floor(Math.abs(s));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const x = t % 60;
  const dd = (n) => (n < 10 ? '0' + n : String(n));
  return (neg ? '-' : '') + (h ? `${h}:${dd(m)}:${dd(x)}` : `${m}:${dd(x)}`);
}

export function horaActual(agora = Date.now()) {
  const d = new Date(agora);
  const dd = (n) => (n < 10 ? '0' + n : String(n));
  return `${dd(d.getHours())}:${dd(d.getMinutes())}:${dd(d.getSeconds())}`;
}

// ── Hitos ────────────────────────────────────────────────────────
// Marcar un momento durante a función. Guárdase o segundo do contador
// de referencia, non a hora: así segue tendo sentido ao revisalo.
export function marcarHito(hitos, c, nome = '', agora = Date.now()) {
  const s = segundos(c, agora);
  return [...(hitos || []), {
    id: novoId(),
    nome: nome.trim() || `Hito ${(hitos || []).length + 1}`,
    segundos: s === null ? 0 : Math.floor(s),
    en: agora,
  }];
}

// ── Persistencia ─────────────────────────────────────────────────
// Só datos planos. Nada de temporizadores nin de nodos vivos.
export function serializar(contadores) {
  return (contadores || []).map((c) => ({
    id: c.id, tipo: c.tipo, etiqueta: c.etiqueta, cor: c.cor,
    inicioEn: c.inicioEn, acumuladoMs: c.acumuladoMs,
    obxectivoMs: c.obxectivoMs, correndo: c.correndo, avisos: c.avisos,
  }));
}

export function deserializar(datos) {
  if (!Array.isArray(datos)) return [];
  return datos.filter((c) => c && TIPOS.includes(c.tipo)).map((c) => ({
    id: c.id || novoId(),
    tipo: c.tipo,
    etiqueta: c.etiqueta || '',
    cor: CORES.includes(c.cor) ? c.cor : 'ok',
    inicioEn: Number(c.inicioEn) || Date.now(),
    acumuladoMs: Number(c.acumuladoMs) || 0,
    obxectivoMs: Number(c.obxectivoMs) || 0,
    correndo: !!c.correndo,
    avisos: Array.isArray(c.avisos) ? c.avisos : [],
  }));
}
