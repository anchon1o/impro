// ═══════════════════════════════════════════════════════════════════
// UNIVERSO — Plantillas de ficha (IM-M06 / M07)
//
// Decisión de deseño: as CATEGORÍAS viven na base de datos (o admin
// pode crealas e editalas), pero as PLANTILLAS viven aquí, no código.
//
// Por que non todo en base de datos:
//   · As catro plantillas son unha taxonomía estable. As categorías non:
//     mañá pode facer falta «Podcast» ou «Editorial».
//   · Cada tipo de campo precisa un compoñente que o pinte e o valide.
//     Iso é código igualmente; telo declarado en SQL só engade unha
//     indirección sen gañar flexibilidade real.
//   · A táboa de edición masiva (M09) precisa saber as columnas para
//     construír a grella. Derivalas dunha constante é directo.
//
// O que SI é configurable desde Admin: que categorías existen, con que
// plantilla, e cales dos campos opcionais se activan en cada unha
// (columna `campos_activos` de `universo_categorias`).
//
// Os campos gárdanse na columna `datos` (jsonb) de `universo`. Só se
// escriben os que teñan contido, así que a regra «na ficha só se amosan
// os campos con contido» sae soa do modelo.
// ═══════════════════════════════════════════════════════════════════

// Tipos admitidos. Cada un terá o seu editor e o seu validador.
//   texto · texto_longo · numero · data · url · lista (array de textos)
export const TIPOS_CAMPO = ["texto","texto_longo","numero","data","url","lista"];

// Campos comúns a TODAS as fichas. Son columnas reais de `universo`,
// non van en `datos`.
export const CAMPOS_COMUNS = [
  {id:"nome",       tipo:"texto",       label:"Nome",       obrigatorio:true,  columna:true},
  {id:"tipo",       tipo:"texto",       label:"Categoría",  obrigatorio:true,  columna:true},
  {id:"descricion", tipo:"texto_longo", label:"Descrición", obrigatorio:true,  columna:true},
  {id:"pais",       tipo:"texto",       label:"País",       obrigatorio:false, columna:true},
  {id:"cidade",     tipo:"texto",       label:"Cidade",     obrigatorio:false, columna:true},
  {id:"logo",       tipo:"texto",       label:"Emoji",      obrigatorio:false, columna:true},
  {id:"logo_url",   tipo:"url",         label:"Logo (URL)", obrigatorio:false, columna:true},
  {id:"tags",       tipo:"lista",       label:"Etiquetas",  obrigatorio:false, columna:true},
];

// Ligazóns: forma pechada, columna `ligazons` (jsonb).
// Cada rede acepta o formato natural de escribila. Instagram e YouTube
// admiten @usuario, que é como a xente os comparte; a ficha convérteos en
// enlace completo. Quitouse Bluesky: apenas se usa no ámbito do impro.
export const LIGAZONS = [
  {id:"web",       label:"Web",       emoji:"🌐", placeholder:"improapp.gal"},
  {id:"instagram", label:"Instagram", emoji:"📸", placeholder:"@usuario", base:"https://instagram.com/"},
  {id:"youtube",   label:"YouTube",   emoji:"▶️", placeholder:"@canal",   base:"https://youtube.com/"},
  {id:"facebook",  label:"Facebook",  emoji:"👤", placeholder:"páxina",   base:"https://facebook.com/"},
  // `outras` é un array libre: [{etiqueta, url}]
];

