// ═══════════════════════════════════════════════════════════════════
// PLANO · xeometría
// ═══════════════════════════════════════════════════════════════════
// Todo o que ten que ver con coordenadas, reixa e proxección. Módulo
// puro: NON importa React, NON toca o DOM e NON le o tema.
//
// ⚠️ É a única fonte de verdade da xeometría. As dúas vistas —planta e
// público— chaman aquí. Se cada unha fixese as súas contas, un actor
// aparecería nun sitio na planta e noutro na vista de público, e o erro
// sería invisible ata que alguén comparase as dúas ao lado (que é
// exactamente o que fai a vista doble).
//
// ── SISTEMA DE COORDENADAS ──────────────────────────────────────────
//
// Normalizadas 0..1, NUNCA píxeles.
//
//   x = 0  bordo esquerdo do escenario      x = 1  bordo dereito
//   y = 0  FONDO (foro)                     y = 1  bordo do PÚBLICO
//
// ⚠️ Por que non píxeles: o escenario mide distinto en cada pantalla e
// en cada orientación. Un plano feito nun iPad horizontal abriríase
// descolocado no móbil. Os metros son só para pintar as cotas.
//
// ⚠️ `y` medra cara ao público, que coincide co eixo `y` do SVG cando o
// público está abaixo. Non é casualidade: aforra unha inversión de
// signo en cada conversión, e as inversións de signo esquecidas son o
// bug clásico deste tipo de código.
// ═══════════════════════════════════════════════════════════════════

// ⚠️ `Number(null)` e `Number('')` son 0, e AQUÍ O 0 É VÁLIDO: é o
// bordo esquerdo do escenario. Validar por veracidade (`v || d`)
// convertería o bordo esquerdo no valor por defecto. Hai que mirar o
// TIPO. Mesmo criterio que en `escaleta.js` e `mesa.js`.
export function num(v, d = 0) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : d;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  return d;
}

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
export const clamp01 = (v) => clamp(num(v, 0), 0, 1);

// Un punto normalizado saneado. Devolve SEMPRE un obxecto novo.
export const punto = (x, y) => ({ x: clamp01(x), y: clamp01(y) });

export const distancia = (a, b) => Math.hypot(num(b.x) - num(a.x), num(b.y) - num(a.y));

// ═══════════════════════════════════════════════════════════════════
// A CAIXA DO ESCENARIO
// ═══════════════════════════════════════════════════════════════════
// Dado o oco dispoñible en píxeles e as medidas reais en metros,
// devolve o rectángulo onde se debuxa o escenario, centrado e
// respectando a proporción real.
//
// ⚠️ Respectar a proporción non é un capricho estético: un escenario de
// 6×4,5 m debuxado como cadrado fai que unha diagonal pareza un ángulo
// de 45° cando na sala son 37°. O plano deixa de servir para ensaiar.

export function caixaEscenario(dispo, escenario, opcions = {}) {
  const margeM = num(opcions.marxe, 0);           // marxe en píxeles
  const dw = Math.max(1, num(dispo && dispo.ancho, 1) - margeM * 2);
  const dh = Math.max(1, num(dispo && dispo.alto, 1) - margeM * 2);

  const anchoM = Math.max(0.1, num(escenario && escenario.anchoM, 6));
  const fondoM = Math.max(0.1, num(escenario && escenario.fondoM, 4.5));
  const prop = anchoM / fondoM;

  // Encaixa dentro do oco: o lado que sobre é o que deixa marxe.
  let ancho = dw;
  let alto = dw / prop;
  if (alto > dh) { alto = dh; ancho = dh * prop; }

  return {
    x: num(dispo && dispo.x, 0) + (num(dispo && dispo.ancho, 0) - ancho) / 2,
    y: num(dispo && dispo.y, 0) + (num(dispo && dispo.alto, 0) - alto) / 2,
    ancho, alto,
  };
}

// Normalizado → píxeles dentro da caixa.
export const aPixeles = (p, caixa) => ({
  x: num(caixa.x) + clamp01(p && p.x) * num(caixa.ancho),
  y: num(caixa.y) + clamp01(p && p.y) * num(caixa.alto),
});

// Píxeles → normalizado. Recorta aos bordos: un dedo que sae do
// escenario deixa o elemento pegado ao bordo, non fóra do plano.
export const aNormalizado = (px, caixa) => punto(
  num(caixa.ancho) > 0 ? (num(px && px.x) - num(caixa.x)) / num(caixa.ancho) : 0,
  num(caixa.alto) > 0 ? (num(px && px.y) - num(caixa.y)) / num(caixa.alto) : 0,
);

// Normalizado → metros reais, para as cotas e para medir distancias.
export const aMetros = (p, escenario) => ({
  x: clamp01(p && p.x) * Math.max(0.1, num(escenario && escenario.anchoM, 6)),
  y: clamp01(p && p.y) * Math.max(0.1, num(escenario && escenario.fondoM, 4.5)),
});

