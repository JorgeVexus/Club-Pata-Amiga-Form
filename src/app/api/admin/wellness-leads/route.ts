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
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
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
        const status = searchParams.get('status') || 'all';
        const search = searchParams.get('search');
        const source = searchParams.get('source');
        const assignedTo = searchParams.get('assignedTo');
        const city = searchParams.get('city');
        const exportFormat = searchParams.get('export');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        const isExport = exportFormat === 'csv' || exportFormat === 'json';

        let query = supabase
            .from('wellness_center_leads')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (source) {
            query = query.eq('source', source);
        }

        if (assignedTo) {
            query = query.eq('assigned_to', assignedTo);
        }

        if (city) {
            query = query.ilike('city', `%${city}%`);
        }

        if (search) {
            query = query.or(`establishment_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`);
        }

        if (dateFrom) {
            query = query.gte('created_at', dateFrom);
        }
        if (dateTo) {
            query = query.lte('created_at', dateTo);
        }

        if (!isExport) {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching wellness leads:', error);
            return NextResponse.json(
                { success: false, error: 'Error al obtener leads' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // If ID is provided, return single lead for detail view
        const leadId = searchParams.get('id');
        if (leadId && !exportFormat) {
            const { data: lead, error: leadError } = await supabase
                .from('wellness_center_leads')
                .select('*')
                .eq('id', leadId)
                .single();
            
            if (leadError) {
                return NextResponse.json(
                    { success: false, error: 'Lead no encontrado' },
                    { status: 404, headers: corsHeaders() }
                );
            }
            
            return NextResponse.json({ success: true, data: lead }, { headers: corsHeaders() });
        }

        if (exportFormat === 'csv') {
            const csv = convertToCSV(data || []);
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="wellness-leads-${new Date().toISOString().split('T')[0]}.csv"`,
                    ...corsHeaders()
                }
            });
        }

        if (exportFormat === 'json') {
            return new NextResponse(JSON.stringify(data, null, 2), {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Disposition': `attachment; filename="wellness-leads-${new Date().toISOString().split('T')[0]}.json"`,
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
        console.error('Wellness leads GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

export async function PATCH(request: NextRequest) {
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
        const { id, status, assigned_to, notes, lead_score } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID es requerido' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (status) {
            const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost', 'duplicate'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json(
                    { success: false, error: 'Estado inválido' },
                    { status: 400, headers: corsHeaders() }
                );
            }
            updateData.status = status;
            
            // Auto-set timestamps
            if (status === 'contacted' && !body.contacted_at) {
                updateData.contacted_at = new Date().toISOString();
            }
            if (status === 'converted') {
                updateData.converted_at = new Date().toISOString();
            }
        }

        if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
        if (notes !== undefined) updateData.notes = notes;
        if (lead_score !== undefined) updateData.lead_score = lead_score;

        const { data, error } = await supabase
            .from('wellness_center_leads')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating wellness lead:', error);
            return NextResponse.json(
                { success: false, error: 'Error al actualizar lead' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Log activity
        try {
            await supabase.from('notifications').insert({
                user_id: 'admin',
                type: 'wellness_lead_updated',
                title: 'Lead actualizado',
                message: `${data.establishment_name} - Estado: ${data.status}`,
                icon: '📝',
                data: { lead_id: data.id, updated_by: adminUser.full_name },
                is_read: false
            });
        } catch (e) { console.error(e); }

        return NextResponse.json({ success: true, data }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Wellness leads PATCH error:', error);
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
        'Establecimiento',
        'Contacto',
        'Rol Contacto',
        'Email',
        'Teléfono',
        'WhatsApp',
        'Servicios',
        'Dirección',
        'Ciudad',
        'Estado',
        'CP',
        'Web',
        'Instagram',
        'Facebook',
        'TikTok',
        'Mascotas/Estimado',
        'Tiene Vet',
        'Tiene Grooming',
        'Tiene Hotel',
        'Tiene Tienda',
        'Fuente',
        'Estado Lead',
        'Score',
        'Asignado A',
        'Notas',
        'Creado',
        'Actualizado'
    ];

    const rows = data.map(item => [
        item.id,
        item.establishment_name,
        item.contact_name || '',
        item.contact_role || '',
        item.email,
        item.phone || '',
        item.whatsapp || '',
        Array.isArray(item.services) ? item.services.join('; ') : item.services || '',
        item.address || '',
        item.city || '',
        item.state || '',
        item.postal_code || '',
        item.website || '',
        item.instagram || '',
        item.facebook || '',
        item.tiktok || '',
        item.monthly_pets_estimate || '',
        item.has_vet ? 'Sí' : 'No',
        item.has_grooming ? 'Sí' : 'No',
        item.has_hotel ? 'Sí' : 'No',
        item.has_shop ? 'Sí' : 'No',
        item.source,
        item.status,
        item.lead_score,
        item.assigned_to || '',
        item.notes || '',
        item.created_at ? new Date(item.created_at).toLocaleString('es-MX') : '',
        item.updated_at ? new Date(item.updated_at).toLocaleString('es-MX') : ''
    ]);

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

    return '\uFEFF' + csvRows.join('\n');
}