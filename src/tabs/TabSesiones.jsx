// ============================================================
// tabs/TabSesiones.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { t, useTheme, UID, FMT, ls, mkS, colorTipo } from '../core.jsx';
import { POMO_PRESETS, PLANTILLAS } from '../datos.js';
import { getSesiones, saveSesion, trackMinsSupa } from '../db.js';

export const BTOK={trabajo:"accent",descanso:"ok",longo:"info",trabalho:"accent"};
export const bcol=(T,k)=>T[BTOK[k]]||T.accent;

export function ModoPomodoroImpro({onClose,audio}){
  const {T}=useTheme();const S=mkS(T);
  const [pi,setPi]=useState(0);
  const [bloques,setBloques]=useState(POMO_PRESETS[0].bloques.map((b,i)=>({...b,id:i})));
  const [ci,setCi]=useState(0);
  const [display,setDisplay]=useState(POMO_PRESETS[0].bloques[0].m*60);
  const [running,setRunning]=useState(false);
  const [done,setDone]=useState(false);
  const ref=useRef(null);
  const cb=bloques[ci];
  const col=bcol(T,cb?.t)||T.accent;
  const urgent=display>0&&display<10,warning=display>0&&display<30;

  useEffect(()=>{
    if(running){ref.current=setInterval(()=>setDisplay(p=>{
      if(p<=1){clearInterval(ref.current);setRunning(false);audio.playBell();
        setCi(c=>{const n=c+1;if(n>=bloques.length){setDone(true);return c;}setDisplay(bloques[n].m*60);return n;});return 0;}
      return p-1;}),1000);}
    else clearInterval(ref.current);
    return()=>clearInterval(ref.current);
  },[running,bloques]);

  const reset=()=>{setRunning(false);setCi(0);setDisplay(bloques[0]?.m*60||0);setDone(false);};
  const skip=()=>{setRunning(false);const n=ci+1;if(n>=bloques.length){setDone(true);return;}setCi(n);setDisplay(bloques[n].m*60);};
  const loadPreset=i=>{setPi(i);setRunning(false);setDone(false);setCi(0);const bs=POMO_PRESETS[i].bloques.map((b,j)=>({...b,id:j}));setBloques(bs);setDisplay(bs[0]?.m*60||0);};
  const total=bloques.reduce((a,b)=>a+b.m,0);
  const pct=cb?((cb.m*60-display)/(cb.m*60))*100:0;

  return(<div style={{position:"fixed",inset:0,zIndex:1500,background:T.bg,display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.65rem 1rem",borderBottom:`1px solid ${T.border}`,background:T.nav,flexShrink:0}}>
      <span style={{color:col,fontWeight:900,fontSize:"0.9rem"}}>🍅 Modo ensayo</span>
      <button onClick={onClose} style={{...S.btn(T.bg3,T.text3),fontSize:"0.78rem"}}>✕ Salir</button>
    </div>
    <div style={{display:"flex",gap:"0.4rem",padding:"0.6rem 1rem",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
      {POMO_PRESETS.map((p,i)=><button key={i} onClick={()=>loadPreset(i)} style={{...S.btn(pi===i?T.accent:T.bg3,pi===i?"#fff":T.text2),flex:1,fontSize:"0.8rem"}}>{p.label}</button>)}
    </div>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"1.5rem",gap:"1.25rem"}}>
      {done?(<div style={{textAlign:"center"}}><p style={{fontSize:"3rem",margin:"0 0 0.75rem"}}>🎉</p><h2 style={{color:T.text,fontWeight:900,margin:"0 0 0.5rem"}}>Completado</h2><p style={{color:T.text3,margin:"0 0 1.5rem"}}>{total}min</p><button onClick={reset} style={{...S.btn(col),padding:"0.65rem 2rem"}}>↺</button></div>):(<>
        <div style={{textAlign:"center"}}>
          <div style={{...S.tag(col),fontSize:"0.78rem",display:"inline-block",marginBottom:"0.5rem",padding:"0.2rem 0.65rem"}}>{cb?.t?.toUpperCase()}</div>
          <p style={{color:T.text,fontWeight:900,fontSize:"clamp(1.1rem,4vw,1.8rem)",margin:"0 0 0.2rem"}}>{cb?.n}</p>
          <p style={{color:T.text3,fontSize:"0.78rem",margin:0}}>Bloque {ci+1}/{bloques.length} · {total}min total</p>
        </div>
        <div style={{fontSize:"clamp(4rem,16vw,9rem)",fontWeight:900,fontFamily:"monospace",color:urgent?T.danger:warning?T.warn:col,lineHeight:1,animation:urgent?"urgentPulse 0.5s ease infinite alternate":"none",transition:"color 0.3s",cursor:"pointer"}} onClick={()=>setRunning(!running)}>{FMT(display)}</div>
        <div style={{width:"100%",maxWidth:400,height:5,background:T.bg3,borderRadius:3}}><div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:3,transition:"width 1s linear"}}/></div>
        <div style={{display:"flex",gap:"0.6rem"}}>
          <button onClick={()=>setRunning(!running)} style={{...S.btn(running?T.danger:col,"#000"),padding:"0.6rem 1.5rem",fontSize:"0.95rem"}}>{running?"⏸ Pausa":"▶ Iniciar"}</button>
          <button onClick={skip} style={S.btn(T.bg3,T.text2)}>⏭</button>
          <button onClick={reset} style={S.btn(T.bg3,T.text2)}>↺</button>
        </div>
        <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap",justifyContent:"center",maxWidth:450}}>
          {bloques.map((b,i)=>(<div key={b.id} style={{padding:"0.2rem 0.5rem",borderRadius:7,background:i===ci?col+"33":i<ci?T.bg3:T.bg2,border:`1px solid ${i===ci?col:T.border}`,opacity:i<ci?0.4:1,transition:"all 0.2s"}}>
            <span style={{color:i===ci?col:i<ci?T.text4:T.text2,fontSize:"0.7rem",fontWeight:i===ci?700:400}}>{b.n} {b.m}m</span>
          </div>))}
        </div>
      </>)}
    </div>
  </div>);
}

