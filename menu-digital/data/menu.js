// MENÚ DE EJEMPLO (productos y precios inventados). Reemplazar con el menú real.
// Cada texto va en portugués (pt) y español (es). Precio en R$.
// tags posibles: "artesanal", "casa" (especialidad de la casa), "novo"
window.MENU = [
  {
    id: "promos",
    highlight: true,
    title: { pt: "Promoções", es: "Promociones" },
    note: { pt: "Por tempo limitado", es: "Por tiempo limitado" },
    items: [
      { name: { pt: "Combo Contêiner", es: "Combo Contêiner" }, desc: { pt: "Hambúrguer Cheddar + batata frita + long neck à escolha", es: "Hamburguesa Cheddar + papas fritas + porrón a elección" }, price: 59, priceBefore: 77 },
      { name: { pt: "Balde de Jogo", es: "Balde de partido" }, desc: { pt: "5 long necks bem geladas para ver o jogo com os amigos", es: "5 porrones bien fríos para ver el partido con amigos" }, price: 55, priceBefore: 70 },
      { name: { pt: "Dupla Cordobesa", es: "Dupla cordobesa" }, desc: { pt: "2 hambúrgueres Cordobesa + 2 Fernet com Coca", es: "2 hamburguesas Cordobesas + 2 Fernet con Coca" }, price: 119, priceBefore: 140 },
    ],
  },
  {
    id: "burgers",
    title: { pt: "Hambúrgueres", es: "Hamburguesas" },
    note: { pt: "Pão brioche, blend 160 g e batata frita", es: "Pan brioche, medallón de 160 g y papas fritas" },
    items: [
      {
        name: { pt: "Clássico", es: "Clásica" },
        desc: { pt: "Queijo, alface, tomate, cebola roxa e molho da casa", es: "Queso, lechuga, tomate, cebolla morada y salsa de la casa" },
        price: 34,
      },
      {
        name: { pt: "Cheddar", es: "Cheddar" },
        desc: { pt: "Cheddar cremoso em dobro, bacon crocante e cebola caramelizada", es: "Doble cheddar cremoso, panceta crocante y cebolla caramelizada" },
        price: 39,
      },
      {
        name: { pt: "Cordobesa", es: "Cordobesa" },
        desc: { pt: "Ovo frito, presunto, queijo, alface, tomate e maionese caseira. Do jeito de Córdoba", es: "Huevo frito, jamón, queso, lechuga, tomate y mayonesa casera. Bien de Córdoba" },
        price: 42,
        tags: ["casa"],
      },
      {
        name: { pt: "Brasileira", es: "Brasilera" },
        desc: { pt: "Queijo coalho na chapa, bacon, banana da terra e molho barbecue", es: "Queso coalho a la plancha, panceta, banana frita y salsa barbacoa" },
        price: 41,
      },
      {
        name: { pt: "Contêiner Duplo", es: "Contêiner Doble" },
        desc: { pt: "Dois blends, cheddar, bacon, picles e molho especial", es: "Doble medallón, cheddar, panceta, pepinos y salsa especial" },
        price: 49,
        tags: ["novo"],
      },
    ],
  },
  {
    id: "sanduiches",
    title: { pt: "Sanduíches", es: "Sándwiches" },
    items: [
      {
        name: { pt: "Sanduíche de milanesa", es: "Sándwich de milanesa" },
        desc: { pt: "Milanesa de carne, alface, tomate e maionese no pão francês", es: "Milanesa de carne, lechuga, tomate y mayonesa en pan francés" },
        price: 38,
        tags: ["casa"],
      },
      {
        name: { pt: "Milanesa completa", es: "Milanesa completa" },
        desc: { pt: "Com presunto, queijo e ovo frito", es: "Con jamón, queso y huevo frito" },
        price: 44,
      },
    ],
  },
  {
    id: "porcoes",
    title: { pt: "Porções", es: "Para compartir" },
    items: [
      { name: { pt: "Batata frita", es: "Papas fritas" }, desc: { pt: "Porção grande", es: "Porción grande" }, price: 24 },
      { name: { pt: "Batata cheddar e bacon", es: "Papas cheddar y panceta" }, desc: { pt: "Para dividir (ou não)", es: "Para compartir (o no)" }, price: 34 },
      { name: { pt: "Anéis de cebola", es: "Aros de cebolla" }, desc: { pt: "Com molho barbecue", es: "Con salsa barbacoa" }, price: 26 },
    ],
  },
  {
    id: "cervejas",
    title: { pt: "Cervejas", es: "Cervezas" },
    note: { pt: "Sempre geladas", es: "Siempre bien frías" },
    items: [
      { name: { pt: "Heineken long neck", es: "Heineken porrón" }, desc: { pt: "330 ml", es: "330 ml" }, price: 14 },
      { name: { pt: "Corona long neck", es: "Corona porrón" }, desc: { pt: "330 ml", es: "330 ml" }, price: 15 },
      { name: { pt: "Stella Artois long neck", es: "Stella Artois porrón" }, desc: { pt: "330 ml", es: "330 ml" }, price: 14 },
      { name: { pt: "Brahma garrafa", es: "Brahma botella" }, desc: { pt: "600 ml, para dividir", es: "600 ml, para compartir" }, price: 18 },
      { name: { pt: "Eisenbahn Pilsen", es: "Eisenbahn Pilsen" }, desc: { pt: "355 ml · de Santa Catarina", es: "355 ml · de Santa Catarina" }, price: 16 },
      {
        name: { pt: "IPA artesanal da Ilha", es: "IPA artesanal de la Isla" },
        desc: { pt: "Chope 500 ml de cervejaria local de Floripa", es: "Tirada 500 ml de cervecería local de Floripa" },
        price: 26,
        tags: ["artesanal"],
      },
      {
        name: { pt: "Golden Ale artesanal", es: "Golden Ale artesanal" },
        desc: { pt: "Chope 500 ml, leve e refrescante", es: "Tirada 500 ml, liviana y refrescante" },
        price: 24,
        tags: ["artesanal"],
      },
    ],
  },
  {
    id: "drinks",
    title: { pt: "Drinks", es: "Tragos" },
    items: [
      { name: { pt: "Caipirinha", es: "Caipirinha" }, desc: { pt: "Cachaça, limão e açúcar", es: "Cachaça, lima y azúcar" }, price: 25 },
      {
        name: { pt: "Fernet com Coca", es: "Fernet con Coca" },
        desc: { pt: "O clássico argentino", es: "El clásico cordobés" },
        price: 28,
        tags: ["casa"],
      },
      { name: { pt: "Gin tônica", es: "Gin tonic" }, desc: { pt: "Gin, tônica e especiarias", es: "Gin, tónica y especias" }, price: 30 },
      { name: { pt: "Aperol Spritz", es: "Aperol Spritz" }, desc: { pt: "Aperol, espumante e laranja", es: "Aperol, espumante y naranja" }, price: 32 },
    ],
  },
  {
    id: "sem-alcool",
    title: { pt: "Sem álcool", es: "Sin alcohol" },
    items: [
      { name: { pt: "Refrigerante lata", es: "Gaseosa lata" }, desc: { pt: "Coca-Cola, Guaraná, Sprite", es: "Coca-Cola, Guaraná, Sprite" }, price: 8 },
      { name: { pt: "Água", es: "Agua" }, desc: { pt: "Com ou sem gás", es: "Con o sin gas" }, price: 6 },
      { name: { pt: "Suco natural", es: "Jugo natural" }, desc: { pt: "Laranja ou maracujá", es: "Naranja o maracuyá" }, price: 12 },
    ],
  },
];
