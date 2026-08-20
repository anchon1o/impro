// ═══════════════════════════════════════════════════════════════════
// SONIDO · pezas da mesa
// ═══════════════════════════════════════════════════════════════════
// Os compoñentes pequenos que se repiten por toda a mesa. Sacáronse de
// `Sonido.jsx`, que chegara a 921 liñas: cada cambio obrigaba a ler
// todo o ficheiro para atopar o sitio.
//
// ⚠️ Regras que se aplican a todos:
//   · Cores só por `T.<token>`, nunca a man.
//   · Nunca `border` mesturado con `border*Color` (B24): a abreviatura
//     reinicia os catro lados ao cambiar de tema e leva a cor por diante.
//   · Campos a 16px: por baixo, iOS fai zoom ao enfocar.
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { TOQUE } from './medidas.js';
import {
  segundos, aviso, formatar, horaActual,
} from './contadores.js';

export function BotonSon({ T, S, recurso, estado = 'pendente', soando, onDisparar, grande }) {
  const erro = estado === 'erro';
  const cargando = estado === 'cargando';
  const listo = estado === 'listo';
  // Un efecto longo que xa soa márcase, porque volver premelo párao:
  // sen sinal, o segundo toque parecería que non fixo nada.
  const cor = erro ? T.danger : soando ? T.accent : listo ? T.ok : T.bg3;
  return (
    <button
      onClick={onDisparar}
      disabled={erro}
      aria-label={recurso.nome + (erro ? ' (non se puido cargar)' : listo ? ' (listo)' : cargando ? ' (cargando)' : '')}
      style={{
        position: 'relative',
        background: soando ? T.accent + '22' : T.bg3,
        // B24: propiedades longas, nunca a abreviatura.
        borderStyle: 'solid', borderWidth: 1.5, borderColor: cor,
        borderRadius: 12,
        color: erro ? T.danger : T.text,
        minHeight: grande ? TOQUE + 12 : TOQUE,
        padding: '0.4rem 0.3rem',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '0.15rem',
        cursor: erro ? 'not-allowed' : 'pointer',
        opacity: cargando ? 0.45 : 1,
        fontFamily: S.font,
        touchAction: 'manipulation',
        transition: 'opacity 0.15s, border-color 0.15s',
      }}
    >
      {listo && !soando && (
        <span aria-hidden style={{
          position: 'absolute', top: 5, right: 5, width: 6, height: 6,
          borderRadius: '50%', background: T.ok,
        }} />
      )}
      <span style={{ fontSize: grande ? '1.5rem' : '1.25rem', lineHeight: 1 }}>
        {recurso.emoji || '🔊'}
      </span>
      <span style={{
        ...S.t.caption, color: 'inherit', maxWidth: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {erro ? 'non carga' : cargando ? '…' : recurso.nome}
      </span>
    </button>
  );
}

// ── Peza base: canle continua (ambiente ou música) ───────────────
// C11 · En modo función os faders van VERTICAIS. Nunha mesa real
// móvense co polgar de arriba a abaixo, e ademais caben moitas máis
// canles nunha tablet horizontal: en horizontal cada unha come todo o
// ancho e non entran nin catro.
export function CanleVertical({ T, S, capa, recurso, onAcender, onVol }) {
  const cor = capa.erro ? T.danger : capa.on ? T.ok : T.text4;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '0.4rem', minWidth: 62, flex: '0 0 auto',
      paddingBottom: '0.3rem',
    }}>
      <span style={{
        ...S.t.caption, color: T.text3, maxWidth: 60, textAlign: 'center',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{recurso.nome}</span>

      {capa.erro ? (
        <span style={{ ...S.t.caption, color: T.danger }}>erro</span>
      ) : (
        /* ⚠️ `writingMode: vertical-lr` é o único xeito de que un
           <input range> sexa vertical e siga sendo un control nativo:
           con `rotate` deixa de responder ben ao dedo en iOS. */
        <input
          type="range" min="0" max="1" step="0.02" value={capa.vol}
          onChange={(e) => onVol(parseFloat(e.target.value))}
          aria-label={'Volume de ' + recurso.nome}
          style={{
            writingMode: 'vertical-lr', direction: 'rtl',
            width: 30, height: 130, accentColor: T.accent, background: 'transparent',
          }}
        />
      )}

      <span style={{ ...S.t.numeric, fontSize: '0.66rem', color: T.text3 }}>
        {capa.erro ? '—' : Math.round(capa.vol * 100)}
      </span>

      <button
        onClick={onAcender}
        aria-label={(capa.on ? 'Apagar ' : 'Acender ') + recurso.nome}
        style={{
          background: capa.on ? T.ok + '22' : T.bg3,
          borderStyle: 'solid', borderWidth: 1.5, borderColor: cor,
          borderRadius: 10, width: 52, minHeight: 46,
          fontSize: '1.15rem', cursor: 'pointer', color: T.text,
          touchAction: 'manipulation',
        }}
      >{recurso.emoji || '🎚'}</button>
    </div>
  );
}

export function Canle({ T, S, capa, recurso, onAcender, onVol }) {
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
          {capa.cargando && !capa.erro && (
            <span style={{ ...S.t.caption, color: T.text4, fontWeight: 400 }}> · descargando…</span>
          )}
        </div>
        {capa.erro ? (
          <div style={{ ...S.t.caption, color: T.danger }}>Non se puido cargar</div>
        ) : (
          /* O control de volume queda SEMPRE, aínda descargando: deixar
             o volume posto mentres baixa o ficheiro é xusto o que se
             quere facer, e agochalo obrigaba a agardar para nada. */
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
export function Contador({ T, S, c, agora, onAccion, compacto }) {
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

export function IconBtn({ T, children, onClick, label }) {
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
export function Panel({ T, S, titulo, extra, children, sen }) {
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

// C12 · Reixa de efectos con páxinas. Cunha ducia de efectos non fai
// falta; con trinta, a lista faise inmanexable e desprazarse no medio
// dunha función é o xeito de premer o botón equivocado.
//
// ⚠️ As páxinas só aparecen se hai máis dos que caben. Uns poucos
// efectos non poden quedar detrás dun paxinador.
export function ReixaEfectos({
  T, S, recursos, porPaxina, columnas, grande,
  estadoDe, soandoDe, onDisparar, bloqueado,
}) {
  const [pax, setPax] = useState(0);
  const total = Math.max(1, Math.ceil(recursos.length / porPaxina));
  // Se se reduce a lista —  cambiar de mesa, filtrar—  a páxina actual
  // pode quedar fóra de rango e a reixa amosaríase baleira.
  const actual = Math.min(pax, total - 1);
  const desde = actual * porPaxina;
  const visibles = recursos.slice(desde, desde + porPaxina);

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill,minmax(min(${columnas}px,100%),1fr))`,
        gap: '0.45rem',
      }}>
        {visibles.map((r) => (
          <BotonSon key={r.id} T={T} S={S} recurso={r} grande={grande}
            estado={bloqueado ? 'erro' : estadoDe(r)}
            soando={soandoDe(r)}
            onDisparar={() => { if (!bloqueado) onDisparar(r); }} />
        ))}
      </div>

      {total > 1 && (
        <div style={{
          display: 'flex', gap: '0.3rem', alignItems: 'center',
          justifyContent: 'center', marginTop: '0.5rem', flexWrap: 'wrap',
        }}>
          <button onClick={() => setPax(Math.max(0, actual - 1))}
            disabled={actual === 0} aria-label="Páxina anterior"
            style={{ ...S.btn(T.bg3, actual === 0 ? T.text4 : T.text2), minHeight: 36, minWidth: 40 }}>‹</button>
          {Array.from({ length: total }).map((_, i) => (
            <button key={i} onClick={() => setPax(i)}
              aria-label={'Páxina ' + (i + 1)} aria-current={i === actual}
              style={{
                width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                background: i === actual ? T.accent : T.bg3,
                borderStyle: 'solid', borderWidth: 1,
                borderColor: i === actual ? T.accent : T.border,
                color: i === actual ? '#fff' : T.text3,
                fontSize: '0.74rem', fontWeight: 700, fontFamily: S.font,
              }}>{i + 1}</button>
          ))}
          <button onClick={() => setPax(Math.min(total - 1, actual + 1))}
            disabled={actual === total - 1} aria-label="Páxina seguinte"
            style={{ ...S.btn(T.bg3, actual === total - 1 ? T.text4 : T.text2), minHeight: 36, minWidth: 40 }}>›</button>
        </div>
      )}
    </>
  );
}

export function BusVol({ T, S, v = 0.8, onChange }) {
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
