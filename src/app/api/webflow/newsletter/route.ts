import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Validaciones básicas
        if (!body.email) {
            return NextResponse.json(
                { success: false, error: 'Email es requerido' },
                { status: 400 }
            );
        }

        if (!supabase) {
            console.error('❌ Supabase client not initialized');
            return NextResponse.json(
                { success: false, error: 'Configuración de servidor incompleta' },
                { status: 500 }
            );
        }

        // Extraer UTM params del body o headers
        const utmSource = body.utm_source || request.headers.get('x-utm-source') || '';
        const utmMedium = body.utm_medium || request.headers.get('x-utm-medium') || '';
        const utmCampaign = body.utm_campaign || request.headers.get('x-utm-campaign') || '';
        const utmTerm = body.utm_term || request.headers.get('x-utm-term') || '';
        const utmContent = body.utm_content || request.headers.get('x-utm-content') || '';
        
        const pageUrl = body.page_url || request.headers.get('referer') || '';
        const source = body.source || 'webflow';
        
        // IP y User Agent
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown';
        const userAgent = request.headers.get('user-agent') || '';

        // Verificar si ya existe
        const { data: existing } = await supabase
            .from('newsletter_subscribers')
            .select('id, status')
            .eq('email', body.email.toLowerCase().trim())
            .maybeSingle();

        if (existing) {
            // Si existe y está unsubscribed, reactivarlo
            if (existing.status === 'unsubscribed') {
                const { error: updateError } = await supabase
                    .from('newsletter_subscribers')
                    .update({
                        status: 'active',
                        first_name: body.first_name || null,
                        unsubscribed_at: null,
                        source: source,
                        page_url: pageUrl,
                        utm_source: utmSource,
                        utm_medium: utmMedium,
                        utm_campaign: utmCampaign,
                        utm_term: utmTerm,
                        utm_content: utmContent,
                        ip_address: ipAddress,
                        user_agent: userAgent,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                if (updateError) {
                    console.error('❌ Error reactivando suscripción:', updateError);
                    return NextResponse.json(
                        { success: false, error: 'Error al reactivar suscripción' },
                        { status: 500 }
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: 'Suscripción reactivada correctamente',
                    data: { id: existing.id, reactivated: true }
                }, { status: 200 });
            }

            // Ya existe y está activo
            return NextResponse.json({
                success: true,
                message: 'Este email ya está suscrito',
                data: { id: existing.id, already_subscribed: true }
            }, { status: 200 });
        }

        // Insertar nuevo suscriptor
        const { data: subscriber, error } = await supabase
            .from('newsletter_subscribers')
            .insert({
                email: body.email.toLowerCase().trim(),
                first_name: body.first_name?.trim() || null,
                source: source,
                page_url: pageUrl,
                utm_source: utmSource,
                utm_medium: utmMedium,
                utm_campaign: utmCampaign,
                utm_term: utmTerm,
                utm_content: utmContent,
                ip_address: ipAddress,
                user_agent: userAgent,
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error guardando suscriptor:', error);
            
            // Manejar error de duplicado (race condition)
            if (error.code === '23505') {
                return NextResponse.json({
                    success: true,
                    message: 'Este email ya está suscrito',
                    data: { already_subscribed: true }
                }, { status: 200 });
            }
            
            return NextResponse.json(
                { success: false, error: 'Error al guardar la suscripción' },
                { status: 500 }
            );
        }

        // Notificación para admin (opcional)
        try {
            await supabase.from('notifications').insert({
                user_id: 'admin',
                type: 'new_newsletter_subscriber',
                title: 'Nuevo suscriptor al newsletter',
                message: `${subscriber.first_name || subscriber.email} se ha suscrito al newsletter`,
                icon: '📧',
                data: { subscriber_id: subscriber.id },
                is_read: false
            });
        } catch (notifError) {
            console.error('⚠️ Error creando notificación:', notifError);
        }

        return NextResponse.json({
            success: true,
            message: '¡Gracias por suscribirte!',
            data: subscriber
        }, { status: 201 });

    } catch (error: any) {
        console.error('❌ Newsletter subscription error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// OPTIONS para CORS
export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}