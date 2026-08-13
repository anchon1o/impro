-- ═══════════════════════════════════════════════════════════════════
-- supabase_reportes.sql — Rexistro de fallos e propostas (🐛)
--
-- Calquera pode reportar, tamén sen conta. Só o admin ve a lista.
-- Executar no SQL Editor. Idempotente.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.reportes (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null default 'bug',      -- bug | mellora | dúbida
  titulo      text not null,
  detalle     text default '',
  -- Contexto capturado automaticamente: aforra ter que preguntar
  onde        text default '',                  -- pestana onde estaba
  navegador   text default '',
  pantalla    text default '',
  tema        text default '',
  version     text default '',
  user_id     uuid references auth.users(id) on delete set null,
  contacto    text default '',                  -- correo opcional se non hai conta
  estado      text not null default 'aberto',   -- aberto | en_curso | resolto | descartado
  prioridade  text default 'p2',                -- p0 | p1 | p2 | p3
  nota_admin  text default '',
  created_at  timestamptz default now(),
  actualizado timestamptz default now()
);

do $$ begin
  alter table public.reportes add constraint reportes_tipo_ok
    check (tipo in ('bug','mellora','dúbida'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.reportes add constraint reportes_estado_ok
    check (estado in ('aberto','en_curso','resolto','descartado'));
exception when duplicate_object then null; end $$;

create index if not exists reportes_estado_idx on public.reportes(estado);
create index if not exists reportes_created_idx on public.reportes(created_at desc);

create or replace function public.reportes_touch()
returns trigger language plpgsql as $$
begin new.actualizado = now(); return new; end; $$;

drop trigger if exists reportes_touch_trg on public.reportes;
create trigger reportes_touch_trg before update on public.reportes
  for each row execute function public.reportes_touch();


-- ── Límite antispam ────────────────────────────────────────────────
-- Reutiliza a mesma táboa de xanelas que Universo. Mesma limitación
-- xa advertida: x-forwarded-for é falsificable e detrás dun NAT moita
-- xente comparte IP. Frea un bot torpe, non a alguén decidido.
create table if not exists public.universo_rate (
  ip text not null, xanela timestamptz not null, n integer not null default 0,
  primary key (ip, xanela)
);

create or replace function public.reportes_limite()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_ip text; v_n integer; LIMITE constant integer := 10;
begin
  if new.user_id is not null then return new; end if;
  begin
    v_ip := split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for','descoñecida'), ',', 1);
  exception when others then v_ip := 'descoñecida'; end;
  insert into public.universo_rate (ip, xanela, n) values (v_ip || ':rep', date_trunc('hour', now()), 1)
    on conflict (ip, xanela) do update set n = public.universo_rate.n + 1
    returning n into v_n;
  if v_n > LIMITE then
    raise exception 'Demasiados envíos desde esta conexión. Téntao dentro dunha hora.'
      using errcode = 'check_violation';
  end if;
  return new;
end; $$;

drop trigger if exists reportes_limite_trg on public.reportes;
create trigger reportes_limite_trg before insert on public.reportes
  for each row execute function public.reportes_limite();


-- ── RLS ────────────────────────────────────────────────────────────
alter table public.reportes enable row level security;

-- Escribir: calquera, tamén sen conta. Sempre en estado 'aberto': ninguén
-- pode dar por resolto o seu propio reporte.
drop policy if exists reportes_insert on public.reportes;
create policy reportes_insert on public.reportes for insert
  with check (
    estado = 'aberto'
    and (user_id is null or user_id = auth.uid())
  );

-- Ler: o admin todo; a autora, os seus.
drop policy if exists reportes_select on public.reportes;
create policy reportes_select on public.reportes for select
  using (public.is_admin() or (user_id is not null and user_id = auth.uid()));

-- Moderar: só admin.
drop policy if exists reportes_update on public.reportes;
create policy reportes_update on public.reportes for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists reportes_delete on public.reportes;
create policy reportes_delete on public.reportes for delete
  using (public.is_admin());


-- ── GRANTs ─────────────────────────────────────────────────────────
-- ⚠️ Sen isto, Postgres devolve «permission denied» antes de mirar a RLS.
-- Foi exactamente o que rompeu Admin → Categorías.
grant insert on public.reportes to anon, authenticated;
grant select on public.reportes to anon, authenticated;
grant update, delete on public.reportes to authenticated;


-- ═══ COMPROBACIÓN ══════════════════════════════════════════════════
-- select count(*) from public.reportes;
-- select table_name, grantee, string_agg(privilege_type,', ') from information_schema.role_table_grants
--   where table_name='reportes' and grantee in ('anon','authenticated') group by 1,2;
