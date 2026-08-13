// Configuración mínima cun só obxectivo: detectar identificadores usados
// sen definir. É a clase de erro que `npm run build` non ve (Rollup asume
// que un nome descoñecido é un global) e que só rebenta ao executar:
//   «LimiteErro is not defined», «url is not defined».
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  extends: ['plugin:react/jsx-runtime'],
  plugins: ['react'],
  settings: { react: { version: '18' } },
  rules: {
    'no-undef': 'error',
    'react/jsx-no-undef': 'error',
    'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
  },
  globals: { React: 'readonly' },
};
