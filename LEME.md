# ImproApp · `src/` completo · T16 + C11 + C12

Entrega completa. Fusionar, nunca substituír. Sen migracións novas.

⚠️ **Esta entrega inclúe tamén o R05 anterior** (nivelado e duck), que
non chegaches a aplicar. Con esta xa vai todo.

## T16 · `Sonido.jsx` dividido
De **921 a 726 liñas**. Saíron dous ficheiros:

- `src/sonido/pezas.jsx` — os compoñentes que se repiten:
  `BotonSon`, `Canle`, `CanleVertical`, `Contador`, `IconBtn`,
  `Panel`, `BusVol`, `ReixaEfectos`
- `src/sonido/medidas.js` — a constante `TOQUE`

**Os 102 casos da mesa pasaron sen tocar un só**: a división non cambiou
comportamento, que é o que había que comprobar.

## C11 · Faders verticais en modo función
Móvense mellor co polgar e caben moitas máis canles á vista: en
horizontal cada unha come todo o ancho e non entran nin catro.

⚠️ Faise con `writingMode: vertical-lr`, non con `rotate`. Rotado deixa
de responder ben ao dedo en iOS.

Fóra de modo función seguen horizontais.

## C12 · Botonera de efectos con páxinas
- **12** por páxina en móbil, **24** en tablet, **40** en modo función,
  que é onde a mesa ten a pantalla enteira.
- ⚠️ **O paxinador só aparece se sobran efectos.** Uns poucos non poden
  quedar detrás dun control que non fai falta.
- Se a lista encolle —cambiar de mesa, filtrar por grupo— a páxina
  actual axústase soa. Se non, a reixa quedaría en branco.

## Verificación
- eslint 0 · 22 pantallas · **696 casos** (10 novos)
- Build limpo. Sonido pasa de 75 a 78 kB; o arranque non se move (672).
