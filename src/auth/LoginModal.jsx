// ============================================================
// auth/LoginModal.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState } from 'react';
import { t, useTheme, mkS, FONT_UI, TYPE } from '../core.jsx';
import { signUp, signIn, resetPassword } from '../auth.js';

export function LoginModal({onClose}){
  const {T}=useTheme();const S=mkS(T);
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [nome,setNome]=useState("");
  const [msg,setMsg]=useState(null);
  const [loading,setLoading]=useState(false);

  const submit=async()=>{
    if(!email.trim()){setMsg({t:"err",m:"Introduce o teu email."});return;}
    setLoading(true);setMsg(null);
    if(mode==="reset"){
      const r=await resetPassword(email.trim());
      setMsg(r.ok?{t:"ok",m:"Enviámosche un email para restablecer o contrasinal."}:{t:"err",m:r.error});
      setLoading(false);return;
    }
    if(!pass||pass.length<6){setMsg({t:"err",m:"O contrasinal debe ter polo menos 6 caracteres."});setLoading(false);return;}
    if(mode==="signup"){
      const r=await signUp(email.trim(),pass,nome.trim()||email.split("@")[0]);
      if(r.ok)setMsg({t:"ok",m:"Conta creada! Xa podes usar todas as funcións."});
      else setMsg({t:"err",m:r.error});
    }else{
      const r=await signIn(email.trim(),pass);
      if(r.ok)onClose();
      else setMsg({t:"err",m:r.error});
    }
    setLoading(false);
  };

  return(<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.25rem",backdropFilter:"blur(6px)",animation:"fadeIn 0.2s ease",fontFamily:FONT_UI}}>
    <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:380,background:T.bg2,borderRadius:16,padding:"1.5rem",border:`1.5px solid ${T.border}`,animation:"pubIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.25rem"}}>
        <div>
          <div style={{fontSize:"2rem",marginBottom:"0.2rem"}}>🎭</div>
          <h2 style={{...TYPE.h1,color:T.text,margin:0}}>{mode==="signup"?"Crear conta":mode==="reset"?"Recuperar acceso":"Entrar"}</h2>
          <p style={{...TYPE.bodySm,color:T.text3,margin:"0.3rem 0 0"}}>Cunha conta podes gardar dinámicas, grupos e sesións en todos os teus dispositivos.</p>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"1.2rem",padding:0,lineHeight:1}}>×</button>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"0.7rem"}}>
        {mode!=="reset"&&<div style={{display:"flex",gap:2,background:T.bg3,borderRadius:10,padding:3}}>
          {[["login","Entrar"],["signup","Crear conta"]].map(([id,label])=>
            <button key={id} onClick={()=>{setMode(id);setMsg(null);}} style={{...S.btn(mode===id?T.bg2:"transparent",mode===id?T.text:T.text3),flex:1,borderRadius:8,fontSize:"0.82rem",boxShadow:mode===id?"0 1px 4px rgba(0,0,0,0.2)":"none"}}>{label}</button>
          )}
        </div>}

        {mode==="signup"&&<input value={nome} onChange={e=>setNome(e.target.value)} placeholder="O teu nome" style={S.input}/>}
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="ti@exemplo.com" style={S.input} autoComplete="email"/>
        {mode!=="reset"&&<input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Contrasinal (mín. 6)" style={S.input} autoComplete={mode==="signup"?"new-password":"current-password"}/>}

        {msg&&<div style={{background:msg.t==="ok"?`${T.ok}15`:`${T.danger}15`,border:`1px solid ${msg.t==="ok"?`${T.ok}44`:`${T.danger}44`}`,borderRadius:9,padding:"0.6rem 0.8rem"}}>
          <p style={{color:msg.t==="ok"?`${T.ok}`:`${T.danger}`,fontSize:"0.82rem",margin:0,lineHeight:1.5}}>{msg.m}</p>
        </div>}

        <button onClick={submit} disabled={loading} style={{...S.btn(T.accent),width:"100%",padding:"0.7rem",opacity:loading?0.6:1}}>
          {loading?"...":mode==="signup"?"Crear conta":mode==="reset"?"Enviar email":"Entrar"}
        </button>

        <button onClick={()=>{setMode(mode==="reset"?"login":"reset");setMsg(null);}} style={{background:"none",border:"none",color:T.text3,fontSize:"0.78rem",cursor:"pointer",fontFamily:"inherit"}}>
          {mode==="reset"?"← Volver":"Esquecín o contrasinal"}
        </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.text4,fontSize:"0.78rem",cursor:"pointer",fontFamily:"inherit"}}>Seguir sen conta</button>
      </div>
    </div>
  </div>);
}
