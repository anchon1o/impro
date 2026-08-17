// ═══════════════════════════════════════════════════════════════════
// ADMIN · táboa masiva de sons
// ═══════════════════════════════════════════════════════════════════
// Mesmo patrón que Admin → Dinámicas → 🧮 Táboa e que a táboa de
// Universo: folla de cálculo, edición en liña, gardado en lote.
//
// O caso que resolve: tes cincuenta URLs nunha folla de cálculo e
// metelas de unha en unha por un formulario é inviable. Aquí péganse
// de golpe.
//
// ⚠️ `licenza` está a propósito na táboa e non agochada nun avanzado.
// En canto se publican sons de terceiros, de onde saíu cada ficheiro
// deixa de ser un detalle, e non se pode reconstruír despois.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useTheme, mkS, useAuth, UID } from '../core.jsx';
import {
  getRecursos, gardarLoteRecursos, borrarRecurso,
  validarRecurso, analizarPegado, nomeDesdeUrl,
} from './recursos.js';

const COLS = [
  { id: 'nome', label: 'Nome', min: 150, obrig: true },
  { id: 'tipo', label: 'Tipo', min: 100, lista: ['efecto', 'ambiente', 'musica'] },
  { id: 'url', label: 'URL', min: 260, obrig: true },
  { id: 'emoji', label: '·', min: 46 },
  { id: 'modo', label: 'Modo', min: 92, lista: ['once', 'toggle', 'loop', 'hold'] },
  { id: 'vol', label: 'Vol', min: 60, numero: true },
  { id: 'licenza', label: 'Licenza', min: 120 },
  { id: 'autoria', label: 'Autoría', min: 130 },
  { id: 'fonte', label: 'Fonte', min: 150 },
  { id: 'visibilidade', label: 'Ver', min: 110, lista: ['privado', 'ligazon', 'publico'] },
  { id: 'estado', label: 'Estado', min: 110, lista: ['borrador', 'pendente', 'publicada', 'oculta'] },
];

const ORDE_PEGADO = ['nome', 'url', 'tipo', 'emoji', 'licenza', 'autoria', 'fonte'];

const filaBaleira = () => ({
  id: 'nova-' + UID(), nome: '', tipo: 'efecto', url: '', emoji: '',
  modo: 'once', vol: 0.8, licenza: '', autoria: '', fonte: '',
  visibilidade: 'privado', estado: 'borrador', _k: UID(),
});

