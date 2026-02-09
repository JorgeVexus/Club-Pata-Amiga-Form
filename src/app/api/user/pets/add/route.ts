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

        // 3. Determinar el slot de la mascota de forma robusta
        // Escaneamos qué slots están ocupados y cuál es el primero disponible
        let occupiedSlots: number[] = [];
        for (let i = 1; i <= 3; i++) {
            if (customFields[`pet-${i}-name`]) {
                occupiedSlots.push(i);
            }
        }

        console.log(`📊 [PET_ADD] Slots ocupados: [${occupiedSlots.join(', ')}]. Total: ${occupiedSlots.length}`);

        if (occupiedSlots.length >= 3) {
            console.warn(`⚠️ [PET_ADD] El usuario ya tiene 3 mascotas ocupadas.`);
            return NextResponse.json({ error: 'Ya has alcanzado el límite de 3 mascotas' }, { status: 400, headers: corsHeaders });
        }

        // El siguiente slot es el primero que esté libre
        let nextSlot = 1;
        for (let i = 1; i <= 3; i++) {
            if (!occupiedSlots.includes(i)) {
                nextSlot = i;
                break;
            }
        }

        const prefix = `pet-${nextSlot}`;
        console.log(`📍 [PET_ADD] Usando slot disponible: ${nextSlot}`);

        // 4. Calcular período de carencia
        const carencia = calculateWaitingPeriod(
            true,
            petData.isAdopted || false,
            !!petData.ruac,
            petData.isMixed || false
        );

        // 5. Preparar campos para Memberstack
        // NOTA: Con la nueva arquitectura, SOLO actualizamos el conteo de mascotas en Memberstack.
        // El resto de la data vive felizmente en Supabase.
        const newFields: Record<string, any> = {
            'total-pets': (occupiedSlots.length + 1).toString(),
            // 'approval-status': 'pending' // No es necesario sobreescribir status aquí, eso es del usuario
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

        // 7. Registrar mascota en Supabase (Tabla pets)
        // Solo usamos las columnas que existen físicamente en la tabla para evitar errores de PostgREST
        const { error: insertError } = await supabaseAdmin.from('pets').insert({
            owner_id: user!.id,
            name: petData.name,
            breed: petData.breed || (petData.isMixed ? 'Mestizo' : ''),
            breed_size: petData.breedSize,
            photo_url: petData.photo1Url,
            photo2_url: petData.photo2Url || null,
            status: 'pending',
            created_at: new Date().toISOString()
        });

        if (insertError) {
            console.error('❌ [PET_ADD] Error insertando mascota en Supabase:', insertError);
            throw new Error('Error al guardar la mascota en la base de datos (Supabase)');
        }

        // 8. Guardar la historia de adopción en la tabla de usuarios (Slot correspondiente)
        if (petData.adoptionStory) {
            const storyColumn = `pet_${nextSlot}_adoption_story`;
            const { error: userUpdateError } = await supabaseAdmin
                .from('users')
                .update({ [storyColumn]: petData.adoptionStory })
                .eq('id', user!.id);

            if (userUpdateError) {
                console.warn('⚠️ [PET_ADD] No se pudo guardar la historia en el perfil del usuario:', userUpdateError);
            } else {
                console.log(`✅ [PET_ADD] Historia guardada en ${storyColumn}`);
            }
        }

        console.log(`✅ [PET_ADD] Registro completado con éxito para ${msEmail}`);
        return NextResponse.json({ success: true, slot: nextSlot }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('❌ [PET_ADD] Fallo crítico:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
