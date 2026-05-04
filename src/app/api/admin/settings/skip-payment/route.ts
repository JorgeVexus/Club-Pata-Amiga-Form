import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/settings/skip-payment
 * Retorna si el skip payment está habilitado
 */
export async function GET(request: NextRequest) {
    try {
        // 🔒 SEGURIDAD: Solo admins pueden consultar esto desde el dashboard
        const admin = await getAdminUser(request);
        if (!admin) return unauthorizedResponse();

        const { data, error } = await supabaseAdmin
            .from('app_settings')
            .select('value')
            .eq('key', 'skip_payment_enabled')
            .single();

        if (error) {
            return NextResponse.json({ enabled: false });
        }

        return NextResponse.json({ enabled: data?.value ?? false });
    } catch {
        return NextResponse.json({ enabled: false });
    }
}

/**
 * PUT /api/admin/settings/skip-payment
 * Actualiza el flag (requiere super_admin)
 */
export async function PUT(request: NextRequest) {
    try {
        // 🔒 SEGURIDAD: Validar que el usuario es super_admin
        const admin = await getAdminUser(request);
        
        if (!admin || admin.role !== 'super_admin') {
            return unauthorizedResponse('No autorizado. Se requiere rol de Super Administrador.');
        }

        const { enabled } = await request.json();

        const { error } = await supabaseAdmin
            .from('app_settings')
            .upsert({
                key: 'skip_payment_enabled',
                value: enabled,
                updated_at: new Date().toISOString()
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, enabled });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
