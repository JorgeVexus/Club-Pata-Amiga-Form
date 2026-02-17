/**
 * API Endpoint: GET /api/integrations/vet-bot/verify-code
 * 
 * Alternativa simple para identificación de usuarios usando un código de 6 dígitos.
 * Este endpoint es útil cuando la agencia del bot no puede implementar
 * la identificación automática vía sessionToken.
 * 
 * Flujo:
 * 1. Usuario inicia sesión y ve un código de 6 dígitos en su dashboard
 * 2. Bot pregunta: "¿Tienes un código de soporte?"
 * 3. Usuario introduce el código
 * 4. Bot llama a este endpoint
 * 5. API devuelve los datos del usuario
 * 
 * Headers requeridos:
 * - x-vet-bot-key: API key secreta del bot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Cliente Supabase con Service Role
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { 
        auth: { 
            autoRefreshToken: false, 
            persistSession: false 
        } 
    }
);

// API Key para autenticar requests del bot
const VET_BOT_API_KEY = process.env.VET_BOT_API_KEY || 'pata-amiga-vet-bot-secret-2026';

// Duración de los códigos (30 minutos)
const CODE_EXPIRY_MINUTES = 30;

interface VerifyCodeResponse {
    success: boolean;
    user?: {
        id: string;
        name: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        membershipStatus: string;
    };
    pets?: Array<{
        id: string;
        name: string;
        type: string;
        breed: string;
        size: string | null;
        age: string | null;
    }>;
    consultationHistory?: Array<{
        id: string;
        date: string;
        summary: string;
        petName: string | null;
    }>;
    error?: string;
    code?: string;
}

/**
 * GET /api/integrations/vet-bot/verify-code?code=123456
 * Valida un código de vinculación y retorna los datos del usuario
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        
        // 1. Validar API Key
        const apiKey = request.headers.get('x-vet-bot-key');
        if (apiKey !== VET_BOT_API_KEY) {
            console.warn('🚫 [VET_BOT_VERIFY] Unauthorized attempt');
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Obtener código
        const code = searchParams.get('code');
        
        if (!code || !/^[0-9]{6}$/.test(code)) {
            return NextResponse.json(
                { success: false, error: 'Invalid code format. Expected 6 digits.' },
                { status: 400 }
            );
        }

        console.log(`🔢 [VET_BOT_VERIFY] Verifying code: ${code}`);

        // 3. Buscar código en la base de datos
        const { data: codeRecord, error: codeError } = await supabaseAdmin
            .from('vet_bot_verification_codes')
            .select('*, users(*)')
            .eq('code', code)
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (codeError || !codeRecord) {
            console.warn(`⚠️ [VET_BOT_VERIFY] Invalid or expired code: ${code}`);
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Invalid or expired code',
                    code: 'CODE_INVALID'
                },
                { status: 404 }
            );
        }

        // 4. Marcar código como usado
        await supabaseAdmin
            .from('vet_bot_verification_codes')
            .update({ 
                is_used: true, 
                used_at: new Date().toISOString() 
            })
            .eq('id', codeRecord.id);

        // 5. Obtener datos del usuario
        const user = codeRecord.users;
        
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // 6. Obtener mascotas
        const { data: pets, error: petsError } = await supabaseAdmin
            .from('pets')
            .select('id, name, breed, breed_size, age, status, pet_type')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: true });

        if (petsError) {
            console.error('❌ [VET_BOT_VERIFY] Error fetching pets:', petsError);
        }

        // 7. Obtener historial de consultas
        const { data: consultations } = await supabaseAdmin
            .from('consultations')
            .select('id, created_at, summary, pets(name)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        // 8. Formatear respuesta
        const response: VerifyCodeResponse = {
            success: true,
            user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`.trim(),
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                phone: user.phone,
                membershipStatus: user.membership_status
            },
            pets: (pets || []).map(pet => ({
                id: pet.id,
                name: pet.name,
                type: pet.pet_type || (pet.breed?.toLowerCase().includes('gato') ? 'Gato' : 'Perro'),
                breed: pet.breed || 'Mestizo',
                size: pet.breed_size,
                age: pet.age
            })),
            consultationHistory: (consultations || []).map(cons => ({
                id: cons.id,
                date: cons.created_at,
                summary: cons.summary,
                petName: cons.pets?.[0]?.name || null
            }))
        };

        console.log(`✅ [VET_BOT_VERIFY] Code verified for: ${user.email}`);

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('❌ [VET_BOT_VERIFY] Server Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/integrations/vet-bot/verify-code
 * Genera un nuevo código de verificación para un usuario
 * (Este endpoint es para uso interno nuestro, no para la agencia)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { memberstackId, userId } = body;

        if (!memberstackId && !userId) {
            return NextResponse.json(
                { success: false, error: 'memberstackId or userId required' },
                { status: 400 }
            );
        }

        // Generar código de 6 dígitos
        const code = crypto.randomInt(100000, 999999).toString();
        
        // Calcular expiración
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRY_MINUTES);

        // Buscar usuario
        let userQuery = supabaseAdmin.from('users').select('id, memberstack_id');
        
        if (userId) {
            userQuery = userQuery.eq('id', userId);
        } else {
            userQuery = userQuery.eq('memberstack_id', memberstackId);
        }

        const { data: user, error: userError } = await userQuery.single();

        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Invalidar códigos anteriores del mismo usuario
        await supabaseAdmin
            .from('vet_bot_verification_codes')
            .update({ is_used: true })
            .eq('user_id', user.id)
            .eq('is_used', false);

        // Crear nuevo código
        const { data: codeRecord, error: insertError } = await supabaseAdmin
            .from('vet_bot_verification_codes')
            .insert({
                user_id: user.id,
                code: code,
                expires_at: expiresAt.toISOString(),
                is_used: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            console.error('❌ [VET_BOT_VERIFY] Error creating code:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to create verification code' },
                { status: 500 }
            );
        }

        console.log(`🔢 [VET_BOT_VERIFY] Code generated: ${code} for user ${user.id}`);

        return NextResponse.json({
            success: true,
            code: code,
            expiresAt: expiresAt.toISOString(),
            expiresInMinutes: CODE_EXPIRY_MINUTES
        });

    } catch (error: any) {
        console.error('❌ [VET_BOT_VERIFY] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
