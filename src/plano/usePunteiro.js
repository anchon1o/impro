// ═══════════════════════════════════════════════════════════════════
// PLANO · capa de punteiro
// ═══════════════════════════════════════════════════════════════════
// ⚠️ ARRASTRAR E DEBUXAR PASAN POR AQUÍ OS DOUS.
//
// Son o mesmo problema: un dedo que baixa, se move e sae, sobre unha
// caixa que hai que converter a coordenadas normalizadas. Se cada un
// tivese o seu manexo, cada arranxo de iOS habería que facelo dúas
// veces e a segunda esqueceríase.
//
// O que resolve, e que non é obvio ata que falla nunha tableta:
//
// 1. **Captura do punteiro.** Sen `setPointerCapture`, mover rápido
//    saca o dedo do elemento e o arrastre córtase a media viaxe.
//
// 2. **Só o punteiro primario.** Sen iso, apoiar a palma da man ou
//    facer pinza mándalle dous fluxos de coordenadas ao mesmo xesto e
//    o elemento salta entre os dous dedos.
//
// 3. **Pencil e dedo.** `pointerType === 'pen'` debuxa SEMPRE, aínda
//    coa ferramenta de mover activa; o dedo usa a ferramenta escollida.
//    Nun iPad iso é a diferenza entre debuxar un recorrido nun intre e
//    pelexar cun modo.
//
// 4. **`preventDefault` na baixada.** Safari interpreta o arrastre como
//    scroll da páxina e o plano móvese enteiro debaixo do dedo. O
//    `touch-action: none` do SVG axuda pero non abonda por si só.
//
// 5. **Fotogramas.** Un `pointermove` por píxel movido dispara máis
//    eventos dos que hai fotogramas. Acumúlase e procésase un por
//    fotograma; se non, unha tableta vaise ao chan debuxando.
// ═══════════════════════════════════════════════════════════════════

import { useRef, useCallback, useEffect } from 'react';
import { clamp01 } from './xeometria.js';

export function usePunteiro({
  refCaixa, onEmpezar, onMover, onRematar, activo = true,
}) {
  const estado = useRef(null);
  const pendente = useRef(null);
  const cadro = useRef(0);

  // Cliente → normalizado. ⚠️ A caixa mídese UNHA vez ao empezar o
  // xeso, non en cada movemento: `getBoundingClientRect()` obriga o
  // navegador a recalcular o deseño, e chamalo 60 veces por segundo
  // mentres se arrastra é o camiño máis curto a que vaia a tiróns.
  const normalizar = useCallback((e, caixa) => {
    const r = caixa || (refCaixa.current && refCaixa.current.getBoundingClientRect
      ? refCaixa.current.getBoundingClientRect() : null);
    if (!r || !r.width || !r.height) return null;
    return { x: clamp01((e.clientX - r.left) / r.width), y: clamp01((e.clientY - r.top) / r.height) };
  }, [refCaixa]);

  const procesar = useCallback(() => {
    cadro.current = 0;
    const p = pendente.current;
    pendente.current = null;
    if (!p || !estado.current) return;
    if (onMover) onMover(p, estado.current);
  }, [onMover]);

  const baixar = useCallback((e, extra = {}) => {
    if (!activo) return;
    // ⚠️ Só o primario: a palma da man e o segundo dedo dunha pinza
    // chegan como punteiros á parte.
    if (e.isPrimary === false) return;
    const r = refCaixa.current && refCaixa.current.getBoundingClientRect
      ? refCaixa.current.getBoundingClientRect() : null;
    if (!r || !r.width) return;
    const p = normalizar(e, r);
    if (!p) return;
    // O Pencil debuxa aínda coa ferramenta de mover activa.
    const conPencil = e.pointerType === 'pen';
    estado.current = { caixa: r, id: e.pointerId, conPencil, inicio: p, ...extra };
    if (e.currentTarget && e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* nalgúns navegadores lanza; ignórase */ }
    }
    if (e.preventDefault) e.preventDefault();
    if (onEmpezar) onEmpezar(p, estado.current);
  }, [activo, normalizar, onEmpezar, refCaixa]);

  const mover = useCallback((e) => {
    const st = estado.current;
    if (!st) return;
    // ⚠️ Un punteiro distinto do que empezou o xesto ignórase: se non,
    // pousar outro dedo tira o elemento cara alí.
    if (e.pointerId !== undefined && st.id !== undefined && e.pointerId !== st.id) return;
    const p = normalizar(e, st.caixa);
    if (!p) return;
    pendente.current = p;
    if (cadro.current) return;
    // requestAnimationFrame pode non existir nalgunhas webviews.
    if (typeof requestAnimationFrame === 'function') cadro.current = requestAnimationFrame(procesar);
    else procesar();
  }, [normalizar, procesar]);

  const soltar = useCallback((e) => {
    const st = estado.current;
    if (!st) return;
    if (e && e.pointerId !== undefined && st.id !== undefined && e.pointerId !== st.id) return;
    // ⚠️ Procesar o que quedase pendente ANTES de rematar: se non, o
    // último tramo do trazo pérdese e a liña remata antes de onde
    // levantaches o dedo.
    if (pendente.current) procesar();
    if (cadro.current && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(cadro.current);
    cadro.current = 0;
    pendente.current = null;
    estado.current = null;
    if (onRematar) onRematar(st);
  }, [onRematar, procesar]);

  // ⚠️ Se o compoñente se desmonta a media arrastre —cambiar de vista,
  // saír do editor— hai que soltar o fotograma pendente ou queda unha
  // chamada a `onMover` sobre estado que xa non existe.
  useEffect(() => () => {
    if (cadro.current && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(cadro.current);
    cadro.current = 0;
    estado.current = null;
    pendente.current = null;
  }, []);

  return {
    baixar,
    manexadores: { onPointerMove: mover, onPointerUp: soltar, onPointerCancel: soltar },
    activo: () => !!estado.current,
  };
}
