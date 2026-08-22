// Probas de plano/xeometria.js — módulo puro, sen render.
// O que se comproba non é que as funcións devolvan algo: é que as
// trampas coñecidas non pasen. Cada bloque di cal.

import {
  num, clamp01, punto, distancia, caixaEscenario, aPixeles, aNormalizado,
  aMetros, metrosEntre, normalizarReixa, indiceCela, centroCela, etiquetaCela,
  aRomano, aLetra, iman, liñasReixa, proxectar25D, trapecioChan, ordeProfundidade,
  acumuladas, puntoEn, simplificar, camiño, anguloFinal,
  normalizarAngulo, interpolarAngulo, interpolarPunto, suave, MIRADA_PUBLICO,
} from '/home/claude/impro/impro/src/plano/xeometria.js';

let f = 0;
const ok = (t, c, e = '') => { console.log((c ? '✓ ' : '✗ ') + t + (c ? '' : ' — ' + e)); if (!c) f++; };
const cerca = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

// ── num() · a trampa de Number(null) ──────────────────────────────
// ⚠️ 0 é unha coordenada VÁLIDA: o bordo esquerdo do escenario.
ok('num(null) devolve o defecto, non 0', num(null, 0.5) === 0.5, num(null, 0.5));
ok("num('') devolve o defecto", num('', 0.5) === 0.5, num('', 0.5));
ok('num(undefined) devolve o defecto', num(undefined, 0.5) === 0.5);
ok('⚠️ num(0) devolve 0, non o defecto', num(0, 0.5) === 0, num(0, 0.5));
ok('num(NaN) devolve o defecto', num(NaN, 0.5) === 0.5);
ok('num(Infinity) devolve o defecto', num(Infinity, 0.5) === 0.5);
ok("num('0.25') convértese", num('0.25', 0) === 0.25);
ok("num('abc') devolve o defecto", num('abc', 0.5) === 0.5);

// ── clamp e punto ─────────────────────────────────────────────────
ok('clamp01 recorta por arriba', clamp01(1.4) === 1);
ok('clamp01 recorta por abaixo', clamp01(-3) === 0);
ok('punto sanea os dous eixos', punto(-1, 9).x === 0 && punto(-1, 9).y === 1);
ok('punto(0,0) é válido e non se substitúe', punto(0, 0).x === 0 && punto(0, 0).y === 0);
ok('distancia coñecida', cerca(distancia({ x: 0, y: 0 }, { x: 0.3, y: 0.4 }), 0.5));

// ── caixa do escenario · a proporción ─────────────────────────────
// ⚠️ Un escenario de 6×4,5 debuxado como cadrado falsea os ángulos.
const esc = { anchoM: 6, fondoM: 4.5 };
const c1 = caixaEscenario({ x: 0, y: 0, ancho: 800, alto: 800 }, esc);
ok('a caixa mantén a proporción 4:3', cerca(c1.ancho / c1.alto, 6 / 4.5, 1e-9), c1.ancho / c1.alto);
ok('nun oco cadrado limita o ALTO', cerca(c1.ancho, 800) && cerca(c1.alto, 600), `${c1.ancho}×${c1.alto}`);
ok('e queda centrada verticalmente', cerca(c1.y, 100), c1.y);
const c2 = caixaEscenario({ x: 0, y: 0, ancho: 400, alto: 900 }, esc);
ok('nun oco alto limita o ANCHO', cerca(c2.ancho, 400) && cerca(c2.alto, 300), `${c2.ancho}×${c2.alto}`);
ok('e queda centrada horizontalmente', cerca(c2.x, 0) && cerca(c2.y, 300));
const c3 = caixaEscenario({ ancho: 0, alto: 0 }, esc);
ok('⚠️ un oco de cero non peta nin dá NaN', Number.isFinite(c3.ancho) && Number.isFinite(c3.alto));
const c4 = caixaEscenario({ ancho: 500, alto: 500 }, { anchoM: 0, fondoM: 0 });
ok('⚠️ un escenario de 0 m non divide por cero', Number.isFinite(c4.ancho) && c4.ancho > 0, c4.ancho);

