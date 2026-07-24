/**
 * Missing Pet Docs — Email Templates
 *
 * Shared generator used by the cron workflow and the admin test preview/send flow.
 * Diseño "Manada fresca" (ver Documentacion/correos-completar-perfil): tabla de 600px,
 * estilos inline, tipografía Baloo 2 (títulos) + Outfit (cuerpo) con respaldo Arial.
 */

const ASSETS_BASE = 'https://app.pataamiga.mx/email-assets/missing-docs';
const PAW_ICON_URL = `${ASSETS_BASE}/paw-teal.png`;
const FOOTER_IMAGE_URL = `${ASSETS_BASE}/footer-familia.png`;
const CURRENT_YEAR = new Date().getFullYear();

const CREMA = '#FAF7F1';
const TEAL = '#1CBCAD';
const TEAL_OSCURO = '#1E5350';
const TEXTO = '#3D524F';
const AMARILLO = '#FFC20E';
const NARANJA = '#F7941D';
const ROSA = '#F23D6D';

const FUENTE_TITULO = "'Baloo 2','Arial Rounded MT Bold','Trebuchet MS',Arial,sans-serif";
const FUENTE_TEXTO = "'Outfit',Arial,Helvetica,sans-serif";

// Héroe por día de seguimiento. Los días 0 y 10 comparten el arte de "bienvenida"
// (no hay diseño propio para el recordatorio intermedio de 10 días).
const HERO_BY_DAY = {
    0: `${ASSETS_BASE}/hero-dia15.png`,
    10: `${ASSETS_BASE}/hero-dia15.png`,
    13: `${ASSETS_BASE}/hero-dia3.png`,
    14: `${ASSETS_BASE}/hero-dia2.png`,
    15: `${ASSETS_BASE}/hero-dia1.png`,
};

const CARD_STYLE_BY_MISSING = {
    both: { bg: TEAL, text: '#FFFFFF' },
    photo: { bg: AMARILLO, text: TEAL_OSCURO },
    certificate: { bg: NARANJA, text: TEAL_OSCURO },
};

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
        14: `⏰ 2 días — deja listo el perfil de ${safePetName} hoy`,
        15: `Último día para completar el perfil de ${safePetName} 💛`,
    };

    return subjects[day] || subjects[0];
}

function getDocCopyByDay(day) {
    return {
        0: {
            photoTitle: 'SU FOTO MÁS GUAPA',
            photoDescription: 'Queremos conocerlo y que su perfil sea único.',
            certificateTitle: 'SU CERTIFICADO MÉDICO',
            certificateDescription: 'Es indispensable para tener su historial al día y acompañarlo como se merece.',
        },
        10: {
            photoTitle: 'Su FOTO',
            photoDescription: 'Esa donde sale increíble.',
            certificateTitle: 'Su CERTIFICADO MÉDICO',
            certificateDescription: 'Para tener su información completa.',
        },
        13: {
            photoTitle: 'Su FOTO',
            photoDescription: '(para reconocerlo al momento)',
            certificateTitle: 'Su CERTIFICADO MÉDICO',
            certificateDescription: '(para saber cómo cuidarlo mejor)',
        },
        14: {
            photoTitle: 'Su FOTO',
            photoDescription: '(para reconocerlo al momento)',
            certificateTitle: 'Su CERTIFICADO MÉDICO',
            certificateDescription: '(para saber cómo cuidarlo mejor)',
        },
        15: {
            photoTitle: 'Su FOTO',
            photoDescription: '(para reconocerlo al momento)',
            certificateTitle: 'Su CERTIFICADO MÉDICO',
            certificateDescription: '(para saber cómo cuidarlo mejor)',
        },
    }[day] || {
        photoTitle: 'Su FOTO',
        photoDescription: 'Para completar su perfil.',
        certificateTitle: 'Su CERTIFICADO MÉDICO',
        certificateDescription: 'Para completar su perfil.',
    };
}

