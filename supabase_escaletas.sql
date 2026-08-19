-- ═══════════════════════════════════════════════════════════════════
-- ESCALETAS
-- ═══════════════════════════════════════════════════════════════════
-- Unha escaleta É unha sesión. Non son dúas cousas: unha sesión con
-- bloques é exactamente unha escaleta, e chamarlles distinto foi o que
-- fixo que houbese dúas editables en dous sitios (Sesións e En directo)
-- que podían discrepar.
--
-- Edítase SÓ aquí. Son e En directo impórtana en modo lectura.
--
-- ⚠️ A táboa `sesiones` que xa existía é un rexistro de uso —  faise
-- `insert` e límite 30—  non contido editable. Non se toca: son cousas
-- distintas e mesturalas obrigaría a migrar historial.
--
-- ⚠️ Os bloques van en JSONB e non en táboas fillas a propósito. Unha
-- escaleta lese e escríbese SEMPRE enteira: non hai consultas do tipo
-- «dáme os bloques de tipo quecemento de todas as escaletas». Con
-- táboas fillas habería que reconciliar altas, baixas e reordenacións
-- en cada gardado, que é onde aparecen os ocos.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.escaletas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  -- Data, lugar, nome do espectáculo. Texto libre a propósito: cada
  -- quen apunta o que lle fai falta e non hai que adiviñar campos.
  notas       text,
  tipo        text not null default 'ensaio',
  bloques     jsonb not null default '[]'::jsonb,
  -- Duración total en minutos. Calcúlase no cliente e gárdase para
  -- poder ordenar e amosar a lista sen abrir cada escaleta.
  minutos     int not null default 0,
  grupo_id    uuid,
  user_id     uuid references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ⚠️ Todas as columnas, por se a táboa xa existise dunha proba anterior
-- cun esquema máis curto. É o que causou B37.
alter table public.escaletas add column if not exists nome       text;
alter table public.escaletas add column if not exists notas      text;
alter table public.escaletas add column if not exists tipo       text default 'ensaio';
alter table public.escaletas add column if not exists bloques    jsonb default '[]'::jsonb;
alter table public.escaletas add column if not exists minutos    int default 0;
alter table public.escaletas add column if not exists grupo_id   uuid;
alter table public.escaletas add column if not exists user_id    uuid;
alter table public.escaletas add column if not exists created_at timestamptz default now();
alter table public.escaletas add column if not exists updated_at timestamptz default now();

do $$ begin
  alter table public.escaletas add constraint escaletas_tipo_chk
    check (tipo in ('ensaio', 'espectaculo', 'clase', 'obradoiro'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.escaletas add constraint escaletas_minutos_chk
    check (minutos >= 0);
exception when duplicate_object then null; end $$;

-- `bloques` ten que ser unha lista, non un obxecto: se chega un `{}`
-- por erro, o cliente iteraría sobre nada e a escaleta abriría baleira
-- sen dicir por que.
do $$ begin
  alter table public.escaletas add constraint escaletas_bloques_chk
    check (jsonb_typeof(bloques) = 'array');
exception when duplicate_object then null; end $$;

create index if not exists escaletas_user_idx on public.escaletas(user_id, updated_at desc);

-- ═══════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════
alter table public.escaletas enable row level security;

-- Privadas por defecto: unha escaleta leva onde e cando actúas.
drop policy if exists escaletas_so_o_dono on public.escaletas;
create policy escaletas_so_o_dono on public.escaletas
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ⚠️ RLS ≠ GRANT: Postgres comproba o permiso ANTES da política.
-- Sen isto dá «permission denied» coa política impecable (B30).
revoke all on public.escaletas from anon;
grant select, insert, update, delete on public.escaletas to authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- COMPROBACIÓN · debe dar unha fila con rls=true, 1 política, anon=false
-- ═══════════════════════════════════════════════════════════════════
select c.relname                              as taboa,
       c.relrowsecurity                       as rls,
       (select count(*) from pg_policies p
         where p.tablename = 'escaletas')     as politicas,
       has_table_privilege('anon', c.oid, 'SELECT')          as anon_le,
       has_table_privilege('authenticated', c.oid, 'SELECT') as auth_le
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'escaletas';
