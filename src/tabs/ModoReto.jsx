// ============================================================
// tabs/ModoReto.jsx
// R10a · Antes era `tabs/TabReto.jsx`, unha área propia da botonera.
//
// ⚠️ Reto e Xerar eran a mesma cousa por dúas portas: os dous escollen
// estímulos ao chou e os dous teñen o seu selector Simple/Plus. É
// exactamente o erro de B16 (Reto e Guía discrepando sobre que
// dinámicas existían) e o de Sesións/escaletas editables en dous
// sitios. Agora Reto é un MODO dentro de Xerar e xa non existe como
// área: unha soa porta.
//
// O que se perdeu a propósito:
//   · o selector de nivel propio → vén de Xerar por `nivel`
//   · a súa lista de estímulos propia → vén de Xerar por `getList`
//
// Ese segundo cambio arranxa unha discrepancia real: Reto lía o
// catálogo pelado e ignoraba os estímulos engadidos, editados ou
// borrados polo usuario, así que Xerar e Reto podían sortear listas
// distintas. Agora sortean a mesma.
// ============================================================

import { useState } from 'react';
import { useTheme, CAT_ICONS, pick, trackDin, mkS, colorTipo, useDinamicas, AvisoDinamicas } from '../core.jsx';

// Normaliza pasos/variantes: no editor gárdanse como array, pero filas
// antigas ou importadas poden vir como texto con saltos de liña.
const comoLista=v=>Array.isArray(v)?v:(typeof v==='string'&&v.trim()?v.split('\n').map(s=>s.trim()).filter(Boolean):[]);

// ¿Ten esta dinámica algo que amosar máis alá do nome e a descrición?
const hayInstrucciones=d=>!!d&&(comoLista(d.pasos).length>0||!!d.objetivo||comoLista(d.variantes).length>0||!!d.notas||!!d.participantes);

