import { useState } from 'react';
import { useTheme, mkS, TEMAS, TOKENS_EDITABLES, completarTema, contraste, avisosContraste } from '../core.jsx';

// Selector de temas + editor de tema propio.
//
// A personalización libre pode dar unha app ilexible, así que cada cor
// contrástase contra o seu fondo segundo WCAG 2.1: 4.5 para texto normal,
// 3 para elementos de interface. Non se bloquea gardar — avísase.

function Mostra({tema,nome,emoji,activo,onClick}){
  return(
    <button onClick={onClick} title={nome} style={{
      background:tema.bg,borderStyle:"solid",borderWidth:activo?"2px":"1px",
      borderColor:activo?tema.accent:tema.border,borderRadius:12,
      padding:"0.7rem",cursor:"pointer",fontFamily:"inherit",textAlign:"left",
      display:"flex",flexDirection:"column",gap:"0.45rem",minHeight:92,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:"0.35rem"}}>
        <span style={{fontSize:"0.9rem"}}>{emoji}</span>
        <span style={{color:tema.text,fontWeight:800,fontSize:"0.8rem"}}>{nome}</span>
        {activo&&<span style={{marginLeft:"auto",color:tema.accent,fontSize:"0.7rem"}}>✓</span>}
      </div>
      <div style={{background:tema.bg2,borderRadius:6,padding:"0.35rem 0.45rem"}}>
        <span style={{color:tema.text2,fontSize:"0.66rem"}}>Panel de exemplo</span>
      </div>
      <div style={{display:"flex",gap:3}}>
        {["accent","ok","warn","info","danger"].map(k=>
          <span key={k} style={{width:14,height:8,borderRadius:2,background:tema[k]}}/>)}
      </div>
    </button>
  );
}

