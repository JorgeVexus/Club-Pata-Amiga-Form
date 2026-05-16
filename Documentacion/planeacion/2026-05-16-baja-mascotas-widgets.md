# Implementation Plan - Pet Unsubscription Workflow (User Widgets)

This plan outlines the integration of the pet unsubscription flow into the user-facing widgets: `unified-membership-widget.js` and `pet-cards-widget.js`. It ensures that unsubscribed pets are visually distinct (grayscale), interactions are locked, and users can initiate the unsubscription process with reason selection and confirmation.

## Proposed Changes

### 1. [Server Action] [MODIFY] [user.actions.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/actions/user.actions.ts)
*   Update `getPetsByUserId` to fetch member details from Memberstack using `getMemberDetails`.
*   Merge `pet-X-is-active` flags into the `pets` array returned from Supabase.
*   This ensures the widgets receive the "source of truth" status for each pet.

### 2. [Frontend Widget] [MODIFY] [unified-membership-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/unified-membership-widget.js)
*   **Styles**: Add `.pata-grayscale` class (`filter: grayscale(100%); pointer-events: none; opacity: 0.8;`).
*   **Card Rendering**: Apply `.pata-grayscale` if `pet.is_active === false`.
*   **Modal**: Add "Solicitar baja de este peludito" button to the pet details modal.
*   **Logic**:
    *   Implement `handlePetUnsubscribe` to open a reason selection modal.
    *   Reasons: "Por fallecimiento", "Ya no vive conmigo", "Otra (descríbela)".
    *   Show confirmation message: "Proceder a confirmar baja de [nombre]. Recuerda que el tiempo de espera es por peludo y que con esta acción podrás proteger a otro de tus peludos".
    *   Call `/api/user/pets/unsubscribe` on confirmation.
    *   Reload widget data on success.

### 3. [Frontend Widget] [MODIFY] [pet-cards-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/pet-cards-widget.js)
*   **Styles**: Add `.pata-grayscale` class.
*   **Card Rendering**: Apply `.pata-grayscale` if `pet.is_active === false`.
*   **Modal**: Add "Solicitar baja de este peludito" button in `showDetails`.
*   **Logic**: Implement similar unsubscription flow as in the unified widget.

## Verification Plan

### Manual Verification
1.  Open the Member Dashboard (Webflow).
2.  Click on a pet card to view details.
3.  Click "Solicitar baja de este peludito".
4.  Select a reason (e.g., "Ya no vive conmigo") and confirm.
5.  Verify that the pet card now appears in grayscale and cannot be clicked again.
6.  Verify that an audit entry is created in the Admin Activity Feed.
7.  Check Memberstack to ensure `pet-X-is-active` is set to `false`.

### Automated Checks
*   `npm run type-check` to ensure no regressions in server actions.
*   `npm run build` to verify production stability.
