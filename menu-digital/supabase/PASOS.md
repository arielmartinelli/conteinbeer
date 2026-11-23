# Conectar el menú a Supabase

1. **Crear el proyecto** en https://supabase.com/dashboard → New project
   - Nombre: `conteinbeer` · Región: **South America (São Paulo)**, la más cercana a Floripa.
   - Guardá la contraseña de la base de datos en un lugar seguro.
2. **Crear las tablas**: SQL Editor → New query → pegar `schema.sql` → Run.
3. **Cargar el menú de ejemplo** (opcional): New query → pegar `seed.sql` → Run.
4. **Cerrar registros públicos**: Authentication → Sign In / Providers → desactivar "Allow new users to sign up".
5. **Crear el usuario de los dueños**: Authentication → Users → Add user → email + contraseña (marcar "Auto confirm").
6. **Darle permiso de administrador**: SQL Editor →
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'EMAIL_DEL_DUENO';
   ```
7. **Conectar la página**: Project Settings → API → copiar "Project URL" y la clave "anon public"
   y pegarlas en `data/config.js` (`supabaseUrl` y `supabaseAnonKey`).

Listo: `admin.html` para editar, `menu.html` muestra los cambios al instante.
