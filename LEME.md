# ImproApp · `src/` completo — R10a + Plano Fase 0

Entrega completa. **Fusionar, nunca substituír.** Sen migracións novas.

Leva **dúas cousas**: R10a (que xa tiñas sen aplicar) e a Fase 0 de Plano.
Este zip substitúe ao anterior; se non aplicaches aquel, aplica só este.

---

## ⚠️ Un ficheiro que hai que BORRAR A MAN

Despois de fusionar: **borra `src/tabs/TabReto.jsx`.**
Substitúeo `src/tabs/ModoReto.jsx`. Un zip non pode borrar nada.

---

## 1 · R10a — Reto é un modo de Xerar

A botonera baixa a **10 áreas**. Reto vive dentro de Xerar como cuarto
modo, ao lado de `Categ.`, `🎬 Escena` e `♡`. Fóra de `AREAS`, de
`TABS`, de `DESCS` e do encamiñamento; a súa sección de Manual fúndese
coa de Xerar. `UI_STRINGS.reto` queda como etiqueta do modo.

Arranxa de paso que Reto sorteaba doutra lista que Xerar (B56) e que
unha categoría inexistente no idioma activo pintaba unha fila baleira
(B57).

---

## 2 · Plano · Fase 0 — o motor, sen interface

**Non hai nada que ver na app.** Son dous módulos puros e as súas
probas. Non se tocou ningún ficheiro existente: nin `Inicio.jsx`, nin
`ImproApp.jsx`, nin `core.jsx`. Aplicar isto **non cambia nada do que
xa funciona**.

| Ficheiro | Liñas | Que fai |
|---|---|---|
| `src/plano/xeometria.js` | 401 | coordenadas, reixa, 2,5D, trazos, ángulos |
| `src/plano/modelo.js` | 665 | o documento, validación, momentos, secuencia |
| `probas/test_plano_xeometria.mjs` | — | **101 casos** |
| `probas/test_plano_modelo.mjs` | — | **117 casos** |

### As túas seis decisións, implementadas

1. **Momentos**, non «estados». E sen nivel «escena»: *o plano É a escena*.
2. **Opción B.** Un documento, un escenario, dúas capas (`escenico` /
   `tecnico`). O modo é estado da interface, **non está no documento**.
3. Preparado para local + conta (`almacen.js` vai na Fase 1).
4. **6,00 × 4,50 m**, proporción 4:3. Cotas acesas por defecto.
5. Fase 0 primeiro. Isto.
6. I02 despois, por bloques.

### Como resolvín a colocación coa opción B

Este é o cerne, e non era obvio:

- Un elemento **fixo** garda a posición nel mesmo. Un pé de micro non se
  move durante a función; ter unha copia por momento significaría que
  movelo obriga a corrixir catro sitios, e esquecer un deixa o micro
  saltando.
- Un elemento **non fixo** gárdaa en `momento.colocacion[id]`.
- Por defecto: escénico → non fixo, técnico → fixo. Pero é unha
  **propiedade**, non unha consecuencia da capa: un praticable que se
  move a metade da función pode ser técnico e non fixo.
- **Lese sempre por `colocacionDe()`.** Ninguén le os campos crus. É o
  mesmo criterio que `paraDirecto()` nas escaletas: unha soa función que
  aplana, e todas as vistas ven o mesmo.

### Catro cousas que atopei escribindo as probas

Cada unha destas sería un bug enterrado se empezase pola interface:

1. **Engadir un actor no momento 2 facíao desaparecer no 3.** Poñelo só
   no momento activo parecía o obvio. Agora persiste cara adiante; nos
   anteriores segue sen estar, que é o que se quere (é unha entrada).
2. **Borrar un momento intermedio partía a secuencia.** De 1→2→3, borrar
   o 2 deixaba o 3 inalcanzable. Agora reconecta a 1→3.
3. **Borrar un elemento deixaba tres rastros**: a colocación en cada
   momento, os recorridos asignados e as traxectorias das transicións.
4. **Interpolar a mirada de 350° a 10° daba a volta longa.** É o bug
   clásico dos ángulos. Vai polo camiño curto.

Ademais quedaron cubertas as trampas xa documentadas do proxecto:
`Number(null) === 0` (o 0 é o bordo esquerdo, non «sen valor»), un ciclo
de transicións que conxelaría a pestana, e un trazo de 20.000 puntos que
desbordaba a pila coa simplificación recursiva.

---

## Verificación

- `npx eslint src` → **0**
- **952 casos** en 22 ficheiros de `probas/` (eran 734)
- 20 dos 22 ficheiros en verde. Os dous que non (`test_sonido`,
  `test_usemotor`) fallan **idénticos antes e despois**: é o meu remedo
  de `AudioContext`, e nada disto toca audio.

---

## O seguinte

**Fase 1 de Plano**: o plano estático. Entrada escénico/técnico, lista e
persistencia local, vista planta, reixa, cotas, actores con mirada,
obxectos, foco, recorridos a man, undo/redo, vista de público 2,5D,
vista doble, exportar PNG/SVG, os catro temas e os catro layouts.

Aí si toco `Inicio.jsx`, `ImproApp.jsx`, `core.jsx`, `iconos.jsx` e
`datos.js` — as ~40 liñas de superficie de contacto que dicía a análise.
