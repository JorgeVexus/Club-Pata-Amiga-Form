import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function POST(request: NextRequest) {
    try {
        // Handle both JSON and form-encoded (Webflow) payloads
        const contentType = request.headers.get('content-type') || '';
        let body: any = {};
        
        if (contentType.includes('application/json')) {
            body = await request.json();
        } else {
            // Parse form data (application/x-www-form-urlencoded or multipart/form-data)
            const formData = await request.formData();
            body = Object.fromEntries(formData.entries());
        }
        
        // Validaciones básicas
        if (!body.email || !body.establishment_name) {
            return NextResponse.json(
                { success: false, error: 'Email y nombre del establecimiento son requeridos' },
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

        // Extraer UTM params
        const utmSource = body.utm_source || request.headers.get('x-utm-source') || '';
        const utmMedium = body.utm_medium || request.headers.get('x-utm-medium') || '';
        const utmCampaign = body.utm_campaign || request.headers.get('x-utm-campaign') || '';
        const utmTerm = body.utm_term || request.headers.get('x-utm-term') || '';
        const utmContent = body.utm_content || request.headers.get('x-utm-content') || '';
        
        const pageUrl = body.page_url || request.headers.get('referer') || '';
        const source = body.source || 'webflow';
        const referrer = body.referrer || '';
        
        // IP y User Agent
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown';
        const userAgent = request.headers.get('user-agent') || '';

        // Verificar si ya existe lead con este email
        const { data: existing } = await supabase
            .from('wellness_center_leads')
            .select('id, status, establishment_name')
            .eq('email', body.email.toLowerCase().trim())
            .maybeSingle();

        if (existing) {
            // Si ya existe, actualizar datos y marcar como duplicate si es diferente establecimiento
            const isDuplicate = existing.establishment_name !== body.establishment_name.trim();
            
            const { error: updateError } = await supabase
                .from('wellness_center_leads')
                .update({
                    establishment_name: body.establishment_name.trim(),
                    services: body.services ? body.services.split(',').map((s: string) => s.trim()) : [],
                    contact_name: body.contact_name?.trim() || null,
                    contact_role: body.contact_role?.trim() || null,
                    phone: body.phone?.trim() || null,
                    whatsapp: body.whatsapp?.trim() || null,
                    address: body.address?.trim() || null,
                    city: body.city?.trim() || null,
                    state: body.state?.trim() || null,
                    postal_code: body.postal_code?.trim() || null,
                    website: body.website?.trim() || null,
                    instagram: body.instagram?.trim() || null,
                    facebook: body.facebook?.trim() || null,
                    tiktok: body.tiktok?.trim() || null,
                    description: body.description?.trim() || null,
                    monthly_pets_estimate: body.monthly_pets_estimate ? parseInt(body.monthly_pets_estimate) : null,
                    has_vet: body.has_vet === 'true' || body.has_vet === true,
                    has_grooming: body.has_grooming === 'true' || body.has_grooming === true,
                    has_hotel: body.has_hotel === 'true' || body.has_hotel === true,
                    has_shop: body.has_shop === 'true' || body.has_shop === true,
                    source: source,
                    page_url: pageUrl,
                    utm_source: utmSource,
                    utm_medium: utmMedium,
                    utm_campaign: utmCampaign,
                    utm_term: utmTerm,
                    utm_content: utmContent,
                    referrer: referrer,
                    status: isDuplicate ? 'duplicate' : existing.status,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error('❌ Error actualizando lead:', updateError);
                return NextResponse.json(
                    { success: false, error: 'Error al actualizar el lead' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: isDuplicate ? 'Lead actualizado (posible duplicado)' : 'Lead actualizado correctamente',
                data: { id: existing.id, updated: true, duplicate: isDuplicate }
            }, { status: 200 });
        }

        // Calcular lead score básico (handle form data strings)
        let leadScore = 0;
        if (body.establishment_name) leadScore += 10;
        if (body.services) leadScore += 15;
        if (body.phone) leadScore += 10;
        const monthlyPets = body.monthly_pets_estimate ? parseInt(body.monthly_pets_estimate) : 0;
        if (monthlyPets > 10) leadScore += 20;
        if (body.has_vet === 'true' || body.has_vet === true) leadScore += 15;
        if (body.instagram || body.facebook) leadScore += 10;
        if (body.utm_campaign) leadScore += 5;

        // Parse services from form data (comma-separated string)
        const services = body.services ? body.services.split(',').map((s: string) => s.trim()) : [];

        // Insertar nuevo lead
        const { data: lead, error } = await supabase
            .from('wellness_center_leads')
            .insert({
                establishment_name: body.establishment_name.trim(),
                services: services,
                contact_name: body.contact_name?.trim() || null,
                contact_role: body.contact_role?.trim() || null,
                email: body.email.toLowerCase().trim(),
                phone: body.phone?.trim() || null,
                whatsapp: body.whatsapp?.trim() || null,
                address: body.address?.trim() || null,
                city: body.city?.trim() || null,
                state: body.state?.trim() || null,
                postal_code: body.postal_code?.trim() || null,
                website: body.website?.trim() || null,
                instagram: body.instagram?.trim() || null,
                facebook: body.facebook?.trim() || null,
                tiktok: body.tiktok?.trim() || null,
                description: body.description?.trim() || null,
                monthly_pets_estimate: monthlyPets || null,
                has_vet: body.has_vet === 'true' || body.has_vet === true,
                has_grooming: body.has_grooming === 'true' || body.has_grooming === true,
                has_hotel: body.has_hotel === 'true' || body.has_hotel === true,
                has_shop: body.has_shop === 'true' || body.has_shop === true,
                source: source,
                page_url: pageUrl,
                utm_source: utmSource,
                utm_medium: utmMedium,
                utm_campaign: utmCampaign,
                utm_term: utmTerm,
                utm_content: utmContent,
                referrer: referrer,
                status: 'new',
                lead_score: leadScore,
                ip_address: ipAddress,
                user_agent: userAgent
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error guardando lead:', error);
            
            if (error.code === '23505') {
                return NextResponse.json({
                    success: true,
                    message: 'Este lead ya existe',
                    data: { already_exists: true }
                }, { status: 200 });
            }
            
            return NextResponse.json(
                { success: false, error: 'Error al guardar el lead' },
                { status: 500 }
            );
        }

        // Notificación para admin
        try {
            await supabase.from('notifications').insert({
                user_id: 'admin',
                type: 'new_wellness_lead',
                title: 'Nuevo lead de Centro de Bienestar',
                message: `${lead.establishment_name} (${lead.contact_name || lead.email}) mostró interés en ser aliado`,
                icon: '🏥',
                data: { lead_id: lead.id },
                is_read: false
            });
        } catch (notifError) {
            console.error('⚠️ Error creando notificación:', notifError);
        }

        return NextResponse.json({
            success: true,
            message: '¡Gracias por tu interés! Te contactaremos pronto.',
            data: lead
        }, { status: 201 });

    } catch (error: any) {
        console.error('❌ Wellness lead error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}