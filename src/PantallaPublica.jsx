// ============================================================
// PantallaPublica.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { FMT, FONT_UI, FONT_MONO } from './core.jsx';

export function PantallaPublica({stimulus,timerDisplay,timerRunning,rundown,onClose}){
  const [td,setTd]=useState(timerDisplay||0);
  const [notif,setNotif]=useState(null);
  const [prevActive,setPrevActive]=useState(null);
  const [showTimer,setShowTimer]=useState(true);
  const ref=useRef(null);
  useEffect(()=>setTd(timerDisplay||0),[timerDisplay]);
  useEffect(()=>{if(timerRunning){ref.current=setInterval(()=>setTd(p=>Math.max(0,p-1)),1000);}else clearInterval(ref.current);return()=>clearInterval(ref.current);},[timerRunning]);

  useEffect(()=>{
    if(!timerRunning)return;
    if(td===30)showNotif("⏱ 30 segundos","#ffd740");
    else if(td===10)showNotif("⚠️ 10 segundos","#ff6e40");
    else if(td===0&&timerDisplay>0)showNotif("⏹ Tiempo agotado","#ff6e40");
  },[td,timerRunning]);

  const activeAct=rundown?.find(a=>a.activa);
  useEffect(()=>{
    if(activeAct?.id!==prevActive){
      if(activeAct)showNotif(`▶ ${activeAct.nombre}`,"#e040fb");
      setPrevActive(activeAct?.id||null);
    }
  },[activeAct?.id]);

  const showNotif=(msg,col)=>{
    setNotif({msg,col,id:Date.now()});
    setTimeout(()=>setNotif(null),3500);
  };

  const urgent=td>0&&td<10,warning=td>0&&td<30;
  const timerColor=urgent?"#ff6e40":warning?"#ffd740":"#e040fb";

  return(<div style={{position:"fixed",inset:0,zIndex:2000,background:"#050505",display:"flex",flexDirection:"column",fontFamily:FONT_UI}}>
    <button onClick={onClose} style={{position:"absolute",top:12,right:16,background:"#1a1a1a",border:"1px solid #333",color:"#555",borderRadius:8,padding:"0.3rem 0.7rem",cursor:"pointer",fontSize:"0.75rem",zIndex:10}}>✕ Cerrar</button>

    {/* Notificación flotante */}
    {notif&&<div key={notif.id} style={{position:"absolute",top:60,left:"50%",transform:"translateX(-50%)",background:notif.col+"22",border:`1.5px solid ${notif.col}`,borderRadius:12,padding:"0.65rem 1.5rem",zIndex:20,animation:"pubIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",backdropFilter:"blur(12px)",whiteSpace:"nowrap"}}>
      <span style={{color:notif.col,fontWeight:700,fontSize:"0.95rem"}}>{notif.msg}</span>
    </div>}

    {/* Área principal: estímulo */}
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",gap:"1.5rem"}}>
      {stimulus?(
        <>
          <p style={{color:"#e040fb",fontFamily:FONT_MONO,fontVariantNumeric:"tabular-nums",fontSize:"clamp(0.8rem,2vw,1rem)",letterSpacing:"0.3em",margin:0,textTransform:"uppercase",opacity:0.8}}>{stimulus.category}</p>
          <h1 style={{fontSize:"clamp(3rem,10vw,8rem)",fontWeight:900,color:"#fff",textShadow:"0 0 80px rgba(224,64,251,0.5)",lineHeight:1.05,maxWidth:"85vw",textAlign:"center",margin:0,animation:"pubIn 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}>{stimulus.word}</h1>
        </>
      ):(
        <div style={{textAlign:"center"}}>
          <p style={{fontSize:"5rem",margin:"0 0 1rem"}}>🎭</p>
          <p style={{color:"#333",fontSize:"1.2rem",fontWeight:700}}>improApp</p>
          <p style={{color:"#222",fontSize:"0.85rem"}}>Pantalla de proxección</p>
        </div>
      )}
    </div>

    {/* Barra inferior */}
    <div style={{background:"#0a0a0a",borderTop:"1px solid #1a1a1a",padding:"0.85rem 1.5rem",display:"flex",alignItems:"center",gap:"1.5rem",flexWrap:"wrap"}}>

      {/* Timer */}
      <div style={{display:"flex",alignItems:"center",gap:"0.85rem",cursor:"pointer"}} onClick={()=>setShowTimer(!showTimer)}>
        {showTimer&&<div style={{fontFamily:FONT_MONO,fontVariantNumeric:"tabular-nums",fontWeight:900,fontSize:"clamp(1.8rem,5vw,3rem)",color:timerColor,textShadow:urgent?`0 0 30px ${timerColor}`:"none",animation:urgent?"urgentPulse 0.5s ease infinite alternate":"none",lineHeight:1,minWidth:"4ch"}}>{FMT(td)}</div>}
        {timerRunning&&<div style={{width:8,height:8,borderRadius:"50%",background:timerColor,boxShadow:`0 0 12px ${timerColor}`,animation:"urgentPulse 1s ease infinite alternate"}}/>}
      </div>

      {/* Actuación activa */}
      {activeAct&&<div style={{flex:1}}>
        <p style={{color:"#555",fontSize:"0.65rem",letterSpacing:"0.15em",margin:"0 0 0.15rem",fontFamily:FONT_MONO,fontVariantNumeric:"tabular-nums"}}>EN ESCENA</p>
        <p style={{color:"#40c4ff",fontWeight:900,fontSize:"clamp(0.9rem,2.5vw,1.3rem)",margin:0}}>{activeAct.nombre}{activeAct.formato&&<span style={{color:"#40c4ff88",fontWeight:400,fontSize:"0.8em",marginLeft:"0.5rem"}}>{activeAct.formato}</span>}</p>
      </div>}

      {/* Rundown mini */}
      {rundown&&rundown.length>0&&<div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",maxWidth:"40vw"}}>
        {rundown.map((act,i)=><div key={act.id} style={{background:act.activa?"#40c4ff22":act.hecho?"#1a1a1a":"#111",border:`1px solid ${act.activa?"#40c4ff":act.hecho?"#222":"#1a1a1a"}`,borderRadius:6,padding:"0.2rem 0.55rem",fontSize:"0.7rem",color:act.activa?"#40c4ff":act.hecho?"#333":"#444",textDecoration:act.hecho?"line-through":"none",transition:"all 0.3s"}}>{i+1}. {act.nombre.slice(0,12)}{act.nombre.length>12?"...":""}</div>)}
      </div>}
    </div>
  </div>);
}
