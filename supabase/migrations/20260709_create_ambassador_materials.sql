-- MIGRACIÓN: Materiales digitales para embajadores (imágenes, PDFs, videos)
-- Fecha: 2026-07-09

CREATE TABLE IF NOT EXISTS public.ambassador_materials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL DEFAULT 'other', -- 'image' | 'pdf' | 'video' | 'other'
    file_size bigint,
    display_order int DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.ambassador_materials IS 'Materiales digitales (imágenes, PDFs, videos) subidos por admins para que los embajadores descarguen y usen en sus campañas.';

ALTER TABLE public.ambassador_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active ambassador materials"
    ON public.ambassador_materials FOR SELECT
    USING (is_active = true);

-- Bucket de almacenamiento
INSERT INTO storage.buckets (id, name, public)
VALUES ('ambassador-materials', 'ambassador-materials', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Ambassador Materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'ambassador-materials');

CREATE POLICY "Authenticated Upload Ambassador Materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ambassador-materials');

CREATE POLICY "Authenticated Update Ambassador Materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ambassador-materials');

CREATE POLICY "Authenticated Delete Ambassador Materials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ambassador-materials');
