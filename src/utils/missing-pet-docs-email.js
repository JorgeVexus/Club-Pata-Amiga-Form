/**
 * Missing Pet Docs — Email Templates
 *
 * Shared generator used by the cron workflow and the admin test preview/send flow.
 * Visual design must stay unchanged; only tone and dynamic copy vary by follow-up day.
 */

const LOGO_URL = 'https://app.pataamiga.mx/Identidad/logo-pata-amiga-azul.png';
const HEADER_COLOR = '#08BDB4';
const CTA_COLOR = '#FE8F15';
const CURRENT_YEAR = new Date().getFullYear();

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getMissingDocsSubject(petName, day, missing) {
    const safePetName = String(petName ?? 'tu mascota');
    const singularDoc = missing === 'photo' ? 'la foto' : 'el certificado médico';
    const detailLabel = missing === 'both'
        ? `completar el perfil de ${safePetName}`
        : `subir ${singularDoc} de ${safePetName}`;

    const subjects = {
        0: `Ya casi queda listo: ${detailLabel}`,
        10: `Aún estamos a tiempo de completar el perfil de ${safePetName}`,
        13: `Quedan 3 días para completar el perfil de ${safePetName}`,
        14: `Quedan 2 días para completar el perfil de ${safePetName}`,
        15: `Hoy es el último día para completar el perfil de ${safePetName}`,
    };

    return subjects[day] || subjects[0];
}

function getMissingDocsMessage(petName, userName, day, missing) {
    const safePetName = escapeHtml(petName || 'tu peludo');
    const missingIntro = missing === 'both'
        ? 'Solo faltan estos dos detalles:'
        : 'Solo falta este detalle:';
    const helperBase = 'Si necesitas ayuda para subirlos o tienes cualquier duda, aquí estamos para ayudarte.';

    const messages = {
        0: {
            headline: 'Tu registro fue un éxito',
            body: `Nos da muchísimo gusto que ya seas parte de la manada 🐾<br><br>Estábamos viendo el perfil de <strong>${safePetName}</strong> y está a nada de quedar completo.<br><br>${missingIntro}<br><br>Con esto listo, podemos estar preparados para darte el apoyo adecuado en cualquier momento. Es muy rápido y puedes hacerlo directamente desde tu dashboard.<br><br>No te tomará más de unos minutos.`,
            ctaLabel: `Completar perfil de ${safePetName}`,
            helperText: helperBase,
            signoffLead: 'Un abrazo,',
        },
        10: {
            headline: `¿Cómo va todo con ${safePetName}?`,
            body: `Esperamos que estén teniendo muy buenos días juntos.<br><br>Sabemos que el día a día se llena de cosas... y justo por eso pasamos a recordarte algo importante:<br><br>El perfil de <strong>${safePetName}</strong> está a nada de quedar completo y <strong>AÚN TENEMOS 10 DÍAS</strong> para dejarlo listo sin prisas.<br><br>Contar con su información completa nos permite estar preparados para darte ese respaldo solidario cuando lo necesites.<br><br>${missingIntro}<br><br>Te toma menos de dos minutos.`,
            ctaLabel: `Dejar listo el perfil de ${safePetName}`,
            helperText: 'No lo dejes para el final... hacerlo hoy es mucho más fácil que correr después. Aquí estamos para acompañarte.',
            signoffLead: 'Un abrazo,',
        },
        13: {
            headline: 'Queríamos escribirte hoy',
            body: `Sabemos que el día a día se llena de cosas. Y justo por eso queríamos escribirte hoy.<br><br><strong>Quedan 3 DÍAS</strong> para completar el perfil de <strong>${safePetName}</strong>, y estás a un paso de dejar todo listo.<br><br>Tener su información completa nos permite acompañarte mejor y reaccionar a tiempo cuando lo necesites.<br><br>${missingIntro}<br><br>Te toma menos de un minuto.`,
            ctaLabel: 'COMPLETAR perfil ahora',
            helperText: 'Hazlo hoy y te olvidas de este pendiente 🧡',
            signoffLead: 'Aquí estamos para ustedes, siempre,',
        },
        14: {
            headline: 'Ya estamos muy cerca del cierre',
            body: `Pasamos por aquí porque ya estamos muy cerca del cierre.<br><br><strong>Quedan 2 DÍAS</strong> para completar el perfil de <strong>${safePetName}</strong>.<br><br>Sabemos que entre todo lo del día, esto puede quedarse para después... <strong>PERO HOY ES EL MEJOR MOMENTO PARA DEJARLO LISTO.</strong><br><br>Con su información completa, podemos acompañarte y darte el respaldo de la manada cuando lo necesites.<br><br>${missingIntro}<br><br>Lo puedes dejar listo en un momento.`,
            ctaLabel: 'DEJARLO listo ahora',
            helperText: `No lo dejes pasar...<br><br><strong>${safePetName}</strong> está a nada de estar completamente dentro de la manada 🧡`,
            signoffLead: 'Estamos contigo,',
        },
        15: {
            headline: 'Último aviso',
            body: `Pasamos por aquí con el último aviso 🐾<br><br>Hoy es el <strong>ÚLTIMO DÍA</strong> para completar el perfil de <strong>${safePetName}</strong> y estás a un paso de dejar todo listo.<br><br>Sabemos que el día se llena... pero este pequeño paso hace toda la diferencia.<br><br>Con su información completa, <strong>PUEDES CONTAR CON EL RESPALDO DE LA MANADA CUANDO LO NECESITES</strong> 🧡<br><br>${missingIntro}<br><br>Estás a un paso de activarlo.`,
            ctaLabel: 'COMPLETAR Perfil',
            helperText: `Hazlo hoy y quédate con la tranquilidad de que <strong>${safePetName}</strong> ya está completamente dentro de la manada.`,
            signoffLead: 'Estamos contigo, siempre 🧡',
        },
    };

    return messages[day] || messages[0];
}

