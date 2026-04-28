-- Migración para añadir la plantilla de baja predeterminada
-- Tabla: communication_templates

CREATE TABLE IF NOT EXISTS public.communication_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'email',
    subject TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar la plantilla de Baja si no existe
INSERT INTO public.communication_templates (name, type, subject, content)
SELECT 
    'Aviso de Baja por Incumplimiento', 
    'email', 
    'Notificación de Baja de Membresía - Club Pata Amiga', 
    'Hola {{name}},\n\nTe informamos que tu membresía en Club Pata Amiga ha sido dada de baja debido al incumplimiento de nuestras políticas de convivencia y bienestar animal.\n\nSi tienes alguna duda, puedes contactarnos a través de nuestros canales oficiales.\n\nAtentamente,\nAdministración de Club Pata Amiga'
WHERE NOT EXISTS (
    SELECT 1 FROM public.communication_templates WHERE name = 'Aviso de Baja por Incumplimiento'
);
