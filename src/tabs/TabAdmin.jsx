// ============================================================
// tabs/TabAdmin.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, t, useTheme, FALLBACK_ESTIMULOS, useEstimulos, CAT_ICONS, ls, mkS, TIPO_COLOR } from '../core.jsx';
import { DINAMICAS_BASE } from '../datos.js';
import { listarUsuarios, aprobarUsuario, cambiarRol, listarPropostasCompartir, aprobarCompartir } from '../auth.js';
import { getDinamicas, deleteDinamica } from '../db.js';
import { IDIOMAS, listarEstimulos, engadirEstimulo, editarEstimulo, borrarEstimulo, exportarTraducion, importarTraducion, progresoTraducion } from '../estimulos.js';
import { listarPendentesUniverso, verificarUniverso } from '../universo.js';

export const ADMIN_PIN = "1234";

export function TabAdmin(){
  const {T}=useTheme();const S=mkS(T);
  const {perfil}=useAuth();
  const [adminTab,setAdminTab]=useState("usuarios");

  if(perfil?.rol!=="admin")return(<div style={{maxWidth:360,margin:"0 auto",paddingTop:"3rem",textAlign:"center"}}>
    <p style={{fontSize:"2.5rem",margin:"0 0 0.75rem"}}>🔐</p>
    <p style={S.ptitle(T.accent)}>Acceso restrinxido</p>
    <p style={{color:T.text3,fontSize:"0.88rem",lineHeight:1.6}}>Esta sección só está dispoñible para administradores. Se necesitas acceso, contacta cun admin.</p>
  </div>);

  const ADMIN_TABS=[
    {id:"usuarios",emoji:"👤",label:"Usuarios"},
    {id:"estimulos",emoji:"✦",label:"Estímulos"},
    {id:"traducions",emoji:"🌐",label:"Idiomas"},
    {id:"dinamicas",emoji:"📖",label:"Dinámicas"},
    {id:"universo",emoji:"🌍",label:"Universo"},
    {id:"stats",emoji:"📊",label:"Stats"},
    {id:"config",emoji:"⚙️",label:"Config"},
  ];

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
      <p style={S.ptitle("#ffd740")}>Admin Panel</p>
      <span style={{color:T.text4,fontSize:"0.75rem"}}>{perfil?.email}</span>
    </div>

    {/* Menú interno */}
    <div style={{display:"flex",gap:3,marginBottom:"1.25rem",background:T.bg3,borderRadius:12,padding:3}}>
      {ADMIN_TABS.map(tab=><button key={tab.id} onClick={()=>setAdminTab(tab.id)} style={{...S.btn(adminTab===tab.id?T.bg2:"transparent",adminTab===tab.id?T.text:T.text3),flex:1,borderRadius:9,padding:"0.4rem 0.3rem",fontSize:"0.75rem",fontWeight:adminTab===tab.id?700:400,display:"flex",flexDirection:"column",alignItems:"center",gap:"0.15rem",boxShadow:adminTab===tab.id?"0 1px 4px rgba(0,0,0,0.2)":"none"}}>
        <span style={{fontSize:"1rem"}}>{tab.emoji}</span>
        <span>{tab.label}</span>
      </button>)}
    </div>

    {adminTab==="usuarios"&&<AdminUsuarios T={T} S={S}/>}
    {adminTab==="estimulos"&&<AdminEstimulos T={T} S={S}/>}
    {adminTab==="traducions"&&<AdminTraducions T={T} S={S}/>}
    {adminTab==="dinamicas"&&<AdminDinamicas T={T} S={S}/>}
    {adminTab==="universo"&&<AdminUniverso T={T} S={S}/>}
    {adminTab==="stats"&&<AdminStats T={T} S={S}/>}
    {adminTab==="config"&&<AdminConfig T={T} S={S}/>}
  </div>);
}

