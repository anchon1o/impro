import React from 'react';

// Un erro en calquera compoñente de React tumba TODA a árbore: por iso un
// fallo nunha soa sección deixaba a app enteira en branco, sen ningunha
// pista do que pasara.
//
// Un ErrorBoundary detén a caída no seu límite. Envolvendo cada pestana,
// o peor caso pasa a ser «esta sección non carga» en vez de «a app non
// existe», e ademais amosa o erro real para poder reportalo.
//
// Ten que ser unha clase: React non ofrece equivalente en hooks.

export class LimiteErro extends React.Component {
  constructor(props) {
    super(props);
    this.state = { erro: null, info: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error('[LimiteErro]', this.props.onde || '?', erro, info?.componentStack);
    this.setState({ info });
  }

  componentDidUpdate(prev) {
    // Ao cambiar de sección, dáselle outra oportunidade.
    if (prev.onde !== this.props.onde && this.state.erro) {
      this.setState({ erro: null, info: null });
    }
  }

  render() {
    if (!this.state.erro) return this.props.children;

    const T = this.props.T || {};
    const detalle = [
      `Sección: ${this.props.onde || '?'}`,
      `Erro: ${this.state.erro?.message || this.state.erro}`,
      (this.state.info?.componentStack || '').split('\n').slice(1, 4).join('\n'),
    ].join('\n');

    return (
      <div style={{
        background: (T.danger || '#ff6e40') + '12',
        borderStyle: 'solid', borderWidth: 1,
        borderColor: (T.danger || '#ff6e40') + '44',
        borderRadius: 12, padding: '1.1rem', margin: '0.5rem 0',
      }}>
        <p style={{ color: T.danger || '#ff6e40', fontWeight: 800, fontSize: '1rem', margin: '0 0 0.4rem' }}>
          Esta sección non se puido cargar
        </p>
        <p style={{ color: T.text2 || '#aaa', fontSize: '0.84rem', margin: '0 0 0.8rem', lineHeight: 1.5 }}>
          O resto da aplicación segue funcionando. Podes cambiar de sección e volver máis tarde.
        </p>

        <pre style={{
          background: T.bg3 || '#1e1e1e', borderRadius: 8, padding: '0.7rem',
          color: T.text3 || '#666', fontSize: '0.72rem', overflowX: 'auto',
          margin: '0 0 0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>{detalle}</pre>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button onClick={() => this.setState({ erro: null, info: null })}
            style={{
              background: T.bg3 || '#1e1e1e', borderStyle: 'solid', borderWidth: 1,
              borderColor: T.border || '#252525', color: T.text2 || '#aaa',
              borderRadius: 8, padding: '0.45rem 0.8rem', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.8rem', minHeight: 38,
            }}>Tentar de novo</button>
          <button onClick={() => { try { navigator.clipboard.writeText(detalle); } catch {} }}
            style={{
              background: T.bg3 || '#1e1e1e', borderStyle: 'solid', borderWidth: 1,
              borderColor: T.border || '#252525', color: T.text2 || '#aaa',
              borderRadius: 8, padding: '0.45rem 0.8rem', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.8rem', minHeight: 38,
            }}>⧉ Copiar erro</button>
        </div>
        <p style={{ color: T.text4 || '#444', fontSize: '0.74rem', margin: '0.7rem 0 0' }}>
          Copia o erro e mándao co botón 🐛.
        </p>
      </div>
    );
  }
}
