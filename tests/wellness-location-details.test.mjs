import assert from 'node:assert/strict';
import fs from 'node:fs';

const typesSource = fs.readFileSync('src/types/wellness.types.ts', 'utf8');
const migrationPath = 'supabase/migrations/20260727_add_wellness_location_details.sql';
assert.ok(fs.existsSync(migrationPath), 'location details migration should exist');
const migrationSource = fs.readFileSync(migrationPath, 'utf8');
const serviceSource = fs.readFileSync('src/services/wellness.service.ts', 'utf8');
const widgetSource = fs.readFileSync('public/widgets/wellness-center-widget.js', 'utf8');
const reactSource = fs.readFileSync(
  'src/components/WellnessForm/WellnessComplementaryForm.tsx',
  'utf8'
);
const adminSource = fs.readFileSync(
  'src/components/Admin/WellnessCenterDetailModal.tsx',
  'utf8'
);
const legacyAdminSource = fs.readFileSync(
  'src/components/AdminLegacy/WellnessCenterDetailModal.tsx',
  'utf8'
);
const updateRouteSource = fs.readFileSync('src/app/api/wellness/update/route.ts', 'utf8');

for (const field of [
  'services',
  'promotion_details',
  'social_links',
  'inherits_services',
  'inherits_promotion',
  'inherits_social_links'
]) {
  assert.match(
    typesSource,
    new RegExp(`${field}\\\\?`),
    `WellnessCenterLocation should expose ${field}`
  );
  assert.match(
    migrationSource,
    new RegExp(`ADD COLUMN IF NOT EXISTS ${field}`, 'i'),
    `location migration should add ${field}`
  );
}

assert.match(
  serviceSource,
  /services:\s*Array\.isArray\(location\.services\)/,
  'wellness service should sanitize location services'
);
assert.match(
  serviceSource,
  /promotion_details:\s*location\.promotion_details/,
  'wellness service should persist a location promotion'
);
assert.match(
  serviceSource,
  /social_links:\s*sanitizeWellnessSocialLinks\(location\.social_links\)/,
  'wellness service should sanitize location social links'
);
assert.match(
  serviceSource,
  /location\.services\?\.length\s*\?\s*location\.services\s*:\s*center\.services/,
  'public locations should prefer branch services with historical fallback'
);
assert.match(
  serviceSource,
  /hasWellnessSocialLinks\(location\.social_links\)/,
  'public locations should prefer branch social links with historical fallback'
);

for (const token of [
  'location_same_services_benefits',
  'location_inherits_promotion',
  'location_inherits_social_links',
  'location_services',
  'location_promotion_details',
  'location_social_instagram',
  'location_social_facebook',
  'location_social_tiktok',
  'location_social_website'
]) {
  assert.ok(widgetSource.includes(token), `branch editor should expose ${token}`);
}

assert.ok(
  widgetSource.includes('hasAtLeastOneWellnessSocial'),
  'widget should have a shared social requirement helper'
);
assert.ok(
  widgetSource.includes('validateWellnessProfileForm'),
  'widget should validate main and branch-specific details before submit'
);

for (const token of [
  'primaryServices',
  'primaryPromotionDetails',
  'primarySocialLinks',
  'hasAtLeastOneSocial'
]) {
  assert.ok(reactSource.includes(token), `React branch editor should use ${token}`);
}

for (const [label, source] of [['admin', adminSource], ['legacy admin', legacyAdminSource]]) {
  assert.ok(source.includes('location.services'), `${label} should show branch services`);
  assert.ok(source.includes('location.promotion_details'), `${label} should show branch promotion`);
  assert.ok(source.includes('location.social_links'), `${label} should show branch social links`);
}

assert.ok(
  updateRouteSource.includes('validateWellnessLocationDetails'),
  'update route should reject incomplete main and branch details'
);
assert.ok(
  updateRouteSource.includes('al menos una red social o sitio web'),
  'server validation should enforce a digital channel'
);
