import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase';
import { getMemberDetails } from '@/services/memberstack-admin.service';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';
import { getRegistrationIssue } from '@/utils/registration-completeness';

export async function GET(request: NextRequest) {
    try {
        // 🔒 SEGURIDAD: Validar que el usuario es admin en el servidor
        const admin = await getAdminUser(request);
        if (!admin) return unauthorizedResponse();

        // Verificar configuración de base de datos
        if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
            console.error('❌ Supabase Admin not configured in /api/admin/members/search');
            return NextResponse.json(
                { error: 'Servicio de base de datos no disponible' },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const emailQuery = searchParams.get('email');

        if (!emailQuery || emailQuery.trim() === '') {
            return NextResponse.json(
                { error: 'El parámetro email es requerido para realizar la búsqueda' },
                { status: 400 }
            );
        }

        console.log(`🔍 Buscando miembros en Supabase con correo que contenga: ${emailQuery}`);

        // 1. Buscar en Supabase por email (ilike para búsqueda parcial)
        const { data: dbUsers, error: dbError } = await supabaseAdmin
            .from('users')
            .select('id, memberstack_id, email, first_name, last_name, mother_last_name, role, created_at, membership_status, approved_by, approved_at, rejection_reason, rejected_by, rejected_at, appeal_message, appealed_at')
            .ilike('email', `%${emailQuery}%`);

        if (dbError) {
            console.error('Error buscando usuarios en Supabase:', dbError);
            return NextResponse.json({ error: 'Error al buscar en la base de datos' }, { status: 500 });
        }

        // 2. Filtrar administradores en JavaScript
        const filteredUsers = (dbUsers || []).filter((u: any) => {
            const role = (u.role || '').toLowerCase().trim();
            return role !== 'admin' && role !== 'super_admin';
        });

        if (filteredUsers.length === 0) {
            return NextResponse.json({
                success: true,
                members: [],
                count: 0
            });
        }

        const userIds = filteredUsers.map((u: any) => u.id);

        // 3. Obtener todas las mascotas asociadas a estos usuarios en una sola consulta
        const { data: petsData, error: petsError } = await supabaseAdmin
            .from('pets')
            .select('owner_id, photo_url, vet_certificate_url, is_senior, status')
            .in('owner_id', userIds);

        // Agrupar mascotas por owner_id
        const ownerPetsMap = new Map<string, any[]>();
        if (!petsError && petsData) {
            petsData.forEach((pet: any) => {
                const pets = ownerPetsMap.get(pet.owner_id) || [];
                pets.push(pet);
                ownerPetsMap.set(pet.owner_id, pets);
            });
        }

        // 4. Enriquecer cada usuario con datos de Memberstack si tienen memberstack_id
        const enrichedMembers = await Promise.all(
            filteredUsers.map(async (user: any) => {
                let memberstackMember: any = null;
                
                if (user.memberstack_id) {
                    try {
                        const msResult = await getMemberDetails(user.memberstack_id);
                        if (msResult.success) {
                            memberstackMember = msResult.data;
                        }
                    } catch (msError) {
                        console.warn(`⚠️ Error obteniendo detalles de Memberstack para ${user.memberstack_id}:`, msError);
                    }
                }

                const pets = ownerPetsMap.get(user.id) || [];
                const petCount = pets.length;
                const pendingPetCount = pets.filter((p: any) => p.status !== 'approved').length;

                // Determinar el estado de la información
                let infoStatus = 'complete';
                if (petCount > 0) {
                    const hasActionRequired = pets.some((p: any) => p.status === 'action_required') || user.membership_status === 'action_required';
                    if (hasActionRequired) {
                        infoStatus = 'requested';
                    } else {
                        const isIncomplete = pets.some((p: any) => {
                            const missingPhoto = !p.photo_url || p.photo_url.trim() === '';
                            const missingCert = p.is_senior && (!p.vet_certificate_url || p.vet_certificate_url.trim() === '');
                            return missingPhoto || missingCert;
                        });
                        
                        if (isIncomplete) {
                            infoStatus = 'incomplete';
                        }
                    }
                } else {
                    infoStatus = 'incomplete'; // Miembro sin mascotas cargadas
                }

                // Estado de pago e incidencias
                const plan = memberstackMember?.planConnections?.[0];
                const paymentStatus = plan?.status?.toLowerCase() || 'none';
                const hasActivePlan = paymentStatus === 'active' || paymentStatus === 'trialing';
                
                // Mapear campos de Memberstack o Supabase
                const customFields = memberstackMember?.customFields || {};
                const hasBasicPetFields = Boolean(
                    customFields['pet-1-name'] ||
                    customFields['pet-name'] ||
                    Number(customFields['total-pets'] || 0) > 0 ||
                    petCount > 0
                );

                const registrationIssue = getRegistrationIssue({
                    hasActivePlan,
                    petCount,
                    hasValidPetBasic: hasBasicPetFields,
                });

                const fullName = `${user.first_name || ''} ${user.last_name || ''} ${user.mother_last_name || ''}`.trim() || memberstackMember?.name || 'Sin nombre';

                return {
                    id: user.memberstack_id || user.id, // ID preferido para acciones (si tiene Memberstack, usamos ese)
                    supabaseId: user.id,
                    name: fullName,
                    email: user.email || memberstackMember?.auth?.email || 'Sin email',
                    submittedAt: user.created_at || new Date().toISOString(),
                    status: user.membership_status || 'pending',
                    petCount,
                    pendingPetCount,
                    infoStatus,
                    paymentStatus,
                    registrationIssue,
                    type: 'member',
                    roles: ['member'],
                    // Mapear campos requeridos por el modal de detalles
                    customFields: {
                        'first-name': user.first_name,
                        'paternal-last-name': user.last_name,
                        'maternal-last-name': user.mother_last_name,
                        'approval-status': user.membership_status,
                        'approved-by': user.approved_by,
                        'approved-at': user.approved_at,
                        'rejection-reason': user.rejection_reason,
                        'rejected-by': user.rejected_by,
                        'rejected-at': user.rejected_at,
                        'appeal-message': user.appeal_message,
                        'appealed-at': user.appealed_at,
                        ...customFields
                    }
                };
            })
        );

        console.log(`✅ Búsqueda terminada con éxito. Usuarios encontrados: ${enrichedMembers.length}`);

        return NextResponse.json({
            success: true,
            members: enrichedMembers,
            count: enrichedMembers.length
        });

    } catch (error: any) {
        console.error('Error en GET /api/admin/members/search:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
