import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import {
  getDinamicas, saveDinamica, deleteDinamica,
  getSesiones, saveSesion,
  getGrupos, saveGrupo, deleteGrupo,
  getPlaylists, savePlaylists as savePlaylistsDB,
  getEfectos, saveEfectos as saveEfectosDB,
  abrirSala, cerrarSala, getSalaStatus,
  enviarProposta, getPropostas, subscribeToPropostas, getHistorialSalas,
  getUserStimuli, addUserStimulus,
  trackGenSupa, trackMinsSupa,
} from './db.js';

const ThemeCtx = createContext(null);

const LangCtx = createContext(null);
const useLang = () => useContext(LangCtx);

const UI_STRINGS = {
  es:{generar:"Generar",reto:"Reto",sesiones:"Sesiones",guia:"Guía",show:"Show",grupos:"Grupos",qr:"QR",ajustes:"Ajustes",manual:"Manual",admin:"Admin",universo:"Universo"},
  gl:{generar:"Xerar",reto:"Reto",sesiones:"Sesións",guia:"Guía",show:"Show",grupos:"Grupos",qr:"QR",ajustes:"Axustes",manual:"Manual",admin:"Admin",universo:"Universo"},
  en:{generar:"Generate",reto:"Challenge",sesiones:"Sessions",guia:"Guide",show:"Show",grupos:"Groups",qr:"QR",ajustes:"Settings",manual:"Manual",admin:"Admin",universo:"Universe"},
};

const t = (lang, key) => UI_STRINGS[lang]?.[key] || UI_STRINGS.es[key] || key;

const TAB_LABELS = UI_STRINGS;

const GrupoCtx = createContext(null);
const useGrupo = () => useContext(GrupoCtx);

const useTheme = () => useContext(ThemeCtx);
function useThemeProvider() {
  const [dark, setDark] = useState(() => localStorage.getItem("impro_theme") !== "light");
  const toggle = () => setDark(d => { localStorage.setItem("impro_theme", d?"light":"dark"); return !d; });
  const T = dark ? {
    bg:"#0d0d0d",bg2:"#161616",bg3:"#1e1e1e",bg4:"#252525",
    border:"#252525",border2:"#2a2a2a",
    text:"#fff",text2:"#aaa",text3:"#666",text4:"#444",
    accent:"#e040fb",nav:"#0d0d0d",navBorder:"#1a1a1a",
    input:"#0d0d0d",inputBorder:"#2a2a2a",
  } : {
    bg:"#f0f0f4",bg2:"#fff",bg3:"#f5f5f8",bg4:"#e8e8ec",
    border:"#ddd",border2:"#ccc",
    text:"#111",text2:"#444",text3:"#777",text4:"#999",
    accent:"#9c27b0",nav:"#fff",navBorder:"#e0e0e0",
    input:"#fff",inputBorder:"#ccc",
  };
  return { dark, toggle, T };
}

