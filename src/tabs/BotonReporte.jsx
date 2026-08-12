import { useState } from 'react';
import { useTheme, mkS } from '../core.jsx';
import { TIPOS_REPORTE, contextoActual, enviarReporte } from '../reportes.js';

// 🐛 Botón flotante de reporte.
//
// Funciona con conta e sen ela. Captura sen preguntar o contexto técnico
// (pestana, navegador, tamaño de pantalla, tema), que é o que sempre
// falta despois nun reporte e xa non hai forma de recuperar.

export function BotonReporte({onde}){
  const {T}=useTheme();const S=mkS(T);
  const [aberto,setAberto]=useState(false);
  const [tipo,setTipo]=useState('bug');
  const [titulo,setTitulo]=useState('');
  const [detalle,setDetalle]=useState('');
  const [contacto,setContacto]=useState('');
  const [enviando,setEnviando]=useState(false);
  const [feito,setFeito]=useState(false);
  const [erro,setErro]=useState('');

  const ctx=contextoActual(onde);

  const enviar=async()=>{
    if(!titulo.trim()){setErro('Fai falta un título.');return;}
    setEnviando(true);setErro('');
    const r=await enviarReporte({tipo,titulo,detalle,contacto,ctx});
    setEnviando(false);
    if(r.ok){setFeito(true);setTitulo('');setDetalle('');}
    else setErro(r.erro?.includes('Demasiados')?r.erro:'Non se puido enviar. Téntao de novo.');
  };

  const pechar=()=>{setAberto(false);setFeito(false);setErro('');};

  return(<>
    <button onClick={()=>setAberto(true)} title="Informar dun fallo ou propoñer unha mellora"
      style={{position:"fixed",right:14,bottom:14,zIndex:190,width:44,height:44,borderRadius:22,
        background:T.bg2,borderStyle:"solid",borderWidth:1,borderColor:T.border,color:T.text2,
        fontSize:"1.15rem",cursor:"pointer",boxShadow:"0 2px 10px rgba(0,0,0,0.25)",
        display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>🐛</button>

    {aberto&&<div onClick={pechar} style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.6)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div onClick={e=>e.stopPropagation()} style={{...S.panel,maxWidth:460,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>

        {feito?<div style={{textAlign:"center",padding:"1rem 0"}}>
          <p style={{fontSize:"2rem",margin:"0 0 0.4rem"}}>✓</p>
          <p style={{color:T.ok,fontWeight:700,margin:"0 0 0.3rem"}}>Recibido, grazas!</p>
          <p style={{...S.caption,margin:"0 0 1rem"}}>Queda no rexistro para revisalo.</p>
          <div style={{display:"flex",gap:"0.4rem",justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>setFeito(false)} style={S.btn(T.bg3,T.text2)}>Enviar outro</button>
            <button onClick={pechar} style={S.btn(T.accent)}>Pechar</button>
          </div>
        </div>:<>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.8rem"}}>
          <p style={{...S.ptitle(T.accent),margin:0}}>🐛 Informar</p>
          <button onClick={pechar} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"1.1rem"}}>✕</button>
        </div>

        <div style={{display:"flex",gap:"0.35rem",marginBottom:"0.7rem"}}>
          {TIPOS_REPORTE.map(t=>(
            <button key={t.id} onClick={()=>setTipo(t.id)} style={{flex:1,background:tipo===t.id?T.accent+"22":T.bg3,
              borderStyle:"solid",borderWidth:1,borderColor:tipo===t.id?T.accent:T.border,
              color:tipo===t.id?T.accent:T.text3,borderRadius:9,padding:"0.5rem 0.3rem",cursor:"pointer",
              fontSize:"0.76rem",fontFamily:"inherit",minHeight:38}}>{t.emoji} {t.label}</button>))}
        </div>
        <p style={{...S.caption,marginBottom:"0.7rem"}}>{TIPOS_REPORTE.find(t=>t.id===tipo)?.axuda}</p>

        <input value={titulo} onChange={e=>setTitulo(e.target.value)} maxLength={120}
          placeholder="En poucas palabras, que pasa?" style={{...S.input,marginBottom:"0.5rem"}}/>
        <textarea value={detalle} onChange={e=>setDetalle(e.target.value)}
          placeholder={tipo==='bug'?"Que fixeches xusto antes? Que agardabas que pasase?":"Cóntame a idea."}
          style={{...S.input,minHeight:96,resize:"vertical",marginBottom:"0.5rem"}}/>
        <input value={contacto} onChange={e=>setContacto(e.target.value)}
          placeholder="Correo (opcional, por se fai falta preguntarche)" style={{...S.input,marginBottom:"0.7rem"}}/>

        <details style={{marginBottom:"0.8rem"}}>
          <summary style={{color:T.text4,fontSize:"0.74rem",cursor:"pointer"}}>Que se envía ademais</summary>
          <p style={{color:T.text4,fontSize:"0.72rem",margin:"0.4rem 0 0",fontFamily:"monospace",lineHeight:1.6}}>
            onde: {ctx.onde||"—"}<br/>pantalla: {ctx.pantalla}<br/>tema: {ctx.tema}<br/>
            navegador: {(ctx.navegador||"").slice(0,60)}…
          </p>
        </details>

        {erro&&<p style={{color:T.danger,fontSize:"0.8rem",margin:"0 0 0.6rem"}}>{erro}</p>}

        <div style={{display:"flex",gap:"0.4rem"}}>
          <button onClick={enviar} disabled={enviando} style={{...S.btn(T.accent),opacity:enviando?0.6:1}}>
            {enviando?"Enviando…":"Enviar"}</button>
          <button onClick={pechar} style={S.btn(T.bg3,T.text2)}>Cancelar</button>
        </div>
        </>}
      </div>
    </div>}
  </>);
}
