/**
 * API Route: /api/admin/pets/appealed
 * Obtiene todas las mascotas que tienen apelaciones activas
 * OPTIMIZADO: Un solo query sin loops ni llamadas a Memberstack
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
        console.log('📋 Obteniendo mascotas apeladas (optimizado)...');

        // Query optimizado: obtener mascotas con status rejected/action_required
        // cuyos dueños tengan membership_status = 'appealed'
        // En un solo query con JOIN implícito
        const { data: pets, error } = await supabaseAdmin
            .from('pets')
            .select(`
                id,
                name,
                type,
                status,
                breed,
                photo_url,
                admin_notes,
                appeal_message,
                last_admin_response,
                appealed_at,
                created_at,
                owner:users!owner_id (
                    id,
                    memberstack_id,
                    first_name,
                    last_name,
                    email,
                    membership_status
                )
            `)
            .in('status', ['rejected', 'action_required']);

        if (error) {
            console.error('Error obteniendo mascotas apeladas:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Filtrar solo los que tienen dueños con estado 'appealed'
        const appealedPets = (pets || [])
            .filter(pet => pet.owner?.membership_status === 'appealed')
            .map(pet => ({
                petId: pet.id,
                petName: pet.name,
                petType: pet.type || 'Perro',
                petStatus: pet.status,
                petBreed: pet.breed,
                petPhotoUrl: pet.photo_url,
                petAdminNotes: pet.admin_notes,
                ownerId: pet.owner?.memberstack_id,
                ownerName: `${pet.owner?.first_name || ''} ${pet.owner?.last_name || ''}`.trim() || 'Sin nombre',
                ownerEmail: pet.owner?.email,
                appealMessage: pet.appeal_message || '', // Del campo de la mascota
                appealedAt: pet.appealed_at || pet.created_at,
                createdAt: pet.created_at
            }));

        console.log(`✅ Encontradas ${appealedPets.length} mascotas en apelación`);

        return NextResponse.json({
            success: true,
            pets: appealedPets
        });

    } catch (error: any) {
        console.error('Error en /api/admin/pets/appealed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
