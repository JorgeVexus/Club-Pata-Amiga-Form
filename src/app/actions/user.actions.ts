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
 * Si se proporciona currentMemberId, permite "reclamar" el CURP si pertenece al mismo usuario.
 */
export async function checkCurpAvailability(curp: string, currentMemberId?: string) {
    const supabase = getServiceRoleClient()
    if (!supabase) return { available: true, error: 'configuration_missing' }

    try {
        const normalizedCurp = curp.trim().toUpperCase();

        // Buscar si existe el CURP
        const { data: existingUser, error } = await supabase
            .from('users')
            .select('id, memberstack_id, curp')
            .eq('curp', normalizedCurp)
            .maybeSingle()

        if (error) {
            console.error('Error al verificar CURP:', error)
            return { available: true, error: error.message }
        }

        // Si no existe, está disponible
        if (!existingUser) {
            return { available: true }
        }

        // Si existe pero pertenece al mismo usuario (mismo memberstack_id), está disponible
        if (currentMemberId && existingUser.memberstack_id === currentMemberId) {
            console.log('✅ CURP pertenece al usuario actual, permitiendo reutilización');
            return { available: true, isOwnData: true }
        }

        // Si existe y no es del usuario actual, no está disponible
        return { available: false }
    } catch (error) {
        console.error('Error inesperado al verificar CURP:', error)
        return { available: true, error: 'unknown_error' }
    }
}

/**
 * Verifica si un email ya está registrado en la base de datos de Supabase.
 */
export async function checkEmailAvailability(email: string) {
    const supabase = getServiceRoleClient()
    if (!supabase) return { available: true, error: 'configuration_missing' }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        // Buscar si existe el email
        const { data: existingUser, error } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', normalizedEmail)
            .maybeSingle()

        if (error) {
            console.error('Error al verificar Email:', error)
            // En caso de error, preferimos decir que está disponible para no bloquear
            return { available: true, error: error.message }
        }

        // Si no existe, está disponible
        return { available: !existingUser }
    } catch (error) {
        console.error('Error inesperado al verificar Email:', error)
        return { available: true, error: 'unknown_error' }
    }
}

/**
 * Registra o actualiza un usuario en la tabla 'public.users' de Supabase
 * Se usa después de crear el usuario en Memberstack
 * Usa UPSERT: si el usuario ya existe (por memberstack_id), actualiza sus datos
 */
export async function registerUserInSupabase(userData: any, memberstackId: string) {
    console.log('🔄 [Server Action] Intentando registrar/actualizar usuario en Supabase:', {
        memberstackId,
        email: userData.email,
        curp: userData.curp,
        step: userData.registration_step
    });

    const supabase = getServiceRoleClient()
    if (!supabase) {
        console.error('❌ [Server Action] Cliente Supabase no inicializado (Falta Key)');
        return { success: false, error: 'Configuración de servidor incompleta' }
    }

    try {
        // Mapeo seguro de campos para UPSERT
        const dataToSave = {
            memberstack_id: memberstackId,
            email: userData.email,
            // Perfil
            first_name: userData.first_name || userData.firstName,
            last_name: userData.last_name || userData.paternalLastName,
            mother_last_name: userData.mother_last_name || userData.maternalLastName,
            gender: userData.gender,
            birth_date: userData.birth_date || userData.birthDate,
            curp: (userData.curp || userData.CURP)?.trim() || null,
            phone: userData.phone,
            nationality: userData.nationality,
            nationality_code: userData.nationality_code || userData.nationalityCode,
            // Dirección
            postal_code: userData.postal_code || userData.postalCode,
            state: userData.state,
            city: userData.city,
            colony: userData.colony,
            address: userData.address,
            ine_front_url: userData.ine_front_url || userData.passportUrl,
            // Tracking
            registration_step: userData.registration_step,
            membership_status: userData.membership_status || 'pending',
            // Mascotas (campos temporales en users si se usan para tracking rápido)
            pet_name: userData.pet_name,
            pet_type: userData.pet_type,
            pet_age: userData.pet_age,
            pet_age_unit: userData.pet_age_unit,
        };

        const { data, error } = await supabase
            .from('users')
            .upsert(dataToSave, {
                onConflict: 'memberstack_id',
                ignoreDuplicates: false
            })
            .select()

        if (error) {
            console.error('❌ [Server Action] Error de Supabase:', error)
            return { success: false, error: error.message }
        }

        console.log('✅ [Server Action] Usuario registrado/actualizado en Supabase exitosamente');
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
            console.error(`❌ [Server Action] Usuario no encontrado en Supabase para MS_ID: ${memberstackId}. Error:`, userError);
            return { success: false, error: 'Usuario no encontrado' };
        }

        // 2. Preparar los datos de las mascotas
        const petsToInsert = pets.map(pet => ({
            owner_id: userData.id,
            name: pet.name || pet.petName,
            pet_type: (pet.petType || 'perro') === 'perro' ? 'dog' : 'cat',
            breed: pet.breed || (pet.isMixedBreed ? 'Mestizo' : ''),
            breed_size: pet.breedSize,
            gender: pet.gender || null,
            age_value: pet.age || pet.petAge,
            age_unit: pet.ageUnit || pet.petAgeUnit || 'years',

            // Colores (Catálogos)
            coat_color: pet.coatColor,
            nose_color: pet.noseColor,
            eye_color: pet.eyeColor,

            // Fotos y Certificados
            primary_photo_url: pet.primaryPhotoUrl || pet.photo1Url,
            photo_url: pet.photo1Url || pet.primaryPhotoUrl, // Duplicamos por compatibilidad con dashboard legacy
            photo2_url: pet.photo2Url,
            vet_certificate_url: pet.vetCertificateUrl,

            // Mestizos / Adoptados
            is_mixed_breed: pet.isMixedBreed || false,
            is_adopted: pet.isAdopted || false,
            adoption_story: pet.adoptionStory || null,

            // Senior logic
            is_senior: pet.is_senior || false,
            vet_certificate_required: pet.vet_certificate_required || false,

            // Tracking
            status: pet.status || 'pending',
            basic_info_completed: true,
            complementary_info_completed: pet.isComplete || false,
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

/**
 * Actualiza el código de embajador de un usuario
 * Se usa en el paso 2 de registro de mascotas
 */
export async function updateUserAmbassadorCode(memberstackId: string, ambassadorCode: string) {
    console.log('🔄 [Server Action] Actualizando código de embajador:', { memberstackId, ambassadorCode });

    const supabase = getServiceRoleClient();
    if (!supabase) return { success: false, error: 'Configuración fallida' };

    try {
        const { error } = await supabase
            .from('users')
            .update({ ambassador_code: ambassadorCode })
            .eq('memberstack_id', memberstackId);

        if (error) {
            console.error('❌ [Server Action] Error actualizando código de embajador:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ [Server Action] Código de embajador actualizado');
        return { success: true };
    } catch (error: any) {
        console.error('❌ [Server Action] Error inesperado:', error);
        return { success: false, error: error.message };
    }
}
