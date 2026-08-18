-- ============================================================
-- Migración: agregar campo "descripción" a productos
-- Ejecuta esto en Supabase > SQL Editor si ya habías creado
-- tu base de datos con el esquema anterior.
-- ============================================================
alter table products add column if not exists descripcion text;