// ── ida e volta de coordenadas ────────────────────────────────────
const caixa = { x: 40, y: 20, ancho: 600, alto: 450 };
const ida = aPixeles({ x: 0.25, y: 0.75 }, caixa);
ok('normalizado → píxeles', cerca(ida.x, 190) && cerca(ida.y, 357.5), `${ida.x},${ida.y}`);
const volta = aNormalizado(ida, caixa);
ok('⚠️ ida e volta non perde nada', cerca(volta.x, 0.25) && cerca(volta.y, 0.75), `${volta.x},${volta.y}`);
const fora = aNormalizado({ x: -500, y: 5000 }, caixa);
ok('un dedo fóra do escenario pégase ao bordo', fora.x === 0 && fora.y === 1);
ok('y=0 é o FONDO, arriba do lenzo', cerca(aPixeles({ x: 0.5, y: 0 }, caixa).y, 20));
ok('y=1 é o PÚBLICO, abaixo', cerca(aPixeles({ x: 0.5, y: 1 }, caixa).y, 470));

// ── metros ────────────────────────────────────────────────────────
const m = aMetros({ x: 0.5, y: 1 }, esc);
ok('o centro en metros', cerca(m.x, 3) && cerca(m.y, 4.5), `${m.x},${m.y}`);
// ⚠️ Non vale multiplicar a distancia normalizada por anchoM: os eixos
// escalan distinto cando o escenario non é cadrado.
const dm = metrosEntre({ x: 0, y: 0 }, { x: 1, y: 1 }, esc);
ok('⚠️ a diagonal real usa os DOUS eixos', cerca(dm, Math.hypot(6, 4.5)), dm);
ok('e non coincide coa conta ingenua', !cerca(dm, distancia({ x: 0, y: 0 }, { x: 1, y: 1 }) * 6));

// ── reixa ─────────────────────────────────────────────────────────
const R = normalizarReixa();
ok('a reixa por defecto é 3×3 visible', R.cols === 3 && R.filas === 3 && R.visible === true);
ok('a numeración por defecto é romana', R.numeracion === 'romana');
ok('o imán está apagado por defecto', R.iman === false);
ok('unha reixa de 0 columnas sóbese a 1', normalizarReixa({ cols: 0, filas: 0 }).cols === 1);
ok('unha reixa de 99 columnas tópase', normalizarReixa({ cols: 99 }).cols === 12);
ok('unha numeración inventada cae a romana', normalizarReixa({ numeracion: 'xyz' }).numeracion === 'romana');
ok('visible:false respéctase', normalizarReixa({ visible: false }).visible === false);

// ⚠️ A NUMERACIÓN EMPEZA ABAIXO Á ESQUERDA, xunto ao público.
ok('⚠️ a cela I está diante á esquerda', indiceCela({ x: 0.1, y: 0.95 }, R) === 0, indiceCela({ x: 0.1, y: 0.95 }, R));
ok('a III está diante á dereita', indiceCela({ x: 0.9, y: 0.95 }, R) === 2);
ok('a V é o centro', indiceCela({ x: 0.5, y: 0.5 }, R) === 4);
ok('a VII está ao fondo á esquerda', indiceCela({ x: 0.1, y: 0.05 }, R) === 6);
ok('a IX está ao fondo á dereita', indiceCela({ x: 0.9, y: 0.05 }, R) === 8);
ok('o bordo dereito exacto non se sae da reixa', indiceCela({ x: 1, y: 1 }, R) === 2, indiceCela({ x: 1, y: 1 }, R));
ok('o centro dunha cela cae na propia cela',
  [0, 1, 2, 3, 4, 5, 6, 7, 8].every((i) => indiceCela(centroCela(i, R), R) === i));

