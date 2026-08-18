// ═══════════════════════════════════════════════════════════════════
// SONIDO · reprodutor de listas
// ═══════════════════════════════════════════════════════════════════
// Dous xeitos de soar, e a interface ten que deixar claro cal está en
// marcha, porque se comportan distinto:
//
//   INTERNO → pasa polo bus de música. Ten volume, mestúrase con
//     efectos e ambientes, e o FADE e o STOP afectan.
//
//   EXTERNO (YouTube) → vai nun <iframe> que controlan eles. Sen
//     volume propio, fóra do FADE, e pode meter publicidade. Obriga a
//     MODO EXCLUSIVO: apáganse as capas e desactívanse os efectos.
//
// ⚠️ O modo exclusivo non é unha decisión de deseño reversible: é o
// que fai a integración lexítima. Solapar audio de YouTube con outro
// audio incumpre as súas condicións.
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTheme, mkS } from '../core.jsx';
import { urlEmbed, avisosDe, detectarProvedor } from '../audio/externo.js';
import { seguinte, anterior, mover, quitar, analizarLista, crearPista, resumo } from './playlists.js';

// Todas as accións teñen valor por defecto: `Sonido` pódese usar sen
// listas (nunha proba, nunha vista previa) e o reprodutor non pode
// petar por iso.
const nada = () => {};

