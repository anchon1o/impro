// ============================================================
// tabs/TabGuia.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth, t, useTheme, ls, mkS, TIPO_COLOR } from '../core.jsx';
import { DINAMICAS_BASE } from '../datos.js';
import { getDinamicas, saveDinamica, deleteDinamica } from '../db.js';

export function TabGuia(){
  const {T}=useTheme();const S=mkS(T);
  const {logueado,pedirLogin}=useAuth();
  const [dinamicas,setDinamicas]=useState(()=>ls.get("impro_dinamicas_v2",DINAMICAS_BASE));
  const [filtro,setFiltro]=useState("todos");
  const [search,setSearch]=useState("");
  const [sel,setSel]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [favDins,setFavDins]=useState(()=>ls.get("impro_fav_dins",[]));
  useEffect(()=>{getDinamicas(DINAMICAS_BASE).then(setDinamicas);},[]);
  const toggleFavDin=id=>{const u=favDins.includes(id)?favDins.filter(x=>x!==id):[...favDins,id];setFavDins(u);ls.set("impro_fav_dins",u);};
  const isFav=id=>favDins.includes(id);
  const [editId,setEditId]=useState(null);
  const FORM0={nombre:"",tipo:"calentamiento",duracion:10,participantes:"grupo",descripcion:"",pasos:"",objetivo:"",variantes:""};
  const [form,setForm]=useState(FORM0);
  const tipos=["todos","★ Favoritas",...new Set(dinamicas.map(d=>d.tipo))];
  const lista=dinamicas.filter(d=>(filtro==="★ Favoritas"?isFav(d.id):(filtro==="todos"||d.tipo===filtro))&&(!search||d.nombre.toLowerCase().includes(search.toLowerCase())||d.descripcion.toLowerCase().includes(search.toLowerCase())));
  const openNew=()=>{if(!logueado){pedirLogin();return;}setEditId(null);setForm(FORM0);setShowForm(true);setSel(null);};
  const openEdit=d=>{setEditId(d.id);setForm({...d,pasos:(d.pasos||[]).join("\n"),variantes:(d.variantes||[]).join("\n")});setShowForm(true);setSel(null);};
  const saveForm=async()=>{
    const d={...form,id:editId||String(Date.now()),duracion:Number(form.duracion),pasos:form.pasos.split("\n").map(s=>s.trim()).filter(Boolean),variantes:form.variantes.split("\n").map(s=>s.trim()).filter(Boolean)};
    const updated=editId?dinamicas.map(x=>x.id===editId?d:x):[...dinamicas,d];
    setDinamicas(updated);await saveDinamica(d);setShowForm(false);
  };
  const deleteDin=async id=>{if(!confirm("¿Eliminar esta dinámica?"))return;const u=dinamicas.filter(d=>d.id!==id);setDinamicas(u);await deleteDinamica(id);setSel(null);};

  if(showForm)return(<div>
    <button onClick={()=>setShowForm(false)} style={{...S.btn(T.bg3,T.text2),marginBottom:"1rem"}}>← Volver</button>
    <div style={{...S.panel,border:`1.5px solid ${T.accent}33`}}>
      <p style={S.ptitle(T.accent)}>{editId?"Editar dinámica":"Nueva dinámica"}</p>
      <div style={{display:"grid",gap:"0.65rem"}}>
        <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>NOMBRE</p><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} style={S.input}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.5rem"}}>
          <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>TIPO</p>
            <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} style={{...S.input,padding:"0.45rem 0.6rem"}}>{Object.keys(TIPO_COLOR).map(t=><option key={t} value={t}>{t}</option>)}</select></div>
          <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>DURACIÓN (min)</p><input type="number" value={form.duracion} onChange={e=>setForm(f=>({...f,duracion:e.target.value}))} style={S.input}/></div>
          <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>PARTICIPANTES</p><input value={form.participantes} onChange={e=>setForm(f=>({...f,participantes:e.target.value}))} style={S.input}/></div>
        </div>
        <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>DESCRIPCIÓN</p><textarea value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} style={{...S.input,height:70,resize:"vertical"}}/></div>
        <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>PASOS (uno por línea)</p><textarea value={form.pasos} onChange={e=>setForm(f=>({...f,pasos:e.target.value}))} style={{...S.input,height:100,resize:"vertical"}}/></div>
        <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>OBJETIVO</p><input value={form.objetivo} onChange={e=>setForm(f=>({...f,objetivo:e.target.value}))} style={S.input}/></div>
        <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>VARIANTES (una por línea)</p><textarea value={form.variantes} onChange={e=>setForm(f=>({...f,variantes:e.target.value}))} style={{...S.input,height:70,resize:"vertical"}}/></div>
      </div>
      <div style={{display:"flex",gap:"0.5rem",marginTop:"0.85rem"}}>
        <button onClick={saveForm} disabled={!form.nombre.trim()} style={{...S.btn(T.accent),opacity:!form.nombre.trim()?0.4:1}}>Guardar</button>
        <button onClick={()=>setShowForm(false)} style={S.btn(T.bg3,T.text2)}>Cancelar</button>
      </div>
    </div>
  </div>);

  if(sel)return(<div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem",flexWrap:"wrap"}}>
      <button onClick={()=>setSel(null)} style={S.btn(T.bg3,T.text2)}>← Volver</button>
      <button onClick={()=>toggleFavDin(sel.id)} style={{...S.btn(isFav(sel.id)?"#ffd740":T.bg3,isFav(sel.id)?"#000":T.text2)}}>{isFav(sel.id)?"★ Favorita":"☆ Favorita"}</button>
      <button onClick={()=>openEdit(sel)} style={S.btn(T.bg3,T.text2)}>✏️ Editar</button>
      <button onClick={()=>deleteDin(sel.id)} style={{...S.btn(T.bg3),color:"#ff6e40"}}>✕ Eliminar</button>
    </div>
    <div style={{...S.panel,border:`1.5px solid ${TIPO_COLOR[sel.tipo]}33`,borderLeft:`4px solid ${TIPO_COLOR[sel.tipo]}`}}>
      <div style={{display:"flex",gap:"0.55rem",marginBottom:"0.9rem",flexWrap:"wrap",alignItems:"center"}}><span style={S.tag(TIPO_COLOR[sel.tipo])}>{sel.tipo.toUpperCase()}</span><span style={{color:T.text3,fontSize:"0.78rem"}}>⏱ {sel.duracion}min · 👥 {sel.participantes}</span></div>
      <h2 style={{color:T.text,fontWeight:900,fontSize:"1.4rem",margin:"0 0 0.65rem"}}>{sel.nombre}</h2>
      <p style={{color:T.text2,lineHeight:1.6,marginBottom:"1.1rem"}}>{sel.descripcion}</p>
      <p style={S.ptitle(TIPO_COLOR[sel.tipo])}>Pasos</p>
      {(sel.pasos||[]).map((p,i)=>(<div key={i} style={{display:"flex",gap:"0.6rem",marginBottom:"0.4rem",alignItems:"flex-start"}}><span style={{...S.tag(TIPO_COLOR[sel.tipo]),borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"0.68rem"}}>{i+1}</span><span style={{color:T.text2,fontSize:"0.86rem",lineHeight:1.5}}>{p}</span></div>))}
      {sel.objetivo&&<div style={{background:T.bg3,borderRadius:10,padding:"0.85rem",margin:"1rem 0"}}><p style={S.ptitle("#ffd740")}>🎯 Objetivo</p><p style={{color:T.text2,fontSize:"0.86rem",margin:0}}>{sel.objetivo}</p></div>}
      {(sel.variantes||[]).length>0&&<><p style={S.ptitle(T.text4)}>Variantes</p>{sel.variantes.map((v,i)=><p key={i} style={{color:T.text3,fontSize:"0.82rem",margin:"0.18rem 0"}}>◆ {v}</p>)}</>}
    </div>
  </div>);

  return(<div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.85rem",flexWrap:"wrap",alignItems:"center"}}>
      <button onClick={openNew} style={S.btn(T.accent)}>+ Nueva dinámica</button>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...S.input,flex:1,minWidth:120}}/>
      <span style={{color:T.text4,fontSize:"0.78rem",whiteSpace:"nowrap"}}>{lista.length}</span>
      <button onClick={()=>{if(confirm("¿Restaurar dinámicas por defecto?")){{setDinamicas(DINAMICAS_BASE);ls.set("impro_dinamicas_v2",DINAMICAS_BASE);}}}} style={{...S.btn(T.bg3,T.text4),fontSize:"0.72rem"}}>↺</button>
    </div>
    <div style={{display:"flex",gap:"0.3rem",marginBottom:"1rem",flexWrap:"wrap"}}>
      {tipos.map(t=><button key={t} onClick={()=>setFiltro(t)} style={{background:filtro===t?(TIPO_COLOR[t]||T.accent):T.bg3,color:filtro===t?"#000":T.text3,border:"none",borderRadius:20,padding:"0.3rem 0.8rem",fontSize:"0.74rem",fontWeight:filtro===t?700:400,cursor:"pointer",fontFamily:"inherit"}}>{t}</button>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"0.55rem"}}>
      {lista.map(d=>(<button key={d.id} onClick={()=>setSel(d)} style={{...S.panel,border:`1.5px solid ${T.border}`,borderLeft:`4px solid ${TIPO_COLOR[d.tipo]}`,cursor:"pointer",textAlign:"left",width:"100%"}}>
        <div style={{display:"flex",gap:"0.4rem",marginBottom:"0.4rem",alignItems:"center"}}><span style={S.tag(TIPO_COLOR[d.tipo])}>{d.tipo}</span><span style={{color:T.text4,fontSize:"0.7rem"}}>⏱{d.duracion}min</span></div>
        <div style={{fontWeight:700,color:T.text,marginBottom:"0.22rem",fontSize:"0.9rem"}}>{d.nombre}</div>
        <div style={{color:T.text3,fontSize:"0.76rem",lineHeight:1.4}}>{d.descripcion}</div>
      </button>))}
    </div>
  </div>);
}
