'use server'

import { createClient } from '@supabase/supabase-js'
import { memberstackResponseContainsEmail } from '@/utils/memberstack-email-availability'

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
 * Verifica si un email ya está registrado en wellness_centers o Memberstack
 */
export async function checkWellnessEmailAvailability(email: string) {
    const supabase = getServiceRoleClient()
    const memberstackApiKey = process.env.MEMBERSTACK_ADMIN_SECRET_KEY

    if (!supabase || !memberstackApiKey) {
        console.error('Configuración faltante para validación de email');
        return { available: true, error: 'configuration_missing' }
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Verificar en Supabase (wellness_centers)
        const { data: existingSupabase, error: supabaseError } = await supabase
            .from('wellness_centers')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle()

        if (supabaseError) {
            console.error('Error verificando email wellness en Supabase:', supabaseError)
        }

        if (existingSupabase) {
            return { available: false, message: 'Email ya registrado en base de datos' }
        }

        // 2. Verificar en Memberstack mediante Admin API
        try {
            const memberstackResponse = await fetch(`https://admin.memberstack.com/members?email=${normalizedEmail}`, {
                method: 'GET',
                headers: {
                    'X-API-KEY': memberstackApiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (memberstackResponse.ok) {
                const msData = await memberstackResponse.json();
                // Memberstack puede devolver listas amplias; solo bloqueamos coincidencias exactas.
                if (memberstackResponseContainsEmail(msData, normalizedEmail)) {
                    return { available: false, message: 'Email ya registrado en Memberstack' }
                }
            } else {
                console.error('Error Memberstack API status:', memberstackResponse.status);
            }
        } catch (msError) {
            console.error('Error llamando a Memberstack Admin API:', msError);
        }

        return { available: true }
    } catch (error) {
        console.error('Error inesperado verificando email wellness:', error)
        return { available: true, error: 'unknown_error' }
    }
}
