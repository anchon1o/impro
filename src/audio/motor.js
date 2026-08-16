// ═══════════════════════════════════════════════════════════════════
// SONIDO · motor de audio
// ═══════════════════════════════════════════════════════════════════
// ⚠️ Este ficheiro NON importa React, e non debe facelo nunca.
// O audio non pode depender do ciclo de render: un redebuxo no medio
// dun show non pode cortar un son. React subscríbese (useMotor.js) e
// limítase a reflectir o estado.
//
// Estrutura de buses:
//
//        ┌── musica    ──┐
//   ─────┼── ambientes ──┼── master ── destination
//        └── efectos   ──┘
//
// Dúas estratexias de reprodución, non unha:
//   · EFECTOS  → AudioBuffer decodificado + BufferSource por disparo.
//     Latencia case nula e solápanse sen límite. Un `new Audio()` tarda
//     de máis e non se pode disparar dúas veces á vez.
//   · AMBIENTES e MÚSICA → MediaElementSource sobre <audio>. Son
//     ficheiros longos; metelos nun buffer come memoria e nun iPad iso
//     acaba coa pestana morta.
// ═══════════════════════════════════════════════════════════════════

export const BUSES = ['musica', 'ambientes', 'efectos'];

// Estados posibles do motor, para que a interface poida ser sincera.
// «suspendido» é o caso de iOS ao bloquear a pantalla: NON se disimula.
export const ESTADOS = ['parado', 'listo', 'suspendido', 'erro'];

const nada = () => {};

