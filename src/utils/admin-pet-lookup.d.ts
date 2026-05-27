export type AdminPetLookupAttempt =
    | { type: 'id'; value: string }
    | { type: 'slot'; value: number }
    | { type: 'name'; value: string };

export function isUuid(value: unknown): value is string;
export function normalizeMemberstackSlot(value: unknown): number | null;
export function buildAdminPetLookupAttempts(input?: {
    petId?: unknown;
    memberstackSlot?: unknown;
    petName?: unknown;
}): AdminPetLookupAttempt[];
