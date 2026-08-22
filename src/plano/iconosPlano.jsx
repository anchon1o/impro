// ═══════════════════════════════════════════════════════════════════
// PLANO · símbolos
// ═══════════════════════════════════════════════════════════════════
// ⚠️ ISTO NON É `iconos.jsx`. Aquel son iconos de INTERFACE, e o seu
// array `ICONOS_NECESARIOS` é a vara de medir da cobertura dos estilos
// alternativos. Meter aquí os 40 símbolos do debuxo afundiría a
// porcentaxe de todos os estilos e deixaría I11 imposible.
//
// Estes son CONTIDO do plano: o que se debuxa dentro do escenario.
// Non teñen estilos alternativos nin selector.
//
// ⚠️ TODOS EN VISTA CENITAL, mirados desde arriba. Unha cadeira de
// perfil nun plano de planta é o erro clásico: parece máis bonita e
// non se entende cara a onde está mirando quen se senta nela.
//
// Cada símbolo defínese nunha caixa de 100×100 e o renderizador
// escálao. `currentColor` para que herde a cor do grupo.
// ═══════════════════════════════════════════════════════════════════

const tr = { fill: 'none', stroke: 'currentColor', strokeWidth: 7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const cheo = { fill: 'currentColor' };

// ── Capa escénica ──────────────────────────────────────────────────
export const SIMBOLOS_ESCENICOS = {
  cadeira: {
    nome: 'Cadeira',
    // O respaldo indica cara a onde mira. Sen el, unha cadeira cenital
    // é un cadrado e non di nada.
    d: (<><rect x="24" y="30" width="52" height="52" rx="6" {...tr} /><path d="M24 30 h52" stroke="currentColor" strokeWidth="14" strokeLinecap="round" fill="none" /></>),
  },
  mesa: { nome: 'Mesa', d: (<rect x="14" y="30" width="72" height="40" rx="5" {...tr} />) },
  mesaRedonda: { nome: 'Mesa redonda', d: (<circle cx="50" cy="50" r="30" {...tr} />) },
  sofa: {
    nome: 'Sofá',
    d: (<><rect x="14" y="34" width="72" height="36" rx="8" {...tr} /><path d="M14 34 h72" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none" /><path d="M28 44 v18 M72 44 v18" {...tr} /></>),
  },
  banco: { nome: 'Banco', d: (<rect x="10" y="40" width="80" height="20" rx="4" {...tr} />) },
  caixa: { nome: 'Caixa', d: (<><rect x="26" y="26" width="48" height="48" rx="4" {...tr} /><path d="M26 26 L74 74 M74 26 L26 74" strokeWidth="4" stroke="currentColor" fill="none" opacity="0.5" /></>) },
  praticable: { nome: 'Praticable', d: (<><rect x="16" y="24" width="68" height="52" rx="3" {...tr} /><path d="M16 44 h68 M16 60 h68" strokeWidth="4" stroke="currentColor" fill="none" opacity="0.55" /></>) },
  porta: { nome: 'Porta', d: (<><path d="M24 76 v-52 h10" {...tr} /><path d="M34 24 A42 42 0 0 1 76 66" strokeWidth="4" strokeDasharray="7 6" stroke="currentColor" fill="none" opacity="0.7" /></>) },
  escaleira: { nome: 'Escaleira', d: (<><rect x="26" y="18" width="48" height="64" rx="3" {...tr} /><path d="M26 34 h48 M26 50 h48 M26 66 h48" strokeWidth="5" stroke="currentColor" fill="none" opacity="0.7" /></>) },
  planta: { nome: 'Planta', d: (<><circle cx="50" cy="50" r="26" {...tr} /><path d="M50 30 v40 M32 50 h36 M37 37 l26 26 M63 37 l-26 26" strokeWidth="4" stroke="currentColor" fill="none" opacity="0.6" /></>) },
  marca: { nome: 'Marca no chan', d: (<><path d="M50 24 v52 M24 50 h52" {...tr} /></>) },
};

// ── Capa técnica ───────────────────────────────────────────────────
// ⚠️ Preparados para stage plot e rider: cada un vai levar metadatos
// (canle, modelo, alimentación) na Fase 3. O símbolo é só o debuxo.
export const SIMBOLOS_TECNICOS = {
  micro: { nome: 'Micrófono', subcapa: 'audio', d: (<><circle cx="50" cy="34" r="17" {...tr} /><path d="M50 51 v28" {...tr} /><path d="M34 79 h32" {...tr} /></>) },
  microSenFio: { nome: 'Micro sen fío', subcapa: 'audio', d: (<><rect x="40" y="20" width="20" height="46" rx="10" {...tr} /><path d="M50 66 v14" {...tr} /><path d="M28 24 A26 26 0 0 0 28 48" strokeWidth="4" stroke="currentColor" fill="none" opacity="0.6" /></>) },
  monitor: { nome: 'Monitor de chan', subcapa: 'audio', d: (<><path d="M18 74 L30 32 h40 l12 42 Z" {...tr} /><circle cx="50" cy="56" r="11" strokeWidth="5" stroke="currentColor" fill="none" /></>) },
  amplificador: { nome: 'Amplificador', subcapa: 'audio', d: (<><rect x="18" y="28" width="64" height="44" rx="4" {...tr} /><circle cx="40" cy="50" r="12" strokeWidth="5" stroke="currentColor" fill="none" /><path d="M64 40 h10 M64 50 h10 M64 60 h10" strokeWidth="4" stroke="currentColor" fill="none" opacity="0.7" /></>) },
  di: { nome: 'Caixa DI', subcapa: 'audio', d: (<><rect x="30" y="34" width="40" height="32" rx="3" {...tr} /><path d="M38 46 h24 M38 56 h14" strokeWidth="4" stroke="currentColor" fill="none" opacity="0.7" /></>) },
  teclado: { nome: 'Teclado', subcapa: 'audio', d: (<><rect x="12" y="38" width="76" height="26" rx="3" {...tr} /><path d="M28 38 v26 M44 38 v26 M60 38 v26 M74 38 v26" strokeWidth="4" stroke="currentColor" fill="none" opacity="0.7" /></>) },
  foco: { nome: 'Foco', subcapa: 'iluminacion', d: (<><circle cx="50" cy="50" r="22" {...tr} /><path d="M50 20 v-8 M50 88 v-8 M20 50 h-8 M88 50 h-8 M29 29 l-6-6 M71 71 l6 6 M71 29 l6-6 M29 71 l-6 6" strokeWidth="5" stroke="currentColor" fill="none" strokeLinecap="round" /></>) },
  proxector: { nome: 'Proxector', subcapa: 'video', d: (<><rect x="22" y="34" width="46" height="32" rx="4" {...tr} /><path d="M68 42 L86 30 v40 L68 58 Z" {...tr} /></>) },
  pantalla: { nome: 'Pantalla', subcapa: 'video', d: (<><rect x="12" y="40" width="76" height="10" rx="2" {...cheo} /><path d="M50 50 v26" {...tr} /></>) },
  enchufe: { nome: 'Toma de corrente', subcapa: 'electricidade', d: (<><circle cx="50" cy="50" r="24" {...tr} /><circle cx="41" cy="45" r="5" {...cheo} /><circle cx="59" cy="45" r="5" {...cheo} /><path d="M38 62 h24" strokeWidth="5" stroke="currentColor" fill="none" /></>) },
};

export const SIMBOLOS = { ...SIMBOLOS_ESCENICOS, ...SIMBOLOS_TECNICOS };

// ⚠️ Un símbolo descoñecido NON pode devolver `undefined`: un `<g>`
// baleiro deixa un elemento invisible que segue collendo os toques, e
// mover algo que non se ve é imposible de diagnosticar. Cae sempre a
// unha caixa.
export const simbolo = (nome) => SIMBOLOS[nome] || SIMBOLOS.caixa;

export const nomesSimbolos = (capa) => Object.keys(capa === 'tecnico' ? SIMBOLOS_TECNICOS : SIMBOLOS_ESCENICOS);

// ── Figura humana, en planta ───────────────────────────────────────
// ⚠️ Un actor NON é un círculo. O círculo non di cara a onde mira, e a
// mirada é a metade da información dun plano de impro. A figura leva:
//   · corpo redondo
//   · unha «proa» que apunta á mirada
//   · o número dentro
// A figura de corpo enteiro, vectorial e modular, é da Fase 2; en
// planta o que fai falta é isto.
export function FiguraPlanta({ r = 26, postura = 'de-pe' }) {
  // A postura cámbiaa a silueta, non a cor: nun plano impreso en branco
  // e negro a cor pérdese e a postura ten que seguir léndose.
  if (postura === 'sentado') {
    return (<><circle cx="0" cy="0" r={r} fill="currentColor" /><rect x={-r * 0.95} y={r * 0.35} width={r * 1.9} height={r * 0.42} rx={r * 0.2} fill="currentColor" opacity="0.55" /></>);
  }
  if (postura === 'agachado') return <circle cx="0" cy="0" r={r * 0.74} fill="currentColor" />;
  if (postura === 'deitado') return <ellipse cx="0" cy="0" rx={r * 1.35} ry={r * 0.6} fill="currentColor" />;
  if (postura === 'elevado') {
    return (<><circle cx="0" cy="0" r={r} fill="currentColor" /><circle cx="0" cy="0" r={r * 1.35} fill="none" stroke="currentColor" strokeWidth={r * 0.16} opacity="0.5" /></>);
  }
  return <circle cx="0" cy="0" r={r} fill="currentColor" />;
}

// ═══════════════════════════════════════════════════════════════════
// ALZADO · o que se ve desde o público
// ═══════════════════════════════════════════════════════════════════
// ⚠️ NON son os mesmos debuxos ca a planta. Un símbolo cenital metido
// na vista de público lese como unha mancha no chan; unha figura de
// alzado metida na planta parece que a xente está deitada. Son dous
// debuxos do mesmo dato, e teñen que selo.
//
// Caixa de referencia: 100 de ancho × 200 de alto, cos PÉS EN (50,200).
// Ancorar polos pés e non polo centro é o que fai que unha figura
// pequena do fondo e unha grande da boca de escena pousen as dúas no
// chan; ancorando polo centro, a do fondo flota.

export function FiguraAlzado({ postura = 'de-pe' }) {
  const cabeza = <circle cx="50" cy="34" r="22" fill="currentColor" />;
  if (postura === 'sentado') {
    return (
      <g>
        <circle cx="50" cy="80" r="20" fill="currentColor" />
        <path d="M32 100 h36 a8 8 0 0 1 8 8 v34 h-52 v-34 a8 8 0 0 1 8 -8 Z" fill="currentColor" />
        <path d="M76 142 h18 a7 7 0 0 1 0 14 h-18 Z" fill="currentColor" opacity="0.85" />
        <path d="M34 156 h14 v44 h-14 Z M56 156 h14 v44 h-14 Z" fill="currentColor" opacity="0.9" />
      </g>
    );
  }
  if (postura === 'agachado') {
    return (
      <g>
        <circle cx="50" cy="96" r="19" fill="currentColor" />
        <path d="M30 118 h40 a9 9 0 0 1 9 9 v44 a9 9 0 0 1 -9 9 h-40 a9 9 0 0 1 -9 -9 v-44 a9 9 0 0 1 9 -9 Z" fill="currentColor" />
        <path d="M26 180 h48 v20 h-48 Z" fill="currentColor" opacity="0.9" />
      </g>
    );
  }
  if (postura === 'deitado') {
    return (
      <g>
        <circle cx="22" cy="182" r="16" fill="currentColor" />
        <rect x="34" y="168" width="62" height="30" rx="14" fill="currentColor" />
      </g>
    );
  }
  if (postura === 'elevado') {
    // Sobre algo. O bloque debúxase por baixo para que se entenda que
    // a altura vén dun praticable e non de que a figura sexa máis alta.
    return (
      <g>
        <rect x="16" y="164" width="68" height="36" rx="3" fill="currentColor" opacity="0.35" />
        <g transform="translate(0 -36) scale(1)">
          <circle cx="50" cy="34" r="22" fill="currentColor" />
          <path d="M30 60 h40 a10 10 0 0 1 10 10 v52 a10 10 0 0 1 -10 10 h-40 a10 10 0 0 1 -10 -10 v-52 a10 10 0 0 1 10 -10 Z" fill="currentColor" />
          <path d="M34 132 h13 v68 h-13 Z M57 132 h13 v68 h-13 Z" fill="currentColor" opacity="0.9" />
        </g>
      </g>
    );
  }
  return (
    <g>
      {cabeza}
      <path d="M30 60 h40 a10 10 0 0 1 10 10 v52 a10 10 0 0 1 -10 10 h-40 a10 10 0 0 1 -10 -10 v-52 a10 10 0 0 1 10 -10 Z" fill="currentColor" />
      <path d="M34 132 h13 v68 h-13 Z M57 132 h13 v68 h-13 Z" fill="currentColor" opacity="0.9" />
    </g>
  );
}

// Un obxecto visto desde o público. ⚠️ Non se intenta reproducir o
// símbolo cenital: desde a butaca unha cadeira e unha caixa son os dous
// «un volume no chan». O que importa é ONDE está e canto ocupa, e a
// etiqueta di o que é. Fingir un debuxo realista sería inventar datos
// que o plano non ten.
export function VolumeAlzado({ ancho = 100, alto = 60 }) {
  const p = alto * 0.28;   // fuga da cara superior
  return (
    <g>
      <path d={`M0 ${-alto} h${ancho} l${-p} ${-p} h${-(ancho - p * 2)} Z`} fill="currentColor" opacity="0.55" />
      <rect x="0" y={-alto} width={ancho} height={alto} fill="currentColor" opacity="0.85" />
    </g>
  );
}
