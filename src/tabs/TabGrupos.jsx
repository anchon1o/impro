// ============================================================
// tabs/TabGrupos.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect } from 'react';
import { useTheme, CAT_ICONS, UID, ls, mkS } from '../core.jsx';
import { getGrupos, saveGrupo } from '../db.js';

export function TabGrupos({grupoActivo,setGrupoActivo}){
  const {T}=useTheme();const S=mkS(T);
  if(!setGrupoActivo)setGrupoActivo=()=>{};
  if(grupoActivo===undefined)grupoActivo=ls.get("impro_grupo_activo",null);
  const [grupos,setGrupos]=useState(()=>ls.get("impro_grupos",[]));
  const [view,setView]=useState("lista");
  const [nombre,setNombre]=useState("");
  const [miembro,setMiembro]=useState("");
  const [editGrupo,setEditGrupo]=useState(null);
  const sesiones=ls.get("impro_sesiones",[]);
  useEffect(()=>{getGrupos().then(setGrupos);},[]);
  const save=g=>{setGrupos(g);g.forEach(x=>saveGrupo(x));};
  const crear=()=>{if(!nombre.trim())return;const g={id:UID(),nombre:nombre.trim(),miembros:[],fechaCreacion:new Date().toLocaleDateString("es-ES"),color:["#e040fb",T.info,T.ok,T.warn,T.danger][grupos.length%5]};save([...grupos,g]);setNombre("");setView("lista");};
  const eliminar=id=>{save(grupos.filter(g=>g.id!==id));if(grupoActivo?.id===id){setGrupoActivo(null);ls.set("impro_grupo_activo",null);}};
  const activar=g=>{const nuevo=g?.id===grupoActivo?.id?null:g;setGrupoActivo(nuevo);};
  const addMiembro=gid=>{if(!miembro.trim())return;const u=grupos.map(g=>g.id===gid?{...g,miembros:[...(g.miembros||[]),miembro.trim()]}:g);save(u);setMiembro("");setEditGrupo(u.find(g=>g.id===gid));};
  const removeMiembro=(gid,mi)=>{const u=grupos.map(g=>g.id===gid?{...g,miembros:(g.miembros||[]).filter((_,j)=>j!==mi)}:g);save(u);setEditGrupo(u.find(g=>g.id===gid));};
  const sesDeGrupo=n=>sesiones.filter(s=>s.grupo===n);
  if(view==="nuevo")return(<div><button onClick={()=>setView("lista")} style={{...S.btn(T.bg3,T.text2),marginBottom:"1rem"}}>← Volver</button><div style={S.panel}><p style={S.ptitle(T.accent)}>Nuevo grupo</p><input value={nombre} onChange={e=>setNombre(e.target.value)} onKeyDown={e=>e.key==="Enter"&&crear()} placeholder="Nombre del grupo..." style={{...S.input,marginBottom:"0.75rem"}}/><button onClick={crear} style={{...S.btn(T.accent),width:"100%"}}>Crear grupo</button></div></div>);
  if(view==="detalle"&&editGrupo){
    const gSes=sesDeGrupo(editGrupo.nombre);
    const totalMins=gSes.reduce((a,s)=>a+(s.minutos||0),0);
    const gStats=ls.get("impro_stats_grupos",{})[editGrupo.id]||{cats:{}};
    const topCats=Object.entries(gStats.cats||{}).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const maxCat=topCats[0]?.[1]||1;
    const sesByMonth={};
    gSes.forEach(s=>{const m=s.fecha?.split("/").slice(1).join("/")||"?";sesByMonth[m]=(sesByMonth[m]||0)+1;});
    const mesEntries=Object.entries(sesByMonth).slice(-4);
    return(<div>
      <button onClick={()=>{setView("lista");setEditGrupo(null);}} style={{...S.btn(T.bg3,T.text2),marginBottom:"1rem"}}>← Volver</button>
      <div style={{...S.panel,border:`1.5px solid ${editGrupo.color}44`,borderLeft:`4px solid ${editGrupo.color}`,marginBottom:"0.75rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
          <h2 style={{color:editGrupo.color,fontWeight:900,fontSize:"1.3rem",margin:0}}>{editGrupo.nombre}</h2>
          <button onClick={()=>activar(editGrupo)} style={S.btn(editGrupo.id===grupoActivo?.id?T.ok:T.bg3,editGrupo.id===grupoActivo?.id?"#000":T.text2)}>{editGrupo.id===grupoActivo?.id?"✓ Activo":"Activar"}</button>
        </div>
        {}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.5rem",marginBottom:"1rem"}}>
          {[{l:"SESIONES",v:gSes.length,c:editGrupo.color},{l:"MINUTOS",v:totalMins,c:T.warn},{l:"MIEMBROS",v:editGrupo.miembros?.length||0,c:T.ok}].map((s,i)=>(
            <div key={i} style={{...S.panel,textAlign:"center",padding:"0.55rem",border:`1px solid ${s.c}33`}}>
              <div style={{color:s.c,fontWeight:900,fontSize:"1.3rem",lineHeight:1}}>{s.v}</div>
              <div style={{color:T.text3,fontSize:"0.65rem",marginTop:"0.15rem",letterSpacing:"0.08em"}}>{s.l}</div>
            </div>
          ))}
        </div>
        {}
        {mesEntries.length>0&&(<div style={{marginBottom:"1rem"}}>
          <p style={S.ptitle(T.text3)}>Sesiones por mes</p>
          <div style={{display:"flex",gap:"0.5rem",alignItems:"flex-end",height:50}}>
            {mesEntries.map(([mes,n])=>{const maxN=Math.max(...mesEntries.map(e=>e[1]));const h=Math.max(8,(n/maxN)*44);return(<div key={mes} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"0.2rem"}}>
              <span style={{color:T.accent,fontSize:"0.68rem",fontWeight:700}}>{n}</span>
              <div style={{width:"100%",height:h,background:editGrupo.color,borderRadius:"3px 3px 0 0",opacity:0.75}}/>
              <span style={{color:T.text4,fontSize:"0.62rem"}}>{mes}</span>
            </div>);} )}
          </div>
        </div>)}
        {}
        {topCats.length>0&&(<div style={{marginBottom:"0.75rem"}}>
          <p style={S.ptitle(editGrupo.color)}>Categorías favoritas</p>
          {topCats.map(([cat,n])=>(<div key={cat} style={{display:"flex",alignItems:"center",gap:"0.55rem",marginBottom:"0.3rem"}}>
            <span style={{color:T.text2,fontSize:"0.78rem",width:80,flexShrink:0}}>{CAT_ICONS[cat]||"◆"} {cat}</span>
            <div style={{flex:1,height:6,background:T.bg3,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(n/maxCat)*100}%`,background:editGrupo.color,borderRadius:3}}/></div>
            <span style={{color:editGrupo.color,fontWeight:700,fontSize:"0.75rem",width:20,textAlign:"right",flexShrink:0}}>{n}</span>
          </div>))}
        </div>)}
        {topCats.length===0&&gSes.length===0&&<p style={{color:T.text4,fontSize:"0.8rem",marginBottom:"0.75rem"}}>Activa este grupo y empieza a generar para ver estadísticas.</p>}
      </div>
      {}
      <div style={S.panel}>
        <p style={S.ptitle(editGrupo.color)}>Miembros</p>
        <div style={{display:"flex",gap:"0.45rem",marginBottom:"0.65rem"}}>
          <input value={miembro} onChange={e=>setMiembro(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addMiembro(editGrupo.id)} placeholder="Nombre..." style={S.input}/>
          <button onClick={()=>addMiembro(editGrupo.id)} style={{...S.btn(editGrupo.color,"#000"),flexShrink:0}}>+</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
          {(editGrupo.miembros||[]).length===0&&<p style={{color:T.text4,fontSize:"0.82rem",margin:0}}>Sin miembros.</p>}
          {(editGrupo.miembros||[]).map((m,i)=>(<div key={i} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:20,padding:"0.28rem 0.7rem",display:"flex",gap:"0.35rem",alignItems:"center"}}>
            <span style={{color:T.text2,fontSize:"0.83rem"}}>👤 {m}</span>
            <button onClick={()=>removeMiembro(editGrupo.id,i)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",padding:0,fontSize:"0.83rem"}}>×</button>
          </div>))}
        </div>
      </div>
    </div>);
  }
  return(<div><div style={{display:"flex",gap:"0.6rem",marginBottom:"1.25rem",alignItems:"center",flexWrap:"wrap"}}><button onClick={()=>setView("nuevo")} style={S.btn(T.accent)}>+ Nuevo grupo</button>{grupoActivo&&<span style={{color:T.ok,fontSize:"0.82rem"}}>✓ Activo: <strong>{grupoActivo.nombre}</strong></span>}</div>{grupos.length===0&&<div style={{...S.panel,textAlign:"center",padding:"2.5rem 1rem"}}><p style={{color:T.text4}}>Crea tu primer grupo de impro</p><button onClick={()=>setView("nuevo")} style={S.btn(T.accent)}>+ Crear grupo</button></div>}<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(220px,100%),1fr))",gap:"0.65rem"}}>{grupos.map(g=>(<div key={g.id} style={{...S.panel,borderStyle:"solid",borderWidth:"1.5px 1.5px 1.5px 4px",borderTopColor:g.id===grupoActivo?.id?g.color:T.border,borderRightColor:g.id===grupoActivo?.id?g.color:T.border,borderBottomColor:g.id===grupoActivo?.id?g.color:T.border,borderLeftColor:g.color}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.65rem"}}><span style={{fontWeight:900,color:g.color,fontSize:"1.05rem"}}>{g.nombre}</span>{g.id===grupoActivo?.id&&<span style={S.tag(T.ok)}>ACTIVO</span>}</div><div style={{display:"flex",gap:"0.5rem",marginBottom:"0.75rem",flexWrap:"wrap"}}><span style={S.tag(g.color)}>{g.miembros?.length||0} miembros</span><span style={S.tag(T.warn)}>{sesDeGrupo(g.nombre).length} sesiones</span></div><div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}><button onClick={()=>{setEditGrupo(g);setView("detalle");}} style={{...S.btn(T.bg3,T.text2),flex:1}}>Ver</button><button onClick={()=>activar(g)} style={{...S.btn(g.id===grupoActivo?.id?T.ok:T.bg3,g.id===grupoActivo?.id?"#000":T.text2),flex:1}}>{g.id===grupoActivo?.id?"✓":"Activar"}</button><button onClick={()=>eliminar(g.id)} style={{...S.btn(T.bg3),color:T.danger,padding:"0.5rem 0.55rem"}}>✕</button></div></div>))}</div></div>);
}
