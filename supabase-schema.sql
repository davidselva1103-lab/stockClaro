-- ============================================================
-- StockClaro · Esquema de base de datos para Supabase
-- Copia y pega TODO este archivo en Supabase > SQL Editor > Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- PERFILES (roles de usuario) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'viewer' check (role in ('admin','editor','viewer')),
  created_at timestamptz default now()
);

-- El primer usuario que se registra queda como "admin" automáticamente.
-- Los siguientes quedan como "viewer" hasta que un admin les cambie el rol.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first boolean;
begin
  select count(*) = 0 into is_first from public.profiles;
  insert into public.profiles (id, email, role)
  values (new.id, new.email, case when is_first then 'admin' else 'viewer' end);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- CATEGORÍAS ----------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  color text not null
);

-- ---------- PRODUCTOS ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text,
  nombre text not null,
  descripcion text,
  categoria text,
  costo numeric default 0,
  precio_venta numeric default 0,
  stock numeric default 0,
  stock_minimo numeric default 5,
  unidad text default 'unidad',
  presentaciones jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- ---------- MOVIMIENTOS (entradas / salidas) ----------
create table if not exists movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  sku text,
  product_name text,
  type text check (type in ('entrada','salida')),
  motivo text,
  qty numeric,
  costo_unit numeric,
  venta_unit numeric,
  note text,
  presentacion text,
  presentacion_unidades numeric,
  presentacion_precio numeric,
  date timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- ---------- CONFIGURACIÓN (una sola fila) ----------
create table if not exists app_config (
  id int primary key default 1,
  currency text default 'C$'
);
insert into app_config (id, currency) values (1, 'C$') on conflict (id) do nothing;

-- ============================================================
-- SEGURIDAD (Row Level Security)
-- Todos los usuarios que iniciaron sesión pueden VER los datos.
-- Solo 'admin' y 'editor' pueden CREAR / MODIFICAR / BORRAR.
-- Solo 'admin' puede cambiar el rol de otras personas.
-- ============================================================
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table movements enable row level security;
alter table app_config enable row level security;

create or replace function public.current_role_is(allowed text[])
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = any(allowed)
  );
$$ language sql security definer stable;

-- Perfiles: todos ven la lista (para saber quién es quién); solo admin edita roles
create policy "profiles_select_all" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update_admin" on profiles for update using (public.current_role_is(array['admin']));

-- Categorías
create policy "categories_select" on categories for select using (auth.role() = 'authenticated');
create policy "categories_write" on categories for all
  using (public.current_role_is(array['admin','editor']))
  with check (public.current_role_is(array['admin','editor']));

-- Productos
create policy "products_select" on products for select using (auth.role() = 'authenticated');
create policy "products_write" on products for all
  using (public.current_role_is(array['admin','editor']))
  with check (public.current_role_is(array['admin','editor']));

-- Movimientos: cualquiera ve el historial; admin/editor pueden registrar;
-- solo admin puede editar o eliminar movimientos ya registrados.
create policy "movements_select" on movements for select using (auth.role() = 'authenticated');
create policy "movements_insert" on movements for insert
  with check (public.current_role_is(array['admin','editor']));
create policy "movements_update" on movements for update
  using (public.current_role_is(array['admin']))
  with check (public.current_role_is(array['admin']));
create policy "movements_delete" on movements for delete
  using (public.current_role_is(array['admin']));

-- Configuración
create policy "config_select" on app_config for select using (auth.role() = 'authenticated');
create policy "config_write" on app_config for update using (public.current_role_is(array['admin','editor']));

-- ============================================================
-- Categoría inicial de ejemplo
-- ============================================================
insert into categories (name, color) values ('General', '#0F6659') on conflict (name) do nothing;
