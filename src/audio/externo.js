// ═══════════════════════════════════════════════════════════════════
// SONIDO · provedores externos
// ═══════════════════════════════════════════════════════════════════
// Unha playlist non contén audio: contén REFERENCIAS. O provedor é
// propiedade de cada pista, non da lista, así que a mesma playlist pode
// mesturar un MP3 propio cunha ligazón de YouTube. É o modelo de
// Melodice, que non aloxa nada e só garda enlaces.
//
// ⚠️ DÚAS FAMILIAS QUE SE COMPORTAN DISTINTO, E HAI QUE DICILO:
//
//   INTERNO  (mp3 propio, do dispositivo, ou de licenza libre)
//     · pasa polos buses → ten volume, mestúrase con efectos e
//       ambientes, e o STOP e o FADE aféctano.
//
//   EXTERNO  (YouTube)
//     · vai nun <iframe> que controlan eles. NON pasa polos buses:
//       non ten volume propio, non se pode mesturar e o FADE non o
//       toca. Ademais pode meter publicidade no medio.
//     · Por iso existe o MODO EXCLUSIVO: mentres soa, o resto cala.
//       Non é unha limitación que se poida rodear con máis código.
// ═══════════════════════════════════════════════════════════════════

export const PROVEDORES = {
  interno: { id: 'interno', nome: 'Propio', mesturable: true },
  youtube: { id: 'youtube', nome: 'YouTube', mesturable: false },
};

const RE_YT = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/i,
  /(?:youtu\.be\/)([\w-]{11})/i,
  /(?:youtube\.com\/embed\/)([\w-]{11})/i,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/i,
  /(?:music\.youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/i,
];

export function idYoutube(url) {
  if (!url || typeof url !== 'string') return null;
  for (const re of RE_YT) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

// De onde vén unha pista. Mira a URL, non o que diga o campo `provedor`:
// unha lista pegada dunha folla de cálculo trae de todo.
export function detectarProvedor(url) {
  if (!url || typeof url !== 'string') return 'interno';
  if (idYoutube(url)) return 'youtube';
  if (/^blob:|^data:/i.test(url)) return 'interno';
  if (/\.(mp3|m4a|aac|wav|flac|opus)(\?|$)/i.test(url)) return 'interno';
  if (/spotify\.com|music\.apple\.com/i.test(url)) return 'nonSoportado';
  return 'interno';   // por defecto trátase como ficheiro directo
}

export function esMesturable(url) {
  const p = detectarProvedor(url);
  return p === 'interno';
}

// ⚠️ `enablejsapi` non se activa a propósito: implicaría cargar o script
// de YouTube desde a súa CDN, e a mesa ten que abrir sen rede allea.
// A cambio, non podemos saber cando remata unha pista: o avance é
// manual. É un intercambio consciente.
export function urlEmbed(url, { autoplay = true } = {}) {
  const id = idYoutube(url);
  if (!id) return null;
  const p = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0',            // sen suxestións doutras canles ao rematar
    modestbranding: '1',
    playsinline: '1',    // en iOS, sen isto salta a pantalla completa
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${p}`;
}

// Aviso que a interface ten que amosar antes de reproducir. Non se
// agocha: quen vai usar isto nunha función ten dereito a sabelo.
export function avisosDe(url) {
  const p = detectarProvedor(url);
  if (p === 'youtube') {
    return {
      exclusivo: true,
      texto: 'YouTube reprodúcese nun marco propio: non ten control de volume '
        + 'nin entra no FADE, e pode inserir publicidade. Mentres soa, os efectos '
        + 'e os ambientes quedan en silencio.',
    };
  }
  if (p === 'nonSoportado') {
    return {
      exclusivo: false,
      erro: true,
      texto: 'Spotify e Apple Music non se poden incrustar aquí. '
        + 'Usa un ficheiro propio ou unha ligazón de YouTube.',
    };
  }
  return { exclusivo: false, texto: null };
}