const ESTIMULOS_BASE = {
  PROFESIÓN:{ simple:["Domador de urracas","Odontólogo de hipopotamos","Sexador de pollos","Biódromo","Jardinero de planetas","Domador de cometas","Reparador de sueños","Constructor de castillos de arena","Cazador de arcoíris","Traductor de pensamientos","Vendedor de burbujas","Bibliotecario de secretos","Guardián de puertas mágicas","Recolector de estrellas","Músico de tormentas"], plus:["Domador de urracas","Odontólogo de hipopotamos","Sexador de pollos","Biódromo","Jardinero de planetas","Domador de cometas","Reparador de sueños","Constructor de castillos de arena","Cazador de arcoíris","Traductor de pensamientos","Vendedor de burbujas","Bibliotecario de secretos","Guardián de puertas mágicas","Recolector de estrellas","Músico de tormentas","Mecánico de globos aerostáticos","Inventor de olores","Payaso de la realeza","Director de nubes","Chef de volcanes","Maestro de marionetas gigantes","Arqueólogo de mundos perdidos","Capitán de barcos invisibles","Criador de dragones","Pintor de cielos","Piloto de submarinos voladores","Entrenador de gatos ninja","Profesor de magia básica","Cerrajero de cofres misteriosos","Limpiador de fantasmas","Estilista de momias","Investigador de dimensiones paralelas","Panadero de pan que canta","Botánico de jardines flotantes","Inventora de caramelos invisibles","Guardián de puentes colgantes","Jardinera de cactus parlantes","Mecánico de cohetes reciclados","Navegante de mapas incompletos","Pastora de unicornios","Fotógrafo de fantasmas","Cazadora de auroras boreales","Bibliotecario de secretos olvidados","Tejedora de telarañas doradas","Panadero de volcanes","Restauradora de sueños rotos","Conductor de trenes subterráneos","Poeta de calles perdidas","Criadora de dragones domésticos","Experta en cerraduras mágicas","Entrenador de tortugas ninja","Chef de sopas imposibles","Inspectora de puentes invisibles","Pintor de nubes pasajeras","Maestra de pociones para principiantes","Carpintero de casas flotantes","Compositora de canciones para plantas","Capitán de barcos de papel","Vendedora de suspiros embotellados","Guía de laberintos misteriosos","Payaso de funerales","Arquitecta de castillos en el aire","Organizador de carreras de caracoles","Cazador de errores de la realidad","Costurera de abrigos invisibles","Alquimista de emociones","Barista de cafeterías interdimensionales","Ingeniera de paraguas voladores","Director de orquesta de grillos","Domadora de gatos salvajes","Fabricante de relojes que retroceden","Escultora de humo","Guardiana de fuentes mágicas","Creador de ilusiones ópticas","Repartidora de cartas del futuro","Constructor de toboganes infinitos","Agricultor de frutas cuadradas","Ilusionista de cumpleaños olvidados","Cazador de truenos","Entrenadora de caballos de fuego","Tasador de objetos imposibles","Mecánica de bicicletas acuáticas","Programadora de sueños lúcidos","Juglar de aldeas sin nombre","Inventor de lenguajes nuevos","Panadera de pasteles flotantes","Arquitecto de iglús tropicales","Cuidadora de niños invisibles","Animador de reuniones aburridas","Decoradora de cuevas subterráneas","Confeccionista de sombreros imposibles","Bióloga de especies inventadas","Conductora de globos aerostáticos","Vigilante de planetas olvidados","Escritora de mensajes secretos","Recolectora de hojas susurrantes","Directora de coros de robots","Pastora de ovejas eléctricas","Maestro de duendes revoltosos","Diseñadora de laberintos vivientes","Traductora de murmullos marinos","Músico de tormentas lejanas","Restaurador de estatuas vivientes","Reparadora de paraguas rotos","Astronauta","Carpintero","Pastelero","Detective","Bibliotecario","Piloto de globos","Cerrajero","Maestro de esgrima","Escultor","Bailarín de breakdance","Florista","Maquinista de tren","Domador de serpientes","Científico nuclear","Sommelier","Fotógrafo de naturaleza","Chef vegano","Alfarero","Revisor de tren","Pintor de murales","Locutor de radio","Guía de montaña","Botánico","Instructor de yoga","Payaso de circo","Herrerón","Médico forense","Apicultor","Escenógrafo","Mecánico de bicicletas","Desarrollador de videojuegos","Orfebre","Actor de doblaje","Director de cine","Salvavidas","Enfermero pediátrico","Inventor de juguetes","Meteorólogo","Vigilante de museo","Magó profesional","Ingeniero de sonido","Instructor de paracaidismo","Criador de caballos","Repostero de bodas","Artista de tatuajes","Operador de drones","Diseñador de parques","Entrenador de perros","Terapeuta ocupacional","Fabricante de instrumentos"] },
  OBJETO:{ simple:["Termómetro anal","Caleidoscopio estelar","Ladrillo colocado en vertical","Cucáchara","Paraguas de fuego","Botella que susurra secretos","Alfombra que flota","Cuchara de invisibilidad","Lupa gigante","Reloj que corre hacia atrás","Maleta sin fondo","Sombrero que cambia de color","Guitarra de hielo","Caja de música voladora","Lámpara que atrapa sonidos"], plus:["Termómetro anal","Caleidoscopio estelar","Ladrillo colocado en vertical","Cucáchara","Paraguas de fuego","Botella que susurra secretos","Alfombra que flota","Cuchara de invisibilidad","Lupa gigante","Reloj que corre hacia atrás","Maleta sin fondo","Sombrero que cambia de color","Guitarra de hielo","Caja de música voladora","Lámpara que atrapa sonidos","Taza de café interminable","Silla que baila","Cohete de papel","Zapatos que se ríen","Espejo que dice la verdad","Teléfono que llama al pasado","Bufanda que vuela sola","Pincel que pinta solo","Globo que nunca explota","Rueda de bicicleta cuadrada","Pistola de burbujas gigantes","Camiseta que cambia de forma","Cinturón que cuenta historias","Ladrillo de gelatina","Libro que canta","Bumerán que se esconde","Cama con patas","Caja fuerte que habla","Anillo que hace cosquillas","Llave de casa","Bote de mermelada","Gafas de lectura","Zapatilla de deporte","Mochila escolar","Batería de cocina","Almohada","Ventilador de escritorio","Botella de agua","Paraguas cerrado","Calendario de pared","Martillo de carpintero","Estuche de lápices","Cartera vacía","Regadera de jardín","Caja de herramientas","Mando a distancia","Agenda vieja","Auriculares enredados","Portátil medio roto","Espejo que responde preguntas","Varita que cambia sabores","Sombrero que canta","Capa de invisibilidad (desgastada)","Cuaderno que predice el futuro","Piedra que susurra consejos","Botella que atrapa tormentas","Reloj que detiene segundos","Anillo que traduce pensamientos","Pluma que escribe sola","Globo que no deja de flotar","Bastón que encuentra caminos","Caja de suspiros","Cuerda que se alarga infinita","Vela que muestra recuerdos","Abanico que crea ilusiones","Sandalias de velocidad","Aro de teletransportación","Gafas que ven otras dimensiones","Cucharón de sopas encantadas","Manómetro de alta presión","Matraz Erlenmeyer","Sismógrafo portátil","Termociclador de ADN","Autoclave de esterilización","Bureta graduada","Osciloscopio digital","Calibrador piezoeléctrico","Centrífuga de laboratorio","Multímetro eléctrico","Espectrómetro de masas","Incubadora bacteriológica","Pluviómetro de campo","Balanza analítica","Viscosímetro rotacional","Electrocardiógrafo portátil","Tensiómetro manual","Nivela óptica de precisión","Detector de gases tóxicos","Termómetro de infrarrojos","Torquímetro hidráulico","Agitador magnético de laboratorio","Medidor de humedad del suelo","Barómetro aneroide","Cronógrafo astronómico","Anemómetro de copa","Piranómetro solar","Goniómetro de precisión","Alícuota automática","Cápsula de Petri gigante","Martillo","Mapa antiguo","Bolígrafo luminoso","Telescopio de bolsillo","Capa de invisibilidad","Paraguas roto","Vela aromática","Caja de música","Sombrero de copa","Bastón plegable","Antorcha electrónica","Linterna solar","Cuerda elástica","Balón de playa","Carcaj de flechas","Guantes térmicos","Reloj de arena","Almohada de viaje","Gafas de realidad virtual","Piedra de obsidiana","Botas de escalar","Micrófono antiguo","Cascabel","Mochila a prueba de agua","Pizarra mágica","Tintero de pluma","Brújula dorada","Caja fuerte miniatura","Llave maestra","Trineo plegable","Pipa de burbujas","Prensa de flores","Tornillo gigante","Sombrilla japonesa","Péndulo de Newton","Bumerán","Lanza de competición","Termómetro de mercurio","Cámara instantánea","Altavoz portátil","Set de alquimia","Arco de madera","Muñeca de trapo","Escalera telescópica","Lámpara flotante","Casco de realidad aumentada","Rastreador GPS de pulsera","Cetro de cristal","Terrón de azúcar"] },
  LUGAR:{ simple:["Ventrículo derecho","La parte de atrás de mi WC","El espacio finito","Madricia","Biblioteca submarina","Isla flotante","Cueva de cristales","Parque de diversiones abandonado","Granja espacial","Montaña que canta","Desierto de espejos","Palacio de hielo eterno","Túnel del tiempo","Mercado de objetos mágicos","Volcán dormido"], plus:["Ventrículo derecho","La parte de atrás de mi WC","El espacio finito","Madricia","Biblioteca submarina","Isla flotante","Cueva de cristales","Parque de diversiones abandonado","Granja espacial","Montaña que canta","Desierto de espejos","Palacio de hielo eterno","Túnel del tiempo","Mercado de objetos mágicos","Volcán dormido","Estación de tren fantasma","Castillo en una nube","Bosque de árboles fluorescentes","Barco pirata volador","Laboratorio de inventos fallidos","Submarino oxidado","Puente que no lleva a ningún lado","Torre torcida del futuro","Circo en el desierto","Playa donde nieva","Pueblo sin sombras","Jardín de piedras flotantes","Carretera infinita","Plaza de estatuas vivas","Cúpula de burbujas gigantes","Antiguo teatro encantado","Lago de leche","Ascensor al centro de la Tierra","Tienda de recuerdos imposibles","Paseo entre hórreos olvidados","Playa donde rompen las olas de piedra","Faros que parpadean en la niebla","Torre custodiada por mil leyendas","Mercado de pescado en la madrugada","Callejón empedrado tras la plaza mayor","Bosque donde hablan los carballos","Pazo de puertas siempre abiertas","Camino de vieiras enterradas","Rúa de los músicos silenciosos","Costa batida por los vientos eternos","Plaza donde bailan las meigas","Sendero oculto bajo la lluvia perpetua","Lonja abandonada por las mareas","Acantilado donde susurran los antiguos","Biblioteca del tamaño de una nuez","Estadio dentro de una botella","Isla flotante sobre una taza de café","Pueblo escondido en una caja de cerillas","Castillo levantado en una cucharita","Sala de conciertos dentro de un dedal","Ciudad entera bajo una hoja caída","Jardín en la cabeza de un alfiler","Tren que recorre una barra de pan","Escuela diminuta entre raíces de árbol","Torre de vigilancia en la grieta de una piedra","Puerto construido en la cáscara de un huevo","Biblioteca debajo de un tapón de corcho","Palacio oculto en el bolsillo de un abrigo","Zoológico sobre la superficie de una moneda","Ciudad minera en el asteroide 7759","Mercadillo flotante en la atmósfera de Júpiter","Playa helada en una luna de Saturno","Bosque de hielo bajo la superficie de Europa","Estación espacial abandonada en órbita baja","Mercado de oxígeno en Marte","Refugio subterráneo en la Luna","Cafetería interestelar entre dos nebulosas","Puerto estelar en el anillo de Saturno","Biblioteca perdida en el cinturón de asteroides","Aldea de dragones dormidos","Bosque que cambia de estación cada hora","Isla suspendida por cadenas invisibles","Ciudad construida sobre el lomo de un gigante","Cueva que contiene todos los ecos del mundo","Torre de relojes sin agujas","Jardín de estatuas vivientes","Mercado de trueques imposibles","Lago de tinta líquida","Desierto donde llueve hacia arriba","Pueblo donde nunca se pone el sol","Biblioteca que olvida lo que guarda","Mansión habitada solo por sombras","Puente que nunca lleva a ningún lugar","Cementerio de barcos voladores","Arena de gladiadores romanos","Templo perdido en las selvas mayas","Biblioteca real de Alejandría reconstruida","Foro de discusiones filosóficas en Atenas","Teatro donde debutó una tragedia griega","Torre de un alquimista medieval","Caravana cruzando la Ruta de la Seda","Puerto fenicio al borde del mundo conocido","Fortaleza vikinga cubierta de niebla","Anfiteatro de luchas olvidadas","Villa imperial en el corazón de Roma antigua","Pirámide custodiada por guardianes invisibles","Callejón del bazar de Bagdad en el siglo X","Oasis escondido entre caravanas nómadas","Academia de sabios en el Al-Ándalus perdido","Puerto pesquero","Bosque encantado","Pueblo sumergido","Mercado medieval","Fábrica abandonada","Teatro de marionetas","Faro en ruinas","Tren fantasma","Jardín botánico","Bodega subterránea","Mirador secreto","Playa de arena negra","Laboratorio submarino","Castillo en la montaña","Césped de estadio vacío","Parque de diversiones olvidado","Biblioteca mágica","Desierto de sal","Aldea en el ártico","Templo oculto","Barrio antiguo","Aeropuerto fantasma","Puente colgante","Refugio de montaña","Noria abandonada","Monasterio oculto","Zoológico de criaturas extrañas","Cúpula de observatorio","Terminal de autobuses vacía","Cárcel desierta","Torre del reloj","Canal subterráneo","Galería de arte moderno","Granja de orugas","Cascada secreta","Plataforma petrolera abandonada","Centro de comando espacial","Isla volcánica","Antiguo salón de baile","Cementerio de barcos","Pantano iluminado","Cúverna submarina","Mercado flotante","Trinchera olvidada","Helipuerto derrumbado","Pueblo de hielo","Mina de esmeraldas"] },
  ACCIÓN:{ simple:["Apagar/encender las luces con palmadas","Despiojar al Yeti","Mover la cabeza de chorlito","Volar con las zapatillas de running","Cantar bajo la lluvia","Saltar a la pata coja","Esconder un objeto secreto","Cocinar sin usar fuego","Pintar un mural invisible","Atrapar mariposas","Volar en una escoba","Escribir una carta de amor","Bucear en el aire","Escalar una montaña de libros","Leer en voz alta un hechizo"], plus:["Apagar/encender las luces con palmadas","Despiojar al Yeti","Mover la cabeza de chorlito","Volar con las zapatillas de running","Cantar bajo la lluvia","Saltar a la pata coja","Esconder un objeto secreto","Cocinar sin usar fuego","Pintar un mural invisible","Atrapar mariposas","Volar en una escoba","Escribir una carta de amor","Bucear en el aire","Escalar una montaña de libros","Leer en voz alta un hechizo","Atravesar una pared imaginaria","Bailar como un robot","Construir un castillo de arena","Desenterrar un tesoro","Domar un animal salvaje","Enseñar a hablar a un pez","Correr sin tocar el suelo","Lanzar un desafío de rap","Hacer malabares con frutas","Huir de una estampida de ovejas","Disfrazarse en menos de un minuto","Escribir un poema absurdo","Dormir en un sitio extraño","Hablar en otro idioma inventado","Comer algo imposible","Limpiar un desastre mágico","Romper una maldición","Hacer una reverencia exagerada","Imitar el sonido de un animal","Cepillarse los dientes","Atarse los zapatos","Preparar un café","Mandar un mensaje","Cerrar una ventana","Regar las plantas","Cruzar la calle","Llamar a un amigo","Poner una alarma","Tender la ropa","Limpiar unas gafas","Comprar el pan","Leer un periódico","Abrir una botella","Hacer la cama","Casarse bajo la lluvia","Bautizar un barco","Graduarse en la universidad","Tener un hijo","Comprar una casa","Correr una maratón","Viajar a otro continente","Escalar una montaña","Escribir un testamento","Ganar un premio importante","Saltar en paracaídas","Nadar en mar abierto","Plantar un árbol","Cantar en un gran escenario","Cambiar radicalmente de vida","Bailar en pareja","Jugar un partido de fútbol","Cocinar una paella entre amigos","Actuar en una obra de teatro","Hacer un viaje en grupo","Participar en un karaoke","Hacer un brindis","Firmar un contrato juntos","Subir una montaña en expedición","Entrar en una casa abandonada","Falsificar un documento","Robar un banco","Vender objetos robados","Huir de la policía","Hackear un sistema","Escapar de prisión","Contrabandear antigüedades","Espiar a una persona","Agredir a un político","Hacer una pintada ilegal","Sobornar a un funcionario","Organizar una pelea clandestina","Apostar en carreras ilegales","Cruzar una frontera sin papeles","Escarbar un agujero en la tierra","Trepar a un árbol sin motivo","Correr en círculos durante horas","Lamerse el brazo","Escarbar con las manos en busca de comida","Saltar en un charco de barro","Revolcarse en el césped","Marcar territorio con señales","Emitir sonidos extraños para comunicarse","Rascarse la oreja con el pie","Cazar pequeños insectos","Dormir colgado de una rama","Empujar a otros jugando","Cambiar de pelaje según la estación","Hacer la fotosíntesis","Tallar madera","Subir un faro","Atravesar una selva","Construir un refugio","Cantar en un concurso","Dibujar un mural","Inventar un idioma","Cruzar una cuerda floja","Descifrar un código","Pintar una pared gigante","Organizar un festival","Navegar sin mapa","Conducir una caravana","Buscar un tesoro","Actuar en una obra","Coser un disfraz","Bailar sobre hielo","Armar una tienda de campaña","Cultivar un huerto","Sumergirse en cuevas","Contar historias","Moldear arcilla","Recoger hongos","Realizar un truco de magia","Programar un robot","Domar un caballo salvaje","Soplar vidrio","Trepar un árbol gigantesco","Coser una vela de barco","Volar un globo aerostático","Restaurar una bicicleta antigua","Tocar un instrumento desconocido","Recitar un poema propio","Trazar un mapa a mano","Improvisar una canción","Pescar en hielo","Confeccionar una armadura","Hacer malabares con antorchas","Enseñar a bucear","Crear un perfume","Componer una melodía","Encender un fuego sin cerillas","Participar en una subasta","Grabar un cortometraje","Inventar un juego de mesa","Esculpir en hielo","Dominar un arte marcial"] },
  NOMBRE:{ simple:["Francis Colorinco Lorado","Chorlito","Fridolin","Capitán Torbellino","Martina Relámpago","Don Gaspar del Río","Valentina Bruma","Sebastián Pluma","Clara Nebulosa","El Profesor Tornado","Ismael Viento Norte","Aurora Destello","Max Estrella","Greta Sombramiel","Donato el Persistente"], plus:["Francis Colorinco Lorado","Chorlito","Fridolin","Capitán Torbellino","Martina Relámpago","Don Gaspar del Río","Valentina Bruma","Sebastián Pluma","Clara Nebulosa","El Profesor Tornado","Ismael Viento Norte","Aurora Destello","Max Estrella","Greta Sombramiel","Donato el Persistente","Lola Lunática","Federico Cazatormentas","Olivia la Intrépida","Tomás Sin Rumbo","Selene Tempestad","Jacinto del Abismo","Rita Centella","Hugo Crepúsculo","Paloma Caminante","Dante de la Bruma","Amalia Horizonte","Bruno Sin Sombra","Carmen del Laberinto","León Rugido Leve","Victoria Solitaria","Simón Viajero Eterno","Diana Claroscuro","Nicolás Eco de Mar","Xoán Müller","Antía Johansson","Brais Nakamura","Uxía Dubois","Roi McGregor","Iria Fontaine","Breogán Smith","Lúa Petrova","Lois Andersson","Noa Schmidt","Xurxo Chang","Aldara Ricci","Anxo O'Connor","Sabela Ivanova","Iago Lefèvre","Carmela Suzuki","Teo Novak","Maruxa Kim","Xiana Moretti","Xan Yamamoto","Pascuala García","Baldomero Sánchez","Teodora Martínez","Leocadio Fernández","Eulalia Pérez","Casimiro Gómez","Escolástica Torres","Bartolomé Ruiz","Melitona Moreno","Ruperto Rodríguez","Genoveva López","Laureano González","Sinforosa Díaz","Venancio Alonso","Bernarda Romero","Tito Benito","Clara Vara","Paco Flaco","Lina Marina","Hugo Rugo","Nora Zamora","Suso Luso","Marta Esparta","Dani Maní","Rita Bendita","Pepe Lepe","Lola Enola","Nando Brando","Cuca Puca","Pili Milí","Ana Conda","Salvador Pimiento","Clara Oscura","Tomás Turbado","Dolores Fuertes","Alberto Sardina","Luz Verde","Berto Ló","Rosa Melcacho","Eva Nescente","Paco Merengue","Rita Librada","Fermín Tropezón","Cándida Noche","Laura Naranja","Esteban Dido","Carmen Tornado","Juan Sinmiedo","Alma Lirio","Celia Cruzcampo","Alonso Vega","Clara Montgomery","Damián Suárez","Lucía Fontaine","Pedro Novak","Sara Dupont","Matías Kowalski","Carmen Bennett","Andrés Schmidt","Beatriz McCarthy","Tomás Ferrari","Isabel Green","Santiago Sullivan","Adela Park","Héctor Nash","Marina Weber","Ramón Dorsey","Irene Goldberg","Julián Russo","Paula Henderson","Lucas Beaumont","Eva Moretti","Gonzalo OBrien","Ana Fitzgerald","Cristian Novak","Sofía Wells","Hugo Campbell","Laura Quinn","Daniela Ortega","Fernando Pratt","Rocío Stone","Gabriel Curtis","Nerea OMalley","Victor Duarte","Marta Sanderson","Esteban Miller","Angela Knight","Felipe Clark","Verónica Waters","Diego Coleman","Patricia Avery","Nicolás Lambert","Elena Parker","Leonardo Wilkins","Carla Foster","Francisco Drummond","Susana Monroe","Emilio Gallagher","Raquel Peterson","Ignacio Simmons"] },
  EMOCIÓN:{ simple:["Risa incontrolable en momentos de seriedad","Desesperacion astringente","Los pelos como escarpines","Frío ardiente","Júbilo","Pesadumbre","Cólera","Espanto","Estupefacción","Asco","Sonrojo","Altivez","Apego","Celos","Zozobra"], plus:["Risa incontrolable en momentos de seriedad","Desesperacion astringente","Los pelos como escarpines","Frío ardiente","Júbilo","Pesadumbre","Cólera","Espanto","Estupefacción","Asco","Sonrojo","Altivez","Apego","Celos","Zozobra","Paz","Añoranza","Anhelo","Impotencia","Reconocimiento","Inquietud","Remordimiento","Misericordia","Frialdad","Coraje","Desazón","Veneración","Desamparo","Confianza","Cariño","Exaltación","Irritación","Desahogo","Codicia","Morriña","Optimismo","Gozo","Cansancio","Estupor","Impaciencia","Envidia","Soledad","Confusión","Desilusión","Aversión","Emoción","Rechazo","Pánico","Furia","Plenitud","Complicidad","Despreocupación","Suspicacia","Temeridad","Abatimiento","Intriga","Rencor","Agradecimiento","Incredulidad","Pasión","Felicidad","Nerviosismo","Empatía","Angustia","Ironía","Desdén","Ilusión","Entusiasmo","Temor","Desconfianza","Vulnerabilidad","Misterio","Fascinación","Humillación","Tranquilidad","Delirio","Culpabilidad","Inseguridad","Satisfacción","Melancolía","Euforia","Admiración","Ternura","Inspiración","Desvelo","Resentimiento","Serenidad","Frustración","Gratitud","Curiosidad","Culpa","Indiferencia","Valentía","Nostalgia","Reproche","Suspiro","Esperanza","Consternación","Compasión","Resignación","Dicha","Alivio","Desconsuelo","Cautela","Heroísmo","Repulsión","Reconciliación","Apego emocional","Estabilidad","Rechazo interno","Perplejidad","Vulnerabilidad emocional","Recelo","Júbilo contenido","Euforia silenciosa","Devoción","Inseguridad latente","Celos mudos","Placer culpable","Confusión afectiva","Hilaridad","Paz interna","Anonadamiento","Repentina tristeza","Irritación leve","Agradecimiento sincero","Risa nerviosa"] },
  SUPERPODER:{ simple:["La suerte es tan benévola contigo que, de una manera u otra, todo te sale gratis","Adivino el pensamiento del mosquito que revolotea en mi habitación","Superpereza","Convertir en mierda todo lo que toco","Volar","Leer la mente","Invisibilidad","Controlar el fuego","Respirar bajo el agua","Supervelocidad","Hablar con los animales","Telequinesis (mover objetos con la mente)","Curación instantánea","Ver el futuro","Cambiar de forma"], plus:["La suerte es tan benévola contigo que, de una manera u otra, todo te sale gratis","Adivino el pensamiento del mosquito que revolotea en mi habitación","Superpereza","Convertir en mierda todo lo que toco","Volar","Leer la mente","Invisibilidad","Controlar el fuego","Respirar bajo el agua","Supervelocidad","Hablar con los animales","Telequinesis (mover objetos con la mente)","Curación instantánea","Ver el futuro","Cambiar de forma","Crear hielo","Teletransportarse","Hablar todos los idiomas","Crear ilusiones","Controlar el tiempo","Superfuerza","Caminar sobre las paredes","Convertirse en sombra","Manipular plantas","Atraer la suerte","Convertirse en gigante","Multiplicarse en varios clones","Volver objetos invisibles","Convertir pensamientos en realidad","Emitir luz propia","Hablar con las máquinas","Dormir sin necesidad de soñar","Transformar lágrimas en diamantes","Atravesar objetos sólidos","Localizar objetos perdidos instantáneamente","Memorizar cualquier libro con solo tocarlo","Cambiar de ropa al instante","Purificar agua automáticamente","Reparar cosas rotas con las manos","Hacer que las plantas crezcan más rápido","Dormir solo cinco minutos y quedar descansado","Traducir cualquier jerga o dialecto","Recordar cualquier conversación palabra por palabra","Cocinar cualquier plato con solo imaginarlo","Mejorar el sabor de cualquier comida","Ordenar la casa con un chasquido","Arreglar aparatos electrónicos mentalmente","Convertir pensamientos en listas organizadas","Hacer aparecer billetes exactos en la cartera","Cambiar la temperatura corporal a voluntad","Limpiar cualquier superficie solo mirándola","Programar alarmas mentales que suenan en tu cabeza","Reparar emociones rotas de otros","Detectar mentiras sutiles","Crear atajos físicos donde no los hay","Enviar olores agradables a distancia","Compartir conocimiento con solo tocar","Ver la solución de cualquier rompecabezas","Multiplicar el tiempo percibido (sentir que un minuto dura más)","Acelerar o ralentizar la digestión","Visualizar el camino más rápido en cualquier sitio","Mejorar el clima de un pequeño entorno personal","Convertir residuos en compost instantáneo","Comunicar emociones sin hablar","Cambiar el color de las uñas al estornudar","Emitir olor a galletas cada vez que saltas","Volver transparente solo tu dedo meñique","Hacer que tu sombra te aplauda","Hablar con piedras (pero solo con piedras)","Teletransportar una cucharilla a tu bolsillo","Cambiar la dirección del viento en un metro cuadrado","Hacer crecer una ceja instantáneamente","Pintar líneas invisibles en el aire","Hablar pero solo en idiomas inventados","Emitir sonidos de animales aleatorios al bostezar","Cambiar tu voz por la de un pato por 10 segundos","Perder un zapato y encontrarlo siempre en la nevera","Sentir el estado de ánimo de las plantas","Hacer desaparecer pelusas de ombligo","Imitar cualquier alarma de móvil","Que siempre haya una silla disponible cerca","Transformar tu sombra en formas abstractas","Aumentar la velocidad de crecimiento del pelo de la nariz","Controlar el parpadeo de otros","Hacer que los paraguas se cierren si llueve poco","Adivinar el número exacto de caramelos en un bote","Soplar aire frío por las orejas","Hacer que tu reflejo guiñe antes que tú","Crear gotas de agua en las puntas de los dedos","Rayos láser por los ojos","Invisibilidad total","Regeneración instantánea","Crear campos de fuerza","Lanzar telarañas como Spider-Man","Superoído capaz de escuchar kilómetros","Invulnerabilidad física","Crear terremotos pequeños","Controlar la electricidad","Dominar el magnetismo","Volver intangible (atravesar paredes)","Control mental sobre otras personas","Resucitar brevemente a los muertos","Convertirse en un ser de fuego","Aumentar el tamaño muscular a voluntad","Generar burbujas irrompibles","Hablar con los espejos","Controlar los semáforos","Convertir el sudor en tinta","Levitar solo los miércoles","Imantar objetos pequeños","Cambiar el sabor del agua","Respirar por las orejas","Volverse invisible al estornudar","Lanzar purpurina explosiva","Crear niebla desde las manos","Controlar los sueños ajenos","Transformar el polvo en pan","Escuchar conversaciones pasadas","Convocar ovejas con la mente","Encender luces con la voz","Cambiar el color de los ojos a voluntad","Crear una burbuja de silencio","Hablar con plantas carnívoras","Deslizarse como pingüino en cualquier superficie","Duplicar el tamaño de un zapato","Dormir sin cerrar los ojos","Invocar una escalera portátil","Teletransportar objetos blandos","Atraer mariposas","Leer la mente de los relojes","Hacer crecer bigote instantáneo","Emitir olor de flores al correr","Estirar los dedos como chicle","Pintar con la mirada","Derretir queso sin calor","Entender todos los maullidos","Transformar papel en ropa","Ver en cámara lenta","Atraer cucharas","Memorizar libros con solo tocarlos","Convertir globos en piedras","Detener la caída de objetos","Imprimir cosas con los pensamientos","Fundir metal con los pies","Cambiar el sabor de los pensamientos","Convertir las lágrimas en caramelos","Hablar todos los acentos","Invocar una silla en cualquier lugar","Girar el cuello 360 grados sin dolor","Inflar cosas con la mirada","Olvidar cosas voluntariamente","Cambiar tu olor corporal","Sentir terremotos diminutos","Escribir con los pies"] },
  ESTILO:{ simple:["Drama jurásico","Western interestelar","Película del tumor en Antena 3","Comedia dramática","Comedia romántica","Drama histórico","Ciencia ficción","Thriller psicológico","Película de acción","Comedia absurda","Western clásico","Musical","Terror sobrenatural","Aventura épica","Película de espías"], plus:["Drama jurásico","Western interestelar","Película del tumor en Antena 3","Comedia dramática","Comedia romántica","Drama histórico","Ciencia ficción","Thriller psicológico","Película de acción","Comedia absurda","Western clásico","Musical","Terror sobrenatural","Aventura épica","Película de espías","Documental falso","Road movie (viaje en carretera)","Drama familiar","Comedia negra","Fantasía medieval","Superhéroes","Película de zombies","Cine noir (policiaco antiguo)","Animación mágica","Cine experimental","Cine de catástrofes","Película de piratas","Drama deportivo","Ciencia ficción distópica","Película infantil","Aventura en el espacio","Terror cómico","Película de juicios","Reality ficticio","Noticiario antiguo","Teletienda dramática","Anuncio publicitario exagerado","Reality de supervivencia","Docudrama científico","Video musical surrealista","Debate político extremo","Informe escolar","Programa de cocina épico","Concurso televisivo absurdo","Programa de reformas de casas","Serie de detectives infantiles","Cómic de supervillanos","Película de espías adolescentes","Manga romántico","Anime de batallas mágicas","Antología de cuentos de terror","Telenovela exagerada","Cine de propaganda antigua","Biopic ficticio","Película de monstruos gigantes","Cine de samuráis","Cine de mafiosos","Drama existencial","Comedia muda","Film noir futurista","Western espacial","Opera rock","Animación experimental abstracta","Musical de terror","Cine de atracos fallidos","Cine bélico íntimo","Diario personal llevado a la pantalla","Viaje iniciático","Satira política","Cine steampunk","Cine de artes marciales clásicas","Cine de hadas retorcido","Serie procedimental médica","Televisión local de bajo presupuesto","Cine de robots","Teatro grabado en vivo","Cine de exploradores victorianos","Parodia de documentales serios","Serie de abogados cómicos","Película de festivales de música","Cine de boxeo underground","Cine \"coming of age\" (madurez adolescente)","Thriller rural","Documental sobre objetos cotidianos","Cine de mutantes","Película de hackers","Drama carcelario","Simulacro de conferencia TED absurda","Informe meteorológico trágico","Mockumentary paranormal","Cine metafísico","Western contemporáneo","Battle royale escolar","Film de espionaje industrial","Historia oral coral (varios personajes)","Cine de conspiraciones cósmicas","Parodia de concursos televisivos","Informativo de noticias ridículas","Parodia de películas de desastres naturales","Serie documental de \"naturaleza urbana\"","Cine de viajes en el tiempo humorístico","Debate filosófico extremo","Cuento infantil retorcido","Musical postapocalíptico","Telenovela latina","Cine mudo","Ciencia ficción clásica","Falso documental","Musical de Broadway","Terror adolescente","Drama judicial","Western spaghetti","Reality show","Programación infantil","Sitcom noventera","Cine bélico","Cómic de superhéroes","Policíaco de los 70","Juego de rol en vivo","Debate político","Talk show sensacionalista","Terror psicológico","Videojuego retro","Thriller nórdico","Novela de misterio","Telediario en directo","Programa de cocina","Novela romántica juvenil","Cine de acción de los 90","Historieta costumbrista","Espías de la Guerra Fría","Anime de instituto","Película de zombis","Comedia británica","Clásico de Disney","Teatro del absurdo","Supervivencia extrema","Series tipo true crime","Show de magia","Documental de naturaleza","Cine postapocalíptico","Debate de tertulia","Sitcom familiar","Estilo Shakespeare","Película de samuráis","Video musical pop","Telenoticias urgentes","Viaje en el tiempo","Programa de citas","Batalla épica de fantasía"] },
  DUDA:{ simple:["¿Los números primos son primos lejanos?","Si las gallinas me hacen y las ranas tuviesen pelo, se cumplirían muchas promesas ?","Si un grillo canta al amanecer, es un... grallo?","Y si mis respuestas no se envían a la app?? 🤨","¿Y si todo esto es un sueño?","¿Por qué el cielo es azul y no morado?","¿Qué pasa si un día dejo de soñar?","¿Existe el destino o lo inventamos?","¿Por qué los gatos siempre caen de pie?","¿Dónde van los calcetines perdidos?","¿Somos los personajes de otro cuento?","¿Qué había antes del principio?","¿Pueden las piedras tener sentimientos?","¿Y si el tiempo corre hacia atrás?","¿Por qué lloramos cuando estamos felices?"], plus:["¿Los números primos son primos lejanos?","Si las gallinas me hacen y las ranas tuviesen pelo, se cumplirían muchas promesas ?","Si un grillo canta al amanecer, es un... grallo?","Y si mis respuestas no se envían a la app?? 🤨","¿Y si todo esto es un sueño?","¿Por qué el cielo es azul y no morado?","¿Qué pasa si un día dejo de soñar?","¿Existe el destino o lo inventamos?","¿Por qué los gatos siempre caen de pie?","¿Dónde van los calcetines perdidos?","¿Somos los personajes de otro cuento?","¿Qué había antes del principio?","¿Pueden las piedras tener sentimientos?","¿Y si el tiempo corre hacia atrás?","¿Por qué lloramos cuando estamos felices?","¿Quién inventó las despedidas?","¿Qué haría un pez si supiera volar?","¿Somos la imaginación de otro ser?","¿Por qué soñamos cosas imposibles?","¿Qué hay en el fondo del mar más profundo?","¿Se puede recordar algo que nunca pasó?","¿Cómo sería la vida si pudiéramos volar?","¿Por qué el miedo nos paraliza?","¿Cuántos caminos no tomamos cada día?","¿Qué pasa con las palabras que no decimos?","¿Puede el amor durar para siempre?","¿Y si los árboles pudieran hablarnos?","¿Por qué sentimos nostalgia de lugares que no conocemos?","¿De dónde viene la inspiración?","¿Por qué los recuerdos se distorsionan?","¿Qué significa realmente ser libre?","¿Por qué hay silencios que pesan más que gritos?","¿Qué pasa si un día olvidamos quiénes somos?","¿Y si nunca despertamos?","¿Dónde van los calcetines desaparecidos?","¿Por qué las tostadas siempre caen del lado de la mantequilla?","¿Puede un pez tener vértigo?","Si un árbol cae en el bosque y nadie lo escucha ¿sigue pidiendo perdón?","¿Qué pesa más? ¿un kilo de preguntas o un kilo de respuestas?","¿Por qué se llama agua de colonia si no viene de ninguna colonia?","¿Puede una sombra tener miedo de la oscuridad?","Si sueño que no sueño ¿estoy soñando?","¿Por qué los planetas no se salen nunca del carril?","¿A dónde van las ideas que se olvidan?","¿Puede una piedra sentir melancolía?","Si tiro una piedra al futuro ¿cuándo la encontraré?","¿Se puede secar el agua de un océano con paciencia?","¿Quién riega los cactus en el desierto?","¿Puede un espejo olvidar su reflejo?","¿Dónde se esconde el tiempo cuando nadie lo mira?","¿Cómo sabe un reloj cuándo tiene hambre?","¿Y si el universo está contenido en un grano de arroz?","¿Quién le pone la corbata al viento?","¿Por qué los fantasmas no tropiezan con los muebles?","¿Puede una montaña tener vértigo?","¿Qué fue primero: la nostalgia o el recuerdo?","¿Por qué las agujas del reloj corren pero nunca llegan?","¿Puede una nube llorar de felicidad?","¿Por qué los caracoles no tienen casas con jardín?","Si un gato negro cruza frente a otro gato negro ¿qué sucede?","¿Por qué las notas musicales no se escapan del pentagrama?","¿Y si el horizonte es solo una promesa que se aleja?","¿Puede una pregunta contestarse a sí misma?","¿Cuánto pesa un suspiro?","Si uno se pierde en sus pensamientos ¿debería llevar mapa?\"","¿Dónde terminan las ondas de un bostezo?","¿Por qué el tiempo vuela pero nunca aterriza?","¿Puede un bostezo contagiar a una piedra?","¿Por qué las palabras se esconden justo cuando las necesitas?","¿Puede un arco iris olvidar un color?","¿Por qué los refranes siempre tienen la última palabra?","¿Cuántas vueltas da una duda antes de cansarse?","¿Quién fue el primero en aplaudir?","¿Puede una gota de agua tener ambiciones oceánicas?","¿Y si la gravedad fuera solo una costumbre?","¿Por qué el eco siempre tiene razón?","¿Cómo suena un susurro en el espacio exterior?","¿Por qué las estrellas parpadean si no tienen párpados?","¿Puede un rumor viajar más rápido que la luz?","¿Quién mide el tamaño de un pensamiento?","¿Puede una lágrima ser feliz?","¿Cuántas millas recorre un bostezo?","¿Por qué los paraguas solo recuerdan abrirse tarde?","Si me callo en el desierto ¿alguien lo nota?","¿Puede un secreto tener eco?","¿Por qué los zapatos nuevos son más veloces?","¿Cuántos nudos puede hacer un viento travieso?","¿Puede un susurro hacer vibrar una montaña?","¿Quién le enseña el camino a una brújula?","¿Por qué los relojes de arena nunca tienen marea?","¿Cómo sabe un calendario que es lunes?","Si un pez escribe poesía ¿la tinta se disuelve?","¿Puede una semilla soñar con el cielo?","¿Cuántos parpadeos dura un instante?","Si una metáfora se pierde ¿cómo se busca?","¿Por qué las escaleras nunca bajan cansadas?","¿Puede un mapa equivocarse de destino?","¿Cómo se mide la distancia entre dos suspiros?","¿Por qué las campanas siempre son nostálgicas?","¿Puede una frontera desaparecer si todos se olvidan de ella?","¿Cuántos segundos caben en un abrazo?","¿Puede una promesa olvidarse de sí misma?","Si la gravedad se toma un descanso ¿qué sube primero?","¿Dónde van las risas cuando se pierden?","¿Dónde va el sol por la noche?","¿Por qué los pies no se ríen?","¿Y si los colores sienten cosas?","¿Existe el número más triste?","¿Quién le enseña a volar a los pájaros?","¿Y si el universo tiene cosquillas?","¿El viento está vivo?","¿Se puede guardar un sueño en una caja?","¿Por qué tenemos que dormir todos los días?","¿Y si el tiempo se aburre?","¿Los peces tienen sed?","¿Qué pasa si me olvido de quién soy?","¿Las montañas se mueven cuando nadie mira?","¿Puede una sombra enamorarse?","¿Dónde estaba yo antes de nacer?","¿Las palabras se gastan?","¿El silencio suena igual para todos?","¿Se puede llorar de risa para siempre?","¿Y si mi reflejo tiene otra vida?","¿Dónde están las cosas que olvido?","¿El cielo tiene fondo?","¿Quién fue el primer ser que rió?","¿Puede una nube tener nombre?","¿Y si la luna es un espejo?","¿Las plantas se aburren?","¿Los sueños pesan?","¿Y si todo esto ya pasó?","¿Por qué a veces todo parece falso?","¿Puede un recuerdo mentir?","¿Existe el lugar donde nacen las ideas?","¿Los números duermen?","¿Quién cuida al tiempo?","¿Los suspiros viajan?","¿Se puede dibujar un pensamiento?","¿Y si somos personajes de un cuento?","¿Puede una silla extrañarte?","¿Quién inventó el miedo?","¿Los relojes se cansan?","¿El universo tiene límites o se estira?","¿Y si alguien ya escribió lo que voy a decir?","¿Puede un abrazo durar toda la vida?","¿Las sombras se asustan?","¿Dónde empieza el culo?","¿Y si todo esto es un sueño muy largo?","¿Las piedras piensan lento?","¿Quién fue el primero en tener frío?","¿Y si las estrellas nos miran?","¿La duda tiene forma?","¿Puede una pregunta no tener respuesta?"] },
  CONFESIÓN:{ simple:["Me gusta lamer pasamanos","A base de ensayar mucho mucho mucho a lo largo de toda mi vida, finjo que no tengo orgasmos","Me robaron las cosas que había robado yo en Zara","Protestante","Robé un pastel y nunca lo confesé.","Tengo miedo a los payasos.","Nunca aprendí a nadar.","Siempre quise ser astronauta.","Le hablo a mis plantas como si fueran personas.","Lloré viendo una película infantil.","Me perdí en mi propio barrio.","No sé montar en bicicleta.","Me inventé un amigo imaginario... ¡ayer!","Una vez confundí azúcar con sal en una fiesta.","Tengo una colección secreta de piedras."], plus:["Me gusta lamer pasamanos","A base de ensayar mucho mucho mucho a lo largo de toda mi vida, finjo que no tengo orgasmos","Me robaron las cosas que había robado yo en Zara","Protestante","Robé un pastel y nunca lo confesé.","Tengo miedo a los payasos.","Nunca aprendí a nadar.","Siempre quise ser astronauta.","Le hablo a mis plantas como si fueran personas.","Lloré viendo una película infantil.","Me perdí en mi propio barrio.","No sé montar en bicicleta.","Me inventé un amigo imaginario... ¡ayer!","Una vez confundí azúcar con sal en una fiesta.","Tengo una colección secreta de piedras.","Me reí en un momento muy serio.","Escondí un regalo porque no me gustó.","Me gustaría ser superhéroe en secreto.","Rompí un objeto valioso y culpé al perro.","Nunca he probado el sushi.","Bailé solo en la calle pensando que nadie me veía.","Me asustan los globos que explotan.","Inventé una excusa absurda para faltar al trabajo.","De pequeño pensaba que el microondas era mágico.","Me hice pasar por otra persona en un museo.","Canté en la ducha y me aplaudieron desde otra casa.","Una vez olvidé mi propio cumpleaños.","Me emocioné leyendo un cómic.","Me quedé encerrado en un baño público.","Creía que los camaleones podían volverse invisibles.","He fingido saber bailar en una boda.","Tengo una risa contagiosa y me da vergüenza.","Dormí toda una obra de teatro y fingí haberla entendido.","Escondí mi juguete favorito para no compartirlo.","Robé un yogur del supermercado.","Nunca aprendí a montar en bici.","Tengo miedo de los globos.","Siempre leo los finales de los libros antes de empezar.","Me comí tu postre sin avisar.","Nunca sé dónde está el norte.","Lloro viendo anuncios de detergente.","Fui yo quien rayó el coche.","Nunca devolví ese libro de la biblioteca.","A veces hablo solo en voz alta.","Finjo saber de vinos para quedar bien.","Tengo más plantas muertas que vivas.","Me he inventado idiomas para no contestar.","Siempre confundo la izquierda con la derecha.","Dejé caer tu móvil y fingí que no.","Nunca aprendí a multiplicar con las tablas.","Cambié el canal en mitad de tu serie favorita.","Robé un bolígrafo y me sentí poderoso.","No entiendo los chistes de matemáticos.","No soporto el sonido de los lápices.","Me duermo en las reuniones importantes.","Guardé tu regalo en el fondo del armario.","Perdí la entrada del concierto y no lo dije.","Uso el móvil en modo avión para ignorar.","Me comí todas las galletas en secreto.","Creo que los gatos gobiernan el mundo en secreto.","Una vez intenté comunicarme con las plantas.","Siempre creí que las tostadoras eran peligrosas.","Pensaba que las cebras eran caballos disfrazados.","Le hablo a mi espejo como si fuera un amigo.","Creí que las estalactitas eran animales dormidos.","Intenté guardar un arco iris en un frasco.","Fui perseguido por un pato durante una hora.","Quise enseñarle álgebra a mi perro.","Robé una nube imaginaria de un parque.","Cambié mi reflejo en una fuente por otro.","Escondí una carta de amor en un buzón vacío.","Me disfracé de alfombra para espiar una conversación.","Creí que podía hacer fotos con los ojos.","Prometí no volver a hablar con las sillas.","Intenté hipnotizar a mi profesor de historia.","Pensé que podía domesticar una roca.","Una vez discutí con una sombra.","Le pedí matrimonio a una estatua.","Creí que los gnomos robaban calcetines.","Quise vender arena en el desierto.","Jugué al escondite conmigo mismo.","Inventé un idioma secreto para hablarme.","Pensaba que las ideas caían del cielo.","Construí una casa para caracoles.","Siempre soñé con ser otro.","Me arrepiento de haber callado aquella vez.","Me enamoré de alguien que nunca conocí.","Rompí una promesa y nunca lo conté.","Finjo estar feliz cuando no lo estoy.","Deseo cambiar mi vida por completo.","Me siento culpable por no despedirme.","Siempre supe que mentía y no lo dije.","A veces imagino que todo es un escenario.","Me asusta no ser suficiente.","Quise marcharme pero no tuve valor.","Perdí algo que nunca podré recuperar.","Me duele no saber pedir perdón.","Siempre quise pedirte otra oportunidad.","Fingí ser valiente cuando más miedo tenía.","Quise decir la verdad pero mentí.","Me escondí cuando debí enfrentarme.","Lloré cuando nadie me veía.","Me prometí no volver a confiar.","Siempre quise ser alguien diferente.","Nunca aprendí a andar en bici","Le hablo a las plantas como si fueran mis amigas","Una vez fingí saber bailar tango y pisé a cinco personas","Como papas fritas en la ducha","Copié en un examen de ética","Me enamoré de mi profesor de historia","Tengo un cajón lleno de calcetines perdidos que no son míos","Me sé todas las canciones de Frozen de memoria","Llevo años mintiendo sobre mi edad","Le puse nombre a mi cafetera y le doy los buenos días","Una vez me disfracé de plátano para una boda","No soporto las aceitunas pero siempre digo que me encantan","Le puse azúcar a la tortilla pensando que era sal y fingí que era una receta nueva","Leí solo una página del libro del club de lectura","Entré en una clase de yoga por error y me quedé todo el curso","Me enamoré de un dibujo animado","He fingido saber tocar el ukelele en más de una cita","Una vez dormí abrazado a una escoba","Robé una tiza del colegio y aún la guardo","Me reí tanto que me hice pis en una entrevista de trabajo","Creía que \"wifi\" era una bebida energética","Fingí saber francés en una cena y terminé hablando en italiano","He enviado mensajes de amor a números equivocados","Me excita el olor de los libros nuevos","He llorado viendo vídeos de animales abrazándose","Comí pastel de boda sin haber sido invitado","Le hablé a mi reflejo pensando que era otra persona","Me gusta imitar acentos mientras cocino","Llevo un diario secreto donde solo escribo frases de películas","Una vez creí ser parte de una película y saludé a una cámara de seguridad","Tengo una cuenta falsa para seguir a mi ex","He intentado hipnotizarme viendo espirales en YouTube","Dije que tenía alergia a los gatos para no ir a una cita","Creí que podía comunicarme con los insectos","Guardé una carta de amor que nunca entregué","Una vez me perdí en mi propio barrio","Pensaba que el Vaticano era un parque temático","Bailo solo en el ascensor","Le di un apodo cariñoso a mi nevera","Me he inventado un gemelo malvado para explicar cosas raras","Fingí saber hacer magia para impresionar a alguien","Dibujé bigotes en fotos de mi jefe","Fingí un acento ruso para conseguir una cerveza gratis","Me he confesado cosas a mí mismo en voz alta en la ducha","Me declaré a alguien por error en una llamada equivocada","Pensaba que “networking” era un deporte","He traducido canciones inventando las letras","He intentado ligar con una IA","Mi contraseña es el nombre de un peluche","Todavía duermo con la luz encendida por si acaso"] },
  FRASE:{ simple:["Todo está floreciendo demasiado rápido","Deica logo, baby","Siempre nos quedara Paquirrín","Hijo mío, algún día... todo esto será de tu hermano","Hoy es el primer día del resto de tu locura","Nadie nos advirtió que soñar era peligroso","Si saltamos quién nos va a detener","El secreto está en lo que no decimos","Siempre supe que el universo tenía sentido hasta hoy","Nunca confíes en un mapa dibujado a lápiz","No todos los héroes llevan capa: algunos llevan paraguas","La verdadera magia es no saber cómo termina la historia","Una taza de café puede cambiar el mundo","Aquí empieza la locura y termina la razón","El último en reír apaga las estrellas"], plus:["Todo está floreciendo demasiado rápido","Deica logo, baby","Siempre nos quedara Paquirrín","Hijo mío, algún día... todo esto será de tu hermano","Hoy es el primer día del resto de tu locura","Nadie nos advirtió que soñar era peligroso","Si saltamos quién nos va a detener","El secreto está en lo que no decimos","Siempre supe que el universo tenía sentido hasta hoy","Nunca confíes en un mapa dibujado a lápiz","No todos los héroes llevan capa: algunos llevan paraguas","La verdadera magia es no saber cómo termina la historia","Una taza de café puede cambiar el mundo","Aquí empieza la locura y termina la razón","El último en reír apaga las estrellas","Prometimos no volver y aquí estamos","A veces los monstruos son los mejores aliados","Todo parecía una buena idea al principio","Nunca es tarde para cambiar de planeta","El viento sabe más secretos que nosotros","La llave siempre estuvo en tu bolsillo","Un segundo puede durar una eternidad o arruinarla","Este no era el plan pero tampoco está tan mal","Hay caminos que solo se abren si corres","No es magia: es voluntad disfrazada","A veces hay que perderse para encontrarlo todo","No somos quiénes éramos cuando empezó esta historia","Todo gran error comienza con una pequeña decisión","Aquí las reglas no existen y si existen se inventan","Quién necesita alas teniendo imaginación","Cada despedida es una promesa de regreso","El miedo es solo el preludio de algo increíble","La mejor aventura empieza con un sí tonto","No me busques; estoy bailando con los dragones","Solo quien arde en la caída puede renacer","Prefiero morir de pie que vivir de rodillas","La última bala no es para el enemigo","El trueno me sigue pero yo soy el rayo","Si caemos caeremos luchando","No nací para huir","La oscuridad es solo el inicio de mi luz","No temo al fin; temo no haber vivido","Cada cicatriz es un mapa hacia la victoria","Somos polvo de estrellas que aprendió a pelear","El miedo alimenta a los cobardes; no a los héroes","Nadie puede detener a quien ya no tiene cadenas","El horizonte es solo un obstáculo mental","Donde termina el miedo comienza la historia","Hoy no es el día de rendirse","El fuego me forjó; la tempestad me liberó","El silencio antes del rugido es el más peligroso","Cada paso que doy es una rebelión","No necesito alas para volar","No lucho para ganar; lucho porque no sé rendirme","Si la sopa canta no la contradigas","¿Quién pone puertas al campo de fútbol?","Mi sombra me debe dinero","El café me susurró secretos esta mañana","Si tropiezo dos veces es coreografía","Las tostadas saben más si saltas tres veces","Cuidado; el suelo también tiene sueños","Mis ideas huelen a sandía","Nunca subestimes a un zapato con intenciones","Esta puerta habla en varios idiomas","Los peces están conspirando de nuevo","Soy el heredero legítimo de un árbol centenario","Mi abuela domó dragones en su juventud","He visto patatas más valientes que tú","Mi bigote tiene opiniones políticas","El helado no entiende de fronteras","Las nubes me deben una disculpa","Abrazar un cactus es una elección de vida","Solo los calcetines valientes forman parejas","No sé qué hago aquí, pero el sofá me habló","El viento escribió mi biografía en una servilleta","Hay un pingüino que sabe mis secretos","Si bailas mal... culpa a la gravedad","Me enamoré de un semáforo","Hoy el aire sabe a despido","El champú eligió a su nuevo líder","Los semáforos parpadean porque saben algo","Mis pensamientos tienen wifi propio","El lunes no es un día: es un estado mental","Esta nevera susurra promesas rotas","El río olvida quién fue lluvia primero y quién fue lágrima","Busqué un espejo y encontré una ventana hacia mí mismo","El viento escribe nombres en la arena que nadie recuerda","Camina la piedra hacia el olvido sin dejar huella","La luna espera una respuesta muda de los antiguos","El árbol canta cuando no queda nadie para escucharlo","Sube el humo a donde van las dudas y los secretos","¿Cuántos silencios se necesitan para inventar el mar?","El faro ciego guía a los barcos que nunca existieron","Cuando caes no sabes si el suelo es principio o fin","El pez sueña con ríos de estrellas y no despierta","Las piedras saben el peso exacto de los adioses","El horizonte no es más que un suspiro que no alcanzamos","Si olvidas el nombre ¿quién eres cuando sueñas? ¿quién cuando callas?","Donde no hay sombra el miedo se hace polvo y se dispersa","Grita el silencio entre paredes ciegas y nadie escucha","El eco miente y devuelve promesas que nunca hicimos","El puente duda antes de sostener tanto recuerdo","El polvo ríe cuando el tiempo se duerme y nadie lo ve","¿Quién lleva el mapa cuando se pierde el camino?","La noche se apaga pero yo sigo encendido","Cuando no quede nadie yo seguiré bailando","Hay trenes que solo pasan cuando no miras","El silencio también grita","Una verdad sin zapatos","Me fui pero no del todo","La sombra también se cansa","Lo que no se dice se convierte en canción","El reloj se durmió antes que yo","Bésame antes de que nos olviden","Las estrellas también lloran","Aquí no hay héroes solo testigos","Y sin embargo te soñé","La tormenta no avisa solo llega","Nadie sobrevive al martes","El destino tiene mala letra","Esto no es amor es otra cosa peor","Perdón por llegar temprano al final","El fuego nunca olvida","Todo lo que callamos suena más fuerte","Los fantasmas también tienen frío","Mi casa ya no me reconoce","Hazlo como si tu vida fuera un tráiler","Recuerdo tu nombre pero no tu voz","Las puertas se cierran solas","Los lunes saben a derrota","No todos los villanos ríen","Abre los ojos y quédate dormido","Quise volver pero ya no quedaba mundo","La suerte se cambió de acera","Esto es una despedida en cámara lenta","El mar no tiene memoria","Mi sombra firmó un contrato sin mí","Estaba todo escrito con lápiz","No es locura si lo crees tú también","La risa era un disfraz","Dejamos de hablar pero no de gritar por dentro","Cuidado con los espejos antiguos","Era feliz y no lo sabía pero ahora sí","Tu voz sigue sonando en mis silencios","Ya no tengo miedo solo prisa","Me esperé a mí mismo y no llegué","Las películas también se aburren de sí mismas","El monstruo estaba dentro pero saludaba desde fuera","Todo lo que brilla ciega","El guion lo rompí yo mismo","Y si no pasa nada será porque ya pasó todo","Nada personal solo eterno","Hoy soy otro pero peor","Esto podría ser el comienzo si no fuera el final"] },
};
const TIPO_COLOR = {calentamiento:"#ffd740",entrenamiento:"#40c4ff",juego:"#69f0ae",formato:"#e040fb",musical:"#ff80ab",pausa:"#78909c",cierre:"#ff6e40"};
const CAT_ICONS = {PROFESIÓN:"👤",OBJETO:"✦",LUGAR:"📍",EMOCIÓN:"💜",ACCIÓN:"🎭",NOMBRE:"📛",SUPERPODER:"⚡",ESTILO:"🎬",DUDA:"❓",CONFESIÓN:"🤫",FRASE:"💬"};
const CATS = Object.keys(ESTIMULOS_BASE);
const UID = () => Math.random().toString(36).slice(2,10);
const FMT = s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const ls = {
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
};

