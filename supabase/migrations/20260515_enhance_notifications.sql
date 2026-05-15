-- =====================================================
-- Mejorar tabla de notificaciones con Iconos y Links
-- =====================================================

-- 1. Agregar columnas si no existen
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
ADD COLUMN IF NOT EXISTS link TEXT;

-- 2. Comentarios
COMMENT ON COLUMN public.notifications.icon IS 'Emoji o identificador de icono para la notificación';
COMMENT ON COLUMN public.notifications.link IS 'Ruta interna o URL externa para navegar al hacer clic';
