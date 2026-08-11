// ============================================================
// tabs/TabReto.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect } from 'react';
import { useTheme, useEstimulos, CAT_ICONS, pick, trackDin, mkS, TIPO_COLOR } from '../core.jsx';
import { DINAMICAS_BASE } from '../datos.js';
import { getDinamicas } from '../db.js';

// Normaliza pasos/variantes: no editor gárdanse como array, pero filas
// antigas ou importadas poden vir como texto con saltos de liña.
const comoLista=v=>Array.isArray(v)?v:(typeof v==='string'&&v.trim()?v.split('\n').map(s=>s.trim()).filter(Boolean):[]);

// ¿Ten esta dinámica algo que amosar máis alá do nome e a descrición?
const hayInstrucciones=d=>!!d&&(comoLista(d.pasos).length>0||!!d.objetivo||comoLista(d.variantes).length>0||!!d.notas||!!d.participantes);

export function TabReto(){
  const {T}=useTheme();const S=mkS(T);
  const {data:ESTIMULOS}=useEstimulos();
  const [reto,setReto]=useState(null);
  const [nivel,setNivel]=useState("simple");
  const [verInstrucciones,setVerInstrucciones]=useState(false);
  // Mesma fonte de datos que a Guía: Supabase con fallback a localStorage
  // e, en último caso, ás dinámicas base. Antes lía só de localStorage, polo
  // que Reto e Guía podían discrepar sobre que dinámicas existen.
  const [dinamicas,setDinamicas]=useState(DINAMICAS_BASE);
  useEffect(()=>{getDinamicas(DINAMICAS_BASE).then(d=>{if(d&&d.length)setDinamicas(d);});},[]);
  const getList=cat=>{const d=ESTIMULOS[cat]||{simple:[],plus:[]};return nivel==="plus"&&d.plus.length>0?d.plus:d.simple;};
  const genReto=()=>{
    const din=pick(dinamicas);
    if(!din)return;
    trackDin(din.nombre);
    const opts=[["PROFESIÓN","LUGAR","EMOCIÓN"],["ACCIÓN","ESTILO"],["OBJETO","EMOCIÓN","FRASE"],["PROFESIÓN","ACCIÓN"],["LUGAR","DUDA"],["SUPERPODER","PROFESIÓN","EMOCIÓN"]];
    const estimulos=pick(opts).map(cat=>({cat,word:pick(getList(cat))}));
    setVerInstrucciones(false);
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
        {/* Era `reto.din.desc`, campo inexistente nas dinámicas (é de Universo).
            O campo correcto é `descripcion`. */}
        {reto.din.descripcion&&<p style={{color:T.text2,fontSize:"0.85rem",margin:0,lineHeight:1.5}}>{reto.din.descripcion}</p>}

        {(hayInstrucciones(reto.din))&&<>
          <button onClick={()=>setVerInstrucciones(v=>!v)} style={{background:"none",border:"none",padding:"0.55rem 0 0",margin:0,cursor:"pointer",color:TIPO_COLOR[reto.din.tipo]||T.accent,fontSize:"0.8rem",fontWeight:700,fontFamily:"inherit",display:"flex",alignItems:"center",gap:"0.35rem"}}>
            <span style={{display:"inline-block",transform:verInstrucciones?"rotate(90deg)":"none",transition:"transform 0.2s"}}>▸</span>
            {verInstrucciones?"Ocultar instrucións":"Ver instrucións"}
          </button>

          {verInstrucciones&&<div style={{marginTop:"0.75rem",paddingTop:"0.85rem",borderTop:`1px solid ${T.border}`,animation:"slideUp 0.25s ease"}}>
            {reto.din.participantes&&<p style={{color:T.text3,fontSize:"0.78rem",margin:"0 0 0.75rem"}}>👥 {reto.din.participantes}</p>}

            {comoLista(reto.din.pasos).length>0&&<>
              <p style={S.ptitle(TIPO_COLOR[reto.din.tipo]||T.accent)}>Pasos</p>
              {comoLista(reto.din.pasos).map((p,i)=>(<div key={i} style={{display:"flex",gap:"0.6rem",marginBottom:"0.4rem",alignItems:"flex-start"}}>
                <span style={{...S.tag(TIPO_COLOR[reto.din.tipo]||T.accent),borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"0.68rem"}}>{i+1}</span>
                <span style={{color:T.text2,fontSize:"0.86rem",lineHeight:1.5}}>{p}</span>
              </div>))}
            </>}

            {reto.din.objetivo&&<div style={{background:T.bg3,borderRadius:10,padding:"0.85rem",margin:"1rem 0 0"}}>
              <p style={S.ptitle("#ffd740")}>🎯 Objetivo</p>
              <p style={{color:T.text2,fontSize:"0.86rem",margin:0}}>{reto.din.objetivo}</p>
            </div>}

            {comoLista(reto.din.variantes).length>0&&<div style={{marginTop:"1rem"}}>
              <p style={S.ptitle(T.text4)}>Variantes</p>
              {comoLista(reto.din.variantes).map((v,i)=><p key={i} style={{color:T.text3,fontSize:"0.82rem",margin:"0.18rem 0"}}>◆ {v}</p>)}
            </div>}

            {reto.din.notas&&<p style={{color:T.text3,fontSize:"0.82rem",margin:"1rem 0 0",lineHeight:1.5,fontStyle:"italic"}}>{reto.din.notas}</p>}
            {reto.din.licencia&&<div style={{background:"rgba(255,110,64,0.10)",border:"1px solid rgba(255,110,64,0.35)",borderRadius:10,padding:"0.8rem",margin:"1rem 0 0"}}>
              <p style={{color:"#ff6e40",fontSize:"0.8rem",margin:0,lineHeight:1.5}}>{reto.din.licencia}</p>
            </div>}
            {reto.din.autoria&&<p style={{color:T.text3,fontSize:"0.78rem",margin:"1rem 0 0",lineHeight:1.5}}><strong style={{color:T.text2}}>Autoría:</strong> {reto.din.autoria}</p>}
            {reto.din.fuente&&<p style={{color:T.text4,fontSize:"0.72rem",margin:"0.4rem 0 0"}}>Catalogada a partir de {reto.din.fuente}</p>}
          </div>}
        </>}
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
