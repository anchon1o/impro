// ============================================================
// auth/LoginGate.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useAuth, useTheme, mkS } from '../core.jsx';

export function LoginGate({children,titulo,descricion}){
  const {T}=useTheme();const S=mkS(T);
  const {logueado,pedirLogin}=useAuth();
  if(logueado)return children;
  return(<div style={{...S.panel,textAlign:"center",padding:"2.5rem 1.5rem",border:`1.5px dashed ${T.border}`}}>
    <div style={{fontSize:"2.5rem",marginBottom:"0.75rem",opacity:0.5}}>🔒</div>
    <h3 style={{color:T.text,fontWeight:900,fontSize:"1.05rem",margin:"0 0 0.4rem"}}>{titulo||"Necesitas unha conta"}</h3>
    <p style={{color:T.text3,fontSize:"0.85rem",lineHeight:1.6,margin:"0 0 1.25rem",maxWidth:340,marginLeft:"auto",marginRight:"auto"}}>{descricion||"Crea unha conta gratuíta para gardar os teus datos e acceder dende calquera dispositivo."}</p>
    <button onClick={pedirLogin} style={{...S.btn(T.accent),padding:"0.6rem 1.5rem"}}>Entrar ou crear conta</button>
  </div>);
}
