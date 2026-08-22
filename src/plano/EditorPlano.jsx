// ═══════════════════════════════════════════════════════════════════
// PLANO · editor
// ═══════════════════════════════════════════════════════════════════
// O orquestrador: ten o documento, o historial e a selección. Todo o
// demais é presentación.
//
// ⚠️ CATRO LAYOUTS, NON UN ENCOLLIDO. Os cortes son os reais da app
// (`useViewport`: 520 · 900 · 1180), non uns inventados:
//
//   móbil       barra abaixo · inspector en folla inferior
//   iPad V      rail esquerdo · inspector flotante sobre o escenario
//   iPad H      rail · escenario · inspector fixo   ← a principal
//   escritorio  igual, con máis aire
//
// ⚠️ O ESCENARIO MANDA. Sobre o 78-80 % do oco. Todo o demais encolle
// antes ca el.
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTheme, useViewport, mkS } from '../core.jsx';
import { paletaDesdeTema, cor as corTok, PALETAS, NOMES_PALETA } from './paleta.js';
import * as exp from './exportar.js';
import { VistaPlanta } from './VistaPlanta.jsx';
import { VistaPublico } from './VistaPublico.jsx';
import { nomesSimbolos, SIMBOLOS } from './iconosPlano.jsx';
import * as H from './historial.js';
import {
  validar, novoElemento, engadirElemento, borrarElemento, establecerColocacion,
  colocacionDe, elementoPorId, seguinteCorActor, seguinteNumeroActor,
  CORES_ACTOR, POSTURAS, elementosDaCapa,
} from './modelo.js';
import { caixaEscenario, aNormalizado, clamp01, MIRADA_PUBLICO, normalizarAngulo } from './xeometria.js';

const NOME_POSTURA = { 'de-pe': 'De pé', sentado: 'Sentado', agachado: 'Agachado', deitado: 'Deitado', elevado: 'Elevado' };

// As oito direccións. Sen isto hai que arrastrar un control para poñer
// «mira ao público», que é o 80 % dos casos.
const MIRADAS = [
  ['↑', 270], ['↗', 315], ['→', 0], ['↘', 45],
  ['↓', 90], ['↙', 135], ['←', 180], ['↖', 225],
];

