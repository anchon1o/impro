# ImproApp · `src/` completo — R10a + Plano (PL0 · PL1a · PL1b · PL1c)

Entrega completa. **Fusionar, nunca substituír.**
Substitúe a todos os zips anteriores: aplica só este.

Xa borraches `TabReto.jsx` e executaches os `.sql`, así que **non hai
nada que facer á parte de fusionar e subir**. `supabase_planos.sql` vai
igualmente no zip por se acaso; é idempotente.

---

## O que hai de novo: PL1c

### Vista desde o público, 2,5D

`plano/VistaPublico.jsx`. O chan é un trapecio e as figuras encollen
canto máis ao fondo están.

⚠️ **Non ten xeometría propia.** Todo pasa por `proxectar25D()`, que
está en `xeometria.js` e probado desde a Fase 0. Se esta vista fixese
as súas contas, un actor aparecería nun sitio na planta e noutro aquí,
e o erro só se vería na vista doble — que é xusto onde se poñen as dúas
unha ao lado da outra.

⚠️ **É de LECTURA.** Non se arrastra nada alí. Arrastrar en perspectiva
obriga a decidir se o dedo move en profundidade ou en horizontal, e non
hai resposta boa: dous xestos distintos para a mesma acción só crean
erros. Edítase na planta; isto é o espello.

⚠️ **Os debuxos de alzado non son os de planta.** Un símbolo cenital na
vista de público lese como unha mancha no chan; unha figura de alzado na
planta parece xente deitada. Son dous debuxos do mesmo dato, e teñen que
selo. As figuras ancóranse **polos pés**: ancorando polo centro, a
figura do fondo flota.

⚠️ **A mirada proxéctase no CHAN**, non na figura. Desde a butaca non se
ve para onde mira alguén de costas; a dirección no chan si é
inequívoca.

### Vista doble

As dúas á vez. En pantalla ancha, unha ao lado da outra —comparalas é
todo o sentido—; **en estreita, apiladas**, porque partir 390 px en dous
deixa dous selos ilexibles. A planta segue sendo a editable.

### Exportar a PNG e SVG

`plano/exportar.js`. Tres paletas: **Claro**, **Negativo** e
**Transparente**.

⚠️ **Non se serializa o SVG que se ve.** Ese leva a paleta do tema e a
capa de selección: a imaxe sairía con tiradores punteados arredor do
actor que tiveses escollido. Renderízase un **segundo debuxo agochado**
coa paleta de exportación e sen selección, e serialízase ese. Só é
posible porque as vistas son puras — foi a razón de facelas así.

⚠️ **Vai primeiro a folla de compartir, e só despois a descarga.** En
iOS `<a download>` nunha WKWebView abre a imaxe nunha pestana en vez de
gardala, e o portapapeis (`ClipboardItem`) esixe chamada síncrona
dentro do xesto e falla a miúdo. Compartir SI funciona, e ademais é o
que se espera nunha tableta: mandar o plano por mensaxe.

⚠️ **Cancelar a folla de compartir non é un erro** e non dispara a
descarga: quen cancela non quere o ficheiro.

### Tres fallos silenciosos previstos

1. **Un SVG sen `xmlns` non o abre ningún visor.** Non dá erro: dá un
   ficheiro «que non se ve». Engádese ao preparar.
2. **Sen `width`/`height` explícitos**, moitos visores debuxan o SVG a
   150×150 px aínda tendo `viewBox`.
3. **O debuxo de exportar vai fóra de pantalla, non con
   `display:none`**: un nodo sen caixa hai navegadores que nin o
   serializan ben.

---

## Verificación

- `npx eslint src` → **0**
- **1.167 casos** en 26 ficheiros (eran 734 antes de Plano)
- 24 dos 26 en verde. Os dous que non (`test_sonido`, `test_usemotor`)
  fallan idénticos antes e despois: é o meu remedo de `AudioContext`.
- Novo: `eslint.config.js` engade `XMLSerializer` e `Image` aos globais.

---

## O que queda de PL1: os recorridos a man

Deixeinos fóra **a propósito**, e non por falta de tempo: o debuxo a man
alzada usa exactamente o mesmo manexo de punteiro có arrastre que
acabas de recibir sen probar. Se no iPad o arrastre resulta ir duro,
perder o dedo ou pelexar co scroll de Safari, o arranxo é o mesmo para
os dous e prefiro facelo unha vez. **Dime que tal vai arrastrar un
actor** e fágoos deseguido.
