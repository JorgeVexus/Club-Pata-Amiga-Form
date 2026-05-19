export const MAX_PETS: number;

export function enrichPetsWithLifecycle<T extends Record<string, any>>(
    pets?: T[],
    customFields?: Record<string, any>,
    unsubscriptions?: Record<string, any>[],
): Array<T & {
    memberstack_slot: number;
    is_active: boolean;
    unsubscribed_reason: string | null;
    unsubscribed_description: string | null;
    unsubscribed_at: string | null;
}>;

export function getActivePetCount(pets?: Array<{ is_active?: boolean }>): number;

export function getEffectiveActivePetCount(
    customFields?: Record<string, unknown>,
    pets?: Array<{ is_active?: boolean }>,
    maxPets?: number,
): number;

export function getRegistrationActivePetCount(
    pets?: Array<{ is_active?: boolean }>,
    legacyActiveSlotCount?: number | null,
): number;

export function getAvailablePetSlot(
    customFields?: Record<string, unknown>,
    maxPets?: number,
): number | null;

export function isFalseLike(value: unknown): boolean;

export function isUnsubscribedPet(pet?: {
    is_active?: boolean;
    status?: string;
}): boolean;

export function isUnsubscribedPetWithHistory(
    pet?: Record<string, unknown>,
    unsubscriptions?: Record<string, unknown>[],
): boolean;
