// ═══════════════════════════════════════════════════════════════════
// PLANO · almacén
// ═══════════════════════════════════════════════════════════════════
// Dous almacéns, e non é unha duplicación gratuíta. É o mesmo patrón
// que `sonido/mesas.js`, que xa está probado:
//
//   · SEN CONTA → localStorage. O §9 esixe poder usar a app sen
//     rexistrarse, e un plano é xusto o que quere probar alguén que
//     aínda non se rexistrou.
//   · CON CONTA → Supabase (táboa `planos`), para telo noutro aparello.
//
// ⚠️ Os planos locais NON se soben sós ao iniciar sesión. Facelo sen
// preguntar mestura o que estabas probando co que xa tiñas gardado, e
// non hai volta atrás. `migrables()` di cales se poderían subir; a
// decisión é de quen está diante. Igual que coas mesas.
//
// ⚠️ O documento vai ENTEIRO nunha columna JSONB, non en táboas fillas.
// Un plano lese e escríbese sempre completo: non hai ningunha consulta
// do tipo «dáme todos os actores de todos os planos». Con táboas
// fillas habería que reconciliar altas, baixas e reordenacións en cada
// gardado, que é onde aparecen os ocos. Mesma decisión que `escaletas`.
// ═══════════════════════════════════════════════════════════════════

import { supabase } from '../supabase.js';
import { validar, migrar, planoBaleiro, resumo } from './modelo.js';

const CLAVE = 'impro_planos_v1';

