export function shouldPreserveApprovedPetStatusDuringInfoRequest(pet?: {
    status?: string | null;
    waiting_period_start?: string | null;
    waiting_period_end?: string | null;
}): boolean;

export function buildInfoRequestPetUpdate(
    pet: {
        status?: string | null;
        waiting_period_start?: string | null;
        waiting_period_end?: string | null;
    },
    requestMessage: string,
): Record<string, string>;

export function buildFulfillRequestPetUpdate(
    pet: {
        status?: string | null;
        waiting_period_start?: string | null;
        waiting_period_end?: string | null;
    },
    petField: string,
    fileUrl: string,
): Record<string, string>;

