// Datos del local. Editar acá; las páginas los leen solas.
window.CONFIG = {
  // Supabase (base de datos del menú). Si están vacíos, el menú usa data/menu.js.
  // La "anon key" es pública por diseño: la seguridad la dan las reglas RLS de schema.sql.
  supabaseUrl: "https://psunquiklmecsnqonjkq.supabase.co",
  supabaseAnonKey: "sb_publishable_WsdP0zeoTO_0WrVjMuKm0g_XINRYQvj",

  // Abre el local en Google Maps (ubicación + reseñas).
  // TODO: cuando tengamos el Place ID, cambiar por el link directo a "escribir reseña":
  // https://search.google.com/local/writereview?placeid=TU_PLACE_ID
  reviewUrl:
    "https://www.google.com/maps/search/?api=1&query=Conteinbeer%2C%20R.%20Ap%C3%B3stolo%20Pascoal%20978%2C%20Canasvieiras%2C%20Florian%C3%B3polis",

  // TODO: datos reales del Wi-Fi
  wifi: {
    ssid: "Conteinbeer_Clientes",
    password: "cervejagelada",
  },

  address: "R. Apóstolo Pascoal 978 · Canasvieiras, Florianópolis",
  instagram: "https://www.instagram.com/conteinbeer/",
};
