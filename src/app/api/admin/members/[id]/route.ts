/**
 * API Route: /api/admin/members/[id]
 * Obtiene los detalles completos de un miembro
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMemberDetails } from '@/services/memberstack-admin.service';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // TODO: Validar que el usuario sea admin
        // const adminId = await validateAdminAuth(request);
        // if (!adminId) {
        //     return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        // }

        const { id: memberId } = await params;

        console.log(`📋 Obteniendo detalles de miembro ${memberId}...`);

        const result = await getMemberDetails(memberId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            member: result.data,
        });

    } catch (error: any) {
        console.error('Error obteniendo detalles de miembro:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