export function crearMotor(opcions = {}) {
  const avisar = opcions.onCambio || nada;
  const rexistrar = opcions.onLog || nada;

  let ctx = null;
  let master = null;
  const busNodes = {};
  const capas = new Map();      // id → {tipo, gain, el, buffer, on, vol, fade}
  const buffers = new Map();    // url → AudioBuffer
  let estado = 'parado';
  let volBus = { musica: 0.8, ambientes: 0.8, efectos: 0.8, master: 0.8 };
  let refWall = 0, refAudio = 0;

  function cambiou() { avisar(instantanea()); }

  function instantanea() {
    return {
      estado,
      desfase: desfase(),
      volBus: { ...volBus },
      capas: [...capas.entries()].map(([id, c]) => ({
        id, tipo: c.tipo, bus: c.bus, on: c.on, vol: c.vol,
        fade: c.fade, cargando: c.cargando, erro: c.erro,
      })),
    };
  }

  // Diferenza entre o reloxo do sistema e o do AudioContext. Se iOS
  // suspende o audio, o primeiro segue e o segundo párase: a diferenza
  // di, en segundos, canto tempo estivo mudo. É a única medida fiable
  // de que o son se perdeu, porque `ctx.state` pode mentir un instante.
  function desfase() {
    if (!ctx || !refWall) return 0;
    return Math.max(0, (Date.now() - refWall) / 1000 - (ctx.currentTime - refAudio));
  }

  // ── ARRANQUE ─────────────────────────────────────────────────────
  // Ten que chamarse DENTRO dun xesto do usuario. Sen iso, en iOS non
  // soa nada e ademais non hai erro: simplemente non se oe.
  function arrancar() {
    if (ctx) { return reanudar(); }
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) { estado = 'erro'; rexistrar('Sen Web Audio neste navegador'); cambiou(); return false; }

    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volBus.master;
    master.connect(ctx.destination);
    for (const b of BUSES) {
      busNodes[b] = ctx.createGain();
      busNodes[b].gain.value = volBus[b];
      busNodes[b].connect(master);
    }

    // Buffer mudo: é o que desbloquea o audio en iOS.
    try {
      const s = ctx.createBufferSource();
      s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      s.connect(master);
      s.start();
    } catch (e) { rexistrar('desbloqueo: ' + e.message); }

    refWall = Date.now();
    refAudio = ctx.currentTime;
    estado = ctx.state === 'running' ? 'listo' : 'suspendido';

    ctx.onstatechange = () => {
      estado = ctx.state === 'running' ? 'listo' : 'suspendido';
      rexistrar('AudioContext → ' + ctx.state);
      cambiou();
    };
    rexistrar('motor listo · ' + ctx.sampleRate + ' Hz');
    cambiou();
    return true;
  }

  // Ao volver do segundo plano. Devolve unha promesa: a interface debe
  // esperar antes de dicir que todo está ben.
  function reanudar() {
    if (!ctx) return Promise.resolve(false);
    if (ctx.state === 'running') { refWall = Date.now(); refAudio = ctx.currentTime; cambiou(); return Promise.resolve(true); }
    return ctx.resume().then(() => {
      refWall = Date.now(); refAudio = ctx.currentTime;
      estado = 'listo'; rexistrar('audio recuperado'); cambiou(); return true;
    }).catch((e) => {
      estado = 'suspendido'; rexistrar('non se puido recuperar: ' + e.message); cambiou(); return false;
    });
  }

  // ── CAPAS CONTINUAS (ambientes e música) ─────────────────────────
  function engadirCapa(id, { url, bus = 'ambientes', vol = 0.8, loop = true, tipo = 'ambiente' }) {
    if (!ctx) return null;
    if (capas.has(id)) quitarCapa(id);

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(busNodes[bus] || busNodes.ambientes);

    const el = new Audio();
    el.crossOrigin = 'anonymous';
    el.loop = loop;
    el.preload = 'auto';
    const capa = { tipo, bus, gain, el, on: false, vol, fade: false, cargando: true, erro: null, fonte: null };
    capas.set(id, capa);

    // ⚠️ Un fallo de carga NON pode quedar mudo. É a lección de A04:
    // se algo falla, dise; non se disimula cun botón que non fai nada.
    el.onerror = () => {
      capa.cargando = false;
      capa.erro = 'non se puido cargar';
      rexistrar('erro ao cargar ' + id);
      cambiou();
    };
    el.oncanplay = () => { if (capa.cargando) { capa.cargando = false; cambiou(); } };

    el.src = url;
    try {
      capa.fonte = ctx.createMediaElementSource(el);
      capa.fonte.connect(gain);
    } catch (e) {
      capa.erro = 'fonte non válida';
      rexistrar('createMediaElementSource: ' + e.message);
    }
    cambiou();
    return capa;
  }

  function acender(id, si = true) {
    const c = capas.get(id);
    if (!c || !ctx) return false;
    c.fade = false;                                  // tocar cancela o fade
    c.gain.gain.cancelScheduledValues(ctx.currentTime);
    c.on = si;
    if (si) {
      c.gain.gain.setTargetAtTime(c.vol, ctx.currentTime, 0.05);
      const p = c.el.play();
      if (p && p.catch) p.catch((e) => { c.erro = 'bloqueado'; rexistrar(id + ': ' + e.message); cambiou(); });
    } else {
      c.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      c.el.pause();
    }
    cambiou();
    return true;
  }

  function volCapa(id, v) {
    const c = capas.get(id);
    if (!c || !ctx) return;
    c.vol = Math.min(1, Math.max(0, v));
    if (c.on && !c.fade) c.gain.gain.setTargetAtTime(c.vol, ctx.currentTime, 0.02);
    cambiou();
  }

  function quitarCapa(id) {
    const c = capas.get(id);
    if (!c) return;
    try { c.el.pause(); c.el.src = ''; } catch (e) { /* xa desmontado */ }
    try { c.gain.disconnect(); } catch (e) { /* idem */ }
    capas.delete(id);
    cambiou();
  }

  // ── EFECTOS ──────────────────────────────────────────────────────
  async function precargar(url) {
    if (!ctx) return null;
    if (buffers.has(url)) return buffers.get(url);
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = await ctx.decodeAudioData(await r.arrayBuffer());
      buffers.set(url, buf);
      return buf;
    } catch (e) {
      rexistrar('precarga fallou: ' + url + ' · ' + e.message);
      return null;
    }
  }

  // Cada disparo crea o seu nodo: así solápanse en vez de cortarse.
  function disparar(url, vol = 1) {
    if (!ctx) return false;
    const buf = buffers.get(url);
    if (!buf) { precargar(url).then((b) => { if (b) disparar(url, vol); }); return false; }
    const s = ctx.createBufferSource();
    const g = ctx.createGain();
    s.buffer = buf;
    g.gain.value = Math.min(1, Math.max(0, vol));
    s.connect(g); g.connect(busNodes.efectos);
    s.start();
    return true;
  }

  // ── GLOBAIS ──────────────────────────────────────────────────────
  function volumeBus(bus, v) {
    v = Math.min(1, Math.max(0, v));
    volBus[bus] = v;
    const n = bus === 'master' ? master : busNodes[bus];
    if (n && ctx) n.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
    cambiou();
  }

  function pararTodo() {
    for (const [id] of capas) acender(id, false);
    for (const [, c] of capas) c.fade = false;
    rexistrar('STOP TODO');
    cambiou();
  }

  // ⚠️ O bug que atopamos na proba: se ao rematar o fade se recalcula o
  // volume de TODAS as capas, as que aínda están baixando recuperan o
  // volume enteiro e óese un rearranque. Por iso `fade` marca a capa
  // como intocable e hai UN só temporizador para todas, non un por capa.
  function fadeTodo(segundos = 5) {
    if (!ctx) return Promise.resolve(0);
    const activas = [...capas.entries()].filter(([, c]) => c.on);
    if (!activas.length) return Promise.resolve(0);
    const fin = ctx.currentTime + segundos;
    for (const [, c] of activas) {
      c.fade = true;
      c.gain.gain.cancelScheduledValues(ctx.currentTime);
      c.gain.gain.setValueAtTime(c.gain.gain.value, ctx.currentTime);
      c.gain.gain.linearRampToValueAtTime(0.0001, fin);
    }
    rexistrar('FADE ' + segundos + 's · ' + activas.length + ' capas');
    cambiou();
    return new Promise((res) => {
      setTimeout(() => {
        for (const [, c] of activas) {
          c.fade = false; c.on = false;
          if (ctx) {
            c.gain.gain.cancelScheduledValues(ctx.currentTime);
            c.gain.gain.setValueAtTime(0, ctx.currentTime);
          }
          try { c.el.pause(); } catch (e) { /* xa parado */ }
        }
        cambiou();
        res(activas.length);
      }, segundos * 1000 + 80);
    });
  }

  function destruir() {
    for (const [id] of capas) quitarCapa(id);
    buffers.clear();
    if (ctx && ctx.close) { try { ctx.close(); } catch (e) { /* xa pechado */ } }
    ctx = null; master = null; estado = 'parado';
    cambiou();
  }

  return {
    arrancar, reanudar, destruir,
    engadirCapa, acender, volCapa, quitarCapa,
    precargar, disparar,
    volumeBus, pararTodo, fadeTodo,
    instantanea, desfase,
    get estado() { return estado; },
    get ctx() { return ctx; },
  };
}
