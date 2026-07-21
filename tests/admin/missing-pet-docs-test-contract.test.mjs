import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
    buildMissingDocsTestContent,
    validateMissingDocsTestInput,
} = require('../../src/utils/missing-pet-docs-admin-test.js');
const {
    buildMissingDocsEmailHtml,
    getMissingDocsSubject,
} = require('../../src/utils/missing-pet-docs-email.js');

const validInput = {
    recipientEmail: ' QA@PataAmiga.mx ',
    userName: ' Jorge QA ',
    petName: ' Luna ',
    followupDay: 10,
    missingDocs: 'photo',
    uploadUrl: 'https://app.pataamiga.mx/completar-documentacion',
};

test('normaliza una configuración válida de correo de prueba', () => {
    assert.deepEqual(validateMissingDocsTestInput(validInput), {
        recipientEmail: 'qa@pataamiga.mx',
        userName: 'Jorge QA',
        petName: 'Luna',
        followupDay: 10,
        missingDocs: 'photo',
        uploadUrl: 'https://app.pataamiga.mx/completar-documentacion',
    });
});

test('rechaza días y tipos de documento fuera de las listas permitidas', () => {
    assert.throws(
        () => validateMissingDocsTestInput({ ...validInput, followupDay: 12 }),
        /día de seguimiento/i,
    );
    assert.throws(
        () => validateMissingDocsTestInput({ ...validInput, missingDocs: 'ine' }),
        /documentos faltantes/i,
    );
});

test('rechaza destinatarios, nombres y enlaces inseguros', () => {
    assert.throws(
        () => validateMissingDocsTestInput({ ...validInput, recipientEmail: 'no-es-correo' }),
        /correo destinatario/i,
    );
    assert.throws(
        () => validateMissingDocsTestInput({ ...validInput, userName: '' }),
        /nombre del miembro/i,
    );
    assert.throws(
        () => validateMissingDocsTestInput({ ...validInput, petName: 'x'.repeat(121) }),
        /nombre de la mascota/i,
    );
    assert.throws(
        () => validateMissingDocsTestInput({ ...validInput, uploadUrl: 'javascript:alert(1)' }),
        /enlace de carga/i,
    );
});

test('construye asunto y HTML con el mismo generador que usa el cron', () => {
    const normalized = validateMissingDocsTestInput(validInput);
    const content = buildMissingDocsTestContent(validInput);
    const canonicalParams = { ...normalized, petIndex: 1 };

    assert.equal(
        content.subject,
        getMissingDocsSubject(normalized.petName, normalized.followupDay, normalized.missingDocs),
    );
    assert.equal(content.html, buildMissingDocsEmailHtml(canonicalParams));
    assert.match(content.text, /Completa el perfil aquí:/);
    assert.equal(content.recipientEmail, 'qa@pataamiga.mx');
});

