// ============================================================
// tabs/TabAjustes.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState } from 'react';
import { useLang, useTheme, CAT_ICONS, ls, mkS, LANGS } from '../core.jsx';
import { SelectorTemas } from './SelectorTemas.jsx';
import { DINAMICAS_BASE } from '../datos.js';

export function TabAjustes(){
  const {T}=useTheme();const S=mkS(T);
  const [msg,setMsg]=useState("");
  const [stats,setStats]=useState(()=>ls.get("impro_stats",{cats:{},dins:{},total:0,mins:0}));
  const [view,setView]=useState("tema");
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
      const data=JSON.parse(ev.target.result);if(!data.version){setMsg("❌ Ficheiro non válido");return;}
      const keys=["impro_dinamicas_v2","impro_sesiones","impro_grupos","impro_ideas_v2","impro_favoritos","impro_playlists_v2","impro_efectos_v2","impro_stats","impro_historial","impro_grupo_activo"];
      let count=0;keys.forEach(k=>{if(data[k]!==undefined){ls.set(k,data[k]);count++;}});
      setMsg(`✓ Importado: ${count} secciones. Recarga para aplicar.`);
      setStats(ls.get("impro_stats",{cats:{},dins:{},total:0,mins:0}));
    }catch{setMsg("❌ Erro ao ler o ficheiro");}};
    reader.readAsText(file);e.target.value="";
  };
  const resetStats=()=>{if(!confirm("Borrar todas as estatísticas?"))return;ls.set("impro_stats",{cats:{},dins:{},total:0,mins:0});setStats({cats:{},dins:{},total:0,mins:0});};
  const topCats=Object.entries(stats.cats||{}).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const topDins=Object.entries(stats.dins||{}).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxCat=topCats[0]?.[1]||1;const maxDin=topDins[0]?.[1]||1;
  return(<div>
    <div style={{display:"flex",gap:"0.4rem",marginBottom:"1rem"}}>
      {[["tema","🎨 Tema"],["stats","📊 Estadísticas"],["backup","💾 Backup"],["idioma","🌐 Idioma"]].map(([v,l])=>(<button key={v} onClick={()=>setView(v)} style={{...S.btn(view===v?T.accent:T.bg3,view===v?"#fff":T.text2),flex:1,fontSize:"0.8rem"}}>{l}</button>))}
    </div>
    {view==="tema"&&<SelectorTemas/>}
    {view==="stats"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.5rem",marginBottom:"1.25rem"}}>
        {[{label:"Generados",val:stats.total||0,col:T.accent},{label:"Minutos entrenados",val:stats.mins||0,col:T.info},{label:"En Guía",val:ls.get("impro_dinamicas_v2",DINAMICAS_BASE).length,col:T.ok}].map((s,i)=>(
          <div key={i} style={{...S.panel,textAlign:"center",border:`1.5px solid ${s.col}44`}}><div style={{color:s.col,fontWeight:900,fontSize:"1.6rem",lineHeight:1}}>{s.val}</div><div style={{color:T.text3,fontSize:"0.7rem",marginTop:"0.25rem"}}>{s.label}</div></div>
        ))}
      </div>
      {(stats.total||0)===0&&<div style={{...S.panel,textAlign:"center",padding:"2rem",color:T.text4}}><p style={{fontSize:"1.5rem",margin:"0 0 0.5rem"}}>📊</p><p style={{margin:0}}>Xera estímulos e usa dinámicas para ver estatísticas aquí.</p></div>}
      {topCats.length>0&&<><p style={S.ptitle(T.accent)}>Categorías máis xeradas</p><div style={{display:"flex",flexDirection:"column",gap:"0.45rem",marginBottom:"1.25rem"}}>
        {topCats.map(([cat,n])=>(<div key={cat} style={{display:"flex",alignItems:"center",gap:"0.65rem"}}><span style={{color:T.text2,fontSize:"0.8rem",width:90,flexShrink:0}}>{CAT_ICONS[cat]||"◆"} {cat}</span><div style={{flex:1,height:8,background:T.bg3,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${(n/maxCat)*100}%`,background:T.accent,borderRadius:4,transition:"width 0.5s"}}/></div><span style={{color:T.accent,fontWeight:700,fontSize:"0.8rem",width:22,textAlign:"right",flexShrink:0}}>{n}</span></div>))}
      </div></>}
      {topDins.length>0&&<><p style={S.ptitle(T.warn)}>Dinámicas máis usadas (Reto)</p><div style={{display:"flex",flexDirection:"column",gap:"0.45rem",marginBottom:"1rem"}}>
        {topDins.map(([din,n])=>(<div key={din} style={{display:"flex",alignItems:"center",gap:"0.65rem"}}><span style={{color:T.text2,fontSize:"0.8rem",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{din}</span><div style={{width:80,height:8,background:T.bg3,borderRadius:4,overflow:"hidden",flexShrink:0}}><div style={{height:"100%",width:`${(n/maxDin)*100}%`,background:T.warn,borderRadius:4}}/></div><span style={{color:T.warn,fontWeight:700,fontSize:"0.8rem",width:22,textAlign:"right",flexShrink:0}}>{n}</span></div>))}
      </div></>}
      {(stats.total||0)>0&&<button onClick={resetStats} style={{...S.btn(T.bg3,T.text4),fontSize:"0.75rem"}}>↺ Borrar estatísticas</button>}
    </div>}
    {view==="idioma"&&<TabIdioma/>}
    {view==="backup"&&<div>
      <div style={{...S.panel,marginBottom:"0.75rem",border:`1.5px solid ${T.ok}33`}}><p style={S.ptitle(T.ok)}>Exportar</p><p style={{color:T.text2,fontSize:"0.85rem",lineHeight:1.6,marginBottom:"0.85rem"}}>Descarga un JSON con todos os teus datos: sesións, grupos, dinámicas, ideas, favoritos, playlists e estatísticas.</p><button onClick={exportAll} style={{...S.btn(T.ok,"#000"),width:"100%"}}>⬇ Exportar todo (.json)</button></div>
      <div style={{...S.panel,marginBottom:"0.75rem",border:`1.5px solid ${T.info}33`}}><p style={S.ptitle(T.info)}>Importar</p><p style={{color:T.text2,fontSize:"0.85rem",lineHeight:1.6,marginBottom:"0.85rem"}}>Carga un ficheiro exportado anteriormente. Recarga a páxina tras importar.</p><label style={{...S.btn(T.info,"#000"),display:"block",textAlign:"center",cursor:"pointer",width:"100%",boxSizing:"border-box"}}>⬆ Importar .json<input type="file" accept=".json" onChange={importAll} style={{display:"none"}}/></label></div>
      {msg&&<div style={{...S.panel,background:msg.startsWith("✓")?"#0c1a0c":"#1a0c0c",border:`1px solid ${msg.startsWith("✓")?T.ok+"44":T.danger+"44"}`,color:msg.startsWith("✓")?T.ok:T.danger,fontSize:"0.85rem",marginBottom:"0.75rem"}}>{msg}</div>}

    </div>}
  </div>);
}

// Selector de idioma da interface.
//
// ⚠️ Aquí había tamén un bloque de exportar/importar traducións que chamaba
// a tres funcións inexistentes (buildTranslationExport, importTranslations,
// loadTranslations): restos dunha versión anterior. Non compilaba mal, pero
// tumbaba a app ao premer o botón. Ademais duplicaba o que xa fai
// Admin → Idiomas, que si funciona e é onde corresponde.
export function TabIdioma(){
  const {T}=useTheme();const S=mkS(T);
  const {lang,setLang}=useLang();

  return(<div>
    <p style={S.ptitle(T.accent)}>Idioma da interface</p>
    <p style={{...S.caption,marginBottom:"0.9rem"}}>
      Os idiomas marcados como «só contido» aínda non teñen a interface
      traducida: verás os menús en castelán, pero os estímulos si na lingua
      escollida.
    </p>

    <div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>
      {LANGS.map(L=>(
        <button key={L.id} onClick={()=>setLang(L.id)} style={{
          display:"flex",alignItems:"center",gap:"0.6rem",
          background:lang===L.id?T.accent+"22":T.bg3,
          borderStyle:"solid",borderWidth:1,
          borderColor:lang===L.id?T.accent:T.border,
          borderRadius:10,padding:"0.7rem 0.8rem",cursor:"pointer",
          color:lang===L.id?T.accent:T.text2,fontSize:"0.86rem",
          fontFamily:"inherit",textAlign:"left",minHeight:38}}>
          <span style={{fontFamily:"monospace",fontWeight:700,fontSize:"0.72rem",opacity:0.7,width:22}}>{L.id.toUpperCase()}</span>
          <span style={{flex:1}}>{L.nativo}</span>
          {!L.uiCompleta&&<span style={{fontSize:"0.68rem",color:T.text4}}>só contido</span>}
          {lang===L.id&&<span style={{color:T.accent}}>✓</span>}
        </button>))}
    </div>

    <p style={{...S.caption,marginTop:"1rem"}}>
      Para traducir os estímulos ou a interface, vai a <strong>Admin → Idiomas</strong>.
    </p>
  </div>);
}