/** Copy dinámico (intro, tarjeta, CTA, cierre) por día de seguimiento y variante faltante. */
function getFollowupCopy(day, missing, safePetName) {
    const preheaders = {
        0: `El perfil de ${safePetName} está a nada de quedar completo 🐾`,
        10: `Aún tenemos 10 días para completar el perfil de ${safePetName} 🐾`,
        13: `Quedan 3 días para completar el perfil de ${safePetName}`,
        14: 'Quedan 2 días… es rapidísimo dejarlo listo hoy',
        15: `Hoy es el último día para completar el perfil de ${safePetName} 💛`,
    };

    const faltaSingularOPlural = missing === 'both' ? 'un par de detalles' : 'un detalle';

    const byDay = {
        0: {
            intro: [
                'Nos da muchísimo gusto que ya seas parte de la manada 🐾',
                `Estábamos viendo el perfil de <strong>${safePetName}</strong> y está a nada de quedar completo. Solo nos falta ${faltaSingularOPlural} para conocerlo mejor y poder acompañarte cuando lo necesites:`,
            ],
            afterCard: 'Con esto listo, podemos estar preparados para acompañarte en cualquier momento. Es muy rápido y puedes hacerlo directamente desde tu dashboard.',
            ctaHeading: 'No te tomará más de unos minutos',
            ctaLabel: `Completar perfil de ${safePetName}`,
            closing: [
                'Si necesitas ayuda para subirlos o tienes cualquier duda, aquí estamos para ayudarte.',
                'Un abrazo,<br><strong>La manada Pata Amiga®</strong>',
            ],
        },
        10: {
            intro: [
                `Esperamos que estén teniendo muy buenos días junto a <strong>${safePetName}</strong> 🐾`,
                `Sabemos que el día a día se llena de cosas... y justo por eso pasamos a recordarte algo importante: el perfil de <strong>${safePetName}</strong> está a nada de quedar completo y <strong style="color:${ROSA};">AÚN TENEMOS 10 DÍAS</strong> para dejar ${faltaSingularOPlural} sin prisas.`,
            ],
            afterCard: 'Contar con su información completa nos permite estar preparados para acompañarte cuando lo necesites. Te toma menos de dos minutos.',
            ctaHeading: 'Aún tienes tiempo de sobra',
            ctaLabel: `Dejar listo el perfil de ${safePetName}`,
            closing: [
                'No lo dejes para el final… hacerlo hoy es mucho más fácil que correr después. Aquí estamos para acompañarte.',
                'Un abrazo,<br><strong>La manada Pata Amiga®</strong>',
            ],
        },
        13: {
            intro: [
                'Sabemos que el día a día se llena de cosas… y justo por eso queríamos escribirte hoy.',
                `Quedan <strong style="color:${ROSA};">3 DÍAS</strong> para completar el perfil de <strong>${safePetName}</strong> y estás a un paso de dejar todo listo.`,
                'Tener su información completa nos permite acompañarte mejor y reaccionar a tiempo cuando lo necesites.',
            ],
            afterCard: null,
            ctaHeading: 'Te toma menos de un minuto',
            ctaLabel: 'Completar perfil ahora',
            closing: [
                'Hazlo hoy y te olvidas de este pendiente 💛',
                'Aquí estamos para ustedes, siempre.<br><strong>La manada Pata Amiga®</strong>',
            ],
        },
        14: {
            intro: [
                `Pasamos por aquí porque ya estamos muy cerca del cierre: quedan <strong style="color:${ROSA};">2 DÍAS</strong> para completar el perfil de <strong>${safePetName}</strong>.`,
                'Sabemos que entre todo lo del día esto puede quedarse para después… <strong>pero hoy es el mejor momento para dejarlo listo.</strong>',
                'Con su información completa, podemos acompañarte y reaccionar a tiempo cuando lo necesites.',
            ],
            afterCard: null,
            ctaHeading: 'Lo puedes dejar listo en un momento',
            ctaLabel: 'Dejarlo listo ahora',
            closing: [
                `No lo dejes pasar… <strong>${safePetName}</strong> está a nada de estar completamente dentro de la manada 💛`,
                'Estamos contigo,<br><strong>La manada Pata Amiga®</strong>',
            ],
        },
        15: {
            intro: [
                'Pasamos por aquí con el último aviso 🐾',
                `Hoy es el <strong style="color:${ROSA};">ÚLTIMO DÍA</strong> para completar el perfil de <strong>${safePetName}</strong> y estás a un paso de dejar todo listo.`,
                'Sabemos que el día se llena… pero este pequeño paso hace toda la diferencia.',
                'Con su información completa, <strong>puedes contar con tu manada cuando lo necesites</strong> 💛',
            ],
            afterCard: null,
            ctaHeading: 'Estás a un paso de dejarlo listo',
            ctaLabel: 'Completar perfil',
            closing: [
                `Hazlo hoy y quédate con la tranquilidad de que <strong>${safePetName}</strong> ya está completamente dentro de la manada.`,
                'Estamos contigo, siempre 💛<br><strong>La manada Pata Amiga®</strong>',
            ],
        },
    };

    return { preheader: preheaders[day] || preheaders[0], ...(byDay[day] || byDay[0]) };
}

