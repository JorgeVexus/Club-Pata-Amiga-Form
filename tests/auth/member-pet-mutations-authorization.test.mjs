import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const routePaths = [
  'src/app/api/user/add-pet/route.ts',
  'src/app/api/user/pets/add/route.ts',
  'src/app/api/user/pets/[petId]/update/route.ts',
];

test('all member pet mutation routes authorize the actor before privileged access', () => {
  for (const routePath of routePaths) {
    const source = fs.readFileSync(routePath, 'utf8');
    assert.match(source, /requireMemberActor\(/, routePath);
    const authIndex = source.indexOf('requireMemberActor(');
    const databaseIndex = source.indexOf(".from('");
    const memberstackAdminIndex = source.indexOf('https://admin.memberstack.com');
    const firstPrivilegedIndex = Math.min(
      ...[databaseIndex, memberstackAdminIndex].filter((index) => index >= 0),
    );
    assert.equal(authIndex < firstPrivilegedIndex, true, routePath);
  }
});

test('pet update verifies the selected pet belongs to the authenticated Supabase user', () => {
  const source = fs.readFileSync('src/app/api/user/pets/[petId]/update/route.ts', 'utf8');
  assert.match(source, /owner\.id !== auth\.actor\.supabaseUserId/);
});

test('all active pet mutation widgets attach Memberstack bearer auth', () => {
  const sources = [
    'public/widgets/complete-profile-widget.js',
    'public/widgets/pet-cards-widget.js',
    'public/widgets/unified-membership-widget.js',
  ].map((file) => fs.readFileSync(file, 'utf8'));

  for (const source of sources) {
    const mutationCount = [...source.matchAll(/\/api\/user\/(?:add-pet|pets\/add|pets\/\$\{[^}]+\}\/update)/g)].length;
    if (mutationCount === 0) continue;
    const bearerCount = [...source.matchAll(/Authorization:\s*`Bearer \$\{token\}`/g)].length;
    assert.equal(bearerCount >= mutationCount, true);
  }
});
