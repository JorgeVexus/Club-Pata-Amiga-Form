-- 📝 Migración: Soporte para Extranjeros e Historias de Adopción

-- 1. Actualizar tabla de usuarios con campo de extranjero
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_foreigner BOOLEAN DEFAULT FALSE;

-- 2. Añadir campos para historias de adopción (ligados al usuario/propietario)
-- Se guardan aquí para facilitar la consulta centralizada de historias destacadas
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pet_1_adoption_story TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pet_2_adoption_story TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pet_3_adoption_story TEXT;

-- 🛡️ Comentario de ayuda
COMMENT ON COLUMN public.users.is_foreigner IS 'Indica si el usuario es extranjero y usó pasaporte en lugar de INE';
COMMENT ON COLUMN public.users.pet_1_adoption_story IS 'Historia de adopción de la mascota 1';
COMMENT ON COLUMN public.users.pet_2_adoption_story IS 'Historia de adopción de la mascota 2';
COMMENT ON COLUMN public.users.pet_3_adoption_story IS 'Historia de adopción de la mascota 3';
