import { NextRequest, NextResponse } from 'next/server';
import { getMemberStripeDetails } from '@/app/actions/user.actions';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // TODO: Validar que el usuario sea admin
        const { id: memberId } = await params;

        console.log(`📋 [API] Obteniendo detalles de Stripe para miembro ${memberId}...`);

        const result = await getMemberStripeDetails(memberId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            stripeData: result.stripeData,
        });

    } catch (error: any) {
        console.error('Error obteniendo detalles de Stripe:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