// Distancia real en metros entre dous puntos normalizados.
// ⚠️ NON é `distancia() * anchoM`: se o escenario non é cadrado, os
// eixos escalan distinto e habería que pasar os dous por separado.
export function metrosEntre(a, b, escenario) {
  const ma = aMetros(a, escenario);
  const mb = aMetros(b, escenario);
  return Math.hypot(mb.x - ma.x, mb.y - ma.y);
}

// ═══════════════════════════════════════════════════════════════════
// REIXA
// ═══════════════════════════════════════════════════════════════════
// 3×3 por defecto. Pode ocultarse (`visible:false`) ou cambiarse de
// tamaño. `cols` e `filas` son o número de CELAS, non de liñas.

export const REIXA_DEFECTO = { cols: 3, filas: 3, visible: true, numeracion: 'romana', iman: false };

export function normalizarReixa(r) {
  const cols = Math.round(clamp(num(r && r.cols, 3), 1, 12));
  const filas = Math.round(clamp(num(r && r.filas, 3), 1, 12));
  const numeracion = ['arabiga', 'romana', 'letras', 'nengunha'].includes(r && r.numeracion)
    ? r.numeracion : 'romana';
  return { cols, filas, visible: (r && r.visible) !== false, numeracion, iman: !!(r && r.iman) };
}

// ⚠️ A NUMERACIÓN EMPEZA ABAIXO Á ESQUERDA, xunto ao público.
// É a convención do bosquexo de referencia (fila de abaixo I·II·III,
// a de arriba VII·VIII·IX) e coincide con como se fala nunha sala:
// «ponte no un» é adiante á esquerda, non ao fondo.
export function indiceCela(p, reixa) {
  const R = normalizarReixa(reixa);
  const c = clamp(Math.floor(clamp01(p && p.x) * R.cols), 0, R.cols - 1);
  // y=1 é o público → fila 0. Por iso se inverte aquí e SÓ aquí.
  const fDesdeFondo = clamp(Math.floor(clamp01(p && p.y) * R.filas), 0, R.filas - 1);
  const f = R.filas - 1 - fDesdeFondo;
  return f * R.cols + c;              // 0-indexado
}

const ROMANOS = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];

export function aRomano(n) {
  let v = Math.round(num(n, 0));
  if (v <= 0) return '';
  let out = '';
  for (const [val, sim] of ROMANOS) { while (v >= val) { out += sim; v -= val; } }
  return out;
}

export function aLetra(n) {
  let v = Math.round(num(n, 0));
  if (v <= 0) return '';
  let out = '';
  while (v > 0) { const r = (v - 1) % 26; out = String.fromCharCode(65 + r) + out; v = Math.floor((v - 1) / 26); }
  return out;
}

// Etiqueta dunha cela a partir do seu índice 0-indexado.
export function etiquetaCela(indice, numeracion = 'romana') {
  const n = Math.round(num(indice, 0)) + 1;
  if (numeracion === 'nengunha') return '';
  if (numeracion === 'arabiga') return String(n);
  if (numeracion === 'letras') return aLetra(n);
  return aRomano(n);
}

// Centro dunha cela, en normalizadas. Serve para colocar a etiqueta e
// para o imán.
export function centroCela(indice, reixa) {
  const R = normalizarReixa(reixa);
  const i = clamp(Math.round(num(indice, 0)), 0, R.cols * R.filas - 1);
  const c = i % R.cols;
  const f = Math.floor(i / R.cols);
  const fDesdeFondo = R.filas - 1 - f;
  return punto((c + 0.5) / R.cols, (fDesdeFondo + 0.5) / R.filas);
}

// Imán ao centro da cela. Só se aplica se está activado; por defecto
// non, porque un plano de impro non é un plano de arquitectura e
// colocar á man é máis rápido.
export function iman(p, reixa) {
  const R = normalizarReixa(reixa);
  if (!R.iman) return punto(p && p.x, p && p.y);
  return centroCela(indiceCela(p, R), R);
}

// Liñas da reixa, en normalizadas. Só as interiores: os bordos xa os
// pinta o propio escenario.
export function liñasReixa(reixa) {
  const R = normalizarReixa(reixa);
  const v = []; const h = [];
  for (let i = 1; i < R.cols; i++) v.push(i / R.cols);
  for (let i = 1; i < R.filas; i++) h.push(i / R.filas);
  return { verticais: v, horizontais: h };
}

