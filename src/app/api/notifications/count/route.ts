/**
 * GET /api/notifications/count
 * Obtiene el conteo de notificaciones no leídas de un usuario
 * 
 * Query params:
 * - userId: string (required) - Memberstack ID del usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper para configurar CORS y respuesta
function corsResponse(data: any, status = 200) {
    const response = NextResponse.json(data, { status });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        // Validar userId
        if (!userId || userId === 'undefined') {
            return corsResponse({ error: 'Valid userId is required' }, 400);
        }

        // Obtener conteo de no leídas
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false)
            .or('expires_at.is.null,expires_at.gt.now()');

        if (error) {
            console.error('Error counting notifications:', error);
            return corsResponse({ error: 'Failed to count notifications' }, 500);
        }

        return corsResponse({
            success: true,
            unreadCount: count || 0
        });

    } catch (error) {
        console.error('Notifications count API error:', error);
        return corsResponse({ error: 'Internal server error' }, 500);
    }
}
