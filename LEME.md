# ImproApp · `src/` completo — Plano PL1d · **Fase 1 rematada**

Entrega completa. **Fusionar, nunca substituír.**
Substitúe a todos os zips anteriores.

⚠️ **Ao arrastrar a carpeta, FUSIONAR.** Substituíndo lévase por diante
`src/supabase.js`, que non vai nas miñas entregas. (Se volve pasar: en
GitHub Desktop, botón dereito no ficheiro vermello → *Discard changes*.)

Non hai SQL novo nin nada que borrar.

---

## Recorridos debuxados a man

Ferramenta ✎ na barra. Debuxas co dedo e queda unha liña punteada con
frecha. No inspector: estilo de liña, curvatura, frecha si/non, e **de
quen é** — asignalo a alguén non é decorativo, a liña colle a súa cor e
na Fase 2 será a traxectoria que siga na transición.

Os recorridos vense tamén na **vista de público**, proxectados punto a
punto. ⚠️ Non se deforma o `path` xa feito: iso daría unha curva
parecida que pasa *por riba* do trapecio en vez de pousar nel.

---

## O que fixen en vez de agardar por ti

Dixera que agardaba a saber que tal ía o arrastre no iPad antes de facer
os recorridos. En vez de bloquear, **unifiquei as dúas cousas nunha soa
capa de punteiro**: `plano/usePunteiro.js`. Arrastrar e debuxar son o
mesmo problema —un dedo que baixa, se move e sae, sobre unha caixa que
hai que converter a coordenadas—, e telo por duplicado significaba
arranxar cada rareza de iOS dúas veces e esquecer a segunda.

**Agora, se o arrastre vai mal no teu iPad, o arranxo vale para os dous.**

O que resolve esa capa, e que non se ve ata que falla nunha tableta:

| | |
|---|---|
| **Captura do punteiro** | sen ela, mover rápido saca o dedo do elemento e o arrastre córtase a media viaxe |
| **Só o primario** | apoiar a palma da man ou facer pinza manda dous fluxos ao mesmo xesto e o elemento salta entre os dous dedos |
| **Pencil vs dedo** | `pointerType === 'pen'` debuxa **sempre**, aínda coa ferramenta de mover activa |
| **`preventDefault`** | Safari interpreta o arrastre como scroll e o plano móvese enteiro debaixo do dedo |
| **Un evento por fotograma** | un `pointermove` por píxel dispara máis eventos dos que hai fotogramas |
| **O último tramo** | procésase o pendente ANTES de rematar, ou a liña acaba antes de onde levantaches o dedo |
| **Desmontar a media** | cancélase o fotograma pendente, ou queda unha chamada sobre estado que xa non existe |

### E o trazo en curso vai fóra de React

Cada `pointermove` engadindo un punto ao estado repintaría o documento
enteiro 60 veces por segundo. O `<path>` do trazo escríbese por `ref`
con `setAttribute`, e **só ao soltar** se simplifica (Douglas-Peucker) e
entra no plano: un trazo nun iPad deixa entre 300 e 900 puntos e quedan
entre 15 e 40. Simplifícase ao soltar e non mentres, porque mentres
debuxas queres ver o que fai o dedo.

---

## Dous erros que atoparon as probas

1. **Os ids de `<marker>` colisionaban.** `url(#id)` resólvese en todo o
   documento, non dentro do `<svg>`. Como a exportación renderiza un
   segundo debuxo, as **frechas da imaxe saían coa cor do tema** en vez
   de coa paleta escollida. Arranxado cun prefixo por debuxo.
2. **Desfacer por riba dun recorrido deixaba a selección apuntando a un
   fantasma**, e o inspector amosaba «Recorrido · 0 puntos». É o mesmo
   fallo que xa cazara co momento activo e cos elementos; agora están
   os tres cubertos.

---

## Verificación

- `npx eslint src` → **0**
- **1.195 casos** en 26 ficheiros (eran 734 antes de Plano)
- 24 dos 26 en verde. Os dous de sempre (`test_sonido`, `test_usemotor`)
  fallan idénticos antes e despois: é o meu remedo de `AudioContext`.
- O arrastre segue pasando as probas que xa tiña **despois de refacelo
  sobre a capa nova** — que era todo o sentido de escribilas.

---

## Fase 1 rematada

Plano estático completo: escenario a escala, reixa, cotas, persoas con
mirada e postura, obxectos e equipos, foco, **recorridos a man**,
selección e arrastre, desfacer/refacer, vista de planta, **vista de
público 2,5D**, **vista doble**, **exportar PNG/SVG** con tres paletas,
local e conta, catro layouts, catro temas.

**A Fase 2 é o movemento**: momentos, transicións, animación, liña de
tempo, figura de corpo enteiro modular e editor de iconos 32×32. O
modelo xa a soporta enteira desde a Fase 0 —`momentos`, `transicions`,
`diferenzas()`, `paraReproducir()` están escritos e probados—, así que é
case toda interface.

Antes de empezala, **próbao no iPad**. Se o arrastre ou o debuxo van
mal, quero arranxar a capa de punteiro antes de construírlle nada
enriba.