// ═══════════════════════════════════════════════════════════════════
// PROXECCIÓN 2,5D · vista desde o público
// ═══════════════════════════════════════════════════════════════════
// ⚠️ NON é 3D. Non hai cámara, nin matrices, nin punto de fuga real.
// É unha falsa perspectiva: o chan é un trapecio e as figuras encollen
// canto máis ao fondo están.
//
// Unha soa fórmula, aquí. A vista de público NON ten estado propio: le
// o mesmo momento que a planta e pásao por esta función. É a única
// forma de garantir que as dúas vistas amosan o mesmo.
//
//   profundidade = 1 - y     (y=1 é o público → profundidade 0)
//
// `fuga` é canto se estreita o fondo: 0 = sen perspectiva (rectángulo),
// 1 = o fondo é un punto. 0,38 é o do bosquexo.

export const PERSPECTIVA = { fuga: 0.38, escalaFondo: 0.58, alzado: 0.62 };

export function proxectar25D(p, opcions = {}) {
  const o = { ...PERSPECTIVA, ...opcions };
  const x = clamp01(p && p.x);
  const y = clamp01(p && p.y);
  const prof = 1 - y;                       // 0 = diante, 1 = ao fondo

  // Estreitamento horizontal: canto máis ao fondo, máis se pecha cara
  // ao eixo central.
  const factor = 1 - clamp01(o.fuga) * prof;
  const px = 0.5 + (x - 0.5) * factor;

  // O chan ocupa a parte de abaixo do lenzo. `alzado` é canto sobe o
  // horizonte: 0,62 deixa o 38 % de arriba para o fondo escénico.
  const py = clamp01(o.alzado) + (1 - clamp01(o.alzado)) * (1 - prof);

  // Escala das figuras. Interpolación lineal, non 1/z: 1/z fai que as
  // figuras do fondo desaparezan e nun escenario de 4,5 m de fondo iso
  // é falso.
  const escala = 1 - (1 - clamp01(o.escalaFondo)) * prof;

  return { x: px, y: py, escala, profundidade: prof };
}

// Os catro vértices do trapecio do chan, en normalizadas do lenzo.
export function trapecioChan(opcions = {}) {
  const e1 = proxectar25D({ x: 0, y: 0 }, opcions);   // fondo esquerda
  const e2 = proxectar25D({ x: 1, y: 0 }, opcions);   // fondo dereita
  const e3 = proxectar25D({ x: 1, y: 1 }, opcions);   // diante dereita
  const e4 = proxectar25D({ x: 0, y: 1 }, opcions);   // diante esquerda
  return [e1, e2, e3, e4].map((p) => ({ x: p.x, y: p.y }));
}

// ⚠️ Orde de pintado na vista de público: primeiro o que está ao fondo.
// Sen isto, un actor do foro píntase por riba dun da boca de escena.
export const ordeProfundidade = (a, b) => num(a && a.y, 0) - num(b && b.y, 0);

// ═══════════════════════════════════════════════════════════════════
// TRAZOS E RECORRIDOS
// ═══════════════════════════════════════════════════════════════════

// Lonxitude acumulada. ⚠️ Calcúlase UNHA vez ao empezar a animación,
// non en cada fotograma: percorrer 400 puntos 60 veces por segundo é
// exactamente o tipo de conta que quenta unha tableta sen que se vexa
// por que.
export function acumuladas(puntos) {
  const ps = Array.isArray(puntos) ? puntos : [];
  const acc = [0];
  let total = 0;
  for (let i = 1; i < ps.length; i++) {
    total += distancia(ps[i - 1], ps[i]);
    acc.push(total);
  }
  return { acc, total };
}

// Punto ao t% (0..1) do recorrido, medido por lonxitude e non por
// número de puntos: se non, un actor aceleraría onde o dedo foi máis
// lento, que é o contrario do que se quere.
export function puntoEn(puntos, t, cache = null) {
  const ps = Array.isArray(puntos) ? puntos : [];
  if (ps.length === 0) return punto(0, 0);
  if (ps.length === 1) return punto(ps[0].x, ps[0].y);
  const { acc, total } = cache || acumuladas(ps);
  if (total <= 0) return punto(ps[0].x, ps[0].y);
  const obxectivo = clamp01(t) * total;
  let i = 1;
  while (i < acc.length - 1 && acc[i] < obxectivo) i++;
  const tramo = acc[i] - acc[i - 1];
  const f = tramo > 0 ? (obxectivo - acc[i - 1]) / tramo : 0;
  return punto(
    ps[i - 1].x + (ps[i].x - ps[i - 1].x) * f,
    ps[i - 1].y + (ps[i].y - ps[i - 1].y) * f,
  );
}

