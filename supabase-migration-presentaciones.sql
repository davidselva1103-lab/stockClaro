-- ============================================================
-- Migración: presentaciones de venta (Unidad / Caja / Docena / otras)
-- Ejecuta esto en Supabase > SQL Editor si ya habías creado
-- tu base de datos antes de este cambio.
-- ============================================================
alter table products add column if not exists presentaciones jsonb default '[]'::jsonb;
alter table movements add column if not exists presentacion text;
alter table movements add column if not exists presentacion_unidades numeric;
alter table movements add column if not exists presentacion_precio numeric;
