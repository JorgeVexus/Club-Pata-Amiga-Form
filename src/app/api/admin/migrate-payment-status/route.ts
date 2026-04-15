import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

/**
 * POST /api/admin/migrate-payment-status
 *
 * Migra miembros que tienen payment-status: 'completed' pero no tienen
 * approval-status definido. Les establece approval-status: 'pending'
 * para que aparezcan en el dashboard de admin.
 *
 * Ejecutar: curl -X POST http://localhost:3000/api/admin/migrate-payment-status
 * o hacer una petición POST desde el navegador/swagger
 */
export async function POST(request: NextRequest) {
    try {
        // Verificar que sea un admin (opcional, puedes agregar validación)
        // const authHeader = request.headers.get('authorization');
        // if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        console.log('🔧 Iniciando migración de payment-status → approval-status...');

        // Obtener todos los miembros de Memberstack
        const result = await memberstackAdmin.listMembers();

        if (!result.success || !result.data) {
            return NextResponse.json(
                { error: 'Error obteniendo miembros de Memberstack', details: result.error },
                { status: 500 }
            );
        }

        const members = result.data;
        const membersToUpdate: string[] = [];
        const updatedMembers: { id: string; email: string }[] = [];
        const errors: { id: string; error: string }[] = [];

        // Filtrar miembros que tienen payment-status: completed pero no approval-status
        for (const member of members) {
            const paymentStatus = member.customFields?.['payment-status'];
            const approvalStatus = member.customFields?.['approval-status'];

            // Si tiene pago completado pero NO tiene approval-status definido
            if (paymentStatus === 'completed' && !approvalStatus) {
                membersToUpdate.push(member.id);
            }
        }

        console.log(`📝 Encontrados ${membersToUpdate.length} miembros para actualizar:`);
        membersToUpdate.forEach(id => {
            const member = members.find(m => m.id === id);
            console.log(`   - ${id} (${member?.auth?.email || 'sin email'})`);
        });

        // Actualizar cada miembro
        for (const memberId of membersToUpdate) {
            try {
                const member = members.find(m => m.id === memberId);
                const email = member?.auth?.email || 'unknown';

                console.log(`⏳ Actualizando ${memberId}...`);

                const updateResult = await memberstackAdmin.updateMemberFields(memberId, {
                    'approval-status': 'pending',
                    'migrated-at': new Date().toISOString(),
                });

                if (updateResult.success) {
                    updatedMembers.push({ id: memberId, email });
                    console.log(`✅ Actualizado: ${email}`);
                } else {
                    errors.push({ id: memberId, error: updateResult.error || 'Unknown error' });
                    console.error(`❌ Error actualizando ${memberId}:`, updateResult.error);
                }
            } catch (error: any) {
                errors.push({ id: memberId, error: error.message });
                console.error(`❌ Error en ${memberId}:`, error.message);
            }
        }

        // Invalidar caché después de las actualizaciones
        memberstackAdmin.invalidateCache();

        return NextResponse.json({
            success: true,
            summary: {
                totalMembers: members.length,
                membersFound: membersToUpdate.length,
                membersUpdated: updatedMembers.length,
                errors: errors.length,
            },
            updated: updatedMembers,
            failed: errors,
            message: `Migración completada. ${updatedMembers.length} miembros actualizados.`,
        });

    } catch (error: any) {
        console.error('Error en migración:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/migrate-payment-status
 *
 * Solo muestra información de qué miembros se actualizarían (dry run)
 */
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Analizando miembros para migración (DRY RUN)...');

        const result = await memberstackAdmin.listMembers();

        if (!result.success || !result.data) {
            return NextResponse.json(
                { error: 'Error obteniendo miembros', details: result.error },
                { status: 500 }
            );
        }

        const members = result.data;
        const candidates: { id: string; email: string; paymentStatus: string; approvalStatus: string | null }[] = [];

        for (const member of members) {
            const paymentStatus = member.customFields?.['payment-status'];
            const approvalStatus = member.customFields?.['approval-status'];
            const planConnections = member.planConnections;
            const hasActivePlan = planConnections?.some(
                (p: any) => p.status?.toLowerCase() === 'active' || p.status?.toLowerCase() === 'trialing'
            );

            // Miembros con pago completado pero sin approval-status
            if (paymentStatus === 'completed' && !approvalStatus) {
                candidates.push({
                    id: member.id,
                    email: member.auth?.email || 'sin-email',
                    paymentStatus,
                    approvalStatus: approvalStatus || null,
                });
            }
        }

        return NextResponse.json({
            dryRun: true,
            totalMembers: members.length,
            candidatesCount: candidates.length,
            candidates: candidates,
            message: `Se encontraron ${candidates.length} miembros que necesitan ser actualizados.`,
            nextStep: 'Ejecuta POST /api/admin/migrate-payment-status para aplicar los cambios.',
        });

    } catch (error: any) {
        console.error('Error en análisis:', error);
        return NextResponse.json(
            { error: 'Error interno', details: error.message },
            { status: 500 }
        );
    }
}
