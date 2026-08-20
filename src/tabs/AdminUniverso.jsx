// ═══════════════════════════════════════════════════════════════════
// ADMIN · Universo
// ═══════════════════════════════════════════════════════════════════
// Pendentes, fichas, táboa masiva e categorías.

import { useState, useEffect, useCallback } from 'react';
import { useTheme, mkS, t, useAuth } from '../core.jsx';
import { listarPendentesUniverso, listarTodoUniverso, moderarUniverso,
         engadirUniverso, editarUniverso, borrarUniverso,
         cargarCategorias } from '../universo.js';
import { AdminCategorias } from './AdminCategorias.jsx';
import { AdminTablaMasiva } from './AdminTablaMasiva.jsx';
import { UniversoForm } from './UniversoForm.jsx';

export function AdminUniverso({T,S}){
  const {user}=useAuth();
  const [pendentes,setPendentes]=useState([]);
  const [todos,setTodos]=useState([]);
  const [loading,setLoading]=useState(true);
  const [vista,setVista]=useState("pendentes");
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState(null);
  const [cats,setCats]=useState([]);
  const [msgForm,setMsgForm]=useState("");

  const cargar=useCallback(async()=>{
    setLoading(true);
    const [p,t,c]=await Promise.all([listarPendentesUniverso(),listarTodoUniverso(),cargarCategorias()]);
    setPendentes(p);setTodos(t);setCats((Array.isArray(c)?c:(c?.cats||[])).filter(x=>x.activa!==false));setLoading(false);
  },[]);

  // Un só camiño de gardado, tanto para crear como para editar. O formulario
  // devolve xa a ficha no formato do modelo (ligazons, datos, logoUrl…).
  const gardarFicha=async(ficha)=>{
    const ok=ficha.id
      ? await editarUniverso(ficha.id,ficha)
      : !!(await engadirUniverso(ficha,user?.id,ficha.estado==="publicada"));
    if(ok){setShowForm(false);setEditId(null);setMsgForm("");cargar();}
    else setMsgForm("Non se puido gardar. Revisa a consola para o detalle.");
  };
  useEffect(()=>{cargar();},[cargar]);

  const [notas,setNotas]=useState({});
  // Recibe o estado destino ('publicada' | 'rexeitada' | 'borrador') en vez
  // dun booleano. Rexeitar deixa rastro; xa non borra a fila.
  const decidir=async(id,estado)=>{
    const ok=await moderarUniverso(id,estado,notas[id]||undefined);
    if(ok){setNotas(n=>{const x={...n};delete x[id];return x;});cargar();}
  };
  const borrar=async(id)=>{
    if(!confirm("Eliminar esta entrada de Universo Impro?"))return;
    await borrarUniverso(id);cargar();
  };

  // O formulario xa xestiona os seus propios valores: aquí só se decide
  // que ficha se lle pasa como inicial.
  const openNew=()=>{setEditId(null);setMsgForm("");setShowForm(true);};
  const openEdit=item=>{setEditId(item.id);setMsgForm("");setShowForm(true);};

  // TIPO_COL: cores por categoría. A categoría xa non é unha lista fixa
  // (créanse en Admin → Categorías), así que se resolve contra o tema e se
  // cae ao acento se non hai correspondencia.
  const TIPO_COL={"compañía":T.accent,festival:T.warn,escola:T.info,persoa:T.ok,proxecto:T.danger,colectivo:T.alt,espazo:T.muted};

  if(loading)return<p style={{color:T.text3,fontSize:"0.85rem"}}>Cargando...</p>;

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.85rem",flexWrap:"wrap",gap:"0.5rem"}}>
      <div style={{display:"flex",gap:2,background:T.bg3,borderRadius:10,padding:3}}>
        {[["pendentes",`Pendentes (${pendentes.length})`],["todos",`Fichas (${todos.length})`],["masiva","Táboa"],["categorias","🏷 Categorías"]].map(([id,label])=>
          <button key={id} onClick={()=>setVista(id)} style={{...S.btn(vista===id?T.bg2:"transparent",vista===id?T.text:T.text3),borderRadius:8,padding:"0.35rem 0.7rem",fontSize:"0.78rem"}}>{label}</button>)}
      </div>
      {vista!=="masiva"&&vista!=="categorias"&&<button onClick={openNew} style={S.btn(T.accent)}>+ Nova entrada</button>}
    </div>

    {/* Formulario compartido coa pestana Universo. Antes había aquí outro
        distinto con só 8 campos: sen logo por imaxe, sen redes sociais e sen
        os campos de plantilla. Toda entrada creada desde Admin nacía
        incompleta e despois había que completala a man na outra pantalla. */}
    {showForm&&<UniversoForm
      cats={cats}
      logueado={true}
      admin={true}
      inicial={editId?todos.find(x=>x.id===editId)||null:null}
      onEnviar={gardarFicha}
      onCancelar={()=>{setShowForm(false);setEditId(null);}}/>}

    {/* M08 — Cola de moderación.
        Rexeitar xa NON borra a fila: cambia o estado a 'rexeitada'. Así
        queda o rastro de quen propuxo que e por que se descartou, e sempre
        se pode reverter. Antes «rexeitar» chamaba a borrarUniverso(). */}
    {vista==="pendentes"&&<div style={S.panel}>
      {pendentes.length===0&&<p style={{color:T.text4,fontSize:"0.83rem"}}>Sen entradas pendentes.</p>}
      <div style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
        {pendentes.map(p=>{
          const lig=p.ligazons||{};
          const dat=p.datos||{};
          const claves=Object.keys(dat);
          return(<div key={p.id} style={{background:T.bg3,borderRadius:10,padding:"0.8rem 0.9rem",borderLeft:`3px solid ${TIPO_COL[p.tipo]||T.accent}`}}>
            <div style={{marginBottom:"0.6rem"}}>
              <span style={{color:T.text,fontWeight:700,fontSize:"0.9rem"}}>{p.pais} {p.nome}</span>
              <span style={{...S.tag(TIPO_COL[p.tipo]||T.accent),marginLeft:"0.4rem"}}>{p.tipo}</span>
              <p style={{color:T.text3,fontSize:"0.79rem",margin:"0.4rem 0 0",lineHeight:1.5}}>{p.descricion}</p>

              {claves.length>0&&<p style={{color:T.text4,fontSize:"0.73rem",margin:"0.4rem 0 0",lineHeight:1.5}}>
                {claves.map(k=>`${k}: ${Array.isArray(dat[k])?dat[k].join(", "):dat[k]}`).join(" · ")}
              </p>}

              {Object.keys(lig).length>0&&<p style={{margin:"0.35rem 0 0",display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                {Object.entries(lig).filter(([k])=>k!=="outras").map(([k,v])=>
                  <a key={k} href={String(v).startsWith("http")?v:`https://${v}`} target="_blank" rel="noopener noreferrer" style={{color:T.info,fontSize:"0.73rem"}}>{k} ↗</a>)}
              </p>}

              <p style={{color:T.text4,fontSize:"0.72rem",margin:"0.45rem 0 0"}}>
                {p.cidade&&`${p.cidade}`}
                {p.created_at&&`${p.cidade?" · ":""}${new Date(p.created_at).toLocaleDateString()}`}
              </p>
            </div>

            <input value={notas[p.id]||""} onChange={e=>setNotas(n=>({...n,[p.id]:e.target.value}))}
              placeholder="Nota de revisión (opcional)" style={{...S.input,marginBottom:"0.5rem",fontSize:"0.78rem"}}/>

            <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
              <button onClick={()=>decidir(p.id,"publicada")} style={{...S.btn(T.ok,"#000"),fontSize:"0.78rem"}}>✓ Publicar</button>
              <button onClick={()=>decidir(p.id,"rexeitada")} style={{...S.btn(T.bg4,T.text3),fontSize:"0.78rem"}}>✕ Rexeitar</button>
              <button onClick={()=>decidir(p.id,"borrador")} style={{...S.btn(T.bg4,T.text3),fontSize:"0.78rem"}}>◷ Deixar en borrador</button>
            </div>
          </div>);
        })}
      </div>
    </div>}

    {/* A edición masiva vive aquí dentro, non nunha sección aparte: é outra
        forma de ver o mesmo contido, non outra cousa. */}
    {vista==="masiva"&&<AdminTablaMasiva/>}
    {vista==="categorias"&&<AdminCategorias/>}

    {vista==="todos"&&<div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
      {todos.map(item=>(<div key={item.id} style={{...S.panel,padding:"0.6rem 0.9rem",display:"flex",gap:"0.6rem",alignItems:"center",borderLeft:`3px solid ${TIPO_COL[item.tipo]||T.accent}`}}>
        <div style={{flex:1,minWidth:0}}>
          <span style={{fontWeight:700,color:T.text,fontSize:"0.88rem"}}>{item.pais} {item.nome}</span>
          <span style={{...S.tag(TIPO_COL[item.tipo]||T.accent),marginLeft:"0.4rem"}}>{item.tipo}</span>
          {!item.verificado&&<span style={{...S.tag(T.warn),marginLeft:"0.4rem"}}>sen verificar</span>}
          {item.achegadoPor&&<p style={{color:T.text4,fontSize:"0.72rem",margin:"0.2rem 0 0"}}>por {item.achegadoPor}</p>}
        </div>
        <button onClick={()=>openEdit(item)} style={{...S.btn(T.bg3,T.text3),padding:"0.28rem 0.5rem",fontSize:"0.76rem"}}>✏️</button>
        <button onClick={()=>borrar(item.id)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.9rem"}}>×</button>
      </div>))}
    </div>}
  </div>);
}
