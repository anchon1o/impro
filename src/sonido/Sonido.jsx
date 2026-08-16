// ═══════════════════════════════════════════════════════════════════
// SONIDO · a mesa
// ═══════════════════════════════════════════════════════════════════
// Deseñada para TABLET HORIZONTAL primeiro. Non é unha web de
// escritorio adaptada: a reixa de dúas columnas é a base, e o móbil é
// a redución. Por iso `esTabletH` e `esEscritorio` comparten layout.
//
// ⚠️ Regras que veñen de erros xa cometidos:
//   · Cores só por `T.<token>`. Nunca a man.
//   · Nunca `border` mesturado con `border*Color` (B24): a abreviatura
//     reinicia os catro lados ao cambiar de tema e a franxa desaparece.
//   · Campos a 16px: por baixo, iOS fai zoom ao enfocar.
//   · Reixas con `minmax(min(Npx,100%),1fr)`, senón desbordan (B23).
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import { useTheme, mkS, useViewport } from '../core.jsx';
import { useMotor, useWakeLock, useReloxo } from './useMotor.js';
import {
  crearContador, segundos, alternar, reiniciar, aviso,
  formatar, horaActual, CORES,
} from './contadores.js';

// Alto mínimo dun botón que hai que acertar sen mirar, cun dedo,
// durante unha función. Por debaixo de 56 fállase.
const TOQUE = 56;

// ── Peza base: botón de son ──────────────────────────────────────
function BotonSon({ T, S, recurso, activo, cargando, erro, onDisparar, grande }) {
  const cor = erro ? T.danger : activo ? T.accent : T.bg3;
  return (
    <button
      onClick={onDisparar}
      disabled={!!erro}
      aria-label={recurso.nome}
      style={{
        background: activo ? T.accent + '22' : T.bg3,
        // B24: propiedades longas, nunca a abreviatura.
        borderStyle: 'solid', borderWidth: 1.5, borderColor: cor,
        borderRadius: 12,
        color: erro ? T.danger : T.text,
        minHeight: grande ? TOQUE + 12 : TOQUE,
        padding: '0.4rem 0.3rem',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '0.15rem',
        cursor: erro ? 'not-allowed' : 'pointer',
        opacity: cargando ? 0.5 : 1,
        fontFamily: S.font,
        touchAction: 'manipulation',
        transition: 'background 0.12s, border-color 0.12s',
      }}
    >
      <span style={{ fontSize: grande ? '1.5rem' : '1.25rem', lineHeight: 1 }}>
        {recurso.emoji || '🔊'}
      </span>
      <span style={{
        ...S.t.caption, color: 'inherit', maxWidth: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {erro ? 'erro' : recurso.nome}
      </span>
    </button>
  );
}

// ── Peza base: canle continua (ambiente ou música) ───────────────
function Canle({ T, S, capa, recurso, onAcender, onVol }) {
  const cor = capa.erro ? T.danger : capa.on ? T.ok : T.text4;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto',
      gap: '0.6rem', alignItems: 'center',
      padding: '0.5rem 0',
      borderBottomStyle: 'solid', borderBottomWidth: 1, borderBottomColor: T.border,
    }}>
      <button
        onClick={onAcender}
        aria-label={(capa.on ? 'Apagar ' : 'Acender ') + recurso.nome}
        style={{
          background: capa.on ? T.ok + '22' : T.bg3,
          borderStyle: 'solid', borderWidth: 1.5, borderColor: cor,
          borderRadius: 10, minWidth: 52, minHeight: 46,
          fontSize: '1.2rem', cursor: 'pointer', color: T.text,
          touchAction: 'manipulation',
        }}
      >
        {recurso.emoji || '🎚'}
      </button>

      <div style={{ minWidth: 0 }}>
        <div style={{
          ...S.t.bodySm, color: T.text, fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {recurso.nome}
        </div>
        {capa.erro ? (
          <div style={{ ...S.t.caption, color: T.danger }}>Non se puido cargar</div>
        ) : (
          <input
            type="range" min="0" max="1" step="0.02" value={capa.vol}
            onChange={(e) => onVol(parseFloat(e.target.value))}
            aria-label={'Volume de ' + recurso.nome}
            style={{ width: '100%', height: 30, accentColor: T.accent, background: 'transparent' }}
          />
        )}
      </div>

      <div style={{
        ...S.t.numeric, fontSize: '0.72rem', color: T.text3,
        minWidth: 34, textAlign: 'right',
      }}>
        {capa.erro ? '—' : Math.round(capa.vol * 100)}
      </div>
    </div>
  );
}

// ── Peza base: contador ──────────────────────────────────────────
function Contador({ T, S, c, agora, onAccion, compacto }) {
  const col = T[c.cor] || T.ok;
  const nivel = aviso(c, agora);
  const val = c.tipo === 'reloxo' ? horaActual(agora) : formatar(segundos(c, agora));
  const alarmado = nivel === 'urxente' || nivel === 'pasado';

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center',
      background: alarmado ? T.danger + '18' : T.bg3,
      borderLeftStyle: 'solid', borderLeftWidth: 4,
      borderLeftColor: alarmado ? T.danger : col,
      borderRadius: '0 10px 10px 0',
      padding: '0.4rem 0.55rem 0.4rem 0.65rem',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          ...S.t.caption, color: T.text3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {c.etiqueta}{c.tipo !== 'reloxo' && !c.correndo ? ' · pausa' : ''}
        </div>
        <div style={{
          ...S.t.numeric,
          fontSize: compacto ? '1.15rem' : '1.45rem',
          color: alarmado ? T.danger : col, lineHeight: 1.15,
        }}>
          {val}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {c.tipo !== 'reloxo' && (
          <>
            <IconBtn T={T} label={c.correndo ? 'Pausar' : 'Seguir'}
              onClick={() => onAccion(c.id, 'alternar')}>{c.correndo ? '⏸' : '▶'}</IconBtn>
            <IconBtn T={T} label="Reiniciar" onClick={() => onAccion(c.id, 'reiniciar')}>↺</IconBtn>
          </>
        )}
        <IconBtn T={T} label="Eliminar" onClick={() => onAccion(c.id, 'eliminar')}>✕</IconBtn>
      </div>
    </div>
  );
}

