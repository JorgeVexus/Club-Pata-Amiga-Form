-- Migración para segmentación de plantillas de comunicación
-- Tabla: communication_templates

ALTER TABLE public.communication_templates 
ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'general';

-- Comentario para documentación
COMMENT ON COLUMN public.communication_templates.audience IS 'Segmento al que pertenece la plantilla: member, ambassador, wellness-center, general';
