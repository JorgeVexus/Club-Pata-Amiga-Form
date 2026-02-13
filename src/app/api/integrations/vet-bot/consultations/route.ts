import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Secure Key for the Bot
const VET_BOT_API_KEY = process.env.VET_BOT_API_KEY || 'pata-amiga-vet-bot-secret-2026';

export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get('x-vet-bot-key');

        // 1. Security Check
        if (apiKey !== VET_BOT_API_KEY) {
            return NextResponse.json({ error: 'Unauthorized', message: 'Invalid API Key' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, email, summary, recommendations, petName, rawData } = body;

        if ((!userId && !email) || !summary) {
            return NextResponse.json({ error: 'Missing required fields: userId/email or summary' }, { status: 400 });
        }

        console.log(`🤖 [VET_BOT] Saving consultation for ${email || userId}`);

        // 2. Fetch User
        let query = supabaseAdmin
            .from('users')
            .select('id, first_name, last_name, email, memberstack_id');

        if (email) {
            query = query.eq('email', email.toLowerCase().trim());
        } else {
            query = query.eq('memberstack_id', userId!);
        }

        const { data: user, error: userError } = await query.single();

        if (userError || !user) {
            console.warn(`⚠️ [VET_BOT] User not found: ${email || userId}`);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 3. Find Pet (Optional)
        let petId = null;
        if (petName) {
            const { data: pet } = await supabaseAdmin
                .from('pets')
                .select('id')
                .eq('owner_id', user.id)
                .ilike('name', petName.trim()) // Case insensitive partial match might be risky, but ilike with exact string is safer: ilike 'name', 'Fido'
                .limit(1)
                .maybeSingle(); // Use maybeSingle to avoid error if multiple/none

            if (pet) petId = pet.id;
        }

        // 4. Insert Consultation
        const { data: consultation, error: insertError } = await supabaseAdmin
            .from('consultations')
            .insert({
                user_id: user.id,
                pet_id: petId,
                summary: summary,
                recommendations: recommendations || '',
                raw_data: rawData || body, // Determine if we want to store the whole payload
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            console.error('❌ [VET_BOT] Error inserting consultation:', insertError);
            return NextResponse.json({ error: 'Database error saving consultation' }, { status: 500 });
        }

        // 5. Response
        // Return clear JSON so the caller can use it to update Memberstack or other systems
        return NextResponse.json({
            success: true,
            id: consultation.id,
            user: {
                memberstack_id: user.memberstack_id,
                email: user.email,
                name: `${user.first_name} ${user.last_name}`
            },
            pet_id: petId,
            consultation: {
                summary: consultation.summary,
                recommendations: consultation.recommendations,
                created_at: consultation.created_at
            },
            message: 'Consultation record saved successfully'
        });

    } catch (error: any) {
        console.error('❌ [VET_BOT] Server Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
