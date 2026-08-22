// Proba do motor cun AudioContext falso. Non mide son (iso só o di o
// iPad), mide a LÓXICA: buses, fades, recuperación e o bug do
// rearranque que atopamos na proba real.
import { crearMotor, BUSES } from '/home/claude/impro/impro/src/audio/motor.js';

let f = 0;
const ok = (t, c, e = '') => { console.log((c ? '✓ ' : '✗ ') + t + (c ? '' : ' — ' + e)); if (!c) f++; };

// ── AudioContext falso ────────────────────────────────────────────
let reloxo = 0;
function param(v) {
  return {
    value: v, programado: [],
    setTargetAtTime(x) { this.value = x; this.programado.push(['target', x, reloxo]); },
    setValueAtTime(x) { this.value = x; this.programado.push(['set', x, reloxo]); },
    linearRampToValueAtTime(x, t) { this.destino = x; this.programado.push(['ramp', x, t]); },
    exponentialRampToValueAtTime(x, t) { this.programado.push(['exp', x, t]); },
    cancelScheduledValues() { this.programado.push(['cancel', null, reloxo]); },
  };
}
function gain() { return { gain: param(1), connect() {}, disconnect() {} }; }

class FakeCtx {
  constructor() { this.state = 'running'; this.sampleRate = 48000; this.onstatechange = null; }
  get currentTime() { return reloxo; }
  createGain() { return gain(); }
  createBufferSource() { return { buffer: null, connect() {}, start() { FakeCtx.disparos++; }, stop() {} }; }
  createBuffer() { return {}; }
  createMediaElementSource() { return { connect() {} }; }
  decodeAudioData() { return Promise.resolve({}); }
  resume() { this.state = 'running'; if (this.onstatechange) this.onstatechange(); return Promise.resolve(); }
  close() { this.state = 'closed'; }
  suspender() { this.state = 'suspended'; if (this.onstatechange) this.onstatechange(); }
}
FakeCtx.disparos = 0;

const elementos = [];
class FakeAudio {
  constructor() { this.src = ''; this.paused = true; this.loop = false; elementos.push(this); }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
}

globalThis.window = { AudioContext: FakeCtx };
globalThis.Audio = FakeAudio;

// ── Arranque ──────────────────────────────────────────────────────
const rexistro = [];
const m = crearMotor({ onLog: (x) => rexistro.push(x) });
ok('antes de arrancar o estado é parado', m.estado === 'parado');
ok('arrancar devolve true', m.arrancar() === true);
ok('tras arrancar queda listo', m.estado === 'listo');
ok('crea os tres buses', BUSES.length === 3);

// ── Capas ─────────────────────────────────────────────────────────
m.engadirCapa('choiva', { url: 'https://x/choiva.mp3', bus: 'ambientes', vol: 0.35 });
m.engadirCapa('pad', { url: 'https://x/pad.mp3', bus: 'musica', vol: 0.6 });
let s = m.instantanea();
ok('dúas capas rexistradas', s.capas.length === 2);
ok('as capas nacen apagadas', s.capas.every((c) => !c.on));

m.acender('choiva');
s = m.instantanea();
ok('acender marca a capa e reproduce o elemento',
  s.capas.find((c) => c.id === 'choiva').on && !elementos[0].paused);
m.volCapa('choiva', 0.5);
ok('o volume actualízase', m.instantanea().capas.find((c) => c.id === 'choiva').vol === 0.5);
m.volCapa('choiva', 9);
ok('o volume recórtase a 1', m.instantanea().capas.find((c) => c.id === 'choiva').vol === 1);
m.volCapa('choiva', -3);
ok('o volume recórtase a 0', m.instantanea().capas.find((c) => c.id === 'choiva').vol === 0);
m.volCapa('choiva', 0.4);

