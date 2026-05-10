import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberstackId = searchParams.get('memberstackId');

        if (!memberstackId) {
            return NextResponse.json({ error: 'memberstackId es requerido' }, { status: 400, headers: corsHeaders });
        }

        // Resolver el ID interno de Supabase a partir del ID de Memberstack
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('memberstack_id', memberstackId)
            .single();

        if (userError || !user) {
            console.error('❌ Error resolviendo usuario:', userError);
            return NextResponse.json({ error: 'Usuario no encontrado en Supabase' }, { status: 404, headers: corsHeaders });
        }

        const internalUserId = user.id;

        // 1. Obtener estadísticas y datos de mascotas
        const { data: pets, error: petsError } = await supabaseAdmin
            .from('pets')
            .select('*')
            .eq('owner_id', internalUserId);

        if (petsError) throw petsError;

        // Obtener datos básicos del usuario para el dashboard
        const { data: userData, error: userDataError } = await supabaseAdmin
            .from('users')
            .select('first_name, last_name, email')
            .eq('id', internalUserId)
            .single();

        const now = new Date();
        let activePets = 0;
        let pendingPets = 0;

        const petsWithExtraData = pets?.map(pet => {
            const isApproved = pet.status === 'approved';
            
            // Lógica robusta de carencia (espejo del frontend y request API)
            const getCarenciaDate = () => {
                const start = new Date(pet.waiting_period_start || pet.created_at || new Date());
                if (isNaN(start.getTime())) return new Date();

                const isAdopted = String(pet.is_adopted) === 'true' || pet.is_adopted === true;
                const isMixed = String(pet.is_mixed_breed) === 'true' || pet.is_mixed_breed === true;

                let days = 180; // Default
                if (isAdopted) days = 90;
                else if (isMixed) days = 120;

                const end = new Date(start);
                end.setDate(end.getDate() + days);
                return end;
            };

            const waitingPeriodEnd = getCarenciaDate();
            const hasFinishedWaiting = waitingPeriodEnd <= now;
            const isEligible = isApproved && hasFinishedWaiting;
            
            if (isEligible) {
                activePets++;
            } else {
                pendingPets++;
            }

            // Lógica Senior
            const isSenior = pet.is_senior || false;
            const hasCertificate = !!pet.vet_certificate_url;
            const needsSeniorCertificate = isSenior && !hasCertificate;

            return {
                ...pet,
                isEligible,
                needsSeniorCertificate
            };
        });

        // 2. Obtener estadísticas de solicitudes
        const { data: requests, error: requestsError } = await supabaseAdmin
            .from('solidarity_requests')
            .select('status')
            .eq('user_id', internalUserId);

        if (requestsError) throw requestsError;

        const totalRequests = requests?.length || 0;
        const inProcessRequests = requests?.filter(r => 
            ['new', 'in_review', 'needs_info'].includes(r.status)
        ).length || 0;

        return NextResponse.json({
            success: true,
            user: userData,
            pets: petsWithExtraData || [],
            stats: {
                active: activePets,
                pending: pendingPets,
                total: totalRequests,
                processed: inProcessRequests
            }
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error en /api/solidarity/stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
