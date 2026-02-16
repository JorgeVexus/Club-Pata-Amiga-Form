import { NextRequest, NextResponse } from 'next/server';
import { getMemberDetails } from '@/services/memberstack-admin.service';
import { getUserDataByMemberstackId } from '@/app/actions/user.actions';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // TODO: Validar que el usuario sea admin
        const { id: memberId } = await params;

        console.log(`📋 Obteniendo detalles de miembro ${memberId}...`);

        // 1. Obtener datos de Memberstack
        const result = await getMemberDetails(memberId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        const member = result.data;

        if (!member) {
            return NextResponse.json(
                { error: 'Miembro no encontrado' },
                { status: 404 }
            );
        }

        // 2. Obtener datos de Supabase para complementar la dirección y otros campos
        try {
            const supabaseResult = await getUserDataByMemberstackId(memberId);
            if (supabaseResult.success && supabaseResult.userData) {
                const userData = supabaseResult.userData;

                // Mapear campos de Supabase a customFields de Memberstack para compatibilidad con el modal
                member.customFields = {
                    ...member.customFields,
                    'address': userData.address || member.customFields['address'],
                    'colony': userData.colony || member.customFields['colony'],
                    'city': userData.city || member.customFields['city'],
                    'state': userData.state || member.customFields['state'],
                    'postal-code': userData.postal_code || member.customFields['postal-code'],
                    'phone': userData.phone || member.customFields['phone'],
                    'curp': userData.curp || member.customFields['curp'],
                };

                console.log(`✅ Datos de Supabase combinados para ${memberId}`);
            }
        } catch (supabaseError) {
            console.warn(`⚠️ Error al obtener datos de Supabase para ${memberId}:`, supabaseError);
            // Continuamos aunque falle Supabase para no romper el modal
        }

        return NextResponse.json({
            success: true,
            member: member,
        });

    } catch (error: any) {
        console.error('Error obteniendo detalles de miembro:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
