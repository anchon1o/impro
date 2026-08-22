// Render de tabs/TabPlano.jsx.
// ⚠️ O que se comproba aquí é a regra pechada: ao entrar escóllese
// SEMPRE modo, e as ferramentas dos dous modos non se mesturan.

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemeCtx, AuthCtx, LangCtx, TEMAS, completarTema } from '/home/claude/impro/impro/src/core.jsx';
import { TabPlano } from '/home/claude/impro/impro/src/tabs/TabPlano.jsx';
import * as almacen from '/home/claude/impro/impro/src/plano/almacen.js';

let f = 0;
const ok = (t, c, e = '') => { console.log((c ? '✓ ' : '✗ ') + t + (c ? '' : ' — ' + e)); if (!c) f++; };
const cadro = () => act(async () => { await new Promise((r) => setTimeout(r, 30)); });

const T = completarTema(TEMAS[0].escuro, 'escuro');
const marco = (hijo, auth = {}) => (
  <ThemeCtx.Provider value={{ T, dark: true, toggle() {}, tema: TEMAS[0], setTema() {}, setDark() {} }}>
    <AuthCtx.Provider value={{ logueado: false, user: null, pedirLogin() {}, esAdmin: false, ...auth }}>
      <LangCtx.Provider value={{ lang: 'gl', setLang() {} }}>{hijo}</LangCtx.Provider>
    </AuthCtx.Provider>
  </ThemeCtx.Provider>
);

const todos = (n, pred, out = []) => {
  if (!n || typeof n !== 'object') return out;
  if (Array.isArray(n)) { n.forEach((x) => todos(x, pred, out)); return out; }
  if (pred(n)) out.push(n);
  if (n.children) todos(n.children, pred, out);
  return out;
};
const texto = (n) => { const o = []; (function w(x) {
  if (x == null) return;
  if (typeof x === 'string' || typeof x === 'number') { o.push(String(x)); return; }
  if (Array.isArray(x)) return x.forEach(w);
  if (x.children) w(x.children);
}(n)); return o.join(' '); };
const botons = (j) => todos(j, (n) => n.type === 'button');
const premible = (j, txt) => botons(j).find((b) => texto(b).includes(txt));

localStorage.clear();
let r = null;
await act(async () => { r = TestRenderer.create(marco(<TabPlano />)); });
await cadro();
let j = r.toJSON();

// ⚠️ Non hai modo por defecto: abrir directo no que usaches a última
// vez fai que alguén empece a colocar micrófonos crendo que coloca
// actores.
ok('⚠️ ao entrar pídese escoller modo', texto(j).includes('Plano escénico') && texto(j).includes('Plano técnico'));
ok('e non se ve aínda ningunha lista', !texto(j).includes('+ Novo'));

await act(async () => { premible(j, 'Plano escénico').props.onClick(); });
await cadro();
j = r.toJSON();
ok('ao escoller escénico entra na lista', !!premible(j, '+ Novo'));
// ⚠️ As ferramentas dos dous modos non se mesturan NUNCA.
ok('⚠️ e o modo técnico xa non está á vista', !texto(j).includes('Plano técnico'));
ok('sen planos, dise que non hai ningún', texto(j).includes('Aínda non tes ningún plano'));
ok('e sen conta explícase onde se gardan', texto(j).includes('neste aparello'));

globalThis.prompt = () => 'Ensaio do martes';
await act(async () => { premible(r.toJSON(), '+ Novo').props.onClick(); });
await cadro();
j = r.toJSON();
ok('crear un plano amósao na lista', texto(j).includes('Ensaio do martes'));
ok('e queda gardado en local', almacen.listarLocais().length === 1, almacen.listarLocais().length);
ok('un plano novo é estático', texto(j).includes('estático'));
ok('e márcase como só deste aparello', texto(j).includes('só neste aparello'));

// ⚠️ O modo é estado da interface, non do documento (decisión B).
ok('⚠️ o documento gardado NON ten campo `modo`', almacen.listarLocais()[0].modo === undefined);
ok('e si `modoUltimo`', almacen.listarLocais()[0].modoUltimo === 'escenico');

// Volver ao selector e entrar por técnico: o MESMO plano segue aí.
await act(async () => { premible(r.toJSON(), '‹').props.onClick(); });
await cadro();
await act(async () => { premible(r.toJSON(), 'Plano técnico').props.onClick(); });
await cadro();
j = r.toJSON();
ok('⚠️ o mesmo plano vese tamén desde o modo técnico: un só documento',
  texto(j).includes('Ensaio do martes'));

globalThis.confirm = () => true;
await act(async () => { premible(r.toJSON(), '🗑').props.onClick(); });
await cadro();
ok('borrar quítao', almacen.listarLocais().length === 0);

// ⚠️ Se a táboa aínda non existe, Supabase devolve 'erro', NON
// 'sen-conexion'. Tratar só un dos dous deixa a pantalla en branco.
let r2 = null;
await act(async () => { r2 = TestRenderer.create(marco(<TabPlano />, { logueado: true, user: { id: 'u1' } })); });
await cadro();
await act(async () => { premible(r2.toJSON(), 'Plano escénico').props.onClick(); });
await cadro();
const tx2 = texto(r2.toJSON());
ok('⚠️ con conta e sen táboa, dise que pasa en vez de quedar en branco',
  tx2.includes('Non se puido ler') || tx2.includes('Aínda non tes'), tx2.slice(0, 90));
ok('e nunca queda a pantalla baleira', tx2.trim().length > 20);
await act(async () => { r2.unmount(); });
await act(async () => { r.unmount(); });
localStorage.clear();

console.log(f ? `\n${f} FALLOS` : '\n✓ Os casos de render de Plano pasan');
process.exit(f ? 1 : 0);
