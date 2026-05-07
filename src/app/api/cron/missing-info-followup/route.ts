/**
 * 🕐 Cron Job: Seguimiento de Documentación Faltante de Mascotas
 *
 * Endpoint: POST /api/cron/missing-info-followup
 *
 * Configurar en vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/missing-info-followup", "schedule": "0 16 * * *" }]
 * }
 *
 * Ejecuta diariamente a las 10:00 AM CDMX (16:00 UTC).
 * Detecta miembros con documentación faltante (foto, certificado) en Supabase
 * y envía el correo correspondiente según los días transcurridos desde su registro:
 * Día 0, 10, 13, 14 y 15.
 */

import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { sendMissingPetDocsEmail, type MissingDocType, type FollowupDay } from '@/app/actions/comm.actions';
import { generateUploadToken } from '@/utils/upload-token';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Días de seguimiento en los que se envía email
const FOLLOWUP_DAYS: FollowupDay[] = [0, 10, 13, 14, 15];

/** Calcula los días transcurridos desde una fecha ISO */
function daysSince(dateIso: string): number {
    const reg = new Date(dateIso);
    const now = new Date();
    return Math.floor((now.getTime() - reg.getTime()) / (1000 * 60 * 60 * 24));
}

/** Construye la URL de la página de carga de documentos (con token de acceso directo) */
function buildUploadUrl(memberId: string, petIndex: number): string {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://app.pataamiga.mx';
    const { token, exp } = generateUploadToken(memberId, petIndex);
    return `${base}/completar-documentacion?m=${memberId}&p=${petIndex}&t=${token}&exp=${exp}`;
}

