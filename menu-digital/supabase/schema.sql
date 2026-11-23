-- =====================================================================
-- Conteinbeer · menú digital — esquema de base de datos (Supabase)
-- Correr una sola vez en: Supabase → SQL Editor → New query → Run
-- =====================================================================

-- ---------- tablas ----------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.categories(id) on delete cascade, -- null = categoría; con valor = subcategoría
  name_pt     text not null,
  name_es     text,
  note_pt     text,
  note_es     text,
  position    int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.items (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories(id) on delete cascade,
  name_pt      text not null,
  name_es      text,
  desc_pt      text,
  desc_es      text,
  price        numeric(10,2) not null check (price >= 0),
  tags         text[] not null default '{}',   -- 'casa' | 'artesanal' | 'novo'
  photo_path   text,                           -- ruta dentro del bucket menu-photos
  available    boolean not null default true,  -- false = "sin stock", no se muestra
  position     int  not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists items_category_idx on public.items(category_id);
create index if not exists categories_parent_idx on public.categories(parent_id);

-- Quién puede editar: solo los usuarios cargados en esta tabla.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- seguridad (RLS) ----------
alter table public.categories enable row level security;
alter table public.items      enable row level security;
alter table public.admins     enable row level security;

-- Cualquiera puede LEER lo visible; solo admins ven lo oculto.
drop policy if exists "leer categorias" on public.categories;
create policy "leer categorias" on public.categories
  for select using (active or public.is_admin());

drop policy if exists "leer platos" on public.items;
create policy "leer platos" on public.items
  for select using (available or public.is_admin());

-- Solo admins pueden crear / editar / borrar.
drop policy if exists "admins editan categorias" on public.categories;
create policy "admins editan categorias" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins editan platos" on public.items;
create policy "admins editan platos" on public.items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Cada usuario puede ver solo su propia fila (para saber si es admin).
drop policy if exists "ver mi fila admin" on public.admins;
create policy "ver mi fila admin" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------- fotos (Storage) ----------
insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', true)
on conflict (id) do nothing;

drop policy if exists "admins suben fotos" on storage.objects;
create policy "admins suben fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'menu-photos' and public.is_admin());

drop policy if exists "admins cambian fotos" on storage.objects;
create policy "admins cambian fotos" on storage.objects
  for update to authenticated
  using (bucket_id = 'menu-photos' and public.is_admin());

drop policy if exists "admins borran fotos" on storage.objects;
create policy "admins borran fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'menu-photos' and public.is_admin());

-- ---------- permisos de acceso ----------
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.items to anon, authenticated;
grant insert, update, delete on public.categories, public.items to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
-- TRUNCATE no respeta RLS: se le saca a los usuarios de la página.
revoke truncate, references, trigger on public.categories, public.items from anon, authenticated;
