const IMAGE_PLACEHOLDERS = Object.freeze({
    hero: 'https://app.pataamiga.mx/email-assets/missing-docs/day-0-hero-cat.png',
    pack: 'https://app.pataamiga.mx/email-assets/missing-docs/day-0-family.png',
    logo: 'https://placehold.co/300x120/08BDB4/FFFFFF?text=LOGO+PATA+AMIGA',
    photoIcon: 'https://placehold.co/96x96/08BDB4/FFFFFF?text=FOTO',
    certificateIcon: 'https://placehold.co/96x96/08BDB4/FFFFFF?text=CERT',
});

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
    const docLabel = missing === 'both'
        ? 'la foto y el certificado medico'
        : missing === 'photo' ? 'la foto' : 'el certificado medico';
    const subjects = {
        0: `Casi listo! Solo falta ${docLabel} de ${safePetName}`,
        10: `Necesitas ayuda con ${docLabel} de ${safePetName}?`,
        13: `No queremos que ${safePetName} pierda sus beneficios`,
        14: `Manana es el ultimo dia para completar el perfil de ${safePetName}`,
        15: `Ultima oportunidad: activa la proteccion de ${safePetName} hoy`,
    };
    return subjects[day] || subjects[0];
}

function getMissingDocsMessage(petName, userName, day, missing) {
    const firstName = String(userName || 'Miembro').trim().split(/\s+/)[0] || 'Miembro';
    const docMissing = missing === 'both'
        ? 'la foto y el certificado medico'
        : missing === 'photo' ? 'la foto' : 'el certificado medico';
    const messages = {
        0: { headline: `Hola ${firstName}! Tu registro fue un exito`, body: `Solo falta un pequeno detalle para que ${petName} este completamente protegido. Necesitamos ${docMissing}. Es muy rapido y lo puedes hacer ahora mismo!` },
        10: { headline: `Hola ${firstName}, como van?`, body: `Hemos notado que aun falta ${docMissing} de ${petName}. Si tienes alguna duda sobre como subir los archivos, con gusto te ayudamos. Responde este correo y te orientamos.` },
        13: { headline: `${firstName}, ${petName} te necesita`, body: `Estamos en la recta final. El perfil de ${petName} aun esta incompleto y sin ${docMissing}, no podremos activar su cobertura completa. Solo te toma un momento!` },
        14: { headline: `Solo queda 1 dia, ${firstName}`, body: `Manana vence el plazo para completar el perfil de ${petName}. No queremos que pierda ningun beneficio. Sube ${docMissing} hoy y listo.` },
        15: { headline: `Es hoy, ${firstName}!`, body: `Hoy es el ultimo dia para que ${petName} tenga su perfil completo y activo. Si subes ${docMissing} ahora, todo queda en orden. No te tardes!` },
    };
    return messages[day] || messages[0];
}

function buildMissingRows(petName, missingDocs, dayZero) {
    const rows = [];
    if (missingDocs === 'photo' || missingDocs === 'both') {
        rows.push(dayZero
            ? `<tr><td width="86" valign="middle" style="padding:12px 16px 12px 0;"><img src="${IMAGE_PLACEHOLDERS.photoIcon}" width="64" height="64" alt="Icono de fotografía" style="display:block;width:64px;height:64px;border-radius:16px;"></td><td valign="middle" style="padding:12px 0;color:#FFFFFF;"><strong style="display:block;color:#171717;font-size:18px;line-height:1.2;">SU FOTO MÁS GUAPA:</strong><span style="display:block;font-size:16px;line-height:1.35;font-weight:700;">Queremos conocerlo y que su perfil sea único.</span></td></tr>`
            : `<li style="margin-bottom:12px;"><strong style="color:#2D3748;display:block;">Foto de ${petName}</strong><span style="color:#718096;font-size:13px;">Una foto clara donde se vea bien su carita</span></li>`);
    }
    if (missingDocs === 'certificate' || missingDocs === 'both') {
        rows.push(dayZero
            ? `<tr><td width="86" valign="middle" style="padding:12px 16px 12px 0;border-top:2px solid rgba(255,255,255,.75);"><img src="${IMAGE_PLACEHOLDERS.certificateIcon}" width="64" height="64" alt="Icono de certificado médico" style="display:block;width:64px;height:64px;border-radius:16px;"></td><td valign="middle" style="padding:12px 0;border-top:2px solid rgba(255,255,255,.75);color:#FFFFFF;"><strong style="display:block;color:#171717;font-size:18px;line-height:1.2;">SU CERTIFICADO MÉDICO:</strong><span style="display:block;font-size:16px;line-height:1.35;font-weight:700;">Es indispensable para tener su historial al día y brindarte el apoyo correcto.</span></td></tr>`
            : `<li style="margin-bottom:12px;"><strong style="color:#2D3748;display:block;">Certificado medico veterinario</strong><span style="color:#718096;font-size:13px;">Expedido por un medico veterinario certificado</span></li>`);
    }
    return rows.join('');
}

