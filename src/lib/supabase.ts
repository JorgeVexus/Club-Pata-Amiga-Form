import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Buckets de Supabase Storage definidos en el proyecto
 */
export const STORAGE_BUCKETS = {
    INE: 'ine-documents',
    PROOF_OF_ADDRESS: 'proof-of-address',
    PET_PHOTOS: 'pet-photos',
    VET_CERTIFICATES: 'vet-certificates',
    AMBASSADOR_DOCS: 'ambassador-documents',
} as const;

// Log initialization status (helpful for debugging in Vercel)
if (typeof window !== 'undefined') {
    if (!supabaseUrl) console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL is missing');
    if (!supabaseAnonKey) console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
}

/**
 * Cliente público de Supabase (usa la anon key)
 */
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null as any;

/**
 * Cliente administrativo de Supabase (usa la service role key)
 * SOLO PARA USO EN EL SERVIDOR
 */
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null as any;

/**
 * Helper para verificar si Supabase está configurado
 */
export const isSupabaseConfigured = () => !!supabaseUrl && !!supabaseAnonKey;

/**
 * Helper para verificar si Supabase Admin está configurado
 */
export const isSupabaseAdminConfigured = () => !!supabaseUrl && !!supabaseServiceKey;
