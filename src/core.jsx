// ============================================================
// core.jsx
// Xerado automaticamente na división de ImproApp.jsx (T04)
// ============================================================

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { cargarEstimulos, cargarCategorias } from './estimulos.js';
import { getDinamicas, recargarDinamicas } from './db.js';

// Antes eran cores fixas; agora son nomes de token, para que cada tema
// as repinte. `colorTipo(T,tipo)` resolve contra o tema activo.
export const TIPO_TOKEN = {calentamiento:"warn",entrenamiento:"info",juego:"ok",formato:"accent",musical:"alt",pausa:"muted",cierre:"danger"};

// Cache dos tipos cargados da BD, para que colorTipo siga sendo síncrona.
// Enchese unha vez ao arrancar; se aínda non se cargou, cae a TIPO_TOKEN.
let _tiposCache = null;
export function rexistrarTipos(lista) {
  if (!Array.isArray(lista) || !lista.length) return;
  _tiposCache = Object.fromEntries(lista.map(t => [t.id, t.cor || 'accent']));
}
export const colorTipo = (T, tipo) =>
  T[(_tiposCache && _tiposCache[tipo]) || TIPO_TOKEN[tipo]] || T.accent;

export const ThemeCtx = createContext(null);

export const LangCtx = createContext(null);

export const AuthCtx = createContext(null);

export const useAuth = () => useContext(AuthCtx) || {};

export const useLang = () => useContext(LangCtx);

export const UI_STRINGS = {
  es:{generar:"Generar",reto:"Reto",sesiones:"Sesiones",guia:"Guía",sonido:"Sonido",grupos:"Grupos",qr:"QR",ajustes:"Ajustes",manual:"Manual",admin:"Admin",universo:"Universo",axenda:"Agenda"},
  gl:{generar:"Xerar",reto:"Reto",sesiones:"Sesións",guia:"Guía",sonido:"Son",grupos:"Grupos",qr:"QR",ajustes:"Axustes",manual:"Manual",admin:"Admin",universo:"Universo",axenda:"Axenda"},
  en:{generar:"Generate",reto:"Challenge",sesiones:"Sessions",guia:"Guide",sonido:"Sound",grupos:"Groups",qr:"QR",ajustes:"Settings",manual:"Manual",admin:"Admin",universo:"Universe",axenda:"Calendar"},
};

// ⚠️ O último `|| key` é unha rede de seguridade, non unha tradución: se
// falta a clave devolve o identificador cru en minúscula ("sonido"), que
// é o que se viu na botonera ao engadir a área sen tocar UI_STRINGS.
// Toda área nova ten que entrar AQUÍ tamén, non só en AREAS e TABS.
// Hai unha proba que o comproba (test_nav).
export const t = (lang, key) => UI_STRINGS[lang]?.[key] || UI_STRINGS.es[key] || key;

export const TAB_LABELS = UI_STRINGS;

// Idiomas. `uiCompleta` marca os que teñen UI_STRINGS traducido; os outros
// aplican ao contido (a táboa `estimulos` ten columna por idioma) e a UI cae
// a castelán vía t(). Cando se traduza a UI, só hai que virar a bandeira.
export const LANGS = [
  {id:"es",label:"Castelán",  nativo:"Castellano", uiCompleta:true},
  {id:"gl",label:"Galego",    nativo:"Galego",     uiCompleta:true},
  {id:"en",label:"Inglés",    nativo:"English",    uiCompleta:true},
  {id:"pt",label:"Portugués", nativo:"Português",  uiCompleta:false},
  {id:"it",label:"Italiano",  nativo:"Italiano",   uiCompleta:false},
];

export const GrupoCtx = createContext(null);

export const useGrupo = () => useContext(GrupoCtx);

export const useTheme = () => useContext(ThemeCtx);

// ═══════════════════════════════════════════════════════════════
// TEMAS
//
// Cada tema define un par día/noite. Os catro tokens semánticos
// (ok/warn/info/danger) tamén forman parte do tema: antes estaban
// escritos a man en 194 sitios, o que impedía que un tema de fondo
// azul e letras amarelas se vise ben.
// ═══════════════════════════════════════════════════════════════

