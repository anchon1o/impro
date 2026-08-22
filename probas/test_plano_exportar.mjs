// Probas de plano/exportar.js
// ⚠️ As partes que tocan `Image` e `<canvas>` non se poden probar sen
// DOM real, e por iso están illadas: todo o razoamento —nome de
// ficheiro, xmlns, medidas, orde compartir/descargar— é código puro.

import {
  nomeFicheiro, prepararSvg, medidasDe, svgABlob, compartirOuDescargar, serializar,
} from '/home/claude/impro/impro/src/plano/exportar.js';

let f = 0;
const ok = (t, c, e = '') => { console.log((c ? '✓ ' : '✗ ') + t + (c ? '' : ' — ' + e)); if (!c) f++; };

// ── Nome de ficheiro ──────────────────────────────────────────────
// ⚠️ Un plano exportado é algo que se MANDA. Os acentos e os espazos
// sobreviven a moitos sistemas pero rompen algúns servidores de correo.
ok('quita os acentos', nomeFicheiro('Ensaio de Mércores', 'png') === 'ensaio-de-mercores.png',
  nomeFicheiro('Ensaio de Mércores', 'png'));
ok('⚠️ e as barras, que romperían a ruta', !nomeFicheiro('a/b\\c', 'png').includes('/'));
ok('colapsa os separadores', nomeFicheiro('a   ---   b', 'svg') === 'a-b.svg', nomeFicheiro('a   ---   b', 'svg'));
ok('non deixa guións nos extremos', !/^-|-\./.test(nomeFicheiro('---x---', 'png')));
ok('un nome baleiro non dá ".png"', nomeFicheiro('', 'png') === 'plano.png');
ok('un nome só de símbolos tampouco', nomeFicheiro('¡¿!?', 'png') === 'plano.png', nomeFicheiro('¡¿!?', 'png'));
ok('null non peta', nomeFicheiro(null, 'svg') === 'plano.svg');
ok('un nome quilométrico tópase', nomeFicheiro('x'.repeat(500), 'png').length < 70);
ok('o sufixo engádese', nomeFicheiro('Plano', 'png', 'publico') === 'plano-publico.png');
ok('e sen sufixo non deixa guión solto', nomeFicheiro('Plano', 'png') === 'plano.png');
ok('acepta null como sufixo', nomeFicheiro('Plano', 'png', null) === 'plano.png');

