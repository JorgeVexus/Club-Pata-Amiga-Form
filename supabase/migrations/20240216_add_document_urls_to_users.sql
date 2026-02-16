-- Migracion Simplificada
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS ine_front_url TEXT,
ADD COLUMN IF NOT EXISTS ine_back_url TEXT;

COMMENT ON COLUMN public.users.ine_front_url IS 'URL frente INE';
COMMENT ON COLUMN public.users.ine_back_url IS 'URL reverso INE';
