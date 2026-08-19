// ═══════════════════════════════════════════════════════════════════
// ESCALETAS · editor
// ═══════════════════════════════════════════════════════════════════
// ⚠️ Este é o ÚNICO sitio onde se edita unha escaleta. Son e En directo
// impórtana en modo lectura. Dúas escaletas editables en dous sitios
// acaban discrepando: é o que xa nos pasou con Reto e Guía (B16).
//
// A idea que o fai coherente: un bloque non leva unha etiqueta libre,
// leva o **id real dun tipo de dinámica**. Por iso ao encher un bloque
// de «quecemento» só se ofrecen as dinámicas dese tipo, sacadas da
// mesma Guía.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme, mkS, useAuth, useDinamicas, colorTipo, TYPE } from '../core.jsx';
import { cargarTiposDinamica, aoCambiarTipos, getGrupos } from '../db.js';
import { filtrarEOrdenar } from '../dinamicasBusca.js';
import {
  escaletaBaleira, crearBloque, crearItem, sanear,
  engadirBloque, quitarBloque, moverBloque,
  engadirItem, quitarItem, moverItem, editarItem,
  minutosBloque, minutosTotais, resumo, duplicar,
  cargarEscaletas, gardarEscaleta, borrarEscaleta, filtrarPorGrupo,
  TIPOS_ESCALETA,
} from '../escaleta.js';

