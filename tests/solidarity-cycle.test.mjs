import test from 'node:test';
import assert from 'node:assert/strict';
import { getSolidarityCycle } from '../src/utils/solidarity-cycle.js';
import fs from 'node:fs';
import path from 'node:path';

test('cycle follows the first payment anniversary instead of calendar year', () => {
  const cycle = getSolidarityCycle('2026-07-14T18:00:00Z', new Date('2027-03-01T00:00:00Z'));
  assert.equal(cycle.start.toISOString(), '2026-07-14T18:00:00.000Z');
  assert.equal(cycle.renewal.toISOString(), '2027-07-14T18:00:00.000Z');
});

test('balance and request routes use the anniversary window and insufficient-funds contract', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const balance = fs.readFileSync(path.join(root, 'src/app/api/solidarity/balance/route.ts'), 'utf8');
  const request = fs.readFileSync(path.join(root, 'src/app/api/solidarity/request/route.ts'), 'utf8');
  const widget = fs.readFileSync(path.join(root, 'public/widgets/unified-membership-widget.js'), 'utf8');
  assert.match(balance, /getSolidarityCycle/);
  assert.match(balance, /renewalDate/);
  assert.match(request, /INSUFFICIENT_SOLIDARITY_BALANCE/);
  assert.match(request, /\.lt\('created_at', cycle\.renewal\.toISOString\(\)\)/);
  assert.match(widget, /data-insufficient-balance-notice hidden/);
  assert.match(widget, /requested > available/);
  assert.doesNotMatch(widget, /tu saldo se renueva en enero/);
});

test('cycle advances after the anniversary and clamps leap-day anniversaries', () => {
  const advanced = getSolidarityCycle('2026-07-14T18:00:00Z', new Date('2027-08-01T00:00:00Z'));
  assert.equal(advanced.start.getUTCFullYear(), 2027);
  assert.equal(advanced.renewal.getUTCFullYear(), 2028);
  const leap = getSolidarityCycle('2024-02-29T12:00:00Z', new Date('2025-02-28T13:00:00Z'));
  assert.equal(leap.start.toISOString(), '2025-02-28T12:00:00.000Z');
  assert.equal(leap.renewal.toISOString(), '2026-02-28T12:00:00.000Z');
});
