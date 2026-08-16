// ═══════════════════════════════════════════════════════════════════
// SONIDO · pestana
// ═══════════════════════════════════════════════════════════════════
// Separa a carga de datos da mesa: `Sonido.jsx` é presentación pura e
// non sabe de onde veñen os recursos. Así a mesa pódese probar cunha
// lista inventada, e esta capa pódese cambiar sen tocala.
//
// ⚠️ Sen catálogo de reserva no código. Se non hai recursos, dise; non
// se inventan. É a lección de A04: un fallback agocha o fallo real.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme, mkS } from '../core.jsx';
import { getRecursos } from './recursos.js';
import { Sonido } from './Sonido.jsx';

// Extensións que Safari de iOS reproduce sen problema. `.ogg` non entra
// a propósito: en iOS non soa e o fallo sería silencioso.
const ACEPTA = 'audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-m4a,.mp3,.m4a,.wav,.aac';

function tipoPorNome(nome) {
  const n = nome.toLowerCase();
  if (/(choiva|lluvia|rain|vento|wind|ambiente|fondo|loop|bosque|mar)/.test(n)) return 'ambiente';
  if (/(cancion|canción|tema|music|musica|música|song)/.test(n)) return 'musica';
  return 'efecto';
}

export function TabSonido() {
  const { T } = useTheme();
  const S = mkS(T);
  const [daBd, setDaBd] = useState([]);
  const [motivo, setMotivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [locais, setLocais] = useState([]);
  const [modoFuncion, setModoFuncion] = useState(false);
  const inputRef = useRef(null);
  // As URLs de obxecto hai que liberalas: se non, os ficheiros quedan
  // en memoria mentres viva a pestana.
  const urls = useRef([]);

  useEffect(() => {
    let vivo = true;
    getRecursos().then((r) => {
      if (!vivo) return;
      setDaBd(r);
      setMotivo(r.motivo);
      setCargando(false);
    });
    return () => { vivo = false; };
  }, []);

  useEffect(() => () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const engadirFicheiros = useCallback((lista) => {
    const novos = [];
    for (const f of lista) {
      const url = URL.createObjectURL(f);
      urls.current.push(url);
      const nome = f.name.replace(/\.[^.]+$/, '');
      const tipo = tipoPorNome(nome);
      novos.push({
        id: 'local-' + url,
        tipo,
        nome,
        url,
        vol: tipo === 'ambiente' ? 0.35 : 0.8,
        modo: tipo === 'efecto' ? 'once' : 'loop',
        emoji: tipo === 'musica' ? '🎵' : tipo === 'ambiente' ? '🌧' : '⚡',
        orixe: 'dispositivo',
      });
    }
    setLocais((l) => [...l, ...novos]);
  }, []);

  const recursos = [...daBd, ...locais];
  const baleiro = !cargando && recursos.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>

      {!modoFuncion && (
        <div style={{
          display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap',
        }}>
          <button onClick={() => inputRef.current && inputRef.current.click()}
            style={S.btn(T.bg3, T.text)}>
            ＋ Engadir sons do dispositivo
          </button>
          <input ref={inputRef} type="file" accept={ACEPTA} multiple
            onChange={(e) => { engadirFicheiros(e.target.files); e.target.value = ''; }}
            style={{ display: 'none' }} aria-label="Engadir sons" />
          {locais.length > 0 && (
            <span style={{ ...S.t.caption, color: T.text4 }}>
              {locais.length} {locais.length === 1 ? 'son local' : 'sons locais'} · só nesta sesión
            </span>
          )}
          <div style={{ flex: 1 }} />
          {recursos.length > 0 && (
            <button onClick={() => setModoFuncion(true)} style={S.btn(T.accent)}>
              🎬 Modo función
            </button>
          )}
        </div>
      )}

      {/* Estado honesto: distínguese cargando, baleiro e sen conexión. */}
      {cargando && (
        <p style={{ ...S.t.caption, color: T.text4, margin: 0 }}>Cargando sons…</p>
      )}

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
              ? 'Sen conexión coa base de datos. Mentres tanto podes engadir sons do teu dispositivo: funcionan sen rede.'
              : 'A táboa son_recursos está baleira. Engade sons do teu dispositivo para probar a mesa, ou crea recursos desde Admin cando estea listo.'}
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