// ── Preparar o SVG ────────────────────────────────────────────────
// ⚠️ O fallo clásico e silencioso: sen xmlns, o ficheiro non o abre
// ningún visor. Non dá erro, dá un ficheiro «que non se ve».
const cru = '<svg viewBox="0 0 1000 750" width="100%" height="100%"><rect/></svg>';
const listo = prepararSvg(cru, { ancho: 2000, alto: 1500 });
ok('⚠️ engádese o xmlns', listo.includes('xmlns="http://www.w3.org/2000/svg"'));
ok('e o xlink', listo.includes('xmlns:xlink'));
ok('leva declaración XML', listo.startsWith('<?xml'));
// ⚠️ Sen width/height moitos visores debuxan o SVG a 150×150 aínda
// tendo viewBox.
ok('⚠️ o width en % substitúese por píxeles', listo.includes('width="2000"') && !listo.includes('width="100%"'));
ok('e o height tamén', listo.includes('height="1500"') && !listo.includes('height="100%"'));
ok('a viewBox non se toca', listo.includes('viewBox="0 0 1000 750"'));
ok('non se duplica o xmlns se xa estaba',
  (prepararSvg('<svg xmlns="http://www.w3.org/2000/svg"></svg>').match(/xmlns="http/g) || []).length === 1);
ok('unha cadea baleira devolve baleiro', prepararSvg('') === '');
ok('null non peta', prepararSvg(null) === '');
ok('sen medidas non se tocan os atributos', prepararSvg(cru).includes('width="100%"'));

// ── Medidas ───────────────────────────────────────────────────────
const m1 = medidasDe('<svg viewBox="0 0 1000 750">', 2000);
ok('a proporción sae da viewBox', m1.ancho === 2000 && m1.alto === 1500, JSON.stringify(m1));
const m2 = medidasDe('<svg viewBox="-75 -75 1150 900">', 1150);
ok('⚠️ unha viewBox con orixe negativa tamén', m2.alto === 900, JSON.stringify(m2));
const m3 = medidasDe('<svg viewBox="0 0 1000 700">', 2000);
ok('a vista de público ten a súa proporción', m3.alto === 1400, JSON.stringify(m3));
ok('⚠️ sen viewBox non se devolve NaN', Number.isFinite(medidasDe('<svg>').alto));
ok('unha viewBox de ceros tampouco', Number.isFinite(medidasDe('<svg viewBox="0 0 0 0">').alto));
ok('null non peta', Number.isFinite(medidasDe(null).ancho));

// ── Blob ──────────────────────────────────────────────────────────
const b = svgABlob(listo);
ok('o blob de SVG ten o tipo correcto', /image\/svg\+xml/.test(b.type), b.type);
ok('e contido', b.size > 20);

// ── Compartir ou descargar ────────────────────────────────────────
// ⚠️ En iOS non hai descarga fiable: `<a download>` nunha WKWebView
// abre a imaxe nunha pestana. A folla de compartir SI funciona.
const navOrixinal = globalThis.navigator;
const finxirNav = (v) => { try { Object.defineProperty(globalThis, 'navigator', { value: v, configurable: true }); } catch { /* ignórase */ } };

let compartido = null;
finxirNav({ share: async (d) => { compartido = d; }, canShare: () => true });
globalThis.File = globalThis.File || class { constructor(p, n, o) { this.name = n; this.type = o && o.type; } };
let r = await compartirOuDescargar(b, 'p.svg', 'Plano');
ok('⚠️ se hai folla de compartir, úsase primeiro', r.ok && r.via === 'compartir', JSON.stringify(r));
ok('e mándase o ficheiro co seu nome', compartido && compartido.files[0].name === 'p.svg');

// ⚠️ Cancelar a folla de compartir lanza AbortError. NON é un erro nin
// hai que caer á descarga: quen cancela non quere o ficheiro.
finxirNav({ share: async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; }, canShare: () => true });
r = await compartirOuDescargar(b, 'p.svg');
ok('⚠️ cancelar non se trata como erro', r.via === 'cancelado', JSON.stringify(r));
ok('e non se descarga por detrás', r.ok === false);

// Sen folla de compartir, descárgase.
let clicado = null;
const docOrixinal = globalThis.document;
globalThis.document = {
  createElement: () => ({ set download(v) { clicado = v; }, get download() { return clicado; }, click() {}, style: {} }),
  body: { appendChild() {}, removeChild() {} },
};
globalThis.URL = { createObjectURL: () => 'blob:x', revokeObjectURL() {} };
finxirNav({});
r = await compartirOuDescargar(b, 'plano.png');
ok('⚠️ sen folla de compartir, cae á descarga', r.ok && r.via === 'descarga', JSON.stringify(r));
ok('co nome pedido', clicado === 'plano.png', clicado);

// ⚠️ Nunca se deixa a alguén sen ficheiro: se compartir falla cun erro
// que NON é cancelación, descárgase igual.
finxirNav({ share: async () => { throw new Error('rota'); }, canShare: () => true });
r = await compartirOuDescargar(b, 'outro.png');
ok('⚠️ se compartir falla de verdade, aínda así se descarga', r.ok && r.via === 'descarga', JSON.stringify(r));

globalThis.document = docOrixinal;
finxirNav(navOrixinal);

// ── Serializar ────────────────────────────────────────────────────
ok('serializar(null) devolve baleiro', serializar(null) === '');
ok('sen XMLSerializer cae a outerHTML', serializar({ outerHTML: '<svg/>' }) === '<svg/>');

console.log(f ? `\n${f} FALLOS` : '\n✓ Todos os casos de exportar pasan');
process.exit(f ? 1 : 0);
