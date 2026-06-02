import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Definición de límites por año
const BENEFIT_LIMITS: Record<string, number> = {
    'medical_emergency': 3000,
    'annual_vaccination': 300,
    'death': 2000
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const petId = searchParams.get('petId');

        if (!petId) {
            return NextResponse.json({ error: 'petId es requerido' }, { status: 400, headers: corsHeaders });
        }

        const currentYear = new Date().getFullYear();
        const startOfYear = `${currentYear}-01-01T00:00:00Z`;

        // Obtener todas las solicitudes de este pet en el año actual que no hayan sido rechazadas ni canceladas
        const { data: requests, error } = await supabaseAdmin
            .from('solidarity_requests')
            .select('benefit_type, requested_amount, approved_amount, status')
            .eq('pet_id', petId)
            .neq('status', 'rejected')
            .neq('status', 'cancelled')
            .gte('created_at', startOfYear);

        if (error) throw error;

        // Inicializar contadores
        const usedBalances: Record<string, number> = {
            'medical_emergency': 0,
            'annual_vaccination': 0,
            'death': 0
        };

        // Calcular sumas
        requests?.forEach(req => {
            const type = req.benefit_type;
            if (usedBalances.hasOwnProperty(type)) {
                // Usamos el monto aprobado si existe, si no el solicitado (para bloquear el saldo mientras se revisa)
                const amount = req.approved_amount || req.requested_amount || 0;
                usedBalances[type] += Number(amount);
            }
        });

        // Construir respuesta con límites y disponibles
        const balances: Record<string, any> = {};
        Object.keys(BENEFIT_LIMITS).forEach(type => {
            const limit = BENEFIT_LIMITS[type];
            const used = usedBalances[type];
            balances[type] = {
                used,
                limit,
                available: Math.max(0, limit - used)
            };
        });

        return NextResponse.json({
            success: true,
            petId,
            year: currentYear,
            balances
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error en /api/solidarity/balance:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
