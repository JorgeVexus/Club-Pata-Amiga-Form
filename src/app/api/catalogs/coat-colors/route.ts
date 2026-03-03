/**
 * API Endpoint para obtener catálogo de colores de pelo
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const petType = searchParams.get('petType');

        let query = supabaseAdmin
            .from('catalog_coat_colors')
            .select('*')
            .eq('is_active', true);

        if (petType) {
            query = query.eq('pet_type', petType === 'perro' ? 'dog' : 'cat');
        }

        const { data, error } = await query
            .order('is_common', { ascending: false })
            .order('display_order', { ascending: true });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            data: data || []
        });
    } catch (error: any) {
        console.error('Error obteniendo colores de pelo:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Error al obtener catálogo de colores' 
            },
            { status: 500 }
        );
    }
}
