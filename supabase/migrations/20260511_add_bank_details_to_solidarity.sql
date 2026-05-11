-- Migration: Add bank details to solidarity_requests
-- Created: 2026-05-11

ALTER TABLE solidarity_requests
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_clabe TEXT,
ADD COLUMN IF NOT EXISTS bank_holder TEXT;

-- Add comments for clarity
COMMENT ON COLUMN solidarity_requests.bank_name IS 'Nombre del banco para el reembolso';
COMMENT ON COLUMN solidarity_requests.bank_clabe IS 'CLABE interbancaria (18 dígitos) para el reembolso';
COMMENT ON COLUMN solidarity_requests.bank_holder IS 'Nombre del titular de la cuenta para el reembolso';
