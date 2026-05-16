import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser } from '@/lib/admin-auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberId, petIndex, petName, reason, description, isDeathSolidarity } = body;

        if (!memberId || petIndex === undefined || !petName || !reason) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // 1. Identificar al autor (Admin o Usuario)
        let unsubscribedBy = 'Usuario';
        let unsubscribedById = memberId;
        
        const adminUser = await getAdminUser(request);
        if (adminUser) {
            unsubscribedBy = adminUser.full_name || 'Admin';
            unsubscribedById = adminUser.memberstack_id;
        } else if (isDeathSolidarity) {
            unsubscribedBy = 'Comité (Solidaridad)';
            unsubscribedById = 'system';
        }

        // 2. Actualizar Memberstack (SOT para widgets)
        const petNum = petIndex + 1;
        const customFields: Record<string, string> = {
            [`pet-${petNum}-is-active`]: 'false',
        };

        const msResponse = await memberstackAdmin.updateMemberFields(memberId, customFields);
        
        if (!msResponse.success) {
            throw new Error(`Error actualizando Memberstack: ${msResponse.error}`);
        }

        // 3. Registrar en Supabase (Auditoría y Actividad)
        const { error: sbError } = await supabase
            .from('pet_unsubscriptions')
            .insert([{
                memberstack_id: memberId,
                pet_index: petNum,
                pet_name: petName,
                reason: reason,
                description: description || '',
                unsubscribed_by: unsubscribedBy,
                unsubscribed_by_id: unsubscribedById
            }]);

        if (sbError) {
            console.error('Error guardando en Supabase:', sbError);
            // No fallamos la respuesta si MS ya se actualizó, pero lo logueamos
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Mascota dada de baja exitosamente' 
        });

    } catch (error: any) {
        console.error('Unsubscribe API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
