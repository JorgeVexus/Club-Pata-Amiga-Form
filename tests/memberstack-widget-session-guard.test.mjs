import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const widgetFiles = [
  'public/widgets/unified-membership-widget.js',
  'public/widgets/wellness-center-widget.js',
  'public/widgets/ambassador-widget.js',
];

test('role widgets enforce Memberstack sessionStorage before requesting the current member', () => {
  for (const file of widgetFiles) {
    const source = readFileSync(file, 'utf8');
    const guardIndex = source.indexOf('enforceMemberstackSessionStorage');
    const currentMemberIndex = source.indexOf('getCurrentMember');

    assert.ok(guardIndex > -1, `${file} should install the Memberstack session guard`);
    assert.ok(currentMemberIndex > -1, `${file} should read the current Memberstack member`);
    assert.ok(
      guardIndex < currentMemberIndex,
      `${file} should guard storage before calling getCurrentMember`
    );
    assert.match(source, /sessionKeys\s*=\s*\[\s*'_ms-mid'\s*,\s*'_ms-mem'\s*\]/);
    assert.match(source, /localStorage\.removeItem\(key\)/);
    assert.match(source, /sessionStorage\.setItem\(key, value\)/);
  }
});
