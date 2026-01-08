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
export async function registerUserInSupabase(userData: any, memberstackId: string) {
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
                is_foreigner: userData.isForeigner || false,
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
            birth_date: null, // Podríamos calcular la fecha aproximada basándonos en la edad
            photo_url: pet.photoUrls?.[0] || null, // Guardamos la primera foto como principal
            vet_certificate_url: pet.vetCertificateUrl || null,
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
        // 1. Obtener el ID interno del usuario
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('memberstack_id', memberstackId)
            .single();

        if (userError || !userData) return { success: false, error: 'Usuario no encontrado' };

        // 2. Obtener las mascotas
        const { data: pets, error: petsError } = await supabase
            .from('pets')
            .select('*')
            .eq('owner_id', userData.id)
            .order('created_at', { ascending: true });

        if (petsError) return { success: false, error: petsError.message };

        return { success: true, pets };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
