-- Add age column to pets table
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS age text;

-- Add comment
COMMENT ON COLUMN public.pets.age IS 'Age of the pet (e.g., "2 años", "5 meses")';
