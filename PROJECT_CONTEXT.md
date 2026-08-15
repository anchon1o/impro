# PROJECT_CONTEXT.md — ImproApp

> Pega este documento ao inicio de cada conversación con Claude para retomar o proxecto sen explicacións previas.
> Acompáñao sempre de **BACKLOG.md**.
> **Última actualización:** agosto 2026 · 41 ficheiros fonte, 8.156 liñas, bundle 837 kB

---

## ⚠️ 0. ESTADO EXACTO AGORA MESMO

**Hai traballo entregado pero SEN DESPREGAR.** Confirmar isto antes de nada:

| Paso | Que é | Estado |
|---|---|---|
| 1 | `supabase_dinamicas_seed.sql` no SQL Editor (136 kB, tarda uns segundos) | 🔴 pendente |
| 2 | Comprobar: `select count(*) from public.dinamicas where es_base;` → **247** | 🔴 |
| 3 | Despregar `impro-dinamicas.zip` (substituír `src/`, commit, push) | 🔴 |
| 4 | Comprobar que a Guía segue con 247 e que **Admin → Dinámicas → 🧮 Táboa** carga | 🔴 |

**Cando o paso 4 estea confirmado:** quitar `DINAMICAS_BASE` de `src/datos.js`. Son 160 kB e o bundle baixa de 837 a uns 670. Non facelo antes: é a rede de seguridade se a sementeira falla.

⚠️ **Borrar `src/tabs/UniversoAxenda.jsx`** se aínda existe: renomeouse a `TabAxenda.jsx`.

**Acordado para a seguinte quenda (revisión visual):**
- Admin sobe á cabeceira; a botonera baixa a 11 áreas
- Tarxetas da botonera máis baixas (148 → ~110 px; móbil 116 → ~96)
- O menú `⋯` de móbil, en reixa de tres columnas con icona arriba e etiqueta pequena
- Unificar os 40 tamaños de fonte soltos nos 9 da escala `TYPE`
- **Descartado:** agrupar a botonera en tres bloques (mete un clic de máis en funcións directas)

---

## 1. Qué é ImproApp

Ferramenta integral para facilitadores de teatro de improvisación: xerador de estímulos, planificación de sesións, biblioteca de 247 dinámicas, control de show en directo, directorio colaborativo con mapa, axenda de eventos e recollida de propostas do público via QR.

**Autor:** ancho (`anchon1o`).

---

## 2. Infraestrutura

| Servizo | Valor |
|---|---|
| Repo | `anchon1o/impro` |
| Deploy | `improapp.vercel.app` |
| Backend | Supabase (proxecto `impro`) |
| Local | GitHub Desktop no Mac, **sen terminal** |

### ⚠️ Credenciais

Viven en variables de contorno, nunca en ficheiros do repo:

```
VITE_SUPABASE_URL=https://....supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Local: `impro/.env.local` · Produción: Vercel → Settings → Environment Variables.

**`src/supabase.js` NUNCA se inclúe nas entregas de Claude.** É o ficheiro que unha vez sobrescribiu as credenciais reais e tirou a app.

---

## 3. Stack

React 18 + Vite · CSS inline en obxectos JS · Inter + JetBrains Mono · Supabase (Auth, PostgreSQL con RLS, Realtime) · Vercel · Web Audio API.

Dependencias non-React: **`@supabase/supabase-js`** só. Leaflet cárgase baixo demanda desde CDN para os mapas, non como dependencia do proxecto.

---

## 4. Estrutura

```
impro/
  eslint.config.js          ← detección de identificadores non definidos
  src/
    ImproApp.jsx            ← navegación, cabeceira, AuthGate
    Inicio.jsx              ← botonera + DESCS traducidas (es/gl/en)
    LimiteErro.jsx          ← error boundary: raíz + por pestana + por sección
    core.jsx                ← contextos, TEMAS, hooks, sistema de deseño
    supabase.js             ← NUNCA se entrega
    db.js · auth.js · estimulos.js · universo.js · universoModelo.js
    eventos.js · reportes.js · datos.js
    PantallaPublica.jsx · ModoShow.jsx
    tabs/                   ← 22 ficheiros
    auth/
  supabase_*.sql            ← 12 migracións
  PROJECT_CONTEXT.md · BACKLOG.md
```

---

## 5. Temas e sistema de deseño

**4 presets** con par día/noite: ImproApp (magenta), FIT (azul `#0199DC` / amarelo `#FEFB4E`), aescoladeimpro (verde `#3A8C86`), Escenario (alto contraste). Máis tema propio con **validación de contraste WCAG 2.1**. Os 8 pasan a validación.

### Tokens

```
bg bg2 bg3 bg4 · border border2 · text text2 text3 text4
nav navBorder · input inputBorder · accent
ok warn info danger alt muted        ← semánticos
```

