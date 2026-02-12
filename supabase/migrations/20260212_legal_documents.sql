-- Legal Documents table for Terms & Conditions, Privacy Policy, etc.
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    file_url text NOT NULL,
    file_name text NOT NULL,
    display_order int DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Public read access for active documents
CREATE POLICY "Public can read active legal documents"
    ON public.legal_documents FOR SELECT
    USING (is_active = true);

-- Admin full access (service role bypasses RLS)
COMMENT ON TABLE public.legal_documents IS 'Legal documents (T&C, Privacy Policy, etc.) managed by admins and displayed to users before checkout.';

-- Add refund tracking to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS refund_status text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS refund_date timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS refund_stripe_id text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id text;
