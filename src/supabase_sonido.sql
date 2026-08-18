-- ═══════════════════════════════════════════════════════════════════
-- SONIDO · Fase 1 — esquema base
-- ═══════════════════════════════════════════════════════════════════
-- Executar ANTES de subir código. Idempotente: pódese repetir sen dano.
--
-- Principios:
--   · A unidade fundamental é o RECURSO, non a playlist.
--   · Playlist, escena, mesa e pack son a MESMA táboa con distinto tipo.
--     Catro táboas serían catro sistemas de permisos, catro de moderación
--     e catro de duplicado, que acabarían diverxendo.
--   · Unha playlist non contén audio: contén REFERENCIAS. O provedor é
--     propiedade de cada elemento, non da lista. Por iso a mesma lista
--     pode mesturar ficheiro propio, YouTube e Apple Music.
--
-- ⚠️ TRAMPAS QUE XA NOS MORDERON:
--   B30 · RLS ≠ GRANT. Postgres comproba o permiso de táboa ANTES da
--         política. Sen GRANT dá «permission denied» coa RLS impecable.
--         Aquí van os dous, para as sete táboas.
--   B37 · Se a táboa xa existe cun esquema vello, o `alter table` ten que
--         declarar TODAS as columnas. Faise abaixo, en bloque.
--   —   · Nada de joins con `perfis`: `user_id` referencia `auth.users`.
--         Consultar `perfis` á parte con `.in('id', ids)`.
--   —   · Sen columnas XERADAS. `universo.verificado` élo e escribir nela
--         falla en silencio desde o cliente.
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1. ETIQUETAS ──────────────────────────────────────────────────
create table if not exists public.son_tags (
  id         text primary key,
  categoria  text not null,
  nome       text not null,
  oficial    boolean not null default true,
  orde       int not null default 0
);

alter table public.son_tags add column if not exists categoria text;
alter table public.son_tags add column if not exists nome      text;
alter table public.son_tags add column if not exists oficial   boolean default true;
alter table public.son_tags add column if not exists orde      int default 0;

do $$ begin
  alter table public.son_tags add constraint son_tags_categoria_chk
    check (categoria in ('tono','universo','funcion','caracteristica'));
exception when duplicate_object then null; end $$;


