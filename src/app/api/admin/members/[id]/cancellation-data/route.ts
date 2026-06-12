import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request);
        if (!admin) return unauthorizedResponse();

        const { id: memberstackId } = await params;

        // Buscar usuario en Supabase para obtener user_id
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        if (userError || !user) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Buscar la cancelación más reciente
        const { data: cancellation, error: cancellationError } = await supabaseAdmin
            .from('membership_cancellations')
            .select('*')
            .eq('user_id', user.id)
            .order('cancellation_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (cancellationError) {
            console.error('[CANCELLATION-DATA] Error:', cancellationError);
            return NextResponse.json({ success: false, error: 'Error cargando datos de cancelación' }, { status: 500 });
        }

        if (!cancellation) {
            return NextResponse.json({ success: true, cancellation: null });
        }

        // Mapear razón a texto en español
        const reasonLabels: Record<string, string> = {
            'no_longer_needed': 'Ya no necesito el servicio',
            'price_too_high': 'El precio es muy alto',
            'found_alternative': 'Encontré una mejor opción',
            'service_issues': 'Problemas con el servicio',
            'other': 'Otro motivo',
        };

        const cancellationReasonLabel = reasonLabels[cancellation.cancellation_reason] || cancellation.cancellation_reason;

        return NextResponse.json({
            success: true,
            cancellation: {
                id: cancellation.id,
                cancellation_date: cancellation.cancellation_date,
                membership_end_date: cancellation.membership_end_date,
                days_remaining_at_cancellation: cancellation.days_remaining_at_cancellation,
                cancellation_reason: cancellation.cancellation_reason,
                cancellation_reason_label: cancellationReasonLabel,
                reason_other_text: cancellation.reason_other_text,
                comments: cancellation.comments,
                stripe_subscription_id: cancellation.stripe_subscription_id,
                subscription_interval: cancellation.subscription_interval,
            },
        });

    } catch (error: any) {
        console.error('[CANCELLATION-DATA] Error inesperado:', error);
        return NextResponse.json({ success: false, error: 'Error procesando la solicitud' }, { status: 500 });
    }
}