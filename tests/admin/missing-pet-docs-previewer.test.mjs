import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = fs.readFileSync(
    path.join(root, 'src/components/Admin/Communications/EmailTemplatePreviewer.tsx'),
    'utf8',
);

test('la plantilla del cron solicita su preview al generador canónico', () => {
    assert.match(source, /adminFetch\('\/api\/admin\/communications\/missing-docs-test'/);
    assert.match(source, /action: 'preview'/);
    assert.match(source, /setPreviewHtml/);
    assert.match(source, /setPreviewSubject/);
});

test('permite indicar y confirmar el destinatario de una prueba individual', () => {
    assert.match(source, /recipientEmail/);
    assert.match(source, /type="email"/);
    assert.match(source, /action: 'send'/);
    assert.match(source, /window\.confirm\(`¿Enviar esta prueba únicamente a \$\{recipientEmail\}\?`\)/);
    assert.match(source, /isSending/);
    assert.match(source, /Enviar correo de prueba/);
});

test('muestra feedback accesible y conserva los controles responsive', () => {
    assert.match(source, /role="status"/);
    assert.match(source, /Este envío es de prueba y no modifica expedientes ni ejecuta el cron/);
    assert.match(source, /setViewportWidth\('desktop'\)/);
    assert.match(source, /setViewportWidth\('mobile'\)/);
});

