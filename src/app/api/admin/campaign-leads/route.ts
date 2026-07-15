import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Database not configured' },
                { status: 500, headers: corsHeaders() }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search');
        const campaign = searchParams.get('campaign') || 'all';

        // 1. Obtener Leads de Campañas
        let query = supabase
            .from('campaign_leads')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (campaign && campaign !== 'all') {
            query = query.eq('campaign', campaign);
        }

        if (search) {
            query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
        }

        const isExport = searchParams.get('export') === 'true';
        if (!isExport) {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);
        }

        const { data: leads, error: leadsError, count } = await query;

        if (leadsError) {
            console.error('Error fetching campaign leads:', leadsError);
            return NextResponse.json(
                { success: false, error: 'Error al obtener leads de campañas' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // 2. Obtener Configuraciones de la Campaña de Regalo
        const { data: settings } = await supabase
            .from('site_settings')
            .select('key, value')
            .in('key', ['campaign_regalo_coupon']);

        const { data: assets } = await supabase
            .from('site_assets')
            .select('slot, url')
            .eq('slot', 'campaign-regalo-pdf')
            .maybeSingle();

        const couponValue = settings?.find(s => s.key === 'campaign_regalo_coupon')?.value || '';
        const giftPdfUrl = assets?.url || '';

        return NextResponse.json({
            success: true,
            leads: leads || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
            config: {
                coupon: couponValue,
                pdfUrl: giftPdfUrl
            }
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Campaign Leads GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Database not configured' },
                { status: 500, headers: corsHeaders() }
            );
        }

        const body = await request.json();
        const { coupon } = body;

        if (coupon === undefined) {
            return NextResponse.json(
                { success: false, error: 'Falta el parámetro coupon' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Upsert del cupón de la campaña
        const { error } = await supabase
            .from('site_settings')
            .upsert({
                key: 'campaign_regalo_coupon',
                value: coupon.trim(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) {
            console.error('Error saving campaign coupon settings:', error);
            return NextResponse.json(
                { success: false, error: 'Error al guardar el cupón de la campaña' },
                { status: 500, headers: corsHeaders() }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Configuración de campaña guardada correctamente'
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Campaign Leads POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Database not configured' },
                { status: 500, headers: corsHeaders() }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Falta el parámetro id' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const { error } = await supabase
            .from('campaign_leads')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting campaign lead:', error);
            return NextResponse.json(
                { success: false, error: 'Error al eliminar el lead' },
                { status: 500, headers: corsHeaders() }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Lead eliminado correctamente'
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Campaign Leads DELETE error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
