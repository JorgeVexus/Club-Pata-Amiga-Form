import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberstackId } = body;

        if (!memberstackId) {
            return NextResponse.json({ error: 'Admin ID required' }, { status: 400 });
        }

        // 1. Verificar identidad y rol del admin
        const { data: adminUser, error: adminError } = await supabase
            .from('users')
            .select('role, full_name, email')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        if (adminError || !adminUser) {
            console.error('❌ Admin not found:', memberstackId);
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
        }

        const isSuperAdmin = adminUser.role === 'super_admin';
        const adminName = adminUser.full_name;

        // 2. Obtener actividad de miembros (Memberstack)
        const membersRes = await memberstackAdmin.listMembers();
        const members = membersRes.success ? membersRes.data || [] : [];

        // 3. Obtener actividad de embajadores (Supabase)
        const { data: ambassadors, error: ambassadorsError } = await supabase
            .from('ambassadors')
            .select('*')
            .order('created_at', { ascending: false });

        if (ambassadorsError) {
            console.error('Error fetching ambassadors:', ambassadorsError);
        }

        const activityLogs: any[] = [];

        // --- Procesar Miembros ---
        members.forEach((member: any) => {
            const fields = member.customFields || {};
            const memberName = `${fields['first-name'] || ''} ${fields['paternal-last-name'] || ''}`.trim() || member.auth.email;
            
            // Log de aprobación
            if (fields['approved-at']) {
                const adminWhoDidIt = fields['approved-by'] || 'Admin';
                const isPersonal = adminWhoDidIt === adminName || adminWhoDidIt === memberstackId;
                
                if (isSuperAdmin || isPersonal) {
                    activityLogs.push({
                        id: `member-app-${member.id}`,
                        type: 'approved',
                        category: 'member',
                        title: 'Membresía Aprobada',
                        description: `Aprobó la membresía de ${memberName}`,
                        timestamp: fields['approved-at'],
                        adminName: adminWhoDidIt,
                        targetName: memberName,
                        role: 'Miembro'
                    });
                }
            }

            // Log de rechazo
            if (fields['rejected-at']) {
                const adminWhoDidIt = fields['rejected-by'] || 'Admin';
                const isPersonal = adminWhoDidIt === adminName || adminWhoDidIt === memberstackId;
                
                if (isSuperAdmin || isPersonal) {
                    activityLogs.push({
                        id: `member-rej-${member.id}`,
                        type: 'rejected',
                        category: 'member',
                        title: 'Membresía Rechazada',
                        description: `Rechazó la membresía de ${memberName}`,
                        timestamp: fields['rejected-at'],
                        adminName: adminWhoDidIt,
                        reason: fields['rejection-reason'],
                        targetName: memberName,
                        role: 'Miembro'
                    });
                }
            }
        });

        // --- Procesar Embajadores ---
        (ambassadors || []).forEach((amb: any) => {
            const ambName = `${amb.first_name} ${amb.paternal_surname}`.trim();

            // Log de registro (solo para super admins, como "nueva solicitud")
            if (isSuperAdmin) {
                activityLogs.push({
                    id: `amb-reg-${amb.id}`,
                    type: 'registration',
                    category: 'ambassador',
                    title: 'Nuevo Aspirante',
                    description: `${ambName} se registró como embajador`,
                    timestamp: amb.created_at,
                    adminName: 'Sistema',
                    targetName: ambName,
                    role: 'Embajador'
                });
            }

            // Log de aprobación
            if (amb.approved_at) {
                const adminWhoDidIt = amb.approved_by || 'Admin';
                const isPersonal = adminWhoDidIt === adminName || adminWhoDidIt === memberstackId;
                
                if (isSuperAdmin || isPersonal) {
                    activityLogs.push({
                        id: `amb-app-${amb.id}`,
                        type: 'approved',
                        category: 'ambassador',
                        title: 'Embajador Aprobado',
                        description: `Aprobó a ${ambName} como embajador`,
                        timestamp: amb.approved_at,
                        adminName: adminWhoDidIt,
                        targetName: ambName,
                        role: 'Embajador'
                    });
                }
            }

            // Log de rechazo
            if (amb.rejected_at) {
                const adminWhoDidIt = amb.rejected_by || 'Admin';
                const isPersonal = adminWhoDidIt === adminName || adminWhoDidIt === memberstackId;
                
                if (isSuperAdmin || isPersonal) {
                    activityLogs.push({
                        id: `amb-rej-${amb.id}`,
                        type: 'rejected',
                        category: 'ambassador',
                        title: 'Embajador Rechazado',
                        description: `Rechazó a ${ambName} como embajador`,
                        timestamp: amb.rejected_at,
                        adminName: adminWhoDidIt,
                        reason: amb.rejection_reason,
                        targetName: ambName,
                        role: 'Embajador'
                    });
                }
            }
        });

        // 4. Ordenar por fecha descendente
        activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // 5. Filtrar "Tu actividad" explícitamente para el admin actual
        const yourActivity = activityLogs.filter(log => 
            log.adminName === adminName || log.adminName === memberstackId
        );

        return NextResponse.json({
            success: true,
            recentActivity: activityLogs.slice(0, 50),
            yourActivity: yourActivity.slice(0, 20)
        });

    } catch (error) {
        console.error('Activity API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
