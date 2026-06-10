import { NextRequest, NextResponse } from 'next/server';
import { listPendingMembers, listAppealedMembers, memberstackAdmin } from '@/services/memberstack-admin.service';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase';
import { getRegistrationIssue } from '@/utils/registration-completeness';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';
import Stripe from 'stripe';

// Usar el cliente administrativo centralizado
const supabaseAdminClient = supabaseAdmin;

/**
* GET /api/admin/members?status=pending
* Lista miembros según su estado de aprobación
*/
export async function GET(request: NextRequest) {
    try {
        // 🔒 SEGURIDAD: Validar que el usuario es admin en el servidor
        const admin = await getAdminUser(request);
        if (!admin) return unauthorizedResponse();

        // Verificar configuración de base de datos
        if (!isSupabaseAdminConfigured() || !supabaseAdminClient) {
            console.error('❌ Supabase Admin not configured in /api/admin/members');
            return NextResponse.json(
                { error: 'Servicio de base de datos no disponible' },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // 🆕 Nuevo parámetro para incluir miembros con suscripción cancelada (cancel_at_period_end)
        const includeCancelled = searchParams.get('includeCancelled') === 'true';
        
        let result;

        // Por defecto, solo mostrar miembros con plan pagado en el dashboard
        const paidOnly = searchParams.get('paidOnly') !== 'false'; // true por defecto

        if (status === 'pending') {
            result = await listPendingMembers(paidOnly);
        } else if (status === 'appealed') {
            result = await listAppealedMembers(paidOnly);
        } else if (status === 'approved' || status === 'rejected') {
            // Use the generic listMembers method exposed via the singleton
            result = await memberstackAdmin.listMembers(status, { paidOnly });
        } else if (!status || status === 'all') {
            // Return all members if no status or 'all'
            result = await memberstackAdmin.listMembers(undefined, { paidOnly });
        } else {
            return NextResponse.json(
                { error: 'Status inválido. Usa: pending, appealed, approved o rejected' },
                { status: 400 }
            );
        }

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        // Filter out admin/super_admin users from the results
        // USAMOS el cliente admin (Service Role) para saltar RLS
        const { data: adminUsers, error: adminError } = await supabaseAdminClient
            .from('users')
            .select('memberstack_id')
            .in('role', ['admin', 'super_admin']);

        if (adminError) {
            console.error('Error fetching admin users:', adminError);
        }

        const adminMemberstackIds = new Set(adminUsers?.map((u: { memberstack_id: string }) => u.memberstack_id) || []);

        // Filter out admins from the member list
        const filteredMembers = result.data?.filter(member => !adminMemberstackIds.has(member.id)) || [];

        console.log(`[API] Member filter: Total fetched ${result.data?.length}, Admins hidden: ${(result.data?.length || 0) - filteredMembers.length}`);


        // ENRICHMENT: Fetch real pet counts and info status from Supabase
        const memberstackIds = filteredMembers.map(m => m.id);
        const memberDataMap = new Map<string, { 
            petCount: number, 
            pendingPetCount: number, 
            infoStatus: string,
            firstName?: string,
            lastName?: string
        }>();

        if (memberstackIds.length > 0) {
            const { data: userMappings, error: mappingError } = await supabaseAdminClient
                .from('users')
                .select('id, memberstack_id, approval_status, first_name, last_name')
                .in('memberstack_id', memberstackIds);

            if (!mappingError && userMappings) {
                const supabaseUserIds = userMappings.map((u: { id: string }) => u.id);
                
                // Fetch detailed pet info
                const { data: petsData, error: petsError } = await supabaseAdminClient
                    .from('pets')
                    .select('owner_id, photo_url, vet_certificate_url, is_senior, status')
                    .in('owner_id', supabaseUserIds);

                if (!petsError && petsData) {
                    // Group pets by owner
                    const ownerPetsMap = new Map<string, any[]>();
                    petsData.forEach((pet: any) => {
                        const pets = ownerPetsMap.get(pet.owner_id) || [];
                        pets.push(pet);
                        ownerPetsMap.set(pet.owner_id, pets);
                    });

                    // Calculate status for each member
                    userMappings.forEach((user: any) => {
                        const msId = user.memberstack_id;
                        const pets = ownerPetsMap.get(user.id) || [];
                        
                        let infoStatus = 'complete';
                        
                        if (pets.length > 0) {
                            const hasActionRequired = pets.some(p => p.status === 'action_required') || user.approval_status === 'action_required';
                            
                            if (hasActionRequired) {
                                infoStatus = 'requested';
                            } else {
                                const isIncomplete = pets.some(p => {
                                    const missingPhoto = !p.photo_url || p.photo_url.trim() === '';
                                    const missingCert = p.is_senior && (!p.vet_certificate_url || p.vet_certificate_url.trim() === '');
                                    return missingPhoto || missingCert;
                                });
                                
                                if (isIncomplete) {
                                    infoStatus = 'incomplete';
                                }
                            }
                        } else {
                            // If they are members but have 0 pets, we consider it incomplete 
                            // (they haven't finished registration)
                            infoStatus = 'incomplete';
                        }

                        memberDataMap.set(msId, {
                            petCount: pets.length,
                            pendingPetCount: pets.filter(p => p.status !== 'approved').length,
                            infoStatus: infoStatus,
                            firstName: user.first_name,
                            lastName: user.last_name
                        });
                    });
                }
            }
        }

        // 🆕 Detectar suscripciones canceladas (cancel_at_period_end) desde Stripe
        let cancelledMemberMap = new Map<string, { isCancelled: boolean; cancelledAt: string | null; membershipEndDate: string | null }>();
        
        if (includeCancelled && process.env.STRIPE_SECRET_KEY) {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            
            // Filtrar miembros que tienen plan activo y stripeSubscriptionId
            const membersWithSubId = filteredMembers.filter(member => {
                const plan = member.planConnections?.[0];
                const subId = plan?.payment?.stripeSubscriptionId;
                const hasActivePlan = plan?.status?.toLowerCase() === 'active' || plan?.status?.toLowerCase() === 'trialing';
                return hasActivePlan && subId;
            });

            if (membersWithSubId.length > 0) {
                console.log(`[API] Verificando cancelación en Stripe para ${membersWithSubId.length} miembros...`);
                
                // Fetch en paralelo (máximo 10 a la vez para no saturar Stripe)
                const batches = [];
                for (let i = 0; i < membersWithSubId.length; i += 10) {
                    batches.push(membersWithSubId.slice(i, i + 10));
                }

                for (const batch of batches) {
                    const results = await Promise.allSettled(batch.map(async (member) => {
                        const plan = member.planConnections?.[0];
                        const subId = plan?.payment?.stripeSubscriptionId;
                        if (!subId) return null;
                        
                        try {
                            const sub = await stripe.subscriptions.retrieve(subId) as any;
                            if (sub.cancel_at_period_end === true) {
                                return {
                                    memberId: member.id,
                                    isCancelled: true,
                                    cancelledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
                                    membershipEndDate: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null
                                };
                            }
                        } catch (e) {
                            console.warn(`[API] Error fetching Stripe sub ${subId}:`, e);
                        }
                        return null;
                    }));

                    for (const result of results) {
                        if (result.status === 'fulfilled' && result.value) {
                            cancelledMemberMap.set(result.value.memberId, {
                                isCancelled: result.value.isCancelled,
                                cancelledAt: result.value.cancelledAt,
                                membershipEndDate: result.value.membershipEndDate
                            });
                        }
                    }
                }
                
                console.log(`[API] Miembros con cancelación detectada: ${cancelledMemberMap.size}`);
            }
        }

        // Attach enriched data to members
        const membersWithCounts = filteredMembers.map(member => {
            const enriched = memberDataMap.get(member.id);
            
            // Extract payment status from the first plan connection
            const plan = member.planConnections?.[0];
            let paymentStatus = plan?.status?.toLowerCase() || 'none';
            const petCount = enriched?.petCount || 0;
            const hasActivePlan = paymentStatus === 'active' || paymentStatus === 'trialing';
            const customFields = member.customFields || {};
            const hasBasicPetFields = Boolean(
                customFields['pet-1-name'] ||
                customFields['pet-name'] ||
                Number(customFields['total-pets'] || 0) > 0
            );
            const registrationIssue = getRegistrationIssue({
                hasActivePlan,
                petCount,
                hasValidPetBasic: hasBasicPetFields,
            });

            // 🆕 Aplicar info de cancelación si está disponible
            const cancelledInfo = cancelledMemberMap.get(member.id);
            if (cancelledInfo?.isCancelled) {
                paymentStatus = 'canceled';
            }

            return {
                ...member,
                petCount,
                pendingPetCount: enriched?.pendingPetCount || 0,
                infoStatus: enriched?.infoStatus || (registrationIssue ? 'incomplete' : 'complete'),
                paymentStatus: paymentStatus,
                registrationIssue,
                supabaseFirstName: enriched?.firstName,
                supabaseLastName: enriched?.lastName,
                // 🆕 Campos de cancelación
                isCancelled: cancelledInfo?.isCancelled || false,
                cancelledAt: cancelledInfo?.cancelledAt || null,
                membershipEndDate: cancelledInfo?.membershipEndDate || null
            };
        });

        return NextResponse.json({
            success: true,
            members: membersWithCounts,
            count: membersWithCounts.length,
        });

    } catch (error: any) {
        console.error('Error en GET /api/admin/members:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