function getDocCopyByDay(day) {
    return {
        0: {
            photoTitle: 'SU FOTO MÁS GUAPA',
            photoDescription: 'Queremos conocerlo y que su perfil sea único.',
            certificateTitle: 'SU CERTIFICADO MÉDICO',
            certificateDescription: 'Es indispensable para tener su historial al día y brindarte el apoyo correcto.',
        },
        10: {
            photoTitle: 'Su FOTO',
            photoDescription: 'Esa donde sale increíble.',
            certificateTitle: 'Su CERTIFICADO MÉDICO',
            certificateDescription: 'Para tener su información completa.',
        },
        13: {
            photoTitle: 'Su FOTO',
            photoDescription: 'Para reconocerlo al momento.',
            certificateTitle: 'Su CERTIFICADO MÉDICO',
            certificateDescription: 'Para acompañarte mejor cuando lo necesites.',
        },
        14: {
            photoTitle: 'Su FOTO',
            photoDescription: 'Para dejar su perfil completo.',
            certificateTitle: 'Su CERTIFICADO MÉDICO',
            certificateDescription: 'Para que toda su información quede lista.',
        },
        15: {
            photoTitle: 'Su FOTO',
            photoDescription: 'La más reciente.',
            certificateTitle: 'Su CERTIFICADO MÉDICO',
            certificateDescription: 'Para activar su perfil completo.',
        },
    }[day] || {
        photoTitle: 'Su FOTO',
        photoDescription: 'Para completar su perfil.',
        certificateTitle: 'Su CERTIFICADO MÉDICO',
        certificateDescription: 'Para completar su perfil.',
    };
}

function buildMissingRows(missingDocs, day) {
    const rows = [];
    const docCopy = getDocCopyByDay(day);

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
                                    ${escapeHtml(docCopy.photoTitle)}
                                </strong>
                                <span style="color:#718096;font-size:14px;font-family:'Outfit',Arial,sans-serif;">
                                    ${escapeHtml(docCopy.photoDescription)}
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
                                    ${escapeHtml(docCopy.certificateTitle)}
                                </strong>
                                <span style="color:#718096;font-size:14px;font-family:'Outfit',Arial,sans-serif;">
                                    ${escapeHtml(docCopy.certificateDescription)}
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

function buildBrandedEmailShell({
    firstName,
    headline,
    body,
    missingRows,
    uploadUrl,
    ctaLabel,
    helperText,
    signoffLead,
}) {
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
                <table class="email-shell" role="presentation" width="600" cellspacing="0"
                       cellpadding="0" border="0"
                       style="width:600px;max-width:600px;background:#FFFFFF;
                              border-radius:24px;overflow:hidden;
                              border:1px solid #E2E8F0;
                              box-shadow:0 10px 25px rgba(0,0,0,0.05);">
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
                    <tr>
                        <td class="pad" style="padding:40px;">
                            <h1 class="greeting"
                                style="margin:0 0 6px;font-size:28px;font-weight:700;
                                       color:#1A202C;font-family:'Outfit',Arial,sans-serif;">
                                ¡Hola, ${firstName}! 🐾
                            </h1>
                            <p style="margin:0 0 24px;font-size:18px;color:#718096;
                                      font-family:'Outfit',Arial,sans-serif;">
                                ${headline}
                            </p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr><td height="1" style="background:#EDF2F7;font-size:0;line-height:0;">&nbsp;</td></tr>
                            </table>
                            <div style="height:24px;"></div>

                            <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#4A5568;
                                      font-family:'Outfit',Arial,sans-serif;">
                                ${body}
                            </p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                                   style="margin-bottom:8px;">
                                ${missingRows}
                            </table>

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
                                            ${ctaLabel}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="height:32px;"></div>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr><td height="1" style="background:#EDF2F7;font-size:0;line-height:0;">&nbsp;</td></tr>
                            </table>
                            <div style="height:24px;"></div>

                            <p style="margin:0;font-size:15px;color:#4A5568;line-height:1.6;
                                      font-family:'Outfit',Arial,sans-serif;">
                                ${helperText}
                            </p>
                            <p style="margin:20px 0 0;font-size:15px;font-weight:700;color:#1A202C;
                                      font-family:'Outfit',Arial,sans-serif;">
                                ${signoffLead}<br>
                                <span style="color:${HEADER_COLOR};">La manada Pata Amiga®</span>
                            </p>
                        </td>
                    </tr>
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

function buildMissingDocsEmailHtml(params) {
    const firstName = escapeHtml(String(params.userName || 'Miembro').trim().split(/\s+/)[0] || 'Miembro');
    const uploadUrl = escapeHtml(params.uploadUrl || '#');
    const day = Number(params.followupDay);
    const missingDocs = params.missingDocs;

    const message = getMissingDocsMessage(params.petName, params.userName, day, missingDocs);
    const missingRows = buildMissingRows(missingDocs, day);

    return buildBrandedEmailShell({
        firstName,
        headline: escapeHtml(message.headline),
        body: message.body,
        missingRows,
        uploadUrl,
        ctaLabel: message.ctaLabel,
        helperText: message.helperText,
        signoffLead: message.signoffLead,
    });
}

module.exports = {
    buildMissingDocsEmailHtml,
    getMissingDocsMessage,
    getMissingDocsSubject,
    IMAGE_PLACEHOLDERS: Object.freeze({}),
};
