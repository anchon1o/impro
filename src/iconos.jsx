// ═══════════════════════════════════════════════════════════════════
// ICONOS
// ═══════════════════════════════════════════════════════════════════
// Set monocromo de 24×24, inserido INLINE e non como ficheiros .svg.
//
// ⚠️ Por que inline e non `<img src="icona.svg">`:
//   · `currentColor` só funciona co SVG dentro do documento. Nun <img>
//     o navegador trátao como imaxe illada e a cor do tema non entra.
//   · Sen peticións de rede: nun local sen wifi os iconos seguen aí.
//   · Un só ficheiro que revisar en vez de 34.
//
// ⚠️ `viewBox="0 0 24 24"` NON limita o tamaño. É o sistema de
// coordenadas, non píxeles: o mesmo icono debúxase nítido a 24 e a 256.
// O que si depende do deseño é a DENSIDADE de detalle. Son formas
// sólidas (`fill`), non trazos finos, así que amplían ben; se algún día
// se quere máis detalle, engádese dentro do mesmo viewBox.
//
// Todas as formas usan `fill="currentColor"`, así que a cor decídese
// desde fóra co token do tema:
//     <Icona nome="sonido" size={30} cor={T.accent}/>
// ═══════════════════════════════════════════════════════════════════


const FORMAS = {

  // ── Áreas da botonera ──
  generar: (
    <>
      <circle cx="5" cy="15.2" r="3.6" fill="currentColor"/>
      <rect x="10.2" y="3.1" width="5.8" height="5.8" rx="0.8" transform="rotate(38 13.1 6)" fill="currentColor"/>
      <path d="M13.85 12.55c.54 0 .88.58.61 1.05l-2.7 4.68a.7.7 0 0 1-.61.35H6.84c-.54 0-.88-.58-.61-1.05l2.7-4.68a.7.7 0 0 1 .61-.35h4.31Z" fill="currentColor"/>
      <circle cx="8.1" cy="8.7" r="0.75" fill="currentColor"/>
      <circle cx="9.6" cy="7.4" r="0.55" fill="currentColor"/>
      <circle cx="10.7" cy="9.2" r="0.9" fill="currentColor"/>
      <circle cx="12.1" cy="10.9" r="0.65" fill="currentColor"/>
      <circle cx="13.4" cy="12.0" r="0.48" fill="currentColor"/>
    </>
  ),
  reto: (
    <>
      <path d="M5.2 14.8 10.4 9.5c.34-.35.92-.27 1.16.16l.76 1.34c.15.27.5.4.79.28l2.42-.96c.66-.26 1.27.47.9 1.08l-4.6 7.47a.8.8 0 0 1-.68.38H6a.8.8 0 0 1-.8-.8c0-.14.04-.27.12-.39Z" fill="currentColor"/>
      <path d="M12.7 4.3c0-.56.58-.92 1.08-.67l4.3 2.16c.65.33.62 1.27-.06 1.55l-4.3 1.79a.75.75 0 0 1-1.03-.69V4.3Z" fill="currentColor"/>
      <circle cx="15.2" cy="15.7" r="3.3" fill="currentColor"/>
    </>
  ),
  sonido: (
    <>
      <rect x="4.2" y="5.1" width="1.9" height="9.4" rx="0.95" fill="currentColor"/>
      <rect x="9.1" y="3.1" width="1.9" height="13.8" rx="0.95" fill="currentColor"/>
      <rect x="14" y="5.8" width="1.9" height="8.7" rx="0.95" fill="currentColor"/>
      <circle cx="16.7" cy="13.7" r="2.4" fill="currentColor"/>
    </>
  ),
  guia: (
    <>
      <circle cx="4.5" cy="17.6" r="2.5" fill="currentColor"/>
      <path d="M7.1 16.3v-1.35c0-1.05.85-1.9 1.9-1.9h4.4v-1.7c0-.45.53-.69.87-.4l2.76 2.3c.26.22.26.62 0 .84l-2.76 2.3a.56.56 0 0 1-.87-.4v-1.64H9.5c-1.33 0-2.4 1.07-2.4 2.4v.7H4.9c0-.47.98-1.08 2.2-1.08Z" fill="currentColor"/>
      <circle cx="8.7" cy="14.2" r="0.62" fill="currentColor"/>
      <circle cx="10.6" cy="14.2" r="0.62" fill="currentColor"/>
      <circle cx="12.5" cy="14.2" r="0.62" fill="currentColor"/>
    </>
  ),
  sesiones: (
    <>
      <rect x="3.5" y="10" width="4.3" height="4.3" rx="0.7" fill="currentColor"/>
      <rect x="9.2" y="9.1" width="4.6" height="4.6" rx="0.7" fill="currentColor"/>
      <circle cx="18.1" cy="11.8" r="3.2" fill="currentColor"/>
      <rect x="7.6" y="11.2" width="1.9" height="1.3" rx="0.4" fill="currentColor"/>
      <rect x="13.7" y="11.1" width="1.9" height="1.4" rx="0.4" fill="currentColor"/>
    </>
  ),
  grupos: (
    <>
      <circle cx="6.2" cy="9" r="2.1" fill="currentColor"/>
      <circle cx="17.8" cy="9" r="2.1" fill="currentColor"/>
      <circle cx="12" cy="5.8" r="2.35" fill="currentColor"/>
      <path d="M3.7 18.4c0-2.06 1.67-3.73 3.73-3.73h1.55c2.06 0 3.73 1.67 3.73 3.73 0 .5-.4.9-.9.9H4.6a.9.9 0 0 1-.9-.9Z" fill="currentColor"/>
      <path d="M11.23 18.55c0-1.55 1.26-2.81 2.81-2.81h1.92c1.55 0 2.81 1.26 2.81 2.81 0 .43-.35.79-.79.79h-5.96a.79.79 0 0 1-.79-.79Z" fill="currentColor"/>
      <path d="M8.6 17.9c0-.38.3-.68.68-.68h5.44c.38 0 .68.3.68.68 0 1.34-1.52 2.42-3.4 2.42s-3.4-1.08-3.4-2.42Z" fill="currentColor"/>
    </>
  ),
  qr: (
    <>
      <path d="M4.3 3.5H8a.8.8 0 0 1 0 1.6H5.9v2.1a.8.8 0 0 1-1.6 0V4.3c0-.44.36-.8.8-.8Zm11.7 0h3.7c.44 0 .8.36.8.8v2.9a.8.8 0 0 1-1.6 0V5.1H16a.8.8 0 0 1 0-1.6Zm3.7 12.1a.8.8 0 0 1 .8.8v3.3a.8.8 0 0 1-.8.8H16a.8.8 0 0 1 0-1.6h2.1v-2.5a.8.8 0 0 1 .8-.8Zm-14.6 0a.8.8 0 0 1 .8.8v2.5H8a.8.8 0 0 1 0 1.6H4.3a.8.8 0 0 1-.8-.8v-3.3a.8.8 0 0 1 .8-.8Z" fill="currentColor"/>
      <circle cx="12" cy="12" r="2.45" fill="currentColor"/>
    </>
  ),
  universo: (
    <>
      <path d="M12 4.1c3.1 0 5.55 1.95 5.55 4.95 0 1.69-.78 3.12-2.14 4.02l-2.41 1.57c-.46.3-1.06.28-1.49-.05L8.8 12.67A4.87 4.87 0 0 1 6.45 8.7c0-2.77 2.56-4.6 5.55-4.6Z" fill="currentColor"/>
      <path d="M5.1 12.1c2.23-1.8 5.56-2.95 8.34-2.85 2.25.08 4.36 1 5.43 2.75.16.26.07.6-.19.75-.26.16-.6.07-.75-.19-.88-1.43-2.63-2.16-4.53-2.23-2.5-.09-5.55.97-7.61 2.63-.24.2-.6.16-.79-.08-.2-.24-.16-.6.08-.79Z" fill="currentColor"/>
      <path d="M6.2 9.5c-.6 2.9-.24 5.05 1.26 6.56.2.2.52.22.75.05 2.1-1.55 5.14-2.33 8.12-2.13.32.03.57.31.55.63a.6.6 0 0 1-.63.55c-2.65-.18-5.32.5-7.2 1.85-2.8-3.05-2.46-7.16-1.66-9.86" fill="currentColor" opacity="0.95"/>
      <circle cx="5.4" cy="6.8" r="1.1" fill="currentColor"/>
      <circle cx="18.2" cy="15.3" r="1.45" fill="currentColor"/>
    </>
  ),
  axenda: (
    <>
      <path d="M6 4.2A1.8 1.8 0 0 1 7.8 2.4h8.4A1.8 1.8 0 0 1 18 4.2v13.6a1.8 1.8 0 0 1-1.8 1.8H7.8A1.8 1.8 0 0 1 6 17.8V4.2Zm3.2 0a.8.8 0 0 0-.8-.8.8.8 0 1 0 0 1.6.8.8 0 0 0 .8-.8Zm6.4 0a.8.8 0 0 0-.8-.8.8.8 0 1 0 0 1.6.8.8 0 0 0 .8-.8Z" fill="currentColor"/>
      <rect x="7.6" y="6.7" width="8.8" height="1.55" rx="0.5" fill="currentColor" opacity="0.22"/>
      <circle cx="9.1" cy="11" r="1.1" fill="currentColor" opacity="0.22"/>
      <circle cx="12" cy="11" r="1.1" fill="currentColor" opacity="0.22"/>
      <circle cx="14.9" cy="11" r="1.1" fill="currentColor" opacity="0.22"/>
      <circle cx="9.1" cy="14.5" r="1.1" fill="currentColor" opacity="0.22"/>
      <circle cx="12" cy="14.5" r="1.1" fill="currentColor" opacity="0.22"/>
      <circle cx="14.9" cy="14.5" r="1.1" fill="currentColor" opacity="0.22"/>
    </>
  ),
  manual: (
    <>
      <path d="M6.1 2.8h7.7l4.1 4.03v11.17a1.8 1.8 0 0 1-1.8 1.8H6.1a1.8 1.8 0 0 1-1.8-1.8V4.6a1.8 1.8 0 0 1 1.8-1.8Z" fill="currentColor"/>
      <path d="M13.8 2.8v3.1c0 .55.45 1 1 1h3.1" fill="currentColor" opacity="0.22"/>
      <rect x="7.8" y="10" width="6.6" height="1.35" rx="0.55" fill="currentColor" opacity="0.22"/>
      <rect x="7.8" y="13.1" width="4.6" height="1.35" rx="0.55" fill="currentColor" opacity="0.22"/>
      <circle cx="15.6" cy="15.45" r="1.55" fill="currentColor" opacity="0.22"/>
    </>
  ),
  ajustes: (
    <>
      <path d="M10.65 2.7a1 1 0 0 1 1.7 0l1.02 1.72c.24.4.72.57 1.16.43l1.9-.62a1 1 0 0 1 1.2.7l.43 1.95c.1.46.49.8.96.83l2 .15a1 1 0 0 1 .85 1.47l-.95 1.77c-.22.41-.16.92.15 1.27l1.32 1.5a1 1 0 0 1 0 1.33l-1.32 1.5c-.31.35-.37.86-.15 1.27l.95 1.77a1 1 0 0 1-.84 1.47l-2 .15c-.47.03-.86.37-.97.83l-.43 1.95a1 1 0 0 1-1.2.7l-1.9-.62a1 1 0 0 0-1.16.43l-1.02 1.72a1 1 0 0 1-1.7 0l-1.02-1.72a1 1 0 0 0-1.16-.43l-1.9.62a1 1 0 0 1-1.2-.7l-.43-1.95a1 1 0 0 0-.96-.83l-2-.15a1 1 0 0 1-.85-1.47l.95-1.77c.22-.41.16-.92-.15-1.27l-1.32-1.5a1 1 0 0 1 0-1.33l1.32-1.5c.31-.35.37-.86.15-1.27L2.99 9.3a1 1 0 0 1 .85-1.47l2-.15c.47-.03.86-.37.96-.83l.43-1.95a1 1 0 0 1 1.2-.7l1.9.62a1 1 0 0 0 1.16-.43l1.02-1.72Z" fill="currentColor"/>
      <circle cx="11.5" cy="12" r="3.2" fill="currentColor" opacity="0.22"/>
    </>
  ),

  // ── Cabeceira e sistema ──
  admin: (
    <>
      <rect x="5.3" y="10.3" width="13.4" height="9.2" rx="1.8" fill="currentColor"/>
      <path d="M8.1 10V7.7a3.9 3.9 0 1 1 7.8 0V10h-2.1V7.85a1.8 1.8 0 1 0-3.6 0V10H8.1Z" fill="currentColor"/>
      <circle cx="12" cy="14.8" r="1.4" fill="currentColor" opacity=".22"/>
    </>
  ),
  endirecto: (
    <>
      <rect x="3.8" y="7" width="10.7" height="9.2" rx="1.6" fill="currentColor"/>
      <path d="M14.1 9.2 18.8 6.8c.53-.28 1.17.1 1.17.7v8.1c0 .6-.64.98-1.17.7L14.1 13.9V9.2Z" fill="currentColor"/>
      <circle cx="8.2" cy="11.6" r="1.2" fill="currentColor" opacity=".22"/>
    </>
  ),
  proxeccion: (
    <>
      <rect x="4" y="4.3" width="16" height="10.6" rx="1.6" fill="currentColor"/>
      <path d="M11 15.1h2l2 3.1H9l2-3.1Z" fill="currentColor"/>
      <rect x="6.4" y="6.6" width="11.2" height="6.0" rx="0.7" fill="currentColor" opacity=".22"/>
    </>
  ),
  temporizador: (
    <>
      <circle cx="12" cy="12.8" r="7.3" fill="currentColor"/>
      <rect x="10.2" y="2.6" width="3.6" height="2.2" rx="0.7" fill="currentColor"/>
      <rect x="16.6" y="4.5" width="2.2" height="1.15" rx="0.5" transform="rotate(42 16.6 4.5)" fill="currentColor"/>
      <path d="M12 12.8V8.5" stroke="currentColor" strokeOpacity=".22" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12.8" r="1.2" fill="currentColor" opacity=".22"/>
    </>
  ),
  idioma: (
    <>
      <circle cx="12" cy="12" r="8.6" fill="currentColor"/>
      <path d="M5 12h14" stroke="currentColor" strokeOpacity=".22" strokeWidth="1.35" strokeLinecap="round"/>
      <path d="M12 3.7c1.87 1.83 3 4.95 3 8.3 0 3.35-1.13 6.47-3 8.3-1.87-1.83-3-4.95-3-8.3 0-3.35 1.13-6.47 3-8.3Z" fill="currentColor" opacity=".22"/>
      <path d="M6.1 7.4h11.8M6.1 16.6h11.8" stroke="currentColor" strokeOpacity=".22" strokeWidth="1.1" strokeLinecap="round"/>
    </>
  ),
  tema: (
    <>
      <path d="M15.25 3.7a7.82 7.82 0 1 0 4.95 13.85A8.6 8.6 0 1 1 15.25 3.7Z" fill="currentColor"/>
    </>
  ),
  salir: (
    <>
      <path d="M12 2.6a9.4 9.4 0 1 1-6.64 2.76.95.95 0 1 1 1.34 1.34A7.5 7.5 0 1 0 12 4.5a.95.95 0 0 1 0-1.9Z" fill="currentColor"/>
      <rect x="11" y="2.1" width="2" height="9.2" rx="1" fill="currentColor"/>
    </>
  ),

  // ── Accións ──
  aleatorio: (
    <>
      <path d="M4.4 7.3h4.1c1.42 0 2.2.53 3.22 1.67l5.2 5.77c.53.58 1 .88 1.86.88h.77" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.9 13.9 20 17l-3.1 3.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.4 16.7h4.1c1.42 0 2.2-.53 3.22-1.67l1.44-1.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.9 4.9 20 8l-3.1 3.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.15 10.08 17 7.1c.53-.58 1-.88 1.86-.88h.77" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  axuda: (
    <>
      <path d="M12 3.2c4.86 0 8.8 3.4 8.8 7.6 0 1.8-.76 3.46-2.04 4.78-.24.25-.33.6-.24.94l.62 2.3a.7.7 0 0 1-.87.86l-2.65-.75a1.2 1.2 0 0 0-.82.06c-.86.38-1.81.6-2.82.6-4.86 0-8.8-3.4-8.8-7.6 0-4.2 3.94-7.6 8.8-7.6Z" fill="currentColor"/>
      <path d="M9.8 9.7a2.2 2.2 0 1 1 3.23 1.95c-.77.4-1.03.74-1.03 1.55" stroke="currentColor" strokeOpacity=".22" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="12" cy="15.8" r="1" fill="currentColor" opacity=".22"/>
    </>
  ),
  buscar: (
    <>
      <circle cx="10.2" cy="10.2" r="5.5" fill="currentColor"/>
      <rect x="13.8" y="14.7" width="6.2" height="2.2" rx="1.1" transform="rotate(45 13.8 14.7)" fill="currentColor"/>
      <circle cx="10.2" cy="10.2" r="2.8" fill="currentColor" opacity=".22"/>
    </>
  ),
  compartir: (
    <>
      <circle cx="6.2" cy="12.2" r="2.1" fill="currentColor"/>
      <circle cx="17.7" cy="6.9" r="2.1" fill="currentColor"/>
      <circle cx="17.7" cy="17.1" r="2.1" fill="currentColor"/>
      <path d="M7.9 11.1 16 7.9M7.9 13.3 16 16.1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"/>
    </>
  ),
  descargar: (
    <>
      <rect x="4.2" y="17.1" width="15.6" height="2.2" rx="1.1" fill="currentColor"/>
      <rect x="10.9" y="4.1" width="2.2" height="9.3" rx="1.1" fill="currentColor"/>
      <path d="M8 11.4 12 15.4l4-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  duplicar: (
    <>
      <rect x="6.2" y="7.2" width="9.4" height="9.4" rx="1.3" fill="currentColor" opacity=".88"/>
      <rect x="9.1" y="4.3" width="9.4" height="9.4" rx="1.3" fill="currentColor"/>
    </>
  ),
  editar: (
    <>
      <path d="M4.7 16.9 15.4 6.2a1.8 1.8 0 0 1 2.55 0l.83.83a1.8 1.8 0 0 1 0 2.55L8.1 20.3l-3.9.72a.7.7 0 0 1-.83-.83l.72-3.9Z" fill="currentColor"/>
      <path d="m14.3 7.3 2.4 2.4" stroke="currentColor" strokeOpacity=".22" strokeWidth="1.3" strokeLinecap="round"/>
    </>
  ),
  eliminar: (
    <>
      <rect x="6.3" y="7.5" width="11.4" height="12.1" rx="1.6" fill="currentColor"/>
      <rect x="4.7" y="5.3" width="14.6" height="1.9" rx="0.95" fill="currentColor"/>
      <rect x="9.1" y="3.4" width="5.8" height="1.8" rx="0.9" fill="currentColor"/>
      <rect x="9" y="10" width="1.5" height="6.2" rx="0.75" fill="currentColor" opacity=".22"/>
      <rect x="13.5" y="10" width="1.5" height="6.2" rx="0.75" fill="currentColor" opacity=".22"/>
    </>
  ),
  engadir: (
    <>
      <circle cx="12" cy="12" r="8.4" fill="currentColor"/>
      <rect x="11" y="6.4" width="2" height="11.2" rx="1" fill="currentColor" opacity=".22"/>
      <rect x="6.4" y="11" width="11.2" height="2" rx="1" fill="currentColor" opacity=".22"/>
    </>
  ),
  favorito: (
    <>
      <path d="M12 3.4 14.5 8l5.1.75-3.68 3.58.86 5.07L12 15l-4.78 2.52.86-5.07L4.4 8.75 9.5 8 12 3.4Z" fill="currentColor"/>
    </>
  ),
  filtro: (
    <>
      <path d="M4 5.1c0-.5.4-.9.9-.9h14.2c.78 0 1.18.94.64 1.5l-5.46 5.63v5.56c0 .3-.16.57-.42.73l-2.8 1.64a.85.85 0 0 1-1.28-.73v-7.2L4.26 5.72A.9.9 0 0 1 4 5.1Z" fill="currentColor"/>
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.4" fill="currentColor"/>
      <rect x="11" y="10.1" width="2" height="6.1" rx="1" fill="currentColor" opacity=".22"/>
      <circle cx="12" cy="7.4" r="1.1" fill="currentColor" opacity=".22"/>
    </>
  ),
  microfono: (
    <>
      <rect x="8.3" y="3.4" width="7.4" height="11" rx="3.7" fill="currentColor"/>
      <path d="M6 11.1c0 3.31 2.69 6 6 6s6-2.69 6-6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"/>
      <rect x="11" y="16.7" width="2" height="3.1" rx="1" fill="currentColor"/>
      <rect x="8.2" y="19" width="7.6" height="1.8" rx="0.9" fill="currentColor"/>
    </>
  ),
  pantallaCompleta: (
    <>
      <path d="M4 9V4h5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 4h5v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 15v5h-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 20H4v-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  subir: (
    <>
      <rect x="4.2" y="17.1" width="15.6" height="2.2" rx="1.1" fill="currentColor"/>
      <rect x="10.9" y="8.2" width="2.2" height="6.8" rx="1.1" fill="currentColor"/>
      <path d="M8 10.6 12 6.6l4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  volume: (
    <>
      <path d="M5.1 10.2h3.15l4.55-3.65a.85.85 0 0 1 1.38.67v9.52a.85.85 0 0 1-1.38.67l-4.55-3.65H5.1a1.1 1.1 0 0 1-1.1-1.1v-1.36a1.1 1.1 0 0 1 1.1-1.1Z" fill="currentColor"/>
      <path d="M16.4 9.2a4.5 4.5 0 0 1 0 5.6M18.4 7.2a7 7 0 0 1 0 9.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
    </>
  ),
};

export const NOMES_ICONA = Object.keys(FORMAS);

export function hayIcona(nome) {
  return Object.prototype.hasOwnProperty.call(FORMAS, nome);
}

export function Icona({ nome, size = 24, cor, style, title }) {
  const formas = FORMAS[nome];
  // Un nome que non existe non pode romper unha pantalla enteira: non
  // se debuxa nada e queda o oco. É preferible a un erro de render.
  if (!formas) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      // `color` é o que alimenta `currentColor` das formas de dentro.
      style={{ color: cor, display: 'block', flexShrink: 0, ...style }}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {formas}
    </svg>
  );
}
