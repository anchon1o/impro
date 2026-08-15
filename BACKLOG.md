# BACKLOG — ImproApp

> Rexistro de bugs, melloras e ideas. Actualízao ao final de cada sesión.
> **Última actualización:** agosto 2026

Desde agosto hai tamén un **rexistro en vivo** dentro da app: botón 🐛 en calquera pantalla, triaxe en **Admin → 🐛 Reportes**, con exportación a markdown para pegar nunha conversa. Este ficheiro queda para o plan de fondo.

---

## 🔥 ABERTO AGORA

| ID | Descrición | Prio | Estado |
|---|---|---|---|
| A01 | Executar `supabase_dinamicas_seed.sql` e comprobar 247 | **P0** | 🔴 |
| A02 | Despregar `impro-dinamicas.zip` | **P0** | 🔴 |
| A03 | Comprobar Guía (247) e Admin → Dinámicas → 🧮 Táboa | **P0** | 🔴 |
| A04 | Tras A03: quitar `DINAMICAS_BASE` de `datos.js` (−160 kB) | P1 | 🔴 |
| A05 | Borrar `src/tabs/UniversoAxenda.jsx` se aínda existe | P2 | 🔴 |

```sql
select count(*) from public.dinamicas where es_base;   -- debe dar 247
```

---

## 🎨 REVISIÓN VISUAL — acordado, sen implementar

| ID | Descrición | Prio | Estado | Notas |
|---|---|---|---|---|
| V01 | Admin sobe á cabeceira; botonera a 11 áreas | P1 | 🔴 | É a única que non se usa *facendo* impro |
| V02 | Tarxetas máis baixas: 148→~110 px, móbil 116→~96 | P1 | 🔴 | Hoxe teñen moito aire morto |
| V03 | Menú `⋯` en reixa de 3 columnas, icona + etiqueta pequena | P1 | 🔴 | Agora son 3 botóns anchos apilados |
| V04 | Unificar 40 tamaños de fonte soltos nos 9 de `TYPE` | P2 | 🔴 | Mecánico, baixo risco |
| V05 | Cabeceira: `🎬 En directo` e `📺 Proxección` con texto en escritorio | P2 | 🔴 | 6 iconas sen etiqueta; `title` non existe en móbil |
| V06 | ⚪ Agrupar a botonera en 3 bloques | — | ⚪ | **Descartado**: mete un clic de máis en funcións directas |

---

## 🐛 BUGS (histórico)

