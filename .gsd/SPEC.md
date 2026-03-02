# SPEC.md — Pet Membership Form Optimization

> **Status**: `FINALIZED`

## Vision
Transform the Club Pata Amiga registration process from a high-friction experience (~12 clicks, 30 fields) into a streamlined, high-conversion flow (<3 minutes, ~5 fields pre-payment) to reduce abandonment from 15% to less than 5%.

## Goals
1. **Reduce Friction**: Implement a 5-step registration process (Account, Basic Pet, Plan/Payment, Profile Completion, Pet Completion).
2. **Post-Payment Data Collection**: Move non-essential data collection (CURP, address, detailed pet info) to after the payment step.
3. **Draft Persistence**: Save registration progress to Supabase and Memberstack at every step to allow users to resume later.
4. **Catalog Integration**: Implement automated lookups for SEPOMEX (Postal Codes), breeds, and pet colors to improve data quality.
5. **Senior Pet Support**: Add specific logic and certificate requirements for pets aged 10+.

## Non-Goals (Out of Scope)
- Redesigning the main dashboard (outside of the registration context).
- Implementing a mobile app (native).
- Changing the existing insurance underwriting rules (just the collection of data).

## Users
- **Pet Owners**: Seeking to register their dogs or cats for membership.
- **Ambassadors**: Helping others register (referral system).
- **Admins**: Reviewing registrations and documents.

## Constraints
- **Framework**: Next.js 15.5 with React 19.
- **Authentication**: Memberstack for memberships and auth.
- **Database**: Supabase (PostgreSQL).
- **Compliance**: Must handle Mexican CURP and address formats.

## Success Criteria
- [ ] Successful registration flow completion in under 3 minutes.
- [ ] Zero data loss for partially completed registrations.
- [ ] Automatic address filling via SEPOMEX integration.
- [ ] Successful Stripe payment integration via Memberstack.
