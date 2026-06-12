import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/emergency-logs
 * Obtiene logs de activación del botón de emergencia con filtros
 */
export async function GET(request: NextRequest) {
    try {
        // 🔒 SEGURIDAD: Validar que el usuario es admin en el servidor
        const admin = await getAdminUser(request);
        if (!admin) return unauthorizedResponse();

        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month'); // formato YYYY-MM
        const search = searchParams.get('search');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 1000);
        const offset = parseInt(searchParams.get('offset') || '0');

        // Construir query
        let query = supabaseAdmin
            .from('emergency_logs')
            .select(`
                id,
                memberstack_id,
                user_id,
                user_email,
                phone_number,
                triggered_at,
                user_agent,
                ip_address,
                users!emergency_logs_user_id_fkey (
                    first_name,
                    last_name
                )
            `, { count: 'exact' })
            .order('triggered_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Filtro por mes (YYYY-MM)
        if (month) {
            const startDate = `${month}-01T00:00:00.000Z`;
            const endDateObj = new Date(month + '-01');
            endDateObj.setMonth(endDateObj.getMonth() + 1);
            const endDate = endDateObj.toISOString().split('T')[0] + 'T00:00:00.000Z';
            
            query = query
                .gte('triggered_at', startDate)
                .lt('triggered_at', endDate);
        }

        // Filtro por fecha desde
        if (dateFrom) {
            query = query.gte('triggered_at', `${dateFrom}T00:00:00.000Z`);
        }

        // Filtro por fecha hasta
        if (dateTo) {
            const endOfDay = new Date(dateTo);
            endOfDay.setDate(endOfDay.getDate() + 1);
            query = query.lt('triggered_at', endOfDay.toISOString().split('T')[0] + 'T00:00:00.000Z');
        }

        // Filtro de búsqueda (email, memberstack_id, phone)
        if (search) {
            query = query.or(`memberstack_id.ilike.%${search}%,user_email.ilike.%${search}%,phone_number.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('[ADMIN-EMERGENCY-LOGS] Error:', error);
            return NextResponse.json(
                { success: false, error: 'Error consultando logs de emergencia' },
                { status: 500 }
            );
        }

        // Enriquecer datos
        const logs = (data || []).map((log: any) => ({
            id: log.id,
            memberstack_id: log.memberstack_id,
            user_id: log.user_id,
            user_email: log.user_email,
            phone_number: log.phone_number,
            triggered_at: log.triggered_at,
            user_agent: log.user_agent,
            ip_address: log.ip_address,
            user_first_name: log.users?.first_name,
            user_last_name: log.users?.last_name,
        }));

        return NextResponse.json({
            success: true,
            logs,
            pagination: {
                total: count || 0,
                limit,
                offset,
                hasMore: (offset + limit) < (count || 0),
            },
        });

    } catch (error: any) {
        console.error('[ADMIN-EMERGENCY-LOGS] Error inesperado:', error);
        return NextResponse.json(
            { success: false, error: 'Error procesando la solicitud' },
            { status: 500 }
        );
    }
}