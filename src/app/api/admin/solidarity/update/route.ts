import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminUser(request);
        if (!admin || (admin as any).isUnauthorized) return unauthorizedResponse();

        const body = await request.json();
        const { 
            requestId, 
            status, 
            approvedAmount, 
            adminNotes, 
            message // Mensaje de chat opcional al cambiar estado
        } = body;

        if (!requestId || !status) {
            return NextResponse.json({ error: 'requestId y status son obligatorios' }, { status: 400 });
        }

        // 1. Obtener datos actuales de la solicitud
        const { data: currentRequest, error: fetchError } = await supabaseAdmin
            .from('solidarity_requests')
            .select('user_id, pet_id, status, benefit_type')
            .eq('id', requestId)
            .single();

        if (fetchError || !currentRequest) {
            return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
        }

        // 2. Actualizar solicitud
        const updateData: any = {
            status,
            updated_at: new Date().toISOString()
        };

        if (approvedAmount !== undefined) updateData.approved_amount = approvedAmount;
        if (adminNotes !== undefined) updateData.admin_notes = adminNotes;
        if (message) updateData.last_admin_response_at = new Date().toISOString();

        const { error: updateError } = await supabaseAdmin
            .from('solidarity_requests')
            .update(updateData)
            .eq('id', requestId);

        if (updateError) throw updateError;

        // 3. Si hay mensaje, insertarlo en solidarity_messages
        if (message) {
            const isUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
            const validSenderId = admin.memberstack_id && isUUID(admin.memberstack_id) ? admin.memberstack_id : null;

            await supabaseAdmin
                .from('solidarity_messages')
                .insert({
                    request_id: requestId,
                    sender_role: 'admin',
                    sender_id: validSenderId,
                    message: message,
                    created_at: new Date().toISOString()
                });
        }

        // 4. Crear notificación para el usuario
        const statusMap: Record<string, string> = {
            'needs_info': 'requiere más información',
            'approved': 'ha sido aprobada',
            'rejected': 'ha sido rechazada',
            'paid': 'ha sido pagada',
            'scheduled': 'ha sido agendada'
        };

        const statusText = statusMap[status] || status;

        await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: currentRequest.user_id,
                type: 'solidarity',
                title: `Actualización de Apoyo Económico`,
                message: `Tu solicitud ${statusText}.`,
                icon: '💰',
                link: `/miembros/detalle-solicitud?id=${requestId}`,
                is_read: false,
                created_at: new Date().toISOString()
            });

        // 5. Automatización de baja si es Fallecimiento
        if (status === 'approved' && currentRequest.benefit_type === 'Fallecimiento' && currentRequest.pet_id) {
            try {
                console.log(`🐾 [Solidarity Automation] Procesando baja automática para pet_id: ${currentRequest.pet_id}`);
                
                // Obtener datos de la mascota y su índice
                const { data: petData } = await supabaseAdmin
                    .from('pets')
                    .select('name, owner_id')
                    .eq('id', currentRequest.pet_id)
                    .single();
                
                if (petData) {
                    // Obtener todas las mascotas del dueño para encontrar el índice (ordenadas por creación)
                    const { data: allPets } = await supabaseAdmin
                        .from('pets')
                        .select('id')
                        .eq('owner_id', petData.owner_id)
                        .order('created_at', { ascending: true });
                    
                    const petIndex = allPets?.findIndex(p => p.id === currentRequest.pet_id) ?? -1;
                    
                    if (petIndex !== -1) {
                        const petNum = petIndex + 1;
                        console.log(`🐾 [Solidarity Automation] Baja confirmada: ${petData.name} (Índice MS: ${petNum})`);
                        
                        // 1. Memberstack (Source of Truth para widgets)
                        await memberstackAdmin.updateMemberFields(currentRequest.user_id, {
                            [`pet-${petNum}-is-active`]: 'false'
                        });
                        
                        // 2. Supabase Log (Auditoría)
                        await supabaseAdmin
                            .from('pet_unsubscriptions')
                            .insert([{
                                memberstack_id: currentRequest.user_id,
                                pet_index: petNum,
                                pet_name: petData.name,
                                reason: 'Fallecimiento (Solidaridad)',
                                description: `Baja automática tras aprobación de apoyo económico #${requestId}`,
                                unsubscribed_by: 'Comité (Solidaridad)',
                                unsubscribed_by_id: 'system'
                            }]);
                    }
                }
            } catch (autoErr) {
                console.error('❌ [Solidarity Automation] Error in unsubscription automation:', autoErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Solicitud actualizada correctamente'
        });

    } catch (error: any) {
        console.error('Error en /api/admin/solidarity/update:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
