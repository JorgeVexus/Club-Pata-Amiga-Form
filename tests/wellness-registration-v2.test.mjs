import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const page = fs.readFileSync('src/app/bienestar/registro/page.tsx', 'utf8');
const pageStyles = fs.readFileSync('src/app/bienestar/registro/page.module.css', 'utf8');
const form = fs.readFileSync('src/components/WellnessForm/WellnessForm.tsx', 'utf8');
const formStyles = fs.readFileSync('src/components/WellnessForm/WellnessForm.module.css', 'utf8');
const complementary = fs.readFileSync('src/components/WellnessForm/WellnessComplementaryForm.tsx', 'utf8');

test('preserves wellness registration contracts', () => {
    assert.ok(form.includes("fetch('/api/wellness'"));
    assert.ok(form.includes('checkWellnessEmailAvailability'));
    assert.ok(form.includes('<TermsModalEnhanced'));
    assert.ok(form.includes('<WellnessComplementaryForm'));
    assert.ok(form.includes("'form' | 'success' | 'complementary' | 'complementary-success'"));
    assert.ok(complementary.includes("fetch('/api/upload/wellness-logo'"));
    assert.ok(complementary.includes("fetch('/api/upload/wellness-location-photo'"));
    assert.ok(complementary.includes("fetch('/api/wellness/update'"));
});

test('uses the shared V2 registration shell', () => {
    assert.ok(page.includes('styles.registrationNav'));
    assert.ok(page.includes('styles.heroCopy'));
    assert.ok(pageStyles.includes('#FAF7F1'));
    assert.ok(pageStyles.includes('max-width: 700px'));
});

test('renders a three-stage accessible progress indicator', () => {
    assert.ok(form.includes('styles.progressTrack'));
    assert.ok(form.includes('aria-current'));
    assert.ok(form.includes('Solicitud'));
    assert.ok(form.includes('Información del centro'));
    assert.ok(form.includes('Revisión'));
});

test('defines complete V2 interaction states', () => {
    assert.ok(form.includes('styles.stageCard'));
    assert.ok(formStyles.includes('.serviceBadge:focus-visible'));
    assert.ok(formStyles.includes('.submitButton:active'));
    assert.ok(formStyles.includes('.successContainer'));
    assert.ok(formStyles.includes('@media (max-width: 640px)'));
});
