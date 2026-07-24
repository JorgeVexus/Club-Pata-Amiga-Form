import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('public/widgets/unified-membership-widget.js', 'utf8');
const handlerStart = source.indexOf('async handlePetUnsubscribe(petId, petIndex, petName)');
const handlerEnd = source.indexOf('\n        showUnsubscribeReasons(petName)', handlerStart);

assert.ok(handlerStart > -1, 'handlePetUnsubscribe should exist');
assert.ok(handlerEnd > handlerStart, 'handlePetUnsubscribe block should be bounded');

const handlerSource = source.slice(handlerStart, handlerEnd);

assert.doesNotMatch(
  handlerSource,
  /this\.showGlobalLoader\(/,
  'pet unsubscribe flow should not call missing showGlobalLoader'
);

assert.match(
  handlerSource,
  /this\.setPetUnsubscribeSubmitting\(true\)/,
  'pet unsubscribe flow should show a local submitting state after confirmation'
);

assert.match(
  handlerSource,
  /this\.setPetUnsubscribeSubmitting\(false\)/,
  'pet unsubscribe flow should clear the local submitting state after completion'
);

assert.match(
  source,
  /setPetUnsubscribeSubmitting\(isSubmitting\)/,
  'unified widget should define the local unsubscribe submitting helper'
);

assert.match(
  handlerSource,
  /\/api\/user\/pets\/unsubscribe/,
  'pet unsubscribe flow should submit to the existing unsubscription API'
);

console.log('unified pet unsubscribe flow checks passed');
