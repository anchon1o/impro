import { useState, useEffect } from 'react';
import { useTheme, useAuth, mkS } from '../core.jsx';
import { TIPOS_EVENTO, tipoEvento, listarEventos, gardarEvento, borrarEvento,
         formatarData, agruparPorMes, hoxeISO,
         semanasDoMes, eventosDoDia, MESES, DIAS_SEMANA } from '../eventos.js';
import { cargarUniverso } from '../universo.js';

// Axenda de eventos. Área propia no menú principal.
//
// Tres niveis de acceso:
//   · sen conta  → ver o calendario
//   · con conta  → suxerir eventos, que quedan pendentes de revisión
//   · admin      → publicar directo e moderar (en Admin → Axenda)
//
// Os eventos vincúlanse a entradas de Universo (quen organiza e onde), que
// é o que fai que a axenda non sexa unha lista solta.

export function TabAxenda({ entradas: entradasProp }) {
  const {T}=useTheme(); const S=mkS(T);
  const {logueado,esAdmin,user}=useAuth();
  const [eventos,setEventos]=useState([]);
  const [cargando,setCargando]=useState(true);
  const [erro,setErro]=useState('');
  const [filtro,setFiltro]=useState('todos');
  const [pasados,setPasados]=useState(false);
  const [edit,setEdit]=useState(null);
  const [msg,setMsg]=useState('');
  const [entradas,setEntradas]=useState(entradasProp||[]);
  const [vista,setVista]=useState('lista');            // lista | calendario
  const hoxe=new Date();
  const [mes,setMes]=useState({ano:hoxe.getFullYear(),mes:hoxe.getMonth()});
  const [diaSel,setDiaSel]=useState(null);

  // Se non veñen por prop, cárganse: a pestana é independente de Universo.
  useEffect(()=>{
    if(entradasProp&&entradasProp.length)return;
    cargarUniverso().then(u=>setEntradas(u||[]));
  },[entradasProp]);

  const cargar=()=>{
    setCargando(true);
    listarEventos({incluirPasados:pasados}).then(r=>{
      setEventos(Array.isArray(r)?r:(r?.eventos||[]));
      setErro(r?.erro||'');
      setCargando(false);
    });
  };
  useEffect(cargar,[pasados]);

  const ficha=id=>(entradas||[]).find(e=>e.id===id);
  const lista=eventos.filter(e=>filtro==='todos'||e.tipo===filtro);
  const meses=agruparPorMes(lista);
  const podeEditar=e=>esAdmin||(user&&e.userId===user.id);

  const BALEIRO={titulo:'',tipo:'obradoiro',desc:'',dataInicio:hoxeISO(),dataFin:'',
    hora:'',organizaId:'',lugarId:'',cidade:'',url:'',prezo:'',estado:'publicado'};

  const gardar=async()=>{
    if(!edit.titulo.trim()){setMsg('Fai falta un título.');return;}
    if(!edit.dataInicio){setMsg('Fai falta a data.');return;}
    const r=await gardarEvento(edit,{admin:esAdmin});
    if(r.ok){
      setEdit(null);
      setMsg(esAdmin?'':'Recibido. O evento aparecerá cando sexa revisado.');
      setTimeout(()=>setMsg(''),5000);
      cargar();
    }
    else setMsg(r.erro||'Non se puido gardar.');
  };

  const eliminar=async e=>{
    if(!confirm(`Borrar «${e.titulo}»?`))return;
    if(await borrarEvento(e.id))cargar();
  };

  const inp={...S.input,marginBottom:0};
  const fila=(min=130)=>({display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(min(${min}px,100%),1fr))`,gap:'0.4rem'});

  return(<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.7rem'}}>
      <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>
        {[{id:'todos',emoji:'📅',label:'Todo'},...TIPOS_EVENTO].map(t=>(
          <button key={t.id} onClick={()=>setFiltro(t.id)} style={{
            background:filtro===t.id?T.accent:T.bg3,color:filtro===t.id?'#000':T.text3,
            border:'none',borderRadius:20,padding:'0.28rem 0.7rem',fontSize:'0.74rem',
            fontWeight:filtro===t.id?700:400,cursor:'pointer',fontFamily:'inherit'}}>
            {t.emoji} {t.label}</button>))}
      </div>
      {logueado&&!edit&&<button onClick={()=>setEdit({...BALEIRO})} style={S.btn(T.accent)}>
        {esAdmin?'+ Novo evento':'+ Suxerir evento'}</button>}
    </div>

    <div style={{display:'flex',gap:2,background:T.bg3,borderRadius:10,padding:3,marginBottom:'0.7rem',width:'fit-content'}}>
      {[['lista','Lista'],['calendario','🗓 Calendario']].map(([id,lab])=>(
        <button key={id} onClick={()=>setVista(id)} style={{...S.btn(vista===id?T.bg2:'transparent',vista===id?T.text:T.text3),borderRadius:8,padding:'0.32rem 0.8rem',fontSize:'0.78rem'}}>{lab}</button>))}
    </div>

    <label style={{display:'flex',alignItems:'center',gap:'0.4rem',color:T.text4,fontSize:'0.76rem',marginBottom:'0.8rem',cursor:'pointer'}}>
      <input type="checkbox" checked={pasados} onChange={e=>setPasados(e.target.checked)}/>
      Amosar tamén os que xa pasaron
    </label>

    {erro&&<div style={{background:T.danger+'12',borderStyle:'solid',borderWidth:1,borderColor:T.danger+'44',borderRadius:8,padding:'0.8rem',marginBottom:'0.8rem'}}>
      <p style={{color:T.danger,fontWeight:700,fontSize:'0.82rem',margin:'0 0 0.25rem'}}>Non se puido cargar a axenda</p>
      <p style={{color:T.text3,fontSize:'0.76rem',margin:0,fontFamily:'monospace'}}>{erro}</p>
      <p style={{color:T.text3,fontSize:'0.76rem',margin:'0.5rem 0 0'}}>Se pon «does not exist» ou «permission denied», executa <code>supabase_eventos.sql</code>.</p>
    </div>}

    {/* Editor */}
    {edit&&<div style={{...S.panel,marginBottom:'1rem',borderStyle:'solid',borderWidth:1,borderColor:T.accent+'44'}}>
      <p style={S.ptitle(T.accent)}>{edit.id?'Editar evento':(esAdmin?'Novo evento':'Suxerir un evento')}</p>
      {!esAdmin&&<p style={{...S.caption,marginBottom:'0.7rem'}}>
        A túa suxestión revisarase antes de publicarse. Mentres tanto poderás vela e editala ti.
      </p>}

      <div style={{display:'grid',gridTemplateColumns:'1fr 130px',gap:'0.4rem',marginBottom:'0.4rem'}}>
        <input value={edit.titulo} onChange={e=>setEdit(x=>({...x,titulo:e.target.value}))} placeholder="Título *" style={inp}/>
        <select value={edit.tipo} onChange={e=>setEdit(x=>({...x,tipo:e.target.value}))} style={inp}>
          {TIPOS_EVENTO.map(t=><option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
        </select>
      </div>

      <div style={{...fila(120),marginBottom:'0.4rem'}}>
        <div><p style={{color:T.text4,fontSize:'0.68rem',margin:'0 0 0.15rem'}}>Comeza *</p>
          <input type="date" value={edit.dataInicio} onChange={e=>setEdit(x=>({...x,dataInicio:e.target.value}))} style={inp}/></div>
        <div><p style={{color:T.text4,fontSize:'0.68rem',margin:'0 0 0.15rem'}}>Remata</p>
          <input type="date" value={edit.dataFin||''} onChange={e=>setEdit(x=>({...x,dataFin:e.target.value}))} style={inp}/></div>
        <div><p style={{color:T.text4,fontSize:'0.68rem',margin:'0 0 0.15rem'}}>Hora</p>
          <input value={edit.hora} onChange={e=>setEdit(x=>({...x,hora:e.target.value}))} placeholder="20:30" style={inp}/></div>
      </div>

      <textarea value={edit.desc} onChange={e=>setEdit(x=>({...x,desc:e.target.value}))}
        placeholder="Descrición" style={{...inp,minHeight:52,resize:'vertical',marginBottom:'0.4rem'}}/>

      {/* Vínculos con Universo: é o que fai que a axenda non sexa unha lista solta */}
      <div style={{...fila(150),marginBottom:'0.4rem'}}>
        <div><p style={{color:T.text4,fontSize:'0.68rem',margin:'0 0 0.15rem'}}>Organiza</p>
          <select value={edit.organizaId||''} onChange={e=>setEdit(x=>({...x,organizaId:e.target.value}))} style={inp}>
            <option value="">— sen especificar —</option>
            {(entradas||[]).map(u=><option key={u.id} value={u.id}>{u.logo} {u.nome}</option>)}
          </select></div>
        <div><p style={{color:T.text4,fontSize:'0.68rem',margin:'0 0 0.15rem'}}>Onde</p>
          <select value={edit.lugarId||''} onChange={e=>setEdit(x=>({...x,lugarId:e.target.value}))} style={inp}>
            <option value="">— sen especificar —</option>
            {(entradas||[]).map(u=><option key={u.id} value={u.id}>{u.logo} {u.nome}</option>)}
          </select></div>
      </div>

      <div style={{...fila(130),marginBottom:'0.4rem'}}>
        <input value={edit.cidade} onChange={e=>setEdit(x=>({...x,cidade:e.target.value}))} placeholder="Cidade" style={inp}/>
        <input value={edit.prezo} onChange={e=>setEdit(x=>({...x,prezo:e.target.value}))} placeholder="Prezo: 25 €, de balde…" style={inp}/>
      </div>
      <input value={edit.url} onChange={e=>setEdit(x=>({...x,url:e.target.value}))} placeholder="Ligazón de inscrición ou info" style={{...inp,marginBottom:'0.4rem'}}/>

      {esAdmin&&<div style={{display:'flex',gap:'0.25rem',marginBottom:'0.6rem'}}>
        {[['publicado','Publicado'],['borrador','Borrador'],['cancelado','Cancelado']].map(([id,lab])=>(
          <button key={id} onClick={()=>setEdit(x=>({...x,estado:id}))} style={{
            background:edit.estado===id?T.accent+'22':T.bg3,borderStyle:'solid',borderWidth:1,
            borderColor:edit.estado===id?T.accent:T.border,color:edit.estado===id?T.accent:T.text4,
            borderRadius:20,padding:'0.2rem 0.55rem',fontSize:'0.7rem',cursor:'pointer',fontFamily:'inherit'}}>{lab}</button>))}
      </div>}

      {msg&&<p style={{color:T.danger,fontSize:'0.78rem',margin:'0 0 0.5rem'}}>{msg}</p>}
      <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
        <button onClick={gardar} style={S.btn(T.accent)}>{edit.id?'Gardar cambios':'Crear evento'}</button>
        <button onClick={()=>{setEdit(null);setMsg('');}} style={S.btn(T.bg3,T.text2)}>Cancelar</button>
      </div>
    </div>}

    {cargando&&<p style={S.caption}>Cargando…</p>}
    {!cargando&&!erro&&lista.length===0&&<div style={{...S.panel,textAlign:'center',padding:'2rem'}}>
      <p style={{fontSize:'1.8rem',margin:'0 0 0.4rem'}}>📅</p>
      <p style={{color:T.text4,fontSize:'0.86rem',margin:0}}>
        {pasados?'Sen eventos nesta vista.':'Non hai eventos próximos.'}
      </p>
      {!logueado&&<p style={{...S.caption,marginTop:'0.5rem'}}>Inicia sesión para suxerir eventos.</p>}
    </div>}

    {/* Vista de calendario: unha grella mensual. Os eventos de varios días
        aparecen en todos os días que ocupan. */}
    {vista==='calendario'&&<div style={{marginBottom:'1.2rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.6rem'}}>
        <button onClick={()=>setMes(m=>m.mes===0?{ano:m.ano-1,mes:11}:{ano:m.ano,mes:m.mes-1})}
          style={{...S.btn(T.bg3,T.text2),padding:'0.3rem 0.7rem'}}>‹</button>
        <p style={{color:T.text,fontWeight:800,fontSize:'0.95rem',margin:0}}>{MESES[mes.mes]} {mes.ano}</p>
        <button onClick={()=>setMes(m=>m.mes===11?{ano:m.ano+1,mes:0}:{ano:m.ano,mes:m.mes+1})}
          style={{...S.btn(T.bg3,T.text2),padding:'0.3rem 0.7rem'}}>›</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:2}}>
        {DIAS_SEMANA.map((d,i)=><div key={i} style={{textAlign:'center',color:T.text4,fontSize:'0.68rem',fontWeight:700,padding:'0.3rem 0'}}>{d}</div>)}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
        {semanasDoMes(mes.ano,mes.mes).flat().map(d=>{
          const evs=eventosDoDia(lista,d.iso);
          const esHoxe=d.iso===hoxeISO();
          const sel=diaSel===d.iso;
          return(
            <button key={d.iso} onClick={()=>setDiaSel(sel?null:d.iso)} style={{
              background:sel?T.accent+'22':(esHoxe?T.bg4:T.bg2),
              borderStyle:'solid',borderWidth:1,
              borderColor:sel?T.accent:(esHoxe?T.accent+'55':T.border),
              borderRadius:8,padding:'0.3rem 0.2rem',minHeight:52,cursor:'pointer',
              fontFamily:'inherit',display:'flex',flexDirection:'column',
              alignItems:'center',gap:2,opacity:d.doMes?1:0.35}}>
              <span style={{color:esHoxe?T.accent:T.text2,fontSize:'0.76rem',fontWeight:esHoxe?800:400}}>{d.dia}</span>
              <span style={{display:'flex',gap:2,flexWrap:'wrap',justifyContent:'center'}}>
                {evs.slice(0,3).map((e,i)=>(
                  <span key={i} style={{width:5,height:5,borderRadius:3,background:T[tipoEvento(e.tipo).cor]||T.accent}}/>))}
                {evs.length>3&&<span style={{color:T.text4,fontSize:'0.6rem',lineHeight:1}}>+{evs.length-3}</span>}
              </span>
            </button>);
        })}
      </div>

      {/* Detalle do día escollido */}
      {diaSel&&<div style={{marginTop:'0.8rem'}}>
        <p style={{color:T.text4,fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.06em',
          textTransform:'uppercase',margin:'0 0 0.4rem'}}>{formatarData(diaSel)}</p>
        {eventosDoDia(lista,diaSel).length===0
          ?<p style={{...S.caption,margin:0}}>Sen eventos este día.</p>
          :<div style={{display:'flex',flexDirection:'column',gap:'0.35rem'}}>
            {eventosDoDia(lista,diaSel).map(e=>{
              const tp=tipoEvento(e.tipo); const org=ficha(e.organizaId), lug=ficha(e.lugarId);
              return(<div key={e.id} style={{...S.panel,padding:'0.6rem 0.7rem',
                borderStyle:'solid',borderWidth:'1px 1px 1px 3px',borderColor:T.border,
                borderLeftColor:T[tp.cor]||T.accent}}>
                <div style={{display:'flex',gap:'0.4rem',alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{...S.tag(T[tp.cor]||T.accent),fontSize:'0.64rem'}}>{tp.emoji} {tp.label}</span>
                  {e.hora&&<span style={{color:T.text4,fontSize:'0.72rem',fontFamily:'monospace'}}>{e.hora}</span>}
                </div>
                <p style={{color:T.text,fontWeight:700,fontSize:'0.86rem',margin:'0.2rem 0 0'}}>{e.titulo}</p>
                <p style={{color:T.text4,fontSize:'0.72rem',margin:'0.15rem 0 0'}}>
                  {org&&<span>{org.logo} {org.nome}</span>}{org&&(lug||e.cidade)&&' · '}
                  {lug?<span>📍 {lug.nome}</span>:(e.cidade&&<span>📍 {e.cidade}</span>)}
                </p>
              </div>);
            })}
          </div>}
      </div>}
    </div>}

    {/* Agrupados por mes */}
    {vista==='lista'&&meses.map(m=>(<div key={m.chave} style={{marginBottom:'1.2rem'}}>
      <p style={{color:T.text4,fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.06em',
        textTransform:'uppercase',margin:'0 0 0.5rem',paddingBottom:'0.3rem',
        borderBottomStyle:'solid',borderBottomWidth:1,borderBottomColor:T.border}}>{m.label}</p>

      <div style={{display:'flex',flexDirection:'column',gap:'0.45rem'}}>
        {m.eventos.map(e=>{
          const tp=tipoEvento(e.tipo);
          const org=ficha(e.organizaId), lug=ficha(e.lugarId);
          return(<div key={e.id} style={{...S.panel,padding:'0.8rem',
            borderStyle:'solid',borderWidth:'1px 1px 1px 3px',borderColor:T.border,
            borderLeftColor:T[tp.cor]||T.accent,opacity:e.estado==='cancelado'?0.55:1}}>

            <div style={{display:'flex',gap:'0.6rem',alignItems:'flex-start',flexWrap:'wrap'}}>
              <div style={{minWidth:70}}>
                <p style={{color:T[tp.cor]||T.accent,fontWeight:800,fontSize:'0.82rem',margin:0,fontFamily:'monospace'}}>
                  {formatarData(e.dataInicio,e.dataFin)}</p>
                {e.hora&&<p style={{color:T.text4,fontSize:'0.74rem',margin:'0.1rem 0 0',fontFamily:'monospace'}}>{e.hora}</p>}
              </div>

              <div style={{flex:1,minWidth:160}}>
                <div style={{display:'flex',gap:'0.4rem',alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{...S.tag(T[tp.cor]||T.accent),fontSize:'0.66rem'}}>{tp.emoji} {tp.label}</span>
                  {e.estado==='cancelado'&&<span style={{...S.tag(T.danger),fontSize:'0.66rem'}}>cancelado</span>}
                  {e.estado==='borrador'&&<span style={{...S.tag(T.muted),fontSize:'0.66rem'}}>borrador</span>}
                  {e.estado==='pendente'&&<span style={{...S.tag(T.warn),fontSize:'0.66rem'}}>agarda revisión</span>}
                  {e.estado==='rexeitado'&&<span style={{...S.tag(T.danger),fontSize:'0.66rem'}}>non aceptado</span>}
                </div>
                <p style={{color:T.text,fontWeight:700,fontSize:'0.92rem',margin:'0.25rem 0 0'}}>{e.titulo}</p>
                {e.desc&&<p style={{color:T.text3,fontSize:'0.8rem',margin:'0.2rem 0 0',lineHeight:1.5}}>{e.desc}</p>}

                <p style={{color:T.text4,fontSize:'0.74rem',margin:'0.35rem 0 0',lineHeight:1.6}}>
                  {org&&<span>{org.logo} {org.nome}</span>}
                  {org&&(lug||e.cidade)&&' · '}
                  {lug?<span>📍 {lug.logo} {lug.nome}</span>:(e.cidade&&<span>📍 {e.cidade}</span>)}
                  {e.prezo&&<span> · {e.prezo}</span>}
                </p>

                {e.url&&<a href={e.url.startsWith('http')?e.url:`https://${e.url}`} target="_blank" rel="noopener noreferrer"
                  style={{color:T.info,fontSize:'0.78rem',display:'inline-block',marginTop:'0.3rem'}}>Máis información ↗</a>}
              </div>

              {podeEditar(e)&&<div style={{display:'flex',gap:'0.2rem',flexShrink:0}}>
                <button onClick={()=>setEdit({...e,dataFin:e.dataFin||''})} style={{...S.btn(T.bg3,T.text3),fontSize:'0.72rem',padding:'0.25rem 0.5rem'}}>Editar</button>
                <button onClick={()=>eliminar(e)} style={{background:'none',border:'none',color:T.danger,cursor:'pointer',fontSize:'0.85rem',padding:'0.25rem'}}>🗑</button>
              </div>}
            </div>
          </div>);
        })}
      </div>
    </div>))}
  </div>);
}
