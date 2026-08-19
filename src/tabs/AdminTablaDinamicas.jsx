import { useState, useEffect } from 'react';
import { useTheme, mkS, UID } from '../core.jsx';
import { getDinamicas, gardarLoteDinamicas, deleteDinamica, cargarTiposDinamica, aoCambiarTipos } from '../db.js';

// Edición masiva de dinámicas, en folla de cálculo.
//
// Ata que as dinámicas non viviron na base de datos isto non era posible:
// o catálogo estaba nun ficheiro do código e só se podía editar despregando.

const COLS = [
  {id:'nombre',        label:'Nome',          tipo:'texto',  min:150, obrig:true},
  {id:'tipo',          label:'Tipo',          tipo:'lista_tipos', min:110, obrig:true},
  {id:'duracion',      label:'Min',           tipo:'numero', min:55},
  {id:'participantes', label:'Formato',       tipo:'texto',  min:90},
  {id:'descripcion',   label:'Descrición',    tipo:'texto',  min:220, obrig:true},
  {id:'pasos',         label:'Pasos',         tipo:'lista',  min:260},
  {id:'objetivo',      label:'Obxectivo',     tipo:'texto',  min:180},
  {id:'variantes',     label:'Variantes',     tipo:'lista',  min:180},
  {id:'autoria',       label:'Autoría',       tipo:'texto',  min:140},
  {id:'fuente',        label:'Fonte',         tipo:'texto',  min:130},
];

// As listas sepáranse por barra vertical, non por comas: os pasos levan
// comas dentro constantemente e sería imposible distinguilos.
const aTexto = v => Array.isArray(v) ? v.join(' | ') : (v ?? '');
const aLista = t => String(t ?? '').split('|').map(s => s.trim()).filter(Boolean);

