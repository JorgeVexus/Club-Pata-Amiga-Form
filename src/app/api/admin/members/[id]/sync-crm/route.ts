import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getMemberDetails } from '@/services/memberstack-admin.service';
import { syncMembership, CRM_ACTIVE_TAG } from '@/services/crm.service';
import { getStripeMembershipFields } from '@/lib/stripe-membership';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        const { id: memberId } = await params;
        const body = await request.json();
        const { membershipType, membershipCost } = body;

        console.log(`🔄 Resincronizando CRM para miembro ${memberId}...`);

        // 1. Buscar el usuario en Supabase (con fallback por email)
        let { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('memberstack_id', memberId)
            .single();

        if (userError) {
            console.error('❌ CRM Debug Error (Supabase):', userError);
        }

        console.log('🔍 CRM Debug: Buscando usuario. memberstack_id:', memberId);

        if (userError || !user) {
            // Reintento por email si falla por MS ID
            const memberEmail = request.nextUrl.searchParams.get('email');
            
            if (memberEmail && memberEmail !== 'undefined' && memberEmail !== 'null' && memberEmail.trim() !== '') {
                console.log('🔍 CRM Debug: Fallback por email:', memberEmail);
                const emailResult = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .eq('email', memberEmail.trim())
                    .single();
                
                if (emailResult.data) {
                    user = emailResult.data;
                    userError = null;
                    console.log('✅ CRM Debug: Usuario encontrado por email');
                } else {
                    console.warn('⚠️ CRM Debug: Usuario tampoco encontrado por email:', memberEmail);
                }
            } else {
                console.warn('⚠️ CRM Debug: No se proporcionó un email válido para fallback');
            }
        }

        console.log('🔍 CRM Debug: Resultado query:', {
            found: !!user,
            crm_contact_id: user?.crm_contact_id,
            membership_type: user?.membership_type,
            membership_cost: user?.membership_cost
        });

        if (userError || !user) {
            console.warn('⚠️ CRM Debug: Usuario no encontrado en Supabase. Intentando recuperación vía Memberstack...');
            const memberDetails = await getMemberDetails(memberId);
            
            if (memberDetails.success && memberDetails.data) {
                const msFields = memberDetails.data.customFields || {};
                const crmId = msFields['crm-contact-id'] || msFields['crm_contact_id'];
                
                if (crmId) {
                    console.log('✅ CRM Debug: ID de contacto encontrado en Memberstack:', crmId);
                    user = {
                        crm_contact_id: crmId,
                        email: memberDetails.data.auth?.email || '',
                        membership_type: null, // Se calculará después
                        membership_cost: null
                    } as any;
                }
            }
        }

        if (!user) {
            return NextResponse.json({ 
                error: 'Usuario no encontrado en base de datos ni en Memberstack con ID de CRM' 
            }, { status: 404 });
        }

        if (!user.crm_contact_id) {
            return NextResponse.json({ error: 'El usuario no tiene un ID de contacto de CRM asociado' }, { status: 400 });
        }

        // 2. Obtener detalles del plan desde Memberstack para sincronización precisa
        const memberDetails = await getMemberDetails(memberId);
        
        // Fallbacks jerárquicos: Body (Frontend) > Supabase > Default
        let planType = membershipType || user.membership_type || 'Mensual';
        let planCost = membershipCost || user.membership_cost || '$159';

        console.log(`💳 CRM Resync: Metadata inicial: Type=${planType}, Cost=${planCost}`);

        let subscriptionId: string | undefined;

        if (memberDetails.success && memberDetails.data?.planConnections?.length) {
            const activePlan = memberDetails.data.planConnections.find(p => p.status === 'ACTIVE') || memberDetails.data.planConnections[0];
            const priceId = activePlan.priceId;
            const planName = (activePlan.planName || '').toLowerCase();
            const amount = activePlan.payment?.amount || 0;
            subscriptionId = (activePlan as any).payment?.stripeSubscriptionId;

            // Lógica idéntica a la del Dashboard Admin (stripe-data/route.ts)
            const isAnnualKeyword = planName.includes('anual') || 
                                  planName.includes('annual') || 
                                  planName.includes('year') || 
                                  planName.includes('año');
            
            // Si tiene keyword anual O el monto es mayor a 1000 (indicador fuerte de plan anual de 1699 vs 159 mensual)
            if (priceId === 'prc_anual-o9d101ta' || isAnnualKeyword || amount > 1000) {
                planType = 'Anual';
                planCost = amount > 1000 ? `$${amount.toLocaleString('es-MX')}` : '$1,699';
            } else if (priceId === 'prc_mensual-452k30jah' || (amount > 0 && amount <= 1000)) {
                planType = 'Mensual';
                planCost = amount > 0 ? `$${amount.toLocaleString('es-MX')}` : '$159';
            }
            
            console.log(`💳 CRM Resync: Detectado plan ${planType} (${planCost}) desde Memberstack (ID: ${priceId}, Amount: ${amount})`);
        } else {
            console.log(`💳 CRM Resync: Usando datos de Supabase/Fallback: ${planType} (${planCost})`);
        }


        // Obtener método de pago y fechas reales desde Stripe (best-effort)
        let stripeFields = {};
        if (subscriptionId && process.env.STRIPE_SECRET_KEY) {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            stripeFields = await getStripeMembershipFields(stripe, subscriptionId);
        }

        console.log(`💳 CRM Resync: Enviando Type=${planType}, Cost=${planCost}`, stripeFields);

        const crmResult = await syncMembership(user.crm_contact_id, {
            status: 'activo',
            type: planType,
            cost: planCost,
            addTags: [CRM_ACTIVE_TAG],
            ...stripeFields,
        });

        if (!crmResult.success) {
            return NextResponse.json({ 
                success: false, 
                error: 'Error en la API de CRM', 
                details: crmResult.error 
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Sincronización con CRM exitosa',
            data: { planType, planCost }
        });

    } catch (error: any) {
        console.error('Error resincronizando CRM:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
