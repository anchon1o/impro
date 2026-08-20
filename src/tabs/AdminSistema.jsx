// ═══════════════════════════════════════════════════════════════════
// ADMIN · Estatísticas e Configuración
// ═══════════════════════════════════════════════════════════════════
// As dúas seccións que non tocan contido: só len o estado da app.

import { useState } from 'react';
import { useTheme, mkS, ls, CAT_ICONS } from '../core.jsx';

export function AdminStats({T,S}){
  const stats=ls.get("impro_stats",{cats:{},total:0,mins:0});
  const cats=Object.entries(stats.cats||{}).sort((a,b)=>b[1]-a[1]);
  const maxVal=cats[0]?.[1]||1;
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.6rem",marginBottom:"1.25rem"}}>
      {[["✦",stats.total||0,"Estímulos xerados"],["⏱",stats.mins||0,"Minutos de ensaio"],["📋",ls.get("impro_sesiones",[]).length,"Sesións gardadas"]].map(([emoji,val,label])=>(
        <div key={label} style={{...S.panel,textAlign:"center",padding:"0.85rem 0.5rem"}}>
          <div style={{fontSize:"1.3rem"}}>{emoji}</div>
          <div style={{fontSize:"1.6rem",fontWeight:900,color:T.accent}}>{val}</div>
          <div style={{color:T.text3,fontSize:"0.7rem"}}>{label}</div>
        </div>
      ))}
    </div>
    {cats.length>0&&<div style={S.panel}>
      <p style={S.ptitle(T.accent)}>Categorías máis usadas</p>
      <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
        {cats.map(([cat,count])=>(
          <div key={cat} style={{display:"flex",gap:"0.6rem",alignItems:"center"}}>
            <span style={{color:T.text3,fontSize:"0.78rem",width:90,flexShrink:0}}>{CAT_ICONS[cat]||"◆"} {cat}</span>
            <div style={{flex:1,height:8,background:T.bg3,borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(count/maxVal)*100}%`,background:T.accent,borderRadius:4,transition:"width 0.5s"}}/>
            </div>
            <span style={{color:T.text,fontSize:"0.82rem",fontWeight:700,width:28,textAlign:"right"}}>{count}</span>
          </div>
        ))}
      </div>
    </div>}
    {cats.length===0&&<div style={{...S.panel,textAlign:"center",padding:"2rem"}}>
      <p style={{fontSize:"2rem",margin:"0 0 0.5rem"}}>📊</p>
      <p style={{color:T.text4}}>Sen datos aínda. Usa o xerador de estímulos para acumular estatísticas.</p>
    </div>}
  </div>);
}

export function AdminConfig({T,S}){
  const [adminPin,setAdminPin]=useState("1234");
  const [msg,setMsg]=useState("");
  const savePin=()=>{ls.set("impro_admin_pin",adminPin);setMsg("✓ PIN actualizado (reinicia sesión)");setTimeout(()=>setMsg(""),3000);};
  const clearAll=()=>{if(!confirm("¿Borrar TODOS os datos locais? Esta acción non se pode desfacer."))return;localStorage.clear();sessionStorage.clear();window.location.reload();};
  return(<div style={{display:"flex",flexDirection:"column",gap:"0.85rem"}}>
    <div style={S.panel}>
      <p style={S.ptitle(T.warn)}>Cambiar PIN de Admin</p>
      <div style={{display:"flex",gap:"0.5rem"}}>
        <input type="password" value={adminPin} onChange={e=>setAdminPin(e.target.value)} style={{...S.input,flex:1,letterSpacing:"0.2em"}} placeholder="Novo PIN..."/>
        <button onClick={savePin} style={S.btn(T.accent)}>Gardar</button>
      </div>
      {msg&&<p style={{color:T.ok,fontSize:"0.82rem",marginTop:"0.5rem"}}>{msg}</p>}
    </div>
    <div style={{...S.panel,border:`1.5px solid ${T.danger}33`}}>
      <p style={S.ptitle(T.danger)}>Zona de perigo</p>
      <p style={{color:T.text3,fontSize:"0.83rem",marginBottom:"0.85rem"}}>Borra todos os datos gardados localmente (favoritos, historial, configuracións). Os datos en Supabase non se borran.</p>
      <button onClick={clearAll} style={{...S.btn(T.danger),width:"100%"}}>🗑 Borrar datos locais</button>
    </div>
    <div style={S.panel}>
      <p style={S.ptitle(T.text3)}>Información</p>
      <div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>
        {[["Versión","v8"],["Repo","anchon1o/impro"],["Deploy","improapp.vercel.app"],["Backend","Supabase"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:"0.82rem"}}>
            <span style={{color:T.text3}}>{k}</span>
            <span style={{color:T.text,fontFamily:"monospace"}}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>);
}
