# ImproApp · `src/` completo · T13 · TabAdmin dividido

Entrega completa. Fusionar, nunca substituír. Sen migracións novas.

⚠️ **Se non aplicaches a anterior, esta xa leva todo**: R05 (nivelado e
duck), T16 (Sonido dividido), C11 (faders verticais), C12 (páxinas de
efectos) e agora T13.

## T13 · `TabAdmin.jsx` de 727 a 79 liñas

Queda só coa navegación entre seccións. As once seccións saíron a cinco
ficheiros, agrupadas por afinidade e non unha por ficheiro:

| Ficheiro | Seccións |
|---|---|
| `AdminUsuarios.jsx` | Usuarios · Grupos |
| `AdminEstimulos.jsx` | Estímulos · Traducións |
| `AdminUniverso.jsx` | Universo |
| `AdminDinamicas.jsx` | Dinámicas |
| `AdminSistema.jsx` | Estatísticas · Configuración |

**Estímulos e Traducións van xuntas** porque as traducións son dos
propios estímulos: separalas obrigaría a duplicar a carga do corpus.

## ⚠️ Como se comprobou que non rompeu nada
Ao dividir, o risco real é que unha sección quede sen un import: **o
build pasaría igual** e a pantalla rebentaría só ao abrila.

Por iso engadín ao harness as **oito seccións por separado**, cada unha
renderizada soa con `act()`. Antes só se probaba `TabAdmin` enteiro, que
monta unha sección de cada vez e deixaba as outras sete sen tocar.

ESLint xa cazou unha: `cargarTiposDinamica` quedara fóra.

## Reexportacións
`TabAdmin.jsx` segue exportando as seccións, para non romper a quen as
importase desde alí.

## Estado dos ficheiros grandes
| Antes | Agora |
|---|---|
| `Sonido.jsx` 921 | **726** |
| `TabAdmin.jsx` 727 | **79** |

Os máis grandes que quedan son `core.jsx` (664) e `iconos.jsx` (556), e
os dous son listas de datos máis que lóxica.

## Verificación
- eslint 0 · **30 pantallas** renderizadas (antes 22) · 696 casos
- Build limpo, arranque sen cambio: 672 kB
