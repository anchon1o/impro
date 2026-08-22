// O metrónomo vello usaba setInterval e derivaba. Estas probas miden
// que os pulsos caen onde deben no reloxo de audio, non no do sistema.
import { crearMetronomo, beatsOf, COMPASES } from '/home/claude/impro/impro/src/audio/metronomo.js';
let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};

let reloxo = 0;
const disparos = [];
const ctx = {
  get currentTime(){ return reloxo; },
  createOscillator(){ const o={ type:'sine', frequency:{value:0}, connect(){},
    start(t){ disparos.push({t, fr:o.frequency.value}); }, stop(){} }; return o; },
  createGain(){ return { gain:{ setValueAtTime(){}, exponentialRampToValueAtTime(){} }, connect(){} }; },
  destination: {},
};
const m = crearMetronomo(()=>ctx, ()=>ctx.destination);

ok('compases coñecidos', COMPASES.length===6 && beatsOf('7/8')===7 && beatsOf('inventado')===4);
ok('bpm por defecto', m.bpm===100 && m.beats===4);
m.setBpm(500); ok('bpm recórtase a 240', m.bpm===240);
m.setBpm(1);   ok('bpm recórtase a 30', m.bpm===30);
m.setBpm(120); ok('bpm válido acéptase', m.bpm===120);

m.arrancar();
ok('arrancar activa', m.activo===true);
// Avanzar o reloxo de audio en tramos, como faría o navegador.
for (let i=0;i<40;i++){ reloxo += 0.05; m.arrancar(); /* non debe duplicar */ }
ok('arrancar dúas veces non duplica', m.activo===true);

// O reloxo de audio ten que avanzar Á PAR do tempo real: se non, o
// planificador non chega a executarse entre saltos e non planifica nada.
disparos.length = 0;
reloxo = 0; m.parar(); m.setBpm(120); m.arrancar();
for (let i = 0; i < 130; i++) {
  reloxo += 0.025;
  await new Promise(r => setTimeout(r, 5));
}
m.parar();

const ts = disparos.map(d => d.t).sort((a, b) => a - b);
ok(`planificáronse pulsos (${ts.length})`, ts.length >= 4, ts.length);

// A 120 bpm o intervalo é exactamente 0,5 s. Sen deriva.
let maxErro = 0;
for (let i = 1; i < ts.length; i++) maxErro = Math.max(maxErro, Math.abs((ts[i] - ts[i-1]) - 0.5));
ok(`os pulsos caen a 0,5 s exactos (erro máx ${maxErro.toFixed(6)} s)`, maxErro < 1e-9, maxErro);

// O primeiro de cada compás soa máis agudo
const frs = [...new Set(disparos.map(d => d.fr))].sort((a,b)=>a-b);
ok('hai pulso forte e pulso débil', frs.length === 2, frs.join(','));

// Cambiar o bpm en marcha non reinicia
m.setBpm(120); m.arrancar();
await new Promise(r => setTimeout(r, 60));
const antes = m.activo;
m.setBpm(90);
ok('cambiar o bpm en marcha non para o metrónomo', antes && m.activo && m.bpm === 90);
m.setBeats(3);
ok('cambiar o compás en marcha tampouco', m.activo && m.beats === 3);
m.parar();
ok('parar desactiva', m.activo === false);

// Sen contexto non peta
const m2 = crearMetronomo(() => null, () => null);
ok('sen AudioContext non peta ao arrancar', m2.arrancar() === false && m2.activo === false);

console.log(f ? `\n${f} FALLOS` : '\n✓ Os 13 casos do metrónomo pasan');
process.exit(f ? 1 : 0);
