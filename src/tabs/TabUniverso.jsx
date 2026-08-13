// ============================================================
// tabs/TabUniverso.jsx
// Universo Impro: directorio real de compañías, festivais, escolas
// e persoas. Respaldado por Supabase, con formulario de achega.
// ============================================================

import { useState, useEffect } from 'react';
import { useTheme, mkS, useAuth, UID } from '../core.jsx';
import { UNIVERSO_DATA, UNIVERSO_TIPOS } from '../datos.js';
import { LIGAZONS, camposDeCategoria, urlLigazon, etiquetaLigazon } from '../universoModelo.js';
import { UniversoForm } from './UniversoForm.jsx';
import { cargarUniverso, engadirUniverso, cargarCategorias } from '../universo.js';

export function TabUniverso(){
  const {T}=useTheme();const S=mkS(T);
  const {logueado,pedirLogin,user}=useAuth();
  const [filtro,setFiltro]=useState("todos");
  const [search,setSearch]=useState("");
  const [sel,setSel]=useState(null);
  // Categorías desde BD (M07); se aínda non hai táboa, cae á constante do código.
  const [cats,setCats]=useState(()=>UNIVERSO_TIPOS.filter(t=>t.id!=="todos").map(t=>({id:t.id,nome:t.label,emoji:t.emoji,plantilla:"entidade"})));
  useEffect(()=>{cargarCategorias().then(r=>{const c=Array.isArray(r)?r:(r?.cats||[]);if(c.length)setCats(c.filter(x=>x.activa!==false));});},[]);
  const [datos,setDatos]=useState(UNIVERSO_DATA);
  const [cargando,setCargando]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [enviado,setEnviado]=useState(false);
  const [erroEnvio,setErroEnvio]=useState("");


  useEffect(()=>{
    cargarUniverso(UNIVERSO_DATA).then(d=>{setDatos(d);setCargando(false);});
  },[]);

  const lista=datos.filter(x=>(filtro==="todos"||x.tipo===filtro)&&(!search||x.nome.toLowerCase().includes(search.toLowerCase())||x.desc.toLowerCase().includes(search.toLowerCase())||(x.tags||[]).some(t=>t.toLowerCase().includes(search.toLowerCase()))));

  const TIPO_COL={"compañía":"#e040fb",festival:T.warn,escola:T.info,persoa:T.ok,proxecto:T.danger};

  // M08: xa non se esixe conta. A política RLS acepta propostas anónimas
  // e forza estado='pendente' en todos os casos.
  const abrirForm=()=>{setShowForm(true);setEnviado(false);};

  const enviarEntrada=async(ficha)=>{
    const nova=await engadirUniverso(ficha,user?.id);
    if(!nova){setErroEnvio("Non se puido enviar. Se xa enviaches varias propostas hai pouco, agarda un anaco.");return;}
    setErroEnvio("");
    // Non se engade á lista: queda pendente e non debe verse como publicada.
    // A quen ten conta si lla mostra a política RLS ao recargar.
    setEnviado(true);setShowForm(false);
  };

  // ── Ficha rica (M06) ──
  // Só se pintan os campos que teñan contido. Como `datos` e `ligazons` só
  // gardan o que ten valor, a regra sae soa dos datos.
  if(sel){
    const cor=TIPO_COL[sel.tipo]||T.accent;
    const cat=cats.find(c=>c.id===sel.tipo);
    const {opcionais}=camposDeCategoria(cat);
    const lig=sel.ligazons||{};
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
              {sel.estado==="pendente"&&<span style={S.tag(T.warn)}>pendente de revisión</span>}
              {sel.estado==="rexeitada"&&<span style={S.tag(T.danger)}>rexeitada</span>}
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
            <a key={i} href={urlLigazon("web",o.url)} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"0.35rem",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,padding:"0.4rem 0.7rem",fontSize:"0.8rem",color:T.text2,textDecoration:"none",minHeight:38,boxSizing:"border-box"}}>
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

    {enviado&&!showForm&&<div style={{...S.panel,marginBottom:"1rem",border:`1.5px solid ${T.ok}44`,textAlign:"center",padding:"1.1rem"}}>
      <p style={{fontSize:"1.8rem",margin:"0 0 0.35rem"}}>✓</p>
      <p style={{color:T.ok,fontWeight:700,margin:0}}>Grazas! Queda pendente de revisión antes de ser visible.</p>
      <button onClick={()=>setEnviado(false)} style={{...S.btn(T.bg3,T.text2),marginTop:"0.8rem"}}>Pechar</button>
    </div>}

    {erroEnvio&&<p style={{color:T.danger,fontSize:"0.83rem",marginBottom:"0.8rem"}}>{erroEnvio}</p>}

    {showForm&&<UniversoForm cats={cats} logueado={logueado} onEnviar={enviarEntrada} onCancelar={()=>{setShowForm(false);setErroEnvio("");}}/>}

    <div style={{display:"flex",gap:"0.3rem",marginBottom:"1rem",flexWrap:"wrap"}}>
      {[{id:"todos",emoji:"🌍",nome:"Todo"},...cats].map(t=><button key={t.id} onClick={()=>setFiltro(t.id)} style={{background:filtro===t.id?(TIPO_COL[t.id]||T.accent):T.bg3,color:filtro===t.id?"#000":T.text3,border:"none",borderRadius:20,padding:"0.28rem 0.75rem",fontSize:"0.74rem",fontWeight:filtro===t.id?700:400,cursor:"pointer",fontFamily:"inherit"}}>{t.emoji} {t.nome}</button>)}
      <span style={{color:T.text4,fontSize:"0.75rem",alignSelf:"center",marginLeft:"auto"}}>{cargando?"cargando...":`${lista.length} entradas`}</span>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(260px,100%),1fr))",gap:"0.6rem"}}>
      {lista.map(item=>(<button key={item.id} onClick={()=>setSel(item)} style={{...S.panel,cursor:"pointer",textAlign:"left",width:"100%",borderStyle:"solid",borderWidth:"3px 1.5px 1.5px 1.5px",borderTopColor:TIPO_COL[item.tipo]||T.accent,borderRightColor:T.border,borderBottomColor:T.border,borderLeftColor:T.border,transition:"all 0.15s"}}>
        <div style={{display:"flex",gap:"0.65rem",alignItems:"flex-start"}}>
          <span style={{fontSize:"1.6rem",lineHeight:1,flexShrink:0}}>{item.logo}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:"0.4rem",alignItems:"center",marginBottom:"0.2rem",flexWrap:"wrap"}}>
              <span style={S.tag(TIPO_COL[item.tipo]||T.accent)}>{item.tipo}</span>
              <span style={{color:T.text3,fontSize:"0.72rem"}}>{item.pais}</span>
              {item.verificado===false&&<span style={S.tag(T.warn)}>sen verificar</span>}
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
