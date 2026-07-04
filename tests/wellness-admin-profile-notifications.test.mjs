import assert from 'node:assert/strict';
import fs from 'node:fs';

const updateRoute = fs.readFileSync('src/app/api/wellness/update/route.ts', 'utf8');
const logoUploadRoute = fs.readFileSync('src/app/api/upload/wellness-logo/route.ts', 'utf8');
const adminDashboard = fs.readFileSync('src/components/Admin/AdminDashboard.tsx', 'utf8');
const detailModal = fs.readFileSync('src/components/Admin/WellnessCenterDetailModal.tsx', 'utf8');
const adminWellnessRoute = fs.readFileSync('src/app/api/admin/wellness/route.ts', 'utf8');

assert.ok(
  updateRoute.includes("type: 'wellness_profile_updated'"),
  'wellness profile updates should create an admin notification'
);
assert.ok(
  updateRoute.includes('wellness_center_id: updated.id'),
  'wellness update notification should include the updated center id'
);
assert.ok(
  updateRoute.includes('shouldNotifyProfileUpdate'),
  'wellness update route should avoid notifying for status-only actions'
);
assert.ok(
  logoUploadRoute.includes("type: 'wellness_profile_updated'"),
  'wellness logo uploads should also notify admins'
);
assert.ok(
  logoUploadRoute.includes('wellness_center_id: updatedCenter.id'),
  'wellness logo upload notification should include the center id'
);

assert.ok(
  adminDashboard.includes('fetchWellnessCenterDetails'),
  'admin dashboard should be able to fetch a wellness center by id'
);
assert.ok(
  adminDashboard.includes('wellnessCenterId'),
  'admin notification click handling should read wellness center ids'
);
assert.ok(
  adminDashboard.includes('setSelectedWellnessCenter'),
  'admin notification click handling should open the wellness center modal'
);

assert.ok(
  adminWellnessRoute.includes("searchParams.get('id')"),
  'admin wellness endpoint should support fetching one center by id'
);

for (const expected of ['center.logo_url', 'center.phone', 'social.instagram', 'social.facebook', 'social.tiktok', 'social.website']) {
  assert.ok(
    detailModal.includes(expected),
    `wellness center detail modal should render ${expected}`
  );
}
