-- Migración para agregar el apellido a las mascotas
-- Fecha: 08 Abril 2026

ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

COMMENT ON COLUMN public.pets.last_name IS 'Apellido de la mascota (heredado o propio)';
