/**
 * API Route: /api/admin/metrics
 * Obtiene métricas generales para el dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

export async function GET(request: NextRequest) {
    try {
        // Obtener todos los miembros (limitado a la paginación actual del servicio)
        // TODO: Mejorar servicio para obtener count total real desde la API de Memberstack si hay paginación
        const result = await memberstackAdmin.listMembers();

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Error fetching members');
        }

        const members = result.data;

        // Calcular métricas reales
        const totalMembers = members.filter(m => m.customFields['approval-status'] === 'approved').length;

        // Métricas placeholder para features futuras
        const totalAmbassadors = 0; // members.filter(m => m.customFields['roles']?.includes('ambassador')).length;
        const activeWellnessCenters = 0; // members.filter(m => m.customFields['primary-role'] === 'wellness-center').length;

        // Simulación de Fondo Solidario (ej. $50 de cada membresía aprobada se va al fondo)
        // Esto es solo un ejemplo, ajustar según lógica de negocio real
        const solidarityFund = totalMembers * 50;

        return NextResponse.json({
            success: true,
            metrics: {
                totalMembers,
                totalAmbassadors,
                activeWellnessCenters,
                totalRefunds: solidarityFund, // Reusando este campo para "Fondo acumulado" por ahora
            }
        });

    } catch (error: any) {
        console.error('Error calculating metrics:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
