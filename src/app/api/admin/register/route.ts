import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Define the secret code here or in env (better in env for production)
const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || 'PATA_AMIGA_ADMIN_2025';
const MEMBERSTACK_ADMIN_KEY = process.env.MEMBERSTACK_ADMIN_SECRET_KEY;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, firstName, lastName, secretCode } = body;

        // 1. Validate Secret Code
        if (secretCode !== ADMIN_SECRET_CODE) {
            return NextResponse.json({ error: 'Código secreto inválido' }, { status: 403 });
        }

        if (!MEMBERSTACK_ADMIN_KEY) {
            return NextResponse.json({ error: 'Server configuration error (Missing Admin Key)' }, { status: 500 });
        }

        // 2. Create in Memberstack (Admin API)
        const msResponse = await fetch('https://admin.memberstack.com/members', {
            method: 'POST',
            headers: {
                'X-API-KEY': MEMBERSTACK_ADMIN_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                customFields: {
                    'first-name': firstName,
                    'paternal-last-name': lastName,
                    'approval-status': 'approved',
                    'role': 'admin'
                }
            })
        });

        const msData = await msResponse.json();

        if (!msResponse.ok) {
            return NextResponse.json({ error: msData.message || 'Error creating Memberstack user' }, { status: msResponse.status });
        }

        const memberstackId = msData.data.id;

        // 3. Create in Supabase
        const { error: dbError } = await supabase
            .from('users')
            .insert({
                memberstack_id: memberstackId,
                email: email,
                full_name: `${firstName} ${lastName}`,
                role: 'admin',
            });

        if (dbError) {
            console.error('Supabase Error:', dbError);
            return NextResponse.json({ error: 'User created in MS but failed to sync to DB: ' + dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, memberId: memberstackId });

    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
