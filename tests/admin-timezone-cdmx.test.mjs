import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const files = [
  'public/widgets/unified-membership-widget.js',
  'src/components/Admin/Solidarity/SolidarityRequestDetail.tsx',
  'src/components/Admin/Communications/CommHistory.tsx',
  'src/components/Admin/AmbassadorDetailModal.tsx'
];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  assert.match(source, /America\/Mexico_City/, `${file} should format visible admin/member times in CDMX timezone`);
}

console.log('CDMX timezone checks passed');
