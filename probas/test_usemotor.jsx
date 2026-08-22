// Proba de useMotor con render real e act(). O que se mide aquí é o
// que non se ve no motor: agrupación de redebuxos, ciclo de vida de
// iOS e limpeza ao desmontar.
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useMotor, useWakeLock, useReloxo } from '/home/claude/impro/impro/src/sonido/useMotor.js';
import { useViewport, BP } from '/home/claude/impro/impro/src/core.jsx';

let f = 0;
const ok = (t, c, e = '') => { console.log((c ? '✓ ' : '✗ ') + t + (c ? '' : ' — ' + e)); if (!c) f++; };

let api = null;
let redebuxos = 0;
function Sonda() {
  api = useMotor();
  redebuxos += 1;
  return null;
}

// A instantánea agrúpase por fotograma, así que tras mutar hai que
// deixar pasar un cadro antes de mirar o estado de React. Non é un
// atraso artificial: é exactamente o que fai o navegador.
const cadro = () => act(async () => { await new Promise((res) => setTimeout(res, 25)); });

async function montar(Comp) {
  let r = null;
  await act(async () => { r = TestRenderer.create(<Comp />); });
  await act(async () => { await new Promise((res) => setTimeout(res, 20)); });
  return r;
}

const r = await montar(Sonda);
ok('nace parado', api.estado === 'parado' && !api.arrancado);
ok('sen capas', api.capas.length === 0);

await act(async () => { api.arrancar(); });
ok('arrancar deixa o motor listo', api.estado === 'listo' && api.listo);

await act(async () => {
  api.engadirCapa('choiva', { url: 'https://x/a.mp3', bus: 'ambientes', vol: 0.4 });
  api.engadirCapa('pad', { url: 'https://x/b.mp3', bus: 'musica', vol: 0.6 });
});
await cadro();
ok('as capas aparecen no estado de React', api.capas.length === 2, api.capas.length);

// ── Agrupación: 50 cambios de volume seguidos ────────────────────
redebuxos = 0;
await act(async () => {
  for (let i = 0; i <= 50; i++) api.volCapa('choiva', i / 50);
});
await act(async () => { await new Promise((res) => setTimeout(res, 40)); });
ok(`50 cambios de volume non provocan 50 redebuxos (foron ${redebuxos})`, redebuxos <= 5, redebuxos);
ok('e o valor final é o correcto', api.capas.find((c) => c.id === 'choiva').vol === 1);

// ── Ciclo de vida de iOS ─────────────────────────────────────────
await act(async () => { api.acender('choiva'); });
await cadro();
ok('a capa quedou acesa', api.capas.find((c) => c.id === 'choiva').on === true);

// Sae da app
document.hidden = true;
await act(async () => { document.disparar('visibilitychange'); });
// iOS suspende o contexto mentres está fóra
await act(async () => { api.motor.ctx.suspender(); });
await cadro();
ok('mentres está fóra, o estado é suspendido', api.estado === 'suspendido');

// Volve
document.hidden = false;
await act(async () => { document.disparar('visibilitychange'); });
await act(async () => { await new Promise((res) => setTimeout(res, 30)); });
ok('ao volver recupérase só', api.estado === 'listo');
ok('e avisa de que houbo son perdido', api.perdido !== null, api.perdido);

await act(async () => { api.descartarAviso(); });
await cadro();
ok('o aviso pódese descartar', api.perdido === null);

// Sen nada soando non debe molestar
await act(async () => { api.pararTodo(); });
await cadro();
document.hidden = true;
await act(async () => { document.disparar('visibilitychange'); });
document.hidden = false;
await act(async () => { document.disparar('visibilitychange'); });
await act(async () => { await new Promise((res) => setTimeout(res, 30)); });
ok('coa mesa parada NON avisa ao volver', api.perdido === null, api.perdido);

// ── Limpeza ──────────────────────────────────────────────────────
const ctxAntes = api.motor.ctx;
await act(async () => { r.unmount(); });
ok('ao desmontar péchase o AudioContext', ctxAntes.state === 'closed', ctxAntes.state);

// ── Wake Lock ────────────────────────────────────────────────────
let wl = null;
function SondaWL({ activo }) { wl = useWakeLock(activo); return null; }
let r2 = null;
await act(async () => { r2 = TestRenderer.create(<SondaWL activo={false} />); });
ok('wake lock inactivo por defecto', wl === 'inactivo');

navigator.wakeLock = { request: () => Promise.resolve({ release() { this.solto = true; }, addEventListener() {} }) };
await act(async () => { r2.update(<SondaWL activo />); });
await act(async () => { await new Promise((res) => setTimeout(res, 20)); });
ok('wake lock actívase cando se pide', wl === 'activo', wl);

navigator.wakeLock = { request: () => Promise.reject(new Error('non permitido')) };
await act(async () => { r2.update(<SondaWL activo={false} />); });
await act(async () => { r2.update(<SondaWL activo />); });
await act(async () => { await new Promise((res) => setTimeout(res, 20)); });
ok('un rexeitamento non peta: repórtase', wl === 'rexeitado', wl);

delete navigator.wakeLock;
await act(async () => { r2.update(<SondaWL activo={false} />); });
await act(async () => { r2.update(<SondaWL activo />); });
await act(async () => { await new Promise((res) => setTimeout(res, 20)); });
ok('sen soporte tamén se reporta', wl === 'non-soportado', wl);
await act(async () => { r2.unmount(); });

// ── useReloxo: un só intervalo ───────────────────────────────────
let tics = 0;
function SondaReloxo() { useReloxo(true, 10); tics += 1; return null; }
let r3 = null;
await act(async () => { r3 = TestRenderer.create(<SondaReloxo />); });
await act(async () => { await new Promise((res) => setTimeout(res, 60)); });
const durante = tics;
ok('o reloxo redebuxa periodicamente', durante > 2, durante);
await act(async () => { r3.unmount(); });
await new Promise((res) => setTimeout(res, 60));
ok('e para ao desmontar (sen intervalos orfos)', tics === durante, `${durante} → ${tics}`);

// ── Cortes de pantalla ───────────────────────────────────────────
let vp = null;
function SondaVP() { vp = useViewport(); return null; }
const anchos = [
  [390, 'esMovil', 'iPhone'],
  [768, 'esTablet', 'iPad vertical'],
  [1024, 'esTabletH', 'iPad horizontal'],
  [1440, 'esEscritorio', 'escritorio'],
];
for (const [w, bandeira, nome] of anchos) {
  window.innerWidth = w;
  let rv = null;
  await act(async () => { rv = TestRenderer.create(<SondaVP />); });
  ok(`${w}px (${nome}) → ${bandeira}`, vp[bandeira] === true, JSON.stringify(vp));
  await act(async () => { rv.unmount(); });
}
window.innerWidth = 1024;
let rv2 = null;
await act(async () => { rv2 = TestRenderer.create(<SondaVP />); });
ok('⚠️ un iPad horizontal xa NON se confunde con escritorio',
  vp.esTabletH === true && vp.esEscritorio === false);
ok('e esPC segue certo: non se rompeu o que xa usaban as outras pantallas', vp.esPC === true);
await act(async () => { rv2.unmount(); });
ok('BP conserva os cortes vellos', BP.movil === 520 && BP.tablet === 900);

console.log(f ? `\n${f} FALLOS` : '\n✓ Os 24 casos de useMotor pasan');
process.exit(f ? 1 : 0);