| ID | Descrición | Prio | Estado | Notas |
|---|---|---|---|---|
| B01–B14 | *(ver historial anterior)* | — | 🟢 | Sesións, Manual, TABS, credenciais, joins a perfis… |
| B15 | Reto non amosaba as instrucións | P1 | 🟢 | Renderizaba `din.desc`, campo inexistente. **0 de 101** tiñan descrición visible |
| B16 | Reto e Guía discrepaban sobre que dinámicas existen | P1 | 🟢 | Reto lía só de localStorage |
| B17 | Unha dinámica propia facía desaparecer as 247 base | **P0** | 🟢 | `getDinamicas` devolvía só as da BD |
| B18 | Sala QR fantasma: o público vía «Sala non atopada» | **P0** | 🟢 | O insert non mandaba `user_id` e o erro non se comprobaba |
| B19 | Propostas do público lexibles por calquera | **P0** | 🟢 | `propostas` tiña `select: true` sen filtro |
| B20 | Salas eternas e sen código único | P1 | 🟢 | `expira_en` 12 h + índice único parcial |
| B21 | Temporizador da Proxección saltaba números | P2 | 🟢 | Dous `setInterval` sobre o mesmo valor |
| B22 | Desbordamento horizontal en móbil | P1 | 🟢 | Cabeceira medía 452 px; desbordaba ata nun iPhone Pro Max |
| B23 | 14 reixas sen `min()` | P1 | 🟢 | |
| B24 | Ao cambiar de tema desaparecían as franxas de cor | P1 | 🟢 | Mesturar `border` con `borderTop` |
| B25 | Modo claro con cores ilexibles desde sempre | P1 | 🟢 | Verde menta sobre branco = **1,4:1** (mínimo 3) |
| B26 | Pantalla branca total en produción | **P0** | 🟢 | `corDe = a => T[corDe(a)]`: recursión infinita por un replace global |
| B27 | Dous formularios distintos de Universo | P1 | 🟢 | O de Admin tiña 8 campos, sen imaxe nin redes |
| B28 | Código morto tras unificar formularios | P1 | 🟢 | **O build pasaba igual** |
| B29 | Admin → Categorías e Táboa en branco | **P0** | 🟢 | **5 imports faltaban en `TabAdmin.jsx`**: os `replace` fallaran en cascada |
| B30 | Faltaban GRANT nas táboas novas | P0 | 🟢 | RLS impecable pero «permission denied» |
| B31 | `url is not defined` na ficha de Universo | P0 | 🟢 | Había dous bloques de ligazóns; o replace só alcanzou un |
| B32 | Descrición «obrigatoria» estando chea | P1 | 🟢 | O formulario constrúe `desc`, o validador buscaba `descricion` |
| B33 | Imposible escribir comas nos campos de lista | P1 | 🟢 | O valor recalculábase do array en cada tecla: «Ana, Brais» → «AnaBrais» |
| B34 | Tres funcións inexistentes en `TabAjustes` | P1 | 🟢 | `buildTranslationExport` e outras. Atopadas por ESLint |
| B35 | Desplegable de tipos de dinámica baleiro | P1 | 🟢 | `Object.keys(colorTipo)` sobre unha **función** → `[]`. En 3 sitios |
| B36 | Ubicación só en categorías de tipo lugar | P1 | 🟢 | Unha compañía ten sede e unha persoa cidade base |
| B37 | Seed de dinámicas fallaba: falta `participantes` | P0 | 🟢 | O `alter table` non declaraba todas as columnas |

---

## ⚙️ TÉCNICO

| ID | Descrición | Prio | Estado | Notas |
|---|---|---|---|---|
| T05 | Migrar favoritos e historial a Supabase | P2 | 🔴 | Só localStorage |
| T07 | `LimiteErro` por sección | P1 | 🟢 | Raíz + pestana + sección de admin |
| T08 | Cores semánticas como tokens | P1 | 🟢 | 219 literais migrados |
| T09 | **Migrar dinámicas a Supabase** | P1 | 🟡 | SQL feito, **pendente de executar** (A01) |
| T10 | Reducir bundle (837 kB) | P1 | 🟡 | A metade resólvese con A04 |
| T11 | Hixiene do repo | P2 | 🔴 | Ver H01–H03 |
| T12 | ESLint como verificación | P1 | 🟢 | Substituíu o detector caseiro. Atopou B34 e 2 globais |
| T13 | Dividir `TabAdmin.jsx` (722 liñas, 9 seccións) | P2 | 🔴 | |
| T14 | Extraer un só hook de temporizador | P2 | 🔴 | Hai lóxica en 5 ficheiros. Xa causou B21 |
| T15 | Probas automatizadas no repo | P3 | 🔴 | Execútanse a man en cada entrega |

---

## 🧹 HIXIENE

| ID | Descrición | Prio | Estado |
|---|---|---|---|
| H01 | Borrar `supabase.js` e `main.jsx` da raíz | P2 | 🔴 |
| H02 | Sacar `.env.local` do control de versións | P2 | 🔴 |
| H03 | Borrar os `.DS_Store` rastrexados | P3 | 🔴 |

---

## ✨ FUNCIONALIDADES

