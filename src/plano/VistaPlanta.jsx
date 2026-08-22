// ═══════════════════════════════════════════════════════════════════
// PLANO · vista de planta
// ═══════════════════════════════════════════════════════════════════
// ⚠️ RENDERIZADOR PURO. Sen estado, sen `useTheme`, sen manexadores de
// eventos propios. Recibe o plano, o momento, unha paleta e unhas
// unidades, e devolve SVG.
//
// Iso é o que fai que o mesmo compoñente sirva para tres cousas que
// doutro xeito serían tres implementacións que se desincronizan:
//   · o editor
//   · a miniatura da lista
//   · a exportación a PNG/SVG (PL1c)
//
// ⚠️ E É O QUE FAI POSIBLE EXPORTAR EN CLARO ESTANDO EN TEMA ESCURO.
// Se lese o tema por dentro, habería que cambiar o tema da app enteira
// para xerar unha imaxe.
//
// ⚠️ A capa de selección NON está aquí: vai por riba, no editor. Se os
// tiradores se debuxasen dentro, aparecerían na imaxe exportada.
// ═══════════════════════════════════════════════════════════════════

import {
  unidades, aUnidades, tamUnidades, liñasReixa, normalizarReixa,
  centroCela, etiquetaCela, num,
} from './xeometria.js';
import { cor, textoSobre } from './paleta.js';
import { colocacionDe, elementosDaCapa } from './modelo.js';
import { simbolo, FiguraPlanta } from './iconosPlano.jsx';

// ── Cotas ──────────────────────────────────────────────────────────
function Cotas({ escenario, u, paleta }) {
  const t = Math.max(11, u.W * 0.026);
  const g = u.W * 0.028;
  const fmt = (m) => `${num(m, 0).toFixed(2).replace('.', ',')} m`;
  const linea = { stroke: paleta.cota, strokeWidth: Math.max(1, u.W * 0.0016), fill: 'none' };
  return (
    <g pointerEvents="none">
      {/* Ancho, por riba */}
      <path d={`M0 ${-g} h${u.W}`} {...linea} />
      <path d={`M0 ${-g - 5} v10 M${u.W} ${-g - 5} v10`} {...linea} />
      <text x={u.W / 2} y={-g - 8} fill={paleta.cota} fontSize={t} fontFamily={paleta.fonte} textAnchor="middle">{fmt(escenario.anchoM)}</text>
      {/* Fondo, á dereita */}
      <path d={`M${u.W + g} 0 v${u.H}`} {...linea} />
      <path d={`M${u.W + g - 5} 0 h10 M${u.W + g - 5} ${u.H} h10`} {...linea} />
      <text
        x={u.W + g + 8} y={u.H / 2} fill={paleta.cota} fontSize={t}
        fontFamily={paleta.fonte} textAnchor="middle"
        transform={`rotate(90 ${u.W + g + 8} ${u.H / 2})`}
      >
        {fmt(escenario.fondoM)}
      </text>
    </g>
  );
}

// ── Reixa ──────────────────────────────────────────────────────────
function Reixa({ escenario, u, paleta }) {
  const R = normalizarReixa(escenario.reixa);
  if (!R.visible) return null;
  const L = liñasReixa(R);
  const gr = Math.max(0.8, u.W * 0.0014);
  const t = Math.max(10, u.W * 0.022);
  return (
    <g pointerEvents="none">
      {L.verticais.map((v) => <path key={`v${v}`} d={`M${v * u.W} 0 v${u.H}`} stroke={paleta.reixa} strokeWidth={gr} fill="none" />)}
      {L.horizontais.map((h) => <path key={`h${h}`} d={`M0 ${h * u.H} h${u.W}`} stroke={paleta.reixa} strokeWidth={gr} fill="none" />)}
      {R.numeracion !== 'nengunha' && Array.from({ length: R.cols * R.filas }, (_, i) => {
        const c = aUnidades(centroCela(i, R), u);
        // ⚠️ A etiqueta vai na ESQUINA da cela, non no centro: no
        // centro é onde se pon a xente, e o número quedaría debaixo
        // dun actor xusto na cela que máis se usa.
        return (
          <text
            key={i} x={c.x - (u.W / R.cols) * 0.36} y={c.y - (u.H / R.filas) * 0.30}
            fill={paleta.reixaTexto} fontSize={t} fontFamily={paleta.fonte}
            textAnchor="middle" dominantBaseline="middle"
          >
            {etiquetaCela(i, R.numeracion)}
          </text>
        );
      })}
    </g>
  );
}

