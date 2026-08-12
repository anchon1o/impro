// ============================================================
// tabs/TabManual.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState } from 'react';
import { t, useTheme, mkS } from '../core.jsx';
import { MANUAL_SECCIONES } from '../datos.js';

export function TabManual(){
  const {T}=useTheme();const S=mkS(T);
  const [sel,setSel]=useState(null);

  if(sel){
    const sec=MANUAL_SECCIONES.find(s=>s.id===sel);
    return(<div>
      <button onClick={()=>setSel(null)} style={{...S.btn(T.bg3,T.text2),marginBottom:"1rem"}}>← Manual</button>
      <div style={{...S.panel,border:`1.5px solid ${T.accent}33`}}>
        <div style={{display:"flex",gap:"0.75rem",alignItems:"center",marginBottom:"0.85rem"}}>
          <span style={{fontSize:"1.6rem"}}>{sec.emoji}</span>
          <div><h2 style={{color:T.text,fontWeight:900,fontSize:"1.2rem",margin:0}}>{sec.titulo}</h2><p style={{color:T.text3,fontSize:"0.82rem",margin:"0.1rem 0 0",lineHeight:1.5}}>{sec.intro}</p></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          {sec.items.map((item,i)=>(
            <div key={i} style={{background:T.bg3,borderRadius:10,padding:"0.85rem 1rem",borderLeft:`3px solid ${T.accent}`}}>
              <p style={{color:T.text,fontWeight:700,fontSize:"0.88rem",margin:"0 0 0.3rem"}}>{item.t}</p>
              <p style={{color:T.text2,fontSize:"0.83rem",margin:0,lineHeight:1.6}}>{item.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>);
  }

  return(<div>
    <div style={{...S.panel,marginBottom:"1rem",border:`1.5px solid ${T.accent}22`,background:T.accent+"08"}}>
      <p style={{color:T.text,fontWeight:700,margin:"0 0 0.3rem",fontSize:"0.95rem"}}>📘 Manual de ImproApp</p>
      <p style={{color:T.text3,fontSize:"0.83rem",margin:0,lineHeight:1.5}}>Guía completa de todas as funcións. Toca unha sección para ver os detalles.</p>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(240px,100%),1fr))",gap:"0.55rem"}}>
      {MANUAL_SECCIONES.map(sec=>(
        <button key={sec.id} onClick={()=>setSel(sec.id)} style={{...S.panel,cursor:"pointer",textAlign:"left",width:"100%",border:`1.5px solid ${T.border}`,display:"flex",gap:"0.85rem",alignItems:"flex-start"}}>
          <span style={{fontSize:"1.5rem",flexShrink:0,lineHeight:1,marginTop:"0.1rem"}}>{sec.emoji}</span>
          <div>
            <p style={{color:T.text,fontWeight:700,margin:"0 0 0.25rem",fontSize:"0.9rem"}}>{sec.titulo}</p>
            <p style={{color:T.text3,fontSize:"0.78rem",margin:0,lineHeight:1.4}}>{sec.intro}</p>
          </div>
        </button>
      ))}
    </div>
  </div>);
}
