import { NextRequest, NextResponse } from 'next/server';
import { updateMemberData } from '@/services/memberstack-admin.service';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        const { id: memberId } = await params;
        const body = await request.json();

        const {
            name,
            breed,
            petType,      // 'dog' | 'cat'
            gender,       // 'macho' | 'hembra'
            ageValue,
            ageUnit,      // 'months' | 'years'
            isAdopted,
            isSenior,
            isMixedBreed,
            coatColor,
            noseColor,
            eyeColor,
            primaryPhotoUrl,
            msIndex,      // 1, 2, o 3
            memberName,
        } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'El nombre de la mascota es obligatorio' }, { status: 400 });
        }
        if (!msIndex) {
            return NextResponse.json({ error: 'El slot de Memberstack (msIndex) es requerido' }, { status: 400 });
        }

        const adminId = adminUser.memberstack_id;
        const adminName = adminUser.full_name || adminUser.email || 'Admin';

        console.log(`➕ Admin ${adminName} añadiendo nueva mascota ${name} en slot ${msIndex} para el miembro ${memberId}`);

        // 1. Buscar el id interno de usuario en Supabase (tabla users)
        const { data: dbUser, error: userErr } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('memberstack_id', memberId)
            .maybeSingle();

        if (userErr || !dbUser) {
            console.error('⚠️ Usuario no encontrado en Supabase:', userErr?.message);
            return NextResponse.json({ error: 'Usuario no encontrado en la base de datos' }, { status: 404 });
        }

        // 2. Insertar mascota en Supabase (tabla pets)
        const ageUnitClean = ageUnit || 'years';
        const ageString = ageValue ? `${ageValue} ${ageUnitClean === 'months' ? 'meses' : 'años'}` : '';

        const newPetPayload = {
            owner_id: dbUser.id,
            memberstack_slot: msIndex,
            name: name.trim(),
            pet_type: petType || 'dog',
            breed: breed || (isMixedBreed ? (petType === 'cat' ? 'Doméstico' : 'Mestizo') : 'Mestizo'),
            gender: gender || null,
            age_value: ageValue ? String(ageValue) : null,
            age_unit: ageUnitClean,
            age: ageString,
            is_adopted: isAdopted ?? false,
            is_senior: isSenior ?? false,
            is_mixed_breed: isMixedBreed ?? false,
            coat_color: coatColor || null,
            nose_color: noseColor || null,
            eye_color: eyeColor || null,
            primary_photo_url: primaryPhotoUrl || null,
            photo_url: primaryPhotoUrl || null,
            status: 'pending',
            basic_info_completed: true,
            created_at: new Date().toISOString(),
        };

        const { data: insertedPet, error: insertErr } = await supabaseAdmin
            .from('pets')
            .insert(newPetPayload)
            .select()
            .single();

        if (insertErr) {
            console.error('❌ Error creando mascota en Supabase:', insertErr.message);
            return NextResponse.json({ error: `Error en Supabase: ${insertErr.message}` }, { status: 500 });
        }

        // 3. Sincronizar Memberstack customFields
        const msFields: Record<string, any> = {};
        msFields[`pet-${msIndex}-name`] = name.trim();
        msFields[`pet-${msIndex}-type`] = petType || 'dog';
        if (ageValue) {
            msFields[`pet-${msIndex}-age`] = `${ageValue} ${ageUnitClean === 'months' ? 'meses' : 'años'}`;
        }

        // Conteo total de mascotas
        const { count } = await supabaseAdmin
            .from('pets')
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', dbUser.id);

        msFields['total-pets'] = String(count || msIndex);

        const msResult = await updateMemberData(memberId, { customFields: msFields });
        if (!msResult.success) {
            console.warn('⚠️ Desincronización en Memberstack al crear mascota:', msResult.error);
        }

        // 4. Registrar en member_edits y appeal_logs
        await supabaseAdmin.from('member_edits').insert({
            member_id: memberId,
            member_name: memberName || memberId,
            pet_id: insertedPet.id,
            pet_name: name.trim(),
            edited_by_id: adminId || 'admin',
            edited_by_name: adminName,
            changes: { action: { old: null, new: 'create_pet' }, name: { old: null, new: name.trim() } },
            edit_type: 'pet_data',
            created_at: new Date().toISOString(),
        });

        await supabaseAdmin.from('appeal_logs').insert({
            user_id: memberId,
            pet_id: insertedPet.id,
            admin_id: adminId || 'admin',
            type: 'admin_edit',
            message: `➕ ${adminName} registró a la mascota ${name.trim()}.`,
            metadata: { edit_type: 'pet_creation', pet_name: name.trim() },
            created_at: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: `Mascota ${name.trim()} registrada correctamente`,
            pet: insertedPet,
        });

    } catch (error: any) {
        console.error('Error registrando mascota por admin:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
