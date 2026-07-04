import { NextRequest, NextResponse } from 'next/server';
import { wellnessService } from '@/services/wellness.service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberstackId = searchParams.get('memberstack_id');

        if (!memberstackId) {
            return NextResponse.json(
                { success: false, error: 'Memberstack ID es requerido' },
                { status: 400 }
            );
        }

        const center = await wellnessService.getByMemberstackId(memberstackId);

        if (!center) {
            return NextResponse.json(
                { success: false, error: 'Centro de bienestar no encontrado' },
                { status: 404 }
            );
        }

        // Obtener datos complementarios para el dashboard
        const [payments, appointments, locations] = await Promise.all([
            wellnessService.getPaymentHistory(center.id),
            wellnessService.getAppointments(center.id),
            wellnessService.getLocations(center.id)
        ]);

        return NextResponse.json({
            success: true,
            data: {
                ...center,
                payments,
                appointments,
                locations
            }
        });

    } catch (error: any) {
        console.error('❌ API Wellness Me Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
