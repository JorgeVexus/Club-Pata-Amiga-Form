import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('public/widgets/pet-cards-widget.js', 'utf8');

assert.match(source, /home%20v2%20images\/logo-light-bg\.svg/);
assert.match(source, /pata-add-v2-brand/);
assert.match(source, /formatBreedWarningV2/);
assert.match(source, /Sabemos que, como muchas otras razas/);
assert.doesNotMatch(source, /warning\.innerHTML = item\.dataset\.warning/);

console.log('pet-cards add form V2 checks passed');
