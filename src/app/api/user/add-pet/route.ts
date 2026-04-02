/**
 * API Route: POST /api/user/add-pet
 * Permite agregar una nueva mascota desde el widget de Webflow.
 * Valida max 3 mascotas activas, calcula carencia con reducción.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const MAX_PETS = 3;

// Headers CORS para Webflow
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Calcula el período de carencia con reducción:
 * - Adoptada o RUAC → 90 días
 * - Mestiza → 120 días
 * - Estándar → 180 días
 */
function calculateWaitingPeriodDays(isAdopted: boolean, hasRuac: boolean, isMixed: boolean): number {
    if (isAdopted || hasRuac) return 90;
    if (isMixed) return 120;
    return 180;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            memberstackId,
            name,
            petType,
            ageValue,
            ageUnit,
            gender,
            breed,
            breedSize,
            isMixed,
            coatColor,
            noseColor,
            eyeColor,
            isAdopted,
            adoptionStory,
            primaryPhotoUrl,
            ruac,
            isSenior,
            vetCertificateUrl,
        } = body;

        // 1. Validar campos requeridos
        if (!memberstackId || !name || !petType) {
            return NextResponse.json(
                { success: false, error: 'Faltan campos requeridos: memberstackId, name, petType' },
                { status: 400, headers: corsHeaders }
            );
        }

        // 2. Obtener el ID interno del usuario
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('memberstack_id', memberstackId)
            .single();

        if (userError || !userData) {
            console.error('❌ [add-pet] Usuario no encontrado:', userError);
            return NextResponse.json(
                { success: false, error: 'Usuario no encontrado' },
                { status: 404, headers: corsHeaders }
            );
        }

        // 3. Contar mascotas activas
        const { count, error: countError } = await supabaseAdmin
            .from('pets')
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', userData.id);

        if (countError) {
            console.error('❌ [add-pet] Error contando mascotas:', countError);
            return NextResponse.json(
                { success: false, error: 'Error verificando mascotas existentes' },
                { status: 500, headers: corsHeaders }
            );
        }

        if ((count ?? 0) >= MAX_PETS) {
            return NextResponse.json(
                { success: false, error: `Ya tienes el máximo de ${MAX_PETS} mascotas registradas` },
                { status: 400, headers: corsHeaders }
            );
        }

        // 4. Calcular período de carencia con reducciones
        const waitingDays = calculateWaitingPeriodDays(
            isAdopted || false,
            !!(ruac && ruac.trim()),
            isMixed || false
        );

        const waitingPeriodEnd = new Date();
        waitingPeriodEnd.setDate(waitingPeriodEnd.getDate() + waitingDays);

        // 5. Preparar datos de la mascota
        const petData = {
            owner_id: userData.id,
            name: name.trim(),
            pet_type: petType === 'perro' ? 'dog' : 'cat',
            breed: breed || (isMixed ? 'Mestizo' : ''),
            breed_size: breedSize || null,
            gender: gender || null,
            age_value: ageValue || null,
            age_unit: ageUnit || 'years',
            coat_color: coatColor || null,
            nose_color: noseColor || null,
            eye_color: eyeColor || null,
            is_mixed_breed: isMixed || false,
            is_adopted: isAdopted || false,
            adoption_story: adoptionStory || null,
            primary_photo_url: primaryPhotoUrl || null,
            photo_url: primaryPhotoUrl || null,
            vet_certificate_url: vetCertificateUrl || null,
            is_senior: isSenior || false,
            vet_certificate_required: isSenior || false,
            ruac: ruac || null,
            status: 'pending',
            basic_info_completed: true,
            complementary_info_completed: true,
            waiting_period_days: waitingDays,
            waiting_period_end: waitingPeriodEnd.toISOString(),
            created_at: new Date().toISOString(),
        };

        console.log('🐾 [add-pet] Insertando mascota:', { name, petType, waitingDays });

        // 6. Insertar en Supabase
        const { data: insertedPet, error: insertError } = await supabaseAdmin
            .from('pets')
            .insert(petData)
            .select()
            .single();

        if (insertError) {
            console.error('❌ [add-pet] Error insertando mascota:', insertError);
            return NextResponse.json(
                { success: false, error: insertError.message },
                { status: 500, headers: corsHeaders }
            );
        }

        console.log('✅ [add-pet] Mascota agregada:', insertedPet.id);

        return NextResponse.json(
            { success: true, pet: insertedPet },
            { headers: corsHeaders }
        );

    } catch (error: any) {
        console.error('❌ [add-pet] Error inesperado:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500, headers: corsHeaders }
        );
    }
}
