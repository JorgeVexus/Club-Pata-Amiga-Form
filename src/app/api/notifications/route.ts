/**
 * GET /api/notifications
 * Obtiene las notificaciones de un usuario
 * 
 * Query params:
 * - userId: string (required) - Memberstack ID del usuario
 * - limit: number (optional, default: 10) - Cantidad de notificaciones
 * - offset: number (optional, default: 0) - Paginación
 * - unreadOnly: boolean (optional, default: false) - Solo no leídas
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
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        // Validar userId
        if (!userId || userId === 'undefined') {
            return corsResponse({ error: 'Valid userId is required' }, 400);
        }

        // Construir query
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .or('expires_at.is.null,expires_at.gt.now()')
            .order('created_at', { ascending: false });

        // Filtrar solo no leídas si se solicita
        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        // Aplicar paginación
        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching notifications:', error);
            return corsResponse({ error: 'Failed to fetch notifications' }, 500);
        }

        return corsResponse({
            success: true,
            notifications: data || [],
            pagination: {
                limit,
                offset,
                hasMore: (data?.length || 0) === limit
            }
        });

    } catch (error) {
        console.error('Notifications API error:', error);
        return corsResponse({ error: 'Internal server error' }, 500);
    }
}
