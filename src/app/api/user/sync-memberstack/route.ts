/**
 * API Endpoint: POST /api/user/sync-memberstack
 * 
 * Sincroniza un usuario de Memberstack a Supabase.
 * Útil cuando el usuario existe en Memberstack pero no en nuestra BD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Headers CORS
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
    try {
        const { memberstackId, email, firstName, lastName, phone } = await request.json();

        console.log('🔄 [SYNC] Sincronizando usuario:', email);

        // Validar datos mínimos
        if (!memberstackId || !email) {
            return NextResponse.json(
                { success: false, error: 'memberstackId y email son requeridos' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Verificar si el usuario ya existe en Supabase
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

        if (existingUser) {
            console.log('✅ [SYNC] Usuario ya existe en Supabase:', existingUser.email);
            return NextResponse.json({
                success: true,
                message: 'Usuario ya existe',
                user: existingUser
            }, { headers: corsHeaders() });
        }

        // Crear usuario en Supabase
        const { data: newUser, error } = await supabaseAdmin
            .from('users')
            .insert({
                memberstack_id: memberstackId,
                email: email.toLowerCase().trim(),
                first_name: firstName || email.split('@')[0],
                last_name: lastName || '',
                mother_last_name: '',
                phone: phone || '',
                membership_status: 'pending', // Estado por defecto
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('❌ [SYNC] Error creando usuario:', error);
            return NextResponse.json(
                { success: false, error: 'Error creando usuario', details: error.message },
                { status: 500, headers: corsHeaders() }
            );
        }

        console.log('✅ [SYNC] Usuario creado exitosamente:', newUser.email);

        return NextResponse.json({
            success: true,
            message: 'Usuario sincronizado exitosamente',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.first_name
            }
        }, { headers: corsHeaders() });

    } catch (error: any) {
        console.error('❌ [SYNC] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno', details: error.message },
            { status: 500, headers: corsHeaders() }
        );
    }
}
