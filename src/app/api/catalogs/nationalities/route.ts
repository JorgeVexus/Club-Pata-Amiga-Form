/**
 * API Endpoint para obtener catálogo de nacionalidades
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('catalog_nationalities')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true })
            .order('name_es', { ascending: true });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            data: data || []
        });
    } catch (error: any) {
        console.error('Error obteniendo nacionalidades:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Error al obtener catálogo de nacionalidades' 
            },
            { status: 500 }
        );
    }
}
