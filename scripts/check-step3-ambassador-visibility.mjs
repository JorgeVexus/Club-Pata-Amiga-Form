import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const componentPath = new URL(
    '../src/components/RegistrationV2/steps/Step3PlanSelection.tsx',
    import.meta.url
);
const source = await readFile(componentPath, 'utf8');

assert.match(
    source,
    /const SHOW_AMBASSADOR_CODE = false;/,
    'Step 3 must disable the ambassador-code interface with a local visibility flag.'
);
assert.match(
    source,
    /\{SHOW_AMBASSADOR_CODE && \(/,
    'The ambassador-code interface must be conditionally rendered with the visibility flag.'
);

console.log('Step 3 ambassador-code interface is hidden and its implementation remains available.');
