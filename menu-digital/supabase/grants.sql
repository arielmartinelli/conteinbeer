-- Permisos de acceso a las tablas (los proyectos nuevos de Supabase no los dan solos).
-- Las reglas RLS siguen decidiendo QUÉ filas puede ver o editar cada uno.
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.items to anon, authenticated;
grant insert, update, delete on public.categories, public.items to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
