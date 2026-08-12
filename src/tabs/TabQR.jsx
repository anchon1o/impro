// ============================================================
// tabs/TabQR.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useAuth, useTheme, UID, ls, mkS, QRCode, FONT_UI } from '../core.jsx';
import { cerrarSala, enviarProposta, getPropostas, subscribeToPropostas, getHistorialSalas } from '../db.js';
import { supabase as sb } from '../supabase.js';

export function TabQR(){
  const {T}=useTheme();const S=mkS(T);
  const {logueado,pedirLogin}=useAuth();
  const [mode,setMode]=useState("idle"); // idle | config | open | send
  const [salaCode,setSalaCode]=useState("");
  const [propuestas,setPropuestas]=useState([]);
  const [historial,setHistorial]=useState([]);
  const [texto,setTexto]=useState("");
  const [preguntaSel,setPreguntaSel]=useState(0);
  const [enviado,setEnviado]=useState(false);
  const [loading,setLoading]=useState(false);
  const [joinCode,setJoinCode]=useState("");
  const [error,setError]=useState("");
  const unsubRef=useRef(null);

  // Configuración de preguntas para a sala
  const PREGUNTAS_PRESET=[
    {id:"p1",pregunta:"Dime una profesión insólita",tipo:"libre"},
    {id:"p2",pregunta:"Dime un lugar extraño",tipo:"libre"},
    {id:"p3",pregunta:"Dime un secreto inconfesable",tipo:"libre"},
    {id:"p4",pregunta:"Dime una emoción poco común",tipo:"libre"},
    {id:"p5",pregunta:"Dime una frase de película",tipo:"libre"},
    {id:"p6",pregunta:"Dime un superpoder absurdo",tipo:"libre"},
  ];
  const [preguntas,setPreguntas]=useState([PREGUNTAS_PRESET[0]]);
  const [newPregunta,setNewPregunta]=useState("");
  const [salaConfig,setSalaConfig]=useState([]);

  // ⚠️ Xerador anterior: Math.random().toString(36).substring(2,6).toUpperCase()
  // Dous fallos: (a) toString(36) pode devolver unha cadea curta e saía un
  // código de menos de 4 caracteres, inaccesible porque o campo do público
  // esixe exactamente 4; (b) non comprobaba colisións, e as salas non se
  // borraban nunca.
  // Alfabeto sen O/0/I/1 para que non se confundan ao ditar o código en voz
  // alta nun show.
  const ALFABETO="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const genCode=()=>{
    let c="";
    const r=new Uint32Array(4);
    (window.crypto||window.msCrypto).getRandomValues(r);
    for(let i=0;i<4;i++) c+=ALFABETO[r[i]%ALFABETO.length];
    return c;
  };
  // Pide un código libre. O índice único parcial `salas_code_viva_uniq`
  // é a garantía real; isto só evita a maioría dos reintentos.
  const genCodeLibre=async()=>{
    for(let i=0;i<8;i++){
      const c=genCode();
      const {data}=await sb.from('salas').select('code').eq('code',c).eq('open',true).maybeSingle();
      if(!data)return c;
    }
    return null;
  };

  useEffect(()=>{
    getHistorialSalas().then(setHistorial);
    // Pecha as salas que xa caducaron. Non hai pg_cron, así que se chama
    // baixo demanda: como a pestana QR se abre en cada show, na práctica
    // límpase soa. Se a función aínda non está creada, ignórase en silencio.
    sb.rpc('pechar_salas_caducadas').then(({error})=>{
      if(error) console.warn('pechar_salas_caducadas:',error.message);
    });
    const params=new URLSearchParams(window.location.search);
    const sala=params.get("sala");
    if(sala){setJoinCode(sala.toUpperCase());setSalaCode(sala.toUpperCase());setMode("send");}
    return()=>{if(unsubRef.current)unsubRef.current();};
  },[]);

  const abrirSalaQR=async()=>{
    setError("");
    // A política RLS `salas_write` esixe with_check (user_id = auth.uid()).
    // Sen user_id, o insert é rexeitado. supabase-js NON lanza excepción
    // nese caso: devolve {error}. O try/catch anterior nunca saltaba, así
    // que a sala non se creaba e a UI mostraba o QR igualmente (sala
    // fantasma: o público recibía "Sala no encontrada").
    const {data:{user}={}}=await sb.auth.getUser();
    if(!user){setError("Precisas iniciar sesión para abrir unha sala.");return;}
    const code=await genCodeLibre();
    if(!code){setError("Non se puido xerar un código libre. Téntao de novo.");return;}
    const {error:errIns}=await sb.from('salas').insert({code,open:true,config:preguntas,user_id:user.id});
    if(errIns){
      console.error('abrirSala:',errIns);
      // 23505 = violación do índice único parcial: alguén ocupou ese código
      // entre a comprobación e o insert. Improbable, pero posible.
      setError(errIns.code==='23505'
        ?"Ese código acaba de ocuparse. Preme outra vez."
        :"Non se puido abrir a sala. Téntao de novo.");
      return;
    }
    setSalaCode(code);setPropuestas([]);
    setSalaConfig(preguntas);
    setMode("open");
    const existing=await getPropostas(code);
    setPropuestas(existing);
    unsubRef.current=subscribeToPropostas(code,nova=>{
      setPropuestas(prev=>[...prev,nova]);
    });
  };

  const cerrarSalaQR=async()=>{
    if(unsubRef.current){unsubRef.current();unsubRef.current=null;}
    await cerrarSala(salaCode,propuestas);
    const h=await getHistorialSalas();
    setHistorial(h);
    setSalaCode("");setPropuestas([]);setMode("idle");
  };

  const unirseASala=async()=>{
    if(!joinCode.trim())return;
    setLoading(true);setError("");
    try{
      const cod=joinCode.toUpperCase();
      // maybeSingle() en vez de single(): se por algún motivo houbese dúas
      // filas, single() lanzaba erro e o público vía "Sala no encontrada"
      // sen entender por que. O índice único parcial xa o impide, pero non
      // convén depender dunha soa capa.
      const {data,error:err}=await sb.from('salas').select('open,config,expira_en').eq('code',cod).maybeSingle();
      if(err){setError("Erro ao conectar.");setLoading(false);return;}
      if(!data){setError("Sala non atopada. Revisa o código.");setLoading(false);return;}
      if(!data.open){setError("Esta sala xa está pechada.");setLoading(false);return;}
      if(data.expira_en&&new Date(data.expira_en)<=new Date()){setError("Esta sala caducou.");setLoading(false);return;}
      setSalaConfig(data.config||[{id:"p1",pregunta:"Escribe tu propuesta",tipo:"libre"}]);
      setSalaCode(cod);setMode("send");
    }catch(e){setError("Erro ao conectar.");}
    setLoading(false);
  };

  const enviarPropuesta=async()=>{
    if(!texto.trim())return;
    setLoading(true);
    const pregActual=salaConfig[preguntaSel]||salaConfig[0];
    const ok=await enviarProposta(salaCode,texto.trim(),pregActual?.pregunta||"Propuesta",preguntaSel===0?"simple":"plus");
    if(ok){setEnviado(true);setTexto("");}
    else setError("Erro ao enviar.");
    setLoading(false);
  };

  const aceptarPropuesta=p=>{
    const ideas=ls.get("impro_ideas_v2",{});
    const cat=p.cat||"PROFESIÓN";
    const u={...ideas,[cat]:[...(ideas[cat]||[]),{text:p.texto,nivel:"simple",ts:p.created_at}]};
    ls.set("impro_ideas_v2",u);
  };

  const addPregunta=()=>{
    if(!newPregunta.trim())return;
    setPreguntas(p=>[...p,{id:UID(),pregunta:newPregunta.trim(),tipo:"libre"}]);
    setNewPregunta("");
  };
  const removePregunta=id=>setPreguntas(p=>p.filter(x=>x.id!==id));
  const qrUrl=`${window.location.href.split("?")[0]}?sala=${salaCode}`;

  // VISTA: PANTALLA PÚBLICA (PÚBLICO ENVIANDO)
  if(mode==="send")return(<div style={{minHeight:"100vh",background:T.bg,fontFamily:FONT_UI,display:"flex",flexDirection:"column"}}>
    <div style={{background:T.accent,padding:"0.85rem 1.25rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div><p style={{color:"rgba(255,255,255,0.7)",fontSize:"0.7rem",letterSpacing:"0.2em",margin:"0 0 0.1rem",fontFamily:"monospace"}}>SALA</p><p style={{color:"#fff",fontWeight:900,fontSize:"1.6rem",letterSpacing:"0.15em",margin:0}}>{salaCode}</p></div>
      <span style={{fontSize:"1.8rem"}}>🎭</span>
    </div>
    {salaConfig.length>1&&<div style={{display:"flex",gap:"0.4rem",padding:"0.75rem 1rem",overflowX:"auto",borderBottom:`1px solid ${T.border}`}}>
      {salaConfig.map((p,i)=><button key={p.id} onClick={()=>{setPreguntaSel(i);setEnviado(false);setTexto("");}} style={{background:preguntaSel===i?T.accent:T.bg3,color:preguntaSel===i?"#fff":T.text3,border:"none",borderRadius:20,padding:"0.3rem 0.85rem",cursor:"pointer",fontSize:"0.8rem",fontWeight:preguntaSel===i?700:400,whiteSpace:"nowrap",fontFamily:"inherit"}}>{i+1}. {p.pregunta.slice(0,25)}{p.pregunta.length>25?"...":""}</button>)}
    </div>}
    {!enviado?(<div style={{flex:1,display:"flex",flexDirection:"column",padding:"1rem",gap:"0.85rem",overflowY:"auto"}}>
      <div style={{background:T.accent+"18",border:`1.5px solid ${T.accent}44`,borderRadius:14,padding:"1rem 1.25rem"}}>
        <p style={{color:T.accent,fontSize:"0.7rem",letterSpacing:"0.15em",margin:"0 0 0.3rem",fontFamily:"monospace"}}>SE VOS PREGUNTA</p>
        <p style={{color:T.text,fontWeight:900,fontSize:"1.15rem",margin:0,lineHeight:1.4}}>{salaConfig[preguntaSel]?.pregunta||"Escribe tu propuesta"}</p>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:"0.4rem"}}>
        <textarea value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Escribe aquí a túa resposta..." style={{...S.input,flex:1,minHeight:120,resize:"none",fontSize:"1rem"}} autoFocus/>
      </div>
      {error&&<p style={{color:T.danger,fontSize:"0.85rem",margin:0}}>{error}</p>}
      <button onClick={enviarPropuesta} disabled={loading||!texto.trim()} style={{...S.btn(T.accent),width:"100%",padding:"0.85rem",fontSize:"1rem",opacity:loading||!texto.trim()?0.5:1,borderRadius:12}}>{loading?"Enviando...":"✓ Enviar"}</button>
    </div>):(<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",textAlign:"center",gap:"1rem"}}>
      <div style={{fontSize:"4rem"}}>✓</div>
      <h2 style={{color:T.ok,fontWeight:900,margin:0}}>¡Enviada!</h2>
      <p style={{color:T.text3,margin:0}}>{salaConfig[preguntaSel]?.pregunta}</p>
      {salaConfig.length>1&&<div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",justifyContent:"center",marginTop:"0.5rem"}}>
        {salaConfig.map((p,i)=>i!==preguntaSel&&<button key={p.id} onClick={()=>{setPreguntaSel(i);setEnviado(false);setTexto("");}} style={{...S.btn(T.bg3,T.text2),fontSize:"0.82rem"}}>Responder: {p.pregunta.slice(0,20)}...</button>)}
      </div>}
      <button onClick={()=>{setEnviado(false);setTexto("");}} style={{...S.btn(T.accent),padding:"0.65rem 2rem",marginTop:"0.5rem"}}>Enviar outra resposta</button>
    </div>)}
  </div>);

  // VISTA: SALA ABERTA (FACILITADOR VENDO PROPOSTAS)
  if(mode==="open")return(<div>
    <div style={{display:"flex",gap:"0.6rem",marginBottom:"1rem",alignItems:"center",flexWrap:"wrap"}}>
      <h2 style={{margin:0,fontWeight:900,fontSize:"0.95rem",flex:1,color:T.text}}>Sala <span style={{color:T.accent,letterSpacing:"0.1em"}}>{salaCode}</span></h2>
      <button onClick={cerrarSalaQR} style={S.btn(T.danger)}>⏹ Pechar sala</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"1.25rem",marginBottom:"1rem",alignItems:"start"}}>
      <div style={{...S.panel,display:"flex",flexDirection:"column",alignItems:"center",gap:"0.65rem",padding:"1rem"}}>
        <QRCode value={qrUrl} size={150}/>
        <p style={{color:T.accent,fontFamily:"monospace",fontSize:"1.2rem",fontWeight:900,letterSpacing:"0.2em",margin:0}}>{salaCode}</p>
        <div style={{display:"flex",flexDirection:"column",gap:"0.3rem",width:"100%"}}>
          {salaConfig.map((p,i)=><div key={p.id} style={{background:T.bg3,borderRadius:7,padding:"0.35rem 0.6rem",fontSize:"0.72rem",color:T.text3}}>{i+1}. {p.pregunta}</div>)}
        </div>
      </div>
      <div style={S.panel}>
        <p style={S.ptitle(T.ok)}>Propuestas ({propuestas.length})</p>
        {propuestas.length===0?<p style={{color:T.text4,fontSize:"0.83rem"}}>Esperando...</p>:(
          <div style={{display:"flex",flexDirection:"column",gap:"0.45rem",maxHeight:300,overflowY:"auto"}}>
            {[...propuestas].reverse().map((p,i)=>(<div key={i} style={{background:T.bg3,borderRadius:9,padding:"0.6rem 0.85rem",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.5rem"}}>
              <div>
                <span style={{...S.tag(T.accent),marginRight:"0.4rem",fontSize:"0.66rem"}}>{(p.cat||"").slice(0,30)}</span>
                <span style={{color:T.text,fontSize:"0.88rem"}}>{p.texto}</span>
              </div>
              <button onClick={()=>aceptarPropuesta(p)} title="Engadir a ideas" style={{...S.btn(T.ok,"#000"),padding:"0.22rem 0.5rem",fontSize:"0.72rem",flexShrink:0}}>+ Ideas</button>
            </div>))}
          </div>
        )}
      </div>
    </div>
  </div>);

  // VISTA: CONFIGURACIÓN PREVIA (antes de abrir sala)
  if(mode==="config")return(<div>
    <div style={{display:"flex",gap:"0.6rem",marginBottom:"1.25rem",alignItems:"center"}}>
      <button onClick={()=>setMode("idle")} style={S.btn(T.bg3,T.text2)}>← Volver</button>
      <span style={{fontWeight:700,color:T.text}}>Configurar sala</span>
    </div>
    <div style={{...S.panel,marginBottom:"1rem",border:`1.5px solid ${T.accent}33`}}>
      <p style={S.ptitle(T.accent)}>Preguntas para o público</p>
      <p style={{color:T.text3,fontSize:"0.82rem",marginBottom:"1rem"}}>O público verá estas preguntas ao entrar coa sala. Podes usar presets ou escribir as túas propias.</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:"0.35rem",marginBottom:"1rem"}}>
        {PREGUNTAS_PRESET.map(p=><button key={p.id} onClick={()=>setPreguntas(prev=>prev.find(x=>x.pregunta===p.pregunta)?prev:[...prev,{...p,id:UID()}])} style={{background:preguntas.find(x=>x.pregunta===p.pregunta)?T.accent+"22":T.bg3,border:`1.5px solid ${preguntas.find(x=>x.pregunta===p.pregunta)?T.accent:T.border}`,color:preguntas.find(x=>x.pregunta===p.pregunta)?T.accent:T.text3,borderRadius:8,padding:"0.3rem 0.7rem",cursor:"pointer",fontSize:"0.78rem",fontFamily:"inherit"}}>{p.pregunta}</button>)}
      </div>
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem"}}>
        <input value={newPregunta} onChange={e=>setNewPregunta(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPregunta()} placeholder="Escribe una pregunta personalizada..." style={{...S.input,flex:1}}/>
        <button onClick={addPregunta} style={S.btn(T.accent)}>+</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"0.45rem"}}>
        {preguntas.map((p,i)=>(<div key={p.id} style={{display:"flex",gap:"0.5rem",alignItems:"center",background:T.bg3,borderRadius:9,padding:"0.55rem 0.85rem"}}>
          <span style={{color:T.text3,fontSize:"0.75rem",fontFamily:"monospace",width:18}}>{i+1}</span>
          <span style={{flex:1,color:T.text,fontSize:"0.88rem"}}>{p.pregunta}</span>
          <button onClick={()=>removePregunta(p.id)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.9rem"}}>×</button>
        </div>))}
        {preguntas.length===0&&<p style={{color:T.text4,fontSize:"0.82rem"}}>Engade polo menos unha pregunta.</p>}
      </div>
    </div>
    {error&&<p style={{color:T.danger,fontSize:"0.85rem",margin:"0 0 0.6rem"}}>{error}</p>}
    <button onClick={abrirSalaQR} disabled={preguntas.length===0} style={{...S.btn(T.accent),width:"100%",padding:"0.75rem",opacity:preguntas.length===0?0.4:1}}>📺 Abrir sala con estas preguntas</button>
  </div>);

  // VISTA: INICIO
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(260px,100%),1fr))",gap:"1rem",marginBottom:"1.25rem"}}>
      <div style={{...S.panel,border:`1.5px solid ${T.accent}33`}}>
        <p style={S.ptitle(T.accent)}>🎭 Son o facilitador</p>
        <p style={{color:T.text2,fontSize:"0.83rem",lineHeight:1.6,marginBottom:"1rem"}}>Configura as preguntas e abre a sala. O público escanea o QR e responde dende o seu móbil.</p>
        <button onClick={()=>{if(!logueado){pedirLogin();return;}setMode("config");}} style={{...S.btn(T.accent),width:"100%",padding:"0.65rem"}}>⚙️ Configurar e abrir sala</button>
      </div>
      <div style={{...S.panel,border:`1.5px solid ${T.ok}33`}}>
        <p style={S.ptitle(T.ok)}>👥 Son do público</p>
        <p style={{color:T.text2,fontSize:"0.83rem",lineHeight:1.6,marginBottom:"0.85rem"}}>Introduce o código de 4 letras que che deron.</p>
        <div style={{display:"flex",gap:"0.45rem"}}><input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&unirseASala()} placeholder="XXXX" maxLength={4} style={{...S.input,flex:1,fontSize:"1.4rem",fontWeight:900,letterSpacing:"0.2em",textAlign:"center"}}/><button onClick={unirseASala} disabled={loading||joinCode.length<4} style={{...S.btn(T.ok,"#000"),opacity:joinCode.length<4?0.4:1}}>{loading?"...":"Entrar"}</button></div>
        {error&&<p style={{color:T.danger,fontSize:"0.8rem",marginTop:"0.45rem"}}>{error}</p>}
      </div>
    </div>
    <div style={S.panel}>
      <p style={S.ptitle(T.warn)}>📋 Historial</p>
      {historial.length===0?<p style={{color:T.text4,fontSize:"0.83rem"}}>Sen sesións gardadas.</p>:(
        <div style={{display:"flex",flexDirection:"column",gap:"0.55rem"}}>
          {historial.map((entry,i)=>(<div key={i} style={{background:T.bg3,borderRadius:10,padding:"0.75rem 1rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"0.25rem",marginBottom:"0.4rem"}}><span style={{fontWeight:700,color:T.accent,letterSpacing:"0.1em"}}>{entry.sala_code}</span><span style={{color:T.text3,fontSize:"0.76rem"}}>{entry.fecha} · {entry.propostas?.length||0} propuestas</span></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem"}}>{(entry.propostas||[]).slice(0,6).map((p,j)=><span key={j} style={{background:T.bg4,borderRadius:7,padding:"0.18rem 0.55rem",fontSize:"0.78rem",color:T.text2}}>{typeof p==="string"?p:p.texto}</span>)}</div>
          </div>))}
        </div>
      )}
    </div>
  </div>);
}
