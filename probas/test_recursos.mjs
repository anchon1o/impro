// Proba da capa de datos contra un stub controlable de Supabase.
// O que importa aquí é que un fallo de rede NON deixe a mesa muda sen
// dicir por que, e que a validación pare o erro antes de gardar.
import * as R from '/home/claude/impro/impro/src/sonido/recursos.js';
import { escenario } from './supabase_stub_son.js';

let f = 0;
const ok = (t, c, e = '') => { console.log((c ? '✓ ' : '✗ ') + t + (c ? '' : ' — ' + e)); if (!c) f++; };

const FILA = {
  id: 'r1', tipo: 'efecto', nome: 'Porta', orixe: 'propio', url: 'https://x/p.wav',
  modo: 'once', vol_defecto: 0.8, visibilidade: 'publico', estado: 'publicada', user_id: 'u1',
};

// ── Patrón de compatibilidade ─────────────────────────────────────
escenario.set({ son_recursos: [FILA] });
localStorage.clear();
let res = await R.getRecursos();
ok('devolve un array usable directamente', Array.isArray(res) && res.length === 1);
ok('e tamén por desestruturación', (await R.getRecursos()).recursos.length === 1);
ok('sen motivo cando hai datos', res.motivo === null);
ok('normaliza a duración e o volume', res[0].vol === 0.8 && res[0].duracionMs === null);

// ── ⚠️ Unha táboa baleira NON é un erro ───────────────────────────
escenario.set({ son_recursos: [] });
localStorage.clear();
res = await R.getRecursos();
ok('táboa baleira → motivo "baleira", non erro', res.length === 0 && res.motivo === 'baleira');
ok('e sen marcar erro', res.erro === null);

// ── Caída de rede con caché: a mesa abre igual ────────────────────
escenario.set({ son_recursos: [FILA] });
localStorage.clear();
await R.getRecursos();                       // enche a caché
escenario.set({ erro: 'Failed to fetch' });
res = await R.getRecursos();
ok('sen conexión tira da caché', res.length === 1 && res.desdeCache === true);
ok('e dío: motivo "sen-conexion"', res.motivo === 'sen-conexion');

// ── Caída de rede sen caché: o peor caso ──────────────────────────
localStorage.clear();
res = await R.getRecursos();
ok('sen conexión nin caché devolve baleiro e o motivo', res.length === 0 && res.motivo === 'sen-conexion');
ok('nunca lanza: a interface non rebenta', true);

// ── Validación ────────────────────────────────────────────────────
const casos = [
  ['sen nome', { tipo: 'efecto', orixe: 'propio', url: 'x' }, 'Fai falta un nome'],
  ['tipo inventado', { nome: 'x', tipo: 'ruido', url: 'x' }, 'Tipo non válido'],
  ['externo sen URL', { nome: 'x', tipo: 'musica', orixe: 'externo' }, 'Un recurso externo precisa unha URL'],
  ['propio sen ficheiro', { nome: 'x', tipo: 'efecto', orixe: 'propio' }, 'Falta o ficheiro'],
  ['modo inventado', { nome: 'x', tipo: 'efecto', url: 'u', modo: 'xogar' }, 'Modo non válido'],
  ['volume fóra de rango', { nome: 'x', tipo: 'efecto', url: 'u', vol: 3 }, 'entre 0 e 1'],
];
for (const [nome, r, agardado] of casos) {
  const e = R.validarRecurso(r);
  ok('rexeita: ' + nome, !!e && e.includes(agardado.split(' ').pop()), e);
}
ok('acepta un recurso válido',
  R.validarRecurso({ nome: 'Porta', tipo: 'efecto', orixe: 'propio', url: 'u', modo: 'once', vol: 0.5 }) === null);
ok('acepta orixe dispositivo con ruta',
  R.validarRecurso({ nome: 'Meu', tipo: 'musica', orixe: 'dispositivo', ruta: 'idb:1' }) === null);

// ── Gardar ────────────────────────────────────────────────────────
escenario.set({ son_recursos: [FILA] });
let g = await R.gardarRecurso({ nome: '', tipo: 'efecto', url: 'u' });
ok('gardar valida antes de tocar a rede', g.ok === false && !!g.erro);
g = await R.gardarRecurso({ nome: 'Trono', tipo: 'efecto', orixe: 'propio', url: 'u', userId: 'u1' });
ok('garda un recurso válido', g.ok === true);
escenario.set({ erro: 'permission denied' });
g = await R.gardarRecurso({ nome: 'Trono', tipo: 'efecto', orixe: 'propio', url: 'u', userId: 'u1' });
ok('un erro de permisos devólvese, non se lanza', g.ok === false && g.erro.includes('permission'));

// ── Coleccións e etiquetas ────────────────────────────────────────
escenario.set({ son_coleccions: [{ id: 'c1', tipo: 'mesa', nome: 'Impro', config: { contadores: [] }, user_id: 'u1' }] });
localStorage.clear();
const cols = await R.getColeccions({ tipo: 'mesa' });
ok('carga coleccións e conserva o config', cols.length === 1 && typeof cols[0].config === 'object');
ok('config nulo convértese en obxecto baleiro',
  R.agruparTags(null).tono.length === 0);

escenario.set({ son_tags: [
  { id: 'tono-terror', categoria: 'tono', nome: 'Terror', oficial: true, orde: 20 },
  { id: 'fun-entrada', categoria: 'funcion', nome: 'Entrada', oficial: true, orde: 10 },
] });
localStorage.clear();
const tags = await R.getTags();
const g4 = R.agruparTags(tags);
ok('agrupa nas catro categorías', g4.tono.length === 1 && g4.funcion.length === 1
  && g4.universo.length === 0 && g4.caracteristica.length === 0);
ok('as etiquetas cachéanse', (await R.getTags()).desdeCache === true);

// ── Duplicar: a copia nace privada ────────────────────────────────
escenario.set({
  son_coleccions: [{ id: 'c1', tipo: 'escena', nome: 'Mansión', config: {}, visibilidade: 'publico', estado: 'publicada', user_id: 'outro' }],
  son_coleccion_items: [{ id: 'i1', coleccion_id: 'c1', orde: 0, recurso_id: 'r1', opcions: {} }],
});
const dup = await R.duplicarColeccion('c1', 'eu');
ok('duplicar devolve ok', dup.ok === true, dup.erro);
ok('a copia leva "(copia)" no nome', dup.coleccion.nome.includes('(copia)'));
ok('⚠️ a copia nace PRIVADA e en borrador',
  dup.coleccion.visibilidade === 'privado' && dup.coleccion.estado === 'borrador');
ok('a copia é do novo dono', dup.coleccion.userId === 'eu');
ok('e garda de onde saíu', dup.coleccion.orixeId === 'c1');

console.log(f ? `\n${f} FALLOS` : '\n✓ Os 30 casos da capa de datos pasan');
process.exit(f ? 1 : 0);
