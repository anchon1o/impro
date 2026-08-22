import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Sonido } from '/home/claude/impro/impro/src/sonido/Sonido.jsx';
import {
  ThemeCtx, TEMAS, completarTema, avisosContraste,
} from '/home/claude/impro/impro/src/core.jsx';

let f = 0;
const ok = (t, c, e = '') => { console.log((c ? '✓ ' : '✗ ') + t + (c ? '' : ' — ' + e)); if (!c) f++; };

const RECURSOS = [
  { id: 'm1', tipo: 'musica', nome: 'Jazz escuro', url: 'https://x/j.mp3', vol: 0.7, modo: 'loop', emoji: '🎵' },
  { id: 'a1', tipo: 'ambiente', nome: 'Choiva', url: 'https://x/c.mp3', vol: 0.35, modo: 'loop', emoji: '🌧' },
  { id: 'a2', tipo: 'ambiente', nome: 'Lareira', url: 'https://x/l.mp3', vol: 0.15, modo: 'loop', emoji: '🔥' },
  { id: 'e1', tipo: 'efecto', nome: 'Porta', url: 'https://x/p.wav', vol: 0.9, modo: 'once', emoji: '🚪' },
  { id: 'e2', tipo: 'efecto', nome: 'Trono', url: 'https://x/t.wav', vol: 1, modo: 'once', emoji: '⚡' },
  { id: 'e3', tipo: 'efecto', nome: 'Campá', url: 'https://x/b.wav', vol: 0.8, modo: 'once', emoji: '🔔' },
];

function texto(json) {
  const out = [];
  (function walk(n) {
    if (n == null) return;
    if (typeof n === 'string' || typeof n === 'number') { out.push(String(n)); return; }
    if (Array.isArray(n)) return n.forEach(walk);
    if (n.children) walk(n.children);
  })(json);
  return out.join(' ');
}
function todos(json, pred, acc = []) {
  if (!json || typeof json !== 'object') return acc;
  if (Array.isArray(json)) { json.forEach((n) => todos(n, pred, acc)); return acc; }
  if (pred(json)) acc.push(json);
  (json.children || []).forEach((n) => todos(n, pred, acc));
  return acc;
}
const botons = (j) => todos(j, (n) => n.type === 'button');
const porEtiqueta = (j, txt) => botons(j).find((b) => (b.props['aria-label'] || '') === txt);
const cadro = () => act(async () => { await new Promise((r) => setTimeout(r, 30)); });

function Marco({ children, tema = TEMAS[0], escuro = true }) {
  // ⚠️ As claves son `escuro`/`claro`, non `dark`/`light`. Pasar as
  // segundas non peta: `{...undefined}` é válido e cae nos neutros por
  // defecto, así que a proba parecía verde sen tocar os temas reais.
  const T = completarTema(escuro ? tema.escuro : tema.claro, escuro ? 'escuro' : 'claro');
  return (
    <ThemeCtx.Provider value={{ T, dark: escuro, toggle() {}, tema, setTema() {}, setDark() {} }}>
      {children}
    </ThemeCtx.Provider>
  );
}

async function montar(props = {}, ancho = 1024) {
  window.innerWidth = ancho;
  let r = null;
  await act(async () => {
    r = TestRenderer.create(<Marco><Sonido recursos={RECURSOS} {...props} /></Marco>);
  });
  await cadro();
  return r;
}

// ── Porta de entrada ──────────────────────────────────────────────
let r = await montar();
let t = texto(r.toJSON());
ok('sen arrancar amosa a porta de entrada', t.includes('Preparar a mesa'));
ok('e explica por que fai falta o toque', t.includes('toque'));
ok('non amosa a mesa aínda', !t.includes('STOP TODO'));

await act(async () => { porEtiqueta(r.toJSON(), undefined); });
const prep = botons(r.toJSON()).find((b) => texto(b).includes('Preparar'));
await act(async () => { prep.props.onClick(); });
await cadro();
t = texto(r.toJSON());
ok('tras preparar aparece a mesa', t.includes('STOP TODO'));

// ── Contido ───────────────────────────────────────────────────────
ok('amosa os tres grupos', t.includes('Música') && t.includes('Ambientes') && t.includes('Efectos'));
ok('lista os recursos por tipo',
  t.includes('Jazz escuro') && t.includes('Choiva') && t.includes('Lareira') && t.includes('Porta'));
ok('trae un contador por defecto', t.includes('Show completo') && t.includes('0:00'));

