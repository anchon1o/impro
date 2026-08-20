// ═══════════════════════════════════════════════════════════════════
// ADMIN · Usuarios e Grupos
// ═══════════════════════════════════════════════════════════════════
// Sacado de `TabAdmin.jsx`, que chegara a 727 liñas con 11 seccións
// dentro. Van xuntas porque as dúas tratan de xente.

import { useState, useEffect, useCallback } from 'react';
import { useTheme, mkS, colorTipo } from '../core.jsx';
import { listarUsuarios, aprobarUsuario, cambiarRol, editarNomeUsuario,
         listarPropostasCompartir, aprobarCompartir } from '../auth.js';
import { listarTodosGrupos } from '../db.js';

export function AdminUsuarios({T,S}){
  const [usuarios,setUsuarios]=useState([]);
  const [propostas,setPropostas]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filtro,setFiltro]=useState("todos");
  const [editId,setEditId]=useState(null);
  const [editNome,setEditNome]=useState("");

  const cargar=async()=>{
    setLoading(true);
    const [u,p]=await Promise.all([listarUsuarios(),listarPropostasCompartir()]);
    setUsuarios(u);setPropostas(p);setLoading(false);
  };
  useEffect(()=>{cargar();},[]);

  const toggleAprobado=async(u)=>{
    await aprobarUsuario(u.id,!u.aprobado);
    setUsuarios(prev=>prev.map(x=>x.id===u.id?{...x,aprobado:!x.aprobado}:x));
  };
  const toggleRol=async(u)=>{
    const novo=u.rol==="admin"?"user":"admin";
    await cambiarRol(u.id,novo);
    setUsuarios(prev=>prev.map(x=>x.id===u.id?{...x,rol:novo}:x));
  };
  const saveNome=async(u)=>{
    if(!editNome.trim())return;
    const ok=await editarNomeUsuario(u.id,editNome.trim());
    if(ok)setUsuarios(prev=>prev.map(x=>x.id===u.id?{...x,nome:editNome.trim()}:x));
    setEditId(null);setEditNome("");
  };
  const decidirCompartir=async(d,aprobar)=>{
    await aprobarCompartir(d.id,aprobar);
    setPropostas(prev=>prev.filter(x=>x.id!==d.id));
  };

  const lista=usuarios.filter(u=>filtro==="todos"||(filtro==="pendentes"&&!u.aprobado)||(filtro==="admins"&&u.rol==="admin"));
  const pendentes=usuarios.filter(u=>!u.aprobado).length;

  if(loading)return<p style={{color:T.text3}}>Cargando...</p>;

  return(<div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
    {pendentes>0&&<div style={{...S.panel,border:`1.5px solid ${T.warn}44`,background:T.warn+"08"}}>
      <p style={{color:T.warn,fontWeight:700,margin:0,fontSize:"0.88rem"}}>⏳ {pendentes} usuario{pendentes>1?"s":""} pendente{pendentes>1?"s":""} de aprobación</p>
    </div>}

    {propostas.length>0&&<div style={S.panel}>
      <p style={S.ptitle(T.ok)}>Dinámicas propostas para compartir ({propostas.length})</p>
      <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
        {propostas.map(d=>(<div key={d.id} style={{background:T.bg3,borderRadius:10,padding:"0.7rem 0.9rem"}}>
          <div style={{marginBottom:"0.5rem"}}>
            <span style={{color:T.text,fontWeight:700,fontSize:"0.88rem"}}>{d.nombre}</span>
            <span style={{...S.tag(colorTipo(T,d.tipo)||T.accent),marginLeft:"0.4rem"}}>{d.tipo}</span>
            <p style={{color:T.text3,fontSize:"0.78rem",margin:"0.3rem 0 0"}}>Por {d.perfis?.nome||d.perfis?.email||"?"}</p>
          </div>
          <div style={{display:"flex",gap:"0.4rem"}}>
            <button onClick={()=>decidirCompartir(d,true)} style={{...S.btn(T.ok,"#000"),fontSize:"0.78rem"}}>✓ Compartir con todos</button>
            <button onClick={()=>decidirCompartir(d,false)} style={{...S.btn(T.bg4,T.text3),fontSize:"0.78rem"}}>✕ Rexeitar</button>
          </div>
        </div>))}
      </div>
    </div>}

    <div style={{...S.panel,border:`1.5px solid ${T.info}33`,background:T.info+"08"}}>
      <p style={{color:T.info,fontSize:"0.82rem",margin:0,lineHeight:1.5}}>ℹ️ Por seguridade, as contas créanse por auto-rexistro (Entrar → Crear conta) e ti apróbaas aquí. Non é posible crear contas con contrasinal directamente dende este panel sen un servidor propio.</p>
    </div>

    <div style={S.panel}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.85rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <p style={{...S.ptitle(T.accent),margin:0}}>Usuarios ({usuarios.length})</p>
        <button onClick={cargar} style={{...S.btn(T.bg3,T.text3),fontSize:"0.75rem"}}>↻</button>
      </div>
      <div style={{display:"flex",gap:"0.3rem",marginBottom:"0.85rem",flexWrap:"wrap"}}>
        {[["todos","Todos"],["pendentes","Pendentes"],["admins","Admins"]].map(([id,label])=>
          <button key={id} onClick={()=>setFiltro(id)} style={{background:filtro===id?T.accent:T.bg3,color:filtro===id?"#fff":T.text3,border:"none",borderRadius:20,padding:"0.25rem 0.7rem",fontSize:"0.74rem",cursor:"pointer",fontFamily:"inherit",fontWeight:filtro===id?700:400}}>{label}</button>
        )}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"0.45rem"}}>
        {lista.map(u=>(<div key={u.id} style={{background:T.bg3,borderRadius:10,padding:"0.7rem 0.9rem",display:"flex",gap:"0.6rem",alignItems:"center",flexWrap:"wrap",borderLeft:`3px solid ${u.aprobado?T.ok:T.warn}`}}>
          <div style={{flex:1,minWidth:150}}>
            {editId===u.id?(
              <div style={{display:"flex",gap:"0.35rem"}}>
                <input value={editNome} onChange={e=>setEditNome(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveNome(u)} style={{...S.input,fontSize:"0.85rem",padding:"0.3rem 0.5rem"}} autoFocus/>
                <button onClick={()=>saveNome(u)} style={{...S.btn(T.accent),padding:"0.25rem 0.5rem",fontSize:"0.75rem"}}>✓</button>
                <button onClick={()=>setEditId(null)} style={{...S.btn(T.bg4,T.text3),padding:"0.25rem 0.5rem",fontSize:"0.75rem"}}>✕</button>
              </div>
            ):(<>
              <div style={{display:"flex",gap:"0.4rem",alignItems:"center",flexWrap:"wrap"}}>
                <span style={{color:T.text,fontWeight:700,fontSize:"0.88rem"}}>{u.nome||u.email.split("@")[0]}</span>
                {u.rol==="admin"&&<span style={S.tag("#e040fb")}>admin</span>}
                {!u.aprobado&&<span style={S.tag(T.warn)}>pendente</span>}
                <button onClick={()=>{setEditId(u.id);setEditNome(u.nome||"");}} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.75rem"}}>✏️</button>
              </div>
              <p style={{color:T.text4,fontSize:"0.75rem",margin:"0.15rem 0 0"}}>{u.email}</p>
            </>)}
          </div>
          <div style={{display:"flex",gap:"0.35rem"}}>
            <button onClick={()=>toggleAprobado(u)} style={{...S.btn(u.aprobado?T.bg4:T.ok,u.aprobado?T.text3:"#000"),fontSize:"0.75rem",padding:"0.3rem 0.6rem"}}>{u.aprobado?"Desactivar":"✓ Aprobar"}</button>
            <button onClick={()=>toggleRol(u)} style={{...S.btn(T.bg4,u.rol==="admin"?"#e040fb":T.text3),fontSize:"0.75rem",padding:"0.3rem 0.6rem"}}>{u.rol==="admin"?"↓ user":"↑ admin"}</button>
          </div>
        </div>))}
        {lista.length===0&&<p style={{color:T.text4,fontSize:"0.83rem"}}>Sen usuarios neste filtro.</p>}
      </div>
    </div>
  </div>);
}

