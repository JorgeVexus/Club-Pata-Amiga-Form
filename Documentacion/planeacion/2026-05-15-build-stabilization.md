# Implementation Plan - Build Stabilization (Supabase Client Hardening)

This plan addresses the `supabaseKey is required` errors causing build failures in Vercel. We will centralize Supabase client initialization and ensure all services and API routes handle missing environment variables gracefully during build time.

## User Review Required

> [!IMPORTANT]
> This change involves refactoring how Supabase is accessed throughout the application. While it improves stability, it requires a full build verification to ensure no runtime regressions in features relying on Supabase.

## Proposed Changes

### Core Library

#### [MODIFY] [supabase.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/lib/supabase.ts)
- Already partially updated, but ensure it exports `supabase` (public), `supabaseAdmin` (service role), and `isSupabaseConfigured()` helpers.

### Services Layer

#### [MODIFY] [wellness.service.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/services/wellness.service.ts)
- Remove direct `createClient` call.
- Import `supabaseAdmin` from `@/lib/supabase`.
- Add guard checks in methods to ensure `supabaseAdmin` exists.

#### [MODIFY] [supabase.service.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/services/supabase.service.ts)
- Ensure it uses the centralized client and handles `null` cases.

### API Routes (Critical Batch)

We will update the following API routes to use the centralized safe client and avoid `!` non-null assertions:

- [MODIFY] `src/app/api/upload/pet-photo/route.ts`
- [MODIFY] `src/app/api/admin/members/route.ts`
- [MODIFY] `src/app/api/admin/metrics/route.ts`
- [MODIFY] `src/app/api/wellness/update/route.ts`
- [MODIFY] `src/app/api/user/add-pet/route.ts`

## Verification Plan

### Automated Tests
1. **Build Verification**: Run `npm run build` locally to ensure the "supabaseKey is required" error is gone.
2. **Type Check**: Run `npm run type-check` to ensure all imports and usage of the potentially `null` client are handled (or casted safely where appropriate).

### Manual Verification
1. **Local Dev Check**: Verify that the registration flow still works when environment variables ARE present.
2. **Missing Env Check**: (Simulation) Remove `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` and verify the app doesn't crash on boot (though features using it will fail gracefully or show errors).
