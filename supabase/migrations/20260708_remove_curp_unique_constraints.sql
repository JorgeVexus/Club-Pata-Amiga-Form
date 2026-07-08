-- Migración: Remover restricción UNIQUE de la columna CURP en users y ambassadors
-- Fecha: 2026-07-08
-- Motivo: Permitir registros con CURP duplicado (ej. embajadores que ya son miembros,
-- o discrepancias reales de CURP entre familiares/hogares). La validación de duplicados
-- pasa a ser informativa (advertencia no bloqueante) en el frontend.

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_curp_key;
ALTER TABLE public.ambassadors DROP CONSTRAINT IF EXISTS ambassadors_curp_key;
