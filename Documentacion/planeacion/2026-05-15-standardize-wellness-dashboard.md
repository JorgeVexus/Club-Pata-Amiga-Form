# Implementation Plan - Standardize Wellness Centers Dashboard

Standardize the Wellness Centers management table in the admin dashboard by applying the existing design system, integrating statistical metric blocks, and implementing consistent filtering patterns. Resolve the unresponsive "Ver Detalles" button.

## User Review Required

> [!IMPORTANT]
> The `WellnessCentersTable` will now handle its own status filtering internally using tabs (All, Pending, Approved, Rejected), similar to the `RequestsTable`. This will unify the entry points in the Sidebar.

## Proposed Changes

### Admin Dashboard Components

#### [MODIFY] [WellnessCentersTable.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/WellnessCentersTable.tsx)
- Add internal `stats` state to track total, pending, approved, and rejected centers.
- Implement `loadStats` function using `adminFetch`.
- Add `sortFilter` state to handle the active tab.
- Implement `statsGrid` UI block.
- Implement `tabFilters` UI block with count badges.
- Update table structure to use standardized CSS classes from `RequestsTable.module.css`.
- Ensure `onViewDetails` correctly passes the center object.
- Standardize the "Acciones" column with `actionButtons` wrapper.

#### [MODIFY] [AdminDashboard.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/AdminDashboard.tsx)
- Simplify the rendering of `WellnessCentersTable`. Instead of different props for `filter="pending"` and `filter="approved"`, use a unified view or pass a default filter that the table can override internally.
- Ensure `selectedWellnessCenter` state and `WellnessCenterDetailModal` are correctly connected.

#### [MODIFY] [WellnessCenterDetailModal.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/WellnessCenterDetailModal.tsx)
- Ensure it uses consistent styling and handles all states (Approved, Rejected, Pending).
- Fix any potential rendering issues that might cause it to be hidden.

## Verification Plan

### Automated Tests
- Run `npm run type-check` to ensure no type regressions.
- Run `npm run build` to verify the build stability.

### Manual Verification
- Navigate to "Centros de Bienestar" in the Admin Dashboard.
- Verify the presence of the Statistics Grid (Total, Pending, Approved, Rejected).
- Test filtering tabs and verify they update the table content and stats.
- Click "Ver Detalles" on a wellness center and verify the modal opens with correct data.
- Test approval/rejection from the modal.
- Verify the design matches the "Gestión de Miembros" section.
