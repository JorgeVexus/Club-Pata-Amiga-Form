const {
    buildMissingDocsEmailHtml,
    getMissingDocsMessage,
    getMissingDocsSubject,
} = require('./missing-pet-docs-email.js');

const FOLLOWUP_DAYS = Object.freeze([0, 10, 13, 14, 15]);
const MISSING_DOC_TYPES = Object.freeze(['photo', 'certificate', 'both']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredText(value, label) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized || normalized.length > 120) {
        throw new TypeError(`${label} es obligatorio y debe tener máximo 120 caracteres.`);
    }
    return normalized;
}

function validateMissingDocsTestInput(input = {}) {
    const recipientEmail = typeof input.recipientEmail === 'string'
        ? input.recipientEmail.trim().toLowerCase()
        : '';
    if (!EMAIL_PATTERN.test(recipientEmail) || recipientEmail.length > 254) {
        throw new TypeError('El correo destinatario no es válido.');
    }

    const followupDay = Number(input.followupDay);
    if (!FOLLOWUP_DAYS.includes(followupDay)) {
        throw new TypeError('El día de seguimiento no es válido.');
    }

    if (!MISSING_DOC_TYPES.includes(input.missingDocs)) {
        throw new TypeError('El tipo de documentos faltantes no es válido.');
    }

    const uploadUrl = typeof input.uploadUrl === 'string' ? input.uploadUrl.trim() : '';
    let parsedUploadUrl;
    try {
        parsedUploadUrl = new URL(uploadUrl);
    } catch {
        throw new TypeError('El enlace de carga no es una URL válida.');
    }
    if (!['http:', 'https:'].includes(parsedUploadUrl.protocol) || uploadUrl.length > 2048) {
        throw new TypeError('El enlace de carga debe usar HTTP o HTTPS.');
    }

    return {
        recipientEmail,
        userName: requiredText(input.userName, 'El nombre del miembro'),
        petName: requiredText(input.petName, 'El nombre de la mascota'),
        followupDay,
        missingDocs: input.missingDocs,
        uploadUrl,
    };
}

function buildMissingDocsTestContent(input) {
    const value = validateMissingDocsTestInput(input);
    const emailParams = { ...value, petIndex: 1 };
    const message = getMissingDocsMessage(
        value.petName,
        value.userName,
        value.followupDay,
        value.missingDocs,
    );

    return {
        ...value,
        subject: getMissingDocsSubject(value.petName, value.followupDay, value.missingDocs),
        html: buildMissingDocsEmailHtml(emailParams),
        text: `${message.body}\n\nCompleta el perfil aquí: ${value.uploadUrl}`,
    };
}

module.exports = {
    FOLLOWUP_DAYS,
    MISSING_DOC_TYPES,
    validateMissingDocsTestInput,
    buildMissingDocsTestContent,
};

