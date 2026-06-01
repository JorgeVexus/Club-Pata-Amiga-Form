# Registro V2 Paid Without Pets Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recover paid members that appear with 0 pets, such as `ibrodriguezj@gmail.com`, and prevent any future checkout unless at least one pet was captured.

**Architecture:** Add a single pre-payment completeness gate used by the V2 flow, legacy plan route, and Webflow plan widget. Add an audit/recovery script that reads Supabase, Memberstack, and Stripe for a member email and reports whether pet data can be reconstructed automatically or needs manual follow-up.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict mode, Memberstack DOM/Admin API, Supabase service role, Stripe, existing `.mjs` test style with Node.

---

## Evidence From Audit

The current system has multiple paths that can produce a paid member with `petCount: 0`.

- `src/components/RegistrationV2/NewRegistrationFlow.tsx`: URL `?step=3` is accepted when `urlStep > 0 && urlStep <= 5`, even if true progress is lower.
- `src/components/RegistrationV2/steps/Step3PlanSelection.tsx`: checkout validates plan and terms only; it does not validate `data.petBasic`.
- `src/components/PlanSelection/PlanSelection.tsx`: legacy checkout can call `purchasePlansWithCheckout` without checking registration V2 state or pet data.
- `public/widgets/plan-selection-widget.js`: Webflow widget can call checkout for any logged-in member without checking pets.
- `src/app/api/admin/members/route.ts`: admin intentionally includes paid users and annotates `petCount: 0` as `infoStatus: incomplete`, but it does not separate them from review-ready requests.
- `public/widgets/unified-membership-widget.js`: already has a "paid but registration incomplete" view, which confirms this state exists in the product model.

## Files To Create Or Modify

- Create: `scripts/audit-paid-member-without-pets.mjs`
  - CLI script to inspect one or more emails across Supabase, Memberstack, and Stripe.
- Create: `src/utils/registration-completeness.js`
  - Runtime-safe shared helpers for validating pet basics before checkout. JavaScript is chosen because it can be tested directly by existing `.mjs` tests and imported by TS/TSX under `allowJs`.
- Create: `src/utils/registration-completeness.d.ts`
  - Type declarations for strict TypeScript imports.
- Create: `tests/registration-completeness.test.mjs`
  - Unit tests for pre-payment gating and step clamping.
- Modify: `src/components/RegistrationV2/NewRegistrationFlow.tsx`
  - Clamp URL-driven steps and recovery flows so Step 3 cannot be reached without pet basics unless the user already paid and is finishing onboarding.
- Modify: `src/components/RegistrationV2/steps/Step3PlanSelection.tsx`
  - Disable/block checkout if pet basics are missing or invalid.
- Modify: `src/components/PlanSelection/PlanSelection.tsx`
  - Redirect legacy plan selection to `/registro` unless the user has completed pet capture.
- Modify: `src/app/seleccion-plan/PlanSelectionContent.tsx`
  - Make `/seleccion-plan` a compatibility redirect to `/registro?reason=complete_payment` or `/registro`.
- Modify: `public/widgets/plan-selection-widget.js`
  - Add a client-side guard before checkout using Memberstack custom fields.
- Modify: `src/app/api/admin/members/route.ts`
  - Expose `registrationIssue: 'paid_without_pets'` for paid users with no pets, and optionally filter them separately.
- Optional modify: `src/components/Admin/RequestsTable.tsx`
  - Visually separate paid-without-pets users from normal review queue.

---

## Task 1: Add Data Recovery Audit Script

**Files:**
- Create: `scripts/audit-paid-member-without-pets.mjs`

- [ ] **Step 1: Create the script**

Add this file:

```js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const emails = process.argv.slice(2).map((email) => email.trim().toLowerCase()).filter(Boolean);

if (emails.length === 0) {
  console.error('Usage: node scripts/audit-paid-member-without-pets.mjs email@example.com [more@email.com]');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const memberstackKey = process.env.MEMBERSTACK_ADMIN_SECRET_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stripe = stripeKey ? new Stripe(stripeKey) : null;

async function getMemberstackMemberByEmail(email) {
  if (!memberstackKey) return null;

  let after = null;
  for (let page = 0; page < 20; page += 1) {
    const url = new URL('https://admin.memberstack.com/members');
    url.searchParams.set('limit', '100');
    if (after) url.searchParams.set('after', after);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': memberstackKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Memberstack error ${response.status}: ${text}`);
    }

    const body = await response.json();
    const member = (body.data || []).find((item) => item.auth?.email?.toLowerCase() === email);
    if (member) return member;

    if (!body.hasNextPage || !body.endCursor) break;
    after = body.endCursor;
  }

  return null;
}

function extractPetCandidatesFromUser(user) {
  const candidates = [];
  if (user?.pet_name || user?.pet_type || user?.pet_age) {
    candidates.push({
      source: 'supabase.users pet_* columns',
      slot: 1,
      name: user.pet_name || '',
      petType: user.pet_type || '',
      age: user.pet_age || '',
      ageUnit: user.pet_age_unit || '',
    });
  }
  return candidates;
}

function extractPetCandidatesFromMemberstack(member) {
  const fields = member?.customFields || {};
  const candidates = [];

  for (let slot = 1; slot <= 3; slot += 1) {
    const name = fields[`pet-${slot}-name`];
    const type = fields[`pet-${slot}-type`];
    const age = fields[`pet-${slot}-age`];
    const ageUnit = fields[`pet-${slot}-age-unit`];
    if (name || type || age) {
      candidates.push({
        source: 'memberstack customFields pet-N-*',
        slot,
        name: name || '',
        petType: type || '',
        age: age || '',
        ageUnit: ageUnit || '',
      });
    }
  }

  if (candidates.length === 0 && (fields['pet-name'] || fields['pet-type'] || fields['pet-age'])) {
    candidates.push({
      source: 'memberstack customFields legacy pet-*',
      slot: 1,
      name: fields['pet-name'] || '',
      petType: fields['pet-type'] || '',
      age: fields['pet-age'] || '',
      ageUnit: fields['pet-age-unit'] || '',
    });
  }

  return candidates;
}

async function getStripeSummary(email) {
  if (!stripe) return { configured: false };

  const customers = await stripe.customers.list({ email, limit: 10 });
  const summaries = [];

  for (const customer of customers.data) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 10,
    });
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customer.id,
      limit: 10,
    });
    const sessions = await stripe.checkout.sessions.list({
      customer: customer.id,
      limit: 10,
    });

    summaries.push({
      customerId: customer.id,
      customerEmail: customer.email,
      subscriptions: subscriptions.data.map((sub) => ({
        id: sub.id,
        status: sub.status,
        created: new Date(sub.created * 1000).toISOString(),
      })),
      successfulPayments: paymentIntents.data
        .filter((intent) => intent.status === 'succeeded')
        .map((intent) => ({
          id: intent.id,
          amount: intent.amount,
          currency: intent.currency,
          created: new Date(intent.created * 1000).toISOString(),
        })),
      checkoutSessions: sessions.data.map((session) => ({
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        successUrl: session.success_url,
        cancelUrl: session.cancel_url,
        created: new Date(session.created * 1000).toISOString(),
      })),
    });
  }

  return { configured: true, customers: summaries };
}