// ── Acender unha capa ─────────────────────────────────────────────
const bChoiva = porEtiqueta(r.toJSON(), 'Acender Choiva');
ok('a canle ten botón de acender', !!bChoiva);
await act(async () => { bChoiva.props.onClick(); });
await cadro();
ok('tras acender o botón pasa a apagar', !!porEtiqueta(r.toJSON(), 'Apagar Choiva'));

// ── Volume ────────────────────────────────────────────────────────
const slider = todos(r.toJSON(), (n) => n.type === 'input'
  && n.props['aria-label'] === 'Volume de Choiva')[0];
ok('a canle ten control de volume', !!slider);
await act(async () => { slider.props.onChange({ target: { value: '0.8' } }); });
await cadro();
ok('o volume actualízase na interface', texto(r.toJSON()).includes('80'));

// ── Efectos ───────────────────────────────────────────────────────
ok('os tres efectos son botóns',
  ['Porta', 'Trono', 'Campá'].every((n) => !!porEtiqueta(r.toJSON(), n)));
await act(async () => { porEtiqueta(r.toJSON(), 'Porta').props.onClick(); });
ok('disparar un efecto non peta', true);

// ── STOP e FADE ───────────────────────────────────────────────────
const stop = botons(r.toJSON()).find((b) => texto(b).includes('STOP TODO'));
await act(async () => { stop.props.onClick(); });
await cadro();
ok('STOP apaga as capas', !!porEtiqueta(r.toJSON(), 'Acender Choiva'));
const fade = botons(r.toJSON()).find((b) => texto(b).includes('FADE TODO'));
ok('hai botón de FADE', !!fade);
await act(async () => { fade.props.onClick(); });
ok('FADE sen nada activo non peta', true);

// ── ⚠️ STOP illado ────────────────────────────────────────────────
// §18: visible pero sen pulsacións accidentais. Compróbase que non
// está pegado ao botón anterior.
const barra = todos(r.toJSON(), (n) => {
  const s = n.props && n.props.style;
  return s && s.borderRadius === 14 && s.display === 'flex' && s.flexWrap === 'wrap';
});
ok('STOP ten marxe morta á súa esquerda',
  todos(r.toJSON(), (n) => n.props && n.props.style && n.props.style.width === 22).length === 1);

// ── Contadores ────────────────────────────────────────────────────
const engadir = porEtiqueta(r.toJSON(), 'Engadir contador');
ok('hai botón de engadir contador', !!engadir);
await act(async () => { engadir.props.onClick(); });
await cadro();
// ⚠️ Agora hai máis dun <select> na mesa (a lista de reprodución).
// Búscase polo aria-label, non pola posición.
const sel = todos(r.toJSON(), (n) => n.type === 'select'
  && n.props['aria-label'] === 'Tipo de contador')[0];
ok('o formulario ofrece os tres tipos', !!sel);
await act(async () => { sel.props.onChange({ target: { value: 'atras' } }); });
await cadro();
ok('ao escoller conta atrás aparece o campo de minutos',
  !!todos(r.toJSON(), (n) => n.type === 'input' && n.props['aria-label'] === 'Minutos')[0]);
const bEngadir = botons(r.toJSON()).find((b) => texto(b) === 'Engadir');
await act(async () => { bEngadir.props.onClick(); });
await cadro();
ok('engádese o segundo contador', texto(r.toJSON()).includes('Conta atrás'));

// Nacen parados, así que o primeiro botón é Seguir.
const seguir = porEtiqueta(r.toJSON(), 'Seguir');
ok('o contador arranca parado e ofrece Seguir', !!seguir);
await act(async () => { seguir.props.onClick(); });
await cadro();
const pausar = porEtiqueta(r.toJSON(), 'Pausar');
ok('ao arrancar cambia a Pausar', !!pausar);
await act(async () => { pausar.props.onClick(); });
await cadro();
ok('e ao pausar volve a Seguir e dío', !!porEtiqueta(r.toJSON(), 'Seguir')
  && texto(r.toJSON()).includes('pausa'));

const eliminar = porEtiqueta(r.toJSON(), 'Eliminar');
await act(async () => { eliminar.props.onClick(); });
await cadro();
ok('elimínase un contador', !texto(r.toJSON()).includes('Show completo'));
await act(async () => { r.unmount(); });

