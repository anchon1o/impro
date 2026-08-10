// ============================================================
// tabs/TabReto.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState } from 'react';
import { useTheme, useEstimulos, CAT_ICONS, pick, ls, trackDin, mkS, TIPO_COLOR } from '../core.jsx';
import { DINAMICAS_BASE } from '../datos.js';

export function TabReto(){
  const {T}=useTheme();const S=mkS(T);
  const {data:ESTIMULOS}=useEstimulos();
  const [reto,setReto]=useState(null);
  const [nivel,setNivel]=useState("simple");
  const getList=cat=>{const d=ESTIMULOS[cat]||{simple:[],plus:[]};return nivel==="plus"&&d.plus.length>0?d.plus:d.simple;};
  const genReto=()=>{
    const todasDinamicas=ls.get("impro_dinamicas_v2",DINAMICAS_BASE);
    const din=pick(todasDinamicas);
    trackDin(din.nombre);
    const opts=[["PROFESIÓN","LUGAR","EMOCIÓN"],["ACCIÓN","ESTILO"],["OBJETO","EMOCIÓN","FRASE"],["PROFESIÓN","ACCIÓN"],["LUGAR","DUDA"],["SUPERPODER","PROFESIÓN","EMOCIÓN"]];
    const estimulos=pick(opts).map(cat=>({cat,word:pick(getList(cat))}));
    setReto({din,estimulos});
  };
  return(<div>
    <div style={{...S.panel,marginBottom:"1.25rem"}}>
      <p style={{color:T.text2,lineHeight:1.6,margin:"0 0 1rem",fontSize:"0.88rem"}}>Combina una dinámica, estímulos y tiempo en una propuesta lista para usar de inmediato.</p>
      <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
        <div style={{display:"flex",background:T.bg3,borderRadius:10,padding:3,gap:2}}>
          {[["simple","◆ Simple"],["plus","⭐ Plus"]].map(([v,l])=>(
            <button key={v} onClick={()=>setNivel(v)} style={{...S.btn(v==="plus"&&nivel==="plus"?T.accent:v==="simple"&&nivel==="simple"?T.bg2:"transparent",v===nivel?(v==="plus"?"#fff":T.text):T.text3),borderRadius:8,padding:"0.35rem 0.65rem",fontSize:"0.78rem"}}>{l}</button>
          ))}
        </div>
        <button onClick={genReto} style={{...S.btn(T.accent),flex:1}}>⚡ Generar reto</button>
      </div>
    </div>
    {reto?(<div style={{animation:"fadeIn 0.35s ease"}}>
      <div style={{...S.panel,marginBottom:"0.75rem",border:`1.5px solid ${TIPO_COLOR[reto.din.tipo]||T.accent}44`,borderLeft:`4px solid ${TIPO_COLOR[reto.din.tipo]||T.accent}`}}>
        <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.5rem",alignItems:"center",flexWrap:"wrap"}}>
          <span style={S.tag(TIPO_COLOR[reto.din.tipo]||T.accent)}>{reto.din.tipo}</span>
          <span style={{color:T.text3,fontSize:"0.78rem"}}>⏱ {reto.din.duracion} min</span>
        </div>
        <p style={{color:T.text,fontWeight:900,fontSize:"1.15rem",margin:"0 0 0.35rem"}}>{reto.din.nombre}</p>
        <p style={{color:T.text2,fontSize:"0.85rem",margin:0,lineHeight:1.5}}>{reto.din.desc}</p>
      </div>
      <div style={{...S.panel,marginBottom:"0.75rem"}}>
        <p style={S.ptitle(T.text3)}>Con estos estímulos</p>
        <div style={{display:"grid",gap:"0.55rem"}}>
          {reto.estimulos.map((e,i)=>(<div key={i} style={{display:"flex",gap:"0.65rem",alignItems:"center",background:T.bg3,borderRadius:10,padding:"0.6rem 0.85rem"}}>
            <span style={{fontSize:"1rem"}}>{CAT_ICONS[e.cat]||"◆"}</span>
            <div><p style={{color:T.text3,fontSize:"0.65rem",letterSpacing:"0.1em",margin:"0 0 0.1rem",fontFamily:"monospace"}}>{e.cat}</p><p style={{color:T.text,fontWeight:700,margin:0,fontSize:"0.95rem"}}>{e.word}</p></div>
          </div>))}
        </div>
      </div>
      <div style={{...S.panel,background:T.accent+"11",border:`1.5px solid ${T.accent}33`,textAlign:"center"}}>
        <p style={{color:T.accent,fontWeight:700,fontSize:"0.88rem",margin:"0 0 0.25rem"}}>🎯 El reto</p>
        <p style={{color:T.text2,fontSize:"0.82rem",margin:"0 0 1rem",lineHeight:1.5}}>Haz <strong style={{color:T.text}}>{reto.din.nombre}</strong> usando {reto.estimulos.map(e=>e.word).join(", ")} en máximo <strong style={{color:T.text}}>{reto.din.duracion} minutos</strong>.</p>
        <button onClick={genReto} style={{...S.btn(T.accent),width:"100%"}}>⚡ Otro reto</button>
      </div>
    </div>):(<div style={{...S.panel,textAlign:"center",padding:"3rem 1rem"}}>
      <p style={{fontSize:"2.5rem",margin:"0 0 0.75rem"}}>⚡</p>
      <p style={{color:T.text2,margin:"0 0 0.5rem",fontSize:"0.95rem",fontWeight:700}}>Generador de retos</p>
      <p style={{color:T.text3,fontSize:"0.82rem",margin:0}}>Pulsa el botón para obtener un ejercicio completo listo para usar.</p>
    </div>)}
  </div>);
}
