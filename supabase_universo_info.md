# Universo Impro — Supabase

Non fai falta un SQL de sementeira manual. A táboa `universo` séguese
automaticamente coas 26 entradas verificadas (`UNIVERSO_DATA` en `datos.js`)
a primeira vez que alguén abre a pestana Universo despois de aplicar
`supabase_universo.sql`.

## Orde de aplicación

1. `supabase_universo.sql` (crea a táboa e as políticas RLS)
2. Abrir a app e ir a Universo Impro — a app sementa automaticamente

## Como funciona a partir de agora

- **Calquera pode ler** as entradas verificadas (`verificado = true`)
- **Só usuarios logueados** poden engadir entradas novas (quedan `verificado = false`)
- **O admin** ve as pendentes en Admin → 🌍 Universo, e decide se as publica ou as rexeita
- As entradas propias (aínda sen verificar) son visibles só para quen as engadiu e para o admin
