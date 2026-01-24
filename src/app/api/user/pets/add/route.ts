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

        console.log(`🐾 [PET_ADD] Procesando registro para MemberstackID: ${memberstackId}`);

        if (!memberstackId || !petData) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400, headers: corsHeaders });
        }

        if (!MEMBERSTACK_ADMIN_KEY) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
        }

        // 1. Obtener datos actuales del miembro desde Memberstack
        const msResponse = await fetch(`https://admin.memberstack.com/members/${memberstackId}`, {
            headers: { 'X-API-KEY': MEMBERSTACK_ADMIN_KEY }
        });
        const msData = await msResponse.json();

        if (!msResponse.ok) {
            console.error(`❌ [PET_ADD] Error al obtener miembro de Memberstack:`, msData);
            throw new Error('No se pudo validar el usuario con Memberstack');
        }

        const member = msData.data;
        const msEmail = member.auth?.email;
        const customFields = member.customFields || {};
        const firstName = customFields['first-name'] || '';
        const lastName = customFields['paternal-last-name'] || '';

        console.log(`👤 [PET_ADD] Miembro identificado: ${msEmail} (${firstName} ${lastName})`);

        // 2. Sincronizar con Supabase (Buscar o Crear usuario)
        let { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, email, memberstack_id')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        if (!user) {
            console.log(`🆕 [PET_ADD] Usuario no encontrado en Supabase. Creando registro para ${msEmail}...`);
            const { data: newUser, error: createError } = await supabaseAdmin
                .from('users')
                .insert({
                    memberstack_id: memberstackId,
                    email: msEmail,
                    first_name: firstName,
                    last_name: lastName,
                    membership_status: 'pending',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) {
                console.error('❌ [PET_ADD] Error creando usuario en Supabase:', createError);
                throw new Error('No se pudo crear el perfil de usuario en la base de datos');
            }
            user = newUser;
        } else {
            console.log(`✅ [PET_ADD] Usuario encontrado en Supabase: ID ${user.id} (Email original: ${user.email})`);
            // Opcional: Actualizar el email si ha cambiado en Memberstack
            if (user.email !== msEmail) {
                console.log(`🔄 [PET_ADD] Actualizando email de ${user.email} a ${msEmail}`);
                await supabaseAdmin.from('users').update({ email: msEmail }).eq('id', user.id);
            }
        }

        // 3. Determinar el slot de la mascota
        let totalPets = parseInt(customFields['total-pets'] || '0');
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

        // 4. Calcular período de carencia
        const carencia = calculateWaitingPeriod(
            true,
            petData.isAdopted || false,
            !!petData.ruac,
            petData.isMixed || false
        );

        // 5. Preparar campos para Memberstack
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
            [`${prefix}-is-original`]: 'true',
            'approval-status': 'pending' // Asegurar que el status sea pendiente para que aparezca en el admin
        };

        // 6. Actualizar Memberstack
        const updateMsResponse = await fetch(`https://admin.memberstack.com/members/${memberstackId}`, {
            method: 'PATCH',
            headers: {
                'X-API-KEY': MEMBERSTACK_ADMIN_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ customFields: newFields })
        });

        if (!updateMsResponse.ok) {
            const errData = await updateMsResponse.json();
            console.error('❌ [PET_ADD] Error al actualizar Memberstack:', errData);
            throw new Error('Error al actualizar los datos en Memberstack');
        }

        // 7. Registrar mascota en Supabase
        const { error: insertError } = await supabaseAdmin.from('pets').insert({
            owner_id: user!.id,
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
            console.error('❌ [PET_ADD] Error insertando mascota en Supabase:', insertError);
            throw new Error('Error al guardar la mascota en la base de datos');
        }

        console.log(`✅ [PET_ADD] Registro completado con éxito para ${msEmail}`);
        return NextResponse.json({ success: true, slot: nextSlot }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('❌ [PET_ADD] Fallo crítico:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
