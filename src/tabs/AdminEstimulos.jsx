// ═══════════════════════════════════════════════════════════════════
// ADMIN · Estímulos e Traducións
// ═══════════════════════════════════════════════════════════════════
// Van xuntas porque as traducións son dos propios estímulos: separalas
// obrigaría a duplicar a carga do corpus.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme, mkS, t, CAT_ICONS, FALLBACK_ESTIMULOS, useEstimulos } from '../core.jsx';
import { IDIOMAS, listarEstimulos, engadirEstimulo, editarEstimulo, borrarEstimulo,
         cambiarNivelEstimulo, exportarTraducion, importarTraducion,
         progresoTraducion } from '../estimulos.js';

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
  const moveNivel=async(it)=>{
    const novo=nivel==="simple"?"plus":"simple";
    const ok=await cambiarNivelEstimulo(it.id,novo);
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
      {langCol!=="es"&&<span style={{color:traducidos===items.length?T.ok:T.warn,fontSize:"0.75rem",marginLeft:"auto"}}>{traducidos}/{items.length} traducidos</span>}
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
          return(<div key={it.id} style={{...S.panel,padding:"0.55rem 0.8rem",display:"flex",gap:"0.6rem",alignItems:"center",border:`1.5px solid ${falta?T.warn+"33":T.border}`}}>
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
              {langCol==="es"&&<button onClick={()=>moveNivel(it)} title={nivel==="simple"?"Mover a Plus":"Mover a Simple"} style={{...S.btn(T.bg3,nivel==="simple"?"#e040fb":T.info),padding:"0.28rem 0.5rem",fontSize:"0.76rem"}}>{nivel==="simple"?"⭐→":"◆→"}</button>}
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
              <div style={{height:"100%",width:`${pct(l.id)}%`,background:pct(l.id)===100?T.ok:T.accent,borderRadius:4,transition:"width 0.5s"}}/>
            </div>
            <span style={{color:T.text,fontSize:"0.78rem",fontWeight:700,width:58,textAlign:"right"}}>{tot[l.id]}/{tot.total}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={S.panel}>
      <p style={S.ptitle(T.info)}>Exportar para traducir</p>
      <p style={{color:T.text3,fontSize:"0.82rem",lineHeight:1.6,marginBottom:"0.85rem"}}>
        Descarga un JSON coas entradas a traducir, pásallo a Claude e volve importalo aquí.
      </p>
      <div style={{display:"flex",gap:"0.3rem",marginBottom:"0.75rem",flexWrap:"wrap"}}>
        {IDIOMAS.filter(l=>l.id!=="es").map(l=>
          <button key={l.id} onClick={()=>setLang(l.id)} style={{background:lang===l.id?T.info:T.bg3,color:lang===l.id?"#000":T.text3,border:"none",borderRadius:16,padding:"0.25rem 0.7rem",fontSize:"0.76rem",fontWeight:lang===l.id?700:400,cursor:"pointer",fontFamily:"inherit"}}>{l.label}</button>)}
      </div>
      <label style={{display:"flex",gap:"0.45rem",alignItems:"center",marginBottom:"0.85rem",cursor:"pointer"}}>
        <input type="checkbox" checked={soloPendentes} onChange={e=>setSoloPendentes(e.target.checked)} style={{accentColor:T.accent}}/>
        <span style={{color:T.text2,fontSize:"0.82rem"}}>Só as entradas sen traducir</span>
      </label>
      <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
        <button onClick={exportar} disabled={traballando} style={{...S.btn(T.info,"#000"),opacity:traballando?0.5:1}}>⬇ Exportar JSON</button>
        <button onClick={()=>fileRef.current?.click()} disabled={traballando} style={{...S.btn(T.ok,"#000"),opacity:traballando?0.5:1}}>⬆ Importar traducido</button>
        <input ref={fileRef} type="file" accept=".json,application/json" onChange={importar} style={{display:"none"}}/>
      </div>
      {msg&&<div style={{marginTop:"0.75rem",background:msg.t==="ok"?T.ok+"15":T.danger+"15",border:`1px solid ${msg.t==="ok"?T.ok+"44":T.danger+"44"}`,borderRadius:9,padding:"0.6rem 0.85rem"}}>
        <p style={{color:msg.t==="ok"?T.ok:T.danger,fontSize:"0.82rem",margin:0,lineHeight:1.5}}>{msg.m}</p>
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
