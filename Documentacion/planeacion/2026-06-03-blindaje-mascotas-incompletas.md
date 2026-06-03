# Blindaje de Mascotas Incompletas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent public widgets and recovery flows from creating or approving pet records without required fields such as species, age, sex, breed state, and coat color, while giving admins a clear way to identify and recover existing incomplete records.

**Architecture:** Add a shared server-safe pet completeness validator and apply it at every write boundary that can create or complete a pet. Keep Step 2 preliminary pet rows allowed, but require full validation before a pet is marked complete, before a public widget add is accepted, and before a recovery update marks complementary info complete. Add an audit script and admin issue flags so existing records like Max and Paris can be recovered intentionally.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict mode, Supabase service role, Memberstack Admin/DOM APIs, public Webflow widgets, Node `.mjs` tests.

---

## Evidence From 2026-06-03 Audit

Audited with:

```bash
node scripts\audit-paid-member-without-pets.mjs cesar.alcantar08@gmail.com vane_vane122@hotmail.com
```

The first run was blocked by sandbox network permissions. The approved rerun succeeded.

### `cesar.alcantar08@gmail.com`

- Supabase user exists: `3dcfd827-e0ad-48ea-863f-dd6a27f276b4`
- Memberstack ID: `mem_cmpk540tf0g390rsdhg8lg1ub`
- `registration_step`: `2`
- `membership_status`: `pending`
- `paymentStatus`: `null`
- `memberstackPlanConnections`: `[]`
- Pet row exists, created `2026-05-27T06:26:44.738+00:00`
- Pet: `Max`
- Present: `breed = "Mestizo"`, `photo_url`, `photo2_url`, `photo3_url`, `photo4_url`, `photo5_url`
- Missing required: `pet_type`, `gender`, `age_value`, `age`, `coat_color`
- Also missing optional/secondary physical fields: `nose_color`, `eye_color`
- Flags: `basic_info_completed = false`, `complementary_info_completed = false`

### `vane_vane122@hotmail.com`

- Supabase user exists: `c14407d9-473b-46e8-8e36-8c8631d0fc9d`
- Memberstack ID: `mem_cmpip2iea0b310stx3nq35vsb`
- `registration_step`: `2`
- `membership_status`: `pending`
- `paymentStatus`: `null`
- `memberstackPlanConnections`: `[]`
- Pet row exists, created `2026-05-27T01:45:44.731+00:00`
- Pet: `Paris`
- Present: `breed = "Border Collie"`, `photo_url`
- Missing required: `pet_type`, `gender`, `age_value`, `age`, `coat_color`
- Also missing optional/secondary physical fields: `nose_color`, `eye_color`
- Flags: `basic_info_completed = false`, `complementary_info_completed = false`
- Status: `action_required`

## Root Cause Hypothesis

These records most likely came through a public add-pet path that accepted partial payloads, especially `POST /api/user/pets/add`, because that endpoint can insert a pet with `name`, `breed`, and photos while leaving `pet_type`, `gender`, `age_value`, and `coat_color` unset.

This is consistent with the database evidence:

- `src/app/api/user/pets/add/route.ts` only validates `memberstackId` and `petData`, not required pet fields.
- `src/app/api/user/pets/add/route.ts` only adds `pet_type`, `gender`, `age_value`, and `coat_color` conditionally when the payload includes them.
- The `pets` table migrations add those columns without `NOT NULL`, so Supabase allows incomplete rows.
- Current V2 checkout guard is working for basic pet data, but Step 5 assumes Step 2 already captured species/age and currently validates only `gender`, `coatColor`, breed when not mixed, and `name`.
- Recovery link `complete_pet_info` sends users with any pet row to Step 5, but current V2 reconstruction does not build `petBasic` from `petsResult`. For users like Max/Paris where `users.pet_*` and Memberstack pet fields are empty, Step 5 can render a generic fallback instead of preloading the existing row.

## Files To Create Or Modify

- Create: `src/utils/pet-required-fields.js`
  - Shared runtime helper for validating required pet fields from API payloads, Supabase rows, and V2 form state.
- Create: `src/utils/pet-required-fields.d.ts`
  - Type declarations for strict TypeScript imports.
- Create: `tests/pet-required-fields.test.mjs`
  - Unit tests for incomplete payloads, complete payloads, preliminary Step 2 rows, and Supabase row audit.
- Modify: `src/app/api/user/pets/add/route.ts`
  - Reject public add-pet requests that do not include required complete-pet fields.
