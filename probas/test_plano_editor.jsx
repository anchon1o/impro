// Render e comportamento de EditorPlano + VistaPlanta.
//
// ⚠️ O arnés non ten DOM real, así que non se mide layout: compróbase a
// ÁRBORE de React, que en SVG é perfectamente inspeccionable. Por iso
// o motor son módulos puros e o debuxo é un compoñente sen estado.

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemeCtx, AuthCtx, LangCtx, TEMAS, completarTema } from '/home/claude/impro/impro/src/core.jsx';
import { EditorPlano } from '/home/claude/impro/impro/src/plano/EditorPlano.jsx';
import { VistaPlanta } from '/home/claude/impro/impro/src/plano/VistaPlanta.jsx';
import { VistaPublico } from '/home/claude/impro/impro/src/plano/VistaPublico.jsx';
import { proxectar25D } from '/home/claude/impro/impro/src/plano/xeometria.js';
import { paletaDesdeTema, PALETAS } from '/home/claude/impro/impro/src/plano/paleta.js';
import {
  planoBaleiro, novoElemento, engadirElemento, establecerColocacion,
} from '/home/claude/impro/impro/src/plano/modelo.js';

let f = 0;
const ok = (t, c, e = '') => { console.log((c ? '✓ ' : '✗ ') + t + (c ? '' : ' — ' + e)); if (!c) f++; };
const cadro = () => act(async () => { await new Promise((r) => setTimeout(r, 20)); });

const T = completarTema(TEMAS[0].escuro, 'escuro');
const paleta = paletaDesdeTema(T);
const marco = (h) => (
  <ThemeCtx.Provider value={{ T, dark: true, toggle() {}, tema: TEMAS[0], setTema() {}, setDark() {} }}>
    <AuthCtx.Provider value={{ logueado: false, user: null, pedirLogin() {} }}>
      <LangCtx.Provider value={{ lang: 'gl', setLang() {} }}>{h}</LangCtx.Provider>
    </AuthCtx.Provider>
  </ThemeCtx.Provider>
);

const todos = (n, pred, out = []) => {
  if (!n || typeof n !== 'object') return out;
  if (Array.isArray(n)) { n.forEach((x) => todos(x, pred, out)); return out; }
  if (pred(n)) out.push(n);
  if (n.children) todos(n.children, pred, out);
  return out;
};
const texto = (n) => { const o = []; (function w(x) {
  if (x == null) return;
  if (typeof x === 'string' || typeof x === 'number') { o.push(String(x)); return; }
  if (Array.isArray(x)) return x.forEach(w);
  if (x.children) w(x.children);
}(n)); return o.join(' '); };
const porTitulo = (j, t) => todos(j, (n) => n.props && n.props.title === t)[0];
const svgDe = (j) => todos(j, (n) => n.type === 'svg')[0];

// O `div` do lenzo precisa medidas: sen DOM hai que inxectalas.
const CAIXA = { left: 0, top: 0, width: 600, height: 450 };
const nodeMock = () => ({ getBoundingClientRect: () => CAIXA, setPointerCapture() {} });

// ═══════════════════════════════════════════════════════════════════
// VistaPlanta · renderizador puro
// ═══════════════════════════════════════════════════════════════════
let P = planoBaleiro('Proba');
const ana = novoElemento('actor', { nome: 'Ana', numero: 1, cor: 'ok' });
P = engadirElemento(P, ana, P.momentos[0].id);
P = establecerColocacion(P, P.momentos[0].id, ana.id, { x: 0.25, y: 0.7 });

let rv = null;
await act(async () => { rv = TestRenderer.create(<VistaPlanta plano={P} momentoId={P.momentos[0].id} paleta={paleta} />); });
let jv = rv.toJSON();
const svg = svgDe(jv);
ok('a vista de planta devolve un SVG', !!svg);
// ⚠️ As unidades teñen que ser CADRADAS ou os actores saen ovalados.
ok('⚠️ a viewBox garda a proporción 4:3 do escenario 6×4,5',
  svg.props.viewBox === '-75 -75 1150 900', svg.props.viewBox);
