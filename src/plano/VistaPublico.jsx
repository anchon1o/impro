// ═══════════════════════════════════════════════════════════════════
// PLANO · vista desde o público
// ═══════════════════════════════════════════════════════════════════
// ⚠️ FALSA PERSPECTIVA 2,5D, NON 3D. Non hai cámara, nin matrices, nin
// punto de fuga real. O chan é un trapecio e as figuras encollen canto
// máis ao fondo están. Iso abonda para ver de golpe se unha escena
// queda tapada ou desequilibrada, que é para o que se usa.
//
// ⚠️ RENDERIZADOR PURO, igual ca `VistaPlanta`. Sen estado, sen
// `useTheme`, sen eventos propios.
//
// ⚠️ E SEN XEOMETRÍA PROPIA. Todo pasa por `proxectar25D()`, que vive
// en `xeometria.js` e está probado desde a Fase 0. Se esta vista
// fixese as súas contas, un actor aparecería nun sitio na planta e
// noutro aquí, e o erro só se vería na vista doble — que é xusto onde
// se poñen as dúas unha ao lado da outra.
//
// ⚠️ É DE LECTURA. Non se arrastra nada aquí. Arrastrar en perspectiva
// significa decidir se o dedo move en profundidade ou en horizontal, e
// non hai resposta boa: dous xestos distintos para a mesma acción só
// crean erros. Edítase na planta; isto é o espello.
// ═══════════════════════════════════════════════════════════════════

import {
  proxectar25D, trapecioChan, ordeProfundidade, normalizarReixa,
  liñasReixa, num,
} from './xeometria.js';
import { cor, textoSobre, conAlfa } from './paleta.js';
import { colocacionDe, elementosDaCapa } from './modelo.js';
import { FiguraAlzado, VolumeAlzado } from './iconosPlano.jsx';

// A vista de público é unha «foto», non un plano: a súa proporción non
// é a do escenario, é a do encadre.
const ANCHO = 1000;
const ALTO = 700;

const px = (p) => ({ x: p.x * ANCHO, y: p.y * ALTO });

