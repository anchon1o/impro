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

export const AREAS=[
  {id:"generar",  emoji:"🎲",  cor:"#e040fb", desc:"Estímulos por categoría, escenas combinadas e plantillas propias."},
  {id:"reto",     emoji:"⚡", cor:"#ffd740", desc:"Unha dinámica ao chou con estímulos, coas súas instrucións."},
  {id:"show",     emoji:"🎭", cor:"#ff6e40", desc:"Audio multipista, efectos, metrónomo, rundown e sorteos."},
  {id:"guia",     emoji:"📖", cor:"#69f0ae", desc:"Catálogo de dinámicas con pasos, obxectivos e variantes."},
  {id:"sesiones", emoji:"📋", cor:"#40c4ff", desc:"Planifica e garda as túas sesións de traballo.", conta:true},
  {id:"grupos",   emoji:"👥", cor:"#40c4ff", desc:"Xestiona os teus grupos e fai seguimento.", conta:true},
  {id:"qr",       emoji:"📱", cor:"#69f0ae", desc:"Abre unha sala e recolle propostas do público en directo.", conta:true},
  {id:"universo", emoji:"🌍", cor:"#e040fb", desc:"Compañías, escolas, festivais e formatos verificados."},
  {id:"manual",   emoji:"📘", cor:"#40c4ff", desc:"Como funciona cada parte da aplicación."},
  {id:"ajustes",  emoji:"⚙️", cor:"#78909c", desc:"Idioma, tema e preferencias."},
  {id:"admin",    emoji:"🔐", cor:"#ff6e40", desc:"Usuarios, estímulos, dinámicas e estatísticas.", soAdmin:true},
];

export function Inicio({onIr,lang}){
  const {T}=useTheme();const S=mkS(T);
  const {logueado,esAdmin}=useAuth();
  const {w,esMovil}=useViewport();

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
                border:`1px solid ${T.border}`,
                borderTop:`3px solid ${a.cor}`,
                borderRadius:14,
                padding:esMovil?"0.9rem 0.8rem":"1.15rem 1rem",
                cursor:"pointer",
                textAlign:"left",
                fontFamily:"inherit",
                display:"flex",
                flexDirection:"column",
                gap:"0.4rem",
                minHeight:esMovil?116:148,
                transition:"transform 0.15s, border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor=a.cor;e.currentTarget.style.borderTopColor=a.cor;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor=T.border;e.currentTarget.style.borderTopColor=a.cor;}}
            >
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem",minWidth:0}}>
                <span style={{fontSize:esMovil?"1.4rem":"1.7rem",lineHeight:1,flexShrink:0}}>{a.emoji}</span>
                {bloqueada&&<span style={{marginLeft:"auto",fontSize:"0.62rem",color:T.text4,border:`1px solid ${T.border}`,borderRadius:20,padding:"0.1rem 0.4rem",whiteSpace:"nowrap",flexShrink:0}}>conta</span>}
              </div>
              <span style={{color:T.text,fontWeight:800,fontSize:esMovil?"0.95rem":"1.05rem",letterSpacing:"-0.02em",lineHeight:1.2}}>
                {TAB_LABELS[lang]?.[a.id]||a.id}
              </span>
              <span style={{color:T.text3,fontSize:esMovil?"0.74rem":"0.79rem",lineHeight:1.4,flex:1}}>{a.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
