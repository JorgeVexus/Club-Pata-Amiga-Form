/**
 * 🧪 Endpoint de prueba para verificar el diseño del email de docs faltantes.
 *
 * USO: POST /api/cron/test-email
 *      Header: Authorization: Bearer <CRON_SECRET>
 *      Body JSON: { "email": "test@example.com", "petName": "Luna", "userName": "Jorge", "missing": "both", "day": 0 }
 *
 * IMPORTANTE: Este endpoint es solo para pruebas. Eliminar en producción final.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendMissingPetDocsEmail, type MissingDocType, type FollowupDay } from '@/app/actions/comm.actions';
import { generateUploadToken } from '@/utils/upload-token';

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
            petName = 'Luna',
            userName = 'Jorge',
            missing = 'both',
            day = 0,
        } = body;

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.pataamiga.mx';
        const testMemberId = 'test-member-id';
        const testPetIndex = 1;

        // Generar token real para que el enlace funcione
        const { token, exp } = generateUploadToken(testMemberId, testPetIndex);
        const uploadUrl = `${appUrl}/completar-documentacion?m=${testMemberId}&p=${testPetIndex}&t=${token}&exp=${exp}`;

        console.log(`🧪 [Test] Enviando email de prueba a ${email} | Día ${day} | Falta: ${missing}`);

        const result = await sendMissingPetDocsEmail({
            userId: testMemberId,
            userEmail: email,
            userName,
            petName,
            petIndex: testPetIndex,
            missingDocs: missing as MissingDocType,
            followupDay: day as FollowupDay,
            uploadUrl,
        });

        return NextResponse.json({
            success: true,
            testParams: { email, petName, userName, missing, day },
            emailResult: result,
        });

    } catch (err: any) {
        console.error('🧪 [Test] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
