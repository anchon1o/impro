import { useState } from 'react';
import { useTheme, useAuth, useViewport, mkS, TAB_LABELS } from './core.jsx';

// IM-M02 — Pantalla de inicio tipo botonera.
//
// Antes a app abría directamente en «Generar» e as 11 áreas só eran
// accesibles desde a tira de pestanas, que en móbil hai que desprazar
// horizontalmente para descubrir o que hai ao final (Manual, Universo).
// Esta pantalla dálle a cada área o mesmo peso visual e o mesmo tamaño de
// pulsación.
//
// Dentro dunha sección mantense o menú horizontal de sempre.

// As descricións tamén se traducen: antes estaban fixas en galego mentres
// as etiquetas viñan de UI_STRINGS, así que ao poñer a app en castelán a
// botonera mostraba "Generar" cunha descrición en galego.
export const DESCS={
  es:{generar:"Estímulos por categoría, escenas combinadas y plantillas propias.",
      reto:"Una dinámica al azar con estímulos y sus instrucciones.",
      show:"Cabina de sonido: audio multipista, efectos, metrónomo y escaleta.",
      guia:"Catálogo de dinámicas con pasos, objetivos y variantes.",
      sesiones:"Planifica y guarda tus sesiones de trabajo.",
      grupos:"Gestiona tus grupos y haz seguimiento.",
      qr:"Abre una sala y recoge propuestas del público en directo.",
      universo:"Compañías, escuelas, festivales y formatos verificados.",
      axenda:"Cursos, talleres y shows. Sugiere los tuyos.",
      manual:"Cómo funciona cada parte de la aplicación.",
      ajustes:"Idioma, tema y preferencias.",
      admin:"Usuarios, estímulos, dinámicas y estadísticas."},
  gl:{generar:"Estímulos por categoría, escenas combinadas e plantillas propias.",
      reto:"Unha dinámica ao chou con estímulos, coas súas instrucións.",
      show:"Cabina de son: audio multipista, efectos, metrónomo e escaleta.",
      guia:"Catálogo de dinámicas con pasos, obxectivos e variantes.",
      sesiones:"Planifica e garda as túas sesións de traballo.",
      grupos:"Xestiona os teus grupos e fai seguimento.",
      qr:"Abre unha sala e recolle propostas do público en directo.",
      universo:"Compañías, escolas, festivais e formatos verificados.",
      axenda:"Cursos, obradoiros e shows. Suxire os teus.",
      manual:"Como funciona cada parte da aplicación.",
      ajustes:"Idioma, tema e preferencias.",
      admin:"Usuarios, estímulos, dinámicas e estatísticas."},
  en:{generar:"Prompts by category, combined scenes and your own templates.",
      reto:"A random exercise with prompts and full instructions.",
      show:"Sound booth: multitrack audio, effects, metronome and rundown.",
      guia:"Exercise library with steps, goals and variations.",
      sesiones:"Plan and save your training sessions.",
      grupos:"Manage your groups and track their progress.",
      qr:"Open a room and collect audience suggestions live.",
      universo:"Companies, schools, festivals and verified formats.",
      axenda:"Courses, workshops and shows. Suggest your own.",
      manual:"How every part of the app works.",
      ajustes:"Language, theme and preferences.",
      admin:"Users, prompts, exercises and statistics."},
};

export const AREAS=[
  {id:"generar",  emoji:"🎲",  cor:"accent"},
  {id:"reto",     emoji:"⚡", cor:"warn"},
  {id:"show",     emoji:"🎛", cor:"danger"},
  {id:"guia",     emoji:"📖", cor:"ok"},
  {id:"sesiones", emoji:"📋", cor:"info", desc:"Planifica e garda as túas sesións de traballo.", conta:true},
  {id:"grupos",   emoji:"👥", cor:"info", desc:"Xestiona os teus grupos e fai seguimento.", conta:true},
  {id:"qr",       emoji:"📱", cor:"ok", desc:"Abre unha sala e recolle propostas do público en directo.", conta:true},
  {id:"universo", emoji:"🌍", cor:"accent"},
  {id:"axenda",   emoji:"📅", cor:"info"},
  {id:"manual",   emoji:"📘", cor:"info"},
  {id:"ajustes",  emoji:"⚙️", cor:"muted"},
  {id:"admin",    emoji:"🔐", cor:"danger", desc:"Usuarios, estímulos, dinámicas e estatísticas.", soAdmin:true},
];

