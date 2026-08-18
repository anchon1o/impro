import { useState, useEffect } from 'react';

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


const BASE = {

  // ── Marca · 4 propostas, para escoller ──
  logo1: (
    <><path d="M11 2.2 6.8 12h4.1l-1.6 9.8L17.4 10h-4.2l2-7.8Z" fill="currentColor"/> <rect x="2.4" y="11.2" width="3" height="1.2" rx="0.6" fill="currentColor"/> <rect x="18.6" y="11.2" width="3" height="1.2" rx="0.6" fill="currentColor"/> <rect x="4" y="5.2" width="2.8" height="1.2" rx="0.6" transform="rotate(35 5.4 5.8)" fill="currentColor"/> <rect x="17.2" y="17.6" width="2.8" height="1.2" rx="0.6" transform="rotate(35 18.6 18.2)" fill="currentColor"/> <rect x="17.2" y="5.2" width="2.8" height="1.2" rx="0.6" transform="rotate(-35 18.6 5.8)" fill="currentColor"/> <rect x="4" y="17.6" width="2.8" height="1.2" rx="0.6" transform="rotate(-35 5.4 18.2)" fill="currentColor"/> <circle cx="16.8" cy="3.6" r="1.55" fill="currentColor" fillOpacity="0.45"/></>
  ),
  logo2: (
    <><rect x="5" y="4" width="14" height="5.2" rx="0.8" fill="currentColor"/> <rect x="4" y="9" width="2.2" height="5" rx="0.7" fill="currentColor"/> <rect x="17.8" y="9" width="2.2" height="5" rx="0.7" fill="currentColor"/> <rect x="5.6" y="12.4" width="12.8" height="2.2" rx="0.6" fill="currentColor"/> <path d="m7 14.3 2 0 8 6.2h-2.9Zm10 0h-2l-8 6.2h2.9Z" fill="currentColor"/> <circle cx="15.7" cy="3.5" r="1.55" fill="currentColor" fillOpacity="0.45"/></>
  ),
  logo3: (
    <><circle cx="7" cy="7" r="2.4" fill="currentColor"/> <circle cx="17" cy="7" r="2.4" fill="currentColor"/> <path d="M3.6 18.8c0-4.7 1.35-7.3 3.4-7.3s3.4 2.6 3.4 7.3Z" fill="currentColor"/> <path d="M13.6 18.8c0-4.7 1.35-7.3 3.4-7.3s3.4 2.6 3.4 7.3Z" fill="currentColor"/> <circle cx="12" cy="12.6" r="1.75" fill="currentColor" fillOpacity="0.45"/></>
  ),
  logo4: (
    <><path fillRule="evenodd" d="M4 4.2h16v12.4h-8l-4.7 3.6 1.1-3.6H4Zm2 2v8.4h12V6.2Z" fill="currentColor"/> <path d="M11.1 7.2h1.8l2.7 6.2H8.4Z" fill="currentColor"/> <ellipse cx="12" cy="13.8" rx="3.8" ry="1.35" fill="currentColor"/> <circle cx="12" cy="7.1" r="1.35" fill="currentColor" fillOpacity="0.45"/></>
  ),


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


// ═══════════════════════════════════════════════════════════════════
// ESTILOS ALTERNATIVOS
// ═══════════════════════════════════════════════════════════════════
// ⚠️ NINGÚN ESTÁ COMPLETO. A app usa 18 iconos (11 áreas + 7 de
// cabeceira) e cada estilo alternativo trae de momento 2 deles.
// Por iso `Icona` cae ao estilo base cando falta un: un menú con dous
// iconos dun estilo e nove doutro sería peor que non ter selector.
//
// O selector de Axustes só deixa escoller os estilos COMPLETOS; os
// demais aparecen como «en preparación» coa súa cobertura. En canto
// chegue un set enteiro, faise seleccionable só, sen tocar código.

const ALTERNATIVOS = {
  // ── Estilo 2 · xeométrico minimal ──
  // Primeiro set alternativo COMPLETO: os 18 iconos que usa a app, cos
  // nomes exactos. Por iso é o primeiro que se pode activar de verdade.
  // O nodo de acento vai en `fillOpacity` 0.45 do mesmo `currentColor`:
  // dúas cores serían imposibles cun só color herdado do tema.
  estilo2: {
    admin: (
      <><path fillRule="evenodd" d="M6 10V7a6 6 0 0 1 12 0v3h1.5v11H4.5V10Zm2.1 0h7.8V7a3.9 3.9 0 0 0-7.8 0Zm2.45 5.4a1.45 1.45 0 1 0 2.9 0 1.45 1.45 0 0 0-2.9 0Z" fill="currentColor"/></>
    ),
    ajustes: (
      <><rect x="10.7" y="1.4" width="2.6" height="5.2" rx="0.7" fill="currentColor"/> <rect x="10.7" y="17.4" width="2.6" height="5.2" rx="0.7" fill="currentColor"/> <rect x="1.4" y="10.7" width="5.2" height="2.6" rx="0.7" fill="currentColor"/> <rect x="17.4" y="10.7" width="5.2" height="2.6" rx="0.7" fill="currentColor"/> <rect x="3.5" y="3.5" width="2.6" height="5.2" rx="0.7" transform="rotate(-45 4.8 6.1)" fill="currentColor"/> <rect x="17.9" y="15.3" width="2.6" height="5.2" rx="0.7" transform="rotate(-45 19.2 17.9)" fill="currentColor"/> <rect x="15.3" y="3.5" width="5.2" height="2.6" rx="0.7" transform="rotate(45 17.9 4.8)" fill="currentColor"/> <rect x="3.5" y="15.3" width="5.2" height="2.6" rx="0.7" transform="rotate(45 6.1 16.6)" fill="currentColor"/> <path fillRule="evenodd" d="M12 5.2a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6Zm0 3.2a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z" fill="currentColor"/> <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.45"/></>
    ),
    axenda: (
      <><path fillRule="evenodd" d="M3 4h18v17H3Zm1.6 4.2v11.2h14.8V8.2Z" fill="currentColor"/> <rect x="3" y="4" width="18" height="4.2" rx="1" fill="currentColor"/> <rect x="6.2" y="2" width="1.4" height="4.2" rx="0.7" fill="currentColor"/> <rect x="16.4" y="2" width="1.4" height="4.2" rx="0.7" fill="currentColor"/> <rect x="6" y="10.4" width="2.2" height="2.2" rx="0.4" fill="currentColor"/> <rect x="10.9" y="10.4" width="2.2" height="2.2" rx="0.4" fill="currentColor"/> <circle cx="17" cy="11.5" r="1.15" fill="currentColor" fillOpacity="0.45"/> <rect x="6" y="15.1" width="2.2" height="2.2" rx="0.4" fill="currentColor"/> <circle cx="12" cy="16.2" r="1.15" fill="currentColor" fillOpacity="0.45"/> <rect x="15.9" y="15.1" width="2.2" height="2.2" rx="0.4" fill="currentColor"/></>
    ),
    endirecto: (
      <><path fillRule="evenodd" d="M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 2.2a5.8 5.8 0 1 0 0 11.6 5.8 5.8 0 0 0 0-11.6Z" fill="currentColor"/> <path d="M10.2 8.8 16 12l-5.8 3.2Z" fill="currentColor"/> <circle cx="18.8" cy="5.2" r="1.35" fill="currentColor" fillOpacity="0.45"/></>
    ),
    generar: (
      <><circle cx="12" cy="12" r="3.15" fill="currentColor"/> <circle cx="18.3" cy="6.2" r="1.45" fill="currentColor" fillOpacity="0.45"/> <rect x="10.8" y="2" width="2.4" height="2.4" rx="0.45" fill="currentColor"/> <path d="M5.2 4.9 7 8H3.4Z" fill="currentColor"/> <path d="m18.5 12.8.75 1.5 1.65.24-1.2 1.15.29 1.63-1.49-.77-1.48.77.28-1.63-1.2-1.15 1.66-.24Z" fill="currentColor"/> <path d="m6 15.7 1.9 1.1v2.2L6 20.1 4.1 19v-2.2Z" fill="currentColor"/> <path d="m11.8 19.1 1.7 1.7-1.7 1.7-1.7-1.7Z" fill="currentColor"/> <rect x="6.7" y="2.9" width="2.25" height="0.8" rx="0.4" transform="rotate(-28 6.7 2.9)" fill="currentColor"/> <rect x="15.6" y="3.2" width="2.25" height="0.8" rx="0.4" transform="rotate(27 15.6 3.2)" fill="currentColor"/> <rect x="2.4" y="9.7" width="0.8" height="2.3" rx="0.4" fill="currentColor"/> <rect x="20.8" y="9.7" width="0.8" height="2.3" rx="0.4" fill="currentColor"/></>
    ),
    grupos: (
      <><circle cx="12" cy="6.1" r="2.35" fill="currentColor"/> <circle cx="5.4" cy="7.5" r="1.75" fill="currentColor"/> <circle cx="18.6" cy="7.5" r="1.75" fill="currentColor"/> <path d="M8.7 15.2c0-2.65 1.48-4.7 3.3-4.7s3.3 2.05 3.3 4.7v1.8H8.7Z" fill="currentColor"/> <path d="M2.4 15.5c0-2.1 1.35-3.7 3-3.7s3 1.6 3 3.7V17h-6Z" fill="currentColor"/> <path d="M15.6 15.5c0-2.1 1.35-3.7 3-3.7s3 1.6 3 3.7V17h-6Z" fill="currentColor"/> <circle cx="6.2" cy="20.1" r="0.8" fill="currentColor"/> <circle cx="12" cy="20.1" r="1" fill="currentColor" fillOpacity="0.45"/> <circle cx="17.8" cy="20.1" r="0.8" fill="currentColor"/> <rect x="7.2" y="20.85" width="9.6" height="0.8" rx="0.4" fill="currentColor"/></>
    ),
    guia: (
      <><rect x="3.2" y="3" width="0.8" height="18" rx="0.4" fill="currentColor"/> <circle cx="3.6" cy="5" r="1.2" fill="currentColor"/> <circle cx="3.6" cy="12" r="1.2" fill="currentColor" fillOpacity="0.45"/> <circle cx="3.6" cy="19" r="1.2" fill="currentColor"/> <rect x="7" y="3.3" width="4.1" height="4.1" rx="0.55" fill="currentColor"/> <rect x="12.6" y="3.55" width="8.2" height="0.9" rx="0.45" fill="currentColor"/> <rect x="12.6" y="5.35" width="6.2" height="0.9" rx="0.45" fill="currentColor"/> <rect x="7" y="9.95" width="4.1" height="4.1" rx="0.55" fill="currentColor"/> <rect x="12.6" y="10.2" width="8.2" height="0.9" rx="0.45" fill="currentColor"/> <rect x="12.6" y="12" width="5.1" height="0.9" rx="0.45" fill="currentColor"/> <rect x="7" y="16.6" width="4.1" height="4.1" rx="0.55" fill="currentColor"/> <rect x="12.6" y="16.85" width="8.2" height="0.9" rx="0.45" fill="currentColor"/> <rect x="12.6" y="18.65" width="6.8" height="0.9" rx="0.45" fill="currentColor"/></>
    ),
    idioma: (
      <><path fillRule="evenodd" d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z" fill="currentColor"/> <rect x="4.4" y="10.9" width="15.2" height="2.2" rx="1.1" fill="currentColor"/> <path d="M10.8 4.2h2.4c2.2 2.2 3.2 4.8 3.2 7.8s-1 5.6-3.2 7.8h-2.4c1.9-2.35 2.8-4.95 2.8-7.8s-.9-5.45-2.8-7.8Zm-2.5 0h1.9C8.7 6.65 8 9.25 8 12s.7 5.35 2.2 7.8H8.3C6.55 17.45 5.7 14.85 5.7 12s.85-5.45 2.6-7.8Z" fill="currentColor"/> <circle cx="18.7" cy="16.9" r="1.35" fill="currentColor" fillOpacity="0.45"/></>
    ),
    manual: (
      <><path fillRule="evenodd" d="M2.6 4.3c3.9-.7 7.1.05 9.4 2.25 2.3-2.2 5.5-2.95 9.4-2.25V20c-3.6-.55-6.75.12-9.4 2-2.65-1.88-5.8-2.55-9.4-2Zm1.5 1.35v12.7c3-.2 5.45.35 7.15 1.55V7.35c-1.8-1.5-4.2-2.05-7.15-1.7Zm8.65 1.7V19.9c1.7-1.2 4.15-1.75 7.15-1.55V5.65c-2.95-.35-5.35.2-7.15 1.7Z" fill="currentColor"/> <rect x="5.2" y="8.2" width="4.2" height="3.7" rx="0.45" fill="currentColor"/> <rect x="5.2" y="13" width="4.2" height="0.8" rx="0.4" fill="currentColor"/> <rect x="5.2" y="14.7" width="3.3" height="0.8" rx="0.4" fill="currentColor"/> <rect x="14.1" y="8.5" width="4.5" height="0.8" rx="0.4" fill="currentColor"/> <rect x="14.1" y="10.3" width="4.5" height="0.8" rx="0.4" fill="currentColor"/> <rect x="14.1" y="12.1" width="3.9" height="0.8" rx="0.4" fill="currentColor"/> <path d="M16.6 3.2h2.8v4.7L18 7l-1.4.9Z" fill="currentColor" fillOpacity="0.45"/></>
    ),
    proxeccion: (
      <><path fillRule="evenodd" d="M4 4h16v9H4Zm2 2v5h12V6Z" fill="currentColor"/> <circle cx="12" cy="8.5" r="1.35" fill="currentColor" fillOpacity="0.45"/> <circle cx="8" cy="17.2" r="1.7" fill="currentColor"/> <circle cx="12" cy="16.6" r="2" fill="currentColor"/> <circle cx="16" cy="17.2" r="1.7" fill="currentColor"/> <path d="M5.5 21c0-1.7 1.1-2.8 2.5-2.8s2.5 1.1 2.5 2.8Zm5.2 0c0-1.95 1.25-3.25 2.8-3.25s2.8 1.3 2.8 3.25Zm5.1 0c0-1.7 1.1-2.8 2.5-2.8s2.5 1.1 2.5 2.8Z" fill="currentColor"/></>
    ),
    qr: (
      <><path fillRule="evenodd" d="M2.5 2.5h7v7h-7Zm1.5 1.5v4h4V4Zm10.5-1.5h7v7h-7ZM16 4v4h4V4ZM2.5 14.5h7v7h-7ZM4 16v4h4v-4Z" fill="currentColor"/> <rect x="12" y="11.2" width="2" height="2" rx="0.25" fill="currentColor"/> <rect x="15.2" y="11.2" width="2" height="4.9" rx="0.25" fill="currentColor"/> <rect x="18.4" y="11.2" width="3.1" height="2" rx="0.25" fill="currentColor"/> <rect x="11.1" y="15.2" width="3" height="2" rx="0.25" fill="currentColor"/> <rect x="12.7" y="18.3" width="4.8" height="2" rx="0.25" fill="currentColor"/> <rect x="18.7" y="16.2" width="2.8" height="4.1" rx="0.25" fill="currentColor" fillOpacity="0.45"/></>
    ),
    reto: (
      <><circle cx="7.1" cy="7" r="2.25" fill="currentColor" fillOpacity="0.45"/> <path d="M2.8 19.8 9.2 9.2l4.3 4.8 2-2.4 5.7 8.2Z" fill="currentColor"/> <rect x="10.2" y="2.2" width="0.85" height="8.5" rx="0.42" fill="currentColor"/> <path d="M10.9 2.6h5.1l-1.45 1.65L16 6h-5.1Z" fill="currentColor"/> <path d="M12.8 18.6 18.9 11l2.4.35-.35 2.4-1.25-.2-4.95 6.15Z" fill="currentColor"/> <path d="m15.5 19.9 2.1-2.4 2.4 2.4Z" fill="currentColor"/></>
    ),
    salir: (
      <><path d="M4 4h9v4h-2V6H6v12h5v-2h2v4H4Z" fill="currentColor"/> <path d="M12 10h5.1l-1.9-1.9 1.4-1.4L21 11l-4.4 4.3-1.4-1.4 1.9-1.9H12Z" fill="currentColor"/></>
    ),
    sesiones: (
      <><path fillRule="evenodd" d="M5 2.4a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2Zm0 1.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z" fill="currentColor"/> <rect x="4.7" y="3.9" width="0.6" height="1.45" rx="0.3" fill="currentColor"/> <rect x="4.9" y="4.8" width="1.15" height="0.6" rx="0.3" fill="currentColor"/> <rect x="4.55" y="8.3" width="0.9" height="12.8" rx="0.45" fill="currentColor"/> <circle cx="5" cy="10.3" r="1.05" fill="currentColor"/> <circle cx="5" cy="15.2" r="1.05" fill="currentColor"/> <circle cx="5" cy="20.1" r="1.05" fill="currentColor"/> <rect x="8.2" y="8.9" width="11.5" height="2.8" rx="0.7" fill="currentColor"/> <rect x="8.2" y="13.8" width="8.4" height="2.8" rx="0.7" fill="currentColor"/> <rect x="8.2" y="18.7" width="6.2" height="2.8" rx="0.7" fill="currentColor" fillOpacity="0.45"/></>
    ),
    sonido: (
      <><rect x="5.2" y="3" width="1.2" height="18" rx="0.6" fill="currentColor"/> <rect x="11.4" y="3" width="1.2" height="18" rx="0.6" fill="currentColor"/> <rect x="17.6" y="3" width="1.2" height="18" rx="0.6" fill="currentColor"/> <rect x="3.8" y="7.2" width="4" height="2.7" rx="0.65" fill="currentColor"/> <rect x="10" y="13.1" width="4" height="2.7" rx="0.65" fill="currentColor"/> <rect x="16.2" y="8.6" width="4" height="2.7" rx="0.65" fill="currentColor"/> <circle cx="2.4" cy="6.2" r="0.65" fill="currentColor"/> <circle cx="2.4" cy="9.2" r="0.65" fill="currentColor"/> <circle cx="2.4" cy="12.2" r="0.65" fill="currentColor" fillOpacity="0.45"/> <circle cx="2.4" cy="15.2" r="0.65" fill="currentColor"/> <circle cx="21.6" cy="7.2" r="0.65" fill="currentColor"/> <circle cx="21.6" cy="10.2" r="0.65" fill="currentColor"/> <circle cx="21.6" cy="13.2" r="0.65" fill="currentColor" fillOpacity="0.45"/> <circle cx="21.6" cy="16.2" r="0.65" fill="currentColor"/></>
    ),
    tema: (
      <><path fillRule="evenodd" d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z" fill="currentColor"/> <path d="M12 5C8.13 5 5 8.13 5 12s3.13 7 7 7Z" fill="currentColor"/></>
    ),
    temporizador: (
      <><path fillRule="evenodd" d="M12 4a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm0 2.2a6.3 6.3 0 1 0 0 12.6 6.3 6.3 0 0 0 0-12.6Z" fill="currentColor"/> <rect x="10.3" y="1.5" width="3.4" height="2.6" rx="0.7" fill="currentColor"/> <rect x="18.2" y="4.7" width="3.1" height="1.7" rx="0.55" transform="rotate(45 19.75 5.55)" fill="currentColor"/> <path d="M11.4 12.6 15.9 8l1 1-4.5 4.6Z" fill="currentColor"/> <circle cx="12" cy="12.6" r="1.2" fill="currentColor" fillOpacity="0.45"/></>
    ),
    universo: (
      <><path fillRule="evenodd" d="M12 6.2a4 4 0 0 1 4 4c0 3.05-4 7.35-4 7.35S8 13.25 8 10.2a4 4 0 0 1 4-4Zm0 2.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z" fill="currentColor"/> <path fillRule="evenodd" d="M4.4 3.2a2.5 2.5 0 0 1 2.5 2.5c0 1.9-2.5 4.6-2.5 4.6S1.9 7.6 1.9 5.7a2.5 2.5 0 0 1 2.5-2.5Zm0 1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm15.2-.3A2.5 2.5 0 0 1 22.1 7c0 1.9-2.5 4.6-2.5 4.6S17.1 8.9 17.1 7a2.5 2.5 0 0 1 2.5-2.6Zm0 1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM4.8 15.4a2.4 2.4 0 0 1 2.4 2.4c0 1.8-2.4 4.4-2.4 4.4s-2.4-2.6-2.4-4.4a2.4 2.4 0 0 1 2.4-2.4Zm0 1.4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" fill="currentColor"/> <circle cx="6.9" cy="11.8" r="0.55" fill="currentColor"/> <circle cx="5.9" cy="13.4" r="0.55" fill="currentColor"/> <circle cx="17.7" cy="12.3" r="0.55" fill="currentColor"/> <circle cx="18.6" cy="14" r="0.55" fill="currentColor"/> <circle cx="8.3" cy="18.9" r="0.7" fill="currentColor" fillOpacity="0.45"/> <circle cx="20.4" cy="18" r="0.9" fill="currentColor" fillOpacity="0.45"/></>
    ),
  },
  geometrico: {
    aviso: (
      <><path d="M12 3.5L21 20H3L12 3.5zm-1 5v6h2v-6h-2zm0 8v2h2v-2h-2z" fill="currentColor" fillRule="evenodd"/></>
    ),
    confirmar: (
      <><path d="M4.5 12.5l4.2 4.2L19.8 6.8l-2-2.1-9.1 8.3-2.2-2.4z" fill="currentColor"/></>
    ),
    dialogo: (
      <><path d="M4 5h16v11H9l-4.5 3 .9-3H4V5z" fill="currentColor"/></>
    ),
    favorito: (
      <><path d="M12 3.2l2.6 5.2 5.8.8-4.2 4.1 1 5.7-5.2-2.7L6.8 19l1-5.7-4.2-4.1 5.8-.8L12 3.2z" fill="currentColor"/></>
    ),
    generar: (
      <><path d="M4 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7zm3 1h2v2H7V8zm6 6h2v2h-2v-2z" fill="currentColor" fillRule="evenodd"/><path d="M19 3l.7 1.6L21.5 5l-1.8.6L19 7.2l-.7-1.6L16.5 5l1.8-.4z" fill="currentColor"/></>
    ),
    logo: (
      <><path d="M7 5h10v8H7V5zm1 9h8v2H8v-2zM6 16h2v4H6v-4zm10 0h2v4h-2v-4z" fill="currentColor"/></>
    ),
    reloxo: (
      <><path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" fill="currentColor" fillRule="evenodd"/><path d="M11 7h2v5.3l3.5 2-1 1.8-4.5-2.6V7z" fill="currentColor"/></>
    ),
    sonido: (
      <><rect x="4" y="5" width="3" height="14" rx="1" fill="currentColor"/><rect x="10.5" y="5" width="3" height="14" rx="1" fill="currentColor"/><rect x="17" y="5" width="3" height="14" rx="1" fill="currentColor"/><rect x="3" y="8" width="5" height="3" rx="1" fill="currentColor"/><rect x="9.5" y="13" width="5" height="3" rx="1" fill="currentColor"/><rect x="16" y="7" width="5" height="3" rx="1" fill="currentColor"/></>
    ),
  },
  linea: {
    aviso: (
      <><path d="M12 4L21 20H3L12 4zM12 9v5M12 17.3v.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>
    ),
    confirmar: (
      <><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>
    ),
    dialogo: (
      <><path d="M4 5.5h16v10.5H9.2L5 19l.8-3H4V5.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>
    ),
    favorito: (
      <><path d="M12 3.5l2.5 5.1 5.6.8-4 3.9.9 5.5-5-2.6-5 2.6.9-5.5-4-3.9 5.6-.8L12 3.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>
    ),
    generar: (
      <><rect x="4.2" y="5.2" width="13.6" height="13.6" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8.2" cy="9.2" r=".9" fill="currentColor"/><circle cx="13.8" cy="14.8" r=".9" fill="currentColor"/><path d="M19 3.5v3M17.5 5h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>
    ),
    logo: (
      <><path d="M7 5.5h10v8H7v-8zM8 13.5v2.5h8v-2.5M7 16v4M17 16v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>
    ),
    reloxo: (
      <><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7.5v4.8l3.7 2.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>
    ),
    sonido: (
      <><path d="M6 5v14M12 5v14M18 5v14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><rect x="4" y="8" width="4" height="3" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8"/><rect x="10" y="13" width="4" height="3" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8"/><rect x="16" y="7" width="4" height="3" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8"/></>
    ),
  },
  cubista: {
    aviso: (
      <><path d="M12 3l9 17-11-4z" fill="currentColor"/><path d="M12 3L3 20l7-4z" fill="currentColor" fillOpacity=".6"/><path d="M10 16l11 4H3z" fill="currentColor" fillOpacity=".3"/><path d="M11 8h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/></>
    ),
    confirmar: (
      <><path d="M4 12l5 5 4-4-3-3-2 2-2-2z" fill="currentColor" fillOpacity=".6"/><path d="M9 17L20 7l-3-3-9 9z" fill="currentColor"/></>
    ),
    dialogo: (
      <><path d="M4 6l8-3v11l-8 2z" fill="currentColor"/><path d="M12 3l8 4-3 8-5-1z" fill="currentColor" fillOpacity=".6"/><path d="M4 16l8-2 5 1-8 1-4 4z" fill="currentColor" fillOpacity=".3"/></>
    ),
    favorito: (
      <><path d="M12 3l2 6 6 .5-5 4 2 6-5-3z" fill="currentColor"/><path d="M12 3L9 9l-6 .5 5 4-1 6 5-3z" fill="currentColor" fillOpacity=".6"/><path d="M8 13.5l4 3 5 3-1-6z" fill="currentColor" fillOpacity=".3"/></>
    ),
    generar: (
      <><path d="M4 7l7-3 7 3-4 5H6z" fill="currentColor"/><path d="M4 7l2 12 6-5-1-10z" fill="currentColor" fillOpacity=".6"/><path d="M18 7l1 10-7-3 2-2z" fill="currentColor" fillOpacity=".3"/><circle cx="8" cy="10" r="1" fill="currentColor"/><circle cx="14.5" cy="15.5" r="1" fill="currentColor"/></>
    ),
    logo: (
      <><path d="M6 6l6-3v10H6z" fill="currentColor"/><path d="M12 3l6 3-2 8-4-1z" fill="currentColor" fillOpacity=".6"/><path d="M8 14h8l-1 3H9zM6 17h3v4H6zm9 0h3v4h-3z" fill="currentColor" fillOpacity=".3"/></>
    ),
    reloxo: (
      <><path d="M12 3l7 4-5 5-2-9z" fill="currentColor"/><path d="M19 7l2 8-7-3z" fill="currentColor" fillOpacity=".6"/><path d="M21 15l-7 6v-9zM14 21L4 17l10-5zM4 17L3 8l11 4zM3 8l9-5 2 9z" fill="currentColor" fillOpacity=".3"/><path d="M11 7h2v5l4 2-1 2-5-3z" fill="currentColor"/></>
    ),
    sonido: (
      <><path d="M4 6l5-2v16l-5-2z" fill="currentColor"/><path d="M9 4l6 3v11l-6 2z" fill="currentColor" fillOpacity=".6"/><path d="M15 7l5-2v14l-5-1z" fill="currentColor" fillOpacity=".3"/><path d="M3 9l7-1v3l-7 1zM9 13l7 1v3l-7-1zM14 8l7-2v3l-7 2z" fill="currentColor"/></>
    ),
  },
  viscoso: {
    aviso: (
      <><path d="M10 5c1-2 3-2 4 0l7 12c1 2 0 3-2 3H5c-2 0-3-1-2-3l7-12zm1 4v6c0 2 2 2 2 0V9c0-2-2-2-2 0zm1 8c-1 0-1 2 0 2s1-2 0-2z" fill="currentColor" fillRule="evenodd"/></>
    ),
    confirmar: (
      <><path d="M5 12c1-1 2-1 3 0l2 2 6-7c1-1 3-1 3 1 0 1-1 2-2 3l-5 6c-1 2-3 2-4 1l-3-3c-1-1-1-2 0-3z" fill="currentColor"/></>
    ),
    dialogo: (
      <><path d="M5 5c-2 1-2 3-2 5v3c0 3 2 5 5 5h2l-3 3c4 0 6-1 8-3h2c3 0 4-2 4-5v-3c0-3-2-5-5-5H8c-1 0-2 0-3 0z" fill="currentColor"/></>
    ),
    favorito: (
      <><path d="M10 5c1-3 3-3 4 0l1 3c0 1 1 1 2 1h2c3 0 3 2 1 4l-2 2c-1 1-1 1-1 2l1 2c1 3-1 4-3 2l-2-1c-1-1-2-1-3 0l-2 1c-2 2-4 1-3-2l1-2c0-1 0-1-1-2l-2-2c-2-2-1-4 1-4h3c1 0 1 0 2-1l1-3z" fill="currentColor"/></>
    ),
    generar: (
      <><path d="M5 7c0-2 2-3 4-2 2-2 6-1 7 1 2 1 3 3 2 5 1 3-1 7-4 7-2 2-6 1-7-1-3 0-4-3-2-5-1-2-1-4 0-5zm2.3 1.1c-.8.8-.3 2.3.9 2.4 1.2.1 2-1.3 1.3-2.2-.5-.7-1.5-.8-2.2-.2zm6.1 5.2c-.8.8-.3 2.3.9 2.4 1.2.1 2-1.3 1.3-2.2-.5-.7-1.5-.8-2.2-.2z" fill="currentColor" fillRule="evenodd"/><path d="M19 4c.4 1 .8 1.4 1.8 1.8-1 .4-1.4.8-1.8 1.8-.4-1-.8-1.4-1.8-1.8 1-.4 1.4-.8 1.8-1.8z" fill="currentColor"/></>
    ),
    logo: (
      <><path d="M8 5c-2 0-3 2-3 4v3c0 2 1 3 3 3h8c2 0 3-1 3-3V8c0-2-1-3-3-3H8zm0 11c-1 0-2 1-2 2v2h3v-3h6v3h3v-2c0-1-1-2-2-2H8z" fill="currentColor" fillRule="evenodd"/></>
    ),
    reloxo: (
      <><path d="M12 3c5 0 9 4 9 9 0 6-4 9-9 9-6 0-9-4-9-9 0-5 4-9 9-9zm-1 4c0-1 2-1 2 0v5l3 2c2 1 1 3-1 2l-4-2c-1 0-1-1-1-2l1-5z" fill="currentColor" fillRule="evenodd"/></>
    ),
    sonido: (
      <><path d="M5 5c1-1 2 0 2 1v3c1 1 1 3 0 4v5c0 2-3 2-3 0v-5c-1-1-1-3 0-4V6c0-1 0-1 1-1zm7 0c1-1 2 0 2 1v7c1 1 1 3 0 4v1c0 2-3 2-3 0v-1c-1-1-1-3 0-4V6c0-1 0-1 1-1zm6 0c1-1 2 0 2 1v2c1 1 1 3 0 4v6c0 2-3 2-3 0v-6c-1-1-1-3 0-4V6c0-1 0-1 1-1z" fill="currentColor"/></>
    ),
  },
  papel: {
    aviso: (
      <><path d="M11.5 3.3l9.8 16.2-18.5.7 8.7-16.9zm-.5 5.5l.2 6 2-.1-.1-6-2.1.1zm.2 8.2l.1 2 2-.1-.1-1.9-2 .0z" fill="currentColor" fillRule="evenodd"/></>
    ),
    confirmar: (
      <><path d="M4.6 11.7l4.2 4.6 10-10.8 2 2.1L9 19 3.2 13.4l1.4-1.7z" fill="currentColor"/></>
    ),
    dialogo: (
      <><path d="M3.8 5.2l16.3-.4.2 11-10.9.5-4.5 3.2.8-3.1-1.6-.1-.3-11.1z" fill="currentColor"/></>
    ),
    favorito: (
      <><path d="M11.7 3.1l2.7 5.4 5.9.3-4.1 4.4 1.5 5.6-5.5-2.2-5 3.1.4-5.9-4.4-3.7 5.7-1.4 2.8-5.6z" fill="currentColor"/></>
    ),
    generar: (
      <><path d="M4.5 6.2L16.8 4.8l2 12.5L6 19.2 4.5 6.2zm2.8 1.9l2-.2.2 2-2 .2-.2-2zm5.8 5.6l2-.2.2 2-2 .2-.2-2z" fill="currentColor" fillRule="evenodd"/><path d="M18.5 3l.8 1.4 1.7.5-1.5.8-.2 1.7-.9-1.4-1.6-.2 1.2-1z" fill="currentColor"/></>
    ),
    logo: (
      <><path d="M6.5 5.2l10.7-.4.3 8.5-10.6.3-.4-8.4zm1.2 9.3l8.6-.1.2 2.2-8.6.1-.2-2.2zm-1 2.8l2.3-.2.1 3.7-2.2.1-.2-3.6zm8.3-.1l2.4.1-.2 3.6-2.3-.1.1-3.6z" fill="currentColor"/></>
    ),
    reloxo: (
      <><path d="M12.4 3.1c5.1.1 8.8 4 8.6 9-.2 5-4 8.8-9 8.7-5-.1-8.9-4-8.8-9 .2-5 4.2-8.8 9.2-8.7zm-1.5 4.3l2.3-.2-.1 5 3.7 2.3-1.3 1.9-4.7-2.9.1-6.1z" fill="currentColor" fillRule="evenodd"/></>
    ),
    sonido: (
      <><path d="M4.3 4.8l2.6.3-.2 14-2.7.1.3-14.4zm6.5.2l2.6-.2.2 14-2.8.2V5zm6.5-.1l2.8.2-.3 13.8-2.6.2.1-14.2zM3.3 8.4l4.7-.3.2 3.1-5 .2.1-3zm6.4 4.8l5-.2.1 3.2-5.2-.1.1-2.9zm6.4-6.2l5 .2-.1 3.1-5.1.1.2-3.4z" fill="currentColor"/></>
    ),
  },
  pixel: {
    aviso: (
      <><rect x="11" y="3" width="2" height="2" fill="currentColor"/><rect x="10" y="5" width="2" height="2" fill="currentColor"/><rect x="12" y="5" width="2" height="2" fill="currentColor"/><rect x="9" y="7" width="2" height="2" fill="currentColor"/><rect x="13" y="7" width="2" height="2" fill="currentColor"/><rect x="8" y="9" width="2" height="2" fill="currentColor"/><rect x="14" y="9" width="2" height="2" fill="currentColor"/><rect x="7" y="11" width="2" height="2" fill="currentColor"/><rect x="15" y="11" width="2" height="2" fill="currentColor"/><rect x="6" y="13" width="2" height="2" fill="currentColor"/><rect x="16" y="13" width="2" height="2" fill="currentColor"/><rect x="5" y="15" width="2" height="2" fill="currentColor"/><rect x="17" y="15" width="2" height="2" fill="currentColor"/><rect x="4" y="17" width="16" height="3" fill="currentColor"/><rect x="11" y="8" width="2" height="6" fill="currentColor"/><rect x="11" y="15" width="2" height="2" fill="currentColor"/></>
    ),
    confirmar: (
      <><rect x="4" y="11" width="3" height="3" fill="currentColor"/><rect x="6" y="13" width="3" height="3" fill="currentColor"/><rect x="8" y="15" width="3" height="3" fill="currentColor"/><rect x="10" y="13" width="3" height="3" fill="currentColor"/><rect x="12" y="11" width="3" height="3" fill="currentColor"/><rect x="14" y="9" width="3" height="3" fill="currentColor"/><rect x="16" y="7" width="3" height="3" fill="currentColor"/></>
    ),
    dialogo: (
      <><rect x="4" y="5" width="16" height="11" fill="currentColor"/><rect x="6" y="16" width="5" height="2" fill="currentColor"/><rect x="6" y="18" width="2" height="2" fill="currentColor"/></>
    ),
    favorito: (
      <><rect x="10" y="3" width="4" height="3" fill="currentColor"/><rect x="9" y="6" width="6" height="3" fill="currentColor"/><rect x="4" y="9" width="16" height="3" fill="currentColor"/><rect x="6" y="12" width="12" height="3" fill="currentColor"/><rect x="7" y="15" width="4" height="4" fill="currentColor"/><rect x="13" y="15" width="4" height="4" fill="currentColor"/></>
    ),
    generar: (
      <><rect x="4" y="5" width="14" height="2" fill="currentColor"/><rect x="4" y="17" width="14" height="2" fill="currentColor"/><rect x="4" y="7" width="2" height="10" fill="currentColor"/><rect x="16" y="7" width="2" height="10" fill="currentColor"/><rect x="7" y="9" width="2" height="2" fill="currentColor"/><rect x="13" y="14" width="2" height="2" fill="currentColor"/><rect x="19" y="3" width="1" height="4" fill="currentColor"/><rect x="17" y="5" width="5" height="1" fill="currentColor"/></>
    ),
    logo: (
      <><rect x="7" y="5" width="10" height="8" fill="currentColor"/><rect x="8" y="14" width="8" height="2" fill="currentColor"/><rect x="6" y="16" width="3" height="4" fill="currentColor"/><rect x="15" y="16" width="3" height="4" fill="currentColor"/></>
    ),
    reloxo: (
      <><rect x="8" y="3" width="8" height="2" fill="currentColor"/><rect x="5" y="5" width="14" height="2" fill="currentColor"/><rect x="3" y="8" width="2" height="8" fill="currentColor"/><rect x="19" y="8" width="2" height="8" fill="currentColor"/><rect x="5" y="17" width="14" height="2" fill="currentColor"/><rect x="8" y="19" width="8" height="2" fill="currentColor"/><rect x="11" y="7" width="2" height="6" fill="currentColor"/><rect x="13" y="12" width="4" height="2" fill="currentColor"/></>
    ),
    sonido: (
      <><rect x="5" y="4" width="2" height="16" fill="currentColor"/><rect x="11" y="4" width="2" height="16" fill="currentColor"/><rect x="17" y="4" width="2" height="16" fill="currentColor"/><rect x="3" y="8" width="6" height="4" fill="currentColor"/><rect x="9" y="13" width="6" height="4" fill="currentColor"/><rect x="15" y="7" width="6" height="4" fill="currentColor"/></>
    ),
  },
  senaletica: {
    aviso: (
      <><path d="M12 3l10 18H2L12 3zm-1 6v6h2V9h-2zm0 8v2h2v-2h-2z" fill="currentColor" fillRule="evenodd"/></>
    ),
    confirmar: (
      <><path d="M4 12l3-3 4 4 7-7 3 3-10 10z" fill="currentColor"/></>
    ),
    dialogo: (
      <><path d="M4 5h16v11H9l-4 4v-4H4z" fill="currentColor"/></>
    ),
    favorito: (
      <><path d="M12 3l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 10l6-1z" fill="currentColor"/></>
    ),
    generar: (
      <><path d="M5 6h12v12H5V6zm2 2h2v2H7V8zm6 6h2v2h-2v-2z" fill="currentColor" fillRule="evenodd"/><path d="M19 3h2v2h-2zM18 4h4v2h-4z" fill="currentColor"/></>
    ),
    logo: (
      <><path d="M7 5h10v9H7zM8 15h8v2H8zM6 17h3v4H6zm9 0h3v4h-3z" fill="currentColor"/></>
    ),
    reloxo: (
      <><path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" fill="currentColor" fillRule="evenodd"/><path d="M11 6h2v6h4v2h-6V6z" fill="currentColor"/></>
    ),
    sonido: (
      <><path d="M5 4h2v16H5zM11 4h2v16h-2zM17 4h2v16h-2zM3 8h6v4H3zM9 13h6v4H9zM15 6h6v4h-6z" fill="currentColor"/></>
    ),
  },
  constructivista: {
    aviso: (
      <><path d="M4 19L13 3l4 3-8 14z" fill="currentColor"/><path d="M9 20l8-14 4 14z" fill="currentColor" fillOpacity=".6"/><rect x="12" y="10" width="2" height="6" transform="rotate(18 13 13)" fill="currentColor" fillOpacity=".3"/></>
    ),
    confirmar: (
      <><path d="M4 13l4-4 4 4-3 3z" fill="currentColor" fillOpacity=".6"/><path d="M8 16L18 5l3 3-10 11z" fill="currentColor"/></>
    ),
    dialogo: (
      <><path d="M4 7l14-3 3 8-12 5-4 4 1-5z" fill="currentColor"/><path d="M8 8l10-2 1 3-10 3z" fill="currentColor" fillOpacity=".3"/></>
    ),
    favorito: (
      <><path d="M5 10l6-1 2-6 3 6 6 1-5 4 2 6-6-3-6 3 2-6z" fill="currentColor"/><path d="M3 17l18-10-2 5L5 20z" fill="currentColor" fillOpacity=".3"/></>
    ),
    generar: (
      <><path d="M4 8l10-4 5 5-10 4z" fill="currentColor"/><path d="M9 13l10-4-2 9-9 2z" fill="currentColor" fillOpacity=".6"/><circle cx="9" cy="9" r="1" fill="currentColor" fillOpacity=".3"/><circle cx="14" cy="15" r="1.2" fill="currentColor"/><path d="M18 3l4 1-3 2z" fill="currentColor"/></>
    ),
    logo: (
      <><path d="M5 8l12-4 3 7-12 4z" fill="currentColor"/><path d="M8 15l10-3-2 5-8 2z" fill="currentColor" fillOpacity=".6"/><path d="M7 17l3-1-1 5-3 1zM15 15l3-1 1 5-3 1z" fill="currentColor" fillOpacity=".3"/></>
    ),
    reloxo: (
      <><path d="M4 8l11-5 6 8-6 10-10-3z" fill="currentColor" fillOpacity=".6"/><path d="M12 6l2 1-1 5 5 1-1 2-7-2z" fill="currentColor"/><path d="M3 19l18-14-1 4L6 21z" fill="currentColor" fillOpacity=".3"/></>
    ),
    sonido: (
      <><path d="M4 18L8 4h2L6 19zM10 19l4-14h2l-4 15zM16 20l4-13h2l-4 14z" fill="currentColor"/><path d="M3 10l7-2-1 4-7 2zM9 14l7-2-1 4-7 2zM15 9l7-2-1 4-7 2z" fill="currentColor" fillOpacity=".6"/></>
    ),
  },
  tinta: {
    aviso: (
      <><path d="M10.4 4.5c.8-1.5 2.3-1.6 3.2-.1L21 17.2c1 1.7.2 2.9-1.7 2.9H4.7c-1.9 0-2.7-1.2-1.7-2.9l7.4-12.7zm.6 4.2l.2 6.4h2l.2-6.4H11zm.1 8.1v2h2v-2h-2z" fill="currentColor" fillRule="evenodd"/></>
    ),
    confirmar: (
      <><path d="M4.4 11.4c.7-.7 1.5-.6 2.2.1l3 3.2L17.5 6c.7-.8 1.6-.9 2.4-.2.8.7.7 1.7 0 2.5L11 18.2c-.8.9-1.8.9-2.7.1l-4-4.3c-.8-.8-.7-1.8.1-2.6z" fill="currentColor"/></>
    ),
    dialogo: (
      <><path d="M5.1 5c4.1-.8 9-.7 13 .1 2 .4 3.1 1.9 2.8 4l-.6 4.3c-.3 2-1.7 3.1-3.7 3.2l-6.3.2-4.8 3.4 1.4-3.5c-2.4-.4-3.6-1.8-3.6-4.1V9c0-2.2.8-3.6 1.8-4z" fill="currentColor"/></>
    ),
    favorito: (
      <><path d="M10.4 4.3c.6-1.4 2.5-1.5 3.2-.1l1.8 4 4.4.7c1.5.2 2.1 1.9 1 3l-3.2 3.1.8 4.4c.3 1.5-1.2 2.5-2.5 1.8L12 19.1l-3.9 2.1c-1.4.8-2.9-.3-2.5-1.8l.8-4.4-3.2-3.1c-1.1-1.1-.5-2.8 1-3l4.4-.7 1.8-3.9z" fill="currentColor"/></>
    ),
    generar: (
      <><path d="M5 7c1-2 3-2 5-2l7 1c2 0 3 2 2 4l-2 7c-.4 1.6-1.8 2.4-3.5 2.2l-7-1c-1.8-.3-2.7-1.6-2.4-3.3L5 7zm2 2c0 .8.6 1.5 1.4 1.5S10 9.8 10 9s-.7-1.5-1.5-1.5S7 8.2 7 9zm6 5.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5-.7-1.5-1.5-1.5-1.5.7-1.5 1.5z" fill="currentColor" fillRule="evenodd"/><path d="M18 3.3c.7 1.2 1.4 1.8 2.6 2.2-1.3.3-2 .9-2.7 2 .1-1.4-.3-2.2-1.4-3.1 1.4.2 2.1-.1 3.1-1.1z" fill="currentColor"/></>
    ),
    logo: (
      <><path d="M7.2 5.1c3.1-.5 6.6-.5 9.7 0 1.3.2 2.1 1.2 2 2.6l-.4 4.1c-.1 1.4-1 2.2-2.4 2.3l-8.1.1c-1.4 0-2.3-.8-2.4-2.2l-.3-4.1c-.1-1.4.6-2.4 1.9-2.8zm.6 10.3h8.5c1 0 1.6.6 1.7 1.5l.2 3H15l-.2-2.6H9.1l-.2 2.6H5.8l.3-3c.1-.9.7-1.5 1.7-1.5z" fill="currentColor"/></>
    ),
    reloxo: (
      <><path d="M12.4 3.2c5.2.1 8.7 3.9 8.5 9-.1 5-3.8 8.7-8.9 8.7-5.2-.1-8.9-3.8-8.8-8.9.1-5.1 4-8.9 9.2-8.8zm-1.4 4c0-.9.7-1.5 1.6-1.5.9 0 1.5.7 1.4 1.6l-.3 4.6 3.1 1.8c.8.5 1 1.4.5 2.2-.5.8-1.4 1-2.2.5l-4-2.4c-.6-.3-.9-.9-.8-1.6l.7-5.2z" fill="currentColor" fillRule="evenodd"/></>
    ),
    sonido: (
      <><path d="M5 4.5c1.1-.2 1.8.5 1.7 1.6L6 19.5H4.4L5 4.5zm6.2.1c1.1-.2 1.8.5 1.7 1.6l-.6 13.3h-1.7l.6-14.9zm6.2-.1c1.1-.2 1.8.5 1.7 1.6l-.6 13.4h-1.7l.6-15zM3.2 8.2l5.4-.5.2 3.1-5.5.6-.1-3.2zm6 5l5.6-.3.2 3.1-5.7.4-.1-3.2zm6.3-6.1l5.3-.5.2 3.1-5.4.6-.1-3.2z" fill="currentColor"/></>
    ),
  },
  escenico: {
    aviso: (
      <><path d="M12 3l10 18H2L12 3zm-1 6v6h2V9h-2zm0 8v2h2v-2h-2z" fill="currentColor" fillRule="evenodd"/></>
    ),
    confirmar: (
      <><path d="M3 11h6l2 2 5-7h5L11 20z" fill="currentColor"/></>
    ),
    dialogo: (
      <><path d="M3 5h18v12H10l-5 4 1-4H3V5zm4 4v2h10V9H7z" fill="currentColor" fillRule="evenodd"/></>
    ),
    favorito: (
      <><path d="M12 3l3 6 6 1-4.5 4 1.3 6L12 17l-5.8 3 1.3-6L3 10l6-1z" fill="currentColor"/></>
    ),
    generar: (
      <><path d="M4 6h14v13H4V6zm2 2h4v4H6V8zm6 5h4v4h-4v-4z" fill="currentColor" fillRule="evenodd"/><path d="M18 3h2v2h2v2h-2v2h-2V7h-2V5h2z" fill="currentColor"/></>
    ),
    logo: (
      <><path d="M6 5h12v10H6V5zm2 2v6h8V7H8z" fill="currentColor" fillRule="evenodd"/><path d="M5 16h14v2H5zM6 18h4v3H6zm8 0h4v3h-4z" fill="currentColor"/></>
    ),
    reloxo: (
      <><path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" fill="currentColor" fillRule="evenodd"/><path d="M11 7h2v6h4v2h-6V7z" fill="currentColor"/></>
    ),
    sonido: (
      <><path d="M4 4h4v16H4V4zm1 5v2h2V9H5zM10 4h4v16h-4V4zm1 10v2h2v-2h-2zM16 4h4v16h-4V4zm1 3v2h2V7h-2z" fill="currentColor" fillRule="evenodd"/></>
    ),
  },
};

// Os 18 que a app usa de verdade. É a vara de medir da cobertura.
export const ICONOS_NECESARIOS = [
  'generar', 'reto', 'sonido', 'guia', 'sesiones', 'grupos', 'qr',
  'universo', 'axenda', 'manual', 'ajustes',
  'admin', 'endirecto', 'proxeccion', 'temporizador', 'idioma', 'tema', 'salir',
];

const NOMES_ESTILO = {"geometrico": "Xeométrico", "linea": "Liña", "cubista": "Cubista", "viscoso": "Viscoso", "papel": "Papel", "pixel": "Píxel", "senaletica": "Sinalética", "constructivista": "Construtivista", "tinta": "Tinta", "escenico": "Escénico"};

// ═══════════════════════════════════════════════════════════════════
// ESTILO «EMOJIS»
// ═══════════════════════════════════════════════════════════════════
// Non son SVG: son caracteres. Trátanse como un estilo máis para poder
// comparalos cos outros na propia app, que é onde se decide.
//
// ⚠️ O que perden: NON collen a cor do tema (píntaos o sistema
// operativo), cambian de aspecto entre iOS, Android e Windows, e non
// se poden escalar con precisión.
// ⚠️ O que gañan, e non é pouco: traen a súa propia cor e recoñécense
// sen ler. Un 🎲 di «dado» máis rápido que calquera silueta.
//
// Por iso é unha opción, non un erro do pasado.
const EMOJIS = {
  generar: '🎲',
  reto: '⚡',
  sonido: '🔊',
  guia: '📖',
  sesiones: '📋',
  grupos: '👥',
  qr: '📱',
  universo: '🌍',
  axenda: '📅',
  manual: '📘',
  ajustes: '⚙️',
  admin: '🔐',
  endirecto: '🎬',
  proxeccion: '📺',
  temporizador: '⏱',
  idioma: '🌐',
  tema: '🌙',
  salir: '⏻',
  favorito: '★',
  confirmar: '✓',
  aviso: '⚠️',
  reloxo: '🕐',
  dialogo: '💬',
  buscar: '🔍',
  editar: '✏️',
  eliminar: '🗑',
  engadir: '＋',
  duplicar: '⧉',
  compartir: '↗',
  descargar: '⬇',
  subir: '⬆',
  filtro: '⚙',
  info: 'ℹ️',
  axuda: '❓',
  aleatorio: '🎲',
  microfono: '🎤',
  volume: '🔊',
  pantallaCompleta: '⛶',
};

export function emojiDe(nome) { return EMOJIS[nome] || null; }
export function esEstiloEmoji(id) { return (id || ESTILO) === 'emojis'; }

const SETS = { base: BASE, estilo2: ALTERNATIVOS.estilo2, emojis: EMOJIS, ...ALTERNATIVOS };

export function cobertura(estilo) {
  const set = SETS[estilo] || {};
  const teñen = ICONOS_NECESARIOS.filter((k) => set[k]);
  return { ten: teñen.length, de: ICONOS_NECESARIOS.length, completo: teñen.length === ICONOS_NECESARIOS.length };
}

export const ESTILOS = Object.keys(SETS).map((id) => ({
  id,
  nome: id === 'base' ? 'Orixinal' : id === 'estilo2' ? 'Xeométrico minimal'
    : id === 'emojis' ? 'Emojis (o de sempre)' : (NOMES_ESTILO[id] || id),
  ...cobertura(id),
}));

// Estilo activo. Vive fóra de React para que `Icona` non precise
// contexto: son centos de iconos e pasar un provider por todos custa
// máis do que aforra.
// Por defecto, os emojis: é o que estaba antes e o que mellor se
// recoñece sen ler. Os outros dous están a un toque en Axustes.
let ESTILO = 'emojis';
const oíntes = new Set();

export function estiloActual() { return ESTILO; }

export function setEstilo(id) {
  if (!SETS[id]) return false;
  ESTILO = id;
  try { localStorage.setItem('impro_estilo_iconos', id); } catch (e) { /* modo privado */ }
  oíntes.forEach((f) => f(id));
  return true;
}

export function subscribirEstilo(f) { oíntes.add(f); return () => oíntes.delete(f); }

// ⚠️ `Icona` le o estilo activo no momento de renderizar, pero React
// non sabe que cambiou. Este hook úsase UNHA vez na raíz (ImproApp):
// ao cambiar o estilo forza un render da árbore enteira e todos os
// iconos collen o novo. Poñelo en cada `Icona` serían centos de
// subscricións para o mesmo dato.
export function useEstiloIconos() {
  const [id, setId] = useState(ESTILO);
  useEffect(() => subscribirEstilo(setId), []);
  return id;
}

try {
  const g = localStorage.getItem('impro_estilo_iconos');
  // Só se restaura se o estilo existe E está completo: se non, o menú
  // quedaría a medias sen que ninguén saiba por que.
  if (g && SETS[g] && cobertura(g).completo) ESTILO = g;
} catch (e) { /* modo privado */ }



export const NOMES_ICONA = Object.keys(BASE);

export function hayIcona(nome) {
  return Object.prototype.hasOwnProperty.call(BASE, nome);
}

export function Icona({ nome, size = 24, cor, style, title, estilo }) {
  const activo = estilo || ESTILO;

  // Os emojis son texto, non SVG: van nun <span> co tamaño equivalente.
  // NON se lles aplica `cor`: teñen a súa propia e forzala non funciona.
  if (activo === 'emojis' && EMOJIS[nome]) {
    return (
      <span
        role={title ? 'img' : 'presentation'}
        aria-hidden={title ? undefined : true}
        aria-label={title}
        style={{
          fontSize: size * 0.86, lineHeight: 1, display: 'block',
          width: size, height: size, textAlign: 'center', flexShrink: 0,
          ...style,
        }}
      >{EMOJIS[nome]}</span>
    );
  }

  const set = SETS[activo] || BASE;
  // Fallback ao base: un estilo incompleto non pode deixar ocos.
  const formas = set[nome] || BASE[nome];
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
