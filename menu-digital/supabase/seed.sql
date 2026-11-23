-- =====================================================================
-- Menú de EJEMPLO (productos y precios inventados).
-- Correr una vez después de schema.sql. Después se edita todo desde el panel.
-- =====================================================================
do $$
declare
  c uuid;
  s uuid;
begin
  -- Hamburguesas
  insert into categories (name_pt, name_es, note_pt, note_es, position)
  values ('Hambúrgueres', 'Hamburguesas', 'Pão brioche, blend 160 g e batata frita', 'Pan brioche, medallón de 160 g y papas fritas', 1)
  returning id into c;
  insert into items (category_id, name_pt, name_es, desc_pt, desc_es, price, tags, position) values
    (c, 'Clássico', 'Clásica', 'Queijo, alface, tomate, cebola roxa e molho da casa', 'Queso, lechuga, tomate, cebolla morada y salsa de la casa', 34, '{}', 1),
    (c, 'Cheddar', 'Cheddar', 'Cheddar cremoso em dobro, bacon crocante e cebola caramelizada', 'Doble cheddar cremoso, panceta crocante y cebolla caramelizada', 39, '{}', 2),
    (c, 'Cordobesa', 'Cordobesa', 'Ovo frito, presunto, queijo, alface, tomate e maionese caseira. Do jeito de Córdoba', 'Huevo frito, jamón, queso, lechuga, tomate y mayonesa casera. Bien de Córdoba', 42, '{casa}', 3),
    (c, 'Brasileira', 'Brasilera', 'Queijo coalho na chapa, bacon, banana da terra e molho barbecue', 'Queso coalho a la plancha, panceta, banana frita y salsa barbacoa', 41, '{}', 4),
    (c, 'Contêiner Duplo', 'Contêiner Doble', 'Dois blends, cheddar, bacon, picles e molho especial', 'Doble medallón, cheddar, panceta, pepinos y salsa especial', 49, '{novo}', 5);

  -- Sándwiches
  insert into categories (name_pt, name_es, position) values ('Sanduíches', 'Sándwiches', 2) returning id into c;
  insert into items (category_id, name_pt, name_es, desc_pt, desc_es, price, tags, position) values
    (c, 'Sanduíche de milanesa', 'Sándwich de milanesa', 'Milanesa de carne, alface, tomate e maionese no pão francês', 'Milanesa de carne, lechuga, tomate y mayonesa en pan francés', 38, '{casa}', 1),
    (c, 'Milanesa completa', 'Milanesa completa', 'Com presunto, queijo e ovo frito', 'Con jamón, queso y huevo frito', 44, '{}', 2);

  -- Porciones
  insert into categories (name_pt, name_es, position) values ('Porções', 'Para compartir', 3) returning id into c;
  insert into items (category_id, name_pt, name_es, desc_pt, desc_es, price, position) values
    (c, 'Batata frita', 'Papas fritas', 'Porção grande', 'Porción grande', 24, 1),
    (c, 'Batata cheddar e bacon', 'Papas cheddar y panceta', 'Para dividir (ou não)', 'Para compartir (o no)', 34, 2),
    (c, 'Anéis de cebola', 'Aros de cebolla', 'Com molho barbecue', 'Con salsa barbacoa', 26, 3);

  -- Cervezas, con subcategorías
  insert into categories (name_pt, name_es, note_pt, note_es, position)
  values ('Cervejas', 'Cervezas', 'Sempre geladas', 'Siempre bien frías', 4)
  returning id into c;

  insert into categories (parent_id, name_pt, name_es, position) values (c, 'Long neck', 'Porrón', 1) returning id into s;
  insert into items (category_id, name_pt, name_es, desc_pt, desc_es, price, position) values
    (s, 'Heineken', 'Heineken', '330 ml', '330 ml', 14, 1),
    (s, 'Corona', 'Corona', '330 ml', '330 ml', 15, 2),
    (s, 'Stella Artois', 'Stella Artois', '330 ml', '330 ml', 14, 3),
    (s, 'Eisenbahn Pilsen', 'Eisenbahn Pilsen', '355 ml · de Santa Catarina', '355 ml · de Santa Catarina', 16, 4);

  insert into categories (parent_id, name_pt, name_es, position) values (c, 'Garrafa 600 ml', 'Botella 600 ml', 2) returning id into s;
  insert into items (category_id, name_pt, name_es, desc_pt, desc_es, price, position) values
    (s, 'Brahma', 'Brahma', 'Para dividir', 'Para compartir', 18, 1),
    (s, 'Heineken', 'Heineken', 'Para dividir', 'Para compartir', 22, 2);

  insert into categories (parent_id, name_pt, name_es, position) values (c, 'Artesanais · chope 500 ml', 'Artesanales · tirada 500 ml', 3) returning id into s;
  insert into items (category_id, name_pt, name_es, desc_pt, desc_es, price, tags, position) values
    (s, 'IPA da Ilha', 'IPA de la Isla', 'Cervejaria local de Floripa', 'Cervecería local de Floripa', 26, '{artesanal}', 1),
    (s, 'Golden Ale', 'Golden Ale', 'Leve e refrescante', 'Liviana y refrescante', 24, '{artesanal}', 2);

  -- Tragos
  insert into categories (name_pt, name_es, position) values ('Drinks', 'Tragos', 5) returning id into c;
  insert into items (category_id, name_pt, name_es, desc_pt, desc_es, price, tags, position) values
    (c, 'Caipirinha', 'Caipirinha', 'Cachaça, limão e açúcar', 'Cachaça, lima y azúcar', 25, '{}', 1),
    (c, 'Fernet com Coca', 'Fernet con Coca', 'O clássico argentino', 'El clásico cordobés', 28, '{casa}', 2),
    (c, 'Gin tônica', 'Gin tonic', 'Gin, tônica e especiarias', 'Gin, tónica y especias', 30, '{}', 3),
    (c, 'Aperol Spritz', 'Aperol Spritz', 'Aperol, espumante e laranja', 'Aperol, espumante y naranja', 32, '{}', 4);

  -- Sin alcohol
  insert into categories (name_pt, name_es, position) values ('Sem álcool', 'Sin alcohol', 6) returning id into c;
  insert into items (category_id, name_pt, name_es, desc_pt, desc_es, price, position) values
    (c, 'Refrigerante lata', 'Gaseosa lata', 'Coca-Cola, Guaraná, Sprite', 'Coca-Cola, Guaraná, Sprite', 8, 1),
    (c, 'Água', 'Agua', 'Com ou sem gás', 'Con o sin gas', 6, 2),
    (c, 'Suco natural', 'Jugo natural', 'Laranja ou maracujá', 'Naranja o maracuyá', 12, 3);
end $$;
