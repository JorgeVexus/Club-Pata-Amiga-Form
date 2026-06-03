-- =====================================================
-- MIGRACIÓN: Agregar campos de tracking UTM a users
-- Fecha: 2026-06-03
-- =====================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255);

COMMENT ON COLUMN public.users.utm_source IS 'Origen del tráfico de registro (ej. google, facebook)';
COMMENT ON COLUMN public.users.utm_medium IS 'Medio del tráfico de registro (ej. cpc, email, organic)';
COMMENT ON COLUMN public.users.utm_campaign IS 'Campaña de marketing del registro';
COMMENT ON COLUMN public.users.utm_term IS 'Palabras clave de búsqueda de marketing';
COMMENT ON COLUMN public.users.utm_content IS 'Contenido específico del anuncio/campaña';
