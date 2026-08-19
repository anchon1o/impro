// ============================================================
// datos.js — Contido estático da app
// Dinámicas, plantillas, playlists, efectos, manual e Universo Impro.
// Separado de ImproApp.jsx para manter o compoñente principal lexible.
// ============================================================

export const PLANTILLAS_BASE=[
  {label:"Clásica",cats:["PROFESIÓN","LUGAR","EMOCIÓN"]},
  {label:"Conflicto",cats:["PROFESIÓN","ACCIÓN","EMOCIÓN"]},
  {label:"Absurda",cats:["SUPERPODER","LUGAR","CONFESIÓN"]},
  {label:"Dramática",cats:["NOMBRE","LUGAR","FRASE"]},
  {label:"Cine",cats:["PROFESIÓN","ESTILO","EMOCIÓN"]},
  {label:"Completa",cats:["PROFESIÓN","LUGAR","EMOCIÓN","ACCIÓN"]},
];

export const PLANTILLAS=[
  {id:"p1",nombre:"Entrenamiento estándar 90 min",descripcion:"Sesión equilibrada",bloques:[{tipo:"calentamiento",titulo:"Calentamiento físico",duracion:15,notas:"Zip Zap Zop"},{tipo:"entrenamiento",titulo:"Ejercicios de base",duracion:25,notas:"Sí y..."},{tipo:"pausa",titulo:"Descanso",duracion:10,notas:""},{tipo:"juego",titulo:"Juego libre",duracion:20,notas:"Película en géneros"},{tipo:"formato",titulo:"Formato completo",duracion:15,notas:"Harold corto"},{tipo:"cierre",titulo:"Cierre",duracion:5,notas:"Ronda de una palabra"}]},
  {id:"p2",nombre:"Calentamiento rápido 30 min",descripcion:"Antes de un show",bloques:[{tipo:"calentamiento",titulo:"Activación rápida",duracion:10,notas:"Zip Zap Zop"},{tipo:"entrenamiento",titulo:"Escenas cortas",duracion:15,notas:"Sí y..."},{tipo:"cierre",titulo:"Foco",duracion:5,notas:"Círculo de silencio"}]},
  {id:"p3",nombre:"Show Harold 60 min",descripcion:"Harold completo",bloques:[{tipo:"calentamiento",titulo:"Calentamiento",duracion:15,notas:""},{tipo:"formato",titulo:"Harold completo",duracion:45,notas:"Con sugerencia del público"}]},
  {id:"p4",nombre:"Sesión musical 75 min",descripcion:"Impro con música",bloques:[{tipo:"calentamiento",titulo:"Beatbox colectivo",duracion:10,notas:""},{tipo:"musical",titulo:"Género musical",duracion:15,notas:""},{tipo:"pausa",titulo:"Descanso",duracion:7,notas:""},{tipo:"musical",titulo:"Canción del personaje",duracion:15,notas:""},{tipo:"musical",titulo:"El musical en 5 min",duracion:15,notas:""},{tipo:"cierre",titulo:"Ronda de una palabra",duracion:5,notas:""}]},
];

export const POMO_PRESETS=[
  {label:"Estándar",bloques:[{t:"trabajo",n:"Exercicio",m:20},{t:"descanso",n:"Descanso",m:5},{t:"trabajo",n:"Exercicio",m:20},{t:"descanso",n:"Descanso",m:5},{t:"trabalho",n:"Exercicio",m:20},{t:"longo",n:"Descanso longo",m:15}]},
  {label:"Show",bloques:[{t:"trabajo",n:"Calentamento",m:15},{t:"trabajo",n:"Formato 1",m:20},{t:"descanso",n:"Pausa",m:10},{t:"trabajo",n:"Formato 2",m:20}]},
  {label:"Maratón",bloques:[{t:"trabajo",n:"Calentamento",m:15},{t:"trabajo",n:"Bloque 1",m:25},{t:"descanso",n:"Descanso",m:5},{t:"trabajo",n:"Bloque 2",m:25},{t:"descanso",n:"Descanso",m:5},{t:"trabajo",n:"Bloque 3",m:25}]},
];

