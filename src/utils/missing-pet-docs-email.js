/**
 * 📧 Missing Pet Docs — Email Templates
 *
 * Genera HTML de correo para los días de seguimiento:
 * Día 0, 10, 13, 14 y 15.
 *
 * Todos los días usan el mismo sistema de diseño de marca Pata Amiga
 * (header turquesa, logo, Outfit, botón naranja) para mantener consistencia.
 */

// ─── URLs de Assets ────────────────────────────────────────────────────────────
const LOGO_URL         = 'https://app.pataamiga.mx/Identidad/logo-pata-amiga-azul.png';
const HEADER_COLOR     = '#08BDB4';
const CTA_COLOR        = '#FE8F15';
const CURRENT_YEAR     = new Date().getFullYear();

// ─── Helpers ───────────────────────────────────────────────────────────────────

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&',  '&amp;')
        .replaceAll('<',  '&lt;')
        .replaceAll('>',  '&gt;')
        .replaceAll('"',  '&quot;')
        .replaceAll("'",  '&#039;');
}

// ─── Asunto del correo ─────────────────────────────────────────────────────────

function getMissingDocsSubject(petName, day, missing) {
    const safePetName = String(petName ?? 'tu mascota');
    const docLabel = missing === 'both'
        ? 'la foto y el certificado médico'
        : missing === 'photo' ? 'la foto' : 'el certificado médico';

    const subjects = {
        0:  `¡Casi listo! Solo falta ${docLabel} de ${safePetName}`,
        10: `¿Necesitas ayuda con ${docLabel} de ${safePetName}?`,
        13: `No queremos que ${safePetName} pierda sus beneficios`,
        14: `Mañana es el último día para completar el perfil de ${safePetName}`,
        15: `Última oportunidad: activa la protección de ${safePetName} hoy`,
    };
    return subjects[day] || subjects[0];
}

// ─── Mensaje según el día ──────────────────────────────────────────────────────

function getMissingDocsMessage(petName, userName, day, missing) {
    const firstName  = String(userName || 'Miembro').trim().split(/\s+/)[0] || 'Miembro';
    const docMissing = missing === 'both'
        ? 'la foto y el certificado médico'
        : missing === 'photo' ? 'la foto' : 'el certificado médico';

    const messages = {
        0: {
            headline: `Tu registro fue un éxito`,
            body:     `Estábamos viendo el perfil de <strong>${escapeHtml(petName)}</strong> y está a nada de quedar completo. Solo nos faltan un par de detalles para conocerlo mejor y poder acompañarte cuando lo necesites.`,
        },
        10: {
            headline: `¿Cómo van?`,
            body:     `Hemos notado que aún falta ${escapeHtml(docMissing)} de <strong>${escapeHtml(petName)}</strong>. Si tienes alguna duda sobre cómo subir los archivos, con gusto te ayudamos. Responde este correo y te orientamos.`,
        },
        13: {
            headline: `${escapeHtml(petName)} te necesita`,
            body:     `Estamos en la recta final. El perfil de <strong>${escapeHtml(petName)}</strong> aún está incompleto y sin ${escapeHtml(docMissing)}, no podremos activar su cobertura completa. ¡Solo te toma un momento!`,
        },
        14: {
            headline: `Solo queda 1 día`,
            body:     `Mañana vence el plazo para completar el perfil de <strong>${escapeHtml(petName)}</strong>. No queremos que pierda ningún beneficio. Sube ${escapeHtml(docMissing)} hoy y listo.`,
        },
        15: {
            headline: `¡Es hoy!`,
            body:     `Hoy es el último día para que <strong>${escapeHtml(petName)}</strong> tenga su perfil completo y activo. Si subes ${escapeHtml(docMissing)} ahora, todo queda en orden. ¡No te tardes!`,
        },
    };
    return messages[day] || messages[0];
}

// ─── Tarjetas de documentación faltante ───────────────────────────────────────