// ── Campos a 16px: por baixo, iOS fai zoom ────────────────────────
r = await montar();
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
await act(async () => { porEtiqueta(r.toJSON(), 'Engadir contador').props.onClick(); });
await cadro();
// ⚠️ Só os campos de TEXTO: as caixas de verificación non levan estilo
// e iOS non fai zoom nelas.
const campos = todos(r.toJSON(), (n) => (
  (n.type === 'input' && n.props.type !== 'range' && n.props.type !== 'checkbox' && n.props.style)
  || (n.type === 'select' && n.props.style)));
ok(`os ${campos.length} campos de texto van a 16px (sen zoom en iOS)`,
  campos.length > 0 && campos.every((c) => String(c.props.style.fontSize) === '16px'),
  campos.map((c) => c.props.style.fontSize).join(','));

// ── ⚠️ B24: nunca `border` mesturado con `border*Color` ───────────
const mesturados = todos(r.toJSON(), (n) => {
  const s = n.props && n.props.style;
  if (!s) return false;
  const temAbrev = s.border !== undefined;
  const temLongo = ['borderColor', 'borderLeftColor', 'borderTopColor', 'borderBottomColor', 'borderRightColor']
    .some((k) => s[k] !== undefined);
  return temAbrev && temLongo;
});
ok('ningún estilo mestura `border` con `border*Color` (B24)', mesturados.length === 0, mesturados.length);

// ── Área de toque ─────────────────────────────────────────────────
const pequenos = botons(r.toJSON()).filter((b) => {
  const s = b.props.style || {};
  const h = s.minHeight || s.height;
  return typeof h === 'number' && h < 34;
});
ok('ningún botón por debaixo de 34px de alto', pequenos.length === 0, pequenos.length);

// ── Reixas con min(): senón desbordan en móbil (B23) ──────────────
const reixas = todos(r.toJSON(), (n) => {
  const s = n.props && n.props.style;
  return s && typeof s.gridTemplateColumns === 'string' && s.gridTemplateColumns.includes('minmax');
});
ok('todas as reixas auto-fill usan min()',
  reixas.length > 0 && reixas.every((g) => g.props.style.gridTemplateColumns.includes('min(')),
  reixas.map((g) => g.props.style.gridTemplateColumns).join(' | '));
await act(async () => { r.unmount(); });

// ── Layout por ancho ──────────────────────────────────────────────
for (const [w, nome, dobre] of [[390, 'iPhone', false], [768, 'iPad vertical', false],
  [1024, 'iPad horizontal', true], [1440, 'escritorio', true]]) {
  r = await montar({}, w);
  await act(async () => {
    botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
  });
  await cadro();
  const grellas = todos(r.toJSON(), (n) => {
    const s = n.props && n.props.style;
    return s && s.gridTemplateColumns === '1fr 1fr';
  });
  ok(`${w}px (${nome}) → ${dobre ? 'dúas columnas' : 'unha columna'}`,
    (grellas.length > 0) === dobre);
  ok(`  e a mesa segue completa a ${w}px`, texto(r.toJSON()).includes('STOP TODO'));
  await act(async () => { r.unmount(); });
}

// ── Modo función ──────────────────────────────────────────────────
r = await montar({ modoFuncion: true, onSairFuncion: () => {} });
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
t = texto(r.toJSON());
ok('modo función avisa de non bloquear a pantalla', t.includes('non bloquees a pantalla'));
ok('modo función oculta o engadir contador', !porEtiqueta(r.toJSON(), 'Engadir contador'));
ok('pero mantén STOP e FADE', t.includes('STOP TODO') && t.includes('FADE TODO'));
await act(async () => { r.unmount(); });

// ── Sen recursos: non pode quedar muda ────────────────────────────
r = await montar({ recursos: [] });
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
t = texto(r.toJSON());
ok('sen recursos dío en vez de amosar paneis baleiros',
  t.includes('Sen música') && t.includes('Sen ambientes') && t.includes('Sen efectos'));
await act(async () => { r.unmount(); });

