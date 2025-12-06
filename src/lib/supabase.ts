/**
 * Cliente de Supabase
 * Inicializa y exporta el cliente para usar en toda la aplicación
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTg5NTcsImV4cCI6MjA4MDQzNDk1N30.YnrJ_ECWnqcO_iDP5V-tBkgwd4LdBhJnJ5jdLsowjnA';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (typeof window !== 'undefined') {
        console.log('✅ Using default Supabase credentials');
    }
}

// Cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
