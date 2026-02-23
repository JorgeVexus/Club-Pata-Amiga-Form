/**
 * 🎯 API para validar códigos de referido de embajadores
 * GET: /api/ambassadors/referral-code/validate?code=XXX
 * POST: /api/ambassadors/referral-code/validate { code: "XXX" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// BLACKLIST DE CÓDIGOS (duplicado de DB para validación rápida)
// ============================================
const BLACKLISTED_CODES = new Set([
    // Administrativos
    'OFICIAL', 'ADMIN', 'SOPORTE', 'SUPPORT', 'STAFF', 'TEAM', 'OWNER', 'CEO',
    'GERENTE', 'MANAGER', 'FUNDADOR', 'FOUNDER', 'DIRECTOR', 'AYUDA', 'HELP', 'HQ',
    'MARCA', 'BRAND', 'SYSTEM', 'SISTEMA',
    // Promocionales
    'DESCUENTO', 'DISCOUNT', 'GRATIS', 'FREE', 'PROMO', 'PROMOCION', 'SALE',
    'CUPON', 'COUPON', 'OFERTA', 'OFFER', 'BONO', 'BONUS', 'REGALO', 'GIFT',
    'GARANTIA', 'WARRANTY', 'CASH', 'DINERO', 'MONEY', 'REEMBOLSO', 'REFUND',
    'DEAL', 'SAVE', 'AHORRO',
    // Seguridad
    'TEST', 'PRUEBA', 'HACK', 'FAKE', 'SCAM', 'FRAUDE', 'FRAUD', 'SEGuro', 'INSURANCE',
    // Marca
    'PATA', 'PATITA', 'PATITAS', 'PATAMIGA', 'CLUBPATA', 'CLUB', 'VIP',
    'PATAVIP', 'PATASTORE', 'PATAPROMO', 'PATAGLOBAL', 'PATAADMIN', 'PATASTAFF',
    'PATAHELP', 'PATATEAM', 'PATAHQ', 'PATAMARCA', 'PATASHOP', 'PATACLUB',
    'PATAPATITA', 'PATADRAPATI', 'PATAPRINCIPAL', 'PATASALE', 'PATADEAL',
    'PATACUPON', 'PATAXMAS', 'PATASPRING', 'PATA2024', 'PATA2025', 'PATA2026',
    'PATA2027', 'PATAEVENTO', 'PATANEWYEAR', 'PATACEO', 'PATADIRECTOR',
    'PATAGERENTE', 'PATAAYUDA', 'PATAFUNDADOR', 'PATAEMBAJADOR',
    'EMBAJADOR', 'EMBAJADORES', 'AMBASSADOR', 'AMBASSADORS'
]);

// Letras confusas
const CONFUSING_CHARS = new Set(['O', 'I', 'L']);

// ============================================
// UTILIDADES
// ============================================

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

function normalizeCode(code: string): string {
    return code.toUpperCase().trim().replace(/\s/g, '');
}

function isValidFormat(code: string): { valid: boolean; error?: string } {
    // Verificar longitud
    if (code.length < 2) {
        return { valid: false, error: 'El código debe tener al menos 2 caracteres' };
    }
    if (code.length > 8) {
        return { valid: false, error: 'El código debe tener máximo 8 caracteres' };
    }

    // Verificar caracteres permitidos (A-Z, 0-9)
    if (!/^[A-Z0-9]+$/.test(code)) {
        return { valid: false, error: 'Solo se permiten letras (A-Z) y números (0-9)' };
    }

    // Verificar letras confusas
    const hasConfusingChars = [...code].some(char => CONFUSING_CHARS.has(char));
    if (hasConfusingChars) {
        return { valid: false, error: 'Evita usar O (cero), I (uno) o L para prevenir confusiones' };
    }

    return { valid: true };
}

function isBlacklisted(code: string): boolean {
    return BLACKLISTED_CODES.has(code);
}

async function isCodeInUse(code: string): Promise<boolean> {
    const { data } = await supabase
        .from('ambassadors')
        .select('id')
        .eq('referral_code', code)
        .single();
    
    return !!data;
}

function generateSuggestions(baseCode: string, count: number = 5): string[] {
    const suggestions: string[] = [];
    const validChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Sin O, I, L, 0, 1
    
    // Intentar agregar números al final
    let attempts = 0;
    while (suggestions.length < count && attempts < 50) {
        attempts++;
        const suffix = Math.floor(Math.random() * 99) + 1;
        const suggestion = `${baseCode}${suffix}`;
        
        if (suggestion.length <= 8 && !suggestions.includes(suggestion)) {
            suggestions.push(suggestion);
        }
    }
    
    // Si aún faltan, agregar prefijo P y número
    attempts = 0;
    while (suggestions.length < count && attempts < 50) {
        attempts++;
        const suffix = Math.floor(Math.random() * 9) + 1;
        const maxBaseLength = 6; // P + base + número = 8 máximo
        const truncatedBase = baseCode.slice(0, maxBaseLength);
        const suggestion = `P${truncatedBase}${suffix}`;
        
        if (suggestion.length <= 8 && !suggestions.includes(suggestion)) {
            suggestions.push(suggestion);
        }
    }
    
    // Si aún faltan, generar variaciones aleatorias
    attempts = 0;
    while (suggestions.length < count && attempts < 100) {
        attempts++;
        const randomSuffix = Array(2).fill(0).map(() => 
            validChars[Math.floor(Math.random() * validChars.length)]
        ).join('');
        
        const maxBaseLength = 6;
        const truncatedBase = baseCode.slice(0, maxBaseLength);
        const suggestion = `${truncatedBase}${randomSuffix}`;
        
        if (suggestion.length <= 8 && !suggestions.includes(suggestion)) {
            suggestions.push(suggestion);
        }
    }
    
    return suggestions.slice(0, count);
}

// ============================================
// HANDLERS
// ============================================

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// GET /api/ambassadors/referral-code/validate?code=XXX
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const rawCode = searchParams.get('code');
        
        if (!rawCode) {
            return NextResponse.json(
                { success: false, error: 'Se requiere el parámetro code' },
                { status: 400, headers: corsHeaders() }
            );
        }
        
        const code = normalizeCode(rawCode);
        
        // Validar formato
        const formatValidation = isValidFormat(code);
        if (!formatValidation.valid) {
            return NextResponse.json({
                success: true,
                data: {
                    code,
                    isAvailable: false,
                    isValid: false,
                    error: formatValidation.error,
                    suggestions: []
                }
            }, { headers: corsHeaders() });
        }
        
        // Verificar blacklist
        if (isBlacklisted(code)) {
            return NextResponse.json({
                success: true,
                data: {
                    code,
                    isAvailable: false,
                    isValid: false,
                    error: 'Este código no está disponible',
                    suggestions: generateSuggestions(code.replace(/[AEIOU]/g, ''), 3)
                }
            }, { headers: corsHeaders() });
        }
        
        // Verificar si está en uso
        const inUse = await isCodeInUse(code);
        if (inUse) {
            return NextResponse.json({
                success: true,
                data: {
                    code,
                    isAvailable: false,
                    isValid: false,
                    error: 'Este código ya está en uso',
                    suggestions: generateSuggestions(code, 5)
                }
            }, { headers: corsHeaders() });
        }
        
        // Código válido y disponible
        return NextResponse.json({
            success: true,
            data: {
                code,
                isAvailable: true,
                isValid: true,
                error: null,
                suggestions: []
            }
        }, { headers: corsHeaders() });
        
    } catch (error) {
        console.error('Error validando código:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// POST /api/ambassadors/referral-code/validate
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const rawCode = body.code;
        
        if (!rawCode) {
            return NextResponse.json(
                { success: false, error: 'Se requiere el campo code' },
                { status: 400, headers: corsHeaders() }
            );
        }
        
        const code = normalizeCode(rawCode);
        
        // Validar formato
        const formatValidation = isValidFormat(code);
        if (!formatValidation.valid) {
            return NextResponse.json({
                success: true,
                data: {
                    code,
                    isAvailable: false,
                    isValid: false,
                    error: formatValidation.error,
                    suggestions: []
                }
            }, { headers: corsHeaders() });
        }
        
        // Verificar blacklist
        if (isBlacklisted(code)) {
            return NextResponse.json({
                success: true,
                data: {
                    code,
                    isAvailable: false,
                    isValid: false,
                    error: 'Este código está reservado por el sistema',
                    reason: 'blacklisted',
                    suggestions: generateSuggestions(code.replace(/[AEIOU0-9]/g, ''), 5)
                }
            }, { headers: corsHeaders() });
        }
        
        // Verificar si está en uso
        const inUse = await isCodeInUse(code);
        if (inUse) {
            return NextResponse.json({
                success: true,
                data: {
                    code,
                    isAvailable: false,
                    isValid: false,
                    error: 'Este código ya está en uso',
                    reason: 'taken',
                    suggestions: generateSuggestions(code, 5)
                }
            }, { headers: corsHeaders() });
        }
        
        // Código válido y disponible
        return NextResponse.json({
            success: true,
            data: {
                code,
                isAvailable: true,
                isValid: true,
                error: null,
                suggestions: []
            }
        }, { headers: corsHeaders() });
        
    } catch (error) {
        console.error('Error validando código:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
