import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { CreateAmbassadorRequest, Ambassador } from '@/types/ambassador.types';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MEMBERSTACK_API_URL = 'https://admin.memberstack.com/members';

function getMemberstackAdminKey(): string {
    return process.env.MEMBERSTACK_ADMIN_SECRET_KEY || process.env.MEMBERSTACK_SECRET_KEY || '';
}

// Función para generar código de embajador único
function generateAmbassadorCode(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EMB-${year}-${random}`;
}

// Función para generar código temporal (placeholder hasta que el embajador elija)
function generateTempReferralCode(): string {
    const timestamp = Date.now().toString(36).substring(0, 4).toUpperCase();
    return `TMP${timestamp}`;
}

// CORS headers
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

async function createMemberstackAmbassador(
    body: CreateAmbassadorRequest,
    ambassadorCode: string,
    mappedGender: string | null
): Promise<{ success: true; memberId: string } | { success: false; error: string; status: number }> {
    const apiKey = getMemberstackAdminKey();

    if (!apiKey) {
        return {
            success: false,
            error: 'Memberstack no esta configurado en el servidor',
            status: 500
        };
    }

    const response = await fetch(MEMBERSTACK_API_URL, {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: body.email.toLowerCase().trim(),
            password: body.password,
            customFields: {
                'first-name': body.first_name.trim(),
                'paternal-last-name': body.paternal_surname.trim(),
                'maternal-last-name': body.maternal_surname?.trim() || '',
                'gender': mappedGender || '',
                'curp': body.curp?.toUpperCase() || '',
                'phone': body.phone?.trim() || '',
                'role': 'ambassador',
                'is-ambassador': 'true',
                'ambassador-status': 'pending',
                'ambassador-code': ambassadorCode,
                'approval-status': 'pending',
                'registration-source': 'Embajador'
            }
        })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        return {
            success: false,
            error: data?.message || data?.error || 'No se pudo crear el usuario en Memberstack',
            status: response.status
        };
    }

    const memberId = data?.data?.id || data?.id;
    if (!memberId) {
        return {
            success: false,
            error: 'Memberstack creo el usuario, pero no devolvio el ID',
            status: 502
        };
    }

    return { success: true, memberId };
}

async function updateMemberstackAmbassador(
    memberId: string,
    body: CreateAmbassadorRequest,
    ambassadorCode: string,
    mappedGender: string | null
) {
    const apiKey = getMemberstackAdminKey();
    if (!apiKey) return;

    const response = await fetch(`${MEMBERSTACK_API_URL}/${memberId}`, {
        method: 'PATCH',
        headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            customFields: {
                'first-name': body.first_name.trim(),
                'paternal-last-name': body.paternal_surname.trim(),
                'maternal-last-name': body.maternal_surname?.trim() || '',
                'gender': mappedGender || '',
                'curp': body.curp?.toUpperCase() || '',
                'phone': body.phone?.trim() || '',
                'role': 'ambassador',
                'is-ambassador': 'true',
                'ambassador-status': 'pending',
                'ambassador-code': ambassadorCode,
                'approval-status': 'pending',
                'registration-source': 'Embajador'
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.warn(`No se pudo actualizar Memberstack para ${memberId}: ${errorText}`);
    }
}

async function deleteMemberstackMember(memberId: string) {
    const apiKey = getMemberstackAdminKey();
    if (!apiKey) return;

    try {
        const response = await fetch(`${MEMBERSTACK_API_URL}/${memberId}`, {
            method: 'DELETE',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`No se pudo revertir el miembro de Memberstack ${memberId}: ${errorText}`);
        }
    } catch (error) {
        console.warn(`Error revirtiendo el miembro de Memberstack ${memberId}:`, error);
    }
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// GET - Listar embajadores (para admin)
export async function GET(request: NextRequest) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search');

        let query = supabase
            .from('ambassadors')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Filtrar por status
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Búsqueda
        if (search) {
            query = query.or(`first_name.ilike.%${search}%,paternal_surname.ilike.%${search}%,maternal_surname.ilike.%${search}%,email.ilike.%${search}%,referral_code.ilike.%${search}%`);
        }

        // Paginación
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching ambassadors:', error);
            return NextResponse.json(
                { success: false, error: 'Error al obtener embajadores' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Obtener conteo de referidos para cada embajador
        const ambassadorsWithStats = await Promise.all(
            (data || []).map(async (ambassador) => {
                const { count: referralsCount } = await supabase
                    .from('referrals')
                    .select('*', { count: 'exact', head: true })
                    .eq('ambassador_id', ambassador.id);

                return {
                    ...ambassador,
                    referrals_count: referralsCount || 0
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: ambassadorsWithStats,
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Ambassadors GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// POST - Crear nuevo embajador
export async function POST(request: NextRequest) {
    try {
        const body: CreateAmbassadorRequest = await request.json();

        // Función para convertir strings vacíos a null (evita errores de Postgres con fechas)
        const sanitize = (value: string | undefined | null): string | null => {
            if (value === undefined || value === null || value === '' || value.trim() === '') {
                return null;
            }
            return value.trim();
        };

        // Mapear género de español a valores de la DB
        const mapGender = (gender: string | undefined | null): string | null => {
            if (!gender) return null;
            const genderLower = gender.toLowerCase().trim();
            const genderMap: Record<string, string> = {
                'male': 'male',
                'female': 'female',
                'not_specified': 'not_specified',
                'hombre': 'male',
                'mujer': 'female',
                'masculino': 'male',
                'femenino': 'female',
                'no especificado': 'not_specified',
                'm': 'male',
                'f': 'female'
            };
            return genderMap[genderLower] || null;
        };

        // Validaciones básicas
        const requiredFields = ['first_name', 'paternal_surname', 'email', 'password'];
        const missingFields = requiredFields.filter(field => !body[field as keyof CreateAmbassadorRequest]);

        if (missingFields.length > 0) {
            return NextResponse.json(
                { success: false, error: `Faltan campos obligatorios: ${missingFields.join(', ')}` },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Verificar email único
        const { data: existingEmail } = await supabase
            .from('ambassadors')
            .select('id')
            .eq('email', body.email.toLowerCase())
            .single();

        if (existingEmail) {
            return NextResponse.json(
                { success: false, error: 'Este correo ya está registrado' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Nota: el CURP ya no bloquea el registro si está duplicado (advertencia
        // informativa manejada en el frontend); solo se valida su unicidad como email.

        // Generar código de embajador único (sistema interno)
        let ambassadorCode = generateAmbassadorCode();
        let codeExists = true;
        while (codeExists) {
            const { data: existing } = await supabase
                .from('ambassadors')
                .select('id')
                .eq('ambassador_code', ambassadorCode)
                .single();

            if (!existing) {
                codeExists = false;
            } else {
                ambassadorCode = generateAmbassadorCode();
            }
        }

        // El código de referido se establecerá después de la aprobación
        // Por ahora usamos null para indicar que está pendiente
        const referralCode = null;
        const mappedGender = mapGender(body.gender);
        let linkedMemberstackId = sanitize(body.linked_memberstack_id);

        if (linkedMemberstackId) {
            await updateMemberstackAmbassador(linkedMemberstackId, body, ambassadorCode, mappedGender);
        } else {
            const memberstackResult = await createMemberstackAmbassador(body, ambassadorCode, mappedGender);

            if (!memberstackResult.success) {
                return NextResponse.json(
                    { success: false, error: memberstackResult.error },
                    { status: memberstackResult.status, headers: corsHeaders() }
                );
            }

            linkedMemberstackId = memberstackResult.memberId;
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(body.password, 10);

        // Obtener comisión por defecto de la configuración
        const { data: configData } = await supabase
            .from('ambassador_config')
            .select('value')
            .eq('key', 'default_commission_percentage')
            .single();

        const commissionPercentage = configData ? parseFloat(configData.value) : 10;

        // Crear embajador
        const { data: ambassador, error } = await supabase
            .from('ambassadors')
            .insert({
                ambassador_code: ambassadorCode,
                first_name: body.first_name.trim(),
                paternal_surname: body.paternal_surname.trim(),
                maternal_surname: sanitize(body.maternal_surname),
                gender: mappedGender,
                birth_date: sanitize(body.birth_date), // Convertir "" a null
                curp: body.curp ? body.curp.toUpperCase() : null, // Opcional para extranjeros
                ine_front_url: sanitize(body.ine_front_url),
                ine_back_url: sanitize(body.ine_back_url),
                postal_code: sanitize(body.postal_code),
                state: sanitize(body.state),
                city: sanitize(body.city),
                neighborhood: sanitize(body.neighborhood),
                address: sanitize(body.address),
                email: body.email.toLowerCase().trim(),
                phone: sanitize(body.phone),
                password_hash: passwordHash,
                instagram: sanitize(body.instagram),
                facebook: sanitize(body.facebook),
                tiktok: sanitize(body.tiktok),
                other_social: sanitize(body.other_social),
                motivation: sanitize(body.motivation),
                rfc: body.rfc ? body.rfc.toUpperCase() : null,
                payment_method: body.payment_method || 'pending',
                bank_name: sanitize(body.bank_name),
                card_last_digits: sanitize(body.card_last_digits),
                clabe: sanitize(body.clabe),
                referral_code: referralCode,
                referral_code_status: 'pending',
                status: 'pending',
                commission_percentage: commissionPercentage,
                linked_memberstack_id: linkedMemberstackId,
                terms_accepted_at: sanitize(body.terms_accepted_at),
                terms_version: sanitize(body.terms_version) || '1.0',
                terms_acceptance: body.terms_acceptance || null
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating ambassador:', error);
            if (linkedMemberstackId && !body.linked_memberstack_id) {
                await deleteMemberstackMember(linkedMemberstackId);
            }

            return NextResponse.json(
                { success: false, error: 'Error al crear la solicitud' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Crear notificación para admin
        await supabase.from('notifications').insert({
            user_id: 'admin',
            type: 'new_ambassador',
            title: 'Nueva solicitud de embajador',
            message: `${body.first_name} ${body.paternal_surname} quiere ser embajador`,
            data: { ambassador_id: ambassador.id },
            is_read: false
        });

        return NextResponse.json({
            success: true,
            message: 'Solicitud enviada correctamente. Podrás elegir tu código de embajador después de que sea aprobada.',
            data: {
                id: ambassador.id,
                memberstack_id: linkedMemberstackId,
                ambassador_code: ambassador.ambassador_code,
                referral_code: null, // Se establecerá después de la aprobación
                next_step: 'wait_for_approval'
            }
        }, { status: 201, headers: corsHeaders() });

    } catch (error) {
        console.error('Ambassadors POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
