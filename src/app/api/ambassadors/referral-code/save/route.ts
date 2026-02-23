/**
 * 🎯 API para guardar el código de referido elegido por el embajador
 * POST: /api/ambassadors/referral-code/save
 * Body: { ambassadorId: "uuid", code: "XXX", confirmed: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MEMBERSTACK_SECRET_KEY = process.env.MEMBERSTACK_SECRET_KEY;
const MEMBERSTACK_API_URL = 'https://admin.memberstack.com/members';

// ============================================
// BLACKLIST (debe coincidir con validate/route.ts)
// ============================================
const BLACKLISTED_CODES = new Set([
    'OFICIAL', 'ADMIN', 'SOPORTE', 'SUPPORT', 'STAFF', 'TEAM', 'OWNER', 'CEO',
    'GERENTE', 'MANAGER', 'FUNDADOR', 'FOUNDER', 'DIRECTOR', 'AYUDA', 'HELP', 'HQ',
    'MARCA', 'BRAND', 'SYSTEM', 'SISTEMA',
    'DESCUENTO', 'DISCOUNT', 'GRATIS', 'FREE', 'PROMO', 'PROMOCION', 'SALE',
    'CUPON', 'COUPON', 'OFERTA', 'OFFER', 'BONO', 'BONUS', 'REGALO', 'GIFT',
    'GARANTIA', 'WARRANTY', 'CASH', 'DINERO', 'MONEY', 'REEMBOLSO', 'REFUND',
    'DEAL', 'SAVE', 'AHORRO',
    'TEST', 'PRUEBA', 'HACK', 'FAKE', 'SCAM', 'FRAUDE', 'FRAUD', 'SEGuro', 'INSURANCE',
    'PATA', 'PATITA', 'PATITAS', 'PATAMIGA', 'CLUBPATA', 'CLUB', 'VIP',
    'PATAVIP', 'PATASTORE', 'PATAPROMO', 'PATAGLOBAL', 'PATAADMIN', 'PATASTAFF',
    'PATAHELP', 'PATATEAM', 'PATAHQ', 'PATAMARCA', 'PATASHOP', 'PATACLUB',
    'PATAPATITA', 'PATADRAPATI', 'PATAPRINCIPAL', 'PATASALE', 'PATADEAL',
    'PATACUPON', 'PATAXMAS', 'PATASPRING', 'PATA2024', 'PATA2025', 'PATA2026',
    'PATA2027', 'PATAEVENTO', 'PATANEWYEAR', 'PATACEO', 'PATADIRECTOR',
    'PATAGERENTE', 'PATAAYUDA', 'PATAFUNDADOR', 'PATAEMBAJADOR',
    'EMBAJADOR', 'EMBAJADORES', 'AMBASSADOR', 'AMBASSADORS'
]);

const CONFUSING_CHARS = new Set(['O', 'I', 'L']);

// ============================================
// UTILIDADES
// ============================================

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

function normalizeCode(code: string): string {
    return code.toUpperCase().trim().replace(/\s/g, '');
}

function isValidFormat(code: string): boolean {
    if (code.length < 2 || code.length > 8) return false;
    if (!/^[A-Z0-9]+$/.test(code)) return false;
    if ([...code].some(char => CONFUSING_CHARS.has(char))) return false;
    return true;
}

function isBlacklisted(code: string): boolean {
    return BLACKLISTED_CODES.has(code);
}

async function isCodeInUse(code: string, excludeAmbassadorId?: string): Promise<boolean> {
    let query = supabase
        .from('ambassadors')
        .select('id')
        .eq('referral_code', code);
    
    if (excludeAmbassadorId) {
        query = query.neq('id', excludeAmbassadorId);
    }
    
    const { data } = await query.single();
    return !!data;
}

async function updateMemberstackReferralCode(memberId: string, referralCode: string): Promise<boolean> {
    if (!MEMBERSTACK_SECRET_KEY) {
        console.warn('⚠️ MEMBERSTACK_SECRET_KEY no configurada');
        return false;
    }

    try {
        const response = await fetch(`${MEMBERSTACK_API_URL}/${memberId}`, {
            method: 'PATCH',
            headers: {
                'X-API-KEY': MEMBERSTACK_SECRET_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customFields: {
                    'ambassador-referral-code': referralCode
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error actualizando Memberstack:', response.status, errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Error en updateMemberstackReferralCode:', error);
        return false;
    }
}

// ============================================
// HANDLERS
// ============================================

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// POST /api/ambassadors/referral-code/save
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ambassadorId, code: rawCode, confirmed } = body;

        // Validaciones básicas
        if (!ambassadorId) {
            return NextResponse.json(
                { success: false, error: 'Se requiere el ID del embajador' },
                { status: 400, headers: corsHeaders() }
            );
        }

        if (!rawCode) {
            return NextResponse.json(
                { success: false, error: 'Se requiere el código' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Verificar confirmación
        if (!confirmed) {
            return NextResponse.json(
                { success: false, error: 'Debes confirmar que estás seguro de elegir este código' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const code = normalizeCode(rawCode);

        // Validar formato
        if (!isValidFormat(code)) {
            return NextResponse.json(
                { success: false, error: 'El código no cumple con los requisitos de formato' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Verificar blacklist
        if (isBlacklisted(code)) {
            return NextResponse.json(
                { success: false, error: 'Este código está reservado por el sistema' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Verificar si el embajador existe y está aprobado
        const { data: ambassador, error: ambassadorError } = await supabase
            .from('ambassadors')
            .select('*')
            .eq('id', ambassadorId)
            .single();

        if (ambassadorError || !ambassador) {
            return NextResponse.json(
                { success: false, error: 'Embajador no encontrado' },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Solo embajadores aprobados pueden elegir código
        if (ambassador.status !== 'approved') {
            return NextResponse.json(
                { success: false, error: 'Solo embajadores aprobados pueden elegir su código' },
                { status: 403, headers: corsHeaders() }
            );
        }

        // Verificar si ya tiene un código activo (no permitir cambios)
        if (ambassador.referral_code && ambassador.referral_code_status === 'active') {
            return NextResponse.json(
                { success: false, error: 'No puedes cambiar tu código una vez establecido' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Verificar que el código no esté en uso por otro embajador
        const codeInUse = await isCodeInUse(code, ambassadorId);
        if (codeInUse) {
            return NextResponse.json(
                { success: false, error: 'Este código ya está en uso por otro embajador' },
                { status: 409, headers: corsHeaders() }
            );
        }

        // Guardar código histórico si tenía uno temporal
        if (ambassador.referral_code) {
            await supabase.from('ambassador_referral_codes_history').insert({
                code: ambassador.referral_code,
                ambassador_id: ambassador.id,
                used_at: new Date().toISOString()
            });
        }

        // Actualizar el código del embajador
        const { data: updatedAmbassador, error: updateError } = await supabase
            .from('ambassadors')
            .update({
                referral_code: code,
                referral_code_status: 'active',
                referral_code_selected_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', ambassadorId)
            .select()
            .single();

        if (updateError) {
            console.error('Error guardando código:', updateError);
            return NextResponse.json(
                { success: false, error: 'Error al guardar el código' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Actualizar en Memberstack si está vinculado
        if (ambassador.linked_memberstack_id) {
            await updateMemberstackReferralCode(ambassador.linked_memberstack_id, code);
        }

        // Enviar notificación de confirmación
        try {
            const { notifyAmbassadorReferralCodeSet } = await import('@/app/actions/ambassador-comm.actions');
            await notifyAmbassadorReferralCodeSet({
                userId: ambassador.linked_memberstack_id || ambassador.id,
                email: ambassador.email,
                name: ambassador.first_name,
                referralCode: code
            });
        } catch (emailError) {
            console.warn('⚠️ No se pudo enviar notificación de confirmación:', emailError);
        }

        return NextResponse.json({
            success: true,
            message: 'Código guardado correctamente',
            data: {
                referral_code: code,
                status: 'active',
                ambassador: {
                    id: updatedAmbassador.id,
                    first_name: updatedAmbassador.first_name,
                    email: updatedAmbassador.email
                }
            }
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Error guardando código:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
