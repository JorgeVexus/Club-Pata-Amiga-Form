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
    content: string; // Ya procesada con placeholders
    metadata?: any;
}

/**
 * Envía un email a través de Resend y lo registra en la base de datos
 */
export async function sendAdminEmail(params: SendEmailParams) {
    const { userId, adminId, templateId, to, subject, content, metadata } = params;

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
            text: content.replace(/<[^>]*>?/gm, ''), // Versión texto plano simple
            html: content.replace(/\n/g, '<br/>'), // Conversión básica a HTML
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
                type: 'whatsapp', // Usamos whatsapp como proxy para 'mensaje directo' en el log actual o podemos expandir tipos
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
