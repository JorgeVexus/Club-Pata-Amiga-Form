import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const routePath = path.join(root, 'src/app/api/admin/communications/missing-docs-test/route.ts');

test('la API de pruebas exige autenticación administrativa', () => {
    const source = fs.readFileSync(routePath, 'utf8');

    assert.match(source, /getAdminUser\(request\)/);
    assert.match(source, /unauthorizedResponse\(\)/);
    assert.match(source, /isUnauthorized/);
});

test('la API queda aislada del cron y de los expedientes reales', () => {
    const source = fs.readFileSync(routePath, 'utf8');

    assert.doesNotMatch(source, /CRON_SECRET/);
    assert.doesNotMatch(source, /memberstack/i);
    assert.doesNotMatch(source, /supabase/i);
    assert.doesNotMatch(source, /memberId/);
    assert.match(source, /buildMissingDocsTestContent\(body\)/);
});

test('preview y envío usan el contenido validado y el destinatario manual', () => {
    const source = fs.readFileSync(routePath, 'utf8');

    assert.match(source, /(?:body|input)\.action !== 'preview'/);
    assert.match(source, /(?:body|input)\.action !== 'send'/);
    assert.match(source, /subject: content\.subject/);
    assert.match(source, /html: content\.html/);
    assert.match(source, /to: \[content\.recipientEmail\]/);
    assert.match(source, /MEMBERS_FROM_EMAIL/);
    assert.match(source, /REPLY_TO_EMAIL/);
});
