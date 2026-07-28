-- ============================================================
-- MIGRATION: Services, promotion and social links per location
-- Date: 2026-07-27
-- Purpose: Allow each Wellness branch to publish its own details.
-- ============================================================

ALTER TABLE wellness_center_locations
    ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS promotion_details TEXT,
    ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS inherits_services BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS inherits_promotion BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS inherits_social_links BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN wellness_center_locations.services IS
    'Effective services offered at this location.';
COMMENT ON COLUMN wellness_center_locations.promotion_details IS
    'Effective member benefit offered at this location.';
COMMENT ON COLUMN wellness_center_locations.social_links IS
    'Effective Instagram, Facebook, TikTok and website links for this location.';
COMMENT ON COLUMN wellness_center_locations.inherits_services IS
    'Whether the location was configured to use the main location services.';
COMMENT ON COLUMN wellness_center_locations.inherits_promotion IS
    'Whether the location was configured to use the main location promotion.';
COMMENT ON COLUMN wellness_center_locations.inherits_social_links IS
    'Whether the location was configured to use the main location social links.';
