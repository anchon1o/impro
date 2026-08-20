// ============================================================
// tabs/TabAdmin.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme, mkS, useViewport, useAuth } from '../core.jsx';
import { LimiteErro } from '../LimiteErro.jsx';
import { AdminUsuarios, AdminGrupos } from './AdminUsuarios.jsx';
import { AdminEstimulos, AdminTraducions } from './AdminEstimulos.jsx';
import { AdminUniverso } from './AdminUniverso.jsx';
import { AdminDinamicas } from './AdminDinamicas.jsx';
import { AdminStats, AdminConfig } from './AdminSistema.jsx';
import { AdminAxenda } from './AdminAxenda.jsx';
import { AdminSonidos } from '../sonido/AdminSonidos.jsx';
import { AdminReportes } from './AdminReportes.jsx';

export const ADMIN_PIN = "1234";

export function TabAdmin(){
  const {T}=useTheme();const S=mkS(T);
  const {esMovil}=useViewport();
  const {perfil}=useAuth();
  const [adminTab,setAdminTab]=useState("usuarios");

  if(perfil?.rol!=="admin")return(<div style={{maxWidth:360,margin:"0 auto",paddingTop:"3rem",textAlign:"center"}}>
    <p style={{fontSize:"2.5rem",margin:"0 0 0.75rem"}}>🔐</p>
    <p style={S.ptitle(T.accent)}>Acceso restrinxido</p>
    <p style={{color:T.text3,fontSize:"0.88rem",lineHeight:1.6}}>Esta sección só está dispoñible para administradores. Se precisas acceso, contacta cun admin.</p>
  </div>);

  const ADMIN_TABS=[
    {id:"usuarios",emoji:"👤",label:"Usuarios"},
    {id:"estimulos",emoji:"✦",label:"Estímulos"},
    {id:"traducions",emoji:"🌐",label:"Idiomas"},
    {id:"dinamicas",emoji:"📖",label:"Dinámicas"},
    {id:"sonidos",emoji:"🔊",label:"Sons"},
    {id:"universo",emoji:"🌍",label:"Universo"},
    {id:"axenda",emoji:"📅",label:"Axenda"},
    {id:"reportes",emoji:"🐛",label:"Reportes"},
    {id:"grupos",emoji:"👥",label:"Grupos"},
    {id:"stats",emoji:"📊",label:"Stats"},
    {id:"config",emoji:"⚙️",label:"Config"},
  ];

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
      <p style={S.ptitle(T.warn)}>Admin Panel</p>
      <span style={{color:T.text4,fontSize:"0.75rem"}}>{perfil?.email}</span>
    </div>

    {/* Menú interno */}
    <div style={{display:"flex",gap:3,marginBottom:"1.25rem",background:T.bg3,borderRadius:12,padding:3,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}} className="admin-tabs">
      {ADMIN_TABS.map(tab=><button key={tab.id} onClick={()=>setAdminTab(tab.id)} style={{...S.btn(adminTab===tab.id?T.bg2:"transparent",adminTab===tab.id?T.text:T.text3),flex:esMovil?"0 0 auto":1,minWidth:esMovil?64:0,borderRadius:9,padding:"0.45rem 0.5rem",fontSize:"0.72rem",fontWeight:adminTab===tab.id?700:500,display:"flex",flexDirection:"column",alignItems:"center",gap:"0.2rem",boxShadow:adminTab===tab.id?"0 1px 4px rgba(0,0,0,0.2)":"none"}}>
        <span style={{fontSize:"1rem"}}>{tab.emoji}</span>
        <span>{tab.label}</span>
      </button>)}
    </div>

    <LimiteErro onde={`admin/${adminTab}`} T={T}>
    {adminTab==="usuarios"&&<AdminUsuarios T={T} S={S}/>}
    {adminTab==="estimulos"&&<AdminEstimulos T={T} S={S}/>}
    {adminTab==="traducions"&&<AdminTraducions T={T} S={S}/>}
    {adminTab==="dinamicas"&&<AdminDinamicas T={T} S={S}/>}
    {adminTab==="sonidos"&&<AdminSonidos T={T} S={S}/>}
    {adminTab==="universo"&&<AdminUniverso T={T} S={S}/>}
    {adminTab==="axenda"&&<AdminAxenda/>}
    {adminTab==="reportes"&&<AdminReportes/>}
    {adminTab==="grupos"&&<AdminGrupos T={T} S={S}/>}
    {adminTab==="stats"&&<AdminStats T={T} S={S}/>}
    {adminTab==="config"&&<AdminConfig T={T} S={S}/>}
    </LimiteErro>
  </div>);
}

// ⚠️ Reexportadas para non romper quen as importase desde aquí.
// `AdminDinamicas` úsao o harness de probas, por exemplo.
export { AdminUsuarios, AdminGrupos, AdminEstimulos, AdminTraducions,
         AdminUniverso, AdminDinamicas, AdminStats, AdminConfig };
