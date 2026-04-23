/**
 * API Route: /api/user/verify-upload-token
 *
 * Verifica el token del magic link y devuelve la información de la mascota
 * sin requerir autenticación de Memberstack.
 *
 * POST body: { memberId, petIndex, token, exp }
 * Response:  { valid, petInfo: { name, type, missingDocs } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyUploadToken } from '@/utils/upload-token';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

export async function POST(req: NextRequest) {
    try {
        const { memberId, petIndex, token, exp } = await req.json();

        if (!memberId || !petIndex || !token || !exp) {
            return NextResponse.json({ valid: false, error: 'Parámetros incompletos' }, { status: 400 });
        }

        // Verificar token
        const isValid = verifyUploadToken(memberId, Number(petIndex), token, Number(exp));
        if (!isValid) {
            return NextResponse.json({ valid: false, error: 'Enlace inválido o expirado' }, { status: 401 });
        }

        // Obtener datos del miembro desde Memberstack
        const memberRes = await memberstackAdmin.getMember(memberId);
        if (!memberRes.success || !memberRes.data) {
            return NextResponse.json({ valid: false, error: 'Miembro no encontrado' }, { status: 404 });
        }

        const cf = memberRes.data.customFields || {};
        const idx = Number(petIndex);
        const petName = cf[`pet-${idx}-name`];

        if (!petName) {
            return NextResponse.json({ valid: false, error: 'Mascota no encontrada' }, { status: 404 });
        }

        // Determinar documentos faltantes
        const hasPhoto = !!(cf[`pet-${idx}-photo-1-url`]?.trim());
        const requiresCert = cf[`pet-${idx}-vet-certificate-required`] === 'true' || cf[`pet-${idx}-vet-certificate-required`] === true;
        const hasCert = !!(cf[`pet-${idx}-vet-certificate-url`]?.trim());

        let missingDocs: string | null = null;
        if (!hasPhoto && requiresCert && !hasCert) missingDocs = 'both';
        else if (!hasPhoto) missingDocs = 'photo';
        else if (requiresCert && !hasCert) missingDocs = 'certificate';

        return NextResponse.json({
            valid: true,
            petInfo: {
                name: petName,
                type: cf[`pet-${idx}-type`] || 'mascota',
                missingDocs,
            },
            memberId,
            petIndex: idx,
        });

    } catch (err: any) {
        console.error('❌ Error verificando token:', err);
        return NextResponse.json({ valid: false, error: 'Error interno' }, { status: 500 });
    }
}
