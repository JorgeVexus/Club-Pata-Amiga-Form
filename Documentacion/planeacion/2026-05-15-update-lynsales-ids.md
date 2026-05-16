# Implementation Plan: Update LynSales CRM Field Identifiers

This plan outlines the changes required to synchronize the membership type and cost fields with the specific IDs provided by the LynSales agency.

## User Review Required

> [!IMPORTANT]
> The agency requested changing the custom field structure from `key`/`field_value` to `id`/`value` for the specific fields `tipo_membresia` and `costo_membresia`. I will also update the TypeScript interface to support both formats during transition or if other fields still use the old format.

## Proposed Changes

### CRM Service

#### [MODIFY] [crm.service.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/services/crm.service.ts)
- Update `ContactData` interface to support the new `id` and `value` fields in `customFields`.
- Refactor `updateContactAsActive` to use the provided UUIDs:
    - `contact.tipo_membresia` → `UDXQDTApGP4lWS7tFrOa`
    - `contact.costo_membresia` → `oRTpCwaPnVxwYgAN5WlJ`
- Update the payload structure for these fields to use `id` and `value` instead of `key` and `field_value`.

### User Actions (CRM Sync)

#### [MODIFY] [user.actions.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/actions/user.actions.ts)
- Update `notifyCheckoutAbandonedToCRM` and `notifyCheckoutCompletedToCRM` to use the new `id` and `value` structure if they use any custom fields that were migrated. 
- *Note: Since the user only provided IDs for type and cost, I will keep `recovery_link` as is unless it also needs a UUID. However, I will update the generic type to ensure compatibility.*

## Verification Plan

### Automated Tests
- Since there is no test runner, I will verify the logic by inspection and ensure TypeScript compilation passes.
- Check that all calls to `updateContactAsActive` and functions using `customFields` are consistent with the new type.

### Manual Verification
- Verify the logs in the admin dashboard (if accessible) or via terminal to ensure the payload sent to LynSales matches the requested format.
- `console.log` the payload before sending to confirm it looks like this:
```json
"customFields": [
    { "id": "UDXQDTApGP4lWS7tFrOa", "value": "Mensual" },
    { "id": "oRTpCwaPnVxwYgAN5WlJ", "value": "$159" }
]
```
