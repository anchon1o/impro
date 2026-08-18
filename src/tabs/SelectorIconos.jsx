// ═══════════════════════════════════════════════════════════════════
// AXUSTES · estilo dos iconos
// ═══════════════════════════════════════════════════════════════════
// ⚠️ Só se poden escoller os estilos COMPLETOS. Un estilo ao 11 % faría
// un menú con dous iconos dun estilo e nove doutro, que é peor que non
// ter selector. Os incompletos amósanse coa súa cobertura real e a súa
// mostra, para poder decidir cal encargar enteiro.
//
// En canto un estilo teña os 18 iconos, faise seleccionable só: a
// cobertura calcúlase, non se declara a man.

import { useState, useEffect } from 'react';
import { useTheme, mkS } from '../core.jsx';
import {
  Icona, ESTILOS, ICONOS_NECESARIOS, estiloActual, setEstilo, subscribirEstilo,
} from '../iconos.jsx';

// Mostra: catro áreas que se ven na botonera, para xulgar de verdade.
const MOSTRA = ['generar', 'sonido', 'guia', 'reto'];

export function SelectorIconos() {
  const { T } = useTheme();
  const S = mkS(T);
  const [activo, setActivo] = useState(estiloActual());

  useEffect(() => subscribirEstilo(setActivo), []);

  const completos = ESTILOS.filter((e) => e.completo);
  const parciais = ESTILOS.filter((e) => !e.completo)
    .sort((a, b) => b.ten - a.ten);

  return (
    <div>
      <p style={{ ...S.caption, marginTop: 0, marginBottom: '0.9rem' }}>
        Os iconos toman a cor do tema. Cambiar de estilo non cambia as cores.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {completos.map((e) => (
          <Fila key={e.id} T={T} S={S} e={e} activo={activo === e.id}
            onEscoller={() => setEstilo(e.id)} />
        ))}
      </div>

      {parciais.length > 0 && (
        <>
          <h3 style={{ ...S.t.label, color: T.text3, margin: '1.4rem 0 0.3rem' }}>
            En preparación
          </h3>
          <p style={{ ...S.t.caption, color: T.text4, margin: '0 0 0.7rem' }}>
            Estes estilos aínda non teñen os {ICONOS_NECESARIOS.length} iconos que
            usa a app, así que non se poden activar: o menú quedaría a medias.
            Velos aquí serve para decidir cal encargar completo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {parciais.map((e) => (
              <Fila key={e.id} T={T} S={S} e={e} activo={false} bloqueado />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Fila({ T, S, e, activo, bloqueado, onEscoller }) {
  const cores = [T.accent, T.ok, T.info, T.warn];
  return (
    <button
      onClick={bloqueado ? undefined : onEscoller}
      disabled={bloqueado}
      aria-pressed={activo}
      aria-label={e.nome + (bloqueado ? ` · incompleto, ${e.ten} de ${e.de}` : '')}
      style={{
        background: activo ? T.accent + '14' : T.bg2,
        // B24: sen abreviatura `border`, que reinicia os catro lados ao
        // cambiar de tema e leva por diante a cor.
        borderStyle: 'solid', borderWidth: 1.5,
        borderColor: activo ? T.accent : T.border,
        borderRadius: 12,
        padding: '0.7rem 0.8rem',
        cursor: bloqueado ? 'default' : 'pointer',
        opacity: bloqueado ? 0.55 : 1,
        textAlign: 'left', fontFamily: 'inherit', width: '100%',
        display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap',
      }}
    >
      <span style={{ display: 'flex', gap: '0.55rem', flexShrink: 0 }}>
        {MOSTRA.map((n, i) => (
          <Icona key={n} nome={n} size={26} cor={cores[i % cores.length]} estilo={e.id} />
        ))}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ ...S.t.bodySm, color: T.text, fontWeight: 650, display: 'block' }}>
          {e.nome}
        </span>
        <span style={{ ...S.t.caption, color: bloqueado ? T.warn : T.text4 }}>
          {bloqueado ? `${e.ten} de ${e.de} iconos` : 'completo'}
        </span>
      </span>
      {activo && (
        <span style={{ ...S.t.caption, color: T.accent, fontWeight: 700 }}>Activo</span>
      )}
    </button>
  );
}
