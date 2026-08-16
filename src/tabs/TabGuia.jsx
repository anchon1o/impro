// ============================================================
// tabs/TabGuia.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth, t, useTheme, ls, mkS, colorTipo, rexistrarTipos, EditorDinamica, useDinamicas, AvisoDinamicas, TYPE } from '../core.jsx';
import { saveDinamica, deleteDinamica, cargarTiposDinamica } from '../db.js';

export function TabGuia(){
  const {T}=useTheme();const S=mkS(T);
  const {logueado,pedirLogin}=useAuth();
  // Fonte única: a base de datos. Ver useDinamicas en core.jsx (A04).
  const {dinamicas,setDinamicas,cargando,motivo,recargar}=useDinamicas();
  const [filtro,setFiltro]=useState("todos");
  // Os tipos veñen da BD e son configurables desde Admin.
  const [tipos,setTipos]=useState([]);
  useEffect(()=>{cargarTiposDinamica().then(r=>{
    const l=Array.isArray(r)?r:(r?.tipos||[]);
    setTipos(l.filter(t=>t.activo!==false)); rexistrarTipos(l);
  });},[]);
  const [search,setSearch]=useState("");
  const [sel,setSel]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [favDins,setFavDins]=useState(()=>ls.get("impro_fav_dins",[]));
  const toggleFavDin=id=>{const u=favDins.includes(id)?favDins.filter(x=>x!==id):[...favDins,id];setFavDins(u);ls.set("impro_fav_dins",u);};
  const isFav=id=>favDins.includes(id);
  const [editId,setEditId]=useState(null);
  const FORM0={nombre:"",tipo:"calentamiento",duracion:10,participantes:"grupo",descripcion:"",pasos:"",objetivo:"",variantes:""};
  const [form,setForm]=useState(FORM0);
  const filtros=["todos","★ Favoritas",...new Set(dinamicas.map(d=>d.tipo))];
  // `descripcion` pode vir nula nunha dinámica creada desde a táboa masiva:
  // sen o ?? "" a busca tiraba a pestana enteira.
  const lista=dinamicas.filter(d=>(filtro==="★ Favoritas"?isFav(d.id):(filtro==="todos"||d.tipo===filtro))&&(!search||String(d.nombre??"").toLowerCase().includes(search.toLowerCase())||String(d.descripcion??"").toLowerCase().includes(search.toLowerCase())));
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
    <EditorDinamica form={form} setForm={setForm} onGardar={saveForm} onCancelar={()=>setShowForm(false)}
      editando={!!editId} tiposDisponibles={tipos.map(t=>t.id)}/>
  </div>);


  if(sel)return(<div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem",flexWrap:"wrap"}}>
      <button onClick={()=>setSel(null)} style={S.btn(T.bg3,T.text2)}>← Volver</button>
      <button onClick={()=>toggleFavDin(sel.id)} style={{...S.btn(isFav(sel.id)?T.warn:T.bg3,isFav(sel.id)?"#000":T.text2)}}>{isFav(sel.id)?"★ Favorita":"☆ Favorita"}</button>
      <button onClick={()=>openEdit(sel)} style={S.btn(T.bg3,T.text2)}>✏️ Editar</button>
      <button onClick={()=>deleteDin(sel.id)} style={{...S.btn(T.bg3),color:T.danger}}>✕ Eliminar</button>
    </div>
    <div style={{...S.panel,border:`1.5px solid ${colorTipo(T,sel.tipo)}33`,borderLeft:`4px solid ${colorTipo(T,sel.tipo)}`}}>
      <div style={{display:"flex",gap:"0.55rem",marginBottom:"0.9rem",flexWrap:"wrap",alignItems:"center"}}><span style={S.tag(colorTipo(T,sel.tipo))}>{sel.tipo.toUpperCase()}</span><span style={{color:T.text3,fontSize:"0.78rem"}}>⏱ {sel.duracion}min · 👥 {sel.participantes}</span></div>
      <h2 style={{color:T.text,fontWeight:900,fontSize:"1.4rem",margin:"0 0 0.65rem"}}>{sel.nombre}</h2>
      <p style={{color:T.text2,lineHeight:1.6,marginBottom:"1.1rem"}}>{sel.descripcion}</p>
      <p style={S.ptitle(colorTipo(T,sel.tipo))}>Pasos</p>
      {(sel.pasos||[]).map((p,i)=>(<div key={i} style={{display:"flex",gap:"0.6rem",marginBottom:"0.4rem",alignItems:"flex-start"}}><span style={{...S.tag(colorTipo(T,sel.tipo)),borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"0.68rem"}}>{i+1}</span><span style={{color:T.text2,fontSize:"0.86rem",lineHeight:1.5}}>{p}</span></div>))}
      {sel.objetivo&&<div style={{background:T.bg3,borderRadius:10,padding:"0.85rem",margin:"1rem 0"}}><p style={S.ptitle(T.warn)}>🎯 Objetivo</p><p style={{color:T.text2,fontSize:"0.86rem",margin:0}}>{sel.objetivo}</p></div>}
      {(sel.variantes||[]).length>0&&<><p style={S.ptitle(T.text4)}>Variantes</p>{sel.variantes.map((v,i)=><p key={i} style={{color:T.text3,fontSize:"0.82rem",margin:"0.18rem 0"}}>◆ {v}</p>)}</>}
      {sel.licencia&&<div style={{background:T.danger+"1A",border:"1px solid rgba(255,110,64,0.35)",borderRadius:10,padding:"0.8rem",marginTop:"1.1rem"}}>
        <p style={{color:T.danger,fontSize:"0.82rem",margin:0,lineHeight:1.5}}>{sel.licencia}</p>
      </div>}
      {sel.autoria&&<p style={{color:T.text3,fontSize:"0.78rem",marginTop:"1rem",lineHeight:1.5}}><strong style={{color:T.text2}}>Autoría:</strong> {sel.autoria}</p>}
      {sel.fuente&&<p style={{color:T.text4,fontSize:"0.72rem",marginTop:sel.autoria?"0.4rem":"1.1rem",paddingTop:"0.6rem",borderTop:`1px solid ${T.border}`}}>Catalogada a partir de {sel.fuente}</p>}
    </div>
  </div>);

  return(<div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.85rem",flexWrap:"wrap",alignItems:"center"}}>
      <button onClick={openNew} style={S.btn(T.accent)}>+ Nueva dinámica</button>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...S.input,flex:1,minWidth:120}}/>
      <span style={{color:T.text4,fontSize:"0.78rem",whiteSpace:"nowrap"}}>{lista.length}</span>
      {/* Antes «restaurar por defecto»: volcaba as 247 do código. Sen ese
          catálogo, restaurar é volver preguntarlle á base de datos. */}
      <button onClick={recargar} title="Recargar da base de datos" style={{...S.btn(T.bg3,T.text4),...TYPE.caption}}>↺</button>
    </div>
    <div style={{display:"flex",gap:"0.3rem",marginBottom:"1rem",flexWrap:"wrap"}}>
      {filtros.map(t=><button key={t} onClick={()=>setFiltro(t)} style={{background:filtro===t?(colorTipo(T,t)||T.accent):T.bg3,color:filtro===t?"#000":T.text3,border:"none",borderRadius:20,padding:"0.3rem 0.8rem",fontSize:"0.74rem",fontWeight:filtro===t?700:400,cursor:"pointer",fontFamily:"inherit"}}>{t}</button>)}
    </div>
    <AvisoDinamicas motivo={cargando?null:motivo} baleiro={dinamicas.length===0} onRecargar={recargar}/>
    {cargando&&dinamicas.length===0&&<div style={{...S.panel,textAlign:"center",padding:"2.5rem 1rem"}}>
      <p style={{fontSize:"1.6rem",margin:"0 0 0.5rem"}}>📖</p>
      <p style={{...TYPE.bodySm,color:T.text4,margin:0}}>Cargando o catálogo…</p>
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(240px,100%),1fr))",gap:"0.55rem"}}>
      {lista.map(d=>(<button key={d.id} onClick={()=>setSel(d)} style={{...S.panel,borderStyle:"solid",borderWidth:"1.5px 1.5px 1.5px 4px",borderTopColor:T.border,borderRightColor:T.border,borderBottomColor:T.border,borderLeftColor:colorTipo(T,d.tipo),cursor:"pointer",textAlign:"left",width:"100%"}}>
        <div style={{display:"flex",gap:"0.4rem",marginBottom:"0.4rem",alignItems:"center"}}><span style={S.tag(colorTipo(T,d.tipo))}>{d.tipo}</span><span style={{color:T.text4,fontSize:"0.7rem"}}>⏱{d.duracion}min</span></div>
        <div style={{fontWeight:700,color:T.text,marginBottom:"0.22rem",fontSize:"0.9rem"}}>{d.nombre}</div>
        <div style={{color:T.text3,fontSize:"0.76rem",lineHeight:1.4}}>{d.descripcion}</div>
      </button>))}
    </div>
  </div>);
}
