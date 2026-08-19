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
import { useTheme, mkS, useAuth } from '../core.jsx';
import { getRecursos } from './recursos.js';
import {
  dispoñible, gardarFicheiro, listarFicheiros, borrarFicheiro,
  actualizarMeta, estimar, formatarBytes,
} from '../audio/almacen.js';
import { cargarMesas, gardarMesaNomeada, borrarMesaLocal, mesaBaleira, resolverMesa } from './mesas.js';
import { cargarEscenas, gardarEscena, borrarEscenaLocal } from './escenas.js';
import { cargarPlaylists, gardarPlaylist, borrarPlaylistLocal, playlistBaleira } from './playlists.js';
import { Explorar } from './Explorar.jsx';
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
  const { perfil } = useAuth();
  const userId = perfil ? perfil.id : null;
  const [daBd, setDaBd] = useState([]);
  const [motivo, setMotivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [locais, setLocais] = useState([]);
  const [espazo, setEspazo] = useState(null);
  const [xestor, setXestor] = useState(false);
  const [erroLocal, setErroLocal] = useState(null);
  const [modoFuncion, setModoFuncion] = useState(false);

  // Modo función pide a pantalla enteira. Avísase por evento porque a
  // cabeceira vive tres niveis por riba.
  // ⚠️ A limpeza é obrigatoria: se se sae da pestana en modo función
  // sen avisar, a cabeceira quedaría oculta no resto da app e non
  // habería como recuperala.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('impro:pantallaChea', { detail: modoFuncion }));
    return () => window.dispatchEvent(new CustomEvent('impro:pantallaChea', { detail: false }));
  }, [modoFuncion]);
  const inputRef = useRef(null);
  const urls = useRef([]);
  const [mesas, setMesas] = useState([]);
  const [mesaActiva, setMesaActiva] = useState(null);
  const [editandoMesa, setEditandoMesa] = useState(false);
  const [nomeMesa, setNomeMesa] = useState('');
  const [avisoMesa, setAvisoMesa] = useState(null);
  const [escenas, setEscenas] = useState([]);
  const [listas, setListas] = useState([]);
  const [listaId, setListaId] = useState(null);
  const [vista, setVista] = useState('mesa');
  const [probando, setProbando] = useState([]);

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
    cargarMesas(userId).then((r) => { if (vivo) setMesas(r.mesas); });
    cargarEscenas(userId).then((r) => { if (vivo) setEscenas(r.escenas); });
    cargarPlaylists(userId).then((r) => { if (vivo) setListas(r.playlists); });
    return () => { vivo = false; };
  }, [recargarLocais, userId]);

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

  // Un son que veñas de probar desde Explorar súmase á mesa desta
  // sesión. Non se garda: probar non pode ensuciar a túa biblioteca.
  const todos = [...daBd, ...locais, ...probando];
  // Sen mesa activa vese todo o catálogo; cunha mesa, só o que ela trae.
  const { recursos, faltan } = resolverMesa(mesaActiva, todos);
  const baleiro = !cargando && todos.length === 0;
  const bytes = locais.reduce((n, r) => n + (r.bytes || 0), 0);

  const listaActiva = listas.find((l) => l.id === listaId) || null;

  // Os cambios da lista quedan en memoria ata que se garda: editar unha
  // orde de pistas no medio dunha función non debe escribir na base a
  // cada movemento.
  const onCambiarLista = useCallback((nova) => {
    setListas((ls) => ls.map((l) => (l.id === nova.id ? nova : l)));
  }, []);

  const onGardarLista = useCallback(async (nomeNovo) => {
    const pl = nomeNovo ? { ...playlistBaleira(nomeNovo) } : listaActiva;
    if (!pl) return;
    const g = await gardarPlaylist(pl, userId);
    if (!g.ok) return;
    const r2 = await cargarPlaylists(userId);
    setListas(r2.playlists);
    setListaId(g.playlist.id);
  }, [listaActiva, userId]);

  const onBorrarLista = useCallback(async (l) => {
    if (l.local) borrarPlaylistLocal(l.id);
    const r2 = await cargarPlaylists(userId);
    setListas(r2.playlists);
    setListaId(null);
  }, [userId]);

  const onGardarEscena = useCallback(async (e) => {
    const g = await gardarEscena(e, userId);
    if (!g.ok) return g;
    const r2 = await cargarEscenas(userId);
    setEscenas(r2.escenas);
    return g;
  }, [userId]);

  const onBorrarEscena = useCallback(async (e) => {
    if (e.local) borrarEscenaLocal(e.id);
    const r2 = await cargarEscenas(userId);
    setEscenas(r2.escenas);
  }, [userId]);

  const escollerMesa = useCallback((id) => {
    setMesaActiva(id ? mesas.find((m) => m.id === id) || null : null);
    setEditandoMesa(false);
    setAvisoMesa(null);
  }, [mesas]);

  const gardarComoMesa = useCallback(async () => {
    const nome = nomeMesa.trim();
    if (!nome) { setAvisoMesa('Ponlle un nome á mesa.'); return; }
    // Gárdanse os sons que hai diante agora mesmo. Se hai unha mesa
    // activa, iso é o seu contido; se non, o catálogo enteiro.
    const base = mesaActiva ? { ...mesaActiva, nome } : { ...mesaBaleira(nome) };
    base.recursoIds = recursos.map((r) => r.id);
    const g = await gardarMesaNomeada(base, userId);
    if (!g.ok) { setAvisoMesa(g.erro); return; }
    const r2 = await cargarMesas(userId);
    setMesas(r2.mesas);
    setMesaActiva(r2.mesas.find((m) => m.id === g.mesa.id) || g.mesa);
    setEditandoMesa(false);
    setNomeMesa('');
    setAvisoMesa(null);
  }, [nomeMesa, mesaActiva, recursos, userId]);

  const eliminarMesa = useCallback(async () => {
    if (!mesaActiva) return;
    if (mesaActiva.local) borrarMesaLocal(mesaActiva.id);
    const r2 = await cargarMesas(userId);
    setMesas(r2.mesas);
    setMesaActiva(null);
    setEditandoMesa(false);
    if (!mesaActiva.local) setAvisoMesa('As mesas da conta bórranse desde Admin, de momento.');
  }, [mesaActiva, userId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>

      {vista === 'explorar' && (
        <Explorar
          onVolver={() => setVista('mesa')}
          onProbar={(r) => {
            setProbando((p) => (p.find((x) => x.id === r.id) ? p : [...p, r]));
            setVista('mesa');
          }}
        />
      )}

      {vista === 'mesa' && !modoFuncion && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setVista('explorar')} style={S.btn(T.bg3, T.text)}>
            🔍 Explorar
          </button>
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

      {vista === 'mesa' && erroLocal && (
        <p style={{ ...S.t.caption, color: T.danger, margin: 0 }}>{erroLocal}</p>
      )}

      {/* ── Mesas ── */}
      {vista === 'mesa' && !modoFuncion && todos.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={mesaActiva ? mesaActiva.id : ''}
            onChange={(e) => escollerMesa(e.target.value)}
            aria-label="Mesa activa"
            style={{ ...S.input, width: 'auto', flex: '1 1 170px', minHeight: 44 }}>
            <option value="">Todos os sons ({todos.length})</option>
            {mesas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.nome} ({m.recursoIds.length}){m.local ? ' · local' : ''}
              </option>
            ))}
          </select>

          <button onClick={() => {
            setEditandoMesa((v) => !v);
            setNomeMesa(mesaActiva ? mesaActiva.nome : '');
          }} style={S.btn(T.bg3, T.text2)}>
            {editandoMesa ? '✕' : mesaActiva ? '✎ Mesa' : '💾 Gardar mesa'}
          </button>

          {mesaActiva && (
            <button onClick={eliminarMesa} aria-label="Eliminar mesa"
              style={{ ...S.btn(T.bg4, T.danger), minWidth: 44 }}>🗑</button>
          )}
        </div>
      )}

      {vista === 'mesa' && editandoMesa && !modoFuncion && (
        <div style={{
          background: T.bg2, borderStyle: 'solid', borderWidth: 1.5, borderColor: T.border,
          borderRadius: 14, padding: '0.75rem',
        }}>
          <p style={{ ...S.t.caption, color: T.text3, margin: '0 0 0.5rem' }}>
            Gárdanse os {recursos.length} sons que tes diante agora.
            {userId ? '' : ' Sen conta, a mesa queda neste dispositivo.'}
          </p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <input value={nomeMesa} onChange={(e) => setNomeMesa(e.target.value)}
              placeholder="Nome da mesa" aria-label="Nome da mesa"
              style={{ ...S.input, flex: '2 1 150px', width: 'auto' }} />
            <button onClick={gardarComoMesa} style={S.btn(T.accent)}>Gardar</button>
          </div>
        </div>
      )}

      {avisoMesa && (
        <p style={{ ...S.t.caption, color: T.warn, margin: 0 }}>{avisoMesa}</p>
      )}

      {/* Unha mesa que apunta a sons borrados non é un erro, é un oco. */}
      {faltan.length > 0 && (
        <p style={{ ...S.t.caption, color: T.warn, margin: 0 }}>
          {faltan.length === 1
            ? 'Un son desta mesa xa non está dispoñible.'
            : `${faltan.length} sons desta mesa xa non están dispoñibles.`}
          {' '}Puideron borrarse do dispositivo ou despublicarse.
        </p>
      )}

      {/* Xestor dos sons locais: renomear, cambiar tipo, borrar. */}
      {vista === 'mesa' && xestor && !modoFuncion && (
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

      {vista === 'mesa' && cargando && (
        <p style={{ ...S.t.caption, color: T.text4, margin: 0 }}>Cargando sons…</p>
      )}

      {/* Estado honesto: distínguese cargando, baleiro e sen conexión. */}
      {vista === 'mesa' && baleiro && (
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

      {vista === 'mesa' && <Sonido
        recursos={recursos}
        escenas={escenas}
        listas={listas}
        listaActiva={listaActiva}
        onEscollerLista={setListaId}
        onCambiarLista={onCambiarLista}
        onGardarLista={onGardarLista}
        onBorrarLista={onBorrarLista}
        onGardarEscena={onGardarEscena}
        onBorrarEscena={onBorrarEscena}
        modoFuncion={modoFuncion}
        onSairFuncion={() => setModoFuncion(false)}
      />}
    </div>
  );
}
