import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WellnessCenterRegistrationData } from '@/types/wellness.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

const MEMBERSTACK_API_URL = 'https://admin.memberstack.com/members';

function getMemberstackAdminKey(): string {
    return process.env.MEMBERSTACK_ADMIN_SECRET_KEY || '';
}

/**
 * Crea el usuario en Memberstack
 */
async function createMemberstackUser(email: string, password?: string, name?: string) {
    const apiKey = getMemberstackAdminKey();
    if (!apiKey) throw new Error('Memberstack API key not configured');

    const response = await fetch(MEMBERSTACK_API_URL, {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email.toLowerCase().trim(),
            password: password,
            customFields: {
                'first-name': name,
                'role': 'wellness-center',
                'is-wellness-center': 'true',
                'approval-status': 'pending'
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Error creating Memberstack user');
    }

    return data.data?.id || data.id;
}

export async function POST(request: NextRequest) {
    try {
        const body: WellnessCenterRegistrationData = await request.json();

        // Validaciones
        if (!body.email || !body.establishment_name || !body.services || body.services.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Faltan campos obligatorios' },
                { status: 400 }
            );
        }

        if (!supabase) {
            console.error('❌ Supabase client not initialized in API route');
            return NextResponse.json(
                { success: false, error: 'Database configuration error' },
                { status: 500 }
            );
        }

        // 1. Verificar si ya existe en Supabase
        const { data: existing } = await supabase
            .from('wellness_centers')
            .select('id')
            .eq('email', body.email.toLowerCase())
            .single();

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'El correo ya está registrado' },
                { status: 400 }
            );
        }

        // 2. Crear en Memberstack (si no viene un ID externo, asumiendo registro nuevo)
        let memberstackId: string;
        try {
            memberstackId = await createMemberstackUser(body.email, body.password, body.establishment_name);
        } catch (error: any) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // 3. Crear en Supabase
        const { data: center, error: dbError } = await supabase
            .from('wellness_centers')
            .insert({
                establishment_name: body.establishment_name,
                email: body.email.toLowerCase(),
                services: body.services,
                memberstack_id: memberstackId,
                status: 'pending'
            })
            .select()
            .single();

        if (dbError) {
            console.error('❌ Error saving to Supabase:', dbError);
            return NextResponse.json(
                { success: false, error: 'Error al guardar en base de datos' },
                { status: 500 }
            );
        }

        // 4. Notificación para Admin
        try {
            await supabase.from('notifications').insert({
                user_id: 'admin',
                type: 'new_wellness_center',
                title: 'Nuevo Centro de Bienestar',
                message: `${body.establishment_name} se ha registrado como aliado.`,
                icon: '🏥',
                link: '/admin/dashboard/wellness',
                data: { wellness_center_id: center.id },
                is_read: false
            });
        } catch (notifError) {
            console.error('⚠️ Error creating admin notification:', notifError);
            // Non-critical, we don't fail the registration
        }

        return NextResponse.json({
            success: true,
            data: center
        }, { status: 201 });

    } catch (error: any) {
        console.error('❌ Registration Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
