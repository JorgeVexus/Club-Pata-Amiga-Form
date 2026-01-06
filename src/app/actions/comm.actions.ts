'use server';

/**
 * 🛰️ Server Actions para Comunicaciones
 */

import { resend, DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME } from '@/lib/resend';
import { commService } from '@/services/comm.service';
import { getServiceRoleClient } from '@/lib/supabase';

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

        return { success: true, id: resendData?.id };

    } catch (error: any) {
        console.error('❌ [Server Action] Error inesperado enviando email:', error);
        return { success: false, error: error.message };
    }
}
