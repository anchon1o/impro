import { useState, useEffect } from 'react';
import { useTheme, mkS, rexistrarTipos } from '../core.jsx';
import { cargarTiposDinamica, gardarTipoDinamica, borrarTipoDinamica } from '../db.js';

// Tipos de dinámica, xestionables igual cás categorías de Universo.
// A cor non é un valor fixo senón un token do tema, para que os tipos se
// repinten ao cambiar de tema como o resto da interface.

const CORES = [
  {id:'accent', label:'Acento'}, {id:'ok', label:'Verde'},
  {id:'warn', label:'Amarelo'},  {id:'info', label:'Azul'},
  {id:'danger', label:'Laranxa'},{id:'alt', label:'Rosa'},
  {id:'muted', label:'Gris'},
];

const BALEIRO = {id:'',nome:'',emoji:'🎯',descricion:'',cor:'accent',orde:100,activo:true};
const aSlug = t => String(t||'').toLowerCase().trim()
  .replace(/\s+/g,'-').replace(/[^a-z0-9ñáéíóúü-]/g,'').slice(0,40);

export function AdminTiposDinamica(){
  const {T}=useTheme(); const S=mkS(T);
  const [tipos,setTipos]=useState([]);
  const [form,setForm]=useState(null);
  const [editando,setEditando]=useState(null);
  const [msg,setMsg]=useState('');
  const [erro,setErro]=useState('');
  const [cargando,setCargando]=useState(true);

  const recargar=()=>cargarTiposDinamica().then(r=>{
    const l=Array.isArray(r)?r:(r?.tipos||[]);
    setTipos(l); rexistrarTipos(l); setErro(r?.erro||''); setCargando(false);
  });
  useEffect(()=>{recargar();},[]);

  const gardar=async()=>{
    if(!form.nome.trim()){setMsg('Fai falta un nome.');return;}
    const id=editando||aSlug(form.id||form.nome);
    if(!id){setMsg('Non se puido xerar un identificador.');return;}
    if(!editando&&tipos.some(t=>t.id===id)){setMsg(`Xa existe un tipo con id «${id}».`);return;}
    const ok=await gardarTipoDinamica({...form,id});
    setMsg(ok?'Gardado.':'Non se puido gardar.');
    if(ok){setForm(null);setEditando(null);recargar();}
  };

  const eliminar=async t=>{
    if(!confirm(`Borrar o tipo «${t.nome}»?`))return;
    const r=await borrarTipoDinamica(t.id);
    setMsg(r.ok?'Borrado.':`Non se pode borrar. ${r.motivo||''}`);
    if(r.ok)recargar();
  };

  return(<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.8rem'}}>
      <div>
        <p style={{...S.ptitle(T.accent),margin:0}}>Tipos de dinámica</p>
        <p style={{...S.caption,margin:'0.2rem 0 0'}}>Son as categorías que aparecen ao crear ou filtrar dinámicas.</p>
      </div>
      {!form&&<button onClick={()=>{setForm({...BALEIRO});setEditando(null);setMsg('');}} style={S.btn(T.accent)}>+ Novo tipo</button>}
    </div>

    {msg&&<p style={{color:msg.startsWith('Non')||msg.startsWith('Xa')||msg.startsWith('Fai')?T.danger:T.ok,fontSize:'0.82rem',marginBottom:'0.7rem'}}>{msg}</p>}

    {erro&&<div style={{background:T.danger+'12',borderStyle:'solid',borderWidth:1,borderColor:T.danger+'44',borderRadius:8,padding:'0.8rem',marginBottom:'0.8rem'}}>
      <p style={{color:T.danger,fontWeight:700,fontSize:'0.82rem',margin:'0 0 0.25rem'}}>Usando a lista por defecto</p>
      <p style={{color:T.text3,fontSize:'0.76rem',margin:0,fontFamily:'monospace'}}>{erro}</p>
      <p style={{color:T.text3,fontSize:'0.76rem',margin:'0.5rem 0 0'}}>Executa <code>supabase_dinamicas_tipos.sql</code> para poder editalos.</p>
    </div>}

    {form&&<div style={{...S.panel,marginBottom:'1rem',borderStyle:'solid',borderWidth:1,borderColor:T.accent+'44'}}>
      <p style={S.ptitle(T.accent)}>{editando?`Editar «${editando}»`:'Novo tipo'}</p>
      <div style={{display:'grid',gridTemplateColumns:'56px 1fr 80px',gap:'0.4rem',marginBottom:'0.4rem'}}>
        <input value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} maxLength={4}
          style={{...S.input,marginBottom:0,textAlign:'center',fontSize:'1.1rem'}}/>
        <input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Nome" style={{...S.input,marginBottom:0}}/>
        <input type="number" value={form.orde} onChange={e=>setForm(f=>({...f,orde:e.target.value}))} placeholder="Orde" style={{...S.input,marginBottom:0}}/>
      </div>
      <input value={form.descricion} onChange={e=>setForm(f=>({...f,descricion:e.target.value}))}
        placeholder="Cando se usa este tipo (opcional)" style={{...S.input,marginBottom:'0.6rem'}}/>

      <p style={{color:T.text4,fontSize:'0.7rem',margin:'0 0 0.3rem'}}>Cor</p>
      <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap',marginBottom:'0.7rem'}}>
        {CORES.map(c=>(
          <button key={c.id} onClick={()=>setForm(f=>({...f,cor:c.id}))} title={c.label} style={{
            background:form.cor===c.id?T[c.id]+'33':T.bg3,
            borderStyle:'solid',borderWidth:form.cor===c.id?2:1,
            borderColor:T[c.id],borderRadius:8,padding:'0.3rem 0.6rem',
            cursor:'pointer',fontFamily:'inherit',fontSize:'0.74rem',
            color:form.cor===c.id?T[c.id]:T.text3}}>{c.label}</button>))}
      </div>

      <label style={{display:'flex',alignItems:'center',gap:'0.5rem',color:T.text2,fontSize:'0.82rem',marginBottom:'0.8rem',cursor:'pointer'}}>
        <input type="checkbox" checked={form.activo} onChange={e=>setForm(f=>({...f,activo:e.target.checked}))}/>
        Activo (os inactivos non se ofrecen ao crear dinámicas)
      </label>

      <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
        <button onClick={gardar} style={S.btn(T.ok,'#000')}>Gardar</button>
        <button onClick={()=>{setForm(null);setEditando(null);setMsg('');}} style={S.btn(T.bg3,T.text2)}>Cancelar</button>
      </div>
    </div>}

    {cargando&&<p style={S.caption}>Cargando…</p>}

    <div style={{display:'flex',flexDirection:'column',gap:'0.4rem'}}>
      {tipos.map(t=>(
        <div key={t.id} style={{...S.panel,padding:'0.7rem 0.8rem',display:'flex',alignItems:'center',gap:'0.7rem',
          opacity:t.activo===false?0.5:1,borderStyle:'solid',borderWidth:'1px 1px 1px 3px',
          borderColor:T.border,borderLeftColor:T[t.cor]||T.accent}}>
          <span style={{fontSize:'1.25rem',flexShrink:0}}>{t.emoji}</span>
          <div style={{flex:1,minWidth:0}}>
            <p style={{color:T.text,fontWeight:700,fontSize:'0.9rem',margin:0}}>
              {t.nome}{t.activo===false&&<span style={{color:T.text4,fontWeight:400,fontSize:'0.74rem'}}> · inactivo</span>}
            </p>
            <p style={{color:T.text4,fontSize:'0.72rem',margin:'0.1rem 0 0',fontFamily:'monospace'}}>
              {t.id} · orde {t.orde}{t.descricion?` · ${t.descricion}`:''}
            </p>
          </div>
          <button onClick={()=>{setForm({id:t.id,nome:t.nome,emoji:t.emoji,descricion:t.descricion||'',cor:t.cor,orde:t.orde,activo:t.activo!==false});setEditando(t.id);setMsg('');}}
            style={{...S.btn(T.bg3,T.text2),padding:'0.3rem 0.6rem',fontSize:'0.76rem',flexShrink:0}}>Editar</button>
          <button onClick={()=>eliminar(t)} style={{background:'none',border:'none',color:T.danger,cursor:'pointer',fontSize:'0.95rem',padding:'0.3rem',flexShrink:0}}>🗑</button>
        </div>))}
    </div>
  </div>);
}
