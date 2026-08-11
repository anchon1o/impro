-- ═══════════════════════════════════════════════════════════════════
-- supabase_salas_fix.sql — IM-M05
-- Corrixe: fuga de propostas, colisión de códigos, salas eternas.
--
-- Executar no SQL Editor de Supabase. É idempotente: pódese repetir.
-- ═══════════════════════════════════════════════════════════════════


-- ── 1. Caducidade de salas ─────────────────────────────────────────
-- Antes: unha sala quedaba open=true para sempre se o facilitador
-- pechaba o navegador sen premer "Cerrar sala".

alter table public.salas
  add column if not exists expira_en timestamptz;

-- Ás salas xa existentes dámoslles 12h desde agora, non desde a súa
-- creación, para non pechar de golpe unha que estea en uso nun show.
update public.salas
   set expira_en = now() + interval '12 hours'
 where expira_en is null;

alter table public.salas
  alter column expira_en set default (now() + interval '12 hours');

alter table public.salas
  alter column expira_en set not null;


-- ── 2. Códigos únicos entre salas vivas ────────────────────────────
-- Antes: xerábase un código de 4 caracteres sen comprobar se xa
-- existía, e as salas non se borraban nunca. Ao acumularse filas, un
-- código repetido facía que `.single()` fallase e o público vise
-- "Sala no encontrada" sen motivo aparente.
--
-- Índice PARCIAL: só obriga a unicidade entre salas vivas. As pechadas
-- conservan o seu código para o historial.

create unique index if not exists salas_code_viva_uniq
  on public.salas (code)
  where open = true;

create index if not exists propostas_sala_code_idx
  on public.propostas (sala_code);


-- ── 3. Pechar salas caducadas ──────────────────────────────────────
-- Sen pg_cron, chámase baixo demanda. A app invócaa ao abrir a pestana
-- QR, así que na práctica límpase soa.

create or replace function public.pechar_salas_caducadas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.salas
     set open = false
   where open = true
     and expira_en <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on function public.pechar_salas_caducadas() to anon, authenticated;


-- ── 4. RLS de propostas ────────────────────────────────────────────
-- ⚠️ ESTE É O ARRANXO IMPORTANTE.
--
-- Antes:
--   propostas_select  qual       = true
--   propostas_insert  with_check = true
--
-- É dicir: sen ningunha restrición. O código da app filtraba por
-- sala_code, pero a base de datos non. Calquera con a anon key (que é
-- pública: vai no bundle que serve Vercel) podía ler TODAS as propostas
-- de TODOS os shows, e escribir en calquera sala.
--
-- Dado que as preguntas do público son do tipo "dime un segredo
-- inconfesable", iso é contido sensible.

drop policy if exists propostas_select on public.propostas;
drop policy if exists propostas_insert on public.propostas;

-- LER: só o facilitador propietario da sala.
-- O público non necesita ler: `enviarProposta` só insire.
create policy propostas_select on public.propostas
  for select
  using (
    exists (
      select 1 from public.salas s
       where s.code = propostas.sala_code
         and s.user_id = auth.uid()
    )
  );

-- ESCRIBIR: calquera (tamén sen conta), pero só en salas que existan,
-- estean abertas e non caducadas. Antes podíase inserter nunha sala
-- inventada ou pechada.
create policy propostas_insert on public.propostas
  for insert
  with check (
    exists (
      select 1 from public.salas s
       where s.code = propostas.sala_code
         and s.open = true
         and s.expira_en > now()
    )
  );

-- BORRAR: só o propietario da sala (para moderar propostas ofensivas).
drop policy if exists propostas_delete on public.propostas;
create policy propostas_delete on public.propostas
  for delete
  using (
    exists (
      select 1 from public.salas s
       where s.code = propostas.sala_code
         and s.user_id = auth.uid()
    )
  );


-- ── 5. RLS de salas ────────────────────────────────────────────────
-- Antes: salas_select qual = true. Calquera podía listar todas as
-- salas de todos os facilitadores coa súa configuración de preguntas.
--
-- Agora só son visibles as propias e as que están vivas neste momento.
-- O público necesita ler a sala pola que lle dan o código, e iso segue
-- funcionando mentres a sala estea aberta.
--
-- NOTA: isto non fai o código secreto. Alguén con a anon key aínda pode
-- listar as salas ABERTAS agora mesmo e ver os seus códigos. Pechalo do
-- todo esixiría unha función RPC que reciba o código e devolva só esa
-- fila. Se che parece necesario, dígoo e faise: son ~20 liñas máis.
-- O contido sensible (as propostas) xa queda protexido polo punto 4.

drop policy if exists salas_select on public.salas;
create policy salas_select on public.salas
  for select
  using (
    user_id = auth.uid()
    or (open = true and expira_en > now())
  );

-- `salas_write` (ALL, with_check user_id = auth.uid()) queda como está:
-- xa impide que ninguén peche nin edite a sala doutro.


-- ── Comprobación ───────────────────────────────────────────────────
-- Executa isto despois para verificar que quedou todo aplicado:
--
--   select tablename, policyname, cmd, qual, with_check
--     from pg_policies
--    where tablename in ('salas','propostas')
--    order by tablename, policyname;
--
--   select public.pechar_salas_caducadas();