ok('romano de 4', aRomano(4) === 'IV');
ok('romano de 9', aRomano(9) === 'IX');
ok('romano de 1994', aRomano(1994) === 'MCMXCIV');
ok('romano de 0 é baleiro', aRomano(0) === '');
ok('letra 1 é A', aLetra(1) === 'A');
ok('letra 26 é Z', aLetra(26) === 'Z');
ok('letra 27 é AA', aLetra(27) === 'AA');
ok('etiqueta romana da primeira cela', etiquetaCela(0, 'romana') === 'I');
ok('etiqueta arábiga', etiquetaCela(8, 'arabiga') === '9');
ok('etiqueta por letras', etiquetaCela(2, 'letras') === 'C');
ok('sen numeración non hai etiqueta', etiquetaCela(4, 'nengunha') === '');

ok('sen imán o punto non se toca', iman({ x: 0.13, y: 0.77 }, R).x === 0.13);
const conIman = iman({ x: 0.13, y: 0.77 }, { ...R, iman: true });
ok('co imán vai ao centro da cela', cerca(conIman.x, 1 / 6) && cerca(conIman.y, 5 / 6), `${conIman.x},${conIman.y}`);
const L = liñasReixa(R);
ok('unha reixa 3×3 ten 2 liñas interiores por eixo', L.verticais.length === 2 && L.horizontais.length === 2);
ok('e non inclúe os bordos', !L.verticais.includes(0) && !L.verticais.includes(1));

// ── 2,5D ──────────────────────────────────────────────────────────
// ⚠️ Unha soa fórmula: a vista de público NON ten estado propio.
const diante = proxectar25D({ x: 0.5, y: 1 });
const fondo = proxectar25D({ x: 0.5, y: 0 });
ok('o que está diante debúxase máis abaixo', diante.y > fondo.y, `${diante.y} vs ${fondo.y}`);
ok('o que está diante é máis grande', diante.escala > fondo.escala);
ok('diante non se encolle', cerca(diante.escala, 1));
ok('o centro non se despraza en x', cerca(diante.x, 0.5) && cerca(fondo.x, 0.5));
const esqDiante = proxectar25D({ x: 0, y: 1 });
const esqFondo = proxectar25D({ x: 0, y: 0 });
ok('⚠️ o fondo estréitase cara ao centro', esqFondo.x > esqDiante.x, `${esqFondo.x} vs ${esqDiante.x}`);
ok('a profundidade é 1-y', cerca(fondo.profundidade, 1) && cerca(diante.profundidade, 0));
const trap = trapecioChan();
ok('o trapecio ten catro vértices', trap.length === 4);
ok('e o lado do fondo é máis curto có de diante',
  (trap[1].x - trap[0].x) < (trap[2].x - trap[3].x));
// ⚠️ Sen isto un actor do foro píntase por riba dun da boca de escena.
const ord = [{ y: 1 }, { y: 0 }, { y: 0.5 }].sort(ordeProfundidade);
ok('⚠️ píntase primeiro o do fondo', ord[0].y === 0 && ord[2].y === 1);

// ── trazos ────────────────────────────────────────────────────────
const recta = [{ x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 1, y: 0 }];
const { total } = acumuladas(recta);
ok('lonxitude acumulada', cerca(total, 1), total);
// ⚠️ Medido por lonxitude, non por número de puntos: se non, o actor
// aceleraría onde o dedo foi máis lento.
const irregular = [{ x: 0, y: 0 }, { x: 0.9, y: 0 }, { x: 1, y: 0 }];
ok('⚠️ o punto medio vai por lonxitude, non por índice',
  cerca(puntoEn(irregular, 0.5).x, 0.5), puntoEn(irregular, 0.5).x);
ok('t=0 é o principio', cerca(puntoEn(recta, 0).x, 0));
ok('t=1 é o final', cerca(puntoEn(recta, 1).x, 1));
ok('t fóra de rango recórtase', cerca(puntoEn(recta, 5).x, 1) && cerca(puntoEn(recta, -5).x, 0));
ok('un recorrido dun só punto non peta', puntoEn([{ x: 0.3, y: 0.3 }], 0.5).x === 0.3);
ok('un recorrido baleiro non peta', puntoEn([], 0.5).x === 0);
ok('⚠️ un recorrido de lonxitude cero non divide por cero',
  Number.isFinite(puntoEn([{ x: 0.4, y: 0.4 }, { x: 0.4, y: 0.4 }], 0.7).x));

