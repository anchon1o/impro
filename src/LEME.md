# ImproApp · `src/` COMPLETO ao día

Esta entrega substitúe a TODAS as parciais anteriores. Se perdiches o
fío de que subiches e que non, usa só esta e esquece as demais.

## Como aplicalo

1. Descomprime.
2. Arrastra `src/` sobre `impro/src/` → **FUSIONAR**, nunca substituír.
   Substituír borra `src/supabase.js`, que non vai nesta entrega e é o
   que unha vez tirou a app.
3. Copia `eslint.config.js` á raíz do repo.
4. **Borra a man `src/tabs/TabShow.jsx`** se aínda existe: a Cabina xa
   non se usa e un zip non pode borrar ficheiros.
5. Comproba en GitHub Desktop que `src/supabase.js` NON aparece na
   lista de cambios. Se aparece, descarta ese cambio.
6. Commit → Push.

## SQL

Se aínda non os executaches, van os dous incluídos, nesta orde:
`supabase_sonido.sql` → `supabase_sonido_tags.sql`.
Repetilos non fai dano.

## Que hai dentro (todo o feito ata agora)

**Dinámicas** · A04 completo: `DINAMICAS_BASE` fóra de `datos.js`,
`useDinamicas` como fonte única, avisos honestos de carga.

**Revisión visual** · V01, V02, V03, V05. Admin na cabeceira, botonera
sen el.

**Sonido** (a Cabina desapareceu)
- Motor de audio fóra de React, con buses, fades e recuperación de iOS
- Metrónomo planificado contra o reloxo de audio, sen deriva
- Contadores por timestamp: sobreviven a pechar a app
- Ficheiros do dispositivo en IndexedDB, sen rede e sen custo
- Mesas, escenas, precarga con contador de progreso
- Admin → 🔊 Sons: táboa masiva, pegar dunha folla de cálculo
- Explorar: etiquetas, busca, duplicar, gardados, denuncias

**Iconos** · Set de 34 inline, botonera con iconos grandes e botón `?`,
e **selector de estilo en Axustes → Iconos**.

## Bundle

Arranque **649 kB**. Sonido (55), Admin (82) e Manual (2) cárganse
baixo demanda.

## Verificación

497 casos automáticos, eslint a cero, 22 pantallas renderizadas.
As probas van en `probas/` por se algún día podes correlas ti.
