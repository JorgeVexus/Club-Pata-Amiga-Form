/**
 * API Route: /api/admin/pets/appealed
 * Obtiene todas las mascotas que tienen apelaciones activas
 * Incluye datos del dueño para mostrar en la tabla
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    try {
        console.log('📋 Obteniendo mascotas apeladas...');

        // 1. Obtener usuarios con estado 'appealed' desde su tabla users
        const { data: appealedUsers, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id, memberstack_id, first_name, last_name, email, membership_status')
            .eq('membership_status', 'appealed');

        if (usersError) {
            console.error('Error obteniendo usuarios apelados:', usersError);
            return NextResponse.json({ error: usersError.message }, { status: 500 });
        }

        if (!appealedUsers || appealedUsers.length === 0) {
            return NextResponse.json({ success: true, pets: [] });
        }

        // 2. Para cada usuario apelado, obtener sus mascotas
        const appealedPetsWithOwner = [];

        for (const user of appealedUsers) {
            // Obtener mascotas de este usuario
            const { data: pets, error: petsError } = await supabaseAdmin
                .from('pets')
                .select('*')
                .eq('owner_id', user.id);

            if (petsError) {
                console.warn(`Error obteniendo mascotas de ${user.memberstack_id}:`, petsError);
                continue;
            }

            // Obtener el mensaje de apelación desde Memberstack
            let appealMessage = '';
            let appealedAt = '';
            try {
                const memberData = await memberstackAdmin.getMember(user.memberstack_id);
                appealMessage = memberData.data?.customFields?.['appeal-message'] || '';
                appealedAt = memberData.data?.customFields?.['appealed-at'] || '';
            } catch (e) {
                console.warn(`No se pudo obtener datos de MS para ${user.memberstack_id}`);
            }

            // Añadir cada mascota con datos del dueño
            for (const pet of pets || []) {
                appealedPetsWithOwner.push({
                    petId: pet.id,
                    petName: pet.name,
                    petType: pet.type || 'Perro',
                    petStatus: pet.status,
                    petBreed: pet.breed,
                    petPhotoUrl: pet.photo_url,
                    petAdminNotes: pet.admin_notes,
                    ownerId: user.memberstack_id,
                    ownerName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Sin nombre',
                    ownerEmail: user.email,
                    appealMessage: appealMessage,
                    appealedAt: appealedAt,
                    createdAt: pet.created_at
                });
            }
        }

        console.log(`✅ Encontradas ${appealedPetsWithOwner.length} mascotas en apelación`);

        return NextResponse.json({
            success: true,
            pets: appealedPetsWithOwner
        });

    } catch (error: any) {
        console.error('Error en /api/admin/pets/appealed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