export function AdminSonidos({ T: Tp, S: Sp }) {
  const tema = useTheme();
  const T = Tp || tema.T;
  const S = Sp || mkS(T);
  const { perfil } = useAuth();
  const [filas, setFilas] = useState([]);
  const [orixinais, setOrixinais] = useState({});
  const [cargando, setCargando] = useState(true);
  const [gardando, setGardando] = useState(false);
  const [msg, setMsg] = useState('');
  const [erros, setErros] = useState([]);
  const [pegado, setPegado] = useState('');
  const [verPegar, setVerPegar] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    getRecursos().then((d) => {
      const lista = d.map((x) => ({ ...x, _k: x.id || UID() }));
      setFilas(lista);
      setOrixinais(Object.fromEntries(lista.map((f) => [f._k, JSON.stringify(f)])));
      setCargando(false);
      if (d.motivo === 'sen-conexion') setMsg('Sen conexión: isto é a última copia local.');
    });
  }, []);

  useEffect(cargar, [cargar]);

  const editar = (k, campo, valor) => {
    setFilas((fs) => fs.map((f) => {
      if (f._k !== k) return f;
      const n = { ...f, [campo]: valor };
      // Pegar unha URL nunha fila baleira dálle nome soa: é o que se
      // quere o 90 % das veces e aforra escribilo.
      if (campo === 'url' && !f.nome && /^https?:\/\//i.test(valor)) n.nome = nomeDesdeUrl(valor);
      return n;
    }));
  };

  const cambiadas = filas.filter((f) => orixinais[f._k] !== JSON.stringify(f));
  const invalidas = filas.map((f) => ({ f, e: validarRecurso(f) })).filter((x) => x.e);

  const pegar = () => {
    const novas = analizarPegado(pegado, ORDE_PEGADO).map((p) => ({
      ...filaBaleira(),
      ...p,
      nome: p.nome || (p.url ? nomeDesdeUrl(p.url) : ''),
      tipo: ['efecto', 'ambiente', 'musica'].includes(p.tipo) ? p.tipo : 'efecto',
      orixe: 'externo',
    }));
    if (!novas.length) { setMsg('Non se recoñeceu ningunha fila.'); return; }
    setFilas((fs) => [...novas, ...fs]);
    setPegado('');
    setVerPegar(false);
    setMsg(`${novas.length} filas engadidas. Revísaas e garda.`);
  };

  const gardar = async () => {
    if (!cambiadas.length) { setMsg('Non hai cambios.'); return; }
    setGardando(true); setErros([]);
    const r = await gardarLoteRecursos(cambiadas, perfil ? perfil.id : null);
    setGardando(false);
    setErros(r.erros);
    setMsg(`${r.creados} creados · ${r.gardados} actualizados`
      + (r.erros.length ? ` · ${r.erros.length} con erro` : ''));
    if (r.creados || r.gardados) cargar();
  };

  const eliminar = async (f) => {
    if (String(f.id).startsWith('nova-')) {
      setFilas((fs) => fs.filter((x) => x._k !== f._k));
      return;
    }
    const r = await borrarRecurso(f.id);
    if (r.ok) cargar(); else setMsg('Non se puido borrar: ' + r.erro);
  };

  if (cargando) return <p style={{ ...S.t.caption, color: T.text4 }}>Cargando sons…</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.7rem' }}>
        <button onClick={() => setVerPegar((v) => !v)} style={S.btn(T.bg3, T.text)}>
          📋 Pegar dunha folla
        </button>
        <button onClick={() => setFilas((fs) => [filaBaleira(), ...fs])} style={S.btn(T.bg3, T.text)}>
          ＋ Fila
        </button>
        <div style={{ flex: 1 }} />
        {invalidas.length > 0 && (
          <span style={{ ...S.t.caption, color: T.warn, alignSelf: 'center' }}>
            {invalidas.length} sen completar
          </span>
        )}
        <button onClick={gardar} disabled={gardando || !cambiadas.length}
          style={{ ...S.btn(cambiadas.length ? T.accent : T.bg3, cambiadas.length ? '#fff' : T.text4) }}>
          {gardando ? 'Gardando…' : `💾 Gardar (${cambiadas.length})`}
        </button>
      </div>

      {verPegar && (
        <div style={{
          background: T.bg2, borderStyle: 'solid', borderWidth: 1.5, borderColor: T.border,
          borderRadius: 12, padding: '0.75rem', marginBottom: '0.7rem',
        }}>
          <p style={{ ...S.t.caption, color: T.text3, margin: '0 0 0.5rem' }}>
            Unha fila por son. Columnas separadas por <b>tabulador</b> (é o que
            copia calquera folla de cálculo) ou por <b>punto e coma</b>:
            <br />
            <code style={{ ...S.t.numeric, fontSize: '0.7rem', color: T.text2 }}>
              nome · url · tipo · emoji · licenza · autoría · fonte
            </code>
            <br />
            Tamén podes pegar só unha lista de URLs: o nome sácase do ficheiro.
          </p>
          <textarea value={pegado} onChange={(e) => setPegado(e.target.value)}
            aria-label="Filas para pegar"
            style={{
              ...S.input, width: '100%', minHeight: 130, fontFamily: 'inherit',
              resize: 'vertical',
            }} />
          <button onClick={pegar} style={{ ...S.btn(T.accent), marginTop: '0.5rem' }}>
            Engadir filas
          </button>
        </div>
      )}

      {msg && <p style={{ ...S.t.caption, color: T.info, margin: '0 0 0.5rem' }}>{msg}</p>}

      {erros.length > 0 && (
        <div style={{
          background: T.danger + '12', borderStyle: 'solid', borderWidth: 1.5,
          borderColor: T.danger + '55', borderRadius: 10, padding: '0.6rem', marginBottom: '0.6rem',
        }}>
          {erros.map((e, i) => (
            <p key={i} style={{ ...S.t.caption, color: T.text2, margin: 0 }}>
              <b>{e.nome}</b>: {e.msg}
            </p>
          ))}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.id} style={{
                  ...S.t.caption, color: T.text3, textAlign: 'left', padding: '0.3rem 0.4rem',
                  minWidth: c.min, whiteSpace: 'nowrap',
                  borderBottomStyle: 'solid', borderBottomWidth: 1.5, borderBottomColor: T.border,
                }}>{c.label}{c.obrig ? ' *' : ''}</th>
              ))}
              <th style={{ width: 40, borderBottomStyle: 'solid', borderBottomWidth: 1.5, borderBottomColor: T.border }} />
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const e = validarRecurso(f);
              return (
                <tr key={f._k} style={{ background: e ? T.warn + '10' : 'transparent' }}>
                  {COLS.map((c) => (
                    <td key={c.id} style={{
                      padding: '0.15rem 0.2rem',
                      borderBottomStyle: 'solid', borderBottomWidth: 1, borderBottomColor: T.border,
                    }}>
                      {c.lista ? (
                        <select value={f[c.id] || c.lista[0]}
                          onChange={(ev) => editar(f._k, c.id, ev.target.value)}
                          aria-label={c.label}
                          style={{ ...S.input, width: '100%', minHeight: 36, padding: '0.25rem' }}>
                          {c.lista.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input value={f[c.id] ?? ''}
                          onChange={(ev) => editar(f._k, c.id,
                            c.numero ? Math.min(1, Math.max(0, Number(ev.target.value) || 0)) : ev.target.value)}
                          aria-label={c.label}
                          style={{ ...S.input, width: '100%', minHeight: 36, padding: '0.25rem 0.4rem' }} />
                      )}
                    </td>
                  ))}
                  <td style={{ borderBottomStyle: 'solid', borderBottomWidth: 1, borderBottomColor: T.border }}>
                    <button onClick={() => eliminar(f)} aria-label={'Eliminar ' + (f.nome || 'fila')}
                      style={{
                        width: 32, height: 32, borderRadius: 7, background: T.bg4,
                        borderStyle: 'solid', borderWidth: 1, borderColor: T.border,
                        color: T.danger, cursor: 'pointer', fontSize: '0.8rem',
                      }}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!filas.length && (
        <p style={{ ...S.t.caption, color: T.text4, padding: '1.5rem 0', textAlign: 'center' }}>
          Sen sons na base de datos. Pega unha folla ou engade unha fila.
        </p>
      )}
    </div>
  );
}
