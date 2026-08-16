// ═══════════════════════════════════════════════════════════════════
// SONIDO · metrónomo
// ═══════════════════════════════════════════════════════════════════
// Vén da Cabina, pero reescrito. O de antes usaba `setInterval`:
//
//   metroRef.current = setInterval(() => audio.metroBeat(...), ms)
//
// `setInterval` non garante cando dispara. A 120 bpm son 500 ms, e uns
// poucos milisegundos de retraso por pulso acumúlanse ata ser audibles
// nun ensaio longo. Ademais, cambiar o bpm obrigaba a parar e reiniciar
// o metrónomo (`setMetroOn(false)` + `setTimeout`), co salto que iso
// leva. É a mesma familia de erro que B21.
//
// Aquí planifícase por adiantado contra `ctx.currentTime`, que é un
// reloxo de audio de precisión de mostra. O intervalo só decide CANDO
// SE PLANIFICA, non cando soa: perder un tic non desafina nada.
// ═══════════════════════════════════════════════════════════════════

export const COMPASES = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8'];
export const beatsOf = (c) => ({ '2/4': 2, '3/4': 3, '4/4': 4, '5/4': 5, '6/8': 6, '7/8': 7 }[c] || 4);
export const PRESETS_BPM = [60, 80, 100, 120, 140, 160];

const ADIANTO = 0.12;   // segundos que se planifican por diante
const CADA = 25;        // ms entre pasadas do planificador

export function crearMetronomo(getCtx, getBus, { onPulso } = {}) {
  let temporizador = null;
  let seguinte = 0;      // instante do próximo pulso, en tempo de audio
  let pulso = 0;
  let bpm = 100;
  let beats = 4;
  let activo = false;

  function son(t, forte) {
    const ctx = getCtx();
    if (!ctx) return;
    const destino = getBus() || ctx.destination;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = forte ? 1600 : 900;
    o.type = 'square';
    // Envolvente curta: un clic, non un pitido.
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(forte ? 0.5 : 0.28, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    o.connect(g); g.connect(destino);
    o.start(t); o.stop(t + 0.06);
  }

  function planificar() {
    const ctx = getCtx();
    if (!ctx || !activo) return;
    const ata = ctx.currentTime + ADIANTO;
    if (seguinte < ctx.currentTime) seguinte = ctx.currentTime + 0.03;
    while (seguinte < ata) {
      const forte = pulso === 0;
      son(seguinte, forte);
      if (onPulso) {
        // O aviso visual vai por temporizador porque a pantalla non ten
        // reloxo de audio. Se chega uns ms tarde non pasa nada: o que
        // NON pode desprazarse é o son.
        const dentro = Math.max(0, (seguinte - ctx.currentTime) * 1000);
        const p = pulso;
        setTimeout(() => { if (activo) onPulso(p); }, dentro);
      }
      seguinte += 60 / bpm;
      pulso = (pulso + 1) % beats;
    }
  }

  return {
    arrancar() {
      const ctx = getCtx();
      if (!ctx || activo) return false;
      activo = true;
      pulso = 0;
      seguinte = ctx.currentTime + 0.05;
      temporizador = setInterval(planificar, CADA);
      planificar();
      return true;
    },
    parar() {
      activo = false;
      if (temporizador) clearInterval(temporizador);
      temporizador = null;
      pulso = 0;
    },
    // Cambiar o bpm en marcha NON reinicia nada: o próximo pulso xa
    // usa o novo valor. Antes había que parar e volver arrancar.
    setBpm(v) { bpm = Math.min(240, Math.max(30, Math.round(v) || 100)); },
    setBeats(v) { beats = Math.max(1, v || 4); if (pulso >= beats) pulso = 0; },
    get bpm() { return bpm; },
    get beats() { return beats; },
    get activo() { return activo; },
  };
}
