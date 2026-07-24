import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('public/widgets/member-account-navbar.js', 'utf8');

assert.match(source, /homeUrl:\s*window\.PATA_AMIGA_CONFIG\?\.homeUrl\s*\|\|\s*'https:\/\/www\.pataamiga\.mx\/'/);
assert.match(source, /href="\$\{CONFIG\.homeUrl\}"/);
assert.match(source, /data-action="silent-dashboard"/);
assert.match(source, /Volver al perfil/);
assert.match(source, /resolveDashboardUrl/);
assert.doesNotMatch(source, /login-redirect-message/);

console.log('member-account-navbar silent navigation checks passed');