// ── Os 8 temas ────────────────────────────────────────────────────
let malos = 0;
for (const tema of TEMAS) {
  for (const escuro of [true, false]) {
    let rt = null;
    window.innerWidth = 1024;
    await act(async () => {
      rt = TestRenderer.create(
        <Marco tema={tema} escuro={escuro}><Sonido recursos={RECURSOS} /></Marco>,
      );
    });
    await cadro();
    await act(async () => {
      botons(rt.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
    });
    await cadro();
    if (!texto(rt.toJSON()).includes('STOP TODO')) malos++;
    const T = completarTema(escuro ? tema.escuro : tema.claro, escuro ? 'escuro' : 'claro');
    if (avisosContraste(T).length) malos++;
    await act(async () => { rt.unmount(); });
  }
}
ok(`a mesa renderiza nos ${TEMAS.length} temas × 2 modos, todos con contraste válido`, malos === 0, malos);

// ── Persistencia ─────────────────────────────────────────────────
localStorage.clear();
r = await montar();
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
// Mover un volume, arrancar un contador e engadir outro
const sl = todos(r.toJSON(), (n) => n.type === 'input'
  && n.props['aria-label'] === 'Volume de Choiva')[0];
await act(async () => { sl.props.onChange({ target: { value: '0.42' } }); });
await act(async () => { porEtiqueta(r.toJSON(), 'Seguir').props.onClick(); });
await act(async () => { porEtiqueta(r.toJSON(), 'Engadir contador').props.onClick(); });
await cadro();
const campoEt = todos(r.toJSON(), (n) => n.type === 'input'
  && n.props['aria-label'] === 'Etiqueta do contador')[0];
await act(async () => { campoEt.props.onChange({ target: { value: 'Segunda parte' } }); });
await cadro();
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b) === 'Engadir').props.onClick();
});
await act(async () => { await new Promise((res) => setTimeout(res, 700)); });
await act(async () => { r.unmount(); });

// Volver a montar = recargar a app
r = await montar();
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
t = texto(r.toJSON());
ok('⚠️ os contadores sobreviven a recargar', t.includes('Segunda parte') && t.includes('Show completo'));
ok('⚠️ o volume da canle tamén', t.includes('42'), t.slice(0, 300));
ok('pero NADA empeza a soar só ao abrir',
  !!porEtiqueta(r.toJSON(), 'Acender Choiva'));
await act(async () => { r.unmount(); });
localStorage.clear();

// ── Contadores parados de saída ──────────────────────────────────
r = await montar();
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
ok('⚠️ o contador por defecto NON está correndo', texto(r.toJSON()).includes('pausa'));
ok('e amosa 0:00, non un tempo inventado', texto(r.toJSON()).includes('0:00'));
const play = porEtiqueta(r.toJSON(), 'Seguir');
ok('ten botón para arrancalo cando empece o show', !!play);
await act(async () => { play.props.onClick(); });
await cadro();
ok('ao premer arranca', !!porEtiqueta(r.toJSON(), 'Pausar'));

// ── Metrónomo ────────────────────────────────────────────────────
t = texto(r.toJSON());
ok('o metrónomo está en Sonido co seu 🥁', t.includes('🥁 Metrónomo'));
ok('e amosa o bpm por defecto', t.includes('100'));
// O botón do metrónomo é agora só o símbolo, sen texto.
const panelMet = todos(r.toJSON(), (n) => texto(n).includes('🥁 Metrónomo'))[0];
const iniciar = botons(panelMet).find((b) => texto(b).trim() === '▶');
ok('ten botón de iniciar', !!iniciar);
await act(async () => { iniciar.props.onClick(); });
await cadro();
ok('ao iniciar cambia a parar',
  !!botons(todos(r.toJSON(), (n) => texto(n).includes('🥁 Metrónomo'))[0])
    .find((b) => texto(b).trim() === '⏹'));

const bpm = todos(r.toJSON(), (n) => n.type === 'input' && n.props['aria-label'] === 'Pulsos por minuto')[0];
ok('ten control de bpm', !!bpm);
await act(async () => { bpm.props.onChange({ target: { value: '140' } }); });
await cadro();
ok('⚠️ cambiar o bpm en marcha NON para o metrónomo',
  texto(r.toJSON()).includes('140')
  && !!botons(todos(r.toJSON(), (n) => texto(n).includes('🥁 Metrónomo'))[0])
       .find((b) => texto(b).trim() === '⏹'));

const compas = todos(r.toJSON(), (n) => n.type === 'select'
  && n.props['aria-label'] === 'Pulsos por compás')[0];
ok('pódense cambiar os pulsos por compás', !!compas);
await act(async () => { compas.props.onChange({ target: { value: '3' } }); });
await cadro();

// STOP TODO tenno que parar tamén
const stop2 = botons(r.toJSON()).find((b) => texto(b).includes('STOP TODO'));
await act(async () => { stop2.props.onClick(); });
await cadro();
ok('⚠️ STOP TODO para tamén o metrónomo',
  !!botons(todos(r.toJSON(), (n) => texto(n).includes('🥁 Metrónomo'))[0])
    .find((b) => texto(b).trim() === '▶'));

