-- MIGRACIÓN: Crear bucket para fotos de perfil de Embajadores
-- Fecha: 2026-07-08

INSERT INTO storage.buckets (id, name, public)
VALUES ('ambassador-photos', 'ambassador-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket
CREATE POLICY "Public Access Ambassador Photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'ambassador-photos');

CREATE POLICY "Authenticated Upload Ambassador Photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ambassador-photos');

CREATE POLICY "Authenticated Update Ambassador Photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ambassador-photos');
