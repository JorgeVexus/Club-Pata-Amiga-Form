/**
 * 🧪 Endpoint de prueba para verificar el diseño del email de docs faltantes.
 *
 * USO: POST /api/cron/test-email
 *      Header: Authorization: Bearer <CRON_SECRET>
 *      Body JSON: { "email": "test@example.com", "petName": "Luna", "userName": "Jorge", "missing": "both", "day": 0 }
 *
 * IMPORTANTE: Este endpoint es solo para pruebas. Eliminar en producción final.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendMissingPetDocsEmail, type MissingDocType, type FollowupDay } from '@/app/actions/comm.actions';
import { generateUploadToken } from '@/utils/upload-token';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    // Verificar autorización
    const cronSecret = req.headers.get('authorization');
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

    if (cronSecret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            email = 'asahizv1@gmail.com',
            day = 0,
        } = body;

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.pataamiga.mx';

        // 1. Buscar al miembro en Memberstack para sacar su ID
        const membersRes = await memberstackAdmin.listMembers(undefined, { paidOnly: false });
        let realMemberId = '';
        if (membersRes.success && membersRes.data) {
            const found = membersRes.data.find(m => m.auth?.email === email);
            if (found) {
                realMemberId = found.id;
            }
        }

        if (!realMemberId) {
            return NextResponse.json({ error: 'Miembro no encontrado en Memberstack con ese email' }, { status: 404 });
        }

        // 2. Buscar al usuario en Supabase
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, first_name, last_name')
            .eq('memberstack_id', realMemberId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'Usuario no encontrado en Supabase' }, { status: 404 });
        }

        const resolvedUserName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Miembro';

        // 3. Buscar las mascotas del usuario en Supabase
        const { data: pets, error: petsError } = await supabaseAdmin
            .from('pets')
            .select('id, name, photo_url, vet_certificate_url, is_senior')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: true });

        if (petsError || !pets || pets.length === 0) {
            return NextResponse.json({ error: 'Usuario no tiene mascotas en Supabase' }, { status: 404 });
        }

        // 4. Encontrar la PRIMERA mascota que le falten documentos
        let targetPet = null;
        let resolvedPetIndex = 1;
        let resolvedMissing: MissingDocType | null = null;

        for (let i = 0; i < pets.length; i++) {
            const pet = pets[i];
            const hasPhoto = !!(pet.photo_url?.trim());
            const isSenior = pet.is_senior === true;
            const hasCert = !!(pet.vet_certificate_url?.trim());

            if (!hasPhoto && isSenior && !hasCert) resolvedMissing = 'both';
            else if (!hasPhoto) resolvedMissing = 'photo';
            else if (isSenior && !hasCert) resolvedMissing = 'certificate';

            if (resolvedMissing) {
                targetPet = pet;
                resolvedPetIndex = i + 1; // 1-based index
                break;
            }
        }

        if (!targetPet || !resolvedMissing) {
            return NextResponse.json({ error: 'El usuario no tiene mascotas con documentos faltantes' }, { status: 400 });
        }

        console.log(`🧪 [Test] Enviando email de prueba a ${email} | Mascota: ${targetPet.name} (Índice ${resolvedPetIndex}) | Falta: ${resolvedMissing}`);

        // 5. Generar token real para que el enlace funcione con ESA mascota
        const { token, exp } = generateUploadToken(realMemberId, resolvedPetIndex);
        const uploadUrl = `${appUrl}/completar-documentacion?m=${realMemberId}&p=${resolvedPetIndex}&t=${token}&exp=${exp}`;

        const result = await sendMissingPetDocsEmail({
            userId: realMemberId,
            userEmail: email,
            userName: resolvedUserName,
            petName: targetPet.name,
            petIndex: resolvedPetIndex,
            missingDocs: resolvedMissing,
            followupDay: day as FollowupDay,
            uploadUrl,
        });

        return NextResponse.json({
            success: true,
            testParams: { email, petName: targetPet.name, userName: resolvedUserName, missing: resolvedMissing, day, memberId: realMemberId, petIndex: resolvedPetIndex },
            emailResult: result,
        });

    } catch (err: any) {
        console.error('🧪 [Test] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
