-- MIGRACIÓN: Crear bucket para logos de Centros de Bienestar
-- Fecha: Mayo 2026

INSERT INTO storage.buckets (id, name, public)
VALUES ('wellness-logos', 'wellness-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'wellness-logos');

CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wellness-logos');

CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'wellness-logos');
