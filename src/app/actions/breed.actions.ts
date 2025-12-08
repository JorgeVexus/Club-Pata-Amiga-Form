'use server'

import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

// Cliente de solo lectura/escritura estándar (o service role si es necesario)
// Para leer razas, el cliente público está bien si las políticas RLS lo permiten.
// Para crear (seeding), necesitaremos service role.

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

export type Breed = {
    id: string
    name: string
    type: 'perro' | 'gato'
    has_genetic_issues: boolean
    warning_message?: string
    max_age: number
}

/**
 * Obtiene todas las razas de un tipo específico (cacheado)
 */
export const getBreeds = cache(async (type: 'perro' | 'gato') => {
    const supabase = getSupabaseClient()
    if (!supabase) return { error: 'Configuración incompleta' }

    try {
        const { data, error } = await supabase
            .from('breeds')
            .select('*')
            .eq('type', type)
            .order('name')

        if (error) throw error
        return { breeds: data as Breed[] }
    } catch (error: any) {
        console.error('Error fetching breeds:', error)
        return { error: error.message, breeds: [] }
    }
})

/**
 * Acción administrativa para insertar razas masivamente
 */
export async function seedBreeds(breedsData: Omit<Breed, 'id'>[]) {
    const supabase = getSupabaseClient(true) // Usar Service Role para escritura
    if (!supabase) return { success: false, error: 'Falta Service Role Key' }

    try {
        console.log(`🔄 Iniciando carga (seed) de ${breedsData.length} razas...`);

        // Usamos upsert con ignoreDuplicates: true
        // Esto requiere que exista una restricción UNIQUE en la BD (que ya creaste)
        // en las columnas (name, type)
        const { error } = await supabase
            .from('breeds')
            .upsert(breedsData, {
                onConflict: 'name, type',
                ignoreDuplicates: true
            })

        if (error) {
            console.error('❌ Error de Supabase:', error.message);
            throw error;
        }

        console.log('✅ Carga completada. Duplicados ignorados automáticamente por la BD.');
        return { success: true, count: breedsData.length }
    } catch (error: any) {
        console.error('Error seeding breeds:', error)
        return { success: false, error: error.message }
    }
}
