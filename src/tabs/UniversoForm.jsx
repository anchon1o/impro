import { useState, useEffect, useRef } from 'react';
import { useTheme, mkS } from '../core.jsx';
import { LIGAZONS, camposDeCategoria, validarFicha } from '../universoModelo.js';

// M08 — Formulario de proposta.
//
// Adáptase á categoría escollida: os campos opcionais saen da plantilla e
// do que o admin deixara activo en Admin → Categorías.
//
// Funciona con conta e sen ela. A política RLS `universo_insert` acepta
// as tres ramas (admin / usuaria / visitante) e en todos os casos
// obriga a estado='pendente': ninguén se pode autopublicar.

const listaDesdeTexto=t=>String(t||"").split(/[\n,]/).map(s=>s.trim()).filter(Boolean);
const textoDesdeLista=v=>Array.isArray(v)?v.join(", "):(v||"");

export function UniversoForm({cats,logueado,onEnviar,onCancelar}){
  const {T}=useTheme();const S=mkS(T);
  const [tipo,setTipo]=useState(cats[0]?.id||"");
  const [f,setF]=useState({nome:"",desc:"",pais:"",cidade:"",logo:"🎭",logoUrl:"",tags:""});
  const [lig,setLig]=useState({});
  const [dat,setDat]=useState({});
  const [autor,setAutor]=useState({nome:"",email:""});
  const [erros,setErros]=useState([]);
  const [enviando,setEnviando]=useState(false);
  const [avisoSpam,setAvisoSpam]=useState("");
  // Honeypot: campo invisible para humanos. Un bot que enche todo delátase.
  const [trampa,setTrampa]=useState("");
  const abertoEn=useRef(Date.now());

  const cat=cats.find(c=>c.id===tipo)||cats[0];
  const {opcionais,plantilla}=camposDeCategoria(cat);
  useEffect(()=>{setDat({});setErros([]);},[tipo]);

  const construir=()=>({
    tipo, nome:f.nome.trim(), desc:f.desc.trim(),
    pais:f.pais.trim()||"🌍", cidade:f.cidade.trim(),
    logo:f.logo||cat?.emoji||"🎭", logoUrl:f.logoUrl.trim(),
    tags:listaDesdeTexto(f.tags),
    ligazons:Object.fromEntries(Object.entries(lig).filter(([,v])=>String(v||"").trim())),
    datos:Object.fromEntries(Object.entries(dat).filter(([,v])=>
      !(v===""||v===null||v===undefined||(Array.isArray(v)&&!v.length)))),
    propostaNome:autor.nome.trim(), propostaEmail:autor.email.trim(),
  });

  const enviar=async()=>{
    setAvisoSpam("");
    if(trampa){setAvisoSpam("Non se puido enviar.");return;}
    // Un humano non enche isto en menos de 3 segundos.
    if(Date.now()-abertoEn.current<3000){setAvisoSpam("Vai un chisco rápido. Téntao outra vez nun segundo.");return;}
    const ficha=construir();
    const e=validarFicha(ficha,cat);
    setErros(e);
    if(e.length)return;
    setEnviando(true);
    await onEnviar(ficha);
    setEnviando(false);
  };

  const erroDe=id=>erros.find(x=>x.campo===id)?.msg;
  const campoStyle=id=>({...S.input,marginBottom:erroDe(id)?"0.15rem":"0.5rem",borderColor:erroDe(id)?"#ff6e40":undefined});
  const Erro=({id})=>erroDe(id)?<p style={{color:"#ff6e40",fontSize:"0.72rem",margin:"0 0 0.5rem"}}>{erroDe(id)}</p>:null;

  // Editor por tipo de campo. Unha soa función: se engadimos un tipo novo
  // á plantilla, só hai que tocalo aquí.
  const editor=c=>{
    const v=dat[c.id]??"";
    const set=val=>setDat(d=>({...d,[c.id]:val}));
    if(c.tipo==="lista")return <input value={textoDesdeLista(v)} onChange={e=>set(listaDesdeTexto(e.target.value))} placeholder="Separa con comas" style={campoStyle(c.id)}/>;
    if(c.tipo==="texto_longo")return <textarea value={v} onChange={e=>set(e.target.value)} style={{...campoStyle(c.id),minHeight:64,resize:"vertical"}}/>;
    if(c.tipo==="numero")return <input type="number" value={v} onChange={e=>set(e.target.value===""?"":Number(e.target.value))} style={campoStyle(c.id)}/>;
    if(c.tipo==="data")return <input type="date" value={v} onChange={e=>set(e.target.value)} style={campoStyle(c.id)}/>;
    if(c.tipo==="url")return <input value={v} onChange={e=>set(e.target.value)} placeholder="https://…" style={campoStyle(c.id)}/>;
    return <input value={v} onChange={e=>set(e.target.value)} style={campoStyle(c.id)}/>;
  };

  const etiqueta=txt=><p style={{color:T.text4,fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",margin:"0 0 0.25rem"}}>{txt}</p>;

  return(<div style={{...S.panel,marginBottom:"1rem",border:`1.5px solid ${T.accent}44`}}>
    <p style={S.ptitle(T.accent)}>Propoñer unha entrada</p>
    <p style={{...S.caption,marginBottom:"0.9rem"}}>
      {logueado
        ?"Revisarémola antes de publicala. Poderás velaas túas propostas mentres estean pendentes."
        :"Podes propoñer sen conta. Revisarémola antes de publicala."}
    </p>

    {etiqueta("Categoría")}
    <select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...S.input,marginBottom:"0.3rem"}}>
      {cats.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>)}
    </select>
    <p style={{color:T.text4,fontSize:"0.74rem",margin:"0 0 0.9rem",lineHeight:1.4}}>{plantilla.axuda}</p>

    {etiqueta("Datos básicos")}
    <input value={f.nome} onChange={e=>setF(x=>({...x,nome:e.target.value}))} placeholder="Nome *" style={campoStyle("nome")}/>
    <Erro id="nome"/>
    <textarea value={f.desc} onChange={e=>setF(x=>({...x,desc:e.target.value}))} placeholder="Descrición *" style={{...campoStyle("descricion"),minHeight:72,resize:"vertical"}}/>
    <Erro id="descricion"/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(120px,100%),1fr))",gap:"0.4rem"}}>
      <input value={f.pais} onChange={e=>setF(x=>({...x,pais:e.target.value}))} placeholder="🇪🇸 País" style={campoStyle("pais")}/>
      <input value={f.cidade} onChange={e=>setF(x=>({...x,cidade:e.target.value}))} placeholder="Cidade" style={campoStyle("cidade")}/>
      <input value={f.logo} onChange={e=>setF(x=>({...x,logo:e.target.value}))} placeholder="Emoji" maxLength={4} style={{...campoStyle("logo"),textAlign:"center"}}/>
    </div>
    <input value={f.logoUrl} onChange={e=>setF(x=>({...x,logoUrl:e.target.value}))} placeholder="URL do logo (opcional) — se non hai, úsase o emoji" style={campoStyle("logo_url")}/>
    <Erro id="logo_url"/>
    <input value={f.tags} onChange={e=>setF(x=>({...x,tags:e.target.value}))} placeholder="Etiquetas, separadas por comas" style={campoStyle("tags")}/>

    {etiqueta("Ligazóns")}
    {LIGAZONS.map(L=>(<div key={L.id}>
      <input value={lig[L.id]||""} onChange={e=>setLig(x=>({...x,[L.id]:e.target.value}))} placeholder={`${L.emoji} ${L.label}`} style={campoStyle(`ligazons.${L.id}`)}/>
      <Erro id={`ligazons.${L.id}`}/>
    </div>))}

    {opcionais.length>0&&<>
      {etiqueta(`Campos de ${plantilla.label.toLowerCase()}`)}
      <p style={{...S.caption,marginBottom:"0.6rem"}}>Todos opcionais. O que deixes baleiro non aparecerá na ficha.</p>
      {opcionais.map(c=>(<div key={c.id}>
        <p style={{color:T.text3,fontSize:"0.76rem",margin:"0 0 0.15rem"}}>{c.label}</p>
        {editor(c)}
        <Erro id={c.id}/>
      </div>))}
    </>}

    {!logueado&&<>
      {etiqueta("Quen propón (opcional)")}
      <p style={{...S.caption,marginBottom:"0.6rem"}}>Só para poder consultarche dúbidas. Non se publica.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(160px,100%),1fr))",gap:"0.4rem"}}>
        <input value={autor.nome} onChange={e=>setAutor(a=>({...a,nome:e.target.value}))} placeholder="O teu nome" style={S.input}/>
        <input value={autor.email} onChange={e=>setAutor(a=>({...a,email:e.target.value}))} placeholder="Correo" style={S.input}/>
      </div>
    </>}

    {/* Honeypot. aria-hidden + tabIndex -1 para que non o vexa nin un lector de pantalla. */}
    <input value={trampa} onChange={e=>setTrampa(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true"
      style={{position:"absolute",left:"-9999px",width:1,height:1,opacity:0}}/>

    {avisoSpam&&<p style={{color:"#ffd740",fontSize:"0.8rem",margin:"0.8rem 0 0"}}>{avisoSpam}</p>}
    {erros.length>0&&<p style={{color:"#ff6e40",fontSize:"0.8rem",margin:"0.8rem 0 0"}}>Revisa {erros.length} {erros.length===1?"campo":"campos"}.</p>}

    <div style={{display:"flex",gap:"0.4rem",marginTop:"1rem",flexWrap:"wrap"}}>
      <button onClick={enviar} disabled={enviando} style={{...S.btn(T.accent),opacity:enviando?0.6:1}}>{enviando?"Enviando…":"Enviar proposta"}</button>
      <button onClick={onCancelar} style={S.btn(T.bg3,T.text2)}>Cancelar</button>
    </div>
  </div>);
}
