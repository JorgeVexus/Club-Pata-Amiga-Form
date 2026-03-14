import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
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

        const adminMemberstackIds = new Set(adminUsers?.map(u => u.memberstack_id) || []);

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

        const activeWellnessCenters = 0; // Placeholder

        // Simulación de Fondo Solidario (ej. $50 de cada membresía aprobada se va al fondo)
        const solidarityFund = totalMembers * 50;

        return NextResponse.json({
            success: true,
            metrics: {
                totalMembers,
                totalAmbassadors: totalAmbassadors || 0,
                activeWellnessCenters,
                totalRefunds: solidarityFund,
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
