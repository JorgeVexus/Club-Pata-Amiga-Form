# Implementation Plan - Wellness Center Modal Standardization

Standardize the Wellness Center details modal to match the "premium" administrative UI patterns used for Members and Ambassadors.

## Proposed Changes

### [NEW] [WellnessCenterDetailModal.module.css](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/WellnessCenterDetailModal.module.css)
- Create a new CSS module that replicates the `MemberDetailModal` design language.
- Include classes for `.overlay`, `.modal`, `.header`, `.content`, `.footer`, `.tabs`, `.grid`, `.field`, `.label`, `.value`, and `.statusBadge`.
- Add specific styling for services tags and map containers.

### [MODIFY] [WellnessCenterDetailModal.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/WellnessCenterDetailModal.tsx)
- Update imports to use the new CSS module.
- Refactor the component to use a tabbed interface:
  - **Información**: General establishment details and email.
  - **Ubicación**: Address and potentially a Google Maps link if coordinates exist.
  - **Servicios**: List of services and promotion details.
- Standardize the "Approve/Reject" flow:
  - Add a dedicated rejection UI within the modal structure.
  - Use premium button styles (Orange for Primary, Turquoise for Secondary).
- Ensure consistent responsive behavior.

## Verification Plan

### Automated Tests
- Run `npm run build` and `npm run type-check` to ensure no regressions.

### Manual Verification
- Open the Admin Dashboard.
- Navigate to "Centros de Bienestar".
- Click "Ver Detalles" for various centers (Pending, Approved, Rejected).
- Verify the modal appears with the new design.
- Test tab switching.
- Test the Approve/Reject workflow to ensure it still functions correctly with the new UI.
- Verify mobile responsiveness by resizing the browser.