export function SelectorTemas(){
  const {T,dark,temaId,escollerTema,propio,gardarPropio}=useTheme();
  const S=mkS(T);
  const modo=dark?"escuro":"claro";
  const [editando,setEditando]=useState(false);
  const [borrador,setBorrador]=useState(()=>{
    const base=propio?.[modo]||TEMAS[0][modo];
    return Object.fromEntries(TOKENS_EDITABLES.map(t=>[t.id,base[t.id]]));
  });

  const previa=completarTema(borrador,modo);
  const avisos=avisosContraste(previa);

  const gardar=()=>{
    gardarPropio({...(propio||{}),[modo]:borrador});
    escollerTema("propio");
    setEditando(false);
  };

  const cargarDe=t=>{
    const base=t[modo];
    setBorrador(Object.fromEntries(TOKENS_EDITABLES.map(x=>[x.id,base[x.id]])));
  };

  return(<div>
    <p style={S.ptitle(T.accent)}>Tema</p>
    <p style={{...S.caption,marginBottom:"0.75rem"}}>
      Cada tema ten a súa versión de día e de noite. O botón ☀️/🌙 da cabeceira
      cambia entre as dúas sen perder o tema escollido.
    </p>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(150px,100%),1fr))",gap:"0.5rem",marginBottom:"0.8rem"}}>
      {TEMAS.map(t=>
        <Mostra key={t.id} tema={t[modo]} nome={t.nome} emoji={t.emoji}
          activo={temaId===t.id} onClick={()=>escollerTema(t.id)}/>)}
      {propio&&propio[modo]&&
        <Mostra tema={completarTema(propio[modo],modo)} nome="O meu tema" emoji="🎨"
          activo={temaId==="propio"} onClick={()=>escollerTema("propio")}/>}
    </div>

    <p style={{...S.caption,marginBottom:"0.8rem"}}>
      {TEMAS.find(t=>t.id===temaId)?.desc||"Tema personalizado."}
    </p>

    {!editando&&<button onClick={()=>setEditando(true)} style={S.btn(T.bg3,T.text2)}>🎨 Crear ou editar o meu tema</button>}

    {editando&&<div style={{...S.panel,marginTop:"0.8rem",borderStyle:"solid",borderWidth:1,borderColor:T.accent+"44"}}>
      <p style={S.ptitle(T.accent)}>O meu tema — versión de {modo==="escuro"?"noite":"día"}</p>
      <p style={{...S.caption,marginBottom:"0.7rem"}}>
        Edítase a versión que teñas activa agora. Cambia a ☀️/🌙 na cabeceira para editar a outra.
      </p>

      <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap",marginBottom:"0.9rem"}}>
        <span style={{color:T.text4,fontSize:"0.72rem",alignSelf:"center"}}>Partir de:</span>
        {TEMAS.map(t=><button key={t.id} onClick={()=>cargarDe(t)} style={{...S.btn(T.bg3,T.text3),fontSize:"0.72rem",padding:"0.25rem 0.5rem"}}>{t.emoji} {t.nome}</button>)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(160px,100%),1fr))",gap:"0.5rem",marginBottom:"0.9rem"}}>
        {TOKENS_EDITABLES.map(tok=>{
          const aviso=avisos.find(a=>a.id===tok.id);
          return(<div key={tok.id}>
            <p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem"}}>{tok.label}</p>
            <div style={{display:"flex",gap:"0.3rem",alignItems:"center"}}>
              <input type="color" value={borrador[tok.id]||"#000000"}
                onChange={e=>setBorrador(b=>({...b,[tok.id]:e.target.value}))}
                style={{width:34,height:34,padding:0,border:`1px solid ${T.border}`,borderRadius:6,background:"none",cursor:"pointer",flexShrink:0}}/>
              <input value={borrador[tok.id]||""}
                onChange={e=>setBorrador(b=>({...b,[tok.id]:e.target.value}))}
                style={{...S.input,marginBottom:0,fontFamily:"monospace",fontSize:"0.76rem"}}/>
            </div>
            {aviso&&<p style={{color:T.warn,fontSize:"0.68rem",margin:"0.2rem 0 0",lineHeight:1.35}}>
              contraste {aviso.ratio.toFixed(1)}:1 — precisa {aviso.min}:1
            </p>}
          </div>);
        })}
      </div>

      {/* Vista previa real, coa paleta do borrador */}
      <div style={{background:previa.bg,borderRadius:12,padding:"0.9rem",marginBottom:"0.9rem",borderStyle:"solid",borderWidth:1,borderColor:previa.border}}>
        <p style={{color:previa.text,fontWeight:800,fontSize:"0.95rem",margin:"0 0 0.5rem"}}>Vista previa</p>
        <div style={{background:previa.bg2,borderRadius:8,padding:"0.7rem",marginBottom:"0.5rem"}}>
          <p style={{color:previa.text2,fontSize:"0.8rem",margin:"0 0 0.5rem"}}>Texto normal dentro dun panel.</p>
          <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>
            <span style={{background:previa.accent,color:previa.bg,borderRadius:6,padding:"0.25rem 0.5rem",fontSize:"0.72rem",fontWeight:700}}>Acción</span>
            <span style={{background:previa.ok+"22",color:previa.ok,borderRadius:6,padding:"0.25rem 0.5rem",fontSize:"0.72rem"}}>Éxito</span>
            <span style={{background:previa.warn+"22",color:previa.warn,borderRadius:6,padding:"0.25rem 0.5rem",fontSize:"0.72rem"}}>Aviso</span>
            <span style={{background:previa.danger+"22",color:previa.danger,borderRadius:6,padding:"0.25rem 0.5rem",fontSize:"0.72rem"}}>Erro</span>
          </div>
        </div>
        <p style={{color:previa.text3,fontSize:"0.72rem",margin:0}}>Texto secundario e apoios.</p>
      </div>

      {avisos.length>0&&<div style={{background:T.warn+"12",borderStyle:"solid",borderWidth:1,borderColor:T.warn+"44",borderRadius:8,padding:"0.7rem",marginBottom:"0.8rem"}}>
        <p style={{color:T.warn,fontSize:"0.78rem",fontWeight:700,margin:"0 0 0.25rem"}}>{avisos.length} {avisos.length===1?"cor pouco lexible":"cores pouco lexibles"}</p>
        <p style={{color:T.text3,fontSize:"0.73rem",margin:0,lineHeight:1.45}}>
          {avisos.map(a=>a.label).join(", ")}. Podes gardar igual, pero costará ler,
          sobre todo nunha sala escura ou nun proxector.
        </p>
      </div>}

      <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
        <button onClick={gardar} style={S.btn(T.ok,"#000")}>Gardar e aplicar</button>
        <button onClick={()=>setEditando(false)} style={S.btn(T.bg3,T.text2)}>Cancelar</button>
        {propio&&<button onClick={()=>{if(confirm("Borrar o teu tema?")){gardarPropio(null);escollerTema("impro");setEditando(false);}}} style={{...S.btn(T.bg3,T.danger),marginLeft:"auto"}}>Borrar o meu tema</button>}
      </div>
    </div>}
  </div>);
}
