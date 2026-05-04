import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
    try {
        // 🔒 SEGURIDAD: Validar que el usuario es admin en el servidor
        const admin = await getAdminUser(request);
        
        if (!admin || (admin as any).isUnauthorized) {
            return unauthorizedResponse(
                (admin as any).reason === 'Role mismatch' 
                    ? 'No autorizado. Tu cuenta no tiene rol de administrador.' 
                    : 'No autorizado. Se requiere rol de administrador.',
                { memberstackId: request.headers.get('x-admin-memberstack-id') }
            );
        }

        return NextResponse.json({
            role: admin.role,
            isSuperAdmin: admin.role === 'super_admin',
            isAdmin: admin.role === 'admin' || admin.role === 'super_admin',
            name: admin.full_name,
            email: admin.email,
            memberstack_id: admin.memberstack_id
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