for (const email of emails) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  const member = await getMemberstackMemberByEmail(email);
  const memberstackId = user?.memberstack_id || member?.id || null;

  let pets = [];
  if (user?.id) {
    const { data: petsData, error: petsError } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true });
    if (petsError) throw petsError;
    pets = petsData || [];
  }

  const candidatePets = [
    ...extractPetCandidatesFromUser(user),
    ...extractPetCandidatesFromMemberstack(member),
  ];

  const stripeSummary = await getStripeSummary(email);

  const report = {
    email,
    supabaseUserFound: !!user,
    supabaseUserError: userError?.message || null,
    memberstackFound: !!member,
    memberstackId,
    registrationStep: user?.registration_step || member?.customFields?.['registration-step'] || null,
    membershipStatus: user?.membership_status || null,
    paymentStatus: member?.customFields?.['payment-status'] || null,
    checkoutPending: member?.customFields?.['checkout-pending'] || null,
    memberstackPlanConnections: member?.planConnections || [],
    petsInSupabaseCount: pets.length,
    petsInSupabase: pets.map((pet) => ({
      id: pet.id,
      name: pet.name,
      petType: pet.pet_type,
      status: pet.status,
      createdAt: pet.created_at,
      memberstackSlot: pet.memberstack_slot,
    })),
    candidatePets,
    recoveryRecommendation:
      pets.length > 0
        ? 'No recovery needed: pets table has records.'
        : candidatePets.length > 0
          ? 'Recoverable: create pets rows from candidatePets after manual validation.'
          : 'Not recoverable from app records: contact customer or inspect external CRM/webflow logs.',
    stripeSummary,
  };

  console.log(JSON.stringify(report, null, 2));
}
```

- [ ] **Step 2: Run the script for the reported customer**

Run:

```bash
node scripts/audit-paid-member-without-pets.mjs ibrodriguezj@gmail.com
```

Expected:

- Prints a JSON report.
- `petsInSupabaseCount` shows whether admin count is accurate.
- `candidatePets` shows whether the pet can be recovered from `users.pet_*` or Memberstack custom fields.
- `stripeSummary` confirms paid status and checkout session URLs.

- [ ] **Step 3: Categorize recovery result**

Use these outcomes:

```text
recoverable_auto:
  petsInSupabaseCount = 0
  candidatePets has at least one record with name, petType, and age

recoverable_manual_review:
  petsInSupabaseCount = 0
  candidatePets has partial pet data

not_recoverable_from_app:
  petsInSupabaseCount = 0
  candidatePets is empty
  Stripe shows successful payment
```

---

## Task 2: Add Shared Pre-Payment Completeness Helpers

**Files:**
- Create: `src/utils/registration-completeness.js`
- Create: `src/utils/registration-completeness.d.ts`
- Create: `tests/registration-completeness.test.mjs`

- [ ] **Step 1: Add failing tests**

Create `tests/registration-completeness.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasValidPetBasic,
  normalizePetBasicList,
  clampRequestedRegistrationStep,
  getRegistrationIssue,
} from '../src/utils/registration-completeness.js';

test('hasValidPetBasic requires at least one complete pet', () => {
  assert.equal(hasValidPetBasic(undefined), false);
  assert.equal(hasValidPetBasic([]), false);
  assert.equal(hasValidPetBasic([{ petName: 'Luna' }]), false);
  assert.equal(hasValidPetBasic([{ petName: 'Luna', petType: 'perro', petAge: 2, petAgeUnit: 'years' }]), true);
});

test('normalizePetBasicList supports legacy single pet object', () => {
  const result = normalizePetBasicList({
    petName: 'Michi',
    petType: 'gato',
    petAge: '4',
    petAgeUnit: 'years',
  });

  assert.deepEqual(result, [
    {
      petName: 'Michi',
      petType: 'gato',
      petAge: 4,
      petAgeUnit: 'years',
    },
  ]);
});

test('clampRequestedRegistrationStep prevents jumping to payment without pet basics', () => {
  const result = clampRequestedRegistrationStep({
    requestedStep: 3,
    computedStep: 2,
    hasValidPetBasic: false,
    hasPetsInDb: false,
    paymentCompleted: false,
    finishOnboarding: false,
  });

  assert.equal(result, 2);
});

test('clampRequestedRegistrationStep allows paid users to finish onboarding at profile step', () => {
  const result = clampRequestedRegistrationStep({
    requestedStep: 5,
    computedStep: 4,
    hasValidPetBasic: false,
    hasPetsInDb: false,
    paymentCompleted: true,
    finishOnboarding: true,
  });

  assert.equal(result, 4);
});

