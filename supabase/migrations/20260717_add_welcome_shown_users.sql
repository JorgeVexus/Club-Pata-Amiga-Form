ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS welcome_shown BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.users.welcome_shown IS
'Indica si el miembro ya visualizo la bienvenida del dashboard';
