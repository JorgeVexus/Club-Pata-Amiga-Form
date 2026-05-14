import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMemberDetails } from '@/services/memberstack-admin.service';
import { updateContactAsActive } from '@/services/crm.service';
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
                        email: memberDetails.data.auth?.email || memberDetails.data.email,
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

        // 2. Fallbacks jerárquicos (igual que en approve)
        let planType = membershipType || user.membership_type;
        let planCost = membershipCost || user.membership_cost;

        // Si aún falta algo, intentar Memberstack
        if (!planType || !planCost) {
            const memberDetails = await getMemberDetails(memberId);
            if (memberDetails.success && memberDetails.data?.planConnections?.length) {
                const activePlan = memberDetails.data.planConnections.find(p => p.status === 'ACTIVE') || memberDetails.data.planConnections[0];
                const priceId = activePlan.priceId;

                if (priceId === 'prc_anual-o9d101ta') {
                    planType = planType || 'Anual';
                    planCost = planCost || '$1,699';
                } else if (priceId === 'prc_mensual-452k30jah') {
                    planType = planType || 'Mensual';
                    planCost = planCost || '$159';
                }
            }
        }

        // Defaults finales
        planType = planType || 'Mensual';
        planCost = planCost || '$159';

        console.log(`💳 CRM Resync: Enviando Type=${planType}, Cost=${planCost}`);

        const crmResult = await updateContactAsActive(
            user.crm_contact_id,
            planType,
            planCost
        );

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