test('getRegistrationIssue detects paid member without pets', () => {
  assert.equal(
    getRegistrationIssue({
      hasActivePlan: true,
      petCount: 0,
      hasValidPetBasic: false,
    }),
    'paid_without_pets',
  );
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
node --test tests/registration-completeness.test.mjs
```

Expected:

```text
ERR_MODULE_NOT_FOUND
```

- [ ] **Step 3: Add implementation**

Create `src/utils/registration-completeness.js`:

```js
const VALID_PET_TYPES = new Set(['perro', 'gato', 'dog', 'cat']);

export function normalizePetBasicList(value) {
  const rawPets = Array.isArray(value) ? value : value ? [value] : [];

  return rawPets
    .map((pet) => {
      const petName = String(pet?.petName || pet?.name || '').trim();
      const rawType = String(pet?.petType || pet?.pet_type || '').trim().toLowerCase();
      const petType = rawType === 'dog' ? 'perro' : rawType === 'cat' ? 'gato' : rawType;
      const petAge = Number(pet?.petAge ?? pet?.age ?? pet?.age_value ?? 0);
      const rawAgeUnit = String(pet?.petAgeUnit || pet?.ageUnit || pet?.age_unit || 'years').trim();
      const petAgeUnit = rawAgeUnit === 'months' ? 'months' : 'years';

      return { petName, petType, petAge, petAgeUnit };
    })
    .filter((pet) => pet.petName || pet.petType || pet.petAge);
}

export function hasValidPetBasic(value) {
  return normalizePetBasicList(value).some((pet) => (
    pet.petName.length > 0 &&
    VALID_PET_TYPES.has(pet.petType) &&
    Number.isFinite(pet.petAge) &&
    pet.petAge > 0 &&
    (pet.petAgeUnit === 'years' || pet.petAgeUnit === 'months')
  ));
}

export function clampRequestedRegistrationStep({
  requestedStep,
  computedStep,
  hasValidPetBasic: validPetBasic,
  hasPetsInDb,
  paymentCompleted,
  finishOnboarding,
}) {
  const safeComputedStep = Number.isFinite(Number(computedStep)) ? Number(computedStep) : 1;
  const safeRequestedStep = Number.isFinite(Number(requestedStep)) ? Number(requestedStep) : 0;
  let finalStep = Math.max(safeComputedStep, 1);

  if (safeRequestedStep > 0 && safeRequestedStep <= 6) {
    finalStep = safeRequestedStep;
  }

  const hasAnyPetEvidence = Boolean(validPetBasic || hasPetsInDb);

  if (!hasAnyPetEvidence && !paymentCompleted && finalStep >= 3) {
    return 2;
  }

  if (!hasAnyPetEvidence && paymentCompleted && finishOnboarding && finalStep >= 4) {
    return 4;
  }

  return finalStep;
}

export function getRegistrationIssue({ hasActivePlan, petCount, hasValidPetBasic: validPetBasic }) {
  if (hasActivePlan && Number(petCount || 0) === 0 && !validPetBasic) {
    return 'paid_without_pets';
  }

  if (hasActivePlan && Number(petCount || 0) === 0 && validPetBasic) {
    return 'paid_without_complete_pet_rows';
  }

  return null;
}
```

- [ ] **Step 4: Add TypeScript declarations**

Create `src/utils/registration-completeness.d.ts`:

```ts
export interface NormalizedPetBasic {
  petName: string;
  petType: string;
  petAge: number;
  petAgeUnit: 'years' | 'months';
}

export interface ClampRegistrationStepInput {
  requestedStep?: number;
  computedStep?: number;
  hasValidPetBasic: boolean;
  hasPetsInDb: boolean;
  paymentCompleted: boolean;
  finishOnboarding: boolean;
}

export type RegistrationIssue =
  | 'paid_without_pets'
  | 'paid_without_complete_pet_rows'
  | null;

export function normalizePetBasicList(value: unknown): NormalizedPetBasic[];
export function hasValidPetBasic(value: unknown): boolean;
export function clampRequestedRegistrationStep(input: ClampRegistrationStepInput): number;
export function getRegistrationIssue(input: {
  hasActivePlan: boolean;
  petCount: number;
  hasValidPetBasic: boolean;
}): RegistrationIssue;
```

- [ ] **Step 5: Run test and verify it passes**

Run:

```bash
node --test tests/registration-completeness.test.mjs
```

Expected:

```text
# pass 5
```

---

## Task 3: Harden V2 Step Routing And Checkout

**Files:**
- Modify: `src/components/RegistrationV2/NewRegistrationFlow.tsx`
- Modify: `src/components/RegistrationV2/steps/Step3PlanSelection.tsx`

- [ ] **Step 1: Import helpers in V2 flow**

In `src/components/RegistrationV2/NewRegistrationFlow.tsx`, add:

```ts
import {
    clampRequestedRegistrationStep,
    hasValidPetBasic,
} from '@/utils/registration-completeness';
```

- [ ] **Step 2: Replace URL step trust with clamped step**

Replace the block that directly assigns `finalStep = urlStep` with:

```ts
const nativeReason = nativeParams.get('reason') || '';
const finishOnboarding = nativeReason === 'finish_onboarding';
const paymentCompleted = isPaymentSuccess || paymentStatus === 'completed' || hasActivePlan;
const validPetBasic = hasValidPetBasic(loadedData.petBasic);

finalStep = clampRequestedRegistrationStep({
    requestedStep: urlStep,
    computedStep: finalStep,
    hasValidPetBasic: validPetBasic,
    hasPetsInDb,
    paymentCompleted,
    finishOnboarding,
});
```

Expected behavior:

- `?step=3` no longer opens payment if there is no pet evidence.
- `?reason=finish_onboarding` for a paid user with no pets starts at Step 4, so the user can complete profile and then Step 5 pets.

- [ ] **Step 3: Add pre-checkout guard in `handleStep3Complete`**

At the top of `handleStep3Complete`, before calculating referral waiting period, add:

```ts
if (!hasValidPetBasic(registrationData.petBasic)) {
    console.warn('Checkout blocked: missing valid petBasic data');
    showToast('Antes de pagar necesitamos registrar al menos una mascota.', 'error');
    goToStep(2);
    return;
}
```

- [ ] **Step 4: Import helper in Step 3 component**

In `src/components/RegistrationV2/steps/Step3PlanSelection.tsx`, add:

```ts
import { hasValidPetBasic } from '@/utils/registration-completeness';
```

- [ ] **Step 5: Block the UI button when pet basics are missing**

In `handleContinue`, before checking `selectedPlan`, add:

```ts
if (!hasValidPetBasic(data?.petBasic)) {
    showToast('Antes de pagar necesitamos registrar al menos una mascota.', 'error');
    onBack();
    return;
}
```

Update the primary button disabled condition:

```tsx
disabled={isProcessing || !hasValidPetBasic(data?.petBasic)}
```

- [ ] **Step 6: Run type check**

Run:

```bash
npm run type-check
```

Expected:

```text
No TypeScript errors.
```

---

## Task 4: Disable Legacy Checkout Bypass

**Files:**
- Modify: `src/app/seleccion-plan/PlanSelectionContent.tsx`
- Modify: `src/components/PlanSelection/PlanSelection.tsx`
- Modify: `public/widgets/plan-selection-widget.js`

- [ ] **Step 1: Redirect `/seleccion-plan` into V2**

In `src/app/seleccion-plan/PlanSelectionContent.tsx`, replace the initial effect body with:

```ts
useEffect(() => {
    const reason = searchParams.get('reason');
    const recuperar = searchParams.get('recuperar');

    if (reason === 'complete_payment' || recuperar === '1') {
        router.replace('/registro?reason=complete_payment');
        return;
    }

    router.replace('/registro');
}, [router, searchParams]);
```

Expected:

- Direct visits to `/seleccion-plan` no longer expose legacy checkout.
- Recovery links land in V2 Step 3 only if V2 validation allows it.

- [ ] **Step 2: Add defensive guard to legacy component**

In `src/components/PlanSelection/PlanSelection.tsx`, before `purchasePlansWithCheckout`, add:

```ts
const { data: member } = await window.$memberstackDom.getCurrentMember();
const fields = member?.customFields || {};
const hasPetFields = Boolean(
    fields['pet-1-name'] ||
    fields['pet-name'] ||
    Number(fields['total-pets'] || 0) > 0
);

if (!hasPetFields) {
    window.location.href = '/registro';
    return;
}
```

- [ ] **Step 3: Add defensive guard to Webflow plan widget**

In `public/widgets/plan-selection-widget.js`, before line that calls `purchasePlansWithCheckout`, add:

```js
const fields = member.data.customFields || {};
const hasPetFields = Boolean(
    fields['pet-1-name'] ||
    fields['pet-name'] ||
    Number(fields['total-pets'] || 0) > 0
);

if (!hasPetFields) {
    window.location.href = 'https://app.pataamiga.mx/registro';
    return;
}
```

- [ ] **Step 4: Search for remaining checkout calls**

Run:

```bash
rg -n "purchasePlansWithCheckout|successUrl: window.location.origin \\+ '/payment-success'" src public webflow-components
```

Expected:

- V2 checkout remains.
- Legacy paths have guards or redirects.

---

## Task 5: Mark Paid Members With 0 Pets In Admin

**Files:**
- Modify: `src/app/api/admin/members/route.ts`
- Optional modify: `src/components/Admin/RequestsTable.tsx`

- [ ] **Step 1: Add issue field to admin API**

In `src/app/api/admin/members/route.ts`, import:

```ts
import { getRegistrationIssue } from '@/utils/registration-completeness';
```

Update the `membersWithCounts` return object:

```ts
const petCount = enriched?.petCount || 0;
const hasBasicPetFields = Boolean(
    member.customFields?.['pet-1-name'] ||
    member.customFields?.['pet-name'] ||
    Number(member.customFields?.['total-pets'] || 0) > 0
);

return {
    ...member,
    petCount,
    pendingPetCount: enriched?.pendingPetCount || 0,
    infoStatus: enriched?.infoStatus || (petCount === 0 ? 'incomplete' : 'complete'),
    registrationIssue: getRegistrationIssue({
        hasActivePlan: paymentStatus === 'active' || paymentStatus === 'trialing',
        petCount,
        hasValidPetBasic: hasBasicPetFields,
    }),
    paymentStatus,
    supabaseFirstName: enriched?.firstName,
    supabaseLastName: enriched?.lastName
};
```

- [ ] **Step 2: Optional UI label in RequestsTable**

In `src/components/Admin/RequestsTable.tsx`, when rendering member chips near the pet count, add:

```tsx
{request.registrationIssue === 'paid_without_pets' && (
    <span className={styles.warningBadge}>Pago sin mascotas</span>
)}
```

If `styles.warningBadge` does not exist, add:

```css
.warningBadge {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 999px;
    background: #fff3cd;
    color: #7a4b00;
    font-size: 12px;
    font-weight: 700;
}
```

- [ ] **Step 3: Verify admin API manually**

Run local dev server and call:

```bash
npm run dev
```

Then in the browser or authenticated admin session, inspect `/api/admin/members?status=all`.

Expected:

- Paid users with no pets return `registrationIssue: "paid_without_pets"` or `"paid_without_complete_pet_rows"`.
- Normal users with pets return `registrationIssue: null`.

---

## Task 6: Recover Existing Customers

**Files:**
- Use script from Task 1.
- Optional create: `scripts/recover-pets-from-audit.mjs` only after manual confirmation.

- [ ] **Step 1: Audit the known customer**

Run:

```bash
node scripts/audit-paid-member-without-pets.mjs ibrodriguezj@gmail.com
```

Expected:

- If `candidatePets` has complete data, continue to Step 2.
- If `candidatePets` is empty, do not fabricate pet records. Contact customer or check CRM/Webflow logs.

- [ ] **Step 2: For complete candidate pet data, create manual recovery SQL**

Use this shape after replacing values from the audit output:

```sql
insert into pets (
  owner_id,
  memberstack_slot,
  name,
  pet_type,
  age_value,
  age_unit,
  status,
  basic_info_completed,
  complementary_info_completed,
  created_at
)
select
  id,
  1,
  'REPLACE_WITH_PET_NAME',
  case
    when lower('REPLACE_WITH_PET_TYPE') in ('gato', 'cat') then 'cat'
    else 'dog'
  end,
  REPLACE_WITH_AGE_NUMBER,
  'REPLACE_WITH_AGE_UNIT',
  'pending',
  true,
  false,
  now()
from users
where email = 'ibrodriguezj@gmail.com'
and not exists (
  select 1
  from pets
  where pets.owner_id = users.id
);
```

- [ ] **Step 3: Update user status after recovery**

Run:

```sql
update users
set
  registration_step = greatest(coalesce(registration_step, 1), 5),
  membership_status = 'pending',
  approval_status = 'pending'
where email = 'ibrodriguezj@gmail.com';
```

- [ ] **Step 4: Re-audit the customer**

Run:

```bash
node scripts/audit-paid-member-without-pets.mjs ibrodriguezj@gmail.com
```

Expected:

- `petsInSupabaseCount` is at least `1`.
- `recoveryRecommendation` is `No recovery needed: pets table has records.`

---

## Task 7: QA And Build Verification

**Files:**
- No new files unless bugs are found.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
node --test tests/registration-completeness.test.mjs
```

Expected:

```text
pass
```

- [ ] **Step 2: Run type check**

Run:

```bash
npm run type-check
```

Expected:

```text
No TypeScript errors.
```

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected:

```text
No lint errors.
```

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected:

```text
Compiled successfully
```

- [ ] **Step 5: Manual browser checks**

Check these flows:

```text
1. New user -> Step 1 -> direct URL /registro?step=3
   Expected: user stays at Step 2 if no pet was entered.

2. New user -> Step 1 -> Step 2 valid pet -> Step 3
   Expected: checkout button enabled.

3. Existing paid user with 0 pets -> /registro?reason=finish_onboarding
   Expected: user can complete profile/pets, not redirected away.

4. /seleccion-plan direct visit
   Expected: redirects to /registro.

5. Webflow plan widget for logged-in user without pet fields
   Expected: redirects to app registration instead of opening checkout.
```

---

## Self-Review

**Spec coverage:**

- Recover existing paid users with 0 pets: Task 1 and Task 6.
- Investigate `ibrodriguezj@gmail.com`: Task 1 Step 2 and Task 6.
- Prevent future checkout bypass: Tasks 2, 3, and 4.
- Make admin state clearer: Task 5.
- Verify robustness: Task 7.

**Placeholder scan:** No `TBD`, `TODO`, or "implement later" remains in this plan.

**Risk notes:**

- Do not auto-create pet records unless `candidatePets` includes enough data and the business confirms it is acceptable.
- If candidate data is only in Stripe metadata or external CRM, add that source to the audit script before recovery.
- Do not commit or push without explicit user authorization.
- Work directly on `main` for this project unless the user explicitly requests a branch.

---

## Implementation Progress - 2026-06-01

- Created shared registration completeness helpers and Node tests.
- Added V2 step clamping so `?step=3` cannot bypass pet capture.
- Added checkout guards in Registration V2, legacy plan selection, `/seleccion-plan`, and the public plan-selection widget.
- Added admin API/UI tagging for `paid_without_pets` and `paid_without_complete_pet_rows`.
- Created read-only audit script for paid members with 0 pets.
- Audited `ibrodriguezj@gmail.com`: Supabase user exists, `registration_step = 2`, `membership_status = pending`, 0 pets in Supabase, no recoverable pet candidates in app records. Stripe could not be confirmed locally because `STRIPE_SECRET_KEY` is not configured in this environment.