export function VistaPublico({
  plano, momentoId, paleta, capa = 'escenico',
  seleccion = null, verOutraCapa = true, perspectiva = undefined,
}) {
  const trap = trapecioChan(perspectiva).map(px);
  const dChan = `M${trap[0].x} ${trap[0].y} L${trap[1].x} ${trap[1].y} L${trap[2].x} ${trap[2].y} L${trap[3].x} ${trap[3].y} Z`;
  const horizonte = trap[0].y;

  // ── Reixa proxectada ─────────────────────────────────────────────
  const R = normalizarReixa(plano.escenario.reixa);
  const L = R.visible ? liñasReixa(R) : { verticais: [], horizontais: [] };

  const outra = capa === 'escenico' ? 'tecnico' : 'escenico';
  const daCapa = elementosDaCapa(plano, capa);
  const daOutra = verOutraCapa ? elementosDaCapa(plano, outra) : [];

  // ⚠️ ORDE DE PROFUNDIDADE. Sen isto, alguén do foro píntase por riba
  // de alguén da boca de escena e a escena lese ao revés. Ordénase por
  // `y` ascendente: y=0 é o fondo.
  const conColocacion = (lista, activa) => lista
    .map((el) => ({ el, c: colocacionDe(plano, momentoId, el.id), activa }))
    .filter((x) => x.c && x.c.visible);

  const todos = [...conColocacion(daOutra, false), ...conColocacion(daCapa, true)]
    .sort((a, b) => ordeProfundidade(a.c, b.c));

  const pinta = ({ el, c, activa }) => {
    const pr = proxectar25D(c, perspectiva);
    const p = px(pr);
    const corEl = cor(paleta, el.cor);
    // A escala combínase co tamaño do propio elemento. Un actor de
    // tamaño estándar mide arredor do 22 % do alto do encadre cando
    // está na boca de escena.
    const k = pr.escala * (ALTO * 0.0011) * (el.tipo === 'actor' ? 1 : 1);
    const opac = activa ? 1 : 0.28;

    if (el.tipo === 'actor') {
      const alto = 200 * k;
      const r = alto * 0.11;
      return (
        <g key={el.id} opacity={opac}>
          {/* Sombra no chan: sen ela a figura parece pegada e non se
              sabe a que profundidade está. */}
          <ellipse cx={p.x} cy={p.y} rx={alto * 0.17} ry={alto * 0.045} fill={paleta.sombra === 'none' ? 'none' : '#000'} opacity={paleta.sombra === 'none' ? 0 : 0.22} />
          {c.foco && (
            <path
              d={`M${p.x - alto * 0.10} ${horizonte - ALTO * 0.06} L${p.x + alto * 0.10} ${horizonte - ALTO * 0.06} L${p.x + alto * 0.30} ${p.y} L${p.x - alto * 0.30} ${p.y} Z`}
              fill={paleta.foco} opacity="0.14"
            />
          )}
          {/* ⚠️ A mirada proxéctase no CHAN, non na figura. Desde a
              butaca non se ve para onde mira alguén de costas; o que si
              se ve é a dirección, e no chan é inequívoca. */}
          <g transform={`translate(${p.x} ${p.y}) rotate(${c.mirada}) scale(1 0.42)`}>
            <path d={`M${alto * 0.13} 0 L${alto * 0.30} ${-alto * 0.075} L${alto * 0.30} ${alto * 0.075} Z`} fill={corEl} opacity="0.85" />
          </g>
          <g transform={`translate(${p.x - 50 * k} ${p.y - 200 * k}) scale(${k})`} color={corEl}>
            <FiguraAlzado postura={c.postura} />
          </g>
          {typeof el.numero === 'number' && (
            <>
              <circle cx={p.x} cy={p.y - alto * 1.02} r={r} fill={corEl} stroke={paleta.fondo || '#fff'} strokeWidth={r * 0.16} />
              <text
                x={p.x} y={p.y - alto * 1.02} fill={textoSobre(corEl)} fontSize={r * 1.25}
                fontWeight="700" fontFamily={paleta.fonte} textAnchor="middle" dominantBaseline="central"
              >
                {el.numero}
              </text>
            </>
          )}
          {el.nome && (
            <text
              x={p.x} y={p.y + alto * 0.10} fill={paleta.texto} fontSize={Math.max(10, alto * 0.085)}
              fontFamily={paleta.fonte} textAnchor="middle"
            >
              {el.nome}
            </text>
          )}
          {seleccion === el.id && (
            <rect
              x={p.x - alto * 0.30} y={p.y - alto * 1.22} width={alto * 0.60} height={alto * 1.28}
              rx={alto * 0.06} fill="none" stroke={paleta.seleccion} strokeWidth={Math.max(1.5, alto * 0.02)}
              strokeDasharray={`${alto * 0.07} ${alto * 0.05}`}
            />
          )}
        </g>
      );
    }

    const w = num(el.ancho, 0.16) * ANCHO * pr.escala * 0.86;
    const h = Math.max(10, w * 0.55);
    return (
      <g key={el.id} opacity={opac}>
        <ellipse cx={p.x} cy={p.y} rx={w * 0.55} ry={h * 0.14} fill={paleta.sombra === 'none' ? 'none' : '#000'} opacity={paleta.sombra === 'none' ? 0 : 0.2} />
        <g transform={`translate(${p.x - w / 2} ${p.y})`} color={corEl}><VolumeAlzado ancho={w} alto={h} /></g>
        {el.nome && (
          <text
            x={p.x} y={p.y + h * 0.42} fill={paleta.textoTenue} fontSize={Math.max(10, ALTO * 0.022)}
            fontFamily={paleta.fonte} textAnchor="middle"
          >
            {el.nome}
          </text>
        )}
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${ALTO}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {paleta.fondo && <rect x="0" y="0" width={ANCHO} height={ALTO} fill={paleta.fondo} />}

      {/* Fondo escénico: o que hai por riba do horizonte. Non é «a
          parede»: é a caixa escénica, e por iso é máis escura que o
          chan en calquera paleta. */}
      {paleta.chan && <rect x="0" y="0" width={ANCHO} height={horizonte} fill={conAlfa(paleta.chanBorde, 0.22)} />}
      {paleta.chan && <path d={dChan} fill={paleta.chan} />}

      {/* Reixa proxectada. As liñas de fondo son as horizontais do
          plano e por iso son as que se estreitan. */}
      <g pointerEvents="none">
        {L.verticais.map((v) => {
          const a = px(proxectar25D({ x: v, y: 0 }, perspectiva));
          const b = px(proxectar25D({ x: v, y: 1 }, perspectiva));
          return <path key={`v${v}`} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} stroke={paleta.reixa} strokeWidth="1.2" fill="none" />;
        })}
        {L.horizontais.map((hh) => {
          const a = px(proxectar25D({ x: 0, y: hh }, perspectiva));
          const b = px(proxectar25D({ x: 1, y: hh }, perspectiva));
          return <path key={`h${hh}`} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} stroke={paleta.reixa} strokeWidth="1.2" fill="none" />;
        })}
      </g>

      {todos.map(pinta)}

      <path d={dChan} fill="none" stroke={paleta.chanBorde} strokeWidth="2.2" pointerEvents="none" />
    </svg>
  );
}
