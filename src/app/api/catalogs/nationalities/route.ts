/**
 * API Endpoint para obtener catálogo de nacionalidades
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase';

// Usar el cliente administrativo centralizado
const supabaseAdminClient = supabaseAdmin;

export async function GET() {
    // Verificar configuración
    if (!isSupabaseAdminConfigured() || !supabaseAdminClient) {
        console.error('❌ Supabase Admin not configured in /api/catalogs/nationalities');
        return NextResponse.json(
            { success: false, error: 'Servicio de base de datos no disponible' },
            { status: 500 }
        );
    }

    try {
        const { data, error } = await supabaseAdminClient
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
