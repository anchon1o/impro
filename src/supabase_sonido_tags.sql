-- ═══════════════════════════════════════════════════════════════════
-- SONIDO · etiquetas oficiais
-- ═══════════════════════════════════════════════════════════════════
-- Executar DESPOIS de supabase_sonido.sql.
-- Idempotente: repetir non duplica nin pisa cambios de `oficial`.
--
-- Catro categorías. A terceira, FUNCIÓN ESCÉNICA, é a que de verdade
-- distingue isto dunha biblioteca de sons calquera: ninguén busca «son
-- de porta», búscase «algo para unha entrada de personaxe».
-- ═══════════════════════════════════════════════════════════════════

insert into public.son_tags (id, categoria, nome, oficial, orde) values

-- ─── TONO / XÉNERO ─────────────────────────────────────────────────
  ('tono-comedia',      'tono','Comedia',       true, 10),
  ('tono-terror',       'tono','Terror',        true, 20),
  ('tono-romantico',    'tono','Romántico',     true, 30),
  ('tono-epico',        'tono','Épico',         true, 40),
  ('tono-melancolico',  'tono','Melancólico',   true, 50),
  ('tono-absurdo',      'tono','Absurdo',       true, 60),
  ('tono-misterio',     'tono','Misterio',      true, 70),
  ('tono-tension',      'tono','Tensión',       true, 80),

-- ─── UNIVERSO / AMBIENTACIÓN ───────────────────────────────────────
  ('uni-western',       'universo','Western',            true, 10),
  ('uni-medieval',      'universo','Medieval',           true, 20),
  ('uni-scifi',         'universo','Ciencia ficción',    true, 30),
  ('uni-80',            'universo','Anos 80',            true, 40),
  ('uni-hospital',      'universo','Hospital',           true, 50),
  ('uni-instituto',     'universo','Instituto',          true, 60),
  ('uni-oficina',       'universo','Oficina',            true, 70),
  ('uni-espazo',        'universo','Espazo',             true, 80),
  ('uni-rural',         'universo','Rural',              true, 90),
  ('uni-detectives',    'universo','Detectives',         true, 100),

-- ─── FUNCIÓN ESCÉNICA ──────────────────────────────────────────────
  ('fun-entrada',       'funcion','Entrada de personaxe', true, 10),
  ('fun-transicion',    'funcion','Transición',           true, 20),
  ('fun-final',         'funcion','Final',                true, 30),
  ('fun-tension',       'funcion','Tensión',              true, 40),
  ('fun-revelacion',    'funcion','Revelación',           true, 50),
  ('fun-persecucion',   'funcion','Persecución',          true, 60),
  ('fun-romance',       'funcion','Romance',              true, 70),
  ('fun-fracaso',       'funcion','Fracaso',              true, 80),
  ('fun-victoria',      'funcion','Victoria',             true, 90),
  ('fun-presentacion',  'funcion','Presentación',         true, 100),
  ('fun-cambio',        'funcion','Cambio de escena',     true, 110),

-- ─── CARACTERÍSTICAS ───────────────────────────────────────────────
  ('car-loop',          'caracteristica','Loop',      true, 10),
  ('car-curto',         'caracteristica','Curto',     true, 20),
  ('car-longo',         'caracteristica','Longo',     true, 30),
  ('car-impacto',       'caracteristica','Impacto',   true, 40),
  ('car-ambiente',      'caracteristica','Ambiente',  true, 50),
  ('car-musica',        'caracteristica','Música',    true, 60),
  ('car-voz',           'caracteristica','Con voz',   true, 70),
  ('car-senvoz',        'caracteristica','Sen voz',   true, 80)

on conflict (id) do update
  set categoria = excluded.categoria,
      nome      = excluded.nome,
      orde      = excluded.orde;

-- Debe dar: caracteristica 8 · funcion 11 · tono 8 · universo 10 = 37
select categoria, count(*) as etiquetas
from public.son_tags where oficial
group by categoria order by categoria;