function Boton({ T, activo, cor: c, children, ...rest }) {
  return (
    <button
      type="button"
      style={{
        background: activo ? `${c || T.accent}22` : T.bg3,
        borderStyle: 'solid', borderWidth: 1,
        borderColor: activo ? (c || T.accent) : T.border,
        borderRadius: 9, minHeight: 38, minWidth: 38, padding: '0 0.5rem',
        color: activo ? (c || T.accent) : T.text2,
        fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: activo ? 700 : 500,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', gap: '0.3rem',
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function EditorPlano({ planoInicial, capa, onGardar, onSaír }) {
  const { T } = useTheme();
  const S = mkS(T);
  const v = useViewport();
  const paleta = useMemo(() => paletaDesdeTema(T), [T]);

  const [hist, setHist] = useState(() => H.crear(validar(planoInicial)));
  const plano = H.actual(hist);
  const [momentoId, setMomentoId] = useState(() => validar(planoInicial).momentos[0].id);
  const [sel, setSel] = useState(null);
  const [panel, setPanel] = useState(false);
  // ⚠️ A vista é estado da INTERFACE, non do documento. Un plano non se
  // garda «en vista de público»: gárdase, e mírase como se queira.
  const [vista, setVista] = useState('planta');
  const [expAberto, setExpAberto] = useState(false);
  const [expPaleta, setExpPaleta] = useState('claro');
  const [expEstado, setExpEstado] = useState(null);
  const refExp = useRef(null);
  const [sucio, setSucio] = useState(false);
  const refCaixa = useRef(null);
  const arrastre = useRef(null);

  const aplicar = useCallback((seguinte, etiqueta = null) => {
    setHist((h) => H.push(h, seguinte, { etiqueta }));
    setSucio(true);
  }, []);

  // ⚠️ O momento activo pode desaparecer (borrado, ou desfacer por
  // riba da súa creación). Sen esta rede, `colocacionDe` devolve null
  // para todo e o escenario queda baleiro sen dicir por que.
  useEffect(() => {
    if (!plano.momentos.some((m) => m.id === momentoId)) setMomentoId(plano.momentos[0].id);
  }, [plano, momentoId]);
  useEffect(() => {
    if (sel && !elementoPorId(plano, sel)) setSel(null);
  }, [plano, sel]);

  // ── Oco para o escenario ─────────────────────────────────────────
  // ⚠️ `window.innerHeight` pode ser undefined nalgunhas webviews: sen
  // o `|| 800` todo o cálculo dá NaN e non se debuxa nada.
  const alto = (v.h || 800);
  const railAncho = v.esMovil ? 0 : (v.esEscritorio ? 56 : v.esTabletH ? 52 : 46);
  const inspAncho = v.esEscritorio ? 290 : v.esTabletH ? 250 : 0;
  const barraAlto = v.esMovil ? 54 : 0;
  const cabeceira = 46;
  const dispo = {
    ancho: Math.max(120, (v.w || 900) - railAncho - inspAncho - (v.esMovil ? 16 : 28)),
    alto: Math.max(120, alto - cabeceira - barraAlto - 44 - (v.esMovil ? 90 : 40)),
  };
  const caixa = caixaEscenario({ x: 0, y: 0, ...dispo }, plano.escenario);

  // ── Ferramentas ──────────────────────────────────────────────────
  const engadirActor = () => {
    const el = novoElemento('actor', {
      nome: '', cor: seguinteCorActor(plano), numero: seguinteNumeroActor(plano),
    });
    const seguinte = establecerColocacion(engadirElemento(plano, el, momentoId), momentoId, el.id, { x: 0.5, y: 0.62 });
    aplicar(seguinte);
    setSel(el.id);
    if (v.esMovil) setPanel(true);
  };

  const engadirSimbolo = (nome) => {
    const esTec = capa === 'tecnico';
    const el = novoElemento(esTec ? 'tecnico' : 'obxecto', {
      simbolo: nome, cor: esTec ? 'info' : 'muted',
      ...(esTec ? { subcapa: SIMBOLOS[nome]?.subcapa || 'audio' } : {}),
    });
    let seguinte = engadirElemento(plano, el, momentoId);
    seguinte = establecerColocacion(seguinte, momentoId, el.id, { x: 0.5, y: 0.42 });
    aplicar(seguinte);
    setSel(el.id);
  };

  const mudar = (parcial, etiqueta = null) => {
    if (!sel) return;
    aplicar(establecerColocacion(plano, momentoId, sel, parcial), etiqueta);
  };

  const mudarElemento = (parcial) => {
    if (!sel) return;
    aplicar({ ...plano, elementos: plano.elementos.map((e) => (e.id === sel ? { ...e, ...parcial } : e)) });
  };

  const borrar = () => {
    if (!sel) return;
    aplicar(borrarElemento(plano, sel));
    setSel(null);
    setPanel(false);
  };

  const alternarReixa = () => aplicar({
    ...plano,
    escenario: { ...plano.escenario, reixa: { ...plano.escenario.reixa, visible: !plano.escenario.reixa.visible } },
  });
  const alternarCotas = () => aplicar({ ...plano, escenario: { ...plano.escenario, cotas: !plano.escenario.cotas } });

  // ── Arrastre ─────────────────────────────────────────────────────
  // ⚠️ `setPointerCapture` para que o dedo poida saírse do elemento sen
  // soltalo: sen iso, mover rápido perde o actor a media viaxe.
  const baixar = (e, id) => {
    const el = elementoPorId(plano, id);
    if (!el || el.bloqueado) return;
    setSel(id);
    if (v.esMovil) setPanel(true);
    const c = colocacionDe(plano, momentoId, id);
    if (!c) return;
    const r = refCaixa.current && refCaixa.current.getBoundingClientRect
      ? refCaixa.current.getBoundingClientRect() : null;
    if (!r || !r.width) return;
    arrastre.current = { id, r, dx: c.x - (e.clientX - r.left) / r.width, dy: c.y - (e.clientY - r.top) / r.height };
    if (e.currentTarget && e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignórase */ }
    }
    if (e.preventDefault) e.preventDefault();
  };

  const mover = (e) => {
    const a = arrastre.current;
    if (!a) return;
    const x = clamp01((e.clientX - a.r.left) / a.r.width + a.dx);
    const y = clamp01((e.clientY - a.r.top) / a.r.height + a.dy);
    // ⚠️ A etiqueta é o que fai que os 200 eventos dun arrastre sexan
    // UN só paso de desfacer.
    mudarPor(a.id, { x, y }, `mover:${a.id}`);
  };

  const mudarPor = (id, parcial, etiqueta) => {
    setHist((h) => H.push(h, establecerColocacion(H.actual(h), momentoId, id, parcial), { etiqueta }));
    setSucio(true);
  };

  const soltar = () => {
    if (!arrastre.current) return;
    arrastre.current = null;
    // Corta a fusión: o seguinte arrastre do mesmo elemento xa é outro
    // paso de desfacer.
    setHist((h) => H.pechar(h));
  };

  const gardar = async () => { await onGardar(plano); setSucio(false); };

  // ⚠️ EXPORTAR NON SERIALIZA O SVG QUE SE VE. Ese leva a paleta do
  // tema e a capa de selección; a imaxe sairía con tiradores punteados
  // arredor do actor que tiveses escollido. Renderízase un SEGUNDO
  // debuxo, agochado, coa paleta de exportación e sen selección, e
  // serialízase ese. É posible porque as vistas son puras.
  const exportar = async (formato) => {
    setExpEstado('traballando');
    try {
      const nodo = refExp.current && refExp.current.querySelector
        ? refExp.current.querySelector('svg') : null;
      if (!nodo) { setExpEstado('erro'); return; }
      const med = exp.medidasDe(exp.serializar(nodo), 2000);
      const cadea = exp.prepararSvg(exp.serializar(nodo), med);
      const blob = formato === 'svg' ? exp.svgABlob(cadea) : await exp.svgAPng(cadea, 2000);
      const nome = exp.nomeFicheiro(plano.nome, formato, vista === 'publico' ? 'publico' : null);
      const r = await exp.compartirOuDescargar(blob, nome, plano.nome);
      setExpEstado(r.via === 'cancelado' ? null : (r.ok ? 'feito' : 'erro'));
    } catch (e) {
      setExpEstado('erro');
    }
  };

  const VistaExp = vista === 'publico' ? VistaPublico : VistaPlanta;
  const panelExportar = expAberto && (
    <div style={{ ...S.panel, padding: '0.75rem', display: 'grid', gap: '0.6rem' }}>
      <div>
        <p style={{ ...S.ptitle(T.text3), margin: '0 0 0.35rem' }}>Cores da imaxe</p>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {Object.keys(PALETAS).map((k) => (
            <Boton key={k} T={T} activo={expPaleta === k} onClick={() => setExpPaleta(k)}>{NOMES_PALETA[k]}</Boton>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
        <Boton T={T} cor={T.accent} onClick={() => exportar('png')} title="Exportar PNG">🖼 PNG</Boton>
        <Boton T={T} cor={T.info} onClick={() => exportar('svg')} title="Exportar SVG">◇ SVG</Boton>
        <Boton T={T} onClick={() => setExpAberto(false)}>Pechar</Boton>
      </div>
      {expEstado === 'traballando' && <p style={{ color: T.text4, fontSize: '0.78rem', margin: 0 }}>Xerando…</p>}
      {expEstado === 'feito' && <p style={{ color: T.ok, fontSize: '0.78rem', margin: 0 }}>Listo.</p>}
      {expEstado === 'erro' && <p style={{ color: T.danger, fontSize: '0.78rem', margin: 0 }}>Non se puido xerar a imaxe.</p>}
      {/* ⚠️ Fóra da pantalla, non `display:none`: un nodo oculto con
          display:none non ten caixa e hai navegadores que nin o
          serializan ben. `position:absolute` con `left:-99999px` si
          existe de verdade. */}
      <div ref={refExp} aria-hidden="true" style={{ position: 'absolute', left: -99999, top: 0, width: 900, height: 700, pointerEvents: 'none' }}>
        <VistaExp plano={plano} momentoId={momentoId} paleta={PALETAS[expPaleta]} capa={capa} seleccion={null} />
      </div>
    </div>
  );

  const elSel = sel ? elementoPorId(plano, sel) : null;
  const cSel = sel ? colocacionDe(plano, momentoId, sel) : null;

  // ── Barra de ferramentas ─────────────────────────────────────────
  const ferramentas = (
    <>
      {/* ⚠️ AS FERRAMENTAS DOS DOUS MODOS NON SE MESTURAN. No escénico
          non hai micrófonos; no técnico non se engaden actores. */}
      {capa === 'escenico' && <Boton T={T} onClick={engadirActor} title="Engadir persoa" cor={T.accent}>＋👤</Boton>}
      <select
        value=""
        onChange={(e) => { if (e.target.value) engadirSimbolo(e.target.value); }}
        style={{ ...S.input, minHeight: 38, fontSize: '16px', padding: '0 0.4rem', width: v.esMovil ? 92 : railAncho - 8 }}
        title={capa === 'tecnico' ? 'Engadir equipo' : 'Engadir obxecto'}
      >
        <option value="">＋{capa === 'tecnico' ? '🔧' : '🪑'}</option>
        {nomesSimbolos(capa).map((n) => <option key={n} value={n}>{SIMBOLOS[n].nome}</option>)}
      </select>
      <Boton T={T} onClick={alternarReixa} activo={plano.escenario.reixa.visible} title="Reixa">▦</Boton>
      <Boton T={T} onClick={alternarCotas} activo={plano.escenario.cotas} title="Cotas">↔</Boton>
      <Boton T={T} onClick={() => setHist(H.desfacer(hist))} disabled={!H.podeDesfacer(hist)} title="Desfacer">↶</Boton>
      <Boton T={T} onClick={() => setHist(H.refacer(hist))} disabled={!H.podeRefacer(hist)} title="Refacer">↷</Boton>
    </>
  );

  // ── Inspector ────────────────────────────────────────────────────
  const inspector = !elSel ? (
    <p style={{ color: T.text4, fontSize: '0.8rem', textAlign: 'center', padding: '1.5rem 0.5rem', margin: 0 }}>
      Toca algo do escenario para editalo.
    </p>
  ) : (
    <div style={{ display: 'grid', gap: '0.7rem' }}>
      <input
        value={elSel.nome} placeholder={elSel.tipo === 'actor' ? 'Nome' : 'Etiqueta'}
        onChange={(e) => mudarElemento({ nome: e.target.value })}
        style={{ ...S.input }}
      />

      <div>
        <p style={{ ...S.ptitle(T.text3), margin: '0 0 0.35rem' }}>Cor</p>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {CORES_ACTOR.map((c) => (
            <button
              key={c} type="button" onClick={() => mudarElemento({ cor: c })} title={c}
              style={{
                width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                background: corTok(paleta, c),
                borderStyle: 'solid', borderWidth: elSel.cor === c ? 3 : 1,
                borderColor: elSel.cor === c ? T.text : T.border,
              }}
            />
          ))}
        </div>
      </div>

      {/* ⚠️ MIRADA E MOVEMENTO SON COUSAS DISTINTAS. Isto xira sen mover. */}
      <div>
        <p style={{ ...S.ptitle(T.text3), margin: '0 0 0.35rem' }}>Mirada</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.25rem' }}>
          {MIRADAS.map(([f, g]) => (
            <Boton
              key={g} T={T} activo={cSel && normalizarAngulo(cSel.mirada) === g}
              onClick={() => mudar({ mirada: g })} title={`${g}°`}
            >
              {f}
            </Boton>
          ))}
        </div>
        <Boton T={T} onClick={() => mudar({ mirada: MIRADA_PUBLICO })} style={{ marginTop: '0.3rem', width: '100%' }}>
          Ao público
        </Boton>
      </div>

      {elSel.tipo === 'actor' && (
        <div>
          <p style={{ ...S.ptitle(T.text3), margin: '0 0 0.35rem' }}>Postura</p>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {POSTURAS.map((p) => (
              <Boton key={p} T={T} activo={cSel && cSel.postura === p} onClick={() => mudar({ postura: p })}>
                {NOME_POSTURA[p]}
              </Boton>
            ))}
          </div>
        </div>
      )}

      {elSel.tipo !== 'actor' && (
        <div>
          <p style={{ ...S.ptitle(T.text3), margin: '0 0 0.35rem' }}>Xiro</p>
          <input
            type="range" min="0" max="359" step="15"
            value={cSel ? Math.round(cSel.rotacion) : 0}
            onChange={(e) => mudar({ rotacion: Number(e.target.value) }, `xirar:${sel}`)}
            style={{ width: '100%' }}
          />
        </div>
      )}

      <div>
        <p style={{ ...S.ptitle(T.text3), margin: '0 0 0.35rem' }}>Tamaño</p>
        <input
          type="range" min="30" max="220" step="5"
          value={Math.round(elSel.ancho * 1000)}
          onChange={(e) => mudarElemento({ ancho: Number(e.target.value) / 1000, alto: Number(e.target.value) / 1000 })}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
        <Boton T={T} activo={!!(cSel && cSel.foco)} cor={T.warn} onClick={() => mudar({ foco: !(cSel && cSel.foco) })}>◎ Foco</Boton>
        <Boton T={T} activo={!!(cSel && !cSel.visible)} onClick={() => mudar({ visible: !(cSel && cSel.visible) })}>
          {cSel && cSel.visible ? '👁 Visible' : '🚫 Fóra'}
        </Boton>
        <Boton T={T} activo={elSel.bloqueado} onClick={() => mudarElemento({ bloqueado: !elSel.bloqueado })}>
          {elSel.bloqueado ? '🔒' : '🔓'}
        </Boton>
        <Boton T={T} cor={T.danger} onClick={borrar}>🗑</Boton>
      </div>
    </div>
  );

  // ⚠️ A vista de público é de LECTURA. Arrastrar en perspectiva
  // obrigaría a decidir se o dedo move en profundidade ou en
  // horizontal, e non hai resposta boa. Edítase na planta; isto é o
  // espello. Por iso non recibe manexadores.
  const publico = (ancho, alt) => (
    <div style={{ width: ancho, height: alt, margin: '0 auto' }}>
      <VistaPublico plano={plano} momentoId={momentoId} paleta={paleta} capa={capa} seleccion={sel} />
    </div>
  );

  const planta = (ancho, alt) => (
    <div
      ref={refCaixa}
      style={{ width: ancho, height: alt, margin: '0 auto', position: 'relative' }}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerCancel={soltar}
    >
      <VistaPlanta
        plano={plano} momentoId={momentoId} paleta={paleta} capa={capa}
        seleccion={sel}
        onPointerDownElemento={baixar}
        onPointerDownFondo={() => { setSel(null); setPanel(false); }}
      />
    </div>
  );

  let lenzo;
  if (vista === 'publico') {
    lenzo = publico(dispo.ancho, Math.min(dispo.alto, dispo.ancho * 0.7));
  } else if (vista === 'doble') {
    // ⚠️ En pantalla ancha, as dúas ao lado: comparalas é todo o
    // sentido da vista doble. En estreita, unha debaixo da outra —
    // partir 390 px en dous deixa dous selos ilexibles.
    const ladoALado = (v.w || 900) >= 900;
    const a = ladoALado ? Math.floor(dispo.ancho / 2) - 6 : dispo.ancho;
    const cx = caixaEscenario({ x: 0, y: 0, ancho: a, alto: ladoALado ? dispo.alto : dispo.alto * 0.52 }, plano.escenario);
    lenzo = (
      <div style={{ display: 'flex', flexDirection: ladoALado ? 'row' : 'column', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
        {planta(cx.ancho, cx.alto)}
        {publico(a, Math.min(ladoALado ? dispo.alto : dispo.alto * 0.44, a * 0.7))}
      </div>
    );
  } else {
    lenzo = planta(caixa.ancho, caixa.alto);
  }

  const barraVistas = (
    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
      {[['planta', '▤ Planta'], ['publico', '👥 Público'], ['doble', '◫ Doble']].map(([id, et]) => (
        <Boton key={id} T={T} activo={vista === id} onClick={() => setVista(id)} title={et}>
          {v.esMovil ? et.split(' ')[0] : et}
        </Boton>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Cabeceira */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Boton T={T} onClick={onSaír} title="Volver á lista">‹</Boton>
        <span style={{
          color: T.text, fontWeight: 700, fontSize: '0.9rem', flex: 1, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
        >
          {plano.nome}
        </span>
        <span style={{ color: T.text4, fontSize: '0.72rem' }}>
          {elementosDaCapa(plano, capa).length} {capa === 'tecnico' ? 'equipos' : 'elementos'}
        </span>
        <Boton T={T} onClick={() => { setExpAberto((x) => !x); setExpEstado(null); }} title="Exportar">⤓</Boton>
        <Boton T={T} activo={sucio} cor={T.ok} onClick={gardar}>{sucio ? '● Gardar' : '✓ Gardado'}</Boton>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        {/* Rail esquerdo — non en móbil */}
        {!v.esMovil && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: railAncho, flexShrink: 0 }}>
            {ferramentas}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {lenzo}
          {barraVistas}
          {panelExportar}
        </div>

        {/* Inspector fixo — só iPad H e escritorio */}
        {inspAncho > 0 && (
          <div style={{ ...S.panel, width: inspAncho, flexShrink: 0, padding: '0.75rem' }}>{inspector}</div>
        )}
      </div>

      {/* Inspector flotante — iPad vertical */}
      {inspAncho === 0 && !v.esMovil && elSel && (
        <div style={{ ...S.panel, padding: '0.75rem' }}>{inspector}</div>
      )}

      {/* Móbil: barra abaixo e folla inferior */}
      {v.esMovil && (
        <>
          <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>{ferramentas}</div>
          {panel && elSel && (
            <div style={{
              ...S.panel, padding: '0.75rem',
              borderTopStyle: 'solid', borderTopWidth: 3, borderTopColor: T.accent,
            }}
            >
              {inspector}
            </div>
          )}
        </>
      )}
    </div>
  );
}
