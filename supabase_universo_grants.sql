-- ═══════════════════════════════════════════════════════════════════
-- supabase_universo_grants.sql — ARRANXO
--
-- Síntoma: en Admin, «Categorías» aparece baleiro e «Táboa» non carga.
--
-- Causa: RLS e GRANT son dúas capas distintas.
--   · GRANT decide se un rol pode TOCAR a táboa.
--   · RLS decide QUE FILAS ve dentro dela.
-- En supabase_universo_modelo.sql creei as táboas e as políticas RLS,
-- pero nunca lles dei GRANT aos roles `anon` e `authenticated`. Postgres
-- respondía «permission denied for table universo_categorias» antes
-- sequera de mirar a política.
--
-- Executar no SQL Editor. Idempotente.
-- ═══════════════════════════════════════════════════════════════════

-- Categorías: lectura para todos (tamén sen conta, porque a pestana
-- Universo funciona sen iniciar sesión). Escritura: contrólaa a política
-- `universo_categorias_write`, que xa esixe is_admin().
grant select on public.universo_categorias to anon, authenticated;
grant insert, update, delete on public.universo_categorias to authenticated;

-- Universo: por se a táboa se creou sen herdar privilexios.
grant select on public.universo to anon, authenticated;
grant insert on public.universo to anon, authenticated;
grant update, delete on public.universo to authenticated;

-- `universo_rate` NON leva grant a propósito: só a toca o trigger, que é
-- security definer e execútase co propietario da función.

-- Que as táboas futuras deste esquema herden privilexios soas.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;


-- ═══ COMPROBACIÓN ══════════════════════════════════════════════════
-- Debe devolver filas para anon e authenticated:
--
--   select table_name, grantee,
--          string_agg(privilege_type, ', ' order by privilege_type) as permisos
--     from information_schema.role_table_grants
--    where table_name in ('universo','universo_categorias')
--      and grantee in ('anon','authenticated')
--    group by table_name, grantee
--    order by table_name, grantee;
--
-- E isto debe devolver 7:
--   select count(*) from public.universo_categorias;