// Modo función agóchao
await act(async () => { r.unmount(); });
r = await montar({ modoFuncion: true });
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
ok('modo función agocha o metrónomo', !texto(r.toJSON()).includes('🥁 Metrónomo'));
await act(async () => { r.unmount(); });

// ── Escenas na interface ─────────────────────────────────────────
localStorage.clear();
const gardadas = [];
r = await montar({
  escenas: [
    { id: 's1', nome: 'Mansión', emoji: '🎭', capas: { a1: 0.3, m1: 0.6 }, botons: ['e1'], fade: 1.5 },
    { id: 's2', nome: 'Nave', emoji: '🚀', capas: { a2: 0.4 }, botons: [], fade: 1.5 },
  ],
  onGardarEscena: (e) => { gardadas.push(e); return { ok: true }; },
  onBorrarEscena: () => {},
});
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
t = texto(r.toJSON());
ok('as escenas aparecen na mesa', t.includes('🎭 Escenas') && t.includes('Mansión') && t.includes('Nave'));

// Aplicar unha escena acende as súas capas
await act(async () => { porEtiqueta(r.toJSON(), 'Aplicar Mansión').props.onClick(); });
await cadro();
ok('⚠️ aplicar unha escena acende as súas capas',
  !!porEtiqueta(r.toJSON(), 'Apagar Choiva') && !!porEtiqueta(r.toJSON(), 'Apagar Jazz escuro'));
ok('e non acende as que non son dela', !!porEtiqueta(r.toJSON(), 'Acender Lareira'));

// Cambiar de escena apaga o que non pertence á nova
await act(async () => { porEtiqueta(r.toJSON(), 'Aplicar Nave').props.onClick(); });
await cadro();
ok('⚠️ cambiar de escena apaga o da anterior',
  !!porEtiqueta(r.toJSON(), 'Acender Choiva') && !!porEtiqueta(r.toJSON(), 'Acender Jazz escuro'));
ok('e acende o da nova', !!porEtiqueta(r.toJSON(), 'Apagar Lareira'));

// Gardar o que soa
await act(async () => { porEtiqueta(r.toJSON(), 'Gardar escena').props.onClick(); });
await cadro();
const campoEsc = todos(r.toJSON(), (n) => n.type === 'input'
  && n.props['aria-label'] === 'Nome da escena')[0];
ok('ofrece gardar a escena actual', !!campoEsc);
await act(async () => { campoEsc.props.onChange({ target: { value: 'Taberna' } }); });
await cadro();
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Gardar o que soa')).props.onClick();
});
await cadro();
ok('captura o que está soando', gardadas.length === 1 && gardadas[0].nome === 'Taberna');
ok('e só o que está aceso', Object.keys(gardadas[0].capas).join(',') === 'a2',
  Object.keys(gardadas[0].capas).join(','));
ok('cada escena ten botón de eliminar', !!porEtiqueta(r.toJSON(), 'Eliminar Mansión'));
await act(async () => { r.unmount(); });

// Modo función: as escenas seguen, pero sen editar
r = await montar({ modoFuncion: true, escenas: [{ id: 's1', nome: 'Mansión', emoji: '🎭', capas: {}, botons: [], fade: 1.5 }] });
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
ok('en Modo función as escenas seguen a un toque',
  !!porEtiqueta(r.toJSON(), 'Aplicar Mansión'));
ok('pero non se poden gardar nin borrar',
  !porEtiqueta(r.toJSON(), 'Gardar escena') && !porEtiqueta(r.toJSON(), 'Eliminar Mansión'));
await act(async () => { r.unmount(); });

// ── Precarga ─────────────────────────────────────────────────────
localStorage.clear();
globalThis.__fetchs = [];
globalThis.__fetchFallar = ['https://x/t.wav'];   // Trono non carga
r = await montar();
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
t = texto(r.toJSON());
ok('a barra ofrece preparar os sons pendentes', t.includes('Preparar sons (3)'), t.slice(0, 200));
ok('e nada se descargou aínda só por abrir', globalThis.__fetchs.length === 0,
  globalThis.__fetchs.length);

