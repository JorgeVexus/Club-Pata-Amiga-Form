/**
 * POST /api/notifications/create
 * Crea una nueva notificación para un usuario
 * 
 * Body:
 * - userId: string (required) - Memberstack ID del usuario
 * - type: string (required) - Tipo de notificación
 * - title: string (required) - Título de la notificación
 * - message: string (required) - Mensaje de la notificación
 * - icon: string (optional) - Emoji o icono
 * - link: string (optional) - URL para redirección
 * - metadata: object (optional) - Datos adicionales
 * - expiresAt: string (optional) - Fecha de expiración ISO
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Tipos válidos de notificación
const VALID_TYPES = [
    'account',
    'waiting_period',
    'new_center',
    'blog',
    'announcement',
    'appeal',
    'payment',
    'document'
];

// Iconos por defecto según tipo
const DEFAULT_ICONS: Record<string, string> = {
    account: '🎉',
    waiting_period: '⏰',
    new_center: '🏥',
    blog: '📝',
    announcement: '📢',
    appeal: '⚖️',
    payment: '💳',
    document: '📄'
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            userId,
            type,
            title,
            message,
            icon,
            link,
            metadata,
            expiresAt
        } = body;

        // Validar campos requeridos
        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        if (!type || !VALID_TYPES.includes(type)) {
            return NextResponse.json(
                { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        if (!title || !message) {
            return NextResponse.json(
                { error: 'title and message are required' },
                { status: 400 }
            );
        }

        // Verificar preferencias del usuario (si existen)
        const { data: prefs } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Si el usuario tiene deshabilitado este tipo, no crear la notificación
        if (prefs) {
            const prefKey = `${type}_enabled` as keyof typeof prefs;
            if (prefs[prefKey] === false) {
                return NextResponse.json({
                    success: false,
                    message: `User has disabled ${type} notifications`,
                    created: false
                });
            }
        }

        // Crear la notificación
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                icon: icon || DEFAULT_ICONS[type] || '🔔',
                link: link || null,
                metadata: metadata || {},
                expires_at: expiresAt || null
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            return NextResponse.json(
                { error: 'Failed to create notification' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            notification: data,
            created: true
        });

    } catch (error) {
        console.error('Create notification API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