// ── Un elemento ────────────────────────────────────────────────────
function Elemento({ el, c, u, paleta, seleccionado, onPointerDown }) {
  const p = aUnidades(c, u);
  const corEl = cor(paleta, el.cor);
  const s = tamUnidades(el.ancho, u);
  const manexo = onPointerDown ? { onPointerDown: (e) => onPointerDown(e, el.id), style: { cursor: el.bloqueado ? 'not-allowed' : 'grab' } } : { pointerEvents: 'none' };

  // ⚠️ `visible:false` non se debuxa, pero o elemento SEGUE existindo
  // no documento: é alguén que aínda non entrou ou que xa saíu, non
  // alguén borrado.
  if (!c.visible) return null;

  const foco = c.foco ? (
    <circle cx={0} cy={0} r={s * 1.5} fill={paleta.foco} opacity="0.16" />
  ) : null;

  if (el.tipo === 'actor') {
    const r = s / 2;
    const num1 = el.numero;
    return (
      <g transform={`translate(${p.x} ${p.y})`} {...manexo}>
        {foco}
        {/* A proa da mirada. Vai FÓRA do grupo xirado do corpo porque a
            postura pode cambiar a silueta e a mirada non depende dela. */}
        <g transform={`rotate(${c.mirada})`}>
          <path
            d={`M${r * 0.9} 0 L${r * 2.05} ${-r * 0.42} L${r * 2.05} ${r * 0.42} Z`}
            fill={corEl} opacity="0.9"
          />
        </g>
        <g color={corEl}><FiguraPlanta r={r} postura={c.postura} /></g>
        {typeof num1 === 'number' && (
          <text
            x={0} y={0} fill={textoSobre(corEl)} fontSize={r * 1.05} fontWeight="700"
            fontFamily={paleta.fonte} textAnchor="middle" dominantBaseline="central"
            pointerEvents="none"
          >
            {num1}
          </text>
        )}
        {el.nome && (
          <text
            x={0} y={r + Math.max(12, u.W * 0.03)} fill={paleta.texto}
            fontSize={Math.max(11, u.W * 0.024)} fontFamily={paleta.fonte}
            textAnchor="middle" pointerEvents="none"
          >
            {el.nome}
          </text>
        )}
        {seleccionado && <circle cx={0} cy={0} r={r * 1.62} fill="none" stroke={paleta.seleccion} strokeWidth={Math.max(1.5, u.W * 0.004)} strokeDasharray={`${r * 0.35} ${r * 0.26}`} />}
      </g>
    );
  }

  // Obxectos e técnicos: símbolo cenital escalado desde a caixa de 100.
  const sim = simbolo(el.simbolo);
  const k = s / 100;
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(${c.rotacion})`} {...manexo}>
      {foco}
      <g transform={`scale(${k}) translate(-50 -50)`} color={corEl}>{sim.d}</g>
      {el.nome && (
        <text
          x={0} y={s * 0.62 + Math.max(10, u.W * 0.026)} fill={paleta.textoTenue}
          fontSize={Math.max(10, u.W * 0.022)} fontFamily={paleta.fonte}
          textAnchor="middle" pointerEvents="none"
        >
          {el.nome}
        </text>
      )}
      {seleccionado && <rect x={-s * 0.62} y={-s * 0.62} width={s * 1.24} height={s * 1.24} rx={s * 0.1} fill="none" stroke={paleta.seleccion} strokeWidth={Math.max(1.5, u.W * 0.004)} strokeDasharray={`${s * 0.14} ${s * 0.1}`} />}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════

export function VistaPlanta({
  plano, momentoId, paleta, capa = 'escenico',
  seleccion = null, onPointerDownElemento = null, onPointerDownFondo = null,
  base = 1000, verOutraCapa = true, margeCotas = true,
}) {
  const u = unidades(plano.escenario, base);
  const cotas = plano.escenario.cotas && margeCotas;
  // Marxe para as cotas. Sen ela, a cota do ancho sae fóra da viewBox y
  // non se ve: é o típico «funciona pero falta a metade de arriba».
  const m = cotas ? u.W * 0.075 : u.W * 0.012;
  const vb = `${-m} ${-m} ${u.W + m * 2} ${u.H + m * 2}`;

  // ⚠️ Píntase primeiro a capa que NON está activa, e apagada. Vela
  // axuda a colocar —un micro colócase respecto de onde está a xente—
  // pero non pode competir coa que estás a editar nin recoller toques.
  const outra = capa === 'escenico' ? 'tecnico' : 'escenico';
  const daCapa = elementosDaCapa(plano, capa);
  const daOutra = verOutraCapa ? elementosDaCapa(plano, outra) : [];

  const pinta = (el, interactivo) => {
    const c = colocacionDe(plano, momentoId, el.id);
    if (!c) return null;
    return (
      <Elemento
        key={el.id} el={el} c={c} u={u} paleta={paleta}
        seleccionado={interactivo && seleccion === el.id}
        onPointerDown={interactivo && !el.bloqueado ? onPointerDownElemento : null}
      />
    );
  };

  return (
    <svg
      viewBox={vb} width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      // ⚠️ `touch-action: none` ou Safari fai scroll e zoom da PÁXINA ao
      // arrastrar un actor, e o plano móvese enteiro debaixo do dedo.
      style={{ display: 'block', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ⚠️ `fondo: null` na paleta transparente significa NON debuxar o
          rectángulo. Debuxalo invisible non vale: seguiría collendo os
          clics no SVG exportado. */}
      {paleta.fondo && <rect x={-m} y={-m} width={u.W + m * 2} height={u.H + m * 2} fill={paleta.fondo} />}
      {paleta.chan && (
        <rect
          x={0} y={0} width={u.W} height={u.H} fill={paleta.chan}
          onPointerDown={onPointerDownFondo ? (e) => onPointerDownFondo(e) : undefined}
        />
      )}
      <Reixa escenario={plano.escenario} u={u} paleta={paleta} />
      {cotas && <Cotas escenario={plano.escenario} u={u} paleta={paleta} />}

      <g opacity="0.28" pointerEvents="none">{daOutra.map((el) => pinta(el, false))}</g>
      <g>{daCapa.map((el) => pinta(el, true))}</g>

      {/* O bordo vai ENRIBA de todo: se vai debaixo, un elemento pegado
          ao bordo tápao e o escenario parece aberto por ese lado. */}
      <rect
        x={0} y={0} width={u.W} height={u.H} fill="none"
        stroke={paleta.chanBorde} strokeWidth={Math.max(1.5, u.W * 0.0035)} pointerEvents="none"
      />
    </svg>
  );
}
