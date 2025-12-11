/**
 * API Route: /api/admin/members
 * Maneja operaciones administrativas sobre miembros
 */

import { NextRequest, NextResponse } from 'next/server';
import { listPendingMembers, listAppealedMembers } from '@/services/memberstack-admin.service';

/**
 * GET /api/admin/members?status=pending
 * Lista miembros según su estado de aprobación
 */
export async function GET(request: NextRequest) {
    try {
        // TODO: Validar que el usuario sea admin
        // const adminId = await validateAdminAuth(request);
        // if (!adminId) {
        //     return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        // }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let result;

        if (status === 'pending') {
            result = await listPendingMembers();
        } else if (status === 'appealed') {
            result = await listAppealedMembers();
        } else {
            return NextResponse.json(
                { error: 'Status inválido. Usa: pending o appealed' },
                { status: 400 }
            );
        }

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            members: result.data,
            count: result.data?.length || 0,
        });

    } catch (error: any) {
        console.error('Error en GET /api/admin/members:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
