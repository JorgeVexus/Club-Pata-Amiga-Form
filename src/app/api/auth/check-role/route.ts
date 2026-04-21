import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import { AdminAuthService } from '@/services/admin-auth.service';

export async function POST(request: NextRequest) {
    const start = Date.now();
    try {
        const { memberstackId } = await request.json();

        if (!memberstackId) {
            return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
        }

        console.log(`🔍 [Check-Role] Request for: ${memberstackId}`);

        // 1. Check if user is Admin/SuperAdmin
        console.time(`[Check-Role] Supabase Admin Check: ${memberstackId}`);
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();
        console.timeEnd(`[Check-Role] Supabase Admin Check: ${memberstackId}`);

        const adminRole = user?.role;

        if (adminRole === 'admin' || adminRole === 'super_admin') {
            return NextResponse.json({
                success: true,
                role: 'admin',
                adminType: adminRole
            });
        }

        // 2. Check if user is an Ambassador
        console.time(`[Check-Role] Supabase Ambassador Check: ${memberstackId}`);
        const { data: ambassador } = await supabase
            .from('ambassadors')
            .select('id, status')
            .eq('linked_memberstack_id', memberstackId)
            .maybeSingle();
        console.timeEnd(`[Check-Role] Supabase Ambassador Check: ${memberstackId}`);

        if (ambassador && ambassador.status !== 'rejected' && ambassador.status !== 'suspended') {
            console.log(`🔍 [Check-Role] Embajador encontrado para ID ${memberstackId}:`, ambassador);
            return NextResponse.json({
                success: true,
                role: 'ambassador',
                status: ambassador.status
            });
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
                });
            }
            
            // Also check for pending/succeeded payments in Stripe
            const hasPendingPayment = planConnections.some(
                (p: any) => p.status === 'PENDING' || p.status === 'INCOMPLETE'
            );

            if (!hasActivePlan && !hasPendingPayment) {
                console.log(`⚠️ [Check-Role] Miembro sin plan activo: ${memberstackId}`);
                return NextResponse.json({
                    success: true,
                    role: 'pending_payment',
                    message: 'Debes completar el pago de tu membresía para continuar'
                });
            }

            if (hasPendingPayment && !hasActivePlan) {
                console.log(`⏳ [Check-Role] Miembro con pago pendiente: ${memberstackId}`);
                return NextResponse.json({
                    success: true,
                    role: 'payment_processing',
                    message: 'Tu pago está siendo procesado'
                });
            }
        }

        console.log(`✅ [Check-Role] Final result: Member (Active). Total time: ${Date.now() - start}ms`);

        return NextResponse.json({
            success: true,
            role: 'member'
        });

    } catch (error) {
        console.error('Check Role Error:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
