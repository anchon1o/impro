-- ═══════════════════════════════════════════════════════════════════
-- supabase_eventos.sql — Axenda de eventos
--
-- Cursos, obradoiros, shows e festivais, vinculables a entradas de
-- Universo: quen organiza e onde se celebra.
--
-- Executar no SQL Editor. Idempotente.
-- Requisito previo: supabase_universo_modelo.sql, _grants.sql e _mapa.sql
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.eventos (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null,
  tipo         text not null default 'show',
  descricion   text default '',

  -- Cando. `data_fin` só se enche nos eventos de varios días.
  data_inicio  date not null,
  data_fin     date,
  hora         text default '',            -- texto libre: «20:30», «de 10 a 14»

  -- Vínculos con Universo. Os dous opcionais e independentes: un obradoiro
  -- pode ter organizador coñecido e lugar sen ficha, ou ao revés.
  organiza_id  uuid references public.universo(id) on delete set null,
  lugar_id     uuid references public.universo(id) on delete set null,

  -- Ubicación propia, para cando o lugar non ten ficha en Universo
  cidade       text default '',
  enderezo     text default '',
  lat          numeric(9,6),
  lon          numeric(9,6),

  url          text default '',            -- inscrición ou máis información
  prezo        text default '',            -- texto libre: «25 €», «de balde»

  estado       text not null default 'publicado',
  user_id      uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now(),
  actualizado  timestamptz default now()
);

do $$ begin
  alter table public.eventos add constraint eventos_tipo_ok
    check (tipo in ('curso','obradoiro','show','festival','xornada','outro'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.eventos add constraint eventos_estado_ok
    check (estado in ('publicado','borrador','cancelado'));
exception when duplicate_object then null; end $$;

-- A data de fin non pode ser anterior á de inicio
do $$ begin
  alter table public.eventos add constraint eventos_datas_ok
    check (data_fin is null or data_fin >= data_inicio);
exception when duplicate_object then null; end $$;

-- Mesma regra ca en universo: as dúas coordenadas ou ningunha
do $$ begin
  alter table public.eventos add constraint eventos_coords_ok
    check ((lat is null) = (lon is null));
exception when duplicate_object then null; end $$;

create index if not exists eventos_data_idx on public.eventos(data_inicio);
create index if not exists eventos_organiza_idx on public.eventos(organiza_id);
create index if not exists eventos_lugar_idx on public.eventos(lugar_id);

create or replace function public.eventos_touch()
returns trigger language plpgsql as $$
begin new.actualizado = now(); return new; end; $$;

drop trigger if exists eventos_touch_trg on public.eventos;
create trigger eventos_touch_trg before update on public.eventos
  for each row execute function public.eventos_touch();


-- ── RLS ────────────────────────────────────────────────────────────
alter table public.eventos enable row level security;

-- Ler: os publicados vainos todo o mundo; os borradores só quen os creou
-- e o admin.
drop policy if exists eventos_select on public.eventos;
create policy eventos_select on public.eventos for select
  using (estado = 'publicado' or user_id = auth.uid() or public.is_admin());

-- Crear: só con conta. O admin pode publicar directo; o resto crea a nome seu.
drop policy if exists eventos_insert on public.eventos;
create policy eventos_insert on public.eventos for insert
  with check (public.is_admin() or (auth.uid() is not null and user_id = auth.uid()));

drop policy if exists eventos_update on public.eventos;
create policy eventos_update on public.eventos for update
  using (public.is_admin() or user_id = auth.uid())
  with check (public.is_admin() or user_id = auth.uid());

drop policy if exists eventos_delete on public.eventos;
create policy eventos_delete on public.eventos for delete
  using (public.is_admin() or user_id = auth.uid());


-- ── GRANTs ─────────────────────────────────────────────────────────
-- ⚠️ SEN ISTO A TÁBOA NON SE PODE LER, por moi correctas que sexan as
-- políticas: Postgres comproba o permiso antes de mirar a RLS e responde
-- «permission denied». Foi o que rompeu Admin → Categorías.
grant select on public.eventos to anon, authenticated;
grant insert, update, delete on public.eventos to authenticated;


-- ═══ COMPROBACIÓN ══════════════════════════════════════════════════
-- select count(*) from public.eventos;
-- select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type)
--   from information_schema.role_table_grants
--  where table_name = 'eventos' and grantee in ('anon','authenticated')
--  group by 1,2;
