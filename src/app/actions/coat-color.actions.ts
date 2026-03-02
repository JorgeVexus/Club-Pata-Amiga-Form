'use server'

import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

const getSupabaseClient = (useServiceRole = false) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = useServiceRole
        ? process.env.SUPABASE_SERVICE_ROLE_KEY
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) return null

    return createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
    })
}

export type PetColor = {
    id: number
    pet_type: string
    name: string
    hex_code?: string
    is_common?: boolean
}

export type ColorCategory = 'coat' | 'nose' | 'eye';

/**
 * Obtiene los colores según el tipo de mascota y categoría
 */
export const getPetColors = cache(async (petType: 'perro' | 'gato', category: ColorCategory = 'coat') => {
    const supabase = getSupabaseClient()
    if (!supabase) return { error: 'Configuración incompleta' }

    const tableName = `catalog_${category}_colors`;

    try {
        let query = supabase
            .from(tableName)
            .select('*')
            .eq('pet_type', petType === 'perro' ? 'dog' : 'cat')
            .eq('is_active', true);

        // Solo 'coat' tiene 'is_common' según la migración actual, aunque otros podrían tenerlo
        if (category === 'coat') {
            query = query.order('is_common', { ascending: false });
        }

        const { data, error } = await query
            .order('display_order', { ascending: true })

        if (error) throw error
        return { colors: data as PetColor[] }
    } catch (error: any) {
        console.error(`Error fetching ${category} colors:`, error)
        return { error: error.message, colors: [] }
    }
})
