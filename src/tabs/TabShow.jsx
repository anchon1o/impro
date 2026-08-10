// ============================================================
// tabs/TabShow.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { t, useTheme, UID, ls, mkS } from '../core.jsx';
import { PLAYLISTS_DEFAULT, EFECTOS_DEFAULT } from '../datos.js';
import { getPlaylists, savePlaylists as savePlaylistsDB, getEfectos, saveEfectos as saveEfectosDB } from '../db.js';

export const SHOW_NAMES={
  pre:["A Gran","O Misterio de","Noite de","A Última","Sen","Entre","Máis Alá de","La Gran","El Misterio de","Noche de","La Última","Sin","Entre","Más Allá de"],
  sub:["Lobos Educados","Martes Tráxico","Sombras Bailarinas","Verdades Pequenas","Mentiras Enormes","Heroes Accidentais","Lobos Educados","Martes Trágico","Sombras Bailarinas","Verdades Pequeñas","Mentiras Enormes","Dragones Perezosos","Héroes Accidentales"],
  con:["e Medio","pero Non Tanto","sen Consecuencias","con Sorpresas","á Deriva","y Medio","pero No Tanto","sin Consecuencias","con Sorpresas","a la Deriva"],
  adj:["Épico","Inesperado","Salvaxe","Tenro","Absurdo","Glorioso","Épico","Inesperado","Salvaje","Tierno","Absurdo","Glorioso"],
};

export const generateShowName=()=>{
  const r=a=>a[Math.floor(Math.random()*a.length)];
  const t=Math.floor(Math.random()*4);
  if(t===0)return`${r(SHOW_NAMES.pre)} ${r(SHOW_NAMES.sub)}`;
  if(t===1)return`${r(SHOW_NAMES.sub)} ${r(SHOW_NAMES.con)}`;
  if(t===2)return`${r(SHOW_NAMES.sub)}: ${r(SHOW_NAMES.adj)}`;
  return`${r(SHOW_NAMES.pre)} ${r(SHOW_NAMES.sub)} ${r(SHOW_NAMES.con)}`;
};

export function ShowNameWidget({T,S}){
  const [name,setName]=useState(()=>generateShowName());
  const [saved,setSaved]=useState([]);
  return(<div>
    <div style={{background:T.bg3,borderRadius:12,padding:"0.85rem 1rem",marginBottom:"0.65rem",textAlign:"center",border:`1px solid ${T.accent}33`}}>
      <p style={{color:T.accent,fontFamily:"monospace",fontSize:"0.65rem",letterSpacing:"0.2em",margin:"0 0 0.3rem",textTransform:"uppercase"}}>Nome xerado</p>
      <p style={{color:T.text,fontSize:"clamp(0.9rem,3vw,1.3rem)",fontWeight:900,margin:0,lineHeight:1.2}}>{name}</p>
    </div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:saved.length?"0.65rem":"0"}}>
      <button onClick={()=>setName(generateShowName())} style={{...S.btn(T.accent),flex:1}}>🎲 Outro nome</button>
      <button onClick={()=>setSaved(s=>[name,...s].slice(0,5))} style={S.btn(T.bg3,T.text2)}>♡</button>
    </div>
    {saved.length>0&&<div style={{display:"flex",flexDirection:"column",gap:"0.25rem"}}>
      {saved.map((n,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg3,borderRadius:7,padding:"0.3rem 0.65rem"}}>
        <span style={{color:T.text2,fontSize:"0.82rem"}}>{n}</span>
        <button onClick={()=>setSaved(s=>s.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.82rem"}}>×</button>
      </div>))}
    </div>}
  </div>);
}

export const TEAM_COLS=["#e040fb","#40c4ff","#69f0ae","#ffd740","#ff6e40","#f48fb1"];

