// ============================================================
// ModoShow.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useAuth, useTheme, useEstimulos, CAT_ICONS, FMT, pick, ls, trackGen, mkS, QRCode, FONT_UI, FONT_MONO } from './core.jsx';
import { PLAYLISTS_DEFAULT, EFECTOS_DEFAULT } from './datos.js';
import { getPlaylists, getEfectos, abrirSala, cerrarSala, getPropostas, subscribeToPropostas, trackGenSupa } from './db.js';

export function ModoShow({audio,onClose,onStimulus,rundown,setRundown}){
  const {T}=useTheme();const S=mkS(T);
  const {data:ESTIMULOS,cats:CATS_DB}=useEstimulos();
  const {logueado,pedirLogin}=useAuth();
  const CATS=CATS_DB.length?CATS_DB.map(c=>c.id):Object.keys(ESTIMULOS);
  const iconOf=id=>CATS_DB.find(c=>c.id===id)?.icona||CAT_ICONS[id]||"◆";

  const [nivel,setNivel]=useState("plus");
  const [estimulo,setEstimulo]=useState(null);
  const [panel,setPanel]=useState("rundown"); // rundown | qr

  // Timer
  const [seg,setSeg]=useState(180);
  const [restante,setRestante]=useState(180);
  const [corre,setCorre]=useState(false);
  const tRef=useRef(null);

  // Audio
  const [pistas,setPistas]=useState([]);
  const [playlists,setPlaylists]=useState(()=>ls.get("impro_playlists_v2",PLAYLISTS_DEFAULT));
  const [efectos,setEfectos]=useState(()=>ls.get("impro_efectos_v2",EFECTOS_DEFAULT));
  const pistaId=useRef(0);

  // QR
  const [salaCode,setSalaCode]=useState("");
  const [propostas,setPropostas]=useState([]);
  const unsubRef=useRef(null);

  useEffect(()=>{getPlaylists(PLAYLISTS_DEFAULT).then(setPlaylists);getEfectos(EFECTOS_DEFAULT).then(setEfectos);},[]);

  useEffect(()=>{
    if(corre&&restante>0){tRef.current=setInterval(()=>setRestante(r=>{
      if(r<=1){setCorre(false);audio.playBell?.();return 0;}
      if(r===31||r===11)audio.tone?.(660,0.12,"sine",0.25);
      return r-1;
    }),1000);}
    else clearInterval(tRef.current);
    return()=>clearInterval(tRef.current);
  },[corre,restante]);

  useEffect(()=>()=>{
    pistas.forEach(p=>{try{p.audioEl?.pause();}catch{}});
    if(unsubRef.current)unsubRef.current();
  },[]);

  const xerar=cat=>{
    const d=ESTIMULOS[cat]||{simple:[],plus:[]};
    const lista=nivel==="plus"&&d.plus.length?d.plus:d.simple;
    if(!lista.length)return;
    const raw=pick(lista);
    const word=raw.endsWith("👥")?raw.slice(0,-2):raw;
    setEstimulo({cat,word});onStimulus?.({word,category:cat});
    trackGen(cat);trackGenSupa(cat);
  };
  const xerarAleatorio=()=>CATS.length&&xerar(CATS[Math.floor(Math.random()*CATS.length)]);

  const addPista=(pl,idx)=>{
    const u=pl.urls[idx];if(!u?.url)return;
    const isYt=u.url.includes("youtube.com")||u.url.includes("youtu.be");
    const id=`ms_${pistaId.current++}`;
    const nova={id,label:`${pl.emoji} ${u.label||pl.nombre}`,url:u.url,vol:0.7,playing:true,isYt,color:pl.color,audioEl:null};
    if(!isYt){try{const a=new Audio(u.url);a.loop=true;a.volume=0.7;a.play();nova.audioEl=a;}catch{}}
    setPistas(p=>[...p,nova]);
  };
  const volPista=(id,v)=>setPistas(p=>p.map(x=>{if(x.id!==id)return x;if(x.audioEl){try{x.audioEl.volume=v;}catch{}}return{...x,vol:v};}));
  const togglePista=id=>setPistas(p=>p.map(x=>{if(x.id!==id)return x;if(x.audioEl){try{x.playing?x.audioEl.pause():x.audioEl.play();}catch{}}return{...x,playing:!x.playing};}));
  const quitarPista=id=>setPistas(p=>{const x=p.find(y=>y.id===id);if(x?.audioEl){try{x.audioEl.pause();}catch{}}return p.filter(y=>y.id!==id);});
  const pararTodo=()=>setPistas(p=>{p.forEach(x=>{try{x.audioEl?.pause();}catch{}});return[];});

  const efecto=ef=>{
    if(ef.url){try{new Audio(ef.url).play();}catch{}return;}
    switch(ef.id){
      case"aplausos":for(let i=0;i<25;i++)setTimeout(()=>audio.tone(200+Math.random()*600,0.12,"sawtooth",0.04),i*25);break;
      case"campana":audio.playBell();break;
      case"bien":[523,659,784,1047].forEach((f,i)=>audio.tone(f,0.18,"sine",0.3,i*0.07));break;
      case"buzzer":audio.tone(150,0.6,"sawtooth",0.5);break;
      case"risas":for(let i=0;i<10;i++)setTimeout(()=>audio.tone(300+Math.random()*200,0.1,"sine",0.15),i*80);break;
      case"drum":audio.tone(80,0.4,"sine",0.7);audio.tone(160,0.15,"sawtooth",0.3);break;
      case"fanfare":[523,659,784,1047,1319].forEach((f,i)=>audio.tone(f,0.3,"sawtooth",0.3,i*0.08));break;
      case"error":[300,200,150].forEach((f,i)=>audio.tone(f,0.25,"sawtooth",0.4,i*0.12));break;
      default:audio.tone(440,0.3);
    }
  };

  const abrir=async()=>{
    if(!logueado){pedirLogin();return;}
    const code=Math.random().toString(36).substring(2,6).toUpperCase();
    setSalaCode(code);setPropostas([]);
    await abrirSala(code);
    const prev=await getPropostas(code);setPropostas(prev);
    unsubRef.current=subscribeToPropostas(code,n=>setPropostas(p=>[...p,n]));
  };
  const pechar=async()=>{
    if(unsubRef.current){unsubRef.current();unsubRef.current=null;}
    await cerrarSala(salaCode,propostas);
    setSalaCode("");setPropostas([]);
  };

  const activa=rundown?.find(a=>a.activa);
  const seguinte=(()=>{const i=rundown?.findIndex(a=>a.activa)??-1;return rundown?.[i+1]||rundown?.find(a=>!a.hecho&&!a.activa);})();
  const avanzar=()=>{
    if(!rundown?.length)return;
    const i=rundown.findIndex(a=>a.activa);
    setRundown(rundown.map((a,k)=>k===i?{...a,activa:false,hecho:true}:k===i+1?{...a,activa:true}:a));
    setRestante(seg);setCorre(false);
  };
  const activar=id=>setRundown(rundown.map(a=>({...a,activa:a.id===id})));

  const urx=restante>0&&restante<10, avi=restante>0&&restante<30;
  const colT=urx?"#ff6e40":avi?"#ffd740":T.accent;

  return(<div style={{position:"fixed",inset:0,zIndex:1500,background:T.bg,display:"flex",flexDirection:"column",fontFamily:FONT_UI,overflow:"hidden"}}>

    {/* Cabeceira */}
    <div style={{background:T.bg2,borderBottom:`1px solid ${T.border}`,padding:"0.5rem 0.9rem",display:"flex",alignItems:"center",gap:"0.75rem",flexShrink:0}}>
      <span style={{fontWeight:900,fontSize:"0.9rem",color:T.text}}>🎭 Modo show</span>
      {activa&&<span style={{color:"#40c4ff",fontWeight:700,fontSize:"0.85rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>▶ {activa.nombre}</span>}
      {!activa&&<span style={{flex:1}}/>}
      <button onClick={onClose} style={{...S.btn(T.bg3,T.text3),fontSize:"0.78rem",padding:"0.3rem 0.7rem"}}>✕ Saír</button>
    </div>

    <div style={{flex:1,display:"grid",gridTemplateColumns:"minmax(0,1.6fr) minmax(0,1fr)",gap:"0.6rem",padding:"0.6rem",overflow:"hidden"}}>

      {/* ESQUERDA */}
      <div style={{display:"flex",flexDirection:"column",gap:"0.6rem",minHeight:0,overflowY:"auto"}}>

        {/* Estímulo */}
        <div style={{background:T.bg2,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"0.9rem",textAlign:"center"}}>
          {estimulo?(<>
            <p style={{color:T.accent,fontSize:"0.68rem",letterSpacing:"0.2em",margin:"0 0 0.3rem",fontFamily:FONT_MONO,fontVariantNumeric:"tabular-nums"}}>{iconOf(estimulo.cat)} {estimulo.cat}</p>
            <p style={{color:T.text,fontWeight:900,fontSize:"clamp(1.3rem,3.4vw,2.1rem)",margin:0,lineHeight:1.15}}>{estimulo.word}</p>
          </>):(<p style={{color:T.text4,fontSize:"0.85rem",margin:"0.8rem 0"}}>Xera un estímulo para a escena</p>)}
        </div>

        {/* Categorías */}
        <div style={{background:T.bg2,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"0.7rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"}}>
            <button onClick={xerarAleatorio} style={{...S.btn(T.accent),fontSize:"0.78rem",padding:"0.3rem 0.75rem"}}>🎲 Aleatorio</button>
            <div style={{display:"flex",background:T.bg3,borderRadius:8,padding:2,gap:2}}>
              {[["simple","◆"],["plus","⭐"]].map(([v,l])=>
                <button key={v} onClick={()=>setNivel(v)} style={{...S.btn(nivel===v?T.accent:"transparent",nivel===v?"#fff":T.text3),borderRadius:6,padding:"0.2rem 0.5rem",fontSize:"0.75rem"}}>{l}</button>)}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(78px,1fr))",gap:"0.3rem"}}>
            {CATS.map(cat=>(<button key={cat} onClick={()=>xerar(cat)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,padding:"0.4rem 0.2rem",cursor:"pointer",color:T.text2,fontSize:"0.68rem",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.1rem"}}>
              <span style={{fontSize:"0.95rem"}}>{iconOf(cat)}</span>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%"}}>{cat}</span>
            </button>))}
          </div>
        </div>

        {/* Timer */}
        <div style={{background:T.bg2,border:`1.5px solid ${urx?"#ff6e4055":T.border}`,borderRadius:12,padding:"0.7rem",display:"flex",alignItems:"center",gap:"0.85rem",flexWrap:"wrap"}}>
          <div style={{fontFamily:FONT_MONO,fontVariantNumeric:"tabular-nums",fontWeight:900,fontSize:"2.1rem",color:colT,lineHeight:1,minWidth:"3.6ch",textShadow:urx?`0 0 20px ${colT}`:"none",animation:urx&&corre?"urgentPulse 0.5s ease infinite alternate":"none"}}>{FMT(restante)}</div>
          <button onClick={()=>setCorre(v=>!v)} style={{...S.btn(corre?"#ff6e40":"#69f0ae","#000"),padding:"0.4rem 0.9rem"}}>{corre?"⏸":"▶"}</button>
          <button onClick={()=>{setRestante(seg);setCorre(false);}} style={{...S.btn(T.bg3,T.text3),padding:"0.4rem 0.7rem",fontSize:"0.78rem"}}>↺</button>
          <div style={{display:"flex",gap:"0.25rem",flexWrap:"wrap"}}>
            {[60,120,180,300].map(s=>(<button key={s} onClick={()=>{setSeg(s);setRestante(s);setCorre(false);}} style={{background:seg===s?T.accent+"22":T.bg3,border:`1px solid ${seg===s?T.accent:T.border}`,color:seg===s?T.accent:T.text3,borderRadius:6,padding:"0.2rem 0.45rem",fontSize:"0.72rem",cursor:"pointer",fontFamily:"inherit"}}>{s/60}′</button>))}
          </div>
        </div>

        {/* Efectos */}
        <div style={{background:T.bg2,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"0.7rem"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(66px,1fr))",gap:"0.35rem"}}>
            {efectos.map(ef=>(<button key={ef.id} onClick={()=>efecto(ef)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:9,padding:"0.55rem 0.2rem",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.15rem"}}>
              <span style={{fontSize:"1.3rem",lineHeight:1}}>{ef.emoji}</span>
              <span style={{fontSize:"0.64rem",color:T.text3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%"}}>{ef.nombre}</span>
            </button>))}
          </div>
        </div>

        {/* Audio */}
        <div style={{background:T.bg2,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"0.7rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"}}>
            <span style={{color:T.text3,fontSize:"0.7rem",letterSpacing:"0.1em",fontFamily:FONT_MONO,fontVariantNumeric:"tabular-nums"}}>AUDIO</span>
            {pistas.length>0&&<button onClick={pararTodo} style={{...S.btn(T.bg3,"#ff6e40"),fontSize:"0.72rem",padding:"0.2rem 0.5rem"}}>⏹ Todas</button>}
          </div>
          {pistas.map(p=>(<div key={p.id} style={{background:T.bg3,borderRadius:8,padding:"0.45rem 0.6rem",marginBottom:"0.35rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.45rem"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:p.playing?p.color:"#444",flexShrink:0,boxShadow:p.playing?`0 0 6px ${p.color}`:"none"}}/>
              <span style={{flex:1,color:T.text2,fontSize:"0.76rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.label}</span>
              {!p.isYt&&<input type="range" min={0} max={1} step={0.05} value={p.vol} onChange={e=>volPista(p.id,Number(e.target.value))} style={{width:64,accentColor:p.color}}/>}
              <button onClick={()=>togglePista(p.id)} style={{background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:"0.78rem"}}>{p.playing?"⏸":"▶"}</button>
              <button onClick={()=>quitarPista(p.id)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer"}}>×</button>
            </div>
            {p.isYt&&<iframe src={p.url} width="100%" height="40" frameBorder="0" allow="autoplay; encrypted-media" style={{borderRadius:5,marginTop:"0.3rem",display:"block"}} title={p.label}/>}
          </div>))}
          <div style={{display:"flex",gap:"0.25rem",flexWrap:"wrap",marginTop:pistas.length?"0.4rem":0}}>
            {playlists.map(pl=>pl.urls.map((u,idx)=>u.url&&(
              <button key={pl.id+idx} onClick={()=>addPista(pl,idx)} style={{background:pl.color+"1a",border:`1px solid ${pl.color}44`,color:pl.color,borderRadius:6,padding:"0.2rem 0.5rem",fontSize:"0.68rem",cursor:"pointer",fontFamily:"inherit"}}>+ {pl.emoji} {u.label||pl.nombre}</button>
            )))}
          </div>
        </div>
      </div>

      {/* DEREITA */}
      <div style={{display:"flex",flexDirection:"column",gap:"0.6rem",minHeight:0}}>
        <div style={{display:"flex",gap:2,background:T.bg3,borderRadius:9,padding:3,flexShrink:0}}>
          {[["rundown","📋 Rundown"],["qr",`📱 Público${propostas.length?` (${propostas.length})`:""}`]].map(([id,l])=>
            <button key={id} onClick={()=>setPanel(id)} style={{...S.btn(panel===id?T.bg2:"transparent",panel===id?T.text:T.text3),flex:1,borderRadius:7,fontSize:"0.76rem",padding:"0.32rem"}}>{l}</button>)}
        </div>

        {panel==="rundown"&&<div style={{background:T.bg2,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"0.7rem",flex:1,overflowY:"auto",minHeight:0}}>
          {seguinte&&<button onClick={avanzar} style={{...S.btn("#40c4ff","#000"),width:"100%",marginBottom:"0.6rem",padding:"0.5rem"}}>⏭ Seguinte: {seguinte.nombre}</button>}
          {(!rundown||rundown.length===0)&&<p style={{color:T.text4,fontSize:"0.8rem",textAlign:"center",padding:"1.5rem 0"}}>Crea o rundown en Show → Rundown</p>}
          <div style={{display:"flex",flexDirection:"column",gap:"0.3rem"}}>
            {(rundown||[]).map((a,i)=>(<button key={a.id} onClick={()=>activar(a.id)} style={{background:a.activa?"#40c4ff18":T.bg3,border:`1px solid ${a.activa?"#40c4ff":T.border}`,borderRadius:8,padding:"0.45rem 0.6rem",cursor:"pointer",textAlign:"left",display:"flex",gap:"0.45rem",alignItems:"center",fontFamily:"inherit"}}>
              <span style={{color:T.text4,fontSize:"0.7rem",fontFamily:FONT_MONO,fontVariantNumeric:"tabular-nums",flexShrink:0}}>{i+1}</span>
              <span style={{flex:1,color:a.hecho?T.text4:a.activa?"#40c4ff":T.text2,fontSize:"0.8rem",textDecoration:a.hecho?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.nombre}</span>
              {a.activa&&<span style={{color:"#40c4ff",fontSize:"0.7rem"}}>▶</span>}
            </button>))}
          </div>
        </div>}

        {panel==="qr"&&<div style={{background:T.bg2,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"0.7rem",flex:1,overflowY:"auto",minHeight:0}}>
          {!salaCode?(<div style={{textAlign:"center",padding:"1.2rem 0"}}>
            <p style={{fontSize:"2rem",margin:"0 0 0.5rem"}}>📱</p>
            <p style={{color:T.text3,fontSize:"0.8rem",marginBottom:"0.85rem",lineHeight:1.5}}>Abre unha sala para recibir propostas do público en directo.</p>
            <button onClick={abrir} style={{...S.btn(T.accent),padding:"0.45rem 1.1rem"}}>Abrir sala</button>
          </div>):(<>
            <div style={{textAlign:"center",marginBottom:"0.7rem"}}>
              <p style={{color:T.accent,fontFamily:FONT_MONO,fontVariantNumeric:"tabular-nums",fontWeight:900,fontSize:"1.5rem",letterSpacing:"0.2em",margin:"0 0 0.4rem"}}>{salaCode}</p>
              <QRCode value={`${window.location.href.split("?")[0]}?sala=${salaCode}`} size={110}/>
              <button onClick={pechar} style={{...S.btn(T.bg3,"#ff6e40"),fontSize:"0.74rem",padding:"0.25rem 0.7rem",marginTop:"0.5rem"}}>⏹ Pechar</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.3rem"}}>
              {[...propostas].reverse().map((p,i)=>(<button key={i} onClick={()=>setEstimulo({cat:p.cat||"PÚBLICO",word:p.texto})} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,padding:"0.4rem 0.6rem",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
                <span style={{color:T.text,fontSize:"0.79rem"}}>{p.texto}</span>
              </button>))}
              {propostas.length===0&&<p style={{color:T.text4,fontSize:"0.78rem",textAlign:"center",padding:"0.8rem 0"}}>Agardando propostas...</p>}
            </div>
          </>)}
        </div>}
      </div>
    </div>
  </div>);
}
