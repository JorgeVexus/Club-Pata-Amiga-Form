# ROADMAP.md

> **Current Phase**: Phase 3: Post-Payment & Polish
> **Milestone**: v2.0 - Optimized Registration

## Must-Haves
- [x] Streamlined 3-step pre-payment flow.
- [x] Stripe integration via Memberstack.
- [x] Post-payment profile completion.
- [x] Post-payment pet detail completion.
- [x] Automated catalog integration (Colores, Razas).

## Phases

### Phase 1: Foundation & Pre-Payment
**Status**: ✅ Completed
**Objective**: Build the core account creation and basic pet step.
- [x] Step 1: Account Creation.
- [x] Step 2: Basic Pet Info (Name, Type, Age).
- [x] Step 3: Plan Selection & Memberstack Checkout.

### Phase 2: Post-Payment Continuity
**Status**: ✅ Completed
**Objective**: Ensure data is saved after payment and users are redirected.
- [x] Step 4: Complete Owner Profile (CURP, Directions).
- [x] Supabase persistence for partial registrations.

### Phase 3: Post-Payment & Polish
**Status**: ✅ Completed
**Objective**: Complete pet information and refine the UX.
- [x] Breed Autocomplete (Sanity/Supabase integration).
- [x] Implement Pet Color Selection (Generic system for Hair, Nose, Eyes).
- [ ] Photo upload with 15-day deadline tracking.
- [ ] Senior pet certificate logic (10+ years).

### Phase 4: Production Readiness
**Status**: ⬜ Not Started
**Objective**: Deployment and traffic redirection.
- [ ] SEPOMEX Cache validation.
- [ ] Traffic redirection from `/usuarios/registro` to `/registro-v2`.
- [ ] Final end-to-end UAT.
