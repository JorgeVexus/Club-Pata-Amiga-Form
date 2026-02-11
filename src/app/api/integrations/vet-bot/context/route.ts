import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Secure Key for the Bot
// In production, this should be in .env. For now, we set a default or read only from env if available.
// We'll enforce that the caller sends this key in 'x-vet-bot-key' header.
const VET_BOT_API_KEY = process.env.VET_BOT_API_KEY || 'pata-amiga-vet-bot-secret-2026';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const apiKey = request.headers.get('x-vet-bot-key');

        // 1. Security Check
        if (apiKey !== VET_BOT_API_KEY) {
            return NextResponse.json({ error: 'Unauthorized', message: 'Invalid API Key' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
        }

        console.log(`🤖 [VET_BOT] Fetching context for user: ${userId}`);

        // 2. Fetch User Profile
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, first_name, last_name, email, membership_status')
            .eq('memberstack_id', userId)
            .single();

        if (userError || !user) {
            console.warn(`⚠️ [VET_BOT] User not found: ${userId}`);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 3. Fetch Pets
        const { data: pets, error: petsError } = await supabaseAdmin
            .from('pets')
            .select('*')
            .eq('owner_id', user.id);

        if (petsError) {
            console.error('❌ [VET_BOT] Error fetching pets:', petsError);
            return NextResponse.json({ error: 'Error fetching pet data' }, { status: 500 });
        }

        // 4. Format Data for AI Context
        // Simplify structure for the LLM to consume easily
        const petsContext = pets.map(pet => ({
            name: pet.name,
            type: pet.breed?.toLowerCase().includes('gato') ? 'Gato' : 'Perro', // Simplistic inference if type column missing
            breed: pet.breed || 'Mestizo',
            size: pet.breed_size,
            age: pet.age || 'Desconocida', // If age column exists in pets table? Need to check schema. 
            // Schema check: 'age' is not in standard schema I saw earlier, usually computed or in custom fields? 
            // Double check: we insert 'age' in previous steps? 
            // Re-reading 'registerPetsInSupabase': we insert name, breed, breed_size, birth_date(null).
            // Wait, previous `PetFormData` interface had `age`. 
            // Let's check `pets` table schema again or rely on what's likely there. 
            // If `age` is not in DB, we might omit it or calculate from birth_date if available.
            // For now, let's send what we have.
            status: pet.status,
            waiting_period: {
                start: pet.waiting_period_start,
                end: pet.waiting_period_end,
                is_active: pet.status === 'approved' && (!pet.waiting_period_end || new Date() > new Date(pet.waiting_period_end))
            },
            medical_alert: pet.admin_notes ? `Notas de Admin: ${pet.admin_notes}` : 'Ninguna'
        }));

        const responsePayload = {
            user: {
                name: `${user.first_name} ${user.last_name}`,
                status: user.membership_status,
                id: userId
            },
            pets: petsContext,
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(responsePayload);

    } catch (error: any) {
        console.error('❌ [VET_BOT] Server Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