export function TeamSorter({T,S}){
  const [mode,setMode]=useState("parejas");
  const [names,setNames]=useState("");
  const [numTeams,setNumTeams]=useState(2);
  const [result,setResult]=useState(null);
  const [roles,setRoles]=useState("Director\nActor 1\nActor 2\nMúsico");
  const shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const getNames=()=>names.split(/[,\n]/).map(n=>n.trim()).filter(Boolean);
  const sort=()=>{
    const people=shuffle(getNames());if(!people.length)return;let res;
    if(mode==="parejas"){const pairs=[];for(let i=0;i<people.length;i+=2)pairs.push(i+1<people.length?[people[i],people[i+1]]:[people[i],"(sin pareja)"]);res={type:"parejas",data:pairs};}
    else if(mode==="equipos"){const teams=Array.from({length:numTeams},()=>[]);people.forEach((p,i)=>teams[i%numTeams].push(p));res={type:"equipos",data:teams};}
    else{const rl=roles.split('\n').map(r=>r.trim()).filter(Boolean);res={type:"roles",data:people.map((p,i)=>({person:p,role:rl[i%rl.length]}))};}
    setResult(res);
  };
  return(<div>
    <div style={{display:"flex",background:T.bg3,borderRadius:10,padding:3,gap:2,marginBottom:"0.75rem"}}>
      {[["parejas","👫 Parellas"],["equipos","🏆 Equipos"],["roles","🎭 Roles"]].map(([v,l])=>(
        <button key={v} onClick={()=>{setMode(v);setResult(null);}} style={{...S.btn(mode===v?T.bg2:"transparent",mode===v?T.text:T.text3),borderRadius:8,padding:"0.3rem 0.55rem",fontSize:"0.78rem",flex:1}}>{l}</button>
      ))}
    </div>
    <textarea value={names} onChange={e=>setNames(e.target.value)} placeholder={"Ana\nBrais\nCarme..."} style={{...S.input,height:80,resize:"none",marginBottom:"0.5rem"}}/>
    {mode==="equipos"&&<div style={{display:"flex",alignItems:"center",gap:"0.65rem",marginBottom:"0.5rem"}}><span style={{color:T.text2,fontSize:"0.82rem"}}>Equipos:</span><input type="number" min={2} max={8} value={numTeams} onChange={e=>setNumTeams(Math.max(2,Math.min(8,Number(e.target.value))))} style={{...S.input,width:55}}/></div>}
    {mode==="roles"&&<textarea value={roles} onChange={e=>setRoles(e.target.value)} style={{...S.input,height:60,resize:"none",marginBottom:"0.5rem"}}/>}
    <button onClick={sort} disabled={!getNames().length} style={{...S.btn(T.accent),width:"100%",opacity:!getNames().length?0.4:1,marginBottom:result?"0.75rem":"0"}}>🎲 Sortear</button>
    {result&&(<div style={{...S.panel,border:`1.5px solid ${T.accent}33`,animation:"fadeIn 0.3s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.65rem"}}><span style={{color:T.accent,fontSize:"0.72rem",fontFamily:"monospace"}}>RESULTADO</span><button onClick={sort} style={S.btn(T.bg3,T.text2)}>🎲</button></div>
      {result.type==="parejas"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0.4rem"}}>{result.data.map((pair,i)=>(<div key={i} style={{background:T.bg3,borderRadius:9,padding:"0.55rem 0.75rem",borderLeft:`3px solid ${TEAM_COLS[i%TEAM_COLS.length]}`}}><div style={{color:T.text3,fontSize:"0.65rem",fontFamily:"monospace",marginBottom:"0.2rem"}}>PARELLA {i+1}</div>{pair.map((p,j)=><div key={j} style={{color:T.text,fontSize:"0.85rem"}}>👤 {p}</div>)}</div>))}</div>}
      {result.type==="equipos"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:"0.4rem"}}>{result.data.map((team,i)=>(<div key={i} style={{background:T.bg3,borderRadius:9,padding:"0.55rem 0.75rem",borderLeft:`3px solid ${TEAM_COLS[i%TEAM_COLS.length]}`}}><div style={{color:TEAM_COLS[i%TEAM_COLS.length],fontSize:"0.75rem",fontWeight:700,marginBottom:"0.3rem"}}>Equipo {i+1}</div>{team.map((p,j)=><div key={j} style={{color:T.text,fontSize:"0.85rem"}}>👤 {p}</div>)}</div>))}</div>}
      {result.type==="roles"&&<div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>{result.data.map((item,i)=>(<div key={i} style={{display:"flex",gap:"0.65rem",alignItems:"center",background:T.bg3,borderRadius:9,padding:"0.45rem 0.75rem"}}><span style={{background:TEAM_COLS[i%TEAM_COLS.length]+"22",color:TEAM_COLS[i%TEAM_COLS.length],borderRadius:5,padding:"0.1rem 0.45rem",fontSize:"0.72rem",fontWeight:700,flexShrink:0}}>{item.role}</span><span style={{color:T.text,fontSize:"0.85rem"}}>👤 {item.person}</span></div>))}</div>}
    </div>)}
  </div>);
}

