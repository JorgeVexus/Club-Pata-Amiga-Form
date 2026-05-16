import { NextRequest, NextResponse } from 'next/server';
import { wellnessService } from '@/services/wellness.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const locations = await wellnessService.getAllApprovedLocations();

        return NextResponse.json({
            success: true,
            count: locations.length,
            data: locations
        });

    } catch (error: any) {
        console.error('❌ API Wellness Locations Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
