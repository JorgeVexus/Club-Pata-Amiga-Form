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
        // 2. Obtener miembros de Memberstack (para verificar quién tiene plan pagado)
        const membersRes = await memberstackAdmin.listMembers(undefined, { paidOnly: false });

        if (!membersRes.success || !membersRes.data) {
            console.error('❌ [Cron] Error obteniendo miembros de Memberstack:', membersRes.error);
            return NextResponse.json({ error: 'No se pudo obtener miembros' }, { status: 500 });
        }

        const allMembers = membersRes.data;
        console.log(`📊 [Cron] Total miembros Memberstack: ${allMembers.length}`);

        // Filtrar solo los que tienen plan pagado
        // Mejorado: Incluimos a los que tienen un plan activo en Memberstack, 
        // aunque su status custom siga en 'pending' o esté vacío.
        const paidMembers = allMembers.filter(m => {
            const approvalStatus = m.customFields?.['approval-status'];
            const hasActivePlan = m.planConnections?.some(pc => 
                pc.active === true && pc.payment?.status === 'PAID'
            );

            const isPaid = (approvalStatus && approvalStatus !== 'pending') || hasActivePlan;
            
            if (!isPaid) {
                // console.log(`⏩ [Cron] Saltando ${m.auth?.email}: status=${approvalStatus}, plans=${m.planConnections?.length || 0}`);
            }
            
            return isPaid;
        });

        console.log(`💳 [Cron] Miembros considerados para seguimiento: ${paidMembers.length}`);

        // 3. Para cada miembro pagado, buscar su data en Supabase
        for (const member of paidMembers) {
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

            // Calcular días desde registro del usuario (eliminado para hacerlo por mascota)
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

            let userHadAnyValidPet = false;

            // Revisar cada mascota independientemente
            for (let petIdx = 0; petIdx < pets.length; petIdx++) {
                const pet = pets[petIdx];
                const petIndexOneBased = petIdx + 1;

                // Calcular días desde registro de la MASCOTA
                const petRegDate = pet.created_at;
                if (!petRegDate) continue;

                const daysSincePetReg = daysSince(petRegDate);
                const isFollowupDay = FOLLOWUP_DAYS.includes(daysSincePetReg as FollowupDay);

                console.log(`🔍 [Cron] Revisando ${userEmail} | Mascota: ${pet.name} | Días: ${daysSincePetReg} | ¿Toca hoy?: ${isFollowupDay}`);

                if (!isFollowupDay) {
                    continue;
                }

                userHadAnyValidPet = true;
                const followupDay = daysSincePetReg as FollowupDay;

                // Determinar docs faltantes
                const hasPhoto = !!(pet.photo_url?.trim());
                const isSenior = pet.is_senior === true;
                const hasCert = !!(pet.vet_certificate_url?.trim());

                let missingDocs: MissingDocType | null = null;
                if (!hasPhoto && isSenior && !hasCert) missingDocs = 'both';
                else if (!hasPhoto) missingDocs = 'photo';
                else if (isSenior && !hasCert) missingDocs = 'certificate';

                if (!missingDocs) continue; // Todo completo

                // Enviar email de seguimiento
                const uploadUrl = buildUploadUrl(member.id, petIndexOneBased);
                console.log(`📧 [Cron] Enviando día ${followupDay} a ${userEmail} para ${pet.name} (falta: ${missingDocs})`);

                try {
                    const result = await sendMissingPetDocsEmail({
                        userId: member.id,
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
