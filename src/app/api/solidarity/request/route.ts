import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SOLIDARITY_LIMITS, getSolidarityAvailableAmount } from '@/utils/solidarity-balance';
import { getPetCarenciaDate, getDaysUntilActive, isPetActive } from '@/utils/carencia.utils';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            memberstackId,
            petId,
            requestType,
            benefitType,
            caseTitle,
            caseDescription,
            incidentDate,
            requestedAmount,
            totalPaidAmount,
            alliedCenterId,
            preferredAppointmentTime,
            clinicName,
            clinicPostalCode,
            clinicState,
            clinicAddress,
            clinicCity,
            vetName,
            vetLicense,
            bankName,
            bankClabe,
            bankHolder,
        } = body;

        if (!memberstackId || !petId || !requestType || !benefitType || !caseDescription) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400, headers: corsHeaders });
        }

        const limit = SOLIDARITY_LIMITS[benefitType as keyof typeof SOLIDARITY_LIMITS];
        if (!limit) {
            return NextResponse.json({ error: 'Tipo de apoyo inválido' }, { status: 400, headers: corsHeaders });
        }

        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, first_name, last_name')
            .eq('memberstack_id', memberstackId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'Usuario no encontrado en la base de datos' }, { status: 404, headers: corsHeaders });
        }

        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .select('owner_id, waiting_period_end, waiting_period_start, created_at, is_adopted, is_mixed_breed, name, status')
            .eq('id', petId)
            .single();

        if (petError || !pet) {
            return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404, headers: corsHeaders });
        }

        if (pet.owner_id !== user.id) {
            return NextResponse.json({ error: 'La mascota no pertenece a esta membresía' }, { status: 403, headers: corsHeaders });
        }

        if (pet.status !== 'approved') {
            return NextResponse.json({ error: `La mascota ${pet.name} aún no ha sido aprobada por el comité.` }, { status: 403, headers: corsHeaders });
        }

        const { data: referral } = await supabaseAdmin
            .from('referrals')
            .select('id')
            .eq('referred_user_id', memberstackId)
            .maybeSingle();

        const hasAmbassadorCode = !!referral;
        const isActive = isPetActive(pet, hasAmbassadorCode);
        const waitingPeriodEnd = getPetCarenciaDate(pet, hasAmbassadorCode);

        if (!isActive) {
            const daysLeft = getDaysUntilActive(pet, hasAmbassadorCode);
            return NextResponse.json({
                error: `La mascota ${pet.name} aún está en período de carencia. Faltan ${daysLeft} días.`
            }, { status: 403, headers: corsHeaders });
        }

        const currentYear = new Date().getFullYear();
        const startOfYear = `${currentYear}-01-01T00:00:00Z`;
        const { data: existingRequests, error: balanceError } = await supabaseAdmin
            .from('solidarity_requests')
            .select('benefit_type, requested_amount, approved_amount, status')
            .eq('user_id', user.id)
            .gte('created_at', startOfYear);

        if (balanceError) throw balanceError;

        const numericRequestedAmount = Number(requestedAmount) || 0;
        const requestedAmountForBalance = numericRequestedAmount || limit;
        const availableAmount = getSolidarityAvailableAmount(existingRequests || [], benefitType);

        if (requestedAmountForBalance > availableAmount) {
            return NextResponse.json({
                error: `El monto solicitado ($${requestedAmountForBalance}) excede el disponible de tu membresía para este apoyo ($${availableAmount}).`
            }, { status: 400, headers: corsHeaders });
        }

        const { data: solidarityRequest, error: requestError } = await supabaseAdmin
            .from('solidarity_requests')
            .insert({
                user_id: user.id,
                pet_id: petId,
                type: requestType,
                benefit_type: benefitType,
                status: 'new',
                requested_amount: requestedAmountForBalance,
                total_paid_amount: totalPaidAmount,
                case_title: caseTitle,
                case_description: caseDescription,
                incident_date: incidentDate,
                allied_center_id: alliedCenterId,
                preferred_appointment_time: preferredAppointmentTime,
                clinic_name: clinicName,
                clinic_postal_code: clinicPostalCode,
                clinic_state: clinicState,
                clinic_address: clinicAddress,
                clinic_city: clinicCity,
                vet_name: vetName,
                vet_license: vetLicense,
                bank_name: bankName,
                bank_clabe: bankClabe,
                bank_holder: bankHolder,
            })
            .select()
            .single();

        if (requestError) throw requestError;

        if (Array.isArray(body.documents) && body.documents.length > 0) {
            const docsToInsert = body.documents.map((doc: any) => ({
                request_id: solidarityRequest.id,
                document_type: doc.docType,
                file_name: doc.fileName || 'document',
                file_path: doc.path,
                file_size: doc.fileSize,
                mime_type: doc.mimeType,
            }));

            const { error: docsError } = await supabaseAdmin
                .from('solidarity_documents')
                .insert(docsToInsert);

            if (docsError) console.error('Error vinculando documentos:', docsError);
        }

        try {
            const { error: notifError } = await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: 'admin',
                    type: 'solidarity-fund',
                    title: 'Nueva Solicitud de Apoyo',
                    message: `${body.caseTitle || 'Sin título'} - Mascota: ${pet.name}`,
                    icon: '🐾',
                    link: `/admin/dashboard?tab=solidarity-fund&requestId=${solidarityRequest.id}`,
                    metadata: {
                        requestId: solidarityRequest.id,
                        petName: pet.name,
                        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                        waitingPeriodEnd,
                    },
                });

            if (notifError) console.error('Error creando notificación para admin:', notifError);
        } catch (e) {
            console.error('Error silenciado en notificación admin:', e);
        }

        return NextResponse.json({
            success: true,
            requestId: solidarityRequest.id,
            request: solidarityRequest,
            message: 'Solicitud creada exitosamente',
        }, { headers: corsHeaders });
    } catch (error: any) {
        console.error('Error en /api/solidarity/request:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