function buildMissingRows(petName, missingDocs) {
    const rows = [];

    if (missingDocs === 'photo' || missingDocs === 'both') {
        rows.push(`
            <tr>
                <td style="padding:0 0 12px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                           style="background:#F0FAFA;border-radius:16px;overflow:hidden;">
                        <tr>
                            <td width="68" valign="middle" style="padding:20px 0 20px 20px;">
                                <table role="presentation" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td width="48" height="48" align="center" valign="middle"
                                            style="background:${HEADER_COLOR};border-radius:12px;font-size:24px;line-height:1;">
                                            📸
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td valign="middle" style="padding:20px 20px 20px 14px;">
                                <strong style="display:block;color:#1A202C;font-size:16px;
                                               font-family:'Outfit',Arial,sans-serif;margin-bottom:4px;">
                                    Foto de ${escapeHtml(petName)}
                                </strong>
                                <span style="color:#718096;font-size:14px;font-family:'Outfit',Arial,sans-serif;">
                                    Una foto clara donde se vea bien su carita
                                </span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `);
    }

    if (missingDocs === 'certificate' || missingDocs === 'both') {
        rows.push(`
            <tr>
                <td style="padding:0 0 12px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                           style="background:#F0FAFA;border-radius:16px;overflow:hidden;">
                        <tr>
                            <td width="68" valign="middle" style="padding:20px 0 20px 20px;">
                                <table role="presentation" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td width="48" height="48" align="center" valign="middle"
                                            style="background:${HEADER_COLOR};border-radius:12px;font-size:24px;line-height:1;">
                                            🩺
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td valign="middle" style="padding:20px 20px 20px 14px;">
                                <strong style="display:block;color:#1A202C;font-size:16px;
                                               font-family:'Outfit',Arial,sans-serif;margin-bottom:4px;">
                                    Certificado médico veterinario
                                </strong>
                                <span style="color:#718096;font-size:14px;font-family:'Outfit',Arial,sans-serif;">
                                    Expedido por un médico veterinario certificado
                                </span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `);
    }

    return rows.join('');
}

// ─── Wrapper de diseño de marca (shared por todos los días) ───────────────────

function buildBrandedEmailShell({ firstName, headline, body, missingRows, uploadUrl, petName }) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Club Pata Amiga</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&amp;display=swap" rel="stylesheet">
    <style>
        @font-face {
            font-family: 'Fraiche';
            src: url('https://fonts.cdnfonts.com/s/91238/Fraiche-Regular.woff') format('woff');
            font-weight: normal;
            font-style: normal;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: #F7F8FA;
            font-family: 'Outfit', Helvetica, Arial, sans-serif;
        }
        @media only screen and (max-width: 620px) {
            .email-shell { width: 100% !important; }
            .pad         { padding-left: 24px !important; padding-right: 24px !important; }
            .greeting    { font-size: 22px !important; }
        }
    </style>