const leerLocal = () => {
  try {
    const v = localStorage.getItem(CLAVE);
    const arr = v ? JSON.parse(v) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
};

const escribirLocal = (arr) => {
  try { localStorage.setItem(CLAVE, JSON.stringify(Array.isArray(arr) ? arr : [])); return true; }
  catch { return false; }
};

// ═══════════════════════════════════════════════════════════════════
// LOCAL
// ═══════════════════════════════════════════════════════════════════

// ⚠️ `validar()` devolve unha forma FIXA, e iso inclúe tirar todo o que
// non recoñece. `local` e `actualizado` non son do documento: son do
// almacén. Se se pasa un plano por `migrar` sen máis, sáense pola
// billa, a lista deixa de saber cales están só neste aparello e a orde
// por recencia colapsa (todos a 0). Hai que volvelos poñer.
const conMeta = (cru, doc) => ({
  ...doc,
  local: true,
  actualizado: typeof (cru && cru.actualizado) === 'number' ? cru.actualizado : 0,
});

export function listarLocais() {
  // ⚠️ `migrar` en cada lectura, non só ao gardar. Un plano gardado por
  // unha versión anterior ten que abrir hoxe; se só se migrase ao
  // escribir, un plano que nunca se volveu editar quedaría fóra.
  return leerLocal()
    .map((x) => conMeta(x, migrar(x)))
    .sort((a, b) => b.actualizado - a.actualizado);
}

export function obterLocal(id) {
  const p = leerLocal().find((x) => x && x.id === id);
  return p ? conMeta(p, migrar(p)) : null;
}

// ⚠️ Marca de tempo ESTRITAMENTE crecente. `Date.now()` repítese se se
// garda dúas veces no mesmo milisegundo —que pasa ao duplicar, ou ao
// gardar dous planos seguidos por código—, e entón a orde por recencia
// queda ao chou. Nun editor iso vese como «o plano que acabo de crear
// aparece o segundo».
let ultimaMarca = 0;
function marcaAgora() {
  const t = Math.max(Date.now(), ultimaMarca + 1);
  ultimaMarca = t;
  return t;
}

export function gardarLocal(plano) {
  const P = { ...validar(plano), local: true, actualizado: marcaAgora() };
  const arr = leerLocal();
  const i = arr.findIndex((x) => x && x.id === P.id);
  if (i >= 0) arr[i] = P; else arr.push(P);
  escribirLocal(arr);
  return P;
}

export function borrarLocal(id) {
  const arr = leerLocal().filter((x) => !x || x.id !== id);
  escribirLocal(arr);
  return true;
}

export function duplicarLocal(id, nome = null) {
  const p = obterLocal(id);
  if (!p) return null;
  const copia = validar({ ...p, id: undefined, nome: nome || `${p.nome} (copia)` });
  return gardarLocal(copia);
}

// ═══════════════════════════════════════════════════════════════════
// CONTA
// ═══════════════════════════════════════════════════════════════════
// ⚠️ Unha táboa baleira NON é un erro. Hai que distinguir tres estados
// —cargando, baleiro e sen conexión— ou a pantalla di «non tes planos»
// cando o que pasa é que fallou a rede. Faino o campo `motivo`.

const daFila = (f) => migrar({
  ...(f && f.documento ? f.documento : {}),
  id: f.id,
  nome: f.nome,
  notas: f.notas,
  grupoId: f.grupo_id || null,
  userId: f.user_id || null,
});

export async function listarDaConta() {
  try {
    const { data, error } = await supabase
      .from('planos').select('*').order('updated_at', { ascending: false });
    if (error) return { planos: [], motivo: 'erro', detalle: error.message };
    const planos = (data || []).map(daFila).map((p) => ({ ...p, local: false }));
    return { planos, motivo: planos.length ? null : 'baleiro' };
  } catch (e) {
    return { planos: [], motivo: 'sen-conexion', detalle: String(e && e.message) };
  }
}

export async function gardarNaConta(plano, userId) {
  const P = validar(plano);
  const r = resumo(P);
  const fila = {
    nome: P.nome,
    notas: P.notas,
    // ⚠️ `modo` vai como `modoUltimo` dentro do documento, non como
    // columna: o modo é estado da interface, non un dato do plano
    // (decisión B). A columna existe na táboa só para poder filtrar a
    // lista sen abrir o JSON.
    modo: P.modoUltimo,
    documento: P,
    version: P.version,
    momentos: r.momentos,
    grupo_id: P.grupoId || null,
    user_id: userId || null,
    updated_at: new Date().toISOString(),
  };
  try {
    // ⚠️ Os ids locais (`pl-xxxx`) NON son uuid. Un plano que sobe por
    // primeira vez ten que deixar que Postgres lle poña o seu; mandar o
    // local fai fallar o insert co erro de tipo, que se le como «non se
    // puido gardar» sen dicir por que.
    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(P.id);
    const carga = esUuid ? { ...fila, id: P.id } : fila;
    const { data, error } = await supabase.from('planos').upsert(carga).select().single();
    if (error) return { ok: false, motivo: 'erro', detalle: error.message };
    return { ok: true, plano: { ...daFila(data), local: false } };
  } catch (e) {
    return { ok: false, motivo: 'sen-conexion', detalle: String(e && e.message) };
  }
}

export async function borrarDaConta(id) {
  try {
    const { error } = await supabase.from('planos').delete().eq('id', id);
    if (error) return { ok: false, detalle: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, detalle: String(e && e.message) };
  }
}

// ═══════════════════════════════════════════════════════════════════
// MIGRACIÓN LOCAL → CONTA
// ═══════════════════════════════════════════════════════════════════
// Só DI cales se poderían subir. Non sobe nada.

export function migrables() {
  return listarLocais().map((p) => ({ id: p.id, nome: p.nome, resumo: resumo(p) }));
}

export async function subir(ids, userId) {
  const seleccion = new Set(Array.isArray(ids) ? ids : []);
  const out = { subidos: [], fallos: [] };
  for (const p of listarLocais()) {
    if (!seleccion.has(p.id)) continue;
    const r = await gardarNaConta({ ...p, userId }, userId);
    if (r.ok) {
      out.subidos.push(p.id);
      // ⚠️ Bórrase o local DESPOIS de confirmar que subiu. Ao revés,
      // un fallo de rede perde o plano.
      borrarLocal(p.id);
    } else {
      out.fallos.push({ id: p.id, detalle: r.detalle });
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════
// FACHADA
// ═══════════════════════════════════════════════════════════════════
// O que usa a interface. Non ten que saber onde vive cada plano.

export async function listar(logueado) {
  const locais = listarLocais().map((p) => ({ ...p, local: true }));
  if (!logueado) return { planos: locais, motivo: locais.length ? null : 'baleiro' };
  const r = await listarDaConta();
  // Vense as dúas cousas á vez: os da conta e os que aínda están só
  // neste aparello. Agochar os locais ao iniciar sesión fai que
  // pareza que se perderon.
  return { planos: [...r.planos, ...locais], motivo: (r.planos.length + locais.length) ? null : r.motivo };
}

export async function gardar(plano, { logueado, userId } = {}) {
  if (!logueado) return { ok: true, plano: gardarLocal(plano) };
  return gardarNaConta(plano, userId);
}

export async function borrar(plano) {
  if (!plano) return { ok: false };
  if (plano.local) { borrarLocal(plano.id); return { ok: true }; }
  return borrarDaConta(plano.id);
}

export const novoPlano = (nome) => planoBaleiro(nome || 'Plano novo');
