# ImproApp · `src/` completo · tres estilos de icono

Substitúe a todas as entregas anteriores. Se perdiches o fío, usa só
esta.

## Aplicar
1. Arrastra `src/` sobre `impro/src/` → **FUSIONAR**, nunca substituír
   (substituír borra `src/supabase.js`, que non vai aquí).
2. Copia `eslint.config.js` á raíz.
3. **Borra a man `src/tabs/TabShow.jsx`** se aínda existe.
4. Comproba que `src/supabase.js` NON aparece nos cambios de GitHub
   Desktop. Se aparece, descarta ese cambio.

## Volveu o de antes, e agora é unha opción

**Por defecto: emojis e descricións**, como che gustaba.

En **Axustes → Iconos** tes tres estilos completos:

| | |
|---|---|
| **Emojis (o de sempre)** | Por defecto. Traen a súa cor e recoñécense sen ler |
| **Orixinal** | O primeiro set de SVG |
| **Xeométrico minimal** | O Estilo 2 novo, 18/18 |

Os dez estilos de proba seguen listados coa súa cobertura (2/18), sen
poder activarse.

⚠️ Os emojis **non collen a cor do tema**: píntaos o sistema operativo.
É o prezo de que traian a súa propia. Dío o selector.

## As descricións
Volven, **acesas por defecto**, e a preferencia gárdase. O botón `?` da
portada acéndeas e apágaas. Coas descricións acesas o icono cede sitio
ao texto; sen elas recupera todo o tamaño.

## A reixa segue enchendo a pantalla
Iso si era unha mellora e queda: 3×4 en iPhone, 4×3 en iPad vertical,
5×3 en iPad horizontal. Sen desprazar en ningún.

## Dous fallos atopados nesta sesión
- `EMOJIS` usábase antes de declaralo.
- `axuda` usábase no cálculo do tamaño antes de declaralo. **Isto era
  pantalla branca na portada** e colleuno o harness de render, non o
  build.

## Bundle
666 kB. Cando descartes os estilos de proba, recupéranse uns 24.