// ── DINÁMICAS ──
// As 247 dinámicas base vivían aquí: 160 kB que se descargaban en cada
// visita, abrísese ou non a Guía, e que só se podían editar despregando.
// Agora viven na táboa `dinamicas` de Supabase (supabase_dinamicas_seed.sql)
// e edítanse desde Admin → Dinámicas.
//
// ⚠️ Non volver poñer aquí un catálogo de reserva. Se a Guía sae baleira,
// o que pasa é que falta executar a sementeira, e a propia app xa o di.
// Un fallback no código volvería agochar ese fallo, que é exactamente o
// que fixo que B17 tardase tanto en verse.

// PLAYLISTS_DEFAULT borrouse: as 8 URLs estaban baleiras e ningunha
// pantalla a usaba. A música vive agora en Sonido.

export const EFECTOS_DEFAULT=[
  {id:"aplausos",nombre:"Aplausos",emoji:"👏",url:""},
  {id:"campana",nombre:"Campana",emoji:"🔔",url:""},
  {id:"bien",nombre:"¡Bien!",emoji:"⭐",url:""},
  {id:"buzzer",nombre:"Buzzer",emoji:"🚨",url:""},
  {id:"risas",nombre:"Risas",emoji:"😂",url:""},
  {id:"drum",nombre:"Redoble",emoji:"🥁",url:""},
  {id:"fanfare",nombre:"Fanfarria",emoji:"🎺",url:""},
  {id:"error",nombre:"Error",emoji:"❌",url:""},
];

