-- ═══════════════════════════════════════════════════════════════════
-- supabase_eventos_moderacion.sql
--
-- A axenda pasa a ter tres niveis de acceso:
--   · sen conta          → só ver os eventos publicados
--   · con conta          → suxerir eventos, que quedan PENDENTES
--   · admin              → publicar directo e moderar
--
-- Executar no SQL Editor. Idempotente.
-- Requisito previo: supabase_eventos.sql
-- ═══════════════════════════════════════════════════════════════════


-- ── 1. Estado novo: pendente ───────────────────────────────────────
alter table public.eventos drop constraint if exists eventos_estado_ok;
alter table public.eventos add constraint eventos_estado_ok
  check (estado in ('pendente','publicado','borrador','cancelado','rexeitado'));

-- Campos de moderación, como en universo
alter table public.eventos
  add column if not exists revisado_por  uuid references auth.users(id) on delete set null,
  add column if not exists revisado_en   timestamptz,
  add column if not exists nota_revision text default '';

create index if not exists eventos_estado_idx on public.eventos(estado);


-- ── 2. RLS ─────────────────────────────────────────────────────────

-- LER: os publicados vainos todo o mundo, tamén sen conta. A autora ve os
-- seus mentres agardan revisión. O admin ve todo.
drop policy if exists eventos_select on public.eventos;
create policy eventos_select on public.eventos for select
  using (
    estado = 'publicado'
    or (user_id is not null and user_id = auth.uid())
    or public.is_admin()
  );

-- CREAR: precisa conta. E aquí está o cambio importante: quen non é admin
-- só pode crear en estado 'pendente'. Antes podía publicar directo.
drop policy if exists eventos_insert on public.eventos;
create policy eventos_insert on public.eventos for insert
  with check (
    public.is_admin()
    or (auth.uid() is not null and user_id = auth.uid() and estado = 'pendente')
  );

-- EDITAR: o admin todo. A autora, o seu, e só mentres siga pendente: unha
-- vez publicado xa non pode cambialo pola súa conta.
drop policy if exists eventos_update on public.eventos;
create policy eventos_update on public.eventos for update
  using (public.is_admin() or (user_id = auth.uid() and estado = 'pendente'))
  with check (public.is_admin() or (user_id = auth.uid() and estado = 'pendente'));

drop policy if exists eventos_delete on public.eventos;
create policy eventos_delete on public.eventos for delete
  using (public.is_admin() or (user_id = auth.uid() and estado = 'pendente'));


-- ── 3. Límite antispam para as suxestións ──────────────────────────
-- Reutiliza a táboa de xanelas de Universo. Aplícase por usuario, non por
-- IP: aquí sempre hai conta, así que se pode identificar a persoa.
create or replace function public.eventos_limite()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_n integer; LIMITE constant integer := 15;
begin
  if new.estado <> 'pendente' or new.user_id is null then return new; end if;
  insert into public.universo_rate (ip, xanela, n)
    values ('ev:' || new.user_id::text, date_trunc('day', now()), 1)
    on conflict (ip, xanela) do update set n = public.universo_rate.n + 1
    returning n into v_n;
  if v_n > LIMITE then
    raise exception 'Xa enviaches moitas suxestións hoxe. Téntao mañá.'
      using errcode = 'check_violation';
  end if;
  return new;
end; $$;

drop trigger if exists eventos_limite_trg on public.eventos;
create trigger eventos_limite_trg before insert on public.eventos
  for each row execute function public.eventos_limite();


-- ── 4. GRANTs ──────────────────────────────────────────────────────
-- ⚠️ anon precisa SELECT para poder ver o calendario sen conta.
grant select on public.eventos to anon, authenticated;
grant insert, update, delete on public.eventos to authenticated;


-- ═══ COMPROBACIÓN ══════════════════════════════════════════════════
-- select estado, count(*) from public.eventos group by estado;
-- select policyname, cmd, qual, with_check from pg_policies where tablename='eventos';