// ⚠️ Sen isto Safari fai scroll da páxina ao arrastrar un actor.
ok('⚠️ o SVG bloquea o xesto do navegador (touchAction none)',
  svg.props.style.touchAction === 'none');
ok('o actor debúxase co seu número', texto(jv).includes('1'));
ok('e co seu nome', texto(jv).includes('Ana'));
ok('a reixa numérase en romanos', texto(jv).includes('IX'));
ok('e as cotas van en metros con coma', texto(jv).includes('6,00 m') && texto(jv).includes('4,50 m'));

// ⚠️ Un elemento fóra de escena non se debuxa, pero SEGUE no documento.
const fora = establecerColocacion(P, P.momentos[0].id, ana.id, { visible: false });
let rf = null;
await act(async () => { rf = TestRenderer.create(<VistaPlanta plano={fora} momentoId={fora.momentos[0].id} paleta={paleta} />); });
ok('⚠️ visible:false non se debuxa', !texto(rf.toJSON()).includes('Ana'));
ok('pero o elemento segue no documento', fora.elementos.length === 1);
await act(async () => { rf.unmount(); });

// ⚠️ A paleta transparente NON debe pintar rectángulo de fondo: un
// rectángulo invisible seguiría collendo os clics no SVG exportado.
let rt = null;
await act(async () => { rt = TestRenderer.create(<VistaPlanta plano={P} momentoId={P.momentos[0].id} paleta={PALETAS.transparente} />); });
const rects = todos(rt.toJSON(), (n) => n.type === 'rect' && n.props.fill && n.props.fill !== 'none');
ok('⚠️ coa paleta transparente non hai rectángulo de fondo',
  !rects.some((x) => x.props.fill === PALETAS.transparente.fondo));
await act(async () => { rt.unmount(); });

// ⚠️ Exportar en claro SEN cambiar o tema da app: é todo o motivo de
// que a paleta sexa un parámetro.
let rc = null;
await act(async () => { rc = TestRenderer.create(<VistaPlanta plano={P} momentoId={P.momentos[0].id} paleta={PALETAS.claro} />); });
ok('⚠️ a mesma vista en paleta clara sen tocar o tema',
  todos(rc.toJSON(), (n) => n.props && n.props.fill === '#ffffff').length > 0);
await act(async () => { rc.unmount(); rv.unmount(); });

// ═══════════════════════════════════════════════════════════════════
// VistaPublico · 2,5D
// ═══════════════════════════════════════════════════════════════════
// ⚠️ Non ten xeometría propia: todo pasa por `proxectar25D()`, probado
// desde a Fase 0. Se fixese as súas contas, un actor aparecería nun
// sitio na planta e noutro aquí, e só se vería na vista doble.

let Q = planoBaleiro('Fondo e diante');
const atras = novoElemento('actor', { nome: 'Atras', numero: 1, cor: 'ok' });
const diante = novoElemento('actor', { nome: 'Diante', numero: 2, cor: 'warn' });
Q = engadirElemento(Q, atras, Q.momentos[0].id);
Q = engadirElemento(Q, diante, Q.momentos[0].id);
Q = establecerColocacion(Q, Q.momentos[0].id, atras.id, { x: 0.5, y: 0.05 });
Q = establecerColocacion(Q, Q.momentos[0].id, diante.id, { x: 0.5, y: 0.95 });

let rp = null;
await act(async () => { rp = TestRenderer.create(<VistaPublico plano={Q} momentoId={Q.momentos[0].id} paleta={paleta} />); });
let jp = rp.toJSON();
ok('a vista de público devolve un SVG', !!svgDe(jp));
ok('cun encadre propio, non o do escenario', svgDe(jp).props.viewBox === '0 0 1000 700', svgDe(jp).props.viewBox);
ok('debúxanse os dous actores', texto(jp).includes('1') && texto(jp).includes('2'));

