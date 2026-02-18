-- Add gender column to pets table
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- Add comment
COMMENT ON COLUMN public.pets.gender IS 'Gender of the pet: macho (male) or hembra (female)';

-- Create index for gender queries
CREATE INDEX IF NOT EXISTS idx_pets_gender ON public.pets(gender);
