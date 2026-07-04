-- ============================================================
-- MIGRATION: Multiple locations for Wellness Centers
-- Date: 2026-07-03
-- Purpose: Allow each wellness center to manage unlimited branches.
-- ============================================================

CREATE TABLE IF NOT EXISTS wellness_center_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellness_center_id UUID NOT NULL REFERENCES wellness_centers(id) ON DELETE CASCADE,
    name VARCHAR(255),
    address TEXT NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    phone VARCHAR(20),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wc_locations_center ON wellness_center_locations(wellness_center_id);
CREATE INDEX IF NOT EXISTS idx_wc_locations_coords ON wellness_center_locations(lat, lng);
CREATE INDEX IF NOT EXISTS idx_wc_locations_primary ON wellness_center_locations(wellness_center_id, is_primary);

ALTER TABLE wellness_center_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Wellness centers can view own locations" ON wellness_center_locations;
CREATE POLICY "Wellness centers can view own locations" ON wellness_center_locations
    FOR SELECT TO authenticated USING (
        wellness_center_id IN (
            SELECT id FROM wellness_centers WHERE memberstack_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Wellness centers can insert own locations" ON wellness_center_locations;
CREATE POLICY "Wellness centers can insert own locations" ON wellness_center_locations
    FOR INSERT TO authenticated WITH CHECK (
        wellness_center_id IN (
            SELECT id FROM wellness_centers WHERE memberstack_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Wellness centers can update own locations" ON wellness_center_locations;
CREATE POLICY "Wellness centers can update own locations" ON wellness_center_locations
    FOR UPDATE TO authenticated USING (
        wellness_center_id IN (
            SELECT id FROM wellness_centers WHERE memberstack_id = auth.uid()::text
        )
    ) WITH CHECK (
        wellness_center_id IN (
            SELECT id FROM wellness_centers WHERE memberstack_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Wellness centers can delete own locations" ON wellness_center_locations;
CREATE POLICY "Wellness centers can delete own locations" ON wellness_center_locations
    FOR DELETE TO authenticated USING (
        wellness_center_id IN (
            SELECT id FROM wellness_centers WHERE memberstack_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Service role full access wellness_center_locations" ON wellness_center_locations;
CREATE POLICY "Service role full access wellness_center_locations" ON wellness_center_locations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_wellness_center_locations_updated_at ON wellness_center_locations;
CREATE TRIGGER update_wellness_center_locations_updated_at
    BEFORE UPDATE ON wellness_center_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