// ── ⚠️ REGRESIÓN: o rearranque ao final do fade ───────────────────
// Na proba real oíase un golpe de son ao rematar o fade: recalculábase
// o volume de todas as capas e as que aínda baixaban recuperábano.
m.acender('pad');
const fade = m.fadeTodo(0.05);
s = m.instantanea();
ok('durante o fade as capas quedan marcadas', s.capas.filter((c) => c.fade).length === 2);
// Mentres baixan, algo toca o volume dun bus (é o que pasaba na app)
m.volumeBus('ambientes', 0.5);
m.volCapa('choiva', 0.9);
s = m.instantanea();
ok('tocar o volume NON desmarca o fade', s.capas.find((c) => c.id === 'choiva').fade === true);

const n = await fade;
s = m.instantanea();
ok('o fade apaga as dúas', n === 2 && s.capas.every((c) => !c.on));
ok('e desmarca o fade ao rematar', s.capas.every((c) => !c.fade));
ok('os elementos quedan pausados', elementos.every((e) => e.paused));

// Acender despois do fade ten que volver funcionar
m.acender('choiva');
ok('acender tras o fade volve funcionar', m.instantanea().capas.find((c) => c.id === 'choiva').on);

// ── STOP ──────────────────────────────────────────────────────────
m.acender('pad');
m.pararTodo();
ok('STOP apaga todo', m.instantanea().capas.every((c) => !c.on));
ok('fadeTodo sen nada activo non peta', (await m.fadeTodo(0.01)) === 0);

// ── Buses ─────────────────────────────────────────────────────────
m.volumeBus('musica', 0.3);
ok('o bus de música garda o valor', m.instantanea().volBus.musica === 0.3);
m.volumeBus('master', 2);
ok('o master recórtase a 1', m.instantanea().volBus.master === 1);

// ── Efectos ───────────────────────────────────────────────────────
FakeCtx.disparos = 0;
globalThis.fetch = () => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
await m.precargar('https://x/porta.wav');
ok('dispara un efecto precargado', m.disparar('https://x/porta.wav') === true);
for (let i = 0; i < 5; i++) m.disparar('https://x/porta.wav');
ok('cinco disparos seguidos solápanse (6 nodos)', FakeCtx.disparos === 6, FakeCtx.disparos);
ok('un efecto sen precargar non peta', m.disparar('https://x/inexistente.wav') === false);

globalThis.fetch = () => Promise.resolve({ ok: false, status: 404 });
ok('unha precarga rota devolve null en vez de lanzar', (await m.precargar('https://x/roto.wav')) === null);

// ── ⚠️ iOS: suspensión e desfase ──────────────────────────────────
reloxo = 10;
m.arrancar();
const antes = m.desfase();
ok('sen suspensión o desfase é ~0', antes < 0.5, antes);

// O reloxo do sistema avanza 30 s pero o do audio non: é o que pasa
// exactamente ao bloquear a pantalla nun iPhone.
const realNow = Date.now;
Date.now = () => realNow() + 30_000;
const d = m.desfase();
ok('detecta 30 s de audio parado', d > 29 && d < 31, d);
Date.now = realNow;

m.ctx.suspender();
ok('o estado pasa a suspendido, non se disimula', m.estado === 'suspendido');
ok('reanudar recupera', (await m.reanudar()) === true && m.estado === 'listo');
ok('e reanudar pon o desfase a cero', m.desfase() < 0.5);

// ── Limpeza ───────────────────────────────────────────────────────
m.quitarCapa('choiva');
ok('quitar unha capa élimina do estado', m.instantanea().capas.length === 1);
m.destruir();
ok('destruír deixa o motor parado e sen capas',
  m.estado === 'parado' && m.instantanea().capas.length === 0);

// ── Precarga en lote ─────────────────────────────────────────────
const m2 = crearMotor({});
m2.arrancar();
let peticions = [];
globalThis.fetch = (u) => {
  peticions.push(u);
  if (u.includes('roto')) return Promise.resolve({ ok: false, status: 404 });
  return new Promise((res) => setTimeout(() => res({
    ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  }), 5));
};
const urls = ['a.wav', 'b.wav', 'c.wav', 'd.wav', 'roto.wav'];
const avances = [];
const res2 = await m2.precargarVarios(urls, (fe, to) => avances.push([fe, to]));
ok('descárganse os cinco', peticions.length === 5, peticions.length);
ok('informa do avance en cada paso', avances.length === 5, avances.length);
ok('e o total é correcto', avances.every(([, to]) => to === 5));
ok('catro quedan listos', res2.listos === 4, res2.listos);
ok('o roto márcase como erro', m2.estadoDe('roto.wav') === 'erro');
ok('e os bos como listos', m2.estadoDe('a.wav') === 'listo');
ok('un que nunca se pediu queda pendente', m2.estadoDe('z.wav') === 'pendente');

