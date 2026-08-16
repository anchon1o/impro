# Sonido · os sons do dispositivo xa non se perden

## Ficheiros
- `src/audio/almacen.js` — **novo**. IndexedDB para os ficheiros do usuario.
- `src/sonido/TabSonido.jsx` — reescrito: persistencia, xestor, renomear,
  cambiar tipo, borrar, e aviso de espazo.
- `eslint.config.js` — engadidos os globais `indexedDB`, `IDBKeyRange`
  e `MediaMetadata`. Sen isto, ESLint marca `indexedDB` como non definido.

## Requisito previo
Vai enriba de todas as entregas de Sonido anteriores.
E lembra **borrar a man `src/tabs/TabShow.jsx`** se aínda está.

## Por que IndexedDB e non localStorage
`localStorage` só garda texto e ten uns 5 MB: un só ambiente de tres
minutos xa non entra. IndexedDB garda Blobs.

## O que hai que saber
Os ficheiros **non saen do dispositivo**. Non se soben a ningures, non
custan almacenamento e non teñen problema de licenzas.

Pero **non son unha copia de seguridade**: se borras os datos do navegador
márchanse, e Safari pode expulsalos se o aparello anda moi xusto de espazo
ou se pasan semanas sen abrir a web. A interface dío.