</head>
<body>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
           style="background-color:#F7F8FA;padding:24px 10px;">
        <tr>
            <td align="center">
                <!-- Email shell -->
                <table class="email-shell" role="presentation" width="600" cellspacing="0"
                       cellpadding="0" border="0"
                       style="width:600px;max-width:600px;background:#FFFFFF;
                              border-radius:24px;overflow:hidden;
                              border:1px solid #E2E8F0;
                              box-shadow:0 10px 25px rgba(0,0,0,0.05);">

                    <!-- HEADER ────────────────────────────────────────── -->
                    <tr>
                        <td style="background-color:${HEADER_COLOR};padding:36px 40px;text-align:center;">
                            <img src="${LOGO_URL}" alt="Club Pata Amiga" width="180"
                                 style="display:block;margin:0 auto 12px;max-width:180px;height:auto;">
                            <div style="color:rgba(255,255,255,0.85);font-size:12px;
                                        text-transform:uppercase;letter-spacing:2px;font-weight:700;
                                        font-family:'Outfit',Arial,sans-serif;">
                                Comunicación Oficial
                            </div>
                        </td>
                    </tr>

                    <!-- BODY ──────────────────────────────────────────── -->
                    <tr>
                        <td class="pad" style="padding:40px;">

                            <!-- Greeting -->
                            <h1 class="greeting"
                                style="margin:0 0 6px;font-size:28px;font-weight:700;
                                       color:#1A202C;font-family:'Outfit',Arial,sans-serif;">
                                ¡Hola, ${firstName}! 🐾
                            </h1>
                            <p style="margin:0 0 24px;font-size:18px;color:#718096;
                                      font-family:'Outfit',Arial,sans-serif;">
                                ${headline}
                            </p>

                            <!-- Divider -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr><td height="1" style="background:#EDF2F7;font-size:0;line-height:0;">&nbsp;</td></tr>
                            </table>
                            <div style="height:24px;"></div>

                            <!-- Body copy -->
                            <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#4A5568;
                                      font-family:'Outfit',Arial,sans-serif;">
                                ${body}
                            </p>

                            <!-- Missing docs cards -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                                   style="margin-bottom:8px;">
                                ${missingRows}
                            </table>

                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0"
                                   align="center" style="margin:28px auto 0;">
                                <tr>
                                    <td align="center"
                                        style="background-color:${CTA_COLOR};
                                               border-radius:50px;
                                               border:2px solid #000000;
                                               box-shadow:4px 4px 0 #000000;">
                                        <a href="${uploadUrl}"
                                           style="display:inline-block;padding:14px 36px;
                                                  color:#FFFFFF;text-decoration:none;
                                                  font-size:16px;font-weight:700;
                                                  font-family:'Outfit',Arial,sans-serif;
                                                  line-height:1.2;">
                                            Completar perfil de ${petName}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Divider -->
                            <div style="height:32px;"></div>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr><td height="1" style="background:#EDF2F7;font-size:0;line-height:0;">&nbsp;</td></tr>
                            </table>
                            <div style="height:24px;"></div>

                            <!-- Sign-off -->
                            <p style="margin:0;font-size:15px;color:#4A5568;line-height:1.6;
                                      font-family:'Outfit',Arial,sans-serif;">
                                Si tienes alguna duda o necesitas ayuda, responde este correo
                                y te atendemos directamente.
                            </p>
                            <p style="margin:20px 0 0;font-size:15px;font-weight:700;color:#1A202C;
                                      font-family:'Outfit',Arial,sans-serif;">
                                Con cariño,<br>
                                <span style="color:${HEADER_COLOR};">La manada Pata Amiga®</span>
                            </p>

                        </td>
                    </tr>

                    <!-- FOOTER ────────────────────────────────────────── -->
                    <tr>
                        <td style="padding:28px 40px;background:#F8FAFC;text-align:center;
                                   border-top:1px solid #EDF2F7;">
                            <p style="margin:0 0 8px;font-size:13px;color:#A0AEC0;
                                      font-family:'Outfit',Arial,sans-serif;">
                                © ${CURRENT_YEAR} Club Pata Amiga. Todos los derechos reservados.
                            </p>
                            <p style="margin:0;font-size:13px;font-family:'Outfit',Arial,sans-serif;">
                                <a href="https://pataamiga.mx"
                                   style="color:${HEADER_COLOR};text-decoration:none;font-weight:600;">
                                    Sitio Web
                                </a>
                                &nbsp;•&nbsp;
                                <a href="https://club.pataamiga.mx"
                                   style="color:${HEADER_COLOR};text-decoration:none;font-weight:600;">
                                    Portal del Miembro
                                </a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// ─── Builder público ───────────────────────────────────────────────────────────

function buildMissingDocsEmailHtml(params) {
    const firstName    = escapeHtml(String(params.userName || 'Miembro').trim().split(/\s+/)[0] || 'Miembro');
    const petName      = escapeHtml(params.petName || 'tu mascota');
    const uploadUrl    = escapeHtml(params.uploadUrl || '#');
    const day          = Number(params.followupDay);
    const missingDocs  = params.missingDocs;

    const message      = getMissingDocsMessage(params.petName, params.userName, day, missingDocs);
    const missingRows  = buildMissingRows(params.petName, missingDocs);

    return buildBrandedEmailShell({
        firstName,
        headline:    escapeHtml(message.headline),
        body:        message.body,   // may contain safe <strong> tags
        missingRows,
        uploadUrl,
        petName,
    });
}

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
    buildMissingDocsEmailHtml,
    getMissingDocsMessage,
    getMissingDocsSubject,
    // Legacy export kept for backwards-compat
    IMAGE_PLACEHOLDERS: Object.freeze({}),
};