function buildDayZeroHtml(params) {
    const firstName = escapeHtml(String(params.userName || 'Miembro').trim().split(/\s+/)[0] || 'Miembro');
    const petName = escapeHtml(params.petName || 'tu mascota');
    const uploadUrl = escapeHtml(params.uploadUrl || '#');
    const rows = buildMissingRows(petName, params.missingDocs, true);

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Completa el perfil de ${petName}</title><style>@media only screen and (max-width:620px){.email-shell{width:100%!important}.pad{padding-left:24px!important;padding-right:24px!important}.hero-copy{width:64%!important}.hero-art{width:36%!important}.headline{font-size:28px!important}.body-copy{font-size:18px!important}.pack-image{height:auto!important}}</style></head><body style="margin:0;padding:0;background-color:#E8F4F3;font-family:'Arial Rounded MT Bold','Trebuchet MS',Arial,sans-serif;color:#171717;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#E8F4F3;"><tr><td align="center" style="padding:24px 10px;"><table data-template="missing-docs-day-0" role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background-color:#B8EBE9;overflow:hidden;">
    <tr><td style="padding:0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td class="hero-copy pad" width="58%" valign="bottom" style="width:58%;padding:76px 12px 44px 36px;"><h1 class="headline" style="margin:0 0 34px;font-family:'Fraiche','Arial Rounded MT Bold','Trebuchet MS',sans-serif;font-size:34px;line-height:1.05;letter-spacing:.5px;text-transform:uppercase;">HOLA ${firstName},</h1><p class="body-copy" style="margin:0;font-size:22px;line-height:1.34;font-weight:900;">Nos da muchísimo gusto<br>que ya seas parte de<br>la manada 🐾<br>Estábamos viendo el perfil de<br>${petName}<br>y está a nada de quedar completo.<br><u>Solo nos faltan un par de detalles para conocerlo mejor y poder acompañarte cuando lo necesites:</u></p></td><td class="hero-art" width="42%" valign="top" style="width:42%;padding:0;background-color:#FFBC05;border-bottom-left-radius:180px;"><img src="${IMAGE_PLACEHOLDERS.hero}" width="252" alt="Foto principal decorativa de una mascota" style="display:block;width:100%;max-width:252px;height:auto;"></td></tr></table></td></tr>
    <tr><td class="pad" style="padding:30px 42px 34px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#08BDB4;border-radius:42px;"><tr><td style="padding:18px 34px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table></td></tr></table></td></tr>
    <tr><td class="pad" style="padding:0 36px 32px;"><p style="margin:0;font-size:17px;line-height:1.45;font-weight:700;">Con esto listo, podemos estar preparados para darte el apoyo adecuado en cualquier momento. Es muy rápido y puedes hacerlo directamente desde tu dashboard.</p><h2 style="margin:32px 0 18px;text-align:center;font-family:'Fraiche','Arial Rounded MT Bold','Trebuchet MS',sans-serif;font-size:30px;line-height:1.1;">No te tomará más de unos minutos</h2><table role="presentation" cellspacing="0" cellpadding="0" align="center"><tr><td align="center" style="background-color:#FFBC05;border-radius:22px;"><a href="${uploadUrl}" style="display:inline-block;padding:12px 28px;color:#171717;text-decoration:none;font-size:16px;line-height:1.1;font-weight:900;">Completar perfil de<br>${petName}</a></td></tr></table><p style="margin:36px 0 0;font-size:16px;line-height:1.45;font-weight:700;">Si necesitas ayuda para subirlos o tienes cualquier duda, aquí estamos para ayudarte.</p><p style="margin:26px 0 18px;font-size:16px;line-height:1.45;font-weight:700;">Un abrazo,<br>La manada <strong>Pata Amiga®</strong></p></td></tr>
    <tr><td style="background-color:#08BDB4;border-top-left-radius:260px;padding:28px 28px 0;"><img src="${IMAGE_PLACEHOLDERS.logo}" width="170" alt="Pata Amiga" style="display:block;width:170px;max-width:42%;height:auto;margin:0 0 8px 18px;"><img class="pack-image" src="${IMAGE_PLACEHOLDERS.pack}" width="544" alt="Grupo de mascotas de Pata Amiga" style="display:block;width:100%;height:auto;"></td></tr>
    </table></td></tr></table></body></html>`;
}

function buildLegacyHtml(params) {
    const petName = escapeHtml(params.petName || 'tu mascota');
    const userName = escapeHtml(params.userName || 'Miembro');
    const uploadUrl = escapeHtml(params.uploadUrl || '#');
    const message = getMissingDocsMessage(petName, userName, params.followupDay, params.missingDocs);
    const rows = buildMissingRows(petName, params.missingDocs, false);
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Club Pata Amiga</title></head><body style="margin:0;padding:0;background-color:#F7F8FA;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:40px 20px;"><tr><td align="center"><table width="100%" style="max-width:580px;background:#FFFFFF;border-radius:24px;overflow:hidden;"><tr><td style="background:#00BBB4;padding:36px 40px;text-align:center;color:#fff;font-weight:700;">Perfil de tu mascota</td></tr><tr><td style="padding:40px;"><h1 style="margin:0 0 16px;font-size:24px;color:#2D3748;">${message.headline}</h1><p style="font-size:16px;color:#4A5568;line-height:1.7;">${message.body}</p><div style="background:#FFFBF5;border-radius:16px;padding:24px;"><ul style="margin:0;padding:0;list-style:none;">${rows}</ul></div><p style="text-align:center;margin:28px 0;"><a href="${uploadUrl}" style="display:inline-block;background:#FE8F15;color:#fff;padding:16px 40px;border-radius:50px;text-decoration:none;font-weight:700;">Completar perfil de ${petName}</a></p></td></tr></table></td></tr></table></body></html>`;
}

function buildMissingDocsEmailHtml(params) {
    return Number(params.followupDay) === 0 ? buildDayZeroHtml(params) : buildLegacyHtml(params);
}

module.exports = {
    IMAGE_PLACEHOLDERS,
    buildMissingDocsEmailHtml,
    getMissingDocsMessage,
    getMissingDocsSubject,
};
