# ImproApp · `src/` completo — R10a + Plano (Fase 0 e PL1a)

Entrega completa. **Fusionar, nunca substituír.**
Este zip substitúe aos dous anteriores: aplica só este.

---

## ⚠️ Dúas cousas ANTES de subir o código

**1. Executa `supabase_planos.sql` en Supabase.** É a táboa dos planos.
Idempotente, pódese correr as veces que faga falta. Se subes o código
sen ela, Plano segue funcionando sen conta (en local) e con conta avisa
de que non pode ler; non peta, pero non garda na nube.

**2. Borra `src/tabs/TabReto.jsx`** despois de fusionar. Substitúeo
`ModoReto.jsx`; un zip non pode borrar nada.

---

## 1 · R10a — Reto é un modo de Xerar

Xa o tiñas descrito. A botonera baixara a 10 áreas; **con Plano volve a
11**, que é onde estaba antes. A reixa comprobada nos catro tamaños.

## 2 · Plano · Fase 0 — o motor

`plano/xeometria.js` (401 liñas) e `plano/modelo.js` (665). Módulos
puros, sen React. **218 casos.**

## 3 · Plano · PL1a — fontanería e porta de entrada

| Ficheiro novo | Que |
|---|---|
| `plano/paleta.js` | tema → paleta de debuxo, e tres paletas de exportación |
| `plano/historial.js` | desfacer/refacer con fusión de xestos |
| `plano/almacen.js` | local + conta, patrón de `mesas.js` |
| `tabs/TabPlano.jsx` | selector de modo + lista de planos |
| `supabase_planos.sql` | a táboa |

**Xa podes** entrar en Plano, escoller escénico ou técnico, e crear,
renomear, duplicar e borrar planos, sen conta ou con ela.

### Por que a paleta é un módulo aparte

⚠️ **O debuxo non le o tema, le unha paleta.** Se o SVG chamase a
`useTheme()` por dentro, exportar unha imaxe «en claro» estando en tema
escuro obrigaría a cambiar o tema da app enteira para xerar o ficheiro,
e a desfacelo despois. Cunha paleta como parámetro, exportar é pasar
outra paleta. As cores dos elementos son **tokens** (`ok`, `accent`…),
nunca hexadecimais: así seguen os catro temas sen tocar nada.

### Superficie de contacto co que xa funciona

Como dicía a análise, ~40 liñas: `Inicio.jsx` (área 11 + descricións),
`ImproApp.jsx` (pestana, `lazy()`, ruta), `core.jsx` (`UI_STRINGS`),
`iconos.jsx` (**un** icono), `datos.js` (sección de Manual).

⚠️ Os ~40 símbolos do debuxo **non entran** en `ICONOS_NECESARIOS`:
afundirían a cobertura de todos os estilos e deixarían I11 imposible.
Irán en `plano/iconosPlano.jsx`, que é contido, non interface.

⚠️ `<main>` xa non topa en 1100 px cando hai pantalla chea. Serve tamén
para o modo función de Sonido, que xa emitía o evento.

## Catro erros atopados polas probas

Un por cada módulo novo, e todos serían bugs enterrados:

1. **`validar()` estaba borrando os metadatos do almacén.** Devolve unha
   forma fixa, e `local` e `actualizado` non son do documento: son do
   almacén. Ían pola billa, e a lista deixaba de saber cales estaban só
   neste aparello.
2. **Dous planos gardados no mesmo milisegundo ordenábanse ao chou.**
   Vese como «o plano que acabo de crear aparece o segundo». A marca de
   tempo agora é estritamente crecente.
3. **Un arrastre enchía o historial de 200 entradas.** Desfacer tería
   que premerse 200 veces para desfacer UN xesto. Os pasos coa mesma
   etiqueta e próximos no tempo colapsan.
4. **`motivo: 'erro'` non estaba tratado en `TabPlano`.** Sen a táboa
   creada, a pantalla quedaba **en branco** en vez de dicir que pasaba.

## Verificación

- `npx eslint src` → **0**
- **1.057 casos** en 24 ficheiros (eran 734 antes de Plano)
- 22 dos 24 en verde. Os dous que non (`test_sonido`, `test_usemotor`)
  fallan idénticos antes e despois: é o meu remedo de `AudioContext`.
- Botonera comprobada nos catro tamaños coas 11 áreas: caben todas sen
  desprazar.

## O seguinte · PL1b

O editor do escenario: vista planta, reixa, cotas, actores con mirada,
obxectos, foco, selección e arrastre, undo/redo cableado, e os catro
layouts. Despois PL1c: recorridos a man, vista de público 2,5D, vista
doble e exportar.
