'use server';

/**
 * 🛰️ Server Actions para Comunicaciones
 */

import { resend, DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME, MEMBERS_FROM_EMAIL, MEMBERS_FROM_NAME, REPLY_TO_EMAIL } from '@/lib/resend';
import { commService } from '@/services/comm.service';
import { buildBrandedEmailHtml } from '@/utils/email-builder';

interface SendEmailParams {
    userId: string;
    adminId?: string;
    templateId?: string;
    to: string;
    subject: string;
    content: string; // Texto plano
    html?: string;   // Versión HTML opcional
    audience?: 'member' | 'ambassador' | 'wellness-center' | 'general';
    memberName?: string; // Para el saludo del builder
    metadata?: any;
}

/**
 * Envía un email a través de Resend y lo registra en la base de datos
 */
export async function sendAdminEmail(params: SendEmailParams) {
    const { userId, adminId, templateId, to, subject, content, html, audience = 'general', memberName = 'Miembro', metadata } = params;

    console.log(`📧 [Server Action] Intentando enviar email a ${to}`);

    if (!resend) {
        console.error('❌ [Server Action] Resend no está configurado (falta RESEND_API_KEY)');
        return { success: false, error: 'Configuración de servidor incompleta (Resend)' };
    }

    try {
        // Generar HTML de marca si no se proporciona uno explícito
        const finalHtml = html || buildBrandedEmailHtml({
            memberName,
            subject,
            content,
            audience
        });

        // 1. Enviar el email mediante Resend API
        const { data: resendData, error: resendError } = await resend.emails.send({
            from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
            to: [to],
            subject: subject,
            text: content, // Versión texto plano
            html: finalHtml,
        });

        if (resendError) {
            console.error('❌ [Server Action] Error de Resend:', resendError);

            // Loguear el fallo
            await commService.logCommunication({
                user_id: userId,
                admin_id: adminId,
                type: 'email',
                template_id: templateId,
                status: 'failed',
                content: content,
                metadata: { error: resendError, ...metadata }
            });

            return { success: false, error: resendError.message };
        }

        console.log('âœ… [Server Action] Email enviado exitosamente:', resendData?.id);

        // 2. Registrar el Ã©xito en el log
        await commService.logCommunication({
            user_id: userId,
            admin_id: adminId,
            type: 'email',
            template_id: templateId,
            status: 'sent',
            content: content,
            metadata: { resendId: resendData?.id, ...metadata }
        });

        // 3. Crear notificaciÃ³n in-app automÃ¡tica
        await commService.sendInAppNotification({
            user_id: userId,
            type: 'announcement',
            title: subject,
            message: content.length > 100 ? content.substring(0, 97) + '...' : content,
            icon: 'âœ‰ï¸',
            metadata: { method: 'automatic-email' }
        });

        return { success: true, id: resendData?.id };

    } catch (error: any) {
        console.error('âŒ [Server Action] Error inesperado enviando email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * EnvÃ­a una notificaciÃ³n personalizada (libre) desde el dashboard
 */
export async function sendCustomNotification(params: {
    userId: string;
    adminId: string;
    title: string;
    message: string;
    type?: string;
    icon?: string;
}) {
    console.log(`ðŸ”” [Server Action] Enviando notificaciÃ³n custom a ${params.userId}`);

    try {
        const res = await commService.sendInAppNotification({
            user_id: params.userId,
            type: params.type || 'announcement',
            title: params.title,
            message: params.message,
            icon: params.icon || 'ðŸ””',
            metadata: { admin_id: params.adminId, method: 'manual-custom' }
        });

        if (res.success) {
            // TambiÃ©n lo registramos en el historial de comunicaciones
            await commService.logCommunication({
                user_id: params.userId,
                admin_id: params.adminId,
                type: 'app', // NotificaciÃ³n in-app (campana)
                status: 'sent',
                content: `[NotificaciÃ³n App] ${params.title}: ${params.message}`,
                metadata: { is_custom_notification: true }
            });
        }

        return res;
    } catch (error: any) {
        console.error('âŒ [Server Action] Error en sendCustomNotification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * EnvÃ­a email cuando una apelaciÃ³n es resuelta (aprobada o rechazada)
 */
export async function sendAppealResolutionEmail(params: {
    userId: string;
    userEmail: string;
    petName: string;
    resolution: 'approved' | 'rejected';
    adminNotes?: string;
}) {
    const { userId, userEmail, petName, resolution, adminNotes } = params;

    console.log(`ðŸ“§ [Server Action] Enviando email de resoluciÃ³n de apelaciÃ³n para ${petName} a ${userEmail}`);

    if (!resend) {
        console.error('âŒ [Server Action] Resend no estÃ¡ configurado');
        return { success: false, error: 'Email no configurado' };
    }

    try {
        const isApproved = resolution === 'approved';
        const subject = isApproved
            ? `ðŸŽ‰ Â¡Buenas noticias! Tu apelaciÃ³n para ${petName} fue aprobada`
            : `ðŸ“‹ ActualizaciÃ³n sobre tu apelaciÃ³n para ${petName}`;

        const content = isApproved
            ? `Â¡Hola!

Tenemos excelentes noticias para ti ðŸŽ‰

DespuÃ©s de revisar tu apelaciÃ³n, hemos decidido aprobar a ${petName}. Â¡Ahora forma parte oficial de la manada de Club Pata Amiga!

${adminNotes ? `Comentarios del equipo: ${adminNotes}` : ''}

Gracias por tu paciencia durante este proceso. Estamos muy contentos de tenerte con nosotros.

Con cariÃ±o,
El equipo de Club Pata Amiga ðŸ¾`
            : `Hola,

Queremos informarte que hemos revisado tu apelaciÃ³n para ${petName}.

Lamentablemente, despuÃ©s de una cuidadosa evaluaciÃ³n, no pudimos aprobar la solicitud en esta ocasiÃ³n.

${adminNotes ? `Motivo: ${adminNotes}` : 'Si tienes dudas sobre esta decisiÃ³n, no dudes en contactarnos.'}

Sabemos que esta no es la noticia que esperabas, y valoramos tu comprensiÃ³n.

Con respeto,
El equipo de Club Pata Amiga ðŸ¾`;

        const { data: resendData, error: resendError } = await resend.emails.send({
            from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
            to: [userEmail],
            subject: subject,
            text: content,
            html: content.replace(/\n/g, '<br/>'),
        });

        if (resendError) {
            console.error('âŒ [Server Action] Error enviando email de apelaciÃ³n:', resendError);
            return { success: false, error: resendError.message };
        }

        console.log('âœ… [Server Action] Email de resoluciÃ³n de apelaciÃ³n enviado:', resendData?.id);

        // Registrar en logs
        await commService.logCommunication({
            user_id: userId,
            type: 'email',
            status: 'sent',
            content: content,
            metadata: {
                type: 'appeal_resolution',
                petName,
                resolution,
                resendId: resendData?.id
            }
        });

        return { success: true, id: resendData?.id };
    } catch (error: any) {
        console.error('âŒ [Server Action] Error en sendAppealResolutionEmail:', error);
        return { success: false, error: error.message };
    }
}

/**
 * EnvÃ­a email de bienvenida cuando un usuario se registra
 */
export async function sendWelcomeEmail(params: {
    userId: string;
    email: string;
    name: string;
}) {
    const { userId, email, name } = params;

    const subject = 'Â¡Bienvenido a la familia Club Pata Amiga! ðŸ¾';
    const content = `Â¡Hola ${name}!

Estamos muy emocionados de darte la bienvenida a Club Pata Amiga.

Tu registro ha sido exitoso y ya eres parte de nuestra comunidad. Ahora puedes proceder a registrar a tus peludos para obtener su membresÃ­a y placa de identificaciÃ³n.

Pasos a seguir:
1. Inicia sesiÃ³n en tu cuenta
2. Ve a la secciÃ³n de "Mis Mascotas"
3. Registra a tus mascotas
4. Espera la aprobaciÃ³n de nuestros administradores

Si tienes alguna duda, estamos aquÃ­ para ayudarte.

Â¡Gracias por confiar en nosotros!

Atentamente,
El equipo de Club Pata Amiga`;

    return await sendAdminEmail({
        userId,
        to: email,
        subject,
        content,
        metadata: { type: 'welcome_email' }
    });
}

// ============================================================
// SEGUIMIENTO DE DOCUMENTACION FALTANTE DE MASCOTAS
// ============================================================

export type MissingDocType = 'photo' | 'certificate' | 'both';
export type FollowupDay = 0 | 10 | 13 | 14 | 15;

interface SendMissingPetDocsEmailParams {
    userId: string;
    userEmail: string;
    userName: string;
    petName: string;
    petIndex: number;
    missingDocs: MissingDocType;
    followupDay: FollowupDay;
    uploadUrl: string;
}

function getMissingDocsSubject(petName: string, day: FollowupDay, missing: MissingDocType): string {
    const docLabel = missing === 'both'
        ? 'la foto y el certificado medico'
        : missing === 'photo' ? 'la foto' : 'el certificado medico';
    const subjects: Record<FollowupDay, string> = {
        0:  `Casi listo! Solo falta ${docLabel} de ${petName}`,
        10: `Necesitas ayuda con ${docLabel} de ${petName}?`,
        13: `No queremos que ${petName} pierda sus beneficios`,
        14: `Manana es el ultimo dia para completar el perfil de ${petName}`,
        15: `Ultima oportunidad: activa la proteccion de ${petName} hoy`,
    };
    return subjects[day];
}

function getMissingDocsMessage(
    petName: string,
    userName: string,
    day: FollowupDay,
    missing: MissingDocType
): { headline: string; body: string } {
    const firstName = userName.split(' ')[0];
    const docMissing = missing === 'both'
        ? 'la foto y el certificado medico'
        : missing === 'photo' ? 'la foto' : 'el certificado medico';
    const messages: Record<FollowupDay, { headline: string; body: string }> = {
        0:  { headline: `Hola ${firstName}! Tu registro fue un exito`, body: `Solo falta un pequeno detalle para que ${petName} este completamente protegido. Necesitamos ${docMissing}. Es muy rapido y lo puedes hacer ahora mismo!` },
        10: { headline: `Hola ${firstName}, como van?`, body: `Hemos notado que aun falta ${docMissing} de ${petName}. Si tienes alguna duda sobre como subir los archivos, con gusto te ayudamos. Responde este correo y te orientamos.` },
        13: { headline: `${firstName}, ${petName} te necesita`, body: `Estamos en la recta final. El perfil de ${petName} aun esta incompleto y sin ${docMissing}, no podremos activar su cobertura completa. Solo te toma un momento!` },
        14: { headline: `Solo queda 1 dia, ${firstName}`, body: `Manana vence el plazo para completar el perfil de ${petName}. No queremos que pierda ningun beneficio. Sube ${docMissing} hoy y listo.` },
        15: { headline: `Es hoy, ${firstName}!`, body: `Hoy es el ultimo dia para que ${petName} tenga su perfil completo y activo. Si subes ${docMissing} ahora, todo queda en orden. No te tardes!` },
    };
    return messages[day];
}

function buildMissingDocsEmailHtml(params: SendMissingPetDocsEmailParams): string {
    const { petName, userName, missingDocs, followupDay, uploadUrl } = params;
    const { headline, body } = getMissingDocsMessage(petName, userName, followupDay, missingDocs);

    const missingItems: string[] = [];
    if (missingDocs === 'photo' || missingDocs === 'both') {
        missingItems.push(`<li style="margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;"><span style="width:32px;height:32px;border-radius:50%;background:#FE8F15;color:#fff;display:inline-block;text-align:center;line-height:32px;font-size:16px;flex-shrink:0;">foto</span><div><strong style="color:#2D3748;display:block;margin-bottom:2px;">Foto de ${petName}</strong><span style="color:#718096;font-size:13px;">Una foto clara donde se vea bien su carita</span></div></li>`);
    }
    if (missingDocs === 'certificate' || missingDocs === 'both') {
        missingItems.push(`<li style="margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;"><span style="width:32px;height:32px;border-radius:50%;background:#7DD8D5;color:#fff;display:inline-block;text-align:center;line-height:32px;font-size:16px;flex-shrink:0;">doc</span><div><strong style="color:#2D3748;display:block;margin-bottom:2px;">Certificado medico veterinario</strong><span style="color:#718096;font-size:13px;">Expedido por un medico veterinario certificado</span></div></li>`);
    }

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Club Pata Amiga</title></head><body style="margin:0;padding:0;background-color:#F7F8FA;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:40px 20px;"><tr><td align="center"><table width="100%" style="max-width:580px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#7DD8D5 0%,#00BBB4 100%);padding:36px 40px;text-align:center;"><img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6929e0aea61dcbb985e68c84_logo.svg" alt="Club Pata Amiga" height="44" style="display:block;margin:0 auto 16px;"/><p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Perfil de tu mascota</p></td></tr><tr><td style="padding:40px 40px 24px;"><h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#2D3748;line-height:1.3;">${headline}</h1><p style="margin:0 0 28px;font-size:16px;color:#4A5568;line-height:1.7;">${body}</p><div style="background:#FFFBF5;border:1.5px solid #FEE4C4;border-radius:16px;padding:24px;margin-bottom:28px;"><p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#FE8F15;text-transform:uppercase;letter-spacing:0.5px;">Documentos pendientes</p><ul style="margin:0;padding:0;list-style:none;">${missingItems.join('')}</ul></div><div style="text-align:center;margin-bottom:28px;"><a href="${uploadUrl}" style="display:inline-block;background:#FE8F15;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:50px;border:2px solid #000000;box-shadow:0 4px 14px rgba(254,143,21,0.35);">Completar perfil de ${petName}</a></div><p style="margin:0;font-size:13px;color:#A0AEC0;text-align:center;line-height:1.6;">Si ya lo completaste o tienes dudas, responde este correo y con gusto te ayudamos.</p></td></tr><tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #EDF2F7;margin:0;"/></td></tr><tr><td style="padding:24px 40px 36px;text-align:center;"><p style="margin:0 0 8px;font-size:13px;color:#718096;">Con carino, <strong style="color:#2D3748;">El equipo de Club Pata Amiga</strong></p><p style="margin:0;font-size:11px;color:#A0AEC0;">No reconoces esta cuenta? <a href="mailto:miembros@pataamiga.mx" style="color:#7DD8D5;text-decoration:none;">Contactanos</a></p></td></tr></table></td></tr></table></body></html>`;
}

/**
 * Envia el email de seguimiento de documentacion faltante.
 *
 * FROM:     miembros@app.pataamiga.mx  (dominio verificado en Resend)
 * REPLY-TO: miembros@pataamiga.mx     (buzon principal con bandeja activa)
 */
export async function sendMissingPetDocsEmail(params: SendMissingPetDocsEmailParams) {
    const { userId, userEmail, petName, missingDocs, followupDay } = params;

    console.log(`[MissingDocs] Dia ${followupDay} -> ${userEmail} | ${petName} | Falta: ${missingDocs}`);

    if (!resend) {
        console.error('[MissingDocs] Resend no configurado (falta RESEND_API_KEY)');
        return { success: false, error: 'Resend no configurado' };
    }

    const subject = getMissingDocsSubject(petName, followupDay, missingDocs);
    const html = buildMissingDocsEmailHtml(params);
    const plainText = `${getMissingDocsMessage(petName, params.userName, followupDay, missingDocs).body}\n\nCompleta el perfil aqui: ${params.uploadUrl}`;

    try {
        const { data, error } = await resend.emails.send({
            from: `${MEMBERS_FROM_NAME} <${MEMBERS_FROM_EMAIL}>`,
            to: [userEmail],
            replyTo: REPLY_TO_EMAIL,
            subject,
            html,
            text: plainText,
        });

        if (error) {
            console.error('[MissingDocs] Error de Resend:', error);
            await commService.logCommunication({
                user_id: userId,
                type: 'email',
                template_id: `missing_docs_day_${followupDay}`,
                status: 'failed',
                content: plainText,
                metadata: { error, petName, missingDocs, followupDay },
            });
            return { success: false, error: error.message };
        }

        console.log(`[MissingDocs] Email enviado. ID: ${data?.id}`);

        await commService.logCommunication({
            user_id: userId,
            type: 'email',
            template_id: `missing_docs_day_${followupDay}`,
            status: 'sent',
            content: plainText,
            metadata: { resendId: data?.id, petName, missingDocs, followupDay, uploadUrl: params.uploadUrl },
        });

        return { success: true, id: data?.id };
    } catch (err: any) {
        console.error('[MissingDocs] Error inesperado:', err);
        return { success: false, error: err.message };
    }
}

// ============================================================
// SOLICITUD DE INFORMACIÓN POR ADMIN (Triggered, no Cron)
// ============================================================

interface InfoRequestItem {
    type: string;
    label: string;
    icon: string;
    description: string;
}

interface SendInfoRequestEmailParams {
    userId: string;
    userEmail: string;
    userName: string;
    petName: string;
    petId: string;
    requestTypes: InfoRequestItem[];
    customMessage: string | null;
    dashboardUrl: string;
}

function buildInfoRequestEmailHtml(params: SendInfoRequestEmailParams): string {
    const { petName, userName, requestTypes, customMessage, dashboardUrl } = params;
    const firstName = userName.split(' ')[0] || 'Miembro';

    const requestItems = requestTypes.map(item => {
        const bgColor = item.type === 'PET_PHOTO_1' ? '#FE8F15' :
            item.type === 'PET_VET_CERT' ? '#7DD8D5' : '#A0AEC0';

        return `<li style="margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;">
            <span style="width:32px;height:32px;border-radius:50%;background:${bgColor};color:#fff;display:inline-block;text-align:center;line-height:32px;font-size:16px;flex-shrink:0;">${item.icon}</span>
            <div>
                <strong style="color:#2D3748;display:block;margin-bottom:2px;">${item.label}</strong>
                <span style="color:#718096;font-size:13px;">${item.description}</span>
            </div>
        </li>`;
    }).join('');

    const customNote = customMessage
        ? `<div style="background:#F7FAFC;border-left:4px solid #FE8F15;padding:16px;border-radius:0 12px 12px 0;margin-bottom:28px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#FE8F15;text-transform:uppercase;">Mensaje del equipo</p>
            <p style="margin:0;font-size:14px;color:#4A5568;line-height:1.6;">${customMessage}</p>
           </div>`
        : '';

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Club Pata Amiga</title></head><body style="margin:0;padding:0;background-color:#F7F8FA;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:40px 20px;"><tr><td align="center"><table width="100%" style="max-width:580px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#7DD8D5 0%,#00BBB4 100%);padding:36px 40px;text-align:center;"><img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6929e0aea61dcbb985e68c84_logo.svg" alt="Club Pata Amiga" height="44" style="display:block;margin:0 auto 16px;"/><p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Acción requerida</p></td></tr><tr><td style="padding:40px 40px 24px;"><h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#2D3748;line-height:1.3;">Hola ${firstName}, necesitamos tu ayuda 🐾</h1><p style="margin:0 0 28px;font-size:16px;color:#4A5568;line-height:1.7;">Nuestro equipo ha revisado el expediente de <strong>${petName}</strong> y necesitamos que nos proporciones la siguiente información para continuar con la aprobación:</p><div style="background:#FFFBF5;border:1.5px solid #FEE4C4;border-radius:16px;padding:24px;margin-bottom:28px;"><p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#FE8F15;text-transform:uppercase;letter-spacing:0.5px;">Información solicitada</p><ul style="margin:0;padding:0;list-style:none;">${requestItems}</ul></div>${customNote}<div style="text-align:center;margin-bottom:28px;"><a href="${dashboardUrl}" style="display:inline-block;background:#FE8F15;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:50px;border:2px solid #000000;box-shadow:0 4px 14px rgba(254,143,21,0.35);">Abrir mi expediente</a></div><p style="margin:0 0 8px;font-size:13px;color:#A0AEC0;text-align:center;line-height:1.6;">También puedes subir la información directamente desde tu página de miembro en <a href="https://club.pataamiga.mx/mi-membresia" style="color:#00BBB4;font-weight:600;text-decoration:none;">club.pataamiga.mx</a></p><p style="margin:0;font-size:13px;color:#A0AEC0;text-align:center;line-height:1.6;">Si tienes dudas, responde este correo y con gusto te ayudamos.</p></td></tr><tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #EDF2F7;margin:0;"/></td></tr><tr><td style="padding:24px 40px 36px;text-align:center;"><p style="margin:0 0 8px;font-size:13px;color:#718096;">Con cariño, <strong style="color:#2D3748;">El equipo de Club Pata Amiga</strong></p><p style="margin:0;font-size:11px;color:#A0AEC0;">¿No reconoces esta cuenta? <a href="mailto:miembros@pataamiga.mx" style="color:#7DD8D5;text-decoration:none;">Contáctanos</a></p></td></tr></table></td></tr></table></body></html>`;
}

/**
 * Envía email de solicitud de información disparado por un admin.
 *
 * FROM:     miembros@app.pataamiga.mx  (dominio verificado en Resend)
 * REPLY-TO: miembros@pataamiga.mx     (buzón principal con bandeja activa)
 */
export async function sendInfoRequestEmail(params: SendInfoRequestEmailParams) {
    const { userId, userEmail, petName, requestTypes } = params;

    console.log(`📧 [InfoRequest] Enviando email a ${userEmail} | ${petName} | Items: ${requestTypes.map(r => r.type).join(', ')}`);

    if (!resend) {
        console.error('❌ [InfoRequest] Resend no configurado (falta RESEND_API_KEY)');
        return { success: false, error: 'Resend no configurado' };
    }

    const itemLabels = requestTypes.map(r => r.label).join(', ');
    const subject = `📋 Necesitamos ${requestTypes.length === 1 ? itemLabels : 'información adicional'} de ${petName}`;
    const html = buildInfoRequestEmailHtml(params);
    const plainText = `Hola, necesitamos la siguiente información de ${petName}: ${itemLabels}. Visita tu panel de miembro para completar tu expediente: ${params.dashboardUrl}`;

    try {
        const { data, error } = await resend.emails.send({
            from: `${MEMBERS_FROM_NAME} <${MEMBERS_FROM_EMAIL}>`,
            to: [userEmail],
            replyTo: REPLY_TO_EMAIL,
            subject,
            html,
            text: plainText,
        });

        if (error) {
            console.error('❌ [InfoRequest] Error de Resend:', error);
            await commService.logCommunication({
                user_id: userId,
                type: 'email',
                template_id: 'admin_info_request',
                status: 'failed',
                content: plainText,
                metadata: { error, petName, requestTypes: requestTypes.map(r => r.type) },
            });
            return { success: false, error: error.message };
        }

        console.log(`✅ [InfoRequest] Email enviado. ID: ${data?.id}`);

        await commService.logCommunication({
            user_id: userId,
            type: 'email',
            template_id: 'admin_info_request',
            status: 'sent',
            content: plainText,
            metadata: {
                resendId: data?.id,
                petName,
                requestTypes: requestTypes.map(r => r.type),
                dashboardUrl: params.dashboardUrl
            },
        });

        return { success: true, id: data?.id };
    } catch (err: any) {
        console.error('❌ [InfoRequest] Error inesperado:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Construye el HTML para el correo de baja por incumplimiento
 */
export async function buildTerminationEmailHtml(memberName: string, reason?: string) {
    const subject = 'Aviso de Baja de Membresía';
    const content = `Hola ${memberName},
    
Lamentamos informarte que tu membresía en Club Pata Amiga ha sido dada de baja debido al incumplimiento de nuestras políticas de uso.

${reason ? `Motivo de la baja: ${reason}` : ''}

Esta decisión implica la revocación inmediata de todos tus beneficios, servicios y coberturas asociadas a tu cuenta y a tus mascotas registradas.

Si consideras que esto es un error o deseas apelar esta decisión, por favor contáctanos respondiendo a este correo o a través de nuestros canales oficiales.`;

    return buildBrandedEmailHtml({
        memberName,
        subject,
        content,
        audience: 'general' // O una específica si se prefiere
    });
}




