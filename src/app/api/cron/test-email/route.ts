/**
 * 🧪 Endpoint de prueba para verificar el diseño del email de docs faltantes.
 *
 * USO: POST /api/cron/test-email
 *      Header: Authorization: Bearer <CRON_SECRET>
 *      Body JSON: { "email": "test@example.com", "petName": "Luna", "missing": "both", "day": 0 }
 *
 * IMPORTANTE: Este endpoint es solo para pruebas. Eliminar en producción final.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendMissingPetDocsEmail, type MissingDocType, type FollowupDay } from '@/app/actions/comm.actions';

export async function POST(req: NextRequest) {
    // Verificar autorización
    const cronSecret = req.headers.get('authorization');
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

    if (cronSecret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            email = 'asahizv1@gmail.com',
            petName = 'Mascota de Prueba',
            missing = 'both',
            day = 0,
        } = body;

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.pataamiga.mx';
        const uploadUrl = `${appUrl}/completar-documentacion?m=test-id&p=1`;

        console.log(`🧪 [Test] Enviando email de prueba a ${email} | Día ${day} | Falta: ${missing}`);

        const result = await sendMissingPetDocsEmail({
            userId: 'test-user-id',
            userEmail: email,
            userName: 'Usuario de Prueba',
            petName,
            petIndex: 1,
            missingDocs: missing as MissingDocType,
            followupDay: day as FollowupDay,
            uploadUrl,
        });

        return NextResponse.json({
            success: true,
            testParams: { email, petName, missing, day },
            emailResult: result,
        });

    } catch (err: any) {
        console.error('🧪 [Test] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
