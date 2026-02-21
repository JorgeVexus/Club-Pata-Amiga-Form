import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, rfc, ine_front_url, ine_back_url } = body;

        if (!email || !rfc || !ine_front_url || !ine_back_url) {
            return NextResponse.json(
                { success: false, error: 'Faltan datos requeridos' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Buscar embajador por email y RFC para validar identidad
        const { data: ambassador, error: findError } = await supabase
            .from('ambassadors')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .eq('rfc', rfc.toUpperCase().trim())
            .single();

        if (findError || !ambassador) {
            return NextResponse.json(
                { success: false, error: 'No se encontró un embajador con esos datos' },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Actualizar documentos y limpiar bandera
        const { error: updateError } = await supabase
            .from('ambassadors')
            .update({
                ine_front_url,
                ine_back_url,
                needs_ine_reupload: false
            })
            .eq('id', ambassador.id);

        if (updateError) {
            console.error('Error updating ambassador recovery:', updateError);
            return NextResponse.json(
                { success: false, error: 'Error al actualizar los documentos' },
                { status: 500, headers: corsHeaders() }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Documentos actualizados correctamente'
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Ambassador re-upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
