export const VALID_CANCELLATION_REASONS: string[];

export function normalizeCancellationRequest(input: {
    reason?: unknown;
    reasonOtherText?: unknown;
    comments?: unknown;
}): {
    reason: string;
    reasonOtherText: string | null;
    comments: string | null;
};

export function calculateDaysRemaining(periodEndDate: Date, nowDate?: Date): number;

export function formatDateForStorage(date: Date): string;
