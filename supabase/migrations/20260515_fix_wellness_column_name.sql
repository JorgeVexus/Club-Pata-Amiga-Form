-- MIGRACIÓN: Corregir nombre de columna en wellness_centers
-- Fecha: Mayo 2026
-- Objetivo: Renombrar 'name' a 'establishment_name' para consistencia con el código frontend y tipos.

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'wellness_centers' AND column_name = 'name'
    ) THEN
        ALTER TABLE wellness_centers RENAME COLUMN name TO establishment_name;
    END IF;
END $$;
