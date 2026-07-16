import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildMissingDocsEmailHtml, getMissingDocsSubject } = require('../src/utils/missing-pet-docs-email.js');

const base = {
    userName: 'Fulanita Ejemplo',
    petName: 'NOMBRE_PELUDO',
    petIndex: 1,
    followupDay: 0,
    uploadUrl: 'https://app.pataamiga.mx/completar-documentacion?preview=1',
};

test('day 0 renders the editorial design and dynamic member data', () => {
    const html = buildMissingDocsEmailHtml({ ...base, missingDocs: 'both' });

    assert.match(html, /data-template="missing-docs-day-0"/);
    assert.match(html, /HOLA FULANITA/i);
    assert.match(html, /NOMBRE_PELUDO/);
    assert.match(html, /background-color:#B8EBE9/i);
    assert.match(html, /background-color:#08BDB4/i);
    assert.match(html, /background-color:#FFBC05/i);
    assert.match(html, /completar-documentacion\?preview=1/);
});

test('day 0 shows only the photo item when only the photo is missing', () => {
    const html = buildMissingDocsEmailHtml({ ...base, missingDocs: 'photo' });

    assert.match(html, /SU FOTO MÁS GUAPA/);
    assert.doesNotMatch(html, /SU CERTIFICADO MÉDICO/);
});

test('day 0 shows only the certificate item when only the certificate is missing', () => {
    const html = buildMissingDocsEmailHtml({ ...base, missingDocs: 'certificate' });

    assert.doesNotMatch(html, /SU FOTO MÁS GUAPA/);
    assert.match(html, /SU CERTIFICADO MÉDICO/);
});

test('day 0 uses the supplied cat and family assets with accessible alternatives', () => {
    const html = buildMissingDocsEmailHtml({ ...base, missingDocs: 'both' });

    assert.match(html, /email-assets\/missing-docs\/day-0-hero-cat\.png/);
    assert.match(html, /email-assets\/missing-docs\/day-0-family\.png/);
    assert.match(html, /alt="Foto principal decorativa de una mascota"/);
    assert.match(html, /alt="Grupo de mascotas de Pata Amiga"/);
});

test('later follow-up days keep the legacy design', () => {
    for (const followupDay of [10, 13, 14, 15]) {
        const html = buildMissingDocsEmailHtml({ ...base, followupDay, missingDocs: 'both' });
        assert.doesNotMatch(html, /missing-docs-day-0/);
        assert.match(html, /Completar perfil de NOMBRE_PELUDO/);
        assert.match(getMissingDocsSubject('NOMBRE_PELUDO', followupDay, 'both'), /NOMBRE_PELUDO/);
    }
});
