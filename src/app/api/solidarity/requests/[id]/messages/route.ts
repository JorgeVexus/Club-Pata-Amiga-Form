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

        return NextResponse.json(messages, { headers: corsHeaders });
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
        const { message, senderRole, senderId, attachments } = body;

        if (!message || !senderRole) {
            return NextResponse.json({ error: 'Mensaje y rol son obligatorios' }, { status: 400, headers: corsHeaders });
        }

        const { data: newMessage, error } = await supabaseAdmin
            .from('solidarity_messages')
            .insert({
                request_id: id,
                sender_role: senderRole,
                sender_id: senderId,
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

        return NextResponse.json(newMessage, { headers: corsHeaders });
    } catch (error: any) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
