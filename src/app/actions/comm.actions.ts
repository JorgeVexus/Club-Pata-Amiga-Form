'use server';

/**
 * 🛰️ Server Actions para Comunicaciones
 */

import { resend, DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME } from '@/lib/resend';
import { commService } from '@/services/comm.service';

interface SendEmailParams {
    userId: string;
    adminId?: string;
    templateId?: string;
    to: string;
    subject: string;
    content: string; // Texto plano
    html?: string;   // Versión HTML opcional
    metadata?: any;
}

/**
 * Envía un email a través de Resend y lo registra en la base de datos
 */
export async function sendAdminEmail(params: SendEmailParams) {
    const { userId, adminId, templateId, to, subject, content, html, metadata } = params;

    console.log(`📧 [Server Action] Intentando enviar email a ${to}`);

    if (!resend) {
        console.error('❌ [Server Action] Resend no está configurado (falta RESEND_API_KEY)');
        return { success: false, error: 'Configuración de servidor incompleta (Resend)' };
    }

    try {
        // 1. Enviar el email mediante Resend API
        const { data: resendData, error: resendError } = await resend.emails.send({
            from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
            to: [to],
            subject: subject,
            text: content, // Versión texto plano
            html: html || content.replace(/\n/g, '<br/>'), // HTML o conversión básica
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

        console.log('✅ [Server Action] Email enviado exitosamente:', resendData?.id);

        // 2. Registrar el éxito en el log
        await commService.logCommunication({
            user_id: userId,
            admin_id: adminId,
            type: 'email',
            template_id: templateId,
            status: 'sent',
            content: content,
            metadata: { resendId: resendData?.id, ...metadata }
        });

        // 3. Crear notificación in-app automática
        await commService.sendInAppNotification({
            user_id: userId,
            type: 'announcement',
            title: subject,
            message: content.length > 100 ? content.substring(0, 97) + '...' : content,
            icon: '✉️',
            metadata: { method: 'automatic-email' }
        });

        return { success: true, id: resendData?.id };

    } catch (error: any) {
        console.error('❌ [Server Action] Error inesperado enviando email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Envía una notificación personalizada (libre) desde el dashboard
 */
export async function sendCustomNotification(params: {
    userId: string;
    adminId: string;
    title: string;
    message: string;
    type?: string;
    icon?: string;
}) {
    console.log(`🔔 [Server Action] Enviando notificación custom a ${params.userId}`);

    try {
        const res = await commService.sendInAppNotification({
            user_id: params.userId,
            type: params.type || 'announcement',
            title: params.title,
            message: params.message,
            icon: params.icon || '🔔',
            metadata: { admin_id: params.adminId, method: 'manual-custom' }
        });

        if (res.success) {
            // También lo registramos en el historial de comunicaciones
            await commService.logCommunication({
                user_id: params.userId,
                admin_id: params.adminId,
                type: 'app', // Notificación in-app (campana)
                status: 'sent',
                content: `[Notificación App] ${params.title}: ${params.message}`,
                metadata: { is_custom_notification: true }
            });
        }

        return res;
    } catch (error: any) {
        console.error('❌ [Server Action] Error en sendCustomNotification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Envía email cuando una apelación es resuelta (aprobada o rechazada)
 */
export async function sendAppealResolutionEmail(params: {
    userId: string;
    userEmail: string;
    petName: string;
    resolution: 'approved' | 'rejected';
    adminNotes?: string;
}) {
    const { userId, userEmail, petName, resolution, adminNotes } = params;

    console.log(`📧 [Server Action] Enviando email de resolución de apelación para ${petName} a ${userEmail}`);

    if (!resend) {
        console.error('❌ [Server Action] Resend no está configurado');
        return { success: false, error: 'Email no configurado' };
    }

    try {
        const isApproved = resolution === 'approved';
        const subject = isApproved
            ? `🎉 ¡Buenas noticias! Tu apelación para ${petName} fue aprobada`
            : `📋 Actualización sobre tu apelación para ${petName}`;

        const content = isApproved
            ? `¡Hola!

Tenemos excelentes noticias para ti 🎉

Después de revisar tu apelación, hemos decidido aprobar a ${petName}. ¡Ahora forma parte oficial de la manada de Club Pata Amiga!

${adminNotes ? `Comentarios del equipo: ${adminNotes}` : ''}

Gracias por tu paciencia durante este proceso. Estamos muy contentos de tenerte con nosotros.

Con cariño,
El equipo de Club Pata Amiga 🐾`
            : `Hola,

Queremos informarte que hemos revisado tu apelación para ${petName}.

Lamentablemente, después de una cuidadosa evaluación, no pudimos aprobar la solicitud en esta ocasión.

${adminNotes ? `Motivo: ${adminNotes}` : 'Si tienes dudas sobre esta decisión, no dudes en contactarnos.'}

Sabemos que esta no es la noticia que esperabas, y valoramos tu comprensión.

Con respeto,
El equipo de Club Pata Amiga 🐾`;

        const { data: resendData, error: resendError } = await resend.emails.send({
            from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
            to: [userEmail],
            subject: subject,
            text: content,
            html: content.replace(/\n/g, '<br/>'),
        });

        if (resendError) {
            console.error('❌ [Server Action] Error enviando email de apelación:', resendError);
            return { success: false, error: resendError.message };
        }

        console.log('✅ [Server Action] Email de resolución de apelación enviado:', resendData?.id);

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
        console.error('❌ [Server Action] Error en sendAppealResolutionEmail:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Envía email de bienvenida cuando un usuario se registra
 */
export async function sendWelcomeEmail(params: {
    userId: string;
    email: string;
    name: string;
}) {
    const { userId, email, name } = params;

    const subject = '¡Bienvenido a la familia Club Pata Amiga! 🐾';
    const content = `¡Hola ${name}!

Estamos muy emocionados de darte la bienvenida a Club Pata Amiga.

Tu registro ha sido exitoso y ya eres parte de nuestra comunidad. Ahora puedes proceder a registrar a tus peludos para obtener su membresía y placa de identificación.

Pasos a seguir:
1. Inicia sesión en tu cuenta
2. Ve a la sección de "Mis Mascotas"
3. Registra a tus mascotas
4. Espera la aprobación de nuestros administradores

Si tienes alguna duda, estamos aquí para ayudarte.

¡Gracias por confiar en nosotros!

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
