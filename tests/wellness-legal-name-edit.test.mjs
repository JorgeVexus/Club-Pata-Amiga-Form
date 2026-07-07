import assert from 'node:assert/strict';
import fs from 'node:fs';

const complementarySource = fs.readFileSync('src/components/WellnessForm/WellnessComplementaryForm.tsx', 'utf8');
const widgetSource = fs.readFileSync('public/widgets/wellness-center-widget.js', 'utf8');
const updateRouteSource = fs.readFileSync('src/app/api/wellness/update/route.ts', 'utf8');

assert.ok(
  complementarySource.includes("legal_name: center.name || ''"),
  'Complementary registration form should initialize the legal/social name from center.name'
);

assert.ok(
  complementarySource.includes('value={formData.legal_name}') &&
    complementarySource.includes('name: legal_name.trim() || center.name'),
  'Complementary registration form should render and submit the editable legal/social name'
);

assert.ok(
  widgetSource.includes('name="name"') &&
    widgetSource.includes("name: formData.get('name')"),
  'Wellness center widget edit form should render and submit the legal/social name'
);

assert.ok(
  updateRouteSource.includes("'name'"),
  'Wellness update API should treat name as a profile update notification field'
);
