/**
 * POST /api/notifications/mark-all-read
 * Marca todas las notificaciones de un usuario como leídas
 * 
 * Body:
 * - userId: string (required) - Memberstack ID del usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        // Validar userId
        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
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
