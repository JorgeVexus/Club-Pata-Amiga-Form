-- Add extra photo columns to pets table to support up to 5 photos total
-- photo_url (1) and photo2_url (2) already exist
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS photo3_url text,
ADD COLUMN IF NOT EXISTS photo4_url text,
ADD COLUMN IF NOT EXISTS photo5_url text;

-- Add comments for documentation
COMMENT ON COLUMN public.pets.photo3_url IS 'URL of the third pet photo';
COMMENT ON COLUMN public.pets.photo4_url IS 'URL of the fourth pet photo';
COMMENT ON COLUMN public.pets.photo5_url IS 'URL of the fifth pet photo';
