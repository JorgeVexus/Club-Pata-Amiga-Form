import { NextRequest, NextResponse } from 'next/server';
import { upsertContact, type ContactData } from '@/services/crm.service';

/**
 * POST /api/crm/upsert
 * 
 * Sincroniza un contacto con el CRM Lynsales.
 * Recibe datos del usuario y devuelve el contactId para guardarlo en la DB.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validar campos requeridos
        if (!body.email) {
            return NextResponse.json(
                { success: false, error: 'Email es requerido' },
                { status: 400 }
            );
        }

        const contactData: ContactData = {
            firstName: body.firstName || '',
            lastName: body.lastName || '',
            email: body.email,
            phone: body.phone,
            gender: body.gender,
            address1: body.address1,
            city: body.city,
            state: body.state,
            postalCode: body.postalCode,
            country: body.country || 'MX',
            dateOfBirth: body.dateOfBirth
        };

        const result = await upsertContact(contactData);

        if (!result.success) {
            console.error('[API/CRM] Error en upsert:', result.error);
            // No fallamos el registro si CRM falla, solo logueamos
            return NextResponse.json({
                success: false,
                error: result.error,
                contactId: null
            });
        }

        return NextResponse.json({
            success: true,
            contactId: result.contactId
        });

    } catch (error: any) {
        console.error('[API/CRM] Error inesperado:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
