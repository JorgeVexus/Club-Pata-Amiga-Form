-- Migración para añadir campos de cumpleaños a la tabla pets
-- Permite almacenar el mes (1-12) y el año de nacimiento de una mascota.

ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS birth_month integer CHECK (birth_month >= 1 AND birth_month <= 12),
ADD COLUMN IF NOT EXISTS birth_year integer;

-- Comentario para la tabla
COMMENT ON COLUMN public.pets.birth_month IS 'Mes de nacimiento de la mascota (1-12)';
COMMENT ON COLUMN public.pets.birth_year IS 'Año de nacimiento de la mascota (ej. 2020)';
