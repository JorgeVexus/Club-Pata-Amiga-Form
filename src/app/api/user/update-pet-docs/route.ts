/**
 * API Route: /api/user/update-pet-docs
 *
 * Actualiza los custom fields de un miembro en Memberstack con las URLs
 * de los documentos subidos. Acepta autenticación por token (magic link).
 *
 * POST body: { memberId, fields, token?, exp?, petIndex? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyUploadToken } from '@/utils/upload-token';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

export async function POST(req: NextRequest) {
    try {
        const { memberId, fields, token, exp, petIndex } = await req.json();

        if (!memberId || !fields || Object.keys(fields).length === 0) {
            return NextResponse.json({ success: false, error: 'Parámetros incompletos' }, { status: 400 });
        }

        // Verificar autenticación: token del magic link
        if (token && exp && petIndex) {
            const isValid = verifyUploadToken(memberId, Number(petIndex), token, Number(exp));
            if (!isValid) {
                return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 401 });
            }
        } else {
            // Sin token — este endpoint requiere algún tipo de autenticación
            return NextResponse.json({ success: false, error: 'Autenticación requerida' }, { status: 401 });
        }

        // Actualizar custom fields en Memberstack
        console.log(`📝 [UpdatePetDocs] Actualizando miembro ${memberId}:`, Object.keys(fields));

        const updateRes = await memberstackAdmin.updateMemberFields(memberId, fields);

        if (!updateRes.success) {
            console.error('❌ [UpdatePetDocs] Error actualizando Memberstack:', updateRes.error);
            return NextResponse.json({ success: false, error: 'Error actualizando el perfil' }, { status: 500 });
        }

        console.log(`✅ [UpdatePetDocs] Miembro ${memberId} actualizado exitosamente`);

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('❌ [UpdatePetDocs] Error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
