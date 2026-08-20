// ═══════════════════════════════════════════════════════════════════
// ADMIN · Dinámicas
// ═══════════════════════════════════════════════════════════════════
// Lista, táboa masiva e tipos.

import { useState, useEffect } from 'react';
import { useTheme, mkS, t, ls, colorTipo, EditorDinamica,
         useDinamicas, AvisoDinamicas } from '../core.jsx';
import { saveDinamica, deleteDinamica, cargarTiposDinamica, aoCambiarTipos } from '../db.js';
import { AdminTablaDinamicas } from './AdminTablaDinamicas.jsx';
import { AdminTiposDinamica } from './AdminTiposDinamica.jsx';

export function AdminDinamicas({T,S}){
  const [vistaDin,setVistaDin]=useState('lista');
  const [tiposDin,setTiposDin]=useState([]);
  useEffect(()=>{cargarTiposDinamica().then(r=>setTiposDin((Array.isArray(r)?r:(r?.tipos||[])).filter(t=>t.activo!==false)));},[]);
  const {dinamicas,setDinamicas,cargando:cargandoDin,motivo:motivoDin,recargar:recargarDin}=useDinamicas();
  const [search,setSearch]=useState("");
  const [filtro,setFiltro]=useState("todos");
  const [orde,setOrde]=useState("nombre");
  const [editId,setEditId]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const FORM0={nombre:"",tipo:"calentamiento",duracion:10,participantes:"grupo",descripcion:"",pasos:"",objetivo:"",variantes:""};
  const [form,setForm]=useState(FORM0);


  const tipos=["todos",...new Set(dinamicas.map(d=>d.tipo))];
  let lista=dinamicas.filter(d=>(filtro==="todos"||d.tipo===filtro)&&(!search||d.nombre.toLowerCase().includes(search.toLowerCase())));
  lista=[...lista].sort((a,b)=>{
    if(orde==="nombre")return a.nombre.localeCompare(b.nombre);
    if(orde==="duracion")return a.duracion-b.duracion;
    if(orde==="tipo")return a.tipo.localeCompare(b.tipo);
    return 0;
  });

  const deleteDin=async id=>{if(!confirm("¿Eliminar?"))return;const u=dinamicas.filter(d=>d.id!==id);setDinamicas(u);await deleteDinamica(id);};
  // Sen catálogo no código, «restaurar» é volver ler a base de datos.
  const restoreAll=recargarDin;

  const openNew=()=>{setEditId(null);setForm(FORM0);setShowForm(true);};
  const openEdit=d=>{setEditId(d.id);setForm({...d,pasos:(d.pasos||[]).join("\n"),variantes:(d.variantes||[]).join("\n")});setShowForm(true);};
  const saveForm=async()=>{
    if(!form.nombre.trim())return;
    const d={...form,id:editId||String(Date.now()),duracion:Number(form.duracion),
      pasos:form.pasos.split("\n").map(s=>s.trim()).filter(Boolean),
      variantes:form.variantes.split("\n").map(s=>s.trim()).filter(Boolean)};
    const updated=editId?dinamicas.map(x=>x.id===editId?d:x):[...dinamicas,d];
    setDinamicas(updated);ls.set("impro_dinamicas_v2",updated);
    await saveDinamica(d);
    setShowForm(false);
  };

  return(<div>
    <AvisoDinamicas motivo={cargandoDin?null:motivoDin} baleiro={dinamicas.length===0} onRecargar={recargarDin}/>
    <div style={{display:"flex",gap:2,background:T.bg3,borderRadius:10,padding:3,marginBottom:"0.8rem",width:"fit-content"}}>
      {[["lista","Dinámicas"],["masiva","🧮 Táboa"],["tipos","🎯 Tipos"]].map(([id,lab])=>(
        <button key={id} onClick={()=>setVistaDin(id)} style={{...S.btn(vistaDin===id?T.bg2:"transparent",vistaDin===id?T.text:T.text3),borderRadius:8,padding:"0.32rem 0.8rem",fontSize:"0.78rem"}}>{lab}</button>))}
    </div>
    {vistaDin==="tipos"&&<AdminTiposDinamica/>}
    {vistaDin==="masiva"&&<AdminTablaDinamicas/>}
    {vistaDin==="lista"&&<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
      <p style={{...S.ptitle(T.accent),margin:0}}>Dinámicas ({dinamicas.length})</p>
      <button onClick={openNew} style={S.btn(T.accent)}>+ Nova dinámica</button>
    </div>

    {showForm&&<div style={{marginBottom:"1rem"}}>
      <EditorDinamica form={form} setForm={setForm} onGardar={saveForm} onCancelar={()=>setShowForm(false)}
        editando={!!editId} tiposDisponibles={tiposDin.map(t=>t.id)}/>
    </div>}


    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.75rem",flexWrap:"wrap",alignItems:"center"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...S.input,flex:1,minWidth:140}}/>
      <select value={orde} onChange={e=>setOrde(e.target.value)} style={{...S.input,width:"auto"}}>
        <option value="nombre">Ordenar: Nome</option>
        <option value="duracion">Ordenar: Duración</option>
        <option value="tipo">Ordenar: Tipo</option>
      </select>
      <span style={{color:T.text4,fontSize:"0.78rem"}}>{lista.length}/{dinamicas.length}</span>
      <button onClick={restoreAll} style={{...S.btn(T.bg3,T.danger),fontSize:"0.75rem"}}>↺ Restaurar</button>
    </div>
    <div style={{display:"flex",gap:"0.3rem",marginBottom:"0.85rem",flexWrap:"wrap"}}>
      {tipos.map(t=><button key={t} onClick={()=>setFiltro(t)} style={{background:filtro===t?(colorTipo(T,t)||T.accent):T.bg3,color:filtro===t?"#000":T.text3,border:"none",borderRadius:20,padding:"0.25rem 0.7rem",fontSize:"0.72rem",fontWeight:filtro===t?700:400,cursor:"pointer",fontFamily:"inherit"}}>{t}</button>)}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:"0.4rem",maxHeight:520,overflowY:"auto"}}>
      {lista.map(d=>(<div key={d.id} style={{...S.panel,padding:"0.6rem 0.9rem",display:"flex",gap:"0.6rem",alignItems:"center",borderLeft:`3px solid ${colorTipo(T,d.tipo)||T.accent}`}}>
        <div style={{flex:1,minWidth:0}}>
          <span style={{fontWeight:700,color:T.text,fontSize:"0.88rem"}}>{d.nombre}</span>
          <span style={{...S.tag(colorTipo(T,d.tipo)||T.accent),marginLeft:"0.4rem"}}>{d.tipo}</span>
          <span style={{color:T.text4,fontSize:"0.75rem",marginLeft:"0.4rem"}}>⏱{d.duracion}min</span>
        </div>
        <button onClick={()=>openEdit(d)} style={{...S.btn(T.bg3,T.text3),padding:"0.28rem 0.5rem",fontSize:"0.76rem"}}>✏️</button>
        <button onClick={()=>deleteDin(d.id)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.9rem"}}>×</button>
      </div>))}
      {lista.length===0&&<p style={{color:T.text4,fontSize:"0.83rem"}}>Sen resultados.</p>}
    </div>
    </>}
  </div>);
}
