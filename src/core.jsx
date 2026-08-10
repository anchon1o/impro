// ============================================================
// core.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { cargarEstimulos, cargarCategorias } from './estimulos.js';

export const TIPO_COLOR = {calentamiento:"#ffd740",entrenamiento:"#40c4ff",juego:"#69f0ae",formato:"#e040fb",musical:"#ff80ab",pausa:"#78909c",cierre:"#ff6e40"};

export const ThemeCtx = createContext(null);

export const LangCtx = createContext(null);

export const AuthCtx = createContext(null);

export const useAuth = () => useContext(AuthCtx) || {};

export const useLang = () => useContext(LangCtx);

export const UI_STRINGS = {
  es:{generar:"Generar",reto:"Reto",sesiones:"Sesiones",guia:"Guía",show:"Show",grupos:"Grupos",qr:"QR",ajustes:"Ajustes",manual:"Manual",admin:"Admin",universo:"Universo"},
  gl:{generar:"Xerar",reto:"Reto",sesiones:"Sesións",guia:"Guía",show:"Show",grupos:"Grupos",qr:"QR",ajustes:"Axustes",manual:"Manual",admin:"Admin",universo:"Universo"},
  en:{generar:"Generate",reto:"Challenge",sesiones:"Sessions",guia:"Guide",show:"Show",grupos:"Groups",qr:"QR",ajustes:"Settings",manual:"Manual",admin:"Admin",universo:"Universe"},
};

export const t = (lang, key) => UI_STRINGS[lang]?.[key] || UI_STRINGS.es[key] || key;

export const TAB_LABELS = UI_STRINGS;

export const GrupoCtx = createContext(null);

export const useGrupo = () => useContext(GrupoCtx);

export const useTheme = () => useContext(ThemeCtx);

export function useThemeProvider() {
  const [dark, setDark] = useState(() => localStorage.getItem("impro_theme") !== "light");
  const toggle = () => setDark(d => { localStorage.setItem("impro_theme", d?"light":"dark"); return !d; });
  const T = dark ? {
    bg:"#0d0d0d",bg2:"#161616",bg3:"#1e1e1e",bg4:"#252525",
    border:"#252525",border2:"#2a2a2a",
    text:"#fff",text2:"#aaa",text3:"#666",text4:"#444",
    accent:"#e040fb",nav:"#0d0d0d",navBorder:"#1a1a1a",
    input:"#0d0d0d",inputBorder:"#2a2a2a",
  } : {
    bg:"#f0f0f4",bg2:"#fff",bg3:"#f5f5f8",bg4:"#e8e8ec",
    border:"#ddd",border2:"#ccc",
    text:"#111",text2:"#444",text3:"#777",text4:"#999",
    accent:"#9c27b0",nav:"#fff",navBorder:"#e0e0e0",
    input:"#fff",inputBorder:"#ccc",
  };
  return { dark, toggle, T };
}

export const FALLBACK_ESTIMULOS = {
  "PROFESIÓN":{simple:["Domador de urracas","Sexador de pollos","Jardinero de planetas","Reparador de sueños","Cazador de arcoíris"],plus:[]},
  "OBJETO":{simple:["Caleidoscopio estelar","Paraguas de funeral","Reloj sin agujas","Llave oxidada"],plus:[]},
  "LUGAR":{simple:["Faro abandonado","Estación de tren nocturna","Invernadero tropical"],plus:[]},
  "EMOCIÓN":{simple:["Nostalgia","Euforia contenida","Vergüenza ajena"],plus:[]},
  "ACCIÓN":{simple:["Buscar algo perdido","Despedirse sin decirlo","Confesar a destiempo"],plus:[]},
  "NOMBRE":{simple:["Remedios","Casimiro","Nicanor"],plus:[]},
  "SUPERPODER":{simple:["Hablar con las plantas","Detener el tiempo un segundo"],plus:[]},
  "ESTILO":{simple:["Cine mudo","Telenovela","Documental de naturaleza"],plus:[]},
  "DUDA":{simple:["¿Y si nadie me escucha?","¿Elegí bien?"],plus:[]},
  "CONFESIÓN":{simple:["Nunca leí ese libro","Fui yo"],plus:[]},
  "FRASE":{simple:["No era mi intención","Ya no queda tiempo"],plus:[]},
};

export const EstimulosCtx = createContext(null);

export const useEstimulos = () => useContext(EstimulosCtx) || { data: FALLBACK_ESTIMULOS, cats: [], cargando: false, recargar: () => {} };

