import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-memberstack-id',
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
        const { searchParams } = new URL(request.url);
        const markReadFor = searchParams.get('markReadFor');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const forRole = searchParams.get('for');

        if (unreadOnly && forRole === 'ambassador') {
            const { count, error } = await supabaseAdmin
                .from('ambassador_messages')
                .select('id', { count: 'exact', head: true })
                .eq('ambassador_id', id)
                .eq('sender_role', 'admin')
                .eq('is_read', false);

            if (error) throw error;

            return NextResponse.json({ count: count || 0 }, { headers: corsHeaders });
        }

        if (markReadFor === 'admin') {
            await supabaseAdmin
                .from('ambassador_messages')
                .update({ is_read: true })
                .eq('ambassador_id', id)
                .eq('sender_role', 'ambassador')
                .eq('is_read', false);
        } else if (markReadFor === 'ambassador') {
            await supabaseAdmin
                .from('ambassador_messages')
                .update({ is_read: true })
                .eq('ambassador_id', id)
                .eq('sender_role', 'admin')
                .eq('is_read', false);
        }

        const { data: messages, error } = await supabaseAdmin
            .from('ambassador_messages')
            .select('*')
            .eq('ambassador_id', id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json(messages || [], { headers: corsHeaders });
    } catch (error: any) {
        console.error('❌ Error fetching ambassador messages:', error);
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
        const message = typeof body.message === 'string' ? body.message.trim() : '';

        if (senderRole !== 'admin' && senderRole !== 'ambassador') {
            return NextResponse.json({ error: 'senderRole inválido' }, { status: 400, headers: corsHeaders });
        }

        if (!message) {
            return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400, headers: corsHeaders });
        }

        const { data: ambassador, error: ambassadorError } = await supabaseAdmin
            .from('ambassadors')
            .select('id, status, first_name, paternal_surname, linked_memberstack_id')
            .eq('id', id)
            .single();

        if (ambassadorError || !ambassador) {
            return NextResponse.json({ error: 'Embajador no encontrado' }, { status: 404, headers: corsHeaders });
        }

        if (ambassador.status !== 'approved') {
            return NextResponse.json(
                { error: 'El chat solo está disponible para embajadores aprobados' },
                { status: 403, headers: corsHeaders }
            );
        }

        let senderName: string | undefined;

        if (senderRole === 'admin') {
            const adminUser = await getAdminUser(request);
            if (!adminUser || (adminUser as any).isUnauthorized) {
                return unauthorizedResponse();
            }
            senderName = (adminUser as any).full_name;
        } else {
            senderName = [ambassador.first_name, ambassador.paternal_surname].filter(Boolean).join(' ');
        }

        const { data: newMessage, error } = await supabaseAdmin
            .from('ambassador_messages')
            .insert({
                ambassador_id: id,
                sender_role: senderRole,
                sender_name: senderName || null,
                message
            })
            .select()
            .single();

        if (error) throw error;

        const preview = message.length > 50 ? message.substring(0, 47) + '...' : message;
        const ambassadorFullName = [ambassador.first_name, ambassador.paternal_surname].filter(Boolean).join(' ');

        if (senderRole === 'ambassador') {
            const { error: notifError } = await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: 'admin',
                    type: 'ambassador_chat',
                    title: `💬 Nuevo mensaje de ${ambassadorFullName || 'embajador'}`,
                    message: preview,
                    icon: '💬',
                    link: null,
                    metadata: { ambassador_id: id }
                });

            if (notifError) {
                console.error('❌ Error creando notificación de chat de embajador:', notifError);
            }
        } else if (senderRole === 'admin' && ambassador.linked_memberstack_id) {
            const { error: notifError } = await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: ambassador.linked_memberstack_id,
                    type: 'ambassador_chat',
                    title: '💬 Nuevo mensaje de Club Pata Amiga',
                    message: preview,
                    icon: '💬',
                    link: null,
                    metadata: { ambassador_id: id }
                });

            if (notifError) {
                console.error('❌ Error creando notificación de chat para el embajador:', notifError);
            }
        }

        return NextResponse.json(newMessage, { headers: corsHeaders });
    } catch (error: any) {
        console.error('❌ Error sending ambassador message:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
