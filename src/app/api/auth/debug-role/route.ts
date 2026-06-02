import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS headers
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

export async function POST(request: NextRequest) {
    try {
        const { memberstackId } = await request.json();

        if (!memberstackId) {
            return NextResponse.json({ 
                success: false, 
                error: 'ID requerido',
                debug: false 
            }, { status: 400, headers: corsHeaders() });
        }

        console.log(`🔍 [Debug-Role] Iniciando depuración para: ${memberstackId}`);

        const result: any = {
            memberstackId,
            timestamp: new Date().toISOString(),
            checks: {}
        };

        // 1. Check Admin
        const adminStart = Date.now();
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();
        
        result.checks.admin = {
            found: !!user,
            role: user?.role,
            timeMs: Date.now() - adminStart,
            data: user
        };

        // 2. Check Wellness Center (prioridad)
        const wellnessStart = Date.now();
        const { data: wellnessCenter } = await supabase
            .from('wellness_centers')
            .select('id, status, establishment_name, email')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();
        
        result.checks.wellness_center = {
            found: !!wellnessCenter,
            status: wellnessCenter?.status,
            timeMs: Date.now() - wellnessStart,
            data: wellnessCenter
        };

        // 3. Check Ambassador
        const ambassadorStart = Date.now();
        const { data: ambassador } = await supabase
            .from('ambassadors')
            .select('id, status, name')
            .eq('linked_memberstack_id', memberstackId)
            .maybeSingle();
        
        result.checks.ambassador = {
            found: !!ambassador,
            status: ambassador?.status,
            timeMs: Date.now() - ambassadorStart,
            data: ambassador
        };

        // 4. Check Memberstack Plan
        const memberstackStart = Date.now();
        const { data: memberstackMember } = await supabase
            .from('memberstack_members')
            .select('plan_connections')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();
        
        result.checks.memberstack_plan = {
            found: !!memberstackMember,
            planConnections: memberstackMember?.plan_connections || [],
            timeMs: Date.now() - memberstackStart,
            data: memberstackMember
        };

        // Determinar rol final
        let finalRole = 'member';
        let reason = 'No se encontró ningún rol especial';

        if (result.checks.admin?.found && result.checks.admin.role === 'admin') {
            finalRole = 'admin';
            reason = 'Usuario con rol de admin';
        } else if (result.checks.wellness_center?.found && 
                   result.checks.wellness_center.status !== 'rejected' && 
                   result.checks.wellness_center.status !== 'suspended' && 
                   result.checks.wellness_center.status !== 'cancelled') {
            finalRole = 'wellness_center';
            reason = `Centro de bienestar con status: ${result.checks.wellness_center.status}`;
        } else if (result.checks.ambassador?.found && 
                   result.checks.ambassador.status !== 'rejected' && 
                   result.checks.ambassador.status !== 'suspended' && 
                   result.checks.ambassador.status !== 'cancelled') {
            finalRole = 'ambassador';
            reason = `Embajador con status: ${result.checks.ambassador.status}`;
        }

        result.finalRole = finalRole;
        result.reason = reason;
        result.totalTimeMs = Date.now() - (result.timestamp ? new Date(result.timestamp).getTime() : 0);

        console.log(`🎯 [Debug-Role] Resultado final para ${memberstackId}:`, {
            finalRole,
            reason,
            checks: result.checks
        });

        return NextResponse.json({
            success: true,
            debug: true,
            ...result
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Debug Role Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Server Error',
            debug: false 
        }, { status: 500, headers: corsHeaders() });
    }
}