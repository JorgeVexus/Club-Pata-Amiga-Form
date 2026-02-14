-- Create billing_details table
CREATE TABLE IF NOT EXISTS public.billing_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rfc TEXT NOT NULL,
    business_name TEXT NOT NULL,
    fiscal_address TEXT NOT NULL,
    tax_regime TEXT NOT NULL,
    cfdi_use TEXT NOT NULL,
    email TEXT NOT NULL,
    tax_certificate_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.billing_details ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and edit their own billing details
CREATE POLICY "Users can manage their own billing details"
    ON public.billing_details
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Admins and SuperAdmins can see all billing details
CREATE POLICY "Admins can view all billing details"
    ON public.billing_details
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_billing_details_updated_at
    BEFORE UPDATE ON public.billing_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Supabase Storage Policies for 'billing-docs'
-- ==========================================

-- 1. Permite que usuarios autenticados suban su propia constancia.
-- Se asume que el archivo se guarda en una carpeta con el ID del usuario: [user_id]/archivo.pdf
CREATE POLICY "Usuarios pueden subir sus propios documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'billing-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Permite que los usuarios vean sus propios documentos subidos.
CREATE POLICY "Usuarios pueden ver sus propios documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'billing-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Permite que Admins y Superadmins vean TODOS los documentos de facturación.
CREATE POLICY "Admins pueden ver todos los documentos de facturacion"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'billing-docs' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
    )
);

-- 4. Permite que usuarios eliminen sus propios documentos.
CREATE POLICY "Usuarios pueden eliminar sus propios documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'billing-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