export const MANUAL_SECCIONES=[
  {id:"inicio",emoji:"🏠",titulo:"Pantalla de inicio",intro:"A app abre nunha botonera con todas as áreas á vista. O logo 🎭 da cabeceira devólvete aquí desde calquera sitio.",items:[
    {t:"Por que existe",d:"Antes a app abría en Xerar e o resto de áreas só se alcanzaban pola tira de pestanas, que en móbil hai que desprazar para descubrir o que hai ao final. Na botonera todas as áreas teñen o mesmo peso e o mesmo tamaño de pulsación."},
    {t:"Que cambia na interface",d:"Na botonera non se mostra a tira de pestanas: a propia botonera é a navegación. Ao entrar nunha área aparece o menú horizontal de sempre para moverte entre seccións sen volver ao inicio."},
    {t:"Etiqueta «conta»",d:"As tarxetas de Sesións, Grupos e QR levan esa marca porque precisan iniciar sesión. Podes entrar igualmente e ver o que fan; pediráseche a conta ao gardar."},
  ]},
  {id:"generar",emoji:"🎲",titulo:"Xerador de estímulos",intro:"1.653 estímulos reais do grupo de impro. Xera palabras e escenas para exercicios.",items:[
    {t:"Categorías",d:"11 categorías: PROFESIÓN, LUGAR, EMOCIÓN, ACCIÓN, OBXECTO, SUPERPODER, ESTILO, DUDA, CONFESIÓN, FRASE e NOME. Cada unha ten nivel Simple (máis accesible) e Plus (máis creativo)."},
    {t:"Escena combinada",d:"Pestana 🎬 Escena: combina varias categorías para xerar unha escena completa. Usa plantillas rápidas (Clásica, Conflito, Absurda...) ou escolle manualmente. O botón 🔒 conxela elementos para rexenerar só o resto."},
    {t:"Spotlight",d:"Toca calquera estímulo xerado para mostralo en pantalla completa ao grupo. Ideal para que todos o vexan á vez."},
    {t:"Favoritos",d:"Garda estímulos con ♡. Accede a todos os gardados dende a pestana ♡."},
  ]},
  {id:"reto",emoji:"⚡",titulo:"Xerador de retos",intro:"Combina unha dinámica cos seus estímulos nun reto listo para usar de inmediato.",items:[
    {t:"Como funciona",d:"Selecciona nivel Simple ou Plus e preme Xerar reto. A app escolle unha dinámica aleatoria da biblioteca e asígnalle estímulos compatibles automaticamente."},
    {t:"O reto",d:"Ves a dinámica, os estímulos asociados e un resumo: 'Fai X usando Y en Z minutos'. Un clic e tes un exercicio completo."},
  ]},
  {id:"guia",emoji:"📖",titulo:"Biblioteca de dinámicas",intro:"Máis de 85 exercicios e xogos de impro documentados.",items:[
    {t:"Filtros e busca",d:"Filtra por tipo (calentamento, entrenamento, xogo, formato, musical, pausa, peche) ou busca por nome e descrición."},
    {t:"Favoritas",d:"Marca dinámicas con ★ para acceder rapidamente. Filtro especial '★ Favoritas'."},
    {t:"Detalle completo",d:"Cada dinámica ten descrición, pasos numerados, obxectivo pedagóxico e variantes. Toca calquera para ver o detalle completo."},
    {t:"Crear e editar",d:"Engade as túas propias dinámicas con todos os campos. Edita ou elimina as existentes."},
  ]},
  {id:"sesiones",emoji:"📋",titulo:"Planificación de sesións",intro:"Organiza, rexistra e cronometra as túas sesións de ensaio.",items:[
    {t:"Plantillas",d:"4 plantillas predefinidas: Entrenamento estándar 90min, Calentamento rápido 30min, Show Harold 60min e Sesión musical 75min. Cárgaas e modifícaas ao teu gusto."},
    {t:"Bloques",d:"Cada sesión ten bloques con tipo (calentamento, entrenamento, xogo...), título, duración e notas. Marca como completados durante a sesión."},
    {t:"Timer integrado",d:"Cada bloque ten ▶ timer que lanza o temporizador flotante (barra inferior) coa duración exacta do bloque."},
    {t:"Historial",d:"As sesións gardadas quedan en Supabase con data, minutos totais e bloques completados."},
    {t:"Modo ensaio 🍅",d:"Pomodoro adaptado a impro. Presets: Estándar, Show e Maratón. A app xestiona os tempos e avisa con son ao cambiar de bloque."},
  ]},
  {id:"show",emoji:"🎛",titulo:"Cabina de son e escaleta",intro:"Panel completo para xestionar un show en directo.",items:[
    {t:"Audio — pistas múltiples",d:"Pestana 🎵 Audio: engade pistas de música simultáneas con volume independente por pista. Soporta YouTube embed e MP3 directo. Parar todas cun clic."},
    {t:"Efectos de son",d:"Pestana 🔊 Efectos: 8 efectos con síntese de audio (aplausos, campá, buzzer...). Asigna URLs MP3 propias para usar os teus sons."},
    {t:"Metrónomo",d:"Pestana 🥁 Metro: control de BPM de 30 a 240, visualización de pulsos, presets rápidos. Útil para escenas musicais."},
    {t:"Rundown",d:"Pestana 📋 Rundown: guión do show con actuacións ordenadas. Marca como activa (▶) ou completada (✓). Reordena con ▲▼."},
    {t:"Sorteo",d:"Pestana 🎲 Sorteo: sorteo de parellas, equipos e roles. Xerador de número 1-9 e letra aleatoria."},
  ]},
  {id:"modos",emoji:"🖥",titulo:"Modos de visualización",intro:"Hai tres formas distintas de ver a app durante un ensaio ou un show. Convén saber cal usar en cada momento.",items:[
    {t:"Vista normal",d:"A de sempre: cabeceira, pestanas e contido. É a que usas para preparar, consultar dinámicas, planificar sesións e administrar. Non está pensada para proxectar."},
    {t:"🎬 En directo",d:"Botón azul na cabeceira. Panel unificado de directo que xunta nunha soa pantalla o estímulo actual, o temporizador, o audio, os efectos, o rundown e o QR. Está pensado para o dispositivo que TI manexas durante a función, para non ter que cambiar de pestana no medio dunha escena. Ábrese enriba de todo e péchase co seu botón."},
    {t:"📺 Proxección",d:"Botón 📺 da cabeceira. É a vista que ve o PÚBLICO: estímulo grande, temporizador e rundown, sen controis nin nada que estorbe. Pensada para o proxector ou a segunda pantalla. Amosa avisos automáticos aos 30 e aos 10 segundos, e cando remata o tempo."},
    {t:"Cal uso e cando",d:"Preparación e ensaio → Cabina. Durante a función, no teu dispositivo → En directo. No proxector que ve a sala → Proxección. En directo e Proxección pódense ter abertos á vez: o que xeras nun reflíctese no outro."},
    {t:"Os nomes",d:"A pestana 🎛 Cabina é onde PREPARAS: audio, efectos, metrónomo e escaleta. 🎬 En directo é o panel que manexas DURANTE a función. 📺 Proxección é o que ve a sala. Antes chamábanse Show, Modo Show e Pantalla Pública, e as dúas primeiras confundíanse decote."},
  ]},
  {id:"temporizador",emoji:"⏱",titulo:"Temporizador",intro:"Ferramenta opcional. Non aparece ata que a pides, e péchase cando remates.",items:[
    {t:"Como abrilo",d:"En escritorio, o botón ⏱ da cabeceira. En móbil, dentro do menú ⋯. Ábrese como barra fixa na parte inferior e péchase co ✕. Mentres está pechado recuperas ese espazo de pantalla."},
    {t:"Dous modos",d:"⏲ Conta atrás para limitar unha escena ou un exercicio, con campá ao rematar e barra de progreso. ⏱ Cronómetro ascendente para medir canto dura algo sen límite previo. Cámbiase no despregable da esquerda."},
    {t:"Editar o tempo",d:"Toca as cifras cando estea detido e escribe. Acepta só minutos («5») ou minutos e segundos («4:30»). Tamén hai presets rápidos de 30 s a 10 min en conta atrás."},
    {t:"Controis",d:"▶ inicia ou continúa, ⏸ pausa, ↺ reinicia ao valor de partida. Desde Sesións tamén se pode lanzar directamente cun tempo dado: se o temporizador estaba pechado, ábrese só."},
    {t:"No proxector",d:"O que marca o temporizador reflíctese na Pantalla Pública, para que a sala vexa o tempo que queda."},
  ]},
  {id:"grupos",emoji:"👥",titulo:"Xestor de grupos",intro:"Xestiona os teus grupos de impro con membros e estadísticas.",items:[
    {t:"Crear grupo",d:"Nome, cor e lista de membros. O grupo activo úsase para rastrexar estatísticas específicas por grupo."},
    {t:"Activar grupo",d:"Só un grupo pode estar activo á vez. As categorías xeradas rexístranse nas estatísticas do grupo activo."},
    {t:"Estatísticas",d:"Cada grupo acumula datos de categorías xeradas e número de sesións realizadas."},
  ]},
  {id:"qr",emoji:"📱",titulo:"QR para o público",intro:"Recolle propostas do público en tempo real durante o show.",items:[
    {t:"Configurar sala",d:"Preme '⚙️ Configurar e abrir sala'. Escolle preguntas dos presets ou escribe as túas propias (ex: 'Dime un secreto inconfesable'). Podes ter 1 ou máis preguntas por sala."},
    {t:"Abrir sala",d:"Xérase un código de 4 letras e un QR. O público escanea e ve a pregunta concreta que ti configuraches. Sen necesidade de conta nin instalación."},
    {t:"Tempo real",d:"As propostas aparecen en tempo real grazas a Supabase Realtime. Acepta propostas para engadilas ás ideas do grupo."},
    {t:"Unirse como público",d:"O público introduce o código de 4 letras ou escanea o QR. Ve a pregunta e envía a súa resposta."},
  ]},
  {id:"universo",emoji:"🌍",titulo:"Universo Impro",intro:"Directorio de compañías, festivais, escolas e persoas do mundo do impro.",items:[
    {t:"Contido",d:"Máis de 20 entradas: compañías de referencia mundial (Second City, UCB, iO, Loose Moose...), festivais internacionais, escolas e figuras históricas como Keith Johnstone, Viola Spolin e Del Close."},
    {t:"Filtros",d:"Filtra por tipo: Compañías, Festivais, Escolas, Persoas, Proxectos. Busca por nome, descrición ou etiquetas."},
    {t:"Detalle",d:"Cada entrada ten descrición completa, ubicación, etiquetas temáticas e enlace á web oficial."},
  ]},
  {id:"ajustes",emoji:"⚙️",titulo:"Axustes",intro:"Configuración xeral e tradución da interface.",items:[
    {t:"Idioma",d:"Cambia entre Castelán (base), Galego e Inglés. Os campos sen traducir mostran o castelán por defecto."},
    {t:"Tradución",d:"Exporta un JSON con todo o contido traducible e impórtao de volta despois de traducilo. Fluxo: exportar → traducir con Claude → importar."},
    {t:"Tema",d:"Alterna entre modo escuro (por defecto, fondo #0d0d0d) e modo claro dende o botón ☀️/🌙 da cabeceira."},
  ]},
  {id:"admin",emoji:"🔐",titulo:"Panel de administración",intro:"Xestión avanzada. PIN por defecto: 1234.",items:[
    {t:"Estímulos",d:"Engade, edita ou elimina estímulos de calquera categoría e nivel. Os cambios gárdanse en Supabase e son visibles en todos os dispositivos."},
    {t:"Dinámicas",d:"Lista completa de dinámicas con filtro por tipo. Elimina as que non queiras."},
    {t:"Estatísticas",d:"Totais de estímulos xerados, minutos de ensaio e sesións. Gráfica das categorías máis usadas."},
    {t:"Config",d:"Cambia o PIN de admin. Borra datos locais (favoritos, historial). Información da app."},
  ]},
];

