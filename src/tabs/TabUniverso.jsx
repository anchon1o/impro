// ============================================================
// tabs/TabUniverso.jsx
// Universo Impro: directorio real de compañías, festivais, escolas
// e persoas. Respaldado por Supabase, con formulario de achega.
// ============================================================

import { useState, useEffect } from 'react';
import { useTheme, mkS, useAuth, UID } from '../core.jsx';
import { UNIVERSO_DATA, UNIVERSO_TIPOS } from '../datos.js';
import { LIGAZONS, camposDeCategoria } from '../universoModelo.js';
import { cargarUniverso, engadirUniverso, cargarCategorias } from '../universo.js';

export function TabUniverso(){
  const {T}=useTheme();const S=mkS(T);
  const {logueado,pedirLogin,user}=useAuth();
  const [filtro,setFiltro]=useState("todos");
  const [search,setSearch]=useState("");
  const [sel,setSel]=useState(null);
  // Categorías desde BD (M07); se aínda non hai táboa, cae á constante do código.
  const [cats,setCats]=useState(()=>UNIVERSO_TIPOS.filter(t=>t.id!=="todos").map(t=>({id:t.id,nome:t.label,emoji:t.emoji,plantilla:"entidade"})));
  useEffect(()=>{cargarCategorias().then(c=>{if(c&&c.length)setCats(c.filter(x=>x.activa!==false));});},[]);
  const [datos,setDatos]=useState(UNIVERSO_DATA);
  const [cargando,setCargando]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [enviado,setEnviado]=useState(false);

  const FORM0={tipo:"compañía",nome:"",pais:"🇪🇸",cidade:"",desc:"",web:"",tags:""};
  const [form,setForm]=useState(FORM0);

  useEffect(()=>{
    cargarUniverso(UNIVERSO_DATA).then(d=>{setDatos(d);setCargando(false);});
  },[]);

  const lista=datos.filter(x=>(filtro==="todos"||x.tipo===filtro)&&(!search||x.nome.toLowerCase().includes(search.toLowerCase())||x.desc.toLowerCase().includes(search.toLowerCase())||(x.tags||[]).some(t=>t.toLowerCase().includes(search.toLowerCase()))));

  const TIPO_COL={"compañía":"#e040fb",festival:"#ffd740",escola:"#40c4ff",persoa:"#69f0ae",proxecto:"#ff6e40"};

  const abrirForm=()=>{
    if(!logueado){pedirLogin();return;}
    setForm(FORM0);setShowForm(true);setEnviado(false);
  };

  const enviarEntrada=async()=>{
    if(!form.nome.trim()||!form.desc.trim())return;
    const entry={
      tipo:form.tipo,nome:form.nome.trim(),pais:form.pais.trim()||"🌍",
      cidade:form.cidade.trim(),desc:form.desc.trim(),web:form.web.trim(),
      tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean),
      logo:{"compañía":"🎭",festival:"🎉",escola:"📚",persoa:"👤",proxecto:"🚀"}[form.tipo]||"🎭",
    };
    const nova=await engadirUniverso(entry,user?.id);
    if(nova){setDatos(d=>[...d,nova]);setEnviado(true);setTimeout(()=>{setShowForm(false);setEnviado(false);},1800);}
  };

  // ── Ficha rica (M06) ──
  // Só se pintan os campos que teñan contido. Como `datos` e `ligazons` só
  // gardan o que ten valor, a regra sae soa dos datos.
  if(sel){
    const cor=TIPO_COL[sel.tipo]||T.accent;
    const cat=cats.find(c=>c.id===sel.tipo);
    const {opcionais}=camposDeCategoria(cat);
    const lig=sel.ligazons||{};
    const url=u=>String(u||"").startsWith("http")?u:`https://${u}`;
    const dat=sel.datos||{};
    const conValor=opcionais.filter(c=>{
      const v=c.columna?sel[c.id==="data_inicio"?"dataInicio":c.id==="data_fin"?"dataFin":c.id]:dat[c.id];
      return !(v===undefined||v===null||v===""||(Array.isArray(v)&&!v.length));
    });
    const valor=c=>c.columna?sel[c.id==="data_inicio"?"dataInicio":c.id==="data_fin"?"dataFin":c.id]:dat[c.id];

    return(<div>
      <button onClick={()=>setSel(null)} style={{...S.btn(T.bg3,T.text2),marginBottom:"1rem"}}>← Universo Impro</button>
      <div style={{...S.panel,border:`1.5px solid ${cor}33`,borderTop:`4px solid ${cor}`}}>

        <div style={{display:"flex",gap:"1rem",alignItems:"flex-start",marginBottom:"1rem",flexWrap:"wrap"}}>
          {/* Identidade visual: imaxe se a hai, emoji se non */}
          {sel.logoUrl
            ?<img src={sel.logoUrl} alt="" onError={e=>{e.currentTarget.style.display="none";}} style={{width:64,height:64,borderRadius:12,objectFit:"contain",background:T.bg3,flexShrink:0}}/>
            :<div style={{fontSize:"3rem",lineHeight:1,flexShrink:0}}>{sel.logo}</div>}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:"0.5rem",alignItems:"center",flexWrap:"wrap",marginBottom:"0.3rem"}}>
              <span style={S.tag(cor)}>{cat?`${cat.emoji} ${cat.nome}`:sel.tipo}</span>
              {(sel.pais||sel.cidade)&&<span style={{color:T.text3,fontSize:"0.82rem"}}>{sel.pais} {sel.cidade}</span>}
              {sel.estado==="pendente"&&<span style={S.tag("#ffd740")}>pendente de revisión</span>}
              {sel.estado==="rexeitada"&&<span style={S.tag("#ff6e40")}>rexeitada</span>}
              {sel.activo===false&&<span style={{...S.tag(T.text4),background:T.bg3}}>inactiva</span>}
            </div>
            <h2 style={{color:T.text,fontWeight:900,fontSize:"1.3rem",margin:"0 0 0.5rem"}}>{sel.nome}</h2>
            <p style={{color:T.text2,fontSize:"0.88rem",lineHeight:1.6,margin:0}}>{sel.desc}</p>
          </div>
        </div>

        {(sel.dataInicio||sel.dataFin)&&<p style={{color:T.text3,fontSize:"0.8rem",margin:"0 0 0.8rem"}}>
          🗓 {sel.dataInicio||"?"}{sel.dataFin?` — ${sel.dataFin}`:" — en activo"}
        </p>}

        {(sel.tags||[]).length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem",marginBottom:"1rem"}}>
          {sel.tags.map(tag=><span key={tag} style={{...S.tag(T.text4),background:T.bg3}}>#{tag}</span>)}
        </div>}

        {/* Campos opcionais da plantilla da categoría */}
        {conValor.length>0&&<div style={{borderTop:`1px solid ${T.border}`,paddingTop:"0.9rem",marginBottom:"1rem",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(220px,100%),1fr))",gap:"0.75rem"}}>
          {conValor.map(c=>{
            const v=valor(c);
            return(<div key={c.id}>
              <p style={{color:T.text4,fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",margin:"0 0 0.2rem"}}>{c.label}</p>
              {Array.isArray(v)
                ?<p style={{color:T.text2,fontSize:"0.83rem",margin:0,lineHeight:1.5}}>{v.join(" · ")}</p>
                :<p style={{color:T.text2,fontSize:"0.83rem",margin:0,lineHeight:1.5}}>{String(v)}</p>}
            </div>);
          })}
        </div>}

        {/* Ligazóns clicables */}
        {(LIGAZONS.some(L=>lig[L.id])||(lig.outras||[]).length>0)&&<div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem",borderTop:`1px solid ${T.border}`,paddingTop:"0.9rem"}}>
          {LIGAZONS.filter(L=>lig[L.id]).map(L=>(
            <a key={L.id} href={url(lig[L.id])} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"0.35rem",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,padding:"0.4rem 0.7rem",fontSize:"0.8rem",color:T.text2,textDecoration:"none",minHeight:38,boxSizing:"border-box"}}>
              <span>{L.emoji}</span><span>{L.label}</span>
            </a>))}
          {(lig.outras||[]).map((o,i)=>(
            <a key={i} href={url(o.url)} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"0.35rem",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,padding:"0.4rem 0.7rem",fontSize:"0.8rem",color:T.text2,textDecoration:"none",minHeight:38,boxSizing:"border-box"}}>
              <span>🔗</span><span>{o.etiqueta||o.url}</span>
            </a>))}
        </div>}
      </div>
    </div>);
  }

  return(<div>
    <div style={{...S.panel,marginBottom:"1rem",background:T.accent+"08",border:`1.5px solid ${T.accent}22`}}>
      <p style={{color:T.text,fontWeight:700,margin:"0 0 0.2rem",fontSize:"0.95rem"}}>🌍 Universo Impro</p>
      <p style={{color:T.text3,fontSize:"0.82rem",margin:0}}>Compañías, festivais, escolas e persoas reais que fan o impro. Datos verificados manualmente. Coñeces algunha máis? Engádea ti.</p>
    </div>

    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.85rem",flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...S.input,flex:1,minWidth:160}}/>
      <button onClick={abrirForm} style={{...S.btn(T.accent),flexShrink:0}}>{logueado?"+ Engadir entrada":"🔒 Engadir entrada"}</button>
    </div>

    {showForm&&<div style={{...S.panel,marginBottom:"1rem",border:`1.5px solid ${T.accent}44`}}>
      {enviado?(
        <div style={{textAlign:"center",padding:"1rem 0"}}>
          <p style={{fontSize:"2rem",margin:"0 0 0.4rem"}}>✓</p>
          <p style={{color:"#69f0ae",fontWeight:700}}>Grazas! Queda pendente de revisión antes de ser visible para todos.</p>
        </div>
      ):(<>
        <p style={S.ptitle(T.accent)}>Nova entrada</p>
        <p style={{color:T.text4,fontSize:"0.76rem",marginBottom:"0.75rem"}}>Só datos reais e verificables. Un admin revisará a entrada antes de publicala.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(140px,100%),1fr))",gap:"0.5rem",marginBottom:"0.5rem"}}>
          <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} style={S.input}>
            {cats.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>)}
          </select>
          <input value={form.pais} onChange={e=>setForm(f=>({...f,pais:e.target.value}))} placeholder="🇪🇸 País (emoji)" style={S.input}/>
          <input value={form.cidade} onChange={e=>setForm(f=>({...f,cidade:e.target.value}))} placeholder="Cidade" style={S.input}/>
        </div>
        <input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Nome" style={{...S.input,marginBottom:"0.5rem"}}/>
        <textarea value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Descrición breve e real..." style={{...S.input,minHeight:70,marginBottom:"0.5rem",resize:"vertical"}}/>
        <input value={form.web} onChange={e=>setForm(f=>({...f,web:e.target.value}))} placeholder="Web (opcional)" style={{...S.input,marginBottom:"0.5rem"}}/>
        <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="Etiquetas separadas por coma" style={{...S.input,marginBottom:"0.75rem"}}/>
        <div style={{display:"flex",gap:"0.5rem"}}>
          <button onClick={enviarEntrada} disabled={!form.nome.trim()||!form.desc.trim()} style={{...S.btn(T.accent),opacity:(!form.nome.trim()||!form.desc.trim())?0.4:1}}>Enviar</button>
          <button onClick={()=>setShowForm(false)} style={S.btn(T.bg3,T.text3)}>Cancelar</button>
        </div>
      </>)}
    </div>}

    <div style={{display:"flex",gap:"0.3rem",marginBottom:"1rem",flexWrap:"wrap"}}>
      {UNIVERSO_TIPOS.map(t=><button key={t.id} onClick={()=>setFiltro(t.id)} style={{background:filtro===t.id?(TIPO_COL[t.id]||T.accent):T.bg3,color:filtro===t.id?"#000":T.text3,border:"none",borderRadius:20,padding:"0.28rem 0.75rem",fontSize:"0.74rem",fontWeight:filtro===t.id?700:400,cursor:"pointer",fontFamily:"inherit"}}>{t.emoji} {t.label}</button>)}
      <span style={{color:T.text4,fontSize:"0.75rem",alignSelf:"center",marginLeft:"auto"}}>{cargando?"cargando...":`${lista.length} entradas`}</span>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(260px,100%),1fr))",gap:"0.6rem"}}>
      {lista.map(item=>(<button key={item.id} onClick={()=>setSel(item)} style={{...S.panel,cursor:"pointer",textAlign:"left",width:"100%",border:`1.5px solid ${T.border}`,borderTop:`3px solid ${TIPO_COL[item.tipo]||T.accent}`,transition:"all 0.15s"}}>
        <div style={{display:"flex",gap:"0.65rem",alignItems:"flex-start"}}>
          <span style={{fontSize:"1.6rem",lineHeight:1,flexShrink:0}}>{item.logo}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:"0.4rem",alignItems:"center",marginBottom:"0.2rem",flexWrap:"wrap"}}>
              <span style={S.tag(TIPO_COL[item.tipo]||T.accent)}>{item.tipo}</span>
              <span style={{color:T.text3,fontSize:"0.72rem"}}>{item.pais}</span>
              {item.verificado===false&&<span style={S.tag("#ffd740")}>sen verificar</span>}
            </div>
            <p style={{color:T.text,fontWeight:700,margin:"0 0 0.2rem",fontSize:"0.9rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.nome}</p>
            <p style={{color:T.text3,fontSize:"0.78rem",margin:0,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.desc}</p>
          </div>
        </div>
      </button>))}
    </div>
    {lista.length===0&&!cargando&&<div style={{...S.panel,textAlign:"center",padding:"2.5rem 1rem"}}>
      <p style={{fontSize:"2rem",margin:"0 0 0.5rem"}}>🔍</p>
      <p style={{color:T.text4}}>Sen resultados para "{search}"</p>
    </div>}
  </div>);
}