export function EstimulosProvider({ lang, children }) {
  const [data, setData] = useState(() => {
    try { const v = localStorage.getItem('impro_estimulos_cache'); return v ? JSON.parse(v) : FALLBACK_ESTIMULOS; }
    catch { return FALLBACK_ESTIMULOS; }
  });
  const [cats, setCats] = useState([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async (forzar = false) => {
    setCargando(true);
    const [e, c] = await Promise.all([
      cargarEstimulos(lang, { forzar }),
      cargarCategorias(lang),
    ]);
    if (e && Object.keys(e).length) setData(e);
    if (c?.length) setCats(c);
    setCargando(false);
  }, [lang]);

  useEffect(() => { recargar(false); }, [recargar]);

  return <EstimulosCtx.Provider value={{ data, cats, cargando, recargar }}>{children}</EstimulosCtx.Provider>;
}

export const CAT_ICONS = {PROFESIÓN:"👤",OBJETO:"✦",LUGAR:"📍",EMOCIÓN:"💜",ACCIÓN:"🎭",NOMBRE:"📛",SUPERPODER:"⚡",ESTILO:"🎬",DUDA:"❓",CONFESIÓN:"🤫",FRASE:"💬"};

export const CATS_FALLBACK = Object.keys(FALLBACK_ESTIMULOS);

export const UID = () => Math.random().toString(36).slice(2,10);

export const FMT = s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

export const pick = arr => arr[Math.floor(Math.random()*arr.length)];

export const ls = {
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
};

export const trackGen = (cat) => {
  const s = ls.get("impro_stats", {cats:{}, total:0, mins:0});
  s.cats[cat] = (s.cats[cat]||0) + 1;
  s.total = (s.total||0) + 1;
  ls.set("impro_stats", s);
  const ga = ls.get("impro_grupo_activo", null);
  if(ga?.id){
    const gs = ls.get("impro_stats_grupos", {});
    gs[ga.id] = gs[ga.id] || {cats:{}};
    gs[ga.id].cats[cat] = (gs[ga.id].cats[cat]||0) + 1;
    ls.set("impro_stats_grupos", gs);
  }
};

export const trackDin = (nombre) => {
  const s = ls.get("impro_stats", {cats:{}, dins:{}, total:0, mins:0});
  s.dins = s.dins || {};
  s.dins[nombre] = (s.dins[nombre]||0) + 1;
  ls.set("impro_stats", s);
};

export const trackMins = (m) => {
  const s = ls.get("impro_stats", {cats:{}, total:0, mins:0});
  s.mins = (s.mins||0) + m;
  ls.set("impro_stats", s);
};

export const mkS = (T) => ({
  panel:{background:T.bg2,border:`1.5px solid ${T.border}`,borderRadius:14,padding:"1.25rem"},
  btn:(bg,color="#fff")=>({background:bg,color,border:"none",borderRadius:9,padding:"0.5rem 1rem",fontWeight:700,cursor:"pointer",fontSize:"0.85rem",transition:"all 0.15s",whiteSpace:"nowrap",fontFamily:"inherit"}),
  input:{background:T.input,border:`1.5px solid ${T.inputBorder}`,borderRadius:8,color:T.text,padding:"0.48rem 0.75rem",fontSize:"0.88rem",fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"},
  ptitle:(c)=>({color:c,fontSize:"0.72rem",letterSpacing:"0.15em",margin:"0 0 0.9rem",fontFamily:"monospace",fontWeight:700,textTransform:"uppercase"}),
  tag:(c)=>({background:c+"22",color:c,borderRadius:5,padding:"0.1rem 0.45rem",fontSize:"0.72rem",fontWeight:700}),
});

export function useAudio() {
  const ctxRef=useRef(null);
  const getCtx=()=>{if(!ctxRef.current)ctxRef.current=new(window.AudioContext||window.webkitAudioContext)();if(ctxRef.current.state==="suspended")ctxRef.current.resume();return ctxRef.current;};
  const tone=useCallback((f,d=0.3,t="sine",v=0.4,t0=0)=>{try{const ctx=getCtx(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type=t;o.frequency.setValueAtTime(f,ctx.currentTime+t0);g.gain.setValueAtTime(v,ctx.currentTime+t0);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+t0+d);o.start(ctx.currentTime+t0);o.stop(ctx.currentTime+t0+d);}catch(e){}});
  const playBell=useCallback(()=>{tone(880,2,"sine",0.4);tone(1760,1.2,"sine",0.15);});
  const metroBeat=useCallback((bc,beats)=>{try{const ctx=getCtx(),isOne=bc%beats===0,f=isOne?1000:440,o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=f;const now=ctx.currentTime;g.gain.setValueAtTime(isOne?0.7:0.4,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.06);o.start(now);o.stop(now+0.1);}catch(e){}});
  return{tone,playBell,metroBeat};
}

export function TimerBar({audio,launchRef,onTimerChange}){
  const {T}=useTheme();
  const [display,setDisplay]=useState(300);
  const [preset,setPreset]=useState(300);
  const [running,setRunning]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const ref=useRef(null);
  const urgent=display>0&&display<10,warning=display>0&&display<30;
  useEffect(()=>{
    if(running){ref.current=setInterval(()=>{setDisplay(p=>{if(p<=1){setRunning(false);audio.playBell();return 0;}return p-1;});},1000);}
    else clearInterval(ref.current);
    return()=>clearInterval(ref.current);
  },[running]);
  useEffect(()=>{if(launchRef)launchRef.current=(secs)=>{setPreset(secs);setDisplay(secs);setRunning(true);setExpanded(false);};},[launchRef]);
  useEffect(()=>{if(onTimerChange)onTimerChange(display,running,preset);},[display,running,preset]);
  const PRESETS=[30,60,120,180,300,600];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:T.nav,borderTop:`1px solid ${T.navBorder}`,transition:"all 0.3s"}}>
      {expanded&&(
        <div style={{padding:"0.55rem 1rem",display:"flex",gap:"0.4rem",justifyContent:"center",flexWrap:"wrap",borderBottom:`1px solid ${T.border}`}}>
          {PRESETS.map(t=><button key={t} onClick={()=>{setPreset(t);setDisplay(t);setRunning(false);}} style={{background:preset===t?T.accent+"22":T.bg3,border:`1px solid ${preset===t?T.accent:T.border}`,color:preset===t?T.accent:T.text3,borderRadius:7,padding:"0.22rem 0.55rem",fontSize:"0.76rem",cursor:"pointer",fontFamily:"inherit"}}>{FMT(t)}</button>)}
          <button onClick={()=>{setRunning(false);setDisplay(preset);}} style={{background:T.bg3,border:`1px solid ${T.border}`,color:T.text3,borderRadius:7,padding:"0.22rem 0.55rem",fontSize:"0.76rem",cursor:"pointer"}}>↺</button>
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.5rem 1rem",maxWidth:960,margin:"0 auto"}}>
        <button onClick={()=>setExpanded(!expanded)} style={{background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:"0.8rem",padding:"0.2rem",flexShrink:0}}>⏱</button>
        <div onClick={()=>setExpanded(!expanded)} style={{fontFamily:"monospace",fontWeight:900,fontSize:"clamp(1rem,4vw,1.4rem)",color:urgent?"#ff6e40":warning?"#ffd740":T.text,textShadow:urgent?"0 0 20px #ff6e4066":"none",minWidth:70,cursor:"pointer",animation:urgent?"urgentPulse 0.5s ease infinite alternate":"none"}}>{FMT(display)}</div>
        <button onClick={()=>setRunning(!running)} style={{background:running?"#ff6e40":"#69f0ae",color:"#000",border:"none",borderRadius:7,padding:"0.35rem 0.85rem",fontWeight:700,cursor:"pointer",fontSize:"0.82rem",flexShrink:0}}>{running?"⏸":"▶"}</button>
        <div style={{flex:1,height:4,background:T.bg4,borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${preset>0?(display/preset)*100:0}%`,background:urgent?"#ff6e40":warning?"#ffd740":T.accent,borderRadius:2,transition:"width 1s linear"}}/>
        </div>
      </div>
    </div>
  );
}

export function Spotlight({word,category,onClose}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"radial-gradient(ellipse at center,rgba(224,64,251,0.18) 0%,rgba(0,0,0,0.97) 70%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",animation:"fadeIn 0.3s ease"}}>
      <p style={{color:"#e040fb",fontFamily:"monospace",fontSize:"0.9rem",letterSpacing:"0.3em",marginBottom:"1.5rem",textTransform:"uppercase"}}>{category}</p>
      <h1 style={{fontSize:"clamp(2.5rem,9vw,7rem)",fontWeight:900,color:"#fff",textShadow:"0 0 60px rgba(224,64,251,0.6)",lineHeight:1.1,maxWidth:"80vw",textAlign:"center",animation:"spotlightIn 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}>{word}</h1>
      <p style={{color:"#555",marginTop:"3rem",fontSize:"0.82rem"}}>Toca para cerrar</p>
    </div>
  );
}

export function QRCode({value,size=180}){
  const {T}=useTheme();
  const bg=T.bg2.replace("#",""),fg=T.text.replace("#","");
  return <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=${bg}&color=${fg}&margin=2`} alt="QR" width={size} height={size} style={{borderRadius:8,display:"block"}}/>;
}