export function AdminGrupos({T,S}){
  const [grupos,setGrupos]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");

  const cargar=useCallback(async()=>{
    setLoading(true);
    const g=await listarTodosGrupos();
    setGrupos(g);setLoading(false);
  },[]);
  useEffect(()=>{cargar();},[cargar]);

  const lista=grupos.filter(g=>!search||g.nombre?.toLowerCase().includes(search.toLowerCase())||g.perfis?.nome?.toLowerCase().includes(search.toLowerCase()));

  if(loading)return<p style={{color:T.text3,fontSize:"0.85rem"}}>Cargando...</p>;

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.85rem",flexWrap:"wrap",gap:"0.5rem"}}>
      <p style={{...S.ptitle(T.accent),margin:0}}>Todos os grupos ({grupos.length})</p>
      <button onClick={cargar} style={{...S.btn(T.bg3,T.text3),fontSize:"0.75rem"}}>↻</button>
    </div>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar por grupo ou propietario..." style={{...S.input,marginBottom:"0.85rem"}}/>
    {lista.length===0&&<p style={{color:T.text4,fontSize:"0.83rem"}}>Sen grupos que amosar.</p>}
    <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
      {lista.map(g=>(<div key={g.id} style={{...S.panel,padding:"0.7rem 0.9rem",borderLeft:`3px solid ${g.color||T.accent}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"0.4rem",marginBottom:"0.4rem"}}>
          <span style={{color:T.text,fontWeight:700,fontSize:"0.9rem"}}>{g.nombre}</span>
          <span style={{color:T.text4,fontSize:"0.75rem"}}>propietario: {g.perfis?.nome||g.perfis?.email||"descoñecido"}</span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem"}}>
          {(g.miembros||[]).length===0&&<span style={{color:T.text4,fontSize:"0.78rem"}}>Sen membros</span>}
          {(g.miembros||[]).map((m,i)=><span key={i} style={{background:T.bg3,borderRadius:7,padding:"0.18rem 0.55rem",fontSize:"0.78rem",color:T.text2}}>{m}</span>)}
        </div>
      </div>))}
    </div>
  </div>);
}
