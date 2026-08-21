// ═══════════════════════════════════════════════════════════════════
// tabs/TabPlano.jsx
// ═══════════════════════════════════════════════════════════════════
// A porta de Plano. Tres pantallas:
//
//   modo  →  lista  →  editor
//
// ⚠️ AO ENTRAR ESCÓLLESE SEMPRE MODO. Non hai un por defecto e non se
// recorda entre sesións a propósito: escénico e técnico teñen
// ferramentas distintas que non se mesturan NUNCA, e abrir directo no
// que usaches a última vez fai que alguén empece a colocar micrófonos
// crendo que está colocando actores.
//
// ⚠️ O modo é estado DESTA PANTALLA, non do documento (decisión B). Un
// plano ten sempre as dúas capas: o mesmo escenario onde se move a
// xente é onde van os micros. `modoUltimo` gárdase só para volver por
// onde ías, e non ten efecto ningún nos datos.
//
// PL1b traerá o editor. De momento a lista xa crea, renomea, duplica e
// borra planos, en local e na conta.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useTheme, useAuth, mkS } from '../core.jsx';
import { Icona } from '../iconos.jsx';
import * as almacen from '../plano/almacen.js';
import { resumo } from '../plano/modelo.js';

const MODOS = [
  {
    id: 'escenico', emoji: '🎭', nome: 'Plano escénico',
    desc: 'Onde está cada quen, cara a onde mira e como se move.',
    cor: 'accent',
  },
  {
    id: 'tecnico', emoji: '🔧', nome: 'Plano técnico',
    desc: 'Micros, monitores, luz e backline. Para pasarllo á sala.',
    cor: 'info',
  },
];