// Ramer–Douglas–Peucker. Un trazo a dedo nun iPad deixa entre 300 e
// 900 puntos; despois disto quedan entre 15 e 40 sen que se note a
// diferenza. Importa para o tamaño do documento e para a exportación.
export function simplificar(puntos, tolerancia = 0.004) {
  const ps = (Array.isArray(puntos) ? puntos : []).map((p) => punto(p.x, p.y));
  if (ps.length <= 2) return ps;
  const tol = Math.max(0, num(tolerancia, 0.004));

  const distARecta = (p, a, b) => {
    const dx = b.x - a.x; const dy = b.y - a.y;
    const den = dx * dx + dy * dy;
    if (den === 0) return distancia(p, a);
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / den;
    t = clamp(t, 0, 1);
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  };

  // Iterativo, non recursivo: un trazo longo desbordaba a pila.
  const gardar = new Array(ps.length).fill(false);
  gardar[0] = true; gardar[ps.length - 1] = true;
  const pilas = [[0, ps.length - 1]];
  while (pilas.length) {
    const [ini, fin] = pilas.pop();
    let maxD = -1; let idx = -1;
    for (let i = ini + 1; i < fin; i++) {
      const d = distARecta(ps[i], ps[ini], ps[fin]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol && idx > 0) {
      gardar[idx] = true;
      pilas.push([ini, idx], [idx, fin]);
    }
  }
  return ps.filter((_, i) => gardar[i]);
}

// Catmull-Rom a Bézier cúbica. Devolve o atributo `d` dun <path>.
// `tension` 0 = anguloso, 1 = moi redondo.
export function camiño(puntos, tension = 0.5) {
  const ps = Array.isArray(puntos) ? puntos : [];
  if (ps.length === 0) return '';
  const f = (n) => (Math.round(num(n, 0) * 100000) / 100000);
  if (ps.length === 1) return `M ${f(ps[0].x)} ${f(ps[0].y)}`;
  if (ps.length === 2) return `M ${f(ps[0].x)} ${f(ps[0].y)} L ${f(ps[1].x)} ${f(ps[1].y)}`;

  const k = clamp(num(tension, 0.5), 0, 1) / 6;
  let d = `M ${f(ps[0].x)} ${f(ps[0].y)}`;
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[i - 1] || ps[i];
    const p1 = ps[i];
    const p2 = ps[i + 1];
    const p3 = ps[i + 2] || p2;
    d += ` C ${f(p1.x + (p2.x - p0.x) * k)} ${f(p1.y + (p2.y - p0.y) * k)}`
       + ` ${f(p2.x - (p3.x - p1.x) * k)} ${f(p2.y - (p3.y - p1.y) * k)}`
       + ` ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

// Ángulo en graos do final do recorrido, para orientar a frecha.
// 0° = cara á dereita, medindo no sentido do reloxo (o do SVG).
export function anguloFinal(puntos) {
  const ps = Array.isArray(puntos) ? puntos : [];
  if (ps.length < 2) return 0;
  const b = ps[ps.length - 1];
  // ⚠️ Non vale coller ps[length-2] sen máis: despois de simplificar,
  // os dous últimos puntos poden coincidir e daría atan2(0,0)=0, coa
  // frecha apuntando sempre á dereita.
  let a = ps[ps.length - 2];
  for (let i = ps.length - 2; i >= 0; i--) {
    if (distancia(ps[i], b) > 1e-6) { a = ps[i]; break; }
  }
  return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
}

// ═══════════════════════════════════════════════════════════════════
// ÁNGULOS · a mirada
// ═══════════════════════════════════════════════════════════════════
// ⚠️ MIRADA E MOVEMENTO SON COUSAS DISTINTAS. A mirada é un ángulo que
// vive na colocación do elemento; o movemento é un cambio de x,y entre
// dous momentos. Un actor pode xirar sen moverse e moverse sen xirar.
// Por iso se interpolan por separado.
//
// Mesmo criterio que o resto do módulo: 0° cara á dereita, sentido do
// reloxo. Mirar ao público é 90°.

export const MIRADA_PUBLICO = 90;

export const normalizarAngulo = (g) => { const v = num(g, 0) % 360; return v < 0 ? v + 360 : v; };

// ⚠️ Interpolar ángulos linealmente é o bug clásico: de 350° a 10° son
// 20° pola dereita, pero unha interpolación crúa dá unha volta enteira
// ao revés. Sempre polo camiño curto.
export function interpolarAngulo(a, b, t) {
  const A = normalizarAngulo(a);
  const B = normalizarAngulo(b);
  let d = B - A;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return normalizarAngulo(A + d * clamp01(t));
}

export const interpolarPunto = (a, b, t) => {
  const f = clamp01(t);
  return punto(num(a && a.x) + (num(b && b.x) - num(a && a.x)) * f,
    num(a && a.y) + (num(b && b.y) - num(a && a.y)) * f);
};

// Suavizado da animación. Sen isto os actores arrancan e paran de
// golpe, que nun plano de movemento escénico parece un erro.
export const suave = (t) => { const v = clamp01(t); return v < 0.5 ? 2 * v * v : 1 - ((-2 * v + 2) ** 2) / 2; };