- Modify: `src/app/api/user/add-pet/route.ts`
  - Apply the same complete-pet validation to the legacy complete-profile widget endpoint.
- Modify: `src/app/api/user/pets/[petId]/update/route.ts`
  - Do not set `complementary_info_completed = true` unless merged existing + submitted fields pass required validation.
- Modify: `src/app/actions/user.actions.ts`
  - Keep preliminary Step 2 rows possible, but validate when `pet.isComplete === true`; set `basic_info_completed` from actual species/name/age validity, not blindly.
- Modify: `src/components/RegistrationV2/NewRegistrationFlow.tsx`
  - Reconstruct `registrationData.petBasic` from Supabase pet rows when Memberstack/user fallback fields are missing.
- Modify: `src/components/RegistrationV2/steps/Step5CompletePet.tsx`
  - Validate species and age in addition to current sex/color/breed checks, especially for recovery cases.
- Modify: `public/widgets/pet-cards-widget.js`
  - Keep client-side validation aligned with server helper requirements and ensure payload always sends `petType`, `ageValue`, `ageUnit`, `gender`, `breed/isMixed`, and `coatColor`.
- Modify: `public/widgets/complete-profile-widget.js`
  - Keep client-side validation aligned with server helper requirements before calling `/api/user/add-pet` or pet update.
- Optional modify: `webflow-components/pet-cards-section.html`
  - Update static embedded reference if this file is still used by Webflow copy-paste installs.
- Create: `scripts/audit-incomplete-pets.mjs`
  - CLI audit for existing incomplete active/pending/action_required pets, with `--emails` and `--all` modes.
- Modify: `src/app/api/admin/members/route.ts`
  - Add `petCompletenessIssue` metadata for members with existing pet rows missing required fields.
- Modify: `src/app/api/admin/members/[id]/route.ts`
  - Include missing pet field details in member detail payload.
- Modify: `src/components/Admin/RequestsTable.tsx`
  - Surface `pets_missing_required_fields` as a separate visual tag/filter.
- Modify: `src/components/Admin/MemberDetailModal.tsx`
  - Show missing field summary and recovery-link action when pet rows exist but required pet fields are missing.

---

## Task 1: Create Required Pet Field Validator

**Files:**
- Create: `src/utils/pet-required-fields.js`
- Create: `src/utils/pet-required-fields.d.ts`
- Create: `tests/pet-required-fields.test.mjs`

- [ ] **Step 1: Write failing tests for the validator**

Create `tests/pet-required-fields.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMissingCompletePetFields,
  hasCompleteRequiredPetFields,
  hasValidBasicPetFields,
  normalizePetWriteInput,
} from '../src/utils/pet-required-fields.js';

test('hasValidBasicPetFields requires name, species, and age', () => {
  assert.equal(hasValidBasicPetFields({ name: 'Max', petType: 'perro', ageValue: 3, ageUnit: 'years' }), true);
  assert.equal(hasValidBasicPetFields({ name: 'Max', breed: 'Mestizo' }), false);
  assert.equal(hasValidBasicPetFields({ name: 'Max', petType: 'perro', ageValue: 0, ageUnit: 'years' }), false);
});

test('getMissingCompletePetFields detects Max-like incomplete row', () => {
  const missing = getMissingCompletePetFields({
    name: 'Max',
    breed: 'Mestizo',
    photo_url: 'https://example.com/max.jpg',
    pet_type: null,
    gender: null,
    age_value: null,
    age_unit: 'years',
    coat_color: null,
    is_mixed_breed: false,
  });

  assert.deepEqual(missing.sort(), ['age', 'coatColor', 'gender', 'petType'].sort());
});

test('complete public add payload passes required validation', () => {
  const input = normalizePetWriteInput({
    name: 'Paris',
    petType: 'perro',
    ageValue: 4,
    ageUnit: 'years',
    gender: 'hembra',
    breed: 'Border Collie',
    isMixed: false,
    coatColor: 'Blanco y negro',
  });

  assert.equal(hasCompleteRequiredPetFields(input), true);
  assert.deepEqual(getMissingCompletePetFields(input), []);
});

test('breed is required when pet is not mixed', () => {
  const missing = getMissingCompletePetFields({
    name: 'Paris',
    petType: 'perro',
    ageValue: 4,
    ageUnit: 'years',
    gender: 'hembra',
    isMixed: false,
    coatColor: 'Blanco y negro',
  });

  assert.equal(missing.includes('breed'), true);
});

test('mixed pets do not require explicit breed text', () => {
  const missing = getMissingCompletePetFields({
    name: 'Max',
    petType: 'perro',
    ageValue: 3,
    ageUnit: 'years',
    gender: 'macho',
    isMixed: true,
    coatColor: 'Cafe',
  });

  assert.deepEqual(missing, []);
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
node --test tests/pet-required-fields.test.mjs
```