const trackGen = (cat) => {
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
const trackDin = (nombre) => {
  const s = ls.get("impro_stats", {cats:{}, dins:{}, total:0, mins:0});
  s.dins = s.dins || {};
  s.dins[nombre] = (s.dins[nombre]||0) + 1;
  ls.set("impro_stats", s);
};
const trackMins = (m) => {
  const s = ls.get("impro_stats", {cats:{}, total:0, mins:0});
  s.mins = (s.mins||0) + m;
  ls.set("impro_stats", s);
};

const mkS = (T) => ({
  panel:{background:T.bg2,border:`1.5px solid ${T.border}`,borderRadius:14,padding:"1.25rem"},
  btn:(bg,color="#fff")=>({background:bg,color,border:"none",borderRadius:9,padding:"0.5rem 1rem",fontWeight:700,cursor:"pointer",fontSize:"0.85rem",transition:"all 0.15s",whiteSpace:"nowrap",fontFamily:"inherit"}),
  input:{background:T.input,border:`1.5px solid ${T.inputBorder}`,borderRadius:8,color:T.text,padding:"0.48rem 0.75rem",fontSize:"0.88rem",fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"},
  ptitle:(c)=>({color:c,fontSize:"0.72rem",letterSpacing:"0.15em",margin:"0 0 0.9rem",fontFamily:"monospace",fontWeight:700,textTransform:"uppercase"}),
  tag:(c)=>({background:c+"22",color:c,borderRadius:5,padding:"0.1rem 0.45rem",fontSize:"0.72rem",fontWeight:700}),
});

function useAudio() {
  const ctxRef=useRef(null);
  const getCtx=()=>{if(!ctxRef.current)ctxRef.current=new(window.AudioContext||window.webkitAudioContext)();if(ctxRef.current.state==="suspended")ctxRef.current.resume();return ctxRef.current;};
  const tone=useCallback((f,d=0.3,t="sine",v=0.4,t0=0)=>{try{const ctx=getCtx(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type=t;o.frequency.setValueAtTime(f,ctx.currentTime+t0);g.gain.setValueAtTime(v,ctx.currentTime+t0);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+t0+d);o.start(ctx.currentTime+t0);o.stop(ctx.currentTime+t0+d);}catch(e){}});
  const playBell=useCallback(()=>{tone(880,2,"sine",0.4);tone(1760,1.2,"sine",0.15);});
  const metroBeat=useCallback((bc,beats)=>{try{const ctx=getCtx(),isOne=bc%beats===0,f=isOne?1000:440,o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=f;const now=ctx.currentTime;g.gain.setValueAtTime(isOne?0.7:0.4,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.06);o.start(now);o.stop(now+0.1);}catch(e){}});
  return{tone,playBell,metroBeat};
}

function TimerBar({audio,launchRef,onTimerChange}){
  const {T}=useTheme();
  const [display,setDisplay]=useState(300);
  const [preset,setPreset]=useState(300);
  const [running,setRunning]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const ref=useRef(null);
  const urgent=display>0&&display<10,warning=display>0&&display<30;
  useEffect(()=>{
    if(running){ref.current=setInterval(()=>{setDisplay(p=>{if(p<=1){setRunning(false);audio.playBell();return 0;}return p-1;});},1000);}
    else clearInterval(ref.current);
    return()=>clearInterval(ref.current);
  },[running]);
  useEffect(()=>{if(launchRef)launchRef.current=(secs)=>{setPreset(secs);setDisplay(secs);setRunning(true);setExpanded(false);};},[launchRef]);
  useEffect(()=>{if(onTimerChange)onTimerChange(display,running,preset);},[display,running,preset]);
  const PRESETS=[30,60,120,180,300,600];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:T.nav,borderTop:`1px solid ${T.navBorder}`,transition:"all 0.3s"}}>
      {expanded&&(
        <div style={{padding:"0.55rem 1rem",display:"flex",gap:"0.4rem",justifyContent:"center",flexWrap:"wrap",borderBottom:`1px solid ${T.border}`}}>
          {PRESETS.map(t=><button key={t} onClick={()=>{setPreset(t);setDisplay(t);setRunning(false);}} style={{background:preset===t?T.accent+"22":T.bg3,border:`1px solid ${preset===t?T.accent:T.border}`,color:preset===t?T.accent:T.text3,borderRadius:7,padding:"0.22rem 0.55rem",fontSize:"0.76rem",cursor:"pointer",fontFamily:"inherit"}}>{FMT(t)}</button>)}
          <button onClick={()=>{setRunning(false);setDisplay(preset);}} style={{background:T.bg3,border:`1px solid ${T.border}`,color:T.text3,borderRadius:7,padding:"0.22rem 0.55rem",fontSize:"0.76rem",cursor:"pointer"}}>↺</button>
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.5rem 1rem",maxWidth:960,margin:"0 auto"}}>
        <button onClick={()=>setExpanded(!expanded)} style={{background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:"0.8rem",padding:"0.2rem",flexShrink:0}}>⏱</button>
        <div onClick={()=>setExpanded(!expanded)} style={{fontFamily:"monospace",fontWeight:900,fontSize:"clamp(1rem,4vw,1.4rem)",color:urgent?"#ff6e40":warning?"#ffd740":T.text,textShadow:urgent?"0 0 20px #ff6e4066":"none",minWidth:70,cursor:"pointer",animation:urgent?"urgentPulse 0.5s ease infinite alternate":"none"}}>{FMT(display)}</div>
        <button onClick={()=>setRunning(!running)} style={{background:running?"#ff6e40":"#69f0ae",color:"#000",border:"none",borderRadius:7,padding:"0.35rem 0.85rem",fontWeight:700,cursor:"pointer",fontSize:"0.82rem",flexShrink:0}}>{running?"⏸":"▶"}</button>
        <div style={{flex:1,height:4,background:T.bg4,borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${preset>0?(display/preset)*100:0}%`,background:urgent?"#ff6e40":warning?"#ffd740":T.accent,borderRadius:2,transition:"width 1s linear"}}/>
        </div>
      </div>
    </div>
  );
}

function Spotlight({word,category,onClose}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"radial-gradient(ellipse at center,rgba(224,64,251,0.18) 0%,rgba(0,0,0,0.97) 70%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",animation:"fadeIn 0.3s ease"}}>
      <p style={{color:"#e040fb",fontFamily:"monospace",fontSize:"0.9rem",letterSpacing:"0.3em",marginBottom:"1.5rem",textTransform:"uppercase"}}>{category}</p>
      <h1 style={{fontSize:"clamp(2.5rem,9vw,7rem)",fontWeight:900,color:"#fff",textShadow:"0 0 60px rgba(224,64,251,0.6)",lineHeight:1.1,maxWidth:"80vw",textAlign:"center",animation:"spotlightIn 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}>{word}</h1>
      <p style={{color:"#555",marginTop:"3rem",fontSize:"0.82rem"}}>Toca para cerrar</p>
    </div>
  );
}

function TabGenerar({onStimulus}){
  const {T}=useTheme();const S=mkS(T);
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

  const getList=cat=>{
    const d=ESTIMULOS_BASE[cat];
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
        {[["cats","Categ."],["scene","🎬 Escena"],["favs",`♡ (${favoritos.length})`]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{...S.btn(view===v?T.bg2:"transparent",view===v?T.text:T.text3),borderRadius:8,padding:"0.35rem 0.6rem",fontSize:"0.78rem",boxShadow:view===v?"0 1px 4px rgba(0,0,0,0.15)":"none"}}>{l}</button>
        ))}
      </div>
    </div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem",flexWrap:"wrap",alignItems:"center"}}>
      <div style={{display:"flex",background:T.bg3,borderRadius:10,padding:3,gap:2}}>
        {[["simple","◆ Simple"],["plus","⭐ Plus"]].map(([v,l])=>(
          <button key={v} onClick={()=>setNivel(v)} style={{...S.btn(v==="plus"&&nivel==="plus"?T.accent:v==="simple"&&nivel==="simple"?T.bg2:"transparent",v===nivel?(v==="plus"?"#fff":T.text):T.text3),borderRadius:8,padding:"0.35rem 0.65rem",fontSize:"0.78rem"}}>{l}</button>
        ))}
      </div>
      {view==="cats"&&<button onClick={generateRandom} style={S.btn(T.accent)}>🎲 Al azar</button>}
    </div>

    {view==="favs"&&(<div>
      {favoritos.length===0?<div style={{...S.panel,textAlign:"center",padding:"2rem"}}><p style={{color:T.text4}}>Aún no has guardado ningún estímulo. Genera uno y pulsa ♡.</p></div>
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
          <p style={{fontSize:"1.5rem",margin:"0 0 0.5rem"}}>📜</p><p style={{margin:0}}>Genera escenas para verlas aquí.</p>
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
        <p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.6rem",letterSpacing:"0.1em",fontFamily:"monospace"}}>PLANTILLAS RÁPIDAS</p>
        <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginBottom:"0.75rem"}}>
          {[
            {label:"Clásica",cats:["PROFESIÓN","LUGAR","EMOCIÓN"]},
            {label:"Conflicto",cats:["PROFESIÓN","ACCIÓN","EMOCIÓN"]},
            {label:"Absurda",cats:["SUPERPODER","LUGAR","CONFESIÓN"]},
            {label:"Dramática",cats:["NOMBRE","LUGAR","FRASE"]},
            {label:"Cine",cats:["PROFESIÓN","ESTILO","EMOCIÓN"]},
            {label:"Completa",cats:["PROFESIÓN","LUGAR","EMOCIÓN","ACCIÓN"]},
          ].map(t=>(<button key={t.label} onClick={()=>setSceneCats(t.cats)} style={{background:JSON.stringify(sceneCats)===JSON.stringify(t.cats)?T.accent+"22":T.bg3,border:`1.5px solid ${JSON.stringify(sceneCats)===JSON.stringify(t.cats)?T.accent:T.border}`,color:JSON.stringify(sceneCats)===JSON.stringify(t.cats)?T.accent:T.text3,borderRadius:8,padding:"0.3rem 0.65rem",cursor:"pointer",fontSize:"0.78rem",fontFamily:"inherit"}}>{t.label}</button>))}
        </div>
        <p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.5rem",letterSpacing:"0.1em",fontFamily:"monospace"}}>O ELIGE MANUALMENTE</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:"0.35rem",marginBottom:"0.75rem"}}>
          {CATS.map(cat=>{const active=sceneCats.includes(cat);return(<button key={cat} onClick={()=>setSceneCats(s=>active?s.filter(c=>c!==cat):[...s,cat])} style={{background:active?T.accent+"22":T.bg3,border:`1.5px solid ${active?T.accent:T.border}`,color:active?T.accent:T.text3,borderRadius:8,padding:"0.28rem 0.6rem",cursor:"pointer",fontSize:"0.76rem",fontFamily:"inherit",display:"flex",gap:"0.3rem",alignItems:"center"}}><span>{CAT_ICONS[cat]}</span><span>{cat}</span></button>);})}
        </div>
        <button onClick={generateScene} disabled={!sceneCats.length} style={{...S.btn(T.accent),width:"100%",opacity:!sceneCats.length?0.4:1}}>🎬 Generar escena</button>
      </div>
      {scene&&(<div style={{...S.panel,border:`1.5px solid ${T.accent}44`,animation:"fadeIn 0.35s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.85rem",flexWrap:"wrap",gap:"0.5rem"}}>
          <span style={{color:T.accent,fontSize:"0.72rem",fontFamily:"monospace",letterSpacing:"0.15em"}}>ESCENA GENERADA</span>
          <div style={{display:"flex",gap:"0.5rem"}}>
            <button onClick={()=>scene.forEach(i=>saveFav(i))} style={S.btn(T.bg3,T.text2)}>♡ Guardar</button>
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
            {scene.find(s=>s.cat==="DUDA")&&` Y la gran pregunta: ${scene.find(s=>s.cat==="DUDA").word}`}
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:"0.5rem"}}>
        {CATS.map(cat=>{return(
          <button key={cat} onClick={()=>generate(cat)} style={{background:sel?.cat===cat?T.accent+"18":T.bg2,border:`1.5px solid ${sel?.cat===cat?T.accent:T.border}`,borderRadius:10,padding:"0.75rem 0.9rem",color:T.text,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.15s"}}>
            <span>{CAT_ICONS[cat]||"◆"}</span>
            <span style={{flex:1,fontWeight:600,fontSize:"0.85rem"}}>{cat}</span>

            {ESTIMULOS_BASE[cat].plus.length>0&&nivel==="simple"&&<span style={{color:T.accent,fontSize:"0.6rem"}}>⭐</span>}
            <span style={{color:T.text4,fontSize:"0.72rem"}}>{getList(cat).length}</span>
          </button>
        );})}
      </div>
      {sel&&!spotlight&&(<div style={{marginTop:"1.25rem",...S.panel,border:`1.5px solid ${T.accent}22`,textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"center",gap:"0.5rem",marginBottom:"0.4rem",alignItems:"center"}}>
          <p style={{color:T.accent,fontSize:"0.7rem",letterSpacing:"0.25em",margin:0}}>{sel.cat}</p>
          {sel.isIdea&&<span style={S.tag("#69f0ae")}>👥 GRUPO</span>}
        </div>
        <p style={{color:T.text,fontSize:"1.8rem",fontWeight:800,margin:"0 0 0.75rem",cursor:"pointer"}} onClick={()=>setSpotlight(sel)}>{sel.word}</p>
        <div style={{display:"flex",gap:"0.5rem",justifyContent:"center"}}>
          <button onClick={()=>setSpotlight(sel)} style={S.btn(T.bg3,T.text2)}>⛶ Pantalla completa</button>
          <button onClick={()=>saveFav(sel)} style={S.btn(T.bg3,T.text2)}>♡ Guardar</button>
        </div>
      </div>)}
    </>)}
  </div>);
}

function TabReto(){
  const {T}=useTheme();const S=mkS(T);
  const [reto,setReto]=useState(null);
  const [nivel,setNivel]=useState("simple");
  const getList=cat=>{const d=ESTIMULOS_BASE[cat];return nivel==="plus"&&d.plus.length>0?d.plus:d.simple;};
  const genReto=()=>{
    const todasDinamicas=ls.get("impro_dinamicas_v2",DINAMICAS_BASE);
    const din=pick(todasDinamicas);
    trackDin(din.nombre);
    const opts=[["PROFESIÓN","LUGAR","EMOCIÓN"],["ACCIÓN","ESTILO"],["OBJETO","EMOCIÓN","FRASE"],["PROFESIÓN","ACCIÓN"],["LUGAR","DUDA"],["SUPERPODER","PROFESIÓN","EMOCIÓN"]];
    const estimulos=pick(opts).map(cat=>({cat,word:pick(getList(cat))}));
    setReto({din,estimulos});
  };
  return(<div>
    <div style={{...S.panel,marginBottom:"1.25rem"}}>
      <p style={{color:T.text2,lineHeight:1.6,margin:"0 0 1rem",fontSize:"0.88rem"}}>Combina una dinámica, estímulos y tiempo en una propuesta lista para usar de inmediato.</p>
      <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
        <div style={{display:"flex",background:T.bg3,borderRadius:10,padding:3,gap:2}}>
          {[["simple","◆ Simple"],["plus","⭐ Plus"]].map(([v,l])=>(
            <button key={v} onClick={()=>setNivel(v)} style={{...S.btn(v==="plus"&&nivel==="plus"?T.accent:v==="simple"&&nivel==="simple"?T.bg2:"transparent",v===nivel?(v==="plus"?"#fff":T.text):T.text3),borderRadius:8,padding:"0.35rem 0.65rem",fontSize:"0.78rem"}}>{l}</button>
          ))}
        </div>
        <button onClick={genReto} style={{...S.btn(T.accent),flex:1}}>⚡ Generar reto</button>
      </div>
    </div>
    {reto?(<div style={{animation:"fadeIn 0.35s ease"}}>
      <div style={{...S.panel,marginBottom:"0.75rem",border:`1.5px solid ${TIPO_COLOR[reto.din.tipo]||T.accent}44`,borderLeft:`4px solid ${TIPO_COLOR[reto.din.tipo]||T.accent}`}}>
        <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.5rem",alignItems:"center",flexWrap:"wrap"}}>
          <span style={S.tag(TIPO_COLOR[reto.din.tipo]||T.accent)}>{reto.din.tipo}</span>
          <span style={{color:T.text3,fontSize:"0.78rem"}}>⏱ {reto.din.duracion} min</span>
        </div>
        <p style={{color:T.text,fontWeight:900,fontSize:"1.15rem",margin:"0 0 0.35rem"}}>{reto.din.nombre}</p>
        <p style={{color:T.text2,fontSize:"0.85rem",margin:0,lineHeight:1.5}}>{reto.din.desc}</p>
      </div>
      <div style={{...S.panel,marginBottom:"0.75rem"}}>
        <p style={S.ptitle(T.text3)}>Con estos estímulos</p>
        <div style={{display:"grid",gap:"0.55rem"}}>
          {reto.estimulos.map((e,i)=>(<div key={i} style={{display:"flex",gap:"0.65rem",alignItems:"center",background:T.bg3,borderRadius:10,padding:"0.6rem 0.85rem"}}>
            <span style={{fontSize:"1rem"}}>{CAT_ICONS[e.cat]||"◆"}</span>
            <div><p style={{color:T.text3,fontSize:"0.65rem",letterSpacing:"0.1em",margin:"0 0 0.1rem",fontFamily:"monospace"}}>{e.cat}</p><p style={{color:T.text,fontWeight:700,margin:0,fontSize:"0.95rem"}}>{e.word}</p></div>
          </div>))}
        </div>
      </div>
      <div style={{...S.panel,background:T.accent+"11",border:`1.5px solid ${T.accent}33`,textAlign:"center"}}>
        <p style={{color:T.accent,fontWeight:700,fontSize:"0.88rem",margin:"0 0 0.25rem"}}>🎯 El reto</p>
        <p style={{color:T.text2,fontSize:"0.82rem",margin:"0 0 1rem",lineHeight:1.5}}>Haz <strong style={{color:T.text}}>{reto.din.nombre}</strong> usando {reto.estimulos.map(e=>e.word).join(", ")} en máximo <strong style={{color:T.text}}>{reto.din.duracion} minutos</strong>.</p>
        <button onClick={genReto} style={{...S.btn(T.accent),width:"100%"}}>⚡ Otro reto</button>
      </div>
    </div>):(<div style={{...S.panel,textAlign:"center",padding:"3rem 1rem"}}>
      <p style={{fontSize:"2.5rem",margin:"0 0 0.75rem"}}>⚡</p>
      <p style={{color:T.text2,margin:"0 0 0.5rem",fontSize:"0.95rem",fontWeight:700}}>Generador de retos</p>
      <p style={{color:T.text3,fontSize:"0.82rem",margin:0}}>Pulsa el botón para obtener un ejercicio completo listo para usar.</p>
    </div>)}
  </div>);
}

const PLANTILLAS=[
  {id:"p1",nombre:"Entrenamiento estándar 90 min",descripcion:"Sesión equilibrada",bloques:[{tipo:"calentamiento",titulo:"Calentamiento físico",duracion:15,notas:"Zip Zap Zop"},{tipo:"entrenamiento",titulo:"Ejercicios de base",duracion:25,notas:"Sí y..."},{tipo:"pausa",titulo:"Descanso",duracion:10,notas:""},{tipo:"juego",titulo:"Juego libre",duracion:20,notas:"Película en géneros"},{tipo:"formato",titulo:"Formato completo",duracion:15,notas:"Harold corto"},{tipo:"cierre",titulo:"Cierre",duracion:5,notas:"Ronda de una palabra"}]},
  {id:"p2",nombre:"Calentamiento rápido 30 min",descripcion:"Antes de un show",bloques:[{tipo:"calentamiento",titulo:"Activación rápida",duracion:10,notas:"Zip Zap Zop"},{tipo:"entrenamiento",titulo:"Escenas cortas",duracion:15,notas:"Sí y..."},{tipo:"cierre",titulo:"Foco",duracion:5,notas:"Círculo de silencio"}]},
  {id:"p3",nombre:"Show Harold 60 min",descripcion:"Harold completo",bloques:[{tipo:"calentamiento",titulo:"Calentamiento",duracion:15,notas:""},{tipo:"formato",titulo:"Harold completo",duracion:45,notas:"Con sugerencia del público"}]},
  {id:"p4",nombre:"Sesión musical 75 min",descripcion:"Impro con música",bloques:[{tipo:"calentamiento",titulo:"Beatbox colectivo",duracion:10,notas:""},{tipo:"musical",titulo:"Género musical",duracion:15,notas:""},{tipo:"pausa",titulo:"Descanso",duracion:7,notas:""},{tipo:"musical",titulo:"Canción del personaje",duracion:15,notas:""},{tipo:"musical",titulo:"El musical en 5 min",duracion:15,notas:""},{tipo:"cierre",titulo:"Ronda de una palabra",duracion:5,notas:""}]},
];

const POMO_PRESETS=[
  {label:"Estándar",bloques:[{t:"trabajo",n:"Exercicio",m:20},{t:"descanso",n:"Descanso",m:5},{t:"trabajo",n:"Exercicio",m:20},{t:"descanso",n:"Descanso",m:5},{t:"trabalho",n:"Exercicio",m:20},{t:"longo",n:"Descanso longo",m:15}]},
  {label:"Show",bloques:[{t:"trabajo",n:"Calentamento",m:15},{t:"trabajo",n:"Formato 1",m:20},{t:"descanso",n:"Pausa",m:10},{t:"trabajo",n:"Formato 2",m:20}]},
  {label:"Maratón",bloques:[{t:"trabajo",n:"Calentamento",m:15},{t:"trabajo",n:"Bloque 1",m:25},{t:"descanso",n:"Descanso",m:5},{t:"trabajo",n:"Bloque 2",m:25},{t:"descanso",n:"Descanso",m:5},{t:"trabajo",n:"Bloque 3",m:25}]},
];
const BCOLS={trabajo:"#e040fb",descanso:"#69f0ae",longo:"#40c4ff",trabalho:"#e040fb"};

function ModoPomodoroImpro({onClose,audio}){
  const {T}=useTheme();const S=mkS(T);
  const [pi,setPi]=useState(0);
  const [bloques,setBloques]=useState(POMO_PRESETS[0].bloques.map((b,i)=>({...b,id:i})));
  const [ci,setCi]=useState(0);
  const [display,setDisplay]=useState(POMO_PRESETS[0].bloques[0].m*60);
  const [running,setRunning]=useState(false);
  const [done,setDone]=useState(false);
  const ref=useRef(null);
  const cb=bloques[ci];
  const col=BCOLS[cb?.t]||T.accent;
  const urgent=display>0&&display<10,warning=display>0&&display<30;

  useEffect(()=>{
    if(running){ref.current=setInterval(()=>setDisplay(p=>{
      if(p<=1){clearInterval(ref.current);setRunning(false);audio.playBell();
        setCi(c=>{const n=c+1;if(n>=bloques.length){setDone(true);return c;}setDisplay(bloques[n].m*60);return n;});return 0;}
      return p-1;}),1000);}
    else clearInterval(ref.current);
    return()=>clearInterval(ref.current);
  },[running,bloques]);

  const reset=()=>{setRunning(false);setCi(0);setDisplay(bloques[0]?.m*60||0);setDone(false);};
  const skip=()=>{setRunning(false);const n=ci+1;if(n>=bloques.length){setDone(true);return;}setCi(n);setDisplay(bloques[n].m*60);};
  const loadPreset=i=>{setPi(i);setRunning(false);setDone(false);setCi(0);const bs=POMO_PRESETS[i].bloques.map((b,j)=>({...b,id:j}));setBloques(bs);setDisplay(bs[0]?.m*60||0);};
  const total=bloques.reduce((a,b)=>a+b.m,0);
  const pct=cb?((cb.m*60-display)/(cb.m*60))*100:0;

  return(<div style={{position:"fixed",inset:0,zIndex:1500,background:T.bg,display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.65rem 1rem",borderBottom:`1px solid ${T.border}`,background:T.nav,flexShrink:0}}>
      <span style={{color:col,fontWeight:900,fontSize:"0.9rem"}}>🍅 Modo ensayo</span>
      <button onClick={onClose} style={{...S.btn(T.bg3,T.text3),fontSize:"0.78rem"}}>✕ Salir</button>
    </div>
    <div style={{display:"flex",gap:"0.4rem",padding:"0.6rem 1rem",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
      {POMO_PRESETS.map((p,i)=><button key={i} onClick={()=>loadPreset(i)} style={{...S.btn(pi===i?T.accent:T.bg3,pi===i?"#fff":T.text2),flex:1,fontSize:"0.8rem"}}>{p.label}</button>)}
    </div>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"1.5rem",gap:"1.25rem"}}>
      {done?(<div style={{textAlign:"center"}}><p style={{fontSize:"3rem",margin:"0 0 0.75rem"}}>🎉</p><h2 style={{color:T.text,fontWeight:900,margin:"0 0 0.5rem"}}>Completado</h2><p style={{color:T.text3,margin:"0 0 1.5rem"}}>{total}min</p><button onClick={reset} style={{...S.btn(col),padding:"0.65rem 2rem"}}>↺</button></div>):(<>
        <div style={{textAlign:"center"}}>
          <div style={{...S.tag(col),fontSize:"0.78rem",display:"inline-block",marginBottom:"0.5rem",padding:"0.2rem 0.65rem"}}>{cb?.t?.toUpperCase()}</div>
          <p style={{color:T.text,fontWeight:900,fontSize:"clamp(1.1rem,4vw,1.8rem)",margin:"0 0 0.2rem"}}>{cb?.n}</p>
          <p style={{color:T.text3,fontSize:"0.78rem",margin:0}}>Bloque {ci+1}/{bloques.length} · {total}min total</p>
        </div>
        <div style={{fontSize:"clamp(4rem,16vw,9rem)",fontWeight:900,fontFamily:"monospace",color:urgent?"#ff6e40":warning?"#ffd740":col,lineHeight:1,animation:urgent?"urgentPulse 0.5s ease infinite alternate":"none",transition:"color 0.3s",cursor:"pointer"}} onClick={()=>setRunning(!running)}>{FMT(display)}</div>
        <div style={{width:"100%",maxWidth:400,height:5,background:T.bg3,borderRadius:3}}><div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:3,transition:"width 1s linear"}}/></div>
        <div style={{display:"flex",gap:"0.6rem"}}>
          <button onClick={()=>setRunning(!running)} style={{...S.btn(running?"#ff6e40":col,"#000"),padding:"0.6rem 1.5rem",fontSize:"0.95rem"}}>{running?"⏸ Pausa":"▶ Iniciar"}</button>
          <button onClick={skip} style={S.btn(T.bg3,T.text2)}>⏭</button>
          <button onClick={reset} style={S.btn(T.bg3,T.text2)}>↺</button>
        </div>
        <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap",justifyContent:"center",maxWidth:450}}>
          {bloques.map((b,i)=>(<div key={b.id} style={{padding:"0.2rem 0.5rem",borderRadius:7,background:i===ci?col+"33":i<ci?T.bg3:T.bg2,border:`1px solid ${i===ci?col:T.border}`,opacity:i<ci?0.4:1,transition:"all 0.2s"}}>
            <span style={{color:i===ci?col:i<ci?T.text4:T.text2,fontSize:"0.7rem",fontWeight:i===ci?700:400}}>{b.n} {b.m}m</span>
          </div>))}
        </div>
      </>)}
    </div>
  </div>);
}

function TabSesiones({onLaunchTimer}){
  const {T}=useTheme();const S=mkS(T);
  if(!onLaunchTimer)onLaunchTimer=()=>{};
  const [view,setView]=useState("plantillas");
  const [sesion,setSesion]=useState(null);
  const [editMode,setEditMode]=useState(false);
  const [showPomodoro,setShowPomodoro]=useState(false);
  const [historial,setHistorial]=useState(()=>ls.get("impro_sesiones",[]));
  const [notas,setNotas]=useState("");
  useEffect(()=>{getSesiones().then(setHistorial);},[]);
  const load=p=>{setSesion({id:UID(),nombre:p.nombre,bloques:p.bloques.map((b,i)=>({...b,id:i,completado:false}))});setView("sesion");};
  const toggle=id=>setSesion(s=>({...s,bloques:s.bloques.map(b=>b.id===id?{...b,completado:!b.completado}:b)}));
  const upd=(id,f,v)=>setSesion(s=>({...s,bloques:s.bloques.map(b=>b.id===id?{...b,[f]:v}:b)}));
  const del=id=>setSesion(s=>({...s,bloques:s.bloques.filter(b=>b.id!==id)}));
  const add=()=>sesion&&setSesion(s=>({...s,bloques:[...s.bloques,{id:Date.now(),tipo:"entrenamiento",titulo:"Nuevo bloque",duracion:15,notas:"",completado:false}]}));
  const total=sesion?.bloques.reduce((a,b)=>a+(parseInt(b.duracion)||0),0)||0;
  const done=sesion?.bloques.filter(b=>b.completado).length||0;
  const guardar=async()=>{
    trackMinsSupa(total);
    const entry={id:UID(),nombre:sesion.nombre,fecha:new Date().toLocaleDateString("es-ES"),minutos:total,completados:done,notas,bloques:sesion.bloques};
    await saveSesion(entry);
    setHistorial(h=>[entry,...h].slice(0,30));
    setSesion(null);setNotas("");setView("historial");
  };

  if(showPomodoro)return(<ModoPomodoroImpro onClose={()=>setShowPomodoro(false)} audio={{playBell:()=>{try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=880;g.gain.setValueAtTime(0.5,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+1.5);o.start();o.stop(ctx.currentTime+1.5);}catch(e){}}}}/>);
  if(view==="historial")return(<div>
    <div style={{display:"flex",gap:"0.6rem",marginBottom:"1rem"}}><button onClick={()=>setView("plantillas")} style={S.btn(T.bg3,T.text2)}>← Plantillas</button><span style={{fontWeight:700,color:T.text}}>Historial</span></div>
    {historial.length===0&&<p style={{color:T.text4}}>Sin sesiones guardadas.</p>}
    {historial.map(h=>(<div key={h.id} style={{...S.panel,marginBottom:"0.6rem"}}><div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"0.3rem",marginBottom:"0.4rem"}}><span style={{fontWeight:700,color:T.text}}>{h.nombre}</span><span style={{color:T.text3,fontSize:"0.78rem"}}>{h.fecha}</span></div><div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}><span style={S.tag("#ffd740")}>{h.minutos}min</span><span style={S.tag("#69f0ae")}>{h.completados}/{h.bloques?.length} bloques</span></div>{h.notas&&<p style={{color:T.text3,fontSize:"0.8rem",margin:"0.4rem 0 0"}}>{h.notas}</p>}</div>))}
  </div>);

  if(view==="sesion"&&sesion)return(<div>
    <div style={{display:"flex",gap:"0.6rem",marginBottom:"1rem",flexWrap:"wrap",alignItems:"center"}}>
      <button onClick={()=>{setSesion(null);setView("plantillas");}} style={S.btn(T.bg3,T.text2)}>←</button>
      <span style={{fontWeight:700,flex:1,color:T.text}}>{sesion.nombre}</span>
      <button onClick={()=>setEditMode(!editMode)} style={S.btn(editMode?"#ffd740":T.bg3,editMode?"#000":T.text2)}>{editMode?"✓":"✏️"}</button>
      <button onClick={guardar} style={S.btn("#69f0ae","#000")}>💾</button>
    </div>
    <div style={{display:"flex",gap:"0.6rem",marginBottom:"1rem",flexWrap:"wrap",alignItems:"center"}}>
      <div style={{...S.panel,padding:"0.45rem 0.85rem",fontSize:"0.82rem"}}><span style={{color:T.text3}}>Total </span><span style={{color:"#ffd740",fontWeight:700}}>{total}min</span></div>
      <div style={{...S.panel,padding:"0.45rem 0.85rem",fontSize:"0.82rem"}}><span style={{color:T.text3}}>Hechos </span><span style={{color:"#69f0ae",fontWeight:700}}>{done}/{sesion.bloques.length}</span></div>
      {sesion.bloques.length>0&&<div style={{...S.panel,padding:"0.55rem 0.85rem",flex:1,minWidth:80}}><div style={{height:4,background:T.bg4,borderRadius:2}}><div style={{height:"100%",width:`${(done/sesion.bloques.length)*100}%`,background:"#69f0ae",borderRadius:2,transition:"width 0.3s"}}/></div></div>}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",marginBottom:"1rem"}}>
      {sesion.bloques.map(b=>(
        <div key={b.id} style={{
          background:b.completado?T.bg3:T.bg2,
          border:`1.5px solid ${T.border}`,
          borderLeft:`4px solid ${TIPO_COLOR[b.tipo]||"#555"}`,  // ← SIEMPRE visible
          borderRadius:10,padding:"0.78rem 1rem",
          opacity:b.completado?0.55:1,transition:"opacity 0.2s"
        }}>
          {editMode?(<div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",alignItems:"center"}}>
            <input value={b.titulo} onChange={e=>upd(b.id,"titulo",e.target.value)} style={{...S.input,flex:"2 1 110px",width:"auto"}}/>
            <select value={b.tipo} onChange={e=>upd(b.id,"tipo",e.target.value)} style={{...S.input,flex:"1 1 90px",width:"auto",padding:"0.45rem 0.6rem"}}>
              {Object.keys(TIPO_COLOR).map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" value={b.duracion} onChange={e=>upd(b.id,"duracion",e.target.value)} style={{...S.input,width:55}}/>
            <button onClick={()=>del(b.id)} style={{...S.btn("#1a0000"),color:"#ff6e40",padding:"0.38rem 0.55rem"}}>✕</button>
          </div>):(<div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
            <button onClick={()=>toggle(b.id)} style={{background:b.completado?"#69f0ae22":T.bg3,border:`1.5px solid ${b.completado?"#69f0ae":T.border2}`,borderRadius:"50%",width:25,height:25,cursor:"pointer",color:b.completado?"#69f0ae":T.text4,fontSize:"0.72rem",flexShrink:0}}>✓</button>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontWeight:700,color:b.completado?T.text3:T.text,fontSize:"0.88rem",textDecoration:b.completado?"line-through":"none"}}>{b.titulo}</span>
                <span style={S.tag(TIPO_COLOR[b.tipo]||"#888")}>{b.tipo}</span>
              </div>
              {b.notas&&<p style={{color:T.text3,fontSize:"0.76rem",margin:"0.12rem 0 0"}}>{b.notas}</p>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"0.4rem",flexShrink:0}}>
              <span style={{color:T.text4,fontSize:"0.83rem",fontWeight:700}}>{b.duracion}min</span>
              <button onClick={()=>onLaunchTimer(b.duracion)} title="Lanzar timer" style={{background:T.accent+"22",border:`1px solid ${T.accent}44`,color:T.accent,borderRadius:6,padding:"0.2rem 0.45rem",cursor:"pointer",fontSize:"0.72rem",fontWeight:700}}>▶ timer</button>
            </div>
          </div>)}
        </div>
      ))}
    </div>
    {editMode&&<button onClick={add} style={{...S.btn(T.bg3,T.text2),width:"100%",marginBottom:"1rem"}}>+ Añadir bloque</button>}
    <textarea value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Notas de la sesión..." style={{...S.input,height:70,resize:"none"}}/>
  </div>);

  return(<div>
    <div style={{display:"flex",gap:"0.6rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
      <button onClick={()=>{setSesion({id:UID(),nombre:"Mi sesión",bloques:[]});setView("sesion");setEditMode(true);}} style={S.btn(T.accent)}>+ Nueva sesión</button>
        <button onClick={()=>setShowPomodoro(true)} style={S.btn(T.bg3,T.text2)}>🍅 Modo ensayo</button>
      <button onClick={()=>setView("historial")} style={S.btn(T.bg3,T.text2)}>📋 Historial ({historial.length})</button>
    </div>
    <p style={S.ptitle(T.text3)}>Plantillas</p>
    <div style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
      {PLANTILLAS.map(p=>(<button key={p.id} onClick={()=>load(p)} style={{...S.panel,cursor:"pointer",textAlign:"left",width:"100%",border:`1.5px solid ${T.border}`}}>
        <div style={{fontWeight:700,marginBottom:"0.2rem",color:T.text}}>{p.nombre}</div>
        <div style={{color:T.text3,fontSize:"0.78rem",marginBottom:"0.55rem"}}>{p.descripcion}</div>
        <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>{p.bloques.map((b,j)=><span key={j} style={S.tag(TIPO_COLOR[b.tipo]||"#888")}>{b.titulo} {b.duracion}min</span>)}</div>
      </button>))}
    </div>
  </div>);
}

const DINAMICAS_BASE=[
  {id:1,nombre:"Sí, y...",tipo:"calentamiento",duracion:10,participantes:"parejas",descripcion:"La regla de oro del impro. Aceptar y añadir información sin bloquear.",pasos:["Ponerse en parejas","A dice algo / B responde 'Sí, y...'","Alternar 2 minutos","Reflexionar qué se construyó"],objetivo:"Aceptación, escucha, construcción conjunta",variantes:["Sí, pero...","Solo con preguntas"]},
  {id:2,nombre:"Zip Zap Zop",tipo:"calentamiento",duracion:5,participantes:"grupo",descripcion:"Círculo de energía con contacto visual y gesto preciso.",pasos:["Círculo de pie","ZIP: al lado, ZAP: cruzar, ZOP: cualquier dirección","Mantener ritmo y contacto visual"],objetivo:"Concentración, presencia, energía grupal",variantes:["Con nombres","Silencioso"]},
  {id:3,nombre:"Espejo emocional",tipo:"calentamiento",duracion:8,participantes:"parejas",descripcion:"Liderazgo físico compartido sin palabras.",pasos:["Parejas frente a frente","A empieza a moverse con una emoción","B sigue como espejo","El liderazgo puede cambiar"],objetivo:"Escucha física, empatía, presencia",variantes:["Grupo entero como espejo"]},
  {id:4,nombre:"Entrevista al personaje",tipo:"entrenamiento",duracion:15,participantes:"grupo",descripcion:"Sostener un personaje bajo presión de preguntas.",pasos:["Sortear al entrevistado","Generar personaje con estímulos","5 minutos de entrevista libre","Responder siempre desde el personaje"],objetivo:"Construcción de personaje, coherencia",variantes:["Con cambio mid-entrevista"]},
  {id:5,nombre:"Cortar y justificar",tipo:"entrenamiento",duracion:20,participantes:"grupo",descripcion:"Sustituir a un actor congelado y justificar su posición.",pasos:["Escena en curso","Facilitador grita '¡Congela!'","Alguien ocupa la posición exacta","Justifica y propone nueva escena"],objetivo:"Transformación, escucha corporal",variantes:["Solo con poses ridículas"]},
  {id:6,nombre:"Película en géneros",tipo:"juego",duracion:20,participantes:"grupo",descripcion:"Una escena que cambia de género cinematográfico.",pasos:["Fijar escena neutra","Director cambia el género gritándolo","El grupo adapta todo"],objetivo:"Versatilidad, estilo, juego grupal",variantes:["El público propone géneros"]},
  {id:7,nombre:"Harold",tipo:"formato",duracion:45,participantes:"grupo",descripcion:"El formato largo. Monólogos → escenas → conexiones.",pasos:["Sugerencia del público","3 monólogos (45s c/u)","Rondas de escenas en tríos","Reincorporaciones y cierre"],objetivo:"Narrativa larga, temática, conexiones",variantes:["Harold de 30 min"]},
  {id:8,nombre:"Ópera improvisada",tipo:"musical",duracion:20,participantes:"grupo",descripcion:"Toda la escena se canta. Sin hablar.",pasos:["Sugerencia del público","Todo se canta","Estilo operístico: dramático, exagerado"],objetivo:"Desinhibición vocal, drama, humor",variantes:["Mezcla de estilos"]},
  {id:9,nombre:"Ronda de una palabra",tipo:"cierre",duracion:5,participantes:"grupo",descripcion:"Cada persona dice una sola palabra que resuma la sesión.",pasos:["Círculo","Solo una palabra, sin explicación","El facilitador cierra"],objetivo:"Integración, reflexión, cierre colectivo",variantes:["Con gesto en lugar de palabra"]},
  {id:10,nombre:"La máquina",tipo:"juego",duracion:10,participantes:"grupo",descripcion:"El grupo construye una máquina humana con movimientos y sonidos repetitivos.",pasos:["Una persona empieza","Cada uno se engancha","Facilitador pide acelerar o parar"],objetivo:"Ritmo, cuerpo, coordinación",variantes:["La máquina de emociones"]},
];
const SHOW_NAMES={
  pre:["A Gran","O Misterio de","Noite de","A Última","Sen","Entre","Máis Alá de","La Gran","El Misterio de","Noche de","La Última","Sin","Entre","Más Allá de"],
  sub:["Lobos Educados","Martes Tráxico","Sombras Bailarinas","Verdades Pequenas","Mentiras Enormes","Heroes Accidentais","Lobos Educados","Martes Trágico","Sombras Bailarinas","Verdades Pequeñas","Mentiras Enormes","Dragones Perezosos","Héroes Accidentales"],
  con:["e Medio","pero Non Tanto","sen Consecuencias","con Sorpresas","á Deriva","y Medio","pero No Tanto","sin Consecuencias","con Sorpresas","a la Deriva"],
  adj:["Épico","Inesperado","Salvaxe","Tenro","Absurdo","Glorioso","Épico","Inesperado","Salvaje","Tierno","Absurdo","Glorioso"],
};
const generateShowName=()=>{
  const r=a=>a[Math.floor(Math.random()*a.length)];
  const t=Math.floor(Math.random()*4);
  if(t===0)return`${r(SHOW_NAMES.pre)} ${r(SHOW_NAMES.sub)}`;
  if(t===1)return`${r(SHOW_NAMES.sub)} ${r(SHOW_NAMES.con)}`;
  if(t===2)return`${r(SHOW_NAMES.sub)}: ${r(SHOW_NAMES.adj)}`;
  return`${r(SHOW_NAMES.pre)} ${r(SHOW_NAMES.sub)} ${r(SHOW_NAMES.con)}`;
};
function ShowNameWidget({T,S}){
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
const TEAM_COLS=["#e040fb","#40c4ff","#69f0ae","#ffd740","#ff6e40","#f48fb1"];
function TeamSorter({T,S}){
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
function TabGuia(){
  const {T}=useTheme();const S=mkS(T);
  const [dinamicas,setDinamicas]=useState(()=>ls.get("impro_dinamicas_v2",DINAMICAS_BASE));
  const [filtro,setFiltro]=useState("todos");
  const [search,setSearch]=useState("");
  const [sel,setSel]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [favDins,setFavDins]=useState(()=>ls.get("impro_fav_dins",[]));
  useEffect(()=>{getDinamicas(DINAMICAS_BASE).then(setDinamicas);},[]);
  const toggleFavDin=id=>{const u=favDins.includes(id)?favDins.filter(x=>x!==id):[...favDins,id];setFavDins(u);ls.set("impro_fav_dins",u);};
  const isFav=id=>favDins.includes(id);
  const [editId,setEditId]=useState(null);
  const FORM0={nombre:"",tipo:"calentamiento",duracion:10,participantes:"grupo",descripcion:"",pasos:"",objetivo:"",variantes:""};
  const [form,setForm]=useState(FORM0);
  const tipos=["todos","★ Favoritas",...new Set(dinamicas.map(d=>d.tipo))];
  const lista=dinamicas.filter(d=>(filtro==="★ Favoritas"?isFav(d.id):(filtro==="todos"||d.tipo===filtro))&&(!search||d.nombre.toLowerCase().includes(search.toLowerCase())||d.descripcion.toLowerCase().includes(search.toLowerCase())));
  const openNew=()=>{setEditId(null);setForm(FORM0);setShowForm(true);setSel(null);};
  const openEdit=d=>{setEditId(d.id);setForm({...d,pasos:(d.pasos||[]).join("\n"),variantes:(d.variantes||[]).join("\n")});setShowForm(true);setSel(null);};
  const saveForm=async()=>{
    const d={...form,id:editId||String(Date.now()),duracion:Number(form.duracion),pasos:form.pasos.split("\n").map(s=>s.trim()).filter(Boolean),variantes:form.variantes.split("\n").map(s=>s.trim()).filter(Boolean)};
    const updated=editId?dinamicas.map(x=>x.id===editId?d:x):[...dinamicas,d];
    setDinamicas(updated);await saveDinamica(d);setShowForm(false);
  };
  const deleteDin=async id=>{if(!confirm("¿Eliminar esta dinámica?"))return;const u=dinamicas.filter(d=>d.id!==id);setDinamicas(u);await deleteDinamica(id);setSel(null);};

  if(showForm)return(<div>
    <button onClick={()=>setShowForm(false)} style={{...S.btn(T.bg3,T.text2),marginBottom:"1rem"}}>← Volver</button>
    <div style={{...S.panel,border:`1.5px solid ${T.accent}33`}}>
      <p style={S.ptitle(T.accent)}>{editId?"Editar dinámica":"Nueva dinámica"}</p>
      <div style={{display:"grid",gap:"0.65rem"}}>
        <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>NOMBRE</p><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} style={S.input}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.5rem"}}>
          <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>TIPO</p>
            <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} style={{...S.input,padding:"0.45rem 0.6rem"}}>{Object.keys(TIPO_COLOR).map(t=><option key={t} value={t}>{t}</option>)}</select></div>
          <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>DURACIÓN (min)</p><input type="number" value={form.duracion} onChange={e=>setForm(f=>({...f,duracion:e.target.value}))} style={S.input}/></div>
          <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>PARTICIPANTES</p><input value={form.participantes} onChange={e=>setForm(f=>({...f,participantes:e.target.value}))} style={S.input}/></div>
        </div>
        <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>DESCRIPCIÓN</p><textarea value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} style={{...S.input,height:70,resize:"vertical"}}/></div>
        <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>PASOS (uno por línea)</p><textarea value={form.pasos} onChange={e=>setForm(f=>({...f,pasos:e.target.value}))} style={{...S.input,height:100,resize:"vertical"}}/></div>
        <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>OBJETIVO</p><input value={form.objetivo} onChange={e=>setForm(f=>({...f,objetivo:e.target.value}))} style={S.input}/></div>
        <div><p style={{color:T.text3,fontSize:"0.72rem",margin:"0 0 0.2rem",letterSpacing:"0.1em"}}>VARIANTES (una por línea)</p><textarea value={form.variantes} onChange={e=>setForm(f=>({...f,variantes:e.target.value}))} style={{...S.input,height:70,resize:"vertical"}}/></div>
      </div>
      <div style={{display:"flex",gap:"0.5rem",marginTop:"0.85rem"}}>
        <button onClick={saveForm} disabled={!form.nombre.trim()} style={{...S.btn(T.accent),opacity:!form.nombre.trim()?0.4:1}}>Guardar</button>
        <button onClick={()=>setShowForm(false)} style={S.btn(T.bg3,T.text2)}>Cancelar</button>
      </div>
    </div>
  </div>);

  if(sel)return(<div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem",flexWrap:"wrap"}}>
      <button onClick={()=>setSel(null)} style={S.btn(T.bg3,T.text2)}>← Volver</button>
      <button onClick={()=>toggleFavDin(sel.id)} style={{...S.btn(isFav(sel.id)?"#ffd740":T.bg3,isFav(sel.id)?"#000":T.text2)}}>{isFav(sel.id)?"★ Favorita":"☆ Favorita"}</button>
      <button onClick={()=>openEdit(sel)} style={S.btn(T.bg3,T.text2)}>✏️ Editar</button>
      <button onClick={()=>deleteDin(sel.id)} style={{...S.btn(T.bg3),color:"#ff6e40"}}>✕ Eliminar</button>
    </div>
    <div style={{...S.panel,border:`1.5px solid ${TIPO_COLOR[sel.tipo]}33`,borderLeft:`4px solid ${TIPO_COLOR[sel.tipo]}`}}>
      <div style={{display:"flex",gap:"0.55rem",marginBottom:"0.9rem",flexWrap:"wrap",alignItems:"center"}}><span style={S.tag(TIPO_COLOR[sel.tipo])}>{sel.tipo.toUpperCase()}</span><span style={{color:T.text3,fontSize:"0.78rem"}}>⏱ {sel.duracion}min · 👥 {sel.participantes}</span></div>
      <h2 style={{color:T.text,fontWeight:900,fontSize:"1.4rem",margin:"0 0 0.65rem"}}>{sel.nombre}</h2>
      <p style={{color:T.text2,lineHeight:1.6,marginBottom:"1.1rem"}}>{sel.descripcion}</p>
      <p style={S.ptitle(TIPO_COLOR[sel.tipo])}>Pasos</p>
      {(sel.pasos||[]).map((p,i)=>(<div key={i} style={{display:"flex",gap:"0.6rem",marginBottom:"0.4rem",alignItems:"flex-start"}}><span style={{...S.tag(TIPO_COLOR[sel.tipo]),borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"0.68rem"}}>{i+1}</span><span style={{color:T.text2,fontSize:"0.86rem",lineHeight:1.5}}>{p}</span></div>))}
      {sel.objetivo&&<div style={{background:T.bg3,borderRadius:10,padding:"0.85rem",margin:"1rem 0"}}><p style={S.ptitle("#ffd740")}>🎯 Objetivo</p><p style={{color:T.text2,fontSize:"0.86rem",margin:0}}>{sel.objetivo}</p></div>}
      {(sel.variantes||[]).length>0&&<><p style={S.ptitle(T.text4)}>Variantes</p>{sel.variantes.map((v,i)=><p key={i} style={{color:T.text3,fontSize:"0.82rem",margin:"0.18rem 0"}}>◆ {v}</p>)}</>}
    </div>
  </div>);

  return(<div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.85rem",flexWrap:"wrap",alignItems:"center"}}>
      <button onClick={openNew} style={S.btn(T.accent)}>+ Nueva dinámica</button>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...S.input,flex:1,minWidth:120}}/>
      <span style={{color:T.text4,fontSize:"0.78rem",whiteSpace:"nowrap"}}>{lista.length}</span>
      <button onClick={()=>{if(confirm("¿Restaurar dinámicas por defecto?")){{setDinamicas(DINAMICAS_BASE);ls.set("impro_dinamicas_v2",DINAMICAS_BASE);}}}} style={{...S.btn(T.bg3,T.text4),fontSize:"0.72rem"}}>↺</button>
    </div>
    <div style={{display:"flex",gap:"0.3rem",marginBottom:"1rem",flexWrap:"wrap"}}>
      {tipos.map(t=><button key={t} onClick={()=>setFiltro(t)} style={{background:filtro===t?(TIPO_COLOR[t]||T.accent):T.bg3,color:filtro===t?"#000":T.text3,border:"none",borderRadius:20,padding:"0.3rem 0.8rem",fontSize:"0.74rem",fontWeight:filtro===t?700:400,cursor:"pointer",fontFamily:"inherit"}}>{t}</button>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"0.55rem"}}>
      {lista.map(d=>(<button key={d.id} onClick={()=>setSel(d)} style={{...S.panel,border:`1.5px solid ${T.border}`,borderLeft:`4px solid ${TIPO_COLOR[d.tipo]}`,cursor:"pointer",textAlign:"left",width:"100%"}}>
        <div style={{display:"flex",gap:"0.4rem",marginBottom:"0.4rem",alignItems:"center"}}><span style={S.tag(TIPO_COLOR[d.tipo])}>{d.tipo}</span><span style={{color:T.text4,fontSize:"0.7rem"}}>⏱{d.duracion}min</span></div>
        <div style={{fontWeight:700,color:T.text,marginBottom:"0.22rem",fontSize:"0.9rem"}}>{d.nombre}</div>
        <div style={{color:T.text3,fontSize:"0.76rem",lineHeight:1.4}}>{d.descripcion}</div>
      </button>))}
    </div>
  </div>);
}

const PLAYLISTS_DEFAULT=[
  {id:"tension",nombre:"Tensión",emoji:"😤",color:"#ff6e40",urls:[{label:"Suspenso",url:""},{label:"Mi MP3...",url:""}]},
  {id:"comedia",nombre:"Comedia",emoji:"😂",color:"#ffd740",urls:[{label:"Alegre",url:""}]},
  {id:"drama",nombre:"Drama",emoji:"😢",color:"#40c4ff",urls:[{label:"Dramático",url:""}]},
  {id:"accion",nombre:"Acción",emoji:"⚡",color:"#69f0ae",urls:[{label:"Épico",url:""}]},
  {id:"misterio",nombre:"Misterio",emoji:"🌙",color:"#e040fb",urls:[{label:"Misterioso",url:""}]},
  {id:"romance",nombre:"Romance",emoji:"💜",color:"#f48fb1",urls:[{label:"Romántico",url:""}]},
  {id:"silencio",nombre:"Ambiente",emoji:"🌿",color:"#78909c",urls:[{label:"Naturaleza",url:""}]},
];
const EFECTOS_DEFAULT=[
  {id:"aplausos",nombre:"Aplausos",emoji:"👏",url:""},
  {id:"campana",nombre:"Campana",emoji:"🔔",url:""},
  {id:"bien",nombre:"¡Bien!",emoji:"⭐",url:""},
  {id:"buzzer",nombre:"Buzzer",emoji:"🚨",url:""},
  {id:"risas",nombre:"Risas",emoji:"😂",url:""},
  {id:"drum",nombre:"Redoble",emoji:"🥁",url:""},
  {id:"fanfare",nombre:"Fanfarria",emoji:"🎺",url:""},
  {id:"error",nombre:"Error",emoji:"❌",url:""},
];
const COMPASES=["2/4","3/4","4/4","5/4","6/8","7/8"];
const beatsOf=c=>{if(c==="2/4")return 2;if(c==="3/4")return 3;if(c==="4/4")return 4;if(c==="5/4")return 5;if(c==="6/8")return 6;if(c==="7/8")return 7;return 4;};

function TabShow({audio,onRundownChange}){
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


function TabGrupos({grupoActivo,setGrupoActivo}){
  const {T}=useTheme();const S=mkS(T);
  if(!setGrupoActivo)setGrupoActivo=()=>{};
  if(grupoActivo===undefined)grupoActivo=ls.get("impro_grupo_activo",null);
  const [grupos,setGrupos]=useState(()=>ls.get("impro_grupos",[]));
  const [view,setView]=useState("lista");
  const [nombre,setNombre]=useState("");
  const [miembro,setMiembro]=useState("");
  const [editGrupo,setEditGrupo]=useState(null);
  const sesiones=ls.get("impro_sesiones",[]);
  useEffect(()=>{getGrupos().then(setGrupos);},[]);
  const save=g=>{setGrupos(g);g.forEach(x=>saveGrupo(x));};
  const crear=()=>{if(!nombre.trim())return;const g={id:UID(),nombre:nombre.trim(),miembros:[],fechaCreacion:new Date().toLocaleDateString("es-ES"),color:["#e040fb","#40c4ff","#69f0ae","#ffd740","#ff6e40"][grupos.length%5]};save([...grupos,g]);setNombre("");setView("lista");};
  const eliminar=id=>{save(grupos.filter(g=>g.id!==id));if(grupoActivo?.id===id){setGrupoActivo(null);ls.set("impro_grupo_activo",null);}};
  const activar=g=>{const nuevo=g?.id===grupoActivo?.id?null:g;setGrupoActivo(nuevo);};
  const addMiembro=gid=>{if(!miembro.trim())return;const u=grupos.map(g=>g.id===gid?{...g,miembros:[...(g.miembros||[]),miembro.trim()]}:g);save(u);setMiembro("");setEditGrupo(u.find(g=>g.id===gid));};
  const removeMiembro=(gid,mi)=>{const u=grupos.map(g=>g.id===gid?{...g,miembros:(g.miembros||[]).filter((_,j)=>j!==mi)}:g);save(u);setEditGrupo(u.find(g=>g.id===gid));};
  const sesDeGrupo=n=>sesiones.filter(s=>s.grupo===n);
  if(view==="nuevo")return(<div><button onClick={()=>setView("lista")} style={{...S.btn(T.bg3,T.text2),marginBottom:"1rem"}}>← Volver</button><div style={S.panel}><p style={S.ptitle(T.accent)}>Nuevo grupo</p><input value={nombre} onChange={e=>setNombre(e.target.value)} onKeyDown={e=>e.key==="Enter"&&crear()} placeholder="Nombre del grupo..." style={{...S.input,marginBottom:"0.75rem"}}/><button onClick={crear} style={{...S.btn(T.accent),width:"100%"}}>Crear grupo</button></div></div>);
  if(view==="detalle"&&editGrupo){
    const gSes=sesDeGrupo(editGrupo.nombre);
    const totalMins=gSes.reduce((a,s)=>a+(s.minutos||0),0);
    const gStats=ls.get("impro_stats_grupos",{})[editGrupo.id]||{cats:{}};
    const topCats=Object.entries(gStats.cats||{}).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const maxCat=topCats[0]?.[1]||1;
    const sesByMonth={};
    gSes.forEach(s=>{const m=s.fecha?.split("/").slice(1).join("/")||"?";sesByMonth[m]=(sesByMonth[m]||0)+1;});
    const mesEntries=Object.entries(sesByMonth).slice(-4);
    return(<div>
      <button onClick={()=>{setView("lista");setEditGrupo(null);}} style={{...S.btn(T.bg3,T.text2),marginBottom:"1rem"}}>← Volver</button>
      <div style={{...S.panel,border:`1.5px solid ${editGrupo.color}44`,borderLeft:`4px solid ${editGrupo.color}`,marginBottom:"0.75rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
          <h2 style={{color:editGrupo.color,fontWeight:900,fontSize:"1.3rem",margin:0}}>{editGrupo.nombre}</h2>
          <button onClick={()=>activar(editGrupo)} style={S.btn(editGrupo.id===grupoActivo?.id?"#69f0ae":T.bg3,editGrupo.id===grupoActivo?.id?"#000":T.text2)}>{editGrupo.id===grupoActivo?.id?"✓ Activo":"Activar"}</button>
        </div>
        {}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.5rem",marginBottom:"1rem"}}>
          {[{l:"SESIONES",v:gSes.length,c:editGrupo.color},{l:"MINUTOS",v:totalMins,c:"#ffd740"},{l:"MIEMBROS",v:editGrupo.miembros?.length||0,c:"#69f0ae"}].map((s,i)=>(
            <div key={i} style={{...S.panel,textAlign:"center",padding:"0.55rem",border:`1px solid ${s.c}33`}}>
              <div style={{color:s.c,fontWeight:900,fontSize:"1.3rem",lineHeight:1}}>{s.v}</div>
              <div style={{color:T.text3,fontSize:"0.65rem",marginTop:"0.15rem",letterSpacing:"0.08em"}}>{s.l}</div>
            </div>
          ))}
        </div>
        {}
        {mesEntries.length>0&&(<div style={{marginBottom:"1rem"}}>
          <p style={S.ptitle(T.text3)}>Sesiones por mes</p>
          <div style={{display:"flex",gap:"0.5rem",alignItems:"flex-end",height:50}}>
            {mesEntries.map(([mes,n])=>{const maxN=Math.max(...mesEntries.map(e=>e[1]));const h=Math.max(8,(n/maxN)*44);return(<div key={mes} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"0.2rem"}}>
              <span style={{color:T.accent,fontSize:"0.68rem",fontWeight:700}}>{n}</span>
              <div style={{width:"100%",height:h,background:editGrupo.color,borderRadius:"3px 3px 0 0",opacity:0.75}}/>
              <span style={{color:T.text4,fontSize:"0.62rem"}}>{mes}</span>
            </div>);} )}
          </div>
        </div>)}
        {}
        {topCats.length>0&&(<div style={{marginBottom:"0.75rem"}}>
          <p style={S.ptitle(editGrupo.color)}>Categorías favoritas</p>
          {topCats.map(([cat,n])=>(<div key={cat} style={{display:"flex",alignItems:"center",gap:"0.55rem",marginBottom:"0.3rem"}}>
            <span style={{color:T.text2,fontSize:"0.78rem",width:80,flexShrink:0}}>{CAT_ICONS[cat]||"◆"} {cat}</span>
            <div style={{flex:1,height:6,background:T.bg3,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(n/maxCat)*100}%`,background:editGrupo.color,borderRadius:3}}/></div>
            <span style={{color:editGrupo.color,fontWeight:700,fontSize:"0.75rem",width:20,textAlign:"right",flexShrink:0}}>{n}</span>
          </div>))}
        </div>)}
        {topCats.length===0&&gSes.length===0&&<p style={{color:T.text4,fontSize:"0.8rem",marginBottom:"0.75rem"}}>Activa este grupo y empieza a generar para ver estadísticas.</p>}
      </div>
      {}
      <div style={S.panel}>
        <p style={S.ptitle(editGrupo.color)}>Miembros</p>
        <div style={{display:"flex",gap:"0.45rem",marginBottom:"0.65rem"}}>
          <input value={miembro} onChange={e=>setMiembro(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addMiembro(editGrupo.id)} placeholder="Nombre..." style={S.input}/>
          <button onClick={()=>addMiembro(editGrupo.id)} style={{...S.btn(editGrupo.color,"#000"),flexShrink:0}}>+</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
          {(editGrupo.miembros||[]).length===0&&<p style={{color:T.text4,fontSize:"0.82rem",margin:0}}>Sin miembros.</p>}
          {(editGrupo.miembros||[]).map((m,i)=>(<div key={i} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:20,padding:"0.28rem 0.7rem",display:"flex",gap:"0.35rem",alignItems:"center"}}>
            <span style={{color:T.text2,fontSize:"0.83rem"}}>👤 {m}</span>
            <button onClick={()=>removeMiembro(editGrupo.id,i)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",padding:0,fontSize:"0.83rem"}}>×</button>
          </div>))}
        </div>
      </div>
    </div>);
  }
  return(<div><div style={{display:"flex",gap:"0.6rem",marginBottom:"1.25rem",alignItems:"center",flexWrap:"wrap"}}><button onClick={()=>setView("nuevo")} style={S.btn(T.accent)}>+ Nuevo grupo</button>{grupoActivo&&<span style={{color:"#69f0ae",fontSize:"0.82rem"}}>✓ Activo: <strong>{grupoActivo.nombre}</strong></span>}</div>{grupos.length===0&&<div style={{...S.panel,textAlign:"center",padding:"2.5rem 1rem"}}><p style={{color:T.text4}}>Crea tu primer grupo de impro</p><button onClick={()=>setView("nuevo")} style={S.btn(T.accent)}>+ Crear grupo</button></div>}<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"0.65rem"}}>{grupos.map(g=>(<div key={g.id} style={{...S.panel,border:`1.5px solid ${g.id===grupoActivo?.id?g.color:T.border}`,borderLeft:`4px solid ${g.color}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.65rem"}}><span style={{fontWeight:900,color:g.color,fontSize:"1.05rem"}}>{g.nombre}</span>{g.id===grupoActivo?.id&&<span style={S.tag("#69f0ae")}>ACTIVO</span>}</div><div style={{display:"flex",gap:"0.5rem",marginBottom:"0.75rem",flexWrap:"wrap"}}><span style={S.tag(g.color)}>{g.miembros?.length||0} miembros</span><span style={S.tag("#ffd740")}>{sesDeGrupo(g.nombre).length} sesiones</span></div><div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}><button onClick={()=>{setEditGrupo(g);setView("detalle");}} style={{...S.btn(T.bg3,T.text2),flex:1}}>Ver</button><button onClick={()=>activar(g)} style={{...S.btn(g.id===grupoActivo?.id?"#69f0ae":T.bg3,g.id===grupoActivo?.id?"#000":T.text2),flex:1}}>{g.id===grupoActivo?.id?"✓":"Activar"}</button><button onClick={()=>eliminar(g.id)} style={{...S.btn(T.bg3),color:"#ff6e40",padding:"0.5rem 0.55rem"}}>✕</button></div></div>))}</div></div>);
}

function QRCode({value,size=180}){
  const {T}=useTheme();
  const bg=T.bg2.replace("#",""),fg=T.text.replace("#","");
  return <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=${bg}&color=${fg}&margin=2`} alt="QR" width={size} height={size} style={{borderRadius:8,display:"block"}}/>;
}

function TabQR(){
  const {T}=useTheme();const S=mkS(T);
  const [mode,setMode]=useState("idle"); // idle | config | open | send
  const [salaCode,setSalaCode]=useState("");
  const [propuestas,setPropuestas]=useState([]);
  const [historial,setHistorial]=useState([]);
  const [texto,setTexto]=useState("");
  const [preguntaSel,setPreguntaSel]=useState(0);
  const [enviado,setEnviado]=useState(false);
  const [loading,setLoading]=useState(false);
  const [joinCode,setJoinCode]=useState("");
  const [error,setError]=useState("");
  const unsubRef=useRef(null);

  // Configuración de preguntas para a sala
  const PREGUNTAS_PRESET=[
    {id:"p1",pregunta:"Dime una profesión insólita",tipo:"libre"},
    {id:"p2",pregunta:"Dime un lugar extraño",tipo:"libre"},
    {id:"p3",pregunta:"Dime un secreto inconfesable",tipo:"libre"},
    {id:"p4",pregunta:"Dime una emoción poco común",tipo:"libre"},
    {id:"p5",pregunta:"Dime una frase de película",tipo:"libre"},
    {id:"p6",pregunta:"Dime un superpoder absurdo",tipo:"libre"},
  ];
  const [preguntas,setPreguntas]=useState([PREGUNTAS_PRESET[0]]);
  const [newPregunta,setNewPregunta]=useState("");
  const [salaConfig,setSalaConfig]=useState([]);

  const genCode=()=>Math.random().toString(36).substring(2,6).toUpperCase();

  useEffect(()=>{
    getHistorialSalas().then(setHistorial);
    const params=new URLSearchParams(window.location.search);
    const sala=params.get("sala");
    if(sala){setJoinCode(sala.toUpperCase());setSalaCode(sala.toUpperCase());setMode("send");}
    return()=>{if(unsubRef.current)unsubRef.current();};
  },[]);

  const abrirSalaQR=async()=>{
    const code=genCode();
    setSalaCode(code);setPropuestas([]);
    setSalaConfig(preguntas);
    setMode("open");
    // Gardar sala con config en Supabase
    try{
      const {supabase:sb}=await import('./supabase.js');
      await sb.from('salas').insert({code,open:true,config:preguntas});
    }catch(e){
      const {abrirSala:ab}=await import('./db.js');
      await ab(code);
    }
    const existing=await getPropostas(code);
    setPropuestas(existing);
    unsubRef.current=subscribeToPropostas(code,nova=>{
      setPropuestas(prev=>[...prev,nova]);
    });
  };

  const cerrarSalaQR=async()=>{
    if(unsubRef.current){unsubRef.current();unsubRef.current=null;}
    await cerrarSala(salaCode,propuestas);
    const h=await getHistorialSalas();
    setHistorial(h);
    setSalaCode("");setPropuestas([]);setMode("idle");
  };

  const unirseASala=async()=>{
    if(!joinCode.trim())return;
    setLoading(true);setError("");
    try{
      const {supabase:sb}=await import('./supabase.js');
      const {data,error:err}=await sb.from('salas').select('open,config').eq('code',joinCode.toUpperCase()).single();
      if(err||!data){setError("Sala no encontrada.");setLoading(false);return;}
      if(!data.open){setError("Esta sala ya está cerrada.");setLoading(false);return;}
      setSalaConfig(data.config||[{id:"p1",pregunta:"Escribe tu propuesta",tipo:"libre"}]);
      setSalaCode(joinCode.toUpperCase());setMode("send");
    }catch(e){setError("Error al conectar.");}
    setLoading(false);
  };

  const enviarPropuesta=async()=>{
    if(!texto.trim())return;
    setLoading(true);
    const pregActual=salaConfig[preguntaSel]||salaConfig[0];
    const ok=await enviarProposta(salaCode,texto.trim(),pregActual?.pregunta||"Propuesta",preguntaSel===0?"simple":"plus");
    if(ok){setEnviado(true);setTexto("");}
    else setError("Error al enviar.");
    setLoading(false);
  };

  const aceptarPropuesta=p=>{
    const ideas=ls.get("impro_ideas_v2",{});
    const cat=p.cat||"PROFESIÓN";
    const u={...ideas,[cat]:[...(ideas[cat]||[]),{text:p.texto,nivel:"simple",ts:p.created_at}]};
    ls.set("impro_ideas_v2",u);
  };

  const addPregunta=()=>{
    if(!newPregunta.trim())return;
    setPreguntas(p=>[...p,{id:UID(),pregunta:newPregunta.trim(),tipo:"libre"}]);
    setNewPregunta("");
  };
  const removePregunta=id=>setPreguntas(p=>p.filter(x=>x.id!==id));
  const qrUrl=`${window.location.href.split("?")[0]}?sala=${salaCode}`;

  // VISTA: PANTALLA PÚBLICA (PÚBLICO ENVIANDO)
  if(mode==="send")return(<div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Inter',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
    <div style={{background:T.accent,padding:"0.85rem 1.25rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div><p style={{color:"rgba(255,255,255,0.7)",fontSize:"0.7rem",letterSpacing:"0.2em",margin:"0 0 0.1rem",fontFamily:"monospace"}}>SALA</p><p style={{color:"#fff",fontWeight:900,fontSize:"1.6rem",letterSpacing:"0.15em",margin:0}}>{salaCode}</p></div>
      <span style={{fontSize:"1.8rem"}}>🎭</span>
    </div>
    {salaConfig.length>1&&<div style={{display:"flex",gap:"0.4rem",padding:"0.75rem 1rem",overflowX:"auto",borderBottom:`1px solid ${T.border}`}}>
      {salaConfig.map((p,i)=><button key={p.id} onClick={()=>{setPreguntaSel(i);setEnviado(false);setTexto("");}} style={{background:preguntaSel===i?T.accent:T.bg3,color:preguntaSel===i?"#fff":T.text3,border:"none",borderRadius:20,padding:"0.3rem 0.85rem",cursor:"pointer",fontSize:"0.8rem",fontWeight:preguntaSel===i?700:400,whiteSpace:"nowrap",fontFamily:"inherit"}}>{i+1}. {p.pregunta.slice(0,25)}{p.pregunta.length>25?"...":""}</button>)}
    </div>}
    {!enviado?(<div style={{flex:1,display:"flex",flexDirection:"column",padding:"1rem",gap:"0.85rem",overflowY:"auto"}}>
      <div style={{background:T.accent+"18",border:`1.5px solid ${T.accent}44`,borderRadius:14,padding:"1rem 1.25rem"}}>
        <p style={{color:T.accent,fontSize:"0.7rem",letterSpacing:"0.15em",margin:"0 0 0.3rem",fontFamily:"monospace"}}>SE VOS PREGUNTA</p>
        <p style={{color:T.text,fontWeight:900,fontSize:"1.15rem",margin:0,lineHeight:1.4}}>{salaConfig[preguntaSel]?.pregunta||"Escribe tu propuesta"}</p>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:"0.4rem"}}>
        <textarea value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Escribe aquí tu respuesta..." style={{...S.input,flex:1,minHeight:120,resize:"none",fontSize:"1rem"}} autoFocus/>
      </div>
      {error&&<p style={{color:"#ff6e40",fontSize:"0.85rem",margin:0}}>{error}</p>}
      <button onClick={enviarPropuesta} disabled={loading||!texto.trim()} style={{...S.btn(T.accent),width:"100%",padding:"0.85rem",fontSize:"1rem",opacity:loading||!texto.trim()?0.5:1,borderRadius:12}}>{loading?"Enviando...":"✓ Enviar"}</button>
    </div>):(<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",textAlign:"center",gap:"1rem"}}>
      <div style={{fontSize:"4rem"}}>✓</div>
      <h2 style={{color:"#69f0ae",fontWeight:900,margin:0}}>¡Enviada!</h2>
      <p style={{color:T.text3,margin:0}}>{salaConfig[preguntaSel]?.pregunta}</p>
      {salaConfig.length>1&&<div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",justifyContent:"center",marginTop:"0.5rem"}}>
        {salaConfig.map((p,i)=>i!==preguntaSel&&<button key={p.id} onClick={()=>{setPreguntaSel(i);setEnviado(false);setTexto("");}} style={{...S.btn(T.bg3,T.text2),fontSize:"0.82rem"}}>Responder: {p.pregunta.slice(0,20)}...</button>)}
      </div>}
      <button onClick={()=>{setEnviado(false);setTexto("");}} style={{...S.btn(T.accent),padding:"0.65rem 2rem",marginTop:"0.5rem"}}>Enviar otra respuesta</button>
    </div>)}
  </div>);

  // VISTA: SALA ABERTA (FACILITADOR VENDO PROPOSTAS)
  if(mode==="open")return(<div>
    <div style={{display:"flex",gap:"0.6rem",marginBottom:"1rem",alignItems:"center",flexWrap:"wrap"}}>
      <h2 style={{margin:0,fontWeight:900,fontSize:"0.95rem",flex:1,color:T.text}}>Sala <span style={{color:T.accent,letterSpacing:"0.1em"}}>{salaCode}</span></h2>
      <button onClick={cerrarSalaQR} style={S.btn("#ff6e40")}>⏹ Cerrar sala</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"1.25rem",marginBottom:"1rem",alignItems:"start"}}>
      <div style={{...S.panel,display:"flex",flexDirection:"column",alignItems:"center",gap:"0.65rem",padding:"1rem"}}>
        <QRCode value={qrUrl} size={150}/>
        <p style={{color:T.accent,fontFamily:"monospace",fontSize:"1.2rem",fontWeight:900,letterSpacing:"0.2em",margin:0}}>{salaCode}</p>
        <div style={{display:"flex",flexDirection:"column",gap:"0.3rem",width:"100%"}}>
          {salaConfig.map((p,i)=><div key={p.id} style={{background:T.bg3,borderRadius:7,padding:"0.35rem 0.6rem",fontSize:"0.72rem",color:T.text3}}>{i+1}. {p.pregunta}</div>)}
        </div>
      </div>
      <div style={S.panel}>
        <p style={S.ptitle("#69f0ae")}>Propuestas ({propuestas.length})</p>
        {propuestas.length===0?<p style={{color:T.text4,fontSize:"0.83rem"}}>Esperando...</p>:(
          <div style={{display:"flex",flexDirection:"column",gap:"0.45rem",maxHeight:300,overflowY:"auto"}}>
            {[...propuestas].reverse().map((p,i)=>(<div key={i} style={{background:T.bg3,borderRadius:9,padding:"0.6rem 0.85rem",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.5rem"}}>
              <div>
                <span style={{...S.tag(T.accent),marginRight:"0.4rem",fontSize:"0.66rem"}}>{(p.cat||"").slice(0,30)}</span>
                <span style={{color:T.text,fontSize:"0.88rem"}}>{p.texto}</span>
              </div>
              <button onClick={()=>aceptarPropuesta(p)} title="Añadir a ideas" style={{...S.btn("#69f0ae","#000"),padding:"0.22rem 0.5rem",fontSize:"0.72rem",flexShrink:0}}>+ Ideas</button>
            </div>))}
          </div>
        )}
      </div>
    </div>
  </div>);

  // VISTA: CONFIGURACIÓN PREVIA (antes de abrir sala)
  if(mode==="config")return(<div>
    <div style={{display:"flex",gap:"0.6rem",marginBottom:"1.25rem",alignItems:"center"}}>
      <button onClick={()=>setMode("idle")} style={S.btn(T.bg3,T.text2)}>← Volver</button>
      <span style={{fontWeight:700,color:T.text}}>Configurar sala</span>
    </div>
    <div style={{...S.panel,marginBottom:"1rem",border:`1.5px solid ${T.accent}33`}}>
      <p style={S.ptitle(T.accent)}>Preguntas para o público</p>
      <p style={{color:T.text3,fontSize:"0.82rem",marginBottom:"1rem"}}>O público verá estas preguntas ao entrar coa sala. Podes usar presets ou escribir as túas propias.</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:"0.35rem",marginBottom:"1rem"}}>
        {PREGUNTAS_PRESET.map(p=><button key={p.id} onClick={()=>setPreguntas(prev=>prev.find(x=>x.pregunta===p.pregunta)?prev:[...prev,{...p,id:UID()}])} style={{background:preguntas.find(x=>x.pregunta===p.pregunta)?T.accent+"22":T.bg3,border:`1.5px solid ${preguntas.find(x=>x.pregunta===p.pregunta)?T.accent:T.border}`,color:preguntas.find(x=>x.pregunta===p.pregunta)?T.accent:T.text3,borderRadius:8,padding:"0.3rem 0.7rem",cursor:"pointer",fontSize:"0.78rem",fontFamily:"inherit"}}>{p.pregunta}</button>)}
      </div>
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem"}}>
        <input value={newPregunta} onChange={e=>setNewPregunta(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPregunta()} placeholder="Escribe una pregunta personalizada..." style={{...S.input,flex:1}}/>
        <button onClick={addPregunta} style={S.btn(T.accent)}>+</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"0.45rem"}}>
        {preguntas.map((p,i)=>(<div key={p.id} style={{display:"flex",gap:"0.5rem",alignItems:"center",background:T.bg3,borderRadius:9,padding:"0.55rem 0.85rem"}}>
          <span style={{color:T.text3,fontSize:"0.75rem",fontFamily:"monospace",width:18}}>{i+1}</span>
          <span style={{flex:1,color:T.text,fontSize:"0.88rem"}}>{p.pregunta}</span>
          <button onClick={()=>removePregunta(p.id)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.9rem"}}>×</button>
        </div>))}
        {preguntas.length===0&&<p style={{color:T.text4,fontSize:"0.82rem"}}>Engade polo menos unha pregunta.</p>}
      </div>
    </div>
    <button onClick={abrirSalaQR} disabled={preguntas.length===0} style={{...S.btn(T.accent),width:"100%",padding:"0.75rem",opacity:preguntas.length===0?0.4:1}}>📺 Abrir sala con estas preguntas</button>
  </div>);

  // VISTA: INICIO
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"1rem",marginBottom:"1.25rem"}}>
      <div style={{...S.panel,border:`1.5px solid ${T.accent}33`}}>
        <p style={S.ptitle(T.accent)}>🎭 Soy el facilitador</p>
        <p style={{color:T.text2,fontSize:"0.83rem",lineHeight:1.6,marginBottom:"1rem"}}>Configura as preguntas e abre a sala. O público escanea o QR e responde dende o seu móbil.</p>
        <button onClick={()=>setMode("config")} style={{...S.btn(T.accent),width:"100%",padding:"0.65rem"}}>⚙️ Configurar e abrir sala</button>
      </div>
      <div style={{...S.panel,border:"1.5px solid #69f0ae33"}}>
        <p style={S.ptitle("#69f0ae")}>👥 Soy del público</p>
        <p style={{color:T.text2,fontSize:"0.83rem",lineHeight:1.6,marginBottom:"0.85rem"}}>Introduce el código de 4 letras que te dieron.</p>
        <div style={{display:"flex",gap:"0.45rem"}}><input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&unirseASala()} placeholder="XXXX" maxLength={4} style={{...S.input,flex:1,fontSize:"1.4rem",fontWeight:900,letterSpacing:"0.2em",textAlign:"center"}}/><button onClick={unirseASala} disabled={loading||joinCode.length<4} style={{...S.btn("#69f0ae","#000"),opacity:joinCode.length<4?0.4:1}}>{loading?"...":"Entrar"}</button></div>
        {error&&<p style={{color:"#ff6e40",fontSize:"0.8rem",marginTop:"0.45rem"}}>{error}</p>}
      </div>
    </div>
    <div style={S.panel}>
      <p style={S.ptitle("#ffd740")}>📋 Historial</p>
      {historial.length===0?<p style={{color:T.text4,fontSize:"0.83rem"}}>Sen sesiones gardadas.</p>:(
        <div style={{display:"flex",flexDirection:"column",gap:"0.55rem"}}>
          {historial.map((entry,i)=>(<div key={i} style={{background:T.bg3,borderRadius:10,padding:"0.75rem 1rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"0.25rem",marginBottom:"0.4rem"}}><span style={{fontWeight:700,color:T.accent,letterSpacing:"0.1em"}}>{entry.sala_code}</span><span style={{color:T.text3,fontSize:"0.76rem"}}>{entry.fecha} · {entry.propostas?.length||0} propuestas</span></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem"}}>{(entry.propostas||[]).slice(0,6).map((p,j)=><span key={j} style={{background:T.bg4,borderRadius:7,padding:"0.18rem 0.55rem",fontSize:"0.78rem",color:T.text2}}>{typeof p==="string"?p:p.texto}</span>)}</div>
          </div>))}
        </div>
      )}
    </div>
  </div>);
}


