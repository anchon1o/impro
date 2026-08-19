-- ═══════════════════════════════════════════════════════════════════
-- PECHE DE `playlists` E `efectos`
-- ═══════════════════════════════════════════════════════════════════
-- Estas dúas táboas quedaron da Cabina. O código xa non as toca: En
-- directo usa efectos sintetizados e a música vive en Sonido
-- (`son_recursos`, `son_coleccions`).
--
-- ⚠️ POR QUE FACÍA FALTA ISTO
-- `getPlaylists()` facía `.select('*')` SEN filtrar por usuario, e se a
-- táboa estaba baleira inseríalle os valores por defecto —  sen
-- `user_id`—  a todo o mundo. Bastaba con abrir «En directo» unha vez.
-- Se a RLS destas táboas non filtraba, cada quen vía as dos demais.
--
-- Executar por PARTES e ler o resultado de cada unha antes de seguir.
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- PARTE 1 · DIAGNÓSTICO. Non modifica nada. Executa e le.
-- ───────────────────────────────────────────────────────────────────

-- 1.1 · Existen? Teñen RLS? Cantas políticas?
select c.relname                                          as taboa,
       c.relrowsecurity                                   as rls_activa,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as politicas,
       has_table_privilege('anon',          c.oid, 'SELECT') as anon_le,
       has_table_privilege('authenticated', c.oid, 'SELECT') as auth_le,
       has_table_privilege('authenticated', c.oid, 'INSERT') as auth_escribe
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('playlists', 'efectos');

-- 1.2 · Que políticas hai exactamente.
--       Se `qual` NON menciona `user_id`, a fuga está confirmada.
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('playlists', 'efectos')
order by tablename, policyname;

-- 1.3 · Cantas filas hai e cantas quedaron sen dono.
--       As de `user_id is null` son as que inseriu o código automático.
select 'playlists' as taboa, count(*) as filas,
       count(*) filter (where user_id is null) as sen_dono,
       count(distinct user_id)                 as usuarios
from public.playlists
union all
select 'efectos', count(*),
       count(*) filter (where user_id is null),
       count(distinct user_id)
from public.efectos;


-- ───────────────────────────────────────────────────────────────────
-- PARTE 2 · PECHE. Executar despois de ler a Parte 1.
-- ───────────────────────────────────────────────────────────────────
-- Non se borran as táboas: se algunha vez houbo algo teu dentro,
-- borralo non ten volta. O que se fai é deixalas SÓ para o seu dono.

alter table if exists public.playlists enable row level security;
alter table if exists public.efectos   enable row level security;

do $$
declare t text; p record;
begin
  foreach t in array array['playlists','efectos'] loop
    if to_regclass('public.' || t) is null then continue; end if;

    -- Fóra todas as políticas vellas: unha soa permisiva que quedase
    -- bastaría para manter a fuga aberta.
    for p in select policyname from pg_policies
             where schemaname = 'public' and tablename = t loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;

    -- Cada quen, e só cada quen, coas súas.
    execute format($f$
      create policy %I on public.%I
        for all to authenticated
        using (user_id = auth.uid())
        with check (user_id = auth.uid())
    $f$, t || '_so_o_dono', t);
  end loop;
end $$;

-- ⚠️ RLS ≠ GRANT: Postgres comproba o permiso de táboa ANTES da
-- política. Retíranselle a `anon`, que xa non ten nada que facer aquí.
--
-- ⚠️ Vai dentro dun bloque con `to_regclass`: un `revoke` sobre unha
-- táboa que non existe aborta o script enteiro, e daquela as políticas
-- de arriba quedarían aplicadas e os permisos non. A metade dun peche
-- de seguridade é peor que ningún, porque parece feito.
do $$
declare t text;
begin
  foreach t in array array['playlists','efectos'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;


-- ───────────────────────────────────────────────────────────────────
-- PARTE 3 · COMPROBACIÓN
-- ───────────────────────────────────────────────────────────────────
-- Debe dar dúas filas, con rls_activa = true, unha política cada unha
-- e anon_le = false.
select c.relname as taboa,
       c.relrowsecurity as rls_activa,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as politicas,
       has_table_privilege('anon', c.oid, 'SELECT') as anon_le
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('playlists', 'efectos');


-- ───────────────────────────────────────────────────────────────────
-- PARTE 4 · LIMPEZA. OPCIONAL, e só se a Parte 1.3 dixo que as filas
-- sen dono son as inseridas automaticamente (URLs baleiras).
-- ───────────────────────────────────────────────────────────────────
-- Mira primeiro que son:
--
--   select * from public.playlists where user_id is null limit 20;
--   select * from public.efectos   where user_id is null limit 20;
--
-- E só entón, se son lixo:
--
--   delete from public.playlists where user_id is null;
--   delete from public.efectos   where user_id is null;
