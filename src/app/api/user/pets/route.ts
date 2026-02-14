import { NextRequest, NextResponse } from 'next/server';
import { getPetsByUserId } from '@/app/actions/user.actions';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Usamos la acción de servidor que ya creamos
        const result = await getPetsByUserId(userId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Agregar headers CORS para que funcione desde Webflow
        const response = NextResponse.json({
            success: true,
            pets: result.pets,
            last_admin_response: result.last_admin_response,
            action_required_fields: result.action_required_fields,
            membership_status: result.membership_status
        });

        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

        return response;

    } catch (error: any) {
        console.error('API Error fetching user pets:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}
