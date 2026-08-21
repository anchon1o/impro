import { useState } from 'react';
import { useTheme, useAuth, useViewport, mkS, TAB_LABELS, TYPE } from './core.jsx';
import { Icona } from './iconos.jsx';

// IM-M02 — Pantalla de inicio tipo botonera.
//
// Antes a app abría directamente en «Generar» e as áreas só eran
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
  es:{generar:"Estímulos por categoría, escenas, retos con dinámica y plantillas propias.",
      plano:"Dibuja el escenario: quién está dónde, hacia dónde mira y cómo se mueve.",
      sonido:"Mesa de sonido táctil: capas simultáneas, efectos y contadores.",
      guia:"Catálogo de dinámicas con pasos, objetivos y variantes.",
      sesiones:"Planifica y guarda tus sesiones de trabajo.",
      grupos:"Gestiona tus grupos y haz seguimiento.",
      qr:"Abre una sala y recoge propuestas del público en directo.",
      universo:"Compañías, escuelas, festivales y formatos verificados.",
      axenda:"Cursos, talleres y shows. Sugiere los tuyos.",
      manual:"Cómo funciona cada parte de la aplicación.",
      ajustes:"Idioma, tema y preferencias.",
      admin:"Usuarios, estímulos, dinámicas y estadísticas."},
  gl:{generar:"Estímulos por categoría, escenas, retos con dinámica e plantillas propias.",
      plano:"Debuxa o escenario: quen está onde, cara a onde mira e como se move.",
      sonido:"Mesa de son táctil: capas simultáneas, efectos e contadores.",
      guia:"Catálogo de dinámicas con pasos, obxectivos e variantes.",
      sesiones:"Planifica e garda as túas sesións de traballo.",
      grupos:"Xestiona os teus grupos e fai seguimento.",
      qr:"Abre unha sala e recolle propostas do público en directo.",
      universo:"Compañías, escolas, festivais e formatos verificados.",
      axenda:"Cursos, obradoiros e shows. Suxire os teus.",
      manual:"Como funciona cada parte da aplicación.",
      ajustes:"Idioma, tema e preferencias.",
      admin:"Usuarios, estímulos, dinámicas e estatísticas."},
  en:{generar:"Prompts by category, scenes, exercise challenges and your own templates.",
      plano:"Draw the stage: who stands where, where they look and how they move.",
      sonido:"Touch sound desk: simultaneous layers, effects and counters.",
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

// Sen emojis: cada área ten un icono do set, e a cor sae do tema.
// Un emoji píntao o sistema operativo, así que ignora o tema, cambia de
// aspecto entre iOS, Android e Windows, e desentona co resto. Os iconos
// van en `currentColor` e collen o token de cor da área.
//
// ⚠️ `icona` ten que existir en `iconos.jsx`. Hai unha proba que
// percorre AREAS e falla se algunha queda sen icono.
export const AREAS=[
  {id:"generar",  icona:"generar",  cor:"accent"},
  {id:"sonido",   icona:"sonido",   cor:"accent"},
  {id:"guia",     icona:"guia",     cor:"ok"},
  {id:"plano",    icona:"plano",    cor:"warn"},
  {id:"sesiones", icona:"sesiones", cor:"info", desc:"Planifica e garda as túas sesións de traballo.", conta:true},
  {id:"grupos",   icona:"grupos",   cor:"info", desc:"Xestiona os teus grupos e fai seguimento.", conta:true},
  {id:"qr",       icona:"qr",       cor:"ok", desc:"Abre unha sala e recolle propostas do público en directo.", conta:true},
  {id:"universo", icona:"universo", cor:"accent"},
  {id:"axenda",   icona:"axenda",   cor:"info"},
  {id:"manual",   icona:"manual",   cor:"info"},
  {id:"ajustes",  icona:"ajustes",  cor:"muted"},
];
// V01 · Admin xa non está aquí: subiu á cabeceira. Era a única das áreas que
// non se usa facendo impro, e ocupaba unha tarxeta enteira para os admins.
// A descrición mantense en DESCS porque a segue usando o menú ⋯ de móbil.

export function Inicio({onIr,lang}){
  const {T}=useTheme();const S=mkS(T);
  // O hover pasa por estado de React en vez de escribir no DOM: se React e
  // o DOM discrepan sobre o estilo, gañan cousas raras ao redebuxar.
  const [hover,setHover]=useState(null);
  const {logueado}=useAuth();
  const {w,esMovil,h}=useViewport();

  // Resolve o token de cor da área contra o tema activo.
  const corDe=a=>T[a.cor]||T.accent;
  const visibles=AREAS;
  // Columnas fixadas en vez de auto-fit. Con auto-fit e un minmax por
  // franxa aparecía unha descontinuidade: a 900px baixaba a 2 columnas e
  // volvía a 3 a partir de 1024, é dicir, a grella empeoraba ao agrandar a
  // pantalla. Fixándoas é monótono e predicible.
  // Con iconos grandes e sen descrición caben máis por fila: as once
  // vense dun golpe de vista, sen desprazar.
  // Persiste, e vén ACESA por defecto: as descricións son o que fai que
  // alguén que entra por primeira vez saiba que é «Universo» sen probalo.
  // Quen xa se sabe o menú apágaas e recupera espazo para o icono.
  const [axuda,setAxudaEstado]=useState(()=>{
    try{const v=localStorage.getItem("impro_desc_botonera");return v===null?true:v==="1";}
    catch(e){return true;}
  });
  const setAxuda=v=>{
    const n=typeof v==="function"?v(axuda):v;
    setAxudaEstado(n);
    try{localStorage.setItem("impro_desc_botonera",n?"1":"0");}catch(e){/* modo privado */}
  };

  const cols=w<340?2:w<560?3:w<900?4:5;
  const filas=Math.ceil(visibles.length/cols);
  const oco=cols*filas-visibles.length;   // ocos na última fila

  // A reixa enche a pantalla: calcúlase o alto dispoñible e repártese
  // entre as filas, en vez de fixar un alto e deixar media pantalla
  // baleira nun iPad. O icono escala con el, así que en tablet pasa de
  // 52 a uns 84 px sen tocar nada.
  const GAP=esMovil?9:12;
  const RESERVA=esMovil?150:178;          // cabeceira + título + marxes
  const libre=Math.max(240,(h||800)-RESERVA-GAP*(filas-1));
  const altoT=Math.max(esMovil?92:112,Math.min(300,libre/filas));
  // Coas descricións acesas o icono cede sitio ao texto. Sen elas
  // recupera todo o protagonismo.
  const szIcona=Math.max(28,Math.min(84,Math.round(altoT*(axuda?0.28:0.42))));

  // A descrición sae das tarxetas: engade texto que só se le a primeira
  // vez e rouba o sitio ao icono, que é o que se recoñece de lonxe.
  // Queda detrás do botón de axuda, e completa no Manual.

  return(
    <div style={{animation:"slideUp 0.3s ease"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:"0.6rem",marginBottom:esMovil?"1.1rem":"1.5rem"}}>
        <div style={{flex:1,minWidth:0}}>
          <h1 style={{...S.h1,margin:0}}>Que queres facer?</h1>
          {!logueado&&<p style={{...S.caption,marginTop:"0.35rem"}}>Podes usar case todo sen conta. As áreas marcadas precisan iniciar sesión para gardar.</p>}
        </div>
        <button onClick={()=>setAxuda(v=>!v)}
          aria-pressed={axuda} aria-label={axuda?"Agochar as descricións":"Que fai cada área"}
          title={axuda?"Agochar as descricións":"Que fai cada área"}
          style={{
            width:38,height:38,borderRadius:11,flexShrink:0,
            background:axuda?T.accent+"1A":T.bg2,
            borderStyle:"solid",borderWidth:1,
            borderColor:axuda?T.accent:T.border,
            color:axuda?T.accent:T.text3,
            cursor:"pointer",fontFamily:"inherit",fontWeight:800,fontSize:"0.95rem",
            display:"flex",alignItems:"center",justifyContent:"center",
            transition:"background 0.15s, border-color 0.15s, color 0.15s",
          }}>?</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`,gap:GAP}}>
        {visibles.map((a,idx)=>{
          const bloqueada=a.conta&&!logueado;
          const cor=corDe(a);
          return(
            <button key={a.id} onClick={()=>onIr(a.id)}
              style={{
                background:hover===a.id?cor+"14":T.bg2,
                height:altoT,
                // As once áreas non enchen a última fila (con 4 columnas
                // quedan 4+4+3). En vez de deixar o oco á dereita,
                // céntranse: unha fila descentrada lese como un erro.
                gridColumn:(oco&&idx===visibles.length-(visibles.length%cols||cols))
                  ?`${Math.floor(oco/2)+1} / span 1`:undefined,
                // ⚠️ Só propiedades longas, nunca a abreviatura `border`:
                // mesturalas rompe ao cambiar de tema, porque React só
                // reescribe o que mudou e `border` reinicia os catro lados
                // levando por diante a cor da área (B24).
                borderStyle:"solid",
                borderWidth:1,
                borderColor:hover===a.id?cor:T.border,
                borderRadius:16,
                padding:esMovil?"0.6rem 0.4rem":"0.9rem 0.6rem",
                cursor:"pointer",
                textAlign:"center",
                fontFamily:"inherit",
                display:"flex",
                flexDirection:"column",
                alignItems:"center",
                justifyContent:"center",
                gap:0,
                position:"relative",
                transform:hover===a.id?"translateY(-2px)":"none",
                transition:"transform 0.15s, border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={()=>setHover(a.id)}
              onMouseLeave={()=>setHover(null)}
            >
              {bloqueada&&<span style={{
                position:"absolute",top:6,right:6,...TYPE.caption,fontSize:"0.58rem",
                color:T.text4,borderStyle:"solid",borderWidth:1,borderColor:T.border,
                borderRadius:20,padding:"0.05rem 0.35rem",whiteSpace:"nowrap",
              }}>conta</span>}

              {/* O icono é o protagonista: é o que se recoñece de lonxe e
                  sen ler. A 52 px aproveita a grella de 24 moito mellor
                  que os 25 de antes. */}
              <Icona nome={a.icona} size={szIcona} cor={cor}/>

              <span style={{
                ...TYPE.h3,color:T.text,fontWeight:800,
                fontSize:altoT>180?(axuda?"0.98rem":"1.05rem"):altoT>130?"0.95rem":"0.82rem",
                letterSpacing:"-0.02em",lineHeight:1.2,
                marginTop:altoT>180?(axuda?"0.7rem":"1rem"):"0.7rem",
              }}>
                {TAB_LABELS[lang]?.[a.id]||a.id}
              </span>

              {/* O subliñado só cando hai descrición: aí separa o nome
                  do texto e gaña algo. Sen descrición é unha raia que
                  ocupa sitio e non separa nada, así que a cor xa a leva
                  o propio icono. */}
              {axuda&&<span style={{
                width:24,height:3,borderRadius:2,background:cor,
                marginTop:esMovil?"0.4rem":"0.5rem",flexShrink:0,
              }}/>}

              {axuda&&<span style={{
                color:T.text3,fontSize:esMovil?"0.68rem":"0.74rem",lineHeight:1.35,
                marginTop:"0.5rem",display:"-webkit-box",
                // Recórtase a 3 liñas: a altura da tarxeta é fixa e unha
                // descrición longa desbordaría por abaixo.
                WebkitLineClamp:altoT>200?4:3,
                WebkitBoxOrient:"vertical",overflow:"hidden",
                maxWidth:"22ch",
              }}>{(DESCS[lang]||DESCS.gl)[a.id]||""}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
