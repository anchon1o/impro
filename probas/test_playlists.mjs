import * as E from '/home/claude/impro/impro/src/audio/externo.js';
import * as P from '/home/claude/impro/impro/src/sonido/playlists.js';
let f=0; const ok=(t,c,e='')=>{console.log((c?'✓ ':'✗ ')+t+(c?'':' — '+e)); if(!c)f++;};

// ── Recoñecer de onde vén cada pista ─────────────────────────────
const YT=[['https://www.youtube.com/watch?v=dQw4w9WgXcQ','dQw4w9WgXcQ'],
 ['https://youtu.be/dQw4w9WgXcQ','dQw4w9WgXcQ'],
 ['https://www.youtube.com/embed/dQw4w9WgXcQ','dQw4w9WgXcQ'],
 ['https://www.youtube.com/shorts/dQw4w9WgXcQ','dQw4w9WgXcQ'],
 ['https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=X','dQw4w9WgXcQ'],
 ['https://www.youtube.com/watch?list=X&v=dQw4w9WgXcQ','dQw4w9WgXcQ']];
for (const [u,id] of YT) ok('id de '+u.slice(8,42), E.idYoutube(u)===id, E.idYoutube(u));
ok('unha url que non é de YouTube dá null', E.idYoutube('https://x.com/a.mp3')===null);
ok('e unha entrada baleira tampouco peta', E.idYoutube(null)===null && E.idYoutube(123)===null);

ok('un mp3 é interno', E.detectarProvedor('https://x.com/a.mp3')==='interno');
ok('un blob do dispositivo é interno', E.detectarProvedor('blob:abc')==='interno');
ok('YouTube detéctase', E.detectarProvedor('https://youtu.be/dQw4w9WgXcQ')==='youtube');
ok('⚠️ Spotify márcase como NON soportado', E.detectarProvedor('https://open.spotify.com/track/x')==='nonSoportado');
ok('e Apple Music tamén', E.detectarProvedor('https://music.apple.com/es/album/x')==='nonSoportado');

ok('⚠️ só o interno é mesturable', E.esMesturable('https://x/a.mp3')===true
   && E.esMesturable('https://youtu.be/dQw4w9WgXcQ')===false);

// ── Embed ────────────────────────────────────────────────────────
const emb = E.urlEmbed('https://youtu.be/dQw4w9WgXcQ');
ok('o embed usa youtube-nocookie', emb.startsWith('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'));
ok('con autoplay e playsinline', emb.includes('autoplay=1') && emb.includes('playsinline=1'));
ok('⚠️ SEN enablejsapi: non se carga script externo', !emb.includes('enablejsapi'));
ok('un embed dunha url non-YouTube é null', E.urlEmbed('https://x/a.mp3')===null);

// ── Avisos ───────────────────────────────────────────────────────
const av = E.avisosDe('https://youtu.be/dQw4w9WgXcQ');
ok('⚠️ YouTube avisa de modo exclusivo', av.exclusivo===true && /publicidade/.test(av.texto));
ok('Spotify dá erro explicativo', E.avisosDe('https://open.spotify.com/x').erro===true);
ok('un mp3 non dá aviso ningún', E.avisosDe('https://x/a.mp3').exclusivo===false);

// ── Pegar listas ─────────────────────────────────────────────────
let ps = P.analizarLista(`https://youtu.be/dQw4w9WgXcQ
Tema propio\thttps://x.com/tema.mp3

  https://x.com/outro.mp3
non é unha url`);
ok('analiza 3 pistas e ignora o lixo', ps.length===3, ps.length);
ok('respecta o nome cando vén con tabulador', ps[1].nome==='Tema propio');
ok('e sácao do ficheiro cando non', ps[2].nome==='Outro', ps[2].nome);
ok('marca o provedor de cada unha',
   ps[0].provedor==='youtube' && ps[1].provedor==='interno');

// ── Navegación ───────────────────────────────────────────────────
const pl = { id:'l1', nome:'Show', emoji:'🎵', pistas:ps, local:true };
ok('seguinte avanza', P.seguinte(pl, ps[0].id).id===ps[1].id);
ok('⚠️ e ao final volve ao principio', P.seguinte(pl, ps[2].id).id===ps[0].id);
ok('sen bucle, ao final dá null', P.seguinte(pl, ps[2].id, {bucle:false})===null);
ok('anterior retrocede', P.anterior(pl, ps[1].id).id===ps[0].id);
ok('e ao principio vai ao final', P.anterior(pl, ps[0].id).id===ps[2].id);
ok('nunha lista baleira non peta', P.seguinte({pistas:[]},'x')===null);

let m2 = P.mover(pl, ps[0].id, 1);
ok('mover baixa unha pista', m2.pistas[1].id===ps[0].id);
ok('mover fóra de rango non cambia nada', P.mover(pl, ps[0].id, -1).pistas[0].id===ps[0].id);
ok('quitar elimina', P.quitar(pl, ps[1].id).pistas.length===2);

// ── Resumo: avisar ANTES da función ──────────────────────────────
const r = P.resumo(pl);
ok('conta internas e externas', r.total===3 && r.externas===1 && r.internas===2);
ok('⚠️ e detecta que a lista é mixta', r.mixta===true);
ok('unha lista só propia non é mixta', P.resumo({pistas:[ps[1]]}).mixta===false);

// ── Gardar e cargar ──────────────────────────────────────────────
let g = await P.gardarPlaylist(pl, null);
ok('gárdase sen conta', g.ok===true, g.erro);
let c = await P.cargarPlaylists(null);
ok('e recupérase coas 3 pistas', c.playlists.length===1 && c.playlists[0].pistas.length===3);
ok('rexeita unha lista sen nome', (await P.gardarPlaylist({...pl,nome:'  '},null)).ok===false);

// ⚠️ O provedor recalcúlase ao ler: unha URL cambiada non pode quedar
// cun provedor obsoleto, porque significaría reproducir mal.
localStorage.setItem('impro_sonido_playlists_v1', JSON.stringify([{
 id:'x',nome:'Proba',pistas:[{id:'a',nome:'A',url:'https://youtu.be/dQw4w9WgXcQ',provedor:'interno'}]}]));
c = await P.cargarPlaylists(null);
ok('⚠️ corrixe un provedor mal gardado', c.playlists[0].pistas[0].provedor==='youtube',
   c.playlists[0].pistas[0].provedor);

localStorage.setItem('impro_sonido_playlists_v1','{roto');
ok('JSON corrupto non impide abrir', (await P.cargarPlaylists(null)).playlists.length===0);
localStorage.setItem('impro_sonido_playlists_v1', JSON.stringify([
 null,5,{nome:'sen id'},{id:'y',nome:'',pistas:[{id:'1'},{id:'2',url:'https://x/a.mp3',vol:9}]}]));
c = await P.cargarPlaylists(null);
ok('descarta as inválidas', c.playlists.length===1);
ok('e as pistas sen ligazón', c.playlists[0].pistas.length===1);
ok('recortando o volume fóra de rango', c.playlists[0].pistas[0].vol===1);

console.log(f?`\n${f} FALLOS`:'\n✓ Os 38 casos de listas pasan');
process.exit(f?1:0);