const bPreparar = botons(r.toJSON()).find((b) => texto(b).includes('Preparar sons'));
await act(async () => { bPreparar.props.onClick(); });
await act(async () => { await new Promise((res) => setTimeout(res, 120)); });
t = texto(r.toJSON());
ok('descárganse os tres efectos', globalThis.__fetchs.length === 3, globalThis.__fetchs.length);
ok('⚠️ os ambientes NON se meten en buffer (só se preparan)',
  !globalThis.__fetchs.includes('https://x/c.mp3'), globalThis.__fetchs.join(','));
ok('a barra pasa a "listos"', t.includes('listos'), t.slice(0, 200));
ok('e di cantos fallaron', t.includes('non se puido cargar') || t.includes('non se puideron cargar'),
  t.slice(0, 300));
ok('explica que pode ser CORS', t.includes('CORS'));

// Estado por botón
const bPorta = porEtiqueta(r.toJSON(), 'Porta (listo)');
ok('un efecto cargado márcase como listo', !!bPorta);
const bTrono = porEtiqueta(r.toJSON(), 'Trono (non se puido cargar)');
ok('e o que fallou dío', !!bTrono);
ok('⚠️ o que fallou queda desactivado, non muto', bTrono.props.disabled === true);
await act(async () => { r.unmount(); });
globalThis.__fetchFallar = [];

// ── Reprodutor de listas ─────────────────────────────────────────
localStorage.clear();
const LISTA = { id:'l1', nome:'Show', emoji:'🎵', local:true, pistas:[
  { id:'p1', nome:'Tema propio', url:'https://x/tema.mp3', recursoId:null, provedor:'interno', vol:0.7 },
  { id:'p2', nome:'Algo de YouTube', url:'https://youtu.be/dQw4w9WgXcQ', recursoId:null, provedor:'youtube', vol:0.8 },
]};
r = await montar({ listas:[LISTA], listaActiva:LISTA, onEscollerLista:()=>{},
  onCambiarLista:()=>{}, onGardarLista:()=>{}, onBorrarLista:()=>{} });
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
t = texto(r.toJSON());
ok('a lista aparece no panel de música', t.includes('Tema propio') && t.includes('Algo de YouTube'));
ok('⚠️ avisa de que a lista é mixta', t.includes('mestura'), t.slice(0,300));
ok('e marca cales son de YouTube', t.includes('YT'));

// Pista interna: pasa polo bus, sen marco
await act(async () => { porEtiqueta(r.toJSON(),'Tocar Tema propio').props.onClick(); });
await cadro();
const marcos1 = todos(r.toJSON(), (n)=>n.type==='iframe');
ok('⚠️ unha pista propia NON abre marco de YouTube', marcos1.length===0);
ok('e non entra en modo exclusivo', !texto(r.toJSON()).includes('Modo exclusivo'));
ok('ofrece pausar', !!porEtiqueta(r.toJSON(),'Pausar'));

// Pista externa: marco visible + modo exclusivo
await act(async () => { porEtiqueta(r.toJSON(),'Tocar Algo de YouTube').props.onClick(); });
await cadro();
const marcos2 = todos(r.toJSON(), (n)=>n.type==='iframe');
ok('⚠️ unha pista de YouTube SI abre o marco', marcos2.length===1);
ok('  e o marco é visible, non oculto',
  marcos2[0] && marcos2[0].props.style.width==='100%', JSON.stringify(marcos2[0]&&marcos2[0].props.style));
