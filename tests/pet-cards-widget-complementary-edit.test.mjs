import assert from 'node:assert/strict';
import fs from 'node:fs';

const widgetSource = fs.readFileSync('public/widgets/pet-cards-widget.js', 'utf8');

assert.ok(
  widgetSource.includes('Editar informacion de ${pet.name}'),
  'pet details modal should expose an edit button for the selected pet'
);

assert.ok(
  widgetSource.includes('showComplementaryInfoEditor(petId)'),
  'widget should provide an inline complementary info editor'
);

assert.ok(
  widgetSource.includes('saveComplementaryInfo(petId)'),
  'widget should save complementary info through a dedicated handler'
);

assert.ok(
  widgetSource.includes('gender: genderInput.value') &&
    widgetSource.includes('coatColor: coatInput.value.trim()') &&
    widgetSource.includes('noseColor: noseInput.value.trim()') &&
    widgetSource.includes('eyeColor: eyeInput.value.trim()') &&
    widgetSource.includes('birthMonth') &&
    widgetSource.includes('birthYear'),
  'save handler should submit gender, coat color, nose color, eye color, birth month and birth year'
);

assert.ok(
  widgetSource.includes('pata-complementary-edit-form') &&
    widgetSource.includes('pata-complementary-actions') &&
    widgetSource.includes('@media (max-width: 640px)') &&
    widgetSource.includes('.pata-complementary-edit-grid'),
  'complementary edit UI should include mobile-friendly form styles'
);
