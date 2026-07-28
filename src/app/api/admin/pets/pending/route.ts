import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

/**
 * Lista mascotas agregadas entre todos los miembros, filtradas por status.
 * Endpoint nuevo y aditivo para la cola de "Mascotas" del panel — no
 * modifica ningún endpoint existente. Las acciones de aprobar/rechazar
 * siguen usando /api/admin/members/[id]/pets/[petId]/status con el
 * memberstack_id que este endpoint expone en owner.memberstackId.
 */
export async function GET(request: NextRequest) {
    const admin = await getAdminUser(request);
    if (!admin) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    try {
        let query = supabaseAdmin
            .from('pets')
            .select(`
                id, name, breed, pet_type, status, is_active, is_senior,
                vet_certificate_url, photo_url, created_at, owner_id,
                owner:users(memberstack_id, first_name, last_name, email)
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;

        const pets = (data || []).map((pet: any) => {
            const owner = Array.isArray(pet.owner) ? pet.owner[0] : pet.owner;
            return {
                id: pet.id,
                name: pet.name,
                breed: pet.breed,
                petType: pet.pet_type,
                status: pet.status,
                isSenior: pet.is_senior,
                hasVetCertificate: !!pet.vet_certificate_url,
                photoUrl: pet.photo_url,
                createdAt: pet.created_at,
                owner: {
                    memberstackId: owner?.memberstack_id || null,
                    name: owner ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() : 'Miembro',
                    email: owner?.email || '',
                },
            };
        });

        return NextResponse.json({ success: true, pets, count: pets.length });
    } catch (error: any) {
        console.error('❌ Error en /api/admin/pets/pending:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
