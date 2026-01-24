/**
 * API Route: /api/user/appeal-history
 * Obtiene el historial de apelaciones de un usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get('memberId');
        const petId = searchParams.get('petId');

        if (!memberId) {
            return NextResponse.json({ error: 'memberId es requerido' }, { status: 400 });
        }

        // Construir query
        let query = supabaseAdmin
            .from('appeal_logs')
            .select('id, type, message, created_at, pet_id, admin_id')
            .eq('user_id', memberId)
            .order('created_at', { ascending: false })
            .limit(20);

        // Si se especifica petId, filtrar por mascota
        if (petId) {
            query = query.eq('pet_id', petId);
        }

        const { data: logs, error } = await query;

        if (error) throw error;

        // Formatear los logs para el cliente
        const formattedLogs = (logs || []).map(log => ({
            id: log.id,
            type: log.type,
            message: log.message,
            date: log.created_at,
            petId: log.pet_id,
            isFromAdmin: log.type.startsWith('admin_') || log.admin_id,
            icon: getLogIcon(log.type)
        }));

        return NextResponse.json({
            success: true,
            logs: formattedLogs
        });

    } catch (error: any) {
        console.error('Error en /api/user/appeal-history:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function getLogIcon(type: string): string {
    switch (type) {
        case 'user_appeal':
            return '📝';
        case 'admin_approve':
            return '✅';
        case 'admin_reject':
            return '❌';
        case 'admin_request':
            return '📩';
        case 'user_response':
            return '💬';
        default:
            return '📋';
    }
}