export function AdminEstimulos({T,S}){
  const {cats:CATS_DB,recargar}=useEstimulos();
  const listaCats=CATS_DB.length?CATS_DB:Object.keys(FALLBACK_ESTIMULOS).map(id=>({id,icona:CAT_ICONS[id]||"◆",nome:id}));
  const [cat,setCat]=useState(listaCats[0]?.id||"PROFESIÓN");
  const [nivel,setNivel]=useState("simple");
  const [items,setItems]=useState([]);
  const [cargando,setCargando]=useState(true);
  const [editId,setEditId]=useState(null);
  const [editText,setEditText]=useState("");
  const [newText,setNewText]=useState("");
  const [busca,setBusca]=useState("");
  const [langCol,setLangCol]=useState("es");

  const cargar=useCallback(async()=>{
    setCargando(true);
    const r=await listarEstimulos(cat,nivel);
    setItems(r);setCargando(false);
  },[cat,nivel]);
  useEffect(()=>{cargar();},[cargar]);

  const colOf=l=>l==="es"?"texto_es":`texto_${l}`;
  const textoDe=it=>it[colOf(langCol)]||"";

  const addItem=async()=>{
    if(!newText.trim())return;
    const novo=await engadirEstimulo(cat,nivel,newText.trim());
    if(novo){setItems(p=>[...p,novo]);setNewText("");recargar(true);}
  };
  const saveEdit=async(it)=>{
    if(!editText.trim())return;
    const ok=await editarEstimulo(it.id,{[colOf(langCol)]:editText.trim()});
    if(ok){setItems(p=>p.map(x=>x.id===it.id?{...x,[colOf(langCol)]:editText.trim()}:x));recargar(true);}
    setEditId(null);setEditText("");
  };
  const delItem=async(it)=>{
    if(!confirm(`Eliminar "${it.texto_es}"?`))return;
    const ok=await borrarEstimulo(it.id);
    if(ok){setItems(p=>p.filter(x=>x.id!==it.id));recargar(true);}
  };

  const visibles=items.filter(it=>!busca||(it.texto_es||"").toLowerCase().includes(busca.toLowerCase()));
  const traducidos=items.filter(it=>langCol==="es"||it[colOf(langCol)]).length;

  return(<div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.85rem",flexWrap:"wrap"}}>
      <select value={cat} onChange={e=>setCat(e.target.value)} style={{...S.input,flex:1,minWidth:140}}>
        {listaCats.map(c=><option key={c.id} value={c.id}>{c.icona} {c.nome}</option>)}
      </select>
      <div style={{display:"flex",background:T.bg3,borderRadius:10,padding:3,gap:2}}>
        {[["simple","◆ Simple"],["plus","⭐ Plus"]].map(([v,l])=>
          <button key={v} onClick={()=>setNivel(v)} style={{...S.btn(nivel===v?T.accent:"transparent",nivel===v?"#fff":T.text3),borderRadius:8,padding:"0.35rem 0.7rem",fontSize:"0.78rem"}}>{l}</button>)}
      </div>
    </div>

    <div style={{display:"flex",gap:"0.3rem",marginBottom:"0.85rem",flexWrap:"wrap",alignItems:"center"}}>
      <span style={{color:T.text4,fontSize:"0.72rem",fontFamily:"monospace",letterSpacing:"0.1em"}}>IDIOMA</span>
      {IDIOMAS.map(l=>
        <button key={l.id} onClick={()=>setLangCol(l.id)} style={{background:langCol===l.id?T.accent:T.bg3,color:langCol===l.id?"#fff":T.text3,border:"none",borderRadius:16,padding:"0.22rem 0.6rem",fontSize:"0.72rem",fontWeight:langCol===l.id?700:400,cursor:"pointer",fontFamily:"inherit"}}>{l.id.toUpperCase()}</button>)}
      {langCol!=="es"&&<span style={{color:traducidos===items.length?"#69f0ae":"#ffd740",fontSize:"0.75rem",marginLeft:"auto"}}>{traducidos}/{items.length} traducidos</span>}
    </div>

    <div style={{...S.panel,marginBottom:"0.85rem",padding:"0.5rem 1rem",display:"flex",gap:"1.25rem",flexWrap:"wrap"}}>
      <span style={{color:T.text3,fontSize:"0.8rem"}}>Total: <strong style={{color:T.text}}>{items.length}</strong></span>
      <span style={{color:T.text3,fontSize:"0.8rem"}}>Visibles: <strong style={{color:T.accent}}>{visibles.length}</strong></span>
    </div>

    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.85rem"}}>
      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔍 Buscar..." style={{...S.input,flex:1}}/>
    </div>

    {langCol==="es"&&<div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem"}}>
      <input value={newText} onChange={e=>setNewText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} placeholder={`Novo estímulo de ${cat}...`} style={{...S.input,flex:1}}/>
      <button onClick={addItem} style={S.btn(T.accent)}>+ Engadir</button>
    </div>}

    {cargando?<p style={{color:T.text3,fontSize:"0.85rem"}}>Cargando...</p>:(
      <div style={{display:"flex",flexDirection:"column",gap:"0.35rem",maxHeight:520,overflowY:"auto"}}>
        {visibles.map(it=>{
          const editando=editId===it.id;
          const val=textoDe(it);
          const falta=langCol!=="es"&&!val;
          return(<div key={it.id} style={{...S.panel,padding:"0.55rem 0.8rem",display:"flex",gap:"0.6rem",alignItems:"center",border:`1.5px solid ${falta?"#ffd74033":T.border}`}}>
            {editando?(<>
              <input value={editText} onChange={e=>setEditText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEdit(it)} style={{...S.input,flex:1,fontSize:"0.86rem"}} autoFocus/>
              <button onClick={()=>saveEdit(it)} style={{...S.btn(T.accent),padding:"0.3rem 0.6rem"}}>✓</button>
              <button onClick={()=>setEditId(null)} style={{...S.btn(T.bg3,T.text3),padding:"0.3rem 0.6rem"}}>✕</button>
            </>):(<>
              <div style={{flex:1,minWidth:0}}>
                <span style={{color:falta?T.text4:T.text,fontSize:"0.86rem",fontStyle:falta?"italic":"normal"}}>{val||"— sen tradución —"}</span>
                {langCol!=="es"&&<p style={{color:T.text4,fontSize:"0.74rem",margin:"0.1rem 0 0"}}>{it.texto_es}</p>}
              </div>
              <button onClick={()=>{setEditId(it.id);setEditText(val);}} style={{...S.btn(T.bg3,T.text3),padding:"0.28rem 0.5rem",fontSize:"0.76rem"}}>✏️</button>
              {langCol==="es"&&<button onClick={()=>delItem(it)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.9rem"}}>×</button>}
            </>)}
          </div>);
        })}
        {visibles.length===0&&<p style={{color:T.text4,fontSize:"0.83rem"}}>Sen resultados.</p>}
      </div>
    )}
  </div>);
}

export function AdminTraducions({T,S}){
  const {recargar}=useEstimulos();
  const [lang,setLang]=useState("gl");
  const [soloPendentes,setSoloPendentes]=useState(true);
  const [progreso,setProgreso]=useState(null);
  const [msg,setMsg]=useState(null);
  const [traballando,setTraballando]=useState(false);
  const fileRef=useRef(null);

  useEffect(()=>{progresoTraducion().then(setProgreso);},[]);

  const exportar=async()=>{
    setTraballando(true);setMsg(null);
    const json=await exportarTraducion(lang,{soloPendentes});
    if(!json||json.items.length===0){
      setMsg({t:"err",m:soloPendentes?"Non hai nada pendente de traducir neste idioma.":"Non se puido exportar."});
      setTraballando(false);return;
    }
    const blob=new Blob([JSON.stringify(json,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`improapp_traducion_${lang}_${json._data}.json`;
    a.click();URL.revokeObjectURL(a.href);
    setMsg({t:"ok",m:`Exportadas ${json.items.length} entradas. Pásallo a Claude para traducir.`});
    setTraballando(false);
  };

  const importar=async(ev)=>{
    const f=ev.target.files?.[0];if(!f)return;
    setTraballando(true);setMsg(null);
    try{
      const json=JSON.parse(await f.text());
      const r=await importarTraducion(json);
      if(!r.ok)setMsg({t:"err",m:r.erro});
      else{
        setMsg({t:"ok",m:`Importadas ${r.actualizados} traducións${r.erros?` (${r.erros} erros)`:""}.`});
        progresoTraducion().then(setProgreso);
        recargar(true);
      }
    }catch(e){setMsg({t:"err",m:"O ficheiro non é un JSON válido."});}
    setTraballando(false);
    if(fileRef.current)fileRef.current.value="";
  };

  const tot=progreso?.total||{total:0,gl:0,en:0,pt:0,it:0};
  const pct=k=>tot.total?Math.round((tot[k]/tot.total)*100):0;

  return(<div style={{display:"flex",flexDirection:"column",gap:"0.85rem"}}>
    <div style={S.panel}>
      <p style={S.ptitle(T.accent)}>Progreso de tradución</p>
      <div style={{display:"flex",flexDirection:"column",gap:"0.55rem"}}>
        {IDIOMAS.filter(l=>l.id!=="es").map(l=>(
          <div key={l.id} style={{display:"flex",gap:"0.6rem",alignItems:"center"}}>
            <span style={{color:T.text3,fontSize:"0.8rem",width:78,flexShrink:0}}>{l.label}</span>
            <div style={{flex:1,height:8,background:T.bg3,borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct(l.id)}%`,background:pct(l.id)===100?"#69f0ae":T.accent,borderRadius:4,transition:"width 0.5s"}}/>
            </div>
            <span style={{color:T.text,fontSize:"0.78rem",fontWeight:700,width:58,textAlign:"right"}}>{tot[l.id]}/{tot.total}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={S.panel}>
      <p style={S.ptitle("#40c4ff")}>Exportar para traducir</p>
      <p style={{color:T.text3,fontSize:"0.82rem",lineHeight:1.6,marginBottom:"0.85rem"}}>
        Descarga un JSON coas entradas a traducir, pásallo a Claude e volve importalo aquí.
      </p>
      <div style={{display:"flex",gap:"0.3rem",marginBottom:"0.75rem",flexWrap:"wrap"}}>
        {IDIOMAS.filter(l=>l.id!=="es").map(l=>
          <button key={l.id} onClick={()=>setLang(l.id)} style={{background:lang===l.id?"#40c4ff":T.bg3,color:lang===l.id?"#000":T.text3,border:"none",borderRadius:16,padding:"0.25rem 0.7rem",fontSize:"0.76rem",fontWeight:lang===l.id?700:400,cursor:"pointer",fontFamily:"inherit"}}>{l.label}</button>)}
      </div>
      <label style={{display:"flex",gap:"0.45rem",alignItems:"center",marginBottom:"0.85rem",cursor:"pointer"}}>
        <input type="checkbox" checked={soloPendentes} onChange={e=>setSoloPendentes(e.target.checked)} style={{accentColor:T.accent}}/>
        <span style={{color:T.text2,fontSize:"0.82rem"}}>Só as entradas sen traducir</span>
      </label>
      <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
        <button onClick={exportar} disabled={traballando} style={{...S.btn("#40c4ff","#000"),opacity:traballando?0.5:1}}>⬇ Exportar JSON</button>
        <button onClick={()=>fileRef.current?.click()} disabled={traballando} style={{...S.btn("#69f0ae","#000"),opacity:traballando?0.5:1}}>⬆ Importar traducido</button>
        <input ref={fileRef} type="file" accept=".json,application/json" onChange={importar} style={{display:"none"}}/>
      </div>
      {msg&&<div style={{marginTop:"0.75rem",background:msg.t==="ok"?"#69f0ae15":"#ff6e4015",border:`1px solid ${msg.t==="ok"?"#69f0ae44":"#ff6e4044"}`,borderRadius:9,padding:"0.6rem 0.85rem"}}>
        <p style={{color:msg.t==="ok"?"#69f0ae":"#ff6e40",fontSize:"0.82rem",margin:0,lineHeight:1.5}}>{msg.m}</p>
      </div>}
    </div>

    <div style={{...S.panel,border:`1.5px solid ${T.border}`}}>
      <p style={S.ptitle(T.text3)}>Como traducir con Claude</p>
      <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
        {["Exporta o JSON do idioma que queiras.",
          "Abre unha conversa con Claude e sobe o ficheiro.",
          "Pídelle que encha o campo do idioma en cada entrada, mantendo os ids intactos.",
          "Garda o JSON que devolva e impórtao aquí."].map((t,i)=>(
          <div key={i} style={{display:"flex",gap:"0.55rem"}}>
            <span style={{color:T.accent,fontSize:"0.78rem",fontFamily:"monospace",flexShrink:0}}>{i+1}</span>
            <span style={{color:T.text2,fontSize:"0.83rem",lineHeight:1.5}}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  </div>);
}

export function AdminDinamicas({T,S}){
  const [dinamicas,setDinamicas]=useState(()=>ls.get("impro_dinamicas_v2",DINAMICAS_BASE));
  const [search,setSearch]=useState("");
  const [filtro,setFiltro]=useState("todos");
  useEffect(()=>{getDinamicas(DINAMICAS_BASE).then(setDinamicas);},[]);
  const tipos=["todos",...new Set(dinamicas.map(d=>d.tipo))];
  const lista=dinamicas.filter(d=>(filtro==="todos"||d.tipo===filtro)&&(!search||d.nombre.toLowerCase().includes(search.toLowerCase())));
  const deleteDin=async id=>{if(!confirm("¿Eliminar?"))return;const u=dinamicas.filter(d=>d.id!==id);setDinamicas(u);await deleteDinamica(id);};
  const restoreAll=()=>{if(!confirm("¿Restaurar todas as dinámicas base?"))return;setDinamicas(DINAMICAS_BASE);ls.set("impro_dinamicas_v2",DINAMICAS_BASE);};
  return(<div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.75rem",flexWrap:"wrap",alignItems:"center"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...S.input,flex:1}}/>
      <span style={{color:T.text4,fontSize:"0.78rem"}}>{lista.length}/{dinamicas.length}</span>
      <button onClick={restoreAll} style={{...S.btn(T.bg3,"#ff6e40"),fontSize:"0.75rem"}}>↺ Restaurar</button>
    </div>
    <div style={{display:"flex",gap:"0.3rem",marginBottom:"0.85rem",flexWrap:"wrap"}}>
      {tipos.map(t=><button key={t} onClick={()=>setFiltro(t)} style={{background:filtro===t?(TIPO_COLOR[t]||T.accent):T.bg3,color:filtro===t?"#000":T.text3,border:"none",borderRadius:20,padding:"0.25rem 0.7rem",fontSize:"0.72rem",fontWeight:filtro===t?700:400,cursor:"pointer",fontFamily:"inherit"}}>{t}</button>)}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
      {lista.map(d=>(<div key={d.id} style={{...S.panel,padding:"0.6rem 0.9rem",display:"flex",gap:"0.6rem",alignItems:"center",borderLeft:`3px solid ${TIPO_COLOR[d.tipo]||T.accent}`}}>
        <div style={{flex:1}}>
          <span style={{fontWeight:700,color:T.text,fontSize:"0.88rem"}}>{d.nombre}</span>
          <span style={{...S.tag(TIPO_COLOR[d.tipo]||T.accent),marginLeft:"0.4rem"}}>{d.tipo}</span>
          <span style={{color:T.text4,fontSize:"0.75rem",marginLeft:"0.4rem"}}>⏱{d.duracion}min</span>
        </div>
        <button onClick={()=>deleteDin(d.id)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.9rem"}}>×</button>
      </div>))}
    </div>
  </div>);
}

export function AdminUniverso({T,S}){
  const [pendentes,setPendentes]=useState([]);
  const [loading,setLoading]=useState(true);

  const cargar=useCallback(async()=>{
    setLoading(true);
    const p=await listarPendentesUniverso();
    setPendentes(p);setLoading(false);
  },[]);
  useEffect(()=>{cargar();},[cargar]);

  const decidir=async(id,aprobar)=>{
    await verificarUniverso(id,aprobar);
    setPendentes(prev=>prev.filter(x=>x.id!==id));
  };

  const TIPO_COL={"compañía":"#e040fb",festival:"#ffd740",escola:"#40c4ff",persoa:"#69f0ae",proxecto:"#ff6e40"};

  if(loading)return<p style={{color:T.text3,fontSize:"0.85rem"}}>Cargando...</p>;

  return(<div>
    <div style={S.panel}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.85rem"}}>
        <p style={{...S.ptitle(T.accent),margin:0}}>Entradas pendentes de verificar ({pendentes.length})</p>
        <button onClick={cargar} style={{...S.btn(T.bg3,T.text3),fontSize:"0.75rem"}}>↻</button>
      </div>
      {pendentes.length===0&&<p style={{color:T.text4,fontSize:"0.83rem"}}>Sen entradas pendentes. Todo o Universo Impro está revisado.</p>}
      <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
        {pendentes.map(p=>(<div key={p.id} style={{background:T.bg3,borderRadius:10,padding:"0.7rem 0.9rem",borderLeft:`3px solid ${TIPO_COL[p.tipo]||T.accent}`}}>
          <div style={{marginBottom:"0.5rem"}}>
            <span style={{color:T.text,fontWeight:700,fontSize:"0.88rem"}}>{p.pais} {p.nome}</span>
            <span style={{...S.tag(TIPO_COL[p.tipo]||T.accent),marginLeft:"0.4rem"}}>{p.tipo}</span>
            <p style={{color:T.text3,fontSize:"0.78rem",margin:"0.35rem 0 0",lineHeight:1.5}}>{p.descricion}</p>
            <p style={{color:T.text4,fontSize:"0.72rem",margin:"0.3rem 0 0"}}>{p.cidade} · achegado por {p.perfis?.nome||p.perfis?.email||"?"}{p.web&&` · ${p.web}`}</p>
          </div>
          <div style={{display:"flex",gap:"0.4rem"}}>
            <button onClick={()=>decidir(p.id,true)} style={{...S.btn("#69f0ae","#000"),fontSize:"0.78rem"}}>✓ Verificar e publicar</button>
            <button onClick={()=>decidir(p.id,false)} style={{...S.btn(T.bg4,T.text3),fontSize:"0.78rem"}}>✕ Rexeitar e borrar</button>
          </div>
        </div>))}
      </div>
    </div>
  </div>);
}

export function AdminStats({T,S}){
  const stats=ls.get("impro_stats",{cats:{},total:0,mins:0});
  const cats=Object.entries(stats.cats||{}).sort((a,b)=>b[1]-a[1]);
  const maxVal=cats[0]?.[1]||1;
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.6rem",marginBottom:"1.25rem"}}>
      {[["✦",stats.total||0,"Estímulos xerados"],["⏱",stats.mins||0,"Minutos de ensaio"],["📋",ls.get("impro_sesiones",[]).length,"Sesións gardadas"]].map(([emoji,val,label])=>(
        <div key={label} style={{...S.panel,textAlign:"center",padding:"0.85rem 0.5rem"}}>
          <div style={{fontSize:"1.3rem"}}>{emoji}</div>
          <div style={{fontSize:"1.6rem",fontWeight:900,color:T.accent}}>{val}</div>
          <div style={{color:T.text3,fontSize:"0.7rem"}}>{label}</div>
        </div>
      ))}
    </div>
    {cats.length>0&&<div style={S.panel}>
      <p style={S.ptitle(T.accent)}>Categorías máis usadas</p>
      <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
        {cats.map(([cat,count])=>(
          <div key={cat} style={{display:"flex",gap:"0.6rem",alignItems:"center"}}>
            <span style={{color:T.text3,fontSize:"0.78rem",width:90,flexShrink:0}}>{CAT_ICONS[cat]||"◆"} {cat}</span>
            <div style={{flex:1,height:8,background:T.bg3,borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(count/maxVal)*100}%`,background:T.accent,borderRadius:4,transition:"width 0.5s"}}/>
            </div>
            <span style={{color:T.text,fontSize:"0.82rem",fontWeight:700,width:28,textAlign:"right"}}>{count}</span>
          </div>
        ))}
      </div>
    </div>}
    {cats.length===0&&<div style={{...S.panel,textAlign:"center",padding:"2rem"}}>
      <p style={{fontSize:"2rem",margin:"0 0 0.5rem"}}>📊</p>
      <p style={{color:T.text4}}>Sen datos aínda. Usa o xerador de estímulos para acumular estatísticas.</p>
    </div>}
  </div>);
}

export function AdminConfig({T,S}){
  const [adminPin,setAdminPin]=useState("1234");
  const [msg,setMsg]=useState("");
  const savePin=()=>{ls.set("impro_admin_pin",adminPin);setMsg("✓ PIN actualizado (reinicia sesión)");setTimeout(()=>setMsg(""),3000);};
  const clearAll=()=>{if(!confirm("¿Borrar TODOS os datos locais? Esta acción non se pode desfacer."))return;localStorage.clear();sessionStorage.clear();window.location.reload();};
  return(<div style={{display:"flex",flexDirection:"column",gap:"0.85rem"}}>
    <div style={S.panel}>
      <p style={S.ptitle("#ffd740")}>Cambiar PIN de Admin</p>
      <div style={{display:"flex",gap:"0.5rem"}}>
        <input type="password" value={adminPin} onChange={e=>setAdminPin(e.target.value)} style={{...S.input,flex:1,letterSpacing:"0.2em"}} placeholder="Novo PIN..."/>
        <button onClick={savePin} style={S.btn(T.accent)}>Gardar</button>
      </div>
      {msg&&<p style={{color:"#69f0ae",fontSize:"0.82rem",marginTop:"0.5rem"}}>{msg}</p>}
    </div>
    <div style={{...S.panel,border:"1.5px solid #ff6e4033"}}>
      <p style={S.ptitle("#ff6e40")}>Zona de perigo</p>
      <p style={{color:T.text3,fontSize:"0.83rem",marginBottom:"0.85rem"}}>Borra todos os datos gardados localmente (favoritos, historial, configuracións). Os datos en Supabase non se borran.</p>
      <button onClick={clearAll} style={{...S.btn("#ff6e40"),width:"100%"}}>🗑 Borrar datos locais</button>
    </div>
    <div style={S.panel}>
      <p style={S.ptitle(T.text3)}>Información</p>
      <div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>
        {[["Versión","v8"],["Repo","anchon1o/impro"],["Deploy","improapp.vercel.app"],["Backend","Supabase"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:"0.82rem"}}>
            <span style={{color:T.text3}}>{k}</span>
            <span style={{color:T.text,fontFamily:"monospace"}}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>);
}

export function AdminUsuarios({T,S}){
  const [usuarios,setUsuarios]=useState([]);
  const [propostas,setPropostas]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filtro,setFiltro]=useState("todos");

  const cargar=async()=>{
    setLoading(true);
    const [u,p]=await Promise.all([listarUsuarios(),listarPropostasCompartir()]);
    setUsuarios(u);setPropostas(p);setLoading(false);
  };
  useEffect(()=>{cargar();},[]);

  const toggleAprobado=async(u)=>{
    await aprobarUsuario(u.id,!u.aprobado);
    setUsuarios(prev=>prev.map(x=>x.id===u.id?{...x,aprobado:!x.aprobado}:x));
  };
  const toggleRol=async(u)=>{
    const novo=u.rol==="admin"?"user":"admin";
    await cambiarRol(u.id,novo);
    setUsuarios(prev=>prev.map(x=>x.id===u.id?{...x,rol:novo}:x));
  };
  const decidirCompartir=async(d,aprobar)=>{
    await aprobarCompartir(d.id,aprobar);
    setPropostas(prev=>prev.filter(x=>x.id!==d.id));
  };

  const lista=usuarios.filter(u=>filtro==="todos"||(filtro==="pendentes"&&!u.aprobado)||(filtro==="admins"&&u.rol==="admin"));
  const pendentes=usuarios.filter(u=>!u.aprobado).length;

  if(loading)return<p style={{color:T.text3}}>Cargando...</p>;

  return(<div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
    {pendentes>0&&<div style={{...S.panel,border:"1.5px solid #ffd74044",background:"#ffd74008"}}>
      <p style={{color:"#ffd740",fontWeight:700,margin:0,fontSize:"0.88rem"}}>⏳ {pendentes} usuario{pendentes>1?"s":""} pendente{pendentes>1?"s":""} de aprobación</p>
    </div>}

    {propostas.length>0&&<div style={S.panel}>
      <p style={S.ptitle("#69f0ae")}>Dinámicas propostas para compartir ({propostas.length})</p>
      <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
        {propostas.map(d=>(<div key={d.id} style={{background:T.bg3,borderRadius:10,padding:"0.7rem 0.9rem"}}>
          <div style={{marginBottom:"0.5rem"}}>
            <span style={{color:T.text,fontWeight:700,fontSize:"0.88rem"}}>{d.nombre}</span>
            <span style={{...S.tag(TIPO_COLOR[d.tipo]||T.accent),marginLeft:"0.4rem"}}>{d.tipo}</span>
            <p style={{color:T.text3,fontSize:"0.78rem",margin:"0.3rem 0 0"}}>Por {d.perfis?.nome||d.perfis?.email||"?"}</p>
          </div>
          <div style={{display:"flex",gap:"0.4rem"}}>
            <button onClick={()=>decidirCompartir(d,true)} style={{...S.btn("#69f0ae","#000"),fontSize:"0.78rem"}}>✓ Compartir con todos</button>
            <button onClick={()=>decidirCompartir(d,false)} style={{...S.btn(T.bg4,T.text3),fontSize:"0.78rem"}}>✕ Rexeitar</button>
          </div>
        </div>))}
      </div>
    </div>}

    <div style={S.panel}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.85rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <p style={{...S.ptitle(T.accent),margin:0}}>Usuarios ({usuarios.length})</p>
        <button onClick={cargar} style={{...S.btn(T.bg3,T.text3),fontSize:"0.75rem"}}>↻</button>
      </div>
      <div style={{display:"flex",gap:"0.3rem",marginBottom:"0.85rem",flexWrap:"wrap"}}>
        {[["todos","Todos"],["pendentes","Pendentes"],["admins","Admins"]].map(([id,label])=>
          <button key={id} onClick={()=>setFiltro(id)} style={{background:filtro===id?T.accent:T.bg3,color:filtro===id?"#fff":T.text3,border:"none",borderRadius:20,padding:"0.25rem 0.7rem",fontSize:"0.74rem",cursor:"pointer",fontFamily:"inherit",fontWeight:filtro===id?700:400}}>{label}</button>
        )}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"0.45rem"}}>
        {lista.map(u=>(<div key={u.id} style={{background:T.bg3,borderRadius:10,padding:"0.7rem 0.9rem",display:"flex",gap:"0.6rem",alignItems:"center",flexWrap:"wrap",borderLeft:`3px solid ${u.aprobado?"#69f0ae":"#ffd740"}`}}>
          <div style={{flex:1,minWidth:150}}>
            <div style={{display:"flex",gap:"0.4rem",alignItems:"center",flexWrap:"wrap"}}>
              <span style={{color:T.text,fontWeight:700,fontSize:"0.88rem"}}>{u.nome||u.email.split("@")[0]}</span>
              {u.rol==="admin"&&<span style={S.tag("#e040fb")}>admin</span>}
              {!u.aprobado&&<span style={S.tag("#ffd740")}>pendente</span>}
            </div>
            <p style={{color:T.text4,fontSize:"0.75rem",margin:"0.15rem 0 0"}}>{u.email}</p>
          </div>
          <div style={{display:"flex",gap:"0.35rem"}}>
            <button onClick={()=>toggleAprobado(u)} style={{...S.btn(u.aprobado?T.bg4:"#69f0ae",u.aprobado?T.text3:"#000"),fontSize:"0.75rem",padding:"0.3rem 0.6rem"}}>{u.aprobado?"Desactivar":"✓ Aprobar"}</button>
            <button onClick={()=>toggleRol(u)} style={{...S.btn(T.bg4,u.rol==="admin"?"#e040fb":T.text3),fontSize:"0.75rem",padding:"0.3rem 0.6rem"}}>{u.rol==="admin"?"↓ user":"↑ admin"}</button>
          </div>
        </div>))}
        {lista.length===0&&<p style={{color:T.text4,fontSize:"0.83rem"}}>Sen usuarios neste filtro.</p>}
      </div>
    </div>
  </div>);
}
