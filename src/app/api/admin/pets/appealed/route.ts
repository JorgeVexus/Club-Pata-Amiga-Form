/**
 * API Route: /api/admin/pets/appealed
 * Obtiene todas las mascotas de usuarios que han apelado
 * CORREGIDO: Ahora busca por membership_status del dueño, no solo por status de mascota
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    try {
        console.log('📋 Obteniendo mascotas de usuarios apelados...');

        // Primero: obtener usuarios con membership_status = 'appealed'
        const { data: appealedUsers, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id, memberstack_id, first_name, last_name, email, membership_status, last_appeal_message')
            .eq('membership_status', 'appealed');

        if (usersError) {
            console.error('Error obteniendo usuarios apelados:', usersError);
            return NextResponse.json({ error: usersError.message }, { status: 500 });
        }

        if (!appealedUsers || appealedUsers.length === 0) {
            console.log('✅ No hay usuarios en estado de apelación');
            return NextResponse.json({ success: true, pets: [] });
        }

        console.log(`📌 Encontrados ${appealedUsers.length} usuarios en apelación`);

        // Segundo: obtener las mascotas de esos usuarios
        const userIds = appealedUsers.map(u => u.id);

        const { data: pets, error: petsError } = await supabaseAdmin
            .from('pets')
            .select('*')
            .in('owner_id', userIds);

        if (petsError) {
            console.error('Error obteniendo mascotas:', petsError);
            return NextResponse.json({ error: petsError.message }, { status: 500 });
        }

        // Combinar datos de mascotas con datos de dueños
        const appealedPets = (pets || []).map(pet => {
            const owner = appealedUsers.find(u => u.id === pet.owner_id);
            return {
                petId: pet.id,
                petName: pet.name,
                petType: pet.type || 'Perro',
                petStatus: pet.status,
                petBreed: pet.breed,
                petPhotoUrl: pet.photo_url,
                petAdminNotes: pet.admin_notes,
                ownerId: owner?.memberstack_id,
                ownerName: `${owner?.first_name || ''} ${owner?.last_name || ''}`.trim() || 'Sin nombre',
                ownerEmail: owner?.email,
                appealMessage: owner?.last_appeal_message || pet.appeal_message || '',
                appealedAt: pet.appealed_at || pet.created_at,
                createdAt: pet.created_at
            };
        });

        console.log(`✅ Encontradas ${appealedPets.length} mascotas de usuarios en apelación`);

        return NextResponse.json({
            success: true,
            pets: appealedPets
        });

    } catch (error: any) {
        console.error('Error en /api/admin/pets/appealed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
