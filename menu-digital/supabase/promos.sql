-- =====================================================================
-- Promociones: categoría destacada + precio anterior tachado.
-- Correr una vez en: Supabase → SQL Editor → New query → Run
-- =====================================================================

-- Categoría "destacada" (se muestra con estilo de promo) y precio anterior de cada item.
alter table public.categories add column if not exists highlight boolean not null default false;
alter table public.items add column if not exists price_before numeric(10,2)
  check (price_before is null or price_before >= 0);

-- Crea "Promociones" como primera categoría, con 3 promos de ejemplo.
-- Si ya existe una categoría destacada, no hace nada (se puede correr dos veces sin duplicar).
do $$
declare
  c uuid;
begin
  if exists (select 1 from public.categories where highlight) then
    return;
  end if;

  update public.categories set position = position + 1 where parent_id is null;

  insert into public.categories (name_pt, name_es, note_pt, note_es, position, highlight)
  values ('Promoções', 'Promociones', 'Por tempo limitado', 'Por tiempo limitado', 0, true)
  returning id into c;

  insert into public.items (category_id, name_pt, name_es, desc_pt, desc_es, price, price_before, position) values
    (c, 'Combo Contêiner', 'Combo Contêiner',
        'Hambúrguer Cheddar + batata frita + long neck à escolha',
        'Hamburguesa Cheddar + papas fritas + porrón a elección', 59, 77, 1),
    (c, 'Balde de Jogo', 'Balde de partido',
        '5 long necks bem geladas para ver o jogo com os amigos',
        '5 porrones bien fríos para ver el partido con amigos', 55, 70, 2),
    (c, 'Dupla Cordobesa', 'Dupla cordobesa',
        '2 hambúrgueres Cordobesa + 2 Fernet com Coca',
        '2 hamburguesas Cordobesas + 2 Fernet con Coca', 119, 140, 3);
end $$;