Expected: fails because `src/utils/pet-required-fields.js` does not exist.

- [ ] **Step 3: Implement the validator**

Create `src/utils/pet-required-fields.js`:

```js
const VALID_PET_TYPES = new Set(['perro', 'gato', 'dog', 'cat']);
const VALID_GENDERS = new Set(['macho', 'hembra']);
const MIXED_BREEDS = new Set(['mestizo', 'domestico', 'doméstico']);

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePetType(value) {
  const raw = cleanString(value).toLowerCase();
  if (raw === 'dog') return 'perro';
  if (raw === 'cat') return 'gato';
  return raw;
}

function normalizeBoolean(value) {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function normalizePetWriteInput(input = {}) {
  const ageValue = Number(input.ageValue ?? input.petAge ?? input.age_value ?? input.age ?? 0);
  const petType = normalizePetType(input.petType ?? input.pet_type);
  const gender = cleanString(input.gender).toLowerCase();
  const breed = cleanString(input.breed);
  const isMixedValue = normalizeBoolean(input.isMixed ?? input.isMixedBreed ?? input.is_mixed_breed);
  const inferredMixed = MIXED_BREEDS.has(breed.toLowerCase());

  return {
    name: cleanString(input.name ?? input.petName),
    petType,
    ageValue,
    ageUnit: cleanString(input.ageUnit ?? input.petAgeUnit ?? input.age_unit) || 'years',
    gender,
    breed,
    isMixed: isMixedValue === undefined ? inferredMixed : isMixedValue,
    coatColor: cleanString(input.coatColor ?? input.coat_color),
  };
}

function hasValidBasicPetFields(input = {}) {
  const pet = normalizePetWriteInput(input);
  return Boolean(
    pet.name &&
    VALID_PET_TYPES.has(pet.petType) &&
    Number.isFinite(pet.ageValue) &&
    pet.ageValue > 0 &&
    (pet.ageUnit === 'years' || pet.ageUnit === 'months')
  );
}

function getMissingCompletePetFields(input = {}) {
  const pet = normalizePetWriteInput(input);
  const missing = [];

  if (!pet.name) missing.push('name');
  if (!VALID_PET_TYPES.has(pet.petType)) missing.push('petType');
  if (!Number.isFinite(pet.ageValue) || pet.ageValue <= 0) missing.push('age');
  if (!VALID_GENDERS.has(pet.gender)) missing.push('gender');
  if (pet.isMixed !== true && !pet.breed) missing.push('breed');
  if (!pet.coatColor) missing.push('coatColor');

  return missing;
}

function hasCompleteRequiredPetFields(input = {}) {
  return getMissingCompletePetFields(input).length === 0;
}

module.exports = {
  getMissingCompletePetFields,
  hasCompleteRequiredPetFields,
  hasValidBasicPetFields,
  normalizePetWriteInput,
};
```

- [ ] **Step 4: Add TypeScript declarations**

Create `src/utils/pet-required-fields.d.ts`:

```ts
export interface NormalizedPetWriteInput {
  name: string;
  petType: string;
  ageValue: number;
  ageUnit: string;
  gender: string;
  breed: string;
  isMixed: boolean;
  coatColor: string;
}

export type MissingPetField =
  | 'name'
  | 'petType'
  | 'age'
  | 'gender'
  | 'breed'
  | 'coatColor';

export function normalizePetWriteInput(input?: Record<string, unknown>): NormalizedPetWriteInput;
export function hasValidBasicPetFields(input?: Record<string, unknown>): boolean;
export function getMissingCompletePetFields(input?: Record<string, unknown>): MissingPetField[];
export function hasCompleteRequiredPetFields(input?: Record<string, unknown>): boolean;
```

- [ ] **Step 5: Verify validator tests pass**

Run:

```bash
node --test tests/pet-required-fields.test.mjs
```

Expected: all tests pass.

---

## Task 2: Block Incomplete Public Add-Pet API Writes

**Files:**
- Modify: `src/app/api/user/pets/add/route.ts`
- Modify: `src/app/api/user/add-pet/route.ts`
- Test: `tests/pet-required-fields.test.mjs`

