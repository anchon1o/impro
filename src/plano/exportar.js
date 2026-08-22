// ═══════════════════════════════════════════════════════════════════
// PLANO · exportar
// ═══════════════════════════════════════════════════════════════════
// Sacar o plano da app: un SVG ou un PNG que se poida imprimir, mandar
// á sala ou pegar nun documento.
//
// ⚠️ ISTO É BARATO PORQUE `VistaPlanta` E `VistaPublico` SON PUROS. O
// que se exporta é o MESMO compoñente que se ve, renderizado outra vez
// cunha paleta distinta e sen a capa de selección. Non hai un segundo
// debuxo que manter en sincronía, que é o que pasa sempre que a
// exportación se escribe aparte.
//
// ⚠️ E POR ISO SE PODE EXPORTAR EN CLARO ESTANDO EN TEMA ESCURO. Se o
// SVG lese o tema por dentro, habería que cambiar o tema da app enteira
// para xerar a imaxe e desfacelo despois.
// ═══════════════════════════════════════════════════════════════════

// Nome de ficheiro utilizable. ⚠️ Non abonda con quitar barras: os
// acentos e os espazos sobreviven a moitos sistemas pero rompen algúns
// servidores de correo, e un plano exportado é algo que se manda.
export function nomeFicheiro(nome, extension, sufixo = '') {
  const base = String(nome || 'plano')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'plano';
  const s = sufixo ? `-${sufixo}` : '';
  return `${base}${s}.${extension}`;
}

// ⚠️ Un SVG que sae dun `innerHTML` NON leva o xmlns, porque no
// documento xa estaba implícito. Fóra do documento, sen el, é un
// ficheiro que ningún visor abre. É o fallo clásico e non dá erro:
// dá un ficheiro que «non se ve».
export function prepararSvg(cadea, { ancho = null, alto = null } = {}) {
  let s = String(cadea || '');
  if (!s.trim()) return '';
  if (!/xmlns=/.test(s)) s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  if (!/xmlns:xlink=/.test(s)) s = s.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  // width/height explícitos: sen eles, moitos visores debuxan o SVG a
  // 150×150 px por defecto aínda tendo viewBox.
  if (ancho && alto) {
    s = s.replace(/\swidth="[^"]*"/, '').replace(/\sheight="[^"]*"/, '');
    s = s.replace('<svg', `<svg width="${Math.round(ancho)}" height="${Math.round(alto)}"`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${s}`;
}

// Le a viewBox para saber a proporción real do debuxo.
export function medidasDe(cadea, anchoObxectivo = 2000) {
  const m = /viewBox="([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)"/.exec(String(cadea || ''));
  if (!m) return { ancho: anchoObxectivo, alto: Math.round(anchoObxectivo * 0.75) };
  const w = Number(m[3]); const h = Number(m[4]);
  if (!(w > 0) || !(h > 0)) return { ancho: anchoObxectivo, alto: Math.round(anchoObxectivo * 0.75) };
  return { ancho: anchoObxectivo, alto: Math.round(anchoObxectivo * (h / w)) };
}

export const svgABlob = (cadea) => new Blob([cadea], { type: 'image/svg+xml;charset=utf-8' });

// SVG → PNG por lenzo. ⚠️ Sen librerías: `Image` + `<canvas>` chega.
export function svgAPng(cadea, ancho = 2000) {
  return new Promise((resolve, reject) => {
    try {
      const { ancho: w, alto: h } = medidasDe(cadea, ancho);
      const url = URL.createObjectURL(svgABlob(cadea));
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          // ⚠️ `toBlob` é asíncrono e pode devolver null se o lenzo
          // está «sucio»; aquí non debería, pero un null sen tratar
          // sae como «exportouse» sen ficheiro.
          c.toBlob((b) => (b ? resolve(b) : reject(new Error('O lenzo non deu imaxe'))), 'image/png');
        } catch (e) { URL.revokeObjectURL(url); reject(e); }
      };
      // ⚠️ Un SVG con fontes externas ou imaxes remotas fai fallar o
      // onload en silencio. Por iso as paletas usan fontes do sistema.
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Non se puido converter o debuxo')); };
      img.src = url;
    } catch (e) { reject(e); }
  });
}

export function descargar(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Un pouco de marxe antes de revogar: revogar de inmediato corta a
  // descarga nalgúns navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

// ⚠️ EN iOS NON HAI DESCARGA FIABLE. `<a download>` nunha WKWebView
// abre a imaxe nunha pestana en vez de gardala, e o portapapeis
// (`ClipboardItem`) esixe chamada síncrona dentro do xesto e falla a
// miúdo. A folla de compartir SI funciona e é ademais o que a xente
// espera nunha tableta: mandar o plano por mensaxe.
//
// Orde: compartir → descargar. Nunca deixar a alguén sen ficheiro.
export async function compartirOuDescargar(blob, nome, titulo = 'Plano') {
  try {
    if (typeof navigator !== 'undefined' && navigator.share && typeof File !== 'undefined') {
      const f = new File([blob], nome, { type: blob.type });
      if (!navigator.canShare || navigator.canShare({ files: [f] })) {
        await navigator.share({ files: [f], title: titulo });
        return { ok: true, via: 'compartir' };
      }
    }
  } catch (e) {
    // ⚠️ Cancelar a folla de compartir lanza AbortError. NON é un erro
    // que haxa que reportar nin polo que haxa que caer á descarga:
    // quen cancela non quere o ficheiro.
    if (e && e.name === 'AbortError') return { ok: false, via: 'cancelado' };
  }
  try {
    descargar(blob, nome);
    return { ok: true, via: 'descarga' };
  } catch (e) {
    return { ok: false, via: 'erro', detalle: String(e && e.message) };
  }
}

// Serializa un nodo SVG vivo do DOM.
export function serializar(nodo) {
  if (!nodo) return '';
  if (typeof XMLSerializer !== 'undefined') return new XMLSerializer().serializeToString(nodo);
  return nodo.outerHTML || '';
}
