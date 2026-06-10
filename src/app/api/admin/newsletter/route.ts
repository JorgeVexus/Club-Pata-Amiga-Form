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
        const status = searchParams.get('status') || 'active';
        const search = searchParams.get('search');
        const source = searchParams.get('source');
        const exportFormat = searchParams.get('export'); // 'csv' or 'json'
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        // Si es export, no paginar
        const isExport = exportFormat === 'csv' || exportFormat === 'json';

        let query = supabase
            .from('newsletter_subscribers')
            .select('*', { count: 'exact' })
            .order('subscribed_at', { ascending: false });

        // Filtros
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (source) {
            query = query.eq('source', source);
        }

        if (search) {
            query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%`);
        }

        if (dateFrom) {
            query = query.gte('subscribed_at', dateFrom);
        }
        if (dateTo) {
            query = query.lte('subscribed_at', dateTo);
        }

        // Paginación (solo si no es export)
        if (!isExport) {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching newsletter subscribers:', error);
            return NextResponse.json(
                { success: false, error: 'Error al obtener suscriptores' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Si es export CSV
        if (exportFormat === 'csv') {
            const csv = convertToCSV(data || []);
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
                    ...corsHeaders()
                }
            });
        }

        // Si es export JSON
        if (exportFormat === 'json') {
            return new NextResponse(JSON.stringify(data, null, 2), {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Disposition': `attachment; filename="newsletter-subscribers-${new Date().toISOString().split('T')[0]}.json"`,
                    ...corsHeaders()
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: data || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Newsletter GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

function convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = [
        'ID',
        'Email',
        'Nombre',
        'Fuente',
        'Estado',
        'Fecha Suscripción',
        'Fecha Baja',
        'UTM Source',
        'UTM Medium',
        'UTM Campaign',
        'UTM Term',
        'UTM Content',
        'URL Origen',
        'IP',
        'Creado'
    ];

    const rows = data.map(item => [
        item.id,
        item.email,
        item.first_name || '',
        item.source,
        item.status,
        item.subscribed_at ? new Date(item.subscribed_at).toLocaleString('es-MX') : '',
        item.unsubscribed_at ? new Date(item.unsubscribed_at).toLocaleString('es-MX') : '',
        item.utm_source || '',
        item.utm_medium || '',
        item.utm_campaign || '',
        item.utm_term || '',
        item.utm_content || '',
        item.page_url || '',
        item.ip_address || '',
        item.created_at ? new Date(item.created_at).toLocaleString('es-MX') : ''
    ]);

    // Escapar comillas y envolver en comillas si contiene comas
    const escapeField = (field: string) => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };

    const csvRows = [
        headers.map(escapeField).join(','),
        ...rows.map(row => row.map(escapeField).join(','))
    ];

    return '\uFEFF' + csvRows.join('\n'); // BOM para UTF-8 en Excel
}