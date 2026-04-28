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
    planConnections?: {
        id?: string;
        active?: boolean;
        status?: string;
        planId?: string;
        planName?: string;
        type?: string;
        currentPeriodEnd?: string | number;
        priceId?: string; // Para compatibilidad
        payment?: {
            status?: string;
            amount?: number;
            currency?: string;
            priceId?: string;
            stripeSubscriptionId?: string;
        };
    }[];
}

export interface AdminApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

// 🆕 Sistema de caché simple en memoria
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const CACHE_TTL_MS = 60 * 1000; // 60 segundos de caché
const membersCache: Map<string, CacheEntry<MemberstackMember[]>> = new Map();

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
     * 🆕 Invalida el caché (usar después de actualizar un miembro)
     */
    invalidateCache() {
        membersCache.clear();
        console.log('🗑️ Caché de miembros invalidado');
    }

    /**
     * Lista todos los miembros con un status específico
     * 🆕 Ahora con caché de 60 segundos para mejorar rendimiento
     * 🆕 Trae TODOS los miembros con paginación y filtra por plan pagado
     */
    async listMembers(status?: 'pending' | 'approved' | 'rejected' | 'appealed', options?: { paidOnly?: boolean }): Promise<AdminApiResponse<MemberstackMember[]>> {
        try {
            const cacheKey = `${status || 'all'}_${options?.paidOnly ? 'paid' : 'all'}`;
            const cached = membersCache.get(cacheKey);

            // Verificar si hay caché válido
            if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
                console.log(`⚡ Usando caché para miembros (${cacheKey})`);
                return {
                    success: true,
                    data: cached.data,
                };
            }

            console.log(`📡 Fetching miembros desde Memberstack (${cacheKey})...`);

            // Memberstack limita a 100 por página, necesitamos paginar
            let allMembers: MemberstackMember[] = [];
            let currentCursor: string | number | null = null;
            let pageCount = 0;
            const maxPages = 20; // Máximo 2000 miembros para evitar loops infinitos

            do {
                // Construir URL con paginación
                let url = `${this.baseUrl}/members?limit=100`;
                if (currentCursor) {
                    url += `&after=${currentCursor}`;
                }

                const response = await fetch(url, {
                    method: 'GET',
                    headers: this.getHeaders(),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                const members = data.data || [];
                allMembers = allMembers.concat(members);
                pageCount++;

                // Verificar si hay más páginas (según la API de Memberstack v2)
                const hasMore = data.hasNextPage || false;
                currentCursor = hasMore && data.endCursor ? data.endCursor : null;

                console.log(`📄 Página ${pageCount}: ${members.length} miembros (total acumulado: ${allMembers.length})`);

            } while (currentCursor && pageCount < maxPages);

            console.log(`📊 Total miembros de Memberstack: ${allMembers.length}`);

            // Filtrar por plan pagado si se solicita
            let members = allMembers;
            if (options?.paidOnly) {
                members = members.filter((m: MemberstackMember) => {
                    const hasActivePlan = m.planConnections?.some((p: any) =>
                        p.status?.toLowerCase() === 'active' ||
                        p.status?.toLowerCase() === 'trialing'
                    );
                    return hasActivePlan;
                });
                console.log(`💳 Filtrados por plan pagado: ${members.length} miembros`);
            }

            if (status) {
                members = members.filter((m: MemberstackMember) =>
                    m.customFields?.['approval-status'] === status
                );
            }

            // 🆕 Guardar en caché
            membersCache.set(cacheKey, {
                data: members,
                timestamp: Date.now()
            });
            console.log(`💾 Caché actualizado para ${cacheKey} (${members.length} miembros)`);

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

            // 🆕 Invalidar caché después de actualizar
            this.invalidateCache();

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

    /**
     * Elimina un miembro definitivamente
     */
    async deleteMember(memberId: string): Promise<AdminApiResponse> {
        try {
            const url = `${this.baseUrl}/members/${memberId}`;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            // Invalidate cache
            this.invalidateCache();

            return { success: true };
        } catch (error: any) {
            console.error('Error eliminando miembro:', error);
            return { success: false, error: error.message };
        }
    }
}

// Exportar instancia singleton
export const memberstackAdmin = new MemberstackAdminClient();

// Funciones helper para usar en Server Actions
export async function listPendingMembers(paidOnly: boolean = true) {
    return await memberstackAdmin.listMembers('pending', { paidOnly });
}

export async function listAppealedMembers(paidOnly: boolean = true) {
    return await memberstackAdmin.listMembers('appealed', { paidOnly });
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

export async function deleteMemberAccount(memberId: string) {
    return await memberstackAdmin.deleteMember(memberId);
}
