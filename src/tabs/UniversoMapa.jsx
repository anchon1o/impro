import { useState, useEffect, useRef } from 'react';
import { useTheme, mkS } from '../core.jsx';

// Mapa de Universo.
//
// Leaflet cárgase BAIXO DEMANDA desde un CDN, non como dependencia do
// proxecto. Motivo: o paquete que se serve xa vai por 782 kB e Leaflet
// engadiría unhas 150 kB máis a todo o mundo, incluído quen só abre o
// xerador de estímulos. Así só o descarga quen abre o mapa.
//
// Se non hai rede, o compoñente dío en vez de quedar en branco.

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

export function UniversoMapa({ entradas, cats, onAbrir }) {
  const { T } = useTheme(); const S = mkS(T);
  const cont = useRef(null);
  const mapa = useRef(null);
  const capa = useRef(null);
  const [estado, setEstado] = useState('cargando');
  const [erro, setErro] = useState('');

  const conCoords = (entradas || []).filter(e => e.lat != null && e.lon != null);

  useEffect(() => {
    let vivo = true;
    cargarLeaflet().then(L => {
      if (!vivo || !cont.current) return;
      if (!mapa.current) {
        mapa.current = L.map(cont.current, { scrollWheelZoom: false })
          .setView([42.8, -8.0], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 18,
        }).addTo(mapa.current);
      }
      setEstado('listo');
    }).catch(e => {
      if (vivo) { setEstado('erro'); setErro(e.message); }
    });
    return () => { vivo = false; };
  }, []);

  // Redebuxar marcadores cando cambien as entradas ou o filtro
  useEffect(() => {
    if (estado !== 'listo' || !mapa.current || !window.L) return;
    const L = window.L;
    if (capa.current) capa.current.remove();
    capa.current = L.layerGroup().addTo(mapa.current);

    conCoords.forEach(e => {
      const cat = (cats || []).find(c => c.id === e.tipo);
      const icona = L.divIcon({
        html: `<div style="font-size:20px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))">${e.logo || cat?.emoji || '📍'}</div>`,
        className: '', iconSize: [24, 24], iconAnchor: [12, 12],
      });
      const m = L.marker([e.lat, e.lon], { icon: icona }).addTo(capa.current);
      m.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:150px">
           <strong>${(e.nome || '').replace(/</g, '&lt;')}</strong><br>
           <span style="color:#666;font-size:12px">${cat ? cat.emoji + ' ' + cat.nome : e.tipo}${e.cidade ? ' · ' + e.cidade : ''}</span>
         </div>`);
      m.on('click', () => { if (onAbrir) onAbrir(e); });
    });

    if (conCoords.length) {
      const b = L.latLngBounds(conCoords.map(e => [e.lat, e.lon]));
      mapa.current.fitBounds(b, { padding: [40, 40], maxZoom: 13 });
    }
  }, [estado, entradas, cats]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        <p style={{ ...S.caption, margin: 0 }}>
          {conCoords.length} de {(entradas || []).length} entradas teñen ubicación.
        </p>
        {conCoords.length < (entradas || []).length &&
          <p style={{ ...S.caption, margin: 0, color: T.text4 }}>
            As demais poden situarse editando a súa ficha.
          </p>}
      </div>

      {estado === 'erro' && (
        <div style={{ ...S.panel, borderStyle: 'solid', borderWidth: 1, borderColor: T.danger + '44' }}>
          <p style={{ color: T.danger, fontWeight: 700, fontSize: '0.85rem', margin: '0 0 0.3rem' }}>Non se puido cargar o mapa</p>
          <p style={{ color: T.text3, fontSize: '0.8rem', margin: 0 }}>{erro}. Precisa conexión a internet.</p>
        </div>
      )}

      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', borderStyle: 'solid', borderWidth: 1, borderColor: T.border }}>
        <div ref={cont} style={{ height: 420, width: '100%', background: T.bg3 }} />
        {estado === 'cargando' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg3 }}>
            <p style={{ color: T.text3, fontSize: '0.85rem' }}>Cargando o mapa…</p>
          </div>
        )}
      </div>

      {conCoords.length === 0 && estado === 'listo' && (
        <p style={{ ...S.caption, marginTop: '0.6rem' }}>
          Aínda non hai ningunha entrada con ubicación. Edita unha ficha e usa
          o buscador de enderezo para situala.
        </p>
      )}
    </div>
  );
}