-- ─── 2. RECURSOS ───────────────────────────────────────────────────
-- Un son. Efecto, ambiente ou música. Propio ou externo.
create table if not exists public.son_recursos (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null default 'efecto',
  nome         text not null,
  descricion   text,

  -- Orixe. 'propio' = ficheiro en Storage. 'externo' = referencia.
  -- 'dispositivo' = o ficheiro vive no aparello do usuario (IndexedDB):
  -- custo cero, licenza cero, e funciona sen rede. É o caso máis barato
  -- e por iso ten que estar contemplado desde o primeiro día.
  orixe        text not null default 'propio',
  provedor     text,
  url          text,
  ruta         text,
  duracion_ms  int,

  -- Comportamento por defecto. A mesa pode sobrescribilo en `opcions`.
  modo         text not null default 'once',
  vol_defecto  numeric not null default 0.8,
  emoji        text,
  cor          text,

  -- ⚠️ En canto haxa subidas de terceiros, `licenza` deixa de ser
  -- opcional. Non se pode saber despois de onde saíu un ficheiro.
  licenza      text,
  autoria      text,
  fonte        text,

  visibilidade text not null default 'privado',
  estado       text not null default 'borrador',
  grupo_id     uuid,
  gardados     int not null default 0,

  user_id      uuid references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- B37: declarar todas, por se a táboa xa existía dunha proba anterior.
alter table public.son_recursos add column if not exists tipo         text default 'efecto';
alter table public.son_recursos add column if not exists nome         text;
alter table public.son_recursos add column if not exists descricion   text;
alter table public.son_recursos add column if not exists orixe        text default 'propio';
alter table public.son_recursos add column if not exists provedor     text;
alter table public.son_recursos add column if not exists url          text;
alter table public.son_recursos add column if not exists ruta         text;
alter table public.son_recursos add column if not exists duracion_ms  int;
alter table public.son_recursos add column if not exists modo         text default 'once';
alter table public.son_recursos add column if not exists vol_defecto  numeric default 0.8;
alter table public.son_recursos add column if not exists emoji        text;
alter table public.son_recursos add column if not exists cor          text;
alter table public.son_recursos add column if not exists licenza      text;
alter table public.son_recursos add column if not exists autoria      text;
alter table public.son_recursos add column if not exists fonte        text;
alter table public.son_recursos add column if not exists visibilidade text default 'privado';
alter table public.son_recursos add column if not exists estado       text default 'borrador';
alter table public.son_recursos add column if not exists grupo_id     uuid;
alter table public.son_recursos add column if not exists gardados     int default 0;
alter table public.son_recursos add column if not exists user_id      uuid;
alter table public.son_recursos add column if not exists created_at   timestamptz default now();
alter table public.son_recursos add column if not exists updated_at   timestamptz default now();

do $$ begin
  alter table public.son_recursos add constraint son_recursos_tipo_chk
    check (tipo in ('efecto','ambiente','musica'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.son_recursos add constraint son_recursos_orixe_chk
    check (orixe in ('propio','externo','dispositivo'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.son_recursos add constraint son_recursos_modo_chk
    check (modo in ('once','toggle','loop','hold'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.son_recursos add constraint son_recursos_vis_chk
    check (visibilidade in ('privado','ligazon','publico','grupo'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.son_recursos add constraint son_recursos_estado_chk
    check (estado in ('borrador','pendente','publicada','oculta'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.son_recursos add constraint son_recursos_vol_chk
    check (vol_defecto >= 0 and vol_defecto <= 1);
exception when duplicate_object then null; end $$;
-- Un recurso externo sen URL non se pode reproducir: mellor rexeitalo
-- ao gardar que descubrilo no medio dun show.
do $$ begin
  alter table public.son_recursos add constraint son_recursos_url_chk
    check (orixe <> 'externo' or url is not null);
exception when duplicate_object then null; end $$;

create index if not exists son_recursos_user_idx   on public.son_recursos(user_id);
create index if not exists son_recursos_tipo_idx   on public.son_recursos(tipo);
create index if not exists son_recursos_publi_idx  on public.son_recursos(estado, visibilidade);


-- ─── 3. RECURSO ↔ ETIQUETA ─────────────────────────────────────────
create table if not exists public.son_recursos_tags (
  recurso_id uuid not null references public.son_recursos(id) on delete cascade,
  tag_id     text not null references public.son_tags(id) on delete cascade,
  primary key (recurso_id, tag_id)
);
create index if not exists son_rt_tag_idx on public.son_recursos_tags(tag_id);


-- ─── 4. COLECCIÓNS ─────────────────────────────────────────────────
-- playlist · escena · mesa · pack. Mesma estrutura, distinto tipo.
-- `config` leva o que é propio de cada tipo: a reixa e os contadores
-- dunha mesa, os volumes dunha escena. Non merece columnas propias.
create table if not exists public.son_coleccions (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null default 'playlist',
  nome         text not null,
  descricion   text,
  config       jsonb not null default '{}'::jsonb,
  emoji        text,
  cor          text,
  visibilidade text not null default 'privado',
  estado       text not null default 'borrador',
  grupo_id     uuid,
  gardados     int not null default 0,
  orixe_id     uuid,
  user_id      uuid references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.son_coleccions add column if not exists tipo         text default 'playlist';
alter table public.son_coleccions add column if not exists nome         text;
alter table public.son_coleccions add column if not exists descricion   text;
alter table public.son_coleccions add column if not exists config       jsonb default '{}'::jsonb;
alter table public.son_coleccions add column if not exists emoji        text;
alter table public.son_coleccions add column if not exists cor          text;
alter table public.son_coleccions add column if not exists visibilidade text default 'privado';
alter table public.son_coleccions add column if not exists estado       text default 'borrador';
alter table public.son_coleccions add column if not exists grupo_id     uuid;
alter table public.son_coleccions add column if not exists gardados     int default 0;
alter table public.son_coleccions add column if not exists orixe_id     uuid;
alter table public.son_coleccions add column if not exists user_id      uuid;
alter table public.son_coleccions add column if not exists created_at   timestamptz default now();
alter table public.son_coleccions add column if not exists updated_at   timestamptz default now();

do $$ begin
  alter table public.son_coleccions add constraint son_col_tipo_chk
    check (tipo in ('playlist','escena','mesa','pack'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.son_coleccions add constraint son_col_vis_chk
    check (visibilidade in ('privado','ligazon','publico','grupo'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.son_coleccions add constraint son_col_estado_chk
    check (estado in ('borrador','pendente','publicada','oculta'));
exception when duplicate_object then null; end $$;

create index if not exists son_col_user_idx  on public.son_coleccions(user_id);
create index if not exists son_col_tipo_idx  on public.son_coleccions(tipo);
create index if not exists son_col_publi_idx on public.son_coleccions(estado, visibilidade);


-- ─── 5. ELEMENTOS DUNHA COLECCIÓN ──────────────────────────────────
-- Un elemento apunta a un recurso OU a outra colección (un pack contén
-- escenas; unha escena pode traer unha playlist), nunca aos dous.
create table if not exists public.son_coleccion_items (
  id           uuid primary key default gen_random_uuid(),
  coleccion_id uuid not null references public.son_coleccions(id) on delete cascade,
  orde         int not null default 0,
  recurso_id   uuid references public.son_recursos(id) on delete cascade,
  fillo_id     uuid references public.son_coleccions(id) on delete cascade,
  -- Sobrescrituras deste elemento AQUÍ: volume nesta escena, tamaño e
  -- posición nesta mesa. O recurso non se modifica.
  opcions      jsonb not null default '{}'::jsonb
);

alter table public.son_coleccion_items add column if not exists orde       int default 0;
alter table public.son_coleccion_items add column if not exists recurso_id uuid;
alter table public.son_coleccion_items add column if not exists fillo_id   uuid;
alter table public.son_coleccion_items add column if not exists opcions    jsonb default '{}'::jsonb;

do $$ begin
  alter table public.son_coleccion_items add constraint son_item_destino_chk
    check ((recurso_id is not null and fillo_id is null)
        or (recurso_id is null and fillo_id is not null));
exception when duplicate_object then null; end $$;
-- Unha colección non se pode conter a si mesma.
do $$ begin
  alter table public.son_coleccion_items add constraint son_item_nonself_chk
    check (fillo_id is null or fillo_id <> coleccion_id);
exception when duplicate_object then null; end $$;

create index if not exists son_item_col_idx on public.son_coleccion_items(coleccion_id, orde);


-- ─── 6. GARDADOS ───────────────────────────────────────────────────
create table if not exists public.son_gardados (
  user_id      uuid not null references auth.users(id) on delete cascade,
  recurso_id   uuid references public.son_recursos(id) on delete cascade,
  coleccion_id uuid references public.son_coleccions(id) on delete cascade,
  created_at   timestamptz not null default now()
);
do $$ begin
  alter table public.son_gardados add constraint son_gardados_destino_chk
    check ((recurso_id is not null and coleccion_id is null)
        or (recurso_id is null and coleccion_id is not null));
exception when duplicate_object then null; end $$;
create unique index if not exists son_gardados_rec_uq
  on public.son_gardados(user_id, recurso_id) where recurso_id is not null;
create unique index if not exists son_gardados_col_uq
  on public.son_gardados(user_id, coleccion_id) where coleccion_id is not null;


-- ─── 7. DENUNCIAS ──────────────────────────────────────────────────
-- Mínimo viable. O que non se pode facer despois é engadir o campo
-- cando xa hai contido publicado sen el.
create table if not exists public.son_denuncias (
  id           uuid primary key default gen_random_uuid(),
  recurso_id   uuid references public.son_recursos(id) on delete cascade,
  coleccion_id uuid references public.son_coleccions(id) on delete cascade,
  motivo       text not null default 'outro',
  detalle      text,
  estado       text not null default 'aberta',
  user_id      uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
do $$ begin
  alter table public.son_denuncias add constraint son_den_estado_chk
    check (estado in ('aberta','revisada','desestimada'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.son_denuncias add constraint son_den_motivo_chk
    check (motivo in ('dereitos','contido','roto','duplicado','outro'));
exception when duplicate_object then null; end $$;


-- ═══════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════
alter table public.son_tags             enable row level security;
alter table public.son_recursos         enable row level security;
alter table public.son_recursos_tags    enable row level security;
alter table public.son_coleccions       enable row level security;
alter table public.son_coleccion_items  enable row level security;
alter table public.son_gardados         enable row level security;
alter table public.son_denuncias        enable row level security;

-- Visible para quen non ten conta: publicada, ou accesible por ligazón.
-- (§11: usar Sonido sen rexistrarse ten que ser posible.)
create or replace function public.son_visible(vis text, est text, dono uuid)
returns boolean language sql stable as $$
  select (est = 'publicada' and vis in ('publico','ligazon'))
      or (dono is not null and dono = auth.uid())
      or public.is_admin();
$$;

drop policy if exists son_tags_ler on public.son_tags;
create policy son_tags_ler on public.son_tags for select using (true);
drop policy if exists son_tags_admin on public.son_tags;
create policy son_tags_admin on public.son_tags for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists son_rec_ler on public.son_recursos;
create policy son_rec_ler on public.son_recursos for select
  using (public.son_visible(visibilidade, estado, user_id));
drop policy if exists son_rec_crear on public.son_recursos;
create policy son_rec_crear on public.son_recursos for insert
  with check (auth.uid() is not null and user_id = auth.uid());
drop policy if exists son_rec_editar on public.son_recursos;
create policy son_rec_editar on public.son_recursos for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists son_rec_borrar on public.son_recursos;
create policy son_rec_borrar on public.son_recursos for delete
  using (user_id = auth.uid() or public.is_admin());

-- As etiquetas dun recurso vense se se ve o recurso.
drop policy if exists son_rt_ler on public.son_recursos_tags;
create policy son_rt_ler on public.son_recursos_tags for select using (
  exists (select 1 from public.son_recursos r where r.id = recurso_id
          and public.son_visible(r.visibilidade, r.estado, r.user_id)));
drop policy if exists son_rt_escribir on public.son_recursos_tags;
create policy son_rt_escribir on public.son_recursos_tags for all using (
  exists (select 1 from public.son_recursos r where r.id = recurso_id
          and (r.user_id = auth.uid() or public.is_admin())))
  with check (
  exists (select 1 from public.son_recursos r where r.id = recurso_id
          and (r.user_id = auth.uid() or public.is_admin())));

drop policy if exists son_col_ler on public.son_coleccions;
create policy son_col_ler on public.son_coleccions for select
  using (public.son_visible(visibilidade, estado, user_id));
drop policy if exists son_col_crear on public.son_coleccions;
create policy son_col_crear on public.son_coleccions for insert
  with check (auth.uid() is not null and user_id = auth.uid());
drop policy if exists son_col_editar on public.son_coleccions;
create policy son_col_editar on public.son_coleccions for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists son_col_borrar on public.son_coleccions;
create policy son_col_borrar on public.son_coleccions for delete
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists son_item_ler on public.son_coleccion_items;
create policy son_item_ler on public.son_coleccion_items for select using (
  exists (select 1 from public.son_coleccions c where c.id = coleccion_id
          and public.son_visible(c.visibilidade, c.estado, c.user_id)));
drop policy if exists son_item_escribir on public.son_coleccion_items;
create policy son_item_escribir on public.son_coleccion_items for all using (
  exists (select 1 from public.son_coleccions c where c.id = coleccion_id
          and (c.user_id = auth.uid() or public.is_admin())))
  with check (
  exists (select 1 from public.son_coleccions c where c.id = coleccion_id
          and (c.user_id = auth.uid() or public.is_admin())));

-- Cada quen ve só os seus gardados.
drop policy if exists son_gard_meus on public.son_gardados;
create policy son_gard_meus on public.son_gardados for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Denunciar pode calquera, incluso sen conta. Lelas, só admin:
-- é o mesmo criterio que xa aplicamos ás propostas do público (S01).
drop policy if exists son_den_crear on public.son_denuncias;
create policy son_den_crear on public.son_denuncias for insert with check (true);
drop policy if exists son_den_ler on public.son_denuncias;
create policy son_den_ler on public.son_denuncias for select using (public.is_admin());
drop policy if exists son_den_xestionar on public.son_denuncias;
create policy son_den_xestionar on public.son_denuncias for update
  using (public.is_admin()) with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════
-- ⚠️ GRANT — sen isto, «permission denied» coa RLS perfecta (B30)
-- ═══════════════════════════════════════════════════════════════════
grant usage on schema public to anon, authenticated;

grant select on public.son_tags to anon, authenticated;
grant select on public.son_recursos, public.son_recursos_tags,
                public.son_coleccions, public.son_coleccion_items to anon, authenticated;
grant insert on public.son_denuncias to anon, authenticated;

grant select, insert, update, delete on
  public.son_recursos, public.son_recursos_tags,
  public.son_coleccions, public.son_coleccion_items,
  public.son_gardados to authenticated;
grant update on public.son_denuncias to authenticated;
grant select, insert, update, delete on public.son_tags to authenticated;
grant select on public.son_denuncias to authenticated;

grant execute on function public.son_visible(text, text, uuid) to anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════
-- COMPROBACIÓN
-- ═══════════════════════════════════════════════════════════════════
-- Debe devolver 7 filas, todas con rls=true e con permisos para anon.
select c.relname                                as taboa,
       c.relrowsecurity                         as rls,
       (select count(*) from pg_policies p
         where p.tablename = c.relname)         as politicas,
       has_table_privilege('anon', c.oid, 'SELECT') as anon_le
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname like 'son\_%'
order by c.relname;
