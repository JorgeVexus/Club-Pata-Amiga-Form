/**
 * Servicio de integración con CRM Lynsales (LeadConnector)
 * 
 * Este servicio maneja la sincronización de contactos con el CRM.
 * - POST /contacts/upsert: Crear o actualizar contacto
 * - PUT /contacts/:id: Actualizar contacto existente (tags, custom fields)
 */

const API_URL = process.env.LYNSALES_API_URL || 'https://services.leadconnectorhq.com';
const API_KEY = process.env.LYNSALES_API_KEY;
const LOCATION_ID = process.env.LYNSALES_LOCATION_ID;

// Headers requeridos para todas las llamadas
const getHeaders = () => ({
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Version': '2021-07-28',
    'Accept': 'application/json'
});

// Tipos
export interface ContactData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    gender?: 'male' | 'female';
    address1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    dateOfBirth?: string; // Formato YYYY-MM-DD
    tags?: string[];
    customFields?: Array<{ 
        key?: string; 
        field_value?: any;
        id?: string;
        value?: any;
    }>;
}

export interface UpsertResponse {
    success: boolean;
    contactId?: string;
    error?: string;
}

export interface UpdateResponse {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Crea o actualiza un contacto en el CRM
 * Usado cuando el usuario se registra
 */
export async function upsertContact(data: ContactData): Promise<UpsertResponse> {
    try {
        if (!API_KEY || !LOCATION_ID) {
            console.error('[CRM] Faltan credenciales de API');
            return { success: false, error: 'Configuración de CRM incompleta' };
        }

        const payload = {
            locationId: LOCATION_ID,
            firstName: data.firstName,
            lastName: data.lastName,
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone,
            gender: data.gender,
            address1: data.address1,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: data.country || 'MX',
            dateOfBirth: data.dateOfBirth,
            tags: data.tags,
            customFields: data.customFields
        };

        console.log('[CRM] Enviando upsert:', { email: data.email, name: payload.name });

        const response = await fetch(`${API_URL}/contacts/upsert`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[CRM] Error en upsert:', response.status, errorData);
            return {
                success: false,
                error: errorData.message || `Error HTTP ${response.status}`
            };
        }

        const result = await response.json();
        const contactId = result.contact?.id;

        console.log('[CRM] Contacto sincronizado. ID:', contactId);

        return {
            success: true,
            contactId
        };

    } catch (error: any) {
        console.error('[CRM] Error de conexión:', error);
        return {
            success: false,
            error: error.message || 'Error de conexión con CRM'
        };
    }
}

/**
 * Actualiza un contacto como "miembro activo"
 * Usado cuando el admin aprueba al miembro
 */
export async function updateContactAsActive(
    contactId: string,
    membershipType: string = 'Mensual',
    membershipCost: string = '$159'
): Promise<UpdateResponse> {
    try {
        if (!API_KEY) {
            console.error('[CRM] Falta API_KEY');
            return { success: false, error: 'Configuración de CRM incompleta' };
        }

        const payload = {
            tags: ['miembro activo'],
            customFields: [
                {
                    id: 'UDXQDTApGP4lWS7tFrOa',
                    value: membershipType
                },
                {
                    id: 'oRTpCwaPnVxwYgAN5WlJ',
                    value: membershipCost
                }
            ]
        };
        console.log(`[CRM] 🔄 Payload para ${contactId}:`, JSON.stringify(payload, null, 2));

        const response = await fetch(`${API_URL}/contacts/${contactId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Version': '2021-07-28'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (!response.ok) {
            console.error(`[CRM] ❌ Error en PUT /contacts/${contactId}:`, result);
            return { success: false, error: result.message || 'Error en actualización' };
        }

        console.log(`[CRM] ✅ Respuesta exitosa para ${contactId}:`, JSON.stringify(result, null, 2));
        return { success: true, data: result };

    } catch (error: any) {
        console.error('[CRM] Error actualizando contacto:', error);
        return {
            success: false,
            error: error.message || 'Error de conexión con CRM'
        };
    }
}

/**
 * Actualiza datos generales de un contacto
 * Para actualizaciones futuras (cambio de email, teléfono, etc.)
 */
export async function updateContact(
    contactId: string,
    data: Partial<ContactData>
): Promise<UpdateResponse> {
    try {
        if (!API_KEY) {
            return { success: false, error: 'Configuración de CRM incompleta' };
        }

        console.log('[CRM] Actualizando contacto:', contactId);

        const response = await fetch(`${API_URL}/contacts/${contactId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.message || `Error HTTP ${response.status}`
            };
        }

        return { success: true };

    } catch (error: any) {
        console.error('[CRM] Error actualizando contacto:', error);
        return {
            success: false,
            error: error.message || 'Error de conexión con CRM'
        };
    }
}