// Contraste WCAG 2.1. Devolve a proporción entre dúas cores (1–21).
export function contraste(c1, c2) {
  const lum = hex => {
    const h = String(hex).replace('#', '').slice(0, 6);
    const v = h.length === 3 ? h.split('').map(x => x + x).join('') : h.padEnd(6, '0');
    const [r, g, b] = [0, 2, 4].map(i => {
      const n = parseInt(v.slice(i, i + 2), 16) / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = lum(c1), b = lum(c2);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// AA esixe 4.5 para texto normal e 3 para texto grande ou elementos de UI.
export const CONTRASTE_MIN = 4.5;
export const CONTRASTE_MIN_UI = 3;

const NEUTRO_ESCURO = {
  bg:"#0d0d0d",bg2:"#161616",bg3:"#1e1e1e",bg4:"#252525",
  border:"#252525",border2:"#2a2a2a",
  text:"#fff",text2:"#aaa",text3:"#666",text4:"#444",
  nav:"#0d0d0d",navBorder:"#1a1a1a",input:"#0d0d0d",inputBorder:"#2a2a2a",
};
const NEUTRO_CLARO = {
  bg:"#f0f0f4",bg2:"#fff",bg3:"#f5f5f8",bg4:"#e8e8ec",
  border:"#ddd",border2:"#ccc",
  text:"#111",text2:"#444",text3:"#777",text4:"#999",
  nav:"#fff",navBorder:"#e0e0e0",input:"#fff",inputBorder:"#ccc",
};
// Acentos por defecto. Un tema pode substituír os que queira.
// Os acentos neón só son lexibles sobre fondo escuro. Sobre branco,
// #69f0ae dá 1.4:1 fronte ao mínimo de 3:1 — o tema claro orixinal xa
// tiña este problema. Por iso hai dous xogos.
const ACENTOS_ESCUROS = {ok:"#69f0ae",warn:"#ffd740",info:"#40c4ff",danger:"#ff6e40",alt:"#ff80ab",muted:"#90a4ae"};
const ACENTOS_CLAROS  = {ok:"#0E7A52",warn:"#8A6500",info:"#0069A8",danger:"#C4441A",alt:"#A8447A",muted:"#546E7A"};
const ACENTOS = ACENTOS_ESCUROS;

export const TEMAS = [
  {
    id:"impro", nome:"ImproApp", emoji:"🎭",
    desc:"O de sempre. Magenta sobre gris.",
    escuro:{...NEUTRO_ESCURO,...ACENTOS_ESCUROS,accent:"#e040fb"},
    claro: {...NEUTRO_CLARO, ...ACENTOS_CLAROS, accent:"#9c27b0"},
  },
  {
    id:"fit", nome:"FIT", emoji:"💛",
    desc:"Formación Específica en Improvisación Teatral. Azul e amarelo.",
    // Cores tomadas do logo: fondo #0199DC, letras #FEFB4E.
    escuro:{
      // O azul do logo (#0199DC) é cor de marca, non de panel: usalo como
      // fondo deixaba todo o texto por baixo de 3:1. Vai como acento.
      bg:"#00263B",bg2:"#003A57",bg3:"#004B70",bg4:"#005C88",
      border:"#005C88",border2:"#0176AB",
      text:"#FEFB4E",text2:"#DCEEF9",text3:"#9BD0EC",text4:"#5E9EC4",
      nav:"#00263B",navBorder:"#004B70",input:"#00263B",inputBorder:"#005C88",
      accent:"#FEFB4E",
      // O verde menta e o laranxa orixinais quedaban chillóns sobre azul.
      ok:"#7BE8A8",warn:"#FEFB4E",info:"#7FC9EE",danger:"#FF9E7A",alt:"#FFB3D1",muted:"#9BD0EC",
    },
    claro:{
      bg:"#E8F6FD",bg2:"#fff",bg3:"#D5EEFB",bg4:"#BEE7F7",
      border:"#9BD9F2",border2:"#7FC9EE",
      text:"#003D5C",text2:"#00588A",text3:"#0176AB",text4:"#4FB3E8",
      nav:"#fff",navBorder:"#BEE7F7",input:"#fff",inputBorder:"#9BD9F2",
      accent:"#0199DC",
      // O amarelo do logo é ilexible sobre branco: en claro úsase o azul
      // como acento e resérvase o amarelo para fondos.
      ok:"#0E8A5F",warn:"#A87900",info:"#0176AB",danger:"#C4441A",alt:"#B03A6E",muted:"#5A7A8A",
    },
  },
  {
    id:"aescola", nome:"aescoladeimpro", emoji:"🟢",
    desc:"Verde augamariña sobre branco.",
    // Cor tomada do logo: #3A8C86.
    escuro:{
      bg:"#0B1A19",bg2:"#122927",bg3:"#183532",bg4:"#1F423E",
      border:"#1F423E",border2:"#2A5A55",
      text:"#F2FAF9",text2:"#A8CFCB",text3:"#6FA5A0",text4:"#4A7A75",
      nav:"#0B1A19",navBorder:"#183532",input:"#0B1A19",inputBorder:"#2A5A55",
      accent:"#5CBFB7",
      ok:"#6FE3A8",warn:"#E8C766",info:"#6FC8E0",danger:"#F08A6A",alt:"#D98FB0",muted:"#6FA5A0",
    },
    claro:{
      bg:"#F4FAF9",bg2:"#fff",bg3:"#E8F3F2",bg4:"#D7E9E7",
      border:"#C4DEDB",border2:"#A8CFCB",
      text:"#0B1A19",text2:"#2A5A55",text3:"#4A7A75",text4:"#7FA8A4",
      nav:"#fff",navBorder:"#D7E9E7",input:"#fff",inputBorder:"#C4DEDB",
      accent:"#3A8C86",
      ok:"#0E7A52",warn:"#96700A",info:"#1A6E88",danger:"#C4441A",alt:"#A8447A",muted:"#5A7A78",
    },
  },
  {
    id:"escenario", nome:"Escenario", emoji:"🌑",
    desc:"Alto contraste para salas escuras. Pensado para shows.",
    escuro:{
      bg:"#000",bg2:"#0a0a0a",bg3:"#141414",bg4:"#1f1f1f",
      border:"#333",border2:"#444",
      text:"#fff",text2:"#e0e0e0",text3:"#b0b0b0",text4:"#808080",
      nav:"#000",navBorder:"#222",input:"#000",inputBorder:"#444",
      accent:"#00E5FF",ok:"#00E676",warn:"#FFEA00",info:"#40C4FF",danger:"#FF3D00",alt:"#FF4081",muted:"#90A4AE",
    },
    claro:{
      bg:"#fff",bg2:"#fff",bg3:"#f0f0f0",bg4:"#e0e0e0",
      border:"#999",border2:"#666",
      text:"#000",text2:"#222",text3:"#444",text4:"#666",
      nav:"#fff",navBorder:"#ccc",input:"#fff",inputBorder:"#999",
      accent:"#0066CC",ok:"#00703C",warn:"#8A6500",info:"#005B8A",danger:"#B3200A",alt:"#96005A",muted:"#4A5A62",
    },
  },
];

// Tokens que un tema personalizado pode axustar desde Axustes.
export const TOKENS_EDITABLES = [
  {id:"bg",    label:"Fondo",        sobre:null},
  {id:"bg2",   label:"Panel",        sobre:null},
  {id:"text",  label:"Texto",        sobre:"bg"},
  {id:"text2", label:"Texto suave",  sobre:"bg2"},
  {id:"accent",label:"Acento",       sobre:"bg2"},
  {id:"ok",    label:"Éxito",        sobre:"bg2"},
  {id:"warn",  label:"Aviso",        sobre:"bg2"},
  {id:"info",  label:"Info",         sobre:"bg2"},
  {id:"danger",label:"Erro",         sobre:"bg2"},
];

// Deriva os tokens que non se editan a man, para que un tema propio non
// obrigue a escoller 20 cores.
export function completarTema(base, modo) {
  const neutro = modo === "claro" ? NEUTRO_CLARO : NEUTRO_ESCURO;
  const acc = modo === "claro" ? ACENTOS_CLAROS : ACENTOS_ESCUROS;
  return {...neutro, ...acc, ...base};
}

export function avisosContraste(tema) {
  return TOKENS_EDITABLES.filter(t => t.sobre).map(t => {
    const r = contraste(tema[t.id], tema[t.sobre]);
    const min = (t.id === "text" || t.id === "text2") ? CONTRASTE_MIN : CONTRASTE_MIN_UI;
    return {id:t.id, label:t.label, ratio:r, ok:r >= min, min};
  }).filter(x => !x.ok);
}

export function useThemeProvider() {
  const [dark, setDark] = useState(() => localStorage.getItem("impro_theme") !== "light");
  const [temaId, setTemaId] = useState(() => localStorage.getItem("impro_tema") || "impro");
  const [propio, setPropio] = useState(() => {
    try { return JSON.parse(localStorage.getItem("impro_tema_propio") || "null"); } catch { return null; }
  });

  const toggle = () => setDark(d => { localStorage.setItem("impro_theme", d ? "light" : "dark"); return !d; });
  const escollerTema = id => { localStorage.setItem("impro_tema", id); setTemaId(id); };
  const gardarPropio = t => {
    if (t) localStorage.setItem("impro_tema_propio", JSON.stringify(t));
    else localStorage.removeItem("impro_tema_propio");
    setPropio(t);
  };

  const modo = dark ? "escuro" : "claro";
  let T;
  if (temaId === "propio" && propio) {
    T = completarTema(propio[modo] || {}, dark ? "escuro" : "claro");
  } else {
    const tema = TEMAS.find(t => t.id === temaId) || TEMAS[0];
    T = tema[modo];
  }

  return { dark, toggle, T, temaId, escollerTema, propio, gardarPropio };
}

export const FALLBACK_ESTIMULOS = {
  "PROFESIÓN":{simple:["Domador de urracas","Sexador de pollos","Jardinero de planetas","Reparador de sueños","Cazador de arcoíris"],plus:[]},
  "OBJETO":{simple:["Caleidoscopio estelar","Paraguas de funeral","Reloj sin agujas","Llave oxidada"],plus:[]},
  "LUGAR":{simple:["Faro abandonado","Estación de tren nocturna","Invernadero tropical"],plus:[]},
  "EMOCIÓN":{simple:["Nostalgia","Euforia contenida","Vergüenza ajena"],plus:[]},
  "ACCIÓN":{simple:["Buscar algo perdido","Despedirse sin decirlo","Confesar a destiempo"],plus:[]},
  "NOMBRE":{simple:["Remedios","Casimiro","Nicanor"],plus:[]},
  "SUPERPODER":{simple:["Hablar con las plantas","Detener el tiempo un segundo"],plus:[]},
  "ESTILO":{simple:["Cine mudo","Telenovela","Documental de naturaleza"],plus:[]},
  "DUDA":{simple:["¿Y si nadie me escucha?","¿Elegí bien?"],plus:[]},
  "CONFESIÓN":{simple:["Nunca leí ese libro","Fui yo"],plus:[]},
  "FRASE":{simple:["No era mi intención","Ya no queda tiempo"],plus:[]},
};

export const EstimulosCtx = createContext(null);

export const useEstimulos = () => useContext(EstimulosCtx) || { data: FALLBACK_ESTIMULOS, cats: [], cargando: false, recargar: () => {} };

export function EstimulosProvider({ lang, children }) {
  const [data, setData] = useState(() => {
    try { const v = localStorage.getItem('impro_estimulos_cache'); return v ? JSON.parse(v) : FALLBACK_ESTIMULOS; }
    catch { return FALLBACK_ESTIMULOS; }
  });
  const [cats, setCats] = useState([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async (forzar = false) => {
    setCargando(true);
    const [e, c] = await Promise.all([
      cargarEstimulos(lang, { forzar }),
      cargarCategorias(lang),
    ]);
    if (e && Object.keys(e).length) setData(e);
    if (c?.length) setCats(c);
    setCargando(false);
  }, [lang]);

  useEffect(() => { recargar(false); }, [recargar]);

  return <EstimulosCtx.Provider value={{ data, cats, cargando, recargar }}>{children}</EstimulosCtx.Provider>;
}

export const CAT_ICONS = {PROFESIÓN:"👤",OBJETO:"📦",LUGAR:"📍",EMOCIÓN:"💜",ACCIÓN:"🎭",NOMBRE:"📛",SUPERPODER:"⚡",ESTILO:"🎬",DUDA:"❓",CONFESIÓN:"🤫",FRASE:"💬"};

export const CATS_FALLBACK = Object.keys(FALLBACK_ESTIMULOS);

export const UID = () => Math.random().toString(36).slice(2,10);

export const FMT = s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

export const pick = arr => arr[Math.floor(Math.random()*arr.length)];

export const ls = {
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
};

export const trackGen = (cat) => {
  const s = ls.get("impro_stats", {cats:{}, total:0, mins:0});
  s.cats[cat] = (s.cats[cat]||0) + 1;
  s.total = (s.total||0) + 1;
  ls.set("impro_stats", s);
  const ga = ls.get("impro_grupo_activo", null);
  if(ga?.id){
    const gs = ls.get("impro_stats_grupos", {});
    gs[ga.id] = gs[ga.id] || {cats:{}};
    gs[ga.id].cats[cat] = (gs[ga.id].cats[cat]||0) + 1;
    ls.set("impro_stats_grupos", gs);
  }
};

export const trackDin = (nombre) => {
  const s = ls.get("impro_stats", {cats:{}, dins:{}, total:0, mins:0});
  s.dins = s.dins || {};
  s.dins[nombre] = (s.dins[nombre]||0) + 1;
  ls.set("impro_stats", s);
};

export const trackMins = (m) => {
  const s = ls.get("impro_stats", {cats:{}, total:0, mins:0});
  s.mins = (s.mins||0) + m;
  ls.set("impro_stats", s);
};

// ── SISTEMA TIPOGRÁFICO ──
// Tres familias con roles claros:
//   FONT_UI    → interface xeral, corpo de texto
//   FONT_TIT   → títulos e cifras grandes (mesmo stack, pesos altos)
//   FONT_MONO  → etiquetas, códigos, temporizadores, datos
// Os tamaños usan clamp() para escalar entre móbil e escritorio sen media queries.
export const FONT_UI   = "'Inter','SF Pro Text',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif";
export const FONT_TIT  = "'Inter','SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif";
export const FONT_MONO = "'JetBrains Mono','SF Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

// Escala tipográfica: [móbil, ideal vw, escritorio]
export const TYPE = {
  display: { fontFamily:FONT_TIT,  fontSize:"clamp(1.75rem,1.2rem + 2.6vw,2.75rem)", fontWeight:800, lineHeight:1.1,  letterSpacing:"-0.03em" },
  h1:      { fontFamily:FONT_TIT,  fontSize:"clamp(1.25rem,1.05rem + 1vw,1.6rem)",   fontWeight:800, lineHeight:1.2,  letterSpacing:"-0.02em" },
  h2:      { fontFamily:FONT_TIT,  fontSize:"clamp(1.02rem,0.95rem + 0.4vw,1.18rem)",fontWeight:700, lineHeight:1.3,  letterSpacing:"-0.01em" },
  h3:      { fontFamily:FONT_TIT,  fontSize:"clamp(0.9rem,0.86rem + 0.2vw,0.98rem)", fontWeight:700, lineHeight:1.35 },
  body:    { fontFamily:FONT_UI,   fontSize:"clamp(0.875rem,0.85rem + 0.15vw,0.94rem)", fontWeight:400, lineHeight:1.6 },
  bodySm:  { fontFamily:FONT_UI,   fontSize:"clamp(0.8rem,0.78rem + 0.1vw,0.85rem)", fontWeight:400, lineHeight:1.55 },
  label:   { fontFamily:FONT_MONO, fontSize:"0.7rem",  fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase" },
  caption: { fontFamily:FONT_UI,   fontSize:"0.75rem", fontWeight:400, lineHeight:1.45 },
  numeric: { fontFamily:FONT_MONO, fontWeight:700, fontVariantNumeric:"tabular-nums", letterSpacing:"-0.01em" },
};

// Puntos de corte compartidos por toda a app
// ⚠️ `tablet:900` non distingue un iPad horizontal (1024–1366) dun
// escritorio: sen `tabletH` a mesa de Sonido colle o layout de rato.
export const BP = { movil:520, tablet:900, tabletH:1180 };

// Hook de tamaño de pantalla, para adaptar layouts que clamp() non cobre
export function useViewport(){
  const [w,setW]=useState(()=>typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{
    let raf=null;
    const onR=()=>{if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>setW(window.innerWidth));};
    window.addEventListener("resize",onR);
    return()=>{window.removeEventListener("resize",onR);if(raf)cancelAnimationFrame(raf);};
  },[]);
  return {
    w,
    esMovil:  w<BP.movil,
    esTablet: w>=BP.movil&&w<BP.tablet,
    esPC:     w>=BP.tablet,
    // Novos, para Sonido. `esTabletH` é a experiencia principal da mesa.
    esTabletH: w>=BP.tablet&&w<BP.tabletH,
    esEscritorio: w>=BP.tabletH,
  };
}

export const mkS = (T) => ({
  // Tipografía lista para espallar: {...S.t.h1}
  t: TYPE,
  font: FONT_UI,
  fontTit: FONT_TIT,
  fontMono: FONT_MONO,

  panel:{background:T.bg2,border:`1.5px solid ${T.border}`,borderRadius:14,padding:"clamp(0.9rem,0.7rem + 0.8vw,1.25rem)",fontFamily:FONT_UI},
  btn:(bg,color="#fff")=>({background:bg,color,border:"none",borderRadius:10,padding:"0.55rem 1rem",fontWeight:650,cursor:"pointer",fontSize:"0.85rem",fontFamily:FONT_UI,letterSpacing:"-0.005em",transition:"all 0.15s",whiteSpace:"nowrap",minHeight:38,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:"0.35rem"}),
  input:{background:T.input,border:`1.5px solid ${T.inputBorder}`,borderRadius:9,color:T.text,padding:"0.55rem 0.8rem",fontSize:"16px",fontFamily:FONT_UI,lineHeight:1.4,outline:"none",width:"100%",boxSizing:"border-box",minHeight:42},
  ptitle:(c)=>({color:c,...TYPE.label,margin:"0 0 0.9rem"}),
  tag:(c)=>({background:c+"22",color:c,borderRadius:6,padding:"0.14rem 0.5rem",fontSize:"0.7rem",fontWeight:650,fontFamily:FONT_UI,letterSpacing:"0.01em",display:"inline-block"}),

  // Novos helpers
  h1:{...TYPE.h1,color:T.text,margin:0},
  h2:{...TYPE.h2,color:T.text,margin:0},
  h3:{...TYPE.h3,color:T.text,margin:0},
  body:{...TYPE.body,color:T.text2,margin:0},
  caption:{...TYPE.caption,color:T.text3,margin:0},
  num:(c,size="1.5rem")=>({...TYPE.numeric,color:c,fontSize:size,lineHeight:1}),
  // Reixa responsive: cae a unha columna en móbil automaticamente
  grid:(min=240)=>({display:"grid",gridTemplateColumns:`repeat(auto-fill,minmax(min(${min}px,100%),1fr))`,gap:"0.6rem"}),
});


// ── FONTE ÚNICA DE DINÁMICAS ──
//
// Desde A04 o catálogo non está no código: vén só da táboa `dinamicas`. Iso
// quere dicir que a lista xa non existe no primeiro render, e que «baleiro»
// pasa a ser un estado real que hai que distinguir de «aínda cargando».
// Catro pantallas facían esta carga por separado (Guía, Reto, Admin e a
// Táboa masiva); agora comparten hook. Ter dúas copias da mesma lóxica foi
// o que fixo que Reto e Guía discrepasen sobre que dinámicas existían (B16).
export function useDinamicas() {
  const [dinamicas, setDinamicas] = useState(() => {
    const c = ls.get('impro_dinamicas_v2', []);
    return Array.isArray(c) ? c : [];
  });
  const [cargando, setCargando] = useState(true);
  const [motivo, setMotivo] = useState(null);

  const aplicar = useCallback((r) => {
    const lista = Array.isArray(r) ? r : (r?.dinamicas || []);
    setDinamicas(lista);
    setMotivo(r?.motivo || (lista.length ? null : 'baleira'));
    setCargando(false);
  }, []);

  // `vivo` evita escribir estado nun compoñente xa desmontado: en Admin
  // pódese cambiar de sección antes de que responda a consulta.
  useEffect(() => {
    let vivo = true;
    setCargando(true);
    getDinamicas().then(r => { if (vivo) aplicar(r); });
    return () => { vivo = false; };
  }, [aplicar]);

  const recargar = useCallback(async () => {
    setCargando(true);
    aplicar(await recargarDinamicas());
  }, [aplicar]);

  // `desdeCache` non se devolve: sería sempre o contrario de `baleiro`, e ter
  // dous nomes para o mesmo estado é como empezan as discrepancias.
  return { dinamicas, setDinamicas, cargando, motivo, recargar };
}

// Aviso cando o catálogo non está completo. Antes isto era invisible: se a
// base fallaba aparecían igual as 247 do código e ninguén se enteraba.
export function AvisoDinamicas({ motivo, baleiro, onRecargar }) {
  const { T } = useTheme(); const S = mkS(T);
  if (!motivo) return null;
  const senConexion = motivo === 'sen-conexion';
  const cor = baleiro ? T.danger : T.warn;
  // ⚠️ `S.panel` trae `border` en abreviatura. Deixala e engadir `borderColor`
  // é exactamente B24: React reescribe só o que muda, e ao cambiar de tema a
  // abreviatura reinicia os catro lados e leva por diante a cor. Anúlase a
  // abreviatura e decláranse as tres propiedades longas.
  return (
    <div style={{
      ...S.panel, border: undefined,
      borderStyle: 'solid', borderWidth: '1.5px', borderColor: cor + '55',
      background: cor + '12', marginBottom: '0.9rem',
    }}>
      <p style={{ ...S.ptitle(cor), marginBottom: '0.45rem' }}>
        {baleiro ? 'Non hai dinámicas' : 'Catálogo posiblemente desactualizado'}
      </p>
      <p style={{ ...TYPE.bodySm, color: T.text2, margin: 0 }}>
        {senConexion
          ? (baleiro
            ? 'Non se puido contactar coa base de datos e non hai copia local. Comproba a conexión e volve tentalo.'
            : 'Non se puido contactar coa base de datos. Estás vendo a última copia local.')
          : (baleiro
            ? 'A táboa dinamicas está baleira. Falta executar supabase_dinamicas_seed.sql no SQL Editor de Supabase.'
            : 'A táboa dinamicas está baleira. Estás vendo a última copia local; executa supabase_dinamicas_seed.sql para restaurala.')}
      </p>
      {onRecargar && <button onClick={onRecargar} style={{ ...S.btn(T.bg3, T.text2), marginTop: '0.7rem' }}>↺ Volver tentar</button>}
    </div>
  );
}

// ── EDITOR DE DINÁMICAS COMPARTIDO ──
// Usado tanto en Guía coma en Admin → Dinámicas, para que a experiencia
// de edición sexa idéntica nos dous sitios.
export function Campo({label,children}){
  const {T}=useTheme();
  return(<div>
    <p style={{color:T.text3,...TYPE.label,margin:"0 0 0.3rem"}}>{label}</p>
    {children}
  </div>);
}

export function EditorDinamica({form,setForm,onGardar,onCancelar,editando,tiposDisponibles}){
  const {T}=useTheme();const S=mkS(T);
  const {esMovil}=useViewport();
  const tipos=tiposDisponibles||["calentamiento","entrenamiento","juego","formato","musical","pausa","cierre"];
  const valido=form.nombre.trim().length>0;
  return(<div style={{...S.panel,border:`1.5px solid ${T.accent}33`}}>
    <p style={S.ptitle(T.accent)}>{editando?"Editar dinámica":"Nova dinámica"}</p>
    <div style={{display:"grid",gap:"0.7rem"}}>
      <Campo label="Nome">
        <input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} style={S.input} autoFocus/>
      </Campo>
      <div style={{display:"grid",gridTemplateColumns:esMovil?"1fr":"1fr 1fr 1fr",gap:"0.5rem"}}>
        <Campo label="Tipo">
          <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} style={S.input}>
            {tipos.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </Campo>
        <Campo label="Duración (min)">
          <input type="number" inputMode="numeric" value={form.duracion} onChange={e=>setForm(f=>({...f,duracion:e.target.value}))} style={S.input}/>
        </Campo>
        <Campo label="Participantes">
          <input value={form.participantes} onChange={e=>setForm(f=>({...f,participantes:e.target.value}))} style={S.input}/>
        </Campo>
      </div>
      <Campo label="Descrición">
        <textarea value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} style={{...S.input,height:70,resize:"vertical"}}/>
      </Campo>
      <Campo label="Pasos (un por liña)">
        <textarea value={form.pasos} onChange={e=>setForm(f=>({...f,pasos:e.target.value}))} style={{...S.input,height:100,resize:"vertical"}}/>
      </Campo>
      <Campo label="Obxectivo">
        <input value={form.objetivo} onChange={e=>setForm(f=>({...f,objetivo:e.target.value}))} style={S.input}/>
      </Campo>
      <Campo label="Variantes (unha por liña)">
        <textarea value={form.variantes} onChange={e=>setForm(f=>({...f,variantes:e.target.value}))} style={{...S.input,height:70,resize:"vertical"}}/>
      </Campo>
    </div>
    <div style={{display:"flex",gap:"0.5rem",marginTop:"0.9rem"}}>
      <button onClick={onGardar} disabled={!valido} style={{...S.btn(T.accent),opacity:valido?1:0.4,flex:esMovil?1:"none"}}>Gardar</button>
      <button onClick={onCancelar} style={{...S.btn(T.bg3,T.text2),flex:esMovil?1:"none"}}>Cancelar</button>
    </div>
  </div>);
}

export const FORM_DINAMICA_BALEIRO={nombre:"",tipo:"calentamiento",duracion:10,participantes:"grupo",descripcion:"",pasos:"",objetivo:"",variantes:""};

export function dinamicaDesdeForm(form,editId){
  return {...form,id:editId||String(Date.now()),duracion:Number(form.duracion)||10,
    pasos:form.pasos.split("\n").map(s=>s.trim()).filter(Boolean),
    variantes:form.variantes.split("\n").map(s=>s.trim()).filter(Boolean)};
}

export function formDesdeDinamica(d){
  return {...d,duracion:d.duracion??10,participantes:d.participantes||"grupo",
    descripcion:d.descripcion||"",objetivo:d.objetivo||"",
    pasos:(d.pasos||[]).join("\n"),variantes:(d.variantes||[]).join("\n")};
}

export function useAudio() {
  const ctxRef=useRef(null);
  const getCtx=()=>{if(!ctxRef.current)ctxRef.current=new(window.AudioContext||window.webkitAudioContext)();if(ctxRef.current.state==="suspended")ctxRef.current.resume();return ctxRef.current;};
  const tone=useCallback((f,d=0.3,t="sine",v=0.4,t0=0)=>{try{const ctx=getCtx(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type=t;o.frequency.setValueAtTime(f,ctx.currentTime+t0);g.gain.setValueAtTime(v,ctx.currentTime+t0);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+t0+d);o.start(ctx.currentTime+t0);o.stop(ctx.currentTime+t0+d);}catch(e){}});
  const playBell=useCallback(()=>{tone(880,2,"sine",0.4);tone(1760,1.2,"sine",0.15);});
  const metroBeat=useCallback((bc,beats)=>{try{const ctx=getCtx(),isOne=bc%beats===0,f=isOne?1000:440,o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=f;const now=ctx.currentTime;g.gain.setValueAtTime(isOne?0.7:0.4,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.06);o.start(now);o.stop(now+0.1);}catch(e){}});
  return{tone,playBell,metroBeat};
}

// IM-M03. Antes era un elemento global permanente montado sempre en
// ImproApp. Agora ImproApp só o monta cando o usuario o pide, e admite dous
// modos: conta atrás e cronómetro ascendente.
export function TimerBar({audio,launchRef,onTimerChange,onClose}){
  const {T}=useTheme();
  const [modo,setModo]=useState("atras"); // atras | arriba
  const [display,setDisplay]=useState(300);
  const [preset,setPreset]=useState(300);
  const [running,setRunning]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const [editando,setEditando]=useState(false);
  const [borrador,setBorrador]=useState("");
  const ref=useRef(null);
  const atras=modo==="atras";
  const urgent=atras&&display>0&&display<10,warning=atras&&display>0&&display<30;

  useEffect(()=>{
    if(running){
      ref.current=setInterval(()=>{
        setDisplay(p=>{
          if(!atras)return p+1;                       // cronómetro: sobe sen límite
          if(p<=1){setRunning(false);audio.playBell();return 0;}
          return p-1;
        });
      },1000);
    } else clearInterval(ref.current);
    return()=>clearInterval(ref.current);
  },[running,atras]);

  useEffect(()=>{if(launchRef)launchRef.current=(secs)=>{setModo("atras");setPreset(secs);setDisplay(secs);setRunning(true);setExpanded(false);};},[launchRef]);
  useEffect(()=>{if(onTimerChange)onTimerChange(display,running,preset);},[display,running,preset]);

  const cambiarModo=m=>{setModo(m);setRunning(false);setDisplay(m==="atras"?preset:0);};
  const reiniciar=()=>{setRunning(false);setDisplay(atras?preset:0);};

  // Edición do tempo escribindo mm:ss ou só minutos
  const abrirEdicion=()=>{if(running)return;setBorrador(FMT(display));setEditando(true);};
  const confirmarEdicion=()=>{
    const t=borrador.trim();
    let secs=null;
    if(/^\d{1,3}$/.test(t)) secs=parseInt(t,10)*60;
    else if(/^\d{1,3}:[0-5]?\d$/.test(t)){const[m,s]=t.split(":");secs=parseInt(m,10)*60+parseInt(s,10);}
    if(secs!==null&&secs>=0&&secs<=359999){setDisplay(secs);if(atras)setPreset(secs);}
    setEditando(false);
  };

  const PRESETS=[30,60,120,180,300,600];
  const btnMini=activo=>({background:activo?T.accent+"22":T.bg3,border:`1px solid ${activo?T.accent:T.border}`,color:activo?T.accent:T.text3,borderRadius:7,padding:"0.22rem 0.55rem",fontSize:"0.76rem",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"});

  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:T.nav,borderTop:`1px solid ${T.navBorder}`,transition:"all 0.3s",paddingBottom:"env(safe-area-inset-bottom)"}}>
      {expanded&&(
        <div style={{padding:"0.55rem 0.75rem",borderBottom:`1px solid ${T.border}`,maxWidth:960,margin:"0 auto"}}>
          <div style={{display:"flex",gap:"0.4rem",marginBottom:"0.5rem"}}>
            <button onClick={()=>cambiarModo("atras")} style={{...btnMini(atras),flex:1}}>⏲ Conta atrás</button>
            <button onClick={()=>cambiarModo("arriba")} style={{...btnMini(!atras),flex:1}}>⏱ Cronómetro</button>
          </div>
          {atras&&<div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",justifyContent:"center"}}>
            {PRESETS.map(t=><button key={t} onClick={()=>{setPreset(t);setDisplay(t);setRunning(false);}} style={btnMini(preset===t)}>{FMT(t)}</button>)}
          </div>}
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 0.75rem",maxWidth:960,margin:"0 auto",minWidth:0}}>
        <button onClick={()=>setExpanded(!expanded)} title="Opcións" style={{background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:"0.9rem",padding:"0.2rem",flexShrink:0}}>{atras?"⏲":"⏱"}</button>

        {editando
          ?<input autoFocus value={borrador} onChange={e=>setBorrador(e.target.value)} onBlur={confirmarEdicion} onKeyDown={e=>{if(e.key==="Enter")confirmarEdicion();if(e.key==="Escape")setEditando(false);}} placeholder="mm:ss" style={{width:82,background:T.bg3,border:`1px solid ${T.accent}`,borderRadius:7,color:T.text,fontFamily:"monospace",fontWeight:900,fontSize:"1.1rem",textAlign:"center",padding:"0.2rem",flexShrink:0}}/>
          :<div onClick={abrirEdicion} title={running?"Detén para editar":"Toca para editar o tempo"} style={{fontFamily:"monospace",fontWeight:900,fontSize:"clamp(1rem,4vw,1.4rem)",color:urgent?"#ff6e40":warning?"#ffd740":T.text,textShadow:urgent?"0 0 20px #ff6e4066":"none",minWidth:70,cursor:running?"default":"text",flexShrink:0,animation:urgent?"urgentPulse 0.5s ease infinite alternate":"none"}}>{FMT(display)}</div>}

        <button onClick={()=>setRunning(!running)} style={{background:running?"#ff6e40":"#69f0ae",color:"#000",border:"none",borderRadius:7,padding:"0.35rem 0.8rem",fontWeight:700,cursor:"pointer",fontSize:"0.82rem",flexShrink:0}}>{running?"⏸":"▶"}</button>
        <button onClick={reiniciar} title="Reiniciar" style={{background:T.bg3,border:`1px solid ${T.border}`,color:T.text3,borderRadius:7,padding:"0.35rem 0.6rem",fontSize:"0.82rem",cursor:"pointer",flexShrink:0}}>↺</button>

        {atras
          ?<div style={{flex:1,height:4,background:T.bg4,borderRadius:2,overflow:"hidden",minWidth:20}}>
             <div style={{height:"100%",width:`${preset>0?(display/preset)*100:0}%`,background:urgent?"#ff6e40":warning?"#ffd740":T.accent,borderRadius:2,transition:"width 1s linear"}}/>
           </div>
          :<div style={{flex:1,minWidth:20}}/>}

        {onClose&&<button onClick={onClose} title="Pechar temporizador" style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"1rem",padding:"0.2rem 0.3rem",flexShrink:0}}>✕</button>}
      </div>
    </div>
  );
}

export function Spotlight({word,category,onClose}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"radial-gradient(ellipse at center,rgba(224,64,251,0.18) 0%,rgba(0,0,0,0.97) 70%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",animation:"fadeIn 0.3s ease"}}>
      <p style={{color:"#e040fb",fontFamily:"monospace",fontSize:"0.9rem",letterSpacing:"0.3em",marginBottom:"1.5rem",textTransform:"uppercase"}}>{category}</p>
      <h1 style={{fontSize:"clamp(2.5rem,9vw,7rem)",fontWeight:900,color:"#fff",textShadow:"0 0 60px rgba(224,64,251,0.6)",lineHeight:1.1,maxWidth:"80vw",textAlign:"center",animation:"spotlightIn 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}>{word}</h1>
      <p style={{color:"#555",marginTop:"3rem",fontSize:"0.82rem"}}>Toca para pechar</p>
    </div>
  );
}

export function QRCode({value,size=180}){
  const {T}=useTheme();
  const bg=T.bg2.replace("#",""),fg=T.text.replace("#","");
  return <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=${bg}&color=${fg}&margin=2`} alt="QR" width={size} height={size} style={{borderRadius:8,display:"block"}}/>;
}
