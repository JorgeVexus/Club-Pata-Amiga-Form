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

/**
 * IDs de los custom fields en Lynsales (proporcionados por la agencia).
 * Ver Documentacion/Requerimientos_PataAmiga_v1 (sección 3).
 * El formato de envío es { id, value } — validado con la agencia.
 */
export const CRM_FIELD_IDS = {
    metodoPago: 'DABr8Ws9zawyJFnLvZqG',
    fechaPago: 'NFqMDDHf23gkgILiC8HM',
    tipoMembresia: 'UDXQDTApGP4lWS7tFrOa',
    fechaPagoRenovacion: 'gTIQIgFqWWgCPeJEkXte',
    fechaRenovacion: 'lHLm0zKABjYVH8hlPbE4',
    costoMembresia: 'oRTpCwaPnVxwYgAN5WlJ',
    estatusMembresia: 'yq0LzNIgIWcU7rzWJwm8',
} as const;

/**
 * fieldName exacto de cada campo, según lo confirmado por la agencia.
 * El formato requerido en el PUT es { id, fieldValue, fieldName }.
 */
export const CRM_FIELD_NAMES: Record<keyof typeof CRM_FIELD_IDS, string> = {
    metodoPago: 'Metodo pago',
    fechaPago: 'Fecha de pago',
    tipoMembresia: 'Tipo membresia',
    fechaPagoRenovacion: 'Fecha pago renovacion',
    fechaRenovacion: 'Fecha renovacion',
    costoMembresia: 'Costo membresia',
    estatusMembresia: 'Estatus membresia',
};

// Tag que identifica a un miembro con membresía vigente
export const CRM_ACTIVE_TAG = 'miembro activo';

/** Valores válidos para contact.estatus_membresia (catálogo sección 4) */
export type MembershipStatus = 'activo' | 'cancelado' | 'no_renovado' | 'pendiente_pago';

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
 * Usado cuando el admin aprueba al miembro.
 * @deprecated Usar `syncMembership` directamente. Se mantiene por compatibilidad
 * y delega en `syncMembership` para respetar el formato { id, fieldValue, fieldName }.
 */
export async function updateContactAsActive(
    contactId: string,
    membershipType: string = 'Mensual',
    membershipCost: string = '$159'
): Promise<UpdateResponse> {
    return syncMembership(contactId, {
        status: 'activo',
        type: membershipType,
        cost: membershipCost,
        addTags: [CRM_ACTIVE_TAG],
    });
}

/**
 * Datos de membresía a sincronizar con el CRM.
 * Todos opcionales: solo se envían los campos presentes.
 */
export interface MembershipSyncData {
    status?: MembershipStatus;        // contact.estatus_membresia
    type?: string;                    // contact.tipo_membresia ("Mensual" | "Anual")
    cost?: string;                    // contact.costo_membresia ("$159")
    paymentDate?: string;             // contact.fecha_pago (YYYY-MM-DD)
    paymentMethod?: string;           // contact.metodo_pago ("Tarjeta" | "OXXO" | ...)
    renewalDate?: string;             // contact.fecha_renovacion (YYYY-MM-DD, próximo cobro)
    renewalPaymentDate?: string;      // contact.fecha_pago_renovacion (YYYY-MM-DD)
    /** Si se envía, agrega estos tags (LeadConnector los suma, no los reemplaza) */
    addTags?: string[];
}

/**
 * Construye el array customFields con formato { id, fieldValue, fieldName }
 * (confirmado por la agencia) a partir de los datos de membresía presentes.
 */
function buildMembershipCustomFields(data: MembershipSyncData) {
    const fields: Array<{ id: string; fieldValue: string; fieldName: string }> = [];
    const add = (key: keyof typeof CRM_FIELD_IDS, value: string | undefined) => {
        if (value !== undefined) {
            fields.push({ id: CRM_FIELD_IDS[key], fieldValue: value, fieldName: CRM_FIELD_NAMES[key] });
        }
    };
    add('estatusMembresia', data.status);
    add('tipoMembresia', data.type);
    add('costoMembresia', data.cost);
    add('fechaPago', data.paymentDate);
    add('metodoPago', data.paymentMethod);
    add('fechaRenovacion', data.renewalDate);
    add('fechaPagoRenovacion', data.renewalPaymentDate);
    return fields;
}

/**
 * Actualiza los campos de membresía de un contacto en el CRM.
 * Función unificada usada en aprobación, renovación, fallo de pago y cancelación.
 * Solo envía los campos presentes en `data`.
 */
export async function syncMembership(
    contactId: string,
    data: MembershipSyncData
): Promise<UpdateResponse> {
    try {
        if (!API_KEY) {
            console.error('[CRM] Falta API_KEY');
            return { success: false, error: 'Configuración de CRM incompleta' };
        }

        const payload: Record<string, any> = {
            customFields: buildMembershipCustomFields(data),
        };
        if (data.addTags?.length) payload.tags = data.addTags;

        console.log(`[CRM] 🔄 syncMembership ${contactId}:`, JSON.stringify(payload, null, 2));

        const response = await fetch(`${API_URL}/contacts/${contactId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error(`[CRM] ❌ Error en PUT /contacts/${contactId}:`, result);
            return { success: false, error: result.message || `Error HTTP ${response.status}` };
        }

        console.log(`[CRM] ✅ syncMembership exitoso para ${contactId}`);
        return { success: true, data: result };
    } catch (error: any) {
        console.error('[CRM] Error en syncMembership:', error);
        return { success: false, error: error.message || 'Error de conexión con CRM' };
    }
}

/**
 * Remueve tags de un contacto (ej. "miembro activo" al cancelar).
 * LeadConnector expone DELETE /contacts/:id/tags con body { tags: [...] }.
 * Best-effort: no bloquea el flujo si falla.
 */
export async function removeContactTags(
    contactId: string,
    tags: string[]
): Promise<UpdateResponse> {
    try {
        if (!API_KEY) {
            return { success: false, error: 'Configuración de CRM incompleta' };
        }

        const response = await fetch(`${API_URL}/contacts/${contactId}/tags`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ tags }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error(`[CRM] ❌ Error removiendo tags de ${contactId}:`, result);
            return { success: false, error: result.message || `Error HTTP ${response.status}` };
        }

        console.log(`[CRM] ✅ Tags removidos de ${contactId}:`, tags);
        return { success: true, data: result };
    } catch (error: any) {
        console.error('[CRM] Error removiendo tags:', error);
        return { success: false, error: error.message || 'Error de conexión con CRM' };
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
