-- =====================================================================
-- Ajustes del local editables desde el panel (Wi-Fi y link de reseñas).
-- Correr una vez en: Supabase → SQL Editor → New query → Run
-- =====================================================================
create table if not exists public.settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

-- Cualquiera puede leerlos (la página de las mesas muestra el Wi-Fi).
drop policy if exists "leer ajustes" on public.settings;
create policy "leer ajustes" on public.settings for select using (true);

-- Solo admins pueden cambiarlos.
drop policy if exists "admins editan ajustes" on public.settings;
create policy "admins editan ajustes" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.settings to anon, authenticated;
grant insert, update on public.settings to authenticated;

insert into public.settings (key, value) values
  ('wifi_ssid', 'Conteinbeer_Clientes'),
  ('wifi_password', 'cervejagelada'),
  ('review_url', 'https://maps.app.goo.gl/tyUWvfxvQgaNS8oh8')
on conflict (key) do nothing;