// Simplificación
const rectaRuidosa = Array.from({ length: 200 }, (_, i) => ({ x: i / 199, y: 0.5 }));
const simple = simplificar(rectaRuidosa);
ok('unha recta de 200 puntos queda en 2', simple.length === 2, simple.length);
ok('e conserva os extremos', simple[0].x === 0 && cerca(simple[1].x, 1));
const curva = Array.from({ length: 300 }, (_, i) => ({ x: i / 299, y: 0.5 + Math.sin(i / 12) * 0.2 }));
const curvaSimple = simplificar(curva);
ok('unha curva conserva a forma con moitos menos puntos',
  curvaSimple.length > 5 && curvaSimple.length < 90, curvaSimple.length);
ok('dous puntos non se tocan', simplificar([{ x: 0, y: 0 }, { x: 1, y: 1 }]).length === 2);
ok('un punto non peta', simplificar([{ x: 0, y: 0 }]).length === 1);
// ⚠️ Recursivo desbordaba a pila cun trazo longo.
const longo = Array.from({ length: 20000 }, (_, i) => ({ x: (i % 1000) / 1000, y: (i % 7) / 7 }));
let desbordou = false;
try { simplificar(longo); } catch (e) { desbordou = true; }
ok('⚠️ 20.000 puntos non desbordan a pila', !desbordou);

// Camiño
ok('un camiño baleiro é cadea baleira', camiño([]) === '');
ok('un punto dá só M', camiño([{ x: 0.5, y: 0.5 }]).startsWith('M'));
ok('dous puntos dan unha recta, non unha curva', camiño([{ x: 0, y: 0 }, { x: 1, y: 1 }]).includes(' L '));
ok('tres puntos dan curvas', camiño(recta).includes(' C '));
ok('o camiño non ten NaN', !camiño(curva.slice(0, 20)).includes('NaN'));

// ⚠️ Despois de simplificar, os dous últimos puntos poden coincidir.
ok('⚠️ a frecha non apunta á dereita cando os últimos puntos coinciden',
  cerca(anguloFinal([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 1 }]), 90),
  anguloFinal([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 1 }]));
ok('frecha cara á dereita', cerca(anguloFinal([{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }]), 0));
ok('un só punto non peta', anguloFinal([{ x: 0, y: 0 }]) === 0);

// ── ángulos ───────────────────────────────────────────────────────
ok('mirar ao público son 90°', MIRADA_PUBLICO === 90);
ok('-90 normalízase a 270', normalizarAngulo(-90) === 270);
ok('450 normalízase a 90', normalizarAngulo(450) === 90);
// ⚠️ O bug clásico: interpolar linealmente dá unha volta enteira.
const cruce = interpolarAngulo(350, 10, 0.5);
ok('⚠️ de 350° a 10° pasa polo 0, non pola volta longa',
  cerca(cruce, 0) || cerca(cruce, 360), cruce);
ok('e ao revés tamén', cerca(interpolarAngulo(10, 350, 0.5), 0) || cerca(interpolarAngulo(10, 350, 0.5), 360));
ok('interpolación normal', cerca(interpolarAngulo(0, 90, 0.5), 45));
ok('t=0 devolve o de partida', cerca(interpolarAngulo(30, 200, 0), 30));
ok('t=1 devolve o de chegada', cerca(interpolarAngulo(30, 200, 1), 200));
const ip = interpolarPunto({ x: 0, y: 0 }, { x: 1, y: 1 }, 0.25);
ok('interpolar punto', cerca(ip.x, 0.25) && cerca(ip.y, 0.25));
ok('suave(0)=0 e suave(1)=1', suave(0) === 0 && suave(1) === 1);
ok('suave(0.5)=0.5', cerca(suave(0.5), 0.5));
ok('suave arranca máis lento que lineal', suave(0.2) < 0.2);

console.log(f ? `\n${f} FALLOS` : '\n✓ Todos os casos de xeometría pasan');
process.exit(f ? 1 : 0);
