/**
 * GET/PATCH /api/notifications/preferences
 * Obtiene o actualiza las preferencias de notificación de un usuario
 * 
 * GET Query params:
 * - userId: string (required) - Memberstack ID del usuario
 * 
 * PATCH Body:
 * - userId: string (required) - Memberstack ID del usuario
 * - preferences: object (required) - Preferencias a actualizar
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener preferencias del usuario
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching preferences:', error);
            return NextResponse.json(
                { error: 'Failed to fetch preferences' },
                { status: 500 }
            );
        }

        // Si no existen preferencias, devolver valores por defecto
        if (!data) {
            return NextResponse.json({
                success: true,
                preferences: {
                    user_id: userId,
                    account_enabled: true,
                    waiting_period_enabled: true,
                    new_center_enabled: true,
                    blog_enabled: true,
                    announcement_enabled: true,
                    appeal_enabled: true,
                    payment_enabled: true,
                    document_enabled: true,
                    in_app_enabled: true,
                    email_enabled: true,
                    whatsapp_enabled: false
                },
                isDefault: true
            });
        }

        return NextResponse.json({
            success: true,
            preferences: data,
            isDefault: false
        });

    } catch (error) {
        console.error('Get preferences API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH - Actualizar preferencias del usuario
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, preferences } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        if (!preferences || typeof preferences !== 'object') {
            return NextResponse.json(
                { error: 'preferences object is required' },
                { status: 400 }
            );
        }

        // Campos permitidos para actualizar
        const allowedFields = [
            'account_enabled',
            'waiting_period_enabled',
            'new_center_enabled',
            'blog_enabled',
            'announcement_enabled',
            'appeal_enabled',
            'payment_enabled',
            'document_enabled',
            'in_app_enabled',
            'email_enabled',
            'whatsapp_enabled'
        ];

        // Filtrar solo los campos permitidos
        const updateData: Record<string, boolean> = {};
        for (const [key, value] of Object.entries(preferences)) {
            if (allowedFields.includes(key) && typeof value === 'boolean') {
                updateData[key] = value;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'No valid preferences to update' },
                { status: 400 }
            );
        }

        // Upsert: actualizar si existe, crear si no
        const { data, error } = await supabase
            .from('notification_preferences')
            .upsert({
                user_id: userId,
                ...updateData
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Error updating preferences:', error);
            return NextResponse.json(
                { error: 'Failed to update preferences' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            preferences: data
        });

    } catch (error) {
        console.error('Update preferences API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
