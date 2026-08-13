import { useState, useEffect, useRef } from 'react';
import { useTheme, mkS } from '../core.jsx';
import { LIGAZONS, camposDeCategoria, validarFicha } from '../universoModelo.js';
import { buscarCoordenadas } from '../universo.js';

// Formulario ÚNICO de Universo. Úsase na pestana pública e no panel de
// administración; a prop `admin` é a única diferenza.
//
// ⚠️ CAMPOS DE LISTA. Antes gardábase directamente o array e o valor do
// campo recalculábase con array.join(", ") en cada pulsación. Iso facía
// imposible escribir: ao teclear unha coma, listaDesdeTexto descartábaa
// (por filtrar baleiros) e o campo volvía sen ela. Os espazos, igual.
// Agora consérvase o texto tal cal se escribe e só se converte a lista ao
// saír do campo ou ao enviar.

const aLista = t => String(t || "").split(/[\n,]/).map(s => s.trim()).filter(Boolean);
const aTexto = v => Array.isArray(v) ? v.join(", ") : (v || "");

export function UniversoForm({cats, logueado, onEnviar, onCancelar, inicial=null, admin=false}){
  const {T}=useTheme(); const S=mkS(T);
  const CATS = Array.isArray(cats) ? cats : (Array.isArray(cats?.cats) ? cats.cats : []);

  const [tipo,setTipo]=useState(inicial?.tipo||CATS[0]?.id||"");
  const [f,setF]=useState({
    nome:inicial?.nome||"", desc:inicial?.desc||"",
    pais:inicial?.pais||"", cidade:inicial?.cidade||"",
    logo:inicial?.logo||"🎭", logoUrl:inicial?.logoUrl||"",
    enderezo:inicial?.enderezo||"",
  });
  const [coords,setCoords]=useState({lat:inicial?.lat??null, lon:inicial?.lon??null});
  const [buscando,setBuscando]=useState(false);
  const [resultados,setResultados]=useState(null);
  const [erroGeo,setErroGeo]=useState("");
  const [lig,setLig]=useState(inicial?.ligazons||{});
  const [dat,setDat]=useState(inicial?.datos||{});
  const [estado,setEstado]=useState(inicial?.estado||(admin?"publicada":"pendente"));
  // Texto en bruto dos campos de lista, mentres se escriben
  const [txt,setTxt]=useState(()=>{
    const t={tags:aTexto(inicial?.tags)};
    for(const [k,v] of Object.entries(inicial?.datos||{})) if(Array.isArray(v)) t[k]=aTexto(v);
    return t;
  });
  const [autor,setAutor]=useState({nome:"",email:""});
  const [erros,setErros]=useState([]);
  const [enviando,setEnviando]=useState(false);
  const [aviso,setAviso]=useState("");
  const [trampa,setTrampa]=useState("");
  const abertoEn=useRef(Date.now());
  const tipoIni=useRef(inicial?.tipo||null);

  const cat=CATS.find(c=>c.id===tipo)||CATS[0]||null;
  const {opcionais,plantilla}=camposDeCategoria(cat);

  useEffect(()=>{
    if(tipoIni.current===tipo)return;
    tipoIni.current=null;
    setDat({}); setTxt(t=>({tags:t.tags||""})); setErros([]);
  },[tipo]);

  // Sincroniza o texto en bruto co array real
  const fixarLista=(id)=>{
    const v=aLista(txt[id]);
    if(id==="tags")return;
    setDat(d=>({...d,[id]:v}));
    setTxt(t=>({...t,[id]:aTexto(v)}));
  };

  const construir=()=>{
    const datos={...dat};
    for(const c of opcionais) if(c.tipo==="lista") datos[c.id]=aLista(txt[c.id]);
    return {
      tipo, nome:f.nome.trim(), desc:f.desc.trim(),
      pais:f.pais.trim()||"🌍", cidade:f.cidade.trim(),
      logo:f.logo||cat?.emoji||"🎭", logoUrl:f.logoUrl.trim(),
      tags:aLista(txt.tags),
      ligazons:Object.fromEntries(Object.entries(lig).filter(([,v])=>String(v||"").trim())),
      datos:Object.fromEntries(Object.entries(datos).filter(([,v])=>
        !(v===""||v===null||v===undefined||(Array.isArray(v)&&!v.length)))),
      propostaNome:autor.nome.trim(), propostaEmail:autor.email.trim(),
      enderezo:f.enderezo.trim(),
      lat:coords.lat, lon:coords.lon,
      ...(admin?{estado}:{}), ...(inicial?.id?{id:inicial.id}:{}),
    };
  };

  const buscarSitio=async()=>{
    const q=[f.enderezo,f.cidade].filter(Boolean).join(", ");
    setBuscando(true); setErroGeo(""); setResultados(null);
    const r=await buscarCoordenadas(q);
    setBuscando(false);
    if(r.erro)setErroGeo(r.erro);
    else if(r.resultados.length===1){setCoords({lat:r.resultados[0].lat,lon:r.resultados[0].lon});}
    else setResultados(r.resultados);
  };

  const enviar=async()=>{
    setAviso("");
    if(!admin){
      if(trampa){setAviso("Non se puido enviar.");return;}
      if(Date.now()-abertoEn.current<3000){setAviso("Vai un chisco rápido. Téntao nun segundo.");return;}
    }
    const ficha=construir();
    const e=validarFicha(ficha,cat);
    setErros(e);
    if(e.length)return;
    setEnviando(true);
    await onEnviar(ficha);
    setEnviando(false);
  };

  const err=id=>erros.find(x=>x.campo===id)?.msg;
  const inp=(id,extra={})=>({...S.input, marginBottom:0, borderColor:err(id)?T.danger:undefined, ...extra});
  const Err=({id})=>err(id)?<p style={{color:T.danger,fontSize:"0.7rem",margin:"0.15rem 0 0"}}>{err(id)}</p>:null;
  const Eti=({children})=><p style={{color:T.text4,fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",margin:"0.9rem 0 0.35rem"}}>{children}</p>;
  const fila=(n,min=110)=>({display:"grid",gridTemplateColumns:`repeat(auto-fit,minmax(min(${min}px,100%),1fr))`,gap:"0.4rem"});

  const editor=c=>{
    const set=v=>setDat(d=>({...d,[c.id]:v}));
    if(c.tipo==="lista")return <input value={txt[c.id]??aTexto(dat[c.id])}
      onChange={e=>setTxt(t=>({...t,[c.id]:e.target.value}))}
      onBlur={()=>fixarLista(c.id)}
      placeholder="Un, outro, outro máis" style={inp(c.id)}/>;
    if(c.tipo==="texto_longo")return <textarea value={dat[c.id]??""} onChange={e=>set(e.target.value)} style={inp(c.id,{minHeight:52,resize:"vertical"})}/>;
    if(c.tipo==="numero")return <input type="number" value={dat[c.id]??""} onChange={e=>set(e.target.value===""?"":Number(e.target.value))} style={inp(c.id)}/>;
    if(c.tipo==="data")return <input type="date" value={dat[c.id]??""} onChange={e=>set(e.target.value)} style={inp(c.id)}/>;
    return <input value={dat[c.id]??""} onChange={e=>set(e.target.value)} style={inp(c.id)}/>;
  };

  return(<div style={{...S.panel,marginBottom:"1rem",borderStyle:"solid",borderWidth:1,borderColor:T.accent+"44"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"}}>
      <p style={{...S.ptitle(T.accent),margin:0}}>{admin?(inicial?`Editar «${inicial.nome}»`:"Nova entrada"):"Propoñer unha entrada"}</p>
      {admin&&<div style={{display:"flex",gap:"0.25rem",flexWrap:"wrap"}}>
        {[["publicada","Publicada"],["pendente","Pendente"],["borrador","Borrador"],["rexeitada","Rexeitada"]].map(([id,lab])=>(
          <button key={id} onClick={()=>setEstado(id)} style={{background:estado===id?T.accent+"22":T.bg3,
            borderStyle:"solid",borderWidth:1,borderColor:estado===id?T.accent:T.border,
            color:estado===id?T.accent:T.text4,borderRadius:20,padding:"0.2rem 0.55rem",
            fontSize:"0.7rem",cursor:"pointer",fontFamily:"inherit"}}>{lab}</button>))}
      </div>}
    </div>

    {CATS.length===0&&<p style={{color:T.warn,fontSize:"0.8rem",margin:"0.6rem 0 0"}}>
      Non hai categorías dispoñibles. Comproba que se executou <code>supabase_universo_grants.sql</code>.
    </p>}

    {/* Identidade: emoji, nome e categoría nunha soa liña */}
    <Eti>Identidade</Eti>
    <div style={{display:"grid",gridTemplateColumns:"56px 1fr",gap:"0.4rem",alignItems:"start"}}>
      <input value={f.logo} onChange={e=>setF(x=>({...x,logo:e.target.value}))} maxLength={4}
        title="Emoji" style={inp("logo",{textAlign:"center",fontSize:"1.15rem"})}/>
      <div>
        <input value={f.nome} onChange={e=>setF(x=>({...x,nome:e.target.value}))} placeholder="Nome *" style={inp("nome")}/>
        <Err id="nome"/>
      </div>
    </div>

    <div style={{...fila(2),marginTop:"0.4rem"}}>
      <select value={tipo} onChange={e=>setTipo(e.target.value)} style={inp("tipo")}>
        {CATS.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>)}
      </select>
      <div style={{display:"grid",gridTemplateColumns:"64px 1fr",gap:"0.4rem"}}>
        <input value={f.pais} onChange={e=>setF(x=>({...x,pais:e.target.value}))} placeholder="🇪🇸" title="País" style={inp("pais",{textAlign:"center"})}/>
        <input value={f.cidade} onChange={e=>setF(x=>({...x,cidade:e.target.value}))} placeholder="Cidade" style={inp("cidade")}/>
      </div>
    </div>

    <textarea value={f.desc} onChange={e=>setF(x=>({...x,desc:e.target.value}))} placeholder="Descrición *"
      style={inp("descricion",{minHeight:56,resize:"vertical",marginTop:"0.4rem"})}/>
    <Err id="descricion"/>

    <input value={txt.tags??""} onChange={e=>setTxt(t=>({...t,tags:e.target.value}))}
      placeholder="Etiquetas: impro, galicia, formación" style={inp("tags",{marginTop:"0.4rem"})}/>

    {/* Ligazóns en dúas columnas */}
    <Eti>Ligazóns</Eti>
    <div style={fila(2,150)}>
      {LIGAZONS.map(L=>(<div key={L.id}>
        <input value={lig[L.id]||""} onChange={e=>setLig(x=>({...x,[L.id]:e.target.value}))}
          placeholder={`${L.emoji} ${L.placeholder}`} style={inp(`ligazons.${L.id}`)}/>
        <Err id={`ligazons.${L.id}`}/>
      </div>))}
    </div>
    <input value={f.logoUrl} onChange={e=>setF(x=>({...x,logoUrl:e.target.value}))}
      placeholder="URL do logo (opcional). Se non hai, úsase o emoji" style={inp("logo_url",{marginTop:"0.4rem"})}/>
    <Err id="logo_url"/>

    {/* Campos da plantilla, en dúas columnas */}
    {/* Ubicación: só ten sentido nas categorías de tipo lugar (espazos,
        garitos). Sen coordenadas a ficha non aparece no mapa. */}
    {cat?.plantilla==="lugar"&&<>
      <Eti>Ubicación no mapa</Eti>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"0.4rem"}}>
        <input value={f.enderezo} onChange={e=>setF(x=>({...x,enderezo:e.target.value}))}
          onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();buscarSitio();}}}
          placeholder="Rúa, número, cidade" style={inp("enderezo")}/>
        <button onClick={buscarSitio} disabled={buscando}
          style={{...S.btn(T.bg3,T.text2),whiteSpace:"nowrap",opacity:buscando?0.6:1}}>
          {buscando?"Buscando…":"Buscar"}</button>
      </div>

      {erroGeo&&<p style={{color:T.warn,fontSize:"0.74rem",margin:"0.3rem 0 0"}}>{erroGeo}</p>}

      {resultados&&resultados.length>0&&<div style={{marginTop:"0.4rem",display:"flex",flexDirection:"column",gap:"0.2rem"}}>
        {resultados.map((r,i)=>(
          <button key={i} onClick={()=>{setCoords({lat:r.lat,lon:r.lon});setResultados(null);setErroGeo("");}}
            style={{background:T.bg3,borderStyle:"solid",borderWidth:1,borderColor:T.border,borderRadius:8,
              padding:"0.45rem 0.6rem",cursor:"pointer",fontFamily:"inherit",fontSize:"0.76rem",
              color:T.text2,textAlign:"left",lineHeight:1.4}}>{r.nome}</button>))}
      </div>}

      {coords.lat!=null
        ?<p style={{color:T.ok,fontSize:"0.76rem",margin:"0.4rem 0 0",display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"}}>
           <span>📍 Situado en {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}</span>
           <button onClick={()=>setCoords({lat:null,lon:null})} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.74rem",textDecoration:"underline",fontFamily:"inherit"}}>quitar</button>
         </p>
        :<p style={{color:T.text4,fontSize:"0.74rem",margin:"0.4rem 0 0"}}>Sen ubicación: non aparecerá no mapa.</p>}
    </>}

    {opcionais.length>0&&<>
      <Eti>{plantilla.label} · todos opcionais</Eti>
      <div style={fila(2,150)}>
        {opcionais.map(c=>(<div key={c.id}>
          <p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.15rem"}}>{c.label}</p>
          {editor(c)}
          <Err id={c.id}/>
        </div>))}
      </div>
      <p style={{color:T.text4,fontSize:"0.7rem",margin:"0.4rem 0 0"}}>
        O que deixes baleiro non aparecerá na ficha. Nas listas, separa con comas.
      </p>
    </>}

    {!logueado&&!admin&&<>
      <Eti>Quen propón (opcional)</Eti>
      <div style={fila(2,150)}>
        <input value={autor.nome} onChange={e=>setAutor(a=>({...a,nome:e.target.value}))} placeholder="O teu nome" style={inp("an")}/>
        <input value={autor.email} onChange={e=>setAutor(a=>({...a,email:e.target.value}))} placeholder="Correo" style={inp("ae")}/>
      </div>
    </>}

    {!admin&&<input value={trampa} onChange={e=>setTrampa(e.target.value)} tabIndex={-1} autoComplete="off"
      aria-hidden="true" style={{position:"absolute",left:"-9999px",width:1,height:1,opacity:0}}/>}

    {aviso&&<p style={{color:T.warn,fontSize:"0.78rem",margin:"0.7rem 0 0"}}>{aviso}</p>}
    {erros.length>0&&<p style={{color:T.danger,fontSize:"0.78rem",margin:"0.7rem 0 0"}}>Revisa {erros.length} {erros.length===1?"campo":"campos"}.</p>}

    <div style={{display:"flex",gap:"0.4rem",marginTop:"0.9rem",flexWrap:"wrap"}}>
      <button onClick={enviar} disabled={enviando} style={{...S.btn(T.accent),opacity:enviando?0.6:1}}>
        {enviando?"Gardando…":(admin?(inicial?"Gardar cambios":"Crear entrada"):"Enviar proposta")}</button>
      <button onClick={onCancelar} style={S.btn(T.bg3,T.text2)}>Cancelar</button>
    </div>
  </div>);
}
