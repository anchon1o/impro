import { useState, useEffect, useMemo, useRef } from 'react';
import { useTheme, mkS, UID } from '../core.jsx';
import { CAMPOS_COMUNS, LIGAZONS, camposDeCategoria, validarFicha } from '../universoModelo.js';
import { listarTodoUniverso, cargarCategorias, gardarLoteUniverso, borrarUniverso } from '../universo.js';

// M09 — Edición masiva tipo folla de cálculo.
//
// 1 fila = 1 ficha, 1 columna = 1 campo.
//
// Edítase unha categoría de cada vez. Así as columnas son estables: os
// campos comúns máis os da plantilla dese tipo. Mesturar categorías na
// mesma grella obrigaría a amosar a unión de todos os campos, coa maioría
// baleiros en cada fila.

const EST_TOK={nova:"ok",modificada:"warn",erro:"danger"};
const estCol=(T,e)=>e==="igual"?"transparent":(T[EST_TOK[e]]||"transparent");

// Valores da cela ↔ modelo. As listas escríbense separadas por comas, que
// é como saen ao copiar de Excel ou Google Sheets.
const aCela=v=>Array.isArray(v)?v.join(", "):(v===null||v===undefined?"":String(v));
const desdeCela=(txt,tipo)=>{
  const t=String(txt??"").trim();
  if(tipo==="lista")return t?t.split(",").map(s=>s.trim()).filter(Boolean):[];
  if(tipo==="numero")return t===""?"":Number(t);
  return t;
};

