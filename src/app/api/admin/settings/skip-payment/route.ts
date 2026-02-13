import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/settings/skip-payment
 * Retorna si el skip payment está habilitado (público)
 */
export async function GET() {
    try {
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
export async function PUT(request: Request) {
    try {
        const { enabled, adminId } = await request.json();

        // Verificar que es super_admin
        const { data: adminUser } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('memberstack_id', adminId)
            .single();

        if (adminUser?.role !== 'super_admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

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
