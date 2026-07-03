import assert from 'node:assert/strict';
import fs from 'node:fs';

const widgetSource = fs.readFileSync('public/widgets/wellness-center-widget.js', 'utf8');
const renderPendingBody = widgetSource.match(/function renderPending\(container, center\) \{([\s\S]*?)\n    function renderRejected/);

assert.ok(renderPendingBody, 'renderPending should exist in wellness-center-widget.js');
assert.ok(
  renderPendingBody[1].includes('getCenterDisplayName(center)'),
  'pending state should greet the center by establishment_name through getCenterDisplayName'
);
assert.ok(
  renderPendingBody[1].includes('wc-pending-profile-form-section'),
  'pending state should render the complementary profile form inline'
);
assert.ok(
  widgetSource.includes('function renderEditProfileForm(center, options = {})'),
  'edit profile form markup should be reusable for modal and inline pending profile section'
);
