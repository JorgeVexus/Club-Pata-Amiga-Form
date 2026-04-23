/**
 * 🕐 Cron Job: Seguimiento de Documentación Faltante de Mascotas
 *
 * Endpoint: POST /api/cron/missing-info-followup
 *
 * Configurar en vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/missing-info-followup", "schedule": "0 10 * * *" }]
 * }
 *
 * Ejecuta diariamente a las 10:00 AM UTC (4:00 AM Ciudad de México).
 * Detecta miembros con documentación faltante y envía el correo correspondiente
 * según los días transcurridos desde su registro: Día 0, 10, 13, 14 y 15.
 */

import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { sendMissingPetDocsEmail, type MissingDocType, type FollowupDay } from '@/app/actions/comm.actions';

// Días de seguimiento en los que se envía email
const FOLLOWUP_DAYS: FollowupDay[] = [0, 10, 13, 14, 15];

/** Calcula los días transcurridos desde una fecha ISO */
function daysSince(dateIso: string): number {
    const reg = new Date(dateIso);
    const now = new Date();
    return Math.floor((now.getTime() - reg.getTime()) / (1000 * 60 * 60 * 24));
}

/** Determina qué documentos faltan para una mascota según sus custom fields */
function getMissingDocs(
    customFields: Record<string, any>,
    petIndex: number // 1, 2, o 3
): MissingDocType | null {
    const photoKey = `pet-${petIndex}-photo-1-url`;
    const certKey  = `pet-${petIndex}-vet-certificate-url`;

    const hasPhoto = !!(customFields[photoKey] && customFields[photoKey].trim());
    const hasCert  = !!(customFields[certKey]  && customFields[certKey].trim());

    // El certificado solo es obligatorio para mascotas senior/que exceden la edad máxima
    // Revisamos si el campo de "requires cert" existe en Memberstack
    const requiresCert = customFields[`pet-${petIndex}-vet-certificate-required`] === 'true'
        || customFields[`pet-${petIndex}-vet-certificate-required`] === true;

    if (!hasPhoto && requiresCert && !hasCert) return 'both';
    if (!hasPhoto) return 'photo';
    if (requiresCert && !hasCert) return 'certificate';

    return null; // Todo completo
}

/** Construye la URL de la página de carga de documentos */
function buildUploadUrl(memberId: string, petIndex: number): string {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://app.pataamiga.mx';
    return `${base}/completar-documentacion?m=${memberId}&p=${petIndex}`;
}

export async function POST(req: NextRequest) {
    // 1. Verificar autorización del cron (Vercel envía el header automáticamente en producción)
    const cronSecret = req.headers.get('authorization');
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.NODE_ENV === 'production' && cronSecret !== expectedSecret) {
        console.warn('🚫 [Cron] Acceso no autorizado');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 [Cron] Iniciando revisión de documentación faltante...');
    const startTime = Date.now();

    const results = {
        checked: 0,
        emailsSent: 0,
        errors: 0,
        skipped: 0,
        details: [] as any[],
    };

    try {
        // 2. Obtener todos los miembros con estado approved, pending_approval o waiting_approval
        // (quienes ya tienen mascotas registradas pero potencialmente docs faltantes)
        const membersRes = await memberstackAdmin.listMembers(undefined, { paidOnly: false });

        if (!membersRes.success || !membersRes.data) {
            console.error('❌ [Cron] Error obteniendo miembros:', membersRes.error);
            return NextResponse.json({ error: 'No se pudo obtener miembros' }, { status: 500 });
        }

        const allMembers = membersRes.data;
        console.log(`📊 [Cron] Total miembros a revisar: ${allMembers.length}`);

        for (const member of allMembers) {
            results.checked++;

            const customFields = member.customFields || {};
            const userEmail = member.auth?.email;
            const registrationDate = customFields['registration-date'];
            const approvalStatus = customFields['approval-status'];
            const firstName = customFields['first-name'] || '';
            const lastName = customFields['paternal-last-name'] || '';
            const userName = `${firstName} ${lastName}`.trim() || 'Miembro';

            // Solo procesar miembros que:
            // - Tienen mascotas (pet-1-name existe)
            // - Tienen fecha de registro
            // - Tienen email
            // - NO están en estado 'pending' (aún no han pagado)
            if (!userEmail || !registrationDate || !customFields['pet-1-name'] || approvalStatus === 'pending') {
                results.skipped++;
                continue;
            }

            const daysSinceReg = daysSince(registrationDate);

            // Verificar si el día actual corresponde a un día de seguimiento
            if (!FOLLOWUP_DAYS.includes(daysSinceReg as FollowupDay)) {
                results.skipped++;
                continue;
            }

            const followupDay = daysSinceReg as FollowupDay;

            // Revisar las 3 mascotas posibles
            for (let petIdx = 1; petIdx <= 3; petIdx++) {
                const petName = customFields[`pet-${petIdx}-name`];
                if (!petName) continue; // Mascota no registrada

                const missingDocs = getMissingDocs(customFields, petIdx);
                if (!missingDocs) continue; // Todo completo, saltar

                // Enviar email de seguimiento
                const uploadUrl = buildUploadUrl(member.id, petIdx);
                console.log(`📧 [Cron] Enviando día ${followupDay} a ${userEmail} para ${petName} (falta: ${missingDocs})`);

                try {
                    const result = await sendMissingPetDocsEmail({
                        userId: member.id,
                        userEmail,
                        userName,
                        petName,
                        petIndex: petIdx,
                        missingDocs,
                        followupDay,
                        uploadUrl,
                    });

                    if (result.success) {
                        results.emailsSent++;
                        results.details.push({
                            memberId: member.id,
                            email: userEmail,
                            petName,
                            missingDocs,
                            followupDay,
                            resendId: result.id,
                        });
                    } else {
                        results.errors++;
                        console.error(`❌ [Cron] Error enviando a ${userEmail}:`, result.error);
                    }
                } catch (emailErr: any) {
                    results.errors++;
                    console.error(`❌ [Cron] Excepcion enviando email:`, emailErr.message);
                }
            }
        }

        const duration = Date.now() - startTime;
        console.log(`✅ [Cron] Finalizado en ${duration}ms. Enviados: ${results.emailsSent} | Errores: ${results.errors} | Revisados: ${results.checked}`);

        return NextResponse.json({
            success: true,
            duration: `${duration}ms`,
            ...results,
        });

    } catch (err: any) {
        console.error('❌ [Cron] Error fatal:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// GET para pruebas manuales desde el navegador (solo en desarrollo)
export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Método no permitido en producción' }, { status: 405 });
    }

    return POST(req);
}
