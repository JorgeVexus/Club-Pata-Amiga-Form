/**
 * API Endpoint: GET /api/integrations/vet-bot/context
 * 
 * Retorna el contexto completo de un usuario para el Vet-Bot.
 * Soporta tres métodos de identificación:
 * 1. sessionToken (nuevo, recomendado) - Identificación automática post-login
 * 2. email (legacy) - Identificación por email
 * 3. userId (legacy) - Identificación por memberstack_id
 * 
 * Headers requeridos:
 * - x-vet-bot-key: API key secreta del bot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Headers CORS
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-vet-bot-key',
    };
}

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

interface UserContext {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    membershipStatus: string;
}

interface PetContext {
    id: string;
    name: string;
    type: string;
    breed: string;
    size: string | null;
    age: string | null;
    status: string;
    waitingPeriod: {
        start: string | null;
        end: string | null;
        isActive: boolean;
    };
}

interface ConsultationHistory {
    id: string;
    date: string;
    summary: string;
    recommendations: string | null;
    petName: string | null;
}

interface VetBotContextResponse {
    success: boolean;
    user: UserContext;
    pets: PetContext[];
    consultationHistory: ConsultationHistory[];
    session?: {
        validUntil: string;
        minutesRemaining: number;
    };
    identifiedVia: 'session_token' | 'email' | 'memberstack_id';
    timestamp: string;
}

/**
 * OPTIONS /api/integrations/vet-bot/context
 */
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