export function Reprodutor({
  T, S, m, listas = [], activa = null,
  onEscoller = nada, onCambiar = nada, onGardar = nada, onBorrar,
  exclusivo, setExclusivo = nada, modoFuncion, recursos = [],
}) {
  const [pista, setPista] = useState(null);
  const [pausada, setPausada] = useState(false);
  const [editando, setEditando] = useState(false);
  const [pegado, setPegado] = useState('');
  const [nome, setNome] = useState('');
  const [aviso, setAviso] = useState(null);
  const marco = useRef(null);

  const pistas = activa?.pistas || [];
  const actual = pistas.find((p) => p.id === pista) || null;
  const externa = actual && actual.provedor !== 'interno';
  const res = resumo(activa);

  // Ao saír da lista ou cambiar de lista, calar todo o que quedase.
  useEffect(() => () => { m.pararPista(); }, [m]);

  const parar = useCallback(() => {
    m.pararPista();
    setPista(null); setPausada(false); setExclusivo(false); setAviso(null);
  }, [m, setExclusivo]);

  const tocar = useCallback((p) => {
    if (!p) { parar(); return; }
    const prov = p.provedor || detectarProvedor(p.url);
    const av = avisosDe(p.url);
    if (av.erro) { setAviso(av.texto); return; }

    if (prov === 'interno') {
      setExclusivo(false);
      const url = p.recursoId
        ? (recursos.find((r) => r.id === p.recursoId) || {}).url
        : p.url;
      if (!url) { setAviso('Esa pista xa non está dispoñible.'); return; }
      m.reproducirPista(url, {
        vol: p.vol,
        // Avance automático só nas internas: nas de YouTube non podemos
        // saber cando rematan sen cargar o script deles (ver externo.js).
        onFin: () => { const s = seguinte(activa, p.id); if (s) tocar(s); else parar(); },
      });
    } else {
      // Externa: cala o que estea soando ANTES de arrancar o marco.
      m.pararPista();
      m.pararTodo();
      setExclusivo(true);
    }
    setPista(p.id); setPausada(false); setAviso(av.texto || null);
  }, [m, activa, recursos, parar, setExclusivo]);

  const editar = (f) => { if (!activa) return; onCambiar(f(activa)); };

  const pegarLista = () => {
    const novas = analizarLista(pegado);
    if (!novas.length) { setAviso('Non se recoñeceu ningunha ligazón.'); return; }
    editar((a) => ({ ...a, pistas: [...(a.pistas || []), ...novas] }));
    setPegado(''); setAviso(`${novas.length} pistas engadidas.`);
  };

  const engadirDaBiblioteca = (r) => {
    editar((a) => ({ ...a, pistas: [...(a.pistas || []), crearPista({ nome: r.nome, recursoId: r.id, vol: r.vol })] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

      {/* Selector de lista */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={activa ? activa.id : ''} onChange={(e) => { parar(); onEscoller(e.target.value); }}
          aria-label="Lista activa"
          style={{ ...S.input, flex: '1 1 150px', width: 'auto', minHeight: 42 }}>
          <option value="">Sen lista</option>
          {listas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.emoji} {l.nome} ({l.pistas.length}){l.local ? ' · local' : ''}
            </option>
          ))}
        </select>
        {!modoFuncion && (
          <button onClick={() => setEditando((v) => !v)} style={S.btn(T.bg3, T.text2)}>
            {editando ? '✕' : '✎'}
          </button>
        )}
      </div>

      {/* Aviso de mestura: mellor sabelo antes de empezar a función */}
      {activa && res.mixta && !modoFuncion && (
        <p style={{ ...S.t.caption, color: T.warn, margin: 0 }}>
          Esta lista mestura {res.internas} pistas propias e {res.externas} de YouTube.
          Ao chegar a unha de YouTube cálase o resto da mesa.
        </p>
      )}

      {/* Marco de YouTube. Ten que estar visible: é condición de uso. */}
      {externa && (
        <div style={{
          borderStyle: 'solid', borderWidth: 1.5, borderColor: T.warn,
          borderRadius: 12, overflow: 'hidden', background: '#000',
        }}>
          <iframe
            ref={marco}
            key={actual.id}
            src={urlEmbed(actual.url)}
            title={actual.nome}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', aspectRatio: '16 / 9', border: 'none', display: 'block' }}
          />
        </div>
      )}

      {exclusivo && (
        <p style={{
          ...S.t.caption, color: T.warn, margin: 0,
          background: T.warn + '14', borderRadius: 8, padding: '0.45rem 0.6rem',
        }}>
          Modo exclusivo: mentres soe YouTube, os efectos e os ambientes están
          en silencio, e nin o volume nin o FADE afectan a esta pista.
        </p>
      )}

      {aviso && !exclusivo && (
        <p style={{ ...S.t.caption, color: T.info, margin: 0 }}>{aviso}</p>
      )}

      {/* Transporte */}
      {activa && pistas.length > 0 && (
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => tocar(anterior(activa, pista))} aria-label="Anterior"
            style={{ ...S.btn(T.bg3, T.text2), minWidth: 44, minHeight: 42 }}>⏮</button>
          {pista && !externa ? (
            <button onClick={() => { m.pausarPista(!pausada); setPausada((v) => !v); }}
              aria-label={pausada ? 'Seguir' : 'Pausar'}
              style={{ ...S.btn(T.accent), minWidth: 52, minHeight: 42 }}>
              {pausada ? '▶' : '⏸'}
            </button>
          ) : (
            <button onClick={() => tocar(actual || pistas[0])} aria-label="Reproducir"
              style={{ ...S.btn(T.accent), minWidth: 52, minHeight: 42 }}>▶</button>
          )}
          <button onClick={() => tocar(seguinte(activa, pista))} aria-label="Seguinte"
            style={{ ...S.btn(T.bg3, T.text2), minWidth: 44, minHeight: 42 }}>⏭</button>
          {pista && (
            <button onClick={parar} aria-label="Parar a lista"
              style={{ ...S.btn(T.bg3, T.danger), minWidth: 44, minHeight: 42 }}>⏹</button>
          )}
          <span style={{
            ...S.t.caption, color: T.text3, flex: 1, minWidth: 80,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {actual ? actual.nome : `${pistas.length} pistas`}
          </span>
        </div>
      )}

      {/* Lista de pistas */}
      {activa && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', maxHeight: 210, overflowY: 'auto' }}>
          {pistas.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', gap: '0.4rem', alignItems: 'center',
              padding: '0.3rem 0.4rem', borderRadius: 8,
              background: p.id === pista ? T.accent + '18' : 'transparent',
            }}>
              <span style={{ ...S.t.numeric, fontSize: '0.66rem', color: T.text4, minWidth: 18 }}>{i + 1}</span>
              <button onClick={() => tocar(p)} aria-label={'Tocar ' + p.nome}
                style={{
                  flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0,
                  textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  color: p.id === pista ? T.accent : T.text2,
                  fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                {p.nome}
              </button>
              {p.provedor !== 'interno' && (
                <span style={{ ...S.t.caption, color: T.warn, fontSize: '0.6rem' }}>YT</span>
              )}
              {editando && !modoFuncion && (
                <span style={{ display: 'flex', gap: '0.1rem' }}>
                  <Mini T={T} label="Subir" onClick={() => editar((a) => mover(a, p.id, -1))}>▲</Mini>
                  <Mini T={T} label="Baixar" onClick={() => editar((a) => mover(a, p.id, 1))}>▼</Mini>
                  <Mini T={T} label="Quitar" cor={T.danger} onClick={() => editar((a) => quitar(a, p.id))}>✕</Mini>
                </span>
              )}
            </div>
          ))}
          {!pistas.length && (
            <p style={{ ...S.t.caption, color: T.text4, margin: 0 }}>
              Lista baleira. Pega ligazóns ou engade sons da túa biblioteca.
            </p>
          )}
        </div>
      )}

      {/* Edición */}
      {editando && !modoFuncion && (
        <div style={{
          borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: T.border,
          paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.45rem',
        }}>
          {!activa ? (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <input value={nome} onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da lista nova" aria-label="Nome da lista"
                style={{ ...S.input, flex: '2 1 140px', width: 'auto' }} />
              <button onClick={() => { onGardar(nome); setNome(''); }} style={S.btn(T.accent)}>Crear</button>
            </div>
          ) : (
            <>
              <textarea value={pegado} onChange={(e) => setPegado(e.target.value)}
                placeholder={'Unha ligazón por liña. Admite YouTube e MP3 directos.\nTamén «Nome⇥ligazón».'}
                aria-label="Pegar ligazóns"
                style={{ ...S.input, width: '100%', minHeight: 76, fontFamily: 'inherit', resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button onClick={pegarLista} style={S.btn(T.accent)}>Engadir ligazóns</button>
                <button onClick={() => onGardar()} style={S.btn(T.bg3, T.text)}>Gardar lista</button>
                {onBorrar && (
                  <button onClick={() => { parar(); onBorrar(activa); }}
                    style={S.btn(T.bg4, T.danger)}>Eliminar</button>
                )}
              </div>
              {recursos.filter((r) => r.tipo === 'musica').length > 0 && (
                <div>
                  <p style={{ ...S.t.caption, color: T.text4, margin: '0.2rem 0 0.3rem' }}>
                    Da túa biblioteca:
                  </p>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {recursos.filter((r) => r.tipo === 'musica').map((r) => (
                      <button key={r.id} onClick={() => engadirDaBiblioteca(r)}
                        style={{ ...S.btn(T.bg3, T.text2), minHeight: 34, fontSize: '0.72rem' }}>
                        ＋ {r.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Mini({ T, children, onClick, label, cor }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      style={{
        width: 26, height: 26, padding: 0, borderRadius: 6, background: T.bg4,
        borderStyle: 'solid', borderWidth: 1, borderColor: T.border,
        color: cor || T.text3, fontSize: '0.62rem', cursor: 'pointer',
      }}>{children}</button>
  );
}