/** Compat: usado por comm.actions.ts / missing-pet-docs-admin-test.js para el fallback de texto plano. */
function getMissingDocsMessage(petName, userName, day, missing) {
    const safePetName = escapeHtml(petName || 'tu peludo');
    const copy = getFollowupCopy(Number(day), missing, safePetName);
    const bodyParts = [...copy.intro, ...(copy.afterCard ? [copy.afterCard] : [])];

    return {
        headline: copy.ctaHeading,
        body: bodyParts.join('<br><br>'),
        ctaLabel: copy.ctaLabel,
        helperText: copy.closing[0] || '',
        signoffLead: copy.closing[1] || 'La manada Pata Amiga®',
    };
}

function pillIconRow(icon, title, description, textColor) {
    return `
        <tr>
          <td width="56" valign="top" style="padding:10px 0;">
            <div style="width:44px;height:44px;background-color:#FFFFFF;border-radius:999px;text-align:center;line-height:44px;font-size:22px;">${icon}</div>
          </td>
          <td valign="middle" style="padding:10px 0 10px 14px;font-family:${FUENTE_TEXTO};color:${textColor};">
            <p style="margin:0;font-size:16px;font-weight:700;">${title}</p>
            <p style="margin:2px 0 0;font-size:14px;line-height:1.45;">${description}</p>
          </td>
        </tr>`;
}

const DIVIDER_ROW = `
        <tr><td colspan="2" style="padding:2px 0;"><div style="border-top:1px solid #FFFFFF;opacity:0.35;font-size:0;line-height:0;">&nbsp;</div></td></tr>`;

/** Tarjeta de pendientes (foto y/o certificado), coloreada según lo que falte. */
function buildMissingCard(missingDocs, day) {
    const docCopy = getDocCopyByDay(day);
    const style = CARD_STYLE_BY_MISSING[missingDocs] || CARD_STYLE_BY_MISSING.both;
    const cardTitle = missingDocs === 'both' ? 'Solo faltan estos dos detalles:' : 'Solo falta este detalle:';

    const rows = [];
    if (missingDocs === 'photo' || missingDocs === 'both') {
        rows.push(pillIconRow('📷', escapeHtml(docCopy.photoTitle), escapeHtml(docCopy.photoDescription), style.text));
    }
    if (missingDocs === 'certificate' || missingDocs === 'both') {
        if (rows.length) rows.push(DIVIDER_ROW);
        rows.push(pillIconRow('🩺', escapeHtml(docCopy.certificateTitle), escapeHtml(docCopy.certificateDescription), style.text));
    }

    return `
      <tr><td style="padding:8px 32px 0;">
        <h2 style="margin:0 0 16px;font-family:${FUENTE_TITULO};font-size:22px;line-height:1.25;color:${TEAL_OSCURO};font-weight:700;text-align:center;">${cardTitle}</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${style.bg};border-radius:24px;">
          <tr><td style="padding:20px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${rows.join('')}
            </table>
          </td></tr>
        </table>
      </td></tr>`;
}

function paragraphs(items) {
    return items
        .map((text) => `<p style="margin:0 0 18px;font-family:${FUENTE_TEXTO};font-size:16px;line-height:1.6;color:${TEXTO};">${text}</p>`)
        .join('');
}

function buildBrandedEmailShell({ firstName, heroUrl, preheader, intro, missingCardHtml, afterCard, ctaHeading, ctaLabel, uploadUrl, closing }) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Club Pata Amiga</title>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&amp;family=Outfit:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; }
  @media (max-width:620px) { .contenedor { width:100% !important; } }
