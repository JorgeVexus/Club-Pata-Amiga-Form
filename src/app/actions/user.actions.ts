'use server'

import { createClient } from '@supabase/supabase-js'

// Inicializar cliente seguro para operaciones de administración
const getServiceRoleClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('⚠️ Falta configuración de Supabase Service Role Key')
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
    const supabase = getServiceRoleClient()
    if (!supabase) return { success: false, error: 'Configuración de servidor incompleta' }

    try {
        const { error } = await supabase
            .from('users')
            .insert({
                memberstack_id: memberstackId,
                first_name: userData.firstName,
                last_name: userData.paternalLastName,
                mother_last_name: userData.maternalLastName,
                gender: userData.gender,
                birth_date: userData.birthDate,
                curp: userData.curp,
                email: userData.email,
                phone: userData.phone,
                postal_code: userData.postalCode,
                state: userData.state,
                city: userData.city,
                colony: userData.colony,
                address: userData.address,
                membership_status: 'pending',
                created_at: new Date().toISOString(),
            })

        if (error) {
            console.error('Error al guardar en Supabase:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error: any) {
        console.error('Error inesperado al guardar usuario:', error)
        return { success: false, error: error.message }
    }
}
