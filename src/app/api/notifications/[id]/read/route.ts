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

// Helper para configurar CORS y respuesta
function corsResponse(data: any, status = 200) {
    const response = NextResponse.json(data, { status });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}

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
            return corsResponse({ error: 'Notification ID is required' }, 400);
        }

        if (!userId || userId === 'undefined') {
            return corsResponse({ error: 'Valid userId is required' }, 400);
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
            return corsResponse({ error: 'Failed to mark notification as read' }, 500);
        }

        if (!data) {
            return corsResponse({ error: 'Notification not found or does not belong to user' }, 404);
        }

        return corsResponse({
            success: true,
            notification: data
        });

    } catch (error) {
        console.error('Mark as read API error:', error);
        return corsResponse({ error: 'Internal server error' }, 500);
    }
}