- [ ] **Step 1: Add tests documenting API payload expectations**

Append to `tests/pet-required-fields.test.mjs`:

```js
test('legacy add-pet payload without age and coat color is incomplete', () => {
  const missing = getMissingCompletePetFields({
    memberstackId: 'mem_123',
    name: 'Max',
    petType: 'perro',
    gender: 'macho',
    breed: 'Mestizo',
    isMixed: true,
  });

  assert.deepEqual(missing.sort(), ['age', 'coatColor'].sort());
});

test('pets/add nested petData without petType is incomplete', () => {
  const missing = getMissingCompletePetFields({
    name: 'Paris',
    breed: 'Border Collie',
    photo1Url: 'https://example.com/paris.jpg',
  });

  assert.deepEqual(missing.sort(), ['age', 'coatColor', 'gender', 'petType'].sort());
});
```

- [ ] **Step 2: Run tests**

Run:

```bash
node --test tests/pet-required-fields.test.mjs
```

Expected: pass after Task 1 helper exists.

- [ ] **Step 3: Validate `/api/user/pets/add` before Memberstack or Supabase writes**

In `src/app/api/user/pets/add/route.ts`, add import near the existing imports:

```ts
import { getMissingCompletePetFields } from '@/utils/pet-required-fields';
```

After the existing `if (!memberstackId || !petData)` block, add:

```ts
        const missingRequiredFields = getMissingCompletePetFields(petData);
        if (missingRequiredFields.length > 0) {
            return NextResponse.json({
                success: false,
                error: 'Faltan campos obligatorios de la mascota',
                missingFields: missingRequiredFields,
            }, { status: 400, headers: corsHeaders });
        }
```

- [ ] **Step 4: Validate `/api/user/add-pet` before Supabase writes**

In `src/app/api/user/add-pet/route.ts`, add import near the existing imports:

```ts
import { getMissingCompletePetFields } from '@/utils/pet-required-fields';
```

Replace the current required field guard:

```ts
        if (!memberstackId || !name || !petType) {
            return NextResponse.json(
                { success: false, error: 'Faltan campos requeridos: memberstackId, name, petType' },
                { status: 400, headers: corsHeaders }
            );
        }
```

with:

```ts
        if (!memberstackId) {
            return NextResponse.json(
                { success: false, error: 'Falta memberstackId' },
                { status: 400, headers: corsHeaders }
            );
        }

        const missingRequiredFields = getMissingCompletePetFields({
            name,
            petType,
            ageValue,
            ageUnit,
            gender,
            breed,
            isMixed,
            coatColor,
        });

        if (missingRequiredFields.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Faltan campos obligatorios de la mascota',
                    missingFields: missingRequiredFields,
                },
                { status: 400, headers: corsHeaders }
            );
        }
```

- [ ] **Step 5: Verify focused tests**

Run:

```bash
node --test tests/pet-required-fields.test.mjs
```

Expected: all tests pass.

---

## Task 3: Prevent Partial Updates From Marking Pets Complete

**Files:**
- Modify: `src/app/api/user/pets/[petId]/update/route.ts`
- Test: `tests/pet-required-fields.test.mjs`

- [ ] **Step 1: Add merged-row validation test**

Append to `tests/pet-required-fields.test.mjs`:

```js
test('merged existing pet plus partial photo update remains incomplete', () => {
  const existingPet = {
    name: 'Max',
    breed: 'Mestizo',
    photo_url: 'https://example.com/max.jpg',
    pet_type: null,
    gender: null,
    age_value: null,
    age_unit: 'years',
    coat_color: null,
    is_mixed_breed: false,
  };

  const submittedUpdate = {
    photo1Url: 'https://example.com/new-max.jpg',
  };

  const missing = getMissingCompletePetFields({
    ...existingPet,
    ...submittedUpdate,
  });

  assert.equal(missing.includes('petType'), true);
  assert.equal(missing.includes('age'), true);
  assert.equal(missing.includes('gender'), true);
  assert.equal(missing.includes('coatColor'), true);
});
```

- [ ] **Step 2: Run tests**

Run:

```bash
node --test tests/pet-required-fields.test.mjs
```

Expected: all tests pass.

- [ ] **Step 3: Update API completion logic**

In `src/app/api/user/pets/[petId]/update/route.ts`, import:

```ts
import { getMissingCompletePetFields } from '@/utils/pet-required-fields';
```

