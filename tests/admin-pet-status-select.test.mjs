import test from 'node:test';
import assert from 'node:assert/strict';

import { ADMIN_PET_STATUS_SELECT } from '../src/utils/admin-pet-status-select.js';

test('ADMIN_PET_STATUS_SELECT only includes columns available in production pets table', () => {
  const selectedColumns = ADMIN_PET_STATUS_SELECT
    .split(',')
    .map((column) => column.trim());

  assert.equal(selectedColumns.includes('is_mixed'), false);
  assert.equal(selectedColumns.includes('is_mixed_breed'), true);
  assert.equal(selectedColumns.includes('waiting_period_start'), true);
});

