import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: messages, error } = await supabaseAdmin
            .from('solidarity_messages')
            .select('*')
            .eq('request_id', id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Generar URLs firmadas para los adjuntos si existen
        const messagesWithSignedUrls = await Promise.all((messages || []).map(async (msg: any) => {
            if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
                const signedAttachments = await Promise.all(msg.attachments.map(async (att: any) => {
                    // Si la URL no es ya una URL completa (http), intentamos firmarla
                    if (att.url && !att.url.startsWith('http')) {
                        const { data } = await supabaseAdmin.storage
                            .from('solidarity-documents')
                            .createSignedUrl(att.url, 3600);
                        return { ...att, url: data?.signedUrl || att.url };
                    }
                    return att;
                }));
                return { ...msg, attachments: signedAttachments };
            }
            return msg;
        }));

        return NextResponse.json(messagesWithSignedUrls, { headers: corsHeaders });
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const senderRole = body.senderRole || body.sender_role;
        const senderId = body.senderId || body.sender_id;
        const { message, attachments } = body;

        if (!senderRole || (!message && (!attachments || attachments.length === 0))) {
            return NextResponse.json({ error: 'El mensaje o un archivo adjunto son obligatorios' }, { status: 400, headers: corsHeaders });
        }

        // Validar si senderId es un UUID válido (necesario si la columna es UUID)
        const isUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
        const validSenderId = senderId && isUUID(senderId) ? senderId : null;

        const { data: newMessage, error } = await supabaseAdmin
            .from('solidarity_messages')
            .insert({
                request_id: id,
                sender_role: senderRole,
                sender_id: validSenderId,
                message,
                attachments: attachments || []
            })
            .select()
            .single();

        if (error) throw error;

        // Si el admin envía un mensaje, actualizar updated_at de la solicitud
        // y marcar que hubo respuesta
        if (senderRole === 'admin') {
            await supabaseAdmin
                .from('solidarity_requests')
                .update({ 
                    last_admin_response_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
        } else {
            // Si el usuario responde, marcar como no leído para el admin (opcional)
            await supabaseAdmin
                .from('solidarity_requests')
                .update({ 
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
        }

        // Si hay adjuntos, guardarlos también como documentos de la solicitud
        if (attachments && attachments.length > 0) {
            const docsToInsert = attachments.map((a: any) => ({
                request_id: id,
                user_id: senderRole === 'user' ? senderId : null,
                document_type: 'chat_attachment',
                file_name: a.name,
                file_url: a.url,
                mime_type: a.type || 'application/octet-stream'
            }));

            await supabaseAdmin
                .from('solidarity_documents')
                .insert(docsToInsert);
        }

        // --- NOTIFICACIONES ---
        try {
            // Obtener información de la solicitud para la notificación
            const { data: requestData, error: requestError } = await supabaseAdmin
                .from('solidarity_requests')
                .select(`
                    id,
                    user_id,
                    users (memberstack_id),
                    pets (name)
                `)
                .eq('id', id)
                .single();

            if (requestError) {
                console.error('Error fetching request data for notification:', requestError);
            } else if (requestData) {
                // Robustly extract memberstackId (Supabase join can return object or array)
                let memberstackId = null;
                if (requestData.users) {
                    if (Array.isArray(requestData.users)) {
                        memberstackId = requestData.users[0]?.memberstack_id;
                    } else {
                        memberstackId = (requestData.users as any).memberstack_id;
                    }
                }

                const petName = (requestData.pets as any)?.name || 'tu mascota';
                
                // Determinar el receptor y el mensaje
                const isFromAdmin = senderRole === 'admin';
                const targetUserId = isFromAdmin ? memberstackId : 'admin';

                console.log(`[SolidarityMessage] Sending notification to ${targetUserId}. isFromAdmin: ${isFromAdmin}, msId: ${memberstackId}`);

                
                const notificationTitle = isFromAdmin 
                    ? `💬 Nuevo mensaje de Soporte (Apoyo Económico)`
                    : `💬 Nuevo mensaje de ${petName}`;
                
                const notificationMessage = message 
                    ? (message.length > 50 ? message.substring(0, 47) + '...' : message)
                    : '📎 Se adjuntó un archivo';

                const siteUrl = 'https://www.pataamiga.mx';
                const adminUrl = 'https://app.pataamiga.mx';
                const notificationLink = isFromAdmin
                    ? `${siteUrl}/miembros/detalle-solicitud?id=${id}#chat`
                    : `${adminUrl}/admin/dashboard?section=solidarity&requestId=${id}`;

                console.log(`🔔 Intentando enviar notificación a ${targetUserId} (Role: ${senderRole})`);

                if (targetUserId) {
                    const { error: notifInsertError } = await supabaseAdmin
                        .from('notifications')
                        .insert({
                            user_id: targetUserId,
                            type: 'account', // Debe ser un tipo permitido por la restricción CHECK (account, system, etc)
                            title: notificationTitle,
                            message: notificationMessage,
                            icon: '💬',
                            link: notificationLink,
                            metadata: {
                                requestId: id,
                                petName: petName,
                                senderRole: senderRole
                            }
                        });
                    
                    if (notifInsertError) {
                        console.error('❌ Error al insertar notificación en BD:', notifInsertError);
                    } else {
                        console.log('✅ Notificación insertada correctamente');
                    }
                }
            }
        } catch (notifError) {
            console.error('Error sending message notification:', notifError);
            // No fallamos la respuesta principal por error en notificación
        }

        return NextResponse.json(newMessage, { headers: corsHeaders });
    } catch (error: any) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
