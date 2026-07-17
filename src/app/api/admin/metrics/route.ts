import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { supabase } from '@/lib/supabase';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    try {
        // 🔒 SEGURIDAD: Validar que el usuario es admin en el servidor
        const admin = await getAdminUser(request);
        if (!admin) return unauthorizedResponse();

        // Verificar configuración de base de datos
        if (!supabase) {
            console.error('❌ Supabase not configured in /api/admin/metrics');
            return NextResponse.json({ error: 'Servicio de base de datos no disponible' }, { status: 500 });
        }

        // Obtener todos los miembros (limitado a la paginación actual del servicio)
        // TODO: Mejorar servicio para obtener count total real desde la API de Memberstack si hay paginación
        const result = await memberstackAdmin.listMembers();

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Error fetching members');
        }

        const members = result.data;

        // Get all admin/super_admin users from Supabase to exclude them
        const { data: adminUsers, error: adminError } = await supabase
            .from('users')
            .select('memberstack_id')
            .in('role', ['admin', 'super_admin']);

        if (adminError) {
            console.error('Error fetching admin users:', adminError);
        }

        const adminMemberstackIds = new Set(adminUsers?.map((u: { memberstack_id: string }) => u.memberstack_id) || []);

        // Calcular métricas reales - EXCLUDE admin/super_admin users
        const totalMembers = members.filter(m =>
            m.customFields?.['approval-status'] === 'approved' &&
            !adminMemberstackIds.has(m.id) &&
            m.planConnections?.some((p: any) =>
                p.status?.toLowerCase() === 'active' || p.status?.toLowerCase() === 'trialing'
            )
        ).length;

        // Fetch ambassadors count from Supabase
        const { count: totalAmbassadors } = await supabase
            .from('ambassadors')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved');

        // Fetch wellness centers count from Supabase
        const { count: totalWellnessCenters } = await supabase
            .from('wellness_centers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved');

        const activeWellnessCenters = totalWellnessCenters || 0;

        // Sumar exclusivamente montos aprobados reales. Mantener el nombre
        // totalRefunds evita romper los consumidores existentes del dashboard.
        const { data: approvedRequests, error: refundsError } = await supabase
            .from('solidarity_requests')
            .select('approved_amount')
            .in('status', ['approved', 'paid', 'scheduled', 'completed']);

        if (refundsError) {
            throw refundsError;
        }

        const totalRefunds = (approvedRequests || []).reduce(
            (sum: number, solidarityRequest: { approved_amount: number | string | null }) =>
                sum + (Number(solidarityRequest.approved_amount) || 0),
            0
        );

        return NextResponse.json({
            success: true,
            metrics: {
                totalMembers,
                totalAmbassadors: totalAmbassadors || 0,
                activeWellnessCenters,
                totalRefunds,
            }
        });

    } catch (error: any) {
        console.error('Error calculating metrics:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
