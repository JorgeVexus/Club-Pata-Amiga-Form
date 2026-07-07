-- MIGRACIÓN: Agregar columna 'name' a la tabla 'wellness_centers'
-- Fecha: Julio 2026
-- Objetivo: Almacenar la Razón Social o Nombre legal del aliado de bienestar

ALTER TABLE wellness_centers 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

COMMENT ON COLUMN wellness_centers.name IS 'Razón Social o Nombre legal del aliado de bienestar';
