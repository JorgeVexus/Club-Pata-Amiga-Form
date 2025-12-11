/**
 * Servicio para interactuar con Memberstack Admin API
 * Maneja operaciones administrativas: listar, aprobar, rechazar miembros
 */

// Tipos para las respuestas de la API
export interface MemberstackMember {
    id: string;
    auth: {
        email: string;
    };
    customFields: Record<string, any>;
    createdAt: string;
}

export interface AdminApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Cliente base para Memberstack Admin API
 */
class MemberstackAdminClient {
    // Base URL según documentación oficial
    private baseUrl = 'https://admin.memberstack.com';
    private secretKey: string;

    constructor() {
        // La secret key DEBE estar en el servidor, nunca en el cliente
        this.secretKey = process.env.MEMBERSTACK_ADMIN_SECRET_KEY || '';

        if (!this.secretKey) {
            console.error('❌ MEMBERSTACK_ADMIN_SECRET_KEY no está configurada');
        }
    }

    /**
     * Headers comunes para todas las peticiones según documentación
     * https://developers.memberstack.com/admin-rest-api/quick-start
     */
    private getHeaders(): HeadersInit {
        return {
            'Content-Type': 'application/json',
            'X-API-KEY': this.secretKey,
        };
    }

    /**
     * Lista todos los miembros con un status específico
     */
    async listMembers(status?: 'pending' | 'approved' | 'rejected' | 'appealed'): Promise<AdminApiResponse<MemberstackMember[]>> {
        try {
            // Memberstack Admin API endpoint para listar miembros
            const url = `${this.baseUrl}/members`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // Filtrar por status si se especifica
            let members = data.data || [];
            if (status) {
                members = members.filter((m: MemberstackMember) =>
                    m.customFields?.['approval-status'] === status
                );
            }

            return {
                success: true,
                data: members,
            };
        } catch (error: any) {
            console.error('Error listando miembros:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Obtiene los detalles de un miembro específico
     */
    async getMember(memberId: string): Promise<AdminApiResponse<MemberstackMember>> {
        try {
            const url = `${this.baseUrl}/members/${memberId}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            return {
                success: true,
                data: data.data,
            };
        } catch (error: any) {
            console.error('Error obteniendo miembro:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Actualiza los custom fields de un miembro
     */
    async updateMemberFields(
        memberId: string,
        customFields: Record<string, any>
    ): Promise<AdminApiResponse<MemberstackMember>> {
        try {
            const url = `${this.baseUrl}/members/${memberId}`;

            const response = await fetch(url, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    customFields,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            return {
                success: true,
                data: data.data,
            };
        } catch (error: any) {
            console.error('Error actualizando miembro:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Aprueba un miembro
     */
    async approveMember(memberId: string, adminId: string): Promise<AdminApiResponse> {
        console.log(`✅ Aprobando miembro ${memberId} por admin ${adminId}`);

        const customFields = {
            'approval-status': 'approved',
            'approved-at': new Date().toISOString(),
            'approved-by': adminId,
        };

        return await this.updateMemberFields(memberId, customFields);
    }

    /**
     * Rechaza un miembro con una razón
     */
    async rejectMember(
        memberId: string,
        reason: string,
        adminId: string
    ): Promise<AdminApiResponse> {
        if (!reason || reason.trim().length === 0) {
            return {
                success: false,
                error: 'La razón del rechazo es obligatoria',
            };
        }

        console.log(`❌ Rechazando miembro ${memberId} por admin ${adminId}`);
        console.log(`Razón: ${reason}`);

        const customFields = {
            'approval-status': 'rejected',
            'rejection-reason': reason,
            'rejected-at': new Date().toISOString(),
            'rejected-by': adminId,
        };

        return await this.updateMemberFields(memberId, customFields);
    }

    /**
     * Registra una apelación de un usuario
     */
    async appealRejection(
        memberId: string,
        appealMessage: string
    ): Promise<AdminApiResponse> {
        if (!appealMessage || appealMessage.trim().length === 0) {
            return {
                success: false,
                error: 'El mensaje de apelación es obligatorio',
            };
        }

        console.log(`📧 Registrando apelación de miembro ${memberId}`);

        const customFields = {
            'approval-status': 'appealed',
            'appeal-message': appealMessage,
            'appealed-at': new Date().toISOString(),
        };

        return await this.updateMemberFields(memberId, customFields);
    }
}

// Exportar instancia singleton
export const memberstackAdmin = new MemberstackAdminClient();

// Funciones helper para usar en Server Actions
export async function listPendingMembers() {
    return await memberstackAdmin.listMembers('pending');
}

export async function listAppealedMembers() {
    return await memberstackAdmin.listMembers('appealed');
}

export async function getMemberDetails(memberId: string) {
    return await memberstackAdmin.getMember(memberId);
}

export async function approveMemberApplication(memberId: string, adminId: string) {
    return await memberstackAdmin.approveMember(memberId, adminId);
}

export async function rejectMemberApplication(
    memberId: string,
    reason: string,
    adminId: string
) {
    return await memberstackAdmin.rejectMember(memberId, reason, adminId);
}

export async function submitAppeal(memberId: string, appealMessage: string) {
    return await memberstackAdmin.appealRejection(memberId, appealMessage);
}
