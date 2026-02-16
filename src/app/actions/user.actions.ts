'use server'

import { createClient } from '@supabase/supabase-js'

// Inicializar cliente seguro para operaciones de administración
const getServiceRoleClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Debug log para confirmar carga de variables
    console.log('🔧 [Server Action] Supabase Auth Init:', {
        url: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        keyLength: supabaseServiceKey?.length || 0
    });

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ CRITICAL: Falta configuración de Supabase Service Role Key o URL')
        return null
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

/**
 * Verifica si un CURP ya está registrado en la base de datos.
 */
export async function checkCurpAvailability(curp: string) {
    const supabase = getServiceRoleClient()
    if (!supabase) return { available: true, error: 'configuration_missing' }

    try {
        const { count, error } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('curp', curp)

        if (error) {
            console.error('Error al verificar CURP:', error)
            return { available: true, error: error.message }
        }

        return { available: count === 0 }
    } catch (error) {
        console.error('Error inesperado al verificar CURP:', error)
        // En caso de error, preferimos no bloquear el registro
        return { available: true, error: 'unknown_error' }
    }
}

/**
 * Registra un usuario en la tabla 'public.users' de Supabase
 * Se usa después de crear el usuario en Memberstack
 */
export async function registerUserInSupabase(userData: any, memberstackId: string, documentUrls?: { ineFront?: string, ineBack?: string }) {
    console.log('🔄 [Server Action] Intentando registrar usuario en Supabase:', {
        memberstackId,
        email: userData.email,
        curp: userData.curp
    });

    const supabase = getServiceRoleClient()
    if (!supabase) {
        console.error('❌ [Server Action] Cliente Supabase no inicializado (Falta Key)');
        return { success: false, error: 'Configuración de servidor incompleta' }
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .insert({
                memberstack_id: memberstackId,
                first_name: userData.firstName,
                last_name: userData.paternalLastName,
                mother_last_name: userData.maternalLastName,
                gender: userData.gender,
                birth_date: userData.birthDate,
                curp: userData.curp?.trim() || null,
                email: userData.email,
                phone: userData.phone,
                postal_code: userData.postalCode,
                state: userData.state,
                city: userData.city,
                colony: userData.colony,
                address: userData.address,
                membership_status: 'pending',
                approval_status: 'pending',
                is_foreigner: userData.isForeigner || false,
                ine_front_url: documentUrls?.ineFront || null,
                ine_back_url: documentUrls?.ineBack || null,
                created_at: new Date().toISOString(),
            })
            .select() // Seleccionar para confirmar inserción

        if (error) {
            console.error('❌ [Server Action] Error de Supabase:', error)
            return { success: false, error: error.message }
        }

        console.log('✅ [Server Action] Usuario registrado en Supabase exitosamente:', data)
        return { success: true }
    } catch (error: any) {
        console.error('❌ [Server Action] Error inesperado:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Actualiza el crm_contact_id de un usuario
 * Se usa después de sincronizar con Lynsales CRM
 */
export async function updateUserCrmContactId(memberstackId: string, crmContactId: string) {
    console.log('🔄 [Server Action] Guardando CRM Contact ID:', { memberstackId, crmContactId });

    const supabase = getServiceRoleClient()
    if (!supabase) return { success: false, error: 'Configuración de servidor incompleta' }

    try {
        const { error } = await supabase
            .from('users')
            .update({ crm_contact_id: crmContactId })
            .eq('memberstack_id', memberstackId);

        if (error) {
            console.error('❌ [Server Action] Error guardando CRM ID:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ [Server Action] CRM Contact ID guardado');
        return { success: true };
    } catch (error: any) {
        console.error('❌ [Server Action] Error inesperado:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sincroniza las historias de adopción de las mascotas en Supabase
 * Se guarda en la tabla 'users' en las columnas correspondientes
 */
export async function syncPetStoriesToSupabase(memberstackId: string, stories: { pet1?: string; pet2?: string; pet3?: string }) {
    console.log('🔄 [Server Action] Sincronizando historias de adopción:', { memberstackId, hasStories: Object.keys(stories).length });

    const supabase = getServiceRoleClient()
    if (!supabase) return { success: false, error: 'Configuración de servidor incompleta' }

    try {
        const { error } = await supabase
            .from('users')
            .update({
                pet_1_adoption_story: stories.pet1 || null,
                pet_2_adoption_story: stories.pet2 || null,
                pet_3_adoption_story: stories.pet3 || null,
            })
            .eq('memberstack_id', memberstackId);

        if (error) {
            console.error('❌ [Server Action] Error actualizando historias:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('❌ [Server Action] Error inesperado en syncPetStories:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Registra las mascotas en la tabla 'public.pets' de Supabase
 */
export async function registerPetsInSupabase(memberstackId: string, pets: any[]) {
    console.log('🔄 [Server Action] Registrando mascotas en Supabase:', { memberstackId, count: pets.length });

    const supabase = getServiceRoleClient()
    if (!supabase) return { success: false, error: 'Configuración de servidor incompleta' }

    try {
        // 1. Obtener el ID interno del usuario en Supabase (UUID)
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('memberstack_id', memberstackId)
            .single();

        if (userError || !userData) {
            console.error('❌ [Server Action] Usuario no encontrado en Supabase:', userError);
            return { success: false, error: 'Usuario no encontrado' };
        }

        // 2. Preparar los datos de las mascotas
        const petsToInsert = pets.map(pet => ({
            owner_id: userData.id,
            name: pet.name,
            breed: pet.breed || (pet.isMixed ? 'Mestizo' : ''),
            breed_size: pet.breedSize,
            age: pet.age || null, // Guardar edad (texto o número)
            birth_date: null, // Podríamos calcular la fecha aproximada basándonos en la edad
            // Prioritize specific fields, fallback to array
            photo_url: pet.photo1Url || pet.photoUrls?.[0] || null,
            photo2_url: pet.photo2Url || pet.photoUrls?.[1] || null,
            vet_certificate_url: pet.vetCertificateUrl || null,
            // Waiting period
            waiting_period_start: pet.waitingPeriodStart || new Date().toISOString(),
            waiting_period_end: pet.waitingPeriodEnd || null,
            status: 'pending',
            created_at: new Date().toISOString()
        }));

        // 3. Insertar mascotas
        const { error: insertError } = await supabase
            .from('pets')
            .insert(petsToInsert);

        if (insertError) {
            console.error('❌ [Server Action] Error insertando mascotas:', insertError);
            return { success: false, error: insertError.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('❌ [Server Action] Error inesperado en registerPets:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Obtiene las mascotas de un usuario desde Supabase
 */
export async function getPetsByUserId(memberstackId: string) {
    const supabase = getServiceRoleClient();
    if (!supabase) return { success: false, error: 'Configuración fallida' };

    try {
        // 1. Obtener el ID interno del usuario y campos de comunicación (con tolerancia a errores)
        let userData: any = null;
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, last_admin_response, action_required_fields, membership_status')
                .eq('memberstack_id', memberstackId)
                .single();

            if (error) {
                console.warn('⚠️ [Server Action] Could not fetch user communication fields:', error.message);
                // Intento fallback solo con ID si falló (por si faltan columnas)
                const { data: fallbackData } = await supabase
                    .from('users')
                    .select('id')
                    .eq('memberstack_id', memberstackId)
                    .single();
                userData = fallbackData;
            } else {
                userData = data;
            }
        } catch (e) {
            console.error('❌ [Server Action] Error fetching user:', e);
        }

        if (!userData) return { success: false, error: 'Usuario no encontrado en Supabase' };

        // 2. Obtener las mascotas
        const { data: pets, error: petsError } = await supabase
            .from('pets')
            .select('*')
            .eq('owner_id', userData.id)
            .order('created_at', { ascending: true });

        if (petsError) return { success: false, error: petsError.message };

        // 3. Si no tenemos last_admin_response del usuario, buscar el último en appeal_logs
        let lastAdminMsg = userData.last_admin_response || null;
        if (!lastAdminMsg) {
            try {
                const { data: lastLog } = await supabase
                    .from('appeal_logs')
                    .select('message')
                    .eq('user_id', memberstackId)
                    .eq('type', 'admin_request')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (lastLog) {
                    lastAdminMsg = lastLog.message;
                }
            } catch (e) {
                // No hay logs, está bien
            }
        }

        return {
            success: true,
            pets,
            last_admin_response: lastAdminMsg,
            action_required_fields: userData.action_required_fields,
            membership_status: userData.membership_status || 'pending'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene los detalles de facturación de un usuario
 */
export async function getBillingDetailsByUserId(userId: string) {
    const supabase = getServiceRoleClient();
    if (!supabase) return { success: false, error: 'Configuración fallida' };

    try {
        const { data, error } = await supabase
            .from('billing_details')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('❌ [Server Action] Error fetching billing details:', error);
            return { success: false, error: error.message };
        }

        return { success: true, billingDetails: data };
    } catch (error: any) {
        console.error('❌ [Server Action] Error inesperado en getBillingDetails:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Obtiene los datos de un usuario por su Memberstack ID desde Supabase
 */
export async function getUserDataByMemberstackId(memberstackId: string) {
    const supabase = getServiceRoleClient();
    if (!supabase) return { success: false, error: 'Configuración fallida' };

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('memberstack_id', memberstackId)
            .single();

        if (error) {
            console.error('❌ [Server Action] Error fetching user data by MS ID:', error);
            return { success: false, error: error.message };
        }

        return { success: true, userData: data };
    } catch (error: any) {
        console.error('❌ [Server Action] Error inesperado en getUserDataByMSID:', error);
        return { success: false, error: error.message };
    }
}
