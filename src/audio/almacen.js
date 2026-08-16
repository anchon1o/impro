// ═══════════════════════════════════════════════════════════════════
// SONIDO · almacén local de audio
// ═══════════════════════════════════════════════════════════════════
// Os ficheiros do usuario quedan NO SEU DISPOSITIVO, en IndexedDB.
// É o camiño máis barato de todos e o único que cumpre as tres cousas
// á vez:
//   · custo de almacenamento cero para o proxecto;
//   · sen exposición ningunha a licenzas de terceiros;
//   · funciona SEN REDE, que é o risco R2 — o wifi dun local non se
//     pode dar por bo, e quedar sen son a media función por iso sería
//     o peor fallo posible.
//
// ⚠️ localStorage NON serve aquí: só garda texto e ten uns 5 MB. Un só
// ambiente de tres minutos xa non entra. IndexedDB garda Blobs.
//
// ⚠️ Safari pode expulsar IndexedDB se o dispositivo anda xusto de
// espazo ou se a web leva semanas sen abrirse. Por iso `estimar()`
// existe e por iso a interface ten que dicir que isto é local, non
// unha copia de seguridade.
// ═══════════════════════════════════════════════════════════════════

const BD = 'impro_sonido';
const VERSION = 1;
const ALMACEN = 'ficheiros';

let promesa = null;

function abrir() {
  if (promesa) return promesa;
  promesa = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('sen IndexedDB')); return; }
    const p = indexedDB.open(BD, VERSION);
    p.onupgradeneeded = () => {
      const db = p.result;
      if (!db.objectStoreNames.contains(ALMACEN)) {
        db.createObjectStore(ALMACEN, { keyPath: 'id' });
      }
    };
    p.onsuccess = () => resolve(p.result);
    p.onerror = () => reject(p.error || new Error('non se puido abrir IndexedDB'));
  });
  return promesa;
}

function tx(modo, fn) {
  return abrir().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(ALMACEN, modo);
    const store = t.objectStore(ALMACEN);
    let resultado;
    try { resultado = fn(store); } catch (e) { reject(e); return; }
    t.oncomplete = () => resolve(resultado && resultado.result !== undefined ? resultado.result : resultado);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('transacción abortada'));
  }));
}

export function dispoñible() {
  return typeof indexedDB !== 'undefined';
}

let contador = 0;
function novoId() {
  contador += 1;
  return 'disp-' + Date.now().toString(36) + '-' + contador.toString(36);
}

// Gárdase o Blob, non unha URL. As URLs de obxecto morren ao recargar;
// o Blob sobrevive e créase unha URL nova en cada sesión.
export async function gardarFicheiro(file, meta = {}) {
  const id = meta.id || novoId();
  const rexistro = {
    id,
    nome: meta.nome || file.name.replace(/\.[^.]+$/, ''),
    tipo: meta.tipo || 'efecto',
    emoji: meta.emoji || '',
    vol: typeof meta.vol === 'number' ? meta.vol : 0.8,
    modo: meta.modo || 'once',
    mime: file.type || 'audio/mpeg',
    bytes: file.size || 0,
    blob: file,
    en: Date.now(),
  };
  await tx('readwrite', (s) => s.put(rexistro));
  return id;
}

export async function actualizarMeta(id, cambios) {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const t = db.transaction(ALMACEN, 'readwrite');
    const s = t.objectStore(ALMACEN);
    const p = s.get(id);
    p.onsuccess = () => {
      const r = p.result;
      if (!r) { resolve(false); return; }
      s.put({ ...r, ...cambios, id, blob: r.blob });
    };
    t.oncomplete = () => resolve(true);
    t.onerror = () => reject(t.error);
  });
}

export async function borrarFicheiro(id) {
  await tx('readwrite', (s) => s.delete(id));
  return true;
}

// Devolve os rexistros SEN o blob, máis unha URL de obxecto por cada un.
// Quen chame a isto ten que liberar as URLs ao desmontar; se non, os
// ficheiros quedan en memoria mentres viva a pestana.
export async function listarFicheiros() {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const t = db.transaction(ALMACEN, 'readonly');
    const p = t.objectStore(ALMACEN).getAll();
    p.onsuccess = () => {
      const fóra = [];
      for (const r of p.result || []) {
        if (!r.blob) continue;
        fóra.push({
          id: r.id,
          nome: r.nome,
          tipo: r.tipo || 'efecto',
          emoji: r.emoji || '',
          vol: typeof r.vol === 'number' ? r.vol : 0.8,
          modo: r.modo || 'once',
          bytes: r.bytes || 0,
          en: r.en || 0,
          url: URL.createObjectURL(r.blob),
          orixe: 'dispositivo',
        });
      }
      fóra.sort((a, b) => a.nome.localeCompare(b.nome));
      resolve(fóra);
    };
    t.onerror = () => reject(t.error);
  });
}

export async function estimar() {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) return null;
    const { usage, quota } = await navigator.storage.estimate();
    return { usado: usage || 0, cota: quota || 0 };
  } catch (e) { return null; }
}

export function formatarBytes(b) {
  if (!b) return '0 B';
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' kB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}
