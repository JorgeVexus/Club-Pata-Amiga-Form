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

const urgencyByDay = {
    10: /A[ÚU]N TENEMOS 10 D[ÍI]AS/i,
    13: /Quedan 3 D[ÍI]AS/i,
    14: /Quedan 2 D[ÍI]AS/i,
    15: /[ÚU]LTIMO D[ÍI]A/i,
};

test('day 0 usa el nuevo tono y asunto cuando faltan ambos documentos', () => {
    const html = buildMissingDocsEmailHtml({ ...base, followupDay: 0, missingDocs: 'both' });

    assert.match(html, /Nos da much[íi]simo gusto que ya seas parte de la manada/i);
    assert.match(html, /SU FOTO M[ÁA]S GUAPA/i);
    assert.match(html, /SU CERTIFICADO M[ÉE]DICO/i);
    assert.match(html, /Club Pata Amiga/i);
    assert.match(getMissingDocsSubject('NOMBRE_PELUDO', 0, 'both'), /perfil de NOMBRE_PELUDO/i);
});

test('adapta el contenido cuando solo falta la foto o solo el certificado', () => {
    const photoHtml = buildMissingDocsEmailHtml({ ...base, followupDay: 13, missingDocs: 'photo' });
    const certificateHtml = buildMissingDocsEmailHtml({ ...base, followupDay: 13, missingDocs: 'certificate' });

    assert.match(photoHtml, /Solo falta este detalle/i);
    assert.match(photoHtml, /Su FOTO/i);
    assert.doesNotMatch(photoHtml, /CERTIFICADO M[ÉE]DICO/i);

    assert.match(certificateHtml, /Solo falta este detalle/i);
    assert.match(certificateHtml, /Su CERTIFICADO M[ÉE]DICO/i);
    assert.doesNotMatch(certificateHtml, /Su FOTO \(para reconocerlo al momento\)/i);
});

test('cada día mantiene el shell actual y cambia el mensaje de urgencia', () => {
    for (const followupDay of [10, 13, 14, 15]) {
        const html = buildMissingDocsEmailHtml({ ...base, followupDay, missingDocs: 'both' });

        assert.match(html, /Club Pata Amiga/i);
        assert.match(html, urgencyByDay[followupDay]);
        assert.match(html, /Completar perfil|Dejar listo el perfil|DEJARLO listo ahora|COMPLETAR perfil ahora/i);
        assert.match(getMissingDocsSubject('NOMBRE_PELUDO', followupDay, 'both'), /NOMBRE_PELUDO/);
    }
});
