# Plan: Automating Admin Message Suggestions in MemberDetailModal

The goal is to automatically populate the "Request Information" message textbox with a template when an administrator selects a document type to request for a pet.

## Proposed Changes

### [Component] MemberDetailModal

#### [MODIFY] [MemberDetailModal.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/MemberDetailModal.tsx)

- Update the `toggleRequestType` function to detect when a selection is made.
- Retrieve the pet's name from the `pets` state using the provided `petId`.
- Map the internal request types (`PET_PHOTO_1`, `PET_VET_CERT`, `OTHER_DOC`) to their Spanish labels.
- Construct a suggested message using the template: `"Estimado tutor, solicitamos {tipo_de_documento} de {nombre_mascota} debido a que "`.
- If multiple documents are selected, they will be joined (e.g., "Foto Principal y Certificado Médico").
- Update the `requestCustomMsg` state with the generated suggestion.

## Verification Plan

### Automated Tests
- Since there are no automated tests for the UI components in this project, I will rely on manual verification via the browser tool.

### Manual Verification
1. Open the Admin Dashboard.
2. Open a member's detail modal.
3. Scroll to a pet card and click "📋 Solicitar Información".
4. Click on "📸 Foto Principal".
5. Verify that the textarea below is automatically populated with: `"Estimado tutor, solicitamos Foto Principal de [Nombre Mascota] debido a que "`.
6. Click on "🏥 Certificado Médico".
7. Verify that the message updates to include both documents: `"Estimado tutor, solicitamos Foto Principal y Certificado Médico de [Nombre Mascota] debido a que "`.
8. Uncheck a document and verify the message updates accordingly.
