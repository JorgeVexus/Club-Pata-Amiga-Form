import assert from 'node:assert/strict';
import fs from 'node:fs';

const complementarySource = fs.readFileSync('src/components/WellnessForm/WellnessComplementaryForm.tsx', 'utf8');
const widgetSource = fs.readFileSync('public/widgets/wellness-center-widget.js', 'utf8');
const typesSource = fs.readFileSync('src/types/wellness.types.ts', 'utf8');
const updateRouteSource = fs.readFileSync('src/app/api/wellness/update/route.ts', 'utf8');
const adminModalSource = fs.readFileSync('src/components/Admin/WellnessCenterDetailModal.tsx', 'utf8');
const migrationSource = fs.readFileSync('supabase/migrations/20260706_add_wellness_bank_details.sql', 'utf8');

const expectedCopy = 'Aquí podrás gestionar las citas veterinarias solicitadas por los miembros de Pata Amiga';

assert.ok(
  complementarySource.includes('bank_clabe: center.bank_clabe ||') &&
    complementarySource.includes('reintegros'),
  'Complementary form should capture bank details for reimbursements'
);

assert.ok(
  widgetSource.includes('name="bank_clabe"') &&
    widgetSource.includes("formData.get('bank_clabe')") &&
    widgetSource.includes("bank_clabe: String"),
  'Wellness center widget should render and submit CLABE details'
);

assert.ok(
  widgetSource.includes(expectedCopy),
  'Appointments modal should include the requested explanatory copy'
);

assert.ok(
  typesSource.includes('bank_clabe?: string') &&
    typesSource.includes('bank_holder?: string') &&
    typesSource.includes('bank_name?: string'),
  'Wellness center types should include bank detail fields'
);

assert.ok(
  updateRouteSource.includes("'bank_clabe'") &&
    updateRouteSource.includes("'bank_holder'") &&
    updateRouteSource.includes("'bank_name'"),
  'Wellness update API should treat bank details as profile update fields'
);

assert.ok(
  adminModalSource.includes('Información para reintegros') &&
    adminModalSource.includes('center.bank_clabe') &&
    adminModalSource.includes('center.bank_holder') &&
    adminModalSource.includes('center.bank_name'),
  'Admin wellness detail modal should show bank details for reimbursements'
);

assert.match(
  migrationSource,
  /ALTER TABLE wellness_centers[\s\S]*ADD COLUMN IF NOT EXISTS bank_name TEXT[\s\S]*ADD COLUMN IF NOT EXISTS bank_clabe TEXT[\s\S]*ADD COLUMN IF NOT EXISTS bank_holder TEXT/,
  'Migration should add bank detail columns to wellness_centers'
);
