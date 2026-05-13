# Implementation Plan - Aligning Unified Membership Widget

The goal is to synchronize the UI and logic of the "Pet Details" modal in the `unified-membership-widget.js` with the `pet-cards-widget.js` implementation. This involves replacing emoji icons with image icons, aligning date formatting, and adopting the premium class-based CSS structure.

## Proposed Changes

### [Component] Unified Membership Widget

#### [MODIFY] [unified-membership-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/unified-membership-widget.js)

- **Style Updates**:
    - Add `Material Symbols Outlined` font import to `STYLES`.
    - Add CSS classes to `STYLES`: `.pata-info-card`, `.pata-info-card-title`, `.pata-info-grid`, `.pata-info-item`, `.pata-info-icon-wrap`, `.pata-info-texts`, `.pata-info-label`, `.pata-info-value`.
    - These classes will provide the premium brutalist look found in `pet-cards-widget.js`.

- **Logic Updates**:
    - **`calculateCarencia`**: Add `isWaiting` to the return object for parity with the reference widget.
    - **`renderPetDetailsModal`**:
        - Update `registrationDate` and `activationDate` to use `month: 'short'` for a more compact and consistent format.
        - Refactor `infoItems` to use PNG icons from `https://app.pataamiga.mx/Icons/`.
        - Replace the inline-styled grid with the new class-based structure.
        - Wrap the information section in a themed `pata-info-card` container.
- **Copy Updates**:
    - Update the "Impacto Social" benefit text to: "Por cada 1,000 miembros, la manada apoya a quienes más lo necesitan. Juntos protegemos más".

## Verification Plan

### Automated Verification
- Run `npm run lint` to ensure code quality and style consistency.

### Manual Verification
- Open the user dashboard.
- Open the "Ver detalles" modal for a pet.
- Verify:
    - Icons are now high-quality PNGs from the Pata Amiga icon set.
    - Date format is "DD MMM. YYYY" (e.g., "13 may. 2026").
    - The layout is clean and matches the "Pet Cards" modal aesthetic.
    - "Activación de los beneficios" field only appears for approved pets.
