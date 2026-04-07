-- Add RUAC column to pets table
ALTER TABLE pets ADD COLUMN IF NOT EXISTS ruac VARCHAR(20);

COMMENT ON COLUMN pets.ruac IS 'Registro Único de Animales de Compañía (Mexico-specific registration ID)';
