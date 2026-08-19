// ═══════════════════════════════════════════════════════════════════
// SELECTOR DE ESCALETA
// ═══════════════════════════════════════════════════════════════════
// Compartido por En directo e Son. Os dous IMPORTAN a escaleta; ningún
// dos dous a edita.
//
// ⚠️ O que se importa é unha INSTANTÁNEA para esta función. Marcar
// feito ou avanzar non reescribe a escaleta gardada en Sesións. Iso é o
// que evita ter dúas versións da mesma escaleta discrepando, que é o
// erro que xa cometemos con Reto e Guía (B16).
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useTheme, mkS, useAuth, TYPE } from '../core.jsx';
import { cargarEscaletas, resumo, paraDirecto, TIPOS_ESCALETA } from '../escaleta.js';

export function SelectorEscaleta({ onEscoller, onPechar, compacto }) {
  const { T } = useTheme();
  const S = mkS(T);
  const { perfil } = useAuth();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [motivo, setMotivo] = useState(null);

  useEffect(() => {
    let vivo = true;
    cargarEscaletas(perfil ? perfil.id : null).then((r) => {
      if (!vivo) return;
      setLista(r.escaletas); setMotivo(r.motivo); setCargando(false);
    });
    return () => { vivo = false; };
  }, [perfil]);

  return (
    <div style={{
      background: T.bg2, borderStyle: 'solid', borderWidth: 1.5, borderColor: T.border,
      borderRadius: 12, padding: '0.7rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ ...TYPE.label, color: T.text3 }}>Importar escaleta</span>
        <div style={{ flex: 1 }} />
        {onPechar && (
          <button onClick={onPechar} aria-label="Pechar"
            style={{ ...S.btn(T.bg3, T.text3), minHeight: 30, padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}>✕</button>
        )}
      </div>

      {cargando && <p style={{ ...TYPE.caption, color: T.text4, margin: 0 }}>Cargando…</p>}

      {!cargando && motivo === 'sen-conexion' && (
        <p style={{ ...TYPE.caption, color: T.warn, margin: '0 0 0.4rem' }}>
          Sen conexión: só as gardadas neste dispositivo.
        </p>
      )}

      {!cargando && !lista.length && (
        <p style={{ ...TYPE.caption, color: T.text4, margin: 0 }}>
          Non hai escaletas. Créaas en Sesións → Escaletas.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: compacto ? 160 : 260, overflowY: 'auto' }}>
        {lista.map((e) => {
          const r = resumo(e);
          return (
            <button key={e.id} onClick={() => onEscoller(e, paraDirecto(e))}
              aria-label={'Importar ' + e.nome}
              style={{
                background: T.bg3, borderStyle: 'solid', borderWidth: 1, borderColor: T.border,
                borderRadius: 9, padding: '0.5rem 0.6rem', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit', width: '100%',
              }}>
              <div style={{ color: T.text, fontWeight: 650, fontSize: '0.84rem' }}>{e.nome}</div>
              <div style={{ ...TYPE.caption, color: T.text4 }}>
                {(TIPOS_ESCALETA.find((t) => t.id === e.tipo) || {}).nome}
                {' · '}{r.minutos} min · {r.itens} dinámicas
                {e.notas ? ` · ${e.notas}` : ''}
              </div>
            </button>
          );
        })}
      </div>

      {!cargando && lista.length > 0 && (
        <p style={{ ...TYPE.caption, color: T.text4, margin: '0.5rem 0 0' }}>
          ⚠️ Impórtase unha copia para esta función. Marcar feito ou avanzar
          non cambia a escaleta gardada.
        </p>
      )}
    </div>
  );
}

// Converte a escaleta aplanada en actuacións do rundown de En directo.
// ⚠️ Só os ITENS, non os bloques: os bloques son a estrutura e non se
// «fan», fanse as dinámicas de dentro. Un bloque sen dinámicas si entra,
// porque un descanso si é algo que pasa na función.
export function aRundown(plano) {
  const fóra = [];
  for (const x of plano || []) {
    if (x.tipo === 'item') {
      fóra.push({ id: x.id, nombre: x.nome, activa: false, hecho: false, minutos: x.minutos });
    } else if (x.tipo === 'bloque' && !(plano || []).some((y) => y.bloqueId === x.id)) {
      fóra.push({ id: x.id, nombre: x.nome, activa: false, hecho: false, minutos: x.minutos });
    }
  }
  return fóra;
}
