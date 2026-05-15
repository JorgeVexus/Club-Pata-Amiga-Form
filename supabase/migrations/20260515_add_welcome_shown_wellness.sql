-- MIGRACIÓN: Adición de campo welcome_shown para Centros de Bienestar
-- Fecha: Mayo 2026

ALTER TABLE wellness_centers 
ADD COLUMN IF NOT EXISTS welcome_shown BOOLEAN DEFAULT FALSE;

-- Comentario explicativo
COMMENT ON COLUMN wellness_centers.welcome_shown IS 'Indica si el centro ya visualizó el modal de bienvenida tras su aprobación';