export function AdminTablaDinamicas(){
  const {T}=useTheme(); const S=mkS(T);
  const [filas,setFilas]=useState([]);
  const [orixinais,setOrixinais]=useState({});
  const [tipos,setTipos]=useState([]);
  const [cargando,setCargando]=useState(true);
  const [gardando,setGardando]=useState(false);
  const [msg,setMsg]=useState('');
  const [filtro,setFiltro]=useState('todos');
  const [bruto,setBruto]=useState({});

  const cargar=()=>{
    setCargando(true);
    Promise.all([getDinamicas(),cargarTiposDinamica()]).then(([d,t])=>{
      const lista=(Array.isArray(d)?d:(d?.dinamicas||[])).map(x=>({...x,_k:x.id||UID()}));
      setFilas(lista);
      setOrixinais(Object.fromEntries(lista.map(f=>[f._k,JSON.stringify(f)])));
      setTipos((Array.isArray(t)?t:(t?.tipos||[])).filter(x=>x.activo!==false));
      setCargando(false);
    });
  };
  // Un tipo creado noutra sección tamén ten que aparecer aquí.
  useEffect(()=>{cargar();return aoCambiarTipos(cargar);},[]);

  const visibles=filas.filter(f=>filtro==='todos'||f.tipo===filtro);
  const estado=f=>!f.id||String(f.id).startsWith('nova-')?'nova'
    :(orixinais[f._k]===JSON.stringify(f)?'igual':'modificada');
  const erros=f=>COLS.filter(c=>c.obrig&&!String(f[c.id]??'').trim()).map(c=>c.label);
  const conCambios=filas.filter(f=>estado(f)!=='igual');
  const conErros=filas.filter(f=>erros(f).length>0);

  const escribir=(k,c,txt)=>setFilas(fs=>fs.map(f=>{
    if(f._k!==k)return f;
    if(c.tipo==='lista')return {...f,[c.id]:aLista(txt)};
    if(c.tipo==='numero')return {...f,[c.id]:txt===''?'':Number(txt)};
    return {...f,[c.id]:txt};
  }));

  const engadir=(n=1)=>setFilas(fs=>[...fs,...Array.from({length:n},()=>({
    _k:UID(), id:'nova-'+UID(), nombre:'', tipo:tipos[0]?.id||'juego', duracion:10,
    participantes:'grupo', descripcion:'', pasos:[], objetivo:'', variantes:[],
  }))]);

  const duplicar=k=>setFilas(fs=>{
    const i=fs.findIndex(f=>f._k===k);
    const c={...fs[i],_k:UID(),id:'nova-'+UID(),nombre:`${fs[i].nombre} (copia)`};
    return [...fs.slice(0,i+1),c,...fs.slice(i+1)];
  });

  const quitar=async k=>{
    const f=filas.find(x=>x._k===k);
    if(f.id&&!String(f.id).startsWith('nova-')){
      if(!confirm(`Borrar «${f.nombre}» da base de datos?`))return;
      await deleteDinamica(f.id);
    }
    setFilas(fs=>fs.filter(x=>x._k!==k));
  };

  // Pegar desde folla de cálculo: TSV
  const pegar=(e,k,idxCol)=>{
    const txt=e.clipboardData?.getData('text/plain')||'';
    if(!txt.includes('\t')&&!txt.includes('\n'))return;
    e.preventDefault();
    const grella=txt.replace(/\r/g,'').split('\n').filter(l=>l.length).map(l=>l.split('\t'));
    setFilas(fs=>{
      const out=[...fs];
      let i=out.findIndex(f=>f._k===k);
      grella.forEach((linha,dy)=>{
        const idx=i+dy;
        if(!out[idx])out[idx]={_k:UID(),id:'nova-'+UID(),nombre:'',tipo:tipos[0]?.id||'juego',
          duracion:10,participantes:'grupo',descripcion:'',pasos:[],objetivo:'',variantes:[]};
        linha.forEach((cel,dx)=>{
          const c=COLS[idxCol+dx]; if(!c)return;
          const v=c.tipo==='lista'?aLista(cel):(c.tipo==='numero'?Number(cel)||0:cel);
          out[idx]={...out[idx],[c.id]:v};
        });
      });
      return out;
    });
    setMsg(`Pegadas ${grella.length} filas.`);
  };

  const gardar=async()=>{
    if(conErros.length){setMsg(`Hai ${conErros.length} filas con campos obrigatorios baleiros.`);return;}
    if(!conCambios.length){setMsg('Non hai cambios que gardar.');return;}
    setGardando(true);
    const r=await gardarLoteDinamicas(conCambios);
    setGardando(false);
    setMsg(r.erros.length
      ? `${r.gardadas} actualizadas, ${r.creadas} creadas, ${r.erros.length} con erro`
      : `✓ ${r.gardadas} actualizadas, ${r.creadas} creadas.`);
    cargar();
  };

  const cela={background:'transparent',border:'none',color:T.text2,fontSize:'0.76rem',
    fontFamily:'inherit',padding:'0.4rem 0.45rem',width:'100%',minWidth:0,outline:'none',boxSizing:'border-box'};

  if(cargando)return <p style={S.caption}>Cargando…</p>;

  return(<div>
    <div style={{display:'flex',gap:'0.5rem',alignItems:'center',flexWrap:'wrap',marginBottom:'0.7rem'}}>
      <p style={{...S.ptitle(T.accent),margin:0}}>Edición masiva</p>
      <select value={filtro} onChange={e=>setFiltro(e.target.value)} style={{...S.input,width:'auto',marginBottom:0}}>
        <option value="todos">Todos os tipos ({filas.length})</option>
        {tipos.map(t=><option key={t.id} value={t.id}>{t.emoji} {t.nome}</option>)}
      </select>
      <span style={{color:T.text4,fontSize:'0.74rem'}}>{visibles.length} filas</span>
    </div>

    <p style={{...S.caption,marginBottom:'0.7rem'}}>
      Podes pegar desde Excel ou Google Sheets. Nas listas (pasos, variantes)
      separa os elementos con <b>|</b>, non con comas: os pasos levan comas dentro.
    </p>

    <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap',marginBottom:'0.7rem'}}>
      <button onClick={()=>engadir(1)} style={{...S.btn(T.bg3,T.text2),fontSize:'0.76rem'}}>+ Fila</button>
      <button onClick={()=>engadir(5)} style={{...S.btn(T.bg3,T.text2),fontSize:'0.76rem'}}>+ 5 filas</button>
      <button onClick={gardar} disabled={gardando||!conCambios.length}
        style={{...S.btn(T.ok,'#000'),fontSize:'0.76rem',opacity:(gardando||!conCambios.length)?0.45:1}}>
        {gardando?'Gardando…':`Gardar ${conCambios.length} cambio${conCambios.length===1?'':'s'}`}</button>
    </div>

    {msg&&<p style={{color:msg.startsWith('✓')||msg.startsWith('Pegadas')?T.ok:T.warn,fontSize:'0.8rem',marginBottom:'0.6rem'}}>{msg}</p>}

    <div style={{overflowX:'auto',borderStyle:'solid',borderWidth:1,borderColor:T.border,borderRadius:10,background:T.bg2}}>
      <table style={{borderCollapse:'collapse',fontSize:'0.76rem',minWidth:'100%'}}>
        <thead><tr style={{background:T.bg3}}>
          <th style={{width:4,padding:0}}/>
          {COLS.map(c=><th key={c.id} style={{padding:'0.45rem',textAlign:'left',color:T.text3,
            fontWeight:700,fontSize:'0.7rem',whiteSpace:'nowrap',minWidth:c.min,
            borderBottomStyle:'solid',borderBottomWidth:1,borderBottomColor:T.border}}>
            {c.label}{c.obrig&&<span style={{color:T.danger}}> *</span>}</th>)}
          <th style={{width:60}}/>
        </tr></thead>
        <tbody>
          {visibles.map(f=>{
            const est=erros(f).length?'erro':estado(f);
            const cor={nova:T.ok,modificada:T.warn,erro:T.danger,igual:'transparent'}[est];
            return(<tr key={f._k} style={{borderBottomStyle:'solid',borderBottomWidth:1,borderBottomColor:T.border}}>
              <td style={{background:cor,width:4,padding:0}} title={est}/>
              {COLS.map((c,j)=>(
                <td key={c.id} style={{padding:0,background:(c.obrig&&!String(f[c.id]??'').trim())?T.danger+'15':'transparent'}}>
                  {c.tipo==='lista_tipos'
                    ? <select value={f.tipo||''} onChange={e=>escribir(f._k,c,e.target.value)} style={{...cela,cursor:'pointer'}}>
                        {tipos.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}
                      </select>
                    : <input
                        value={c.tipo==='lista'?(bruto[`${f._k}:${c.id}`]??aTexto(f[c.id])):(f[c.id]??'')}
                        onChange={e=>{
                          if(c.tipo==='lista')setBruto(b=>({...b,[`${f._k}:${c.id}`]:e.target.value}));
                          else escribir(f._k,c,e.target.value);
                        }}
                        onBlur={()=>{
                          const kk=`${f._k}:${c.id}`;
                          if(bruto[kk]!==undefined){escribir(f._k,c,bruto[kk]);setBruto(b=>{const x={...b};delete x[kk];return x;});}
                        }}
                        onPaste={e=>pegar(e,f._k,j)}
                        placeholder={c.tipo==='lista'?'un | outro | outro':''}
                        style={cela}/>}
                </td>))}
              <td style={{padding:'0 0.3rem',whiteSpace:'nowrap'}}>
                <button onClick={()=>duplicar(f._k)} title="Duplicar" style={{background:'none',border:'none',color:T.text4,cursor:'pointer',fontSize:'0.85rem',padding:'0.2rem'}}>⧉</button>
                <button onClick={()=>quitar(f._k)} style={{background:'none',border:'none',color:T.danger,cursor:'pointer',fontSize:'0.85rem',padding:'0.2rem'}}>🗑</button>
              </td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>

    {conErros.length>0&&<div style={{marginTop:'0.7rem',background:T.danger+'12',borderStyle:'solid',borderWidth:1,borderColor:T.danger+'33',borderRadius:8,padding:'0.7rem'}}>
      <p style={{color:T.danger,fontSize:'0.78rem',fontWeight:700,margin:'0 0 0.3rem'}}>{conErros.length} filas incompletas</p>
      {conErros.slice(0,6).map(f=><p key={f._k} style={{color:T.text3,fontSize:'0.74rem',margin:'0.1rem 0'}}>
        {f.nombre||'(sen nome)'} — falta: {erros(f).join(', ')}</p>)}
    </div>}
  </div>);
}