export function TabSesiones({onLaunchTimer}){
  const {T}=useTheme();const S=mkS(T);
  if(!onLaunchTimer)onLaunchTimer=()=>{};
  const [view,setView]=useState("plantillas");
  const [sesion,setSesion]=useState(null);
  const [editMode,setEditMode]=useState(false);
  const [showPomodoro,setShowPomodoro]=useState(false);
  const [historial,setHistorial]=useState(()=>ls.get("impro_sesiones",[]));
  const [notas,setNotas]=useState("");
  useEffect(()=>{getSesiones().then(setHistorial);},[]);
  const load=p=>{setSesion({id:UID(),nombre:p.nombre,bloques:p.bloques.map((b,i)=>({...b,id:i,completado:false}))});setView("sesion");};
  const toggle=id=>setSesion(s=>({...s,bloques:s.bloques.map(b=>b.id===id?{...b,completado:!b.completado}:b)}));
  const upd=(id,f,v)=>setSesion(s=>({...s,bloques:s.bloques.map(b=>b.id===id?{...b,[f]:v}:b)}));
  const del=id=>setSesion(s=>({...s,bloques:s.bloques.filter(b=>b.id!==id)}));
  const add=()=>sesion&&setSesion(s=>({...s,bloques:[...s.bloques,{id:Date.now(),tipo:"entrenamiento",titulo:"Nuevo bloque",duracion:15,notas:"",completado:false}]}));
  const total=sesion?.bloques.reduce((a,b)=>a+(parseInt(b.duracion)||0),0)||0;
  const done=sesion?.bloques.filter(b=>b.completado).length||0;
  const guardar=async()=>{
    trackMinsSupa(total);
    const entry={id:UID(),nombre:sesion.nombre,fecha:new Date().toLocaleDateString("es-ES"),minutos:total,completados:done,notas,bloques:sesion.bloques};
    await saveSesion(entry);
    setHistorial(h=>[entry,...h].slice(0,30));
    setSesion(null);setNotas("");setView("historial");
  };

  if(showPomodoro)return(<ModoPomodoroImpro onClose={()=>setShowPomodoro(false)} audio={{playBell:()=>{try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=880;g.gain.setValueAtTime(0.5,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+1.5);o.start();o.stop(ctx.currentTime+1.5);}catch(e){}}}}/>);
  if(view==="historial")return(<div>
    <div style={{display:"flex",gap:"0.6rem",marginBottom:"1rem"}}><button onClick={()=>setView("plantillas")} style={S.btn(T.bg3,T.text2)}>← Plantillas</button><span style={{fontWeight:700,color:T.text}}>Historial</span></div>
    {historial.length===0&&<p style={{color:T.text4}}>Sin sesiones guardadas.</p>}
    {historial.map(h=>(<div key={h.id} style={{...S.panel,marginBottom:"0.6rem"}}><div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"0.3rem",marginBottom:"0.4rem"}}><span style={{fontWeight:700,color:T.text}}>{h.nombre}</span><span style={{color:T.text3,fontSize:"0.78rem"}}>{h.fecha}</span></div><div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}><span style={S.tag(T.warn)}>{h.minutos}min</span><span style={S.tag(T.ok)}>{h.completados}/{h.bloques?.length} bloques</span></div>{h.notas&&<p style={{color:T.text3,fontSize:"0.8rem",margin:"0.4rem 0 0"}}>{h.notas}</p>}</div>))}
  </div>);

  if(view==="sesion"&&sesion)return(<div>
    <div style={{display:"flex",gap:"0.6rem",marginBottom:"1rem",flexWrap:"wrap",alignItems:"center"}}>
      <button onClick={()=>{setSesion(null);setView("plantillas");}} style={S.btn(T.bg3,T.text2)}>←</button>
      <span style={{fontWeight:700,flex:1,color:T.text}}>{sesion.nombre}</span>
      <button onClick={()=>setEditMode(!editMode)} style={S.btn(editMode?T.warn:T.bg3,editMode?"#000":T.text2)}>{editMode?"✓":"✏️"}</button>
      <button onClick={guardar} style={S.btn(T.ok,"#000")}>💾</button>
    </div>
    <div style={{display:"flex",gap:"0.6rem",marginBottom:"1rem",flexWrap:"wrap",alignItems:"center"}}>
      <div style={{...S.panel,padding:"0.45rem 0.85rem",fontSize:"0.82rem"}}><span style={{color:T.text3}}>Total </span><span style={{color:T.warn,fontWeight:700}}>{total}min</span></div>
      <div style={{...S.panel,padding:"0.45rem 0.85rem",fontSize:"0.82rem"}}><span style={{color:T.text3}}>Hechos </span><span style={{color:T.ok,fontWeight:700}}>{done}/{sesion.bloques.length}</span></div>
      {sesion.bloques.length>0&&<div style={{...S.panel,padding:"0.55rem 0.85rem",flex:1,minWidth:80}}><div style={{height:4,background:T.bg4,borderRadius:2}}><div style={{height:"100%",width:`${(done/sesion.bloques.length)*100}%`,background:T.ok,borderRadius:2,transition:"width 0.3s"}}/></div></div>}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",marginBottom:"1rem"}}>
      {sesion.bloques.map(b=>(
        <div key={b.id} style={{
          background:b.completado?T.bg3:T.bg2,
          border:`1.5px solid ${T.border}`,
          borderLeft:`4px solid ${colorTipo(T,b.tipo)||"#555"}`,  // ← SIEMPRE visible
          borderRadius:10,padding:"0.78rem 1rem",
          opacity:b.completado?0.55:1,transition:"opacity 0.2s"
        }}>
          {editMode?(<div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",alignItems:"center"}}>
            <input value={b.titulo} onChange={e=>upd(b.id,"titulo",e.target.value)} style={{...S.input,flex:"2 1 110px",width:"auto"}}/>
            <select value={b.tipo} onChange={e=>upd(b.id,"tipo",e.target.value)} style={{...S.input,flex:"1 1 90px",width:"auto",padding:"0.45rem 0.6rem"}}>
              {Object.keys(colorTipo).map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" value={b.duracion} onChange={e=>upd(b.id,"duracion",e.target.value)} style={{...S.input,width:55}}/>
            <button onClick={()=>del(b.id)} style={{...S.btn("#1a0000"),color:T.danger,padding:"0.38rem 0.55rem"}}>✕</button>
          </div>):(<div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
            <button onClick={()=>toggle(b.id)} style={{background:b.completado?T.ok+"22":T.bg3,border:`1.5px solid ${b.completado?T.ok:T.border2}`,borderRadius:"50%",width:25,height:25,cursor:"pointer",color:b.completado?T.ok:T.text4,fontSize:"0.72rem",flexShrink:0}}>✓</button>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontWeight:700,color:b.completado?T.text3:T.text,fontSize:"0.88rem",textDecoration:b.completado?"line-through":"none"}}>{b.titulo}</span>
                <span style={S.tag(colorTipo(T,b.tipo)||"#888")}>{b.tipo}</span>
              </div>
              {b.notas&&<p style={{color:T.text3,fontSize:"0.76rem",margin:"0.12rem 0 0"}}>{b.notas}</p>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"0.4rem",flexShrink:0}}>
              <span style={{color:T.text4,fontSize:"0.83rem",fontWeight:700}}>{b.duracion}min</span>
              <button onClick={()=>onLaunchTimer(b.duracion)} title="Lanzar timer" style={{background:T.accent+"22",border:`1px solid ${T.accent}44`,color:T.accent,borderRadius:6,padding:"0.2rem 0.45rem",cursor:"pointer",fontSize:"0.72rem",fontWeight:700}}>▶ timer</button>
            </div>
          </div>)}
        </div>
      ))}
    </div>
    {editMode&&<button onClick={add} style={{...S.btn(T.bg3,T.text2),width:"100%",marginBottom:"1rem"}}>+ Añadir bloque</button>}
    <textarea value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Notas de la sesión..." style={{...S.input,height:70,resize:"none"}}/>
  </div>);

  return(<div>
    <div style={{display:"flex",gap:"0.6rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
      <button onClick={()=>{setSesion({id:UID(),nombre:"Mi sesión",bloques:[]});setView("sesion");setEditMode(true);}} style={S.btn(T.accent)}>+ Nueva sesión</button>
        <button onClick={()=>setShowPomodoro(true)} style={S.btn(T.bg3,T.text2)}>🍅 Modo ensayo</button>
      <button onClick={()=>setView("historial")} style={S.btn(T.bg3,T.text2)}>📋 Historial ({historial.length})</button>
    </div>
    <p style={S.ptitle(T.text3)}>Plantillas</p>
    <div style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
      {PLANTILLAS.map(p=>(<button key={p.id} onClick={()=>load(p)} style={{...S.panel,cursor:"pointer",textAlign:"left",width:"100%",border:`1.5px solid ${T.border}`}}>
        <div style={{fontWeight:700,marginBottom:"0.2rem",color:T.text}}>{p.nombre}</div>
        <div style={{color:T.text3,fontSize:"0.78rem",marginBottom:"0.55rem"}}>{p.descripcion}</div>
        <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>{p.bloques.map((b,j)=><span key={j} style={S.tag(colorTipo(T,b.tipo)||"#888")}>{b.titulo} {b.duracion}min</span>)}</div>
      </button>))}
    </div>
  </div>);
}
