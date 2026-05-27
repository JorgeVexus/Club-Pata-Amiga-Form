export function buildInfoRequestUploadUrl(params: {
    baseUrl?: string | null;
    memberId: string;
    petIndex: number;
    petId?: string | null;
    requestTypes: string[];
    logId?: string | null;
    token: string;
    exp: number;
}): string;