| ID | Descrición | Prio | Estado |
|---|---|---|---|
| F01–F18 | *(base histórica)* | — | 🟢/🔴 |
| F19 | Botonera de inicio | P1 | 🟢 |
| F20 | Temporizador opcional con cronómetro | P1 | 🟢 |
| F21 | Sistema de temas + contraste WCAG | P1 | 🟢 |
| F22 | Rexistro de fallos 🐛 con exportación | P1 | 🟢 |
| F23 | Modelo de datos de Universo | P1 | 🟢 |
| F24 | Ficha rica de Universo | P1 | 🟢 |
| F25 | Propostas públicas con moderación | P1 | 🟢 |
| F26 | Táboa masiva de Universo | P2 | 🟢 |
| F27 | Tema «Escenario» de alto contraste | P3 | 🟢 |
| F28 | Mapa de Universo con pin por ficha | P1 | 🟢 |
| F29 | Categoría Garito | P2 | 🟢 |
| F30 | Axenda de eventos vinculada a Universo | P1 | 🟢 |
| F31 | Vista calendario mensual | P1 | 🟢 |
| F32 | Moderación de eventos en 3 niveis | P1 | 🟢 |
| F33 | Tipos de dinámica configurables | P1 | 🟢 |
| F34 | Táboa masiva de dinámicas | P1 | 🟡 | Feita, pendente de A01 |
| F35 | Axenda no mapa | P2 | 🔴 | Os eventos xa teñen lugar vinculado |
| F36 | Notificacións de eventos próximos | P3 | 🔴 |
| F37 | Exportar sesión a PDF | P3 | 🔴 |
| F38 | PWA instalable | P3 | 🔴 |

---

## 🌍 IDIOMAS

| ID | Descrición | Prio | Estado | Notas |
|---|---|---|---|---|
| I01 | Sistema de tradución de UI | P1 | 🟡 | **12 claves de 356 cadeas (3 %)** |
| I02 | **Extraer as 356 cadeas a `UI_STRINGS`** | P1 | 🔴 | 356 × 5 = 1.780 traducións. Sesión propia |
| I03 | Unificar a interface nunha soa lingua | P1 | 🟢 | 50 cadeas a galego |
| I04 | Traducir os 1.653 estímulos a GL | P2 | 🔴 | O fluxo xa existe |
| I05 | Tradución a EN | P2 | 🔴 | |
| I06 | Engadir PT e IT | P3 | 🔴 | `LANGS` xa os lista como «só contido» |

---

## 🔒 SEGURIDADE

| ID | Descrición | Prio | Estado | Notas |
|---|---|---|---|---|
| S01 | RLS de `propostas` | P0 | 🟢 | Era lectura aberta |
| S02 | RLS de `universo` para propostas anónimas | P0 | 🟢 | |
| S03 | GRANT en táboas novas | P0 | 🟢 | |
| S04 | Código de sala secreto | P2 | 🔴 | Con a anon key pódense listar as salas abertas. Require RPC (~20 liñas) |
| S05 | CAPTCHA real | P3 | 🔴 | Require servizo externo. Hoxe: honeypot + espera + límite por IP |
| S06 | Rate limit por IP fiable | P3 | 🔴 | `x-forwarded-for` é falsificable |

---

## 🔍 REDUNDANCIAS DETECTADAS

| Solapamento | Proposta | Estado |
|---|---|---|
| Guía e Manual | Mover o Manual a Axustes: 13 seccións que se len unha vez | 🔵 |
| Sesións e Grupos | Apenas se coñecen. Que o grupo activo filtre as sesións | 🔵 |
| Reto e Xerar | Reto é Xerar cunha dinámica. Podería ser un botón dentro | 🔵 |
| QR e Cabina | Ambas son de directo; as propostas xa saen en «En directo» | 🔵 |
| 5 temporizadores | Extraer un hook compartido (T14) | 🔴 |

---

## 💡 IDEAS

| ID | Idea | Notas |
|---|---|---|
| X02 | Compartir sesións entre facilitadores | |
| X04 | Modo «clase» para conservatorio | |
| X05 | Licenza educativa de Theatresports | Existe acordo para centros. Consultar en impro.global |
| X06 | Ampliar o catálogo | Quedan centos de entradas nas fontes identificadas |
| X07 | Fontes en castelán e galego | O catálogo é case todo anglosaxón |
| X08 | O grupo activo como contexto global | É o que lle falta a Grupos para deixar de ser unha illa |

---

## 🎯 PRÓXIMOS PASOS

**Agora:** A01 → A02 → A03 → A04 (despregar e confirmar a migración de dinámicas)

**Despois:** V01–V05 (revisión visual acordada)

**Curto prazo:** I02 (tradución completa) · T13 (dividir Admin) · X08 (grupo activo)

**Cando haxa motivo:** I04/I05 · F35 · S04 · X05

---

*Engade aquí calquera idea ou bug que detectes. Non filtres.*