const ADMIN_PIN = "1234";

function TabAdmin(){
  const {T}=useTheme();const S=mkS(T);
  const [authed,setAuthed]=useState(()=>sessionStorage.getItem("impro_admin")==="1");
  const [pin,setPin]=useState("");
  const [pinErr,setPinErr]=useState(false);
  const [adminTab,setAdminTab]=useState("estimulos");

  const tryPin=()=>{if(pin==="1234"){sessionStorage.setItem("impro_admin","1");setAuthed(true);}else{setPinErr(true);setTimeout(()=>setPinErr(false),1000);}};

  if(!authed)return(<div style={{maxWidth:320,margin:"0 auto",paddingTop:"3rem",textAlign:"center"}}>
    <p style={{fontSize:"2rem",margin:"0 0 0.5rem"}}>🔐</p>
    <p style={S.ptitle(T.accent)}>Panel de administración</p>
    <p style={{color:T.text3,fontSize:"0.85rem",marginBottom:"1.5rem"}}>Introduce o PIN para acceder</p>
    <input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryPin()} placeholder="PIN..." style={{...S.input,fontSize:"1.5rem",textAlign:"center",letterSpacing:"0.3em",border:`1.5px solid ${pinErr?"#ff6e40":T.inputBorder}`,marginBottom:"0.75rem"}}/>
    {pinErr&&<p style={{color:"#ff6e40",fontSize:"0.82rem",marginBottom:"0.5rem"}}>PIN incorrecto</p>}
    <button onClick={tryPin} style={{...S.btn(T.accent),width:"100%"}}>Entrar</button>
    <p style={{color:T.text4,fontSize:"0.72rem",marginTop:"1rem"}}>PIN por defecto: 1234</p>
  </div>);

  const ADMIN_TABS=[
    {id:"estimulos",emoji:"✦",label:"Estímulos"},
    {id:"dinamicas",emoji:"📖",label:"Dinámicas"},
    {id:"stats",emoji:"📊",label:"Estatísticas"},
    {id:"config",emoji:"⚙️",label:"Config"},
  ];

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
      <p style={S.ptitle("#ffd740")}>Admin Panel</p>
      <button onClick={()=>{sessionStorage.removeItem("impro_admin");setAuthed(false);}} style={{...S.btn(T.bg3,T.text3),fontSize:"0.75rem"}}>Salir</button>
    </div>

    {/* Menú interno */}
    <div style={{display:"flex",gap:3,marginBottom:"1.25rem",background:T.bg3,borderRadius:12,padding:3}}>
      {ADMIN_TABS.map(tab=><button key={tab.id} onClick={()=>setAdminTab(tab.id)} style={{...S.btn(adminTab===tab.id?T.bg2:"transparent",adminTab===tab.id?T.text:T.text3),flex:1,borderRadius:9,padding:"0.4rem 0.3rem",fontSize:"0.75rem",fontWeight:adminTab===tab.id?700:400,display:"flex",flexDirection:"column",alignItems:"center",gap:"0.15rem",boxShadow:adminTab===tab.id?"0 1px 4px rgba(0,0,0,0.2)":"none"}}>
        <span style={{fontSize:"1rem"}}>{tab.emoji}</span>
        <span>{tab.label}</span>
      </button>)}
    </div>

    {adminTab==="estimulos"&&<AdminEstimulos T={T} S={S}/>}
    {adminTab==="dinamicas"&&<AdminDinamicas T={T} S={S}/>}
    {adminTab==="stats"&&<AdminStats T={T} S={S}/>}
    {adminTab==="config"&&<AdminConfig T={T} S={S}/>}
  </div>);
}

