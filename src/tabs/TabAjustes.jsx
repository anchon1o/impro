// ============================================================
// tabs/TabAjustes.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState } from 'react';
import { useLang, useTheme, CAT_ICONS, ls, mkS } from '../core.jsx';
import { DINAMICAS_BASE } from '../datos.js';

export function TabAjustes(){
  const {T}=useTheme();const S=mkS(T);
  const [msg,setMsg]=useState("");
  const [stats,setStats]=useState(()=>ls.get("impro_stats",{cats:{},dins:{},total:0,mins:0}));
  const [view,setView]=useState("stats");
  const exportAll=()=>{
    const keys=["impro_dinamicas_v2","impro_sesiones","impro_grupos","impro_ideas_v2","impro_favoritos","impro_playlists_v2","impro_efectos_v2","impro_stats","impro_historial","impro_grupo_activo","impro_theme"];
    const data={version:"v7",fecha:new Date().toISOString()};
    keys.forEach(k=>{const v=ls.get(k,null);if(v!==null)data[k]=v;});
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;
    a.download=`improapp_${new Date().toLocaleDateString("es-ES").replace(/\//g,"-")}.json`;a.click();URL.revokeObjectURL(url);
    setMsg("✓ Exportado");setTimeout(()=>setMsg(""),3000);
  };
  const importAll=(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{try{
      const data=JSON.parse(ev.target.result);if(!data.version){setMsg("❌ Archivo no válido");return;}
      const keys=["impro_dinamicas_v2","impro_sesiones","impro_grupos","impro_ideas_v2","impro_favoritos","impro_playlists_v2","impro_efectos_v2","impro_stats","impro_historial","impro_grupo_activo"];
      let count=0;keys.forEach(k=>{if(data[k]!==undefined){ls.set(k,data[k]);count++;}});
      setMsg(`✓ Importado: ${count} secciones. Recarga para aplicar.`);
      setStats(ls.get("impro_stats",{cats:{},dins:{},total:0,mins:0}));
    }catch{setMsg("❌ Error al leer el archivo");}};
    reader.readAsText(file);e.target.value="";
  };
  const resetStats=()=>{if(!confirm("¿Borrar todas las estadísticas?"))return;ls.set("impro_stats",{cats:{},dins:{},total:0,mins:0});setStats({cats:{},dins:{},total:0,mins:0});};
  const topCats=Object.entries(stats.cats||{}).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const topDins=Object.entries(stats.dins||{}).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxCat=topCats[0]?.[1]||1;const maxDin=topDins[0]?.[1]||1;
  return(<div>
    <div style={{display:"flex",gap:"0.4rem",marginBottom:"1rem"}}>
      {[["stats","📊 Estadísticas"],["backup","💾 Backup"],["idioma","🌐 Idioma"]].map(([v,l])=>(<button key={v} onClick={()=>setView(v)} style={{...S.btn(view===v?T.accent:T.bg3,view===v?"#fff":T.text2),flex:1,fontSize:"0.8rem"}}>{l}</button>))}
    </div>
    {view==="stats"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.5rem",marginBottom:"1.25rem"}}>
        {[{label:"Generados",val:stats.total||0,col:T.accent},{label:"Minutos entrenados",val:stats.mins||0,col:"#40c4ff"},{label:"En Guía",val:ls.get("impro_dinamicas_v2",DINAMICAS_BASE).length,col:"#69f0ae"}].map((s,i)=>(
          <div key={i} style={{...S.panel,textAlign:"center",border:`1.5px solid ${s.col}44`}}><div style={{color:s.col,fontWeight:900,fontSize:"1.6rem",lineHeight:1}}>{s.val}</div><div style={{color:T.text3,fontSize:"0.7rem",marginTop:"0.25rem"}}>{s.label}</div></div>
        ))}
      </div>
      {(stats.total||0)===0&&<div style={{...S.panel,textAlign:"center",padding:"2rem",color:T.text4}}><p style={{fontSize:"1.5rem",margin:"0 0 0.5rem"}}>📊</p><p style={{margin:0}}>Genera estímulos y usa dinámicas para ver estadísticas aquí.</p></div>}
      {topCats.length>0&&<><p style={S.ptitle(T.accent)}>Categorías más generadas</p><div style={{display:"flex",flexDirection:"column",gap:"0.45rem",marginBottom:"1.25rem"}}>
        {topCats.map(([cat,n])=>(<div key={cat} style={{display:"flex",alignItems:"center",gap:"0.65rem"}}><span style={{color:T.text2,fontSize:"0.8rem",width:90,flexShrink:0}}>{CAT_ICONS[cat]||"◆"} {cat}</span><div style={{flex:1,height:8,background:T.bg3,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${(n/maxCat)*100}%`,background:T.accent,borderRadius:4,transition:"width 0.5s"}}/></div><span style={{color:T.accent,fontWeight:700,fontSize:"0.8rem",width:22,textAlign:"right",flexShrink:0}}>{n}</span></div>))}
      </div></>}
      {topDins.length>0&&<><p style={S.ptitle("#ffd740")}>Dinámicas más usadas (Reto)</p><div style={{display:"flex",flexDirection:"column",gap:"0.45rem",marginBottom:"1rem"}}>
        {topDins.map(([din,n])=>(<div key={din} style={{display:"flex",alignItems:"center",gap:"0.65rem"}}><span style={{color:T.text2,fontSize:"0.8rem",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{din}</span><div style={{width:80,height:8,background:T.bg3,borderRadius:4,overflow:"hidden",flexShrink:0}}><div style={{height:"100%",width:`${(n/maxDin)*100}%`,background:"#ffd740",borderRadius:4}}/></div><span style={{color:"#ffd740",fontWeight:700,fontSize:"0.8rem",width:22,textAlign:"right",flexShrink:0}}>{n}</span></div>))}
      </div></>}
      {(stats.total||0)>0&&<button onClick={resetStats} style={{...S.btn(T.bg3,T.text4),fontSize:"0.75rem"}}>↺ Borrar estadísticas</button>}
    </div>}
    {view==="idioma"&&<TabIdioma/>}
    {view==="backup"&&<div>
      <div style={{...S.panel,marginBottom:"0.75rem",border:"1.5px solid #69f0ae33"}}><p style={S.ptitle("#69f0ae")}>Exportar</p><p style={{color:T.text2,fontSize:"0.85rem",lineHeight:1.6,marginBottom:"0.85rem"}}>Descarga un JSON con todos tus datos: sesiones, grupos, dinámicas, ideas, favoritos, playlists y estadísticas.</p><button onClick={exportAll} style={{...S.btn("#69f0ae","#000"),width:"100%"}}>⬇ Exportar todo (.json)</button></div>
      <div style={{...S.panel,marginBottom:"0.75rem",border:"1.5px solid #40c4ff33"}}><p style={S.ptitle("#40c4ff")}>Importar</p><p style={{color:T.text2,fontSize:"0.85rem",lineHeight:1.6,marginBottom:"0.85rem"}}>Carga un archivo exportado anteriormente. Recarga la página tras importar.</p><label style={{...S.btn("#40c4ff","#000"),display:"block",textAlign:"center",cursor:"pointer",width:"100%",boxSizing:"border-box"}}>⬆ Importar .json<input type="file" accept=".json" onChange={importAll} style={{display:"none"}}/></label></div>
      {msg&&<div style={{...S.panel,background:msg.startsWith("✓")?"#0c1a0c":"#1a0c0c",border:`1px solid ${msg.startsWith("✓")?"#69f0ae44":"#ff6e4044"}`,color:msg.startsWith("✓")?"#69f0ae":"#ff6e40",fontSize:"0.85rem",marginBottom:"0.75rem"}}>{msg}</div>}

    </div>}
  </div>);
}

export function TabIdioma(){
  const {T}=useTheme();const S=mkS(T);
  const {lang,setLang}=useLang();
  const [msg,setMsg]=useState("");
  const LANGS=[["es","🇪🇸 Español"],["gl","🏴 Galego"],["en","🇬🇧 English"]];

  const exportForTranslation=()=>{
    const data=buildTranslationExport();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download=`improapp_traduccion_${new Date().toLocaleDateString("es-ES").replace(/\//g,"-")}.json`;
    a.click();URL.revokeObjectURL(url);
    setMsg("✓ Exportado. Pásalo a Claude para traducir los campos vacíos.");
    setTimeout(()=>setMsg(""),5000);
  };

  const importTranslation=(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{try{const data=JSON.parse(ev.target.result);if(!data.meta){setMsg("❌ Archivo no válido");return;}importTranslations(data);setMsg("✓ Traducciones importadas correctamente.");}catch{setMsg("❌ Error al leer el archivo");}};
    reader.readAsText(file);e.target.value="";
  };

  return(<div>
    <div style={{...S.panel,marginBottom:"1rem",border:`1.5px solid ${T.accent}33`}}>
      <p style={S.ptitle(T.accent)}>Idioma da interface</p>
      <div style={{display:"flex",gap:"0.5rem"}}>
        {LANGS.map(([code,label])=>(
          <button key={code} onClick={()=>setLang(code)} style={{...S.btn(lang===code?T.accent:T.bg3,lang===code?"#fff":T.text2),flex:1}}>{label}</button>
        ))}
      </div>
      <p style={{color:T.text4,fontSize:"0.75rem",marginTop:"0.6rem"}}>O galego e o inglés amósanse segundo as traducións importadas. Os campos sen traducir aparecen en español.</p>
    </div>
    <div style={{...S.panel,marginBottom:"0.75rem",border:"1.5px solid #e040fb33"}}>
      <p style={S.ptitle(T.accent)}>1. Exportar para traducir</p>
      <p style={{color:T.text2,fontSize:"0.84rem",lineHeight:1.6,marginBottom:"0.85rem"}}>Xera un JSON con todo o contido traducible. Pásallo a Claude con: <em style={{color:T.text3}}>"Traduce ao galego e inglés os campos gl e en baleiros."</em></p>
      <button onClick={exportForTranslation} style={{...S.btn(T.accent),width:"100%"}}>⬇ Exportar para traducir</button>
    </div>
    <div style={{...S.panel,border:"1.5px solid #40c4ff33"}}>
      <p style={S.ptitle("#40c4ff")}>2. Importar tradución</p>
      <p style={{color:T.text2,fontSize:"0.84rem",lineHeight:1.6,marginBottom:"0.85rem"}}>Carga o JSON devolto. Só enche os campos baleiros, nunca sobreescribe.</p>
      <label style={{...S.btn("#40c4ff","#000"),display:"block",textAlign:"center",cursor:"pointer",width:"100%",boxSizing:"border-box"}}>⬆ Importar tradución<input type="file" accept=".json" onChange={importTranslation} style={{display:"none"}}/></label>
    </div>
    {msg&&<div style={{...S.panel,background:msg.startsWith("✓")?"#0c1a0c":"#1a0c0c",border:`1px solid ${msg.startsWith("✓")?"#69f0ae44":"#ff6e4044"}`,color:msg.startsWith("✓")?"#69f0ae":"#ff6e40",fontSize:"0.84rem",marginTop:"0.75rem"}}>{msg}</div>}
    {loadTranslations()&&<button onClick={()=>{ls.set("impro_translations",null);setMsg("↺ Traducciones borradas");}} style={{...S.btn(T.bg3,T.text4),fontSize:"0.75rem",marginTop:"0.75rem"}}>↺ Borrar traducciones</button>}
  </div>);
}
