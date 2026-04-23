/**
 * API Route: /api/user/verify-upload-token
 *
 * Verifica el token del magic link y devuelve la información de la mascota
 * desde Supabase (no Memberstack) sin requerir autenticación.
 *
 * POST body: { memberId, petIndex, token, exp }
 * Response:  { valid, petInfo: { name, type, missingDocs }, memberId, petId }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyUploadToken } from '@/utils/upload-token';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { memberId, petIndex, token, exp } = await req.json();

        if (!memberId || !petIndex || !token || !exp) {
            return NextResponse.json({ valid: false, error: 'Parámetros incompletos' }, { status: 400 });
        }

        // Verificar token
        const isValid = verifyUploadToken(memberId, Number(petIndex), token, Number(exp));
        if (!isValid) {
            return NextResponse.json({ valid: false, error: 'Enlace inválido o expirado' }, { status: 401 });
        }

        // Buscar el usuario en Supabase por su memberstack_id
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, first_name, last_name, email')
            .eq('memberstack_id', memberId)
            .single();

        if (userError || !user) {
            console.error('❌ [VerifyToken] Usuario no encontrado en Supabase:', userError);
            return NextResponse.json({ valid: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Buscar las mascotas del usuario en Supabase
        const { data: pets, error: petsError } = await supabaseAdmin
            .from('pets')
            .select('id, name, pet_type, photo_url, vet_certificate_url, is_senior')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: true });

        if (petsError || !pets || pets.length === 0) {
            console.error('❌ [VerifyToken] Mascotas no encontradas:', petsError);
            return NextResponse.json({ valid: false, error: 'No se encontraron mascotas registradas' }, { status: 404 });
        }

        // Obtener la mascota según el índice (1-based)
        const petIdx = Number(petIndex) - 1;
        if (petIdx < 0 || petIdx >= pets.length) {
            return NextResponse.json({ valid: false, error: 'Mascota no encontrada en ese índice' }, { status: 404 });
        }

        const pet = pets[petIdx];

        // Determinar documentos faltantes
        const hasPhoto = !!(pet.photo_url?.trim());
        const isSenior = pet.is_senior === true;
        const hasCert = !!(pet.vet_certificate_url?.trim());

        let missingDocs: string | null = null;
        if (!hasPhoto && isSenior && !hasCert) missingDocs = 'both';
        else if (!hasPhoto) missingDocs = 'photo';
        else if (isSenior && !hasCert) missingDocs = 'certificate';

        return NextResponse.json({
            valid: true,
            petInfo: {
                name: pet.name,
                type: pet.pet_type || 'mascota',
                missingDocs,
            },
            memberId,
            petId: pet.id,
            petIndex: Number(petIndex),
        });

    } catch (err: any) {
        console.error('❌ Error verificando token:', err);
        return NextResponse.json({ valid: false, error: 'Error interno' }, { status: 500 });
    }
}
