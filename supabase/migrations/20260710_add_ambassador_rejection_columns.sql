-- Migración: Agregar columnas faltantes de rechazo a ambassadors
-- Fecha: 2026-07-10
-- Motivo: El endpoint PATCH /api/ambassadors/[id] intenta escribir rejected_at
-- y rejected_by al rechazar una solicitud, pero estas columnas nunca se crearon.
-- Esto hacía que CADA rechazo fallara con un error 500 en el UPDATE, sin que
-- el frontend mostrara ningún error (silenciosamente no pasaba nada).

ALTER TABLE public.ambassadors
ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
ADD COLUMN IF NOT EXISTS rejected_by text;

COMMENT ON COLUMN public.ambassadors.rejected_at IS 'Fecha en que se rechazó la solicitud de embajador.';
COMMENT ON COLUMN public.ambassadors.rejected_by IS 'Admin (memberstack_id o identificador) que rechazó la solicitud.';
