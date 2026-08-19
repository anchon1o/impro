// ============================================================
// ImproApp.jsx
// Punto de entrada: navegación principal, autenticación e migración.
// A maioría dos módulos viven agora en ficheiros propios (T04).
// ============================================================

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import {
  ThemeCtx, LangCtx, AuthCtx, useAuth, useLang, useTheme, useThemeProvider,
  EstimulosProvider, useEstimulos, TAB_LABELS, LANGS, ls, mkS, TimerBar, useAudio,
  FONT_UI, FONT_MONO, TYPE, useViewport,
} from './core.jsx';
import { Icona, useEstiloIconos } from './iconos.jsx';
import {
  getSession, onAuthChange, getPerfil, signOut,
} from './auth.js';
import { saveDinamica, saveGrupo, saveSesion } from './db.js';
import { invalidarCache } from './estimulos.js';
import { supabaseConfigured } from './supabase.js';

import { TabGenerar } from './tabs/TabGenerar.jsx';
import { TabReto } from './tabs/TabReto.jsx';
import { TabSesiones } from './tabs/TabSesiones.jsx';
import { TabGuia } from './tabs/TabGuia.jsx';
import { TabGrupos } from './tabs/TabGrupos.jsx';
import { TabQR } from './tabs/TabQR.jsx';
import { TabAjustes } from './tabs/TabAjustes.jsx';
import { TabUniverso } from './tabs/TabUniverso.jsx';
import { PantallaPublica } from './PantallaPublica.jsx';
import { ModoShow } from './ModoShow.jsx';
import { LoginModal } from './auth/LoginModal.jsx';
import { LoginGate } from './auth/LoginGate.jsx';
import { Inicio } from './Inicio.jsx';
import { TabAxenda } from './tabs/TabAxenda.jsx';
import { BotonReporte } from './tabs/BotonReporte.jsx';
import { LimiteErro } from './LimiteErro.jsx';

// ⚠️ Carga baixo demanda. Estas tres pestanas son as máis pesadas do
// proxecto e as que menos xente abre: Sonido arrastra o motor de audio
// enteiro, Admin son 9 seccións e Manual 13. Cargalas de saída facía
// que as pagase todo o mundo, incluído quen só entra a Xerar estímulos.
//
// `React.lazy` precisa export por defecto; estes ficheiros exportan por
// nome, así que se adapta aquí en vez de tocar catro ficheiros.
const TabSonido = lazy(() => import('./sonido/TabSonido.jsx').then(m => ({ default: m.TabSonido })));
const TabAdmin  = lazy(() => import('./tabs/TabAdmin.jsx').then(m => ({ default: m.TabAdmin })));
const TabManual = lazy(() => import('./tabs/TabManual.jsx').then(m => ({ default: m.TabManual })));

// Mentres chega o anaco. Non é un spinner animado a propósito: aparece
// e desaparece nun intre, e un spinner que parpadea molesta máis que
// unha liña de texto.
function Cargando({ T }) {
  return (
    <p style={{ color: T.text4, fontSize: '0.85rem', padding: '2rem 0', textAlign: 'center' }}>
      Cargando…
    </p>
  );
}

export const TABS=[
  {id:"generar",label:"Generar",icona:"generar"},
  {id:"reto",label:"Reto",icona:"reto"},
  {id:"sesiones",label:"Sesiones",icona:"sesiones"},
  {id:"guia",label:"Guía",icona:"guia"},
  {id:"sonido",label:"Sonido",icona:"sonido"},
  {id:"grupos",label:"Grupos",icona:"grupos"},
  {id:"qr",label:"QR",icona:"qr"},
  {id:"admin",label:"Admin",icona:"admin"},
  {id:"ajustes",label:"Ajustes",icona:"ajustes"},
  {id:"manual",label:"Manual",icona:"manual"},
  {id:"universo",label:"Universo",icona:"universo"},
  {id:"axenda",label:"Axenda",icona:"axenda"},
];

