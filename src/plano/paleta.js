// ═══════════════════════════════════════════════════════════════════
// PLANO · paleta
// ═══════════════════════════════════════════════════════════════════
// ⚠️ O DEBUXO NON LE O TEMA. Le unha PALETA.
//
// Parece un rodeo e é o contrario. Se o SVG chamase a `useTheme()` por
// dentro, exportar unha imaxe «en claro» estando en tema escuro
// obrigaría a cambiar o tema da app enteira para xerar o ficheiro, e a
// desfacelo despois. Cunha paleta como parámetro, exportar é pasar
// outra paleta.
//
// En pantalla: `paletaDesdeTema(T)`.
// Ao exportar: `PALETAS.claro`, `.negativo` ou `.transparente`.
//
// ⚠️ As cores dos elementos son TOKENS (`ok`, `accent`, `warn`…), non
// hexadecimais. Así seguen os catro temas sen tocar nada. A paleta é
// quen traduce o token a cor; o documento nunca garda unha cor.
// ═══════════════════════════════════════════════════════════════════

export const TOKENS_COR = ['accent', 'ok', 'warn', 'info', 'alt', 'danger', 'muted'];

// ⚠️ Nada de Inter aquí. A fonte da app vén de Google Fonts, e un SVG
// exportado a PNG nun lenzo NON a ten: o texto sairía cunha fonte
// distinta á que se ve en pantalla, ou directamente descolocado. Nas
// cotas e na numeración vai unha pila do sistema, que existe sempre.
export const FONTE_PLANO = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const hex = (v, d) => (typeof v === 'string' && v.trim() ? v : d);

// Opacidade sobre unha cor de tema. Os temas usan hexadecimais de 6
// díxitos, así que engadir dous é válido; se algún día non o fose,
// devólvese a cor tal cal en vez de xerar unha cadea inválida.
export function conAlfa(cor, alfa) {
  const c = hex(cor, '#888888');
  const a = Math.max(0, Math.min(1, typeof alfa === 'number' ? alfa : 1));
  if (!/^#[0-9a-fA-F]{6}$/.test(c)) return c;
  return c + Math.round(a * 255).toString(16).padStart(2, '0');
}

// Constrúe a paleta de pantalla a partir do tema activo.
export function paletaDesdeTema(T) {
  const t = T && typeof T === 'object' ? T : {};
  const tokens = {};
  TOKENS_COR.forEach((k) => { tokens[k] = hex(t[k], '#888888'); });
  return {
    id: 'tema',
    fondo: hex(t.bg, '#0d0d0d'),
    // O chan do escenario. Non é `bg2` sen máis: ten que contrastar co
    // fondo da sala aínda nos temas claros, onde bg e bg2 son veciños.
    chan: hex(t.bg3, '#1a1a1a'),
    chanBorde: hex(t.border2, '#333333'),
    reixa: conAlfa(hex(t.border, '#2a2a2a'), 0.85),
    reixaTexto: hex(t.text4, '#666666'),
    cota: hex(t.text3, '#888888'),
    texto: hex(t.text, '#ffffff'),
    textoTenue: hex(t.text3, '#888888'),
    seleccion: hex(t.accent, '#e040fb'),
    // O halo do foco. Amarelo semántico do tema, moi transparente: ten
    // que lerse como luz, non como un círculo pintado.
    foco: hex(t.warn, '#ffb300'),
    sombra: 'rgba(0,0,0,0.35)',
    tokens,
    fonte: FONTE_PLANO,
  };
}

// ⚠️ Paletas de exportación: hexadecimais fixos a propósito. Unha
// imaxe que se manda a unha sala ou se pega nun documento non pode
// depender do tema que tivese aberto quen a exportou.
const TOKENS_IMPRESO = {
  accent: '#7b3fa0', ok: '#0f8a7a', warn: '#c96a1b', info: '#2a6fb0',
  alt: '#8a5a3c', danger: '#b23a3a', muted: '#6b6b6b',
};
const TOKENS_NEGATIVO = {
  accent: '#c98ce0', ok: '#4fd6c0', warn: '#ffb85c', info: '#6fb6f0',
  alt: '#d9a07a', danger: '#ff7b7b', muted: '#9a9a9a',
};

export const PALETAS = {
  claro: {
    id: 'claro',
    fondo: '#ffffff', chan: '#f4f2ee', chanBorde: '#3a3a3a',
    reixa: '#c9c4bc', reixaTexto: '#8a8378', cota: '#5a5a5a',
    texto: '#1a1a1a', textoTenue: '#6a6a6a',
    seleccion: '#7b3fa0', foco: '#e0a020', sombra: 'rgba(0,0,0,0.12)',
    tokens: TOKENS_IMPRESO, fonte: FONTE_PLANO,
  },
  negativo: {
    id: 'negativo',
    fondo: '#0d0d0d', chan: '#1c1c1c', chanBorde: '#5a5a5a',
    reixa: '#3a3a3a', reixaTexto: '#7a7a7a', cota: '#9a9a9a',
    texto: '#f2f2f2', textoTenue: '#9a9a9a',
    seleccion: '#c98ce0', foco: '#ffc857', sombra: 'rgba(0,0,0,0.5)',
    tokens: TOKENS_NEGATIVO, fonte: FONTE_PLANO,
  },
  transparente: {
    id: 'transparente',
    // ⚠️ `fondo: null` é o que fai que a exportación non pinte
    // rectángulo de fondo. Poñer 'transparent' non abondaría: hai que
    // NON debuxar o rectángulo, non debuxalo invisible, porque un
    // rectángulo invisible segue collendo os clics no SVG resultante.
    fondo: null, chan: null, chanBorde: '#3a3a3a',
    reixa: '#b0b0b0', reixaTexto: '#8a8378', cota: '#5a5a5a',
    texto: '#1a1a1a', textoTenue: '#6a6a6a',
    seleccion: '#7b3fa0', foco: '#e0a020', sombra: 'none',
    tokens: TOKENS_IMPRESO, fonte: FONTE_PLANO,
  },
};

export const NOMES_PALETA = { tema: 'Como se ve', claro: 'Claro', negativo: 'Negativo', transparente: 'Transparente' };

// Token → cor. É o único sitio onde se traduce.
// ⚠️ Un token descoñecido non pode devolver `undefined`: un `fill`
// baleiro en SVG píntase de NEGRO, e un actor negro sobre chan escuro
// desaparece sen dar erro.
export function cor(paleta, token, defecto = null) {
  const p = paleta && paleta.tokens ? paleta : paletaDesdeTema(null);
  if (typeof token === 'string' && p.tokens[token]) return p.tokens[token];
  if (typeof token === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(token)) return token;
  return defecto || p.tokens.accent;
}

// A paleta de exportación pedida, ou a de pantalla se se pide «como se ve».
export const paletaExportacion = (id, T) => (PALETAS[id] ? PALETAS[id] : paletaDesdeTema(T));

// ⚠️ Contraste do texto sobre unha cor de elemento. Un actor con cor
// `warn` (amarelo) leva número negro; un con `info` (azul), branco.
// Sen isto, o número dun actor claro non se le, que é xusto o dato que
// máis se mira do plano.
export function textoSobre(corFondo) {
  const c = hex(corFondo, '#888888');
  const m = /^#([0-9a-fA-F]{6})$/.exec(c);
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255; const g = (n >> 8) & 255; const b = n & 255;
  // Luminancia relativa simplificada (Rec. 709). Abonda para decidir
  // entre branco e negro; non se está validando WCAG aquí.
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.58 ? '#111111' : '#ffffff';
}
