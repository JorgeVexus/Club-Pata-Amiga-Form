import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

/**
 * Utilidad para validar la autenticación de administrador en el servidor.
 * Verifica que el ID de Memberstack proporcionado tenga rol de admin en Supabase.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create client only if variables exist
const supabase = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function getAdminUser(req: NextRequest) {
    const memberstackId = req.headers.get('x-admin-memberstack-id');
    
    if (!memberstackId) {
        console.error('❌ AdminAuth: No se proporcionó x-admin-memberstack-id en los headers');
        return null;
    }

    if (!supabase) {
        console.error('❌ AdminAuth: Supabase client not initialized (missing environment variables)');
        return null;
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('role, full_name, email, memberstack_id')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        if (error || !user) {
            console.error(`❌ AdminAuth Error: Usuario ${memberstackId} no encontrado en Supabase`, error);
            return null;
        }

        console.log(`✅ AdminAuth: Usuario encontrado ${user.email} con rol ${user.role}`);

        const role = (user.role || '').toString().trim().toLowerCase();
        const isAdmin = role === 'admin' || role === 'super_admin';
        
        if (!isAdmin) {
            console.warn(`⚠️ AdminAuth Warning: Usuario ${user.email} intentó acceder sin rol admin (${user.role})`);
            return { ...user, isUnauthorized: true, reason: 'Role mismatch' };
        }

        return user;
    } catch (err) {
        console.error('❌ AdminAuth Critical Error:', err);
        return null;
    }
}

/**
 * Respuesta estándar para peticiones no autorizadas
 */
export function unauthorizedResponse(message: string = 'No autorizado. Se requiere rol de administrador.', debugInfo?: any) {
    return new Response(JSON.stringify({ 
        error: message,
        success: false,
        debug: process.env.NODE_ENV === 'development' ? debugInfo : undefined
    }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
    });
}