export function EditorEscaleta({ grupoActivo }) {
  const { T } = useTheme();
  const S = mkS(T);
  const { perfil } = useAuth();
  const userId = perfil ? perfil.id : null;
  const { dinamicas } = useDinamicas();

  const [tipos, setTipos] = useState([]);
  const [lista, setLista] = useState([]);
  const [actual, setActual] = useState(null);
  const [msg, setMsg] = useState(null);
  const [escollendo, setEscollendo] = useState(null);   // id do bloque
  const [busca, setBusca] = useState('');
  const [sucia, setSucia] = useState(false);
  const [grupos, setGrupos] = useState([]);
  // Mentres hai un grupo activo, a lista fíltrase. Pódese quitar sen
  // ir a Grupos: obrigar a cambiar de pestana para ver o teu traballo
  // sería o xeito de que ninguén use os grupos.
  const [soDoGrupo, setSoDoGrupo] = useState(true);

  useEffect(() => { getGrupos().then((g) => setGrupos(Array.isArray(g) ? g : [])); }, []);

  const cargarT = useCallback(() => cargarTiposDinamica().then((r) => (
    setTipos((Array.isArray(r) ? r : (r?.tipos || [])).filter((t) => t.activo !== false))
  )), []);
  useEffect(() => { cargarT(); return aoCambiarTipos(cargarT); }, [cargarT]);

  const recargar = useCallback(async () => {
    const r = await cargarEscaletas(userId);
    setLista(r.escaletas);
    if (r.motivo === 'sen-conexion') setMsg('Sen conexión: velas as gardadas neste dispositivo.');
  }, [userId]);
  useEffect(() => { recargar(); }, [recargar]);

  const editar = (f) => { setActual((a) => (a ? f(a) : a)); setSucia(true); };

  const gardar = async () => {
    if (!actual) return;
    const g = await gardarEscaleta(actual, userId);
    if (!g.ok) { setMsg(g.erro); return; }
    setActual(g.escaleta); setSucia(false); setMsg('Gardada.');
    recargar();
  };

  const eliminar = async () => {
    if (!actual) return;
    await borrarEscaleta(actual, userId);
    setActual(null); setMsg(null);
    recargar();
  };

  // Só as dinámicas do tipo do bloque. É o que conecta coa Guía e o que
  // fai que escoller sexa rápido en vez de buscar entre 247.
  const bloqueAberto = actual?.bloques.find((b) => b.id === escollendo) || null;
  const candidatas = useMemo(() => {
    if (!bloqueAberto) return [];
    return filtrarEOrdenar(dinamicas, {
      busca,
      filtro: bloqueAberto.tipoId || 'todos',
      orde: 'nome',
    }).slice(0, 40);
  }, [dinamicas, bloqueAberto, busca]);

  // ── Lista ──────────────────────────────────────────────────────
  if (!actual) {
    return (
      <div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
          <button onClick={() => { setActual(escaletaBaleira()); setSucia(true); }}
            style={S.btn(T.accent)}>+ Nova escaleta</button>
          {!userId && (
            <span style={{ ...TYPE.caption, color: T.text4, alignSelf: 'center' }}>
              Sen conta gárdanse neste dispositivo.
            </span>
          )}
        </div>

        {msg && <p style={{ ...TYPE.caption, color: T.info, margin: '0 0 0.6rem' }}>{msg}</p>}

        {grupoActivo && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: T.text4, fontSize: '0.76rem', marginBottom: '0.7rem', cursor: 'pointer',
          }}>
            <input type="checkbox" checked={soDoGrupo} onChange={(e) => setSoDoGrupo(e.target.checked)} />
            Só as de <b style={{ color: grupoActivo.color || T.accent }}>{grupoActivo.nombre}</b> e as persoais
          </label>
        )}

        {!lista.length && (
          <div style={{ ...S.panel, textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ ...TYPE.bodySm, color: T.text3, margin: '0 0 0.3rem', fontWeight: 650 }}>
              Aínda non hai escaletas
            </p>
            <p style={{ ...TYPE.caption, color: T.text4, margin: 0 }}>
              Unha escaleta é a estrutura dunha sesión ou dun espectáculo: bloques
              por tipo de dinámica, e dentro as que escollas da Guía.
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(260px,100%),1fr))', gap: '0.55rem' }}>
          {(grupoActivo && soDoGrupo ? filtrarPorGrupo(lista, grupoActivo.id) : lista).map((e) => {
            const r = resumo(e);
            return (
              <button key={e.id} onClick={() => { setActual(e); setSucia(false); }}
                style={{ ...S.panel, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={S.tag(T.accent)}>
                    {(TIPOS_ESCALETA.find((t) => t.id === e.tipo) || {}).nome || e.tipo}
                  </span>
                  <span style={{ ...TYPE.caption, color: T.text4 }}>
                    {r.minutos} min · {r.itens} dinámicas
                  </span>
                  {e.local && <span style={{ ...TYPE.caption, color: T.text4 }}>· local</span>}
                  {e.grupoId && (
                    <span style={{ ...TYPE.caption, color: (grupos.find((g) => g.id === e.grupoId) || {}).color || T.text4 }}>
                      · {(grupos.find((g) => g.id === e.grupoId) || {}).nombre || 'grupo'}
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 700, color: T.text, fontSize: '0.92rem' }}>{e.nome}</div>
                {e.notas && (
                  <div style={{ ...TYPE.caption, color: T.text3, marginTop: '0.2rem' }}>{e.notas}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Editor ─────────────────────────────────────────────────────
  const r = resumo(actual);

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.8rem', alignItems: 'center' }}>
        <button onClick={() => { setActual(null); setMsg(null); }} style={S.btn(T.bg3, T.text2)}>← Escaletas</button>
        <div style={{ flex: 1 }} />
        {sucia && <span style={{ ...TYPE.caption, color: T.warn }}>Sen gardar</span>}
        <button onClick={gardar} style={S.btn(sucia ? T.accent : T.bg3, sucia ? '#fff' : T.text3)}>
          💾 Gardar
        </button>
        <button onClick={() => { setActual(duplicar(actual)); setSucia(true); }}
          style={S.btn(T.bg3, T.text2)}>⧉</button>
        <button onClick={eliminar} style={S.btn(T.bg4, T.danger)}>🗑</button>
      </div>

      {msg && <p style={{ ...TYPE.caption, color: T.info, margin: '0 0 0.6rem' }}>{msg}</p>}

      <div style={{ ...S.panel, marginBottom: '0.8rem' }}>
        <input value={actual.nome} onChange={(e) => editar((a) => ({ ...a, nome: e.target.value }))}
          placeholder="Nome da escaleta" aria-label="Nome da escaleta"
          style={{ ...S.input, width: '100%', fontWeight: 700, marginBottom: '0.45rem' }} />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <select value={actual.tipo} onChange={(e) => editar((a) => ({ ...a, tipo: e.target.value }))}
            aria-label="Tipo de escaleta"
            style={{ ...S.input, width: 'auto', flex: '0 0 auto' }}>
            {TIPOS_ESCALETA.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
          {/* Texto libre a propósito: cada quen apunta data, lugar ou
              nome do espectáculo, e non hai que adiviñar campos. */}
          <input value={actual.notas} onChange={(e) => editar((a) => ({ ...a, notas: e.target.value }))}
            placeholder="Data, lugar, espectáculo…" aria-label="Notas"
            style={{ ...S.input, flex: '2 1 160px', width: 'auto' }} />
          {grupos.length > 0 && (
            <select value={actual.grupoId || ''}
              onChange={(e) => editar((a) => ({ ...a, grupoId: e.target.value || null }))}
              aria-label="Grupo"
              style={{ ...S.input, width: 'auto', flex: '0 0 auto' }}>
              <option value="">Persoal</option>
              {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          )}
        </div>
        <p style={{ ...TYPE.caption, color: T.text3, margin: '0.55rem 0 0' }}>
          {r.bloques} bloques · {r.itens} dinámicas · <b>{r.minutos} min</b>
          {r.senContido.length > 0 && (
            <span style={{ color: T.warn }}> · {r.senContido.length} sen contido</span>
          )}
        </p>
      </div>

      {/* ── Bloques ── */}
      {actual.bloques.map((b, bi) => {
        const cor = colorTipo(T, b.tipoId) || T.accent;
        const tipoNome = (tipos.find((t) => t.id === b.tipoId) || {}).nome || 'Sen tipo';
        return (
          <div key={b.id} style={{
            ...S.panel, marginBottom: '0.55rem',
            borderStyle: 'solid', borderWidth: '1.5px 1.5px 1.5px 4px',
            borderTopColor: T.border, borderRightColor: T.border,
            borderBottomColor: T.border, borderLeftColor: cor,
          }}>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <select value={b.tipoId || ''}
                onChange={(e) => editar((a) => ({
                  ...a,
                  bloques: a.bloques.map((x) => (x.id === b.id ? { ...x, tipoId: e.target.value || null } : x)),
                }))}
                aria-label={'Tipo do bloque ' + (bi + 1)}
                style={{ ...S.input, width: 'auto', minHeight: 38 }}>
                <option value="">Sen tipo</option>
                {tipos.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.nome}</option>)}
              </select>
              <input value={b.nome}
                onChange={(e) => editar((a) => ({
                  ...a, bloques: a.bloques.map((x) => (x.id === b.id ? { ...x, nome: e.target.value } : x)),
                }))}
                placeholder={tipoNome} aria-label={'Nome do bloque ' + (bi + 1)}
                style={{ ...S.input, flex: '1 1 120px', width: 'auto', minHeight: 38 }} />
              <span style={{ ...TYPE.numeric, fontSize: '0.78rem', color: T.text3, minWidth: 52, textAlign: 'right' }}>
                {minutosBloque(b)} min
              </span>
              <Mini T={T} label="Subir" onClick={() => editar((a) => moverBloque(a, b.id, -1))}>▲</Mini>
              <Mini T={T} label="Baixar" onClick={() => editar((a) => moverBloque(a, b.id, 1))}>▼</Mini>
              <Mini T={T} label="Quitar bloque" cor={T.danger}
                onClick={() => editar((a) => quitarBloque(a, b.id))}>✕</Mini>
            </div>

            {/* Se non ten dinámicas, a duración ponse a man: así un
                «Descanso» segue contando no total. */}
            {!b.itens.length && (
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.45rem' }}>
                <span style={{ ...TYPE.caption, color: T.text4 }}>Duración fixa:</span>
                <input value={b.minutos} inputMode="numeric"
                  onChange={(e) => editar((a) => ({
                    ...a,
                    bloques: a.bloques.map((x) => (x.id === b.id ? { ...x, minutos: Number(e.target.value) || 0 } : x)),
                  }))}
                  aria-label={'Minutos do bloque ' + (bi + 1)}
                  style={{ ...S.input, width: 72, minHeight: 36, textAlign: 'center' }} />
                <span style={{ ...TYPE.caption, color: T.text4 }}>min</span>
              </div>
            )}

            {b.itens.map((i, ii) => (
              <div key={i.id} style={{
                display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap',
                padding: '0.3rem 0', borderTopStyle: ii ? 'solid' : 'none',
                borderTopWidth: 1, borderTopColor: T.border,
              }}>
                <span style={{ ...TYPE.numeric, fontSize: '0.68rem', color: T.text4, minWidth: 16 }}>{ii + 1}</span>
                <span style={{
                  flex: '1 1 120px', color: T.text2, fontSize: '0.8rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{i.nome}</span>
                <input value={i.minutos} inputMode="numeric"
                  onChange={(e) => editar((a) => editarItem(a, b.id, i.id, { minutos: Number(e.target.value) || 0 }))}
                  aria-label={'Minutos de ' + i.nome}
                  style={{ ...S.input, width: 60, minHeight: 34, textAlign: 'center', fontSize: '14px' }} />
                <Mini T={T} label="Subir" onClick={() => editar((a) => moverItem(a, b.id, i.id, -1))}>▲</Mini>
                <Mini T={T} label="Baixar" onClick={() => editar((a) => moverItem(a, b.id, i.id, 1))}>▼</Mini>
                <Mini T={T} label={'Quitar ' + i.nome} cor={T.danger}
                  onClick={() => editar((a) => quitarItem(a, b.id, i.id))}>✕</Mini>
              </div>
            ))}

            <button onClick={() => { setEscollendo(escollendo === b.id ? null : b.id); setBusca(''); }}
              style={{ ...S.btn(T.bg3, T.text2), marginTop: '0.45rem', fontSize: '0.76rem', minHeight: 36 }}>
              {escollendo === b.id ? '✕ Pechar' : '+ Engadir dinámica'}
            </button>

            {escollendo === b.id && (
              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem',
                borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: T.border }}>
                <input value={busca} onChange={(e) => setBusca(e.target.value)}
                  placeholder={b.tipoId ? `Buscar en ${tipoNome}…` : 'Buscar en todas…'}
                  aria-label="Buscar dinámica"
                  style={{ ...S.input, width: '100%', marginBottom: '0.4rem' }} />
                {!candidatas.length && (
                  <p style={{ ...TYPE.caption, color: T.text4, margin: 0 }}>
                    {dinamicas.length
                      ? 'Ningunha dinámica deste tipo coincide.'
                      : 'A Guía non cargou: non se poden escoller dinámicas.'}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxHeight: 190, overflowY: 'auto' }}>
                  {candidatas.map((d) => (
                    <button key={d.id}
                      onClick={() => { editar((a) => engadirItem(a, b.id, crearItem(d))); }}
                      style={{ ...S.btn(T.bg3, T.text2), minHeight: 34, fontSize: '0.74rem' }}>
                      + {d.nombre} <span style={{ color: T.text4 }}>{d.duracion}′</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button onClick={() => editar((a) => engadirBloque(a, crearBloque({ tipoId: tipos[0]?.id || null })))}
        style={{ ...S.btn(T.bg3, T.text), width: '100%' }}>
        + Engadir bloque
      </button>
    </div>
  );
}

function Mini({ T, children, onClick, label, cor }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      style={{
        width: 28, height: 28, padding: 0, borderRadius: 7, background: T.bg4,
        borderStyle: 'solid', borderWidth: 1, borderColor: T.border,
        color: cor || T.text3, fontSize: '0.66rem', cursor: 'pointer', flexShrink: 0,
      }}>{children}</button>
  );
}