⚠️ **Non escribir cores a man.** Todo por `T.<token>`. Para categorías: `colorTipo(T,tipo)`, `bcol(T,k)`, `teamCol(T,i)`.

⚠️ **Non mesturar `border` con `borderTop/Left/...`.** React só reescribe o que mudou; a abreviatura reinicia os catro lados e a franxa de cor desaparece ao cambiar de tema. Usar só propiedades longas (`borderStyle`, `borderWidth`, `border*Color`).

`mkS(T)` → `panel`, `btn()`, `input`, `ptitle()`, `tag()`, `h1/h2/h3`, `body`, `caption`, `num()`, `grid()`.
`useViewport()` → `{w, esMovil, esTablet, esPC}`. Cortes: 520 e 900.

Campos a 16px (iOS fai zoom por baixo), botóns `minHeight:38`, reixas con `minmax(min(Npx,100%),1fr)`.

---

## 6. Módulos (12 áreas)

Abre na **botonera de inicio**. O logo 🎭 volve alí.

| Área | Notas |
|---|---|
| 🎲 Xerar | 1.653 estímulos, 11 categorías, simple/plus, escenas, plantillas |
| ⚡ Reto | Dinámica + estímulos con instrucións despregables |
| 🎛 Cabina | Audio multipista, efectos, metrónomo, escaleta, sorteos |
| 📖 Guía | 247 dinámicas con pasos, obxectivo, variantes, autoría |
| 📋 Sesións | Bloques, plantillas, Pomodoro. Require conta |
| 👥 Grupos | Require conta |
| 📱 QR | Salas en tempo real, caducidade 12 h, illadas entre si |
| 🌍 Universo | Fichas · 🗺 Mapa. Categorías configurables |
| 📅 Axenda | Lista · 🗓 Calendario. Eventos vinculados a Universo |
| 📘 Manual | 13 seccións, 50 apartados |
| ⚙️ Axustes | Tema, idioma, backup, estatísticas |
| 🔐 Admin | 9 seccións |

**Fóra da botonera:** 🎬 En directo · 📺 Proxección · 🐛 Reportar (botón flotante).

**Nomenclatura:** Cabina = onde PREPARAS · En directo = o que manexas DURANTE · Proxección = o que ve a sala.

---

## 7. Panel de Admin (9 seccións)

👤 Usuarios · ✦ Estímulos · 🌐 Idiomas · 📖 Dinámicas *(lista · 🧮 Táboa · 🎯 Tipos)* · 🌍 Universo *(Pendentes · Fichas · Táboa · 🏷 Categorías)* · 📅 Axenda · 🐛 Reportes · 👥 Grupos · 📊 Stats · ⚙️ Config

**Limitación:** non se poden crear contas con contrasinal desde o panel (requiriría service role key nun backend). Fluxo: auto-rexistro + aprobación.

---

## 8. Base de datos

**Táboas:** `perfis`, `estimulos`, `categorias`, `user_stimuli`, `dinamicas`, `dinamicas_tipos`, `sesiones`, `grupos`, `plantillas_escena`, `playlists`, `efectos`, `salas`, `propostas`, `historial_salas`, `universo`, `universo_categorias`, `universo_rate`, `eventos`, `reportes`, `stats_global`, `progreso_traducion`.

**Migracións, en orde:**
```
supabase_schema.sql · supabase_auth.sql · supabase_anon.sql
supabase_estimulos.sql · supabase_estimulos_data.sql
supabase_universo.sql · _patch.sql · _seed.sql
supabase_salas_fix.sql
supabase_universo_modelo.sql
supabase_universo_grants.sql       ← ⚠️ permisos de táboa
supabase_reportes.sql
supabase_universo_mapa.sql         ← coordenadas + categoría Garito
supabase_dinamicas_tipos.sql
supabase_eventos.sql
supabase_eventos_moderacion.sql
supabase_dinamicas_seed.sql        ← 🔴 PENDENTE DE EXECUTAR
```

### ⚠️ Catro trampas documentadas

**1. RLS ≠ GRANT.** `GRANT` decide se un rol pode *tocar* a táboa; a RLS decide *que filas* ve. Postgres comproba o permiso ANTES da política e responde «permission denied». **Toda táboa nova precisa as dúas cousas.**

**2. Joins con `perfis` non funcionan.** As columnas `user_id` referencian `auth.users`, non `perfis`. `.select('*, perfis(nome)')` devolve lista baleira *sen erro aparente*. Consultar `perfis` á parte con `.in('id', ids)` e xuntar en memoria.

**3. `universo.verificado` é columna XERADA** de `estado = 'publicada'`. Lese con normalidade; **escribir nela falla**. Usar `moderarUniverso(id, estado)`.

**4. Non supoñer que existe unha columna.** A táboa `dinamicas` creouse hai tempo e non tiña `participantes`; o insert fallou enteiro. Nos `alter table`, listar **todas** as columnas con `if not exists`.

### Patrón de compatibilidade

Varias funcións de carga devolven un **array que ademais leva propiedades**:

