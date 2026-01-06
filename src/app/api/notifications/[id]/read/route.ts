/**
 * PATCH /api/notifications/[id]/read
 * Marca una notificación específica como leída
 * 
 * URL params:
 * - id: string (required) - UUID de la notificación
 * 
 * Body:
 * - userId: string (required) - Memberstack ID del usuario (para validación)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { userId } = body;

        // Validar parámetros
        if (!id) {
            return NextResponse.json(
                { error: 'Notification ID is required' },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        // Marcar como leída (verificando que pertenezca al usuario)
        const { data, error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error marking notification as read:', error);
            return NextResponse.json(
                { error: 'Failed to mark notification as read' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Notification not found or does not belong to user' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            notification: data
        });

    } catch (error) {
        console.error('Mark as read API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
