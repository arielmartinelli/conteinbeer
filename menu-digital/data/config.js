// Datos del local. Editar acá; las páginas los leen solas.
window.CONFIG = {
  // Supabase (base de datos del menú). Si están vacíos, el menú usa data/menu.js.
  // La "anon key" es pública por diseño: la seguridad la dan las reglas RLS de schema.sql.
  supabaseUrl: "https://psunquiklmecsnqonjkq.supabase.co",
  supabaseAnonKey: "sb_publishable_WsdP0zeoTO_0WrVjMuKm0g_XINRYQvj",

  // Valores de respaldo: los reales se editan en el panel (Configuración) y se guardan en Supabase.
  // Perfil del local en Google Maps (ubicación + reseñas).
  reviewUrl: "https://maps.app.goo.gl/tyUWvfxvQgaNS8oh8",

  wifi: {
    ssid: "Conteinbeer_Clientes",
    password: "cervejagelada",
  },

  address: "R. Apóstolo Pascoal 978 · Canasvieiras, Florianópolis",
  instagram: "https://www.instagram.com/conteinbeer/",
};