export const UNIVERSO_DATA = [
  {id:"u38",tipo:"compañía",nome:"Improvisual Project",pais:"🇨🇴",cidade:"Bogotá, Colombia",desc:"Compañía con máis de 12 anos de traxectoria, creadora do long form «Trilogía del error» (2013), estreado no festival «Mendoza te improvisa» e presentado en Córdoba, Buenos Aires, Lima, Arequipa, Cusco, Bogotá e Barcelona. Tamén imparte formación en habilidades brandas para empresas.",web:"improvisualproject.com",tags:["long form","colombia","formación","xira internacional"],logo:"🎭"},
  // ── Internacional — histórico, verificado ──
  {id:"u1",tipo:"compañía",nome:"Loose Moose Theatre",pais:"🇨🇦",cidade:"Calgary, Canadá",desc:"Fundada por Keith Johnstone, creador do Theatresports e do Maestro. Un dos centros de impro máis influentes do mundo.",web:"loosemoose.com",tags:["theatresports","johnstone","formato"],logo:"🫎"},
  {id:"u2",tipo:"compañía",nome:"The Second City",pais:"🇺🇸",cidade:"Chicago, EUA",desc:"A compañía de impro e sketch máis famosa do mundo. Alumni: Tina Fey, Steve Carell, Bill Murray, Amy Poehler.",web:"secondcity.com",tags:["sketch","longform","comedy"],logo:"🎭"},
  {id:"u3",tipo:"compañía",nome:"Upright Citizens Brigade",pais:"🇺🇸",cidade:"Nueva York/LA, EUA",desc:"Escola e teatro fundado por Amy Poehler. Referente do formato Harold e o longform en NY.",web:"ucbtheatre.com",tags:["harold","longform","UCB"],logo:"🎪"},
  {id:"u4",tipo:"compañía",nome:"iO Theater",pais:"🇺🇸",cidade:"Chicago, EUA",desc:"Fundado por Del Close e Charna Halpern. Creadores do Harold. A escola máis influente do longform.",web:"ioimprov.com",tags:["harold","Del Close","longform"],logo:"🎬"},
  {id:"u13",tipo:"escola",nome:"Loose Moose School",pais:"🇨🇦",cidade:"Calgary, Canadá",desc:"A escola orixinal de Keith Johnstone. Forma a facilitadores e actores en todo o mundo.",web:"loosemoose.com",tags:["escola","johnstone","formación"],logo:"📚"},
  {id:"u14",tipo:"escola",nome:"Second City Training Centre",pais:"🇺🇸",cidade:"Chicago/Toronto",desc:"Programa de formación do Second City. Un dos máis reputados do mundo para actores de comedia.",web:"secondcity.com/training",tags:["escola","formación","sketch"],logo:"🎓"},
  {id:"u16",tipo:"persoa",nome:"Keith Johnstone",pais:"🇬🇧",cidade:"Calgary (orixe: UK)",desc:"O pai do impro moderno. Creou o Theatresports, o Maestro e os conceptos de status e oferta/bloqueo. Autor de 'Impro' e 'Impro for Storytellers'.",web:"keithjohnstone.com",tags:["fundador","teórico","Theatresports"],logo:"👴"},
  {id:"u17",tipo:"persoa",nome:"Del Close",pais:"🇺🇸",cidade:"Chicago, EUA",desc:"Co-creador do Harold con Charna Halpern. Influencia central en toda a tradición do longform americano.",web:"",tags:["Harold","longform","iO"],logo:"🎭"},
  {id:"u18",tipo:"persoa",nome:"Viola Spolin",pais:"🇺🇸",cidade:"Chicago, EUA",desc:"Pioneira do impro teatral. Creou os 'Theater Games', base de todo o impro moderno. Nai de Paul Sills, fundador do Second City.",web:"",tags:["pioneira","theater games","orixe"],logo:"👩"},
  {id:"u19",tipo:"persoa",nome:"Charna Halpern",pais:"🇺🇸",cidade:"Chicago, EUA",desc:"Co-fundadora do iO Theater con Del Close. Impulsora do longform e do Harold. Autora de 'Truth in Comedy'.",web:"iochicago.com",tags:["Harold","iO","longform"],logo:"👩‍🎭"},
  {id:"u22",tipo:"persoa",nome:"Paul Sills",pais:"🇺🇸",cidade:"Chicago, EUA",desc:"Fundador do Second City, fillo de Viola Spolin. Levou os Theater Games ao escenario profesional.",web:"",tags:["fundador","Second City","theater games"],logo:"🎭"},
  {id:"u23",tipo:"persoa",nome:"Amy Poehler",pais:"🇺🇸",cidade:"Nueva York, EUA",desc:"Cofundadora do Upright Citizens Brigade, figura clave en popularizar o longform na cultura mainstream.",web:"",tags:["UCB","longform","fundadora"],logo:"🎤"},
  {id:"u24",tipo:"persoa",nome:"Tina Fey",pais:"🇺🇸",cidade:"Chicago, EUA",desc:"Alumna e logo directora artística do Second City, referente de como o impro alimenta a escritura de comedia.",web:"",tags:["Second City","comedia","escritura"],logo:"✍️"},

  // ── Madrid — verificado por busca web ──
  {id:"u25",tipo:"compañía",nome:"Impromadrid Teatro",pais:"🇪🇸",cidade:"Madrid, España",desc:"Compañía fundada en 1999 na Liga de Improvisación Madrileña. Máis de 15 producións propias e xiras por 15 países. Organizadora do FESTIM.",web:"impromadrid.com",tags:["España","Madrid","FESTIM"],logo:"🎭"},
  {id:"u26",tipo:"festival",nome:"FESTIM",pais:"🇪🇸",cidade:"Madrid, España",desc:"Festival Internacional de Improvisación Teatral de Madrid, organizado por Impromadrid Teatro. O único festival internacional de impro de España, con apoio da Comunidade de Madrid.",web:"impromadrid.com",tags:["festival","España","internacional"],logo:"🎉"},
  {id:"u27",tipo:"compañía",nome:"Impro Impar",pais:"🇪🇸",cidade:"Madrid, España",desc:"Compañía e escola fundada en 2008. Espectáculos propios como 'En Plan Improvisado' e '7 Words', ademais de formación regular.",web:"improimpar.com",tags:["España","Madrid","escola"],logo:"🎭"},
  {id:"u28",tipo:"escola",nome:"ImproCafé",pais:"🇪🇸",cidade:"Madrid, España",desc:"Escola madrileña con mostras públicas ao final de cada trimestre e shows semanais de alumnos en La Escalera de Jacob.",web:"improcafe.es",tags:["España","Madrid","escola"],logo:"☕"},
  {id:"u29",tipo:"compañía",nome:"WIT Impro",pais:"🇪🇸",cidade:"Madrid, España",desc:"Escola e teatro de impro madrileño con niveis de iniciación a avanzado e laboratorio de creación de formatos propios.",web:"vivirsinguion.com",tags:["España","Madrid","escola"],logo:"🎪"},

  // ── Galicia — verificado por busca web ──
  {id:"u30",tipo:"compañía",nome:"Los Duguis",pais:"🇪🇸",cidade:"A Coruña, Galicia",desc:"Compañía coruñesa de impro con longa traxectoria, shows regulares e participación no Campionato Galego de Improvisación. Con Oswaldo Digón e Marita Martínez entre os seus membros.",web:"",tags:["Galicia","A Coruña","veterana"],logo:"🎭"},
  {id:"u31",tipo:"compañía",nome:"Improperio",pais:"🇪🇸",cidade:"Vigo, Galicia",desc:"Compañía viguesa de improvisación teatral, participante habitual do Campionato Galego de Improvisación (IMPROFIGHTERS!).",web:"",tags:["Galicia","Vigo"],logo:"🎭"},
  {id:"u32",tipo:"compañía",nome:"The Momento",pais:"🇪🇸",cidade:"Santiago de Compostela, Galicia",desc:"Compañía compostelá de impro, participante do Campionato Galego de Improvisación e de mostras organizadas polo Centro Dramático Galego.",web:"",tags:["Galicia","Santiago"],logo:"🎭"},
  {id:"u33",tipo:"compañía",nome:"Improversados",pais:"🇪🇸",cidade:"Santiago de Compostela, Galicia",desc:"Compañía compostelá con shows mensuais itinerantes por distintos puntos de Galicia (Santiago, Coruña, Lugo...). Xestiona a escola Subterránea.",web:"",tags:["Galicia","Santiago","escola propia"],logo:"📖"},
  {id:"u34",tipo:"escola",nome:"Subterránea",pais:"🇪🇸",cidade:"Santiago de Compostela, Galicia",desc:"Escola de improvisación teatral e musical creada por Improversados, con formación para profesionais e afeccionados.",web:"",tags:["Galicia","escola","musical"],logo:"🏫"},
  {id:"u35",tipo:"festival",nome:"IMPROFIGHTERS!",pais:"🇪🇸",cidade:"Santiago de Compostela, Galicia",desc:"Campionato Galego de Improvisación Teatral. Parellas de improvisadores de distintas compañías galegas compiten en formato de combate por parellas.",web:"",tags:["Galicia","campionato","competición"],logo:"🏆"},
  {id:"u36",tipo:"escola",nome:"F!T — Formación en Improvisación Teatral",pais:"🇪🇸",cidade:"Santiago de Compostela, Galicia",desc:"Único programa formativo universitario de impro en Europa. Organizado pola Xunta de Galicia e a USC na Cidade da Cultura, con estudantes internacionais cada verán.",web:"",tags:["Galicia","universitario","internacional"],logo:"🎓"},
  {id:"u37",tipo:"persoa",nome:"Antón Coucheiro",pais:"🇪🇸",cidade:"Santiago de Compostela, Galicia",desc:"Actor e director, un dos responsables do programa F!T e docente de dramaturxia da impro en Galicia.",web:"",tags:["Galicia","docente","director"],logo:"👨‍🏫"},

];
export const UNIVERSO_TIPOS=[
  {id:"todos",label:"Todo",emoji:"🌍"},
  {id:"compañía",label:"Compañías",emoji:"🎭"},
  {id:"festival",label:"Festivais",emoji:"🎉"},
  {id:"escola",label:"Escolas",emoji:"📚"},
  {id:"persoa",label:"Persoas",emoji:"👤"},
  {id:"proxecto",label:"Proxectos",emoji:"🚀"},
];