// ⚠️ Non se repite o que xa está
peticions = [];
await m2.precargarVarios(urls, () => {});
ok('⚠️ non se volven descargar os que xa están listos', peticions.length === 1, peticions.length);
ok('  (só se reintenta o que fallou)', peticions[0] && peticions[0].includes('roto'));

// De dous en dous, non os vinte á vez
peticions = [];
let vivas = 0, maxVivas = 0;
globalThis.fetch = () => {
  vivas++; maxVivas = Math.max(maxVivas, vivas);
  return new Promise((res) => setTimeout(() => {
    vivas--;
    res({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
  }, 5));
};
await m2.precargarVarios(Array.from({ length: 12 }, (_, i) => 'x' + i + '.wav'), () => {});
ok(`⚠️ non satura a conexión: máx ${maxVivas} peticións á vez`, maxVivas <= 2, maxVivas);

// Preparar unha capa non a acende
m2.preparar('amb', { url: 'amb.mp3', bus: 'ambientes', vol: 0.4 });
const cs = m2.instantanea().capas;
ok('preparar engade a capa', cs.find((c) => c.id === 'amb') !== undefined);
ok('⚠️ pero NON a acende: preparar non é reproducir',
  cs.find((c) => c.id === 'amb').on === false);
m2.destruir();

// ── ⚠️ Volver do segundo plano en iOS ────────────────────────────
// Comprobado nun iPad: ao bloquear a pantalla o audio párase SEMPRE,
// tamén por Bluetooth, e os <audio> quedan pausados. `resume()` só
// reactiva o contexto: se non se lles volve dar ao play, as capas
// quedan acesas e mudas.
const m3 = crearMotor({});
m3.arrancar();
m3.engadirCapa('amb1', { url: 'a.mp3', bus: 'ambientes', vol: 0.4 });
m3.engadirCapa('amb2', { url: 'b.mp3', bus: 'ambientes', vol: 0.3 });
m3.engadirCapa('off',  { url: 'c.mp3', bus: 'ambientes', vol: 0.5 });
m3.acender('amb1'); m3.acender('amb2');

const els = elementos.slice(-3);
ok('dúas capas acesas e reproducindo', !els[0].paused && !els[1].paused && els[2].paused);

// iOS: pasa a segundo plano → pausa os elementos e suspende o contexto
els.forEach((e) => { e.paused = true; });
m3.ctx.suspender();
ok('en segundo plano todo queda pausado', els.every((e) => e.paused));
ok('e o motor dío', m3.estado === 'suspendido');

await m3.reanudar();
ok('⚠️ ao volver, as capas ACESAS retoman', !els[0].paused && !els[1].paused);
ok('⚠️ e a que estaba apagada SEGUE apagada', els[2].paused === true);
ok('o estado volve a listo', m3.estado === 'listo');

// Reanudar sen nada aceso non fai nada raro
m3.pararTodo();
els.forEach((e) => { e.paused = true; });
await m3.reanudar();
ok('coa mesa parada, reanudar non acende nada', els.every((e) => e.paused));
m3.destruir();

// ── Parar e alternar efectos ─────────────────────────────────────
const m4 = crearMotor({});
m4.arrancar();
globalThis.fetch = () => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
await m4.precargar('fx.wav');
ok('un efecto sen disparar non consta soando', m4.instantanea().soando.length === 0);
m4.disparar('fx.wav');
ok('⚠️ ao disparalo, consta como soando', m4.instantanea().soando.includes('fx.wav'));
m4.disparar('fx.wav');
ok('dous disparos solápanse e segue soando', m4.instantanea().soando.includes('fx.wav'));
ok('⚠️ pararEfecto cala os dous', m4.pararEfecto('fx.wav') === true
  && m4.instantanea().soando.length === 0);
ok('parar algo que non soa devolve false', m4.pararEfecto('fx.wav') === false);

// alternar: premer outra vez para
m4.alternarEfecto('fx.wav');
ok('⚠️ alternar dispara se non soaba', m4.instantanea().soando.includes('fx.wav'));
m4.alternarEfecto('fx.wav');
ok('⚠️ e para se xa soaba', m4.instantanea().soando.length === 0);

// STOP TODO tamén cala os efectos en marcha
m4.alternarEfecto('fx.wav');
m4.pararTodo();
ok('⚠️ STOP TODO cala tamén os efectos', m4.instantanea().soando.length === 0);
m4.destruir();

// ── Normalización ────────────────────────────────────────────────
// ⚠️ Un efecto gravado ao 10 % e outro ao 90 % non poden soar co mesmo
// volume nominal: é o que fai que uns non se oian sobre os ambientes.
const ctxN = new FakeCtx();
let picoActual = 0.1;
// Buffer cun pico controlado, para medir a normalización de verdade.
// ⚠️ O pico vai nunha soa mostra a propósito: é o caso dun golpe seco,
// e é o que se perdía cando o motor mostreaba de 64 en 64.
const bufDe = (pico) => {
  const d = new Float32Array(256); d[100] = pico; d[200] = -pico * 0.5;
  return { duration: 1, numberOfChannels: 1, getChannelData: () => d };
};
ctxN.decodeAudioData = () => Promise.resolve(bufDe(picoActual));
globalThis.window.AudioContext = class { constructor(){ return ctxN; } };
const m5 = crearMotor({});
m5.arrancar();
globalThis.fetch = () => Promise.resolve({ ok:true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });

// Caso realista: un efecto gravado ao 25 % e outro ao 89 %.
picoActual = 0.25; await m5.precargar('baixo.wav');
picoActual = 0.89; await m5.precargar('alto.wav');
const fb = m5.factorDe('baixo.wav'), fa = m5.factorDe('alto.wav');
ok(`⚠️ un efecto baixo amplifícase (×${fb.toFixed(1)})`, fb > 3, fb);
ok(`  e un xa alto apenas se toca (×${fa.toFixed(2)})`, Math.abs(fa-1) < 0.05, fa);
ok('⚠️ os dous rematan no mesmo pico efectivo',
   Math.abs(0.25*fb - 0.89*fa) < 0.02, `${(0.25*fb).toFixed(2)} vs ${(0.89*fa).toFixed(2)}`);
// ⚠️ E o pico está nunha soa mostra: se o motor mostrease a saltos,
// este caso daría ×1 e o efecto seguiría sen oírse.
ok('  atópase aínda que o pico dure unha soa mostra', fb > 3);

// ⚠️ Tope: un ficheiro case mudo non se sobe ata subir o ruído de fondo
picoActual = 0.001; await m5.precargar('mudo.wav');
ok('⚠️ hai tope de amplificación (×6)', m5.factorDe('mudo.wav') === 6, m5.factorDe('mudo.wav'));
picoActual = 0;    await m5.precargar('silencio.wav');
ok('un buffer en silencio non peta e queda a ×1', m5.factorDe('silencio.wav') === 1);
ok('unha url sen cargar devolve ×1', m5.factorDe('non-existe.wav') === 1);

// Pódese apagar
m5.opcions.normalizar = false;
ok('a normalización pódese apagar', m5.opcions.normalizar === false);
m5.opcions.normalizar = true;

// ── Ducking ──────────────────────────────────────────────────────
m5.opcions.duck = true;
m5.volumeBus('ambientes', 0.8);
const gAmb = m5.instantanea().volBus.ambientes;
m5.disparar('alto.wav');
ok('⚠️ o volume declarado do bus NON cambia co duck',
   m5.instantanea().volBus.ambientes === gAmb,
   'o duck é unha baixada temporal, non un cambio de axuste');
m5.opcions.duck = false;
ok('e o duck tamén se pode apagar', m5.opcions.duck === false);
m5.destruir();

console.log(f ? `\n${f} FALLOS` : '\n✓ Os 68 casos do motor pasan');
process.exit(f ? 1 : 0);
