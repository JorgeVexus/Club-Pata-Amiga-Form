import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';
import {
    MEMBERS_FROM_EMAIL,
    MEMBERS_FROM_NAME,
    REPLY_TO_EMAIL,
    resend,
} from '@/lib/resend';
import { buildMissingDocsTestContent } from '@/utils/missing-pet-docs-admin-test';

export async function POST(request: NextRequest) {
    const admin = await getAdminUser(request);
    if (!admin || ('isUnauthorized' in admin && admin.isUnauthorized)) {
        return unauthorizedResponse();
    }

    try {
        const body: unknown = await request.json();
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ success: false, error: 'Solicitud inválida.' }, { status: 400 });
        }

        const input = body as Record<string, unknown>;
        if (input.action !== 'preview' && input.action !== 'send') {
            return NextResponse.json({ success: false, error: 'Acción inválida.' }, { status: 400 });
        }

        const content = buildMissingDocsTestContent(body);
        if (input.action === 'preview') {
            return NextResponse.json({
                success: true,
                subject: content.subject,
                html: content.html,
            });
        }

        if (!resend) {
            return NextResponse.json(
                { success: false, error: 'Resend no está configurado.' },
                { status: 500 },
            );
        }

        const { data, error } = await resend.emails.send({
            from: `${MEMBERS_FROM_NAME} <${MEMBERS_FROM_EMAIL}>`,
            to: [content.recipientEmail],
            replyTo: REPLY_TO_EMAIL,
            subject: content.subject,
            html: content.html,
            text: content.text,
        });

        if (error) {
            console.error('[Admin MissingDocs Test] Resend rechazó el envío:', error);
            return NextResponse.json(
                { success: false, error: error.message || 'No fue posible enviar la prueba.' },
                { status: 500 },
            );
        }

        console.info('[Admin MissingDocs Test] Envío completado:', {
            admin: admin.email,
            recipient: content.recipientEmail,
            day: content.followupDay,
            missingDocs: content.missingDocs,
            resendId: data?.id,
        });

        return NextResponse.json({
            success: true,
            id: data?.id,
            recipientEmail: content.recipientEmail,
        });
    } catch (error) {
        if (error instanceof TypeError) {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        console.error('[Admin MissingDocs Test] Error inesperado:', error);
        return NextResponse.json(
            { success: false, error: 'No fue posible procesar la prueba.' },
            { status: 500 },
        );
    }
}