function AdminEstimulos({T,S}){
  const [cat,setCat]=useState(Object.keys(ESTIMULOS_BASE)[0]);
  const [nivel,setNivel]=useState("simple");
  const [editIdx,setEditIdx]=useState(null);
  const [editText,setEditText]=useState("");
  const [newText,setNewText]=useState("");
  const [userStimuli,setUserStimuli]=useState(()=>ls.get("impro_user_stimuli",{}));

  const getBase=()=>ESTIMULOS_BASE[cat]?.[nivel]||[];
  const getUserAdds=()=>(userStimuli[cat]?.[nivel])||[];
  const getEdits=()=>(userStimuli[`${cat}_edits`]?.[nivel])||{};
  const getDeleted=()=>(userStimuli[`${cat}_deleted`]?.[nivel])||[];
  const allItems=()=>{
    const base=getBase().filter((_,i)=>!getDeleted().includes(i)).map((text,origIdx)=>{
      const actualIdx=getBase().indexOf(text);const edited=getEdits()[actualIdx];
      return{text:edited||text,orig:text,idx:actualIdx,isBase:true,isEdited:!!edited};
    });
    const user=getUserAdds().map((text,i)=>({text,orig:text,idx:i,isBase:false}));
    return[...base,...user];
  };
  const saveUserStimuli=u=>{setUserStimuli(u);ls.set("impro_user_stimuli",u);};
  const addItem=()=>{if(!newText.trim())return;const u={...userStimuli};u[cat]=u[cat]||{simple:[],plus:[]};u[cat][nivel]=[...(u[cat][nivel]||[]),newText.trim()];saveUserStimuli(u);setNewText("");};
  const editItem=(item)=>{setEditIdx(`${item.isBase?"b":"u"}_${item.idx}`);setEditText(item.text);};
  const saveEdit=(item)=>{const u={...userStimuli};if(item.isBase){const key=`${cat}_edits`;u[key]=u[key]||{};u[key][nivel]=u[key][nivel]||{};u[key][nivel][item.idx]=editText.trim();}else{u[cat][nivel][item.idx]=editText.trim();}saveUserStimuli(u);setEditIdx(null);setEditText("");};
  const deleteItem=(item)=>{if(!confirm("¿Eliminar?"))return;const u={...userStimuli};if(item.isBase){const key=`${cat}_deleted`;u[key]=u[key]||{};u[key][nivel]=[...(u[key][nivel]||[]),item.idx];}else{u[cat][nivel]=(u[cat][nivel]||[]).filter((_,i)=>i!==item.idx);}saveUserStimuli(u);};
  const resetCat=()=>{if(!confirm(`¿Restaurar ${cat} ${nivel}?`))return;const u={...userStimuli};delete u[cat];delete u[`${cat}_edits`];delete u[`${cat}_deleted`];saveUserStimuli(u);};
  const items=allItems();
  return(<div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem",flexWrap:"wrap"}}>
      <select value={cat} onChange={e=>setCat(e.target.value)} style={{...S.input,flex:1,minWidth:130}}>
        {Object.keys(ESTIMULOS_BASE).map(c=><option key={c} value={c}>{CAT_ICONS[c]||"◆"} {c}</option>)}
      </select>
      <div style={{display:"flex",background:T.bg3,borderRadius:10,padding:3,gap:2}}>
        {[["simple","◆"],["plus","⭐"]].map(([v,l])=><button key={v} onClick={()=>setNivel(v)} style={{...S.btn(nivel===v?T.accent:"transparent",nivel===v?"#fff":T.text3),borderRadius:8,padding:"0.35rem 0.65rem",fontSize:"0.78rem"}}>{l}</button>)}
      </div>
      <button onClick={resetCat} style={{...S.btn(T.bg3,"#ff6e40"),fontSize:"0.75rem"}}>↺</button>
    </div>
    <div style={{...S.panel,marginBottom:"0.85rem",padding:"0.5rem 1rem",display:"flex",gap:"1rem"}}>
      <span style={{color:T.text3,fontSize:"0.8rem"}}>Base: <strong style={{color:T.text}}>{getBase().length}</strong></span>
      <span style={{color:"#69f0ae",fontSize:"0.8rem"}}>+: <strong>{getUserAdds().length}</strong></span>
      <span style={{color:"#ff6e40",fontSize:"0.8rem"}}>-: <strong>{getDeleted().length}</strong></span>
      <span style={{color:T.accent,fontSize:"0.8rem"}}>Total: <strong>{items.length}</strong></span>
    </div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem"}}>
      <input value={newText} onChange={e=>setNewText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} placeholder={`Novo estímulo de ${cat}...`} style={{...S.input,flex:1}}/>
      <button onClick={addItem} style={S.btn(T.accent)}>+ Engadir</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
      {items.map((item,i)=>{
        const eKey=`${item.isBase?"b":"u"}_${item.idx}`;
        const isEditing=editIdx===eKey;
        return(<div key={i} style={{...S.panel,padding:"0.6rem 0.85rem",display:"flex",gap:"0.6rem",alignItems:"center",border:`1.5px solid ${item.isEdited?"#ffd74033":item.isBase?T.border:"#69f0ae33"}`}}>
          {isEditing?(<><input value={editText} onChange={e=>setEditText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEdit(item)} style={{...S.input,flex:1,fontSize:"0.88rem"}} autoFocus/><button onClick={()=>saveEdit(item)} style={S.btn(T.accent)}>✓</button><button onClick={()=>setEditIdx(null)} style={S.btn(T.bg3,T.text3)}>✕</button></>
          ):(<><div style={{flex:1}}><span style={{color:T.text,fontSize:"0.88rem"}}>{item.text}</span>{!item.isBase&&<span style={{...S.tag("#69f0ae"),marginLeft:"0.4rem"}}>novo</span>}{item.isEdited&&<span style={{...S.tag("#ffd740"),marginLeft:"0.4rem"}}>editado</span>}</div>
          <button onClick={()=>editItem(item)} style={{...S.btn(T.bg3,T.text3),padding:"0.3rem 0.5rem",fontSize:"0.78rem"}}>✏️</button>
          <button onClick={()=>deleteItem(item)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.9rem"}}>×</button></>)}
        </div>);
      })}
    </div>
  </div>);
}

function AdminDinamicas({T,S}){
  const [dinamicas,setDinamicas]=useState(()=>ls.get("impro_dinamicas_v2",DINAMICAS_BASE));
  const [search,setSearch]=useState("");
  const [filtro,setFiltro]=useState("todos");
  useEffect(()=>{getDinamicas(DINAMICAS_BASE).then(setDinamicas);},[]);
  const tipos=["todos",...new Set(dinamicas.map(d=>d.tipo))];
  const lista=dinamicas.filter(d=>(filtro==="todos"||d.tipo===filtro)&&(!search||d.nombre.toLowerCase().includes(search.toLowerCase())));
  const deleteDin=async id=>{if(!confirm("¿Eliminar?"))return;const u=dinamicas.filter(d=>d.id!==id);setDinamicas(u);await deleteDinamica(id);};
  const restoreAll=()=>{if(!confirm("¿Restaurar todas as dinámicas base?"))return;setDinamicas(DINAMICAS_BASE);ls.set("impro_dinamicas_v2",DINAMICAS_BASE);};
  return(<div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.75rem",flexWrap:"wrap",alignItems:"center"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...S.input,flex:1}}/>
      <span style={{color:T.text4,fontSize:"0.78rem"}}>{lista.length}/{dinamicas.length}</span>
      <button onClick={restoreAll} style={{...S.btn(T.bg3,"#ff6e40"),fontSize:"0.75rem"}}>↺ Restaurar</button>
    </div>
    <div style={{display:"flex",gap:"0.3rem",marginBottom:"0.85rem",flexWrap:"wrap"}}>
      {tipos.map(t=><button key={t} onClick={()=>setFiltro(t)} style={{background:filtro===t?(TIPO_COLOR[t]||T.accent):T.bg3,color:filtro===t?"#000":T.text3,border:"none",borderRadius:20,padding:"0.25rem 0.7rem",fontSize:"0.72rem",fontWeight:filtro===t?700:400,cursor:"pointer",fontFamily:"inherit"}}>{t}</button>)}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
      {lista.map(d=>(<div key={d.id} style={{...S.panel,padding:"0.6rem 0.9rem",display:"flex",gap:"0.6rem",alignItems:"center",borderLeft:`3px solid ${TIPO_COLOR[d.tipo]||T.accent}`}}>
        <div style={{flex:1}}>
          <span style={{fontWeight:700,color:T.text,fontSize:"0.88rem"}}>{d.nombre}</span>
          <span style={{...S.tag(TIPO_COLOR[d.tipo]||T.accent),marginLeft:"0.4rem"}}>{d.tipo}</span>
          <span style={{color:T.text4,fontSize:"0.75rem",marginLeft:"0.4rem"}}>⏱{d.duracion}min</span>
        </div>
        <button onClick={()=>deleteDin(d.id)} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:"0.9rem"}}>×</button>
      </div>))}
    </div>
  </div>);
}

function AdminStats({T,S}){
  const stats=ls.get("impro_stats",{cats:{},total:0,mins:0});
  const cats=Object.entries(stats.cats||{}).sort((a,b)=>b[1]-a[1]);
  const maxVal=cats[0]?.[1]||1;
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.6rem",marginBottom:"1.25rem"}}>
      {[["✦",stats.total||0,"Estímulos xerados"],["⏱",stats.mins||0,"Minutos de ensaio"],["📋",ls.get("impro_sesiones",[]).length,"Sesións gardadas"]].map(([emoji,val,label])=>(
        <div key={label} style={{...S.panel,textAlign:"center",padding:"0.85rem 0.5rem"}}>
          <div style={{fontSize:"1.3rem"}}>{emoji}</div>
          <div style={{fontSize:"1.6rem",fontWeight:900,color:T.accent}}>{val}</div>
          <div style={{color:T.text3,fontSize:"0.7rem"}}>{label}</div>
        </div>
      ))}
    </div>
    {cats.length>0&&<div style={S.panel}>
      <p style={S.ptitle(T.accent)}>Categorías máis usadas</p>
      <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
        {cats.map(([cat,count])=>(
          <div key={cat} style={{display:"flex",gap:"0.6rem",alignItems:"center"}}>
            <span style={{color:T.text3,fontSize:"0.78rem",width:90,flexShrink:0}}>{CAT_ICONS[cat]||"◆"} {cat}</span>
            <div style={{flex:1,height:8,background:T.bg3,borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(count/maxVal)*100}%`,background:T.accent,borderRadius:4,transition:"width 0.5s"}}/>
            </div>
            <span style={{color:T.text,fontSize:"0.82rem",fontWeight:700,width:28,textAlign:"right"}}>{count}</span>
          </div>
        ))}
      </div>
    </div>}
    {cats.length===0&&<div style={{...S.panel,textAlign:"center",padding:"2rem"}}>
      <p style={{fontSize:"2rem",margin:"0 0 0.5rem"}}>📊</p>
      <p style={{color:T.text4}}>Sen datos aínda. Usa o xerador de estímulos para acumular estatísticas.</p>
    </div>}
  </div>);
}

function AdminConfig({T,S}){
  const [adminPin,setAdminPin]=useState("1234");
  const [msg,setMsg]=useState("");
  const savePin=()=>{ls.set("impro_admin_pin",adminPin);setMsg("✓ PIN actualizado (reinicia sesión)");setTimeout(()=>setMsg(""),3000);};
  const clearAll=()=>{if(!confirm("¿Borrar TODOS os datos locais? Esta acción non se pode desfacer."))return;localStorage.clear();sessionStorage.clear();window.location.reload();};
  return(<div style={{display:"flex",flexDirection:"column",gap:"0.85rem"}}>
    <div style={S.panel}>
      <p style={S.ptitle("#ffd740")}>Cambiar PIN de Admin</p>
      <div style={{display:"flex",gap:"0.5rem"}}>
        <input type="password" value={adminPin} onChange={e=>setAdminPin(e.target.value)} style={{...S.input,flex:1,letterSpacing:"0.2em"}} placeholder="Novo PIN..."/>
        <button onClick={savePin} style={S.btn(T.accent)}>Gardar</button>
      </div>
      {msg&&<p style={{color:"#69f0ae",fontSize:"0.82rem",marginTop:"0.5rem"}}>{msg}</p>}
    </div>
    <div style={{...S.panel,border:"1.5px solid #ff6e4033"}}>
      <p style={S.ptitle("#ff6e40")}>Zona de perigo</p>
      <p style={{color:T.text3,fontSize:"0.83rem",marginBottom:"0.85rem"}}>Borra todos os datos gardados localmente (favoritos, historial, configuracións). Os datos en Supabase non se borran.</p>
      <button onClick={clearAll} style={{...S.btn("#ff6e40"),width:"100%"}}>🗑 Borrar datos locais</button>
    </div>
    <div style={S.panel}>
      <p style={S.ptitle(T.text3)}>Información</p>
      <div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>
        {[["Versión","v8"],["Repo","anchon1o/impro"],["Deploy","improapp.vercel.app"],["Backend","Supabase"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:"0.82rem"}}>
            <span style={{color:T.text3}}>{k}</span>
            <span style={{color:T.text,fontFamily:"monospace"}}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>);
}


const MANUAL_SECCIONES=[
  {id:"generar",emoji:"✦",titulo:"Xerador de estímulos",intro:"1.653 estímulos reais do grupo de impro. Xera palabras e escenas para exercicios.",items:[
    {t:"Categorías",d:"11 categorías: PROFESIÓN, LUGAR, EMOCIÓN, ACCIÓN, OBXECTO, SUPERPODER, ESTILO, DUDA, CONFESIÓN, FRASE e NOME. Cada unha ten nivel Simple (máis accesible) e Plus (máis creativo)."},
    {t:"Escena combinada",d:"Pestana 🎬 Escena: combina varias categorías para xerar unha escena completa. Usa plantillas rápidas (Clásica, Conflito, Absurda...) ou escolle manualmente. O botón 🔒 conxela elementos para rexenerar só o resto."},
    {t:"Spotlight",d:"Toca calquera estímulo xerado para mostralo en pantalla completa ao grupo. Ideal para que todos o vexan á vez."},
    {t:"Favoritos",d:"Garda estímulos con ♡. Accede a todos os gardados dende a pestana ♡."},
  ]},
  {id:"reto",emoji:"⚡",titulo:"Xerador de retos",intro:"Combina unha dinámica cos seus estímulos nun reto listo para usar de inmediato.",items:[
    {t:"Como funciona",d:"Selecciona nivel Simple ou Plus e preme Xerar reto. A app escolle unha dinámica aleatoria da biblioteca e asígnalle estímulos compatibles automaticamente."},
    {t:"O reto",d:"Ves a dinámica, os estímulos asociados e un resumo: 'Fai X usando Y en Z minutos'. Un clic e tes un exercicio completo."},
  ]},
  {id:"sesiones",emoji:"📋",titulo:"Planificación de sesións",intro:"Organiza, rexistra e cronometra as túas sesións de ensaio.",items:[
    {t:"Plantillas",d:"4 plantillas predefinidas: Entrenamento estándar 90min, Calentamento rápido 30min, Show Harold 60min e Sesión musical 75min. Cárgaas e modifícaas ao teu gusto."},
    {t:"Bloques",d:"Cada sesión ten bloques con tipo (calentamento, entrenamento, xogo...), título, duración e notas. Marca como completados durante a sesión."},
    {t:"Timer integrado",d:"Cada bloque ten ▶ timer que lanza o temporizador flotante (barra inferior) coa duración exacta do bloque."},
    {t:"Historial",d:"As sesións gardadas quedan en Supabase con data, minutos totais e bloques completados."},
    {t:"Modo ensaio 🍅",d:"Pomodoro adaptado a impro. Presets: Estándar, Show e Maratón. A app xestiona os tempos e avisa con son ao cambiar de bloque."},
  ]},
  {id:"guia",emoji:"📖",titulo:"Biblioteca de dinámicas",intro:"Máis de 85 exercicios e xogos de impro documentados.",items:[
    {t:"Filtros e busca",d:"Filtra por tipo (calentamento, entrenamento, xogo, formato, musical, pausa, peche) ou busca por nome e descrición."},
    {t:"Favoritas",d:"Marca dinámicas con ★ para acceder rapidamente. Filtro especial '★ Favoritas'."},
    {t:"Detalle completo",d:"Cada dinámica ten descrición, pasos numerados, obxectivo pedagóxico e variantes. Toca calquera para ver o detalle completo."},
    {t:"Crear e editar",d:"Engade as túas propias dinámicas con todos os campos. Edita ou elimina as existentes."},
  ]},
  {id:"show",emoji:"🎭",titulo:"Control de show",intro:"Panel completo para xestionar un show en directo.",items:[
    {t:"Audio — pistas múltiples",d:"Pestana 🎵 Audio: engade pistas de música simultáneas con volume independente por pista. Soporta YouTube embed e MP3 directo. Parar todas cun clic."},
    {t:"Efectos de son",d:"Pestana 🔊 Efectos: 8 efectos con síntese de audio (aplausos, campá, buzzer...). Asigna URLs MP3 propias para usar os teus sons."},
    {t:"Metrónomo",d:"Pestana 🥁 Metro: control de BPM de 30 a 240, visualización de pulsos, presets rápidos. Útil para escenas musicais."},
    {t:"Rundown",d:"Pestana 📋 Rundown: guión do show con actuacións ordenadas. Marca como activa (▶) ou completada (✓). Reordena con ▲▼."},
    {t:"Sorteo",d:"Pestana 🎲 Sorteo: sorteo de parellas, equipos e roles. Xerador de número 1-9 e letra aleatoria."},
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
  {id:"admin",emoji:"🔐",titulo:"Panel de administración",intro:"Xestión avanzada. PIN por defecto: 1234.",items:[
    {t:"Estímulos",d:"Engade, edita ou elimina estímulos de calquera categoría e nivel. Os cambios gárdanse en Supabase e son visibles en todos os dispositivos."},
    {t:"Dinámicas",d:"Lista completa de dinámicas con filtro por tipo. Elimina as que non queiras."},
    {t:"Estatísticas",d:"Totais de estímulos xerados, minutos de ensaio e sesións. Gráfica das categorías máis usadas."},
    {t:"Config",d:"Cambia o PIN de admin. Borra datos locais (favoritos, historial). Información da app."},
  ]},
  {id:"ajustes",emoji:"⚙️",titulo:"Axustes",intro:"Configuración xeral e tradución da interface.",items:[
    {t:"Idioma",d:"Cambia entre Castelán (base), Galego e Inglés. Os campos sen traducir mostran o castelán por defecto."},
    {t:"Tradución",d:"Exporta un JSON con todo o contido traducible e impórtao de volta despois de traducilo. Fluxo: exportar → traducir con Claude → importar."},
    {t:"Tema",d:"Alterna entre modo escuro (por defecto, fondo #0d0d0d) e modo claro dende o botón ☀️/🌙 da cabeceira."},
  ]},
  {id:"universo",emoji:"🌍",titulo:"Universo Impro",intro:"Directorio de compañías, festivais, escolas e persoas do mundo do impro.",items:[
    {t:"Contido",d:"Máis de 20 entradas: compañías de referencia mundial (Second City, UCB, iO, Loose Moose...), festivais internacionais, escolas e figuras históricas como Keith Johnstone, Viola Spolin e Del Close."},
    {t:"Filtros",d:"Filtra por tipo: Compañías, Festivais, Escolas, Persoas, Proxectos. Busca por nome, descrición ou etiquetas."},
    {t:"Detalle",d:"Cada entrada ten descrición completa, ubicación, etiquetas temáticas e enlace á web oficial."},
  ]},
];

function TabManual(){
  const {T}=useTheme();const S=mkS(T);
  const [sel,setSel]=useState(null);

  if(sel){
    const sec=MANUAL_SECCIONES.find(s=>s.id===sel);
    return(<div>
      <button onClick={()=>setSel(null)} style={{...S.btn(T.bg3,T.text2),marginBottom:"1rem"}}>← Manual</button>
      <div style={{...S.panel,border:`1.5px solid ${T.accent}33`}}>
        <div style={{display:"flex",gap:"0.75rem",alignItems:"center",marginBottom:"0.85rem"}}>
          <span style={{fontSize:"1.6rem"}}>{sec.emoji}</span>
          <div><h2 style={{color:T.text,fontWeight:900,fontSize:"1.2rem",margin:0}}>{sec.titulo}</h2><p style={{color:T.text3,fontSize:"0.82rem",margin:"0.1rem 0 0",lineHeight:1.5}}>{sec.intro}</p></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          {sec.items.map((item,i)=>(
            <div key={i} style={{background:T.bg3,borderRadius:10,padding:"0.85rem 1rem",borderLeft:`3px solid ${T.accent}`}}>
              <p style={{color:T.text,fontWeight:700,fontSize:"0.88rem",margin:"0 0 0.3rem"}}>{item.t}</p>
              <p style={{color:T.text2,fontSize:"0.83rem",margin:0,lineHeight:1.6}}>{item.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>);
  }

  return(<div>
    <div style={{...S.panel,marginBottom:"1rem",border:`1.5px solid ${T.accent}22`,background:T.accent+"08"}}>
      <p style={{color:T.text,fontWeight:700,margin:"0 0 0.3rem",fontSize:"0.95rem"}}>📘 Manual de ImproApp</p>
      <p style={{color:T.text3,fontSize:"0.83rem",margin:0,lineHeight:1.5}}>Guía completa de todas las funciones. Toca una sección para ver los detalles.</p>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"0.55rem"}}>
      {MANUAL_SECCIONES.map(sec=>(
        <button key={sec.id} onClick={()=>setSel(sec.id)} style={{...S.panel,cursor:"pointer",textAlign:"left",width:"100%",border:`1.5px solid ${T.border}`,display:"flex",gap:"0.85rem",alignItems:"flex-start"}}>
          <span style={{fontSize:"1.5rem",flexShrink:0,lineHeight:1,marginTop:"0.1rem"}}>{sec.emoji}</span>
          <div>
            <p style={{color:T.text,fontWeight:700,margin:"0 0 0.25rem",fontSize:"0.9rem"}}>{sec.titulo}</p>
            <p style={{color:T.text3,fontSize:"0.78rem",margin:0,lineHeight:1.4}}>{sec.intro}</p>
          </div>
        </button>
      ))}
    </div>
  </div>);
}


const UNIVERSO_DATA = [
  {id:"u1",tipo:"compañía",nome:"Loose Moose Theatre",pais:"🇨🇦",cidade:"Calgary, Canadá",desc:"Fundada por Keith Johnstone, creador do Theatresports e do Maestro. Un dos centros de impro máis influentes do mundo.",web:"loosemoose.com",tags:["theatresports","johnstone","formato"],logo:"🫎"},
  {id:"u2",tipo:"compañía",nome:"The Second City",pais:"🇺🇸",cidade:"Chicago, EUA",desc:"A compañía de impro e sketch máis famosa do mundo. Alumni: Tina Fey, Steve Carell, Bill Murray, Amy Poehler.",web:"secondcity.com",tags:["sketch","longform","comedy"],logo:"🎭"},
  {id:"u3",tipo:"compañía",nome:"Upright Citizens Brigade",pais:"🇺🇸",cidade:"Nueva York/LA, EUA",desc:"Escola e teatro fundado por Amy Poehler. Referente do formato Harold e o longform en NY.",web:"ucbtheatre.com",tags:["harold","longform","UCB"],logo:"🎪"},
  {id:"u4",tipo:"compañía",nome:"Theatresports International",pais:"🌍",cidade:"Internacional",desc:"Rede global de impro competitiva creada por Keith Johnstone. Presente en máis de 30 países.",web:"theatresports.com",tags:["theatresports","competición","formato"],logo:"🏆"},
  {id:"u5",tipo:"compañía",nome:"iO Theater",pais:"🇺🇸",cidade:"Chicago, EUA",desc:"Fundado por Del Close e Charna Halpern. Creadores do Harold. A escola máis influente do longform.",web:"ioimprov.com",tags:["harold","Del Close","longform"],logo:"🎬"},
  {id:"u6",tipo:"compañía",nome:"Impro Neox",pais:"🇪🇸",cidade:"Madrid, España",desc:"Compañía de referencia en España. Formato de show televisivo e torneos de improvisación.",web:"improneox.com",tags:["España","formato","televisión"],logo:"⚡"},
  {id:"u7",tipo:"compañía",nome:"La Rueda",pais:"🇪🇸",cidade:"Barcelona, España",desc:"Escola e compañía con longa traxectoria en Catalunya. Referente do impro en español.",web:"larueda.cat",tags:["España","escola","formato"],logo:"🎡"},
  {id:"u8",tipo:"compañía",nome:"Improkompaniet",pais:"🇸🇪",cidade:"Estocolmo, Suecia",desc:"Compañía sueca referente en Europa. Moi activa en festivais internacionais.",web:"improkompaniet.se",tags:["Europa","festival","formato"],logo:"🦌"},
  {id:"u9",tipo:"festival",nome:"Improvaganza",pais:"🇨🇦",cidade:"Edmonton, Canadá",desc:"Un dos festivais de impro máis grandes do mundo. Máis de 50 compañías de todo o planeta cada ano.",web:"improvaganza.ca",tags:["festival","internacional","grande"],logo:"🎉"},
  {id:"u10",tipo:"festival",nome:"Festival Internacional de Impro de Madrid",pais:"🇪🇸",cidade:"Madrid, España",desc:"O principal festival de impro en España. Compañías nacionais e internacionais.",web:"festivalimpromadrid.com",tags:["festival","España","internacional"],logo:"🇪🇸"},
  {id:"u11",tipo:"festival",nome:"ComedySportz World Championship",pais:"🌍",cidade:"Itinerante",desc:"Campionato mundial de Theatresports. Equipos de todo o mundo competindo en formato Theatresports.",web:"comedysportz.com",tags:["campionato","theatresports","competición"],logo:"🏅"},
  {id:"u12",tipo:"festival",nome:"Improvision",pais:"🇬🇧",cidade:"Birmingham, UK",desc:"Festival internacional no Reino Unido cunha gran escena de impro europea.",web:"improvision.org.uk",tags:["festival","UK","Europa"],logo:"🎪"},
  {id:"u13",tipo:"escola",nome:"Loose Moose School",pais:"🇨🇦",cidade:"Calgary, Canadá",desc:"A escola orixinal de Keith Johnstone. Forma a facilitadores e actores en todo o mundo.",web:"loosemoose.com",tags:["escola","johnstone","formación"],logo:"📚"},
  {id:"u14",tipo:"escola",nome:"Second City Training Centre",pais:"🇺🇸",cidade:"Chicago/Toronto",desc:"Programa de formación do Second City. Un dos máis reputados do mundo para actores de comedia.",web:"secondcity.com/training",tags:["escola","formación","sketch"],logo:"🎓"},
  {id:"u15",tipo:"escola",nome:"Escuela de Impro Madrid",pais:"🇪🇸",cidade:"Madrid, España",desc:"Escola de referencia en España con formación continua e shows propios.",web:"escueladeimpromadrid.com",tags:["escola","España","formación"],logo:"🏫"},
  {id:"u16",tipo:"persoa",nome:"Keith Johnstone",pais:"🇬🇧",cidade:"Calgary (orixe: UK)",desc:"O pai do impro moderno. Creou o Theatresports, o Maestro e os conceptos de status e oferta/bloqueo. Autor de 'Impro' e 'Impro for Storytellers'.",web:"keithjohnstone.com",tags:["fundador","teórico","Theatresports"],logo:"👴"},
  {id:"u17",tipo:"persoa",nome:"Del Close",pais:"🇺🇸",cidade:"Chicago, EUA",desc:"Co-creador do Harold con Charna Halpern. Influencia central en toda a tradición do longform americano. Figura mítica e controvertida.",web:"",tags:["Harold","longform","iO"],logo:"🎭"},
  {id:"u18",tipo:"persoa",nome:"Viola Spolin",pais:"🇺🇸",cidade:"Chicago, EUA",desc:"Pioneira do impro teatral. Creou os 'Theater Games', base de todo o impro moderno. Nai de Paul Sills, fundador do Second City.",web:"violaspolin.org",tags:["pioneira","theater games","orixe"],logo:"👩"},
  {id:"u19",tipo:"persoa",nome:"Charna Halpern",pais:"🇺🇸",cidade:"Chicago, EUA",desc:"Co-fundadora do iO Theater con Del Close. Impulsora do longform e do Harold. Autora de 'Truth in Comedy'.",web:"iochicago.com",tags:["Harold","iO","longform"],logo:"👩‍🎭"},
  {id:"u20",tipo:"proxecto",nome:"Impro Galicia",pais:"🇪🇸",cidade:"Galicia, España",desc:"Comunidade e proxecto de impro en Galicia. Conexión entre grupos e facilitadores galegos.",web:"",tags:["Galicia","comunidade","España"],logo:"🐚"},
];

const UNIVERSO_TIPOS=[
  {id:"todos",label:"Todo",emoji:"🌍"},
  {id:"compañía",label:"Compañías",emoji:"🎭"},
  {id:"festival",label:"Festivais",emoji:"🎉"},
  {id:"escola",label:"Escolas",emoji:"📚"},
  {id:"persoa",label:"Persoas",emoji:"👤"},
  {id:"proxecto",label:"Proxectos",emoji:"🚀"},
];

function TabUniverso(){
  const {T}=useTheme();const S=mkS(T);
  const [filtro,setFiltro]=useState("todos");
  const [search,setSearch]=useState("");
  const [sel,setSel]=useState(null);

  const lista=UNIVERSO_DATA.filter(x=>(filtro==="todos"||x.tipo===filtro)&&(!search||x.nome.toLowerCase().includes(search.toLowerCase())||x.desc.toLowerCase().includes(search.toLowerCase())||x.tags.some(t=>t.toLowerCase().includes(search.toLowerCase()))));

  const TIPO_COL={compañía:"#e040fb",festival:"#ffd740",escola:"#40c4ff",persoa:"#69f0ae",proxecto:"#ff6e40"};

  if(sel)return(<div>
    <button onClick={()=>setSel(null)} style={{...S.btn(T.bg3,T.text2),marginBottom:"1rem"}}>← Universo Impro</button>
    <div style={{...S.panel,border:`1.5px solid ${TIPO_COL[sel.tipo]||T.accent}33`,borderTop:`4px solid ${TIPO_COL[sel.tipo]||T.accent}`}}>
      <div style={{display:"flex",gap:"1rem",alignItems:"flex-start",marginBottom:"1rem",flexWrap:"wrap"}}>
        <div style={{fontSize:"3rem",lineHeight:1,flexShrink:0}}>{sel.logo}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:"0.5rem",alignItems:"center",flexWrap:"wrap",marginBottom:"0.3rem"}}>
            <span style={S.tag(TIPO_COL[sel.tipo]||T.accent)}>{sel.tipo}</span>
            <span style={{color:T.text3,fontSize:"0.82rem"}}>{sel.pais} {sel.cidade}</span>
          </div>
          <h2 style={{color:T.text,fontWeight:900,fontSize:"1.3rem",margin:"0 0 0.5rem"}}>{sel.nome}</h2>
          <p style={{color:T.text2,fontSize:"0.88rem",lineHeight:1.6,margin:0}}>{sel.desc}</p>
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem",marginBottom:"1rem"}}>
        {sel.tags.map(tag=><span key={tag} style={{...S.tag(T.text4),background:T.bg3}}>#{tag}</span>)}
      </div>
      {sel.web&&<a href={`https://${sel.web}`} target="_blank" rel="noopener noreferrer" style={{...S.btn(TIPO_COL[sel.tipo]||T.accent),display:"inline-block",textDecoration:"none",color:"#000"}}>🌐 Visitar web</a>}
    </div>
  </div>);

  return(<div>
    <div style={{...S.panel,marginBottom:"1rem",background:T.accent+"08",border:`1.5px solid ${T.accent}22`}}>
      <p style={{color:T.text,fontWeight:700,margin:"0 0 0.2rem",fontSize:"0.95rem"}}>🌍 Universo Impro</p>
      <p style={{color:T.text3,fontSize:"0.82rem",margin:0}}>Compañías, festivais, escolas e persoas que fan o impro mundial. Toca calquera para saber máis.</p>
    </div>
    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.85rem",flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...S.input,flex:1}}/>
      <span style={{color:T.text4,fontSize:"0.78rem",alignSelf:"center"}}>{lista.length}</span>
    </div>
    <div style={{display:"flex",gap:"0.3rem",marginBottom:"1rem",flexWrap:"wrap"}}>
      {UNIVERSO_TIPOS.map(t=><button key={t.id} onClick={()=>setFiltro(t.id)} style={{background:filtro===t.id?(TIPO_COL[t.id]||T.accent):T.bg3,color:filtro===t.id?"#000":T.text3,border:"none",borderRadius:20,padding:"0.28rem 0.75rem",fontSize:"0.74rem",fontWeight:filtro===t.id?700:400,cursor:"pointer",fontFamily:"inherit"}}>{t.emoji} {t.label}</button>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"0.6rem"}}>
      {lista.map(item=>(<button key={item.id} onClick={()=>setSel(item)} style={{...S.panel,cursor:"pointer",textAlign:"left",width:"100%",border:`1.5px solid ${T.border}`,borderTop:`3px solid ${TIPO_COL[item.tipo]||T.accent}`,transition:"all 0.15s"}}>
        <div style={{display:"flex",gap:"0.65rem",alignItems:"flex-start"}}>
          <span style={{fontSize:"1.6rem",lineHeight:1,flexShrink:0}}>{item.logo}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:"0.4rem",alignItems:"center",marginBottom:"0.2rem",flexWrap:"wrap"}}>
              <span style={S.tag(TIPO_COL[item.tipo]||T.accent)}>{item.tipo}</span>
              <span style={{color:T.text3,fontSize:"0.72rem"}}>{item.pais}</span>
            </div>
            <p style={{color:T.text,fontWeight:700,margin:"0 0 0.2rem",fontSize:"0.9rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.nome}</p>
            <p style={{color:T.text3,fontSize:"0.78rem",margin:0,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.desc}</p>
          </div>
        </div>
      </button>))}
    </div>
    {lista.length===0&&<div style={{...S.panel,textAlign:"center",padding:"2.5rem 1rem"}}>
      <p style={{fontSize:"2rem",margin:"0 0 0.5rem"}}>🔍</p>
      <p style={{color:T.text4}}>Sen resultados para "{search}"</p>
    </div>}
  </div>);
}



function PantallaPublica({stimulus,timerDisplay,timerRunning,rundown,onClose}){
  const [td,setTd]=useState(timerDisplay||0);
  const [notif,setNotif]=useState(null);
  const [prevActive,setPrevActive]=useState(null);
  const [showTimer,setShowTimer]=useState(true);
  const ref=useRef(null);
  useEffect(()=>setTd(timerDisplay||0),[timerDisplay]);
  useEffect(()=>{if(timerRunning){ref.current=setInterval(()=>setTd(p=>Math.max(0,p-1)),1000);}else clearInterval(ref.current);return()=>clearInterval(ref.current);},[timerRunning]);

  useEffect(()=>{
    if(!timerRunning)return;
    if(td===30)showNotif("⏱ 30 segundos","#ffd740");
    else if(td===10)showNotif("⚠️ 10 segundos","#ff6e40");
    else if(td===0&&timerDisplay>0)showNotif("⏹ Tiempo agotado","#ff6e40");
  },[td,timerRunning]);

  const activeAct=rundown?.find(a=>a.activa);
  useEffect(()=>{
    if(activeAct?.id!==prevActive){
      if(activeAct)showNotif(`▶ ${activeAct.nombre}`,"#e040fb");
      setPrevActive(activeAct?.id||null);
    }
  },[activeAct?.id]);

  const showNotif=(msg,col)=>{
    setNotif({msg,col,id:Date.now()});
    setTimeout(()=>setNotif(null),3500);
  };

  const urgent=td>0&&td<10,warning=td>0&&td<30;
  const timerColor=urgent?"#ff6e40":warning?"#ffd740":"#e040fb";

  return(<div style={{position:"fixed",inset:0,zIndex:2000,background:"#050505",display:"flex",flexDirection:"column",fontFamily:"'Inter',system-ui,sans-serif"}}>
    <button onClick={onClose} style={{position:"absolute",top:12,right:16,background:"#1a1a1a",border:"1px solid #333",color:"#555",borderRadius:8,padding:"0.3rem 0.7rem",cursor:"pointer",fontSize:"0.75rem",zIndex:10}}>✕ Cerrar</button>

    {/* Notificación flotante */}
    {notif&&<div key={notif.id} style={{position:"absolute",top:60,left:"50%",transform:"translateX(-50%)",background:notif.col+"22",border:`1.5px solid ${notif.col}`,borderRadius:12,padding:"0.65rem 1.5rem",zIndex:20,animation:"pubIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",backdropFilter:"blur(12px)",whiteSpace:"nowrap"}}>
      <span style={{color:notif.col,fontWeight:700,fontSize:"0.95rem"}}>{notif.msg}</span>
    </div>}

    {/* Área principal: estímulo */}
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",gap:"1.5rem"}}>
      {stimulus?(
        <>
          <p style={{color:"#e040fb",fontFamily:"monospace",fontSize:"clamp(0.8rem,2vw,1rem)",letterSpacing:"0.3em",margin:0,textTransform:"uppercase",opacity:0.8}}>{stimulus.category}</p>
          <h1 style={{fontSize:"clamp(3rem,10vw,8rem)",fontWeight:900,color:"#fff",textShadow:"0 0 80px rgba(224,64,251,0.5)",lineHeight:1.05,maxWidth:"85vw",textAlign:"center",margin:0,animation:"pubIn 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}>{stimulus.word}</h1>
        </>
      ):(
        <div style={{textAlign:"center"}}>
          <p style={{fontSize:"5rem",margin:"0 0 1rem"}}>🎭</p>
          <p style={{color:"#333",fontSize:"1.2rem",fontWeight:700}}>improApp</p>
          <p style={{color:"#222",fontSize:"0.85rem"}}>Pantalla de proxección</p>
        </div>
      )}
    </div>

    {/* Barra inferior */}
    <div style={{background:"#0a0a0a",borderTop:"1px solid #1a1a1a",padding:"0.85rem 1.5rem",display:"flex",alignItems:"center",gap:"1.5rem",flexWrap:"wrap"}}>

      {/* Timer */}
      <div style={{display:"flex",alignItems:"center",gap:"0.85rem",cursor:"pointer"}} onClick={()=>setShowTimer(!showTimer)}>
        {showTimer&&<div style={{fontFamily:"monospace",fontWeight:900,fontSize:"clamp(1.8rem,5vw,3rem)",color:timerColor,textShadow:urgent?`0 0 30px ${timerColor}`:"none",animation:urgent?"urgentPulse 0.5s ease infinite alternate":"none",lineHeight:1,minWidth:"4ch"}}>{FMT(td)}</div>}
        {timerRunning&&<div style={{width:8,height:8,borderRadius:"50%",background:timerColor,boxShadow:`0 0 12px ${timerColor}`,animation:"urgentPulse 1s ease infinite alternate"}}/>}
      </div>

      {/* Actuación activa */}
      {activeAct&&<div style={{flex:1}}>
        <p style={{color:"#555",fontSize:"0.65rem",letterSpacing:"0.15em",margin:"0 0 0.15rem",fontFamily:"monospace"}}>EN ESCENA</p>
        <p style={{color:"#40c4ff",fontWeight:900,fontSize:"clamp(0.9rem,2.5vw,1.3rem)",margin:0}}>{activeAct.nombre}{activeAct.formato&&<span style={{color:"#40c4ff88",fontWeight:400,fontSize:"0.8em",marginLeft:"0.5rem"}}>{activeAct.formato}</span>}</p>
      </div>}

      {/* Rundown mini */}
      {rundown&&rundown.length>0&&<div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",maxWidth:"40vw"}}>
        {rundown.map((act,i)=><div key={act.id} style={{background:act.activa?"#40c4ff22":act.hecho?"#1a1a1a":"#111",border:`1px solid ${act.activa?"#40c4ff":act.hecho?"#222":"#1a1a1a"}`,borderRadius:6,padding:"0.2rem 0.55rem",fontSize:"0.7rem",color:act.activa?"#40c4ff":act.hecho?"#333":"#444",textDecoration:act.hecho?"line-through":"none",transition:"all 0.3s"}}>{i+1}. {act.nombre.slice(0,12)}{act.nombre.length>12?"...":""}</div>)}
      </div>}
    </div>
  </div>);
}


function TabAjustes(){
  const {T}=useTheme();const S=mkS(T);
  const [msg,setMsg]=useState("");
  const [stats,setStats]=useState(()=>ls.get("impro_stats",{cats:{},dins:{},total:0,mins:0}));
  const [view,setView]=useState("stats");
  const exportAll=()=>{
    const keys=["impro_dinamicas_v2","impro_sesiones","impro_grupos","impro_ideas_v2","impro_favoritos","impro_playlists_v2","impro_efectos_v2","impro_stats","impro_historial","impro_grupo_activo","impro_theme"];
    const data={version:"v7",fecha:new Date().toISOString()};
    keys.forEach(k=>{const v=ls.get(k,null);if(v!==null)data[k]=v;});
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;
    a.download=`improapp_${new Date().toLocaleDateString("es-ES").replace(/\//g,"-")}.json`;a.click();URL.revokeObjectURL(url);
    setMsg("✓ Exportado");setTimeout(()=>setMsg(""),3000);
  };
  const importAll=(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{try{
      const data=JSON.parse(ev.target.result);if(!data.version){setMsg("❌ Archivo no válido");return;}
      const keys=["impro_dinamicas_v2","impro_sesiones","impro_grupos","impro_ideas_v2","impro_favoritos","impro_playlists_v2","impro_efectos_v2","impro_stats","impro_historial","impro_grupo_activo"];
      let count=0;keys.forEach(k=>{if(data[k]!==undefined){ls.set(k,data[k]);count++;}});
      setMsg(`✓ Importado: ${count} secciones. Recarga para aplicar.`);
      setStats(ls.get("impro_stats",{cats:{},dins:{},total:0,mins:0}));
    }catch{setMsg("❌ Error al leer el archivo");}};
    reader.readAsText(file);e.target.value="";
  };
  const resetStats=()=>{if(!confirm("¿Borrar todas las estadísticas?"))return;ls.set("impro_stats",{cats:{},dins:{},total:0,mins:0});setStats({cats:{},dins:{},total:0,mins:0});};
  const topCats=Object.entries(stats.cats||{}).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const topDins=Object.entries(stats.dins||{}).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxCat=topCats[0]?.[1]||1;const maxDin=topDins[0]?.[1]||1;
  return(<div>
    <div style={{display:"flex",gap:"0.4rem",marginBottom:"1rem"}}>
      {[["stats","📊 Estadísticas"],["backup","💾 Backup"],["idioma","🌐 Idioma"]].map(([v,l])=>(<button key={v} onClick={()=>setView(v)} style={{...S.btn(view===v?T.accent:T.bg3,view===v?"#fff":T.text2),flex:1,fontSize:"0.8rem"}}>{l}</button>))}
    </div>
    {view==="stats"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.5rem",marginBottom:"1.25rem"}}>
        {[{label:"Generados",val:stats.total||0,col:T.accent},{label:"Minutos entrenados",val:stats.mins||0,col:"#40c4ff"},{label:"En Guía",val:ls.get("impro_dinamicas_v2",DINAMICAS_BASE).length,col:"#69f0ae"}].map((s,i)=>(
          <div key={i} style={{...S.panel,textAlign:"center",border:`1.5px solid ${s.col}44`}}><div style={{color:s.col,fontWeight:900,fontSize:"1.6rem",lineHeight:1}}>{s.val}</div><div style={{color:T.text3,fontSize:"0.7rem",marginTop:"0.25rem"}}>{s.label}</div></div>
        ))}
      </div>
      {(stats.total||0)===0&&<div style={{...S.panel,textAlign:"center",padding:"2rem",color:T.text4}}><p style={{fontSize:"1.5rem",margin:"0 0 0.5rem"}}>📊</p><p style={{margin:0}}>Genera estímulos y usa dinámicas para ver estadísticas aquí.</p></div>}
      {topCats.length>0&&<><p style={S.ptitle(T.accent)}>Categorías más generadas</p><div style={{display:"flex",flexDirection:"column",gap:"0.45rem",marginBottom:"1.25rem"}}>
        {topCats.map(([cat,n])=>(<div key={cat} style={{display:"flex",alignItems:"center",gap:"0.65rem"}}><span style={{color:T.text2,fontSize:"0.8rem",width:90,flexShrink:0}}>{CAT_ICONS[cat]||"◆"} {cat}</span><div style={{flex:1,height:8,background:T.bg3,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${(n/maxCat)*100}%`,background:T.accent,borderRadius:4,transition:"width 0.5s"}}/></div><span style={{color:T.accent,fontWeight:700,fontSize:"0.8rem",width:22,textAlign:"right",flexShrink:0}}>{n}</span></div>))}
      </div></>}
      {topDins.length>0&&<><p style={S.ptitle("#ffd740")}>Dinámicas más usadas (Reto)</p><div style={{display:"flex",flexDirection:"column",gap:"0.45rem",marginBottom:"1rem"}}>
        {topDins.map(([din,n])=>(<div key={din} style={{display:"flex",alignItems:"center",gap:"0.65rem"}}><span style={{color:T.text2,fontSize:"0.8rem",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{din}</span><div style={{width:80,height:8,background:T.bg3,borderRadius:4,overflow:"hidden",flexShrink:0}}><div style={{height:"100%",width:`${(n/maxDin)*100}%`,background:"#ffd740",borderRadius:4}}/></div><span style={{color:"#ffd740",fontWeight:700,fontSize:"0.8rem",width:22,textAlign:"right",flexShrink:0}}>{n}</span></div>))}
      </div></>}
      {(stats.total||0)>0&&<button onClick={resetStats} style={{...S.btn(T.bg3,T.text4),fontSize:"0.75rem"}}>↺ Borrar estadísticas</button>}
    </div>}
    {view==="idioma"&&<TabIdioma/>}
    {view==="backup"&&<div>
      <div style={{...S.panel,marginBottom:"0.75rem",border:"1.5px solid #69f0ae33"}}><p style={S.ptitle("#69f0ae")}>Exportar</p><p style={{color:T.text2,fontSize:"0.85rem",lineHeight:1.6,marginBottom:"0.85rem"}}>Descarga un JSON con todos tus datos: sesiones, grupos, dinámicas, ideas, favoritos, playlists y estadísticas.</p><button onClick={exportAll} style={{...S.btn("#69f0ae","#000"),width:"100%"}}>⬇ Exportar todo (.json)</button></div>
      <div style={{...S.panel,marginBottom:"0.75rem",border:"1.5px solid #40c4ff33"}}><p style={S.ptitle("#40c4ff")}>Importar</p><p style={{color:T.text2,fontSize:"0.85rem",lineHeight:1.6,marginBottom:"0.85rem"}}>Carga un archivo exportado anteriormente. Recarga la página tras importar.</p><label style={{...S.btn("#40c4ff","#000"),display:"block",textAlign:"center",cursor:"pointer",width:"100%",boxSizing:"border-box"}}>⬆ Importar .json<input type="file" accept=".json" onChange={importAll} style={{display:"none"}}/></label></div>
      {msg&&<div style={{...S.panel,background:msg.startsWith("✓")?"#0c1a0c":"#1a0c0c",border:`1px solid ${msg.startsWith("✓")?"#69f0ae44":"#ff6e4044"}`,color:msg.startsWith("✓")?"#69f0ae":"#ff6e40",fontSize:"0.85rem",marginBottom:"0.75rem"}}>{msg}</div>}

    </div>}
  </div>);
}

function TabIdioma(){
  const {T}=useTheme();const S=mkS(T);
  const {lang,setLang}=useLang();
  const [msg,setMsg]=useState("");
  const LANGS=[["es","🇪🇸 Español"],["gl","🏴 Galego"],["en","🇬🇧 English"]];

  const exportForTranslation=()=>{
    const data=buildTranslationExport();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download=`improapp_traduccion_${new Date().toLocaleDateString("es-ES").replace(/\//g,"-")}.json`;
    a.click();URL.revokeObjectURL(url);
    setMsg("✓ Exportado. Pásalo a Claude para traducir los campos vacíos.");
    setTimeout(()=>setMsg(""),5000);
  };

  const importTranslation=(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{try{const data=JSON.parse(ev.target.result);if(!data.meta){setMsg("❌ Archivo no válido");return;}importTranslations(data);setMsg("✓ Traducciones importadas correctamente.");}catch{setMsg("❌ Error al leer el archivo");}};
    reader.readAsText(file);e.target.value="";
  };

  return(<div>
    <div style={{...S.panel,marginBottom:"1rem",border:`1.5px solid ${T.accent}33`}}>
      <p style={S.ptitle(T.accent)}>Idioma da interface</p>
      <div style={{display:"flex",gap:"0.5rem"}}>
        {LANGS.map(([code,label])=>(
          <button key={code} onClick={()=>setLang(code)} style={{...S.btn(lang===code?T.accent:T.bg3,lang===code?"#fff":T.text2),flex:1}}>{label}</button>
        ))}
      </div>
      <p style={{color:T.text4,fontSize:"0.75rem",marginTop:"0.6rem"}}>O galego e o inglés amósanse segundo as traducións importadas. Os campos sen traducir aparecen en español.</p>
    </div>
    <div style={{...S.panel,marginBottom:"0.75rem",border:"1.5px solid #e040fb33"}}>
      <p style={S.ptitle(T.accent)}>1. Exportar para traducir</p>
      <p style={{color:T.text2,fontSize:"0.84rem",lineHeight:1.6,marginBottom:"0.85rem"}}>Xera un JSON con todo o contido traducible. Pásallo a Claude con: <em style={{color:T.text3}}>"Traduce ao galego e inglés os campos gl e en baleiros."</em></p>
      <button onClick={exportForTranslation} style={{...S.btn(T.accent),width:"100%"}}>⬇ Exportar para traducir</button>
    </div>
    <div style={{...S.panel,border:"1.5px solid #40c4ff33"}}>
      <p style={S.ptitle("#40c4ff")}>2. Importar tradución</p>
      <p style={{color:T.text2,fontSize:"0.84rem",lineHeight:1.6,marginBottom:"0.85rem"}}>Carga o JSON devolto. Só enche os campos baleiros, nunca sobreescribe.</p>
      <label style={{...S.btn("#40c4ff","#000"),display:"block",textAlign:"center",cursor:"pointer",width:"100%",boxSizing:"border-box"}}>⬆ Importar tradución<input type="file" accept=".json" onChange={importTranslation} style={{display:"none"}}/></label>
    </div>
    {msg&&<div style={{...S.panel,background:msg.startsWith("✓")?"#0c1a0c":"#1a0c0c",border:`1px solid ${msg.startsWith("✓")?"#69f0ae44":"#ff6e4044"}`,color:msg.startsWith("✓")?"#69f0ae":"#ff6e40",fontSize:"0.84rem",marginTop:"0.75rem"}}>{msg}</div>}
    {loadTranslations()&&<button onClick={()=>{ls.set("impro_translations",null);setMsg("↺ Traducciones borradas");}} style={{...S.btn(T.bg3,T.text4),fontSize:"0.75rem",marginTop:"0.75rem"}}>↺ Borrar traducciones</button>}
  </div>);
}


const TABS=[
  {id:"generar",label:"Generar",emoji:"✦"},
  {id:"reto",label:"Reto",emoji:"⚡"},
  {id:"sesiones",label:"Sesiones",emoji:"📋"},
  {id:"guia",label:"Guía",emoji:"📖"},
  {id:"show",label:"Show",emoji:"🎭"},
  {id:"grupos",label:"Grupos",emoji:"👥"},
  {id:"qr",label:"QR",emoji:"📱"},
  {id:"admin",label:"Admin",emoji:"🔐"},
  {id:"ajustes",label:"Ajustes",emoji:"⚙️"},
  {id:"manual",label:"Manual",emoji:"📘"},
  {id:"universo",label:"Universo",emoji:"🌍"},
];

function AppInner(){
  const {dark,toggle,T}=useTheme();
  const [tab,setTab]=useState("generar");
  const [animating,setAnimating]=useState(false);
  const [pubStimulus,setPubStimulus]=useState(null);
  const [pubOpen,setPubOpen]=useState(false);
  const [pubTimerDisplay,setPubTimerDisplay]=useState(0);
  const [pubTimerRunning,setPubTimerRunning]=useState(false);
  const [pubRundown,setPubRundown]=useState([]);
  const [lang,setLangState]=useState(()=>ls.get("impro_lang","es"));
  const setLang=l=>{setLangState(l);ls.set("impro_lang",l);};
  const [grupoActivo,setGrupoActivo]=useState(()=>ls.get("impro_grupo_activo",null));
  const setGrupo=g=>{setGrupoActivo(g);ls.set("impro_grupo_activo",g);};
  const timerLaunchRef=useRef(null);
  const launchTimer=useCallback((mins)=>{if(timerLaunchRef.current)timerLaunchRef.current(mins*60);},[]);
  const audio=useAudio();
  useEffect(()=>{const params=new URLSearchParams(window.location.search);if(params.get("sala"))setTab("qr");},[]);
  const changeTab=newTab=>{if(newTab===tab||animating)return;setAnimating(true);setTab(newTab);setTimeout(()=>setAnimating(false),280);};
  return(<LangCtx.Provider value={{lang,setLang}}><div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",transition:"background 0.3s,color 0.3s"}}>
    <style>{`
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      @keyframes spotlightIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}
      @keyframes pubIn{from{transform:scale(0.85) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
      @keyframes urgentPulse{from{opacity:1}to{opacity:0.4}}
      .tab-content{animation:slideUp 0.28s ease}
      *{box-sizing:border-box}
      ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:3px}
      button:hover{opacity:0.84}
      select{font-family:inherit;background:#1a1a1a;border:1px solid #2a2a2a;color:#fff;border-radius:8px;padding:0.42rem 0.6rem}
      select option{background:#1a1a1a}
      input[type=range]{height:4px}
      textarea{resize:vertical}
      nav::-webkit-scrollbar{display:none}
    `}</style>
    {pubOpen&&<PantallaPublica stimulus={pubStimulus} timerDisplay={pubTimerDisplay} timerRunning={pubTimerRunning} rundown={pubRundown} onClose={()=>setPubOpen(false)}/>}
    <header style={{borderBottom:`1px solid ${T.navBorder}`,padding:"0.8rem 1rem 0",background:T.nav,position:"sticky",top:0,zIndex:100,transition:"background 0.3s,border-color 0.3s"}}>
      <div style={{maxWidth:960,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.55rem",gap:"0.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.45rem"}}>
            <span style={{fontSize:"1.15rem"}}>🎭</span>
            <span style={{fontWeight:900,fontSize:"1.05rem",letterSpacing:"-0.02em"}}>impro<span style={{color:T.accent}}>App</span></span>
            <span style={{background:T.accent+"22",color:T.accent,borderRadius:4,padding:"0.06rem 0.38rem",fontSize:"0.62rem",fontWeight:700}}>v8</span>
          </div>
          <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
            <div style={{display:"flex",background:T.bg3,borderRadius:20,padding:2,gap:1}}>
              {["es","gl","en"].map(l=><button key={l} onClick={()=>setLang(l)} style={{background:lang===l?T.accent:"transparent",color:lang===l?"#fff":T.text3,border:"none",borderRadius:18,padding:"0.22rem 0.5rem",cursor:"pointer",fontSize:"0.72rem",fontWeight:lang===l?700:400,fontFamily:"inherit",transition:"all 0.2s"}}>{l.toUpperCase()}</button>)}
            </div>
            <button onClick={toggle} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:20,padding:"0.3rem 0.65rem",cursor:"pointer",fontSize:"0.82rem",color:T.text2,transition:"all 0.3s",fontFamily:"inherit"}}>{dark?"☀️":"🌙"}</button>
            <button onClick={()=>setPubOpen(p=>!p)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,padding:"0.35rem 0.7rem",cursor:"pointer",fontSize:"0.75rem",color:T.text3}}>📺</button>
          </div>
        </div>
        <nav style={{display:"flex",gap:0,overflowX:"auto",scrollbarWidth:"none"}}>
          {TABS.map(t=>(<button key={t.id} onClick={()=>changeTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:tab===t.id?T.text:T.text3,padding:"0.45rem 0.75rem",fontSize:"0.8rem",fontWeight:tab===t.id?700:400,borderBottom:tab===t.id?`2px solid ${T.accent}`:"2px solid transparent",transition:"all 0.2s",display:"flex",alignItems:"center",gap:"0.3rem",whiteSpace:"nowrap",flexShrink:0,fontFamily:"inherit"}}>
            <span>{t.emoji}</span><span>{TAB_LABELS[lang]?.[t.id]||t.label}</span>
          </button>))}
        </nav>
      </div>
    </header>
    <main style={{maxWidth:960,margin:"0 auto",padding:"1.25rem 1rem 6rem"}}>
      <div className="tab-content" key={tab}>
        {tab==="generar"&&<TabGenerar onStimulus={s=>setPubStimulus(s)}/>}
        {tab==="reto"&&<TabReto/>}
        {tab==="sesiones"&&<TabSesiones onLaunchTimer={launchTimer}/>}
        {tab==="guia"&&<TabGuia/>}
        {tab==="show"&&<TabShow audio={audio} onRundownChange={setPubRundown}/>}
        {tab==="grupos"&&<TabGrupos grupoActivo={grupoActivo} setGrupoActivo={setGrupo}/>}
        {tab==="qr"&&<TabQR/>}
        {tab==="admin"&&<TabAdmin/>}
        {tab==="ajustes"&&<TabAjustes/>}
        {tab==="manual"&&<TabManual/>}
        {tab==="universo"&&<TabUniverso/>}
      </div>
    </main>
    <TimerBar audio={audio} launchRef={timerLaunchRef} onTimerChange={(d,r,p)=>{setPubTimerDisplay(d);setPubTimerRunning(r);}} />
  </div></LangCtx.Provider>);
}

export default function ImproApp(){
  const theme=useThemeProvider();
  return <ThemeCtx.Provider value={theme}><AppInner/></ThemeCtx.Provider>;
}
