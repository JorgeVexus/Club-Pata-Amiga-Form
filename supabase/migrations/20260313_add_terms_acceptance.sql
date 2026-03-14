-- Add terms acceptance tracking to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0';

-- Add comment for legal purposes
COMMENT ON COLUMN public.users.terms_accepted_at IS 'Timestamp when the user accepted the terms and conditions during registration.';
COMMENT ON COLUMN public.users.terms_version IS 'The version of the terms and conditions accepted by the user.';