Replace:

```ts
        if (gender || coatColor || breed || photo1Url) {
            updateData.complementary_info_completed = true;
        }
```

with:

```ts
        const mergedForCompleteness = {
            ...pet,
            ...updateData,
            name: pet.name,
            petType: pet.pet_type,
            ageValue: pet.age_value,
            ageUnit: pet.age_unit,
            gender: updateData.gender ?? pet.gender,
            breed: updateData.breed ?? pet.breed,
            isMixedBreed: updateData.is_mixed_breed ?? pet.is_mixed_breed,
            coatColor: updateData.coat_color ?? pet.coat_color,
        };
        const missingRequiredFields = getMissingCompletePetFields(mergedForCompleteness);
        if (missingRequiredFields.length === 0) {
            updateData.basic_info_completed = true;
            updateData.complementary_info_completed = true;
        } else if (gender || coatColor || breed || photo1Url) {
            updateData.complementary_info_completed = false;
        }
```

- [ ] **Step 4: Verify no TypeScript errors in edited route**

Run:

```bash
npm run type-check
```

Expected: no TypeScript errors.

---

## Task 4: Keep Preliminary Step 2 Rows, But Validate Complete Saves

**Files:**
- Modify: `src/app/actions/user.actions.ts`
- Test: `tests/pet-required-fields.test.mjs`

- [ ] **Step 1: Add test for preliminary vs complete rows**

Append to `tests/pet-required-fields.test.mjs`:

```js
test('preliminary Step 2 row can be basic but not complete', () => {
  const pet = {
    petName: 'Luna',
    petType: 'gato',
    petAge: 2,
    petAgeUnit: 'years',
  };

  assert.equal(hasValidBasicPetFields(pet), true);
  assert.equal(hasCompleteRequiredPetFields(pet), false);
});
```

- [ ] **Step 2: Update imports**

In `src/app/actions/user.actions.ts`, add:

```ts
import {
    getMissingCompletePetFields,
    hasValidBasicPetFields,
} from '@/utils/pet-required-fields'
```

- [ ] **Step 3: Validate `pet.isComplete === true` before upsert**

Inside `registerPetsInSupabase`, before `const petsToInsert = pets.map(...)`, add:

```ts
        for (const pet of pets) {
            if (pet.isComplete === true) {
                const missingRequiredFields = getMissingCompletePetFields(pet);
                if (missingRequiredFields.length > 0) {
                    return {
                        success: false,
                        error: `Faltan campos obligatorios de mascota: ${missingRequiredFields.join(', ')}`,
                    };
                }
            }
        }
```

- [ ] **Step 4: Set completion flags from actual validation**

Inside the `petsToInsert` map, replace:

```ts
            basic_info_completed: true,
            complementary_info_completed: pet.isComplete || false,
```

with:

```ts
            basic_info_completed: hasValidBasicPetFields(pet),
            complementary_info_completed: pet.isComplete === true && getMissingCompletePetFields(pet).length === 0,
```

- [ ] **Step 5: Verify tests**

Run:

```bash
node --test tests/pet-required-fields.test.mjs
```

Expected: all tests pass.

---

## Task 5: Reconstruct V2 Recovery Pet Basics From Supabase Rows

**Files:**
- Modify: `src/components/RegistrationV2/NewRegistrationFlow.tsx`
- Test: `tests/registration-completeness.test.mjs`

- [ ] **Step 1: Add a normalization helper near `memberHasPetBasicFields`**

In `src/components/RegistrationV2/NewRegistrationFlow.tsx`, add:

```ts
    const buildPetBasicFromDbPets = (dbPets: any[] = []) => {
        return dbPets
            .filter((pet) => pet && pet.name)
            .map((pet) => ({
                petName: pet.name,
                petType: pet.pet_type === 'cat' ? 'gato' : pet.pet_type === 'dog' ? 'perro' : '',
                petAge: Number(pet.age_value || 0),
                petAgeUnit: (pet.age_unit === 'months' ? 'months' : 'years') as 'years' | 'months',
            }))
            .filter((pet) => pet.petName || pet.petType || pet.petAge);
    };
```

- [ ] **Step 2: Use DB pets as fallback when `loadedData.petBasic` is missing**

After the existing localStorage fallback block:

```ts
                        if (!loadedData.petBasic) {
                            try {
                                const backup = localStorage.getItem('petBasicBackup');
                                if (backup) {
                                    const parsedBackup = JSON.parse(backup);
                                    loadedData.petBasic = Array.isArray(parsedBackup) ? parsedBackup : [parsedBackup];
                                    console.log('💾 [loadSavedState] petBasic recuperado de localStorage:', loadedData.petBasic.length, 'mascotas');
                                }
                            } catch (e) { /* localStorage no disponible */ }
                        }
```

add:

```ts
                        if (!loadedData.petBasic && hasPetsInDB) {
                            const dbPetBasic = buildPetBasicFromDbPets((petsResult as any).pets || []);
                            if (dbPetBasic.length > 0) {
                                loadedData.petBasic = dbPetBasic;
                                console.log('🐾 [loadSavedState] petBasic reconstruido desde pets:', dbPetBasic.length, 'mascotas');
                            }
                        }
```

- [ ] **Step 3: Make pet recovery routing require valid basics, not only any DB row**

Change the `clampRequestedRegistrationStep` input:

```ts
                            hasPetsInDb: hasPetsInDB,
```

to:

```ts
                            hasPetsInDb: hasPetsInDB && hasValidPetBasic(loadedData.petBasic),
```

This prevents users like Max/Paris from being sent directly to Step 5 when DB rows exist but species/age are missing. They will go to Step 2 first, where they can provide species/name/age, then Step 5 for sex/color/breed.

- [ ] **Step 4: Run recovery tests**

Run:

```bash
node --test tests/registration-completeness.test.mjs
```

Expected: all existing tests pass. If routing behavior changes, update or add a test case that proves `petRecovery` with DB row but invalid basic fields returns Step 2.

---

## Task 6: Validate Species And Age In Step 5

**Files:**
- Modify: `src/components/RegistrationV2/steps/Step5CompletePet.tsx`

- [ ] **Step 1: Strengthen `validateForm`**

In `src/components/RegistrationV2/steps/Step5CompletePet.tsx`, inside `validateForm`, replace:

```ts
            if (!pet.gender) petErrors.gender = 'Selecciona el sexo';
            if (!pet.coatColor) petErrors.coatColor = 'Selecciona el color';
            if (!pet.isMixedBreed && !pet.breed) petErrors.breed = 'Selecciona la raza';
            
            // Si es mascota añadida aquí (no venía de Step 2, aunque ahora todas vienen de Step 2)
            if (!pet.name.trim()) petErrors.name = 'El nombre es requerido';
```

with:

```ts
            if (!pet.name?.trim()) petErrors.name = 'El nombre es requerido';
            if (pet.petType !== 'perro' && pet.petType !== 'gato') petErrors.petType = 'Selecciona perro o gato';
            if (!pet.age || Number(pet.age) <= 0) petErrors.age = 'Ingresa la edad';
            if (!pet.gender) petErrors.gender = 'Selecciona el sexo';
            if (!pet.coatColor) petErrors.coatColor = 'Selecciona el color de pelo';
            if (!pet.isMixedBreed && !pet.breed) petErrors.breed = 'Selecciona la raza';
```

- [ ] **Step 2: Add visible fields for fallback recovery only**

In the "Información general" section before `SelectWithInfo label="Sexo"`, render `PetTypeSelector` and `AgeInput` when `pet.petType` is missing or `pet.age` is missing:

```tsx
                                    {(pet.petType !== 'perro' && pet.petType !== 'gato') && (
                                        <PetTypeSelector
                                            value={pet.petType}
                                            onChange={(value) => updatePetData(index, { petType: value })}
                                            error={errors[index]?.petType}
                                        />
                                    )}

                                    {(!pet.age || Number(pet.age) <= 0) && (
                                        <AgeInput
                                            value={pet.age}
                                            unit={pet.ageUnit}
                                            onChange={(value, unit) => updatePetData(index, { age: value, ageUnit: unit })}
                                            error={errors[index]?.age}
                                        />
                                    )}
```

- [ ] **Step 3: Verify type-check**

Run:

```bash
npm run type-check
```

Expected: no TypeScript errors.

---

## Task 7: Add Existing Incomplete Pets Audit Script

**Files:**
- Create: `scripts/audit-incomplete-pets.mjs`

- [ ] **Step 1: Create script**

Create `scripts/audit-incomplete-pets.mjs`:

```js
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { getMissingCompletePetFields } from '../src/utils/pet-required-fields.js';

function loadLocalEnv() {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = resolve(process.cwd(), fileName);
    if (!existsSync(filePath)) continue;
    for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) continue;
      const key = trimmed.slice(0, equalsIndex).trim();
      let value = trimmed.slice(equalsIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadLocalEnv();

const emailsArgIndex = process.argv.indexOf('--emails');
const emails = emailsArgIndex >= 0
  ? process.argv.slice(emailsArgIndex + 1).map((email) => email.trim().toLowerCase()).filter(Boolean)
  : [];
const scanAll = process.argv.includes('--all');

if (!scanAll && emails.length === 0) {
  console.error('Usage: node scripts/audit-incomplete-pets.mjs --emails email@example.com [more@email.com]');
  console.error('   or: node scripts/audit-incomplete-pets.mjs --all');
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let usersQuery = supabase
  .from('users')
  .select('id,email,memberstack_id,registration_step,membership_status');

if (emails.length > 0) usersQuery = usersQuery.in('email', emails);

const { data: users, error: usersError } = await usersQuery;
if (usersError) throw usersError;

const reports = [];
for (const user of users || []) {
  const { data: pets, error: petsError } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', user.id)
    .in('status', ['pending', 'pending_approval', 'waiting_approval', 'action_required', 'approved']);

  if (petsError) throw petsError;

  for (const pet of pets || []) {
    const missingFields = getMissingCompletePetFields(pet);
    if (missingFields.length > 0) {
      reports.push({
        email: user.email,
        memberstackId: user.memberstack_id,
        registrationStep: user.registration_step,
        membershipStatus: user.membership_status,
        petId: pet.id,
        petName: pet.name,
        petStatus: pet.status,
        createdAt: pet.created_at,
        missingFields,
        presentFields: {
          petType: pet.pet_type,
          breed: pet.breed,
          gender: pet.gender,
          ageValue: pet.age_value,
          ageUnit: pet.age_unit,
          coatColor: pet.coat_color,
          hasPhoto: Boolean(pet.photo_url || pet.primary_photo_url),
        },
      });
    }
  }
}

console.log(JSON.stringify({ count: reports.length, reports }, null, 2));
```

- [ ] **Step 2: Run script for known cases**

Run:

```bash
node scripts/audit-incomplete-pets.mjs --emails cesar.alcantar08@gmail.com vane_vane122@hotmail.com
```

Expected: reports both Max and Paris with missing `petType`, `age`, `gender`, and `coatColor`.

---

## Task 8: Surface Missing Pet Fields In Admin

**Files:**
- Modify: `src/app/api/admin/members/route.ts`
- Modify: `src/app/api/admin/members/[id]/route.ts`
- Modify: `src/components/Admin/RequestsTable.tsx`
- Modify: `src/components/Admin/MemberDetailModal.tsx`

- [ ] **Step 1: Add registration issue value**

Where admin member payloads are assembled, compute:

```ts
const petsMissingRequiredFields = (pets || [])
    .map((pet: any) => ({
        petId: pet.id,
        petName: pet.name,
        missingFields: getMissingCompletePetFields(pet),
    }))
    .filter((item: any) => item.missingFields.length > 0);

const petCompletenessIssue = petsMissingRequiredFields.length > 0
    ? 'pets_missing_required_fields'
    : null;
```

Return:

```ts
petCompletenessIssue,
petsMissingRequiredFields,
```

- [ ] **Step 2: Add visual tag in `RequestsTable`**

In the request card/tag area, render:

```tsx
{request.petCompletenessIssue === 'pets_missing_required_fields' && (
    <span className={styles.issueTag}>
        Faltan datos obligatorios de mascota
    </span>
)}
```

- [ ] **Step 3: Add detail summary in `MemberDetailModal`**

In the member detail modal recovery section, render:

```tsx
{member.petsMissingRequiredFields?.length > 0 && (
    <div className={styles.petRecoveryBox}>
        <h4>Datos obligatorios faltantes</h4>
        {member.petsMissingRequiredFields.map((item: any) => (
            <p key={item.petId}>
                {item.petName || 'Mascota'}: {item.missingFields.join(', ')}
            </p>
        ))}
    </div>
)}
```

- [ ] **Step 4: Verify admin types**

Run:

```bash
npm run type-check
```

Expected: no TypeScript errors. Add type fields to `src/types/admin.types.ts` if TypeScript reports missing properties.

---

## Task 9: Align Public Widgets With Server Requirements

**Files:**
- Modify: `public/widgets/pet-cards-widget.js`
- Modify: `public/widgets/complete-profile-widget.js`
- Optional modify: `webflow-components/pet-cards-section.html`