export function Inicio({onIr,lang}){
  const {T}=useTheme();const S=mkS(T);
  // O hover pasa por estado de React en vez de escribir no DOM: se React e
  // o DOM discrepan sobre o estilo, gañan cousas raras ao redebuxar.
  const [hover,setHover]=useState(null);
  const {logueado,esAdmin}=useAuth();
  const {w,esMovil}=useViewport();

  // Resolve o token de cor da área contra o tema activo.
  const corDe=a=>T[a.cor]||T.accent;
  const visibles=AREAS.filter(a=>!a.soAdmin||esAdmin);
  // Columnas fixadas en vez de auto-fit. Con auto-fit e un minmax por
  // franxa aparecía unha descontinuidade: a 900px baixaba a 2 columnas e
  // volvía a 3 a partir de 1024, é dicir, a grella empeoraba ao agrandar a
  // pantalla. Fixándoas é monótono e predicible.
  const cols=w<360?1:w<720?2:3;

  return(
    <div style={{animation:"slideUp 0.3s ease"}}>
      <div style={{marginBottom:esMovil?"1.1rem":"1.6rem"}}>
        <h1 style={{...S.h1,margin:0}}>Que queres facer?</h1>
        {!logueado&&<p style={{...S.caption,marginTop:"0.35rem"}}>Podes usar case todo sen conta. As áreas marcadas precisan iniciar sesión para gardar.</p>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`,gap:esMovil?"0.6rem":"0.85rem"}}>
        {visibles.map(a=>{
          const bloqueada=a.conta&&!logueado;
          return(
            <button key={a.id} onClick={()=>onIr(a.id)}
              style={{
                background:T.bg2,
                // ⚠️ Antes: border:`1px solid ${T.border}` + borderTop:`3px solid ${a.cor}`.
                // Mesturar a abreviatura `border` cunha propiedade longa
                // (`borderTop`) rompe ao cambiar de tema: React só reescribe
                // as propiedades que mudaron, e como a cor da área non muda pero
                // `T.border` si, aplicaba `border` (que en CSS reinicia os
                // catro lados) sen volver aplicar `borderTop`. Resultado: a
                // franxa de cor desaparecía ata recargar.
                // Solución: só propiedades longas, sen abreviaturas.
                borderStyle:"solid",
                borderWidth:"3px 1px 1px 1px",
                borderRightColor:hover===a.id?corDe(a):T.border,
                borderBottomColor:hover===a.id?corDe(a):T.border,
                borderLeftColor:hover===a.id?corDe(a):T.border,
                borderTopColor:corDe(a),
                borderRadius:14,
                padding:esMovil?"0.9rem 0.8rem":"1.15rem 1rem",
                cursor:"pointer",
                textAlign:"left",
                fontFamily:"inherit",
                display:"flex",
                flexDirection:"column",
                gap:"0.4rem",
                minHeight:esMovil?116:148,
                transform:hover===a.id?"translateY(-2px)":"none",
                transition:"transform 0.15s, border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={()=>setHover(a.id)}
              onMouseLeave={()=>setHover(null)}
            >
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem",minWidth:0}}>
                <span style={{fontSize:esMovil?"1.4rem":"1.7rem",lineHeight:1,flexShrink:0}}>{a.emoji}</span>
                {bloqueada&&<span style={{marginLeft:"auto",fontSize:"0.62rem",color:T.text4,border:`1px solid ${T.border}`,borderRadius:20,padding:"0.1rem 0.4rem",whiteSpace:"nowrap",flexShrink:0}}>conta</span>}
              </div>
              <span style={{color:T.text,fontWeight:800,fontSize:esMovil?"0.95rem":"1.05rem",letterSpacing:"-0.02em",lineHeight:1.2}}>
                {TAB_LABELS[lang]?.[a.id]||a.id}
              </span>
              <span style={{color:T.text3,fontSize:esMovil?"0.74rem":"0.79rem",lineHeight:1.4,flex:1}}>{(DESCS[lang]||DESCS.gl)[a.id]||""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
