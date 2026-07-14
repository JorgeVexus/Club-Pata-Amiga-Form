import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPetUpdateNotificationMessage,
  getPetUpdateLabels,
} from '../src/utils/pet-update-notification.js';

test('birthday update notification mentions birthday instead of photos', () => {
  const labels = getPetUpdateLabels({ birthMonth: 2, birthYear: 2022 });

  assert.deepEqual(labels, ['cumpleaños']);
  assert.equal(
    buildPetUpdateNotificationMessage({
      ownerName: 'Lucero Contreras',
      petName: 'Felipe',
      updatedLabels: labels,
    }),
    'Lucero Contreras actualizó el cumpleaños de Felipe.'
  );
});

test('unchanged complementary payload is ignored when only birthday changed', () => {
  const labels = getPetUpdateLabels(
    {
      gender: 'hembra',
      coatColor: 'Cafe',
      noseColor: 'Negra',
      eyeColor: 'Miel',
      birthMonth: 3,
      birthYear: 2022,
    },
    {
      gender: 'hembra',
      coat_color: 'Cafe',
      nose_color: 'Negra',
      eye_color: 'Miel',
      birth_month: 2,
      birth_year: 2022,
    }
  );

  assert.deepEqual(labels, ['cumpleaños']);
});

test('complementary update notification lists edited fields', () => {
  const labels = getPetUpdateLabels({
    gender: 'macho',
    coatColor: 'Cafe',
    noseColor: 'Negra',
    eyeColor: 'Miel',
  });

  assert.deepEqual(labels, ['género', 'color de pelo', 'color de nariz', 'color de ojos']);
  assert.equal(
    buildPetUpdateNotificationMessage({
      ownerName: 'Lucero Contreras',
      petName: 'Felipe',
      updatedLabels: labels,
    }),
    'Lucero Contreras actualizó género, color de pelo, color de nariz y color de ojos de Felipe.'
  );
});

test('document update notification keeps photo and certificate language', () => {
  assert.equal(
    buildPetUpdateNotificationMessage({
      ownerName: 'Lucero Contreras',
      petName: 'Felipe',
      updatedLabels: getPetUpdateLabels({ photo1Url: 'https://example.com/photo.jpg' }),
    }),
    'Lucero Contreras actualizó las fotos de Felipe.'
  );

  assert.equal(
    buildPetUpdateNotificationMessage({
      ownerName: 'Lucero Contreras',
      petName: 'Felipe',
      updatedLabels: getPetUpdateLabels({ vetCertificateUrl: 'https://example.com/cert.pdf' }),
    }),
    'Lucero Contreras actualizó el certificado veterinario de Felipe.'
  );
});