// ⚠️ ORDE DE PROFUNDIDADE: sen isto o do foro píntase por riba do da
// boca de escena e a escena lese ao revés.
const escalas = todos(jp, (n) => n.type === 'g' && n.props.transform
    && /^translate\([^)]*\) scale\([0-9.]+\)$/.test(n.props.transform))
  .map((n) => Number(/scale\(([0-9.]+)\)$/.exec(n.props.transform)[1]));
ok('⚠️ o do fondo debúxase máis pequeno', escalas.length >= 2 && escalas[0] < escalas[1],
  JSON.stringify(escalas.slice(0, 2)));
const idx1 = JSON.stringify(jp).indexOf('Atras');
const idx2 = JSON.stringify(jp).indexOf('Diante');
ok('⚠️ e ANTES na árbore: píntase primeiro o do fondo', idx1 < idx2 && idx1 > -1);

// A vista de público NON edita.
ok('⚠️ ningún elemento da vista de público colle toques',
  todos(jp, (n) => n.props && n.props.onPointerDown).length === 0);

// Coherencia coa planta: o mesmo momento, a mesma proxección.
const pr = proxectar25D({ x: 0.5, y: 0.05 });
ok('a proxección usada é a de xeometria.js', pr.escala < 1 && pr.profundidade > 0.9);
await act(async () => { rp.unmount(); });

// ═══════════════════════════════════════════════════════════════════
// EditorPlano
// ═══════════════════════════════════════════════════════════════════
window.innerWidth = 1024; window.innerHeight = 768;   // iPad horizontal
let gardado = null;
let r = null;
await act(async () => {
  r = TestRenderer.create(
    marco(<EditorPlano planoInicial={planoBaleiro('Ensaio')} capa="escenico" onGardar={async (p) => { gardado = p; }} onSaír={() => {}} />),
    { createNodeMock: nodeMock },
  );
});
await cadro();
let j = r.toJSON();
ok('o editor renderiza', !!svgDe(j));
ok('e amosa o nome do plano', texto(j).includes('Ensaio'));
ok('sen nada seleccionado, dío', texto(j).includes('Toca algo do escenario'));

// Engadir persoa
await act(async () => { porTitulo(r.toJSON(), 'Engadir persoa').props.onClick(); });
await cadro();
j = r.toJSON();
ok('engadir persoa píntaa', texto(j).includes('Mirada'));
ok('e queda seleccionada (sae o inspector)', texto(j).includes('Postura'));

// ⚠️ MIRADA E MOVEMENTO SON COUSAS DISTINTAS: xirar non move.
const gpos = () => {
  const g = todos(r.toJSON(), (n) => n.type === 'g' && n.props.transform && /^translate/.test(n.props.transform))[0];
  return g && g.props.transform;
};
const antes = gpos();
await act(async () => { porTitulo(r.toJSON(), '180°').props.onClick(); });
await cadro();
ok('⚠️ cambiar a mirada NON move o actor', gpos() === antes, `${antes} → ${gpos()}`);
ok('e o xiro aplicouse', todos(r.toJSON(), (n) => n.props && n.props.transform === 'rotate(180)').length > 0);

// Desfacer / refacer
await act(async () => { porTitulo(r.toJSON(), 'Desfacer').props.onClick(); });
await cadro();
ok('desfacer devolve a mirada anterior',
  todos(r.toJSON(), (n) => n.props && n.props.transform === 'rotate(180)').length === 0);
await act(async () => { porTitulo(r.toJSON(), 'Refacer').props.onClick(); });
await cadro();
ok('e refacer devólvea', todos(r.toJSON(), (n) => n.props && n.props.transform === 'rotate(180)').length > 0);