```js
const c = await cargarCategorias();        // c.filter(...)  ✔
const {cats, erro} = await cargarCategorias();  // cats       ✔
```

Faise así porque cambiar a forma de retorno rompeu a app cando un ficheiro se actualizou e outro non. Aplícase a `cargarCategorias`, `cargarTiposDinamica`, `listarEventos` e `getDinamicas`.

---

## 9. Permisos por perfil

| Acción | Sen conta | Con conta | Admin |
|---|---|---|---|
| Xerar, Guía, Cabina, En directo, Proxección | ✓ | ✓ | ✓ |
| Ver Universo e Axenda | ✓ | ✓ | ✓ |
| Enviar propostas por QR | ✓ | ✓ | ✓ |
| Propoñer entradas a Universo | ✓ | ✓ | ✓ |
| Reportar fallos | ✓ | ✓ | ✓ |
| Dinámicas propias, sesións, grupos, salas QR | — | ✓ | ✓ |
| Suxerir eventos (quedan **pendentes**) | — | ✓ | ✓ |
| Publicar, moderar, editar corpus, categorías | — | — | ✓ |

```sql
update perfis set rol = 'admin' where email = 'o_teu@email.com';
```

---

## 10. Contido

**247 dinámicas** — 67 entrenamiento, 66 juego, 55 calentamiento, 29 formato, 16 musical, 10 cierre, 4 pausa. Media 14,1 min e 4,6 pasos.

⚠️ **Autoría.** 146 catalogadas de improvgames.com e improvencyclopedia.org, **coas instrucións redactadas de cero**: non se reproduce texto das fontes. 9 levan autoría e 4 aviso de licenza: **Theatresports™, Maestro Impro™ e Gorilla Theatre™** son marcas rexistradas do International Theatresports Institute (3 % da recadación bruta; **existe acordo educativo para centros de ensino**, relevante para o conservatorio). «Trilogía del error» (Improvisual Project) leva ficha descritiva, non receita de montaxe.

**1.653 estímulos** en 11 categorías, niveis simple/plus, columna por idioma (es/gl/en/pt/it), caché local de 24 h.

**27 entradas de Universo** verificadas. Categorías configurables con 4 plantillas: entidade, proxecto, evento, lugar.

**Idioma:** interface en galego, unificada. ⚠️ **`UI_STRINGS` só ten 12 claves de 356 cadeas visibles (3 %)**. Cambiar de idioma hoxe só cambia os menús e as descricións da botonera. O contido (estímulos, dinámicas) está en castelán a propósito: ten a súa propia táboa multilingüe.

---

## 11. Normas de traballo con Claude

1. **Ver o ficheiro real antes de modificar.** Nunca desde memoria nin desde resumo.
2. **`npm run build` NON abonda.** Non detecta: identificadores non importados, recursións infinitas, código morto que referencia variables borradas, exports inexistentes.
3. **Verificación obrigatoria en cada entrega:**
   - `npx eslint src` → 0 erros
   - render con `react-test-renderer` + `act()` (o render a texto **non executa `useEffect`**)
   - migracións contra Postgres real (`pip install pgserver`)
4. **Probar o PEOR CASO do esquema**, non un inventado. Se non se sabe que columnas ten unha táboa, declaralas todas.
5. **Coidado coas substitucións globais.** Un `replace` de `a.cor` alcanzou a definición da propia función e creou unha recursión infinita → pantalla branca en produción. Outro rompeu 50 palabras acentuadas nun PDF.
6. **Comprobar que cada `replace` se aplicou.** Cinco imports fallaron en silencio en cascada porque a áncora do primeiro non existía.
7. **Entregar zips completos**, nunca diffs. Sen `src/supabase.js`. Indicar sempre que ficheiros cambian de verdade.
8. **Confirmar o despregue antes de diagnosticar.** Varias veces o «segue fallando» era que o bundle non cambiara: comprobar o hash do `.js` con `Cmd+Opt+U`.
9. **Emojis en PDF:** ReportLab non os renderiza (saen cadrados negros). Usar `emojilib.py`: SVG de Twemoji → PNG inline.
10. **Datos reais.** Verificar por busca web antes de engadir contido. Respectar a autoría: catalogar con atribución, non copiar textos.

---

## 12. Fluxo

1. Pegar `PROJECT_CONTEXT.md` + `BACKLOG.md`
2. Indicar a tarefa
3. Claude: ver ficheiros → modificar → **eslint + build + render + SQL en Postgres** → zip
4. Executar os `.sql` en Supabase **antes** de subir código
5. Arrastrar → GitHub Desktop → Commit → Push
6. Vercel redesprega en 1-2 min
7. Actualizar `BACKLOG.md`

**Se algo rompe:** Vercel → Deployments → o anterior que funcionaba → `⋯` → Promote to Production. Tarda uns 30 segundos.

---

*Fin do documento de contexto.*
