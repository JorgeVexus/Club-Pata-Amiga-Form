'use server'

import { createClient } from '@supabase/supabase-js'

const getServiceRoleClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
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
 * Verifica si un email ya está registrado en wellness_centers
 */
export async function checkWellnessEmailAvailability(email: string) {
    const supabase = getServiceRoleClient()
    if (!supabase) return { available: true, error: 'configuration_missing' }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        // Buscar si existe el email en wellness_centers
        const { data: existing, error } = await supabase
            .from('wellness_centers')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle()

        if (error) {
            console.error('Error verificando email wellness:', error)
            return { available: true, error: error.message }
        }

        return { available: !existing }
    } catch (error) {
        console.error('Error inesperado verificando email wellness:', error)
        return { available: true, error: 'unknown_error' }
    }
}
