// ═══════════════════════════════════════════════════════════════════
// SONIDO · pestana
// ═══════════════════════════════════════════════════════════════════
// Separa a carga de datos da mesa: `Sonido.jsx` é presentación pura e
// non sabe de onde veñen os recursos.
//
// Dúas fontes:
//   1. Supabase (`son_recursos`) — o catálogo compartido.
//   2. IndexedDB — os ficheiros do propio dispositivo. Non se perden ao
//      recargar e funcionan SEN REDE, que é o que fai que a mesa siga
//      valendo nun local con mal wifi (risco R2).
//
// ⚠️ Sen catálogo de reserva no código. Se non hai recursos, dise; non
// se inventan. É a lección de A04: un fallback agocha o fallo real.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme, mkS } from '../core.jsx';
import { getRecursos } from './recursos.js';
import {
  dispoñible, gardarFicheiro, listarFicheiros, borrarFicheiro,
  actualizarMeta, estimar, formatarBytes,
} from '../audio/almacen.js';
import { Sonido } from './Sonido.jsx';

// Formatos que Safari de iOS reproduce. `.ogg` queda fóra a propósito:
// en iOS non soa, e o fallo sería silencioso.
const ACEPTA = 'audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-m4a,.mp3,.m4a,.wav,.aac';

const EMOJI = { musica: '🎵', ambiente: '🌧', efecto: '⚡' };

// Adiviñar polo nome acerta a miúdo e falla ás veces. Por iso o tipo
// pódese cambiar despois sen ter que volver importar o ficheiro.
function tipoPorNome(nome) {
  const n = nome.toLowerCase();
  if (/(choiva|lluvia|rain|vento|wind|ambiente|fondo|loop|bosque|mar|fogo|lareira|multitude)/.test(n)) return 'ambiente';
  if (/(cancion|canción|tema|music|musica|música|song|banda|bso)/.test(n)) return 'musica';
  return 'efecto';
}

