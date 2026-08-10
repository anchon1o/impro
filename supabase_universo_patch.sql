-- ============================================================
-- IMPROAPP — PATCH: política de inserción de universo
-- Executar DESPOIS de supabase_universo.sql e ANTES de supabase_universo_seed.sql
-- ============================================================

-- A política orixinal esixía user_id = auth.uid() SEMPRE, o que
-- bloqueaba calquera insert con user_id null (entradas verificadas
-- do sistema, sen dono). Corrixido para permitir tamén ao admin
-- inserir entradas verificadas directamente.
drop policy if exists universo_insert on universo;
create policy universo_insert on universo for insert
  with check (
    user_id = auth.uid()
    or (user_id is null and public.is_admin())
  );

-- Permitir ao admin ver e xestionar TODOS os grupos (necesario
-- para a sección Admin → Grupos, que mostra todos os grupos e membros)
drop policy if exists grupos_all on grupos;
create policy grupos_select on grupos for select
  using (user_id = auth.uid() or public.is_admin());
create policy grupos_write on grupos for insert
  with check (user_id = auth.uid());
create policy grupos_update on grupos for update
  using (user_id = auth.uid() or public.is_admin());
create policy grupos_delete on grupos for delete
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================
-- FIN
-- ============================================================
