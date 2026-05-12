-- 🎯 Migración: Agregar columna ambassador_code a la tabla users
-- Esta columna es necesaria para rastrear qué embajador refirió al usuario
-- y aplicar los beneficios de carencia (90 días) de forma eficiente.

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS ambassador_code VARCHAR(255);

-- Comentario para documentación
COMMENT ON COLUMN public.users.ambassador_code IS 'Código de embajador que refirió al usuario';

-- Índice para búsquedas rápidas en users
CREATE INDEX IF NOT EXISTS idx_users_ambassador_code ON public.users(ambassador_code);

-- 🐾 Migración: Agregar columna is_mixed a la tabla pets
-- Algunas partes del sistema usan is_mixed como alternativa a is_mixed_breed.
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS is_mixed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.pets.is_mixed IS 'Indica si la mascota es mestiza (campo alternativo para compatibilidad)';

