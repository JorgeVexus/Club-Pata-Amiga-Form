import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

async function fetchMembersWithKey(apiKey: string): Promise<any[]> {
    let allMembers: any[] = [];
    let currentCursor: string | null = null;
    let pageCount = 0;
    const maxPages = 20;

    do {
        let url = `https://admin.memberstack.com/members?limit=100`;
        if (currentCursor) {
            url += `&after=${currentCursor}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiKey
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const members = data.data || [];
        allMembers = allMembers.concat(members);
        pageCount++;

        const hasMore = data.hasNextPage || false;
        currentCursor = hasMore && data.endCursor ? data.endCursor : null;

    } while (currentCursor && pageCount < maxPages);

    return allMembers;
}

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
        const mainKey = process.env.MEMBERSTACK_ADMIN_SECRET_KEY || '';
        const isMainKeyTest = mainKey.startsWith('sk_sb_');

        let rawMsMembers: any[] = [];

        // 1. Obtener todos los miembros desde el entorno principal de Memberstack
        const msResult = await memberstackAdmin.listMembers(undefined, { paidOnly: false });

        if (!msResult.success || !msResult.data) {
            console.error('❌ Error listando miembros en Memberstack:', msResult.error);
            return NextResponse.json(
                { error: 'Error al consultar miembros en Memberstack: ' + msResult.error },
                { status: 500 }
            );
        }

        rawMsMembers = msResult.data.map(m => ({
            ...m,
            isTest: isMainKeyTest
        }));

        // 2. Si la clave principal es de producción (Live), consultar también el entorno de Sandbox (Pruebas)
        if (!isMainKeyTest) {
            const testKey = process.env.MEMBERSTACK_TEST_ADMIN_SECRET_KEY || 'sk_sb_4bd4a70ab26be68d67c5';
            try {
                console.log('📡 Consultando miembros del entorno Sandbox de Memberstack...');
                const testMembers = await fetchMembersWithKey(testKey);
                console.log(`📊 Se encontraron ${testMembers.length} miembros de Sandbox.`);
                
                // Evitar duplicados por ID (si los hubiera)
                const mainIds = new Set(rawMsMembers.map(m => m.id));
                const uniqueTestMembers = testMembers.filter(m => !mainIds.has(m.id));
                
                rawMsMembers = [
                    ...rawMsMembers,
                    ...uniqueTestMembers.map((m: any) => ({
                        ...m,
                        isTest: true
                    }))
                ];
            } catch (err) {
                console.error('⚠️ Error no crítico consultando miembros de Sandbox:', err);
            }
        }

        // 3. No filtramos por tener el plan de Pata Amiga. Se procesan todos.
        const filteredMembers = rawMsMembers;

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
            .select('id, memberstack_id, email, crm_contact_id, ambassador_code, first_name, last_name, created_at, payment_completed_at, coupon_code')
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
            const planConnection = m.planConnections?.find((pc: any) => pc.planId === planIdToFilter);
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
                paymentDate: dbUser?.payment_completed_at || null,
                couponCode: dbUser?.coupon_code || null,
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
        let noPlanCount = 0;
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
            } else if (m.status === 'none') {
                noPlanCount++;
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
            noPlanCount,
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
