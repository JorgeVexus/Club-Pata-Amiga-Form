-- Migración: Soporte de Newsletter en materiales digitales para embajadores
-- Fecha: 2026-07-09
-- Motivo: Permitir publicar noticias/efemérides (ej. "21 de julio: Día del Perro")
-- reutilizando la estructura existente de ambassador_materials (file_type='newsletter').

ALTER TABLE public.ambassador_materials
ADD COLUMN IF NOT EXISTS news_date date;

COMMENT ON COLUMN public.ambassador_materials.news_date IS 'Fecha de la noticia/efeméride para materiales tipo newsletter (ej. 21 de julio "Día del Perro"). No aplica a otros tipos de material.';