function IconBtn({ T, children, onClick, label }) {
  return (
    <button
      onClick={onClick} aria-label={label} title={label}
      style={{
        width: 34, height: 34, padding: 0, borderRadius: 8,
        background: T.bg4, borderStyle: 'solid', borderWidth: 1, borderColor: T.border,
        color: T.text2, fontSize: '0.85rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'manipulation',
      }}
    >{children}</button>
  );
}

// ── Panel contedor ───────────────────────────────────────────────
function Panel({ T, S, titulo, extra, children, sen }) {
  return (
    <section style={{
      background: T.bg2,
      borderStyle: 'solid', borderWidth: 1.5, borderColor: T.border,
      borderRadius: 14, padding: '0.75rem', minWidth: 0,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '0.5rem', marginBottom: '0.55rem',
      }}>
        <h2 style={{ ...S.t.label, color: T.text3, margin: 0 }}>{titulo}</h2>
        {extra}
      </div>
      {sen ? <p style={{ ...S.t.caption, color: T.text4, margin: 0 }}>{sen}</p> : children}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// A MESA
// ═══════════════════════════════════════════════════════════════════
export function Sonido({ recursos = [], modoFuncion = false, onSairFuncion }) {
  const { T } = useTheme();
  const S = mkS(T);
  const vp = useViewport();
  const m = useMotor();

  const [contadores, setContadores] = useState(() => [
    crearContador({ tipo: 'crono', etiqueta: 'Show completo', cor: 'ok' }),
  ]);
  const [novoTipo, setNovoTipo] = useState('crono');
  const [novaEtiqueta, setNovaEtiqueta] = useState('');
  const [novaCor, setNovaCor] = useState('info');
  const [novosMin, setNovosMin] = useState('5');
  const [segFade, setSegFade] = useState(5);
  const [mostrarEngadir, setMostrarEngadir] = useState(false);

  const wake = useWakeLock(modoFuncion && m.arrancado);
  useReloxo(m.arrancado, 250);
  const agora = Date.now();

  const porTipo = useMemo(() => ({
    musica: recursos.filter((r) => r.tipo === 'musica'),
    ambiente: recursos.filter((r) => r.tipo === 'ambiente'),
    efecto: recursos.filter((r) => r.tipo === 'efecto'),
  }), [recursos]);

  const capaDe = useCallback((id) => m.capas.find((c) => c.id === id), [m.capas]);

  const alternarCapa = useCallback((r) => {
    const c = capaDe(r.id);
    if (!c) {
      m.engadirCapa(r.id, {
        url: r.url, bus: r.tipo === 'musica' ? 'musica' : 'ambientes',
        vol: r.vol, loop: r.modo === 'loop' || r.tipo === 'ambiente', tipo: r.tipo,
      });
      setTimeout(() => m.acender(r.id, true), 0);
      return;
    }
    m.acender(r.id, !c.on);
  }, [capaDe, m]);

  const accionContador = useCallback((id, que) => {
    setContadores((cs) => {
      if (que === 'eliminar') return cs.filter((c) => c.id !== id);
      return cs.map((c) => {
        if (c.id !== id) return c;
        if (que === 'alternar') return alternar(c);
        if (que === 'reiniciar') return reiniciar(c);
        return c;
      });
    });
  }, []);

  const engadirContador = useCallback(() => {
    setContadores((cs) => [...cs, crearContador({
      tipo: novoTipo, etiqueta: novaEtiqueta, cor: novaCor,
      minutos: Math.max(1, parseInt(novosMin, 10) || 5),
    })]);
    setNovaEtiqueta('');
    setMostrarEngadir(false);
  }, [novoTipo, novaEtiqueta, novaCor, novosMin]);

  // ── Porta de entrada ───────────────────────────────────────────
  // iOS non deixa soar nada sen un xesto previo. Non é un paso de máis:
  // sen el a mesa parece funcionar e non se oe, que é peor.
  if (!m.arrancado) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '2rem 1.5rem',
        minHeight: '55vh', gap: '0.8rem',
      }}>
        <div style={{ fontSize: '2.5rem' }}>🎛</div>
        <h1 style={{ ...S.h2, margin: 0 }}>Preparar a mesa</h1>
        <p style={{ ...S.body, maxWidth: '38ch' }}>
          O navegador precisa un toque teu antes de deixar soar nada.
          Faino agora e non ao empezar a función.
        </p>
        <button onClick={m.arrancar}
          style={{ ...S.btn(T.accent), fontSize: '1rem', padding: '0.9rem 2rem', minHeight: 54 }}>
          Preparar
        </button>
        {m.estado === 'erro' && (
          <p style={{ ...S.t.caption, color: T.danger }}>
            Este navegador non admite Web Audio.
          </p>
        )}
      </div>
    );
  }

  const dobreColumna = vp.esTabletH || vp.esEscritorio;

  // ── Aviso de son perdido ───────────────────────────────────────
  // Nunca se disimula: unha mesa que parece ir e non soa é o peor caso.
  const avisoSon = m.perdido !== null && (
    <div style={{
      background: (m.necesitaToque ? T.danger : T.warn) + '18',
      borderStyle: 'solid', borderWidth: 1.5,
      borderColor: (m.necesitaToque ? T.danger : T.warn) + '66',
      borderRadius: 12, padding: '0.7rem 0.85rem',
      display: 'flex', gap: '0.7rem', alignItems: 'center', flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ ...S.t.bodySm, color: T.text, fontWeight: 650 }}>
          {m.necesitaToque ? 'O son non se recuperou' : 'O son estivo parado'}
        </div>
        <div style={{ ...S.t.caption, color: T.text3 }}>
          {m.necesitaToque
            ? 'iOS suspendeu o audio. Toca aquí para recuperalo.'
            : `Foron uns ${m.perdido} s mentres a app estaba en segundo plano.`}
        </div>
      </div>
      {m.necesitaToque
        ? <button onClick={m.recuperar} style={S.btn(T.danger)}>
            {m.recuperando ? 'Recuperando…' : 'Recuperar son'}
          </button>
        : <button onClick={m.descartarAviso} style={S.btn(T.bg4, T.text)}>Entendido</button>}
    </div>
  );

  // ── Barra de transporte ────────────────────────────────────────
  // STOP vai illado á dereita, con marxe morta arredor: o §18 pide
  // visible pero sen pulsacións accidentais. Illamento espacial, non
  // un diálogo de confirmación: no medio dun show, confirmar é peor.
  const barra = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
      background: T.bg2,
      borderStyle: 'solid', borderWidth: 1.5, borderColor: T.border,
      borderRadius: 14, padding: '0.6rem 0.75rem',
    }}>
      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
        <span style={{ ...S.t.caption, color: T.text4 }}>Fade</span>
        {[2, 5, 10].map((s) => (
          <button key={s} onClick={() => setSegFade(s)}
            aria-pressed={segFade === s}
            style={{
              ...S.btn(segFade === s ? T.accent : T.bg3, segFade === s ? '#fff' : T.text2),
              minHeight: 40, padding: '0.4rem 0.7rem',
            }}>{s}s</button>
        ))}
        <button onClick={() => m.fadeTodo(segFade)}
          style={{ ...S.btn(T.warn, '#000'), minHeight: 44 }}>
          FADE TODO
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 8 }} />

      {modoFuncion && wake === 'rexeitado' && (
        <span style={{ ...S.t.caption, color: T.warn }}>
          A pantalla pode apagarse soa
        </span>
      )}

      {/* Marxe morta á esquerda do STOP */}
      <div style={{ width: 22 }} />
      <button onClick={m.pararTodo}
        style={{
          ...S.btn(T.danger), minHeight: 48, minWidth: 128,
          fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.02em',
        }}>
        STOP TODO
      </button>
    </div>
  );

  // ── Paneis ─────────────────────────────────────────────────────
  const panelMusica = (
    <Panel T={T} S={S} titulo="🎵 Música"
      extra={<BusVol T={T} S={S} v={m.volBus.musica} onChange={(x) => m.volumeBus('musica', x)} />}
      sen={porTipo.musica.length ? null : 'Sen música na mesa.'}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {porTipo.musica.map((r) => {
          const c = capaDe(r.id) || { on: false, vol: r.vol, erro: null };
          return <Canle key={r.id} T={T} S={S} capa={c} recurso={r}
            onAcender={() => alternarCapa(r)} onVol={(v) => m.volCapa(r.id, v)} />;
        })}
      </div>
    </Panel>
  );

  const panelAmbientes = (
    <Panel T={T} S={S} titulo="🌧 Ambientes"
      extra={<BusVol T={T} S={S} v={m.volBus.ambientes} onChange={(x) => m.volumeBus('ambientes', x)} />}
      sen={porTipo.ambiente.length ? null : 'Sen ambientes na mesa.'}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {porTipo.ambiente.map((r) => {
          const c = capaDe(r.id) || { on: false, vol: r.vol, erro: null };
          return <Canle key={r.id} T={T} S={S} capa={c} recurso={r}
            onAcender={() => alternarCapa(r)} onVol={(v) => m.volCapa(r.id, v)} />;
        })}
      </div>
    </Panel>
  );

  const panelEfectos = (
    <Panel T={T} S={S} titulo="⚡ Efectos"
      extra={<BusVol T={T} S={S} v={m.volBus.efectos} onChange={(x) => m.volumeBus('efectos', x)} />}
      sen={porTipo.efecto.length ? null : 'Sen efectos na mesa.'}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill,minmax(min(${dobreColumna ? 92 : 78}px,100%),1fr))`,
        gap: '0.45rem',
      }}>
        {porTipo.efecto.map((r) => (
          <BotonSon key={r.id} T={T} S={S} recurso={r} grande={dobreColumna}
            onDisparar={() => m.disparar(r.url, r.vol)} />
        ))}
      </div>
    </Panel>
  );

  const panelContadores = (
    <Panel T={T} S={S} titulo="⏱ Contadores"
      extra={!modoFuncion && (
        <IconBtn T={T} label="Engadir contador"
          onClick={() => setMostrarEngadir((v) => !v)}>+</IconBtn>
      )}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {contadores.map((c) => (
          <Contador key={c.id} T={T} S={S} c={c} agora={agora}
            onAccion={accionContador} compacto={!dobreColumna} />
        ))}
        {!contadores.length && (
          <p style={{ ...S.t.caption, color: T.text4, margin: 0 }}>Sen contadores.</p>
        )}

        {mostrarEngadir && !modoFuncion && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.3rem',
            paddingTop: '0.6rem',
            borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: T.border,
          }}>
            <input value={novaEtiqueta} onChange={(e) => setNovaEtiqueta(e.target.value)}
              placeholder="Etiqueta" aria-label="Etiqueta do contador"
              style={{ ...S.input, flex: '2 1 130px', width: 'auto' }} />
            <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)}
              aria-label="Tipo de contador"
              style={{ ...S.input, flex: '1 1 110px', width: 'auto' }}>
              <option value="crono">Cronómetro</option>
              <option value="atras">Conta atrás</option>
              <option value="reloxo">Reloxo</option>
            </select>
            {novoTipo === 'atras' && (
              <input value={novosMin} onChange={(e) => setNovosMin(e.target.value)}
                inputMode="numeric" aria-label="Minutos"
                style={{ ...S.input, width: 74, flex: '0 0 auto', textAlign: 'center' }} />
            )}
            <div style={{ display: 'flex', gap: '0.3rem', flex: '1 1 auto' }}>
              {CORES.map((k) => (
                <button key={k} onClick={() => setNovaCor(k)} aria-label={'Cor ' + k}
                  style={{
                    flex: 1, minWidth: 0, height: 42, borderRadius: 8, cursor: 'pointer',
                    background: T[k] || T.ok,
                    borderStyle: 'solid',
                    borderWidth: novaCor === k ? 3 : 1,
                    borderColor: novaCor === k ? T.text : 'transparent',
                  }} />
              ))}
            </div>
            <button onClick={engadirContador} style={S.btn(T.accent)}>Engadir</button>
          </div>
        )}
      </div>
    </Panel>
  );

  // ── Composición ────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      {avisoSon}

      {modoFuncion && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ ...S.t.caption, color: T.text4 }}>
            Modo función · non bloquees a pantalla nin saias da app
          </span>
          {onSairFuncion && (
            <button onClick={onSairFuncion} style={S.btn(T.bg4, T.text)}>Saír</button>
          )}
        </div>
      )}

      {dobreColumna ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', minWidth: 0 }}>
            {panelMusica}
            {panelAmbientes}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', minWidth: 0 }}>
            {panelEfectos}
            {panelContadores}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {panelContadores}
          {panelMusica}
          {panelAmbientes}
          {panelEfectos}
        </div>
      )}

      {barra}
    </div>
  );
}

function BusVol({ T, S, v = 0.8, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 116 }}>
      <input type="range" min="0" max="1" step="0.02" value={v}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label="Volume do grupo"
        style={{ width: 78, height: 26, accentColor: T.accent, background: 'transparent' }} />
      <span style={{ ...S.t.numeric, fontSize: '0.68rem', color: T.text3, minWidth: 24, textAlign: 'right' }}>
        {Math.round(v * 100)}
      </span>
    </div>
  );
}
