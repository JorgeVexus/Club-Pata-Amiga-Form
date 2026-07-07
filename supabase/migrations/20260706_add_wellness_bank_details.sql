-- Add bank details for wellness center reimbursements
ALTER TABLE wellness_centers
    ADD COLUMN IF NOT EXISTS bank_name TEXT,
    ADD COLUMN IF NOT EXISTS bank_clabe TEXT,
    ADD COLUMN IF NOT EXISTS bank_holder TEXT;

COMMENT ON COLUMN wellness_centers.bank_name IS 'Nombre del banco para reintegros al Centro de Bienestar';
COMMENT ON COLUMN wellness_centers.bank_clabe IS 'CLABE interbancaria de 18 digitos para reintegros al Centro de Bienestar';
COMMENT ON COLUMN wellness_centers.bank_holder IS 'Nombre del titular de la cuenta para reintegros al Centro de Bienestar';
