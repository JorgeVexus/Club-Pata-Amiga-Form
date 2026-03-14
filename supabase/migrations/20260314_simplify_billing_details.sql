-- Add zip_code column
ALTER TABLE public.billing_details ADD COLUMN zip_code TEXT;

-- Drop constraints if necessary (you can drop columns directly, postgres handles it but if there are dependencies it might fail. Usually dropping column is fine)
ALTER TABLE public.billing_details DROP COLUMN IF EXISTS email;
ALTER TABLE public.billing_details DROP COLUMN IF EXISTS fiscal_address;
ALTER TABLE public.billing_details DROP COLUMN IF EXISTS tax_certificate_url;
