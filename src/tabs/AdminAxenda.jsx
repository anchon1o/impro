import { useState, useEffect } from 'react';
import { useTheme, mkS } from '../core.jsx';
import { TIPOS_EVENTO, ESTADOS_EVENTO, tipoEvento, listarEventos,
         moderarEvento, borrarEvento, formatarData } from '../eventos.js';
import { cargarUniverso } from '../universo.js';

// Moderación da axenda. As suxestións de quen ten conta chegan en estado
// 'pendente' e non se ven no calendario público ata aprobalas.
//
// Rexeitar non borra: cambia o estado, para que quede rastro de que se
// propuxo e por que se descartou. Mesmo criterio ca en Universo.

export function AdminAxenda(){
  const {T}=useTheme(); const S=mkS(T);
  const [eventos,setEventos]=useState([]);
  const [entradas,setEntradas]=useState([]);
  const [filtro,setFiltro]=useState('pendente');
  const [cargando,setCargando]=useState(true);
  const [erro,setErro]=useState('');
  const [notas,setNotas]=useState({});

  const cargar=()=>{
    setCargando(true);
    listarEventos({estado:filtro,incluirPasados:true}).then(r=>{
      setEventos(Array.isArray(r)?r:(r?.eventos||[]));
      setErro(r?.erro||''); setCargando(false);
    });
  };
  useEffect(cargar,[filtro]);
  useEffect(()=>{cargarUniverso().then(u=>setEntradas(u||[]));},[]);

  const ficha=id=>entradas.find(e=>e.id===id);
  const decidir=async(id,estado)=>{
    if(await moderarEvento(id,estado,notas[id]||undefined)){
      setNotas(n=>{const x={...n};delete x[id];return x;});
      cargar();
    }
  };
  const eliminar=async e=>{
    if(!confirm(`Borrar definitivamente «${e.titulo}»?`))return;
    if(await borrarEvento(e.id))cargar();
  };

  const cor=e=>T[ESTADOS_EVENTO.find(x=>x.id===e)?.cor||'muted'];

  return(<div>
    <div style={{marginBottom:'0.8rem'}}>
      <p style={{...S.ptitle(T.accent),margin:0}}>Axenda</p>
      <p style={{...S.caption,margin:'0.2rem 0 0'}}>
        As suxestións de quen ten conta chegan aquí. Non se ven no calendario ata publicalas.
      </p>
    </div>

    <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap',marginBottom:'0.9rem'}}>
      {[['pendente','Pendentes'],['publicado','Publicados'],['borrador','Borradores'],
        ['rexeitado','Rexeitados'],['cancelado','Cancelados'],['todos','Todos']].map(([id,lab])=>(
        <button key={id} onClick={()=>setFiltro(id)} style={{
          background:filtro===id?T.accent:T.bg3,color:filtro===id?'#000':T.text3,
          border:'none',borderRadius:20,padding:'0.28rem 0.7rem',fontSize:'0.74rem',
          fontWeight:filtro===id?700:400,cursor:'pointer',fontFamily:'inherit'}}>{lab}</button>))}
    </div>

    {erro&&<div style={{background:T.danger+'12',borderStyle:'solid',borderWidth:1,borderColor:T.danger+'44',borderRadius:8,padding:'0.8rem',marginBottom:'0.8rem'}}>
      <p style={{color:T.danger,fontWeight:700,fontSize:'0.82rem',margin:'0 0 0.25rem'}}>Non se puido cargar</p>
      <p style={{color:T.text3,fontSize:'0.76rem',margin:0,fontFamily:'monospace'}}>{erro}</p>
      <p style={{color:T.text3,fontSize:'0.76rem',margin:'0.5rem 0 0'}}>
        Executa <code>supabase_eventos.sql</code> e <code>supabase_eventos_moderacion.sql</code>.
      </p>
    </div>}

    {cargando&&<p style={S.caption}>Cargando…</p>}
    {!cargando&&!erro&&eventos.length===0&&<p style={S.caption}>Sen eventos nesta vista.</p>}

    <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
      {eventos.map(e=>{
        const tp=tipoEvento(e.tipo);
        const org=ficha(e.organizaId), lug=ficha(e.lugarId);
        return(<div key={e.id} style={{...S.panel,padding:'0.8rem',
          borderStyle:'solid',borderWidth:'1px 1px 1px 3px',
          borderColor:T.border,borderLeftColor:cor(e.estado)}}>

          <div style={{display:'flex',gap:'0.4rem',alignItems:'center',flexWrap:'wrap',marginBottom:'0.35rem'}}>
            <span style={{...S.tag(T[tp.cor]||T.accent),fontSize:'0.66rem'}}>{tp.emoji} {tp.label}</span>
            <span style={{...S.tag(cor(e.estado)),fontSize:'0.66rem'}}>{e.estado}</span>
            <span style={{color:T.text3,fontSize:'0.76rem',fontFamily:'monospace'}}>
              {formatarData(e.dataInicio,e.dataFin)}{e.hora?` · ${e.hora}`:''}</span>
          </div>

          <p style={{color:T.text,fontWeight:700,fontSize:'0.92rem',margin:0}}>{e.titulo}</p>
          {e.desc&&<p style={{color:T.text3,fontSize:'0.8rem',margin:'0.2rem 0 0',lineHeight:1.5}}>{e.desc}</p>}

          <p style={{color:T.text4,fontSize:'0.74rem',margin:'0.35rem 0 0',lineHeight:1.6}}>
            {org&&<span>{org.logo} {org.nome}</span>}
            {org&&(lug||e.cidade)&&' · '}
            {lug?<span>📍 {lug.logo} {lug.nome}</span>:(e.cidade&&<span>📍 {e.cidade}</span>)}
            {e.prezo&&<span> · {e.prezo}</span>}
          </p>

          {e.url&&<a href={e.url.startsWith('http')?e.url:`https://${e.url}`} target="_blank" rel="noopener noreferrer"
            style={{color:T.info,fontSize:'0.76rem',display:'inline-block',marginTop:'0.25rem'}}>Comprobar a ligazón ↗</a>}

          <input value={notas[e.id]??e.notaRevision??''} onChange={ev=>setNotas(n=>({...n,[e.id]:ev.target.value}))}
            placeholder="Nota de revisión (opcional)" style={{...S.input,margin:'0.6rem 0 0.5rem',fontSize:'0.78rem'}}/>

          <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap',alignItems:'center'}}>
            {ESTADOS_EVENTO.filter(x=>x.id!==e.estado).map(x=>(
              <button key={x.id} onClick={()=>decidir(e.id,x.id)}
                style={{...S.btn(x.id==='publicado'?T.ok:T.bg3, x.id==='publicado'?'#000':T.text3),
                  fontSize:'0.74rem',padding:'0.25rem 0.6rem'}}>{x.label}</button>))}
            <button onClick={()=>eliminar(e)} style={{background:'none',border:'none',color:T.danger,
              cursor:'pointer',fontSize:'0.9rem',marginLeft:'auto'}}>🗑</button>
          </div>
        </div>);
      })}
    </div>
  </div>);
}