/**
 * GET /api/integrations/vet-bot/context
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);

        // 1. Validar API Key
        const apiKey = request.headers.get('x-vet-bot-key');

        // DEBUG: Log de headers recibidos (ocultando el valor real por seguridad)
        console.log('🤖 [VET_BOT] Headers received:', {
            'x-vet-bot-key': apiKey ? 'Present (length: ' + apiKey.length + ')' : 'MISSING',
            'user-agent': request.headers.get('user-agent')?.substring(0, 50)
        });

        if (apiKey !== VET_BOT_API_KEY) {
            console.warn('🚫 [VET_BOT] API Key mismatch');
            console.warn('   Expected:', VET_BOT_API_KEY?.substring(0, 10) + '...');
            console.warn('   Received:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
            return NextResponse.json(
                { success: false, error: 'Unauthorized', message: 'Invalid API Key' },
                { status: 401, headers: corsHeaders() }
            );
        }

        // 2. Obtener parámetros de identificación (Manejar camelCase y snake_case)
        const sessionToken = searchParams.get('sessionToken') || searchParams.get('session_token');
        const email = searchParams.get('email') || searchParams.get('user_email');
        const userId = searchParams.get('userId') || searchParams.get('memberstack_id');

        // DEBUG: Log de parámetros recibidos
        console.log('🤖 [VET_BOT] Params received:', {
            sessionToken: sessionToken ? '***' : null,
            email: email,
            userId: userId
        });

        // Debe proporcionarse al menos un método de identificación
        if (!sessionToken && !email && !userId) {
            console.log('🤖 [VET_BOT] ERROR: No identification parameter provided');
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing identification parameter',
                    message: 'Provide sessionToken, email, or userId'
                },
                { status: 400, headers: corsHeaders() }
            );
        }

        console.log(`🤖 [VET_BOT] Identificando via: ${sessionToken ? 'SessionToken' : email ? 'Email' : 'UserId'}`);

        // 3. Resolver identificación a memberstack_id
        let memberstackId: string | null = null;
        let resolvedEmail: string | null = null;
        let identifiedVia: 'session_token' | 'email' | 'memberstack_id' = 'memberstack_id';
        let sessionExpiresAt: string | null = null;

        // Método 1: Session Token (Eficaz y seguro)
        if (sessionToken) {
            console.log('🧪 [VET_BOT] Validando token de sesión...');
            const sessionResult = await validateSessionToken(sessionToken);

            if (sessionResult.valid && sessionResult.memberstackId) {
                memberstackId = sessionResult.memberstackId;
                resolvedEmail = sessionResult.email || null;
                sessionExpiresAt = sessionResult.expiresAt || null;
                identifiedVia = 'session_token';
                console.log(`✅ [VET_BOT] Sesión válida para: ${resolvedEmail} (${memberstackId})`);
            }
            // NUEVO: Fallback si el token enviado es en realidad un email (error común de configuración del bot)
            else if (isValidEmail(sessionToken)) {
                console.warn('💡 [VET_BOT] Token no válido como sesión, pero es un email válido. Usando como fallback.');
                resolvedEmail = sessionToken.toLowerCase().trim();
                identifiedVia = 'email';
            }
            else {
                console.warn('⚠️ [VET_BOT] Sesión inválida o expirada');
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid or expired session token',
                        code: 'SESSION_EXPIRED'
                    },
                    { status: 401, headers: corsHeaders() }
                );
            }
        }
        // Método 2: Email (legacy/fallback)
        else if (email) {
            resolvedEmail = email.toLowerCase().trim();
            identifiedVia = 'email';
            console.log(`📧 [VET_BOT] Buscando por email: ${resolvedEmail}`);
        }
        // Método 3: Memberstack ID (legacy/fallback)
        else if (userId) {
            memberstackId = userId;
            identifiedVia = 'memberstack_id';
            console.log(`🆔 [VET_BOT] Buscando por memberstackId: ${userId}`);
        }

        // 4. Buscar usuario en la base de datos
        console.log('🔍 [VET_BOT] Consultando tabla USERS...');
        let userQuery = supabaseAdmin
            .from('users')
            .select(`
                id,
                memberstack_id,
                first_name,
                last_name,
                mother_last_name,
                email,
                phone,
                membership_status,
                created_at
            `);

        if (memberstackId) {
            userQuery = userQuery.eq('memberstack_id', memberstackId);
        } else if (resolvedEmail) {
            userQuery = userQuery.ilike('email', resolvedEmail);
        }

        const { data: user, error: userError } = await userQuery.maybeSingle();

        if (userError) {
            console.error('❌ [VET_BOT] Error en query de usuario:', userError);
            return NextResponse.json(
                { success: false, error: 'Database error fetching user', details: userError.message },
                { status: 500, headers: corsHeaders() }
            );
        }

        if (!user) {
            console.warn(`⚠️ [VET_BOT] Usuario no encontrado en BD: ${resolvedEmail || memberstackId}`);
            return NextResponse.json(
                { success: false, error: 'User not found in database', code: 'USER_NOT_FOUND' },
                { status: 404, headers: corsHeaders() }
            );
        }

        console.log(`✅ [VET_BOT] Usuario identificado: ${user.email} (UUID: ${user.id})`);

        // 5. Buscar mascotas del usuario
        console.log('🐾 [VET_BOT] Consultando tabla PETS...');
        const { data: pets, error: petsError } = await supabaseAdmin
            .from('pets')
            .select(`
                id,
                name,
                breed,
                breed_size,
                age,
                status,
                waiting_period_start,
                waiting_period_end
            `)
            .eq('owner_id', user.id)
            .order('created_at', { ascending: true });

        if (petsError) {
            console.error('❌ [VET_BOT] Error fetching pets:', petsError);
            return NextResponse.json(
                { success: false, error: 'Error fetching pet data' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // 6. Buscar historial de consultas
        console.log('🩺 [VET_BOT] Consultando historial de consultas...');
        const { data: consultations, error: consultationsError } = await supabaseAdmin
            .from('consultations')
            .select(`
                id,
                created_at,
                summary,
                recommendations,
                pet_id,
                pets (name)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (consultationsError) {
            console.warn('⚠️ [VET_BOT] Error fetching consultations:', consultationsError);
            // No fallamos por esto, solo una advertencia
        }

        // 7. Formatear respuesta
        console.log('🎁 [VET_BOT] Formateando payload final...');
        const now = new Date();

        const userContext: UserContext = {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`.trim(),
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone,
            membershipStatus: user.membership_status
        };

        const petsContext: PetContext[] = (pets || []).map(pet => {
            const waitingEnd = pet.waiting_period_end ? new Date(pet.waiting_period_end) : null;
            const isWaitingActive = waitingEnd ? now < waitingEnd : false;

            return {
                id: pet.id,
                name: pet.name,
                type: pet.breed?.toLowerCase().includes('gato') ? 'Gato' : 'Perro',
                breed: pet.breed || 'Mestizo',
                size: pet.breed_size,
                age: pet.age,
                status: pet.status,
                waitingPeriod: {
                    start: pet.waiting_period_start,
                    end: pet.waiting_period_end,
                    isActive: isWaitingActive
                }
            };
        });

        const consultationHistory: ConsultationHistory[] = (consultations || []).map(cons => ({
            id: cons.id,
            date: cons.created_at,
            summary: cons.summary,
            recommendations: cons.recommendations,
            petName: Array.isArray(cons.pets) ? cons.pets[0]?.name : (cons.pets as any)?.name || null
        }));

        // Calcular tiempo restante de sesión si aplica
        let sessionInfo = undefined;
        if (sessionExpiresAt && identifiedVia === 'session_token') {
            const expiresDate = new Date(sessionExpiresAt);
            const minutesRemaining = Math.max(0, Math.floor((expiresDate.getTime() - now.getTime()) / 60000));
            sessionInfo = {
                validUntil: sessionExpiresAt,
                minutesRemaining
            };
        }

        const responsePayload: VetBotContextResponse = {
            success: true,
            user: userContext,
            pets: petsContext,
            consultationHistory,
            session: sessionInfo,
            identifiedVia,
            timestamp: now.toISOString()
        };

        console.log(`🚀 [VET_BOT] Contexto entregado para: ${user.email}. Pets: ${petsContext.length}, Method: ${identifiedVia}`);

        return NextResponse.json(responsePayload, { headers: corsHeaders() });

    } catch (error: any) {
        console.error('❌ [VET_BOT] Server Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error', details: error.message },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// =============================================
// Helpers
// =============================================

interface SessionValidationResult {
    valid: boolean;
    memberstackId?: string;
    email?: string;
    expiresAt?: string;
}

async function validateSessionToken(token: string): Promise<SessionValidationResult> {
    try {
        console.log('🧪 [VET_BOT] Validating session token via RPC...');
        // Usar RPC para validar y actualizar en una sola operación
        const { data, error } = await supabaseAdmin
            .rpc('get_valid_vet_session', { p_token: token });

        if (error) {
            console.error('❌ [VET_BOT] RPC Error:', error);
            return { valid: false };
        }

        if (!data || data.length === 0) {
            console.warn(`⚠️ [VET_BOT] No data returned from RPC for token (Length: ${token?.length})`);

            // DIAGNÓSTICO: Buscar el token sin filtros para ver qué está pasando
            const { data: diagnostic, error: diagError } = await supabaseAdmin
                .from('vet_bot_sessions')
                .select('id, is_active, expires_at, created_at, token')
                .eq('token', token)
                .maybeSingle();

            if (diagError) {
                console.error('❌ [VET_BOT] Diagnostic query error:', diagError);
            } else if (diagnostic) {
                const now = new Date();
                const expires = new Date(diagnostic.expires_at);
                console.log('🔍 [VET_BOT] Diagnostic result:', {
                    exists: true,
                    is_active: diagnostic.is_active,
                    expired: expires < now,
                    created_at: diagnostic.created_at,
                    expires_at: diagnostic.expires_at,
                    now: now.toISOString()
                });
            } else {
                console.log(`🔍 [VET_BOT] Diagnostic result: Token DOES NOT EXIST in database. 
                    - Received length: ${token?.length}
                    - Starts with: ${token?.substring(0, 4)}...
                    - Ends with: ...${token?.substring(token.length - 4)}
                `);

                // Buscar tokens recientes para ver si hay alguno parecido
                const { data: recent } = await supabaseAdmin
                    .from('vet_bot_sessions')
                    .select('token, email, created_at')
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (recent && recent.length > 0) {
                    console.log('📄 [VET_BOT] Last 3 tokens in DB:');
                    recent.forEach(r => {
                        console.log(`  - ${r.token.substring(0, 4)}...${r.token.substring(60)} (Created: ${r.created_at}, User: ${r.email})`);
                    });
                }
            }

            return { valid: false };
        }

        const session = data[0];

        return {
            valid: session.is_valid,
            memberstackId: session.memberstack_id,
            email: session.email,
            expiresAt: session.expires_at
        };

    } catch (error) {
        console.error('❌ [VET_BOT] Error validating session:', error);
        return { valid: false };
    }
}

// =============================================
// Helpers
// =============================================

function isValidEmail(email: string | null): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
