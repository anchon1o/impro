import {
  crearContador, segundos, alternar, reiniciar, aviso,
  formatar, serializar, deserializar, marcarHito,
} from '/home/claude/impro/impro/src/sonido/contadores.js';

let f = 0;
const ok = (t, c, e = '') => { console.log((c ? '✓ ' : '✗ ') + t + (c ? '' : ' — ' + e)); if (!c) f++; };

const T0 = 1_755_000_000_000;

// ── Nacen PARADOS ────────────────────────────────────────────────
const parado = crearContador({ tipo: 'crono' });
ok('un contador novo NON está correndo', parado.correndo === false);
ok('e marca 0 aínda que pase o tempo', segundos(parado, Date.now() + 99_000) === 0);
ok('o reloxo si está "correndo": amosa a hora, non mide',
  crearContador({ tipo: 'reloxo' }).correndo === true);
ok('pódese pedir arrancado explicitamente',
  crearContador({ tipo: 'crono', arrancado: true }).correndo === true);

// ── O caso que importa: a app estivo pechada ──────────────────────
let c = crearContador({ tipo: 'crono', etiqueta: 'Show completo', cor: 'ok', arrancado: true });
c.inicioEn = T0;
ok('30 s → 30', segundos(c, T0 + 30_000) === 30);
ok('a app pecha 20 min e volve co tempo correcto', segundos(c, T0 + 1_230_000) === 1230);
ok('a app pecha 3 horas e segue correcta', segundos(c, T0 + 3 * 3600_000 + 30_000) === 3 * 3600 + 30);

// ── Pausa e retomada ──────────────────────────────────────────────
let p = alternar(c, T0 + 60_000);
ok('ao pausar acumula 60 s', p.acumuladoMs === 60_000 && !p.correndo);
ok('pausado non avanza aínda que pasen 10 min', segundos(p, T0 + 660_000) === 60);
p = alternar(p, T0 + 660_000);
ok('ao retomar segue onde quedou', segundos(p, T0 + 670_000) === 70);
p = reiniciar(p, T0 + 670_000);
ok('reiniciar pon a cero', segundos(p, T0 + 670_000) === 0);
ok('reiniciar non para o contador', p.correndo === true);

// ── Conta atrás ───────────────────────────────────────────────────
let a = crearContador({ tipo: 'atras', minutos: 60, arrancado: true });
a.inicioEn = T0;
ok('conta atrás de 60 min empeza en 3600', segundos(a, T0) === 3600);
ok('tras 47:32 restan 12:28', segundos(a, T0 + (47 * 60 + 32) * 1000) === 12 * 60 + 28);
ok('pásase a negativo ao esgotarse', segundos(a, T0 + 3660_000) === -60);
ok('aviso a 20 min: ningún', aviso(a, T0 + 40 * 60_000) === null);
ok('aviso a 12 min restantes', aviso(a, T0 + 48 * 60_000) === 'aviso');
ok('aviso urxente a 3 min restantes', aviso(a, T0 + 57 * 60_000) === 'urxente');
ok('estado pasado ao esgotarse', aviso(a, T0 + 61 * 60_000) === 'pasado');
ok('un cronómetro non ten avisos', aviso(c, T0 + 999_000) === null);

// ── Reloxo ────────────────────────────────────────────────────────
const r = crearContador({ tipo: 'reloxo' });
ok('o reloxo non ten segundos propios', segundos(r, T0) === null);
ok('o reloxo non se pausa', alternar(r, T0) === r);
ok('etiqueta por defecto do reloxo', r.etiqueta === 'Hora');

// ── Formato ───────────────────────────────────────────────────────
ok('0 → 0:00', formatar(0) === '0:00');
ok('90 → 1:30', formatar(90) === '1:30');
ok('2852 → 47:32', formatar(2852) === '47:32');
ok('3600 → 1:00:00', formatar(3600) === '1:00:00');
ok('3867 → 1:04:27', formatar(3867) === '1:04:27');
ok('-60 → -1:00', formatar(-60) === '-1:00');
ok('null → —', formatar(null) === '—');

// ── Persistencia ──────────────────────────────────────────────────
const lista = [c, a, r];
const cru = JSON.stringify(serializar(lista));
const volta = deserializar(JSON.parse(cru));
ok('sobreviven os tres á serialización', volta.length === 3);
ok('e o valor calculado é idéntico tras ida e volta',
  segundos(volta[0], T0 + 500_000) === segundos(c, T0 + 500_000));
ok('deserializar aguanta lixo', deserializar([null, { tipo: 'inventado' }, 5]).length === 0);
ok('deserializar aguanta un non-array', deserializar('nada').length === 0);

// ── Ids únicos ────────────────────────────────────────────────────
const ids = new Set(Array.from({ length: 200 }, () => crearContador({}).id));
ok('200 contadores seguidos teñen ids distintos', ids.size === 200, ids.size);

// ── Hitos ─────────────────────────────────────────────────────────
let h = marcarHito([], c, 'Primeira escena', T0 + 272_000);
h = marcarHito(h, c, '', T0 + 1_638_000);
ok('dous hitos co segundo do contador', h.length === 2 && h[0].segundos === 272 && h[1].segundos === 1638);
ok('hito sen nome recibe un por defecto', h[1].nome === 'Hito 2');

// ── Validación de entrada ─────────────────────────────────────────
ok('tipo inventado cae en crono', crearContador({ tipo: 'xxx' }).tipo === 'crono');
ok('cor inventada cae en ok', crearContador({ cor: '#ff0000' }).cor === 'ok');
ok('0 minutos non crea unha conta atrás de 0',
  crearContador({ tipo: 'atras', minutos: 0 }).obxectivoMs === 60000);

console.log(f ? `\n${f} FALLOS` : '\n✓ Os 38 casos de contadores pasan');
process.exit(f ? 1 : 0);
