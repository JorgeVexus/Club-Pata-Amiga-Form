/**
 * API Endpoint para obtener catálogos de colores (pelo, nariz, ojos)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers para Webflow
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const petType = searchParams.get('petType');
        const category = searchParams.get('category') || 'coat'; // 'coat', 'nose', 'eye'

        // Validar categoría
        const validCategories = ['coat', 'nose', 'eye'];
        const targetCategory = validCategories.includes(category) ? category : 'coat';
        const tableName = `catalog_${targetCategory}_colors`;

        console.log(`📡 GET /api/catalogs/coat-colors - Categoría: ${targetCategory}, Tipo: ${petType || 'todos'}`);

        let query = supabaseAdmin
            .from(tableName)
            .select('*')
            .eq('is_active', true);

        if (petType) {
            query = query.eq('pet_type', petType === 'perro' ? 'dog' : 'cat');
        }

        // Ordenar: comunes primero si aplica, luego por display_order
        if (targetCategory === 'coat') {
            query = query.order('is_common', { ascending: false });
        }
        
        const { data, error } = await query
            .order('display_order', { ascending: true })
            .order('name', { ascending: true });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            data: data || []
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error(`Error obteniendo colores (${searchParams.get('category')}):`, error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Error al obtener catálogo de colores' 
            },
            { status: 500, headers: corsHeaders }
        );
    }
}
