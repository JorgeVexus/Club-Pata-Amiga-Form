import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const userActions = readFileSync(new URL('../src/app/actions/user.actions.ts', import.meta.url), 'utf8');
const registrationFlow = readFileSync(new URL('../src/components/RegistrationV2/NewRegistrationFlow.tsx', import.meta.url), 'utf8');
const step6Success = readFileSync(new URL('../src/components/RegistrationV2/steps/Step6Success.tsx', import.meta.url), 'utf8');
const unifiedWidget = readFileSync(new URL('../public/widgets/unified-membership-widget.js', import.meta.url), 'utf8');

test('registerUserInSupabase does not force pending membership status when omitted', () => {
  const registerUserBody = userActions.slice(
    userActions.indexOf('export async function registerUserInSupabase'),
    userActions.indexOf('/**\n * Activa al usuario como miembro')
  );
  assert.match(registerUserBody, /membership_status:\s*userData\.membership_status,/);
  assert.doesNotMatch(registerUserBody, /membership_status:\s*userData\.membership_status\s*\|\|\s*'pending'/);
  assert.match(registerUserBody, /if \(key === 'registration_step'\) return true;/);
});

test('registration v2 activates the member after confirmed payment without skipping steps 4 and 5', () => {
  assert.match(registrationFlow, /activateMemberAfterPayment\(memberId/);
  assert.match(registrationFlow, /'approval-status':\s*'approved'/);
  assert.match(registrationFlow, /goToStep\(4\)/);
  assert.match(registrationFlow, /case 5:[\s\S]*<Step5CompletePet/);
});

test('step 6 success copy confirms membership and supports multiple pet names', () => {
  assert.match(step6Success, /petNames\?:\s*string\[\]/);
  assert.match(step6Success, /Ya est[aá]s en la manada/i);
  assert.match(step6Success, /petsReviewLabel/);
});

test('unified widget routes legacy member review statuses to pet dashboard when pets exist', () => {
  assert.match(unifiedWidget, /isLegacyMemberReviewStatus/);
  assert.match(unifiedWidget, /isLegacyMemberReviewStatus && !hasPets/);
  assert.doesNotMatch(unifiedWidget, /const isWaitingApproval = this\.membershipStatus === 'waiting_approval' \|\| this\.membershipStatus === 'pending_approval';\s*if \(isWaitingApproval\)/);
});
