-- Tabla minimalista para feature flags de la app
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Flag para skip payment (desactivado por defecto)
INSERT INTO public.app_settings (key, value) VALUES ('skip_payment_enabled', false)
ON CONFLICT (key) DO NOTHING;
