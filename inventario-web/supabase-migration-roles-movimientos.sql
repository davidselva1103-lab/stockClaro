-- ============================================================
-- Migración: solo administradores pueden editar o eliminar
-- movimientos del historial (entradas/salidas).
-- Los editores pueden seguir REGISTRANDO movimientos nuevos.
-- Ejecuta esto en Supabase > SQL Editor.
-- ============================================================
drop policy if exists "movements_write" on movements;

create policy "movements_insert" on movements for insert
  with check (public.current_role_is(array['admin','editor']));

create policy "movements_update" on movements for update
  using (public.current_role_is(array['admin']))
  with check (public.current_role_is(array['admin']));

create policy "movements_delete" on movements for delete
  using (public.current_role_is(array['admin']));