export const COMPASES=["2/4","3/4","4/4","5/4","6/8","7/8"];

export const beatsOf=c=>{if(c==="2/4")return 2;if(c==="3/4")return 3;if(c==="4/4")return 4;if(c==="5/4")return 5;if(c==="6/8")return 6;if(c==="7/8")return 7;return 4;};

export function TabShow({audio,onRundownChange}){
  const {T}=useTheme();const S=mkS(T);

  // ── RUNDOWN ──
  const [rundown,setRundown]=useState([]);
  const [newActName,setNewActName]=useState("");
  const [newActFmt,setNewActFmt]=useState("");

  // ── PISTAS DE AUDIO (múltiples simultáneas) ──
  const [playlists,setPlaylists]=useState(()=>ls.get("impro_playlists_v2",PLAYLISTS_DEFAULT));
  const [pistas,setPistas]=useState([]); // [{id, pid, idx, label, url, vol, playing, audioEl}]
  const pistaId=useRef(0);
  useEffect(()=>{getPlaylists(PLAYLISTS_DEFAULT).then(setPlaylists);},[]);

  // ── EFECTOS ──
  const [efectos,setEfectos]=useState(()=>ls.get("impro_efectos_v2",EFECTOS_DEFAULT));
  useEffect(()=>{getEfectos(EFECTOS_DEFAULT).then(setEfectos);},[]);

  // ── METRÓNOMO ──
  const [bpm,setBpm]=useState(100);
  const [beats,setBeats]=useState(4);
  const [metroOn,setMetroOn]=useState(false);
  const [metroFlash,setMetroFlash]=useState(false);
  const [beatCount,setBeatCount]=useState(0);
  const metroRef=useRef(null);const beatRef=useRef(0);
  const PRESETS_BPM=[60,80,100,120,140,160];

  // ── SORTEO ──
  const [num,setNum]=useState(null);
  const [letter,setLetter]=useState(null);
  const LETRAS="ABCDEFGHIJLMNOPRSTV".split("");

  // ── PESTANA ACTIVA ──
  const [showTab,setShowTab]=useState("audio");

  useEffect(()=>{
    if(metroOn){const ms=(60/bpm)*1000;metroRef.current=setInterval(()=>{audio.metroBeat(beatRef.current,beats);setMetroFlash(true);setTimeout(()=>setMetroFlash(false),80);setBeatCount(c=>c+1);beatRef.current=(beatRef.current+1)%beats;},ms);}
    else clearInterval(metroRef.current);
    return()=>clearInterval(metroRef.current);
  },[metroOn,bpm,beats]);

  // Limpar audios ao desmontar
  useEffect(()=>()=>{pistas.forEach(p=>{try{p.audioEl?.pause();}catch{}});},[]);

  const stopMetro=()=>{setMetroOn(false);clearInterval(metroRef.current);beatRef.current=0;setBeatCount(0);};
  const savePlaylists=u=>{setPlaylists(u);savePlaylistsDB(u);};
  const saveEfectos=u=>{setEfectos(u);saveEfectosDB(u);};

  // Engadir pista
  const addPista=(pl,idx)=>{
    const urlObj=pl.urls[idx];if(!urlObj?.url)return;
    const id=`pista_${pistaId.current++}`;
    const isYt=urlObj.url.includes("youtube.com")||urlObj.url.includes("youtu.be");
    const newP={id,pid:pl.id,idx,label:`${pl.emoji} ${urlObj.label||pl.nombre}`,url:urlObj.url,vol:0.8,playing:true,isYt,color:pl.color,audioEl:null};
    if(!isYt){
      try{const a=new Audio(urlObj.url);a.loop=true;a.volume=0.8;a.play();newP.audioEl=a;}catch{}
    }
    setPistas(prev=>[...prev,newP]);
  };

  // Cambiar volume dunha pista
  const setPistaVol=(id,vol)=>{
    setPistas(prev=>prev.map(p=>{
      if(p.id!==id)return p;
      if(p.audioEl){try{p.audioEl.volume=vol;}catch{}}
      return {...p,vol};
    }));
  };

  // Pausar/resumir pista
  const togglePista=(id)=>{
    setPistas(prev=>prev.map(p=>{
      if(p.id!==id)return p;
      if(p.audioEl){try{p.playing?p.audioEl.pause():p.audioEl.play();}catch{}}
      return{...p,playing:!p.playing};
    }));
  };

  // Eliminar pista
  const removePista=(id)=>{
    setPistas(prev=>{
      const p=prev.find(x=>x.id===id);
      if(p?.audioEl){try{p.audioEl.pause();}catch{}}
      return prev.filter(x=>x.id!==id);
    });
  };

  // Efecto de son
  const playEfecto=ef=>{
    if(ef.url){try{const a=new Audio(ef.url);a.play();}catch{}}
    else{switch(ef.id){
      case"aplausos":for(let i=0;i<25;i++)setTimeout(()=>audio.tone(200+Math.random()*600,0.12,"sawtooth",0.04),i*25);break;
      case"campana":audio.playBell();break;
      case"bien":[523,659,784,1047].forEach((f,i)=>audio.tone(f,0.18,"sine",0.3,i*0.07));break;
      case"buzzer":audio.tone(150,0.6,"sawtooth",0.5);break;
      case"risas":for(let i=0;i<10;i++)setTimeout(()=>audio.tone(300+Math.random()*200,0.1,"sine",0.15),i*80);break;
      case"drum":audio.tone(80,0.4,"sine",0.7);audio.tone(160,0.15,"sawtooth",0.3);break;
      case"fanfare":[523,659,784,1047,1319].forEach((f,i)=>audio.tone(f,0.3,"sawtooth",0.3,i*0.08));break;
      case"error":[300,200,150].forEach((f,i)=>audio.tone(f,0.25,"sawtooth",0.4,i*0.12));break;
      default:audio.tone(440,0.3);
    }}
  };

  // Rundown
  const addAct=()=>{if(!newActName.trim())return;setRundown(r=>{const u=[...r,{id:UID(),nombre:newActName,formato:newActFmt,hecho:false,activa:false}];onRundownChange&&onRundownChange(u);return u;});setNewActName("");setNewActFmt("");};
  const toggleAct=id=>setRundown(r=>r.map(a=>a.id===id?{...a,hecho:!a.hecho}:a));
  const setActiva=id=>setRundown(r=>r.map(a=>({...a,activa:a.id===id&&!a.activa})));
  const removeAct=id=>setRundown(r=>r.filter(a=>a.id!==id));
  const moveAct=(id,dir)=>{const i=rundown.findIndex(a=>a.id===id);if(i<0)return;const n=[...rundown];const j=i+dir;if(j<0||j>=n.length)return;[n[i],n[j]]=[n[j],n[i]];setRundown(n);};

  const SHOW_TABS=[["audio","🎵 Audio"],["efectos","🔊 Efectos"],["metro","🥁 Metro"],["rundown","📋 Rundown"],["sorteo","🎲 Sorteo"]];

  return(<div style={{display:"flex",flexDirection:"column",gap:0}}>

    {/* Pestanas internas */}
    <div style={{display:"flex",gap:0,marginBottom:"1rem",background:T.bg3,borderRadius:12,padding:3,overflowX:"auto"}}>
      {SHOW_TABS.map(([id,label])=><button key={id} onClick={()=>setShowTab(id)} style={{...S.btn(showTab===id?T.bg2:"transparent",showTab===id?T.text:T.text3),borderRadius:9,padding:"0.4rem 0.75rem",fontSize:"0.8rem",fontWeight:showTab===id?700:400,whiteSpace:"nowrap",flex:1,boxShadow:showTab===id?"0 1px 4px rgba(0,0,0,0.2)":"none"}}>{label}</button>)}
    </div>

    {/* ── AUDIO: PISTAS ACTIVAS + BIBLIOTECA ── */}
    {showTab==="audio"&&<div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>

      {/* Pistas activas */}
      {pistas.length>0&&<div style={S.panel}>
        <p style={S.ptitle(T.accent)}>Pistas activas ({pistas.length})</p>
        <div style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
          {pistas.map(p=>(
            <div key={p.id} style={{background:T.bg3,borderRadius:11,padding:"0.7rem 0.9rem",border:`1.5px solid ${p.playing?p.color+"66":T.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.6rem",marginBottom:p.isYt?"0.5rem":"0.4rem"}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:p.playing?p.color:"#444",flexShrink:0,boxShadow:p.playing?`0 0 8px ${p.color}`:"none",transition:"all 0.3s"}}/>
                <span style={{flex:1,color:T.text,fontSize:"0.88rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.label}</span>
                <button onClick={()=>togglePista(p.id)} style={{...S.btn(p.playing?"#ff6e40":T.accent,"#000"),padding:"0.25rem 0.6rem",fontSize:"0.78rem"}}>{p.playing?"⏸":"▶"}</button>
                <button onClick={()=>removePista(p.id)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"1rem"}}>×</button>
              </div>
              {!p.isYt&&<div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <span style={{color:T.text4,fontSize:"0.7rem"}}>🔈</span>
                <input type="range" min={0} max={1} step={0.05} value={p.vol} onChange={e=>setPistaVol(p.id,Number(e.target.value))} style={{flex:1,accentColor:p.color,height:3}}/>
                <span style={{color:T.text4,fontSize:"0.7rem"}}>🔊</span>
              </div>}
              {p.isYt&&<iframe src={p.url} width="100%" height="60" frameBorder="0" allow="autoplay; encrypted-media" style={{borderRadius:7,display:"block"}} title={p.label}/>}
            </div>
          ))}
        </div>
        <button onClick={()=>setPistas(prev=>{prev.forEach(p=>{try{p.audioEl?.pause();}catch{}});return[];})} style={{...S.btn(T.bg3,"#ff6e40"),width:"100%",marginTop:"0.5rem",fontSize:"0.8rem"}}>⏹ Parar todas</button>
      </div>}

      {/* Biblioteca de playlists */}
      <div style={S.panel}>
        <p style={S.ptitle(T.accent)}>Biblioteca de música</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"0.5rem"}}>
          {playlists.map(pl=>(
            <div key={pl.id} style={{background:T.bg3,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"0.6rem 0.75rem"}}>
              <div style={{fontSize:"1.2rem",marginBottom:"0.15rem"}}>{pl.emoji}</div>
              <div style={{fontWeight:700,fontSize:"0.78rem",color:pl.color,marginBottom:"0.4rem"}}>{pl.nombre}</div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.25rem"}}>
                {pl.urls.map((u,idx)=>u.url&&(
                  <button key={idx} onClick={()=>addPista(pl,idx)} style={{background:pl.color+"22",border:`1px solid ${pl.color}44`,color:pl.color,borderRadius:6,padding:"0.2rem 0.45rem",fontSize:"0.7rem",cursor:"pointer",fontFamily:"inherit",textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>+ {u.label||"Reproducir"}</button>
                ))}
                {pl.urls.every(u=>!u.url)&&<span style={{color:T.text4,fontSize:"0.7rem"}}>Sen URLs</span>}
              </div>
            </div>
          ))}
        </div>
        <details style={{marginTop:"0.75rem"}}>
          <summary style={{color:T.text3,fontSize:"0.78rem",cursor:"pointer",padding:"0.3rem 0"}}>✏️ Editar playlists</summary>
          <div style={{marginTop:"0.65rem",borderTop:`1px solid ${T.border}`,paddingTop:"0.65rem"}}>
            <p style={{color:T.text4,fontSize:"0.73rem",marginBottom:"0.6rem"}}>YouTube: usa URL embed (youtube.com/embed/ID?autoplay=1). MP3: URL directa a .mp3 público.</p>
            {playlists.map(pl=>(
              <div key={pl.id} style={{background:T.bg3,borderRadius:9,padding:"0.6rem 0.85rem",marginBottom:"0.5rem"}}>
                <div style={{color:pl.color,fontWeight:700,fontSize:"0.82rem",marginBottom:"0.4rem"}}>{pl.emoji} {pl.nombre}</div>
                {pl.urls.map((u,idx)=>(
                  <div key={idx} style={{display:"flex",gap:"0.35rem",marginBottom:"0.3rem",flexWrap:"wrap"}}>
                    <input value={u.label} onChange={e=>{const np=[...pl.urls];np[idx]={...np[idx],label:e.target.value};savePlaylists(playlists.map(x=>x.id===pl.id?{...x,urls:np}:x));}} style={{...S.input,flex:"0 0 80px",width:"auto",fontSize:"0.76rem"}} placeholder="Nome"/>
                    <input value={u.url} onChange={e=>{const np=[...pl.urls];np[idx]={...np[idx],url:e.target.value};savePlaylists(playlists.map(x=>x.id===pl.id?{...x,urls:np}:x));}} placeholder="URL..." style={{...S.input,flex:1,fontSize:"0.74rem"}}/>
                    <button onClick={()=>{const np=pl.urls.filter((_,j)=>j!==idx);savePlaylists(playlists.map(x=>x.id===pl.id?{...x,urls:np}:x));}} style={{background:"none",border:"none",color:T.text4,cursor:"pointer"}}>×</button>
                  </div>
                ))}
                <button onClick={()=>savePlaylists(playlists.map(x=>x.id===pl.id?{...x,urls:[...x.urls,{label:"",url:""}]}:x))} style={{...S.btn(T.bg4,T.text3),fontSize:"0.72rem",marginTop:"0.25rem"}}>+ URL</button>
              </div>
            ))}
            <button onClick={()=>savePlaylists(PLAYLISTS_DEFAULT)} style={{...S.btn(T.bg3,T.text4),fontSize:"0.73rem"}}>↺ Restaurar</button>
          </div>
        </details>
      </div>
    </div>}

    {/* ── EFECTOS ── */}
    {showTab==="efectos"&&<div style={S.panel}>
      <p style={S.ptitle(T.accent)}>Efectos de son</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:"0.55rem",marginBottom:"1rem"}}>
        {efectos.map(ef=>(
          <button key={ef.id} onClick={()=>playEfecto(ef)} style={{background:T.bg3,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"0.9rem 0.4rem",color:T.text,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.35rem",transition:"transform 0.1s",active:{transform:"scale(0.95)"}}}>
            <span style={{fontSize:"1.8rem",lineHeight:1}}>{ef.emoji}</span>
            <span style={{fontSize:"0.76rem",fontWeight:600,color:T.text2,textAlign:"center"}}>{ef.nombre}</span>
            {ef.url&&<span style={{fontSize:"0.6rem",color:"#69f0ae"}}>MP3</span>}
          </button>
        ))}
      </div>
      <details>
        <summary style={{color:T.text3,fontSize:"0.78rem",cursor:"pointer",padding:"0.3rem 0"}}>✏️ Editar efectos</summary>
        <div style={{marginTop:"0.65rem",borderTop:`1px solid ${T.border}`,paddingTop:"0.65rem"}}>
          <p style={{color:T.text4,fontSize:"0.73rem",marginBottom:"0.6rem"}}>URL baleira = síntese de audio. Con URL MP3 soa o teu arquivo.</p>
          {efectos.map((ef,i)=>(
            <div key={ef.id} style={{display:"flex",gap:"0.35rem",marginBottom:"0.4rem",alignItems:"center",flexWrap:"wrap"}}>
              <input value={ef.emoji} onChange={e=>{const u=[...efectos];u[i]={...u[i],emoji:e.target.value};saveEfectos(u);}} style={{...S.input,width:44,textAlign:"center",fontSize:"1.1rem"}}/>
              <input value={ef.nombre} onChange={e=>{const u=[...efectos];u[i]={...u[i],nombre:e.target.value};saveEfectos(u);}} style={{...S.input,flex:"0 0 90px",width:"auto",fontSize:"0.8rem"}}/>
              <input value={ef.url} onChange={e=>{const u=[...efectos];u[i]={...u[i],url:e.target.value};saveEfectos(u);}} placeholder="URL MP3..." style={{...S.input,flex:1,fontSize:"0.76rem"}}/>
              <button onClick={()=>saveEfectos(efectos.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.9rem"}}>×</button>
            </div>
          ))}
          <div style={{display:"flex",gap:"0.4rem",marginTop:"0.5rem"}}>
            <button onClick={()=>saveEfectos([...efectos,{id:UID(),nombre:"Nuevo",emoji:"🎵",url:""}])} style={S.btn(T.bg3,T.text2)}>+ Engadir</button>
            <button onClick={()=>saveEfectos(EFECTOS_DEFAULT)} style={{...S.btn(T.bg3,T.text4),fontSize:"0.75rem"}}>↺ Restaurar</button>
          </div>
        </div>
      </details>
    </div>}

    {/* ── METRÓNOMO ── */}
    {showTab==="metro"&&<div style={S.panel}>
      <p style={S.ptitle("#40c4ff")}>Metrónomo</p>
      <div style={{display:"flex",gap:"1rem",flexWrap:"wrap",alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:200,textAlign:"center"}}>
          <div style={{fontSize:"4rem",fontWeight:900,fontFamily:"monospace",color:metroFlash?"#40c4ff":T.text,textShadow:metroFlash?"0 0 30px #40c4ff":"none",transition:"color 0.05s",lineHeight:1,cursor:"pointer",marginBottom:"0.2rem"}} onClick={()=>setMetroOn(!metroOn)}>{bpm}</div>
          <div style={{color:T.text3,fontSize:"0.72rem",marginBottom:"0.7rem"}}>{Math.round(60/bpm*10)/10}s/pulso</div>
          <div style={{display:"flex",gap:"0.3rem",justifyContent:"center",marginBottom:"0.6rem",flexWrap:"wrap"}}>
            {Array.from({length:beats}).map((_,i)=><div key={i} style={{width:i===0?14:10,height:i===0?14:10,borderRadius:"50%",background:(beatCount%beats)===i&&metroOn?"#40c4ff":i===0?"#1a3a5a":T.bg4,transition:"background 0.05s",border:i===0?"1px solid #40c4ff44":"none"}}/>)}
          </div>
          <input type="range" min={30} max={240} value={bpm} onChange={e=>{setBpm(Number(e.target.value));if(metroOn){clearInterval(metroRef.current);setMetroOn(false);setTimeout(()=>setMetroOn(true),50);}}} style={{width:"100%",accentColor:"#40c4ff",marginBottom:"0.5rem"}}/>
          <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap",justifyContent:"center",marginBottom:"0.75rem"}}>
            {PRESETS_BPM.map(b=><button key={b} onClick={()=>setBpm(b)} style={{background:bpm===b?"#40c4ff22":T.bg3,border:`1px solid ${bpm===b?"#40c4ff":T.border}`,color:bpm===b?"#40c4ff":T.text3,borderRadius:7,padding:"0.18rem 0.42rem",fontSize:"0.72rem",cursor:"pointer",fontFamily:"inherit"}}>{b}</button>)}
          </div>
          <button onClick={()=>setMetroOn(!metroOn)} style={{...S.btn(metroOn?"#ff6e40":"#40c4ff","#000"),width:"100%",padding:"0.6rem"}}>{metroOn?"⏹ Parar":"▶ Iniciar"}</button>
        </div>
        <div style={{minWidth:130}}>
          <p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.4rem",letterSpacing:"0.1em",fontFamily:"monospace"}}>PULSOS</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"0.3rem"}}>
            {[1,2,3,4,5,6,7,8].map(n=><button key={n} onClick={()=>{setBeats(n);stopMetro();}} style={{background:beats===n?"#40c4ff22":T.bg3,border:`1.5px solid ${beats===n?"#40c4ff":T.border}`,color:beats===n?"#40c4ff":T.text3,borderRadius:7,padding:"0.35rem",fontSize:"0.9rem",fontWeight:beats===n?700:400,cursor:"pointer",fontFamily:"monospace"}}>{n}</button>)}
          </div>
        </div>
      </div>
    </div>}

    {/* ── RUNDOWN ── */}
    {showTab==="rundown"&&<div style={S.panel}>
      <p style={S.ptitle(T.accent)}>Rundown do show</p>
      <div style={{display:"flex",gap:"0.45rem",marginBottom:"0.75rem",flexWrap:"wrap"}}>
        <input value={newActName} onChange={e=>setNewActName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addAct()} placeholder="Nome da actuación..." style={{...S.input,flex:2,minWidth:120}}/>
        <input value={newActFmt} onChange={e=>setNewActFmt(e.target.value)} placeholder="Formato..." style={{...S.input,flex:1,minWidth:80}}/>
        <button onClick={addAct} style={{...S.btn("#40c4ff","#000"),flexShrink:0}}>+</button>
      </div>
      {rundown.length===0&&<p style={{color:T.text4,fontSize:"0.82rem"}}>Engade actuacións ao rundown.</p>}
      <div style={{display:"flex",flexDirection:"column",gap:"0.45rem"}}>
        {rundown.map((act,i)=>(
          <div key={act.id} style={{background:act.activa?T.accent+"11":T.bg3,border:`1.5px solid ${act.activa?"#40c4ff":T.border}`,borderRadius:10,padding:"0.7rem 0.9rem",display:"flex",gap:"0.55rem",alignItems:"center",transition:"all 0.2s"}}>
            <span style={{color:T.text4,fontSize:"0.78rem",fontFamily:"monospace",width:18,flexShrink:0}}>{i+1}</span>
            <div style={{flex:1}}>
              <span style={{fontWeight:700,color:act.hecho?T.text3:act.activa?"#40c4ff":T.text,fontSize:"0.88rem",textDecoration:act.hecho?"line-through":"none"}}>{act.nombre}</span>
              {act.formato&&<span style={{...S.tag("#40c4ff"),marginLeft:"0.4rem"}}>{act.formato}</span>}
            </div>
            <div style={{display:"flex",gap:"0.3rem",flexShrink:0}}>
              <button onClick={()=>moveAct(act.id,-1)} disabled={i===0} style={{background:"none",border:"none",color:i===0?T.text4:T.text3,cursor:i===0?"default":"pointer",fontSize:"0.85rem"}}>▲</button>
              <button onClick={()=>moveAct(act.id,1)} disabled={i===rundown.length-1} style={{background:"none",border:"none",color:i===rundown.length-1?T.text4:T.text3,cursor:i===rundown.length-1?"default":"pointer",fontSize:"0.85rem"}}>▼</button>
              <button onClick={()=>setActiva(act.id)} style={{...S.btn(act.activa?"#40c4ff":T.bg4,act.activa?"#000":T.text3),padding:"0.25rem 0.5rem",fontSize:"0.75rem"}}>▶</button>
              <button onClick={()=>toggleAct(act.id)} style={{...S.btn(act.hecho?"#69f0ae22":T.bg4,act.hecho?"#69f0ae":T.text3),padding:"0.25rem 0.5rem",fontSize:"0.75rem"}}>✓</button>
              <button onClick={()=>removeAct(act.id)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.85rem"}}>×</button>
            </div>
          </div>
        ))}
      </div>
      <ShowNameWidget T={T} S={S}/>
    </div>}

    {/* ── SORTEO ── */}
    {showTab==="sorteo"&&<div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
      <div style={S.panel}>
        <p style={S.ptitle("#40c4ff")}>Sorteo de parellas e equipos</p>
        <TeamSorter T={T} S={S}/>
      </div>
      <div style={S.panel}>
        <p style={S.ptitle("#69f0ae")}>Xeradores rápidos</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
          <div style={{textAlign:"center"}}>
            <button onClick={()=>setNum(Math.floor(Math.random()*9)+1)} style={{...S.btn("#69f0ae","#000"),width:"100%",marginBottom:"0.4rem"}}>Núm 1–9</button>
            {num!==null&&<div style={{fontSize:"3.5rem",fontWeight:900,color:"#69f0ae",lineHeight:1,animation:"fadeIn 0.2s ease"}}>{num}</div>}
          </div>
          <div style={{textAlign:"center"}}>
            <button onClick={()=>setLetter(LETRAS[Math.floor(Math.random()*LETRAS.length)])} style={{...S.btn("#ffd740","#000"),width:"100%",marginBottom:"0.4rem"}}>Letra</button>
            {letter&&<div style={{fontSize:"3.5rem",fontWeight:900,color:"#ffd740",lineHeight:1,animation:"fadeIn 0.2s ease"}}>{letter}</div>}
          </div>
        </div>
        <button onClick={()=>{setNum(Math.floor(Math.random()*9)+1);setLetter(LETRAS[Math.floor(Math.random()*LETRAS.length)]);}} style={{...S.btn(T.bg3,T.text2),width:"100%",marginTop:"0.5rem"}}>Ambos a la vez</button>
      </div>
    </div>}

  </div>);
}
