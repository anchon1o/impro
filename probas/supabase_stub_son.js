export const escenario = {
  taboas: {}, erro: null,
  set(o) { const {erro, ...t} = o; this.taboas = t; this.erro = erro || null; },
};
function q(tabla) {
  const o = { _t: tabla, _single: false };
  for (const m of ['select','eq','neq','in','is','order','limit','gte','lte','or','filter','range','not'])
    o[m] = () => o;
  o.single = () => { o._single = true; return o; };
  o.maybeSingle = o.single;
  o.insert = (f) => { o._payload = f; return o; };
  o.update = (f) => { o._payload = f; return o; };
  o.upsert = (f) => { o._payload = f; return o; };
  o.delete = () => o;
  const res = () => {
    if (escenario.erro) return Promise.resolve({ data: null, error: { message: escenario.erro } });
    const filas = escenario.taboas[tabla] || [];
    if (o._payload) {
      const d = Array.isArray(o._payload) ? o._payload[0] : o._payload;
      return Promise.resolve({ data: { id: 'novo', ...d }, error: null });
    }
    return Promise.resolve({ data: o._single ? (filas[0] || null) : filas, error: null });
  };
  o.then = (a,b) => res().then(a,b);
  o.catch = (a) => res().catch(a);
  return o;
}
export const supabase = { from: (t) => q(t), auth: {}, rpc: () => q('rpc') };
export const supabaseConfigured = true;