export async function GET(req: NextRequest) {
    // 0. Parámetros para disparo manual
    const { searchParams } = new URL(req.url);
    const targetMemberId = searchParams.get('memberId');
    const targetPetIndex = searchParams.get('petIndex'); // 1, 2 o 3
    const targetDay = searchParams.get('day');
    const force = searchParams.get('force') === 'true';

    // 1. Verificar autorización del cron (Vercel envía el header automáticamente en producción)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const expectedSecret = `Bearer ${cronSecret}`;

    // Permitir ejecución si es desarrollo o si el secret coincide
    const isAuthorized = process.env.NODE_ENV === 'development' || authHeader === expectedSecret;

    if (!isAuthorized) {
        console.warn('🚫 [Cron] Acceso no autorizado');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🕐 [Cron] Iniciando revisión de documentación faltante... ${force ? '(FORCE MODE)' : ''}`);
    const startTime = Date.now();

    const results = {
        checked: 0,
        emailsSent: 0,
        errors: 0,
        skipped: 0,
        details: [] as any[],
    };

    try {
        let membersToProcess = [];

        // 2. Obtener miembros a procesar (uno solo si se especifica memberId, o todos)
        if (targetMemberId) {
            console.log(`🎯 [Cron] Procesando miembro específico: ${targetMemberId}`);
            const memberRes = await memberstackAdmin.getMember(targetMemberId);
            if (memberRes.success && memberRes.data) {
                membersToProcess = [memberRes.data];
            } else {
                return NextResponse.json({ error: `Miembro ${targetMemberId} no encontrado` }, { status: 404 });
            }
        } else {
            const membersRes = await memberstackAdmin.listMembers(undefined, { paidOnly: false });

            if (!membersRes.success || !membersRes.data) {
                console.error('❌ [Cron] Error obteniendo miembros de Memberstack:', membersRes.error);
                return NextResponse.json({ error: 'No se pudo obtener miembros' }, { status: 500 });
            }

            const allMembers = membersRes.data;
            console.log(`📊 [Cron] Total miembros Memberstack: ${allMembers.length}`);

            // Filtrar solo los que tienen plan pagado
            membersToProcess = allMembers.filter(m => {
                const approvalStatus = m.customFields?.['approval-status'];
                const hasActivePlan = m.planConnections?.some(pc => 
                    pc.active === true && pc.payment?.status === 'PAID'
                );
                return (approvalStatus && approvalStatus !== 'pending') || hasActivePlan;
            });
        }

        console.log(`💳 [Cron] Miembros considerados para seguimiento: ${membersToProcess.length}`);

        // 3. Para cada miembro, buscar su data y mascotas en Supabase
        for (const member of membersToProcess) {
            results.checked++;

            const userEmail = member.auth?.email;
            if (!userEmail) {
                results.skipped++;
                continue;
            }

            // Buscar usuario en Supabase por memberstack_id
            const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('id, first_name, last_name, created_at')
                .eq('memberstack_id', member.id)
                .single();

            if (userError || !user) {
                results.skipped++;
                continue;
            }

            const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Miembro';

            // 4. Buscar mascotas del usuario en Supabase
            const { data: pets, error: petsError } = await supabaseAdmin
                .from('pets')
                .select('id, name, photo_url, vet_certificate_url, is_senior, created_at')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: true });

            if (petsError || !pets || pets.length === 0) {
                results.skipped++;
                continue;
            }

            // Revisar cada mascota independientemente
            for (let petIdx = 0; petIdx < pets.length; petIdx++) {
                const pet = pets[petIdx];
                const petIndexOneBased = petIdx + 1;

                // Si se especificó un petIndex (trigger manual), saltar los demás
                if (targetPetIndex && parseInt(targetPetIndex) !== petIndexOneBased) {
                    continue;
                }

                // Calcular días desde registro de la MASCOTA
                const petRegDate = pet.created_at;
                if (!petRegDate) continue;

                const daysSincePetReg = daysSince(petRegDate);
                
                // Usar día forzado si se proporciona, de lo contrario los días reales
                const evalDay = targetDay ? parseInt(targetDay) : daysSincePetReg;
                const isFollowupDay = FOLLOWUP_DAYS.includes(evalDay as FollowupDay);

                console.log(`🔍 [Cron] Revisando ${userEmail} | Mascota ${petIndexOneBased}: ${pet.name} | Días Reales: ${daysSincePetReg} | Día Evaluación: ${evalDay} | ¿Toca hoy?: ${isFollowupDay || force}`);

                // Solo enviar si es el día que toca o si se está forzando el envío
                if (!isFollowupDay && !force) {
                    continue;
                }

                // Asegurar que followupDay sea un valor válido para los templates
                let followupDay: FollowupDay = 15; // Default al último día
                if (FOLLOWUP_DAYS.includes(evalDay as FollowupDay)) {
                    followupDay = evalDay as FollowupDay;
                } else if (evalDay < 10) {
                    followupDay = 0;
                } else if (evalDay < 13) {
                    followupDay = 10;
                } else if (evalDay < 14) {
                    followupDay = 13;
                } else if (evalDay < 15) {
                    followupDay = 14;
                }

                // Determinar docs faltantes
                const hasPhoto = !!(pet.photo_url?.trim());
                const isSenior = pet.is_senior === true;
                const hasCert = !!(pet.vet_certificate_url?.trim());

                let missingDocs: MissingDocType | null = null;
                if (!hasPhoto && isSenior && !hasCert) missingDocs = 'both';
                else if (!hasPhoto) missingDocs = 'photo';
                else if (isSenior && !hasCert) missingDocs = 'certificate';

                if (!missingDocs) {
                    console.log(`✅ [Cron] Mascota ${pet.name} tiene documentación completa.`);
                    continue; 
                }

                // Enviar email de seguimiento
                const uploadUrl = buildUploadUrl(member.id, petIndexOneBased);
                console.log(`📧 [Cron] Enviando día ${followupDay} a ${userEmail} para ${pet.name} (falta: ${missingDocs})`);

                try {
                    const result = await sendMissingPetDocsEmail({
                        userId: user.id,
                        userEmail,
                        userName,
                        petName: pet.name,
                        petIndex: petIndexOneBased,
                        missingDocs,
                        followupDay,
                        uploadUrl,
                    });

                    if (result.success) {
                        results.emailsSent++;
                        results.details.push({
                            memberId: member.id,
                            email: userEmail,
                            petName: pet.name,
                            petIndex: petIndexOneBased,
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
                    console.error(`❌ [Cron] Excepción enviando email:`, emailErr.message);
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

// Soporte para POST por si se requiere, delegando a GET
export async function POST(req: NextRequest) {
    return GET(req);
}
