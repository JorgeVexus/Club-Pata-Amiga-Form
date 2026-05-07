/**
 * API Endpoint: POST /api/user/update-profile
 *
 * Actualiza los datos personales del usuario en Supabase.
 * NO modifica Memberstack (el email es el identificador y no cambia).
 * NO modifica el plan ni el estado de la membresía.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            memberstackId,
            first_name,
            last_name,
            mother_last_name,
            phone,
            address,
            colony,
            city,
            state,
            postal_code,
            birth_date,
            avatar_url,
        } = body;

        if (!memberstackId) {
            return NextResponse.json(
                { success: false, error: 'memberstackId es requerido' },
                { status: 400 }
            );
        }

        console.log(`[UPDATE-PROFILE] Actualizando perfil para: ${memberstackId}`);

        // Construir solo los campos que vienen en el body (no sobreescribir con undefined)
        const updatePayload: Record<string, unknown> = {};

        if (first_name !== undefined) updatePayload.first_name = first_name.trim();
        if (last_name !== undefined) updatePayload.last_name = last_name.trim();
        if (mother_last_name !== undefined) updatePayload.mother_last_name = mother_last_name.trim();
        if (phone !== undefined) updatePayload.phone = phone.trim();
        if (address !== undefined) updatePayload.address = address.trim();
        if (colony !== undefined) updatePayload.colony = colony.trim();
        if (city !== undefined) updatePayload.city = city.trim();
        if (state !== undefined) updatePayload.state = state.trim();
        if (postal_code !== undefined) updatePayload.postal_code = postal_code.trim();
        if (birth_date !== undefined) updatePayload.birth_date = birth_date;
        if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url;

        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updatePayload)
            .eq('memberstack_id', memberstackId)
            .select('id, first_name, last_name, mother_last_name, phone, address, colony, city, state, postal_code, birth_date, avatar_url')
            .single();

        if (error) {
            console.error('[UPDATE-PROFILE] Error actualizando Supabase:', error);
            return NextResponse.json(
                { success: false, error: 'Error actualizando el perfil', details: error.message },
                { status: 500 }
            );
        }

        console.log(`[UPDATE-PROFILE] Perfil actualizado exitosamente para ${memberstackId}`);

        return NextResponse.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            user: data,
        });

    } catch (error: any) {
        console.error('[UPDATE-PROFILE] Error inesperado:', error);
        return NextResponse.json(
            { success: false, error: 'Error procesando la solicitud', details: error.message },
            { status: 500 }
        );
    }
}
