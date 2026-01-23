/**
 * API Route: /api/admin/pets/appealed
 * Obtiene SOLO las mascotas que tienen status 'appealed'
 * CORREGIDO: Apelaciones a nivel mascota, no a nivel miembro
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
        console.log('📋 Obteniendo mascotas con status APPEALED...');

        // Buscar SOLO mascotas con status = 'appealed'
        const { data: pets, error } = await supabaseAdmin
            .from('pets')
            .select(`
                id,
                name,
                type,
                status,
                breed,
                breed_size,
                photo_url,
                admin_notes,
                appeal_message,
                appeal_count,
                appealed_at,
                last_admin_response,
                created_at,
                owner:users!owner_id (
                    id,
                    memberstack_id,
                    first_name,
                    last_name,
                    email
                )
            `)
            .eq('status', 'appealed')
            .order('appealed_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo mascotas apeladas:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Formatear respuesta
        const appealedPets = (pets || []).map(pet => {
            const owner = Array.isArray(pet.owner) ? pet.owner[0] : pet.owner;
            return {
                petId: pet.id,
                petName: pet.name,
                petType: pet.type || 'Perro',
                petStatus: pet.status,
                petBreed: pet.breed,
                petBreedSize: pet.breed_size,
                petPhotoUrl: pet.photo_url,
                petAdminNotes: pet.admin_notes,
                appealMessage: pet.appeal_message || '',
                appealCount: pet.appeal_count || 1,
                lastAdminResponse: pet.last_admin_response,
                appealedAt: pet.appealed_at,
                ownerId: owner?.memberstack_id,
                ownerName: `${owner?.first_name || ''} ${owner?.last_name || ''}`.trim() || 'Sin nombre',
                ownerEmail: owner?.email,
                createdAt: pet.created_at
            };
        });

        console.log(`✅ Encontradas ${appealedPets.length} mascotas con status APPEALED`);

        return NextResponse.json({
            success: true,
            pets: appealedPets,
            count: appealedPets.length
        });

    } catch (error: any) {
        console.error('Error en /api/admin/pets/appealed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
