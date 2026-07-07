import assert from 'node:assert/strict';
import fs from 'node:fs';

const typesSource = fs.readFileSync('src/types/wellness.types.ts', 'utf8');
const serviceSource = fs.readFileSync('src/services/wellness.service.ts', 'utf8');
const complementarySource = fs.readFileSync('src/components/WellnessForm/WellnessComplementaryForm.tsx', 'utf8');
const widgetSource = fs.readFileSync('public/widgets/wellness-center-widget.js', 'utf8');
const adminModalSource = fs.readFileSync('src/components/Admin/WellnessCenterDetailModal.tsx', 'utf8');
const mapWidgetSource = fs.readFileSync('public/widgets/wellness-map-widget.js', 'utf8');
const uploadRouteSource = fs.readFileSync('src/app/api/upload/wellness-location-photo/route.ts', 'utf8');
const migrationSource = fs.readFileSync('supabase/migrations/20260706_add_wellness_location_photos.sql', 'utf8');

assert.ok(
  typesSource.includes('photo_urls?: string[]'),
  'WellnessCenterLocation should expose photo_urls'
);
assert.ok(
  serviceSource.includes('photo_urls: Array.isArray(location.photo_urls)'),
  'wellness service should persist sanitized location photo URLs'
);
assert.ok(
  complementarySource.includes('handleLocationPhotoUpload') && complementarySource.includes('Sucursal principal'),
  'React complementary form should upload photos for the main and extra branches'
);
assert.ok(
  widgetSource.includes('uploadWellnessLocationPhoto') && widgetSource.includes('location_photo_urls'),
  'Webflow wellness widget should upload and collect location photo URLs'
);
assert.ok(
  adminModalSource.includes('locationPhotos') && adminModalSource.includes('Fotos de sucursal'),
  'admin detail modal should show location photos'
);
assert.ok(
  mapWidgetSource.includes('wc-map-photo-strip') && mapWidgetSource.includes('photo_urls'),
  'wellness map popup should render location photos'
);
assert.match(
  uploadRouteSource,
  /const BUCKET = 'wellness-location-photos'/,
  'upload route should target the wellness location photos bucket'
);
assert.match(
  migrationSource,
  /ALTER TABLE wellness_center_locations\s+ADD COLUMN IF NOT EXISTS photo_urls TEXT\[\]/,
  'migration should add photo_urls to wellness_center_locations'
);
assert.match(
  migrationSource,
  /wellness-location-photos/,
  'migration should create or configure wellness-location-photos bucket'
);
