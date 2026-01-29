import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { memberstackId } = await request.json();

        if (!memberstackId) {
            return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
        }

        // Check if user is an Ambassador
        const { data: ambassador } = await supabase
            .from('ambassadors')
            .select('id, status')
            .eq('linked_memberstack_id', memberstackId)
            .single();

        if (ambassador && ambassador.status !== 'rejected' && ambassador.status !== 'suspended') {
            return NextResponse.json({
                success: true,
                role: 'ambassador',
                status: ambassador.status
            });
        }

        return NextResponse.json({
            success: true,
            role: 'member'
        });

    } catch (error) {
        console.error('Check Role Error:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
