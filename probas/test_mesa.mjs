// Persistencia da mesa. O caso que importa: pechar a app e volver.
import { cargarMesa, gardarMesa, baleirarMesa } from '/home/claude/impro/impro/src/sonido/mesa.js';
import { crearContador, segundos, alternar } from '/home/claude/impro/impro/src/sonido/contadores.js';

const _s = new Map();
globalThis.localStorage = {
  getItem: k => _s.has(k) ? _s.get(k) : null,
  setItem: (k,v) => _s.set(k, String(v)),
  removeItem: k => _s.delete(k), clear: () => _s.clear(),
};

let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};

// ── Sen nada gardado ──────────────────────────────────────────────
let m = cargarMesa();
ok('sen nada gardado devolve unha mesa válida',
  Array.isArray(m.contadores) && m.contadores.length===0 && m.volBus.master===0.8);

// ── Ida e volta ───────────────────────────────────────────────────
const T0 = Date.now() - 120_000;   // arrancou hai 2 minutos
const c1 = { ...crearContador({tipo:'crono',etiqueta:'Show completo',cor:'ok',arrancado:true}), inicioEn:T0 };
const c2 = crearContador({tipo:'atras',etiqueta:'Primeira parte',cor:'info',minutos:45});
const c3 = crearContador({tipo:'reloxo'});
ok('gardar devolve true', gardarMesa({
  contadores:[c1,c2,c3],
  volBus:{musica:0.4,ambientes:0.9,efectos:0.7,master:0.85},
  volRecurso:{'a1':0.35,'m1':0.6},
})===true);

m = cargarMesa();
ok('volven os tres contadores', m.contadores.length===3, m.contadores.length);
ok('cos seus tipos, etiquetas e cores',
  m.contadores[0].etiqueta==='Show completo' && m.contadores[1].tipo==='atras'
  && m.contadores[1].cor==='info' && m.contadores[2].tipo==='reloxo');
ok('⚠️ o cronómetro segue contando desde onde estaba (2 min)',
  Math.round(segundos(m.contadores[0]))===120, Math.round(segundos(m.contadores[0])));
ok('a conta atrás conserva o obxectivo de 45 min', m.contadores[1].obxectivoMs===45*60000);
ok('e segue parada, como estaba', m.contadores[1].correndo===false);
ok('volven os volumes de bus',
  m.volBus.musica===0.4 && m.volBus.ambientes===0.9 && m.volBus.master===0.85);
ok('volven os volumes por recurso', m.volRecurso.a1===0.35 && m.volRecurso.m1===0.6);

// Pausado tamén sobrevive
const pausado = alternar(m.contadores[0]);
gardarMesa({contadores:[pausado], volBus:m.volBus, volRecurso:{}});
const conxelado = segundos(pausado);
await new Promise(r=>setTimeout(r,60));
m = cargarMesa();
ok('un contador pausado non avanza mentres a app está pechada',
  Math.abs(segundos(m.contadores[0]) - conxelado) < 0.5);

// ── Datos corruptos non poden impedir abrir a mesa ────────────────
localStorage.setItem('impro_sonido_mesa_v1','{isto non é json');
m = cargarMesa();
ok('un JSON corrupto non peta: devolve unha mesa baleira',
  m.contadores.length===0 && m.volBus.master===0.8);

localStorage.setItem('impro_sonido_mesa_v1', JSON.stringify({
  contadores:[{tipo:'inventado'},null,5,{tipo:'crono',inicioEn:'x',acumuladoMs:'y'}],
  volBus:{musica:9,ambientes:-3,efectos:'alto',master:null},
  volRecurso:{a1:5,b2:-1,'':0.5,c3:'nada',d4:0.5,e5:null,f6:true},
}));
m = cargarMesa();
ok('descarta contadores inválidos e conserva o bo', m.contadores.length===1, m.contadores.length);
ok('e sanea os seus números', Number.isFinite(m.contadores[0].inicioEn) && m.contadores[0].acumuladoMs===0);
ok('⚠️ recorta volumes fóra de rango en vez de deixar a mesa saturada',
  m.volBus.musica===1 && m.volBus.ambientes===0, JSON.stringify(m.volBus));
ok('⚠️ null e "alto" caen ao defecto, NON a silencio',
  m.volBus.efectos===0.8 && m.volBus.master===0.8, JSON.stringify(m.volBus));
// Todos os xeitos de non dicir nada teñen que caer ao defecto, non a 0.
for (const veneno of [null, undefined, '', ' ', false, true, NaN, Infinity, {}, [], [0], 'alto', '0.5abc']) {
  localStorage.setItem('impro_sonido_mesa_v1', JSON.stringify({volBus:{master:veneno}}));
  const r = cargarMesa();
  ok(`  master=${JSON.stringify(veneno)} → 0.8, non 0`, r.volBus.master===0.8, r.volBus.master);
}
localStorage.setItem('impro_sonido_mesa_v1', JSON.stringify({
  contadores:[{tipo:'inventado'},null,5,{tipo:'crono',inicioEn:'x',acumuladoMs:'y'}],
  volBus:{musica:9,ambientes:-3,efectos:'alto',master:null},
  volRecurso:{a1:5,b2:-1,'':0.5,c3:'nada',d4:0.5,e5:null,f6:true},
}));
m = cargarMesa();
ok('sanea tamén os volumes por recurso',
  m.volRecurso.a1===1 && m.volRecurso.b2===0 && m.volRecurso.d4===0.5
  && m.volRecurso.c3===undefined && m.volRecurso['']===undefined
  && m.volRecurso.e5===undefined && m.volRecurso.f6===undefined,
  JSON.stringify(m.volRecurso));

ok('baleirar limpa', baleirarMesa()===true && cargarMesa().contadores.length===0);

console.log(f?`\n${f} FALLOS`:'\n✓ Os 29 casos da mesa gardada pasan');
process.exit(f?1:0);
