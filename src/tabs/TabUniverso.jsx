// ============================================================
// tabs/TabUniverso.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState } from 'react';
import { t, useTheme, mkS } from '../core.jsx';
import { UNIVERSO_DATA, UNIVERSO_TIPOS } from '../datos.js';

export function TabUniverso(){
  const {T}=useTheme();const S=mkS(T);
  const [filtro,setFiltro]=useState("todos");
  const [search,setSearch]=useState("");
  const [sel,setSel]=useState(null);

  const lista=UNIVERSO_DATA.filter(x=>(filtro==="todos"||x.tipo===filtro)&&(!search||x.nome.toLowerCase().includes(search.toLowerCase())||x.desc.toLowerCase().includes(search.toLowerCase())||x.tags.some(t=>t.toLowerCase().includes(search.toLowerCase()))));

  const TIPO_COL={compañía:"#e040fb",festival:"#ffd740",escola:"#40c4ff",persoa:"#69f0ae",proxecto:"#ff6e40"};

  if(sel)return(<div>
    <button onClick={()=>setSel(null)} style={{...S.btn(T.bg3,T.text2),marginBottom:"1rem"}}>← Universo Impro</button>
    <div style={{...S.panel,border:`1.5px solid ${TIPO_COL[sel.tipo]||T.accent}33`,borderTop:`4px solid ${TIPO_COL[sel.tipo]||T.accent}`}}>
      <div style={{display:"flex",gap:"1rem",alignItems:"flex-start",marginBottom:"1rem",flexWrap:"wrap"}}>
        <div style={{fontSize:"3rem",lineHeight:1,flexShrink:0}}>{sel.logo}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:"0.5rem",alignItems:"center",flexWrap:"wrap",marginBottom:"0.3rem"}}>
            <span style={S.tag(TIPO_COL[sel.tipo]||T.accent)}>{sel.tipo}</span>
            <span style={{color:T.text3,fontSize:"0.82rem"}}>{sel.pais} {sel.cidade}</span>
          </div>
          <h2 style={{color:T.text,fontWeight:900,fontSize:"1.3rem",margin:"0 0 0.5rem"}}>{sel.nome}</h2>
          <p style={{color:T.text2,fontSize:"0.88rem",lineHeight:1.6,margin:0}}>{sel.desc}</p>
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem",marginBottom:"1rem"}}>
        {sel.tags.map(tag=><span key={tag} style={{...S.tag(T.text4),background:T.bg3}}>#{tag}</span>)}
      </div>
      {sel.web&&<a href={`https://${sel.web}`} target="_blank" rel="noopener noreferrer" style={{...S.btn(TIPO_COL[sel.tipo]||T.accent),display:"inline-block",textDecoration:"none",color:"#000"}}>🌐 Visitar web</a>}
    </div>
  </div>);

  return(<div>
    <div style={{...S.panel,marginBottom:"1rem",background:T.accent+"08",border:`1.5px solid ${T.accent}22`}}>
      <p style={{color:T.text,fontWeight:700,margin:"0 0 0.2rem",fontSize:"0.95rem"}}>🌍 Universo Impro</p>
      <p style={{color:T.text3,fontSize:"0.82rem",margin:0}}>Compañías, festivais, escolas e persoas que fan o impro mundial. Toca calquera para saber máis.</p>
    </div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.85rem",flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...S.input,flex:1}}/>
      <span style={{color:T.text4,fontSize:"0.78rem",alignSelf:"center"}}>{lista.length}</span>
    </div>
    <div style={{display:"flex",gap:"0.3rem",marginBottom:"1rem",flexWrap:"wrap"}}>
      {UNIVERSO_TIPOS.map(t=><button key={t.id} onClick={()=>setFiltro(t.id)} style={{background:filtro===t.id?(TIPO_COL[t.id]||T.accent):T.bg3,color:filtro===t.id?"#000":T.text3,border:"none",borderRadius:20,padding:"0.28rem 0.75rem",fontSize:"0.74rem",fontWeight:filtro===t.id?700:400,cursor:"pointer",fontFamily:"inherit"}}>{t.emoji} {t.label}</button>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"0.6rem"}}>
      {lista.map(item=>(<button key={item.id} onClick={()=>setSel(item)} style={{...S.panel,cursor:"pointer",textAlign:"left",width:"100%",border:`1.5px solid ${T.border}`,borderTop:`3px solid ${TIPO_COL[item.tipo]||T.accent}`,transition:"all 0.15s"}}>
        <div style={{display:"flex",gap:"0.65rem",alignItems:"flex-start"}}>
          <span style={{fontSize:"1.6rem",lineHeight:1,flexShrink:0}}>{item.logo}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:"0.4rem",alignItems:"center",marginBottom:"0.2rem",flexWrap:"wrap"}}>
              <span style={S.tag(TIPO_COL[item.tipo]||T.accent)}>{item.tipo}</span>
              <span style={{color:T.text3,fontSize:"0.72rem"}}>{item.pais}</span>
            </div>
            <p style={{color:T.text,fontWeight:700,margin:"0 0 0.2rem",fontSize:"0.9rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.nome}</p>
            <p style={{color:T.text3,fontSize:"0.78rem",margin:0,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.desc}</p>
          </div>
        </div>
      </button>))}
    </div>
    {lista.length===0&&<div style={{...S.panel,textAlign:"center",padding:"2.5rem 1rem"}}>
      <p style={{fontSize:"2rem",margin:"0 0 0.5rem"}}>🔍</p>
      <p style={{color:T.text4}}>Sen resultados para "{search}"</p>
    </div>}
  </div>);
}
