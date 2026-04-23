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
import { memberstackAdmin } from '@/services/memberstack-admin.service';

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
            userName,
            missing = 'both',
            day = 0,
        } = body;

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.pataamiga.mx';

        // Buscar el miembro real por email en Memberstack
        let realMemberId = 'test-member-id';
        let resolvedUserName = userName || 'Miembro';
        let resolvedPetIndex = 1;

        const membersRes = await memberstackAdmin.listMembers(undefined, { paidOnly: false });
        if (membersRes.success && membersRes.data) {
            const found = membersRes.data.find(m => m.auth?.email === email);
            if (found) {
                realMemberId = found.id;
                const cf = found.customFields || {};
                resolvedUserName = userName || `${cf['first-name'] || ''} ${cf['paternal-last-name'] || ''}`.trim() || 'Miembro';

                // Buscar la primera mascota registrada
                for (let i = 1; i <= 3; i++) {
                    if (cf[`pet-${i}-name`]) {
                        resolvedPetIndex = i;
                        break;
                    }
                }
            }
        }

        console.log(`🧪 [Test] MemberId resuelto: ${realMemberId} | Nombre: ${resolvedUserName} | PetIndex: ${resolvedPetIndex}`);

        // Generar token real para que el enlace funcione
        const { token, exp } = generateUploadToken(realMemberId, resolvedPetIndex);
        const uploadUrl = `${appUrl}/completar-documentacion?m=${realMemberId}&p=${resolvedPetIndex}&t=${token}&exp=${exp}`;

        console.log(`🧪 [Test] Enviando email de prueba a ${email} | Día ${day} | Falta: ${missing}`);

        const result = await sendMissingPetDocsEmail({
            userId: realMemberId,
            userEmail: email,
            userName: resolvedUserName,
            petName,
            petIndex: resolvedPetIndex,
            missingDocs: missing as MissingDocType,
            followupDay: day as FollowupDay,
            uploadUrl,
        });

        return NextResponse.json({
            success: true,
            testParams: { email, petName, userName: resolvedUserName, missing, day, memberId: realMemberId },
            emailResult: result,
        });

    } catch (err: any) {
        console.error('🧪 [Test] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
