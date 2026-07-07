-- ============================================================
-- MIGRATION: Photos for Wellness Center locations
-- Date: 2026-07-06
-- Purpose: Store public photo galleries for main and extra branches.
-- ============================================================

ALTER TABLE wellness_center_locations
    ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';

INSERT INTO storage.buckets (id, name, public)
VALUES ('wellness-location-photos', 'wellness-location-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access wellness location photos" ON storage.objects;
CREATE POLICY "Public Access wellness location photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'wellness-location-photos');

DROP POLICY IF EXISTS "Authenticated Upload wellness location photos" ON storage.objects;
CREATE POLICY "Authenticated Upload wellness location photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wellness-location-photos');

DROP POLICY IF EXISTS "Authenticated Update wellness location photos" ON storage.objects;
CREATE POLICY "Authenticated Update wellness location photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'wellness-location-photos')
WITH CHECK (bucket_id = 'wellness-location-photos');

DROP POLICY IF EXISTS "Service role full access wellness location photos" ON storage.objects;
CREATE POLICY "Service role full access wellness location photos"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'wellness-location-photos')
WITH CHECK (bucket_id = 'wellness-location-photos');
