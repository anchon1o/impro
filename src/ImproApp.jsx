// ============================================================
// ImproApp.jsx
// Punto de entrada: navegación principal, autenticación e migración.
// A maioría dos módulos viven agora en ficheiros propios (T04).
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ThemeCtx, LangCtx, AuthCtx, useAuth, useLang, useTheme, useThemeProvider,
  EstimulosProvider, useEstimulos, TAB_LABELS, ls, mkS, TimerBar, useAudio,
  FONT_UI, FONT_MONO, TYPE, useViewport,
} from './core.jsx';
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
import { TabShow } from './tabs/TabShow.jsx';
import { TabGrupos } from './tabs/TabGrupos.jsx';
import { TabQR } from './tabs/TabQR.jsx';
import { TabAdmin } from './tabs/TabAdmin.jsx';
import { TabAjustes } from './tabs/TabAjustes.jsx';
import { TabManual } from './tabs/TabManual.jsx';
import { TabUniverso } from './tabs/TabUniverso.jsx';
import { PantallaPublica } from './PantallaPublica.jsx';
import { ModoShow } from './ModoShow.jsx';
import { LoginModal } from './auth/LoginModal.jsx';
import { LoginGate } from './auth/LoginGate.jsx';

const TABS=[
  {id:"generar",label:"Generar",emoji:"✦"},
  {id:"reto",label:"Reto",emoji:"⚡"},
  {id:"sesiones",label:"Sesiones",emoji:"📋"},
  {id:"guia",label:"Guía",emoji:"📖"},
  {id:"show",label:"Show",emoji:"🎭"},
  {id:"grupos",label:"Grupos",emoji:"👥"},
  {id:"qr",label:"QR",emoji:"📱"},
  {id:"admin",label:"Admin",emoji:"🔐"},
  {id:"ajustes",label:"Ajustes",emoji:"⚙️"},
  {id:"manual",label:"Manual",emoji:"📘"},
  {id:"universo",label:"Universo",emoji:"🌍"},
];

