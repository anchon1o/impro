// Probas do almacén local contra unha IndexedDB de verdade
// (fake-indexeddb implementa a especificación, non é un stub meu).
// O que importa: que un son gardado siga aí DESPOIS de recargar.
import '/home/claude/impro/impro/node_modules/fake-indexeddb/auto/index.mjs';
import {
  dispoñible, gardarFicheiro, listarFicheiros, borrarFicheiro,
  actualizarMeta, formatarBytes,
} from '/home/claude/impro/impro/src/audio/almacen.js';

let f = 0;
const ok = (t, c, e = '') => { console.log((c ? '✓ ' : '✗ ') + t + (c ? '' : ' — ' + e)); if (!c) f++; };

// URL.createObjectURL non existe en Node: só fai falta que devolva algo.
let creadas = 0, liberadas = 0;
globalThis.URL.createObjectURL = () => { creadas++; return 'blob:proba/' + creadas; };
globalThis.URL.revokeObjectURL = () => { liberadas++; };

function ficheiro(nome, bytes = 2048, mime = 'audio/mpeg') {
  const b = new Blob([new Uint8Array(bytes)], { type: mime });
  b.name = nome;
  b.lastModified = Date.now();
  return b;
}

ok('IndexedDB detéctase como dispoñible', dispoñible() === true);
ok('empeza baleiro', (await listarFicheiros()).length === 0);

// ── Gardar ────────────────────────────────────────────────────────
const id1 = await gardarFicheiro(ficheiro('Porta pesada.mp3', 4096), {
  nome: 'Porta pesada', tipo: 'efecto', emoji: '⚡', vol: 0.8, modo: 'once',
});
ok('gardar devolve un id', typeof id1 === 'string' && id1.startsWith('disp-'));

await gardarFicheiro(ficheiro('Choiva.m4a', 900_000), {
  nome: 'Choiva', tipo: 'ambiente', emoji: '🌧', vol: 0.35, modo: 'loop',
});
await gardarFicheiro(ficheiro('Jazz.mp3', 5_000_000), {
  nome: 'Jazz escuro', tipo: 'musica', emoji: '🎵', vol: 0.7, modo: 'loop',
});

let lista = await listarFicheiros();
ok('gardáronse os tres', lista.length === 3, lista.length);
ok('veñen ordenados por nome', lista.map((r) => r.nome).join(',') === 'Choiva,Jazz escuro,Porta pesada',
  lista.map((r) => r.nome).join(','));
ok('cada un trae unha URL usable', lista.every((r) => r.url && r.url.startsWith('blob:')));
ok('conserva tipo, volume e modo',
  lista.find((r) => r.nome === 'Choiva').tipo === 'ambiente'
  && lista.find((r) => r.nome === 'Choiva').vol === 0.35
  && lista.find((r) => r.nome === 'Choiva').modo === 'loop');
ok('marca a orixe como dispositivo', lista.every((r) => r.orixe === 'dispositivo'));
ok('garda o tamaño', lista.find((r) => r.nome === 'Jazz escuro').bytes === 5_000_000);
ok('NON devolve o blob (non fai falta na lista)', lista.every((r) => r.blob === undefined));

// ── ⚠️ O QUE IMPORTA: sobrevivir a recargar ──────────────────────
// Simúlase descartando todo o estado do módulo e volvendo importar.
// Se os ficheiros dependesen de URLs de obxecto ou de memoria, aquí
// desaparecerían: é exactamente o que pasaba antes.
const mod = await import('/home/claude/impro/impro/src/audio/almacen.js?recarga=1');
const trasRecargar = await mod.listarFicheiros();
ok('⚠️ os tres sons seguen aí tras recargar', trasRecargar.length === 3, trasRecargar.length);
ok('e seguen sendo reproducibles', trasRecargar.every((r) => r.url));

// ── Editar ────────────────────────────────────────────────────────
ok('renomear devolve true', (await actualizarMeta(id1, { nome: 'Porta de taberna' })) === true);
lista = await listarFicheiros();
ok('o nome novo persiste', !!lista.find((r) => r.nome === 'Porta de taberna'));
ok('e o ficheiro non se perdeu ao editar a meta',
  !!lista.find((r) => r.nome === 'Porta de taberna').url);
ok('seguen sendo tres', lista.length === 3);

await actualizarMeta(id1, { tipo: 'ambiente', modo: 'loop', vol: 0.35 });
lista = await listarFicheiros();
const cambiado = lista.find((r) => r.id === id1);
ok('cambiar de tipo persiste', cambiado.tipo === 'ambiente' && cambiado.modo === 'loop');
ok('editar un id inexistente devolve false', (await actualizarMeta('non-existe', { nome: 'x' })) === false);

// ── Borrar ────────────────────────────────────────────────────────
await borrarFicheiro(id1);
lista = await listarFicheiros();
ok('borrar quita o ficheiro', lista.length === 2 && !lista.find((r) => r.id === id1));
ok('borrar dúas veces non peta', (await borrarFicheiro(id1)) === true);

// ── Ids únicos ────────────────────────────────────────────────────
const ids = [];
for (let i = 0; i < 30; i++) ids.push(await gardarFicheiro(ficheiro('x' + i + '.mp3', 10), { nome: 'x' + i }));
ok('30 ficheiros seguidos teñen ids distintos', new Set(ids).size === 30);
ok('e están todos', (await listarFicheiros()).length === 32);
for (const id of ids) await borrarFicheiro(id);

// ── Formato de tamaños ────────────────────────────────────────────
ok('0 B', formatarBytes(0) === '0 B');
ok('512 B', formatarBytes(512) === '512 B');
ok('4 kB', formatarBytes(4096) === '4 kB');
ok('4,8 MB', formatarBytes(5_000_000) === '4.8 MB', formatarBytes(5_000_000));

console.log(f ? `\n${f} FALLOS` : '\n✓ Os 24 casos do almacén pasan');
process.exit(f ? 1 : 0);
