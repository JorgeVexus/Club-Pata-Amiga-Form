# Implementation Plan - Finalizing Pet Unsubscription Flow

This plan outlines the final steps to complete the pet unsubscription flow, ensuring consistency between user and admin dashboards, proper activity logging, and automation for death-related solidarity requests.

## Proposed Changes

### 1. User Dashboard Widget (`public/widgets/pet-cards-widget.js`)
- [MODIFY] `showDetails(pet)`: Add a "Solicitar baja de este peludito" button in the general information section.
- [MODIFY] `showDetails(pet)`: Apply the `.pata-grayscale` CSS filter to the pet photo if the pet is inactive.
- [MODIFY] CSS Styles: Ensure `.pata-grayscale` is defined (e.g., `filter: grayscale(100%); opacity: 0.7;`).

### 2. Admin Dashboard (`src/components/Admin/MemberDetailModal.tsx`)
- [MODIFY] `handlePetUnsubscribe`: Fix the API call to include `petName` in the request body (currently missing, causing 400 errors).

### 3. Solidarity Fund Automation (`src/app/api/admin/solidarity/update/route.ts`)
- [MODIFY] `POST` handler: Implement automatic pet unsubscription when a "death" (`benefit_type === 'death'`) solidarity request is approved.
    - Resolve the pet's index in Memberstack by comparing the pet's Supabase ID with the member's custom fields.
    - Update Memberstack field `pet-N-is-active` to `false`.
    - Log the unsubscription in the `pet_unsubscriptions` table with "Solidaridad (Fallecimiento)" as the reason.

## Verification Plan

### Automated Tests
- No automated tests available.

### Manual Verification
1. **User Flow**:
   - Open pet details in the dashboard.
   - Click "Solicitar baja".
   - Complete the modal flow.
   - Verify the pet card and details image turn grayscale.
   - Verify the action appears in the Admin Activity feed.
2. **Admin Flow**:
   - Open a member's detail in the admin dashboard.
   - Click "Dar de Baja" on a pet.
   - Verify it works without errors.
   - Verify the action appears in "Tu Actividad" and "Actividad Reciente".
3. **Solidarity Flow**:
   - Create a solidarity request of type "death".
   - Approve it from the admin side.
   - Verify the pet is automatically unsubscribed in Memberstack and logged in Supabase.
