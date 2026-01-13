import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { CreateAmbassadorRequest, Ambassador } from '@/types/ambassador.types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Función para generar código de embajador único
function generateAmbassadorCode(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EMB-${year}-${random}`;
}

// Función para generar código de referido único
function generateReferralCode(firstName: string, paternalSurname: string): string {
    const year = new Date().getFullYear();
    const name = firstName.split(' ')[0].toUpperCase().slice(0, 5);
    const surname = paternalSurname.toUpperCase().slice(0, 3);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `PATA-${name}${surname}-${random}`;
}

// CORS headers
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// GET - Listar embajadores (para admin)
export async function GET(request: NextRequest) {
    try {
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
            query = query.or(`first_name.ilike.%${search}%,paternal_surname.ilike.%${search}%,email.ilike.%${search}%,referral_code.ilike.%${search}%`);
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

        // Verificar CURP único
        const { data: existingCurp } = await supabase
            .from('ambassadors')
            .select('id')
            .eq('curp', body.curp.toUpperCase())
            .single();

        if (existingCurp) {
            return NextResponse.json(
                { success: false, error: 'Este CURP ya está registrado' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Generar códigos únicos
        let ambassadorCode = generateAmbassadorCode();
        let referralCode = generateReferralCode(body.first_name, body.paternal_surname);

        // Asegurar que los códigos sean únicos
        let codeExists = true;
        while (codeExists) {
            const { data: existing } = await supabase
                .from('ambassadors')
                .select('id')
                .or(`ambassador_code.eq.${ambassadorCode},referral_code.eq.${referralCode}`)
                .single();

            if (!existing) {
                codeExists = false;
            } else {
                ambassadorCode = generateAmbassadorCode();
                referralCode = generateReferralCode(body.first_name, body.paternal_surname);
            }
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
                maternal_surname: body.maternal_surname?.trim() || null,
                gender: body.gender || null,
                birth_date: body.birth_date,
                curp: body.curp.toUpperCase(),
                ine_front_url: body.ine_front_url || null,
                ine_back_url: body.ine_back_url || null,
                postal_code: body.postal_code?.trim() || null,
                state: body.state?.trim() || null,
                city: body.city?.trim() || null,
                neighborhood: body.neighborhood?.trim() || null,
                address: body.address?.trim() || null,
                email: body.email.toLowerCase().trim(),
                phone: body.phone?.trim() || null,
                password_hash: passwordHash,
                instagram: body.instagram?.trim() || null,
                facebook: body.facebook?.trim() || null,
                tiktok: body.tiktok?.trim() || null,
                other_social: body.other_social?.trim() || null,
                motivation: body.motivation?.trim() || null,
                rfc: body.rfc?.toUpperCase() || null,
                payment_method: body.payment_method || 'pending',
                bank_name: body.bank_name?.trim() || null,
                card_last_digits: body.card_last_digits?.trim() || null,
                clabe: body.clabe?.trim() || null,
                referral_code: referralCode,
                status: 'pending',
                commission_percentage: commissionPercentage,
                linked_memberstack_id: body.linked_memberstack_id || null
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating ambassador:', error);
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
            message: 'Solicitud enviada correctamente',
            data: {
                id: ambassador.id,
                ambassador_code: ambassador.ambassador_code,
                referral_code: ambassador.referral_code
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
