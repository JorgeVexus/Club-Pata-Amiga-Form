# Implementation Plan: Wellness Center Widget - Complete Profile Editing & Geolocation

Integrate the full "Edit Information" flow into the Wellness Center widget, ensuring all complementary data (Geolocation, Logo, Social, Promotion) can be managed during and after the registration process.

## Proposed Changes

### [Backend] API & Storage

#### [NEW] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/upload/wellness-logo/route.ts)
- Implement a POST endpoint for wellness logo uploads.
- Validates `file` (image only, <5MB) and `memberstackId`.
- Uploads to the `pet-photos` public bucket (reusing existing bucket for simplicity unless requested otherwise).
- Updates `logo_url` in `wellness_centers` table.

### [Frontend] Widget Integration

#### [MODIFY] [wellness-center-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/wellness-center-widget.js)
- **Styles**: 
  - Add classes for `.wc-form-group`, `.wc-input`, `.wc-label`.
  - Add styles for a mini-map container or "Obtener ubicación" button.
- **Functions**:
  - `showEditProfileModal(container, center)`: 
    - Full form for `phone`, `address`, `promotion_details`.
    - **Geolocation**: Integrate Google Places Autocomplete if the script is loaded, otherwise provide a "Get Current Location" button using `navigator.geolocation`.
    - **Logo**: File input with instant upload and preview.
    - **Social Links**: Grouped inputs for Instagram, Facebook, TikTok, Twitter, Website.
  - `renderPending`: Add "Completar mi Perfil" button to encourage early data entry.
  - `showWelcomeModal`: Ensure the text matches "Felicidades por unirte a la manada de Pata Amiga".
- **API Interaction**:
  - Update `fetchCenterData` to include all new fields in the state.

## Verification Plan

### Automated Tests
- `npm run build` & `npm run type-check` (Standard check).

### Manual Verification
1. Log in as a pending center.
2. Click "Completar mi Perfil".
3. Use address autocomplete or "Get Location" to fill Geolocation.
4. Upload a logo and fill social links.
5. Save and verify data in Supabase.
6. Verify first-time welcome message triggers after approval.
