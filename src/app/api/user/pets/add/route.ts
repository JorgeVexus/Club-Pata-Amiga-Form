import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateWaitingPeriod } from '@/services/pet.service';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const MEMBERSTACK_ADMIN_KEY = process.env.MEMBERSTACK_ADMIN_SECRET_KEY;

// Headers CORS para permitir requests desde Webflow
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handler para preflight requests
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberstackId, petData } = body;

        console.log(`🐾 Intentando registrar nueva mascota para: ${memberstackId}`);

        if (!memberstackId || !petData) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400, headers: corsHeaders });
        }

        if (!MEMBERSTACK_ADMIN_KEY) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
        }

        // 1. Obtener datos actuales del miembro para saber en qué slot poner la nueva mascota
        const msResponse = await fetch(`https://admin.memberstack.com/members/${memberstackId}`, {
            headers: { 'X-API-KEY': MEMBERSTACK_ADMIN_KEY }
        });
        const msData = await msResponse.json();

        if (!msResponse.ok) throw new Error('Error fetching member from Memberstack');

        const customFields = msData.data.customFields || {};
        let totalPets = parseInt(customFields['total-pets'] || '0');

        // Si no hay total-pets, calcular manualmente revisando slots
        if (totalPets === 0) {
            for (let i = 1; i <= 3; i++) {
                if (customFields[`pet-${i}-name`]) totalPets = i;
            }
        }

        if (totalPets >= 3) {
            return NextResponse.json({ error: 'Ya has alcanzado el límite de 3 mascotas' }, { status: 400, headers: corsHeaders });
        }

        const nextSlot = totalPets + 1;
        const prefix = `pet-${nextSlot}`;

        // 2. Calcular período de carencia
        const carencia = calculateWaitingPeriod(
            true, // Siempre es nueva para este flujo
            petData.isAdopted || false,
            !!petData.ruac,
            petData.isMixed || false // Nuevo parámetro añadido
        );

        // 3. Preparar campos para Memberstack
        const newFields: Record<string, any> = {
            'total-pets': nextSlot.toString(),
            [`${prefix}-name`]: petData.name,
            [`${prefix}-last-name`]: petData.lastName || '',
            [`${prefix}-type`]: petData.petType,
            [`${prefix}-breed`]: petData.breed || 'Mestizo',
            [`${prefix}-breed-size`]: petData.breedSize,
            [`${prefix}-age`]: petData.age,
            [`${prefix}-is-mixed`]: petData.isMixed ? 'true' : 'false',
            [`${prefix}-is-adopted`]: petData.isAdopted ? 'true' : 'false',
            [`${prefix}-adoption-story`]: petData.adoptionStory || '',
            [`${prefix}-ruac`]: petData.ruac || '',
            [`${prefix}-photo-1-url`]: petData.photo1Url || '',
            [`${prefix}-photo-2-url`]: petData.photo2Url || '',
            [`${prefix}-vet-certificate-url`]: petData.vetCertificateUrl || '',
            [`${prefix}-waiting-period-days`]: carencia.days.toString(),
            [`${prefix}-waiting-period-end`]: carencia.endDate,
            [`${prefix}-registration-date`]: new Date().toISOString(),
            [`${prefix}-is-active`]: 'true',
            [`${prefix}-is-original`]: 'true'
        };

        // 4. Actualizar Memberstack
        const updateMsResponse = await fetch(`https://admin.memberstack.com/members/${memberstackId}`, {
            method: 'PATCH',
            headers: {
                'X-API-KEY': MEMBERSTACK_ADMIN_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ customFields: newFields })
        });

        if (!updateMsResponse.ok) throw new Error('Error updating Memberstack');

        // 5. Registrar en Supabase (Tabla pets)
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('memberstack_id', memberstackId)
            .single();

        if (user) {
            const { error: insertError } = await supabaseAdmin.from('pets').insert({
                owner_id: user.id,
                name: petData.name,
                breed: petData.breed || 'Mestizo',
                breed_size: petData.breedSize,
                age: petData.age || null,
                is_mixed: petData.isMixed || false,
                is_adopted: petData.isAdopted || false,
                adoption_story: petData.adoptionStory || null,
                ruac: petData.ruac || null,
                photo_url: petData.photo1Url,
                photo2_url: petData.photo2Url || null,
                status: 'pending',
                created_at: new Date().toISOString()
            });

            if (insertError) {
                console.error('❌ Error insertando en Supabase:', insertError);
            } else {
                console.log('✅ Mascota registrada en Supabase');
            }
        }

        return NextResponse.json({ success: true, slot: nextSlot }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('❌ Error adding pet:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
