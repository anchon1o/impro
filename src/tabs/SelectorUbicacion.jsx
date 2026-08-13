import { useState, useEffect, useRef } from 'react';
import { useTheme, mkS } from '../core.jsx';
import { buscarCoordenadas } from '../universo.js';

// Selector de ubicación por pin.
//
// Substitúe o formulario de enderezo + resultados + coordenadas por un mapa
// no que se pincha. Un campo de busca por comodidade, pero o que manda é
// onde se pon o pin: é máis rápido e non obriga a acertar cun enderezo
// exacto, que moitas veces nin existe (un festival nunha praza, unha
// compañía sen sede fixa).
//
// Leaflet cárgase baixo demanda, igual ca no mapa xeral.

const CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function cargarLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (window.__leafletPromise) return window.__leafletPromise;
  window.__leafletPromise = new Promise((res, rej) => {
    if (!document.querySelector(`link[href="${CSS}"]`)) {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = CSS;
      document.head.appendChild(l);
    }
    const s = document.createElement('script');
    s.src = JS; s.async = true;
    s.onload = () => res(window.L);
    s.onerror = () => rej(new Error('Non se puido cargar o mapa'));
    document.head.appendChild(s);
  });
  return window.__leafletPromise;
}

export function SelectorUbicacion({ valor, onCambiar, emoji = '📍', pista = '' }) {
  const { T } = useTheme(); const S = mkS(T);
  const cont = useRef(null);
  const mapa = useRef(null);
  const marca = useRef(null);
  const [estado, setEstado] = useState('cargando');
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState('');

  const lat = valor?.lat ?? null;
  const lon = valor?.lon ?? null;

  useEffect(() => {
    let vivo = true;
    cargarLeaflet().then(L => {
      if (!vivo || !cont.current || mapa.current) return;
      mapa.current = L.map(cont.current, { scrollWheelZoom: false })
        .setView(lat != null ? [lat, lon] : [42.8, -8.0], lat != null ? 14 : 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 19,
      }).addTo(mapa.current);
      // Pinchar no mapa move o pin. É a acción principal.
      mapa.current.on('click', e => {
        onCambiar({ lat: Number(e.latlng.lat.toFixed(6)), lon: Number(e.latlng.lng.toFixed(6)) });
      });
      setEstado('listo');
    }).catch(() => { if (vivo) setEstado('erro'); });
    return () => { vivo = false; };
  }, []);

  // Pintar ou mover o pin cando cambian as coordenadas
  useEffect(() => {
    if (estado !== 'listo' || !mapa.current || !window.L) return;
    const L = window.L;
    if (lat == null) { if (marca.current) { marca.current.remove(); marca.current = null; } return; }
    const icona = L.divIcon({
      html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))">${emoji}</div>`,
      className: '', iconSize: [30, 30], iconAnchor: [15, 26],
    });
    if (marca.current) marca.current.setLatLng([lat, lon]).setIcon(icona);
    else {
      marca.current = L.marker([lat, lon], { icon: icona, draggable: true }).addTo(mapa.current);
      marca.current.on('dragend', ev => {
        const p = ev.target.getLatLng();
        onCambiar({ lat: Number(p.lat.toFixed(6)), lon: Number(p.lng.toFixed(6)) });
      });
    }
    mapa.current.setView([lat, lon], Math.max(mapa.current.getZoom(), 13));
  }, [estado, lat, lon, emoji]);

  const buscar = async () => {
    if (!busca.trim()) return;
    setBuscando(true); setAviso('');
    const r = await buscarCoordenadas(busca);
    setBuscando(false);
    if (r.erro) { setAviso(r.erro); return; }
    const p = r.resultados[0];
    onCambiar({ lat: p.lat, lon: p.lon });
    if (r.resultados.length > 1) setAviso('Se non é aí, move o pin ou pincha no mapa.');
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.4rem', marginBottom: '0.4rem' }}>
        <input value={busca} onChange={e => setBusca(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } }}
          placeholder={pista || 'Busca unha cidade ou enderezo'}
          style={{ ...S.input, marginBottom: 0 }} />
        <button onClick={buscar} disabled={buscando}
          style={{ ...S.btn(T.bg3, T.text2), whiteSpace: 'nowrap', opacity: buscando ? 0.6 : 1 }}>
          {buscando ? 'Buscando…' : 'Buscar'}</button>
      </div>

      {estado === 'erro'
        ? <p style={{ color: T.warn, fontSize: '0.78rem', margin: 0 }}>
            Non se puido cargar o mapa. Precisa conexión a internet.
          </p>
        : <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', borderStyle: 'solid', borderWidth: 1, borderColor: T.border }}>
            <div ref={cont} style={{ height: 220, width: '100%', background: T.bg3 }} />
            {estado === 'cargando' &&
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg3 }}>
                <p style={{ color: T.text3, fontSize: '0.8rem' }}>Cargando o mapa…</p>
              </div>}
          </div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
        {lat != null
          ? <>
              <span style={{ color: T.ok, fontSize: '0.76rem' }}>📍 Situado</span>
              <button onClick={() => onCambiar({ lat: null, lon: null })}
                style={{ background: 'none', border: 'none', color: T.text4, cursor: 'pointer', fontSize: '0.74rem', textDecoration: 'underline', fontFamily: 'inherit' }}>
                quitar o pin</button>
            </>
          : <span style={{ color: T.text4, fontSize: '0.76rem' }}>Pincha no mapa para situalo. Sen pin non aparece no mapa xeral.</span>}
        {aviso && <span style={{ color: T.warn, fontSize: '0.74rem' }}>{aviso}</span>}
      </div>
    </div>
  );
}
