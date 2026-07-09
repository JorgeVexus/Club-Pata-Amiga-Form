import { NextRequest, NextResponse } from 'next/server';

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

export async function POST() {
    return NextResponse.json(
        { success: false, error: 'Funcionalidad removida: la carga de INE para embajadores ya no está disponible.' },
        { status: 410, headers: corsHeaders() }
    );
}