// Converte o que se escribiu nunha URL navegable.
//   "@improapp"              → https://instagram.com/improapp
//   "improapp.gal"           → https://improapp.gal
//   "https://improapp.gal"   → tal cal
export function urlLigazon(id, valor) {
  const v = String(valor || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  const def = LIGAZONS.find(l => l.id === id);
  if (v.startsWith("@") && def?.base) return def.base + v.slice(1);
  if (def?.base && !v.includes(".") && !v.includes("/")) return def.base + v;
  return "https://" + v.replace(/^\/+/, "");
}

// Como amosalo na ficha: curto e lexible.
export function etiquetaLigazon(id, valor) {
  const v = String(valor || "").trim();
  if (v.startsWith("@")) return v;
  return v.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}

// Campos opcionais por plantilla. Van todos en `datos` (jsonb).
export const PLANTILLAS = {
  entidade:{
    label:"Entidade",
    axuda:"Compañías, escolas, colectivos, persoas. Algo que existe de forma continuada.",
    campos:[
      {id:"fundadores",   tipo:"lista",  label:"Fundadores"},
      {id:"membros",      tipo:"lista",  label:"Membros"},
      {id:"responsables", tipo:"lista",  label:"Responsables"},
      {id:"data_inicio",  tipo:"data",   label:"En activo desde", columna:true},
      {id:"data_fin",     tipo:"data",   label:"Ata",             columna:true},
      {id:"activo",       tipo:"texto",  label:"Estado",          columna:true},
      {id:"formacion",    tipo:"texto",  label:"Imparte formación"},
    ],
  },
  proxecto:{
    label:"Proxecto ou actividade",
    axuda:"Espectáculos, formatos, iniciativas concretas. Ten autoría e pode estar en xira.",
    campos:[
      {id:"autoria",     tipo:"texto",       label:"Autoría"},
      {id:"direccion",   tipo:"texto",       label:"Dirección"},
      {id:"elenco",      tipo:"lista",       label:"Elenco"},
      {id:"produccion",  tipo:"texto",       label:"Produción"},
      {id:"estrea",      tipo:"texto",       label:"Estrea"},
      {id:"duracion",    tipo:"numero",      label:"Duración (min)"},
      {id:"xiras",       tipo:"lista",       label:"Onde se presentou"},
      {id:"licencia",    tipo:"texto_longo", label:"Condicións de montaxe"},
    ],
  },
  evento:{
    label:"Evento",
    axuda:"Festivais e encontros con edicións periódicas.",
    campos:[
      {id:"organiza",     tipo:"texto",  label:"Organiza"},
      {id:"periodicidade",tipo:"texto",  label:"Periodicidade"},
      {id:"edicions",     tipo:"numero", label:"Nº de edicións"},
      {id:"primeira",     tipo:"data",   label:"Primeira edición"},
      {id:"sede",         tipo:"texto",  label:"Sede habitual"},
      {id:"participantes",tipo:"lista",  label:"Participantes destacados"},
    ],
  },
  lugar:{
    label:"Lugar",
    axuda:"Salas, sedes e espazos con actividade estable.",
    campos:[
      {id:"enderezo", tipo:"texto",  label:"Enderezo"},
      {id:"aforo",    tipo:"numero", label:"Aforo"},
      {id:"xestiona", tipo:"texto",  label:"Xestionado por"},
      {id:"apertura", tipo:"data",   label:"En funcionamento desde"},
      {id:"servizos", tipo:"lista",  label:"Servizos"},
    ],
  },
};

// Campos efectivos dunha categoría: os comúns + os da súa plantilla,
// filtrados polos que o admin deixara activos.
export function camposDeCategoria(categoria){
  const p = PLANTILLAS[categoria?.plantilla] || PLANTILLAS.entidade;
  const activos = categoria?.campos_activos;
  const opcionais = Array.isArray(activos)
    ? p.campos.filter(c => activos.includes(c.id))
    : p.campos;
  return {comuns:CAMPOS_COMUNS, opcionais, plantilla:p};
}

// Valida unha ficha. Devolve [] se está ben, ou lista de erros.
// Compártese entre o formulario de proposta (M08) e a táboa masiva (M09):
// unha soa fonte de verdade para as dúas.
// ⚠️ ALIAS DE CAMPO. A columna da base de datos chámase `descricion`, pero o
// cliente traballa con `desc` desde o principio. Ese dobre nome xa causou
// dous fallos: unha descrición cuberta dábase por baleira na validación, e
// TabReto amosaba `desc` onde as dinámicas gardan `descripcion`.
// A partir de aquí resólvese nun só sitio, para que ningún consumidor teña
// que saber cal é o nome «bo».
export const ALIAS = { descricion: ['descricion', 'desc'] };

export function valorCampo(ficha, id) {
  for (const k of (ALIAS[id] || [id])) {
    const v = ficha?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return ficha?.datos?.[id];
}

export function validarFicha(ficha, categoria){
  const erros=[];
  const {comuns,opcionais}=camposDeCategoria(categoria);
  const val=id=>comuns.some(c=>c.id===id&&c.columna)?valorCampo(ficha,id):ficha?.datos?.[id];

  for(const c of comuns){
    if(c.obrigatorio && !String(val(c.id)??"").trim())
      erros.push({campo:c.id, msg:`${c.label} é obrigatorio`});
  }
  for(const c of [...comuns,...opcionais]){
    const v=val(c.id);
    if(v===undefined||v===null||v==="") continue;
    if(c.tipo==="numero" && isNaN(Number(v)))
      erros.push({campo:c.id, msg:`${c.label} debe ser un número`});
    if(c.tipo==="data" && isNaN(Date.parse(v)))
      erros.push({campo:c.id, msg:`${c.label} debe ser unha data válida`});
    if(c.tipo==="url" && !/^https?:\/\/.+\..+/.test(String(v)))
      erros.push({campo:c.id, msg:`${c.label} debe ser unha URL completa (https://…)`});
    if(c.tipo==="lista" && !Array.isArray(v))
      erros.push({campo:c.id, msg:`${c.label} debe ser unha lista`});
  }
  for(const [k,v] of Object.entries(ficha?.ligazons||{})){
    if(k==="outras"||!v) continue;
    const t=String(v).trim();
    // Acéptase @usuario, dominio solto ou URL completa. Só se rexeita o que
    // non pode chegar a ser un enderezo.
    const ok = t.startsWith("@") || /^https?:\/\/.+\..+/.test(t) || /^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(t) || /^[\w.-]+$/.test(t);
    if(!ok) erros.push({campo:`ligazons.${k}`, msg:`A ligazón de ${k} non parece válida`});
  }
  return erros;
}


// ─────────────────────────────────────────────
// CAMPOS DE LISTA
// ─────────────────────────────────────────────
// Compártense entre o formulario e a táboa masiva. Antes cada un tiña a súa
// copia e comportábanse distinto: nun podíanse escribir comas e no outro non.
export const listaDesdeTexto = t =>
  String(t ?? '').split(/[\n,]/).map(s => s.trim()).filter(Boolean);

export const textoDesdeLista = v =>
  Array.isArray(v) ? v.join(', ') : (v ?? '');

// Normaliza unha ficha vinda de calquera orixe ao formato do cliente.
export function normalizarFicha(f) {
  const out = { ...f };
  if (out.descricion !== undefined && out.desc === undefined) out.desc = out.descricion;
  if (out.desc !== undefined && out.descricion === undefined) out.descricion = out.desc;
  if (!Array.isArray(out.tags)) out.tags = listaDesdeTexto(out.tags);
  return out;
}
