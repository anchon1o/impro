# ImproApp · estado completo · substitúe a TODOS os zips anteriores

Se non sabes cales aplicaches e cales non, **usa só este**. Leva o
`src/` enteiro no estado actual. Non fai falta aplicar ningún zip
anterior nin en ningunha orde.

## Como aplicalo

1. Arrastra `src/` sobre `impro/src/` → **FUSIONAR**, nunca substituír.
2. Copia `eslint.config.js` á raíz.
3. **BORRA A MAN `src/tabs/TabShow.jsx`.** Un zip non pode eliminar
   ficheiros. A Cabina desapareceu e ese ficheiro xa non o importa
   ninguén, pero segue pesando no bundle.
4. Comproba que `src/supabase.js` segue aí. Non vai neste zip a
   propósito.
5. Commit → Push.

## SQL

Van os dous ficheiros. **Se xa os executaches, non pasa nada por
repetilos**: son idempotentes, está comprobado.

- `supabase_sonido.sql` → debe devolver 7 filas, todas con `rls=true`
- `supabase_sonido_tags.sql` → 8 · 11 · 10 · 8 etiquetas

## Que hai dentro

**Sonido** (módulo novo, substitúe á Cabina): motor de audio multicapa,
buses, STOP e FADE, precarga con contador, metrónomo, contadores,
mesas, escenas, ficheiros do dispositivo en IndexedDB, Explorar con
etiquetas e busca, e Admin → 🔊 Sons con pegado masivo de URLs.

**Iconos**: os 34 SVG do set, sen emojis no menú nin na cabeceira.

**Botonera**: iconos a 52 px, sen descrición, botón `?` para amosalas.

**Bundle**: 624 kB de arranque. Sonido, Admin e Manual cárganse baixo
demanda.

## Verificación desta entrega
- ESLint: 0 erros
- 44 ficheiros con todos os compoñentes JSX importados
- 500+ casos de proba, todos pasando
- Build correcto