// ⚠️ Un arrastre son 200 eventos e ten que ser UN paso de desfacer.
const grupo = () => todos(r.toJSON(), (n) => n.type === 'g' && n.props.onPointerDown)[0];
const lenzo = () => todos(r.toJSON(), (n) => n.props && n.props.onPointerMove)[0];
await act(async () => {
  grupo().props.onPointerDown({ clientX: 300, clientY: 280, pointerId: 1, currentTarget: { setPointerCapture() {} }, preventDefault() {} });
});
for (let i = 0; i < 40; i++) {
  // eslint-disable-next-line no-await-in-loop
  await act(async () => { lenzo().props.onPointerMove({ clientX: 300 + i * 4, clientY: 280 }); });
}
await act(async () => { lenzo().props.onPointerUp({}); });
await cadro();
const despois = gpos();
ok('arrastrar move o actor', despois !== antes, `${antes} → ${despois}`);
await act(async () => { porTitulo(r.toJSON(), 'Desfacer').props.onClick(); });
await cadro();
ok('⚠️ e UN só desfacer desfai o arrastre enteiro, non 40 veces', gpos() === antes, gpos());
await act(async () => { porTitulo(r.toJSON(), 'Refacer').props.onClick(); });
await cadro();

// Reixa e cotas
await act(async () => { porTitulo(r.toJSON(), 'Reixa').props.onClick(); });
await cadro();
ok('apagar a reixa quita a numeración', !texto(r.toJSON()).includes('IX'));
await act(async () => { porTitulo(r.toJSON(), 'Cotas').props.onClick(); });
await cadro();
ok('apagar as cotas quita os metros', !texto(r.toJSON()).includes('6,00 m'));
// ⚠️ Sen cotas a viewBox estréitase: se non, queda unha marxe baleira
// e o escenario vese máis pequeno do que podería.
ok('⚠️ e a viewBox aprovéitao', svgDe(r.toJSON()).props.viewBox !== '-75 -75 1150 900');

// Gardar
const bGardar = todos(r.toJSON(), (n) => n.type === 'button' && texto(n).includes('Gardar'))[0];
ok('mentres hai cambios, o botón di Gardar', !!bGardar);
await act(async () => { bGardar.props.onClick(); });
await cadro();
ok('gardar entrega o plano', !!gardado && gardado.elementos.length === 1);
ok('e o botón pasa a Gardado', texto(r.toJSON()).includes('Gardado'));

// Borrar
await act(async () => { todos(r.toJSON(), (n) => n.type === 'button' && texto(n).includes('🗑'))[0].props.onClick(); });
await cadro();
ok('borrar quita o elemento', texto(r.toJSON()).includes('Toca algo do escenario'));
await act(async () => { r.unmount(); });

// ── Selector de vistas ────────────────────────────────────────────
let rvv = null;
window.innerWidth = 1024; window.innerHeight = 768;
await act(async () => {
  rvv = TestRenderer.create(
    marco(<EditorPlano planoInicial={Q} capa="escenico" onGardar={async () => {}} onSaír={() => {}} />),
    { createNodeMock: nodeMock },
  );
});
await cadro();
ok('o editor abre en planta', svgDe(rvv.toJSON()).props.viewBox === '-75 -75 1150 900');
ok('e ofrece as tres vistas',
  !!porTitulo(rvv.toJSON(), '▤ Planta') && !!porTitulo(rvv.toJSON(), '👥 Público') && !!porTitulo(rvv.toJSON(), '◫ Doble'));

await act(async () => { porTitulo(rvv.toJSON(), '👥 Público').props.onClick(); });
await cadro();
ok('cambiar a público cambia o encadre', svgDe(rvv.toJSON()).props.viewBox === '0 0 1000 700');
// ⚠️ A vista de público é de LECTURA: non se arrastra en perspectiva.
ok('⚠️ e alí non se pode arrastrar nada',
  todos(rvv.toJSON(), (n) => n.type === 'g' && n.props.onPointerDown).length === 0);

