import { NextRequest, NextResponse } from 'next/server';
import { updateMemberData } from '@/services/memberstack-admin.service';
import { updatePetNameInSupabase } from '@/app/actions/user.actions';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; petId: string }> }
) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        const { id: memberId, petId } = await params;
        const body = await request.json();
        const { name, msIndex } = body; // msIndex: 1, 2, o 3

        if (!name || !msIndex) {
            return NextResponse.json({ error: 'Nombre e índice MS requeridos' }, { status: 400 });
        }

        console.log(`🔄 Actualizando nombre de mascota ${petId} a: ${name} (Miembro: ${memberId}, Índice MS: ${msIndex})`);

        // 1. Actualizar en Memberstack
        const customFields: Record<string, any> = {};
        customFields[`pet-${msIndex}-name`] = name;

        const msUpdateResult = await updateMemberData(memberId, {
            customFields
        });

        if (!msUpdateResult.success) {
            return NextResponse.json(
                { error: `Error en Memberstack: ${msUpdateResult.error}` },
                { status: 500 }
            );
        }

        // 2. Actualizar en Supabase
        const supabaseResult = await updatePetNameInSupabase(petId, name);
        
        if (!supabaseResult.success) {
            console.error('⚠️ Desincronización: Nombre de mascota actualizado en MS pero falló en Supabase');
        }

        return NextResponse.json({
            success: true,
            message: 'Nombre de mascota actualizado correctamente'
        });

    } catch (error: any) {
        console.error('Error actualizando nombre de mascota:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