function SelectorModo({ T, S, onEscoller }) {
  return (
    <div>
      <p style={{ color: T.text2, fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
        Un plano ten as dúas capas sobre o mesmo escenario. Escolle con cal
        queres traballar agora; podes cambiar dentro sen perder nada.
      </p>
      <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))' }}>
        {MODOS.map((m) => (
          <button
            key={m.id}
            onClick={() => onEscoller(m.id)}
            style={{
              ...S.panel,
              textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              borderStyle: 'solid', borderWidth: 1.5, borderColor: `${T[m.cor]}44`,
              background: `${T[m.cor]}0F`, minHeight: 130,
              display: 'flex', flexDirection: 'column', gap: '0.4rem',
            }}
          >
            <span style={{ fontSize: '1.9rem', lineHeight: 1 }}>{m.emoji}</span>
            <span style={{ color: T[m.cor], fontWeight: 800, fontSize: '1rem' }}>{m.nome}</span>
            <span style={{ color: T.text3, fontSize: '0.82rem', lineHeight: 1.45 }}>{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FichaPlano({ plano, T, S, onAbrir, onRenomear, onDuplicar, onBorrar }) {
  const r = resumo(plano);
  return (
    <div style={{
      ...S.panel, padding: '0.85rem 1rem',
      display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
    }}
    >
      <button
        onClick={onAbrir}
        style={{
          flex: '1 1 180px', minWidth: 0, textAlign: 'left', background: 'none',
          border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <p style={{
          color: T.text, fontWeight: 700, margin: '0 0 0.2rem', fontSize: '0.95rem',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
        >
          {plano.nome}
        </p>
        <p style={{ color: T.text3, fontSize: '0.75rem', margin: 0 }}>
          {r.actores === 1 ? '1 persoa' : `${r.actores} persoas`}
          {r.tecnicos > 0 && ` · ${r.tecnicos} técnicos`}
          {/* ⚠️ «estático» e «4 momentos» non son dous tipos de plano:
              é o mesmo obxecto con máis ou menos momentos. */}
          {' · '}{r.animado ? `${r.momentos} momentos` : 'estático'}
          {plano.local && <span style={{ color: T.text4 }}> · só neste aparello</span>}
        </p>
      </button>
      <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
        {[
          { k: 'ren', txt: '✎', tit: 'Renomear', on: onRenomear },
          { k: 'dup', txt: '⧉', tit: 'Duplicar', on: onDuplicar },
          { k: 'bor', txt: '🗑', tit: 'Borrar', on: onBorrar, cor: T.danger },
        ].map((b) => (
          <button
            key={b.k} onClick={b.on} title={b.tit}
            style={{
              background: T.bg3, borderStyle: 'solid', borderWidth: 1, borderColor: T.border,
              borderRadius: 8, minHeight: 38, minWidth: 38, cursor: 'pointer',
              color: b.cor || T.text3, fontSize: '0.85rem', fontFamily: 'inherit',
            }}
          >
            {b.txt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TabPlano() {
  const { T } = useTheme();
  const S = mkS(T);
  const { logueado, user } = useAuth();
  const [modo, setModo] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [motivo, setMotivo] = useState('cargando');
  const [aberto, setAberto] = useState(null);

  const recargar = useCallback(async () => {
    setMotivo('cargando');
    const r = await almacen.listar(logueado);
    setPlanos(r.planos);
    // ⚠️ Cargando, baleiro e sen conexión son TRES estados distintos.
    // Amosar «non tes planos» cando o que fallou foi a rede é o que
    // fai que alguén pense que perdeu o traballo.
    setMotivo(r.motivo || null);
  }, [logueado]);

  useEffect(() => { if (modo) recargar(); }, [modo, recargar]);

  const crear = async () => {
    const nome = prompt('Nome do plano:', 'Plano novo');
    if (nome === null) return;
    const p = almacen.novoPlano(nome.trim() || 'Plano novo');
    await almacen.gardar({ ...p, modoUltimo: modo }, { logueado, userId: user?.id });
    recargar();
  };

  const renomear = async (p) => {
    const nome = prompt('Nome do plano:', p.nome);
    if (nome === null || !nome.trim()) return;
    await almacen.gardar({ ...p, nome: nome.trim() }, { logueado, userId: user?.id });
    recargar();
  };

  const duplicar = async (p) => {
    if (p.local) almacen.duplicarLocal(p.id);
    else await almacen.gardar({ ...p, id: undefined, nome: `${p.nome} (copia)` }, { logueado, userId: user?.id });
    recargar();
  };

  const borrar = async (p) => {
    if (!confirm(`Borrar «${p.nome}»? Non se pode desfacer.`)) return;
    await almacen.borrar(p);
    recargar();
  };

  if (!modo) {
    return (
      <div>
        <h2 style={{ ...S.t.h2, color: T.text, margin: '0 0 0.5rem' }}>Plano</h2>
        <SelectorModo T={T} S={S} onEscoller={setModo} />
      </div>
    );
  }

  const info = MODOS.find((m) => m.id === modo);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => { setModo(null); setAberto(null); }}
          title="Cambiar de modo"
          style={{
            background: T.bg3, borderStyle: 'solid', borderWidth: 1, borderColor: T.border,
            borderRadius: 8, minHeight: 38, padding: '0 0.7rem', cursor: 'pointer',
            color: T.text3, fontSize: '0.8rem', fontFamily: 'inherit',
          }}
        >
          ‹
        </button>
        <span style={{ fontSize: '1.15rem' }}>{info.emoji}</span>
        <span style={{ color: T[info.cor], fontWeight: 800, fontSize: '1rem', flex: 1, minWidth: 0 }}>{info.nome}</span>
        <button
          onClick={crear}
          style={{ ...S.btn(T[info.cor]), minHeight: 38, padding: '0 0.9rem', fontSize: '0.8rem' }}
        >
          + Novo
        </button>
      </div>

      {motivo === 'cargando' && (
        <p style={{ color: T.text4, fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>Cargando…</p>
      )}

      {/* ⚠️ 'erro' e 'sen-conexion' teñen que tratarse OS DOUS. Se só se
          contempla un, o outro non pinta nada e queda a pantalla en
          branco: é o que pasaría se aínda non se executou
          `supabase_planos.sql`, que devolve 'erro', non 'sen-conexion'. */}
      {(motivo === 'sen-conexion' || motivo === 'erro') && (
        <div style={{ ...S.panel, textAlign: 'center' }}>
          <p style={{ color: T.danger, fontSize: '0.88rem', margin: '0 0 0.75rem' }}>
            Non se puido ler os planos da conta agora mesmo. Os que teñas
            neste aparello si están dispoñibles.
          </p>
          <button onClick={recargar} style={{ ...S.btn(T.accent), minHeight: 38 }}>↻ Reintentar</button>
        </div>
      )}

      {motivo === 'baleiro' && (
        <div style={{ ...S.panel, textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ fontSize: '2.5rem', margin: '0 0 0.75rem' }}>{info.emoji}</p>
          <p style={{ color: T.text2, fontWeight: 700, margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
            Aínda non tes ningún plano
          </p>
          <p style={{ color: T.text3, fontSize: '0.82rem', margin: 0 }}>
            {logueado
              ? 'Crea o primeiro e gárdase na túa conta.'
              : 'Podes crear planos sen conta: gárdanse neste aparello.'}
          </p>
        </div>
      )}

      {!motivo && (
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          {planos.map((p) => (
            <FichaPlano
              key={p.id} plano={p} T={T} S={S}
              onAbrir={() => setAberto(p.id)}
              onRenomear={() => renomear(p)}
              onDuplicar={() => duplicar(p)}
              onBorrar={() => borrar(p)}
            />
          ))}
        </div>
      )}

      {/* PL1b · o editor do escenario entra aquí. */}
      {aberto && (
        <div style={{ ...S.panel, marginTop: '0.85rem', textAlign: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: T.border2 }}>
          <p style={{ color: T.text3, fontSize: '0.85rem', margin: '0 0 0.6rem' }}>
            <Icona nome="plano" size={22} /><br />
            O editor do escenario chega na seguinte entrega.
          </p>
          <button onClick={() => setAberto(null)} style={{ ...S.btn(T.bg4), minHeight: 38, color: T.text2 }}>Pechar</button>
        </div>
      )}
    </div>
  );
}
