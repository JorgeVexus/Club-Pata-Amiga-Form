/**
 * GET /api/notifications/count
 * Obtiene el conteo de notificaciones no leídas de un usuario
 * 
 * Query params:
 * - userId: string (required) - Memberstack ID del usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        // Validar userId
        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
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
            return NextResponse.json(
                { error: 'Failed to count notifications' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            unreadCount: count || 0
        });

    } catch (error) {
        console.error('Notifications count API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