export function ModoReto({nivel,getList}){
  const {T}=useTheme();const S=mkS(T);
  const [reto,setReto]=useState(null);
  const [verInstrucciones,setVerInstrucciones]=useState(false);
  // Mesma fonte que a Guía, literalmente o mesmo hook. Antes lía só de
  // localStorage, polo que Reto e Guía discrepaban sobre que existía (B16).
  const {dinamicas,cargando,motivo,recargar}=useDinamicas();
  const genReto=()=>{
    const din=pick(dinamicas);
    if(!din)return;
    trackDin(din.nombre);
    const opts=[["PROFESIÓN","LUGAR","EMOCIÓN"],["ACCIÓN","ESTILO"],["OBJETO","EMOCIÓN","FRASE"],["PROFESIÓN","ACCIÓN"],["LUGAR","DUDA"],["SUPERPODER","PROFESIÓN","EMOCIÓN"]];
    // ⚠️ Unha categoría do sorteo pode non existir no idioma activo: aí
    // `getList` devolve [] e `pick` daría undefined. Fíltranse en vez de
    // amosar un estímulo baleiro.
    const estimulos=pick(opts).map(cat=>({cat,word:pick(getList(cat))})).filter(e=>!!e.word);
    setVerInstrucciones(false);
    setReto({din,estimulos});
  };
  const senCatalogo=!cargando&&dinamicas.length===0;
  return(<div>
    <AvisoDinamicas motivo={cargando?null:motivo} baleiro={senCatalogo} onRecargar={recargar}/>
    <div style={{...S.panel,marginBottom:"1.25rem"}}>
      <p style={{color:T.text2,lineHeight:1.6,margin:"0 0 1rem",fontSize:"0.88rem"}}>Combina unha dinámica, estímulos e tempo nunha proposta lista para usar de inmediato. O nivel <strong style={{color:T.text}}>{nivel==="plus"?"Plus":"Simple"}</strong> é o de arriba, o mesmo que nas categorías.</p>
      {/* Sen catálogo non hai nada que sortear: mellor desactivar que
          deixar un botón que non fai nada ao premelo. */}
      <button onClick={genReto} disabled={senCatalogo||cargando} style={{...S.btn(T.accent),width:"100%",opacity:(senCatalogo||cargando)?0.4:1,cursor:(senCatalogo||cargando)?"default":"pointer"}}>⚡ Xerar reto</button>
    </div>
    {reto?(<div style={{animation:"fadeIn 0.35s ease"}}>
      <div style={{...S.panel,marginBottom:"0.75rem",borderStyle:"solid",borderWidth:1.5,borderColor:`${colorTipo(T,reto.din.tipo)||T.accent}44`,borderLeftWidth:4,borderLeftColor:colorTipo(T,reto.din.tipo)||T.accent}}>
        <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.5rem",alignItems:"center",flexWrap:"wrap"}}>
          <span style={S.tag(colorTipo(T,reto.din.tipo)||T.accent)}>{reto.din.tipo}</span>
          <span style={{color:T.text3,fontSize:"0.78rem"}}>⏱ {reto.din.duracion} min</span>
        </div>
        <p style={{color:T.text,fontWeight:900,fontSize:"1.15rem",margin:"0 0 0.35rem"}}>{reto.din.nombre}</p>
        {/* Era `reto.din.desc`, campo inexistente nas dinámicas (é de Universo).
            O campo correcto é `descripcion`. */}
        {reto.din.descripcion&&<p style={{color:T.text2,fontSize:"0.85rem",margin:0,lineHeight:1.5}}>{reto.din.descripcion}</p>}

        {(hayInstrucciones(reto.din))&&<>
          <button onClick={()=>setVerInstrucciones(v=>!v)} style={{background:"none",border:"none",padding:"0.55rem 0 0",margin:0,cursor:"pointer",color:colorTipo(T,reto.din.tipo)||T.accent,fontSize:"0.8rem",fontWeight:700,fontFamily:"inherit",display:"flex",alignItems:"center",gap:"0.35rem"}}>
            <span style={{display:"inline-block",transform:verInstrucciones?"rotate(90deg)":"none",transition:"transform 0.2s"}}>▸</span>
            {verInstrucciones?"Ocultar instrucións":"Ver instrucións"}
          </button>

          {verInstrucciones&&<div style={{marginTop:"0.75rem",paddingTop:"0.85rem",borderTopStyle:"solid",borderTopWidth:1,borderTopColor:T.border,animation:"slideUp 0.25s ease"}}>
            {reto.din.participantes&&<p style={{color:T.text3,fontSize:"0.78rem",margin:"0 0 0.75rem"}}>👥 {reto.din.participantes}</p>}

            {comoLista(reto.din.pasos).length>0&&<>
              <p style={S.ptitle(colorTipo(T,reto.din.tipo)||T.accent)}>Pasos</p>
              {comoLista(reto.din.pasos).map((p,i)=>(<div key={i} style={{display:"flex",gap:"0.6rem",marginBottom:"0.4rem",alignItems:"flex-start"}}>
                <span style={{...S.tag(colorTipo(T,reto.din.tipo)||T.accent),borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"0.68rem"}}>{i+1}</span>
                <span style={{color:T.text2,fontSize:"0.86rem",lineHeight:1.5}}>{p}</span>
              </div>))}
            </>}

            {reto.din.objetivo&&<div style={{background:T.bg3,borderRadius:10,padding:"0.85rem",margin:"1rem 0 0"}}>
              <p style={S.ptitle(T.warn)}>🎯 Obxectivo</p>
              <p style={{color:T.text2,fontSize:"0.86rem",margin:0}}>{reto.din.objetivo}</p>
            </div>}

            {comoLista(reto.din.variantes).length>0&&<div style={{marginTop:"1rem"}}>
              <p style={S.ptitle(T.text4)}>Variantes</p>
              {comoLista(reto.din.variantes).map((v,i)=><p key={i} style={{color:T.text3,fontSize:"0.82rem",margin:"0.18rem 0"}}>◆ {v}</p>)}
            </div>}

            {reto.din.notas&&<p style={{color:T.text3,fontSize:"0.82rem",margin:"1rem 0 0",lineHeight:1.5,fontStyle:"italic"}}>{reto.din.notas}</p>}
            {reto.din.licencia&&<div style={{background:T.danger+"1A",borderStyle:"solid",borderWidth:1,borderColor:"rgba(255,110,64,0.35)",borderRadius:10,padding:"0.8rem",margin:"1rem 0 0"}}>
              <p style={{color:T.danger,fontSize:"0.8rem",margin:0,lineHeight:1.5}}>{reto.din.licencia}</p>
            </div>}
            {reto.din.autoria&&<p style={{color:T.text3,fontSize:"0.78rem",margin:"1rem 0 0",lineHeight:1.5}}><strong style={{color:T.text2}}>Autoría:</strong> {reto.din.autoria}</p>}
            {reto.din.fuente&&<p style={{color:T.text4,fontSize:"0.72rem",margin:"0.4rem 0 0"}}>Catalogada a partir de {reto.din.fuente}</p>}
          </div>}
        </>}
      </div>
      {reto.estimulos.length>0&&<div style={{...S.panel,marginBottom:"0.75rem"}}>
        <p style={S.ptitle(T.text3)}>Con estes estímulos</p>
        <div style={{display:"grid",gap:"0.55rem"}}>
          {reto.estimulos.map((e,i)=>(<div key={i} style={{display:"flex",gap:"0.65rem",alignItems:"center",background:T.bg3,borderRadius:10,padding:"0.6rem 0.85rem"}}>
            <span style={{fontSize:"1rem"}}>{CAT_ICONS[e.cat]||"◆"}</span>
            <div><p style={{color:T.text3,fontSize:"0.65rem",letterSpacing:"0.1em",margin:"0 0 0.1rem",fontFamily:"monospace"}}>{e.cat}</p><p style={{color:T.text,fontWeight:700,margin:0,fontSize:"0.95rem"}}>{e.word}</p></div>
          </div>))}
        </div>
      </div>}
      <div style={{...S.panel,background:T.accent+"11",borderStyle:"solid",borderWidth:1.5,borderColor:`${T.accent}33`,textAlign:"center"}}>
        <p style={{color:T.accent,fontWeight:700,fontSize:"0.88rem",margin:"0 0 0.25rem"}}>🎯 O reto</p>
        <p style={{color:T.text2,fontSize:"0.82rem",margin:"0 0 1rem",lineHeight:1.5}}>Fai <strong style={{color:T.text}}>{reto.din.nombre}</strong>{reto.estimulos.length>0?<> usando {reto.estimulos.map(e=>e.word).join(", ")}</>:null} en máximo <strong style={{color:T.text}}>{reto.din.duracion} minutos</strong>.</p>
        <button onClick={genReto} style={{...S.btn(T.accent),width:"100%"}}>⚡ Outro reto</button>
      </div>
    </div>):(<div style={{...S.panel,textAlign:"center",padding:"3rem 1rem"}}>
      <p style={{fontSize:"2.5rem",margin:"0 0 0.75rem"}}>⚡</p>
      <p style={{color:T.text2,margin:"0 0 0.5rem",fontSize:"0.95rem",fontWeight:700}}>Xerador de retos</p>
      <p style={{color:T.text3,fontSize:"0.82rem",margin:0}}>Preme o botón para obter un exercicio completo listo para usar.</p>
    </div>)}
  </div>);
}
