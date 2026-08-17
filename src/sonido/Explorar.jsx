// ═══════════════════════════════════════════════════════════════════
// SONIDO · Explorar
// ═══════════════════════════════════════════════════════════════════
// O banco comunitario (§14). Descubrir sons e escenas publicadas por
// outra xente, probalos e levalos á túa biblioteca.
//
// ⚠️ Sen conta pódese ver e PROBAR todo (§11): a barreira de rexistro
// antes de descubrir a ferramenta é o que fai que ninguén a descubra.
// O que require conta é gardar e duplicar, que é o que precisa un sitio
// onde gardalo.
//
// ⚠️ Filtrar por varias etiquetas é E, non OU. Se fose OU, engadir un
// filtro daría MÁIS resultados, que é o contrario do que espera
// calquera que estea intentando acoutar.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useTheme, mkS, useAuth, useViewport } from '../core.jsx';
import {
  explorar, explorarColeccions, getTags, agruparTags,
  gardarNaBiblioteca, duplicarRecurso, denunciar,
} from './recursos.js';

const CATEGORIAS = [
  { id: 'funcion', label: 'Función escénica' },
  { id: 'tono', label: 'Tono' },
  { id: 'universo', label: 'Universo' },
  { id: 'caracteristica', label: 'Características' },
];

const TIPOS = [
  { id: null, label: 'Todo' },
  { id: 'efecto', label: '⚡ Efectos' },
  { id: 'ambiente', label: '🌧 Ambientes' },
  { id: 'musica', label: '🎵 Música' },
];

const MOTIVOS = [
  { id: 'dereitos', label: 'Problema de dereitos' },
  { id: 'contido', label: 'Contido inapropiado' },
  { id: 'roto', label: 'Non soa / enlace roto' },
  { id: 'duplicado', label: 'Duplicado' },
  { id: 'outro', label: 'Outro' },
];

