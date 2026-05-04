import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

/**
 * Utilidad para validar la autenticación de administrador en el servidor.
 * Verifica que el ID de Memberstack proporcionado tenga rol de admin en Supabase.
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getAdminUser(req: NextRequest) {
    // SEGURIDAD: Obtener el ID de Memberstack del header personalizado
    const memberstackId = req.headers.get('x-admin-memberstack-id');
    
    if (!memberstackId) {
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

        const role = user.role?.toLowerCase();
        const isAdmin = role === 'admin' || role === 'super_admin';
        
        if (!isAdmin) {
            console.warn(`⚠️ AdminAuth Warning: Usuario ${user.email} intentó acceder sin rol admin (${user.role})`);
            return null;
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
export function unauthorizedResponse(message: string = 'No autorizado. Se requiere rol de administrador.') {
    return new Response(JSON.stringify({ 
        error: message,
        success: false 
    }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
    });
}
