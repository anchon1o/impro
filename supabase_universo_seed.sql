-- ============================================================
-- IMPROAPP — SEMENTEIRA DE UNIVERSO IMPRO
-- Executar UNHA VEZ dende SQL Editor (bypassa RLS, sempre funciona)
-- ============================================================

-- Evitar duplicados se se executa máis dunha vez
delete from universo where user_id is null and verificado = true;

insert into universo (tipo, nome, pais, cidade, descricion, web, tags, logo, verificado, user_id) values
  ('compañía','Loose Moose Theatre','🇨🇦','Calgary, Canadá','Fundada por Keith Johnstone, creador do Theatresports e do Maestro. Un dos centros de impro máis influentes do mundo.','loosemoose.com',to_jsonb(ARRAY['theatresports','johnstone','formato']::text[]),'🫎',true,null),
  ('compañía','The Second City','🇺🇸','Chicago, EUA','A compañía de impro e sketch máis famosa do mundo. Alumni: Tina Fey, Steve Carell, Bill Murray, Amy Poehler.','secondcity.com',to_jsonb(ARRAY['sketch','longform','comedy']::text[]),'🎭',true,null),
  ('compañía','Upright Citizens Brigade','🇺🇸','Nueva York/LA, EUA','Escola e teatro fundado por Amy Poehler. Referente do formato Harold e o longform en NY.','ucbtheatre.com',to_jsonb(ARRAY['harold','longform','UCB']::text[]),'🎪',true,null),
  ('compañía','iO Theater','🇺🇸','Chicago, EUA','Fundado por Del Close e Charna Halpern. Creadores do Harold. A escola máis influente do longform.','ioimprov.com',to_jsonb(ARRAY['harold','Del Close','longform']::text[]),'🎬',true,null),
  ('escola','Loose Moose School','🇨🇦','Calgary, Canadá','A escola orixinal de Keith Johnstone. Forma a facilitadores e actores en todo o mundo.','loosemoose.com',to_jsonb(ARRAY['escola','johnstone','formación']::text[]),'📚',true,null),
  ('escola','Second City Training Centre','🇺🇸','Chicago/Toronto','Programa de formación do Second City. Un dos máis reputados do mundo para actores de comedia.','secondcity.com/training',to_jsonb(ARRAY['escola','formación','sketch']::text[]),'🎓',true,null),
  ('persoa','Keith Johnstone','🇬🇧','Calgary (orixe: UK)','O pai do impro moderno. Creou o Theatresports, o Maestro e os conceptos de status e oferta/bloqueo. Autor de ''Impro'' e ''Impro for Storytellers''.','keithjohnstone.com',to_jsonb(ARRAY['fundador','teórico','Theatresports']::text[]),'👴',true,null),
  ('persoa','Del Close','🇺🇸','Chicago, EUA','Co-creador do Harold con Charna Halpern. Influencia central en toda a tradición do longform americano.','',to_jsonb(ARRAY['Harold','longform','iO']::text[]),'🎭',true,null),
  ('persoa','Viola Spolin','🇺🇸','Chicago, EUA','Pioneira do impro teatral. Creou os ''Theater Games'', base de todo o impro moderno. Nai de Paul Sills, fundador do Second City.','',to_jsonb(ARRAY['pioneira','theater games','orixe']::text[]),'👩',true,null),
  ('persoa','Charna Halpern','🇺🇸','Chicago, EUA','Co-fundadora do iO Theater con Del Close. Impulsora do longform e do Harold. Autora de ''Truth in Comedy''.','iochicago.com',to_jsonb(ARRAY['Harold','iO','longform']::text[]),'👩‍🎭',true,null),
  ('persoa','Paul Sills','🇺🇸','Chicago, EUA','Fundador do Second City, fillo de Viola Spolin. Levou os Theater Games ao escenario profesional.','',to_jsonb(ARRAY['fundador','Second City','theater games']::text[]),'🎭',true,null),
  ('persoa','Amy Poehler','🇺🇸','Nueva York, EUA','Cofundadora do Upright Citizens Brigade, figura clave en popularizar o longform na cultura mainstream.','',to_jsonb(ARRAY['UCB','longform','fundadora']::text[]),'🎤',true,null),
  ('persoa','Tina Fey','🇺🇸','Chicago, EUA','Alumna e logo directora artística do Second City, referente de como o impro alimenta a escritura de comedia.','',to_jsonb(ARRAY['Second City','comedia','escritura']::text[]),'✍️',true,null),
  ('compañía','Impromadrid Teatro','🇪🇸','Madrid, España','Compañía fundada en 1999 na Liga de Improvisación Madrileña. Máis de 15 producións propias e xiras por 15 países. Organizadora do FESTIM.','impromadrid.com',to_jsonb(ARRAY['España','Madrid','FESTIM']::text[]),'🎭',true,null),
  ('festival','FESTIM','🇪🇸','Madrid, España','Festival Internacional de Improvisación Teatral de Madrid, organizado por Impromadrid Teatro. O único festival internacional de impro de España, con apoio da Comunidade de Madrid.','impromadrid.com',to_jsonb(ARRAY['festival','España','internacional']::text[]),'🎉',true,null),
  ('compañía','Impro Impar','🇪🇸','Madrid, España','Compañía e escola fundada en 2008. Espectáculos propios como ''En Plan Improvisado'' e ''7 Words'', ademais de formación regular.','improimpar.com',to_jsonb(ARRAY['España','Madrid','escola']::text[]),'🎭',true,null),
  ('escola','ImproCafé','🇪🇸','Madrid, España','Escola madrileña con mostras públicas ao final de cada trimestre e shows semanais de alumnos en La Escalera de Jacob.','improcafe.es',to_jsonb(ARRAY['España','Madrid','escola']::text[]),'☕',true,null),
  ('compañía','WIT Impro','🇪🇸','Madrid, España','Escola e teatro de impro madrileño con niveis de iniciación a avanzado e laboratorio de creación de formatos propios.','vivirsinguion.com',to_jsonb(ARRAY['España','Madrid','escola']::text[]),'🎪',true,null),
  ('compañía','Los Duguis','🇪🇸','A Coruña, Galicia','Compañía coruñesa de impro con longa traxectoria, shows regulares e participación no Campionato Galego de Improvisación. Con Oswaldo Digón e Marita Martínez entre os seus membros.','',to_jsonb(ARRAY['Galicia','A Coruña','veterana']::text[]),'🎭',true,null),
  ('compañía','Improperio','🇪🇸','Vigo, Galicia','Compañía viguesa de improvisación teatral, participante habitual do Campionato Galego de Improvisación (IMPROFIGHTERS!).','',to_jsonb(ARRAY['Galicia','Vigo']::text[]),'🎭',true,null),
  ('compañía','The Momento','🇪🇸','Santiago de Compostela, Galicia','Compañía compostelá de impro, participante do Campionato Galego de Improvisación e de mostras organizadas polo Centro Dramático Galego.','',to_jsonb(ARRAY['Galicia','Santiago']::text[]),'🎭',true,null),
  ('compañía','Improversados','🇪🇸','Santiago de Compostela, Galicia','Compañía compostelá con shows mensuais itinerantes por distintos puntos de Galicia (Santiago, Coruña, Lugo...). Xestiona a escola Subterránea.','',to_jsonb(ARRAY['Galicia','Santiago','escola propia']::text[]),'📖',true,null),
  ('escola','Subterránea','🇪🇸','Santiago de Compostela, Galicia','Escola de improvisación teatral e musical creada por Improversados, con formación para profesionais e afeccionados.','',to_jsonb(ARRAY['Galicia','escola','musical']::text[]),'🏫',true,null),
  ('festival','IMPROFIGHTERS!','🇪🇸','Santiago de Compostela, Galicia','Campionato Galego de Improvisación Teatral. Parellas de improvisadores de distintas compañías galegas compiten en formato de combate por parellas.','',to_jsonb(ARRAY['Galicia','campionato','competición']::text[]),'🏆',true,null),
  ('escola','F!T — Formación en Improvisación Teatral','🇪🇸','Santiago de Compostela, Galicia','Único programa formativo universitario de impro en Europa. Organizado pola Xunta de Galicia e a USC na Cidade da Cultura, con estudantes internacionais cada verán.','',to_jsonb(ARRAY['Galicia','universitario','internacional']::text[]),'🎓',true,null),
  ('persoa','Antón Coucheiro','🇪🇸','Santiago de Compostela, Galicia','Actor e director, un dos responsables do programa F!T e docente de dramaturxia da impro en Galicia.','',to_jsonb(ARRAY['Galicia','docente','director']::text[]),'👨‍🏫',true,null);

-- Verificación
select count(*) as total_verificadas from universo where verificado=true;