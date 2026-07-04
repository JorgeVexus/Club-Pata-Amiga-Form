import assert from 'node:assert/strict';
import fs from 'node:fs';

const widgetSource = fs.readFileSync('public/widgets/wellness-center-widget.js', 'utf8');
const updateRouteSource = fs.readFileSync('src/app/api/wellness/update/route.ts', 'utf8');
const meRouteSource = fs.readFileSync('src/app/api/wellness/me/route.ts', 'utf8');
const locationsRouteSource = fs.readFileSync('src/app/api/wellness/locations/route.ts', 'utf8');
const adminRouteSource = fs.readFileSync('src/app/api/admin/wellness/route.ts', 'utf8');
const adminModalSource = fs.readFileSync('src/components/Admin/WellnessCenterDetailModal.tsx', 'utf8');
const migrationSource = fs.readFileSync('supabase/migrations/20260703_create_wellness_center_locations.sql', 'utf8');

assert.ok(
  widgetSource.includes('data-branch-toggle'),
  'widget should ask if the center has more than one branch'
);
assert.ok(
  widgetSource.includes('btn-add-location'),
  'widget should render an add branch button'
);
assert.ok(
  widgetSource.includes('collectWellnessLocations'),
  'widget should collect unlimited branch rows into a locations payload'
);
assert.ok(
  widgetSource.includes('locations: collectWellnessLocations'),
  'widget should submit locations to /api/wellness/update'
);

assert.ok(
  updateRouteSource.includes('syncLocations'),
  'wellness update route should persist branch locations'
);
assert.ok(
  meRouteSource.includes('getLocations'),
  'wellness me route should return branch locations'
);
assert.ok(
  locationsRouteSource.includes('getAllApprovedLocations'),
  'public locations route should keep using the approved locations service'
);
assert.ok(
  adminRouteSource.includes('wellness_center_locations'),
  'admin wellness route should include branch locations'
);
assert.ok(
  adminModalSource.includes('locations') && adminModalSource.includes('Sucursales'),
  'admin detail modal should show branch locations'
);

assert.match(
  migrationSource,
  /CREATE TABLE IF NOT EXISTS wellness_center_locations/,
  'migration should create wellness_center_locations table'
);
assert.match(
  migrationSource,
  /ENABLE ROW LEVEL SECURITY/,
  'migration should enable RLS for wellness_center_locations'
);
