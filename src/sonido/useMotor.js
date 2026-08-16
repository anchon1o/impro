// ═══════════════════════════════════════════════════════════════════
// SONIDO · ponte entre o motor e React
// ═══════════════════════════════════════════════════════════════════
// O motor vive fóra de React (audio/motor.js). Este ficheiro é o único
// que os une, e ten dúas responsabilidades que non son evidentes:
//
//  1. NON REDEBUXAR DE MÁIS. Ao arrastrar un control de volume o motor
//     avisa decenas de veces por segundo. Se cada aviso redebuxa a mesa
//     enteira, nun iPad nótase. Os avisos agrúpanse por fotograma.
//
//  2. O CICLO DE VIDA DE iOS. Ao bloquear a pantalla o AudioContext
//     suspéndese e o son párase. Ao volver hai que pedir `resume()`,
//     e mentres non se recupere hai que DICILO: unha mesa que parece
//     funcionar e non soa é peor que unha que avisa. É a mesma lección
//     que A04, aplicada ao audio.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import { crearMotor } from '../audio/motor.js';

const BALEIRO = { estado: 'parado', desfase: 0, volBus: {}, capas: [] };

export function useMotor({ maxRexistro = 60 } = {}) {
  const ref = useRef(null);
  const pendente = useRef(null);
  const raf = useRef(null);
  const [snap, setSnap] = useState(BALEIRO);
  const [rexistro, setRexistro] = useState([]);
  // Segundos de audio perdido na última suspensión. `null` = nada que
  // contar. A interface usa isto para avisar, non para adiviñar.
  const [perdido, setPerdido] = useState(null);
  const [recuperando, setRecuperando] = useState(false);

  // Agrupar por fotograma: o motor pode avisar moitas veces seguidas,
  // pero a pantalla só se redebuxa unha vez por cadro.
  const agrupar = useCallback((s) => {
    pendente.current = s;
    if (raf.current) return;
    const programar = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame : (fn) => setTimeout(fn, 16);
    raf.current = programar(() => {
      raf.current = null;
      if (pendente.current) { setSnap(pendente.current); pendente.current = null; }
    });
  }, []);

  const anotar = useCallback((msg) => {
    setRexistro((r) => [{ en: Date.now(), msg }, ...r].slice(0, maxRexistro));
  }, [maxRexistro]);

  if (!ref.current) {
    ref.current = crearMotor({ onCambio: agrupar, onLog: anotar });
  }

  // ── Ciclo de vida de iOS ────────────────────────────────────────
  useEffect(() => {
    const motor = ref.current;
    let saidaEn = 0;

    const aoCambiarVisibilidade = () => {
      if (typeof document === 'undefined') return;
      if (document.hidden) {
        saidaEn = Date.now();
        return;
      }
      // De volta. Só interesa se había algo soando: se a mesa estaba
      // parada, non hai nada que recuperar nin que avisar.
      const habia = motor.instantanea().capas.some((c) => c.on);
      const fóra = saidaEn ? (Date.now() - saidaEn) / 1000 : 0;
      saidaEn = 0;
      if (!habia) return;
      if (motor.estado === 'listo' && motor.desfase() < 1) return;

      setRecuperando(true);
      motor.reanudar().then((ok) => {
        setRecuperando(false);
        setPerdido(ok ? Math.round(fóra) : -1);
      });
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', aoCambiarVisibilidade);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', aoCambiarVisibilidade);
      }
    };
  }, []);

  // Ao desmontar: soltar todo. Un AudioContext que sobrevive ao
  // compoñente segue soando e ninguén o pode parar.
  useEffect(() => {
    const motor = ref.current;
    const cancelar = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout;
    return () => {
      if (raf.current) cancelar(raf.current);
      motor.destruir();
    };
  }, []);

  const arrancar = useCallback(() => {
    const r = ref.current.arrancar();
    setPerdido(null);
    return r;
  }, []);

  const recuperar = useCallback(() => {
    setRecuperando(true);
    return ref.current.reanudar().then((ok) => {
      setRecuperando(false);
      if (ok) setPerdido(null);
      return ok;
    });
  }, []);

  const descartarAviso = useCallback(() => setPerdido(null), []);

  const motor = ref.current;
  const listo = snap.estado === 'listo';

  return {
    motor,
    estado: snap.estado,
    listo,
    arrancado: snap.estado !== 'parado',
    capas: snap.capas,
    volBus: snap.volBus,
    rexistro,

    // Aviso honesto de son perdido. `perdido === -1` significa que nin
    // sequera se puido recuperar: fai falta un toque do usuario.
    perdido,
    recuperando,
    necesitaToque: perdido === -1,
    recuperar,
    descartarAviso,

    arrancar,
    acender: motor.acender,
    volCapa: motor.volCapa,
    engadirCapa: motor.engadirCapa,
    quitarCapa: motor.quitarCapa,
    disparar: motor.disparar,
    precargar: motor.precargar,
    volumeBus: motor.volumeBus,
    pararTodo: motor.pararTodo,
    fadeTodo: motor.fadeTodo,
  };
}

// ── Wake Lock ────────────────────────────────────────────────────
// Impide que a pantalla se apague soa. NON impide que o usuario
// bloquee a man: iso non hai forma de evitalo desde a web, e por iso
// Modo Función ten que avisar ademais de activar isto.
export function useWakeLock(activo) {
  const [estado, setEstado] = useState('inactivo');   // inactivo · activo · rexeitado · non-soportado
  const ref = useRef(null);

  useEffect(() => {
    let cancelado = false;
    if (!activo) {
      if (ref.current) { try { ref.current.release(); } catch (e) { /* xa liberado */ } ref.current = null; }
      setEstado('inactivo');
      return undefined;
    }
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      setEstado('non-soportado');
      return undefined;
    }
    navigator.wakeLock.request('screen').then((s) => {
      if (cancelado) { try { s.release(); } catch (e) { /* nada */ } return; }
      ref.current = s;
      setEstado('activo');
      // iOS solta o bloqueo ao pasar a segundo plano: hai que volver
      // pedilo ao regresar, non dalo por feito.
      s.addEventListener('release', () => { ref.current = null; setEstado('inactivo'); });
    }).catch(() => { if (!cancelado) setEstado('rexeitado'); });

    return () => {
      cancelado = true;
      if (ref.current) { try { ref.current.release(); } catch (e) { /* nada */ } ref.current = null; }
    };
  }, [activo]);

  return estado;
}

// ── Contadores ───────────────────────────────────────────────────
// Un só intervalo para todos os contadores da mesa. Isto é T14: había
// lóxica de temporizador en cinco ficheiros e xa causou B21 (dous
// setInterval sobre o mesmo valor facían saltar números).
//
// O intervalo NON conta: só provoca o redebuxo. O valor calcúlase dos
// timestamps, así que perder tics non perde tempo.
export function useReloxo(activo = true, msPorTic = 250) {
  const [, forzar] = useState(0);
  useEffect(() => {
    if (!activo) return undefined;
    const id = setInterval(() => forzar((n) => (n + 1) % 1000000), msPorTic);
    return () => clearInterval(id);
  }, [activo, msPorTic]);
}
