// Configuración de ESLint (formato novo, v9+).
//
// Un só obxectivo: detectar identificadores usados sen definir. É a clase
// de erro que `vite build` NON ve, porque Rollup asume que un nome
// descoñecido é unha variable global. Só rebenta ao executar:
//   «LimiteErro is not defined», «url is not defined».
import react from 'eslint-plugin-react';

export default [
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly', document: 'readonly', navigator: 'readonly',
        localStorage: 'readonly', sessionStorage: 'readonly', console: 'readonly',
        fetch: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
        setInterval: 'readonly', clearInterval: 'readonly', alert: 'readonly',
        confirm: 'readonly', prompt: 'readonly', Blob: 'readonly', File: 'readonly',
        FileReader: 'readonly', URL: 'readonly', AudioContext: 'readonly',
        requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
        Image: 'readonly', Audio: 'readonly', React: 'readonly',
        URLSearchParams: 'readonly', crypto: 'readonly', location: 'readonly',
      },
    },
    plugins: { react },
    settings: { react: { version: '18' } },
    rules: {
      'no-undef': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
    },
  },
];