await act(async () => { porTitulo(rvv.toJSON(), '◫ Doble').props.onClick(); });
await cadro();
const svgsD = todos(rvv.toJSON(), (n) => n.type === 'svg');
ok('a vista doble pinta as DÚAS', svgsD.length === 2, svgsD.length);
ok('e a planta segue sendo a editable',
  todos(rvv.toJSON(), (n) => n.type === 'g' && n.props.onPointerDown).length > 0);
// ⚠️ A vista é estado da interface, non do documento.
ok('⚠️ mudar de vista non ensucia o plano', !texto(rvv.toJSON()).includes('● Gardar'));
await act(async () => { rvv.unmount(); });

// ⚠️ En pantalla estreita a vista doble vai unha DEBAIXO da outra:
// partir 390 px en dous deixa dous selos ilexibles.
window.innerWidth = 390; window.innerHeight = 844;
let rm = null;
await act(async () => {
  rm = TestRenderer.create(
    marco(<EditorPlano planoInicial={Q} capa="escenico" onGardar={async () => {}} onSaír={() => {}} />),
    { createNodeMock: nodeMock },
  );
});
await cadro();
await act(async () => { porTitulo(rm.toJSON(), '◫ Doble').props.onClick(); });
await cadro();
const fila = todos(rm.toJSON(), (n) => n.props && n.props.style && n.props.style.flexDirection === 'column' && n.props.style.gap === 12)[0];
ok('⚠️ en móbil a vista doble apílase', !!fila);
await act(async () => { rm.unmount(); });
window.innerWidth = 1024; window.innerHeight = 768;

// ── Exportar ──────────────────────────────────────────────────────
// ⚠️ NON se serializa o SVG que se ve: ese leva a paleta do tema e a
// capa de selección, e a imaxe sairía con tiradores punteados arredor
// do actor escollido. Renderízase un SEGUNDO debuxo agochado.
let rx = null;
window.innerWidth = 1024; window.innerHeight = 768;
await act(async () => {
  rx = TestRenderer.create(
    marco(<EditorPlano planoInicial={Q} capa="escenico" onGardar={async () => {}} onSaír={() => {}} />),
    { createNodeMock: nodeMock },
  );
});
await cadro();
ok('só hai un debuxo antes de abrir a exportación', todos(rx.toJSON(), (n) => n.type === 'svg').length === 1);
await act(async () => { porTitulo(rx.toJSON(), 'Exportar').props.onClick(); });
await cadro();
let jx = rx.toJSON();
const svgsX = todos(jx, (n) => n.type === 'svg');
ok('⚠️ ao abrir a exportación hai DOUS debuxos: o visible e o de exportar',
  svgsX.length === 2, svgsX.length);
// O agochado leva a paleta clara: fondo branco.
ok('⚠️ o de exportar vai coa paleta escollida, non coa do tema',
  todos(jx, (n) => n.props && n.props.fill === '#ffffff').length > 0);
ok('e ofrece as tres paletas', texto(jx).includes('Claro') && texto(jx).includes('Negativo') && texto(jx).includes('Transparente'));
ok('e os dous formatos', !!porTitulo(jx, 'Exportar PNG') && !!porTitulo(jx, 'Exportar SVG'));
// ⚠️ Fóra da pantalla, non display:none: un nodo con display:none non
// ten caixa e hai navegadores que nin o serializan ben.
const agochado = todos(jx, (n) => n.props && n.props.style && n.props.style.left === -99999)[0];
ok('⚠️ o debuxo de exportar está fóra de pantalla, non oculto', !!agochado);
ok('e non colle toques', agochado.props.style.pointerEvents === 'none');

// Cambiar a paleta cambia o debuxo agochado, non o visible.
await act(async () => { todos(rx.toJSON(), (n) => n.type === 'button' && texto(n) === 'Negativo')[0].props.onClick(); });
await cadro();
ok('cambiar a paleta de exportación non toca o que se ve',
  svgDe(rx.toJSON()).props.viewBox === '-75 -75 1150 900');