- [ ] **Step 1: Harden `pet-cards-widget.js` payload validation**

In `submitNewPet`, keep existing checks and add:

```js
            if (!d.petType) return alert('Selecciona si es perro o gato');
            if (!d.ageValue || parseInt(d.ageValue, 10) <= 0) return alert('Ingresa una edad válida');
```

before the existing `gender`, `breed`, and `coatColor` checks.

- [ ] **Step 2: Harden `complete-profile-widget.js` add pet submission**

In `handlePetSubmit`, before `this.setLoading(true);`, add:

```js
            if (!data.petType) {
                this.showError('Selecciona si es perro o gato');
                return;
            }
            if (!data.ageValue || parseInt(data.ageValue, 10) <= 0) {
                this.showError('Ingresa una edad válida');
                return;
            }
            if (!data.gender) {
                this.showError('Selecciona el sexo');
                return;
            }
            if (!data.isMixed && !data.breed) {
                this.showError('Selecciona la raza');
                return;
            }
            if (!data.coatColor) {
                this.showError('Ingresa el color de pelo');
                return;
            }
```

- [ ] **Step 3: Keep API error feedback useful**

For both widgets, when API returns `missingFields`, show them:

```js
const missing = Array.isArray(res.missingFields) ? ` (${res.missingFields.join(', ')})` : '';
this.showError((res.error || 'Error al registrar mascota') + missing);
```

Use `alert(...)` in `pet-cards-widget.js` where that widget currently uses alerts.

---

## Task 10: Verification Gate

**Files:**
- Verify whole project; no new functional files beyond tasks above.

- [ ] **Step 1: Run focused unit tests**

Run:

```bash
node --test tests/pet-required-fields.test.mjs
```

Expected: all tests pass.

- [ ] **Step 2: Run existing registration guard tests**

Run:

```bash
node --test tests/registration-completeness.test.mjs
```

Expected: all tests pass.

- [ ] **Step 3: Run audit for known emails**

Run:

```bash
node scripts/audit-incomplete-pets.mjs --emails cesar.alcantar08@gmail.com vane_vane122@hotmail.com
```

Expected before manual data correction: both emails are reported with missing fields. Expected after manual correction/recovery: report count is `0` for those emails.

- [ ] **Step 4: Run mandatory project QA**

Run:

```bash
npm run type-check
```

Expected: no TypeScript errors.

Run:

```bash
npm run lint
```

Expected: no lint errors.

Run:

```bash
npm run build
```

Expected: production build completes.

- [ ] **Step 5: Manual QA scenarios**

Check these flows locally:

1. `/registro?reason=complete_pet_info` for a user with no valid pet basics routes to Step 2.
2. Step 2 captures species/name/age and routes to Step 5 without checkout.
3. Step 5 cannot submit without sex and coat color.
4. `pet-cards-widget.js` add-pet modal cannot submit without species, age, sex, breed when needed, and coat color.
5. Direct `POST /api/user/pets/add` with `{ memberstackId, petData: { name: "Test" } }` returns HTTP 400 and `missingFields`.
6. Direct `POST /api/user/pets/[petId]/update` with only a photo does not mark an incomplete pet as `complementary_info_completed = true`.

## Commit And Changelog Rules

- Work directly on `main`.
- Do not create a branch or worktree.
- Do not commit without explicit user authorization after QA summary.
- Do not push without explicit user authorization.
- After any push, update `changelogs/YYYY-MM-DD.md` with commit details and functional impact.
- Before requesting commit authorization, run:
  - `node --test tests/pet-required-fields.test.mjs`
  - `node --test tests/registration-completeness.test.mjs`
  - `npm run type-check`
  - `npm run lint`
  - `npm run build`

## Recovery Recommendation For The Two Known Users

Do not manually mark these pets complete. They need the missing data captured.

- `cesar.alcantar08@gmail.com`: send recovery path that starts at Step 2 because pet type and age are missing. Preserve existing pet row/photos for `Max`.
- `vane_vane122@hotmail.com`: send recovery path that starts at Step 2 because pet type and age are missing. Preserve existing pet row/photo for `Paris`.

After the implementation above, run:

```bash
node scripts/audit-incomplete-pets.mjs --emails cesar.alcantar08@gmail.com vane_vane122@hotmail.com
```

Then use admin recovery link or manual support contact to collect missing fields:

- Species (`perro`/`gato`)
- Age value and unit
- Sex (`macho`/`hembra`)
- Coat color
- Confirm breed/mixed status