export function Explorar({ onProbar, onVolver }) {
  const { T } = useTheme();
  const S = mkS(T);
  const vp = useViewport();
  const { perfil } = useAuth();
  const userId = perfil ? perfil.id : null;

  const [tab, setTab] = useState('sons');
  const [tipo, setTipo] = useState(null);
  const [busca, setBusca] = useState('');
  const [escollidas, setEscollidas] = useState([]);
  const [tags, setTags] = useState([]);
  const [lista, setLista] = useState([]);
  const [escenas, setEscenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [motivo, setMotivo] = useState(null);
  const [msg, setMsg] = useState(null);
  const [denunciando, setDenunciando] = useState(null);
  const [catAberta, setCatAberta] = useState('funcion');

  useEffect(() => { getTags().then(setTags); }, []);

  const buscar = useCallback(() => {
    setCargando(true);
    if (tab === 'sons') {
      explorar({ tipo, tags: escollidas, busca }).then((r) => {
        setLista(r); setMotivo(r.motivo); setCargando(false);
      });
    } else {
      explorarColeccions({ tipo: 'escena', busca }).then((r) => {
        setEscenas(r); setMotivo(r.motivo); setCargando(false);
      });
    }
  }, [tab, tipo, escollidas, busca]);

  useEffect(() => {
    // Agárdase un intre antes de buscar: escribir na caixa dispara unha
    // consulta por tecla se non.
    const id = setTimeout(buscar, 300);
    return () => clearTimeout(id);
  }, [buscar]);

  const alternarTag = (id) => setEscollidas((e) => (
    e.includes(id) ? e.filter((x) => x !== id) : [...e, id]
  ));

  const gardar = async (r) => {
    const g = await gardarNaBiblioteca(userId, { recursoId: r.id });
    setMsg(g.ok
      ? (g.xaEstaba ? 'Xa o tiñas gardado.' : `«${r.nome}» gardado.`)
      : g.erro);
  };

  const duplicar = async (r) => {
    const d = await duplicarRecurso(r, userId);
    setMsg(d.ok
      ? `Copia creada en privado. Edítaa en Admin → Sons.`
      : d.erro);
  };

  const enviarDenuncia = async (id, mot) => {
    const d = await denunciar({ recursoId: id, motivo: mot, userId });
    setDenunciando(null);
    setMsg(d.ok ? 'Grazas. Revisarémolo.' : d.erro);
  };

  const grupos = agruparTags(tags);
  const cols = vp.esTabletH || vp.esEscritorio ? 3 : vp.esTablet ? 2 : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>

      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {onVolver && (
          <button onClick={onVolver} style={S.btn(T.bg3, T.text2)}>← Mesa</button>
        )}
        {['sons', 'escenas'].map((k) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k}
            style={S.btn(tab === k ? T.accent : T.bg3, tab === k ? '#fff' : T.text2)}>
            {k === 'sons' ? '🔊 Sons' : '🎭 Escenas'}
          </button>
        ))}
        <input value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar…" aria-label="Buscar"
          style={{ ...S.input, flex: '1 1 150px', width: 'auto' }} />
      </div>

      {tab === 'sons' && (
        <>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {TIPOS.map((t) => (
              <button key={t.label} onClick={() => setTipo(t.id)} aria-pressed={tipo === t.id}
                style={{
                  ...S.btn(tipo === t.id ? T.info : T.bg3, tipo === t.id ? '#000' : T.text2),
                  minHeight: 38, padding: '0.35rem 0.7rem', fontSize: '0.78rem',
                }}>{t.label}</button>
            ))}
          </div>

          {/* Función escénica vai primeiro e aberta: ninguén busca «son
              de porta», búscase «algo para unha entrada de personaxe». */}
          <div style={{
            background: T.bg2, borderStyle: 'solid', borderWidth: 1.5, borderColor: T.border,
            borderRadius: 12, padding: '0.6rem',
          }}>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {CATEGORIAS.map((c) => (
                <button key={c.id} onClick={() => setCatAberta(catAberta === c.id ? null : c.id)}
                  aria-pressed={catAberta === c.id}
                  style={{
                    ...S.btn(catAberta === c.id ? T.bg4 : 'transparent', T.text2),
                    minHeight: 34, padding: '0.25rem 0.6rem', fontSize: '0.72rem',
                  }}>{c.label}</button>
              ))}
              {escollidas.length > 0 && (
                <button onClick={() => setEscollidas([])}
                  style={{ ...S.btn('transparent', T.danger), minHeight: 34, padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}>
                  Limpar ({escollidas.length})
                </button>
              )}
            </div>
            {catAberta && (
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {(grupos[catAberta] || []).map((t) => {
                  const on = escollidas.includes(t.id);
                  return (
                    <button key={t.id} onClick={() => alternarTag(t.id)} aria-pressed={on}
                      style={{
                        background: on ? T.accent : T.bg3,
                        borderStyle: 'solid', borderWidth: 1, borderColor: on ? T.accent : T.border,
                        borderRadius: 999, color: on ? '#fff' : T.text2,
                        padding: '0.3rem 0.7rem', minHeight: 34, fontSize: '0.74rem',
                        cursor: 'pointer', fontFamily: S.font,
                      }}>{t.nome}</button>
                  );
                })}
                {!(grupos[catAberta] || []).length && (
                  <span style={{ ...S.t.caption, color: T.text4 }}>
                    Sen etiquetas. Executa supabase_sonido_tags.sql.
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {msg && <p style={{ ...S.t.caption, color: T.info, margin: 0 }}>{msg}</p>}

      {cargando && <p style={{ ...S.t.caption, color: T.text4, margin: 0 }}>Buscando…</p>}

      {!cargando && motivo === 'sen-conexion' && (
        <p style={{ ...S.t.caption, color: T.danger, margin: 0 }}>
          Sen conexión: Explorar precisa rede. A túa mesa segue funcionando.
        </p>
      )}

      {!cargando && motivo === 'baleira' && (
        <div style={{
          background: T.warn + '12', borderStyle: 'solid', borderWidth: 1.5,
          borderColor: T.warn + '55', borderRadius: 12, padding: '0.9rem',
        }}>
          <p style={{ ...S.t.bodySm, color: T.text, margin: '0 0 0.3rem', fontWeight: 650 }}>
            Nada por aquí
          </p>
          <p style={{ ...S.t.caption, color: T.text3, margin: 0 }}>
            {escollidas.length || busca
              ? 'Proba a quitar filtros ou a buscar outra cousa.'
              : 'Aínda non hai contido publicado. O primeiro pode ser o teu: publica desde Admin → Sons.'}
          </p>
        </div>
      )}

      {tab === 'sons' && lista.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols},minmax(min(220px,100%),1fr))`,
          gap: '0.6rem',
        }}>
          {lista.map((r) => (
            <article key={r.id} style={{
              background: T.bg2, borderStyle: 'solid', borderWidth: 1.5, borderColor: T.border,
              borderRadius: 12, padding: '0.7rem',
              display: 'flex', flexDirection: 'column', gap: '0.4rem',
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.4rem' }}>{r.emoji || '🔊'}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ ...S.t.bodySm, color: T.text, fontWeight: 650,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.nome}
                  </div>
                  <div style={{ ...S.t.caption, color: T.text4 }}>
                    {r.tipo}{r.gardados ? ` · ${r.gardados} gardados` : ''}
                  </div>
                </div>
              </div>

              {r.licenza && (
                <div style={{ ...S.t.caption, color: T.text3 }}>
                  {r.licenza}{r.autoria ? ` · ${r.autoria}` : ''}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                <button onClick={() => onProbar && onProbar(r)} style={{ ...S.btn(T.accent), flex: 1, minHeight: 40 }}>
                  ▶ Probar
                </button>
                {userId && (
                  <>
                    <button onClick={() => gardar(r)} aria-label={'Gardar ' + r.nome}
                      style={{ ...S.btn(T.bg3, T.text2), minHeight: 40, minWidth: 44 }}>☆</button>
                    <button onClick={() => duplicar(r)} aria-label={'Duplicar ' + r.nome}
                      style={{ ...S.btn(T.bg3, T.text2), minHeight: 40, minWidth: 44 }}>⧉</button>
                  </>
                )}
                <button onClick={() => setDenunciando(denunciando === r.id ? null : r.id)}
                  aria-label={'Denunciar ' + r.nome}
                  style={{ ...S.btn(T.bg3, T.text4), minHeight: 40, minWidth: 44 }}>⚑</button>
              </div>

              {denunciando === r.id && (
                <div style={{
                  paddingTop: '0.5rem',
                  borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: T.border,
                  display: 'flex', flexDirection: 'column', gap: '0.3rem',
                }}>
                  {MOTIVOS.map((mo) => (
                    <button key={mo.id} onClick={() => enviarDenuncia(r.id, mo.id)}
                      style={{ ...S.btn(T.bg3, T.text2), minHeight: 36, fontSize: '0.74rem', textAlign: 'left' }}>
                      {mo.label}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {tab === 'escenas' && escenas.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols},minmax(min(200px,100%),1fr))`,
          gap: '0.6rem',
        }}>
          {escenas.map((c) => (
            <article key={c.id} style={{
              background: T.bg2, borderStyle: 'solid', borderWidth: 1.5, borderColor: T.alt,
              borderRadius: 12, padding: '0.7rem',
            }}>
              <div style={{ fontSize: '1.5rem' }}>{c.emoji || '🎭'}</div>
              <div style={{ ...S.t.bodySm, color: T.text, fontWeight: 650 }}>{c.nome}</div>
              {c.descricion && (
                <p style={{ ...S.t.caption, color: T.text3, margin: '0.2rem 0 0' }}>{c.descricion}</p>
              )}
              <div style={{ ...S.t.caption, color: T.text4, marginTop: '0.3rem' }}>
                {c.gardados ? `${c.gardados} gardados` : 'Escena pública'}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
