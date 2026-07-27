import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const adminApiRoot = path.resolve('src/app/api/admin');

function collectRouteFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectRouteFiles(fullPath);
    return entry.name === 'route.ts' ? [fullPath] : [];
  });
}

test('every admin API route requires verified admin auth, except bootstrap registration', () => {
  const exceptions = new Set([path.join(adminApiRoot, 'register', 'route.ts')]);
  const unguarded = collectRouteFiles(adminApiRoot)
    .filter((file) => !exceptions.has(file))
    .filter((file) => !fs.readFileSync(file, 'utf8').includes('getAdminUser'));

  assert.deepEqual(unguarded, []);
});

test('admin bootstrap registration has no hardcoded production fallback secret', () => {
  const source = fs.readFileSync(path.join(adminApiRoot, 'register', 'route.ts'), 'utf8');
  assert.match(source, /const ADMIN_SECRET_CODE = process\.env\.ADMIN_SECRET_CODE;/);
  assert.doesNotMatch(source, /PATA_AMIGA_ADMIN_2025/);
});

test('role mismatch cannot be mistaken for an authenticated admin object', () => {
  const source = fs.readFileSync(path.resolve('src/lib/admin-auth.ts'), 'utf8');
  assert.doesNotMatch(source, /return\s+\{\s*\.\.\.user,\s*isUnauthorized:/);
  assert.match(source, /if \(!isAdmin\)[\s\S]*?return null;/);
});
