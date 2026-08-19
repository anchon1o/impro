// ═══════════════════════════════════════════════════════════════════
// GUÍA · busca e ordenación
// ═══════════════════════════════════════════════════════════════════
// Funcións puras, sen React nin rede, para poder probalas de verdade.
//
// ⚠️ A busca vella miraba só `nombre` e `descripcion`. Con 247
// dinámicas iso deixa fóra o que máis se busca: «alguén que se
// converta nunha estatua» está nos PASOS, non no título.
// ═══════════════════════════════════════════════════════════════════

// Sen acentos e en minúsculas. En galego e castelán isto non é un
// adorno: buscar «musica» ten que atopar «música», e buscar «accion»
// ten que atopar «acción». Sen isto, media busca falla en silencio.
export function normalizar(t) {
  return String(t ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Todo o texto dunha dinámica, non só o título. `pasos` e `variantes`
// son arrays; `objetivo` e `autoria` adoitan estar baleiros.
export function textoDe(d) {
  if (!d) return '';
  const partes = [
    d.nombre, d.descripcion, d.objetivo, d.tipo,
    d.participantes, d.autoria, d.fuente, d.notas,
    ...(Array.isArray(d.pasos) ? d.pasos : []),
    ...(Array.isArray(d.variantes) ? d.variantes : []),
  ];
  return normalizar(partes.filter(Boolean).join(' '));
}

// Onde apareceu a coincidencia. Serve para dicilo na lista: atopar algo
// polos pasos e non saber por que aparece é desconcertante.
export function onde(d, busca) {
  const q = normalizar(busca);
  if (!q) return null;
  if (normalizar(d.nombre).includes(q)) return 'nome';
  if (normalizar(d.descripcion).includes(q)) return 'descrición';
  if ((d.pasos || []).some((p) => normalizar(p).includes(q))) return 'pasos';
  if (normalizar(d.objetivo).includes(q)) return 'obxectivo';
  if ((d.variantes || []).some((v) => normalizar(v).includes(q))) return 'variantes';
  if (normalizar(d.autoria).includes(q) || normalizar(d.fuente).includes(q)) return 'autoría';
  return null;
}

// Todas as palabras teñen que aparecer, non necesariamente xuntas nin
// en orde: «estatua rápido» atopa unha dinámica que fale das dúas
// cousas en frases distintas.
export function coincide(d, busca) {
  const q = normalizar(busca).trim();
  if (!q) return true;
  const texto = textoDe(d);
  return q.split(/\s+/).every((p) => texto.includes(p));
}

export const ORDES = [
  { id: 'relevancia', nome: 'Relevancia' },
  { id: 'nome', nome: 'Nome A–Z' },
  { id: 'curtas', nome: 'Máis curtas' },
  { id: 'longas', nome: 'Máis longas' },
  { id: 'tipo', nome: 'Tipo' },
  { id: 'favoritas', nome: 'Favoritas primeiro' },
  { id: 'novas', nome: 'Máis recentes' },
  { id: 'usadas', nome: 'Máis usadas' },
];

const num = (v, def) => { const n = Number(v); return Number.isFinite(n) ? n : def; };

// `usos` é o mapa de `trackDin`, indexado por NOME e non por id.
// ⚠️ Só o alimenta Reto, e só desde este dispositivo: unha dinámica sen
// contar non é unha dinámica sen usar. Por iso «máis usadas» non é a
// orde por defecto.
export function ordenar(lista, modo, { favs = [], usos = {}, busca = '' } = {}) {
  const l = [...(lista || [])];
  const esFav = (d) => favs.includes(d.id);
  const usosDe = (d) => num(usos[d.nombre], 0);

  switch (modo) {
    case 'nome':
      return l.sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
    case 'curtas':
      return l.sort((a, b) => num(a.duracion, 999) - num(b.duracion, 999));
    case 'longas':
      return l.sort((a, b) => num(b.duracion, 0) - num(a.duracion, 0));
    case 'tipo':
      return l.sort((a, b) => String(a.tipo || '').localeCompare(String(b.tipo || ''))
        || String(a.nombre || '').localeCompare(String(b.nombre || '')));
    case 'favoritas':
      return l.sort((a, b) => (esFav(b) - esFav(a))
        || String(a.nombre || '').localeCompare(String(b.nombre || '')));
    case 'novas':
      // As propias teñen id de `Date.now()`; as base, ids curtos. As
      // creadas por ti son as que interesa ver arriba.
      return l.sort((a, b) => String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true }));
    case 'usadas':
      return l.sort((a, b) => usosDe(b) - usosDe(a)
        || String(a.nombre || '').localeCompare(String(b.nombre || '')));
    default: {
      // Relevancia: só ten sentido cando se busca algo. Sen busca,
      // ordénase por nome, que é o predicible.
      if (!busca) return l.sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
      const q = normalizar(busca).trim();
      const peso = (d) => {
        const n = normalizar(d.nombre);
        if (n === q) return 0;            // coincidencia exacta
        if (n.startsWith(q)) return 1;    // empeza polo que se buscou
        if (n.includes(q)) return 2;      // aparece no título
        if (normalizar(d.descripcion).includes(q)) return 3;
        return 4;                         // só nos pasos ou no resto
      };
      return l.sort((a, b) => peso(a) - peso(b)
        || String(a.nombre || '').localeCompare(String(b.nombre || '')));
    }
  }
}

export function filtrarEOrdenar(dinamicas, {
  busca = '', filtro = 'todos', orde = 'relevancia', favs = [], usos = {},
} = {}) {
  const base = (dinamicas || []).filter((d) => {
    if (filtro === '★ Favoritas') return favs.includes(d.id);
    if (filtro !== 'todos' && d.tipo !== filtro) return false;
    return true;
  }).filter((d) => coincide(d, busca));
  return ordenar(base, orde, { favs, usos, busca });
}
