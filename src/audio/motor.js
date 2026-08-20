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
  // `normalizar` e `duck` van como opcións para poder apagalos: se un
  // día molestan, cámbiase un booleano en vez de desfacer código.
  const avisar = opcions.onCambio || nada;
  const rexistrar = opcions.onLog || nada;

  let ctx = null;
  let master = null;
  const busNodes = {};
  const capas = new Map();      // id → {tipo, gain, el, buffer, on, vol, fade}
  const buffers = new Map();    // url → AudioBuffer
  // url → 'cargando' | 'listo' | 'erro'. Sen isto non hai forma de
  // dicirlle a ninguén se un botón vai soar ao premelo ou vai quedar
  // calado mentres se descarga.
  const estadoUrl = new Map();
  // url → Set de nodos que están soando agora. Fai falta para poder
  // PARAR un efecto: sen isto, cada disparo era irrecuperable.
  const vivos = new Map();
  // url → factor de ganancia para normalizar. Un efecto gravado baixo e
  // outro gravado alto non poden soar co mesmo volume nominal: é o que
  // fai que uns non se oian por riba dos ambientes.
  const ganancia = new Map();
  let estado = 'parado';
  let volBus = { musica: 0.8, ambientes: 0.8, efectos: 0.8, master: 0.8 };
  let refWall = 0, refAudio = 0;

  function cambiou() { avisar(instantanea()); }

  function instantanea() {
    return {
      estado,
      desfase: desfase(),
      volBus: { ...volBus },
      urls: Object.fromEntries(estadoUrl),
      soando: [...vivos.entries()].filter(([, s2]) => s2.size).map(([u]) => u),
      listos: [...estadoUrl.values()].filter((x) => x === 'listo').length,
      cargando: [...estadoUrl.values()].filter((x) => x === 'cargando').length,
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
  // ⚠️ COMPROBADO NUN iPad: ao pasar a segundo plano ou bloquear a
  // pantalla, o audio PÁRASE SEMPRE, tamén con altofalante Bluetooth.
  // Non é un caso raro: é o comportamento normal de Web Audio en iOS.
  //
  // E `ctx.resume()` NON abonda: reactiva o contexto, pero os elementos
  // <audio> quedaron pausados polo sistema. Sen volver darlles ao play,
  // as capas seguirían marcadas como acesas e MUDAS, que é o peor
  // estado posible nunha mesa de son.
  function rearrancarCapas() {
    let n = 0;
    for (const [id, c] of capas) {
      if (!c.on || !c.el || !c.el.paused) continue;
      const p = c.el.play();
      if (p && p.catch) p.catch(() => { c.erro = 'bloqueado'; rexistrar(id + ': non retomou'); });
      n += 1;
    }
    if (n) rexistrar(n + ' capas retomadas');
    return n;
  }

  function reanudar() {
    if (!ctx) return Promise.resolve(false);
    if (ctx.state === 'running') {
      refWall = Date.now(); refAudio = ctx.currentTime;
      rearrancarCapas();
      cambiou();
      return Promise.resolve(true);
    }
    return ctx.resume().then(() => {
      refWall = Date.now(); refAudio = ctx.currentTime;
      estado = 'listo';
      rearrancarCapas();
      rexistrar('audio recuperado'); cambiou(); return true;
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

  // Engadir a capa e deixar que o navegador vaia baixando o ficheiro,
  // sen reproducir. É o que permite chegar ao show co traballo feito.
  function preparar(id, opcions) {
    if (!capas.has(id)) engadirCapa(id, opcions);
    const c = capas.get(id);
    if (c && c.el) { try { c.el.load(); } catch (e) { /* xa cargando */ } }
    return c;
  }

  // Pista de playlist: unha soa capa reutilizada no bus de música, sen
  // bucle e avisando ao rematar. Non se crea unha capa por pista porque
  // unha lista de 40 deixaría 40 elementos <audio> vivos.
  const PISTA = '__pista__';
  function reproducirPista(url, { vol = 0.8, onFin } = {}) {
    if (!ctx) return false;
    const previa = capas.get(PISTA);
    if (previa) {
      try { previa.el.pause(); } catch (e) { /* xa parada */ }
      quitarCapa(PISTA);
    }
    const c = engadirCapa(PISTA, { url, bus: 'musica', vol, loop: false, tipo: 'musica' });
    if (!c) return false;
    c.el.onended = () => { if (onFin) onFin(); };
    acender(PISTA, true);
    return true;
  }

  function pararPista() {
    const c = capas.get(PISTA);
    if (!c) return;
    try { c.el.pause(); c.el.onended = null; } catch (e) { /* nada */ }
    quitarCapa(PISTA);
  }

  function pausarPista(si = true) {
    const c = capas.get(PISTA);
    if (!c) return false;
    if (si) { try { c.el.pause(); } catch (e) { /* nada */ } }
    else { const p = c.el.play(); if (p && p.catch) p.catch(() => {}); }
    return true;
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
    if (!ctx || !url) return null;
    if (buffers.has(url)) return buffers.get(url);
    if (estadoUrl.get(url) === 'cargando') return null;   // xa vai de camiño
    estadoUrl.set(url, 'cargando');
    cambiou();
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = await ctx.decodeAudioData(await r.arrayBuffer());
      buffers.set(url, buf);
      ganancia.set(url, factorNormalizacion(buf));
      estadoUrl.set(url, 'listo');
      cambiou();
      return buf;
    } catch (e) {
      estadoUrl.set(url, 'erro');
      // O fallo típico aquí é CORS, e o navegador non o distingue dun
      // erro de rede. Dise as dúas cousas para non mandar a ninguén a
      // buscar no sitio equivocado.
      rexistrar('non se puido cargar (rede ou CORS): ' + url);
      cambiou();
      return null;
    }
  }

  // Precarga en lote, de dous en dous. Lanzar vinte peticións á vez
  // satura a conexión e fai que TODAS tarden; de dous en dous os
  // primeiros quedan listos axiña e xa se pode empezar.
  async function precargarVarios(urls, aoAvanzar) {
    const pendentes = [...new Set((urls || []).filter(
      (u) => u && !buffers.has(u) && estadoUrl.get(u) !== 'cargando',
    ))];
    let feitos = 0;
    const total = pendentes.length;
    const quenda = async () => {
      for (;;) {
        const u = pendentes.shift();
        if (!u) return;
        await precargar(u);
        feitos += 1;
        if (aoAvanzar) aoAvanzar(feitos, total);
      }
    };
    await Promise.all([quenda(), quenda()]);
    return { total, listos: [...estadoUrl.values()].filter((x) => x === 'listo').length };
  }

  function estadoDe(url) {
    if (buffers.has(url)) return 'listo';
    return estadoUrl.get(url) || 'pendente';
  }

  // ── Normalización ──
  // Mídese o PICO real do buffer e lévase a un obxectivo común. Non se
  // usa RMS a propósito: un efecto curto e forte ten RMS baixo, e
  // normalizar por RMS faríao saturar.
  const PICO_OBXECTIVO = 0.89;   // deixa marxe para non recortar
  const TOPE = 6;                // non amplificar máis de 6×: un ficheiro
                                 // case mudo subiríase co ruído de fondo

  function factorNormalizacion(buf) {
    if (!buf || !buf.getChannelData || !buf.numberOfChannels) return 1;
    let pico = 0;
    // ⚠️ NON se pode mostrear a saltos grandes. O pico dun efecto
    // percusivo —  un golpe de porta—  dura unhas poucas mostras, e
    // saltando de 64 en 64 pásase por alto enteiro: o efecto quedaba
    // sen normalizar sen que nada o indicase.
    //
    // Os efectos son curtos, así que se percorren ENTEIROS. Só se
    // mostrea nos ficheiros longos (ambientes), onde o pico é sostido
    // e non hai risco de perdelo, e onde percorrer millóns de mostras
    // conxelaría a pestana.
    const MAX = 2000000;   // ~45 s a 44,1 kHz
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      const paso = d.length <= MAX ? 1 : Math.ceil(d.length / MAX);
      for (let i = 0; i < d.length; i += paso) {
        const v = Math.abs(d[i]);
        if (v > pico) pico = v;
      }
    }
    if (!(pico > 0.0001)) return 1;          // silencio ou dato raro
    return Math.min(TOPE, PICO_OBXECTIVO / pico);
  }

  // ── Ducking ──
  // Ao disparar un efecto, baixa o resto un chisco para que se oia. É o
  // que fai calquera mesa de son, e sen isto un trono queda tapado por
  // unha tormenta de fondo.
  let duckAta = 0;
  function duck(segundos) {
    if (!ctx || !opcions.duck) return;
    const ata = ctx.currentTime + Math.min(4, Math.max(0.3, segundos));
    if (ata <= duckAta) return;              // xa hai un duck máis longo
    duckAta = ata;
    for (const b of ['musica', 'ambientes']) {
      const g = busNodes[b].gain;
      g.cancelScheduledValues(ctx.currentTime);
      g.setValueAtTime(g.value, ctx.currentTime);
      // −6 dB é aproximadamente a metade da amplitude: nótase sen que
      // pareza que se apagou a música.
      g.linearRampToValueAtTime(volBus[b] * 0.5, ctx.currentTime + 0.08);
      g.linearRampToValueAtTime(volBus[b], ata + 0.25);
    }
  }

  // Cada disparo crea o seu nodo: así solápanse en vez de cortarse.
  function disparar(url, vol = 1) {
    if (!ctx) return false;
    const buf = buffers.get(url);
    if (!buf) {
      // Non estaba cargado: cárgase e dispárase en canto chegue. Non é
      // instantáneo, e por iso a interface ten que amosar o estado en
      // vez de deixar a alguén premendo un botón mudo.
      precargar(url).then((b) => { if (b) disparar(url, vol); });
      return false;
    }
    const s = ctx.createBufferSource();
    const g = ctx.createGain();
    s.buffer = buf;
    // O volume que pon o usuario multiplícase polo factor medido: así
    // «ao 80 %» significa o mesmo en todos os efectos.
    const norm = opcions.normalizar === false ? 1 : (ganancia.get(url) || 1);
    g.gain.value = Math.min(1, Math.max(0, vol)) * norm;
    s.connect(g); g.connect(busNodes.efectos);

    if (!vivos.has(url)) vivos.set(url, new Set());
    const set = vivos.get(url);
    const nodo = { s, g };
    set.add(nodo);
    // Cando remata só, sae da lista. Sen isto un efecto curto quedaría
    // marcado como «soando» para sempre.
    s.onended = () => { set.delete(nodo); cambiou(); };
    s.start();
    duck(buf.duration || 0.5);
    cambiou();
    return true;
  }

  // Parar un efecto en marcha. Cun fundido moi curto: un corte seco nun
  // buffer a media reprodución produce un chasquido audible.
  function pararEfecto(url) {
    const set = vivos.get(url);
    if (!set || !set.size) return false;
    const fin = ctx.currentTime + 0.06;
    for (const nodo of [...set]) {
      try {
        nodo.g.gain.cancelScheduledValues(ctx.currentTime);
        nodo.g.gain.setValueAtTime(nodo.g.gain.value, ctx.currentTime);
        nodo.g.gain.linearRampToValueAtTime(0.0001, fin);
        nodo.s.stop(fin);
      } catch (e) { /* xa parado */ }
      set.delete(nodo);
    }
    cambiou();
    return true;
  }

  // Premer outra vez para. É o que se espera dun ambiente longo posto
  // nun botón de efecto; nun efecto curto non chega a notarse.
  function alternarEfecto(url, vol = 1) {
    const set = vivos.get(url);
    if (set && set.size) return pararEfecto(url);
    return disparar(url, vol);
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
    for (const [url] of vivos) pararEfecto(url);
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

  // O metrónomo precisa entrar pola mesma cadea de buses: se fose
  // directo ao destino, non o afectaría nin o volume xeral nin o STOP.
  function bus(nome) { return busNodes[nome] || null; }

  return {
    arrancar, reanudar, destruir, bus,
    engadirCapa, preparar, acender, volCapa, quitarCapa,
    reproducirPista, pararPista, pausarPista,
    precargar, precargarVarios, estadoDe, disparar, pararEfecto, alternarEfecto,
    volumeBus, pararTodo, fadeTodo,
    instantanea, desfase,
    factorDe: (url) => ganancia.get(url) || 1,
    // Expostas para poder cambialas en quente sen recrear o motor.
    opcions,
    get estado() { return estado; },
    get ctx() { return ctx; },
  };
}
