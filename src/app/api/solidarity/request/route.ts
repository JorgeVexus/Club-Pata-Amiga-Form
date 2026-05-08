import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SOLIDARITY_LIMITS } from '@/types/solidarity.types';

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
            userId,
            petId,
            type,
            benefitType,
            caseTitle,
            caseDescription,
            incidentDate,
            requestedAmount,
            preferredAppointmentDate,
            alliedCenterId,
            documents // Array de { path, fileName, docType, fileSize, mimeType }
        } = body;

        // 1. Validaciones básicas
        if (!userId || !petId || !type || !benefitType || !caseDescription) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400, headers: corsHeaders });
        }

        // 2. Validar Monto Máximo
        if (type === 'reimbursement' && requestedAmount) {
            const limit = SOLIDARITY_LIMITS[benefitType as keyof typeof SOLIDARITY_LIMITS];
            if (requestedAmount > limit) {
                return NextResponse.json({ 
                    error: `El monto solicitado ($${requestedAmount}) excede el límite para ${benefitType} ($${limit})` 
                }, { status: 400, headers: corsHeaders });
            }
        }

        // 3. Validar Período de Carencia de la Mascota
        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .select('waiting_period_end, name')
            .eq('id', petId)
            .single();

        if (petError || !pet) {
            return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404, headers: corsHeaders });
        }

        const waitingPeriodEnd = new Date(pet.waiting_period_end);
        const today = new Date();

        if (waitingPeriodEnd > today) {
            const daysLeft = Math.ceil((waitingPeriodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return NextResponse.json({ 
                error: `La mascota ${pet.name} aún está en período de carencia. Faltan ${daysLeft} días.` 
            }, { status: 403, headers: corsHeaders });
        }

        // 4. Crear Solicitud
        const { data: solidarityRequest, error: requestError } = await supabaseAdmin
            .from('solidarity_requests')
            .insert({
                user_id: userId,
                pet_id: petId,
                type,
                benefit_type: benefitType,
                status: 'new',
                requested_amount: requestedAmount,
                case_title: caseTitle,
                case_description: caseDescription,
                incident_date: incidentDate,
                preferred_appointment_date: preferredAppointmentDate,
                allied_center_id: alliedCenterId
            })
            .select()
            .single();

        if (requestError) throw requestError;

        // 5. Vincular Documentos
        if (documents && Array.isArray(documents) && documents.length > 0) {
            const docsToInsert = documents.map(doc => ({
                request_id: solidarityRequest.id,
                document_type: doc.docType,
                file_name: doc.fileName,
                file_path: doc.path,
                file_size: doc.fileSize,
                mime_type: doc.mimeType
            }));

            const { error: docsError } = await supabaseAdmin
                .from('solidarity_documents')
                .insert(docsToInsert);

            if (docsError) console.error('Error vinculando documentos:', docsError);
        }

        // 6. Notificar al Admin (Opcional, se puede integrar con el sistema de notificaciones existente)
        // Por ahora, devolvemos éxito
        return NextResponse.json({
            success: true,
            requestId: solidarityRequest.id,
            message: 'Solicitud creada exitosamente'
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error en /api/solidarity/request:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
