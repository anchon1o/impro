// ============================================================
// tabs/TabGenerar.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth, t, useLang, useTheme, useEstimulos, CAT_ICONS, UID, pick, ls, trackGen, mkS, Spotlight, useViewport} from '../core.jsx';
import { PLANTILLAS, PLANTILLAS_BASE } from '../datos.js';
import { getPlantillas, savePlantilla, deletePlantilla } from '../auth.js';
import { trackGenSupa } from '../db.js';
// R10a · Reto xa non é unha área: é un modo máis desta pantalla.
import { ModoReto } from './ModoReto.jsx';

export function TabGenerar({onStimulus}){
  const {T}=useTheme();const S=mkS(T);
  const {data:ESTIMULOS,cats:CATS_DB,cargando}=useEstimulos();
  const CATS=CATS_DB.length?CATS_DB.map(c=>c.id):Object.keys(ESTIMULOS);
  const iconOf=id=>CATS_DB.find(c=>c.id===id)?.icona||CAT_ICONS[id]||"◆";
  const [nivel,setNivel]=useState("simple");
  const [sel,setSel]=useState(null);
  const [spotlight,setSpotlight]=useState(null);
  const [favoritos,setFavoritos]=useState(()=>ls.get("impro_favoritos",[]));
  const [view,setView]=useState("cats");
  const [sceneCats,setSceneCats]=useState(["PROFESIÓN","LUGAR","EMOCIÓN"]);
  const [scene,setScene]=useState(null);
  const [frozenCats,setFrozenCats]=useState([]);
  const [histEscenas,setHistEscenas]=useState(()=>ls.get("impro_hist_escenas",[]));
  const [sceneSubview,setSceneSubview]=useState("gen");
  const {logueado,pedirLogin,user}=useAuth();
  const [plantillas,setPlantillas]=useState([]);
  // A etiqueta do modo Reto si sae de UI_STRINGS: a clave xa existía
  // cando era área e segue sendo válida. Se non hai LangCtx (algunhas
  // probas montan a pestana soa), `t()` cae a castelán, non á clave crúa.
  const {lang}=useLang()||{};

  // As once categorías caben nunha pantalla sen desprazar, igual que a
  // botonera de inicio. `h||800` porque `innerHeight` pode ser undefined
  // nalgunhas webviews e daría NaN.
  const {w:anchoG,h:altoG,esMovil}=useViewport();
  const colsCat=anchoG<340?2:anchoG<560?3:anchoG<900?4:5;
  const filasCat=Math.ceil((CATS.length||1)/colsCat);
  const GAPC=esMovil?7:10;
  const RESERVAC=esMovil?210:250;      // cabeceira + controis de arriba
  const libreCat=Math.max(200,(altoG||800)-RESERVAC-GAPC*(filasCat-1));
  const altoCat=Math.max(esMovil?76:88,Math.min(190,libreCat/filasCat));
  const szCat=`${Math.max(1.3,Math.min(2.6,altoCat*0.026)).toFixed(2)}rem`;
  const [showPlantillaForm,setShowPlantillaForm]=useState(false);
  const [nomePlantilla,setNomePlantilla]=useState("");

  useEffect(()=>{
    if(!user?.id){setPlantillas([]);return;}
    getPlantillas(user.id).then(setPlantillas);
  },[user?.id]);

  const gardarPlantilla=async()=>{
    if(!nomePlantilla.trim()||sceneCats.length===0)return;
    const nova=await savePlantilla(user.id,nomePlantilla.trim(),sceneCats);
    if(nova)setPlantillas(p=>[...p,nova]);
    setNomePlantilla("");setShowPlantillaForm(false);
  };
  const borrarPlantilla=async(id)=>{
    if(!confirm("Eliminar esta plantilla?"))return;
    await deletePlantilla(id);
    setPlantillas(p=>p.filter(x=>x.id!==id));
  };
  const mesmaCombinacion=cats=>JSON.stringify(sceneCats)===JSON.stringify(cats);

  const getList=cat=>{
    const d=ESTIMULOS[cat]||{simple:[],plus:[]};
    const base=nivel==="plus"&&d.plus.length>0?d.plus:d.simple;
    const userStimuli=ls.get("impro_user_stimuli",{});
    const userAdds=(userStimuli[cat]?.[nivel]||[]);
    const edits=userStimuli[`${cat}_edits`]?.[nivel]||{};
    const deleted=userStimuli[`${cat}_deleted`]?.[nivel]||[];
    const baseFiltered=base.filter((_,i)=>!deleted.includes(i)).map((t,i)=>edits[base.indexOf(t)]||t);
    return [...baseFiltered,...userAdds];
  };
  const generate=cat=>{const list=getList(cat);const raw=pick(list);const isIdea=raw.endsWith("👥");const word=isIdea?raw.slice(0,-2):raw;const s={cat,word,isIdea};setSel(s);setSpotlight(s);onStimulus?.({word,category:cat});trackGen(cat);trackGenSupa(cat);};
  const generateRandom=()=>generate(CATS[Math.floor(Math.random()*CATS.length)]);
  const generateScene=()=>{
    const newScene=sceneCats.map(cat=>{
      if(frozenCats.includes(cat)){const existing=scene?.find(s=>s.cat===cat);if(existing)return existing;}
      const list=getList(cat);const raw=pick(list);const isIdea=raw.endsWith("👥");
      return{cat,word:isIdea?raw.slice(0,-2):raw,isIdea};
    });
    setScene(newScene);
    const entry={id:UID(),ts:Date.now(),items:newScene,nivel};
    setHistEscenas(h=>{const u=[entry,...h].slice(0,20);ls.set("impro_hist_escenas",u);return u;});
  };
  const saveFav=item=>{const u=[{...item,id:UID(),nivel,ts:Date.now()},...favoritos];setFavoritos(u);ls.set("impro_favoritos",u);};
  const removeFav=id=>{const u=favoritos.filter(f=>f.id!==id);setFavoritos(u);ls.set("impro_favoritos",u);};

  return(<div>
    {spotlight&&<Spotlight word={spotlight.word} category={spotlight.cat} onClose={()=>setSpotlight(null)}/>}
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.75rem",flexWrap:"wrap",alignItems:"center"}}>
      <div style={{display:"flex",background:T.bg3,borderRadius:10,padding:3,gap:2}}>
        {/* R10a · Catro modos. Reto vai despois de Escena porque é a
            mesma escalada: unha palabra → unha escena → un exercicio
            completo. */}
        {[["cats","Categ."],["scene","🎬 Escena"],["reto",`⚡ ${t(lang,"reto")}`],["favs",`♡ (${favoritos.length})`]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{...S.btn(view===v?T.bg2:"transparent",view===v?T.text:T.text3),borderRadius:8,padding:"0.35rem 0.6rem",fontSize:"0.78rem",boxShadow:view===v?"0 1px 4px rgba(0,0,0,0.15)":"none"}}>{l}</button>
        ))}
      </div>
    </div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem",flexWrap:"wrap",alignItems:"center"}}>
      <div style={{display:"flex",background:T.bg3,borderRadius:10,padding:3,gap:2}}>
        {[["simple","🌱 Simple"],["plus","⭐ Plus"]].map(([v,l])=>(
          <button key={v} onClick={()=>setNivel(v)} style={{...S.btn(v==="plus"&&nivel==="plus"?T.accent:v==="simple"&&nivel==="simple"?T.bg2:"transparent",v===nivel?(v==="plus"?"#fff":T.text):T.text3),borderRadius:8,padding:"0.35rem 0.65rem",fontSize:"0.78rem"}}>{l}</button>
        ))}
      </div>
      {view==="cats"&&<button onClick={generateRandom} style={S.btn(T.accent)}>🎲 Ao chou</button>}
    </div>

    {/* R10a · O nivel e a lista de estímulos veñen de aquí: Reto tiña os
        seus e podían discrepar cos de Xerar (os engadidos polo usuario
        non chegaban ao sorteo). */}
    {view==="reto"&&<ModoReto nivel={nivel} getList={getList}/>}

    {view==="favs"&&(<div>
      {favoritos.length===0?<div style={{...S.panel,textAlign:"center",padding:"2rem"}}><p style={{color:T.text4}}>Aínda non gardaches ningún estímulo. Xera un e preme ♡.</p></div>
      :<div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
        {favoritos.map(f=>(<div key={f.id} style={{...S.panel,display:"flex",alignItems:"center",gap:"0.75rem"}}>
          <span>{CAT_ICONS[f.cat]||"◆"}</span>
          <div style={{flex:1}}><p style={{color:T.text3,fontSize:"0.68rem",letterSpacing:"0.12em",margin:"0 0 0.1rem",fontFamily:"monospace"}}>{f.cat}</p><p style={{color:T.text,fontWeight:700,margin:0}}>{f.word}{f.isIdea?" 👥":""}</p></div>
          <button onClick={()=>removeFav(f.id)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"1rem"}}>×</button>
        </div>))}
        <button onClick={()=>{setFavoritos([]);ls.set("impro_favoritos",[]);}} style={{...S.btn(T.bg3,T.text4),fontSize:"0.78rem"}}>Borrar todos</button>
      </div>}
    </div>)}

    {view==="scene"&&(<div>
      {}
      <div style={{display:"flex",background:T.bg3,borderRadius:10,padding:3,gap:2,marginBottom:"0.75rem"}}>
        {[["gen","🎬 Generador"],["hist",`📜 Historial (${histEscenas.length})`]].map(([v,l])=>(
          <button key={v} onClick={()=>setSceneSubview(v)} style={{...S.btn(sceneSubview===v?T.bg2:"transparent",sceneSubview===v?T.text:T.text3),borderRadius:8,padding:"0.35rem 0.75rem",fontSize:"0.8rem",flex:1,boxShadow:sceneSubview===v?"0 1px 4px rgba(0,0,0,0.15)":"none"}}>{l}</button>
        ))}
      </div>

      {sceneSubview==="hist"&&(<div>
        {histEscenas.length===0&&<div style={{...S.panel,textAlign:"center",padding:"2rem",color:T.text4}}>
          <p style={{fontSize:"1.5rem",margin:"0 0 0.5rem"}}>📜</p><p style={{margin:0}}>Xera escenas para velas aquí.</p>
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:"0.55rem"}}>
          {histEscenas.map((entry,i)=>(<div key={entry.id} style={{...S.panel,border:`1.5px solid ${T.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.6rem",flexWrap:"wrap",gap:"0.4rem"}}>
              <span style={{color:T.text3,fontSize:"0.75rem"}}>{new Date(entry.ts).toLocaleString("es-ES",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
              <div style={{display:"flex",gap:"0.4rem"}}>
                <button onClick={()=>{setScene(entry.items);setSceneSubview("gen");}} style={{...S.btn(T.accent),padding:"0.25rem 0.6rem",fontSize:"0.75rem"}}>↩ Recuperar</button>
                <button onClick={()=>entry.items.forEach(i=>saveFav(i))} style={{...S.btn(T.bg3,T.text2),padding:"0.25rem 0.6rem",fontSize:"0.75rem"}}>♡</button>
                <button onClick={()=>{const u=histEscenas.filter((_,j)=>j!==i);setHistEscenas(u);ls.set("impro_hist_escenas",u);}} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.9rem"}}>×</button>
              </div>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
              {entry.items.map((item,j)=>(<div key={j} style={{background:T.bg3,borderRadius:8,padding:"0.25rem 0.6rem"}}>
                <span style={{color:T.text3,fontSize:"0.65rem",display:"block",fontFamily:"monospace"}}>{item.cat}</span>
                <span style={{color:T.text,fontSize:"0.82rem",fontWeight:600}}>{item.word}</span>
              </div>))}
            </div>
          </div>))}
        </div>
        {histEscenas.length>0&&<button onClick={()=>{setHistEscenas([]);ls.set("impro_hist_escenas",[]);}} style={{...S.btn(T.bg3,T.text4),fontSize:"0.75rem",marginTop:"0.5rem"}}>↺ Borrar historial</button>}
      </div>)}

      {sceneSubview==="gen"&&<div>
      {}
      <div style={{...S.panel,marginBottom:"0.75rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.6rem",flexWrap:"wrap",gap:"0.4rem"}}>
          <p style={{color:T.text3,fontSize:"0.72rem",margin:0,letterSpacing:"0.1em",fontFamily:"monospace"}}>PLANTILLAS</p>
          <button onClick={()=>{if(!logueado){pedirLogin();return;}setShowPlantillaForm(v=>!v);}} style={{...S.btn(T.bg3,T.accent),fontSize:"0.73rem",padding:"0.22rem 0.6rem"}}>
            {showPlantillaForm?"✕ Cancelar":"+ Gardar actual"}
          </button>
        </div>

        {showPlantillaForm&&<div style={{background:T.bg3,borderRadius:10,padding:"0.7rem 0.85rem",marginBottom:"0.7rem",border:`1.5px solid ${T.accent}33`}}>
          <p style={{color:T.text3,fontSize:"0.76rem",margin:"0 0 0.5rem"}}>Gardar <strong style={{color:T.accent}}>{sceneCats.join(" + ")}</strong> como plantilla</p>
          <div style={{display:"flex",gap:"0.4rem"}}>
            <input value={nomePlantilla} onChange={e=>setNomePlantilla(e.target.value)} onKeyDown={e=>e.key==="Enter"&&gardarPlantilla()} placeholder="Nome da plantilla..." style={{...S.input,flex:1}} autoFocus/>
            <button onClick={gardarPlantilla} disabled={!nomePlantilla.trim()} style={{...S.btn(T.accent),opacity:nomePlantilla.trim()?1:0.4}}>Gardar</button>
          </div>
        </div>}

        <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginBottom:"0.75rem"}}>
          {PLANTILLAS_BASE.map(t=>(<button key={t.label} onClick={()=>setSceneCats(t.cats)} style={{background:mesmaCombinacion(t.cats)?T.accent+"22":T.bg3,border:`1.5px solid ${mesmaCombinacion(t.cats)?T.accent:T.border}`,color:mesmaCombinacion(t.cats)?T.accent:T.text3,borderRadius:8,padding:"0.28rem 0.65rem",fontSize:"0.76rem",cursor:"pointer",fontFamily:"inherit"}}>{t.label}</button>))}

          {plantillas.map(p=>(<span key={p.id} style={{display:"inline-flex",alignItems:"center",background:mesmaCombinacion(p.cats)?T.ok+"22":T.bg3,border:`1.5px solid ${mesmaCombinacion(p.cats)?T.ok:T.border}`,borderRadius:8,overflow:"hidden"}}>
            <button onClick={()=>setSceneCats(p.cats)} title={p.cats.join(" + ")} style={{background:"none",border:"none",color:mesmaCombinacion(p.cats)?T.ok:T.text3,padding:"0.28rem 0.5rem 0.28rem 0.65rem",fontSize:"0.76rem",cursor:"pointer",fontFamily:"inherit"}}>★ {p.nome}</button>
            <button onClick={()=>borrarPlantilla(p.id)} style={{background:"none",border:"none",color:T.text4,padding:"0.28rem 0.5rem 0.28rem 0.2rem",cursor:"pointer",fontSize:"0.8rem"}}>×</button>
          </span>))}

          {!logueado&&<button onClick={pedirLogin} style={{background:"none",border:`1.5px dashed ${T.border}`,color:T.text4,borderRadius:8,padding:"0.28rem 0.65rem",fontSize:"0.74rem",cursor:"pointer",fontFamily:"inherit"}}>🔒 Gardar as túas</button>}
        </div>
        <button onClick={generateScene} disabled={!sceneCats.length} style={{...S.btn(T.accent),width:"100%",opacity:!sceneCats.length?0.4:1}}>🎬 Xerar escena</button>
      </div>
      {scene&&(<div style={{...S.panel,border:`1.5px solid ${T.accent}44`,animation:"fadeIn 0.35s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.85rem",flexWrap:"wrap",gap:"0.5rem"}}>
          <span style={{color:T.accent,fontSize:"0.72rem",fontFamily:"monospace",letterSpacing:"0.15em"}}>ESCENA GENERADA</span>
          <div style={{display:"flex",gap:"0.5rem"}}>
            <button onClick={()=>scene.forEach(i=>saveFav(i))} style={S.btn(T.bg3,T.text2)}>♡ Gardar</button>
            <button onClick={generateScene} style={S.btn(T.accent)}>🎲 Nueva</button>
          </div>
        </div>
        {}
        {scene.length>=2&&(<div style={{background:T.bg3,borderRadius:10,padding:"0.75rem 1rem",marginBottom:"0.85rem",borderLeft:`3px solid ${T.accent}`}}>
          <p style={{color:T.text3,fontSize:"0.68rem",letterSpacing:"0.12em",margin:"0 0 0.3rem",fontFamily:"monospace"}}>PROPUESTA NARRATIVA</p>
          <p style={{color:T.text,fontSize:"0.92rem",lineHeight:1.6,margin:0,fontStyle:"italic"}}>
            {scene[0]&&`${scene.find(s=>s.cat==="NOMBRE")?"":"Un/a "}${scene.find(s=>s.cat==="PROFESIÓN")?.word||scene.find(s=>s.cat==="NOMBRE")?.word||scene.find(s=>s.cat==="SUPERPODER")?.word||scene[0].word}`}
            {scene.find(s=>s.cat==="LUGAR")&&` en ${scene.find(s=>s.cat==="LUGAR").word}`}
            {scene.find(s=>s.cat==="EMOCIÓN")&&` que siente ${scene.find(s=>s.cat==="EMOCIÓN").word.toLowerCase()}`}
            {scene.find(s=>s.cat==="ACCIÓN")&&` mientras ${scene.find(s=>s.cat==="ACCIÓN").word.toLowerCase()}`}
            {scene.find(s=>s.cat==="ESTILO")&&` — estilo ${scene.find(s=>s.cat==="ESTILO").word}`}
            {scene.find(s=>s.cat==="FRASE")&&`. "${scene.find(s=>s.cat==="FRASE").word}"`}
            {scene.find(s=>s.cat==="DUDA")&&` E a gran pregunta: ${scene.find(s=>s.cat==="DUDA").word}`}
            {scene.find(s=>s.cat==="CONFESIÓN")&&` Confesión: "${scene.find(s=>s.cat==="CONFESIÓN").word}"`}
          </p>
        </div>)}
        {}
        <div style={{display:"grid",gap:"0.55rem"}}>
          {scene.map((item,i)=>(<div key={i} style={{display:"flex",gap:"0.65rem",alignItems:"center",background:frozenCats.includes(item.cat)?T.accent+"0d":T.bg3,border:`1px solid ${frozenCats.includes(item.cat)?T.accent+"44":T.border}`,borderRadius:10,padding:"0.55rem 0.75rem",transition:"all 0.2s"}}>
            <span style={{fontSize:"1rem",flexShrink:0}}>{CAT_ICONS[item.cat]||"◆"}</span>
            <div style={{flex:1,minWidth:0}}>
              <p style={{color:T.text3,fontSize:"0.65rem",letterSpacing:"0.12em",margin:"0 0 0.1rem",fontFamily:"monospace"}}>{item.cat}{item.isIdea?" 👥":""}</p>
              <p style={{color:T.text,fontSize:"0.95rem",fontWeight:700,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.word}</p>
            </div>
            <button onClick={()=>setFrozenCats(f=>f.includes(item.cat)?f.filter(x=>x!==item.cat):[...f,item.cat])} title={frozenCats.includes(item.cat)?"Descongelar":"Congelar este elemento"} style={{background:frozenCats.includes(item.cat)?T.accent+"22":"transparent",border:`1px solid ${frozenCats.includes(item.cat)?T.accent:T.border}`,color:frozenCats.includes(item.cat)?T.accent:T.text4,borderRadius:6,padding:"0.2rem 0.4rem",cursor:"pointer",fontSize:"0.75rem",flexShrink:0}}>{frozenCats.includes(item.cat)?"🔒":"🔓"}</button>
          </div>))}
        </div>
        {frozenCats.length>0&&<p style={{color:T.text4,fontSize:"0.72rem",marginTop:"0.5rem",textAlign:"center"}}>🔒 {frozenCats.length} elemento(s) congelado(s) — pulsa 🎲 para regenerar el resto</p>}
      </div>)}
      </div>}
    </div>)}

    {view==="cats"&&(<>
      {/* R10 · Mesma idea que a botonera de inicio: o icono é o que se
          recoñece de lonxe, e a reixa reparte o alto dispoñible en vez
          de deixar media pantalla baleira. */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${colsCat},minmax(0,1fr))`,gap:esMovil?"0.45rem":"0.6rem"}}>
        {CATS.map(cat=>{return(
          <button key={cat} onClick={()=>generate(cat)} style={{background:sel?.cat===cat?T.accent+"18":T.bg2,borderStyle:"solid",borderWidth:1.5,borderColor:sel?.cat===cat?T.accent:T.border,borderRadius:14,padding:esMovil?"0.6rem 0.35rem":"0.85rem 0.5rem",color:T.text,cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"0.4rem",height:altoCat,transition:"background 0.15s, border-color 0.15s"}}>
            <span style={{fontSize:szCat,lineHeight:1}}>{iconOf(cat)}</span>
            <span style={{fontWeight:700,fontSize:altoCat>110?"0.82rem":"0.72rem",letterSpacing:"-0.01em",lineHeight:1.15}}>{cat}</span>

            {(ESTIMULOS[cat]?.plus.length||0)>(ESTIMULOS[cat]?.simple.length||0)&&nivel==="simple"&&<span style={{color:T.accent,fontSize:"0.6rem"}}>⭐</span>}
            <span style={{color:T.text4,fontSize:"0.72rem"}}>{getList(cat).length}</span>
          </button>
        );})}
      </div>
      {sel&&!spotlight&&(<div style={{marginTop:"1.25rem",...S.panel,border:`1.5px solid ${T.accent}22`,textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"center",gap:"0.5rem",marginBottom:"0.4rem",alignItems:"center"}}>
          <p style={{color:T.accent,fontSize:"0.7rem",letterSpacing:"0.25em",margin:0}}>{sel.cat}</p>
          {sel.isIdea&&<span style={S.tag(T.ok)}>👥 GRUPO</span>}
        </div>
        <p style={{color:T.text,fontSize:"1.8rem",fontWeight:800,margin:"0 0 0.75rem",cursor:"pointer"}} onClick={()=>setSpotlight(sel)}>{sel.word}</p>
        <div style={{display:"flex",gap:"0.5rem",justifyContent:"center"}}>
          <button onClick={()=>setSpotlight(sel)} style={S.btn(T.bg3,T.text2)}>⛶ Pantalla completa</button>
          <button onClick={()=>saveFav(sel)} style={S.btn(T.bg3,T.text2)}>♡ Gardar</button>
        </div>
      </div>)}
    </>)}
  </div>);
}