// ⚠️ Exportar non é editar.
ok('⚠️ e non ensucia o plano', !texto(rx.toJSON()).includes('● Gardar'));
await act(async () => { rx.unmount(); });

// ═══════════════════════════════════════════════════════════════════
// ⚠️ AS FERRAMENTAS DOS DOUS MODOS NON SE MESTURAN
// ═══════════════════════════════════════════════════════════════════
let rt2 = null;
await act(async () => {
  rt2 = TestRenderer.create(
    marco(<EditorPlano planoInicial={planoBaleiro('T')} capa="tecnico" onGardar={async () => {}} onSaír={() => {}} />),
    { createNodeMock: nodeMock },
  );
});
await cadro();
ok('⚠️ no modo técnico NON hai botón de engadir persoa', !porTitulo(rt2.toJSON(), 'Engadir persoa'));
ok('e si de engadir equipo', !!porTitulo(rt2.toJSON(), 'Engadir equipo'));
ok('cos símbolos técnicos', texto(rt2.toJSON()).includes('Monitor de chan'));
ok('⚠️ e sen os escénicos', !texto(rt2.toJSON()).includes('Sofá'));
await act(async () => { rt2.unmount(); });

// ═══════════════════════════════════════════════════════════════════
// CATRO LAYOUTS, non un encollido
// ═══════════════════════════════════════════════════════════════════
const medir = async (w, h) => {
  window.innerWidth = w; window.innerHeight = h;
  let rr = null;
  await act(async () => {
    rr = TestRenderer.create(
      marco(<EditorPlano planoInicial={planoBaleiro('L')} capa="escenico" onGardar={async () => {}} onSaír={() => {}} />),
      { createNodeMock: nodeMock },
    );
  });
  await cadro();
  const caixa = todos(rr.toJSON(), (n) => n.props && n.props.onPointerMove)[0];
  const out = { ancho: caixa.props.style.width, alto: caixa.props.style.height };
  await act(async () => { rr.unmount(); });
  return out;
};

for (const [w, h, nome] of [[390, 844, 'iPhone'], [768, 1024, 'iPad V'], [1024, 768, 'iPad H'], [1440, 900, 'Escritorio']]) {
  // eslint-disable-next-line no-await-in-loop
  const c = await medir(w, h);
  const prop = c.ancho / c.alto;
  ok(`${nome} · o escenario ten medidas reais (${Math.round(c.ancho)}×${Math.round(c.alto)})`,
    c.ancho > 60 && c.alto > 60, `${c.ancho}×${c.alto}`);
  ok(`${nome} · ⚠️ e conserva a proporción 4:3`, Math.abs(prop - 4 / 3) < 0.01, prop);
  ok(`${nome} · e cabe na pantalla`, c.alto <= h && c.ancho <= w, `${c.ancho}×${c.alto} en ${w}×${h}`);
}

// ⚠️ `window.innerHeight` pode ser undefined nunha webview: sen o
// `|| 800` todo o cálculo daría NaN e non se debuxaría nada.
window.innerWidth = 900; window.innerHeight = undefined;
let rn = null;
await act(async () => {
  rn = TestRenderer.create(
    marco(<EditorPlano planoInicial={planoBaleiro('N')} capa="escenico" onGardar={async () => {}} onSaír={() => {}} />),
    { createNodeMock: nodeMock },
  );
});
await cadro();
const cn = todos(rn.toJSON(), (n) => n.props && n.props.onPointerMove)[0];
ok('⚠️ sen innerHeight non hai NaN no layout',
  Number.isFinite(cn.props.style.height) && cn.props.style.height > 60, cn.props.style.height);
await act(async () => { rn.unmount(); });
window.innerHeight = 768;

console.log(f ? `\n${f} FALLOS` : '\n✓ Os casos do editor de Plano pasan');
process.exit(f ? 1 : 0);
