-- ═══════════════════════════════════════════════════════════════════
-- supabase_universo_mapa.sql
--
--   1. Coordenadas nas fichas, para poder situalas nun mapa.
--   2. Categoría nova: Garito (bares, teatros e locais con impro).
--
-- Executar no SQL Editor. Idempotente.
-- Requisito previo: supabase_universo_modelo.sql e _grants.sql
-- ═══════════════════════════════════════════════════════════════════


-- ── 1. Coordenadas ─────────────────────────────────────────────────
-- Van como columnas e non dentro de `datos` porque son o único campo que
-- se consulta por rango: «que hai preto de aquí» é unha consulta
-- xeográfica, e iso non se pode indexar dentro dun jsonb.

alter table public.universo
  add column if not exists lat numeric(9,6),
  add column if not exists lon numeric(9,6),
  add column if not exists enderezo text;

do $$ begin
  alter table public.universo add constraint universo_lat_ok
    check (lat is null or (lat between -90 and 90));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.universo add constraint universo_lon_ok
    check (lon is null or (lon between -180 and 180));
exception when duplicate_object then null; end $$;

-- As dúas ou ningunha: unha ficha con só latitude non se pode debuxar.
do $$ begin
  alter table public.universo add constraint universo_coords_completas
    check ((lat is null) = (lon is null));
exception when duplicate_object then null; end $$;

-- Índice parcial: só interesan as fichas que están no mapa.
create index if not exists universo_coords_idx
  on public.universo (lat, lon)
  where lat is not null and estado = 'publicada';


-- ── 2. Categoría Garito ────────────────────────────────────────────
-- Distínguese de «Espazo»: Espazo é a sede propia dunha escola ou
-- compañía; Garito é o local onde se programa impro sen ser da casa
-- (bares, teatros, cafés). Se na práctica se solapan, sempre se poden
-- fusionar desde Admin → Categorías.

insert into public.universo_categorias (id, nome, emoji, plantilla, orde, descricion) values
  ('garito', 'Garito', '🍻', 'lugar', 65,
   'Bares, teatros, cafés e locais onde se programa impro.')
on conflict (id) do nothing;

-- Asegurar que Espazo existe e queda ao carón na orde
insert into public.universo_categorias (id, nome, emoji, plantilla, orde, descricion) values
  ('espazo', 'Espazo', '📍', 'lugar', 60, 'Salas e sedes con actividade de impro.')
on conflict (id) do nothing;


-- ═══ COMPROBACIÓN ══════════════════════════════════════════════════
-- select id, nome, emoji, plantilla, orde from public.universo_categorias order by orde;
-- select count(*) filter (where lat is not null) as con_coordenadas,
--        count(*) as total
--   from public.universo;
