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

export function getAvailablePetSlot(
    customFields?: Record<string, any>,
    maxPets?: number,
): number | null;

export function isFalseLike(value: unknown): boolean;
