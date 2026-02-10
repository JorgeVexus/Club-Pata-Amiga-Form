-- Add waiting period columns and second photo URL to pets table
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS waiting_period_start timestamptz,
ADD COLUMN IF NOT EXISTS waiting_period_end timestamptz,
ADD COLUMN IF NOT EXISTS photo2_url text;

-- Add comment to columns
COMMENT ON COLUMN public.pets.waiting_period_start IS 'Start date of the waiting period';
COMMENT ON COLUMN public.pets.waiting_period_end IS 'End date of the waiting period (90 days after start)';
COMMENT ON COLUMN public.pets.photo2_url IS 'URL of the second pet photo';
