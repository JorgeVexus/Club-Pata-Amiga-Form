-- Migración: Agregar columna de foto de perfil a ambassadors
-- Fecha: 2026-07-08
-- Motivo: Paso de "completar perfil" post-registro (RFC, banco, redes, foto).

ALTER TABLE public.ambassadors ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