function AppInner({perfil,publico}={}){
  // Modo función de Sonido: a mesa pide a pantalla enteira. Avísao por
  // un evento e non por props porque Sonido vai baixo demanda e está
  // tres niveis por debaixo; menos cableado que un contexto novo para
  // un só booleano.
  const [pantallaChea,setPantallaChea]=useState(false);
  useEffect(()=>{
    const f=e=>setPantallaChea(!!(e&&e.detail));
    window.addEventListener("impro:pantallaChea",f);
    // Se se sae da pestana sen apagalo, a cabeceira volve igual.
    return()=>{window.removeEventListener("impro:pantallaChea",f);};
  },[]);
  const {dark,toggle,T}=useTheme();
  const {logueado,pedirLogin,esAdmin,migrando}=useAuth();
  const {esMovil,esTablet,esPC}=useViewport();
  const [tab,setTab]=useState("inicio");
  const [animating,setAnimating]=useState(false);
  const [pubStimulus,setPubStimulus]=useState(null);
  const [pubOpen,setPubOpen]=useState(false);
  const [menuAberto,setMenuAberto]=useState(false);
  const [langAberto,setLangAberto]=useState(false);
  // IM-M03: o temporizador xa non está sempre montado. Só cando se pide.
  const [timerAberto,setTimerAberto]=useState(false);
  const [pubTimerDisplay,setPubTimerDisplay]=useState(0);
  const [pubTimerRunning,setPubTimerRunning]=useState(false);
  const [pubRundown,setPubRundown]=useState([]);
  const [modoShow,setModoShow]=useState(false);
  const [lang,setLangState]=useState(()=>ls.get("impro_lang","es"));
  const {recargar:recargarEstimulos}=useEstimulos();
  const setLang=l=>{setLangState(l);ls.set("impro_lang",l);invalidarCache();recargarEstimulos(true);};
  const [grupoActivo,setGrupoActivo]=useState(()=>ls.get("impro_grupo_activo",null));
  const setGrupo=g=>{setGrupoActivo(g);ls.set("impro_grupo_activo",g);};
  const timerLaunchRef=useRef(null);
  // Sesións chama a isto. Como o temporizador pode estar pechado, ábreo
  // primeiro e lanza no seguinte tick, cando launchRef xa está asignado.
  const launchTimer=useCallback((mins)=>{
    setTimerAberto(true);
    if(timerLaunchRef.current)timerLaunchRef.current(mins*60);
    else setTimeout(()=>{if(timerLaunchRef.current)timerLaunchRef.current(mins*60);},0);
  },[]);
  const audio=useAudio();
  useEffect(()=>{const params=new URLSearchParams(window.location.search);if(params.get("sala"))setTab("qr");},[]);
  const changeTab=newTab=>{if(newTab===tab||animating)return;setAnimating(true);setTab(newTab);setTimeout(()=>setAnimating(false),280);};
  return(<LangCtx.Provider value={{lang,setLang}}><div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:FONT_UI,transition:"background 0.3s,color 0.3s"}}>
    <style>{`
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      @keyframes spotlightIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}
      @keyframes pubIn{from{transform:scale(0.85) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
      @keyframes urgentPulse{from{opacity:1}to{opacity:0.4}}
      .tab-content{animation:slideUp 0.28s ease}
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');
      *{box-sizing:border-box;outline:none;-webkit-tap-highlight-color:transparent}
      html,body{margin:0;padding:0;border:none;outline:none;background:#0d0d0d;
        font-family:${FONT_UI};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
        text-rendering:optimizeLegibility;font-size:16px}
      #root{margin:0;padding:0;border:none;outline:none;font-family:${FONT_UI}}
      input,textarea,select,button{font-family:${FONT_UI}}
      h1,h2,h3,h4{font-family:${FONT_UI};letter-spacing:-0.02em}
      /* Evita o zoom automático de iOS ao enfocar campos */
      @media (max-width:820px){input,textarea,select{font-size:16px}}
      ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:3px}
      button{outline:none}
      button:hover{opacity:0.84}
      button:focus-visible{outline:2px solid #e040fb;outline-offset:2px}
      input:focus,textarea:focus,select:focus{outline:none;box-shadow:none}
      input[type=range]{height:4px;outline:none;border:none;background:transparent}
      textarea{resize:vertical;border:none}
      select{appearance:none;-webkit-appearance:none;border:none;outline:none}
      nav::-webkit-scrollbar{display:none}
      details summary{cursor:pointer;list-style:none}
      details summary::-webkit-details-marker{display:none}
      @media (prefers-color-scheme:dark){html,body{background:#0d0d0d}}
    `}</style>
    {modoShow&&<ModoShow audio={audio} onClose={()=>setModoShow(false)} onStimulus={s=>setPubStimulus(s)} rundown={pubRundown} setRundown={setPubRundown}/>}
    {pubOpen&&<PantallaPublica stimulus={pubStimulus} timerDisplay={pubTimerDisplay} timerRunning={pubTimerRunning} rundown={pubRundown} onClose={()=>setPubOpen(false)}/>}
    {!pantallaChea&&<header style={{borderBottom:`1px solid ${T.navBorder}`,padding:"0.8rem 1rem 0",background:T.nav,position:"sticky",top:0,zIndex:100,transition:"background 0.3s,border-color 0.3s"}}>
      <div style={{maxWidth:960,margin:"0 auto"}}>
        {/* IM-B02 / IM-M01. A fila anterior era un flex space-between sen
            flexWrap nin minWidth:0, con logo + selector de idioma (3 botóns)
            + tema + 🎬 + 📺 + Entrar. Nun móbil de 360px o contido mínimo
            medía uns 440px e desbordaba a páxina enteira.
            Agora en móbil só quedan á vista as accións primarias e o resto
            móvese a un menú. Non se oculta o overflow: elimínase a causa. */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.55rem",gap:"0.5rem",minWidth:0}}>
          <button onClick={()=>{setMenuAberto(false);changeTab("inicio");}} title="Inicio" style={{display:"flex",alignItems:"center",gap:"0.45rem",minWidth:0,overflow:"hidden",background:"none",border:"none",padding:0,cursor:"pointer",color:"inherit",fontFamily:"inherit"}}>
            <span style={{fontWeight:800,fontSize:esMovil?"0.98rem":"1.08rem",letterSpacing:"-0.03em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>impro<span style={{color:T.accent}}>App</span></span>
            {!esMovil&&<span style={{background:T.accent+"22",color:T.accent,borderRadius:4,padding:"0.06rem 0.38rem",fontSize:"0.62rem",fontWeight:700,flexShrink:0}}>v10</span>}
          </button>
          <div style={{display:"flex",gap:"0.4rem",alignItems:"center",flexShrink:0}}>
            {!esMovil&&<div style={{position:"relative"}}>
              <button onClick={()=>setLangAberto(v=>!v)} title="Idioma" style={{background:"none",border:"none",borderRadius:8,padding:"0.3rem 0.45rem",cursor:"pointer",fontSize:"0.78rem",color:T.text3,fontFamily:"inherit",display:"flex",alignItems:"center",gap:"0.25rem"}}>
                <Icona nome="idioma" size={17}/><span style={{fontWeight:700,fontSize:"0.7rem"}}>{lang.toUpperCase()}</span>
              </button>
              {langAberto&&<>
                <div onClick={()=>setLangAberto(false)} style={{position:"fixed",inset:0,zIndex:150}}/>
                <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",zIndex:151,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:10,padding:"0.3rem",minWidth:170,boxShadow:"0 8px 24px rgba(0,0,0,0.35)"}}>
                  {LANGS.map(L=><button key={L.id} onClick={()=>{setLang(L.id);setLangAberto(false);}} style={{display:"flex",alignItems:"center",gap:"0.5rem",width:"100%",background:lang===L.id?T.accent+"22":"none",border:"none",borderRadius:7,padding:"0.45rem 0.55rem",cursor:"pointer",color:lang===L.id?T.accent:T.text2,fontSize:"0.8rem",fontFamily:"inherit",textAlign:"left"}}>
                    <span style={{fontFamily:"monospace",fontWeight:700,fontSize:"0.68rem",opacity:0.7,width:18}}>{L.id.toUpperCase()}</span>
                    <span style={{flex:1}}>{L.nativo}</span>
                    {!L.uiCompleta&&<span style={{fontSize:"0.6rem",color:T.text4,whiteSpace:"nowrap"}}>só contido</span>}
                  </button>)}
                </div>
              </>}
            </div>}
            {/* Secundarios: icona soa, sen recadro. Antes tiñan o mesmo peso
                visual có botón de Modo Show, que si é a acción principal. */}
            {!esMovil&&<button onClick={toggle} title={dark?"Tema claro":"Tema escuro"} style={{background:"none",border:"none",borderRadius:8,padding:"0.3rem 0.35rem",cursor:"pointer",fontSize:"0.9rem",opacity:0.65,transition:"opacity 0.2s",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.65}><Icona nome="tema" size={18}/></button>}
            {!esMovil&&<button onClick={()=>setTimerAberto(v=>!v)} title="Temporizador" style={{background:"none",border:"none",borderRadius:8,padding:"0.3rem 0.35rem",cursor:"pointer",fontSize:"0.9rem",opacity:timerAberto?1:0.65,filter:timerAberto?"none":"grayscale(0.4)",transition:"opacity 0.2s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=timerAberto?1:0.65}><Icona nome="temporizador" size={18}/></button>}
            {/* V05 · As dúas levaban só a icona, e `title` non existe nun
                móbil nin nunha tableta táctil: eran dous debuxos sen nome.
                A etiqueta só aparece en escritorio (esPC, non !esMovil): en
                tableta a fila medía máis do ancho dispoñible, que é a causa
                exacta de B22. */}
            {!esMovil&&<button onClick={()=>setPubOpen(p=>!p)} title="Proxección" style={{background:"none",border:"none",borderRadius:8,padding:"0.3rem 0.45rem",cursor:"pointer",fontSize:"0.9rem",opacity:pubOpen?1:0.65,filter:pubOpen?"none":"grayscale(0.4)",transition:"opacity 0.2s",display:"flex",alignItems:"center",gap:"0.3rem",color:T.text2,fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=pubOpen?1:0.65}>
              <Icona nome="proxeccion" size={18}/>{esPC&&<span style={{fontSize:"0.72rem",fontWeight:600,whiteSpace:"nowrap"}}>Proxección</span>}
            </button>}
            <button onClick={()=>setModoShow(true)} title="En directo" style={{background:T.info,border:"none",borderRadius:8,padding:"0.35rem 0.7rem",cursor:"pointer",fontSize:"0.75rem",color:"#000",fontWeight:700,fontFamily:"inherit",flexShrink:0,display:"flex",alignItems:"center",gap:"0.3rem"}}>
              <Icona nome="endirecto" size={18}/>{esPC&&<span style={{whiteSpace:"nowrap"}}>En directo</span>}
            </button>
            {/* V01 · Admin sae da botonera e sobe aquí. Só para admins. */}
            {!esMovil&&esAdmin&&<button onClick={()=>{setMenuAberto(false);changeTab("admin");}} title="Admin" style={{background:tab==="admin"?T.danger+"22":"none",border:`1px solid ${tab==="admin"?T.danger:"transparent"}`,borderRadius:8,padding:"0.3rem 0.45rem",cursor:"pointer",fontSize:"0.9rem",opacity:tab==="admin"?1:0.65,transition:"opacity 0.2s",flexShrink:0,fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=tab==="admin"?1:0.65}><Icona nome="admin" size={18}/></button>}
            {esMovil&&<button onClick={()=>setMenuAberto(v=>!v)} title="Máis" style={{background:menuAberto?T.accent+"22":T.bg3,border:`1px solid ${menuAberto?T.accent:T.border}`,borderRadius:8,padding:"0.35rem 0.6rem",cursor:"pointer",fontSize:"0.85rem",color:menuAberto?T.accent:T.text3,flexShrink:0,lineHeight:1}}>⋯</button>}
            {logueado?<button onClick={()=>{if(confirm("Pechar sesión?"))signOut();}} title={perfil?.email} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,padding:"0.35rem 0.6rem",cursor:"pointer",fontSize:"0.75rem",color:T.text3,flexShrink:0}}><Icona nome="salir" size={16}/></button>:<button onClick={pedirLogin} style={{background:T.accent,border:"none",borderRadius:8,padding:"0.35rem 0.7rem",cursor:"pointer",fontSize:"0.75rem",color:"#fff",fontWeight:700,fontFamily:"inherit",flexShrink:0,whiteSpace:"nowrap"}}>Entrar</button>}
          </div>
        </div>

        {/* Menú de desbordamento: só móbil. Recolle o que se retirou da fila. */}
        {esMovil&&menuAberto&&<div style={{paddingBottom:"0.6rem",animation:"slideUp 0.2s ease"}}>
          <div style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:10,padding:"0.6rem"}}>
            <div style={{marginBottom:"0.5rem"}}>
              <button onClick={()=>setLangAberto(v=>!v)} style={{display:"flex",alignItems:"center",gap:"0.5rem",width:"100%",background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,padding:"0.55rem",cursor:"pointer",color:T.text2,fontSize:"0.78rem",fontFamily:"inherit",minHeight:38}}>
                <Icona nome="idioma" size={19}/>
                <span style={{flex:1,textAlign:"left"}}>{LANGS.find(L=>L.id===lang)?.nativo||lang}</span>
                <span style={{color:T.text4,fontSize:"0.8rem"}}>{langAberto?"▴":"▾"}</span>
              </button>
              {langAberto&&<div style={{marginTop:"0.35rem",display:"flex",flexDirection:"column",gap:"0.2rem"}}>
                {LANGS.map(L=><button key={L.id} onClick={()=>{setLang(L.id);setLangAberto(false);}} style={{display:"flex",alignItems:"center",gap:"0.5rem",background:lang===L.id?T.accent+"22":T.bg2,border:`1px solid ${lang===L.id?T.accent:T.border}`,borderRadius:7,padding:"0.5rem 0.55rem",cursor:"pointer",color:lang===L.id?T.accent:T.text2,fontSize:"0.78rem",fontFamily:"inherit",textAlign:"left",minHeight:38}}>
                  <span style={{fontFamily:"monospace",fontWeight:700,fontSize:"0.68rem",opacity:0.7,width:18}}>{L.id.toUpperCase()}</span>
                  <span style={{flex:1}}>{L.nativo}</span>
                  {!L.uiCompleta&&<span style={{fontSize:"0.6rem",color:T.text4}}>só contido</span>}
                </button>)}
              </div>}
            </div>
            {/* V03 · Antes era `auth-fit` con minmax(100px): nun móbil de 360
                non chegaban os 100 px por columna e caía a dúas, coas
                etiquetas partidas en dúas liñas. Agora son tres columnas
                fixas con icona arriba e etiqueta pequena debaixo, que é o
                único que cabe ben nun ancho de teléfono. */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"0.4rem"}}>
              {[
                {k:"tema",  icona:"tema",         etiqueta:dark?"Claro":"Escuro", activo:false,       onClick:toggle},
                {k:"timer", icona:"temporizador", etiqueta:"Temporizador",        activo:timerAberto, onClick:()=>{setTimerAberto(v=>!v);setMenuAberto(false);}},
                {k:"pub",   icona:"proxeccion",   etiqueta:"Proxección",          activo:pubOpen,     onClick:()=>{setPubOpen(p=>!p);setMenuAberto(false);}},
              ].map(b=>(
                <button key={b.k} onClick={b.onClick} style={{background:b.activo?T.accent+"22":T.bg2,borderStyle:"solid",borderWidth:1,borderColor:b.activo?T.accent:T.border,borderRadius:8,padding:"0.5rem 0.3rem",cursor:"pointer",color:b.activo?T.accent:T.text2,fontFamily:"inherit",minHeight:56,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"0.22rem"}}>
                  <Icona nome={b.icona} size={20}/>
                  <span style={{fontSize:"0.66rem",lineHeight:1.15,textAlign:"center",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%"}}>{b.etiqueta}</span>
                </button>
              ))}
            </div>
            {/* V01 · Admin en móbil. Vai fóra da reixa a propósito: os tres de
                arriba son interruptores e este leva a outra pantalla. */}
            {esAdmin&&<button onClick={()=>{setMenuAberto(false);changeTab("admin");}} style={{display:"flex",alignItems:"center",gap:"0.5rem",width:"100%",marginTop:"0.4rem",background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,padding:"0.55rem",cursor:"pointer",color:T.text2,fontSize:"0.78rem",fontFamily:"inherit",minHeight:38}}>
              <Icona nome="admin" size={19}/>
              <span style={{flex:1,textAlign:"left"}}>Admin</span>
              <span style={{color:T.text4,fontSize:"0.8rem"}}>›</span>
            </button>}
          </div>
        </div>}

        {tab!=="inicio"&&<nav style={{display:"flex",gap:0,overflowX:"auto",scrollbarWidth:"none"}}>
          {TABS.filter(t=>t.id!=="admin"||esAdmin).map(t=>(<button key={t.id} onClick={()=>{setMenuAberto(false);changeTab(t.id);}} style={{background:"none",border:"none",cursor:"pointer",color:tab===t.id?T.text:T.text3,padding:esMovil?"0.55rem 0.7rem":"0.45rem 0.8rem",fontSize:esMovil?"0.78rem":"0.82rem",fontWeight:tab===t.id?700:400,borderBottom:tab===t.id?`2px solid ${T.accent}`:"2px solid transparent",transition:"all 0.2s",display:"flex",alignItems:"center",gap:"0.3rem",whiteSpace:"nowrap",flexShrink:0,fontFamily:"inherit"}}>
            <Icona nome={t.icona} size={17}/><span>{TAB_LABELS[lang]?.[t.id]||t.label}</span>
          </button>))}
        </nav>}
      </div>
    </header>}
    {!supabaseConfigured&&<div style={{background:T.danger+"22",borderBottom:`1px solid ${T.danger}55`,padding:"0.55rem 1rem",textAlign:"center"}}>
      <span style={{color:T.danger,fontSize:"0.82rem",fontWeight:700}}>⚠️ Sen conexión a Supabase — faltan as credenciais (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Login e datos en tempo real non funcionarán.</span>
    </div>}
    {migrando&&<div style={{background:T.ok+"15",borderBottom:`1px solid ${T.ok}33`,padding:"0.5rem 1rem",textAlign:"center"}}>
      <span style={{color:T.ok,fontSize:"0.82rem"}}>↻ Sincronizando os teus datos coa conta...</span>
    </div>}
    <main style={{maxWidth:1100,margin:"0 auto",padding:esMovil?`0.9rem 0.75rem ${timerAberto?"6.5rem":"1.5rem"}`:`1.4rem 1.25rem ${timerAberto?"6rem":"2rem"}`}}>
      <div className="tab-content" key={tab}>
        <LimiteErro onde={tab} T={T}>
        <Suspense fallback={<Cargando T={T}/>}>
        {tab==="inicio"&&<Inicio lang={lang} onIr={id=>changeTab(id)}/>}
        {tab==="generar"&&<TabGenerar onStimulus={s=>setPubStimulus(s)}/>}
        {tab==="reto"&&<TabReto/>}
        {tab==="sesiones"&&<LoginGate titulo="Garda as túas sesións" descricion="Cunha conta podes gardar o historial de sesións e recuperalo en calquera dispositivo."><TabSesiones onLaunchTimer={launchTimer}/></LoginGate>}
        {tab==="guia"&&<TabGuia/>}
        {tab==="sonido"&&<TabSonido/>}
        {tab==="grupos"&&<LoginGate titulo="Xestiona os teus grupos" descricion="Crea grupos, engade membros e fai seguimento das súas estatísticas."><TabGrupos grupoActivo={grupoActivo} setGrupoActivo={setGrupo}/></LoginGate>}
        {tab==="qr"&&<TabQR/>}
        {tab==="admin"&&<TabAdmin/>}
        {tab==="ajustes"&&<TabAjustes/>}
        {tab==="manual"&&<TabManual/>}
        {tab==="universo"&&<TabUniverso/>}
        {tab==="axenda"&&<TabAxenda/>}
        </Suspense>
        </LimiteErro>
      </div>
    </main>
    <BotonReporte onde={tab}/>
    {timerAberto&&<TimerBar audio={audio} launchRef={timerLaunchRef} onClose={()=>setTimerAberto(false)} onTimerChange={(d,r,p)=>{setPubTimerDisplay(d);setPubTimerRunning(r);}} />}
  </div></LangCtx.Provider>);
}

function AuthGate(){
  const {T}=useTheme();
  const [session,setSession]=useState(undefined);
  const [perfil,setPerfil]=useState(null);
  const [showLogin,setShowLogin]=useState(false);
  const [migrando,setMigrando]=useState(false);

  useEffect(()=>{
    getSession().then(s=>setSession(s));
    const unsub=onAuthChange(s=>{setSession(s);if(!s)setPerfil(null);});
    return unsub;
  },[]);

  useEffect(()=>{
    if(!session?.user?.id){setPerfil(null);return;}
    getPerfil(session.user.id).then(async p=>{
      setPerfil(p);
      // Migrar datos locais á conta a primeira vez
      if(p&&!ls.get("impro_migrado_"+p.id,false)){
        setMigrando(true);
        await migrarDatosLocais(p.id);
        ls.set("impro_migrado_"+p.id,true);
        setMigrando(false);
      }
    });
  },[session?.user?.id]);

  const loading=session===undefined;

  if(loading)return(<div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{textAlign:"center"}}>
      <div style={{fontWeight:800,fontSize:"1.6rem",letterSpacing:"-0.03em",marginBottom:"0.5rem",color:T.text}}>impro<span style={{color:T.accent}}>App</span></div>
      <p style={{color:T.text4,fontSize:"0.85rem"}}>Cargando...</p>
    </div>
  </div>);

  const authValue={
    session,perfil,user:session?.user||null,
    logueado:!!session,
    aprobado:perfil?.aprobado||perfil?.rol==="admin",
    esAdmin:perfil?.rol==="admin",
    pedirLogin:()=>setShowLogin(true),
    migrando,
  };

  const langActual=ls.get("impro_lang","es");
  return(<AuthCtx.Provider value={authValue}>
    <EstimulosProvider lang={langActual}>
      <AppInner perfil={perfil}/>
      {showLogin&&<LoginModal onClose={()=>setShowLogin(false)}/>}
    </EstimulosProvider>
  </AuthCtx.Provider>);
}


// Migra datos de localStorage á conta ao entrar por primeira vez
async function migrarDatosLocais(userId){
  try{
    const dins=ls.get("impro_dinamicas_v2",[]).filter(d=>!d.es_base);
    for(const d of dins)await saveDinamica(d);
    const grupos=ls.get("impro_grupos",[]);
    for(const g of grupos)await saveGrupo(g);
    const sesiones=ls.get("impro_sesiones",[]);
    for(const s of sesiones)await saveSesion(s);
  }catch(e){console.warn("Migración parcial:",e);}
}

export default function ImproApp(){
  // Repinta a árbore enteira cando se cambia o estilo dos iconos.
  useEstiloIconos();

  const theme=useThemeProvider();
  // Límite de erro na raíz: aínda que falle a cabeceira ou o propio AuthGate,
  // nunca se ve unha pantalla en branco sen explicación. O límite de dentro
  // (por pestana) segue capturando primeiro os fallos de sección.
  return (
    <ThemeCtx.Provider value={theme}>
      <LimiteErro onde="raíz" T={theme.T}>
        <AuthGate/>
      </LimiteErro>
    </ThemeCtx.Provider>
  );
}