export function TabSonido() {
  const { T } = useTheme();
  const S = mkS(T);
  const [daBd, setDaBd] = useState([]);
  const [motivo, setMotivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [locais, setLocais] = useState([]);
  const [espazo, setEspazo] = useState(null);
  const [xestor, setXestor] = useState(false);
  const [erroLocal, setErroLocal] = useState(null);
  const [modoFuncion, setModoFuncion] = useState(false);
  const inputRef = useRef(null);
  const urls = useRef([]);

  const recargarLocais = useCallback(async () => {
    if (!dispoñible()) { setErroLocal('Este navegador non garda ficheiros localmente.'); return; }
    try {
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      urls.current = [];
      const lista = await listarFicheiros();
      lista.forEach((r) => urls.current.push(r.url));
      setLocais(lista);
      setErroLocal(null);
      setEspazo(await estimar());
    } catch (e) {
      setErroLocal('Non se puideron ler os sons gardados: ' + (e.message || e));
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    getRecursos().then((r) => {
      if (!vivo) return;
      setDaBd(r); setMotivo(r.motivo); setCargando(false);
    });
    recargarLocais();
    return () => { vivo = false; };
  }, [recargarLocais]);

  // Liberar as URLs de obxecto ao saír: se non, os ficheiros quedan en
  // memoria mentres viva a pestana.
  useEffect(() => () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const engadirFicheiros = useCallback(async (lista) => {
    try {
      for (const f of lista) {
        const nome = f.name.replace(/\.[^.]+$/, '');
        const tipo = tipoPorNome(nome);
        await gardarFicheiro(f, {
          nome, tipo, emoji: EMOJI[tipo],
          vol: tipo === 'ambiente' ? 0.35 : 0.8,
          modo: tipo === 'efecto' ? 'once' : 'loop',
        });
      }
      await recargarLocais();
    } catch (e) {
      // A cota chea é o caso realista, e ten que dicirse: se non, o
      // usuario pensaría que o ficheiro quedou gardado.
      setErroLocal('Non se puido gardar: ' + (e.message || e)
        + '. Se o dispositivo anda xusto de espazo, borra algún son.');
    }
  }, [recargarLocais]);

  const cambiarTipo = useCallback(async (id, tipo) => {
    await actualizarMeta(id, {
      tipo, emoji: EMOJI[tipo],
      vol: tipo === 'ambiente' ? 0.35 : 0.8,
      modo: tipo === 'efecto' ? 'once' : 'loop',
    });
    await recargarLocais();
  }, [recargarLocais]);

  const renomear = useCallback(async (id, nome) => {
    await actualizarMeta(id, { nome: nome.trim() || 'Sen nome' });
    await recargarLocais();
  }, [recargarLocais]);

  const borrar = useCallback(async (id) => {
    await borrarFicheiro(id);
    await recargarLocais();
  }, [recargarLocais]);

  const recursos = [...daBd, ...locais];
  const baleiro = !cargando && recursos.length === 0;
  const bytes = locais.reduce((n, r) => n + (r.bytes || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>

      {!modoFuncion && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => inputRef.current && inputRef.current.click()}
            style={S.btn(T.bg3, T.text)}>
            ＋ Engadir sons
          </button>
          <input ref={inputRef} type="file" accept={ACEPTA} multiple
            onChange={(e) => { engadirFicheiros(e.target.files); e.target.value = ''; }}
            style={{ display: 'none' }} aria-label="Engadir sons" />

          {locais.length > 0 && (
            <button onClick={() => setXestor((v) => !v)} style={S.btn(T.bg3, T.text2)}>
              {xestor ? '✓ Feito' : `🗂 ${locais.length} no dispositivo · ${formatarBytes(bytes)}`}
            </button>
          )}

          <div style={{ flex: 1 }} />
          {recursos.length > 0 && (
            <button onClick={() => setModoFuncion(true)} style={S.btn(T.accent)}>
              🎬 Modo función
            </button>
          )}
        </div>
      )}

      {erroLocal && (
        <p style={{ ...S.t.caption, color: T.danger, margin: 0 }}>{erroLocal}</p>
      )}

      {/* Xestor dos sons locais: renomear, cambiar tipo, borrar. */}
      {xestor && !modoFuncion && (
        <section style={{
          background: T.bg2, borderStyle: 'solid', borderWidth: 1.5, borderColor: T.border,
          borderRadius: 14, padding: '0.75rem',
        }}>
          <p style={{ ...S.t.caption, color: T.text3, margin: '0 0 0.6rem' }}>
            Estes sons viven só neste dispositivo e non se envían a ningures.
            Non son unha copia de seguridade: se borras os datos do navegador, márchanse.
            {espazo && espazo.cota
              ? ` Levas ${formatarBytes(espazo.usado)} de ${formatarBytes(espazo.cota)}.`
              : ''}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {locais.map((r) => (
              <div key={r.id} style={{
                display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap',
                paddingBottom: '0.4rem',
                borderBottomStyle: 'solid', borderBottomWidth: 1, borderBottomColor: T.border,
              }}>
                <span style={{ fontSize: '1.1rem' }}>{r.emoji || '🔊'}</span>
                <input defaultValue={r.nome}
                  onBlur={(e) => { if (e.target.value !== r.nome) renomear(r.id, e.target.value); }}
                  aria-label={'Nome de ' + r.nome}
                  style={{ ...S.input, flex: '2 1 140px', width: 'auto', minHeight: 40 }} />
                <select value={r.tipo} onChange={(e) => cambiarTipo(r.id, e.target.value)}
                  aria-label={'Tipo de ' + r.nome}
                  style={{ ...S.input, flex: '1 1 108px', width: 'auto', minHeight: 40 }}>
                  <option value="efecto">Efecto</option>
                  <option value="ambiente">Ambiente</option>
                  <option value="musica">Música</option>
                </select>
                <span style={{ ...S.t.caption, color: T.text4, minWidth: 54, textAlign: 'right' }}>
                  {formatarBytes(r.bytes)}
                </span>
                <button onClick={() => borrar(r.id)} aria-label={'Eliminar ' + r.nome}
                  style={{
                    width: 38, height: 38, borderRadius: 8, background: T.bg4,
                    borderStyle: 'solid', borderWidth: 1, borderColor: T.border,
                    color: T.danger, cursor: 'pointer', fontSize: '0.85rem',
                  }}>✕</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {cargando && (
        <p style={{ ...S.t.caption, color: T.text4, margin: 0 }}>Cargando sons…</p>
      )}

      {/* Estado honesto: distínguese cargando, baleiro e sen conexión. */}
      {baleiro && (
        <div style={{
          background: (motivo === 'sen-conexion' ? T.danger : T.warn) + '12',
          borderStyle: 'solid', borderWidth: 1.5,
          borderColor: (motivo === 'sen-conexion' ? T.danger : T.warn) + '55',
          borderRadius: 14, padding: '0.9rem',
        }}>
          <p style={{ ...S.t.bodySm, color: T.text, margin: '0 0 0.3rem', fontWeight: 650 }}>
            {motivo === 'sen-conexion' ? 'Non se puideron cargar os sons' : 'Aínda non hai sons'}
          </p>
          <p style={{ ...S.t.caption, color: T.text3, margin: 0 }}>
            {motivo === 'sen-conexion'
              ? 'Sen conexión coa base de datos. Podes engadir sons do teu dispositivo: gárdanse aquí e funcionan sen rede.'
              : 'Engade sons co botón de arriba. Gárdanse neste dispositivo, non se perden ao recargar e funcionan sen rede.'}
          </p>
        </div>
      )}

      <Sonido
        recursos={recursos}
        modoFuncion={modoFuncion}
        onSairFuncion={() => setModoFuncion(false)}
      />
    </div>
  );
}
