import { useState, useEffect } from 'react';
import { useTheme, mkS } from '../core.jsx';
import { PLANTILLAS } from '../universoModelo.js';
import { cargarCategorias, gardarCategoria, borrarCategoria } from '../universo.js';

// M07 — Categorías de Universo xestionables desde Admin.
//
// A categoría di QUE É unha ficha; a plantilla di QUE FORMA ten.
// Separalos permite que «Compañía» e «Colectivo» compartan a forma de
// Entidade sen duplicar a definición de campos.

const BALEIRA={id:"",nome:"",emoji:"🎭",descricion:"",plantilla:"entidade",orde:100,activa:true,camposActivos:null};

// O id vai na URL e no campo `tipo` das fichas: convén que sexa estable.
const aSlug=t=>String(t||"").toLowerCase().trim()
  .replace(/\s+/g,"-").replace(/[^a-z0-9ñáéíóúü-]/g,"").slice(0,40);

export function AdminCategorias(){
  const {T}=useTheme();const S=mkS(T);
  const [cats,setCats]=useState([]);
  const [form,setForm]=useState(null);
  const [editandoId,setEditandoId]=useState(null);
  const [msg,setMsg]=useState("");
  const [cargando,setCargando]=useState(true);

  const [erroCarga,setErroCarga]=useState("");
  const recargar=()=>cargarCategorias().then(r=>{const l=Array.isArray(r)?r:(r?.cats||[]);setCats(l);setErroCarga(r?.erro||"");setCargando(false);});
  useEffect(()=>{recargar();},[]);

  const novo=()=>{setForm({...BALEIRA});setEditandoId(null);setMsg("");};
  const editar=c=>{
    setForm({id:c.id,nome:c.nome,emoji:c.emoji,descricion:c.descricion||"",
      plantilla:c.plantilla,orde:c.orde,activa:c.activa!==false,
      camposActivos:Array.isArray(c.campos_activos)?c.campos_activos:null});
    setEditandoId(c.id);setMsg("");
  };

  const gardar=async()=>{
    if(!form.nome.trim()){setMsg("Fai falta un nome.");return;}
    const id=editandoId||aSlug(form.id||form.nome);
    if(!id){setMsg("Non se puido xerar un identificador válido.");return;}
    if(!editandoId&&cats.some(c=>c.id===id)){setMsg(`Xa existe unha categoría con id «${id}».`);return;}
    const ok=await gardarCategoria({...form,id});
    setMsg(ok?"Gardado.":"Non se puido gardar.");
    if(ok){setForm(null);setEditandoId(null);recargar();}
  };

  const eliminar=async c=>{
    if(!confirm(`Borrar a categoría «${c.nome}»?`))return;
    const r=await borrarCategoria(c.id);
    // Non se permite borrar unha categoría en uso: deixaría fichas orfas
    // cun `tipo` que non existe en ningures.
    setMsg(r.ok?"Borrada.":`Non se pode borrar. ${r.motivo||""}`);
    if(r.ok)recargar();
  };

  const plant=PLANTILLAS[form?.plantilla]||PLANTILLAS.entidade;
  const activos=form?.camposActivos;
  const alternarCampo=cid=>{
    const base=Array.isArray(activos)?activos:plant.campos.map(c=>c.id);
    const novos=base.includes(cid)?base.filter(x=>x!==cid):[...base,cid];
    // Se quedan todos marcados, gárdase null = «todos os da plantilla»,
    // así engadir un campo novo á plantilla no futuro chega soa á categoría.
    setForm(f=>({...f,camposActivos:novos.length===plant.campos.length?null:novos}));
  };

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.9rem"}}>
      <p style={S.ptitle(T.accent)}>Categorías de Universo</p>
      {!form&&<button onClick={novo} style={S.btn(T.accent)}>+ Nova categoría</button>}
    </div>

    {msg&&<p style={{color:msg.startsWith("Non")||msg.startsWith("Xa")||msg.startsWith("Fai")?T.danger:T.ok,fontSize:"0.83rem",marginBottom:"0.7rem"}}>{msg}</p>}

    {form&&<div style={{...S.panel,marginBottom:"1rem",border:`1.5px solid ${T.accent}44`}}>
      <p style={S.ptitle(T.accent)}>{editandoId?`Editar «${editandoId}»`:"Nova categoría"}</p>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(140px,100%),1fr))",gap:"0.5rem",marginBottom:"0.5rem"}}>
        <input value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} placeholder="Emoji" maxLength={4} style={{...S.input,textAlign:"center",fontSize:"1.2rem"}}/>
        <input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Nome" style={S.input}/>
        <input type="number" value={form.orde} onChange={e=>setForm(f=>({...f,orde:e.target.value}))} placeholder="Orde" style={S.input}/>
      </div>

      <input value={form.descricion} onChange={e=>setForm(f=>({...f,descricion:e.target.value}))} placeholder="Descrición (opcional)" style={{...S.input,marginBottom:"0.5rem"}}/>

      <p style={{color:T.text4,fontSize:"0.72rem",margin:"0.6rem 0 0.3rem"}}>Plantilla — determina que campos opcionais ten a ficha</p>
      <select value={form.plantilla} onChange={e=>setForm(f=>({...f,plantilla:e.target.value,camposActivos:null}))} style={{...S.input,marginBottom:"0.3rem"}}>
        {Object.entries(PLANTILLAS).map(([k,p])=><option key={k} value={k}>{p.label}</option>)}
      </select>
      <p style={{color:T.text4,fontSize:"0.74rem",margin:"0 0 0.7rem",lineHeight:1.4}}>{plant.axuda}</p>

      <p style={{color:T.text4,fontSize:"0.72rem",margin:"0 0 0.35rem"}}>Campos activos ({Array.isArray(activos)?activos.length:plant.campos.length} de {plant.campos.length})</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem",marginBottom:"0.7rem"}}>
        {plant.campos.map(c=>{
          const on=!Array.isArray(activos)||activos.includes(c.id);
          return <button key={c.id} onClick={()=>alternarCampo(c.id)} style={{background:on?T.accent+"22":T.bg3,border:`1px solid ${on?T.accent:T.border}`,color:on?T.accent:T.text4,borderRadius:20,padding:"0.3rem 0.6rem",fontSize:"0.74rem",cursor:"pointer",fontFamily:"inherit"}}>{on?"✓ ":""}{c.label}</button>;
        })}
      </div>

      <label style={{display:"flex",alignItems:"center",gap:"0.5rem",color:T.text2,fontSize:"0.83rem",marginBottom:"0.9rem",cursor:"pointer"}}>
        <input type="checkbox" checked={form.activa} onChange={e=>setForm(f=>({...f,activa:e.target.checked}))}/>
        Activa (as inactivas non se ofrecen ao crear fichas novas)
      </label>

      <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
        <button onClick={gardar} style={S.btn(T.ok,"#000")}>Gardar</button>
        <button onClick={()=>{setForm(null);setEditandoId(null);setMsg("");}} style={S.btn(T.bg3,T.text2)}>Cancelar</button>
      </div>
    </div>}

    {cargando&&<p style={S.caption}>Cargando…</p>}
    {!cargando&&erroCarga&&<div style={{background:T.danger+"12",borderStyle:"solid",borderWidth:1,borderColor:T.danger+"44",borderRadius:8,padding:"0.8rem",marginBottom:"0.8rem"}}>
      <p style={{color:T.danger,fontWeight:700,fontSize:"0.82rem",margin:"0 0 0.3rem"}}>Non se puideron cargar as categorías</p>
      <p style={{color:T.text3,fontSize:"0.76rem",margin:0,fontFamily:"monospace",lineHeight:1.5}}>{erroCarga}</p>
      <p style={{color:T.text3,fontSize:"0.76rem",margin:"0.5rem 0 0",lineHeight:1.5}}>
        Se pon «permission denied», falta executar <code>supabase_universo_grants.sql</code> no SQL Editor de Supabase.
      </p>
    </div>}
    {!cargando&&!erroCarga&&cats.length===0&&<p style={S.caption}>Aínda non hai categorías. Executaches <code>supabase_universo_modelo.sql</code>?</p>}

    <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
      {cats.map(c=>(
        <div key={c.id} style={{...S.panel,padding:"0.7rem 0.8rem",display:"flex",alignItems:"center",gap:"0.7rem",opacity:c.activa===false?0.5:1}}>
          <span style={{fontSize:"1.3rem",flexShrink:0}}>{c.emoji}</span>
          <div style={{flex:1,minWidth:0}}>
            <p style={{color:T.text,fontWeight:700,fontSize:"0.9rem",margin:0}}>{c.nome} {c.activa===false&&<span style={{color:T.text4,fontWeight:400,fontSize:"0.74rem"}}>· inactiva</span>}</p>
            <p style={{color:T.text4,fontSize:"0.72rem",margin:"0.1rem 0 0",fontFamily:"monospace"}}>
              {c.id} · {PLANTILLAS[c.plantilla]?.label||c.plantilla} · orde {c.orde}
              {Array.isArray(c.campos_activos)&&` · ${c.campos_activos.length} campos`}
            </p>
          </div>
          <button onClick={()=>editar(c)} style={{...S.btn(T.bg3,T.text2),padding:"0.3rem 0.6rem",fontSize:"0.76rem",flexShrink:0}}>Editar</button>
          <button onClick={()=>eliminar(c)} style={{background:"none",border:"none",color:T.danger,cursor:"pointer",fontSize:"0.95rem",padding:"0.3rem",flexShrink:0}}>🗑</button>
        </div>))}
    </div>
  </div>);
}