export function AdminTablaMasiva(){
  const {T}=useTheme();const S=mkS(T);
  const [cats,setCats]=useState([]);
  const [tipo,setTipo]=useState("");
  const [orixinais,setOrixinais]=useState({});   // id → snapshot para detectar cambios
  const [filas,setFilas]=useState([]);
  const [cargando,setCargando]=useState(true);
  const [msg,setMsg]=useState("");
  const [gardando,setGardando]=useState(false);
  const foco=useRef({fila:0,col:0});

  useEffect(()=>{
    Promise.all([cargarCategorias(),listarTodoUniverso()]).then(([r,todo])=>{
      const c=Array.isArray(r)?r:(r?.cats||[]); const erro=r?.erro;
      setCats(c||[]);
      if(erro)setMsg(`Non se puideron cargar as categorías: ${erro}`);
      const t=(c&&c[0]?.id)||"";
      setTipo(t);
      cargarFilas(todo,t);
      setCargando(false);
    });
  },[]);

  const [todoUniverso,setTodoUniverso]=useState([]);
  const cargarFilas=(todo,t)=>{
    setTodoUniverso(todo);
    const propias=todo.filter(x=>x.tipo===t).map(x=>({
      _k:x.id, id:x.id, tipo:x.tipo, nome:x.nome, desc:x.desc,
      pais:x.pais, cidade:x.cidade, logo:x.logo, logoUrl:x.logoUrl,
      tags:x.tags||[], ligazons:{...(x.ligazons||{})}, datos:{...(x.datos||{})},
      estado:x.estado,
    }));
    setFilas(propias);
    setOrixinais(Object.fromEntries(propias.map(f=>[f._k,JSON.stringify(f)])));
  };

  const cambiarTipo=t=>{setTipo(t);cargarFilas(todoUniverso,t);setMsg("");};

  const cat=cats.find(c=>c.id===tipo);
  const {opcionais}=camposDeCategoria(cat);

  // Columnas: comúns (agás `tipo`, que é a propia categoría) + ligazóns + plantilla
  const cols=useMemo(()=>[
    ...CAMPOS_COMUNS.filter(c=>c.id!=="tipo").map(c=>({...c,onde:"raiz"})),
    ...LIGAZONS.map(L=>({id:L.id,label:L.label,tipo:"url",onde:"ligazons"})),
    ...opcionais.map(c=>({...c,onde:"datos"})),
  ],[opcionais]);

  const ler=(f,c)=>c.onde==="raiz"?f[c.id==="descricion"?"desc":c.id==="logo_url"?"logoUrl":c.id]
                  :c.onde==="ligazons"?(f.ligazons||{})[c.id]
                  :(f.datos||{})[c.id];

  const escribir=(idx,c,txt)=>setFilas(fs=>fs.map((f,i)=>{
    if(i!==idx)return f;
    const v=desdeCela(txt,c.tipo);
    if(c.onde==="raiz"){
      const k=c.id==="descricion"?"desc":c.id==="logo_url"?"logoUrl":c.id;
      return {...f,[k]:v};
    }
    if(c.onde==="ligazons")return {...f,ligazons:{...f.ligazons,[c.id]:v}};
    return {...f,datos:{...f.datos,[c.id]:v}};
  }));

  const engadirFilas=(n=1)=>setFilas(fs=>[...fs,...Array.from({length:n},()=>({
    _k:UID(), tipo, nome:"", desc:"", pais:"🌍", cidade:"", logo:cat?.emoji||"🎭",
    logoUrl:"", tags:[], ligazons:{}, datos:{}, estado:"publicada",
  }))]);

  const duplicar=idx=>setFilas(fs=>{
    const c={...fs[idx],_k:UID(),id:undefined,nome:`${fs[idx].nome} (copia)`};
    return [...fs.slice(0,idx+1),c,...fs.slice(idx+1)];
  });

  const quitar=async idx=>{
    const f=filas[idx];
    if(f.id){
      if(!confirm(`Borrar «${f.nome}» da base de datos?`))return;
      await borrarUniverso(f.id);
    }
    setFilas(fs=>fs.filter((_,i)=>i!==idx));
  };

  // Pegar dende Excel ou Google Sheets: TSV con saltos de liña.
  // Énchese desde a cela enfocada cara abaixo e á dereita, creando filas
  // novas se fai falta.
  const pegar=(e,idxFila,idxCol)=>{
    const txt=e.clipboardData?.getData("text/plain")||"";
    if(!txt.includes("\t")&&!txt.includes("\n"))return; // unha soa cela: comportamento normal
    e.preventDefault();
    const grella=txt.replace(/\r/g,"").split("\n").filter(l=>l.length).map(l=>l.split("\t"));
    setFilas(fs=>{
      const out=[...fs];
      grella.forEach((linha,dy)=>{
        const i=idxFila+dy;
        if(!out[i])out[i]={_k:UID(),tipo,nome:"",desc:"",pais:"🌍",cidade:"",logo:cat?.emoji||"🎭",logoUrl:"",tags:[],ligazons:{},datos:{},estado:"publicada"};
        linha.forEach((cel,dx)=>{
          const c=cols[idxCol+dx];
          if(!c)return;
          const v=desdeCela(cel,c.tipo);
          if(c.onde==="raiz"){
            const k=c.id==="descricion"?"desc":c.id==="logo_url"?"logoUrl":c.id;
            out[i]={...out[i],[k]:v};
          } else if(c.onde==="ligazons") out[i]={...out[i],ligazons:{...out[i].ligazons,[c.id]:v}};
          else out[i]={...out[i],datos:{...out[i].datos,[c.id]:v}};
        });
      });
      return out;
    });
    setMsg(`Pegadas ${grella.length} filas.`);
  };

  // Estado por fila: nova / modificada / igual, e erros de validación
  const estadoFila=f=>{
    if(!f.id)return "nova";
    return orixinais[f._k]===JSON.stringify(f)?"igual":"modificada";
  };
  const errosFila=f=>validarFicha({...f,descricion:f.desc},cat);

  const conCambios=filas.filter(f=>estadoFila(f)!=="igual");
  const conErros=filas.filter(f=>errosFila(f).length>0);

  const gardar=async()=>{
    if(conErros.length){setMsg(`Hai ${conErros.length} filas con erros. Corríxeas antes de gardar.`);return;}
    if(!conCambios.length){setMsg("Non hai cambios que gardar.");return;}
    setGardando(true);
    const r=await gardarLoteUniverso(conCambios);
    setGardando(false);
    setMsg(r.erros.length
      ? `${r.gardadas} actualizadas, ${r.creadas} creadas, ${r.erros.length} con erro: ${r.erros.map(e=>e.nome).join(", ")}`
      : `✓ ${r.gardadas} actualizadas, ${r.creadas} creadas.`);
    const todo=await listarTodoUniverso();
    cargarFilas(todo,tipo);
  };

  if(cargando)return <p style={S.caption}>Cargando…</p>;
  if(!cats.length)return(<div>
    <p style={S.ptitle(T.accent)}>Edición masiva</p>
    <div style={{background:T.danger+"12",borderStyle:"solid",borderWidth:1,borderColor:T.danger+"44",borderRadius:8,padding:"0.8rem"}}>
      <p style={{color:T.danger,fontWeight:700,fontSize:"0.82rem",margin:"0 0 0.3rem"}}>Sen categorías dispoñibles</p>
      <p style={{color:T.text3,fontSize:"0.76rem",margin:0,lineHeight:1.5}}>
        {msg||"A táboa precisa polo menos unha categoría de Universo."} Se o problema é de permisos,
        executa <code>supabase_universo_grants.sql</code> no SQL Editor de Supabase.
      </p>
    </div>
  </div>);

  const celaBase={background:"transparent",border:"none",color:T.text2,fontSize:"0.76rem",
    fontFamily:"inherit",padding:"0.4rem 0.45rem",width:"100%",minWidth:0,outline:"none",boxSizing:"border-box"};

  return(<div>
    <div style={{display:"flex",gap:"0.5rem",alignItems:"center",flexWrap:"wrap",marginBottom:"0.8rem"}}>
      <p style={{...S.ptitle(T.accent),margin:0}}>Edición masiva</p>
      <select value={tipo} onChange={e=>cambiarTipo(e.target.value)} style={{...S.input,width:"auto",marginBottom:0}}>
        {cats.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>)}
      </select>
      <span style={{color:T.text4,fontSize:"0.74rem"}}>{filas.length} filas</span>
    </div>

    <p style={{...S.caption,marginBottom:"0.7rem"}}>
      Edítase unha categoría de cada vez para que as columnas sexan estables.
      Podes pegar directamente desde Excel ou Google Sheets: sitúate nunha cela e pega.
    </p>

    <div style={{display:"flex",gap:"0.35rem",flexWrap:"wrap",marginBottom:"0.7rem"}}>
      <button onClick={()=>engadirFilas(1)} style={{...S.btn(T.bg3,T.text2),fontSize:"0.76rem"}}>+ Fila</button>
      <button onClick={()=>engadirFilas(5)} style={{...S.btn(T.bg3,T.text2),fontSize:"0.76rem"}}>+ 5 filas</button>
      <button onClick={gardar} disabled={gardando||!conCambios.length} style={{...S.btn(T.ok,"#000"),fontSize:"0.76rem",opacity:(gardando||!conCambios.length)?0.45:1}}>
        {gardando?"Gardando…":`Gardar ${conCambios.length} cambio${conCambios.length===1?"":"s"}`}
      </button>
    </div>

    <div style={{display:"flex",gap:"0.8rem",flexWrap:"wrap",marginBottom:"0.6rem",fontSize:"0.72rem",color:T.text4}}>
      <span><span style={{display:"inline-block",width:9,height:9,borderRadius:2,background:T.ok,marginRight:4}}/>nova</span>
      <span><span style={{display:"inline-block",width:9,height:9,borderRadius:2,background:T.warn,marginRight:4}}/>modificada</span>
      <span><span style={{display:"inline-block",width:9,height:9,borderRadius:2,background:T.danger,marginRight:4}}/>con erros</span>
    </div>

    {msg&&<p style={{color:msg.startsWith("✓")||msg.startsWith("Pegadas")?T.ok:T.warn,fontSize:"0.8rem",marginBottom:"0.7rem"}}>{msg}</p>}

    <div style={{overflowX:"auto",border:`1px solid ${T.border}`,borderRadius:10,background:T.bg2}}>
      <table style={{borderCollapse:"collapse",fontSize:"0.76rem",minWidth:"100%"}}>
        <thead>
          <tr style={{background:T.bg3}}>
            <th style={{padding:"0.45rem 0.3rem",width:26}}/>
            {cols.map(c=><th key={c.id+c.onde} style={{padding:"0.45rem",textAlign:"left",color:T.text3,fontWeight:700,fontSize:"0.7rem",whiteSpace:"nowrap",borderBottom:`1px solid ${T.border}`,minWidth:c.tipo==="texto_longo"?200:120}}>
              {c.label}{c.obrigatorio&&<span style={{color:T.danger}}> *</span>}
              <span style={{color:T.text4,fontWeight:400,fontSize:"0.62rem",marginLeft:4}}>{c.onde==="ligazons"?"🔗":c.onde==="datos"?"◇":""}</span>
            </th>)}
            <th style={{padding:"0.45rem",width:70}}/>
          </tr>
        </thead>
        <tbody>
          {filas.map((f,i)=>{
            const errs=errosFila(f);
            const est=errs.length?"erro":estadoFila(f);
            return(<tr key={f._k} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{background:estCol(T,est),width:4,padding:0}} title={est}/>
              {cols.map((c,j)=>{
                const err=errs.find(e=>e.campo===(c.onde==="raiz"?(c.id):c.onde==="ligazons"?`ligazons.${c.id}`:c.id));
                return(<td key={c.id+c.onde} style={{padding:0,borderRight:`1px solid ${T.border}22`,background:err?T.danger+"15":"transparent"}}>
                  <input value={aCela(ler(f,c))}
                    onChange={e=>escribir(i,c,e.target.value)}
                    onFocus={()=>{foco.current={fila:i,col:j};}}
                    onPaste={e=>pegar(e,i,j)}
                    title={err?err.msg:undefined}
                    placeholder={c.tipo==="lista"?"a, b, c":c.tipo==="url"?"https://…":""}
                    style={{...celaBase,color:err?T.danger:T.text2}}/>
                </td>);
              })}
              <td style={{padding:"0 0.3rem",whiteSpace:"nowrap"}}>
                <button onClick={()=>duplicar(i)} title="Duplicar" style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.85rem",padding:"0.2rem"}}>⧉</button>
                <button onClick={()=>quitar(i)} title="Quitar" style={{background:"none",border:"none",color:T.danger,cursor:"pointer",fontSize:"0.85rem",padding:"0.2rem"}}>🗑</button>
              </td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>

    {conErros.length>0&&<div style={{marginTop:"0.7rem",background:T.danger+"12",border:`1px solid ${T.danger}33`,borderRadius:8,padding:"0.7rem"}}>
      <p style={{color:T.danger,fontSize:"0.78rem",fontWeight:700,margin:"0 0 0.3rem"}}>{conErros.length} filas con erros</p>
      {conErros.slice(0,6).map(f=><p key={f._k} style={{color:T.text3,fontSize:"0.74rem",margin:"0.1rem 0"}}>
        {f.nome||"(sen nome)"} — {errosFila(f).map(e=>e.msg).join("; ")}
      </p>)}
    </div>}
  </div>);
}
