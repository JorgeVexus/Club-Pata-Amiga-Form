# Implementation Plan - Frontend-Driven CRM Data Sync

The user suggested using the data already visible in the Admin Dashboard (specifically in the Member Details modal) to populate the CRM fields during approval. This is more robust as it eliminates discrepancies between what the admin sees and what the backend calculates.

## User Review Required

> [!IMPORTANT]
> We will update the `onApprove` function signature in the frontend to pass calculated membership data. The backend will prioritize these values.

## Proposed Changes

### [Admin Dashboard]

#### [MODIFY] [AdminDashboard.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/AdminDashboard.tsx)
- Update `onApprove` callback to accept an optional `metadata` object containing `membershipType` and `membershipCost`.
- Include these values in the `POST` request body to `/api/admin/members/[id]/approve`.

#### [MODIFY] [MemberDetailModal.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/MemberDetailModal.tsx)
- Update the `onApprove` prop definition.
- In the "Aprobar Solicitud" button click handler, calculate `membershipType` and `membershipCost` based on the currently displayed plan and Stripe details.

### [API Routes]

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/members/[id]/approve/route.ts)
- Update the POST handler to extract `membershipType` and `membershipCost` from the request body.
- Use these values as the primary source for the CRM update, falling back to existing logic (Supabase/Memberstack) only if they are missing.

## Verification Plan

### Automated Tests
- Run `npm run type-check` to ensure the new function signatures are consistent across components.
- Run `npm run build` to verify the overall project health.

### Manual Verification
- Verify that clicking "Aprobar Solicitud" still works and correctly sends the payload to the backend (checked via console logs).
