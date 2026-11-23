# Conteinbeer — código (menú digital y sitio web)

La base de marca está en `../CLAUDE.md`. Fotos y logos compartidos en `../assets/`.

## Proyectos
- `menu-digital/`: menú para ver en el celular desde un QR en las mesas.
  Mobile-first, carga rápida, categorías (cervezas, bebidas, hamburguesas, otros), precios en R$.
- `sitio-web/`: página del bar. Ubicación con mapa, horarios, menú (enlazado o compartido con el menú digital), botón a WhatsApp/reservas e Instagram.

## Reglas
- Textos públicos en portugués de Brasil, con opción de cambiar a español (en temporada hay mucho turista argentino). Explicaciones para mí en español.
- Diseño en negro, gris y blanco, coherente con el logo (`../assets/logos/logo-conteinbeer.png`).
- Stack: HTML/CSS/JS estático, sin build. `menu-digital/` ya está armado:
  - `index.html`: página del QR de las mesas (menú, reseña en Google, Wi-Fi).
  - `menu.html`: menú por categorías, bilingüe PT/ES.
  - `admin.html` + `js/admin.js`: panel para los dueños (login Supabase): categorías, subcategorías, platos, precios, fotos, stock y orden.
  - Datos en Supabase (`supabase/schema.sql`, `seed.sql`, pasos en `supabase/PASOS.md`). Solo los usuarios de la tabla `admins` pueden editar (RLS). Fotos en el bucket público `menu-photos`, se achican en el navegador antes de subir.
  - `data/menu.js`: menú local de respaldo, se usa si Supabase no está configurado o falla. `data/config.js`: claves de Supabase, Wi-Fi, link de Maps, dirección.
  - Vista previa al compartir: `img/og-image.jpg` (1200x630) + etiquetas og:/twitter: en index y menu, con URL absoluta `https://conteinbeer.vercel.app`. Si el dominio final es otro, reemplazarla en ambos HTML.
  - Al cambiar CSS/JS, subir el `?v=` en los HTML para que los celulares no usen la versión vieja en caché.
  - Para probar en local: `py -3 -m http.server 5180` dentro de `menu-digital/`.
- Hosting / dominio: _[definir]_
- Los precios y productos del menú deben salir de un único archivo de datos (ej. JSON) para que sea fácil actualizarlos.
- Optimizar imágenes antes de usarlas (WebP, tamaños adecuados).
- SEO local: nombre, dirección y horarios en el HTML, datos estructurados de restaurante (schema.org) y buen título para Google.
