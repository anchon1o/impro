import { useState, useEffect } from 'react';
import { useTheme, mkS } from '../core.jsx';
import { TIPOS_REPORTE, ESTADOS_REPORTE, listarReportes, actualizarReporte, borrarReporte, reportesAMarkdown } from '../reportes.js';

// Bandexa de fallos e propostas. O botón de exportar xera markdown listo
// para pegar nunha conversa con Claude, que era a idea de todo isto.

const PRIORIDADES=[['p0','P0'],['p1','P1'],['p2','P2'],['p3','P3']];

export function AdminReportes(){
  const {T}=useTheme();const S=mkS(T);
  const [reportes,setReportes]=useState([]);
  const [filtro,setFiltro]=useState('aberto');
  const [cargando,setCargando]=useState(true);
  const [erro,setErro]=useState('');
  const [notas,setNotas]=useState({});
  const [copiado,setCopiado]=useState(false);

  const cargar=()=>{
    setCargando(true);
    listarReportes(filtro).then(({reportes:r,erro:e})=>{setReportes(r);setErro(e||'');setCargando(false);});
  };
  useEffect(cargar,[filtro]);

  const cambiar=async(id,campos)=>{ if(await actualizarReporte(id,campos)) cargar(); };
  const eliminar=async id=>{ if(confirm('Borrar este reporte?')&&await borrarReporte(id)) cargar(); };

  const exportar=async()=>{
    const {reportes:todos}=await listarReportes('todos');
    const md=reportesAMarkdown(todos);
    try{ await navigator.clipboard.writeText(md); setCopiado(true); setTimeout(()=>setCopiado(false),2500); }
    catch{
      const blob=new Blob([md],{type:'text/markdown'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);
      a.download='improapp_reportes.md';a.click();URL.revokeObjectURL(a.href);
    }
  };

  const cor=e=>T[ESTADOS_REPORTE.find(x=>x.id===e)?.cor||'muted'];
  const emoji=t=>TIPOS_REPORTE.find(x=>x.id===t)?.emoji||'🐛';

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.8rem"}}>
      <p style={{...S.ptitle(T.accent),margin:0}}>Fallos e propostas</p>
      <button onClick={exportar} style={{...S.btn(T.bg3,T.text2),fontSize:"0.76rem"}}>
        {copiado?"✓ Copiado":"⧉ Copiar como markdown"}</button>
    </div>

    <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap",marginBottom:"0.8rem"}}>
      {[['aberto','Abertos'],['en_curso','En curso'],['resolto','Resoltos'],['descartado','Descartados'],['todos','Todos']].map(([id,lab])=>(
        <button key={id} onClick={()=>setFiltro(id)} style={{background:filtro===id?T.accent:T.bg3,
          color:filtro===id?"#fff":T.text3,border:"none",borderRadius:20,padding:"0.28rem 0.7rem",
          fontSize:"0.74rem",cursor:"pointer",fontFamily:"inherit"}}>{lab}</button>))}
    </div>

    {erro&&<div style={{background:T.danger+"12",borderStyle:"solid",borderWidth:1,borderColor:T.danger+"44",borderRadius:8,padding:"0.8rem",marginBottom:"0.8rem"}}>
      <p style={{color:T.danger,fontWeight:700,fontSize:"0.82rem",margin:"0 0 0.25rem"}}>Non se puideron cargar</p>
      <p style={{color:T.text3,fontSize:"0.76rem",margin:0,fontFamily:"monospace"}}>{erro}</p>
      <p style={{color:T.text3,fontSize:"0.76rem",margin:"0.5rem 0 0"}}>
        Se pon «permission denied» ou «does not exist», executa <code>supabase_reportes.sql</code>.
      </p>
    </div>}

    {cargando&&<p style={S.caption}>Cargando…</p>}
    {!cargando&&!erro&&reportes.length===0&&<p style={S.caption}>Sen entradas nesta vista.</p>}

    <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
      {reportes.map(r=>(
        <div key={r.id} style={{...S.panel,padding:"0.8rem",borderStyle:"solid",borderWidth:"1px 1px 1px 3px",
          borderColor:T.border,borderLeftColor:cor(r.estado)}}>
          <div style={{display:"flex",gap:"0.4rem",alignItems:"flex-start",flexWrap:"wrap",marginBottom:"0.4rem"}}>
            <span style={{fontSize:"1rem"}}>{emoji(r.tipo)}</span>
            <span style={{color:T.text,fontWeight:700,fontSize:"0.88rem",flex:1,minWidth:120}}>{r.titulo}</span>
            <span style={{...S.tag(cor(r.estado)),fontSize:"0.66rem"}}>{r.estado}</span>
            <span style={{...S.tag(T.text4),background:T.bg3,fontSize:"0.66rem"}}>{r.prioridade}</span>
          </div>

          {r.detalle&&<p style={{color:T.text2,fontSize:"0.8rem",margin:"0 0 0.5rem",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{r.detalle}</p>}

          <p style={{color:T.text4,fontSize:"0.7rem",margin:"0 0 0.5rem",fontFamily:"monospace",lineHeight:1.6}}>
            {r.onde&&`onde: ${r.onde} · `}{r.pantalla&&`${r.pantalla} · `}{r.tema&&`${r.tema} · `}
            {r.autor||(r.contacto?r.contacto:'anónimo')}
            {r.created_at&&` · ${new Date(r.created_at).toLocaleDateString()}`}
          </p>

          <input value={notas[r.id]??r.nota_admin??''} onChange={e=>setNotas(n=>({...n,[r.id]:e.target.value}))}
            onBlur={()=>{ if((notas[r.id]??'')!==(r.nota_admin||'')) cambiar(r.id,{nota_admin:notas[r.id]||''}); }}
            placeholder="Nota interna" style={{...S.input,marginBottom:"0.5rem",fontSize:"0.78rem"}}/>

          <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap",alignItems:"center"}}>
            {ESTADOS_REPORTE.filter(e=>e.id!==r.estado).map(e=>(
              <button key={e.id} onClick={()=>cambiar(r.id,{estado:e.id})}
                style={{...S.btn(T.bg3,T.text3),fontSize:"0.72rem",padding:"0.25rem 0.55rem"}}>{e.label}</button>))}
            <span style={{width:1,height:18,background:T.border,margin:"0 0.2rem"}}/>
            {PRIORIDADES.filter(([p])=>p!==r.prioridade).map(([p,lab])=>(
              <button key={p} onClick={()=>cambiar(r.id,{prioridade:p})}
                style={{...S.btn(T.bg3,T.text4),fontSize:"0.72rem",padding:"0.25rem 0.5rem"}}>{lab}</button>))}
            <button onClick={()=>eliminar(r.id)} style={{background:"none",border:"none",color:T.danger,
              cursor:"pointer",fontSize:"0.9rem",marginLeft:"auto"}}>🗑</button>
          </div>
        </div>))}
    </div>
  </div>);
}
