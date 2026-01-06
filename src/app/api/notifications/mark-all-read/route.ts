/**
 * POST /api/notifications/mark-all-read
 * Marca todas las notificaciones de un usuario como leídas
 * 
 * Body:
 * - userId: string (required) - Memberstack ID del usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper para configurar CORS y respuesta
function corsResponse(data: any, status = 200) {
    const response = NextResponse.json(data, { status });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        // Validar userId
        if (!userId || userId === 'undefined') {
            return corsResponse({ error: 'Valid userId is required' }, 400);
        }

        // Marcar todas como leídas
        const { data, error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('is_read', false)
            .select();

        if (error) {
            console.error('Error marking all notifications as read:', error);
            return NextResponse.json(
                { error: 'Failed to mark notifications as read' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            markedCount: data?.length || 0,
            message: `${data?.length || 0} notifications marked as read`
        });

    } catch (error) {
        console.error('Mark all as read API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
