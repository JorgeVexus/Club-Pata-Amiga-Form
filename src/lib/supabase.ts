/**
 * Cliente de Supabase
 * Inicializa y exporta el cliente para usar en toda la aplicación
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
        console.error('❌ Supabase credentials missing. Please check your .env.local file.');
    }
}

// Cliente de Supabase
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        persistSession: false, // No persistir sesión ya que usamos Memberstack para auth
    },
});

// Nombres de buckets en Supabase Storage
export const STORAGE_BUCKETS = {
    INE: 'ine-documents',
    PROOF_OF_ADDRESS: 'proof-of-address',
    PET_PHOTO: 'pet-photos',
    VET_CERTIFICATE: 'vet-certificates',
} as const;

/**
 * Helper para verificar si Supabase está configurado
 */
export const isSupabaseConfigured = (): boolean => {
    return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'));
};
