import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import { AdminAuthService } from '@/services/admin-auth.service';

// CORS headers
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
    const start = Date.now();
    try {
        const { memberstackId } = await request.json();

        if (!memberstackId) {
            return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400, headers: corsHeaders() });
        }

        console.log(`🔍 [Check-Role] Request for: ${memberstackId}`);

        // 1. Check if user is Admin/SuperAdmin
        const adminStart = Date.now();
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();
        console.log(`[Check-Role] Supabase Admin Check: ${memberstackId} took ${Date.now() - adminStart}ms`);

        const adminRole = user?.role;

        if (adminRole === 'admin' || adminRole === 'super_admin') {
            console.log(`🔍 [Check-Role] Admin encontrado para ID ${memberstackId}:`, adminRole);
            return NextResponse.json({
                success: true,
                role: 'admin',
                adminType: adminRole
            }, { headers: corsHeaders() });
        }

        // 2. Check if user is a Wellness Center (prioridad sobre embajador)
        const wellnessStart = Date.now();
        const { data: wellnessCenter } = await supabase
            .from('wellness_centers')
            .select('id, status')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();
        console.log(`[Check-Role] Supabase Wellness Center Check: ${memberstackId} took ${Date.now() - wellnessStart}ms`);

        if (wellnessCenter && wellnessCenter.status !== 'rejected' && wellnessCenter.status !== 'suspended' && wellnessCenter.status !== 'cancelled') {
            console.log(`🔍 [Check-Role] Centro de Bienestar encontrado para ID ${memberstackId}:`, wellnessCenter);
            return NextResponse.json({
                success: true,
                role: 'wellness_center',
                status: wellnessCenter.status
            }, { headers: corsHeaders() });
        }

        // 3. Check if user is an Ambassador
        const ambassadorStart = Date.now();
        const { data: ambassador } = await supabase
            .from('ambassadors')
            .select('id, status')
            .eq('linked_memberstack_id', memberstackId)
            .maybeSingle();
        console.log(`[Check-Role] Supabase Ambassador Check: ${memberstackId} took ${Date.now() - ambassadorStart}ms`);

        if (ambassador && ambassador.status !== 'rejected' && ambassador.status !== 'suspended' && ambassador.status !== 'cancelled') {
            console.log(`🔍 [Check-Role] Embajador encontrado para ID ${memberstackId}:`, ambassador);
            return NextResponse.json({
                success: true,
                role: 'ambassador',
                status: ambassador.status
            }, { headers: corsHeaders() });
        }

        // 3. Optional: Check if global skip_payment_enabled is active
        console.time(`[Check-Role] Supabase Settings Check: ${memberstackId}`);
        const { data: skipPaymentSetting } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'skip_payment_enabled')
            .maybeSingle();
        console.timeEnd(`[Check-Role] Supabase Settings Check: ${memberstackId}`);

        const skipPaymentEnabled = skipPaymentSetting?.value === true;

        // 4. Check if user has an active plan in Memberstack
        console.time(`[Check-Role] Memberstack API Check: ${memberstackId}`);
        const memberDetails = await memberstackAdmin.getMember(memberstackId);
        console.timeEnd(`[Check-Role] Memberstack API Check: ${memberstackId}`);
        
        if (memberDetails.success && memberDetails.data) {
            const planConnections = memberDetails.data.planConnections || [];
            const hasActivePlan = planConnections.some(
                (p: any) => p.status === 'ACTIVE' || p.status === 'TRIAL'
            );

            // If skip payment is enabled, we treat them as active members
            if (skipPaymentEnabled && !hasActivePlan) {
                console.log(`🎁 [Check-Role] Skip Payment habilitado para ${memberstackId}. Saltando verificación Stripe.`);
                return NextResponse.json({
                    success: true,
                    role: 'member'
                }, { headers: corsHeaders() });
            }
            
            // Also check for pending/succeeded payments in Stripe
            const hasPendingPayment = planConnections.some(
                (p: any) => p.status === 'PENDING' || p.status === 'INCOMPLETE'
            );

            // 4. Check for canceled/expired plans (Renewals)
            const canceledPlan = planConnections.find(
                (p: any) => p.status === 'CANCELED' || p.status === 'EXPIRED'
            );

            if (!hasActivePlan && !hasPendingPayment) {
                if (canceledPlan) {
                    console.log(`❌ [Check-Role] Miembro con membresía cancelada: ${memberstackId}`);
                    return NextResponse.json({
                        success: true,
                        role: 'canceled_payment',
                        canceledAt: (canceledPlan as any).canceledAt || (canceledPlan as any).updatedAt || null,
                        planId: (canceledPlan as any).planId || null
                    }, { headers: corsHeaders() });
                }

                console.log(`⚠️ [Check-Role] Miembro sin plan activo: ${memberstackId}`);
                return NextResponse.json({
                    success: true,
                    role: 'pending_payment',
                    message: 'Debes completar el pago de tu membresía para continuar'
                }, { headers: corsHeaders() });
            }

            if (hasPendingPayment && !hasActivePlan) {
                console.log(`⏳ [Check-Role] Miembro con pago pendiente: ${memberstackId}`);
                return NextResponse.json({
                    success: true,
                    role: 'payment_processing',
                    message: 'Tu pago está siendo procesado'
                }, { headers: corsHeaders() });
            }
        }

        console.log(`✅ [Check-Role] Final result: Member (Active). Total time: ${Date.now() - start}ms`);

        return NextResponse.json({
            success: true,
            role: 'member'
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Check Role Error:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500, headers: corsHeaders() });
    }
}
