/**
 * API Route: /api/admin/members/[id]/appeal-logs
 * Obtiene el historial de logs de apelación para un usuario específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: memberId } = await params;

        console.log(`📜 Obteniendo logs de apelación para ${memberId}...`);

        // Obtener los logs de apelación ordenados por fecha (más recientes primero)
        const { data: logs, error } = await supabaseAdmin
            .from('appeal_logs')
            .select('*')
            .eq('user_id', memberId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo logs:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Enriquecer logs con nombres de admin si es posible
        const enrichedLogs = await Promise.all((logs || []).map(async (log) => {
            let adminName = 'Sistema';

            if (log.admin_id && log.admin_id !== 'admin' && log.admin_id !== 'current_admin') {
                // Intentar obtener el nombre del admin desde Supabase
                const { data: adminData } = await supabaseAdmin
                    .from('users')
                    .select('first_name, last_name, full_name')
                    .eq('memberstack_id', log.admin_id)
                    .single();

                if (adminData) {
                    adminName = adminData.full_name || `${adminData.first_name || ''} ${adminData.last_name || ''}`.trim() || 'Administrador';
                } else {
                    adminName = 'Administrador';
                }
            }

            return {
                ...log,
                admin_name: adminName,
                formatted_date: new Date(log.created_at).toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                })
            };
        }));

        return NextResponse.json({
            success: true,
            logs: enrichedLogs
        });

    } catch (error: any) {
        console.error('Error en appeal-logs API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
