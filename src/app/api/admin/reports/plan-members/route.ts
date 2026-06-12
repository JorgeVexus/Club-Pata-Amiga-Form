import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    try {
        // 🔒 SEGURIDAD: Validar que el usuario es admin en el servidor
        const admin = await getAdminUser(request);
        if (!admin) return unauthorizedResponse();

        // Verificar configuración de base de datos
        if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
            console.error('❌ Supabase Admin not configured in /api/admin/reports/plan-members');
            return NextResponse.json(
                { error: 'Servicio de base de datos no disponible' },
                { status: 500 }
            );
        }

        const planIdToFilter = 'pln_club-pata-amiga-9o2k00j6m';

        // 1. Obtener todos los miembros desde Memberstack (incluyendo no pagados o cancelados)
        const msResult = await memberstackAdmin.listMembers(undefined, { paidOnly: false });

        if (!msResult.success || !msResult.data) {
            console.error('❌ Error listando miembros en Memberstack:', msResult.error);
            return NextResponse.json(
                { error: 'Error al consultar miembros en Memberstack: ' + msResult.error },
                { status: 500 }
            );
        }

        // 2. Filtrar únicamente los miembros que tengan el plan de Pata Amiga
        const filteredMembers = msResult.data.filter(m => 
            m.planConnections?.some(pc => pc.planId === planIdToFilter)
        );

        if (filteredMembers.length === 0) {
            return NextResponse.json({
                success: true,
                members: [],
                metrics: {
                    totalMembers: 0,
                    activeCount: 0,
                    cancelledCount: 0,
                    requiresPaymentCount: 0,
                    mrr: 0,
                    arr: 0,
                    testCount: 0,
                    productionCount: 0
                },
                monthlyTrends: []
            });
        }

        // 3. Obtener IDs y correos para cruzar datos en Supabase
        const msIds = filteredMembers.map(m => m.id);

        // Consultar información básica del usuario en Supabase (Saltando RLS)
        const { data: dbUsers, error: dbUsersError } = await supabaseAdmin
            .from('users')
            .select('id, memberstack_id, email, crm_contact_id, ambassador_code, first_name, last_name, created_at')
            .in('memberstack_id', msIds);

        if (dbUsersError) {
            console.error('❌ Error al consultar usuarios en Supabase:', dbUsersError);
        }

        const memberDbInfo = new Map<string, any>();
        const dbUserIdToMsId = new Map<string, string>();
        const dbUserIds: string[] = [];

        if (dbUsers) {
            dbUsers.forEach((u: any) => {
                if (u.memberstack_id) {
                    memberDbInfo.set(u.memberstack_id, u);
                }
                if (u.id) {
                    dbUserIds.push(u.id);
                    if (u.memberstack_id) {
                        dbUserIdToMsId.set(u.id, u.memberstack_id);
                    }
                }
            });
        }

        // Consultar mascotas registradas por usuario
        const petCounts = new Map<string, number>();
        if (dbUserIds.length > 0) {
            const { data: petsData, error: petsError } = await supabaseAdmin
                .from('pets')
                .select('owner_id');

            if (petsError) {
                console.error('❌ Error al consultar mascotas:', petsError);
            } else if (petsData) {
                petsData.forEach((p: any) => {
                    petCounts.set(p.owner_id, (petCounts.get(p.owner_id) || 0) + 1);
                });
            }
        }

        // Consultar detalles de cancelaciones en Supabase
        const { data: cancellations, error: cancellationsError } = await supabaseAdmin
            .from('membership_cancellations')
            .select('memberstack_id, cancellation_date, membership_end_date, cancellation_reason, comments')
            .in('memberstack_id', msIds);

        if (cancellationsError) {
            console.error('❌ Error al consultar cancelaciones:', cancellationsError);
        }

        const cancellationsMap = new Map<string, any>();
        if (cancellations) {
            cancellations.forEach((c: any) => {
                cancellationsMap.set(c.memberstack_id, c);
            });
        }

        // Obtener la lista de embajadores para determinar roles/nombres
        const { data: ambassadorsData, error: ambassadorsError } = await supabaseAdmin
            .from('ambassadors')
            .select('email, ambassador_code, first_name, paternal_surname');

        if (ambassadorsError) {
            console.error('❌ Error al consultar embajadores:', ambassadorsError);
        }

        const ambassadorEmails = new Set<string>();
        const ambassadorNames = new Map<string, string>();
        if (ambassadorsData) {
            ambassadorsData.forEach((a: any) => {
                if (a.email) ambassadorEmails.add(a.email.toLowerCase().trim());
                if (a.ambassador_code) {
                    ambassadorNames.set(a.ambassador_code, `${a.first_name} ${a.paternal_surname}`.trim());
                }
            });
        }

        // 4. Mapear y enriquecer los datos de los miembros
        const enrichedMembers = filteredMembers.map(m => {
            const email = (m.auth?.email || '').toLowerCase().trim();
            const dbUser = memberDbInfo.get(m.id);
            const petCount = dbUser ? (petCounts.get(dbUser.id) || 0) : 0;
            const cancellation = cancellationsMap.get(m.id);
            
            // Datos de conexión al plan
            const planConnection = m.planConnections?.find(pc => pc.planId === planIdToFilter);
            let paymentStatus = planConnection?.status?.toLowerCase() || 'none';

            // Si hay un registro de cancelación explícito, forzar estatus cancelado
            if (cancellation || paymentStatus === 'canceled' || paymentStatus === 'cancelled') {
                paymentStatus = 'canceled';
            }

            // Normalización de estatus para visualización uniforme
            if (paymentStatus === 'active' || paymentStatus === 'trialing') {
                paymentStatus = 'active';
            } else if (paymentStatus === 'past_due' || paymentStatus === 'unpaid' || paymentStatus === 'incomplete') {
                paymentStatus = 'past_due';
            }

            // Origen del registro (Miembro vs Embajador)
            const isAmbassadorRole = m.customFields?.['role'] === 'ambassador' || 
                                    m.customFields?.['is-ambassador'] === 'true' || 
                                    m.customFields?.['registration-source'] === 'Embajador' ||
                                    ambassadorEmails.has(email);
            const origin = isAmbassadorRole ? 'Embajador' : 'Miembro';

            // Método de Captación (Directo vs Referido)
            const refCode = dbUser?.ambassador_code || m.customFields?.['ambassador-code'] || m.customFields?.['referrer-ambassador-code'] || null;
            const channel = refCode ? 'Referido' : 'Directo';
            const ambassadorName = refCode ? (ambassadorNames.get(refCode) || 'Embajador Desconocido') : null;

            // Identificación de Test Mode (Cuentas de prueba)
            const isTest = m.isTest === true || 
                           email.endsWith('@example.com') || 
                           email.endsWith('@test.com') || 
                           email.includes('test') || 
                           email.includes('prueba');

            // Costo y periodicidad
            const amount = planConnection?.payment?.amount || 0;
            const planName = (planConnection?.planName || '').toLowerCase();
            const isAnnual = planName.includes('anual') || 
                             planName.includes('annual') || 
                             planName.includes('year') || 
                             planName.includes('año') || 
                             amount > 1000;
            
            let costText = '';
            if (amount > 0) {
                costText = `$${amount.toLocaleString('es-MX')} MXN / ${isAnnual ? 'año' : 'mes'}`;
            } else {
                costText = isAnnual ? '$1,699 MXN / año' : '$159 MXN / mes';
            }

            return {
                id: m.id,
                email: m.auth?.email || 'N/A',
                name: dbUser ? `${dbUser.first_name} ${dbUser.last_name}`.trim() : `${m.customFields?.['first-name'] || ''} ${m.customFields?.['paternal-last-name'] || ''}`.trim() || 'Sin nombre',
                registeredAt: dbUser?.created_at || m.customFields?.['submitted-at'] || m.createdAt || new Date().toISOString(),
                status: paymentStatus,
                costText,
                amount: amount || (isAnnual ? 1699 : 159),
                isAnnual,
                petCount,
                origin,
                channel,
                ambassadorCode: refCode,
                ambassadorName,
                isTest,
                crmContactId: dbUser?.crm_contact_id || m.customFields?.['crm-contact-id'] || null,
                cancellationDetails: cancellation ? {
                    cancellationDate: cancellation.cancellation_date,
                    endDate: cancellation.membership_end_date,
                    reason: cancellation.cancellation_reason,
                    comments: cancellation.comments || ''
                } : null
            };
        });

        // 5. Calcular métricas agregadas
        let activeCount = 0;
        let cancelledCount = 0;
        let requiresPaymentCount = 0;
        let testCount = 0;
        let productionCount = 0;
        let mrr = 0;

        // Histórico de registros agrupados por mes ('YYYY-MM')
        const monthlyRegistrationMap = new Map<string, number>();

        enrichedMembers.forEach(m => {
            if (m.isTest) {
                testCount++;
            } else {
                productionCount++;
            }

            // Agrupación mensual por fecha de registro
            try {
                const date = new Date(m.registeredAt);
                if (!isNaN(date.getTime())) {
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    monthlyRegistrationMap.set(monthKey, (monthlyRegistrationMap.get(monthKey) || 0) + 1);
                }
            } catch (err) {
                console.warn('Error parseando fecha de registro:', m.registeredAt);
            }

            // Solo calcular métricas activas/ingresos para miembros reales (o todos, pero preferiblemente ambos)
            // Calcularemos métricas sobre todo el universo, pero las financieras idealmente sobre producción
            if (m.status === 'active') {
                activeCount++;
                // MRR: Si es anual, dividir entre 12, si es mensual agregar completo
                const value = m.isAnnual ? (m.amount / 12) : m.amount;
                mrr += value;
            } else if (m.status === 'canceled') {
                cancelledCount++;
            } else if (m.status === 'past_due') {
                requiresPaymentCount++;
            }
        });

        const arr = mrr * 12;

        // Formatear las tendencias mensuales ordenadas cronológicamente
        const monthlyTrends = Array.from(monthlyRegistrationMap.entries())
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month));

        const metrics = {
            totalMembers: enrichedMembers.length,
            activeCount,
            cancelledCount,
            requiresPaymentCount,
            mrr: Math.round(mrr),
            arr: Math.round(arr),
            testCount,
            productionCount
        };

        return NextResponse.json({
            success: true,
            members: enrichedMembers,
            metrics,
            monthlyTrends
        });

    } catch (error: any) {
        console.error('❌ Error in /api/admin/reports/plan-members GET:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno al generar el reporte' },
            { status: 500 }
        );
    }
}
