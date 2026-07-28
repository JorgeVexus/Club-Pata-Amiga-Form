import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const wellnessSource = readFileSync(
  new URL('../public/widgets/wellness-center-widget.js', import.meta.url),
  'utf8',
);
const planSelectionSource = readFileSync(
  new URL('../src/components/RegistrationV2/steps/Step3PlanSelection.tsx', import.meta.url),
  'utf8',
);
const completeProfileSource = readFileSync(
  new URL('../public/widgets/complete-profile-widget.js', import.meta.url),
  'utf8',
);

function sectionBetween(source, startMarker, endMarker, sectionName) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);

  assert.ok(start >= 0, `${sectionName}: start marker was not found`);
  assert.ok(end > start, `${sectionName}: end marker was not found after its start`);

  return source.slice(start, end);
}

function assertContains(source, expected, message) {
  assert.equal(source.includes(expected), true, message);
}

function assertNotContains(source, unexpected, message) {
  assert.equal(source.includes(unexpected), false, message);
}

test('wellness center widget uses the v2 brand identity', () => {
  const sidebar = sectionBetween(
    wellnessSource,
    'function renderV2Sidebar(',
    'function renderV2MobileNav(',
    'renderV2Sidebar',
  );
  const mobileNav = sectionBetween(
    wellnessSource,
    'function renderV2MobileNav(',
    'function renderV2Shell(',
    'renderV2MobileNav',
  );

  assertContains(
    sidebar,
    'home%20v2%20images/logo-light-bg.svg',
    'renderV2Sidebar must use the light-background v2 logo',
  );
  assertContains(
    sidebar,
    'CENTRO DE BIENESTAR',
    'renderV2Sidebar must display the CENTRO DE BIENESTAR brand label',
  );
  assertContains(
    mobileNav,
    'wc-v2-mobile-brand',
    'renderV2MobileNav must render the v2 mobile brand container',
  );
});

test('registration plan selection exposes and propagates a validated ambassador code', () => {
  const flagDeclaration = planSelectionSource.match(
    /const SHOW_AMBASSADOR_CODE = (?:true|false);/,
  )?.[0];
  const validationHandler = sectionBetween(
    planSelectionSource,
    'const validateCode = async',
    'const handleContinue = async',
    'validateCode',
  );
  const continueHandler = sectionBetween(
    planSelectionSource,
    'const handleContinue = async',
    'useEffect(() => {',
    'handleContinue',
  );
  const referralJsx = sectionBetween(
    planSelectionSource,
    '{/* Referral Section',
    '{/* Checkbox único de términos */}',
    'referral JSX',
  );

  assert.equal(
    flagDeclaration,
    'const SHOW_AMBASSADOR_CODE = true;',
    'the ambassador-code feature flag must be enabled',
  );
  assertContains(
    referralJsx,
    '{SHOW_AMBASSADOR_CODE && (',
    'the referral JSX must remain controlled by SHOW_AMBASSADOR_CODE',
  );
  assertContains(
    validationHandler,
    '/api/referrals/validate-code',
    'validateCode must keep using the referral validation API',
  );
  assertContains(
    validationHandler,
    'encodeURIComponent(normalizedCode)',
    'validateCode must encode the normalized code before placing it in the query string',
  );
  assertContains(
    continueHandler,
    'validatedReferralCode || undefined',
    'handleContinue must propagate only the exact code that was validated',
  );
  assertContains(
    planSelectionSource,
    "const [validatedReferralCode, setValidatedReferralCode] = useState('');",
    'validated state must retain the exact code accepted by the API',
  );
  assertContains(
    planSelectionSource,
    'const referralCodeRef = useRef(referralCode);',
    'validation must track the current input independently of async render timing',
  );
  assertContains(
    validationHandler,
    'if (referralCodeRef.current !== normalizedCode) return;',
    'stale validation responses must be ignored after the input changes',
  );
  assertContains(
    validationHandler,
    "customFields: { 'ambassador-code': normalizedCode }",
    'only the current validated code may be persisted to Memberstack',
  );
  assertContains(
    referralJsx,
    'id="ambassador-code"',
    'the ambassador-code input must expose a stable id',
  );
  assertContains(
    referralJsx,
    'htmlFor="ambassador-code"',
    'the ambassador-code label must be associated with its input',
  );
  assertContains(
    referralJsx,
    'role="status"',
    'successful asynchronous validation feedback must be announced',
  );
  assertContains(
    referralJsx,
    'role="alert"',
    'validation errors must be announced',
  );
});

test('complete profile does not require a pet photo while preserving other required fields', () => {
  const getMissingFieldsBody = sectionBetween(
    completeProfileSource,
    'getMissingFields(pet) {',
    'renderAddPetForm()',
    'getMissingFields(pet)',
  );

  assertNotContains(
    getMissingFieldsBody,
    "missing.push('photo')",
    'getMissingFields(pet) must not require a pet photo',
  );

  for (const field of ['petType', 'age', 'gender', 'breed', 'breedType', 'coatColor', 'vetCert']) {
    assertContains(
      getMissingFieldsBody,
      `missing.push('${field}')`,
      `getMissingFields(pet) must preserve the ${field} requirement`,
    );
  }
});
