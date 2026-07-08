-- MIGRACIÓN: Adición de campo welcome_shown para Embajadores
-- Indica si el embajador ya visualizó el modal de bienvenida tras su aprobación

ALTER TABLE public.ambassadors 
ADD COLUMN IF NOT EXISTS welcome_shown BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.ambassadors.welcome_shown IS 'Indica si el embajador ya visualizó el modal de bienvenida tras su aprobación';