ok('  apuntando a youtube-nocookie',
  marcos2[0] && marcos2[0].props.src.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'));
t = texto(r.toJSON());
ok('⚠️ entra en MODO EXCLUSIVO e dío', t.includes('Modo exclusivo'));
ok('  explicando que o FADE non a toca', t.includes('FADE'));

// ⚠️ Os efectos quedan bloqueados
const bPorta2 = botons(r.toJSON()).find((b)=>(b.props['aria-label']||'').startsWith('Porta'));
ok('⚠️ os efectos quedan DESACTIVADOS en modo exclusivo',
  bPorta2 && bPorta2.props.disabled===true, bPorta2 && bPorta2.props['aria-label']);

// Parar devolve o control
await act(async () => { porEtiqueta(r.toJSON(),'Parar a lista').props.onClick(); });
await cadro();
ok('ao parar péchase o marco', todos(r.toJSON(),(n)=>n.type==='iframe').length===0);
ok('e sae do modo exclusivo', !texto(r.toJSON()).includes('Modo exclusivo'));
const bPorta3 = botons(r.toJSON()).find((b)=>(b.props['aria-label']||'').startsWith('Porta'));
ok('os efectos volven', bPorta3 && bPorta3.props.disabled!==true);
await act(async () => { r.unmount(); });

// ── ⚠️ Música de YouTube na biblioteca ───────────────────────────
// Un recurso con URL de YouTube non se pode meter nun <audio>.
// Antes aparecía como canle e ao premelo non soaba nada, en silencio.
localStorage.clear();
const CON_YT = [...RECURSOS,
  { id:'m2', tipo:'musica', nome:'Algo de YouTube',
    url:'https://youtu.be/dQw4w9WgXcQ', vol:0.8, modo:'loop', emoji:'🎵' }];
r = await montar({ recursos: CON_YT });
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
ok('⚠️ unha música de YouTube NON aparece como canle',
  !porEtiqueta(r.toJSON(), 'Acender Algo de YouTube'));
ok('  pero a música normal si', !!porEtiqueta(r.toJSON(), 'Acender Jazz escuro'));
t = texto(r.toJSON());
ok('⚠️ e dise onde está e que facer con ela',
  t.includes('YouTube') && t.includes('lista de reprodución'), t.slice(0, 400));
await act(async () => { r.unmount(); });

// ── Master, metrónomo e modo función ─────────────────────────────
localStorage.clear();
r = await montar();
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
const fMaster = todos(r.toJSON(), (n) => n.type === 'input'
  && n.props['aria-label'] === 'Volume xeral')[0];
ok('⚠️ hai fader de MASTER', !!fMaster);
await act(async () => { fMaster.props.onChange({ target: { value: '0.35' } }); });
await cadro();
ok('  e móvese', texto(r.toJSON()).includes('35'), texto(r.toJSON()).slice(0, 200));

t = texto(r.toJSON());
ok('o metrónomo segue aí', t.includes('🥁 Metrónomo'));
ok('⚠️ pero xa non ten selector de compás tipo 4/4', !t.includes('4/4'));
const bpm2 = todos(r.toJSON(), (n) => n.type === 'input'
  && n.props['aria-label'] === 'Pulsos por minuto')[0];
ok('  conserva o control de bpm', !!bpm2);
const pulsos = todos(r.toJSON(), (n) => n.type === 'select'
  && n.props['aria-label'] === 'Pulsos por compás')[0];
ok('  e o número de pulsos', !!pulsos);
await act(async () => { r.unmount(); });

// Modo función pide pantalla enteira
const eventos = [];
const orixinal = window.dispatchEvent;
window.dispatchEvent = (e) => { eventos.push([e.type, e.detail]); return true; };
r = await montar({ modoFuncion: true });
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
ok('en modo función o metrónomo agóchase', !texto(r.toJSON()).includes('🥁 Metrónomo'));
await act(async () => { r.unmount(); });
window.dispatchEvent = orixinal;

// ── Escaleta importada ───────────────────────────────────────────
localStorage.clear();
localStorage.setItem('impro_escaletas_v1', JSON.stringify([{
  id: 'x1', nome: 'Show de outono', notas: '12 nov · Teatro Rosalía',
  tipo: 'espectaculo', local: true,
  bloques: [
    { id: 'b1', tipoId: 'calentamiento', nome: 'Quecemento', minutos: 0,
      itens: [{ id: 'i1', nome: 'Círculo de nomes', minutos: 8 }] },
    { id: 'b2', tipoId: null, nome: 'Descanso', minutos: 10, itens: [] },
  ],
}]));
r = await montar();
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
t = texto(r.toJSON());
ok('hai panel de escaleta', t.includes('📋 Escaleta'));
ok('  e di que se importa de Sesións', t.includes('Sesións'));

await act(async () => { porEtiqueta(r.toJSON(), 'Importar escaleta').props.onClick(); });
await act(async () => { await new Promise((res) => setTimeout(res, 60)); });
t = texto(r.toJSON());
ok('lista as escaletas gardadas', t.includes('Show de outono'));
const limpo = (x) => x.replace(/\s+/g, ' ');
ok('  co seu resumo e as notas',
  /18\s*min/.test(t) && t.includes('Teatro Rosalía'), limpo(t).slice(0, 300));
ok('⚠️ e avisa de que é unha copia', t.includes('non cambia a escaleta gardada'));

await act(async () => { porEtiqueta(r.toJSON(), 'Importar Show de outono').props.onClick(); });
await cadro();
t = texto(r.toJSON());
ok('⚠️ ao importar vense bloques E dinámicas',
  t.includes('Quecemento') && t.includes('Círculo de nomes') && t.includes('Descanso'));
// O descanso empeza no minuto 8, que é onde remata o quecemento.
ok('⚠️ cos tempos ACUMULADOS: o descanso empeza no minuto 8',
  /Descanso/.test(t) && /8\s*′/.test(t), limpo(t).slice(0, 300));
// ⚠️ Son 3 entradas: bloque Quecemento, a súa dinámica, e o bloque
// Descanso. Un bloque con dinámicas non se conta dúas veces.
ok('e o reconto vai por entradas reais', /0\s*de\s*3/.test(t), limpo(t).slice(0, 300));

await act(async () => { porEtiqueta(r.toJSON(), 'Marcar Círculo de nomes').props.onClick(); });
await cadro();
ok('márcase feito', /1\s*de\s*3/.test(texto(r.toJSON())));
ok('e pódese desmarcar', !!porEtiqueta(r.toJSON(), 'Desmarcar Círculo de nomes'));
await act(async () => { r.unmount(); });
localStorage.clear();

// ── C12 · Botonera con páxinas ───────────────────────────────────
localStorage.clear();
const MOITOS = [...RECURSOS];
for (let i = 0; i < 30; i++) {
  MOITOS.push({ id: 'fx' + i, tipo: 'efecto', nome: 'Efecto ' + i,
    url: 'https://x/f' + i + '.wav', vol: 0.8, modo: 'once', emoji: '⚡' });
}
r = await montar({ recursos: MOITOS }, 1024);
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
ok('⚠️ con 33 efectos aparece o paxinador', !!porEtiqueta(r.toJSON(), 'Páxina 2'));
ok('  e non se debuxan os 33 de golpe',
  botons(r.toJSON()).filter((b) => /^Efecto \d+/.test(b.props['aria-label'] || '')).length <= 24,
  botons(r.toJSON()).filter((b) => /^Efecto \d+/.test(b.props['aria-label'] || '')).length);
ok('a primeira páxina está marcada',
  porEtiqueta(r.toJSON(), 'Páxina 1').props['aria-current'] === true);

const antes = botons(r.toJSON()).filter((b) => /^Efecto/.test(b.props['aria-label'] || ''))
  .map((b) => b.props['aria-label']);
await act(async () => { porEtiqueta(r.toJSON(), 'Páxina 2').props.onClick(); });
await cadro();
const despois = botons(r.toJSON()).filter((b) => /^Efecto/.test(b.props['aria-label'] || ''))
  .map((b) => b.props['aria-label']);
ok('⚠️ cambiar de páxina amosa outros efectos',
  antes.join() !== despois.join() && despois.length > 0);
ok('e o botón de anterior actívase',
  porEtiqueta(r.toJSON(), 'Páxina anterior').props.disabled === false);
await act(async () => { r.unmount(); });

// ⚠️ Con poucos efectos NON debe aparecer paxinador
r = await montar({ recursos: RECURSOS }, 1024);
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
ok('⚠️ con 3 efectos NON hai paxinador', !porEtiqueta(r.toJSON(), 'Páxina 2'));
await act(async () => { r.unmount(); });

// ── C11 · Faders verticais en modo función ───────────────────────
r = await montar({ recursos: RECURSOS }, 1024);
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
const horizontais = todos(r.toJSON(), (n) => n.type === 'input'
  && n.props['aria-label'] === 'Volume de Choiva');
ok('fóra de modo función o fader é horizontal',
  horizontais[0] && !horizontais[0].props.style.writingMode);
await act(async () => { r.unmount(); });

r = await montar({ recursos: RECURSOS, modoFuncion: true }, 1024);
await act(async () => {
  botons(r.toJSON()).find((b) => texto(b).includes('Preparar')).props.onClick();
});
await cadro();
const verticais = todos(r.toJSON(), (n) => n.type === 'input'
  && n.props['aria-label'] === 'Volume de Choiva');
ok('⚠️ en modo función o fader é VERTICAL',
  verticais[0] && verticais[0].props.style.writingMode === 'vertical-lr',
  verticais[0] && JSON.stringify(verticais[0].props.style));
ok('  e segue sendo un control nativo (input range)', verticais[0].props.type === 'range');
ok('  cos ambientes aínda acendibles', !!porEtiqueta(r.toJSON(), 'Acender Choiva'));
await act(async () => { r.unmount(); });

console.log(f ? `\n${f} FALLOS` : '\n✓ Os 112 casos da mesa pasan');
process.exit(f ? 1 : 0);
