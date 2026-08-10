-- ============================================================
-- IMPROAPP — TÁBOA UNIVERSO IMPRO
-- Permite que os usuarios engadan entradas reais (compañías,
-- festivais, escolas, persoas, proxectos) con verificación do admin.
-- ============================================================

create table if not exists universo (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null,              -- compañía | festival | escola | persoa | proxecto
  nome        text not null,
  pais        text default '🌍',
  cidade      text,
  descricion  text not null,
  web         text default '',
  tags        jsonb default '[]',
  logo        text default '🎭',
  verificado  boolean not null default false,  -- true = revisado polo admin
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

create index if not exists universo_tipo_idx on universo(tipo) where verificado;

-- RLS: lectura pública de todo o verificado + o propio sen verificar
alter table universo enable row level security;

drop policy if exists universo_select on universo;
create policy universo_select on universo for select
  using (verificado = true or user_id = auth.uid() or public.is_admin());

drop policy if exists universo_insert on universo;
create policy universo_insert on universo for insert
  with check (user_id = auth.uid());

drop policy if exists universo_update on universo;
create policy universo_update on universo for update
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists universo_delete on universo;
create policy universo_delete on universo for delete
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================
-- FIN — despois execútase un INSERT único coas 26 entradas
-- verificadas que xa trae a app (ver universo_seed.sql)
-- ============================================================
