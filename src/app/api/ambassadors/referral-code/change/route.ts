/**
 * 🔄 API para cambiar el código de referido (una sola vez)
 * POST: /api/ambassadors/referral-code/change
 * Body: { ambassadorId: "uuid", newCode: "XXX", confirmed: true }
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

// GET - Verificar si el embajador puede cambiar su código
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const ambassadorId = searchParams.get('ambassadorId');

        if (!ambassadorId) {
            return NextResponse.json(
                { success: false, error: 'Se requiere el ID del embajador' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const { data: ambassador, error } = await supabase
            .from('ambassadors')
            .select('id, referral_code, can_change_referral_code, referral_code_changed_at, status')
            .eq('id', ambassadorId)
            .single();

        if (error || !ambassador) {
            return NextResponse.json(
                { success: false, error: 'Embajador no encontrado' },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Verificar si puede cambiar
        const canChange = ambassador.can_change_referral_code === true && 
                         ambassador.referral_code_changed_at === null &&
                         ambassador.status === 'approved';

        return NextResponse.json({
            success: true,
            data: {
                canChange,
                currentCode: ambassador.referral_code,
                reason: canChange ? null : getCannotChangeReason(ambassador)
            }
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Error verificando cambio de código:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

function getCannotChangeReason(ambassador: { can_change_referral_code: boolean | null; referral_code_changed_at: string | null; status: string }): string {
    if (ambassador.status !== 'approved') {
        return 'Tu cuenta debe estar aprobada para cambiar el código';
    }
    if (ambassador.referral_code_changed_at) {
        return 'Ya has cambiado tu código anteriormente';
    }
    if (!ambassador.can_change_referral_code) {
        return 'No tienes permitido cambiar tu código';
    }
    return 'No puedes cambiar tu código en este momento';
}

// POST - Cambiar el código (una sola vez)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ambassadorId, newCode: rawNewCode, confirmed } = body;

        // Validaciones básicas
        if (!ambassadorId) {
            return NextResponse.json(
                { success: false, error: 'Se requiere el ID del embajador' },
                { status: 400, headers: corsHeaders() }
            );
        }

        if (!rawNewCode) {
            return NextResponse.json(
                { success: false, error: 'Se requiere el nuevo código' },
                { status: 400, headers: corsHeaders() }
            );
        }

        if (!confirmed) {
            return NextResponse.json(
                { success: false, error: 'Debes confirmar que estás seguro de cambiar el código' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const newCode = normalizeCode(rawNewCode);

        // Validar formato
        if (!isValidFormat(newCode)) {
            return NextResponse.json(
                { success: false, error: 'El código no cumple con los requisitos de formato' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Verificar blacklist
        if (isBlacklisted(newCode)) {
            return NextResponse.json(
                { success: false, error: 'Este código está reservado por el sistema' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Obtener embajador
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

        // Verificar que está aprobado
        if (ambassador.status !== 'approved') {
            return NextResponse.json(
                { success: false, error: 'Solo embajadores aprobados pueden cambiar su código' },
                { status: 403, headers: corsHeaders() }
            );
        }

        // Verificar que tiene permiso para cambiar
        if (!ambassador.can_change_referral_code) {
            return NextResponse.json(
                { success: false, error: 'No tienes permitido cambiar tu código' },
                { status: 403, headers: corsHeaders() }
            );
        }

        // Verificar que no ha cambiado antes
        if (ambassador.referral_code_changed_at) {
            return NextResponse.json(
                { success: false, error: 'Ya has cambiado tu código anteriormente. No puedes cambiarlo más veces.' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Verificar que el nuevo código es diferente al actual
        if (ambassador.referral_code === newCode) {
            return NextResponse.json(
                { success: false, error: 'El nuevo código debe ser diferente al código actual' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Verificar que el código no esté en uso por otro embajador
        const codeInUse = await isCodeInUse(newCode, ambassadorId);
        if (codeInUse) {
            return NextResponse.json(
                { success: false, error: 'Este código ya está en uso por otro embajador' },
                { status: 409, headers: corsHeaders() }
            );
        }

        // Guardar código anterior en historial
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
                previous_referral_code: ambassador.referral_code,
                referral_code: newCode,
                referral_code_changed_at: new Date().toISOString(),
                can_change_referral_code: false, // Ya no puede cambiar más
                updated_at: new Date().toISOString()
            })
            .eq('id', ambassadorId)
            .select()
            .single();

        if (updateError) {
            console.error('Error cambiando código:', updateError);
            return NextResponse.json(
                { success: false, error: 'Error al cambiar el código' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Actualizar en Memberstack si está vinculado
        if (ambassador.linked_memberstack_id) {
            await updateMemberstackReferralCode(ambassador.linked_memberstack_id, newCode);
        }

        // Enviar notificación de confirmación
        try {
            const { notifyAmbassadorReferralCodeChanged } = await import('@/app/actions/ambassador-comm.actions');
            await notifyAmbassadorReferralCodeChanged({
                userId: ambassador.linked_memberstack_id || ambassador.id,
                email: ambassador.email,
                name: ambassador.first_name,
                oldCode: ambassador.referral_code || 'N/A',
                newCode: newCode
            });
        } catch (emailError) {
            console.warn('⚠️ No se pudo enviar notificación de cambio:', emailError);
        }

        return NextResponse.json({
            success: true,
            message: 'Código cambiado correctamente. Recuerda: no puedes cambiarlo más veces.',
            data: {
                old_code: ambassador.referral_code,
                new_code: newCode,
                changed_at: updatedAmbassador.referral_code_changed_at
            }
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Error cambiando código:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