</style>
</head>
<body style="margin:0;padding:0;background-color:${CREMA};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CREMA};">
  <tr><td align="center" style="padding:0;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="contenedor" style="max-width:600px;width:100%;background-color:${CREMA};">

      <!-- Cabecera: saludo + peludo -->
      <tr><td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="45%" valign="bottom" style="padding:30px 0 6px 32px;">
              <img src="${PAW_ICON_URL}" width="72" alt="" style="display:block;width:72px;height:auto;margin:0 0 22px;">
              <h1 style="margin:0;font-family:${FUENTE_TITULO};font-size:32px;line-height:1.1;color:${TEAL_OSCURO};font-weight:800;">¡Hola,<br>${firstName}!</h1>
            </td>
            <td width="55%" valign="top" align="right" style="padding:0;">
              <img src="${heroUrl}" width="330" alt="Peludo de la manada Pata Amiga" style="display:block;width:330px;max-width:100%;height:auto;">
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Cuerpo -->
      <tr><td style="padding:26px 32px 0;">
        ${intro}
      </td></tr>

      <!-- Tarjeta de pendientes -->
      ${missingCardHtml}

      ${afterCard ? `<tr><td style="padding:22px 32px 0;">${afterCard}</td></tr>` : ''}

      <!-- CTA -->
      <tr><td style="padding:26px 32px 6px;text-align:center;">
        <h2 style="margin:0 0 18px;font-family:${FUENTE_TITULO};font-size:24px;line-height:1.25;color:${TEAL_OSCURO};font-weight:700;">${ctaHeading}</h2>
        <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
          <tr><td style="background-color:${TEAL_OSCURO};border-radius:999px;">
            <a href="${uploadUrl}" style="display:inline-block;padding:16px 42px;font-family:${FUENTE_TITULO};font-size:17px;font-weight:700;color:#FFFFFF;text-decoration:none;">${ctaLabel}</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Cierre -->
      <tr><td style="padding:24px 32px 0;">
        ${closing}
      </td></tr>

      <!-- Footer con la familia -->
      <tr><td style="padding:30px 0 0;">
        <img src="${FOOTER_IMAGE_URL}" width="600" alt="La manada Pata Amiga" style="display:block;width:100%;height:auto;">
      </td></tr>
      <tr><td style="background-color:${TEAL};padding:4px 32px 26px;text-align:center;">
        <p style="margin:0 0 8px;font-family:${FUENTE_TEXTO};font-size:13px;font-weight:700;color:#FFFFFF;">Club Pata Amiga · Protección para tu manada</p>
        <p style="margin:0 0 10px;font-family:${FUENTE_TEXTO};font-size:12px;line-height:1.7;color:#EAF9F7;">
          ¿Dudas? Escríbenos a <a href="mailto:soporte@pataamiga.mx" style="color:#FFFFFF;text-decoration:underline;">soporte@pataamiga.mx</a> — estamos para ayudarte.
        </p>
        <p style="margin:0;font-family:${FUENTE_TEXTO};font-size:11px;line-height:1.6;color:#D3F2EE;">
          Pata Amiga es una membresía de salud para mascotas. No es un seguro.<br>
          Recibes este correo porque formas parte de la manada Pata Amiga. · ${CURRENT_YEAR}
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function buildMissingDocsEmailHtml(params) {
    const firstName = escapeHtml(String(params.userName || 'Miembro').trim().split(/\s+/)[0] || 'Miembro');
    const uploadUrl = escapeHtml(params.uploadUrl || '#');
    const day = Number(params.followupDay);
    const missingDocs = params.missingDocs;
    const safePetName = escapeHtml(params.petName || 'tu peludo');

    const copy = getFollowupCopy(day, missingDocs, safePetName);
    const heroUrl = HERO_BY_DAY[day] || HERO_BY_DAY[0];

    return buildBrandedEmailShell({
        firstName,
        heroUrl,
        preheader: copy.preheader,
        intro: paragraphs(copy.intro),
        missingCardHtml: buildMissingCard(missingDocs, day),
        afterCard: copy.afterCard,
        ctaHeading: copy.ctaHeading,
        ctaLabel: copy.ctaLabel,
        uploadUrl,
        closing: paragraphs(copy.closing),
    });
}

module.exports = {
    buildMissingDocsEmailHtml,
    getMissingDocsMessage,
    getMissingDocsSubject,
    IMAGE_PLACEHOLDERS: Object.freeze({}),
};
