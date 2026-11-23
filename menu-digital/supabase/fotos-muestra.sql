-- =====================================================================
-- FOTOS DE MUESTRA (Unsplash, uso libre). NO son los productos reales:
-- cambiarlas por fotos del bar desde el panel (Editar plato → Cambiar foto).
-- Solo se ponen en platos que todavía no tienen foto. Se puede correr dos veces.
-- =====================================================================
update public.items as i
set photo_path = f.url
from (values
  ('Clássico', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=900&auto=format&fit=crop&q=75'),
  ('Cheddar', 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=900&auto=format&fit=crop&q=75'),
  ('Cordobesa', 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=900&auto=format&fit=crop&q=75'),
  ('Brasileira', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&auto=format&fit=crop&q=75'),
  ('Contêiner Duplo', 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=900&auto=format&fit=crop&q=75'),
  ('Batata frita', 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=900&auto=format&fit=crop&q=75'),
  ('Batata cheddar e bacon', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=900&auto=format&fit=crop&q=75'),
  ('Anéis de cebola', 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=900&auto=format&fit=crop&q=75'),
  ('IPA da Ilha', 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=900&auto=format&fit=crop&q=75'),
  ('Golden Ale', 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=900&auto=format&fit=crop&q=75'),
  ('Caipirinha', 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=900&auto=format&fit=crop&q=75'),
  ('Fernet com Coca', 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=900&auto=format&fit=crop&q=75'),
  ('Gin tônica', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=900&auto=format&fit=crop&q=75'),
  ('Aperol Spritz', 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=900&auto=format&fit=crop&q=75'),
  ('Suco natural', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=900&auto=format&fit=crop&q=75'),
  ('Combo Contêiner', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=900&auto=format&fit=crop&q=75'),
  ('Balde de Jogo', 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=900&auto=format&fit=crop&q=75'),
  ('Dupla Cordobesa', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&auto=format&fit=crop&q=75')
) as f(name_pt, url)
where i.name_pt = f.name_pt
  and i.photo_path is null;

-- Para sacar todas las fotos de muestra de una vez:
-- update public.items set photo_path = null where photo_path like 'https://images.unsplash.com/%';