function AppInner({perfil,publico}={}){
  const {dark,toggle,T}=useTheme();
  const {logueado,pedirLogin,esAdmin,migrando}=useAuth();
  const {esMovil,esTablet}=useViewport();
  const [tab,setTab]=useState("generar");
  const [animating,setAnimating]=useState(false);
  const [pubStimulus,setPubStimulus]=useState(null);
  const [pubOpen,setPubOpen]=useState(false);
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
  const launchTimer=useCallback((mins)=>{if(timerLaunchRef.current)timerLaunchRef.current(mins*60);},[]);
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
    <header style={{borderBottom:`1px solid ${T.navBorder}`,padding:"0.8rem 1rem 0",background:T.nav,position:"sticky",top:0,zIndex:100,transition:"background 0.3s,border-color 0.3s"}}>
      <div style={{maxWidth:960,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.55rem",gap:"0.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.45rem"}}>
            <span style={{fontSize:"1.15rem"}}>🎭</span>
            <span style={{fontWeight:800,fontSize:esMovil?"0.98rem":"1.08rem",letterSpacing:"-0.03em"}}>impro<span style={{color:T.accent}}>App</span></span>
            <span style={{background:T.accent+"22",color:T.accent,borderRadius:4,padding:"0.06rem 0.38rem",fontSize:"0.62rem",fontWeight:700}}>v8</span>
          </div>
          <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
            <div style={{display:"flex",background:T.bg3,borderRadius:20,padding:2,gap:1}}>
              {["es","gl","en"].map(l=><button key={l} onClick={()=>setLang(l)} style={{background:lang===l?T.accent:"transparent",color:lang===l?"#fff":T.text3,border:"none",borderRadius:18,padding:esMovil?"0.28rem 0.45rem":"0.24rem 0.55rem",cursor:"pointer",fontSize:"0.72rem",fontWeight:lang===l?700:400,fontFamily:"inherit",transition:"all 0.2s"}}>{l.toUpperCase()}</button>)}
            </div>
            <button onClick={toggle} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:20,padding:"0.3rem 0.65rem",cursor:"pointer",fontSize:"0.82rem",color:T.text2,transition:"all 0.3s",fontFamily:"inherit"}}>{dark?"☀️":"🌙"}</button>
            <button onClick={()=>setModoShow(true)} title="Modo show" style={{background:"#40c4ff",border:"none",borderRadius:8,padding:"0.35rem 0.7rem",cursor:"pointer",fontSize:"0.75rem",color:"#000",fontWeight:700,fontFamily:"inherit"}}>🎬</button>
            <button onClick={()=>setPubOpen(p=>!p)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,padding:"0.35rem 0.7rem",cursor:"pointer",fontSize:"0.75rem",color:T.text3}}>📺</button>
            {logueado?<button onClick={()=>{if(confirm("Pechar sesión?"))signOut();}} title={perfil?.email} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,padding:"0.35rem 0.6rem",cursor:"pointer",fontSize:"0.75rem",color:T.text3}}>⏻</button>:<button onClick={pedirLogin} style={{background:T.accent,border:"none",borderRadius:8,padding:"0.35rem 0.75rem",cursor:"pointer",fontSize:"0.75rem",color:"#fff",fontWeight:700,fontFamily:"inherit"}}>Entrar</button>}
          </div>
        </div>
        <nav style={{display:"flex",gap:0,overflowX:"auto",scrollbarWidth:"none"}}>
          {TABS.filter(t=>t.id!=="admin"||esAdmin).map(t=>(<button key={t.id} onClick={()=>changeTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:tab===t.id?T.text:T.text3,padding:esMovil?"0.55rem 0.7rem":"0.45rem 0.8rem",fontSize:esMovil?"0.78rem":"0.82rem",fontWeight:tab===t.id?700:400,borderBottom:tab===t.id?`2px solid ${T.accent}`:"2px solid transparent",transition:"all 0.2s",display:"flex",alignItems:"center",gap:"0.3rem",whiteSpace:"nowrap",flexShrink:0,fontFamily:"inherit"}}>
            <span>{t.emoji}</span><span>{TAB_LABELS[lang]?.[t.id]||t.label}</span>
          </button>))}
        </nav>
      </div>
    </header>
    {!supabaseConfigured&&<div style={{background:"#ff6e4022",borderBottom:"1px solid #ff6e4055",padding:"0.55rem 1rem",textAlign:"center"}}>
      <span style={{color:"#ff6e40",fontSize:"0.82rem",fontWeight:700}}>⚠️ Sen conexión a Supabase — faltan as credenciais (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Login e datos en tempo real non funcionarán.</span>
    </div>}
    {migrando&&<div style={{background:"#69f0ae15",borderBottom:"1px solid #69f0ae33",padding:"0.5rem 1rem",textAlign:"center"}}>
      <span style={{color:"#69f0ae",fontSize:"0.82rem"}}>↻ Sincronizando os teus datos coa conta...</span>
    </div>}
    <main style={{maxWidth:1100,margin:"0 auto",padding:esMovil?"0.9rem 0.75rem 6.5rem":"1.4rem 1.25rem 6rem"}}>
      <div className="tab-content" key={tab}>
        {tab==="generar"&&<TabGenerar onStimulus={s=>setPubStimulus(s)}/>}
        {tab==="reto"&&<TabReto/>}
        {tab==="sesiones"&&<LoginGate titulo="Garda as túas sesións" descricion="Cunha conta podes gardar o historial de sesións e recuperalo en calquera dispositivo."><TabSesiones onLaunchTimer={launchTimer}/></LoginGate>}
        {tab==="guia"&&<TabGuia/>}
        {tab==="show"&&<TabShow audio={audio} onRundownChange={setPubRundown}/>}
        {tab==="grupos"&&<LoginGate titulo="Xestiona os teus grupos" descricion="Crea grupos, engade membros e fai seguimento das súas estatísticas."><TabGrupos grupoActivo={grupoActivo} setGrupoActivo={setGrupo}/></LoginGate>}
        {tab==="qr"&&<TabQR/>}
        {tab==="admin"&&<TabAdmin/>}
        {tab==="ajustes"&&<TabAjustes/>}
        {tab==="manual"&&<TabManual/>}
        {tab==="universo"&&<TabUniverso/>}
      </div>
    </main>
    <TimerBar audio={audio} launchRef={timerLaunchRef} onTimerChange={(d,r,p)=>{setPubTimerDisplay(d);setPubTimerRunning(r);}} />
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
      <div style={{fontSize:"2.5rem",marginBottom:"0.5rem"}}>🎭</div>
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
  const theme=useThemeProvider();
  return <ThemeCtx.Provider value={theme}><AuthGate/></ThemeCtx.Provider>;
}
